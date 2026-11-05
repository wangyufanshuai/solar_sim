"""Exact semidiscrete lapse-reduction identity for the bound tau=0 shadow.

This is a diagnostic, not a modified RHS or an unconditional invariance proof.
FD product/inverse-chain defects are retained, never replaced by continuum
product rules. Conventions: s=c=1, advective 1+log, constant K0, tau_inverse=0.
"""
from __future__ import annotations

import numpy as np

from .fo_ccz4_checkpoint import SYMMETRIC
from .fo_ccz4_trace_source_window import d1, require

PART_NAMES = ("curl_transport", "shift_reduction", "shift_product_defect",
              "geometric_trace_source", "inverse_chain_defect",
              "trace_product_defect", "metric_reduction")


def rhs_slots(rhs):
    """All 58 time derivatives; these are NOT valid state checkpoints."""
    return tuple([*[rhs.h[..., i, j] for i, j in SYMMETRIC], rhs.ln_lapse,
                  *[rhs.shift[..., i] for i in range(3)], rhs.ln_phi,
                  *[rhs.a[..., i, j] for i, j in SYMMETRIC], rhs.trace_k, rhs.theta,
                  *[rhs.conformal_gamma[..., i] for i in range(3)],
                  *[rhs.b[..., i] for i in range(3)],
                  *[rhs.lapse_gradient[..., i] for i in range(3)],
                  *[rhs.shift_gradient[..., i, j] for i in range(3) for j in range(3)],
                  *[rhs.metric_gradient[..., k, i, j] for k in range(3) for i, j in SYMMETRIC],
                  *[rhs.conformal_factor_gradient[..., i] for i in range(3)]])


def symmetric(slots, offset):
    result = np.empty((*slots[0].shape, 3, 3))
    for k, (i, j) in enumerate(SYMMETRIC):
        result[..., i, j] = result[..., j, i] = slots[offset+k]
    return result


def contract(a, b):
    return np.einsum("...ij,...ij->...", a, b)


def balance_fields(data, rhs):
    q, order = data.slots, data.header["spatial_order"]
    require(data.header["solver_mode"] == 1, "dynamic state required")
    require(len(rhs) == 58 and all(x.shape == q[0].shape and np.all(np.isfinite(x)) for x in rhs),
            "all 58 finite RHS slots required")
    h, a = symmetric(q, 0), symmetric(q, 11)
    hi = np.linalg.inv(h)
    raised_a = hi @ a @ hi
    tr = contract(hi, a)
    beta, aux_a = np.stack(q[7:10], axis=-1), np.stack(q[25:28], axis=-1)
    aux_b = np.stack(q[28:37], axis=-1).reshape((*q[0].shape, 3, 3))
    aux_d = np.stack([symmetric(q, 37+6*k) for k in range(3)], axis=-3)
    dh, dhi, da = ([d1(v, k, order) for k in range(3)] for v in (h, hi, a))
    dbeta, daux_a = ([d1(v, k, order) for k in range(3)] for v in (beta, aux_a))
    parts = {name: np.zeros((3, *q[0].shape)) for name in PART_NAMES}
    trace_gradient_fo = []
    beta_dot_aux = np.sum(beta*aux_a, axis=-1)
    for i in range(3):
        parts["curl_transport"][i] = sum(beta[..., k]*(daux_a[k][..., i]-daux_a[i][..., k]) for k in range(3))
        parts["shift_reduction"][i] = np.sum((aux_b[..., i, :]-dbeta[i])*aux_a, axis=-1)
        parts["shift_product_defect"][i] = -(d1(beta_dot_aux, i, order)
            - np.sum(dbeta[i]*aux_a + beta*daux_a[i], axis=-1))
        parts["geometric_trace_source"][i] = -2*d1(tr, i, order)
        parts["inverse_chain_defect"][i] = 2*contract(dhi[i] + hi @ dh[i] @ hi, a)
        parts["trace_product_defect"][i] = 2*(d1(tr, i, order)-contract(dhi[i], a)-contract(hi, da[i]))
        parts["metric_reduction"][i] = 4*contract(aux_d[..., i, :, :]-.5*dh[i], raised_a)
        trace_gradient_fo.append(contract(hi, da[i])-2*contract(aux_d[..., i, :, :], raised_a))
    measured = np.stack([rhs[25+i]-d1(rhs[6], i, order) for i in range(3)])
    predicted = sum(parts.values())
    trace_rate = contract(hi, symmetric(rhs, 11)) - contract(raised_a, symmetric(rhs, 0))
    # Exact instantaneous geometric-trace balance for tau=0, with independent D.
    trace_prediction = (sum(beta[..., i]*trace_gradient_fo[i] for i in range(3))
                        + np.exp(q[6])*(q[17]-2*q[18]-2*tr/3.)*tr)
    return {"measured": measured, "predicted": predicted, "parts": parts,
            "trace": tr, "trace_rate": trace_rate, "trace_prediction": trace_prediction}


def summarize(data, rhs):
    f = balance_fields(data, rhs)

    def peak(q):
        return float(np.max(abs(q)))

    bounds = {"lapse_balance": 2.e-12, "trace_balance": 2.e-12}
    errors = {"lapse_balance": peak(f["measured"]-f["predicted"]),
              "trace_balance": peak(f["trace_rate"]-f["trace_prediction"])}
    return {"parts_l_inf": {name: peak(value) for name, value in f["parts"].items()},
            "measured_lapse_rate_l_inf": peak(f["measured"]),
            "geometric_trace_l_inf": peak(f["trace"]),
            "geometric_trace_rate_l_inf": peak(f["trace_rate"]),
            "balance_max_abs_errors": errors, "bounds": bounds,
            "identity_passed": all(errors[k] <= bounds[k] for k in bounds),
            "continuum_conditional_null_not_full_constraint_proof": True,
            "physical_validation": False, "runtime_writeback": False}

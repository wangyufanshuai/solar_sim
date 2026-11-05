"""Explicit three-constraint state map, default OFF and disconnected from RHS.

h is determinant-normalized; a and each independent D_k have their h'-trace
removed. All other slots are preserved, including ln(phi) and K. Consequently
this changes physical g_ij/K_ij: it is NOT a conformal reparameterization,
Einstein constraint solve, auxiliary reconstruction or validated RK policy.
"""
from __future__ import annotations

import numpy as np

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER

PAIRS = tuple((i, j) for i in range(3) for j in range(i, 3))
H_SLOTS = tuple(FOCCZ4_VARIABLE_ORDER.index(f"h{i}{j}") for i, j in PAIRS)
A_SLOTS = tuple(FOCCZ4_VARIABLE_ORDER.index(f"A{i}{j}") for i, j in PAIRS)
D_SLOTS = tuple(tuple(FOCCZ4_VARIABLE_ORDER.index(f"D{k}{i}{j}") for i, j in PAIRS) for k in range(3))
CHANGED_SLOTS = (*H_SLOTS, *A_SLOTS, *(i for group in D_SLOTS for i in group))
PRESERVED_SLOTS = tuple(i for i in range(58) if i not in CHANGED_SLOTS)
CONDITION_CAP = 1.e8
ALGEBRAIC_TOLERANCE = 2.e-12


def require(condition, message):
    if not condition:
        raise ValueError(message)


def canonical(values):
    q = np.asarray(values)
    require(q.ndim >= 1 and q.shape[0] == 58 and q.size > 0
            and q.dtype == np.float64 and np.all(np.isfinite(q)),
            "nonempty finite FP64 canonical58 values required")
    return q


def tensor(q, slots):
    out = np.empty((*q.shape[1:], 3, 3), dtype=np.float64)
    for slot, (i, j) in zip(slots, PAIRS, strict=True):
        out[..., i, j] = out[..., j, i] = q[slot]
    return out


def geometry(values):
    """Validate point/batch metrics without silently normalizing anything."""
    q = canonical(values)
    h, a = tensor(q, H_SLOTS), tensor(q, A_SLOTS)
    d = np.stack([tensor(q, group) for group in D_SLOTS], axis=-3)
    eigenvalues = np.linalg.eigvalsh(h)
    require(np.all(eigenvalues > 0.), "positive definite conformal metric required")
    with np.errstate(over="raise", under="raise", invalid="raise", divide="raise"):
        try:
            condition = eigenvalues[..., -1]/eigenvalues[..., 0]
            require(np.all(condition <= CONDITION_CAP), "metric condition exceeds component contract")
            sign, logdet = np.linalg.slogdet(h)
            require(np.all(sign == 1.) and np.all(np.isfinite(logdet)), "finite positive determinant required")
            determinant = np.exp(logdet)
            inverse = np.linalg.inv(h)
            lapse, chi = np.exp(q[6]), np.exp(2.*q[10])
            metric = h/chi[..., None, None]
            extrinsic = (a+h*(q[17]/3.)[..., None, None])/chi[..., None, None]
        except (FloatingPointError, np.linalg.LinAlgError) as error:
            raise ValueError("unrepresentable metric, lapse or conformal factor") from error
    require(all(np.all(np.isfinite(x)) for x in (determinant, inverse, lapse, chi, metric, extrinsic))
            and np.all(lapse > 0.) and np.all(chi > 0.), "finite positive physical fields required")
    return dict(h=h, a=a, d=d, inverse=inverse, logdet=logdet, determinant=determinant,
                condition=condition, metric=metric, extrinsic=extrinsic, chi=chi)


def algebraic_fields(values):
    """Trailing tensor axes; D trace has one trailing spatial-vector index."""
    g = geometry(values)
    with np.errstate(over="raise", invalid="raise"):
        result = dict(det_h=g["determinant"]-1.,
                      trace_a=np.einsum("...ij,...ij->...", g["inverse"], g["a"]),
                      trace_D=np.einsum("...ij,...kij->...k", g["inverse"], g["d"]))
    require(all(np.all(np.isfinite(x)) for x in result.values()), "nonfinite algebraic residual")
    return result


def algebraic_errors(values):
    """Roundoff checks, NOT physical norms: traces use absolute-term scales."""
    g = geometry(values)
    fields = algebraic_fields(values)
    a_scale = np.maximum(1., np.einsum("...ij,...ij->...", abs(g["inverse"]), abs(g["a"])))
    d_scale = np.maximum(1., np.einsum("...ij,...kij->...k", abs(g["inverse"]), abs(g["d"])))
    return dict(det_h=float(np.max(abs(fields["det_h"]))),
                trace_a=float(np.max(abs(fields["trace_a"])/a_scale)),
                trace_D=float(np.max(abs(fields["trace_D"])/d_scale)))


def project_algebraic_slots(values, *, enabled=False):
    """Pure copying map. Explicit True is required; no driver calls this API.

    SPD/representation checks also apply in disabled mode. No thresholds decide
    whether to project, no iterative repairs, and no input array is mutated.
    This API promises algebraic formulas, not an admissible restart state.
    """
    require(type(enabled) is bool, "enabled must be an explicit boolean")
    q = canonical(values)
    g = geometry(q)
    result = np.array(q, dtype=np.float64, order="C", copy=True)
    if not enabled:
        return result
    try:
        with np.errstate(over="raise", under="raise", invalid="raise", divide="raise"):
            h = g["h"]*np.exp(-g["logdet"]/3.)[..., None, None]
            inverse = np.linalg.inv(h)
            trace_a = np.einsum("...ij,...ij->...", inverse, g["a"])
            a = g["a"]-h*(trace_a/3.)[..., None, None]
            trace_d = np.einsum("...ij,...kij->...k", inverse, g["d"])
            d = g["d"]-h[..., None, :, :]*(trace_d/3.)[..., :, None, None]
    except (FloatingPointError, np.linalg.LinAlgError) as error:
        raise ValueError("unrepresentable algebraic projection") from error
    for offset, (i, j) in enumerate(PAIRS):
        result[H_SLOTS[offset]] = h[..., i, j]
        result[A_SLOTS[offset]] = a[..., i, j]
        for k in range(3):
            result[D_SLOTS[k][offset]] = d[..., k, i, j]
    geometry(result)  # Fail closed; never return an invalid partial correction.
    require(max(algebraic_errors(result).values()) <= ALGEBRAIC_TOLERANCE,
            "algebraic projection roundoff contract failed")
    require(result[list(PRESERVED_SLOTS)].tobytes() == q[list(PRESERVED_SLOTS)].tobytes(),
            "projection changed a preserved field")
    return result


def correction_fields(before, after):
    """Actual physical changes, including nonzero off-constraint trace(a).

    For fixed chi/K, delta g=delta h/chi and
    delta K_ij=(delta a+K delta h/3)/chi. These are measured, not assumed zero.
    """
    q, p = canonical(before), canonical(after)
    require(q.shape == p.shape, "matching canonical shapes required")
    g, gp = geometry(q), geometry(p)
    tr = np.einsum("...ij,...ij->...", g["inverse"], g["a"])+q[17]
    trp = np.einsum("...ij,...ij->...", gp["inverse"], gp["a"])+p[17]
    with np.errstate(over="raise", invalid="raise"):
        fields = dict(slot_correction=np.moveaxis(p-q, 0, -1),
                      physical_metric_correction=gp["metric"]-g["metric"],
                      physical_extrinsic_correction=gp["extrinsic"]-g["extrinsic"],
                      physical_trace_K_correction=trp-tr)
    require(all(np.all(np.isfinite(x)) for x in fields.values()), "nonfinite physical correction")
    return fields


def identity(*, enabled=False):
    require(type(enabled) is bool, "enabled must be an explicit boolean")
    return dict(schema="nr-fo-three-algebraic-constraints-v1", enabled=enabled, default_enabled=False,
                mode="h-unit-determinant-a-D-trace-removal" if enabled else "none",
                variable_order=list(FOCCZ4_VARIABLE_ORDER), changed_slots=list(CHANGED_SLOTS) if enabled else [],
                preserved_slots=list(PRESERVED_SLOTS) if enabled else list(range(58)),
                condition_cap=CONDITION_CAP, algebraic_tolerance=ALGEBRAIC_TOLERANCE,
                application="explicit standalone map; no RK policy",
                auxiliary_reconstruction=False, physical_reparameterization=False,
                einstein_constraint_solve=False, evolution_connected=False, restart_permitted=False,
                physical_validation=False, runtime_writeback=False, scientificPayloadWriteback=False)

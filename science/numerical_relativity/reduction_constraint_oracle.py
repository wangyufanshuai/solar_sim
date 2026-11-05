"""Independent continuum reduction-defect balances for the fixed FO profile.

Derives defect rates by product rules from Dumbser et al. (2018), Eq.12.
No solver imports, geometry, derivative stencil or time integration. This
checks 11 metric/gauge and 33 auxiliary channels plus two algebraic rates;
it is not an off-constraint oracle for the remaining 14 Einstein channels.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import math

import numpy as np

PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
METHOD = "nr-continuum-reduction-balance-v1"
TOLERANCE = 2.0e-12


def frozen(value):
    result = np.array(value, dtype=float, copy=True)
    result.setflags(write=False)
    return result


def contract(a, b):
    return np.einsum("...ij,...ij->...", a, b)


def sym(q, offset):
    result = np.empty((*q.shape[1:], 3, 3))
    for index, (i, j) in enumerate(PAIRS):
        result[..., i, j] = result[..., j, i] = q[offset + index]
    return result


def unpack(q):
    return dict(
        h=sym(q, 0),
        L=q[6],
        beta=np.moveaxis(q[7:10], 0, -1),
        ell=q[10],
        a=sym(q, 11),
        K=q[17],
        theta=q[18],
        b=np.moveaxis(q[22:25], 0, -1),
        A=np.moveaxis(q[25:28], 0, -1),
        B=np.moveaxis(q[28:37], 0, -1).reshape((*q.shape[1:], 3, 3)),
        D=np.stack([sym(q, 37 + 6 * k) for k in range(3)], axis=-3),
        P=np.moveaxis(q[55:58], 0, -1),
    )


def pack_base(h, L, beta, ell):
    return np.array(
        [*[h[..., i, j] for i, j in PAIRS], L, *[beta[..., i] for i in range(3)], ell]
    )


def pack_aux(A, B, D, P):
    return np.array(
        [
            *[A[..., i] for i in range(3)],
            *[B[..., i, j] for i in range(3) for j in range(3)],
            *[D[..., k, i, j] for k in range(3) for i, j in PAIRS],
            *[P[..., i] for i in range(3)],
        ]
    )


def gradient_aux(dbase):
    """Definition-map gradient: dL, d(beta), half d(h), d(lnphi)."""
    return np.array(
        [
            *[dbase[i, 6] for i in range(3)],
            *[dbase[i, 7 + j] for i in range(3) for j in range(3)],
            *[0.5 * dbase[k, j] for k in range(3) for j in range(6)],
            *[dbase[i, 10] for i in range(3)],
        ]
    )


@dataclass(frozen=True)
class CanonicalJet:
    slots: np.ndarray
    slot_gradients: np.ndarray

    def __post_init__(self):
        q, dq = np.asarray(self.slots), np.asarray(self.slot_gradients)
        if (
            q.ndim < 1
            or q.shape[0] != 58
            or q.size == 0
            or dq.shape != (3, *q.shape)
            or any(
                x.dtype.kind not in "fiu" or not np.all(np.isfinite(x)) for x in (q, dq)
            )
        ):
            raise ValueError(
                "finite real canonical58 jet with three matching gradients required"
            )
        if (
            np.any(np.linalg.eigvalsh(sym(q, 0)) <= 0.0)
            or np.any(q[6] >= math.log(2.0))
            or np.any(q[6] < -20.0)
            or np.any(np.abs(q[10]) > 20.0)
        ):
            raise ValueError(
                "SPD metric and bounded positive lapse/conformal factor required"
            )
        object.__setattr__(self, "slots", frozen(q))
        object.__setattr__(self, "slot_gradients", frozen(dq))


@dataclass(frozen=True)
class ReductionPrediction:
    base_rates: np.ndarray
    base_gradients: np.ndarray
    defects: np.ndarray
    defect_rates: np.ndarray
    auxiliary_rates: np.ndarray
    logdet_rate: np.ndarray
    trace_rate: np.ndarray
    determinant_error: np.ndarray
    trace: np.ndarray
    trace_gradient: np.ndarray
    metric_relaxation_term: np.ndarray
    metric_trace_term: np.ndarray
    variable_gauge_term: np.ndarray
    ordering_term: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite balance prediction required")
            object.__setattr__(self, item.name, frozen(value))


def evaluate(jet, *, tau_inverse=1.0):
    if not isinstance(jet, CanonicalJet):
        raise ValueError("validated canonical jet required")
    if (
        type(tau_inverse) not in (int, float)
        or not math.isfinite(tau_inverse)
        or tau_inverse < 0.0
    ):
        raise ValueError("finite nonnegative relaxation rate required")
    v = unpack(jet.slots)
    d = [unpack(row) for row in jet.slot_gradients]
    h, a, beta, b, A, B, D, P = [
        v[key] for key in ("h", "a", "beta", "b", "A", "B", "D", "P")
    ]
    alpha, chi = np.exp(v["L"]), np.exp(2 * v["ell"])
    inv, determinant = np.linalg.inv(h), np.linalg.det(h)
    tr, div = contract(inv, a), np.trace(B, axis1=-2, axis2=-1)
    raised = inv @ a @ inv
    tf = a - h * tr[..., None, None] / 3.0
    dc = [contract(inv, row["a"]) - contract(raised, row["h"]) for row in d]
    defects = jet.slots[25:] - gradient_aux(jet.slot_gradients[:, :11])
    r = unpack(np.concatenate((np.zeros_like(jet.slots[:25]), defects)))
    T = [dc[k] - 2 * contract(raised, r["D"][..., k, :, :]) for k in range(3)]
    f, mu = 3 * alpha * chi, 0.2 * chi
    hdot = (
        2 * np.einsum("...k,...kij->...ij", beta, D)
        + np.einsum("...ki,...jk->...ij", h, B)
        + np.einsum("...kj,...ik->...ij", h, B)
        - (2 / 3) * h * div[..., None, None]
        - 2 * alpha[..., None, None] * tf
        - tau_inverse * (determinant - 1)[..., None, None] * h
    )
    Ldot = np.einsum("...k,...k->...", beta, A) - 2 * (v["K"] - 2 * v["theta"])
    betadot = np.einsum("...k,...ki->...i", beta, B) + f[..., None] * b
    elldot = np.einsum("...k,...k->...", beta, P) + (alpha * v["K"] - div) / 3.0
    gradients = []
    relaxation, trace_term = np.empty_like(D), np.empty_like(D)
    for k, row in enumerate(d):
        dh, da, dbeta, dB = [row[key] for key in ("h", "a", "beta", "B")]
        ddiv = np.trace(dB, axis1=-2, axis2=-1)
        ddet = determinant * contract(inv, dh)
        relaxation[..., k, :, :] = (
            tau_inverse
            / 2
            * (ddet[..., None, None] * h + (determinant - 1)[..., None, None] * dh)
        )
        trace_term[..., k, :, :] = (
            -alpha[..., None, None] * tr[..., None, None] * dh / 3.0
        )
        dhdot = (
            2 * np.einsum("...l,...lij->...ij", dbeta, D)
            + 2 * np.einsum("...l,...lij->...ij", beta, row["D"])
            + np.einsum("...li,...jl->...ij", dh, B)
            + np.einsum("...li,...jl->...ij", h, dB)
            + np.einsum("...lj,...il->...ij", dh, B)
            + np.einsum("...lj,...il->...ij", h, dB)
            - (2 / 3) * (dh * div[..., None, None] + h * ddiv[..., None, None])
            - 2
            * alpha[..., None, None]
            * (
                row["L"][..., None, None] * tf
                + da
                - dh * tr[..., None, None] / 3.0
                - h * dc[k][..., None, None] / 3.0
            )
            - 2 * relaxation[..., k, :, :]
        )
        dLdot = (
            np.einsum("...i,...i->...", dbeta, A)
            + np.einsum("...i,...i->...", beta, row["A"])
            - 2 * row["K"]
            + 4 * row["theta"]
        )
        dbetadot = (
            np.einsum("...l,...li->...i", dbeta, B)
            + np.einsum("...l,...li->...i", beta, dB)
            + f[..., None] * ((row["L"] + 2 * row["ell"])[..., None] * b + row["b"])
        )
        delldot = (
            np.einsum("...l,...l->...", dbeta, P)
            + np.einsum("...l,...l->...", beta, row["P"])
            + (alpha * (row["L"] * v["K"] + row["K"]) - ddiv) / 3.0
        )
        gradients.append(pack_base(dhdot, dLdot, dbetadot, delldot))
    gradients = np.stack(gradients)

    # Curl indices are (first derivative, second derivative, remaining tensor).
    def curlA(i, k):
        return d[i]["A"][..., k] - d[k]["A"][..., i]

    def curlP(i, k):
        return d[i]["P"][..., k] - d[k]["P"][..., i]

    def curlB(i, k):
        return d[i]["B"][..., k, :] - d[k]["B"][..., i, :]

    def curlD(i, k):
        return d[i]["D"][..., k, :, :] - d[k]["D"][..., i, :, :]

    Adot, Bdot, Ddot, Pdot = [np.empty_like(v[key]) for key in ("A", "B", "D", "P")]
    variable, ordering = np.empty_like(B), np.empty_like(B)
    for k in range(3):
        rB = r["B"][..., k, :]
        Adot[..., k] = (
            sum(beta[..., ell] * curlA(ell, k) for ell in range(3))
            + np.sum(rB * A, axis=-1)
            - 2 * T[k]
        )
        curlBtrace = sum(curlB(k, ell)[..., ell] for ell in range(3))
        Pdot[..., k] = (
            sum(beta[..., ell] * curlP(ell, k) for ell in range(3))
            + np.sum(rB * P, axis=-1)
            + alpha / 3 * (v["K"] * r["A"][..., k] + T[k])
            + curlBtrace / 6
        )
        variable[..., k, :] = (
            f[..., None] * (r["A"][..., k] + 2 * r["P"][..., k])[..., None] * b
        )
        raw_curl = np.stack(
            [
                curlP(k, m)
                - sum(
                    np.einsum(
                        "...n,...n->...", inv[..., :, ell], curlD(k, ell)[..., m, :]
                    )
                    for ell in range(3)
                )
                for m in range(3)
            ],
            axis=-1,
        )
        ordering[..., k, :] = (alpha**2 * mu)[..., None] * np.einsum(
            "...im,...m->...i", inv, raw_curl
        )
        Bdot[..., k, :] = (
            sum(beta[..., ell, None] * curlB(ell, k) for ell in range(3))
            + np.einsum("...l,...li->...i", rB, B)
            + variable[..., k, :]
            + ordering[..., k, :]
        )
        rD = r["D"][..., k, :, :]
        value = (
            sum(beta[..., ell, None, None] * curlD(ell, k) for ell in range(3))
            + np.einsum("...l,...lij->...ij", rB, D)
            + np.einsum("...li,...jl->...ij", rD, B)
            + np.einsum("...lj,...il->...ij", rD, B)
            - (2 / 3) * div[..., None, None] * rD
            - alpha[..., None, None] * r["A"][..., k, None, None] * tf
            - (2 / 3)
            * alpha[..., None, None]
            * h
            * contract(raised, rD)[..., None, None]
            + trace_term[..., k, :, :]
            + relaxation[..., k, :, :]
            + h * curlBtrace[..., None, None] / 6
        )
        for i in range(3):
            for j in range(3):
                value[..., i, j] -= (
                    np.sum(h[..., :, i] * curlB(k, j), axis=-1)
                    + np.sum(h[..., :, j] * curlB(k, i), axis=-1)
                ) / 4
        Ddot[..., k, :, :] = value
    rates = pack_aux(Adot, Bdot, Ddot, Pdot)
    logdet_rate = 2 * sum(
        beta[..., k] * contract(inv, D[..., k, :, :]) for k in range(3)
    ) - 3 * tau_inverse * (determinant - 1)
    trace_rate = (
        sum(beta[..., k] * T[k] for k in range(3))
        + (
            alpha * (v["K"] - 2 * v["theta"] - 2 * tr / 3)
            + tau_inverse * (determinant - 4)
        )
        * tr
    )
    return ReductionPrediction(
        pack_base(hdot, Ldot, betadot, elldot),
        gradients,
        defects,
        rates,
        rates + gradient_aux(gradients),
        logdet_rate,
        trace_rate,
        determinant - 1,
        tr,
        np.array(dc),
        pack_aux(np.zeros_like(A), np.zeros_like(B), relaxation, np.zeros_like(P))[
            12:30
        ],
        pack_aux(np.zeros_like(A), np.zeros_like(B), trace_term, np.zeros_like(P))[
            12:30
        ],
        np.moveaxis(variable.reshape((*v["L"].shape, 9)), -1, 0),
        np.moveaxis(ordering.reshape((*v["L"].shape, 9)), -1, 0),
    )

"""Explicit off-definition Theta/Z forcing and assembled instantaneous43 rates.

No evolution, state repair or full subsidiary PDE closure is claimed. The Z
correction is derived from reduction/trace defects, not fitted or obtained by
subtracting two full RHS evaluations. The comparison path uses raw coordinate
time differentiation and the separately qualified pointwise FO reference.
"""

from __future__ import annotations

import numpy as np
from . import offsurface_physical_feedback as P
from .spatial_taylor3 import Jet, einsum as e, stack

C, R, G = P.C, P.R, P.G
METHOD = "nr-offsurface-theta-z-feedback-v1"
TOLERANCE = P.TOLERANCE
FALSE_FLAGS = P.FALSE_FLAGS
CASES = P.CASES + tuple((m, p) for m in range(3) for p in ("nonunit", "nonunit-mixed"))
TERM_NAMES = (
    "theta_formal_curvature",
    "theta_trace_defect",
    "theta_lapse_reduction",
    "z_trace_ordering",
    "z_auxiliary_trace_ordering",
    "z_shift_reduction",
    "z_connection_and_conformal_reduction",
    "z_lapse_reduction",
    "z_formal_covector",
    "z_metric_push",
    "z_connection_response",
)


def fixture(mode, pattern):
    if (mode, pattern) not in CASES:
        raise ValueError("registered Theta/Z fixture required")
    if (mode, pattern) in P.CASES:
        return P.fixture(mode, pattern)
    q = P.fixture(mode, "clean").c.copy()
    seed = C.fixture("curved", mode, 1, 0)
    for n, (i, j) in enumerate(R.PAIRS):
        q[:, n] = seed.gamma[i, j].c
        q[:, 11 + n] = seed.extrinsic[i, j].c
    # These fields are explicitly cubic polynomials, not unknown analytic jets.
    grad = Jet(q).gradient().c
    q[:, 25:] = 0.0
    for n in range(10):
        q[n, 25:] = R.gradient_aux(grad[n, :, :11])
    if pattern == "nonunit-mixed":
        q[:, 25:] += (
            P.fixture(mode, "mixed").c[:, 25:] - P.fixture(mode, "clean").c[:, 25:]
        )
    return Jet(q)


def contracted_variation(h, v):
    """D(h^jk Gamma^i_jk)[v], using covariant metric variation."""
    hi, conn, _ = C.geometry(h)
    raised = e("ij,jk->ik", e("ij,jk->ik", hi, v), hi)
    dv = v.gradient() - e("lsi,lj->sij", conn, v) - e("lsj,il->sij", conn, v)
    lower = 0.5 * (e("ilj->lij", dv) + e("jli->lij", dv) - dv)
    delta_conn = e("il,ljk->ijk", hi, lower)
    return -e("jk,ijk->i", raised, conn) + e("jk,ijk->i", hi, delta_conn)


def raw_contracted_variation(h, dh, v, dv):
    """Coordinate product rules; deliberately not the covariant routine."""
    hi = np.linalg.inv(h)
    hid = -hi @ v @ hi

    def lower(d):
        return 0.5 * (d.transpose(1, 0, 2) + d.transpose(1, 2, 0) - d)

    lo, lod = lower(dh), lower(dv)
    conn = np.einsum("il,ljk->ijk", hi, lo)
    dot = np.einsum("il,ljk->ijk", hid, lo) + np.einsum("il,ljk->ijk", hi, lod)
    return np.einsum("jk,ijk->i", hid, conn) + np.einsum("jk,ijk->i", hi, dot)


def formal_curvature_z(q, s, h):
    """Formal two-jet geometry, not the true derivatives of the sampled metric."""
    D = stack(P.sym(q, 37 + 6 * i) for i in range(3))
    p = q[55:58]
    dh, dD, dp = 2 * D, D.gradient(), p.gradient()
    ddh = dD + e("tsij->stij", dD)
    ddell = 0.5 * (dp + e("ji->ij", dp))
    factor = P.exp(-2 * q[10])
    dg = factor * (dh - 2 * e("s,ij->sij", p, h))
    ddg = factor * (
        ddh
        - 2 * e("s,tij->stij", p, dh)
        - 2 * e("t,sij->stij", p, dh)
        + e("st,ij->stij", 4 * e("s,t->st", p, p) - 2 * ddell, h)
    )
    hi, dhi, ch, dch, _ = P.formal_geometry(h, dh, ddh)
    _, _, cg, _, ricci = P.formal_geometry(s.gamma, dg, ddg)
    con = e("jk,ijk->i", hi, ch)
    dcon = e("sjk,ijk->si", dhi, ch) + e("jk,sijk->si", hi, dch)
    z = 0.5 * e("ij,j->i", h, q[19:22] - con)
    dz = 0.5 * (
        e("sij,j->si", dh, q[19:22] - con)
        + e("ij,sj->si", h, q[19:22].gradient() - dcon)
    )
    covdz = dz - e("kij,k->ij", cg, z)
    return ricci + covdz + e("ji->ij", covdz), z


def corrections(q):
    """Eleven explicit contributions, fixed tau=1,kappa1=.1,kappa2=0.

    c=tr_h(a) and rA/rB/rD/rP are genuine defects. In particular the GammaHat
    trace correction has coefficient10/3 on alpha*h^-1*dc, because both the
    FO ordering term and the physical trace conversion contribute.
    """
    s, h, a, _ = P.fields(q)
    hi, _, _ = C.geometry(h)
    gi, cg, ricci = C.geometry(s.gamma)
    alpha, beta, theta, K = s.alpha, s.beta, s.theta, q[17]
    A0, B0, D0, P0 = (
        q[6].gradient(),
        beta.gradient(),
        0.5 * h.gradient(),
        q[10].gradient(),
    )
    rA = q[25:28] - A0
    rB = stack(q[28 + 3 * i : 31 + 3 * i] for i in range(3)) - B0
    rD = stack(P.sym(q, 37 + 6 * i) for i in range(3)) - D0
    rP = q[55:58] - P0
    c = e("ij,ij->", hi, a)
    raised = e("ij,jk->ik", e("ij,jk->ik", hi, a), hi)
    conn_defect = e(
        "il,ljk->ijk",
        hi,
        e("ilj->lij", rD) + e("jli->lij", rD) - rD,
    )
    dz = -0.5 * e("ij,j->i", h, e("jk,ijk->i", hi, conn_defect))
    formal_rz, formal_z = formal_curvature_z(q, s, h)
    actual_dz = s.z.gradient() - e("kij,k->ij", cg, s.z)
    actual_rz = ricci + actual_dz + e("ji->ij", actual_dz)
    theta_terms = (
        0.5 * alpha * e("ij,ij->", gi, formal_rz - actual_rz),
        alpha * (-2 * K * c * (1 / 3) - 0.5 * c * c + theta * c),
        -alpha
        * (
            e("i,i->", e("ij,j->i", gi, dz), A0)
            + e("i,i->", e("ij,j->i", gi, s.z + dz), rA)
        ),
    )
    symdrB = 0.5 * (rB.gradient() + e("kli->lki", rB.gradient()))
    divrB = e("ii->", rB)
    gamma = q[19:22]
    gamma_terms = (
        (10 / 3) * alpha * e("ij,j->i", hi, c.gradient())
        - 2 * alpha * c * e("ij,j->i", hi, P0 + A0 * (1 / 3))
        + (2 / 3) * alpha * c * gamma,
        -4 * alpha * e("ij,j->i", hi, e("kij,ij->k", rD, raised)),
        e("kl,kli->i", hi, symdrB)
        + e("ik,kll->i", hi, symdrB) * (1 / 3)
        + (2 / 3) * gamma * divrB
        - e("k,ki->i", gamma, rB),
        2 * alpha * e("ijk,jk->i", conn_defect, raised)
        - 6 * alpha * e("ij,j->i", raised, rP),
        -2 * alpha * (theta * e("ij,j->i", hi, rA) + e("ij,j->i", raised, rA)),
        -2 * alpha * ((2 / 3) * K + 0.1) * e("ij,j->i", hi, dz),
    )
    delta_h = (
        2 * e("k,kij->ij", beta, rD)
        + e("ki,jk->ij", h, rB)
        + e("kj,ik->ij", h, rB)
        - (2 / 3) * h * divrB
        - (P.determinant(h) - 1) * h
    )
    z_terms = tuple(0.5 * e("ij,j->i", h, t) for t in gamma_terms) + (
        e("ij,j->i", delta_h, e("jk,k->j", hi, s.z)),
        -0.5 * e("ij,j->i", h, contracted_variation(h, delta_h)),
    )
    terms = np.array(
        [np.r_[t.value, np.zeros(3)] for t in theta_terms]
        + [np.r_[0.0, t.value] for t in z_terms]
    )
    hbase = (
        C.lie_covariant(beta, h)
        - (2 / 3) * h * e("ii->", B0)
        - 2 * alpha * (a - h * c * (1 / 3))
    )
    return terms, delta_h, hbase, np.stack((formal_z.value, (s.z + dz).value))


def compare(q):
    s, h, a, _ = P.fields(q)
    can = R.CanonicalJet(q.value, q.derivative(1))
    red, fo = R.evaluate(can), G.evaluate(can)
    hd, ad = R.sym(fo.rhs, 0), R.sym(fo.rhs, 11)
    dhd = np.stack([R.sym(red.base_gradients[i], 0) for i in range(3)])
    hi, conn, _ = C.geometry(h)
    contracted = e("jk,ijk->i", hi, conn).value
    raw_con = raw_contracted_variation(h.value, h.derivative(1), hd, dhd)
    direct_z4 = np.r_[
        fo.rhs[18],
        0.5 * hd @ (q.value[19:22] - contracted)
        + 0.5 * h.value @ (fo.rhs[19:22] - raw_con),
    ]
    vb, wb, extra, data, tb, zb = C.physical_rates(s)
    terms, delta_h, hbase, formal_z = corrections(q)
    total_h = hbase + delta_h
    baseline = np.r_[tb.value, zb.value]
    predicted_z4 = baseline + np.sum(terms, axis=0)
    v, w = P.physical_fo_rates(q)
    hmd = C.direct_variation(s.gamma, s.extrinsic, v, w)
    hmp = C.subsidiary(s, extra, data)[0] + P.covariant_variation(
        s.gamma, s.extrinsic, v - vb, w - wb
    )
    determinant = float(P.determinant(h).value)
    hv, av = hi.value, a.value
    algebraic_direct = np.array(
        [
            determinant * np.trace(hv @ hd),
            np.trace(hv @ ad - hv @ hd @ hv @ av),
        ]
    )
    algebraic_predicted = np.array([determinant * red.logdet_rate, red.trace_rate])
    rates = np.stack(
        (
            np.r_[
                hmd,
                direct_z4,
                fo.rhs[25:] - R.gradient_aux(red.base_gradients),
                algebraic_direct,
            ],
            np.r_[hmp, predicted_z4, red.defect_rates, algebraic_predicted],
        )
    )
    H, M, *_ = data
    values = np.r_[
        H.value,
        M.value,
        q.value[18],
        s.z.value,
        red.defects,
        determinant - 1,
        e("ij,ij->", hi, a).value,
    ]
    return dict(
        inputs=q.c,
        direct_z4=direct_z4,
        baseline_z4=baseline,
        predicted_z4=predicted_z4,
        correction_terms=terms,
        constraints43=values,
        rates43=rates,
        formal_z=formal_z,
        metric_bridge=np.stack(
            (
                np.concatenate((hd[None], dhd)),
                np.concatenate((total_h.value[None], total_h.derivative(1))),
            )
        ),
        connection_bridge=np.stack((raw_con, contracted_variation(h, total_h).value)),
    )


SHAPES = dict(
    inputs=(20, 58),
    direct_z4=(4,),
    baseline_z4=(4,),
    predicted_z4=(4,),
    correction_terms=(11, 4),
    constraints43=(43,),
    rates43=(2, 43),
    formal_z=(2, 3),
    metric_bridge=(2, 4, 3, 3),
    connection_bridge=(2, 3),
)


def metrics(arrays):
    if set(arrays) != set(SHAPES) or any(
        a.shape != SHAPES[k] or a.dtype != np.float64 or not np.isfinite(a).all()
        for k, a in arrays.items()
    ):
        raise ValueError("complete finite FP64 Theta/Z evidence required")
    return dict(
        z4_error=float(np.max(abs(arrays["direct_z4"] - arrays["predicted_z4"]))),
        rates43_error=float(np.max(abs(arrays["rates43"][0] - arrays["rates43"][1]))),
        bridge_error=float(
            max(
                np.max(abs(arrays[k][0] - arrays[k][1]))
                for k in ("formal_z", "metric_bridge", "connection_bridge")
            )
        ),
        omitted_feedback=float(
            np.max(abs(arrays["direct_z4"] - arrays["baseline_z4"]))
        ),
    )

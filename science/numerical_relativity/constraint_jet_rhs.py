"""Candidate closed constraint-jet RHS; no complete-state RHS or extraction.

Mixed spatial order is explicit: H/M need first derivatives; the other39
constraints need second derivatives. This is a diagnostic differential operator,
not a time integrator, first-order boundary reduction or well-posedness proof.
"""

from __future__ import annotations
from dataclasses import dataclass
from types import SimpleNamespace
import math
import numpy as np
from . import curved_constraint_propagation as C
from . import offsurface_physical_feedback as P
from .spatial_taylor3 import Jet, einsum as e, stack

METHOD = "nr-independent-constraint-jet-rhs-v1"
TOLERANCE = 2e-12
FALSE_FLAGS = C.FALSE_FLAGS


@dataclass(frozen=True)
class Background:
    fields: Jet

    def __post_init__(self):
        q = self.fields
        if not isinstance(q, Jet) or q.order != 3 or q.shape != (21,):
            raise ValueError("third-order21 coefficient fields required")
        if (
            np.min(np.linalg.eigvalsh(P.sym(q, 0).value)) <= 0
            or not -20 <= q.value[6] < math.log(2)
            or abs(q.value[10]) > 20
        ):
            raise ValueError("SPD metric and original positive-field bounds required")


@dataclass(frozen=True)
class Constraints:
    hm: Jet
    other: Jet

    def __post_init__(self):
        if (
            not isinstance(self.hm, Jet)
            or self.hm.order != 1
            or self.hm.shape != (4,)
            or not isinstance(self.other, Jet)
            or self.other.order != 2
            or self.other.shape != (39,)
        ):
            raise ValueError("first-order H/M4 and second-order other39 required")
        if self.other.value[37] <= -1:
            raise ValueError("determinant defect must exceed minus one")


def geometry_defect(g, first_change, second_change):
    """Exact formal two-jet geometry change, factored in its derivative defects."""
    u, conn, _ = C.geometry(g)
    dg = g.gradient()
    du = -e("im,kmj->kij", u, e("kmn,nj->kmj", dg, u))
    delta_du = -e("im,kmj->kij", u, e("kmn,nj->kmj", first_change, u))
    lo = 0.5 * (e("ilj->lij", dg) + e("jli->lij", dg) - dg)
    dlo = 0.5 * (
        e("ilj->lij", first_change) + e("jli->lij", first_change) - first_change
    )
    ddlo = 0.5 * (
        e("silj->slij", second_change) + e("sjli->slij", second_change) - second_change
    )
    delta_conn = e("kl,lij->kij", u, dlo)
    delta_dc = (
        e("skl,lij->skij", delta_du, lo)
        + e("skl,lij->skij", du, dlo)
        + e("skl,lij->skij", delta_du, dlo)
        + e("kl,slij->skij", u, ddlo)
    )
    delta_ricci = (
        e("kkij->ij", delta_dc)
        - e("jkik->ij", delta_dc)
        + e("kkl,lij->ij", delta_conn, conn)
        + e("kkl,lij->ij", conn, delta_conn)
        + e("kkl,lij->ij", delta_conn, delta_conn)
        - e("kjl,lik->ij", delta_conn, conn)
        - e("kjl,lik->ij", conn, delta_conn)
        - e("kjl,lik->ij", delta_conn, delta_conn)
    )
    return delta_conn, delta_dc, delta_ricci, delta_du


def contracted_variation(h, v):
    hi, conn, _ = C.geometry(h)
    raised = e("ij,jk->ik", e("ij,jk->ik", hi, v), hi)
    dv = v.gradient() - e("lsi,lj->sij", conn, v) - e("lsj,il->sij", conn, v)
    low = 0.5 * (e("ilj->lij", dv) + e("jli->lij", dv) - dv)
    return -e("jk,ijk->i", raised, conn) + e("jk,ijk->i", hi, e("il,ljk->ijk", hi, low))


def geometry_feedback(h, ell, z, rD, rP):
    hi, ch, _ = C.geometry(h)
    factor = P.exp(-2 * ell)
    g = factor * h
    _, cg, _ = C.geometry(g)
    dh, p, drD, drP = h.gradient(), ell.gradient(), rD.gradient(), rP.gradient()
    xh, yh = 2 * rD, drD + e("tsij->stij", drD)
    dc_h, ddc_h, _, delta_dhi = geometry_defect(h, xh, yh)
    xg = 2 * factor * (rD - e("s,ij->sij", rP, h))
    yg = factor * (
        yh
        - 4 * (e("s,tij->stij", p, rD) + e("t,sij->stij", p, rD))
        - 2 * (e("s,tij->stij", rP, dh) + e("t,sij->stij", rP, dh))
        - 4 * (e("s,tij->stij", rP, rD) + e("t,sij->stij", rP, rD))
        + e(
            "st,ij->stij",
            4 * (e("s,t->st", p, rP) + e("s,t->st", rP, p) + e("s,t->st", rP, rP))
            - drP
            - e("ts->st", drP),
            h,
        )
    )
    dc_g, _, dricci, _ = geometry_defect(g, xg, yg)
    contracted = e("jk,ijk->i", hi, dc_h)
    dcontracted = (
        e("sjk,ijk->si", delta_dhi, ch)
        + e("sjk,ijk->si", hi.gradient(), dc_h)
        + e("sjk,ijk->si", delta_dhi, dc_h)
        + e("jk,sijk->si", hi, ddc_h)
    )
    dz = -0.5 * e("ij,j->i", h, contracted)
    ddz = (
        e("sij,j->si", xh, e("jk,k->j", hi, z))
        - 0.5 * e("sij,j->si", dh + xh, contracted)
        - 0.5 * e("ij,sj->si", h, dcontracted)
    )
    dcovz = ddz - e("kij,k->ij", dc_g, z + dz) - e("kij,k->ij", cg, dz)
    rz = dricci + dcovz + e("ji->ij", dcovz)
    return rz, dz, dc_h, dc_g


def auxiliary_rates(q, h, a, alpha, chi, theta, c, d, rA, rB, rD, rP):
    """Closed reduction/ordering balances, all curls from constraint jets."""
    hi = h.inverse()
    raised = e("ij,jk->ik", e("ij,jk->ik", hi, a), hi)
    beta, driver, K = q[7:10], q[18:21], q[17]
    A, B, D, pp = (
        q[6].gradient() + rA,
        beta.gradient() + rB,
        0.5 * h.gradient() + rD,
        q[10].gradient() + rP,
    )
    trB = e("ii->", B)
    T = c.gradient() - 2 * e("kij,ij->k", rD, raised)
    grads = [r.gradient() for r in (rA, rB, rD, rP)]

    def curl(n, i, j):
        return grads[n][i, j] - grads[n][j, i]

    def total(values):
        values = tuple(values)
        out = values[0]
        for value in values[1:]:
            out = out + value
        return out

    ar, br, dr, pr = [], [], [], []
    for k in range(3):
        cb = sum(curl(1, k, idx)[idx] for idx in range(3))
        ar.append(
            sum(beta[idx] * curl(0, idx, k) for idx in range(3))
            + e("l,l->", rB[k], A)
            - 2 * T[k]
        )
        pr.append(
            sum(beta[idx] * curl(3, idx, k) for idx in range(3))
            + e("l,l->", rB[k], pp)
            + (alpha * (K * rA[k] + T[k])) * (1 / 3)
            + cb * (1 / 6)
        )
        ordering = stack(
            curl(3, k, m)
            - sum(e("n,n->", hi[:, idx], curl(2, k, idx)[m]) for idx in range(3))
            for m in range(3)
        )
        br.append(
            total(beta[idx] * curl(1, idx, k) for idx in range(3))
            + e("l,li->i", rB[k], B)
            + 3 * alpha * chi * (rA[k] + 2 * rP[k]) * driver
            + 0.2 * alpha * alpha * chi * e("ij,j->i", hi, ordering)
        )
        value = (
            total(beta[idx] * curl(2, idx, k) for idx in range(3))
            + e("l,lij->ij", rB[k], D)
            + e("li,jl->ij", rD[k], B)
            + e("lj,il->ij", rD[k], B)
            - (2 / 3) * trB * rD[k]
            - alpha * rA[k] * (a - h * c * (1 / 3))
            - (2 / 3) * alpha * h * e("ij,ij->", raised, rD[k])
            - alpha * c * h.gradient()[k] * (1 / 3)
            + 0.5 * (d.gradient()[k] * h + d * h.gradient()[k])
            + h * cb * (1 / 6)
        )
        matrix = stack(
            stack(
                (
                    e("l,l->", h[:, i], curl(1, k, j))
                    + e("l,l->", h[:, j], curl(1, k, i))
                )
                * (1 / 4)
                for j in range(3)
            )
            for i in range(3)
        )
        dr.append(value - matrix)
    pairs = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
    rates = stack(
        [
            *ar,
            *[br[k][i] for k in range(3) for i in range(3)],
            *[dr[k][i, j] for k in range(3) for i, j in pairs],
            *pr,
        ]
    )
    det_rate = (
        e("k,k->", beta, d.gradient())
        + 2 * (1 + d) * e("k,k->", beta, e("ij,kij->k", hi, rD))
        - 3 * (1 + d) * d
    )
    trace_rate = (
        e("k,k->", beta, T) + (alpha * (K - 2 * theta - (2 / 3) * c) + d - 3) * c
    )
    return rates.value, np.array([det_rate.value, trace_rate.value])


def evaluate(background, constraints):
    """Candidate variable-coefficient RHS on supplied independent constraints."""
    if not isinstance(background, Background) or not isinstance(
        constraints, Constraints
    ):
        raise ValueError("validated separate background/constraint inputs required")
    q, hm, t = background.fields, constraints.hm, constraints.other
    h, a = P.sym(q, 0), P.sym(q, 11)
    alpha, chi, factor = P.exp(q[6]), P.exp(2 * q[10]), P.exp(-2 * q[10])
    beta, K, theta, z, d, c = q[7:10], q[17], t[0], t[1:4], t[37], t[38]
    rA, rB, rD, rP = (
        t[4:7],
        stack(t[7 + 3 * i : 10 + 3 * i] for i in range(3)),
        stack(P.sym(t, 16 + 6 * i) for i in range(3)),
        t[34:37],
    )
    hi, ch, _ = C.geometry(h)
    g, k = factor * h, factor * (a + K * h * (1 / 3))
    gi, cg, ricci = C.geometry(g)
    mixed = e("ij,jk->ik", gi, k)
    trace = e("ii->", mixed)
    aup = e("ij,jk->ik", e("ij,jk->ik", hi, a), hi)
    A0, P0 = q[6].gradient(), q[10].gradient()
    rz, dz, conn_h, conn_g = geometry_feedback(h, q[10], z, rD, rP)
    dA = rA.gradient()
    hessian = alpha * (
        e("i,j->ij", A0, rA)
        + e("i,j->ij", rA, A0)
        + e("i,j->ij", rA, rA)
        + 0.5 * (dA + e("ji->ij", dA))
        - e("kij,k->ij", conn_g, A0 + rA)
        - e("kij,k->ij", cg, rA)
    )
    V = factor * (
        2 * e("k,kij->ij", beta, rD - e("k,ij->kij", rP, h))
        + e("ki,jk->ij", h, rB)
        + e("kj,ik->ij", h, rB)
        + ((2 / 3) * alpha * c - d) * h
    )
    B = a + K * h * (1 / 3)
    W = (
        -hessian
        + alpha * rz
        + factor
        * (
            e("ki,jk->ij", B, rB)
            + e("kj,ik->ij", B, rB)
            + (2 / 3) * K * e("s,sij->ij", beta, rD)
            - 2 * e("s,s->", beta, rP) * B
            - alpha * c * a
            - alpha * K * c * h * (1 / 9)
            - (c + K * d * (1 / 3)) * h
        )
    )
    covz = z.gradient() - e("kij,k->ij", cg, z)
    physical_extra = alpha * (
        covz + e("ji->ij", covz) - 2 * theta * k - 0.1 * theta * g
    )
    s = SimpleNamespace(alpha=alpha, beta=beta, theta=theta, z=z)
    data = (hm[0], hm[1:4], gi, cg, ricci, mixed, trace)
    hmr = C.subsidiary(s, physical_extra, data)[0] + P.covariant_variation(g, k, V, W)
    theta_base = (
        e("i,i->", beta, theta.gradient())
        + alpha * (0.5 * hm[0] + e("ij,ij->", gi, covz) - theta * trace)
        - e("i,i->", e("ij,j->i", gi, z), alpha.gradient())
        - 0.2 * alpha * theta
    )
    theta_correction = (
        0.5 * alpha * e("ij,ij->", gi, rz)
        + alpha * (-(2 / 3) * K * c - 0.5 * c * c + theta * c)
        - alpha
        * (
            e("i,i->", e("ij,j->i", gi, dz), A0)
            + e("i,i->", e("ij,j->i", gi, z + dz), rA)
        )
    )
    z_base = (
        C.lie_covariant(beta, z)
        + alpha * (hm[1:4] + theta.gradient() - 2 * e("ji,j->i", mixed, z) - 0.1 * z)
        - theta * alpha.gradient()
    )
    gammahat = e("jk,ijk->i", hi, ch) + 2 * e("ij,j->i", hi, z)
    dB = rB.gradient()
    symB = 0.5 * (dB + e("kli->lki", dB))
    divB = e("ii->", rB)
    gamma_forcing = (
        (10 / 3) * alpha * e("ij,j->i", hi, c.gradient())
        - 2 * alpha * c * e("ij,j->i", hi, P0 + A0 * (1 / 3))
        + (2 / 3) * alpha * c * gammahat
        - 4 * alpha * e("ij,j->i", hi, e("kij,ij->k", rD, aup))
        + e("kl,kli->i", hi, symB)
        + e("ik,kll->i", hi, symB) * (1 / 3)
        + (2 / 3) * gammahat * divB
        - e("k,ki->i", gammahat, rB)
        + 2 * alpha * e("ijk,jk->i", conn_h, aup)
        - 6 * alpha * e("ij,j->i", aup, rP)
        - 2 * alpha * (theta * e("ij,j->i", hi, rA) + e("ij,j->i", aup, rA))
        - 2 * alpha * ((2 / 3) * K + 0.1) * e("ij,j->i", hi, dz)
    )
    delta_h = (
        2 * e("k,kij->ij", beta, rD)
        + e("ki,jk->ij", h, rB)
        + e("kj,ik->ij", h, rB)
        - (2 / 3) * h * divB
        - d * h
    )
    z_correction = 0.5 * e(
        "ij,j->i", h, gamma_forcing - contracted_variation(h, delta_h)
    ) + e("ij,j->i", delta_h, e("jk,k->j", hi, z))
    aux, alg = auxiliary_rates(q, h, a, alpha, chi, theta, c, d, rA, rB, rD, rP)
    rates = np.r_[
        hmr,
        (theta_base + theta_correction).value,
        (z_base + z_correction).value,
        aux,
        alg,
    ]
    if rates.shape != (43,) or not np.isfinite(rates).all():
        raise ValueError("finite43 constraint rates required")
    return dict(
        rates=rates,
        metric=V.trim(2),
        extrinsic=W.trim(1),
        ricci_z=rz.trim(1),
        z_formal=dz.trim(2),
        hessian=hessian,
    )

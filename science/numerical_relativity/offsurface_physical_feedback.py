"""FO-to-physical H/M feedback, not a closed full subsidiary or boundary system.

Actual spatial derivatives and the independent formal FO derivatives coexist.
The covariant metric variation below never calls the raw-coordinate variation.
No state repair, solver import, integration or admission is performed.
"""

from __future__ import annotations

from types import SimpleNamespace
import math
import numpy as np

from . import curved_constraint_propagation as C
from . import formal_fo_geometry as G
from . import reduction_constraint_oracle as R
from .spatial_taylor3 import Jet, INDICES, einsum as e, stack

METHOD = "nr-offsurface-physical-feedback-v1"
TOLERANCE = C.TOLERANCE
FALSE_FLAGS = C.FALSE_FLAGS
PATTERNS = ("clean", *range(25, 58), *range(6), "trace", "mixed")
CASES = tuple((m, p) for m in range(3) for p in PATTERNS)


def exp(x):
    if x.shape:
        raise ValueError("scalar exponential required")
    delta = x - float(x.value)
    term = out = Jet.constant(1.0, x.order)
    for n in range(1, x.order + 1):
        term = term * delta * (1 / n)
        out = out + term
    return math.exp(float(x.value)) * out


def determinant(h):
    return (
        h[0, 0] * (h[1, 1] * h[2, 2] - h[1, 2] * h[2, 1])
        - h[0, 1] * (h[1, 0] * h[2, 2] - h[1, 2] * h[2, 0])
        + h[0, 2] * (h[1, 0] * h[2, 1] - h[1, 1] * h[2, 0])
    )


def sym(q, offset):
    return stack(
        stack(q[offset + R.PAIRS.index(tuple(sorted((i, j))))] for j in range(3))
        for i in range(3)
    )


def formal_geometry(g, dg, ddg):
    u = g.inverse()
    du = -e("im,kmj->kij", u, e("kmn,nj->kmj", dg, u))
    lo = 0.5 * (e("ilj->lij", dg) + e("jli->lij", dg) - dg)
    dlo = 0.5 * (e("silj->slij", ddg) + e("sjli->slij", ddg) - ddg)
    conn = e("kl,lij->kij", u, lo)
    dc = e("skl,lij->skij", du, lo) + e("kl,slij->skij", u, dlo)
    ricci = (
        e("kkij->ij", dc)
        - e("jkik->ij", dc)
        + e("kkl,lij->ij", conn, conn)
        - e("kjl,lik->ij", conn, conn)
    )
    return u, du, conn, dc, ricci


def fields(q):
    if not isinstance(q, Jet) or q.order != 3 or q.shape != (58,):
        raise ValueError("complete third-order canonical58 jet required")
    R.CanonicalJet(q.value, q.derivative(1))
    h, a = sym(q, 0), sym(q, 11)
    chi = exp(2 * q[10])
    g, k = exp(-2 * q[10]) * h, exp(-2 * q[10]) * (a + q[17] * h * (1 / 3))
    hi, conn, _ = C.geometry(h)
    # Actual metric derivative, not the formal 2D, defines physical Z here.
    z = 0.5 * e("ij,j->i", h, q[19:22] - e("jl,ijl->i", hi, conn))
    s = SimpleNamespace(
        gamma=g,
        extrinsic=k,
        alpha=exp(q[6]),
        beta=q[7:10],
        theta=q[18],
        z=z,
        driver=q[22:25],
    )
    return s, h, a, chi


def physical_fo_rates(q):
    """Taylor version of published Eq12a,d,e,f; fixed tau=1,kappa1=.1,kappa2=0.

    Only the14 conformal rates needed for gamma/K are implemented here. Full58
    point values/gradients from the qualified reference are separate controls.
    """
    s, h, a, chi = fields(q)
    alpha, beta, theta, K = s.alpha, s.beta, q[18], q[17]
    A, B, D, P = (
        q[25:28],
        stack(q[28 + 3 * i : 31 + 3 * i] for i in range(3)),
        stack(sym(q, 37 + 6 * i) for i in range(3)),
        q[55:58],
    )
    dh, dD, dP = 2 * D, D.gradient(), P.gradient()
    ddh = dD + e("tsij->stij", dD)
    ddell = 0.5 * (dP + e("ji->ij", dP))
    g = s.gamma
    dg = exp(-2 * q[10]) * (dh - 2 * e("s,ij->sij", P, h))
    ddg = exp(-2 * q[10]) * (
        ddh
        - 2 * e("s,tij->stij", P, dh)
        - 2 * e("t,sij->stij", P, dh)
        + e("st,ij->stij", 4 * e("s,t->st", P, P) - 2 * ddell, h)
    )
    hi, dhi, ch, dch, _ = formal_geometry(h, dh, ddh)
    _, _, cg, _, ricci = formal_geometry(g, dg, ddg)
    contracted = e("jl,ijl->i", hi, ch)
    dcontracted = e("sjl,ijl->si", dhi, ch) + e("jl,sijl->si", hi, dch)
    z = 0.5 * e("ij,j->i", h, q[19:22] - contracted)
    dz = 0.5 * (
        e("sij,j->si", dh, q[19:22] - contracted)
        + e("ij,sj->si", h, q[19:22].gradient() - dcontracted)
    )
    covdz = dz - e("kij,k->ij", cg, z)
    rz = ricci + covdz + e("ji->ij", covdz)
    dA = A.gradient()
    hess = alpha * (
        e("i,j->ij", A, A) + 0.5 * (dA + e("ji->ij", dA)) - e("kij,k->ij", cg, A)
    )
    tr, div = e("ij,ij->", hi, a), e("ii->", B)
    hd = (
        2 * e("k,kij->ij", beta, D)
        + e("ki,jk->ij", h, B)
        + e("kj,ik->ij", h, B)
        - (2 / 3) * h * div
        - 2 * alpha * (a - h * tr * (1 / 3))
        - (determinant(h) - 1) * h
    )
    elld = e("k,k->", beta, P) + (alpha * K - div) * (1 / 3)
    inner = -hess + alpha * rz
    ad = (
        chi * (inner - h * e("ij,ij->", hi, inner) * (1 / 3))
        + e("s,sij->ij", beta, a.gradient())
        + e("ki,jk->ij", a, B)
        + e("kj,ik->ij", a, B)
        - (2 / 3) * a * div
        + alpha * a * (K - 2 * theta)
        - 2 * alpha * e("il,lj->ij", e("ik,kl->il", a, hi), a)
        - h * tr
    )
    kd = (
        e("s,s->", beta, K.gradient())
        - chi * e("ij,ij->", hi, hess)
        + alpha * chi * e("ij,ij->", hi, rz)
        + alpha * K * (K - 2 * theta)
        - 0.3 * alpha * theta
    )
    v = exp(-2 * q[10]) * (hd - 2 * elld * h)
    w = exp(-2 * q[10]) * (
        ad + (kd * h + K * hd) * (1 / 3) - 2 * elld * (a + K * h * (1 / 3))
    )
    return v.trim(2), w.trim(1)


def covariant_variation(g, k, v, w):
    """Geometric first variation D(H,M)[v,w], separate from raw product rules."""
    inv, conn, ricci = C.geometry(g)
    covdv = v.gradient() - e("lsi,lj->sij", conn, v) - e("lsj,il->sij", conn, v)
    divv = e("sj,sij->i", inv, covdv)
    divdiv = e("si,si->", inv, divv.gradient() - e("lsi,l->si", conn, divv))
    trv = e("ij,ij->", inv, v)
    laptrace = e(
        "ij,ij->", inv, trv.gradient().gradient() - e("kij,k->ij", conn, trv.gradient())
    )
    upper_r = e("ij,jk->ik", e("ij,jk->ik", inv, ricci), inv)
    mixed = e("ij,jk->ik", inv, k)
    upper_k = e("ij,jk->ik", mixed, inv)
    trace = e("ii->", mixed)
    # Raising both K indices also varies; do not omit this quadratic metric term.
    hdot = (
        divdiv
        - laptrace
        - e("ij,ij->", upper_r, v)
        + 2 * e("ij,ij->", trace * inv - upper_k, w)
        + 2 * e("ij,ij->", e("ij,jk->ik", mixed, upper_k) - trace * upper_k, v)
    )
    delta_mixed = e("ij,jk->ik", inv, w - e("ij,jk->ik", v, mixed))
    lower = 0.5 * (e("ilj->lij", covdv) + e("jli->lij", covdv) - covdv)
    delta_conn = e("kl,lij->kij", inv, lower)
    mdot = (
        C.divergence_mixed(delta_mixed, conn)
        - e("ii->", delta_mixed).gradient()
        + e("jjl,li->i", delta_conn, mixed)
        - e("lji,jl->i", delta_conn, mixed)
    )
    return np.r_[hdot.value, mdot.value]


def fixture(mode, pattern):
    if (mode, pattern) not in CASES:
        raise ValueError("registered offsurface case required")
    x, y, z = (Jet.coordinate(v, i) for i, v in enumerate(C.POINTS[mode]))
    seed = C.fixture("curved", mode, 1, 0)
    h = Jet.constant(np.eye(3))
    L = -0.1 + 0.03 * x + 0.02 * y - 0.015 * z + 0.004 * x * x * y
    ell = -0.1 + 0.035 * x - 0.02 * y + 0.01 * z + 0.003 * x * y + 0.002 * x * y * z
    a = seed.extrinsic - Jet.constant(np.eye(3)) * e("ii->", seed.extrinsic) * (1 / 3)
    K = 0.07 + 0.012 * x - 0.009 * y + 0.008 * z * z
    zeros = [Jet.constant(0.0) for _ in range(58)]
    base = [
        *[h[i, j] for i, j in R.PAIRS],
        L,
        *[seed.beta[i] for i in range(3)],
        ell,
        *[a[i, j] for i, j in R.PAIRS],
        K,
        seed.theta,
        *[2 * seed.z[i] for i in range(3)],
        *[seed.driver[i] for i in range(3)],
    ]
    q = stack(base + zeros[25:]).c.copy()

    def set_polynomial_auxiliary():
        # These fixtures DEFINE globally cubic polynomials in q[:11]. Their
        # derivative polynomials have degree<=2, so their degree3 coefficients
        # are exactly zero. This is not padding an unknown analytic derivative.
        grad = Jet(q).gradient().c
        q[:, 25:] = 0.0
        for n in range(10):
            q[n, 25:] = R.gradient_aux(grad[n, :, :11])

    set_polynomial_auxiliary()
    noise = 0.013 * (
        1
        + 0.5 * x
        - 0.3 * y
        + 0.2 * z
        + 0.4 * x * y
        + 0.2 * y * z
        + 0.1 * x * x
        + 0.07 * x * y * z
    )
    if isinstance(pattern, int) and pattern < 6:
        q[:, pattern] += noise.c
        set_polynomial_auxiliary()
    elif isinstance(pattern, int):
        q[:, pattern] += ((-1) ** pattern) * noise.c
    elif pattern == "trace":
        for slot in (11, 14, 16):
            q[:, slot] += noise.c
    elif pattern == "mixed":
        q[:, 0] += noise.c
        q[:, 11] += noise.c
        for slot in range(25, 58):
            q[:, slot] += ((-1) ** slot) * noise.c
    return Jet(q)


def reference(q, derivative):
    """Physical values and first metric-rate gradient from qualified references."""
    can = R.CanonicalJet(q, derivative)
    fo, red = G.evaluate(can), R.evaluate(can)
    h, a, hd, ad = R.sym(q, 0), R.sym(q, 11), R.sym(fo.rhs, 0), R.sym(fo.rhs, 11)
    factor = np.exp(-2 * q[10])
    v = factor[..., None, None] * (hd - 2 * fo.rhs[10][..., None, None] * h)
    w = factor[..., None, None] * (
        ad
        + (fo.rhs[17][..., None, None] * h + q[17][..., None, None] * hd) / 3
        - 2 * fo.rhs[10][..., None, None] * (a + q[17][..., None, None] * h / 3)
    )
    dv = np.stack(
        [
            factor[..., None, None]
            * (
                R.sym(red.base_gradients[s], 0)
                - 2 * red.base_gradients[s, 10][..., None, None] * h
                - 2 * fo.rhs[10][..., None, None] * R.sym(derivative[s], 0)
            )
            - 2 * derivative[s, 10][..., None, None] * v
            for s in range(3)
        ],
        axis=-3,
    )
    return v, w, dv


def derivative_probe(q):
    """Fixed two-level centered/Richardson probe, not propagation derivatives."""
    v, w = physical_fo_rates(q)
    center = reference(q.value, q.derivative(1))
    errors = [
        max(
            np.max(abs(v.value - center[0])),
            np.max(abs(w.value - center[1])),
            np.max(abs(v.derivative(1) - center[2])),
        )
    ]
    differences = []
    grad = q.gradient()
    for step in (1 / 64, 1 / 128):
        offsets = np.concatenate((step * np.eye(3), -step * np.eye(3)))
        weights = np.array(
            [np.prod(offsets ** np.array(idx), axis=1) for idx in INDICES]
        )
        values = np.einsum("ns,nx->sx", q.c, weights)
        derivatives = np.einsum("nks,nx->ksx", grad.c, weights[:10])
        _, sample_w, sample_dv = reference(values, derivatives)
        differences.append(
            (
                (sample_w[:3] - sample_w[3:]) / (2 * step),
                (sample_dv[:3] - sample_dv[3:]) / (2 * step),
            )
        )
    dw, ddv = [(4 * differences[1][i] - differences[0][i]) / 3 for i in range(2)]
    errors.extend(
        (np.max(abs(w.derivative(1) - dw)), np.max(abs(v.derivative(2) - ddv)))
    )
    return np.array(errors)


def compare(q):
    s, h, a, _ = fields(q)
    v, w = physical_fo_rates(q)
    vb, wb, extra, data, _, _ = C.physical_rates(s)
    direct = C.direct_variation(s.gamma, s.extrinsic, v, w)
    baseline, _ = C.subsidiary(s, extra, data)
    correction = covariant_variation(s.gamma, s.extrinsic, v - vb, w - wb)
    definitions = q.value[25:] - R.gradient_aux(q.derivative(1)[:, :11])
    defects = np.r_[
        definitions, determinant(h).value - 1, e("ij,ij->", h.inverse(), a).value
    ]
    return dict(
        inputs=q.c,
        direct=direct,
        baseline=baseline,
        correction=correction,
        predicted=baseline + correction,
        defects=defects,
        metric_rate=v.c,
        extrinsic_rate=w.c,
        probe_errors=derivative_probe(q),
    )


def metrics(arrays):
    shapes = dict(
        inputs=(20, 58),
        direct=(4,),
        baseline=(4,),
        correction=(4,),
        predicted=(4,),
        defects=(35,),
        metric_rate=(10, 3, 3),
        extrinsic_rate=(4, 3, 3),
        probe_errors=(3,),
    )
    if set(arrays) != set(shapes) or any(
        a.shape != shapes[k] or a.dtype != np.float64 or not np.isfinite(a).all()
        for k, a in arrays.items()
    ):
        raise ValueError("complete finite FP64 offsurface arrays required")
    return dict(
        identity_error=float(np.max(abs(arrays["direct"] - arrays["predicted"]))),
        derivative_probe_error=float(np.max(abs(arrays["probe_errors"]))),
        omitted_feedback=float(np.max(abs(arrays["direct"] - arrays["baseline"]))),
        defect_max=float(np.max(abs(arrays["defects"]))),
    )

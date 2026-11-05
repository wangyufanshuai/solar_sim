"""Independent physical ADM/Z4 constraint propagation on definition surface.

Variable curved spatial jets, covariant kappa3=1. H/M can be nonzero, as can
Theta/Z. No independently violated FO auxiliary or algebraic constraints are
represented. Direct time variation of the definitions is kept separate from
the closed subsidiary equations. Neither path calls a production RHS.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import math

import numpy as np

from .spatial_taylor3 import Jet, einsum as e, stack

METHOD = "nr-curved-physical-constraint-propagation-v1"
TOLERANCE = 2e-12
FALSE_FLAGS = (
    "off_definition_fo_closure_validated",
    "physical_boundary_validated",
    "common_symmetrizer_validated",
    "nonlinear_stability_validated",
    "constraint_convergence_validated",
    "new_scientific_evolution",
    "full_scientific_matrix_executed",
    "historical_results_regraded",
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
)
POINTS = ((0.2, -0.1, 0.3), (-0.3, 0.4, -0.2), (0.1, 0.2, -0.4))
DAMPING = ((0.1, 0.0), (0.0, 0.0), (0.2, 0.25))
CASES = (
    ("flat", 0, 1, 0),
    *(("static", m, 1, 0) for m in range(3)),
    *(("curved", m, s, d) for m in range(3) for s in (-1, 1) for d in range(3)),
)
TERM_NAMES = (
    "shift_advection",
    "shift_covector_stretch",
    "constraint_derivatives",
    "lapse_gradients",
    "trace_feedback",
    "z4_adjustment",
)


@dataclass(frozen=True)
class State:
    gamma: Jet
    extrinsic: Jet
    alpha: Jet
    beta: Jet
    theta: Jet
    z: Jet
    driver: Jet

    def __post_init__(self):
        shapes = ((3, 3), (3, 3), (), (3,), (), (3,), (3,))
        for f, shape in zip(fields(self), shapes, strict=True):
            value = getattr(self, f.name)
            if not isinstance(value, Jet) or value.order != 3 or value.shape != shape:
                raise ValueError("complete third-order physical fields required")
        for tensor in (self.gamma, self.extrinsic):
            if np.max(abs(tensor.c - tensor.c.swapaxes(-1, -2))) > 1e-14:
                raise ValueError(
                    "symmetric physical metric and extrinsic jets required"
                )
        if (
            np.min(np.linalg.eigvalsh(self.gamma.value)) <= 0
            or not 0 < self.alpha.value < 2
        ):
            raise ValueError("SPD metric and 0<alpha<2 required; no clipping")

    def packed(self):
        return np.concatenate(
            [getattr(self, f.name).c.reshape(20, -1) for f in fields(self)], axis=1
        )

    @staticmethod
    def unpack(value):
        value = np.asarray(value)
        if value.shape != (20, 29):
            raise ValueError("complete20x29 physical input coefficients required")
        offset, jets = 0, []
        for shape in ((3, 3), (3, 3), (), (3,), (), (3,), (3,)):
            size = int(np.prod(shape))
            jets.append(Jet(value[:, offset : offset + size].reshape((20,) + shape)))
            offset += size
        return State(*jets)


def geometry(g):
    inv, dg = g.inverse(), g.gradient()
    lower = 0.5 * (e("ilj->lij", dg) + e("jli->lij", dg) - dg)
    connection = e("kl,lij->kij", inv, lower)
    dc = connection.gradient()
    ricci = (
        e("kkij->ij", dc)
        - e("jkik->ij", dc)
        + e("kkl,lij->ij", connection, connection)
        - e("kjl,lik->ij", connection, connection)
    )
    return inv, connection, ricci


def divergence_mixed(tensor, connection):
    return (
        e("jji->i", tensor.gradient())
        + e("jjl,li->i", connection, tensor)
        - e("lji,jl->i", connection, tensor)
    )


def constraints(g, k):
    inv, connection, ricci = geometry(g)
    mixed = e("ij,jk->ik", inv, k)
    trace = e("ii->", mixed)
    h = e("ij,ij->", inv, ricci) + trace * trace - e("ij,ji->", mixed, mixed)
    m = divergence_mixed(mixed, connection) - trace.gradient()
    return h, m, inv, connection, ricci, mixed, trace


def lie_covariant(beta, tensor):
    db = beta.gradient()
    if tensor.shape == (3,):
        return e("s,si->i", beta, tensor.gradient()) + e("s,is->i", tensor, db)
    if tensor.shape != (3, 3):
        raise ValueError("covector or rank-two covariant tensor required")
    return (
        e("s,sij->ij", beta, tensor.gradient())
        + e("sj,is->ij", tensor, db)
        + e("is,js->ij", tensor, db)
    )


def physical_rates(s, kappa1=0.1, kappa2=0.0):
    for v in (kappa1, kappa2):
        if type(v) not in (int, float) or not math.isfinite(v):
            raise ValueError("finite scalar damping required")
    if kappa1 < 0 or kappa2 <= -1:
        raise ValueError("kappa1>=0 and kappa2>-1 required")
    h, m, inv, connection, ricci, mixed, trace = constraints(s.gamma, s.extrinsic)
    da = s.alpha.gradient()
    hessian = da.gradient() - e("kij,k->ij", connection, da)
    covdz = s.z.gradient() - e("kij,k->ij", connection, s.z)
    extra = s.alpha * (
        covdz
        + e("ji->ij", covdz)
        - 2 * s.theta * s.extrinsic
        - (kappa1 * (1 + kappa2)) * s.theta * s.gamma
    )
    v = -2 * s.alpha * s.extrinsic + lie_covariant(s.beta, s.gamma)
    w = (
        -hessian
        + s.alpha
        * (ricci + trace * s.extrinsic - 2 * e("il,lj->ij", s.extrinsic, mixed))
        + lie_covariant(s.beta, s.extrinsic)
        + extra
    )
    theta_rate = (
        e("i,i->", s.beta, s.theta.gradient())
        + s.alpha * (0.5 * h + e("ij,ij->", inv, covdz) - s.theta * trace)
        - e("i,i->", e("ij,j->i", inv, s.z), da)
        - (kappa1 * (2 + kappa2)) * s.alpha * s.theta
    )
    z_rate = (
        lie_covariant(s.beta, s.z)
        + s.alpha
        * (m + s.theta.gradient() - 2 * e("ji,j->i", mixed, s.z) - kappa1 * s.z)
        - s.theta * da
    )
    return v, w, extra, (h, m, inv, connection, ricci, mixed, trace), theta_rate, z_rate


def direct_variation(g, k, v, w):
    """Differentiate H/M definitions at fixed coordinates, not propagation RHS.

    v=gamma_t needs second derivatives, w=Kij_t needs first derivatives.
    Array product rules retain inverse-metric and connection time derivatives.
    """
    gv, dg, ddg = (g.derivative(n) for n in range(3))
    kv, dk = (k.derivative(n) for n in range(2))
    vv, dv, ddv = (v.derivative(n) for n in range(3))
    wv, dw = (w.derivative(n) for n in range(2))
    u = np.linalg.inv(gv)
    udot = -u @ vv @ u
    du = np.stack([-u @ a @ u for a in dg])
    dudot = np.stack(
        [-(udot @ dg[a] @ u + u @ dv[a] @ u + u @ dg[a] @ udot) for a in range(3)]
    )

    def lower(first):
        return 0.5 * (first.transpose(1, 0, 2) + first.transpose(1, 2, 0) - first)

    lo, lodot = lower(dg), lower(dv)
    dlo, dlodot = np.stack([lower(t) for t in ddg]), np.stack([lower(t) for t in ddv])
    conn = np.einsum("kl,lij->kij", u, lo)
    conndot = np.einsum("kl,lij->kij", udot, lo) + np.einsum("kl,lij->kij", u, lodot)
    dc = np.einsum("skl,lij->skij", du, lo) + np.einsum("kl,slij->skij", u, dlo)
    dcdot = (
        np.einsum("skl,lij->skij", dudot, lo)
        + np.einsum("skl,lij->skij", du, lodot)
        + np.einsum("kl,slij->skij", udot, dlo)
        + np.einsum("kl,slij->skij", u, dlodot)
    )
    ricci = (
        np.einsum("kkij->ij", dc)
        - np.einsum("jkik->ij", dc)
        + np.einsum("kkl,lij->ij", conn, conn)
        - np.einsum("kjl,lik->ij", conn, conn)
    )
    rdot = (
        np.einsum("kkij->ij", dcdot)
        - np.einsum("jkik->ij", dcdot)
        + np.einsum("kkl,lij->ij", conndot, conn)
        + np.einsum("kkl,lij->ij", conn, conndot)
        - np.einsum("kjl,lik->ij", conndot, conn)
        - np.einsum("kjl,lik->ij", conn, conndot)
    )
    mixed, mixed_dot = u @ kv, udot @ kv + u @ wv
    dmdot = np.stack(
        [dudot[a] @ kv + udot @ dk[a] + du[a] @ wv + u @ dw[a] for a in range(3)]
    )
    hdot = (
        np.sum(udot * ricci)
        + np.sum(u * rdot)
        + 2 * np.trace(mixed) * np.trace(mixed_dot)
        - 2 * np.trace(mixed @ mixed_dot)
    )
    mdot = (
        np.einsum("jji->i", dmdot)
        - np.einsum("ijj->i", dmdot)
        + np.einsum("jjl,li->i", conndot, mixed)
        + np.einsum("jjl,li->i", conn, mixed_dot)
        - np.einsum("lji,jl->i", conndot, mixed)
        - np.einsum("lji,jl->i", conn, mixed_dot)
    )
    return np.r_[hdot, mdot]


def subsidiary(s, extra, constraint_data):
    """Physical nonlinear H/M subsidiary equations; no fitted/envelope rows."""
    h, m, inv, conn, _, mixed, trace = constraint_data
    covdm = m.gradient() - e("kij,k->ij", conn, m)
    divm = e("ij,ij->", inv, covdm)
    mup = e("ij,j->i", inv, m)
    eu = e("ij,jk->ik", inv, extra)
    divextra = divergence_mixed(eu, conn) - e("ii->", eu).gradient()
    kupper = e("ij,jk->ik", mixed, inv)
    terms = (
        (e("i,i->", s.beta, h.gradient()), e("j,ji->i", s.beta, m.gradient())),
        (Jet.constant(0.0), e("j,ij->i", m, s.beta.gradient())),
        (-2 * s.alpha * divm, -0.5 * s.alpha * h.gradient()),
        (-4 * e("i,i->", mup, s.alpha.gradient()), -h * s.alpha.gradient()),
        (2 * s.alpha * trace * h, s.alpha * trace * m),
        (2 * e("ij,ij->", trace * inv - kupper, extra), divextra),
    )
    array = np.array([np.r_[ht.value, mt.value] for ht, mt in terms])
    return np.sum(array, axis=0), array


def fixture(kind, mode, sign, damping):
    if (kind, mode, sign, damping) not in CASES:
        raise ValueError("registered physical fixture required")
    zero, eye = Jet.constant(0.0), Jet.constant(np.eye(3))
    k = Jet.constant(np.zeros((3, 3)))
    b = z = driver = Jet.constant(np.zeros(3))
    theta = zero
    if kind == "flat":
        return State(eye, k, Jet.constant(1.0), b, theta, z, driver)
    if kind == "static":
        point = ((4.0, 3.0, 2.0), (3.0, -4.0, 2.0), (-2.0, 3.0, 4.0))[mode]
        x, y, zcoord = (Jet.coordinate(c, i) for i, c in enumerate(point))
        a = 0.5 * (x * x + y * y + zcoord * zcoord).power(-0.5)
        psi = 1 + a
        return State(
            psi.power(4) * eye, k, (1 - a) * psi.power(-1), b, theta, z, driver
        )
    x, y, zcoord = (Jet.coordinate(c, i) for i, c in enumerate(POINTS[mode]))
    bmat = stack(
        (
            stack((1.1 + 0.04 * x, 0.03 * y, 0.02 * zcoord)),
            stack((0.02 * zcoord, 0.95 - 0.03 * y, 0.04 * x)),
            stack((-0.03 * y, 0.01 * x, 1.05 + 0.02 * zcoord)),
        )
    )
    gamma = (
        e("ki,kj->ij", bmat, bmat)
        + (0.04 * (x * x + y * y + zcoord * zcoord) + 0.01 * x * y * zcoord) * eye
    )
    k = sign * stack(
        (
            stack(
                (0.03 + 0.02 * x * y, 0.012 + 0.01 * zcoord * x, -0.014 + 0.007 * y * y)
            ),
            stack(
                (
                    0.012 + 0.01 * zcoord * x,
                    -0.025 + 0.009 * zcoord * zcoord,
                    0.018 + 0.011 * x * y,
                )
            ),
            stack(
                (-0.014 + 0.007 * y * y, 0.018 + 0.011 * x * y, 0.04 + 0.006 * x * x)
            ),
        )
    )
    alpha = 0.9 + 0.04 * x - 0.03 * y + 0.02 * zcoord + 0.005 * x * x * y
    beta = stack(
        (
            0.1 + 0.03 * x + 0.02 * y * y + 0.009 * x * y * zcoord,
            -0.08 - 0.025 * y + 0.011 * x * zcoord * zcoord,
            0.06 + 0.017 * zcoord + 0.008 * x * x * y,
        )
    )
    theta = sign * (0.012 + 0.009 * x - 0.006 * y + 0.01 * zcoord * zcoord)
    z = sign * stack(
        (
            0.013 + 0.007 * x * y,
            -0.017 + 0.012 * y * zcoord,
            0.011 - 0.008 * zcoord * x + 0.005 * y * y,
        )
    )
    driver = stack((0.02 + 0.003 * x, -0.03 + 0.004 * y, 0.04 - 0.005 * zcoord))
    return State(gamma, k, alpha, beta, theta, z, driver)


def compare(s, kappa1=0.1, kappa2=0.0):
    """Compare independent paths and separately qualified pointwise references.

    Reference imports are isolated here and never used by the direct-variation,
    physical-rate or subsidiary routines above. Complete arrays are returned.
    """
    from . import continuum_adm as A
    from . import continuum_z4 as Z
    from . import formal_fo_geometry as G
    from . import reduction_constraint_oracle as R

    v, w, extra, data, theta_rate, z_rate = physical_rates(s, kappa1, kappa2)
    h, m, _, _, ricci, _, _ = data
    direct = direct_variation(s.gamma, s.extrinsic, v, w)
    closed, terms = subsidiary(s, extra, data)
    physical = A.PhysicalJet(
        s.gamma.value,
        s.gamma.derivative(1),
        s.gamma.derivative(2),
        s.extrinsic.value,
        s.extrinsic.derivative(1),
        s.alpha.value,
        s.alpha.derivative(1),
        s.alpha.derivative(2),
        s.beta.value,
        s.beta.derivative(1),
        s.beta.derivative(2),
        s.driver.value,
        s.driver.derivative(1),
    )
    z4 = Z.Z4Jet(s.theta.value, s.theta.derivative(1), s.z.value, s.z.derivative(1))
    reference = Z.evaluate(physical, z4, kappa1=kappa1, kappa2=kappa2)
    formal = G.evaluate(
        R.CanonicalJet(reference.slots, reference.slot_gradients),
        kappa1=kappa1,
        kappa2=kappa2,
    )
    pointwise = np.array(
        [
            np.r_[
                v.value.ravel(),
                w.value.ravel(),
                theta_rate.value,
                z_rate.value,
                h.value,
                m.value,
            ],
            np.r_[
                reference.gamma_rate.ravel(),
                reference.extrinsic_rate.ravel(),
                reference.theta_rate,
                reference.z_rate,
                reference.hamiltonian,
                reference.momentum,
            ],
        ]
    )
    arrays = dict(
        inputs=s.packed(),
        direct=direct,
        closed=closed,
        terms=terms,
        pointwise=pointwise,
        full58=np.stack((reference.rhs, formal.rhs)),
        ricci=ricci.value,
        metric_rate=v.c,
        extrinsic_rate=w.c,
    )
    return arrays


def inspect_arrays(arrays):
    expected_shapes = dict(
        inputs=(20, 29),
        direct=(4,),
        closed=(4,),
        terms=(6, 4),
        pointwise=(2, 26),
        full58=(2, 58),
        ricci=(3, 3),
        metric_rate=(10, 3, 3),
        extrinsic_rate=(4, 3, 3),
    )
    if set(arrays) != set(expected_shapes) or any(
        a.shape != expected_shapes[name]
        or a.dtype != np.float64
        or not np.isfinite(a).all()
        for name, a in arrays.items()
    ):
        raise ValueError("complete finite FP64 physical comparison arrays required")
    return dict(
        constraint_rate_error=float(np.max(abs(arrays["direct"] - arrays["closed"]))),
        pointwise_error=float(
            np.max(abs(arrays["pointwise"][0] - arrays["pointwise"][1]))
        ),
        full58_error=float(np.max(abs(arrays["full58"][0] - arrays["full58"][1]))),
        curvature=float(np.max(abs(arrays["ricci"]))),
        hamiltonian=float(abs(arrays["pointwise"][0, 22])),
        momentum=float(np.max(abs(arrays["pointwise"][0, 23:]))),
        full_physical_rate=float(np.max(abs(arrays["pointwise"][0, :22]))),
    )

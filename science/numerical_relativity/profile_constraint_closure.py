"""Fixed-profile physical constraint audit, never an evolution or CPBC solver.

L(k)=J+i*k_j*A^j is the full constant-background linearized generator. J is
derived from the source equations, not removed as in a principal-only audit.
The constraint rows are fixed beforehand; no invariant-envelope completion is
allowed. Curved/time-dependent backgrounds need extra coefficient derivatives
and are explicitly rejected here, rather than flattened without notice.
"""

from __future__ import annotations

import numpy as np

from . import spectral_sat_oracle as S
from . import schwarzschild_initial_adm as I

R, G = S.R, S.G
METHOD = "nr-current-profile-constraint-closure-v1"
TOLERANCE = 2e-12
RANK_TOLERANCES = (1e-9, 1e-10, 1e-11)
FALSE_FLAGS = (
    "variable_background_propagation_validated",
    "nonlinear_constraint_stability_validated",
    "physical_boundary_validated",
    "common_symmetrizer_validated",
    "constraint_convergence_validated",
    "new_scientific_evolution",
    "full_scientific_matrix_executed",
    "old_failure_regraded",
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
)
require = S.require


def flat_cell(cell):
    q, _, _ = S.coefficients(cell, 0)
    require(
        not np.any(q[11:]),
        "constant flat background with zero dynamical/auxiliary fields required",
    )
    return q


def fixture(mode):
    require(
        type(mode) is int and mode in (0, 1, 2),
        "registered coefficient fixture required",
    )
    h, alpha, chi, beta = np.eye(3), 1.0, 1.0, np.zeros(3)
    if mode:
        lower = np.array([[1.0, 0, 0], [0.12, 1.0, 0], [-0.08, 0.06, 1.0]])
        h = lower @ lower.T
        alpha, chi, beta = 0.85, 0.72, np.array([0.03, -0.04, 0.05])
        if mode == 2:
            h = h[np.ix_([2, 0, 1], [2, 0, 1])]
            alpha, chi, beta = 1.4, 1.1, np.array([0.4, -0.35, 0.2])
    q = np.zeros(58)
    q[:11] = R.pack_base(h, np.log(alpha), beta, 0.5 * np.log(chi))
    return R.frozen(q)


WAVES = (
    (0.0, 0.0, 0.0),
    (1.0, 0.0, 0.0),
    (0.0, 1.0, 0.0),
    (0.0, 0.0, 1.0),
    (1.0, 2.0, -1.0),
    (0.25, -0.5, 0.75),
    (4.0, -2.0, 1.0),
)


def conformal_connection(h, D):
    """Linearized Christoffel and contraction at a constant conformal metric."""
    inv = np.linalg.inv(h)
    lower = np.einsum("...ilj->...lij", D) + np.einsum("...jli->...lij", D) - D
    connection = np.einsum("kl,...lij->...kij", inv, lower)
    return connection, np.einsum("jl,...ijl->...i", inv, connection)


def source_matrix(cell):
    """Exact tangent source for tau^-1=1, kappa1=.1, kappa2=0, eta=0.

    Columns are full58 perturbations. Linear metric/gauge source terms include
    the first-order auxiliary variables: they cannot be discarded as damping.
    f=3*alpha*chi, mu=.2*chi; derivatives of f multiply background b=0 here.
    """
    q = flat_cell(cell)
    h, inv = R.sym(q, 0), np.linalg.inv(R.sym(q, 0))
    alpha, chi, beta = np.exp(q[6]), np.exp(2 * q[10]), q[7:10]
    u = R.unpack(np.eye(58))
    tr = R.contract(inv, u["a"])
    dhdet = R.contract(inv, u["h"])
    B = u["B"]
    div = np.trace(B, axis1=-2, axis2=-1)
    hdot = (
        2 * np.einsum("k,...kij->...ij", beta, u["D"])
        + np.einsum("ki,...jk->...ij", h, B)
        + np.einsum("kj,...ik->...ij", h, B)
        - (2 / 3) * h * div[..., None, None]
        - 2 * alpha * (u["a"] - h * tr[..., None, None] / 3)
        - h * dhdet[..., None, None]
    )
    Ldot = np.einsum("k,...k->...", beta, u["A"]) - 2 * u["K"] + 4 * u["theta"]
    betadot = np.einsum("k,...ki->...i", beta, B) + 3 * alpha * chi * u["b"]
    elldot = np.einsum("k,...k->...", beta, u["P"]) + (alpha * u["K"] - div) / 3
    result = np.zeros((58, 58))
    result[:11] = R.pack_base(hdot, Ldot, betadot, elldot)
    for k, (i, j) in enumerate(R.PAIRS):
        result[11 + k] = -h[i, j] * tr
    result[17, 18], result[18, 18] = -0.3 * alpha, -0.2 * alpha
    _, contracted = conformal_connection(h, u["D"])
    gamma = np.eye(58)[19:22].T
    result[19:22] = (-0.1 * alpha * (gamma - contracted)).T
    result[22:25] = result[19:22]
    return R.frozen(result)


def source_crosscheck(cell):
    """Central source probes with a fixed cubic-cancellation extrapolation.

    At these flat seeds single-column probes have only a cubic odd remainder
    (the determinant relaxation term). This is not a general-state derivative
    method or a configurable fit to an observed residual.
    """
    q = flat_cell(cell)
    estimates = []
    for eps in (1 / 64, 1 / 128):
        values = np.concatenate(
            (q[:, None] + eps * np.eye(58), q[:, None] - eps * np.eye(58)), axis=1
        )
        rates = G.evaluate(R.CanonicalJet(values, np.zeros((3, 58, 116)))).rhs
        estimates.append((rates[:, :58] - rates[:, 58:]) / (2 * eps))
    return R.frozen((4 * estimates[1] - estimates[0]) / 3)


def constraint_rows(cell, wave):
    """43 physical rows, in fixed order: definitions33, algebraic2, H/M4, Z4four.

    The off-trace ADM momentum is div(a)-d tr(a)-2/3 dK. The old principal
    momentum omits d tr(a); the two coincide on the algebraic constraint.
    Complex rows use exp(i*k.x), physical metric gamma=h/chi and physical K.
    No Hamiltonian equation is replaced by Theta and no Z_i is omitted.
    """
    q = flat_cell(cell)
    k = S.real(wave, (3,))
    require(np.max(abs(k)) <= 8, "bounded registered wave components required")
    h, inv, chi = R.sym(q, 0), np.linalg.inv(R.sym(q, 0)), np.exp(2 * q[10])
    basis = np.eye(58)
    u = R.unpack(basis)
    gradient = 1j * k[:, None, None] * basis[None, :, :]
    definitions = basis[25:] - R.gradient_aux(gradient[:, :11])
    algebraic = np.array([R.contract(inv, u["h"]), R.contract(inv, u["a"])])
    connection, contracted = conformal_connection(h, u["D"])
    eye = np.eye(3)
    physical = (
        connection
        - np.einsum("ki,...j->...kij", eye, u["P"])
        - np.einsum("kj,...i->...kij", eye, u["P"])
        + np.einsum("ij,kl,...l->...kij", h, inv, u["P"])
    )
    ricci = 1j * (
        np.einsum("k,...kij->...ij", k, physical)
        - np.einsum("j,...kik->...ij", k, physical)
    )
    H = chi * R.contract(inv, ricci)
    M = 1j * (
        np.einsum("j,jl,...li->...i", k, inv, u["a"])
        - k[None, :] * (algebraic[1] + (2 / 3) * u["K"])[:, None]
    )
    Z = 0.5 * np.einsum("ij,...j->...i", h, basis[19:22].T - contracted)
    return np.vstack((definitions, algebraic, H, M.T, basis[18], Z.T)).astype(complex)


def generator(cell, wave):
    q, k = flat_cell(cell), S.real(wave, (3,))
    require(np.max(abs(k)) <= 8, "bounded registered wave components required")
    return source_matrix(q).astype(complex) + 1j * sum(
        k[a] * S.principal(q, a) for a in range(3)
    )


def closure(rows, operator):
    """Measure invariance of the *unchanged* physical kernel, without completion.

    The SVD right inverse is diagnostic only. Both CA-BC and the action on an
    explicit null basis are reported; no solution/state is projected or evolved.
    """
    C, L = np.asarray(rows), np.asarray(operator)
    require(
        C.ndim == 2
        and 1 <= len(C) <= 82
        and C.shape[1] == 58
        and L.shape == (58, 58)
        and C.dtype.kind in "fiuc"
        and L.dtype.kind in "fiuc"
        and np.isfinite(C).all()
        and np.isfinite(L).all(),
        "finite bounded constraint/operator matrices required",
    )
    left, singular, vh = np.linalg.svd(C, full_matrices=True)
    scale = max(1.0, float(singular[0]))
    ranks = [int(np.count_nonzero(singular > tol * scale)) for tol in RANK_TOLERANCES]
    require(
        len(set(ranks)) == 1, "unresolved constraint rank; no completion or clipping"
    )
    rank = ranks[0]
    inverse = (vh[:rank].conj().T / singular[:rank]) @ left[:, :rank].conj().T
    null = vh[rank:].conj().T
    B = C @ L @ inverse
    residual = C @ L - B @ C
    leak = C @ L @ null
    denominator = max(1.0, float(np.linalg.norm(C @ L, np.inf)))
    ratio = float(np.linalg.norm(residual, np.inf)) / denominator
    null_ratio = float(np.linalg.norm(leak, np.inf)) / denominator
    # A concrete unit kernel vector supplies a falsification witness on failure.
    _, _, lv = np.linalg.svd(leak, full_matrices=False)
    witness = null @ lv[0].conj() if null.shape[1] else np.zeros(58, dtype=complex)
    report = dict(
        constraint_count=len(C),
        rank=rank,
        nullity=58 - rank,
        rank_triplet=ranks,
        relative_row_residual=ratio,
        relative_null_leak=null_ratio,
        max_row_residual=float(np.max(abs(residual))),
        max_null_leak=float(np.max(abs(leak))) if leak.size else 0.0,
        witness_constraint=float(np.max(abs(C @ witness))),
        witness_rate=float(np.max(abs(C @ L @ witness))),
        closed=ratio <= TOLERANCE and null_ratio <= TOLERANCE,
        rows_added=0,
        physical_subsidiary_equations_validated=False,
    )
    return report, B, null, witness


def analytic_jet(points, amplitude):
    o = I.initial_adm(points, amplitude)
    shape = o.ln_alpha.shape
    q, dq = np.zeros((58, *shape)), np.zeros((3, 58, *shape))
    q[[0, 3, 5]], q[6], q[10] = 1.0, o.ln_alpha, o.ln_phi
    q[25:28], q[55:58] = (
        np.moveaxis(o.grad_ln_alpha, -1, 0),
        np.moveaxis(o.grad_ln_phi, -1, 0),
    )
    dq[:, 6], dq[:, 10] = q[25:28], q[55:58]
    dq[:, 25:28] = np.moveaxis(o.hess_ln_alpha, (-2, -1), (0, 1))
    dq[:, 55:58] = np.moveaxis(o.hess_ln_phi, (-2, -1), (0, 1))
    return R.CanonicalJet(q, dq), o


def target_compatibility(reference):
    """Static target / T=0 compatibility on all866 N13 boundary nodes only.

    Analytic gradients do not measure the SBP boundary truncation error. The
    pulse has no analytic positive-time solution; no later-time compatibility
    or absorbing/constraint-preserving boundary property is inferred.
    """
    saved = S.real(reference, (58, 13, 13, 13))
    xyz = np.stack(
        np.meshgrid(*([np.linspace(1.0, 3.0, 13)] * 3), indexing="ij"), axis=-1
    )
    mask = np.ones((13,) * 3, dtype=bool)
    mask[1:-1, 1:-1, 1:-1] = False
    static, origin = analytic_jet(xyz, 0.0)
    pulse, _ = analytic_jet(xyz, 0.001)
    require(
        np.max(abs(saved - static.slots)) <= I.INITIAL_TOLERANCE,
        "original static target differs from independent analytic data",
    )
    sf, pf = G.evaluate(static), G.evaluate(pulse)
    H = origin.chi * np.trace(origin.ricci, axis1=-2, axis2=-1)
    report = dict(
        boundary_points=int(mask.sum()),
        incident_face_nodes=6 * 13**2,
        static_target_error=float(np.max(abs(saved - static.slots))),
        static_full58_rate=float(np.max(abs(sf.rhs))),
        initial_boundary_full58_rate=float(np.max(abs(pf.rhs[:, mask]))),
        initial_boundary_value_difference=float(
            np.max(abs((pulse.slots - static.slots)[:, mask]))
        ),
        initial_boundary_gradient_difference=float(
            np.max(abs((pulse.slot_gradients - static.slot_gradients)[:, :, mask]))
        ),
        static_hamiltonian=float(np.max(abs(H))),
        static_z=float(np.max(abs(sf.z_covector))),
        static_definition=float(np.max(abs(R.evaluate(static).defects))),
        pulse_interior_rate=float(np.max(abs(pf.rhs[:, ~mask]))),
        analytic_derivatives=True,
        evolved_solution_checked=False,
        **{key: False for key in FALSE_FLAGS},
    )
    return report, dict(
        static_q=static.slots,
        static_dq=static.slot_gradients,
        static_rhs=sf.rhs,
        pulse_q=pulse.slots,
        pulse_dq=pulse.slot_gradients,
        pulse_rhs=pf.rhs,
        boundary_mask=mask,
        static_H=H,
    )

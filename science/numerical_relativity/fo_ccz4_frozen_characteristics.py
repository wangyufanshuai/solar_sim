"""Pointwise eigenspace checks for the implemented, nonflat FO-CCZ4 symbol.

The speed families are from Dumbser et al., arXiv:1707.09910v3, Appendix A.2,
Eqs. (64)-(68), with phi**2=chi. Their left-hand-side speeds have the opposite
sign to our q_t=A(n)d_n q convention. The 11 ODE modes stay at zero; only the
47 PDE modes have beta.n advection. Gamma-driver speeds use h^{-1}, not
alpha**2*gamma^{-1}.

Coincident speeds are merged before computing null spaces of A-lambda*I.
Real eigenvalues alone do not establish diagonalizability. A pointwise SVD
check is NOT a proof of strong hyperbolicity over a coefficient domain, nor
does it provide a smooth bounded basis, symmetrizer or boundary prescription.
No evolution parameters are changed and no runtime writes are performed.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
import hashlib
import math
from typing import Sequence

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_frozen_symbol import _coefficients, frozen_fo_ccz4_principal_matrix_3d
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4Config


_GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
_CONFIG = FOCCZ4Config(kappa1=0.)


@dataclass(frozen=True)
class FrozenCharacteristicRoot:
    value: float
    families: tuple[str, ...]
    algebraic_multiplicity: int
    numerical_nullities: tuple[int, ...]
    nullity_stable: bool
    multiplicity_matches: bool
    eigenspace_residual_scaled: float


@dataclass(frozen=True)
class FrozenFOCCZ4EigenspaceAudit:
    normal_scale: float
    roots: tuple[FrozenCharacteristicRoot, ...]
    rank_relative_tolerances: tuple[float, ...]
    root_merge_relative_tolerance: float
    condition_number_limit: float
    residual_tolerance: float
    basis_columns: int
    basis_rank: int
    basis_condition_number: float | None
    max_eigenspace_residual_scaled: float
    normalized_principal_sha256: str
    pointwise_eigenbasis_validated: bool
    strong_hyperbolicity_validated: bool = False
    analytic_uniform_basis_validated: bool = False
    variable_coefficient_energy_estimate_validated: bool = False
    cpbc_ready: bool = False
    physical_boundary_validated: bool = False
    runtime_writeback: bool = False
    gauge_profile_identity: dict | None = None
    method: str = "fo-ccz4-frozen-published-families-SVD-nullity-v1"


def _speed_families(h, chi, alpha, beta, n, gauge, config):
    # Do not silently extrapolate the published standard-gauge contract.
    if (
        not gauge.advective or gauge.lapse_coefficient != 2.
        or gauge.theta_coupling != 2. or config.c != 1.
        or config.cleaning_speed != 1. or config.shift_strength != 1.
    ):
        raise ValueError("speed contract requires advective 1+log, theta=2, c=e=s=1")
    if not np.isclose(np.linalg.det(h), 1., rtol=0., atol=1.e-10):
        raise ValueError("published speed contract requires det(h)=1")
    hnn = float(n @ np.linalg.solve(h, n))
    advective = float(beta @ n)
    families = [("ODE", 0., 11), ("PDE-advection", advective, 15)]
    pairs = (
        ("light-cleaning", alpha * math.sqrt(chi * hnn), 6),
        ("one-plus-log", math.sqrt(2. * alpha * chi * hnn), 1),
        ("Gamma-driver-longitudinal", math.sqrt(4. * gauge.shift_coefficient * hnn / 3.), 1),
        ("ordering-longitudinal", alpha * math.sqrt(config.ordering_mu * hnn / 2.), 2),
        ("Gamma-driver-transverse", math.sqrt(gauge.shift_coefficient * hnn), 2),
        ("ordering-transverse", .5 * alpha * math.sqrt(config.ordering_mu * hnn), 4),
    )
    for label, speed, multiplicity in pairs:
        for sign in (-1, 1):
            families.append((f"{label}:{sign:+d}", advective + sign * speed, multiplicity))
    if not all(math.isfinite(row[1]) for row in families):
        raise ValueError("characteristic speeds must be finite")
    return sorted(families, key=lambda row: row[1])


def audit_frozen_fo_ccz4_eigenspaces_3d(
    conformal_metric: np.ndarray,
    chi: float,
    lapse: float,
    shift: Sequence[float],
    normal_covector: Sequence[float],
    *,
    gauge: GaugeConfig = _GAUGE,
    config: FOCCZ4Config = _CONFIG,
    gauge_profile: FOCCZ4GaugeProfile | None = None,
    rank_relative_tolerances: tuple[float, ...] = (1.e-9, 1.e-10, 1.e-11),
    root_merge_relative_tolerance: float = 1.e-12,
    condition_number_limit: float = 1.e6,
    residual_tolerance: float = 2.e-11,
) -> FrozenFOCCZ4EigenspaceAudit:
    """Audit full eigenspace dimensions at one frozen coefficient point.

    SVD is performed at three declared tolerances. Nullities must agree with
    the summed published multiplicity at every root, and the combined basis
    must have rank 58 and a bounded numerical condition number. No pseudoinverse
    or fabricated replacement vectors are used at defective/ambiguous points.
    The numerical basis condition depends on the canonical variable scaling.
    """

    tolerances = tuple(float(t) for t in rank_relative_tolerances)
    if not tolerances or any(not math.isfinite(t) or t <= 0. or t >= 1. for t in tolerances):
        raise ValueError("rank tolerances must be finite and lie between zero and one")
    for name, value in (
        ("root_merge_relative_tolerance", root_merge_relative_tolerance),
        ("condition_number_limit", condition_number_limit),
        ("residual_tolerance", residual_tolerance),
    ):
        if not math.isfinite(value) or value <= 0.:
            raise ValueError(f"{name} must be finite and positive")
    h, chi, alpha, beta, n = _coefficients(conformal_metric, chi, lapse, shift, normal_covector)
    if gauge_profile is not None:
        gauge_profile.validate_formulation(gauge, config)
        shift_f, ordering_mu = gauge_profile.coefficients(alpha, chi)
        gauge = replace(gauge, shift_coefficient=float(shift_f))
        config = replace(config, ordering_mu=float(ordering_mu))
    # Work at an O(1) normal to avoid classifying all tiny-covector speeds as
    # zero. This numerical rescaling does not change the assembly convention.
    normal_scale = float(np.max(np.abs(n)))
    n_unit = n / normal_scale
    families = _speed_families(h, chi, alpha, beta, n_unit, gauge, config)
    principal = frozen_fo_ccz4_principal_matrix_3d(h, chi, alpha, beta, n_unit, gauge=gauge, config=config)
    matrix_scale = max(1., float(np.linalg.norm(principal, ord=np.inf)))
    root_scale = max(1., *(abs(row[1]) for row in families))
    groups = []
    for label, value, multiplicity in families:
        if groups and abs(value - groups[-1][0]) <= root_merge_relative_tolerance * root_scale:
            groups[-1][1].append(label)
            groups[-1][2] += multiplicity
        else:
            groups.append([value, [label], multiplicity])

    reports, blocks = [], []
    for value, labels, multiplicity in groups:
        coordinate_value = float(value * normal_scale)
        if not math.isfinite(coordinate_value):
            raise ValueError("coordinate characteristic speed must be finite")
        shifted = principal - value * np.eye(58)
        _, singular, vh = np.linalg.svd(shifted)
        scale = max(1., float(singular[0]))
        nullities = tuple(int(np.count_nonzero(singular <= tol * scale)) for tol in tolerances)
        # Use the strictest threshold for the actual columns. A zero-dimensional
        # eigenspace must remain empty (vh[-0:] would wrongly select everything).
        count = int(np.count_nonzero(singular <= min(tolerances) * scale))
        block = vh[-count:].T if count else np.empty((58, 0))
        blocks.append(block)
        residual = float(np.max(np.abs(shifted @ block), initial=0.)) / matrix_scale
        reports.append(FrozenCharacteristicRoot(
            value=coordinate_value, families=tuple(labels),
            algebraic_multiplicity=multiplicity, numerical_nullities=nullities,
            nullity_stable=len(set(nullities)) == 1,
            multiplicity_matches=all(count == multiplicity for count in nullities),
            eigenspace_residual_scaled=residual,
        ))

    basis = np.concatenate(blocks, axis=1)
    singular = np.linalg.svd(basis, compute_uv=False)
    rank = int(np.count_nonzero(singular > min(tolerances) * max(1., float(np.max(singular, initial=0.)))))
    condition = None
    if rank == 58 and basis.shape == (58, 58):
        value = float(singular[0] / singular[-1])
        condition = value if math.isfinite(value) else None
    residual = max(row.eigenspace_residual_scaled for row in reports)
    passed = (
        rank == 58 and basis.shape == (58, 58)
        and all(row.multiplicity_matches for row in reports)
        and condition is not None and condition <= condition_number_limit
        and residual <= residual_tolerance
        and not np.any(principal[:11]) and not np.any(principal[:, :11])
    )
    return FrozenFOCCZ4EigenspaceAudit(
        normal_scale=normal_scale, roots=tuple(reports), rank_relative_tolerances=tolerances,
        root_merge_relative_tolerance=root_merge_relative_tolerance,
        condition_number_limit=condition_number_limit, residual_tolerance=residual_tolerance,
        basis_columns=basis.shape[1], basis_rank=rank, basis_condition_number=condition,
        max_eigenspace_residual_scaled=residual,
        normalized_principal_sha256=hashlib.sha256(np.asarray(principal, dtype="<f8").tobytes()).hexdigest(),
        pointwise_eigenbasis_validated=bool(passed),
        gauge_profile_identity=gauge_profile.identity() if gauge_profile else None,
    )

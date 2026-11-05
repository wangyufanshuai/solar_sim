"""Audit the candidate Z4c projection from the 58-slot FO-CCZ4 state.

The CCZ4 3-D RHS reconstructs the Z4 vector from the evolved conformal
connection and the contracted conformal Christoffel symbols.  That formula is
not, by itself, a proof that the resulting rows close under the *first-order*
FO-CCZ4 principal symbol.  This module makes that missing link measurable.

The audit builds Fourier rows for
``(Theta, Z_n, H, M_n, Z_A, partial_n Z_A, M_A)`` and tests their row-space
condition against the independent analytic 58-by-58 principal matrix.  It
also compares the *full* FO generator against the independently encoded
linearized Z4c subsidiary equations.  The latter comparison is performed
both directly and modulo the FO ordering constraints.  A small residual only
after quotienting by those constraints is evidence for a consistent
reduction, not a CPBC proof: the nonlinear projection, symmetrizer, and
physical boundary energy estimate remain open.  No runtime projection or
boundary penalty is enabled by this module.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_subsidiary_shadow import (
    SUBSIDIARY_STATE_ORDER,
    linearized_z4c_subsidiary_shadow_3d,
)


@dataclass(frozen=True)
class FOCCZ4Z4CProjectionAudit3D:
    """Candidate Z4c-to-FO-CCZ4 projection audit."""

    normal_axis: int
    effective_wave_number: float
    variable_count: int
    subsidiary_state_count: int
    projection_rank: int
    propagation_matrix_rank: int
    normalized_closure_residual_l_inf: float
    normalized_unconstrained_subsidiary_residual_l_inf: float
    normalized_ordering_modulo_subsidiary_residual_l_inf: float
    ordering_constraint_rank: int
    subsidiary_generator_sha256: str
    continuum_subsidiary_equivalence_modulo_ordering_validated: bool
    direct_symbol_crosscheck_error_l_inf: float
    projection_kind: str
    projection_validated: bool
    cpbc_ready: bool
    deterministic: bool
    projection_matrix_sha256: str
    method: str = "fo-ccz4-z4c-subsidiary-projection-audit-v2-ordering-quotient"


def _index(name: str) -> int:
    return FOCCZ4_VARIABLE_ORDER.index(name)


def _projection_digest(rows: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-z4c-subsidiary-projection-audit-v1\0")
    digest.update(np.ascontiguousarray(rows, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _generator_digest(generator: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-z4c-subsidiary-generator-v1\0")
    digest.update(np.ascontiguousarray(generator, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _ordering_quotient_residual(
    target: np.ndarray,
    ordering_rows: np.ndarray,
    *,
    rank_tolerance: float,
) -> tuple[float, int]:
    """Measure a generator mismatch after quotienting by ordering rows.

    ``target`` and ``ordering_rows`` are row operators on the same 58-slot
    state.  The least-squares fit is intentionally explicit: a small residual
    means the mismatch is a linear combination of ordering constraints, while
    a large residual means the proposed subsidiary equations disagree even on
    the ordering-constraint manifold.  This is an algebraic frozen-coefficient
    audit only; it does not derive the continuum nonlinear subsidiary system.
    """

    rows = np.asarray(ordering_rows, dtype=np.complex128)
    target = np.asarray(target, dtype=np.complex128)
    rank = int(np.linalg.matrix_rank(rows, tol=rank_tolerance))
    if rows.size == 0 or rank == 0:
        residual = target
    else:
        coefficients = target @ np.linalg.pinv(rows, rcond=rank_tolerance)
        residual = target - coefficients @ rows
    normalized = float(
        np.linalg.norm(residual, ord=np.inf)
        / max(1.0, float(np.linalg.norm(target, ord=np.inf)))
    )
    return normalized, rank


def _continuum_reference_compatible(
    gauge: GaugeConfig,
    config: FOCCZ4Config,
) -> bool:
    """Return whether the independently encoded flat Z4c block applies."""

    return bool(
        math.isclose(gauge.shift_coefficient, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(gauge.shift_damping, 0.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(gauge.theta_coupling, 2.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.kappa1, 0.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.kappa2, 0.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.kappa3, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.cleaning_speed, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.ordering_mu, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.shift_strength, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.tau_inverse, 0.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.k0, 0.0, rel_tol=0.0, abs_tol=1.0e-15)
        and math.isclose(config.c, 1.0, rel_tol=0.0, abs_tol=1.0e-15)
    )


def _z_row(component: int) -> np.ndarray:
    """Return the linearized row ``Z_i = (GammaHat_i - Gamma_tilde_i)/2``."""

    row = np.zeros(len(FOCCZ4_VARIABLE_ORDER), dtype=np.complex128)
    row[_index(f"GammaHat{component}")] = 0.5
    for direction in range(3):
        # Gamma_tilde^i = sum_j (2 D_{j j i} - D_{i j j}) at flat space.
        row[_index(f"D{direction}{min(direction, component)}{max(direction, component)}")] -= 1.0
        row[_index(f"D{component}{direction}{direction}")] += 0.5
    return row


def _candidate_projection_rows(
    *,
    normal_axis: int,
    effective_wave_number: float,
) -> np.ndarray:
    rows = np.zeros(
        (len(SUBSIDIARY_STATE_ORDER), len(FOCCZ4_VARIABLE_ORDER)),
        dtype=np.complex128,
    )
    state_index = {name: position for position, name in enumerate(SUBSIDIARY_STATE_ORDER)}
    z_rows = [_z_row(component) for component in range(3)]
    rows[state_index["Theta"], _index("Theta")] = 1.0
    rows[state_index["Z_n"]] = z_rows[normal_axis]
    einstein = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=normal_axis,
        effective_wave_number=effective_wave_number,
    )
    rows[state_index["H"]] = einstein[0]
    rows[state_index["M_n"]] = einstein[normal_axis + 1]
    transverse = tuple(component for component in range(3) if component != normal_axis)
    derivative = 1j * effective_wave_number
    for z_name, q_name, m_name, component in (
        ("Z_t1", "Q_t1", "M_t1", transverse[0]),
        ("Z_t2", "Q_t2", "M_t2", transverse[1]),
    ):
        rows[state_index[z_name]] = z_rows[component]
        rows[state_index[q_name]] = derivative * z_rows[component]
        rows[state_index[m_name]] = einstein[component + 1]
    return rows


def linearized_fo_ccz4_z4c_projection_audit_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    closure_tolerance: float = 1.0e-8,
) -> FOCCZ4Z4CProjectionAudit3D:
    """Measure closure of the candidate Z4c projection under FO-CCZ4."""

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
    if not _continuum_reference_compatible(gauge, config):
        raise ValueError(
            "continuum Z4c subsidiary comparison currently requires the "
            "flat shadow gauge/configuration (shift coefficient 1, zero "
            "damping, theta coupling 2, kappa1 0, and unit cleaning/ordering "
            "parameters)"
        )
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    direct_error = float(np.max(np.abs(principal - direct)))
    rows = _candidate_projection_rows(
        normal_axis=normal_axis,
        effective_wave_number=raw.effective_wave_number,
    )
    projection_rank = int(np.linalg.matrix_rank(rows, tol=rank_tolerance))
    propagated = rows @ principal
    propagation_matrix = propagated @ np.linalg.pinv(rows, rcond=rank_tolerance)
    closure_residual = float(
        np.linalg.norm(propagation_matrix @ rows - propagated, ord=np.inf)
        / max(1.0, float(np.linalg.norm(propagated, ord=np.inf)))
    )
    subsidiary = linearized_z4c_subsidiary_shadow_3d(
        normal_axis=normal_axis,
        lapse=1.0,
        shift_normal=0.0,
        effective_wave_number=raw.effective_wave_number,
        closure_tolerance=closure_tolerance,
    )
    subsidiary_generator = (
        1j * raw.effective_wave_number * subsidiary.principal_matrix
        + subsidiary.source_matrix
    )
    projected_evolution = rows @ np.asarray(raw.full_symbol, dtype=np.complex128)
    projected_subsidiary_evolution = subsidiary_generator @ rows
    subsidiary_mismatch = (
        projected_evolution - projected_subsidiary_evolution
    )
    subsidiary_scale = max(
        1.0,
        float(np.linalg.norm(projected_evolution, ord=np.inf)),
        float(np.linalg.norm(projected_subsidiary_evolution, ord=np.inf)),
    )
    unconstrained_subsidiary_residual = float(
        np.linalg.norm(subsidiary_mismatch, ord=np.inf)
        / subsidiary_scale
    )
    ordering_modulo_residual, ordering_rank = _ordering_quotient_residual(
        subsidiary_mismatch,
        np.asarray(raw.constraint_rows, dtype=np.complex128),
        rank_tolerance=rank_tolerance,
    )
    # The subsidiary shadow's own compatibility closure and the quotient
    # residual are both required.  This validates only the frozen reduction
    # modulo ordering constraints, not the unconstrained 58-slot projection.
    continuum_equivalence = bool(
        subsidiary.principal_closed
        and direct_error <= 1.0e-8
        and ordering_modulo_residual <= closure_tolerance
    )
    finite = all(
        math.isfinite(value)
        for value in (
            direct_error,
            closure_residual,
            unconstrained_subsidiary_residual,
            ordering_modulo_residual,
        )
    )
    validated = bool(
        finite
        and direct_error <= 1.0e-8
        and closure_residual <= closure_tolerance
    )
    return FOCCZ4Z4CProjectionAudit3D(
        normal_axis=normal_axis,
        effective_wave_number=raw.effective_wave_number,
        variable_count=int(principal.shape[0]),
        subsidiary_state_count=int(rows.shape[0]),
        projection_rank=projection_rank,
        propagation_matrix_rank=int(
            np.linalg.matrix_rank(propagation_matrix, tol=rank_tolerance)
        ),
        normalized_closure_residual_l_inf=closure_residual,
        normalized_unconstrained_subsidiary_residual_l_inf=(
            unconstrained_subsidiary_residual
        ),
        normalized_ordering_modulo_subsidiary_residual_l_inf=(
            ordering_modulo_residual
        ),
        ordering_constraint_rank=ordering_rank,
        subsidiary_generator_sha256=_generator_digest(subsidiary_generator),
        continuum_subsidiary_equivalence_modulo_ordering_validated=(
            finite and continuum_equivalence
        ),
        direct_symbol_crosscheck_error_l_inf=direct_error,
        projection_kind=(
            "candidate-theta-z4-reconstruction-plus-linearized-hamiltonian-"
            "momentum-and-transverse-derivative-rows"
        ),
        projection_validated=validated,
        cpbc_ready=False,
        deterministic=True,
        projection_matrix_sha256=_projection_digest(rows),
    )


__all__ = [
    "FOCCZ4Z4CProjectionAudit3D",
    "linearized_fo_ccz4_z4c_projection_audit_3d",
]

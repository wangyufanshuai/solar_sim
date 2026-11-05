"""Invariant-envelope completion for the candidate FO-CCZ4 constraint map.

The ten-row Z4c candidate projection is not an invariant row space of the
current 58-variable frozen principal symbol.  This module computes the
smallest deterministic row-space envelope obtained by repeatedly adjoining
the propagated rows ``C A^n`` and removing linearly dependent rows.  It is a
linear-algebra closure certificate, not a derivation of the nonlinear
subsidiary equations or a constraint-preserving boundary condition.

The current shadow reaches a rank-17 invariant envelope in all three Cartesian
normal directions.  The added rows are intentionally retained as derived
linear combinations rather than being given physical names prematurely; a
future CPBC implementation must identify their continuum meaning first.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_z4c_projection_audit import _candidate_projection_rows


@dataclass(frozen=True)
class FOCCZ4ConstraintClosureShadow3D:
    """Deterministic invariant-envelope audit for one normal direction."""

    normal_axis: int
    effective_wave_number: float
    variable_count: int
    initial_constraint_count: int
    initial_projection_rank: int
    completed_constraint_count: int
    completed_constraint_rank: int
    completion_iterations: int
    added_constraint_count: int
    normalized_closure_residual_l_inf: float
    direct_symbol_crosscheck_error_l_inf: float
    characteristic_speeds: tuple[float, ...]
    positive_speed_count: int
    negative_speed_count: int
    zero_speed_count: int
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    characteristic_diagonalizable: bool
    invariant_envelope_validated: bool
    physical_subsidiary_equations_validated: bool
    cpbc_ready: bool
    deterministic: bool
    initial_projection_matrix_sha256: str
    completed_constraint_matrix_sha256: str
    closure_operator_sha256: str
    method: str = "fo-ccz4-invariant-constraint-envelope-shadow-v1"


@dataclass(frozen=True)
class FOCCZ4ConstraintClosureMatrices3D:
    """Matrices retained for downstream frozen boundary shadow audits."""

    normal_axis: int
    effective_wave_number: float
    principal_matrix: np.ndarray
    initial_rows: np.ndarray
    completed_rows: np.ndarray
    propagation_matrix: np.ndarray
    completion_iterations: int
    normalized_closure_residual_l_inf: float
    direct_symbol_crosscheck_error_l_inf: float


def _matrix_digest(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _rank(matrix: np.ndarray, tolerance: float) -> int:
    return int(np.linalg.matrix_rank(matrix, tol=tolerance))


def _independent_rows(rows: list[np.ndarray], tolerance: float) -> np.ndarray:
    """Keep the first independent rows in a deterministic order."""

    basis: list[np.ndarray] = []
    current_rank = 0
    for row in rows:
        candidate = np.asarray(row, dtype=np.complex128)
        trial = (
            candidate[None, :]
            if not basis
            else np.vstack((np.asarray(basis), candidate))
        )
        trial_rank = _rank(trial, tolerance)
        if trial_rank > current_rank:
            basis.append(candidate.copy())
            current_rank = trial_rank
    if not basis:
        raise ValueError("constraint closure received no rows")
    return np.vstack(basis)


def _closure_residual(
    rows: np.ndarray,
    principal: np.ndarray,
    rank_tolerance: float,
) -> tuple[float, np.ndarray]:
    propagated = rows @ principal
    propagation_matrix = propagated @ np.linalg.pinv(rows, rcond=rank_tolerance)
    residual = float(
        np.linalg.norm(propagation_matrix @ rows - propagated, ord=np.inf)
        / max(1.0, float(np.linalg.norm(propagated, ord=np.inf)))
    )
    return residual, propagation_matrix


def _complete_invariant_rows(
    initial_rows: np.ndarray,
    principal: np.ndarray,
    *,
    rank_tolerance: float,
    closure_tolerance: float,
    max_iterations: int,
) -> tuple[np.ndarray, np.ndarray, int, float]:
    rows = [np.asarray(row, dtype=np.complex128) for row in initial_rows]
    completed = initial_rows.copy()
    propagation_matrix = np.zeros((initial_rows.shape[0], initial_rows.shape[0]), dtype=np.complex128)
    residual = math.inf
    for iteration in range(1, max_iterations + 1):
        candidates = rows + [row @ principal for row in rows]
        completed = _independent_rows(candidates, rank_tolerance)
        residual, propagation_matrix = _closure_residual(
            completed,
            principal,
            rank_tolerance,
        )
        rows = [row for row in completed]
        if residual <= closure_tolerance:
            return completed, propagation_matrix, iteration, residual
    return completed, propagation_matrix, max_iterations, residual


def _characteristic_census(
    propagation_matrix: np.ndarray,
    *,
    speed_tolerance: float,
) -> tuple[tuple[float, ...], int, int, int, int, float, bool]:
    eigenvalues, eigenvectors = np.linalg.eig(propagation_matrix)
    imaginary = np.max(np.abs(np.imag(eigenvalues)), initial=0.0)
    if imaginary > 1.0e-8:
        speeds = tuple(float(value.real) for value in eigenvalues)
    else:
        speeds = tuple(
            float(value)
            for value in sorted(np.real(eigenvalues).tolist())
        )
    positive = sum(value > speed_tolerance for value in speeds)
    negative = sum(value < -speed_tolerance for value in speeds)
    zero = len(speeds) - positive - negative
    basis_rank = int(np.linalg.matrix_rank(eigenvectors, tol=1.0e-8))
    condition = float(np.linalg.cond(eigenvectors))
    diagonalizable = bool(
        imaginary <= 1.0e-8
        and basis_rank == propagation_matrix.shape[0]
        and math.isfinite(condition)
    )
    return speeds, positive, negative, zero, basis_rank, condition, diagonalizable


def linearized_fo_ccz4_constraint_closure_matrices_3d(
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
    max_iterations: int = 8,
) -> FOCCZ4ConstraintClosureMatrices3D:
    """Return the completed row space and restricted propagation operator."""

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
    if not isinstance(max_iterations, int) or max_iterations < 1:
        raise ValueError("max_iterations must be a positive integer")

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
    principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    direct_error = float(np.max(np.abs(principal - direct)))
    initial_rows = _candidate_projection_rows(
        normal_axis=normal_axis,
        effective_wave_number=raw.effective_wave_number,
    )
    completed_rows, propagation_matrix, iterations, residual = _complete_invariant_rows(
        initial_rows,
        principal,
        rank_tolerance=rank_tolerance,
        closure_tolerance=closure_tolerance,
        max_iterations=max_iterations,
    )
    return FOCCZ4ConstraintClosureMatrices3D(
        normal_axis=normal_axis,
        effective_wave_number=raw.effective_wave_number,
        principal_matrix=principal,
        initial_rows=initial_rows,
        completed_rows=completed_rows,
        propagation_matrix=propagation_matrix,
        completion_iterations=iterations,
        normalized_closure_residual_l_inf=residual,
        direct_symbol_crosscheck_error_l_inf=direct_error,
    )


def linearized_fo_ccz4_constraint_closure_shadow_3d(
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
    max_iterations: int = 8,
) -> FOCCZ4ConstraintClosureShadow3D:
    """Complete the candidate constraint rows under the frozen principal symbol."""

    matrices = linearized_fo_ccz4_constraint_closure_matrices_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
        rank_tolerance=rank_tolerance,
        closure_tolerance=closure_tolerance,
        max_iterations=max_iterations,
    )
    initial_rows = matrices.initial_rows
    completed_rows = matrices.completed_rows
    propagation_matrix = matrices.propagation_matrix
    principal = matrices.principal_matrix
    direct_error = matrices.direct_symbol_crosscheck_error_l_inf
    residual = matrices.normalized_closure_residual_l_inf
    (
        characteristic_speeds,
        positive_speed_count,
        negative_speed_count,
        zero_speed_count,
        characteristic_basis_rank,
        characteristic_basis_condition_number,
        characteristic_diagonalizable,
    ) = _characteristic_census(
        propagation_matrix,
        speed_tolerance=rank_tolerance,
    )
    finite = all(math.isfinite(value) for value in (direct_error, residual))
    validated = bool(
        finite
        and direct_error <= 1.0e-8
        and residual <= closure_tolerance
    )
    return FOCCZ4ConstraintClosureShadow3D(
        normal_axis=normal_axis,
        effective_wave_number=matrices.effective_wave_number,
        variable_count=int(principal.shape[0]),
        initial_constraint_count=int(initial_rows.shape[0]),
        initial_projection_rank=_rank(initial_rows, rank_tolerance),
        completed_constraint_count=int(completed_rows.shape[0]),
        completed_constraint_rank=_rank(completed_rows, rank_tolerance),
        completion_iterations=matrices.completion_iterations,
        added_constraint_count=int(completed_rows.shape[0] - initial_rows.shape[0]),
        normalized_closure_residual_l_inf=residual,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        characteristic_speeds=characteristic_speeds,
        positive_speed_count=positive_speed_count,
        negative_speed_count=negative_speed_count,
        zero_speed_count=zero_speed_count,
        characteristic_basis_rank=characteristic_basis_rank,
        characteristic_basis_condition_number=characteristic_basis_condition_number,
        characteristic_diagonalizable=characteristic_diagonalizable,
        invariant_envelope_validated=validated,
        physical_subsidiary_equations_validated=False,
        cpbc_ready=False,
        deterministic=True,
        initial_projection_matrix_sha256=_matrix_digest(
            b"nr-k3-fo-ccz4-initial-projection-v1\0", initial_rows
        ),
        completed_constraint_matrix_sha256=_matrix_digest(
            b"nr-k3-fo-ccz4-completed-envelope-v1\0", completed_rows
        ),
        closure_operator_sha256=_matrix_digest(
            b"nr-k3-fo-ccz4-completed-propagation-v1\0", propagation_matrix
        ),
    )


__all__ = [
    "FOCCZ4ConstraintClosureMatrices3D",
    "FOCCZ4ConstraintClosureShadow3D",
    "linearized_fo_ccz4_constraint_closure_matrices_3d",
    "linearized_fo_ccz4_constraint_closure_shadow_3d",
]

"""Numerical characteristic/CPBC prerequisite audit for the FO-CCZ4 shadow.

This module consumes the exact frozen-coefficient symbol produced by
``fo_ccz4_principal_symbol`` and performs three deliberately bounded checks:

* construct the numerical characteristic basis and verify the real-speed
  reduction;
* construct the canonical numerical symmetrizer ``H = (R^{-1})* R^{-1}`` and
  measure positivity and the energy identity residual;
 * project the 69-row ordering/definition constraint map onto the incoming characteristic columns
  on both orientations and measure rank, conditioning, and a least-squares
  incoming-data map.

These are finite-dimensional numerical diagnostics.  They do not prove the
analytic strong-hyperbolicity theorem, a continuum symmetrizer, a nonlinear
constraint-preserving boundary condition, or physical black-hole validity.
No matrix or boundary map from this module is exported to the runtime.  The
69-row map is deliberately not the full Hamiltonian/momentum constraint
subsystem; the v3 frozen-map module adds those four linearized principal rows.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4CPBCAudit3D:
    """Auditable numerical characteristic and incoming-constraint summary."""

    points: int
    harmonic: int
    variable_count: int
    phase_speed_convention: str
    constraint_operator_kind: str
    contains_hamiltonian_momentum_constraints: bool
    published_speed_census_error: float
    published_speed_family_names: tuple[str, ...]
    published_gamma_driver_non_degenerate: bool
    principal_symbol_sha256: str
    characteristic_eigenvector_sha256: str
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    characteristic_diagonal_residual_l_inf: float
    principal_matrix_real_residual_l_inf: float
    symmetrizer_positive_definite: bool
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    symmetrizer_hermitian_residual_l_inf: float
    symmetrizer_energy_residual_l_inf: float
    right_incoming_mode_count: int
    right_outgoing_mode_count: int
    right_incoming_constraint_rank: int
    right_incoming_constraint_free_amplitude_count: int
    right_incoming_constraint_map_condition_number: float
    right_incoming_constraint_map_residual_l_inf: float
    left_incoming_mode_count: int
    left_outgoing_mode_count: int
    left_incoming_constraint_rank: int
    left_incoming_constraint_free_amplitude_count: int
    left_incoming_constraint_map_condition_number: float
    left_incoming_constraint_map_residual_l_inf: float
    numerical_symmetrizer_constructed: bool
    analytic_symmetrizer_validated: bool
    incoming_constraint_map_validated: bool
    physical_boundary_validated: bool
    cpbc_ready: bool
    promotion: str


def _digest_matrix(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix).tobytes(order="C"))
    return digest.hexdigest()


def _constraint_incoming_audit(
    constraint_rows: np.ndarray,
    eigenvectors: np.ndarray,
    speeds: np.ndarray,
    *,
    incoming: np.ndarray,
    rank_tolerance: float,
) -> tuple[int, int, int, int, float, float]:
    """Audit ``C R_in`` and its minimum-norm constraint-data map."""

    incoming_basis = eigenvectors[:, incoming]
    constraint_incoming = constraint_rows @ incoming_basis
    singular_values = np.linalg.svd(constraint_incoming, compute_uv=False)
    if singular_values.size == 0:
        rank = 0
        condition_number = float("inf")
    else:
        scale = max(1.0, float(singular_values[0]))
        rank = int(np.count_nonzero(singular_values > rank_tolerance * scale))
        condition_number = (
            float(singular_values[0] / singular_values[rank - 1])
            if rank > 0
            else float("inf")
        )
    pseudoinverse = np.linalg.pinv(constraint_incoming, rcond=rank_tolerance)
    map_residual = float(
        np.linalg.norm(
            constraint_incoming @ pseudoinverse @ constraint_incoming
            - constraint_incoming,
            ord=np.inf,
        )
    )
    free_amplitudes = int(incoming_basis.shape[1] - rank)
    return (
        int(np.count_nonzero(incoming)),
        int(np.count_nonzero(~incoming & (np.abs(speeds) > rank_tolerance))),
        rank,
        free_amplitudes,
        condition_number,
        map_residual,
    )


def _audit_raw_symbol(
    raw: FOCCZ4PrincipalSymbolRaw3D,
    *,
    rank_tolerance: float,
) -> FOCCZ4CPBCAudit3D:
    report = raw.report
    eigenvectors = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    symbol = np.asarray(raw.symbol, dtype=np.complex128)
    variable_count = int(eigenvectors.shape[0])
    if eigenvectors.shape != (variable_count, variable_count):
        raise ValueError("FO-CCZ4 characteristic basis is not square")
    if symbol.shape != eigenvectors.shape:
        raise ValueError("FO-CCZ4 symbol and characteristic basis disagree")
    if not math.isfinite(raw.effective_wave_number) or raw.effective_wave_number <= 0.0:
        raise ValueError("effective wave number must be finite and positive")

    basis_rank = int(np.linalg.matrix_rank(eigenvectors))
    basis_condition_number = float(np.linalg.cond(eigenvectors))
    inverse_basis = np.linalg.inv(eigenvectors)
    principal_matrix = symbol / (1j * raw.effective_wave_number)
    speeds = np.imag(eigenvalues) / raw.effective_wave_number
    principal_matrix_real_residual = float(np.max(np.abs(np.imag(principal_matrix))))
    diagonal = inverse_basis @ principal_matrix @ eigenvectors
    diagonal_residual = float(np.max(np.abs(diagonal - np.diag(speeds))))

    # The canonical symmetrizer exists algebraically whenever R is a complete
    # real-speed eigenbasis.  This is a numerical energy audit, not an
    # analytic symmetrizer proof.
    symmetrizer = inverse_basis.conj().T @ inverse_basis
    symmetrizer = 0.5 * (symmetrizer + symmetrizer.conj().T)
    symmetrizer_eigenvalues = np.linalg.eigvalsh(symmetrizer)
    symmetrizer_minimum = float(np.min(symmetrizer_eigenvalues))
    symmetrizer_maximum = float(np.max(symmetrizer_eigenvalues))
    symmetrizer_condition_number = float(
        symmetrizer_maximum / symmetrizer_minimum
        if symmetrizer_minimum > 0.0
        else float("inf")
    )
    symmetrizer_hermitian_residual = float(
        np.max(np.abs(symmetrizer - symmetrizer.conj().T))
    )
    energy_operator = symmetrizer @ principal_matrix
    energy_scale = max(1.0, float(np.linalg.norm(energy_operator, ord=np.inf)))
    symmetrizer_energy_residual = float(
        np.linalg.norm(
            energy_operator - energy_operator.conj().T,
            ord=np.inf,
        )
        / energy_scale
    )

    phase_tolerance = 1.0e-10
    # ``speeds`` are eigenvalues a of q_t = A^n partial_n q.  The physical
    # coordinate speed is -a, so a>0 enters through the right (+n) face and
    # a<0 enters through the left (-n) face.
    right_incoming = speeds > phase_tolerance
    left_incoming = speeds < -phase_tolerance
    right = _constraint_incoming_audit(
        raw.constraint_rows,
        eigenvectors,
        speeds,
        incoming=right_incoming,
        rank_tolerance=rank_tolerance,
    )
    left = _constraint_incoming_audit(
        raw.constraint_rows,
        eigenvectors,
        speeds,
        incoming=left_incoming,
        rank_tolerance=rank_tolerance,
    )
    positive = bool(
        basis_rank == variable_count
        and np.all(np.isfinite(symmetrizer_eigenvalues))
        and symmetrizer_minimum > 0.0
    )
    numerical_checks = (
        positive,
        np.isfinite(basis_condition_number),
        principal_matrix_real_residual <= 1.0e-10,
        diagonal_residual <= 1.0e-8,
        symmetrizer_energy_residual <= 1.0e-8,
        right[2] == right[0],
        left[2] == left[0],
        right[5] <= 1.0e-8,
        left[5] <= 1.0e-8,
    )
    return FOCCZ4CPBCAudit3D(
        points=report.points,
        harmonic=report.harmonic,
        variable_count=variable_count,
        phase_speed_convention=(
            "raw FO-CCZ4 principal eigenvalue a in q_t=A^n*partial_n q; "
            "physical coordinate speed is -a"
        ),
        constraint_operator_kind="ordering-definition-curl-plus-algebraic",
        contains_hamiltonian_momentum_constraints=False,
        published_speed_census_error=report.published_speed_census_error,
        published_speed_family_names=tuple(
            family.name for family in report.published_speed_family_contract
        ),
        published_gamma_driver_non_degenerate=(
            report.published_gamma_driver_non_degenerate
        ),
        principal_symbol_sha256=report.symbol_sha256,
        characteristic_eigenvector_sha256=_digest_matrix(
            b"nr-k3-fo-ccz4-cpbc-eigenvectors-v1\0", eigenvectors
        ),
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition_number,
        characteristic_diagonal_residual_l_inf=diagonal_residual,
        principal_matrix_real_residual_l_inf=principal_matrix_real_residual,
        symmetrizer_positive_definite=positive,
        symmetrizer_min_eigenvalue=symmetrizer_minimum,
        symmetrizer_max_eigenvalue=symmetrizer_maximum,
        symmetrizer_condition_number=symmetrizer_condition_number,
        symmetrizer_hermitian_residual_l_inf=symmetrizer_hermitian_residual,
        symmetrizer_energy_residual_l_inf=symmetrizer_energy_residual,
        right_incoming_mode_count=right[0],
        right_outgoing_mode_count=right[1],
        right_incoming_constraint_rank=right[2],
        right_incoming_constraint_free_amplitude_count=right[3],
        right_incoming_constraint_map_condition_number=right[4],
        right_incoming_constraint_map_residual_l_inf=right[5],
        left_incoming_mode_count=left[0],
        left_outgoing_mode_count=left[1],
        left_incoming_constraint_rank=left[2],
        left_incoming_constraint_free_amplitude_count=left[3],
        left_incoming_constraint_map_condition_number=left[4],
        left_incoming_constraint_map_residual_l_inf=left[5],
        numerical_symmetrizer_constructed=True,
        analytic_symmetrizer_validated=False,
        incoming_constraint_map_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        promotion=(
            "blocked-pending-analytic-symmetrizer-cpbc-and-physical-validation"
            if all(numerical_checks)
            else "blocked-pending-characteristic-numerical-audit"
        ),
    )


def linearized_fo_ccz4_cpbc_audit_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
) -> FOCCZ4CPBCAudit3D:
    """Run the shadow characteristic and CPBC prerequisite audit."""

    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        amplitude=amplitude,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")
    return _audit_raw_symbol(raw, rank_tolerance=rank_tolerance)


__all__ = ["FOCCZ4CPBCAudit3D", "linearized_fo_ccz4_cpbc_audit_3d"]

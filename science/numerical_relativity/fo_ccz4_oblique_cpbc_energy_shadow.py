"""Oblique-normal transport of the complete FO-CCZ4 CPBC energy candidate.

The axis audit remains the source of the frozen characteristic basis and
constraint rows.  A tensor representation transports the principal symbol,
candidate energy, and constraint row space to an arbitrary unit normal.  The
result is deliberately labelled a row-space transport shadow: it is not a
direct oblique finite-difference boundary closure, a nonlinear subsidiary
derivation, or a runtime CPBC.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal, Sequence

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import (
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_rotation_representation_3d,
)
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


ObliqueCPBCOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4ObliqueCPBCEnergyShadow3D:
    """Transported complete-system CPBC energy diagnostics."""

    points: int
    normal: tuple[float, float, float]
    orientation: ObliqueCPBCOrientation
    variable_count: int
    constraint_count: int
    incoming_mode_count: int
    outgoing_mode_count: int
    zero_mode_count: int
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    characteristic_basis_residual_l_inf: float
    incoming_constraint_rank: int
    incoming_constraint_condition_number: float
    incoming_constraint_map_residual_l_inf: float
    principal_weighted_symmetry_residual_l_inf: float
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    source_energy_log_norm: float
    homogeneous_boundary_flux_max_eigenvalue: float
    direct_symbol_crosscheck_error_l_inf: float
    rotation_covariance_residual_l_inf: float
    incoming_constraint_map_sha256: str
    deterministic: bool
    row_space_transport_validated: bool
    numerical_symmetrizer_validated: bool
    incoming_constraint_map_validated: bool
    homogeneous_boundary_energy_validated: bool
    analytic_symmetrizer_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    cpbc_ready: bool
    runtime_writeback: bool
    method: str = "fo-ccz4-oblique-row-space-cpbc-energy-shadow-v1"

    def __post_init__(self) -> None:
        if self.orientation not in ("right", "left"):
            raise ValueError("orientation must be 'right' or 'left'")
        if len(self.normal) != 3 or not all(math.isfinite(value) for value in self.normal):
            raise ValueError("normal must contain three finite components")


def _unit_normal(normal: Sequence[float] | np.ndarray) -> np.ndarray:
    vector = np.asarray(tuple(normal), dtype=np.float64)
    if vector.shape != (3,) or not np.all(np.isfinite(vector)):
        raise ValueError("normal must contain three finite components")
    length = float(np.linalg.norm(vector))
    if not math.isfinite(length) or length <= 0.0:
        raise ValueError("normal must have non-zero length")
    return vector / length


def _rotation_with_first_column(vector: np.ndarray) -> np.ndarray:
    reference = np.asarray((0.0, 1.0, 0.0), dtype=np.float64)
    if abs(float(np.dot(vector, reference))) >= 0.9:
        reference = np.asarray((0.0, 0.0, 1.0), dtype=np.float64)
    second = reference - vector * float(np.dot(reference, vector))
    second /= np.linalg.norm(second)
    return np.column_stack((vector, second, np.cross(vector, second)))


def _incoming_mask(
    speeds: np.ndarray,
    orientation: ObliqueCPBCOrientation,
    tolerance: float,
) -> np.ndarray:
    if orientation == "right":
        return speeds > tolerance
    return speeds < -tolerance


def _digest(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-oblique-row-space-cpbc-energy-v1\0")
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
    *,
    normal: Sequence[float] | np.ndarray,
    points: int = 8,
    orientation: ObliqueCPBCOrientation = "right",
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    energy_tolerance: float = 1.0e-8,
) -> FOCCZ4ObliqueCPBCEnergyShadow3D:
    """Transport the complete frozen CPBC energy candidate to ``normal``."""

    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    if not isinstance(points, int) or points < 8:
        raise ValueError("points must be an integer of at least eight")
    rank_tolerance = float(rank_tolerance)
    energy_tolerance = float(energy_tolerance)
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(energy_tolerance) or energy_tolerance <= 0.0:
        raise ValueError("energy_tolerance must be finite and positive")

    unit = _unit_normal(normal)
    rotation = _rotation_with_first_column(unit)
    representation = fo_ccz4_rotation_representation_3d(rotation)
    inverse_representation = np.linalg.inv(representation)
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=1,
        normal_axis=0,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")

    axis_principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    axis_full_generator = np.asarray(raw.full_symbol, dtype=np.complex128)
    axis_eigenbasis = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    axis_eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    axis_speeds = np.real(axis_eigenvalues / (1j * raw.effective_wave_number))
    axis_rank = int(np.linalg.matrix_rank(axis_eigenbasis, tol=rank_tolerance))
    if axis_rank != axis_eigenbasis.shape[0]:
        raise ValueError("axis characteristic basis is rank deficient")
    axis_inverse = np.linalg.inv(axis_eigenbasis)
    axis_symmetrizer = axis_inverse.conj().T @ axis_inverse

    principal = representation @ axis_principal @ inverse_representation
    full_generator = representation @ axis_full_generator @ inverse_representation
    source = full_generator - principal
    characteristic_basis = representation @ axis_eigenbasis
    characteristic_values = axis_eigenvalues / (1j * raw.effective_wave_number)
    basis_rank = int(np.linalg.matrix_rank(characteristic_basis, tol=rank_tolerance))
    basis_condition = float(np.linalg.cond(characteristic_basis))
    basis_residual = float(
        np.max(
            np.abs(
                principal @ characteristic_basis
                - characteristic_basis @ np.diag(characteristic_values)
            )
        )
    )
    symmetrizer = (
        inverse_representation.conj().T
        @ axis_symmetrizer
        @ inverse_representation
    )
    weighted = symmetrizer @ principal
    weighted_residual = float(
        np.linalg.norm(weighted - weighted.conj().T, ord=np.inf)
        / max(1.0, float(np.linalg.norm(weighted, ord=np.inf)))
    )
    h_eigenvalues, h_vectors = np.linalg.eigh(symmetrizer)
    h_min = float(np.min(h_eigenvalues))
    h_max = float(np.max(h_eigenvalues))
    h_condition = float(h_max / h_min) if h_min > 0.0 else float("inf")
    if h_min > 0.0:
        h_half = h_vectors @ np.diag(np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
        h_inv_half = h_vectors @ np.diag(1.0 / np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
        transformed_source = h_half @ source @ h_inv_half
        source_energy_log_norm = float(
            np.max(
                np.linalg.eigvalsh(
                    0.5 * (transformed_source + transformed_source.conj().T)
                )
            )
        )
    else:
        source_energy_log_norm = float("nan")

    incoming = _incoming_mask(axis_speeds, orientation, rank_tolerance)
    outgoing = (~incoming) & (np.abs(axis_speeds) > rank_tolerance)
    zero = np.abs(axis_speeds) <= rank_tolerance
    axis_constraints = np.asarray(raw.constraint_rows, dtype=np.complex128)
    axis_einstein = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=0,
        effective_wave_number=raw.effective_wave_number,
    )
    axis_constraint_rows = np.vstack((axis_constraints, axis_einstein))
    # Row-space transport is enough for rank/map diagnostics: C_n=T-independent
    # row basis times T^{-1} has exactly the same incoming amplitudes.
    constraint_rows = axis_constraint_rows @ inverse_representation
    incoming_basis = characteristic_basis[:, incoming]
    incoming_map = constraint_rows @ incoming_basis
    singular_values = np.linalg.svd(incoming_map, compute_uv=False)
    scale = max(1.0, float(singular_values[0])) if singular_values.size else 1.0
    incoming_rank = int(np.count_nonzero(singular_values > rank_tolerance * scale))
    incoming_condition = (
        float(singular_values[0] / singular_values[incoming_rank - 1])
        if incoming_rank > 0
        else float("inf")
    )
    pseudoinverse = np.linalg.pinv(incoming_map, rcond=rank_tolerance)
    map_residual = float(
        np.linalg.norm(
            incoming_map @ pseudoinverse @ incoming_map - incoming_map,
            ord=np.inf,
        )
    )
    boundary_flux = np.diag(axis_speeds[outgoing])
    if orientation == "left":
        boundary_flux = -boundary_flux
    boundary_flux_max = float(
        np.max(np.linalg.eigvalsh(boundary_flux)) if boundary_flux.size else 0.0
    )
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal=unit,
        gauge=gauge,
        config=config,
    )
    direct_error = float(np.max(np.abs(principal - direct)))
    rotation_residual = float(
        np.max(
            np.abs(
                direct
                - representation
                @ analytic_fo_ccz4_principal_matrix_3d(
                    normal_axis=0, gauge=gauge, config=config
                )
                @ inverse_representation
            )
        )
    )
    row_space_validated = bool(
        np.max(np.abs(constraint_rows @ characteristic_basis - axis_constraint_rows @ axis_eigenbasis))
        <= energy_tolerance
    )
    numerical_candidate = bool(
        basis_rank == principal.shape[0]
        and math.isfinite(basis_condition)
        and basis_residual <= energy_tolerance
        and h_min > 0.0
        and math.isfinite(h_condition)
        and weighted_residual <= energy_tolerance
        and direct_error <= energy_tolerance
        and rotation_residual <= energy_tolerance
    )
    map_validated = bool(
        row_space_validated
        and math.isfinite(incoming_condition)
        and incoming_rank == int(np.count_nonzero(incoming))
        and map_residual <= energy_tolerance
    )
    boundary_validated = bool(
        numerical_candidate
        and map_validated
        and boundary_flux_max <= energy_tolerance
    )
    return FOCCZ4ObliqueCPBCEnergyShadow3D(
        points=points,
        normal=tuple(float(value) for value in unit),
        orientation=orientation,
        variable_count=int(principal.shape[0]),
        constraint_count=int(constraint_rows.shape[0]),
        incoming_mode_count=int(np.count_nonzero(incoming)),
        outgoing_mode_count=int(np.count_nonzero(outgoing)),
        zero_mode_count=int(np.count_nonzero(zero)),
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        characteristic_basis_residual_l_inf=basis_residual,
        incoming_constraint_rank=incoming_rank,
        incoming_constraint_condition_number=incoming_condition,
        incoming_constraint_map_residual_l_inf=map_residual,
        principal_weighted_symmetry_residual_l_inf=weighted_residual,
        symmetrizer_min_eigenvalue=h_min,
        symmetrizer_max_eigenvalue=h_max,
        symmetrizer_condition_number=h_condition,
        source_energy_log_norm=source_energy_log_norm,
        homogeneous_boundary_flux_max_eigenvalue=boundary_flux_max,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        rotation_covariance_residual_l_inf=rotation_residual,
        incoming_constraint_map_sha256=_digest(incoming_map),
        deterministic=True,
        row_space_transport_validated=row_space_validated,
        numerical_symmetrizer_validated=numerical_candidate,
        incoming_constraint_map_validated=map_validated,
        homogeneous_boundary_energy_validated=boundary_validated,
        analytic_symmetrizer_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        runtime_writeback=False,
    )


__all__ = [
    "FOCCZ4ObliqueCPBCEnergyShadow3D",
    "ObliqueCPBCOrientation",
    "linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d",
]

"""Full 58-variable frozen FO-CCZ4 boundary-energy shadow.

This module closes the gap between the reduced Z4c boundary audit and the
repository's actual 58-slot FO-CCZ4 symbol.  It consumes the same numerical
characteristic basis and candidate symmetrizer as the existing audits, stacks
the ordering/definition rows with the linearized Hamiltonian and momentum
rows, and checks three facts for both faces:

* the incoming constraint map has full rank (homogeneous incoming data is
  therefore constraint-compatible);
* the candidate ``H`` makes the principal matrix Hermitian;
* setting every incoming characteristic amplitude to zero gives a
  non-positive boundary energy flux.

The source logarithmic norm is recorded as well, using the same frozen
``full_symbol - symbol`` decomposition as the source-energy audit.  This is a
complete-system *numerical candidate* boundary gate, not an analytic
symmetrizer theorem or a nonlinear CPBC.  It never supplies a runtime penalty,
physical radiative data, or scientific payload writeback.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


FullCPBCOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4FullCPBCEnergyShadow3D:
    """Complete frozen-system homogeneous CPBC energy diagnostics."""

    points: int
    harmonic: int
    normal_axis: int
    orientation: FullCPBCOrientation
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
    full_generator_decomposition_residual_l_inf: float
    homogeneous_boundary_flux_max_eigenvalue: float
    direct_symbol_crosscheck_error_l_inf: float
    incoming_constraint_map_sha256: str
    deterministic: bool
    numerical_symmetrizer_validated: bool
    incoming_constraint_map_validated: bool
    homogeneous_boundary_energy_validated: bool
    analytic_symmetrizer_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    cpbc_ready: bool
    runtime_writeback: bool
    method: str = "fo-ccz4-58-full-frozen-cpbc-energy-shadow-v1"

    def __post_init__(self) -> None:
        if self.orientation not in ("right", "left"):
            raise ValueError("orientation must be 'right' or 'left'")


def _incoming_mask(
    speeds: np.ndarray,
    orientation: FullCPBCOrientation,
    tolerance: float,
) -> np.ndarray:
    if orientation == "right":
        return speeds > tolerance
    if orientation == "left":
        return speeds < -tolerance
    raise ValueError("orientation must be 'right' or 'left'")


def _digest(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-58-full-cpbc-energy-shadow-v1\0")
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    orientation: FullCPBCOrientation = "right",
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    energy_tolerance: float = 1.0e-8,
) -> FOCCZ4FullCPBCEnergyShadow3D:
    """Audit homogeneous incoming data for one full-system face."""

    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    rank_tolerance = float(rank_tolerance)
    energy_tolerance = float(energy_tolerance)
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(energy_tolerance) or energy_tolerance <= 0.0:
        raise ValueError("energy_tolerance must be finite and positive")

    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        amplitude=amplitude,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")

    principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    full_generator = np.asarray(raw.full_symbol, dtype=np.complex128)
    source = full_generator - np.asarray(raw.symbol, dtype=np.complex128)
    decomposition = 1j * raw.effective_wave_number * principal + source
    decomposition_residual = float(np.max(np.abs(decomposition - full_generator)))

    eigenbasis = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    full_eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    characteristic_values = full_eigenvalues / (1j * raw.effective_wave_number)
    speeds = np.real(characteristic_values)
    basis_rank = int(np.linalg.matrix_rank(eigenbasis, tol=rank_tolerance))
    basis_condition = float(np.linalg.cond(eigenbasis))
    basis_residual = float(
        np.max(
            np.abs(
                principal @ eigenbasis
                - eigenbasis @ np.diag(characteristic_values)
            )
        )
    )
    inverse = np.linalg.inv(eigenbasis) if basis_rank == eigenbasis.shape[0] else None
    if inverse is None:
        symmetrizer = np.zeros_like(principal)
        h_eigenvalues = np.zeros(principal.shape[0], dtype=np.float64)
        weighted_residual = float("inf")
        source_energy_log_norm = float("nan")
    else:
        symmetrizer = inverse.conj().T @ inverse
        weighted = symmetrizer @ principal
        weighted_residual = float(
            np.linalg.norm(weighted - weighted.conj().T, ord=np.inf)
            / max(1.0, float(np.linalg.norm(weighted, ord=np.inf)))
        )
        h_eigenvalues, h_vectors = np.linalg.eigh(symmetrizer)
        h_positive = bool(np.min(h_eigenvalues) > 0.0)
        if h_positive:
            h_half = h_vectors @ np.diag(np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
            h_inv_half = h_vectors @ np.diag(1.0 / np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
            transformed_source = h_half @ source @ h_inv_half
            source_energy_operator = 0.5 * (
                transformed_source + transformed_source.conj().T
            )
            source_energy_log_norm = float(
                np.max(np.linalg.eigvalsh(source_energy_operator))
            )
        else:
            source_energy_log_norm = float("nan")

    incoming = _incoming_mask(speeds, orientation, rank_tolerance)
    outgoing = (~incoming) & (np.abs(speeds) > rank_tolerance)
    zero = np.abs(speeds) <= rank_tolerance
    incoming_basis = eigenbasis[:, incoming]
    ordering_rows = np.asarray(raw.constraint_rows, dtype=np.complex128)
    einstein_rows = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=normal_axis,
        effective_wave_number=raw.effective_wave_number,
    )
    constraint_rows = np.vstack((ordering_rows, einstein_rows))
    incoming_map = constraint_rows @ incoming_basis
    singular_values = np.linalg.svd(incoming_map, compute_uv=False)
    scale = max(1.0, float(singular_values[0])) if singular_values.size else 1.0
    incoming_rank = int(
        np.count_nonzero(singular_values > rank_tolerance * scale)
    )
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
    # Homogeneous incoming data is the zero map.  The characteristic energy
    # flux is diag(a) at the right face and -diag(a) at the left face for
    # q_t=A*q_n; only outgoing modes remain under this boundary map.
    outgoing_speeds = speeds[outgoing]
    boundary_flux = np.diag(outgoing_speeds)
    if orientation == "left":
        boundary_flux = -boundary_flux
    boundary_flux_max = float(
        np.max(np.linalg.eigvalsh(boundary_flux))
        if boundary_flux.size
        else 0.0
    )
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    direct_error = float(np.max(np.abs(principal - direct)))
    h_min = float(np.min(h_eigenvalues))
    h_max = float(np.max(h_eigenvalues))
    h_condition = float(h_max / h_min) if h_min > 0.0 else float("inf")
    candidate_validated = bool(
        basis_rank == principal.shape[0]
        and math.isfinite(basis_condition)
        and basis_residual <= energy_tolerance
        and np.all(np.isfinite(h_eigenvalues))
        and h_min > 0.0
        and weighted_residual <= energy_tolerance
    )
    map_validated = bool(
        math.isfinite(incoming_condition)
        and basis_rank == principal.shape[0]
        and incoming_rank == int(np.count_nonzero(incoming))
        and map_residual <= energy_tolerance
    )
    boundary_validated = bool(
        candidate_validated
        and map_validated
        and direct_error <= energy_tolerance
        and decomposition_residual <= energy_tolerance
        and boundary_flux_max <= energy_tolerance
    )
    return FOCCZ4FullCPBCEnergyShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=normal_axis,
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
        full_generator_decomposition_residual_l_inf=decomposition_residual,
        homogeneous_boundary_flux_max_eigenvalue=boundary_flux_max,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        incoming_constraint_map_sha256=_digest(incoming_map),
        deterministic=True,
        numerical_symmetrizer_validated=candidate_validated,
        incoming_constraint_map_validated=map_validated,
        homogeneous_boundary_energy_validated=boundary_validated,
        analytic_symmetrizer_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        runtime_writeback=False,
    )


__all__ = [
    "FOCCZ4FullCPBCEnergyShadow3D",
    "FullCPBCOrientation",
    "linearized_fo_ccz4_full_cpbc_energy_shadow_3d",
]

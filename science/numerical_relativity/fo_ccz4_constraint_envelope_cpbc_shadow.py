"""Frozen incoming-constraint map for the completed FO-CCZ4 envelope.

The rank-17 envelope is only the row-space closure of a candidate projection
under the frozen principal matrix.  This module measures the map from the
full-system incoming amplitudes to that algebraic envelope and records the
unconstrained incoming nullspace.  Those dimensions are not a count of
physical gravitational-radiation channels.  It is a boundary-design shadow
only: the map does not choose physical data, prove an energy estimate, or
implement a nonlinear CPBC.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_constraint_closure_shadow import (
    linearized_fo_ccz4_constraint_closure_matrices_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


CPBCEnvelopeOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4ConstraintEnvelopeCPBCShadow3D:
    """Incoming constraint-map and unconstrained-amplitude diagnostics."""

    points: int
    harmonic: int
    normal_axis: int
    orientation: CPBCEnvelopeOrientation
    phase_speed_convention: str
    variable_count: int
    envelope_constraint_count: int
    main_incoming_mode_count: int
    main_outgoing_mode_count: int
    main_zero_mode_count: int
    incoming_constraint_rank: int
    incoming_constraint_condition_number: float
    free_incoming_nullity: int
    incoming_constraint_map_residual_l_inf: float
    free_incoming_nullspace_residual_l_inf: float
    completed_envelope_closure_residual_l_inf: float
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    direct_symbol_crosscheck_error_l_inf: float
    incoming_constraint_map_sha256: str
    free_incoming_nullspace_sha256: str
    deterministic: bool
    frozen_envelope_map_validated: bool
    physical_radiative_data_validated: bool
    nonlinear_cpbc_validated: bool
    cpbc_ready: bool
    method: str = "fo-ccz4-constraint-envelope-cpbc-shadow-v2"


def _digest(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _incoming_mask(
    speeds: np.ndarray,
    orientation: CPBCEnvelopeOrientation,
    tolerance: float,
) -> np.ndarray:
    if orientation == "right":
        return speeds > tolerance
    if orientation == "left":
        return speeds < -tolerance
    raise ValueError("orientation must be 'right' or 'left'")


def linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    orientation: CPBCEnvelopeOrientation = "right",
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    crosscheck_tolerance: float = 1.0e-8,
    closure_tolerance: float = 1.0e-8,
    max_iterations: int = 8,
) -> FOCCZ4ConstraintEnvelopeCPBCShadow3D:
    """Audit incoming constraint rank and unconstrained amplitude nullity."""

    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(crosscheck_tolerance) or crosscheck_tolerance <= 0.0:
        raise ValueError("crosscheck_tolerance must be finite and positive")

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
    envelope = linearized_fo_ccz4_constraint_closure_matrices_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
        rank_tolerance=rank_tolerance,
        closure_tolerance=closure_tolerance,
        max_iterations=max_iterations,
    )
    direct_error = float(envelope.direct_symbol_crosscheck_error_l_inf)
    envelope_residual = float(envelope.normalized_closure_residual_l_inf)
    eigenvectors = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    speeds = np.imag(eigenvalues) / raw.effective_wave_number
    incoming = _incoming_mask(speeds, orientation, rank_tolerance)
    incoming_basis = eigenvectors[:, incoming]
    incoming_map = envelope.completed_rows @ incoming_basis
    singular_values = np.linalg.svd(incoming_map, compute_uv=False)
    scale = max(1.0, float(singular_values[0])) if singular_values.size else 1.0
    incoming_rank = int(
        np.count_nonzero(singular_values > rank_tolerance * scale)
    )
    condition = (
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
    _, _, vh = np.linalg.svd(incoming_map, full_matrices=True)
    free_nullspace = vh[incoming_rank:]
    nullspace_residual = float(
        np.linalg.norm(incoming_map @ free_nullspace.conj().T, ord=np.inf)
        if free_nullspace.size
        else 0.0
    )
    basis_rank = int(np.linalg.matrix_rank(eigenvectors))
    basis_condition = float(np.linalg.cond(eigenvectors))
    finite = all(
        math.isfinite(value)
        for value in (
            direct_error,
            condition,
            map_residual,
            nullspace_residual,
            envelope_residual,
            basis_condition,
        )
    )
    validated = bool(
        finite
        and direct_error <= crosscheck_tolerance
        and basis_rank == eigenvectors.shape[0]
        and map_residual <= 1.0e-8
        and nullspace_residual <= 1.0e-8
        and envelope_residual <= closure_tolerance
    )
    return FOCCZ4ConstraintEnvelopeCPBCShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        orientation=orientation,
        phase_speed_convention=(
            "raw eigenvalue a in q_t=A^n*partial_n q; physical coordinate "
            "speed is -a"
        ),
        variable_count=int(eigenvectors.shape[0]),
        envelope_constraint_count=int(envelope.completed_rows.shape[0]),
        main_incoming_mode_count=int(np.count_nonzero(incoming)),
        main_outgoing_mode_count=int(
            np.count_nonzero(~incoming & (np.abs(speeds) > rank_tolerance))
        ),
        main_zero_mode_count=int(np.count_nonzero(np.abs(speeds) <= rank_tolerance)),
        incoming_constraint_rank=incoming_rank,
        incoming_constraint_condition_number=condition,
        free_incoming_nullity=int(free_nullspace.shape[0]),
        incoming_constraint_map_residual_l_inf=map_residual,
        free_incoming_nullspace_residual_l_inf=nullspace_residual,
        completed_envelope_closure_residual_l_inf=envelope_residual,
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        incoming_constraint_map_sha256=_digest(
            b"nr-k3-fo-ccz4-envelope-incoming-map-v1\0", incoming_map
        ),
        free_incoming_nullspace_sha256=_digest(
            b"nr-k3-fo-ccz4-envelope-free-nullspace-v1\0", free_nullspace
        ),
        deterministic=True,
        frozen_envelope_map_validated=validated,
        physical_radiative_data_validated=False,
        nonlinear_cpbc_validated=False,
        cpbc_ready=False,
    )


__all__ = [
    "CPBCEnvelopeOrientation",
    "FOCCZ4ConstraintEnvelopeCPBCShadow3D",
    "linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d",
]

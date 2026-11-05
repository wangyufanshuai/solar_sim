"""Algebraic boundary-projection candidate for the FO-CCZ4 shadow.

The incoming constraint-envelope map has a nine-dimensional algebraic
nullspace after the seven measured constraint channels are removed.  This
module constructs the least-norm projector onto that nullspace for frozen
characteristic amplitudes.  The nullity is not a count of physical
gravitational-radiation channels.  It is useful for testing the linear algebra
of a future CPBC, but it deliberately does not claim a continuum energy
estimate, physical boundary data, nonlinear boundary closure, or runtime
applicability.
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
from .fo_ccz4_constraint_envelope_cpbc_shadow import _incoming_mask
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


BoundaryShadowOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4ConstraintEnvelopeBoundaryShadow3D:
    """Frozen incoming-amplitude projection diagnostics."""

    points: int
    harmonic: int
    normal_axis: int
    orientation: BoundaryShadowOrientation
    variable_count: int
    incoming_mode_count: int
    incoming_constraint_rank: int
    free_incoming_dimension: int
    projected_constraint_rank: int
    projection_idempotence_residual_l_inf: float
    projected_constraint_residual_l_inf: float
    completed_envelope_closure_residual_l_inf: float
    incoming_map_condition_number: float
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    direct_symbol_crosscheck_error_l_inf: float
    boundary_projection_sha256: str
    deterministic: bool
    algebraic_projection_validated: bool
    continuum_energy_estimate_validated: bool
    physical_radiative_data_validated: bool
    nonlinear_cpbc_validated: bool
    cpbc_ready: bool
    method: str = "fo-ccz4-constraint-envelope-boundary-shadow-v2"


def _digest(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-envelope-boundary-projection-v1\0")
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    orientation: BoundaryShadowOrientation = "right",
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
) -> FOCCZ4ConstraintEnvelopeBoundaryShadow3D:
    """Build and audit the frozen incoming constraint-nullspace projector."""

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
    projector = np.eye(incoming_basis.shape[1], dtype=np.complex128)
    projector -= pseudoinverse @ incoming_map
    idempotence = float(
        np.linalg.norm(projector @ projector - projector, ord=np.inf)
    )
    projected_constraint = float(
        np.linalg.norm(incoming_map @ projector, ord=np.inf)
    )
    projector_rank = int(np.linalg.matrix_rank(projector, tol=rank_tolerance))
    basis_rank = int(np.linalg.matrix_rank(eigenvectors))
    basis_condition = float(np.linalg.cond(eigenvectors))
    direct_error = float(envelope.direct_symbol_crosscheck_error_l_inf)
    envelope_residual = float(envelope.normalized_closure_residual_l_inf)
    finite = all(
        math.isfinite(value)
        for value in (
            condition,
            idempotence,
            projected_constraint,
            envelope_residual,
            basis_condition,
            direct_error,
        )
    )
    validated = bool(
        finite
        and direct_error <= crosscheck_tolerance
        and basis_rank == eigenvectors.shape[0]
        and incoming_rank == 7
        and projector_rank == incoming_basis.shape[1] - incoming_rank
        and idempotence <= 1.0e-8
        and projected_constraint <= 1.0e-8
        and envelope_residual <= closure_tolerance
    )
    return FOCCZ4ConstraintEnvelopeBoundaryShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        orientation=orientation,
        variable_count=int(eigenvectors.shape[0]),
        incoming_mode_count=int(incoming_basis.shape[1]),
        incoming_constraint_rank=incoming_rank,
        free_incoming_dimension=int(incoming_basis.shape[1] - incoming_rank),
        projected_constraint_rank=projector_rank,
        projection_idempotence_residual_l_inf=idempotence,
        projected_constraint_residual_l_inf=projected_constraint,
        completed_envelope_closure_residual_l_inf=envelope_residual,
        incoming_map_condition_number=condition,
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        boundary_projection_sha256=_digest(projector),
        deterministic=True,
        algebraic_projection_validated=validated,
        continuum_energy_estimate_validated=False,
        physical_radiative_data_validated=False,
        nonlinear_cpbc_validated=False,
        cpbc_ready=False,
    )


__all__ = [
    "BoundaryShadowOrientation",
    "FOCCZ4ConstraintEnvelopeBoundaryShadow3D",
    "linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d",
]

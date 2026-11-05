"""Energy-stable boundary shadow for the reduced linearized Z4c system.

The ten-state system in :mod:`fo_ccz4_subsidiary_shadow` has an explicit
diagonal symmetrizer.  This module turns that fact into a frozen, homogeneous
maximally-dissipative boundary audit.  Characteristic amplitudes are built in
an ``H``-orthonormal basis, so the boundary energy flux is a diagonal signed
sum of characteristic speeds.  Zero incoming constraint data then gives a
non-positive energy rate at either face; an optional scalar reflection factor
is accepted only when the corresponding weighted flux remains dissipative.

This is intentionally narrower than a formulation-level CPBC.  It excludes
the lower-order source terms from the principal boundary estimate, does not
map the result to the 58-variable FO-CCZ4 characteristic fields, and does not
provide physical radiative data.  The report therefore never enables runtime
writeback or promotion.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .fo_ccz4_subsidiary_shadow import (
    SUBSIDIARY_STATE_ORDER,
    linearized_z4c_subsidiary_shadow_3d,
)


SubsidiaryCPBCOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4SubsidiaryCPBCShadow3D:
    """Frozen energy and characteristic audit for one subsidiary boundary."""

    normal_axis: int
    lapse: float
    shift_normal: float
    orientation: SubsidiaryCPBCOrientation
    reflection_coefficient: float
    state_order: tuple[str, ...]
    characteristic_speeds: tuple[float, ...]
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    characteristic_inverse_residual_l_inf: float
    weighted_principal_symmetry_residual_l_inf: float
    incoming_mode_count: int
    outgoing_mode_count: int
    zero_mode_count: int
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    source_energy_log_norm: float
    source_growth_bound_validated: bool
    boundary_map_rank: int
    boundary_map_residual_l_inf: float
    boundary_energy_rate_max_eigenvalue: float
    homogeneous_maximally_dissipative_validated: bool
    subsidiary_shadow_closed: bool
    source_terms_excluded: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    cpbc_ready: bool
    deterministic: bool
    boundary_map_sha256: str
    method: str = "z4c-linearized-subsidiary-maximally-dissipative-shadow-v1"

    def __post_init__(self) -> None:
        if tuple(self.state_order) != SUBSIDIARY_STATE_ORDER:
            raise ValueError("state_order must use the canonical subsidiary ordering")
        if self.orientation not in ("right", "left"):
            raise ValueError("orientation must be 'right' or 'left'")


def _digest(boundary_map: np.ndarray, speeds: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-z4c-linearized-subsidiary-cpbc-v1\0")
    digest.update(np.ascontiguousarray(boundary_map, dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(speeds, dtype=np.float64).tobytes())
    return digest.hexdigest()


def _incoming_mask(
    speeds: np.ndarray,
    orientation: SubsidiaryCPBCOrientation,
    tolerance: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if orientation == "right":
        incoming = speeds > tolerance
        outgoing = speeds < -tolerance
    elif orientation == "left":
        incoming = speeds < -tolerance
        outgoing = speeds > tolerance
    else:
        raise ValueError("orientation must be 'right' or 'left'")
    zero = ~(incoming | outgoing)
    return incoming, outgoing, zero


def linearized_z4c_subsidiary_cpbc_shadow_3d(
    *,
    normal_axis: int = 0,
    lapse: float = 1.0,
    shift_normal: float = 0.0,
    effective_wave_number: float = 1.0,
    orientation: SubsidiaryCPBCOrientation = "right",
    reflection_coefficient: float = 0.0,
    speed_tolerance: float = 1.0e-10,
    closure_tolerance: float = 1.0e-10,
    energy_tolerance: float = 1.0e-10,
) -> FOCCZ4SubsidiaryCPBCShadow3D:
    """Audit a homogeneous/reflected maximally-dissipative boundary.

    The convention is the same as the subsidiary module: ``q_t = A q_n + S q``
    and the physical coordinate speed is ``-a`` for an eigenvalue ``a`` of
    ``A``.  At a right face, ``a>0`` is incoming; at a left face, ``a<0`` is
    incoming.  The boundary map is ``w_in = rho w_out`` when the two mode
    counts agree and ``rho`` is nonzero; ``rho=0`` is the homogeneous map and
    is allowed even when a nonzero shift makes the counts unequal.
    """

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    lapse = float(lapse)
    shift_normal = float(shift_normal)
    effective_wave_number = float(effective_wave_number)
    reflection_coefficient = float(reflection_coefficient)
    speed_tolerance = float(speed_tolerance)
    closure_tolerance = float(closure_tolerance)
    energy_tolerance = float(energy_tolerance)
    if not math.isfinite(lapse) or lapse <= 0.0:
        raise ValueError("lapse must be finite and positive")
    if not math.isfinite(shift_normal):
        raise ValueError("shift_normal must be finite")
    if not math.isfinite(effective_wave_number) or effective_wave_number <= 0.0:
        raise ValueError("effective_wave_number must be finite and positive")
    if not math.isfinite(reflection_coefficient) or reflection_coefficient < 0.0:
        raise ValueError("reflection_coefficient must be finite and non-negative")
    if not math.isfinite(speed_tolerance) or speed_tolerance <= 0.0:
        raise ValueError("speed_tolerance must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
    if not math.isfinite(energy_tolerance) or energy_tolerance <= 0.0:
        raise ValueError("energy_tolerance must be finite and positive")

    subsidiary = linearized_z4c_subsidiary_shadow_3d(
        normal_axis=normal_axis,
        lapse=lapse,
        shift_normal=shift_normal,
        effective_wave_number=effective_wave_number,
        closure_tolerance=closure_tolerance,
    )
    count = len(SUBSIDIARY_STATE_ORDER)
    weights = np.ones(count, dtype=np.float64)
    weights[SUBSIDIARY_STATE_ORDER.index("M_n")] = 4.0
    symmetrizer = np.diag(weights)
    sqrt_h = np.diag(np.sqrt(weights))
    inv_sqrt_h = np.diag(1.0 / np.sqrt(weights))
    symmetric_principal = sqrt_h @ subsidiary.principal_matrix @ inv_sqrt_h
    symmetry_residual = float(
        np.linalg.norm(
            symmetric_principal - symmetric_principal.T,
            ord=np.inf,
        )
        / max(1.0, float(np.linalg.norm(symmetric_principal, ord=np.inf)))
    )
    if symmetry_residual > energy_tolerance:
        raise ValueError("subsidiary principal matrix is not H-symmetric")

    speeds, orthogonal_vectors = np.linalg.eigh(symmetric_principal)
    # q = R w and w = T q, with T R = I and R^T H R = I.
    right_basis = inv_sqrt_h @ orthogonal_vectors
    left_basis = orthogonal_vectors.T @ sqrt_h
    inverse_residual = float(
        np.linalg.norm(left_basis @ right_basis - np.eye(count), ord=np.inf)
    )
    basis_rank = int(np.linalg.matrix_rank(right_basis))
    basis_condition = float(np.linalg.cond(right_basis))
    incoming, outgoing, zero = _incoming_mask(
        speeds,
        orientation,
        speed_tolerance,
    )
    incoming_speeds = speeds[incoming]
    outgoing_speeds = speeds[outgoing]
    incoming_count = int(np.count_nonzero(incoming))
    outgoing_count = int(np.count_nonzero(outgoing))
    if reflection_coefficient > 0.0 and incoming_count != outgoing_count:
        raise ValueError(
            "nonzero reflection_coefficient requires equal incoming/outgoing counts"
        )
    boundary_map = np.zeros((incoming_count, outgoing_count), dtype=np.float64)
    if reflection_coefficient > 0.0:
        boundary_map = reflection_coefficient * np.eye(
            incoming_count,
            outgoing_count,
            dtype=np.float64,
        )
    boundary_map_rank = int(np.linalg.matrix_rank(boundary_map)) if boundary_map.size else 0
    boundary_map_residual = float(
        np.linalg.norm(
            boundary_map
            - boundary_map
            @ np.linalg.pinv(boundary_map, rcond=speed_tolerance)
            @ boundary_map,
            ord=np.inf,
        )
        if boundary_map.size
        else 0.0
    )
    # The incoming amplitudes are a linear function of outgoing amplitudes.
    # At the right face E_t contributes F; at the left face it contributes -F.
    outgoing_flux = np.diag(outgoing_speeds)
    incoming_flux = np.diag(incoming_speeds)
    flux_on_outgoing = (
        outgoing_flux + boundary_map.T @ incoming_flux @ boundary_map
    )
    energy_rate_operator = (
        flux_on_outgoing if orientation == "right" else -flux_on_outgoing
    )
    rate_eigenvalues = (
        np.linalg.eigvalsh(0.5 * (energy_rate_operator + energy_rate_operator.T))
        if energy_rate_operator.size
        else np.zeros(0, dtype=np.float64)
    )
    rate_max = float(np.max(rate_eigenvalues)) if rate_eigenvalues.size else 0.0
    positive_weights = np.linalg.eigvalsh(symmetrizer)
    source_transformed = sqrt_h @ subsidiary.source_matrix @ inv_sqrt_h
    source_energy_operator = 0.5 * (
        source_transformed + source_transformed.T
    )
    source_energy_log_norm = float(np.max(np.linalg.eigvalsh(source_energy_operator)))
    source_growth_bound_validated = bool(math.isfinite(source_energy_log_norm))
    finite = all(
        math.isfinite(value)
        for value in (
            symmetry_residual,
            inverse_residual,
            basis_condition,
            boundary_map_residual,
            rate_max,
            source_energy_log_norm,
        )
    )
    validated = bool(
        finite
        and basis_rank == count
        and np.min(positive_weights) > 0.0
        and symmetry_residual <= energy_tolerance
        and inverse_residual <= energy_tolerance
        and boundary_map_residual <= energy_tolerance
        and rate_max <= energy_tolerance
        and subsidiary.principal_closed
    )
    return FOCCZ4SubsidiaryCPBCShadow3D(
        normal_axis=normal_axis,
        lapse=lapse,
        shift_normal=shift_normal,
        orientation=orientation,
        reflection_coefficient=reflection_coefficient,
        state_order=SUBSIDIARY_STATE_ORDER,
        characteristic_speeds=tuple(float(value) for value in speeds),
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        characteristic_inverse_residual_l_inf=inverse_residual,
        weighted_principal_symmetry_residual_l_inf=symmetry_residual,
        incoming_mode_count=incoming_count,
        outgoing_mode_count=outgoing_count,
        zero_mode_count=int(np.count_nonzero(zero)),
        symmetrizer_min_eigenvalue=float(np.min(positive_weights)),
        symmetrizer_max_eigenvalue=float(np.max(positive_weights)),
        symmetrizer_condition_number=float(
            np.max(positive_weights) / np.min(positive_weights)
        ),
        source_energy_log_norm=source_energy_log_norm,
        source_growth_bound_validated=source_growth_bound_validated,
        boundary_map_rank=boundary_map_rank,
        boundary_map_residual_l_inf=boundary_map_residual,
        boundary_energy_rate_max_eigenvalue=rate_max,
        homogeneous_maximally_dissipative_validated=validated,
        subsidiary_shadow_closed=bool(subsidiary.principal_closed),
        source_terms_excluded=True,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        deterministic=True,
        boundary_map_sha256=_digest(boundary_map, speeds),
    )


__all__ = [
    "FOCCZ4SubsidiaryCPBCShadow3D",
    "SubsidiaryCPBCOrientation",
    "linearized_z4c_subsidiary_cpbc_shadow_3d",
]

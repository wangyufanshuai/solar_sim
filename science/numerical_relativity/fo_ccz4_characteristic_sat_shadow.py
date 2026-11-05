"""Frozen FO-CCZ4 characteristic SAT/CPBC candidate.

This module turns the already audited frozen principal symbol into an explicit
finite-dimensional incoming-mode penalty operator.  The operator removes the
constraint-carrying part of the incoming characteristic amplitudes and leaves
the Euclidean kernel of the incoming constraint map untouched.  With the
canonical numerical energy ``H=(R^-1)^*R^-1`` this projection is dissipative.

It is intentionally a shadow boundary object: it is not a variable-coefficient
finite-difference closure, a nonlinear subsidiary-system derivation, a
physical outer boundary, or a runtime writeback path.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import math
from typing import Literal

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


CharacteristicSATOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4CharacteristicSATShadow3D:
    """One frozen characteristic incoming-mode penalty audit."""

    points: int
    harmonic: int
    normal_axis: int
    orientation: CharacteristicSATOrientation
    penalty_strength: float
    variable_count: int
    incoming_mode_count: int
    outgoing_mode_count: int
    zero_mode_count: int
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    incoming_constraint_rank: int
    incoming_constraint_free_amplitude_count: int
    incoming_constraint_map_residual_l_inf: float
    free_incoming_constraint_residual_l_inf: float
    energy_penalty_max_eigenvalue: float
    h_penalty_adjoint_residual_l_inf: float
    incoming_projector_residual_l_inf: float
    sat_operator_sha256: str
    deterministic: bool
    frozen_characteristic_operator_validated: bool
    analytic_symmetrizer_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    cpbc_ready: bool
    runtime_writeback: bool
    sat_operator: np.ndarray | None = field(default=None, repr=False, compare=False)
    method: str = "fo-ccz4-frozen-characteristic-constraint-sat-shadow-v1"

    def __post_init__(self) -> None:
        if self.orientation not in ("right", "left"):
            raise ValueError("orientation must be 'right' or 'left'")
        if self.sat_operator is not None:
            operator = np.asarray(self.sat_operator, dtype=np.complex128)
            if operator.shape != (self.variable_count, self.variable_count):
                raise ValueError("sat_operator shape must match variable_count")
            if not np.all(np.isfinite(operator)):
                raise ValueError("sat_operator must be finite")
            object.__setattr__(self, "sat_operator", operator)


def _incoming_mask(
    speeds: np.ndarray,
    orientation: CharacteristicSATOrientation,
    tolerance: float,
) -> np.ndarray:
    if orientation == "right":
        return speeds > tolerance
    if orientation == "left":
        return speeds < -tolerance
    raise ValueError("orientation must be 'right' or 'left'")


def _rank_and_condition(matrix: np.ndarray, tolerance: float) -> tuple[int, float]:
    singular_values = np.linalg.svd(matrix, compute_uv=False)
    if singular_values.size == 0:
        return 0, float("inf")
    scale = max(1.0, float(singular_values[0]))
    rank = int(np.count_nonzero(singular_values > tolerance * scale))
    condition = (
        float(singular_values[0] / singular_values[rank - 1])
        if rank > 0
        else float("inf")
    )
    return rank, condition


def _matrix_digest(matrix: np.ndarray, *, orientation: str, strength: float) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-characteristic-sat-v1\0")
    digest.update(orientation.encode("ascii"))
    digest.update(np.asarray([strength], dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _invalid_report(
    raw: FOCCZ4PrincipalSymbolRaw3D,
    *,
    orientation: CharacteristicSATOrientation,
    penalty_strength: float,
    incoming_mode_count: int,
    outgoing_mode_count: int,
    zero_mode_count: int,
    basis_rank: int,
    basis_condition: float,
) -> FOCCZ4CharacteristicSATShadow3D:
    return FOCCZ4CharacteristicSATShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        orientation=orientation,
        penalty_strength=penalty_strength,
        variable_count=len(raw.full_eigenvalues),
        incoming_mode_count=incoming_mode_count,
        outgoing_mode_count=outgoing_mode_count,
        zero_mode_count=zero_mode_count,
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        incoming_constraint_rank=0,
        incoming_constraint_free_amplitude_count=incoming_mode_count,
        incoming_constraint_map_residual_l_inf=float("inf"),
        free_incoming_constraint_residual_l_inf=float("inf"),
        energy_penalty_max_eigenvalue=float("inf"),
        h_penalty_adjoint_residual_l_inf=float("inf"),
        incoming_projector_residual_l_inf=float("inf"),
        sat_operator_sha256=_matrix_digest(
            np.zeros((len(raw.full_eigenvalues), len(raw.full_eigenvalues))),
            orientation=orientation,
            strength=penalty_strength,
        ),
        deterministic=True,
        frozen_characteristic_operator_validated=False,
        analytic_symmetrizer_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        runtime_writeback=False,
        sat_operator=np.zeros(
            (len(raw.full_eigenvalues), len(raw.full_eigenvalues)),
            dtype=np.complex128,
        ),
    )


def linearized_fo_ccz4_characteristic_sat_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    orientation: CharacteristicSATOrientation = "right",
    penalty_strength: float = 1.0,
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    energy_tolerance: float = 1.0e-8,
) -> FOCCZ4CharacteristicSATShadow3D:
    """Construct and audit a frozen characteristic incoming-mode SAT map."""

    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    strength = float(penalty_strength)
    rank_tolerance = float(rank_tolerance)
    energy_tolerance = float(energy_tolerance)
    if not math.isfinite(strength) or strength <= 0.0:
        raise ValueError("penalty_strength must be finite and positive")
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

    eigenvectors = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    variable_count = int(eigenvectors.shape[0])
    characteristic_values = eigenvalues / (1j * raw.effective_wave_number)
    speeds = np.real(characteristic_values)
    speed_tolerance = 1.0e-10
    incoming = _incoming_mask(speeds, orientation, speed_tolerance)
    incoming_count = int(np.count_nonzero(incoming))
    outgoing_count = int(np.count_nonzero(~incoming & (np.abs(speeds) > speed_tolerance)))
    zero_count = int(np.count_nonzero(np.abs(speeds) <= speed_tolerance))
    basis_rank = int(np.linalg.matrix_rank(eigenvectors, tol=rank_tolerance))
    basis_condition = float(np.linalg.cond(eigenvectors))
    if basis_rank != variable_count:
        return _invalid_report(
            raw,
            orientation=orientation,
            penalty_strength=strength,
            incoming_mode_count=incoming_count,
            outgoing_mode_count=outgoing_count,
            zero_mode_count=zero_count,
            basis_rank=basis_rank,
            basis_condition=basis_condition,
        )

    inverse = np.linalg.inv(eigenvectors)
    symmetrizer = inverse.conj().T @ inverse
    symmetrizer = 0.5 * (symmetrizer + symmetrizer.conj().T)
    incoming_basis = eigenvectors[:, incoming]
    incoming_coordinates = inverse[incoming, :]
    constraint_incoming = np.asarray(raw.constraint_rows) @ incoming_basis
    incoming_rank, _ = _rank_and_condition(constraint_incoming, rank_tolerance)
    constraint_projector = np.linalg.pinv(
        constraint_incoming, rcond=rank_tolerance
    ) @ constraint_incoming
    constrained_amplitude_residual = float(
        np.linalg.norm(
            constraint_incoming @ constraint_projector - constraint_incoming,
            ord=np.inf,
        )
    )
    free_amplitude_projector = np.eye(incoming_count, dtype=np.complex128) - constraint_projector
    incoming_projector = incoming_basis @ incoming_coordinates
    constrained_projector = (
        incoming_basis @ constraint_projector @ incoming_coordinates
    )
    free_projector = incoming_basis @ free_amplitude_projector @ incoming_coordinates
    free_constraint_residual = float(
        np.linalg.norm(np.asarray(raw.constraint_rows) @ free_projector, ord=np.inf)
    )
    projector_residual = float(
        np.linalg.norm(
            incoming_projector @ incoming_projector - incoming_projector,
            ord=np.inf,
        )
    )
    sat_operator = -strength * constrained_projector
    h_penalty_adjoint = symmetrizer @ sat_operator - sat_operator.conj().T @ symmetrizer
    h_penalty_adjoint_residual = float(np.linalg.norm(h_penalty_adjoint, ord=np.inf))
    energy_penalty = 0.5 * (
        symmetrizer @ sat_operator
        + (symmetrizer @ sat_operator).conj().T
    )
    energy_eigenvalues = np.linalg.eigvalsh(energy_penalty)
    energy_max = float(np.max(np.real(energy_eigenvalues)))
    validated = bool(
        incoming_count > 0
        and incoming_rank == incoming_count
        and constrained_amplitude_residual <= energy_tolerance
        and free_constraint_residual <= energy_tolerance
        and projector_residual <= energy_tolerance
        and h_penalty_adjoint_residual <= energy_tolerance
        and energy_max <= energy_tolerance
        and np.all(np.isfinite(energy_eigenvalues))
    )
    return FOCCZ4CharacteristicSATShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        orientation=orientation,
        penalty_strength=strength,
        variable_count=variable_count,
        incoming_mode_count=incoming_count,
        outgoing_mode_count=outgoing_count,
        zero_mode_count=zero_count,
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=basis_condition,
        incoming_constraint_rank=incoming_rank,
        incoming_constraint_free_amplitude_count=int(
            incoming_count - incoming_rank
        ),
        incoming_constraint_map_residual_l_inf=constrained_amplitude_residual,
        free_incoming_constraint_residual_l_inf=free_constraint_residual,
        energy_penalty_max_eigenvalue=energy_max,
        h_penalty_adjoint_residual_l_inf=h_penalty_adjoint_residual,
        incoming_projector_residual_l_inf=projector_residual,
        sat_operator_sha256=_matrix_digest(
            sat_operator,
            orientation=orientation,
            strength=strength,
        ),
        deterministic=True,
        frozen_characteristic_operator_validated=validated,
        analytic_symmetrizer_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        cpbc_ready=False,
        runtime_writeback=False,
        sat_operator=sat_operator,
    )


__all__ = [
    "CharacteristicSATOrientation",
    "FOCCZ4CharacteristicSATShadow3D",
    "linearized_fo_ccz4_characteristic_sat_shadow_3d",
]

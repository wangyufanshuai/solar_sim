"""Transport the FO-CCZ4 numerical symmetrizer to oblique normals.

The source candidate is the existing finite-difference frozen-symbol
symmetrizer at the Cartesian x normal.  Tensor rotation transports that
candidate to an analytic flat-background symbol at an arbitrary unit normal.
This is a reproducible finite-dimensional shadow contract, not an analytic
uniform symmetrizer, a nonlinear CPBC, or a runtime boundary operator.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Sequence

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import (
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_rotation_representation_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_symmetrizer_shadow import (
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)


@dataclass(frozen=True)
class FOCCZ4RotatedSymmetrizerShadow3D:
    """One transported numerical symmetrizer candidate at a unit normal."""

    points: int
    normal: tuple[float, float, float]
    variable_count: int
    principal_matrix: np.ndarray
    rotation_matrix: np.ndarray
    tensor_representation: np.ndarray
    symmetrizer: np.ndarray
    weighted_principal_matrix: np.ndarray
    source_axis_symmetrizer_condition_number: float
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    symmetrizer_condition_number_limit: float
    symmetrizer_condition_bound_validated: bool
    axis_symbol_crosscheck_residual_l_inf: float
    rotation_covariance_residual_l_inf: float
    weighted_principal_symmetry_residual_l_inf: float
    source_axis_principal_imaginary_l_inf: float
    source_axis_candidate_validated: bool
    numerical_candidate_validated: bool
    analytic_symmetrizer_validated: bool
    parameter_sweep_validated: bool
    cpbc_ready: bool
    deterministic: bool
    method: str = "fo-ccz4-rotated-numerical-symmetrizer-shadow-v1"

    def __post_init__(self) -> None:
        count = int(self.variable_count)
        if count <= 0:
            raise ValueError("variable_count must be positive")
        for name, expected in (
            ("principal_matrix", (count, count)),
            ("rotation_matrix", (3, 3)),
            ("tensor_representation", (count, count)),
            ("symmetrizer", (count, count)),
            ("weighted_principal_matrix", (count, count)),
        ):
            value = np.asarray(getattr(self, name))
            if value.shape != expected:
                raise ValueError(f"{name} must have shape {expected}")
            if not np.all(np.isfinite(value)):
                raise ValueError(f"{name} must be finite")
            object.__setattr__(self, name, value)
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
    third = np.cross(vector, second)
    return np.column_stack((vector, second, third))


def rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
    *,
    normal: Sequence[float] | np.ndarray,
    points: int = 8,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    condition_number_limit: float = 1.0e10,
    residual_tolerance: float = 1.0e-8,
) -> FOCCZ4RotatedSymmetrizerShadow3D:
    """Build a rotated numerical symmetrizer candidate at ``normal``."""

    if not isinstance(points, int) or points < 8:
        raise ValueError("points must be an integer of at least eight")
    condition_number_limit = float(condition_number_limit)
    residual_tolerance = float(residual_tolerance)
    if not math.isfinite(condition_number_limit) or condition_number_limit <= 0.0:
        raise ValueError("condition_number_limit must be finite and positive")
    if not math.isfinite(residual_tolerance) or residual_tolerance <= 0.0:
        raise ValueError("residual_tolerance must be finite and positive")

    unit = _unit_normal(normal)
    rotation = _rotation_with_first_column(unit)
    representation = fo_ccz4_rotation_representation_3d(rotation)
    inverse_representation = np.linalg.inv(representation)
    source = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
        points=points,
        normal_axis=0,
        gauge=gauge,
        config=config,
        condition_number_limit=condition_number_limit,
    )
    axis_symbol = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=0,
        gauge=gauge,
        config=config,
    )
    principal = analytic_fo_ccz4_principal_matrix_3d(
        normal=unit,
        gauge=gauge,
        config=config,
    )
    axis_symbol_crosscheck = float(
        np.max(np.abs(source.principal_matrix - axis_symbol))
    )
    rotated_axis_symbol = representation @ axis_symbol @ inverse_representation
    rotation_residual = float(np.max(np.abs(principal - rotated_axis_symbol)))

    symmetrizer = (
        inverse_representation.conj().T
        @ np.asarray(source.symmetrizer, dtype=np.complex128)
        @ inverse_representation
    )
    weighted = symmetrizer @ principal
    symmetrizer_eigenvalues = np.linalg.eigvalsh(symmetrizer)
    minimum = float(np.min(symmetrizer_eigenvalues))
    maximum = float(np.max(symmetrizer_eigenvalues))
    condition = float(maximum / minimum) if minimum > 0.0 else float("inf")
    symmetry_residual = float(
        np.linalg.norm(weighted - weighted.conj().T, ord=np.inf)
        / max(1.0, float(np.linalg.norm(weighted, ord=np.inf)))
    )
    condition_validated = bool(
        math.isfinite(condition)
        and condition > 0.0
        and condition <= condition_number_limit
    )
    candidate = bool(
        source.numerical_candidate_validated
        and axis_symbol_crosscheck <= residual_tolerance
        and rotation_residual <= residual_tolerance
        and math.isfinite(minimum)
        and minimum > 0.0
        and condition_validated
        and symmetry_residual <= residual_tolerance
    )
    return FOCCZ4RotatedSymmetrizerShadow3D(
        points=points,
        normal=tuple(float(value) for value in unit),
        variable_count=source.variable_count,
        principal_matrix=principal,
        rotation_matrix=rotation,
        tensor_representation=representation,
        symmetrizer=symmetrizer,
        weighted_principal_matrix=weighted,
        source_axis_symmetrizer_condition_number=source.symmetrizer_condition_number,
        symmetrizer_min_eigenvalue=minimum,
        symmetrizer_max_eigenvalue=maximum,
        symmetrizer_condition_number=condition,
        symmetrizer_condition_number_limit=condition_number_limit,
        symmetrizer_condition_bound_validated=condition_validated,
        axis_symbol_crosscheck_residual_l_inf=axis_symbol_crosscheck,
        rotation_covariance_residual_l_inf=rotation_residual,
        weighted_principal_symmetry_residual_l_inf=symmetry_residual,
        source_axis_principal_imaginary_l_inf=float(
            np.max(np.abs(np.imag(source.principal_matrix)))
        ),
        source_axis_candidate_validated=source.numerical_candidate_validated,
        numerical_candidate_validated=candidate,
        analytic_symmetrizer_validated=False,
        parameter_sweep_validated=False,
        cpbc_ready=False,
        deterministic=True,
    )


__all__ = [
    "FOCCZ4RotatedSymmetrizerShadow3D",
    "rotated_fo_ccz4_numerical_symmetrizer_shadow_3d",
]

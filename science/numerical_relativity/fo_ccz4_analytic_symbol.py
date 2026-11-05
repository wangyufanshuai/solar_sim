"""Independent flat-background FO-CCZ4 principal-part matrix.

This module encodes the *linearized principal part* of the current 58-slot
FO-CCZ4 shadow directly at Minkowski space, rather than extracting it from a
finite-difference Fourier probe.  It accepts an arbitrary unit normal as well
as the historical Cartesian-axis shorthand.  It is a cross-check of the
implementation and variable ordering, not a replacement for the published
continuum eigenvector/symmetrizer proof.
"""

from __future__ import annotations

import math
import numpy as np
from typing import Sequence

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_rhs import FOCCZ4Config


_VARIABLE_INDEX = {name: index for index, name in enumerate(FOCCZ4_VARIABLE_ORDER)}
_VARIABLE_COUNT = len(FOCCZ4_VARIABLE_ORDER)
_VARIABLE_INDEX = {
    name: index for index, name in enumerate(FOCCZ4_VARIABLE_ORDER)
}


def _symmetric_name(prefix: str, first: int, second: int) -> str:
    left, right = sorted((int(first), int(second)))
    return f"{prefix}{left}{right}"


def _basis(index: int) -> np.ndarray:
    result = np.zeros(_VARIABLE_COUNT, dtype=np.float64)
    result[index] = 1.0
    return result


def _h(first: int, second: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[_symmetric_name("h", first, second)])


def _a(first: int, second: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[_symmetric_name("A", first, second)])


def _aux_a(component: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[f"A{component}"])


def _b(derivative: int, component: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[f"B{derivative}{component}"])


def _d(derivative: int, first: int, second: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[f"D{derivative}{min(first, second)}{max(first, second)}"])


def _p(component: int) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[f"P{component}"])


def _base(name: str) -> np.ndarray:
    return _basis(_VARIABLE_INDEX[name])


def _zero() -> np.ndarray:
    return np.zeros(_VARIABLE_COUNT, dtype=np.float64)


def fo_ccz4_rotation_representation_3d(
    rotation: Sequence[Sequence[float]] | np.ndarray,
) -> np.ndarray:
    """Return the 58-slot tensor representation of a proper 3-D rotation.

    The representation is a bookkeeping contract for the frozen analytic
    symbol.  Symmetric slots use the repository's independent ``i <= j``
    storage, while ``D_kij`` and ``B_k^i`` rotate every tensor index.  It is
    not exported to a runtime boundary operator.
    """

    matrix = np.asarray(rotation, dtype=np.float64)
    if matrix.shape != (3, 3) or not np.all(np.isfinite(matrix)):
        raise ValueError("rotation must be a finite 3-by-3 matrix")
    if not np.allclose(
        matrix.T @ matrix, np.eye(3), rtol=0.0, atol=1.0e-12
    ):
        raise ValueError("rotation must be orthogonal")
    determinant = float(np.linalg.det(matrix))
    if not math.isclose(determinant, 1.0, rel_tol=0.0, abs_tol=1.0e-12):
        raise ValueError("rotation must have determinant +1")

    result = np.zeros((_VARIABLE_COUNT, _VARIABLE_COUNT), dtype=np.float64)

    def symmetric_slots(prefix: str) -> tuple[tuple[int, int, int], ...]:
        return tuple(
            (
                first,
                second,
                _VARIABLE_INDEX[_symmetric_name(prefix, first, second)],
            )
            for first in range(3)
            for second in range(first, 3)
        )

    def add_symmetric(prefix: str) -> None:
        slots = symmetric_slots(prefix)
        for input_first, input_second, input_slot in slots:
            tensor = np.zeros((3, 3), dtype=np.float64)
            tensor[input_first, input_second] = 1.0
            tensor[input_second, input_first] = 1.0
            if input_first == input_second:
                tensor[input_first, input_second] = 1.0
            transformed = np.einsum("ia,jb,ab->ij", matrix, matrix, tensor)
            for output_first, output_second, output_slot in slots:
                result[output_slot, input_slot] = transformed[
                    output_first, output_second
                ]

    def add_vector(prefix: str) -> None:
        for input_component in range(3):
            input_slot = _VARIABLE_INDEX[f"{prefix}{input_component}"]
            for output_component in range(3):
                output_slot = _VARIABLE_INDEX[f"{prefix}{output_component}"]
                result[output_slot, input_slot] = matrix[output_component, input_component]

    def add_mixed_rank_two() -> None:
        for input_derivative in range(3):
            for input_component in range(3):
                input_slot = _VARIABLE_INDEX[f"B{input_derivative}{input_component}"]
                for output_derivative in range(3):
                    for output_component in range(3):
                        output_slot = _VARIABLE_INDEX[
                            f"B{output_derivative}{output_component}"
                        ]
                        result[output_slot, input_slot] = (
                            matrix[output_derivative, input_derivative]
                            * matrix[output_component, input_component]
                        )

    def add_rank_three_symmetric() -> None:
        slots = tuple(
            (
                derivative,
                first,
                second,
                _VARIABLE_INDEX[f"D{derivative}{first}{second}"],
            )
            for derivative in range(3)
            for first in range(3)
            for second in range(first, 3)
        )
        for input_derivative, input_first, input_second, input_slot in slots:
            tensor = np.zeros((3, 3, 3), dtype=np.float64)
            tensor[input_derivative, input_first, input_second] = 1.0
            tensor[input_derivative, input_second, input_first] = 1.0
            if input_first == input_second:
                tensor[input_derivative, input_first, input_second] = 1.0
            transformed = np.einsum(
                "ka,ib,jc,abc->kij", matrix, matrix, matrix, tensor
            )
            for output_derivative, output_first, output_second, output_slot in slots:
                result[output_slot, input_slot] = transformed[
                    output_derivative, output_first, output_second
                ]

    add_symmetric("h")
    for scalar_name in ("ln_alpha", "ln_phi", "K", "Theta"):
        scalar_slot = _VARIABLE_INDEX[scalar_name]
        result[scalar_slot, scalar_slot] = 1.0
    add_vector("beta")
    add_symmetric("A")
    add_vector("GammaHat")
    add_vector("b")
    add_vector("A")
    add_mixed_rank_two()
    add_rank_three_symmetric()
    add_vector("P")
    return result


def fo_ccz4_frame_representation_3d(
    frame: Sequence[Sequence[float]] | np.ndarray,
) -> np.ndarray:
    """Return the 58-slot tensor map for a general local frame.

    ``frame`` contains frame vectors as rows.  Covariant indices use the
    frame map itself, while contravariant indices use its inverse transpose;
    this preserves tensor contractions for a non-orthogonal metric frame.
    For a proper orthogonal rotation this reduces exactly to
    :func:`fo_ccz4_rotation_representation_3d`.

    The result is a bookkeeping transformation only.  It does not assert
    that a transformed frozen symbol is a valid variable-coefficient
    principal operator.
    """

    matrix = np.asarray(frame, dtype=np.float64)
    if matrix.shape != (3, 3) or not np.all(np.isfinite(matrix)):
        raise ValueError("frame must be a finite 3-by-3 matrix")
    determinant = float(np.linalg.det(matrix))
    if not math.isfinite(determinant) or abs(determinant) <= 1.0e-14:
        raise ValueError("frame must be invertible")
    covector_matrix = matrix
    vector_matrix = np.linalg.inv(matrix).T
    result = np.zeros((_VARIABLE_COUNT, _VARIABLE_COUNT), dtype=np.float64)

    def symmetric_slots(prefix: str) -> tuple[tuple[int, int, int], ...]:
        return tuple(
            (
                first,
                second,
                _VARIABLE_INDEX[_symmetric_name(prefix, first, second)],
            )
            for first in range(3)
            for second in range(first, 3)
        )

    def add_symmetric(prefix: str, factor: np.ndarray) -> None:
        slots = symmetric_slots(prefix)
        for input_first, input_second, input_slot in slots:
            tensor = np.zeros((3, 3), dtype=np.float64)
            tensor[input_first, input_second] = 1.0
            tensor[input_second, input_first] = 1.0
            if input_first == input_second:
                tensor[input_first, input_second] = 1.0
            transformed = np.einsum("ia,jb,ab->ij", factor, factor, tensor)
            for output_first, output_second, output_slot in slots:
                result[output_slot, input_slot] = transformed[
                    output_first, output_second
                ]

    def add_vector(prefix: str, factor: np.ndarray) -> None:
        for input_component in range(3):
            input_slot = _VARIABLE_INDEX[f"{prefix}{input_component}"]
            for output_component in range(3):
                output_slot = _VARIABLE_INDEX[f"{prefix}{output_component}"]
                result[output_slot, input_slot] = factor[output_component, input_component]

    def add_mixed_rank_two() -> None:
        for input_derivative in range(3):
            for input_component in range(3):
                input_slot = _VARIABLE_INDEX[f"B{input_derivative}{input_component}"]
                for output_derivative in range(3):
                    for output_component in range(3):
                        output_slot = _VARIABLE_INDEX[
                            f"B{output_derivative}{output_component}"
                        ]
                        result[output_slot, input_slot] = (
                            covector_matrix[output_derivative, input_derivative]
                            * vector_matrix[output_component, input_component]
                        )

    def add_rank_three_covariant() -> None:
        slots = tuple(
            (
                derivative,
                first,
                second,
                _VARIABLE_INDEX[f"D{derivative}{first}{second}"],
            )
            for derivative in range(3)
            for first in range(3)
            for second in range(first, 3)
        )
        for input_derivative, input_first, input_second, input_slot in slots:
            tensor = np.zeros((3, 3, 3), dtype=np.float64)
            tensor[input_derivative, input_first, input_second] = 1.0
            tensor[input_derivative, input_second, input_first] = 1.0
            if input_first == input_second:
                tensor[input_derivative, input_first, input_second] = 1.0
            transformed = np.einsum(
                "ka,ib,jc,abc->kij",
                covector_matrix,
                covector_matrix,
                covector_matrix,
                tensor,
            )
            for output_derivative, output_first, output_second, output_slot in slots:
                result[output_slot, input_slot] = transformed[
                    output_derivative, output_first, output_second
                ]

    add_symmetric("h", covector_matrix)
    for scalar_name in ("ln_alpha", "ln_phi", "K", "Theta"):
        scalar_slot = _VARIABLE_INDEX[scalar_name]
        result[scalar_slot, scalar_slot] = 1.0
    add_vector("beta", vector_matrix)
    add_symmetric("A", covector_matrix)
    add_vector("GammaHat", vector_matrix)
    add_vector("b", vector_matrix)
    add_vector("A", covector_matrix)
    add_mixed_rank_two()
    add_rank_three_covariant()
    add_vector("P", covector_matrix)
    return result


def analytic_fo_ccz4_principal_matrix_3d(
    *,
    normal_axis: int = 0,
    normal: Sequence[float] | np.ndarray | None = None,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
) -> np.ndarray:
    """Return the direct linearized principal matrix ``A(n)``.

    The convention is ``q_t = i*k*A(n)*q`` for a plane wave with unit normal
    ``n``.  ``normal`` takes precedence over the historical ``normal_axis``
    shorthand and is normalized internally.  All non-principal products,
    damping terms, and zero-order gauge terms are omitted.  The implementation
    follows the tensor contractions in :func:`fo_ccz4_rhs_3d` at
    ``alpha=chi=h=1`` and ``beta=0``.
    """

    if normal is None:
        if normal_axis not in (0, 1, 2):
            raise ValueError("normal_axis must be one of 0, 1, or 2")
        normal_vector = np.zeros(3, dtype=np.float64)
        normal_vector[normal_axis] = 1.0
    else:
        if normal_axis not in (None, 0):
            raise ValueError("pass either normal_axis or normal, not both")
        normal_vector = np.asarray(tuple(normal), dtype=np.float64)
        if normal_vector.shape != (3,) or not np.all(np.isfinite(normal_vector)):
            raise ValueError("normal must contain three finite components")
        norm = float(np.linalg.norm(normal_vector))
        if not np.isfinite(norm) or norm <= 0.0:
            raise ValueError("normal must have non-zero length")
        normal_vector = normal_vector / norm
    if not gauge.advective:
        raise ValueError("analytic FO-CCZ4 principal matrix requires advective gauge")
    if gauge.theta_coupling != 2.0 * config.c:
        raise ValueError("FO-CCZ4 requires theta_coupling=2*c")
    normal = normal_vector
    matrix = np.zeros((_VARIABLE_COUNT, _VARIABLE_COUNT), dtype=np.float64)

    def d_b_sym(component: int, first: int, second: int) -> np.ndarray:
        return 0.5 * (
            normal[first] * _b(second, component)
            + normal[second] * _b(first, component)
        )

    def d_metric_trace(axis: int) -> np.ndarray:
        result = _zero()
        for component in range(3):
            result += normal[axis] * _a(component, component)
        return result

    def conformal_christoffel(upper: int, first: int, second: int) -> np.ndarray:
        return _d(first, second, upper) + _d(second, first, upper) - _d(upper, first, second)

    def sym_d(derivative: int, field_derivative: int, first: int, second: int) -> np.ndarray:
        """Linearized ``_sym_metric_gradient`` coefficient."""

        return 0.5 * (
            normal[derivative] * _d(field_derivative, first, second)
            + normal[field_derivative] * _d(derivative, first, second)
        )

    def sym_p(derivative: int, component: int) -> np.ndarray:
        return 0.5 * (
            normal[derivative] * _p(component)
            + normal[component] * _p(derivative)
        )

    def d_conformal_christoffel(
        derivative: int, upper: int, first: int, second: int
    ) -> np.ndarray:
        return (
            sym_d(derivative, first, upper, second)
            + sym_d(derivative, second, upper, first)
            - sym_d(derivative, upper, first, second)
        )

    def d_physical_christoffel(
        derivative: int, upper: int, first: int, second: int
    ) -> np.ndarray:
        result = d_conformal_christoffel(derivative, upper, first, second)
        if second == upper:
            result -= sym_p(derivative, first)
        if first == upper:
            result -= sym_p(derivative, second)
        if first == second:
            result += sym_p(derivative, upper)
        return result

    def physical_ricci(first: int, second: int) -> np.ndarray:
        result = _zero()
        for upper in range(3):
            result += d_physical_christoffel(upper, upper, first, second)
            result -= d_physical_christoffel(second, upper, first, upper)
        return result

    def d_tilde_gamma(derivative: int, component: int) -> np.ndarray:
        result = _zero()
        for diagonal in range(3):
            result += d_conformal_christoffel(
                derivative, component, diagonal, diagonal
            )
        return result

    def ricci_z(first: int, second: int) -> np.ndarray:
        result = physical_ricci(first, second)
        cov_first_second = 0.5 * (
            normal[first] * _base(f"GammaHat{second}")
            - d_tilde_gamma(first, second)
        )
        cov_second_first = 0.5 * (
            normal[second] * _base(f"GammaHat{first}")
            - d_tilde_gamma(second, first)
        )
        return result + cov_first_second + cov_second_first

    def lapse_hessian(first: int, second: int) -> np.ndarray:
        return 0.5 * (
            normal[first] * _aux_a(second) + normal[second] * _aux_a(first)
        )

    scalar = _zero()
    for diagonal in range(3):
        scalar += ricci_z(diagonal, diagonal)
    lap_hessian = _zero()
    for diagonal in range(3):
        lap_hessian += lapse_hessian(diagonal, diagonal)
    trace_a = _zero()
    for diagonal in range(3):
        trace_a += _a(diagonal, diagonal)

    # The first eleven rows are the canonical kinematic ODE block.  Their
    # spatial principal part is identically zero at this background.

    for first in range(3):
        for second in range(first, 3):
            source = -lapse_hessian(first, second) + ricci_z(first, second)
            trace_source = -lap_hessian + scalar
            matrix[_VARIABLE_INDEX[_symmetric_name("A", first, second)]] = (
                source - (1.0 / 3.0 if first == second else 0.0) * trace_source
            )

    matrix[_VARIABLE_INDEX["K"]] = -lap_hessian + scalar
    matrix[_VARIABLE_INDEX["Theta"]] = 0.5 * config.cleaning_speed**2 * scalar

    def gamma_row(component: int) -> np.ndarray:
        result = (-4.0 / 3.0) * normal[component] * _base("K")
        result += 2.0 * normal[component] * _base("Theta")
        trace_shift = _zero()
        for first in range(3):
            for second in range(3):
                if first == second:
                    trace_shift += d_b_sym(component, first, second)
        mixed_shift = _zero()
        for second in range(3):
            mixed_shift += d_b_sym(second, component, second)
        result += config.shift_strength * trace_shift
        result += (config.shift_strength / 3.0) * mixed_shift
        result += 2.0 * config.shift_strength * normal[component] * trace_a
        return result

    for component in range(3):
        matrix[_VARIABLE_INDEX[f"b{component}"]] = config.shift_strength * gamma_row(component)
        matrix[_VARIABLE_INDEX[f"GammaHat{component}"]] = gamma_row(component)

    for derivative in range(3):
        row = (-gauge.lapse_coefficient * normal[derivative]) * _base("K")
        row += (2.0 * config.c * gauge.lapse_coefficient * normal[derivative]) * _base("Theta")
        row -= config.shift_strength * gauge.lapse_coefficient * d_metric_trace(derivative)
        matrix[_VARIABLE_INDEX[f"A{derivative}"]] = row

    def curl_p(derivative: int, component: int) -> np.ndarray:
        return normal[derivative] * _p(component) - normal[component] * _p(derivative)

    def curl_d(derivative: int, component: int) -> np.ndarray:
        result = _zero()
        for upper in range(3):
            result += normal[derivative] * _d(upper, component, upper)
            result -= normal[upper] * _d(derivative, component, upper)
        return result

    for derivative in range(3):
        for component in range(3):
            row = config.shift_strength * gauge.shift_coefficient * normal[derivative] * _base(
                f"b{component}"
            )
            row += (
                config.shift_strength
                * config.ordering_mu
                * (curl_p(derivative, component) - curl_d(derivative, component))
            )
            matrix[_VARIABLE_INDEX[f"B{derivative}{component}"]] = row

    for derivative in range(3):
        for first in range(3):
            for second in range(first, 3):
                trace_shift = _zero()
                for axis in range(3):
                    trace_shift += d_b_sym(axis, derivative, axis)
                # Only the shift-gradient terms carry shift_strength; the
                # lapse/extrinsic-curvature terms do not.  Rebuild explicitly
                # to keep this distinction visible and auditable.
                shift_part = 0.5 * (
                    d_b_sym(first, derivative, second)
                    + d_b_sym(second, derivative, first)
                )
                if first == second:
                    shift_part -= (1.0 / 3.0) * trace_shift
                nonshift_part = -normal[derivative] * _a(first, second)
                if first == second:
                    nonshift_part += (normal[derivative] / 3.0) * trace_a
                matrix[
                    _VARIABLE_INDEX[
                        f"D{derivative}{first}{second}"
                    ]
                ] = config.shift_strength * shift_part + nonshift_part

    for derivative in range(3):
        row = (normal[derivative] / 3.0) * _base("K")
        trace_shift = _zero()
        for axis in range(3):
            trace_shift += d_b_sym(axis, derivative, axis)
        row -= (config.shift_strength / 3.0) * trace_shift
        row += (config.shift_strength * normal[derivative] / 3.0) * trace_a
        matrix[_VARIABLE_INDEX[f"P{derivative}"]] = row

    return matrix


__all__ = [
    "analytic_fo_ccz4_principal_matrix_3d",
    "fo_ccz4_rotation_representation_3d",
]

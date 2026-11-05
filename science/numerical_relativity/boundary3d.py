"""Characteristic-speed and penalty-boundary shadow diagnostics for K3.

The full CCZ4/BSSN characteristic boundary system requires a formulation-
specific eigenbasis, constraint-preserving incoming data, and a stability
proof.  This module makes the missing contract explicit instead of silently
calling a scalar Sommerfeld operator a physical boundary: it audits local
principal speeds for physical, 1+log, Gamma-driver, and Z4-proxy modes, and
offers a deterministic scalar SAT-like penalty on incoming proxy modes.
``physical_boundary_validated`` and ``constraint_preserving_validated`` are
always false.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any, Literal

import numpy as np

from .ccz4_reference import GaugeConfig
from .nr3d import BSSNState3D, Grid3D


BoundaryMode3D = Literal["sommerfeld", "characteristic-proxy"]


@dataclass(frozen=True)
class CharacteristicSpeedReport3D:
    """Proxy characteristic-speed census on oriented outer-face samples."""

    face_count: int
    mode_count: int
    incoming_mode_count: int
    outgoing_mode_count: int
    zero_mode_count: int
    incoming_fraction: float
    constraint_incoming_fraction: float
    min_speed: float
    max_speed: float
    max_incoming_magnitude: float
    min_light_speed: float
    max_light_speed: float
    min_lapse_speed: float
    max_lapse_speed: float
    min_shift_speed: float
    max_shift_speed: float
    tolerance: float
    normal_convention: str
    mode_convention: str
    method: str
    physical_boundary_validated: bool
    constraint_preserving_validated: bool


_PHYSICAL_FIELDS = ("chi", "h", "trace_k", "a")
_CONSTRAINT_FIELDS = ("theta", "conformal_gamma")
_GAUGE_FIELDS = ("lapse",)
_SHIFT_FIELDS = ("shift", "b")
_ALL_FIELDS = (*_PHYSICAL_FIELDS, *_CONSTRAINT_FIELDS, *_GAUGE_FIELDS, *_SHIFT_FIELDS)


def _outer_faces(grid: Grid3D):
    """Yield each oriented Cartesian outer face once per boundary plane."""

    for index in np.ndindex(grid.shape):
        for axis in range(3):
            if index[axis] == 0:
                normal = np.zeros(3, dtype=np.float64)
                normal[axis] = -1.0
                yield index, axis, normal
            if index[axis] == grid.shape[axis] - 1:
                normal = np.zeros(3, dtype=np.float64)
                normal[axis] = 1.0
                yield index, axis, normal


def _inner_faces(state: BSSNState3D):
    """Yield valid-to-masked faces with normals pointing into the exterior."""

    if state.grid.boundary != "excision":
        raise ValueError("inner characteristic faces require an excision grid")
    mask = np.asarray(state.valid_mask, dtype=bool)
    if np.all(mask) or not np.any(mask):
        raise ValueError("inner characteristic faces require both valid and masked cells")
    directions = (
        (-1, 0, 0),
        (1, 0, 0),
        (0, -1, 0),
        (0, 1, 0),
        (0, 0, -1),
        (0, 0, 1),
    )
    shape = mask.shape
    for index in np.ndindex(shape):
        if not mask[index]:
            continue
        for delta in directions:
            neighbor = tuple(component + offset for component, offset in zip(index, delta))
            if any(component < 0 or component >= limit for component, limit in zip(neighbor, shape)):
                continue
            if mask[neighbor]:
                continue
            normal = -np.asarray(delta, dtype=np.float64)
            axis = int(np.argmax(np.abs(normal)))
            yield index, axis, normal


def _validate_boundary_state(state: BSSNState3D) -> None:
    if state.grid.boundary != "sommerfeld":
        raise ValueError("characteristic boundary shadow requires Grid3D(boundary='sommerfeld')")
    if not np.all(state.valid_mask):
        raise ValueError("characteristic boundary shadow requires a fully valid state")


def _speed_record(
    state: BSSNState3D,
    index: tuple[int, int, int],
    axis: int,
    normal: np.ndarray,
    gauge: GaugeConfig,
) -> tuple[tuple[int, int, int], int, tuple[float, float], tuple[float, float], tuple[float, float]]:
    metric = np.asarray(state.h[index], dtype=np.float64)
    determinant = float(np.linalg.det(metric))
    if not math.isfinite(determinant) or determinant <= 0.0:
        raise ValueError("boundary conformal metric must be positive-orientated")
    try:
        inverse = np.linalg.inv(metric)
    except np.linalg.LinAlgError as exc:
        raise ValueError("boundary conformal metric must be invertible") from exc
    gamma_nn = float(state.chi[index] * (normal @ inverse @ normal))
    alpha = float(state.lapse[index])
    beta_n = float(np.dot(state.shift[index], normal))
    if not math.isfinite(gamma_nn) or gamma_nn <= 0.0:
        raise ValueError("physical inverse metric must be positive along boundary normals")
    if not math.isfinite(alpha) or alpha <= 0.0 or not math.isfinite(beta_n):
        raise ValueError("boundary lapse and shift must be finite with positive lapse")
    root_gamma = math.sqrt(gamma_nn)
    light = alpha * root_gamma
    lapse_speed = math.sqrt(gauge.lapse_coefficient * alpha) * root_gamma
    shift_speed = math.sqrt(gauge.shift_coefficient) * alpha * root_gamma
    return (
        index,
        axis,
        (beta_n - light, beta_n + light),
        (beta_n - lapse_speed, beta_n + lapse_speed),
        (beta_n - shift_speed, beta_n + shift_speed),
    )


def _face_modes(
    state: BSSNState3D,
    gauge: GaugeConfig,
    *,
    tolerance: float,
) -> list[tuple[tuple[int, int, int], int, tuple[float, float], tuple[float, float], tuple[float, float]]]:
    """Return ``(index, axis, physical, lapse, shift)`` speed pairs."""

    _validate_boundary_state(state)
    tolerance = float(tolerance)
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")
    records = []
    for index, axis, normal in _outer_faces(state.grid):
        records.append(_speed_record(state, index, axis, normal, gauge))
    return records


def _summarize_speed_records(
    records: list[tuple[tuple[int, int, int], int, tuple[float, float], tuple[float, float], tuple[float, float]]],
    *,
    tolerance: float,
    normal_convention: str,
    method: str,
) -> CharacteristicSpeedReport3D:
    if not records:
        raise ValueError("boundary has no oriented face samples")
    speeds: list[float] = []
    constraint_speeds: list[float] = []
    light_values: list[float] = []
    lapse_values: list[float] = []
    shift_values: list[float] = []
    for _, _, physical, lapse, shift in records:
        speeds.extend((*physical, *lapse, *shift, *physical))
        constraint_speeds.extend(physical)
        light_values.append((physical[1] - physical[0]) / 2.0)
        lapse_values.append((lapse[1] - lapse[0]) / 2.0)
        shift_values.append((shift[1] - shift[0]) / 2.0)
    values = np.asarray(speeds, dtype=np.float64)
    constraint = np.asarray(constraint_speeds, dtype=np.float64)
    incoming = values < -float(tolerance)
    outgoing = values > float(tolerance)
    zero = ~(incoming | outgoing)
    return CharacteristicSpeedReport3D(
        face_count=len(records),
        mode_count=int(values.size),
        incoming_mode_count=int(np.count_nonzero(incoming)),
        outgoing_mode_count=int(np.count_nonzero(outgoing)),
        zero_mode_count=int(np.count_nonzero(zero)),
        incoming_fraction=float(np.mean(incoming)),
        constraint_incoming_fraction=float(np.mean(constraint < -float(tolerance))),
        min_speed=float(np.min(values)),
        max_speed=float(np.max(values)),
        max_incoming_magnitude=float(np.max(np.maximum(-values, 0.0))),
        min_light_speed=float(np.min(light_values)),
        max_light_speed=float(np.max(light_values)),
        min_lapse_speed=float(np.min(lapse_values)),
        max_lapse_speed=float(np.max(lapse_values)),
        min_shift_speed=float(np.min(shift_values)),
        max_shift_speed=float(np.max(shift_values)),
        tolerance=float(tolerance),
        normal_convention=normal_convention,
        mode_convention="beta^n +/- {light,lapse,shift} characteristic-speed proxies",
        method=method,
        physical_boundary_validated=False,
        constraint_preserving_validated=False,
    )


def characteristic_speed_report_3d(
    state: BSSNState3D,
    *,
    gauge: GaugeConfig = GaugeConfig(),
    tolerance: float = 1.0e-12,
) -> CharacteristicSpeedReport3D:
    """Measure physical/gauge/Z4 proxy speeds on all outer face samples."""

    records = _face_modes(state, gauge, tolerance=tolerance)
    return _summarize_speed_records(
        records,
        tolerance=tolerance,
        normal_convention="normal points from the domain toward the outer face",
        method="outer-face-principal-speed-census-v1",
    )


def inner_characteristic_speed_report_3d(
    state: BSSNState3D,
    *,
    gauge: GaugeConfig = GaugeConfig(),
    tolerance: float = 1.0e-12,
) -> CharacteristicSpeedReport3D:
    """Measure proxy physical/gauge/Z4 speeds on valid-to-masked faces.

    This is a speed census only.  It does not diagonalize the formulation's
    full principal symbol or provide constraint-preserving incoming data.
    Keeping it separate from ``excision_causality_report_3d`` makes the
    physical, gauge, and proxy-constraint families visible together while the
    promotion flags remain fail-closed.
    """

    tolerance = float(tolerance)
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")
    records = [
        _speed_record(state, index, axis, normal, gauge)
        for index, axis, normal in _inner_faces(state)
    ]
    return _summarize_speed_records(
        records,
        tolerance=tolerance,
        normal_convention="normal points from masked excision into the valid exterior",
        method="inner-face-principal-speed-census-v1",
    )


def _target_value(name: str, index: tuple[int, int, int], state: BSSNState3D) -> np.ndarray | float:
    field = np.asarray(getattr(state, name))
    if name == "chi" or name == "lapse":
        return 1.0
    if name == "h":
        return np.eye(3, dtype=np.float64)
    return np.zeros_like(field[index], dtype=np.float64)


def apply_characteristic_penalty_rhs_3d(
    state: BSSNState3D,
    rhs: Any,
    *,
    gauge: GaugeConfig = GaugeConfig(),
    penalty_strength: float = 0.5,
    tolerance: float = 1.0e-12,
) -> Any:
    """Apply a deterministic incoming-mode SAT-like penalty proxy.

    The penalty is summed over incoming members of each proxy mode family and
    scales as ``strength * |v_in| / h_n`` toward Minkowski data.  It is useful
    for a bounded engineering comparison with scalar Sommerfeld, but is not a
    characteristic eigenbasis, a constraint-preserving boundary condition, or
    a physical validation gate.
    """

    records = _face_modes(state, gauge, tolerance=tolerance)
    strength = float(penalty_strength)
    if not math.isfinite(strength) or strength < 0.0:
        raise ValueError("penalty_strength must be finite and non-negative")
    updated = {
        name: np.asarray(getattr(rhs, name), dtype=np.float64).copy()
        for name in _ALL_FIELDS
    }
    spacing = state.grid.spacing
    for index, axis, physical, lapse, shift in records:
        inverse_h = np.linalg.inv(state.h[index])
        normal = np.zeros(3, dtype=np.float64)
        normal[axis] = -1.0 if index[axis] == 0 else 1.0
        gamma_nn = float(state.chi[index] * (normal @ inverse_h @ normal))
        root_gamma = math.sqrt(gamma_nn)
        alpha = float(state.lapse[index])
        lapse_speed = math.sqrt(gauge.lapse_coefficient * alpha) * root_gamma
        shift_speed = math.sqrt(gauge.shift_coefficient) * alpha * root_gamma
        rates = {
            "physical": strength * sum(max(-value, 0.0) for value in physical) / spacing[axis],
            "constraint": strength * sum(max(-value, 0.0) for value in physical) / spacing[axis],
            "lapse": strength * sum(
                (
                    max(-(float(state.shift[index] @ normal) - lapse_speed), 0.0),
                    max(-(float(state.shift[index] @ normal) + lapse_speed), 0.0),
                )
            ) / spacing[axis],
            "shift": strength * sum(
                (
                    max(-(float(state.shift[index] @ normal) - shift_speed), 0.0),
                    max(-(float(state.shift[index] @ normal) + shift_speed), 0.0),
                )
            ) / spacing[axis],
        }
        groups = {
            "physical": _PHYSICAL_FIELDS,
            "constraint": _CONSTRAINT_FIELDS,
            "lapse": _GAUGE_FIELDS,
            "shift": _SHIFT_FIELDS,
        }
        for group, names in groups.items():
            rate = rates[group]
            if rate <= 0.0:
                continue
            for name in names:
                updated[name][index] -= rate * (
                    np.asarray(getattr(state, name))[index] - _target_value(name, index, state)
                )
    return type(rhs)(**updated)


def _inner_target_value(
    name: str,
    index: tuple[int, int, int],
    delta: tuple[int, int, int],
    state: BSSNState3D,
) -> np.ndarray | float:
    """Use a one-sided valid-side extrapolation target at an inner face."""

    interior = tuple(index[axis] - delta[axis] for axis in range(3))
    shape = state.grid.shape
    if any(component < 0 or component >= shape[axis] for axis, component in enumerate(interior)):
        interior = index
    return np.asarray(getattr(state, name))[interior]


def apply_inner_characteristic_penalty_rhs_3d(
    state: BSSNState3D,
    rhs: Any,
    *,
    gauge: GaugeConfig = GaugeConfig(),
    penalty_strength: float = 0.5,
    tolerance: float = 1.0e-12,
) -> Any:
    """Apply an oriented incoming-mode penalty on valid-to-masked faces.

    The normal points from the masked region into the valid exterior, so
    positive proxy speeds are modes entering the evolved domain.  The target
    is copied from the nearest valid cell one grid step farther into the
    exterior.  This is a deterministic SAT-like boundary experiment; it is
    not a formulation-specific eigenbasis, a constraint-preserving boundary,
    or a physical excision proof.
    """

    strength = float(penalty_strength)
    tolerance = float(tolerance)
    if not math.isfinite(strength) or strength < 0.0:
        raise ValueError("penalty_strength must be finite and non-negative")
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")
    updated = {
        name: np.asarray(getattr(rhs, name), dtype=np.float64).copy()
        for name in _ALL_FIELDS
    }
    groups = {
        "physical": _PHYSICAL_FIELDS,
        "constraint": _CONSTRAINT_FIELDS,
        "lapse": _GAUGE_FIELDS,
        "shift": _SHIFT_FIELDS,
    }
    spacing = state.grid.spacing
    for index, axis, normal in _inner_faces(state):
        record = _speed_record(state, index, axis, normal, gauge)
        physical, lapse, shift = record[2], record[3], record[4]
        rates = {
            "physical": strength * sum(max(value, 0.0) for value in physical if value > tolerance) / spacing[axis],
            "constraint": strength * sum(max(value, 0.0) for value in physical if value > tolerance) / spacing[axis],
            "lapse": strength * sum(max(value, 0.0) for value in lapse if value > tolerance) / spacing[axis],
            "shift": strength * sum(max(value, 0.0) for value in shift if value > tolerance) / spacing[axis],
        }
        delta = tuple(int(value) for value in -normal)
        for group, names in groups.items():
            rate = rates[group]
            if rate <= 0.0:
                continue
            for name in names:
                target = _inner_target_value(name, index, delta, state)
                updated[name][index] -= rate * (
                    np.asarray(getattr(state, name))[index] - target
                )
    return type(rhs)(**updated)


__all__ = [
    "BoundaryMode3D",
    "CharacteristicSpeedReport3D",
    "apply_characteristic_penalty_rhs_3d",
    "apply_inner_characteristic_penalty_rhs_3d",
    "characteristic_speed_report_3d",
    "inner_characteristic_speed_report_3d",
]

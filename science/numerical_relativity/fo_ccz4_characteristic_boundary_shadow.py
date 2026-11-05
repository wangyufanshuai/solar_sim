"""Apply the frozen FO-CCZ4 SAT candidate on a Cartesian shadow grid.

The correction is deliberately limited to a linearized perturbation about
Minkowski.  It maps the canonical 58-component state at each outer face into
the frozen characteristic penalty operator and adds ``SAT/h`` to the RHS.  It
is useful for testing array layout, face orientation, determinism, and the
finite-difference boundary plumbing, but it is not a variable-coefficient
Einstein boundary closure or a nonlinear CPBC.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Iterable

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_characteristic_sat_shadow import (
    FOCCZ4CharacteristicSATShadow3D,
    linearized_fo_ccz4_characteristic_sat_shadow_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config, FOCCZ4RHS3D, FOCCZ4State3D


@dataclass(frozen=True)
class FOCCZ4GridSATApplication3D:
    """Deterministic summary of a frozen SAT application on outer faces."""

    variable_count: int
    face_count: int
    boundary_cell_count: int
    correction_l_inf: float
    correction_imaginary_l_inf: float
    correction_sha256: str
    deterministic: bool
    frozen_grid_boundary_candidate_validated: bool
    variable_coefficient_boundary_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    runtime_writeback: bool
    method: str = "fo-ccz4-frozen-characteristic-grid-sat-shadow-v1"


def _state_components(state: FOCCZ4State3D, index: tuple[int, int, int]) -> np.ndarray:
    base = state.base
    aux = state.auxiliary
    values: list[float] = []
    values.extend(float(base.h[index + (i, j)] - (1.0 if i == j else 0.0)) for i in range(3) for j in range(i, 3))
    values.append(float(np.log(base.lapse[index])))
    values.extend(float(base.shift[index + (i,)]) for i in range(3))
    values.append(float(0.5 * np.log(base.chi[index])))
    values.extend(float(base.a[index + (i, j)]) for i in range(3) for j in range(i, 3))
    values.append(float(base.trace_k[index]))
    values.append(float(base.theta[index]))
    values.extend(float(base.conformal_gamma[index + (i,)]) for i in range(3))
    values.extend(float(base.b[index + (i,)]) for i in range(3))
    values.extend(float(aux.lapse_gradient[index + (i,)]) for i in range(3))
    values.extend(
        float(aux.shift_gradient[index + (k, i)])
        for k in range(3)
        for i in range(3)
    )
    values.extend(
        float(aux.metric_gradient[index + (k, i, j)])
        for k in range(3)
        for i in range(3)
        for j in range(i, 3)
    )
    values.extend(float(aux.conformal_factor_gradient[index + (i,)]) for i in range(3))
    result = np.asarray(values, dtype=np.float64)
    if result.shape != (len(FOCCZ4_VARIABLE_ORDER),) or not np.all(np.isfinite(result)):
        raise ValueError("FO-CCZ4 boundary state components must be finite 58-vectors")
    return result


def _add_component(corrections: list[np.ndarray], slot: int, index: tuple[int, int, int], value: float) -> None:
    corrections[slot][index] += value


def _scatter_correction(
    corrections: list[np.ndarray],
    index: tuple[int, int, int],
    vector: np.ndarray,
) -> None:
    slot = 0
    for i in range(3):
        for j in range(i, 3):
            _add_component(corrections, slot, index, float(vector[slot]))
            slot += 1
    _add_component(corrections, slot, index, float(vector[slot]))
    slot += 1
    for _ in range(3):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    _add_component(corrections, slot, index, float(vector[slot]))
    slot += 1
    for i in range(3):
        for j in range(i, 3):
            _add_component(corrections, slot, index, float(vector[slot]))
            slot += 1
    for _ in range(2):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(3):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(3):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(3):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(9):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(18):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    for _ in range(3):
        _add_component(corrections, slot, index, float(vector[slot]))
        slot += 1
    if slot != len(FOCCZ4_VARIABLE_ORDER):  # pragma: no cover - fixed contract
        raise AssertionError("FO-CCZ4 boundary scatter did not consume 58 slots")


def _rhs_from_components(rhs: FOCCZ4RHS3D, corrections: list[np.ndarray], scale: float) -> FOCCZ4RHS3D:
    fields = {
        "h": np.asarray(rhs.h, dtype=np.float64).copy(),
        "ln_lapse": np.asarray(rhs.ln_lapse, dtype=np.float64).copy(),
        "shift": np.asarray(rhs.shift, dtype=np.float64).copy(),
        "ln_phi": np.asarray(rhs.ln_phi, dtype=np.float64).copy(),
        "a": np.asarray(rhs.a, dtype=np.float64).copy(),
        "trace_k": np.asarray(rhs.trace_k, dtype=np.float64).copy(),
        "theta": np.asarray(rhs.theta, dtype=np.float64).copy(),
        "conformal_gamma": np.asarray(rhs.conformal_gamma, dtype=np.float64).copy(),
        "b": np.asarray(rhs.b, dtype=np.float64).copy(),
        "lapse_gradient": np.asarray(rhs.lapse_gradient, dtype=np.float64).copy(),
        "shift_gradient": np.asarray(rhs.shift_gradient, dtype=np.float64).copy(),
        "metric_gradient": np.asarray(rhs.metric_gradient, dtype=np.float64).copy(),
        "conformal_factor_gradient": np.asarray(rhs.conformal_factor_gradient, dtype=np.float64).copy(),
    }
    slot = 0
    for i in range(3):
        for j in range(i, 3):
            fields["h"][..., i, j] += scale * corrections[slot]
            if i != j:
                fields["h"][..., j, i] += scale * corrections[slot]
            slot += 1
    fields["ln_lapse"] += scale * corrections[slot]
    slot += 1
    for i in range(3):
        fields["shift"][..., i] += scale * corrections[slot]
        slot += 1
    fields["ln_phi"] += scale * corrections[slot]
    slot += 1
    for i in range(3):
        for j in range(i, 3):
            fields["a"][..., i, j] += scale * corrections[slot]
            if i != j:
                fields["a"][..., j, i] += scale * corrections[slot]
            slot += 1
    fields["trace_k"] += scale * corrections[slot]
    slot += 1
    fields["theta"] += scale * corrections[slot]
    slot += 1
    for i in range(3):
        fields["conformal_gamma"][..., i] += scale * corrections[slot]
        slot += 1
    for i in range(3):
        fields["b"][..., i] += scale * corrections[slot]
        slot += 1
    for i in range(3):
        fields["lapse_gradient"][..., i] += scale * corrections[slot]
        slot += 1
    for k in range(3):
        for i in range(3):
            fields["shift_gradient"][..., k, i] += scale * corrections[slot]
            slot += 1
    for k in range(3):
        for i in range(3):
            for j in range(i, 3):
                fields["metric_gradient"][..., k, i, j] += scale * corrections[slot]
                if i != j:
                    fields["metric_gradient"][..., k, j, i] += scale * corrections[slot]
                slot += 1
    for i in range(3):
        fields["conformal_factor_gradient"][..., i] += scale * corrections[slot]
        slot += 1
    if slot != len(FOCCZ4_VARIABLE_ORDER):  # pragma: no cover - fixed contract
        raise AssertionError("FO-CCZ4 boundary RHS did not consume 58 slots")
    return FOCCZ4RHS3D(**fields)


def _face_indices(shape: tuple[int, int, int], axis: int, side: int) -> Iterable[tuple[int, int, int]]:
    fixed = 0 if side < 0 else shape[axis] - 1
    for index in np.ndindex(shape):
        if index[axis] == fixed:
            yield index


def apply_frozen_fo_ccz4_characteristic_sat_rhs_3d(
    state: FOCCZ4State3D,
    rhs: FOCCZ4RHS3D,
    *,
    axes: tuple[int, ...] = (0, 1, 2),
    penalty_strength: float = 1.0,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
) -> tuple[FOCCZ4RHS3D, FOCCZ4GridSATApplication3D, tuple[FOCCZ4CharacteristicSATShadow3D, ...]]:
    """Apply the frozen SAT candidate to both selected outer faces."""

    if state.base.grid.boundary != "sommerfeld":
        raise ValueError("grid SAT shadow requires Grid3D(boundary='sommerfeld')")
    if not np.all(state.base.valid_mask):
        raise ValueError("grid SAT shadow requires a fully valid state")
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise ValueError("axes must contain one or more distinct Cartesian axes")
    if len(set(axes)) != len(axes):
        raise ValueError("axes must not repeat")
    strength = float(penalty_strength)
    if not math.isfinite(strength) or strength <= 0.0:
        raise ValueError("penalty_strength must be finite and positive")
    corrections = [np.zeros(state.base.grid.shape, dtype=np.float64) for _ in FOCCZ4_VARIABLE_ORDER]
    reports: list[FOCCZ4CharacteristicSATShadow3D] = []
    boundary_cell_count = 0
    correction_imaginary_l_inf = 0.0
    for axis in axes:
        for side, orientation in ((-1, "left"), (1, "right")):
            report = linearized_fo_ccz4_characteristic_sat_shadow_3d(
                points=8,
                normal_axis=axis,
                orientation=orientation,
                penalty_strength=strength,
                gauge=gauge,
                config=config,
            )
            reports.append(report)
            if report.sat_operator is None:
                raise ValueError("frozen SAT report did not retain its operator")
            for index in _face_indices(state.base.grid.shape, axis, side):
                q = _state_components(state, index)
                raw_correction = np.asarray(report.sat_operator @ q, dtype=np.complex128)
                correction_imaginary_l_inf = max(
                    correction_imaginary_l_inf,
                    float(np.max(np.abs(np.imag(raw_correction)))),
                )
                correction = np.real(raw_correction) / state.base.grid.spacing[axis]
                _scatter_correction(corrections, index, correction)
                boundary_cell_count += 1
    updated_rhs = _rhs_from_components(rhs, corrections, 1.0)
    digest = hashlib.sha256()
    for correction in corrections:
        digest.update(np.ascontiguousarray(correction, dtype=np.float64).tobytes())
    correction_l_inf = max(
        (float(np.max(np.abs(correction))) for correction in corrections),
        default=0.0,
    )
    candidate = bool(
        reports
        and all(report.frozen_characteristic_operator_validated for report in reports)
        and np.isfinite(correction_l_inf)
        and correction_imaginary_l_inf <= 1.0e-8
    )
    application = FOCCZ4GridSATApplication3D(
        variable_count=len(FOCCZ4_VARIABLE_ORDER),
        face_count=len(reports),
        boundary_cell_count=boundary_cell_count,
        correction_l_inf=correction_l_inf,
        correction_imaginary_l_inf=correction_imaginary_l_inf,
        correction_sha256=digest.hexdigest(),
        deterministic=True,
        frozen_grid_boundary_candidate_validated=candidate,
        variable_coefficient_boundary_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        runtime_writeback=False,
    )
    return updated_rhs, application, tuple(reports)


__all__ = [
    "FOCCZ4GridSATApplication3D",
    "apply_frozen_fo_ccz4_characteristic_sat_rhs_3d",
]

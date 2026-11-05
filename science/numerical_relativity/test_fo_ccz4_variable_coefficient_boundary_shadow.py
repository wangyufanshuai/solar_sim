from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_variable_coefficient_boundary_shadow import (
    audit_fo_ccz4_variable_coefficient_boundary_3d,
)
from .nr3d import BSSNState3D, Grid3D


def _state() -> BSSNState3D:
    grid = Grid3D(
        (7, 7, 7),
        (2.0, 2.0, 2.0),
        (4.0, 4.0, 4.0),
        boundary="sommerfeld",
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        center=(0.0, 0.0, 0.0),
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    x, y, z = grid.coordinates
    state.h[..., 0, 0] *= 1.0 + 1.0e-2 * np.sin(x)
    state.h[..., 1, 1] *= 1.0 + 5.0e-3 * np.cos(y)
    cross = 1.0e-3 * np.sin(x + y + z)
    state.h[..., 0, 1] = cross
    state.h[..., 1, 0] = cross
    state.shift[..., 0] = 1.0e-3 * np.cos(y)
    return state


def test_variable_coefficient_speed_audit_is_deterministic_and_fail_closed() -> None:
    state = _state()
    first = audit_fo_ccz4_variable_coefficient_boundary_3d(
        state,
        axes=(0, 2),
        gauge=GaugeConfig(theta_coupling=2.0),
    )
    second = audit_fo_ccz4_variable_coefficient_boundary_3d(
        state,
        axes=(0, 2),
        gauge=GaugeConfig(theta_coupling=2.0),
    )
    assert first == second
    assert first.face_count == 4 * 7 * 7
    assert first.boundary_cell_count > 0
    assert first.positive_definite_metric_validated is True
    assert first.proxy_speed_coefficients_finite is True
    assert first.local_characteristic_speed_validated is False
    assert first.max_physical_metric_condition_number > 1.0
    assert first.max_intrinsic_speed_relative_deviation > 0.0
    assert first.min_speed < 0.0 < first.max_speed
    assert first.variable_coefficient_boundary_validated is False
    assert first.nonlinear_cpbc_validated is False
    assert first.physical_boundary_validated is False
    assert first.runtime_writeback is False


def test_variable_coefficient_speed_audit_rejects_indefinite_metric() -> None:
    state = _state()
    state.h[0, 0, 0, 0, 0] = -1.0
    with pytest.raises(ValueError, match="positive definite"):
        audit_fo_ccz4_variable_coefficient_boundary_3d(state, axes=(0,))


def test_variable_coefficient_speed_audit_rejects_periodic_grid() -> None:
    state = BSSNState3D.minkowski(
        Grid3D((7, 7, 7), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="boundary='sommerfeld'"):
        audit_fo_ccz4_variable_coefficient_boundary_3d(state)

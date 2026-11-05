from __future__ import annotations

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_characteristic_boundary_shadow import (
    apply_frozen_fo_ccz4_characteristic_sat_rhs_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config, FOCCZ4State3D, fo_ccz4_rhs_3d
from .nr3d import BSSNState3D, Grid3D


def _sample_state() -> tuple[FOCCZ4State3D, object]:
    grid = Grid3D(
        (6, 6, 6),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    base = BSSNState3D.minkowski(grid, formulation="ccz4")
    x, _, _ = grid.coordinates
    base.lapse += 1.0e-5 * np.sin(2.0 * np.pi * x)
    state = FOCCZ4State3D.from_bssn_state(base)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    rhs = fo_ccz4_rhs_3d(
        state,
        gauge=gauge,
        config=config,
        boundary_mode="sommerfeld-proxy",
    )
    return state, (rhs, gauge, config)


def test_grid_sat_plumbs_both_faces_and_preserves_the_frozen_gate() -> None:
    state, payload = _sample_state()
    rhs, gauge, config = payload
    updated, application, reports = apply_frozen_fo_ccz4_characteristic_sat_rhs_3d(
        state,
        rhs,
        axes=(0,),
        gauge=gauge,
        config=config,
    )
    assert application.face_count == 2
    assert application.boundary_cell_count == 72
    assert application.frozen_grid_boundary_candidate_validated is True
    assert application.correction_imaginary_l_inf <= 1.0e-8
    assert application.variable_coefficient_boundary_validated is False
    assert len(reports) == 2
    assert np.max(np.abs(updated.ln_lapse - rhs.ln_lapse)) > 0.0


def test_grid_sat_rejects_periodic_grids() -> None:
    grid = Grid3D(
        (6, 6, 6),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid, formulation="ccz4"))
    rhs = fo_ccz4_rhs_3d(state)
    try:
        apply_frozen_fo_ccz4_characteristic_sat_rhs_3d(state, rhs, axes=(0,))
    except ValueError as error:
        assert "sommerfeld" in str(error)
    else:  # pragma: no cover - defensive assertion
        raise AssertionError("periodic grid must not enter the outer-face SAT shadow")

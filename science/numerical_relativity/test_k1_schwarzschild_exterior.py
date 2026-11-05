from __future__ import annotations

import numpy as np

from .ccz4_3d import advance_ccz4_rk4_3d, ccz4_rhs_3d
from .ccz4_reference import GaugeConfig
from .constraints3d import constraint_report_3d
from .nr3d import BSSNState3D, Grid3D


def test_schwarzschild_exterior_ccz4_shadow_stays_finite() -> None:
    grid = Grid3D(
        (9, 9, 9),
        (2.0, 2.0, 2.0),
        (6.0, 6.0, 6.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    rhs = ccz4_rhs_3d(
        state,
        gauge=GaugeConfig(theta_coupling=2.0),
        boundary_mode="sommerfeld",
    )
    evolved = advance_ccz4_rk4_3d(
        state,
        1.0e-5,
        steps=1,
        gauge=GaugeConfig(theta_coupling=2.0),
        project_algebraic=True,
        boundary_mode="sommerfeld",
    )
    report = constraint_report_3d(evolved)
    assert all(np.all(np.isfinite(np.asarray(getattr(rhs, name)))) for name in rhs.__dataclass_fields__)
    assert all(np.all(np.isfinite(np.asarray(getattr(evolved, name)))) for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"
    ))
    assert np.all(np.linalg.det(evolved.h) > 0.0)
    assert all(np.isfinite(value) for value in report.norms.values())
    assert evolved.valid_mask.all()


def test_static_schwarzschild_slice_satisfies_the_selected_gauge_rows() -> None:
    grid = Grid3D(
        (13, 13, 13),
        (2.0, 2.0, 2.0),
        (10.0, 10.0, 10.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    rhs = ccz4_rhs_3d(
        state,
        gauge=GaugeConfig(theta_coupling=2.0),
        boundary_mode="sommerfeld",
    )
    interior = np.ones(grid.shape, dtype=bool)
    interior[:2] = False
    interior[-2:] = False
    interior[:, :2] = False
    interior[:, -2:] = False
    interior[:, :, :2] = False
    interior[:, :, -2:] = False

    assert np.max(np.abs(rhs.lapse[interior])) == 0.0
    assert np.max(np.linalg.norm(rhs.shift[interior], axis=-1)) == 0.0

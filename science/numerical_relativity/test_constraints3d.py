from __future__ import annotations

import numpy as np

from .ccz4_reference import (
    CCZ4State1D,
    Grid1D,
    ccz4_conformal_momentum_constraint,
    constraint_report,
)
from .constraints3d import ccz4_conformal_momentum_constraint_3d, constraint_report_3d
from .nr3d import BSSNState3D, Grid3D


def _grid(points: int = 9) -> Grid3D:
    return Grid3D((points, 5, 5), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")


def test_3d_minkowski_constraints_are_exactly_zero() -> None:
    state = BSSNState3D.minkowski(_grid())
    report = constraint_report_3d(state)
    assert all(value == 0.0 for value in report.norms.values())


def test_3d_constraint_report_accepts_excision_schwarzschild_and_masks_stencils() -> None:
    grid = Grid3D((17, 17, 17), (-3.0, -3.0, -3.0), (3.0, 3.0, 3.0), boundary="excision")
    state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
    x, y, z = grid.coordinates
    state.valid_mask &= np.sqrt(x * x + y * y + z * z) > 1.0
    report = constraint_report_3d(state)
    assert 0 < int(np.count_nonzero(report.valid_mask)) < int(np.prod(grid.shape))
    assert all(np.isfinite(value) for value in report.norms.values())
    assert report.norms["hamiltonian_l_inf"] < 0.5


def test_3d_schwarzschild_constraint_l2_refines_on_the_outer_shell() -> None:
    norms: list[float] = []
    for points in (17, 33):
        grid = Grid3D((points, points, points), (-3.0, -3.0, -3.0), (3.0, 3.0, 3.0), boundary="excision")
        state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
        x, y, z = grid.coordinates
        state.valid_mask &= np.sqrt(x * x + y * y + z * z) > 1.0
        norms.append(constraint_report_3d(state).norms["hamiltonian_l2"])
    assert norms[0] / norms[1] > 2.5


def test_3d_x_only_constraints_match_1d_reference() -> None:
    points = 17
    state3 = BSSNState3D.minkowski(_grid(points), formulation="ccz4")
    x, _, _ = state3.grid.coordinates
    phase = 2.0 * np.pi * x
    sine, cosine = np.sin(phase), np.cos(phase)
    state3.chi[:] = 1.0 + 1.0e-3 * sine
    state3.h[..., 0, 0] = 1.0 + 1.0e-3 * cosine
    state3.h[..., 1, 1] = 1.0 - 5.0e-4 * cosine
    state3.h[..., 2, 2] = 1.0 - 5.0e-4 * cosine
    state3.h[..., 0, 1] = state3.h[..., 1, 0] = 2.0e-4 * sine
    state3.trace_k[:] = 2.0e-4 * sine
    state3.a[..., 0, 0] = 2.0e-4 * sine
    state3.a[..., 1, 1] = -1.0e-4 * sine
    state3.a[..., 2, 2] = -1.0e-4 * sine
    state3.a[..., 0, 1] = state3.a[..., 1, 0] = 1.0e-4 * cosine
    state3.theta[:] = 1.0e-5 * cosine
    state3.conformal_gamma[..., 0] = 2.0e-5 * sine
    state1 = CCZ4State1D.minkowski(Grid1D(points, 0.0, 1.0), formulation="ccz4")
    state1.chi[:] = state3.chi[:, 0, 0]
    state1.h[:] = state3.h[:, 0, 0]
    state1.trace_k[:] = state3.trace_k[:, 0, 0]
    state1.a[:] = state3.a[:, 0, 0]
    state1.theta[:] = state3.theta[:, 0, 0]
    state1.conformal_gamma[:] = state3.conformal_gamma[:, 0, 0]
    report1 = constraint_report(state1)
    report3 = constraint_report_3d(state3)
    for name in ("hamiltonian", "momentum", "det_h_minus_one", "trace_a", "conformal_gamma", "theta"):
        assert np.max(np.abs(getattr(report3, name)[:, 0, 0] - getattr(report1, name))) < 1.0e-12


def test_ccz4_conformal_momentum_requires_explicit_z4c_khat_conversion() -> None:
    points = 33
    grid = _grid(points)
    state3 = BSSNState3D.minkowski(grid, formulation="ccz4")
    x, _, _ = grid.coordinates
    theta = 1.0e-4 * np.sin(2.0 * np.pi * x)
    state3.theta[:] = theta
    state1 = CCZ4State1D.minkowski(Grid1D(points, 0.0, 1.0), formulation="ccz4")
    state1.theta[:] = theta[:, 0, 0]

    adm = constraint_report_3d(state3)
    pure_theta3 = ccz4_conformal_momentum_constraint_3d(state3)
    pure_theta1 = ccz4_conformal_momentum_constraint(state1)

    assert np.max(np.abs(adm.momentum)) == 0.0
    assert np.max(np.abs(pure_theta3)) == 0.0
    assert np.max(np.abs(pure_theta1)) == 0.0

    state3.trace_k[:] = 2.0 * theta
    state1.trace_k[:] = 2.0 * theta[:, 0, 0]
    modified3 = ccz4_conformal_momentum_constraint_3d(state3)
    modified1 = ccz4_conformal_momentum_constraint(state1)
    assert np.max(np.abs(modified3[:, 0, 0, 0] - modified1[:, 0])) < 1.0e-12
    assert np.max(np.abs(modified3[:, 0, 0])) > 0.0


def test_3d_analytic_gauge_wave_constraints_refine_with_selected_stencil() -> None:
    observed: dict[int, list[float]] = {}
    for order in (2, 4):
        gamma_errors: list[float] = []
        for points in (16, 32, 64):
            grid = Grid3D(
                (points, 5, 5),
                (0.0, 0.0, 0.0),
                (1.0, 1.0, 1.0),
                boundary="periodic",
                spatial_order=order,
            )
            state = BSSNState3D.gauge_wave(grid, amplitude=1.0e-2)
            report = constraint_report_3d(state)
            assert report.norms["hamiltonian_l_inf"] < 1.0e-15
            assert report.norms["momentum_l_inf"] < 1.0e-12
            gamma_errors.append(report.norms["conformal_gamma_l_inf"])
        observed[order] = gamma_errors
    assert observed[2][0] / observed[2][1] > 3.0
    assert observed[2][1] / observed[2][2] > 3.0
    assert observed[4][0] / observed[4][1] > 10.0
    assert observed[4][1] / observed[4][2] > 10.0

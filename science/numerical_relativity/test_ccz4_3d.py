from __future__ import annotations

import numpy as np

from .ccz4_3d import advance_ccz4_rk4_3d, ccz4_rhs_3d
from .ccz4_reference import CCZ4State1D, GaugeConfig, Grid1D
from .ccz4_rhs import CCZ4Config, ccz4_rhs_1d
from .nr3d import BSSNState3D, Grid3D


def _grid(points: int = 7) -> Grid3D:
    return Grid3D((points, 5, 5), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")


def test_3d_ccz4_minkowski_rhs_is_exactly_zero() -> None:
    state = BSSNState3D.minkowski(_grid(), formulation="ccz4")
    rhs = ccz4_rhs_3d(state)
    for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))


def test_3d_ccz4_sommerfeld_boundary_is_finite_and_minkowski_exact() -> None:
    grid = Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="sommerfeld")
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    rhs = ccz4_rhs_3d(state)
    for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))
    state.lapse[:] += 1.0e-3 * grid.coordinates[0]
    evolved = advance_ccz4_rk4_3d(state, 1.0e-5, steps=1, project_algebraic=True)
    assert np.all(np.isfinite(evolved.lapse))
    assert np.all(evolved.lapse > 0.0)


def test_3d_ccz4_theta_damping_matches_the_contract() -> None:
    state = BSSNState3D.minkowski(_grid(), formulation="ccz4")
    state.theta.fill(0.1)
    rhs = ccz4_rhs_3d(state, ccz4=CCZ4Config(kappa1=0.2))
    assert np.allclose(rhs.lapse, 0.4)
    assert np.allclose(rhs.trace_k, -0.06)
    assert np.allclose(rhs.theta, -0.04)


def test_3d_ccz4_nontrivial_rk4_state_is_finite() -> None:
    state = BSSNState3D.minkowski(_grid(9), formulation="ccz4")
    x, y, z = state.grid.coordinates
    phase = 2.0 * np.pi * (x + y + z)
    state.chi[:] = 1.0 + 1.0e-4 * np.sin(phase)
    state.h[..., 0, 0] = 1.0 + 1.0e-4 * np.cos(phase)
    state.h[..., 1, 1] = 1.0 - 5.0e-5 * np.cos(phase)
    state.h[..., 2, 2] = 1.0 - 5.0e-5 * np.cos(phase)
    state.trace_k[:] = 1.0e-4 * np.sin(phase)
    state.theta[:] = 1.0e-5 * np.cos(phase)
    state.conformal_gamma[..., 0] = 2.0e-5 * np.sin(phase)
    state.lapse[:] = 1.0 + 5.0e-5 * np.cos(phase)
    rhs = ccz4_rhs_3d(state)
    assert np.all(np.isfinite(rhs.theta))
    evolved = advance_ccz4_rk4_3d(state, 1.0e-5, steps=2)
    assert np.all(evolved.chi > 0.0)
    assert np.all(evolved.lapse > 0.0)


def test_3d_ccz4_rk4_optional_algebraic_projection_is_exact() -> None:
    state = BSSNState3D.minkowski(_grid(9), formulation="ccz4")
    x, _, _ = state.grid.coordinates
    phase = 2.0 * np.pi * x
    state.h[..., 0, 0] = 1.0 + 1.0e-3 * np.sin(phase)
    state.h[..., 1, 1] = 1.0 + 2.0e-3 * np.cos(phase)
    state.a[..., 0, 0] = 2.0e-4 * np.sin(phase)
    evolved = advance_ccz4_rk4_3d(state, 1.0e-5, steps=2, project_algebraic=True)
    inverse = np.linalg.inv(evolved.h)
    trace_a = np.einsum("...ij,...ij->...", inverse, evolved.a)
    assert np.max(np.abs(np.linalg.det(evolved.h) - 1.0)) < 1.0e-12
    assert np.max(np.abs(trace_a)) < 1.0e-12


def test_3d_ccz4_advective_gamma_driver_transports_b_minus_gamma() -> None:
    grid = _grid(8)
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    x, _, _ = grid.coordinates
    beta = 0.3
    state.shift[..., 0] = beta
    state.b[..., 0] = 0.4 * np.cos(2.0 * np.pi * x)
    state.conformal_gamma[..., 0] = 0.2 * np.sin(2.0 * np.pi * x)

    advective = ccz4_rhs_3d(state, gauge=GaugeConfig(advective=True))
    non_advective = ccz4_rhs_3d(state, gauge=GaugeConfig(advective=False))
    dx = grid.spacing[0]
    centered_factor = np.sin(2.0 * np.pi * dx) / dx
    expected_delta = beta * (
        -0.4 * np.sin(2.0 * np.pi * x) - 0.2 * np.cos(2.0 * np.pi * x)
    ) * centered_factor

    assert np.allclose(advective.b[..., 0] - non_advective.b[..., 0], expected_delta)


def test_3d_ccz4_x_only_slice_matches_the_1d_reference() -> None:
    points = 9
    state3 = BSSNState3D.minkowski(_grid(points), formulation="ccz4")
    x, _, _ = state3.grid.coordinates
    phase = 2.0 * np.pi * x
    sine = np.sin(phase)
    cosine = np.cos(phase)
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
    state3.lapse[:] = 1.0 + 5.0e-4 * cosine
    state3.shift[..., 0] = 1.0e-4 * sine
    state3.shift[..., 1] = 5.0e-5 * cosine
    state3.b[..., 0] = 2.0e-5 * cosine
    state3.theta[:] = 1.0e-5 * cosine
    state3.conformal_gamma[..., 0] = 2.0e-5 * sine
    state3.conformal_gamma[..., 1] = -1.0e-5 * cosine
    state3.conformal_gamma[..., 2] = 0.5e-5 * sine

    state1 = CCZ4State1D.minkowski(Grid1D(points, 0.0, 1.0), formulation="ccz4")
    state1.chi[:] = state3.chi[:, 0, 0]
    state1.h[:] = state3.h[:, 0, 0]
    state1.trace_k[:] = state3.trace_k[:, 0, 0]
    state1.a[:] = state3.a[:, 0, 0]
    state1.theta[:] = state3.theta[:, 0, 0]
    state1.conformal_gamma[:] = state3.conformal_gamma[:, 0, 0]
    state1.lapse[:] = state3.lapse[:, 0, 0]
    state1.shift[:] = state3.shift[:, 0, 0]
    state1.b[:] = state3.b[:, 0, 0]
    rhs3 = ccz4_rhs_3d(state3)
    rhs1 = ccz4_rhs_1d(state1)
    assert np.max(np.abs(rhs3.chi[:, 0, 0] - rhs1.chi)) < 1.0e-10
    assert np.max(np.abs(rhs3.trace_k[:, 0, 0] - rhs1.trace_k)) < 1.0e-10
    assert np.max(np.abs(rhs3.theta[:, 0, 0] - rhs1.theta)) < 1.0e-10

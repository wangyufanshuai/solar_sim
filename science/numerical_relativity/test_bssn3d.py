from __future__ import annotations

import numpy as np
import pytest

from .bssn3d import _christoffel, _conformal_ricci, _d1, _d2, advance_bssn_rk4_3d, bssn_rhs_3d
from .ccz4_reference import GaugeConfig
from .nr3d import BSSNState3D, Grid3D


def _periodic_grid(points: int = 7) -> Grid3D:
    return Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )


def test_3d_bssn_minkowski_rhs_is_exactly_zero() -> None:
    state = BSSNState3D.minkowski(_periodic_grid(), formulation="bssnok")
    rhs = bssn_rhs_3d(state)
    for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))


def test_3d_bssn_sommerfeld_boundary_is_finite_and_minkowski_exact() -> None:
    grid = Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="sommerfeld")
    state = BSSNState3D.minkowski(grid, formulation="bssnok")
    rhs = bssn_rhs_3d(state)
    for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))
    state.chi[:] += 1.0e-3 * grid.coordinates[0]
    evolved = advance_bssn_rk4_3d(state, 1.0e-5, steps=1, project_algebraic=True)
    assert np.all(np.isfinite(evolved.chi))
    assert np.all(evolved.chi > 0.0)


def test_3d_bssn_excision_boundary_remains_fail_closed() -> None:
    state = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision"),
        formulation="bssnok",
    )
    with pytest.raises(ValueError, match="periodic or explicit Sommerfeld"):
        bssn_rhs_3d(state)


def test_3d_bssn_nontrivial_state_rhs_is_finite_and_rk4_preserves_positivity() -> None:
    state = BSSNState3D.minkowski(_periodic_grid(9), formulation="bssnok")
    x, y, z = state.grid.coordinates
    phase = 2.0 * np.pi * (x + y + z)
    state.chi[:] = 1.0 + 1.0e-4 * np.sin(phase)
    state.h[..., 0, 0] = 1.0 + 1.0e-4 * np.cos(phase)
    state.h[..., 1, 1] = 1.0 - 5.0e-5 * np.cos(phase)
    state.h[..., 2, 2] = 1.0 - 5.0e-5 * np.cos(phase)
    state.trace_k[:] = 1.0e-4 * np.sin(phase)
    state.a[..., 0, 0] = 1.0e-4 * np.sin(phase)
    state.a[..., 1, 1] = -5.0e-5 * np.sin(phase)
    state.a[..., 2, 2] = -5.0e-5 * np.sin(phase)
    state.lapse[:] = 1.0 + 5.0e-5 * np.cos(phase)
    state.shift[..., 0] = 1.0e-5 * np.sin(phase)
    rhs = bssn_rhs_3d(state)
    for name in ("chi", "h", "trace_k", "a", "conformal_gamma", "lapse", "shift", "b"):
        assert np.all(np.isfinite(getattr(rhs, name)))
    evolved = advance_bssn_rk4_3d(state, 1.0e-5, steps=2)
    assert np.all(evolved.chi > 0.0)
    assert np.all(evolved.lapse > 0.0)
    assert np.all(np.isfinite(evolved.conformal_gamma))


def test_3d_bssn_rk4_optional_algebraic_projection_is_exact() -> None:
    state = BSSNState3D.minkowski(_periodic_grid(9), formulation="bssnok")
    x, _, _ = state.grid.coordinates
    phase = 2.0 * np.pi * x
    state.h[..., 0, 0] = 1.0 + 1.0e-3 * np.sin(phase)
    state.h[..., 1, 1] = 1.0 + 2.0e-3 * np.cos(phase)
    state.a[..., 0, 0] = 2.0e-4 * np.sin(phase)
    evolved = advance_bssn_rk4_3d(state, 1.0e-5, steps=2, project_algebraic=True)
    inverse = np.linalg.inv(evolved.h)
    trace_a = np.einsum("...ij,...ij->...", inverse, evolved.a)
    assert np.max(np.abs(np.linalg.det(evolved.h) - 1.0)) < 1.0e-12
    assert np.max(np.abs(trace_a)) < 1.0e-12


def test_3d_advective_gamma_driver_transports_b_minus_gamma() -> None:
    grid = _periodic_grid(8)
    state = BSSNState3D.minkowski(grid, formulation="bssnok")
    x, _, _ = grid.coordinates
    beta = 0.3
    state.shift[..., 0] = beta
    state.b[..., 0] = 0.4 * np.cos(2.0 * np.pi * x)
    state.conformal_gamma[..., 0] = 0.2 * np.sin(2.0 * np.pi * x)

    advective = bssn_rhs_3d(state, GaugeConfig(advective=True))
    non_advective = bssn_rhs_3d(state, GaugeConfig(advective=False))
    dx = grid.spacing[0]
    centered_factor = np.sin(2.0 * np.pi * dx) / dx
    expected_delta = beta * (
        -0.4 * np.sin(2.0 * np.pi * x) - 0.2 * np.cos(2.0 * np.pi * x)
    ) * centered_factor

    assert np.allclose(advective.b[..., 0] - non_advective.b[..., 0], expected_delta)


def test_3d_evolved_gamma_ricci_has_second_order_refinement() -> None:
    errors: list[float] = []
    for points in (16, 32, 64):
        grid = Grid3D((points, 5, 5), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
        state = BSSNState3D.minkowski(grid, formulation="bssnok")
        x, _, _ = grid.coordinates
        first = 1.0 + 0.1 * np.sin(2.0 * np.pi * x)
        second = 1.0 - 0.05 * np.sin(2.0 * np.pi * x)
        state.h[..., 0, 0] = first
        state.h[..., 1, 1] = second
        state.h[..., 2, 2] = 1.0 / (first * second)
        inverse = np.linalg.inv(state.h)
        christoffel = _christoffel(state.h, inverse, state)
        state.conformal_gamma[:] = np.einsum("...ij,...kij->...k", inverse, christoffel)
        reconstructed = _conformal_ricci(state, inverse, christoffel)
        d_christoffel = [
            (np.roll(christoffel, -1, axis=axis) - np.roll(christoffel, 1, axis=axis))
            / (2.0 * grid.spacing[axis])
            for axis in range(3)
        ]
        direct = np.zeros_like(reconstructed)
        for i in range(3):
            for j in range(3):
                value = d_christoffel[0][..., 0, i, j]
                trace = sum(christoffel[..., diagonal, i, diagonal] for diagonal in range(3))
                if j == 0:
                    value -= (np.roll(trace, -1, axis=0) - np.roll(trace, 1, axis=0)) / (
                        2.0 * grid.spacing[0]
                    )
                for k in range(3):
                    for ell in range(3):
                        value += (
                            christoffel[..., k, i, j] * christoffel[..., ell, k, ell]
                            - christoffel[..., ell, i, k] * christoffel[..., k, j, ell]
                        )
                direct[..., i, j] = value
        errors.append(float(np.sqrt(np.mean((reconstructed - direct) ** 2))))
    assert errors[0] / errors[1] > 3.0
    assert errors[1] / errors[2] > 3.0


def test_periodic_fourth_order_stencils_refine_at_fourth_order() -> None:
    first_errors: list[float] = []
    second_errors: list[float] = []
    for points in (16, 32, 64):
        grid = Grid3D(
            (points, 5, 5),
            (0.0, 0.0, 0.0),
            (1.0, 1.0, 1.0),
            boundary="periodic",
            spatial_order=4,
        )
        state = BSSNState3D.minkowski(grid, formulation="bssnok")
        x, _, _ = grid.coordinates
        field = np.sin(2.0 * np.pi * x) + 0.25 * np.cos(4.0 * np.pi * x)
        exact_first = 2.0 * np.pi * np.cos(2.0 * np.pi * x) - np.pi * np.sin(4.0 * np.pi * x)
        exact_second = -4.0 * np.pi**2 * np.sin(2.0 * np.pi * x) - 4.0 * np.pi**2 * np.cos(4.0 * np.pi * x)
        first_errors.append(float(np.sqrt(np.mean((_d1(field, state, 0) - exact_first) ** 2))))
        second_errors.append(float(np.sqrt(np.mean((_d2(field, state, 0) - exact_second) ** 2))))
    assert first_errors[0] / first_errors[1] > 10.0
    assert first_errors[1] / first_errors[2] > 10.0
    assert second_errors[0] / second_errors[1] > 10.0
    assert second_errors[1] / second_errors[2] > 10.0

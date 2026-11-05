from __future__ import annotations

import numpy as np

from .ccz4_reference import CCZ4State1D, Grid1D
from .ccz4_rhs import (
    CCZ4Config,
    _conformal_ricci_bssn,
    _contracted_christoffel,
    advance_ccz4_rk4,
    ccz4_rhs_1d,
    robust_stability_campaign,
)
from .ccz4_reference import BoundaryConfig1D, _christoffel_1d, _ricci_tensor_1d
from .bssn_rhs import _d2


def test_ccz4_minkowski_rhs_and_rk4_are_exactly_zero() -> None:
    state = CCZ4State1D.minkowski(Grid1D(17, -1.0, 1.0), formulation="ccz4")
    rhs = ccz4_rhs_1d(state)
    for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"
    ):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))
    assert rhs.theta_evolution_supported is True
    evolved = advance_ccz4_rk4(state, 0.01, steps=3)
    assert np.array_equal(evolved.h, state.h)
    assert np.array_equal(evolved.lapse, state.lapse)


def test_ccz4_homogeneous_trace_k_matches_vacuum_terms() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0), formulation="ccz4")
    state.trace_k.fill(0.2)
    rhs = ccz4_rhs_1d(state)
    assert np.allclose(rhs.chi, 2.0 * 0.2 / 3.0)
    assert np.allclose(rhs.trace_k, 0.2 * 0.2)
    assert np.allclose(rhs.theta, 0.2 * 0.2 / 3.0)
    assert np.allclose(rhs.lapse, -2.0 * 0.2)


def test_ccz4_theta_damping_and_lapse_coupling_are_explicit() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0), formulation="ccz4")
    state.theta.fill(0.1)
    rhs = ccz4_rhs_1d(state, ccz4=CCZ4Config(kappa1=0.2))
    assert np.allclose(rhs.lapse, 4.0 * 0.1)
    assert np.allclose(rhs.trace_k, -3.0 * 0.2 * 0.1)
    assert np.allclose(rhs.theta, -0.5 * 0.1 * 0.2 * 4.0)
    assert rhs.geometric_gamma_rhs_supplied is True


def test_ccz4_1d_k_trace_uses_only_xx_lapse_second_derivative() -> None:
    grid = Grid1D(32, 0.0, 1.0, boundary=BoundaryConfig1D(kind="periodic"))
    state = CCZ4State1D.minkowski(grid, formulation="ccz4")
    state.lapse[:] = 1.0 + 1.0e-2 * np.cos(2.0 * np.pi * grid.x)
    rhs = ccz4_rhs_1d(state)
    # All curvature and Z4 terms vanish for this state.  In a 1-D reduction
    # the trace contains the x-x second derivative once, not three diagonal
    # copies of the same derivative.
    assert np.allclose(rhs.trace_k, -_d2(state.lapse, grid), rtol=0.0, atol=1.0e-13)


def test_evolved_gamma_ricci_converges_for_nontrivial_conformal_metric() -> None:
    errors: list[float] = []
    for points in (32, 64, 128):
        grid = Grid1D(
            points,
            0.0,
            1.0,
            boundary=BoundaryConfig1D(kind="periodic"),
        )
        state = CCZ4State1D.minkowski(grid, formulation="ccz4")
        first = 1.0 + 0.1 * np.sin(2.0 * np.pi * grid.x)
        second = 1.0 - 0.05 * np.sin(2.0 * np.pi * grid.x)
        state.h[:, 0, 0] = first
        state.h[:, 1, 1] = second
        state.h[:, 2, 2] = 1.0 / (first * second)
        h_inverse = np.linalg.inv(state.h)
        chris = _christoffel_1d(state.h, h_inverse, grid)
        state.conformal_gamma[:] = _contracted_christoffel(chris, h_inverse)
        direct = _ricci_tensor_1d(state.h, h_inverse, grid)
        reconstructed = _conformal_ricci_bssn(state, h_inverse)
        errors.append(float(np.sqrt(np.mean((direct - reconstructed) ** 2))))
    assert errors[0] / errors[1] > 3.5
    assert errors[1] / errors[2] > 3.5


def test_seeded_robust_stability_campaign_is_finite_and_replayable() -> None:
    first = robust_stability_campaign(points=17, checkpoints=(1, 3, 5))
    second = robust_stability_campaign(points=17, checkpoints=(1, 3, 5))
    assert first == second
    assert first.passed is True
    assert first.samples[-1].min_chi > 0.0
    assert first.samples[-1].min_lapse > 0.0

from __future__ import annotations

import numpy as np

from .ccz4_reference import (
    CCZ4_STATE_VARIABLES,
    CCZ4State1D,
    BoundaryConfig1D,
    GaugeConfig,
    Grid1D,
    ccz4_conformal_momentum_constraint,
    constraint_report,
    gauge_wave_constraint_convergence,
    gauge_rhs,
)


def test_ccz4_state_layout_matches_the_cross_backend_contract() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0))
    assert len(CCZ4_STATE_VARIABLES) == 25
    assert state.variable_names == CCZ4_STATE_VARIABLES
    assert state.h.shape == (9, 3, 3)
    assert state.a.shape == (9, 3, 3)
    assert state.conformal_gamma.shape == (9, 3)


def test_minkowski_constraints_are_zero() -> None:
    state = CCZ4State1D.minkowski(Grid1D(17, -1.0, 1.0))
    report = constraint_report(state)
    assert max(report.norms.values()) == 0.0


def test_vacuum_hamiltonian_constraint_detects_nonzero_trace_k() -> None:
    state = CCZ4State1D.minkowski(Grid1D(17, -1.0, 1.0))
    state.trace_k.fill(0.3)
    report = constraint_report(state)
    assert np.allclose(report.hamiltonian, 2.0 * 0.3 * 0.3 / 3.0)
    assert report.norms["momentum_l_inf"] == 0.0


def test_ccz4_conformal_momentum_distinguishes_physical_k_from_z4c_khat() -> None:
    grid = Grid1D(33, 0.0, 1.0)
    state = CCZ4State1D.minkowski(grid, formulation="ccz4")
    state.theta[:] = 1.0e-4 * np.sin(2.0 * np.pi * grid.x)
    pure_theta = ccz4_conformal_momentum_constraint(state)
    assert np.max(np.abs(pure_theta)) == 0.0

    # A Z4c state with K_hat=0 has physical K=K_hat+2 Theta.  Make that
    # conversion explicit before passing the state to the FO-CCZ4 contract.
    state.trace_k[:] = 2.0 * state.theta
    modified = ccz4_conformal_momentum_constraint(state)
    expected = -(4.0 / 3.0) * (
        np.roll(state.theta, -1) - np.roll(state.theta, 1)
    ) / (2.0 * grid.dx)
    assert np.max(np.abs(modified[:, 0])) > 0.0
    assert np.max(np.abs(modified[:, 0] - expected)) < 1.0e-14
    assert np.max(np.abs(modified[:, 1:])) == 0.0


def test_one_plus_log_and_gamma_driver_equations_are_explicit() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0))
    state.trace_k.fill(0.25)
    state.b[:, 0] = 0.4
    geometric_gamma_rhs = np.zeros((9, 3), dtype=np.float64)
    geometric_gamma_rhs[:, 0] = 0.2

    rhs = gauge_rhs(
        state,
        GaugeConfig(lapse_coefficient=2.0, shift_coefficient=0.75, shift_damping=1.0),
        geometric_gamma_rhs=geometric_gamma_rhs,
    )

    assert np.allclose(rhs.lapse, -0.5)
    assert np.allclose(rhs.shift[:, 0], 0.3)
    assert np.allclose(rhs.b[:, 0], -0.2)
    assert rhs.geometric_gamma_rhs_supplied is True


def test_advective_gamma_driver_transports_b_minus_gamma() -> None:
    grid = Grid1D(64, 0.0, 2.0 * np.pi)
    state = CCZ4State1D.minkowski(grid)
    x = grid.x
    dx = grid.dx
    beta = 0.3
    state.shift[:, 0] = beta
    state.lapse[:] = 1.0 + 0.1 * np.sin(x)
    state.b[:, 0] = 0.6 * np.cos(x)
    state.conformal_gamma[:, 0] = 0.4 * np.sin(x)
    geometric_gamma_rhs = np.zeros((grid.points, 3), dtype=np.float64)
    geometric_gamma_rhs[:, 0] = 0.2 + 0.1 * np.cos(x)

    advective = gauge_rhs(
        state,
        GaugeConfig(shift_damping=1.0, advective=True),
        geometric_gamma_rhs=geometric_gamma_rhs,
    )
    non_advective = gauge_rhs(
        state,
        GaugeConfig(shift_damping=1.0, advective=False),
        geometric_gamma_rhs=geometric_gamma_rhs,
    )
    centered_factor = np.sin(dx) / dx
    expected_lapse_delta = beta * 0.1 * np.cos(x) * centered_factor
    expected_b_delta = beta * (-0.6 * np.sin(x) - 0.4 * np.cos(x)) * centered_factor

    assert np.allclose(advective.lapse - non_advective.lapse, expected_lapse_delta)
    assert np.allclose(advective.shift, non_advective.shift)
    assert np.allclose(advective.b[:, 0] - non_advective.b[:, 0], expected_b_delta)


def test_boundary_contract_is_preserved_for_periodic_and_sommerfeld() -> None:
    periodic = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0))
    assert periodic.boundary_contract == "periodic"
    sommerfeld_grid = Grid1D(
        9,
        -1.0,
        1.0,
        boundary=BoundaryConfig1D(kind="sommerfeld", asymptotic_value=1.0),
    )
    assert CCZ4State1D.minkowski(sommerfeld_grid).boundary_contract == "sommerfeld"


def test_sommerfeld_boundary_uses_one_sided_gauge_derivatives() -> None:
    grid = Grid1D(
        9,
        -1.0,
        1.0,
        boundary=BoundaryConfig1D(kind="sommerfeld", asymptotic_value=1.0),
    )
    state = CCZ4State1D.minkowski(grid)
    state.shift[:, 0] = 0.5
    state.lapse[:] = 1.0 + 0.2 * grid.x * grid.x
    rhs = gauge_rhs(state, GaugeConfig(advective=True))
    expected = 0.5 * np.gradient(state.lapse, grid.dx, edge_order=1)
    assert np.allclose(rhs.lapse, expected)


def test_exact_gauge_wave_constraints_are_roundoff_bounded() -> None:
    report = gauge_wave_constraint_convergence(grid_sizes=(32, 64, 128))
    assert report.roundoff_limited is True
    assert report.passed is True
    assert report.hamiltonian_orders == ()
    assert report.momentum_orders == ()

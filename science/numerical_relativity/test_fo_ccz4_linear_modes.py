from dataclasses import replace

import numpy as np
import pytest

from .fo_ccz4_checkpoint import FOCheckpoint, checkpoint_from_state
from .fo_ccz4_principal_symbol import _rhs_components
from .fo_ccz4_rhs import FOCCZ4State3D, _geometry, fo_ccz4_rhs_3d
from .fo_ccz4_linear_modes import (
    GAUGE, INDEX, PROFILE, centered_wave_number, connection_consistent_initial_checkpoint,
    evolve_mode, linear_gauge_wave_mode, linear_hamiltonian_mode, minkowski_source_matrix, plane_generator,
)
from .nr3d import BSSNState3D, Grid3D


def seed(n=7, amplitude=0.):
    grid = Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=2)
    base = BSSNState3D.gauge_wave(grid, amplitude=amplitude)
    return checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE, dt=1./256, amplitude=amplitude)


@pytest.mark.parametrize("mode", (0, 1))
def test_full_58_column_operator_matches_nonlinear_rhs_linearization(mode):
    n, epsilon = 7, 1.e-6
    checkpoint = seed(n)
    wave = np.broadcast_to(np.cos(2.*np.pi*mode*np.arange(n)/n)[:, None, None], (n,)*3)
    numerical = np.zeros((58, 58), dtype=complex)
    for column in range(58):
        observations = []
        for sign in (1., -1.):
            slots = list(checkpoint.slots)
            slots[column] = slots[column]+sign*epsilon*wave
            state = FOCheckpoint(checkpoint.header, tuple(slots), PROFILE).to_state()
            rhs = fo_ccz4_rhs_3d(state, gauge=GAUGE, gauge_profile=PROFILE)
            observations.append(np.stack([v[:, 0, 0] for v in _rhs_components(rhs)]))
        linearized = (observations[0]-observations[1])/(2.*epsilon)
        numerical[:, column] = (linearized[:, 0] if mode == 0
                                 else 2.*np.fft.fft(linearized, axis=1)[:, 1]/n)
    expected = plane_generator(0. if mode == 0 else centered_wave_number(n))
    np.testing.assert_allclose(numerical, expected, atol=1.e-7, rtol=0.)


def test_zero_order_theta_and_connection_damping_analytic_solution():
    q = np.zeros(58, dtype=complex)
    q[INDEX["Theta"]] = 1.e-4
    q[INDEX["GammaHat0"]] = 2.e-4
    t = .7
    actual = evolve_mode(q, 0., t)
    assert actual[INDEX["Theta"]] == pytest.approx(1.e-4*np.exp(-.2*t))
    assert actual[INDEX["K"]] == pytest.approx(-1.5e-4*(1.-np.exp(-.2*t)))
    assert actual[INDEX["GammaHat0"]] == pytest.approx(2.e-4*np.exp(-.1*t))
    assert actual[INDEX["b0"]] == pytest.approx(2.e-4*(np.exp(-.1*t)-1.))
    assert np.linalg.norm(minkowski_source_matrix()[:11]) > 0.


@pytest.mark.parametrize("n", (9, 13, 17))
def test_linear_initial_coefficients_match_small_amplitude_analytic_slice(n):
    amplitude = 1.e-5
    checkpoint = seed(n, amplitude)
    actual = np.array([np.fft.fft(slot[:, 0, 0])[1]/n for slot in checkpoint.slots])
    expected = linear_gauge_wave_mode(amplitude, centered_wave_number(n))
    np.testing.assert_allclose(actual, expected, atol=1.e-12, rtol=0.)


@pytest.mark.parametrize("kd", (2.*np.pi, centered_wave_number(9), centered_wave_number(17)))
def test_consistent_linear_initialization_keeps_hamiltonian_mode_zero(kd):
    q = linear_gauge_wave_mode(1.e-4, kd, gamma_k=kd)
    for t in (.25, .5, .75, 1.):
        assert abs(linear_hamiltonian_mode(evolve_mode(q, kd, t))) < 1.e-12
        assert abs(linear_hamiltonian_mode(evolve_mode(q, kd, t, dt=1./256))) < 1.e-12


def test_rk4_matrix_polynomial_has_fourth_order_against_exponential():
    kd = centered_wave_number(9)
    q = linear_gauge_wave_mode(1.e-4, kd)
    exact = evolve_mode(q, kd, 1.)
    errors = [np.linalg.norm(evolve_mode(q, kd, 1., dt=dt)-exact) for dt in (.02, .01, .005)]
    assert min(np.log2(np.asarray(errors[:-1])/errors[1:])) > 3.8


def test_initial_connection_control_changes_only_gamma_and_does_not_mutate_input():
    initial = seed(7, .001)
    before = initial.to_bytes()
    corrected = connection_consistent_initial_checkpoint(initial)
    assert initial.to_bytes() == before
    assert initial.header == corrected.header
    for i in range(58):
        if i not in (19, 20, 21):
            np.testing.assert_array_equal(initial.slots[i], corrected.slots[i])
    state = corrected.to_state()
    np.testing.assert_allclose(state.base.conformal_gamma, _geometry(state)[7], atol=2.e-18, rtol=0.)
    assert np.max(abs(initial.slots[19]-corrected.slots[19])) > 1.e-6


@pytest.mark.parametrize("field,value", (("step", 1), ("time", .1)))
def test_projection_of_evolved_state_is_rejected(field, value):
    initial = seed()
    altered = replace(initial, header={**initial.header, field: value})
    with pytest.raises(ValueError, match="initial-data only"):
        connection_consistent_initial_checkpoint(altered)


@pytest.mark.parametrize("n", (4, 9., True, -1))
def test_grid_size_contract(n):
    with pytest.raises(ValueError):
        centered_wave_number(n)


@pytest.mark.parametrize("time,dt", ((-1., None), (float("nan"), None), (1., 0.), (1., .3)))
def test_evolution_time_and_step_contract(time, dt):
    with pytest.raises(ValueError):
        evolve_mode(np.zeros(58), 2.*np.pi, time, dt=dt)


def test_bad_mode_or_wave_number_is_rejected():
    with pytest.raises(ValueError):
        evolve_mode(np.zeros(57), 1., 1.)
    with pytest.raises(ValueError):
        plane_generator(float("nan"))
    with pytest.raises(ValueError):
        linear_hamiltonian_mode(np.zeros(57))
    with pytest.raises(ValueError):
        linear_gauge_wave_mode(1., 1.)

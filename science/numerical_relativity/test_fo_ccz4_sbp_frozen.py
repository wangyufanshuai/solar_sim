from dataclasses import replace

import numpy as np
import pytest
from scipy.linalg import expm

from .fo_ccz4_checkpoint import FOCheckpoint, checkpoint_from_state
from .fo_ccz4_principal_symbol import _rhs_components
from .fo_ccz4_rhs import FOCCZ4State3D, fo_ccz4_rhs_3d
from .fo_ccz4_sbp_frozen import (
    CONFIG, FLAGS, GAUGE, INDEX, PROFILE, FrozenSBPLine, PlaneBoundary, SBP42,
    build_system, constraint_fields, plane_mode, plane_values, source_matrix,
    unit_normal, weighted_l2,
)
from .nr3d import BSSNState3D, Grid3D

NORMALS = ((1., 0., 0.), (0., 1., 0.), (0., 0., 1.), (1., 2., 3.))


@pytest.fixture(scope="module", params=NORMALS)
def system(request):
    return build_system(request.param)


@pytest.fixture(scope="module")
def line():
    return FrozenSBPLine(build_system(), SBP42(17, 1./8.))


def test_full_basis_keeps_sources_and_all_zero_modes(system):
    assert system.identity["basis_rank"] == 58
    assert system.identity["left_incoming"] == system.identity["right_incoming"] == 16
    assert system.identity["zero_modes"] == 26
    assert system.identity["parameters"]["tau_inverse"] == 1.
    assert np.linalg.eigvalsh(system.symmetrizer)[0] > 0.
    assert np.linalg.norm(system.source[:11]) > 0.
    assert not np.any(system.principal[:11]) and not np.any(system.principal[:, :11])
    assert all(system.identity[key] is False for key in FLAGS)
    for value in (system.normal, system.principal, system.source, system.basis, system.inverse_basis,
                  system.roots, system.symmetrizer):
        assert not value.flags.writeable


@pytest.mark.parametrize("axis", (None, 0, 1, 2))
def test_all58_columns_match_actual_nonlinear_rhs_with_relaxation(axis):
    n, epsilon = 5, 1.e-6
    grid = Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic")
    initial = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid))
    checkpoint = checkpoint_from_state(initial, profile=PROFILE, dt=1./256., amplitude=0., tau_inverse=1.)
    wave = np.ones((n,)*3) if axis is None else np.cos(2.*np.pi*grid.coordinates[axis])
    measured = np.zeros((58, 58), dtype=complex)
    selection = [0, 0, 0]
    selection[0 if axis is None else axis] = slice(None)
    for column in range(58):
        observed = []
        for sign in (1., -1.):
            slots = list(checkpoint.slots)
            slots[column] = slots[column]+sign*epsilon*wave
            state = FOCheckpoint(checkpoint.header, tuple(slots), PROFILE, tau_inverse=1.).to_state()
            rhs = fo_ccz4_rhs_3d(state, gauge=GAUGE, config=replace(CONFIG, tau_inverse=1.), gauge_profile=PROFILE)
            observed.append(np.stack([field[tuple(selection)] for field in _rhs_components(rhs)]))
        linearized = (observed[0]-observed[1])/(2.*epsilon)
        measured[:, column] = linearized[:, 0] if axis is None else 2.*np.fft.fft(linearized, axis=1)[:, 1]/n
    expected = source_matrix().astype(complex)
    if axis is not None:
        expected += 1j*n*np.sin(2.*np.pi/n)*build_system(np.eye(3)[axis]).principal
    np.testing.assert_allclose(measured, expected, atol=1.e-7, rtol=0.)


def test_trace_source_relaxation_matches_closed_form():
    initial = np.zeros(58)
    initial[INDEX["h00"]] = 1.
    initial[INDEX["A11"]] = 2.
    result = expm(.4*source_matrix())@initial
    assert sum(result[INDEX[f"h{i}{i}"]] for i in range(3)) == pytest.approx(np.exp(-1.2))
    assert sum(result[INDEX[f"A{i}{i}"]] for i in range(3)) == pytest.approx(2.*np.exp(-1.2))
    np.testing.assert_array_equal(source_matrix(0.), source_matrix(0.))
    assert source_matrix()[INDEX["Theta"], INDEX["Theta"]] == -.2


def test_source_only_constant_field_and_input_immutability(system):
    line = FrozenSBPLine(system, SBP42(17, .1))
    row = np.linspace(-.01, .02, 58)
    q = np.repeat(row[None, :], 17, axis=0)
    data = q[[0, -1]].copy()
    old, old_data = q.copy(), data.copy()
    np.testing.assert_allclose(line.rhs(q, data), q@system.source.T, atol=0., rtol=0.)
    np.testing.assert_array_equal(q, old)
    np.testing.assert_array_equal(data, old_data)


@pytest.mark.parametrize("forced", (False, True))
def test_energy_identity_has_source_and_both_faces(system, forced):
    line = FrozenSBPLine(system, SBP42(33, 1./16.))
    rng = np.random.default_rng(20261008)
    q = rng.normal(size=(33, 58))*.03
    data = rng.normal(size=(2, 58))*.02 if forced else None
    result = line.balance(q, data)
    scale = max(1., *(abs(v) for v in result.values()))
    assert abs(result["balance_residual"]) <= 2.e-11*scale
    assert abs(result["boundary_identity_residual"]) <= 2.e-11*scale
    assert result["source_excess"] <= 2.e-11*scale
    assert result["incoming_loss"] >= 0. and result["outgoing_loss"] >= 0.
    if not forced:
        assert result["injection"] == 0.
        assert result["characteristic_boundary_rate"] <= 0.
    assert abs(result["source_rate"]) > 1.e-8


@pytest.mark.parametrize("column", range(58))
def test_each_characteristic_penalty_sign_and_physical_direction(line, column):
    q = np.zeros((17, 58))
    q[0] = line.system.basis[:, column]
    q[-1] = 2.*line.system.basis[:, column]
    penalty = line.penalties(q)@line.system.inverse_basis.T
    expected = np.zeros((2, 58))
    root = line.system.roots[column]
    expected[0, column] = min(root, 0.)/line.operator.norm_weights[0]
    expected[1, column] = -2.*max(root, 0.)/line.operator.norm_weights[-1]
    np.testing.assert_allclose(penalty, expected, atol=2.e-11, rtol=0.)


def test_outgoing_and_zero_speed_data_do_not_inject(line):
    q = np.zeros((17, 58))
    g = np.zeros((2, 58))
    for face, outgoing in ((0, line.system.roots >= 0.), (1, line.system.roots <= 0.)):
        g[face] = line.system.basis[:, outgoing]@np.ones(np.sum(outgoing))
    np.testing.assert_allclose(line.rhs(q, g), np.zeros_like(q), atol=2.e-12, rtol=0.)


def test_tt_continuum_generator_and_independent_null_constraints(system):
    mode = plane_mode("tt-plus", system.normal)
    generator = system.source+1j*np.pi*system.principal
    np.testing.assert_allclose(generator@mode, -1j*np.pi*mode, atol=3.e-17, rtol=0.)
    evolved = expm(.5*generator)@mode
    np.testing.assert_allclose(evolved, np.exp(-.5j*np.pi)*mode, atol=3.e-17, rtol=0.)
    x = np.linspace(-1., 1., 17)
    fields = [plane_values(evolved, x, derivative=d) for d in range(3)]
    for value in constraint_fields(*fields, system.normal).values():
        assert np.max(np.abs(value)) < 3.e-17


def test_metric_diagnostic_does_not_depend_on_auxiliary_fields():
    x = np.linspace(-1., 1., 17)
    mode = np.zeros(58, dtype=complex)
    mode[INDEX["h11"]] = 1.e-3
    fields = [plane_values(mode, x, derivative=d) for d in range(3)]
    observed = constraint_fields(*fields, (1., 0., 0.))
    np.testing.assert_allclose(observed["H_metric"], 1.e-3*np.pi**2*np.cos(np.pi*x), atol=1.e-17)
    assert not np.any(observed["H_fo"])
    assert np.max(np.abs(observed["C_D"])) > 0.


def test_metric_and_stored_K_momentum_distinguish_trace_violation():
    q, dq, ddq = (np.zeros((17, 58)) for _ in range(3))
    q[:, INDEX["A11"]] = np.linspace(-1., 1., 17)
    dq[:, INDEX["A11"]] = 1.
    fields = constraint_fields(q, dq, ddq, (1., 0., 0.))
    assert not np.any(fields["M_stored_K"])
    np.testing.assert_array_equal(fields["M_metric"][:, 0], -np.ones(17))
    q[:], dq[:] = 0., 0.
    q[:, INDEX["Theta"]], dq[:, INDEX["Theta"]] = 2., 3.
    fields = constraint_fields(q, dq, ddq, (1., 0., 0.))
    assert not np.any(fields["M_metric"]) and not np.any(fields["H_metric"])


def test_source_inclusive_RK4_replays_same_halfstep_indices(line):
    dt, steps = 1./128., 12
    mode = plane_mode("full58", line.system.normal)
    table = PlaneBoundary(line.system, mode, dt, steps)
    q0 = plane_values(mode, np.linspace(-1., 1., 17))
    direct = q0.copy()
    for step in range(steps):
        direct = line.step(direct, step, dt, table)
    split = q0.copy()
    for first, last in ((0, 5), (5, steps)):
        for step in range(first, last):
            split = line.step(split, step, dt, table)
    np.testing.assert_array_equal(direct, split)
    assert table.table_error < 2.e-12
    assert np.max(np.abs(direct-q0)) > 1.e-6
    assert weighted_l2(direct-q0, line.operator.norm_weights) > 0.


@pytest.mark.parametrize("normal", ((0., 0., 0.), (1., 0.), (float("nan"), 1., 0.), (1j, 0., 0.), (True, False, False)))
def test_invalid_normals_rejected(normal):
    with pytest.raises(ValueError):
        unit_normal(normal)


@pytest.mark.parametrize("rate", (-1., float("nan"), float("inf"), True, 1j, "1"))
def test_invalid_source_rates_rejected(rate):
    with pytest.raises(ValueError):
        source_matrix(rate)


@pytest.mark.parametrize("bad", (np.zeros((17, 57)), np.zeros((17, 58), dtype=complex), np.full((17, 58), np.nan)))
def test_invalid_field_rejected(line, bad):
    with pytest.raises(ValueError):
        line.rhs(bad)


@pytest.mark.parametrize("bad", (np.zeros((58,)), np.zeros((2, 58), dtype=complex), np.full((2, 58), np.inf)))
def test_invalid_boundary_rejected(line, bad):
    with pytest.raises(ValueError):
        line.rhs(np.zeros((17, 58)), bad)


@pytest.mark.parametrize("index,dt", ((True, .001), (-1, .001), (0, 0.), (0, float("nan")), (0, 1.)))
def test_invalid_step_or_excessive_CFL_rejected(line, index, dt):
    with pytest.raises(ValueError):
        line.step(np.zeros((17, 58)), index, dt)


def test_invalid_reference_inputs_rejected(line):
    with pytest.raises(ValueError):
        plane_mode("unknown", (1., 0., 0.))
    with pytest.raises(ValueError):
        plane_values(np.zeros(57), np.zeros(17))
    with pytest.raises(ValueError):
        plane_values(np.zeros(58), np.zeros(17), derivative=3)
    with pytest.raises(ValueError):
        PlaneBoundary(line.system, np.zeros(58), .01, 0)
    with pytest.raises(ValueError):
        PlaneBoundary(line.system, np.zeros(58), .01, 4, endpoints=(1., -1.))
    table = PlaneBoundary(line.system, np.zeros(58), .001, 4)
    for index in (-1, 9, True, 1.5):
        with pytest.raises(ValueError):
            table(index)
    with pytest.raises(ValueError):
        weighted_l2(np.zeros((17, 58)), np.zeros(17))
    with pytest.raises(ValueError):
        constraint_fields(np.zeros((17, 57)), np.zeros((17, 57)), np.zeros((17, 57)), (1., 0., 0.))

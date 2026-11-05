"""Coupled nonlinear reference tests; no physical/long-time admission."""
import numpy as np
import pytest

from science.numerical_relativity.fo_ccz4_sbp_frozen import build_system
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube, face, local_split
from science.numerical_relativity.nr3d import Grid3D


def cube():
    return NonlinearSBPCube(Grid3D((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))


def flat():
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    return q


@pytest.mark.parametrize("axis", [0, 1, 2])
def test_flat_positive_negative_split_matches_retained_linear_system(axis):
    actual = local_split(np.eye(3), 1., 1., np.zeros(3), axis)
    old = build_system(np.eye(3)[axis])
    np.testing.assert_allclose(actual.principal, old.principal, atol=2.e-14, rtol=0.)
    expected = (old.basis*np.maximum(old.roots, 0.))@old.inverse_basis
    np.testing.assert_allclose(actual.positive, expected, atol=2.e-12, rtol=0.)
    np.testing.assert_allclose(actual.positive+actual.negative, actual.principal, atol=2.e-12, rtol=0.)


@pytest.mark.parametrize("shift", [0., 1.e-14, 1.e-10, 1.e-7, -.05])
@pytest.mark.parametrize("axis", [0, 1, 2])
def test_curved_nondiagonal_metric_tiny_shift_and_mode_directions(shift, axis):
    lower = np.array([[1., 0., 0.], [.15, 1., 0.], [-.08, .12, 1.]])
    h = lower@lower.T
    beta = np.zeros(3)
    beta[axis] = shift
    split = local_split(h, .5, .7, beta, axis)
    assert split.condition < 1.e6 and split.residual < 2.e-11
    for side in (0, 1):
        applied = np.stack([split.penalty(split.basis[:, j], side, .1) for j in range(58)], axis=1)
        roots = np.minimum(split.roots, 0.) if side == 0 else -np.maximum(split.roots, 0.)
        np.testing.assert_allclose(applied, split.basis*roots/.1, atol=2.e-11, rtol=0.)
        np.testing.assert_array_equal(applied[:11], np.zeros((11, 58)))


def test_local_coefficients_are_not_flat_or_initial_scaling():
    first = local_split(np.eye(3), .5, .7, np.zeros(3), 0)
    second = local_split(np.eye(3), .51, .71, np.array([.01, 0., 0.]), 0)
    assert np.max(abs(first.positive-second.positive)) > 1.e-3
    assert not first.positive.flags.writeable


@pytest.mark.parametrize("h", [np.diag([2., 1., 1.]), np.diag([-1., 1., 1.])])
def test_invalid_or_off_contract_metric_is_not_projected(h):
    with pytest.raises(ValueError):
        local_split(h, .5, .7, np.zeros(3), 0)


def test_exact_flat_step_preserves_state_and_visits_all_rk_stages():
    driver, q = cube(), flat()
    before = q.copy()
    targets = driver.boundary_targets(q)
    times = []

    def boundary(index):
        times.append(index)
        return targets

    final, stages = driver.step(q, 3, 1./1024, boundary)
    np.testing.assert_array_equal(final, q)
    np.testing.assert_array_equal(before, q)
    assert times == [6, 7, 7, 8]
    assert len(stages) == 4 and all(len(r["faces"]) == 6 for r in stages)
    assert all(r["basis_builds"] == 3 for r in stages)


def test_metric_constraints_use_physical_metric_not_auxiliary_values():
    driver, q = cube(), flat()
    base = driver.metric_constraints(q)
    q[25:28] = .1
    q[28:37] = .2
    q[37:55] = .3
    q[55:58] = .4
    changed = driver.metric_constraints(q)
    np.testing.assert_array_equal(base["H_metric"], changed["H_metric"])
    np.testing.assert_array_equal(base["M_metric"], changed["M_metric"])
    for key in ("C_A", "C_B", "C_D", "C_P"):
        assert np.max(abs(changed[key])) > .05


def test_physical_trace_not_stored_k_is_used_off_algebraic_constraint():
    driver, q = cube(), flat()
    q[11] = .3
    fields = driver.metric_constraints(q)
    # Physical K_ij=diag(.3,0,0), so (tr K)^2-K_ij K^ij=0, not -.09.
    np.testing.assert_allclose(fields["H_metric"], 0., atol=1.e-14, rtol=0.)
    np.testing.assert_allclose(fields["M_metric"], 0., atol=1.e-14, rtol=0.)


def test_faces_add_at_corners_without_changing_ode_rows():
    driver, q = cube(), flat()
    targets = list(driver.boundary_targets(q))
    targets[0] = targets[0].copy()
    targets[2] = targets[2].copy()
    targets[0][17] = .001
    targets[2][18] = .002
    rhs, report = driver.rhs(q, targets, 1./1024)
    expected = (local_split(np.eye(3), 1., 1., np.zeros(3), 0).penalty(-targets[0][:, 0, 0], 0, driver.volume.axes[0].norm_weights[0])
                +local_split(np.eye(3), 1., 1., np.zeros(3), 1).penalty(-targets[2][:, 0, 0], 0, driver.volume.axes[1].norm_weights[0]))
    # Subtract the constant metric background from a target jump.
    background = q[:, 0, 0, 0]
    expected += local_split(np.eye(3), 1., 1., np.zeros(3), 0).penalty(background, 0, driver.volume.axes[0].norm_weights[0])
    expected += local_split(np.eye(3), 1., 1., np.zeros(3), 1).penalty(background, 0, driver.volume.axes[1].norm_weights[0])
    np.testing.assert_allclose(rhs[:, 0, 0, 0], expected, atol=2.e-14, rtol=0.)
    np.testing.assert_array_equal(rhs[:11], np.zeros_like(rhs[:11]))
    assert report["sat_max_abs"] > 1.e-3


def test_missing_target_invalid_dt_and_legacy_grid_rejected():
    driver, q = cube(), flat()
    with pytest.raises(ValueError, match="six explicit"):
        driver.rhs(q, None, 1./1024)
    with pytest.raises(ValueError, match="CFL"):
        driver.rhs(q, driver.boundary_targets(q), 1.)
    with pytest.raises(ValueError, match="positive finite"):
        driver.rhs(q, driver.boundary_targets(q), 0.)
    with pytest.raises(ValueError, match="explicit sbp"):
        NonlinearSBPCube(Grid3D((9,)*3, (1.,)*3, (3.,)*3))
    with pytest.raises(ValueError):
        face(q, 0, 3)


def test_identity_keeps_physics_and_native_admission_closed():
    identity = cube().identity
    for key in ("physical_validation", "physical_boundary_validated", "cpbc_ready",
                "strong_hyperbolicity_validated", "scientificPayloadWriteback",
                "native_checkpoint_supported", "nonlinear_stability_validated"):
        assert identity[key] is False

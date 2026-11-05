"""Independent moments, analytic geometry, source cancellation and rejection tests."""
import copy

import numpy as np
import pytest

from . import fo_ccz4_boundary_compatibility as Q
from . import fo_ccz4_boundary_stage_channels as C
from .fo_ccz4_checkpoint import checkpoint_from_state
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_schwarzschild import initial_state, SchwarzschildDomain, BOUNDARY
from .fo_ccz4_initial_ordering_source import core_indices
from .fo_ccz4_lapse_constraint_balance import rhs_slots
from .fo_ccz4_rhs import FOCCZ4Config, fo_ccz4_rhs_3d
from .ccz4_reference import GaugeConfig


@pytest.mark.parametrize("axis", range(3))
@pytest.mark.parametrize("degree", range(5))
def test_direct_scalar_derivative_moments(axis, degree):
    x = np.indices((9,)*3)[axis]*.25
    actual = Q.gradient_active(x**degree, .25)
    exact = 0. if degree == 0 else degree*x[2:-2, 2:-2, 2:-2]**(degree-1)
    np.testing.assert_allclose(actual[axis], exact, rtol=0., atol=1.e-13)
    np.testing.assert_allclose(actual[[k for k in range(3) if k != axis]], 0., rtol=0., atol=1.e-13)


@pytest.mark.parametrize("mass", [.25, 1., 3.])
def test_continuum_laplace_is_zero_and_mass_scaling_is_dimensional(mass):
    xyz = np.array([[1., 2., 3.], [2., 1., 1.], [1.2, 1.2, 1.2]])
    baseline, _ = Q.source_at_points(xyz, .125)
    scaled, continuum = Q.source_at_points(mass*xyz, mass*.125, mass)
    assert np.max(abs(continuum)) < 1.e-14
    # Independent scale/coordinate evaluations each cancel O(A/h) terms.
    # Bound arithmetic roundoff, not the much smaller physical truncation source.
    roundoff = 64.*np.finfo(float).eps/.125*(
        np.max(abs(Q.radial(xyz)["A"]))+mass*np.max(abs(Q.radial(mass*xyz, mass)["A"])))
    np.testing.assert_allclose(mass*mass*scaled, baseline, rtol=0., atol=roundoff)


@pytest.mark.parametrize("denominator", [8, 12, 16])
def test_decimal_oracle_matches_double_at_exact_core_nodes(denominator):
    xyz = np.stack(np.meshgrid(*([Q.CORE]*3), indexing="ij"), axis=-1)
    actual, _ = Q.source_at_points(xyz, 1./denominator)
    decimal = Q.decimal_core_source(denominator)
    assert np.max(abs(actual-decimal)) < 2.e-15
    assert np.max(abs(decimal)) > 1.e-12


def test_trace_and_theta_are_not_dropped_or_confused_with_K():
    k = np.zeros((58, 9, 9, 9))
    k[17], k[18], k[11], k[14], k[16] = 7., 3., 1., 2., 4.
    np.testing.assert_array_equal(Q.q_rate(k), np.full((9,)*3, 8.))


def pair_fixture(axis=0):
    q = np.zeros((58, 17, 17, 17))
    q[[0, 3, 5]] = 1.
    raw = np.full((17,)*3, 1.e-4)
    mR = np.ones(raw.shape, dtype=bool)
    indices = [slice(None)]*3
    indices[axis] = slice(0, 2)
    mR[tuple(indices)] = False
    mL = np.ones_like(mR)
    kL, kR = np.zeros_like(q), np.zeros_like(q)
    kL[17], kR[17] = mL*raw, mR*raw
    expected, _ = C.channel_responses(kL-kR, np.ones((13,)*3), 1./256.)
    rateL, rateR = np.zeros_like(q), np.zeros_like(q)
    rateL[:, 2:-2, 2:-2, 2:-2] = expected
    left = {"state": {"q0": q, "k1": kL, "s2": q+kL/512., "k2": rateL},
        "raw_Qdot": raw, "active_mask": mL}
    right = {"state": {"q0": q.copy(), "k1": kR, "s2": q+kR/512., "k2": rateR},
        "raw_Qdot": raw.copy(), "active_mask": mR}
    return left, right


@pytest.mark.parametrize("axis", range(3))
def test_constant_shell_source_has_known_two_layer_response(axis):
    left, right = pair_fixture(axis)
    before = left["state"]["k1"].copy()
    result = Q.inspect_pair(left, right)
    assert result["prediction_passed"]
    assert result["interpretation"] == "fixed-layer-source-compatible"
    assert result["coordinate"]["max_abs"] == 0.
    assert result["outside_two_active_layers"]["max_abs"] == 0.
    assert result["predicted"]["max_abs"] == pytest.approx(7.e-4/(12.*.125*256.), abs=1.e-20)
    np.testing.assert_array_equal(left["state"]["k1"], before)
    assert result["new_evolution_steps"] == 0 and not result["physical_validation"]


def test_zero_pair_is_unresolved_not_positive_mechanism_evidence():
    left, _ = pair_fixture()
    result = Q.inspect_pair(left, left)
    assert result["prediction_passed"] and result["interpretation"] == "unresolved-at-floor"


@pytest.mark.parametrize("axis", range(3))
def test_any_A_response_corruption_is_rejected(axis):
    left, right = pair_fixture()
    left["state"]["k2"][25+axis, 7, 7, 7] += 1.e-5
    assert not Q.inspect_pair(left, right)["prediction_passed"]


def test_wrong_source_sign_is_a_failed_scientific_prediction():
    left, right = pair_fixture()
    left["raw_Qdot"] *= -1.
    right["raw_Qdot"] *= -1.
    out = Q.inspect_pair(left, right)
    assert not out["prediction_passed"] and out["interpretation"] == "unexplained"


def test_real_python_initial_rhs_matches_independent_geometry():
    domain = SchwarzschildDomain()
    data = checkpoint_from_state(initial_state(17, 4, domain), profile=FOCCZ4GaugeProfile(),
        dt=1./256., scenario=2, amplitude=0., tau_inverse=1., domain=domain)
    q = np.asarray(data.slots)
    state = data.to_state()
    k = np.asarray(rhs_slots(fo_ccz4_rhs_3d(state, gauge=GaugeConfig(),
        gauge_profile=data.profile, config=FOCCZ4Config(tau_inverse=1.), boundary_mode=BOUNDARY)))
    xyz = np.stack(state.grid.coordinates, axis=-1)
    out, raw, mask = Q.inspect_initial(q, k, xyz, .125, core_indices(state.grid), Q.decimal_core_source(8))
    assert out["source_prediction_passed"] and out["core_node_count"] == 125
    assert out["unclamped_halo_oracle"]["max_abs"] > Q.LIMIT
    assert mask.dtype == bool and raw.shape == (17,)*3
    damaged = k.copy()
    damaged[17, 8, 8, 8] += 1.e-4
    out, _, _ = Q.inspect_initial(q, damaged, xyz, .125, core_indices(state.grid), Q.decimal_core_source(8))
    assert not out["source_prediction_passed"]


@pytest.mark.parametrize("defect", ["missing", "mask", "shape", "complex", "nan", "dt"])
def test_bad_pair_scope_is_rejected(defect):
    left, right = copy.deepcopy(pair_fixture())
    if defect == "missing":
        left.pop("raw_Qdot")
    elif defect == "mask":
        left["active_mask"] = left["active_mask"].astype(int)
    elif defect == "shape":
        left["raw_Qdot"] = left["raw_Qdot"][:-1]
    elif defect == "complex":
        left["raw_Qdot"] = left["raw_Qdot"].astype(complex)
    elif defect == "nan":
        left["raw_Qdot"][0, 0, 0] = np.nan
    with pytest.raises(ValueError):
        Q.inspect_pair(left, right, dt=.01 if defect == "dt" else 1./256.)


@pytest.mark.parametrize("spacing", [0., -1., float("nan"), float("inf")])
def test_bad_spacing_is_rejected(spacing):
    with pytest.raises(ValueError):
        Q.source_at_points(np.array([1., 1., 1.]), spacing)
    with pytest.raises(ValueError):
        Q.gradient_active(np.zeros((9,)*3), spacing)


@pytest.mark.parametrize("point", [[0., 0., 0.], [.5, 0., 0.], [np.nan, 1., 1.], [1.j, 1., 1.]])
def test_bad_or_nonexterior_geometry_is_rejected(point):
    with pytest.raises(ValueError):
        Q.radial(point)

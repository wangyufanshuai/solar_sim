"""Independent polynomial coefficients, synthetic RHS control and negative paths."""
from dataclasses import replace

import numpy as np
import pytest

from . import fo_ccz4_boundary_stage_channels as C
from .fo_ccz4_checkpoint import checkpoint_from_state
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_schwarzschild import initial_state, SchwarzschildDomain, BOUNDARY
from .fo_ccz4_lapse_constraint_balance import rhs_slots
from .fo_ccz4_rhs import fo_ccz4_rhs_3d, FOCCZ4Config
from .ccz4_reference import GaugeConfig


@pytest.mark.parametrize("axis", range(3))
@pytest.mark.parametrize("degree", range(5))
def test_fd4_polynomial_moments(axis, degree):
    q = np.zeros((58, 9, 9, 9))
    x = np.indices((9,)*3)[axis]*.25
    q[17] = x**degree
    out = C.fd4_interior(q, .25)
    exact = np.zeros((5,)*3) if degree == 0 else degree*x[2:-2, 2:-2, 2:-2]**(degree-1)
    assert np.max(abs(out[axis, 17]-exact)) < 1.e-13
    assert np.max(abs(out[[k for k in range(3) if k != axis]])) < 1.e-13


def gradient():
    return np.zeros((3, 58, 1, 1, 1)), np.full((1, 1, 1), .75)


@pytest.mark.parametrize("axis", range(3))
@pytest.mark.parametrize("slot", [17, 18])
def test_K_and_Theta_are_distinct_physical_variables(axis, slot):
    g, lapse = gradient()
    g[axis, slot] = 1.
    out = C.reduced_response(g, lapse).ravel()
    expected = np.zeros(58)
    expected[19+axis] = expected[22+axis] = -1. if slot == 17 else 1.5
    expected[25+axis] = -2. if slot == 17 else 4.
    expected[55+axis] = .25 if slot == 17 else 0.
    np.testing.assert_allclose(out, expected, rtol=0., atol=1.e-16)


@pytest.mark.parametrize("axis", range(3))
def test_isotropic_trace_ordering_terms_survive(axis):
    g, lapse = gradient()
    g[axis, [11, 14, 16]] = 1.
    out = C.reduced_response(g, lapse).ravel()
    expected = np.zeros(58)
    expected[19+axis] = expected[22+axis] = 4.5
    expected[25+axis], expected[55+axis] = -6., .75
    np.testing.assert_allclose(out, expected, rtol=0., atol=0.)


def test_offdiagonal_B_has_oriented_tensor_and_symmetrized_terms():
    g, lapse = gradient()
    # d_x B_x^y = 1: Gamma_y=1, C=0; only D_xxy=D_xyx=1/2.
    g[0, 29] = 1.
    out = C.reduced_response(g, lapse).ravel()
    expected = np.zeros(58)
    expected[20] = expected[23] = 1.
    expected[38] = .5  # D_xxy: two equal d_x B_x^y terms / 4.
    np.testing.assert_allclose(out, expected, rtol=0., atol=0.)


def test_diagonal_B_symmetrized_divergence_and_trace_removal():
    g, lapse = gradient()
    g[0, 28] = 1.
    out = C.reduced_response(g, lapse).ravel()
    expected = np.zeros(58)
    expected[19] = expected[22] = 4./3.
    expected[55] = -1./3.
    expected[37], expected[40], expected[42] = 2./3., -1./3., -1./3.
    np.testing.assert_allclose(out, expected, rtol=0., atol=2.e-16)


def fixture():
    q = np.zeros((58, 17, 17, 17))
    q[[0, 3, 5]] = 1.
    k1 = np.zeros_like(q)
    k1[17, :2] = 1.e-4
    predicted, _ = C.channel_responses(k1, np.ones((13,)*3), 1./256.)
    k2 = np.zeros_like(q)
    k2[:, 2:-2, 2:-2, 2:-2] = predicted
    a = {"q0": q, "k1": k1, "s2": q+k1/512., "k2": k2}
    b = {"q0": q.copy(), "k1": np.zeros_like(q), "s2": q.copy(), "k2": np.zeros_like(q)}
    return a, b


def test_complete_synthetic_pair_is_nonmutating_and_B_is_not_the_K_channel():
    a, b = fixture()
    before = {k: v.copy() for k, v in a.items()}
    out = C.inspect_pair(a, b)
    assert out["prediction_passed"] and out["B_only_status"] == "insufficient"
    assert len(out["residual"]["by_slot"]) == 58
    assert out["new_evolution_steps"] == 0 and not out["physical_validation"]
    assert out["source_B"]["max_abs"] == 0.
    assert all(np.array_equal(a[k], v) for k, v in before.items())


@pytest.mark.parametrize("slot", range(58))
def test_any_output_slot_corruption_fails_prediction(slot):
    a, b = fixture()
    a["k2"][slot, 3, 3, 3] += 1.e-5
    assert not C.inspect_pair(a, b)["prediction_passed"]


@pytest.mark.parametrize("defect", ["missing", "initial", "h", "active", "stage", "other-rate", "nan", "complex", "dt"])
def test_wrong_scope_is_rejected(defect):
    a, b = fixture()
    if defect == "missing":
        a.pop("s2")
    elif defect in ("initial", "h"):
        a["q0"][7 if defect == "initial" else 0, 8, 8, 8] += .01
    elif defect == "active":
        a["k1"][17, 8, 8, 8] += .01
        a["s2"] = a["q0"]+a["k1"]/512.
    elif defect == "stage":
        a["s2"][17, 8, 8, 8] += .01
    elif defect == "other-rate":
        a["k1"][6, 0, 0, 0] = .01
    elif defect == "nan":
        a["k2"][1, 8, 8, 8] = np.nan
    elif defect == "complex":
        a["k2"] = a["k2"].astype(complex)
    with pytest.raises(ValueError):
        C.inspect_pair(a, b, dt=.01 if defect == "dt" else 1./256.)


def test_linearity_of_four_source_channels_and_zero_null():
    rng = np.random.default_rng(714)
    q = np.zeros((58, 17, 17, 17))
    q[list(C.SOURCE_SLOTS)] = rng.normal(size=(len(C.SOURCE_SLOTS), 17, 17, 17))*1.e-4
    total, parts = C.channel_responses(q, np.full((13,)*3, .75), 1./256.)
    assert np.max(abs(total-sum(parts.values()))) < 1.e-17
    assert np.all(C.reduced_response(np.zeros((3, 58, 1, 1, 1)), np.ones((1,)*3)) == 0.)
    a, b = fixture()
    out = C.inspect_pair(b, b)
    assert out["B_only_status"] == "unresolved" and out["prediction_passed"]


def test_actual_python_rhs_on_synthetic_curved_shell_perturbation():
    domain = SchwarzschildDomain()
    data = checkpoint_from_state(initial_state(17, 4, domain), profile=FOCCZ4GaugeProfile(),
        dt=1./256., scenario=2, amplitude=0., tau_inverse=1., domain=domain)
    q = np.asarray(data.slots)
    delta = np.zeros_like(q)
    rng = np.random.default_rng(271)
    # Perturb one active plane, not the prescribed outer halo. Observe points
    # >=2 grid cells away where local source terms cancel exactly.
    delta[np.ix_(C.SOURCE_SLOTS, [2], range(2, 15), range(2, 15))] = rng.normal(size=(17, 1, 13, 13))*1.e-4
    changed = replace(data, slots=tuple(q+delta/512.))
    kwargs = {"gauge": GaugeConfig(), "gauge_profile": data.profile,
              "config": FOCCZ4Config(tau_inverse=1.), "boundary_mode": BOUNDARY}
    observed = np.asarray(rhs_slots(fo_ccz4_rhs_3d(changed.to_state(), **kwargs)))
    observed -= np.asarray(rhs_slots(fo_ccz4_rhs_3d(data.to_state(), **kwargs)))
    predicted, _ = C.channel_responses(delta, np.exp(q[6, 2:-2, 2:-2, 2:-2]), 1./256.)
    assert np.max(abs(observed[:, 4:-4, 4:-4, 4:-4]-predicted[:, 2:-2, 2:-2, 2:-2])) < 2.e-12


@pytest.mark.parametrize("bad", [0., -1., float("nan"), float("inf")])
def test_bad_spacing_rejected(bad):
    with pytest.raises(ValueError):
        C.fd4_interior(np.zeros((58, 9, 9, 9)), bad)


def test_unsupported_derivative_is_not_silently_ignored():
    g, lapse = gradient()
    g[0, 55] = 1.
    with pytest.raises(ValueError):
        C.reduced_response(g, lapse)

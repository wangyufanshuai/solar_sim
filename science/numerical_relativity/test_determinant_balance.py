"""Analytic and failure controls for read-only determinant budgets."""
import numpy as np
import pytest

from science.numerical_relativity.determinant_balance import (
    decompose, identity, integrate_trapezoid, signed_budget,
)
from science.numerical_relativity.sbp_boundary_operator import SBP42


def constant_fields():
    h = np.broadcast_to(np.eye(3), (2, 2, 2, 3, 3)).copy()
    d = np.zeros((2, 2, 2, 3, 3, 3))
    d[..., 0, :, :] = .1*np.eye(3)
    beta = np.broadcast_to([.2, 0., 0.], (2, 2, 2, 3)).copy()
    rhs = .04*h
    return h, d, beta, rhs


def test_constant_nonzero_auxiliary_forcing_and_no_mutation():
    fields = constant_fields()
    original = [v.tobytes() for v in fields]
    result = decompose(*fields, lambda value, axis: np.zeros_like(value), 1.)
    np.testing.assert_allclose(result["reduction_forcing"], .12, atol=1.e-16, rtol=0.)
    np.testing.assert_allclose(result["balance_residual"], 0., atol=1.e-16, rtol=0.)
    assert all(np.all(result[k] == 0.) for k in ("transport", "chain_rule", "damping"))
    assert [v.tobytes() for v in fields] == original


def test_linear_metric_requires_discrete_chain_rule_term():
    n, a, beta_x = 9, .2, .3
    x, _y, _z = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    h = np.broadcast_to(np.eye(3), (n, n, n, 3, 3)).copy()
    h[..., 0, 0] = 1.+a*x
    d = np.zeros((n, n, n, 3, 3, 3))
    d[..., 0, 0, 0] = a/2.
    beta = np.broadcast_to([beta_x, 0., 0.], (n, n, n, 3))
    rhs = np.zeros_like(h)
    rhs[..., 0, 0] = beta_x*a
    op = SBP42(n, 2./(n-1))
    result = decompose(h, d, beta, rhs, lambda values, axis: op.derivative(values, axis=axis), 0.)
    assert np.max(abs(result["chain_rule"])) > 1.e-6
    np.testing.assert_allclose(result["predicted_rhs"], beta_x*a/(1.+a*x), atol=2.e-14, rtol=0.)
    np.testing.assert_allclose(result["balance_residual"], 0., atol=2.e-14, rtol=0.)
    np.testing.assert_allclose(result["reduction_forcing"], 0., atol=2.e-14, rtol=0.)


@pytest.mark.parametrize("bad", ["nan", "complex", "negative", "shape", "asymmetric", "tau", "callback"])
def test_invalid_balance_input_rejected(bad):
    h, d, beta, rhs = constant_fields()
    tau = 1.
    derivative = lambda value, axis: np.zeros_like(value)  # noqa: E731
    if bad == "nan":
        d[0, 0, 0, 0, 0, 0] = np.nan
    elif bad == "complex":
        beta = beta.astype(complex)
    elif bad == "negative":
        h[..., 0, 0] = -1.
    elif bad == "shape":
        d = d[..., 0]
    elif bad == "asymmetric":
        h[..., 0, 1] = .1
    elif bad == "tau":
        tau = True
    else:
        derivative = lambda value, axis: np.zeros(1)  # noqa: E731
    with pytest.raises(ValueError):
        decompose(h, d, beta, rhs, derivative, tau)


@pytest.mark.parametrize("points", [3, 5, 9])
def test_trapezoid_constant_linear_and_quadratic_error(points):
    t = np.linspace(0., 1., points)
    values = np.stack([np.ones_like(t), t, t*t], axis=1)
    result = integrate_trapezoid(t, values)
    np.testing.assert_allclose(result[:2], [1., .5], atol=1.e-15, rtol=0.)
    assert result[2]-1./3 == pytest.approx(1./(6.*(points-1)**2), abs=1.e-15)


@pytest.mark.parametrize("times", [[0.], [0., 0.], [1., 0.], [0., np.nan], [0., np.inf]])
def test_invalid_sample_times_are_not_integrated(times):
    with pytest.raises(ValueError):
        integrate_trapezoid(times, np.ones((len(times), 3)))


def test_signed_cancellation_is_not_relabelled_percentages():
    delta, w = np.ones((2, 2, 2)), np.ones((2, 2, 2))
    result = signed_budget(delta, {"forcing": 2.*delta, "damping": -delta}, w)
    assert result["signed_projections"] == {"forcing": 2., "damping": -1.}
    assert result["projection_sum"] == 1. and result["reconstruction_residual_rms"] == 0.


@pytest.mark.parametrize("amplitude", [0., 1.e-15, 2.e-14])
def test_unresolved_change_has_no_projected_ratios(amplitude):
    value = np.full((2, 2, 2), amplitude)
    result = signed_budget(value, {"total": value}, np.ones_like(value))
    assert not result["resolved"] and result["signed_projections"] is None and result["projection_sum"] is None


def test_nonclosure_is_reported_not_hidden():
    value = np.ones((2, 2, 2))
    result = signed_budget(value, {"incomplete": .9*value}, value)
    assert result["reconstruction_residual_rms"] == pytest.approx(.1)
    assert result["projection_sum"] == pytest.approx(.9)


@pytest.mark.parametrize("bad", ["weights", "shape", "empty", "nan"])
def test_bad_signed_budget_input_rejected(bad):
    delta, weights = np.ones((2, 2, 2)), np.ones((2, 2, 2))
    terms = {"x": delta.copy()}
    if bad == "weights":
        weights[0, 0, 0] = -1.
    elif bad == "shape":
        terms["x"] = np.ones(3)
    elif bad == "empty":
        terms = {}
    else:
        terms["x"][0, 0, 0] = np.nan
    with pytest.raises(ValueError):
        signed_budget(delta, terms, weights)


def test_identity_never_enables_evolution_or_projection():
    data = identity()
    assert all(data[k] is False for k in ("changes_evolution_rhs", "projection_applied", "physical_validation", "runtime_writeback"))

import math

import numpy as np
import pytest

from .fo_ccz4_fine_relaxation import (CASES, FRESH, RETAINED, FineCase, constraint_orders,
    fit_order, initial_data, richardson_ratio, signed_time_control, state_orders)
from .fo_ccz4_relaxation_convergence import Case, initial


def test_matrix_is_additive_and_frozen():
    assert len(CASES) == len({c.label for c in CASES}) == 20
    assert len(FRESH) == 12 and len(RETAINED) == 8
    assert set(FRESH).isdisjoint(RETAINED) and set(CASES) == set(FRESH) | set(RETAINED)


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("rate", (0., 1.))
def test_retained_initializer_unchanged(order, rate):
    old = initial(Case(order, 16, rate))
    new = initial_data(FineCase(order, 16, rate))
    assert old.to_bytes() == new.to_bytes()


def test_n24_is_new_case_not_a_loosened_old_gate():
    with pytest.raises(ValueError):
        Case(4, 24, 1.)
    a, b = (initial_data(FineCase(4, 24, rate)) for rate in (0., 1.))
    assert a.header["points"] == b.header["points"] == 24
    assert all(np.array_equal(x, y) for x, y in zip(a.slots, b.slots))


@pytest.mark.parametrize("p", (.01, .5, 1., 1.5, 2., 3., 4., 6., 10.))
def test_generalized_ratio_recovers_analytic_power(p):
    h = 1./np.array([16., 24., 32.])
    ratio = (h[0]**p-h[1]**p)/(h[1]**p-h[2]**p)
    assert abs(fit_order(ratio)-p) < 3.e-12
    assert abs(richardson_ratio(p)-ratio) < 2.e-12


def test_fit_is_monotone_and_rejects_outside_range():
    ratios = [richardson_ratio(p) for p in np.linspace(0., 12., 65)]
    assert all(x < y for x, y in zip(ratios, ratios[1:]))
    assert fit_order(ratios[0]) is None and fit_order(ratios[-1]) is None
    assert fit_order(.5) is None


@pytest.mark.parametrize("order", (2, 4))
def test_unequal_constraint_order_uses_correct_ratios_and_floors(order):
    result = constraint_orders([n**(-order) for n in (16., 24., 32.)], order, "H")
    assert result["passed"]
    np.testing.assert_allclose(result["observed_orders"], order, atol=1.e-14, rtol=0.)
    assert not constraint_orders([1., 1., 1.], order, "H")["passed"]
    assert constraint_orders([0., 0., 0.], order, "H")["status"] == "bounded-null"
    assert not constraint_orders([1.e-5, 1.e-10, 1.e-12], order, "H")["passed"]


@pytest.mark.parametrize("order", (2, 4))
def test_state_fit_requires_error_direction_and_order(order):
    shape = np.arange(1., 17.).reshape(2, 2, 2, 2)
    states = [2.+shape/n**order for n in (16., 24., 32.)]
    result = state_orders(states, order)
    assert result["passed"] and abs(result["observed_order"]-order) < 1.e-9
    assert abs(result["alignment"]-1.) < 1.e-12
    # A norm ratio alone can hide opposite-signed leading errors.
    backwards = [shape*(richardson_ratio(order)-1.), -shape, shape*0.]
    assert not state_orders(backwards, order)["passed"]
    assert not state_orders([shape, shape, shape], order)["passed"]


def test_time_control_compares_signed_fields_not_only_norms():
    x = np.ones((2, 2, 2))
    assert signed_time_control(x, x*.999, 1.e-12)["passed"]
    assert not signed_time_control(x, -x, 1.e-12)["passed"]
    assert signed_time_control(x*0., x*0., 1.e-12)["status"] == "bounded-null"
    with pytest.raises(ValueError):
        fit_order(math.nan)


@pytest.mark.parametrize("updates", ({"n":8}, {"n":True}, {"order":3}, {"rate":True},
    {"rate":2.}, {"steps_per_unit":256}, {"n":16, "steps_per_unit":1024}, {"wave":(1,0,0)}))
def test_undeclared_config_rejected(updates):
    with pytest.raises(ValueError):
        FineCase(**({"n":24, "order":4, "rate":1.} | updates))

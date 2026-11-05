from dataclasses import replace
from types import SimpleNamespace

import numpy as np
import pytest

from .fo_ccz4_checkpoint import SYMMETRIC
from .fo_ccz4_trace_source_window import AMPLITUDES, WAVES, Case, d1, initial
from .fo_ccz4_lapse_constraint_balance import balance_fields, rhs_slots, summarize, symmetric


def flat_rhs(data):
    """Closed initial jets: no Ricci, lapse/shift or auxiliary background."""
    q = data.slots
    a = symmetric(q, 11)
    trace = q[11]+q[14]+q[16]
    hdot = -2*(a - np.eye(3)*trace[..., None, None]/3.)
    adot = -2*a@a
    r = [np.zeros_like(q[0]) for _ in range(58)]
    for k, (i, j) in enumerate(SYMMETRIC):
        r[k], r[11+k] = hdot[..., i, j], adot[..., i, j]
    r[25:28] = [-2*d1(trace, i, data.header["spatial_order"]) for i in range(3)]
    return tuple(r)


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("wave", WAVES)
@pytest.mark.parametrize("family", ("trace", "tracefree"))
def test_exact_flat_initial_jets_distinguish_trace_source_and_null_control(order, wave, family):
    data = initial(Case(order, 8, wave, family, AMPLITUDES[1]))
    report = summarize(data, flat_rhs(data))
    assert report["identity_passed"]
    assert max(report["balance_max_abs_errors"].values()) < 2.e-20
    if family == "tracefree":
        assert report["measured_lapse_rate_l_inf"] == 0.
        assert report["geometric_trace_rate_l_inf"] == 0.
    else:
        assert report["measured_lapse_rate_l_inf"] > 1.e-6
        assert report["geometric_trace_rate_l_inf"] > 1.e-13
    assert not report["physical_validation"] and not report["runtime_writeback"]


@pytest.mark.parametrize("slot", (0, 6, 11, 25, 26, 27))
def test_actual_rhs_corruption_cannot_be_hidden_by_identity_rearrangement(slot):
    data = initial(Case(4, 8, WAVES[-1], "trace", AMPLITUDES[1]))
    r = list(flat_rhs(data))
    r[slot] = r[slot] + .01*np.cos(2*np.pi*np.indices((8,)*3)[0]/8)
    assert not summarize(data, tuple(r))["identity_passed"]


def test_rhs_must_contain_finite_complete_fields():
    data = initial(Case(4, 8, WAVES[0], "trace", AMPLITUDES[1]))
    with pytest.raises(ValueError, match="58 finite"):
        balance_fields(data, flat_rhs(data)[:-1])
    r = list(flat_rhs(data))
    r[6] = r[6] + np.nan
    with pytest.raises(ValueError, match="58 finite"):
        balance_fields(data, tuple(r))
    with pytest.raises(ValueError, match="dynamic"):
        balance_fields(replace(data, header={**data.header, "solver_mode": 0}), flat_rhs(data))


def test_rhs_slot_order_is_not_state_serialization():
    names = (("h", (3, 3)), ("ln_lapse", ()), ("shift", (3,)), ("ln_phi", ()),
             ("a", (3, 3)), ("trace_k", ()), ("theta", ()), ("conformal_gamma", (3,)),
             ("b", (3,)), ("lapse_gradient", (3,)), ("shift_gradient", (3, 3)),
             ("metric_gradient", (3, 3, 3)), ("conformal_factor_gradient", (3,)))
    obj = SimpleNamespace(**{name: np.full((5, 5, 5, *shape), i+1.) for i, (name, shape) in enumerate(names)})
    q = rhs_slots(obj)
    assert len(q) == 58
    assert all(x.shape == (5,)*3 for x in q)
    for index, value in ((0, 1.), (6, 2.), (10, 4.), (11, 5.), (17, 6.), (18, 7.),
                         (25, 10.), (28, 11.), (37, 12.), (55, 13.)):
        assert np.all(q[index] == value)

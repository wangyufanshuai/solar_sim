"""Analytic/synthetic unit controls, not strong-field or boundary validation."""
from dataclasses import replace

import numpy as np
import pytest

from . import fo_ccz4_initial_ordering_source as O
from .fo_ccz4_checkpoint import checkpoint_from_state
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_schwarzschild import initial_state, SchwarzschildDomain


def fixture():
    domain = SchwarzschildDomain()
    data = checkpoint_from_state(initial_state(17, 4, domain), profile=FOCCZ4GaugeProfile(),
        dt=1./256, scenario=2, amplitude=0., tau_inverse=1., domain=domain)
    rhs = np.zeros((58, 17, 17, 17))
    grid = domain.grid(17, 4)
    xyz = np.stack(grid.coordinates, axis=-1)[2:-2, 2:-2, 2:-2]
    source = O.source_at_points(xyz, .125).reshape((13, 13, 13, 9))
    rhs[28:37, 2:-2, 2:-2, 2:-2] = np.moveaxis(source, -1, 0)
    return data, rhs


@pytest.mark.parametrize("den", [8, 12, 16])
def test_decimal_agrees_with_independent_binary64_formula(den):
    xyz = np.stack(np.meshgrid(*([O.CORE]*3), indexing="ij"), axis=-1)
    actual = O.source_at_points(xyz, 1./den)
    high = O.decimal_core_source(den)
    assert np.max(abs(actual-high)) < 1.e-14
    assert np.array_equal(high, -np.swapaxes(high, -1, -2))
    assert np.all(np.diagonal(high, axis1=-2, axis2=-1) == 0.)


def test_continuum_hessian_and_zero_curl():
    x = np.array([1.5, 2., 2.5])
    jac = O.radial_fields(x)["dP"]
    assert np.max(abs(jac-jac.T)) < 1.e-17
    for k in range(3):
        shift = np.eye(3)[k]*1.e-5
        finite = (O.radial_fields(x+shift)["P"]-O.radial_fields(x-shift)["P"])/(2.e-5)
        assert np.max(abs(finite-jac[k])) < 1.e-11


@pytest.mark.parametrize("degree", range(6))
def test_stencil_moments_and_leading_truncation_sign(degree):
    moment = sum(weight*offset**degree for offset, weight in O.FD4_OFFSETS_WEIGHTS)/12.
    assert moment == {1: 1., 5: -4.}.get(degree, 0.)


def test_coefficient_scaling_and_orientation():
    x = np.array([[1.5, 2., 2.5], [2., 1.5, 2.5]])
    a = O.source_at_points(x, .125)
    assert np.array_equal(O.source_at_points(x, .125, ordering_scale=.4), 2*a)
    assert abs(a[0, 0, 1]) > 1.e-12
    assert a[0, 0, 1] == -a[0, 1, 0]
    assert abs(a[0, 0, 1]-a[1, 1, 0]) < 1.e-16


def test_complete_synthetic_case_is_nonmutating_and_nine_slot():
    data, rhs = fixture()
    before, previous = data.to_bytes(), rhs.copy()
    value = O.inspect_initial(data, rhs, O.decimal_core_source(8))
    assert value["source_contract_passed"]
    assert [s["slot"] for s in value["slots"]] == list(range(28, 37))
    assert len(value["slots"][0]["core_values"]) == 125
    assert data.to_bytes() == before and np.array_equal(rhs, previous)
    assert value["evolution_steps"] == 0 and value["physical_validation"] is False


@pytest.mark.parametrize("slot", range(28, 37))
def test_each_B_slot_defect_is_detected(slot):
    data, rhs = fixture()
    rhs[slot, 8, 8, 8] += 1.e-5
    assert not O.inspect_initial(data, rhs, O.decimal_core_source(8))["source_contract_passed"]


@pytest.mark.parametrize("defect", ["sign", "transpose", "halo", "decimal"])
def test_contract_rejects_rhs_or_oracle_errors(defect):
    data, rhs = fixture()
    dc = O.decimal_core_source(8)
    if defect == "sign":
        rhs[28:37] *= -1
    elif defect == "transpose":
        rhs[28:37] = rhs[28:37].reshape(3, 3, 17, 17, 17).swapaxes(0, 1).reshape(9, 17, 17, 17)
    elif defect == "halo":
        rhs[29, 0, 8, 8] = 1.e-5
    else:
        dc[0, 0, 0, 0, 1] += 1.e-5
    assert not O.inspect_initial(data, rhs, dc)["source_contract_passed"]


@pytest.mark.parametrize("slot", [0, 3, 5, 6, 7, 10, 22, 25, 28, 37, 55])
def test_nonstatic_or_wrong_initial_fields_refused(slot):
    data, rhs = fixture()
    q = [v.copy() for v in data.slots]
    q[slot][8, 8, 8] += 1.e-4
    with pytest.raises(ValueError):
        O.inspect_initial(replace(data, slots=tuple(q)), rhs, O.decimal_core_source(8))


@pytest.mark.parametrize("field,value", [("time", .125), ("step", 1), ("spatial_order", 2), ("solver_mode", 0)])
def test_noninitial_header_refused(field, value):
    data, rhs = fixture()
    with pytest.raises(ValueError):
        O.inspect_initial(replace(data, header={**data.header, field: value}), rhs, O.decimal_core_source(8))


@pytest.mark.parametrize("bad", [[0., 0., 0.], [float("nan"), 2., 3.], [1., 2.], [1.+1j, 2., 3.]])
def test_invalid_coordinates_refused(bad):
    with pytest.raises(ValueError):
        O.radial_fields(bad)


@pytest.mark.parametrize("bad", [0., -1., float("inf"), float("nan")])
def test_invalid_spacing_refused(bad):
    with pytest.raises(ValueError):
        O.source_at_points([1.5, 2., 2.5], bad)


@pytest.mark.parametrize("bad", [4, 10, True, 8.])
def test_undeclared_decimal_spacing_refused(bad):
    with pytest.raises(ValueError):
        O.decimal_core_source(bad)

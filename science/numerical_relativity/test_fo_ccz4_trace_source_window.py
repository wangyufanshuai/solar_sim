from dataclasses import replace
import math

import numpy as np
import pytest

from .fo_ccz4_trace_source_window import (
    AMPLITUDES, CASES, TIMES, WAVES, Case, assess, d1, initial, initial_oracle,
    metric_constraints, mode, observe, remainder_scaling, residual,
    source_prediction, temporal_comparison,
)


def test_frozen_case_matrix_is_unique_and_complete():
    assert len(CASES) == len({c.label for c in CASES}) == 62
    assert sum(c.n == 8 and c.amplitude == AMPLITUDES[1] and c.steps_per_unit == 256 for c in CASES) == 16
    assert sum(c.steps_per_unit == 512 for c in CASES) == 4
    assert sum(c.n != 8 for c in CASES) == 8


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("axis", (0, 1, 2))
def test_independent_stencil_fundamental_phase_and_constant(order, axis):
    n = 8
    x = np.indices((n,)*3)[axis]/n
    factor = n*np.sin(2*np.pi/n) if order == 2 else n*(8*np.sin(2*np.pi/n)-np.sin(4*np.pi/n))/6
    np.testing.assert_allclose(d1(np.sin(2*np.pi*x), axis, order), factor*np.cos(2*np.pi*x), atol=6.e-15)
    assert np.array_equal(d1(np.full((n,)*3, .1), axis, order), np.zeros((n,)*3))


@pytest.mark.parametrize("order,axis,shape", ((3, 0, (8,)*3), (2., 0, (8,)*3), (2, 3, (8,)*3),
                                            (4, 0, (4,)*3), (2, 0, (8, 7, 8))))
def test_invalid_stencil_cannot_silently_choose_an_order(order, axis, shape):
    with pytest.raises(ValueError, match="FD2/4"):
        d1(np.zeros(shape), axis, order)


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("wave", WAVES)
def test_matched_frobenius_strength_with_only_intended_curvature_slots(order, wave):
    case = Case(order, 8, wave, "trace", AMPLITUDES[1])
    a, b = initial(case), initial(replace(case, family="tracefree"))
    fa = sum(a.slots[i]**2 for i in (11, 14, 16))
    fb = sum(b.slots[i]**2 for i in (11, 14, 16))
    np.testing.assert_allclose(fa, fb, rtol=1.e-15, atol=1.e-40)
    np.testing.assert_allclose(a.slots[11]+a.slots[14]+a.slots[16], mode(case), atol=3.e-22, rtol=1.e-15)
    assert np.array_equal(b.slots[11]+b.slots[14]+b.slots[16], np.zeros((8,)*3))
    assert all(np.array_equal(a.slots[i], b.slots[i]) for i in range(58) if i not in (11, 14, 16))
    assert np.count_nonzero(residual(a.slots, order)) == 0
    assert np.count_nonzero(residual(b.slots, order)) == 0


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("family", ("trace", "tracefree"))
def test_initial_metric_constraints_use_actual_trace_away_from_algebraic_surface(order, family):
    case = Case(order, 8, WAVES[-1], family, AMPLITUDES[1])
    data = initial(case)
    assert max(initial_oracle(case, data).values()) < 1.e-19
    report, h, m = metric_constraints(data)
    if family == "trace":
        f = mode(case)
        np.testing.assert_allclose(h, 2*f*f/3., atol=1.e-26)
        np.testing.assert_allclose(report.hamiltonian, -f*f/3., atol=1.e-26)
        for axis in range(3):
            np.testing.assert_allclose(m[..., axis], -2*d1(f, axis, order)/3., atol=2.e-21)
    else:
        assert np.array_equal(h, report.hamiltonian)
        np.testing.assert_array_equal(m, report.momentum)


@pytest.mark.parametrize("order", (2, 4))
def test_signed_prediction_requires_correct_coefficient_and_sign(order):
    case = Case(order, 8, WAVES[-1], "trace", AMPLITUDES[1])
    seed = initial(case)
    p = source_prediction(seed, .5)
    q = list(seed.slots)
    q[25:28] = list(p)
    data = replace(seed, header={**seed.header, "time": .5, "step": 128}, slots=tuple(q))
    good = observe(case, data, seed)
    assert good["prediction_error"] == 0. and good["signed_slope"] == 1. and good["sample_passed"]
    q[25:28] = list(-p)
    bad = observe(case, replace(data, slots=tuple(q)), seed)
    assert not bad["sample_passed"] and not bad["gates"]["signed_slope"]


@pytest.mark.parametrize("time", (-1., float("nan"), float("inf")))
def test_prediction_rejects_invalid_times(time):
    with pytest.raises(ValueError, match="nonnegative"):
        source_prediction(initial(CASES[0]), time)


def test_roundoff_floor_is_inconclusive_not_fake_order():
    assert remainder_scaling([1.e-14, 4.e-14, 16.e-14])["status"] == "inconclusive-roundoff-floor"
    assert not remainder_scaling([1.e-14, 4.e-14, 16.e-14])["passed"]
    assert remainder_scaling([1.e-9, 4.e-9, 16.e-9])["orders"] == [2., 2.]
    assert remainder_scaling([1.e-9, 2.e-9, 4.e-9])["status"] == "fail"


@pytest.mark.parametrize("errors", ([0., 0.], [1., -1., 4.], [1., math.nan, 4.]))
def test_scaling_rejects_invalid_errors(errors):
    with pytest.raises(ValueError, match="three finite"):
        remainder_scaling(errors)


def synthetic_rows():
    rows = []
    for c in CASES:
        samples = [{"time": t, "step": round(t*c.steps_per_unit), "sample_passed": True,
                    "gates": {"fixture_only": True}, "prediction_error": 20*c.amplitude**2,
                    "continuum_source_error": 1.e-3/c.n**c.order} for t in TIMES]
        rows.append({**c.record(), "samples": samples})
    temporal = [{"order": o, "family": f, "passed": True} for o in (2, 4) for f in ("trace", "tracefree")]
    return rows, temporal


def test_aggregate_has_no_physical_promotion_even_for_synthetic_pass():
    rows, temporal = synthetic_rows()
    result = assess(rows, temporal)
    assert result["prospective_trace_source_screen_passed"]
    assert not result["physical_validation"] and not result["constraint_decay_validated"]
    assert not result["strong_hyperbolicity_validated"] and not result["runtime_writeback"]


@pytest.mark.parametrize("change", ("missing", "duplicate", "time", "step", "metadata", "failure", "temporal"))
def test_incomplete_or_inconsistent_matrix_cannot_pass(change):
    rows, temporal = synthetic_rows()
    if change == "missing":
        rows.pop()
    elif change == "duplicate":
        rows[-1] = rows[0]
    elif change == "time":
        rows[0]["samples"][1]["time"] = .3
    elif change == "step":
        rows[0]["samples"][1]["step"] = 1
    elif change == "metadata":
        rows[0]["amplitude"] *= 2
    elif change == "failure":
        rows[0]["samples"][1]["sample_passed"] = False
    else:
        temporal.pop()
    with pytest.raises(ValueError):
        assess(rows, temporal)


def test_signed_temporal_control_detects_field_change_and_metadata_mismatch():
    case = Case(4, 8, WAVES[-1], "trace", AMPLITUDES[1])
    a, b = initial(case), initial(replace(case, steps_per_unit=512))
    assert temporal_comparison(a, b, case.amplitude)["passed"]
    q = list(b.slots)
    q[22] = q[22] + 1.e-6
    assert not temporal_comparison(a, replace(b, slots=tuple(q)), case.amplitude)["passed"]
    with pytest.raises(ValueError, match="identity mismatch"):
        temporal_comparison(a, a, case.amplitude)


def test_undeclared_case_is_rejected_before_initialization():
    with pytest.raises(ValueError, match="undeclared"):
        initial(Case(4, 9, WAVES[0], "trace", 1.e-6))

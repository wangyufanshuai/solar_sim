"""Synthetic assessor tests do not stand in for the native dynamics campaign."""
from copy import deepcopy

import numpy as np
import pytest

from .fo_ccz4_fd4_window import CONSTRAINT_NORMS, HEALTH_NORMS, assess_fd4_window
from .fo_ccz4_remainder import AMPLITUDE, CASES, FIELDS, TIMES


def fixtures(order=4):
    rows = []
    for family, n, amplitude, steps in CASES:
        samples = []
        for time in TIMES:
            wave = (amplitude/AMPLITUDE)**2*1.e-3/n**order*(1.+time)*np.sin(4.*np.pi*np.arange(n)/n)
            samples.append({"time": time, "step": int(time*steps), "sampled_cfl_sum": .1,
                            "finite_positive": True, "spatial_order": 4, "checkpoint_version": 3,
                            "auxiliary_derivative_order": 4, "min_lapse": .9, "max_lapse": 1.1,
                            "min_chi": .9, "min_metric_eigenvalue": .9,
                            **{key: 0. for key in HEALTH_NORMS},
                            "auxiliary_reduction_l_inf_by_slot": [0.]*33,
                            "constraints": {key: 0. for key in CONSTRAINT_NORMS},
                            "planes": {**{f: wave.tolist() for f in FIELDS},
                                       **{f: [0.]*n for f in ("M_y", "M_z", "Gamma_x", "Gamma_y", "Gamma_z")}}})
        rows.append({"family": family, "points": n, "amplitude": amplitude, "steps": steps,
                     "dt": 1./steps, "spatial_order": 4, "samples": samples})
    return rows


def test_exact_fd4_data_pass_without_mutation_or_physical_promotion():
    rows = fixtures()
    saved = deepcopy(rows)
    result = assess_fd4_window(rows)
    assert rows == saved
    assert result["sampled_fd4_window_gates_passed"]
    for field in FIELDS:
        assert result["spatial"][field]["orders"] == pytest.approx([4.]*3)
        assert result["spatial"][field]["peak_orders"] == pytest.approx([4.]*3)
    assert not result["physical_validation"] and not result["runtime_writeback"]
    assert not result["continuous_window_convergence_validated"]


def test_second_order_pass_is_not_fd4_window_pass():
    result = assess_fd4_window(fixtures(order=2))
    assert result["reference_fd2_threshold_assessment"]["bounded_remainder_gates_passed"]
    assert not result["sampled_fd4_window_gates_passed"]


@pytest.mark.parametrize("mutation", ("missing_case", "duplicate_case", "missing_time", "wrong_time", "wrong_dt"))
def test_incomplete_cases_and_times_rejected(mutation):
    rows = fixtures()
    if mutation == "missing_case":
        rows.pop()
    elif mutation == "duplicate_case":
        rows[-1] = deepcopy(rows[0])
    elif mutation == "missing_time":
        rows[0]["samples"].pop(3)
    elif mutation == "wrong_time":
        rows[0]["samples"][2]["time"] = .3
    else:
        rows[0]["dt"] *= 2.
    with pytest.raises(ValueError):
        assess_fd4_window(rows)


@pytest.mark.parametrize("value", (2, 4., True, None))
def test_explicit_row_order_required(value):
    rows = fixtures()
    rows[0]["spatial_order"] = value
    with pytest.raises(ValueError, match="integer spatial_order"):
        assess_fd4_window(rows)


@pytest.mark.parametrize("key,value", (("checkpoint_version", 2), ("spatial_order", 2),
                                       ("auxiliary_derivative_order", 2), ("min_lapse", 0.),
                                       ("min_chi", -1.), ("min_metric_eigenvalue", float("nan")),
                                       ("max_lapse", .8)))
def test_sample_order_and_physical_domain_rejected(key, value):
    rows = fixtures()
    rows[0]["samples"][3][key] = value
    with pytest.raises(ValueError):
        assess_fd4_window(rows)


@pytest.mark.parametrize("field", ("H_primary", "Gamma_x", "M_z"))
def test_bad_initial_sample_is_not_ignored(field):
    rows = fixtures()
    rows[0]["samples"][0]["planes"][field][0] = float("nan")
    with pytest.raises(ValueError, match="signed planes"):
        assess_fd4_window(rows)


@pytest.mark.parametrize("bad", ("short", "nan", "negative", "inconsistent_max"))
def test_full_auxiliary_residuals_required(bad):
    rows = fixtures()
    sample = rows[0]["samples"][1]
    values = sample["auxiliary_reduction_l_inf_by_slot"]
    if bad == "short":
        values.pop()
    else:
        values[0] = {"nan": float("nan"), "negative": -1., "inconsistent_max": 1.}[bad]
    with pytest.raises(ValueError, match="auxiliary"):
        assess_fd4_window(rows)


@pytest.mark.parametrize("key", HEALTH_NORMS[:2]+CONSTRAINT_NORMS)
def test_transient_supplemental_failure_cannot_hide_behind_good_main_constraints(key):
    rows = fixtures()
    sample = rows[2]["samples"][3]
    (sample if key in HEALTH_NORMS else sample["constraints"])[key] = .002
    result = assess_fd4_window(rows)
    assert result["reference_fd2_threshold_assessment"]["bounded_remainder_gates_passed"]
    assert not result["sampled_fd4_window_gates_passed"]


def test_intermediate_spatial_failure_cannot_hide_behind_good_endpoint():
    rows = fixtures()
    rows[3]["samples"][4]["planes"]["H_primary"] = (100*np.array(rows[3]["samples"][4]["planes"]["H_primary"])).tolist()
    result = assess_fd4_window(rows)
    assert result["spatial"]["H_primary"]["pointwise_orders"][-1] == pytest.approx([4.]*3)
    assert not result["spatial"]["H_primary"]["passed"]


def test_roundoff_cannot_pass_spatial_amplitude_or_temporal_gates():
    rows = fixtures()
    for row in rows:
        for sample in row["samples"]:
            sample["planes"]["Theta"] = [0.]*row["points"]
    result = assess_fd4_window(rows)
    assert result["spatial"]["Theta"]["orders"] == [None]*3
    assert not result["sampled_fd4_window_gates_passed"]


@pytest.mark.parametrize("family", ("amplitude", "time"))
def test_equal_norm_but_wrong_signed_field_fails(family):
    rows = fixtures()
    row = next(row for row in rows if row["family"] == family)
    for sample in row["samples"][1:]:
        sample["planes"]["H_fourier"] = (-np.array(sample["planes"]["H_fourier"])).tolist()
    assert not assess_fd4_window(rows)["sampled_fd4_window_gates_passed"]

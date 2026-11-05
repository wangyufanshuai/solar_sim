"""Manufactured-data guards for a real campaign, not a replacement for it."""
from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

from .fo_ccz4_remainder import AMPLITUDE, CASES, FIELDS, TIMES, assess_remainder


def fixtures():
    rows = []
    for family, n, amplitude, steps in CASES:
        samples = []
        for time in TIMES:
            # Independent closed form: quadratic amplitude, second-order space.
            wave = (amplitude/AMPLITUDE)**2*1.e-4/n**2*(1.+time)*np.sin(4.*np.pi*np.arange(n)/n)
            samples.append({"time": time, "step": int(time*steps), "sampled_cfl_sum": .1,
                            "finite_positive": True, "planes": {f: wave.tolist() for f in FIELDS}})
        rows.append({"family": family, "points": n, "amplitude": amplitude, "steps": steps,
                     "dt": 1./steps, "samples": samples})
    return rows


def test_frozen_design_and_exact_manufactured_orders():
    assert len(CASES) == 7 and len(TIMES) == 9
    result = assess_remainder(fixtures())
    assert result["bounded_remainder_gates_passed"]
    for field in FIELDS:
        assert result["spatial"][field]["orders"] == pytest.approx([2.]*3)
        assert result["spatial"][field]["peak_orders"] == pytest.approx([2.]*3)
        assert result["amplitude"][field]["amplitude_orders"] == pytest.approx([2., 2.])
        assert result["temporal"][field]["fraction"] == 0.
    assert not result["physical_validation"] and not result["runtime_writeback"]
    assert not result["continuous_window_convergence_validated"]


@pytest.mark.parametrize("mutation", ("missing_case", "duplicate_case", "missing_time", "wrong_time", "wrong_step", "wrong_dt", "wrong_shape", "nonfinite"))
def test_incomplete_or_inconsistent_evidence_rejected(mutation):
    rows = fixtures()
    if mutation == "missing_case":
        rows.pop()
    elif mutation == "duplicate_case":
        rows[-1] = deepcopy(rows[0])
    elif mutation == "missing_time":
        rows[0]["samples"].pop(2)
    elif mutation == "wrong_time":
        rows[0]["samples"][2]["time"] = .3
    elif mutation == "wrong_step":
        rows[0]["samples"][2]["step"] += 1
    elif mutation == "wrong_dt":
        rows[0]["dt"] *= 2.
    elif mutation == "wrong_shape":
        rows[0]["samples"][2]["planes"]["H_primary"].pop()
    else:
        rows[0]["samples"][2]["planes"]["H_primary"][0] = float("nan")
    with pytest.raises(ValueError):
        assess_remainder(rows)


def test_equal_norm_sign_reversal_cannot_pass_amplitude_field_collapse():
    rows = fixtures()
    row = next(r for r in rows if r["family"] == "amplitude")
    for sample in row["samples"]:
        sample["planes"]["H_primary"] = (-np.array(sample["planes"]["H_primary"])).tolist()
    value = assess_remainder(rows)["amplitude"]["H_primary"]
    assert value["amplitude_orders"] == pytest.approx([2., 2.])
    assert value["scaled_signed_field_errors"][0] == pytest.approx(2.)
    assert not value["passed"]


def test_good_endpoint_cannot_hide_intermediate_spatial_failure():
    rows = fixtures()
    row = next(r for r in rows if r["points"] == 25)
    row["samples"][4]["planes"]["H_primary"] = (100*np.array(row["samples"][4]["planes"]["H_primary"])).tolist()
    result = assess_remainder(rows)
    assert result["spatial"]["H_primary"]["pointwise_orders"][-1] == pytest.approx([2.]*3)
    assert not result["spatial"]["H_primary"]["passed"]
    assert not result["bounded_remainder_gates_passed"]


def test_temporal_field_phase_difference_not_just_norms():
    rows = fixtures()
    row = next(r for r in rows if r["family"] == "time")
    row["samples"][3]["planes"]["H_fourier"] = (-np.array(row["samples"][3]["planes"]["H_fourier"])).tolist()
    result = assess_remainder(rows)["temporal"]["H_fourier"]
    assert result["fractions_by_time"][2] == pytest.approx(2.)
    assert not result["passed"]


def test_roundoff_is_not_convergence():
    rows = fixtures()
    for row in rows:
        for sample in row["samples"]:
            sample["planes"]["Theta"] = [0.]*row["points"]
    result = assess_remainder(rows)
    assert result["spatial"]["Theta"]["orders"] == [None]*3
    assert not result["bounded_remainder_gates_passed"]


@pytest.mark.parametrize("key,value", (("finite_positive", False), ("sampled_cfl_sum", .46)))
def test_transient_domain_or_cfl_failure_not_hidden(key, value):
    rows = fixtures()
    rows[2]["samples"][3][key] = value
    assert not assess_remainder(rows)["bounded_remainder_gates_passed"]


@pytest.mark.parametrize("value", (float("nan"), float("inf"), -.1))
def test_nonfinite_or_negative_cfl_rejected(value):
    rows = fixtures()
    rows[0]["samples"][0]["sampled_cfl_sum"] = value
    with pytest.raises(ValueError):
        assess_remainder(rows)


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[2]/"scripts/run-nr-k3-fo-ccz4-nonlinear-remainder.py"))


def test_native_driver_initial_fields_identical_across_time_steps(driver):
    coarse = driver["initial_checkpoint"](5, AMPLITUDE, 512)
    fine = driver["initial_checkpoint"](5, AMPLITUDE, 1024)
    assert all(a.tobytes() == b.tobytes() for a, b in zip(coarse.slots, fine.slots))
    assert coarse.header["dt"] == 2.*fine.header["dt"]
    measured = driver["sample"](coarse)
    assert measured["finite_positive"] and measured["time"] == measured["step"] == 0
    assert measured["runtime_writeback"] is False
    assert all(len(measured["planes"][field]) == 5 for field in FIELDS)


def test_native_driver_rejects_unbound_origin_before_trusting_contents(driver, tmp_path):
    receipt = tmp_path/"receipt.json"
    receipt.write_text('{"completed": true}', encoding="utf-8")
    with pytest.raises(ValueError, match="predeclared SHA"):
        driver["validate_origin"](receipt)

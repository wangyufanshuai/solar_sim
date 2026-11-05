from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import runpy

import pytest


@pytest.fixture
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[2]/"scripts/run-nr-k3-fo-ccz4-refinement-separation.py"))


def _time_rows(driver):
    return [{"points":9,"steps":steps,"simulated_time":.02,
             "constraint_profiles":{name:[.1+1./steps**4,.1-1./steps**4] for name in driver["NAMES"]}}
            for steps in (10,20,40)]


def test_temporal_field_difference_not_just_equal_norms(driver):
    rows = _time_rows(driver)
    rows[0]["constraint_profiles"]["hamiltonian_l2"] = [.1,-.1]
    rows[2]["constraint_profiles"]["hamiltonian_l2"] = [-.1,.1]
    result = driver["temporal_contrast"](rows)["constraints"]["hamiltonian_l2"]
    assert result["fraction_of_constraint_residual"] == pytest.approx(2.)
    assert not result["time_influence_below_one_percent"]


def test_rk4_manufactured_differences_are_order_four(driver):
    result = driver["temporal_contrast"](_time_rows(driver))
    assert all(row["temporal_order"] == pytest.approx(4.) for row in result["constraints"].values())


@pytest.mark.parametrize("key,value", (("points",13),("steps",21),("simulated_time",.021)))
def test_temporal_comparison_rejects_mixed_experiments(driver,key,value):
    rows = _time_rows(driver)
    rows[1][key] = value
    with pytest.raises(ValueError):
        driver["temporal_contrast"](rows)


def test_roundoff_differences_do_not_make_a_temporal_order(driver):
    rows = _time_rows(driver)
    for row in rows:
        row["constraint_profiles"] = {name:[1.e-16,1.e-16] for name in driver["NAMES"]}
    result = driver["temporal_contrast"](rows)
    assert all(r["temporal_order"] is None and not r["time_influence_below_one_percent"]
               for r in result["constraints"].values())


def test_predeclared_full_cube_cases_are_complete_and_unique(driver):
    cases = driver["CASES"]
    assert len(cases) == len(set(cases)) == 14
    assert all((n,64) in cases for n in (9,13,17,18,26,34))
    assert (9,11) in cases and (13,16) in cases and (17,21) in cases
    with pytest.raises(ValueError,match="every predeclared case"):
        driver["summarize"]([], {})


def test_baseline_source_or_profile_mismatch_is_rejected(driver):
    identity = driver["REFERENCE"]["source_identity"]()
    baseline = {"schema_version":"nr-k3-fo-ccz4-state-dependent-gauge-v2",
                "source_identity_before":identity,"source_identity_after":identity,
                "profile":driver["PROFILE"].identity(),"method":{"amplitude":1.e-4,"final_time":.02,"spatial_order":2}}
    driver["validate_baseline"](baseline)
    modified = deepcopy(baseline)
    modified["source_identity_before"]["sha256"] = "unverified"
    with pytest.raises(ValueError,match="source identity"):
        driver["validate_baseline"](modified)
    modified = deepcopy(baseline)
    modified["profile"]["parameters"]["shift_scale"] = 4.
    with pytest.raises(ValueError,match="profile mismatch"):
        driver["validate_baseline"](modified)


def test_receipt_no_overwrite_and_nonfinite_guard(driver,tmp_path):
    output = tmp_path/"receipt.json"
    with pytest.raises(ValueError):
        driver["write_new_json"](output,{"bad":float("nan")})
    assert not output.exists()
    driver["write_new_json"](output,{"value":1.})
    before = output.read_bytes()
    with pytest.raises(FileExistsError):
        driver["write_new_json"](output,{"value":2.})
    assert output.read_bytes() == before

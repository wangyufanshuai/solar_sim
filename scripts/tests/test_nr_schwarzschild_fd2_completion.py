from copy import deepcopy
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-fd2-completion.py"))


def rows():
    return [{"order": 2, "n": n, "samples": [{"diagnostics": {"time": t,
        "core": {m: {"l2": (1./(n-1))**2} for m in RUN["WINDOW"]["METRICS"]}}}
        for t in RUN["WINDOW"]["TIMES"]]} for n in (17, 25, 33)]


def test_fd2_assessment_cannot_claim_full_window():
    result = RUN["assess_fd2"](rows())
    assert result["passed"] and len(result["groups"]) == 15
    assert {g["spatial_order"] for g in result["groups"]} == {2}
    assert "window_passed" not in result


@pytest.mark.parametrize("defect", ["case", "time", "field", "duplicate", "order", "nonfinite"])
def test_missing_or_invalid_fd2_matrix_rejected(defect):
    values = deepcopy(rows())
    if defect == "case":
        values.pop()
    elif defect == "time":
        values[0]["samples"].pop()
    elif defect == "field":
        del values[0]["samples"][0]["diagnostics"]["core"]["A"]
    elif defect == "duplicate":
        values[-1] = values[0]
    elif defect == "order":
        values[0]["order"] = 4
    else:
        values[0]["samples"][1]["diagnostics"]["core"]["H"]["l2"] = float("inf")
    with pytest.raises(ValueError):
        RUN["assess_fd2"](values)


def test_bad_order_and_floor_limited_are_not_regraded():
    for defect in (1.e-10, 1.e-13):
        values = rows()
        values[0]["samples"][-1]["diagnostics"]["core"]["H"]["l2"] = defect
        assert not RUN["assess_fd2"](values)["passed"]


def test_frozen_targets_are_exact_32_step_segments():
    targets = RUN["TARGETS"]
    previous = .25
    for t in targets:
        assert (t-previous)/(1./256) == 32
        previous = t
    assert len(targets) == 6 and previous == 1.
    assert len(set(targets)-set(RUN["WINDOW"]["TIMES"])) == 4

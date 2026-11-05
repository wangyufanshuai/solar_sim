from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-window.py"))


def rows():
    return [{"order": order, "n": n, "samples": [{"diagnostics": {"time": t,
        "core": {m: {"l2": (1./(n-1))**order} for m in RUN["METRICS"]}}} for t in RUN["TIMES"]]}
        for order in (2, 4) for n in RUN["SIZES"]]


def test_complete_later_times_are_required():
    result = RUN["assess"](rows())
    assert result["passed"] and len(result["groups"]) == 30
    assert {g["time"] for g in result["groups"]} == {.25, .5, 1.}


@pytest.mark.parametrize("defect", ["case", "time", "field", "duplicate", "nan"])
def test_missing_or_invalid_evidence_cannot_pass(defect):
    values = deepcopy(rows())
    if defect == "case":
        values.pop()
    elif defect == "time":
        values[0]["samples"].pop()
    elif defect == "field":
        del values[0]["samples"][0]["diagnostics"]["core"]["A"]
    elif defect == "duplicate":
        values[-1] = values[0]
    else:
        values[0]["samples"][1]["diagnostics"]["core"]["state"]["l2"] = float("nan")
    with pytest.raises(ValueError):
        RUN["assess"](values)


def test_bad_refinement_is_retained_as_failure():
    values = rows()
    values[0]["samples"][-1]["diagnostics"]["core"]["M"]["l2"] = 1.e-8
    result = RUN["assess"](values)
    assert not result["passed"] and any(not g["passed"] for g in result["groups"])


def test_expanded_control_has_equal_spacing_and_shared_initial_nodes():
    base, expanded = RUN["seed"](17, 4), RUN["expanded_seed"]()
    assert base.to_state().grid.spacing == expanded.to_state().grid.spacing
    np.testing.assert_array_equal(base.slots, np.asarray(expanded.slots)[:, 4:21, 4:21, 4:21])


def test_substeps_must_be_exact_and_positive():
    data = RUN["seed"](17, 4)
    assert RUN["steps_to"](data, 1.) == 256
    for target in (0., -.125, .01):
        with pytest.raises(ValueError):
            RUN["steps_to"](data, target)

"""Synthetic gate tests and analytic initial matching, not evolution evidence."""
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-domain-matrix.py"))
W = RUN["W"]


def saved(path, t, n):
    return {"path": path, "bounded_window": True,
            "diagnostics": {"time": t, "core": {m: {"l2": (3./(n-1))**4} for m in W["METRICS"]}}}


def fixture():
    value = {"study_cases": [{"n": n, "initial": saved(f"initial-{n}", 0., n),
             "samples": [saved(f"{n}-{t}", t, n) for t in RUN["TIMES"]]} for n in (25, 37, 49)],
             "region_comparisons": [{"expanded_n": n, "time": t,
                 "metrics": {m: {"rms_difference": (3./(n-1))**4} for m in W["METRICS"]}}
                 for n in (25, 37, 49) for t in W["TIMES"]],
             "time_samples": [saved(f"time-{t}", t, 49) for t in (.25, .5, .75, 1.)],
             "time_controls": [{"time": t, "passed": True, "metrics": {m: {
                 "rms_difference": .01, "coarse_norm": 1., "fine_norm": .99, "ratio": .01, "passed": True}
                 for m in W["METRICS"]}} for t in (.25, .5, 1.)],
             "shared_initial": [{"expanded_n": n, "coordinate_linf": 0., "state_linf": 0.} for n in (25, 37, 49)],
             "time_initial": {"state_byte_equal": True}, "deterministic_replay": True}
    value["spatial_assessment"] = RUN["assess_spatial"](value)
    return value


def test_full_matrix_has_31_distinct_samples_and_two_sets_of_15_groups():
    value = fixture()
    assert len(RUN["all_samples"](value)) == 31
    assert len(value["spatial_assessment"]["expanded_groups"]) == 15
    assert len(value["spatial_assessment"]["region_difference_groups"]) == 15
    assert RUN["final_assessment"](value) == {"bounded_study": True, "study_passed": True}


@pytest.mark.parametrize("defect", ["grid", "time", "region", "dt", "duplicate", "replay", "initial", "time-verdict", "nan"])
def test_incomplete_or_contradictory_matrix_is_rejected(defect):
    value = fixture()
    if defect == "grid":
        value["study_cases"].pop()
    elif defect == "time":
        value["study_cases"][1]["samples"].pop()
    elif defect == "region":
        value["region_comparisons"].pop()
    elif defect == "dt":
        value["time_controls"].pop()
    elif defect == "duplicate":
        value["time_samples"][-1]["path"] = value["time_samples"][0]["path"]
    elif defect == "replay":
        value["deterministic_replay"] = False
    elif defect == "initial":
        value["shared_initial"][1]["state_linf"] = 3.e-14
    elif defect == "time-verdict":
        value["time_controls"][0]["metrics"]["H"]["passed"] = False
    else:
        value["time_controls"][0]["metrics"]["H"]["ratio"] = float("nan")
    with pytest.raises(ValueError):
        RUN["final_assessment"](value)


@pytest.mark.parametrize("failure", ["expanded", "region", "bounded", "time"])
def test_scientific_failure_is_preserved_without_execution_exception(failure):
    value = fixture()
    if failure == "expanded":
        value["study_cases"][1]["samples"][-1]["diagnostics"]["core"]["H"]["l2"] = 1.e-10
    elif failure == "region":
        value["region_comparisons"][-1]["metrics"]["H"]["rms_difference"] = 1.
    elif failure == "bounded":
        value["study_cases"][0]["initial"]["bounded_window"] = False
    else:
        value["time_controls"][0]["metrics"]["H"].update(rms_difference=.1, ratio=.1, passed=False)
        value["time_controls"][0]["passed"] = False
    value["spatial_assessment"] = RUN["assess_spatial"](value)
    assert not RUN["final_assessment"](value)["study_passed"]


@pytest.mark.parametrize("small,large", [(17, 25), (25, 37), (33, 49)])
def test_analytic_shared_initials_are_matched_without_overwriting_roundoff(small, large):
    base, expanded = RUN["B"]["seed"](small, 4), RUN["expanded_seed"](large)
    before = tuple(x.tobytes() for x in expanded.slots)
    result = RUN["shared_initial"](base, expanded)
    assert result["state_linf"] <= 2.e-14
    assert result["coordinate_linf"] <= 2.e-15
    assert before == tuple(x.tobytes() for x in expanded.slots)


@pytest.mark.parametrize("n", [17, 33, 48, 50])
def test_undeclared_expanded_grid_is_rejected(n):
    with pytest.raises(ValueError):
        RUN["expanded_seed"](n)


@pytest.mark.parametrize("c_delta,e_delta,accepted", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_budget_preserves_user_reserves_and_next_checkpoint_headroom(monkeypatch, tmp_path, c_delta, e_delta, accepted):
    runner = RUN["Runner"](tmp_path, {}, "n37", 0.)
    monkeypatch.setattr(RUN["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        RUN["RUN"]["E_RESERVE"]+32*1024**2+e_delta if Path(p) == RUN["ROOT"] else RUN["RUN"]["C_RESERVE"]+c_delta))
    if accepted:
        assert runner.budget() == 180.
    else:
        with pytest.raises(ValueError, match="reserve"):
            runner.budget()

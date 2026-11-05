"""Stage trace coverage and fail-closed runtime guard tests."""
import copy
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-rk-stage-locality.py"))


def matrix():
    regions = {name: {"slot_norms": [{"slot": i} for i in range(58)]} for name in (
        "active", "core", "lower_only", "upper_only", "mixed_lower_upper", "depth_1_2", "depth_3_4", "depth_5_6", "depth_7_plus")}
    return {"cases": [{"domain": name, "n": n, "k1_bytes_equal": True, "ordinary_step_bytes_equal": True,
                "stages": [{"label": label, "parity_by_slot": [0.]*58} for label in R["S"].LABELS]}
            for ns in R["TRIPLES"] for name, n in zip(R["NAMES"], ns, strict=True)],
        "pairs": [{"original_n": ns[0], "left_domain": a, "right_domain": b, "label": label, "regions": copy.deepcopy(regions)}
                  for ns in R["TRIPLES"] for a, b in R["PAIRS"] for label in R["S"].LABELS],
        "final_metric_pairs": [{"original_n": ns[0], "left_domain": a, "right_domain": b, "metrics": {"H": {}, "ricci_error": {}}}
                               for ns in R["TRIPLES"] for a, b in R["PAIRS"]],
        "trace_calls": 10, "thread_replay": {"bytes_equal": True},
        "negative_controls": [{"label": label, "side_effect_free": True} for label in ("collision", "threads", "unknown")]}


def test_complete_matrix_accepted():
    R["coverage"](matrix())


@pytest.mark.parametrize("defect", ["case", "stage", "duplicate_stage", "parity", "pair", "duplicate_pair", "region",
                                    "slot", "k1", "ordinary", "metric", "duplicate_metric", "metric_field", "replay", "count", "negative"])
def test_incomplete_controls_and_coverage_rejected(defect):
    value = matrix()
    if defect == "case":
        value["cases"].pop()
    elif defect == "stage":
        value["cases"][0]["stages"].pop()
    elif defect == "duplicate_stage":
        value["cases"][0]["stages"][0]["label"] = "final"
    elif defect == "parity":
        value["cases"][0]["stages"][0]["parity_by_slot"].pop()
    elif defect == "pair":
        value["pairs"].pop()
    elif defect == "duplicate_pair":
        value["pairs"][-1] = value["pairs"][0]
    elif defect == "region":
        value["pairs"][0]["regions"].pop("depth_7_plus")
    elif defect == "slot":
        value["pairs"][0]["regions"]["active"]["slot_norms"][0]["slot"] = 57
    elif defect in ("k1", "ordinary"):
        value["cases"][0]["k1_bytes_equal" if defect == "k1" else "ordinary_step_bytes_equal"] = False
    elif defect == "metric":
        value["final_metric_pairs"].pop()
    elif defect == "duplicate_metric":
        value["final_metric_pairs"][-1] = value["final_metric_pairs"][0]
    elif defect == "metric_field":
        value["final_metric_pairs"][0]["metrics"].pop("H")
    elif defect == "replay":
        value["thread_replay"]["bytes_equal"] = False
    elif defect == "count":
        value["trace_calls"] = 9
    else:
        value["negative_controls"].pop()
    with pytest.raises(ValueError):
        R["coverage"](value)


@pytest.mark.parametrize("c_delta,e_delta,ok", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_disk_reserves_and_next_trace_headroom(monkeypatch, tmp_path, c_delta, e_delta, ok):
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        R["E_RESERVE"]+R["HEADROOM"]+e_delta if Path(p) == R["ROOT"] else R["C_RESERVE"]+c_delta))
    runner = R["Runner"](tmp_path, {"commands": []})
    if ok:
        assert runner.budget() <= 180.
    else:
        with pytest.raises(ValueError, match="disk reserve"):
            runner.budget()


def test_total_time_cap_not_reset(monkeypatch, tmp_path):
    runner = R["Runner"](tmp_path, {"commands": []})
    monkeypatch.setattr(R["time"], "perf_counter", lambda: runner.started+900.)
    with pytest.raises(ValueError, match="900s"):
        runner.budget()


@pytest.mark.parametrize("origin", [0., 124.003, 124.004, 124.013, 4096.75, 1000000.125])
@pytest.mark.parametrize("position", ["before", "at", "after"])
@pytest.mark.parametrize("family", ["stage", "initial_rhs"])
def test_representable_deadline_is_strict_without_grace(monkeypatch, tmp_path, origin, position, family):
    monkeypatch.setattr(R["time"], "perf_counter", lambda: origin)
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda _path: SimpleNamespace(free=100*1024**3))
    runner_type = R["Runner"] if family == "stage" else R["P"]["Runner"]
    runner = runner_type(tmp_path, {"commands": []})
    deadline = origin+900.
    now = math.nextafter(deadline, -math.inf) if position == "before" else (
        math.nextafter(deadline, math.inf) if position == "after" else deadline)
    monkeypatch.setattr(R["time"], "perf_counter", lambda: now)
    if position == "before":
        assert runner.budget() == deadline-now
    else:
        with pytest.raises(ValueError, match="900s"):
            runner.budget()


@pytest.mark.parametrize("family", ["stage", "initial_rhs"])
def test_repeated_budget_checks_keep_original_absolute_deadline(monkeypatch, tmp_path, family):
    clock = [124.003]
    monkeypatch.setattr(R["time"], "perf_counter", lambda: clock[0])
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda _path: SimpleNamespace(free=100*1024**3))
    runner_type = R["Runner"] if family == "stage" else R["P"]["Runner"]
    runner = runner_type(tmp_path, {"commands": []})
    assert runner.budget() == 180.
    deadline = runner.started+900.
    for remaining in (179., 120., 1.):
        clock[0] = deadline-remaining
        assert runner.budget() == deadline-clock[0]
    clock[0] = deadline
    with pytest.raises(ValueError, match="900s"):
        runner.budget()


def test_negative_budget_failure_cannot_reuse_previous_rejection(tmp_path, monkeypatch):
    source, existing = tmp_path/"input.bin", tmp_path/"existing.trace"
    source.write_bytes(b"synthetic input")
    existing.write_bytes(b"synthetic output")
    runner = R["Runner"](tmp_path, {"commands": [{"label": "negative-older", "returncode": 2}], "negative_controls": []})
    def refuse(*args):
        raise ValueError("resource cap")
    monkeypatch.setattr(runner, "execute", refuse)
    with pytest.raises(ValueError, match="wrong negative exit"):
        R["negatives"](runner, "synthetic.exe", source, existing)
    assert runner.receipt["negative_controls"] == []

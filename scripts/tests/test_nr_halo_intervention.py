from copy import deepcopy
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[2]
M = runpy.run_path(str(ROOT/"scripts/run-nr-k3-halo-intervention.py"))


def complete_result():
    samples = [{"step": s, "time": s/256., "metrics": {"H": {}, "ricci_error": {}}} for s in M["H"].STEPS]
    return {"cases": [{"mode": mode, "samples": deepcopy(samples), "parity_by_slot": [0.]*58,
        "python_first_step_passed": True, "first_step_thread_bytes_equal": True,
        "retained_first_step_bytes_equal": mode == "none", "fixed_bytes_equal": True} for mode in M["H"].MODES],
        "historical_controls": [{"mode": mode, "time": t, "bytes_equal": True} for mode in M["OLD"] for t in M["W"].TIMES],
        "contrasts": [{"step": s, "metric": k, "identity_residual": 0.} for s in M["H"].STEPS for k in ("H", "ricci_error")],
        "native_calls": 8, "negative_controls": [{"label": k, "side_effect_free": True} for k in ("collision", "mode", "steps", "unknown")]}


def test_complete_coverage_accepts_only_expected_matrix():
    M["coverage"](complete_result())


@pytest.mark.parametrize("key", ("cases", "historical_controls", "contrasts", "negative_controls"))
def test_missing_coverage_is_rejected(key):
    result = complete_result()
    result[key].pop()
    with pytest.raises(ValueError):
        M["coverage"](result)


@pytest.mark.parametrize("key", ("historical_controls", "contrasts", "negative_controls"))
def test_duplicate_coverage_cannot_substitute_for_missing_case(key):
    result = complete_result()
    result[key][-1] = deepcopy(result[key][0])
    with pytest.raises(ValueError):
        M["coverage"](result)


@pytest.mark.parametrize("control", ("python_first_step_passed", "first_step_thread_bytes_equal", "fixed_bytes_equal", "retained_first_step_bytes_equal"))
def test_failed_control_cannot_pass(control):
    result = complete_result()
    result["cases"][0][control] = False
    with pytest.raises(ValueError):
        M["coverage"](result)


def test_incomplete_slots_and_wrong_time_are_rejected():
    for kind in ("slots", "time"):
        result = complete_result()
        if kind == "slots":
            result["cases"][0]["parity_by_slot"].pop()
        else:
            result["cases"][0]["samples"][1]["time"] = .1
        with pytest.raises(ValueError):
            M["coverage"](result)


def test_failed_historical_bytes_and_factorial_identity_are_rejected():
    for kind in ("history", "identity", "calls"):
        result = complete_result()
        if kind == "history":
            result["historical_controls"][0]["bytes_equal"] = False
        elif kind == "identity":
            result["contrasts"][0]["identity_residual"] = 3.e-12
        else:
            result["native_calls"] = 7
        with pytest.raises(ValueError):
            M["coverage"](result)


@pytest.mark.parametrize("reason", ("time", "C", "E", "output"))
def test_resource_guards_fail_closed(tmp_path, monkeypatch, reason):
    runner = M["Runner"](tmp_path, {})
    monkeypatch.setattr(M["time"], "perf_counter", lambda: runner.started+(1801 if reason == "time" else 0))
    monkeypatch.setattr(M["shutil"], "disk_usage", lambda path: SimpleNamespace(
        free=0 if (reason == "C" and str(path) == "C:/") or (reason == "E" and path == ROOT) else 100*1024**3))
    if reason == "output":
        globals_ = runner.budget.__globals__
        monkeypatch.setitem(globals_, "OUTPUT_LIMIT", 1)
    with pytest.raises(ValueError):
        runner.budget()


def test_budget_failure_cannot_reuse_previous_negative_exit(tmp_path):
    original, existing = tmp_path/"input", tmp_path/"existing"
    original.write_bytes(b"input")
    existing.write_bytes(b"output")
    class Blocked:
        directory = tmp_path
        receipt = {"commands": [{"label": "negative-collision", "returncode": 2}], "negative_controls": []}
        def execute(self, *args):
            raise ValueError("resource cap")
    runner = Blocked()
    with pytest.raises(ValueError, match="wrong negative exit"):
        M["negatives"](runner, "binary", original, existing)
    assert runner.receipt["negative_controls"] == []
    assert original.read_bytes() == b"input" and existing.read_bytes() == b"output"


def test_parent_keeps_old_failures_and_inventory_unique(monkeypatch):
    monkeypatch.setitem(M["P"], "coverage", lambda _: None)
    flags = {key: False for key in (*M["FLAGS"], "retained_original_passed", "retained_upper_passed", "retained_both_passed")}
    parent = {"schema": "nr-schwarzschild-rk-stage-locality-v1", "completed": True,
              "stage_consistency_passed": True, "errors": [], "source_before": {}, "source_after": {}, **flags}
    rows = [{"domain": domain, "n": n, "time": t, "path": f"{domain}-{t}", "sha256": f"{domain}-{t}"}
            for domain, n in M["OLD"].values() for t in (0., *M["W"].TIMES)]
    inventory = {"schema": "nr-retained-schwarzschild-error-localization-v1", "completed": True,
                 "errors": [], "inventory": rows, "input_checkpoint_hashes": {r["path"]: r["sha256"] for r in rows}, **flags}
    assert len(M["validate_parent"](parent, inventory)) == 15
    for key in flags:
        invalid = {**parent, key: True}
        with pytest.raises(ValueError):
            M["validate_parent"](invalid, inventory)
    bad = {**inventory, "inventory": [*rows[:-1], rows[0]]}
    with pytest.raises(ValueError):
        M["validate_parent"](parent, bad)

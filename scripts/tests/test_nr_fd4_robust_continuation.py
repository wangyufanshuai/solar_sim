from copy import deepcopy
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-fd4-robust-continuation.py"))


def prefix(driver):
    rows = []
    for index, (family, n, seed, steps) in enumerate(driver["CASES"][:6]):
        times = driver["TIMES"] if index < 5 else driver["TIMES"][:2]
        rows.append({"family": family, "points": n, "seed": seed, "steps_per_unit": steps,
                     "dt": 1./steps, "spatial_order": 4,
                     "samples": [{"time": t, "step": t*steps} for t in times]})
    return {"schema_version": "nr-k3-fd4-robust-window-v1", "completed": False,
            "sampled_robust_window_gates_passed": False, "source_unchanged": True, "parent_unchanged": True,
            "errors": [{"type": "ValueError", "message": "E workspace reserve reached"}],
            "cases": rows, "commands": [{"returncode": 0} for _ in range(51)], "temporal": []}


def test_exact_prefix_is_read_only_and_resumes_only_missing_times(driver):
    parent = prefix(driver)
    before = deepcopy(parent)
    driver["validate_prefix"](parent)
    assert parent == before
    assert all(driver["remaining_times"](r) == () for r in parent["cases"][:5])
    assert driver["remaining_times"](parent["cases"][-1]) == tuple(float(i) for i in range(2, 11))


@pytest.mark.parametrize("mutation", ("completed", "gate", "identity", "reason", "case", "time", "step",
                                      "dt", "order", "command", "returncode", "temporal", "replays"))
def test_different_failure_or_resume_prefix_is_rejected(driver, mutation):
    parent = prefix(driver)
    if mutation == "completed":
        parent["completed"] = True
    elif mutation == "gate":
        parent["sampled_robust_window_gates_passed"] = True
    elif mutation == "identity":
        parent["source_unchanged"] = False
    elif mutation == "reason":
        parent["errors"][0]["message"] = "numerical divergence"
    elif mutation == "case":
        parent["cases"][-1]["seed"] += 1
    elif mutation in ("time", "step"):
        parent["cases"][-1]["samples"][-1][mutation] += .1
    elif mutation == "dt":
        parent["cases"][-1]["dt"] *= .5
    elif mutation == "order":
        parent["cases"][-1]["spatial_order"] = 2
    elif mutation == "command":
        parent["commands"].pop()
    elif mutation == "returncode":
        parent["commands"][-1]["returncode"] = 1
    elif mutation == "temporal":
        parent["temporal"].append({})
    else:
        parent["replays"] = []
    with pytest.raises(ValueError):
        driver["validate_prefix"](parent)


@pytest.mark.parametrize("times", ([], [0., 2.], [0., 1., 1.], [1.], list(range(12))))
def test_missing_or_duplicate_prefix_time_is_rejected(driver, times):
    with pytest.raises(ValueError, match="noncontiguous"):
        driver["remaining_times"]({"samples": [{"time": t} for t in times]})


@pytest.mark.parametrize("different", (None, "checkpoint", "manifest"))
def test_handoff_binds_full_checkpoint_and_manifest(driver, tmp_path, different):
    first, second = tmp_path/"a.bin", tmp_path/"b.bin"
    for path in (first, second):
        path.write_bytes(b"checkpoint")
        path.with_suffix(".json").write_bytes(b"manifest")
    if different:
        changed = second if different == "checkpoint" else second.with_suffix(".json")
        changed.write_bytes(b"different")
        with pytest.raises(ValueError, match="handoff"):
            driver["verify_handoff"](first, second)
    else:
        assert all(driver["verify_handoff"](first, second).values())


@pytest.mark.parametrize("limit", ("time", "bytes"))
def test_original_resource_usage_is_carried_into_continuation(driver, tmp_path, monkeypatch, limit):
    receipt = {"commands": [], "original_elapsed_seconds": 1801. if limit == "time" else 638.,
               "original_artifact_bytes": 192*1024**2 if limit == "bytes" else 0}
    runner = driver["Runner"](tmp_path, receipt)
    monkeypatch.setattr(driver["shutil"], "disk_usage", lambda _: SimpleNamespace(free=10*1024**3))
    with pytest.raises(ValueError, match="combined"):
        runner.budget()
    assert receipt["commands"] == []


def test_wrong_receipt_is_rejected_before_any_path_lookup(driver, tmp_path):
    path = tmp_path/"receipt.json"
    path.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="frozen stop"):
        driver["stop_identity"](path)

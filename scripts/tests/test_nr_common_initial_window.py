"""Fixed longer-window contract and failure/resource boundaries."""
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-common-initial-window.py"))
G = R["main"].__globals__


def test_matrix_is_fixed_and_every_policy_preregistered():
    rows = R["rows"]()
    assert len(rows) == 3 and [r["policy"] for r in rows] == list(R["POLICIES"])
    assert all(r["n"] == 13 and r["dt"] == 1./256 and r["steps"] == 16 for r in rows)
    assert all(r["dt"]*r["steps"] == 1./16 and r["status"] == "not-attempted" for r in rows)
    assert all(not r["completed"] and not r["restart_permitted"] for r in rows)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_original_disk_floors_abort_batch(monkeypatch, tmp_path, drive):
    def usage(path):
        low = str(path) == "C:/" if drive == "C" else path == R["ROOT"]
        return SimpleNamespace(free=R[drive+"_RESERVE"]-1 if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", usage)
    with pytest.raises(R["ResourceLimit"], match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_absolute_timeout_cannot_be_reset_per_step(monkeypatch, tmp_path):
    monkeypatch.setattr(G["time"], "perf_counter", lambda: 3000.)
    with pytest.raises(R["ResourceLimit"], match="absolute"):
        R["guard"](tmp_path, 3000.)


def test_receipt_headroom_cannot_be_spent_on_arrays(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    with pytest.raises(R["ResourceLimit"], match="cap"):
        R["guard"](tmp_path, math.inf, additional=736*1024**2+1)


def test_stage_registered_before_guard_or_save_failure(monkeypatch, tmp_path):
    q = np.zeros((58, 9, 9, 9))
    row = R["rows"]()[0]
    observer = R["Observer"](tmp_path, math.inf, None, row)
    def fail(*args, **kwargs):
        raise R["ResourceLimit"]("injected reserve failure")
    monkeypatch.setitem(G, "guard", fail)
    with pytest.raises(R["ResourceLimit"]):
        observer("stage-raw", 1, 0, q, None, None, None)
    assert len(row["observations"]) == 1
    record = row["observations"][0]
    assert record["phase"] == "stage-raw" and not record["completed"] and "raw_array" not in record


@pytest.mark.parametrize("failure", [ValueError("method contract"), R["ResourceLimit"]("reserve"),
    R["EvidenceFailure"]("record error"), OSError("storage error")])
def test_method_failure_is_not_retried_and_infrastructure_aborts(monkeypatch, tmp_path, failure):
    class Driver:
        identity = {"fixture": True}
        calls = 0
        def boundary_targets(self, reference):
            return ()
        def step(self, q, index, dt, boundary):
            self.calls += 1
            self.observer("stage-raw", 1, 2*index, q, None, None, None)
            raise failure
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    driver, row = Driver(), R["rows"]()[0]
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G["P"], "measured", lambda *args: {})
    if type(failure) is ValueError:
        R["run_case"](driver, q, q, row, tmp_path, math.inf)
        assert row["status"] == "method-failed"
        assert row["failure_location"]["raw_array"]
    else:
        with pytest.raises(type(failure)):
            R["run_case"](driver, q, q, row, tmp_path, math.inf)
        assert row["status"] == "batch-aborted"
    assert driver.calls == 1 and row["accepted_steps"] == 0 and row["last_accepted_time"] == 0.
    assert not row["completed"] and row["input_unchanged"] and len(row["trajectory"]) == 1
    assert len(list(tmp_path.glob("*.npy"))) == 1


@pytest.mark.parametrize("abort", [False, True])
def test_only_unattempted_registered_policies_follow_method_failure(monkeypatch, tmp_path, abort):
    q = np.zeros((58, 13, 13, 13))
    calls, result = [], {}
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    def prepare(*args):
        result["initial_data"] = dict(common_sha256="fixture")
        return q, q
    monkeypatch.setitem(G, "prepare", prepare)
    monkeypatch.setitem(G["P"], "ProjectedShadowCube", lambda grid, policy: policy)
    def run_case(driver, _initial, _ref, row, *_args):
        assert len(result["cases"]) == 3
        calls.append(driver)
        if driver == "none":
            if abort:
                row["status"] = "batch-aborted"
                raise R["ResourceLimit"]("stop batch")
            row.update(status="method-failed", failure="determinant contract")
        else:
            row.update(completed=True, status="completed", accepted_steps=16)
    monkeypatch.setitem(G, "run_case", run_case)
    if abort:
        with pytest.raises(R["ResourceLimit"]):
            R["collect"](tmp_path, math.inf, result)
        assert calls == ["none"] and result["cases"][1]["status"] == "not-attempted"
        assert "matrix_executed" not in result
    else:
        R["collect"](tmp_path, math.inf, result)
        assert calls == list(R["POLICIES"]) and result["matrix_executed"]
        assert not result["cases"][0]["completed"]


def test_time_zero_mapping_is_bound_to_actual_retained_data(monkeypatch, tmp_path):
    grid = R["P"]["Grid3D"]((13,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    driver = R["P"]["NonlinearSBPCube"](grid)
    result = {}
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    q, reference = R["prepare"](tmp_path, math.inf, driver, result)
    assert result["initial_data"]["original_sha256"] == R["INITIAL_SHA"]
    assert R["sha"](tmp_path/"initial-reference.npy") == R["REFERENCE_SHA"]
    assert R["sha"](tmp_path/"initial-common.npy") == result["initial_data"]["mapped_source_sha256"]
    assert max(R["P"]["algebraic_errors"](q).values()) < 2.e-12
    assert not np.array_equal(q, reference) and result["initial_data"]["new_initial_value_problem"]
    assert not result["initial_data"]["restart_of_failed_parent"]


@pytest.mark.parametrize("problem", ["numerical", "source", "nonfinite", "resource"])
def test_failed_cases_and_source_changes_cannot_be_graded_green(monkeypatch, tmp_path, problem):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"study"
    source, protocol, report, regression, parent, old = (tmp_path/name for name in (
        "source.py", "protocol.md", "report.xml", "regression.xml", "parent.json", "old.json"))
    for path in (source, protocol, report, regression, parent, old):
        path.write_text("{}", encoding="utf-8")
    before = {"source.py": R["sha"](source), "protocol.md": R["sha"](protocol)}
    tests = dict(focused=dict(sha256=R["sha"](report)), regression=dict(sha256=R["sha"](regression)))
    for name, value in dict(ROOT=tmp_path, EVIDENCE=evidence, PROTOCOL="protocol.md", PARENT=parent,
                           OLD_RECEIPT=old, RETAINED={parent: R["sha"](parent), old: R["sha"](old)}).items():
        monkeypatch.setitem(G, name, value)
    monkeypatch.setitem(G, "sources", lambda *args: (before, tests))
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G, "verify_retained", lambda: None)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    def collect(_directory, _deadline, result):
        if problem == "resource":
            raise R["ResourceLimit"]("disk floor")
        result["matrix_executed"] = True
        for row in result["cases"]:
            row.update(completed=True, status="completed")
        if problem == "numerical":
            result["cases"][0].update(completed=False, status="method-failed", failure="det contract")
        elif problem == "source":
            source.write_text("changed", encoding="utf-8")
        else:
            result["diagnostic"] = math.nan
    monkeypatch.setitem(G, "collect", collect)
    monkeypatch.setattr(G["argparse"].ArgumentParser, "parse_args", lambda _: SimpleNamespace(
        output_directory=output, test_report=report, regression_report=regression))
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert not data["completed"] and not data["window_passed"] and not data["old_failure_regraded"]
    assert all(data[k] is False for k in R["FLAGS"])
    if problem == "numerical":
        assert data["cases"][1]["completed"] and not data["cases"][0]["completed"]
    if problem == "resource":
        assert not data["matrix_executed"] and all(r["status"] == "not-attempted" for r in data["cases"])

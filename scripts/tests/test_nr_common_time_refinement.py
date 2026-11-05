"""Time-refinement controls, fixed scope, and failed-batch preservation."""
import copy
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-common-time-refinement.py"))
G = R["main"].__globals__


def fixture(order=4):
    cases, store = R["rows"](), {}
    x, y, z = np.indices((13,)*3)
    field = (1.+x+2*y+3*z)[None, ...]*np.arange(1., 59.)[:, None, None, None]/58.
    for row in cases:
        name = row["label"]+".npy"
        store[name] = field*row["dt"]**order
        row.update(status="completed", completed=True, accepted_steps=row["steps"],
                   trajectory=[dict(time=1./16, array=name)])
    grid = R["P"]["Grid3D"]((13,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    return cases, store, R["P"]["NonlinearSBPCube"](grid)


def test_exact_same_time_matrix_and_unmodified_envelope():
    rows = R["rows"]()
    assert [r["steps"] for r in rows] == [7, 14, 28]
    assert all(r["dt"]*r["steps"] == 1./16 and r["policy"] == "none" for r in rows)
    assert rows[0]["dt"] == 2*rows[1]["dt"] == 4*rows[2]["dt"]
    assert all(not r["completed"] and r["status"] == "not-attempted" and not r["restart_permitted"] for r in rows)
    assert R["guard"] is R["W"]["guard"] and R["SECONDS"] == 2400.
    assert R["OUTPUT_CAP"] == 768*1024**2 and R["FLOOR"] == 2.e-13
    assert R["W"]["C_RESERVE"] == 3*1024**3 and R["W"]["E_RESERVE"] == 4*1024**3+32*1024**2


@pytest.mark.parametrize("order,status", [(4, "passed"), (2, "failed"), (0, "unresolved"), (-1, "failed")])
def test_analytic_error_families_do_not_promote_inadequate_order(order, status):
    cases, store, driver = fixture(order)
    result = R["summary"](cases, driver, store.__getitem__)
    assert result["status"] == status and result["passed"] is (status == "passed")
    assert not result["physical_gate"] and not result["spatial_order_validated"]
    for region in result["regions"].values():
        assert region["status"] == status
        if order:
            assert region["observed_order"] == pytest.approx(order, abs=2.e-12)
        else:
            assert region["observed_order"] is None


@pytest.mark.parametrize("change", ["missing", "time", "initial", "policy", "prefix", "nonfinite", "dtype"])
def test_temporal_summary_rejects_mixed_or_partial_inputs(change):
    cases, store, driver = fixture()
    if change == "missing":
        cases.pop()
    elif change == "time":
        cases[0]["trajectory"][-1]["time"] = 1./32
    elif change == "initial":
        cases[0]["common_initial_sha256"] = "other"
    elif change == "policy":
        cases[0]["policy"] = "endpoint"
    elif change == "prefix":
        cases[0]["accepted_steps"] -= 1
    elif change == "nonfinite":
        store[cases[0]["trajectory"][-1]["array"]][0, 0, 0, 0] = math.nan
    else:
        name = cases[0]["trajectory"][-1]["array"]
        store[name] = store[name].astype(np.float32)
    with pytest.raises(ValueError):
        R["summary"](cases, driver, store.__getitem__)


@pytest.mark.parametrize("abort", [False, True])
def test_no_retry_and_only_registered_other_resolutions_continue(monkeypatch, tmp_path, abort):
    q = np.zeros((58, 13, 13, 13))
    result, calls = dict(cases=R["rows"]()), []
    def prepare(*args):
        result["initial_data"] = dict(common_sha256=R["COMMON_SHA"])
        return q, q
    monkeypatch.setitem(G["W"], "prepare", prepare)
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    def run_case(_driver, _initial, _reference, row, *_args):
        assert len(result["cases"]) == 3
        calls.append(row["steps"])
        if row["steps"] == 7:
            row.update(status="batch-aborted" if abort else "method-failed", failure="injected")
            if abort:
                raise R["W"]["ResourceLimit"]("disk floor")
        else:
            row.update(status="completed", completed=True, accepted_steps=row["steps"])
    monkeypatch.setitem(G["W"], "run_case", run_case)
    if abort:
        with pytest.raises(R["W"]["ResourceLimit"]):
            R["collect"](tmp_path, math.inf, result)
        assert calls == [7] and result["cases"][1]["status"] == "not-attempted"
    else:
        R["collect"](tmp_path, math.inf, result)
        assert calls == [7, 14, 28] and result["matrix_executed"]
    assert not result["cases"][0]["completed"] and "temporal_screen" not in result


@pytest.mark.parametrize("problem", ["numerical", "source", "nonfinite", "resource", "unresolved", "passed"])
def test_main_separates_computation_from_scientific_screen(monkeypatch, tmp_path, problem):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"study"
    source, protocol, report, regression, parent = (tmp_path/name for name in (
        "source.py", "protocol.md", "report.xml", "regression.xml", "parent.json"))
    for path in (source, protocol, report, regression, parent):
        path.write_text("{}", encoding="utf-8")
    before = {"source.py": R["sha"](source), "protocol.md": R["sha"](protocol)}
    tests = dict(focused=dict(sha256=R["sha"](report)), regression=dict(sha256=R["sha"](regression)))
    for name, value in dict(ROOT=tmp_path, EVIDENCE=evidence, PROTOCOL="protocol.md", PARENT=parent,
                           RETAINED={parent: R["sha"](parent)}).items():
        monkeypatch.setitem(G, name, value)
    monkeypatch.setitem(G, "sources", lambda *args: (before, tests))
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "verify_retained", lambda: None)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    def collect(_directory, _deadline, result):
        if problem == "resource":
            raise R["W"]["ResourceLimit"]("disk floor")
        result["matrix_executed"] = True
        for row in result["cases"]:
            row.update(completed=True, status="completed", accepted_steps=row["steps"])
        if problem == "numerical":
            result["cases"][0].update(completed=False, status="method-failed", failure="det contract")
        else:
            result["temporal_screen"] = dict(status="passed" if problem == "passed" else "unresolved")
            result["temporal_screen_passed"] = problem == "passed"
        if problem == "source":
            source.write_text("changed", encoding="utf-8")
        elif problem == "nonfinite":
            result["diagnostic"] = math.nan
    monkeypatch.setitem(G, "collect", collect)
    monkeypatch.setattr(G["argparse"].ArgumentParser, "parse_args", lambda _: SimpleNamespace(
        output_directory=output, test_report=report, regression_report=regression))
    assert R["main"]() == (0 if problem in ("unresolved", "passed") else 1)
    data = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert data["completed"] is (problem in ("unresolved", "passed"))
    assert data["temporal_screen_passed"] is (problem == "passed")
    assert all(data[k] is False for k in (*R["FLAGS"], "temporal_order_validated", "old_failure_regraded"))


def test_summary_does_not_mutate_endpoints_or_records():
    cases, store, driver = fixture()
    before_rows = copy.deepcopy(cases)
    before_bytes = {name: a.tobytes() for name, a in store.items()}
    R["summary"](cases, driver, store.__getitem__)
    assert cases == before_rows and {name: a.tobytes() for name, a in store.items()} == before_bytes


@pytest.mark.parametrize("tampered", [False, True])
def test_parent_receipts_and_artifacts_are_both_rechecked(monkeypatch, tmp_path, tampered):
    parent, replay = tmp_path/"parent.json", tmp_path/"replay.json"
    for path in (parent, replay):
        path.write_text('{"fixture": true}', encoding="utf-8")
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "REPLAY", replay)
    monkeypatch.setitem(G, "RETAINED", {p: R["sha"](p) for p in (parent, replay)})
    monkeypatch.setitem(G["W"], "verify_retained", lambda: None)
    calls = []
    monkeypatch.setitem(G["W"]["D"], "verify_artifacts", lambda path, data: calls.append((path, data)))
    if tampered:
        replay.write_text('{}', encoding="utf-8")
        with pytest.raises(ValueError, match="identity drift"):
            R["verify_retained"]()
        assert not calls
    else:
        R["verify_retained"]()
        assert calls == [(parent, {"fixture": True}), (replay, {"fixture": True})]

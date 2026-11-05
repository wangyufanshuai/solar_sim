"""Synthetic orchestration tests are not convergence evidence."""
from copy import deepcopy
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-dual-diagnostics.py"))
G = R["main"].__globals__
T = runpy.run_path(str(ROOT/"scripts/tests/test_nr_nonlinear_refinement.py"))


def point(row, index):
    norms = deepcopy(row["final_measurements"])
    for values in norms.values():
        values.update(H_metric_hessian=(2./(row["n"]-1))**2.5,
                      M_metric_hessian=values["M_metric"], H_diagnostic_difference=.1)
    return dict(point=index, time=index*row["dt"], array=R["sample_name"](row["label"], index, row["steps"]),
                measurements=norms, input_unchanged=True, maximum_M_difference=0., ricci_antisymmetry_max=0.)


def rows():
    result = T["rows"]()
    for row in result:
        row.update(trajectory=[point(row, index) for index in range(row["steps"]+1)],
                   exact_legacy_endpoint_replay=True, exact_legacy_record_replay=True)
    return result


def test_frozen_matrix_and_separate_decisions():
    assert R["MATRIX"] == T["FROZEN"]
    data = rows()
    for row in data:
        value = (2./(row["n"]-1))**1.4
        for p in row["trajectory"]:
            p["measurements"]["whole"]["H_metric"] = value
        row["initial_measurements"]["whole"]["H_metric"] = value
        row["final_measurements"]["whole"]["H_metric"] = value
    decision = R["evaluate"](data, [2.56e-8, 1.6e-9])
    assert not decision["legacy"]["passed"] and decision["metric_hessian_screen_passed"]
    assert decision["accepted_state_points"] == 58 and not decision["regrades_legacy"]
    assert decision["legacy"]["stages_checked"] == 208
    assert decision["legacy"]["disturbed_stages"] == 112


@pytest.mark.parametrize("mutation", ["missing", "order", "time", "file", "mutated", "region", "field",
    "nan", "negative", "momentum", "antisymmetry", "endpoint", "replay", "boolean"])
def test_trajectory_corruption_fails_closed(mutation):
    data = rows()
    p = data[0]["trajectory"][3]
    if mutation == "missing":
        data[0]["trajectory"].pop()
    elif mutation == "order":
        p["point"] = 2
    elif mutation == "time":
        p["time"] += .1
    elif mutation == "file":
        p["array"] = "../escape.npy"
    elif mutation == "mutated":
        p["input_unchanged"] = False
    elif mutation == "region":
        del p["measurements"]["corners"]
    elif mutation == "field":
        del p["measurements"]["whole"]["H_metric_hessian"]
    elif mutation in ("nan", "negative"):
        p["measurements"]["whole"]["H_metric_hessian"] = float("nan") if mutation == "nan" else -1.
    elif mutation == "momentum":
        p["maximum_M_difference"] = 2.1e-11
    elif mutation == "antisymmetry":
        p["ricci_antisymmetry_max"] = float("inf")
    elif mutation == "endpoint":
        data[0]["final_measurements"]["whole"]["H_metric"] += 1.
    elif mutation == "replay":
        data[0]["exact_legacy_record_replay"] = False
    else:
        p["point"] = True
    with pytest.raises(ValueError):
        R["evaluate"](data, [2.56e-8, 1.6e-9])


@pytest.mark.parametrize("value", [1.e-15, 1., .008])
def test_new_h_failure_does_not_pass(value):
    data = rows()
    data[2]["trajectory"][-1]["measurements"]["whole"]["H_metric_hessian"] = value
    assert not R["evaluate"](data, [2.56e-8, 1.6e-9])["metric_hessian_screen_passed"]


@pytest.mark.parametrize("values", [[1.e-14, 1.e-15], [8.e-8, 1.e-8], [1.e-8, 1.e-8]])
def test_time_failure_or_unresolved_cannot_be_promoted(values):
    assert not R["evaluate"](rows(), values)["metric_hessian_screen_passed"]


def test_real_initial_diagnostics_are_read_only_and_keep_old_values():
    n = 9
    driver = R["NonlinearSBPCube"](R["Grid3D"]((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))
    q = np.array(R["R"]["analytic_slots"](n, 4, R["R"]["SchwarzschildDomain"]()), dtype=np.float64)
    original = q.tobytes()
    measured = R["measurements"](driver, q, q.copy())
    assert q.tobytes() == original
    assert R["old_measurements"](measured) == R["R"]["measurements"](driver, q, q.copy())
    assert measured["measurements"]["whole"]["H_metric_hessian"] < measured["measurements"]["whole"]["H_metric"]


@pytest.mark.parametrize("position", ["before", "at", "after"])
def test_strict_absolute_deadline(monkeypatch, tmp_path, position):
    deadline = 17.3+2400.
    now = math.nextafter(deadline, -math.inf) if position == "before" else (
        deadline if position == "at" else math.nextafter(deadline, math.inf))
    monkeypatch.setattr(G["time"], "perf_counter", lambda: now)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    if position == "before":
        R["guard"](tmp_path, deadline)
    else:
        with pytest.raises(ValueError, match="deadline"):
            R["guard"](tmp_path, deadline)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_disk_floors_are_unchanged(monkeypatch, tmp_path, drive):
    assert R["C_RESERVE"] == 3*1024**3 and R["E_RESERVE"] == 4*1024**3+32*1024**2
    def free(path):
        low = (drive == "C" and str(path) == "C:/") or (drive == "E" and path == R["ROOT"])
        return SimpleNamespace(free=(R[drive+"_RESERVE"]-1 if low else 100*1024**3))
    monkeypatch.setattr(G["shutil"], "disk_usage", free)
    with pytest.raises(ValueError, match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_array_preallocation_and_output_cap(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    assert R["OUTPUT_CAP"] == 96*1024**2
    with pytest.raises(ValueError, match="cap"):
        R["guard"](tmp_path, math.inf, additional=R["OUTPUT_CAP"]-R["HEADROOM"]+1)


def fake_driver(step):
    return SimpleNamespace(identity={}, gauge=SimpleNamespace(), config=SimpleNamespace(),
        profile=SimpleNamespace(identity=lambda: {}), boundary_targets=lambda q: q.copy(), step=step)


@pytest.mark.parametrize("failure", ["step", "diagnostics", "save", "invalid-state", "stage"])
def test_partial_failure_retains_accepted_step_and_state(monkeypatch, tmp_path, failure):
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    row = R["R"]["new_case_record"](R["MATRIX"][0])
    def measure(*args):
        if failure == "diagnostics" and row["last_completed_step"] == 1:
            raise ValueError("injected diagnostic failure")
        return {k: v for k, v in point(rows()[0], 0).items() if k not in ("point", "time", "array")}
    monkeypatch.setitem(G, "measurements", measure)
    original_save = R["R"]["save_array"]
    def save(directory, name, q):
        if failure == "save" and name.endswith("-step-0002.npy"):
            raise OSError("injected save failure")
        original_save(directory, name, q)
    monkeypatch.setitem(R["R"], "save_array", save)
    def step(q, index, dt, boundary):
        boundary(2*index)
        stages = [T["stage"](k) for k in range(4)]
        if index == 1:
            if failure == "step":
                raise RuntimeError("injected step failure")
            if failure == "invalid-state":
                return np.full_like(q, np.nan), stages
            if failure == "stage":
                stages[2]["det_h_max_error"] = 2.e-10
        return q+1.e-6, stages
    initial = np.zeros((58, 9, 9, 9))
    with pytest.raises((ValueError, RuntimeError, OSError)):
        R["run_case"](fake_driver(step), initial, initial.copy(), R["MATRIX"][0], tmp_path, math.inf, row)
    assert not row["completed"] and row["input_unchanged"] and row["attempted_step"] == 1
    accepted = 1 if failure in ("diagnostics", "save") else 0
    assert row["last_completed_step"] == accepted and len(row["step_records"]) == accepted+1
    np.testing.assert_array_equal(np.load(tmp_path/row["last_accepted_array"], allow_pickle=False), initial+(accepted+1)*1.e-6)
    assert "final_array" not in row


def test_full_case_saves_initial_and_every_accepted_state(monkeypatch, tmp_path):
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "measurements", lambda *a: {
        k: v for k, v in point(rows()[0], 0).items() if k not in ("point", "time", "array")})
    def step(q, index, dt, boundary):
        return q+1.e-6, [T["stage"](k) for k in range(4)]
    row = R["R"]["new_case_record"](R["MATRIX"][0])
    initial = np.zeros((58, 9, 9, 9))
    R["run_case"](fake_driver(step), initial, initial.copy(), R["MATRIX"][0], tmp_path, math.inf, row)
    assert row["completed"] and len(row["trajectory"]) == 9 and len(list(tmp_path.glob("*.npy"))) == 9
    R["validate_trajectory"](row)


def test_initialization_failure_is_not_lost(monkeypatch, tmp_path):
    (tmp_path/"source.py").write_text("# fixture")
    (tmp_path/"protocol.md").write_text("fixture")
    report = tmp_path/"test.xml"
    report.write_text("fixture")
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"run"
    parent, evolution = tmp_path/"parent.json", tmp_path/"evolution.json"
    before = {"source.py": R["sha"](tmp_path/"source.py")}
    tests = dict(runner_tests=dict(sha256=R["sha"](report)))
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "EVOLUTION", evolution)
    monkeypatch.setitem(G, "RETAINED", {parent: "0"*64, evolution: "1"*64})
    monkeypatch.setitem(G, "PROTOCOL", "protocol.md")
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "sources", lambda _: (before, tests, dict(cases=rows())))
    def broken(_grid):
        raise RuntimeError("injected initialization failure")
    monkeypatch.setitem(G, "NonlinearSBPCube", broken)
    monkeypatch.setattr(G["sys"], "argv", ["runner", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text())
    assert not data["completed"] and not data["metric_hessian_screen_passed"]
    assert len(data["cases"]) == 1 and data["cases"][0]["phase"] == "initialization"
    assert data["cases"][0]["last_completed_step"] == -1
    assert all(data[key] is False for key in R["FLAGS"])

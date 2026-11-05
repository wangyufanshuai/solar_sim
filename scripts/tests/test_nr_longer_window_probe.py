"""Observation and failure controls; fixtures do not certify longer evolution."""
from copy import deepcopy
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-longer-window-probe.py"))
G = R["main"].__globals__
T = runpy.run_path(str(ROOT/"scripts/tests/test_nr_nonlinear_refinement.py"))


def setup_driver():
    grid = R["Grid3D"]((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    return grid, q


def valid_report(index=0):
    result = T["stage"](index)
    del result["stage"]
    return result


def test_observation_leaves_actual_step_and_reports_byte_exact():
    grid, q = setup_driver()
    q[11] = 1.e-8
    a, b = R["NonlinearSBPCube"](grid), R["ObservedCube"](grid, lambda: None)
    targets = a.boundary_targets(q)
    original = q.tobytes()
    b.begin_step(0)
    x, sx = a.step(q, 0, 1./1024, lambda _: targets)
    y, sy = b.step(q, 0, 1./1024, lambda _: targets)
    assert R["ObservedCube"].step is R["NonlinearSBPCube"].step
    assert a.identity == b.identity and x.tobytes() == y.tobytes() and sx == sy
    assert [s["report"] for s in b.observed_stages] == sy
    assert all(s["rhs_completed"] and s["stage_contract_passed"] for s in b.observed_stages)
    assert q.tobytes() == original and b.rejected_state is None


@pytest.mark.parametrize("key,value", [("det_h_max_error", 1.1e-10), ("min_lapse", 2.),
    ("cfl", .3), ("max_basis_condition", 1.e7), ("max_characteristic_residual", 3.e-11),
    ("min_chi", 0.), ("cfl", float("nan"))])
def test_bad_stage_retains_candidate_and_computed_rhs(monkeypatch, key, value):
    grid, q = setup_driver()
    report = valid_report()
    report[key] = value
    rhs = np.full_like(q, 1.e-12)
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", lambda *a: (rhs.copy(), report))
    driver = R["ObservedCube"](grid, lambda: None)
    with pytest.raises(ValueError, match="stage contract"):
        driver.rhs(q, (), 1./256)
    assert driver.rejected_state.tobytes() == q.tobytes()
    assert driver.rejected_rhs.tobytes() == rhs.tobytes()
    assert driver.observed_stages[0]["rhs_completed"] and not driver.observed_stages[0]["stage_contract_passed"]


@pytest.mark.parametrize("when", ["before", "after"])
def test_resource_failure_captures_attempt_without_acceptance(monkeypatch, when):
    grid, q = setup_driver()
    calls = []
    def check():
        calls.append(1)
        if len(calls) == (1 if when == "before" else 2):
            raise ValueError("resource boundary")
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", lambda *a: (np.zeros_like(q), valid_report()))
    driver = R["ObservedCube"](grid, check)
    with pytest.raises(ValueError, match="resource"):
        driver.rhs(q, (), 1./256)
    assert driver.rejected_state.tobytes() == q.tobytes()
    assert driver.observed_stages[0]["rhs_completed"] is (when == "after")
    assert "failure" in driver.observed_stages[0]


def test_partial_third_stage_failure_stops_without_fourth_call(monkeypatch):
    grid, q = setup_driver()
    calls = []
    def rhs(*args):
        calls.append(1)
        if len(calls) == 3:
            raise ValueError("injected stage failure")
        return np.zeros_like(q), valid_report(len(calls)-1)
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", rhs)
    driver = R["ObservedCube"](grid, lambda: None)
    with pytest.raises(ValueError, match="stage failure"):
        driver.step(q, 0, 1./256, lambda _: ())
    assert len(calls) == len(driver.observed_stages) == 3
    assert [s["rhs_completed"] for s in driver.observed_stages] == [True, True, False]
    assert driver.rejected_rhs is None and driver.rejected_state.tobytes() == q.tobytes()


def test_failed_final_state_validation_is_captured(monkeypatch):
    grid, q = setup_driver()
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", lambda *a: (np.zeros_like(q), valid_report()))
    def bad_state(*args):
        raise ValueError("endpoint state failure")
    monkeypatch.setattr(R["NonlinearSBPCube"], "state", bad_state)
    driver = R["ObservedCube"](grid, lambda: None)
    with pytest.raises(ValueError, match="endpoint state"):
        driver.step(q, 0, 1./256, lambda _: ())
    assert driver.rejection_location == "endpoint-state-validation"
    assert len(driver.observed_stages) == 4 and driver.rejected_state.tobytes() == q.tobytes()


@pytest.mark.parametrize("persist_failure", [False, True])
def test_case_failure_keeps_stages_and_last_accepted_array(monkeypatch, tmp_path, persist_failure):
    grid, q = setup_driver()
    calls = []
    def rhs(*args):
        calls.append(1)
        report = valid_report(len(calls)-1)
        if len(calls) == 2:
            report["det_h_max_error"] = 2.e-10
        return np.zeros_like(q), report
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", rhs)
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "storage_guard", lambda *a, **k: None)
    monkeypatch.setitem(G["D"], "measurements", lambda *a: dict(input_unchanged=True))
    if persist_failure:
        original_save = R["save_array"]
        def save(directory, name, value, deadline=None):
            if "rejected" in name:
                raise OSError("injected persistence failure")
            return original_save(directory, name, value, deadline)
        monkeypatch.setitem(G, "save_array", save)
    driver = R["ObservedCube"](grid, lambda: None)
    row = dict(label="fixture", dt=1./256, steps=16, completed=False)
    old = dict(operator_identity=driver.identity, parameters=dict(gauge=vars(driver.gauge),
        config=vars(driver.config), profile=driver.profile.identity()), trajectory=[], step_records=[])
    with pytest.raises(ValueError, match="stage contract"):
        R["run_case"](driver, q, q, row, old, tmp_path, math.inf)
    assert row["last_completed_step"] == -1 and not row["completed"] and row["input_unchanged"]
    assert len(row["attempted_steps"]) == 1 and len(row["attempted_steps"][0]["stages"]) == 2
    assert not row["attempted_steps"][0]["accepted"] and not row["rejection"]["restart_permitted"]
    assert np.load(tmp_path/row["last_accepted_array"], allow_pickle=False).tobytes() == q.tobytes()
    if persist_failure:
        assert "persistence failure" in row["rejection"]["state_persistence_error"]
    else:
        assert np.load(tmp_path/row["rejection"]["state_array"], allow_pickle=False).tobytes() == q.tobytes()
        assert np.array_equal(np.load(tmp_path/row["rejection"]["rhs_array"], allow_pickle=False), np.zeros_like(q))


def test_saved_prefix_mismatch_never_marks_point_complete(monkeypatch, tmp_path):
    grid, q = setup_driver()
    parent = tmp_path/"parent"
    parent.mkdir()
    output = tmp_path/"output"
    output.mkdir()
    different = q.copy()
    different[17] = 1.e-6
    np.save(parent/"old.npy", different, allow_pickle=False)
    monkeypatch.setitem(G, "PARENT", parent/"receipt.json")
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G["D"], "measurements", lambda *a: dict(input_unchanged=True))
    row = dict(label="fixture", dt=1./256, trajectory=[])
    old = dict(trajectory=[dict(point=0, time=0., array="old.npy", input_unchanged=True)])
    driver = R["ObservedCube"](grid, lambda: None)
    with pytest.raises(ValueError, match="prefix mismatch"):
        R["save_point"](output, driver, q, q, row, 0, old, math.inf)
    assert not row["trajectory"][0]["completed"]


def test_candidate_endpoint_cap_preserves_all_four_unaccepted_stages(monkeypatch, tmp_path):
    grid, q = setup_driver()
    growth = np.zeros_like(q)
    growth[0] = 1.e-6
    monkeypatch.setattr(R["NonlinearSBPCube"], "rhs", lambda *a: (growth.copy(), valid_report()))
    monkeypatch.setattr(R["NonlinearSBPCube"], "state", lambda *a: None)
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "storage_guard", lambda *a, **k: None)
    monkeypatch.setitem(G["D"], "measurements", lambda *a: dict(input_unchanged=True))
    driver = R["ObservedCube"](grid, lambda: None)
    row = dict(label="endpoint-fixture", dt=1./256, steps=16, completed=False)
    old = dict(operator_identity=driver.identity, parameters=dict(gauge=vars(driver.gauge),
        config=vars(driver.config), profile=driver.profile.identity()), trajectory=[], step_records=[])
    with pytest.raises(ValueError, match="candidate endpoint"):
        R["run_case"](driver, q, q, row, old, tmp_path, math.inf)
    assert row["rejection"]["location"] == "candidate-endpoint-determinant"
    assert row["rejection"]["determinant_max"] > 1.e-10 and row["last_completed_step"] == -1
    assert len(row["attempted_steps"][0]["stages"]) == 4 and not row["attempted_steps"][0]["accepted"]
    assert len(row["trajectory"]) == 1 and row["trajectory"][0]["completed"]


def decision_cases():
    rows = []
    for label, n, dt, steps, perturbed, parent_label in R["MATRIX"]:
        records = [dict(step=i, stages=[T["stage"](j) for j in range(4)]) for i in range(16)]
        rows.append(dict(label=label, n=n, dt=dt, steps=steps, perturbed=perturbed, parent_label=parent_label,
            end_time=1./16, last_completed_step=15, completed=True, phase="completed", input_unchanged=True,
            step_records=records, attempted_steps=[dict(step=i, accepted=True, exact_parent_prefix=i < 8,
                stages=[dict(stage=j+1, rhs_completed=True, stage_contract_passed=True, report=deepcopy(s))
                        for j, s in enumerate(records[i]["stages"])]) for i in range(16)],
            trajectory=[dict(point=i, time=i/256, completed=True, determinant_max=1.e-11, exact_parent_prefix=i <= 8)
                        for i in range(17)]))
    return rows


def test_complete_probe_never_sets_convergence_or_stability():
    data = R["decision"](decision_cases())
    assert data["probe_passed"] and data["stage_records"] == 128 and data["exact_prefix_states"] == 18
    assert not data["convergence_validated"] and not data["nonlinear_stability_validated"]


@pytest.mark.parametrize("bad", ["case", "stage", "partial", "endpoint", "prefix", "order", "boolean", "nan", "reject", "missing"])
def test_corrupt_probe_cannot_pass(bad):
    rows = decision_cases()
    if bad == "case":
        rows[0]["dt"] = 1./512
    elif bad == "stage":
        rows[0]["step_records"][0]["stages"][0]["det_h_max_error"] = 2.e-10
    elif bad == "partial":
        rows[0]["attempted_steps"][0]["stages"][2]["rhs_completed"] = False
    elif bad == "endpoint":
        rows[0]["trajectory"][-1]["determinant_max"] = 2.e-10
    elif bad == "prefix":
        rows[0]["trajectory"][8]["exact_parent_prefix"] = False
    elif bad == "order":
        rows[0]["attempted_steps"][2]["step"] = 1
    elif bad == "boolean":
        rows[0]["trajectory"][0]["point"] = False
    elif bad == "nan":
        rows[0]["trajectory"][4]["determinant_max"] = float("nan")
    elif bad == "reject":
        rows[0]["rejection"] = {}
    else:
        rows.pop()
    with pytest.raises(ValueError):
        R["decision"](rows)


@pytest.mark.parametrize("where", ["before", "at", "after"])
def test_deadline_is_absolute(monkeypatch, tmp_path, where):
    deadline = 7.+1800.
    now = math.nextafter(deadline, -math.inf) if where == "before" else deadline+(where == "after")
    monkeypatch.setattr(G["time"], "perf_counter", lambda: now)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    if where == "before":
        R["guard"](tmp_path, deadline)
    else:
        with pytest.raises(ValueError, match="deadline"):
            R["guard"](tmp_path, deadline)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_finalization_still_obeys_both_disk_floors(monkeypatch, tmp_path, drive):
    def free(path):
        low = (drive == "C" and str(path) == "C:/") or (drive == "E" and path == R["ROOT"])
        return SimpleNamespace(free=R[drive+"_RESERVE"]-1 if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", free)
    with pytest.raises(ValueError, match="reserve"):
        R["save_array"](tmp_path, "rejected.npy", np.ones(1))
    assert not (tmp_path/"rejected.npy").exists()


def test_output_cap_keeps_reporting_reserve(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    with pytest.raises(ValueError, match="cap"):
        R["storage_guard"](tmp_path, additional=88*1024**2+1)


def test_initialization_failure_finalizes_once_and_stops_later_cases(monkeypatch, tmp_path):
    (tmp_path/"protocol.md").write_text("fixture")
    report = tmp_path/"report.xml"
    report.write_text("fixture")
    parents = [tmp_path/(name+".json") for name in ("parent", "balance", "replay")]
    for path in parents:
        path.write_text("{}")
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"new"
    before = {"protocol.md": R["sha"](tmp_path/"protocol.md")}
    tests = dict(runner_tests=dict(sha256=R["sha"](report)))
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PROTOCOL", "protocol.md")
    for key, path in zip(("PARENT", "BALANCE", "BALANCE_REPLAY"), parents, strict=True):
        monkeypatch.setitem(G, key, path)
    monkeypatch.setitem(G, "RETAINED", {p: R["sha"](p) for p in parents})
    monkeypatch.setitem(G, "sources", lambda _: (before, tests, dict(cases=[dict(label="spatial-13")])))
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G["D"], "verify_artifacts", lambda *a: 0)
    calls = []
    def broken(*args):
        calls.append(1)
        raise ValueError("injected initialization failure")
    monkeypatch.setitem(G, "ObservedCube", broken)
    monkeypatch.setattr(G["sys"], "argv", ["runner", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1 and len(calls) == 1
    result = json.loads((output/"receipt.json").read_text())
    assert len(result["cases"]) == 1 and result["cases"][0]["phase"] == "initialization"
    assert not result["completed"] and not result["probe_passed"] and result["artifact_hashes"]
    assert all(result[k] is False for k in R["FLAGS"])

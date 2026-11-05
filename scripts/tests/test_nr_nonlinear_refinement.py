"""Synthetic decision/failure tests are not physical convergence evidence."""
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-nonlinear-refinement.py"))
G = R["main"].__globals__
FROZEN = (("spatial-9", 9, 1./256, 8, False), ("spatial-13", 13, 1./256, 8, False),
          ("spatial-17", 17, 1./256, 8, False), ("temporal-coarse", 13, 1./128, 4, True),
          ("temporal-medium", 13, 1./256, 8, True), ("temporal-fine", 13, 1./512, 16, True))
KEYS = ("state_error", "H_metric", "M_metric", "det_h", "trace_a", "Theta", "C_A", "C_B", "C_D", "C_P")
REGIONS = ("whole", "central_box", "faces", "edges", "corners")


def stage(index):
    return dict(stage=index+1, cfl=.2, max_basis_condition=30., max_characteristic_residual=1.e-13,
                min_lapse=.5, min_chi=.3, sat_max_abs=.001, det_h_max_error=1.e-13, basis_builds=3,
                faces=[dict(axis=a, side=s, sat_max_abs=.001) for a in range(3) for s in range(2)],
                coefficients_sha256=hashlib.sha256(str(index).encode()).hexdigest())


def rows():
    result = []
    for label, n, dt, steps, perturbed in FROZEN:
        norms = {region: {key: (2./(n-1))**2 for key in KEYS} for region in REGIONS}
        records = []
        for step in range(steps):
            stages = [dict(stage(k), coefficients_sha256=hashlib.sha256(f"{step}:{k}".encode()).hexdigest())
                      for k in range(4)]
            records.append(dict(step=step, stages=stages))
        result.append(dict(label=label, n=n, dt=dt, steps=steps, perturbed=perturbed, end_time=1./32,
                           completed=True, input_unchanged=True, phase="completed", attempted_step=steps-1,
                           last_completed_step=steps-1, initial_array=label+"-initial.npy", final_array=label+"-final.npy",
                           initial_measurements=deepcopy(norms), final_measurements=norms, step_records=records))
    return result


def test_frozen_matrix_and_mixed_order_decision():
    assert R["MATRIX"] == FROZEN
    assert R["FLOOR"] == 2.e-13 and R["SPATIAL_MIN"] == 1.5
    decision = R["evaluate"](rows(), [2.56e-8, 1.6e-9])
    assert decision["passed"] and decision["stages_checked"] == 208
    assert decision["disturbed_stages"] == 112 and len(decision["spatial"]) == 6
    assert all(abs(row["observed_order"]-2.) < 1.e-12 for row in decision["spatial"])
    assert abs(decision["temporal"]["observed_order"]-4.) < 1.e-12


@pytest.mark.parametrize("values", [(0., 0.), (1.e-14, 1.e-15), (1.e-8, 2.e-13)])
def test_roundoff_is_unresolved_not_a_pass(values):
    record = R["order_record"](*values, 2., 3.5, 4.5)
    assert not record["passed"] and not record["resolved"] and record["observed_order"] is None
    assert record["status"] == "unresolved"


@pytest.mark.parametrize("coarse,fine", [(1.e-7, 1.e-7), (1.e-8, 2.e-8), (8.e-8, 1.e-8), (64.e-8, 1.e-8)])
def test_wrong_time_order_is_not_accepted(coarse, fine):
    assert not R["evaluate"](rows(), [coarse, fine])["passed"]


@pytest.mark.parametrize("value", [True, float("nan"), float("inf"), -1., "1e-4"])
def test_invalid_errors_fail_closed(value):
    with pytest.raises(ValueError, match="finite"):
        R["order_record"](value, 1.e-5, 2., 1.5)


@pytest.mark.parametrize("metric", ["state_error", "H_metric", "M_metric"])
def test_one_failed_spatial_metric_prevents_pass(metric):
    data = rows()
    data[2]["final_measurements"]["whole"][metric] = 2*data[1]["final_measurements"]["whole"][metric]
    result = R["evaluate"](data, [2.56e-8, 1.6e-9])
    assert not result["spatial_passed"] and result["temporal_passed"] and not result["passed"]


@pytest.mark.parametrize("field,value", [("n", True), ("dt", 1./512), ("steps", 7), ("perturbed", 0),
    ("end_time", 1./64), ("completed", 1), ("input_unchanged", False), ("phase", "step"),
    ("attempted_step", True), ("last_completed_step", 6), ("final_array", "wrong.npy")])
def test_case_metadata_cannot_change_matrix(field, value):
    data = rows()
    data[0][field] = value
    with pytest.raises(ValueError):
        R["evaluate"](data, [2.56e-8, 1.6e-9])


@pytest.mark.parametrize("field,value", [("det_h_max_error", 1.e-8), ("min_lapse", 2.),
    ("cfl", .3), ("max_basis_condition", 1.e7), ("max_characteristic_residual", 1.e-8), ("stage", True)])
def test_one_bad_stage_cannot_be_averaged_away(field, value):
    data = rows()
    data[4]["step_records"][3]["stages"][2][field] = value
    with pytest.raises(ValueError, match="stages"):
        R["evaluate"](data, [2.56e-8, 1.6e-9])


@pytest.mark.parametrize("mutation", ["missing", "duplicate", "boolean", "face", "norm", "region"])
def test_missing_or_corrupt_evidence_rejected(mutation):
    data = rows()
    if mutation == "missing":
        data.pop()
    elif mutation == "duplicate":
        data[0]["step_records"][1] = deepcopy(data[0]["step_records"][0])
    elif mutation == "boolean":
        data[0]["step_records"][0]["step"] = False
    elif mutation == "face":
        data[0]["step_records"][0]["stages"][0]["faces"][0]["axis"] = False
    elif mutation == "norm":
        data[0]["final_measurements"]["whole"]["H_metric"] = float("nan")
    else:
        del data[0]["initial_measurements"]["corners"]
    with pytest.raises(ValueError):
        R["evaluate"](data, [2.56e-8, 1.6e-9])


def test_frozen_characteristics_do_not_pass_activity_gate():
    data = rows()
    for step in data[3]["step_records"]:
        for value in step["stages"]:
            value["coefficients_sha256"] = "0"*64
    assert not R["evaluate"](data, [2.56e-8, 1.6e-9])["passed"]


def test_component_mean_weighted_norm_and_region():
    values = np.empty((2, 2, 2, 2))
    values[..., 0], values[..., 1] = 1., 3.
    weights = np.arange(1., 9.).reshape(2, 2, 2)
    assert R["weighted_rms"](values, weights) == pytest.approx(math.sqrt(5.))
    mask = np.zeros((2, 2, 2), dtype=bool)
    mask[0, 0, 0] = True
    values[1, 1, 1] = 1.e6
    assert R["weighted_rms"](values, weights, mask) == pytest.approx(math.sqrt(5.))
    with pytest.raises(ValueError, match="nonempty"):
        R["weighted_rms"](values, weights, np.zeros_like(mask))


def test_regions_are_fixed_physical_box_and_disjoint_boundary_strata():
    xyz = np.meshgrid(*(np.linspace(1., 3., 9) for _ in range(3)), indexing="ij")
    driver = SimpleNamespace(volume=SimpleNamespace(axes=[SimpleNamespace(norm_weights=np.ones(9))]*3,
                                                   grid=SimpleNamespace(coordinates=xyz)))
    _w, masks = R["weights_and_regions"](driver)
    assert masks["central_box"].sum() == 125
    assert [masks[key].sum() for key in ("faces", "edges", "corners")] == [294, 84, 8]
    assert not np.any(masks["faces"] & masks["edges"])


@pytest.mark.parametrize("position", ["before", "at", "after"])
def test_new_deadline_is_absolute_and_strict(monkeypatch, tmp_path, position):
    deadline = 124.003+2400.
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
def test_storage_floor_not_lowered(monkeypatch, tmp_path, drive):
    def free(path):
        amount = 100*1024**3
        if (drive == "C" and str(path) == "C:/") or (drive == "E" and path == G["ROOT"]):
            amount = (3*1024**3 if drive == "C" else 4*1024**3+32*1024**2)-1
        return SimpleNamespace(free=amount)
    monkeypatch.setattr(G["shutil"], "disk_usage", free)
    with pytest.raises(ValueError, match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_partial_case_retains_last_accepted_state(monkeypatch, tmp_path):
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "measurements", lambda *a: rows()[0]["initial_measurements"])
    def step(q, index, dt, boundary):
        boundary(2*index)
        if index == 2:
            raise RuntimeError("injected third-step failure")
        return q+1.e-6, [stage(k) for k in range(4)]
    driver = SimpleNamespace(identity={}, gauge=SimpleNamespace(), config=SimpleNamespace(),
                             profile=SimpleNamespace(identity=lambda: {}), step=step,
                             boundary_targets=lambda q: q)
    initial = np.zeros((58, 9, 9, 9))
    records = []
    with pytest.raises(RuntimeError, match="third-step"):
        R["run_case"](driver, initial, initial.copy(), FROZEN[0], tmp_path, math.inf, records)
    assert len(records) == 1 and not records[0]["completed"]
    assert records[0]["attempted_step"] == 2 and records[0]["last_completed_step"] == 1
    assert len(records[0]["step_records"]) == 2 and "final_array" not in records[0]
    saved = np.load(tmp_path/records[0]["last_accepted_array"], allow_pickle=False)
    np.testing.assert_array_equal(saved, np.full_like(initial, 2.e-6))
    np.testing.assert_array_equal(initial, np.zeros_like(initial))


@pytest.mark.parametrize("bad", ["failure", "error", "skipped", "empty", "wrong-count", "duplicate", "wrong-class"])
def test_regression_report_requires_real_complete_green_cases(tmp_path, bad):
    child = f"<{bad}/>" if bad in ("failure", "error", "skipped") else ""
    row = f'<testcase classname="scripts.tests.test_nr_nonlinear_refinement" name="t">{child}</testcase>'
    if bad == "empty":
        row = ""
    elif bad == "duplicate":
        row += row
    elif bad == "wrong-class":
        row = row.replace("test_nr_nonlinear_refinement", "other")
    count = 3 if bad == "wrong-count" else (2 if bad == "duplicate" else (0 if bad == "empty" else 1))
    path = tmp_path/"report.xml"
    path.write_text(f'<testsuites><testsuite tests="{count}" failures="0" errors="0" skipped="0">{row}</testsuite></testsuites>')
    with pytest.raises(ValueError):
        R["green_report"](path, classname_suffix="scripts.tests.test_nr_nonlinear_refinement")


def test_green_report_and_fresh_json_output(tmp_path):
    path = tmp_path/"report.xml"
    path.write_text('<testsuites><testsuite tests="1" failures="0" errors="0" skipped="0">'
                    '<testcase classname="nr" name="test"/></testsuite></testsuites>')
    assert R["green_report"](path, expected_count=1)["tests"] == 1
    output = tmp_path/"result.json"
    R["write_json"](output, {"completed": False})
    with pytest.raises(FileExistsError):
        R["write_json"](output, {"completed": True})
    assert json.loads(output.read_text()) == {"completed": False}


@pytest.mark.parametrize("mode", ["save-final", "nan-state", "preflight"])
def test_failed_case_never_gets_completed(monkeypatch, tmp_path, mode):
    def guard(*args, **kwargs):
        if mode == "preflight":
            raise ValueError("injected resource stop")
    monkeypatch.setitem(G, "guard", guard)
    monkeypatch.setitem(G, "measurements", lambda *a: rows()[0]["initial_measurements"])
    original_save = R["save_array"]
    def save(directory, name, q):
        if mode == "save-final" and name.endswith("-final.npy"):
            raise OSError("injected final-save failure")
        original_save(directory, name, q)
    monkeypatch.setitem(G, "save_array", save)
    def step(q, index, dt, boundary):
        return (np.full_like(q, np.nan) if mode == "nan-state" else q+1.e-6), [stage(k) for k in range(4)]
    driver = SimpleNamespace(identity={}, gauge=SimpleNamespace(), config=SimpleNamespace(),
                             profile=SimpleNamespace(identity=lambda: {}), step=step,
                             boundary_targets=lambda q: q)
    initial = np.zeros((58, 9, 9, 9))
    records = []
    with pytest.raises((ValueError, OSError)):
        R["run_case"](driver, initial, initial.copy(), FROZEN[0], tmp_path, math.inf, records)
    assert len(records) == 1 and records[0]["completed"] is False
    assert "final_array" not in records[0] and "failure" in records[0]
    if mode != "preflight":
        saved = np.load(tmp_path/records[0]["last_accepted_array"], allow_pickle=False)
        assert np.all(np.isfinite(saved))
        assert records[0]["last_completed_step"] == (7 if mode == "save-final" else -1)


def test_initialization_failure_is_present_in_final_receipt(monkeypatch, tmp_path):
    source = tmp_path/"source.py"
    source.write_text("# synthetic source\n")
    protocol = tmp_path/"protocol.md"
    protocol.write_text("synthetic protocol\n")
    parent = tmp_path/"parent.json"
    parent.write_text("{}")
    report = tmp_path/"test.xml"
    report.write_text("synthetic report")
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"new-run"
    before = {"source.py": R["sha"](source)}
    transition = {"runner_tests": {"sha256": R["sha"](report)}}
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PROTOCOL", "protocol.md")
    monkeypatch.setitem(G, "PRIMARY", parent)
    monkeypatch.setitem(G, "RETAINED", {parent: R["sha"](parent)})
    monkeypatch.setitem(G, "source_identity", lambda _: (before, transition))
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    def broken_driver(_grid):
        raise RuntimeError("injected initialization failure")
    monkeypatch.setitem(G, "NonlinearSBPCube", broken_driver)
    monkeypatch.setattr(G["sys"], "argv", ["runner", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1
    receipt = json.loads((output/"receipt.json").read_text())
    assert receipt["completed"] is False and receipt["refinement_screen_passed"] is False
    assert receipt["closure_completed"] is False
    assert len(receipt["cases"]) == 1 and receipt["cases"][0]["phase"] == "initialization"
    assert "initialization failure" in receipt["cases"][0]["failure"]
    assert receipt["cases"][0]["last_completed_step"] == -1
    assert all(receipt[key] is False for key in R["FLAGS"])
    assert receipt["source_before"] == receipt["source_after"]
    assert "transition.json" in receipt["artifact_hashes"]

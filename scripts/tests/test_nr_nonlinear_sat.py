"""Fail-closed short-window decisions; synthetic fixtures are not physical data."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-nonlinear-sat.py"))


def cases():
    result = []
    stage = dict(cfl=.02, max_basis_condition=50., max_characteristic_residual=1.e-14,
                 min_lapse=.5, min_chi=.3, det_h_max_error=1.e-15, basis_builds=3,
                 faces=[dict(axis=axis, side=side, sat_max_abs=1.e-4) for axis in range(3) for side in range(2)],
                 sat_max_abs=1.e-4)
    # Transcribe the protocol, not the runner's matrix, so accidental changes
    # to the production constants cannot change both sides of this oracle.
    matrix = (("static", 1./1024, 4, 0), ("half-step", 1./2048, 8, 0),
              ("split-first", 1./1024, 2, 0), ("split-second", 1./1024, 2, 2), ("disturbed", 1./1024, 4, 0))
    diagnostics = {key: 1.e-6 for key in ("H_metric", "M_metric", "det_h", "trace_a", "Theta", "C_A", "C_B", "C_D", "C_P")}
    for label, dt, steps, start in matrix:
        records = []
        for k in range(start, start+steps):
            stages = [dict(deepcopy(stage), stage=j+1,
                           coefficients_sha256=hashlib.sha256(f"{4*k+j}".encode()).hexdigest()) for j in range(4)]
            records.append(dict(step=k, stages=stages))
        result.append(dict(label=label, dt=dt, steps=steps, start_index=start,
                           completed=True, input_unchanged=True, departure_rms=1.e-5,
                           initial_diagnostics=diagnostics.copy(), final_diagnostics=diagnostics.copy(), step_records=records))
    return result


def test_complete_bounded_decision_and_scope():
    report = RUN["evaluate"](cases(), 1.e-8, True, 0.)
    assert report["passed"] and report["stages_checked"] == 80
    assert "not convergence" in report["interpretation"]


@pytest.mark.parametrize("field,value", [("cfl", 1.), ("max_basis_condition", 1.e7),
    ("max_characteristic_residual", 1.e-8), ("min_lapse", 0.), ("min_chi", -1.)])
def test_one_failed_stage_cannot_be_averaged_away(field, value):
    rows = cases()
    rows[1]["step_records"][2]["stages"][1][field] = value
    assert not RUN["evaluate"](rows, 1.e-8, True, 0.)["passed"]


def test_missing_case_or_stage_rejected():
    with pytest.raises(ValueError, match="complete"):
        RUN["evaluate"](cases()[:-1], 0., True, 0.)
    rows = cases()
    rows[0]["step_records"].pop()
    with pytest.raises(ValueError, match="80"):
        RUN["evaluate"](rows, 0., True, 0.)


def test_frozen_coefficients_or_zero_penalty_are_not_coupling_progress():
    rows = cases()
    for step in rows[-1]["step_records"]:
        for stage in step["stages"]:
            stage["coefficients_sha256"] = "0"*64
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]
    rows = cases()
    for step in rows[-1]["step_records"]:
        for stage in step["stages"]:
            stage["sat_max_abs"] = 0.
            for face in stage["faces"]:
                face["sat_max_abs"] = 0.
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]


@pytest.mark.parametrize("ratio,replay,flat_error", [(float("nan"), True, 0.), (.01, True, 0.),
                                                     (0., False, 0.), (0., True, 1.e-8)])
def test_control_failure_cannot_pass(ratio, replay, flat_error):
    assert not RUN["evaluate"](cases(), ratio, replay, flat_error)["passed"]


def test_declared_perturbation_has_three_dimensional_variation():
    driver, initial = RUN["initial_data"]()
    before = initial.copy()
    d = RUN["disturbance"](driver.volume.grid)
    assert d.shape == (58, 9, 9, 9) and np.max(abs(d)) <= 1.
    for axis in range(1, 4):
        assert np.max(abs(np.diff(d, axis=axis))) > .1
    np.testing.assert_array_equal(before, initial)


def test_fresh_output_and_array_overwrite_rejected(tmp_path):
    with pytest.raises(ValueError, match="fresh"):
        RUN["fresh_output"](tmp_path)
    RUN["save_array"](tmp_path, "state.npy", np.ones(3))
    with pytest.raises(FileExistsError):
        RUN["save_array"](tmp_path, "state.npy", np.zeros(3))
    np.testing.assert_array_equal(np.load(tmp_path/"state.npy", allow_pickle=False), np.ones(3))


def test_inputs_are_not_mutated_by_decision():
    rows = cases()
    old = deepcopy(rows)
    RUN["evaluate"](rows, 0., True, 0.)
    assert rows == old


@pytest.mark.parametrize("key", ["cfl", "max_basis_condition", "max_characteristic_residual", "min_lapse",
                                 "min_chi", "sat_max_abs", "det_h_max_error"])
@pytest.mark.parametrize("value", [float("nan"), float("inf"), -1., True, None, "0"])
def test_invalid_stage_scalar_fails_closed(key, value):
    rows = cases()
    rows[0]["step_records"][0]["stages"][0][key] = value
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]


@pytest.mark.parametrize("corruption", ["duplicate-step", "boolean-step", "wrong-dt", "wrong-count", "wrong-restart"])
def test_frozen_case_coordinates_cannot_be_relabelled(corruption):
    rows = cases()
    if corruption == "duplicate-step":
        rows[0]["step_records"][1]["step"] = 0
    elif corruption == "boolean-step":
        rows[0]["step_records"][0]["step"] = False
    elif corruption == "wrong-dt":
        rows[0]["dt"] = 1./2048
    elif corruption == "wrong-count":
        rows[0]["steps"] = 5
    else:
        rows[3]["start_index"] = 0
    with pytest.raises(ValueError):
        RUN["evaluate"](rows, 0., True, 0.)


@pytest.mark.parametrize("corruption", ["duplicate-stage", "duplicate-face", "nonfinite-face", "false-face-axis",
                                       "missing-basis", "invalid-hash", "face-total-mismatch", "missing-scalar"])
def test_incomplete_or_duplicate_stage_records_do_not_count(corruption):
    rows = cases()
    stages = rows[0]["step_records"][0]["stages"]
    stage = stages[0]
    if corruption == "duplicate-stage":
        stages[1]["stage"] = 1
    elif corruption == "duplicate-face":
        stage["faces"][1] = stage["faces"][0].copy()
    elif corruption == "nonfinite-face":
        stage["faces"][2]["sat_max_abs"] = float("inf")
    elif corruption == "false-face-axis":
        stage["faces"][0]["axis"] = False
    elif corruption == "missing-basis":
        del stage["basis_builds"]
    elif corruption == "invalid-hash":
        stage["coefficients_sha256"] = "not-a-state-hash"
    elif corruption == "face-total-mismatch":
        stage["sat_max_abs"] = 1.e-3
    else:
        del stage["min_lapse"]
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]


@pytest.mark.parametrize("key", ["initial_diagnostics", "final_diagnostics"])
@pytest.mark.parametrize("value", [float("inf"), float("nan"), -1., None, True])
def test_nonfinite_or_invalid_diagnostic_cannot_pass(key, value):
    rows = cases()
    rows[0][key]["H_metric"] = value
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]


def test_missing_diagnostic_and_truthy_nonboolean_replay_cannot_pass():
    rows = cases()
    del rows[0]["initial_diagnostics"]["C_A"]
    assert not RUN["evaluate"](rows, 0., True, 0.)["passed"]
    assert not RUN["evaluate"](cases(), 0., "yes", 0.)["passed"]


class SyntheticDriver:
    """Cheap failure injection only; never represents a physics calculation."""
    def __init__(self, fail_step=None):
        self.fail_step = fail_step

    def boundary_targets(self, reference):
        return None

    def diagnostics(self, _q):
        return cases()[0]["initial_diagnostics"].copy()

    def step(self, q, index, dt, boundary):
        if index == self.fail_step:
            raise ValueError("injected step failure")
        return q+1.e-6, deepcopy(cases()[0]["step_records"][0]["stages"])


def test_failed_case_retains_prior_steps_without_a_false_final_array(monkeypatch, tmp_path):
    monkeypatch.setitem(RUN["case"].__globals__, "guard", lambda *_: None)
    rows, initial = [], np.zeros(3)
    with pytest.raises(ValueError, match="injected step failure"):
        RUN["case"](SyntheticDriver(fail_step=1), initial, initial, 1./1024, 4, "static", tmp_path, 0., records=rows)
    assert len(rows) == 1 and rows[0]["completed"] is False and rows[0]["input_unchanged"]
    assert rows[0]["phase"] == "step" and rows[0]["attempted_step"] == 1 and rows[0]["last_completed_step"] == 0
    assert len(rows[0]["step_records"]) == 1 and "failure" in rows[0] and "final_array" not in rows[0]
    assert not list(tmp_path.iterdir())
    np.testing.assert_array_equal(initial, np.zeros(3))


def test_case_is_complete_only_after_final_array_is_written(monkeypatch, tmp_path):
    monkeypatch.setitem(RUN["case"].__globals__, "guard", lambda *_: None)
    rows, initial = [], np.zeros(3)
    row, q = RUN["case"](SyntheticDriver(), initial, initial, 1./1024, 2, "split-first", tmp_path, 0., records=rows)
    assert rows == [row] and row["completed"] and row["phase"] == "completed"
    np.testing.assert_array_equal(np.load(tmp_path/row["final_array"], allow_pickle=False), q)
    np.testing.assert_array_equal(initial, np.zeros(3))


def test_final_write_failure_is_retained_not_marked_completed(monkeypatch, tmp_path):
    monkeypatch.setitem(RUN["case"].__globals__, "guard", lambda *_: None)

    def fail_save(*_):
        raise OSError("injected full disk")

    monkeypatch.setitem(RUN["case"].__globals__, "save_array", fail_save)
    rows, initial = [], np.zeros(3)
    with pytest.raises(OSError, match="full disk"):
        RUN["case"](SyntheticDriver(), initial, initial, 1./1024, 1, "static", tmp_path, 0., records=rows)
    assert rows[0]["completed"] is False and rows[0]["phase"] == "save-final-array"
    assert "final_array" not in rows[0] and rows[0]["input_unchanged"]


def test_preflight_failure_is_retained_without_running_driver(monkeypatch, tmp_path):
    def stop(*_):
        raise ValueError("reserve reached")

    monkeypatch.setitem(RUN["case"].__globals__, "guard", stop)
    rows, initial = [], np.zeros(3)
    with pytest.raises(ValueError, match="reserve"):
        RUN["case"](None, initial, initial, 1./1024, 4, "static", tmp_path, 0., records=rows)
    assert rows[0]["completed"] is False and rows[0]["phase"] == "preflight"
    assert rows[0]["step_records"] == [] and not list(tmp_path.iterdir())


def test_nonfinite_receipt_stays_serializable_and_explicitly_failed():
    raw = dict(completed=True, coupling_screen_passed=True, errors=[],
               cases=[dict(final_diagnostics={"H_metric": float("inf"), "M_metric": float("nan")})])
    payload = RUN["receipt_payload"](raw)
    assert raw["completed"] and not raw["errors"]
    assert payload["completed"] is False and payload["coupling_screen_passed"] is False
    assert len(payload["nonfinite_record_paths"]) == 2 and payload["errors"]
    restored = json.loads(json.dumps(payload, allow_nan=False))
    assert restored["cases"][0]["final_diagnostics"]["H_metric"] == {"invalid_nonfinite": "inf"}


def test_valid_receipt_payload_unchanged():
    raw = dict(completed=True, coupling_screen_passed=True, errors=[], cases=cases())
    assert RUN["receipt_payload"](raw) == raw


@pytest.mark.parametrize("drive", ["C", "E"])
def test_disk_floor_is_not_bypassed_by_fresh_output(monkeypatch, tmp_path, drive):
    def usage(path):
        floor = RUN["C_RESERVE"] if str(path) == "C:/" else RUN["E_RESERVE"]
        which = "C" if str(path) == "C:/" else "E"
        return SimpleNamespace(free=floor-(1 if drive == which else 0))

    monkeypatch.setattr(RUN["shutil"], "disk_usage", usage)
    with pytest.raises(ValueError, match="storage reserve"):
        RUN["guard"](tmp_path, RUN["time"].perf_counter())

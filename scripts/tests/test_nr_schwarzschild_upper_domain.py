"""Synthetic gate and analytic initial-data tests; not evolved physics evidence."""
import copy
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-upper-domain.py"))
A = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-schwarzschild-upper-domain.py"))
W = R["W"]


def saved(path, t, n):
    return {"path": path, "bounded_window": True,
            "diagnostics": {"time": t, "core": {m: {"l2": (2.5/(n-1))**4} for m in W["METRICS"]}}}


def fixture():
    value = {"study_cases": [{"n": n, "initial": saved(f"initial-{n}", 0., n),
              "samples": [saved(f"{n}-{t}", t, n) for t in R["TIMES"]]} for n in R["SIZES"]],
        "region_comparisons": [{"main_n": small, "upper_n": n, "time": t,
            "metrics": {m: {"rms_difference": (2.5/(n-1))**4} for m in W["METRICS"]}}
            for small, n in R["PAIRS"] for t in W["TIMES"]],
        "time_samples": [saved(f"time-{t}", t, 41) for t in (.25, .5, .75, 1.)],
        "time_controls": [{"time": t, "passed": True, "metrics": {m: {
            "rms_difference": .01, "coarse_norm": 1., "fine_norm": .99, "ratio": .01, "passed": True}
            for m in W["METRICS"]}} for t in (.25, .5, 1.)],
        "shared_initial": [{"main_n": small, "upper_n": n, "lower": [1., 1., 1.],
            "spacing": [2.5/(n-1)]*3, "coordinate_linf": 0., "state_linf": 0.} for small, n in R["PAIRS"]],
        "time_initial": {"state_byte_equal": True}, "deterministic_replay": True}
    value["spatial_assessment"] = R["assess_spatial"](value)
    return value


def test_complete_matrix_and_independent_orders():
    value = fixture()
    assert len(R["all_samples"](value)) == 31
    assert len(A["expected_matrix"]()) == 31
    assert all(key[2:4] == (1., 3.5) for key in A["expected_matrix"]())
    assert R["final_assessment"](value) == {"bounded_study": True, "study_passed": True}
    assert A["recompute_groups"](value) == value["spatial_assessment"]
    for key in ("upper_groups", "region_difference_groups"):
        assert len(value["spatial_assessment"][key]) == 15
        for group in value["spatial_assessment"][key]:
            assert group["orders"] == pytest.approx([4., 4.])


@pytest.mark.parametrize("defect", ["grid", "time", "region", "pair", "dt", "duplicate", "replay",
    "initial", "lower", "spacing", "time-verdict", "nan", "missing-field", "assessment"])
def test_incomplete_or_contradictory_matrix_is_rejected(defect):
    value = fixture()
    if defect == "grid":
        value["study_cases"].pop()
    elif defect == "time":
        value["study_cases"][1]["samples"].pop()
    elif defect == "region":
        value["region_comparisons"].pop()
    elif defect == "pair":
        value["region_comparisons"][0]["main_n"] = 25
    elif defect == "dt":
        value["time_controls"].pop()
    elif defect == "duplicate":
        value["time_samples"][-1]["path"] = value["time_samples"][0]["path"]
    elif defect == "replay":
        value["deterministic_replay"] = False
    elif defect == "initial":
        value["shared_initial"][1]["state_linf"] = 3.e-14
    elif defect == "lower":
        value["shared_initial"][0]["lower"][0] = .5
    elif defect == "spacing":
        value["shared_initial"][0]["spacing"][0] *= 2
    elif defect == "time-verdict":
        value["time_controls"][0]["metrics"]["H"]["passed"] = False
    elif defect == "nan":
        value["time_controls"][0]["metrics"]["H"]["ratio"] = float("nan")
    elif defect == "missing-field":
        del value["time_controls"][0]["metrics"]["H"]
    else:
        value["spatial_assessment"]["upper_groups"][0]["orders"] = [9., 9.]
    with pytest.raises(ValueError):
        R["final_assessment"](value)


@pytest.mark.parametrize("failure", ["upper", "region", "bounded", "time"])
def test_numerical_failure_is_not_an_execution_exception(failure):
    value = fixture()
    if failure == "upper":
        value["study_cases"][1]["samples"][-1]["diagnostics"]["core"]["H"]["l2"] = 1.e-10
    elif failure == "region":
        value["region_comparisons"][-1]["metrics"]["H"]["rms_difference"] = 1.
    elif failure == "bounded":
        value["study_cases"][0]["initial"]["bounded_window"] = False
    else:
        value["time_controls"][0]["metrics"]["H"].update(rms_difference=.1, ratio=.1, passed=False)
        value["time_controls"][0]["passed"] = False
    value["spatial_assessment"] = R["assess_spatial"](value)
    assert R["final_assessment"](value)["study_passed"] is False
    assert A["recompute_groups"](value) == value["spatial_assessment"]


@pytest.mark.parametrize("small,large", R["PAIRS"])
def test_shared_initial_fields_and_lower_faces_do_not_move(small, large):
    base, upper = R["B"]["seed"](small, 4), R["upper_seed"](large)
    before = upper.to_bytes()
    result = R["shared_initial"](base, upper)
    assert result["lower"] == [1., 1., 1.]
    assert result["state_linf"] <= 2.e-14
    assert result["coordinate_linf"] <= 2.e-15
    assert upper.to_bytes() == before
    assert upper.domain.lower == base.domain.lower == 1.


def test_half_step_initial_has_identical_slots_but_different_dt():
    base, fine = R["upper_seed"](41), R["upper_seed"](41, 1./512)
    assert np.asarray(base.slots).tobytes() == np.asarray(fine.slots).tobytes()
    assert base.header["dt"] == 2*fine.header["dt"]


@pytest.mark.parametrize("n,dt", [(17, 1./256), (25, 1./256), (49, 1./256), (21, 1./512), (41, 1./128), (True, 1./256)])
def test_undeclared_case_rejected(n, dt):
    with pytest.raises(ValueError):
        R["upper_seed"](n, dt)


def test_moving_inner_faces_is_not_accepted_as_upper_only_control():
    with pytest.raises(ValueError, match="upper-only"):
        R["shared_initial"](R["B"]["seed"](17, 4), R["D"]["expanded_seed"](25))


@pytest.mark.parametrize("c_delta,e_delta,accepted", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_reserves_and_next_output_headroom(monkeypatch, tmp_path, c_delta, e_delta, accepted):
    runner = R["Runner"](tmp_path, {}, "n21", 0.)
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        R["RUN"]["E_RESERVE"]+16*1024**2+e_delta if Path(p) == R["ROOT"] else R["RUN"]["C_RESERVE"]+c_delta))
    if accepted:
        assert runner.budget() == 180.
    else:
        with pytest.raises(ValueError, match="reserve"):
            runner.budget()


def test_exhausted_chain_budget_refuses_new_native_call(tmp_path):
    runner = R["Runner"](tmp_path, {}, "n21", 7800.)
    with pytest.raises(ValueError, match="7800s"):
        runner.budget()


def stage_fixture():
    return {"schema": R["SCHEMA"], "stage": "replay", "stage_completed": True, "errors": [],
        "protocol_sha256": R["sha256"](R["PROTOCOL"]), "retained_study_passed": False, "retained_window_passed": False,
        "baseline_sha256": R["D"]["BASELINE_SHA"], "anchor_sha256": R["ANCHOR_SHA"], "domain": R["DOMAIN"].identity(),
        "stage_caps": list(R["CAPS"]["replay"]), "c_reserve_bytes": R["RUN"]["C_RESERVE"],
        "e_reserve_bytes": R["RUN"]["E_RESERVE"], "seconds": 10., "study_chain_seconds": 100.,
        "study_completed": True, "study_passed": False, "stage_passed": False,
        "commands": [{"label": "upper-n21-serial-t1", "returncode": 0}], **{k: False for k in R["FLAGS"]}}


def test_complete_failed_study_can_be_audited():
    A["validate_final"](stage_fixture())


@pytest.mark.parametrize("defect", [*R["FLAGS"], "retained_study_passed", "retained_window_passed",
    "seconds", "study_chain_seconds", "study_completed", "command", "stage_caps"])
def test_final_identity_and_admission_cannot_be_forged(defect):
    value = stage_fixture()
    if defect == "seconds":
        value[defect] = 700.
    elif defect == "study_chain_seconds":
        value[defect] = 7800.
    elif defect == "study_completed":
        value[defect] = False
    elif defect == "command":
        value["commands"][0]["returncode"] = 2
    elif defect == "stage_caps":
        value[defect][0] += 1
    else:
        value[defect] = True
    with pytest.raises(ValueError):
        A["validate_final"](value)


def test_audit_loader_rejects_old_expansion_domain(tmp_path):
    path = tmp_path/"untrusted.bin"
    metadata = {"grid": {}, "diagnostics": {"schwarzschild_domain": R["D"]["DOMAIN"].identity()}}
    path.with_suffix(".json").write_text(json.dumps(metadata), encoding="utf-8")
    with pytest.raises(ValueError, match="upper-domain"):
        A["load"](path)


def test_parent_first_stage_rejects_unexpected_external_receipt():
    with pytest.raises(ValueError, match="fixed anchor"):
        R["parent_for"]("n21", Path("unrelated.json"), "hash", {})


def test_assessment_does_not_mutate_sample_inventory():
    value = fixture()
    original = copy.deepcopy(value)
    R["final_assessment"](value)
    assert value == original

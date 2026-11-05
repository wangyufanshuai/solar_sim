"""Synthetic gate tests and analytic initial controls, not physics admission."""
import copy
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1] / "run-nr-k3-schwarzschild-lower-domain.py"))
A = runpy.run_path(str(Path(__file__).resolve().parents[1] / "audit-nr-k3-schwarzschild-lower-domain.py"))
W = R["W"]


def saved(path, t, n):
    return {"path": path, "bounded_window": True, "diagnostics": {"time": t,
        "core": {m: {"l2": (2.5 / (n - 1))**4} for m in W["METRICS"]}}}


def fixture():
    value = {"study_cases": [{"n": n, "initial": saved(f"initial-{n}", 0., n),
        "samples": [saved(f"{n}-{t}", t, n) for t in R["TIMES"]]} for n in R["SIZES"]],
        "region_comparisons": [{"main_n": s, "lower_n": n, "time": t,
            "metrics": {m: {"rms_difference": (2.5 / (n - 1))**4} for m in W["METRICS"]}}
            for s, n in R["PAIRS"] for t in W["TIMES"]],
        "time_samples": [saved(f"half-{t}", t, 41) for t in (.25, .5, .75, 1.)],
        "time_controls": [{"time": t, "passed": True, "metrics": {m: {
            "rms_difference": .01, "coarse_norm": 1., "fine_norm": .99, "ratio": .01, "passed": True}
            for m in W["METRICS"]}} for t in (.25, .5, 1.)],
        "shared_initial": [{"main_n": s, "lower_n": n, "upper": 3., "spacing": [2.5 / (n - 1)] * 3,
            "coordinate_linf": 0., "state_linf": 0.} for s, n in R["PAIRS"]],
        "historical_controls": [{"n": 21, "time": t, "entire_lower_cube_bytes_equal": True} for t in W["TIMES"]],
        "time_initial": {"state_byte_equal": True}, "deterministic_replay": True,
        "factorial_records": [{"n": n, "time": t, "metric": m, **R["H"].factorial({
            "none": np.full((5, 5, 5), 3 * (2.5 / (n - 1))**4), "both": np.zeros((5, 5, 5)),
            "high": np.full((5, 5, 5), 2 * (2.5 / (n - 1))**4), "low": np.full((5, 5, 5), (2.5 / (n - 1))**4)})}
            for n in R["SIZES"] for t in W["TIMES"] for m in ("H", "ricci_error")]}
    value["spatial_assessment"] = R["assess_spatial"](value)
    value["factorial_trends"] = R["factorial_trends"](value["factorial_records"])
    return value


def test_complete_coverage_and_separate_order_classifier():
    value = fixture()
    before = copy.deepcopy(value)
    assert R["final_assessment"](value) == {"bounded_study": True, "study_passed": True}
    assert A["recompute_groups"](value) == value["spatial_assessment"]
    assert len(value["factorial_trends"]) == 24
    assert value == before


@pytest.mark.parametrize("defect", ["grid", "time", "region", "pair", "dt", "duplicate", "replay", "initial",
    "upper", "spacing", "time-verdict", "nan", "missing-field", "assessment", "historical", "factorial", "interaction"])
def test_incomplete_or_contradictory_matrix_rejected(defect):
    v = fixture()
    if defect == "grid":
        v["study_cases"].pop()
    elif defect == "time":
        v["study_cases"][0]["samples"].pop()
    elif defect == "region":
        v["region_comparisons"].pop()
    elif defect == "pair":
        v["region_comparisons"][0]["main_n"] = 33
    elif defect == "dt":
        v["time_controls"].pop()
    elif defect == "duplicate":
        v["time_samples"][-1]["path"] = v["time_samples"][0]["path"]
    elif defect == "replay":
        v["deterministic_replay"] = False
    elif defect == "initial":
        v["shared_initial"][0]["state_linf"] = 3.e-14
    elif defect == "upper":
        v["shared_initial"][0]["upper"] = 3.5
    elif defect == "spacing":
        v["shared_initial"][0]["spacing"][0] *= 2
    elif defect == "time-verdict":
        v["time_controls"][0]["metrics"]["H"]["passed"] = False
    elif defect == "nan":
        v["time_controls"][0]["metrics"]["H"]["ratio"] = float("nan")
    elif defect == "missing-field":
        del v["time_controls"][0]["metrics"]["H"]
    elif defect == "assessment":
        v["spatial_assessment"]["lower_groups"][0]["orders"] = [9., 9.]
    elif defect == "historical":
        v["historical_controls"][0]["entire_lower_cube_bytes_equal"] = False
    elif defect == "factorial":
        v["factorial_records"].pop()
    else:
        v["factorial_records"][0]["identity_residual"] = 3.e-12
    with pytest.raises(ValueError):
        R["final_assessment"](v)


@pytest.mark.parametrize("failure", ["lower", "difference", "bounded", "time"])
def test_numerical_failure_is_retained_not_an_execution_error(failure):
    v = fixture()
    if failure == "lower":
        v["study_cases"][2]["samples"][-1]["diagnostics"]["core"]["H"]["l2"] = 1.
    elif failure == "difference":
        v["region_comparisons"][-1]["metrics"]["H"]["rms_difference"] = 1.
    elif failure == "bounded":
        v["study_cases"][0]["initial"]["bounded_window"] = False
    else:
        v["time_controls"][0]["metrics"]["H"].update(rms_difference=.1, ratio=.1, passed=False)
        v["time_controls"][0]["passed"] = False
    v["spatial_assessment"] = R["assess_spatial"](v)
    assert R["final_assessment"](v)["study_passed"] is False
    assert A["recompute_groups"](v) == v["spatial_assessment"]


@pytest.mark.parametrize("values", [[0., 0., 0.], [1.e-13, 2.e-13, 3.e-13], [1.e-9, 1.e-11, 1.e-13], [1., .1, .01]])
def test_floor_rules_match_existing_contract(values):
    assert A["independent_refinement"](values) == R["B"]["refinement"](values, 4)


@pytest.mark.parametrize("small,n", R["PAIRS"])
def test_shared_initial_upper_faces_stay_at_three(small, n):
    data = R["lower_seed"](n)
    before = data.to_bytes()
    result = R["shared_initial"](R["B"]["seed"](small, 4), data)
    assert result["upper"] == 3.
    assert result["state_linf"] <= 2.e-14
    assert data.to_bytes() == before


def test_half_step_slots_equal_and_coarse_high_clamp_initial_equal():
    a, b = R["lower_seed"](41), R["lower_seed"](41, 1. / 512)
    assert np.asarray(a.slots).tobytes() == np.asarray(b.slots).tobytes()
    lower = R["lower_seed"](21)
    large = R["U"]["D"]["expanded_seed"](25)
    assert np.asarray(lower.slots).tobytes() == np.ascontiguousarray(np.asarray(large.slots)[:, :21, :21, :21]).tobytes()


@pytest.mark.parametrize("n,dt", [(True, 1. / 256), (25, 1. / 256), (21, 1. / 512), (41, 1. / 128)])
def test_undeclared_cases_rejected(n, dt):
    with pytest.raises(ValueError):
        R["lower_seed"](n, dt)


@pytest.mark.parametrize("c_delta,e_delta,accepted", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_disk_floor_and_headroom(monkeypatch, tmp_path, c_delta, e_delta, accepted):
    runner = R["Runner"](tmp_path, {}, "n21", 0.)
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        R["RUN"]["E_RESERVE"] + 16 * 1024**2 + e_delta if Path(p) == R["ROOT"] else R["RUN"]["C_RESERVE"] + c_delta))
    if accepted:
        assert runner.budget() == 180.
    else:
        with pytest.raises(ValueError, match="reserve"):
            runner.budget()


def test_exhausted_budget_or_wrong_parent_rejected(tmp_path):
    with pytest.raises(ValueError, match="8000s"):
        R["Runner"](tmp_path, {}, "n21", 8000.).budget()
    with pytest.raises(ValueError, match="fixed anchor"):
        R["parent_for"]("n21", tmp_path, "hash", {})


def stage_fixture():
    return {"schema": R["SCHEMA"], "stage": "replay", "stage_completed": True, "errors": [],
        "protocol_sha256": R["sha256"](R["PROTOCOL"]), "anchor_sha256": R["ANCHOR_SHA"],
        "inventory_sha256": R["INVENTORY_SHA"], "domain": R["DOMAIN"].identity(), "binary_sha256": R["BINARY_SHA"],
        "retained_failures": {k: False for k in R["OLD"]}, "stage_caps": list(R["CAPS"]["replay"]),
        "c_reserve_bytes": R["RUN"]["C_RESERVE"], "e_reserve_bytes": R["RUN"]["E_RESERVE"],
        "seconds": 10., "study_chain_seconds": 100., "commands": [{"returncode": 0}],
        "historical_controls": fixture()["historical_controls"], **{k: False for k in R["FLAGS"]}}


def test_complete_failed_stage_accepted_for_continuation():
    R["validate_stage"](stage_fixture(), "replay")


@pytest.mark.parametrize("defect", [*R["FLAGS"], "seconds", "chain", "command", "binary", "caps", "historical", "retained"])
def test_forged_stage_or_promotion_rejected(defect):
    value = stage_fixture()
    if defect in R["FLAGS"]:
        value[defect] = True
    elif defect == "seconds":
        value["seconds"] = 700.
    elif defect == "chain":
        value["study_chain_seconds"] = float("nan")
    elif defect == "command":
        value["commands"][0]["returncode"] = 2
    elif defect == "binary":
        value["binary_sha256"] = "invalid"
    elif defect == "caps":
        value["stage_caps"][0] += 1
    elif defect == "retained":
        value["retained_failures"]["original"] = True
    else:
        value["historical_controls"].pop()
    with pytest.raises(ValueError):
        R["validate_stage"](value, "replay")

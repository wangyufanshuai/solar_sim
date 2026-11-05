"""Fixed RHS matrix and resource boundary checks; no live physical experiment."""
import copy
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-initial-rhs-locality.py"))


def inventory():
    rows = [{"domain": name, "n": n, "time": 0., "path": f"synthetic-{name}-{n}", "sha256": "synthetic"}
            for ns in R["TRIPLES"] for name, n in zip(R["NAMES"], ns, strict=True)]
    return {"inventory": rows, "input_checkpoint_hashes": {r["path"]: r["sha256"] for r in rows}}


def matrix():
    slots = [{"slot": i} for i in range(58)]
    return {"cases": [{"domain": name, "n": n, "core_slot_norms": copy.deepcopy(slots), "parity_by_slot": [0.]*58}
                     for ns in R["TRIPLES"] for name, n in zip(R["NAMES"], ns, strict=True)],
        "pairs": [{"original_n": ns[0], "left_domain": a, "right_domain": b,
            "regions": {name: {key: copy.deepcopy(slots) for key in ("left", "right", "difference")}
                        for name in ("active", "lower_only", "upper_only", "mixed_lower_upper", "core")}}
                  for ns in R["TRIPLES"] for a, b in R["PAIRS"]],
        "probe_call_count": 10, "thread_replay": {"bytes_equal": True}}


def test_complete_initial_inventory_and_matrix_are_accepted():
    assert len(R["initial_rows"](inventory())) == 9
    R["complete_coverage"](matrix())


@pytest.mark.parametrize("defect", ["missing", "duplicate", "wrong_time", "bool_time", "hash"])
def test_input_inventory_is_fail_closed(defect):
    value = inventory()
    if defect == "missing":
        value["inventory"].pop()
    elif defect == "duplicate":
        value["inventory"][-1] = copy.deepcopy(value["inventory"][0])
    elif defect == "hash":
        value["inventory"][0]["sha256"] = "wrong"
    else:
        value["inventory"][0]["time"] = False if defect == "bool_time" else .125
    with pytest.raises(ValueError):
        R["initial_rows"](value)


@pytest.mark.parametrize("defect", ["missing_case", "duplicate_case", "missing_pair", "missing_region",
                                    "missing_slot", "wrong_slot", "missing_parity", "replay", "call_count"])
def test_full_case_slot_and_replay_coverage_is_required(defect):
    value = matrix()
    if defect == "missing_case":
        value["cases"].pop()
    elif defect == "duplicate_case":
        value["cases"][-1] = copy.deepcopy(value["cases"][0])
    elif defect == "missing_pair":
        value["pairs"].pop()
    elif defect == "missing_region":
        value["pairs"][0]["regions"].pop("core")
    elif defect == "missing_slot":
        value["pairs"][0]["regions"]["active"]["difference"].pop()
    elif defect == "wrong_slot":
        value["cases"][0]["core_slot_norms"][0]["slot"] = 57
    elif defect == "missing_parity":
        value["cases"][0]["parity_by_slot"].pop()
    elif defect == "replay":
        value["thread_replay"]["bytes_equal"] = False
    else:
        value["probe_call_count"] -= 1
    with pytest.raises(ValueError):
        R["complete_coverage"](value)


@pytest.mark.parametrize("c_delta,e_delta,ok", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_user_disk_reserves_and_headroom_are_kept(monkeypatch, tmp_path, c_delta, e_delta, ok):
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        R["E_RESERVE"]+R["HEADROOM"]+e_delta if Path(p) == R["ROOT"] else R["C_RESERVE"]+c_delta))
    runner = R["Runner"](tmp_path, {"commands": []})
    if ok:
        assert runner.budget() <= 180.
    else:
        with pytest.raises(ValueError, match="disk reserve"):
            runner.budget()


def test_time_cap_is_not_reset_between_cases(monkeypatch, tmp_path):
    runner = R["Runner"](tmp_path, {"commands": []})
    monkeypatch.setattr(R["time"], "perf_counter", lambda: runner.started+900.)
    with pytest.raises(ValueError, match="900s"):
        runner.budget()

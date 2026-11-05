"""Coverage and fail-closed provenance tests; fixtures are synthetic."""
import copy
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-schwarzschild-error-localization.py"))


def coverage_fixture():
    return {
        "profiles": [{"domain": name, "n": n, "time": t, "metric": m}
                     for ns in R["TRIPLES"] for name, n in zip(R["NAMES"], ns, strict=True)
                     for t in R["TIMES"] for m in R["METRICS"]],
        "pair_profiles": [{"original_n": ns[0], "left_domain": left, "right_domain": right, "time": t, "metric": m}
                          for ns in R["TRIPLES"] for left, right in R["PAIRS"]
                          for t in R["TIMES"] for m in R["METRICS"]],
        "inventory": [{"domain": name, "n": n, "time": t}
                      for ns in R["TRIPLES"] for name, n in zip(R["NAMES"], ns, strict=True)
                      for t in (0., *R["TIMES"])],
        "input_checkpoint_hashes": {f"synthetic-{i}": "synthetic" for i in range(45)},
        "shared_initial_metric_pairs": 12,
    }


def audit_fixture():
    return {"schema": "nr-upper-domain-independent-process-audit-v1", "audit_completed": True,
            "errors": [], "receipt_sha256": R["RECEIPT_SHA"], "reproduced_study_passed": False,
            "samples_recomputed": 31, "spatial_groups_recomputed": 30, "signed_time_metrics_recomputed": 39,
            "native_manifest_pairs_rechecked": 29, "shared_initial_pairs_recomputed": 3,
            "region_comparisons_recomputed": 12, "deterministic_replay_rechecked": True,
            **{key: False for key in R["R"]["FLAGS"]}}


def test_full_fixed_inventory_is_accepted_without_mutation():
    value = coverage_fixture()
    before = copy.deepcopy(value)
    R["check_coverage"](value)
    assert value == before


@pytest.mark.parametrize("key", ["profiles", "pair_profiles", "inventory"])
@pytest.mark.parametrize("defect", ["missing", "duplicate", "unplanned_time"])
def test_fixed_inventory_refuses_missing_duplicate_or_replaced_measurements(key, defect):
    value = coverage_fixture()
    if defect == "missing":
        value[key].pop()
    elif defect == "duplicate":
        value[key][-1] = copy.deepcopy(value[key][0])
    else:
        value[key][0]["time"] = .375
    with pytest.raises(ValueError):
        R["check_coverage"](value)


@pytest.mark.parametrize("key", ["input_checkpoint_hashes", "shared_initial_metric_pairs"])
def test_input_identity_or_initial_pair_coverage_cannot_be_omitted(key):
    value = coverage_fixture()
    if key == "input_checkpoint_hashes":
        value[key].pop("synthetic-44")
    else:
        value[key] -= 1
    with pytest.raises(ValueError):
        R["check_coverage"](value)


def test_completed_failed_predecessor_is_valid_analysis_input():
    R["validate_audit"](audit_fixture())


@pytest.mark.parametrize("defect", [*R["R"]["FLAGS"], "reproduced_study_passed", "audit_completed",
                                   "receipt_sha256", "signed_time_metrics_recomputed", "errors"])
def test_failed_predecessor_cannot_be_promoted_or_underverified(defect):
    value = audit_fixture()
    if defect == "audit_completed":
        value[defect] = False
    elif defect == "receipt_sha256":
        value[defect] = "different"
    elif defect == "signed_time_metrics_recomputed":
        value[defect] = 38
    elif defect == "errors":
        value[defect] = ["incomplete"]
    else:
        value[defect] = True
    with pytest.raises(ValueError):
        R["validate_audit"](value)


@pytest.mark.parametrize("defect", ["missing", "duplicate", "nan", "bool"])
def test_saved_time_selection_is_fixed_and_fail_closed(defect):
    rows = [{"diagnostics": {"time": t}} for t in R["TIMES"]]
    if defect == "missing":
        rows.pop()
    elif defect == "duplicate":
        rows.append(copy.deepcopy(rows[0]))
    else:
        rows[-1]["diagnostics"]["time"] = float("nan") if defect == "nan" else True
    with pytest.raises(ValueError):
        R["declared_times"](rows)


def test_grid_selection_refuses_duplicate_rows():
    rows = [{"n": 17, "order": 4}]*2
    with pytest.raises(ValueError, match="unique declared grid"):
        R["selected_row"](rows, 17, original=True)


@pytest.mark.parametrize("c_delta,e_delta,ok", [(0, 0, True), (-1, 0, False), (0, -1, False)])
def test_c_e_reserves_and_next_output_headroom_are_enforced(monkeypatch, tmp_path, c_delta, e_delta, ok):
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda p: SimpleNamespace(free=
        R["RUN"]["E_RESERVE"]+16*1024**2+e_delta if Path(p) == R["ROOT"] else R["RUN"]["C_RESERVE"]+c_delta))
    guard = R["Budget"](tmp_path)
    if ok:
        guard.check()
    else:
        with pytest.raises(ValueError, match="reserve"):
            guard.check()


def test_elapsed_budget_is_not_renewed_between_checkpoints(monkeypatch, tmp_path):
    guard = R["Budget"](tmp_path)
    monkeypatch.setattr(R["time"], "perf_counter", lambda: guard.started+240.)
    with pytest.raises(ValueError, match="240s"):
        guard.check()

"""Synthetic recovery/gating tests, not numerical evolution evidence."""
from copy import deepcopy
from pathlib import Path
import runpy
from types import SimpleNamespace

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"finish-nr-k3-schwarzschild-domain-matrix.py"))
FIX = runpy.run_path(str(Path(__file__).with_name("test_nr_schwarzschild_domain_matrix.py")))


def stopped():
    value = FIX["fixture"]()
    value.pop("deterministic_replay")
    value["time_samples"] = value["time_samples"][:2]
    value["time_controls"] = value["time_controls"][:2]
    value.update(schema=R["D"]["SCHEMA"], stage="dt49", stage_completed=False, stage_passed=False,
                 study_completed=False, study_passed=False, retained_window_passed=False,
                 seconds=876., study_chain_seconds=2248., stage_caps=list(R["D"]["CAPS"]["dt49"]),
                 errors=["ValueError: E reserve plus next-output headroom reached"],
                 commands=[{"label": f"dt-expanded-n49-t{t:g}", "returncode": 0,
                            "timeout_seconds": 600.} for t in (.25, .5)])
    value.update({key: False for key in R["FLAGS"]})
    return value


def test_exact_retained_storage_stop_is_admissible_without_mutation():
    value = stopped()
    before = deepcopy(value)
    R["validate_stop"](value)
    assert value == before


@pytest.mark.parametrize("defect", ["schema", "stage", "complete", "promote", "error", "command-label",
    "command-fail", "timeout", "cap", "missing-time", "time-order", "missing-field", "control-fail",
    "duplicate", "spatial-verdict", "initial", "replay", "seconds", "chain", "limits"])
def test_other_failures_or_unreviewed_prefixes_are_rejected(defect):
    value = stopped()
    if defect in ("schema", "stage"):
        value[defect] = "other"
    elif defect == "complete":
        value["stage_completed"] = True
    elif defect == "promote":
        value["physical_validation"] = True
    elif defect == "error":
        value["errors"] = ["ValueError: unknown"]
    elif defect == "command-label":
        value["commands"][0]["label"] = "other"
    elif defect == "command-fail":
        value["commands"][0]["returncode"] = 2
    elif defect == "timeout":
        value["commands"][0]["timed_out"] = True
    elif defect == "cap":
        value["commands"][0]["timeout_seconds"] = 601.
    elif defect == "missing-time":
        value["time_samples"].pop()
    elif defect == "time-order":
        value["time_samples"].reverse()
    elif defect == "missing-field":
        del value["time_controls"][0]["metrics"]["H"]
    elif defect == "control-fail":
        value["time_controls"][0]["passed"] = False
    elif defect == "duplicate":
        value["time_samples"][0]["path"] = value["time_samples"][1]["path"]
    elif defect == "spatial-verdict":
        value["spatial_assessment"]["expanded_spatial_passed"] = False
    elif defect == "initial":
        value["time_initial"]["state_byte_equal"] = False
    elif defect == "replay":
        value["deterministic_replay"] = True
    elif defect == "seconds":
        value["seconds"] = float("nan")
    elif defect == "chain":
        value["study_chain_seconds"] = 7200.
    else:
        value["stage_caps"][0] += 1
    with pytest.raises(ValueError):
        R["validate_stop"](value)


def test_unfavorable_spatial_result_is_preserved():
    value = stopped()
    value["region_comparisons"][-1]["metrics"]["H"]["rms_difference"] = 1.
    value["spatial_assessment"] = R["D"]["assess_spatial"](value)
    assert not value["spatial_assessment"]["region_difference_spatial_passed"]
    R["validate_stop"](value)


def test_inheritance_preserves_old_objects_and_marks_only_provenance():
    value = stopped()
    before = deepcopy(value)
    result = R["inherit"](value)
    assert value == before
    assert all(sample["retained"] for sample in R["D"]["all_samples"](result))
    assert result["spatial_assessment"] == value["spatial_assessment"]
    result["time_samples"].clear()
    assert len(value["time_samples"]) == 2


def test_completion_does_not_edit_existing_sources_or_expand_scientific_scope():
    assert R["NEW"] == {"scripts/finish-nr-k3-schwarzschild-domain-matrix.py",
                         "scripts/tests/test_nr_schwarzschild_domain_completion.py"}
    assert R["STOPPED_SHA"] == "0f34ebc5d77b493d3675c8dff6777c2f4e75dddc7da271c8d2853b5c46261047"
    assert R["BASE_PROTOCOL_SHA"] == "cbc6caf883289c11dad76dd5fec3df941c440b02e4e3b2d774e44492663e9e0c"


@pytest.mark.parametrize("defect", [None, "C", "E", "bytes", "stage-time", "chain-time"])
def test_continuation_keeps_combined_resource_limits(monkeypatch, tmp_path, defect):
    runner = R["Runner"](tmp_path, {}, "dt49-tail", 2248., 876., 166*1024**2)
    monkeypatch.setattr(R["time"], "perf_counter", lambda: runner.started+1.)
    monkeypatch.setattr(R["shutil"], "disk_usage", lambda path: SimpleNamespace(free=(
        R["RUN"]["E_RESERVE"]+64*1024**2-(1 if defect == "E" else 0) if Path(path) == R["ROOT"]
        else R["RUN"]["C_RESERVE"]-(1 if defect == "C" else 0))))
    if defect == "bytes":
        runner.prior_stage_bytes = 321*1024**2
    elif defect == "stage-time":
        runner.prior_stage_seconds = 2999.
    elif defect == "chain-time":
        runner.prior_seconds = 7199.
    if defect is None:
        assert runner.budget() == 600.
    else:
        with pytest.raises(ValueError):
            runner.budget()

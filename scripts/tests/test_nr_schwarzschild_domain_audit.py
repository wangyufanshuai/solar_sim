"""Structural negative tests for the read-only full audit; synthetic only."""
from copy import deepcopy
from pathlib import Path
import runpy

import pytest

A = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-schwarzschild-domain-matrix.py"))
FIX = runpy.run_path(str(Path(__file__).with_name("test_nr_schwarzschild_domain_matrix.py")))


def pair():
    final = FIX["fixture"]()
    final["time_samples"] = [dict(s, retained=True) for s in final["time_samples"]]
    old = deepcopy(final)
    old["time_samples"] = old["time_samples"][:2]
    old["time_controls"] = old["time_controls"][:2]
    for s in A["D"]["all_samples"](old):
        s["retained"] = False
    return old, final


def test_matrix_contains_exactly_31_declared_physical_identities():
    matrix = A["expected_matrix"]()
    assert len(matrix) == 31
    assert sum(k[4] == 1./512 for k in matrix) == 4
    assert sum(k[5] == 0. for k in matrix) == 3
    assert (4, 49, .5, 3.5, 1./512, .75) in matrix
    assert all(k[0] == 4 and k[2:4] == (.5, 3.5) for k in matrix)


def test_retained_numerical_data_is_preserved_despite_provenance_flag_change():
    old, final = pair()
    A["verify_retained_samples"](old, final)


def final_header():
    value = {"schema": A["F"]["SCHEMA"], "stage": "replay", "stage_completed": True,
        "study_completed": True, "stage_passed": False, "study_passed": False, "errors": [],
        "retained_window_passed": False, "resource_predecessor": str(A["F"]["STOPPED"]),
        "resource_predecessor_sha256": A["F"]["STOPPED_SHA"],
        "base_protocol_sha256": A["F"]["BASE_PROTOCOL_SHA"],
        "protocol_sha256": A["sha256"](A["F"]["PROTOCOL"]),
        "commands": [{"label": "expanded-n25-serial-t1", "returncode": 0}]}
    value.update({key: False for key in A["FLAGS"]})
    return value


def test_completed_but_scientifically_failed_final_header_is_auditable():
    A["validate_final"](final_header())


@pytest.mark.parametrize("defect", ["schema", "stage", "stage_completed", "study_completed", "errors",
    "promotion", "retained_window_passed", "resource_predecessor", "resource_predecessor_sha256",
    "base_protocol_sha256", "protocol_sha256", "stage_passed", "command-count", "command-label", "command-return"])
def test_partial_promoted_or_drifted_final_header_is_rejected(defect):
    value = final_header()
    if defect in ("schema", "stage", "resource_predecessor", "resource_predecessor_sha256",
                  "base_protocol_sha256", "protocol_sha256"):
        value[defect] = "changed"
    elif defect in ("stage_completed", "study_completed"):
        value[defect] = False
    elif defect in ("retained_window_passed", "stage_passed"):
        value[defect] = True
    elif defect == "errors":
        value["errors"] = ["unresolved execution failure"]
    elif defect == "promotion":
        value["physical_validation"] = True
    elif defect == "command-count":
        value["commands"] *= 2
    elif defect == "command-label":
        value["commands"][0]["label"] = "wrong replay"
    else:
        value["commands"][0]["returncode"] = 2
    with pytest.raises(ValueError):
        A["validate_final"](value)


@pytest.mark.parametrize("defect", ["missing", "duplicate", "path", "value", "added-time", "region", "spatial", "time"])
def test_replacing_or_regrading_retained_data_is_rejected(defect):
    old, final = pair()
    if defect == "missing":
        final["time_samples"].pop()
    elif defect == "duplicate":
        final["time_samples"][-1]["path"] = final["time_samples"][0]["path"]
    elif defect == "path":
        final["study_cases"][0]["initial"]["path"] = "replacement"
    elif defect == "value":
        final["study_cases"][0]["samples"][0]["bounded_window"] = False
    elif defect == "added-time":
        final["time_samples"][-1]["diagnostics"]["time"] = 2.
    elif defect == "region":
        final["region_comparisons"][0]["metrics"]["H"]["rms_difference"] = 99.
    elif defect == "spatial":
        final["spatial_assessment"]["region_difference_spatial_passed"] = False
    else:
        final["time_controls"][0]["passed"] = False
    with pytest.raises(ValueError):
        A["verify_retained_samples"](old, final)


def test_independent_spatial_formulas_preserve_measurable_failure():
    value = FIX["fixture"]()
    value["region_comparisons"][-1]["metrics"]["H"]["rms_difference"] = 1.
    value["spatial_assessment"] = A["D"]["assess_spatial"](value)
    expected = A["recompute_groups"](value)
    assert expected["expanded_spatial_passed"]
    assert not expected["region_difference_spatial_passed"]
    assert sum(not g["passed"] for g in expected["region_difference_groups"]) == 1


@pytest.mark.parametrize("mutation", ["order", "floor", "passed", "status"])
def test_corrupt_spatial_decision_is_rejected(mutation):
    value = FIX["fixture"]()
    group = value["spatial_assessment"]["expanded_groups"][0]
    if mutation == "order":
        group["orders"][0] = 100.
    elif mutation == "floor":
        group["floor"] = 1.
    elif mutation == "passed":
        group["passed"] = False
    else:
        group["status"] = "bounded-null"
    with pytest.raises(ValueError):
        A["recompute_groups"](value)


@pytest.mark.parametrize("defect", [None, "missing-prior", "duplicate-cost", "stage-cap", "chain-cap", "reserve", "nan"])
def test_resource_accounting_includes_the_retained_stopped_execution(defect):
    old = {"seconds": 876., "study_chain_seconds": 2248.}
    common = {"c_reserve_bytes": A["RUN"]["C_RESERVE"], "e_reserve_bytes": A["RUN"]["E_RESERVE"]}
    tail = {**common, "seconds": 900., "prior_stage_seconds": 876., "stage_combined_seconds": 1776., "study_chain_seconds": 3148.}
    final = {**common, "seconds": 20., "prior_stage_seconds": 0., "stage_combined_seconds": 20., "study_chain_seconds": 3168.}
    if defect == "missing-prior":
        tail["prior_stage_seconds"] = 0.
    elif defect == "duplicate-cost":
        final["study_chain_seconds"] += 900.
    elif defect == "stage-cap":
        tail["stage_combined_seconds"] = 3000.
    elif defect == "chain-cap":
        final["study_chain_seconds"] = 7200.
    elif defect == "reserve":
        final["e_reserve_bytes"] -= 1
    elif defect == "nan":
        tail["seconds"] = float("nan")
    if defect is None:
        A["verify_resource_accounting"](old, tail, final)
    else:
        with pytest.raises(ValueError):
            A["verify_resource_accounting"](old, tail, final)

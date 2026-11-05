"""Whole-entry controls; synthetic registration is never new scientific evidence."""

from __future__ import annotations

import copy
import os
from pathlib import Path
import runpy
import sys
import xml.etree.ElementTree as ET

import numpy as np
import pytest

from science.numerical_relativity import native_campaign as N
from science.numerical_relativity import native_continuation as C
from science.numerical_relativity import native_continuation_campaign as F
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.nr3d import Grid3D

A = runpy.run_path(str(N.ROOT / "scripts/audit-nr-k3-native-gauge-continuation.py"))
P = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-projected-rk.py"))
RUN = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-native-gauge-continuation.py"))


@pytest.fixture(scope="session")
def registration_fixture():
    directory = (
        Path(os.environ["NR_CONTINUATION_ENTRY_TEST_ROOT"]).resolve()
        / "registration-only"
    )
    budget = N.Budget(directory, seconds=600, cap=32 * 1024**2, headroom=2 * 1024**2)
    component = F.component_qualification()
    parent_check = C.verify_parent("gauge-pulse-v2")
    sources = F.source_closure()
    tests = dict(mode="registration-fixture-not-qualified")
    plan, binding, initial, reference = F.prepare(sources, component, tests)
    global_sha = F.save_registration(budget, plan, binding, initial, reference, sources)
    data = dict(
        schema="nr-native-gauge-continuation-v1",
        completed=False,
        errors=["explicit registration-only fixture"],
        fixture_kind="registration-only-no-evolution",
        source_before=sources,
        source_after=sources,
        cases=copy.deepcopy(plan["case_matrix"]),
        component_qualification=component,
        entry_qualification=tests,
        parent_check=parent_check,
        parent_dependencies=plan["parent_dependencies"],
        parent_self_contained=False,
        native_identity=plan["native_identity"],
        resource_caps=F.CAPS,
        worst_case_bytes=plan["worst_case_bytes"],
        snapshot_completed=True,
        global_plan="global-plan.json",
        global_plan_sha256=global_sha,
        temporal_screen=None,
        temporal_screen_passed=False,
        counts=F.counts(plan["case_matrix"]),
        seconds=0.0,
        **F.FALSE_FLAGS,
    )
    data["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): N.sha(p)
        for p in directory.rglob("*")
        if p.is_file()
    }
    budget.record("receipt.json", data)
    checked = A["audit"](directory / "receipt.json", allow_registration_fixture=True)
    parent_budget = N.Budget(
        directory.parent, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2
    )
    parent_budget.record("registration-fixture-audit.json", checked)
    return directory, data, plan, binding, initial, reference, checked


def test_whole_registration_audit_has_zero_new_steps_and_no_admission(
    registration_fixture,
):
    checked = registration_fixture[-1]
    assert checked["audit_completed"] and checked["registration_fixture"]
    assert (
        checked["additional_scientific_steps"]
        == checked["additional_native_steps"]
        == checked["additional_rhs_stages_audited"]
        == 0
    )
    assert (
        not checked["physical_experiment_completed"]
        and not checked["entry_test_gate_revalidated"]
    )
    assert all(checked[key] is False for key in F.FALSE_FLAGS)


def test_fixture_cannot_pass_default_scientific_audit(registration_fixture):
    with pytest.raises(ValueError, match="fixture"):
        A["audit"](registration_fixture[0] / "receipt.json")


MUTATIONS = (
    "physical",
    "live",
    "writeback",
    "seconds",
    "bytes",
    "origin",
    "resume",
    "end",
    "dt",
    "label",
    "start-step",
    "parent-dependency",
    "parent-receipt",
    "test-proof",
    "empty-sources",
    "omitted-source",
    "source-alias",
    "source-hash",
    "registered-missing",
    "counts",
    "completion",
    "screen",
    "snapshot",
    "fixture-evolution",
    "self-contained",
)


@pytest.mark.parametrize("mutation", MUTATIONS)
def test_whole_audit_rejects_coherently_rehashed_bad_envelopes(
    registration_fixture, monkeypatch, mutation
):
    directory, saved, original, *_ = registration_fixture
    data, plan = copy.deepcopy(saved), copy.deepcopy(original)
    registered = copy.deepcopy(plan["case_matrix"])
    if mutation in ("physical", "live", "writeback"):
        plan[
            {
                "physical": "physical_gate",
                "live": "live_admission",
                "writeback": "scientificPayloadWriteback",
            }[mutation]
        ] = True
    elif mutation in ("seconds", "bytes"):
        data["resource_caps"][
            "seconds" if mutation == "seconds" else "output_bytes"
        ] += 1
    elif mutation in ("origin", "resume", "end"):
        plan[mutation + "_time"] += 1 / 16
    elif mutation == "dt":
        plan["case_matrix"][0]["dt"] *= 2
    elif mutation == "label":
        plan["case_matrix"][0]["label"] = "wrong-case"
    elif mutation == "start-step":
        plan["case_matrix"][0]["start_step"] = 0
    elif mutation == "parent-dependency":
        data["parent_dependencies"].pop(next(iter(data["parent_dependencies"])))
    elif mutation == "parent-receipt":
        plan["parent_receipt_sha256"] = "0" * 64
    elif mutation == "test-proof":
        plan["entry_qualification"] = dict(mode="qualified-without-tests")
    elif mutation in ("empty-sources", "omitted-source", "source-alias", "source-hash"):
        table = data["source_before"]
        if mutation == "empty-sources":
            table.clear()
        elif mutation == "omitted-source":
            table.pop(next(iter(table)))
        elif mutation == "source-alias":
            name = next(iter(table))
            table[name.replace("/", "\\")] = table[name]
        else:
            table[next(iter(table))] = "0" * 64
        data["source_after"] = copy.deepcopy(table)
        plan["source_sha256"] = N.codec.sha(N.json_bytes(table))
    elif mutation == "registered-missing":
        registered.pop()
    elif mutation == "counts":
        data["counts"]["additional_accepted_steps"] = 49
    elif mutation == "completion":
        data["completed"] = True
    elif mutation == "screen":
        data["temporal_screen"] = {"passed": True}
    elif mutation == "snapshot":
        data["snapshot_completed"] = False
    elif mutation == "fixture-evolution":
        data["cases"][0]["additional_accepted_steps"] = 1
    else:
        data["parent_self_contained"] = True
    overrides = {
        directory / "global-plan.json": N.json_bytes(plan),
        directory / "registered-cases.json": N.json_bytes(registered),
    }
    for path, raw in overrides.items():
        data["artifact_hashes"][path.name] = N.codec.sha(raw)
    data["global_plan_sha256"] = N.codec.sha(overrides[directory / "global-plan.json"])
    overrides[directory / "receipt.json"] = N.json_bytes(data)
    old_bytes, old_text = Path.read_bytes, Path.read_text
    monkeypatch.setattr(
        Path, "read_bytes", lambda p: overrides[p] if p in overrides else old_bytes(p)
    )
    monkeypatch.setattr(
        Path,
        "read_text",
        lambda p, *a, **kw: overrides[p].decode()
        if p in overrides
        else old_text(p, *a, **kw),
    )
    with pytest.raises(ValueError):
        A["audit"](directory / "receipt.json", allow_registration_fixture=True)


def temporal_rows():
    return [
        dict(
            completed=True,
            additional_accepted_steps=s,
            total_accepted_step=2 * s,
            dt=1 / (16 * s),
            trajectory=[dict(point=2 * s, time=1 / 8)],
        )
        for s in (7, 14, 28)
    ]


def screen(arrays, rows):
    driver = NonlinearSBPCube(
        Grid3D(
            (13,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
        )
    )
    return F.temporal_screen(arrays, rows, driver, P["R"])


@pytest.mark.parametrize(
    "amplitude,ratio,status",
    [(1e-7, 16.0, "passed"), (1e-14, 16.0, "unresolved"), (1e-7, 2.0, "failed")],
)
def test_synthetic_temporal_algebra_preserves_floor_order_and_absolute_clock(
    amplitude, ratio, status
):
    arrays = [np.zeros((58, 13, 13, 13)) for _ in range(3)]
    for i, q in enumerate(arrays):
        q[17] = amplitude / ratio**i
    actual = screen(arrays, temporal_rows())
    expected = A["temporal"](arrays)
    A["A"]["INITIAL"]["compare_screen"](actual, expected)
    assert (
        actual["status"] == status
        and actual["time"] == 1 / 8
        and actual["resume_time"] == 1 / 16
    )
    assert all(actual[key] is False for key in F.FALSE_FLAGS)


@pytest.mark.parametrize(
    "mutation",
    ["array-count", "nonfinite", "partial", "time", "count", "point", "dt", "total"],
)
def test_temporal_screen_requires_three_complete_equal_absolute_times(mutation):
    arrays, rows = [np.zeros((58, 13, 13, 13)) for _ in range(3)], temporal_rows()
    if mutation == "array-count":
        arrays.pop()
    elif mutation == "nonfinite":
        arrays[0][0, 0, 0, 0] = np.nan
    elif mutation == "partial":
        rows[0]["completed"] = False
    elif mutation == "time":
        rows[0]["trajectory"][-1]["time"] = 1 / 16
    elif mutation == "count":
        rows[0]["additional_accepted_steps"] = 14
    elif mutation == "point":
        rows[0]["trajectory"][-1]["point"] = 7
    elif mutation == "dt":
        rows[0]["dt"] *= 2
    else:
        rows[0]["total_accepted_step"] = 7
    with pytest.raises(ValueError):
        screen(arrays, rows)


@pytest.mark.parametrize(
    "mutation",
    ["good", "duplicate", "missing", "module", "skipped", "failure", "error"],
)
def test_test_xml_verifier_does_not_accept_partial_or_skipped_suites(
    tmp_path, mutation
):
    root = ET.Element("testsuite")
    for name in ("first", "second"):
        ET.SubElement(root, "testcase", name=name, classname="unit_control")
    if mutation == "duplicate":
        root[1].set("name", "first")
    elif mutation == "missing":
        root.remove(root[1])
    elif mutation == "module":
        root[0].set("classname", "wrong")
    elif mutation != "good":
        ET.SubElement(root[0], mutation)
    path = tmp_path / "synthetic-unit-control.xml"
    path.write_bytes(ET.tostring(root))
    if mutation == "good":
        F.check_xml(path, 2, "unit_control")
    else:
        with pytest.raises(ValueError):
            F.check_xml(path, 2, "unit_control")


def test_orchestration_stops_after_first_failure_without_adding_parent_steps(
    monkeypatch,
):
    result = dict(cases=F.registration(), global_plan_sha256="0" * 64)
    invoked = []

    def fail(budget, row, *args):
        invoked.append(row["label"])
        row.update(
            additional_accepted_steps=1,
            additional_native_published_steps=2,
            total_accepted_step=8,
            total_native_published_step=9,
        )
        raise ValueError("synthetic entry failure, no native invocation")

    monkeypatch.setattr(C, "run_case", fail)
    with pytest.raises(ValueError, match="synthetic entry failure"):
        F.evolve_cases(None, result, None, None, None)
    assert (
        len(invoked) == 1
        and result["counts"]["additional_accepted_steps"] == 1
        and result["counts"]["combined_accepted_steps"] == 50
    )
    assert all(r["status"] == "not-attempted" for r in result["cases"][1:])


@pytest.mark.parametrize("mutation", ["gate", "receipt", "xml", "artifact", "source"])
def test_component_qualification_rejects_drift(monkeypatch, mutation):
    target = {
        "gate": F.COMPONENT / "qualification-gate.json",
        "receipt": F.COMPONENT / "control-receipt.json",
        "xml": F.COMPONENT / "tests.xml",
        "artifact": F.COMPONENT / "pytest.log",
        "source": N.ROOT / "science/numerical_relativity/native_continuation.py",
    }[mutation]
    original = N.sha
    monkeypatch.setattr(
        N, "sha", lambda path: "0" * 64 if Path(path) == target else original(path)
    )
    with pytest.raises(ValueError):
        F.component_qualification()


@pytest.mark.parametrize("accepted", [(0, 0, 0), (7, 1, 0), (7, 14, 28)])
def test_counts_keep_inherited_and_added_work_separate(accepted):
    rows = [
        dict(additional_accepted_steps=n, additional_native_published_steps=n)
        for n in accepted
    ]
    result = F.counts(rows)
    assert result["inherited_accepted_steps"] == 49
    assert result["additional_accepted_steps"] == sum(accepted)
    assert result["combined_accepted_steps"] == 49 + sum(accepted)


def test_actual_source_and_parent_snapshots_fit_registered_allowances():
    sources, dependencies = F.source_closure(), F.dependencies()
    assert sum((N.ROOT / n).stat().st_size for n in sources) <= 4 * 1024**2
    assert sum((N.ROOT / n).stat().st_size for n in dependencies) <= 32 * 1024**2
    assert C.prospective_bytes() == 848056576 < F.CAPS["output_bytes"]


def test_exact_three_parent_endpoints_register_unchanged_steps():
    rows = F.registration()
    assert [r["start_step"] for r in rows] == [7, 14, 28]
    assert [r["end_step"] for r in rows] == [14, 28, 56]
    assert all(
        r["resume_time"] == 1 / 16 and r["end_time"] == 1 / 8 and not r["completed"]
        for r in rows
    )


def test_registration_never_overwrites_previous_plan(registration_fixture):
    directory, data, plan, binding, initial, reference, _ = registration_fixture
    old = (directory / "global-plan.json").read_bytes()
    budget = N.Budget(directory, seconds=30, cap=32 * 1024**2, headroom=2 * 1024**2)
    with pytest.raises(FileExistsError):
        F.save_registration(
            budget, plan, binding, initial, reference, data["source_before"]
        )
    assert (directory / "global-plan.json").read_bytes() == old


def test_scientific_cli_requires_human_confirmation_before_any_work(
    tmp_path, monkeypatch
):
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "run",
            "--output-directory",
            str(tmp_path / "not-created"),
            "--entry-test-gate",
            str(tmp_path / "none"),
        ],
    )
    with pytest.raises(ValueError, match="confirmation"):
        RUN["main"]()
    assert not (tmp_path / "not-created").exists()


def test_component_test_gate_is_not_a_full_entry_test_gate():
    with pytest.raises(ValueError):
        F.entry_qualification(F.COMPONENT / "qualification-gate.json")


def test_entry_test_gate_path_cannot_escape_local_evidence(tmp_path):
    with pytest.raises(ValueError):
        F.entry_qualification(tmp_path / "qualification-gate.json")

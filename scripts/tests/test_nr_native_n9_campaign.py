"""N9 entry controls; short native controls are not the scientific matrix."""

from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import runpy
import sys
from types import SimpleNamespace

import numpy as np
import pytest

from science.numerical_relativity import native_campaign as N
from science.numerical_relativity import native_n9_campaign as S
from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.nr3d import Grid3D

A = runpy.run_path(str(N.ROOT / "scripts/audit-nr-k3-native-n9-gauge-pulse.py"))
MEASURE = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-projected-rk.py"))
RUN = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-native-n9-gauge-pulse.py"))


@pytest.fixture(scope="session", autouse=True)
def controls():
    root = Path(os.environ["NR_N9_ENTRY_TEST_ROOT"]).resolve()
    assert root.parent == N.EVIDENCE and root.is_dir()
    budget = N.Budget(root, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    observations = dict(
        registration_fixture_audited=False,
        pulse_accepted_steps=0,
        pulse_rhs_stages_audited=0,
        failure_accepted_steps=0,
        failure_native_published_steps=0,
        full_scientific_matrix_executed=False,
        **S.FALSE_FLAGS,
    )
    yield root, budget, observations
    budget.record("control-observations.json", observations, finalizing=True)


@pytest.fixture(scope="session")
def registration_fixture(controls):
    root, parent_budget, observed = controls
    directory = root / "registration-only"
    budget = N.Budget(directory, seconds=600, cap=16 * 1024**2, headroom=2 * 1024**2)
    sources = S.source_closure()
    plan, binding, initial, reference = S.prepare(
        sources, dict(mode="registration-fixture-not-qualified")
    )
    data = S.new_receipt(plan, sources, fixture=True)
    S.save_registration(budget, plan, binding, initial, reference, sources)
    data.update(
        snapshot_completed=True,
        source_after=sources,
        errors=["explicit registration-only fixture"],
        seconds=0.0,
    )
    data["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): N.sha(p)
        for p in directory.rglob("*")
        if p.is_file()
    }
    budget.record("receipt.json", data)
    checked = A["audit"](
        directory / "receipt.json",
        allow_registration_fixture=True,
        guard=parent_budget.guard,
    )
    parent_budget.record("registration-fixture-audit.json", checked)
    observed["registration_fixture_audited"] = True
    return directory, data, plan, binding, initial, reference, checked


def test_whole_registration_fixture_is_complete_but_not_science(registration_fixture):
    checked = registration_fixture[-1]
    assert checked["audit_completed"] and checked["registration_fixture"]
    assert checked["scientific_steps_audited"] == checked["rhs_stages_audited"] == 0
    assert (
        not checked["physical_experiment_completed"]
        and not checked["entry_test_gate_revalidated"]
    )
    assert all(checked[k] is False for k in S.FALSE_FLAGS)


def test_fixture_is_rejected_by_default_scientific_auditor(registration_fixture):
    with pytest.raises(ValueError, match="fixture"):
        A["audit"](registration_fixture[0] / "receipt.json")


MUTATIONS = (
    "physical",
    "live",
    "writeback",
    "caps",
    "dt",
    "final-time",
    "origin",
    "n",
    "label",
    "counts",
    "counts-bool",
    "source-empty",
    "source-omit",
    "source-hash",
    "registered-missing",
    "snapshot",
    "test-proof",
    "complete",
    "screen",
    "fixture-evolution",
)


@pytest.mark.parametrize("mutation", MUTATIONS)
def test_whole_audit_rejects_coherently_rehashed_bad_contracts(
    registration_fixture, monkeypatch, mutation
):
    directory, saved, original, *_ = registration_fixture
    data, plan = copy.deepcopy(saved), copy.deepcopy(original)
    registered = copy.deepcopy(plan["case_matrix"])
    if mutation in ("physical", "live", "writeback"):
        key = {
            "physical": "physical_gate",
            "live": "live_admission",
            "writeback": "scientificPayloadWriteback",
        }[mutation]
        data[key] = plan[key] = True
    elif mutation == "caps":
        data["resource_caps"]["output_bytes"] += 1
        plan["resource_caps"]["output_bytes"] += 1
    elif mutation in ("dt", "n", "label"):
        key, value = {
            "dt": ("dt", 1 / 56),
            "n": ("n", 13),
            "label": ("label", "unregistered"),
        }[mutation]
        for target in (data["cases"], plan["case_matrix"], registered):
            target[0][key] = value
    elif mutation == "final-time":
        plan["end_time"] = 1 / 16
    elif mutation == "origin":
        plan["origin_time"] = 1 / 16
    elif mutation == "counts":
        data["counts"]["accepted_steps"] = 98
    elif mutation == "counts-bool":
        data["counts"]["accepted_steps"] = False
    elif mutation.startswith("source-"):
        sources = data["source_before"]
        if mutation == "source-empty":
            sources.clear()
        elif mutation == "source-omit":
            sources.pop(next(iter(sources)))
        else:
            sources[next(iter(sources))] = "0" * 64
        data["source_after"] = copy.deepcopy(sources)
        plan["source_sha256"] = N.codec.sha(N.json_bytes(sources))
    elif mutation == "registered-missing":
        registered.pop()
    elif mutation == "snapshot":
        data["snapshot_completed"] = False
    elif mutation == "test-proof":
        data["entry_qualification"] = plan["entry_qualification"] = dict(
            mode="pretend-qualified"
        )
    elif mutation == "complete":
        data["completed"] = True
    elif mutation == "screen":
        data["temporal_screen"] = dict(passed=True)
    else:
        data["cases"][0]["accepted_steps"] = 1
        data["cases"][0]["native_published_steps"] = 1
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


def driver():
    return NonlinearSBPCube(
        Grid3D((9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4)
    )


@pytest.mark.parametrize("power", (2, 4, 6))
@pytest.mark.parametrize("scale", (1e-3, 1e-15))
def test_independent_temporal_screen_manufactured_orders_and_floor(power, scale):
    # Synthetic norm algebra only; not a solution of the field equations.
    arrays = [np.full((58, 9, 9, 9), scale / k**power) for k in (1, 2, 4)]
    reported = S.temporal_screen(arrays, driver(), MEASURE["R"])
    independent = A["temporal"](arrays)
    A["OLD"]["INITIAL"]["compare_screen"](reported, independent)
    expected = "unresolved" if scale == 1e-15 else "passed" if power == 4 else "failed"
    assert reported["status"] == expected
    assert reported["time"] == 0.125 and reported["steps"] == [14, 28, 56]
    assert reported["floor"] == 2e-13


def test_one_unresolved_edge_region_cannot_be_hidden_by_other_regions():
    indices = np.indices((9,) * 3)
    boundary_count = sum(((i == 0) | (i == 8)).astype(int) for i in indices)
    arrays = [np.full((58, 9, 9, 9), 1e-3 / k**4) for k in (1, 2, 4)]
    for q in arrays:
        q[:, boundary_count == 2] = 0
    result = S.temporal_screen(arrays, driver(), MEASURE["R"])
    assert (
        result["status"] == "unresolved"
        and result["regions"]["edges"]["observed_order"] is None
    )
    assert all(
        result["regions"][r]["passed"]
        for r in ("whole", "central_box", "faces", "corners")
    )


@pytest.mark.parametrize("kind", ("physical", "reference", "pulse", "nan"))
def test_independent_initial_oracle_rejects_changed_problem(kind):
    q, reference = initial_slots(9)
    if kind == "physical":
        q[17, 4, 4, 4] += 1e-3
    elif kind == "reference":
        reference[6, 4, 4, 4] += 1e-3
    elif kind == "pulse":
        q[6, 4, 4, 4] += 1e-3
    else:
        q[6, 4, 4, 4] = np.nan
    with pytest.raises(ValueError):
        A["check_initial"](q, reference)


@pytest.mark.parametrize(
    "kind",
    (
        "missing",
        "duplicate",
        "n",
        "dt",
        "label",
        "bool",
        "negative",
        "skipped-first",
        "after-failure",
    ),
)
def test_terminal_receipt_state_machine_rejects_invalid_matrix(kind):
    rows = S.registered_cases()
    if kind == "missing":
        rows.pop()
    elif kind == "duplicate":
        rows[1] = copy.deepcopy(rows[0])
    elif kind in ("n", "dt", "label"):
        rows[0][kind] = {"n": 13, "dt": 1 / 56, "label": "other"}[kind]
    elif kind == "bool":
        rows[0]["accepted_steps"] = False
    elif kind == "negative":
        rows[0]["accepted_steps"] = -1
    else:
        if kind == "after-failure":
            rows[0].update(status="batch-aborted", failure="injected")
        index = 1
        rows[index].update(
            status="completed",
            completed=True,
            accepted_steps=rows[index]["steps"],
            native_published_steps=rows[index]["steps"],
        )
    with pytest.raises(ValueError):
        S.validate_cases(rows)


@pytest.mark.parametrize("failed_index", (0, 1, 2))
def test_orchestration_stops_at_first_error_and_never_retries(
    monkeypatch, failed_index
):
    cases = S.registered_cases()
    result = dict(
        fixture_kind=None,
        snapshot_completed=True,
        cases=cases,
        global_plan_sha256="f" * 64,
    )
    calls = []

    def fake_run(_budget, row, *_args):
        index = len(calls)
        calls.append(row["label"])
        if index == failed_index:
            row.update(native_published_steps=2, accepted_steps=1)
            raise ValueError("injected-accepted-prefix")
        row.update(
            status="completed",
            completed=True,
            accepted_steps=row["steps"],
            native_published_steps=row["steps"],
        )
        return np.zeros(1)

    monkeypatch.setattr(N, "run_case", fake_run)
    with pytest.raises(ValueError, match="injected"):
        S.evolve_cases(
            SimpleNamespace(guard=lambda: None), result, None, None, None, None, None
        )
    S.validate_cases(cases)
    assert len(calls) == failed_index + 1
    assert (
        cases[failed_index]["accepted_steps"] == 1
        and cases[failed_index]["native_published_steps"] == 2
    )
    assert all(row["status"] == "not-attempted" for row in cases[failed_index + 1 :])


def test_scientific_cli_refuses_absent_confirmation_before_any_output(monkeypatch):
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "runner",
            "--output-directory",
            str(N.EVIDENCE / "not-created"),
            "--entry-test-gate",
            "not-read.json",
        ],
    )

    def forbidden(*args, **kwargs):
        raise AssertionError("must reject before checking or creating artifacts")

    monkeypatch.setattr(S, "entry_qualification", forbidden)
    with pytest.raises(ValueError, match="confirmation"):
        RUN["main"]()


@pytest.fixture(scope="session")
def real_pulse(controls):
    root, parent_budget, observed = controls
    directory = root / "native-short-controls"
    budget = N.Budget(directory, seconds=600, cap=48 * 1024**2, headroom=2 * 1024**2)
    _identity, binding, _ = N.native_identity()
    q, reference = initial_slots(9)
    d = driver()
    row = dict(
        label="control-n9-pulse-three-steps", n=9, steps=3, dt=1 / 112, completed=False
    )
    global_sha = N.codec.sha(b"short-control-not-scientific-N9-matrix")
    endpoint = N.run_case(
        budget,
        row,
        d.volume.grid,
        q,
        reference,
        binding,
        global_sha,
        lambda value: MEASURE["measured"](d, value, reference),
    )
    audit = A["OLD"]["audit_case"](directory, row, q, reference, binding, global_sha)
    assert A["check_ledger"](directory, row) == 5
    budget.record(
        "pulse-control.json",
        dict(
            case=row,
            audit=audit,
            fixture_only=True,
            full_scientific_matrix_executed=False,
        ),
    )
    parent_budget.guard()
    observed.update(
        pulse_accepted_steps=audit["accepted_steps"],
        pulse_rhs_stages_audited=audit["rhs_stages_audited"],
    )
    return budget, binding, q, reference, d, row, global_sha, endpoint


def test_real_n9_pulse_crosses_segment_boundary_with_audited_stages(real_pulse):
    _budget, _binding, q, _reference, _driver, row, _sha, endpoint = real_pulse
    assert (
        row["completed"] and row["accepted_steps"] == row["native_published_steps"] == 3
    )
    assert [s["steps"] for s in row["segments"]] == [2, 1]
    assert row["segments"][1]["predecessor"]["point"] == 2
    assert np.max(abs(endpoint - q)) > 1e-9


@pytest.mark.parametrize("kind", ("terminal", "command", "journal"))
def test_persisted_ledger_cannot_disagree_with_receipt(real_pulse, monkeypatch, kind):
    budget, *_prefix, row, _sha, _endpoint = real_pulse
    segment = row["segments"][0]
    stem = budget.directory / Path(segment["plan"]).parent
    filename = {
        "terminal": "checkpoint-0.terminal.json",
        "command": "checkpoint-0.attempt.json",
        "journal": "point-0001.json",
    }[kind]
    path = stem / filename
    changed = json.loads(path.read_text())
    if kind == "terminal":
        changed["returncode"] = 1
    elif kind == "command":
        changed["command"][-1] = "2"
    else:
        changed["time"] = 0
    old = Path.read_text
    monkeypatch.setattr(
        Path,
        "read_text",
        lambda p, *a, **kw: json.dumps(changed) if p == path else old(p, *a, **kw),
    )
    with pytest.raises(ValueError, match="differs"):
        A["check_ledger"](budget.directory, row)


def test_real_diagnostic_failure_preserves_two_published_but_only_one_accepted(
    real_pulse, controls
):
    budget, binding, q, reference, d, *_ = real_pulse
    row = dict(
        label="control-n9-pulse-failure", n=9, steps=2, dt=1 / 112, completed=False
    )
    calls = 0

    def measure(value):
        nonlocal calls
        calls += 1
        if calls == 3:
            raise ValueError("explicit N9 diagnostic failure")
        return MEASURE["measured"](d, value, reference)

    with pytest.raises(ValueError, match="diagnostic failure"):
        N.run_case(budget, row, d.volume.grid, q, reference, binding, "b" * 64, measure)
    row.update(status="batch-aborted", failure="explicit N9 diagnostic failure")
    checked = A["OLD"]["audit_case"](
        budget.directory, row, q, reference, binding, "b" * 64
    )
    assert checked["accepted_steps"] == 1 and checked["native_published_steps"] == 2
    assert A["check_ledger"](budget.directory, row) == 3
    budget.record(
        "failure-control.json",
        dict(
            case=row,
            audit=checked,
            fixture_only=True,
            full_scientific_matrix_executed=False,
        ),
    )
    controls[2].update(failure_accepted_steps=1, failure_native_published_steps=2)


def test_fixture_registration_is_not_a_qualified_entry_gate(registration_fixture):
    with pytest.raises(ValueError, match="local entry gate"):
        S.entry_qualification(registration_fixture[0] / "receipt.json")


@pytest.mark.parametrize("kind", ("wrong-grid", "nonfinite"))
def test_temporal_screen_rejects_wrong_or_nonfinite_data(kind):
    arrays = [np.zeros((58, 9, 9, 9)) for _ in range(3)]
    if kind == "wrong-grid":
        arrays[0] = np.zeros((58, 13, 13, 13))
    else:
        arrays[0][0, 0, 0, 0] = np.nan
    for call in (
        lambda: S.temporal_screen(arrays, driver(), MEASURE["R"]),
        lambda: A["temporal"](arrays),
    ):
        with pytest.raises(ValueError):
            call()


@pytest.mark.parametrize(
    "kind",
    ("schema", "completed", "passed", "returncode", "errors", "tests", "physical"),
)
def test_qualification_rejects_bad_gate_before_trusting_artifacts(
    registration_fixture, monkeypatch, kind
):
    sources = registration_fixture[1]["source_before"]
    gate = dict(
        schema="nr-native-n9-entry-controls-v1",
        completed=True,
        passed=True,
        returncode=0,
        errors=[],
        source_before=sources,
        source_after=sources,
        tests=S.EXPECTED_TESTS,
        preflight_gate_sha256=S.PREFLIGHT_SHA,
        registration_fixture_audited=True,
        real_pulse_multisegment_audited=True,
        real_failure_prefix_audited=True,
        full_scientific_matrix_executed=False,
        **S.FALSE_FLAGS,
    )
    key, value = {
        "schema": ("schema", "wrong"),
        "completed": ("completed", False),
        "passed": ("passed", False),
        "returncode": ("returncode", 1),
        "errors": ("errors", ["injected"]),
        "tests": ("tests", 1),
        "physical": ("physical_gate", True),
    }[kind]
    gate[key] = value
    path = N.EVIDENCE / "synthetic-gate-never-written" / "qualification-gate.json"
    old = Path.read_text
    monkeypatch.setattr(
        Path,
        "read_text",
        lambda p, *a, **kw: json.dumps(gate) if p == path else old(p, *a, **kw),
    )
    monkeypatch.setattr(S, "source_closure", lambda: sources)
    with pytest.raises(ValueError):
        S.entry_qualification(path)

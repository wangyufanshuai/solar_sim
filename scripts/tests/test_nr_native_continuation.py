"""Actual small native continuation plus negative provenance/clock controls."""

from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import runpy
import time
from types import SimpleNamespace
import zlib

import numpy as np
import pytest

from science.numerical_relativity import native_campaign as N
from science.numerical_relativity import native_continuation as C
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.nr3d import Grid3D

P = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-projected-rk.py"))
A = runpy.run_path(str(N.ROOT / "scripts/audit-nr-k3-native-continuation.py"))
CASE = "schwarzschild9-five-step-control"


@pytest.fixture(scope="session", autouse=True)
def qualification():
    require_root = os.environ.get("NR_CONTINUATION_TEST_ROOT")
    if not require_root:
        pytest.fail(
            "explicit fresh bounded control launcher required; never silently skip"
        )
    directory = Path(require_root).resolve()
    assert directory.parent == N.EVIDENCE and directory.is_dir()
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    scientific_parent = C.verify_parent("gauge-pulse-v2")
    control_parent = C.verify_parent("control-v6")
    identity, binding, _ = N.native_identity()
    inherited = json.loads(
        (C.SCIENTIFIC_DIRECTORY / "receipt.json").read_text(encoding="utf-8")
    )["source_after"]
    sources = N.merge_source_tables(
        inherited, {name: N.sha(N.ROOT / name) for name in C.CONTROL_SOURCES}
    )
    result = dict(
        schema="nr-native-continuation-controls-v1",
        source_before=sources,
        source_after={},
        native_identity=identity,
        parent_checks=[scientific_parent, control_parent],
        real_even_continuation=False,
        real_odd_continuation=False,
        real_failure_prefix=False,
        full_scientific_campaign_executed=False,
        **C.FLAGS,
    )
    budget.record("identity-before.json", result)
    N.save_source_snapshot(budget, sources)
    started = time.monotonic()
    try:
        yield budget, binding, result
    finally:
        result["source_after"] = {name: N.sha(N.ROOT / name) for name in sources}
        result["native_unchanged"] = N.native_identity()[0] == identity
        result["parent_unchanged"] = (
            N.sha(C.CONTROL_DIRECTORY / "receipt.json") == C.CONTROL_SHA
            and N.sha(C.SCIENTIFIC_DIRECTORY / "receipt.json") == C.SCIENTIFIC_SHA
            and N.sha(C.SCIENTIFIC_AUDIT) == C.SCIENTIFIC_AUDIT_SHA
        )
        result["seconds"] = time.monotonic() - started
        budget.record("control-receipt.json", result, finalizing=True)
    assert (
        result["source_after"] == sources
        and result["native_unchanged"]
        and result["parent_unchanged"]
    )
    budget.guard()


def saved_blocks(directory, row):
    blocks = {}
    for segment in row["segments"]:
        raw = A["A"]["expand"](
            (directory / segment["trace"]).read_bytes(), segment["trace_bytes"]
        )
        header, payload = raw.split(b"\n", 1)
        meta = json.loads(header)
        values = np.frombuffer(payload, dtype="<f8").reshape(
            (segment["steps"], 9, 58, 9, 9, 9)
        )
        for offset, block in enumerate(values):
            blocks[segment["start"] + offset] = block.copy(), meta["trace"][offset]
    return blocks


@pytest.fixture(scope="session")
def real_cases(qualification):
    budget, binding, result = qualification
    reference = analytic_slots(9, 4)
    driver = NonlinearSBPCube(
        Grid3D((9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4)
    )
    parent = json.loads(
        (C.CONTROL_DIRECTORY / "five-step-control.json").read_text(encoding="utf-8")
    )["case"]
    old_blocks = saved_blocks(C.CONTROL_DIRECTORY, parent)
    rows = {}
    for start in (2, 3):
        link = C.anchor_link("control-v6", CASE, start)
        row = C.registered_case(f"resume-{start}-to-5", link, 5 - start)
        global_sha = N.codec.sha(
            N.json_bytes(
                dict(case=row, fixture="continuation-control-not-physical-campaign")
            )
        )
        budget.record(row["label"] + "/registered.json", row)
        endpoint = C.run_case(
            budget,
            row,
            reference,
            binding,
            global_sha,
            lambda q: P["measured"](driver, q, reference),
        )
        checked = A["audit_case"](budget.directory, row, reference, binding, global_sha)
        actual_blocks = saved_blocks(budget.directory, row)
        assert set(actual_blocks) == set(range(start, 5))
        for index, (block, report) in actual_blocks.items():
            old, old_report = old_blocks[index]
            assert block.tobytes() == old.tobytes() and report == old_report
        assert endpoint.tobytes() == old_blocks[4][0][8].tobytes()
        assert (
            checked["additional_accepted_steps"] == 5 - start
            and checked["total_accepted_step"] == 5
        )
        budget.record(
            row["label"] + "/result.json",
            dict(
                case=row,
                independent_audit=checked,
                reference_blocks_byte_exact=True,
                all_absolute_stage_reports_equal=True,
                **C.FLAGS,
            ),
        )
        rows[start] = row, global_sha
        result["real_even_continuation" if start == 2 else "real_odd_continuation"] = (
            True
        )
    return budget, binding, reference, rows


def test_even_and_odd_resume_preserve_all_raw_stages_without_restarting_clock(
    real_cases,
):
    _, _, _, rows = real_cases
    assert [s["start"] for s in rows[2][0]["segments"]] == [2, 4]
    assert [s["start"] for s in rows[3][0]["segments"]] == [3]
    assert rows[2][0]["trajectory"][0]["time"] == 2 / 1024
    assert rows[3][0]["trajectory"][0]["time"] == 3 / 1024
    assert (
        rows[3][0]["segments"][0]["plan_sha256"] != rows[3][0]["parent"]["plan_sha256"]
    )


@pytest.mark.parametrize(
    "mutation",
    [
        "receipt",
        "checkpoint",
        "state",
        "plan",
        "case",
        "point",
        "time",
        "dt",
        "grid",
        "method",
        "physical",
        "live",
        "writeback",
    ],
)
def test_forged_parent_anchor_rejected_by_runner_and_independent_audit(
    qualification, mutation
):
    _, binding, _ = qualification
    link = C.anchor_link("control-v6", CASE, 3)
    key = dict(
        receipt="receipt_sha256",
        checkpoint="checkpoint_sha256",
        state="state_sha256",
        plan="plan_sha256",
        grid="n",
        physical="physical_gate",
        live="live_admission",
        writeback="scientificPayloadWriteback",
    ).get(mutation, mutation)
    if key.endswith("sha256"):
        link[key] = "0" * 64
    elif key in C.FLAGS:
        link[key] = True
    elif key == "point":
        link[key] = 2
    elif key == "time":
        link[key] = 0.0
    elif key == "dt":
        link[key] *= 2
    elif key == "n":
        link[key] = 13
    else:
        link[key] = "not-the-parent"
    reference = analytic_slots(9, 4)
    with pytest.raises(ValueError):
        C.read_anchor(link, binding, reference)
    with pytest.raises(ValueError):
        A["audit_anchor"](link, binding, reference)


@pytest.mark.parametrize(
    "mutation",
    [
        "start",
        "resume-time",
        "end",
        "new-count",
        "total-count",
        "published",
        "missing-segment",
        "predecessor",
        "stage-hash",
        "point-time",
        "completion",
        "physical",
        "live",
        "writeback",
    ],
)
def test_saved_nonzero_chain_rejects_false_or_relabelled_prefixes(real_cases, mutation):
    budget, binding, reference, rows = real_cases
    row, global_sha = rows[2]
    changed = copy.deepcopy(row)
    if mutation == "start":
        changed["start_step"] = 0
    elif mutation == "resume-time":
        changed["resume_time"] = 0.0
    elif mutation == "end":
        changed["end_step"] += 1
    elif mutation == "new-count":
        changed["additional_accepted_steps"] += 2
    elif mutation == "total-count":
        changed["total_accepted_step"] += 2
    elif mutation == "published":
        changed["additional_native_published_steps"] -= 1
    elif mutation == "missing-segment":
        changed["segments"].pop()
    elif mutation == "predecessor":
        changed["segments"][0]["predecessor"] = None
    elif mutation == "stage-hash":
        changed["segments"][0]["trace_sha256"] = "0" * 64
    elif mutation == "point-time":
        changed["trajectory"][1]["time"] = 0.0
    elif mutation == "completion":
        changed["additional_steps"] += 2
        changed["end_step"] += 2
        changed["end_time"] += 2 * changed["dt"]
    else:
        changed[
            {
                "physical": "physical_gate",
                "live": "live_admission",
                "writeback": "scientificPayloadWriteback",
            }[mutation]
        ] = True
    with pytest.raises(ValueError):
        A["audit_case"](
            budget.directory, changed, reference, binding, global_sha, diagnostics=False
        )


@pytest.mark.parametrize(
    "mutation", ["step", "tick", "state", "rhs", "coefficient", "cfl", "faces"]
)
def test_coherently_rehashed_raw_trace_mutations_are_rejected(
    real_cases, monkeypatch, mutation
):
    budget, binding, reference, rows = real_cases
    original, global_sha = rows[3]
    row = copy.deepcopy(original)
    segment = row["segments"][0]
    path = budget.directory / segment["trace"]
    raw = A["A"]["expand"](path.read_bytes(), segment["trace_bytes"])
    header, payload = raw.split(b"\n", 1)
    meta = json.loads(header)
    blocks = np.frombuffer(payload, dtype="<f8").reshape((2, 9, 58, 9, 9, 9)).copy()
    if mutation == "step":
        meta["trace"][0]["step"] = 0
    elif mutation == "tick":
        meta["trace"][0]["stages"][1]["boundary_tick"] = 1
    elif mutation == "state":
        blocks[0, 2, 17, 4, 4, 4] += 1e-4
    elif mutation == "rhs":
        blocks[0, 1, 17, 4, 4, 4] += 1e-4
    elif mutation == "coefficient":
        meta["trace"][0]["stages"][0]["coefficients_sha256"] = "0" * 64
    elif mutation == "cfl":
        meta["trace"][0]["stages"][0]["cfl"] *= 2
    else:
        meta["trace"][0]["stages"][0]["faces"].reverse()
    changed = N.json_bytes(meta) + blocks.tobytes()
    segment["trace_bytes"], segment["trace_sha256"] = len(changed), N.codec.sha(changed)
    old_read = Path.read_bytes
    monkeypatch.setattr(
        Path,
        "read_bytes",
        lambda p: zlib.compress(changed) if p == path else old_read(p),
    )
    with pytest.raises(ValueError):
        A["audit_case"](
            budget.directory, row, reference, binding, global_sha, diagnostics=False
        )


def test_actual_diagnostic_failure_retains_only_additional_accepted_prefix(
    qualification,
):
    budget, binding, result = qualification
    reference = analytic_slots(9, 4)
    driver = NonlinearSBPCube(
        Grid3D((9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4)
    )
    row = C.registered_case(
        "resume-2-injected-failure", C.anchor_link("control-v6", CASE, 2), 2
    )
    budget.record(row["label"] + "/registered.json", row)
    calls = 0

    def measure(q):
        nonlocal calls
        calls += 1
        if calls == 3:
            raise ValueError("explicit continuation diagnostic failure")
        return P["measured"](driver, q, reference)

    with pytest.raises(ValueError, match="explicit continuation diagnostic failure"):
        C.run_case(budget, row, reference, binding, "f" * 64, measure)
    assert (
        row["additional_native_published_steps"] == 2
        and row["additional_accepted_steps"] == 1
    )
    assert row["total_native_published_step"] == 4 and row["total_accepted_step"] == 3
    assert not row["completed"] and row["status"] == "batch-aborted"
    checked = A["audit_case"](budget.directory, row, reference, binding, "f" * 64)
    assert (
        checked["rhs_stages_audited"] == 8 and checked["additional_accepted_steps"] == 1
    )
    budget.record(
        "diagnostic-failure-result.json", dict(case=row, independent_audit=checked)
    )
    result["real_failure_prefix"] = True


@pytest.mark.parametrize(
    "mutation", ["source", "missing-artifact", "corrupt-artifact", "unfinished-parent"]
)
def test_parent_qualification_rejects_corruption_without_changing_old_files(
    monkeypatch, mutation
):
    original = N.sha
    if mutation == "source":
        target = N.ROOT / "scripts/audit-nr-k3-native-gauge-pulse.py"
    elif mutation == "unfinished-parent":
        target = C.CONTROL_DIRECTORY / "receipt.json"
    else:
        target = C.CONTROL_DIRECTORY / "five-step-control.json"

    def changed(path):
        if Path(path) == target:
            if mutation == "missing-artifact":
                raise FileNotFoundError("injected missing parent artifact")
            return "0" * 64
        return original(path)

    monkeypatch.setattr(N, "sha", changed)
    with pytest.raises((ValueError, FileNotFoundError)):
        C.verify_parent("control-v6")


def test_reference_interior_is_bound_not_only_its_boundary_faces(qualification):
    _, binding, _ = qualification
    link = C.anchor_link("control-v6", CASE, 2)
    changed = analytic_slots(9, 4)
    changed[17, 4, 4, 4] += 1e-6
    with pytest.raises(ValueError, match="reference"):
        C.read_anchor(link, binding, changed)
    with pytest.raises(ValueError, match="reference"):
        A["audit_anchor"](link, binding, changed)


@pytest.mark.parametrize("kind", ["C", "E", "cap", "time"])
def test_original_resource_guards_stop_new_continuation_artifacts(
    tmp_path, monkeypatch, kind
):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    if kind in ("C", "E"):
        monkeypatch.setattr(
            N.shutil,
            "disk_usage",
            lambda path: SimpleNamespace(
                free=(
                    N.C_RESERVE - 1
                    if str(path) == "C:/" and kind == "C"
                    else N.E_RESERVE - 1
                    if str(path) != "C:/" and kind == "E"
                    else 100 * 1024**3
                )
            ),
        )
    elif kind == "cap":
        budget.cap = 65536
    else:
        budget.deadline = time.monotonic() - 1
    with pytest.raises(N.ResourceLimit):
        budget.save("forbidden.bin", b"not written")
    assert not (tmp_path / "forbidden.bin").exists()


@pytest.mark.parametrize("steps", [0, -1, 29, True, 1.5])
def test_invalid_additional_interval_rejected(steps):
    with pytest.raises(ValueError):
        C.registered_case("invalid", C.anchor_link("control-v6", CASE, 2), steps)


def test_existing_artifact_is_never_replaced(tmp_path):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    budget.save("immutable.bin", b"original")
    with pytest.raises(FileExistsError):
        budget.save("immutable.bin", b"overwrite")
    assert (tmp_path / "immutable.bin").read_bytes() == b"original"


def test_candidate_full_child_bound_does_not_expand_parent_budget():
    assert C.prospective_bytes() == 848056576 < N.OUTPUT_CAP == 832 * 1024**2
    assert (
        N.SECONDS == 2400
        and N.C_RESERVE == 3 * 1024**3
        and N.E_RESERVE == 4 * 1024**3 + 32 * 1024**2
    )
    # This is only arithmetic for a later runner, not its full-entry qualification.

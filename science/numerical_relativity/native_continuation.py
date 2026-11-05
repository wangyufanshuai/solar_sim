"""Nonzero-time continuation of qualified native checkpoints, shadow only.

This is an additive orchestration component, not a changed Einstein RHS. It
starts a NEW local plan from a verified accepted parent state. It never asks a
finished plan to advance outside its registered range and never resets time.
There is deliberately no full-scientific-campaign command in this component.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import runpy
import zlib

import numpy as np

from . import native_campaign as N
from .fo_ccz4_schwarzschild import analytic_slots
from .nr3d import Grid3D

require = N.require
CONTROL_DIRECTORY = N.EVIDENCE / "nr-k3-native-campaign-tests-v6-20261010"
CONTROL_SHA = "d9978b2bde802d96281a971a0e831a38555ef1851da270d9644abaf468c9142a"
CONTROL_XML = N.ROOT / "tmp/nr-native-campaign-tests-v6-20261010.xml"
CONTROL_XML_SHA = "fb37550a182c1440f1a406eab2332f076d59f9874a4de26cd88cdc32fe684e04"
SCIENTIFIC_DIRECTORY = N.EVIDENCE / "nr-k3-native-gauge-pulse-v2-20261010"
SCIENTIFIC_SHA = "6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341"
SCIENTIFIC_AUDIT = N.EVIDENCE / "nr-k3-native-gauge-pulse-v2-audit-20261010.json"
SCIENTIFIC_AUDIT_SHA = (
    "35cc5a9beb5aa2f219099339941c38f7f3ff26fb584694bd158f11eb21a07537"
)
FLAGS = dict(
    physical_gate=False, live_admission=False, scientificPayloadWriteback=False
)
PARENT_ALLOWANCE = 32 * 1024**2
CONTROL_SOURCES = (
    "science/numerical_relativity/native_continuation.py",
    "science/numerical_relativity/EXPERIMENT-20261010-native-continuation-controls.md",
    "scripts/audit-nr-k3-native-continuation.py",
    "scripts/run-nr-k3-native-continuation-controls.py",
    "scripts/nr-native-continuation-tests.ini",
    "scripts/tests/test_nr_native_continuation.py",
)


def _artifact(directory, table, name):
    path = N.contained(directory, name)
    require(
        name in table and N.sha(path) == table[name], "parent artifact changed: " + name
    )
    return path


def _parent(kind):
    """Read pinned metadata, not user-supplied arbitrary checkpoint provenance."""
    require(kind in ("control-v6", "gauge-pulse-v2"), "registered parent kind required")
    directory, digest = (
        (CONTROL_DIRECTORY, CONTROL_SHA)
        if kind == "control-v6"
        else (SCIENTIFIC_DIRECTORY, SCIENTIFIC_SHA)
    )
    receipt = directory / "receipt.json"
    require(N.sha(receipt) == digest, "pinned parent receipt changed")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    require(
        data["source_before"] == data["source_after"],
        "parent source identity incomplete",
    )
    for name in ("physical_gate", "scientificPayloadWriteback"):
        require(data.get(name) is False, "parent admission changed")
    if kind == "control-v6":
        require(
            data["schema"] == "nr-native-campaign-tests-v1"
            and data.get("native_unchanged") is True
            and data.get("real_native_multisegment") is True,
            "completed control parent required",
        )
        require(N.sha(CONTROL_XML) == CONTROL_XML_SHA, "parent test XML changed")
        saved = _artifact(directory, data["artifact_hashes"], "five-step-control.json")
        control = json.loads(saved.read_text(encoding="utf-8"))
        rows = [control["case"]]
        require(
            control["independent_audit"]["accepted_steps"] == 5,
            "parent control audit incomplete",
        )
    else:
        require(
            data["schema"] == "nr-native-gauge-pulse-v1"
            and data.get("completed") is True
            and not data["errors"]
            and data.get("live_admission") is False,
            "completed unadmitted scientific parent required",
        )
        require(
            N.sha(SCIENTIFIC_AUDIT) == SCIENTIFIC_AUDIT_SHA,
            "pinned parent audit changed",
        )
        audit = json.loads(SCIENTIFIC_AUDIT.read_text(encoding="utf-8"))
        require(
            audit["receipt_sha256"] == digest
            and audit["audit_completed"] is True
            and audit["physical_experiment_completed"] is True,
            "parent saved audit incomplete",
        )
        rows = data["cases"]
    require(
        all(
            row["completed"] is True
            and row["status"] == "completed"
            and row["accepted_steps"] == row["native_published_steps"] == row["steps"]
            and len(row["trajectory"]) == row["steps"] + 1
            for row in rows
        ),
        "complete accepted parent trajectories required",
    )
    return directory, digest, data, rows


def verify_parent(kind):
    """Read-only whole-parent/source/binary qualification; zero new evolution."""
    directory, digest, data, rows = _parent(kind)
    files = {
        p.relative_to(directory).as_posix()
        for p in directory.rglob("*")
        if p.is_file() and p != directory / "receipt.json"
    }
    require(files == set(data["artifact_hashes"]), "complete parent inventory required")
    for name in data["artifact_hashes"]:
        _artifact(directory, data["artifact_hashes"], name)
    identity, binding, _ = N.native_identity()
    require(identity == data["native_identity"], "parent native identity changed")
    for name, value in data["source_after"].items():
        require(
            N.sha(N.contained(N.ROOT, name)) == value, "parent source drift: " + name
        )
    runner = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-native-gauge-pulse.py"))
    tests = runner["verify_tests"](CONTROL_XML, CONTROL_DIRECTORY / "receipt.json")
    require(tests["tests"] == 208, "complete inherited v6 controls required")
    if kind == "gauge-pulse-v2":
        require(tests == data["tests"], "parent test provenance changed")
    return dict(
        kind=kind,
        receipt_sha256=digest,
        artifacts_checked=len(files),
        inherited_tests=tests["tests"],
        inherited_source_count=len(data["source_after"]),
        native_identity=identity,
        cases=[r["label"] for r in rows],
        new_evolution=False,
        **FLAGS,
    )


def anchor_link(kind, case, step):
    directory, digest, data, rows = _parent(kind)
    matches = [row for row in rows if row["label"] == case]
    require(
        len(matches) == 1 and type(step) is int,
        "unique parent case and integer step required",
    )
    row = matches[0]
    require(0 < step <= row["accepted_steps"], "accepted positive parent step required")
    if kind == "gauge-pulse-v2":
        require(
            step == row["steps"],
            "scientific continuation starts at the verified final endpoint",
        )
    point = row["trajectory"][step]
    require(
        point["point"] == step and point["time"] == step * row["dt"],
        "parent time mismatch",
    )
    path = _artifact(directory, data["artifact_hashes"], point["checkpoint"])
    return dict(
        schema="nr-native-parent-anchor-v1",
        kind=kind,
        receipt=(directory / "receipt.json").relative_to(N.ROOT).as_posix(),
        receipt_sha256=digest,
        case=case,
        n=row["n"],
        point=step,
        time=step * row["dt"],
        dt=row["dt"],
        checkpoint=path.relative_to(N.ROOT).as_posix(),
        checkpoint_sha256=point["checkpoint_sha256"],
        state_sha256=point["state_sha256"],
        plan_sha256=point["segment_plan_sha256"],
        method=N.codec.METHOD,
        **FLAGS,
    )


def read_anchor(link, binding, reference):
    """Reject forged metadata even if a caller also changes its local plan hash."""
    require(
        link == anchor_link(link["kind"], link["case"], link["point"]),
        "parent anchor identity mismatch",
    )
    directory, _, data, rows = _parent(link["kind"])
    if link["kind"] == "control-v6":
        expected_reference = analytic_slots(9, 4)
        require(
            N.codec.sha(expected_reference.tobytes())
            == rows[0]["trajectory"][0]["state_sha256"],
            "control analytic reference drift",
        )
    else:
        expected_reference = np.load(
            _artifact(directory, data["artifact_hashes"], "reference.npy"),
            allow_pickle=False,
        )
    require(
        reference.dtype == np.float64
        and reference.tobytes() == expected_reference.tobytes(),
        "complete parent reference state changed",
    )
    raw = N.contained(N.ROOT, link["checkpoint"]).read_bytes()
    require(
        N.codec.sha(raw) == link["checkpoint_sha256"], "parent checkpoint SHA mismatch"
    )
    point = N.codec.decode(raw, binding, link["plan_sha256"])
    plan = point["plan"]
    require(
        point["state_sha256"] == link["state_sha256"]
        and point["step"] == link["point"]
        and plan["dt"] == link["dt"]
        and point["step"] * plan["dt"] == link["time"],
        "parent checkpoint state/time mismatch",
    )
    require(
        (plan["shape"], plan["lower"], plan["upper"])
        == ((link["n"],) * 3, (1.0,) * 3, (3.0,) * 3)
        and reference.shape == (58, *plan["shape"]),
        "parent geometry mismatch",
    )
    expected_faces = N.targets(reference)
    for faces in plan["targets"]:
        require(
            all(
                a.tobytes() == b.tobytes()
                for a, b in zip(faces, expected_faces, strict=True)
            ),
            "parent analytic boundary changed",
        )
    return point


def registered_case(label, link, additional_steps):
    require(
        isinstance(label, str)
        and re.fullmatch(r"[a-z0-9][a-z0-9-]{0,95}", label) is not None,
        "plain bounded case label required",
    )
    require(
        type(additional_steps) is int and 1 <= additional_steps <= 28,
        "bounded positive additional steps required",
    )
    require(
        link == anchor_link(link["kind"], link["case"], link["point"]),
        "verified anchor required",
    )
    start, dt = link["point"], link["dt"]
    return dict(
        label=label,
        n=link["n"],
        dt=dt,
        start_step=start,
        additional_steps=additional_steps,
        end_step=start + additional_steps,
        origin_time=0.0,
        resume_time=start * dt,
        end_time=(start + additional_steps) * dt,
        parent=link.copy(),
        completed=False,
        status="not-attempted",
        additional_accepted_steps=0,
        additional_native_published_steps=0,
        total_accepted_step=start,
        total_native_published_step=start,
        segments=[],
        trajectory=[],
        **FLAGS,
    )


def validate_case(row):
    expected = registered_case(row["label"], row["parent"], row["additional_steps"])
    for key in (
        "n",
        "dt",
        "start_step",
        "additional_steps",
        "end_step",
        "origin_time",
        "resume_time",
        "end_time",
    ):
        require(
            row.get(key) == expected[key], "continuation case contract changed: " + key
        )
    for key in FLAGS:
        require(row.get(key) is False, "continuation admission must remain false")
    return expected


def run_case(budget, row, reference, binding, global_sha, measure):
    """Publish additional endpoints separately from inherited accepted history."""
    validate_case(row)
    require(
        row["status"] == "not-attempted"
        and not row["completed"]
        and not row["segments"]
        and not row["trajectory"]
        and row["additional_accepted_steps"]
        == row["additional_native_published_steps"]
        == 0,
        "fresh registered continuation case required",
    )
    require(
        row["total_accepted_step"]
        == row["total_native_published_step"]
        == row["start_step"],
        "fresh continuation must retain exactly the inherited prefix",
    )
    require(
        isinstance(global_sha, str) and re.fullmatch("[0-9a-f]{64}", global_sha),
        "global plan SHA required",
    )
    budget.guard()
    anchor = read_anchor(row["parent"], binding, reference)
    q = anchor["q"].copy()
    mesh = Grid3D(
        (row["n"],) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    boundary = N.targets(reference)
    predecessor = dict(parent=row["parent"].copy())
    start_step, end_step, dt = row["start_step"], row["end_step"], row["dt"]
    row.update(status="running", phase="resume-diagnostics", attempted_step=start_step)
    try:
        row["trajectory"].append(
            dict(
                point=start_step,
                time=start_step * dt,
                state_sha256=anchor["state_sha256"],
                parent=row["parent"].copy(),
                **measure(q),
            )
        )
        for start in range(start_step, end_step, 2):
            length = min(2, end_step - start)
            stem = f"{row['label']}/segment-{start:04d}"
            record = dict(
                start=start,
                steps=length,
                dt=dt,
                global_plan_sha256=global_sha,
                predecessor=predecessor,
                initial_state_sha256=N.codec.sha(q.tobytes()),
                status="attempted",
                native_points=[],
                points=[],
            )
            row["segments"].append(record)
            row.update(phase="segment-plan", attempted_step=start)
            raw = N.local_plan(mesh, q, boundary, start, length, dt)
            plan_sha = N.codec.sha(raw)
            record.update(plan=stem + "/plan.bin", plan_sha256=plan_sha)
            budget.record(stem + "/segment-attempt.json", record)
            budget.save(record["plan"], raw)
            output = N.contained(budget.directory, stem + "/checkpoints")
            output.mkdir()
            for offset in range(length):
                index = start + offset
                row.update(phase="native-checkpoint", attempted_step=index)
                input_path = (
                    N.contained(budget.directory, record["plan"])
                    if offset == 0
                    else output / f"step-{index:016d}.nrck"
                )
                command = [
                    str(N.CHECKPOINT_EXE),
                    "--lapack",
                    str(N.LIBRARY),
                    "--threads",
                    "2" if offset == 0 else "4",
                    "--plan" if offset == 0 else "--restart",
                    str(input_path),
                    "--plan-sha",
                    plan_sha,
                    "--output",
                    str(output),
                    "--advance",
                    "1",
                ]
                result = N.invoke(
                    budget,
                    stem + f"/checkpoint-{offset}",
                    command,
                    output_cap=16384,
                    prospective=len(raw) + q.nbytes + 8192,
                )
                budget.save(stem + f"/manifest-{offset}.json", result)
                manifest = json.loads(result)
                checkpoint_path = output / f"step-{index + 1:016d}.nrck"
                require(
                    Path(manifest["diagnostics"]["checkpoint_path"]).resolve()
                    == checkpoint_path,
                    "published path mismatch",
                )
                point = N.codec.decode(checkpoint_path.read_bytes(), binding, plan_sha)
                N.codec.validate_manifest(manifest, point, binding)
                require(
                    point["step"] == index + 1
                    and manifest["diagnostics"]["steps_advanced"] == 1
                    and manifest["diagnostics"]["threads_observed"]
                    == (2 if offset == 0 else 4),
                    "native continuation invocation mismatch",
                )
                name = checkpoint_path.relative_to(budget.directory).as_posix()
                record["native_points"].append(
                    dict(
                        point=index + 1,
                        checkpoint=name,
                        sha256=point["checkpoint_sha256"],
                    )
                )
                row.update(
                    additional_native_published_steps=index + 1 - start_step,
                    total_native_published_step=index + 1,
                    last_native_checkpoint=name,
                )
            row["phase"] = "native-stage-trace"
            trace = N.invoke(
                budget,
                stem + "/trace",
                [
                    str(N.RK_EXE),
                    "--lapack",
                    str(N.LIBRARY),
                    "--mode",
                    "trajectory",
                    "--threads",
                    "1",
                ],
                payload=raw,
                output_cap=length * 9 * q.nbytes + N.TRACE_HEADER_CAP,
            )
            record.update(
                trace=stem + "/trace.bin.zlib",
                trace_bytes=len(trace),
                trace_sha256=N.codec.sha(trace),
            )
            budget.save(record["trace"], zlib.compress(trace, level=6))
            meta, arrays = N.unpack_trace(trace, mesh, start, length, dt)
            for offset, endpoint_meta in enumerate(record["native_points"]):
                index = start + offset
                row.update(phase="science-endpoint-audit", attempted_step=index)
                checkpoint = N.codec.decode(
                    N.contained(
                        budget.directory, endpoint_meta["checkpoint"]
                    ).read_bytes(),
                    binding,
                    plan_sha,
                )
                N.check_step(arrays[offset], meta["trace"][offset], q, index, dt)
                require(
                    arrays[offset, 8].tobytes() == checkpoint["state_raw"],
                    "checkpoint/trace binary disagreement",
                )
                diagnostics = measure(checkpoint["q"])
                require(
                    0 <= diagnostics["algebraic_errors"]["det_h"] <= 1e-10,
                    "unchanged endpoint determinant cap",
                )
                point_record = dict(
                    point=index + 1,
                    time=(index + 1) * dt,
                    checkpoint=endpoint_meta["checkpoint"],
                    checkpoint_sha256=endpoint_meta["sha256"],
                    state_sha256=checkpoint["state_sha256"],
                    segment_plan_sha256=plan_sha,
                    global_plan_sha256=global_sha,
                    **diagnostics,
                )
                payload = N.json_bytes(point_record)
                require(
                    len(payload) <= 256 * 1024,
                    "bounded continuation point journal required",
                )
                budget.save(stem + f"/point-{index + 1:04d}.json", payload)
                record["points"].append(point_record)
                row["trajectory"].append(point_record)
                row.update(
                    additional_accepted_steps=index + 1 - start_step,
                    total_accepted_step=index + 1,
                    last_accepted_checkpoint=endpoint_meta["checkpoint"],
                )
                q = checkpoint["q"].copy()
                print(
                    json.dumps(
                        dict(
                            case=row["label"],
                            additional_accepted_steps=row["additional_accepted_steps"],
                            total_accepted_step=index + 1,
                            time=point_record["time"],
                        )
                    ),
                    flush=True,
                )
            record["status"] = "completed"
            budget.record(stem + "/segment-completed.json", record)
            predecessor = dict(
                checkpoint=record["native_points"][-1]["checkpoint"],
                sha256=record["native_points"][-1]["sha256"],
                state_sha256=N.codec.sha(q.tobytes()),
                point=start + length,
            )
            restored = N.codec.decode(
                N.contained(budget.directory, predecessor["checkpoint"]).read_bytes(),
                binding,
                plan_sha,
            )
            require(
                restored["state_raw"] == q.tobytes(),
                "persisted continuation predecessor mismatch",
            )
            q = restored["q"].copy()
    except Exception as error:
        row.update(
            status="batch-aborted",
            completed=False,
            failure=f"{type(error).__name__}: {error}",
        )
        raise
    row.update(status="completed", phase="completed", completed=True)
    return q


def prospective_bytes():
    """Candidate N13 child bound, including a distinct parent metadata allowance."""
    return N.worst_case_bytes() + PARENT_ALLOWANCE

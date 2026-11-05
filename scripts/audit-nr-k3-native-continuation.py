"""Independent nonzero-time saved-chain audit; does not execute Einstein RHS.

The inherited auditor supplies raw geometry/constraint reconstruction only. Its
zero-origin audit_case is not called, and no row is relabeled to start at zero.
This component has no full-campaign admission entry point yet.
"""

from __future__ import annotations

import json
from pathlib import Path
import runpy
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_checkpoint as codec  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots  # noqa: E402

A = runpy.run_path(str(ROOT / "scripts/audit-nr-k3-native-gauge-pulse.py"))
require, sha, path_in = codec.require, A["sha"], A["path_in"]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"


def audit_anchor(link, binding, reference):
    require(
        link.get("schema") == "nr-native-parent-anchor-v1"
        and link.get("method") == codec.METHOD,
        "registered continuation anchor required",
    )
    for key in ("physical_gate", "live_admission", "scientificPayloadWriteback"):
        require(link.get(key) is False, "anchor admission changed")
    kind = link.get("kind")
    require(kind in ("control-v6", "gauge-pulse-v2"), "known parent lineage required")
    if kind == "control-v6":
        directory = EVIDENCE / "nr-k3-native-campaign-tests-v6-20261010"
        digest = "d9978b2bde802d96281a971a0e831a38555ef1851da270d9644abaf468c9142a"
    else:
        directory = EVIDENCE / "nr-k3-native-gauge-pulse-v2-20261010"
        digest = "6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341"
    receipt = directory / "receipt.json"
    require(
        link["receipt"] == receipt.relative_to(ROOT).as_posix()
        and link["receipt_sha256"] == digest
        and sha(receipt) == digest,
        "pinned parent identity mismatch",
    )
    data = json.loads(receipt.read_text(encoding="utf-8"))
    if kind == "control-v6":
        saved = directory / "five-step-control.json"
        require(
            sha(saved) == data["artifact_hashes"][saved.name],
            "control case record changed",
        )
        row = json.loads(saved.read_text(encoding="utf-8"))["case"]
        require(
            link["case"] == row["label"] and data.get("native_unchanged") is True,
            "wrong control parent",
        )
        expected_reference = analytic_slots(9, 4)
        require(
            codec.sha(expected_reference.tobytes())
            == row["trajectory"][0]["state_sha256"],
            "control reference changed",
        )
    else:
        require(
            data.get("completed") is True and not data["errors"],
            "scientific parent incomplete",
        )
        rows = [r for r in data["cases"] if r["label"] == link["case"]]
        require(len(rows) == 1, "unique scientific parent case required")
        row = rows[0]
        require(
            link["point"] == row["steps"], "scientific parent must be final endpoint"
        )
        require(
            sha(directory / "reference.npy")
            == data["artifact_hashes"]["reference.npy"],
            "reference file changed",
        )
        expected_reference = np.load(directory / "reference.npy", allow_pickle=False)
    require(
        reference.shape == expected_reference.shape
        and reference.dtype == np.float64
        and reference.tobytes() == expected_reference.tobytes(),
        "complete parent reference mismatch",
    )
    require(
        row["completed"] is True
        and row["status"] == "completed"
        and row["accepted_steps"] == row["native_published_steps"] == row["steps"],
        "accepted parent incomplete",
    )
    start = link["point"]
    require(
        type(start) is int and 0 < start <= row["steps"],
        "valid positive parent point required",
    )
    point = row["trajectory"][start]
    require(
        (link["n"], link["dt"], link["time"], point["point"], point["time"])
        == (row["n"], row["dt"], start * row["dt"], start, start * row["dt"]),
        "parent clock mismatch",
    )
    path = path_in(directory, point["checkpoint"])
    require(
        path_in(ROOT, link["checkpoint"]) == path
        and sha(path)
        == data["artifact_hashes"][point["checkpoint"]]
        == link["checkpoint_sha256"]
        == point["checkpoint_sha256"],
        "parent checkpoint link mismatch",
    )
    require(
        link["state_sha256"] == point["state_sha256"]
        and link["plan_sha256"] == point["segment_plan_sha256"],
        "parent state/plan identity mismatch",
    )
    decoded = codec.decode(path.read_bytes(), binding, link["plan_sha256"])
    require(
        decoded["state_sha256"] == link["state_sha256"]
        and decoded["step"] == start
        and decoded["plan"]["dt"] == link["dt"],
        "parent binary state/clock mismatch",
    )
    return decoded


def audit_case(directory, row, reference, binding, global_sha, *, diagnostics=True):
    """Audit accepted/published additional prefixes without counting parent steps."""
    directory = Path(directory).resolve()
    for flag in ("physical_gate", "live_admission", "scientificPayloadWriteback"):
        require(row.get(flag) is False, "continuation admission changed")
    anchor = audit_anchor(row["parent"], binding, reference)
    n, dt, start, added = (
        row["n"],
        row["dt"],
        row["start_step"],
        row["additional_steps"],
    )
    require(
        type(added) is int and 1 <= added <= 28 and type(start) is int and start > 0,
        "bounded absolute continuation required",
    )
    require(
        (
            n,
            dt,
            start,
            row["origin_time"],
            row["resume_time"],
            row["end_time"],
            row["end_step"],
        )
        == (
            reference.shape[1],
            anchor["plan"]["dt"],
            anchor["step"],
            0.0,
            start * dt,
            (start + added) * dt,
            start + added,
        ),
        "absolute continuation time contract changed",
    )
    accepted, published = (
        row["additional_accepted_steps"],
        row["additional_native_published_steps"],
    )
    require(
        type(accepted) is int
        and type(published) is int
        and 0 <= accepted <= published <= added,
        "additional prefix counts invalid",
    )
    require(
        row["total_accepted_step"] == start + accepted
        and row["total_native_published_step"] == start + published,
        "inherited/new step counts conflated",
    )
    trajectory = row["trajectory"]
    q = anchor["q"].copy()
    maximum = raw_maximum = 0.0
    if not trajectory:
        require(
            accepted == published == 0
            and not row["segments"]
            and row["completed"] is False,
            "missing resumed trajectory",
        )
        return dict(
            additional_accepted_steps=0,
            additional_native_published_steps=0,
            total_accepted_step=start,
            rhs_stages_audited=0,
            resumed_point_audited=False,
            physical_gate=False,
        )
    require(
        len(trajectory) == accepted + 1
        and (
            trajectory[0]["point"],
            trajectory[0]["time"],
            trajectory[0]["state_sha256"],
            trajectory[0]["parent"],
        )
        == (start, start * dt, anchor["state_sha256"], row["parent"]),
        "resumed trajectory origin changed",
    )
    raw_maximum = A["audit_endpoint_state"](q, trajectory[0])
    if diagnostics:
        norms, _ = A["DIAG"]["reconstructed"](q, reference)
        maximum = A["DIAG"]["compare_norms"](norms, trajectory[0]["measurements"])
    previous = dict(parent=row["parent"].copy())
    checked = native = stages = 0
    require(len(row["segments"]) <= (added + 1) // 2, "extra continuation segments")
    for ordinal, segment in enumerate(row["segments"]):
        first, length = start + 2 * ordinal, min(2, added - 2 * ordinal)
        require(
            (
                segment["start"],
                segment["steps"],
                segment["dt"],
                segment["global_plan_sha256"],
                segment["predecessor"],
            )
            == (first, length, dt, global_sha, previous),
            "absolute segment/predecessor mismatch",
        )
        require(
            segment["initial_state_sha256"] == codec.sha(q.tobytes()),
            "persisted predecessor state mismatch",
        )
        plan_path = path_in(directory, segment["plan"]) if "plan" in segment else None
        if plan_path is None or not plan_path.is_file():
            require(
                ordinal == len(row["segments"]) - 1
                and row["completed"] is False
                and not segment["points"]
                and not segment["native_points"]
                and accepted == checked
                and published == native,
                "missing plan cannot hide accepted work",
            )
            break
        raw = plan_path.read_bytes()
        require(
            codec.sha(raw) == segment["plan_sha256"],
            "local continuation plan hash changed",
        )
        plan = codec.read_plan(raw)
        require(
            (
                plan["shape"],
                plan["lower"],
                plan["upper"],
                plan["start"],
                plan["steps"],
                plan["dt"],
            )
            == ((n,) * 3, (1.0,) * 3, (3.0,) * 3, first, length, dt),
            "nonzero local plan contract changed",
        )
        require(
            plan["initial"].tobytes() == q.tobytes(),
            "plan must start at persisted parent/child state",
        )
        for faces in plan["targets"]:
            for axis in range(3):
                for side in range(2):
                    require(
                        faces[2 * axis + side].tobytes()
                        == np.take(
                            reference, 0 if side == 0 else n - 1, axis=axis + 1
                        ).tobytes(),
                        "analytic continuation boundary changed",
                    )
        points, checkpoints = segment["native_points"], []
        require(len(points) <= length, "extra published endpoints")
        for offset, point in enumerate(points):
            path = path_in(directory, point["checkpoint"])
            require(
                point["point"] == first + offset + 1 and sha(path) == point["sha256"],
                "published point identity mismatch",
            )
            checkpoint = codec.decode(
                path.read_bytes(), binding, segment["plan_sha256"]
            )
            require(
                checkpoint["step"] == point["point"], "checkpoint absolute step changed"
            )
            manifest = json.loads(
                (plan_path.parent / f"manifest-{offset}.json").read_text(
                    encoding="utf-8"
                )
            )
            codec.validate_manifest(manifest, checkpoint, binding)
            require(
                Path(manifest["diagnostics"]["checkpoint_path"]).resolve() == path
                and manifest["diagnostics"]["steps_advanced"] == 1
                and manifest["diagnostics"]["threads_observed"]
                == (2 if offset == 0 else 4),
                "continuation invocation changed",
            )
            checkpoints.append(checkpoint)
            native += 1
        require(
            len(segment["points"]) == max(0, min(length, accepted - 2 * ordinal)),
            "additional accepted segment count changed",
        )
        if "trace" not in segment:
            require(
                not segment["points"]
                and ordinal == len(row["segments"]) - 1
                and row["completed"] is False,
                "missing accepted continuation trace",
            )
            break
        trace = A["expand"](
            path_in(directory, segment["trace"]).read_bytes(), segment["trace_bytes"]
        )
        require(
            codec.sha(trace) == segment["trace_sha256"],
            "uncompressed continuation trace hash changed",
        )
        header, payload = trace.split(b"\n", 1)
        require(len(header) <= 65536, "bounded trace header")
        meta = json.loads(header)
        require(
            meta["schema"] == "nr-native-rk4-output-v1"
            and meta["method_id"] == codec.METHOD
            and (
                meta["shape"],
                meta["lower"],
                meta["upper"],
                meta["start_step"],
                meta["steps"],
                meta["dt"],
            )
            == ([n] * 3, [1.0] * 3, [3.0] * 3, first, length, dt),
            "absolute trace contract changed",
        )
        require(
            meta["threads_observed"] == meta["blas_threads"] == 1
            and meta.get("component_only") is True
            and meta.get("native_rk4_step_supported") is True,
            "qualified trace semantics required",
        )
        for flag in (
            "physical_gate",
            "scientificPayloadWriteback",
            "algebraic_projection",
            "auxiliaries_reconstructed",
            "automatic_timestep_change",
            "native_checkpoint_supported",
        ):
            require(meta.get(flag) is False, "trace scope changed")
        require(
            len(payload) == length * 9 * 58 * n**3 * 8 == meta["values"] * 8
            and len(meta["trace"]) == len(checkpoints) == length,
            "complete raw trace/checkpoints required",
        )
        blocks = np.frombuffer(payload, dtype="<f8").reshape((length, 9, 58, n, n, n))
        require(np.isfinite(blocks).all(), "finite continuation stages required")
        for offset, block in enumerate(blocks):
            index = first + offset
            expected = (
                q,
                q + 0.5 * dt * block[1],
                q + 0.5 * dt * block[3],
                q + dt * block[5],
                q + dt * (block[1] + 2 * block[3] + 2 * block[5] + block[7]) / 6,
            )
            require(
                all(
                    a.tobytes() == b.tobytes()
                    for a, b in zip(block[[0, 2, 4, 6, 8]], expected, strict=True)
                ),
                "independent continuation RK arithmetic mismatch",
            )
            record = meta["trace"][offset]
            require(
                record["step"] == index and len(record["stages"]) == 4,
                "absolute stage step mismatch",
            )
            for s, tick in enumerate(
                (2 * index, 2 * index + 1, 2 * index + 1, 2 * index + 2)
            ):
                report = record["stages"][s]
                require(
                    report["stage"] == s + 1
                    and report["boundary_tick"] == tick
                    and report["coefficients_sha256"]
                    == codec.sha(block[2 * s, :11].tobytes()),
                    "absolute stage tick/identity changed",
                )
                require(
                    0 <= report["max_characteristic_residual"] <= 2e-11
                    and 1 <= report["max_basis_condition"] <= 1e6,
                    "original characteristic gates changed",
                )
                require(
                    0 <= report["cfl"] <= 0.25 * (1 + 1e-14)
                    and 0 < report["min_lapse"] < 2
                    and report["min_chi"] > 0
                    and 0 <= report["det_h_max_error"] <= 1e-10,
                    "original stored stage gates changed",
                )
                require(
                    [(f["axis"], f["side"]) for f in report["faces"]]
                    == [(a, b) for a in range(3) for b in range(2)],
                    "ordered six-face stage reports required",
                )
                raw_maximum = max(
                    raw_maximum, A["audit_stage_state"](block[2 * s], report, dt)
                )
            require(
                block[8].tobytes() == checkpoints[offset]["state_raw"],
                "checkpoint/trace raw disagreement",
            )
            q = block[8].copy()
            stages += 4
            relative_index = index - start
            if relative_index < accepted:
                point = trajectory[relative_index + 1]
                require(
                    point == segment["points"][offset],
                    "trajectory/segment journal mismatch",
                )
                require(
                    (
                        point["point"],
                        point["time"],
                        point["state_sha256"],
                        point["checkpoint_sha256"],
                        point["checkpoint"],
                        point["segment_plan_sha256"],
                        point["global_plan_sha256"],
                    )
                    == (
                        index + 1,
                        (index + 1) * dt,
                        codec.sha(q.tobytes()),
                        checkpoints[offset]["checkpoint_sha256"],
                        points[offset]["checkpoint"],
                        segment["plan_sha256"],
                        global_sha,
                    ),
                    "accepted absolute endpoint link mismatch",
                )
                saved_point = json.loads(
                    (plan_path.parent / f"point-{index + 1:04d}.json").read_text(
                        encoding="utf-8"
                    )
                )
                require(saved_point == point, "persisted point journal differs")
                raw_maximum = max(raw_maximum, A["audit_endpoint_state"](q, point))
                if diagnostics:
                    norms, _ = A["DIAG"]["reconstructed"](q, reference)
                    maximum = max(
                        maximum,
                        A["DIAG"]["compare_norms"](norms, point["measurements"]),
                    )
                checked += 1
        require(
            segment["status"] == "completed"
            or ordinal == len(row["segments"]) - 1
            and row["completed"] is False,
            "incomplete intermediate continuation segment",
        )
        previous = dict(
            checkpoint=points[-1]["checkpoint"],
            sha256=points[-1]["sha256"],
            state_sha256=codec.sha(q.tobytes()),
            point=first + length,
        )
    require(
        checked == accepted and native == published, "additional prefix counts disagree"
    )
    require(
        row["completed"] is False
        or row["completed"] is True
        and row["status"] == "completed"
        and accepted == added
        and all(s["status"] == "completed" for s in row["segments"]),
        "false continuation completion",
    )
    return dict(
        additional_accepted_steps=checked,
        additional_native_published_steps=native,
        total_accepted_step=start + checked,
        rhs_stages_audited=stages,
        resumed_point_audited=True,
        independent_diagnostics_max=maximum,
        independent_raw_summary_max=raw_maximum,
        raw_rk_byte_exact=True,
        rhs_recomputed=False,
        python_parity_recomputed=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )

"""Independent saved-stage/chain/constraint audit; no evolution is executed."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import runpy
import sys
import zlib

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_checkpoint as codec

DIAG = runpy.run_path(str(ROOT / "scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"))
INITIAL = runpy.run_path(str(ROOT / "scripts/audit-nr-k3-schwarzschild-gauge-pulse.py"))
require = codec.require
DIAGNOSTIC_TOLERANCE = 2e-12
PRIMARY_SHA = "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0"
EXTRA_SOURCES = ("science/numerical_relativity/EXPERIMENT-20261010-native-gauge-pulse.md",
                 "science/numerical_relativity/native_campaign.py", "scripts/run-nr-k3-native-gauge-pulse.py",
                 "scripts/audit-nr-k3-native-gauge-pulse.py", "scripts/tests/test_nr_native_campaign.py")


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def path_in(root, name):
    relative = Path(name)
    require(not relative.is_absolute() and ".." not in relative.parts, "relative contained audit path required")
    result = (root / relative).resolve()
    require(result.is_relative_to(root.resolve()), "audit path escape")
    return result


def expand(raw, size):
    require(type(size) is int and 0 < size <= 2 * 9 * 58 * 17**3 * 8 + 65536, "bounded trace size required")
    decoder = zlib.decompressobj()
    result = decoder.decompress(raw, size + 1)
    require(len(result) == size and decoder.eof and not decoder.unused_data and not decoder.unconsumed_tail, "exact compressed stream required")
    return result


def raw_geometry(q):
    """Reconstruct from canonical slots, without the production geometry helpers."""
    require(q.ndim == 4 and q.shape[0] == 58 and q.dtype == np.float64 and np.isfinite(q).all(), "finite canonical58 audit state required")
    tensors = []
    for start in (0, 11, 37, 43, 49):
        h = np.empty((*q.shape[1:], 3, 3))
        for slot, (i, j) in enumerate(((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))):
            h[..., i, j] = h[..., j, i] = q[start + slot]
        tensors.append(h)
    h = tensors[0]
    try:
        np.linalg.cholesky(h)
        with np.errstate(over="raise", invalid="raise", divide="raise"):
            determinant = np.linalg.det(h)
            inverse = np.linalg.inv(h)
            lapse, chi = np.exp(q[6]), np.exp(2 * q[10])
            traces = []
            for value in tensors[1:]:
                terms = inverse * value
                traces.append(float(np.max(abs(np.sum(terms, axis=(-2, -1))) /
                                            np.maximum(1., np.sum(abs(terms), axis=(-2, -1))))))
    except (np.linalg.LinAlgError, FloatingPointError) as error:
        raise ValueError("invalid raw audit geometry") from error
    require(all(np.isfinite(x).all() for x in (determinant, inverse, lapse, chi)) and
            np.all(determinant >= 1e-14) and np.all(lapse >= np.finfo(float).tiny) and
            np.all(chi >= np.finfo(float).tiny), "raw positive normal geometry required")
    algebraic = dict(det_h=float(np.max(abs(determinant - 1))), trace_a=traces[0], trace_D=max(traces[1:]))
    require(all(math.isfinite(x) and x >= 0 for x in algebraic.values()), "finite raw algebraic residuals required")
    return inverse, lapse, chi, algebraic


def compare_raw_summary(actual, stored):
    require(set(actual) <= set(stored), "complete raw-state summary required")
    differences = []
    for key, value in actual.items():
        saved = stored[key]
        require(type(saved) in (int, float) and math.isfinite(saved) and saved >= 0., "finite nonnegative raw summary required")
        differences.append(abs(value - saved))
    maximum = max(differences)
    require(maximum <= DIAGNOSTIC_TOLERANCE, "independent raw-state summary disagreement")
    return maximum


def audit_stage_state(q, report, dt):
    inverse, lapse, chi, algebraic = raw_geometry(q)
    require(np.all(lapse < 2.) and algebraic["det_h"] <= 1e-10, "original raw stage gauge/determinant cap exceeded")
    speeds = []
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        f, mu = 3 * lapse * chi, .2 * chi
        for axis in range(3):
            hn = inverse[..., axis, axis]
            families = (lapse * np.sqrt(chi * hn), np.sqrt(2 * lapse * chi * hn), np.sqrt(4 * f * hn / 3),
                        lapse * np.sqrt(mu * hn / 2), np.sqrt(f * hn), .5 * lapse * np.sqrt(mu * hn))
            speeds.append(float(np.max(abs(q[7 + axis]) + np.maximum.reduce(families))))
    cfl = dt * math.fsum(speeds[a] / (2 / (q.shape[a + 1] - 1)) for a in range(3))
    require(math.isfinite(cfl) and 0 < cfl <= .25 * (1 + 1e-14), "original raw stage CFL cap exceeded")
    summary = dict(cfl=cfl, min_lapse=float(np.min(lapse)), min_chi=float(np.min(chi)), det_h_max_error=algebraic["det_h"])
    return compare_raw_summary(summary, report)


def audit_endpoint_state(q, point):
    # Do not impose the stage-only lapse<2 domain on a final endpoint.
    algebraic = raw_geometry(q)[3]
    require(algebraic["det_h"] <= 1e-10, "original raw endpoint determinant cap exceeded")
    require(set(point["algebraic_errors"]) == set(algebraic), "complete endpoint algebraic summary required")
    return compare_raw_summary(algebraic, point["algebraic_errors"])


def audit_case(directory, row, initial, reference, binding, global_sha, *, diagnostics=True):
    n, dt, planned = row["n"], row["dt"], row["steps"]
    accepted = row["accepted_steps"]
    require(type(accepted) is int and 0 <= accepted <= row["native_published_steps"] <= planned, "accepted/native prefix invalid")
    require(len(row["trajectory"]) == accepted + 1, "accepted trajectory must be contiguous")
    require(row["trajectory"][0]["point"] == 0 and row["trajectory"][0]["time"] == 0 and row["trajectory"][0]["state_sha256"] == codec.sha(initial.tobytes()), "initial trajectory mismatch")
    q = initial.copy()
    previous = None
    checked = native = stages = 0
    maximum = 0.
    raw_maximum = audit_endpoint_state(q, row["trajectory"][0])
    if diagnostics:
        norms, _ = DIAG["reconstructed"](q, reference)
        maximum = DIAG["compare_norms"](norms, row["trajectory"][0]["measurements"])
    require(len(row["segments"]) <= (planned + 1) // 2, "extra segments forbidden")
    for ordinal, segment in enumerate(row["segments"]):
        start, length = 2 * ordinal, min(2, planned - 2 * ordinal)
        require((segment["start"], segment["steps"], segment["dt"], segment["global_plan_sha256"], segment["predecessor"])
                == (start, length, dt, global_sha, previous), "segment plan/predecessor identity mismatch")
        require(segment["initial_state_sha256"] == codec.sha(q.tobytes()), "cross-segment initial state mismatch")
        raw = path_in(directory, segment["plan"]).read_bytes()
        require(sha(path_in(directory, segment["plan"])) == segment["plan_sha256"], "local plan SHA mismatch")
        plan = codec.read_plan(raw)
        require((plan["shape"], plan["lower"], plan["upper"], plan["start"], plan["steps"], plan["dt"])
                == ((n,) * 3, (1.,) * 3, (3.,) * 3, start, length, dt), "local geometry/time drift")
        require(plan["initial"].tobytes() == q.tobytes(), "local plan does not start at persisted predecessor")
        for faces in plan["targets"]:
            for axis in range(3):
                for side in range(2):
                    target = np.take(reference, 0 if side == 0 else n - 1, axis=axis + 1)
                    require(faces[2 * axis + side].tobytes() == target.tobytes(), "analytic boundary target changed")
        points = segment["native_points"]
        require(len(points) <= length, "extra native points")
        checkpoints = []
        for offset, point in enumerate(points):
            name = path_in(directory, point["checkpoint"])
            require(point["point"] == start + offset + 1 and sha(name) == point["sha256"], "native prefix metadata mismatch")
            checkpoint = codec.decode(name.read_bytes(), binding, segment["plan_sha256"])
            require(checkpoint["step"] == point["point"], "native checkpoint step mismatch")
            manifest_path = path_in(directory, str(Path(segment["plan"]).parent / f"manifest-{offset}.json"))
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            codec.validate_manifest(manifest, checkpoint, binding)
            require(manifest["diagnostics"]["steps_advanced"] == 1 and manifest["diagnostics"]["threads_observed"] == (2 if offset == 0 else 4), "qualified checkpoint invocation mismatch")
            checkpoints.append(checkpoint)
            native += 1
        if "trace" not in segment:
            require(start >= accepted and ordinal == len(row["segments"]) - 1 and not row["completed"], "missing accepted trace")
            break
        trace = expand(path_in(directory, segment["trace"]).read_bytes(), segment["trace_bytes"])
        require(codec.sha(trace) == segment["trace_sha256"], "trace uncompressed SHA mismatch")
        header, payload = trace.split(b"\n", 1)
        require(len(header) <= 65536, "bounded header")
        meta = json.loads(header)
        require(meta["schema"] == "nr-native-rk4-output-v1" and meta["method_id"] == codec.METHOD and
                (meta["shape"], meta["start_step"], meta["steps"], meta["dt"]) == ([n] * 3, start, length, dt), "trace method/geometry drift")
        require(meta["lower"] == [1.] * 3 and meta["upper"] == [3.] * 3 and meta["threads_observed"] == 1 and meta["blas_threads"] == 1, "trace execution/grid mismatch")
        for key in ("physical_gate", "scientificPayloadWriteback", "algebraic_projection", "auxiliaries_reconstructed", "automatic_timestep_change", "native_checkpoint_supported"):
            require(meta.get(key) is False, "trace policy/admission changed")
        require(len(payload) == length * 9 * 58 * n**3 * 8 and len(meta["trace"]) == length and len(checkpoints) == length, "complete native trace/checkpoints required")
        arrays = np.frombuffer(payload, dtype="<f8").reshape((length, 9, 58, n, n, n))
        require(np.isfinite(arrays).all(), "finite trace required")
        require(len(segment["points"]) == max(0, min(length, accepted - start)), "scientific segment prefix mismatch")
        for offset, block in enumerate(arrays):
            index = start + offset
            require(block[0].tobytes() == q.tobytes(), "raw segment continuity mismatch")
            slopes = [block[2 * s + 1] for s in range(4)]
            expected = (q, q + .5 * dt * slopes[0], q + .5 * dt * slopes[1], q + dt * slopes[2],
                        q + dt * (slopes[0] + 2 * slopes[1] + 2 * slopes[2] + slopes[3]) / 6)
            for actual, value in zip(block[[0, 2, 4, 6, 8]], expected, strict=True):
                require(actual.tobytes() == value.tobytes(), "independent raw RK arithmetic mismatch")
            stage_meta = meta["trace"][offset]
            require(stage_meta["step"] == index and len(stage_meta["stages"]) == 4, "step metadata mismatch")
            for s, tick in enumerate((2 * index, 2 * index + 1, 2 * index + 1, 2 * index + 2)):
                r = stage_meta["stages"][s]
                require(r["stage"] == s + 1 and r["boundary_tick"] == tick and r["coefficients_sha256"] == codec.sha(block[2*s, :11].tobytes()), "stage identity mismatch")
                require(0 <= r["cfl"] <= .25 * (1 + 1e-14) and 0 < r["min_lapse"] < 2 and r["min_chi"] > 0 and
                        0 <= r["det_h_max_error"] <= 1e-10 and 0 <= r["max_characteristic_residual"] <= 2e-11 and 1 <= r["max_basis_condition"] <= 1e6, "original stage gate changed")
                raw_maximum = max(raw_maximum, audit_stage_state(block[2*s], r, dt))
            require(block[8].tobytes() == checkpoints[offset]["state_raw"], "separate native executions differ")
            q = block[8].copy()
            stages += 4
            if index < accepted:
                point = row["trajectory"][index + 1]
                require(point == segment["points"][offset], "trajectory/segment record differs")
                require((point["point"], point["time"], point["state_sha256"], point["checkpoint_sha256"], point["checkpoint"], point["segment_plan_sha256"], point["global_plan_sha256"])
                        == (index + 1, (index + 1) * dt, codec.sha(q.tobytes()), checkpoints[offset]["checkpoint_sha256"], points[offset]["checkpoint"], segment["plan_sha256"], global_sha), "accepted endpoint link mismatch")
                raw_maximum = max(raw_maximum, audit_endpoint_state(q, point))
                if diagnostics:
                    norms, _ = DIAG["reconstructed"](q, reference)
                    maximum = max(maximum, DIAG["compare_norms"](norms, point["measurements"]))
                checked += 1
        require(segment["status"] == "completed" or ordinal == len(row["segments"]) - 1 and not row["completed"], "incomplete intermediate segment")
        previous = dict(checkpoint=points[-1]["checkpoint"], sha256=points[-1]["sha256"], state_sha256=codec.sha(q.tobytes()), point=start + length)
    require(checked == accepted and native == row["native_published_steps"], "prefix counts disagree")
    require(not row["completed"] or row["status"] == "completed" and accepted == planned, "false completed case")
    return dict(accepted_steps=accepted, native_published_steps=native, rhs_stages_audited=stages,
                independent_diagnostics_max=maximum, independent_raw_summary_max=raw_maximum,
                raw_geometry_recomputed=True, raw_cfl_recomputed=True,
                raw_rk_byte_exact=True, failure_regraded=False)


def expected_sources():
    evidence = ROOT / "tmp/nr-shadow-evidence"
    checkpoint = evidence / "nr-k3-native-checkpoint-component-v2-20261010/receipt.json"
    require(sha(checkpoint) == "27cd78270b28d7f526e5bdde0b11bcfa66bebe9e4f53a0ae0c9fb8ad8b1db74e", "checkpoint ancestor changed")
    parent = json.loads(checkpoint.read_text(encoding="utf-8"))
    tables = [parent["source_after"]]
    for name, digest in parent["parent_receipts"].items():
        path = path_in(evidence, name)
        require(sha(path) == digest, "ancestor receipt changed")
        tables.append(json.loads(path.read_text(encoding="utf-8"))["source_after"])
    primary = evidence / "nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json"
    require(sha(primary) == PRIMARY_SHA, "original Python parent changed")
    tables.append(json.loads(primary.read_text(encoding="utf-8"))["source_after"])
    tables.append({name: sha(ROOT / name) for name in EXTRA_SOURCES})
    result = {}
    for table in tables:
        for name, digest in table.items():
            key = path_in(ROOT, name).relative_to(ROOT).as_posix().casefold()
            require(key not in result or result[key] == digest, "conflicting ancestor source hash")
            result[key] = digest
    return result


def audit_registration(data, plan, registered):
    for key in ("physical_gate", "live_admission", "scientificPayloadWriteback"):
        require(plan.get(key) is False, "global plan admission changed")
    require(data.get("python_parent_sha256") == PRIMARY_SHA, "wrong Python scientific parent")
    require(data.get("resource_caps") == dict(seconds=2400, output_bytes=832*1024**2, headroom=32*1024**2,
                                             c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2), "registered resource contract changed")
    required = [dict(label=f"native-gauge-pulse-13-{steps}", n=13, steps=steps, dt=1/(16*steps),
                     status="not-attempted", completed=False, accepted_steps=0, native_published_steps=0,
                     segments=[], trajectory=[]) for steps in (7, 14, 28)]
    require(registered == required, "original case preregistration changed")


def temporal(arrays):
    require(len(arrays) == 3 and all(x.shape == (58, 13, 13, 13) for x in arrays), "three final N13 states required")
    w = np.ones(13)
    w[:4] = np.array([17., 59., 43., 49.]) / 48
    w[-4:] = w[:4][::-1]
    w /= 6
    weights = w[:, None, None] * w[None, :, None] * w[None, None, :]
    indices = np.indices((13,) * 3)
    count = sum(((x == 0) | (x == 12)).astype(int) for x in indices)
    masks = dict(whole=np.ones((13,) * 3, bool), central_box=np.logical_and.reduce([(x >= 3) & (x <= 9) for x in indices]), faces=count == 1, edges=count == 2, corners=count == 3)
    result = {}
    for name, mask in masks.items():
        errors = []
        for a, b in zip(arrays[:-1], arrays[1:], strict=True):
            node = np.sum((a-b)**2, axis=0) / 58
            errors.append(math.sqrt(math.fsum((node[mask] * weights[mask]).tolist()) / math.fsum(weights[mask].tolist())))
        resolved = min(errors) > 2e-13
        order = math.log2(errors[0] / errors[1]) if resolved else None
        passed = bool(resolved and errors[0] > errors[1] and 3.5 <= order <= 4.5)
        result[name] = dict(coarse_error=errors[0], fine_error=errors[1], refinement_ratio=2., floor=2e-13, observed_order=order,
                            resolved=resolved, passed=passed, status="passed" if passed else "failed" if resolved else "unresolved",
                            minimum_difference_over_floor=min(errors) / 2e-13)
    status = "failed" if any(r["status"] == "failed" for r in result.values()) else "passed" if all(r["passed"] for r in result.values()) else "unresolved"
    return dict(regions=result, status=status, passed=status == "passed", floor=2e-13, minimum_order=3.5, maximum_order=4.5,
                time=1/16, steps=[7, 14, 28], policy="none", spatial_order_validated=False, analytic_evolution_reference=False, physical_gate=False)


def audit(path):
    directory = path.parent.resolve()
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-native-gauge-pulse-v1" and data["source_before"] == data["source_after"], "source-frozen native receipt required")
    for flag in ("physical_gate", "live_admission", "scientificPayloadWriteback", "old_python_replay_completed", "old_failure_regraded", "spatial_order_validated", "constraint_convergence_validated"):
        require(data.get(flag) is False, "unadmitted scope required")
    files = {p.relative_to(directory).as_posix() for p in directory.rglob("*") if p.is_file() and p != path}
    require(files == set(data["artifact_hashes"]), "complete artifact inventory required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(path_in(directory, name)) == digest, "artifact SHA mismatch: " + name)
    for name, digest in data["source_after"].items():
        require(sha(path_in(ROOT, name)) == digest and sha(path_in(directory / "source-snapshot", name)) == digest, "current/saved source drift")
    actual_sources = {path_in(ROOT, name).relative_to(ROOT).as_posix().casefold(): digest for name, digest in data["source_after"].items()}
    require(len(actual_sources) == len(data["source_after"]) and actual_sources == expected_sources(), "complete unique scientific source closure required")
    global_raw = path_in(directory, data["global_plan"]).read_bytes()
    require(codec.sha(global_raw) == data["global_plan_sha256"], "global plan SHA mismatch")
    plan = json.loads(global_raw)
    audit_registration(data, plan, json.loads(path_in(directory, "registered-cases.json").read_text(encoding="utf-8")))
    require(plan["schema"] == "nr-native-gauge-pulse-plan-v1" and (plan["n"], plan["lower"], plan["upper"], plan["end_time"], plan["segment_steps"])
            == (13, [1.] * 3, [3.] * 3, 1/16, 2), "fixed global physical/time matrix required")
    source_raw = (json.dumps(data["source_before"], sort_keys=True, ensure_ascii=True, allow_nan=False, separators=(",", ":")) + "\n").encode()
    require(plan["source_sha256"] == codec.sha(source_raw), "global source binding changed")
    require(plan["initial_identity"] == INITIAL["INITIAL_IDENTITY"], "fixed analytic pulse identity required")
    require(plan["native_identity"] == data["native_identity"], "native plan/receipt identity mismatch")
    identity = data["native_identity"]
    require(identity["method_id"] == codec.METHOD and identity["checkpoint_receipt_sha256"] == "27cd78270b28d7f526e5bdde0b11bcfa66bebe9e4f53a0ae0c9fb8ad8b1db74e" and
            identity["checkpoint_executable_sha256"] == "05d06d9e19146681a27e3c6b64c420c0497adf7ae720c7ecc90db2ca8f9f688a" and
            identity["trace_executable_sha256"] == "3cd7bab4373ed24631bdcd81185debb9d2ce9f96385fee2c52a1598fc8399142" and
            identity["compiled_source_sha256"] == "283c6279d4447860f4e34872bd056203ac5f9c286c532c1800360dee6f9c5af5", "qualified native identity changed")
    binding = codec.binding(identity["compiled_source_sha256"], identity["checkpoint_executable_sha256"],
                            "6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5", "95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf")
    require(path_in(directory, "binding.txt").read_bytes() == binding and identity["binding_sha256"] == codec.sha(binding), "binding artifact changed")
    initial, reference = (np.load(path_in(directory, n + ".npy"), allow_pickle=False) for n in ("initial", "reference"))
    require(codec.sha(initial.tobytes()) == plan["initial_state_sha256"] and codec.sha(reference.tobytes()) == plan["reference_state_sha256"], "global initial state binding changed")
    initial_check = INITIAL["check_initial"](initial, reference, initial-reference)
    require(len(data["cases"]) == len(plan["case_matrix"]) == 3, "three registered resolutions required")
    checked, finals = [], []
    for row, spec, steps in zip(data["cases"], plan["case_matrix"], (7, 14, 28), strict=True):
        require(spec == dict(label=f"native-gauge-pulse-13-{steps}", steps=steps, dt=1/(16*steps)) and
                (row["label"], row["n"], row["steps"], row["dt"]) == (spec["label"], 13, steps, spec["dt"]), "case matrix altered")
        if row["status"] == "not-attempted":
            require(not row["completed"] and row["accepted_steps"] == row["native_published_steps"] == 0 and not row["trajectory"] and not row["segments"], "unattempted case contains results")
            checked.append(dict(accepted_steps=0, prefix_audited=False))
            continue
        checked.append(audit_case(directory, row, initial, reference, binding, data["global_plan_sha256"]))
        if row["completed"]:
            p = row["trajectory"][-1]
            finals.append(codec.decode(path_in(directory, p["checkpoint"]).read_bytes(), binding, p["segment_plan_sha256"])["q"])
    completed = not data["errors"] and all(r["completed"] for r in data["cases"])
    require(data["completed"] is completed, "batch completion regraded")
    screen = temporal(finals) if len(finals) == 3 else None
    if screen:
        INITIAL["compare_screen"](data["temporal_screen"], screen)
    else:
        require(data["temporal_screen"] is None, "partial run cannot establish temporal order")
    require(data["temporal_screen_passed"] is bool(completed and screen and screen["passed"]), "temporal admission regraded")
    return dict(schema="nr-native-gauge-pulse-audit-v1", audit_completed=True, receipt_sha256=sha(path),
                artifacts_checked=len(files), source_keys_checked=len(data["source_after"]), cases=checked,
                initial_data=initial_check, independent_temporal_screen=screen, rhs_recomputed=False,
                native_steps_audited=sum(row.get("native_published_steps", 0) for row in checked),
                scientific_steps_audited=sum(row["accepted_steps"] for row in checked),
                physical_experiment_completed=completed, test_gate_revalidated=False,
                python_endpoint_parity_recomputed=False,
                exact_scientific_replay=False, physical_gate=False, live_admission=False, scientificPayloadWriteback=False)


def main():
    import shutil
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt, output = args.receipt.resolve(), args.output.resolve()
    evidence = ROOT / "tmp/nr-shadow-evidence"
    require(receipt.parent.parent == evidence and output.parent == evidence and not output.exists(), "bounded fresh audit output required")
    require(shutil.disk_usage("C:/").free >= 3 * 1024**3 and shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + 1024**2, "original disk reserves required")
    result = audit(receipt)
    result["auditor_sha256"] = sha(Path(__file__))
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, sort_keys=True, indent=2, allow_nan=False)
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

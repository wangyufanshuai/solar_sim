"""Evidence-preserving orchestration of qualified native executables, not new RHS.

Two-step local plans are linked under an immutable global scientific plan.
The checkpoint executable is authoritative; the older native trajectory binary
recomputes and exposes every RK stage. This duplication is intentional validation,
not a speed benchmark or an independent Einstein-equation implementation.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import zlib

import numpy as np

from . import native_checkpoint as codec

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
CHECKPOINT_RECEIPT = EVIDENCE / "nr-k3-native-checkpoint-component-v2-20261010/receipt.json"
CHECKPOINT_SHA = "27cd78270b28d7f526e5bdde0b11bcfa66bebe9e4f53a0ae0c9fb8ad8b1db74e"
CHECKPOINT_EXE = ROOT / "tmp/nr-native-checkpoint-build-v2-20261010/Release/nr-checkpoint-component.exe"
CHECKPOINT_EXE_SHA = "05d06d9e19146681a27e3c6b64c420c0497adf7ae720c7ecc90db2ca8f9f688a"
RK_EXE = ROOT / "tmp/nr-native-rk4-build-v1-20261010/Release/nr-rk4-component.exe"
RK_EXE_SHA = "3cd7bab4373ed24631bdcd81185debb9d2ce9f96385fee2c52a1598fc8399142"
LIBRARY = Path("D:/python/Lib/site-packages/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll")
OMP = Path("C:/Windows/System32/vcomp140.dll")
RUNTIMES = {LIBRARY: "6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5", OMP: "95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf"}
C_RESERVE, E_RESERVE = 3 * 1024**3, 4 * 1024**3 + 32 * 1024**2
OUTPUT_CAP, HEADROOM, SECONDS = 832 * 1024**2, 32 * 1024**2, 2400
TRACE_HEADER_CAP = 65536
require = codec.require


def sha(path):
    return codec.sha(Path(path).read_bytes())


def json_bytes(data):
    return (json.dumps(data, sort_keys=True, ensure_ascii=True, allow_nan=False, separators=(",", ":")) + "\n").encode()


def contained(root, relative):
    root, relative = Path(root).resolve(), Path(relative)
    require(not relative.is_absolute() and ".." not in relative.parts, "relative contained artifact required")
    result = (root / relative).resolve()
    require(result.is_relative_to(root), "artifact path escape")
    for path in (root, *result.parents, result):
        if path.exists():
            require(not path.is_symlink() and not path.is_junction(), "reparse artifact forbidden")
    return result


def merge_source_tables(*tables):
    """One physical source per canonical key; never overwrite conflicting hashes."""
    records = {}
    for table in tables:
        for name, digest in table.items():
            relative = Path(name)
            require(not relative.drive and all(":" not in part for part in relative.parts), "plain relative source path required")
            path = contained(ROOT, name)
            require(path.is_file(), "source file required: " + name)
            require(isinstance(digest, str) and len(digest) == 64 and all(c in "0123456789abcdef" for c in digest), "source SHA256 required")
            canonical = path.relative_to(ROOT).as_posix()
            key = canonical.casefold() if os.name == "nt" else canonical
            if key in records:
                previous, old_digest, old_path = records[key]
                require(old_digest == digest, "conflicting source identity: " + canonical)
                require(path.samefile(old_path), "ambiguous source alias: " + canonical)
                canonical = min(previous, canonical)
            records[key] = (canonical, digest, path)
    return dict(sorted((name, digest) for name, digest, _ in records.values()))


def save_source_snapshot(budget, sources):
    """Validate the entire canonical set before the first exclusive snapshot write."""
    require(sources == merge_source_tables(sources), "canonical unique source table required")
    payloads = {}
    for name, digest in sources.items():
        raw = contained(ROOT, name).read_bytes()
        require(codec.sha(raw) == digest, "source changed before snapshot: " + name)
        payloads[name] = raw
    require(sum(map(len, payloads.values())) <= 4 * 1024**2, "registered source snapshot budget exceeded")
    for name, raw in payloads.items():
        budget.save("source-snapshot/" + name, raw)


def native_identity():
    require(sha(CHECKPOINT_RECEIPT) == CHECKPOINT_SHA, "qualified checkpoint receipt drift")
    report = json.loads(CHECKPOINT_RECEIPT.read_text(encoding="utf-8"))
    tables = [report["source_after"]]
    for name, digest in report["parent_receipts"].items():
        path = contained(EVIDENCE, name)
        require(sha(path) == digest, "qualified ancestor receipt drift")
        tables.append(json.loads(path.read_text(encoding="utf-8"))["source_after"])
    sources = merge_source_tables(*tables)
    for name, digest in sources.items():
        require(sha(contained(ROOT, name)) == digest, "qualified source drift: " + name)
    for path, digest in {**RUNTIMES, CHECKPOINT_EXE: CHECKPOINT_EXE_SHA, RK_EXE: RK_EXE_SHA}.items():
        require(sha(path) == digest, "qualified binary drift: " + path.name)
    source_path = CHECKPOINT_EXE.parent.parent / "source-identity.txt"
    source_sha = sha(source_path)
    require(source_sha == "283c6279d4447860f4e34872bd056203ac5f9c286c532c1800360dee6f9c5af5", "compiled source table drift")
    binding = codec.binding(source_sha, CHECKPOINT_EXE_SHA, RUNTIMES[LIBRARY], RUNTIMES[OMP])
    identity = dict(method_id=codec.METHOD, checkpoint_executable_sha256=CHECKPOINT_EXE_SHA,
                    trace_executable_sha256=RK_EXE_SHA, checkpoint_receipt_sha256=CHECKPOINT_SHA,
                    binding_sha256=codec.sha(binding), compiled_source_sha256=source_sha,
                    runtimes={str(p): v for p, v in RUNTIMES.items()})
    return identity, binding, sources


def worst_case_bytes(n=13, cases=(7, 14, 28), source_bytes=4 * 1024**2):
    state, target = 58 * n**3 * 8, 6 * 58 * n**2 * 8
    total = 3 * (state + 512) + source_bytes + 8 * 1024**2 + HEADROOM
    for steps in cases:
        for start in range(0, steps, 2):
            length = min(2, steps - start)
            plan = state + (2 * length + 1) * target + 512 * (2 * length + 2)
            checkpoint = plan + state + 4176
            trace = length * 9 * state + TRACE_HEADER_CAP
            # Full uncompressed trace plus safe zlib overhead, step/manifest/log allowances.
            total += plan + length * checkpoint + trace + 65536 + length * (256 * 1024 + 32 * 1024)
    return total


class ResourceLimit(RuntimeError):
    pass


class Budget:
    def __init__(self, directory, seconds=SECONDS, cap=OUTPUT_CAP, headroom=HEADROOM):
        self.directory = Path(directory).resolve()
        require(self.directory.is_relative_to(ROOT / "tmp"), "E workspace evidence required")
        self.deadline, self.cap, self.headroom = time.monotonic() + seconds, cap, headroom
        require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free >= E_RESERVE + cap, "complete prospective budget plus original reserves required")

    def guard(self, additional=0, *, finalizing=False):
        remaining = self.deadline - time.monotonic()
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        if remaining <= 0 and not finalizing:
            raise ResourceLimit("registered native campaign deadline reached")
        if used + additional + (0 if finalizing else self.headroom) > self.cap:
            raise ResourceLimit("registered native artifact budget reached")
        if shutil.disk_usage("C:/").free < C_RESERVE or shutil.disk_usage(ROOT).free - additional < E_RESERVE:
            raise ResourceLimit("original C/E reserve reached")
        return remaining

    def save(self, relative, data, *, finalizing=False):
        self.guard(len(data), finalizing=finalizing)
        path = contained(self.directory, relative)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("xb") as stream:
            stream.write(data)
        return relative

    def record(self, relative, data, *, finalizing=False):
        return self.save(relative, json_bytes(data), finalizing=finalizing)


def targets(reference):
    return [np.take(reference, 0 if side == 0 else reference.shape[axis + 1] - 1, axis=axis + 1).copy()
            for axis in range(3) for side in range(2)]


def local_plan(mesh, q, boundary, start, steps, dt):
    require(steps in (1, 2) and type(start) is int and start >= 0, "one/two step segment required")
    fields = ["nr-native-rk4-input-v1", "58", *map(str, mesh.shape)]
    fields += [f"{x:.17g}" for x in (*mesh.lower, *mesh.upper)]
    fields += [str(start), str(steps), f"{dt:.17g}"]
    pieces = [(" ".join(fields) + "\n").encode(), np.asarray(q, dtype="<f8").tobytes()]
    for tick in range(2 * start, 2 * (start + steps) + 1):
        pieces.append(f"face-targets-v1 {tick}\n".encode())
        pieces.extend(np.asarray(face, dtype="<f8").tobytes() for face in boundary)
    raw = b"".join(pieces)
    codec.read_plan(raw)  # Validate our own transport before launching a child.
    return raw


def unpack_trace(raw, mesh, start, steps, dt):
    position = raw.find(b"\n")
    require(0 <= position <= TRACE_HEADER_CAP, "bounded native trace header required")
    meta = json.loads(raw[:position])
    payload = raw[position + 1:]
    require(meta["schema"] == "nr-native-rk4-output-v1" and meta["method_id"] == codec.METHOD, "trace method mismatch")
    for key, value in dict(shape=list(mesh.shape), lower=list(mesh.lower), upper=list(mesh.upper), start_step=start, steps=steps, dt=dt, threads_observed=1, blas_threads=1).items():
        require(meta.get(key) == value, "trace " + key + " mismatch")
    require(meta.get("component_only") is True and meta.get("native_rk4_step_supported") is True, "qualified trace semantics required")
    for key in ("physical_gate", "scientificPayloadWriteback", "algebraic_projection", "auxiliaries_reconstructed", "automatic_timestep_change", "native_checkpoint_supported"):
        require(meta.get(key) is False, "trace admission/policy mismatch")
    require(len(payload) == steps * 9 * 58 * int(np.prod(mesh.shape)) * 8 == meta["values"] * 8, "complete trace payload required")
    require(len(meta["trace"]) == steps, "trace count mismatch")
    arrays = np.frombuffer(payload, dtype="<f8").reshape((steps, 9, 58, *mesh.shape))
    require(np.isfinite(arrays).all(), "finite complete trace required")
    return meta, arrays


def check_step(arrays, record, previous, index, dt):
    q, k1, q2, k2, q3, k3, q4, k4, endpoint = arrays
    require(q.tobytes() == previous.tobytes(), "segment continuity mismatch")
    for actual, expected in ((q2, q + .5 * dt * k1), (q3, q + .5 * dt * k2),
                             (q4, q + dt * k3), (endpoint, q + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6)):
        require(actual.tobytes() == expected.tobytes(), "raw RK combination changed")
    require(record["step"] == index and len(record["stages"]) == 4, "trace step identity mismatch")
    for stage, offset in enumerate((0, 1, 1, 2)):
        report = record["stages"][stage]
        require(report["stage"] == stage + 1 and report["boundary_tick"] == 2 * index + offset, "exact stage tick required")
        require(report["coefficients_sha256"] == codec.sha(arrays[2 * stage, :11].tobytes()), "stage coefficient SHA mismatch")
        require(0 <= report["cfl"] <= .25 * (1 + 1e-14) and 0 < report["min_lapse"] < 2 and report["min_chi"] > 0,
                "unchanged native stage gauge/CFL gate")
        require(0 <= report["det_h_max_error"] <= 1e-10 and 0 <= report["max_characteristic_residual"] <= 2e-11 and 1 <= report["max_basis_condition"] <= 1e6, "unchanged stage algebraic gate")
        require([(f["axis"], f["side"]) for f in report["faces"]] == [(a, s) for a in range(3) for s in range(2)], "six ordered face reports required")


def invoke(budget, stem, command, *, payload=None, output_cap, prospective=0):
    remaining = budget.guard(prospective + output_cap)
    budget.record(stem + ".attempt.json", dict(command=command, status="attempted"))
    environment = dict(os.environ, OPENBLAS_NUM_THREADS="1", OMP_NUM_THREADS="1", MKL_NUM_THREADS="1", PYTHONDONTWRITEBYTECODE="1", TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"))
    try:
        result = subprocess.run(command, input=payload, capture_output=True, check=False, cwd=ROOT,
                                env=environment, timeout=min(120, remaining))
    except subprocess.TimeoutExpired as error:
        budget.save(stem + ".timeout-stdout", error.stdout or b"", finalizing=True)
        budget.save(stem + ".timeout-stderr", error.stderr or b"", finalizing=True)
        raise ResourceLimit("owned native child reached registered timeout") from error
    require(len(result.stdout) <= output_cap and len(result.stderr) <= 65536, "native output exceeds registered transport bound")
    budget.save(stem + ".stderr", result.stderr, finalizing=bool(result.returncode))
    budget.record(stem + ".terminal.json", dict(returncode=result.returncode, stdout_bytes=len(result.stdout), stdout_sha256=codec.sha(result.stdout)), finalizing=bool(result.returncode))
    if result.returncode:
        budget.save(stem + ".failed-stdout", result.stdout, finalizing=True)
        raise RuntimeError("native child rejected: " + result.stderr.decode(errors="replace"))
    require(not result.stderr, "unexpected successful child stderr")
    return result.stdout


def run_case(budget, row, mesh, initial, reference, binding, global_sha, measure):
    """Run full requested case; every native publication and scientific point is distinct."""
    q = initial.copy()
    boundary = targets(reference)
    predecessor = None
    row.update(status="running", phase="initial-diagnostics", accepted_steps=0, native_published_steps=0,
               segments=[], trajectory=[])
    row["trajectory"].append(dict(point=0, time=0., state_sha256=codec.sha(q.tobytes()), **measure(q)))
    for start in range(0, row["steps"], 2):
        length = min(2, row["steps"] - start)
        stem = f"{row['label']}/segment-{start:04d}"
        record = dict(start=start, steps=length, dt=row["dt"], global_plan_sha256=global_sha,
                      predecessor=predecessor, initial_state_sha256=codec.sha(q.tobytes()),
                      status="attempted", native_points=[], points=[])
        row["segments"].append(record)
        row.update(phase="segment-plan", attempted_step=start)
        raw = local_plan(mesh, q, boundary, start, length, row["dt"])
        plan_sha = codec.sha(raw)
        record.update(plan=stem + "/plan.bin", plan_sha256=plan_sha)
        budget.record(stem + "/segment-attempt.json", record)
        budget.save(record["plan"], raw)
        output = contained(budget.directory, stem + "/checkpoints")
        output.mkdir()
        for offset in range(length):
            index = start + offset
            row.update(phase="native-checkpoint", attempted_step=index)
            input_path = contained(budget.directory, record["plan"]) if offset == 0 else output / f"step-{index:016d}.nrck"
            command = [str(CHECKPOINT_EXE), "--lapack", str(LIBRARY), "--threads", "2" if offset == 0 else "4",
                       "--plan" if offset == 0 else "--restart", str(input_path), "--plan-sha", plan_sha,
                       "--output", str(output), "--advance", "1"]
            result = invoke(budget, stem + f"/checkpoint-{offset}", command, output_cap=16384,
                            prospective=len(raw) + q.nbytes + 8192)
            budget.save(stem + f"/manifest-{offset}.json", result)
            manifest = json.loads(result)
            expected_path = output / f"step-{index+1:016d}.nrck"
            require(Path(manifest["diagnostics"]["checkpoint_path"]).resolve() == expected_path, "published path mismatch")
            point = codec.decode(expected_path.read_bytes(), binding, plan_sha)
            codec.validate_manifest(manifest, point, binding)
            require(point["step"] == index + 1 and manifest["diagnostics"]["steps_advanced"] == 1, "native step mismatch")
            name = expected_path.relative_to(budget.directory).as_posix()
            record["native_points"].append(dict(point=index + 1, checkpoint=name, sha256=point["checkpoint_sha256"]))
            row["native_published_steps"], row["last_native_checkpoint"] = index + 1, name
        row["phase"] = "native-stage-trace"
        trace_bytes = invoke(budget, stem + "/trace", [str(RK_EXE), "--lapack", str(LIBRARY), "--mode", "trajectory", "--threads", "1"],
                             payload=raw, output_cap=length * 9 * q.nbytes + TRACE_HEADER_CAP)
        record.update(trace=stem + "/trace.bin.zlib", trace_bytes=len(trace_bytes), trace_sha256=codec.sha(trace_bytes))
        budget.save(record["trace"], zlib.compress(trace_bytes, level=6))
        meta, arrays = unpack_trace(trace_bytes, mesh, start, length, row["dt"])
        for offset, endpoint_meta in enumerate(record["native_points"]):
            index = start + offset
            row.update(phase="science-endpoint-audit", attempted_step=index)
            checkpoint = codec.decode(contained(budget.directory, endpoint_meta["checkpoint"]).read_bytes(), binding, plan_sha)
            check_step(arrays[offset], meta["trace"][offset], q, index, row["dt"])
            require(arrays[offset, 8].tobytes() == checkpoint["state_raw"], "checkpoint/trace binary disagreement")
            diagnostics = measure(checkpoint["q"])
            require(diagnostics["algebraic_errors"]["det_h"] <= 1e-10, "unchanged scientific endpoint determinant cap")
            point_record = dict(point=index + 1, time=(index + 1) * row["dt"], checkpoint=endpoint_meta["checkpoint"],
                                checkpoint_sha256=endpoint_meta["sha256"], state_sha256=checkpoint["state_sha256"],
                                segment_plan_sha256=plan_sha, global_plan_sha256=global_sha, **diagnostics)
            payload = json_bytes(point_record)
            require(len(payload) <= 256 * 1024, "point journal exceeds registered bound")
            budget.save(stem + f"/point-{index+1:04d}.json", payload)
            record["points"].append(point_record)
            row["trajectory"].append(point_record)
            row["accepted_steps"], row["last_accepted_checkpoint"] = index + 1, endpoint_meta["checkpoint"]
            q = checkpoint["q"].copy()
            print(json.dumps(dict(case=row["label"], accepted_steps=index + 1, planned_steps=row["steps"], time=point_record["time"],
                                 H=diagnostics["measurements"]["whole"]["H_metric_hessian"], M=diagnostics["measurements"]["whole"]["M_metric"])), flush=True)
        record["status"] = "completed"
        budget.record(stem + "/segment-completed.json", record)
        predecessor = dict(checkpoint=record["native_points"][-1]["checkpoint"], sha256=record["native_points"][-1]["sha256"],
                           state_sha256=codec.sha(q.tobytes()), point=start + length)
        # The next local plan MUST be generated from the persisted predecessor, not hidden process memory.
        restored = codec.decode(contained(budget.directory, predecessor["checkpoint"]).read_bytes(), binding, plan_sha)
        require(restored["state_raw"] == q.tobytes(), "persisted cross-segment predecessor mismatch")
        q = restored["q"].copy()
    row.update(status="completed", phase="completed", completed=True)
    return q


def regional_slot_errors(actual, expected):
    n = actual.shape[1]
    require(actual.shape == expected.shape == (58, n, n, n), "cube parity required")
    indices = np.indices((n,) * 3)
    count = sum(((x == 0) | (x == n - 1)).astype(int) for x in indices)
    central = np.logical_and.reduce([(x >= (n - 1) / 4) & (x <= 3 * (n - 1) / 4) for x in indices])
    masks = dict(whole=np.ones((n,) * 3, bool), central_box=central, faces=count == 1, edges=count == 2, corners=count == 3)
    return {name: (np.max(abs(actual[:, mask] - expected[:, mask]), axis=1) /
                   np.maximum(1., np.max(abs(expected[:, mask]), axis=1))).tolist() for name, mask in masks.items()}


def temporal_screen(arrays, driver, refinement):
    require(len(arrays) == 3 and all(q.shape == (58, 13, 13, 13) for q in arrays), "three complete N13 endpoints required")
    weights, masks = refinement["weights_and_regions"](driver)
    regions = {}
    for name in ("whole", "central_box", "faces", "edges", "corners"):
        errors = [refinement["weighted_rms"](np.moveaxis(a - b, 0, -1), weights, masks[name]) for a, b in zip(arrays[:-1], arrays[1:], strict=True)]
        regions[name] = dict(**refinement["order_record"](*errors, 2., 3.5, 4.5), minimum_difference_over_floor=min(errors) / 2e-13)
    status = "failed" if any(r["status"] == "failed" for r in regions.values()) else "passed" if all(r["passed"] for r in regions.values()) else "unresolved"
    return dict(regions=regions, status=status, passed=status == "passed", floor=2e-13,
                minimum_order=3.5, maximum_order=4.5, time=1/16, steps=[7, 14, 28], policy="none",
                spatial_order_validated=False, analytic_evolution_reference=False, physical_gate=False)

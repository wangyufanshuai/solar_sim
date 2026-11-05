"""Bounded native checkpoint qualification; faults terminate owned test children."""

from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import time

import numpy as np
import pytest

from science.numerical_relativity import native_checkpoint as codec
from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.manifest import NRRunManifest
from scripts.tests.test_nr_native_rk4_component import (
    LIBRARY, PARENTS as RK_PARENTS, RUNTIMES, flat, grid, pack,
    regional_errors, sha, targets_table, unpack, write_json,
)

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
COMPONENT = ROOT / "science/numerical_relativity/cpp/checkpoint_component"
PARENTS = {**RK_PARENTS, "nr-k3-native-rk4-component-v1-20261010/receipt.json": "5e85b50615d3e3f4113c177a880d0808e5b4be48fc7e1507fc3b26592293c44c"}
RK_EXE = ROOT / "tmp/nr-native-rk4-build-v1-20261010/Release/nr-rk4-component.exe"
RK_SHA = "3cd7bab4373ed24631bdcd81185debb9d2ce9f96385fee2c52a1598fc8399142"
BUDGET, SECONDS = 768 * 1024**2, 1200


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + BUDGET, "E reserve plus complete batch budget required"


@pytest.fixture(scope="session")
def native_checkpoint():
    if "NR_NATIVE_CHECKPOINT_EXE" not in os.environ:
        pytest.skip("explicit native checkpoint executable required")
    reserve()
    exe = Path(os.environ["NR_NATIVE_CHECKPOINT_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_CHECKPOINT_EVIDENCE"]).resolve()
    assert exe.is_file() and exe.is_relative_to(ROOT / "tmp")
    assert directory.parent == EVIDENCE.resolve() and not directory.exists()
    assert sha(RK_EXE) == RK_SHA
    assert all(sha(p) == v for p, v in RUNTIMES.items())
    identity_file = exe.parent.parent / "source-identity.txt"
    source_bytes = identity_file.read_bytes()
    source_files = dict(line.rsplit(" ", 1) for line in source_bytes.decode().splitlines()[1:])
    assert all(sha(ROOT / p) == v for p, v in source_files.items())
    inherited = {}
    for name, digest in PARENTS.items():
        path = EVIDENCE / name
        assert sha(path) == digest
        inherited.update(json.loads(path.read_text(encoding="utf-8"))["source_after"])
    assert all(sha(ROOT / p) == v for p, v in inherited.items())
    generated = sorted((exe.parent.parent / "rk4_dependency/sat_dependency/volume_dependency/generated").glob("frozen_*.inc.hpp"))
    old = json.loads((EVIDENCE / list(PARENTS)[-1]).read_text(encoding="utf-8"))
    assert len(generated) == 4
    assert {p.name: sha(p) for p in generated} == {Path(p).name: v for p, v in old["generated_after"].items()}
    binding = codec.binding(codec.sha(source_bytes), sha(exe), RUNTIMES[LIBRARY], RUNTIMES[Path("C:/Windows/System32/vcomp140.dll")])
    directory.mkdir()
    (directory / "source-identity.txt").write_bytes(source_bytes)
    (directory / "binding.txt").write_bytes(binding)
    for path in generated:
        (directory / path.name).write_bytes(path.read_bytes())
    for relative in source_files:
        if relative.startswith("science/numerical_relativity/cpp/checkpoint_component/") or relative.endswith(("native_checkpoint.py", "test_nr_native_checkpoint_component.py", "EXPERIMENT-20261010-native-checkpoint-component.md")):
            target = directory / "source-snapshot" / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((ROOT / relative).read_bytes())
    started, calls, comparisons = time.monotonic(), [], []
    identity = dict(schema="nr-native-checkpoint-tests-v1", method_id=codec.METHOD,
                    executable=str(exe), executable_sha256=sha(exe), source_before=source_files,
                    inherited_reference_keys=len(inherited), parent_receipts=PARENTS,
                    generated_before={p.relative_to(ROOT).as_posix(): sha(p) for p in generated},
                    runtimes={str(p): v for p, v in RUNTIMES.items()},
                    prior_rk4_executable_sha256=RK_SHA, component_only=True,
                    physical_gate=False, live_admission=False, scientificPayloadWriteback=False,
                    native_checkpoint_supported=True, universal_power_loss_durability=False,
                    deadline_seconds=SECONDS, budget_bytes=BUDGET)
    write_json(directory / "identity-before.json", identity)

    def guard(extra=0):
        reserve()
        remaining = SECONDS - (time.monotonic() - started)
        assert remaining > 0, "checkpoint batch deadline"
        assert sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) + extra < BUDGET, "artifact budget"
        return remaining

    def run(command, payload=None, label="checkpoint"):
        remaining = guard(40 * 1024**2)
        index = len(calls)
        row = dict(index=index, backend=label, command=command, status="attempted")
        calls.append(row)
        if payload is not None:
            (directory / f"call-{index:04d}.stdin").write_bytes(payload)
        write_json(directory / f"call-{index:04d}.json", row)
        try:
            result = subprocess.run(command, input=payload, capture_output=True, cwd=ROOT,
                                    timeout=min(120, remaining), check=False,
                                    env=dict(os.environ, OPENBLAS_NUM_THREADS="1", MKL_NUM_THREADS="1", TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1"))
        except subprocess.TimeoutExpired as error:
            (directory / f"call-{index:04d}.stdout").write_bytes(error.stdout or b"")
            (directory / f"call-{index:04d}.stderr").write_bytes(error.stderr or b"")
            row.update(status="timeout")
            write_json(directory / f"call-{index:04d}.json", row)
            raise
        (directory / f"call-{index:04d}.stdout").write_bytes(result.stdout)
        (directory / f"call-{index:04d}.stderr").write_bytes(result.stderr)
        row.update(status="terminal", returncode=result.returncode)
        write_json(directory / f"call-{index:04d}.json", row)
        guard()
        return result

    def invoke(raw, *, restart=False, advance=1, threads=1, expected=None, output=None, fault=None, suffix=None):
        guard(len(raw) + 40 * 1024**2)
        index = len(calls)
        source = directory / (f"input-{index:04d}" + (suffix or (".nrck" if restart else ".bin")))
        source.write_bytes(raw)
        target = output or directory / f"output-{index:04d}"
        target.mkdir(exist_ok=True)
        command = [str(exe), "--lapack", str(LIBRARY), "--threads", str(threads), "--restart" if restart else "--plan", str(source), "--plan-sha", expected or codec.sha(raw), "--output", str(target), "--advance", str(advance)]
        if fault:
            command += ["--fault", fault[0], "--fault-step", str(fault[1])]
        return run(command), target

    def success(result, original, threads=1, advanced=1):
        process, output = result
        assert process.returncode == 0, process.stderr.decode(errors="replace")
        assert process.stderr == b""
        manifest = json.loads(process.stdout)
        path = Path(manifest["diagnostics"]["checkpoint_path"])
        assert path.is_relative_to(directory)
        raw = path.read_bytes()
        point = codec.decode(raw, binding, codec.sha(original))
        codec.validate_manifest(manifest, point, binding)
        assert NRRunManifest(**manifest).payload() == manifest
        assert manifest["diagnostics"]["threads_observed"] == threads
        assert manifest["diagnostics"]["steps_advanced"] == advanced
        return raw, point, manifest, output

    def record(**data):
        comparisons.append(data)
        write_json(directory / f"comparison-{len(comparisons)-1:04d}.json", data)

    def old_rk(raw, mesh, start, steps, dt):
        command = [str(RK_EXE), "--lapack", str(LIBRARY), "--mode", "trajectory", "--threads", "1"]
        return unpack(run(command, raw, "qualified-rk4"), mesh, start, steps, dt)[0]

    yield dict(invoke=invoke, success=success, record=record, directory=directory, binding=binding, old=old_rk, guard=guard)
    identity.update(source_after={p: sha(ROOT / p) for p in source_files},
                    generated_after={p.relative_to(ROOT).as_posix(): sha(p) for p in generated},
                    inherited_reference_unchanged=all(sha(ROOT / p) == v for p, v in inherited.items()),
                    runtime_unchanged=all(sha(p) == v for p, v in RUNTIMES.items()),
                    executable_unchanged=sha(exe) == identity["executable_sha256"],
                    prior_rk4_unchanged=sha(RK_EXE) == RK_SHA,
                    identity_file_unchanged=identity_file.read_bytes() == source_bytes,
                    calls=calls, comparisons=comparisons, seconds=time.monotonic()-started)
    identity["source_unchanged"] = identity["source_after"] == source_files
    identity["generated_unchanged"] = identity["generated_after"] == identity["generated_before"]
    identity["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    write_json(directory / "receipt.json", identity)
    for key in ("inherited_reference_unchanged", "runtime_unchanged", "executable_unchanged", "prior_rk4_unchanged", "identity_file_unchanged", "source_unchanged", "generated_unchanged"):
        assert identity[key], key
    guard()


def rejected(result):
    process, output = result
    assert process.returncode == 1 and process.stdout == b""
    error = json.loads(process.stderr)
    assert error["schema"] == "nr-native-checkpoint-error-v1"
    assert error["fallback"] is False and error["scientificPayloadWriteback"] is False
    return error, output


def image_parts(raw):
    identity_size = struct.unpack_from("<Q", raw, 16)[0]
    step_offset = 24 + identity_size
    plan_size = struct.unpack_from("<Q", raw, step_offset + 8)[0]
    state_length_offset = step_offset + 16 + plan_size
    return step_offset, state_length_offset, state_length_offset + 8


def rehash(body):
    body = bytes(body)
    return body + hashlib.sha256(body).digest()


@pytest.fixture(scope="session")
def base_checkpoint(native_checkpoint):
    mesh, q = grid(), flat((9,) * 3)
    plan = pack(mesh, q, targets_table(mesh, q, 0, 2), steps=2)
    return plan, native_checkpoint["success"](native_checkpoint["invoke"](plan, advance=2), plan, advanced=2)


@pytest.mark.parametrize("case", ["varying", "rectangular", "schwarzschild", "pulse", "flat4", "upper17"])
def test_real_restart_and_reference_parity(native_checkpoint, case):
    n = native_checkpoint
    mesh, start, steps, dt = grid(), 3, 2, 1 / 1024
    if case == "rectangular":
        mesh, dt = grid((9, 10, 11), rectangular=True), 1 / 2048
    elif case == "pulse":
        mesh, start, dt = grid((13,) * 3), 0, 1 / 448
    elif case == "upper17":
        mesh, steps = grid((17,) * 3), 1
    elif case == "flat4":
        steps = 4
    q = flat(mesh.shape)
    if case == "schwarzschild":
        q, start = analytic_slots(9, 4), 0
    elif case == "pulse":
        q, _ = initial_slots(13)
    target_q = analytic_slots(mesh.shape[0], 4) if case in ("schwarzschild", "pulse") else q
    table = targets_table(mesh, target_q, start, steps, varying=case in ("varying", "rectangular"))
    raw = pack(mesh, q, table, start, steps, dt)
    full = n["success"](n["invoke"](raw, advance=steps), raw, advanced=steps)
    first = n["success"](n["invoke"](raw, threads=2), raw, threads=2)
    resumed = n["success"](n["invoke"](first[0], restart=True, advance=steps-1, threads=4, expected=codec.sha(raw)), raw, threads=4, advanced=steps-1)
    assert resumed[0] == full[0]
    assert first[0] == (full[3] / f"step-{start+1:016d}.nrck").read_bytes()
    if case in ("varying", "rectangular"):
        for threads in (1, 2, 4):
            repeated = n["success"](n["invoke"](raw, advance=steps, threads=threads), raw, threads=threads, advanced=steps)
            assert repeated[0] == full[0]
    old = n["old"](raw, mesh, start, steps, dt)
    assert full[1]["state_raw"] == old[-1, 8].tobytes()
    for index in range(steps):
        saved = (full[3] / f"step-{start+index+1:016d}.nrck").read_bytes()
        assert codec.decode(saved, n["binding"], codec.sha(raw))["state_raw"] == old[index, 8].tobytes()
    reference, driver, by_tick = q.copy(), NonlinearSBPCube(mesh), dict(table)
    for index in range(start, start+steps):
        reference, _ = driver.step(reference, index, dt, by_tick.__getitem__)
    errors = regional_errors(full[1]["q"], reference, mesh)
    assert max(max(row) for row in errors.values()) <= 2e-11
    np.save(n["directory"] / f"python-endpoint-{case}.npy", reference, allow_pickle=False)
    n["record"](kind="restart-parity", case=case, start=start, steps=steps, shape=list(mesh.shape), dt=dt,
                restart_file_byte_exact=True, old_rk4_each_endpoint_byte_exact=True,
                full_thread_checks=[1, 2, 4] if case in ("varying", "rectangular") else [1],
                split_threads=[2, 4], region_slot_errors=errors)


@pytest.mark.parametrize("mutation", ["flip", "truncate", "append", "magic", "source", "exe", "blas", "openmp", "method", "variables", "step-low", "step-high", "plan-size", "state-size", "trailing", "binding-size", "plan-flip"])
def test_corruption_and_recomputed_hash_mismatch_rejected(native_checkpoint, base_checkpoint, mutation):
    n, (plan, base) = native_checkpoint, base_checkpoint
    body = bytearray(base[0][:-32])
    step_offset, size_offset, state_offset = image_parts(base[0])
    if mutation == "flip":
        body[-1] ^= 1
        raw = bytes(body) + base[0][-32:]
    elif mutation == "truncate":
        raw = base[0][:-1]
    elif mutation == "append":
        raw = base[0] + b"x"
    else:
        if mutation == "magic": body[0] ^= 1
        elif mutation in ("source", "exe", "blas", "openmp", "method", "variables"):
            offset = body.index((mutation + "=").encode()) + len(mutation) + 1
            body[offset] = ord("a") if body[offset] != ord("a") else ord("b")
        elif mutation == "step-low": struct.pack_into("<Q", body, step_offset, 0)
        elif mutation == "step-high": struct.pack_into("<Q", body, step_offset, 3)
        elif mutation == "plan-size": struct.pack_into("<Q", body, step_offset + 8, 2**63)
        elif mutation == "state-size": struct.pack_into("<Q", body, size_offset, 8)
        elif mutation == "binding-size": struct.pack_into("<Q", body, 16, 4097)
        elif mutation == "trailing": body += b"x"
        elif mutation == "plan-flip": body[step_offset + 20] ^= 1
        raw = rehash(body)
    error, output = rejected(n["invoke"](raw, restart=True, advance=0, expected=codec.sha(plan)))
    assert not list(output.iterdir()) and error["last_checkpoint"] == ""
    with pytest.raises(ValueError): codec.decode(raw, n["binding"], codec.sha(plan))
    n["record"](kind="corruption-rejection", mutation=mutation, error=error)


@pytest.mark.parametrize("slot,value", [(0, -1.), (0, float("nan")), (17, float("inf")), (6, 1000.), (6, -1000.), (10, 1000.), (10, -1000.)])
def test_endpoint_validation_on_restore(native_checkpoint, base_checkpoint, slot, value):
    plan, base = base_checkpoint
    body = bytearray(base[0][:-32])
    _, _, offset = image_parts(base[0])
    struct.pack_into("<d", body, offset + slot * 9**3 * 8, value)
    raw = rehash(body)
    error, output = rejected(native_checkpoint["invoke"](raw, restart=True, advance=0, expected=codec.sha(plan)))
    assert error["phase"] == "checkpoint-validate" and not list(output.iterdir())
    with pytest.raises(ValueError): codec.decode(raw, native_checkpoint["binding"], codec.sha(plan))


@pytest.mark.parametrize("slot,value", [(6, np.log(2.1)), (0, 1.1)])
def test_endpoint_validation_does_not_add_rhs_gates(native_checkpoint, base_checkpoint, slot, value):
    plan, base = base_checkpoint
    body = bytearray(base[0][:-32])
    step_offset, _, offset = image_parts(base[0])
    struct.pack_into("<Q", body, step_offset, 1)
    struct.pack_into("<d", body, offset + slot * 9**3 * 8, value)
    raw = rehash(body)
    loaded = native_checkpoint["success"](native_checkpoint["invoke"](raw, restart=True, advance=0, expected=codec.sha(plan)), plan, advanced=0)
    assert loaded[0] == raw  # Integrity is not authentication or trajectory proof.
    error, output = rejected(native_checkpoint["invoke"](raw, restart=True, advance=1, expected=codec.sha(plan)))
    assert error["stage"] == 1 and error["accepted_step"] == 1 and not list(output.iterdir())


@pytest.mark.parametrize("phase", ["half-write", "flushed", "published"])
def test_process_interruption_preserves_prefix_and_complete_publication(native_checkpoint, phase):
    n = native_checkpoint
    mesh, q = grid(), flat((9,) * 3)
    plan = pack(mesh, q, targets_table(mesh, q, 0, 2, varying=True), steps=2)
    baseline = n["success"](n["invoke"](plan, advance=2), plan, advanced=2)
    process, output = n["invoke"](plan, advance=2, fault=(phase, 2))
    assert process.returncode == 86 and not process.stdout and not process.stderr
    prefix = output / "step-0000000000000001.nrck"
    assert prefix.read_bytes() == (baseline[3] / prefix.name).read_bytes()
    partial = output / "step-0000000000000002.nrck.partial"
    final = output / "step-0000000000000002.nrck"
    if phase == "published":
        assert not partial.exists() and final.read_bytes() == baseline[0]
        n["success"](n["invoke"](final.read_bytes(), restart=True, advance=0, expected=codec.sha(plan)), plan, advanced=0)
    else:
        assert not final.exists() and partial.is_file()
        if phase == "half-write":
            with pytest.raises(ValueError): codec.decode(partial.read_bytes(), n["binding"], codec.sha(plan))
        else:
            assert partial.read_bytes() == baseline[0]
        rejected(n["invoke"](partial.read_bytes(), restart=True, advance=0, expected=codec.sha(plan), suffix=".partial"))
    resumed = n["success"](n["invoke"](prefix.read_bytes(), restart=True, threads=4, expected=codec.sha(plan)), plan, threads=4)
    assert resumed[0] == baseline[0]
    n["record"](kind="owned-process-fault", phase=phase, returncode=86, prefix_byte_exact=True, resumed_byte_exact=True,
                partial_retained=partial.exists(), final_published=final.exists())


def test_real_later_rhs_failure_keeps_accepted_checkpoint(native_checkpoint):
    n = native_checkpoint
    mesh, q = grid(), flat((9,) * 3)
    table = targets_table(mesh, q, 0, 2)
    table[3][1][0][17] = 1e308
    plan = pack(mesh, q, table, steps=2)
    error, output = rejected(n["invoke"](plan, advance=2))
    assert error["accepted_step"] == 1 and error["attempted_step"] == 1 and error["stage"] == 2
    assert error["phase"] == "stage-rhs"
    prefix = Path(error["last_checkpoint"])
    assert prefix.parent == output and len(list(output.iterdir())) == 1
    n["success"](n["invoke"](prefix.read_bytes(), restart=True, advance=0, expected=codec.sha(plan)), plan, advanced=0)
    again, _ = rejected(n["invoke"](prefix.read_bytes(), restart=True, expected=codec.sha(plan)))
    assert (again["attempted_step"], again["stage"], again["phase"]) == (1, 2, "stage-rhs")
    n["record"](kind="late-actual-rhs-rejection", error=error, repeated_from_checkpoint=True)


@pytest.mark.parametrize("partial", [False, True])
def test_existing_target_is_never_overwritten(native_checkpoint, base_checkpoint, partial):
    n, (plan, base) = native_checkpoint, base_checkpoint
    output = n["directory"] / ("collision-partial" if partial else "collision-final")
    output.mkdir()
    target = output / ("step-0000000000000001.nrck" + (".partial" if partial else ""))
    target.write_bytes(b"user-owned-preserved-sentinel")
    rejected(n["invoke"](plan, output=output))
    assert target.read_bytes() == b"user-owned-preserved-sentinel" and len(list(output.iterdir())) == 1


@pytest.mark.parametrize("kind", ["bad-sha", "invalid-sha", "too-far", "fresh-zero", "bad-thread", "legacy", "trailing-plan", "target-label", "bad-dt", "too-many-steps"])
def test_transport_and_plan_fail_closed(native_checkpoint, base_checkpoint, kind):
    n, (plan, base) = native_checkpoint, base_checkpoint
    raw, kwargs = plan, {}
    if kind == "bad-sha": kwargs["expected"] = "0" * 64
    elif kind == "invalid-sha": kwargs["expected"] = "xyz"
    elif kind == "too-far": kwargs["advance"] = 3
    elif kind == "fresh-zero": kwargs["advance"] = 0
    elif kind == "bad-thread": kwargs["threads"] = 3
    elif kind == "legacy": raw, kwargs = b"NR-FO-LEGACY-CHECKPOINT", dict(restart=True, advance=0, expected=codec.sha(plan))
    elif kind == "trailing-plan": raw += b"x"
    elif kind == "target-label": raw = raw.replace(b"face-targets-v1 1\n", b"face-targets-v1 0\n", 1)
    elif kind in ("bad-dt", "too-many-steps"):
        header, payload = raw.split(b"\n", 1)
        parts = header.split()
        parts[-1 if kind == "bad-dt" else -2] = b"0" if kind == "bad-dt" else b"5"
        raw = b" ".join(parts) + b"\n" + payload
    error, output = rejected(n["invoke"](raw, **kwargs))
    assert error["last_checkpoint"] == "" and not list(output.iterdir())


@pytest.mark.parametrize("key", ["method_id", "source_sha256", "executable_sha256", "plan_sha256", "state_sha256", "checkpoint_sha256", "step", "time", "variables", "physical_gate", "scientificPayloadWriteback", "universal_power_loss_durability"])
def test_manifest_tampering_is_rejected(native_checkpoint, base_checkpoint, key):
    _, base = base_checkpoint
    modified = copy.deepcopy(base[2])
    value = modified["diagnostics"][key]
    modified["diagnostics"][key] = not value if type(value) is bool else value + 1 if isinstance(value, (int, float)) else [] if isinstance(value, list) else "changed"
    with pytest.raises(ValueError): codec.validate_manifest(modified, base[1], native_checkpoint["binding"])

"""Full native SBP/SAT RK4 stages and bounded trajectories, shadow only."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

import numpy as np
import pytest

from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube, face
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots
from scripts.tests.test_nr_native_sbp_volume_component import (
    FROZEN_SHA,
    PRIMARY,
    flat,
    grid,
    regional_errors,
    sha,
    write_json,
)
from scripts.tests.test_nr_native_sat_component import (
    LIBRARY,
    PARENTS as SAT_PARENTS,
    RUNTIMES,
)

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / "science/numerical_relativity/cpp/rk4_component"
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENTS = {
    **SAT_PARENTS,
    "nr-k3-native-sat-component-v2-20261010/receipt.json": "5a6056364965e69bc8f2b98aa396918257b6faeacab12fd8f480786c6caf52b0",
}
SOURCES = (
    COMPONENT / "CMakeLists.txt",
    COMPONENT / "rk4.hpp",
    COMPONENT / "main.cpp",
    Path(__file__),
    ROOT / "science/numerical_relativity/EXPERIMENT-20261010-native-rk4-component.md",
)
METHOD = "nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1"
BUDGET, SECONDS = 768 * 1024**2, 1200


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + BUDGET, (
        "E reserve and complete RK4 budget required"
    )


@pytest.fixture(scope="session")
def native_rk4():
    if "NR_NATIVE_RK4_EXE" not in os.environ:
        pytest.skip("explicit qualified native RK4 executable required")
    reserve()
    executable = Path(os.environ["NR_NATIVE_RK4_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_RK4_EVIDENCE"]).resolve()
    assert executable.is_file() and executable.is_relative_to(ROOT / "tmp")
    assert directory.parent == EVIDENCE.resolve() and not directory.exists()
    assert all(sha(p) == digest for p, digest in RUNTIMES.items())
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in SOURCES}
    inherited = {}
    for name, digest in PARENTS.items():
        path = EVIDENCE / name
        assert sha(path) == digest
        inherited.update(json.loads(path.read_text(encoding="utf-8"))["source_after"])
    assert all(sha(ROOT / name) == digest for name, digest in inherited.items())
    generated = sorted(
        (executable.parent.parent / "sat_dependency/volume_dependency/generated").glob(
            "frozen_*.inc.hpp"
        )
    )
    old = json.loads((EVIDENCE / list(PARENTS)[-1]).read_text(encoding="utf-8"))
    assert len(generated) == 4
    assert {p.name: sha(p) for p in generated} == {
        Path(p).name: digest for p, digest in old["generated_after"].items()
    }
    directory.mkdir()
    started = time.monotonic()
    calls, comparisons = [], []
    for path in generated:
        (directory / path.name).write_bytes(path.read_bytes())
    identity = dict(
        schema="nr-native-rk4-tests-v1",
        method_id=METHOD,
        started_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        executable=str(executable),
        executable_sha256=sha(executable),
        source_before=before,
        inherited_reference_keys=len(inherited),
        generated_before={p.relative_to(ROOT).as_posix(): sha(p) for p in generated},
        runtimes={str(p): digest for p, digest in RUNTIMES.items()},
        parent_receipts=PARENTS,
        component_only=True,
        native_rk4_step_supported=True,
        native_checkpoint_supported=False,
        physical_gate=False,
        scientificPayloadWriteback=False,
        budget_bytes=BUDGET,
        deadline_seconds=SECONDS,
    )
    write_json(directory / "identity-before.json", identity)

    def guard(extra=0):
        reserve()
        remaining = SECONDS - (time.monotonic() - started)
        assert remaining > 0, "RK4 component deadline"
        size = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
        assert size + extra < BUDGET, "RK4 artifact budget"
        return remaining

    def invoke(payload, threads=1, mode="trajectory", library=LIBRARY):
        remaining = guard(len(payload) + 90 * 1024**2)
        index = len(calls)
        stem = f"call-{index:04d}"
        command = [
            str(executable),
            "--lapack",
            str(library),
            "--mode",
            mode,
            "--threads",
            str(threads),
        ]
        row = dict(index=index, command=command, status="attempted", returncode=None)
        calls.append(row)
        (directory / (stem + ".input.bin")).write_bytes(payload)
        write_json(directory / (stem + ".json"), row)
        env = dict(
            os.environ,
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS=str(threads),
            MKL_NUM_THREADS="1",
            TEMP=str(ROOT / "tmp"),
            TMP=str(ROOT / "tmp"),
            PYTHONDONTWRITEBYTECODE="1",
        )
        try:
            process = subprocess.run(
                command,
                input=payload,
                capture_output=True,
                env=env,
                cwd=ROOT,
                timeout=min(120, remaining),
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            (directory / (stem + ".stdout.bin")).write_bytes(exc.stdout or b"")
            (directory / (stem + ".stderr")).write_bytes(exc.stderr or b"")
            row.update(status="timeout", error=str(exc))
            write_json(directory / (stem + ".json"), row)
            raise
        (directory / (stem + ".stdout.bin")).write_bytes(process.stdout)
        (directory / (stem + ".stderr")).write_bytes(process.stderr)
        row.update(status="terminal", returncode=process.returncode)
        write_json(directory / (stem + ".json"), row)
        guard()
        return process

    def record(**data):
        comparisons.append(data)
        write_json(directory / f"comparison-{len(comparisons) - 1:04d}.json", data)

    def save_reference(label, arrays):
        values = np.stack(arrays)
        guard(values.nbytes + 1024)
        path = directory / f"reference-{label}.npy"
        assert not path.exists()
        np.save(path, values, allow_pickle=False)
        return path.name

    yield invoke, record, save_reference
    after = {p: sha(ROOT / p) for p in before}
    generated_after = {p.relative_to(ROOT).as_posix(): sha(p) for p in generated}
    identity.update(
        source_after=after,
        source_unchanged=before == after,
        inherited_reference_unchanged=all(
            sha(ROOT / p) == digest for p, digest in inherited.items()
        ),
        generated_after=generated_after,
        generated_unchanged=generated_after == identity["generated_before"],
        executable_unchanged=sha(executable) == identity["executable_sha256"],
        runtime_unchanged=all(sha(p) == digest for p, digest in RUNTIMES.items()),
        calls=calls,
        comparisons=comparisons,
        seconds=time.monotonic() - started,
    )
    identity["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): sha(p)
        for p in sorted(directory.rglob("*"))
        if p.is_file()
    }
    write_json(directory / "receipt.json", identity)
    assert all(
        identity[k]
        for k in (
            "source_unchanged",
            "inherited_reference_unchanged",
            "generated_unchanged",
            "executable_unchanged",
            "runtime_unchanged",
        )
    )
    guard()


def pack(mesh, q, table, start=0, steps=1, dt=1 / 1024):
    header = ["nr-native-rk4-input-v1", "58", *map(str, mesh.shape)]
    header.extend(f"{x:.17g}" for x in (*mesh.lower, *mesh.upper))
    header.extend((str(start), str(steps), f"{dt:.17g}"))
    blocks = [
        (" ".join(header) + "\n").encode("ascii"),
        np.asarray(q, dtype="<f8").tobytes(),
    ]
    for tick, targets in table:
        blocks.append(f"face-targets-v1 {tick}\n".encode("ascii"))
        blocks.extend(np.asarray(t, dtype="<f8").tobytes() for t in targets)
    return b"".join(blocks)


def targets_table(mesh, q, start, steps, varying=False):
    driver = NonlinearSBPCube(mesh)
    table = []
    for tick in range(2 * start, 2 * (start + steps) + 1):
        targets = [t.copy() for t in driver.boundary_targets(q)]
        if varying:
            for index, target in enumerate(targets):
                i, j = np.indices(target.shape[1:])
                signal = (
                    1e-5
                    * (1 + 0.1 * index + 0.03 * i - 0.02 * j)
                    * (1 + 0.1 * tick + 0.01 * tick * tick)
                )
                target[17] += signal
                target[18] += 0.3 * signal
                target[25 + index // 2] -= 0.2 * signal
        table.append((tick, targets))
    return table


def unpack(process, mesh, start, steps, dt, threads=1):
    assert process.returncode == 0, process.stderr.decode(errors="replace")
    assert process.stderr == b""
    header, payload = process.stdout.split(b"\n", 1)
    meta = json.loads(header)
    assert meta["schema"] == "nr-native-rk4-output-v1" and meta["method_id"] == METHOD
    assert (
        meta["shape"] == list(mesh.shape)
        and meta["lower"] == list(mesh.lower)
        and meta["upper"] == list(mesh.upper)
    )
    assert meta["start_step"] == start and meta["steps"] == steps and meta["dt"] == dt
    assert (
        meta["threads_observed"] == threads
        and meta["openmp_version"] == 200203
        and meta["blas_threads"] == 1
    )
    assert (
        Path(meta["openmp_runtime"]).resolve()
        == Path("C:/Windows/System32/vcomp140.dll").resolve()
    )
    assert (
        Path(meta["blas_runtime"]).resolve() == LIBRARY.resolve()
        and "USE64BITINT" in meta["blas_config"]
    )
    assert meta["frozen_equation_sha256"] == FROZEN_SHA
    assert (
        meta["native_rk4_step_supported"] is True
        and meta["short_trajectory_supported"] is True
    )
    for name in (
        "native_checkpoint_supported",
        "algebraic_projection",
        "auxiliaries_reconstructed",
        "automatic_timestep_change",
        "physical_gate",
        "scientificPayloadWriteback",
    ):
        assert meta[name] is False
    assert (
        len(payload)
        == meta["values"] * 8
        == steps * 9 * 58 * int(np.prod(mesh.shape)) * 8
    )
    arrays = np.frombuffer(payload, dtype="<f8").reshape((steps, 9, 58, *mesh.shape))
    assert np.isfinite(arrays).all() and len(meta["trace"]) == steps
    return arrays, meta, payload


def repeated(native, mesh, q, table, start, steps, dt, thread_check=False):
    payload = pack(mesh, q, table, start, steps, dt)
    first = native[0](payload)
    result = unpack(first, mesh, start, steps, dt)
    second = native[0](payload)
    assert first.stdout == second.stdout and first.stderr == second.stderr
    if thread_check:
        for threads in (2, 4):
            other = unpack(native[0](payload, threads), mesh, start, steps, dt, threads)
            assert result[2] == other[2], f"OpenMP{threads} numeric payload differs"
    return result[:2]


class TracedPython(NonlinearSBPCube):
    def __init__(self, mesh):
        super().__init__(mesh)
        self.arrays = []
        self.attempts = 0

    def rhs(self, q, targets, dt):
        self.attempts += 1
        result, report = super().rhs(q, targets, dt)
        self.arrays.extend((q.copy(), result.copy()))
        return result, report


def exact_key_count(q):
    keys = set()
    for axis in range(3):
        for side in range(2):
            cells = np.moveaxis(face(q[:11], axis, side), 0, -1).reshape(-1, 11)
            keys.update((axis, cell.tobytes()) for cell in cells)
    return len(keys)


def compare(native, label, mesh, q, table, start, steps, dt, arrays, meta):
    driver = TracedPython(mesh)
    targets = dict(table)
    visited = []
    before = (
        q.tobytes(),
        tuple((tick, tuple(t.tobytes() for t in faces)) for tick, faces in table),
    )

    def boundary(tick):
        visited.append(tick)
        return targets[tick]

    reference = q.copy()
    reports = []
    for step in range(start, start + steps):
        reference, stages = driver.step(reference, step, dt, boundary)
        driver.arrays.append(reference.copy())
        reports.append(stages)
    reference_file = native[2](label, driver.arrays)
    expected = np.stack(driver.arrays).reshape(arrays.shape)
    errors = []
    for s in range(steps):
        for item in range(9):
            error = regional_errors(arrays[s, item], expected[s, item], mesh)
            assert max(max(x) for x in error.values()) <= 2e-11
            errors.append(dict(step=start + s, item=item, region_slot_errors=error))
        q0, k1, q2, k2, q3, k3, q4, k4, endpoint = arrays[s]
        previous = q if s == 0 else arrays[s - 1, 8]
        assert q0.tobytes() == previous.tobytes()
        for actual, reconstructed in (
            (q2, q0 + 0.5 * dt * k1),
            (q3, q0 + 0.5 * dt * k2),
            (q4, q0 + dt * k3),
            (endpoint, q0 + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6),
        ):
            assert actual.tobytes() == reconstructed.tobytes(), (
                "raw RK arithmetic differs or state was projected"
            )
        entry = meta["trace"][s]
        assert entry["step"] == start + s and len(entry["stages"]) == 4
        for stage, tick_offset in enumerate((0, 1, 1, 2)):
            actual, ref = entry["stages"][stage], reports[s][stage]
            assert (
                actual["stage"] == stage + 1
                and actual["boundary_tick"] == 2 * (start + s) + tick_offset
            )
            stage_q = arrays[s, 2 * stage]
            assert (
                actual["coefficients_sha256"]
                == hashlib.sha256(stage_q[:11].tobytes()).hexdigest()
            )
            assert actual["basis_builds"] == exact_key_count(stage_q)
            assert (
                actual["max_basis_condition"] <= 1e6
                and actual["max_characteristic_residual"] <= 2e-11
            )
            for name in ("cfl", "min_lapse", "min_chi", "det_h_max_error"):
                assert abs(actual[name] - ref[name]) / max(1.0, abs(ref[name])) <= 2e-13
            native_cfl_ref = driver.cfl(driver.state(stage_q), dt)
            assert abs(actual["cfl"] - native_cfl_ref) <= 2e-13
            assert [(x["axis"], x["side"]) for x in actual["faces"]] == [
                (a, b) for a in range(3) for b in range(2)
            ]
    expected_ticks = [
        2 * n + offset for n in range(start, start + steps) for offset in (0, 1, 1, 2)
    ]
    assert visited == expected_ticks
    assert before == (
        q.tobytes(),
        tuple((tick, tuple(t.tobytes() for t in faces)) for tick, faces in table),
    )
    native[1](
        kind="trajectory-parity",
        case=label,
        shape=list(mesh.shape),
        start_step=start,
        steps=steps,
        dt=dt,
        half_step_visits=visited,
        reference_array=reference_file,
        errors=errors,
        raw_rk_arithmetic_byte_exact=True,
        input_unchanged=True,
        cache_counts=[
            [stage["basis_builds"] for stage in step["stages"]]
            for step in meta["trace"]
        ],
    )


@pytest.mark.parametrize(
    "case",
    [
        "flat4",
        "upper17",
        "varying",
        "rectangular",
        "schwarzschild9",
        "pulse13",
        "saved-endpoint13",
    ],
)
def test_full_four_stages_and_short_trajectories(native_rk4, case):
    mesh, start, steps, dt = grid(), 3, 1, 1 / 1024
    if case == "upper17":
        mesh = grid((17, 17, 17))
    elif case == "rectangular":
        mesh, dt = grid((9, 10, 11), rectangular=True), 1 / 2048
    elif case in ("pulse13", "saved-endpoint13"):
        mesh, dt = grid((13,) * 3), 1 / 448
    q = flat(mesh.shape)
    if case == "flat4":
        steps = 4
    elif case == "varying":
        start, steps = 5, 2
    elif case == "schwarzschild9":
        q, start, steps = analytic_slots(9, 4), 0, 2
    elif case == "pulse13":
        q, _ = initial_slots(13)
        start, steps = 0, 2
        primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
        name = primary["cases"][2]["trajectory"][0]["array"]
        path = PRIMARY.parent / name
        assert sha(path) == primary["artifact_hashes"][name]
        assert q.tobytes() == np.load(path, allow_pickle=False).tobytes()
    elif case == "saved-endpoint13":
        primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
        name = primary["cases"][2]["trajectory"][-1]["array"]
        path = PRIMARY.parent / name
        assert sha(path) == primary["artifact_hashes"][name]
        q, start = np.load(path, allow_pickle=False), 28
    reference = (
        analytic_slots(mesh.shape[0], 4)
        if case in ("schwarzschild9", "pulse13", "saved-endpoint13")
        else q
    )
    table = targets_table(
        mesh, reference, start, steps, varying=case in ("varying", "rectangular")
    )
    thread_check = case in ("varying", "rectangular")
    arrays, meta = repeated(native_rk4, mesh, q, table, start, steps, dt, thread_check)
    compare(native_rk4, case, mesh, q, table, start, steps, dt, arrays, meta)
    if case in ("flat4", "upper17"):
        for row in arrays:
            for i in (0, 2, 4, 6, 8):
                assert row[i].tobytes() == q.tobytes()
            assert np.count_nonzero(row[[1, 3, 5, 7]]) == 0
    else:
        assert np.max(abs(arrays[-1, 8] - q)) > 1e-9
    native_rk4[1](
        kind="repeated-trajectory",
        case=case,
        repeated_stdout_byte_exact=True,
        threads_payload_byte_exact=[1, 2, 4] if thread_check else [1],
    )


def test_separate_process_raw_state_continuation_is_exact_not_checkpoint(native_rk4):
    mesh, q, start, dt = grid(), flat((9,) * 3), 5, 1 / 1024
    table = targets_table(mesh, q, start, 2, varying=True)
    full = unpack(native_rk4[0](pack(mesh, q, table, start, 2, dt)), mesh, start, 2, dt)
    first = unpack(
        native_rk4[0](pack(mesh, q, table[:3], start, 1, dt), 2), mesh, start, 1, dt, 2
    )
    second = unpack(
        native_rk4[0](pack(mesh, first[0][0, 8], table[2:], start + 1, 1, dt), 4),
        mesh,
        start + 1,
        1,
        dt,
        4,
    )
    assert np.concatenate((first[0], second[0])).tobytes() == full[0].tobytes()
    assert first[1]["trace"] + second[1]["trace"] == full[1]["trace"]
    native_rk4[1](
        kind="raw-state-process-continuation",
        first_threads=2,
        second_threads=4,
        uninterrupted_threads=1,
        trajectory_byte_exact=True,
        stage_reports_exact=True,
        native_checkpoint_supported=False,
    )


def test_largest_exact_half_step_indices(native_rk4):
    mesh, q, start, dt = grid(), flat((9,) * 3), 2**52 - 1, 1 / 1024
    table = targets_table(mesh, q, start, 1)
    arrays, meta = repeated(native_rk4, mesh, q, table, start, 1, dt)
    compare(
        native_rk4, "largest-exact-index", mesh, q, table, start, 1, dt, arrays, meta
    )
    assert [s["boundary_tick"] for s in meta["trace"][0]["stages"]] == [
        2**53 - 2,
        2**53 - 1,
        2**53 - 1,
        2**53,
    ]


def error_result(process):
    assert process.returncode != 0 and process.stdout == b""
    error = json.loads(process.stderr)
    assert error["schema"] == "nr-native-rk4-error-v1" and error["status"] == "rejected"
    assert error["fallback"] is False and error["scientificPayloadWriteback"] is False
    return error


@pytest.mark.parametrize(
    "kind,expected_stage", [("det-stage2", 2), ("profile-stage4", 4), ("cfl-stage2", 2)]
)
def test_actual_intermediate_state_failures_are_not_repaired(
    native_rk4, kind, expected_stage
):
    mesh, q, start, dt = grid(), flat((9,) * 3), 7, 1 / 1024
    if kind == "det-stage2":
        q[11] = 0.1
    elif kind == "profile-stage4":
        q[6], q[17], dt = np.log(1.997), -1.0, 0.001
    elif kind == "cfl-stage2":
        q[17], dt = -0.02, (0.25 / 24) * (1 - 1e-6)
    table = targets_table(mesh, q, start, 1)
    process = native_rk4[0](pack(mesh, q, table, start, 1, dt))
    error = error_result(process)
    assert error["attempted_step"] == start and error["stage"] == expected_stage
    assert error["boundary_tick"] == 2 * start + (0, 1, 1, 2)[expected_stage - 1]
    driver = TracedPython(mesh)
    with pytest.raises(ValueError):
        driver.step(q, start, dt, dict(table).__getitem__)
    assert driver.attempts == expected_stage
    native_rk4[1](
        kind="dynamic-stage-rejection",
        case=kind,
        native=error,
        python_attempted_stage=driver.attempts,
        no_output_or_fallback=True,
    )


@pytest.mark.parametrize(
    "kind",
    [
        "schema",
        "slot-count",
        "small-grid",
        "large-grid",
        "bounds",
        "zero-steps",
        "too-many-steps",
        "negative-start",
        "float-start",
        "overflow-start",
        "negative-steps",
        "zero-dt",
        "negative-dt",
        "nan-dt",
        "infinite-dt",
        "cfl-first",
        "empty",
        "long-header",
        "extra-header",
        "truncated",
        "truncated-final-target",
        "extra-payload",
        "missing-tick",
        "duplicate-tick",
        "wrong-middle-tick",
        "extra-target",
        "nan-state",
        "nan-late-target",
        "boundary-det-first",
        "negative-metric-first",
    ],
)
def test_invalid_input_and_targets_fail_closed(native_rk4, kind):
    mesh, q, start, steps, dt = grid(), flat((9,) * 3), 3, 1, 1 / 1024
    table = targets_table(mesh, q, start, steps)
    if kind in ("zero-steps", "too-many-steps", "negative-steps"):
        steps = {"zero-steps": 0, "too-many-steps": 5, "negative-steps": -1}[kind]
    elif kind in ("negative-start", "float-start", "overflow-start"):
        start = {"negative-start": -1, "float-start": 1.5, "overflow-start": 2**52}[
            kind
        ]
    elif kind in ("zero-dt", "negative-dt", "nan-dt", "infinite-dt", "cfl-first"):
        dt = {
            "zero-dt": 0,
            "negative-dt": -1,
            "nan-dt": np.nan,
            "infinite-dt": np.inf,
            "cfl-first": 1,
        }[kind]
    elif kind == "missing-tick":
        table = table[:2]
    elif kind == "duplicate-tick":
        table[1] = (table[0][0], table[1][1])
    elif kind == "wrong-middle-tick":
        table[1] = (99, table[1][1])
    elif kind == "extra-target":
        table.append((9, table[-1][1]))
    elif kind == "nan-state":
        q[17, 2, 3, 4] = np.nan
    elif kind == "nan-late-target":
        table[-1][1][5][57, 2, 3] = np.nan
    elif kind == "boundary-det-first":
        q[0, 0, 4, 4] = 1.01
    elif kind == "negative-metric-first":
        q[0, 4, 4, 4] = -1
    payload = pack(mesh, q, table, start, steps, dt)
    header, data = payload.split(b"\n", 1)
    replacements = {
        "schema": (b"input-v1", b"input-v2"),
        "slot-count": (b"58 9", b"57 9"),
        "small-grid": (b"58 9 9 9", b"58 8 9 9"),
        "large-grid": (b"58 9 9 9", b"58 18 9 9"),
        "bounds": (b"1 1 1 3 3 3", b"4 1 1 3 3 3"),
    }
    if kind in replacements:
        old, new = replacements[kind]
        assert old in header
        payload = header.replace(old, new, 1) + b"\n" + data
    elif kind == "empty":
        payload = b""
    elif kind == "long-header":
        payload = b"x" * 1024 + b"\n"
    elif kind == "extra-header":
        payload = header + b" extra\n" + data
    elif kind == "truncated":
        payload = payload[:100]
    elif kind == "truncated-final-target":
        payload = payload[:-1]
    elif kind == "extra-payload":
        payload += b"x"
    error = error_result(native_rk4[0](payload))
    if kind in ("cfl-first", "boundary-det-first", "negative-metric-first"):
        assert error["stage"] == 1 and error["attempted_step"] == 3
    else:
        assert error["phase"] == "input" and error["stage"] == 0


@pytest.mark.parametrize("mode", ["checkpoint", "periodic", "fixed-halo", "rk45"])
def test_unqualified_methods_rejected(native_rk4, mode):
    error_result(native_rk4[0](b"", mode=mode))


@pytest.mark.parametrize("threads", [0, -1, 3, 8, "1x"])
def test_invalid_thread_counts(native_rk4, threads):
    error_result(native_rk4[0](b"", threads=threads))

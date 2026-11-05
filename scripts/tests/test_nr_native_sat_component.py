"""Single-stage native SAT qualification; not an evolution or physical gate."""

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

from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import (
    CONFIG,
    GAUGE,
    PROFILE,
    NonlinearSBPCube,
    face,
    local_split,
)
from science.numerical_relativity.fo_ccz4_sbp_volume import SBPVolumeOperator
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

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / "science/numerical_relativity/cpp/sat_component"
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENTS = {
    "nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json": "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0",
    "nr-k3-native-characteristic-component-v1-20261009/receipt.json": "7a6094ddfbae5685f5d6cd9dde9dc47bcccdb910d78a5281d15d77569f3b59fb",
    "nr-k3-native-fo-principal-component-v1-20261009/receipt.json": "e216b8e83513dc23c4b4835a3c71b20144aed200686ee5a16c6eba27186a46b1",
    "nr-k3-native-sbp-volume-component-v2-20261010/receipt.json": "a9f55559c01fbdb982436283272ef5cbb811768f15273269c0bfa3be3abe8816",
}
LIBRARY = Path(
    "D:/python/Lib/site-packages/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll"
)
RUNTIMES = {
    LIBRARY: "6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5",
    Path(
        "C:/Windows/System32/vcomp140.dll"
    ): "95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf",
}
SOURCES = (
    COMPONENT / "CMakeLists.txt",
    COMPONENT / "sat.hpp",
    COMPONENT / "main.cpp",
    Path(__file__),
    ROOT / "science/numerical_relativity/EXPERIMENT-20261010-native-sat-component.md",
)
BUDGET = 512 * 1024**2


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + BUDGET, (
        "E reserve plus complete SAT component budget reached"
    )


@pytest.fixture(scope="session")
def native_sat():
    if "NR_NATIVE_SAT_EXE" not in os.environ:
        pytest.skip("explicit qualified native SAT executable required")
    reserve()
    executable = Path(os.environ["NR_NATIVE_SAT_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_SAT_EVIDENCE"]).resolve()
    assert executable.is_file() and executable.is_relative_to(ROOT / "tmp")
    assert directory.parent == EVIDENCE.resolve() and not directory.exists()
    assert all(sha(p) == digest for p, digest in RUNTIMES.items())
    sources_before = {p.relative_to(ROOT).as_posix(): sha(p) for p in SOURCES}
    inherited = {}
    for name, digest in PARENTS.items():
        path = EVIDENCE / name
        assert sha(path) == digest
        inherited.update(json.loads(path.read_text(encoding="utf-8"))["source_after"])
    assert all(sha(ROOT / p) == digest for p, digest in inherited.items())
    generated = sorted(
        (executable.parent.parent / "volume_dependency/generated").glob(
            "frozen_*.inc.hpp"
        )
    )
    assert len(generated) == 4
    volume_receipt = json.loads(
        (EVIDENCE / list(PARENTS)[-1]).read_text(encoding="utf-8")
    )
    expected_generated = {
        Path(p).name: digest for p, digest in volume_receipt["generated_after"].items()
    }
    assert {p.name: sha(p) for p in generated} == expected_generated
    directory.mkdir()
    started = time.monotonic()
    for path in generated:
        (directory / path.name).write_bytes(path.read_bytes())
    calls, comparisons = [], []
    identity = dict(
        schema="nr-native-sat-tests-v1",
        started_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        executable=str(executable),
        executable_sha256=sha(executable),
        source_before=sources_before,
        inherited_reference_keys=len(inherited),
        generated_before={p.relative_to(ROOT).as_posix(): sha(p) for p in generated},
        runtimes={str(p): digest for p, digest in RUNTIMES.items()},
        parent_receipts=PARENTS,
        component_only=True,
        sat_applied=True,
        evolution_backend=False,
        physical_gate=False,
        scientificPayloadWriteback=False,
        budget_bytes=BUDGET,
        deadline_seconds=900,
    )
    write_json(directory / "identity-before.json", identity)

    def invoke(payload, threads=1, mode="rhs", library=LIBRARY):
        reserve()
        remaining = 900 - (time.monotonic() - started)
        assert remaining > 0, "SAT component deadline"
        consumed = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
        # Reserve at least a worst-case three-request reply before launching.
        assert consumed + len(payload) + 20 * 1024**2 < BUDGET, "SAT artifact cap"
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
                timeout=min(120.0, remaining),
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
        reserve()
        return process

    def record(**row):
        comparisons.append(row)
        write_json(directory / f"comparison-{len(comparisons) - 1:04d}.json", row)

    yield invoke, record
    after = {p: sha(ROOT / p) for p in sources_before}
    generated_after = {p.relative_to(ROOT).as_posix(): sha(p) for p in generated}
    identity.update(
        source_after=after,
        source_unchanged=after == sources_before,
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
    assert identity["seconds"] <= 900
    assert sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) < BUDGET
    reserve()


def pack(mesh, requests, dt=0.001):
    fields = ["nr-native-sat-input-v1", "58", str(len(requests)), *map(str, mesh.shape)]
    fields.extend(f"{x:.17g}" for x in (*mesh.lower, *mesh.upper, dt))
    blocks = [(" ".join(fields) + "\n").encode("ascii")]
    for q, targets in requests:
        blocks.extend(
            np.asarray(x, dtype="<f8").tobytes(order="C") for x in (q, *targets)
        )
    return b"".join(blocks)


def unpack(process, mesh, count=1, threads=1):
    assert process.returncode == 0, process.stderr.decode(errors="replace")
    assert process.stderr == b""
    header, data = process.stdout.split(b"\n", 1)
    meta = json.loads(header)
    assert meta["schema"] == "nr-native-sat-output-v1"
    assert meta["shape"] == list(mesh.shape) and meta["spacing"] == list(mesh.spacing)
    assert meta["requests"] == count and meta["threads_observed"] == threads
    assert meta["openmp_version"] == 200203 and meta["blas_threads"] == 1
    assert Path(meta["blas_runtime"]).resolve() == LIBRARY.resolve()
    assert (
        Path(meta["openmp_runtime"]).resolve()
        == Path("C:/Windows/System32/vcomp140.dll").resolve()
    )
    assert "USE64BITINT" in meta["blas_config"]
    assert meta["frozen_equation_sha256"] == FROZEN_SHA
    assert meta["sat_applied"] is True and meta["component_only"] is True
    assert meta["coefficient_cache"] == "exact bytes within one RHS only"
    assert meta["tau_inverse"] == 1
    for flag in (
        "evolution_backend",
        "native_checkpoint_supported",
        "physical_gate",
        "auxiliaries_reconstructed",
        "algebraic_projection",
        "fixed_halo",
        "common_symmetrizer_validated",
        "nonlinear_stability_validated",
        "scientificPayloadWriteback",
    ):
        assert meta[flag] is False
    assert len(data) == meta["values"] * 8
    values = np.frombuffer(data, dtype="<f8")
    assert np.isfinite(values).all()
    offset, result = 0, []
    shapes = [(58, *mesh.shape)] * 2
    shapes += [
        (58, *(n for d, n in enumerate(mesh.shape) if d != a))
        for a in range(3)
        for _ in range(2)
    ]
    assert len(meta["reports"]) == count
    for report in meta["reports"]:
        arrays = []
        for shape in shapes:
            size = int(np.prod(shape))
            arrays.append(values[offset : offset + size].reshape(shape))
            offset += size
        result.append((arrays[0], arrays[1], arrays[2:], report))
    assert offset == len(values)
    return result, data


def repeated(native, mesh, requests, dt=0.001, thread_check=False):
    payload = pack(mesh, requests, dt)
    first = native[0](payload)
    result, data = unpack(first, mesh, len(requests))
    second = native[0](payload)
    assert second.stdout == first.stdout and second.stderr == first.stderr
    if thread_check:
        for threads in (2, 4):
            _, other = unpack(native[0](payload, threads), mesh, len(requests), threads)
            assert other == data, f"OpenMP{threads} numeric payload differs"
    return result


def mismatch(driver, q, ode_only=False):
    targets = [x.copy() for x in driver.boundary_targets(q)]
    for index, target in enumerate(targets):
        first, last = (0, 11) if ode_only else (11, 58)
        for v in range(first, last):
            ij = np.indices(target.shape[1:])
            target[v] += 0.001 * np.sin(
                0.17 * (v + 1) + 0.3 * index + 0.2 * ij[0] - 0.1 * ij[1]
            )
    return targets


def manufactured(mesh, constant=False):
    """Explicit SPD unit-determinant coefficients, NOT projection of any state."""
    q = flat(mesh.shape)
    x, y, z = mesh.coordinates
    phase = 0.0 if constant else 0.1 * x + 0.2 * y - 0.15 * z
    scale = np.exp(0.03 * np.sin(phase + 0.2))
    shear = 0.04 * np.cos(phase - 0.3)
    # L=[[scale,0,0],[shear,1/scale,0],[0,0,1]], det(L)=1.
    q[0], q[1], q[3] = scale**2, scale * shear, shear**2 + scale**-2
    q[6], q[10] = -0.3 + 0.01 * np.cos(phase), -0.2 + 0.02 * np.sin(phase)
    for v in range(7, 10):
        q[v] = 0.02 * np.sin(phase + v)
    for v in range(11, 58):
        q[v] = 0.0005 * np.cos(phase + v * 0.23)
    return q


def reference_faces(driver, q, targets):
    state = driver.state(q).base
    cache, additions = {}, []
    for axis in range(3):
        tangent = [d for d in range(3) if d != axis]
        for side in range(2):
            target = targets[2 * axis + side]
            addition = np.zeros_like(target)
            for ij in np.ndindex(target.shape[1:]):
                point = [0, 0, 0]
                point[axis] = 0 if side == 0 else driver.volume.grid.shape[axis] - 1
                for d, index in zip(tangent, ij, strict=True):
                    point[d] = index
                point = tuple(point)
                cell = q[(slice(None), *point)]
                key = (axis, cell[:11].tobytes())
                if key not in cache:
                    cache[key] = local_split(
                        state.h[point],
                        state.chi[point],
                        state.lapse[point],
                        state.shift[point],
                        axis,
                    )
                addition[(slice(None), *ij)] = cache[key].penalty(
                    cell - target[(slice(None), *ij)],
                    side,
                    driver.volume.axes[axis].norm_weights[0 if side == 0 else -1],
                )
            additions.append(addition)
    return additions, len(cache)


def compare(native, mesh, q, targets, result, dt=0.001, label=""):
    driver = NonlinearSBPCube(mesh)
    before = (q.tobytes(), tuple(t.tobytes() for t in targets))
    expected, report = driver.rhs(q, targets, dt)
    bulk_ref = np.asarray(
        _rhs_components(
            SBPVolumeOperator(mesh).rhs(
                driver.state(q),
                gauge=GAUGE,
                config=CONFIG,
                gauge_profile=PROFILE,
            )
        )
    )
    penalties_ref, builds = reference_faces(driver, q, targets)
    bulk, coupled, penalties, actual = result
    bulk_errors = regional_errors(bulk, bulk_ref, mesh)
    coupled_errors = regional_errors(coupled, expected, mesh)
    assert max(max(x) for x in bulk_errors.values()) <= 2e-11
    assert max(max(x) for x in coupled_errors.values()) <= 2e-11
    reconstructed = bulk.copy()
    errors = []
    for index, (addition, ref) in enumerate(zip(penalties, penalties_ref, strict=True)):
        by_slot = np.max(abs(addition - ref), axis=(1, 2)) / np.maximum(
            1.0, np.max(abs(ref), axis=(1, 2))
        )
        assert np.max(by_slot) <= 2e-11
        assert np.count_nonzero(addition[:11]) == 0
        target_face = face(reconstructed, index // 2, index % 2)
        target_face[11:] += addition[11:]
        errors.append(by_slot.tolist())
        assert actual["faces"][index]["axis"] == index // 2
        assert actual["faces"][index]["side"] == index % 2
        assert actual["faces"][index]["sat_max_abs"] == float(np.max(abs(addition)))
    assert reconstructed.tobytes() == coupled.tobytes(), "face/edge/corner sum differs"
    assert coupled[:11].tobytes() == bulk[:11].tobytes()
    assert coupled[:, 1:-1, 1:-1, 1:-1].tobytes() == bulk[:, 1:-1, 1:-1, 1:-1].tobytes()
    assert (
        actual["coefficients_sha256"]
        == report["coefficients_sha256"]
        == hashlib.sha256(q[:11].tobytes()).hexdigest()
    )
    assert actual["basis_builds"] == report["basis_builds"] == builds
    scalar_errors = {}
    for name in (
        "cfl",
        "min_lapse",
        "min_chi",
        "det_h_max_error",
        "sat_max_abs",
        "max_basis_condition",
    ):
        error = abs(actual[name] - report[name]) / max(1.0, abs(report[name]))
        threshold = (
            2e-10
            if name == "max_basis_condition"
            else (2e-11 if name == "sat_max_abs" else 2e-13)
        )
        assert error <= threshold, (name, error)
        scalar_errors[name] = error
    assert actual["max_characteristic_residual"] <= 2e-11
    assert actual["max_basis_condition"] <= 1e6
    assert before == (q.tobytes(), tuple(t.tobytes() for t in targets))
    native[1](
        kind="full58-coupled-parity",
        case=label,
        shape=list(mesh.shape),
        bulk_region_slot_errors=bulk_errors,
        coupled_region_slot_errors=coupled_errors,
        face_slot_errors=errors,
        report_scaled_errors=scalar_errors,
        basis_builds=builds,
        cfl=actual["cfl"],
        sat_max_abs=actual["sat_max_abs"],
        max_basis_condition=actual["max_basis_condition"],
        max_characteristic_residual=actual["max_characteristic_residual"],
        face_edge_corner_sum_byte_exact=True,
        ode_byte_unchanged=True,
    )


CASES = (
    "flat-match",
    "ode-target-only",
    "constant",
    "smooth",
    "rectangular",
    "upper17",
    "schwarzschild",
    "saved-initial",
    "saved-endpoint",
    "tiny-shift",
    "interior-det",
    "interior-speed",
)


@pytest.mark.parametrize("case", CASES)
def test_full58_stage_local_coupling(native_sat, case):
    mesh = grid()
    if case == "rectangular":
        mesh = grid((9, 10, 11), rectangular=True)
    elif case == "upper17":
        mesh = grid((17, 17, 17))
    q = flat(mesh.shape)
    if case in ("constant", "smooth", "rectangular", "upper17"):
        q = manufactured(mesh, constant=case in ("constant", "upper17"))
        if case == "upper17":
            q[25] += 0.001 * np.sin(mesh.coordinates[0])
    elif case == "schwarzschild":
        q = analytic_slots(9, 4)
    elif case.startswith("saved-"):
        primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
        entry = primary["cases"][2]["trajectory"][0 if case == "saved-initial" else -1]
        path = PRIMARY.parent / entry["array"]
        assert sha(path) == primary["artifact_hashes"][entry["array"]]
        q = np.load(path, allow_pickle=False)
        mesh = grid(q.shape[1:])
    elif case == "tiny-shift":
        q[7], q[8], q[9] = 1e-13, -1e-13, 3e-14
    elif case == "interior-det":
        q[0, 4, 4, 4] += 0.0001
    elif case == "interior-speed":
        q[7:10, 4, 4, 4] = (7.0, -5.0, 3.0)
    driver = NonlinearSBPCube(mesh)
    if case in ("flat-match", "interior-det", "interior-speed"):
        targets = driver.boundary_targets(q)
    elif case == "ode-target-only":
        targets = mismatch(driver, q, ode_only=True)
        # Targets are data, not the current geometry used for propagation.
        for target in targets:
            target[0], target[6], target[10] = -100, 999, -999
    elif case.startswith("saved-"):
        targets = driver.boundary_targets(analytic_slots(mesh.shape[0], 4))
    else:
        targets = mismatch(driver, q)
    thread_check = case in ("flat-match", "rectangular", "upper17", "saved-endpoint")
    result = repeated(native_sat, mesh, [(q, targets)], thread_check=thread_check)[0]
    compare(native_sat, mesh, q, targets, result, label=case)
    if case in (
        "flat-match",
        "ode-target-only",
        "saved-initial",
        "interior-det",
        "interior-speed",
    ):
        assert all(np.count_nonzero(p) == 0 for p in result[2])
    else:
        assert result[3]["sat_max_abs"] > 1e-9
    if case == "interior-det":
        assert result[3]["det_h_max_error"] > 9e-5
    if case == "interior-speed":
        np.testing.assert_array_equal(result[3]["axis_max_speeds"], [9.0, 7.0, 5.0])
    native_sat[1](
        kind="repeated-stage",
        case=case,
        repeated_stdout_byte_exact=True,
        threads_payload_byte_exact=[1, 2, 4] if thread_check else [1],
    )


@pytest.mark.parametrize("axis", [0, 1, 2])
@pytest.mark.parametrize("side", [0, 1])
@pytest.mark.parametrize("incoming", [True, False])
def test_signed_single_characteristic_and_endpoint_weight(
    native_sat, axis, side, incoming
):
    mesh, q = grid((9, 10, 11), rectangular=True), flat((9, 10, 11))
    driver = NonlinearSBPCube(mesh)
    split = local_split(np.eye(3), 1.0, 1.0, np.zeros(3), axis)
    direction = (-1 if side == 0 else 1) * (1 if incoming else -1)
    chosen = int(np.argmax(direction * split.roots))
    vector, speed = split.basis[:, chosen], float(split.roots[chosen])
    jump = 0.001 * vector
    targets = [t.copy() for t in driver.boundary_targets(q)]
    target = targets[2 * axis + side]
    point = (target.shape[1] // 2, target.shape[2] // 2)
    target[(slice(None), *point)] -= jump
    bulk, coupled, penalties, _ = repeated(native_sat, mesh, [(q, targets)])[0]
    expected = (
        jump * speed * (1 if side == 0 else -1) / (17 * mesh.spacing[axis] / 48)
        if incoming
        else np.zeros(58)
    )
    actual = penalties[2 * axis + side][(slice(None), *point)]
    error = float(np.max(abs(actual - expected)))
    assert error <= (2e-11 if incoming else 2e-12)
    assert np.count_nonzero(bulk) == 0
    assert all(
        np.count_nonzero(p) == 0
        for i, p in enumerate(penalties)
        if i != 2 * axis + side
    )
    if incoming:
        assert np.max(abs(actual)) > 1e-4
        assert float(jump @ actual) < 0
    else:
        assert np.max(abs(coupled)) <= 2e-12
    native_sat[1](
        kind="signed-characteristic-control",
        axis=axis,
        side=side,
        incoming=incoming,
        speed=speed,
        max_abs_error=error,
        repeated_stdout_byte_exact=True,
    )


def test_fresh_call_scoped_cache_and_exact_key_bytes(native_sat):
    mesh = grid()
    q_a = manufactured(mesh, constant=True)
    q_b = q_a.copy()
    q_b[6] += 0.1
    q_b[10] += 0.04
    q_b[7] += 0.03
    q_b[25] += 0.0002
    driver = NonlinearSBPCube(mesh)
    targets = mismatch(driver, q_a)
    requests = [(q_a, targets), (q_b, targets), (q_a, targets)]
    results = repeated(native_sat, mesh, requests)
    for label, (q, target), result in zip(
        ("cache-A", "cache-B", "cache-A-return"), requests, results, strict=True
    ):
        compare(native_sat, mesh, q, target, result, label=label)
        assert result[3]["basis_builds"] == 3
    assert results[0][1].tobytes() == results[2][1].tobytes()
    assert results[0][3] == results[2][3]
    assert results[0][3]["coefficients_sha256"] != results[1][3]["coefficients_sha256"]
    assert np.max(abs(results[0][1] - results[1][1])) > 1e-5
    q = flat(mesh.shape)
    # Every Cartesian face contains both signs; a one-axis stripe does not.
    checkerboard = np.sum(np.indices(mesh.shape), axis=0) % 2 == 0
    q[7, checkerboard] = -0.0
    targets = mismatch(driver, q)
    result = repeated(native_sat, mesh, [(q, targets)])[0]
    compare(native_sat, mesh, q, targets, result, label="signed-zero-keys")
    assert result[3]["basis_builds"] == 6
    native_sat[1](
        kind="cache-scope",
        aba_reports_exact=True,
        fresh_builds=[3, 3, 3],
        signed_zero_builds=6,
    )


@pytest.mark.parametrize("factor,accepted", [(1 - 1e-10, True), (1 + 1e-10, False)])
def test_cfl_threshold_without_silent_timestep_change(native_sat, factor, accepted):
    mesh, q = grid(), flat((9, 9, 9))
    driver = NonlinearSBPCube(mesh)
    targets = driver.boundary_targets(q)
    dt = (0.25 / 24) * factor
    result = native_sat[0](pack(mesh, [(q, targets)], dt))
    if accepted:
        parsed, _ = unpack(result, mesh)
        compare(native_sat, mesh, q, targets, parsed[0], dt, "CFL-near-cap")
        assert parsed[0][3]["cfl"] == 24 * dt
    else:
        assert result.returncode != 0 and result.stdout == b""
        assert b"CFL cap" in result.stderr
        with pytest.raises(ValueError, match="CFL cap"):
            driver.rhs(q, targets, dt)


@pytest.mark.parametrize(
    "kind",
    [
        "wrong-schema",
        "wrong-slots",
        "zero-requests",
        "too-many-requests",
        "small-grid",
        "large-grid",
        "bounds",
        "empty",
        "long-header",
        "extra-header",
        "truncated",
        "truncated-target",
        "trailing",
        "nan-state",
        "infinite-state",
        "nan-target",
        "infinite-target",
        "negative-metric",
        "singular-metric",
        "boundary-det",
        "boundary-det-zero-jump",
        "late-request-det",
        "lapse-upper",
        "lapse-underflow",
        "chi-overflow",
        "chi-underflow",
        "zero-dt",
        "negative-dt",
        "nan-dt",
        "infinite-dt",
        "excess-cfl",
        "overflow-jump",
        "overflow-volume",
    ],
)
def test_fail_closed_without_any_batch_output(native_sat, kind):
    mesh, q = grid(), flat((9, 9, 9))
    driver = NonlinearSBPCube(mesh)
    targets = [t.copy() for t in driver.boundary_targets(q)]
    dt = 0.001
    if kind in ("nan-state", "infinite-state"):
        q[33, 1, 2, 3] = np.nan if kind == "nan-state" else np.inf
    elif kind in ("nan-target", "infinite-target"):
        targets[4][33, 1, 2] = np.nan if kind == "nan-target" else np.inf
    elif kind in ("negative-metric", "singular-metric"):
        q[0, 4, 4, 4] = -1 if kind == "negative-metric" else 0
    elif kind.startswith("boundary-det"):
        q[0, 0, 4, 4] += 1e-8
        if kind == "boundary-det-zero-jump":
            targets = driver.boundary_targets(q)
    elif kind in ("lapse-upper", "lapse-underflow"):
        q[6, 4, 4, 4] = 1 if kind == "lapse-upper" else -1000
    elif kind in ("chi-overflow", "chi-underflow"):
        q[10, 4, 4, 4] = 1000 if kind == "chi-overflow" else -1000
    elif kind in ("zero-dt", "negative-dt", "nan-dt", "infinite-dt", "excess-cfl"):
        dt = {
            "zero-dt": 0,
            "negative-dt": -0.1,
            "nan-dt": np.nan,
            "infinite-dt": np.inf,
            "excess-cfl": 1,
        }[kind]
    elif kind == "overflow-jump":
        # ODE-only target causes subtraction overflow, not a physical coefficient change.
        q[7] = 1e307
        targets[0][7, 0, 0] = -1.79e308
        dt = 1e-310
    elif kind == "overflow-volume":
        q[17, 4, 4, 4] = 1e200
    requests = [(q, targets)]
    if kind == "late-request-det":
        bad = q.copy()
        bad[0, 0, 4, 4] += 1e-8
        requests.append((bad, targets))
    payload = pack(mesh, requests, dt)
    header, data = payload.split(b"\n", 1)
    replacements = {
        "wrong-schema": (b"input-v1", b"input-v2"),
        "wrong-slots": (b" 58 ", b" 57 "),
        "zero-requests": (b"58 1 ", b"58 0 "),
        "too-many-requests": (b"58 1 ", b"58 4 "),
        "small-grid": (b"1 9 9 9", b"1 8 9 9"),
        "large-grid": (b"1 9 9 9", b"1 18 9 9"),
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
    elif kind == "truncated-target":
        payload = payload[:-1]
    elif kind == "trailing":
        payload += b"x"
    process = native_sat[0](payload, threads=4)
    assert process.returncode != 0 and process.stdout == b""
    assert b"native SAT component rejected:" in process.stderr
    if kind == "overflow-jump":
        assert b"nonfinite boundary jump" in process.stderr


@pytest.mark.parametrize("threads", [0, -1, 3, 8, "1x"])
def test_invalid_threads(native_sat, threads):
    mesh, q = grid(), flat((9, 9, 9))
    process = native_sat[0](
        pack(mesh, [(q, NonlinearSBPCube(mesh).boundary_targets(q))]), threads
    )
    assert process.returncode != 0 and process.stdout == b""


@pytest.mark.parametrize("mode", ["rk4", "checkpoint", "periodic", "fixed-halo"])
def test_no_unqualified_method_alias(native_sat, mode):
    process = native_sat[0](b"", mode=mode)
    assert process.returncode != 0 and process.stdout == b""


@pytest.mark.parametrize(
    "path",
    [
        "relative.dll",
        "E:/definitely-missing-nr-lapack.dll",
        "C:/Windows/System32/kernel32.dll",
    ],
)
def test_lapack_path_or_abi_failure(native_sat, path):
    process = native_sat[0](b"", library=path)
    assert process.returncode != 0 and process.stdout == b""

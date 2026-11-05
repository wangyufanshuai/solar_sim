"""Qualified native SBP volume controls; no SAT, evolution, or physical gate."""

from __future__ import annotations

from dataclasses import replace
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
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import CONFIG, GAUGE, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import (
    SBPVolumeOperator,
    state_from_slots,
)
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots
from science.numerical_relativity.nr3d import Grid3D
from science.numerical_relativity.sbp_boundary_operator import SBP42

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / "science/numerical_relativity/cpp/sbp_volume_component"
FROZEN = COMPONENT.parent / "nr_k2_fo_ccz4_shadow.cpp"
FROZEN_SHA = "6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457"
RUNTIME_SHA = "95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf"
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENTS = {
    "nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json": "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0",
    "nr-k3-native-characteristic-component-v1-20261009/receipt.json": "7a6094ddfbae5685f5d6cd9dde9dc47bcccdb910d78a5281d15d77569f3b59fb",
    "nr-k3-native-fo-principal-component-v1-20261009/receipt.json": "e216b8e83513dc23c4b4835a3c71b20144aed200686ee5a16c6eba27186a46b1",
}
PRIMARY = EVIDENCE / next(iter(PARENTS))
SOURCES = (
    *sorted(COMPONENT.glob("*.hpp")),
    COMPONENT / "main.cpp",
    COMPONENT / "CMakeLists.txt",
    FROZEN,
    Path(__file__),
    ROOT
    / "science/numerical_relativity/EXPERIMENT-20261009-native-sbp-volume-component.md",
)
SHAPES = ((9, 9, 9), (9, 10, 11), (17, 17, 17))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.write_text(
        json.dumps(value, sort_keys=True, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + (32 + 256) * 1024**2, (
        "E reserve plus complete component budget reached"
    )


@pytest.fixture(scope="session")
def native_volume():
    if "NR_NATIVE_SBP_VOLUME_EXE" not in os.environ:
        pytest.skip("explicit qualified native SBP volume build required")
    assert os.name == "nt"
    reserve()
    executable = Path(os.environ["NR_NATIVE_SBP_VOLUME_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_SBP_VOLUME_EVIDENCE"]).resolve()
    runtime = Path("C:/Windows/System32/vcomp140.dll").resolve()
    assert executable.is_file() and executable.is_relative_to(ROOT / "tmp")
    assert directory.parent == EVIDENCE.resolve() and not directory.exists()
    assert sha(FROZEN) == FROZEN_SHA and sha(runtime) == RUNTIME_SHA
    generated = sorted(
        (executable.parent.parent / "generated").glob("frozen_*.inc.hpp")
    )
    assert len(generated) == 4
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in SOURCES}
    assert len(before) == 7
    source_reference = {}
    for name, digest in PARENTS.items():
        path = EVIDENCE / name
        assert sha(path) == digest
        source_reference.update(
            json.loads(path.read_text(encoding="utf-8"))["source_after"]
        )
    for name, digest in source_reference.items():
        assert sha(ROOT / name) == digest
    directory.mkdir()
    started = time.monotonic()
    generated_before = {p.relative_to(ROOT).as_posix(): sha(p) for p in generated}
    for path in generated:
        (directory / path.name).write_bytes(path.read_bytes())
    identity = dict(
        schema="nr-native-sbp-volume-tests-v1",
        started_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        executable=str(executable),
        executable_sha256=sha(executable),
        openmp_runtime=str(runtime),
        openmp_runtime_sha256=RUNTIME_SHA,
        source_before=before,
        generated_before=generated_before,
        parent_receipts=PARENTS,
        physical_gate=False,
        evolution_backend=False,
        sat_applied=False,
        scientificPayloadWriteback=False,
    )
    write_json(directory / "identity-before.json", identity)
    calls, comparisons = [], []

    def invoke(payload, mode="rhs", threads=1):
        reserve()
        remaining = 600 - (time.monotonic() - started)
        assert remaining > 0, "native SBP component deadline"
        assert (
            sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
            < 256 * 1024**2
        )
        index = len(calls)
        stem = f"call-{index:04d}"
        command = [str(executable), "--mode", mode, "--threads", str(threads)]
        row = dict(index=index, command=command, status="attempted", returncode=None)
        calls.append(row)
        (directory / (stem + ".input.bin")).write_bytes(payload)
        write_json(directory / (stem + ".json"), row)
        env = dict(
            os.environ,
            OPENBLAS_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            OMP_NUM_THREADS=str(threads),
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
                timeout=min(30.0, remaining),
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

    yield invoke, record, generated
    after = {name: sha(ROOT / name) for name in before}
    generated_after = {name: sha(ROOT / name) for name in generated_before}
    reference_unchanged = all(
        sha(ROOT / name) == digest for name, digest in source_reference.items()
    )
    identity.update(
        source_after=after,
        source_unchanged=after == before,
        generated_after=generated_after,
        generated_unchanged=generated_before == generated_after,
        frozen_reference_keys_checked=len(source_reference),
        frozen_reference_unchanged=reference_unchanged,
        executable_unchanged=sha(executable) == identity["executable_sha256"],
        runtime_unchanged=sha(runtime) == RUNTIME_SHA,
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
    assert (
        before == after and generated_before == generated_after and reference_unchanged
    )
    assert identity["executable_unchanged"] and identity["runtime_unchanged"]
    reserve()


def grid(shape=(9, 9, 9), rectangular=False):
    return Grid3D(
        shape,
        (-0.5, 1.0, 0.25) if rectangular else (1.0,) * 3,
        (1.5, 4.0, 1.75) if rectangular else (3.0,) * 3,
        boundary="sbp-volume",
        spatial_order=4,
    )


def pack(mesh, q=None, tau=1.0):
    fields = ["nr-native-sbp-volume-input-v1", "58", *map(str, mesh.shape)]
    fields.extend(f"{value:.17g}" for value in (*mesh.lower, *mesh.upper, tau))
    header = (" ".join(fields) + "\n").encode("ascii")
    return (
        header if q is None else header + np.asarray(q, dtype="<f8").tobytes(order="C")
    )


def unpack(process, mesh, mode, threads):
    assert process.returncode == 0, process.stderr.decode(errors="replace")
    assert process.stderr == b""
    header, data = process.stdout.split(b"\n", 1)
    identity = json.loads(header)
    assert identity["schema"] == "nr-native-sbp-volume-output-v1"
    assert identity["shape"] == list(mesh.shape) and identity["spacing"] == list(
        mesh.spacing
    )
    assert identity["mode"] == mode and identity["threads_observed"] == threads
    assert identity["openmp_version"] == 200203
    assert (
        Path(identity["openmp_runtime"]).resolve()
        == Path("C:/Windows/System32/vcomp140.dll").resolve()
    )
    assert identity["frozen_equation_sha256"] == FROZEN_SHA
    assert identity["boundary"] == "sbp-volume" and identity["interior_order"] == 4
    assert identity["boundary_order"] == 2 and identity["component_only"] is True
    for key in (
        "fixed_halo",
        "sat_applied",
        "auxiliaries_reconstructed",
        "algebraic_projection",
        "evolution_backend",
        "physical_gate",
        "scientificPayloadWriteback",
    ):
        assert identity[key] is False
    assert len(data) == identity["values"] * 8
    values = np.frombuffer(data, dtype="<f8")
    assert np.isfinite(values).all()
    return values, data


def repeated(native, mesh, q=None, tau=1.0, mode="rhs", thread_check=False):
    invoke = native[0]
    payload = pack(mesh, q, tau)
    first = invoke(payload, mode, 1)
    values, data = unpack(first, mesh, mode, 1)
    second = invoke(payload, mode, 1)
    assert first.stdout == second.stdout and first.stderr == second.stderr
    if thread_check:
        for threads in (2, 4):
            _, other = unpack(invoke(payload, mode, threads), mesh, mode, threads)
            assert other == data, f"thread{threads} changes numeric bytes"
    return values


def flat(shape):
    q = np.zeros((58, *shape))
    q[[0, 3, 5]] = 1.0
    return q


def synthetic(mesh, constant=False):
    q = flat(mesh.shape)
    xyz = mesh.coordinates
    for slot in range(58):
        if constant:
            perturbation = 0.002 * (0.1 + np.sin(0.31 * (slot + 1)))
        else:
            perturbation = 0.003 * np.sin(
                (0.2 + 0.007 * slot) * xyz[0] + 0.3 * xyz[1] - 0.17 * xyz[2]
            ) + 0.001 * np.cos(0.13 * slot + xyz[2] * 0.2)
        q[slot] += perturbation
    q[6] -= 0.3
    q[10] -= 0.2
    return q


def regional_errors(actual, expected, mesh):
    indices = np.indices(mesh.shape)
    surface_count = np.zeros(mesh.shape, dtype=int)
    interior = np.ones(mesh.shape, dtype=bool)
    for axis, n in enumerate(mesh.shape):
        surface_count += (indices[axis] == 0) | (indices[axis] == n - 1)
        interior &= (indices[axis] >= 4) & (indices[axis] < n - 4)
    masks = {
        "whole": np.ones(mesh.shape, bool),
        "interior": interior,
        "closure_band": ~interior,
        "faces": surface_count == 1,
        "edges": surface_count == 2,
        "corners": surface_count == 3,
    }
    result = {}
    for name, mask in masks.items():
        reference = expected[:, mask]
        result[name] = (
            np.max(abs(actual[:, mask] - reference), axis=1)
            / np.maximum(1.0, np.max(abs(reference), axis=1))
        ).tolist()
    return result


def test_generated_equations_equal_frozen_body_with_only_declared_adaptations(
    native_volume,
):
    _, record, generated = native_volume
    source = FROZEN.read_text(encoding="utf-8")
    markers = {
        "variables": ("enum Variable : std::size_t {", "struct Options {"),
        "geometry": (
            "using Vec3 = std::array<double, 3>;",
            "// The C++ shadow uses the same fixed-parameter FO-CCZ4 ordering",
        ),
        "constants": ("constexpr double kFoKappa1 = 0.1;", "struct DynamicRHS {"),
        "rhs": ("DynamicRHS fo_rhs(const State &state) {", "State state_add("),
    }
    halo = (
        "    // Analytic Dirichlet data: zero all halo RHS at EVERY RK stage.\n"
        "    // No replacement of the evolved interior or its auxiliary variables.\n"
        "    if (in_prescribed_halo(state, flat)) continue;\n"
    )
    for name, (start, end) in markers.items():
        assert source.count(start) == source.count(end) == 1
        expected = source[source.index(start) : source.index(end)]
        if name == "rhs":
            for old, new in (
                ("DynamicRHS rhs(state.points);", "DynamicRHS rhs(state.cells());"),
                ("state.points * state.points * state.points", "state.cells()"),
                (halo, "    // Every SBP volume node is active; no prescribed halo.\n"),
            ):
                assert expected.count(old) == 1
                expected = expected.replace(old, new)
        path = next(p for p in generated if p.name == f"frozen_{name}.inc.hpp")
        assert path.read_bytes() == expected.encode("utf-8")
    record(
        kind="frozen-equation-extraction",
        exact_generated_blocks=4,
        declared_rhs_adaptations=3,
    )


@pytest.mark.parametrize("shape", SHAPES)
def test_sbp_matrices_norms_and_polynomial_controls(native_volume, shape):
    mesh = grid(shape, rectangular=True)
    values = repeated(native_volume, mesh, mode="operators")
    offset, errors = 0, []
    for n, dx in zip(shape, mesh.spacing, strict=True):
        matrix = values[offset : offset + n * n].reshape(n, n)
        offset += n * n
        weights = values[offset : offset + n]
        offset += n
        reference = SBP42(n, dx)
        np.testing.assert_allclose(matrix, reference.matrix(), atol=2e-13, rtol=0)
        np.testing.assert_array_equal(weights, reference.norm_weights)
        boundary = np.zeros((n, n))
        boundary[0, 0], boundary[-1, -1] = -1.0, 1.0
        energy_error = float(
            np.max(abs(weights[:, None] * matrix + matrix.T * weights - boundary))
        )
        assert energy_error <= 2e-13
        x = np.arange(n) * dx
        polynomial_errors = []
        for power in range(5):
            target = np.zeros(n) if power == 0 else power * x ** (power - 1)
            error = matrix @ x**power - target
            selected = error if power <= 2 else error[4:-4]
            polynomial_errors.append(float(np.max(abs(selected))))
        assert max(polynomial_errors) <= 2e-11
        errors.append(
            dict(sbp_identity_error=energy_error, polynomial_errors=polynomial_errors)
        )
    assert offset == len(values)
    native_volume[1](
        kind="SBP-matrix-controls",
        shape=list(shape),
        axes=errors,
        repeated_stdout_byte_exact=True,
    )


@pytest.mark.parametrize("shape", SHAPES)
@pytest.mark.parametrize("axis", [0, 1, 2])
@pytest.mark.parametrize("profile", ["constant", "polynomial-trigonometric"])
def test_packed58_directional_derivatives(native_volume, shape, axis, profile):
    mesh = grid(shape, rectangular=True)
    x, y, z = mesh.coordinates
    q = np.ones((58, *shape))
    for slot in range(58):
        q[slot] *= 0.01 * (slot + 1)
        if profile != "constant":
            q[slot] += (1 + slot * 0.01) * (
                x * x + 0.3 * y * y * y + 0.2 * z**4
            ) + np.sin(x + y + z + slot * 0.1)
    mode = ("dx", "dy", "dz")[axis]
    actual = repeated(native_volume, mesh, q, mode=mode).reshape(q.shape)
    expected = SBP42(shape[axis], mesh.spacing[axis]).derivative(q, axis=axis + 1)
    error = float(np.max(abs(actual - expected))) / max(
        1.0, float(np.max(abs(expected)))
    )
    assert error <= 2e-13
    if profile == "constant":
        assert np.count_nonzero(actual) == 0
    native_volume[1](
        kind="packed-derivative",
        shape=list(shape),
        axis=axis,
        profile=profile,
        max_error_scaled=error,
        repeated_stdout_byte_exact=True,
    )


@pytest.mark.parametrize(
    "case",
    [
        "flat",
        "flat-rectangular",
        "constant-tau0",
        "constant-tau1",
        "smooth",
        "smooth-rectangular",
        "smooth17",
        "schwarzschild",
        "saved-initial",
        "saved-endpoint",
    ],
)
def test_full58_nonlinear_volume_and_thread_determinism(native_volume, case):
    mesh, tau = grid(), 1.0
    if case in ("flat-rectangular", "smooth-rectangular"):
        mesh = grid((9, 10, 11), rectangular=True)
    if case == "smooth17":
        mesh = grid((17, 17, 17))
    q = flat(mesh.shape)
    if case.startswith("constant-"):
        q = synthetic(mesh, constant=True)
        tau = 0.0 if case == "constant-tau0" else 1.0
    elif case.startswith("smooth"):
        q = synthetic(mesh)
    elif case == "schwarzschild":
        q = analytic_slots(9, 4)
    elif case.startswith("saved-"):
        primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
        entry = primary["cases"][2]["trajectory"][0 if case == "saved-initial" else -1]
        path = PRIMARY.parent / entry["array"]
        assert sha(path) == primary["artifact_hashes"][entry["array"]]
        q = np.load(path, allow_pickle=False)
        mesh = grid(q.shape[1:])
    before = q.tobytes()
    state = state_from_slots(mesh, q)
    expected = np.asarray(
        _rhs_components(
            SBPVolumeOperator(mesh).rhs(
                state,
                gauge=GAUGE,
                config=replace(CONFIG, tau_inverse=tau),
                gauge_profile=PROFILE,
            )
        )
    )
    actual = repeated(native_volume, mesh, q, tau, thread_check=True).reshape(q.shape)
    errors = regional_errors(actual, expected, mesh)
    assert max(max(values) for values in errors.values()) <= 2e-11
    assert before == q.tobytes()
    if case.startswith("flat"):
        assert np.count_nonzero(actual) == 0
    surface_max = max(
        float(np.max(abs(np.take(actual, side, axis=axis + 1))))
        for axis in range(3)
        for side in (0, -1)
    )
    if case in ("schwarzschild", "saved-initial", "saved-endpoint"):
        assert surface_max > 1e-8, "surface RHS was silently clamped"
    native_volume[1](
        kind="full58-volume",
        case=case,
        shape=list(mesh.shape),
        tau_inverse=tau,
        region_slot_errors_scaled=errors,
        surface_max_abs=surface_max,
        threads_payload_byte_exact=[1, 2, 4],
        repeated_stdout_byte_exact=True,
    )


def test_constant_auxiliary_ode_and_relaxation_sources_without_reconstruction(
    native_volume,
):
    invoke, record, _ = native_volume
    mesh = grid()
    q = synthetic(mesh, constant=True)
    result = []
    for tau in (0.0, 1.0):
        values, _ = unpack(invoke(pack(mesh, q, tau)), mesh, "rhs", 1)
        result.append(values.reshape(q.shape))
    cell = q[:, 0, 0, 0]
    h = np.array(
        [
            [cell[0], cell[1], cell[2]],
            [cell[1], cell[3], cell[4]],
            [cell[2], cell[4], cell[5]],
        ]
    )
    a = np.array(
        [
            [cell[11], cell[12], cell[13]],
            [cell[12], cell[14], cell[15]],
            [cell[13], cell[15], cell[16]],
        ]
    )
    alpha, chi = np.exp(cell[6]), np.exp(2 * cell[10])
    beta, b, aux_a, aux_b, p = (
        cell[7:10],
        cell[22:25],
        cell[25:28],
        cell[28:37].reshape(3, 3),
        cell[55:58],
    )
    np.testing.assert_allclose(
        result[0][6], -2 * (cell[17] - 2 * cell[18]) + beta @ aux_a, atol=2e-13, rtol=0
    )
    np.testing.assert_allclose(
        result[0][7:10, 0, 0, 0], 3 * alpha * chi * b + beta @ aux_b, atol=2e-13, rtol=0
    )
    np.testing.assert_allclose(
        result[0][10],
        (alpha * cell[17] - np.trace(aux_b)) / 3 + beta @ p,
        atol=2e-13,
        rtol=0,
    )
    expected = np.zeros_like(q)
    trace_a = np.sum(np.linalg.inv(h) * a)
    for offset, (i, j) in enumerate((i, j) for i in range(3) for j in range(i, 3)):
        expected[offset] = -(np.linalg.det(h) - 1) * h[i, j]
        expected[11 + offset] = -h[i, j] * trace_a
    delta = result[1] - result[0]
    error = float(np.max(abs(delta - expected)))
    assert error <= 2e-13 and np.max(abs(expected)) > 1e-5
    record(
        kind="independent-auxiliary-and-relaxation-control",
        max_abs_error=error,
        auxiliary_fields_reconstructed=False,
        algebraic_projection=False,
    )


@pytest.mark.parametrize(
    "kind",
    [
        "wrong-schema",
        "wrong-count",
        "too-few-nodes",
        "too-many-nodes",
        "reverse-bounds",
        "nan-bound",
        "missing-header",
        "long-header",
        "trailing-header",
        "truncated",
        "trailing-payload",
        "nan-field",
        "infinite-field",
        "negative-metric",
        "singular-metric",
        "indefinite-metric",
        "lapse-overflow",
        "lapse-underflow",
        "lapse-upper",
        "chi-overflow",
        "chi-underflow",
        "negative-tau",
        "infinite-tau",
        "byte-swapped",
    ],
)
def test_invalid_volume_input_rejected_without_output(native_volume, kind):
    mesh, q, tau = grid(), flat((9, 9, 9)), 1.0
    if kind in ("nan-field", "infinite-field"):
        q[33, 1, 2, 3] = np.nan if kind == "nan-field" else np.inf
    elif kind == "negative-metric":
        q[0] = -1
    elif kind == "singular-metric":
        q[0] = 0
    elif kind == "indefinite-metric":
        q[0] = q[3] = -1
    elif kind.startswith("lapse-"):
        q[6] = {
            "lapse-overflow": 1000.0,
            "lapse-underflow": -1000.0,
            "lapse-upper": 1.0,
        }[kind]
    elif kind.startswith("chi-"):
        q[10] = 1000.0 if kind == "chi-overflow" else -1000.0
    elif kind == "negative-tau":
        tau = -1
    elif kind == "infinite-tau":
        tau = np.inf
    payload = pack(mesh, q, tau)
    header, data = payload.split(b"\n", 1)
    replacements = {
        "wrong-schema": (b"input-v1", b"input-v2"),
        "wrong-count": (b" 58 ", b" 57 "),
        "too-few-nodes": (b"58 9 9 9", b"58 8 9 9"),
        "too-many-nodes": (b"58 9 9 9", b"58 18 9 9"),
        "reverse-bounds": (b"1 1 1 3 3 3", b"4 1 1 3 3 3"),
        "nan-bound": (b"1 1 1 3 3 3", b"nan 1 1 3 3 3"),
    }
    if kind in replacements:
        old, new = replacements[kind]
        assert old in header
        payload = header.replace(old, new, 1) + b"\n" + data
    elif kind == "missing-header":
        payload = b""
    elif kind == "long-header":
        payload = b"x" * 1024 + b"\n"
    elif kind == "trailing-header":
        payload = header + b" extra\n" + data
    elif kind == "truncated":
        payload = payload[:-1]
    elif kind == "trailing-payload":
        payload += b"x"
    elif kind == "byte-swapped":
        payload = header + b"\n" + q.astype(">f8").tobytes()
    result = native_volume[0](payload)
    assert result.returncode != 0 and result.stdout == b""
    assert b"native SBP volume rejected:" in result.stderr


@pytest.mark.parametrize("threads", [0, -1, 3, 8, "1x"])
def test_invalid_thread_count_rejected(native_volume, threads):
    result = native_volume[0](pack(grid(), flat((9, 9, 9))), threads=threads)
    assert result.returncode != 0 and result.stdout == b""


@pytest.mark.parametrize("mode", ["periodic", "checkpoint", "sat", "unknown"])
def test_no_legacy_evolution_or_boundary_alias(native_volume, mode):
    result = native_volume[0](pack(grid(), flat((9, 9, 9))), mode=mode)
    assert result.returncode != 0 and result.stdout == b""


@pytest.mark.parametrize("mode", ["dx", "rhs"])
def test_nonfinite_intermediate_computation_is_rejected(native_volume, mode):
    mesh = grid()
    q = flat(mesh.shape)
    if mode == "dx":
        q[25, ::2] = 1e308
        q[25, 1::2] = -1e308
    else:
        q[17] = 1e200
    result = native_volume[0](pack(mesh, q), mode=mode, threads=4)
    assert result.returncode != 0 and result.stdout == b""
    assert b"native SBP volume rejected:" in result.stderr

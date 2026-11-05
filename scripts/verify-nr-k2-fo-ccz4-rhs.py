"""Cross-check the C++ FO-CCZ4 RK4 shadow against the Python reference.

This is a shadow numerical-consistency gate only.  It does not close
characteristic boundaries, physical validation, or live-runtime promotion.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    FOCCZ4Auxiliary3D,
    FOCCZ4State3D,
    GaugeConfig,
    Grid3D,
    advance_fo_ccz4_rk4_3d,
)


MAGIC = b"NRK2FO01"
HEADER = struct.Struct("<8sQQQQQQQddddQ")
VARIABLE_COUNT = 58
VARIABLE_NAMES = (
    "h00", "h01", "h02", "h11", "h12", "h22", "ln_alpha",
    "beta0", "beta1", "beta2", "ln_phi", "A00", "A01", "A02", "A11",
    "A12", "A22", "K", "Theta", "GammaHat0", "GammaHat1", "GammaHat2",
    "b0", "b1", "b2", "A0", "A1", "A2", "B00", "B01", "B02", "B10",
    "B11", "B12", "B20", "B21", "B22", "D000", "D001", "D002", "D011",
    "D012", "D022", "D100", "D101", "D102", "D111", "D112", "D122",
    "D200", "D201", "D202", "D211", "D212", "D222", "P0", "P1", "P2",
)


def _run(binary: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run([str(binary), *args], capture_output=True, text=True, check=False)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_checkpoint(path: Path) -> tuple[dict[str, object], list[np.ndarray]]:
    raw = path.read_bytes()
    if len(raw) < HEADER.size:
        raise SystemExit("FO-CCZ4 checkpoint is truncated")
    values = HEADER.unpack_from(raw, 0)
    (
        magic,
        version,
        dimension,
        points,
        scenario,
        formulation,
        solver_mode,
        variable_count,
        dt,
        time,
        amplitude,
        wavelength,
        step,
    ) = values
    if magic != MAGIC or version != 1 or dimension != 3:
        raise SystemExit("FO-CCZ4 checkpoint header mismatch")
    if variable_count != VARIABLE_COUNT or formulation != 0 or solver_mode != 1:
        raise SystemExit("FO-CCZ4 RHS checkpoint header mismatch")
    cells = int(points) ** 3
    expected_length = HEADER.size + VARIABLE_COUNT * cells * 8
    if len(raw) != expected_length:
        raise SystemExit(f"FO-CCZ4 checkpoint byte length mismatch: {len(raw)} != {expected_length}")
    arrays: list[np.ndarray] = []
    offset = HEADER.size
    for _ in range(VARIABLE_COUNT):
        end = offset + cells * 8
        arrays.append(
            np.frombuffer(raw[offset:end], dtype="<f8")
            .copy()
            .reshape((int(points),) * 3)
        )
        offset = end
    return {
        "points": int(points),
        "scenario": int(scenario),
        "formulation": int(formulation),
        "solver_mode": int(solver_mode),
        "variable_count": int(variable_count),
        "dt": float(dt),
        "time": float(time),
        "amplitude": float(amplitude),
        "wavelength": float(wavelength),
        "step": int(step),
    }, arrays


def _python_slots(header: dict[str, object]) -> list[np.ndarray]:
    points = int(header["points"])
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    state = FOCCZ4State3D.from_bssn_state(
        BSSNState3D.gauge_wave(
            grid,
            amplitude=float(header["amplitude"]),
            wavelength=float(header["wavelength"]),
            time=0.0,
            formulation="ccz4",
        )
    )
    state = advance_fo_ccz4_rk4_3d(
        state,
        float(header["dt"]),
        steps=int(header["step"]),
        gauge=GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0),
    )
    return _slots_from_state(state)


def _slots_from_state(state: FOCCZ4State3D) -> list[np.ndarray]:
    base = state.base
    aux = state.auxiliary
    slots: list[np.ndarray] = []
    slots.extend(base.h[..., i, j] for i in range(3) for j in range(i, 3))
    slots.append(np.log(base.lapse))
    slots.extend(base.shift[..., i] for i in range(3))
    slots.append(0.5 * np.log(base.chi))
    slots.extend(base.a[..., i, j] for i in range(3) for j in range(i, 3))
    slots.extend((base.trace_k, base.theta))
    slots.extend(base.conformal_gamma[..., i] for i in range(3))
    slots.extend(base.b[..., i] for i in range(3))
    slots.extend(
        (
            *[aux.lapse_gradient[..., i] for i in range(3)],
            *[aux.shift_gradient[..., k, i] for k in range(3) for i in range(3)],
            *[
                aux.metric_gradient[..., k, i, j]
                for k in range(3)
                for i in range(3)
                for j in range(i, 3)
            ],
            *[aux.conformal_factor_gradient[..., i] for i in range(3)],
        )
    )
    if len(slots) != VARIABLE_COUNT:
        raise AssertionError(f"Python canonical slots have length {len(slots)}")
    return slots


def _ordering_fixture(points: int) -> FOCCZ4State3D:
    """Construct a synthetic off-constraint state with non-zero P/D curls."""

    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    base = BSSNState3D.minkowski(grid)
    source = FOCCZ4State3D.from_bssn_state(base).auxiliary
    lapse_gradient = np.array(source.lapse_gradient, copy=True)
    shift_gradient = np.array(source.shift_gradient, copy=True)
    metric_gradient = np.array(source.metric_gradient, copy=True)
    conformal_factor_gradient = np.array(source.conformal_factor_gradient, copy=True)
    x, y, _ = grid.coordinates
    conformal_factor_gradient[..., 1] = np.sin(2.0 * np.pi * x)
    metric_gradient[..., 0, 1, 1] = 0.37 * np.sin(2.0 * np.pi * y)
    auxiliary = FOCCZ4Auxiliary3D(
        lapse_gradient=lapse_gradient,
        shift_gradient=shift_gradient,
        metric_gradient=metric_gradient,
        conformal_factor_gradient=conformal_factor_gradient,
        derivative_order=source.derivative_order,
        source_state_sha256=source.source_state_sha256,
    )
    return FOCCZ4State3D(base, auxiliary)


def _write_checkpoint(
    path: Path,
    slots: list[np.ndarray],
    *,
    points: int,
    dt: float,
    scenario: int = 0,
    formulation: int = 0,
    solver_mode: int = 1,
    amplitude: float = 0.001,
    wavelength: float = 1.0,
    step: int = 0,
) -> None:
    header = HEADER.pack(
        MAGIC,
        1,
        3,
        points,
        scenario,
        formulation,
        solver_mode,
        VARIABLE_COUNT,
        dt,
        0.0,
        amplitude,
        wavelength,
        step,
    )
    payload = bytearray(header)
    for slot in slots:
        values = np.ascontiguousarray(slot, dtype="<f8")
        payload.extend(values.tobytes(order="C"))
    path.write_bytes(payload)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp",
        "science/numerical_relativity/cpp/CMakeLists.txt",
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "scripts/verify-nr-k2-fo-ccz4-rhs.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    # The current Python/C++ implementation agrees at binary64 roundoff.
    # Keep a small cross-platform margin while making a repeated-term or
    # index-order regression fail closed instead of hiding behind 5e-10.
    parser.add_argument("--tolerance", type=float, default=1.0e-12)
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"FO-CCZ4 C++ binary does not exist: {binary}")

    with tempfile.TemporaryDirectory(prefix="nr-k2-fo-rhs-") as temporary:
        root = Path(temporary)
        common = [
            "--points", "8", "--scenario", "gauge-wave", "--formulation", "ccz4",
            "--solver-mode", "fo-rhs-shadow", "--amplitude", "0.001",
            "--wavelength", "1", "--dt", f"{float(args.dt):.17g}",
        ]
        steps = int(args.steps)
        if steps < 2:
            raise SystemExit("--steps must be at least two for the restart split")
        if not np.isfinite(float(args.dt)) or float(args.dt) <= 0.0:
            raise SystemExit("--dt must be finite and positive")
        part_steps = steps // 2
        restart_steps = steps - part_steps
        direct = _run(binary, [*common, "--steps", str(steps), "--threads", "1",
                               "--manifest", str(root / "direct.json"),
                               "--checkpoint", str(root / "direct.bin")])
        threaded = _run(binary, [*common, "--steps", str(steps), "--threads", "4",
                                 "--manifest", str(root / "threaded.json"),
                                 "--checkpoint", str(root / "threaded.bin")])
        part = _run(binary, [*common, "--steps", str(part_steps), "--threads", "4",
                             "--manifest", str(root / "part.json"),
                             "--checkpoint", str(root / "part.bin")])
        restart = _run(binary, [*common, "--steps", str(restart_steps), "--threads", "1",
                                "--restart", str(root / "part.bin"),
                                "--manifest", str(root / "restart.json"),
                                "--checkpoint", str(root / "restart.bin")])
        mismatch = _run(binary, [*common, "--scenario", "minkowski", "--steps", "1",
                                 "--restart", str(root / "part.bin"),
                                 "--manifest", str(root / "mismatch.json"),
                                 "--checkpoint", str(root / "mismatch.bin")])
        if any(result.returncode != 0 for result in (direct, threaded, part, restart)):
            raise SystemExit("FO-CCZ4 C++ RHS run failed\n" + direct.stderr + threaded.stderr + part.stderr + restart.stderr)
        header, cpp_arrays = _read_checkpoint(root / "direct.bin")
        python_arrays = _python_slots(header)
        slot_errors = {
            name: float(np.max(np.abs(cpp - python)))
            for name, cpp, python in zip(VARIABLE_NAMES, cpp_arrays, python_arrays)
        }
        max_abs = max(slot_errors.values())
        fixture_state = _ordering_fixture(8)
        fixture_input = root / "ordering-fixture-input.bin"
        fixture_output = root / "ordering-fixture-output.bin"
        _write_checkpoint(
            fixture_input,
            _slots_from_state(fixture_state),
            points=8,
            dt=float(args.dt),
        )
        fixture_run = _run(
            binary,
            [
                "--points", "8", "--scenario", "minkowski", "--formulation", "ccz4",
                "--solver-mode", "fo-rhs-shadow", "--amplitude", "0.001",
                "--wavelength", "1", "--dt", f"{float(args.dt):.17g}",
                "--steps", "1", "--threads", "1", "--restart", str(fixture_input),
                "--manifest", str(root / "ordering-fixture.json"),
                "--checkpoint", str(fixture_output),
            ],
        )
        if fixture_run.returncode != 0:
            raise SystemExit("FO-CCZ4 ordering fixture run failed\n" + fixture_run.stderr)
        _, fixture_cpp_arrays = _read_checkpoint(fixture_output)
        fixture_python_state = advance_fo_ccz4_rk4_3d(
            fixture_state,
            float(args.dt),
            steps=1,
            gauge=GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0),
        )
        fixture_python_arrays = _slots_from_state(fixture_python_state)
        ordering_fixture_slot_errors = {
            name: float(np.max(np.abs(cpp - python)))
            for name, cpp, python in zip(
                VARIABLE_NAMES, fixture_cpp_arrays, fixture_python_arrays
            )
        }
        ordering_fixture_max_abs = max(ordering_fixture_slot_errors.values())
        direct_manifest = json.loads((root / "direct.json").read_text(encoding="utf-8"))
        threaded_manifest = json.loads((root / "threaded.json").read_text(encoding="utf-8"))
        restart_manifest = json.loads((root / "restart.json").read_text(encoding="utf-8"))
        diagnostics_manifest = direct_manifest["diagnostics"]
        manifest_identity = (
            direct_manifest["schema_version"] == "nr-run-manifest-v1"
            and direct_manifest["formulation"] == "fo-ccz4-58-variable-shadow-contract"
            and direct_manifest["status"] == "shadow"
            and direct_manifest["boundary"] == "periodic"
            and diagnostics_manifest["solver_mode"] == "fo-ccz4-rhs-shadow-rk4"
            and diagnostics_manifest["dynamic_rhs_implemented"] is True
            and diagnostics_manifest["dynamic_evolution_validated"] is False
            and diagnostics_manifest["finite_state_after_step"] is True
            and diagnostics_manifest["positive_conformal_metric_after_step"] is True
            and diagnostics_manifest["fo_ccz4_parameters"] == {
                "kappa1": 0.1,
                "kappa2": 0.0,
                "kappa3": 1.0,
                "cleaning_speed": 1.0,
                "ordering_mu": 1.0,
                "shift_strength": 1.0,
                "tau_inverse": 0.0,
                "k0": 0.0,
                "c": 1.0,
                "lapse_coefficient": 2.0,
                "shift_coefficient": 1.0,
                "shift_damping": 0.0,
            }
            and diagnostics_manifest["variable_count"] == VARIABLE_COUNT
            and diagnostics_manifest["ode_variable_count"] == 11
            and diagnostics_manifest["pde_variable_count"] == 47
            and tuple(diagnostics_manifest["variables"]) == VARIABLE_NAMES
        )
        diagnostics = {
            "benchmark": "nr-k2-cpp-openmp-fo-ccz4-rhs-shadow",
            "schema_version": "nr-k2-fo-ccz4-rhs-shadow-v1",
            "source_digest": _source_digest(),
            "kernel_id": direct_manifest["kernel_id"],
            "kernel_version": direct_manifest["kernel_version"],
            "variable_count": header["variable_count"],
            "variables": list(VARIABLE_NAMES),
            "ode_variable_count": 11,
            "pde_variable_count": 47,
            "cross_backend_max_abs": max_abs,
            "cross_backend_tolerance": args.tolerance,
            "cross_backend_passed": bool(max_abs <= args.tolerance),
            "slot_errors": slot_errors,
            "ordering_fixture_max_abs": ordering_fixture_max_abs,
            "ordering_fixture_tolerance": args.tolerance,
            "ordering_fixture_passed": bool(ordering_fixture_max_abs <= args.tolerance),
            "ordering_fixture_slot_errors": ordering_fixture_slot_errors,
            "checkpoint_equal_thread_count": _sha256(root / "direct.bin") == _sha256(root / "threaded.bin"),
            "checkpoint_equal_restart": _sha256(root / "direct.bin") == _sha256(root / "restart.bin"),
            "manifest_equal_thread_count": direct_manifest == threaded_manifest,
            "manifest_equal_restart": direct_manifest == restart_manifest,
            "manifest_identity_parity": manifest_identity,
            "mismatched_scenario_rejected": mismatch.returncode != 0 and "restart scenario" in mismatch.stderr,
            "dynamic_rhs_implemented": bool(diagnostics_manifest["dynamic_rhs_implemented"]),
            "dynamic_evolution_validated": bool(diagnostics_manifest["dynamic_evolution_validated"]),
            "physical_validation": False,
            "cpbc": False,
            "runtime_writeback": False,
            "promotion": direct_manifest["promotion"],
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(diagnostics, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        print(json.dumps(diagnostics, sort_keys=True))
        required = (
            diagnostics["cross_backend_passed"],
            diagnostics["ordering_fixture_passed"],
            diagnostics["checkpoint_equal_thread_count"],
            diagnostics["checkpoint_equal_restart"],
            diagnostics["manifest_equal_thread_count"],
            diagnostics["manifest_equal_restart"],
            diagnostics["manifest_identity_parity"],
            diagnostics["mismatched_scenario_rejected"],
            diagnostics["dynamic_rhs_implemented"],
        )
        return 0 if all(required) else 2


if __name__ == "__main__":
    raise SystemExit(main())

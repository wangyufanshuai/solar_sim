"""Verify the C++ FO-CCZ4 58-slot checkpoint contract.

This gate proves binary layout, Python/C++ kinematic state parity, deterministic
checkpoint/restart, OpenMP thread reproducibility, and fail-closed restart
metadata checks.  It intentionally does not claim a C++ FO-CCZ4 RHS.
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
    Grid3D,
    build_fo_ccz4_auxiliary_3d,
    validate_fo_ccz4_cpp_manifest,
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
    if variable_count != VARIABLE_COUNT or formulation != 0 or solver_mode != 0:
        raise SystemExit("FO-CCZ4 checkpoint contract header mismatch")
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
    state = BSSNState3D.gauge_wave(
        grid,
        amplitude=float(header["amplitude"]),
        wavelength=float(header["wavelength"]),
        time=float(header["time"]),
        formulation="ccz4",
    )
    auxiliary = build_fo_ccz4_auxiliary_3d(state)
    slots: list[np.ndarray] = []
    slots.extend(state.h[..., i, j] for i in range(3) for j in range(i, 3))
    slots.append(np.log(state.lapse))
    slots.extend(state.shift[..., i] for i in range(3))
    slots.append(0.5 * np.log(state.chi))
    slots.extend(state.a[..., i, j] for i in range(3) for j in range(i, 3))
    slots.extend((state.trace_k, state.theta))
    slots.extend(state.conformal_gamma[..., i] for i in range(3))
    slots.extend(state.b[..., i] for i in range(3))
    slots.extend(
        (
            *[auxiliary.lapse_gradient[..., i] for i in range(3)],
            *[
                auxiliary.shift_gradient[..., k, i]
                for k in range(3)
                for i in range(3)
            ],
            *[
                auxiliary.metric_gradient[..., k, i, j]
                for k in range(3)
                for i in range(3)
                for j in range(i, 3)
            ],
            *[auxiliary.conformal_factor_gradient[..., i] for i in range(3)],
        )
    )
    if len(slots) != VARIABLE_COUNT:
        raise AssertionError(f"Python canonical slots have length {len(slots)}")
    return slots


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp",
        "science/numerical_relativity/cpp/CMakeLists.txt",
        "science/numerical_relativity/fo_ccz4.py",
        "scripts/verify-nr-k2-fo-ccz4-contract.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"FO-CCZ4 C++ binary does not exist: {binary}")

    with tempfile.TemporaryDirectory(prefix="nr-k2-fo-contract-") as temporary:
        root = Path(temporary)
        common = [
            "--points", "8", "--scenario", "gauge-wave", "--formulation", "ccz4",
            "--solver-mode", "analytic-contract", "--amplitude", "0.001",
            "--wavelength", "1", "--dt", "0.00001",
        ]
        direct = _run(binary, [*common, "--steps", "8", "--threads", "1",
                               "--manifest", str(root / "direct.json"),
                               "--checkpoint", str(root / "direct.bin")])
        threaded = _run(binary, [*common, "--steps", "8", "--threads", "4",
                                 "--manifest", str(root / "threaded.json"),
                                 "--checkpoint", str(root / "threaded.bin")])
        part = _run(binary, [*common, "--steps", "4", "--threads", "4",
                             "--manifest", str(root / "part.json"),
                             "--checkpoint", str(root / "part.bin")])
        restart = _run(binary, [*common, "--steps", "4", "--threads", "1",
                                "--restart", str(root / "part.bin"),
                                "--manifest", str(root / "restart.json"),
                                "--checkpoint", str(root / "restart.bin")])
        mismatch = _run(binary, [*common, "--scenario", "minkowski", "--steps", "1",
                                 "--restart", str(root / "part.bin"),
                                 "--manifest", str(root / "mismatch.json"),
                                 "--checkpoint", str(root / "mismatch.bin")])
        if any(result.returncode != 0 for result in (direct, threaded, part, restart)):
            raise SystemExit("FO-CCZ4 C++ contract run failed\n" + direct.stderr + threaded.stderr + part.stderr + restart.stderr)
        header, cpp_arrays = _read_checkpoint(root / "direct.bin")
        python_arrays = _python_slots(header)
        slot_errors = {
            name: float(np.max(np.abs(cpp - python)))
            for name, cpp, python in zip(VARIABLE_NAMES, cpp_arrays, python_arrays)
        }
        max_abs = max(slot_errors.values())
        direct_manifest = json.loads((root / "direct.json").read_text(encoding="utf-8"))
        threaded_manifest = json.loads((root / "threaded.json").read_text(encoding="utf-8"))
        restart_manifest = json.loads((root / "restart.json").read_text(encoding="utf-8"))
        manifest_diagnostics = direct_manifest["diagnostics"]
        manifest_validation_error = None
        try:
            validate_fo_ccz4_cpp_manifest(
                direct_manifest,
                expected_solver_mode="analytic-3d-fo-ccz4-contract",
            )
            manifest_identity = True
        except (KeyError, TypeError, ValueError) as error:
            manifest_identity = False
            manifest_validation_error = str(error)
        diagnostics = {
            "benchmark": "nr-k2-cpp-openmp-fo-ccz4-contract",
            "schema_version": "nr-k2-fo-ccz4-contract-v2",
            "source_digest": _source_digest(),
            "kernel_id": direct_manifest["kernel_id"],
            "kernel_version": direct_manifest["kernel_version"],
            "variable_count": header["variable_count"],
            "variables": list(VARIABLE_NAMES),
            "ode_variable_count": 11,
            "pde_variable_count": 47,
            "cross_backend_max_abs": max_abs,
            "cross_backend_tolerance": 2.0e-13,
            "cross_backend_passed": bool(max_abs <= 2.0e-13),
            "slot_errors": slot_errors,
            "checkpoint_equal_thread_count": _sha256(root / "direct.bin") == _sha256(root / "threaded.bin"),
            "checkpoint_equal_restart": _sha256(root / "direct.bin") == _sha256(root / "restart.bin"),
            "manifest_equal_thread_count": direct_manifest == threaded_manifest,
            "manifest_equal_restart": direct_manifest == restart_manifest,
            "manifest_identity_parity": manifest_identity,
            "manifest_validation_error": manifest_validation_error,
            "mismatched_scenario_rejected": mismatch.returncode != 0 and "restart scenario" in mismatch.stderr,
            "dynamic_rhs_implemented": bool(manifest_diagnostics["dynamic_rhs_implemented"]),
            # This evidence comes from the analytic Python/C++ slot comparison,
            # not from the pre-0.3.2 writer's ambiguous reconstruction marker.
            "analytic_auxiliary_agreement": bool(
                manifest_identity and all(slot_errors[name] <= 2.0e-13 for name in VARIABLE_NAMES[25:])
            ),
            "auxiliary_evolution_policy": manifest_diagnostics.get("auxiliary_evolution"),
            "legacy_auxiliary_reconstruction_marker": manifest_diagnostics.get("auxiliary_ordering_reconstructed"),
            "physical_validation": False,
            "runtime_writeback": False,
            "promotion": direct_manifest["promotion"],
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(diagnostics, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
        print(json.dumps(diagnostics, sort_keys=True))
        required = (
            diagnostics["cross_backend_passed"],
            diagnostics["checkpoint_equal_thread_count"],
            diagnostics["checkpoint_equal_restart"],
            diagnostics["manifest_equal_thread_count"],
            diagnostics["manifest_equal_restart"],
            diagnostics["manifest_identity_parity"],
            diagnostics["mismatched_scenario_rejected"],
            diagnostics["analytic_auxiliary_agreement"],
        )
        return 0 if all(required) else 2


if __name__ == "__main__":
    raise SystemExit(main())

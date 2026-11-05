"""Verify the NR-K2 C++ 3-D state/checkpoint contract against Python.

The comparison is intentionally limited to the analytic gauge-wave slice:
it proves slot ordering, geometry, checkpoint/restart determinism, and
binary64 values, not a dynamic C++ Einstein-field-equation RHS.
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
from science.numerical_relativity import BSSNState3D, Grid3D


MAGIC = b"NRK23D01"
HEADER = struct.Struct("<8sQQQQQddddQ")
STATE_FIELDS = (
    "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
    "lapse", "shift", "b",
)
SLOT_NAMES = (
    "chi", "h11", "h12", "h13", "h22", "h23", "h33", "K",
    "A11", "A12", "A13", "A22", "A23", "A33", "Theta",
    "Gamma1", "Gamma2", "Gamma3", "lapse", "shift1", "shift2",
    "shift3", "B1", "B2", "B3",
)


def _run(binary: Path, args: list[str]) -> str:
    completed = subprocess.run(
        [str(binary), *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_checkpoint(path: Path) -> tuple[dict[str, object], list[np.ndarray]]:
    raw = path.read_bytes()
    if len(raw) < HEADER.size:
        raise SystemExit("3-D checkpoint is truncated")
    values = HEADER.unpack_from(raw, 0)
    magic, version, dimension, points, scenario, formulation, dt, time, amplitude, wavelength, step = values
    if magic != MAGIC or version != 1 or dimension != 3:
        raise SystemExit("3-D checkpoint header mismatch")
    cells = int(points) ** 3
    expected_length = HEADER.size + 25 * cells * 8
    if len(raw) != expected_length:
        raise SystemExit(f"3-D checkpoint byte length mismatch: {len(raw)} != {expected_length}")
    arrays: list[np.ndarray] = []
    offset = HEADER.size
    for _ in range(25):
        end = offset + cells * 8
        arrays.append(np.frombuffer(raw[offset:end], dtype="<f8").copy().reshape((int(points),) * 3))
        offset = end
    header = {
        "points": int(points),
        "scenario": int(scenario),
        "formulation": int(formulation),
        "dt": float(dt),
        "time": float(time),
        "amplitude": float(amplitude),
        "wavelength": float(wavelength),
        "step": int(step),
    }
    return header, arrays


def _python_slots(header: dict[str, object]) -> list[np.ndarray]:
    points = int(header["points"])
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    state = BSSNState3D.gauge_wave(
        grid,
        amplitude=float(header["amplitude"]),
        wavelength=float(header["wavelength"]),
        time=float(header["time"]),
        formulation="ccz4" if int(header["formulation"]) == 0 else "bssnok",
    )
    h = state.h
    a = state.a
    return [
        state.chi,
        h[..., 0, 0], h[..., 0, 1], h[..., 0, 2], h[..., 1, 1], h[..., 1, 2], h[..., 2, 2],
        state.trace_k,
        a[..., 0, 0], a[..., 0, 1], a[..., 0, 2], a[..., 1, 1], a[..., 1, 2], a[..., 2, 2],
        state.theta,
        state.conformal_gamma[..., 0], state.conformal_gamma[..., 1], state.conformal_gamma[..., 2],
        state.lapse,
        state.shift[..., 0], state.shift[..., 1], state.shift[..., 2],
        state.b[..., 0], state.b[..., 1], state.b[..., 2],
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"3-D binary does not exist: {binary}")

    with tempfile.TemporaryDirectory(prefix="nr-k2-3d-verify-") as temporary:
        root = Path(temporary)
        common = [
            "--points", "8", "--threads", "4", "--scenario", "gauge-wave",
            "--formulation", args.formulation, "--amplitude", "0.001", "--wavelength", "1",
            "--dt", "0.00001",
        ]
        _run(binary, [*common, "--steps", "8", "--threads", "1",
                      "--manifest", str(root / "direct.json"),
                      "--checkpoint", str(root / "direct.bin")])
        _run(binary, [*common, "--steps", "4",
                      "--manifest", str(root / "part.json"),
                      "--checkpoint", str(root / "part.bin")])
        _run(binary, [*common, "--steps", "4", "--restart", str(root / "part.bin"),
                      "--manifest", str(root / "restart.json"),
                      "--checkpoint", str(root / "restart.bin")])
        direct_manifest = json.loads((root / "direct.json").read_text(encoding="utf-8"))
        restart_manifest = json.loads((root / "restart.json").read_text(encoding="utf-8"))
        manifest_equal = direct_manifest == restart_manifest
        direct_sha = _sha256(root / "direct.bin")
        restart_sha = _sha256(root / "restart.bin")
        checkpoint_equal = direct_sha == restart_sha
        header, cpp_arrays = _read_checkpoint(root / "direct.bin")
        python_arrays = _python_slots(header)
        max_abs = max(
            float(np.max(np.abs(cpp - python)))
            for cpp, python in zip(cpp_arrays, python_arrays)
        )
        mismatch_formulation = "bssnok" if args.formulation == "ccz4" else "ccz4"
        mismatch = subprocess.run(
            [str(binary), *common, "--formulation", mismatch_formulation, "--steps", "1",
             "--restart", str(root / "part.bin"),
             "--manifest", str(root / "mismatch.json"),
             "--checkpoint", str(root / "mismatch.bin")],
            capture_output=True,
            text=True,
        )
        mismatch_rejected = mismatch.returncode != 0 and "restart formulation" in mismatch.stderr
        diagnostics = {
            "benchmark": "nr-k2-cpp-3d-state-checkpoint-contract",
            "kernel_id": direct_manifest["kernel_id"],
            "formulation": args.formulation,
            "schema_version": direct_manifest["schema_version"],
            "points": header["points"],
            "step": header["step"],
            "time": header["time"],
            "variable_count": len(SLOT_NAMES),
            "variables": list(SLOT_NAMES),
            "cross_backend_max_abs": max_abs,
            "cross_backend_tolerance": 2.0e-12,
            "cross_backend_passed": bool(max_abs <= 2.0e-12),
            "manifest_equal": manifest_equal,
            "checkpoint_equal": checkpoint_equal,
            "mismatched_restart_rejected": mismatch_rejected,
            "checkpoint_sha256": direct_sha,
            "dynamic_rhs_validated": False,
            "promotion": direct_manifest["promotion"],
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(diagnostics, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        print(json.dumps(diagnostics, sort_keys=True))
        return 0 if all((manifest_equal, checkpoint_equal, mismatch_rejected, diagnostics["cross_backend_passed"])) else 2


if __name__ == "__main__":
    raise SystemExit(main())

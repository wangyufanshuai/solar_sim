"""Verify the C++ 3-D dynamic shadow against the Python method-of-lines reference.

This gate checks the small periodic gauge-wave problem only.  It proves that
the C++ RK4 implementation, variable order, checkpoint/restart envelope and
the Python reference use the same discrete RHS.  It is not a binary-black-hole
or production-boundary validation.
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
from science.numerical_relativity.bssn3d import advance_bssn_rk4_3d
from science.numerical_relativity.ccz4_3d import advance_ccz4_rk4_3d
from science.numerical_relativity.constraints3d import constraint_report_3d


MAGIC = b"NRK23DD1"
HEADER = struct.Struct("<8sQQQQQddddQ")
SLOT_NAMES = (
    "chi", "h11", "h12", "h13", "h22", "h23", "h33", "K",
    "A11", "A12", "A13", "A22", "A23", "A33", "Theta",
    "Gamma1", "Gamma2", "Gamma3", "lapse", "shift1", "shift2",
    "shift3", "B1", "B2", "B3",
)


def _run(binary: Path, args: list[str]) -> str:
    completed = subprocess.run(
        [str(binary), *args], check=True, capture_output=True, text=True
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
        raise SystemExit("dynamic 3-D checkpoint is truncated")
    values = HEADER.unpack_from(raw, 0)
    magic, version, dimension, points, scenario, formulation, dt, time, amplitude, wavelength, step = values
    if magic != MAGIC or version != 1 or dimension != 3:
        raise SystemExit("dynamic 3-D checkpoint header mismatch")
    cells = int(points) ** 3
    expected_length = HEADER.size + 25 * cells * 8
    if len(raw) != expected_length:
        raise SystemExit(f"dynamic checkpoint byte length mismatch: {len(raw)} != {expected_length}")
    arrays: list[np.ndarray] = []
    offset = HEADER.size
    for _ in range(25):
        end = offset + cells * 8
        arrays.append(np.frombuffer(raw[offset:end], dtype="<f8").copy().reshape((int(points),) * 3))
        offset = end
    return {
        "points": int(points), "scenario": int(scenario), "formulation": int(formulation),
        "dt": float(dt), "time": float(time), "amplitude": float(amplitude),
        "wavelength": float(wavelength), "step": int(step),
    }, arrays


def _python_evolved(header: dict[str, object], formulation: str) -> BSSNState3D:
    points = int(header["points"])
    grid = Grid3D((points, points, points), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    state = BSSNState3D.gauge_wave(
        grid,
        amplitude=float(header["amplitude"]),
        wavelength=float(header["wavelength"]),
        formulation=formulation,
    )
    if formulation == "ccz4":
        evolved = advance_ccz4_rk4_3d(state, float(header["dt"]), steps=int(header["step"]))
    else:
        evolved = advance_bssn_rk4_3d(state, float(header["dt"]), steps=int(header["step"]))
    return evolved


def _python_slots(header: dict[str, object], formulation: str) -> list[np.ndarray]:
    evolved = _python_evolved(header, formulation)
    return [
        evolved.chi,
        evolved.h[..., 0, 0], evolved.h[..., 0, 1], evolved.h[..., 0, 2],
        evolved.h[..., 1, 1], evolved.h[..., 1, 2], evolved.h[..., 2, 2],
        evolved.trace_k,
        evolved.a[..., 0, 0], evolved.a[..., 0, 1], evolved.a[..., 0, 2],
        evolved.a[..., 1, 1], evolved.a[..., 1, 2], evolved.a[..., 2, 2],
        evolved.theta,
        evolved.conformal_gamma[..., 0], evolved.conformal_gamma[..., 1], evolved.conformal_gamma[..., 2],
        evolved.lapse,
        evolved.shift[..., 0], evolved.shift[..., 1], evolved.shift[..., 2],
        evolved.b[..., 0], evolved.b[..., 1], evolved.b[..., 2],
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"3-D dynamic binary does not exist: {binary}")

    with tempfile.TemporaryDirectory(prefix="nr-k2-3d-dynamic-verify-") as temporary:
        root = Path(temporary)
        common = [
            "--solver-mode", "dynamic", "--points", "8", "--threads", "4",
            "--scenario", "gauge-wave", "--formulation", args.formulation,
            "--amplitude", "0.001", "--wavelength", "1", "--dt", "0.00001",
        ]
        _run(binary, [*common, "--steps", "8", "--threads", "1",
                      "--manifest", str(root / "direct.json"), "--checkpoint", str(root / "direct.bin")])
        _run(binary, [*common, "--steps", "4",
                      "--manifest", str(root / "part.json"), "--checkpoint", str(root / "part.bin")])
        _run(binary, [*common, "--steps", "4", "--restart", str(root / "part.bin"),
                      "--manifest", str(root / "restart.json"), "--checkpoint", str(root / "restart.bin")])
        direct_manifest = json.loads((root / "direct.json").read_text(encoding="utf-8"))
        restart_manifest = json.loads((root / "restart.json").read_text(encoding="utf-8"))
        direct_sha = _sha256(root / "direct.bin")
        restart_sha = _sha256(root / "restart.bin")
        header, cpp_arrays = _read_checkpoint(root / "direct.bin")
        python_arrays = _python_slots(header, args.formulation)
        max_abs = max(float(np.max(np.abs(cpp - python))) for cpp, python in zip(cpp_arrays, python_arrays))
        mismatch_formulation = "bssnok" if args.formulation == "ccz4" else "ccz4"
        mismatch = subprocess.run(
            [str(binary), *common, "--formulation", mismatch_formulation, "--steps", "1",
             "--restart", str(root / "part.bin"), "--manifest", str(root / "mismatch.json"),
             "--checkpoint", str(root / "mismatch.bin")], capture_output=True, text=True,
        )
        mismatch_mode = subprocess.run(
            [str(binary), *common, "--solver-mode", "analytic", "--steps", "1",
             "--restart", str(root / "part.bin"), "--manifest", str(root / "mismatch-mode.json"),
             "--checkpoint", str(root / "mismatch-mode.bin")], capture_output=True, text=True,
        )
        diagnostics = {
            "benchmark": "nr-k2-cpp-3d-dynamic-cross-backend",
            "kernel_id": direct_manifest["kernel_id"], "formulation": args.formulation,
            "schema_version": direct_manifest["schema_version"], "points": header["points"],
            "step": header["step"], "time": header["time"], "variable_count": len(SLOT_NAMES),
            "variables": list(SLOT_NAMES), "cross_backend_max_abs": max_abs,
            "cross_backend_tolerance": 2.0e-9, "cross_backend_passed": bool(max_abs <= 2.0e-9),
            "manifest_equal": direct_manifest == restart_manifest,
            "checkpoint_equal": direct_sha == restart_sha, "checkpoint_sha256": direct_sha,
            "mismatched_formulation_rejected": mismatch.returncode != 0 and "restart formulation" in mismatch.stderr,
            "mismatched_solver_mode_rejected": mismatch_mode.returncode != 0 and "restart solver mode" in mismatch_mode.stderr,
            "dynamic_rhs_implemented": direct_manifest["diagnostics"]["dynamic_rhs_implemented"],
            "dynamic_evolution_validated": False,
            "promotion": direct_manifest["promotion"],
            "constraint_norms": dict(constraint_report_3d(_python_evolved(header, args.formulation)).norms),
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(diagnostics, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
        print(json.dumps(diagnostics, sort_keys=True))
        return 0 if all((diagnostics["cross_backend_passed"], diagnostics["manifest_equal"], diagnostics["checkpoint_equal"], diagnostics["mismatched_formulation_rejected"], diagnostics["mismatched_solver_mode_rejected"])) else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Run an independent metric-constraint campaign on C++ FO-CCZ4 checkpoints.

The C++ executable evolves the 58-slot shadow state; this script reconstructs
the 25-slot BSSN/CCZ4 state and evaluates the repository's independent
metric-based vacuum constraints.  It is a discretization/robustness gate, not
a CPBC or strong-field physical-validation result.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity.constraints3d import constraint_report_3d  # noqa: E402
from science.numerical_relativity.nr3d import BSSNState3D, Grid3D  # noqa: E402


MAGIC = b"NRK2FO01"
HEADER = struct.Struct("<8sQQQQQQQddddQ")
VARIABLE_COUNT = 58


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_checkpoint(path: Path) -> tuple[dict[str, object], list[np.ndarray]]:
    raw = path.read_bytes()
    if len(raw) < HEADER.size:
        raise ValueError("checkpoint is truncated")
    values = HEADER.unpack_from(raw, 0)
    magic, version, dimension, points, scenario, formulation, solver_mode, count, dt, time, amplitude, wavelength, step = values
    if magic != MAGIC or version != 1 or dimension != 3 or count != VARIABLE_COUNT:
        raise ValueError("checkpoint header mismatch")
    if formulation != 0 or solver_mode != 1:
        raise ValueError("constraint campaign requires fo-rhs-shadow checkpoint")
    cells = int(points) ** 3
    if len(raw) != HEADER.size + VARIABLE_COUNT * cells * 8:
        raise ValueError("checkpoint length mismatch")
    arrays: list[np.ndarray] = []
    offset = HEADER.size
    for _ in range(VARIABLE_COUNT):
        end = offset + cells * 8
        arrays.append(np.frombuffer(raw[offset:end], dtype="<f8").copy().reshape((int(points),) * 3))
        offset = end
    return {
        "points": int(points),
        "scenario": int(scenario),
        "dt": float(dt),
        "time": float(time),
        "amplitude": float(amplitude),
        "wavelength": float(wavelength),
        "step": int(step),
    }, arrays


def _state_from_slots(header: dict[str, object], slots: list[np.ndarray]) -> BSSNState3D:
    points = int(header["points"])
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    h = np.zeros((*grid.shape, 3, 3), dtype=np.float64)
    cursor = 0
    for i in range(3):
        for j in range(i, 3):
            h[..., i, j] = slots[cursor]
            h[..., j, i] = slots[cursor]
            cursor += 1
    lapse = np.exp(slots[cursor])
    cursor += 1
    shift = np.stack(slots[cursor:cursor + 3], axis=-1)
    cursor += 3
    chi = np.exp(2.0 * slots[cursor])
    cursor += 1
    a = np.zeros_like(h)
    for i in range(3):
        for j in range(i, 3):
            a[..., i, j] = slots[cursor]
            a[..., j, i] = slots[cursor]
            cursor += 1
    trace_k = slots[cursor]
    theta = slots[cursor + 1]
    cursor += 2
    conformal_gamma = np.stack(slots[cursor:cursor + 3], axis=-1)
    cursor += 3
    b = np.stack(slots[cursor:cursor + 3], axis=-1)
    return BSSNState3D(
        grid=grid,
        chi=chi,
        h=h,
        trace_k=trace_k,
        a=a,
        theta=theta,
        conformal_gamma=conformal_gamma,
        lapse=lapse,
        shift=shift,
        b=b,
        valid_mask=np.ones(grid.shape, dtype=bool),
        formulation="ccz4",
        metadata={"source": "nr-k2-fo-ccz4-cpp-shadow"},
    )


def _order(coarse: float, fine: float, coarse_points: int, fine_points: int) -> float | None:
    if coarse <= 0.0 or fine <= 0.0 or coarse_points <= 0 or fine_points <= coarse_points:
        return None
    return float(np.log(coarse / fine) / np.log(fine_points / coarse_points))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", nargs="+", type=int, default=[8, 16, 32])
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--threads", type=int, default=1)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    parser.add_argument("--amplitude", type=float, default=1.0e-4)
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"C++ shadow binary does not exist: {binary}")
    if len(args.points) < 2 or any(points < 5 for points in args.points):
        raise SystemExit("at least two point counts >= 5 are required")
    rows: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="nr-k2-fo-constraints-") as temporary:
        root = Path(temporary)
        for points in args.points:
            manifest = root / f"n{points}.json"
            checkpoint = root / f"n{points}.bin"
            command = [
                str(binary), "--points", str(points), "--steps", str(args.steps),
                "--threads", str(args.threads), "--dt", f"{args.dt:.17g}",
                "--amplitude", f"{args.amplitude:.17g}", "--wavelength", "1",
                "--scenario", "gauge-wave", "--formulation", "ccz4",
                "--solver-mode", "fo-rhs-shadow", "--manifest", str(manifest),
                "--checkpoint", str(checkpoint),
            ]
            result = subprocess.run(command, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                raise SystemExit(f"C++ constraint run failed at {points}^3:\n{result.stderr}")
            header, slots = _read_checkpoint(checkpoint)
            state = _state_from_slots(header, slots)
            report = constraint_report_3d(state)
            norms = dict(report.norms)
            determinant = np.linalg.det(state.h)
            finite = all(np.all(np.isfinite(values)) for values in slots)
            row = {
                "points": points,
                "step": int(header["step"]),
                "time": float(header["time"]),
                "state_checksum_sha256": _sha256(checkpoint),
                "finite_state": bool(finite),
                "min_det_h": float(np.min(determinant)),
                "max_det_h_deviation": float(np.max(np.abs(determinant - 1.0))),
                "constraint_norms": norms,
                "manifest_promotion": json.loads(manifest.read_text(encoding="utf-8"))["promotion"],
            }
            rows.append(row)
    rows.sort(key=lambda row: int(row["points"]))
    orders: dict[str, list[float | None]] = {}
    for metric in (
        "hamiltonian_l2",
        "hamiltonian_l_inf",
        "momentum_l2",
        "momentum_l_inf",
        "conformal_gamma_l_inf",
        "theta_l_inf",
    ):
        values = [float(row["constraint_norms"][metric]) for row in rows]
        orders[metric] = [
            _order(values[index], values[index + 1], int(rows[index]["points"]), int(rows[index + 1]["points"]))
            for index in range(len(values) - 1)
        ]
    diagnostics = {
        "benchmark": "nr-k2-cpp-openmp-fo-ccz4-independent-constraints",
        "schema_version": "nr-k2-fo-ccz4-constraints-v1",
        "source_digest": hashlib.sha256(
            (Path(__file__).resolve().parents[1] / "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp").read_bytes()
        ).hexdigest(),
        "points": list(args.points),
        "steps": args.steps,
        "dt": args.dt,
        "amplitude": args.amplitude,
        "rows": rows,
        "observed_orders": orders,
        "independent_constraint_evaluator": "science.numerical_relativity.constraints3d.constraint_report_3d",
        "cpbc": False,
        "physical_validation": False,
        "runtime_writeback": False,
        "promotion": "blocked-pending-fo-ccz4-cpp-cross-backend-and-cpbc",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(diagnostics, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(diagnostics, ensure_ascii=False, sort_keys=True))
    required = all(
        bool(row["finite_state"])
        and float(row["min_det_h"]) > 0.0
        and all(np.isfinite(float(value)) for value in row["constraint_norms"].values())
        for row in rows
    )
    return 0 if required else 2


if __name__ == "__main__":
    raise SystemExit(main())

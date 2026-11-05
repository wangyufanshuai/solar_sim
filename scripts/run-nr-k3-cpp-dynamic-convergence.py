"""Run a bounded 3-D dynamic shadow constraint-convergence campaign.

The campaign reconstructs the C++ checkpoint in the independent Python
metric-based constraint evaluator.  It is a periodic gauge-wave test and is
not a strong-field, AMR, outer-boundary, or production-science validation.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import BSSNState3D, Grid3D
from science.numerical_relativity.constraints3d import constraint_report_3d


HEADER = struct.Struct("<8sQQQQQddddQ")
MAGIC = b"NRK23DD1"


def _read_state(path: Path, formulation: str) -> tuple[dict[str, object], BSSNState3D]:
    raw = path.read_bytes()
    header = HEADER.unpack_from(raw)
    magic, version, dimension, points, scenario, formulation_code, dt, time, amplitude, wavelength, step = header
    if magic != MAGIC or version != 1 or dimension != 3 or scenario != 1:
        raise SystemExit(f"unexpected dynamic checkpoint header: {path}")
    cells = int(points) ** 3
    expected = HEADER.size + 25 * cells * 8
    if len(raw) != expected:
        raise SystemExit(f"checkpoint length mismatch: {len(raw)} != {expected}")
    arrays = []
    offset = HEADER.size
    for _ in range(25):
        arrays.append(np.frombuffer(raw[offset:offset + cells * 8], dtype="<f8").copy().reshape((points,) * 3))
        offset += cells * 8
    grid = Grid3D((points, points, points), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    h = np.zeros((*grid.shape, 3, 3), dtype=np.float64)
    a = np.zeros_like(h)
    for first, second, slot in ((0, 0, 1), (0, 1, 2), (0, 2, 3), (1, 1, 4), (1, 2, 5), (2, 2, 6)):
        h[..., first, second] = arrays[slot]
        h[..., second, first] = arrays[slot]
    for first, second, slot in ((0, 0, 8), (0, 1, 9), (0, 2, 10), (1, 1, 11), (1, 2, 12), (2, 2, 13)):
        a[..., first, second] = arrays[slot]
        a[..., second, first] = arrays[slot]
    state = BSSNState3D(
        grid=grid,
        chi=arrays[0],
        h=h,
        trace_k=arrays[7],
        a=a,
        theta=arrays[14],
        conformal_gamma=np.stack(arrays[15:18], axis=-1),
        lapse=arrays[18],
        shift=np.stack(arrays[19:22], axis=-1),
        b=np.stack(arrays[22:25], axis=-1),
        valid_mask=np.ones((points, points, points), dtype=bool),
        formulation=formulation,
    )
    metadata = {
        "points": int(points), "formulation_code": int(formulation_code), "dt": float(dt),
        "time": float(time), "amplitude": float(amplitude), "wavelength": float(wavelength),
        "step": int(step),
    }
    return metadata, state


def _orders(values: list[float]) -> list[float | None]:
    orders: list[float | None] = []
    for coarse, fine in zip(values, values[1:]):
        if coarse > 0.0 and fine > 0.0:
            orders.append(float(np.log2(coarse / fine)))
        else:
            orders.append(None)
    return orders


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--points", nargs="+", type=int, default=[8, 16, 32])
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"dynamic binary does not exist: {binary}")
    if sorted(set(args.points)) != args.points or any(points < 5 for points in args.points):
        raise SystemExit("--points must be sorted and at least five")

    reports: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="nr-k3-cpp-convergence-") as temporary:
        root = Path(temporary)
        for points in args.points:
            checkpoint = root / f"state-{points}.bin"
            manifest = root / f"manifest-{points}.json"
            subprocess.run(
                [str(binary), "--solver-mode", "dynamic", "--formulation", args.formulation,
                 "--scenario", "gauge-wave", "--points", str(points), "--threads", "4",
                 "--steps", str(args.steps), "--dt", f"{args.dt:.17g}", "--amplitude", "0.001",
                 "--wavelength", "1", "--manifest", str(manifest), "--checkpoint", str(checkpoint)],
                check=True, capture_output=True, text=True,
            )
            metadata, state = _read_state(checkpoint, args.formulation)
            reports.append({**metadata, "constraint_norms": dict(constraint_report_3d(state).norms)})

    keys = ("hamiltonian_l2", "hamiltonian_l_inf", "momentum_l2", "momentum_l_inf", "conformal_gamma_l_inf")
    convergence = {key: _orders([float(item["constraint_norms"][key]) for item in reports]) for key in keys}
    receipt = {
        "benchmark": "nr-k3-cpp-dynamic-constraint-convergence-shadow",
        "formulation": args.formulation,
        "scenario": "periodic-gauge-wave",
        "points": args.points,
        "steps": args.steps,
        "dt": args.dt,
        "reports": reports,
        "observed_orders": convergence,
        "independent_constraint_evaluator": "science.numerical_relativity.constraints3d.constraint_report_3d",
        "physical_validation": False,
        "promotion": "blocked-pending-k3-physical-validation",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(receipt, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

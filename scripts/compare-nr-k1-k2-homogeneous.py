"""Compare the Python BSSN reference with an NR-K2 homogeneous checkpoint."""

from __future__ import annotations

import argparse
from pathlib import Path
import struct
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import CCZ4State1D, Grid1D, advance_bssn_rk4


MAGIC = b"NRK2CP01"
VARIABLE_COUNT = 25
CHI, K, LAPSE = 0, 7, 18


def read_checkpoint(
    path: Path,
) -> tuple[int, float, float, int, list[np.ndarray], float, float]:
    with path.open("rb") as stream:
        magic = stream.read(8)
        if magic != MAGIC:
            raise SystemExit(f"unexpected checkpoint magic: {magic!r}")
        version, points, scenario = struct.unpack("<QQQ", stream.read(24))
        x_min, x_max, dt, time = struct.unpack("<dddd", stream.read(32))
        (step,) = struct.unpack("<Q", stream.read(8))
        components = [
            np.frombuffer(stream.read(points * 8), dtype="<f8").copy()
            for _ in range(VARIABLE_COUNT)
        ]
    if version != 1 or scenario != 1:
        raise SystemExit("checkpoint is not the NR-K2a homogeneous BSSN contract")
    return points, x_min, x_max, step, components, dt, time


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--initial-trace-k", type=float, default=0.1)
    args = parser.parse_args()
    points, x_min, x_max, step, components, dt, time = read_checkpoint(args.checkpoint)
    state = CCZ4State1D.minkowski(
        Grid1D(points, x_min, x_max), formulation="bssnok"
    )
    state.trace_k.fill(args.initial_trace_k)
    expected = advance_bssn_rk4(state, dt, steps=step)
    actual = {
        "chi": components[CHI],
        "trace_k": components[K],
        "lapse": components[LAPSE],
    }
    reference = {
        "chi": expected.chi,
        "trace_k": expected.trace_k,
        "lapse": expected.lapse,
    }
    errors = {
        name: float(np.max(np.abs(actual[name] - reference[name])))
        for name in actual
    }
    if any(error != 0.0 for error in errors.values()):
        raise SystemExit(f"Python/C++ mismatch: {errors}")
    print({"cross_backend_exact": True, "step": step, "time": time, "max_abs_error": errors})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

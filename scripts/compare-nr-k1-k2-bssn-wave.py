"""Cross-check the C++ NR-K2b BSSN 1-D RHS against the Python reference.

The comparison is deliberately an independent reader/initializer: it does not
trust a C++-generated JSON summary and it does not promote either backend.  A
small smooth periodic state is evolved by both RK4 implementations and every
one of the 25 state slots is compared.
"""

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
CHI, H11, H12, H13, H22, H23, H33 = range(7)
K = 7
A11, A12, A13, A22, A23, A33 = range(8, 14)
THETA = 14
GAMMA1, GAMMA2, GAMMA3 = 15, 16, 17
LAPSE = 18
SHIFT1, SHIFT2, SHIFT3 = 19, 20, 21
B1, B2, B3 = 22, 23, 24


def read_checkpoint(path: Path) -> tuple[int, float, float, int, list[np.ndarray], float, float, int]:
    with path.open("rb") as stream:
        if stream.read(8) != MAGIC:
            raise SystemExit("unexpected checkpoint magic")
        version, points, scenario = struct.unpack("<QQQ", stream.read(24))
        x_min, x_max, dt, time = struct.unpack("<dddd", stream.read(32))
        (step,) = struct.unpack("<Q", stream.read(8))
        components = [
            np.frombuffer(stream.read(points * 8), dtype="<f8").copy()
            for _ in range(VARIABLE_COUNT)
        ]
    if version != 1 or scenario != 2:
        raise SystemExit("checkpoint is not the NR-K2b bssn-wave scenario")
    return points, x_min, x_max, step, components, dt, time, scenario


def make_initial_state(points: int, x_min: float, x_max: float) -> CCZ4State1D:
    state = CCZ4State1D.minkowski(
        Grid1D(points, x_min, x_max), formulation="bssnok"
    )
    x = x_min + (x_max - x_min) * np.arange(points, dtype=np.float64) / points
    phase = 2.0 * np.pi * (x - x_min) / (x_max - x_min)
    sine = np.sin(phase)
    cosine = np.cos(phase)
    state.chi[:] = 1.0 + 1.0e-3 * sine
    state.h[:, 0, 0] = 1.0 + 1.0e-3 * cosine
    state.h[:, 1, 1] = 1.0 - 5.0e-4 * cosine
    state.h[:, 2, 2] = 1.0 - 5.0e-4 * cosine
    state.h[:, 0, 1] = state.h[:, 1, 0] = 2.0e-4 * sine
    state.trace_k[:] = 2.0e-4 * sine
    state.a[:, 0, 0] = 2.0e-4 * sine
    state.a[:, 1, 1] = -1.0e-4 * sine
    state.a[:, 2, 2] = -1.0e-4 * sine
    state.a[:, 0, 1] = state.a[:, 1, 0] = 1.0e-4 * cosine
    state.lapse[:] = 1.0 + 5.0e-4 * cosine
    state.shift[:, 0] = 1.0e-4 * sine
    state.shift[:, 1] = 5.0e-5 * cosine
    state.b[:, 0] = 2.0e-5 * cosine
    return state


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--rtol", type=float, default=2.0e-9)
    parser.add_argument("--atol", type=float, default=2.0e-11)
    args = parser.parse_args()

    points, x_min, x_max, step, components, dt, time, _ = read_checkpoint(args.checkpoint)
    expected = advance_bssn_rk4(make_initial_state(points, x_min, x_max), dt, steps=step)
    expected_components = [
        expected.chi,
        expected.h[:, 0, 0], expected.h[:, 0, 1], expected.h[:, 0, 2],
        expected.h[:, 1, 1], expected.h[:, 1, 2], expected.h[:, 2, 2],
        expected.trace_k,
        expected.a[:, 0, 0], expected.a[:, 0, 1], expected.a[:, 0, 2],
        expected.a[:, 1, 1], expected.a[:, 1, 2], expected.a[:, 2, 2],
        expected.theta,
        expected.conformal_gamma[:, 0], expected.conformal_gamma[:, 1], expected.conformal_gamma[:, 2],
        expected.lapse,
        expected.shift[:, 0], expected.shift[:, 1], expected.shift[:, 2],
        expected.b[:, 0], expected.b[:, 1], expected.b[:, 2],
    ]
    errors = {
        str(index): float(np.max(np.abs(actual - reference)))
        for index, (actual, reference) in enumerate(zip(components, expected_components))
    }
    max_error = max(errors.values())
    if not np.allclose(
        np.concatenate(components), np.concatenate(expected_components),
        rtol=args.rtol, atol=args.atol,
    ):
        raise SystemExit(f"Python/C++ BSSN mismatch: max_abs_error={max_error}, errors={errors}")
    print({
        "cross_backend": "bssnok-1d-nontrivial",
        "step": step,
        "time": time,
        "max_abs_error": max_error,
        "all_25_slots_within_tolerance": True,
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

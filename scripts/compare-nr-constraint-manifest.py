"""Compare C++ manifest constraint norms with the Python reference evaluator."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import struct
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import CCZ4State1D, Grid1D, constraint_report


MAGIC = b"NRK2CP01"
VARIABLE_COUNT = 25


def read_state(path: Path) -> CCZ4State1D:
    with path.open("rb") as stream:
        if stream.read(8) != MAGIC:
            raise SystemExit("unexpected checkpoint magic")
        version, points, scenario = struct.unpack("<QQQ", stream.read(24))
        x_min, x_max, _dt, _time = struct.unpack("<dddd", stream.read(32))
        stream.read(8)  # step
        components = [
            np.frombuffer(stream.read(points * 8), dtype="<f8").copy()
            for _ in range(VARIABLE_COUNT)
        ]
    if version != 1 or scenario not in (2, 3):
        raise SystemExit("constraint comparison requires bssn-wave or ccz4-wave")
    state = CCZ4State1D.minkowski(
        Grid1D(points, x_min, x_max),
        formulation="ccz4" if scenario == 3 else "bssnok",
    )
    state.chi[:] = components[0]
    state.h[:, 0, 0], state.h[:, 0, 1], state.h[:, 0, 2] = components[1:4]
    state.h[:, 1, 1], state.h[:, 1, 2], state.h[:, 2, 2] = components[4:7]
    state.h[:, 1, 0] = state.h[:, 0, 1]
    state.h[:, 2, 0] = state.h[:, 0, 2]
    state.h[:, 2, 1] = state.h[:, 1, 2]
    state.trace_k[:] = components[7]
    state.a[:, 0, 0], state.a[:, 0, 1], state.a[:, 0, 2] = components[8:11]
    state.a[:, 1, 1], state.a[:, 1, 2], state.a[:, 2, 2] = components[11:14]
    state.a[:, 1, 0] = state.a[:, 0, 1]
    state.a[:, 2, 0] = state.a[:, 0, 2]
    state.a[:, 2, 1] = state.a[:, 1, 2]
    state.theta[:] = components[14]
    state.conformal_gamma[:] = np.stack(components[15:18], axis=1)
    state.lapse[:] = components[18]
    state.shift[:] = np.stack(components[19:22], axis=1)
    state.b[:] = np.stack(components[22:25], axis=1)
    return state


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--atol", type=float, default=2.0e-12)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    expected = constraint_report(read_state(args.checkpoint)).norms
    names = (
        "hamiltonian_l_inf", "hamiltonian_l2", "momentum_l_inf", "momentum_l2",
        "det_h_l_inf", "trace_a_l_inf", "conformal_gamma_l_inf", "theta_l_inf",
    )
    actual = manifest["diagnostics"]
    errors = {name: abs(float(actual[name]) - float(expected[name])) for name in names}
    max_error = max(errors.values())
    if max_error > args.atol:
        raise SystemExit(f"constraint manifest mismatch: max_abs_error={max_error}; errors={errors}")
    print({"constraint_manifest_matches_python": True, "max_abs_error": max_error, "norms": expected})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

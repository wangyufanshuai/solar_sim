"""Run a bounded NR-K1c CCZ4 reference campaign and write a shadow manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    CCZ4State1D,
    Grid1D,
    advance_ccz4_rk4,
    ccz4_rhs_1d,
    constraint_report,
    gauge_wave_constraint_convergence,
    manifest_from_reference_state,
    robust_stability_campaign,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=65)
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--dt", type=float, default=1.0e-4)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.points < 9 or args.steps < 1 or args.dt <= 0.0:
        raise SystemExit("points >= 9, steps >= 1, and dt > 0 are required")

    grid = Grid1D(args.points, -1.0, 1.0)
    initial = CCZ4State1D.minkowski(grid, formulation="ccz4")
    initial_rhs = ccz4_rhs_1d(initial)
    evolved = advance_ccz4_rk4(initial, args.dt, steps=args.steps)
    evolved_report = constraint_report(evolved)
    wave = gauge_wave_constraint_convergence(grid_sizes=(32, 64, 128))
    stability = robust_stability_campaign(points=max(17, args.points // 2))
    manifest = manifest_from_reference_state(
        evolved,
        kernel_id="nr-k1c-python-ccz4-shadow",
        kernel_version="0.1.0",
        diagnostics={
            "scenario": "minkowski-ccz4-rk4",
            "steps": args.steps,
            "time": args.steps * args.dt,
            "dt": args.dt,
            "initial_rhs_l_inf": max(
                float(np.max(np.abs(getattr(initial_rhs, name))))
                for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b")
            ),
            "evolved_constraint_norms": dict(evolved_report.norms),
            "gauge_wave_roundoff_limited": wave.roundoff_limited,
            "gauge_wave_max_hamiltonian_l2": max(sample.hamiltonian_l2 for sample in wave.samples),
            "gauge_wave_max_momentum_l2": max(sample.momentum_l2 for sample in wave.samples),
            "robust_stability_passed": stability.passed,
            "robust_stability_samples": [sample.__dict__ for sample in stability.samples],
        },
    )
    payload = manifest.payload()
    payload["grid"]["dt"] = args.dt
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "manifest": str(args.output),
        "kernel_id": payload["kernel_id"],
        "promotion": payload["promotion"],
        "evolved_constraint_l_inf": evolved_report.norms["hamiltonian_l_inf"],
        "gauge_wave_roundoff_limited": wave.roundoff_limited,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

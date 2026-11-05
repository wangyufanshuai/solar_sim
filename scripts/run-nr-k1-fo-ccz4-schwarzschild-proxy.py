"""Run a bounded FO-CCZ4 Schwarzschild exterior with a scalar boundary proxy."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    FOCCZ4State3D,
    GaugeConfig,
    Grid3D,
    BSSNState3D,
    advance_fo_ccz4_rk4_3d,
    constraint_report_3d,
    fo_ccz4_ordering_constraints_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/constraints3d.py",
        "scripts/run-nr-k1-fo-ccz4-schwarzschild-proxy.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _state_diagnostics(state: FOCCZ4State3D) -> dict[str, object]:
    constraints = constraint_report_3d(state.base)
    ordering = fo_ccz4_ordering_constraints_3d(state.base, state.auxiliary)
    determinant = np.linalg.det(state.base.h)
    finite = bool(
        np.all(np.isfinite(state.base.chi))
        and np.all(np.isfinite(state.base.lapse))
        and np.all(np.isfinite(state.base.h))
        and np.all(np.isfinite(state.base.a))
        and np.all(np.isfinite(state.base.trace_k))
        and np.all(np.isfinite(determinant))
    )
    return {
        "finite": finite,
        "valid_cell_count": int(state.base.valid_cell_count),
        "min_chi": float(np.min(state.base.chi)),
        "min_lapse": float(np.min(state.base.lapse)),
        "min_det_h": float(np.min(determinant)),
        "constraint_norms": dict(constraints.norms),
        "ordering_max_curl_l_inf": ordering.max_curl_l_inf,
        "ordering_max_algebraic_l_inf": ordering.max_algebraic_l_inf,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--dt", type=float, default=1.0e-4)
    parser.add_argument("--steps", type=int, default=2)
    args = parser.parse_args()
    if args.points < 7 or args.points % 2 == 0:
        raise SystemExit("--points must be odd and at least seven")
    if not np.isfinite(args.mass) or args.mass <= 0.0:
        raise SystemExit("--mass must be finite and positive")
    if not np.isfinite(args.dt) or args.dt <= 0.0:
        raise SystemExit("--dt must be finite and positive")
    if args.steps < 1:
        raise SystemExit("--steps must be positive")

    grid = Grid3D(
        (args.points, args.points, args.points),
        (0.75, -0.75, -0.75),
        (2.25, 0.75, 0.75),
        boundary="sommerfeld",
        spatial_order=2,
    )
    base = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=args.mass,
        excision_radius=0.5 * args.mass,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    state = FOCCZ4State3D.from_bssn_state(base)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config()
    initial = _state_diagnostics(state)
    evolved = advance_fo_ccz4_rk4_3d(
        state,
        args.dt,
        steps=args.steps,
        gauge=gauge,
        config=config,
        boundary_mode="sommerfeld-proxy",
    )
    final = _state_diagnostics(evolved)
    short_run_gate = bool(
        final["finite"]
        and final["valid_cell_count"] == args.points**3
        and float(final["min_chi"]) > 0.0
        and float(final["min_lapse"]) > 0.0
        and float(final["min_det_h"]) > 0.0
    )
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-schwarzschild-exterior-sommerfeld-proxy",
        "schema_version": "nr-k1-fo-ccz4-schwarzschild-proxy-v1",
        "source_digest": _source_digest(),
        "grid": {
            "shape": [args.points] * 3,
            "lower": [0.75, -0.75, -0.75],
            "upper": [2.25, 0.75, 0.75],
            "boundary": "sommerfeld",
            "boundary_mode": "sommerfeld-proxy",
            "spatial_order": 2,
        },
        "initial_data": {
            "family": "time-symmetric-isotropic-schwarzschild",
            "mass_length": args.mass,
            "excision_radius": 0.5 * args.mass,
            "lapse_seed": "schwarzschild",
        },
        "integrator": {
            "method": "classical-rk4",
            "dt": args.dt,
            "steps": args.steps,
            "gauge": {
                "lapse": "advective-1+log",
                "shift": "gamma-driver",
                "shift_coefficient": 1.0,
                "shift_damping": 0.0,
            },
        },
        "initial": initial,
        "final": final,
        "validation": {
            "short_run_finite_positive_metric": short_run_gate,
            "sommerfeld_proxy_validated": True,
            "characteristic_boundary_validated": False,
            "constraint_preserving_validated": False,
            "physical_schwarzschild_evolution_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-characteristic-boundary-and-physical-validation",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "short_run_finite_positive_metric": short_run_gate,
                "initial_min_lapse": initial["min_lapse"],
                "final_min_lapse": final["min_lapse"],
                "final_min_det_h": final["min_det_h"],
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if short_run_gate else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Run a deterministic cross-resolution 3-D NR self-convergence shadow gate.

The campaign compares independently evolved periodic gauge-wave states after
restricting the finer node-centered state with the audited second-order
full-weighting operator.  It is a discretization/stability diagnostic only:
the moving-puncture gauge does not preserve the analytic gauge-wave slice, so
the result is not an exact-solution or physical-waveform validation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    CCZ4Config,
    Grid3D,
    GaugeConfig,
    advance_bssn_rk4_3d,
    advance_ccz4_rk4_3d,
    manifest_from_3d_state,
    restrict_periodic_state,
)


STATE_FIELDS = (
    "chi",
    "h",
    "trace_k",
    "a",
    "theta",
    "conformal_gamma",
    "lapse",
    "shift",
    "b",
)


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/amr3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-self-convergence.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in STATE_FIELDS:
        digest.update(name.encode("utf-8"))
        digest.update(np.ascontiguousarray(getattr(state, name), dtype=np.float64).tobytes())
    return digest.hexdigest()


def _advance(state: BSSNState3D, dt: float, steps: int) -> BSSNState3D:
    if state.formulation == "ccz4":
        return advance_ccz4_rk4_3d(
            state,
            dt,
            steps=steps,
            ccz4=CCZ4Config(),
            gauge=GaugeConfig(theta_coupling=2.0),
            project_algebraic=True,
        )
    return advance_bssn_rk4_3d(
        state,
        dt,
        steps=steps,
        gauge=GaugeConfig(),
        project_algebraic=True,
    )


def _error_norms(coarse: BSSNState3D, restricted_fine: BSSNState3D) -> tuple[float, float]:
    if coarse.grid.shape != restricted_fine.grid.shape:
        raise ValueError("coarse and restricted fine grids must match")
    sum_square = 0.0
    count = 0
    linf = 0.0
    for name in STATE_FIELDS:
        difference = np.asarray(getattr(coarse, name), dtype=np.float64) - np.asarray(
            getattr(restricted_fine, name), dtype=np.float64
        )
        sum_square += float(np.sum(difference * difference, dtype=np.float64))
        count += int(difference.size)
        if difference.size:
            linf = max(linf, float(np.max(np.abs(difference))))
    return math.sqrt(sum_square / count), linf


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-points", type=int, default=8)
    parser.add_argument("--levels", type=int, default=3)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    parser.add_argument("--amplitude", type=float, default=1.0e-3)
    parser.add_argument("--spatial-order", type=int, choices=(2, 4), default=2)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (
        args.base_points < 5
        or args.levels < 3
        or args.steps < 1
        or not np.isfinite(args.dt)
        or args.dt <= 0.0
        or not np.isfinite(args.amplitude)
        or abs(args.amplitude) >= 1.0
    ):
        raise SystemExit(
            "base-points >= 5, levels >= 3, steps >= 1, dt > 0, and |amplitude| < 1 are required"
        )

    states: list[BSSNState3D] = []
    resolutions: list[int] = []
    for level in range(args.levels):
        points = args.base_points * (2**level)
        grid = Grid3D(
            (points, points, points),
            (0.0, 0.0, 0.0),
            (1.0, 1.0, 1.0),
            boundary="periodic",
            spatial_order=args.spatial_order,
        )
        initial = BSSNState3D.gauge_wave(
            grid,
            amplitude=args.amplitude,
            formulation=args.formulation,  # type: ignore[arg-type]
        )
        evolved = _advance(initial, args.dt, args.steps)
        if not all(np.all(np.isfinite(getattr(evolved, name))) for name in STATE_FIELDS):
            raise SystemExit(f"non-finite state at resolution {points}")
        states.append(evolved)
        resolutions.append(points)

    pairs: list[dict[str, object]] = []
    for level in range(len(states) - 1):
        restricted = restrict_periodic_state(states[level + 1], 2)
        l2, linf = _error_norms(states[level], restricted)
        pairs.append({
            "coarse_points": resolutions[level],
            "fine_points": resolutions[level + 1],
            "l2": l2,
            "l_inf": linf,
        })
    orders: list[dict[str, float]] = []
    for previous, current in zip(pairs, pairs[1:]):
        previous_l2 = float(previous["l2"])
        current_l2 = float(current["l2"])
        previous_linf = float(previous["l_inf"])
        current_linf = float(current["l_inf"])
        orders.append({
            "l2": math.log(previous_l2 / current_l2, 2.0),
            "l_inf": math.log(previous_linf / current_linf, 2.0),
        })
    convergence_passed = bool(
        pairs
        and all(float(pair["l2"]) > 0.0 and float(pair["l_inf"]) > 0.0 for pair in pairs)
        and orders
        and all(1.5 <= sample["l2"] <= 2.5 and 1.5 <= sample["l_inf"] <= 2.5 for sample in orders)
    )
    diagnostics = {
        "benchmark": "3d-periodic-gauge-wave-self-convergence",
        "formulation": args.formulation,
        "spatial_order": args.spatial_order,
        "base_points": args.base_points,
        "levels": args.levels,
        "resolutions": resolutions,
        "steps": args.steps,
        "dt": args.dt,
        "physical_time": args.steps * args.dt,
        "transfer": "periodic-trilinear-nodal-prolongation-plus-full-weighting-restriction",
        "pairs": pairs,
        "observed_orders": orders,
        "convergence_passed": convergence_passed,
        "analytic_solution_validated": False,
        "physical_waveform_validated": False,
        "finest_state_sha256": _state_digest(states[-1]),
        "source_sha256": _source_digest(),
    }
    manifest = manifest_from_3d_state(states[0], diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "manifest": str(args.output),
        "convergence_passed": convergence_passed,
        "observed_orders": orders,
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if convergence_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

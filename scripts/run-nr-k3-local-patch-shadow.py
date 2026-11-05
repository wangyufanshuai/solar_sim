"""Run the explicitly non-production local-patch AMR shadow gate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    Grid3D,
    advance_local_patch_periodic_amr,
    constraint_report_3d,
    manifest_from_3d_state,
)


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/amr_patch3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-local-patch-shadow.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _initial_state(points: int, formulation: str) -> BSSNState3D:
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    return BSSNState3D.gauge_wave(
        grid,
        amplitude=1.0e-3,
        formulation=formulation,  # type: ignore[arg-type]
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--steps", type=int, default=1)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    parser.add_argument("--refinement-ratio", type=int, default=2)
    parser.add_argument("--ghost-cells", type=int, default=2)
    parser.add_argument("--patch-lower", type=int, nargs=3, default=(2, 2, 2))
    parser.add_argument("--patch-upper", type=int, nargs=3, default=(7, 7, 7))
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (
        args.points < 5
        or args.steps < 1
        or not np.isfinite(args.dt)
        or args.dt <= 0.0
        or args.refinement_ratio < 2
        or args.ghost_cells < 2
    ):
        raise SystemExit("points >= 5, steps >= 1, dt > 0, ratio >= 2, and ghost-cells >= 2 are required")
    if any(value < 0 or value > args.points for value in (*args.patch_lower, *args.patch_upper)):
        raise SystemExit("patch bounds must lie within the coarse grid")

    initial = _initial_state(args.points, args.formulation)
    report = advance_local_patch_periodic_amr(
        initial,
        args.dt,
        patch_lower=tuple(args.patch_lower),
        patch_upper=tuple(args.patch_upper),
        coarse_steps=args.steps,
        refinement_ratio=args.refinement_ratio,
        ghost_cells=args.ghost_cells,
    )
    final_constraints = constraint_report_3d(report.coarse_state)
    diagnostics = {
        "benchmark": "local-patch-amr-shadow-gauge-wave",
        "formulation": args.formulation,
        "steps": args.steps,
        "dt": args.dt,
        "local_patch_amr": {
            "refinement_ratio": report.refinement_ratio,
            "fine_steps": report.fine_steps,
            "fine_dt": report.fine_dt,
            "patch_lower": list(report.patch_lower),
            "patch_upper": list(report.patch_upper),
            "ghost_cells": report.ghost_cells,
            "ghost_refreshes": report.ghost_refreshes,
            "finite_state": report.finite_state,
            "ghost_consistent": report.ghost_consistent,
            "coarse_fine_l2": report.coarse_fine_l2,
            "coarse_fine_l_inf": report.coarse_fine_l_inf,
            "predictor_endpoint_l2": report.predictor_endpoint_l2,
            "predictor_endpoint_l_inf": report.predictor_endpoint_l_inf,
            "synchronization": report.synchronization,
            "boundary_operator": report.boundary_operator,
            "reflux_applied": report.reflux_applied,
            "physical_amr_validated": report.physical_amr_validated,
            "state_sha256": report.state_sha256,
        },
        "finite_state": report.finite_state,
        "constraint_norms": dict(final_constraints.norms),
        "physical_amr_validated": report.physical_amr_validated,
        "source_sha256": _source_digest(),
    }
    manifest = manifest_from_3d_state(report.coarse_state, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    passed = bool(report.finite_state and report.ghost_consistent)
    print(json.dumps({
        "manifest": str(args.output),
        "finite_state": report.finite_state,
        "ghost_consistent": report.ghost_consistent,
        "coarse_fine_l2": report.coarse_fine_l2,
        "reflux_applied": report.reflux_applied,
        "physical_amr_validated": report.physical_amr_validated,
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

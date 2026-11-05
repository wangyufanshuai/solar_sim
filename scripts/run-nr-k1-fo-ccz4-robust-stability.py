"""Run a deterministic small-noise FO-CCZ4 robust-stability campaign."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    fo_ccz4_robust_stability_campaign_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/constraints3d.py",
        "science/numerical_relativity/nr3d.py",
        "scripts/run-nr-k1-fo-ccz4-robust-stability.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_int_tuple(raw: str, *, label: str) -> tuple[int, ...]:
    values = tuple(int(value.strip()) for value in raw.split(",") if value.strip())
    if not values:
        raise SystemExit(f"{label} must contain at least one integer")
    return values


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--spatial-order", type=int, choices=(2, 4), default=2)
    parser.add_argument("--dt", type=float, default=1.0e-3)
    parser.add_argument("--checkpoints", default="1,3,6,10")
    parser.add_argument("--amplitude", type=float, default=1.0e-6)
    parser.add_argument("--seeds", default="0,1,2")
    parser.add_argument("--growth-limit", type=float, default=10.0)
    args = parser.parse_args()
    checkpoints = _parse_int_tuple(args.checkpoints, label="--checkpoints")
    seeds = _parse_int_tuple(args.seeds, label="--seeds")
    if args.points < 7:
        raise SystemExit("--points must be at least 7")
    if not np.isfinite(args.dt) or args.dt <= 0.0:
        raise SystemExit("--dt must be finite and positive")
    if not np.isfinite(args.amplitude) or args.amplitude <= 0.0:
        raise SystemExit("--amplitude must be finite and positive")
    if not np.isfinite(args.growth_limit) or args.growth_limit <= 0.0:
        raise SystemExit("--growth-limit must be finite and positive")

    reports = [
        fo_ccz4_robust_stability_campaign_3d(
            points=args.points,
            spatial_order=args.spatial_order,
            dt=args.dt,
            checkpoints=checkpoints,
            amplitude=args.amplitude,
            seed=seed,
            growth_limit=args.growth_limit,
        )
        for seed in seeds
    ]
    replay = fo_ccz4_robust_stability_campaign_3d(
        points=args.points,
        spatial_order=args.spatial_order,
        dt=args.dt,
        checkpoints=checkpoints,
        amplitude=args.amplitude,
        seed=seeds[0],
        growth_limit=args.growth_limit,
    )
    serialized_reports = [asdict(report) for report in reports]
    replayable = serialized_reports[0] == asdict(replay)
    finite_positive = all(
        sample["finite_positive_state"]
        for report in serialized_reports
        for sample in report["samples"]
    )
    constraint_norms_finite = all(
        sample["constraint_norms_finite"]
        for report in serialized_reports
        for sample in report["samples"]
    )
    bounded_growth = all(
        sample["growth_ratio"] <= report["growth_limit"]
        for report in serialized_reports
        for sample in report["samples"]
    )
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-small-noise-robust-stability-shadow",
        "schema_version": "nr-k1-fo-ccz4-robust-stability-v2",
        "source_digest": _source_digest(),
        "campaign": {
            "points": args.points,
            "spatial_order": args.spatial_order,
            "dt": args.dt,
            "checkpoints": list(checkpoints),
            "amplitude": args.amplitude,
            "seeds": list(seeds),
            "growth_limit": args.growth_limit,
            "integrator": "classical-rk4",
            "boundary_mode": "periodic",
            "gauge": "advective-1+log-plus-gamma-driver",
        },
        "reports": serialized_reports,
        "validation": {
            "finite_positive_state": finite_positive,
            "constraint_norms_finite": constraint_norms_finite,
            "bounded_perturbation_growth": bounded_growth,
            "deterministic_replay": replayable,
            "strong_hyperbolicity_validated": False,
            "physical_boundary_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-cpbc-and-physical-validation",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    summary = {
        "output": str(args.output.resolve()),
        "seeds": list(seeds),
        "finite_positive_state": finite_positive,
        "constraint_norms_finite": constraint_norms_finite,
        "bounded_perturbation_growth": bounded_growth,
        "deterministic_replay": replayable,
        "promotion": receipt["validation"]["promotion"],
    }
    print(json.dumps(summary, sort_keys=True))
    return 0 if finite_positive and constraint_norms_finite and bounded_growth and replayable else 2


if __name__ == "__main__":
    raise SystemExit(main())

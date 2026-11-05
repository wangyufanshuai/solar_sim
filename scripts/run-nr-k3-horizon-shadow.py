"""Run the bounded NR-K3 star-shaped apparent-horizon shadow benchmark."""

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
    find_star_shaped_apparent_horizon_from_state,
    manifest_from_3d_state,
)


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-horizon-shadow.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _result_digest(radii: np.ndarray, expansion: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-star-shaped-horizon-v1\0")
    digest.update(np.ascontiguousarray(radii, dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(expansion, dtype=np.float64).tobytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=33)
    parser.add_argument("--theta-samples", type=int, default=4)
    parser.add_argument("--phi-samples", type=int, default=8)
    parser.add_argument("--iterations", type=int, default=12)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.points < 9 or args.theta_samples < 4 or args.phi_samples < 8 or args.iterations < 1:
        raise SystemExit("points >= 9, theta >= 4, phi >= 8, and iterations >= 1 are required")
    if args.theta_samples * args.phi_samples > 128:
        raise SystemExit("the dense shadow Jacobian is capped at 128 angular unknowns")

    grid = Grid3D(
        (args.points, args.points, args.points),
        (-2.0, -2.0, -2.0),
        (2.0, 2.0, 2.0),
        boundary="excision",
    )
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    state.trace_k[:] = 3.0
    theta = np.pi * (np.arange(args.theta_samples, dtype=np.float64) + 0.5) / args.theta_samples
    phi = 2.0 * np.pi * np.arange(args.phi_samples, dtype=np.float64) / args.phi_samples
    initial_radius = 0.8 * (
        1.0 + 0.05 * np.sin(theta)[:, None] * np.cos(phi)[None, :]
    )
    result = find_star_shaped_apparent_horizon_from_state(
        state,
        initial_radius,
        theta_samples=args.theta_samples,
        phi_samples=args.phi_samples,
        iterations=args.iterations,
        tolerance=1.0e-6,
        angular_tolerance=1.0e-6,
        max_surface_unknowns=128,
    )
    diagnostics = {
        "benchmark": "flat-constant-trace-star-shaped-horizon",
        "theta_samples": args.theta_samples,
        "phi_samples": args.phi_samples,
        "iterations_requested": args.iterations,
        "iterations_completed": result.iterations,
        "initial_radius_min": float(np.min(initial_radius)),
        "initial_radius_max": float(np.max(initial_radius)),
        "final_radius_min": float(np.min(result.radii)),
        "final_radius_max": float(np.max(result.radii)),
        "mean_expansion": result.mean_expansion,
        "expansion_l2": result.expansion_l2,
        "angular_std": result.angular_std,
        "method": result.method,
        "passed": result.passed,
        "state_sha256": _result_digest(result.radii, result.expansion),
        "source_sha256": _source_digest(),
        "physical_binary_black_hole_validated": False,
    }
    manifest = manifest_from_3d_state(state, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "manifest": str(args.output),
        "passed": result.passed,
        "expansion_l2": result.expansion_l2,
        "angular_std": result.angular_std,
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if result.passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

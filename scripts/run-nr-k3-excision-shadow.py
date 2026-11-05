"""Run the explicitly non-physical NR-K3 excision shadow evolution gate."""

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
    advance_excision_shadow_3d,
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
        "science/numerical_relativity/excision3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-excision-shadow.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
        "lapse", "shift", "b", "valid_mask",
    ):
        digest.update(name.encode("utf-8"))
        digest.update(np.ascontiguousarray(getattr(state, name)).tobytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=17)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--dt", type=float, default=1.0e-6)
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (
        args.points < 9
        or args.steps < 1
        or not np.isfinite(args.dt)
        or args.dt <= 0.0
        or not np.isfinite(args.mass)
        or args.mass <= 0.0
    ):
        raise SystemExit("points >= 9, steps >= 1, dt > 0, and mass > 0 are required")

    grid = Grid3D(
        (args.points, args.points, args.points),
        (-2.0, -2.0, -2.0),
        (2.0, 2.0, 2.0),
        boundary="excision",
    )
    initial = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=args.mass,
        formulation=args.formulation,  # type: ignore[arg-type]
    )
    report = advance_excision_shadow_3d(initial, args.dt, steps=args.steps)
    final_constraints = constraint_report_3d(report.state)
    diagnostics = {
        "benchmark": "schwarzschild-excision-shadow-evolution",
        "formulation": args.formulation,
        "steps": args.steps,
        "dt": args.dt,
        "ghost_fill": report.ghost_fill,
        "outer_boundary": report.outer_boundary,
        "max_ghost_distance": report.max_ghost_distance,
        "causality": {
            "face_count": report.causality_report.face_count,
            "min_minus_speed": report.causality_report.min_minus_speed,
            "max_minus_speed": report.causality_report.max_minus_speed,
            "min_plus_speed": report.causality_report.min_plus_speed,
            "max_plus_speed": report.causality_report.max_plus_speed,
            "pure_outflow_fraction": report.causality_report.pure_outflow_fraction,
            "inflow_fraction": report.causality_report.inflow_fraction,
            "max_outgoing_speed": report.causality_report.max_outgoing_speed,
            "tolerance": report.causality_report.tolerance,
            "normal_convention": report.causality_report.normal_convention,
            "method": report.causality_report.method,
            "pure_outflow": report.causality_report.pure_outflow,
            "physical_boundary_validated": report.causality_report.physical_boundary_validated,
        },
        "valid_mask_preserved": report.valid_mask_preserved,
        "finite_state": report.finite_state,
        "physical_excision_validated": report.physical_excision_validated,
        "constraint_history": [dict(sample) for sample in report.constraint_history],
        "final_constraint_norms": dict(final_constraints.norms),
        "state_sha256": _state_digest(report.state),
        "source_sha256": _source_digest(),
    }
    manifest = manifest_from_3d_state(initial, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    passed = bool(report.finite_state and report.valid_mask_preserved)
    print(json.dumps({
        "manifest": str(args.output),
        "finite_state": report.finite_state,
        "valid_mask_preserved": report.valid_mask_preserved,
        "ghost_fill": report.ghost_fill,
        "pure_outflow": report.causality_report.pure_outflow,
        "inflow_fraction": report.causality_report.inflow_fraction,
        "physical_excision_validated": report.physical_excision_validated,
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Run the frozen FO-CCZ4 SAT candidate on a finite-difference shadow grid."""

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
    BSSNState3D,
    FOCCZ4Config,
    FOCCZ4State3D,
    GaugeConfig,
    Grid3D,
    apply_frozen_fo_ccz4_characteristic_sat_rhs_3d,
    fo_ccz4_rhs_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_sat_shadow.py",
        "science/numerical_relativity/fo_ccz4_characteristic_boundary_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-characteristic-grid-boundary.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _axes(value: str) -> tuple[int, ...]:
    result = tuple(int(item.strip()) for item in value.split(",") if item.strip())
    if not result or any(axis not in (0, 1, 2) for axis in result):
        raise SystemExit("--axes must contain one or more values from 0,1,2")
    if len(set(result)) != len(result):
        raise SystemExit("--axes must not repeat an axis")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--axes", default="0")
    parser.add_argument("--points", type=int, default=6)
    parser.add_argument("--amplitude", type=float, default=1.0e-5)
    parser.add_argument("--penalty-strength", type=float, default=1.0)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    args = parser.parse_args()
    axes = _axes(args.axes)
    if args.points < 5:
        raise SystemExit("--points must be at least five")
    if not np.isfinite(args.amplitude) or args.amplitude <= 0.0:
        raise SystemExit("--amplitude must be finite and positive")
    grid = Grid3D(
        (args.points, args.points, args.points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    base = BSSNState3D.minkowski(grid, formulation="ccz4")
    x, y, z = grid.coordinates
    base.lapse += args.amplitude * np.sin(2.0 * np.pi * x)
    base.shift[..., 0] += 0.5 * args.amplitude * np.cos(2.0 * np.pi * y)
    base.theta += 0.25 * args.amplitude * np.sin(2.0 * np.pi * z)
    state = FOCCZ4State3D.from_bssn_state(base)
    gauge = GaugeConfig(
        shift_coefficient=float(args.shift_coefficient),
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    config = FOCCZ4Config(kappa1=0.0)
    rhs = fo_ccz4_rhs_3d(
        state,
        gauge=gauge,
        config=config,
        boundary_mode="sommerfeld-proxy",
    )
    updated, application, reports = apply_frozen_fo_ccz4_characteristic_sat_rhs_3d(
        state,
        rhs,
        axes=axes,
        penalty_strength=float(args.penalty_strength),
        gauge=gauge,
        config=config,
    )
    replay, replay_application, replay_reports = apply_frozen_fo_ccz4_characteristic_sat_rhs_3d(
        state,
        rhs,
        axes=axes,
        penalty_strength=float(args.penalty_strength),
        gauge=gauge,
        config=config,
    )
    del updated, replay
    deterministic = bool(
        application.correction_sha256 == replay_application.correction_sha256
        and application.correction_l_inf == replay_application.correction_l_inf
        and all(
            left.sat_operator_sha256 == right.sat_operator_sha256
            for left, right in zip(reports, replay_reports)
        )
    )
    candidate = bool(
        deterministic and application.frozen_grid_boundary_candidate_validated
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-frozen-characteristic-grid-boundary-shadow",
        "schema_version": "nr-k3-fo-ccz4-characteristic-grid-boundary-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "grid": asdict(grid),
        "gauge": asdict(gauge),
        "config": asdict(config),
        "axes": list(axes),
        "points": args.points,
        "amplitude": args.amplitude,
        "penalty_strength": args.penalty_strength,
        "application": asdict(application),
        "face_reports": [asdict(report) | {"sat_operator": None} for report in reports],
        "validation": {
            "frozen_grid_boundary_candidate_validated": candidate,
            "deterministic_replay": deterministic,
            "variable_coefficient_boundary_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-variable-coefficient-boundary-nonlinear-cpbc-"
                "physical-validation"
            ),
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
                "candidate": candidate,
                "deterministic_replay": deterministic,
                "face_count": application.face_count,
                "boundary_cell_count": application.boundary_cell_count,
                "correction_l_inf": application.correction_l_inf,
                "correction_imaginary_l_inf": application.correction_imaginary_l_inf,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Audit the frozen FO-CCZ4 characteristic incoming-mode SAT candidate."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    GaugeConfig,
    linearized_fo_ccz4_characteristic_sat_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_sat_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-characteristic-sat.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--penalty-strength", type=float, default=1.0)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    args = parser.parse_args()
    axes = tuple(int(value.strip()) for value in args.normal_axes.split(",") if value.strip())
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise SystemExit("--normal-axes must contain one or more values from 0,1,2")
    if len(set(axes)) != len(axes):
        raise SystemExit("--normal-axes must not repeat an axis")
    gauge = GaugeConfig(
        shift_coefficient=float(args.shift_coefficient),
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    config = FOCCZ4Config(kappa1=0.0)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        for orientation in ("right", "left"):
            audit = linearized_fo_ccz4_characteristic_sat_shadow_3d(
                points=args.points,
                normal_axis=normal_axis,
                orientation=orientation,
                penalty_strength=args.penalty_strength,
                gauge=gauge,
                config=config,
            )
            replay = linearized_fo_ccz4_characteristic_sat_shadow_3d(
                points=args.points,
                normal_axis=normal_axis,
                orientation=orientation,
                penalty_strength=args.penalty_strength,
                gauge=gauge,
                config=config,
            )
            row = asdict(audit)
            row.pop("sat_operator", None)
            row["deterministic_replay"] = bool(
                audit.sat_operator_sha256 == replay.sat_operator_sha256
                and audit.energy_penalty_max_eigenvalue
                == replay.energy_penalty_max_eigenvalue
            )
            row["frozen_sat_candidate_validated"] = bool(
                row["deterministic_replay"]
                and audit.frozen_characteristic_operator_validated
            )
            rows.append(row)
    candidate = all(bool(row["frozen_sat_candidate_validated"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-frozen-characteristic-sat-shadow",
        "schema_version": "nr-k3-fo-ccz4-characteristic-sat-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "points": args.points,
        "normal_axes": list(axes),
        "orientations": ["right", "left"],
        "penalty_strength": args.penalty_strength,
        "rows": rows,
        "validation": {
            "frozen_characteristic_sat_candidate_validated": candidate,
            "incoming_constraint_projection_validated": candidate,
            "energy_dissipation_validated": candidate,
            "analytic_uniform_symmetrizer_validated": False,
            "direct_variable_coefficient_boundary_validated": False,
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
                "row_count": len(rows),
                "frozen_characteristic_sat_candidate_validated": candidate,
                "max_energy_penalty_eigenvalue": max(
                    float(row["energy_penalty_max_eigenvalue"]) for row in rows
                ),
                "max_free_constraint_residual": max(
                    float(row["free_incoming_constraint_residual_l_inf"])
                    for row in rows
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate else 2


if __name__ == "__main__":
    raise SystemExit(main())

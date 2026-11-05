"""Write the frozen FO-CCZ4 incoming-constraint-map shadow receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    GaugeConfig,
    FOCCZ4Config,
    linearized_fo_ccz4_frozen_cpbc_map_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_einstein_constraints.py",
        "science/numerical_relativity/fo_ccz4_frozen_cpbc.py",
        "scripts/run-nr-k3-fo-ccz4-frozen-cpbc-map.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_axes(raw: str) -> tuple[int, ...]:
    axes = tuple(int(value.strip()) for value in raw.split(",") if value.strip())
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise SystemExit("--normal-axes must contain one or more values from 0,1,2")
    if len(set(axes)) != len(axes):
        raise SystemExit("--normal-axes must not repeat an axis")
    return axes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--rank-tolerance", type=float, default=1.0e-10)
    parser.add_argument("--crosscheck-tolerance", type=float, default=1.0e-8)
    args = parser.parse_args()
    if args.points < 8:
        raise SystemExit("--points must be at least eight")
    axes = _parse_axes(args.normal_axes)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        for orientation in ("right", "left"):
            report = linearized_fo_ccz4_frozen_cpbc_map_3d(
                points=args.points,
                normal_axis=normal_axis,
                orientation=orientation,
                gauge=gauge,
                config=config,
                rank_tolerance=args.rank_tolerance,
                crosscheck_tolerance=args.crosscheck_tolerance,
            )
            replay = linearized_fo_ccz4_frozen_cpbc_map_3d(
                points=args.points,
                normal_axis=normal_axis,
                orientation=orientation,
                gauge=gauge,
                config=config,
                rank_tolerance=args.rank_tolerance,
                crosscheck_tolerance=args.crosscheck_tolerance,
            )
            row = asdict(report)
            row["deterministic_replay"] = report == replay
            row["map_audit_passed"] = bool(
                report.frozen_incoming_constraint_map_validated
                and report.deterministic
                and row["deterministic_replay"]
            )
            rows.append(row)

    map_passed = all(bool(row["map_audit_passed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-frozen-incoming-constraint-map-shadow",
        "schema_version": "nr-k3-fo-ccz4-frozen-cpbc-map-v4",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "campaign": {
            "points": args.points,
            "normal_axes": list(axes),
            "orientations": ["right", "left"],
            "rank_tolerance": args.rank_tolerance,
            "crosscheck_tolerance": args.crosscheck_tolerance,
        },
        "rows": rows,
        "validation": {
            "frozen_incoming_constraint_map_validated": map_passed,
            "direct_symbol_crosscheck_validated": all(
                float(row["direct_symbol_crosscheck_error_l_inf"])
                <= args.crosscheck_tolerance
                for row in rows
            ),
            "constraint_operator_scope": {
                "kind": (
                    "ordering-definition-curl-plus-algebraic-plus-linearized-"
                    "hamiltonian-momentum-principal"
                ),
                "contains_hamiltonian_momentum_constraints": True,
                "einstein_constraint_row_count": 4,
            },
            "nonlinear_cpbc_validated": False,
            "analytic_symmetrizer_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-continuum-symmetrizer-nonlinear-cpbc",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    final = rows[-1]
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "row_count": len(rows),
                "frozen_incoming_constraint_map_validated": map_passed,
                "max_direct_symbol_crosscheck_error": max(
                    float(row["direct_symbol_crosscheck_error_l_inf"]) for row in rows
                ),
                "right_incoming_constraint_rank": next(
                    row["incoming_constraint_rank"]
                    for row in rows
                    if row["orientation"] == "right"
                ),
                "left_incoming_constraint_rank": next(
                    row["incoming_constraint_rank"]
                    for row in rows
                    if row["orientation"] == "left"
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
                "last_map_residual": final["incoming_constraint_map_residual_l_inf"],
            },
            sort_keys=True,
        )
    )
    return 0 if map_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

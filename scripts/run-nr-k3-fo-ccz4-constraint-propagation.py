"""Write the frozen FO-CCZ4 candidate constraint-closure shadow receipt."""

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
    linearized_fo_ccz4_constraint_propagation_audit_3d,
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
        "science/numerical_relativity/fo_ccz4_constraint_propagation.py",
        "scripts/run-nr-k3-fo-ccz4-constraint-propagation.py",
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
    parser.add_argument("--closure-tolerance", type=float, default=1.0e-8)
    args = parser.parse_args()
    if args.points < 8:
        raise SystemExit("--points must be at least eight")
    axes = _parse_axes(args.normal_axes)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        audit = linearized_fo_ccz4_constraint_propagation_audit_3d(
            points=args.points,
            normal_axis=normal_axis,
            gauge=gauge,
            rank_tolerance=args.rank_tolerance,
            closure_tolerance=args.closure_tolerance,
        )
        replay = linearized_fo_ccz4_constraint_propagation_audit_3d(
            points=args.points,
            normal_axis=normal_axis,
            gauge=gauge,
            rank_tolerance=args.rank_tolerance,
            closure_tolerance=args.closure_tolerance,
        )
        row = asdict(audit)
        row["deterministic_replay"] = audit == replay
        row["audit_executed"] = bool(
            audit.deterministic
            and row["deterministic_replay"]
            and audit.direct_symbol_crosscheck_error_l_inf <= 1.0e-8
        )
        rows.append(row)

    execution_passed = all(bool(row["audit_executed"]) for row in rows)
    closure_passed = all(bool(row["constraint_propagation_closed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-frozen-constraint-propagation-closure-shadow",
        "schema_version": "nr-k3-fo-ccz4-constraint-propagation-v2",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "gauge": asdict(gauge),
        "campaign": {
            "points": args.points,
            "normal_axes": list(axes),
            "rank_tolerance": args.rank_tolerance,
            "closure_tolerance": args.closure_tolerance,
        },
        "rows": rows,
        "validation": {
            "audit_executed": execution_passed,
            "constraint_propagation_closed": closure_passed,
            "constraint_operator_scope": {
                "kind": (
                    "ordering-definition-curl-plus-algebraic-plus-linearized-"
                    "hamiltonian-momentum-principal"
                ),
                "ordering_constraint_count": 69,
                "einstein_constraint_count": 4,
            },
            "analytic_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-candidate-constraint-subsystem-not-closed"
                if execution_passed and not closure_passed
                else "blocked-pending-constraint-propagation-audit"
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
                "audit_executed": execution_passed,
                "constraint_propagation_closed": closure_passed,
                "max_closure_residual": max(
                    float(row["normalized_closure_residual_l_inf"]) for row in rows
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    # A clean audit with a deliberately failed closure gate is expected at
    # this stage; the non-zero exit preserves that gate for callers.
    return 0 if execution_passed and closure_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

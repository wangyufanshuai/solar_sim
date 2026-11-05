"""Write the invariant-envelope completion receipt for the FO-CCZ4 map."""

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
    linearized_fo_ccz4_constraint_closure_shadow_3d,
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
        "science/numerical_relativity/fo_ccz4_z4c_projection_audit.py",
        "science/numerical_relativity/fo_ccz4_constraint_closure_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-constraint-closure-shadow.py",
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
    parser.add_argument("--max-iterations", type=int, default=8)
    args = parser.parse_args()
    if args.points < 8:
        raise SystemExit("--points must be at least eight")
    axes = _parse_axes(args.normal_axes)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        audit = linearized_fo_ccz4_constraint_closure_shadow_3d(
            points=args.points,
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
            rank_tolerance=args.rank_tolerance,
            closure_tolerance=args.closure_tolerance,
            max_iterations=args.max_iterations,
        )
        replay = linearized_fo_ccz4_constraint_closure_shadow_3d(
            points=args.points,
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
            rank_tolerance=args.rank_tolerance,
            closure_tolerance=args.closure_tolerance,
            max_iterations=args.max_iterations,
        )
        row = asdict(audit)
        row["deterministic_replay"] = bool(
            audit.completed_constraint_matrix_sha256
            == replay.completed_constraint_matrix_sha256
            and audit.closure_operator_sha256 == replay.closure_operator_sha256
            and audit.normalized_closure_residual_l_inf
            == replay.normalized_closure_residual_l_inf
        )
        row["closure_audit_executed"] = bool(
            audit.deterministic
            and row["deterministic_replay"]
            and audit.direct_symbol_crosscheck_error_l_inf <= 1.0e-8
        )
        rows.append(row)

    executed = all(bool(row["closure_audit_executed"]) for row in rows)
    envelope_validated = all(bool(row["invariant_envelope_validated"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-invariant-constraint-envelope-shadow",
        "schema_version": "nr-k3-fo-ccz4-constraint-closure-shadow-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4 candidate constraint invariant-envelope completion",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "campaign": {
            "points": args.points,
            "normal_axes": list(axes),
            "rank_tolerance": args.rank_tolerance,
            "closure_tolerance": args.closure_tolerance,
            "max_iterations": args.max_iterations,
        },
        "rows": rows,
        "validation": {
            "closure_audit_executed": executed,
            "invariant_envelope_validated": envelope_validated,
            "physical_subsidiary_equations_validated": False,
            "analytic_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-physical-interpretation-and-cpbc"
                if executed and envelope_validated
                else "blocked-pending-constraint-envelope-audit"
            ),
        },
        "primary_references": [
            "https://ar5iv.labs.arxiv.org/html/1707.09910",
            "https://arxiv.org/html/1010.0523v2",
            "https://ar5iv.labs.arxiv.org/html/1003.3328",
        ],
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
                "closure_audit_executed": executed,
                "invariant_envelope_validated": envelope_validated,
                "max_closure_residual": max(
                    float(row["normalized_closure_residual_l_inf"]) for row in rows
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if executed and envelope_validated else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Write the frozen FO-CCZ4 Gamma-driver gauge-regime receipt."""

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
    run_fo_ccz4_gauge_regime_sweep_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/ccz4_reference.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_symmetrizer_shadow.py",
        "science/numerical_relativity/fo_ccz4_gauge_regime_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-gauge-regime-sweep.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_ints(raw: str, *, name: str) -> tuple[int, ...]:
    values = tuple(int(value.strip()) for value in raw.split(",") if value.strip())
    if not values:
        raise SystemExit(f"{name} must contain at least one value")
    return values


def _parse_floats(raw: str, *, name: str) -> tuple[float, ...]:
    values = tuple(float(value.strip()) for value in raw.split(",") if value.strip())
    if not values:
        raise SystemExit(f"{name} must contain at least one value")
    return values


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--shift-coefficients", default="0.75,1.0")
    parser.add_argument("--shift-damping", type=float, default=0.0)
    parser.add_argument("--theta-coupling", type=float, default=2.0)
    parser.add_argument("--condition-number-limit", type=float, default=1.0e10)
    args = parser.parse_args()

    axes = _parse_ints(args.normal_axes, name="--normal-axes")
    coefficients = _parse_floats(
        args.shift_coefficients,
        name="--shift-coefficients",
    )
    config = FOCCZ4Config(kappa1=0.0)
    cases = run_fo_ccz4_gauge_regime_sweep_3d(
        points=args.points,
        harmonic=args.harmonic,
        normal_axes=axes,
        shift_coefficients=coefficients,
        shift_damping=args.shift_damping,
        theta_coupling=args.theta_coupling,
        config=config,
        condition_number_limit=args.condition_number_limit,
    )
    rows = [asdict(case) for case in cases]
    executed = all(
        bool(row["deterministic_replay"])
        and row["variable_count"] == 58
        and row["eigenbasis_rank"] == 58
        for row in rows
    )
    legacy_rows = [
        row
        for row in rows
        if abs(float(row["shift_coefficient"]) - 0.75) <= 1.0e-12
    ]
    tuned_rows = [
        row
        for row in rows
        if abs(float(row["shift_coefficient"]) - 1.0) <= 1.0e-12
    ]
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-gamma-driver-gauge-regime-sweep",
        "schema_version": "nr-k3-fo-ccz4-gauge-regime-v1",
        "source_digest": _source_digest(),
        "formulation": (
            "flat linearized 58-variable FO-CCZ4 frozen principal-symbol "
            "numerical symmetrizer condition sweep"
        ),
        "config": asdict(config),
        "campaign": {
            "points": args.points,
            "harmonic": args.harmonic,
            "normal_axes": list(axes),
            "shift_coefficients": list(coefficients),
            "shift_damping": args.shift_damping,
            "theta_coupling": args.theta_coupling,
            "condition_number_limit": args.condition_number_limit,
        },
        "rows": rows,
        "validation": {
            "sweep_executed": executed,
            "all_rows_condition_bound_validated": all(
                bool(row["symmetrizer_condition_bound_validated"]) for row in rows
            ),
            "all_rows_numerical_candidate_validated": all(
                bool(row["numerical_candidate_validated"]) for row in rows
            ),
            "legacy_f075_rows_observed": bool(legacy_rows),
            "legacy_f075_condition_bound_validated": bool(legacy_rows)
            and all(
                bool(row["symmetrizer_condition_bound_validated"])
                for row in legacy_rows
            ),
            "tuned_f1_rows_condition_bound_validated": bool(tuned_rows)
            and all(
                bool(row["symmetrizer_condition_bound_validated"])
                for row in tuned_rows
            ),
            "uniform_parameter_family_validated": False,
            "analytic_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-gauge-regime-resolution-analytic-uniform-"
                "symmetrizer-and-cpbc"
            ),
        },
        "primary_references": [
            "https://ar5iv.labs.arxiv.org/html/1707.09910",
            "https://github.com/GRTLCollaboration/GRChombo",
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
                "sweep_executed": executed,
                "max_symmetrizer_condition_number": max(
                    float(row["symmetrizer_condition_number"]) for row in rows
                ),
                "legacy_f075_condition_bound_validated": receipt["validation"][
                    "legacy_f075_condition_bound_validated"
                ],
                "tuned_f1_rows_condition_bound_validated": receipt["validation"][
                    "tuned_f1_rows_condition_bound_validated"
                ],
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if executed else 2


if __name__ == "__main__":
    raise SystemExit(main())


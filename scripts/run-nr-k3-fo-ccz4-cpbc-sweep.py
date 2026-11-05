"""Sweep FO-CCZ4 shadow gauge/ordering settings with explicit negative controls."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    GaugeConfig,
    linearized_fo_ccz4_cpbc_audit_3d,
)


CASES: tuple[dict[str, object], ...] = (
    {"name": "tuned-mu-half", "shift_coefficient": 1.0, "ordering_mu": 0.5, "expected": "pass"},
    {"name": "tuned-default", "shift_coefficient": 1.0, "ordering_mu": 1.0, "expected": "pass"},
    {"name": "moderate-shift", "shift_coefficient": 1.25, "ordering_mu": 1.0, "expected": "pass"},
    {"name": "ordering-degeneracy", "shift_coefficient": 1.0, "ordering_mu": 2.0, "expected": "fail"},
    {"name": "shift-degeneracy", "shift_coefficient": 1.5, "ordering_mu": 1.0, "expected": "fail"},
    {"name": "legacy-gamma-driver", "shift_coefficient": 0.75, "ordering_mu": 1.0, "expected": "fail"},
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_cpbc_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-cpbc-sweep.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _json_safe(value: object) -> object:
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _numerical_passed(row: dict[str, object]) -> bool:
    condition = row["characteristic_basis_condition_number"]
    symmetrizer_condition = row["symmetrizer_condition_number"]
    return bool(
        row["characteristic_basis_rank"] == 58
        and isinstance(condition, (int, float))
        and math.isfinite(float(condition))
        and float(condition) < 1.0e6
        and row["symmetrizer_positive_definite"] is True
        and isinstance(symmetrizer_condition, (int, float))
        and math.isfinite(float(symmetrizer_condition))
        and float(symmetrizer_condition) < 1.0e8
        and float(row["symmetrizer_energy_residual_l_inf"]) < 1.0e-8
        and row["right_incoming_constraint_rank"] == 16
        and row["left_incoming_constraint_rank"] == 16
        and float(row["right_incoming_constraint_map_residual_l_inf"]) < 1.0e-8
        and float(row["left_incoming_constraint_map_residual_l_inf"]) < 1.0e-8
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--harmonic", type=int, default=1)
    args = parser.parse_args()
    if args.points < 8:
        raise SystemExit("--points must be at least eight")

    rows: list[dict[str, object]] = []
    for case in CASES:
        gauge = GaugeConfig(
            shift_coefficient=float(case["shift_coefficient"]),
            shift_damping=0.0,
            theta_coupling=2.0,
        )
        config = FOCCZ4Config(
            kappa1=0.0,
            ordering_mu=float(case["ordering_mu"]),
        )
        audit = linearized_fo_ccz4_cpbc_audit_3d(
            points=args.points,
            harmonic=args.harmonic,
            gauge=gauge,
            config=config,
        )
        row = _json_safe(asdict(audit))
        if not isinstance(row, dict):  # pragma: no cover
            raise AssertionError("audit row did not serialize as an object")
        row.update(
            {
                "name": case["name"],
                "shift_coefficient": float(case["shift_coefficient"]),
                "ordering_mu": float(case["ordering_mu"]),
                "expected": case["expected"],
            }
        )
        actual = _numerical_passed(row)
        row["numerical_prerequisite_passed"] = actual
        row["classification_match"] = actual == (case["expected"] == "pass")
        rows.append(row)

    classification_contract_passed = all(
        bool(row["classification_match"]) for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-cpbc-parameter-sweep",
        "schema_version": "nr-k3-fo-ccz4-cpbc-sweep-v1",
        "source_digest": _source_digest(),
        "points": args.points,
        "harmonic": args.harmonic,
        "cases": rows,
        "validation": {
            "classification_contract_passed": classification_contract_passed,
            "positive_case_count": sum(row["expected"] == "pass" for row in rows),
            "negative_control_count": sum(row["expected"] == "fail" for row in rows),
            "analytic_symmetrizer_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-parameter-domain-and-cpbc",
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
                "classification_contract_passed": classification_contract_passed,
                "positive_case_count": receipt["validation"]["positive_case_count"],
                "negative_control_count": receipt["validation"]["negative_control_count"],
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if classification_contract_passed and receipt["validation"]["cpbc_ready"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

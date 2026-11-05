"""Write the FO-CCZ4 numerical characteristic/CPBC shadow receipt."""

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
    linearized_fo_ccz4_cpbc_audit_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_cpbc_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-cpbc-audit.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _checks(row: dict[str, object]) -> dict[str, bool]:
    return {
        "published_speed_census": float(row["published_speed_census_error"]) <= 1.0e-8,
        "published_gamma_driver_non_degenerate": bool(
            row["published_gamma_driver_non_degenerate"]
        ),
        "complete_characteristic_basis": row["characteristic_basis_rank"] == 58
        and float(row["characteristic_basis_condition_number"]) < 1.0e4,
        "real_principal_matrix": float(row["principal_matrix_real_residual_l_inf"])
        <= 1.0e-10,
        "characteristic_diagonalization": float(
            row["characteristic_diagonal_residual_l_inf"]
        )
        <= 1.0e-8,
        "positive_numerical_symmetrizer": bool(row["symmetrizer_positive_definite"]),
        "symmetrizer_energy_identity": float(
            row["symmetrizer_energy_residual_l_inf"]
        )
        <= 1.0e-8,
        "right_incoming_constraint_rank": row["right_incoming_constraint_rank"]
        == row["right_incoming_mode_count"],
        "left_incoming_constraint_rank": row["left_incoming_constraint_rank"]
        == row["left_incoming_mode_count"],
        "right_incoming_constraint_map": float(
            row["right_incoming_constraint_map_residual_l_inf"]
        )
        <= 1.0e-8,
        "left_incoming_constraint_map": float(
            row["left_incoming_constraint_map_residual_l_inf"]
        )
        <= 1.0e-8,
        "deterministic_replay": bool(row["deterministic_replay"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="8,10,12")
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--rank-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 8 for value in points):
        raise SystemExit("--points must contain at least two values >= 8")
    if any(points[index] >= points[index + 1] for index in range(len(points) - 1)):
        raise SystemExit("--points must be strictly increasing")

    gauge = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    rows: list[dict[str, object]] = []
    for point_count in points:
        audit = linearized_fo_ccz4_cpbc_audit_3d(
            points=point_count,
            harmonic=args.harmonic,
            gauge=gauge,
            rank_tolerance=args.rank_tolerance,
        )
        replay = linearized_fo_ccz4_cpbc_audit_3d(
            points=point_count,
            harmonic=args.harmonic,
            gauge=gauge,
            rank_tolerance=args.rank_tolerance,
        )
        row = asdict(audit)
        row["deterministic_replay"] = audit == replay
        row["numerical_prerequisite_checks"] = _checks(row)
        row["numerical_prerequisite_audit_passed"] = bool(
            all(row["numerical_prerequisite_checks"].values())
        )
        rows.append(row)

    numerical_passed = all(
        bool(row["numerical_prerequisite_audit_passed"]) for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-numerical-characteristic-cpbc-shadow",
        "schema_version": "nr-k3-fo-ccz4-cpbc-audit-v2",
        "source_digest": _source_digest(),
        "gauge": asdict(gauge),
        "points": list(points),
        "harmonic": args.harmonic,
        "rank_tolerance": args.rank_tolerance,
        "rows": rows,
        "validation": {
            "numerical_prerequisite_audit_passed": numerical_passed,
            "phase_speed_convention": (
                "raw principal eigenvalue a in q_t=A^n*partial_n q; "
                "physical coordinate speed is -a"
            ),
            "constraint_operator_scope": {
                "kind": "ordering-definition-curl-plus-algebraic",
                "contains_hamiltonian_momentum_constraints": False,
            },
            "numerical_symmetrizer_constructed": True,
            "analytic_symmetrizer_validated": False,
            "incoming_constraint_map_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-analytic-symmetrizer-cpbc-and-physical-validation"
            ),
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
                "points": list(points),
                "numerical_prerequisite_audit_passed": numerical_passed,
                "characteristic_basis_rank": final["characteristic_basis_rank"],
                "characteristic_basis_condition_number": final[
                    "characteristic_basis_condition_number"
                ],
                "symmetrizer_condition_number": final["symmetrizer_condition_number"],
                "symmetrizer_energy_residual_l_inf": final[
                    "symmetrizer_energy_residual_l_inf"
                ],
                "right_incoming_constraint_rank": final[
                    "right_incoming_constraint_rank"
                ],
                "left_incoming_constraint_rank": final[
                    "left_incoming_constraint_rank"
                ],
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    # The numerical prerequisite can pass while the actual analytic CPBC gate
    # remains intentionally closed.
    return 0 if numerical_passed and receipt["validation"]["cpbc_ready"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

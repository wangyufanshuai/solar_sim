"""Audit the FO-CCZ4 frozen-coefficient boundary prerequisites.

This driver deliberately stops one layer before a physical characteristic
boundary condition.  It verifies the finite-dimensional spectral facts that a
CPBC implementation must consume, while keeping formulation-specific
eigenvectors, a symmetrizer/energy estimate, and incoming constraint data
explicitly unavailable.  A passing receipt is therefore a boundary-design
precondition, never a CPBC or production-boundary claim.  The executable exits
with status 2 until both the spectral audit and the explicit CPBC gate are
closed, so a spectral-only pass cannot be mistaken for a usable boundary.
"""

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
    GaugeConfig,
    linearized_fo_ccz4_principal_symbol_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "scripts/run-nr-k3-fo-ccz4-principal-symbol.py",
        "scripts/run-nr-k3-fo-ccz4-boundary-audit.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _row(
    *,
    points: int,
    harmonic: int,
    gauge: GaugeConfig,
    condition_limit: float,
    speed_tolerance: float,
) -> dict[str, object]:
    report = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        gauge=gauge,
    )
    replay = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        gauge=gauge,
    )
    row = asdict(report)
    expected_speed_errors = {
        name: float(value) for name, value in report.expected_speed_errors.items()
    }
    phase_speeds = np.asarray(report.phase_speeds, dtype=np.float64)
    sorted_phase_speeds = np.sort(phase_speeds)
    checks = {
        "variable_contract": report.variable_count == 58
        and report.ode_variable_count == 11
        and report.pde_variable_count == 47,
        "finite_spectrum": bool(
            np.all(np.isfinite(phase_speeds))
            and np.isfinite(report.max_real_eigenvalue_abs)
            and np.isfinite(report.eigenvector_condition_number)
        ),
        "full_eigenvector_rank": report.eigenvector_rank == 58,
        "full_symbol_eigenvector_residual": report.full_symbol_eigenvector_residual_l_inf
        <= 1.0e-8,
        "full_symbol_conditioned": report.full_symbol_condition_number
        <= condition_limit,
        "full_symbol_inverse_residual": report.full_symbol_inverse_residual_l_inf
        <= 1.0e-8,
        "full_symbol_mode_balance": report.full_symbol_incoming_mode_count
        == report.full_symbol_outgoing_mode_count
        and report.full_symbol_incoming_mode_count > 0,
        "ode_principal_rows": report.ode_principal_row_residual_l_inf <= 1.0e-10,
        "ode_principal_columns": report.ode_principal_column_residual_l_inf <= 1.0e-10,
        "full_symbol_diagonalizable": report.full_symbol_diagonalizable,
        "real_principal_spectrum": report.max_real_eigenvalue_abs <= 1.0e-10,
        "paired_phase_spectrum": bool(
            np.max(np.abs(sorted_phase_speeds + sorted_phase_speeds[::-1])) <= 1.0e-10
        ),
        "expected_speed_census": max(expected_speed_errors.values()) <= speed_tolerance,
        "constraint_mode_balance": report.incoming_constraint_mode_count
        == report.outgoing_constraint_mode_count
        and report.incoming_constraint_mode_count > 0,
        "conditioned_audit_basis": report.eigenvector_condition_number <= condition_limit,
        "deterministic_replay": report.symbol_sha256 == replay.symbol_sha256
        and report.eigenvector_sha256 == replay.eigenvector_sha256
        and report.constraint_map_sha256 == replay.constraint_map_sha256,
    }
    row["audit_checks"] = checks
    row["zero_speed_mode_count"] = int(np.count_nonzero(np.abs(phase_speeds) <= 1.0e-10))
    row["split_spectrum_audit_passed"] = bool(
        all(value for name, value in checks.items() if not name.startswith("full_symbol_"))
    )
    row["spectrum_audit_passed"] = bool(all(checks.values()))
    row["cpbc_prerequisites"] = {
        "formulation_specific_eigenbasis": bool(report.eigenvectors_available),
        "symmetrizer_energy_estimate": False,
        "incoming_constraint_data_map": bool(report.constraint_preserving_validated),
        "physical_boundary_validation": bool(report.physical_boundary_validated),
    }
    row["cpbc_ready"] = False
    row["promotion"] = "blocked-pending-eigenbasis-symmetrizer-and-cpbc"
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="8,10,12")
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    parser.add_argument("--condition-limit", type=float, default=1.0e4)
    parser.add_argument("--speed-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 8 for value in points):
        raise SystemExit("--points must contain at least two values >= 8")
    if any(points[index] >= points[index + 1] for index in range(len(points) - 1)):
        raise SystemExit("--points must be strictly increasing")
    if not np.isfinite(args.condition_limit) or args.condition_limit <= 0.0:
        raise SystemExit("--condition-limit must be finite and positive")
    if not np.isfinite(args.speed_tolerance) or args.speed_tolerance <= 0.0:
        raise SystemExit("--speed-tolerance must be finite and positive")

    gauge = GaugeConfig(
        shift_coefficient=args.shift_coefficient,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    rows = [
        _row(
            points=point_count,
            harmonic=args.harmonic,
            gauge=gauge,
            condition_limit=args.condition_limit,
            speed_tolerance=args.speed_tolerance,
        )
        for point_count in points
    ]
    split_spectrum_audit_passed = all(
        bool(row["split_spectrum_audit_passed"]) for row in rows
    )
    spectrum_audit_passed = all(bool(row["spectrum_audit_passed"]) for row in rows)
    cpbc_ready = all(bool(row["cpbc_ready"]) for row in rows)
    boundary_gate_passed = bool(spectrum_audit_passed and cpbc_ready)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-characteristic-boundary-prerequisite-audit",
        "schema_version": "nr-k3-fo-ccz4-boundary-audit-v1",
        "source_digest": _source_digest(),
        "gauge": asdict(gauge),
        "points": list(points),
        "harmonic": args.harmonic,
        "condition_limit": args.condition_limit,
        "speed_tolerance": args.speed_tolerance,
        "rows": rows,
        "audit": {
            "split_spectrum_audit_passed": split_spectrum_audit_passed,
            "spectrum_audit_passed": spectrum_audit_passed,
            "boundary_gate_passed": boundary_gate_passed,
            "full_symbol_diagonalizable": all(
                bool(row["full_symbol_diagonalizable"]) for row in rows
            ),
            "full_symbol_defects": [int(row["full_symbol_defect"]) for row in rows],
            "full_symbol_condition_numbers": [
                float(row["full_symbol_condition_number"]) for row in rows
            ],
            "full_symbol_inverse_residuals": [
                float(row["full_symbol_inverse_residual_l_inf"]) for row in rows
            ],
            "full_symbol_mode_counts": [
                {
                    "incoming": int(row["full_symbol_incoming_mode_count"]),
                    "outgoing": int(row["full_symbol_outgoing_mode_count"]),
                    "zero": int(row["full_symbol_zero_speed_mode_count"]),
                }
                for row in rows
            ],
            "cpbc_ready": cpbc_ready,
            "eigenvectors_available": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-eigenbasis-symmetrizer-and-cpbc",
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
                "spectrum_audit_passed": spectrum_audit_passed,
                "boundary_gate_passed": boundary_gate_passed,
                "variable_count": final["variable_count"],
                "eigenvector_rank": final["eigenvector_rank"],
                "eigenvector_condition_number": final["eigenvector_condition_number"],
                "ode_principal_row_residual_l_inf": final[
                    "ode_principal_row_residual_l_inf"
                ],
                "ode_principal_column_residual_l_inf": final[
                    "ode_principal_column_residual_l_inf"
                ],
                "full_symbol_eigenvector_rank": final["full_symbol_eigenvector_rank"],
                "full_symbol_defect": final["full_symbol_defect"],
                "full_symbol_condition_number": final["full_symbol_condition_number"],
                "full_symbol_inverse_residual_l_inf": final[
                    "full_symbol_inverse_residual_l_inf"
                ],
                "full_symbol_eigenvector_residual_l_inf": final[
                    "full_symbol_eigenvector_residual_l_inf"
                ],
                "incoming_constraint_mode_count": final["incoming_constraint_mode_count"],
                "outgoing_constraint_mode_count": final["outgoing_constraint_mode_count"],
                "cpbc_ready": cpbc_ready,
                "promotion": receipt["audit"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if boundary_gate_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Write the full 58-variable frozen FO-CCZ4 CPBC energy receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    linearized_fo_ccz4_full_cpbc_energy_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_einstein_constraints.py",
        "science/numerical_relativity/fo_ccz4_full_cpbc_energy_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-full-cpbc-energy-shadow.py",
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


def _parse_orientations(raw: str) -> tuple[str, ...]:
    orientations = tuple(
        value.strip().lower() for value in raw.split(",") if value.strip()
    )
    if not orientations or any(value not in ("right", "left") for value in orientations):
        raise SystemExit("--orientations must contain one or more values from right,left")
    if len(set(orientations)) != len(orientations):
        raise SystemExit("--orientations must not repeat a face")
    return orientations


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--orientations", default="right,left")
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--energy-tolerance", type=float, default=1.0e-8)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    orientations = _parse_orientations(args.orientations)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        for orientation in orientations:
            report = linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
                points=args.points,
                harmonic=args.harmonic,
                normal_axis=normal_axis,
                orientation=orientation,
                energy_tolerance=args.energy_tolerance,
            )
            replay = linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
                points=args.points,
                harmonic=args.harmonic,
                normal_axis=normal_axis,
                orientation=orientation,
                energy_tolerance=args.energy_tolerance,
            )
            row = asdict(report)
            row["deterministic_replay"] = bool(
                report.incoming_constraint_map_sha256
                == replay.incoming_constraint_map_sha256
                and report.source_energy_log_norm == replay.source_energy_log_norm
                and report.homogeneous_boundary_flux_max_eigenvalue
                == replay.homogeneous_boundary_flux_max_eigenvalue
            )
            row["full_cpbc_energy_audit_executed"] = bool(
                report.deterministic
                and row["deterministic_replay"]
                and report.numerical_symmetrizer_validated
                and report.incoming_constraint_map_validated
                and report.homogeneous_boundary_energy_validated
            )
            rows.append(row)

    executed = all(bool(row["full_cpbc_energy_audit_executed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-58-full-frozen-cpbc-energy-shadow",
        "schema_version": "nr-k3-fo-ccz4-full-cpbc-energy-v1",
        "source_digest": _source_digest(),
        "formulation": "flat linearized 58-variable FO-CCZ4 frozen Fourier CPBC energy candidate",
        "campaign": {
            "normal_axes": list(axes),
            "orientations": list(orientations),
            "points": args.points,
            "harmonic": args.harmonic,
            "energy_tolerance": args.energy_tolerance,
        },
        "rows": rows,
        "validation": {
            "full_cpbc_energy_audit_executed": executed,
            "characteristic_census_validated": all(
                row["variable_count"] == 58
                and row["incoming_mode_count"] == 16
                and row["outgoing_mode_count"] == 16
                and row["zero_mode_count"] == 26
                for row in rows
            ),
            "numerical_symmetrizer_candidate_validated": all(
                bool(row["numerical_symmetrizer_validated"]) for row in rows
            ),
            "incoming_constraint_map_validated": all(
                bool(row["incoming_constraint_map_validated"]) for row in rows
            ),
            "homogeneous_boundary_energy_validated": all(
                bool(row["homogeneous_boundary_energy_validated"]) for row in rows
            ),
            "analytic_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-analytic-uniform-symmetrizer-variable-coefficients-"
                "nonlinear-cpbc"
            ),
        },
        "primary_references": [
            "https://ar5iv.labs.arxiv.org/html/1707.09910",
            "https://arxiv.org/html/1010.0523v2",
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
                "full_cpbc_energy_audit_executed": executed,
                "max_boundary_flux": max(
                    float(row["homogeneous_boundary_flux_max_eigenvalue"])
                    for row in rows
                ),
                "max_map_residual": max(
                    float(row["incoming_constraint_map_residual_l_inf"])
                    for row in rows
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if executed else 2


if __name__ == "__main__":
    raise SystemExit(main())


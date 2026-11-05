"""Write the 58-variable FO-CCZ4 numerical symmetrizer shadow receipt."""

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
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_symmetrizer_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-symmetrizer-shadow.py",
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
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--rank-tolerance", type=float, default=1.0e-10)
    parser.add_argument("--eigenbasis-tolerance", type=float, default=1.0e-8)
    parser.add_argument("--symmetry-tolerance", type=float, default=1.0e-8)
    parser.add_argument("--condition-number-limit", type=float, default=1.0e10)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        audit = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
            points=args.points,
            harmonic=args.harmonic,
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
            rank_tolerance=args.rank_tolerance,
            eigenbasis_tolerance=args.eigenbasis_tolerance,
            symmetry_tolerance=args.symmetry_tolerance,
            condition_number_limit=args.condition_number_limit,
        )
        replay = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
            points=args.points,
            harmonic=args.harmonic,
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
            rank_tolerance=args.rank_tolerance,
            eigenbasis_tolerance=args.eigenbasis_tolerance,
            symmetry_tolerance=args.symmetry_tolerance,
            condition_number_limit=args.condition_number_limit,
        )
        row = asdict(audit)
        for name in (
            "principal_matrix",
            "eigenvalues",
            "eigenbasis",
            "symmetrizer",
            "weighted_principal_matrix",
        ):
            row.pop(name, None)
        row["deterministic_replay"] = bool(
            audit.symmetrizer_sha256 == replay.symmetrizer_sha256
            and audit.weighted_principal_symmetry_residual_l_inf
            == replay.weighted_principal_symmetry_residual_l_inf
        )
        row["symmetrizer_audit_executed"] = bool(
            audit.deterministic
            and row["deterministic_replay"]
            and audit.numerical_candidate_validated
        )
        rows.append(row)

    executed = all(bool(row["symmetrizer_audit_executed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-58-numerical-symmetrizer-shadow",
        "schema_version": "nr-k3-fo-ccz4-58-numerical-symmetrizer-v2-condition-bound",
        "source_digest": _source_digest(),
        "formulation": "58-variable FO-CCZ4 frozen principal-symbol numerical candidate",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "campaign": {
            "points": args.points,
            "harmonic": args.harmonic,
            "normal_axes": list(axes),
            "rank_tolerance": args.rank_tolerance,
            "eigenbasis_tolerance": args.eigenbasis_tolerance,
            "symmetry_tolerance": args.symmetry_tolerance,
            "condition_number_limit": args.condition_number_limit,
        },
        "rows": rows,
        "validation": {
            "symmetrizer_audit_executed": executed,
            "numerical_candidate_symmetrizer_validated": all(
                bool(row["numerical_candidate_validated"]) for row in rows
            ),
            "condition_number_bound_validated": all(
                bool(row["symmetrizer_condition_bound_validated"]) for row in rows
            ),
            "analytic_symmetrizer_validated": False,
            "parameter_sweep_validated": False,
            "full_nonlinear_energy_estimate_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-uniform-symmetrizer-and-cpbc",
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
                "symmetrizer_audit_executed": executed,
                "max_basis_residual": max(
                    float(row["eigenbasis_residual_l_inf"]) for row in rows
                ),
                "max_weighted_symmetry_residual": max(
                    float(row["weighted_principal_symmetry_residual_l_inf"])
                    for row in rows
                ),
                "max_symmetrizer_condition_number": max(
                    float(row["symmetrizer_condition_number"]) for row in rows
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

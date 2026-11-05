"""Write the reduced Z4c subsidiary symmetrizer shadow receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    linearized_z4c_subsidiary_symmetrizer_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_subsidiary_shadow.py",
        "science/numerical_relativity/fo_ccz4_subsidiary_symmetrizer_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-subsidiary-symmetrizer-shadow.py",
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
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--lapse", type=float, default=1.0)
    parser.add_argument("--shift-normal", type=float, default=0.0)
    parser.add_argument("--closure-tolerance", type=float, default=1.0e-10)
    parser.add_argument("--symmetry-tolerance", type=float, default=1.0e-12)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        audit = linearized_z4c_subsidiary_symmetrizer_shadow_3d(
            normal_axis=normal_axis,
            lapse=args.lapse,
            shift_normal=args.shift_normal,
            closure_tolerance=args.closure_tolerance,
            symmetry_tolerance=args.symmetry_tolerance,
        )
        replay = linearized_z4c_subsidiary_symmetrizer_shadow_3d(
            normal_axis=normal_axis,
            lapse=args.lapse,
            shift_normal=args.shift_normal,
            closure_tolerance=args.closure_tolerance,
            symmetry_tolerance=args.symmetry_tolerance,
        )
        row = asdict(audit)
        row.pop("symmetrizer", None)
        row.pop("weighted_principal_matrix", None)
        row["deterministic_replay"] = bool(
            audit.symmetrizer_sha256 == replay.symmetrizer_sha256
            and audit.weighted_principal_symmetry_residual_l_inf
            == replay.weighted_principal_symmetry_residual_l_inf
        )
        row["symmetrizer_audit_executed"] = bool(
            audit.deterministic
            and row["deterministic_replay"]
            and audit.symmetrizer_validated
        )
        rows.append(row)

    executed = all(bool(row["symmetrizer_audit_executed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-z4c-subsidiary-symmetrizer-shadow",
        "schema_version": "nr-k3-fo-ccz4-subsidiary-symmetrizer-v1",
        "source_digest": _source_digest(),
        "formulation": "flat linearized Z4c subsidiary 10-state block",
        "campaign": {
            "normal_axes": list(axes),
            "lapse": args.lapse,
            "shift_normal": args.shift_normal,
            "closure_tolerance": args.closure_tolerance,
            "symmetry_tolerance": args.symmetry_tolerance,
        },
        "rows": rows,
        "validation": {
            "symmetrizer_audit_executed": executed,
            "positive_definite_symmetrizer_validated": all(
                bool(row["positive_definite"]) for row in rows
            ),
            "principal_energy_symmetry_validated": all(
                bool(row["symmetrizer_validated"]) for row in rows
            ),
            "full_58_variable_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-58-variable-symmetrizer-and-cpbc",
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
                "symmetrizer_audit_executed": executed,
                "max_symmetry_residual": max(
                    float(row["weighted_principal_symmetry_residual_l_inf"])
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

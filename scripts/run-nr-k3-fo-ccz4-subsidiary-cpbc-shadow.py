"""Write a frozen reduced-Z4c maximally-dissipative boundary receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    linearized_z4c_subsidiary_cpbc_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_subsidiary_shadow.py",
        "science/numerical_relativity/fo_ccz4_subsidiary_symmetrizer_shadow.py",
        "science/numerical_relativity/fo_ccz4_subsidiary_cpbc_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-subsidiary-cpbc-shadow.py",
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
    parser.add_argument("--orientations", default="right,left")
    parser.add_argument("--lapse", type=float, default=1.0)
    parser.add_argument("--shift-normal", type=float, default=0.0)
    parser.add_argument("--reflection-coefficient", type=float, default=0.0)
    parser.add_argument("--speed-tolerance", type=float, default=1.0e-10)
    parser.add_argument("--closure-tolerance", type=float, default=1.0e-10)
    parser.add_argument("--energy-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    orientations = tuple(
        value.strip() for value in args.orientations.split(",") if value.strip()
    )
    if not orientations or any(value not in ("right", "left") for value in orientations):
        raise SystemExit("--orientations must contain right and/or left")
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        for orientation in orientations:
            audit = linearized_z4c_subsidiary_cpbc_shadow_3d(
                normal_axis=normal_axis,
                lapse=args.lapse,
                shift_normal=args.shift_normal,
                orientation=orientation,
                reflection_coefficient=args.reflection_coefficient,
                speed_tolerance=args.speed_tolerance,
                closure_tolerance=args.closure_tolerance,
                energy_tolerance=args.energy_tolerance,
            )
            replay = linearized_z4c_subsidiary_cpbc_shadow_3d(
                normal_axis=normal_axis,
                lapse=args.lapse,
                shift_normal=args.shift_normal,
                orientation=orientation,
                reflection_coefficient=args.reflection_coefficient,
                speed_tolerance=args.speed_tolerance,
                closure_tolerance=args.closure_tolerance,
                energy_tolerance=args.energy_tolerance,
            )
            row = asdict(audit)
            row["deterministic_replay"] = bool(
                audit.boundary_map_sha256 == replay.boundary_map_sha256
                and audit.boundary_energy_rate_max_eigenvalue
                == replay.boundary_energy_rate_max_eigenvalue
            )
            row["cpbc_shadow_audit_executed"] = bool(
                audit.deterministic
                and row["deterministic_replay"]
                and audit.homogeneous_maximally_dissipative_validated
            )
            rows.append(row)

    executed = all(bool(row["cpbc_shadow_audit_executed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-subsidiary-maximally-dissipative-shadow",
        "schema_version": "nr-k3-fo-ccz4-subsidiary-cpbc-v2",
        "source_digest": _source_digest(),
        "formulation": "flat linearized Z4c subsidiary 10-state principal system",
        "campaign": {
            "normal_axes": list(axes),
            "orientations": list(orientations),
            "lapse": args.lapse,
            "shift_normal": args.shift_normal,
            "reflection_coefficient": args.reflection_coefficient,
            "speed_tolerance": args.speed_tolerance,
            "closure_tolerance": args.closure_tolerance,
            "energy_tolerance": args.energy_tolerance,
        },
        "rows": rows,
        "validation": {
            "cpbc_shadow_audit_executed": executed,
            "homogeneous_maximally_dissipative_validated": all(
                bool(row["homogeneous_maximally_dissipative_validated"])
                for row in rows
            ),
            "source_terms_excluded": all(
                bool(row["source_terms_excluded"]) for row in rows
            ),
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-58-variable-nonlinear-cpbc-and-physical-boundary",
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
                "cpbc_shadow_audit_executed": executed,
                "max_boundary_energy_rate": max(
                    float(row["boundary_energy_rate_max_eigenvalue"])
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

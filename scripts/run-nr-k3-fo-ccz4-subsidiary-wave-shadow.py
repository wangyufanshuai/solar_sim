"""Write the closed linearized Z4c subsidiary-wave receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    linearized_z4c_subsidiary_wave_shadow_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4_subsidiary_wave.py",
        "scripts/run-nr-k3-fo-ccz4-subsidiary-wave-shadow.py",
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


def _row(report) -> dict[str, object]:
    return {
        "normal_axis": report.normal_axis,
        "lapse": report.lapse,
        "shift_normal": report.shift_normal,
        "effective_wave_number": report.effective_wave_number,
        "state_order": list(report.state_order),
        "principal_matrix_shape": list(report.principal_matrix.shape),
        "source_matrix_shape": list(report.source_matrix.shape),
        "characteristic_speeds": list(report.characteristic_speeds),
        "phase_speed_convention": report.phase_speed_convention,
        "positive_speed_count": report.positive_speed_count,
        "negative_speed_count": report.negative_speed_count,
        "zero_speed_count": report.zero_speed_count,
        "compatibility_constraint_count": report.compatibility_constraint_count,
        "compatibility_constraint_rank": report.compatibility_constraint_rank,
        "compatibility_propagation_rank": report.compatibility_propagation_rank,
        "compatibility_closure_residual_l_inf": (
            report.compatibility_closure_residual_l_inf
        ),
        "right_incoming_count": report.right_incoming_count,
        "left_incoming_count": report.left_incoming_count,
        "right_incoming_characteristic_rows": list(
            report.right_incoming_characteristic_rows
        ),
        "left_incoming_characteristic_rows": list(
            report.left_incoming_characteristic_rows
        ),
        "subsidiary_wave_closed": report.subsidiary_wave_closed,
        "projection_from_fo_ccz4_validated": report.projection_from_fo_ccz4_validated,
        "cpbc_ready": report.cpbc_ready,
        "deterministic": report.deterministic,
        "principal_matrix_sha256": report.principal_matrix_sha256,
        "method": report.method,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--closure-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        report = linearized_z4c_subsidiary_wave_shadow_3d(
            normal_axis=normal_axis,
            closure_tolerance=args.closure_tolerance,
        )
        replay = linearized_z4c_subsidiary_wave_shadow_3d(
            normal_axis=normal_axis,
            closure_tolerance=args.closure_tolerance,
        )
        row = _row(report)
        row["deterministic_replay"] = bool(
            report.principal_matrix_sha256 == replay.principal_matrix_sha256
            and report.characteristic_speeds == replay.characteristic_speeds
            and report.right_incoming_characteristic_rows
            == replay.right_incoming_characteristic_rows
        )
        rows.append(row)

    shifted = _row(
        linearized_z4c_subsidiary_wave_shadow_3d(
            normal_axis=axes[0],
            lapse=1.5,
            shift_normal=2.0,
            effective_wave_number=2.0,
            closure_tolerance=args.closure_tolerance,
        )
    )
    rows.append({"case": "superluminal-normal-shift-control", **shifted})
    audit_executed = all(
        bool(row["deterministic"])
        and bool(row.get("deterministic_replay", True))
        and bool(row["subsidiary_wave_closed"])
        for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-linearized-z4c-subsidiary-wave-shadow",
        "schema_version": "nr-k3-fo-ccz4-subsidiary-wave-shadow-v2",
        "source_digest": _source_digest(),
        "formulation": "Z4c subsidiary wave reduction for FO-CCZ4 CPBC derivation",
        "campaign": {
            "normal_axes": list(axes),
            "closure_tolerance": args.closure_tolerance,
            "shift_control_included": True,
        },
        "rows": rows,
        "validation": {
            "audit_executed": audit_executed,
            "subsidiary_wave_closed": audit_executed,
            "projection_from_fo_ccz4_validated": False,
            "continuum_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-fo-ccz4-projection-and-main-system-cpbc"
                if audit_executed
                else "blocked-pending-subsidiary-wave-audit"
            ),
        },
        "primary_references": [
            "https://arxiv.org/html/1010.0523v2",
            "https://ar5iv.labs.arxiv.org/html/gr-qc/0411110",
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
                "audit_executed": audit_executed,
                "max_closure_residual": max(
                    float(row["compatibility_closure_residual_l_inf"]) for row in rows
                ),
                "cpbc_ready": False,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if audit_executed else 2


if __name__ == "__main__":
    raise SystemExit(main())

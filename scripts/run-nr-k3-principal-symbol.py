"""Write a discrete 3-D CCZ4/BSSN principal-symbol shadow receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    linearized_principal_symbol_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/principal_symbol3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/ccz4_reference.py",
        "scripts/run-nr-k3-principal-symbol.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--points", default="10,14,18")
    parser.add_argument("--harmonic", type=int, default=1)
    args = parser.parse_args()

    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 8 for value in points):
        raise SystemExit("--points must contain at least two values >= 8")
    if any(points[index] >= points[index + 1] for index in range(len(points) - 1)):
        raise SystemExit("--points must be strictly increasing")

    rows = []
    for points_value in points:
        report = linearized_principal_symbol_3d(
            args.formulation,
            points=points_value,
            harmonic=args.harmonic,
        )
        replay = linearized_principal_symbol_3d(
            args.formulation,
            points=points_value,
            harmonic=args.harmonic,
        )
        row = asdict(report)
        row["deterministic_replay"] = report.symbol_sha256 == replay.symbol_sha256
        rows.append(row)

    receipt = {
        "benchmark": "nr-k3-discrete-principal-symbol-shadow",
        "schema_version": "nr-k3-principal-symbol-v1",
        "formulation": args.formulation,
        "source_digest": _source_digest(),
        "harmonic": args.harmonic,
        "rows": rows,
        "validation": {
            "linearized_rhs_audit": True,
            "eigenvectors_available": False,
            "physical_boundary_validated": False,
            "constraint_preserving_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-k3-formulation-characteristics",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(args.output.resolve()),
        "formulation": args.formulation,
        "points": list(points),
        "replay": all(row["deterministic_replay"] for row in rows),
        "speed_errors": rows[-1]["expected_speed_errors"],
        "eigenvector_rank": rows[-1]["eigenvector_rank"],
        "eigenvector_condition_number": rows[-1]["eigenvector_condition_number"],
        "constraint_map_rank": rows[-1]["constraint_map_rank"],
        "constraint_mode_count": rows[-1]["constraint_mode_count"],
        "incoming_constraint_mode_count": rows[-1]["incoming_constraint_mode_count"],
        "outgoing_constraint_mode_count": rows[-1]["outgoing_constraint_mode_count"],
        "promotion": receipt["validation"]["promotion"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

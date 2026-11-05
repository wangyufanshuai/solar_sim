"""Write a 58-variable FO-CCZ4 principal-symbol shadow receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity.ccz4_reference import GaugeConfig  # noqa: E402
from science.numerical_relativity import (  # noqa: E402
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
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="8,10,12")
    parser.add_argument("--harmonic", type=int, default=1)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    args = parser.parse_args()
    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 8 for value in points):
        raise SystemExit("--points must contain at least two values >= 8")
    if any(points[index] >= points[index + 1] for index in range(len(points) - 1)):
        raise SystemExit("--points must be strictly increasing")

    rows = []
    gauge = GaugeConfig(
        shift_coefficient=args.shift_coefficient,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    for point_count in points:
        report = linearized_fo_ccz4_principal_symbol_3d(
            points=point_count,
            harmonic=args.harmonic,
            gauge=gauge,
        )
        replay = linearized_fo_ccz4_principal_symbol_3d(
            points=point_count,
            harmonic=args.harmonic,
            gauge=gauge,
        )
        row = asdict(report)
        row["deterministic_replay"] = (
            report.symbol_sha256 == replay.symbol_sha256
            and report.eigenvector_sha256 == replay.eigenvector_sha256
            and report.constraint_map_sha256 == replay.constraint_map_sha256
        )
        rows.append(row)

    receipt = {
        "benchmark": "nr-k3-fo-ccz4-58-variable-principal-symbol-shadow",
        "schema_version": "nr-k3-fo-ccz4-principal-symbol-v3-nonzero-speed-defect",
        "source_digest": _source_digest(),
        "harmonic": args.harmonic,
        "gauge": asdict(gauge),
        "rows": rows,
        "validation": {
            "variable_contract": "58=11-ode+47-pde",
            "spatial_principal_part": True,
            "zero_order_terms_subtracted": True,
            "fourier_normalization": {
                "wave_difference": "plus-minus cosine probe already yields the full positive-mode coefficient",
                "constant_difference": "plus-minus constant probe yields 2*C",
                "principal_symbol": "wave_symbol-0.5*zero_order_symbol",
            },
            "fo_ccz4_eq_12k_b_ordering_rhs": "alpha^2*mu*(curl_P-curl_D)",
            "eigenvectors_available": False,
            "full_symbol_diagonalizability_audited": True,
            "repeated_nonzero_speed_geometric_defect_audited": True,
            "legacy_f075_is_explicit_negative_control": math.isclose(
                args.shift_coefficient, 0.75, rel_tol=0.0, abs_tol=1.0e-12
            ),
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-cpbc-and-physical-validation",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    final = rows[-1]
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "points": list(points),
                "replay": all(row["deterministic_replay"] for row in rows),
                "variable_count": final["variable_count"],
                "eigenvector_rank": final["eigenvector_rank"],
                "eigenvector_condition_number": final["eigenvector_condition_number"],
                "max_real_eigenvalue_abs": final["max_real_eigenvalue_abs"],
                "constraint_map_rank": final["constraint_map_rank"],
                "constraint_count": final["constraint_count"],
                "expected_speed_errors": final["expected_speed_errors"],
                "published_speed_census_error": final["published_speed_census_error"],
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

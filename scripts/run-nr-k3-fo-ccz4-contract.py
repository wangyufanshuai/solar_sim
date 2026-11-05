"""Write a deterministic FO-CCZ4 variable/ordering shadow receipt."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    Grid3D,
    build_fo_ccz4_auxiliary_3d,
    fo_ccz4_ordering_constraints_3d,
    fo_ccz4_variable_contract_3d,
    manifest_from_fo_ccz4_report,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-fo-ccz4-contract.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _run_row(points: int, amplitude: float, wavelength: float) -> dict[str, object]:
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    state = BSSNState3D.gauge_wave(
        grid,
        amplitude=amplitude,
        wavelength=wavelength,
        formulation="ccz4",
    )
    first_auxiliary = build_fo_ccz4_auxiliary_3d(state)
    second_auxiliary = build_fo_ccz4_auxiliary_3d(state)
    first = fo_ccz4_ordering_constraints_3d(state, first_auxiliary)
    second = fo_ccz4_ordering_constraints_3d(state, second_auxiliary)
    row = asdict(first)
    row.update(
        {
            "points": points,
            "max_curl_l_inf": first.max_curl_l_inf,
            "max_algebraic_l_inf": first.max_algebraic_l_inf,
            "deterministic_replay": (
                first.auxiliary_sha256 == second.auxiliary_sha256
                and first.curl_l_inf == second.curl_l_inf
                and first.algebraic_l_inf == second.algebraic_l_inf
            ),
            "auxiliary_component_count": first_auxiliary.component_count,
        }
    )
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="9,17,33")
    parser.add_argument("--amplitude", type=float, default=1.0e-2)
    parser.add_argument("--wavelength", type=float, default=1.0)
    args = parser.parse_args()
    points = tuple(int(value.strip()) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 8 for value in points):
        raise SystemExit("--points must contain at least two values >= 8")
    if any(left >= right for left, right in zip(points, points[1:])):
        raise SystemExit("--points must be strictly increasing")
    if not (0.0 < args.amplitude < 1.0) or args.wavelength <= 0.0:
        raise SystemExit("amplitude must lie in (0,1) and wavelength must be positive")

    rows = [_run_row(value, args.amplitude, args.wavelength) for value in points]
    contract = fo_ccz4_variable_contract_3d()
    final_grid = Grid3D(
        (points[-1], points[-1], points[-1]),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    final_state = BSSNState3D.gauge_wave(
        final_grid,
        amplitude=args.amplitude,
        wavelength=args.wavelength,
        formulation="ccz4",
    )
    final_auxiliary = build_fo_ccz4_auxiliary_3d(final_state)
    final_report = fo_ccz4_ordering_constraints_3d(final_state, final_auxiliary)
    final_manifest = manifest_from_fo_ccz4_report(final_state, final_report)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-variable-ordering-shadow",
        "schema_version": "nr-k3-fo-ccz4-contract-v1",
        "source_digest": _source_digest(),
        "contract": contract,
        "rows": rows,
        "manifest": final_manifest.payload(),
        "manifest_sha256": final_manifest.sha256(),
        "validation": {
            "variable_contract_audited": True,
            "ordering_constraints_audited": True,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_boundary_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-58-variable-principal-symbol-and-cpbc",
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
                "points": list(points),
                "replay": all(row["deterministic_replay"] for row in rows),
                "auxiliary_component_count": contract["auxiliary_variable_count"],
                "total_variable_count": contract["total_variable_count"],
                "max_curl_l_inf": max(row["max_curl_l_inf"] for row in rows),
                "max_algebraic_l_inf": rows[-1]["max_algebraic_l_inf"],
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

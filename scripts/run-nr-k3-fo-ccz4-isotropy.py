"""Write a three-normal FO-CCZ4 frozen-coefficient isotropy receipt."""

from __future__ import annotations

from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

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
        "scripts/run-nr-k3-fo-ccz4-isotropy.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    output = Path(sys.argv[1]) if len(sys.argv) == 2 else None
    if output is None:
        raise SystemExit("usage: run-nr-k3-fo-ccz4-isotropy.py OUTPUT.json")

    gauge = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    rows: list[dict[str, object]] = []
    for normal_axis in (0, 1, 2):
        report = linearized_fo_ccz4_principal_symbol_3d(
            points=8,
            harmonic=1,
            normal_axis=normal_axis,
            gauge=gauge,
        )
        replay = linearized_fo_ccz4_principal_symbol_3d(
            points=8,
            harmonic=1,
            normal_axis=normal_axis,
            gauge=gauge,
        )
        row = asdict(report)
        row["deterministic_replay"] = (
            report.symbol_sha256 == replay.symbol_sha256
            and report.eigenvector_sha256 == replay.eigenvector_sha256
            and report.constraint_map_sha256 == replay.constraint_map_sha256
        )
        row["isotropy_gate_passed"] = bool(
            row["deterministic_replay"]
            and row["full_symbol_diagonalizable"]
            and row["full_symbol_defect"] == 0
            and row["full_symbol_eigenvector_rank"] == 58
            and row["full_symbol_incoming_mode_count"] == 16
            and row["full_symbol_outgoing_mode_count"] == 16
            and row["full_symbol_zero_speed_mode_count"] == 26
            and float(row["published_speed_census_error"]) < 1.0e-8
        )
        rows.append(row)

    isotropy_gate_passed = all(bool(row["isotropy_gate_passed"]) for row in rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-cartesian-normal-isotropy-shadow",
        "schema_version": "nr-k3-fo-ccz4-isotropy-v1",
        "source_digest": _source_digest(),
        "gauge": asdict(gauge),
        "normal_axes": [0, 1, 2],
        "rows": rows,
        "validation": {
            "isotropy_gate_passed": isotropy_gate_passed,
            "published_speed_family_contract_checked": True,
            "analytic_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-eigenvectors-cpbc-and-physical-validation",
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(output.resolve()),
                "normal_axes": [0, 1, 2],
                "isotropy_gate_passed": isotropy_gate_passed,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if isotropy_gate_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

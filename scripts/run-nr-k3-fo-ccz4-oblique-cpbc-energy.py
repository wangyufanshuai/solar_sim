"""Run the transported full-system FO-CCZ4 CPBC energy shadow."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
import math
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    GaugeConfig,
    linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d,
)


DEFAULT_NORMALS = (
    (1.0, 0.0, 0.0),
    (0.0, 1.0, 0.0),
    (0.0, 0.0, 1.0),
    (1.0, 2.0, 3.0),
    (1.0, -2.0, 0.5),
    (-3.0, 4.0, 5.0),
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_frozen_cpbc.py",
        "science/numerical_relativity/fo_ccz4_oblique_cpbc_energy_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-oblique-cpbc-energy.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_normals(value: str) -> tuple[tuple[float, float, float], ...]:
    result: list[tuple[float, float, float]] = []
    for raw in value.split(";"):
        components = tuple(
            float(component.strip())
            for component in raw.split(",")
            if component.strip()
        )
        if len(components) != 3 or not all(math.isfinite(component) for component in components):
            raise ValueError("each normal must contain three finite components")
        if np.linalg.norm(np.asarray(components)) <= 0.0:
            raise ValueError("each normal must have non-zero length")
        result.append(components)
    if not result:
        raise ValueError("at least one normal is required")
    return tuple(result)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--normals",
        default=";".join(",".join(str(value) for value in normal) for normal in DEFAULT_NORMALS),
    )
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    args = parser.parse_args()
    normals = _parse_normals(args.normals)
    gauge = GaugeConfig(
        shift_coefficient=float(args.shift_coefficient),
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    config = FOCCZ4Config(kappa1=0.0)
    rows: list[dict[str, object]] = []
    for normal in normals:
        for orientation in ("right", "left"):
            audit = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
                normal=normal,
                points=args.points,
                orientation=orientation,
                gauge=gauge,
                config=config,
            )
            replay = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
                normal=normal,
                points=args.points,
                orientation=orientation,
                gauge=gauge,
                config=config,
            )
            row = asdict(audit)
            row["normal_input"] = list(normal)
            row["deterministic_replay"] = bool(
                audit.incoming_constraint_map_sha256
                == replay.incoming_constraint_map_sha256
                and audit.homogeneous_boundary_flux_max_eigenvalue
                == replay.homogeneous_boundary_flux_max_eigenvalue
                and audit.rotation_covariance_residual_l_inf
                == replay.rotation_covariance_residual_l_inf
            )
            rows.append(row)
    candidate_validated = all(
        bool(row["homogeneous_boundary_energy_validated"])
        and bool(row["deterministic_replay"])
        and bool(row["row_space_transport_validated"])
        for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-oblique-full-cpbc-energy-shadow",
        "schema_version": "nr-k3-fo-ccz4-oblique-cpbc-energy-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "points": args.points,
        "normals": [list(normal) for normal in normals],
        "orientations": ["right", "left"],
        "rows": rows,
        "validation": {
            "oblique_row_space_transport_validated": candidate_validated,
            "complete_system_numerical_energy_candidate_validated": candidate_validated,
            "analytic_uniform_symmetrizer_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-uniform-symmetrizer-nonlinear-cpbc-physical-validation",
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
                "row_count": len(rows),
                "oblique_row_space_transport_validated": candidate_validated,
                "max_constraint_map_residual": max(
                    row["incoming_constraint_map_residual_l_inf"] for row in rows
                ),
                "max_rotation_covariance_residual": max(
                    row["rotation_covariance_residual_l_inf"] for row in rows
                ),
                "max_boundary_flux": max(
                    row["homogeneous_boundary_flux_max_eigenvalue"] for row in rows
                ),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate_validated else 2


if __name__ == "__main__":
    raise SystemExit(main())

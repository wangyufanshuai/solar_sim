"""Sweep a transported FO-CCZ4 numerical symmetrizer over oblique normals."""

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
    rotated_fo_ccz4_numerical_symmetrizer_shadow_3d,
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
        "science/numerical_relativity/fo_ccz4_symmetrizer_shadow.py",
        "science/numerical_relativity/fo_ccz4_rotated_symmetrizer_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-oblique-symmetrizer.py",
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


def _matrix_digest(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--normals",
        default=";".join(",".join(str(value) for value in normal) for normal in DEFAULT_NORMALS),
    )
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    parser.add_argument("--condition-number-limit", type=float, default=1.0e10)
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
        audit = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
            normal=normal,
            points=args.points,
            gauge=gauge,
            config=config,
            condition_number_limit=args.condition_number_limit,
        )
        replay = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
            normal=normal,
            points=args.points,
            gauge=gauge,
            config=config,
            condition_number_limit=args.condition_number_limit,
        )
        row = asdict(audit)
        for name in (
            "principal_matrix",
            "rotation_matrix",
            "tensor_representation",
            "symmetrizer",
            "weighted_principal_matrix",
        ):
            row.pop(name, None)
        row["normal_input"] = list(normal)
        row["symmetrizer_sha256"] = _matrix_digest(audit.symmetrizer)
        row["deterministic_replay"] = bool(
            np.array_equal(audit.symmetrizer, replay.symmetrizer)
            and row["symmetrizer_sha256"] == _matrix_digest(replay.symmetrizer)
            and audit.rotation_covariance_residual_l_inf
            == replay.rotation_covariance_residual_l_inf
        )
        rows.append(row)

    candidate_validated = all(
        bool(row["numerical_candidate_validated"])
        and bool(row["deterministic_replay"])
        for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-oblique-rotated-numerical-symmetrizer-shadow",
        "schema_version": "nr-k3-fo-ccz4-oblique-symmetrizer-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "gauge": asdict(gauge),
        "config": asdict(config),
        "points": args.points,
        "condition_number_limit": args.condition_number_limit,
        "rows": rows,
        "validation": {
            "rotated_numerical_symmetrizer_validated": candidate_validated,
            "tensor_rotation_covariance_consumed": True,
            "analytic_uniform_symmetrizer_validated": False,
            "parameter_sweep_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-uniform-symmetrizer-cpbc-physical-validation",
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
                "normal_count": len(rows),
                "rotated_numerical_symmetrizer_validated": candidate_validated,
                "max_condition_number": max(
                    row["symmetrizer_condition_number"] for row in rows
                ),
                "max_rotation_covariance_residual": max(
                    row["rotation_covariance_residual_l_inf"] for row in rows
                ),
                "max_weighted_symmetry_residual": max(
                    row["weighted_principal_symmetry_residual_l_inf"] for row in rows
                ),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate_validated else 2


if __name__ == "__main__":
    raise SystemExit(main())

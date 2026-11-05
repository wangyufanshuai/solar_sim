"""Run the metric-aware local frame shadow audit for FO-CCZ4 boundaries."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    Grid3D,
    audit_fo_ccz4_local_frame_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/fo_ccz4_local_frame_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-local-frame-audit.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _axes(value: str) -> tuple[int, ...]:
    result = tuple(int(item.strip()) for item in value.split(",") if item.strip())
    if not result or any(axis not in (0, 1, 2) for axis in result):
        raise SystemExit("--axes must contain one or more values from 0,1,2")
    if len(set(result)) != len(result):
        raise SystemExit("--axes must not repeat an axis")
    return result


def _build_state(points: int, amplitude: float) -> BSSNState3D:
    grid = Grid3D(
        (points, points, points),
        (2.0, 2.0, 2.0),
        (8.0, 8.0, 8.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        center=(0.0, 0.0, 0.0),
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    x, y, z = grid.coordinates
    state.h[..., 0, 0] *= 1.0 + amplitude * np.sin(x)
    state.h[..., 1, 1] *= 1.0 + 0.5 * amplitude * np.cos(y)
    state.h[..., 2, 2] *= 1.0 - 0.25 * amplitude * np.sin(z)
    cross = 0.2 * amplitude * np.sin(x + y + z)
    state.h[..., 0, 1] = cross
    state.h[..., 1, 0] = cross
    return state


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--axes", default="0,1,2")
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--amplitude", type=float, default=2.0e-2)
    parser.add_argument("--tolerance", type=float, default=1.0e-12)
    parser.add_argument("--residual-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    axes = _axes(args.axes)
    if args.points < 5:
        raise SystemExit("--points must be at least five")
    if not np.isfinite(args.amplitude) or args.amplitude < 0.0:
        raise SystemExit("--amplitude must be finite and non-negative")
    if not np.isfinite(args.tolerance) or args.tolerance < 0.0:
        raise SystemExit("--tolerance must be finite and non-negative")
    if not np.isfinite(args.residual_tolerance) or args.residual_tolerance < 0.0:
        raise SystemExit("--residual-tolerance must be finite and non-negative")

    state = _build_state(args.points, float(args.amplitude))
    audit_error: str | None = None
    try:
        first = audit_fo_ccz4_local_frame_3d(
            state,
            axes=axes,
            tolerance=float(args.tolerance),
            residual_tolerance=float(args.residual_tolerance),
        )
        second = audit_fo_ccz4_local_frame_3d(
            state,
            axes=axes,
            tolerance=float(args.tolerance),
            residual_tolerance=float(args.residual_tolerance),
        )
    except ValueError as exc:
        first = None
        second = None
        audit_error = f"{type(exc).__name__}: {exc}"
    deterministic = bool(first is not None and second is not None and first == second)
    candidate = bool(
        first is not None
        and deterministic
        and first.local_orthonormal_frame_validated
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-local-orthonormal-frame-shadow",
        "schema_version": "nr-k3-fo-ccz4-local-frame-audit-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4 metric-aware local frame contract",
        "grid": asdict(state.grid),
        "axes": list(axes),
        "points": args.points,
        "amplitude": args.amplitude,
        "tolerance": args.tolerance,
        "residual_tolerance": args.residual_tolerance,
        "audit": asdict(first) if first is not None else None,
        "audit_error": audit_error,
        "validation": {
            "candidate": candidate,
            "deterministic_replay": deterministic,
            "local_orthonormal_frame_validated": bool(
                first is not None and first.local_orthonormal_frame_validated
            ),
            "variable_coefficient_principal_proxy_validated": False,
            "variable_coefficient_boundary_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-variable-coefficient-principal-symbol-"
                "symmetrizer-nonlinear-cpbc-physical-validation"
            ),
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
                "candidate": candidate,
                "audit_error": audit_error,
                "deterministic_replay": deterministic,
                "face_count": first.face_count if first is not None else 0,
                "max_metric_orthonormality_residual": (
                    first.max_metric_orthonormality_residual if first is not None else None
                ),
                "max_normal_covector_residual": (
                    first.max_normal_covector_residual if first is not None else None
                ),
                "max_frame_condition_number": (
                    first.max_frame_condition_number if first is not None else None
                ),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Audit local FO-CCZ4 boundary coefficients without promoting a boundary operator."""

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
    GaugeConfig,
    Grid3D,
    audit_fo_ccz4_variable_coefficient_boundary_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/ccz4_reference.py",
        "science/numerical_relativity/fo_ccz4_variable_coefficient_boundary_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-variable-coefficient-boundary-audit.py",
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
    state.lapse *= 1.0 + 0.25 * amplitude * np.cos(x - y)
    state.shift[..., 0] = 0.1 * amplitude * np.sin(y)
    state.shift[..., 1] = 0.1 * amplitude * np.cos(z)
    return state


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--axes", default="0,1,2")
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--amplitude", type=float, default=2.0e-2)
    parser.add_argument("--tolerance", type=float, default=1.0e-12)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output already exists; choose a fresh receipt path")
    axes = _axes(args.axes)
    if args.points < 5:
        raise SystemExit("--points must be at least five")
    if not np.isfinite(args.amplitude) or args.amplitude < 0.0:
        raise SystemExit("--amplitude must be finite and non-negative")
    if not np.isfinite(args.tolerance) or args.tolerance < 0.0:
        raise SystemExit("--tolerance must be finite and non-negative")

    state = _build_state(args.points, float(args.amplitude))
    gauge = GaugeConfig(theta_coupling=2.0)
    audit_error: str | None = None
    try:
        first = audit_fo_ccz4_variable_coefficient_boundary_3d(
            state,
            axes=axes,
            gauge=gauge,
            tolerance=float(args.tolerance),
        )
        second = audit_fo_ccz4_variable_coefficient_boundary_3d(
            state,
            axes=axes,
            gauge=gauge,
            tolerance=float(args.tolerance),
        )
    except ValueError as exc:
        first = None
        second = None
        audit_error = f"{type(exc).__name__}: {exc}"
    deterministic = bool(first is not None and second is not None and first == second)
    candidate = bool(
        first is not None
        and deterministic
        and first.positive_definite_metric_validated
        and first.local_characteristic_speed_validated
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-variable-coefficient-boundary-audit-shadow",
        "schema_version": "nr-k3-fo-ccz4-variable-coefficient-rejected-speed-proxy-v2",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4 local coefficient audit over BSSN base state",
        "grid": asdict(state.grid),
        "gauge": asdict(gauge),
        "axes": list(axes),
        "points": args.points,
        "amplitude": args.amplitude,
        "tolerance": args.tolerance,
        "audit": asdict(first) if first is not None else None,
        "audit_error": audit_error,
        "validation": {
            "proxy_speed_coefficients_finite": bool(
                first is not None and first.proxy_speed_coefficients_finite
            ),
            "deterministic_replay": deterministic,
            "positive_definite_metric_validated": bool(
                first is not None and first.positive_definite_metric_validated
            ),
            "local_characteristic_speed_validated": bool(
                first is not None and first.local_characteristic_speed_validated
            ),
            "variable_coefficient_boundary_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "candidate": candidate,
            "promotion": (
                "rejected-incorrect-Gamma-driver-scaling-use-direct-frozen-symbol"
            ),
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "candidate": candidate,
                "deterministic_replay": deterministic,
                "face_count": first.face_count if first is not None else 0,
                "boundary_cell_count": first.boundary_cell_count if first is not None else 0,
                "max_physical_metric_condition_number": (
                    first.max_physical_metric_condition_number if first is not None else None
                ),
                "max_intrinsic_speed_relative_deviation": (
                    first.max_intrinsic_speed_relative_deviation if first is not None else None
                ),
                "audit_error": audit_error,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate else 2


if __name__ == "__main__":
    raise SystemExit(main())

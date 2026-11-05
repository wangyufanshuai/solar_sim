"""Run a bounded 3-D Schwarzschild exterior CCZ4 reference shadow.

The domain is a fully valid Cartesian exterior patch (it does not contain the
isotropic throat), so the reference can exercise the existing 3-D CCZ4 RHS.
The outer Sommerfeld operator is an explicitly non-physical proxy; this script
never claims a causal excision boundary, CPBC, horizon evolution, or live
runtime eligibility.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    CCZ4Config,
    Grid3D,
    GaugeConfig,
    advance_ccz4_rk4_3d,
    ccz4_rhs_3d,
    constraint_report_3d,
)


STATE_FIELDS = (
    "chi",
    "h",
    "trace_k",
    "a",
    "theta",
    "conformal_gamma",
    "lapse",
    "shift",
    "b",
)


def _grid(points: int, lower: float, upper: float) -> Grid3D:
    return Grid3D(
        (points, points, points),
        (lower, lower, lower),
        (upper, upper, upper),
        boundary="sommerfeld",
        spatial_order=2,
    )


def _state_hash(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in (*STATE_FIELDS, "valid_mask"):
        digest.update(name.encode("ascii"))
        digest.update(np.ascontiguousarray(getattr(state, name)).tobytes(order="C"))
    return digest.hexdigest()


def _norms(values: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    selected = np.asarray(values, dtype=np.float64)[mask]
    if selected.size == 0 or not np.all(np.isfinite(selected)):
        raise ValueError("diagnostic values must be finite on a non-empty mask")
    return {
        "l_inf": float(np.max(np.abs(selected))),
        "l2": float(np.sqrt(np.mean(selected * selected))),
    }


def _interior_mask(state: BSSNState3D, *, layers: int = 1) -> np.ndarray:
    if not isinstance(layers, int) or layers < 1:
        raise ValueError("layers must be a positive integer")
    if any(points <= 2 * layers for points in state.grid.shape):
        raise ValueError("the grid must retain cells after removing boundary layers")
    mask = state.valid_mask.copy()
    for axis in range(3):
        lower = np.zeros_like(mask)
        upper = np.zeros_like(mask)
        lower_index = [slice(None)] * 3
        upper_index = [slice(None)] * 3
        lower_index[axis] = slice(layers, None)
        upper_index[axis] = slice(None, -layers)
        lower[tuple(lower_index)] = mask[tuple(upper_index)]
        upper[tuple(upper_index)] = mask[tuple(lower_index)]
        mask &= lower & upper
    return mask


def _constraint_norms(state: BSSNState3D) -> dict[str, dict[str, float]]:
    report = constraint_report_3d(state)
    mask = _interior_mask(state) & report.valid_mask
    return {
        "hamiltonian": _norms(report.hamiltonian, mask),
        "momentum": _norms(np.linalg.norm(report.momentum, axis=-1), mask),
        "det_h_minus_one": _norms(report.det_h_minus_one, mask),
        "trace_a": _norms(report.trace_a, mask),
        "conformal_gamma": _norms(report.conformal_gamma, mask),
        "theta": _norms(report.theta, mask),
    }


def _rhs_norms(
    rhs: Any,
    state: BSSNState3D,
    *,
    layers: int = 1,
) -> dict[str, dict[str, float]]:
    mask = _interior_mask(state, layers=layers)
    result: dict[str, dict[str, float]] = {}
    for name in STATE_FIELDS:
        values = np.asarray(getattr(rhs, name), dtype=np.float64)
        if values.ndim > 3:
            values = np.linalg.norm(values, axis=tuple(range(3, values.ndim)))
        result[name] = _norms(values, mask)
    return result


def _observed_orders(rows: list[dict[str, Any]], path: tuple[str, ...]) -> list[float | None]:
    result: list[float | None] = []
    for coarse, fine in zip(rows, rows[1:]):
        coarse_value: Any = coarse
        fine_value: Any = fine
        for key in path:
            coarse_value = coarse_value[key]
            fine_value = fine_value[key]
        coarse_value = float(coarse_value)
        fine_value = float(fine_value)
        coarse_h = 1.0 / (int(coarse["points"]) - 1)
        fine_h = 1.0 / (int(fine["points"]) - 1)
        if coarse_value <= 0.0 or fine_value <= 0.0:
            result.append(None)
        else:
            result.append(float(np.log(coarse_value / fine_value) / np.log(coarse_h / fine_h)))
    return result


def _run_row(
    points: int,
    *,
    mass: float,
    lower: float,
    upper: float,
    steps: int,
    dt: float,
) -> dict[str, Any]:
    grid = _grid(points, lower, upper)
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=mass,
        excision_radius=0.5 * mass,
        excision_buffer_cells=0,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    initial_constraints = _constraint_norms(state)
    initial_rhs = ccz4_rhs_3d(
        state,
        ccz4=CCZ4Config(),
        gauge=GaugeConfig(theta_coupling=2.0),
        boundary_mode="sommerfeld",
    )
    evolved = advance_ccz4_rk4_3d(
        state,
        dt,
        steps=steps,
        ccz4=CCZ4Config(),
        gauge=GaugeConfig(theta_coupling=2.0),
        project_algebraic=True,
        boundary_mode="sommerfeld",
    )
    final_constraints = _constraint_norms(evolved)
    determinant = np.linalg.det(evolved.h)
    finite = all(np.all(np.isfinite(np.asarray(getattr(evolved, name)))) for name in STATE_FIELDS)
    return {
        "points": points,
        "steps": steps,
        "dt": dt,
        "valid_cell_count": evolved.valid_cell_count,
        "initial_state_sha256": _state_hash(state),
        "final_state_sha256": _state_hash(evolved),
        "finite_state": bool(finite),
        "min_det_h": float(np.min(determinant)),
        "max_det_h_deviation": float(np.max(np.abs(determinant - 1.0))),
        "initial_constraint_norms": initial_constraints,
        "initial_rhs_norms": _rhs_norms(initial_rhs, state),
        # A two-cell interior mask keeps the static-oracle convergence gate
        # independent of the scalar Sommerfeld proxy at the outer face.
        "interior_stationarity_rhs_norms": _rhs_norms(initial_rhs, state, layers=2),
        "one_plus_log_lapse_rhs_l_inf": float(
            np.max(np.abs(initial_rhs.lapse[_interior_mask(state, layers=2)]))
        ),
        "gamma_driver_shift_rhs_l_inf": float(
            np.max(
                np.linalg.norm(
                    initial_rhs.shift[_interior_mask(state, layers=2)], axis=-1
                )
            )
        ),
        "final_constraint_norms": final_constraints,
        "physical_excision_validated": False,
        "constraint_preserving_outer_boundary": False,
        "state": evolved,
    }


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/constraints3d.py",
        "scripts/run-nr-k1-schwarzschild-exterior.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="17,25,33")
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--lower", type=float, default=2.0)
    parser.add_argument("--upper", type=float, default=10.0)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    args = parser.parse_args()
    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 9 for value in points):
        raise SystemExit("--points must contain at least two values >= 9")
    if any(left >= right for left, right in zip(points, points[1:])):
        raise SystemExit("--points must be strictly increasing")
    if not np.isfinite(args.mass) or args.mass <= 0.0:
        raise SystemExit("mass must be finite and positive")
    if not np.isfinite(args.lower) or not np.isfinite(args.upper) or args.upper <= args.lower:
        raise SystemExit("lower/upper must be finite and ordered")
    if args.lower <= 0.5 * args.mass:
        raise SystemExit("the exterior patch must remain outside the isotropic throat")
    if args.steps < 1 or not np.isfinite(args.dt) or args.dt <= 0.0:
        raise SystemExit("steps must be positive and dt must be finite/positive")

    rows = [_run_row(points_value, mass=args.mass, lower=args.lower, upper=args.upper,
                     steps=args.steps, dt=args.dt) for points_value in points]
    payload_rows = []
    for row in rows:
        payload = dict(row)
        payload.pop("state", None)
        payload_rows.append(payload)
    stationarity_orders = {
        "trace_k_l2": _observed_orders(
            payload_rows,
            ("interior_stationarity_rhs_norms", "trace_k", "l2"),
        ),
        "theta_l2": _observed_orders(
            payload_rows,
            ("interior_stationarity_rhs_norms", "theta", "l2"),
        ),
        "a_l2": _observed_orders(
            payload_rows,
            ("interior_stationarity_rhs_norms", "a", "l2"),
        ),
    }
    receipt = {
        "benchmark": "nr-k1-3d-schwarzschild-exterior-ccz4-shadow",
        "schema_version": "nr-k1-schwarzschild-exterior-v2-stationarity-gate",
        "source_digest": _source_digest(),
        "formulation": "ccz4-3d-reference",
        "domain": {
            "lower": [args.lower] * 3,
            "upper": [args.upper] * 3,
            "boundary": "sommerfeld-scalar-proxy",
            "contains_isotropic_throat": False,
        },
        "rows": payload_rows,
        "observed_orders": {
            "conformal_gamma_l_inf": _observed_orders(
                payload_rows, ("final_constraint_norms", "conformal_gamma", "l_inf")
            ),
            "theta_l_inf": _observed_orders(
                payload_rows, ("final_constraint_norms", "theta", "l_inf")
            ),
        },
        "stationarity_orders": stationarity_orders,
        "validation": {
            "finite_state": all(row["finite_state"] for row in payload_rows),
            "positive_conformal_metric": all(row["min_det_h"] > 0.0 for row in payload_rows),
            "one_plus_log_gauge_equations": all(
                row["one_plus_log_lapse_rhs_l_inf"] <= 1.0e-13
                and row["gamma_driver_shift_rhs_l_inf"] <= 1.0e-13
                for row in payload_rows
            ),
            "finite_difference_stationarity_converges": bool(
                len(payload_rows) >= 3
                and all(
                    len(values) >= 2
                    and all(
                        value is not None and float(value) >= 1.25
                        for value in values[-2:]
                    )
                    for values in stationarity_orders.values()
                )
            ),
            "exact_static_stationarity": False,
            "physical_excision_validated": False,
            "constraint_preserving_outer_boundary": False,
            "physical_horizon_validated": False,
            "physical_adm_validated": False,
            "runtime_writeback": False,
        "promotion": "blocked-pending-k1-schwarzschild-cpbc-and-k2-parity",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(args.output.resolve()),
        "points": list(points),
        "finite_state": receipt["validation"]["finite_state"],
        "positive_conformal_metric": receipt["validation"]["positive_conformal_metric"],
        "observed_orders": receipt["observed_orders"],
        "promotion": receipt["validation"]["promotion"],
    }, sort_keys=True))
    return 0 if receipt["validation"]["finite_state"] and receipt["validation"]["positive_conformal_metric"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

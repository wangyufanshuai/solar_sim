"""Run a bounded FO-CCZ4 gauge-wave method-of-lines convergence campaign."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    FOCCZ4Config,
    FOCCZ4State3D,
    GaugeConfig,
    Grid3D,
    advance_fo_ccz4_rk4_3d,
    constraint_report_3d,
    fo_ccz4_ordering_constraints_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/constraints3d.py",
        "scripts/run-nr-k1-fo-ccz4-gauge-wave-evolution.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _diagnostics(state: FOCCZ4State3D) -> dict[str, object]:
    constraints = constraint_report_3d(state.base)
    ordering = fo_ccz4_ordering_constraints_3d(state.base, state.auxiliary)
    determinant = np.linalg.det(state.base.h)
    finite = bool(
        np.all(np.isfinite(state.base.chi))
        and np.all(np.isfinite(state.base.lapse))
        and np.all(np.isfinite(state.base.h))
        and np.all(np.isfinite(state.base.a))
        and np.all(np.isfinite(state.base.trace_k))
        and np.all(np.isfinite(determinant))
        and np.all(state.base.chi > 0.0)
        and np.all(state.base.lapse > 0.0)
        and np.all(determinant > 0.0)
        and ordering.finite
    )
    return {
        "finite_positive_state": finite,
        "constraint_norms": dict(constraints.norms),
        "ordering_max_curl_l_inf": ordering.max_curl_l_inf,
        "ordering_max_algebraic_l_inf": ordering.max_algebraic_l_inf,
        "min_lapse": float(np.min(state.base.lapse)),
        "min_chi": float(np.min(state.base.chi)),
        "min_det_h": float(np.min(determinant)),
        "auxiliary_sha256": ordering.auxiliary_sha256,
    }


def _row(
    points: int,
    *,
    amplitude: float,
    wavelength: float,
    cfl: float,
    final_time: float,
    spatial_order: int,
) -> dict[str, object]:
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=spatial_order,
    )
    base = BSSNState3D.gauge_wave(
        grid,
        amplitude=amplitude,
        wavelength=wavelength,
        time=0.0,
        formulation="ccz4",
    )
    state = FOCCZ4State3D.from_bssn_state(base)
    initial = _diagnostics(state)
    max_dt = cfl * min(grid.spacing)
    steps = max(1, int(np.ceil(final_time / max_dt)))
    dt = final_time / steps
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config()
    evolved = advance_fo_ccz4_rk4_3d(
        state,
        dt,
        steps=steps,
        gauge=gauge,
        config=config,
        boundary_mode="periodic",
    )
    final = _diagnostics(evolved)
    replay = advance_fo_ccz4_rk4_3d(
        FOCCZ4State3D.from_bssn_state(base),
        dt,
        steps=steps,
        gauge=gauge,
        config=config,
        boundary_mode="periodic",
    )
    replay_diagnostics = _diagnostics(replay)
    final_norms = final["constraint_norms"]
    replay_norms = replay_diagnostics["constraint_norms"]
    assert isinstance(final_norms, dict)
    assert isinstance(replay_norms, dict)
    return {
        "points": points,
        "grid_spacing": list(grid.spacing),
        "dt": dt,
        "steps": steps,
        "simulated_time": dt * steps,
        "requested_final_time": final_time,
        "cfl_actual": dt / min(grid.spacing),
        "initial": initial,
        "final": final,
        "deterministic_replay": final["auxiliary_sha256"] == replay_diagnostics["auxiliary_sha256"]
        and all(
            float(final_norms[name]) == float(replay_norms[name])
            for name in final_norms
        ),
        "selected_constraint_errors": {
            name: float(final_norms[name])
            for name in (
                "hamiltonian_l2",
                "momentum_l2",
                "conformal_gamma_l_inf",
                "theta_l_inf",
            )
        },
    }


def _observed_orders(rows: list[dict[str, object]]) -> dict[str, list[float]]:
    names = (
        "hamiltonian_l2",
        "momentum_l2",
        "conformal_gamma_l_inf",
        "theta_l_inf",
    )
    orders: dict[str, list[float]] = {}
    for name in names:
        values = [float(row["selected_constraint_errors"][name]) for row in rows]  # type: ignore[index]
        spacings = [float(row["grid_spacing"][0]) for row in rows]  # type: ignore[index]
        orders[name] = [
            float(
                np.log(values[index - 1] / values[index])
                / np.log(spacings[index - 1] / spacings[index])
            )
            for index in range(1, len(values))
            if values[index - 1] > 0.0 and values[index] > 0.0
        ]
    return orders


def _same_physical_final_time(
    rows: list[dict[str, object]],
    requested_final_time: float,
    *,
    atol: float = 1.0e-15,
) -> bool:
    """Fail closed when a refinement row reaches a different physical time."""

    return bool(
        rows
        and all(
            np.isclose(
                float(row["simulated_time"]),
                requested_final_time,
                rtol=0.0,
                atol=atol,
            )
            for row in rows
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="9,13,17")
    parser.add_argument("--amplitude", type=float, default=1.0e-4)
    parser.add_argument("--wavelength", type=float, default=1.0)
    parser.add_argument("--cfl", type=float, default=0.02)
    parser.add_argument("--final-time", type=float, default=1.0e-2)
    parser.add_argument("--spatial-order", type=int, default=2, choices=(2, 4))
    args = parser.parse_args()
    points = tuple(int(value.strip()) for value in args.points.split(",") if value.strip())
    if len(points) < 3 or any(value < 7 for value in points):
        raise SystemExit("--points must contain at least three values >= 7")
    if any(left >= right for left, right in zip(points, points[1:])):
        raise SystemExit("--points must be strictly increasing")
    if not np.isfinite(args.amplitude) or args.amplitude <= 0.0:
        raise SystemExit("--amplitude must be finite and positive")
    if not np.isfinite(args.wavelength) or args.wavelength <= 0.0:
        raise SystemExit("--wavelength must be finite and positive")
    if not np.isfinite(args.cfl) or args.cfl <= 0.0:
        raise SystemExit("--cfl must be finite and positive")
    if not np.isfinite(args.final_time) or args.final_time <= 0.0:
        raise SystemExit("--final-time must be finite and positive")

    rows = [
        _row(
            value,
            amplitude=args.amplitude,
            wavelength=args.wavelength,
            cfl=args.cfl,
            final_time=args.final_time,
            spatial_order=args.spatial_order,
        )
        for value in points
    ]
    orders = _observed_orders(rows)
    finite = all(bool(row["final"]["finite_positive_state"]) for row in rows)  # type: ignore[index]
    replay = all(bool(row["deterministic_replay"]) for row in rows)
    # The connection and Theta norms are true differential/evolutionary
    # signals here; Hamiltonian/momentum can enter a roundoff-dominated regime.
    connection_orders = orders["conformal_gamma_l_inf"]
    theta_orders = orders["theta_l_inf"]
    convergence_gate = bool(
        len(connection_orders) >= 2
        and len(theta_orders) >= 2
        and min(connection_orders[-2:]) >= 1.5
        and min(theta_orders[-2:]) >= 1.5
    )
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-gauge-wave-method-of-lines-shadow",
        "schema_version": "nr-k1-fo-ccz4-gauge-wave-evolution-v3",
        "source_digest": _source_digest(),
        "initial_data": {
            "family": "periodic-vacuum-gauge-wave",
            "amplitude": args.amplitude,
            "wavelength": args.wavelength,
        },
        "integrator": {
            "method": "classical-rk4",
            "cfl": args.cfl,
            "requested_final_time": args.final_time,
            "spatial_order": args.spatial_order,
            "boundary_mode": "periodic",
            "gauge": "advective-1+log-plus-gamma-driver",
        },
        "points": list(points),
        "rows": rows,
        "observed_orders": orders,
        "validation": {
            "finite_positive_state": finite,
            "deterministic_replay": replay,
            "same_physical_final_time": _same_physical_final_time(
                rows, args.final_time
            ),
            "connection_constraint_convergence": convergence_gate,
            "gauge_wave_exact_spacetime_validation": False,
            "characteristic_boundary_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-characteristic-boundary-and-physical-validation",
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
                "finite_positive_state": finite,
                "deterministic_replay": replay,
                "connection_constraint_convergence": convergence_gate,
                "observed_orders": orders,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return (
        0
        if finite
        and replay
        and receipt["validation"]["same_physical_final_time"]
        and convergence_gate
        else 2
    )


if __name__ == "__main__":
    raise SystemExit(main())

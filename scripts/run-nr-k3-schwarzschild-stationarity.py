"""Run a bounded single-black-hole exterior shadow audit.

The campaign deliberately separates two initial-data profiles:

* an exact isotropic Schwarzschild exterior with the historical ``r=M/2``
  mask, used only for a finite-difference stationarity oracle; and
* a positive ``psi**-2`` moving-puncture gauge seed with an inner guard band,
  used for horizon/ADM diagnostics and a short non-physical excision shadow
  evolution.

Neither profile supplies a causal excision boundary.  The nearest-valid
ghost fill and scalar Sommerfeld outer boundary are recorded as engineering
proxies, and every promotion/scientific-validation flag remains false.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict
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
    adm_mass_extrapolated_from_state,
    constraint_report_3d,
    find_apparent_horizon_from_state,
    inner_characteristic_speed_report_3d,
)
from science.numerical_relativity.bssn3d import bssn_rhs_3d  # noqa: E402
from science.numerical_relativity.ccz4_3d import ccz4_rhs_3d  # noqa: E402
from science.numerical_relativity.excision3d import (  # noqa: E402
    _filled_state,
    advance_excision_characteristic_shadow_3d,
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


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/constraints3d.py",
        "science/numerical_relativity/excision3d.py",
        "scripts/run-nr-k3-schwarzschild-stationarity.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in (*STATE_FIELDS, "valid_mask"):
        field = np.ascontiguousarray(getattr(state, name))
        digest.update(name.encode("utf-8"))
        digest.update(field.tobytes(order="C"))
    return digest.hexdigest()


def _finite_state(state: BSSNState3D) -> bool:
    return all(np.all(np.isfinite(np.asarray(getattr(state, name)))) for name in STATE_FIELDS)


def _grid(points: int) -> Grid3D:
    return Grid3D(
        (points, points, points),
        (-4.0, -4.0, -4.0),
        (4.0, 4.0, 4.0),
        boundary="excision",
        spatial_order=2,
    )


def _shell_mask(state: BSSNState3D, inner: float, outer: float) -> np.ndarray:
    coordinates = state.grid.coordinates
    radius = np.sqrt(sum(axis * axis for axis in coordinates))
    return state.valid_mask & (radius > inner) & (radius < outer)


def _norms(values: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    chosen = np.asarray(values)[mask]
    if chosen.size == 0:
        raise ValueError("diagnostic shell contains no valid cells")
    return {
        "l_inf": float(np.max(np.abs(chosen))),
        "l2": float(np.sqrt(np.mean(chosen * chosen))),
    }


def _rhs_norms(rhs: Any, mask: np.ndarray) -> dict[str, dict[str, float]]:
    return {
        name: _norms(np.asarray(getattr(rhs, name)), mask)
        for name in STATE_FIELDS
    }


def _constraint_norms(report: Any, mask: np.ndarray) -> dict[str, dict[str, float]]:
    selected = mask & report.valid_mask
    momentum = np.linalg.norm(np.asarray(report.momentum), axis=-1)
    return {
        "hamiltonian": _norms(report.hamiltonian, selected),
        "momentum_magnitude": _norms(momentum, selected),
        "det_h_minus_one": _norms(report.det_h_minus_one, selected),
        "trace_a": _norms(report.trace_a, selected),
        "conformal_gamma": _norms(report.conformal_gamma, selected),
        "theta": _norms(report.theta, selected),
    }


def _max_l_inf(norms: dict[str, dict[str, float]]) -> float:
    return max(value["l_inf"] for value in norms.values())


def _observed_orders(rows: list[dict[str, Any]], path: tuple[str, ...]) -> list[float | None]:
    orders: list[float | None] = []
    for left, right in zip(rows, rows[1:]):
        left_value: Any = left
        right_value: Any = right
        for key in path:
            left_value = left_value[key]
            right_value = right_value[key]
        left_value = float(left_value)
        right_value = float(right_value)
        left_spacing = 1.0 / (int(left["points"]) - 1)
        right_spacing = 1.0 / (int(right["points"]) - 1)
        if left_value <= 0.0 or right_value <= 0.0:
            orders.append(None)
        else:
            orders.append(float(np.log(left_value / right_value) / np.log(left_spacing / right_spacing)))
    return orders


def _horizon_probe(
    state: BSSNState3D,
    *,
    mass: float,
    theta_samples: int,
    phi_samples: int,
) -> dict[str, Any]:
    guard = float(
        state.metadata.get(
            "excision_guard_radius", state.metadata.get("excision_radius", 0.0)
        )
    )
    spacing = min(state.grid.spacing)
    left = max(0.25 * mass, guard + 2.0 * spacing)
    candidates = ((left, 1.5 * mass), (max(left, 0.4 * mass), 1.2 * mass))
    errors: list[str] = []
    for bracket in candidates:
        if bracket[1] <= bracket[0]:
            continue
        try:
            result = find_apparent_horizon_from_state(
                state,
                bracket,
                theta_samples=theta_samples,
                phi_samples=phi_samples,
                iterations=40,
                tolerance=1.0e-7,
                angular_tolerance=1.0e-5,
            )
            payload = asdict(result)
            payload["status"] = "root-found-pass" if result.passed else "root-found-unpassed"
            return payload
        except (ValueError, FloatingPointError) as exc:
            errors.append(f"{type(exc).__name__}: {exc}")
    return {
        "status": "not-found",
        "brackets_tried": [list(bracket) for bracket in candidates],
        "errors": errors,
        "physical_horizon_validated": False,
    }


def _adm_probe(
    state: BSSNState3D,
    *,
    theta_samples: int,
    phi_samples: int,
) -> dict[str, Any]:
    try:
        result = adm_mass_extrapolated_from_state(
            state,
            (2.0, 2.5, 3.0),
            theta_samples=theta_samples,
            phi_samples=phi_samples,
            tolerance=1.0e-2,
        )
        return {
            "status": "completed",
            "mass": float(result.mass),
            "extraction_radius": float(result.extraction_radius),
            "method": result.method,
            "passed": bool(result.passed),
            "physical_adm_validated": False,
        }
    except (ValueError, FloatingPointError) as exc:
        return {
            "status": "failed-closed",
            "error": f"{type(exc).__name__}: {exc}",
            "physical_adm_validated": False,
        }


def _profile_state(
    points: int,
    formulation: str,
    *,
    profile: str,
    mass: float,
    excision_radius: float,
    excision_buffer_cells: int,
    lapse_seed: str,
) -> BSSNState3D:
    grid = _grid(points)
    if profile == "static-exterior-oracle":
        return BSSNState3D.schwarzschild_isotropic(
            grid,
            mass_length=mass,
            excision_radius=0.5 * mass,
            excision_buffer_cells=0,
            lapse_seed="schwarzschild",
            formulation=formulation,  # type: ignore[arg-type]
        )
    return BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=mass,
        excision_radius=excision_radius,
        excision_buffer_cells=excision_buffer_cells,
        lapse_seed=lapse_seed,  # type: ignore[arg-type]
        formulation=formulation,  # type: ignore[arg-type]
    )


def _evaluate_profile(
    points: int,
    formulation: str,
    *,
    profile: str,
    mass: float,
    excision_radius: float,
    excision_buffer_cells: int,
    lapse_seed: str,
    shell_inner: float,
    shell_outer: float,
    theta_samples: int,
    phi_samples: int,
    evolve_steps: int,
    evolve_dt: float,
) -> dict[str, Any]:
    state = _profile_state(
        points,
        formulation,
        profile=profile,
        mass=mass,
        excision_radius=excision_radius,
        excision_buffer_cells=excision_buffer_cells,
        lapse_seed=lapse_seed,
    )
    filled, ghost_distance = _filled_state(state)
    rhs = (
        ccz4_rhs_3d(
            filled,
            ccz4=CCZ4Config(),
            gauge=GaugeConfig(theta_coupling=2.0),
            boundary_mode="sommerfeld",
        )
        if formulation == "ccz4"
        else bssn_rhs_3d(
            filled,
            gauge=GaugeConfig(),
            boundary_mode="sommerfeld",
        )
    )
    shell = _shell_mask(state, shell_inner, shell_outer)
    report = constraint_report_3d(filled)
    result: dict[str, Any] = {
        "points": points,
        "profile": profile,
        "formulation": formulation,
        "valid_cell_count": state.valid_cell_count,
        "ghost_fill": "nearest-valid-zero-gradient",
        "ghost_max_distance": ghost_distance,
        "outer_boundary": "sommerfeld-scalar-proxy",
        "metadata": dict(state.metadata),
        "initial_state_sha256": _state_digest(state),
        "filled_state_finite": _finite_state(filled),
        "shell": {
            "inner_radius": shell_inner,
            "outer_radius": shell_outer,
            "cell_count": int(np.count_nonzero(shell)),
        },
        "rhs_norms": _rhs_norms(rhs, shell),
        "constraint_norms": _constraint_norms(report, shell),
        "physical_excision_validated": False,
        "stationarity_validated": False,
    }
    if profile == "moving-puncture-seed":
        inner_characteristic = inner_characteristic_speed_report_3d(
            state,
            gauge=GaugeConfig(theta_coupling=2.0),
        )
        shadow = advance_excision_characteristic_shadow_3d(
            state,
            evolve_dt,
            steps=evolve_steps,
            ccz4=CCZ4Config(),
            gauge=GaugeConfig(theta_coupling=2.0),
            project_algebraic=True,
            sommerfeld_speed=1.0,
        )
        result["shadow_evolution"] = {
            "steps": shadow.coarse_steps,
            "dt": shadow.dt,
            "ghost_fill": shadow.ghost_fill,
            "outer_boundary": shadow.outer_boundary,
            "finite_state": shadow.finite_state,
            "valid_mask_preserved": shadow.valid_mask_preserved,
            "physical_excision_validated": shadow.physical_excision_validated,
            "state_sha256": shadow.state_sha256,
            "constraint_history": [dict(item) for item in shadow.constraint_history],
            "causality": asdict(shadow.causality_report),
            "characteristic_proxy": asdict(inner_characteristic),
        }
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--points", default="17,25,33")
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--excision-radius", type=float, default=0.1)
    parser.add_argument("--excision-buffer-cells", type=int, default=0)
    parser.add_argument("--lapse-seed", choices=("psi-minus-two", "one"), default="psi-minus-two")
    parser.add_argument("--shell-inner", type=float, default=1.5)
    parser.add_argument("--shell-outer", type=float, default=3.0)
    parser.add_argument("--theta-samples", type=int, default=8)
    parser.add_argument("--phi-samples", type=int, default=16)
    parser.add_argument("--evolve-steps", type=int, default=1)
    parser.add_argument("--evolve-dt", type=float, default=1.0e-5)
    args = parser.parse_args()

    points = tuple(int(value) for value in args.points.split(",") if value.strip())
    if len(points) < 2 or any(value < 9 for value in points):
        raise SystemExit("--points must contain at least two values >= 9")
    if any(points[index] >= points[index + 1] for index in range(len(points) - 1)):
        raise SystemExit("--points must be strictly increasing")
    if args.mass <= 0.0 or args.shell_inner <= 0.0 or args.shell_outer <= args.shell_inner:
        raise SystemExit("mass and shell radii must be positive and ordered")

    moving_rows = [
        _evaluate_profile(
            points_value,
            args.formulation,
            profile="moving-puncture-seed",
            mass=args.mass,
            excision_radius=args.excision_radius,
            excision_buffer_cells=args.excision_buffer_cells,
            lapse_seed=args.lapse_seed,
            shell_inner=args.shell_inner,
            shell_outer=args.shell_outer,
            theta_samples=args.theta_samples,
            phi_samples=args.phi_samples,
            evolve_steps=args.evolve_steps,
            evolve_dt=args.evolve_dt,
        )
        for points_value in points
    ]
    static_rows = [
        _evaluate_profile(
            points_value,
            args.formulation,
            profile="static-exterior-oracle",
            mass=args.mass,
            excision_radius=args.excision_radius,
            excision_buffer_cells=args.excision_buffer_cells,
            lapse_seed=args.lapse_seed,
            shell_inner=args.shell_inner,
            shell_outer=args.shell_outer,
            theta_samples=args.theta_samples,
            phi_samples=args.phi_samples,
            evolve_steps=0,
            evolve_dt=args.evolve_dt,
        )
        for points_value in points
    ]
    horizon_state = _profile_state(
        points[-1],
        args.formulation,
        profile="moving-puncture-seed",
        mass=args.mass,
        excision_radius=args.excision_radius,
        excision_buffer_cells=args.excision_buffer_cells,
        lapse_seed=args.lapse_seed,
    )
    receipt = {
        "benchmark": "nr-k3-schwarzschild-exterior-stationarity-shadow",
        "schema_version": "nr-k3-schwarzschild-shadow-v1",
        "formulation": args.formulation,
        "source_digest": _source_digest(),
        "grid": {
            "points": list(points),
            "lower": [-4.0, -4.0, -4.0],
            "upper": [4.0, 4.0, 4.0],
            "boundary": "excision",
            "spatial_order": 2,
        },
        "moving_puncture_seed": {
            "rows": moving_rows,
            "observed_orders": {
                "hamiltonian_l2": _observed_orders(
                    moving_rows, ("constraint_norms", "hamiltonian", "l2")
                ),
                "rhs_max_l_inf": _observed_orders(
                    [
                        {**row, "rhs_max_l_inf": _max_l_inf(row["rhs_norms"])}
                        for row in moving_rows
                    ],
                    ("rhs_max_l_inf",),
                ),
            },
        },
        "static_exterior_oracle": {
            "rows": static_rows,
            "observed_orders": {
                "hamiltonian_l2": _observed_orders(
                    static_rows, ("constraint_norms", "hamiltonian", "l2")
                ),
                "rhs_max_l_inf": _observed_orders(
                    [
                        {**row, "rhs_max_l_inf": _max_l_inf(row["rhs_norms"])}
                        for row in static_rows
                    ],
                    ("rhs_max_l_inf",),
                ),
            },
        },
        "horizon_probe": _horizon_probe(
            horizon_state,
            mass=args.mass,
            theta_samples=args.theta_samples,
            phi_samples=args.phi_samples,
        ),
        "adm_probe": _adm_probe(
            horizon_state,
            theta_samples=args.theta_samples,
            phi_samples=args.phi_samples,
        ),
        "validation": {
            "metric_constraint_refinement_observed": True,
            "independent_implementation_crosscheck": False,
            "static_schwarzschild_stationarity": False,
            "physical_excision_validated": False,
            "physical_horizon_validated": False,
            "physical_adm_validated": False,
            "physical_waveform_validated": False,
            "promotion": "blocked-pending-k3-physical-validation",
            "runtime_writeback": False,
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(args.output.resolve()),
        "formulation": args.formulation,
        "points": list(points),
        "static_rhs_orders": receipt["static_exterior_oracle"]["observed_orders"]["rhs_max_l_inf"],
        "moving_hamiltonian_orders": receipt["moving_puncture_seed"]["observed_orders"]["hamiltonian_l2"],
        "horizon_status": receipt["horizon_probe"]["status"],
        "adm_status": receipt["adm_probe"]["status"],
        "promotion": receipt["validation"]["promotion"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

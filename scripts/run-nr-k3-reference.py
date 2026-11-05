"""Run a deterministic NR-K3 Python reference campaign.

The campaign is a shadow-only method-of-lines exercise.  It records the
formulation, stencil order, constraint norms, replay digest, and source digest
in the shared ``nr-run-manifest-v1`` envelope; it never writes to the web
runtime or scientific payload store.
"""

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
    CCZ4Config,
    Grid3D,
    GaugeConfig,
    advance_bssn_rk4_3d,
    advance_ccz4_rk4_3d,
    advance_two_level_periodic_amr,
    constraint_report_3d,
    extract_psi4_mode_time_series,
    manifest_from_3d_state,
    project_algebraic_constraints_3d,
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


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in STATE_FIELDS:
        digest.update(np.ascontiguousarray(getattr(state, name), dtype=np.float64).tobytes())
    return digest.hexdigest()


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/amr3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-reference.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _initial_state(
    points: int,
    formulation: str,
    spatial_order: int,
    scenario: str,
    boundary: str,
) -> BSSNState3D:
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary=boundary,
        spatial_order=spatial_order,
    )
    if scenario == "gauge-wave":
        return BSSNState3D.gauge_wave(grid, amplitude=1.0e-2, formulation=formulation)  # type: ignore[arg-type]
    state = BSSNState3D.minkowski(grid, formulation=formulation)  # type: ignore[arg-type]
    x, y, z = grid.coordinates
    phase = 2.0 * np.pi * (x + y + z)
    sine = np.sin(phase)
    cosine = np.cos(phase)
    state.chi[:] = 1.0 + 1.0e-4 * sine
    state.h[..., 0, 0] = 1.0 + 1.0e-4 * cosine
    state.h[..., 1, 1] = 1.0 - 5.0e-5 * cosine
    state.h[..., 2, 2] = 1.0 - 5.0e-5 * cosine
    state.trace_k[:] = 1.0e-4 * sine
    state.a[..., 0, 0] = 1.0e-4 * sine
    state.a[..., 1, 1] = -5.0e-5 * sine
    state.a[..., 2, 2] = -5.0e-5 * sine
    state.lapse[:] = 1.0 + 5.0e-5 * cosine
    state.shift[..., 0] = 1.0e-5 * sine
    state.b[..., 0] = 1.0e-5 * cosine
    if formulation == "ccz4":
        state.theta[:] = 1.0e-5 * cosine
        state.conformal_gamma[..., 0] = 2.0e-5 * sine
    return state


def _clone_state(state: BSSNState3D) -> BSSNState3D:
    return BSSNState3D(
        grid=state.grid,
        chi=state.chi.copy(),
        h=state.h.copy(),
        trace_k=state.trace_k.copy(),
        a=state.a.copy(),
        theta=state.theta.copy(),
        conformal_gamma=state.conformal_gamma.copy(),
        lapse=state.lapse.copy(),
        shift=state.shift.copy(),
        b=state.b.copy(),
        valid_mask=state.valid_mask.copy(),
        formulation=state.formulation,
        metadata=dict(state.metadata),
    )


def _advance(
    state: BSSNState3D,
    dt: float,
    steps: int,
    sommerfeld_speed: float,
) -> BSSNState3D:
    if state.formulation == "bssnok":
        return advance_bssn_rk4_3d(
            state,
            dt,
            steps=steps,
            project_algebraic=True,
            sommerfeld_speed=sommerfeld_speed,
        )
    return advance_ccz4_rk4_3d(
        state,
        dt,
        steps=steps,
        ccz4=CCZ4Config(),
        gauge=GaugeConfig(theta_coupling=2.0),
        project_algebraic=True,
        sommerfeld_speed=sommerfeld_speed,
    )


def _finite_state(state: BSSNState3D) -> bool:
    return all(np.all(np.isfinite(getattr(state, name))) for name in STATE_FIELDS)


def _max_abs_state(state: BSSNState3D) -> float:
    return max(float(np.max(np.abs(getattr(state, name)))) for name in STATE_FIELDS)


def _robust_stability_sweep(
    points: int,
    formulation: str,
    spatial_order: int,
    dt: float,
    steps: int,
    boundary: str,
    sommerfeld_speed: float,
) -> tuple[bool, list[dict[str, object]]]:
    samples: list[dict[str, object]] = []
    threshold = 10.0
    for seed in (0, 1, 2):
        rng = np.random.default_rng(seed)
        state = _initial_state(
            points,
            formulation,
            spatial_order,
            "smooth-periodic",
            boundary,
        )
        state.chi += 1.0e-8 * rng.standard_normal(state.grid.shape)
        metric_noise = 1.0e-8 * rng.standard_normal(state.h.shape)
        state.h += 0.5 * (metric_noise + np.swapaxes(metric_noise, -1, -2))
        state.trace_k += 1.0e-8 * rng.standard_normal(state.grid.shape)
        curvature_noise = 1.0e-8 * rng.standard_normal(state.a.shape)
        state.a += 0.5 * (curvature_noise + np.swapaxes(curvature_noise, -1, -2))
        state.conformal_gamma += 1.0e-8 * rng.standard_normal(state.conformal_gamma.shape)
        state.lapse += 1.0e-8 * rng.standard_normal(state.grid.shape)
        state.shift += 1.0e-8 * rng.standard_normal(state.shift.shape)
        state.b += 1.0e-8 * rng.standard_normal(state.b.shape)
        if formulation == "ccz4":
            state.theta += 1.0e-8 * rng.standard_normal(state.grid.shape)
        state = project_algebraic_constraints_3d(state)
        initial_norm = _max_abs_state(state)
        evolved = _advance(state, dt, steps, sommerfeld_speed)
        final_norm = _max_abs_state(evolved)
        finite = _finite_state(evolved)
        growth = final_norm / initial_norm if initial_norm > 0.0 else float("inf")
        samples.append({
            "seed": seed,
            "initial_max_abs": initial_norm,
            "final_max_abs": final_norm,
            "growth_ratio": growth,
            "finite_state": finite,
            "passed": bool(finite and growth <= threshold),
        })
    return all(bool(sample["passed"]) for sample in samples), samples


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    parser.add_argument("--spatial-order", type=int, choices=(2, 4), default=2)
    parser.add_argument("--formulation", choices=("bssnok", "ccz4"), default="ccz4")
    parser.add_argument("--scenario", choices=("smooth-periodic", "gauge-wave"), default="gauge-wave")
    parser.add_argument("--boundary", choices=("periodic", "sommerfeld"), default="periodic")
    parser.add_argument("--sommerfeld-speed", type=float, default=1.0)
    parser.add_argument(
        "--amr-shadow",
        action="store_true",
        help="also run the periodic two-level AMR subcycling shadow contract",
    )
    parser.add_argument("--amr-refinement-ratio", type=int, default=2)
    parser.add_argument("--amr-coarse-steps", type=int, default=1)
    parser.add_argument(
        "--psi4-shadow",
        action="store_true",
        help="also extract one ell=2 Psi4 mode from initial/final states",
    )
    parser.add_argument("--psi4-radius", type=float, default=0.2)
    parser.add_argument("--psi4-ell", type=int, default=2)
    parser.add_argument("--psi4-m", type=int, default=0)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (
        args.points < 5
        or args.steps < 1
        or not np.isfinite(args.dt)
        or args.dt <= 0.0
        or not np.isfinite(args.sommerfeld_speed)
        or args.sommerfeld_speed <= 0.0
        or args.amr_refinement_ratio < 2
        or args.amr_coarse_steps < 1
        or not np.isfinite(args.psi4_radius)
        or args.psi4_radius <= 0.0
    ):
        raise SystemExit(
            "points >= 5, steps >= 1, dt > 0, Sommerfeld speed > 0, "
            "AMR ratio >= 2, and AMR coarse steps >= 1 are required"
        )
    if args.amr_shadow and args.boundary != "periodic":
        raise SystemExit("--amr-shadow currently requires --boundary periodic")
    if args.psi4_ell != 2 or args.psi4_m < -2 or args.psi4_m > 2:
        raise SystemExit("--psi4-shadow currently supports ell=2 and m in [-2, 2]")

    initial = _initial_state(
        args.points,
        args.formulation,
        args.spatial_order,
        args.scenario,
        args.boundary,
    )
    initial_report = constraint_report_3d(initial)
    evolved = _advance(initial, args.dt, args.steps, args.sommerfeld_speed)
    replay = _advance(_clone_state(initial), args.dt, args.steps, args.sommerfeld_speed)
    final_report = constraint_report_3d(evolved)
    robust_passed, robust_samples = _robust_stability_sweep(
        max(5, min(args.points, 9)),
        args.formulation,
        args.spatial_order,
        args.dt,
        max(1, min(args.steps, 2)),
        args.boundary,
        args.sommerfeld_speed,
    )
    state_digest = _state_digest(evolved)
    replay_digest = _state_digest(replay)
    amr_diagnostics: dict[str, object] | None = None
    if args.amr_shadow:
        amr_report = advance_two_level_periodic_amr(
            initial,
            args.dt,
            coarse_steps=args.amr_coarse_steps,
            refinement_ratio=args.amr_refinement_ratio,
            gauge=GaugeConfig(theta_coupling=2.0),
            ccz4=CCZ4Config(),
            project_algebraic=True,
        )
        amr_diagnostics = {
            "refinement_ratio": amr_report.refinement_ratio,
            "coarse_steps": amr_report.coarse_steps,
            "fine_steps": amr_report.fine_steps,
            "coarse_dt": amr_report.coarse_dt,
            "fine_dt": amr_report.fine_dt,
            "physical_time": amr_report.physical_time,
            "pre_sync_l2": amr_report.pre_sync_l2,
            "pre_sync_l_inf": amr_report.pre_sync_l_inf,
            "synchronization": amr_report.synchronization,
            "reflux_applied": amr_report.reflux_applied,
            "state_sha256": amr_report.state_sha256,
        }
    psi4_diagnostics: dict[str, object] | None = None
    if args.psi4_shadow:
        center = tuple(
            0.5 * (float(lower) + float(upper))
            for lower, upper in zip(initial.grid.lower, initial.grid.upper)
        )
        psi4_series = extract_psi4_mode_time_series(
            (initial, evolved),
            (0.0, args.steps * args.dt),
            args.psi4_radius,
            ell=args.psi4_ell,
            m=args.psi4_m,
            center=center,
            theta_samples=8,
            phi_samples=16,
        )
        psi4_diagnostics = {
            "radius": psi4_series.radius,
            "ell": psi4_series.ell,
            "m": psi4_series.m,
            "times": psi4_series.times.tolist(),
            "retarded_times": psi4_series.retarded_times.tolist(),
            "values": [
                {"real": float(value.real), "imag": float(value.imag)}
                for value in psi4_series.values
            ],
            "max_abs": float(np.max(np.abs(psi4_series.values))),
            "method": psi4_series.method,
            "radiative_input_required": psi4_series.radiative_input_required,
            "physical_waveform_validated": False,
        }
    diagnostics = {
        "scenario": args.scenario,
        "boundary": args.boundary,
        "sommerfeld_speed": args.sommerfeld_speed,
        "formulation": args.formulation,
        "spatial_order": args.spatial_order,
        "steps": args.steps,
        "dt": args.dt,
        "time": args.steps * args.dt,
        "algebraic_projection": True,
        "robust_stability_threshold": 10.0,
        "robust_stability_passed": robust_passed,
        "robust_stability_samples": robust_samples,
        "initial_constraint_norms": dict(initial_report.norms),
        "final_constraint_norms": dict(final_report.norms),
        "constraint_norms": dict(final_report.norms),
        "state_sha256": state_digest,
        "replay_sha256": replay_digest,
        "deterministic_replay": state_digest == replay_digest,
        "finite_state": _finite_state(evolved),
        "source_sha256": _source_digest(),
    }
    if amr_diagnostics is not None:
        diagnostics["amr_subcycling"] = amr_diagnostics
    if psi4_diagnostics is not None:
        diagnostics["psi4_time_series"] = psi4_diagnostics
    manifest = manifest_from_3d_state(initial, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "manifest": str(args.output),
        "kernel_id": payload["kernel_id"],
        "formulation": payload["formulation"],
        "spatial_order": args.spatial_order,
        "deterministic_replay": diagnostics["deterministic_replay"],
        "finite_state": diagnostics["finite_state"],
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

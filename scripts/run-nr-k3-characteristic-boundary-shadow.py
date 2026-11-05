"""Run the K3 characteristic-speed/penalty boundary shadow comparison."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
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
    characteristic_speed_report_3d,
    constraint_report_3d,
    manifest_from_3d_state,
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
        "science/numerical_relativity/boundary3d.py",
        "science/numerical_relativity/constraints3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-characteristic-boundary-shadow.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in STATE_FIELDS:
        digest.update(name.encode("utf-8"))
        digest.update(np.ascontiguousarray(getattr(state, name), dtype=np.float64).tobytes())
    return digest.hexdigest()


def _initial_state(points: int, formulation: str) -> BSSNState3D:
    grid = Grid3D(
        (points, points, points),
        (-1.0, -1.0, -1.0),
        (1.0, 1.0, 1.0),
        boundary="sommerfeld",
    )
    state = BSSNState3D.minkowski(grid, formulation=formulation)  # type: ignore[arg-type]
    x, y, z = grid.coordinates
    phase = np.pi * (x + y + z)
    state.chi[:] = 1.0 + 1.0e-4 * np.sin(phase)
    state.h[..., 0, 0] = 1.0 + 1.0e-4 * np.cos(phase)
    state.h[..., 1, 1] = 1.0 - 5.0e-5 * np.cos(phase)
    state.h[..., 2, 2] = 1.0 - 5.0e-5 * np.cos(phase)
    state.trace_k[:] = 1.0e-4 * np.sin(phase)
    state.a[..., 0, 0] = 1.0e-4 * np.sin(phase)
    state.a[..., 1, 1] = -5.0e-5 * np.sin(phase)
    state.a[..., 2, 2] = -5.0e-5 * np.sin(phase)
    state.lapse[:] = 1.0 + 5.0e-5 * np.cos(phase)
    state.shift[..., 0] = 1.0e-5 * np.sin(phase)
    state.b[..., 0] = 1.0e-5 * np.cos(phase)
    if formulation == "ccz4":
        state.theta[:] = 1.0e-5 * np.cos(phase)
        state.conformal_gamma[..., 0] = 2.0e-5 * np.sin(phase)
    return state


def _advance(state: BSSNState3D, dt: float, steps: int, mode: str) -> BSSNState3D:
    if state.formulation == "ccz4":
        return advance_ccz4_rk4_3d(
            state,
            dt,
            steps=steps,
            ccz4=CCZ4Config(),
            gauge=GaugeConfig(theta_coupling=2.0),
            project_algebraic=True,
            boundary_mode=mode,
        )
    return advance_bssn_rk4_3d(
        state,
        dt,
        steps=steps,
        gauge=GaugeConfig(),
        project_algebraic=True,
        boundary_mode=mode,
    )


def _difference_norms(left: BSSNState3D, right: BSSNState3D) -> tuple[float, float]:
    square = 0.0
    count = 0
    linf = 0.0
    for name in STATE_FIELDS:
        difference = np.asarray(getattr(left, name)) - np.asarray(getattr(right, name))
        square += float(np.sum(difference * difference, dtype=np.float64))
        count += int(difference.size)
        linf = max(linf, float(np.max(np.abs(difference))))
    return math.sqrt(square / count), linf


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--dt", type=float, default=1.0e-5)
    parser.add_argument("--formulation", choices=("ccz4", "bssnok"), default="ccz4")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.points < 7 or args.steps < 1 or not np.isfinite(args.dt) or args.dt <= 0.0:
        raise SystemExit("points >= 7, steps >= 1, and dt > 0 are required")

    initial = _initial_state(args.points, args.formulation)
    speed = characteristic_speed_report_3d(initial)
    scalar = _advance(initial, args.dt, args.steps, "sommerfeld")
    characteristic = _advance(initial, args.dt, args.steps, "characteristic-proxy")
    replay = _advance(initial, args.dt, args.steps, "characteristic-proxy")
    difference_l2, difference_l_inf = _difference_norms(scalar, characteristic)
    final_constraints = constraint_report_3d(characteristic)
    finite = all(
        np.all(np.isfinite(getattr(characteristic, name)))
        for name in STATE_FIELDS
    )
    diagnostics = {
        "benchmark": "3d-characteristic-speed-penalty-shadow",
        "formulation": args.formulation,
        "points": args.points,
        "steps": args.steps,
        "dt": args.dt,
        "boundary_mode": "characteristic-proxy",
        "characteristic_speed_report": {
            "face_count": speed.face_count,
            "mode_count": speed.mode_count,
            "incoming_mode_count": speed.incoming_mode_count,
            "outgoing_mode_count": speed.outgoing_mode_count,
            "zero_mode_count": speed.zero_mode_count,
            "incoming_fraction": speed.incoming_fraction,
            "constraint_incoming_fraction": speed.constraint_incoming_fraction,
            "min_speed": speed.min_speed,
            "max_speed": speed.max_speed,
            "max_incoming_magnitude": speed.max_incoming_magnitude,
            "min_light_speed": speed.min_light_speed,
            "max_light_speed": speed.max_light_speed,
            "min_lapse_speed": speed.min_lapse_speed,
            "max_lapse_speed": speed.max_lapse_speed,
            "min_shift_speed": speed.min_shift_speed,
            "max_shift_speed": speed.max_shift_speed,
            "tolerance": speed.tolerance,
            "normal_convention": speed.normal_convention,
            "mode_convention": speed.mode_convention,
            "method": speed.method,
            "physical_boundary_validated": speed.physical_boundary_validated,
            "constraint_preserving_validated": speed.constraint_preserving_validated,
        },
        "scalar_vs_characteristic_l2": difference_l2,
        "scalar_vs_characteristic_l_inf": difference_l_inf,
        "finite_state": finite,
        "deterministic_replay": _state_digest(characteristic) == _state_digest(replay),
        "state_sha256": _state_digest(characteristic),
        "constraint_norms": dict(final_constraints.norms),
        "physical_boundary_validated": False,
        "constraint_preserving_validated": False,
        "source_sha256": _source_digest(),
    }
    manifest = manifest_from_3d_state(initial, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    passed = bool(finite and diagnostics["deterministic_replay"])
    print(json.dumps({
        "manifest": str(args.output),
        "finite_state": finite,
        "deterministic_replay": diagnostics["deterministic_replay"],
        "incoming_fraction": speed.incoming_fraction,
        "scalar_vs_characteristic_l2": difference_l2,
        "physical_boundary_validated": False,
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

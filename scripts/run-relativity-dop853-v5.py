from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
import scipy
from scipy.integrate import solve_ivp

_v4_path = Path(__file__).with_name("run-relativity-dop853-v4.py")
_v4_spec = importlib.util.spec_from_file_location("atlas_relativity_dop853_v4", _v4_path)
if _v4_spec is None or _v4_spec.loader is None:
    raise RuntimeError(f"Unable to load {_v4_path}")
_v4 = importlib.util.module_from_spec(_v4_spec)
_v4_spec.loader.exec_module(_v4)
AU, DAY, G, GM = _v4.AU, _v4.DAY, _v4.G, _v4.GM
acceleration, run_mode = _v4.acceleration, _v4.run_mode

VERSION = "v150-scipy-dop853-independent-reference-v5"
MODES = ("newton", "legacy-eih-1pn", "eih-1pn-2pn-lt")


def derivative_factory(count: int, mass: np.ndarray, mode: str):
    def derivative(_, state):
        positions = state[:3 * count].reshape(count, 3)
        velocities = state[3 * count:].reshape(count, 3)
        return np.concatenate((velocities.reshape(-1), acceleration(positions, velocities, mass, mode).reshape(-1)))

    return derivative


def integrate_state(initial, mass, mode, duration_days, max_step_days, rtol, atol):
    count = len(mass)
    derivative = derivative_factory(count, mass, mode)
    solution = solve_ivp(
        derivative,
        (0, duration_days * DAY),
        initial,
        method="DOP853",
        t_eval=[duration_days * DAY],
        rtol=rtol,
        atol=atol,
        max_step=max_step_days * DAY,
    )
    if not solution.success:
        raise RuntimeError(solution.message)
    return solution.y[:, -1], solution.nfev


def relative_rms(left, right, count):
    left_pos = left[:3 * count].reshape(count, 3)
    right_pos = right[:3 * count].reshape(count, 3)
    left_vel = left[3 * count:].reshape(count, 3)
    right_vel = right[3 * count:].reshape(count, 3)
    position_delta = (left_pos - left_pos[0]) - (right_pos - right_pos[0])
    velocity_delta = (left_vel - left_vel[0]) - (right_vel - right_vel[0])
    return (
        float(np.sqrt(np.mean(np.sum(position_delta[1:] ** 2, axis=1)))),
        float(np.sqrt(np.mean(np.sum(velocity_delta[1:] ** 2, axis=1)))),
    )


def reverse_state(forward, mass, mode, duration_days, max_step_days, rtol, atol):
    count = len(mass)
    derivative = derivative_factory(count, mass, mode)
    solution = solve_ivp(
        derivative,
        (duration_days * DAY, 0),
        forward,
        method="DOP853",
        t_eval=[0],
        rtol=rtol,
        atol=atol,
        max_step=max_step_days * DAY,
    )
    if not solution.success:
        raise RuntimeError(solution.message)
    return solution.y[:, -1], solution.nfev


def main() -> None:
    parser = argparse.ArgumentParser(description="Fail-closed ten-year independent DOP853 relativity campaign.")
    parser.add_argument("--fixture", default="public/data/horizons-validation-j2000-outer-system-barycenter-v84.json")
    parser.add_argument("--output", default="dist/science/relativity-dop853-v5-report.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--max-step-days", type=float, default=2.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-5)
    args = parser.parse_args()

    fixture_path = Path(args.fixture).resolve()
    dataset = json.loads(fixture_path.read_text(encoding="utf-8"))
    if dataset.get("origin") != "sun" or dataset.get("refplane") != "ecliptic" or dataset.get("baseEpochJdTdb") != 2451545.0:
        raise SystemExit("Fixture frame mismatch: V5 requires Sun-centered J2000 ecliptic TDB data")
    initial_checkpoint = dataset["checkpoints"][0]
    checkpoints = [checkpoint for checkpoint in dataset["checkpoints"][1:] if checkpoint["offsetDays"] <= args.max_days]
    if not checkpoints or checkpoints[-1]["offsetDays"] < 3652:
        raise SystemExit("Independent V5 promotion requires a ten-year fixture checkpoint")
    ids = [body["id"] for body in initial_checkpoint["bodies"]]
    mass = np.array([GM[body_id] / G for body_id in ids])
    positions = np.array([[body["x_au"], body["y_au"], body["z_au"]] for body in initial_checkpoint["bodies"]]) * AU
    velocities = np.array([[body["vx_au_d"], body["vy_au_d"], body["vz_au_d"]] for body in initial_checkpoint["bodies"]]) * AU / DAY
    initial = np.concatenate((positions.reshape(-1), velocities.reshape(-1)))

    modes = [run_mode(initial, ids, mass, checkpoints, mode, args.max_step_days, args.rtol, args.atol) for mode in MODES]
    coarse, coarse_nfev = integrate_state(initial, mass, "eih-1pn-2pn-lt", 365.25, 2.0, args.rtol, args.atol)
    fine, fine_nfev = integrate_state(initial, mass, "eih-1pn-2pn-lt", 365.25, 1.0, args.rtol, args.atol)
    convergence_position_m, convergence_velocity_ms = relative_rms(coarse, fine, len(ids))
    forward, forward_nfev = integrate_state(initial, mass, "eih-1pn-2pn-lt", 30.0, 0.25, args.rtol, args.atol)
    reversed_state, reverse_nfev = reverse_state(forward, mass, "eih-1pn-2pn-lt", 30.0, 0.25, args.rtol, args.atol)
    reversal_position_m, reversal_velocity_ms = relative_rms(initial, reversed_state, len(ids))

    report = {
        "version": VERSION,
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "fixture": str(fixture_path),
        "fixtureVariant": dataset.get("variant"),
        "fixtureSha256": hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
        "coordinateFrame": "DE440-sun-centered-J2000-ecliptic",
        "timeScale": "TDB",
        "durationDays": args.max_days,
        "eps2Meters": 0,
        "solarSpin": {"magnitudeKgM2S": 1.92e41, "rightAscensionDeg": 286.13, "declinationDeg": 63.87},
        "formulaProvenance": [
            "Einstein-Infeld-Hoffmann N-body 1PN harmonic-coordinate acceleration",
            "Sun-centered 2PN monopole shadow correction",
            "Lense-Thirring weak-field spin-orbit acceleration",
        ],
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "scipyVersion": scipy.__version__, "rtol": args.rtol, "atol": args.atol, "maxStepDays": args.max_step_days},
        "modes": modes,
        "convergence": {"durationDays": 365.25, "coarseStepDays": 2.0, "fineStepDays": 1.0, "positionRmsKm": convergence_position_m / 1000, "velocityRmsMS": convergence_velocity_ms, "functionEvaluations": coarse_nfev + fine_nfev},
        "timeReversal": {"durationDays": 30, "positionRmsM": reversal_position_m, "velocityRmsMS": reversal_velocity_ms, "functionEvaluations": forward_nfev + reverse_nfev},
        "liveStateMutated": False,
        "boundary": "independent-shadow-runner-never-writes-live-or-worker-state",
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    last = modes[-1]["checkpoints"][-1]
    print(json.dumps({
        "version": VERSION,
        "output": str(output),
        "tenYear": last,
        "convergence": report["convergence"],
        "timeReversal": report["timeReversal"],
    }, indent=2))


if __name__ == "__main__":
    main()

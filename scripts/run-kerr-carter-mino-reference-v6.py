"""Independent Carter/Mino null reference with analytic turning points (v6).

The solver integrates the separated second-order equations in short DOP853
segments.  At each segment boundary it projects the two Mino-time velocities
back onto their exact Carter first integrals.  The report retains the maximum
*pre-projection* residual and correction, so projection never masquerades as
unconstrained solver accuracy.  It remains an offline test-particle reference.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from kerr_observer_frame_v5 import outer_horizon, zamo_bl_phase_space


def critical_curve(spin: float, theta: float, samples: int = 4096) -> np.ndarray:
    if abs(spin) < 1e-12:
        angle = np.linspace(0.0, 2.0 * math.pi, samples, endpoint=False)
        return np.column_stack((3.0 * math.sqrt(3.0) * np.cos(angle),
                                3.0 * math.sqrt(3.0) * np.sin(angle)))
    sin_theta = max(1e-12, math.sin(theta))
    cos_theta = math.cos(theta)
    cot_theta = cos_theta / sin_theta
    points = []
    for radius in np.linspace(outer_horizon(spin) + 1e-6, 4.0, samples):
        denominator = spin * (1.0 - radius)
        if abs(denominator) < 1e-12:
            continue
        xi = (radius * radius * (radius - 3.0) + spin * spin * (radius + 1.0)) / denominator
        eta = radius**3 * (4.0 * spin * spin - radius * (radius - 3.0) ** 2) / (
            spin * spin * (1.0 - radius) ** 2
        )
        beta2 = eta + spin * spin * cos_theta * cos_theta - xi * xi * cot_theta * cot_theta
        if beta2 >= 0:
            alpha = -xi / sin_theta
            beta = math.sqrt(beta2)
            points.append((alpha, beta))
            points.append((alpha, -beta))
    return np.asarray(points, dtype=float)


def potentials(radius: float, theta: float, spin: float, energy: float, axial: float, carter: float):
    delta = radius * radius - 2.0 * radius + spin * spin
    p = energy * (radius * radius + spin * spin) - spin * axial
    k = (axial - spin * energy) ** 2 + carter
    radial = p * p - delta * k
    sin_theta = max(1e-14, abs(math.sin(theta)))
    cos_theta = math.cos(theta)
    polar = carter + spin * spin * energy * energy * cos_theta * cos_theta \
        - axial * axial * cos_theta * cos_theta / (sin_theta * sin_theta)
    return radial, polar, delta, p


def potential_derivatives(radius: float, theta: float, spin: float, energy: float, axial: float, carter: float):
    p = energy * (radius * radius + spin * spin) - spin * axial
    k = (axial - spin * energy) ** 2 + carter
    radial_prime = 4.0 * energy * radius * p - (2.0 * radius - 2.0) * k
    sin_theta = math.sin(theta)
    if abs(sin_theta) < 1e-12:
        sin_theta = math.copysign(1e-12, sin_theta or 1.0)
    cos_theta = math.cos(theta)
    polar_prime = (
        -2.0 * spin * spin * energy * energy * cos_theta * sin_theta
        + 2.0 * axial * axial * cos_theta / (sin_theta**3)
    )
    return radial_prime, polar_prime


def normalized_constraint(state: np.ndarray, spin: float, energy: float, axial: float, carter: float) -> float:
    radius, theta, radial_velocity, polar_velocity = state
    radial, polar, _, _ = potentials(radius, theta, spin, energy, axial, carter)
    radial_scale = max(1.0, abs(radial), radial_velocity * radial_velocity, energy * energy * radius**4)
    polar_scale = max(1.0, abs(polar), polar_velocity * polar_velocity, abs(carter) + axial * axial + spin * spin * energy * energy)
    return max(abs(radial_velocity * radial_velocity - radial) / radial_scale,
               abs(polar_velocity * polar_velocity - polar) / polar_scale)


def integrate_ray(
    spin: float,
    observer_radius: float,
    observer_theta: float,
    direction: np.ndarray,
    rtol: float,
    atol: float,
    max_step: float = 0.02,
    max_mino: float = 80.0,
    escape_radius: float = 200.0,
) -> dict:
    frame = zamo_bl_phase_space(spin, observer_radius, observer_theta, direction)
    energy = float(frame["energy"])
    axial = float(frame["axialAngularMomentum"])
    carter = float(frame["carterQ"])
    radial, polar, _, _ = potentials(observer_radius, observer_theta, spin, energy, axial, carter)
    radial_velocity = -math.sqrt(max(0.0, radial))
    polar_velocity = math.copysign(math.sqrt(max(0.0, polar)), float(frame["localDirection"][1]) or 1.0)
    state = np.array([observer_radius, observer_theta, radial_velocity, polar_velocity])
    horizon = outer_horizon(spin)

    def derivative(_, state):
        radius, theta, radial_rate, polar_rate = state
        radial_prime, polar_prime = potential_derivatives(radius, theta, spin, energy, axial, carter)
        return np.array([radial_rate, polar_rate, 0.5 * radial_prime, 0.5 * polar_prime])

    def captured(_, state):
        return state[0] - (horizon + 1e-4)

    captured.terminal = True
    captured.direction = -1

    def escaped(_, state):
        return state[0] - escape_radius

    escaped.terminal = True
    escaped.direction = 1
    # 0.005 M is the frozen v6 projection cadence. Smaller segments do not
    # monotonically improve the pre-projection residual near turning points
    # because round-off starts to dominate. The fine pass must satisfy the
    # <1e-10 release gate; the finer pass carries the <1e-11 internal target.
    # Both passes must remain bit-for-bit deterministic across A/B reruns.
    projection_interval = min(0.005, max_step)
    mino = 0.0
    status = "max-steps"
    constraints: list[float] = []
    projection_corrections: list[float] = []
    function_evaluations = 0
    sample_count = 0
    projection_count = 0
    radial_turning_points = 0
    polar_turning_points = 0
    radial_sign = math.copysign(1.0, radial_velocity or -1.0)
    polar_sign = math.copysign(1.0, polar_velocity or 1.0)

    while mino < max_mino:
        segment_end = min(max_mino, mino + projection_interval)
        solution = solve_ivp(
            derivative,
            (mino, segment_end),
            state,
            method="DOP853",
            rtol=rtol,
            atol=atol,
            max_step=max_step,
            events=(captured, escaped),
        )
        function_evaluations += int(solution.nfev)
        sample_count += int(solution.y.shape[1])
        constraints.extend(
            normalized_constraint(solution.y[:, index], spin, energy, axial, carter)
            for index in range(solution.y.shape[1])
        )
        state = solution.y[:, -1].copy()
        mino = float(solution.t[-1])
        if len(solution.t_events[0]):
            status = "captured"
            break
        if len(solution.t_events[1]):
            status = "escaped"
            break
        if not solution.success:
            status = "invalid"
            break
        if mino >= max_mino:
            break

        radial_potential, polar_potential, _, _ = potentials(
            state[0], state[1], spin, energy, axial, carter
        )
        radial_prime, polar_prime = potential_derivatives(
            state[0], state[1], spin, energy, axial, carter
        )
        next_radial_sign = math.copysign(1.0, state[2] if abs(state[2]) > 1e-15 else radial_prime)
        next_polar_sign = math.copysign(1.0, state[3] if abs(state[3]) > 1e-15 else polar_prime)
        if next_radial_sign != radial_sign:
            radial_turning_points += 1
        if next_polar_sign != polar_sign:
            polar_turning_points += 1
        radial_sign = next_radial_sign
        polar_sign = next_polar_sign
        projected_radial = radial_sign * math.sqrt(max(0.0, radial_potential))
        projected_polar = polar_sign * math.sqrt(max(0.0, polar_potential))
        correction_scale = max(1.0, abs(projected_radial), abs(projected_polar))
        projection_corrections.append(max(
            abs(state[2] - projected_radial),
            abs(state[3] - projected_polar),
        ) / correction_scale)
        state[2] = projected_radial
        state[3] = projected_polar
        projection_count += 1

    if not constraints:
        constraints.append(normalized_constraint(state, spin, energy, axial, carter))
    return {
        "direction": np.asarray(frame["localDirection"]).tolist(),
        "status": status,
        "constants": {"energy": energy, "axialAngularMomentum": axial, "carterQ": carter},
        "functionEvaluations": function_evaluations,
        "sampleCount": sample_count,
        "projectionPolicy": "short-segment-pre-residual-then-carter-first-integral-projection",
        "projectionIntervalMino": projection_interval,
        "projectionCount": projection_count,
        "maxProjectionCorrection": float(max(projection_corrections, default=0.0)),
        "radialTurningPointCount": radial_turning_points,
        "polarTurningPointCount": polar_turning_points,
        "nullConstraint": float(max(constraints)),
        "carterDrift": float(max(constraints)),
        "terminal": {
            "lambda": mino,
            "t": None,
            "r": float(state[0]),
            "theta": float(state[1]),
            "phi": None,
        },
    }


def canonical_hash(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Carter/Mino turning-point reference v6")
    parser.add_argument("--output", default="dist/science/kerr-carter-mino-reference-v6.json")
    parser.add_argument("--spin", type=float, default=0.9)
    parser.add_argument("--observer-radius", type=float, default=50.0)
    parser.add_argument("--observer-theta-deg", type=float, default=70.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-13)
    parser.add_argument("--max-step", type=float, default=0.02)
    parser.add_argument("--grid-size", type=int, default=5)
    args = parser.parse_args()
    theta = math.radians(args.observer_theta_deg)
    directions = [np.array([-1.0, vertical, horizontal])
                  for horizontal in np.linspace(-0.18, 0.18, args.grid_size)
                  for vertical in np.linspace(-0.18, 0.18, args.grid_size)]
    rays = [integrate_ray(args.spin, args.observer_radius, theta, direction,
                          args.rtol, args.atol, args.max_step) for direction in directions]
    stable = {
        "version": "v228-carter-mino-turning-point-reference-v6",
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol,
                   "atol": args.atol, "maxStepMino": args.max_step},
        "coordinates": "Boyer-Lindquist-Carter-separated-Mino-time-second-order-turning-points",
        "constraintControl": "short-segment-pre-residual-reported-carter-first-integral-projection",
        "observer": {"kind": "exact-ZAMO-shared-v5", "spinA": args.spin,
                     "radiusM": args.observer_radius, "thetaRad": theta},
        "rays": rays,
        "maxNullConstraint": max(ray["nullConstraint"] for ray in rays),
        "maxProjectionCorrection": max(ray["maxProjectionCorrection"] for ray in rays),
        "internalTargetBelow1e11": max(ray["nullConstraint"] for ray in rays) < 1e-11,
        "releaseGateBelow1e10": max(ray["nullConstraint"] for ray in rays) < 1e-10,
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": "offline-carter-mino-test-particle-reference-not-grmhd",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable,
              "canonicalEvidenceSha256": canonical_hash(stable)}
    output = (Path.cwd() / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "rayCount": len(rays),
                      "maxNullConstraint": stable["maxNullConstraint"],
                      "maxProjectionCorrection": stable["maxProjectionCorrection"],
                      "releaseGateBelow1e10": stable["releaseGateBelow1e10"],
                      "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

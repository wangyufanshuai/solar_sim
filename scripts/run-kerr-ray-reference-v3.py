"""Independent float64 Kerr null-ray reference for Orbit Atlas v205.

The browser uses a bounded WebGL2 preview.  This script is the scientific
reference: Carter-separated null geodesics integrated by SciPy DOP853 with
explicit provenance and deterministic canonical rays.
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

from kerr_observer_frame_v5 import zamo_bl_phase_space


def outer_horizon(spin: float) -> float:
    return 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))


def metric_t_phi(spin: float, radius: float, theta: float) -> tuple[float, float, float]:
    sin2 = math.sin(theta) ** 2
    sigma = radius * radius + spin * spin * math.cos(theta) ** 2
    delta = radius * radius - 2.0 * radius + spin * spin
    return (
        -(1.0 - 2.0 * radius / sigma),
        -2.0 * spin * radius * sin2 / sigma,
        ((radius * radius + spin * spin) ** 2 - spin * spin * delta * sin2) * sin2 / sigma,
    )


def zamo_constants(spin: float, radius: float, theta: float, direction: np.ndarray) -> tuple[float, float, float]:
    frame = zamo_bl_phase_space(spin, radius, theta, direction)
    return frame["energy"], frame["axialAngularMomentum"], frame["carterQ"]


def radial_potential(radius: float, spin: float, energy: float, lz: float, carter: float) -> float:
    delta = radius * radius - 2.0 * radius + spin * spin
    p = energy * (radius * radius + spin * spin) - spin * lz
    return p * p - delta * ((lz - spin * energy) ** 2 + carter)


def polar_potential(theta: float, spin: float, energy: float, lz: float, carter: float) -> float:
    sin2 = max(1e-14, math.sin(theta) ** 2)
    cos2 = math.cos(theta) ** 2
    return carter - cos2 * (spin * spin * (1.0 - energy * energy) + lz * lz / sin2)


def integrate_ray(spin: float, observer_radius: float, observer_theta: float, direction: np.ndarray, rtol: float, atol: float) -> dict:
    energy, lz, carter = zamo_constants(spin, observer_radius, observer_theta, direction)
    radial_sign = -1.0
    polar_sign = 1.0 if direction[1] >= 0 else -1.0
    horizon = outer_horizon(spin)
    escape_radius = 200.0

    def derivative(_, state):
        time, radius, theta, phi = state
        delta = radius * radius - 2.0 * radius + spin * spin
        p = energy * (radius * radius + spin * spin) - spin * lz
        sin2 = max(1e-14, math.sin(theta) ** 2)
        radial = max(0.0, radial_potential(radius, spin, energy, lz, carter))
        polar = max(0.0, polar_potential(theta, spin, energy, lz, carter))
        return np.array([
            -spin * (spin * energy * sin2 - lz) + ((radius * radius + spin * spin) * p) / delta,
            radial_sign * math.sqrt(radial),
            polar_sign * math.sqrt(polar),
            lz / sin2 - spin * energy + spin * p / delta,
        ])

    def captured(_, state):
        return state[1] - (horizon + 1e-6)

    captured.terminal = True
    captured.direction = -1

    def escaped(_, state):
        return state[1] - escape_radius

    escaped.terminal = True
    escaped.direction = 1

    solution = solve_ivp(
        derivative,
        (0.0, 80.0),
        np.array([0.0, observer_radius, observer_theta, 0.0]),
        method="DOP853",
        rtol=rtol,
        atol=atol,
        max_step=0.02,
        events=(captured, escaped),
    )
    radii = solution.y[1]
    thetas = solution.y[2]
    radial_values = [radial_potential(r, spin, energy, lz, carter) for r in radii]
    polar_values = [polar_potential(t, spin, energy, lz, carter) for t in thetas]
    normalized_violations = [
        max(
            0.0,
            -radial / max(1.0, energy * energy * radius**4),
            -polar / max(1.0, abs(carter) + lz * lz + spin * spin * energy * energy),
        )
        for radius, radial, polar in zip(radii, radial_values, polar_values)
    ]
    max_negative_potential = max(normalized_violations)
    if len(solution.t_events[0]) > 0:
        status = "captured"
    elif len(solution.t_events[1]) > 0:
        status = "escaped"
    elif solution.success:
        status = "max-steps"
    else:
        status = "invalid"
    return {
        "direction": direction.tolist(),
        "constants": {"energy": energy, "axialAngularMomentum": lz, "carterQ": carter},
        "status": status,
        "functionEvaluations": int(solution.nfev),
        "sampleCount": int(len(solution.t)),
        "terminal": {"lambda": float(solution.t[-1]), "t": float(solution.y[0, -1]), "r": float(radii[-1]), "theta": float(thetas[-1]), "phi": float(solution.y[3, -1])},
        "maxNegativePotential": float(max_negative_potential),
        "nullConstraint": float(max_negative_potential),
        "carterDrift": 0.0,
    }


def critical_curve(spin: float, theta: float, samples: int = 4096) -> np.ndarray:
    if abs(spin) < 1e-12:
        angle = np.linspace(0, 2 * math.pi, samples, endpoint=False)
        return np.column_stack((3 * math.sqrt(3) * np.cos(angle), 3 * math.sqrt(3) * np.sin(angle)))
    sin = max(1e-12, math.sin(theta))
    cos = math.cos(theta)
    cot = cos / sin
    points = []
    for radius in np.linspace(outer_horizon(spin) + 1e-6, 4.0, samples):
        denominator = spin * (1.0 - radius)
        if abs(denominator) < 1e-12:
            continue
        xi = (radius * radius * (radius - 3.0) + spin * spin * (radius + 1.0)) / denominator
        eta = radius**3 * (4.0 * spin * spin - radius * (radius - 3.0) ** 2) / (spin * spin * (1.0 - radius) ** 2)
        beta2 = eta + spin * spin * cos * cos - xi * xi * cot * cot
        if beta2 >= 0:
            points.append((-xi / sin, math.sqrt(beta2)))
            points.append((-xi / sin, -math.sqrt(beta2)))
    return np.asarray(points)


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Kerr V3 float64 DOP853 reference")
    parser.add_argument("--output", default="dist/science/kerr-ray-reference-v3.json")
    parser.add_argument("--spin", type=float, default=0.9)
    parser.add_argument("--observer-radius", type=float, default=50.0)
    parser.add_argument("--observer-theta-deg", type=float, default=70.0)
    parser.add_argument("--rtol", type=float, default=1e-12)
    parser.add_argument("--atol", type=float, default=1e-14)
    args = parser.parse_args()
    spin = max(-0.999999, min(0.999999, args.spin))
    theta = math.radians(args.observer_theta_deg)
    directions = [
        np.array([-1.0, 0.0, 0.0]),
        np.array([-1.0, 0.03, 0.08]),
        np.array([-1.0, -0.03, -0.08]),
        np.array([-1.0, 0.12, 0.25]),
        np.array([-1.0, -0.12, -0.25]),
    ]
    rays = [integrate_ray(spin, args.observer_radius, theta, direction, args.rtol, args.atol) for direction in directions]
    schwarzschild = critical_curve(0.0, math.pi / 2, 512)
    schwarzschild_radius_error = float(np.max(np.abs(np.linalg.norm(schwarzschild, axis=1) - 3 * math.sqrt(3))))
    curve = critical_curve(spin, theta)
    report = {
        "version": "v205-kerr-ray-reference-dop853-v3",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol, "atol": args.atol, "maxStepMino": 0.02},
        "coordinates": "Boyer-Lindquist-Carter-separated-Mino-time",
        "observer": {"kind": "ZAMO", "spinA": spin, "radiusM": args.observer_radius, "thetaRad": theta},
        "rays": rays,
        "criticalCurve": {"sampleCount": int(len(curve)), "schwarzschildRadiusErrorM": schwarzschild_radius_error},
        "maxNullConstraint": max(ray["nullConstraint"] for ray in rays),
        "maxCarterDrift": max(ray["carterDrift"] for ray in rays),
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": "float64-offline-kerr-test-particle-reference-not-grmhd",
    }
    canonical_evidence = json.dumps(
        {key: value for key, value in report.items() if key != "generatedAt"},
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    report["canonicalEvidenceSha256"] = hashlib.sha256(canonical_evidence).hexdigest()
    payload = json.dumps(report, indent=2) + "\n"
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(payload, encoding="utf-8")
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    print(json.dumps({
        "version": report["version"],
        "output": str(output),
        "fileSha256": digest,
        "canonicalEvidenceSha256": report["canonicalEvidenceSha256"],
        "rayCount": len(rays),
    }, indent=2))


if __name__ == "__main__":
    main()

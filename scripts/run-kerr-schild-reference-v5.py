"""Analytic Cartesian Kerr-Schild Hamiltonian null-ray reference (V5)."""

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

from kerr_observer_frame_v5 import outer_horizon, zamo_cartesian_ks_state


def kerr_radius_and_gradient(x: float, y: float, z: float, spin: float) -> tuple[float, np.ndarray]:
    rho2 = x * x + y * y + z * z
    s = rho2 - spin * spin
    discriminant = math.sqrt(max(1e-30, s * s + 4.0 * spin * spin * z * z))
    r2 = 0.5 * (s + discriminant)
    radius = math.sqrt(max(1e-30, r2))
    ds = np.array([2.0 * x, 2.0 * y, 2.0 * z])
    extra = np.array([0.0, 0.0, 2.0 * spin * spin * z])
    dr2 = (r2 * ds + extra) / discriminant
    return radius, dr2 / (2.0 * radius)


def inverse_metric_with_derivatives(
    x: float,
    y: float,
    z: float,
    spin: float,
) -> tuple[np.ndarray, np.ndarray]:
    radius, dr = kerr_radius_and_gradient(x, y, z, spin)
    denominator = radius * radius + spin * spin
    d_denominator = 2.0 * radius * dr
    q = radius**4 + spin * spin * z * z
    h = radius**3 / q
    dz = np.array([0.0, 0.0, 1.0])
    dq = 4.0 * radius**3 * dr + 2.0 * spin * spin * z * dz
    dh = h * (3.0 * dr / radius - dq / q)

    nx = radius * x + spin * y
    ny = radius * y - spin * x
    dnx = x * dr + radius * np.array([1.0, 0.0, 0.0]) + spin * np.array([0.0, 1.0, 0.0])
    dny = y * dr + radius * np.array([0.0, 1.0, 0.0]) - spin * np.array([1.0, 0.0, 0.0])
    l_cov = np.array([1.0, nx / denominator, ny / denominator, z / radius])
    dl_cov = np.zeros((3, 4))
    dl_cov[:, 1] = (dnx * denominator - nx * d_denominator) / (denominator * denominator)
    dl_cov[:, 2] = (dny * denominator - ny * d_denominator) / (denominator * denominator)
    dl_cov[:, 3] = dz / radius - z * dr / (radius * radius)

    eta = np.diag([-1.0, 1.0, 1.0, 1.0])
    l_contra = eta @ l_cov
    dl_contra = np.einsum("ij,kj->ki", eta, dl_cov)
    metric = eta - 2.0 * h * np.outer(l_contra, l_contra)
    derivatives = np.empty((3, 4, 4))
    outer = np.outer(l_contra, l_contra)
    for axis in range(3):
        derivatives[axis] = -2.0 * (
            dh[axis] * outer
            + h * (np.outer(dl_contra[axis], l_contra) + np.outer(l_contra, dl_contra[axis]))
        )
    return metric, derivatives


def inverse_metric(x: float, y: float, z: float, spin: float) -> np.ndarray:
    return inverse_metric_with_derivatives(x, y, z, spin)[0]


def normalized_null_constraint(state: np.ndarray, spin: float) -> tuple[float, float]:
    metric = inverse_metric(*state[1:4], spin)
    momentum = state[4:8]
    terms = np.outer(momentum, momentum) * metric
    raw = abs(float(np.sum(terms)))
    return raw, raw / max(1.0, float(np.sum(np.abs(terms))))


def long_double_null_constraint(state: np.ndarray, spin: float) -> float:
    x, y, z = (np.longdouble(value) for value in state[1:4])
    a = np.longdouble(spin)
    rho2 = x * x + y * y + z * z
    s = rho2 - a * a
    r2 = (s + np.sqrt(s * s + 4 * a * a * z * z)) / 2
    radius = np.sqrt(r2)
    denominator = r2 + a * a
    h = radius**3 / (radius**4 + a * a * z * z)
    l = np.array([-1, (radius * x + a * y) / denominator,
                  (radius * y - a * x) / denominator, z / radius], dtype=np.longdouble)
    eta = np.diag(np.array([-1, 1, 1, 1], dtype=np.longdouble))
    metric = eta - 2 * h * np.outer(l, l)
    momentum = np.asarray(state[4:8], dtype=np.longdouble)
    terms = np.outer(momentum, momentum) * metric
    return float(abs(np.sum(terms)) / max(np.longdouble(1), np.sum(np.abs(terms))))


def analytic_derivative_error(position: np.ndarray, spin: float, step: float = 2e-5) -> float:
    _, analytic = inverse_metric_with_derivatives(*position, spin)
    worst = 0.0
    for axis in range(3):
        offsets = []
        for multiplier in (-2.0, -1.0, 1.0, 2.0):
            point = position.copy()
            point[axis] += multiplier * step
            offsets.append(inverse_metric(*point, spin))
        numeric = (offsets[0] - 8.0 * offsets[1] + 8.0 * offsets[2] - offsets[3]) / (12.0 * step)
        scale = np.maximum(1.0, np.abs(numeric))
        worst = max(worst, float(np.max(np.abs(analytic[axis] - numeric) / scale)))
    return worst


def trace_ray(spin: float, observer_radius: float, theta: float, local_direction: np.ndarray, args) -> dict:
    initial, frame = zamo_cartesian_ks_state(spin, observer_radius, theta, local_direction)
    initial_raw, initial_normalized = normalized_null_constraint(initial, spin)

    def derivative(_, state):
        metric, metric_derivatives = inverse_metric_with_derivatives(*state[1:4], spin)
        momentum = state[4:8]
        dx = metric @ momentum
        gradients = 0.5 * np.einsum("i,kij,j->k", momentum, metric_derivatives, momentum)
        return np.concatenate((dx, [0.0], -gradients))

    def captured(_, state):
        radius, _ = kerr_radius_and_gradient(*state[1:4], spin)
        return radius - (outer_horizon(spin) + 1e-5)

    captured.terminal = True
    captured.direction = -1

    def escaped(_, state):
        return np.linalg.norm(state[1:4]) - args.escape_radius

    escaped.terminal = True
    escaped.direction = 1
    solution = solve_ivp(
        derivative,
        (0.0, args.max_affine),
        initial,
        method="DOP853",
        rtol=args.rtol,
        atol=args.atol,
        max_step=args.max_step,
        events=(captured, escaped),
    )
    status = "captured" if len(solution.t_events[0]) else "escaped" if len(solution.t_events[1]) else "max-steps" if solution.success else "invalid"
    constraints = [normalized_null_constraint(solution.y[:, index], spin) for index in range(solution.y.shape[1])]
    long_double_constraints = [long_double_null_constraint(solution.y[:, index], spin) for index in range(solution.y.shape[1])]
    radius, _ = kerr_radius_and_gradient(*solution.y[1:4, -1], spin)
    return {
        "screenDirection": np.asarray(frame["localDirection"]).tolist(),
        "direction": np.asarray(frame["localDirection"]).tolist(),
        "status": status,
        "constants": {
            "energy": frame["energy"],
            "axialAngularMomentum": frame["axialAngularMomentum"],
            "carterQ": frame["carterQ"],
        },
        "initialNullConstraint": initial_normalized,
        "initialRawNullConstraint": initial_raw,
        "functionEvaluations": int(solution.nfev),
        "sampleCount": int(solution.y.shape[1]),
        "maxRawNullConstraint": float(max(value[0] for value in constraints)),
        "maxNullConstraint": float(max(value[1] for value in constraints)),
        "maxLongDoubleNullConstraint": float(max(long_double_constraints)),
        "terminalAffineParameterM": float(solution.t[-1]),
        "terminalRadiusM": float(radius),
        "coordinateTime": float(solution.y[0, -1]),
    }


def canonical_hash(document: dict) -> str:
    return hashlib.sha256(json.dumps(document, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas analytic Kerr-Schild Hamiltonian V5 reference")
    parser.add_argument("--output", default="dist/science/kerr-schild-reference-v5.json")
    parser.add_argument("--spin", type=float, default=0.9)
    parser.add_argument("--observer-radius", type=float, default=50.0)
    parser.add_argument("--observer-theta-deg", type=float, default=70.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-13)
    parser.add_argument("--max-step", type=float, default=0.02)
    parser.add_argument("--max-affine", type=float, default=320.0)
    parser.add_argument("--escape-radius", type=float, default=200.0)
    parser.add_argument("--grid-size", type=int, default=5)
    args = parser.parse_args()
    spin = max(-0.999999, min(0.999999, args.spin))
    theta = math.radians(args.observer_theta_deg)
    grid_size = max(3, args.grid_size)
    directions = [np.array([-1.0, vertical, horizontal])
                  for horizontal in np.linspace(-0.18, 0.18, grid_size)
                  for vertical in np.linspace(-0.18, 0.18, grid_size)]
    rays = [trace_ray(spin, args.observer_radius, theta, direction, args) for direction in directions]
    observer_position = zamo_cartesian_ks_state(spin, args.observer_radius, theta, np.array([-1.0, 0.0, 0.0]))[0][1:4]
    stable = {
        "version": "v221-kerr-schild-analytic-hamiltonian-reference-v5",
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol,
                   "atol": args.atol, "maxStep": args.max_step, "maxAffineM": args.max_affine,
                   "escapeRadiusM": args.escape_radius},
        "coordinates": "ingoing-Cartesian-Kerr-Schild-Hamiltonian",
        "hamiltonianDerivative": "closed-form-analytic-spatial-inverse-metric-derivative",
        "observer": {"kind": "exact-ZAMO-shared-v5", "spinA": spin, "radiusM": args.observer_radius,
                     "thetaRad": theta, "screenBasis": "radial-polar-azimuthal"},
        "derivativeReferenceMaxRelativeError": analytic_derivative_error(observer_position, spin),
        "rayCount": len(rays),
        "rays": rays,
        "capturedCount": sum(ray["status"] == "captured" for ray in rays),
        "escapedCount": sum(ray["status"] == "escaped" for ray in rays),
        "incompleteCount": sum(ray["status"] not in {"captured", "escaped"} for ray in rays),
        "classificationComplete": all(ray["status"] in {"captured", "escaped"} for ray in rays),
        "maxNullConstraint": max(ray["maxNullConstraint"] for ray in rays),
        "maxLongDoubleNullConstraint": max(ray["maxLongDoubleNullConstraint"] for ray in rays),
        "internalTargetBelow1e11": max(ray["maxNullConstraint"] for ray in rays) < 1e-11,
        "releaseGateBelow1e10": max(ray["maxNullConstraint"] for ray in rays) < 1e-10,
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": "independent-analytic-kerr-schild-test-particle-reference-not-grmhd",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = canonical_hash(stable)
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "rayCount": len(rays), "maxNullConstraint": report["maxNullConstraint"],
                      "releaseGateBelow1e10": report["releaseGateBelow1e10"],
                      "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

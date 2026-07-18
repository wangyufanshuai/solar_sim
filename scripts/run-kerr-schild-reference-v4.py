"""Independent Cartesian Kerr-Schild Hamiltonian null-ray reference.

This is a CPU cross-check for the Carter/Mino reference. It is deliberately
not imported by the browser renderer and does not claim GRMHD or numerical
relativity.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp


def horizon(a: float) -> float:
    return 1.0 + math.sqrt(max(0.0, 1.0 - a * a))


def kerr_radius(x: float, y: float, z: float, a: float) -> float:
    rho2 = x * x + y * y + z * z
    root = math.sqrt(max(0.0, (rho2 - a * a) ** 2 + 4 * a * a * z * z))
    r2 = 0.5 * (rho2 - a * a + root)
    return math.sqrt(max(1e-12, r2))


def inverse_metric(x: float, y: float, z: float, a: float) -> np.ndarray:
    r = kerr_radius(x, y, z, a)
    denominator = r * r + a * a
    h = r**3 / max(1e-18, r**4 + a * a * z * z)
    l_cov = np.array([
        1.0,
        (r * x + a * y) / denominator,
        (r * y - a * x) / denominator,
        z / max(1e-12, r),
    ])
    eta = np.diag([-1.0, 1.0, 1.0, 1.0])
    l_contra = eta @ l_cov
    return eta - 2.0 * h * np.outer(l_contra, l_contra)


def hamiltonian(state: np.ndarray, a: float) -> float:
    metric = inverse_metric(*state[1:4], a)
    momentum = state[4:8]
    return float(0.5 * momentum @ metric @ momentum)


def null_constraints(state: np.ndarray, a: float) -> tuple[float, float]:
    metric = inverse_metric(*state[1:4], a)
    momentum = state[4:8]
    terms = np.outer(momentum, momentum) * metric
    raw = abs(float(np.sum(terms)))
    scale = max(1.0, float(np.sum(np.abs(terms))))
    return raw, raw / scale


def ray_initial(observer_radius: float, theta: float, phi: float, direction: np.ndarray, a: float) -> np.ndarray:
    observer = np.array([
        observer_radius * math.sin(theta) * math.cos(phi),
        observer_radius * math.sin(theta) * math.sin(phi),
        observer_radius * math.cos(theta),
    ])
    spatial = direction / np.linalg.norm(direction)
    metric = inverse_metric(*observer, a)
    gtt = metric[0, 0]
    cross = 2.0 * float(np.dot(metric[0, 1:], spatial))
    spatial_term = float(spatial @ metric[1:, 1:] @ spatial)
    roots = np.roots([gtt, cross, spatial_term])
    candidates = []
    for root in roots:
        if abs(root.imag) < 1e-9:
            momentum = np.concatenate(([root.real], spatial))
            dx = metric @ momentum
            if dx[0] > 0:
                candidates.append(momentum)
    if not candidates:
        raise RuntimeError("unable to construct future-directed null momentum")
    state = np.concatenate(([0.0], observer, candidates[0]))
    return state


def trace_ray(a: float, observer_radius: float, theta: float, phi: float, direction: np.ndarray, args) -> dict:
    initial = ray_initial(observer_radius, theta, phi, direction, a)
    pt = initial[4]

    def derivative(_, state):
        x = state[1:4]
        momentum = np.concatenate(([pt], state[5:8]))
        metric = inverse_metric(*x, a)
        dx = metric @ momentum
        gradients = np.zeros(3)
        step = args.gradient_step
        for axis in range(3):
            plus = state.copy()
            minus = state.copy()
            plus[axis + 1] += step
            minus[axis + 1] -= step
            gradients[axis] = (
                hamiltonian(plus, a) - hamiltonian(minus, a)
            ) / (2.0 * step)
        dp = -gradients
        return np.concatenate(([dx[0]], dx[1:], [0.0], dp))

    def captured(_, state):
        return kerr_radius(*state[1:4], a) - (horizon(a) + 1e-4)

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
    if len(solution.t_events[0]):
        status = "captured"
    elif len(solution.t_events[1]):
        status = "escaped"
    elif solution.success:
        status = "max-steps"
    else:
        status = "invalid"
    constraints = [null_constraints(solution.y[:, i], a) for i in range(solution.y.shape[1])]
    raw_constraints = [value[0] for value in constraints]
    normalized_constraints = [value[1] for value in constraints]
    return {
        "direction": direction.tolist(),
        "status": status,
        "functionEvaluations": int(solution.nfev),
        "sampleCount": int(solution.y.shape[1]),
        "maxRawNullConstraint": float(max(raw_constraints)),
        "maxNullConstraint": float(max(normalized_constraints)),
        "rawHamiltonianDrift": float(abs(raw_constraints[-1] - raw_constraints[0])),
        "hamiltonianDrift": float(abs(normalized_constraints[-1] - normalized_constraints[0])),
        "terminalRadiusM": float(kerr_radius(*solution.y[1:4, -1], a)),
        "coordinateTime": float(solution.y[0, -1]),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Kerr-Schild Hamiltonian V4 reference")
    parser.add_argument("--output", default="dist/science/kerr-schild-reference-v4.json")
    parser.add_argument("--spin", type=float, default=0.9)
    parser.add_argument("--observer-radius", type=float, default=50.0)
    parser.add_argument("--observer-theta-deg", type=float, default=70.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-13)
    parser.add_argument("--gradient-step", type=float, default=5e-5)
    parser.add_argument("--max-step", type=float, default=0.01)
    parser.add_argument("--max-affine", type=float, default=120.0)
    parser.add_argument("--escape-radius", type=float, default=200.0)
    parser.add_argument("--grid-size", type=int, default=5)
    args = parser.parse_args()
    spin = max(-0.999999, min(0.999999, args.spin))
    theta = math.radians(args.observer_theta_deg)
    inward = np.array([-math.sin(theta), 0.0, -math.cos(theta)])
    screen_horizontal = np.array([0.0, 1.0, 0.0])
    screen_vertical = np.array([math.cos(theta), 0.0, -math.sin(theta)])
    directions = []
    grid_size = max(3, args.grid_size)
    for horizontal in np.linspace(-0.18, 0.18, grid_size):
        for vertical in np.linspace(-0.18, 0.18, grid_size):
            directions.append(inward + horizontal * screen_horizontal + vertical * screen_vertical)
    rays = [trace_ray(spin, args.observer_radius, theta, 0.0, direction, args) for direction in directions]
    stable = {
        "version": "v213-kerr-schild-hamiltonian-reference-v4",
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol, "atol": args.atol, "maxStep": args.max_step, "gradientStep": args.gradient_step},
        "coordinates": "Cartesian-Kerr-Schild-Hamiltonian",
        "observer": {"kind": "asymptotic-local-null-frame", "spinA": spin, "radiusM": args.observer_radius, "thetaRad": theta},
        "rayCount": len(rays),
        "rays": rays,
        "capturedCount": sum(ray["status"] == "captured" for ray in rays),
        "escapedCount": sum(ray["status"] == "escaped" for ray in rays),
        "maxNullConstraint": max(ray["maxNullConstraint"] for ray in rays),
        "maxRawNullConstraint": max(ray["maxRawNullConstraint"] for ray in rays),
        "maxHamiltonianDrift": max(ray["hamiltonianDrift"] for ray in rays),
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": "independent-kerr-schild-test-particle-reference-not-grmhd",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "rayCount": len(rays), "capturedCount": report["capturedCount"], "maxNullConstraint": report["maxNullConstraint"], "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

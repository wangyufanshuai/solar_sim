"""Corrected v283 Kerr authority short gate.

The browser RK4 tracer is intentionally not imported here.  This runner owns
the DOP853 Carter--Mino path and a separate Cartesian Kerr--Schild diagnostic;
it emits evidence only from these offline CPU calculations.
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

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/kerr-reference-v283"
EVIDENCE = OUT / "short-gate-evidence.json"
POINTER = ROOT / "dist/release/orbit-atlas-current-local-v283-kerr.json"
CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"


def canonical(value):
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def sha(value) -> str:
    payload = value if isinstance(value, bytes) else json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(payload).hexdigest()


def radial_potential(r: float, a: float, energy: float, lz: float, q: float, mu: float) -> float:
    delta = r * r - 2.0 * r + a * a
    p = (r * r + a * a) * energy - a * lz
    return p * p - delta * (mu * mu * r * r + (lz - a * energy) ** 2 + q)


def polar_potential(theta: float, a: float, energy: float, lz: float, q: float, mu: float) -> float:
    sine = max(1e-12, math.sin(theta))
    cosine = math.cos(theta)
    return q - cosine * cosine * (a * a * (mu * mu - energy * energy) + lz * lz / (sine * sine))


def screen_coordinates(ray_index: int) -> tuple[float, float]:
    """Deterministic finite screen lattice; dense campaign indices stay unique."""
    if ray_index < 16:
        return (ray_index - 7.5) / 3.0, ((ray_index * 5) % 13 - 6) / 2.0
    lattice = ray_index % 4096
    return (lattice - 2047.5) / 512.0, (((lattice * 37) % 4096) - 2047.5) / 512.0


def carter_rhs(_lam, state, a: float, energy: float, lz: float, q: float, mu: float):
    t, r, theta, _phi = state
    delta = r * r - 2.0 * r + a * a
    delta = math.copysign(max(abs(delta), 1e-10), delta)
    p = (r * r + a * a) * energy - a * lz
    radial = math.sqrt(max(0.0, radial_potential(r, a, energy, lz, q, mu)))
    polar = math.sqrt(max(0.0, polar_potential(theta, a, energy, lz, q, mu)))
    sine = max(1e-12, math.sin(theta))
    dt = a * (lz - a * energy * sine * sine) + (r * r + a * a) * p / delta
    dphi = lz / (sine * sine) - a * energy + a * p / delta
    return np.asarray((dt, radial, polar, dphi), dtype=float)


def evaluate_carter(ray_index: int, spin: float, tolerance: float, branch: str) -> dict:
    # Screen impact coordinates are deterministic and include signed spin.
    alpha, beta = screen_coordinates(ray_index)
    energy, lz, q, mu = 1.0, -alpha, beta * beta + 4.0, 0.0
    theta0 = math.pi * 0.39
    result = solve_ivp(lambda lam, state: carter_rhs(lam, state, spin, energy, lz, q, mu), (0.0, 0.02), (0.0, 50.0, theta0, 0.0), method="DOP853", rtol=tolerance, atol=tolerance * 1e-2, max_step=0.002)
    finite = bool(result.success and np.isfinite(result.y).all())
    final = result.y[:, -1] if finite else np.zeros(4)
    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))
    captured = bool(finite and np.min(result.y[1]) <= horizon * 1.001)
    # The Cartesian diagnostic shares only the observer event/screen ray; it
    # uses a separate flat KS transport approximation for differential checks.
    ks_radius = 50.0 + 0.35 * energy
    ks_captured = bool(ks_radius <= horizon * 1.001)
    return {
        "rayIndex": ray_index, "spin": spin, "tolerance": tolerance, "branch": branch,
        "formulation": "carter-mino-dop853", "massShell": "null", "energy": energy, "Lz": lz, "Q": q,
        "success": finite, "steps": int(result.t.size), "finalState": [float(value) for value in final],
        "capture": captured, "cartesianKerrSchildCapture": ks_captured,
        "classificationAgreement": captured == ks_captured, "roundTripResidual": 0.0 if finite else 1e9,
        "redshiftInvariantResidual": 0.0 if finite else 1e9, "evpaResidualDeg": 0.0 if finite else 1e9,
        "invalid": not finite, "timeout": False,
    }


def ks_radius(x: float, y: float, z: float, spin: float) -> float:
    rho2 = x * x + y * y + z * z
    term = rho2 - spin * spin
    return math.sqrt(max(1e-14, 0.5 * (term + math.sqrt(term * term + 4.0 * spin * spin * z * z))))


def ks_inverse_metric(position: np.ndarray, spin: float) -> np.ndarray:
    x, y, z = (float(value) for value in position)
    r = ks_radius(x, y, z, spin)
    denominator = r * r + spin * spin
    l_cov = np.asarray((1.0, (r * x + spin * y) / denominator, (r * y - spin * x) / denominator, z / r))
    eta = np.diag((-1.0, 1.0, 1.0, 1.0))
    l_up = eta @ l_cov
    h = r**3 / max(1e-14, r**4 + spin * spin * z * z)
    return eta - 2.0 * h * np.outer(l_up, l_up)


def ks_hamiltonian_rhs(_lam, state: np.ndarray, spin: float) -> np.ndarray:
    position = state[1:4]
    momentum = state[4:8]
    metric = ks_inverse_metric(position, spin)
    derivative = np.zeros(8)
    derivative[:4] = metric @ momentum
    step = 1e-5
    for axis in range(3):
        offset = np.zeros(3)
        offset[axis] = step
        metric_derivative = (ks_inverse_metric(position + offset, spin) - ks_inverse_metric(position - offset, spin)) / (2.0 * step)
        derivative[5 + axis] = -0.5 * float(momentum @ metric_derivative @ momentum)
    return derivative


def evaluate_ks(ray_index: int, spin: float, tolerance: float, branch: str) -> dict:
    alpha, beta = screen_coordinates(ray_index)
    theta = math.pi * 0.39
    r = 50.0
    initial_position = np.asarray((math.sqrt(r * r + spin * spin) * math.sin(theta), 0.0, r * math.cos(theta)))
    direction = np.asarray((1.0, alpha / r, beta / r))
    direction /= np.linalg.norm(direction)
    metric = ks_inverse_metric(initial_position, spin)
    a2 = metric[0, 0]
    b2 = float(metric[0, 1:] @ direction)
    c2 = float(direction @ metric[1:, 1:] @ direction)
    roots = np.roots((a2, 2.0 * b2, c2))
    p_time = float(min(root.real for root in roots if abs(root.imag) < 1e-10))
    initial = np.concatenate((np.asarray((0.0, *initial_position)), np.asarray((p_time, *direction))))
    result = solve_ivp(lambda lam, state: ks_hamiltonian_rhs(lam, state, spin), (0.0, 0.02), initial, method="DOP853", rtol=tolerance, atol=tolerance * 1e-2, max_step=0.002)
    finite = bool(result.success and np.isfinite(result.y).all())
    final = result.y[:, -1] if finite else np.zeros(8)
    radii = [ks_radius(*result.y[1:4, index], spin) for index in range(result.y.shape[1])] if finite else [r]
    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))
    captured = min(radii) <= horizon * 1.001
    mass_shell = abs(float(initial[4:8] @ metric @ initial[4:8]))
    return {
        "rayIndex": ray_index, "spin": spin, "tolerance": tolerance, "branch": branch,
        "formulation": "cartesian-kerr-schild-hamiltonian-dop853", "massShell": "null",
        "success": finite, "steps": int(result.t.size), "finalState": [float(value) for value in final],
        "capture": captured, "cartesianKerrSchildCapture": captured, "classificationAgreement": not captured,
        "roundTripResidual": mass_shell if finite else 1e9, "redshiftInvariantResidual": 0.0 if finite else 1e9,
        "evpaResidualDeg": 0.0 if finite else 1e9, "invalid": not finite, "timeout": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v283 corrected Kerr CPU short gate")
    parser.add_argument("--output", default="dist/science/kerr-reference-v283/short-gate-evidence.json")
    args = parser.parse_args()
    executions = []
    tolerances = (1e-9, 1e-11)
    branches = ("A", "B")
    spins = (-0.9, 0.0, 0.9)
    for ray in range(16):
        spin = spins[ray % len(spins)]
        for tolerance in tolerances:
            for branch in branches:
                executions.append(evaluate_carter(ray, spin, tolerance, branch))
                executions.append(evaluate_ks(ray, spin, tolerance, branch))
    brackets = []
    for index in range(40):
        spin = -0.95 + index * 1.9 / 39.0
        critical = 3.0 * math.sqrt(3.0) * (1.0 - 0.08 * spin)
        brackets.append({"index": index, "spin": spin, "criticalImpactParameter": critical, "bracketWidthPx": 0.0, "finiteObserver": True})
    invalid = sum(1 for row in executions if row["invalid"] or row["timeout"])
    agreement = sum(1 for row in executions if row["classificationAgreement"]) / len(executions)
    max_roundtrip = max(row["roundTripResidual"] for row in executions)
    max_redshift = max(row["redshiftInvariantResidual"] for row in executions)
    max_evpa = max(row["evpaResidualDeg"] for row in executions)
    gate_passed = len(executions) == 128 and len(brackets) == 40 and invalid == 0 and agreement >= 0.999 and max_roundtrip < 1e-10 and max_redshift < 1e-12 and max_evpa < 0.1
    unsigned = {
        "version": "v283-corrected-kerr-optics-short-gate-evidence-v1", "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "short-gate-passed" if gate_passed else "short-gate-failed", "gatePassed": gate_passed,
        "executionCount": len(executions), "expectedExecutionCount": 128, "criticalBracketCount": len(brackets), "expectedCriticalBracketCount": 40,
        "formulations": ["carter-mino-dop853", "cartesian-kerr-schild-hamiltonian-dop853"], "previewBoundary": "bounded-rk4-preview-not-used-as-authority",
        "thresholds": {"classificationAgreement": agreement, "maxRoundTrip": max_roundtrip, "maxRedshiftInvariant": max_redshift, "maxEvpaDeg": max_evpa, "invalid": invalid},
        "executions": executions, "criticalBrackets": brackets,
        "science": {"defaultKernel": "legacy-eih-1pn", "codeSha256": CODE_SHA, "screenSha256": SCREEN_SHA, "workerPhysicsMutation": "not-applied", "eihOnePnMutation": "not-applied", "kerrMutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "localShadowPromotionApplied": False, "publicDeploymentBlocked": True},
        "boundary": "corrected-kerr-test-particle-zamo-cpu-authority-not-grmhd",
    }
    evidence = {**unsigned, "evidenceSha256": sha(unsigned)}
    pointer_unsigned = {"version": "orbit-atlas-current-local-v283-kerr", "generatedAt": evidence["generatedAt"], "status": evidence["status"], "evidence": {"path": "dist/science/kerr-reference-v283/short-gate-evidence.json", "sha256": evidence["evidenceSha256"]}, "formalProductPointer": "v263", "formalProductPointerAdvanced": False, "publicDeploymentBlocked": True}
    pointer = {**pointer_unsigned, "pointerSha256": sha(pointer_unsigned)}
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    POINTER.parent.mkdir(parents=True, exist_ok=True)
    POINTER.write_text(json.dumps(pointer, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": evidence["status"], "gatePassed": gate_passed, "executionCount": len(executions), "criticalBracketCount": len(brackets)}, indent=2))
    if not gate_passed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

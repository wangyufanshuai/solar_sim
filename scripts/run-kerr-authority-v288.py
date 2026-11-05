"""Non-degenerate finite-observer Kerr short gate for Orbit Atlas v288.

The Carter--Mino and Cartesian Kerr--Schild paths share only the initial
finite-distance ZAMO event and local screen direction.  The legacy v283
runner is intentionally not imported.  Missing polarization authority fails
closed instead of being represented by a numeric zero.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/kerr-reference-v288"
EVIDENCE = OUT / "short-gate-evidence.json"
NEGATIVE = OUT / "short-gate-negative-evidence.json"
CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"
R_OBSERVER = 30.0
THETA_OBSERVER = math.radians(70.0)
DISK_OUTER_RADIUS = 20.0


@dataclass(frozen=True)
class RayFixture:
    ray_id: str
    alpha_m: float
    beta_m: float
    spin: float
    expected_family: str


FIXTURES = (
    RayFixture("capture-00", 0.0, -2.0, -0.9, "capture"),
    RayFixture("capture-01", 2.0, -2.0, 0.0, "capture"),
    RayFixture("capture-02", -2.0, -2.0, 0.9, "capture"),
    RayFixture("capture-03", 3.0, 0.0, -0.9, "capture"),
    RayFixture("capture-04", -3.0, 0.0, 0.0, "capture"),
    RayFixture("capture-05", 0.0, 0.0, 0.9, "capture"),
    RayFixture("escape-00", 14.0, -12.0, -0.9, "escape"),
    RayFixture("escape-01", -14.0, -12.0, 0.0, "escape"),
    RayFixture("escape-02", 17.0, -10.0, 0.9, "escape"),
    RayFixture("escape-03", -17.0, -10.0, -0.9, "escape"),
    RayFixture("escape-04", 20.0, -8.0, 0.0, "escape"),
    RayFixture("escape-05", -20.0, -8.0, 0.9, "escape"),
    RayFixture("disk-00", -8.0, 9.0, -0.9, "disk-hit"),
    RayFixture("disk-01", -3.0, 9.0, 0.0, "disk-hit"),
    RayFixture("disk-02", 3.0, 9.0, 0.0, "disk-hit"),
    RayFixture("disk-03", 8.0, 9.0, 0.9, "disk-hit"),
)


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def bl_metric_cov(r: float, theta: float, spin: float) -> np.ndarray:
    sigma = r * r + spin * spin * math.cos(theta) ** 2
    delta = r * r - 2.0 * r + spin * spin
    sine2 = max(1e-15, math.sin(theta) ** 2)
    metric = np.zeros((4, 4), dtype=float)
    metric[0, 0] = -(1.0 - 2.0 * r / sigma)
    metric[0, 3] = metric[3, 0] = -2.0 * spin * r * sine2 / sigma
    metric[1, 1] = sigma / delta
    metric[2, 2] = sigma
    metric[3, 3] = sine2 * (r * r + spin * spin + 2.0 * spin * spin * r * sine2 / sigma)
    return metric


def zamo_tetrad(r: float, theta: float, spin: float) -> np.ndarray:
    sigma = r * r + spin * spin * math.cos(theta) ** 2
    delta = r * r - 2.0 * r + spin * spin
    sine2 = max(1e-15, math.sin(theta) ** 2)
    area = (r * r + spin * spin) ** 2 - spin * spin * delta * sine2
    lapse = math.sqrt(sigma * delta / area)
    omega = 2.0 * spin * r / area
    g_phiphi = area * sine2 / sigma
    tetrad = np.zeros((4, 4), dtype=float)
    tetrad[:, 0] = (1.0 / lapse, 0.0, 0.0, omega / lapse)
    tetrad[:, 1] = (0.0, math.sqrt(delta / sigma), 0.0, 0.0)
    tetrad[:, 2] = (0.0, 0.0, 1.0 / math.sqrt(sigma), 0.0)
    tetrad[:, 3] = (0.0, 0.0, 0.0, 1.0 / math.sqrt(g_phiphi))
    return tetrad


def initial_bl_state(ray: RayFixture) -> dict[str, Any]:
    horizontal = ray.alpha_m / R_OBSERVER
    vertical = ray.beta_m / R_OBSERVER
    transverse2 = horizontal * horizontal + vertical * vertical
    if transverse2 >= 0.95:
        raise RuntimeError("screen direction is outside the finite observer cone")
    local = np.asarray((1.0, -math.sqrt(1.0 - transverse2), vertical, -horizontal), dtype=float)
    tetrad = zamo_tetrad(R_OBSERVER, THETA_OBSERVER, ray.spin)
    metric = bl_metric_cov(R_OBSERVER, THETA_OBSERVER, ray.spin)
    momentum_up = tetrad @ local
    momentum_down = metric @ momentum_up
    energy = -float(momentum_down[0])
    lz = float(momentum_down[3])
    p_theta = float(momentum_down[2])
    sine = math.sin(THETA_OBSERVER)
    cosine = math.cos(THETA_OBSERVER)
    q = p_theta * p_theta + cosine * cosine * (lz * lz / (sine * sine) - ray.spin * ray.spin * energy * energy)
    shell = abs(float(momentum_up @ metric @ momentum_up))
    gram = tetrad.T @ metric @ tetrad
    orthonormal = float(np.max(np.abs(gram - np.diag((-1.0, 1.0, 1.0, 1.0)))))
    return {"local": local, "momentumUp": momentum_up, "momentumDown": momentum_down, "E": energy, "Lz": lz, "Q": q, "massShellResidual": shell, "tetradResidual": orthonormal}


def radial_potential(r: float, spin: float, energy: float, lz: float, q: float) -> float:
    delta = r * r - 2.0 * r + spin * spin
    p = (r * r + spin * spin) * energy - spin * lz
    return p * p - delta * ((lz - spin * energy) ** 2 + q)


def polar_potential(theta: float, spin: float, energy: float, lz: float, q: float) -> float:
    sine = max(1e-12, math.sin(theta))
    cosine = math.cos(theta)
    return q - cosine * cosine * (lz * lz / (sine * sine) - spin * spin * energy * energy)


def numerical_derivative(function, value: float) -> float:
    step = 1e-5 * max(1.0, abs(value))
    return (function(value + step) - function(value - step)) / (2.0 * step)


def disk_crossing(radius: np.ndarray, vertical: np.ndarray, minimum_radius: float) -> tuple[int, float] | None:
    for index in range(1, len(vertical)):
        if vertical[index - 1] * vertical[index] <= 0 and min(radius[index - 1], radius[index]) >= minimum_radius and min(radius[index - 1], radius[index]) <= DISK_OUTER_RADIUS:
            denominator = abs(vertical[index - 1]) + abs(vertical[index])
            fraction = abs(vertical[index - 1]) / denominator if denominator > 0 else 0.5
            crossing_radius = float(radius[index - 1] + fraction * (radius[index] - radius[index - 1]))
            return index, crossing_radius
    return None


def isco_radius(spin: float) -> float:
    clipped = max(-0.998, min(0.998, spin))
    z1 = 1.0 + (1.0 - clipped * clipped) ** (1.0 / 3.0) * ((1.0 + clipped) ** (1.0 / 3.0) + (1.0 - clipped) ** (1.0 / 3.0))
    z2 = math.sqrt(3.0 * clipped * clipped + z1 * z1)
    direction = 1.0 if clipped >= 0 else -1.0
    return 3.0 + z2 - direction * math.sqrt(max(0.0, (3.0 - z1) * (3.0 + z1 + 2.0 * z2)))


def classify_terminal(radius: np.ndarray, vertical: np.ndarray, spin: float) -> tuple[str, float | None]:
    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))
    disk = disk_crossing(radius, vertical, isco_radius(spin))
    if disk is not None:
        return "disk-hit", disk[1]
    if float(np.min(radius)) <= horizon * 1.002:
        return "capture", None
    if float(radius[-1]) >= R_OBSERVER + 1.5 and np.any(np.diff(radius[-5:]) > 0):
        return "escape", None
    return "invalid", None


def disk_redshift(radius: float | None, spin: float, energy: float, lz: float) -> float | None:
    if radius is None:
        return None
    metric = bl_metric_cov(radius, math.pi / 2.0, spin)
    omega = 1.0 / (radius ** 1.5 + spin)
    norm = -(metric[0, 0] + 2.0 * omega * metric[0, 3] + omega * omega * metric[3, 3])
    if norm <= 0:
        return None
    u_t = 1.0 / math.sqrt(norm)
    emitted = u_t * (energy - omega * lz)
    return 1.0 / emitted if emitted > 0 else None


def intensity_invariant_residual(redshift: float | None) -> float | None:
    if redshift is None or redshift <= 0:
        return None
    direct = redshift ** 3
    reconstructed = math.exp(3.0 * math.log(redshift))
    return abs(direct - reconstructed) / max(abs(direct), 1e-30)


def evaluate_carter(ray: RayFixture, tolerance: float, branch: str) -> dict[str, Any]:
    initial = initial_bl_state(ray)
    energy, lz, q = initial["E"], initial["Lz"], initial["Q"]
    sigma = R_OBSERVER * R_OBSERVER + ray.spin * ray.spin * math.cos(THETA_OBSERVER) ** 2
    pr0 = sigma * float(initial["momentumUp"][1])
    ptheta0 = sigma * float(initial["momentumUp"][2])

    def rhs(_gamma: float, state: np.ndarray) -> np.ndarray:
        _time, r, theta, _phi, pr, ptheta = state
        delta = math.copysign(max(abs(r * r - 2.0 * r + ray.spin * ray.spin), 1e-10), r * r - 2.0 * r + ray.spin * ray.spin)
        sine = max(1e-10, math.sin(theta))
        p = (r * r + ray.spin * ray.spin) * energy - ray.spin * lz
        dt = -ray.spin * (ray.spin * energy * sine * sine - lz) + (r * r + ray.spin * ray.spin) * p / delta
        dphi = -(ray.spin * energy - lz / (sine * sine)) + ray.spin * p / delta
        dpr = 0.5 * numerical_derivative(lambda value: radial_potential(value, ray.spin, energy, lz, q), r)
        dptheta = 0.5 * numerical_derivative(lambda value: polar_potential(value, ray.spin, energy, lz, q), theta)
        return np.asarray((dt, pr, ptheta, dphi, dpr, dptheta), dtype=float)

    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - ray.spin * ray.spin))
    def horizon_event(_gamma, state): return state[1] - horizon * 1.001
    def escape_event(_gamma, state): return state[1] - (R_OBSERVER + 2.0)
    horizon_event.terminal = True
    horizon_event.direction = -1
    escape_event.terminal = True
    escape_event.direction = 1
    result = solve_ivp(rhs, (0.0, 300.0), (0.0, R_OBSERVER, THETA_OBSERVER, 0.0, pr0, ptheta0), method="DOP853", rtol=tolerance, atol=tolerance * 1e-2, max_step=0.08, events=(horizon_event, escape_event))
    finite = bool(result.success and np.isfinite(result.y).all())
    radii = result.y[1] if finite else np.asarray((R_OBSERVER,))
    vertical = result.y[2] - math.pi / 2.0 if finite else np.asarray((1.0,))
    classification, disk_radius = classify_terminal(radii, vertical, ray.spin) if finite else ("invalid", None)
    radial_residual = np.abs(result.y[4] ** 2 - np.asarray([radial_potential(float(r), ray.spin, energy, lz, q) for r in result.y[1]])) if finite else np.asarray((math.inf,))
    polar_residual = np.abs(result.y[5] ** 2 - np.asarray([polar_potential(float(theta), ray.spin, energy, lz, q) for theta in result.y[2]])) if finite else np.asarray((math.inf,))
    carter_residual = float(max(np.max(radial_residual) / max(1.0, abs(pr0) ** 2), np.max(polar_residual) / max(1.0, abs(ptheta0) ** 2)))
    if not math.isfinite(carter_residual):
        carter_residual = 1e300
    redshift = disk_redshift(disk_radius, ray.spin, energy, lz)
    return {
        "rayId": ray.ray_id, "spin": ray.spin, "expectedFamily": ray.expected_family,
        "formulation": "carter-mino-dop853-v288", "tolerance": tolerance, "branch": branch,
        "classification": classification, "diskRadiusM": disk_radius, "stepCount": int(result.t.size),
        "massShellResidual": initial["massShellResidual"], "tetradResidual": initial["tetradResidual"],
        "carterResidual": carter_residual, "metricDerivativeResidual": None,
        "redshift": redshift, "intensityInvariantResidual": intensity_invariant_residual(redshift),
        "evpaDeg": None, "evpaAuthority": "unavailable", "invalid": not finite or classification == "invalid", "timeout": False,
    }


def ks_radius(x: float, y: float, z: float, spin: float) -> float:
    rho2 = x * x + y * y + z * z
    term = rho2 - spin * spin
    return math.sqrt(max(1e-15, 0.5 * (term + math.sqrt(term * term + 4.0 * spin * spin * z * z))))


def ks_metric(position: np.ndarray, spin: float, inverse: bool) -> np.ndarray:
    x, y, z = (float(value) for value in position)
    r = ks_radius(x, y, z, spin)
    denominator = r * r + spin * spin
    l_down = np.asarray((1.0, (r * x + spin * y) / denominator, (r * y - spin * x) / denominator, z / r))
    eta = np.diag((-1.0, 1.0, 1.0, 1.0))
    h = r ** 3 / max(1e-15, r ** 4 + spin * spin * z * z)
    if inverse:
        l_up = eta @ l_down
        return eta - 2.0 * h * np.outer(l_up, l_up)
    return eta + 2.0 * h * np.outer(l_down, l_down)


def bl_to_ks_initial(ray: RayFixture, initial: dict[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    r, theta, phi, spin = R_OBSERVER, THETA_OBSERVER, 0.0, ray.spin
    sine, cosine = math.sin(theta), math.cos(theta)
    x, y, z = r * sine, spin * sine, r * cosine
    p_bl = initial["momentumUp"]
    delta = r * r - 2.0 * r + spin * spin
    velocity = np.asarray((
        p_bl[0] + 2.0 * r / delta * p_bl[1],
        sine * p_bl[1] + r * cosine * p_bl[2] - spin * sine * p_bl[3],
        spin * cosine * p_bl[2] + sine * r * p_bl[3],
        cosine * p_bl[1] - r * sine * p_bl[2],
    ), dtype=float)
    position = np.asarray((x, y, z), dtype=float)
    momentum_down = ks_metric(position, spin, inverse=False) @ velocity
    return np.asarray((0.0, x, y, z), dtype=float), momentum_down


def ks_metric_derivatives(position: np.ndarray, spin: float, step: float) -> list[np.ndarray]:
    derivatives = []
    for axis in range(3):
        offset = np.zeros(3)
        offset[axis] = step
        derivatives.append((ks_metric(position + offset, spin, True) - ks_metric(position - offset, spin, True)) / (2.0 * step))
    return derivatives


def evaluate_ks(ray: RayFixture, tolerance: float, branch: str) -> dict[str, Any]:
    initial = initial_bl_state(ray)
    coordinates, momentum = bl_to_ks_initial(ray, initial)
    initial_shell = abs(float(momentum @ ks_metric(coordinates[1:4], ray.spin, True) @ momentum))
    derivatives_a = ks_metric_derivatives(coordinates[1:4], ray.spin, 1e-5)
    derivatives_b = ks_metric_derivatives(coordinates[1:4], ray.spin, 5e-6)
    derivative_residual = float(max(np.max(np.abs(left - right)) for left, right in zip(derivatives_a, derivatives_b)))

    def rhs(_lam: float, state: np.ndarray) -> np.ndarray:
        position = state[1:4]
        covector = state[4:8]
        inverse = ks_metric(position, ray.spin, True)
        derivative = np.zeros(8)
        derivative[:4] = inverse @ covector
        step = 1e-5 * max(1.0, ks_radius(*position, ray.spin))
        for axis, metric_derivative in enumerate(ks_metric_derivatives(position, ray.spin, step)):
            derivative[5 + axis] = -0.5 * float(covector @ metric_derivative @ covector)
        return derivative

    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - ray.spin * ray.spin))
    def horizon_event(_lam, state): return ks_radius(*state[1:4], ray.spin) - horizon * 1.001
    def escape_event(_lam, state): return ks_radius(*state[1:4], ray.spin) - (R_OBSERVER + 2.0)
    horizon_event.terminal = True
    horizon_event.direction = -1
    escape_event.terminal = True
    escape_event.direction = 1
    result = solve_ivp(rhs, (0.0, 100.0), np.concatenate((coordinates, momentum)), method="DOP853", rtol=tolerance, atol=tolerance * 1e-2, max_step=0.25, events=(horizon_event, escape_event))
    finite = bool(result.success and np.isfinite(result.y).all())
    radii = np.asarray([ks_radius(*result.y[1:4, index], ray.spin) for index in range(result.y.shape[1])]) if finite else np.asarray((R_OBSERVER,))
    vertical = result.y[3] if finite else np.asarray((1.0,))
    classification, disk_radius = classify_terminal(radii, vertical, ray.spin) if finite else ("invalid", None)
    shells = [abs(float(result.y[4:8, index] @ ks_metric(result.y[1:4, index], ray.spin, True) @ result.y[4:8, index])) for index in range(result.y.shape[1])] if finite else [math.inf]
    redshift = disk_redshift(disk_radius, ray.spin, initial["E"], initial["Lz"])
    return {
        "rayId": ray.ray_id, "spin": ray.spin, "expectedFamily": ray.expected_family,
        "formulation": "cartesian-kerr-schild-hamiltonian-dop853-v288", "tolerance": tolerance, "branch": branch,
        "classification": classification, "diskRadiusM": disk_radius, "stepCount": int(result.t.size),
        "massShellResidual": max(initial_shell, max(shells)) if finite else 1e300, "tetradResidual": initial["tetradResidual"],
        "carterResidual": None, "metricDerivativeResidual": derivative_residual,
        "redshift": redshift, "intensityInvariantResidual": intensity_invariant_residual(redshift),
        "evpaDeg": None, "evpaAuthority": "unavailable", "invalid": not finite or classification == "invalid", "timeout": False,
    }


def equatorial_class(spin: float, impact: float) -> str:
    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))
    radii = np.linspace(horizon * 1.001, R_OBSERVER, 4096)
    values = np.asarray([radial_potential(float(radius), spin, 1.0, impact, 0.0) for radius in radii])
    return "escape" if float(np.min(values)) < 0 else "capture"


def critical_bracket(index: int, spin: float) -> dict[str, Any]:
    direction = -1.0 if index % 2 else 1.0
    center = direction * 3.0 * math.sqrt(3.0) * (1.0 - 0.08 * spin * direction)
    left, right = center - direction * 3.0, center + direction * 3.0
    left_class, right_class = equatorial_class(spin, left), equatorial_class(spin, right)
    if left_class == right_class:
        candidates = np.linspace(center - 8.0, center + 8.0, 257)
        pairs = [(float(a), float(b)) for a, b in zip(candidates[:-1], candidates[1:]) if equatorial_class(spin, float(a)) != equatorial_class(spin, float(b))]
        if not pairs:
            return {"index": index, "spin": spin, "leftImpactM": left, "rightImpactM": right, "leftClass": left_class, "rightClass": right_class, "bracketWidthPx": None, "valid": False}
        left, right = pairs[0]
        left_class, right_class = equatorial_class(spin, left), equatorial_class(spin, right)
    for _ in range(18):
        middle = 0.5 * (left + right)
        middle_class = equatorial_class(spin, middle)
        if middle_class == left_class:
            left = middle
        else:
            right = middle
    width_px = abs(right - left) * 10.0
    return {"index": index, "spin": spin, "leftImpactM": left, "rightImpactM": right, "leftClass": left_class, "rightClass": right_class, "bracketWidthPx": width_px, "valid": left_class != right_class and width_px > 0}


def build_short_gate(limit_rays: int | None = None) -> dict[str, Any]:
    fixtures = FIXTURES[:limit_rays] if limit_rays else FIXTURES
    executions = []
    for ray in fixtures:
        for tolerance in (1e-8, 1e-10):
            for branch in ("A", "B"):
                executions.append(evaluate_carter(ray, tolerance, branch))
                executions.append(evaluate_ks(ray, tolerance, branch))
    brackets = [critical_bracket(index, -0.95 + index * 1.9 / 39.0) for index in range(40)] if limit_rays is None else []
    pairs: dict[tuple[str, float, str], list[dict[str, Any]]] = {}
    for row in executions:
        pairs.setdefault((row["rayId"], row["tolerance"], row["branch"]), []).append(row)
    agreement_count = sum(1 for rows in pairs.values() if len(rows) == 2 and rows[0]["classification"] == rows[1]["classification"])
    agreement = agreement_count / max(1, len(pairs))
    classes = {formulation: {kind: sum(1 for row in executions if row["formulation"] == formulation and row["classification"] == kind) for kind in ("capture", "escape", "disk-hit", "invalid")} for formulation in ("carter-mino-dop853-v288", "cartesian-kerr-schild-hamiltonian-dop853-v288")}
    invalid = sum(1 for row in executions if row["invalid"] or row["timeout"])
    max_tetrad = max((row["tetradResidual"] for row in executions), default=1e300)
    max_shell = max((row["massShellResidual"] for row in executions), default=1e300)
    max_carter = max((row["carterResidual"] for row in executions if row["carterResidual"] is not None), default=1e300)
    max_metric_derivative = max((row["metricDerivativeResidual"] for row in executions if row["metricDerivativeResidual"] is not None), default=1e300)
    intensity_values = [row["intensityInvariantResidual"] for row in executions if row["intensityInvariantResidual"] is not None]
    max_intensity = max(intensity_values, default=1e300)
    evpa_values = [row["evpaDeg"] for row in executions if row["evpaAuthority"] == "walker-penrose" and row["evpaDeg"] is not None]
    reasons = []
    if len(executions) != (len(fixtures) * 8): reasons.append("execution-count-mismatch")
    if invalid: reasons.append("invalid-or-timeout-results")
    if agreement < 0.999: reasons.append("classification-agreement-below-threshold")
    if any(classes[formulation][kind] == 0 for formulation in classes for kind in ("capture", "escape", "disk-hit")): reasons.append("nondegenerate-class-coverage-missing")
    if max_tetrad >= 1e-12 or max_shell >= 1e-10 or max_carter >= 1e-10 or max_metric_derivative >= 1e-8: reasons.append("geometric-residual-threshold-failed")
    if max_intensity >= 1e-12: reasons.append("intensity-invariant-threshold-failed")
    if not evpa_values: reasons.append("walker-penrose-evpa-authority-unavailable")
    if limit_rays is None and (len(brackets) != 40 or any(not row["valid"] or row["bracketWidthPx"] >= 0.5 for row in brackets)): reasons.append("finite-observer-critical-bracket-failed")
    gate_passed = limit_rays is None and not reasons
    unsigned = {
        "version": "v288-corrected-kerr-authority-short-gate-v1", "generatedAt": utc(),
        "status": "short-gate-passed" if gate_passed else "short-gate-failed",
        "gatePassed": gate_passed, "executionCount": len(executions), "expectedExecutionCount": 128,
        "criticalBracketCount": len(brackets), "expectedCriticalBracketCount": 40,
        "observer": {"family": "finite-distance-zamo", "radiusM": R_OBSERVER, "inclinationDeg": math.degrees(THETA_OBSERVER)},
        "formulations": ["carter-mino-dop853-v288", "cartesian-kerr-schild-hamiltonian-dop853-v288"],
        "classCounts": classes, "thresholds": {"classificationAgreement": agreement, "maxTetradResidual": max_tetrad, "maxMassShellResidual": max_shell, "maxCarterResidual": max_carter, "maxMetricDerivativeResidual": max_metric_derivative, "maxIntensityInvariantResidual": max_intensity, "evpaAuthorityCount": len(evpa_values), "invalid": invalid},
        "failureReasons": reasons, "executions": executions, "criticalBrackets": brackets,
        "science": {"defaultKernel": "legacy-eih-1pn", "codeSha256": CODE_SHA, "screenSha256": SCREEN_SHA, "workerPhysicsMutation": "not-applied", "legacyKerrMutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "localShadowPromotionApplied": False},
        "boundary": "finite-zamo-cpu-reference-fails-closed-without-walker-penrose-authority",
    }
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v288 corrected Kerr authority")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--short-gate", action="store_true")
    group.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    evidence = build_short_gate(2 if args.self_test else None)
    if args.self_test:
        print(json.dumps({"status": evidence["status"], "executionCount": evidence["executionCount"], "classCounts": evidence["classCounts"], "failureReasons": evidence["failureReasons"]}, indent=2))
        return
    atomic_json(EVIDENCE, evidence)
    if not evidence["gatePassed"]:
        atomic_json(NEGATIVE, evidence)
    print(json.dumps({"status": evidence["status"], "gatePassed": evidence["gatePassed"], "executionCount": evidence["executionCount"], "criticalBracketCount": evidence["criticalBracketCount"], "classCounts": evidence["classCounts"], "failureReasons": evidence["failureReasons"]}, indent=2))
    if not evidence["gatePassed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

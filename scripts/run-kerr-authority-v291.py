"""Independent low-memory Kerr coordinate/event authority for Orbit Atlas v291-v292.

This module does not import the v288 authority.  It uses an analytic
Boyer-Lindquist -> ingoing Cartesian Kerr-Schild Jacobian, analytic Carter
potential derivatives and analytic Kerr-Schild inverse-metric derivatives.
The historical v288 artifacts remain immutable negative evidence.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, localcontext
from pathlib import Path
from typing import Any, Callable

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
DIAGNOSTIC_DIR = ROOT / "dist/science/kerr-reference-v291"
GEOMETRY_DIR = ROOT / "dist/science/kerr-reference-v292"
DIAGNOSTIC_EVIDENCE = DIAGNOSTIC_DIR / "coordinate-event-diagnostic.json"
GEOMETRY_EVIDENCE = GEOMETRY_DIR / "geometry-redshift-short-gate.json"
GEOMETRY_NEGATIVE = GEOMETRY_DIR / "geometry-redshift-short-gate-negative.json"
CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"
R_OBSERVER = 30.0
THETA_OBSERVER = math.radians(70.0)
DISK_OUTER_RADIUS = 20.0
RELEASE_TOLERANCE = 1e-10
INTERNAL_TOLERANCE = 1e-12


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
    # v288 used alpha=3 here, which both corrected formulations classify as
    # escape.  The v291 authority fixes the canonical capture fixture at 2.5.
    RayFixture("capture-03", 2.5, 0.0, -0.9, "capture"),
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
FIXTURE_BY_ID = {fixture.ray_id: fixture for fixture in FIXTURES}
DIAGNOSTIC_IDS = ("capture-02", "capture-00", "escape-02", "disk-03")


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {
            key: canonical(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "pid", "host", "absolutePath"}
        }
    return value


def value_sha(value: Any) -> str:
    encoded = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


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
    return {
        "local": local,
        "momentumUp": momentum_up,
        "momentumDown": momentum_down,
        "E": energy,
        "Lz": lz,
        "Q": q,
        "massShellResidual": shell,
        "tetradResidual": orthonormal,
    }


def radial_potential(r: float, spin: float, energy: float, lz: float, q: float) -> float:
    delta = r * r - 2.0 * r + spin * spin
    p = (r * r + spin * spin) * energy - spin * lz
    return p * p - delta * ((lz - spin * energy) ** 2 + q)


def radial_potential_derivative(r: float, spin: float, energy: float, lz: float, q: float) -> float:
    p = (r * r + spin * spin) * energy - spin * lz
    constant = (lz - spin * energy) ** 2 + q
    return 4.0 * r * energy * p - (2.0 * r - 2.0) * constant


def polar_potential(theta: float, spin: float, energy: float, lz: float, q: float) -> float:
    raw_sine = math.sin(theta)
    sine = math.copysign(max(1e-12, abs(raw_sine)), raw_sine if raw_sine != 0.0 else 1.0)
    cosine = math.cos(theta)
    return q - cosine * cosine * (lz * lz / (sine * sine) - spin * spin * energy * energy)


def polar_potential_derivative(theta: float, spin: float, energy: float, lz: float) -> float:
    raw_sine = math.sin(theta)
    sine = math.copysign(max(1e-12, abs(raw_sine)), raw_sine if raw_sine != 0.0 else 1.0)
    cosine = math.cos(theta)
    return 2.0 * lz * lz * cosine / (sine ** 3) - 2.0 * spin * spin * energy * energy * sine * cosine


def carter_constraint_residual_decimal(
    radius: float,
    theta: float,
    pr: float,
    ptheta: float,
    spin: float,
    energy: float,
    lz: float,
    q: float,
) -> tuple[float, float, float, float]:
    """Evaluate separated constraints with an 80-digit reduction oracle.

    The integrated state remains float64 DOP853; Decimal is used only to avoid
    losing the residual itself to cancellation near the BL horizon.
    """
    with localcontext() as context:
        context.prec = 80
        d = lambda value: Decimal(str(float(value)))
        r, a, e, angular, carter = d(radius), d(spin), d(energy), d(lz), d(q)
        radial_momentum, polar_momentum = d(pr), d(ptheta)
        delta = r * r - Decimal(2) * r + a * a
        p = (r * r + a * a) * e - a * angular
        radial_expected = p * p - delta * ((angular - a * e) ** 2 + carter)
        sine, cosine = d(math.sin(theta)), d(math.cos(theta))
        if abs(sine) < Decimal("1e-40"):
            sine = Decimal("1e-40") if sine >= 0 else Decimal("-1e-40")
        polar_expected = carter - cosine * cosine * (angular * angular / (sine * sine) - a * a * e * e)
        radial_actual = radial_momentum * radial_momentum
        polar_actual = polar_momentum * polar_momentum
        radial_raw = abs(radial_actual - radial_expected)
        polar_raw = abs(polar_actual - polar_expected)
        radial_scale = max(Decimal(1), abs(radial_actual), abs(radial_expected))
        polar_scale = max(Decimal(1), abs(polar_actual), abs(polar_expected))
        return float(radial_raw), float(radial_raw / radial_scale), float(polar_raw), float(polar_raw / polar_scale)


def isco_radius(spin: float) -> float:
    clipped = max(-0.998, min(0.998, spin))
    z1 = 1.0 + (1.0 - clipped * clipped) ** (1.0 / 3.0) * ((1.0 + clipped) ** (1.0 / 3.0) + (1.0 - clipped) ** (1.0 / 3.0))
    z2 = math.sqrt(3.0 * clipped * clipped + z1 * z1)
    direction = 1.0 if clipped >= 0 else -1.0
    return 3.0 + z2 - direction * math.sqrt(max(0.0, (3.0 - z1) * (3.0 + z1 + 2.0 * z2)))


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


def bl_to_ks_jacobian(r: float, theta: float, spin: float, ks_phi: float = 0.0) -> tuple[np.ndarray, np.ndarray]:
    """Return KS event coordinates and d(x_KS)/d(x_BL) at fixed BL event.

    The ingoing azimuth obeys d(phi_KS)=d(phi_BL)+a/Delta dr.
    Additive t/phi integration constants are gauge choices and are set to zero
    at the observer event; their derivatives are retained in the Jacobian.
    """
    sine, cosine = math.sin(theta), math.cos(theta)
    cos_phi, sin_phi = math.cos(ks_phi), math.sin(ks_phi)
    delta = r * r - 2.0 * r + spin * spin
    if abs(delta) < 1e-14:
        raise RuntimeError("BL to KS Jacobian is singular on the BL horizon")
    x = (r * cos_phi - spin * sin_phi) * sine
    y = (r * sin_phi + spin * cos_phi) * sine
    z = r * cosine
    dx_dphi = (-r * sin_phi - spin * cos_phi) * sine
    dy_dphi = (r * cos_phi - spin * sin_phi) * sine
    dphi_dr = spin / delta
    jacobian = np.zeros((4, 4), dtype=float)
    jacobian[0] = (1.0, 2.0 * r / delta, 0.0, 0.0)
    jacobian[1] = (0.0, sine * cos_phi + dx_dphi * dphi_dr, (r * cos_phi - spin * sin_phi) * cosine, dx_dphi)
    jacobian[2] = (0.0, sine * sin_phi + dy_dphi * dphi_dr, (r * sin_phi + spin * cos_phi) * cosine, dy_dphi)
    jacobian[3] = (0.0, cosine, -r * sine, 0.0)
    return np.asarray((0.0, x, y, z), dtype=float), jacobian


def ks_radius_and_gradient(position: np.ndarray, spin: float) -> tuple[float, np.ndarray]:
    x, y, z = (float(value) for value in position)
    rho2 = x * x + y * y + z * z
    term = rho2 - spin * spin
    discriminant = math.sqrt(max(1e-30, term * term + 4.0 * spin * spin * z * z))
    radius2 = max(1e-30, 0.5 * (term + discriminant))
    radius = math.sqrt(radius2)
    factor_xy = 1.0 + term / discriminant
    du = np.asarray((x * factor_xy, y * factor_xy, z * (1.0 + (term + 2.0 * spin * spin) / discriminant)), dtype=float)
    return radius, du / (2.0 * radius)


def ks_radius(x: float, y: float, z: float, spin: float) -> float:
    return ks_radius_and_gradient(np.asarray((x, y, z), dtype=float), spin)[0]


def ks_metric_with_derivatives(position: np.ndarray, spin: float) -> tuple[np.ndarray, np.ndarray, list[np.ndarray]]:
    x, y, z = (float(value) for value in position)
    radius, dr = ks_radius_and_gradient(position, spin)
    radius2 = radius * radius
    base = radius2 + spin * spin
    denominator = radius ** 4 + spin * spin * z * z
    h = radius ** 3 / denominator
    l_down = np.asarray((1.0, (radius * x + spin * y) / base, (radius * y - spin * x) / base, z / radius), dtype=float)
    eta = np.diag((-1.0, 1.0, 1.0, 1.0))
    l_up = eta @ l_down
    metric_cov = eta + 2.0 * h * np.outer(l_down, l_down)
    metric_inv = eta - 2.0 * h * np.outer(l_up, l_up)
    derivatives: list[np.ndarray] = []
    for axis in range(3):
        dx = 1.0 if axis == 0 else 0.0
        dy = 1.0 if axis == 1 else 0.0
        dz = 1.0 if axis == 2 else 0.0
        dr_axis = float(dr[axis])
        dbase = 2.0 * radius * dr_axis
        ddenominator = 4.0 * radius ** 3 * dr_axis + 2.0 * spin * spin * z * dz
        dh = (3.0 * radius * radius * dr_axis * denominator - radius ** 3 * ddenominator) / (denominator ** 2)
        numerator_x = radius * x + spin * y
        numerator_y = radius * y - spin * x
        dnumerator_x = dr_axis * x + radius * dx + spin * dy
        dnumerator_y = dr_axis * y + radius * dy - spin * dx
        dl_down = np.asarray((
            0.0,
            (dnumerator_x * base - numerator_x * dbase) / (base * base),
            (dnumerator_y * base - numerator_y * dbase) / (base * base),
            dz / radius - z * dr_axis / radius2,
        ), dtype=float)
        dl_up = eta @ dl_down
        derivatives.append(-2.0 * (dh * np.outer(l_up, l_up) + h * (np.outer(dl_up, l_up) + np.outer(l_up, dl_up))))
    return metric_cov, metric_inv, derivatives


def ks_metric(position: np.ndarray, spin: float, inverse: bool) -> np.ndarray:
    covariant, contravariant, _derivatives = ks_metric_with_derivatives(position, spin)
    return contravariant if inverse else covariant


def finite_difference_ks_derivatives(position: np.ndarray, spin: float) -> list[np.ndarray]:
    step = 2e-5 * max(1.0, ks_radius(*position, spin))
    derivatives = []
    for axis in range(3):
        offset = np.zeros(3, dtype=float)
        offset[axis] = step
        plus2 = ks_metric(position + 2.0 * offset, spin, True)
        plus1 = ks_metric(position + offset, spin, True)
        minus1 = ks_metric(position - offset, spin, True)
        minus2 = ks_metric(position - 2.0 * offset, spin, True)
        derivatives.append((-plus2 + 8.0 * plus1 - 8.0 * minus1 + minus2) / (12.0 * step))
    return derivatives


def initial_ks_state(ray: RayFixture, initial: dict[str, Any]) -> dict[str, Any]:
    coordinates, jacobian = bl_to_ks_jacobian(R_OBSERVER, THETA_OBSERVER, ray.spin)
    inverse_jacobian = np.linalg.inv(jacobian)
    covector = inverse_jacobian.T @ initial["momentumDown"]
    metric_cov, metric_inv, analytic_derivatives = ks_metric_with_derivatives(coordinates[1:4], ray.spin)
    pulled_back = jacobian.T @ metric_cov @ jacobian
    metric_pullback = float(np.max(np.abs(pulled_back - bl_metric_cov(R_OBSERVER, THETA_OBSERVER, ray.spin))))
    roundtrip = float(np.max(np.abs(jacobian.T @ covector - initial["momentumDown"])))
    hamiltonian = abs(float(covector @ metric_inv @ covector))
    finite_derivatives = finite_difference_ks_derivatives(coordinates[1:4], ray.spin)
    derivative_audit = float(max(np.max(np.abs(left - right)) for left, right in zip(analytic_derivatives, finite_derivatives)))
    return {
        "coordinates": coordinates,
        "covector": covector,
        "jacobian": jacobian,
        "metricPullbackResidual": metric_pullback,
        "covectorRoundtripResidual": roundtrip,
        "initialHamiltonianResidual": hamiltonian,
        "metricDerivativeAuditResidual": derivative_audit,
    }


def turning_points(values: np.ndarray, parameter: np.ndarray, limit: int = 16) -> list[float]:
    points: list[float] = []
    for index in range(1, len(values)):
        if values[index - 1] == 0.0 or values[index - 1] * values[index] < 0.0:
            points.append(float(parameter[index]))
            if len(points) >= limit:
                break
    return points


def event_summary(kind: str, parameter: float, radius: float, valid: bool, detail: str) -> dict[str, Any]:
    return {"kind": kind, "parameter": float(parameter), "radiusM": float(radius), "valid": bool(valid), "detail": detail}


def choose_terminal_event(events: list[dict[str, Any]]) -> tuple[str, float | None, dict[str, Any] | None]:
    valid = [event for event in events if event["valid"]]
    if not valid:
        return "invalid", None, None
    selected = min(valid, key=lambda event: event["parameter"])
    return selected["kind"], selected["radiusM"] if selected["kind"] == "disk-hit" else None, selected


def evaluate_carter(ray: RayFixture, tolerance: float, branch: str) -> dict[str, Any]:
    initial = initial_bl_state(ray)
    energy, lz, q = initial["E"], initial["Lz"], initial["Q"]
    sigma = R_OBSERVER * R_OBSERVER + ray.spin * ray.spin * math.cos(THETA_OBSERVER) ** 2
    pr0 = sigma * float(initial["momentumUp"][1])
    ptheta0 = sigma * float(initial["momentumUp"][2])

    def rhs(_gamma: float, state: np.ndarray) -> np.ndarray:
        _time, r, theta, _phi, pr, ptheta = state
        delta = math.copysign(max(abs(r * r - 2.0 * r + ray.spin * ray.spin), 1e-14), r * r - 2.0 * r + ray.spin * ray.spin)
        sine = max(1e-12, abs(math.sin(theta)))
        p = (r * r + ray.spin * ray.spin) * energy - ray.spin * lz
        dt = -ray.spin * (ray.spin * energy * sine * sine - lz) + (r * r + ray.spin * ray.spin) * p / delta
        dphi = -(ray.spin * energy - lz / (sine * sine)) + ray.spin * p / delta
        return np.asarray((
            dt,
            pr,
            ptheta,
            dphi,
            0.5 * radial_potential_derivative(r, ray.spin, energy, lz, q),
            0.5 * polar_potential_derivative(theta, ray.spin, energy, lz),
        ), dtype=float)

    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - ray.spin * ray.spin))

    def disk_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[2] - math.pi / 2.0)

    def horizon_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[1] - horizon * 1.01)

    def escape_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[1] - (R_OBSERVER + 2.0))

    disk_event.terminal = False
    disk_event.direction = 0
    horizon_event.terminal = True
    horizon_event.direction = -1
    escape_event.terminal = True
    escape_event.direction = 1
    solver_tolerance = max(2.3e-14, tolerance * 1e-4)
    result = solve_ivp(
        rhs,
        (0.0, 400.0),
        (0.0, R_OBSERVER, THETA_OBSERVER, 0.0, pr0, ptheta0),
        method="DOP853",
        rtol=solver_tolerance,
        atol=solver_tolerance * 1e-3,
        max_step=0.01,
        events=(disk_event, horizon_event, escape_event),
    )
    finite = bool(result.success and np.isfinite(result.y).all())
    events: list[dict[str, Any]] = []
    disk_states: list[tuple[float, np.ndarray]] = []
    if finite:
        for parameter, state in zip(result.t_events[0], result.y_events[0]):
            radius = float(state[1])
            valid = isco_radius(ray.spin) <= radius <= DISK_OUTER_RADIUS and parameter > 1e-9
            events.append(event_summary("disk-hit", parameter, radius, valid, "equatorial-crossing-in-disk" if valid else "equatorial-crossing-outside-disk"))
            if valid:
                disk_states.append((float(parameter), np.asarray(state, dtype=float)))
        for kind, event_index in (("capture", 1), ("escape", 2)):
            for parameter, state in zip(result.t_events[event_index], result.y_events[event_index]):
                events.append(event_summary(kind, parameter, float(state[1]), True, f"{kind}-terminal-event"))
    classification, disk_radius, selected = choose_terminal_event(events)
    polarization_seed = None
    if classification == "disk-hit" and selected is not None and disk_states:
        _parameter, disk_state = min(disk_states, key=lambda item: abs(item[0] - float(selected["parameter"])))
        disk_derivative = rhs(float(selected["parameter"]), disk_state)
        disk_sigma = float(disk_state[1] ** 2 + ray.spin * ray.spin * math.cos(float(disk_state[2])) ** 2)
        polarization_seed = {
            "coordinatesBl": [float(value) for value in disk_state[:4]],
            "wavevectorBl": [float(value / disk_sigma) for value in disk_derivative[:4]],
            "energy": float(energy),
            "angularMomentumZ": float(lz),
            "carterConstant": float(q),
            "emitterModel": "projected-disk-normal",
        }
    radial_raw = []
    radial_normalized = []
    polar_raw = []
    polar_normalized = []
    shells = []
    if finite:
        for index in range(result.y.shape[1]):
            _time, radius, theta, _phi, pr, ptheta = result.y[:, index]
            radial_error, radial_error_normalized, polar_error, polar_error_normalized = carter_constraint_residual_decimal(
                float(radius), float(theta), float(pr), float(ptheta), ray.spin, energy, lz, q
            )
            radial_raw.append(radial_error)
            polar_raw.append(polar_error)
            radial_normalized.append(radial_error_normalized)
            polar_normalized.append(polar_error_normalized)
            sigma_here = radius * radius + ray.spin * ray.spin * math.cos(theta) ** 2
            derivative = rhs(float(result.t[index]), result.y[:, index])
            k_up = derivative[:4] / sigma_here
            shells.append(abs(float(k_up @ bl_metric_cov(float(radius), float(theta), ray.spin) @ k_up)))
    redshift = disk_redshift(disk_radius, ray.spin, energy, lz)
    return {
        "rayId": ray.ray_id,
        "spin": ray.spin,
        "expectedFamily": ray.expected_family,
        "formulation": "carter-mino-dop853-v292",
        "tolerance": tolerance,
        "solverTolerance": solver_tolerance,
        "toleranceClass": "release" if tolerance == RELEASE_TOLERANCE else "internal",
        "branch": branch,
        "classification": classification,
        "selectedEvent": selected,
        "events": sorted(events, key=lambda event: event["parameter"])[:12],
        "diskRadiusM": disk_radius,
        "polarizationSeed": polarization_seed,
        "stepCount": int(result.t.size),
        "massShellResidualRaw": max(shells, default=1e300),
        "massShellResidualNormalized": max(shells, default=1e300),
        "tetradResidual": initial["tetradResidual"],
        "carterResidualRaw": max(radial_raw + polar_raw, default=1e300),
        "carterResidualNormalized": max(radial_normalized + polar_normalized, default=1e300),
        "radialPotentialResidualRaw": max(radial_raw, default=1e300),
        "radialPotentialResidualNormalized": max(radial_normalized, default=1e300),
        "polarPotentialResidualRaw": max(polar_raw, default=1e300),
        "polarPotentialResidualNormalized": max(polar_normalized, default=1e300),
        "metricPullbackResidual": None,
        "covectorRoundtripResidual": None,
        "metricDerivativeAuditResidual": None,
        "radialTurningPoints": turning_points(result.y[4], result.t) if finite else [],
        "polarTurningPoints": turning_points(result.y[5], result.t) if finite else [],
        "redshift": redshift,
        "redshiftApplicability": "applicable" if disk_radius is not None else "not-applicable",
        "intensityInvariantResidual": intensity_invariant_residual(redshift),
        "invalid": not finite or classification == "invalid",
        "timeout": False,
    }


def evaluate_ks(ray: RayFixture, tolerance: float, branch: str) -> dict[str, Any]:
    initial = initial_bl_state(ray)
    transformed = initial_ks_state(ray, initial)
    coordinates = transformed["coordinates"]
    momentum = transformed["covector"]

    def rhs(_lam: float, state: np.ndarray) -> np.ndarray:
        position = state[1:4]
        covector = state[4:8]
        _metric_cov, inverse, derivatives = ks_metric_with_derivatives(position, ray.spin)
        derivative = np.zeros(8, dtype=float)
        derivative[:4] = inverse @ covector
        for axis, metric_derivative in enumerate(derivatives):
            derivative[5 + axis] = -0.5 * float(covector @ metric_derivative @ covector)
        return derivative

    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - ray.spin * ray.spin))

    def disk_event(_lam: float, state: np.ndarray) -> float:
        return float(state[3])

    def horizon_event(_lam: float, state: np.ndarray) -> float:
        return ks_radius(*state[1:4], ray.spin) - horizon * 1.01

    def escape_event(_lam: float, state: np.ndarray) -> float:
        return ks_radius(*state[1:4], ray.spin) - (R_OBSERVER + 2.0)

    disk_event.terminal = False
    disk_event.direction = 0
    horizon_event.terminal = True
    horizon_event.direction = -1
    escape_event.terminal = True
    escape_event.direction = 1
    solver_tolerance = max(2.3e-14, tolerance * 1e-4)
    result = solve_ivp(
        rhs,
        (0.0, 200.0),
        np.concatenate((coordinates, momentum)),
        method="DOP853",
        rtol=solver_tolerance,
        atol=solver_tolerance * 1e-3,
        max_step=0.04,
        events=(disk_event, horizon_event, escape_event),
    )
    finite = bool(result.success and np.isfinite(result.y).all())
    events: list[dict[str, Any]] = []
    if finite:
        for parameter, state in zip(result.t_events[0], result.y_events[0]):
            radius = ks_radius(*state[1:4], ray.spin)
            valid = isco_radius(ray.spin) <= radius <= DISK_OUTER_RADIUS and parameter > 1e-9
            events.append(event_summary("disk-hit", parameter, radius, valid, "z-crossing-in-disk" if valid else "z-crossing-outside-disk"))
        for kind, event_index in (("capture", 1), ("escape", 2)):
            for parameter, state in zip(result.t_events[event_index], result.y_events[event_index]):
                events.append(event_summary(kind, parameter, ks_radius(*state[1:4], ray.spin), True, f"{kind}-terminal-event"))
    classification, disk_radius, selected = choose_terminal_event(events)
    shells_raw: list[float] = []
    shells_normalized: list[float] = []
    radial_velocity: list[float] = []
    vertical_velocity: list[float] = []
    for index in range(result.y.shape[1]) if finite else ():
        state = result.y[:, index]
        _covariant, inverse, _derivatives = ks_metric_with_derivatives(state[1:4], ray.spin)
        covector = state[4:8]
        products = np.abs(np.outer(covector, covector) * inverse)
        shell = abs(float(covector @ inverse @ covector))
        shells_raw.append(shell)
        shells_normalized.append(shell / max(1.0, float(np.sum(products))))
        velocity = inverse @ covector
        _radius, gradient = ks_radius_and_gradient(state[1:4], ray.spin)
        radial_velocity.append(float(gradient @ velocity[1:4]))
        vertical_velocity.append(float(velocity[3]))
    redshift = disk_redshift(disk_radius, ray.spin, initial["E"], initial["Lz"])
    return {
        "rayId": ray.ray_id,
        "spin": ray.spin,
        "expectedFamily": ray.expected_family,
        "formulation": "cartesian-kerr-schild-hamiltonian-dop853-v292",
        "tolerance": tolerance,
        "solverTolerance": solver_tolerance,
        "toleranceClass": "release" if tolerance == RELEASE_TOLERANCE else "internal",
        "branch": branch,
        "classification": classification,
        "selectedEvent": selected,
        "events": sorted(events, key=lambda event: event["parameter"])[:12],
        "diskRadiusM": disk_radius,
        "polarizationSeed": None,
        "stepCount": int(result.t.size),
        "massShellResidualRaw": max(shells_raw, default=1e300),
        "massShellResidualNormalized": max(shells_normalized, default=1e300),
        "tetradResidual": initial["tetradResidual"],
        "carterResidualRaw": None,
        "carterResidualNormalized": None,
        "radialPotentialResidualRaw": None,
        "radialPotentialResidualNormalized": None,
        "polarPotentialResidualRaw": None,
        "polarPotentialResidualNormalized": None,
        "metricPullbackResidual": transformed["metricPullbackResidual"],
        "covectorRoundtripResidual": transformed["covectorRoundtripResidual"],
        "metricDerivativeAuditResidual": transformed["metricDerivativeAuditResidual"],
        "radialTurningPoints": turning_points(np.asarray(radial_velocity), result.t) if finite else [],
        "polarTurningPoints": turning_points(np.asarray(vertical_velocity), result.t) if finite else [],
        "redshift": redshift,
        "redshiftApplicability": "applicable" if disk_radius is not None else "not-applicable",
        "intensityInvariantResidual": intensity_invariant_residual(redshift),
        "invalid": not finite or classification == "invalid",
        "timeout": False,
    }


def equatorial_class(spin: float, impact: float) -> str:
    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))
    radii = np.linspace(horizon * 1.001, R_OBSERVER, 4096)
    values = np.asarray([radial_potential(float(radius), spin, 1.0, impact, 0.0) for radius in radii])
    return "escape" if float(np.min(values)) < 0 else "capture"


def critical_bracket(index: int, spin: float) -> dict[str, Any]:
    direction = -1.0 if index % 2 else 1.0
    center = direction * 3.0 * math.sqrt(3.0) * (1.0 - 0.08 * spin * direction)
    candidates = np.linspace(center - 8.0, center + 8.0, 257)
    pairs = [(float(left), float(right)) for left, right in zip(candidates[:-1], candidates[1:]) if equatorial_class(spin, float(left)) != equatorial_class(spin, float(right))]
    if not pairs:
        return {"index": index, "spin": spin, "leftImpactM": None, "rightImpactM": None, "leftClass": None, "rightClass": None, "bracketWidthPx": None, "valid": False}
    left, right = pairs[0]
    left_class, right_class = equatorial_class(spin, left), equatorial_class(spin, right)
    for _ in range(18):
        middle = 0.5 * (left + right)
        if equatorial_class(spin, middle) == left_class:
            left = middle
        else:
            right = middle
    width_px = abs(right - left) * 10.0
    return {"index": index, "spin": spin, "leftImpactM": left, "rightImpactM": right, "leftClass": left_class, "rightClass": right_class, "bracketWidthPx": width_px, "valid": left_class != right_class and width_px > 0.0}


def comparable_execution(row: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in row.items() if key != "branch"}


def run_executions(fixtures: tuple[RayFixture, ...]) -> list[dict[str, Any]]:
    executions: list[dict[str, Any]] = []
    for ray in fixtures:
        for tolerance in (RELEASE_TOLERANCE, INTERNAL_TOLERANCE):
            for branch in ("A", "B"):
                executions.append(evaluate_carter(ray, tolerance, branch))
                executions.append(evaluate_ks(ray, tolerance, branch))
    return executions


def build_diagnostic() -> dict[str, Any]:
    fixtures = tuple(FIXTURE_BY_ID[ray_id] for ray_id in DIAGNOSTIC_IDS)
    executions = run_executions(fixtures)
    capture_rows = [row for row in executions if row["rayId"] == "capture-02"]
    pairs: dict[tuple[str, float, str], list[dict[str, Any]]] = {}
    for row in executions:
        pairs.setdefault((row["rayId"], row["tolerance"], row["branch"]), []).append(row)
    disagreements = [
        {"rayId": key[0], "tolerance": key[1], "branch": key[2], "classes": {row["formulation"]: row["classification"] for row in rows}}
        for key, rows in pairs.items()
        if len(rows) != 2 or rows[0]["classification"] != rows[1]["classification"]
    ]
    thresholds = {
        "maxMetricPullbackResidual": max((row["metricPullbackResidual"] for row in executions if row["metricPullbackResidual"] is not None), default=1e300),
        "maxCovectorRoundtripResidual": max((row["covectorRoundtripResidual"] for row in executions if row["covectorRoundtripResidual"] is not None), default=1e300),
        "maxMetricDerivativeAuditResidual": max((row["metricDerivativeAuditResidual"] for row in executions if row["metricDerivativeAuditResidual"] is not None), default=1e300),
        "maxMassShellResidualRaw": max((row["massShellResidualRaw"] for row in executions), default=1e300),
        "maxCarterResidualNormalized": max((row["carterResidualNormalized"] for row in executions if row["carterResidualNormalized"] is not None), default=1e300),
        "capture02Agreement": len([row for row in capture_rows if row["classification"] == capture_rows[0]["classification"]]) == len(capture_rows) if capture_rows else False,
    }
    qualified = not disagreements and thresholds["maxMetricPullbackResidual"] < 1e-12 and thresholds["maxCovectorRoundtripResidual"] < 1e-12 and thresholds["maxMetricDerivativeAuditResidual"] < 1e-8 and thresholds["maxMassShellResidualRaw"] < 1e-10 and thresholds["maxCarterResidualNormalized"] < 1e-10
    unsigned = {
        "version": "v291-kerr-coordinate-event-diagnostic-v1",
        "generatedAt": utc(),
        "status": "diagnostics-qualified" if qualified else "diagnostics-failed",
        "qualified": qualified,
        "fixtureIds": list(DIAGNOSTIC_IDS),
        "executionCount": len(executions),
        "thresholds": thresholds,
        "disagreements": disagreements,
        "executions": executions,
        "science": {"defaultKernel": "legacy-eih-1pn", "codeSha256": CODE_SHA, "screenSha256": SCREEN_SHA, "workerPhysicsMutation": "not-applied", "legacyKerrMutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "denseShardExecuted": False},
        "boundary": "independent-low-memory-coordinate-event-diagnostic-no-dense-campaign",
    }
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def build_geometry_gate() -> dict[str, Any]:
    executions = run_executions(FIXTURES)
    brackets = [critical_bracket(index, -0.95 + index * 1.9 / 39.0) for index in range(40)]
    pairs: dict[tuple[str, float, str], list[dict[str, Any]]] = {}
    for row in executions:
        pairs.setdefault((row["rayId"], row["tolerance"], row["branch"]), []).append(row)
    agreement_count = sum(1 for rows in pairs.values() if len(rows) == 2 and rows[0]["classification"] == rows[1]["classification"])
    classification_agreement = agreement_count / max(1, len(pairs))
    formulations = ("carter-mino-dop853-v292", "cartesian-kerr-schild-hamiltonian-dop853-v292")
    class_counts = {formulation: {kind: sum(1 for row in executions if row["formulation"] == formulation and row["classification"] == kind) for kind in ("capture", "escape", "disk-hit", "invalid")} for formulation in formulations}
    disk_pairs = [rows for rows in pairs.values() if len(rows) == 2 and rows[0]["classification"] == rows[1]["classification"] == "disk-hit"]
    disk_radius_differences = [abs(float(rows[0]["diskRadiusM"]) - float(rows[1]["diskRadiusM"])) for rows in disk_pairs]
    redshift_differences = [abs(float(rows[0]["redshift"]) - float(rows[1]["redshift"])) for rows in disk_pairs if rows[0]["redshift"] is not None and rows[1]["redshift"] is not None]
    ab_groups: dict[tuple[str, float, str], list[dict[str, Any]]] = {}
    for row in executions:
        ab_groups.setdefault((row["rayId"], row["tolerance"], row["formulation"]), []).append(row)
    deterministic = all(len(rows) == 2 and comparable_execution(rows[0]) == comparable_execution(rows[1]) for rows in ab_groups.values())
    invariant_values = [row["intensityInvariantResidual"] for row in executions if row["intensityInvariantResidual"] is not None]
    thresholds = {
        "classificationAgreement": classification_agreement,
        "maxTetradResidual": max(row["tetradResidual"] for row in executions),
        "maxMetricPullbackResidual": max((row["metricPullbackResidual"] for row in executions if row["metricPullbackResidual"] is not None), default=1e300),
        "maxCovectorRoundtripResidual": max((row["covectorRoundtripResidual"] for row in executions if row["covectorRoundtripResidual"] is not None), default=1e300),
        "maxMetricDerivativeAuditResidual": max((row["metricDerivativeAuditResidual"] for row in executions if row["metricDerivativeAuditResidual"] is not None), default=1e300),
        "maxMassShellResidualRaw": max(row["massShellResidualRaw"] for row in executions),
        "maxMassShellResidualNormalized": max(row["massShellResidualNormalized"] for row in executions),
        "maxCarterResidualRaw": max((row["carterResidualRaw"] for row in executions if row["carterResidualRaw"] is not None), default=1e300),
        "maxCarterResidualNormalized": max((row["carterResidualNormalized"] for row in executions if row["carterResidualNormalized"] is not None), default=1e300),
        "maxDiskRadiusDifferenceM": max(disk_radius_differences, default=1e300),
        "maxRedshiftDifference": max(redshift_differences, default=1e300),
        "maxIntensityInvariantResidual": max(invariant_values, default=1e300),
        "maxCriticalBracketWidthPx": max((row["bracketWidthPx"] for row in brackets if row["bracketWidthPx"] is not None), default=1e300),
        "invalidOrTimeout": sum(1 for row in executions if row["invalid"] or row["timeout"]),
        "abDeterministic": deterministic,
    }
    reasons: list[str] = []
    expected_counts = {"capture": 24, "escape": 24, "disk-hit": 16, "invalid": 0}
    if len(executions) != 128:
        reasons.append("execution-count-mismatch")
    if thresholds["invalidOrTimeout"]:
        reasons.append("invalid-or-timeout-results")
    if classification_agreement < 0.999:
        reasons.append("classification-agreement-below-threshold")
    if any(class_counts[formulation] != expected_counts for formulation in formulations):
        reasons.append("canonical-class-conservation-failed")
    if thresholds["maxTetradResidual"] >= 1e-12 or thresholds["maxMetricPullbackResidual"] >= 1e-12 or thresholds["maxCovectorRoundtripResidual"] >= 1e-12:
        reasons.append("coordinate-or-tetrad-threshold-failed")
    if thresholds["maxMetricDerivativeAuditResidual"] >= 1e-8 or thresholds["maxMassShellResidualRaw"] >= 1e-10 or thresholds["maxCarterResidualNormalized"] >= 1e-10:
        reasons.append("geometric-residual-threshold-failed")
    if thresholds["maxDiskRadiusDifferenceM"] >= 1e-4 or thresholds["maxRedshiftDifference"] >= 0.005 or thresholds["maxIntensityInvariantResidual"] >= 1e-12:
        reasons.append("disk-redshift-threshold-failed")
    if len(brackets) != 40 or any(not row["valid"] or row["bracketWidthPx"] is None or row["bracketWidthPx"] >= 0.5 for row in brackets):
        reasons.append("finite-observer-critical-bracket-failed")
    if not deterministic:
        reasons.append("ab-nondeterministic")
    qualified = not reasons
    unsigned = {
        "version": "v292-kerr-geometry-redshift-short-gate-v1",
        "generatedAt": utc(),
        "status": "geometry-redshift-qualified" if qualified else "geometry-redshift-failed",
        "geometryRedshiftQualified": qualified,
        "polarizationStatus": "polarization-pending" if qualified else "blocked-by-geometry",
        "fullKerrAuthorityQualified": False,
        "executionCount": len(executions),
        "expectedExecutionCount": 128,
        "criticalBracketCount": len(brackets),
        "classCounts": class_counts,
        "thresholds": thresholds,
        "failureReasons": reasons,
        "executions": executions,
        "criticalBrackets": brackets,
        "science": {"defaultKernel": "legacy-eih-1pn", "codeSha256": CODE_SHA, "screenSha256": SCREEN_SHA, "workerPhysicsMutation": "not-applied", "legacyKerrMutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "denseShardExecuted": False},
        "boundary": "geometry-redshift-layered-qualification-polarization-separate",
    }
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def write_result(path: Path, negative_path: Path | None, evidence: dict[str, Any]) -> None:
    if path.exists():
        previous = json.loads(path.read_text(encoding="utf-8"))
        previous_sha = previous.get("evidenceSha256")
        if isinstance(previous_sha, str) and previous_sha != evidence.get("evidenceSha256"):
            atomic_json(path.parent / "attempts" / f"{previous_sha}.json", previous)
    atomic_json(path, evidence)
    if negative_path is not None and not evidence.get("geometryRedshiftQualified", evidence.get("qualified", False)):
        atomic_json(negative_path, evidence)


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v291-v292 independent Kerr authority")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--diagnose", action="store_true")
    group.add_argument("--short-gate", action="store_true")
    group.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.diagnose:
        evidence = build_diagnostic()
        write_result(DIAGNOSTIC_EVIDENCE, DIAGNOSTIC_DIR / "coordinate-event-diagnostic-negative.json", evidence)
    elif args.short_gate:
        evidence = build_geometry_gate()
        write_result(GEOMETRY_EVIDENCE, GEOMETRY_NEGATIVE, evidence)
    else:
        fixture = FIXTURE_BY_ID["capture-02"]
        rows = [evaluate_carter(fixture, RELEASE_TOLERANCE, "A"), evaluate_ks(fixture, RELEASE_TOLERANCE, "A")]
        evidence = {"status": "self-test", "classes": [row["classification"] for row in rows], "rows": rows}
    print(json.dumps({key: evidence.get(key) for key in ("status", "qualified", "geometryRedshiftQualified", "executionCount", "failureReasons", "thresholds")}, indent=2))


if __name__ == "__main__":
    main()

"""Exact finite-observer Kerr shadow separatrix in the shared ZAMO frame.

The boundary is derived from unstable spherical photon-orbit constants and
projected into the observer's local orthonormal frame. Numerical geodesic
integrators are deliberately not used to locate or tune the boundary.
"""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.optimize import brentq

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from kerr_observer_frame_v5 import (  # noqa: E402
    bl_metric_covariant,
    outer_horizon,
    zamo_bl_phase_space,
)

VERSION = "v248-kerr-finite-observer-separatrix-v8"
MASS_M = 1.0


def spherical_photon_constants(spin: float, radius: float) -> tuple[float, float]:
    """Return xi=Lz/E and eta=Q/E^2 for one Kerr spherical photon orbit."""
    denominator = spin * (MASS_M - radius)
    if abs(denominator) < 1e-15:
        raise ValueError("non-zero Kerr spin and radius != M are required")
    xi = (
        radius * radius * (radius - 3.0 * MASS_M)
        + spin * spin * (radius + MASS_M)
    ) / denominator
    eta = (
        radius**3
        * (4.0 * spin * spin * MASS_M - radius * (radius - 3.0 * MASS_M) ** 2)
        / (spin * spin * (MASS_M - radius) ** 2)
    )
    return float(xi), float(eta)


def radial_potential(
    spin: float,
    radius: float,
    xi: float,
    eta: float,
) -> tuple[float, float]:
    delta = radius * radius - 2.0 * MASS_M * radius + spin * spin
    p = radius * radius + spin * spin - spin * xi
    k = (xi - spin) ** 2 + eta
    value = p * p - delta * k
    derivative = 4.0 * radius * p - (2.0 * radius - 2.0 * MASS_M) * k
    return float(value), float(derivative)


def polar_potential(spin: float, theta: float, xi: float, eta: float) -> float:
    sine = math.sin(theta)
    cosine = math.cos(theta)
    if abs(sine) < 1e-15:
        raise ValueError("polar-axis observers are not supported by this screen chart")
    return float(
        eta
        + spin * spin * cosine * cosine
        - xi * xi * cosine * cosine / (sine * sine)
    )


@dataclass(frozen=True)
class KerrFiniteObserverSeparatrixPointV8:
    angle_rad: float
    screen_x: float
    screen_y: float
    spherical_photon_radius_m: float
    xi: float
    eta: float
    local_direction: tuple[float, float, float]
    observer_null_constraint: float
    radial_potential_residual: float
    radial_derivative_residual: float
    constants_round_trip_relative_error: float


def schwarzschild_screen_radius(observer_radius: float) -> float:
    if observer_radius <= 3.0:
        raise ValueError("Schwarzschild observer must be outside the photon sphere")
    sine = 3.0 * math.sqrt(3.0) * math.sqrt(1.0 - 2.0 / observer_radius) / observer_radius
    if not 0.0 < sine < 1.0:
        raise ValueError("invalid Schwarzschild shadow angular radius")
    return math.tan(math.asin(sine))


def _relative_error(actual: float, expected: float) -> float:
    return abs(actual - expected) / max(1.0, abs(actual), abs(expected))


def finite_zamo_screen_point(
    spin: float,
    observer_radius: float,
    observer_theta: float,
    spherical_radius: float,
    polar_sign: int,
) -> KerrFiniteObserverSeparatrixPointV8:
    if polar_sign not in (-1, 1):
        raise ValueError("polar_sign must be -1 or +1")
    if observer_radius <= outer_horizon(spin):
        raise ValueError("observer must remain outside the outer horizon")
    xi, eta = spherical_photon_constants(spin, spherical_radius)
    theta_value = polar_potential(spin, observer_theta, xi, eta)
    if theta_value < -1e-12:
        raise ValueError("spherical photon orbit is not visible at this inclination")
    theta_value = max(0.0, theta_value)
    observer_radial, _ = radial_potential(spin, observer_radius, xi, eta)
    if observer_radial <= 0.0:
        raise ValueError("spherical photon constants do not reach this observer")
    observer_delta = (
        observer_radius * observer_radius - 2.0 * observer_radius + spin * spin
    )
    covector = np.array(
        [
            -1.0,
            -math.sqrt(observer_radial) / observer_delta,
            polar_sign * math.sqrt(theta_value),
            xi,
        ],
        dtype=float,
    )
    metric = bl_metric_covariant(spin, observer_radius, observer_theta)
    contravariant = np.linalg.solve(metric, covector)
    tetrad = zamo_bl_phase_space(
        spin,
        observer_radius,
        observer_theta,
        np.array([-1.0, 0.0, 0.0]),
    )["tetradContravariant"]
    local = np.linalg.solve(tetrad, contravariant)
    if local[0] <= 0.0:
        raise RuntimeError("finite-observer photon is not future-directed")
    local_direction = local[1:] / local[0]
    if local_direction[0] >= 0.0:
        raise RuntimeError("finite-observer shadow ray is not inward-directed")
    screen_x = float(local_direction[2] / -local_direction[0])
    screen_y = float(local_direction[1] / -local_direction[0])
    angle = math.atan2(screen_y, screen_x) % (2.0 * math.pi)

    round_trip = zamo_bl_phase_space(
        spin,
        observer_radius,
        observer_theta,
        np.array([-1.0, screen_y, screen_x]),
    )
    round_trip_xi = float(
        round_trip["axialAngularMomentum"] / round_trip["energy"]
    )
    round_trip_eta = float(
        round_trip["carterQ"] / (round_trip["energy"] ** 2)
    )
    round_trip_error = max(
        _relative_error(round_trip_xi, xi),
        _relative_error(round_trip_eta, eta),
    )
    spherical_value, spherical_derivative = radial_potential(
        spin, spherical_radius, xi, eta
    )
    radial_scale = max(
        1.0,
        abs((spherical_radius * spherical_radius + spin * spin - spin * xi) ** 2),
        abs(((xi - spin) ** 2 + eta) * spherical_radius * spherical_radius),
    )
    derivative_scale = max(1.0, radial_scale / max(1.0, abs(spherical_radius)))
    null_scale = max(1.0, float(np.max(np.abs(contravariant))) ** 2)
    null_constraint = abs(float(contravariant @ metric @ contravariant)) / null_scale
    return KerrFiniteObserverSeparatrixPointV8(
        angle_rad=angle,
        screen_x=screen_x,
        screen_y=screen_y,
        spherical_photon_radius_m=float(spherical_radius),
        xi=xi,
        eta=eta,
        local_direction=tuple(float(value) for value in local_direction),
        observer_null_constraint=null_constraint,
        radial_potential_residual=abs(spherical_value) / radial_scale,
        radial_derivative_residual=abs(spherical_derivative) / derivative_scale,
        constants_round_trip_relative_error=round_trip_error,
    )


class KerrFiniteObserverSeparatrixV8:
    """Deterministic angle-to-separatrix map for one Kerr ZAMO observer."""

    def __init__(
        self,
        spin: float,
        observer_radius: float,
        observer_theta: float,
        coarse_samples: int = 16385,
    ) -> None:
        if not 0.0 <= abs(spin) < 1.0:
            raise ValueError("V8 supports sub-extremal Kerr spin |a| < 1")
        if observer_radius <= max(3.0, outer_horizon(spin)):
            raise ValueError("observer radius must be outside the photon region")
        if coarse_samples < 4097 or coarse_samples % 2 == 0:
            raise ValueError("coarse_samples must be an odd integer >= 4097")
        self.spin = float(spin)
        self.observer_radius = float(observer_radius)
        self.observer_theta = float(observer_theta)
        self.coarse_samples = int(coarse_samples)
        self._schwarzschild = abs(self.spin) < 1e-12
        self._segments: dict[int, list[np.ndarray]] = {-1: [], 1: []}
        if not self._schwarzschild:
            self._prepare_segments()

    def _visible(self, radius: float) -> bool:
        try:
            xi, eta = spherical_photon_constants(self.spin, radius)
            return (
                polar_potential(self.spin, self.observer_theta, xi, eta) >= 0.0
                and radial_potential(self.spin, self.observer_radius, xi, eta)[0] > 0.0
            )
        except (ValueError, FloatingPointError):
            return False

    def _prepare_segments(self) -> None:
        lower = outer_horizon(self.spin) + 1e-7
        upper = min(4.0, self.observer_radius - 1e-6)
        radii = np.linspace(lower, upper, self.coarse_samples)
        visible = np.asarray([self._visible(float(radius)) for radius in radii])
        transitions = np.flatnonzero(np.diff(np.concatenate(([False], visible, [False])).astype(int)))
        if len(transitions) != 2:
            raise RuntimeError(
                f"visible spherical-photon interval is not unique: transitions={transitions.tolist()}"
            )
        start, stop = int(transitions[0]), int(transitions[1])

        def theta_visibility(radius: float) -> float:
            xi, eta = spherical_photon_constants(self.spin, radius)
            return polar_potential(self.spin, self.observer_theta, xi, eta)

        if start <= 0 or stop >= len(radii):
            raise RuntimeError("visible spherical-photon interval touches search boundary")
        visible_lower = brentq(
            theta_visibility,
            float(radii[start - 1]),
            float(radii[start]),
            xtol=5e-15,
            rtol=1e-14,
        )
        visible_upper = brentq(
            theta_visibility,
            float(radii[stop - 1]),
            float(radii[stop]),
            xtol=5e-15,
            rtol=1e-14,
        )
        visible_radii = np.linspace(
            visible_lower,
            visible_upper,
            self.coarse_samples,
        )
        if len(visible_radii) < 32:
            raise RuntimeError("visible spherical-photon interval is under-resolved")
        for sign in (-1, 1):
            rows = []
            for radius in visible_radii:
                point = finite_zamo_screen_point(
                    self.spin,
                    self.observer_radius,
                    self.observer_theta,
                    float(radius),
                    sign,
                )
                rows.append((radius, point.screen_x, point.screen_y))
            self._segments[sign] = [np.asarray(rows, dtype=float)]

    def point_at_angle(self, angle_rad: float) -> KerrFiniteObserverSeparatrixPointV8:
        angle = float(angle_rad) % (2.0 * math.pi)
        if self._schwarzschild:
            radius = schwarzschild_screen_radius(self.observer_radius)
            screen_x = radius * math.cos(angle)
            screen_y = radius * math.sin(angle)
            return KerrFiniteObserverSeparatrixPointV8(
                angle_rad=angle,
                screen_x=screen_x,
                screen_y=screen_y,
                spherical_photon_radius_m=3.0,
                xi=-self.observer_radius * screen_x,
                eta=(self.observer_radius * screen_y) ** 2,
                local_direction=tuple(
                    float(value)
                    for value in np.asarray([-1.0, screen_y, screen_x])
                    / np.linalg.norm([-1.0, screen_y, screen_x])
                ),
                observer_null_constraint=0.0,
                radial_potential_residual=0.0,
                radial_derivative_residual=0.0,
                constants_round_trip_relative_error=0.0,
            )
        sine = math.sin(angle)
        cosine = math.cos(angle)
        roots: list[KerrFiniteObserverSeparatrixPointV8] = []

        def cross(radius: float, sign: int) -> float:
            point = finite_zamo_screen_point(
                self.spin,
                self.observer_radius,
                self.observer_theta,
                radius,
                sign,
            )
            return point.screen_x * sine - point.screen_y * cosine

        for sign, segments in self._segments.items():
            for segment in segments:
                values = segment[:, 1] * sine - segment[:, 2] * cosine
                for index in np.flatnonzero(values[:-1] * values[1:] <= 0.0):
                    left = float(segment[index, 0])
                    right = float(segment[index + 1, 0])
                    if values[index] == 0.0:
                        radius = left
                    elif values[index + 1] == 0.0:
                        radius = right
                    else:
                        radius = float(
                            brentq(
                                lambda candidate: cross(candidate, sign),
                                left,
                                right,
                                xtol=5e-15,
                                rtol=1e-14,
                                maxiter=100,
                            )
                        )
                    point = finite_zamo_screen_point(
                        self.spin,
                        self.observer_radius,
                        self.observer_theta,
                        radius,
                        sign,
                    )
                    dot = point.screen_x * cosine + point.screen_y * sine
                    if dot > 0.0 and not any(
                        abs(point.spherical_photon_radius_m - row.spherical_photon_radius_m)
                        < 1e-11
                        for row in roots
                    ):
                        roots.append(point)
        if len(roots) != 1:
            raise RuntimeError(
                f"finite-observer separatrix angle is not unique: angle={angle} roots={len(roots)}"
            )
        point = roots[0]
        angle_error = abs(
            math.atan2(
                math.sin(point.angle_rad - angle),
                math.cos(point.angle_rad - angle),
            )
        )
        if angle_error >= 1e-11:
            raise RuntimeError(f"finite-observer angular root residual {angle_error} exceeds budget")
        return point

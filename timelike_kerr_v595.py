"""Three-dimensional timelike Kerr reference candidate for Orbit Atlas v595.

This module is intentionally additive.  It does not replace the browser
teaching kernel or the existing null-ray reference.  The equations below use
canonical Boyer-Lindquist phase-space coordinates

    (t, r, theta, phi, p_t, p_r, p_theta, p_phi)

and Hamilton's equations for ``H = 1/2 g^{mu nu} p_mu p_nu`` in geometric
units ``G = c = M = mu = 1``.  Timelike trajectories satisfy ``H = -1/2``.

The primary lane uses hand-derived inverse-metric derivatives with DOP853.
The independent lane reconstructs the inverse metric from the covariant Kerr
metric, takes complex-step derivatives, and integrates with RK45.  Neither
lane grants production scientific authority; both produce reference-candidate
evidence only.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import math
from typing import Any, Callable, Iterable, Mapping

import mpmath as mp
import numpy as np
from scipy.integrate import OdeSolution, solve_ivp


VERSION = "v595-timelike-kerr-reference-candidate-v1"
SCHEMA_VERSION = "orbit-timelike-kerr-reference/v595"
STATE_ORDER = (
    "t",
    "r",
    "theta",
    "phi",
    "p_t",
    "p_r",
    "p_theta",
    "p_phi",
)
INVARIANT_ORDER = (
    "energy",
    "axialAngularMomentum",
    "carterQ",
    "hamiltonian",
    "massShellResidual",
)
ANALYTIC_ANCHOR_NAMES = (
    "schwarzschild-circular-r10",
    "kerr-prograde-circular-a0.7-r10",
    "kerr-retrograde-circular-a0.7-r10",
)
REFERENCE_BOUNDARY = (
    "offline-vacuum-test-particle-reference-candidate-not-production-"
    "scientific-authority-not-measured-not-gpu-not-radiative-transfer"
)


class TimelikeKerrError(ValueError):
    """Raised when a timelike Kerr request or result fails closed."""


@dataclass(frozen=True)
class SolverSettings:
    method: str = "DOP853"
    relative_tolerance: float = 2.0e-10
    absolute_tolerance: float = 2.0e-12
    max_step: float = 0.25


@dataclass(frozen=True)
class FixtureSpec:
    name: str
    description: str
    spin: float
    energy: float
    axial_angular_momentum: float
    carter_q: float
    initial_radius: float
    initial_theta: float
    radial_sign: int
    polar_sign: int
    affine_end: float
    escape_radius: float
    expected_classification: str
    required_turning_coordinate: str
    roundtrip_affine: float


@dataclass
class IntegrationResult:
    spec: FixtureSpec
    settings: SolverSettings
    implementation: str
    affine: np.ndarray
    state: np.ndarray
    dense_solution: OdeSolution
    status: str
    message: str
    function_evaluations: int
    radial_turning_affine: np.ndarray
    polar_turning_affine: np.ndarray
    invariant_series: np.ndarray


# All four fixtures are genuinely non-equatorial.  Capture and escape are
# radially monotone by design, so their continuity gate is exercised at a
# polar turning point.  Bound and scatter must exhibit a radial turning point.
FIXTURES: Mapping[str, FixtureSpec] = {
    "bound": FixtureSpec(
        name="bound",
        description="inclined bound orbit between radial periapsis and apoapsis",
        spin=0.7,
        energy=0.95,
        axial_angular_momentum=3.0,
        carter_q=2.0,
        initial_radius=12.0,
        initial_theta=1.2,
        radial_sign=-1,
        polar_sign=1,
        affine_end=260.0,
        escape_radius=60.0,
        expected_classification="bound",
        required_turning_coordinate="r",
        roundtrip_affine=8.0,
    ),
    "capture": FixtureSpec(
        name="capture",
        description="inclined low-angular-momentum incoming plunge",
        spin=0.7,
        energy=1.02,
        axial_angular_momentum=1.5,
        carter_q=1.0,
        initial_radius=15.0,
        initial_theta=2.14,
        radial_sign=-1,
        polar_sign=1,
        affine_end=120.0,
        escape_radius=60.0,
        expected_classification="capture",
        required_turning_coordinate="theta",
        roundtrip_affine=4.0,
    ),
    "scatter": FixtureSpec(
        name="scatter",
        description="inclined unbound encounter with an explicit radial turning point",
        spin=0.7,
        energy=1.02,
        axial_angular_momentum=5.0,
        carter_q=2.0,
        initial_radius=30.0,
        initial_theta=1.3,
        radial_sign=-1,
        polar_sign=1,
        affine_end=360.0,
        escape_radius=40.0,
        expected_classification="scatter",
        required_turning_coordinate="r",
        roundtrip_affine=8.0,
    ),
    "escape": FixtureSpec(
        name="escape",
        description="inclined outward unbound trajectory without a prior radial encounter",
        spin=0.7,
        energy=1.02,
        axial_angular_momentum=3.0,
        carter_q=1.0,
        initial_radius=10.0,
        initial_theta=1.87,
        radial_sign=1,
        polar_sign=1,
        affine_end=240.0,
        escape_radius=40.0,
        expected_classification="escape",
        required_turning_coordinate="theta",
        roundtrip_affine=8.0,
    ),
}


THRESHOLDS: Mapping[str, float] = {
    "energyDrift": 5.0e-13,
    "axialAngularMomentumDrift": 5.0e-13,
    "carterQDrift": 2.0e-7,
    "hamiltonianDrift": 2.0e-8,
    "massShellResidual": 4.0e-8,
    "stepConvergenceScaledError": 2.0e-6,
    "reverseTimeScaledError": 2.0e-7,
    "turningPointMidpointResidual": 2.0e-7,
    "independentTrajectoryScaledError": 2.0e-5,
    "highPrecisionInvariantDifference": 2.0e-12,
    "analyticAnchorInvariantResidual": 5.0e-12,
    "analyticAnchorEquilibriumResidual": 5.0e-11,
    "analyticAnchorOrbitStability": 2.0e-8,
    "metricInverseResidual": 2.0e-13,
    "metricDerivativeResidual": 2.0e-11,
}


def outer_horizon(spin: float) -> float:
    _validate_spin(spin)
    return 1.0 + math.sqrt(1.0 - spin * spin)


def _validate_spin(spin: float) -> None:
    if not math.isfinite(spin) or abs(spin) >= 1.0:
        raise TimelikeKerrError("spin-must-be-finite-and-subextremal")


def _validate_position(spin: float, radius: float, theta: float) -> None:
    _validate_spin(spin)
    if not math.isfinite(radius) or radius <= outer_horizon(spin):
        raise TimelikeKerrError("state-radius-must-be-outside-outer-horizon")
    if not math.isfinite(theta) or theta <= 1.0e-8 or theta >= math.pi - 1.0e-8:
        raise TimelikeKerrError("state-theta-must-avoid-boyer-lindquist-axis")


def inverse_metric(spin: float, radius: float, theta: float) -> np.ndarray:
    """Return the contravariant Kerr metric in Boyer-Lindquist coordinates."""
    _validate_position(spin, float(radius), float(theta))
    return _inverse_metric_unchecked(spin, radius, theta)


def _inverse_metric_unchecked(
    spin: float, radius: complex | float, theta: complex | float
) -> np.ndarray:
    sin_theta = np.sin(theta)
    cos_theta = np.cos(theta)
    sin2 = sin_theta * sin_theta
    sigma = radius * radius + spin * spin * cos_theta * cos_theta
    delta = radius * radius - 2.0 * radius + spin * spin
    big_a = (radius * radius + spin * spin) ** 2 - spin * spin * delta * sin2
    dtype = np.result_type(radius, theta, float)
    metric = np.zeros((4, 4), dtype=dtype)
    denominator = sigma * delta
    metric[0, 0] = -big_a / denominator
    metric[0, 3] = metric[3, 0] = -2.0 * spin * radius / denominator
    metric[1, 1] = delta / sigma
    metric[2, 2] = 1.0 / sigma
    metric[3, 3] = (delta - spin * spin * sin2) / (
        denominator * sin2
    )
    return metric


def covariant_metric_reference(
    spin: float, radius: complex | float, theta: complex | float
) -> np.ndarray:
    """Independently construct the covariant metric for the reference lane."""
    sin_theta = np.sin(theta)
    cos_theta = np.cos(theta)
    sin2 = sin_theta * sin_theta
    sigma = radius * radius + spin * spin * cos_theta * cos_theta
    delta = radius * radius - 2.0 * radius + spin * spin
    big_a = (radius * radius + spin * spin) ** 2 - spin * spin * delta * sin2
    dtype = np.result_type(radius, theta, float)
    metric = np.zeros((4, 4), dtype=dtype)
    metric[0, 0] = -(1.0 - 2.0 * radius / sigma)
    metric[0, 3] = metric[3, 0] = -2.0 * spin * radius * sin2 / sigma
    metric[1, 1] = sigma / delta
    metric[2, 2] = sigma
    metric[3, 3] = big_a * sin2 / sigma
    return metric


def inverse_metric_reference(
    spin: float, radius: complex | float, theta: complex | float
) -> np.ndarray:
    return np.linalg.inv(covariant_metric_reference(spin, radius, theta))


def inverse_metric_derivatives(
    spin: float, radius: float, theta: float
) -> tuple[np.ndarray, np.ndarray]:
    """Hand-derived ``(partial_r g^-1, partial_theta g^-1)`` tensors."""
    _validate_position(spin, radius, theta)
    a2 = spin * spin
    sin_theta = math.sin(theta)
    cos_theta = math.cos(theta)
    sin2 = sin_theta * sin_theta
    sigma = radius * radius + a2 * cos_theta * cos_theta
    delta = radius * radius - 2.0 * radius + a2
    radial_block = radius * radius + a2
    big_a = radial_block * radial_block - a2 * delta * sin2

    sigma_r = 2.0 * radius
    sigma_theta = -2.0 * a2 * sin_theta * cos_theta
    delta_r = 2.0 * radius - 2.0
    big_a_r = 4.0 * radius * radial_block - a2 * delta_r * sin2
    big_a_theta = -2.0 * a2 * delta * sin_theta * cos_theta

    denominator = sigma * delta
    denominator_r = sigma_r * delta + sigma * delta_r
    denominator_theta = sigma_theta * delta
    denominator2 = denominator * denominator

    radial = np.zeros((4, 4), dtype=float)
    polar = np.zeros((4, 4), dtype=float)

    radial[0, 0] = -(
        big_a_r * denominator - big_a * denominator_r
    ) / denominator2
    polar[0, 0] = -(
        big_a_theta * denominator - big_a * denominator_theta
    ) / denominator2

    radial[0, 3] = radial[3, 0] = -2.0 * spin * (
        denominator - radius * denominator_r
    ) / denominator2
    polar[0, 3] = polar[3, 0] = (
        2.0 * spin * radius * denominator_theta / denominator2
    )

    sigma2 = sigma * sigma
    radial[1, 1] = (delta_r * sigma - delta * sigma_r) / sigma2
    polar[1, 1] = -delta * sigma_theta / sigma2
    radial[2, 2] = -sigma_r / sigma2
    polar[2, 2] = -sigma_theta / sigma2

    numerator = delta - a2 * sin2
    numerator_r = delta_r
    numerator_theta = -2.0 * a2 * sin_theta * cos_theta
    phi_denominator = denominator * sin2
    phi_denominator_r = denominator_r * sin2
    phi_denominator_theta = (
        denominator_theta * sin2
        + 2.0 * denominator * sin_theta * cos_theta
    )
    phi_denominator2 = phi_denominator * phi_denominator
    radial[3, 3] = (
        numerator_r * phi_denominator - numerator * phi_denominator_r
    ) / phi_denominator2
    polar[3, 3] = (
        numerator_theta * phi_denominator - numerator * phi_denominator_theta
    ) / phi_denominator2
    return radial, polar


def inverse_metric_reference_derivatives(
    spin: float, radius: float, theta: float, step: float = 1.0e-20
) -> tuple[np.ndarray, np.ndarray]:
    """Complex-step derivatives of an independently inverted covariant metric."""
    if step <= 0.0 or not math.isfinite(step):
        raise TimelikeKerrError("complex-step-must-be-finite-and-positive")
    radial = np.imag(inverse_metric_reference(spin, radius + 1j * step, theta)) / step
    polar = np.imag(inverse_metric_reference(spin, radius, theta + 1j * step)) / step
    return np.asarray(radial, dtype=float), np.asarray(polar, dtype=float)


def hamiltonian(spin: float, state: Iterable[float]) -> float:
    vector = _state_vector(state)
    metric = inverse_metric(spin, float(vector[1]), float(vector[2]))
    momentum = vector[4:]
    return float(0.5 * momentum @ metric @ momentum)


def timelike_carter_q(spin: float, state: Iterable[float]) -> float:
    vector = _state_vector(state)
    theta = float(vector[2])
    energy = -float(vector[4])
    p_theta = float(vector[6])
    axial = float(vector[7])
    sin2 = math.sin(theta) ** 2
    cos2 = math.cos(theta) ** 2
    return float(
        p_theta * p_theta
        + cos2 * (spin * spin * (1.0 - energy * energy) + axial * axial / sin2)
    )


def invariants(spin: float, state: Iterable[float]) -> np.ndarray:
    vector = _state_vector(state)
    value_h = hamiltonian(spin, vector)
    return np.asarray(
        [
            -float(vector[4]),
            float(vector[7]),
            timelike_carter_q(spin, vector),
            value_h,
            2.0 * value_h + 1.0,
        ],
        dtype=float,
    )


def _state_vector(state: Iterable[float]) -> np.ndarray:
    vector = np.asarray(tuple(state), dtype=float)
    if vector.shape != (8,) or not np.all(np.isfinite(vector)):
        raise TimelikeKerrError("state-must-have-eight-finite-components")
    return vector


def hamiltonian_rhs(_: float, state: np.ndarray, spin: float) -> np.ndarray:
    vector = _state_vector(state)
    radius = float(vector[1])
    theta = float(vector[2])
    metric = inverse_metric(spin, radius, theta)
    metric_r, metric_theta = inverse_metric_derivatives(spin, radius, theta)
    momentum = vector[4:]
    derivative = np.zeros(8, dtype=float)
    derivative[:4] = metric @ momentum
    derivative[4] = 0.0
    derivative[5] = -0.5 * float(momentum @ metric_r @ momentum)
    derivative[6] = -0.5 * float(momentum @ metric_theta @ momentum)
    derivative[7] = 0.0
    return derivative


def hamiltonian_rhs_reference(_: float, state: np.ndarray, spin: float) -> np.ndarray:
    vector = _state_vector(state)
    radius = float(vector[1])
    theta = float(vector[2])
    _validate_position(spin, radius, theta)
    metric = np.asarray(inverse_metric_reference(spin, radius, theta), dtype=float)
    metric_r, metric_theta = inverse_metric_reference_derivatives(
        spin, radius, theta
    )
    momentum = vector[4:]
    derivative = np.zeros(8, dtype=float)
    derivative[:4] = metric @ momentum
    derivative[4] = 0.0
    derivative[5] = -0.5 * float(momentum @ metric_r @ momentum)
    derivative[6] = -0.5 * float(momentum @ metric_theta @ momentum)
    derivative[7] = 0.0
    return derivative


def timelike_radial_potential(
    radius: float, spin: float, energy: float, axial: float, carter_q: float
) -> float:
    delta = radius * radius - 2.0 * radius + spin * spin
    transport = energy * (radius * radius + spin * spin) - spin * axial
    return float(
        transport * transport
        - delta
        * (radius * radius + (axial - spin * energy) ** 2 + carter_q)
    )


def timelike_polar_potential(
    theta: float, spin: float, energy: float, axial: float, carter_q: float
) -> float:
    sin2 = math.sin(theta) ** 2
    cos2 = math.cos(theta) ** 2
    return float(
        carter_q
        - cos2 * (spin * spin * (1.0 - energy * energy) + axial * axial / sin2)
    )


def initial_state_from_constants(spec: FixtureSpec) -> np.ndarray:
    _validate_position(spec.spin, spec.initial_radius, spec.initial_theta)
    if spec.radial_sign not in (-1, 1) or spec.polar_sign not in (-1, 1):
        raise TimelikeKerrError(f"fixture-sign-invalid:{spec.name}")
    radial = timelike_radial_potential(
        spec.initial_radius,
        spec.spin,
        spec.energy,
        spec.axial_angular_momentum,
        spec.carter_q,
    )
    polar = timelike_polar_potential(
        spec.initial_theta,
        spec.spin,
        spec.energy,
        spec.axial_angular_momentum,
        spec.carter_q,
    )
    if radial <= 0.0 or polar <= 0.0:
        raise TimelikeKerrError(f"fixture-initial-potential-not-positive:{spec.name}")
    delta = (
        spec.initial_radius * spec.initial_radius
        - 2.0 * spec.initial_radius
        + spec.spin * spec.spin
    )
    state = np.asarray(
        [
            0.0,
            spec.initial_radius,
            spec.initial_theta,
            0.0,
            -spec.energy,
            spec.radial_sign * math.sqrt(radial) / delta,
            spec.polar_sign * math.sqrt(polar),
            spec.axial_angular_momentum,
        ],
        dtype=float,
    )
    if abs(hamiltonian(spec.spin, state) + 0.5) > 2.0e-12:
        raise TimelikeKerrError(f"fixture-mass-shell-construction-failed:{spec.name}")
    return state


def kerr_isco_radius(spin: float, *, prograde: bool) -> float:
    """Return the analytic equatorial Kerr ISCO radius for positive-mass Kerr."""
    _validate_spin(spin)
    spin_abs = abs(spin)
    z1 = 1.0 + (1.0 - spin_abs * spin_abs) ** (1.0 / 3.0) * (
        (1.0 + spin_abs) ** (1.0 / 3.0)
        + (1.0 - spin_abs) ** (1.0 / 3.0)
    )
    z2 = math.sqrt(3.0 * spin_abs * spin_abs + z1 * z1)
    correction = math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2))
    return float(3.0 + z2 - correction if prograde else 3.0 + z2 + correction)


def schwarzschild_circular_constants(radius: float) -> tuple[float, float]:
    """Analytic E and positive Lz for an equatorial Schwarzschild circle."""
    if not math.isfinite(radius) or radius <= 6.0:
        raise TimelikeKerrError("schwarzschild-circular-anchor-must-be-stable")
    energy = (radius - 2.0) / math.sqrt(radius * (radius - 3.0))
    axial = radius / math.sqrt(radius - 3.0)
    return float(energy), float(axial)


def kerr_circular_constants(
    spin: float, radius: float, *, prograde: bool
) -> tuple[float, float]:
    """Bardeen analytic E and Lz for an equatorial circular Kerr orbit."""
    _validate_spin(spin)
    isco = kerr_isco_radius(spin, prograde=prograde)
    if not math.isfinite(radius) or radius <= isco:
        raise TimelikeKerrError("kerr-circular-anchor-must-be-outside-isco")
    branch = 1.0 if prograde else -1.0
    root_radius = math.sqrt(radius)
    radial_32 = radius * root_radius
    radical = radial_32 - 3.0 * root_radius + 2.0 * branch * spin
    if radical <= 0.0:
        raise TimelikeKerrError("kerr-circular-anchor-radical-not-positive")
    denominator = radius**0.75 * math.sqrt(radical)
    energy = (radial_32 - 2.0 * root_radius + branch * spin) / denominator
    axial = branch * (
        radius * radius
        - 2.0 * branch * spin * root_radius
        + spin * spin
    ) / denominator
    return float(energy), float(axial)


def _circular_anchor_state(
    spin: float, radius: float, energy: float, axial: float
) -> np.ndarray:
    state = np.asarray(
        [0.0, radius, 0.5 * math.pi, 0.0, -energy, 0.0, 0.0, axial],
        dtype=float,
    )
    if not np.all(np.isfinite(state)):
        raise TimelikeKerrError("analytic-anchor-state-not-finite")
    return state


def _evaluate_circular_anchor(
    *,
    name: str,
    family: str,
    spin: float,
    radius: float,
    energy: float,
    axial: float,
    formula: str,
    orbit_affine: float = 64.0,
) -> dict[str, Any]:
    state = _circular_anchor_state(spin, radius, energy, axial)
    expected = np.asarray([energy, axial, 0.0, -0.5, 0.0], dtype=float)
    observed = invariants(spin, state)
    residuals = np.abs(observed - expected)
    rhs = hamiltonian_rhs(0.0, state, spin)
    equilibrium = {
        "radialVelocity": float(rhs[1]),
        "polarVelocity": float(rhs[2]),
        "radialMomentumDerivative": float(rhs[5]),
        "polarMomentumDerivative": float(rhs[6]),
    }
    equilibrium_residual = float(max(abs(value) for value in equilibrium.values()))
    solution = solve_ivp(
        hamiltonian_rhs,
        (0.0, orbit_affine),
        state,
        args=(spin,),
        method="DOP853",
        rtol=2.0e-12,
        atol=2.0e-14,
        max_step=0.1,
        dense_output=False,
    )
    if not solution.success or solution.y.shape[1] < 2 or not np.all(
        np.isfinite(solution.y)
    ):
        raise TimelikeKerrError(f"analytic-anchor-short-orbit-failed:{name}")
    radius_span = float(np.ptp(solution.y[1]))
    theta_span = float(np.ptp(solution.y[2]))
    max_radial_momentum = float(np.max(np.abs(solution.y[5])))
    max_polar_momentum = float(np.max(np.abs(solution.y[6])))
    invariant_residual = float(np.max(residuals))
    orbit_stability = max(
        radius_span,
        theta_span,
        max_radial_momentum,
        max_polar_momentum,
    )
    qualified = bool(
        invariant_residual <= THRESHOLDS["analyticAnchorInvariantResidual"]
        and equilibrium_residual <= THRESHOLDS["analyticAnchorEquilibriumResidual"]
        and orbit_stability <= THRESHOLDS["analyticAnchorOrbitStability"]
    )
    return {
        "name": name,
        "family": family,
        "formula": formula,
        "spin": spin,
        "radius": radius,
        "expected": _invariant_mapping(expected),
        "observed": _invariant_mapping(observed),
        "absoluteResidual": _invariant_mapping(residuals),
        "maxInvariantResidual": invariant_residual,
        "rhsEquilibrium": equilibrium,
        "maxRhsEquilibriumResidual": equilibrium_residual,
        "shortOrbit": {
            "method": "DOP853",
            "affineEnd": orbit_affine,
            "relativeTolerance": 2.0e-12,
            "absoluteTolerance": 2.0e-14,
            "maxStep": 0.1,
            "sampleCount": int(solution.t.size),
            "radiusSpan": radius_span,
            "thetaSpan": theta_span,
            "maxAbsoluteRadialMomentum": max_radial_momentum,
            "maxAbsolutePolarMomentum": max_polar_momentum,
            "maxStabilityResidual": orbit_stability,
        },
        "qualified": qualified,
    }


def build_analytic_anchors() -> dict[str, Any]:
    """Build exact Schwarzschild/Kerr circular-orbit reference anchors."""
    radius = 10.0
    spin = 0.7
    schwarzschild_energy, schwarzschild_axial = schwarzschild_circular_constants(
        radius
    )
    prograde_energy, prograde_axial = kerr_circular_constants(
        spin, radius, prograde=True
    )
    retrograde_energy, retrograde_axial = kerr_circular_constants(
        spin, radius, prograde=False
    )
    anchors = [
        _evaluate_circular_anchor(
            name=ANALYTIC_ANCHOR_NAMES[0],
            family="Schwarzschild-equatorial-circular-timelike",
            spin=0.0,
            radius=radius,
            energy=schwarzschild_energy,
            axial=schwarzschild_axial,
            formula="E=(r-2)/sqrt(r*(r-3));Lz=r/sqrt(r-3);Q=0;H=-1/2",
        ),
        _evaluate_circular_anchor(
            name=ANALYTIC_ANCHOR_NAMES[1],
            family="Kerr-prograde-equatorial-circular-timelike-Bardeen",
            spin=spin,
            radius=radius,
            energy=prograde_energy,
            axial=prograde_axial,
            formula="Bardeen-direct:E=(r^3/2-2r^1/2+a)/(r^3/4*sqrt(r^3/2-3r^1/2+2a));Q=0;H=-1/2",
        ),
        _evaluate_circular_anchor(
            name=ANALYTIC_ANCHOR_NAMES[2],
            family="Kerr-retrograde-equatorial-circular-timelike-Bardeen",
            spin=spin,
            radius=radius,
            energy=retrograde_energy,
            axial=retrograde_axial,
            formula="Bardeen-retrograde:E=(r^3/2-2r^1/2-a)/(r^3/4*sqrt(r^3/2-3r^1/2-2a));Q=0;H=-1/2",
        ),
    ]
    radii = {
        "schwarzschildOuterHorizonRadius": 2.0,
        "schwarzschildIscoRadius": 6.0,
        "kerrSpin": spin,
        "kerrOuterHorizonRadius": outer_horizon(spin),
        "kerrProgradeIscoRadius": kerr_isco_radius(spin, prograde=True),
        "kerrRetrogradeIscoRadius": kerr_isco_radius(spin, prograde=False),
        "anchorOrbitRadius": radius,
    }
    value = {
        "version": "v595-timelike-kerr-analytic-anchors-v1",
        "anchorNames": list(ANALYTIC_ANCHOR_NAMES),
        "anchorCount": len(anchors),
        "anchors": anchors,
        "analyticRadii": radii,
        "thresholds": {
            key: THRESHOLDS[key]
            for key in (
                "analyticAnchorInvariantResidual",
                "analyticAnchorEquilibriumResidual",
                "analyticAnchorOrbitStability",
            )
        },
        "qualified": all(anchor["qualified"] is True for anchor in anchors),
    }
    _assert_finite_json(value)
    return value


def _events(
    spec: FixtureSpec,
    rhs: Callable[[float, np.ndarray, float], np.ndarray],
) -> tuple[Callable[..., float], ...]:
    # Boyer-Lindquist coordinates become ill-conditioned at Delta=0.  A
    # finite, declared exterior stop is therefore part of this reference
    # candidate's contract; it is evidence of a plunge, not horizon-resolved
    # integration.
    capture_radius = outer_horizon(spec.spin) + 5.0e-2

    def captured(_: float, state: np.ndarray, __: float) -> float:
        return float(state[1] - capture_radius)

    captured.terminal = True  # type: ignore[attr-defined]
    captured.direction = -1.0  # type: ignore[attr-defined]

    def escaped(_: float, state: np.ndarray, __: float) -> float:
        return float(state[1] - spec.escape_radius)

    escaped.terminal = True  # type: ignore[attr-defined]
    escaped.direction = 1.0  # type: ignore[attr-defined]

    def radial_turning(affine: float, state: np.ndarray, spin: float) -> float:
        return float(rhs(affine, state, spin)[1])

    radial_turning.terminal = False  # type: ignore[attr-defined]
    radial_turning.direction = 0.0  # type: ignore[attr-defined]

    def polar_turning(affine: float, state: np.ndarray, spin: float) -> float:
        return float(rhs(affine, state, spin)[2])

    polar_turning.terminal = False  # type: ignore[attr-defined]
    polar_turning.direction = 0.0  # type: ignore[attr-defined]
    return captured, escaped, radial_turning, polar_turning


def integrate_fixture(
    spec: FixtureSpec,
    settings: SolverSettings | None = None,
    *,
    independent: bool = False,
    affine_end: float | None = None,
    initial_state: Iterable[float] | None = None,
    terminal_events: bool = True,
) -> IntegrationResult:
    settings = settings or SolverSettings()
    if settings.method not in {"DOP853", "RK45"}:
        raise TimelikeKerrError("solver-method-not-registered")
    if (
        settings.relative_tolerance <= 0.0
        or settings.absolute_tolerance <= 0.0
        or settings.max_step <= 0.0
    ):
        raise TimelikeKerrError("solver-settings-must-be-positive")
    end = spec.affine_end if affine_end is None else float(affine_end)
    if not math.isfinite(end) or end <= 0.0:
        raise TimelikeKerrError("affine-end-must-be-finite-and-positive")
    initial = (
        initial_state_from_constants(spec)
        if initial_state is None
        else _state_vector(initial_state)
    )
    rhs = hamiltonian_rhs_reference if independent else hamiltonian_rhs
    event_set = _events(spec, rhs)
    events = event_set if terminal_events else event_set[2:]
    solution = solve_ivp(
        rhs,
        (0.0, end),
        initial,
        args=(spec.spin,),
        method=settings.method,
        rtol=settings.relative_tolerance,
        atol=settings.absolute_tolerance,
        max_step=settings.max_step,
        dense_output=True,
        events=events,
    )
    if not solution.success or solution.sol is None or solution.y.shape[1] < 2:
        raise TimelikeKerrError(
            f"integration-failed:{spec.name}:{solution.message}"
        )
    if not np.all(np.isfinite(solution.y)):
        raise TimelikeKerrError(f"integration-non-finite:{spec.name}")
    if terminal_events:
        captured_events, escaped_events, radial_events, polar_events = solution.t_events
        if captured_events.size:
            status = "captured"
        elif escaped_events.size:
            status = "escaped"
        else:
            status = "affine-limit"
    else:
        radial_events, polar_events = solution.t_events
        status = "affine-limit"
    radial_events = radial_events[radial_events > 1.0e-8]
    polar_events = polar_events[polar_events > 1.0e-8]
    invariant_series = np.column_stack(
        [invariants(spec.spin, solution.y[:, index]) for index in range(solution.y.shape[1])]
    ).T
    return IntegrationResult(
        spec=spec,
        settings=settings,
        implementation=(
            "independent-covariant-inverse-complex-step-rk45"
            if independent
            else "analytic-inverse-metric-derivative-dop853"
        ),
        affine=np.asarray(solution.t, dtype=float),
        state=np.asarray(solution.y, dtype=float),
        dense_solution=solution.sol,
        status=status,
        message=str(solution.message),
        function_evaluations=int(solution.nfev),
        radial_turning_affine=np.asarray(radial_events, dtype=float),
        polar_turning_affine=np.asarray(polar_events, dtype=float),
        invariant_series=np.asarray(invariant_series, dtype=float),
    )


def _sample_result(result: IntegrationResult, count: int = 513) -> tuple[np.ndarray, np.ndarray]:
    affine = np.linspace(float(result.affine[0]), float(result.affine[-1]), count)
    state = np.asarray(result.dense_solution(affine), dtype=float)
    if state.shape != (8, count) or not np.all(np.isfinite(state)):
        raise TimelikeKerrError(f"dense-sampling-failed:{result.spec.name}")
    return affine, state


def _scaled_state_error(left: np.ndarray, right: np.ndarray) -> float:
    if left.shape != right.shape:
        raise TimelikeKerrError("state-comparison-shape-mismatch")
    scale = np.maximum(1.0, np.maximum(np.abs(left), np.abs(right)))
    # phi is an unwrapped coordinate, so direct comparison is intentional.
    return float(np.max(np.abs(left - right) / scale))


def _invariant_drift(result: IntegrationResult) -> dict[str, Any]:
    affine, state = _sample_result(result, 1025)
    series = np.column_stack(
        [invariants(result.spec.spin, state[:, index]) for index in range(state.shape[1])]
    ).T
    initial = series[0]
    absolute = np.max(np.abs(series - initial), axis=0)
    relative = absolute / np.maximum(1.0, np.abs(initial))
    mass_shell = float(np.max(np.abs(series[:, 4])))
    payload = {
        "sampleCount": int(affine.size),
        "computedFromTrajectory": True,
        "initial": _invariant_mapping(initial),
        "terminal": _invariant_mapping(series[-1]),
        "maxAbsoluteDrift": {
            "energy": float(absolute[0]),
            "axialAngularMomentum": float(absolute[1]),
            "carterQ": float(absolute[2]),
            "hamiltonian": float(absolute[3]),
        },
        "maxRelativeDrift": {
            "energy": float(relative[0]),
            "axialAngularMomentum": float(relative[1]),
            "carterQ": float(relative[2]),
            "hamiltonian": float(relative[3]),
        },
        "maxMassShellResidual": mass_shell,
    }
    payload["qualified"] = bool(
        payload["maxAbsoluteDrift"]["energy"] <= THRESHOLDS["energyDrift"]
        and payload["maxAbsoluteDrift"]["axialAngularMomentum"]
        <= THRESHOLDS["axialAngularMomentumDrift"]
        and payload["maxAbsoluteDrift"]["carterQ"]
        <= THRESHOLDS["carterQDrift"]
        and payload["maxAbsoluteDrift"]["hamiltonian"]
        <= THRESHOLDS["hamiltonianDrift"]
        and mass_shell <= THRESHOLDS["massShellResidual"]
    )
    return payload


def _invariant_mapping(values: Iterable[float]) -> dict[str, float]:
    vector = np.asarray(tuple(values), dtype=float)
    if vector.shape != (5,) or not np.all(np.isfinite(vector)):
        raise TimelikeKerrError("invariant-vector-invalid")
    return {name: float(vector[index]) for index, name in enumerate(INVARIANT_ORDER)}


def _classification(result: IntegrationResult) -> str:
    if result.status == "captured":
        return "capture"
    if result.status == "escaped" and result.radial_turning_affine.size:
        return "scatter"
    if result.status == "escaped":
        return "escape"
    if (
        result.status == "affine-limit"
        and result.spec.energy < 1.0
        and result.radial_turning_affine.size
    ):
        return "bound"
    return "unresolved"


def _step_convergence(spec: FixtureSpec) -> dict[str, Any]:
    # Tolerances are fixed; the decreasing max step isolates step-size
    # sensitivity from an otherwise changing error budget.
    runs = [
        integrate_fixture(
            spec,
            SolverSettings("DOP853", 1.0e-9, 1.0e-11, step),
        )
        for step in (1.0, 0.5, 0.25)
    ]
    common_end = min(float(run.affine[-1]) for run in runs) * (1.0 - 1.0e-9)
    affine = np.linspace(0.0, common_end, 401)
    states = [np.asarray(run.dense_solution(affine), dtype=float) for run in runs]
    coarse_medium = _scaled_state_error(states[0], states[1])
    medium_fine = _scaled_state_error(states[1], states[2])
    terminal_spread = float(
        max(run.affine[-1] for run in runs) - min(run.affine[-1] for run in runs)
    )
    qualified = bool(
        coarse_medium <= THRESHOLDS["stepConvergenceScaledError"]
        and medium_fine <= THRESHOLDS["stepConvergenceScaledError"]
        and medium_fine <= max(1.25 * coarse_medium, 5.0e-11)
        and all(_classification(run) == spec.expected_classification for run in runs)
    )
    return {
        "method": "DOP853",
        "relativeTolerance": 1.0e-9,
        "absoluteTolerance": 1.0e-11,
        "maxSteps": [1.0, 0.5, 0.25],
        "comparisonAffineEnd": common_end,
        "coarseToMediumScaledError": coarse_medium,
        "mediumToFineScaledError": medium_fine,
        "terminalAffineSpread": terminal_spread,
        "classifications": [_classification(run) for run in runs],
        "qualified": qualified,
    }


def _reverse_time_roundtrip(spec: FixtureSpec) -> dict[str, Any]:
    settings = SolverSettings("DOP853", 5.0e-11, 5.0e-13, 0.1)
    initial = initial_state_from_constants(spec)
    forward = integrate_fixture(
        spec,
        settings,
        affine_end=spec.roundtrip_affine,
        initial_state=initial,
        terminal_events=False,
    )
    terminal = np.asarray(forward.state[:, -1], dtype=float)
    reverse_solution = solve_ivp(
        hamiltonian_rhs,
        (spec.roundtrip_affine, 0.0),
        terminal,
        args=(spec.spin,),
        method="DOP853",
        rtol=settings.relative_tolerance,
        atol=settings.absolute_tolerance,
        max_step=settings.max_step,
    )
    if not reverse_solution.success or reverse_solution.y.shape[1] < 2:
        raise TimelikeKerrError(f"reverse-integration-failed:{spec.name}")
    recovered = np.asarray(reverse_solution.y[:, -1], dtype=float)
    error = _scaled_state_error(initial[:, None], recovered[:, None])
    invariant_error = float(
        np.max(np.abs(invariants(spec.spin, recovered) - invariants(spec.spin, initial)))
    )
    return {
        "forwardAffine": spec.roundtrip_affine,
        "forwardMethod": "DOP853",
        "reverseMethod": "DOP853-negative-time-span",
        "scaledStateError": error,
        "maxInvariantRecoveryError": invariant_error,
        "qualified": bool(error <= THRESHOLDS["reverseTimeScaledError"]),
    }


def _turning_point_continuity(result: IntegrationResult) -> dict[str, Any]:
    coordinate = result.spec.required_turning_coordinate
    events = (
        result.radial_turning_affine if coordinate == "r" else result.polar_turning_affine
    )
    if events.size == 0:
        return {
            "coordinate": coordinate,
            "eventCount": 0,
            "qualified": False,
            "reason": "required-turning-point-not-observed",
        }
    event_affine = float(events[0])
    epsilon = min(1.0e-4, event_affine * 0.1, (result.affine[-1] - event_affine) * 0.1)
    if epsilon <= 1.0e-10:
        return {
            "coordinate": coordinate,
            "eventCount": int(events.size),
            "qualified": False,
            "reason": "turning-point-too-close-to-integration-boundary",
        }
    before = np.asarray(result.dense_solution(event_affine - epsilon), dtype=float)
    at = np.asarray(result.dense_solution(event_affine), dtype=float)
    after = np.asarray(result.dense_solution(event_affine + epsilon), dtype=float)
    velocity_index = 1 if coordinate == "r" else 2
    momentum_index = 5 if coordinate == "r" else 6
    before_velocity = float(
        hamiltonian_rhs(event_affine - epsilon, before, result.spec.spin)[velocity_index]
    )
    at_velocity = float(
        hamiltonian_rhs(event_affine, at, result.spec.spin)[velocity_index]
    )
    after_velocity = float(
        hamiltonian_rhs(event_affine + epsilon, after, result.spec.spin)[velocity_index]
    )
    midpoint = 0.5 * (before + after)
    midpoint_residual = _scaled_state_error(midpoint[:, None], at[:, None])
    momentum_jump = float(abs(after[momentum_index] - before[momentum_index]))
    sign_change = bool(before_velocity * after_velocity < 0.0)
    qualified = bool(
        sign_change
        and abs(at_velocity) <= 2.0e-8
        and midpoint_residual <= THRESHOLDS["turningPointMidpointResidual"]
        and np.all(np.isfinite([momentum_jump, midpoint_residual]))
    )
    return {
        "coordinate": coordinate,
        "eventCount": int(events.size),
        "eventAffine": event_affine,
        "sampleHalfWidth": epsilon,
        "velocityBefore": before_velocity,
        "velocityAt": at_velocity,
        "velocityAfter": after_velocity,
        "conjugateMomentumBefore": float(before[momentum_index]),
        "conjugateMomentumAt": float(at[momentum_index]),
        "conjugateMomentumAfter": float(after[momentum_index]),
        "conjugateMomentumAcrossWindow": momentum_jump,
        "midpointScaledResidual": midpoint_residual,
        "signChangeObserved": sign_change,
        "qualified": qualified,
    }


def _independent_reference_comparison(
    spec: FixtureSpec, primary: IntegrationResult
) -> dict[str, Any]:
    settings = SolverSettings("RK45", 2.0e-11, 2.0e-13, 0.1)
    independent = integrate_fixture(spec, settings, independent=True)
    common_end = min(float(primary.affine[-1]), float(independent.affine[-1])) * (
        1.0 - 1.0e-9
    )
    affine = np.linspace(0.0, common_end, 401)
    primary_state = np.asarray(primary.dense_solution(affine), dtype=float)
    reference_state = np.asarray(independent.dense_solution(affine), dtype=float)
    scaled_error = _scaled_state_error(primary_state, reference_state)
    terminal_affine_difference = float(abs(primary.affine[-1] - independent.affine[-1]))
    classifications = [_classification(primary), _classification(independent)]
    return {
        "primary": primary.implementation,
        "independent": independent.implementation,
        "independentMethod": "RK45",
        "independentRelativeTolerance": settings.relative_tolerance,
        "independentAbsoluteTolerance": settings.absolute_tolerance,
        "comparisonAffineEnd": common_end,
        "maxScaledTrajectoryDifference": scaled_error,
        "terminalAffineDifference": terminal_affine_difference,
        "classifications": classifications,
        "qualified": bool(
            scaled_error <= THRESHOLDS["independentTrajectoryScaledError"]
            and classifications[0] == classifications[1] == spec.expected_classification
        ),
    }


def _mp_invariants(spin: float, state: np.ndarray, decimal_precision: int = 80) -> np.ndarray:
    with mp.workdps(decimal_precision):
        a = mp.mpf(str(spin))
        values = [mp.mpf(str(float(value))) for value in state]
        radius, theta = values[1], values[2]
        momentum = mp.matrix(values[4:])
        sin_theta = mp.sin(theta)
        cos_theta = mp.cos(theta)
        sin2 = sin_theta * sin_theta
        sigma = radius * radius + a * a * cos_theta * cos_theta
        delta = radius * radius - 2 * radius + a * a
        big_a = (radius * radius + a * a) ** 2 - a * a * delta * sin2
        metric = mp.matrix(4, 4)
        metric[0, 0] = -big_a / (sigma * delta)
        metric[0, 3] = metric[3, 0] = -2 * a * radius / (sigma * delta)
        metric[1, 1] = delta / sigma
        metric[2, 2] = 1 / sigma
        metric[3, 3] = (delta - a * a * sin2) / (sigma * delta * sin2)
        value_h = (momentum.T * metric * momentum)[0] / 2
        energy = -values[4]
        axial = values[7]
        value_q = values[6] ** 2 + cos_theta**2 * (
            a * a * (1 - energy * energy) + axial * axial / sin2
        )
        return np.asarray(
            [
                float(energy),
                float(axial),
                float(value_q),
                float(value_h),
                float(2 * value_h + 1),
            ],
            dtype=float,
        )


def _high_precision_algebraic_comparison(result: IntegrationResult) -> dict[str, Any]:
    states = [result.state[:, 0], result.state[:, result.state.shape[1] // 2], result.state[:, -1]]
    differences = []
    for state in states:
        double = invariants(result.spec.spin, state)
        high_precision = _mp_invariants(result.spec.spin, state)
        differences.append(float(np.max(np.abs(double - high_precision))))
    maximum = max(differences)
    return {
        "oracle": "mpmath-80-decimal-digit-algebraic-invariant-evaluation",
        "sampleCount": len(states),
        "maxAbsoluteDifference": maximum,
        "qualified": bool(maximum <= THRESHOLDS["highPrecisionInvariantDifference"]),
        "boundary": "high-precision-invariant-evaluation-not-high-precision-trajectory-integration",
    }


def _metric_derivative_crosscheck(spec: FixtureSpec) -> dict[str, Any]:
    analytic = inverse_metric_derivatives(spec.spin, spec.initial_radius, spec.initial_theta)
    reference = inverse_metric_reference_derivatives(
        spec.spin, spec.initial_radius, spec.initial_theta
    )
    residual = max(
        float(np.max(np.abs(analytic[0] - reference[0]))),
        float(np.max(np.abs(analytic[1] - reference[1]))),
    )
    inverse_residual = float(
        np.max(
            np.abs(
                inverse_metric(spec.spin, spec.initial_radius, spec.initial_theta)
                - inverse_metric_reference(
                    spec.spin, spec.initial_radius, spec.initial_theta
                )
            )
        )
    )
    return {
        "inverseMetricMaxAbsoluteResidual": inverse_residual,
        "inverseMetricDerivativeMaxAbsoluteResidual": residual,
        "qualified": bool(
            inverse_residual <= THRESHOLDS["metricInverseResidual"]
            and residual <= THRESHOLDS["metricDerivativeResidual"]
        ),
    }


def evaluate_fixture(spec: FixtureSpec) -> tuple[dict[str, Any], IntegrationResult]:
    primary = integrate_fixture(spec)
    classification = _classification(primary)
    invariant_report = _invariant_drift(primary)
    step_report = _step_convergence(spec)
    reverse_report = _reverse_time_roundtrip(spec)
    turning_report = _turning_point_continuity(primary)
    independent_report = _independent_reference_comparison(spec, primary)
    high_precision_report = _high_precision_algebraic_comparison(primary)
    derivative_report = _metric_derivative_crosscheck(spec)
    initial = initial_state_from_constants(spec)
    dynamic_theta = float(np.max(primary.state[2]) - np.min(primary.state[2]))
    dynamic_p_theta = float(np.max(primary.state[6]) - np.min(primary.state[6]))
    qualified = bool(
        classification == spec.expected_classification
        and invariant_report["qualified"]
        and step_report["qualified"]
        and reverse_report["qualified"]
        and turning_report["qualified"]
        and independent_report["qualified"]
        and high_precision_report["qualified"]
        and derivative_report["qualified"]
        and dynamic_theta > 1.0e-5
        and dynamic_p_theta > 1.0e-5
    )
    report = {
        "name": spec.name,
        "description": spec.description,
        "expectedClassification": spec.expected_classification,
        "classification": classification,
        "spin": spec.spin,
        "constantsRequested": {
            "energy": spec.energy,
            "axialAngularMomentum": spec.axial_angular_momentum,
            "carterQ": spec.carter_q,
        },
        "initialState": {
            name: float(initial[index]) for index, name in enumerate(STATE_ORDER)
        },
        "integration": {
            "implementation": primary.implementation,
            "method": primary.settings.method,
            "relativeTolerance": primary.settings.relative_tolerance,
            "absoluteTolerance": primary.settings.absolute_tolerance,
            "maxStep": primary.settings.max_step,
            "status": primary.status,
            "terminalAffine": float(primary.affine[-1]),
            "sampleCount": int(primary.affine.size),
            "functionEvaluations": primary.function_evaluations,
            "radialTurningPointCount": int(primary.radial_turning_affine.size),
            "polarTurningPointCount": int(primary.polar_turning_affine.size),
            "radiusRange": [float(np.min(primary.state[1])), float(np.max(primary.state[1]))],
            "thetaRange": [float(np.min(primary.state[2])), float(np.max(primary.state[2]))],
            "pThetaRange": [float(np.min(primary.state[6])), float(np.max(primary.state[6]))],
            "dynamicThetaSpan": dynamic_theta,
            "dynamicPThetaSpan": dynamic_p_theta,
        },
        "invariants": invariant_report,
        "stepConvergence": step_report,
        "reverseTimeRoundtrip": reverse_report,
        "turningPointContinuity": turning_report,
        "independentReferenceComparison": independent_report,
        "highPrecisionAlgebraicComparison": high_precision_report,
        "metricImplementationCrosscheck": derivative_report,
        "qualified": qualified,
    }
    _assert_finite_json(report)
    return report, primary


def build_reference_candidate(
    fixture_names: Iterable[str] = ("bound", "capture", "scatter", "escape"),
) -> tuple[dict[str, Any], dict[str, IntegrationResult]]:
    names = tuple(fixture_names)
    if not names or len(set(names)) != len(names):
        raise TimelikeKerrError("fixture-selection-must-be-nonempty-and-unique")
    unknown = [name for name in names if name not in FIXTURES]
    if unknown:
        raise TimelikeKerrError(f"fixture-not-registered:{','.join(unknown)}")
    reports: list[dict[str, Any]] = []
    trajectories: dict[str, IntegrationResult] = {}
    for name in names:
        report, result = evaluate_fixture(FIXTURES[name])
        reports.append(report)
        trajectories[name] = result
    analytic_anchors = build_analytic_anchors()
    all_qualified = bool(
        all(report["qualified"] is True for report in reports)
        and analytic_anchors["qualified"] is True
    )
    unsigned = {
        "version": VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": "2026-08-27T00:00:00Z",
        "metric": "Kerr",
        "coordinates": "Boyer-Lindquist-canonical-phase-space",
        "stateOrder": list(STATE_ORDER),
        "invariantOrder": list(INVARIANT_ORDER),
        "units": {"G": 1, "c": 1, "M": 1, "particleRestMass": 1},
        "hamiltonian": "H=0.5*g^(mu,nu)*p_mu*p_nu",
        "timelikeMassShell": -0.5,
        "fixtureCount": len(reports),
        "fixtures": reports,
        "analyticAnchors": analytic_anchors,
        "thresholds": dict(THRESHOLDS),
        "status": (
            "qualified-v595-timelike-kerr-reference-candidate"
            if all_qualified
            else "blocked-v595-timelike-kerr-reference-candidate"
        ),
        "authority": {
            "referenceCandidateEvidence": all_qualified,
            "scientificPromotionGranted": False,
            "productionAuthorityGranted": False,
            "measuredAuthorityGranted": False,
            "gpuAuthorityGranted": False,
            "radiativeTransferAuthorityGranted": False,
            "grmhdAuthorityGranted": False,
            "webTeachingKernelModified": False,
        },
        "formalEvidence": False,
        "promotion": "none",
        "boundary": REFERENCE_BOUNDARY,
    }
    _assert_finite_json(unsigned)
    summary = {**unsigned, "summarySha256": _canonical_sha256(unsigned)}
    if not all_qualified:
        failures = [report["name"] for report in reports if not report["qualified"]]
        if analytic_anchors["qualified"] is not True:
            failures.append("analytic-anchors")
        raise TimelikeKerrError(
            f"reference-candidate-qualification-failed:{','.join(failures)}"
        )
    return summary, trajectories


def _mapping(value: Any, label: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise TimelikeKerrError(f"summary-mapping-invalid:{label}")
    return value


def _finite_field(value: Mapping[str, Any], key: str, label: str) -> float:
    field = value.get(key)
    if isinstance(field, bool) or not isinstance(field, (int, float)):
        raise TimelikeKerrError(f"summary-number-invalid:{label}:{key}")
    number = float(field)
    if not math.isfinite(number):
        raise TimelikeKerrError(f"summary-number-non-finite:{label}:{key}")
    return number


def _require_at_most(actual: float, threshold_key: str, label: str) -> None:
    if actual < 0.0 or actual > THRESHOLDS[threshold_key]:
        raise TimelikeKerrError(
            f"summary-threshold-failed:{label}:{actual}:{THRESHOLDS[threshold_key]}"
        )


def _nonnegative_integer_field(
    value: Mapping[str, Any], key: str, label: str
) -> int:
    number = _finite_field(value, key, label)
    if number < 0.0 or not number.is_integer():
        raise TimelikeKerrError(f"summary-nonnegative-integer-invalid:{label}:{key}")
    return int(number)


def _verify_fixture_summary(fixture: Mapping[str, Any]) -> None:
    name = fixture.get("name")
    if not isinstance(name, str) or name not in FIXTURES:
        raise TimelikeKerrError("summary-fixture-name-invalid")
    spec = FIXTURES[name]
    if fixture.get("qualified") is not True:
        raise TimelikeKerrError(f"summary-fixture-not-qualified:{name}")
    if (
        fixture.get("expectedClassification") != spec.expected_classification
        or fixture.get("classification") != spec.expected_classification
    ):
        raise TimelikeKerrError(f"summary-fixture-classification-invalid:{name}")
    spin = _finite_field(fixture, "spin", name)
    if not math.isclose(spin, spec.spin, rel_tol=0.0, abs_tol=1.0e-15):
        raise TimelikeKerrError(f"summary-fixture-spin-invalid:{name}")
    requested = _mapping(fixture.get("constantsRequested"), f"{name}:constants")
    expected_constants = {
        "energy": spec.energy,
        "axialAngularMomentum": spec.axial_angular_momentum,
        "carterQ": spec.carter_q,
    }
    for field, expected in expected_constants.items():
        if not math.isclose(
            _finite_field(requested, field, f"{name}:constants"),
            expected,
            rel_tol=0.0,
            abs_tol=1.0e-14,
        ):
            raise TimelikeKerrError(f"summary-fixture-constant-invalid:{name}:{field}")
    initial_mapping = _mapping(fixture.get("initialState"), f"{name}:initialState")
    if set(initial_mapping) != set(STATE_ORDER):
        raise TimelikeKerrError(f"summary-initial-state-fields-invalid:{name}")
    initial_state = np.asarray(
        [_finite_field(initial_mapping, field, f"{name}:initialState") for field in STATE_ORDER],
        dtype=float,
    )
    initial_invariants = invariants(spin, initial_state)

    integration = _mapping(fixture.get("integration"), f"{name}:integration")
    radial_turns = _nonnegative_integer_field(
        integration, "radialTurningPointCount", name
    )
    polar_turns = _nonnegative_integer_field(
        integration, "polarTurningPointCount", name
    )
    if name == "bound":
        classification_valid = (
            integration.get("status") == "affine-limit"
            and radial_turns >= 2
            and spec.energy < 1.0
        )
    elif name == "capture":
        classification_valid = integration.get("status") == "captured"
    elif name == "scatter":
        classification_valid = (
            integration.get("status") == "escaped" and radial_turns >= 1
        )
    else:
        classification_valid = (
            integration.get("status") == "escaped" and radial_turns == 0
        )
    if not classification_valid:
        raise TimelikeKerrError(f"summary-fixture-event-semantics-invalid:{name}")
    theta_span = _finite_field(integration, "dynamicThetaSpan", name)
    p_theta_span = _finite_field(integration, "dynamicPThetaSpan", name)
    if theta_span <= 1.0e-5 or p_theta_span <= 1.0e-5:
        raise TimelikeKerrError(f"summary-dynamic-polar-state-missing:{name}")
    theta_range = integration.get("thetaRange")
    p_theta_range = integration.get("pThetaRange")
    if (
        not isinstance(theta_range, list)
        or len(theta_range) != 2
        or not isinstance(p_theta_range, list)
        or len(p_theta_range) != 2
    ):
        raise TimelikeKerrError(f"summary-polar-range-invalid:{name}")
    if not math.isclose(
        float(theta_range[1]) - float(theta_range[0]),
        theta_span,
        rel_tol=2.0e-12,
        abs_tol=2.0e-14,
    ) or not math.isclose(
        float(p_theta_range[1]) - float(p_theta_range[0]),
        p_theta_span,
        rel_tol=2.0e-12,
        abs_tol=2.0e-14,
    ):
        raise TimelikeKerrError(f"summary-polar-range-span-mismatch:{name}")

    invariant = _mapping(fixture.get("invariants"), f"{name}:invariants")
    if invariant.get("computedFromTrajectory") is not True:
        raise TimelikeKerrError(f"summary-invariants-not-trajectory-derived:{name}")
    invariant_initial = _mapping(invariant.get("initial"), f"{name}:invariants:initial")
    for index, field in enumerate(INVARIANT_ORDER):
        reported = _finite_field(invariant_initial, field, f"{name}:invariants:initial")
        if not math.isclose(
            reported,
            float(initial_invariants[index]),
            rel_tol=2.0e-12,
            abs_tol=2.0e-13,
        ):
            raise TimelikeKerrError(f"summary-initial-invariant-mismatch:{name}:{field}")
    absolute_drift = _mapping(
        invariant.get("maxAbsoluteDrift"), f"{name}:invariants:drift"
    )
    for field, threshold in (
        ("energy", "energyDrift"),
        ("axialAngularMomentum", "axialAngularMomentumDrift"),
        ("carterQ", "carterQDrift"),
        ("hamiltonian", "hamiltonianDrift"),
    ):
        _require_at_most(
            _finite_field(absolute_drift, field, f"{name}:invariants:drift"),
            threshold,
            f"{name}:{field}-drift",
        )
    _require_at_most(
        _finite_field(invariant, "maxMassShellResidual", f"{name}:invariants"),
        "massShellResidual",
        f"{name}:mass-shell",
    )
    if invariant.get("qualified") is not True:
        raise TimelikeKerrError(f"summary-invariant-gate-not-qualified:{name}")

    step = _mapping(fixture.get("stepConvergence"), f"{name}:step")
    coarse_medium = _finite_field(step, "coarseToMediumScaledError", f"{name}:step")
    medium_fine = _finite_field(step, "mediumToFineScaledError", f"{name}:step")
    _require_at_most(coarse_medium, "stepConvergenceScaledError", f"{name}:step-coarse")
    _require_at_most(medium_fine, "stepConvergenceScaledError", f"{name}:step-fine")
    if (
        medium_fine > max(1.25 * coarse_medium, 5.0e-11)
        or step.get("classifications") != [spec.expected_classification] * 3
        or step.get("qualified") is not True
    ):
        raise TimelikeKerrError(f"summary-step-convergence-invalid:{name}")

    reverse = _mapping(fixture.get("reverseTimeRoundtrip"), f"{name}:reverse")
    _require_at_most(
        _finite_field(reverse, "scaledStateError", f"{name}:reverse"),
        "reverseTimeScaledError",
        f"{name}:reverse",
    )
    if reverse.get("qualified") is not True:
        raise TimelikeKerrError(f"summary-reverse-gate-not-qualified:{name}")

    turning = _mapping(fixture.get("turningPointContinuity"), f"{name}:turning")
    expected_turn_count = radial_turns if spec.required_turning_coordinate == "r" else polar_turns
    if (
        turning.get("coordinate") != spec.required_turning_coordinate
        or _nonnegative_integer_field(turning, "eventCount", f"{name}:turning")
        != expected_turn_count
        or expected_turn_count < 1
        or turning.get("signChangeObserved") is not True
        or turning.get("qualified") is not True
    ):
        raise TimelikeKerrError(f"summary-turning-semantics-invalid:{name}")
    _require_at_most(
        _finite_field(turning, "midpointScaledResidual", f"{name}:turning"),
        "turningPointMidpointResidual",
        f"{name}:turning",
    )

    independent = _mapping(
        fixture.get("independentReferenceComparison"), f"{name}:independent"
    )
    _require_at_most(
        _finite_field(
            independent,
            "maxScaledTrajectoryDifference",
            f"{name}:independent",
        ),
        "independentTrajectoryScaledError",
        f"{name}:independent",
    )
    if (
        independent.get("classifications")
        != [spec.expected_classification, spec.expected_classification]
        or independent.get("qualified") is not True
    ):
        raise TimelikeKerrError(f"summary-independent-gate-invalid:{name}")

    high_precision = _mapping(
        fixture.get("highPrecisionAlgebraicComparison"), f"{name}:high-precision"
    )
    _require_at_most(
        _finite_field(high_precision, "maxAbsoluteDifference", f"{name}:high-precision"),
        "highPrecisionInvariantDifference",
        f"{name}:high-precision",
    )
    if high_precision.get("qualified") is not True:
        raise TimelikeKerrError(f"summary-high-precision-gate-invalid:{name}")

    metric = _mapping(
        fixture.get("metricImplementationCrosscheck"), f"{name}:metric"
    )
    _require_at_most(
        _finite_field(metric, "inverseMetricMaxAbsoluteResidual", f"{name}:metric"),
        "metricInverseResidual",
        f"{name}:metric-inverse",
    )
    _require_at_most(
        _finite_field(
            metric, "inverseMetricDerivativeMaxAbsoluteResidual", f"{name}:metric"
        ),
        "metricDerivativeResidual",
        f"{name}:metric-derivative",
    )
    if metric.get("qualified") is not True:
        raise TimelikeKerrError(f"summary-metric-gate-invalid:{name}")


def _verify_analytic_anchor_summary(value: Any) -> int:
    anchors = _mapping(value, "analyticAnchors")
    if (
        anchors.get("version") != "v595-timelike-kerr-analytic-anchors-v1"
        or anchors.get("anchorNames") != list(ANALYTIC_ANCHOR_NAMES)
        or anchors.get("anchorCount") != len(ANALYTIC_ANCHOR_NAMES)
        or anchors.get("qualified") is not True
    ):
        raise TimelikeKerrError("summary-analytic-anchor-contract-invalid")
    anchor_rows = anchors.get("anchors")
    if not isinstance(anchor_rows, list) or [row.get("name") for row in anchor_rows] != list(
        ANALYTIC_ANCHOR_NAMES
    ):
        raise TimelikeKerrError("summary-analytic-anchor-set-invalid")
    for anchor in anchor_rows:
        row = _mapping(anchor, "analyticAnchor")
        _require_at_most(
            _finite_field(row, "maxInvariantResidual", str(row.get("name"))),
            "analyticAnchorInvariantResidual",
            f"{row.get('name')}:analytic-invariant",
        )
        _require_at_most(
            _finite_field(row, "maxRhsEquilibriumResidual", str(row.get("name"))),
            "analyticAnchorEquilibriumResidual",
            f"{row.get('name')}:analytic-equilibrium",
        )
        short_orbit = _mapping(row.get("shortOrbit"), f"{row.get('name')}:shortOrbit")
        _require_at_most(
            _finite_field(short_orbit, "maxStabilityResidual", str(row.get("name"))),
            "analyticAnchorOrbitStability",
            f"{row.get('name')}:analytic-short-orbit",
        )
        expected = _mapping(row.get("expected"), f"{row.get('name')}:expected")
        if (
            abs(_finite_field(expected, "carterQ", str(row.get("name"))))
            > THRESHOLDS["analyticAnchorInvariantResidual"]
            or not math.isclose(
                _finite_field(expected, "hamiltonian", str(row.get("name"))),
                -0.5,
                rel_tol=0.0,
                abs_tol=THRESHOLDS["analyticAnchorInvariantResidual"],
            )
            or row.get("qualified") is not True
        ):
            raise TimelikeKerrError(
                f"summary-analytic-anchor-semantics-invalid:{row.get('name')}"
            )
    regenerated = build_analytic_anchors()
    if _canonical_sha256(anchors) != _canonical_sha256(regenerated):
        raise TimelikeKerrError("summary-analytic-anchor-replay-mismatch")
    return len(anchor_rows)


def verify_summary(summary: Mapping[str, Any]) -> dict[str, Any]:
    value = dict(summary)
    seal = value.pop("summarySha256", None)
    if not isinstance(seal, str) or seal != _canonical_sha256(value):
        raise TimelikeKerrError("summary-seal-invalid")
    _assert_finite_json(value)
    if value.get("version") != VERSION or value.get("schemaVersion") != SCHEMA_VERSION:
        raise TimelikeKerrError("summary-version-invalid")
    if value.get("status") != "qualified-v595-timelike-kerr-reference-candidate":
        raise TimelikeKerrError("summary-status-not-qualified")
    if (
        value.get("metric") != "Kerr"
        or value.get("coordinates") != "Boyer-Lindquist-canonical-phase-space"
        or value.get("stateOrder") != list(STATE_ORDER)
        or value.get("invariantOrder") != list(INVARIANT_ORDER)
        or value.get("thresholds") != dict(THRESHOLDS)
        or value.get("formalEvidence") is not False
        or value.get("promotion") != "none"
        or value.get("boundary") != REFERENCE_BOUNDARY
    ):
        raise TimelikeKerrError("summary-top-level-contract-invalid")
    expected_authority = {
        "referenceCandidateEvidence": True,
        "scientificPromotionGranted": False,
        "productionAuthorityGranted": False,
        "measuredAuthorityGranted": False,
        "gpuAuthorityGranted": False,
        "radiativeTransferAuthorityGranted": False,
        "grmhdAuthorityGranted": False,
        "webTeachingKernelModified": False,
    }
    if value.get("authority") != expected_authority:
        raise TimelikeKerrError("summary-authority-boundary-violated")
    fixtures = value.get("fixtures")
    if not isinstance(fixtures, list):
        raise TimelikeKerrError("summary-fixtures-invalid")
    fixture_names = [fixture.get("name") for fixture in fixtures if isinstance(fixture, Mapping)]
    if (
        len(fixture_names) != len(fixtures)
        or fixture_names != list(FIXTURES)
        or value.get("fixtureCount") != len(FIXTURES)
    ):
        raise TimelikeKerrError("summary-fixture-set-invalid")
    for fixture in fixtures:
        _verify_fixture_summary(fixture)
    anchor_count = _verify_analytic_anchor_summary(value.get("analyticAnchors"))
    return {
        "status": "passed-readonly-v595-timelike-kerr-summary",
        "summarySha256": seal,
        "fixtureCount": len(fixtures),
        "analyticAnchorCount": anchor_count,
        "writesPerformed": False,
        "scientificPromotionGranted": False,
    }


def _assert_finite_json(value: Any, path: str = "root") -> None:
    if value is None or isinstance(value, (bool, str, int)):
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise TimelikeKerrError(f"non-finite-json-value:{path}")
        return
    if isinstance(value, (list, tuple)):
        for index, item in enumerate(value):
            _assert_finite_json(item, f"{path}[{index}]")
        return
    if isinstance(value, Mapping):
        for key, item in value.items():
            if not isinstance(key, str):
                raise TimelikeKerrError(f"non-string-json-key:{path}")
            _assert_finite_json(item, f"{path}.{key}")
        return
    raise TimelikeKerrError(f"unsupported-json-value:{path}:{type(value).__name__}")


def _canonical_sha256(value: Any) -> str:
    _assert_finite_json(value)
    encoded = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

"""NR-K0 analytic and finite-difference Schwarzschild constraint oracle.

This module uses geometric units (G = c = 1) and isotropic coordinates.  The
time-symmetric Schwarzschild slice is

    gamma_ij = psi**4 delta_ij,       K_ij = 0,
    psi = 1 + M/(2 r),                 beta^i = 0,
    alpha = (1 - M/(2 r))/(1 + M/(2 r)).

For r > M/2 the vacuum Hamiltonian constraint reduces to

    H = R = -8 psi**(-5) (psi'' + 2 psi'/r) = 0,

and the momentum constraint is identically zero.  The finite-difference path
below deliberately computes the radial Laplacian instead of returning zero;
its observed order is therefore a real numerical gate for the future method
of-lines backend.

This is an exact-solution oracle, not a dynamic GR solver.  It must remain
separate from the legacy EIH 1PN runtime until a later shadow-promotion gate
has independent evolution, constraint, convergence, and reproducibility
evidence.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Iterable, Literal, Sequence

import numpy as np


Array = np.ndarray
FiniteDifferenceOrder = Literal[2, 4]


def _positive_float(value: float, *, name: str) -> float:
    result = float(value)
    if not math.isfinite(result) or result <= 0.0:
        raise ValueError(f"{name} must be a finite positive number")
    return result


def _positive_radius_array(radius: Sequence[float] | Array, *, name: str = "radius") -> Array:
    result = np.asarray(radius, dtype=np.float64)
    if result.ndim != 1:
        raise ValueError(f"{name} must be a one-dimensional array")
    if result.size == 0 or not np.all(np.isfinite(result)) or np.any(result <= 0.0):
        raise ValueError(f"{name} must contain finite values greater than zero")
    return result


def _validate_exterior(radius: Array, mass_length: float) -> None:
    throat = 0.5 * mass_length
    if np.any(radius <= throat):
        raise ValueError(
            "the exterior isotropic Schwarzschild slice requires radius > M/2 "
            f"(received throat={throat:g})"
        )


def schwarzschild_isotropic_conformal_factor(
    radius: Sequence[float] | Array,
    mass_length: float = 1.0,
) -> Array:
    """Return the exact conformal factor psi on an isotropic slice."""

    mass = _positive_float(mass_length, name="mass_length")
    r = _positive_radius_array(radius)
    return 1.0 + 0.5 * mass / r


def schwarzschild_isotropic_lapse(
    radius: Sequence[float] | Array,
    mass_length: float = 1.0,
) -> Array:
    """Return the exact zero-shift Schwarzschild lapse outside the throat."""

    mass = _positive_float(mass_length, name="mass_length")
    r = _positive_radius_array(radius)
    _validate_exterior(r, mass)
    return (1.0 - 0.5 * mass / r) / (1.0 + 0.5 * mass / r)


def exact_hamiltonian_constraint(
    radius: Sequence[float] | Array,
    mass_length: float = 1.0,
) -> Array:
    """Evaluate the vacuum Hamiltonian constraint analytically.

    The expression is evaluated from analytic derivatives, rather than being
    replaced by a literal zero.  This keeps the oracle useful for detecting
    accidental unit/sign changes while remaining close to machine precision.
    """

    mass = _positive_float(mass_length, name="mass_length")
    r = _positive_radius_array(radius)
    _validate_exterior(r, mass)
    psi = schwarzschild_isotropic_conformal_factor(r, mass)
    first, second = _exact_radial_derivatives(r, mass)
    radial_laplacian = second + 2.0 * first / r
    return -8.0 * np.power(psi, -5.0) * radial_laplacian


def _exact_radial_derivatives(radius: Array, mass_length: float) -> tuple[Array, Array]:
    half_mass = 0.5 * mass_length
    first = -half_mass / (radius * radius)
    second = mass_length / (radius * radius * radius)
    return first, second


@dataclass(frozen=True)
class SchwarzschildIsotropicSlice:
    """Sampled exact initial data and its analytic constraint diagnostics."""

    radius: Array
    mass_length: float
    conformal_factor: Array
    lapse: Array
    shift: Array
    extrinsic_curvature_trace: Array
    hamiltonian_constraint_exact: Array
    momentum_constraint_l2: float

    @property
    def formulation(self) -> str:
        return "time-symmetric-isotropic-schwarzschild"

    @property
    def boundary(self) -> str:
        return "analytic-oracle-only-no-time-evolution"


def schwarzschild_isotropic_slice(
    radius: Sequence[float] | Array,
    mass_length: float = 1.0,
) -> SchwarzschildIsotropicSlice:
    """Construct exact exterior initial data for the NR-K0 validation gate."""

    mass = _positive_float(mass_length, name="mass_length")
    r = _positive_radius_array(radius)
    _validate_exterior(r, mass)
    size = r.size
    return SchwarzschildIsotropicSlice(
        radius=r.copy(),
        mass_length=mass,
        conformal_factor=schwarzschild_isotropic_conformal_factor(r, mass),
        lapse=schwarzschild_isotropic_lapse(r, mass),
        shift=np.zeros((size, 3), dtype=np.float64),
        extrinsic_curvature_trace=np.zeros(size, dtype=np.float64),
        hamiltonian_constraint_exact=exact_hamiltonian_constraint(r, mass),
        momentum_constraint_l2=0.0,
    )


def _validate_uniform_grid(radius: Array) -> float:
    if radius.size < 5:
        raise ValueError("at least five grid points are required")
    spacing = np.diff(radius)
    if not np.all(np.isfinite(spacing)) or np.any(spacing <= 0.0):
        raise ValueError("radius must be strictly increasing")
    h = float(spacing[0])
    if not np.allclose(spacing, h, rtol=2.0e-12, atol=2.0e-14):
        raise ValueError("finite-difference oracle requires a uniform radial grid")
    return h


def _finite_difference_radial_derivatives(
    radius: Array,
    mass_length: float,
    *,
    order: FiniteDifferenceOrder,
) -> tuple[Array, Array, Array, Array]:
    h = _validate_uniform_grid(radius)
    psi = schwarzschild_isotropic_conformal_factor(radius, mass_length)

    if order == 2:
        interior_radius = radius[1:-1]
        interior_psi = psi[1:-1]
        first = (psi[2:] - psi[:-2]) / (2.0 * h)
        second = (psi[2:] - 2.0 * psi[1:-1] + psi[:-2]) / (h * h)
    elif order == 4:
        interior_radius = radius[2:-2]
        interior_psi = psi[2:-2]
        first = (
            psi[:-4]
            - 8.0 * psi[1:-3]
            + 8.0 * psi[3:-1]
            - psi[4:]
        ) / (12.0 * h)
        second = (
            -psi[:-4]
            + 16.0 * psi[1:-3]
            - 30.0 * psi[2:-2]
            + 16.0 * psi[3:-1]
            - psi[4:]
        ) / (12.0 * h * h)
    else:
        raise ValueError("order must be 2 or 4")

    return interior_radius, interior_psi, first, second


def finite_difference_hamiltonian_constraint(
    radius: Sequence[float] | Array,
    mass_length: float = 1.0,
    *,
    order: FiniteDifferenceOrder = 2,
) -> tuple[Array, Array]:
    """Return interior radii and a finite-difference vacuum H constraint.

    ``order=2`` uses the standard three-point central stencils.  ``order=4``
    uses five-point central stencils.  Boundary points are omitted instead of
    silently switching to a lower-order one-sided derivative.
    """

    mass = _positive_float(mass_length, name="mass_length")
    r = _positive_radius_array(radius)
    _validate_exterior(r, mass)
    interior_radius, interior_psi, first, second = _finite_difference_radial_derivatives(
        r,
        mass,
        order=order,
    )
    radial_laplacian = second + 2.0 * first / interior_radius
    hamiltonian = -8.0 * np.power(interior_psi, -5.0) * radial_laplacian
    return interior_radius, hamiltonian


@dataclass(frozen=True)
class ConstraintSample:
    """One grid resolution in a constraint-convergence campaign."""

    points: int
    spacing: float
    hamiltonian_l_inf: float
    hamiltonian_l2: float
    derivative_l_inf: float
    derivative_l2: float


@dataclass(frozen=True)
class ConstraintConvergenceReport:
    """Reproducible output of the NR-K0 finite-difference gate."""

    formulation: str
    order: int
    mass_length: float
    radius_interval: tuple[float, float]
    samples: tuple[ConstraintSample, ...]
    observed_orders: tuple[float, ...]

    @property
    def observed_order(self) -> float:
        if not self.observed_orders:
            return float("nan")
        return float(min(self.observed_orders))

    @property
    def passed(self) -> bool:
        target = float(self.order)
        return bool(self.observed_orders) and self.observed_order >= target - 0.25


def _norms(values: Array) -> tuple[float, float]:
    finite = np.asarray(values, dtype=np.float64)
    if finite.size == 0 or not np.all(np.isfinite(finite)):
        raise ValueError("constraint values must be finite and non-empty")
    return float(np.max(np.abs(finite))), float(np.sqrt(np.mean(finite * finite)))


def _orders(samples: Iterable[ConstraintSample]) -> tuple[float, ...]:
    values = list(samples)
    result: list[float] = []
    for coarse, fine in zip(values, values[1:]):
        if coarse.derivative_l_inf <= 0.0 or fine.derivative_l_inf <= 0.0:
            result.append(float("inf"))
            continue
        ratio = coarse.derivative_l_inf / fine.derivative_l_inf
        result.append(float(math.log(ratio, 2.0)))
    return tuple(result)


def run_constraint_convergence(
    *,
    mass_length: float = 1.0,
    radius_interval: tuple[float, float] = (2.0, 20.0),
    grid_sizes: Sequence[int] = (101, 201, 401, 801),
    order: FiniteDifferenceOrder = 2,
) -> ConstraintConvergenceReport:
    """Run a refinement campaign against the exact Schwarzschild slice."""

    mass = _positive_float(mass_length, name="mass_length")
    if len(radius_interval) != 2:
        raise ValueError("radius_interval must contain (r_min, r_max)")
    r_min = float(radius_interval[0])
    r_max = float(radius_interval[1])
    if not math.isfinite(r_min) or not math.isfinite(r_max) or r_max <= r_min:
        raise ValueError("radius_interval must be finite and strictly increasing")
    if r_min <= 0.5 * mass:
        raise ValueError("r_min must be outside the isotropic throat M/2")
    sizes = tuple(int(size) for size in grid_sizes)
    if len(sizes) < 2 or any(size < 5 for size in sizes):
        raise ValueError("at least two grid sizes of five or more points are required")
    if any(right <= left for left, right in zip(sizes, sizes[1:])):
        raise ValueError("grid_sizes must be strictly increasing")

    samples: list[ConstraintSample] = []
    for points in sizes:
        radius = np.linspace(r_min, r_max, points, dtype=np.float64)
        interior_radius, hamiltonian = finite_difference_hamiltonian_constraint(
            radius,
            mass,
            order=order,
        )
        del interior_radius
        h_inf, h_l2 = _norms(hamiltonian)
        derivative_radius, _, first, second = _finite_difference_radial_derivatives(
            radius,
            mass,
            order=order,
        )
        exact_first, exact_second = _exact_radial_derivatives(derivative_radius, mass)
        derivative_error = np.concatenate(
            (first - exact_first, second - exact_second),
        )
        derivative_l_inf, derivative_l2 = _norms(derivative_error)
        samples.append(
            ConstraintSample(
                points=points,
                spacing=float((r_max - r_min) / (points - 1)),
                hamiltonian_l_inf=h_inf,
                hamiltonian_l2=h_l2,
                derivative_l_inf=derivative_l_inf,
                derivative_l2=derivative_l2,
            )
        )
    frozen_samples = tuple(samples)
    return ConstraintConvergenceReport(
        formulation="time-symmetric-isotropic-schwarzschild",
        order=int(order),
        mass_length=mass,
        radius_interval=(r_min, r_max),
        samples=frozen_samples,
        observed_orders=_orders(frozen_samples),
    )

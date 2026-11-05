"""Constraint-compatible Schwarzschild lapse-pulse initial data, shadow only.

The physical three-metric and K_ij are exactly the existing static isotropic
Schwarzschild data. Only log(alpha) and its analytic gradient change. This is
a gauge-evolution benchmark, not a radiative perturbation or an evolved exact
solution. No projection, elliptic solve, or live integration is performed.
"""
from __future__ import annotations

import math

import numpy as np

from .fo_ccz4_schwarzschild import SchwarzschildDomain, analytic_slots
from .nr3d import Grid3D

AMPLITUDE = 1.e-3
CENTER, HALF_WIDTH, POWER = 2., .75, 6
CHANGED_SLOTS = (6, 25, 26, 27)


def identity():
    return dict(schema="nr-schwarzschild-lapse-pulse-v1", amplitude=AMPLITUDE,
        center=[CENTER]*3, half_width=[HALF_WIDTH]*3, polynomial_power=POWER,
        domain=[1., 3.], mass=1., regularity="C5 compact support; not C-infinity",
        physical_metric_unchanged=True, physical_extrinsic_curvature_unchanged=True,
        analytically_constraint_satisfying_initial_data=True,
        einstein_constraint_solve=False, algebraic_projection=False,
        analytic_positive_time_solution=False, gravitational_radiation_injected=False,
        physical_boundary_validated=False, scientificPayloadWriteback=False)


def compact_lapse_bump(coordinates):
    """B=prod(max(1-u_i^2,0)^6), and exact partial_i B, u=(x-2)/.75."""
    if not isinstance(coordinates, (tuple, list)) or len(coordinates) != 3:
        raise ValueError("three real finite coordinate arrays required")
    xyz = [np.asarray(x) for x in coordinates]
    if any(x.shape != xyz[0].shape or x.dtype.kind not in "fiu" or not np.all(np.isfinite(x)) for x in xyz):
        raise ValueError("matching real finite coordinate arrays required")
    # Outside the support both the polynomial and its derivative are exactly
    # zero. Clamp before squaring to avoid overflow for large finite inputs.
    u = [np.clip(x.astype(np.float64)-CENTER, -HALF_WIDTH, HALF_WIDTH)/HALF_WIDTH for x in xyz]
    factors = [np.maximum(1.-x*x, 0.) for x in u]
    values = [x**POWER for x in factors]
    bump = values[0]*values[1]*values[2]
    gradient = np.stack([-2.*POWER*u[k]/HALF_WIDTH*factors[k]**(POWER-1)
        *values[(k+1) % 3]*values[(k+2) % 3] for k in range(3)], axis=0)
    return bump, gradient


def initial_slots(points, *, amplitude=AMPLITUDE):
    if type(points) is not int or not 9 <= points <= 17:
        raise ValueError("reference gauge-pulse grid9..17 required")
    if type(amplitude) not in (int, float) or not math.isfinite(amplitude) or abs(amplitude) > .01:
        raise ValueError("finite log-lapse amplitude within .01 required")
    grid = Grid3D((points,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    reference = np.array(analytic_slots(points, 4, SchwarzschildDomain()), dtype=np.float64)
    pulse = reference.copy()
    bump, gradient = compact_lapse_bump(grid.coordinates)
    pulse[6] += amplitude*bump
    pulse[25:28] += amplitude*gradient
    return pulse, reference

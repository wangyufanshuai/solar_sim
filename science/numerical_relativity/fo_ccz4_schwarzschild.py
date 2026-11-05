"""Static isotropic Schwarzschild exterior with prescribed analytic halo.

This is a curved-vacuum truncation/evolution benchmark, not a horizon,
excision, absorbing boundary, or constraint-preserving IBVP implementation.
Both stencil orders hold TWO complete outer layers fixed at every RK stage.
The positive octant cube lies wholly outside r=M/2. All 58 interior slots
evolve; analytic values are never injected into the evolved interior.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .nr3d import BSSNState3D, Grid3D

BOUNDARY = "schwarzschild-dirichlet"
DOMAIN_KEY = "schwarzschild_domain"
HALO = 2


@dataclass(frozen=True)
class SchwarzschildDomain:
    lower: float = 1.0
    upper: float = 3.0
    mass: float = 1.0

    def __post_init__(self):
        if (not all(math.isfinite(v) for v in (self.lower, self.upper, self.mass))
                or self.mass <= 0. or self.lower <= 0. or self.upper <= self.lower
                or math.sqrt(3.) * self.lower <= self.mass / 2.):
            raise ValueError("Schwarzschild cube must be finite, positive, and outside r=M/2")

    def grid(self, points, order):
        if type(points) is not int or points < 9:
            raise ValueError("Schwarzschild benchmark requires at least nine points")
        return Grid3D((points,) * 3, (self.lower,) * 3, (self.upper,) * 3,
                      boundary=BOUNDARY, spatial_order=order)

    def identity(self):
        return {"schema_version": "nr-schwarzschild-exterior-domain-v1",
                "boundary": BOUNDARY, "lower": self.lower, "upper": self.upper,
                "mass": self.mass, "frozen_layers": HALO,
                "application": "zero-rhs-all-58-slots-every-rk-stage",
                "physical_boundary_validated": False, "horizon_in_domain": False}


def domain_from_state(base):
    metadata = base.metadata.get(DOMAIN_KEY)
    if not isinstance(metadata, dict):
        raise ValueError("explicit Schwarzschild domain metadata required")
    domain = SchwarzschildDomain(metadata.get("lower", float("nan")),
                                 metadata.get("upper", float("nan")),
                                 metadata.get("mass", float("nan")))
    if metadata != domain.identity() or base.grid != domain.grid(base.grid.shape[0], base.grid.spatial_order):
        raise ValueError("Schwarzschild domain/grid identity mismatch")
    return domain


def halo_mask(shape):
    if len(shape) != 3 or any(n < 5 for n in shape):
        raise ValueError("three grid dimensions with at least five points required")
    result = np.ones(shape, dtype=bool)
    result[HALO:-HALO, HALO:-HALO, HALO:-HALO] = False
    return result


def analytic_slots(points, order, domain=SchwarzschildDomain()):
    grid = domain.grid(points, order)
    xyz = grid.coordinates
    r = np.sqrt(sum(x * x for x in xyz))
    u = domain.mass / (2. * r)
    psi = 1. + u
    q = np.zeros((58, *grid.shape))
    q[0] = q[3] = q[5] = 1.
    q[6] = np.log((1. - u) / psi)
    q[10] = -2. * np.log(psi)
    for axis in range(3):
        q[25 + axis] = domain.mass * xyz[axis] / (r**3 * (1. - u*u))
        q[55 + axis] = domain.mass * xyz[axis] / (r**3 * psi)
    return q


def require_analytic_halo(slots, domain, order):
    q = np.asarray(slots)
    if q.ndim != 4 or q.shape[0] != 58 or len(set(q.shape[1:])) != 1 or not np.all(np.isfinite(q)):
        raise ValueError("Schwarzschild requires 58 finite cubic fields")
    expected = analytic_slots(q.shape[1], order, domain)
    mask = halo_mask(q.shape[1:])
    # Different libm/exp-log paths can differ by a few ulps, not by physics.
    if q.shape != expected.shape:
        raise ValueError("Schwarzschild requires 58 finite cubic fields")
    if not np.allclose(q[:, mask], expected[:, mask], rtol=0., atol=2.e-14):
        raise ValueError("Schwarzschild analytic halo corrupted; refuse to freeze arbitrary data")


def initial_state(points, order, domain=SchwarzschildDomain()):
    from .fo_ccz4 import FOCCZ4Auxiliary3D
    from .fo_ccz4_rhs import FOCCZ4State3D

    q = analytic_slots(points, order, domain)
    base = BSSNState3D.minkowski(domain.grid(points, order))
    base.lapse[:] = np.exp(q[6])
    base.chi[:] = np.exp(2. * q[10])
    base.metadata = {DOMAIN_KEY: domain.identity(),
                     "initial_data": "static-isotropic-schwarzschild-analytic-auxiliaries"}
    aux = FOCCZ4Auxiliary3D(np.moveaxis(q[25:28], 0, -1),
                           np.zeros((*base.grid.shape, 3, 3)),
                           np.zeros((*base.grid.shape, 3, 3, 3)),
                           np.moveaxis(q[55:58], 0, -1), order,
                           hashlib.sha256(q.tobytes()).hexdigest(),
                           method="analytic-schwarzschild-derivatives")
    return FOCCZ4State3D(base, aux)


def closed_derivative(values, grid, axis):
    """FD2/4 interior with unused zero derivatives in the prescribed halo.

    No wrapping, extrapolation, or lower-order closure enters an active RHS.
    This first derivative is ONLY for the first-order FO benchmark.
    """
    if grid.boundary != BOUNDARY or axis not in (0, 1, 2):
        raise ValueError("closed derivative requires explicit Schwarzschild boundary")
    values = np.asarray(values)
    h = grid.spacing[axis]
    v = np.moveaxis(values, axis, 0)
    out = np.zeros_like(v, dtype=float)
    if grid.spatial_order == 2:
        out[1:-1] = (v[2:] - v[:-2]) / (2. * h)
    else:
        out[2:-2] = (8. * (v[3:-1] - v[1:-3]) - (v[4:] - v[:-4])) / (12. * h)
    return np.moveaxis(out, 0, axis)


def analytic_ricci_and_kretschmann(grid, mass):
    """Independent geometric oracle: R_ij and 48 M^2 / R_areal^6."""
    xyz = np.stack(grid.coordinates, axis=-1)
    radius = np.linalg.norm(xyz, axis=-1)
    psi = 1. + mass / (2. * radius)
    normal = xyz / radius[..., None]
    ricci = (mass / (radius**3 * psi**2))[..., None, None] * (
        np.eye(3) - 3. * normal[..., :, None] * normal[..., None, :])
    areal_radius = radius * psi**2
    return ricci, 48. * mass**2 / areal_radius**6

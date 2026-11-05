"""Independent physical-metric diagnostics for the Schwarzschild experiment.

Derivative weights come from polynomial moments, not the production stencil.
ADM constraints do not read evolved GammaHat/A/B/D/P. The curvature scalar
uses the vacuum Weyl reconstruction; off constraint it is a diagnostic proxy,
NOT the four-dimensional Kretschmann scalar of an independently known metric.
"""
from __future__ import annotations

from functools import lru_cache
import math

import numpy as np

from .fo_ccz4_checkpoint import SYMMETRIC
from .fo_ccz4_schwarzschild import analytic_ricci_and_kretschmann, analytic_slots, halo_mask


@lru_cache(maxsize=32)
def derivative_matrix(n, order, spacing):
    if n < order+1 or order not in (2, 4) or not math.isfinite(spacing) or spacing <= 0.:
        raise ValueError("finite positive spacing and FD2/4 grid required")
    matrix = np.zeros((n, n))
    target = np.zeros(order+1)
    target[1] = 1.
    for i in range(n):
        start = min(max(i-order//2, 0), n-order-1)
        columns = np.arange(start, start+order+1)
        offsets = columns-i
        weights = np.linalg.solve(np.stack([offsets.astype(float)**p for p in range(order+1)]), target)
        matrix[i, columns] = weights/spacing
    matrix.setflags(write=False)
    return matrix


def derivative(values, grid, axis):
    values = np.asarray(values)
    matrix = derivative_matrix(grid.shape[axis], grid.spatial_order, grid.spacing[axis])
    moved = np.moveaxis(values, axis, 0)
    return np.moveaxis(np.einsum("ij,j...->i...", matrix, moved, optimize=False), 0, axis)


def tensor(q, offset):
    out = np.empty((*q[0].shape, 3, 3))
    for v, (i, j) in enumerate(SYMMETRIC):
        out[..., i, j] = out[..., j, i] = q[offset+v]
    return out


def metric_geometry(q, grid):
    h, a = tensor(q, 0), tensor(q, 11)
    chi = np.exp(2*q[10])
    g = h/chi[..., None, None]
    gi = np.linalg.inv(g)
    kij = (a+h*q[17][..., None, None]/3.)/chi[..., None, None]
    mixed = gi @ kij
    trace = np.trace(mixed, axis1=-2, axis2=-1)
    dg = [derivative(g, grid, k) for k in range(3)]
    connection = np.zeros((*grid.shape, 3, 3, 3))
    for k in range(3):
        for i in range(3):
            for j in range(3):
                connection[..., k, i, j] = .5*sum(gi[..., k, ell]*(dg[i][..., ell, j]
                    + dg[j][..., ell, i]-dg[ell][..., i, j]) for ell in range(3))
    dc = [derivative(connection, grid, k) for k in range(3)]
    ricci = np.zeros_like(g)
    for i in range(3):
        for j in range(3):
            ricci[..., i, j] = sum(dc[k][..., k, i, j]-dc[j][..., k, i, k] for k in range(3))
            ricci[..., i, j] += sum(connection[..., k, i, j]*connection[..., ell, k, ell]
                -connection[..., ell, i, k]*connection[..., k, j, ell]
                for k in range(3) for ell in range(3))
    return g, gi, kij, mixed, trace, connection, ricci


def physical_fields(q, grid):
    g, gi, kij, mixed, trace, connection, ricci = metric_geometry(q, grid)
    hamiltonian = np.einsum("...ij,...ij->...", gi, ricci)+trace**2-np.trace(mixed@mixed, axis1=-2, axis2=-1)
    dm = [derivative(mixed, grid, k) for k in range(3)]
    momentum = np.stack([sum(dm[j][..., j, i] for j in range(3))-derivative(trace, grid, i)
        +sum(connection[..., j, j, ell]*mixed[..., ell, i]-connection[..., ell, j, i]*mixed[..., j, ell]
             for j in range(3) for ell in range(3)) for i in range(3)], axis=-1)
    electric = ricci+trace[..., None, None]*kij-kij@gi@kij
    electric = .5*(electric+np.swapaxes(electric, -1, -2))
    electric -= g*np.einsum("...ij,...ij->...", gi, electric)[..., None, None]/3.
    eps = np.zeros((3, 3, 3))
    eps[0, 1, 2] = eps[1, 2, 0] = eps[2, 0, 1] = 1.
    eps[0, 2, 1] = eps[2, 1, 0] = eps[1, 0, 2] = -1.
    epsilon = np.einsum("...ia,akl->...ikl", g, eps)/np.sqrt(np.linalg.det(g))[..., None, None, None]
    covdk = np.stack([derivative(kij, grid, k) for k in range(3)], axis=-3)
    for k in range(3):
        for ell in range(3):
            for j in range(3):
                covdk[..., k, ell, j] -= sum(connection[..., m, k, ell]*kij[..., m, j]
                    +connection[..., m, k, j]*kij[..., ell, m] for m in range(3))
    magnetic = np.einsum("...ikl,...klj->...ij", epsilon, covdk)
    magnetic = .5*(magnetic+np.swapaxes(magnetic, -1, -2))
    magnetic -= g*np.einsum("...ij,...ij->...", gi, magnetic)[..., None, None]/3.
    e_mixed, b_mixed = gi@electric, gi@magnetic
    invariant = 8.*np.trace(e_mixed@e_mixed-b_mixed@b_mixed, axis1=-2, axis2=-1)
    return {"H": hamiltonian, "M": momentum, "ricci": ricci,
            "vacuum_weyl_invariant": invariant, "electric": electric, "magnetic": magnetic}


def common_indices(n):
    if n not in (17, 25, 33):
        raise ValueError("frozen campaign requires N=17/25/33")
    # Exactly the same 5^3 physical positions [1.5, 2.5]^3 at every resolution.
    return np.array([2, 3, 4, 5, 6])*(n-1)//8


def sampled(values, indices):
    return values[np.ix_(indices, indices, indices)]


def norms(values):
    if not values.size or not np.all(np.isfinite(values)):
        raise ValueError("finite nonempty diagnostic required")
    return {"l2": float(np.sqrt(np.mean(values*values))), "linf": float(np.max(np.abs(values)))}


def diagnose(data):
    if data.domain is None or (data.domain.lower, data.domain.upper, data.domain.mass) != (1., 3., 1.):
        raise ValueError("audit has frozen domain [1,3]^3, mass 1")
    grid = data.domain.grid(data.header["points"], data.header["spatial_order"])
    indices = common_indices(grid.shape[0])
    q = np.asarray(data.slots)
    exact = analytic_slots(grid.shape[0], grid.spatial_order, data.domain)
    fields = physical_fields(q, grid)
    exact_ricci, exact_invariant = analytic_ricci_and_kretschmann(grid, data.domain.mass)
    halo = halo_mask(grid.shape)
    state_error = np.moveaxis(q-exact, 0, -1)
    selected = {"state": state_error, "H": fields["H"], "M": fields["M"],
                "ricci_error": fields["ricci"]-exact_ricci,
                "weyl_invariant_error": fields["vacuum_weyl_invariant"]-exact_invariant,
                "Theta": q[18]}
    return {"time": data.header["time"], "step": data.header["step"],
            "norms": {k: norms(sampled(v, indices)) for k, v in selected.items()},
            "exact_invariant_range": [float(np.min(sampled(exact_invariant, indices))),
                                      float(np.max(sampled(exact_invariant, indices)))],
            "halo_max_absolute_error": float(np.max(np.abs((q-exact)[:, halo]))),
            "all_active_state_error": norms(state_error[~halo]),
            "comparison_points": 125, "physical_validation": False}

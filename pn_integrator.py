"""RK4 time integration for d/dt r = v, d/dt v = a(r, v) with EIH/Newton acceleration."""

from __future__ import annotations

import astropy.units as u
import numpy as np
from astropy.constants import G as G_const, c as c_const

from .pn_eih_accel import acceleration_eih


def default_gravity_and_light_speed() -> tuple[float, float]:
    """SI values: G [m^3 kg^-1 s^-2], c [m/s]."""
    G = G_const.to_value(u.m**3 / (u.kg * u.s**2))
    c = c_const.to_value(u.m / u.s)
    return G, c


def step_rk4(
    r: np.ndarray,
    v: np.ndarray,
    mass: np.ndarray,
    dt: float,
    G: float,
    inv_c2: float,
    eps2: float,
) -> tuple[np.ndarray, np.ndarray]:
    """
    One explicit RK4 step. Arrays are (N, 3) float64; mass is (N,).

    inv_c2 = 1/c^2 for 1PN; use 0 for pure Newtonian.
    """
    r = np.asarray(r, dtype=np.float64, order="C")
    v = np.asarray(v, dtype=np.float64, order="C")
    mass = np.asarray(mass, dtype=np.float64)

    k1v = acceleration_eih(r, v, mass, G, inv_c2, eps2)
    k1r = v.copy()

    r2 = r + 0.5 * dt * k1r
    v2 = v + 0.5 * dt * k1v
    k2v = acceleration_eih(r2, v2, mass, G, inv_c2, eps2)
    k2r = v + 0.5 * dt * k1v

    r3 = r + 0.5 * dt * k2r
    v3 = v + 0.5 * dt * k2v
    k3v = acceleration_eih(r3, v3, mass, G, inv_c2, eps2)
    k3r = v + 0.5 * dt * k2v

    r4 = r + dt * k3r
    v4 = v + dt * k3v
    k4v = acceleration_eih(r4, v4, mass, G, inv_c2, eps2)
    k4r = v + dt * k3v

    r_new = r + (dt / 6.0) * (k1r + 2 * k2r + 2 * k3r + k4r)
    v_new = v + (dt / 6.0) * (k1v + 2 * k2v + 2 * k3v + k4v)
    return r_new, v_new


def integrate_rk4(
    r0: np.ndarray,
    v0: np.ndarray,
    mass: np.ndarray,
    dt: float,
    n_steps: int,
    G: float | None = None,
    *,
    inv_c2: float | None = None,
    eps2: float = 0.0,
    return_trajectory: bool = False,
) -> tuple[np.ndarray, np.ndarray] | tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Fixed-step RK4. If ``return_trajectory``, returns (r_hist, v_hist) with
    shape (n_steps+1, N, 3); else final (r, v).
    """
    if G is None:
        G, c = default_gravity_and_light_speed()
        if inv_c2 is None:
            inv_c2 = 1.0 / (c * c)
    else:
        if inv_c2 is None:
            _, c = default_gravity_and_light_speed()
            inv_c2 = 1.0 / (c * c)

    r = np.asarray(r0, dtype=np.float64, order="C").copy()
    v = np.asarray(v0, dtype=np.float64, order="C").copy()
    mass = np.asarray(mass, dtype=np.float64)

    if return_trajectory:
        rh = np.empty((n_steps + 1, r.shape[0], 3), dtype=np.float64)
        vh = np.empty_like(rh)
        rh[0] = r
        vh[0] = v
        for s in range(n_steps):
            r, v = step_rk4(r, v, mass, dt, G, inv_c2, eps2)
            rh[s + 1] = r
            vh[s + 1] = v
        return rh, vh

    for _ in range(n_steps):
        r, v = step_rk4(r, v, mass, dt, G, inv_c2, eps2)
    return r, v

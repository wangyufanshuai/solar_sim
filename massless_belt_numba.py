"""Massless particles: Newtonian acceleration from fixed massive bodies (O(N * N_big))."""

from __future__ import annotations

import numpy as np
from numba import njit, prange


@njit(parallel=True, fastmath=False)
def massless_euler_cromer_step(
    r: np.ndarray,
    v: np.ndarray,
    big_r: np.ndarray,
    big_m: np.ndarray,
    n_big: int,
    G: float,
    eps2: float,
    dt: float,
) -> None:
    """
    In-place Euler–Cromer substep: a = a(r); v += a*dt; r += v*dt.

    r, v: (N, 3) float64; big_r: (n_big, 3); big_m: (n_big,).
    """
    n = r.shape[0]
    for i in prange(n):
        ax = 0.0
        ay = 0.0
        az = 0.0
        rx = r[i, 0]
        ry = r[i, 1]
        rz = r[i, 2]
        for b in range(n_big):
            dx = big_r[b, 0] - rx
            dy = big_r[b, 1] - ry
            dz = big_r[b, 2] - rz
            r2 = dx * dx + dy * dy + dz * dz + eps2
            inv_r = 1.0 / np.sqrt(r2)
            inv_r3 = inv_r * inv_r * inv_r
            s = G * big_m[b] * inv_r3
            ax += s * dx
            ay += s * dy
            az += s * dz
        vx = v[i, 0] + ax * dt
        vy = v[i, 1] + ay * dt
        vz = v[i, 2] + az * dt
        v[i, 0] = vx
        v[i, 1] = vy
        v[i, 2] = vz
        r[i, 0] = rx + vx * dt
        r[i, 1] = ry + vy * dt
        r[i, 2] = rz + vz * dt


def init_asteroid_belt(
    n: int,
    rng: np.random.Generator,
    *,
    r_inner_au: float = 2.0,
    r_outer_au: float = 3.5,
    z_spread_au: float = 0.15,
) -> tuple[np.ndarray, np.ndarray]:
    """Rough main-belt annulus in AU, ecliptic plane; positions (n,3), velocities (n,3)."""
    rad = rng.uniform(r_inner_au, r_outer_au, size=n)
    theta = rng.uniform(0.0, 2 * np.pi, size=n)
    r = np.empty((n, 3), dtype=np.float64)
    r[:, 0] = rad * np.cos(theta)
    r[:, 1] = rad * np.sin(theta)
    r[:, 2] = rng.uniform(-z_spread_au, z_spread_au, size=n)
    v_circ = 1.0 / np.sqrt(rad)
    v = np.empty((n, 3), dtype=np.float64)
    v[:, 0] = -v_circ * np.sin(theta)
    v[:, 1] = v_circ * np.cos(theta)
    v[:, 2] = 0.0
    return r, v


def asteroid_belt_au_to_si(
    r_au: np.ndarray,
    v_au_d: np.ndarray,
    au_m: float,
    day_s: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Scale Horizons-like AU / AU/day state to SI."""
    return r_au * au_m, v_au_d * (au_m / day_s)

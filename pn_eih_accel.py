"""
Einstein–Infeld–Hoffmann (EIH) 1PN accelerations in harmonic coordinates + Newton.

Equation: harmonic gauge, point masses, O(c^-4) omitted (no spin, no tidal finite
size, no radiation reaction). Terms that contain other bodies' accelerations use
**Newtonian** accelerations on the right-hand side (standard explicit substitute;
see Wikipedia / Standish exposition).

Reference summary (same structure as Wikipedia EIH article):
  a_A = sum_{B!=A} G m_B n_BA / r_AB^2
      + (1/c^2) sum_{B!=A} (G m_B n_BA / r_AB^2) * bracket(...)
      + (1/c^2) sum_{B!=A} (G m_B / r_AB^2) * (n_AB·(4v_A-3v_B)) * (v_A-v_B)
      + (7/(2 c^2)) sum_{B!=A} G m_B a_B^N / r_AB

with n_AB = (x_A-x_B)/r_AB, n_BA = (x_B-x_A)/r_AB, r_AB = |x_A-x_B|,
phi_A = sum_{C!=A} G m_C/r_AC, and bracket uses -4 phi_A - phi_B + velocity terms
and 0.5 (x_B-x_A)·a_B^N.
"""

from __future__ import annotations

import numpy as np
from numba import njit


@njit
def acceleration_eih(
    pos: np.ndarray,
    vel: np.ndarray,
    mass: np.ndarray,
    G: float,
    inv_c2: float,
    eps2: float,
) -> np.ndarray:
    """
    Total acceleration (N, 3): Newton + 1PN (scaled by inv_c2 = 1/c^2).

    If inv_c2 == 0, returns pure Newtonian pairwise gravity with softening eps2.
    """
    n = pos.shape[0]
    acc = np.zeros((n, 3), dtype=np.float64)
    a_newt = np.zeros((n, 3), dtype=np.float64)
    phi = np.zeros(n, dtype=np.float64)

    # --- Newton + potentials phi[i] = sum_{c!=i} G m_c / r_ic
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            dx = pos[j, 0] - pos[i, 0]
            dy = pos[j, 1] - pos[i, 1]
            dz = pos[j, 2] - pos[i, 2]
            r2 = dx * dx + dy * dy + dz * dz + eps2
            inv_r = 1.0 / np.sqrt(r2)
            inv_r2 = inv_r * inv_r
            gm = G * mass[j]
            phi[i] += gm * inv_r
            a_newt[i, 0] += gm * dx * inv_r * inv_r2
            a_newt[i, 1] += gm * dy * inv_r * inv_r2
            a_newt[i, 2] += gm * dz * inv_r * inv_r2

    if inv_c2 == 0.0:
        return a_newt

    # --- 1PN corrections (explicit a_B -> a_newt)
    for i in range(n):
        vix = vel[i, 0]
        viy = vel[i, 1]
        viz = vel[i, 2]
        vi2 = vix * vix + viy * viy + viz * viz

        for j in range(n):
            if i == j:
                continue
            dx = pos[j, 0] - pos[i, 0]  # x_B - x_A
            dy = pos[j, 1] - pos[i, 1]
            dz = pos[j, 2] - pos[i, 2]
            r2 = dx * dx + dy * dy + dz * dz + eps2
            inv_r = 1.0 / np.sqrt(r2)
            inv_r2 = inv_r * inv_r

            nba_x = dx * inv_r
            nba_y = dy * inv_r
            nba_z = dz * inv_r

            n_ab_x = -nba_x
            n_ab_y = -nba_y
            n_ab_z = -nba_z

            vjx = vel[j, 0]
            vjy = vel[j, 1]
            vjz = vel[j, 2]
            vj2 = vjx * vjx + vjy * vjy + vjz * vjz
            dot_vivj = vix * vjx + viy * vjy + viz * vjz
            dot_nab_vj = n_ab_x * vjx + n_ab_y * vjy + n_ab_z * vjz

            dot_rij_aB = (
                dx * a_newt[j, 0]
                + dy * a_newt[j, 1]
                + dz * a_newt[j, 2]
            )

            bracket = (
                vi2
                + 2.0 * vj2
                - 4.0 * dot_vivj
                - 1.5 * dot_nab_vj * dot_nab_vj
                - 4.0 * phi[i]
                - phi[j]
                + 0.5 * dot_rij_aB
            )

            gm = G * mass[j]
            pref_br = inv_c2 * gm * inv_r2 * bracket

            acc[i, 0] += pref_br * nba_x
            acc[i, 1] += pref_br * nba_y
            acc[i, 2] += pref_br * nba_z

            fourv_ix = 4.0 * vix - 3.0 * vjx
            fourv_iy = 4.0 * viy - 3.0 * vjy
            fourv_iz = 4.0 * viz - 3.0 * vjz
            scalar_n = n_ab_x * fourv_ix + n_ab_y * fourv_iy + n_ab_z * fourv_iz

            dvx = vix - vjx
            dvy = viy - vjy
            dvz = viz - vjz
            pref_v = inv_c2 * gm * inv_r2 * scalar_n
            acc[i, 0] += pref_v * dvx
            acc[i, 1] += pref_v * dvy
            acc[i, 2] += pref_v * dvz

            pref_tail = 3.5 * inv_c2 * gm * inv_r
            acc[i, 0] += pref_tail * a_newt[j, 0]
            acc[i, 1] += pref_tail * a_newt[j, 1]
            acc[i, 2] += pref_tail * a_newt[j, 2]

    for k in range(n):
        acc[k, 0] += a_newt[k, 0]
        acc[k, 1] += a_newt[k, 1]
        acc[k, 2] += a_newt[k, 2]

    return acc

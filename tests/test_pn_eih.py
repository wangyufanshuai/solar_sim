"""Smoke tests for EIH acceleration and RK4 integrator."""

from __future__ import annotations

import math

import astropy.units as u
import numpy as np
import pytest
from astropy.constants import au as au_const

from solar_sim.pn_eih_accel import acceleration_eih
from solar_sim.pn_integrator import (
    default_gravity_and_light_speed,
    integrate_rk4,
    step_rk4,
)


def _newton_reference(pos: np.ndarray, mass: np.ndarray, G: float, eps2: float) -> np.ndarray:
    n = pos.shape[0]
    acc = np.zeros((n, 3), dtype=np.float64)
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            dx = pos[j, 0] - pos[i, 0]
            dy = pos[j, 1] - pos[i, 1]
            dz = pos[j, 2] - pos[i, 2]
            r2 = dx * dx + dy * dy + dz * dz + eps2
            inv_r = 1.0 / math.sqrt(r2)
            inv_r3 = inv_r * inv_r * inv_r
            gm = G * mass[j]
            acc[i, 0] += gm * dx * inv_r3
            acc[i, 1] += gm * dy * inv_r3
            acc[i, 2] += gm * dz * inv_r3
    return acc


def test_inv_c2_zero_matches_newton_reference():
    rng = np.random.default_rng(0)
    n = 8
    pos = rng.normal(scale=1e10, size=(n, 3))
    vel = rng.normal(scale=1e3, size=(n, 3))
    mass = np.abs(rng.normal(scale=1e26, size=n)) + 1e24
    G, _ = default_gravity_and_light_speed()
    eps2 = (1e6) ** 2
    a_ref = _newton_reference(pos, mass, G, eps2)
    a_num = acceleration_eih(pos, vel, mass, G, 0.0, eps2)
    np.testing.assert_allclose(a_num, a_ref, rtol=1e-12, atol=1e-18)


def test_two_body_newton_magnitude():
    """Earth-like distance from Sun: |a| ~ GM/r^2."""
    G, _ = default_gravity_and_light_speed()
    m_sun = 1.98847e30
    m_earth = 5.9722e24
    au = 1.495978707e11
    pos = np.array([[0.0, 0.0, 0.0], [au, 0.0, 0.0]], dtype=np.float64)
    vel = np.zeros((2, 3), dtype=np.float64)
    mass = np.array([m_sun, m_earth], dtype=np.float64)
    a = acceleration_eih(pos, vel, mass, G, 0.0, 0.0)
    expected = G * m_sun / au**2
    np.testing.assert_allclose(np.linalg.norm(a[1]), expected, rtol=1e-9)


def test_equal_mass_binary_energy_drift_newton():
    """RK4 + Newton only: relative energy drift per orbit should stay modest."""
    G = 1.0
    m = 1.0
    d = 2.0
    v0 = math.sqrt(G * m / (2.0 * d))
    pos = np.array([[-d / 2, 0.0, 0.0], [d / 2, 0.0, 0.0]], dtype=np.float64)
    vel = np.array([[0.0, -v0, 0.0], [0.0, v0, 0.0]], dtype=np.float64)
    mass = np.array([m, m], dtype=np.float64)
    inv_c2 = 0.0

    def total_energy(r: np.ndarray, v: np.ndarray) -> float:
        kin = 0.5 * m * np.sum(v[0] ** 2) + 0.5 * m * np.sum(v[1] ** 2)
        dx = r[1, 0] - r[0, 0]
        dy = r[1, 1] - r[0, 1]
        dz = r[1, 2] - r[0, 2]
        r12 = math.sqrt(dx * dx + dy * dy + dz * dz)
        pot = -G * m * m / r12
        return kin + pot

    period = math.pi * d * math.sqrt(2.0 * d / (G * m))
    dt = period / 5000.0
    n_steps = int(round(period / dt))
    rh, vh = integrate_rk4(
        pos,
        vel,
        mass,
        dt,
        n_steps,
        G=G,
        inv_c2=inv_c2,
        eps2=0.0,
        return_trajectory=True,
    )
    e0 = total_energy(rh[0], vh[0])
    energies = np.array([total_energy(rh[k], vh[k]) for k in range(n_steps + 1)])
    rel = np.max(np.abs((energies - e0) / e0))
    assert rel < 5e-5


def test_pn_correction_small_for_sun_mercury():
    """1PN piece should be ~ (v/c)^2 times smaller than Newton for inner planet."""
    G, c = default_gravity_and_light_speed()
    m_sun = 1.98847e30
    m_merc = 3.301e23
    au = 1.495978707e11
    r_merc = 0.387 * au
    v_orb = 47.36e3
    pos = np.array([[0.0, 0.0, 0.0], [r_merc, 0.0, 0.0]], dtype=np.float64)
    vel = np.array([[0.0, 0.0, 0.0], [0.0, v_orb, 0.0]], dtype=np.float64)
    mass = np.array([m_sun, m_merc], dtype=np.float64)
    a_new = acceleration_eih(pos, vel, mass, G, 0.0, 0.0)
    a_full = acceleration_eih(pos, vel, mass, G, 1.0 / (c * c), 0.0)
    delta = np.linalg.norm(a_full[1] - a_new[1])
    newt = np.linalg.norm(a_new[1])
    assert delta / newt < 5e-7
    assert delta / newt > 1e-9


def test_horizons_df_to_si_columns():
    import pandas as pd

    from solar_sim.units import au_per_day_to_m_per_s, horizons_df_to_si

    df = pd.DataFrame(
        {
            "x_au": [1.0, 0.0],
            "y_au": [0.0, 0.0],
            "z_au": [0.0, 0.0],
            "vx_au_d": [0.0, 0.0],
            "vy_au_d": [0.0, 1.0],
            "vz_au_d": [0.0, 0.0],
        }
    )
    r, v = horizons_df_to_si(df)
    assert abs(r[0, 0] - au_const.to_value(u.m)) < 1.0
    assert abs(v[1, 1] - au_per_day_to_m_per_s(1.0)) < 1.0

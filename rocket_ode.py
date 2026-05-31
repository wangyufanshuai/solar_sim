"""
Rocket ODE right-hand side for scipy.integrate.solve_ivp.

State vector: y = [x, y, z, vx, vy, vz, m]  (7 elements, SI units)

Forces:
  - Newtonian point-mass gravity (dynamic, not constant g)
  - Variable-mass thrust (Tsiolkovsky / mass flow)
  - Exponential atmospheric drag with Earth rotation

Relativistic interface:
  γ = 1/√(1 − v²/c²) is computed and applied as a multiplier in the velocity
  derivative: dv/dt = γ³ · a_total.  At chemical rocket speeds (v/c ~ 10⁻⁵) this
  factor is ~1.0, but the architecture is ready for future sub-light expansion.
"""

from __future__ import annotations

from typing import Callable

import numpy as np

from .rocket_atmosphere import ExponentialAtmosphere
from .rocket_engine import RocketEngine

# Earth rotation rate [rad/s]
_EARTH_ROT_RATE = 7.2921159e-5


def rocket_ode(
    t: float,
    y: np.ndarray,
    engine: RocketEngine,
    atmosphere: ExponentialAtmosphere,
    central_body_mass_kg: float,
    G: float,
    c_light: float,
    thrust_direction_fn: Callable[[float, np.ndarray, np.ndarray, str], np.ndarray],
    phase_fn: Callable[[float, np.ndarray, np.ndarray], str],
    earth_rotation: bool = True,
    relativistic: bool = True,
) -> np.ndarray:
    """ODE right-hand side for rocket trajectory integration.

    Args:
        t: Current mission time [s].
        y: State vector [x, y, z, vx, vy, vz, m] in SI (Earth-centered inertial).
        engine: RocketEngine instance for thrust/mass computations.
        atmosphere: ExponentialAtmosphere for density and drag.
        central_body_mass_kg: Mass of central body (Earth) [kg].
        G: Gravitational constant [m³ kg⁻¹ s⁻²].
        c_light: Speed of light [m/s].
        thrust_direction_fn: Callable(t, r, v, phase) -> unit direction vector (3,).
        phase_fn: Callable(t, r, v) -> flight phase string.
        earth_rotation: Whether to include Earth rotation in relative velocity for drag.
        relativistic: Whether to include Lorentz factor in velocity derivative.

    Returns:
        dy/dt array of shape (7,).
    """
    r = y[0:3]
    v = y[3:6]
    m = y[6]

    r_norm = np.linalg.norm(r)
    v_norm = np.linalg.norm(v)
    altitude = r_norm - atmosphere.R_body

    # ── Gravity (Newtonian point-mass, dynamic) ──
    if r_norm > 1.0:
        a_grav = -G * central_body_mass_kg / (r_norm ** 3) * r
    else:
        a_grav = np.zeros(3)

    # ── Thrust ──
    phase = phase_fn(t, r, v)
    thrust_mag = engine.current_thrust(t)
    if thrust_mag > 0.0 and m > 1.0:
        thrust_dir = thrust_direction_fn(t, r, v, phase)
        a_thrust = (thrust_mag / m) * thrust_dir
    else:
        a_thrust = np.zeros(3)

    # ── Atmospheric drag ──
    if altitude < atmosphere.thermo_ceiling and v_norm > 0.0:
        # Relative velocity accounts for Earth rotation
        if earth_rotation and altitude < atmosphere.tropo_ceiling:
            # Atmosphere co-rotates with Earth: v_atm = omega × r
            v_atm = np.array([
                -_EARTH_ROT_RATE * r[1],
                 _EARTH_ROT_RATE * r[0],
                 0.0,
            ])
            v_rel = v - v_atm
        else:
            v_rel = v

        v_rel_norm = np.linalg.norm(v_rel)
        if v_rel_norm > 0.0:
            rho = atmosphere.density(max(altitude, 0.0))
            Cd = engine.current_Cd(t)
            A = engine.current_cross_section(t)
            a_drag = -0.5 * rho * Cd * A / m * v_rel_norm * v_rel
        else:
            a_drag = np.zeros(3)
    else:
        a_drag = np.zeros(3)

    # ── Total classical acceleration ──
    a_total = a_grav + a_thrust + a_drag

    # ── Relativistic interface ──
    # Lorentz factor γ = 1/√(1 − v²/c²)
    # dv/dt_rel = γ³ · a_total (longitudinal acceleration in SR)
    # At v/c ~ 10⁻⁵ (chemical rockets), γ ≈ 1.0000000001, essentially unity.
    # This interface is architecturally preserved for sub-light expansion.
    if relativistic and c_light > 0.0:
        beta2 = (v_norm / c_light) ** 2
        if beta2 < 1.0:
            gamma = 1.0 / np.sqrt(1.0 - beta2)
            gamma3 = gamma ** 3
        else:
            gamma3 = 1.0  # safety fallback
        a_velocity = gamma3 * a_total
    else:
        a_velocity = a_total
        gamma = 1.0

    # ── Mass derivative (Tsiolkovsky) ──
    dm_dt = -engine.mass_flow_rate(t)

    dydt = np.zeros(7)
    dydt[0:3] = v            # dr/dt = v
    dydt[3:6] = a_velocity   # dv/dt = γ³ · (gravity + thrust + drag)
    dydt[6] = dm_dt          # dm/dt = -ṁ

    return dydt


def default_phase_fn(t: float, r: np.ndarray, v: np.ndarray) -> str:
    """Simple phase determination based on mission time and altitude.

    This is a simplified version; the full autopilot phase logic lives in
    the frontend's spacecraftAutopilot.ts. This provides enough for the ODE
    to steer the rocket through a standard gravity-turn ascent.
    """
    r_norm = np.linalg.norm(r)
    altitude = r_norm - 6_378_137
    v_norm = np.linalg.norm(v)

    if t < 10:
        return "verticalRise"
    if altitude < 150_000:
        return "gravityTurn"
    if altitude < 200_000:
        return "circularization"
    return "coast"

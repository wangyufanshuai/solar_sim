"""
High-level launch simulation driver wrapping scipy.integrate.solve_ivp.

Provides:
  - Pre-computation of the entire trajectory via dense_output
  - Event detection: Max-Q, stage separation, orbit insertion
  - 1ms telemetry stream generator for WebSocket broadcasting
  - Launch site initial conditions (lat/lon -> ECI position/velocity)
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from scipy.integrate import solve_ivp

from .nasa_planetary_masses_kg import EARTH_KG
from .rocket_atmosphere import ExponentialAtmosphere
from .rocket_engine import RocketEngine, create_falcon9, create_saturn_v
from .rocket_ode import default_phase_fn, rocket_ode

# Constants
_G = 6.6743e-11       # m³ kg⁻¹ s⁻² (CODATA 2018)
_C_LIGHT = 299792458  # m/s
_EARTH_RADIUS = 6_378_137  # m (equatorial)
_EARTH_ROT_RATE = 7.2921159e-5  # rad/s


@dataclass
class LaunchSite:
    """Launch site definition."""

    name: str
    lat_deg: float
    lon_deg: float
    altitude_m: float = 0.0


# Pre-defined launch sites
LAUNCH_SITES = {
    "cape_canaveral": LaunchSite("Cape Canaveral", 28.5, -80.6),
    "kennedy": LaunchSite("Kennedy Space Center", 28.57, -80.65),
    "baikonur": LaunchSite("Baikonur", 45.6, 63.3),
    "vandenberg": LaunchSite("Vandenberg", 34.7, -120.6),
    "xichang": LaunchSite("Xichang", 28.25, 102.03),
}


@dataclass
class LaunchEvent:
    """A notable event during launch."""

    event_type: str  # "maxQ", "staging", "orbitInsertion", "engineCutoff"
    t: float         # mission time [s]
    altitude_m: float
    velocity_m_s: float
    data: dict = field(default_factory=dict)


@dataclass
class LaunchResult:
    """Result of a complete launch simulation."""

    success: bool
    trajectory: np.ndarray  # (N, 7) array: [x,y,z,vx,vy,vz,m] at each time step
    times: np.ndarray       # (N,) time array [s]
    events: list[LaunchEvent]
    dense_solution: object  # scipy OdeSolution for interpolation
    final_altitude_m: float
    final_velocity_m_s: float
    max_q_pa: float
    max_q_time_s: float
    max_q_altitude_m: float


@dataclass
class TelemetryFrame:
    """Single telemetry sample at a given time."""

    t: float
    x: float
    y: float
    z: float
    vx: float
    vy: float
    vz: float
    mass_kg: float
    mach: float
    altitude_m: float
    dynamic_pressure_pa: float
    lorentz_gamma: float


def _launch_site_to_eci(
    site: LaunchSite, earth_radius: float = _EARTH_RADIUS
) -> tuple[np.ndarray, np.ndarray]:
    """Convert launch site lat/lon to ECI position and velocity.

    Returns:
        (position [m], velocity [m/s]) in Earth-centered inertial frame.
        Assumes Earth's rotation axis is along Z, and the site is at t=0
        with the prime meridian along X.
    """
    lat = np.radians(site.lat_deg)
    lon = np.radians(site.lon_deg)
    R = earth_radius + site.altitude_m

    # Position in ECI (Earth fixed at t=0)
    x = R * np.cos(lat) * np.cos(lon)
    y = R * np.cos(lat) * np.sin(lon)
    z = R * np.sin(lat)
    pos = np.array([x, y, z])

    # Velocity from Earth rotation: v = omega × r
    omega = np.array([0.0, 0.0, _EARTH_ROT_RATE])
    vel = np.cross(omega, pos)

    return pos, vel


class LaunchSimulator:
    """Wraps scipy solve_ivp for rocket launch trajectory computation."""

    def __init__(
        self,
        engine: RocketEngine | None = None,
        atmosphere: ExponentialAtmosphere | None = None,
        central_body_mass_kg: float = EARTH_KG,
        launch_site: LaunchSite | None = None,
        target_orbit_altitude_m: float = 185_000,
    ):
        self.engine = engine or create_falcon9()
        self.atmosphere = atmosphere or ExponentialAtmosphere()
        self.M_central = central_body_mass_kg
        self.launch_site = launch_site or LAUNCH_SITES["cape_canaveral"]
        self.target_altitude = target_orbit_altitude_m

    def _initial_conditions(self) -> np.ndarray:
        """Compute y0 = [x, y, z, vx, vy, vz, m] from launch site."""
        pos, vel = _launch_site_to_eci(self.launch_site, self.atmosphere.R_body)
        m0 = self.engine.total_mass(0.0)
        y0 = np.zeros(7)
        y0[0:3] = pos
        y0[3:6] = vel
        y0[6] = m0
        return y0

    def simulate(
        self,
        t_span: tuple[float, float] | None = None,
        method: str = "RK45",
        max_step: float = 0.1,
        dense_output: bool = True,
    ) -> LaunchResult:
        """Run the full launch simulation.

        Args:
            t_span: (t_start, t_end) in seconds. Default: (0, total_burn_time + 600).
            method: scipy solver method (RK45, DOP853, Radau, etc.).
            max_step: Maximum integration step size [s].
            dense_output: Whether to compute dense output for interpolation.

        Returns:
            LaunchResult with trajectory, events, and dense solution.
        """
        if t_span is None:
            # Simulate burn + 10 min coast
            t_end = self.engine.total_burn_time + 600
            t_span = (0.0, t_end)

        y0 = self._initial_conditions()
        events_list: list[LaunchEvent] = []
        max_q_tracker = {"q": 0.0, "t": 0.0, "alt": 0.0, "prev_q": -1.0}

        def ode_wrapper(t, y):
            return rocket_ode(
                t, y,
                engine=self.engine,
                atmosphere=self.atmosphere,
                central_body_mass_kg=self.M_central,
                G=_G,
                c_light=_C_LIGHT,
                thrust_direction_fn=self.engine.thrust_direction,
                phase_fn=default_phase_fn,
            )

        # Track dynamic pressure for Max-Q detection
        def track_max_q(t, y):
            """Event: zero crossing of dQ/dt (peak of dynamic pressure)."""
            r_norm = np.linalg.norm(y[0:3])
            alt = r_norm - self.atmosphere.R_body
            if alt > self.atmosphere.thermo_ceiling:
                return 1.0  # positive, no event
            v_norm = np.linalg.norm(y[3:6])
            rho = self.atmosphere.density(max(alt, 0.0))
            q = 0.5 * rho * v_norm * v_norm
            # Detect when Q starts decreasing (was rising, now falling)
            if max_q_tracker["prev_q"] < 0:
                max_q_tracker["prev_q"] = q
                return 1.0
            dq = q - max_q_tracker["prev_q"]
            max_q_tracker["prev_q"] = q
            if q > max_q_tracker["q"]:
                max_q_tracker["q"] = q
                max_q_tracker["t"] = t
                r_norm2 = np.linalg.norm(y[0:3])
                max_q_tracker["alt"] = r_norm2 - self.atmosphere.R_body
            return dq

        track_max_q.terminal = False
        track_max_q.direction = -1  # detect transition from rising to falling

        # Orbit insertion: altitude crosses target and radial velocity is small
        def orbit_insertion(t, y):
            r_norm = np.linalg.norm(y[0:3])
            alt = r_norm - self.atmosphere.R_body
            return alt - self.target_altitude

        orbit_insertion.terminal = False
        orbit_insertion.direction = 1  # crossing upward

        sol = solve_ivp(
            ode_wrapper,
            t_span,
            y0,
            method=method,
            max_step=max_step,
            dense_output=dense_output,
            events=[track_max_q, orbit_insertion],
            rtol=1e-9,
            atol=1e-12,
        )

        # Collect events
        events: list[LaunchEvent] = []

        if max_q_tracker["q"] > 0:
            events.append(LaunchEvent(
                event_type="maxQ",
                t=max_q_tracker["t"],
                altitude_m=max_q_tracker["alt"],
                velocity_m_s=0.0,  # filled from trajectory
                data={"dynamic_pressure_pa": max_q_tracker["q"]},
            ))

        # Stage separation events
        for sch in self.engine._schedule:
            events.append(LaunchEvent(
                event_type="staging",
                t=sch.t_end,
                altitude_m=0.0,  # filled from trajectory
                velocity_m_s=0.0,
                data={"stage_index": sch.stage_index},
            ))

        # Fill altitude/velocity from trajectory for stage events
        if sol.t is not None and len(sol.t) > 0:
            for ev in events:
                if ev.altitude_m == 0.0 and ev.t <= sol.t[-1]:
                    state = sol.sol(ev.t)
                    r_norm = np.linalg.norm(state[0:3])
                    v_norm = np.linalg.norm(state[3:6])
                    ev.altitude_m = r_norm - self.atmosphere.R_body
                    ev.velocity_m_s = v_norm

        # Final state
        final_state = sol.y[:, -1]
        final_alt = np.linalg.norm(final_state[0:3]) - self.atmosphere.R_body
        final_vel = np.linalg.norm(final_state[3:6])

        return LaunchResult(
            success=sol.success,
            trajectory=sol.y.T,  # (N, 7)
            times=sol.t,
            events=events,
            dense_solution=sol.sol,
            final_altitude_m=final_alt,
            final_velocity_m_s=final_vel,
            max_q_pa=max_q_tracker["q"],
            max_q_time_s=max_q_tracker["t"],
            max_q_altitude_m=max_q_tracker["alt"],
        )

    def telemetry_stream(self, result: LaunchResult, dt: float = 0.001):
        """Generate telemetry frames at dt intervals from the dense solution.

        Args:
            result: LaunchResult from simulate().
            dt: Time step [s] between frames (default 1ms).

        Yields:
            TelemetryFrame at each time step.
        """
        sol = result.dense_solution
        t_start = result.times[0]
        t_end = result.times[-1]

        t = t_start
        while t <= t_end:
            state = sol(t)
            r = state[0:3]
            v = state[3:6]
            m = state[6]

            r_norm = np.linalg.norm(r)
            v_norm = np.linalg.norm(v)
            alt = r_norm - self.atmosphere.R_body

            # Mach number
            mach = self.atmosphere.mach_number(max(alt, 0.0), v_norm)

            # Dynamic pressure
            Cd = self.engine.current_Cd(t)
            A = self.engine.current_cross_section(t)
            q = self.atmosphere.dynamic_pressure(max(alt, 0.0), v_norm, Cd, A)

            # Lorentz factor
            beta2 = (v_norm / _C_LIGHT) ** 2
            if beta2 < 1.0:
                gamma = 1.0 / np.sqrt(1.0 - beta2)
            else:
                gamma = float("inf")

            yield TelemetryFrame(
                t=t,
                x=r[0], y=r[1], z=r[2],
                vx=v[0], vy=v[1], vz=v[2],
                mass_kg=m,
                mach=mach,
                altitude_m=alt,
                dynamic_pressure_pa=q,
                lorentz_gamma=gamma,
            )

            t += dt

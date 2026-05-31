"""
Variable-mass thrust model based on the Tsiolkovsky rocket equation.

Manages multi-stage rockets with per-stage thrust, specific impulse,
propellant mass, and aerodynamic coefficients. Mass is an ODE state variable:
state vector = [x, y, z, vx, vy, vz, m]  (7 elements).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

# Standard gravity for Isp conversion
_G0 = 9.80665  # m/s^2


@dataclass
class RocketStage:
    """Single rocket stage parameters."""

    thrust_N: float            # Sea-level (or vacuum) thrust [N]
    isp_s: float               # Specific impulse [s]
    propellant_mass_kg: float  # Usable propellant mass [kg]
    dry_mass_kg: float         # Structural mass (including payload for last stage) [kg]
    burn_duration_s: float     # Total burn time at rated thrust [s]
    Cd: float = 0.3            # Drag coefficient
    cross_section_area_m2: float = 10.0  # Cross-sectional area [m^2]

    @property
    def mass_flow_rate(self) -> float:
        """Propellant mass flow rate [kg/s] = thrust / (Isp * g0)."""
        return self.thrust_N / (self.isp_s * _G0)

    @property
    def initial_mass(self) -> float:
        return self.dry_mass_kg + self.propellant_mass_kg


@dataclass
class StageSchedule:
    """Pre-computed stage timing for a multi-stage rocket."""

    stage_index: int
    t_start: float  # ignition time [s]
    t_end: float    # burnout time [s]


class RocketEngine:
    """Multi-stage rocket engine manager.

    Computes thrust, mass flow rate, and total mass as functions of time.
    """

    def __init__(self, stages: list[RocketStage], stage_order: list[int] | None = None):
        """
        Args:
            stages: List of RocketStage definitions.
            stage_order: Optional ordering of stages (default: sequential 0, 1, 2, ...).
                         Use for parallel booster scenarios.
        """
        self.stages = stages
        if stage_order is None:
            stage_order = list(range(len(stages)))
        self.stage_order = stage_order
        self._schedule = self._build_schedule()
        self._total_initial_mass = sum(s.initial_mass for s in stages)

    def _build_schedule(self) -> list[StageSchedule]:
        """Compute burn start/end times for each stage (sequential)."""
        schedule: list[StageSchedule] = []
        t = 0.0
        for idx in self.stage_order:
            stage = self.stages[idx]
            schedule.append(StageSchedule(
                stage_index=idx,
                t_start=t,
                t_end=t + stage.burn_duration_s,
            ))
            t += stage.burn_duration_s
        return schedule

    def _active_stage(self, t: float) -> StageSchedule | None:
        """Return the currently burning stage schedule, or None if coasting."""
        for sch in self._schedule:
            if sch.t_start <= t < sch.t_end:
                return sch
        return None

    def _stage_at_index(self, idx: int) -> RocketStage:
        return self.stages[idx]

    def current_thrust(self, t: float) -> float:
        """Thrust magnitude [N] at time t."""
        sch = self._active_stage(t)
        if sch is None:
            return 0.0
        return self._stage_at_index(sch.stage_index).thrust_N

    def mass_flow_rate(self, t: float) -> float:
        """Propellant consumption rate [kg/s] at time t."""
        sch = self._active_stage(t)
        if sch is None:
            return 0.0
        return self._stage_at_index(sch.stage_index).mass_flow_rate

    def total_mass(self, t: float) -> float:
        """Total vehicle mass [kg] at time t.

        Integrates propellant consumption across all stages.
        Stages that have burned out contribute only dry mass.
        """
        mass = 0.0
        for sch in self._schedule:
            stage = self._stage_at_index(sch.stage_index)
            if t < sch.t_start:
                # Stage not yet ignited: full mass (propellant + dry)
                mass += stage.initial_mass
            elif t < sch.t_end:
                # Currently burning: partial propellant consumed
                elapsed = t - sch.t_start
                consumed = stage.mass_flow_rate * elapsed
                consumed = min(consumed, stage.propellant_mass_kg)
                mass += stage.dry_mass_kg + (stage.propellant_mass_kg - consumed)
            else:
                # Burned out: only dry mass remains
                mass += stage.dry_mass_kg
        return mass

    def current_Cd(self, t: float) -> float:
        """Drag coefficient of the active stage."""
        sch = self._active_stage(t)
        if sch is None:
            # Coast phase: use last stage's Cd
            return self.stages[self.stage_order[-1]].Cd
        return self._stage_at_index(sch.stage_index).Cd

    def current_cross_section(self, t: float) -> float:
        """Cross-sectional area of the active stage [m^2]."""
        sch = self._active_stage(t)
        if sch is None:
            return self.stages[self.stage_order[-1]].cross_section_area_m2
        return self._stage_at_index(sch.stage_index).cross_section_area_m2

    @property
    def total_burn_time(self) -> float:
        """Total powered flight duration [s]."""
        if not self._schedule:
            return 0.0
        return self._schedule[-1].t_end

    def thrust_direction(
        self, t: float, r: np.ndarray, v: np.ndarray, phase: str
    ) -> np.ndarray:
        """Compute unit thrust direction vector (3,) based on flight phase.

        Args:
            t: Mission elapsed time [s].
            r: Position vector [m] (ECI or heliocentric).
            v: Velocity vector [m/s].
            phase: Flight phase string from autopilot.
        """
        if phase == "verticalRise":
            # Thrust along local vertical (radial outward from Earth center)
            r_norm = np.linalg.norm(r)
            if r_norm < 1.0:
                return np.array([0.0, 0.0, 1.0])
            return r / r_norm

        if phase == "gravityTurn":
            # Gravity turn: blend from vertical to prograde over time
            # Simple implementation: thrust along velocity vector (prograde)
            v_norm = np.linalg.norm(v)
            if v_norm < 1.0:
                r_norm = np.linalg.norm(r)
                return r / r_norm if r_norm > 1.0 else np.array([0.0, 0.0, 1.0])
            return v / v_norm

        if phase == "circularization":
            # Thrust prograde (along velocity)
            v_norm = np.linalg.norm(v)
            if v_norm < 1.0:
                return np.array([1.0, 0.0, 0.0])
            return v / v_norm

        # Default: prograde
        v_norm = np.linalg.norm(v)
        if v_norm < 1.0:
            return np.array([1.0, 0.0, 0.0])
        return v / v_norm


def create_saturn_v() -> RocketEngine:
    """Create a Saturn V–class launch vehicle model.

    Three-stage vehicle with approximate S-IC, S-II, S-IVB parameters.
    """
    stage_1 = RocketStage(
        thrust_N=35_100_000,     # ~35.1 MN (S-IC, sea-level)
        isp_s=263,               # Sea-level Isp [s]
        propellant_mass_kg=2_160_000,
        dry_mass_kg=131_000,
        burn_duration_s=168,     # ~2.8 min
        Cd=0.3,
        cross_section_area_m2=19.6,  # 10m diameter
    )
    stage_2 = RocketStage(
        thrust_N=5_141_000,      # ~5.14 MN (S-II, vacuum)
        isp_s=421,               # Vacuum Isp [s]
        propellant_mass_kg=456_100,
        dry_mass_kg=36_000,
        burn_duration_s=360,     # ~6 min
        Cd=0.2,
        cross_section_area_m2=19.6,
    )
    stage_3 = RocketStage(
        thrust_N=1_000_000,      # ~1.0 MN (S-IVB, vacuum)
        isp_s=421,               # Vacuum Isp [s]
        propellant_mass_kg=105_200,
        dry_mass_kg=13_300 + 47_000,  # dry + payload (~47t to LEO)
        burn_duration_s=500,     # extended burn for orbit insertion
        Cd=0.15,
        cross_section_area_m2=6.16,  # 6.6m diameter
    )
    return RocketEngine(stages=[stage_1, stage_2, stage_3])


def create_falcon9() -> RocketEngine:
    """Create a Falcon 9–class launch vehicle model.

    Two-stage vehicle with approximate parameters.
    """
    stage_1 = RocketStage(
        thrust_N=7_607_000,      # ~7.6 MN (Merlin 1D x 9, sea-level)
        isp_s=282,               # Sea-level Isp [s]
        propellant_mass_kg=395_700,
        dry_mass_kg=22_200,
        burn_duration_s=162,     # ~2.7 min
        Cd=0.25,
        cross_section_area_m2=12.6,  # 3.7m fairing
    )
    stage_2 = RocketStage(
        thrust_N=934_000,        # ~934 kN (Merlin 1D Vacuum)
        isp_s=348,               # Vacuum Isp [s]
        propellant_mass_kg=107_500,
        dry_mass_kg=4_000 + 22_800,  # dry + payload (~22.8t to LEO)
        burn_duration_s=397,
        Cd=0.15,
        cross_section_area_m2=12.6,
    )
    return RocketEngine(stages=[stage_1, stage_2])

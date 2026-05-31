"""
Exponential atmospheric density model for Earth (and optionally other bodies).

Multi-layer model:
  - 0–100 km: standard exponential with sea-level scale height
  - 100–600 km: extended thermosphere with larger scale height
  - > 600 km: negligible (free molecular flow, ~0)

ISA temperature model for Mach number computation included.
"""

from __future__ import annotations

import numpy as np


# Earth defaults
_RHO0_SEA_LEVEL = 1.225       # kg/m^3 at sea level
_SCALE_HEIGHT_TROPO = 8_500   # m (troposphere + lower stratosphere)
_SCALE_HEIGHT_THERMO = 25_000 # m (thermosphere, 100–600 km)
_EARTH_RADIUS_M = 6_378_137

# ISA constants for Mach number
_ISA_T0 = 288.15              # K at sea level
_ISA_LAPSE_RATE = 0.0065      # K/m below tropopause
_ISA_T_TROPOPAUSE = 216.65    # K (constant above 11 km up to ~47 km simplified)
_ISA_GAMMA_AIR = 1.4          # ratio of specific heats for dry air
_ISA_R_AIR = 287.058          # J/(kg·K) specific gas constant for dry air


class ExponentialAtmosphere:
    """Multi-layer exponential atmospheric density model."""

    def __init__(
        self,
        rho0: float = _RHO0_SEA_LEVEL,
        scale_height_tropo: float = _SCALE_HEIGHT_TROPO,
        scale_height_thermo: float = _SCALE_HEIGHT_THERMO,
        body_radius_m: float = _EARTH_RADIUS_M,
        tropo_ceiling_m: float = 100_000,
        thermo_ceiling_m: float = 600_000,
    ):
        self.rho0 = rho0
        self.H_tropo = scale_height_tropo
        self.H_thermo = scale_height_thermo
        self.R_body = body_radius_m
        self.tropo_ceiling = tropo_ceiling_m
        self.thermo_ceiling = thermo_ceiling_m

    def density(self, altitude_m: float) -> float:
        """Atmospheric density [kg/m^3] at given altitude above surface.

        Uses a piecewise exponential model:
          h < 100 km: rho0 * exp(-h / H_tropo)
          100–600 km: rho_100km * exp(-(h - 100km) / H_thermo)
          h > 600 km: ~0
        """
        if altitude_m < 0:
            return self.rho0
        if altitude_m > self.thermo_ceiling:
            return 0.0
        if altitude_m <= self.tropo_ceiling:
            return self.rho0 * np.exp(-altitude_m / self.H_tropo)
        # thermosphere layer
        rho_at_tropo_ceiling = self.rho0 * np.exp(-self.tropo_ceiling / self.H_tropo)
        return rho_at_tropo_ceiling * np.exp(
            -(altitude_m - self.tropo_ceiling) / self.H_thermo
        )

    def dynamic_pressure(
        self, altitude_m: float, speed_m_s: float, Cd: float, A: float
    ) -> float:
        """Dynamic pressure Q = 0.5 * Cd * A * rho * v^2 [Pa]."""
        rho = self.density(altitude_m)
        return 0.5 * Cd * A * rho * speed_m_s * speed_m_s

    def temperature(self, altitude_m: float) -> float:
        """ISA temperature model [K] for Mach number computation.

        Simplified:
          h < 11 km: T = T0 - lapse_rate * h
          h >= 11 km: T = T_tropopause (constant)
        """
        if altitude_m < 11_000:
            return _ISA_T0 - _ISA_LAPSE_RATE * altitude_m
        return _ISA_T_TROPOPAUSE

    def speed_of_sound(self, altitude_m: float) -> float:
        """Speed of sound [m/s] at given altitude using ISA temperature."""
        T = self.temperature(altitude_m)
        return np.sqrt(_ISA_GAMMA_AIR * _ISA_R_AIR * T)

    def mach_number(self, altitude_m: float, speed_m_s: float) -> float:
        """Mach number = v / a(h)."""
        a = self.speed_of_sound(altitude_m)
        if a < 1e-6:
            return 0.0
        return speed_m_s / a

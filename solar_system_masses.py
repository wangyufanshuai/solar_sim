"""
Masses [kg] for the default Horizons body list (planet centers / Sun).

Order matches ``DEFAULT_BODIES`` in ``horizons_ephemeris.py``:
Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.

Values: ``astropy.constants`` (``M_sun``, ``M_earth``, ``M_jup``) where
available; otherwise NASA planetary fact-sheet masses (Pluto: dwarf-planet scale).
"""

from __future__ import annotations

import numpy as np
import astropy.units as u
from astropy.constants import M_earth, M_jup, M_sun

# NASA fact sheet / IAU-scale masses when not in astropy (kg)
_MERCURY_KG = 3.30104e23
_VENUS_KG = 4.86732e24
_MARS_KG = 6.4171e23
_SATURN_KG = 5.68319e26
_URANUS_KG = 8.68103e25
_NEPTUNE_KG = 1.02413e26
_PLUTO_KG = 1.303e22

DEFAULT_MASSES_KG: np.ndarray = np.array(
    [
        M_sun.to_value(u.kg),
        _MERCURY_KG,
        _VENUS_KG,
        M_earth.to_value(u.kg),
        _MARS_KG,
        M_jup.to_value(u.kg),
        _SATURN_KG,
        _URANUS_KG,
        _NEPTUNE_KG,
        _PLUTO_KG,
    ],
    dtype=np.float64,
)


def default_mass_kg_array() -> np.ndarray:
    """Copy of the default 10-body mass vector [kg]."""
    return DEFAULT_MASSES_KG.copy()

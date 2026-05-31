"""Convert Horizons DataFrame columns (AU, AU/day) to SI (m, m/s)."""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np
import astropy.units as u
from astropy.constants import au as au_const

if TYPE_CHECKING:
    import pandas as pd


def au_per_day_to_m_per_s(au_d: float | np.ndarray) -> float | np.ndarray:
    """Horizons vector rate AU/day -> m/s."""
    return (au_d * au_const / u.day).to_value(u.m / u.s)


def au_to_m(au: float | np.ndarray) -> float | np.ndarray:
    return (au * au_const).to_value(u.m)


def horizons_df_to_si(
    df: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Extract Cartesian state from a Horizons-style DataFrame.

    Expects columns ``x_au``, ``y_au``, ``z_au``, ``vx_au_d``, ``vy_au_d``, ``vz_au_d``.

    Returns
    -------
    r_m : (N, 3) float64
    v_m_s : (N, 3) float64
    """
    cols_pos = ["x_au", "y_au", "z_au"]
    cols_vel = ["vx_au_d", "vy_au_d", "vz_au_d"]
    for c in cols_pos + cols_vel:
        if c not in df.columns:
            raise KeyError(f"DataFrame missing column {c!r}")

    r_au = df[cols_pos].to_numpy(dtype=np.float64)
    v_au_d = df[cols_vel].to_numpy(dtype=np.float64)
    r_m = au_to_m(r_au)
    v_m_s = au_per_day_to_m_per_s(v_au_d)
    return r_m, v_m_s

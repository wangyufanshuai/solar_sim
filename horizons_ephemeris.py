"""
JPL Horizons state vectors for the Sun, planets, major moons, and selected small bodies.

Fetches Cartesian position and velocity from NASA JPL Horizons via astroquery.
Epochs for vector queries use **TDB** (Barycentric Dynamical Time), consistent with
Horizons documentation.

Units in the returned DataFrame are **AU** for positions and **AU/day** for
velocities, matching Horizons vector-table conventions (verify column units in
the Astropy table if upstream changes).

**Reference frame:** ``refplane='ecliptic'`` uses the ecliptic and ICRF-equivalent
axes as defined by Horizons (see the Horizons user manual). Results are numerical
ephemerides from a JPL planetary ephemeris (e.g. DE440); they are model-based, not
direct measurements.

**Coordinate origin:**
  - ``origin='sun'`` — Sun body center (astroquery default for vectors when
    ``location`` is omitted).
  - ``origin='ssb'`` — Solar System Barycenter; ``location`` is set to Horizons
    center code ``500@0`` (see https://ssd.jpl.nasa.gov/horizons/manual.html#center ).
"""

from __future__ import annotations

import time
from typing import Any, Literal, TypeAlias

import numpy as np
import pandas as pd
from astropy.time import Time
from astropy.units import Quantity
from astroquery.jplhorizons import Horizons

# Horizons major-body IDs (planet centers / Sun center)
DEFAULT_BODIES: list[tuple[str, int]] = [
    ("Sun", 10),
    ("Mercury", 199),
    ("Venus", 299),
    ("Earth", 399),
    ("Mars", 499),
    ("Jupiter", 599),
    ("Saturn", 699),
    ("Uranus", 799),
    ("Neptune", 899),
    ("Pluto", 999),
]

# Matches `next-web` `SOLAR_SYSTEM_BODIES` order (Sun + planets + Moon + extensions).
# Moon 301: heliocentric state with origin='sun' (Sun body center).
# Ceres: Horizons small-body id "1" + id_type smallbody (bare 1 can resolve incorrectly).
FRONTEND_BODIES: list[BodyQuery] = [
    ("Sun", 10),
    ("Mercury", 199),
    ("Venus", 299),
    ("Earth", 399),
    ("Moon", 301),
    ("Mars", 499),
    ("Jupiter", 599),
    ("Saturn", 699),
    ("Uranus", 799),
    ("Neptune", 899),
    ("Pluto", 999),
    ("Ceres", "1", "smallbody"),
    ("Io", 501),
    ("Europa", 502),
    ("Ganymede", 503),
    ("Callisto", 504),
    ("Titan", 606),
    ("Enceladus", 602),
    # Saturn (major icy moons; 602/606 already above)
    ("Mimas", 601),
    ("Tethys", 603),
    ("Dione", 604),
    ("Rhea", 605),
    ("Hyperion", 607),
    ("Iapetus", 608),
    # Jupiter inner + Mars + Uranus + Neptune satellites
    ("Amalthea", 505),
    ("Phobos", 401),
    ("Deimos", 402),
    ("Ariel", 701),
    ("Umbriel", 702),
    ("Titania", 703),
    ("Oberon", 704),
    ("Miranda", 705),
    ("Triton", 801),
    ("Proteus", 808),
    ("Charon", 901),
    # Large TNOs / main-belt (MPC numbers, smallbody)
    ("Eris", "136199", "smallbody"),
    ("Makemake", "136472", "smallbody"),
    ("Haumea", "136108", "smallbody"),
    ("Gonggong", "225088", "smallbody"),
    ("Quaoar", "50000", "smallbody"),
    ("Sedna", "90377", "smallbody"),
    ("Orcus", "90482", "smallbody"),
    ("Salacia", "120347", "smallbody"),
    ("Vesta", "4", "smallbody"),
    ("Pallas", "2", "smallbody"),
    ("Hygiea", "10", "smallbody"),
    # —— toward ~100 bodies: more Jovian / Saturnian / ice-giant moons + asteroids + TNOs
    ("Thebe", 514),
    ("Metis", 553),
    ("Adrastea", 554),
    ("Himalia", 506),
    ("Elara", 507),
    ("Pasiphae", 508),
    ("Sinope", 509),
    ("Lysithea", 510),
    ("Carme", 511),
    ("Phoebe", 609),
    ("Janus", 610),
    ("Epimetheus", 611),
    ("Helene", 612),
    ("Telesto", 613),
    ("Calypso", 614),
    ("Atlas", 615),
    ("Prometheus", 616),
    ("Pandora", 617),
    ("Pan", 618),
    ("Daphnis", 634),
    ("Cordelia", 706),
    ("Ophelia", 707),
    ("Bianca", 708),
    ("Portia", 712),
    ("Puck", 715),
    ("Naiad", 803),
    ("Thalassa", 804),
    ("Despina", 805),
    ("Galatea", 806),
    ("Larissa", 807),
    ("Nix", 902),
    ("Hydra", 903),
    ("Kerberos", 904),
    ("Styx", 905),
    ("Juno", "3", "smallbody"),
    ("Hebe", "6", "smallbody"),
    ("Iris", "7", "smallbody"),
    ("Flora", "8", "smallbody"),
    ("Lutetia", "21", "smallbody"),
    ("Daphne", "41", "smallbody"),
    ("Kleopatra", "216", "smallbody"),
    ("Eros", "433", "smallbody"),
    ("Ida", "243", "smallbody"),
    ("Mathilde", "253", "smallbody"),
    ("Itokawa", "25143", "smallbody"),
    ("Steins", "28645", "smallbody"),
    ("Varuna", "20000", "smallbody"),
    ("Ixion", "28978", "smallbody"),
    ("Huya", "38628", "smallbody"),
    ("Varda", "174567", "smallbody"),
    ("Albion", "15760", "smallbody"),
    ("Logos", "58534", "smallbody"),
    ("Deucalion", "53311", "smallbody"),
    ("Pholus", "5145", "smallbody"),
]

# Solar System Barycenter: site 500 on center 0 (Horizons CENTER field)
_HORIZONS_SSB = "500@0"

Origin = Literal["sun", "ssb"]

# (display_name, Horizons id, optional astroquery id_type). Ceres needs smallbody "1", not bare major-body 1.
BodyQuery: TypeAlias = tuple[str, str | int] | tuple[str, str | int, str | None]


def _expand_body_query(q: BodyQuery) -> tuple[str, str | int, str | None]:
    if len(q) == 3:
        return q[0], q[1], q[2]
    return q[0], q[1], None


def _horizons_location(origin: Origin) -> str | None:
    if origin == "sun":
        return None
    if origin == "ssb":
        return _HORIZONS_SSB
    raise ValueError(f"Unknown origin: {origin!r}; use 'sun' or 'ssb'.")


def _scalar_float(val: Any) -> float:
    if isinstance(val, Quantity):
        return float(val.value)
    return float(val)


def _assert_vector_units(vec_table) -> None:
    """Best-effort check that distance and velocity columns use AU and AU/d."""
    for name in ("x", "vx"):
        col = vec_table[name]
        unit = getattr(col, "unit", None)
        if unit is None:
            continue
        got = str(unit)
        if name == "vx" and "AU" in got and "d" in got:
            continue
        if name == "x" and "AU" in got:
            continue
        raise ValueError(f"Unexpected unit for {name!r}: {got!r}")


def fetch_solar_system_state_vectors(
    epoch: float | None = None,
    *,
    origin: Origin = "ssb",
    refplane: str = "ecliptic",
    aberrations: str = "geometric",
    cache: bool = True,
    request_delay_s: float = 0.2,
    max_retries: int = 3,
    bodies: list[BodyQuery] | None = None,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Query Horizons for state vectors of the Sun, planets, and Pluto at one TDB epoch.

    Parameters
    ----------
    epoch : float, optional
        Julian Date in **TDB**. If None, uses ``Time.now().tdb.jd``.
    origin : {'sun', 'ssb'}
        Coordinate origin for output vectors.
    refplane : str
        Passed to ``Horizons.vectors(refplane=...)`` (default ``'ecliptic'``).
    aberrations : str
        Passed to ``Horizons.vectors(aberrations=...)`` (default ``'geometric'``).
    cache : bool
        HTTP cache for astroquery (default True).
    request_delay_s : float
        Sleep between Horizons requests to reduce load on public servers.
    max_retries : int
        Retries per body on transient network/API errors.
    bodies : list of BodyQuery, optional
        Override the default body list. Use ``("Ceres", "1", "smallbody")`` style for asteroids.

    Returns
    -------
    df : pandas.DataFrame
        Columns: body, horizons_id, jd_tdb, x_au, y_au, z_au, vx_au_d, vy_au_d, vz_au_d.
    meta : dict
        Provenance and query options.
    """
    if bodies is None:
        bodies = list(DEFAULT_BODIES)

    jd = float(Time.now().tdb.jd) if epoch is None else float(epoch)
    location = _horizons_location(origin)

    rows: list[dict[str, Any]] = []
    last_err: Exception | None = None

    for i, raw in enumerate(bodies):
        body_name, hid, id_type_opt = _expand_body_query(raw)
        for attempt in range(max_retries):
            try:
                hz_kw: dict[str, Any] = {
                    "id": str(hid),
                    "location": location,
                    "epochs": jd,
                }
                if id_type_opt is not None:
                    hz_kw["id_type"] = id_type_opt
                obj = Horizons(**hz_kw)
                vec = obj.vectors(
                    refplane=refplane,
                    aberrations=aberrations,
                    cache=cache,
                )
                if len(vec) != 1:
                    raise RuntimeError(
                        f"Expected 1 row for {body_name} (id={hid}), got {len(vec)}"
                    )
                _assert_vector_units(vec)
                r = vec[0]
                rows.append(
                    {
                        "body": body_name,
                        "horizons_id": hid,
                        "jd_tdb": _scalar_float(r["datetime_jd"]),
                        "x_au": _scalar_float(r["x"]),
                        "y_au": _scalar_float(r["y"]),
                        "z_au": _scalar_float(r["z"]),
                        "vx_au_d": _scalar_float(r["vx"]),
                        "vy_au_d": _scalar_float(r["vy"]),
                        "vz_au_d": _scalar_float(r["vz"]),
                    }
                )
                last_err = None
                break
            except Exception as e:  # noqa: BLE001 — re-raise with context below
                last_err = e
                if attempt + 1 >= max_retries:
                    break
                time.sleep(0.5 * (2**attempt))
        if last_err is not None:
            raise RuntimeError(
                f"Horizons vectors failed for {body_name} (id={hid}): {last_err}"
            ) from last_err
        if request_delay_s > 0 and i + 1 < len(bodies):
            time.sleep(request_delay_s)

    df = pd.DataFrame(rows)

    meta: dict[str, Any] = {
        "epoch_jd_tdb": jd,
        "origin": origin,
        "refplane": refplane,
        "aberrations": aberrations,
        "horizons_center": location if location is not None else "default_sun_center",
        "source": "JPL Horizons via astroquery",
    }
    return df, meta


def state_vectors_to_numpy(df: pd.DataFrame) -> np.ndarray:
    """
    Stack positions and velocities as shape (n_bodies, 6).

    Column order: x_au, y_au, z_au, vx_au_d, vy_au_d, vz_au_d.
    """
    cols = ["x_au", "y_au", "z_au", "vx_au_d", "vy_au_d", "vz_au_d"]
    return df[cols].to_numpy(dtype=np.float64)


if __name__ == "__main__":
    df_ssb, meta = fetch_solar_system_state_vectors(origin="ssb")
    print(meta)
    print(df_ssb.to_string(index=False))
    arr = state_vectors_to_numpy(df_ssb)
    print("numpy shape", arr.shape, "dtype", arr.dtype)

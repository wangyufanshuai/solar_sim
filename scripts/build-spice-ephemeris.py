#!/usr/bin/env python3
"""Build the browser SPICE state table and preliminary low-thrust seed library."""

from __future__ import annotations

import hashlib
import json
import math
import struct
import urllib.request
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import minimize
import spiceypy as spice

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "spice"
OUT = ROOT / "public" / "data"
KERNELS = {
    "spk": (
        "de442s.bsp",
        "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp",
    ),
    "lsk": (
        "naif0012.tls",
        "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls",
    ),
    "pck": (
        "pck00011.tpc",
        "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
    ),
    "gm": (
        "gm_de440.tpc",
        "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/gm_de440.tpc",
    ),
}
BODIES = [
    ("sun", "SUN"),
    ("mercury", "MERCURY BARYCENTER"),
    ("venus", "VENUS BARYCENTER"),
    ("earth", "EARTH"),
    ("moon", "MOON"),
    ("mars", "MARS BARYCENTER"),
    ("jupiter", "JUPITER BARYCENTER"),
    ("saturn", "SATURN BARYCENTER"),
]
START_DAY = 0.0
STOP_DAY = 4200.0
STEP_DAY = 0.25
EPOCH_JD_TDB = 2451545.0
AU_KM = 149_597_870.7
DAY_SECONDS = 86400.0


def download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size > 0:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url}")
    with urllib.request.urlopen(url, timeout=90) as response, path.open("wb") as output:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            output.write(chunk)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_spice_table() -> None:
    paths = {}
    for key, (name, url) in KERNELS.items():
        path = CACHE / name
        download(url, path)
        paths[key] = path

    spice.kclear()
    for key in ("lsk", "pck", "gm", "spk"):
        spice.furnsh(str(paths[key]))

    days = np.arange(START_DAY, STOP_DAY + STEP_DAY * 0.5, STEP_DAY, dtype=np.float64)
    ets = (days + EPOCH_JD_TDB - 2451545.0) * DAY_SECONDS
    rows = np.empty((len(BODIES), len(days), 6), dtype="<f8")
    for body_index, (body_id, target) in enumerate(BODIES):
        print(f"Sampling {body_id}: {len(days)} states")
        for row_index, et in enumerate(ets):
            if body_id == "sun":
                state = np.zeros(6, dtype=np.float64)
            else:
                state, _ = spice.spkezr(target, float(et), "ECLIPJ2000", "NONE", "SUN")
                state = np.asarray(state, dtype=np.float64)
            rows[body_index, row_index, :3] = state[:3] / AU_KM
            rows[body_index, row_index, 3:] = state[3:] * DAY_SECONDS / AU_KM

    OUT.mkdir(parents=True, exist_ok=True)
    binary_path = OUT / "spice-ephemeris-v1.bin"
    binary_path.write_bytes(rows.tobytes(order="C"))
    manifest = {
        "version": 1,
        "generatedAt": np.datetime_as_string(np.datetime64("now"), unit="s") + "Z",
        "source": "NASA/JPL NAIF SPICE DE442s",
        "sourceUrls": {key: url for key, (_, url) in KERNELS.items()},
        "frame": "ECLIPJ2000",
        "observer": "SUN",
        "aberration": "NONE",
        "epochJdTdb": EPOCH_JD_TDB,
        "startSimDay": START_DAY,
        "stopSimDay": STOP_DAY,
        "stepDays": STEP_DAY,
        "rowCount": int(len(days)),
        "componentsPerRow": 6,
        "bodyOrder": [body_id for body_id, _ in BODIES],
        "binaryPath": "/data/spice-ephemeris-v1.bin",
        "binaryBytes": binary_path.stat().st_size,
        "binarySha256": sha256(binary_path),
        "kernelChecksums": {key: sha256(path) for key, path in paths.items()},
        "interpolation": "cubic Hermite from tabulated position and velocity",
        "caveat": "High-fidelity preliminary design data; not an operational navigation product or mission certification.",
    }
    (OUT / "spice-ephemeris-v1-manifest.json").write_text(
        json.dumps(manifest, separators=(",", ":")), encoding="utf-8"
    )
    spice.kclear()


def low_thrust_dynamics(_, state, thrust_newton, isp_seconds, direction):
    mu_sun = 1.32712440018e20
    g0 = 9.80665
    pos = state[:3]
    vel = state[3:6]
    mass = max(state[6], 1.0)
    radius = max(np.linalg.norm(pos), 1.0)
    accel_gravity = -mu_sun * pos / radius**3
    accel_thrust = thrust_newton * direction / mass
    return np.concatenate((vel, accel_gravity + accel_thrust, [-thrust_newton / (isp_seconds * g0)]))


def build_low_thrust_library() -> None:
    """Create deterministic low-thrust seed records.

    These records are not certified Hermite-Simpson solutions. They preserve a
    stable control seed and explicit residual metadata so the browser can display
    them as unavailable for feasible ranking until a real offline solve is added.
    """
    legs = [
        ("earth-venus", 155.0, 0.65),
        ("venus-jupiter", 720.0, 0.42),
        ("jupiter-saturn", 1160.0, 0.28),
    ]
    solutions = []
    for leg_id, tof_days, thrust in legs:
        nodes = 32
        initial_mass = 4200.0
        isp = 3000.0
        # Optimize a bounded throttle and two direction angles. This is a stable
        # direct-control seed record; the Cowell audit performs the final propagation.
        def objective(x):
            throttle, azimuth, elevation = x
            propellant = thrust * throttle * tof_days * DAY_SECONDS / (isp * 9.80665)
            steering_penalty = 0.05 * (azimuth * azimuth + elevation * elevation)
            return propellant + steering_penalty

        result = minimize(
            objective,
            np.array([0.45, 0.0, 0.0]),
            method="SLSQP",
            bounds=[(0.0, 1.0), (-math.pi, math.pi), (-math.pi / 2, math.pi / 2)],
            options={"maxiter": 120, "ftol": 1e-9},
        )
        throttle, azimuth, elevation = result.x
        direction = [
            math.cos(elevation) * math.cos(azimuth),
            math.cos(elevation) * math.sin(azimuth),
            math.sin(elevation),
        ]
        propellant = thrust * throttle * tof_days * DAY_SECONDS / (isp * 9.80665)
        solutions.append(
            {
                "id": f"{leg_id}-nominal",
                "legId": leg_id,
                "status": "seed",
                "method": "Direct-control seed for future Hermite-Simpson solve",
                "nodes": nodes,
                "converged": False,
                "iterations": int(result.nit),
                "objective": float(result.fun),
                "maxDefect": 1.0,
                "terminalPositionErrorKm": 1e9,
                "terminalVelocityErrorMps": 1e9,
                "tofDays": tof_days,
                "initialMassKg": initial_mass,
                "finalMassKg": initial_mass - propellant,
                "propellantKg": propellant,
                "maxThrustN": thrust,
                "ispSeconds": isp,
                "controls": [
                    {
                        "startFraction": i / nodes,
                        "endFraction": (i + 1) / nodes,
                        "throttle": float(throttle),
                        "direction": direction,
                    }
                    for i in range(nodes)
                ],
                "message": "Seed only; terminal residuals were not produced by a verified collocation solve.",
                "gridKey": {
                    "tofDays": tof_days,
                    "constraintPreset": "aggressive",
                    "ephemerisSha256": "see public/data/spice-ephemeris-v1-manifest.json",
                },
                "defectSummary": {
                    "maxPositionDefectKm": 1e9,
                    "maxVelocityDefectMps": 1e9,
                    "maxMassDefectKg": 0.0,
                },
                "terminalResidual": {
                    "positionKm": 1e9,
                    "velocityMps": 1e9,
                },
                "constraintResiduals": [
                    {
                        "id": "verified-collocation",
                        "value": 1.0,
                        "limit": 0.0,
                        "status": "fail",
                    }
                ],
                "unavailableReason": "A real offline Hermite-Simpson solve is required before this record can be ranked feasible.",
            }
        )
    payload = {
        "version": 1,
        "generatedAt": np.datetime_as_string(np.datetime64("now"), unit="s") + "Z",
        "solver": "SciPy SLSQP direct-control seed; not a verified Hermite-Simpson collocation result",
        "solutions": solutions,
        "caveat": "Low-thrust records are control seeds only unless status is converged; parameter changes require an offline Hermite-Simpson solve.",
    }
    (OUT / "low-thrust-solution-library-v1.json").write_text(
        json.dumps(payload, separators=(",", ":")), encoding="utf-8"
    )


if __name__ == "__main__":
    build_spice_table()
    build_low_thrust_library()
    print("SPICE ephemeris and low-thrust library generated")

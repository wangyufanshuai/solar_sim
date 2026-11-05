"""Build the deterministic ICRF/J2000 barycentric V9 comparison fixture.

Planetary states come from the frozen DE440s SPK. Ceres uses the existing
checksummed Horizons checkpoint vectors because jplephem does not evaluate the
NAIF type-13 asteroid segment. This script owns reference conversion only; it
contains no integration or force implementation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import spiceypy as spice
from jplephem.spk import SPK

AU_M = 149_597_870_700.0
DAY_S = 86_400.0
TARGET = {
    "sun": (0, 10), "mercury": (1, 199), "venus": (2, 299),
    "earth": (3, 399), "moon": (3, 301), "mars": (0, 4),
    "jupiter": (0, 5), "saturn": (0, 6), "uranus": (0, 7),
    "neptune": (0, 8), "pluto": (0, 9),
}
PARENT_BARYCENTER = {"mercury": 1, "venus": 2, "earth": 3, "moon": 3}
BODY_IDS = (
    "sun", "mercury", "venus", "earth", "moon", "mars", "jupiter",
    "saturn", "uranus", "neptune", "pluto", "ceres",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_spk_state(kernel: SPK, target: tuple[int, int], jd_tdb: float):
    position, velocity = kernel[target].compute_and_differentiate(jd_tdb)
    return np.asarray(position) * 1000.0, np.asarray(velocity) * 1000.0 / DAY_S


def ecliptic_to_icrf(vector: np.ndarray) -> np.ndarray:
    obliquity = math.radians(23.439291111)
    c, s = math.cos(obliquity), math.sin(obliquity)
    return np.array([vector[0], c * vector[1] - s * vector[2], s * vector[1] + c * vector[2]])


def checkpoint_state(planets: SPK, offset_days: float, label: str, jd_tdb: float) -> dict:
    sun_position, sun_velocity = load_spk_state(planets, TARGET["sun"], jd_tdb)
    bodies = []
    for body_id in BODY_IDS:
        if body_id == "ceres":
            state_km, _ = spice.spkezr("2000001", offset_days * DAY_S, "J2000", "NONE", "0")
            position = np.asarray(state_km[:3], dtype=float) * 1000.0
            velocity = np.asarray(state_km[3:], dtype=float) * 1000.0
        elif body_id in PARENT_BARYCENTER:
            parent = PARENT_BARYCENTER[body_id]
            parent_position, parent_velocity = load_spk_state(planets, (0, parent), jd_tdb)
            local_position, local_velocity = load_spk_state(planets, TARGET[body_id], jd_tdb)
            position = parent_position + local_position
            velocity = parent_velocity + local_velocity
        else:
            position, velocity = load_spk_state(planets, TARGET[body_id], jd_tdb)
        bodies.append({
            "id": body_id,
            "x_au": float(position[0] / AU_M),
            "y_au": float(position[1] / AU_M),
            "z_au": float(position[2] / AU_M),
            "vx_au_d": float(velocity[0] * DAY_S / AU_M),
            "vy_au_d": float(velocity[1] * DAY_S / AU_M),
            "vz_au_d": float(velocity[2] * DAY_S / AU_M),
        })
    return {
        "label": label,
        "offsetDays": float(offset_days),
        "julianDateTdb": jd_tdb,
        "bodies": bodies,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Orbit Atlas V9 barycentric research fixture")
    parser.add_argument("--output", default="dist/science/relativity-reference-fixture-v9.json")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    de440_path = root / "tools" / "science-cache" / "naif-v201" / "de440s.bsp"
    asteroid_path = root / "tools" / "science-cache" / "naif-v201" / "codes_300ast_20100725.bsp"
    asteroid_frame_path = root / "tools" / "science-cache" / "naif-v201" / "codes_300ast_20100725.tf"
    leapseconds_path = root / "tools" / "science-cache" / "naif-v201" / "naif0012.tls"
    planets = SPK.open(str(de440_path))
    for kernel in (leapseconds_path, de440_path, asteroid_frame_path, asteroid_path):
        spice.furnsh(str(kernel))
    offsets = [float(day) for day in range(31)] + [365.0, 3652.5]
    labels = {0.0: "J2000", 30.0: "+30d", 365.0: "+365d", 3652.5: "+10y"}
    checkpoints = [
        checkpoint_state(planets, offset, labels.get(offset, f"+{offset:g}d calibration"), 2451545.0 + offset)
        for offset in offsets
    ]
    spice.kclear()
    report = {
        "version": "v201-icrf-j2000-barycentric-reference-fixture-v9",
        "coordinateFrame": "ICRF-J2000-barycentric",
        "timeScale": "TDB",
        "epochJulianDateTdb": 2451545.0,
        "bodyIds": list(BODY_IDS),
        "checkpoints": checkpoints,
        "provenance": {
            "de440sSha256": sha256(de440_path),
            "asteroidKernelSha256": sha256(asteroid_path),
            "asteroidFrameKernelSha256": sha256(asteroid_frame_path),
            "leapsecondsKernelSha256": sha256(leapseconds_path),
            "ceresPolicy": "NAIF-type-13-SPK-evaluated-by-CSPICE-in-J2000-barycentric-frame",
        },
        "boundary": "deterministic-reference-state-fixture-no-force-or-runtime-physics",
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(report, indent=2, allow_nan=False) + "\n"
    output.write_text(payload, encoding="utf-8")
    print(json.dumps({
        "version": report["version"],
        "output": str(output),
        "sha256": hashlib.sha256(payload.encode("utf-8")).hexdigest(),
        "checkpointCount": len(checkpoints),
        "bodyCount": len(BODY_IDS),
    }, indent=2))


if __name__ == "__main__":
    main()

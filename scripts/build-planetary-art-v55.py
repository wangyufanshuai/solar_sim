#!/usr/bin/env python3
"""Generate local v55 cinematic planetary art-direction helper assets.

The app treats these as prepared local runtime assets. This script does not
download remote data and does not copy Universe Sandbox assets.
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "textures" / "planets" / "v55"
SIZE = 96


def _png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_rgba_png(path: Path, width: int, height: int, sampler) -> None:
    rows = []
    for y in range(height):
      row = bytearray([0])
      for x in range(width):
        r, g, b, a = sampler(x / max(1, width - 1), y / max(1, height - 1))
        row.extend([
            max(0, min(255, int(round(r)))),
            max(0, min(255, int(round(g)))),
            max(0, min(255, int(round(b)))),
            max(0, min(255, int(round(a)))),
        ])
      rows.append(bytes(row))
    raw = b"".join(rows)
    payload = b"\x89PNG\r\n\x1a\n"
    payload += _png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    payload += _png_chunk(b"IDAT", zlib.compress(raw, 9))
    payload += _png_chunk(b"IEND", b"")
    path.write_bytes(payload)


def cloud_alpha(u: float, v: float):
    swirls = 0.5 + 0.5 * math.sin(u * 38.0 + math.sin(v * 14.0) * 2.2)
    belts = 0.5 + 0.5 * math.sin((u + v * 0.62) * 21.0)
    polar_fade = 1.0 - abs(v - 0.5) ** 1.8 * 1.15
    value = max(0.0, min(1.0, (swirls * 0.68 + belts * 0.32) * polar_fade))
    alpha = 255 * (0.18 + value * 0.72)
    return 255, 255, 255, alpha


def night_mask(u: float, v: float):
    city_lattice = (math.sin(u * 96.0) * math.sin(v * 63.0) + 1.0) * 0.5
    coast_bias = 0.5 + 0.5 * math.sin((u * 9.0 + math.sin(v * 11.0)) * math.pi)
    value = max(0.0, min(1.0, city_lattice ** 3.4 * (0.35 + coast_bias * 0.65)))
    c = 255 * value
    return c, c, c, 255


def gas_band(u: float, v: float):
    lat = abs(v - 0.5) * 2.0
    bands = 0.5 + 0.5 * math.sin(v * 90.0 + math.sin(u * 20.0) * 0.75)
    micro = 0.5 + 0.5 * math.sin(v * 310.0 + u * 8.0)
    value = (bands * 0.72 + micro * 0.28) * (1.0 - max(0.0, lat - 0.82) * 1.7)
    warm = 154 + value * 72
    cool = 118 + value * 58
    return warm, cool, 86, 255


def ring_opacity(u: float, v: float):
    r = abs(u - 0.5) * 2.0
    cassini = 1.0 - max(0.0, 1.0 - abs(r - 0.62) / 0.045)
    fine = 0.72 + 0.18 * math.sin(r * 190.0) + 0.08 * math.sin(r * 620.0)
    envelope = max(0.0, min(1.0, (1.0 - abs(r - 0.55) * 1.05)))
    alpha = 255 * max(0.0, min(1.0, envelope * fine * (0.2 + 0.8 * cassini)))
    return 222, 202, 158, alpha


def sky_noise_matte(u: float, v: float):
    cx, cy = 0.5, 0.48
    d = math.sqrt((u - cx) ** 2 + (v - cy) ** 2)
    matte = max(0.0, min(1.0, (d - 0.08) / 0.42))
    value = 34 + matte * 170
    return value * 0.72, value * 0.83, value, 255


def color_lut(u: float, v: float):
    cool = (18 + u * 56, 25 + u * 64, 39 + u * 86)
    warm = (124 + u * 92, 88 + u * 86, 54 + u * 52)
    t = v
    return (
        cool[0] * (1 - t) + warm[0] * t,
        cool[1] * (1 - t) + warm[1] * t,
        cool[2] * (1 - t) + warm[2] * t,
        255,
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    assets = {
        "earth-cloud-alpha-v55.png": cloud_alpha,
        "earth-night-mask-v55.png": night_mask,
        "gas-band-contrast-v55.png": gas_band,
        "saturn-ring-opacity-v55.png": ring_opacity,
        "sky-noise-matte-v55.png": sky_noise_matte,
        "cinematic-color-lut-v55.png": color_lut,
    }
    for filename, sampler in assets.items():
        write_rgba_png(OUT / filename, SIZE, SIZE, sampler)
    print(f"Generated {len(assets)} v55 local art-direction assets in {OUT}")


if __name__ == "__main__":
    main()

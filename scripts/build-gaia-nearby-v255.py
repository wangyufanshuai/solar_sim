#!/usr/bin/env python3
"""Build the deterministic v255 Gaia nearby presentation subset.

This is a build-time-only export from the already packaged local catalog-v7
SQLite snapshot.  It deliberately does not contact Gaia or mutate any
scientific fixture.  The runtime consumes the generated JSON only as an
optional deep-space presentation layer.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sqlite3
from pathlib import Path


VERSION = "v255-gaia-dr3-nearby-46000"
DEFAULT_SOURCE = Path("dist/catalog-v7/catalog-v7.sqlite")
DEFAULT_OUTPUT = Path("public/data/gaia-dr3-nearby-46000-v255.json")
DEFAULT_MANIFEST = Path("dist/science/gaia-dr3-nearby-46000-v255.manifest.json")
TARGET_ROWS = 46_000


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def finite(value: object) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(float(value))


def sky_bin(ra_deg: float, dec_deg: float) -> int:
    ra = ((ra_deg % 360.0) + 360.0) % 360.0
    dec = max(-90.0, min(90.0, dec_deg))
    return int(ra // 15.0) + int((dec + 90.0) // 15.0) * 24


def overlay_score(row: dict[str, float | int], index: int) -> float:
    distance_pc = 1000.0 / max(float(row["parallaxMas"]), 0.001)
    apparent_brightness = max(0.0, 8.25 - float(row["magG"])) / 8.25
    proximity = max(0.0, 1.0 - distance_pc / 200.0)
    color_spread = min(1.0, abs(float(row["colorBpRp"]) - 0.75) / 2.4)
    bin_id = sky_bin(float(row["raDeg"]), float(row["decDeg"]))
    # Match the unsigned 32-bit arithmetic used by the TypeScript selector.
    spread = ((bin_id * 1103515245 + 12345 + index * 2654435761) & 0xFFFFFFFF) / 0xFFFFFFFF
    return apparent_brightness * 0.56 + proximity * 0.26 + color_spread * 0.11 + spread * 0.07


def read_candidates(source: Path) -> list[dict[str, float | int | str]]:
    connection = sqlite3.connect(source)
    connection.row_factory = sqlite3.Row
    rows = connection.execute(
        """
        SELECT gaia_source_id, ra_deg, dec_deg, parallax_mas, mag_g, bp_rp
        FROM catalog_objects
        WHERE gaia_source_id IS NOT NULL
          AND ra_deg IS NOT NULL
          AND dec_deg IS NOT NULL
          AND parallax_mas IS NOT NULL
          AND mag_g IS NOT NULL
          AND bp_rp IS NOT NULL
          AND parallax_mas > 5
        ORDER BY gaia_source_id ASC
        """
    ).fetchall()
    connection.close()

    candidates: list[dict[str, float | int | str]] = []
    seen: set[str] = set()
    for row in rows:
        source_id = str(row["gaia_source_id"])
        values = {
            "sourceId": source_id,
            "raDeg": float(row["ra_deg"]),
            "decDeg": float(row["dec_deg"]),
            "parallaxMas": float(row["parallax_mas"]),
            "magG": float(row["mag_g"]),
            "colorBpRp": float(row["bp_rp"]),
        }
        if source_id in seen or not all(finite(value) for value in values.values() if not isinstance(value, str)):
            continue
        seen.add(source_id)
        candidates.append(values)
    return candidates


def build(source: Path, output: Path, manifest: Path) -> dict[str, object]:
    if not source.is_file():
        raise SystemExit(f"Gaia V7 SQLite source is missing: {source}")
    candidates = read_candidates(source)
    if len(candidates) < TARGET_ROWS:
        raise SystemExit(f"nearby Gaia candidate gate failed: {len(candidates):,} < {TARGET_ROWS:,}")

    ranked = sorted(
        ((overlay_score(row, index), index, row) for index, row in enumerate(candidates)),
        key=lambda item: (-item[0], item[1]),
    )
    selected_indexes = {index for _, index, _ in ranked[:TARGET_ROWS]}
    selected = [row for index, row in enumerate(candidates) if index in selected_indexes]
    selected.sort(key=lambda row: int(str(row["sourceId"])))

    if len(selected) != TARGET_ROWS or len({row["sourceId"] for row in selected}) != TARGET_ROWS:
        raise SystemExit("selected Gaia subset is not exactly 46,000 unique rows")
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(selected, ensure_ascii=False, separators=(",", ":")) + "\n"
    output.write_bytes(serialized.encode("utf-8"))
    output_sha = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    result = {
        "version": VERSION,
        "source": "Gaia DR3 rows from local catalog V7 SQLite",
        "sourcePath": source.as_posix(),
        "sourceSha256": sha256(source),
        "outputPath": output.as_posix(),
        "outputSha256": output_sha,
        "rowCount": len(selected),
        "candidateCount": len(candidates),
        "selection": {
            "parallaxMasGreaterThan": 5,
            "distancePcLessThan": 200,
            "finiteFields": ["raDeg", "decDeg", "parallaxMas", "magG", "colorBpRp"],
            "ranking": "deterministic-bright-near-color-spread-sky-binned",
            "ordering": "source-id-ascending-input; score-descending selection; source-id-ascending output",
        },
        "runtimePolicy": "lazy-presentation-overlay-with-5000-row-fallback",
        "trustedBoundary": "Local Gaia DR3/V7 presentation subset; not the full Gaia archive, not an official astrometric quality gate, and not a scientific physics input.",
    }
    manifest.write_bytes((json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    result = build(args.source, args.output, args.manifest)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

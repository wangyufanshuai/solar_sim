#!/usr/bin/env python3
"""Build frozen Gaia v267 aggregate tables from local v7/v8 SQLite sources only."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import astropy.units as u
import numpy as np
from astropy_healpix import HEALPix

VERSION = "v267-gaia-research-aggregate-v1"
SCIENCE_ROWS = 200_000
MOTHER_ROWS = 1_224_219
G_EDGES = np.asarray([-5, 6, 9, 12, 15, 17, 19, 22], dtype=np.float64)
COLOR_EDGES = np.asarray([-2, 0, 0.8, 1.5, 2.5, 6], dtype=np.float64)
QUALITY = {"gold": 0, "silver": 1, "limited": 2}
HEALPIX5 = HEALPix(nside=32, order="nested", frame="icrs")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def value_bin(values: np.ndarray, edges: np.ndarray) -> np.ndarray:
    return np.searchsorted(edges, values, side="right") - 1


def ruwe_bin(value: object) -> int:
    if value is None:
        return 4
    numeric = float(value)
    if not math.isfinite(numeric):
        return 4
    if numeric < 1.2:
        return 0
    if numeric < 1.4:
        return 1
    if numeric < 2:
        return 2
    return 3


def create_schema(db: sqlite3.Connection) -> None:
    db.executescript("""
    PRAGMA journal_mode=OFF;
    PRAGMA synchronous=OFF;
    PRAGMA temp_store=MEMORY;
    CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE quality_summary(quality INTEGER PRIMARY KEY, count INTEGER NOT NULL);
    CREATE TABLE sky_density(order_n INTEGER NOT NULL, cell INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(order_n, cell, quality));
    CREATE TABLE mother_cube(cell INTEGER NOT NULL, g_bin INTEGER NOT NULL, color_bin INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(cell, g_bin, color_bin));
    CREATE TABLE selected_cube(cell INTEGER NOT NULL, g_bin INTEGER NOT NULL, color_bin INTEGER NOT NULL, ruwe_bin INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(cell, g_bin, color_bin, ruwe_bin, quality));
    CREATE TABLE hr_density(x_bin INTEGER NOT NULL, y_bin INTEGER NOT NULL, g_bin INTEGER NOT NULL, color_bin INTEGER NOT NULL, ruwe_bin INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(x_bin, y_bin, g_bin, color_bin, ruwe_bin, quality));
    """)


def upsert_counter(db: sqlite3.Connection, table: str, columns: tuple[str, ...], counts: Counter[tuple[int, ...]]) -> None:
    names = ",".join((*columns, "count"))
    placeholders = ",".join("?" for _ in range(len(columns) + 1))
    conflict = ",".join(columns)
    db.executemany(
        f"INSERT INTO {table}({names}) VALUES({placeholders}) ON CONFLICT({conflict}) DO UPDATE SET count=count+excluded.count",
        [(*key, count) for key, count in counts.items()],
    )


def build_mother(db: sqlite3.Connection, path: Path) -> tuple[int, int]:
    source = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)
    total = int(source.execute("SELECT COUNT(*) FROM catalog_objects").fetchone()[0])
    if total != MOTHER_ROWS:
        raise RuntimeError(f"Mother catalog row count drifted: {total}")
    cursor = source.execute("SELECT ra_deg,dec_deg,mag_g,bp_rp FROM catalog_objects ORDER BY rowid")
    eligible = 0
    while rows := cursor.fetchmany(50_000):
        array = np.asarray(rows, dtype=np.float64)
        finite = np.isfinite(array).all(axis=1)
        array = array[finite]
        if not len(array):
            continue
        g_bins = value_bin(array[:, 2], G_EDGES)
        color_bins = value_bin(array[:, 3], COLOR_EDGES)
        valid = (g_bins >= 0) & (g_bins < len(G_EDGES) - 1) & (color_bins >= 0) & (color_bins < len(COLOR_EDGES) - 1)
        array = array[valid]
        g_bins = g_bins[valid]
        color_bins = color_bins[valid]
        if not len(array):
            continue
        cells = np.asarray(HEALPIX5.lonlat_to_healpix(array[:, 0] * u.deg, array[:, 1] * u.deg), dtype=np.int64)
        counts = Counter((int(cell), int(g), int(color)) for cell, g, color in zip(cells, g_bins, color_bins, strict=True))
        upsert_counter(db, "mother_cube", ("cell", "g_bin", "color_bin"), counts)
        eligible += len(array)
        db.commit()
    source.close()
    return total, eligible


def build_selected(db: sqlite3.Connection, path: Path) -> dict[str, int]:
    source = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)
    total = int(source.execute("SELECT COUNT(*) FROM gaia_science").fetchone()[0])
    if total != SCIENCE_ROWS:
        raise RuntimeError(f"Science subset row count drifted: {total}")
    cursor = source.execute("SELECT healpix_order5,phot_g_mean_mag,bp_rp,parallax,ruwe,quality_tier FROM gaia_science ORDER BY source_id")
    quality_counts: Counter[str] = Counter()
    hr_eligible = 0
    selection_eligible = 0
    while rows := cursor.fetchmany(50_000):
        selected_counts: Counter[tuple[int, ...]] = Counter()
        sky_counts: Counter[tuple[int, ...]] = Counter()
        hr_counts: Counter[tuple[int, ...]] = Counter()
        for cell_value, g_value, color_value, parallax_value, ruwe_value, quality_value in rows:
            quality = str(quality_value)
            if quality not in QUALITY:
                raise RuntimeError(f"Unknown Gaia quality tier: {quality}")
            quality_id = QUALITY[quality]
            quality_counts[quality] += 1
            cell = int(cell_value)
            sky_counts[(5, cell, quality_id)] += 1
            sky_counts[(3, cell >> 4, quality_id)] += 1
            if g_value is None or color_value is None:
                continue
            g = float(g_value)
            color = float(color_value)
            if not math.isfinite(g) or not math.isfinite(color):
                continue
            g_bin = int(value_bin(np.asarray([g]), G_EDGES)[0])
            color_bin = int(value_bin(np.asarray([color]), COLOR_EDGES)[0])
            if not (0 <= g_bin < len(G_EDGES) - 1 and 0 <= color_bin < len(COLOR_EDGES) - 1):
                continue
            rb = ruwe_bin(ruwe_value)
            selected_counts[(cell, g_bin, color_bin, rb, quality_id)] += 1
            selection_eligible += 1
            if parallax_value is None or float(parallax_value) <= 0 or not math.isfinite(float(parallax_value)):
                continue
            absolute_g = g + 5 * math.log10(float(parallax_value)) - 10
            x = max(0, min(127, int((color + 2) / 8 * 128)))
            y = max(0, min(127, int((absolute_g + 10) / 30 * 128)))
            hr_counts[(x, y, g_bin, color_bin, rb, quality_id)] += 1
            hr_eligible += 1
        upsert_counter(db, "selected_cube", ("cell", "g_bin", "color_bin", "ruwe_bin", "quality"), selected_counts)
        upsert_counter(db, "sky_density", ("order_n", "cell", "quality"), sky_counts)
        upsert_counter(db, "hr_density", ("x_bin", "y_bin", "g_bin", "color_bin", "ruwe_bin", "quality"), hr_counts)
        db.commit()
    source.close()
    for quality, count in quality_counts.items():
        db.execute("INSERT INTO quality_summary(quality,count) VALUES(?,?)", (QUALITY[quality], count))
    db.commit()
    return {"total": total, "selectionEligible": selection_eligible, "hrEligible": hr_eligible, **quality_counts}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--science", type=Path, default=Path("dist/gaia-science-v8/gaia-science-v8.sqlite"))
    parser.add_argument("--mother", type=Path, default=Path("dist/catalog-v7/catalog-v7.sqlite"))
    parser.add_argument("--output-dir", type=Path, default=Path("dist/gaia-research-v267"))
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    temp_db = args.output_dir / "gaia-research-v267.sqlite.part"
    output_db = args.output_dir / "gaia-research-v267.sqlite"
    manifest_path = args.output_dir / "gaia-research-v267.manifest.json"
    if temp_db.exists():
        temp_db.unlink()
    db = sqlite3.connect(temp_db)
    try:
        create_schema(db)
        mother_total, mother_eligible = build_mother(db, args.mother.resolve())
        selected = build_selected(db, args.science.resolve())
        metadata = {
            "version": VERSION,
            "scienceRows": selected["total"],
            "motherRows": mother_total,
            "motherEligibleRows": mother_eligible,
            "selectionEligibleRows": selected["selectionEligible"],
            "hrEligibleRows": selected["hrEligible"],
            "gEdges": G_EDGES.tolist(),
            "colorEdges": COLOR_EDGES.tolist(),
            "qualityCounts": {key: selected.get(key, 0) for key in QUALITY},
            "gaiaSurveyCompleteness": "unavailable",
        }
        db.executemany("INSERT INTO metadata(key,value) VALUES(?,?)", [(key, json.dumps(value, separators=(",", ":"))) for key, value in metadata.items()])
        db.commit()
    finally:
        db.close()
    os.replace(temp_db, output_db)
    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {
        "version": VERSION,
        "generatedAt": generated_at,
        "scienceSource": {"path": str(args.science).replace("\\", "/"), "bytes": args.science.stat().st_size, "sha256": sha256(args.science)},
        "motherCatalog": {"path": str(args.mother).replace("\\", "/"), "bytes": args.mother.stat().st_size, "sha256": sha256(args.mother), "rows": mother_total},
        "aggregate": {"path": str(output_db).replace("\\", "/"), "bytes": output_db.stat().st_size, "sha256": sha256(output_db)},
        **metadata,
        "tables": ["metadata", "quality_summary", "sky_density", "mother_cube", "selected_cube", "hr_density"],
        "boundary": "local-frozen-aggregate-no-network-no-gaia-survey-completeness-no-physics-mutation",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"passed": True, "rows": selected["total"], "aggregateSha256": manifest["aggregate"]["sha256"], "manifest": str(manifest_path)}, indent=2))


if __name__ == "__main__":
    main()

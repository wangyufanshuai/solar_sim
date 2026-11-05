#!/usr/bin/env python3
"""Build the resumable, frozen Gaia v271 research aggregate.

This builder is deliberately local-only.  It never contacts ESA or GaiaUnlimited,
never mutates the frozen v7/v8 inputs, and publishes only after every conservation
gate has passed.
"""

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
from typing import Iterable

import astropy.units as u
import astropy_healpix
import numpy as np
from astropy_healpix import HEALPix

VERSION = "v271-gaia-research-aggregate-v2"
SCHEMA_VERSION = 2
PINNED_ASTROPY_HEALPIX = "1.1.2"
SCIENCE_SHA256 = "ad899ccac3e95ef7702b071694da257ea41af963155c8e686c6daed4c2ba795a"
MOTHER_SHA256 = "cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17"
EXPECTED = {
    "scienceRows": 200_000,
    "motherRows": 1_224_219,
    "motherEligibleRows": 1_066_208,
    "motherGaiaEligibleRows": 1_047_028,
    "motherWithoutGaiaIdRows": 19_180,
    "selectionEligibleRows": 199_957,
    "hrEligibleRows": 159_330,
    "gold": 30_028,
    "silver": 169_972,
    "limited": 0,
    "astrophysicalOverlapRows": 51_145,
}
G_EDGES = np.asarray([-5, 6, 9, 12, 15, 17, 19, 22], dtype=np.float64)
COLOR_EDGES = np.asarray([-2, 0, 0.8, 1.5, 2.5, 6], dtype=np.float64)
QUALITY = {"gold": 0, "silver": 1, "limited": 2}
POPULATION = {"v7-presentation": 0, "v7-gaia-id": 1}
HR_VARIANT = {"raw": 0, "v7-extinction-corrected-overlap": 1}
HEALPIX5 = HEALPix(nside=32, order="nested", frame="icrs")
HEALPIX3 = HEALPix(nside=8, order="nested", frame="icrs")
CUTS = (
    "all-frozen-science-rows",
    "five-parameter-covariance-solution",
    "ruwe-lt-1.4",
    "visibility-periods-ge-9",
    "absolute-parallax-snr-ge-5",
    "photometric-excess-within-v8-gate",
    "positive-parallax",
    "non-duplicated-source",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical_json(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def canonical_manifest_sha(manifest: dict[str, object]) -> str:
    canonical = {key: value for key, value in manifest.items() if key not in {"generatedAt", "manifestSha256"}}
    return hashlib.sha256(canonical_json(canonical)).hexdigest()


def sqlite_ro(path: Path) -> sqlite3.Connection:
    return sqlite3.connect(f"file:{path.resolve().as_posix()}?mode=ro", uri=True)


def value_bin(value: float, edges: np.ndarray) -> int:
    return int(np.searchsorted(edges, value, side="right") - 1)


def hr_bin(value: float, low: float, high: float) -> int:
    if value < low:
        return -1
    if value >= high:
        return 128
    return int((value - low) / (high - low) * 128)


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
    PRAGMA journal_mode=DELETE;
    PRAGMA synchronous=FULL;
    PRAGMA temp_store=FILE;
    PRAGMA cache_size=-32768;
    CREATE TABLE build_identity(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE build_checkpoint(
      phase TEXT PRIMARY KEY,
      last_key INTEGER NOT NULL,
      processed_rows INTEGER NOT NULL,
      eligible_rows INTEGER NOT NULL
    );
    CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE quality_summary(quality INTEGER PRIMARY KEY, count INTEGER NOT NULL);
    CREATE TABLE healpix_cell_center(
      order_n INTEGER NOT NULL, cell INTEGER NOT NULL, ra_deg REAL NOT NULL, dec_deg REAL NOT NULL,
      PRIMARY KEY(order_n,cell)
    );
    CREATE TABLE sky_density(
      order_n INTEGER NOT NULL, cell INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(order_n,cell,quality)
    );
    CREATE TABLE mother_cube(
      population INTEGER NOT NULL, cell INTEGER NOT NULL, g_bin INTEGER NOT NULL, color_bin INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(population,cell,g_bin,color_bin)
    );
    CREATE TABLE selected_cube(
      cell INTEGER NOT NULL, g_bin INTEGER NOT NULL, color_bin INTEGER NOT NULL, ruwe_bin INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(cell,g_bin,color_bin,ruwe_bin,quality)
    );
    CREATE TABLE hr_density(
      variant INTEGER NOT NULL, x_bin INTEGER NOT NULL, y_bin INTEGER NOT NULL, g_bin INTEGER NOT NULL,
      color_bin INTEGER NOT NULL, ruwe_bin INTEGER NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(variant,x_bin,y_bin,g_bin,color_bin,ruwe_bin,quality)
    );
    CREATE TABLE analysis_flags(
      flag TEXT NOT NULL, quality INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(flag,quality)
    );
    CREATE TABLE quality_cut_flow(
      cut_order INTEGER NOT NULL, cut_id TEXT NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY(cut_order,cut_id)
    );
    CREATE TABLE overlap_summary(metric TEXT PRIMARY KEY, count INTEGER NOT NULL);
    """)


def ensure_part_database(path: Path, identity: dict[str, object]) -> sqlite3.Connection:
    new_database = not path.exists()
    db = sqlite3.connect(path)
    if new_database:
        create_schema(db)
        db.executemany(
            "INSERT INTO build_identity(key,value) VALUES(?,?)",
            [(key, json.dumps(value, separators=(",", ":"))) for key, value in identity.items()],
        )
        db.executemany(
            "INSERT INTO build_checkpoint(phase,last_key,processed_rows,eligible_rows) VALUES(?,?,0,0)",
            [("mother", 0), ("selected", -1)],
        )
        db.commit()
        return db
    stored = {row[0]: json.loads(row[1]) for row in db.execute("SELECT key,value FROM build_identity")}
    if stored != identity:
        raise RuntimeError("Existing v271 checkpoint identity does not match the frozen inputs or schema")
    return db


def upsert_counter(
    db: sqlite3.Connection,
    table: str,
    columns: tuple[str, ...],
    counts: Counter[tuple[object, ...]],
) -> None:
    if not counts:
        return
    names = ",".join((*columns, "count"))
    placeholders = ",".join("?" for _ in range(len(columns) + 1))
    conflict = ",".join(columns)
    db.executemany(
        f"INSERT INTO {table}({names}) VALUES({placeholders}) "
        f"ON CONFLICT({conflict}) DO UPDATE SET count=count+excluded.count",
        [(*key, count) for key, count in counts.items()],
    )


def checkpoint(db: sqlite3.Connection, phase: str) -> tuple[int, int, int]:
    row = db.execute(
        "SELECT last_key,processed_rows,eligible_rows FROM build_checkpoint WHERE phase=?",
        (phase,),
    ).fetchone()
    if row is None:
        raise RuntimeError(f"Missing build checkpoint for {phase}")
    return int(row[0]), int(row[1]), int(row[2])


def build_mother(db: sqlite3.Connection, path: Path, chunk_size: int) -> None:
    source = sqlite_ro(path)
    try:
        total = int(source.execute("SELECT COUNT(*) FROM catalog_objects").fetchone()[0])
        if total != EXPECTED["motherRows"]:
            raise RuntimeError(f"Mother catalog row count drifted: {total}")
        while True:
            last_key, processed, eligible = checkpoint(db, "mother")
            rows = source.execute(
                "SELECT rowid,gaia_source_id,ra_deg,dec_deg,mag_g,bp_rp "
                "FROM catalog_objects WHERE rowid>? ORDER BY rowid LIMIT ?",
                (last_key, chunk_size),
            ).fetchall()
            if not rows:
                break
            presentation: Counter[tuple[object, ...]] = Counter()
            gaia_only: Counter[tuple[object, ...]] = Counter()
            coordinates: list[tuple[int, object, float, float, float, float]] = []
            for rowid, source_id, ra, dec, g, color in rows:
                values = (ra, dec, g, color)
                if any(value is None or not math.isfinite(float(value)) for value in values):
                    continue
                g_bin = value_bin(float(g), G_EDGES)
                color_bin = value_bin(float(color), COLOR_EDGES)
                if not (0 <= g_bin < len(G_EDGES) - 1 and 0 <= color_bin < len(COLOR_EDGES) - 1):
                    continue
                coordinates.append((int(rowid), source_id, float(ra), float(dec), g_bin, color_bin))
            if coordinates:
                cells = np.asarray(
                    HEALPIX5.lonlat_to_healpix(
                        np.asarray([row[2] for row in coordinates]) * u.deg,
                        np.asarray([row[3] for row in coordinates]) * u.deg,
                    ),
                    dtype=np.int64,
                )
                for row, cell in zip(coordinates, cells, strict=True):
                    _, source_id, _, _, g_bin, color_bin = row
                    presentation[(POPULATION["v7-presentation"], int(cell), g_bin, color_bin)] += 1
                    if source_id is not None:
                        gaia_only[(POPULATION["v7-gaia-id"], int(cell), g_bin, color_bin)] += 1
            with db:
                upsert_counter(db, "mother_cube", ("population", "cell", "g_bin", "color_bin"), presentation)
                upsert_counter(db, "mother_cube", ("population", "cell", "g_bin", "color_bin"), gaia_only)
                db.execute(
                    "UPDATE build_checkpoint SET last_key=?,processed_rows=?,eligible_rows=? WHERE phase='mother'",
                    (int(rows[-1][0]), processed + len(rows), eligible + len(coordinates)),
                )
    finally:
        source.close()


def astrophysical_overlap(source: sqlite3.Connection, source_ids: Iterable[int]) -> dict[int, float | None]:
    ids = tuple(source_ids)
    if not ids:
        return {}
    placeholders = ",".join("?" for _ in ids)
    rows = source.execute(
        f"SELECT source_id,extinction_mag FROM stellar_astrophysical_parameters WHERE source_id IN ({placeholders})",
        ids,
    ).fetchall()
    return {int(source_id): None if extinction is None else float(extinction) for source_id, extinction in rows}


def photometric_clean(bp_rp: float, excess: float) -> bool:
    lower = 1.0 + 0.015 * bp_rp * bp_rp
    upper = 1.3 + 0.06 * bp_rp * bp_rp
    return math.isfinite(excess) and lower < excess < upper


def build_selected(db: sqlite3.Connection, science_path: Path, mother_path: Path, chunk_size: int) -> None:
    source = sqlite_ro(science_path)
    mother = sqlite_ro(mother_path)
    try:
        total = int(source.execute("SELECT COUNT(*) FROM gaia_science").fetchone()[0])
        if total != EXPECTED["scienceRows"]:
            raise RuntimeError(f"Science subset row count drifted: {total}")
        while True:
            last_key, processed, eligible = checkpoint(db, "selected")
            rows = source.execute(
                "SELECT source_id,healpix_order5,phot_g_mean_mag,bp_rp,parallax,parallax_error,ruwe,quality_tier,"
                "visibility_periods_used,astrometric_params_solved,phot_bp_rp_excess_factor,duplicated_source,"
                "radial_velocity,radial_velocity_error "
                "FROM gaia_science WHERE source_id>? ORDER BY source_id LIMIT ?",
                (last_key, chunk_size),
            ).fetchall()
            if not rows:
                break
            overlap = astrophysical_overlap(mother, (int(row[0]) for row in rows))
            quality_counts: Counter[tuple[object, ...]] = Counter()
            sky_counts: Counter[tuple[object, ...]] = Counter()
            selected_counts: Counter[tuple[object, ...]] = Counter()
            hr_counts: Counter[tuple[object, ...]] = Counter()
            flag_counts: Counter[tuple[object, ...]] = Counter()
            cut_counts: Counter[tuple[object, ...]] = Counter()
            chunk_eligible = 0
            for row in rows:
                (
                    source_id, cell_value, g_value, color_value, parallax_value, parallax_error_value,
                    ruwe_value, quality_value, visibility_value, solved_value, excess_value,
                    duplicated_value, radial_velocity, radial_velocity_error,
                ) = row
                quality = str(quality_value)
                if quality not in QUALITY:
                    raise RuntimeError(f"Unknown Gaia quality tier: {quality}")
                quality_id = QUALITY[quality]
                cell = int(cell_value)
                quality_counts[(quality_id,)] += 1
                sky_counts[(5, cell, quality_id)] += 1
                sky_counts[(3, cell >> 4, quality_id)] += 1

                parallax = float(parallax_value)
                parallax_error = float(parallax_error_value)
                ruwe = float(ruwe_value)
                color = float(color_value)
                excess = float(excess_value)
                solved = int(solved_value)
                visibility = int(visibility_value)
                positive = math.isfinite(parallax) and parallax > 0
                snr_ok = math.isfinite(parallax_error) and parallax_error > 0 and abs(parallax / parallax_error) >= 5
                covariance_solution = solved in (31, 95)
                clean = photometric_clean(color, excess)
                independent_flags = {
                    "positive-parallax": positive,
                    "distance-usable": positive and snr_ok and quality != "limited",
                    "non-duplicated": not bool(duplicated_value),
                    "photometric-clean-v8": clean,
                    "radial-velocity-with-error": radial_velocity is not None and radial_velocity_error is not None,
                }
                for flag, applies in independent_flags.items():
                    if applies:
                        flag_counts[(flag, quality_id)] += 1

                cumulative = (
                    True,
                    covariance_solution,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4 and visibility >= 9,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4 and visibility >= 9 and snr_ok,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4 and visibility >= 9 and snr_ok and clean,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4 and visibility >= 9 and snr_ok and clean and positive,
                    covariance_solution and math.isfinite(ruwe) and ruwe < 1.4 and visibility >= 9 and snr_ok and clean and positive and not bool(duplicated_value),
                )
                for order, applies in enumerate(cumulative):
                    if applies:
                        cut_counts[(order, CUTS[order])] += 1

                if g_value is None or color_value is None:
                    continue
                g = float(g_value)
                if not math.isfinite(g) or not math.isfinite(color):
                    continue
                g_bin = value_bin(g, G_EDGES)
                color_bin = value_bin(color, COLOR_EDGES)
                if not (0 <= g_bin < len(G_EDGES) - 1 and 0 <= color_bin < len(COLOR_EDGES) - 1):
                    continue
                rb = ruwe_bin(ruwe_value)
                selected_counts[(cell, g_bin, color_bin, rb, quality_id)] += 1
                chunk_eligible += 1
                if positive:
                    absolute_g = g + 5 * math.log10(parallax) - 10
                    hr_counts[(HR_VARIANT["raw"], hr_bin(color, -2, 6), hr_bin(absolute_g, -10, 20), g_bin, color_bin, rb, quality_id)] += 1
                    if int(source_id) in overlap:
                        extinction = overlap[int(source_id)]
                        if extinction is not None and math.isfinite(extinction):
                            corrected_g = absolute_g - extinction
                            hr_counts[(HR_VARIANT["v7-extinction-corrected-overlap"], hr_bin(color, -2, 6), hr_bin(corrected_g, -10, 20), g_bin, color_bin, rb, quality_id)] += 1

            with db:
                upsert_counter(db, "quality_summary", ("quality",), quality_counts)
                upsert_counter(db, "sky_density", ("order_n", "cell", "quality"), sky_counts)
                upsert_counter(db, "selected_cube", ("cell", "g_bin", "color_bin", "ruwe_bin", "quality"), selected_counts)
                upsert_counter(db, "hr_density", ("variant", "x_bin", "y_bin", "g_bin", "color_bin", "ruwe_bin", "quality"), hr_counts)
                upsert_counter(db, "analysis_flags", ("flag", "quality"), flag_counts)
                upsert_counter(db, "quality_cut_flow", ("cut_order", "cut_id"), cut_counts)
                db.execute(
                    "UPDATE build_checkpoint SET last_key=?,processed_rows=?,eligible_rows=? WHERE phase='selected'",
                    (int(rows[-1][0]), processed + len(rows), eligible + chunk_eligible),
                )
    finally:
        source.close()
        mother.close()


def reconcile_astrophysical_overlap_summary(
    db: sqlite3.Connection,
    science_path: Path,
    mother_path: Path,
    chunk_size: int,
) -> int:
    """Rebuild overlap provenance independently from presentation eligibility.

    The selected checkpoint can already be complete when a prior attempt stopped
    during validation.  Recomputing this small summary makes resume deterministic
    without discarding the valid aggregate tables or coupling the provenance count
    to HR/CMD plotting bounds.
    """
    source = sqlite_ro(science_path)
    mother = sqlite_ro(mother_path)
    total = 0
    last_source_id = -1
    try:
        while True:
            rows = source.execute(
                "SELECT source_id FROM gaia_science WHERE source_id>? ORDER BY source_id LIMIT ?",
                (last_source_id, chunk_size),
            ).fetchall()
            if not rows:
                break
            ids = tuple(int(row[0]) for row in rows)
            total += len(astrophysical_overlap(mother, ids))
            last_source_id = ids[-1]
    finally:
        source.close()
        mother.close()
    with db:
        db.execute(
            "INSERT INTO overlap_summary(metric,count) VALUES(?,?) "
            "ON CONFLICT(metric) DO UPDATE SET count=excluded.count",
            ("science-astrophysical-parameter-row", total),
        )
    return total


def scalar(db: sqlite3.Connection, query: str, params: tuple[object, ...] = ()) -> int:
    row = db.execute(query, params).fetchone()
    return 0 if row is None or row[0] is None else int(row[0])


def validate(db: sqlite3.Connection) -> dict[str, int]:
    counts = {
        "scienceRows": scalar(db, "SELECT SUM(count) FROM quality_summary"),
        "skyOrder3Rows": scalar(db, "SELECT SUM(count) FROM sky_density WHERE order_n=3"),
        "skyOrder5Rows": scalar(db, "SELECT SUM(count) FROM sky_density WHERE order_n=5"),
        "motherEligibleRows": scalar(db, "SELECT SUM(count) FROM mother_cube WHERE population=?", (POPULATION["v7-presentation"],)),
        "motherGaiaEligibleRows": scalar(db, "SELECT SUM(count) FROM mother_cube WHERE population=?", (POPULATION["v7-gaia-id"],)),
        "selectionEligibleRows": scalar(db, "SELECT SUM(count) FROM selected_cube"),
        "hrEligibleRows": scalar(db, "SELECT SUM(count) FROM hr_density WHERE variant=?", (HR_VARIANT["raw"],)),
        "gold": scalar(db, "SELECT count FROM quality_summary WHERE quality=?", (QUALITY["gold"],)),
        "silver": scalar(db, "SELECT count FROM quality_summary WHERE quality=?", (QUALITY["silver"],)),
        "limited": scalar(db, "SELECT count FROM quality_summary WHERE quality=?", (QUALITY["limited"],)),
        "astrophysicalOverlapRows": scalar(db, "SELECT count FROM overlap_summary WHERE metric='science-astrophysical-parameter-row'"),
    }
    expected = {
        **EXPECTED,
        "skyOrder3Rows": EXPECTED["scienceRows"],
        "skyOrder5Rows": EXPECTED["scienceRows"],
    }
    for key, expected_value in expected.items():
        if key == "motherRows" or key == "motherWithoutGaiaIdRows":
            continue
        if counts.get(key) != expected_value:
            raise RuntimeError(f"v271 conservation failed for {key}: {counts.get(key)} != {expected_value}")
    missing_gaia = counts["motherEligibleRows"] - counts["motherGaiaEligibleRows"]
    if missing_gaia != EXPECTED["motherWithoutGaiaIdRows"]:
        raise RuntimeError(f"v271 Gaia-id partition failed: {missing_gaia}")
    return {**counts, "motherWithoutGaiaIdRows": missing_gaia}


def populate_healpix_centers(db: sqlite3.Connection) -> None:
    if scalar(db, "SELECT COUNT(*) FROM healpix_cell_center") == 13_056:
        return
    rows: list[tuple[int, int, float, float]] = []
    for order_n, healpix, cell_count in ((3, HEALPIX3, 768), (5, HEALPIX5, 12_288)):
        cells = np.arange(cell_count, dtype=np.int64)
        longitude, latitude = healpix.healpix_to_lonlat(cells)
        rows.extend(
            (order_n, int(cell), float(lon.to_value(u.deg)), float(lat.to_value(u.deg)))
            for cell, lon, lat in zip(cells, longitude, latitude, strict=True)
        )
    with db:
        db.execute("DELETE FROM healpix_cell_center")
        db.executemany(
            "INSERT INTO healpix_cell_center(order_n,cell,ra_deg,dec_deg) VALUES(?,?,?,?)",
            rows,
        )


def publish(
    db: sqlite3.Connection,
    part_path: Path,
    output_dir: Path,
    science_path: Path,
    mother_path: Path,
    counts: dict[str, int],
) -> Path:
    metadata = {
        "version": VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "counts": counts,
        "gEdges": G_EDGES.tolist(),
        "colorEdges": COLOR_EDGES.tolist(),
        "qualityTiers": QUALITY,
        "motherPopulations": POPULATION,
        "hrVariants": HR_VARIANT,
        "gaiaSurveyCompleteness": "unavailable",
    }
    with db:
        db.execute("DELETE FROM metadata")
        db.executemany(
            "INSERT INTO metadata(key,value) VALUES(?,?)",
            [(key, json.dumps(value, separators=(",", ":"))) for key, value in metadata.items()],
        )
    publish_part = output_dir / "gaia-research-v271.publish.sqlite.part"
    if publish_part.exists():
        publish_part.unlink()
    escaped = publish_part.resolve().as_posix().replace("'", "''")
    db.execute(f"VACUUM INTO '{escaped}'")
    aggregate_sha = sha256(publish_part)
    aggregate_path = output_dir / f"gaia-research-v271-{aggregate_sha}.sqlite"
    if aggregate_path.exists():
        if sha256(aggregate_path) != aggregate_sha:
            raise RuntimeError("Existing content-addressed aggregate does not match its filename")
        publish_part.unlink()
    else:
        os.replace(publish_part, aggregate_path)
    manifest: dict[str, object] = {
        "version": VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": utc_now(),
        "scienceSource": {"path": science_path.as_posix(), "bytes": science_path.stat().st_size, "sha256": SCIENCE_SHA256},
        "motherCatalog": {"path": mother_path.as_posix(), "bytes": mother_path.stat().st_size, "sha256": MOTHER_SHA256, "rows": EXPECTED["motherRows"]},
        "aggregate": {"path": aggregate_path.as_posix(), "bytes": aggregate_path.stat().st_size, "sha256": aggregate_sha},
        "counts": counts,
        "expectedCounts": EXPECTED,
        "dependencies": {"astropyHealpix": PINNED_ASTROPY_HEALPIX},
        "tables": [
            "metadata", "quality_summary", "healpix_cell_center", "sky_density", "mother_cube", "selected_cube",
            "hr_density", "analysis_flags", "quality_cut_flow", "overlap_summary",
        ],
        "canonicalSerialization": "sorted-keys-compact-json-excluding-generatedAt-and-manifestSha256",
        "boundary": "local-frozen-derived-analysis-no-network-no-gaia-survey-completeness-no-physics-mutation",
    }
    manifest["manifestSha256"] = canonical_manifest_sha(manifest)
    manifest_part = output_dir / "gaia-research-v271.manifest.json.part"
    manifest_path = output_dir / "gaia-research-v271.manifest.json"
    manifest_part.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    os.replace(manifest_part, manifest_path)
    return manifest_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--science", type=Path, default=Path("dist/gaia-science-v8/gaia-science-v8.sqlite"))
    parser.add_argument("--mother", type=Path, default=Path("dist/catalog-v7/catalog-v7.sqlite"))
    parser.add_argument("--output-dir", type=Path, default=Path("dist/gaia-research-v271"))
    parser.add_argument("--chunk-size", type=int, default=10_000, choices=(5_000, 10_000))
    args = parser.parse_args()
    science_path = args.science.resolve()
    mother_path = args.mother.resolve()
    if astropy_healpix.__version__ != PINNED_ASTROPY_HEALPIX:
        raise RuntimeError(f"astropy-healpix drifted: {astropy_healpix.__version__}")
    science_sha = sha256(science_path)
    mother_sha = sha256(mother_path)
    if science_sha != SCIENCE_SHA256 or mother_sha != MOTHER_SHA256:
        raise RuntimeError("Frozen Gaia v7/v8 input SHA changed")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    identity = {
        "version": VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "scienceSha256": science_sha,
        "motherSha256": mother_sha,
        "astropyHealpix": astropy_healpix.__version__,
        "chunkSize": args.chunk_size,
    }
    part_path = args.output_dir / "gaia-research-v271.sqlite.part"
    db = ensure_part_database(part_path, identity)
    try:
        build_mother(db, mother_path, args.chunk_size)
        build_selected(db, science_path, mother_path, args.chunk_size)
        reconcile_astrophysical_overlap_summary(db, science_path, mother_path, args.chunk_size)
        populate_healpix_centers(db)
        counts = validate(db)
        manifest_path = publish(db, part_path, args.output_dir.resolve(), science_path, mother_path, counts)
    finally:
        db.close()
    print(json.dumps({"passed": True, "version": VERSION, "counts": counts, "manifest": manifest_path.as_posix()}, indent=2))


if __name__ == "__main__":
    main()

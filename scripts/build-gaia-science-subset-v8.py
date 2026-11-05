#!/usr/bin/env python3
"""Fetch and freeze the exact 200k-row Orbit Atlas Gaia DR3 science subset.

The job uses Gaia DR3 random_index shards that are already inside the frozen
V7 mother catalog, then performs deterministic HEALPix x G x BP-RP sampling.
There is deliberately no retry loop and no threshold relaxation.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import sqlite3
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import astropy_healpix
import numpy as np
from astropy import units as u
from astropy.coordinates import ICRS
from astropy_healpix import HEALPix


VERSION = "v259-gaia-science-subset-v8"
ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync"
V7_SHA256 = "cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17"
TARGET_ROWS = 200_000
DEFAULT_FETCH_ROWS = 350_000
DEFAULT_SHARD_SIZE = 50_000
FIELDS = (
    "source_id", "ra", "dec", "ra_error", "dec_error", "parallax", "parallax_error",
    "pmra", "pmra_error", "pmdec", "pmdec_error",
    "ra_dec_corr", "ra_parallax_corr", "ra_pmra_corr", "ra_pmdec_corr",
    "dec_parallax_corr", "dec_pmra_corr", "dec_pmdec_corr",
    "parallax_pmra_corr", "parallax_pmdec_corr", "pmra_pmdec_corr",
    "radial_velocity", "radial_velocity_error",
    "phot_g_mean_flux", "phot_g_mean_flux_error",
    "phot_bp_mean_flux", "phot_bp_mean_flux_error",
    "phot_rp_mean_flux", "phot_rp_mean_flux_error",
    "phot_g_mean_mag", "phot_bp_mean_mag", "phot_rp_mean_mag", "bp_rp",
    "ruwe", "visibility_periods_used", "astrometric_params_solved",
    "duplicated_source", "phot_bp_rp_excess_factor",
)
ERROR_FIELDS = ("ra_error", "dec_error", "parallax_error", "pmra_error", "pmdec_error")
CORRELATION_FIELDS = (
    "ra_dec_corr", "ra_parallax_corr", "ra_pmra_corr", "ra_pmdec_corr",
    "dec_parallax_corr", "dec_pmra_corr", "dec_pmdec_corr",
    "parallax_pmra_corr", "parallax_pmdec_corr", "pmra_pmdec_corr",
)
REQUIRED_FINITE_FIELDS = (
    "ra", "dec", "parallax", "pmra", "pmdec", *ERROR_FIELDS, *CORRELATION_FIELDS,
    "phot_g_mean_flux", "phot_g_mean_flux_error", "phot_bp_mean_flux", "phot_bp_mean_flux_error",
    "phot_rp_mean_flux", "phot_rp_mean_flux_error", "phot_g_mean_mag", "bp_rp",
    "ruwe", "phot_bp_rp_excess_factor",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def csv_row_count(path: Path) -> int:
    with path.open("rb") as handle:
        return max(0, sum(1 for _ in handle) - 1)


def shard_query(start: int, end: int) -> str:
    columns = ",".join(FIELDS)
    return f"SELECT {columns} FROM gaiadr3.gaia_source WHERE random_index >= {start} AND random_index < {end}"


def fetch_shard(start: int, end: int, destination: Path) -> str:
    query = shard_query(start, end)
    expected = end - start
    if destination.is_file() and csv_row_count(destination) == expected:
        print(f"gaia-science cached [{start:,},{end:,})", flush=True)
        return query
    if destination.exists():
        raise RuntimeError(f"Incomplete cached Gaia shard must be diagnosed manually: {destination}")
    params = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "csv",
        "MAXREC": str(expected + 1),
        "QUERY": query,
    })
    request = urllib.request.Request(
        ENDPOINT,
        data=params.encode("utf-8"),
        headers={"User-Agent": "OrbitAtlasV259/1.0", "Content-Type": "application/x-www-form-urlencoded"},
    )
    partial = destination.with_suffix(destination.suffix + ".part")
    with urllib.request.urlopen(request, timeout=600) as response, partial.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
    rows = csv_row_count(partial)
    if rows != expected:
        raise RuntimeError(f"Gaia shard incomplete [{start},{end}): {rows} != {expected}")
    os.replace(partial, destination)
    print(f"gaia-science fetched [{start:,},{end:,})", flush=True)
    return query


def number(row: dict[str, str], field: str) -> float | None:
    raw = str(row.get(field, "")).strip()
    if raw in ("", "null", "None", "nan", "NaN", "--"):
        return None
    value = float(raw)
    return value if math.isfinite(value) else None


def covariance_for(row: dict[str, str]) -> np.ndarray | None:
    errors = [number(row, field) for field in ERROR_FIELDS]
    correlations = [number(row, field) for field in CORRELATION_FIELDS]
    if any(value is None or value <= 0 for value in errors) or any(value is None or abs(value) > 1 for value in correlations):
        return None
    correlation = np.eye(5, dtype=np.float64)
    pairs = ((0, 1), (0, 2), (0, 3), (0, 4), (1, 2), (1, 3), (1, 4), (2, 3), (2, 4), (3, 4))
    for (left, right), value in zip(pairs, correlations, strict=True):
        correlation[left, right] = correlation[right, left] = float(value)
    error_array = np.asarray(errors, dtype=np.float64)
    covariance = correlation * np.outer(error_array, error_array)
    tolerance = max(1.0, float(np.max(np.diag(covariance)))) * 1e-8
    if float(np.min(np.linalg.eigvalsh(covariance))) < -tolerance:
        return None
    return covariance


def quality_tier(row: dict[str, str]) -> str:
    parallax = number(row, "parallax") or 0
    parallax_error = number(row, "parallax_error") or math.inf
    bp_rp = number(row, "bp_rp") or 0
    excess = number(row, "phot_bp_rp_excess_factor") or math.inf
    ruwe = number(row, "ruwe") or math.inf
    visibility = int(float(row.get("visibility_periods_used") or 0))
    solved = int(float(row.get("astrometric_params_solved") or 0))
    lower = 1.0 + 0.015 * bp_rp * bp_rp
    upper = 1.3 + 0.06 * bp_rp * bp_rp
    if solved == 31 and ruwe < 1.4 and visibility >= 9 and abs(parallax / parallax_error) >= 5 and lower < excess < upper:
        return "gold"
    # Both Gaia DR3 five-parameter (31) and six-parameter (95) solutions carry
    # the five astrometric parameters/correlations required by this subset.
    # Six-parameter rows are not gold, but a PSD covariance makes them silver
    # rather than angular-only limited records.
    if solved in (31, 95):
        return "silver"
    return "limited"


def local_gaia_ids(v7_path: Path) -> set[int]:
    connection = sqlite3.connect(f"file:{v7_path.as_posix()}?mode=ro", uri=True)
    try:
        return {int(row[0]) for row in connection.execute("SELECT gaia_source_id FROM catalog_objects WHERE gaia_source_id IS NOT NULL")}
    finally:
        connection.close()


def valid_candidate(row: dict[str, str], local_ids: set[int]) -> bool:
    source_raw = str(row.get("source_id", "")).strip()
    if not source_raw.isdigit() or int(source_raw) not in local_ids:
        return False
    if any(number(row, field) is None for field in REQUIRED_FINITE_FIELDS):
        return False
    if any((number(row, field) or 0) <= 0 for field in ERROR_FIELDS):
        return False
    return covariance_for(row) is not None


def stable_key(source_id: str) -> int:
    return int.from_bytes(hashlib.sha256(source_id.encode("ascii")).digest()[:8], "big")


def magnitude_bin(value: float) -> int:
    return int(np.digitize([value], [12, 15, 17, 19])[0])


def color_bin(value: float) -> int:
    return int(np.digitize([value], [0, 0.8, 1.5])[0])


def select_rows(shards: list[Path], local_ids: set[int]) -> tuple[list[dict[str, str]], int]:
    hp5 = HEALPix(nside=2**5, order="nested", frame=ICRS())
    groups: dict[tuple[int, int, int], list[dict[str, str]]] = defaultdict(list)
    valid_count = 0
    for shard in shards:
        with shard.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                if not valid_candidate(row, local_ids):
                    continue
                ra = float(row["ra"])
                dec = float(row["dec"])
                cell = int(hp5.lonlat_to_healpix(ra * u.deg, dec * u.deg))
                row["healpix_order5"] = str(cell)
                row["quality_tier"] = quality_tier(row)
                groups[(cell, magnitude_bin(float(row["phot_g_mean_mag"])), color_bin(float(row["bp_rp"])))].append(row)
                valid_count += 1
    if valid_count < TARGET_ROWS:
        raise RuntimeError(f"Only {valid_count:,} valid Gaia science rows; refusing to relax selection")
    for rows in groups.values():
        rows.sort(key=lambda row: (stable_key(row["source_id"]), int(row["source_id"])))
    selected: list[dict[str, str]] = []
    group_keys = sorted(groups)
    rank = 0
    while len(selected) < TARGET_ROWS:
        added = 0
        for key in group_keys:
            rows = groups[key]
            if rank < len(rows):
                selected.append(rows[rank])
                added += 1
                if len(selected) == TARGET_ROWS:
                    break
        if added == 0:
            raise RuntimeError("Stratified selection exhausted before 200,000 rows")
        rank += 1
    selected.sort(key=lambda row: int(row["source_id"]))
    if len({row["source_id"] for row in selected}) != TARGET_ROWS:
        raise RuntimeError("Gaia science subset source IDs are not unique")
    return selected, valid_count


def create_output_database(path: Path, rows: list[dict[str, str]]) -> dict[str, int]:
    partial = path.with_suffix(path.suffix + ".part")
    partial.unlink(missing_ok=True)
    connection = sqlite3.connect(partial)
    column_sql = ",\n".join(f"{field} REAL" for field in FIELDS if field not in ("source_id", "duplicated_source"))
    connection.executescript(f"""
PRAGMA page_size=8192;
PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
CREATE TABLE gaia_science (
  source_id INTEGER PRIMARY KEY,
  {column_sql},
  duplicated_source INTEGER NOT NULL,
  healpix_order5 INTEGER NOT NULL,
  quality_tier TEXT NOT NULL CHECK(quality_tier IN ('gold','silver','limited')),
  solution_type TEXT NOT NULL
);
CREATE INDEX gaia_science_healpix ON gaia_science(healpix_order5, phot_g_mean_mag);
CREATE INDEX gaia_science_quality ON gaia_science(quality_tier);
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
""")
    database_fields = [field for field in FIELDS if field not in ("source_id", "duplicated_source")]
    columns = ["source_id", *database_fields, "duplicated_source", "healpix_order5", "quality_tier", "solution_type"]
    placeholders = ",".join("?" for _ in columns)
    insert_sql = f"INSERT INTO gaia_science ({','.join(columns)}) VALUES ({placeholders})"
    batch = []
    counts = {"gold": 0, "silver": 0, "limited": 0}
    for row in rows:
        tier = row["quality_tier"]
        counts[tier] += 1
        solved = int(float(row["astrometric_params_solved"]))
        values = [
            int(row["source_id"]),
            *[number(row, field) for field in database_fields],
            1 if str(row.get("duplicated_source", "")).lower() == "true" else 0,
            int(row["healpix_order5"]),
            tier,
            "five-parameter" if solved == 31 else "six-parameter" if solved == 95 else f"astrometric-params-{solved}",
        ]
        batch.append(values)
        if len(batch) >= 5_000:
            connection.executemany(insert_sql, batch)
            connection.commit()
            batch.clear()
    if batch:
        connection.executemany(insert_sql, batch)
    connection.executemany("INSERT INTO metadata(key,value) VALUES(?,?)", [
        ("version", VERSION),
        ("rowCount", str(TARGET_ROWS)),
        ("selection", "HEALPix-order5 x G x BP-RP deterministic round-robin"),
        ("monteCarloSeed", "2590004096"),
    ])
    connection.execute("PRAGMA optimize")
    connection.commit()
    output_count = int(connection.execute("SELECT count(*) FROM gaia_science").fetchone()[0])
    connection.close()
    if output_count != TARGET_ROWS:
        raise RuntimeError(f"Gaia science database incomplete: {output_count}")
    os.replace(partial, path)
    return counts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v7", type=Path, default=Path("dist/catalog-v7/catalog-v7.sqlite"))
    parser.add_argument("--shards", type=Path, default=Path("tools/asset-cache/gaia-science-v8-shards"))
    parser.add_argument("--output", type=Path, default=Path("dist/gaia-science-v8/gaia-science-v8.sqlite"))
    parser.add_argument("--fetch-rows", type=int, default=DEFAULT_FETCH_ROWS)
    parser.add_argument("--shard-size", type=int, default=DEFAULT_SHARD_SIZE)
    args = parser.parse_args()
    if astropy_healpix.__version__ != "1.1.2":
        raise RuntimeError("astropy-healpix must be pinned to 1.1.2")
    v7_path = args.v7.resolve()
    if sha256_file(v7_path) != V7_SHA256:
        raise RuntimeError("V7 mother catalog SHA changed")
    if args.fetch_rows < TARGET_ROWS or args.fetch_rows % args.shard_size:
        raise RuntimeError("Fetch rows must be an exact shard multiple and at least 200,000")
    args.shards.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    shard_paths = []
    queries = []
    for start in range(0, args.fetch_rows, args.shard_size):
        end = start + args.shard_size
        destination = args.shards / f"gaia-science-{start:07d}-{end:07d}.csv"
        queries.append(fetch_shard(start, end, destination))
        shard_paths.append(destination)
    retrieved_at = datetime.fromtimestamp(
        max(path.stat().st_mtime for path in shard_paths),
        timezone.utc,
    ).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    local_ids = local_gaia_ids(v7_path)
    rows, valid_count = select_rows(shard_paths, local_ids)
    quality_counts = create_output_database(args.output.resolve(), rows)
    output_sha = sha256_file(args.output.resolve())
    manifest = {
        "version": VERSION,
        "retrievedAt": retrieved_at,
        "source": "ESA Gaia DR3 gaiadr3.gaia_source",
        "sourceUrl": ENDPOINT,
        "queries": queries,
        "fetchedRowCount": args.fetch_rows,
        "validCandidateCount": valid_count,
        "rowCount": TARGET_ROWS,
        "fields": list(FIELDS),
        "correlationFields": list(CORRELATION_FIELDS),
        "selection": {
            "healpixOrder": 5,
            "magnitudeBins": [12, 15, 17, 19],
            "colorBins": [0, 0.8, 1.5],
            "strategy": "deterministic-round-robin-within-healpix-g-bp-rp-strata",
            "stableKey": "sha256(source_id)[0:8]",
            "failClosedMinimum": TARGET_ROWS,
        },
        "qualityCounts": quality_counts,
        "covariance": "symmetric-five-parameter-from-errors-and-10-correlations-PSD-checked",
        "monteCarlo": {"samples": 4096, "seed": 2590004096},
        "motherCatalog": {"path": "dist/catalog-v7/catalog-v7.sqlite", "sha256": V7_SHA256, "rowCount": 1_224_219},
        "shards": [{"path": path.as_posix(), "rows": csv_row_count(path), "sha256": sha256_file(path)} for path in shard_paths],
        "output": {"path": "dist/gaia-science-v8/gaia-science-v8.sqlite", "bytes": args.output.stat().st_size, "sha256": output_sha},
        "runtimeNetworkCanonical": False,
        "boundary": "frozen-build-time-subset-not-complete-gaia-archive-or-universal-completeness",
    }
    manifest_path = args.output.with_suffix(".manifest.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": True, "rowCount": TARGET_ROWS, "validCandidates": valid_count, "qualityCounts": quality_counts, "sha256": output_sha}, indent=2))


if __name__ == "__main__":
    main()

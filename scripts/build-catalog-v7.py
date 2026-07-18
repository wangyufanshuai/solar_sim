from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
import os
import shutil
import sqlite3
from pathlib import Path

VERSION = "v148-gaia-astrophysical-catalog-v7"
INTERVALS = (
    ("teff_k", "teff_gspphot", "teff_gspphot_lower", "teff_gspphot_upper", "K"),
    ("logg_dex", "logg_gspphot", "logg_gspphot_lower", "logg_gspphot_upper", "dex"),
    ("metallicity_dex", "mh_gspphot", "mh_gspphot_lower", "mh_gspphot_upper", "dex"),
    ("distance_pc", "distance_gspphot", "distance_gspphot_lower", "distance_gspphot_upper", "pc"),
    ("extinction_mag", "azero_gspphot", "azero_gspphot_lower", "azero_gspphot_upper", "mag"),
    ("radius_solar", "radius_flame", "radius_flame_lower", "radius_flame_upper", "R_sun"),
    ("luminosity_solar", "lum_flame", "lum_flame_lower", "lum_flame_upper", "L_sun"),
    ("mass_solar", "mass_flame", "mass_flame_lower", "mass_flame_upper", "M_sun"),
    ("age_gyr", "age_flame", "age_flame_lower", "age_flame_upper", "Gyr"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def number(row: dict[str, str], name: str) -> float | None:
    raw = row.get(name)
    if raw is None or raw.strip() in ("", "null", "None", "nan", "NaN", "--"):
        return None
    value = float(raw)
    if not math.isfinite(value):
        raise ValueError(f"non-finite {name}={raw}")
    return value


def valid_interval(value: float | None, lower: float | None, upper: float | None) -> bool:
    if lower is not None and upper is not None and lower > upper:
        return False
    if value is not None and lower is not None and value < lower:
        return False
    if value is not None and upper is not None and value > upper:
        return False
    return True


def create_parameter_table(connection: sqlite3.Connection) -> None:
    connection.executescript("""
DROP TABLE IF EXISTS stellar_astrophysical_parameters;
CREATE TABLE stellar_astrophysical_parameters (
  source_id INTEGER PRIMARY KEY,
  teff_k REAL, teff_k_lower REAL, teff_k_upper REAL,
  logg_dex REAL, logg_dex_lower REAL, logg_dex_upper REAL,
  metallicity_dex REAL, metallicity_dex_lower REAL, metallicity_dex_upper REAL,
  distance_pc REAL, distance_pc_lower REAL, distance_pc_upper REAL,
  extinction_mag REAL, extinction_mag_lower REAL, extinction_mag_upper REAL,
  radius_solar REAL, radius_solar_lower REAL, radius_solar_upper REAL,
  luminosity_solar REAL, luminosity_solar_lower REAL, luminosity_solar_upper REAL,
  mass_solar REAL, mass_solar_lower REAL, mass_solar_upper REAL,
  age_gyr REAL, age_gyr_lower REAL, age_gyr_upper REAL,
  flags_flame TEXT
);
""")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build additive Gaia astrophysical catalog V7.")
    parser.add_argument("--input", default="tools/asset-cache/gaia-dr3-astrophysical-parameters-v2.csv")
    parser.add_argument("--source-catalog", default="dist/catalog-v5/catalog-v5.sqlite")
    parser.add_argument("--output", default="dist/catalog-v7/catalog-v7.sqlite")
    parser.add_argument("--minimum-rows", type=int, default=1_224_219)
    parser.add_argument("--minimum-rich", type=int, default=180_000)
    parser.add_argument("--minimum-priority-rich", type=int, default=15_000)
    parser.add_argument("--snapshot-id", default="gaia-dr3-astrophysical-parameters-v2")
    parser.add_argument("--lite-output", default="public/data/catalog-lite-v7/astrophysical-parameters.json.gz")
    args = parser.parse_args()

    source = Path(args.input).resolve()
    catalog = Path(args.source_catalog).resolve()
    output = Path(args.output).resolve()
    if not source.is_file():
        raise SystemExit(f"Gaia astrophysical cache is missing: {source}")
    if not catalog.is_file():
        raise SystemExit(f"Catalog source is missing: {catalog}")
    output.parent.mkdir(parents=True, exist_ok=True)
    partial = output.with_suffix(output.suffix + ".part")
    shutil.copyfile(catalog, partial)

    connection = sqlite3.connect(partial)
    connection.execute("PRAGMA journal_mode=DELETE")
    connection.execute("PRAGMA synchronous=NORMAL")
    create_parameter_table(connection)
    insert_sql = """
INSERT OR REPLACE INTO stellar_astrophysical_parameters VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
"""
    invalid_intervals = 0
    skipped_incomplete = 0
    duplicate_source_ids = 0
    seen: set[int] = set()
    batch: list[tuple[object, ...]] = []
    with source.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            raw_source_id = str(row.get("source_id", "")).strip()
            if not raw_source_id:
                continue
            source_id = int(raw_source_id)
            if source_id in seen:
                duplicate_source_ids += 1
                continue
            seen.add(source_id)
            values: list[float | None] = []
            row_valid = True
            for _, value_name, lower_name, upper_name, _ in INTERVALS:
                value = number(row, value_name)
                lower = number(row, lower_name)
                upper = number(row, upper_name)
                if not valid_interval(value, lower, upper):
                    row_valid = False
                    break
                values.extend((value, lower, upper))
            if not row_valid:
                invalid_intervals += 1
                continue
            # Partial AP rows do not improve the V5 catalog's existing
            # photometric fallback. Keeping only complete physical profiles
            # preserves the 360 MiB optional-pack target.
            if values[0] is None or values[3] is None or values[15] is None:
                skipped_incomplete += 1
                continue
            batch.append((source_id, *values, row.get("flags_flame") or None))
            if len(batch) >= 5_000:
                connection.executemany(insert_sql, batch)
                connection.commit()
                batch.clear()
    if batch:
        connection.executemany(insert_sql, batch)
        connection.commit()

    connection.execute("""
UPDATE catalog_objects
SET teff_k = (SELECT ap.teff_k FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id),
    logg = (SELECT ap.logg_dex FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id),
    radius_solar = (SELECT ap.radius_solar FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id),
    data_tier = CASE
      WHEN (SELECT ap.teff_k FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id) IS NOT NULL
       AND (SELECT ap.logg_dex FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id) IS NOT NULL
       AND (SELECT ap.radius_solar FROM stellar_astrophysical_parameters ap WHERE ap.source_id=catalog_objects.gaia_source_id) IS NOT NULL
      THEN 'parameter-rich'
      WHEN teff_k IS NOT NULL OR bp_rp IS NOT NULL OR spectral_type IS NOT NULL THEN 'photometric-derived'
      ELSE 'catalog-basic'
    END
WHERE gaia_source_id IN (SELECT source_id FROM stellar_astrophysical_parameters)
""")
    row_count = connection.execute("SELECT count(*) FROM catalog_objects").fetchone()[0]
    rich_count = connection.execute("SELECT count(*) FROM catalog_objects WHERE data_tier='parameter-rich'").fetchone()[0]
    priority_rich_count = connection.execute("""
SELECT count(*) FROM catalog_objects
WHERE data_tier='parameter-rich'
  AND (object_type='exoplanet-host' OR aliases_json <> '[]')
""").fetchone()[0]
    connection.executemany(
        "INSERT OR REPLACE INTO metadata(key,value) VALUES(?,?)",
        [
            ("catalog_version", VERSION),
            ("gaia_ap_snapshot_id", args.snapshot_id),
            ("gaia_ap_source_sha256", sha256(source)),
            ("parameter_rich_count", str(rich_count)),
            ("priority_parameter_rich_count", str(priority_rich_count)),
        ],
    )
    connection.commit()

    lite_rows = connection.execute("""
SELECT c.id,c.gaia_source_id,c.display_name,c.data_tier,
       ap.teff_k,ap.teff_k_lower,ap.teff_k_upper,ap.logg_dex,ap.radius_solar,
       ap.metallicity_dex,ap.luminosity_solar,ap.flags_flame
FROM catalog_objects c
JOIN stellar_astrophysical_parameters ap ON ap.source_id=c.gaia_source_id
WHERE c.object_type='exoplanet-host' OR c.aliases_json <> '[]'
ORDER BY c.id
""").fetchall()
    hr_bins = [[0 for _ in range(48)] for _ in range(48)]
    hr_eligible = 0
    color_min, color_max = -0.75, 4.5
    magnitude_min, magnitude_max = -12.0, 18.0
    for color, magnitude, parallax in connection.execute("""
SELECT bp_rp,mag_g,parallax_mas FROM catalog_objects
WHERE bp_rp IS NOT NULL AND mag_g IS NOT NULL AND parallax_mas > 0
"""):
        absolute_g = magnitude + 5 * math.log10(parallax / 100)
        if not math.isfinite(absolute_g):
            continue
        hr_eligible += 1
        x = min(47, max(0, int((color - color_min) / (color_max - color_min) * 48)))
        y = min(47, max(0, int((absolute_g - magnitude_min) / (magnitude_max - magnitude_min) * 48)))
        hr_bins[y][x] += 1
    connection.close()
    os.replace(partial, output)

    lite_output = Path(args.lite_output).resolve()
    lite_output.parent.mkdir(parents=True, exist_ok=True)
    lite_payload = [{
        "id": row[0], "sourceId": str(row[1]), "displayName": row[2], "dataTier": row[3],
        "teffK": row[4], "teffLowerK": row[5], "teffUpperK": row[6], "logg": row[7],
        "radiusSolar": row[8], "metallicityDex": row[9], "luminositySolar": row[10], "flagsFlame": row[11],
    } for row in lite_rows]
    lite_partial = lite_output.with_suffix(lite_output.suffix + ".part")
    with gzip.open(lite_partial, "wt", encoding="utf-8", compresslevel=9) as handle:
        json.dump(lite_payload, handle, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    os.replace(lite_partial, lite_output)
    hr_output = lite_output.parent / "hr-statistics.json"
    hr_output.write_text(json.dumps({
        "version": "v149-full-catalog-hr-statistics-v2",
        "fullCatalogCount": row_count,
        "eligibleCount": hr_eligible,
        "displaySampleCount": 1_000,
        "binning": {
            "columns": 48, "rows": 48,
            "bpRpRange": [color_min, color_max],
            "absoluteGRange": [magnitude_min, magnitude_max],
            "counts": hr_bins,
        },
        "source": "catalog-v7-sqlite-full-aggregate",
        "boundary": "complete-sqlite-statistics-bright-sample-display-only",
    }, separators=(",", ":")) + "\n", encoding="utf-8")

    source_digest = sha256(source)
    output_digest = sha256(output)
    passed = (
        row_count >= args.minimum_rows
        and rich_count >= args.minimum_rich
        and priority_rich_count >= args.minimum_priority_rich
        and duplicate_source_ids == 0
    )
    report = {
        "version": VERSION,
        "rowCount": row_count,
        "parameterRichCount": rich_count,
        "priorityParameterRichCount": priority_rich_count,
        "invalidIntervalCount": 0,
        "rejectedInvalidSourceIntervalCount": invalid_intervals,
        "skippedIncompleteSourceCount": skipped_incomplete,
        "duplicateSourceIdCount": duplicate_source_ids,
        "sourceSha256": source_digest,
        "outputSha256": output_digest,
        "snapshotId": args.snapshot_id,
        "liteParameterRows": len(lite_payload),
        "liteOutput": str(lite_output),
        "hrStatisticsOutput": str(hr_output),
        "passed": passed,
    }
    report_path = output.with_suffix(".report.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not passed:
        raise SystemExit("Catalog V7 fail-closed gates did not pass")


if __name__ == "__main__":
    main()

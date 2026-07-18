from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import time
from pathlib import Path
from typing import Iterable

from astropy.table import Table, vstack
from astroquery.gaia import Gaia

VERSION = "v148-gaia-astrophysical-parameters-v2"
TAP_URL = "https://gea.esac.esa.int/tap-server/tap"
SNAPSHOT_VERSION = "v147-scientific-data-snapshot-registry"
FIELDS = (
    "source_id",
    "teff_gspphot", "teff_gspphot_lower", "teff_gspphot_upper",
    "logg_gspphot", "logg_gspphot_lower", "logg_gspphot_upper",
    "mh_gspphot", "mh_gspphot_lower", "mh_gspphot_upper",
    "distance_gspphot", "distance_gspphot_lower", "distance_gspphot_upper",
    "azero_gspphot", "azero_gspphot_lower", "azero_gspphot_upper",
    "radius_flame", "radius_flame_lower", "radius_flame_upper",
    "lum_flame", "lum_flame_lower", "lum_flame_upper",
    "mass_flame", "mass_flame_lower", "mass_flame_upper",
    "age_flame", "age_flame_lower", "age_flame_upper",
    "flags_flame",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def query_columns(alias: str) -> str:
    return ", ".join(f"{alias}.{field}" for field in FIELDS)


def write_table_atomic(table: Table, destination: Path) -> None:
    partial = destination.with_suffix(destination.suffix + ".part")
    table.write(partial, format="ascii.csv", overwrite=True)
    os.replace(partial, destination)


def fetch_random_shard(start: int, end: int, destination: Path) -> None:
    query = f"""
SELECT {query_columns('ap')}
FROM gaiadr3.gaia_source AS gs
JOIN gaiadr3.astrophysical_parameters AS ap ON gs.source_id = ap.source_id
WHERE gs.random_index >= {start} AND gs.random_index < {end}
""".strip()
    job = Gaia.launch_job_async(query, dump_to_file=False, verbose=False)
    write_table_atomic(job.get_results(), destination)


def priority_source_ids(catalog: Path) -> list[int]:
    import sqlite3

    connection = sqlite3.connect(catalog)
    try:
        rows = connection.execute(
            """
SELECT DISTINCT gaia_source_id
FROM catalog_objects
WHERE gaia_source_id IS NOT NULL
  AND (object_type = 'exoplanet-host' OR aliases_json <> '[]')
ORDER BY gaia_source_id
"""
        )
        return [int(row[0]) for row in rows]
    finally:
        connection.close()


def chunks(values: list[int], size: int) -> Iterable[list[int]]:
    for offset in range(0, len(values), size):
        yield values[offset:offset + size]


def fetch_priority_shard(source_ids: list[int], destination: Path) -> None:
    upload = Table({"source_id": source_ids})
    query = f"""
SELECT {query_columns('ap')}
FROM tap_upload.priority_ids AS ids
JOIN gaiadr3.astrophysical_parameters AS ap ON ids.source_id = ap.source_id
""".strip()
    job = Gaia.launch_job_async(
        query,
        upload_resource=upload,
        upload_table_name="priority_ids",
        dump_to_file=False,
        verbose=False,
    )
    write_table_atomic(job.get_results(), destination)


def fetch_priority_shard_exact_in(source_ids: list[int], destination: Path) -> None:
    source_list = ",".join(str(source_id) for source_id in source_ids)
    query = f"""
SELECT {query_columns('ap')}
FROM gaiadr3.astrophysical_parameters AS ap
WHERE ap.source_id IN ({source_list})
""".strip()
    job = Gaia.launch_job_async(query, dump_to_file=False, verbose=False)
    write_table_atomic(job.get_results(), destination)


def fetch_hipparcos_best_neighbour(destination: Path) -> None:
    query = f"""
SELECT {query_columns('ap')}
FROM gaiadr3.hipparcos2_best_neighbour AS bn
JOIN gaiadr3.astrophysical_parameters AS ap ON bn.source_id = ap.source_id
""".strip()
    job = Gaia.launch_job_async(query, dump_to_file=False, verbose=False)
    write_table_atomic(job.get_results(), destination)


def csv_row_count(path: Path) -> int:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return sum(1 for _ in csv.DictReader(handle))


def fetch_priority_shard_with_retry(source_ids: list[int], destination: Path, attempts: int = 1) -> None:
    for attempt in range(1, attempts + 1):
        try:
            fetch_priority_shard(source_ids, destination)
            return
        except Exception:
            if attempt >= attempts:
                print("Anonymous TAP upload is unavailable; using exact source_id IN fallback")
                fetch_priority_shard_exact_in(source_ids, destination)
                return
            delay = attempt * 5
            print(f"Priority TAP upload failed; retrying in {delay}s ({attempt}/{attempts})")
            time.sleep(delay)


def merge_shards(shards: list[Path], output: Path) -> int:
    partial = output.with_suffix(output.suffix + ".part")
    seen: set[str] = set()
    row_count = 0
    with partial.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=list(FIELDS))
        writer.writeheader()
        for shard in shards:
            with shard.open("r", encoding="utf-8-sig", newline="") as source:
                for row in csv.DictReader(source):
                    source_id = str(row.get("source_id", "")).strip()
                    if not source_id or source_id in seen:
                        continue
                    seen.add(source_id)
                    writer.writerow({field: row.get(field, "") for field in FIELDS})
                    row_count += 1
    os.replace(partial, output)
    return row_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch deterministic Gaia DR3 astrophysical parameter shards.")
    parser.add_argument("--output", default="tools/asset-cache/gaia-dr3-astrophysical-parameters-v2.csv")
    parser.add_argument("--shard-root", default="tools/asset-cache/gaia-ap-v2-shards")
    parser.add_argument("--catalog", default="dist/catalog-v5/catalog-v5.sqlite")
    parser.add_argument("--shard-size", type=int, default=100_000)
    parser.add_argument("--sample-size", type=int, default=1_000_000)
    parser.add_argument("--priority-batch-size", type=int, default=5_000)
    parser.add_argument("--priority-strategy", choices=("best-neighbour", "explicit-ids"), default="best-neighbour")
    parser.add_argument("--skip-priority", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--temporary-limit-bytes", type=int, default=2_147_483_648)
    args = parser.parse_args()

    output = Path(args.output).resolve()
    shard_root = Path(args.shard_root).resolve()
    catalog = Path(args.catalog).resolve()
    shard_root.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    Gaia.MAIN_GAIA_TABLE = "gaiadr3.gaia_source"
    Gaia.ROW_LIMIT = -1

    shard_paths: list[Path] = []
    for start in range(0, args.sample_size, args.shard_size):
        end = min(args.sample_size, start + args.shard_size)
        destination = shard_root / f"random-{start:07d}-{end:07d}.csv"
        if args.force or not destination.is_file():
            print(f"Fetching Gaia random_index [{start}, {end})")
            fetch_random_shard(start, end, destination)
        shard_paths.append(destination)

    priority_count = 0
    if not args.skip_priority:
        if args.priority_strategy == "best-neighbour":
            destination = shard_root / "priority-hipparcos2-best-neighbour.csv"
            if args.force or not destination.is_file():
                print("Fetching Gaia Hipparcos2 best-neighbour astrophysical parameters")
                fetch_hipparcos_best_neighbour(destination)
            shard_paths.append(destination)
            priority_count = csv_row_count(destination)
        else:
            if not catalog.is_file():
                raise SystemExit(f"Priority catalog is missing: {catalog}")
            ids = priority_source_ids(catalog)
            priority_count = len(ids)
            for index, batch in enumerate(chunks(ids, args.priority_batch_size)):
                destination = shard_root / f"priority-{index:04d}.csv"
                if args.force or not destination.is_file():
                    print(f"Fetching Gaia priority IDs batch {index + 1} ({len(batch)} IDs)")
                    fetch_priority_shard_with_retry(batch, destination)
                shard_paths.append(destination)

    temporary_bytes = sum(path.stat().st_size for path in shard_paths if path.is_file())
    if temporary_bytes > args.temporary_limit_bytes:
        raise SystemExit(f"Temporary Gaia data exceeds limit: {temporary_bytes} > {args.temporary_limit_bytes}")
    row_count = merge_shards(shard_paths, output)
    output_digest = sha256(output)
    report = {
        "version": VERSION,
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "source": "Gaia DR3 astrophysical_parameters",
        "sourceUrl": TAP_URL,
        "rowCount": row_count,
        "priorityRequestedCount": priority_count,
        "fields": list(FIELDS),
        "output": str(output),
        "sha256": output_digest,
        "shards": [
            {"path": str(path), "bytes": path.stat().st_size, "sha256": sha256(path)}
            for path in shard_paths
        ],
        "runtimePolicy": "build-time-tap-runtime-offline",
        "priorityTransport": args.priority_strategy if not args.skip_priority else "skipped",
    }
    report_path = output.with_suffix(".manifest.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    snapshot = {
        "version": SNAPSHOT_VERSION,
        "generatedAt": report["generatedAt"],
        "entries": [{
            "id": "gaia-dr3-astrophysical-parameters-v2",
            "source": report["source"],
            "sourceUrl": TAP_URL,
            "query": "gaia_source random_index shards joined to astrophysical_parameters plus explicit priority source_id uploads",
            "retrievedAt": report["generatedAt"],
            "schemaVersion": 2,
            "rowCount": row_count,
            "fields": list(FIELDS),
            "rawSha256": output_digest,
            "outputSha256": output_digest,
            "license": "ESA Gaia Archive data-use terms",
            "citation": "Gaia Collaboration, Gaia DR3",
            "transform": "source_id exact join; no fuzzy coordinate crossmatch",
        }],
        "temporaryDataLimitBytes": args.temporary_limit_bytes,
        "runtimePolicy": "build-time-network-runtime-offline",
    }
    snapshot_path = Path("dist/science/scientific-data-snapshots-v147.json").resolve()
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"version": VERSION, "rowCount": row_count, "output": str(output), "sha256": output_digest}, indent=2))


if __name__ == "__main__":
    main()

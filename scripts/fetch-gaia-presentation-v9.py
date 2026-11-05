#!/usr/bin/env python3
"""Fetch fail-closed Gaia DR3 presentation shards for Orbit Atlas v265.

Every network shard is attempted once. Completed shards are immutable
checkpoints; partial or invalid files stop the run and are never retried by
this process.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sqlite3
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


VERSION = "v265-gaia-dr3-presentation-shards-v9"
ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync"
COLUMNS = (
    "random_index",
    "source_id",
    "ra",
    "dec",
    "phot_g_mean_mag",
    "bp_rp",
    "parallax",
)
SHARD_ROWS = 100_000
MAX_SHARDS = 102
TARGET_VALID = 10_000_000


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_json_atomic(path: Path, value: object) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    temporary.replace(path)


def load_bright_ids(paths: list[Path]) -> set[int]:
    result: set[int] = set()
    for path in paths:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            raise RuntimeError(f"Bright-layer source is not an array: {path}")
        for row in rows:
            source_id = row.get("sourceId") if isinstance(row, dict) else None
            if source_id is not None:
                result.add(int(source_id))
    return result


def shard_query(start: int, end: int) -> str:
    return (
        f"SELECT {','.join(COLUMNS)} FROM gaiadr3.gaia_source "
        f"WHERE random_index >= {start} AND random_index < {end} "
        "ORDER BY random_index,source_id"
    )


def finite(raw: str | None) -> float | None:
    if raw is None or raw.strip().lower() in {"", "null", "nan", "none", "--"}:
        return None
    value = float(raw)
    return value if math.isfinite(value) else None


def validate_and_index_shard(
    path: Path,
    shard: int,
    start: int,
    end: int,
    bright_ids: set[int],
    connection: sqlite3.Connection,
) -> dict[str, int]:
    rows = 0
    valid = 0
    rejected_invalid = 0
    excluded_bright = 0
    previous_key: tuple[int, int] | None = None
    candidates: list[tuple[int, int, int]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != COLUMNS:
            raise RuntimeError(f"Gaia shard {shard} columns changed: {reader.fieldnames}")
        for row in reader:
            rows += 1
            random_index = int(row["random_index"])
            source_id = int(row["source_id"])
            key = (random_index, source_id)
            if random_index < start or random_index >= end:
                raise RuntimeError(f"Gaia shard {shard} random_index escaped [{start}, {end})")
            if previous_key is not None and key <= previous_key:
                raise RuntimeError(f"Gaia shard {shard} is not strictly ordered")
            previous_key = key
            ra = finite(row["ra"])
            dec = finite(row["dec"])
            magnitude = finite(row["phot_g_mean_mag"])
            if ra is None or dec is None or magnitude is None or dec < -90 or dec > 90:
                rejected_invalid += 1
                continue
            if source_id in bright_ids:
                excluded_bright += 1
                continue
            candidates.append((source_id, random_index, shard))
            valid += 1
    if rows <= 0 or rows > SHARD_ROWS:
        raise RuntimeError(f"Gaia shard {shard} row count is outside (0, {SHARD_ROWS}]: {rows}")
    connection.execute("DELETE FROM candidates WHERE shard = ?", (shard,))
    connection.executemany(
        "INSERT OR IGNORE INTO candidates(source_id,random_index,shard) VALUES(?,?,?)",
        candidates,
    )
    connection.commit()
    return {
        "rows": rows,
        "validRows": valid,
        "rejectedInvalid": rejected_invalid,
        "excludedBright": excluded_bright,
    }


def verify_cached_shard(path: Path, sidecar: Path, shard: int, start: int, end: int) -> dict[str, object]:
    if path.exists() != sidecar.exists():
        raise RuntimeError(f"Gaia shard {shard} checkpoint is incomplete")
    if not path.exists():
        return {}
    metadata = json.loads(sidecar.read_text(encoding="utf-8"))
    expected_query = shard_query(start, end)
    if (
        metadata.get("version") != VERSION
        or metadata.get("shard") != shard
        or metadata.get("randomIndexRange") != [start, end]
        or metadata.get("query") != expected_query
        or metadata.get("sha256") != sha256_file(path)
    ):
        raise RuntimeError(f"Gaia shard {shard} cached provenance is invalid")
    return metadata


def download_shard(root: Path, shard: int, start: int, end: int, timeout_seconds: int) -> tuple[Path, dict[str, object]]:
    destination = root / f"gaia-v9-{shard:03d}.csv"
    sidecar = root / f"gaia-v9-{shard:03d}.json"
    cached = verify_cached_shard(destination, sidecar, shard, start, end)
    if cached:
        print(f"v265 shard {shard + 1}/{MAX_SHARDS}: cached {cached['rowCount']:,} rows", flush=True)
        return destination, cached
    partial = destination.with_suffix(".csv.part")
    if partial.exists():
        raise RuntimeError(f"Gaia shard {shard} has an unresolved partial file: {partial}")
    query = shard_query(start, end)
    params = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "csv",
        "MAXREC": str(SHARD_ROWS + 1),
        "QUERY": query,
    })
    request = urllib.request.Request(
        f"{ENDPOINT}?{params}",
        headers={"User-Agent": "OrbitAtlasGaiaPresentationV9/1.0"},
    )
    started_at = utc_now()
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response, partial.open("xb") as output:
            while True:
                block = response.read(1024 * 1024)
                if not block:
                    break
                output.write(block)
    except Exception:
        # The partial payload is deliberately preserved as negative evidence.
        raise
    sha256 = sha256_file(partial)
    with partial.open("r", encoding="utf-8-sig", newline="") as handle:
        row_count = sum(1 for _ in handle) - 1
    if row_count <= 0 or row_count > SHARD_ROWS:
        raise RuntimeError(f"Gaia shard {shard} returned {row_count:,} rows")
    partial.replace(destination)
    metadata = {
        "version": VERSION,
        "shard": shard,
        "endpoint": ENDPOINT,
        "query": query,
        "randomIndexRange": [start, end],
        "rowCount": row_count,
        "bytes": destination.stat().st_size,
        "sha256": sha256,
        "startedAt": started_at,
        "completedAt": utc_now(),
        "automaticRetryApplied": False,
    }
    write_json_atomic(sidecar, metadata)
    print(f"v265 shard {shard + 1}/{MAX_SHARDS}: downloaded {row_count:,} rows sha256={sha256}", flush=True)
    return destination, metadata


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-root", type=Path, default=Path("tools/asset-cache/gaia-dr3-presentation-v9-shards"))
    parser.add_argument("--target-valid", type=int, default=TARGET_VALID)
    parser.add_argument("--max-shards", type=int, default=MAX_SHARDS)
    parser.add_argument("--timeout-seconds", type=int, default=600)
    parser.add_argument("--bright", action="append", type=Path, default=[
        Path("public/data/gaia-dr3-nearby-46000-v255.json"),
        Path("public/data/gaia-dr3-bright-5000.json"),
    ])
    args = parser.parse_args()
    if args.max_shards < 1 or args.max_shards > MAX_SHARDS:
        raise SystemExit(f"max-shards must be in [1, {MAX_SHARDS}]")
    root = args.checkpoint_root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    bright_ids = load_bright_ids([path.resolve() for path in args.bright])
    connection = sqlite3.connect(root / "candidate-progress.sqlite")
    connection.execute("PRAGMA journal_mode=DELETE")
    connection.execute("CREATE TABLE IF NOT EXISTS candidates(source_id INTEGER PRIMARY KEY, random_index INTEGER NOT NULL, shard INTEGER NOT NULL)")
    completed: list[dict[str, object]] = []
    try:
        for shard in range(args.max_shards):
            start = shard * SHARD_ROWS
            end = start + SHARD_ROWS
            path, metadata = download_shard(root, shard, start, end, args.timeout_seconds)
            counts = validate_and_index_shard(path, shard, start, end, bright_ids, connection)
            unique_valid = int(connection.execute("SELECT COUNT(*) FROM candidates").fetchone()[0])
            row = {**metadata, **counts, "uniqueValidCandidateRows": unique_valid}
            completed.append(row)
            progress = {
                "version": VERSION,
                "status": "ready-for-build" if unique_valid >= args.target_valid else "fetching",
                "targetValidRows": args.target_valid,
                "completedShards": len(completed),
                "maximumShards": args.max_shards,
                "uniqueValidCandidateRows": unique_valid,
                "brightExclusionSourceIds": len(bright_ids),
                "lastCompletedShard": shard,
                "updatedAt": utc_now(),
                "automaticRetryApplied": False,
                "shards": completed,
            }
            write_json_atomic(root / "progress.json", progress)
            print(f"v265 progress shards={len(completed)} unique-valid={unique_valid:,}/{args.target_valid:,}", flush=True)
            if unique_valid >= args.target_valid:
                connection.close()
                return
        raise RuntimeError(f"Gaia v265 candidates are insufficient after {args.max_shards} shards")
    except Exception as error:
        failure = {
            "version": VERSION,
            "status": "blocked",
            "error": str(error),
            "completedShards": len(completed),
            "failedAt": utc_now(),
            "automaticRetryApplied": False,
        }
        write_json_atomic(root / "failure.json", failure)
        raise
    finally:
        try:
            connection.close()
        except Exception:
            pass


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr, flush=True)
        raise

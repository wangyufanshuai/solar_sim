#!/usr/bin/env python3
"""Fetch exactly one new Gaia DR3 presentation shard for v272.

Each invocation performs one preflight and at most one new network shard.  A
failed attempt is preserved as negative evidence and is never retried by the
same process.  A later explicit invocation may attempt the same missing shard.
"""

from __future__ import annotations

import argparse
import csv
import ctypes
import hashlib
import json
import math
import os
import shutil
import socket
import sqlite3
import ssl
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

VERSION = "v272-gaia-dr3-presentation-fetch-next-v2"
LEGACY_VERSION = "v272-gaia-dr3-presentation-fetch-next-v1"
ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync"
HOST = "gea.esac.esa.int"
COLUMNS = ("random_index", "source_id", "ra", "dec", "phot_g_mean_mag", "bp_rp", "parallax")
SHARD_ROWS = 100_000
MAX_SHARDS = 102
TARGET_VALID = 10_000_000
DEFAULT_MIN_FREE_MEMORY_GIB = 6.0
LOW_MEMORY_FLOOR_GIB = 3.0
MIN_FREE_DISK_BYTES = 30 * 1024**3
VALIDATION_BATCH_ROWS = 5_000


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def safe_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_json_atomic(path: Path, value: object) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    os.replace(temporary, path)


def free_physical_memory() -> int:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [
                ("length", ctypes.c_ulong), ("memory_load", ctypes.c_ulong),
                ("total_physical", ctypes.c_ulonglong), ("available_physical", ctypes.c_ulonglong),
                ("total_page_file", ctypes.c_ulonglong), ("available_page_file", ctypes.c_ulonglong),
                ("total_virtual", ctypes.c_ulonglong), ("available_virtual", ctypes.c_ulonglong),
                ("available_extended_virtual", ctypes.c_ulonglong),
            ]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise OSError("GlobalMemoryStatusEx failed")
        return int(status.available_physical)
    pages = os.sysconf("SC_AVPHYS_PAGES")
    page_size = os.sysconf("SC_PAGE_SIZE")
    return int(pages * page_size)


def tap_url(query: str, max_records: int) -> str:
    params = urllib.parse.urlencode({
        "REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv",
        "MAXREC": str(max_records), "QUERY": query,
    })
    return f"{ENDPOINT}?{params}"


def network_preflight(timeout_seconds: int) -> dict[str, object]:
    addresses = sorted({row[4][0] for row in socket.getaddrinfo(HOST, 443, type=socket.SOCK_STREAM)})
    with socket.create_connection((HOST, 443), timeout=timeout_seconds) as raw:
        context = ssl.create_default_context()
        with context.wrap_socket(raw, server_hostname=HOST) as tls:
            tls_version = tls.version()
            peer = tls.getpeername()[0]
    query = "SELECT TOP 1 source_id FROM gaiadr3.gaia_source WHERE 1=0"
    request = urllib.request.Request(tap_url(query, 1), headers={"User-Agent": "OrbitAtlasGaiaPresentationV272Preflight/1.0"})
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        payload = response.read(64 * 1024)
        status = int(response.status)
    if status != 200 or b"source_id" not in payload.lower():
        raise RuntimeError("ESA TAP preflight response is invalid")
    return {"dnsAddresses": addresses, "tlsVersion": tls_version, "peer": peer, "tapStatus": status, "tapBytes": len(payload)}


def project_runtime_residuals(project_root: Path) -> list[dict[str, object]]:
    """Return only Atlas browser/server processes; never terminate anything."""
    if os.name != "nt":
        return []
    script = r"""
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$rows = Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine
$rows | ConvertTo-Json -Compress
"""
    completed = subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=20,
    )
    parsed = json.loads(completed.stdout or "[]")
    rows = parsed if isinstance(parsed, list) else [parsed]
    by_pid = {int(row["ProcessId"]): row for row in rows if row.get("ProcessId") is not None}
    protected = {os.getpid()}
    cursor = os.getppid()
    while cursor and cursor not in protected:
        protected.add(cursor)
        row = by_pid.get(cursor)
        cursor = int(row.get("ParentProcessId") or 0) if row else 0
    root_token = str(project_root).lower()
    markers = (".next-atlas-", "start-atlas-standalone.mjs", "playwright.atlas", "tests/atlas-browser")
    result: list[dict[str, object]] = []
    for row in rows:
        pid = int(row.get("ProcessId") or 0)
        command = str(row.get("CommandLine") or "")
        lowered = command.lower()
        if pid in protected or root_token not in lowered or not any(marker in lowered for marker in markers):
            continue
        result.append({"pid": pid, "parentPid": int(row.get("ParentProcessId") or 0), "name": row.get("Name")})
    return result


def resource_preflight(root: Path, timeout_seconds: int, minimum_free_memory_gib: float) -> dict[str, object]:
    if not math.isfinite(minimum_free_memory_gib) or minimum_free_memory_gib < LOW_MEMORY_FLOOR_GIB:
        raise RuntimeError(f"resource-preflight-policy:{minimum_free_memory_gib}<{LOW_MEMORY_FLOOR_GIB}")
    required_memory = int(minimum_free_memory_gib * 1024**3)
    free_memory = free_physical_memory()
    free_disk = shutil.disk_usage(root).free
    if free_memory < required_memory:
        raise RuntimeError(f"resource-preflight-memory:{free_memory}<{required_memory}")
    if free_disk < MIN_FREE_DISK_BYTES:
        raise RuntimeError(f"resource-preflight-disk:{free_disk}<{MIN_FREE_DISK_BYTES}")
    residuals = project_runtime_residuals(Path.cwd().resolve())
    if residuals:
        raise RuntimeError(f"resource-preflight-project-runtime:{json.dumps(residuals, separators=(',', ':'))}")
    probe = root / ".v272-write-preflight.tmp"
    with probe.open("xb") as stream:
        stream.write(b"orbit-atlas-v272\n")
        stream.flush()
        os.fsync(stream.fileno())
    probe.unlink()
    return {
        "freePhysicalMemoryBytes": free_memory,
        "requiredPhysicalMemoryBytes": required_memory,
        "minimumFreeMemoryGiB": minimum_free_memory_gib,
        "defaultMinimumFreeMemoryGiB": DEFAULT_MIN_FREE_MEMORY_GIB,
        "lowMemoryOverrideApplied": minimum_free_memory_gib < DEFAULT_MIN_FREE_MEMORY_GIB,
        "freeDiskBytes": free_disk,
        "requiredDiskBytes": MIN_FREE_DISK_BYTES,
        "projectRuntimeResiduals": residuals,
        "network": network_preflight(timeout_seconds),
    }


def load_bright_ids(paths: list[Path]) -> set[int]:
    result: set[int] = set()
    for path in paths:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            raise RuntimeError(f"Bright-layer source is not an array: {path}")
        result.update(int(row["sourceId"]) for row in rows if isinstance(row, dict) and row.get("sourceId") is not None)
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


def validate_shard(
    path: Path,
    shard: int,
    start: int,
    end: int,
    bright_ids: set[int],
    connection: sqlite3.Connection | None = None,
) -> dict[str, int]:
    rows = valid = rejected = excluded = 0
    previous_key: tuple[int, int] | None = None
    candidates: list[tuple[int, int, int]] = []

    def flush_candidates() -> None:
        if not candidates or connection is None:
            candidates.clear()
            return
        try:
            connection.executemany("INSERT INTO candidates(source_id,random_index,shard) VALUES(?,?,?)", candidates)
        except sqlite3.IntegrityError as error:
            raise RuntimeError(f"Gaia shard {shard} source IDs are not unique") from error
        candidates.clear()

    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if tuple(reader.fieldnames or ()) != COLUMNS:
            raise RuntimeError(f"Gaia shard {shard} columns changed")
        for row in reader:
            rows += 1
            random_index = int(row["random_index"])
            source_id = int(row["source_id"])
            key = (random_index, source_id)
            if not start <= random_index < end:
                raise RuntimeError(f"Gaia shard {shard} escaped its random_index range")
            if previous_key is not None and key <= previous_key:
                raise RuntimeError(f"Gaia shard {shard} is not strictly ordered")
            previous_key = key
            ra = finite(row["ra"])
            dec = finite(row["dec"])
            magnitude = finite(row["phot_g_mean_mag"])
            if ra is None or dec is None or magnitude is None or not -90 <= dec <= 90:
                rejected += 1
                continue
            if source_id in bright_ids:
                excluded += 1
                continue
            candidates.append((source_id, random_index, shard))
            valid += 1
            if len(candidates) >= VALIDATION_BATCH_ROWS:
                flush_candidates()
    flush_candidates()
    if rows <= 0 or rows > SHARD_ROWS:
        raise RuntimeError(f"Gaia shard {shard} returned {rows} rows")
    return {"rowCount": rows, "validRows": valid, "rejectedInvalid": rejected, "excludedBright": excluded}


def cached_metadata(root: Path, shard: int, connection: sqlite3.Connection) -> dict[str, object] | None:
    csv_path = root / f"gaia-v9-{shard:03d}.csv"
    sidecar = root / f"gaia-v9-{shard:03d}.json"
    if csv_path.exists() != sidecar.exists():
        raise RuntimeError(f"Gaia shard {shard} checkpoint is incomplete")
    if not csv_path.exists():
        return None
    metadata = json.loads(sidecar.read_text(encoding="utf-8"))
    start = shard * SHARD_ROWS
    end = start + SHARD_ROWS
    if (
        metadata.get("version") not in {VERSION, LEGACY_VERSION}
        or metadata.get("shard") != shard
        or metadata.get("randomIndexRange") != [start, end]
        or metadata.get("query") != shard_query(start, end)
    ):
        raise RuntimeError(f"Gaia shard {shard} cached provenance is invalid")
    stat = csv_path.stat()
    if int(metadata.get("bytes") or -1) != stat.st_size:
        raise RuntimeError(f"Gaia shard {shard} cached length changed")
    verification = connection.execute(
        "SELECT sha256,bytes,mtime_ns FROM verified_files WHERE shard=?", (shard,),
    ).fetchone()
    if verification != (metadata.get("sha256"), stat.st_size, stat.st_mtime_ns):
        digest = sha256_file(csv_path)
        if metadata.get("sha256") != digest:
            raise RuntimeError(f"Gaia shard {shard} cached SHA changed")
        connection.execute(
            "INSERT OR REPLACE INTO verified_files(shard,sha256,bytes,mtime_ns) VALUES(?,?,?,?)",
            (shard, digest, stat.st_size, stat.st_mtime_ns),
        )
        connection.commit()
    if metadata.get("version") == VERSION:
        query_path = root / f"gaia-v9-{shard:03d}.adql"
        if not query_path.is_file() or query_path.read_text(encoding="utf-8") != metadata["query"] + "\n":
            raise RuntimeError(f"Gaia shard {shard} ADQL provenance is invalid")
    return metadata


def progress_database(root: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(root / "candidate-progress.sqlite")
    connection.execute("PRAGMA journal_mode=DELETE")
    connection.execute("PRAGMA synchronous=FULL")
    connection.execute("CREATE TABLE IF NOT EXISTS candidates(source_id INTEGER PRIMARY KEY,random_index INTEGER NOT NULL,shard INTEGER NOT NULL)")
    connection.execute("CREATE TABLE IF NOT EXISTS shards(shard INTEGER PRIMARY KEY,row_count INTEGER NOT NULL,valid_rows INTEGER NOT NULL,sha256 TEXT NOT NULL)")
    connection.execute("CREATE TABLE IF NOT EXISTS verified_files(shard INTEGER PRIMARY KEY,sha256 TEXT NOT NULL,bytes INTEGER NOT NULL,mtime_ns INTEGER NOT NULL)")
    connection.commit()
    return connection


def index_cached_shards(root: Path, connection: sqlite3.Connection, bright_ids: set[int]) -> list[dict[str, object]]:
    completed: list[dict[str, object]] = []
    for shard in range(MAX_SHARDS):
        metadata = cached_metadata(root, shard, connection)
        if metadata is None:
            break
        csv_path = root / f"gaia-v9-{shard:03d}.csv"
        stored = connection.execute("SELECT row_count,valid_rows,sha256 FROM shards WHERE shard=?", (shard,)).fetchone()
        if stored is None:
            connection.execute("BEGIN IMMEDIATE")
            try:
                counts = validate_shard(csv_path, shard, shard * SHARD_ROWS, (shard + 1) * SHARD_ROWS, bright_ids, connection)
                expected = (counts["rowCount"], counts["validRows"], metadata["sha256"])
                connection.execute("INSERT INTO shards(shard,row_count,valid_rows,sha256) VALUES(?,?,?,?)", (shard, *expected))
                connection.commit()
            except Exception:
                connection.rollback()
                raise
        else:
            counts = {
                "rowCount": int(stored[0]),
                "validRows": int(stored[1]),
                "rejectedInvalid": int(metadata.get("rejectedInvalid") or 0),
                "excludedBright": int(metadata.get("excludedBright") or 0),
            }
            expected = (counts["rowCount"], counts["validRows"], metadata["sha256"])
            if tuple(stored) != expected:
                raise RuntimeError(f"Gaia shard {shard} progress database drifted")
        completed.append({**metadata, **counts})
    return completed


def download_one(root: Path, shard: int, timeout_seconds: int) -> tuple[Path, dict[str, object]]:
    start = shard * SHARD_ROWS
    end = start + SHARD_ROWS
    query = shard_query(start, end)
    partial = root / f"gaia-v9-{shard:03d}.{safe_stamp()}.csv.part"
    request = urllib.request.Request(tap_url(query, SHARD_ROWS + 1), headers={"User-Agent": "OrbitAtlasGaiaPresentationV272/1.0"})
    started_at = utc_now()
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response, partial.open("xb") as output:
            while block := response.read(1024 * 1024):
                output.write(block)
            output.flush()
            os.fsync(output.fileno())
    except Exception as error:
        attempt = {
            "version": VERSION, "shard": shard, "query": query, "randomIndexRange": [start, end],
            "startedAt": started_at, "failedAt": utc_now(), "error": str(error),
            "partialPath": partial.as_posix() if partial.exists() else None,
            "partialBytes": partial.stat().st_size if partial.exists() else 0,
            "automaticRetryApplied": False,
        }
        write_json_atomic(root / f"attempt-{shard:03d}-{safe_stamp()}-failed.json", attempt)
        raise
    metadata = {
        "version": VERSION, "shard": shard, "endpoint": ENDPOINT, "query": query,
        "randomIndexRange": [start, end], "bytes": partial.stat().st_size,
        "sha256": sha256_file(partial), "startedAt": started_at, "completedAt": utc_now(),
        "automaticRetryApplied": False,
    }
    return partial, metadata


def publish_validated_shard(
    root: Path,
    partial: Path,
    metadata: dict[str, object],
    counts: dict[str, int],
    connection: sqlite3.Connection,
    policy: dict[str, object],
) -> Path:
    shard = int(metadata["shard"])
    destination = root / f"gaia-v9-{shard:03d}.csv"
    query_path = root / f"gaia-v9-{shard:03d}.adql"
    sidecar = root / f"gaia-v9-{shard:03d}.json"
    if destination.exists() or query_path.exists() or sidecar.exists():
        raise RuntimeError(f"Gaia shard {shard} publication target already exists")
    os.replace(partial, destination)
    query_path.write_text(str(metadata["query"]) + "\n", encoding="utf-8", newline="\n")
    enriched = {
        **metadata,
        **counts,
        "validationBatchRows": VALIDATION_BATCH_ROWS,
        "queryFile": query_path.name,
        "querySha256": sha256_file(query_path),
        "lowMemoryPolicy": policy,
    }
    write_json_atomic(sidecar, enriched)
    stat = destination.stat()
    connection.execute(
        "INSERT INTO verified_files(shard,sha256,bytes,mtime_ns) VALUES(?,?,?,?)",
        (shard, enriched["sha256"], stat.st_size, stat.st_mtime_ns),
    )
    connection.execute(
        "INSERT INTO shards(shard,row_count,valid_rows,sha256) VALUES(?,?,?,?)",
        (shard, counts["rowCount"], counts["validRows"], enriched["sha256"]),
    )
    return destination


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-root", type=Path, default=Path("tools/asset-cache/gaia-dr3-presentation-v272-shards"))
    parser.add_argument("--timeout-seconds", type=int, default=600)
    parser.add_argument("--preflight-timeout-seconds", type=int, default=20)
    parser.add_argument("--minimum-free-memory-gib", type=float, default=DEFAULT_MIN_FREE_MEMORY_GIB)
    parser.add_argument("--bright", action="append", type=Path, default=[Path("public/data/gaia-dr3-nearby-46000-v255.json"), Path("public/data/gaia-dr3-bright-5000.json")])
    args = parser.parse_args()
    root = args.checkpoint_root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    try:
        preflight = resource_preflight(root, args.preflight_timeout_seconds, args.minimum_free_memory_gib)
        write_json_atomic(root / "last-preflight.json", {"version": VERSION, "status": "passed", "checkedAt": utc_now(), **preflight})
    except Exception as error:
        write_json_atomic(root / "last-preflight.json", {"version": VERSION, "status": "blocked", "checkedAt": utc_now(), "error": str(error), "shardAttempted": False})
        raise
    bright_ids = load_bright_ids([path.resolve() for path in args.bright])
    connection = progress_database(root)
    try:
        completed = index_cached_shards(root, connection, bright_ids)
        unique_valid = int(connection.execute("SELECT COUNT(*) FROM candidates").fetchone()[0])
        if unique_valid >= TARGET_VALID:
            status = "ready-for-build"
            attempted = False
        else:
            shard = len(completed)
            if shard >= MAX_SHARDS:
                raise RuntimeError(f"Gaia v272 candidates are insufficient after {MAX_SHARDS} shards")
            partial, metadata = download_one(root, shard, args.timeout_seconds)
            connection.execute("BEGIN IMMEDIATE")
            try:
                counts = validate_shard(partial, shard, shard * SHARD_ROWS, (shard + 1) * SHARD_ROWS, bright_ids, connection)
                policy = {
                    "defaultMinimumFreeMemoryGiB": DEFAULT_MIN_FREE_MEMORY_GIB,
                    "requestedMinimumFreeMemoryGiB": args.minimum_free_memory_gib,
                    "minimumAllowedMemoryGiB": LOW_MEMORY_FLOOR_GIB,
                    "overrideApplied": args.minimum_free_memory_gib < DEFAULT_MIN_FREE_MEMORY_GIB,
                    "authorization": "user-authorized-3-gib-fetch-only" if args.minimum_free_memory_gib < DEFAULT_MIN_FREE_MEMORY_GIB else "default-policy",
                    "buildThresholdUnchangedGiB": 6,
                }
                path = publish_validated_shard(root, partial, metadata, counts, connection, policy)
                connection.commit()
            except Exception as error:
                connection.rollback()
                write_json_atomic(root / f"attempt-{shard:03d}-{safe_stamp()}-failed.json", {
                    **metadata,
                    "failedAt": utc_now(),
                    "error": str(error),
                    "partialPath": partial.as_posix() if partial.exists() else None,
                    "automaticRetryApplied": False,
                })
                raise
            completed.append({**metadata, **counts, "publishedPath": path.name, "lowMemoryPolicy": policy})
            unique_valid = int(connection.execute("SELECT COUNT(*) FROM candidates").fetchone()[0])
            status = "ready-for-build" if unique_valid >= TARGET_VALID else "checkpointed-one-shard"
            attempted = True
        progress = {
            "version": VERSION, "status": status, "targetValidRows": TARGET_VALID,
            "completedShards": len(completed), "maximumShards": MAX_SHARDS,
            "uniqueValidCandidateRows": unique_valid, "brightExclusionSourceIds": len(bright_ids),
            "lastCompletedShard": len(completed) - 1, "updatedAt": utc_now(),
            "oneNewShardAttempted": attempted, "automaticRetryApplied": False, "shards": completed,
            "validationBatchRows": VALIDATION_BATCH_ROWS,
            "lowMemoryPolicy": {
                "defaultMinimumFreeMemoryGiB": DEFAULT_MIN_FREE_MEMORY_GIB,
                "requestedMinimumFreeMemoryGiB": args.minimum_free_memory_gib,
                "minimumAllowedMemoryGiB": LOW_MEMORY_FLOOR_GIB,
                "overrideApplied": args.minimum_free_memory_gib < DEFAULT_MIN_FREE_MEMORY_GIB,
                "buildThresholdUnchangedGiB": 6,
            },
        }
        write_json_atomic(root / "progress.json", progress)
        print(json.dumps(progress, indent=2))
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr, flush=True)
        raise

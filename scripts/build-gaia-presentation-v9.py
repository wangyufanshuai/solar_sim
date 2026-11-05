#!/usr/bin/env python3
"""Build the deterministic v265 Gaia DR3 10m presentation content pack."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import shutil
import sqlite3
import struct
import sys
import zlib
from datetime import datetime, timezone
from pathlib import Path

import astropy_healpix
import numpy as np
from astropy import units as u
from astropy.coordinates import ICRS
from astropy_healpix import HEALPix


VERSION = "v265-gaia-dr3-presentation-10000000-v9"
ID = "gaia-dr3-presentation-10000000-v9"
ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync"
PRODUCTION_ROWS = 10_000_000
RECORD_BYTES = 24
DIRECTORY_ENTRY_BYTES = 28
LEAF_ENTRY_BYTES = 16
SOURCE_ENTRY_BYTES = 16
SOURCE_DIRECTORY_ENTRY_BYTES = 24
SOURCE_PAGE_ENTRIES = 4096
ORDER3_CELLS = 12 * (2**3) ** 2
ORDER6_CELLS = 12 * (2**6) ** 2
ORDER8_CELLS = 12 * (2**8) ** 2

WORK_DTYPE = np.dtype([
    ("cell", "<u4"), ("random_index", "<u4"), ("source_id", "<u8"),
    ("ra_quant", "<u4"), ("dec_quant", "<u4"), ("g_quant", "<u2"),
    ("color_quant", "<i2"), ("parallax", "<f4"),
], align=False)
RECORD_DTYPE = np.dtype({
    "names": ["source_id", "ra_quant", "dec_quant", "g_quant", "color_quant", "parallax"],
    "formats": ["<u8", "<u4", "<u4", "<u2", "<i2", "<f4"],
    "offsets": [0, 8, 12, 16, 18, 20],
    "itemsize": RECORD_BYTES,
})
SOURCE_DTYPE = np.dtype([
    ("source_id", "<u8"), ("cell", "<u4"), ("ordinal", "<u4"),
], align=False)
AGGREGATE_DTYPE = np.dtype([
    ("count", "<u4"), ("mean_g", "<f4"), ("mean_bp_rp", "<f4"),
    ("min_g", "<f4"), ("max_g", "<f4"), ("representative_ordinal", "<u4"),
], align=False)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical_sha(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def finite(raw: str | None) -> float | None:
    if raw is None or raw.strip().lower() in {"", "null", "nan", "none", "--"}:
        return None
    value = float(raw)
    return value if math.isfinite(value) else None


def load_bright_ids(paths: list[Path]) -> set[int]:
    result: set[int] = set()
    for path in paths:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            raise RuntimeError(f"Bright-layer source is not an array: {path}")
        result.update(int(row["sourceId"]) for row in rows if isinstance(row, dict) and row.get("sourceId") is not None)
    return result


def verified_shards(checkpoint_root: Path) -> list[tuple[Path, dict[str, object]]]:
    progress_path = checkpoint_root / "progress.json"
    if not progress_path.is_file():
        raise RuntimeError("Gaia presentation checkpoint progress is missing")
    progress = json.loads(progress_path.read_text(encoding="utf-8"))
    if progress.get("status") != "ready-for-build":
        raise RuntimeError(f"Gaia presentation checkpoints are not ready: {progress.get('status')}")
    result: list[tuple[Path, dict[str, object]]] = []
    for index in range(int(progress["completedShards"])):
        path = checkpoint_root / f"gaia-v9-{index:03d}.csv"
        sidecar = checkpoint_root / f"gaia-v9-{index:03d}.json"
        if not path.is_file() or not sidecar.is_file():
            raise RuntimeError(f"Gaia presentation shard {index} is missing")
        metadata = json.loads(sidecar.read_text(encoding="utf-8"))
        if metadata.get("sha256") != sha256_file(path):
            raise RuntimeError(f"Gaia presentation shard {index} SHA changed")
        result.append((path, metadata))
    return result


def ingest_candidates(
    shards: list[tuple[Path, dict[str, object]]],
    bright_ids: set[int],
    database: Path,
) -> tuple[sqlite3.Connection, dict[str, int]]:
    connection = sqlite3.connect(database)
    connection.execute("PRAGMA journal_mode=DELETE")
    connection.execute("PRAGMA synchronous=NORMAL")
    connection.execute("CREATE TABLE rows(random_index INTEGER NOT NULL,source_id INTEGER PRIMARY KEY,ra REAL NOT NULL,dec REAL NOT NULL,g REAL NOT NULL,color REAL,parallax REAL)")
    total = 0
    excluded = 0
    rejected = 0
    duplicates = 0
    batch: list[tuple[object, ...]] = []
    for shard_index, (path, _) in enumerate(shards):
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                total += 1
                source_id = int(row["source_id"])
                ra = finite(row["ra"])
                dec = finite(row["dec"])
                magnitude = finite(row["phot_g_mean_mag"])
                if ra is None or dec is None or magnitude is None or dec < -90 or dec > 90:
                    rejected += 1
                    continue
                if source_id in bright_ids:
                    excluded += 1
                    continue
                batch.append((
                    int(row["random_index"]), source_id, ra % 360, dec, magnitude,
                    finite(row.get("bp_rp")), finite(row.get("parallax")),
                ))
                if len(batch) >= 10_000:
                    try:
                        connection.executemany("INSERT INTO rows VALUES(?,?,?,?,?,?,?)", batch)
                    except sqlite3.IntegrityError as error:
                        duplicates += 1
                        raise RuntimeError("Gaia presentation source IDs are not unique") from error
                    connection.commit()
                    batch.clear()
        print(f"v265 ingest shard {shard_index + 1}/{len(shards)} total={total:,}", flush=True)
    if batch:
        connection.executemany("INSERT INTO rows VALUES(?,?,?,?,?,?,?)", batch)
        connection.commit()
    return connection, {"sourceRows": total, "excludedBright": excluded, "rejectedInvalid": rejected, "duplicateSourceIds": duplicates}


def create_sorted_work(connection: sqlite3.Connection, work_root: Path, target_rows: int) -> np.memmap:
    candidate_count = int(connection.execute("SELECT COUNT(*) FROM rows").fetchone()[0])
    if candidate_count < target_rows:
        raise RuntimeError(f"Gaia presentation candidates are insufficient: {candidate_count:,}/{target_rows:,}")
    hp8 = HEALPix(nside=2**8, order="nested", frame=ICRS())
    unsorted_path = work_root / "selected.unsorted.bin"
    unsorted = np.memmap(unsorted_path, dtype=WORK_DTYPE, mode="w+", shape=(target_rows,))
    cursor = connection.execute("SELECT random_index,source_id,ra,dec,g,color,parallax FROM rows ORDER BY random_index,source_id LIMIT ?", (target_rows,))
    loaded = 0
    while loaded < target_rows:
        rows = cursor.fetchmany(min(100_000, target_rows - loaded))
        if not rows:
            break
        count = len(rows)
        ra = np.asarray([row[2] for row in rows], dtype=np.float64)
        dec = np.asarray([row[3] for row in rows], dtype=np.float64)
        chunk = unsorted[loaded:loaded + count]
        chunk["cell"] = hp8.lonlat_to_healpix(ra * u.deg, dec * u.deg).astype(np.uint32)
        chunk["random_index"] = np.asarray([row[0] for row in rows], dtype=np.uint32)
        chunk["source_id"] = np.asarray([row[1] for row in rows], dtype=np.uint64)
        chunk["ra_quant"] = np.floor((ra / 360.0) * (2**32)).astype(np.uint64).astype(np.uint32)
        chunk["dec_quant"] = np.rint(((dec + 90.0) / 180.0) * np.iinfo(np.uint32).max).astype(np.uint32)
        chunk["g_quant"] = np.rint((np.clip(np.asarray([row[4] for row in rows]), -5, 60) + 5) * 1000).astype(np.uint16)
        colors = np.asarray([row[5] if row[5] is not None else np.nan for row in rows], dtype=np.float64)
        color_quant = np.full(count, -32768, dtype=np.int16)
        valid_color = np.isfinite(colors)
        color_quant[valid_color] = np.rint(np.clip(colors[valid_color], -32.767, 32.767) * 1000).astype(np.int16)
        chunk["color_quant"] = color_quant
        chunk["parallax"] = np.asarray([row[6] if row[6] is not None else np.nan for row in rows], dtype=np.float32)
        loaded += count
        print(f"v265 quantize {loaded:,}/{target_rows:,}", flush=True)
        del chunk
    if loaded != target_rows:
        raise RuntimeError("Gaia presentation deterministic selection ended early")
    unsorted.flush()
    order = np.lexsort((unsorted["source_id"], unsorted["g_quant"], unsorted["cell"]))
    sorted_path = work_root / "selected.sorted.bin"
    sorted_rows = np.memmap(sorted_path, dtype=WORK_DTYPE, mode="w+", shape=(target_rows,))
    for start in range(0, target_rows, 100_000):
        end = min(target_rows, start + 100_000)
        sorted_rows[start:end] = unsorted[order[start:end]]
    sorted_rows.flush()
    del order
    unsorted._mmap.close()
    del unsorted
    unsorted_path.unlink()
    return sorted_rows


def write_archive(path: Path, rows: np.memmap) -> None:
    with path.open("wb") as handle:
        for start in range(0, len(rows), 100_000):
            end = min(len(rows), start + 100_000)
            output = np.empty(end - start, dtype=RECORD_DTYPE)
            for name in output.dtype.names or ():
                output[name] = rows[name][start:end]
            handle.write(output.tobytes(order="C"))
    expected = len(rows) * RECORD_BYTES
    if path.stat().st_size != expected:
        raise RuntimeError("Gaia presentation archive reconstruction failed")


def write_spatial_indexes(root: Path, rows: np.memmap, archive_path: Path) -> dict[str, Path]:
    cells = np.asarray(rows["cell"])
    counts8 = np.bincount(cells, minlength=ORDER8_CELLS).astype(np.uint32)
    starts8 = np.zeros(ORDER8_CELLS, dtype=np.uint64)
    starts8[1:] = np.cumsum(counts8[:-1], dtype=np.uint64)
    archive_bytes = np.memmap(archive_path, dtype=np.uint8, mode="r")
    leaf_path = root / "order8.index.bin"
    with leaf_path.open("wb") as handle:
        for cell in range(ORDER8_CELLS):
            offset = int(starts8[cell]) * RECORD_BYTES
            length = int(counts8[cell]) * RECORD_BYTES
            crc32 = zlib.crc32(memoryview(archive_bytes)[offset:offset + length]) & 0xFFFFFFFF if length else 0
            handle.write(struct.pack("<IIII", offset, length, crc32, int(counts8[cell])))
    del archive_bytes
    if leaf_path.stat().st_size != ORDER8_CELLS * LEAF_ENTRY_BYTES:
        raise RuntimeError("Gaia presentation leaf index length changed")

    hp6 = HEALPix(nside=2**6, order="nested", frame=ICRS())
    lon, lat = hp6.healpix_to_lonlat(np.arange(ORDER6_CELLS, dtype=np.int64))
    directory_path = root / "order6.directory.bin"
    with directory_path.open("wb") as handle:
        for parent in range(ORDER6_CELLS):
            first_cell = parent * 16
            parent_counts = counts8[first_cell:first_cell + 16]
            archive_offset = int(starts8[first_cell]) * RECORD_BYTES
            archive_length = int(parent_counts.sum()) * RECORD_BYTES
            mask = sum((1 << child) for child, count in enumerate(parent_counts) if count)
            handle.write(struct.pack(
                "<IIIIffHH",
                parent * 16 * LEAF_ENTRY_BYTES,
                16 * LEAF_ENTRY_BYTES,
                archive_offset,
                archive_length,
                float(lon[parent].to_value(u.deg)),
                float(lat[parent].to_value(u.deg)),
                mask,
                0,
            ))
    if directory_path.stat().st_size != ORDER6_CELLS * DIRECTORY_ENTRY_BYTES:
        raise RuntimeError("Gaia presentation order-6 directory length changed")

    parent3 = cells >> 10
    aggregate = np.zeros(ORDER3_CELLS, dtype=AGGREGATE_DTYPE)
    counts3 = np.bincount(parent3, minlength=ORDER3_CELLS).astype(np.uint32)
    magnitude = rows["g_quant"].astype(np.float64) / 1000 - 5
    color = rows["color_quant"].astype(np.float64)
    valid_color = color != -32768
    color[valid_color] /= 1000
    aggregate["count"] = counts3
    aggregate["mean_g"] = np.divide(np.bincount(parent3, weights=magnitude, minlength=ORDER3_CELLS), counts3, out=np.full(ORDER3_CELLS, np.nan), where=counts3 > 0)
    color_counts = np.bincount(parent3[valid_color], minlength=ORDER3_CELLS)
    aggregate["mean_bp_rp"] = np.divide(np.bincount(parent3[valid_color], weights=color[valid_color], minlength=ORDER3_CELLS), color_counts, out=np.full(ORDER3_CELLS, np.nan), where=color_counts > 0)
    minimum = np.full(ORDER3_CELLS, np.inf)
    maximum = np.full(ORDER3_CELLS, -np.inf)
    np.minimum.at(minimum, parent3, magnitude)
    np.maximum.at(maximum, parent3, magnitude)
    minimum[counts3 == 0] = np.nan
    maximum[counts3 == 0] = np.nan
    aggregate["min_g"] = minimum
    aggregate["max_g"] = maximum
    first = np.zeros(len(rows), dtype=bool)
    first[0] = True
    first[1:] = parent3[1:] != parent3[:-1]
    aggregate["representative_ordinal"][parent3[first]] = np.nonzero(first)[0].astype(np.uint32)
    aggregate_path = root / "order3.aggregate.bin"
    aggregate.tofile(aggregate_path)
    return {"aggregate": aggregate_path, "directory": directory_path, "leaf": leaf_path}


def write_source_index(root: Path, rows: np.memmap) -> dict[str, Path]:
    target_rows = len(rows)
    cells = np.asarray(rows["cell"])
    counts = np.bincount(cells, minlength=ORDER8_CELLS).astype(np.uint32)
    starts = np.zeros(ORDER8_CELLS, dtype=np.uint64)
    starts[1:] = np.cumsum(counts[:-1], dtype=np.uint64)
    work_path = root / "source.unsorted.bin"
    source_rows = np.memmap(work_path, dtype=SOURCE_DTYPE, mode="w+", shape=(target_rows,))
    source_rows["source_id"] = rows["source_id"]
    source_rows["cell"] = cells
    source_rows["ordinal"] = np.arange(target_rows, dtype=np.uint64).astype(np.uint32) - starts[cells].astype(np.uint32)
    source_rows.flush()
    order = np.argsort(source_rows["source_id"], kind="stable")
    data_path = root / "source.index.bin"
    directory_path = root / "source.directory.bin"
    last_source = -1
    with data_path.open("wb") as data, directory_path.open("wb") as directory:
        page_index = 0
        for start in range(0, target_rows, SOURCE_PAGE_ENTRIES):
            end = min(target_rows, start + SOURCE_PAGE_ENTRIES)
            chunk = np.asarray(source_rows[order[start:end]])
            first_source = int(chunk["source_id"][0])
            final_source = int(chunk["source_id"][-1])
            if first_source <= last_source or np.any(chunk["source_id"][1:] <= chunk["source_id"][:-1]):
                raise RuntimeError("Gaia presentation source index is not unique and ordered")
            data.write(chunk.tobytes(order="C"))
            directory.write(struct.pack("<QQII", first_source, final_source, start * SOURCE_ENTRY_BYTES, len(chunk)))
            last_source = final_source
            page_index += 1
    del order
    source_rows._mmap.close()
    del source_rows
    work_path.unlink()
    if data_path.stat().st_size != target_rows * SOURCE_ENTRY_BYTES:
        raise RuntimeError("Gaia presentation source index length changed")
    return {"data": data_path, "directory": directory_path}


def hardlink_tree(source: Path, destination: Path) -> None:
    if destination.exists():
        raise RuntimeError(f"Refusing to replace existing published Gaia presentation pack: {destination}")
    destination.mkdir(parents=True)
    for path in source.iterdir():
        if path.is_file():
            try:
                os.link(path, destination / path.name)
            except OSError:
                shutil.copy2(path, destination / path.name)


def build(args: argparse.Namespace) -> dict[str, object]:
    if astropy_healpix.__version__ != "1.1.2":
        raise RuntimeError(f"astropy-healpix version must be 1.1.2, got {astropy_healpix.__version__}")
    checkpoint_root = args.checkpoint_root.resolve()
    output = args.output.resolve()
    public = args.public.resolve() if args.public else None
    target_rows = args.target_rows
    if output.exists():
        raise RuntimeError(f"Refusing to overwrite existing Gaia presentation output: {output}")
    work_root = output.with_name(output.name + ".work")
    if work_root.exists():
        raise RuntimeError(f"Unresolved Gaia presentation work directory requires inspection: {work_root}")
    work_root.mkdir(parents=True)
    shards = verified_shards(checkpoint_root)
    bright_ids = load_bright_ids([path.resolve() for path in args.bright])
    database_path = work_root / "candidates.sqlite"
    connection, counts = ingest_candidates(shards, bright_ids, database_path)
    rows = create_sorted_work(connection, work_root, target_rows)
    connection.close()
    database_path.unlink()
    archive_path = work_root / "catalog-v9.bin"
    write_archive(archive_path, rows)
    spatial = write_spatial_indexes(work_root, rows, archive_path)
    source_index = write_source_index(work_root, rows)
    rows._mmap.close()
    del rows
    (work_root / "selected.sorted.bin").unlink()

    shard_provenance = [{
        "shard": metadata["shard"], "range": metadata["randomIndexRange"],
        "rows": metadata["rowCount"], "sha256": metadata["sha256"], "query": metadata["query"],
    } for _, metadata in shards]
    provenance_sha = canonical_sha(shard_provenance)
    artifact = lambda path: {"url": f"data/{ID}/{path.name}", "byteLength": path.stat().st_size, "sha256": sha256_file(path)}
    manifest = {
        "version": VERSION if target_rows == PRODUCTION_ROWS else f"{VERSION}-fixture-{target_rows}",
        "id": ID,
        "scheme": "NESTED",
        "orders": [3, 6, 8],
        "generatedAt": utc_now(),
        "source": {
            "archive": "Gaia DR3 gaiadr3.gaia_source", "endpoint": ENDPOINT,
            "randomIndexStart": 0, "randomIndexMaximumExclusive": 10_200_000,
            "shardMaximumRows": 100_000, "shardCount": len(shards),
            "provenanceSha256": provenance_sha,
        },
        "counts": {"presentation": target_rows, **counts},
        "archive": {**artifact(archive_path), "recordBytes": RECORD_BYTES, "sort": "healpix-order8,g-quantized,source-id"},
        "aggregateOrder3": {**artifact(spatial["aggregate"]), "entryBytes": 24, "cellCount": ORDER3_CELLS},
        "directoryOrder6": {**artifact(spatial["directory"]), "entryBytes": DIRECTORY_ENTRY_BYTES, "cellCount": ORDER6_CELLS},
        "leafIndexOrder8": {**artifact(spatial["leaf"]), "entryBytes": LEAF_ENTRY_BYTES, "cellCount": ORDER8_CELLS, "pageBytes": 256},
        "sourceIndex": {
            "data": {**artifact(source_index["data"]), "entryBytes": SOURCE_ENTRY_BYTES, "entryCount": target_rows},
            "directory": {**artifact(source_index["directory"]), "entryBytes": SOURCE_DIRECTORY_ENTRY_BYTES, "pageEntries": SOURCE_PAGE_ENTRIES},
        },
        "runtime": {
            "standaloneIntentRequired": True, "liteIncluded": False, "maxConcurrentRanges": 4,
            "fallback": ["catalog-v10-1221242", "gaia-v255-46000", "gaia-legacy-5000"],
        },
        "builder": {
            "script": "scripts/build-gaia-presentation-v9.py", "python": f"{sys.version_info.major}.{sys.version_info.minor}",
            "numpy": np.__version__, "astropyHealpix": astropy_healpix.__version__,
        },
        "canonical": True, "presentationOnly": True, "surveyCompletenessClaim": "not-applied",
        "livePhysicsMutation": "not-applied", "workerPhysicsMutation": "not-applied",
    }
    manifest["manifestSha256"] = canonical_sha({key: value for key, value in manifest.items() if key not in {"generatedAt", "manifestSha256"}})
    (work_root / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    (work_root / "shard-provenance.json").write_text(json.dumps(shard_provenance, indent=2) + "\n", encoding="utf-8", newline="\n")
    output.parent.mkdir(parents=True, exist_ok=True)
    work_root.replace(output)
    if public is not None:
        hardlink_tree(output, public)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-root", type=Path, default=Path("tools/asset-cache/gaia-dr3-presentation-v9-shards"))
    parser.add_argument("--output", type=Path, default=Path(f"dist/{ID}"))
    parser.add_argument("--public", type=Path, default=Path(f"public/data/{ID}"))
    parser.add_argument("--no-public", action="store_true")
    parser.add_argument("--target-rows", type=int, default=PRODUCTION_ROWS)
    parser.add_argument("--bright", action="append", type=Path, default=[
        Path("public/data/gaia-dr3-nearby-46000-v255.json"),
        Path("public/data/gaia-dr3-bright-5000.json"),
    ])
    args = parser.parse_args()
    if args.target_rows <= 0 or args.target_rows > PRODUCTION_ROWS:
        raise SystemExit(f"target-rows must be in [1, {PRODUCTION_ROWS}]")
    if args.no_public:
        args.public = None
    manifest = build(args)
    print(json.dumps({
        "passed": True, "version": manifest["version"], "rows": manifest["counts"]["presentation"],
        "archiveBytes": manifest["archive"]["byteLength"], "manifestSha256": manifest["manifestSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()

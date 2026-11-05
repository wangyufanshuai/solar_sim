#!/usr/bin/env python3
"""Build the deterministic Orbit Atlas v257 HEALPix streaming catalog.

The builder is deliberately offline: the frozen V7 SQLite database is the
only input. It fails closed when the source SHA, row contracts, dependency
version, or binary reconstruction checks differ from the v257 contract.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import sqlite3
import struct
from datetime import datetime, timezone
from pathlib import Path

import astropy_healpix
import numpy as np
from astropy import units as u
from astropy.coordinates import ICRS
from astropy_healpix import HEALPix


VERSION = "v257-healpix-stream-catalog-v8"
SOURCE_SHA256 = "cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17"
SOURCE_ROWS = 1_224_219
RENDERABLE_ROWS = 1_221_242
SPATIAL_3D_ROWS = 758_955
RECORD_BYTES = 32
INDEX_ENTRY_BYTES = 28
HEADER_BYTES = 128
ORDER3_CELLS = 12 * (2**3) ** 2
ORDER5_CELLS = 12 * (2**5) ** 2
ORDER6_CELLS = 12 * (2**6) ** 2
AGGREGATE_BYTES = 24
RECORDS_OFFSET = HEADER_BYTES + (ORDER3_CELLS + ORDER5_CELLS) * AGGREGATE_BYTES

WORK_DTYPE = np.dtype(
    [
        ("cell", "<u4"),
        ("row_id", "<u4"),
        ("source_id", "<u8"),
        ("ra_quant", "<u4"),
        ("dec_quant", "<u4"),
        ("g_quant", "<u2"),
        ("color_quant", "<i2"),
        ("parallax", "<f4"),
        ("flags", "<u2"),
        ("reserved", "<u2"),
    ],
    align=False,
)
RECORD_DTYPE = np.dtype(
    {
        "names": [
            "row_id",
            "source_id",
            "ra_quant",
            "dec_quant",
            "g_quant",
            "color_quant",
            "parallax",
            "flags",
            "reserved",
        ],
        "formats": ["<u4", "<u8", "<u4", "<u4", "<u2", "<i2", "<f4", "<u2", "<u2"],
        "offsets": [0, 4, 12, 16, 20, 22, 24, 28, 30],
        "itemsize": RECORD_BYTES,
    }
)
AGGREGATE_DTYPE = np.dtype(
    [
        ("count", "<u4"),
        ("mean_g", "<f4"),
        ("mean_bp_rp", "<f4"),
        ("min_g", "<f4"),
        ("max_g", "<f4"),
        ("representative_record", "<u4"),
    ]
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def synthetic_source_id(object_id: str) -> int:
    value = int.from_bytes(hashlib.blake2b(object_id.encode("utf-8"), digest_size=8).digest(), "little")
    return value | (1 << 63)


def finite_or_none(value: object) -> float | None:
    if value is None:
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def read_renderable_rows(connection: sqlite3.Connection) -> np.ndarray:
    hp6 = HEALPix(nside=2**6, order="nested", frame=ICRS())
    cursor = connection.execute(
        """
        SELECT rowid, id, gaia_source_id, ra_deg, dec_deg, mag_g, bp_rp, parallax_mas
        FROM catalog_objects
        WHERE mag_g IS NOT NULL AND mag_g = mag_g
        ORDER BY rowid
        """
    )
    chunks: list[np.ndarray] = []
    loaded = 0
    while True:
        rows = cursor.fetchmany(100_000)
        if not rows:
            break
        chunk = np.empty(len(rows), dtype=WORK_DTYPE)
        ra = np.asarray([float(row[3]) for row in rows], dtype=np.float64)
        dec = np.asarray([float(row[4]) for row in rows], dtype=np.float64)
        if not (np.isfinite(ra).all() and np.isfinite(dec).all()):
            raise RuntimeError("V7 renderable coordinates contain non-finite values")
        if np.any((dec < -90) | (dec > 90)):
            raise RuntimeError("V7 renderable declinations lie outside [-90, 90]")
        chunk["cell"] = hp6.lonlat_to_healpix(ra * u.deg, dec * u.deg).astype(np.uint32)
        chunk["row_id"] = np.asarray([int(row[0]) for row in rows], dtype=np.uint32)
        chunk["source_id"] = np.asarray(
            [int(row[2]) if row[2] is not None else synthetic_source_id(str(row[1])) for row in rows],
            dtype=np.uint64,
        )
        chunk["ra_quant"] = np.floor((np.mod(ra, 360.0) / 360.0) * (2**32)).astype(np.uint64).astype(np.uint32)
        chunk["dec_quant"] = np.rint(((dec + 90.0) / 180.0) * np.iinfo(np.uint32).max).astype(np.uint32)
        magnitudes = np.asarray([float(row[5]) for row in rows], dtype=np.float64)
        chunk["g_quant"] = np.rint((np.clip(magnitudes, -5.0, 60.0) + 5.0) * 1_000).astype(np.uint16)
        colors = np.asarray(
            [finite_or_none(row[6]) if finite_or_none(row[6]) is not None else np.nan for row in rows],
            dtype=np.float64,
        )
        color_quant = np.full(len(rows), -32768, dtype=np.int16)
        color_valid = np.isfinite(colors)
        color_quant[color_valid] = np.rint(np.clip(colors[color_valid], -32.767, 32.767) * 1_000).astype(np.int16)
        chunk["color_quant"] = color_quant
        parallaxes = np.asarray(
            [finite_or_none(row[7]) if finite_or_none(row[7]) is not None else np.nan for row in rows],
            dtype=np.float32,
        )
        chunk["parallax"] = parallaxes
        gaia_valid = np.asarray([row[2] is not None for row in rows], dtype=np.uint16)
        parallax_positive = np.isfinite(parallaxes) & (parallaxes > 0)
        spatial = color_valid & parallax_positive
        chunk["flags"] = gaia_valid | (color_valid.astype(np.uint16) << 1) | (parallax_positive.astype(np.uint16) << 2) | (spatial.astype(np.uint16) << 3)
        chunk["reserved"] = 0
        chunks.append(chunk)
        loaded += len(rows)
        print(f"catalog-v8 read {loaded:,}/{RENDERABLE_ROWS:,}", flush=True)
    records = np.concatenate(chunks)
    if len(records) != RENDERABLE_ROWS:
        raise RuntimeError(f"Renderable row count changed: {len(records)} != {RENDERABLE_ROWS}")
    order = np.lexsort((records["row_id"], records["g_quant"], records["cell"]))
    return records[order]


def build_aggregate(records: np.ndarray, parent_cells: np.ndarray, cell_count: int) -> np.ndarray:
    result = np.zeros(cell_count, dtype=AGGREGATE_DTYPE)
    counts = np.bincount(parent_cells, minlength=cell_count).astype(np.uint32)
    magnitudes = records["g_quant"].astype(np.float64) / 1_000.0 - 5.0
    colors = records["color_quant"].astype(np.float64)
    color_valid = colors != -32768
    colors[color_valid] /= 1_000.0
    result["count"] = counts
    result["mean_g"] = np.divide(
        np.bincount(parent_cells, weights=magnitudes, minlength=cell_count),
        counts,
        out=np.full(cell_count, np.nan, dtype=np.float64),
        where=counts > 0,
    )
    color_counts = np.bincount(parent_cells[color_valid], minlength=cell_count)
    result["mean_bp_rp"] = np.divide(
        np.bincount(parent_cells[color_valid], weights=colors[color_valid], minlength=cell_count),
        color_counts,
        out=np.full(cell_count, np.nan, dtype=np.float64),
        where=color_counts > 0,
    )
    minimum = np.full(cell_count, np.inf, dtype=np.float64)
    maximum = np.full(cell_count, -np.inf, dtype=np.float64)
    np.minimum.at(minimum, parent_cells, magnitudes)
    np.maximum.at(maximum, parent_cells, magnitudes)
    minimum[counts == 0] = np.nan
    maximum[counts == 0] = np.nan
    result["min_g"] = minimum
    result["max_g"] = maximum
    representative_order = np.lexsort((records["row_id"], records["g_quant"], parent_cells))
    ordered_parents = parent_cells[representative_order]
    first = np.concatenate(([True], ordered_parents[1:] != ordered_parents[:-1]))
    result["representative_record"][ordered_parents[first]] = representative_order[first].astype(np.uint32)
    return result


def write_archive(path: Path, records: np.ndarray) -> tuple[np.ndarray, np.ndarray, int]:
    record_cells = records["cell"].astype(np.uint32)
    parent5 = record_cells >> 2
    parent3 = record_cells >> 6
    aggregate3 = build_aggregate(records, parent3, ORDER3_CELLS)
    aggregate5 = build_aggregate(records, parent5, ORDER5_CELLS)
    output = np.empty(len(records), dtype=RECORD_DTYPE)
    for name in output.dtype.names or ():
        output[name] = records[name]
    header = bytearray(HEADER_BYTES)
    header[0:8] = b"OATLV8\0\0"
    struct.pack_into(
        "<IIIIIIIII",
        header,
        8,
        HEADER_BYTES,
        RECORD_BYTES,
        ORDER3_CELLS,
        ORDER5_CELLS,
        ORDER6_CELLS,
        SOURCE_ROWS,
        RENDERABLE_ROWS,
        SPATIAL_3D_ROWS,
        RECORDS_OFFSET,
    )
    with path.open("wb") as handle:
        handle.write(header)
        handle.write(aggregate3.tobytes(order="C"))
        handle.write(aggregate5.tobytes(order="C"))
        handle.write(output.tobytes(order="C"))
    expected = RECORDS_OFFSET + len(output) * RECORD_BYTES
    if path.stat().st_size != expected:
        raise RuntimeError("Catalog v8 archive byte reconstruction failed")
    return record_cells, parent5, expected


def write_index(path: Path, record_cells: np.ndarray, parent5: np.ndarray) -> int:
    counts = np.bincount(record_cells, minlength=ORDER6_CELLS).astype(np.uint32)
    starts = np.zeros(ORDER6_CELLS, dtype=np.uint64)
    starts[1:] = np.cumsum(counts[:-1], dtype=np.uint64)
    hp6 = HEALPix(nside=2**6, order="nested", frame=ICRS())
    lon, lat = hp6.healpix_to_lonlat(np.arange(ORDER6_CELLS, dtype=np.int64))
    with path.open("wb") as handle:
        for cell in range(ORDER6_CELLS):
            archive_offset = RECORDS_OFFSET + int(starts[cell]) * RECORD_BYTES
            byte_length = int(counts[cell]) * RECORD_BYTES
            parent = int(parent5[int(starts[cell])]) if counts[cell] else cell >> 2
            handle.write(
                struct.pack(
                    "<IIIIIff",
                    cell,
                    archive_offset,
                    byte_length,
                    int(counts[cell]),
                    parent,
                    float(lon[cell].to_value(u.deg)),
                    float(lat[cell].to_value(u.deg)),
                )
            )
    expected = ORDER6_CELLS * INDEX_ENTRY_BYTES
    if path.stat().st_size != expected or int(counts.sum()) != RENDERABLE_ROWS:
        raise RuntimeError("Catalog v8 index reconstruction failed")
    return expected


def database_counts(connection: sqlite3.Connection) -> tuple[int, int, int]:
    searchable = int(connection.execute("SELECT COUNT(*) FROM catalog_objects").fetchone()[0])
    renderable = int(connection.execute("SELECT COUNT(*) FROM catalog_objects WHERE mag_g IS NOT NULL AND mag_g = mag_g").fetchone()[0])
    spatial = int(connection.execute("SELECT COUNT(*) FROM catalog_objects WHERE mag_g IS NOT NULL AND bp_rp IS NOT NULL AND parallax_mas > 0").fetchone()[0])
    return searchable, renderable, spatial


def build(source: Path, output_dir: Path, public_dir: Path | None) -> None:
    if astropy_healpix.__version__ != "1.1.2":
        raise RuntimeError(f"astropy-healpix version must be 1.1.2, got {astropy_healpix.__version__}")
    source_sha = sha256_file(source)
    if source_sha != SOURCE_SHA256:
        raise RuntimeError(f"V7 source SHA changed: {source_sha}")
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_path = output_dir / "catalog-v8.bin"
    index_path = output_dir / "catalog-v8.index.bin"
    manifest_path = output_dir / "manifest.json"
    connection = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
    counts = database_counts(connection)
    if counts != (SOURCE_ROWS, RENDERABLE_ROWS, SPATIAL_3D_ROWS):
        raise RuntimeError(f"V7 row contract changed: {counts}")
    records = read_renderable_rows(connection)
    connection.close()
    record_cells, parent5, archive_bytes = write_archive(archive_path, records)
    index_bytes = write_index(index_path, record_cells, parent5)
    if np.any(record_cells[1:] < record_cells[:-1]) or len(np.unique(records["row_id"])) != RENDERABLE_ROWS:
        raise RuntimeError("Catalog v8 ordering or row uniqueness check failed")
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest = {
        "version": VERSION,
        "scheme": "NESTED",
        "orders": [3, 5, 6],
        "generatedAt": generated_at,
        "source": {"path": "dist/catalog-v7/catalog-v7.sqlite", "sha256": source_sha, "rowCount": SOURCE_ROWS},
        "counts": {"searchable": SOURCE_ROWS, "renderable": RENDERABLE_ROWS, "spatial3d": SPATIAL_3D_ROWS},
        "archive": {
            "url": "data/catalog-healpix-v8/catalog-v8.bin",
            "sha256": sha256_file(archive_path),
            "byteLength": archive_bytes,
            "headerBytes": HEADER_BYTES,
            "recordBytes": RECORD_BYTES,
            "recordsOffset": RECORDS_OFFSET,
        },
        "index": {
            "url": "data/catalog-healpix-v8/catalog-v8.index.bin",
            "sha256": sha256_file(index_path),
            "byteLength": index_bytes,
            "entryBytes": INDEX_ENTRY_BYTES,
            "cellCount": ORDER6_CELLS,
        },
        "cache": {"memoryBytes": 64 * 1024 * 1024, "persistentBytes": 128 * 1024 * 1024, "maxConcurrentRanges": 4},
        "fallbacks": ["data/gaia-dr3-nearby-46000-v255.json", "data/gaia-dr3-bright-5000.json"],
        "builder": {
            "script": "scripts/build-catalog-healpix-v8.py",
            "python": f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}",
            "numpy": np.__version__,
            "astropyHealpix": astropy_healpix.__version__,
            "recordSort": "healpix-order6,g-quantized,rowid",
        },
        "canonical": True,
        "livePhysicsMutation": "not-applied",
        "workerPhysicsMutation": "not-applied",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if public_dir is not None:
        public_dir.mkdir(parents=True, exist_ok=True)
        for artifact in (archive_path, index_path, manifest_path):
            shutil.copy2(artifact, public_dir / artifact.name)
    print(json.dumps({"passed": True, "archiveBytes": archive_bytes, "indexBytes": index_bytes, "manifest": str(manifest_path)}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("dist/catalog-v7/catalog-v7.sqlite"))
    parser.add_argument("--output", type=Path, default=Path("dist/catalog-healpix-v8"))
    parser.add_argument("--public", type=Path, default=Path("public/data/catalog-healpix-v8"))
    parser.add_argument("--no-public-copy", action="store_true")
    args = parser.parse_args()
    build(args.source.resolve(), args.output.resolve(), None if args.no_public_copy else args.public.resolve())


if __name__ == "__main__":
    main()

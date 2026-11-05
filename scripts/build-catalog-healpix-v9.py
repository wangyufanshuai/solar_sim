#!/usr/bin/env python3
"""Build the v264 checksummed/source-index wrapper over immutable catalog v8."""

from __future__ import annotations

import argparse
import hashlib
import json
import mmap
import shutil
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path


VERSION = "v264-healpix-stream-catalog-v9"
INDEX_V8_ENTRY = struct.Struct("<IIIIIff")
INDEX_V9_ENTRY = struct.Struct("<IIIIIffI")
SOURCE_ENTRY = struct.Struct("<QII")
DIRECTORY_ENTRY = struct.Struct("<QQII")
PAGE_ENTRIES = 4096


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_sha(value: dict) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build(source_root: Path, output: Path, public: Path) -> dict:
    manifest_v8_path = source_root / "manifest.json"
    archive_path = source_root / "catalog-v8.bin"
    index_v8_path = source_root / "catalog-v8.index.bin"
    manifest_v8 = json.loads(manifest_v8_path.read_text(encoding="utf-8"))
    if manifest_v8["version"] != "v257-healpix-stream-catalog-v8":
        raise RuntimeError("Catalog v8 manifest version changed")
    if sha256_file(archive_path) != manifest_v8["archive"]["sha256"]:
        raise RuntimeError("Catalog v8 archive SHA changed")
    if sha256_file(index_v8_path) != manifest_v8["index"]["sha256"]:
        raise RuntimeError("Catalog v8 index SHA changed")

    output.mkdir(parents=True, exist_ok=True)
    index_v9_path = output / "catalog-v9.index.bin"
    source_data_path = output / "catalog-v9.source-index.bin"
    source_directory_path = output / "catalog-v9.source-directory.bin"
    raw_index = index_v8_path.read_bytes()
    if len(raw_index) % INDEX_V8_ENTRY.size:
        raise RuntimeError("Catalog v8 index is truncated")
    entries = [INDEX_V8_ENTRY.unpack_from(raw_index, offset) for offset in range(0, len(raw_index), INDEX_V8_ENTRY.size)]
    if len(entries) != 49_152:
        raise RuntimeError("Catalog v8 cell count changed")

    source_rows: list[tuple[int, int, int]] = []
    with archive_path.open("rb") as archive_handle, mmap.mmap(archive_handle.fileno(), 0, access=mmap.ACCESS_READ) as archive:
        with index_v9_path.open("wb") as output_index:
            for cell, archive_offset, byte_length, row_count, parent, ra, dec in entries:
                payload = archive[archive_offset:archive_offset + byte_length]
                crc32 = zlib.crc32(payload) & 0xFFFF_FFFF if byte_length else 0
                output_index.write(INDEX_V9_ENTRY.pack(cell, archive_offset, byte_length, row_count, parent, ra, dec, crc32))
                for ordinal in range(row_count):
                    record_offset = archive_offset + ordinal * manifest_v8["archive"]["recordBytes"]
                    source_id = struct.unpack_from("<Q", archive, record_offset + 4)[0]
                    source_rows.append((source_id, cell, ordinal))
                if cell % 4096 == 0:
                    print(f"catalog-v9 indexed cell {cell:,}/49,152", flush=True)

    source_rows.sort(key=lambda row: (row[0], row[1], row[2]))
    if len(source_rows) != manifest_v8["counts"]["renderable"]:
        raise RuntimeError("Catalog v9 source index row count changed")
    if any(source_rows[index - 1][0] == source_rows[index][0] for index in range(1, len(source_rows))):
        raise RuntimeError("Catalog v9 source IDs are not unique")
    with source_data_path.open("wb") as data_handle, source_directory_path.open("wb") as directory_handle:
        for page_start in range(0, len(source_rows), PAGE_ENTRIES):
            page = source_rows[page_start:page_start + PAGE_ENTRIES]
            byte_offset = data_handle.tell()
            for row in page:
                data_handle.write(SOURCE_ENTRY.pack(*row))
            directory_handle.write(DIRECTORY_ENTRY.pack(page[0][0], page[-1][0], byte_offset, len(page)))

    source_manifest_sha = sha256_file(manifest_v8_path)
    manifest = {
        "version": VERSION,
        "scheme": "NESTED",
        "orders": [3, 5, 6],
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sourceV8ManifestSha256": source_manifest_sha,
        "counts": manifest_v8["counts"],
        "archive": manifest_v8["archive"],
        "index": {
            "url": "data/catalog-healpix-v9/catalog-v9.index.bin",
            "sha256": sha256_file(index_v9_path),
            "byteLength": index_v9_path.stat().st_size,
            "entryBytes": INDEX_V9_ENTRY.size,
            "cellCount": len(entries),
            "checksum": "crc32-per-tile",
        },
        "sourceIndex": {
            "version": "catalog-source-index-v1",
            "entryBytes": SOURCE_ENTRY.size,
            "entryCount": len(source_rows),
            "pageEntries": PAGE_ENTRIES,
            "data": {
                "url": "data/catalog-healpix-v9/catalog-v9.source-index.bin",
                "sha256": sha256_file(source_data_path),
                "byteLength": source_data_path.stat().st_size,
            },
            "directory": {
                "url": "data/catalog-healpix-v9/catalog-v9.source-directory.bin",
                "sha256": sha256_file(source_directory_path),
                "byteLength": source_directory_path.stat().st_size,
                "entryBytes": DIRECTORY_ENTRY.size,
                "pageCount": (len(source_rows) + PAGE_ENTRIES - 1) // PAGE_ENTRIES,
            },
        },
        "cache": manifest_v8["cache"],
        "fallbacks": [
            "data/catalog-healpix-v8/manifest.json",
            "data/gaia-dr3-nearby-46000-v255.json",
            "data/gaia-dr3-bright-5000.json",
        ],
        "canonical": True,
        "livePhysicsMutation": "not-applied",
        "workerPhysicsMutation": "not-applied",
    }
    manifest["manifestSha256"] = canonical_sha(manifest)
    manifest_path = output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if public.resolve() != output.resolve():
        if public.exists():
            shutil.rmtree(public)
        shutil.copytree(output, public)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("public/data/catalog-healpix-v8"))
    parser.add_argument("--output", type=Path, default=Path("dist/catalog-healpix-v9"))
    parser.add_argument("--public", type=Path, default=Path("public/data/catalog-healpix-v9"))
    args = parser.parse_args()
    manifest = build(args.source, args.output, args.public)
    print(json.dumps({
        "generated": True,
        "version": manifest["version"],
        "rows": manifest["sourceIndex"]["entryCount"],
        "indexBytes": manifest["index"]["byteLength"],
        "sourceIndexBytes": manifest["sourceIndex"]["data"]["byteLength"],
        "manifestSha256": manifest["manifestSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build the v264.2 compact HEALPix wrapper without mutating v8/v9 artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
from datetime import datetime, timezone
from pathlib import Path


VERSION = "v264r2-healpix-stream-catalog-v10"
EXPECTED_V9_CANONICAL_SHA = "68ea2f7972213bd420ffe9b85f6b02a3be977c58e3f3094d57d3796fbd45f421"
INDEX_V9_ENTRY = struct.Struct("<IIIIIffI")
INDEX_V10_ENTRY = struct.Struct("<IIffI")
RECORD_BYTES = 32
CELL_COUNT = 49_152
ARCHIVE_BUDGET_BYTES = 1_600_000
COLD_TRANSFER_LIMIT_BYTES = 2_621_440


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_sha(value: dict) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build(v9_root: Path, v8_root: Path, output: Path, public: Path) -> dict:
    manifest_v9_path = v9_root / "manifest.json"
    index_v9_path = v9_root / "catalog-v9.index.bin"
    source_data_path = v9_root / "catalog-v9.source-index.bin"
    source_directory_path = v9_root / "catalog-v9.source-directory.bin"
    archive_path = v8_root / "catalog-v8.bin"
    manifest_v9 = json.loads(manifest_v9_path.read_text(encoding="utf-8"))
    if manifest_v9.get("manifestSha256") != EXPECTED_V9_CANONICAL_SHA:
        raise RuntimeError("Catalog v9 canonical SHA changed")
    for path, expected in [
        (index_v9_path, manifest_v9["index"]["sha256"]),
        (source_data_path, manifest_v9["sourceIndex"]["data"]["sha256"]),
        (source_directory_path, manifest_v9["sourceIndex"]["directory"]["sha256"]),
        (archive_path, manifest_v9["archive"]["sha256"]),
    ]:
        if sha256_file(path) != expected:
            raise RuntimeError(f"Catalog source SHA changed: {path}")

    raw_v9 = index_v9_path.read_bytes()
    if len(raw_v9) != CELL_COUNT * INDEX_V9_ENTRY.size:
        raise RuntimeError("Catalog v9 index length changed")
    output.mkdir(parents=True, exist_ok=True)
    index_v10_path = output / "catalog-v10.index.bin"
    with index_v10_path.open("wb") as target:
        for cell in range(CELL_COUNT):
            offset = cell * INDEX_V9_ENTRY.size
            source_cell, archive_offset, byte_length, row_count, parent, ra, dec, crc32 = INDEX_V9_ENTRY.unpack_from(raw_v9, offset)
            if source_cell != cell:
                raise RuntimeError(f"Catalog v9 cell ordinal drifted at {cell}")
            if parent != cell >> 2:
                raise RuntimeError(f"Catalog v9 parent cannot be derived at {cell}")
            if byte_length % RECORD_BYTES or row_count != byte_length // RECORD_BYTES:
                raise RuntimeError(f"Catalog v9 row count cannot be derived at {cell}")
            target.write(INDEX_V10_ENTRY.pack(archive_offset, byte_length, ra, dec, crc32))
    if index_v10_path.stat().st_size != CELL_COUNT * INDEX_V10_ENTRY.size:
        raise RuntimeError("Catalog v10 compact index length mismatch")

    manifest = {
        "version": VERSION,
        "scheme": "NESTED",
        "orders": [3, 5, 6],
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sourceV8ManifestSha256": manifest_v9["sourceV8ManifestSha256"],
        "sourceV9ManifestSha256": sha256_file(manifest_v9_path),
        "sourceV9CanonicalSha256": manifest_v9["manifestSha256"],
        "counts": manifest_v9["counts"],
        "archive": manifest_v9["archive"],
        "index": {
            "url": "data/catalog-healpix-v10/catalog-v10.index.bin",
            "sha256": sha256_file(index_v10_path),
            "byteLength": index_v10_path.stat().st_size,
            "entryBytes": INDEX_V10_ENTRY.size,
            "cellCount": CELL_COUNT,
            "checksum": "crc32-per-tile",
            "encoding": "implicit-cell-parent-rowcount-v1",
        },
        "sourceIndex": manifest_v9["sourceIndex"],
        "cache": manifest_v9["cache"],
        "transfer": {
            "balancedArchiveBudgetBytes": ARCHIVE_BUDGET_BYTES,
            "coldTransferLimitBytes": COLD_TRANSFER_LIMIT_BYTES,
            "coldUpperBoundBytes": 0,
        },
        "fallbacks": [
            "data/catalog-healpix-v9/manifest.json",
            "data/catalog-healpix-v8/manifest.json",
            "data/gaia-dr3-nearby-46000-v255.json",
            "data/gaia-dr3-bright-5000.json",
        ],
        "canonical": True,
        "livePhysicsMutation": "not-applied",
        "workerPhysicsMutation": "not-applied",
    }
    manifest_text = ""
    for _ in range(8):
        manifest["manifestSha256"] = canonical_sha({key: value for key, value in manifest.items() if key != "manifestSha256"})
        manifest_text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
        actual_upper_bound = len(manifest_text.encode("utf-8")) + index_v10_path.stat().st_size + source_directory_path.stat().st_size + ARCHIVE_BUDGET_BYTES
        if actual_upper_bound == manifest["transfer"]["coldUpperBoundBytes"]:
            break
        manifest["transfer"]["coldUpperBoundBytes"] = actual_upper_bound
    else:
        raise RuntimeError("Catalog v10 cold transfer upper bound did not converge")
    if manifest["transfer"]["coldUpperBoundBytes"] > COLD_TRANSFER_LIMIT_BYTES:
        raise RuntimeError(f"Catalog v10 cold transfer upper bound exceeds limit: {manifest['transfer']['coldUpperBoundBytes']}")
    manifest_path = output / "manifest.json"
    manifest_path.write_text(manifest_text, encoding="utf-8", newline="\n")

    if public.resolve() != output.resolve():
        if public.exists():
            shutil.rmtree(public)
        shutil.copytree(output, public)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v9-root", type=Path, default=Path("public/data/catalog-healpix-v9"))
    parser.add_argument("--v8-root", type=Path, default=Path("public/data/catalog-healpix-v8"))
    parser.add_argument("--output", type=Path, default=Path("dist/catalog-healpix-v10"))
    parser.add_argument("--public", type=Path, default=Path("public/data/catalog-healpix-v10"))
    args = parser.parse_args()
    manifest = build(args.v9_root, args.v8_root, args.output, args.public)
    print(json.dumps({
        "generated": True,
        "version": manifest["version"],
        "indexBytes": manifest["index"]["byteLength"],
        "coldUpperBoundBytes": manifest["transfer"]["coldUpperBoundBytes"],
        "manifestSha256": manifest["manifestSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()

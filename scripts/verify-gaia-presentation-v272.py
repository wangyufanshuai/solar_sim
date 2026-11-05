#!/usr/bin/env python3
"""Verify and attest the exact v272 Gaia 10m presentation catalog."""

from __future__ import annotations

import argparse
import hashlib
import json
import mmap
import os
import zlib
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from astropy import units as u
from astropy.coordinates import ICRS
from astropy_healpix import HEALPix


ID = "gaia-dr3-presentation-10000000-v9"
VERSION = "v272-gaia-dr3-presentation-10000000-v10m-v1"
EVIDENCE_VERSION = "v272-gaia-presentation-catalog-closure-evidence-v1"
TARGET_ROWS = 10_000_000
RECORD_BYTES = 24
ORDER3_CELLS = 768
ORDER6_CELLS = 49_152
ORDER8_CELLS = 786_432
EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"

RECORD_DTYPE = np.dtype({
    "names": ["source_id", "ra_quant", "dec_quant", "g_quant", "color_quant", "parallax"],
    "formats": ["<u8", "<u4", "<u4", "<u2", "<i2", "<f4"],
    "offsets": [0, 8, 12, 16, 18, 20],
    "itemsize": RECORD_BYTES,
})
LEAF_DTYPE = np.dtype([
    ("offset", "<u4"), ("length", "<u4"), ("crc32", "<u4"), ("count", "<u4"),
])
DIRECTORY_DTYPE = np.dtype([
    ("leaf_offset", "<u4"), ("leaf_length", "<u4"),
    ("archive_offset", "<u4"), ("archive_length", "<u4"),
    ("center_ra", "<f4"), ("center_dec", "<f4"), ("mask", "<u2"), ("reserved", "<u2"),
])
AGGREGATE_DTYPE = np.dtype([
    ("count", "<u4"), ("mean_g", "<f4"), ("mean_bp_rp", "<f4"),
    ("min_g", "<f4"), ("max_g", "<f4"), ("representative_ordinal", "<u4"),
])
SOURCE_DTYPE = np.dtype([("source_id", "<u8"), ("cell", "<u4"), ("ordinal", "<u4")])
SOURCE_DIRECTORY_DTYPE = np.dtype([
    ("first", "<u8"), ("last", "<u8"), ("offset", "<u4"), ("count", "<u4"),
])


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical_sha(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def artifact_path(root: Path, entry: dict[str, object]) -> Path:
    return root / Path(str(entry["url"])).name


def verify_manifest_and_files(root: Path, public: Path, manifest: dict[str, object]) -> list[dict[str, object]]:
    require(manifest.get("version") == VERSION and manifest.get("id") == ID, "v272 manifest identity changed")
    unsigned = {key: value for key, value in manifest.items() if key not in {"generatedAt", "manifestSha256"}}
    require(canonical_sha(unsigned) == manifest.get("manifestSha256"), "v272 manifest canonical SHA mismatch")
    counts = manifest.get("counts", {})
    require(counts.get("presentation") == TARGET_ROWS, "v272 presentation count is not exact 10m")
    require(counts.get("duplicateSourceIds") == 0, "v272 duplicate source ids were reported")
    runtime = manifest.get("runtime", {})
    require(runtime.get("standaloneIntentRequired") is True and runtime.get("liteIncluded") is False, "v272 runtime intent/Lite boundary changed")
    require(manifest.get("presentationOnly") is True and manifest.get("surveyCompletenessClaim") == "not-applied", "v272 presentation/science boundary changed")
    require(manifest.get("livePhysicsMutation") == "not-applied" and manifest.get("workerPhysicsMutation") == "not-applied", "v272 physics mutation boundary changed")
    preflight = manifest.get("resourcePreflight", {})
    require(preflight.get("defaultRequiredPhysicalMemoryBytes") == 6 * 1024**3, "default 6 GiB build threshold changed")
    require(preflight.get("requestedPhysicalMemoryBytes") == 3 * 1024**3, "authorized 3 GiB threshold is missing")
    require(preflight.get("overrideApplied") is True and preflight.get("authorization") == "user-authorized-current-memory-build", "low-memory build authorization is invalid")
    require(preflight.get("freePhysicalMemoryBytes", 0) >= 3 * 1024**3, "build preflight memory was below the authorized threshold")
    require(preflight.get("requiredDiskBytes") == 30 * 1024**3 and preflight.get("freeDiskBytes", 0) >= 30 * 1024**3, "build disk preflight is invalid")

    source_index = manifest["sourceIndex"]
    entries = [
        ("archive", manifest["archive"]),
        ("aggregateOrder3", manifest["aggregateOrder3"]),
        ("directoryOrder6", manifest["directoryOrder6"]),
        ("leafIndexOrder8", manifest["leafIndexOrder8"]),
        ("sourceIndex.data", source_index["data"]),
        ("sourceIndex.directory", source_index["directory"]),
    ]
    artifacts: list[dict[str, object]] = []
    for label, entry in entries:
        path = artifact_path(root, entry)
        published = public / path.name
        require(path.is_file() and published.is_file(), f"v272 artifact is missing: {label}")
        require(path.stat().st_size == int(entry["byteLength"]), f"v272 artifact length changed: {label}")
        digest = sha256_file(path)
        require(digest == entry["sha256"], f"v272 artifact SHA changed: {label}")
        require(os.path.samefile(path, published) or sha256_file(published) == digest, f"v272 public artifact differs: {label}")
        artifacts.append({"label": label, "path": path.relative_to(Path.cwd()).as_posix(), "bytes": path.stat().st_size, "sha256": digest})
    public_manifest = public / "manifest.json"
    require(public_manifest.is_file() and sha256_file(public_manifest) == sha256_file(root / "manifest.json"), "v272 public manifest differs")
    return artifacts


def verify_spatial(root: Path, manifest: dict[str, object]) -> tuple[np.memmap, np.memmap, np.ndarray, dict[str, int]]:
    archive_path = artifact_path(root, manifest["archive"])
    leaf_path = artifact_path(root, manifest["leafIndexOrder8"])
    directory_path = artifact_path(root, manifest["directoryOrder6"])
    aggregate_path = artifact_path(root, manifest["aggregateOrder3"])
    archive = np.memmap(archive_path, dtype=RECORD_DTYPE, mode="r", shape=(TARGET_ROWS,))
    leaf = np.memmap(leaf_path, dtype=LEAF_DTYPE, mode="r", shape=(ORDER8_CELLS,))
    counts = np.asarray(leaf["count"], dtype=np.uint64)
    starts = np.asarray(leaf["offset"], dtype=np.uint64) // RECORD_BYTES
    require(int(counts.sum()) == TARGET_ROWS, "order-8 leaf counts do not reconstruct 10m rows")
    require(np.array_equal(np.asarray(leaf["length"], dtype=np.uint64), counts * RECORD_BYTES), "order-8 leaf lengths do not match row counts")
    expected_starts = np.zeros(ORDER8_CELLS, dtype=np.uint64)
    expected_starts[1:] = np.cumsum(counts[:-1], dtype=np.uint64)
    require(np.array_equal(starts, expected_starts), "order-8 leaf offsets are not contiguous")

    aggregate = np.memmap(aggregate_path, dtype=AGGREGATE_DTYPE, mode="r", shape=(ORDER3_CELLS,))
    require(int(np.asarray(aggregate["count"], dtype=np.uint64).sum()) == TARGET_ROWS, "order-3 aggregate does not conserve 10m rows")
    require(np.array_equal(np.asarray(aggregate["count"], dtype=np.uint64), counts.reshape(ORDER3_CELLS, -1).sum(axis=1)), "order-3 aggregate differs from order-8 leaves")

    directory = np.memmap(directory_path, dtype=DIRECTORY_DTYPE, mode="r", shape=(ORDER6_CELLS,))
    parent_counts = counts.reshape(ORDER6_CELLS, 16)
    parent_starts = starts[::16]
    require(np.array_equal(directory["leaf_offset"], np.arange(ORDER6_CELLS, dtype=np.uint32) * 16 * LEAF_DTYPE.itemsize), "order-6 leaf offsets changed")
    require(bool(np.all(directory["leaf_length"] == 16 * LEAF_DTYPE.itemsize)), "order-6 leaf page lengths changed")
    require(np.array_equal(np.asarray(directory["archive_offset"], dtype=np.uint64), parent_starts * RECORD_BYTES), "order-6 archive offsets changed")
    require(np.array_equal(np.asarray(directory["archive_length"], dtype=np.uint64), parent_counts.sum(axis=1) * RECORD_BYTES), "order-6 archive lengths changed")
    masks = np.zeros(ORDER6_CELLS, dtype=np.uint16)
    for child in range(16):
        masks |= (parent_counts[:, child] > 0).astype(np.uint16) << child
    require(np.array_equal(directory["mask"], masks), "order-6 child masks changed")
    require(bool(np.all(np.isfinite(directory["center_ra"]))) and bool(np.all(np.isfinite(directory["center_dec"]))), "order-6 centers are non-finite")
    require(bool(np.all((directory["center_ra"] >= 0) & (directory["center_ra"] < 360))), "order-6 RA center is invalid")
    require(bool(np.all((directory["center_dec"] >= -90) & (directory["center_dec"] <= 90))), "order-6 Dec center is invalid")
    del directory, aggregate

    crc_checked = 0
    with archive_path.open("rb") as handle:
        mapped = mmap.mmap(handle.fileno(), 0, access=mmap.ACCESS_READ)
        try:
            for cell in range(ORDER8_CELLS):
                length = int(leaf[cell]["length"])
                expected_crc = int(leaf[cell]["crc32"])
                if length == 0:
                    require(expected_crc == 0, f"empty order-8 cell {cell} has a CRC")
                    continue
                offset = int(leaf[cell]["offset"])
                require((zlib.crc32(mapped[offset:offset + length]) & 0xFFFFFFFF) == expected_crc, f"order-8 CRC mismatch at cell {cell}")
                crc_checked += 1
        finally:
            mapped.close()

    hp8 = HEALPix(nside=2**8, order="nested", frame=ICRS())
    ends = starts + counts
    previous: tuple[int, int, int] | None = None
    quantized_cell_boundary_adjustments = 0
    for start in range(0, TARGET_ROWS, 100_000):
        end = min(TARGET_ROWS, start + 100_000)
        chunk = archive[start:end]
        ordinals = np.arange(start, end, dtype=np.uint64)
        cells = np.searchsorted(ends, ordinals, side="right").astype(np.uint32)
        ra = chunk["ra_quant"].astype(np.float64) / 2**32 * 360
        dec = chunk["dec_quant"].astype(np.float64) / np.iinfo(np.uint32).max * 180 - 90
        reconstructed = hp8.lonlat_to_healpix(ra * u.deg, dec * u.deg).astype(np.uint32)
        mismatched = cells != reconstructed
        if bool(np.any(mismatched)):
            expected_mismatch = cells[mismatched]
            reconstructed_mismatch = reconstructed[mismatched]
            neighbours = hp8.neighbours(reconstructed_mismatch.astype(np.int64))
            adjacent = np.any(neighbours == expected_mismatch[np.newaxis, :], axis=0)
            require(bool(np.all(adjacent)), f"archive quantized coordinate moved beyond an adjacent cell at row {start}")
            quantized_cell_boundary_adjustments += int(np.count_nonzero(mismatched))
        if len(chunk) > 1:
            same_cell = cells[1:] == cells[:-1]
            same_g = chunk["g_quant"][1:] == chunk["g_quant"][:-1]
            require(not bool(np.any(same_cell & (chunk["g_quant"][1:] < chunk["g_quant"][:-1]))), f"archive G ordering failed at row {start}")
            require(not bool(np.any(same_cell & same_g & (chunk["source_id"][1:] <= chunk["source_id"][:-1]))), f"archive source ordering failed at row {start}")
        if previous is not None:
            cell, g_quant, source_id = previous
            first = (int(cells[0]), int(chunk["g_quant"][0]), int(chunk["source_id"][0]))
            require(first > (cell, g_quant, source_id), f"archive chunk-boundary ordering failed at row {start}")
        previous = (int(cells[-1]), int(chunk["g_quant"][-1]), int(chunk["source_id"][-1]))
    return archive, leaf, starts, {
        "nonEmptyLeafCrcCount": crc_checked,
        "quantizedCoordinateCellBoundaryAdjustments": quantized_cell_boundary_adjustments,
        "quantizedCoordinateCellPolicy": "same-or-adjacent-healpix-cell-after-u32-coordinate-quantization",
    }


def verify_source_index(root: Path, manifest: dict[str, object], archive: np.memmap, leaf: np.memmap, starts: np.ndarray) -> dict[str, int]:
    source_index = manifest["sourceIndex"]
    data_path = artifact_path(root, source_index["data"])
    directory_path = artifact_path(root, source_index["directory"])
    source = np.memmap(data_path, dtype=SOURCE_DTYPE, mode="r", shape=(TARGET_ROWS,))
    directory = np.memmap(directory_path, dtype=SOURCE_DIRECTORY_DTYPE, mode="r")
    expected_pages = (TARGET_ROWS + 4095) // 4096
    require(len(directory) == expected_pages, "source directory page count changed")
    previous_source = -1
    for start in range(0, TARGET_ROWS, 100_000):
        end = min(TARGET_ROWS, start + 100_000)
        chunk = source[start:end]
        require(int(chunk["source_id"][0]) > previous_source and not bool(np.any(chunk["source_id"][1:] <= chunk["source_id"][:-1])), f"source index uniqueness/order failed at row {start}")
        require(bool(np.all(chunk["cell"] < ORDER8_CELLS)), f"source index cell failed at row {start}")
        require(bool(np.all(chunk["ordinal"].astype(np.uint64) < leaf["count"][chunk["cell"]].astype(np.uint64))), f"source index ordinal failed at row {start}")
        archive_ordinals = starts[chunk["cell"]] + chunk["ordinal"].astype(np.uint64)
        require(np.array_equal(archive["source_id"][archive_ordinals], chunk["source_id"]), f"source index reconstruction failed at row {start}")
        previous_source = int(chunk["source_id"][-1])
    for page, entry in enumerate(directory):
        start = page * 4096
        count = min(4096, TARGET_ROWS - start)
        require(int(entry["offset"]) == start * SOURCE_DTYPE.itemsize and int(entry["count"]) == count, f"source directory range failed at page {page}")
        require(int(entry["first"]) == int(source[start]["source_id"]) and int(entry["last"]) == int(source[start + count - 1]["source_id"]), f"source directory boundary failed at page {page}")
    del source, directory
    return {"sourceIndexRows": TARGET_ROWS, "sourceDirectoryPages": expected_pages}


def verify_runtime_sources(project: Path) -> dict[str, object]:
    packs = (project / "scripts/build-content-packs.mjs").read_text(encoding="utf-8")
    stable = (project / "app/components/StableGaiaOverlay.tsx").read_text(encoding="utf-8")
    overlay = (project / "app/components/GaiaStarOverlay.tsx").read_text(encoding="utf-8")
    require('\"gaia-presentation\": [' in packs and 'source: \"public/data/gaia-dr3-presentation-10000000-v9\"' in packs, "standalone Gaia content pack is not isolated")
    core_section = packs[packs.index("  core: ["):packs.index('  \"planet-hd\": [')]
    require("gaia-dr3-presentation-10000000-v9" not in core_section, "10m Gaia path leaked into the core/Lite pack")
    require('catalogStreamEnabled={targetScaleBand === \"stellar\" || targetScaleBand === \"galactic\"}' in stable, "10m Gaia stream is not scale-intent gated")
    require('const CatalogFaintStarFieldV272 = lazy(() => import(\"./CatalogFaintStarFieldV272\"))' in overlay, "10m Gaia stream is not lazy")
    require("{enabled && catalogStreamEnabled ? (" in overlay, "10m Gaia stream activation gate changed")
    return {"standalonePack": "gaia-presentation", "litePathCount": 0, "activation": "stellar-or-galactic-intent", "lazyChunk": True}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(f"dist/{ID}"))
    parser.add_argument("--public", type=Path, default=Path(f"public/data/{ID}"))
    parser.add_argument("--output", type=Path, default=Path("dist/science/gaia-presentation-v272-closure-evidence.json"))
    args = parser.parse_args()
    project = Path.cwd().resolve()
    root = args.root.resolve()
    public = args.public.resolve()
    manifest_path = root / "manifest.json"
    require(manifest_path.is_file(), "v272 manifest is missing")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    artifacts = verify_manifest_and_files(root, public, manifest)
    archive, leaf, starts, spatial = verify_spatial(root, manifest)
    source = verify_source_index(root, manifest, archive, leaf, starts)
    runtime = verify_runtime_sources(project)
    del archive, leaf, starts

    progress = json.loads((project / "dist/science/kerr-dense-campaign-progress-v8.json").read_text(encoding="utf-8"))
    product_pointer_path = project / "dist/release/orbit-atlas-current-product-evidence-v263.json"
    product_pointer = json.loads(product_pointer_path.read_text(encoding="utf-8"))
    require(progress.get("codeSha256") == EXPECTED_CODE_SHA and progress.get("finiteObserverScreenManifestSha256") == EXPECTED_SCREEN_SHA, "protected science SHA changed")
    require(product_pointer.get("version") == "v263-current-product-evidence-pointer", "formal product pointer moved away from v263")
    evidence: dict[str, object] = {
        "version": EVIDENCE_VERSION,
        "generatedAt": utc_now(),
        "status": "implemented-awaiting-browser-qualification",
        "catalog": {
            "id": ID,
            "rows": TARGET_ROWS,
            "archiveBytes": TARGET_ROWS * RECORD_BYTES,
            "manifestPath": manifest_path.relative_to(project).as_posix(),
            "manifestFileSha256": sha256_file(manifest_path),
            "manifestCanonicalSha256": manifest["manifestSha256"],
            "artifacts": artifacts,
            **spatial,
            **source,
        },
        "runtime": runtime,
        "resourcePreflight": manifest["resourcePreflight"],
        "science": {
            "defaultKernel": "legacy-eih-1pn",
            "codeSha256": EXPECTED_CODE_SHA,
            "screenSha256": EXPECTED_SCREEN_SHA,
            "workerPhysicsMutation": "not-applied",
            "eihOnePnMutation": "not-applied",
            "kerrMutation": "not-applied",
        },
        "release": {
            "formalProductPointer": "v263",
            "formalProductPointerSha256": sha256_file(product_pointer_path),
            "localShadowOnly": True,
            "promotionApplied": False,
            "vercelApplied": False,
        },
        "boundary": "exact-10m-presentation-catalog-not-science-mother-or-survey-completeness",
    }
    evidence["evidenceSha256"] = canonical_sha({key: value for key, value in evidence.items() if key not in {"generatedAt", "evidenceSha256"}})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".part")
    temporary.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    os.replace(temporary, args.output)
    print(json.dumps({
        "passed": True,
        "rows": TARGET_ROWS,
        "archiveBytes": TARGET_ROWS * RECORD_BYTES,
        "manifestSha256": manifest["manifestSha256"],
        "evidenceSha256": evidence["evidenceSha256"],
        "output": args.output.as_posix(),
    }, indent=2))


if __name__ == "__main__":
    main()

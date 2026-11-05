from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import socket
import stat
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

import numpy as np
from astropy.io import fits

ROOT = Path.cwd()
V539_ATLAS = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/atlas.json"
V539_CRATE = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip"
V539_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v539-evidence.json"
V539_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v539.json"
OUT_DIR = ROOT / "dist/science/kerr-response-aware-offline-replay-v540"
RECEIPT_PATH = OUT_DIR / "replay-receipt.json"
ATLAS_PATH = OUT_DIR / "atlas.json"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256"}
REQUIRED_MEMBERS = ["README.md", "data/column-schema.csv", "data/response-aware-sparse-table.fits", "manifest-sha256.txt", "metadata/v537-fits-atlas.json", "metadata/v538-column-schema-atlas.json", "metadata/v538-evidence.json", "metadata/v538-pointer.json", "ro-crate-metadata.json"]
MAX_CRATE_BYTES = 1024 * 1024
MAX_MEMBER_BYTES = 256 * 1024
MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024
MAX_MEMBER_COUNT = 16


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def byte_sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return byte_sha(path.read_bytes())


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(path)


def safe_member_path(name: str) -> bool:
    path = PurePosixPath(name)
    return bool(name) and not path.is_absolute() and ".." not in path.parts and "\\" not in name and not name.startswith("/")


def replay_crate_bytes(crate_bytes: bytes) -> dict[str, Any]:
    if not 0 < len(crate_bytes) <= MAX_CRATE_BYTES:
        raise RuntimeError("v540-crate-size")
    network_attempt_count = 0
    original_connect = socket.socket.connect
    original_create_connection = socket.create_connection

    def blocked_connect(*_args: Any, **_kwargs: Any) -> Any:
        nonlocal network_attempt_count
        network_attempt_count += 1
        raise RuntimeError("v540-network-forbidden")

    socket.socket.connect = blocked_connect  # type: ignore[method-assign]
    socket.create_connection = blocked_connect  # type: ignore[assignment]
    temporary_path: Path | None = None
    try:
        with tempfile.TemporaryDirectory(prefix="orbit-atlas-v540-") as temporary:
            temporary_path = Path(temporary)
            with zipfile.ZipFile(io.BytesIO(crate_bytes), "r") as archive:
                infos = archive.infolist()
                names = [info.filename for info in infos]
                if len(infos) > MAX_MEMBER_COUNT or len(names) != len(set(names)) or names != sorted(REQUIRED_MEMBERS):
                    raise RuntimeError("v540-member-inventory")
                total_uncompressed = 0
                for info in infos:
                    mode = info.external_attr >> 16
                    if not safe_member_path(info.filename) or stat.S_IFMT(mode) == stat.S_IFLNK or info.file_size <= 0 or info.file_size > MAX_MEMBER_BYTES:
                        raise RuntimeError("v540-member-safety")
                    total_uncompressed += info.file_size
                if total_uncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES or archive.testzip() is not None:
                    raise RuntimeError("v540-zip-integrity")
                extracted: dict[str, bytes] = {}
                for info in infos:
                    payload = archive.read(info.filename)
                    if len(payload) != info.file_size:
                        raise RuntimeError("v540-member-size")
                    target = temporary_path.joinpath(*PurePosixPath(info.filename).parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(payload)
                    extracted[info.filename] = payload

            manifest: dict[str, str] = {}
            for line in extracted["manifest-sha256.txt"].decode("ascii").splitlines():
                digest, name = line.split("  ", 1)
                if name in manifest or not safe_member_path(name) or len(digest) != 64:
                    raise RuntimeError("v540-manifest-shape")
                manifest[name] = digest
            if len(manifest) != 8 or any(name not in extracted or byte_sha(extracted[name]) != digest for name, digest in manifest.items()):
                raise RuntimeError("v540-manifest-replay")

            crate = json.loads(extracted["ro-crate-metadata.json"])
            graph = crate.get("@graph", [])
            graph_by_id = {entry.get("@id"): entry for entry in graph}
            root_entry = graph_by_id.get("./")
            metadata_entry = graph_by_id.get("ro-crate-metadata.json")
            has_parts = [entry.get("@id") for entry in root_entry.get("hasPart", [])] if root_entry else []
            if crate.get("@context") != "https://w3id.org/ro/crate/1.1/context" or len(graph_by_id) != len(graph) or metadata_entry is None or metadata_entry.get("about", {}).get("@id") != "./" or metadata_entry.get("conformsTo", {}).get("@id") != "https://w3id.org/ro/crate/1.1" or sorted(has_parts) != sorted(name for name in REQUIRED_MEMBERS if name != "ro-crate-metadata.json") or any(name not in graph_by_id for name in has_parts):
                raise RuntimeError("v540-metadata-graph")

            fits_path = temporary_path / "data/response-aware-sparse-table.fits"
            with fits.open(fits_path, checksum=True, memmap=False) as hdus:
                hdus.verify("exception")
                if len(hdus) != 2 or hdus[0].data is not None or hdus[0].header["NAXIS"] != 0 or not isinstance(hdus[1], fits.BinTableHDU) or len(hdus[1].data) != 4 or len(hdus[1].columns) != 17:
                    raise RuntimeError("v540-fits-layout")
                if any(hdu.verify_checksum() != 1 or hdu.verify_datasum() != 1 for hdu in hdus) or np.any(hdus[1].data["PHYS_UNC"]) or np.any(hdus[1].data["PIXEL"]):
                    raise RuntimeError("v540-fits-science-boundary")
                row_sha_values = [str(value).strip() for value in hdus[1].data["ROW_SHA"]]
                if len(set(row_sha_values)) != 4 or not all(len(value) == 64 for value in row_sha_values):
                    raise RuntimeError("v540-fits-row-sha")
                fits_summary = {"hduCount": 2, "primaryNaxis": 0, "binaryTableHduCount": 1, "imageHduCount": 0, "rowCount": 4, "columnCount": 17, "checksumCardCount": 4, "checksumReplayQualified": True, "physicalUncertaintyTrueCount": 0, "pixelTrueCount": 0, "rowShaReplayCount": 4}

            with (temporary_path / "data/column-schema.csv").open(encoding="utf-8", newline="") as handle:
                schema_rows = list(csv.DictReader(handle))
            if len(schema_rows) != 17 or [row["ordinal"] for row in schema_rows] != [str(index) for index in range(1, 18)] or any(row["qualified"] != "true" or len(row["column_sha256"]) != 64 for row in schema_rows):
                raise RuntimeError("v540-schema-replay")

            v537 = json.loads(extracted["metadata/v537-fits-atlas.json"])
            v538 = json.loads(extracted["metadata/v538-column-schema-atlas.json"])
            evidence = json.loads(extracted["metadata/v538-evidence.json"])
            pointer = json.loads(extracted["metadata/v538-pointer.json"])
            if canonical_sha(v537) != v537.get("artifactSha256") or canonical_sha(v538) != v538.get("artifactSha256") or canonical_sha(evidence) != evidence.get("evidenceSha256") or canonical_sha(pointer) != pointer.get("pointerSha256"):
                raise RuntimeError("v540-provenance-canonical")
            if v537["fits"]["fileSha256"] != byte_sha(extracted["data/response-aware-sparse-table.fits"]) or v538["source"]["v537ArtifactSha256"] != v537["artifactSha256"] or v538["source"]["v537FitsFileSha256"] != v537["fits"]["fileSha256"] or v538["export"]["csvFileSha256"] != byte_sha(extracted["data/column-schema.csv"]) or evidence["dependency"]["v538ArtifactSha256"] != v538["artifactSha256"] or pointer["evidence"]["canonicalSha256"] != evidence["evidenceSha256"] or pointer["evidence"]["fileSha256"] != byte_sha(extracted["metadata/v538-evidence.json"]):
                raise RuntimeError("v540-provenance-chain")
            if pointer["formalProductPointer"] != "v263" or pointer["capabilities"]["v314DenseCampaign"] != "incomplete-0-of-49":
                raise RuntimeError("v540-product-boundary")
            if "no FITS image HDU" not in extracted["README.md"].decode("utf-8") or "PHYS_UNC=false" not in extracted["README.md"].decode("utf-8"):
                raise RuntimeError("v540-readme-boundary")

            unsigned = {
                "version": "v540-kerr-response-aware-offline-replay-receipt-v1",
                "generatedAt": "2026-08-02T00:00:00Z",
                "status": "offline-clean-room-replay-qualified",
                "crate": {"fileSha256": byte_sha(crate_bytes), "bytes": len(crate_bytes), "memberCount": len(extracted), "totalUncompressedBytes": total_uncompressed},
                "sandbox": {"independentTemporaryDirectoryUsed": True, "temporaryDirectoryRemoved": True, "absolutePathStored": False, "pathTraversalRejected": True, "symlinkRejected": True, "duplicateMemberRejected": True, "maximumCrateBytes": MAX_CRATE_BYTES, "maximumMemberBytes": MAX_MEMBER_BYTES, "maximumTotalUncompressedBytes": MAX_TOTAL_UNCOMPRESSED_BYTES, "maximumMemberCount": MAX_MEMBER_COUNT, "networkGuardInstalled": True, "networkAttemptCount": network_attempt_count},
                "integrity": {"zipCrcQualified": True, "memberReadCount": 9, "manifestMemberCount": 8, "manifestReplayCount": 8, "metadataGraphQualified": True, "contentAddressedMemberCount": 8},
                "fits": fits_summary,
                "schema": {"rowCount": 17, "qualifiedRowCount": 17, "columnShaReplayCount": 17, "physicalUncertaintyValueCount": 0, "pixelSampleCount": 0},
                "provenance": {"v537ArtifactSha256": v537["artifactSha256"], "v538ArtifactSha256": v538["artifactSha256"], "v538EvidenceSha256": evidence["evidenceSha256"], "v538PointerSha256": pointer["pointerSha256"], "canonicalReplayCount": 4, "sourceLinkReplayCount": 6},
                "qualification": {"offlineReplayQualified": True, "safeExtractionQualified": True, "manifestReplayQualified": True, "fitsReplayQualified": True, "columnSchemaReplayQualified": True, "provenanceReplayQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False, "productionPromotionQualified": False},
                "boundary": {"replayDoesNotCreateNewMeasurement": True, "replayDoesNotCreatePixelSamples": True, "replayDoesNotUseNetwork": True, "measuredCalibrationFiles": 0, "requiredMeasuredCalibrationFiles": 6, "denseCampaignStatus": "incomplete-0-of-49", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
            }
    finally:
        socket.socket.connect = original_connect  # type: ignore[method-assign]
        socket.create_connection = original_create_connection  # type: ignore[assignment]
    if temporary_path is None or temporary_path.exists() or network_attempt_count != 0:
        raise RuntimeError("v540-sandbox-cleanup")
    return {**unsigned, "receiptSha256": canonical_sha(unsigned)}


def main() -> None:
    crate_bytes = V539_CRATE.read_bytes()
    receipt_a = replay_crate_bytes(crate_bytes)
    receipt_b = replay_crate_bytes(crate_bytes)
    if receipt_a != receipt_b or json.dumps(receipt_a, ensure_ascii=False, indent=2) != json.dumps(receipt_b, ensure_ascii=False, indent=2):
        raise RuntimeError("v540-replay-ab-nondeterministic")
    v539 = json.loads(V539_ATLAS.read_text(encoding="utf-8"))
    evidence = json.loads(V539_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(V539_POINTER.read_text(encoding="utf-8"))
    if canonical_sha(v539) != v539.get("artifactSha256") or v539["crate"]["fileSha256"] != receipt_a["crate"]["fileSha256"] or canonical_sha(evidence) != evidence.get("evidenceSha256") or canonical_sha(pointer) != pointer.get("pointerSha256"):
        raise RuntimeError("v540-upstream-link")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atomic_json(RECEIPT_PATH, receipt_a)
    source_paths = [V539_ATLAS, V539_CRATE, V539_EVIDENCE, V539_POINTER, ROOT / "scripts/build-kerr-response-aware-offline-replay-v540.py"]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda item: item["path"])
    unsigned = {
        "version": "v540-kerr-response-aware-offline-replay-artifact-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "offline-clean-room-replay-qualified-heavy-browser-pending",
        "source": {"v539ArtifactSha256": v539["artifactSha256"], "v539CrateFileSha256": v539["crate"]["fileSha256"], "v539EvidenceSha256": evidence["evidenceSha256"], "v539PointerSha256": pointer["pointerSha256"]},
        "receipt": receipt_a,
        "receiptExport": {"path": "dist/science/kerr-response-aware-offline-replay-v540/replay-receipt.json", "fileSha256": file_sha(RECEIPT_PATH), "canonicalSha256": receipt_a["receiptSha256"], "bytes": RECEIPT_PATH.stat().st_size, "abByteIdentical": True},
        "counts": {"replayAttemptCount": 2, "qualifiedReplayCount": 2, "networkAttemptCount": 0, "temporaryDirectoryLeakCount": 0, "manifestReplayCount": 8, "fitsRowReplayCount": 4, "columnSchemaReplayCount": 17, "provenanceCanonicalReplayCount": 4, "pixelSampleCount": 0, "fitsImageHduCount": 0, "physicalUncertaintyValueCount": 0},
        "qualification": {"cleanRoomReplayQualified": True, "deterministicReceiptQualified": True, "safeExtractionQualified": True, "networkIsolationQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False, "productionPromotionQualified": False},
        "boundary": {"replayInputIsOnlyV539Crate": True, "workspaceSourceFilesUsedDuringReplay": 0, "absolutePathStored": False, "networkAttempted": False, "sciencePayloadMutationAllowed": False, "cinematicScienceWritebackAllowed": False, "measuredCalibrationFiles": 0, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS_PATH, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "receiptSha256": receipt_a["receiptSha256"], "crateSha256": receipt_a["crate"]["fileSha256"], "replays": "2/2", "manifest": "8/8", "fitsRows": "4/4", "columns": "17/17", "networkAttempts": 0, "temporaryLeaks": 0}, indent=2))


if __name__ == "__main__":
    main()

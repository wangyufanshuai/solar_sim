from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import socket
import sys
import zlib
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

import astropy
import numpy as np
from astropy.io import fits

TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256"}
REQUIRED_CRATE_MEMBERS = ["README.md", "data/column-schema.csv", "data/response-aware-sparse-table.fits", "manifest-sha256.txt", "metadata/v537-fits-atlas.json", "metadata/v538-column-schema-atlas.json", "metadata/v538-evidence.json", "metadata/v538-pointer.json", "ro-crate-metadata.json"]


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()).hexdigest()


def byte_sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return byte_sha(path.read_bytes())


def safe_name(name: str) -> bool:
    path = PurePosixPath(name)
    return bool(name) and not path.is_absolute() and ".." not in path.parts and "\\" not in name and not name.startswith("/")


def read_manifest(value: bytes) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in value.decode("ascii").splitlines():
        digest, name = line.split("  ", 1)
        if name in result or not safe_name(name) or len(digest) != 64:
            raise RuntimeError("v541-manifest-shape")
        result[name] = digest
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--crate", required=True)
    parser.add_argument("--receipt", required=True)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--runtime-lock", required=True)
    parser.add_argument("--kit-manifest", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    paths = {key: Path(value) for key, value in vars(args).items() if key != "output"}
    if any(path.is_absolute() for path in paths.values()) or Path(args.output).is_absolute():
        raise RuntimeError("v541-relative-paths-required")

    network_attempt_count = 0
    original_connect = socket.socket.connect
    original_create_connection = socket.create_connection

    def blocked_connect(*_args: Any, **_kwargs: Any) -> Any:
        nonlocal network_attempt_count
        network_attempt_count += 1
        raise RuntimeError("v541-network-forbidden")

    socket.socket.connect = blocked_connect  # type: ignore[method-assign]
    socket.create_connection = blocked_connect  # type: ignore[assignment]
    try:
        environment = json.loads(paths["environment"].read_text(encoding="utf-8"))
        runtime_lock = paths["runtime_lock"].read_bytes()
        if canonical_sha(environment) != environment.get("environmentSha256") or environment.get("version") != "v541-replay-kit-environment-lock-v1" or environment.get("strictExactVersions") is not True:
            raise RuntimeError("v541-environment-manifest")
        runtime = environment["runtime"]
        actual_runtime = {"pythonImplementation": sys.implementation.name, "pythonVersion": ".".join(map(str, sys.version_info[:3])), "numpyVersion": np.__version__, "astropyVersion": astropy.__version__, "zlibVersion": zlib.ZLIB_VERSION}
        if runtime != actual_runtime or environment["validatorFileSha256"] != file_sha(Path(__file__)) or environment["runtimeLockFileSha256"] != byte_sha(runtime_lock):
            raise RuntimeError("v541-environment-mismatch")

        kit_manifest = read_manifest(paths["kit_manifest"].read_bytes())
        expected_kit_paths = {"README.md", "environment/environment.json", "environment/runtime-lock.txt", "payload/orbit-atlas-kerr-response-aware-v539.zip", "receipts/v540-replay-receipt.json", "validator/validate_replay_kit.py"}
        if set(kit_manifest) != expected_kit_paths or any(not Path(name).is_file() or file_sha(Path(name)) != digest for name, digest in kit_manifest.items()):
            raise RuntimeError("v541-kit-manifest-replay")

        receipt = json.loads(paths["receipt"].read_text(encoding="utf-8"))
        if canonical_sha(receipt) != receipt.get("receiptSha256") or receipt.get("status") != "offline-clean-room-replay-qualified":
            raise RuntimeError("v541-v540-receipt")
        crate_bytes = paths["crate"].read_bytes()
        if byte_sha(crate_bytes) != receipt["crate"]["fileSha256"]:
            raise RuntimeError("v541-crate-identity")
        with zipfile.ZipFile(paths["crate"], "r") as archive:
            names = archive.namelist()
            if names != sorted(REQUIRED_CRATE_MEMBERS) or archive.testzip() is not None:
                raise RuntimeError("v541-crate-layout")
            extracted = {name: archive.read(name) for name in names}
        crate_manifest = read_manifest(extracted["manifest-sha256.txt"])
        if len(crate_manifest) != 8 or any(name not in extracted or byte_sha(extracted[name]) != digest for name, digest in crate_manifest.items()):
            raise RuntimeError("v541-crate-manifest")
        crate_metadata = json.loads(extracted["ro-crate-metadata.json"])
        graph = {entry["@id"]: entry for entry in crate_metadata["@graph"]}
        if crate_metadata["@context"] != "https://w3id.org/ro/crate/1.1/context" or graph["ro-crate-metadata.json"]["about"]["@id"] != "./" or len(graph["./"]["hasPart"]) != 8:
            raise RuntimeError("v541-crate-metadata")
        with zipfile.ZipFile(paths["crate"], "r") as archive:
            with archive.open("data/response-aware-sparse-table.fits") as handle:
                fits_payload = handle.read()
        with fits.open(io_bytes := io.BytesIO(fits_payload), checksum=True, memmap=False) as hdus:
            hdus.verify("exception")
            if len(hdus) != 2 or hdus[0].data is not None or not isinstance(hdus[1], fits.BinTableHDU) or len(hdus[1].data) != 4 or len(hdus[1].columns) != 17 or any(hdu.verify_checksum() != 1 or hdu.verify_datasum() != 1 for hdu in hdus) or np.any(hdus[1].data["PHYS_UNC"]) or np.any(hdus[1].data["PIXEL"]):
                raise RuntimeError("v541-fits-replay")
        io_bytes.close()
        schema_rows = list(csv.DictReader(extracted["data/column-schema.csv"].decode("utf-8").splitlines()))
        if len(schema_rows) != 17 or any(row["qualified"] != "true" or len(row["column_sha256"]) != 64 for row in schema_rows):
            raise RuntimeError("v541-schema-replay")
        v537 = json.loads(extracted["metadata/v537-fits-atlas.json"])
        v538 = json.loads(extracted["metadata/v538-column-schema-atlas.json"])
        evidence = json.loads(extracted["metadata/v538-evidence.json"])
        pointer = json.loads(extracted["metadata/v538-pointer.json"])
        if canonical_sha(v537) != v537["artifactSha256"] or canonical_sha(v538) != v538["artifactSha256"] or canonical_sha(evidence) != evidence["evidenceSha256"] or canonical_sha(pointer) != pointer["pointerSha256"] or v538["source"]["v537ArtifactSha256"] != v537["artifactSha256"] or evidence["dependency"]["v538ArtifactSha256"] != v538["artifactSha256"] or pointer["evidence"]["canonicalSha256"] != evidence["evidenceSha256"]:
            raise RuntimeError("v541-provenance-replay")
        if pointer["formalProductPointer"] != "v263" or pointer["capabilities"]["v314DenseCampaign"] != "incomplete-0-of-49":
            raise RuntimeError("v541-boundary")
        unsigned = {
            "version": "v541-standalone-replay-kit-validation-result-v1",
            "generatedAt": "2026-08-02T00:00:00Z",
            "status": "standalone-replay-kit-qualified",
            "validatorFileSha256": file_sha(Path(__file__)),
            "environmentSha256": environment["environmentSha256"],
            "runtimeLockFileSha256": byte_sha(runtime_lock),
            "crateFileSha256": byte_sha(crate_bytes),
            "v540ReceiptSha256": receipt["receiptSha256"],
            "checks": {"exactEnvironmentQualified": True, "kitManifestReplayCount": 6, "crateManifestReplayCount": 8, "fitsRowReplayCount": 4, "fitsColumnReplayCount": 17, "columnSchemaReplayCount": 17, "provenanceCanonicalReplayCount": 4, "networkAttemptCount": network_attempt_count, "absolutePathStored": False},
            "qualification": {"standaloneValidatorQualified": True, "environmentLockQualified": True, "offlineReplayQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False, "productionPromotionQualified": False},
            "boundary": {"workspaceImportCount": 0, "networkAttempted": False, "pixelSampleCount": 0, "fitsImageHduCount": 0, "physicalUncertaintyValueCount": 0, "denseCampaignStatus": "incomplete-0-of-49", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn", "portabilityBeyondLockedEnvironmentQualified": False},
        }
    finally:
        socket.socket.connect = original_connect  # type: ignore[method-assign]
        socket.create_connection = original_create_connection  # type: ignore[assignment]
    if network_attempt_count != 0:
        raise RuntimeError("v541-network-attempt")
    result = {**unsigned, "resultSha256": canonical_sha(unsigned)}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import os
import zipfile
from pathlib import Path
from typing import Any

ROOT = Path.cwd()
OUT_DIR = ROOT / "dist/science/kerr-response-aware-portable-crate-v539"
ATLAS_PATH = OUT_DIR / "atlas.json"
CRATE_PATH = OUT_DIR / "orbit-atlas-kerr-response-aware-v539.zip"
V537_ATLAS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json"
V537_FITS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"
V538_ATLAS = ROOT / "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json"
V538_CSV = ROOT / "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv"
V538_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v538-evidence.json"
V538_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v538.json"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"}
FIXED_ZIP_TIME = (2026, 8, 2, 0, 0, 0)


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


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def zip_info(name: str) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(filename=name, date_time=FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_STORED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    return info


def write_zip(path: Path, members: dict[str, bytes]) -> None:
    if path.exists():
        path.unlink()
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED, allowZip64=False, strict_timestamps=True) as archive:
        for name in sorted(members):
            archive.writestr(zip_info(name), members[name])


def media_type(name: str) -> str:
    if name.endswith(".fits"):
        return "application/fits"
    if name.endswith(".csv"):
        return "text/csv"
    if name.endswith(".json"):
        return "application/json"
    if name.endswith(".txt") or name.endswith(".md"):
        return "text/plain"
    return "application/octet-stream"


def main() -> None:
    v537 = json.loads(V537_ATLAS.read_text(encoding="utf-8"))
    v538 = json.loads(V538_ATLAS.read_text(encoding="utf-8"))
    evidence = json.loads(V538_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(V538_POINTER.read_text(encoding="utf-8"))
    if canonical_sha(v537) != v537.get("artifactSha256") or canonical_sha(v538) != v538.get("artifactSha256"):
        raise RuntimeError("v539-science-upstream")
    if canonical_sha(evidence) != evidence.get("evidenceSha256") or canonical_sha(pointer) != pointer.get("pointerSha256"):
        raise RuntimeError("v539-evidence-upstream")
    if file_sha(V537_FITS) != v537["fits"]["fileSha256"] or file_sha(V538_CSV) != v538["export"]["csvFileSha256"]:
        raise RuntimeError("v539-export-upstream")
    if pointer["formalProductPointer"] != "v263" or pointer["capabilities"]["v314DenseCampaign"] != "incomplete-0-of-49":
        raise RuntimeError("v539-boundary-upstream")

    payload_members = {
        "README.md": ("# Orbit Atlas v539 portable sparse-science crate\n\nThis deterministic local-shadow package contains one four-row FITS binary table, its 17-column semantic schema, and immutable provenance. It contains no FITS image HDU, raster pixel, measured calibration, physical uncertainty interval, dense aggregate, or production promotion. `PHYS_UNC=false` means unavailable; `PIXEL=false` means no sample.\n").encode("utf-8"),
        "data/column-schema.csv": V538_CSV.read_bytes(),
        "data/response-aware-sparse-table.fits": V537_FITS.read_bytes(),
        "metadata/v537-fits-atlas.json": V537_ATLAS.read_bytes(),
        "metadata/v538-column-schema-atlas.json": V538_ATLAS.read_bytes(),
        "metadata/v538-evidence.json": V538_EVIDENCE.read_bytes(),
        "metadata/v538-pointer.json": V538_POINTER.read_bytes(),
    }
    graph_files = []
    for name in sorted(payload_members):
        graph_files.append({"@id": name, "@type": "File", "name": name.rsplit("/", 1)[-1], "encodingFormat": media_type(name), "contentSize": len(payload_members[name]), "identifier": f"urn:sha256:{byte_sha(payload_members[name])}"})
    crate = {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
            {"@id": "ro-crate-metadata.json", "@type": "CreativeWork", "about": {"@id": "./"}, "conformsTo": {"@id": "https://w3id.org/ro/crate/1.1"}},
            {"@id": "./", "@type": "Dataset", "name": "Orbit Atlas v539 response-aware sparse-science portable crate", "datePublished": "2026-08-02", "hasPart": [{"@id": name} for name in sorted([*payload_members, "manifest-sha256.txt"])], "isBasedOn": [{"@id": "metadata/v537-fits-atlas.json"}, {"@id": "metadata/v538-column-schema-atlas.json"}]},
            *graph_files,
            {"@id": "manifest-sha256.txt", "@type": "File", "name": "manifest-sha256.txt", "encodingFormat": "text/plain"},
        ],
    }
    crate_bytes = json_bytes(crate)
    manifest_inputs = {**payload_members, "ro-crate-metadata.json": crate_bytes}
    manifest_bytes = "".join(f"{byte_sha(value)}  {name}\n" for name, value in sorted(manifest_inputs.items())).encode("ascii")
    members = {**payload_members, "manifest-sha256.txt": manifest_bytes, "ro-crate-metadata.json": crate_bytes}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    candidate_a = OUT_DIR / "candidate-a.zip"
    candidate_b = OUT_DIR / "candidate-b.zip"
    write_zip(candidate_a, members)
    write_zip(candidate_b, members)
    if candidate_a.read_bytes() != candidate_b.read_bytes():
        raise RuntimeError("v539-zip-ab-nondeterministic")
    if CRATE_PATH.exists():
        CRATE_PATH.unlink()
    candidate_a.replace(CRATE_PATH)
    candidate_b.unlink()

    with zipfile.ZipFile(CRATE_PATH, "r") as archive:
        names = archive.namelist()
        if names != sorted(members) or len(names) != 9 or archive.testzip() is not None:
            raise RuntimeError("v539-zip-layout")
        for name, expected in members.items():
            info = archive.getinfo(name)
            if archive.read(name) != expected or info.date_time != FIXED_ZIP_TIME or info.compress_type != zipfile.ZIP_STORED or (info.external_attr >> 16) != 0o100644:
                raise RuntimeError(f"v539-member-{name}")
        replay_manifest = {}
        for line in archive.read("manifest-sha256.txt").decode("ascii").splitlines():
            digest, name = line.split("  ", 1)
            replay_manifest[name] = digest
        if replay_manifest != {name: byte_sha(value) for name, value in sorted(manifest_inputs.items())}:
            raise RuntimeError("v539-manifest-replay")
        replay_crate = json.loads(archive.read("ro-crate-metadata.json"))
        graph = replay_crate.get("@graph", [])
        graph_ids = [entry.get("@id") for entry in graph]
        root_entry = next((entry for entry in graph if entry.get("@id") == "./"), None)
        metadata_entry = next((entry for entry in graph if entry.get("@id") == "ro-crate-metadata.json"), None)
        has_parts = [entry.get("@id") for entry in root_entry.get("hasPart", [])] if root_entry else []
        if replay_crate.get("@context") != "https://w3id.org/ro/crate/1.1/context" or len(graph_ids) != len(set(graph_ids)) or metadata_entry is None or metadata_entry.get("about", {}).get("@id") != "./" or sorted(has_parts) != sorted([*payload_members, "manifest-sha256.txt"]) or any(name not in graph_ids for name in has_parts):
            raise RuntimeError("v539-ro-crate-self-audit")

    member_records = [{"path": name, "sha256": byte_sha(value), "bytes": len(value), "mediaType": media_type(name), "role": "descriptor" if name == "ro-crate-metadata.json" else "integrity-manifest" if name == "manifest-sha256.txt" else "readme" if name == "README.md" else "science-data" if name.startswith("data/") else "provenance"} for name, value in sorted(members.items())]
    source_paths = [V537_ATLAS, V537_FITS, V538_ATLAS, V538_CSV, V538_EVIDENCE, V538_POINTER, ROOT / "scripts/build-kerr-response-aware-portable-crate-v539.py"]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda item: item["path"])
    unsigned = {
        "version": "v539-kerr-response-aware-portable-crate-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "portable-content-addressed-sparse-science-crate-qualified",
        "source": {"v537ArtifactSha256": v537["artifactSha256"], "v537FitsFileSha256": v537["fits"]["fileSha256"], "v538ArtifactSha256": v538["artifactSha256"], "v538EvidenceSha256": evidence["evidenceSha256"], "v538PointerSha256": pointer["pointerSha256"]},
        "contract": {"deterministicZipRequired": True, "fixedMemberOrderRequired": True, "fixedTimestampRequired": True, "fixedPermissionsRequired": True, "storedCompressionRequired": True, "memberSha256Required": True, "manifestReplayRequired": True, "roCrateMetadataSelfAuditRequired": True, "absolutePathsForbidden": True, "networkDependencyForbidden": True},
        "crate": {"path": "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip", "fileSha256": file_sha(CRATE_PATH), "bytes": CRATE_PATH.stat().st_size, "memberCount": 9, "manifestCoveredMemberCount": 8, "totalUncompressedBytes": sum(len(value) for value in members.values()), "compression": "stored", "fixedTimestamp": "2026-08-02T00:00:00", "fixedMode": "100644", "abByteIdentical": True, "zipCrcReplayQualified": True, "manifestReplayQualified": True, "roCrateContext": "https://w3id.org/ro/crate/1.1/context", "roCrateSelfAuditQualified": True},
        "members": member_records,
        "counts": {"scienceDataMemberCount": 2, "provenanceMemberCount": 4, "descriptorMemberCount": 1, "readmeMemberCount": 1, "integrityManifestMemberCount": 1, "fitsBinaryTableCount": 1, "fitsImageHduCount": 0, "pixelSampleCount": 0, "rasterPixelCount": 0, "physicalUncertaintyValueCount": 0, "pngImageCount": 0},
        "qualification": {"portableCrateQualified": True, "deterministicReplayQualified": True, "memberIntegrityQualified": True, "offlineReplayQualified": True, "metadataGraphSelfAuditQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False, "productionPackageQualified": False},
        "boundary": {"crateIsLocalShadowResearchArtifact": True, "crateIsNotProductionPackage": True, "crateDoesNotCreateNewMeasurement": True, "crateDoesNotCreatePixelSamples": True, "measuredCalibrationFiles": 0, "requiredMeasuredCalibrationFiles": 6, "sciencePayloadMutationAllowed": False, "cinematicScienceWritebackAllowed": False, "networkAttempted": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS_PATH, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "crateSha256": artifact["crate"]["fileSha256"], "crateBytes": artifact["crate"]["bytes"], "members": 9, "manifestCovered": 8, "imageHdus": 0, "pixelSamples": 0}, indent=2))


if __name__ == "__main__":
    main()

"""Merge and audit the explicit v568 + v577 IXPE acquisitions.

Only transport integrity and FITS headers are read.  Detector event rows remain
untouched, and measured authority stays fail-closed until responses,
background, license scope, response replay, and an independent reviewer exist.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
V570_SOURCE = ROOT / "scripts/build-ixpe-measured-admission-v570.py"
FULL_MANIFEST = ROOT / "scripts/ixpe-acquisition-manifest-v568.json"
CONTINUATION_MANIFEST = ROOT / "scripts/ixpe-acquisition-manifest-v577.json"
PRIMARY_ROOT = ROOT / "dist/science/ixpe-public-acquisition-v568"
CONTINUATION_ROOT = ROOT / "dist/science/ixpe-public-acquisition-v577"
PRIMARY_RECEIPT = PRIMARY_ROOT / "acquisition-receipt.json"
CONTINUATION_RECEIPT = CONTINUATION_ROOT / "acquisition-receipt.json"
OUT = ROOT / "dist/science/ixpe-measured-admission-v581"
ADMISSION = OUT / "admission.json"
ALLOWED_HOST = "heasarc.gsfc.nasa.gov"


def load_v570():
    spec = importlib.util.spec_from_file_location("orbit_atlas_ixpe_v570_for_v581", V570_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v570 admission implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V570 = load_v570()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_file(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or os.path.isabs(relative) or ".." in Path(relative).parts:
        raise RuntimeError("path-traversal")
    resolved_root = root.resolve()
    candidate = (resolved_root / relative).resolve()
    if resolved_root not in candidate.parents:
        raise RuntimeError("path-traversal")
    return candidate


def receipt_rows(receipt: dict[str, Any]) -> list[dict[str, Any]]:
    if receipt.get("status") == "download-complete-explicit-single-attempt":
        rows = receipt.get("files", [])
    elif receipt.get("status") == "blocked-explicit-single-attempt":
        rows = receipt.get("completedFiles", [])
    else:
        rows = []
    return [row for row in rows if isinstance(row, dict)]


def build() -> dict[str, Any]:
    full = json.loads(FULL_MANIFEST.read_text(encoding="utf-8"))
    continuation = json.loads(CONTINUATION_MANIFEST.read_text(encoding="utf-8"))
    primary_receipt = json.loads(PRIMARY_RECEIPT.read_text(encoding="utf-8"))
    continuation_receipt = json.loads(CONTINUATION_RECEIPT.read_text(encoding="utf-8"))
    if full.get("target") != "Cyg X-1" or continuation.get("target") != "Cyg X-1":
        raise RuntimeError("target-identity-changed")
    if continuation_receipt.get("status") != "download-complete-explicit-single-attempt":
        raise RuntimeError("v577-continuation-not-complete")

    primary_rows = {row.get("fileName"): (row, PRIMARY_ROOT) for row in receipt_rows(primary_receipt)}
    continuation_rows = {row.get("fileName"): (row, CONTINUATION_ROOT) for row in receipt_rows(continuation_receipt)}
    overlap = set(primary_rows) & set(continuation_rows)
    if overlap:
        raise RuntimeError(f"duplicate-acquisition-file:{sorted(overlap)}")
    combined = {**primary_rows, **continuation_rows}
    expected_names = {entry["fileName"] for entry in full["urls"]}
    continuation_names = {entry["fileName"] for entry in continuation["urls"]}
    if set(combined) != expected_names or continuation_names != expected_names - set(primary_rows):
        raise RuntimeError("combined-acquisition-identity-or-continuation-boundary")

    files: list[dict[str, Any]] = []
    header_audits: list[dict[str, Any]] = []
    blockers: list[str] = []
    for entry in full["urls"]:
        relative = entry["fileName"]
        row, acquisition_root = combined[relative]
        path = safe_file(acquisition_root, relative)
        reasons: list[str] = []
        if not path.is_file():
            reasons.append("required-file-missing")
        else:
            actual_sha = file_sha(path)
            actual_bytes = path.stat().st_size
            if row.get("sha256") != actual_sha:
                reasons.append("sha-mismatch")
            if row.get("bytes") != actual_bytes:
                reasons.append("byte-count-mismatch")
            if entry.get("expectedBytes") is not None and int(entry["expectedBytes"]) != actual_bytes:
                reasons.append("manifest-byte-count-mismatch")
            if row.get("role") != entry.get("role") or row.get("observationId") != entry.get("observationId") or row.get("detector") != entry.get("detector"):
                reasons.append("role-observation-detector-identity")
            if row.get("finalHost") != ALLOWED_HOST or urlparse(str(row.get("finalUrl", ""))).hostname != ALLOWED_HOST:
                reasons.append("final-host-mismatch")
            if row.get("httpStatus") != 200:
                reasons.append("http-status-not-200")
            if relative.endswith((".fits", ".fits.gz")) and entry["role"] != "calibration-index":
                header_audits.append(V570.audit_fits_metadata(path, entry["observationId"], entry["detector"], entry["role"]))
        files.append({
            "fileName": relative,
            "path": path.relative_to(ROOT).as_posix(),
            "acquisitionNamespace": acquisition_root.name,
            "role": entry["role"],
            "observationId": entry["observationId"],
            "detector": entry["detector"],
            "status": "qualified" if not reasons else "blocked",
            "reasons": reasons,
            "bytes": path.stat().st_size if path.is_file() else 0,
            "sha256": file_sha(path) if path.is_file() else None,
        })

    if any(row["status"] != "qualified" for row in files):
        blockers.append("acquired-file-integrity-or-identity")
    if any(not audit["qualified"] for audit in header_audits):
        blockers.append("fits-metadata-identity-or-unit")
    primary_detectors = {row["detector"] for row in files if row["role"] == "science-event-list" and row["status"] == "qualified"}
    holdout_detectors = {row["detector"] for row in files if row["role"] == "holdout-event-list" and row["status"] == "qualified"}
    if primary_detectors != {"DU1", "DU2", "DU3"}:
        blockers.append("primary-detector-pack-incomplete")
    if holdout_detectors != {"DU1", "DU2", "DU3"}:
        blockers.append("independent-holdout-pack-incomplete")
    blockers.extend([
        "arf-pack-not-acquired",
        "rmf-pack-not-acquired",
        "polarization-response-pack-not-acquired",
        "observed-background-product-not-acquired",
        "response-application-not-replayed",
        "license-snapshot-not-sealed",
        "independent-reviewer-attestation-missing",
    ])
    mutations = V570.mutation_audit()
    if not mutations["allRejected"]:
        blockers.append("mutation-audit-failed")
    blockers = sorted(set(blockers))
    package_integrity = not any(blocker in blockers for blocker in (
        "acquired-file-integrity-or-identity",
        "fits-metadata-identity-or-unit",
        "primary-detector-pack-incomplete",
        "independent-holdout-pack-incomplete",
    ))
    unsigned = {
        "version": "v581-ixpe-cyg-x1-measured-admission-v1",
        "status": "blocked-measured-authority" if blockers else "measured-authority-qualified",
        "target": "Cyg X-1",
        "instrumentId": "IXPE",
        "primaryObservationId": "01002901",
        "holdoutObservationId": "01250101",
        "acquisitions": [
            {"namespace": "v568", "status": primary_receipt.get("status"), "receiptSha256": file_sha(PRIMARY_RECEIPT), "automaticRetry": False},
            {"namespace": "v577", "status": continuation_receipt.get("status"), "receiptSha256": file_sha(CONTINUATION_RECEIPT), "automaticRetry": False},
        ],
        "manifests": [
            {"path": FULL_MANIFEST.relative_to(ROOT).as_posix(), "sha256": file_sha(FULL_MANIFEST)},
            {"path": CONTINUATION_MANIFEST.relative_to(ROOT).as_posix(), "sha256": file_sha(CONTINUATION_MANIFEST)},
        ],
        "files": files,
        "fitsMetadataAudits": header_audits,
        "mutationAudit": mutations,
        "blockers": blockers,
        "qualification": {
            "candidatePackageIntegrityQualified": package_integrity,
            "primaryDetectorPackQualified": primary_detectors == {"DU1", "DU2", "DU3"},
            "independentHoldoutPackQualified": holdout_detectors == {"DU1", "DU2", "DU3"},
            "responsePackQualified": False,
            "measuredAuthorityGranted": not blockers,
            "sciencePayloadWritebackAllowed": False,
        },
        "boundary": {
            "detectorRowsRead": False,
            "syntheticValuesWritten": False,
            "expectedCountsWritten": False,
            "automaticRetry": False,
            "automaticTargetReplacement": False,
            "formalProductPointer": "v263",
        },
    }
    admission = {**unsigned, "artifactSha256": V570.value_sha(unsigned)}
    V570.atomic_json(ADMISSION, admission)
    return admission


def main() -> None:
    parser = argparse.ArgumentParser(description="Build IXPE v581 merged measured-admission receipt")
    parser.parse_args()
    result = build()
    print(json.dumps({
        "status": result["status"],
        "fileCount": len(result["files"]),
        "headerAuditCount": len(result["fitsMetadataAudits"]),
        "blockers": result["blockers"],
        "qualification": result["qualification"],
        "artifactSha256": result["artifactSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()

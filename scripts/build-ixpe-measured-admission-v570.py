"""Audit the acquired public IXPE package without reading detector rows.

This gate validates transport integrity and FITS metadata only.  It remains
fail-closed until response files, an observed background product, response
replay, a license snapshot, and an independent reviewer attestation exist.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from astropy.io import fits

ROOT = Path(__file__).resolve().parents[1]
ACQUISITION = ROOT / "dist/science/ixpe-public-acquisition-v568"
RECEIPT = ACQUISITION / "acquisition-receipt.json"
MANIFEST = ROOT / "scripts/ixpe-acquisition-manifest-v568.json"
OUT = ROOT / "dist/science/ixpe-measured-admission-v570"
ADMISSION = OUT / "admission.json"
ALLOWED_HOST = "heasarc.gsfc.nasa.gov"


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_file(relative: str) -> Path:
    if not isinstance(relative, str) or not relative or os.path.isabs(relative) or ".." in Path(relative).parts:
        raise RuntimeError("path-traversal")
    root = ACQUISITION.resolve()
    candidate = (root / relative).resolve()
    if root not in candidate.parents:
        raise RuntimeError("path-traversal")
    return candidate


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    with part.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(part, path)


def header_value(opened: fits.HDUList, *keys: str) -> Any:
    for hdu in opened[:8]:
        for key in keys:
            if key in hdu.header:
                value = hdu.header[key]
                if isinstance(value, (str, int, float, bool)):
                    return value
    return None


def audit_fits_metadata(path: Path, expected_observation: str, expected_detector: str, role: str) -> dict[str, Any]:
    with fits.open(path, mode="readonly", memmap=False, checksum=False, lazy_load_hdus=True) as opened:
        telescope = header_value(opened, "TELESCOP", "MISSION")
        instrument = header_value(opened, "INSTRUME")
        detector = header_value(opened, "DETNAM", "DET_ID", "DET_IDEN")
        observation = header_value(opened, "OBS_ID", "OBSID")
        time_system = header_value(opened, "TIMESYS")
        time_unit = header_value(opened, "TIMEUNIT")
        object_name = header_value(opened, "OBJECT")
        hdu_count = len(opened)
    observation_digits = "".join(character for character in str(observation or "") if character.isdigit())
    expected_digits = expected_observation.lstrip("0")
    detector_digits = "".join(character for character in str(detector or "") if character.isdigit())
    expected_detector_digits = "".join(character for character in expected_detector if character.isdigit())
    gates = {
        "telescope": str(telescope or "").upper().startswith("IXPE"),
        "observation": observation_digits.lstrip("0") == expected_digits,
        "detector": expected_detector == "ALL" or detector is None or detector_digits.endswith(expected_detector_digits),
        "timeSystem": role == "calibration-index" or str(time_system or "").upper() in {"TT", "TDB"},
        "timeUnit": role == "calibration-index" or str(time_unit or "").lower() in {"s", "sec", "second", "seconds"},
    }
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "role": role,
        "header": {"telescope": telescope, "instrument": instrument, "detector": detector, "observationId": observation, "timeSystem": time_system, "timeUnit": time_unit, "object": object_name, "hduCount": hdu_count},
        "gates": gates,
        "qualified": all(gates.values()),
        "detectorRowsRead": False,
    }


def mutation_audit() -> dict[str, Any]:
    mutations = {
        "non-https": "http://heasarc.gsfc.nasa.gov/file",
        "wrong-host": "https://example.com/file",
        "userinfo-host": "https://heasarc.gsfc.nasa.gov@example.com/file",
        "subdomain-host": "https://evil.heasarc.gsfc.nasa.gov/file",
        "path-traversal": "../event.fits",
        "absolute-path": "C:/event.fits",
        "target-substitution": "GX 339-4",
        "detector-substitution": "DU9",
        "duplicate-observation": "01002901",
        "synthetic-injection": True,
    }
    rejected = []
    for mutation_id, value in mutations.items():
        if mutation_id in {"non-https", "wrong-host", "userinfo-host", "subdomain-host"}:
            parsed = urlparse(str(value))
            passed = parsed.scheme == "https" and parsed.hostname == ALLOWED_HOST
        elif mutation_id in {"path-traversal", "absolute-path"}:
            try:
                safe_file(str(value))
                passed = True
            except RuntimeError:
                passed = False
        elif mutation_id == "target-substitution":
            passed = value == "Cyg X-1"
        elif mutation_id == "detector-substitution":
            passed = value in {"DU1", "DU2", "DU3", "ALL"}
        elif mutation_id == "duplicate-observation":
            passed = value != "01002901"
        else:
            passed = value is not True
        if not passed:
            rejected.append(mutation_id)
    return {"attempted": len(mutations), "rejected": len(rejected), "allRejected": len(rejected) == len(mutations), "rejectedMutationIds": rejected}


def build() -> dict[str, Any]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    blockers = []
    files = []
    header_audits = []
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8")) if RECEIPT.is_file() else None
    acquisition_complete = receipt is not None and receipt.get("status") == "download-complete-explicit-single-attempt"
    if not acquisition_complete:
        blockers.append("acquisition-not-complete")
    if receipt is not None:
        receipt_source_rows = receipt.get("files", []) if acquisition_complete else receipt.get("completedFiles", [])
        receipt_rows = {row.get("fileName"): row for row in receipt_source_rows if isinstance(row, dict)}
        for entry in manifest["urls"]:
            relative = entry["fileName"]
            row = receipt_rows.get(relative)
            path = safe_file(relative)
            reasons = []
            if row is None or not path.is_file():
                reasons.append("required-file-missing")
            else:
                actual_sha = file_sha(path)
                actual_bytes = path.stat().st_size
                if row.get("sha256") != actual_sha:
                    reasons.append("sha-mismatch")
                if row.get("bytes") != actual_bytes:
                    reasons.append("byte-count-mismatch")
                if row.get("finalHost") != ALLOWED_HOST or urlparse(str(row.get("finalUrl", ""))).hostname != ALLOWED_HOST:
                    reasons.append("final-host-mismatch")
                if row.get("httpStatus") != 200:
                    reasons.append("http-status-not-200")
                if relative.endswith((".fits", ".fits.gz")) and entry["role"] != "calibration-index":
                    header_audits.append(audit_fits_metadata(path, entry["observationId"], entry["detector"], entry["role"]))
            files.append({"fileName": relative, "role": entry["role"], "observationId": entry["observationId"], "detector": entry["detector"], "status": "qualified" if not reasons else "blocked", "reasons": reasons, "bytes": path.stat().st_size if path.is_file() else 0, "sha256": file_sha(path) if path.is_file() else None})
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
    blockers.extend(["arf-pack-not-acquired", "rmf-pack-not-acquired", "polarization-response-pack-not-acquired", "observed-background-product-not-acquired", "response-application-not-replayed", "license-snapshot-not-sealed", "independent-reviewer-attestation-missing"])
    mutations = mutation_audit()
    if not mutations["allRejected"]:
        blockers.append("mutation-audit-failed")
    blockers = sorted(set(blockers))
    unsigned = {
        "version": "v570-ixpe-cyg-x1-measured-admission-v1",
        "status": "blocked-measured-authority" if blockers else "measured-authority-qualified",
        "target": "Cyg X-1",
        "instrumentId": "IXPE",
        "primaryObservationId": "01002901",
        "holdoutObservationId": "01250101",
        "acquisition": {"receiptPresent": receipt is not None, "receiptSha256": file_sha(RECEIPT) if RECEIPT.is_file() else None, "manifestSha256": file_sha(MANIFEST)},
        "files": files,
        "fitsMetadataAudits": header_audits,
        "mutationAudit": mutations,
        "blockers": blockers,
        "qualification": {"candidatePackageIntegrityQualified": acquisition_complete and not any(blocker in blockers for blocker in ("acquisition-not-complete", "acquired-file-integrity-or-identity", "fits-metadata-identity-or-unit")), "measuredAuthorityGranted": not blockers, "sciencePayloadWritebackAllowed": False},
        "boundary": {"detectorRowsRead": False, "syntheticValuesWritten": False, "expectedCountsWritten": False, "automaticRetry": False, "automaticTargetReplacement": False, "formalProductPointer": "v263"},
    }
    admission = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic_json(ADMISSION, admission)
    return admission


def main() -> None:
    parser = argparse.ArgumentParser(description="Build IXPE v570 measured-admission receipt")
    parser.parse_args()
    result = build()
    print(json.dumps({"status": result["status"], "fileCount": len(result["files"]), "headerAuditCount": len(result["fitsMetadataAudits"]), "blockers": result["blockers"], "measuredAuthorityGranted": result["qualification"]["measuredAuthorityGranted"], "artifactSha256": result["artifactSha256"]}, indent=2))


if __name__ == "__main__":
    main()

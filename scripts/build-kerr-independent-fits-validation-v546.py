from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import astropy
import numpy as np
from astropy.io import fits


ROOT = Path.cwd()
V545_ARTIFACT = ROOT / "dist/science/kerr-supplemental-calibration-intake-v545/atlas.json"
V545_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v545-evidence.json"
V545_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v545.json"
DENSE = ROOT / "dist/science/kerr-campaign-v314/campaign-state.json"
FORMAL = ROOT / "dist/release/orbit-atlas-current-product-evidence-v263.json"
VALIDATOR = ROOT / "scripts/orbit_atlas_v546_independent_fits_validator.py"
BUILDER = ROOT / "scripts/build-kerr-independent-fits-validation-v546.py"
OUT = ROOT / "dist/science/kerr-supplemental-fits-validation-v546"
ATLAS = OUT / "atlas.json"
RECEIPT = OUT / "synthetic-validation-receipt.json"
PORTABLE_VALIDATOR = OUT / "orbit-atlas-v546-independent-fits-validator.py"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256", "preflightSha256", "matrixSha256", "isolatedReceiptSha256", "executionMatrixSha256", "schemaPackSha256"}
EXPECTED_SYNTHETIC_FRAME_SHA256 = "818fbf55cd636e24ddcb1a2512a9f2d61ae91bc296f65a2c43200376a3f18534"


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(path)


def atomic_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    shutil.copyfile(source, part)
    part.replace(target)


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")


def create_candidate(root: Path, mutation: str | None = None) -> Path:
    candidate = root / "candidate"
    candidate.mkdir()
    identity = {"contentClass": "synthetic-validation-fixture", "instrumentId": "fixture-instrument", "detectorId": "fixture-detector", "campaignId": "fixture-campaign"}
    area = {"version": "v545-collecting-area-v1", **identity, "collectingAreaM2": 1.0, "standardUncertaintyM2": 0.01, "traceableSourceUrl": "https://example.invalid/area", "rawArtifactSha256": "a" * 64}
    start = 2460000.0
    exposure = {"version": "v545-exposure-record-v1", **identity, "observationId": "fixture-observation", "bandId": "visible", "tdbStartJd": start, "tdbEndJd": start + 10 / 86400, "exposureS": 10.0, "observationGeometrySha256": "b" * 64}
    if mutation == "content-class-mismatch":
        area["contentClass"] = "measured-science-candidate"
    write_json(candidate / "collecting-area.json", area)
    write_json(candidate / "exposure-record.json", exposure)
    header = ["bandId", "wavelengthM", "throughput", "standardUncertainty", "repeatIndex", "instrumentId", "detectorId", "campaignId", "rawArtifactSha256"]
    rows: list[list[Any]] = []
    for band_index, band in enumerate(["visible", "euv", "soft-x-ray"], 1):
        for node in range(1, 10):
            for repeat in range(1, 4):
                rows.append([band, band_index * 1e-9 * node, 0.4 + node * 0.01, 0.002, repeat, identity["instrumentId"], identity["detectorId"], identity["campaignId"], "c" * 64])
    if mutation == "spectral-row-count":
        rows.pop()
    with (candidate / "spectral-response.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)
    data = np.arange(16, dtype=np.int16).reshape(4, 4)
    hdu = fits.PrimaryHDU(data=data)
    hdu.header["BUNIT"] = "electron" if mutation == "fits-bunit" else "adu"
    hdu.header["TIMESYS"] = "TDB"
    hdu.header["INSTRUME"] = identity["instrumentId"]
    hdu.header["DETECTOR"] = "other-detector" if mutation == "fits-identity" else identity["detectorId"]
    hdu.header["CAMPAIGN"] = identity["campaignId"]
    hdu.header["CONTENT"] = identity["contentClass"]
    hdu.header["OBS_ID"] = exposure["observationId"]
    hdu.header["BANDID"] = exposure["bandId"]
    hdu.header["TSTART"] = exposure["tdbStartJd"]
    hdu.header["TSTOP"] = exposure["tdbEndJd"]
    hdu.header["EXPTIME"] = 12.0 if mutation == "fits-exposure" else exposure["exposureS"]
    frame = candidate / "observed-frame.fits"
    # Astropy's ``checksum=True`` stamps the current UTC time into CHECKSUM and
    # DATASUM comments.  Pin the comment timestamp before writing so two blind
    # validator runs made in different wall-clock seconds receive identical
    # candidate bytes and therefore identical provenance and receipt hashes.
    hdu.add_checksum(when="2026-08-02T00:00:00")
    hdu.writeto(frame, checksum=False, overwrite=False)
    provenance = {"version": "v545-supplemental-provenance-v1", **identity, "usageScope": "local-shadow-research-only", "operatorAttestation": "synthetic fixture only; never measured authority", "sources": [{"id": item, "url": f"https://example.invalid/{item}", "licenseOrTerms": "synthetic-test-fixture", "sourceSha256": "d" * 64} for item in ["collectingArea", "exposureRecord", "spectralResponse", "observedFrame"]], "fileSha256": {"collectingArea": file_sha(candidate / "collecting-area.json"), "exposureRecord": file_sha(candidate / "exposure-record.json"), "spectralResponse": file_sha(candidate / "spectral-response.csv"), "observedFrame": file_sha(frame)}, "observedFrameMetadata": {"widthPixels": 5 if mutation == "frame-metadata" else 4, "heightPixels": 4, "bitpix": 16, "bunit": "adu", "bandId": "visible"}}
    if mutation == "provenance-sha":
        provenance["fileSha256"]["observedFrame"] = "0" * 64
    write_json(candidate / "provenance.json", provenance)
    if mutation == "fits-checksum":
        payload = bytearray(frame.read_bytes())
        payload[-1] ^= 1
        frame.write_bytes(payload)
    return candidate


def run_validator(mutation: str | None = None) -> tuple[subprocess.CompletedProcess[str], dict[str, Any] | None, bool]:
    temporary_path: Path | None = None
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v546-") as temporary:
        temporary_path = Path(temporary)
        candidate = create_candidate(temporary_path, mutation)
        shutil.copyfile(VALIDATOR, temporary_path / "validator.py")
        environment = os.environ.copy()
        for key in ["PYTHONPATH", "PYTHONHOME", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]:
            environment.pop(key, None)
        environment.update({"PYTHONHASHSEED": "0", "PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONIOENCODING": "utf-8"})
        command = [sys.executable, "validator.py", "--candidate", candidate.name, "--output", "receipt.json"]
        completed = subprocess.run(command, cwd=temporary_path, env=environment, capture_output=True, text=True, timeout=30, check=False)
        result_path = temporary_path / "receipt.json"
        result = json.loads(result_path.read_text(encoding="utf-8")) if result_path.is_file() else None
    return completed, result, temporary_path is not None and not temporary_path.exists()


def main() -> None:
    v545 = json.loads(V545_ARTIFACT.read_text(encoding="utf-8"))
    evidence = json.loads(V545_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(V545_POINTER.read_text(encoding="utf-8"))
    dense = json.loads(DENSE.read_text(encoding="utf-8"))
    formal = json.loads(FORMAL.read_text(encoding="utf-8"))
    formal_evidence = json.loads((ROOT / formal["source"]).read_text(encoding="utf-8"))
    if canonical_sha(v545) != v545.get("artifactSha256") or canonical_sha(evidence) != evidence.get("evidenceSha256") or canonical_sha(pointer) != pointer.get("pointerSha256") or v545.get("version") != "v545-kerr-supplemental-calibration-intake-artifact-v1":
        raise RuntimeError("v546-v545-authority")
    if dense.get("status") != "incomplete-0-of-49" or dense.get("completedShardCount") != 0 or dense.get("attemptConsumed") is not False or dense.get("aggregateAvailable") is not False or formal.get("version") != "v263-current-product-evidence-pointer" or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn" or formal_evidence.get("contracts", {}).get("singleCanvas") is not True:
        raise RuntimeError("v546-frozen-boundary")
    completed_a, result_a, cleanup_a = run_validator()
    completed_b, result_b, cleanup_b = run_validator()
    if completed_a.returncode != 0 or completed_b.returncode != 0 or completed_a.stdout or completed_a.stderr or completed_b.stdout or completed_b.stderr or result_a is None or result_b is None or result_a != result_b or not cleanup_a or not cleanup_b:
        diagnostic = {
            "aReturnCode": completed_a.returncode,
            "bReturnCode": completed_b.returncode,
            "aStdout": completed_a.stdout[-500:],
            "aStderr": completed_a.stderr[-500:],
            "bStdout": completed_b.stdout[-500:],
            "bStderr": completed_b.stderr[-500:],
            "aCanonicalSha256": canonical_sha(result_a) if result_a is not None else None,
            "bCanonicalSha256": canonical_sha(result_b) if result_b is not None else None,
            "aCleanupQualified": cleanup_a,
            "bCleanupQualified": cleanup_b,
        }
        raise RuntimeError(f"v546-validator-ab:{json.dumps(diagnostic, sort_keys=True)}")
    if canonical_sha(result_a) != result_a.get("resultSha256") or result_a.get("status") != "synthetic-fixture-semantically-qualified-nonauthoritative" or result_a.get("candidate", {}).get("fileSha256", {}).get("observedFrame") != EXPECTED_SYNTHETIC_FRAME_SHA256 or result_a.get("qualification", {}).get("syntheticAuthorityGranted") is not False or result_a.get("qualification", {}).get("scienceRasterQualified") is not False:
        raise RuntimeError("v546-validator-result")
    mutations = ["fits-checksum", "fits-identity", "fits-bunit", "fits-exposure", "frame-metadata", "provenance-sha", "spectral-row-count", "content-class-mismatch"]
    rejected: list[str] = []
    for mutation in mutations:
        completed, result, cleanup = run_validator(mutation)
        if completed.returncode == 0 or result is not None or not cleanup:
            raise RuntimeError(f"v546-mutation-not-rejected:{mutation}")
        rejected.append(mutation)
    OUT.mkdir(parents=True, exist_ok=True)
    atomic_json(RECEIPT, result_a)
    atomic_copy(VALIDATOR, PORTABLE_VALIDATOR)
    source_paths = [V545_ARTIFACT, V545_EVIDENCE, V545_POINTER, DENSE, FORMAL, VALIDATOR, BUILDER]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda entry: entry["path"])
    unsigned = {"version": "v546-kerr-independent-fits-validation-artifact-v1", "generatedAt": "2026-08-02T00:00:00Z", "status": "independent-fits-semantic-validator-qualified-synthetic-nonauthoritative-measured-inputs-missing", "source": {"v545ArtifactSha256": v545["artifactSha256"], "v545EvidenceSha256": evidence["evidenceSha256"], "v545PointerSha256": pointer["pointerSha256"], "v314StateSha256": dense["stateSha256"], "validatorFileSha256": file_sha(VALIDATOR)}, "environment": {"pythonImplementation": sys.implementation.name, "pythonVersion": ".".join(map(str, sys.version_info[:3])), "numpyVersion": np.__version__, "astropyVersion": astropy.__version__}, "validation": {"receipt": result_a, "receiptPath": "dist/science/kerr-supplemental-fits-validation-v546/synthetic-validation-receipt.json", "receiptFileSha256": file_sha(RECEIPT), "receiptCanonicalSha256": result_a["resultSha256"], "independentSubprocessAttemptCount": 2, "qualifiedSubprocessCount": 2, "abCanonicalIdentical": True, "temporaryDirectoryLeakCount": 0, "workspaceImportCount": 0, "networkAttemptCount": 0}, "mutationAudit": {"mutationCount": len(mutations), "rejectedMutationCount": len(rejected), "mutations": rejected}, "counts": {"publishedCandidateFileCount": 0, "publishedFitsFileCount": 0, "publishedPixelValueCount": 0, "measuredCandidateCount": 0, "syntheticControlCount": 1, "independentValidationReceiptCount": 1}, "qualification": {"independentFitsSemanticValidatorQualified": True, "syntheticControlQualified": True, "syntheticAuthorityGranted": False, "measuredCandidateSemanticallyQualified": False, "measuredAuthorityGranted": False, "scienceRasterQualified": False, "productionPromotionQualified": False}, "boundary": {"syntheticCandidatePersisted": False, "pixelValuesStoredInArtifact": False, "fitsFilePublished": False, "measuredValuesInvented": False, "sciencePayloadMutationAllowed": False, "cinematicScienceWritebackAllowed": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"}, "sourceManifest": source_manifest, "sourceSha256": canonical_sha(source_manifest)}
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "receiptSha256": result_a["resultSha256"], "validatorFileSha256": file_sha(VALIDATOR), "independentSubprocesses": "2/2", "mutationsRejected": f"{len(rejected)}/{len(mutations)}", "publishedFits": 0, "publishedPixels": 0, "measuredAuthorityGranted": False}, indent=2))


if __name__ == "__main__":
    main()

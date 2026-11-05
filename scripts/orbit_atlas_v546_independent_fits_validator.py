from __future__ import annotations

import argparse
import csv
import hashlib
import json
import socket
import stat
import sys
from pathlib import Path
from typing import Any

import astropy
import numpy as np
from astropy.io import fits


FILES = {"collecting-area.json", "exposure-record.json", "spectral-response.csv", "observed-frame.fits", "provenance.json"}
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256"}
SHA = set("0123456789abcdef")


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
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and set(value) <= SHA


def record(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise RuntimeError(f"v546-{label}-object")
    return value


def common(value: dict[str, Any]) -> tuple[str, str, str, str]:
    result = (value.get("contentClass"), value.get("instrumentId"), value.get("detectorId"), value.get("campaignId"))
    if result[0] not in {"measured-science-candidate", "synthetic-validation-fixture"} or any(not isinstance(entry, str) or not entry.strip() for entry in result[1:]):
        raise RuntimeError("v546-common-identity")
    return result  # type: ignore[return-value]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    candidate = Path(args.candidate)
    output = Path(args.output)
    if candidate.is_absolute() or output.is_absolute():
        raise RuntimeError("v546-relative-paths-required")
    network_attempt_count = 0
    original_connect = socket.socket.connect
    original_create_connection = socket.create_connection

    def blocked_connect(*_args: Any, **_kwargs: Any) -> Any:
        nonlocal network_attempt_count
        network_attempt_count += 1
        raise RuntimeError("v546-network-forbidden")

    socket.socket.connect = blocked_connect  # type: ignore[method-assign]
    socket.create_connection = blocked_connect  # type: ignore[assignment]
    try:
        if not candidate.is_dir() or candidate.is_symlink():
            raise RuntimeError("v546-candidate-directory")
        entries = list(candidate.iterdir())
        if {entry.name for entry in entries} != FILES or len(entries) != len(FILES):
            raise RuntimeError("v546-exact-file-whitelist")
        total_bytes = 0
        for entry in entries:
            mode = entry.lstat().st_mode
            if entry.is_symlink() or not stat.S_ISREG(mode):
                raise RuntimeError("v546-regular-files-only")
            size = entry.stat().st_size
            maximum = 256 * 1024 * 1024 if entry.name == "observed-frame.fits" else 8 * 1024 * 1024
            if size <= 0 or size > maximum:
                raise RuntimeError(f"v546-file-size:{entry.name}")
            total_bytes += size
        if total_bytes > 288 * 1024 * 1024:
            raise RuntimeError("v546-total-size")

        area = record(json.loads((candidate / "collecting-area.json").read_text(encoding="utf-8")), "area")
        exposure = record(json.loads((candidate / "exposure-record.json").read_text(encoding="utf-8")), "exposure")
        provenance = record(json.loads((candidate / "provenance.json").read_text(encoding="utf-8")), "provenance")
        identities = [common(area), common(exposure), common(provenance)]
        if any(identity != identities[0] for identity in identities[1:]):
            raise RuntimeError("v546-cross-file-identity")
        content_class, instrument_id, detector_id, campaign_id = identities[0]
        collecting_area = area.get("collectingAreaM2")
        area_uncertainty = area.get("standardUncertaintyM2")
        if area.get("version") != "v545-collecting-area-v1" or not isinstance(collecting_area, (int, float)) or not isinstance(area_uncertainty, (int, float)) or not 0 <= area_uncertainty < collecting_area or not str(area.get("traceableSourceUrl", "")).startswith("https://") or not sha(area.get("rawArtifactSha256")):
            raise RuntimeError("v546-collecting-area")
        start = exposure.get("tdbStartJd")
        end = exposure.get("tdbEndJd")
        exposure_s = exposure.get("exposureS")
        if exposure.get("version") != "v545-exposure-record-v1" or exposure.get("bandId") not in {"visible", "euv", "soft-x-ray"} or not all(isinstance(value, (int, float)) and np.isfinite(value) for value in [start, end, exposure_s]) or not end > start or abs((end - start) * 86400 - exposure_s) > 1e-3 or not sha(exposure.get("observationGeometrySha256")):
            raise RuntimeError("v546-exposure")

        with (candidate / "spectral-response.csv").open("r", encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        expected_header = ["bandId", "wavelengthM", "throughput", "standardUncertainty", "repeatIndex", "instrumentId", "detectorId", "campaignId", "rawArtifactSha256"]
        if len(rows) != 81 or list(rows[0]) != expected_header:
            raise RuntimeError("v546-spectral-shape")
        for band in ["visible", "euv", "soft-x-ray"]:
            band_rows = [row for row in rows if row["bandId"] == band]
            wavelengths = sorted({float(row["wavelengthM"]) for row in band_rows})
            if len(band_rows) != 27 or len(wavelengths) != 9 or any(value <= 0 for value in wavelengths):
                raise RuntimeError(f"v546-spectral-coverage:{band}")
            for wavelength in wavelengths:
                repeats = sorted(int(row["repeatIndex"]) for row in band_rows if float(row["wavelengthM"]) == wavelength)
                if repeats != [1, 2, 3]:
                    raise RuntimeError(f"v546-spectral-repeat:{band}")
        if any(row["instrumentId"] != instrument_id or row["detectorId"] != detector_id or row["campaignId"] != campaign_id or row["bandId"] not in {"visible", "euv", "soft-x-ray"} or not 0 <= float(row["throughput"]) <= 1 or float(row["standardUncertainty"]) < 0 or not sha(row["rawArtifactSha256"]) for row in rows):
            raise RuntimeError("v546-spectral-values")

        frame_path = candidate / "observed-frame.fits"
        with fits.open(frame_path, checksum=True, memmap=False) as hdus:
            hdus.verify("exception")
            if len(hdus) != 1 or not isinstance(hdus[0], fits.PrimaryHDU) or hdus[0].data is None or hdus[0].data.ndim != 2:
                raise RuntimeError("v546-fits-layout")
            hdu = hdus[0]
            data = np.asarray(hdu.data)
            header = hdu.header
            if not np.issubdtype(data.dtype, np.integer) or not np.all(np.isfinite(data)) or np.any(data < 0):
                raise RuntimeError("v546-fits-data-domain")
            if hdu.verify_checksum() != 1 or hdu.verify_datasum() != 1:
                raise RuntimeError("v546-fits-checksum")
            if header.get("BUNIT") != "adu" or header.get("TIMESYS") != "TDB" or header.get("INSTRUME") != instrument_id or header.get("DETECTOR") != detector_id or header.get("CAMPAIGN") != campaign_id or header.get("CONTENT") != content_class or header.get("OBS_ID") != exposure.get("observationId") or header.get("BANDID") != exposure.get("bandId") or abs(float(header.get("TSTART")) - float(start)) > 1e-12 or abs(float(header.get("TSTOP")) - float(end)) > 1e-12 or abs(float(header.get("EXPTIME")) - float(exposure_s)) > 1e-9:
                raise RuntimeError("v546-fits-header-linkage")
            height, width = data.shape
            bitpix = int(header["BITPIX"])

        links = record(provenance.get("fileSha256"), "provenance-sha")
        expected_links = {"collectingArea": file_sha(candidate / "collecting-area.json"), "exposureRecord": file_sha(candidate / "exposure-record.json"), "spectralResponse": file_sha(candidate / "spectral-response.csv"), "observedFrame": file_sha(frame_path)}
        if links != expected_links:
            raise RuntimeError("v546-provenance-sha-linkage")
        sources = provenance.get("sources")
        if provenance.get("version") != "v545-supplemental-provenance-v1" or provenance.get("usageScope") != "local-shadow-research-only" or not isinstance(provenance.get("operatorAttestation"), str) or not isinstance(sources, list) or len(sources) != 4 or any(not isinstance(source, dict) or not str(source.get("url", "")).startswith("https://") or not source.get("licenseOrTerms") or not sha(source.get("sourceSha256")) for source in sources):
            raise RuntimeError("v546-provenance")
        frame_metadata = record(provenance.get("observedFrameMetadata"), "frame-metadata")
        if frame_metadata != {"widthPixels": width, "heightPixels": height, "bitpix": bitpix, "bunit": "adu", "bandId": exposure.get("bandId")}:
            raise RuntimeError("v546-frame-metadata")
        if network_attempt_count:
            raise RuntimeError("v546-network-attempt")
        synthetic = content_class == "synthetic-validation-fixture"
        unsigned = {
            "version": "v546-independent-fits-validation-receipt-v1",
            "generatedAt": "2026-08-02T00:00:00Z",
            "status": "synthetic-fixture-semantically-qualified-nonauthoritative" if synthetic else "measured-candidate-semantically-qualified-awaiting-blind-authority-review",
            "environment": {"pythonImplementation": sys.implementation.name, "pythonVersion": ".".join(map(str, sys.version_info[:3])), "numpyVersion": np.__version__, "astropyVersion": astropy.__version__},
            "candidate": {"contentClass": content_class, "fileCount": 5, "totalBytes": total_bytes, "fileSha256": expected_links},
            "checks": {"exactWhitelistQualified": True, "regularFilesQualified": True, "crossFileIdentityQualified": True, "spectralResponseRowCount": 81, "spectralBandCount": 3, "fitsHduCount": 1, "fitsImageHduCount": 1, "fitsWidthPixels": width, "fitsHeightPixels": height, "fitsPixelCount": width * height, "fitsBitpix": bitpix, "fitsChecksumQualified": True, "fitsHeaderLinkageQualified": True, "provenanceShaLinkageQualified": True, "networkAttemptCount": network_attempt_count, "absolutePathStored": False},
            "qualification": {"independentFitsSemanticValidationQualified": True, "candidateReadyForBlindAuthorityReview": not synthetic, "syntheticAuthorityGranted": False, "measuredAuthorityGranted": False, "scienceRasterQualified": False, "productionPromotionQualified": False},
            "boundary": {"pixelValuesStoredInReceipt": False, "fitsFilePublished": False, "sciencePayloadMutationAllowed": False, "denseCampaignStatus": "incomplete-0-of-49", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        }
    finally:
        socket.socket.connect = original_connect  # type: ignore[method-assign]
        socket.create_connection = original_create_connection  # type: ignore[assignment]
    result = {**unsigned, "resultSha256": canonical_sha(unsigned)}
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")


if __name__ == "__main__":
    main()

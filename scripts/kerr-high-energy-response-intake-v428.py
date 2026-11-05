from __future__ import annotations

import argparse
import copy
import csv
import hashlib
import io
import json
import math
import os
import tempfile
import warnings
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

import numpy as np


ROOT = Path.cwd()
V427_ROOT = ROOT / "dist/science/kerr-high-energy-response-acquisition-pack-v427"
OUTPUT = ROOT / "dist/science/kerr-high-energy-response-intake-v428"
STAGING = ROOT / "dist/staging/kerr-high-energy-response-intake-v428"
V427_ARTIFACT = V427_ROOT / "acquisition-pack.json"
V427_FIXTURE = V427_ROOT / "validator-fixture.json"
EXPECTED_V427_ARTIFACT_SHA = "e1a81b23a4c43700706fbeea25db8c0610879508259228c71a9cf200e9de3a52"
EXPECTED_V427_ARTIFACT_FILE_SHA = "0320a996601ce721cc2eacc18204168ba57706f7d8a45081f273e00cf7e62c60"
MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
MAX_TOTAL_UNCOMPRESSED_BYTES = 64 * 1024 * 1024
MAX_MEMBER_BYTES = 32 * 1024 * 1024
MAX_COMPRESSION_RATIO = 100.0
CSV_HEADERS = {
    "effective-area.csv": ["measurementId", "binId", "repeatIndex", "effectiveAreaM2", "includesQuantumEfficiency", "exposureTimeS", "detectorTemperatureK", "rawArtifactSha256"],
    "modulation.csv": ["measurementId", "binId", "repeatIndex", "modulationFactor", "polarizationAngleZeroDeg", "exposureTimeS", "detectorTemperatureK", "rawArtifactSha256"],
    "redistribution.csv": ["measurementId", "trueEnergyBinId", "detectorChannelId", "repeatIndex", "probability", "exposureTimeS", "detectorTemperatureK", "rawArtifactSha256"],
    "background.csv": ["measurementId", "detectorChannelId", "repeatIndex", "rateCountsPerS", "exposureTimeS", "detectorTemperatureK", "rawArtifactSha256"],
    "response-covariance.csv": ["rowParameterId", "columnParameterId", "covariance", "unitProduct", "rawArtifactSha256"],
    "redistribution-covariance.csv": ["trueEnergyBinId", "rowChannelId", "columnChannelId", "covariance", "rawArtifactSha256"],
}
EXPECTED_FILES = sorted(["manifest.json", *CSV_HEADERS])
ROW_CAPS = {
    "effective-area.csv": 100_000,
    "modulation.csv": 100_000,
    "redistribution.csv": 1_000_000,
    "background.csv": 100_000,
    "response-covariance.csv": 1_000_000,
    "redistribution-covariance.csv": 1_000_000,
}
EXPECTED_UNITS = {
    "energy": "eV",
    "effectiveArea": "m2",
    "modulationFactor": "dimensionless",
    "polarizationAngleZero": "deg",
    "backgroundRate": "count/s",
    "exposureTime": "s",
    "detectorTemperature": "K",
    "responseCovariance": "declared-parameter-unit-product",
    "redistributionCovariance": "probability2",
}
SHA_PATTERN = set("0123456789abcdef")


class IntakeError(RuntimeError):
    pass


def sha_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def is_sha(value: object) -> bool:
    return isinstance(value, str) and len(value) == 64 and set(value) <= SHA_PATTERN


def normalize(value: Any) -> Any:
    if isinstance(value, list):
        return [normalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: normalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value: Any) -> str:
    return sha_bytes(json.dumps(normalize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def atomic(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_bytes(payload)
    temporary.replace(path)


def atomic_json(path: Path, value: Any) -> None:
    atomic(path, (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))


def parse_float(value: str, label: str) -> float:
    try:
        parsed = float(value)
    except ValueError as error:
        raise IntakeError(f"number:{label}") from error
    if not math.isfinite(parsed):
        raise IntakeError(f"finite:{label}")
    return parsed


def parse_int(value: str, label: str) -> int:
    if not value or value.strip() != value or any(character not in "-0123456789" for character in value):
        raise IntakeError(f"integer:{label}")
    try:
        parsed = int(value)
    except ValueError as error:
        raise IntakeError(f"integer:{label}") from error
    return parsed


def parse_bool(value: str, label: str) -> bool:
    if value == "true":
        return True
    if value == "false":
        return False
    raise IntakeError(f"boolean:{label}")


def parse_csv(payload: bytes, name: str) -> list[dict[str, str]]:
    if payload.startswith(b"\xef\xbb\xbf"):
        raise IntakeError(f"utf8-bom:{name}")
    try:
        text = payload.decode("utf-8", errors="strict")
    except UnicodeDecodeError as error:
        raise IntakeError(f"utf8:{name}") from error
    if "\x00" in text:
        raise IntakeError(f"nul:{name}")
    reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
    if reader.fieldnames != CSV_HEADERS[name]:
        raise IntakeError(f"header:{name}")
    rows = list(reader)
    if len(rows) == 0 or len(rows) > ROW_CAPS[name]:
        raise IntakeError(f"row-count:{name}")
    if any(None in row or any(value is None or value == "" for value in row.values()) for row in rows):
        raise IntakeError(f"empty-cell:{name}")
    return rows


def validate_member_name(info: zipfile.ZipInfo) -> None:
    name = info.filename
    path = PurePosixPath(name)
    if not name or name.startswith(("/", "\\")) or "\\" in name or path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts) or len(path.parts) != 1:
        raise IntakeError("archive-path")
    if info.is_dir():
        raise IntakeError("archive-directory")
    mode = (info.external_attr >> 16) & 0o170000
    if mode == 0o120000:
        raise IntakeError("archive-symlink")
    if info.flag_bits & 0x1:
        raise IntakeError("archive-encrypted")
    if info.file_size <= 0 or info.file_size > MAX_MEMBER_BYTES:
        raise IntakeError("archive-member-size")
    if info.compress_size <= 0 or info.file_size / info.compress_size > MAX_COMPRESSION_RATIO:
        raise IntakeError("archive-compression-ratio")


def validate_manifest(manifest: dict[str, Any], archive_payloads: dict[str, bytes]) -> None:
    if manifest.get("version") != "v428-kerr-high-energy-response-submission-manifest-v1":
        raise IntakeError("manifest-version")
    identity = manifest.get("identity")
    if not isinstance(identity, dict) or identity.get("architecture") != "band-appropriate-energy-resolved-polarimeter" or identity.get("sourceKind") not in {"test-fixture", "measured-import"}:
        raise IntakeError("manifest-identity")
    required_identity = ["manufacturer", "model", "serialOrCampaignId", "performedAtUtc", "laboratoryOrArchive"]
    if any(not isinstance(identity.get(key), str) or not identity[key].strip() for key in required_identity):
        raise IntakeError("manifest-identity-fields")
    provenance = manifest.get("provenance")
    if not isinstance(provenance, dict) or not isinstance(provenance.get("licenseOrTerms"), str) or not provenance["licenseOrTerms"].strip() or not is_sha(provenance.get("processingParametersSha256")):
        raise IntakeError("manifest-provenance")
    if identity["sourceKind"] == "test-fixture":
        if identity.get("measuredAcquisition") is not False or provenance.get("attestation") != "declared-test-fixture-nonpublishable" or provenance.get("sourceUrl") is not None:
            raise IntakeError("fixture-attestation")
    else:
        if identity.get("measuredAcquisition") is not True or provenance.get("attestation") != "real-measured-high-energy-response-not-synthetic-or-example" or not isinstance(provenance.get("sourceUrl"), str) or not provenance["sourceUrl"].startswith("https://"):
            raise IntakeError("measured-attestation")
    if manifest.get("units") != EXPECTED_UNITS:
        raise IntakeError("manifest-units")
    files = manifest.get("files")
    if not isinstance(files, dict) or set(files) != set(CSV_HEADERS) or any(not is_sha(value) for value in files.values()):
        raise IntakeError("manifest-files")
    for name in CSV_HEADERS:
        if sha_bytes(archive_payloads[name]) != files[name]:
            raise IntakeError(f"file-sha:{name}")
    acquisition = manifest.get("acquisition")
    if not isinstance(acquisition, dict) or not isinstance(acquisition.get("requiredRepeatCount"), int) or acquisition["requiredRepeatCount"] < 2 or not isinstance(acquisition.get("deadTimeModel"), str) or not acquisition["deadTimeModel"].strip() or not isinstance(acquisition.get("pileupModel"), str) or not acquisition["pileupModel"].strip():
        raise IntakeError("manifest-acquisition")
    for grid_name in ["trueEnergyBins", "detectorChannels"]:
        grid = manifest.get(grid_name)
        if not isinstance(grid, list) or len(grid) != 6:
            raise IntakeError(f"manifest-grid:{grid_name}")
        identifiers: set[str] = set()
        previous_upper: float | None = None
        for entry in grid:
            if not isinstance(entry, dict) or not isinstance(entry.get("id"), str) or not entry["id"] or entry["id"] in identifiers:
                raise IntakeError(f"manifest-grid-id:{grid_name}")
            lower = entry.get("lowerEv")
            upper = entry.get("upperEv")
            if not isinstance(lower, (int, float)) or not isinstance(upper, (int, float)) or not math.isfinite(lower) or not math.isfinite(upper) or lower <= 0 or upper <= lower or (previous_upper is not None and abs(lower - previous_upper) > 1e-12):
                raise IntakeError(f"manifest-grid-edge:{grid_name}")
            identifiers.add(entry["id"])
            previous_upper = upper


def build_normalized_submission(manifest: dict[str, Any], rows: dict[str, list[dict[str, str]]], manifest_sha: str) -> dict[str, Any]:
    normalized = {
        "version": "v427-kerr-high-energy-response-acquisition-submission-v1",
        "identity": manifest["identity"],
        "trueEnergyBins": manifest["trueEnergyBins"],
        "detectorChannels": manifest["detectorChannels"],
        "effectiveAreaRows": [{**entry, "repeatIndex": parse_int(entry["repeatIndex"], "area-repeat"), "effectiveAreaM2": parse_float(entry["effectiveAreaM2"], "effective-area"), "includesQuantumEfficiency": parse_bool(entry["includesQuantumEfficiency"], "includes-qe"), "exposureTimeS": parse_float(entry["exposureTimeS"], "area-exposure"), "detectorTemperatureK": parse_float(entry["detectorTemperatureK"], "area-temperature")} for entry in rows["effective-area.csv"]],
        "modulationRows": [{**entry, "repeatIndex": parse_int(entry["repeatIndex"], "modulation-repeat"), "modulationFactor": parse_float(entry["modulationFactor"], "modulation"), "polarizationAngleZeroDeg": parse_float(entry["polarizationAngleZeroDeg"], "angle-zero"), "exposureTimeS": parse_float(entry["exposureTimeS"], "modulation-exposure"), "detectorTemperatureK": parse_float(entry["detectorTemperatureK"], "modulation-temperature")} for entry in rows["modulation.csv"]],
        "redistributionRows": [{**entry, "repeatIndex": parse_int(entry["repeatIndex"], "redistribution-repeat"), "probability": parse_float(entry["probability"], "redistribution-probability"), "exposureTimeS": parse_float(entry["exposureTimeS"], "redistribution-exposure"), "detectorTemperatureK": parse_float(entry["detectorTemperatureK"], "redistribution-temperature")} for entry in rows["redistribution.csv"]],
        "backgroundRows": [{**entry, "repeatIndex": parse_int(entry["repeatIndex"], "background-repeat"), "rateCountsPerS": parse_float(entry["rateCountsPerS"], "background-rate"), "exposureTimeS": parse_float(entry["exposureTimeS"], "background-exposure"), "detectorTemperatureK": parse_float(entry["detectorTemperatureK"], "background-temperature")} for entry in rows["background.csv"]],
        "responseCovarianceRows": [{**entry, "covariance": parse_float(entry["covariance"], "response-covariance")} for entry in rows["response-covariance.csv"]],
        "redistributionCovarianceRows": [{**entry, "covariance": parse_float(entry["covariance"], "redistribution-covariance")} for entry in rows["redistribution-covariance.csv"]],
        "acquisition": manifest["acquisition"],
        "provenance": {**manifest["provenance"], "fileSha256": {**manifest["files"], "manifest.json": manifest_sha}},
    }
    return normalized


def independent_metrics(submission: dict[str, Any]) -> dict[str, Any]:
    repeat_count = submission["acquisition"]["requiredRepeatCount"]
    row_sum_residual = 0.0
    for energy_bin in submission["trueEnergyBins"]:
        for repeat in range(repeat_count):
            probabilities = [entry["probability"] for entry in submission["redistributionRows"] if entry["trueEnergyBinId"] == energy_bin["id"] and entry["repeatIndex"] == repeat]
            row_sum_residual = max(row_sum_residual, abs(sum(probabilities) - 1.0))
    parameter_ids = [
        *[f"effective-area:{entry['id']}" for entry in submission["trueEnergyBins"]],
        *[f"modulation:{entry['id']}" for entry in submission["trueEnergyBins"]],
        *[f"angle-zero:{entry['id']}" for entry in submission["trueEnergyBins"]],
        *[f"background:{entry['id']}" for entry in submission["detectorChannels"]],
    ]
    parameter_index = {value: index for index, value in enumerate(parameter_ids)}
    response_covariance = np.full((24, 24), np.nan, dtype=np.float64)
    for entry in submission["responseCovarianceRows"]:
        if entry["rowParameterId"] not in parameter_index or entry["columnParameterId"] not in parameter_index:
            raise IntakeError("response-covariance-parameter")
        response_covariance[parameter_index[entry["rowParameterId"]], parameter_index[entry["columnParameterId"]]] = entry["covariance"]
    if np.any(~np.isfinite(response_covariance)):
        raise IntakeError("response-covariance-coverage")
    response_symmetry = float(np.max(np.abs(response_covariance - response_covariance.T)))
    response_minimum = float(np.min(np.linalg.eigvalsh(response_covariance)))
    redistribution_symmetry = 0.0
    redistribution_minimum = float("inf")
    simplex_residual = 0.0
    channel_index = {entry["id"]: index for index, entry in enumerate(submission["detectorChannels"])}
    for energy_bin in submission["trueEnergyBins"]:
        matrix = np.full((6, 6), np.nan, dtype=np.float64)
        for entry in submission["redistributionCovarianceRows"]:
            if entry["trueEnergyBinId"] == energy_bin["id"]:
                if entry["rowChannelId"] not in channel_index or entry["columnChannelId"] not in channel_index:
                    raise IntakeError("redistribution-covariance-channel")
                matrix[channel_index[entry["rowChannelId"]], channel_index[entry["columnChannelId"]]] = entry["covariance"]
        if np.any(~np.isfinite(matrix)):
            raise IntakeError("redistribution-covariance-coverage")
        redistribution_symmetry = max(redistribution_symmetry, float(np.max(np.abs(matrix - matrix.T))))
        redistribution_minimum = min(redistribution_minimum, float(np.min(np.linalg.eigvalsh(matrix))))
        simplex_residual = max(simplex_residual, float(np.max(np.abs(np.sum(matrix, axis=1)))))
    measurement_ids = [entry["measurementId"] for key in ["effectiveAreaRows", "modulationRows", "redistributionRows", "backgroundRows"] for entry in submission[key]]
    return {
        "trueEnergyBinCount": len(submission["trueEnergyBins"]),
        "detectorChannelCount": len(submission["detectorChannels"]),
        "repeatCount": repeat_count,
        "effectiveAreaRowCount": len(submission["effectiveAreaRows"]),
        "modulationRowCount": len(submission["modulationRows"]),
        "redistributionRowCount": len(submission["redistributionRows"]),
        "backgroundRowCount": len(submission["backgroundRows"]),
        "responseCovarianceRowCount": len(submission["responseCovarianceRows"]),
        "redistributionCovarianceRowCount": len(submission["redistributionCovarianceRows"]),
        "uniqueMeasurementIdCount": len(set(measurement_ids)),
        "maximumRedistributionRowSumAbsolute": row_sum_residual,
        "maximumResponseCovarianceSymmetryAbsolute": response_symmetry,
        "minimumResponseCovarianceEigenvalue": response_minimum,
        "maximumRedistributionCovarianceSymmetryAbsolute": redistribution_symmetry,
        "minimumRedistributionCovarianceEigenvalue": redistribution_minimum,
        "maximumRedistributionCovarianceSimplexResidual": simplex_residual,
    }


def validate_archive(path: Path, include_normalized: bool = False) -> tuple[dict[str, Any], dict[str, Any] | None]:
    errors: list[str] = []
    archive_sha = "unavailable"
    normalized: dict[str, Any] | None = None
    source_kind = "unknown"
    metrics: dict[str, Any] | None = None
    try:
        if not path.is_file() or path.stat().st_size <= 0 or path.stat().st_size > MAX_ARCHIVE_BYTES:
            raise IntakeError("archive-size")
        archive_sha = file_sha(path)
        with zipfile.ZipFile(path, "r") as archive:
            infos = archive.infolist()
            names = [entry.filename for entry in infos]
            if len(names) != len(set(names)):
                raise IntakeError("archive-duplicate")
            for info in infos:
                validate_member_name(info)
            if sorted(names) != EXPECTED_FILES:
                raise IntakeError("archive-file-set")
            if sum(info.file_size for info in infos) > MAX_TOTAL_UNCOMPRESSED_BYTES:
                raise IntakeError("archive-uncompressed-size")
            payloads = {name: archive.read(name) for name in EXPECTED_FILES}
        if len(payloads["manifest.json"]) > 128 * 1024:
            raise IntakeError("manifest-size")
        try:
            manifest = json.loads(payloads["manifest.json"].decode("utf-8", errors="strict"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise IntakeError("manifest-json") from error
        if not isinstance(manifest, dict):
            raise IntakeError("manifest-object")
        validate_manifest(manifest, payloads)
        source_kind = manifest["identity"]["sourceKind"]
        rows = {name: parse_csv(payloads[name], name) for name in CSV_HEADERS}
        normalized = build_normalized_submission(manifest, rows, sha_bytes(payloads["manifest.json"]))
        metrics = independent_metrics(normalized)
        if metrics["maximumRedistributionRowSumAbsolute"] >= 1e-12 or metrics["maximumResponseCovarianceSymmetryAbsolute"] >= 1e-12 or metrics["minimumResponseCovarianceEigenvalue"] < -1e-12 or metrics["maximumRedistributionCovarianceSymmetryAbsolute"] >= 1e-12 or metrics["minimumRedistributionCovarianceEigenvalue"] < -1e-12 or metrics["maximumRedistributionCovarianceSimplexResidual"] >= 1e-12:
            raise IntakeError("scientific-structure-metrics")
    except (IntakeError, zipfile.BadZipFile, csv.Error) as error:
        errors.append(str(error) or error.__class__.__name__)
        normalized = None
        metrics = None
    valid = len(errors) == 0
    status = "rejected-invalid-intake" if not valid else "validated-test-fixture-intake-nonpublishable" if source_kind == "test-fixture" else "validated-measured-intake-awaiting-independent-scientific-validation"
    report = {
        "version": "v428-kerr-high-energy-response-intake-report-v1",
        "status": status,
        "sourceKind": source_kind,
        "archiveSha256": archive_sha,
        "valid": valid,
        "containerQualified": valid,
        "csvBridgeQualified": valid,
        "unitContractQualified": valid,
        "fileShaQualified": valid,
        "provenanceQualified": valid,
        "measuredAuthorityGranted": False,
        "scienceResponseApplicationAllowed": False,
        "errors": errors,
        "metrics": metrics,
        "normalizedSubmissionSha256": sha_bytes((json.dumps(normalized, indent=2, ensure_ascii=False) + "\n").encode("utf-8")) if normalized is not None else None,
        "normalizedSubmissionIncluded": include_normalized and normalized is not None,
        "boundary": "intake-validation-never-grants-measured-response-or-science-authority-independent-scientific-validation-remains-mandatory",
    }
    return report, normalized if include_normalized else None


def csv_bytes(rows: list[dict[str, Any]], name: str) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=CSV_HEADERS[name], lineterminator="\n", extrasaction="raise")
    writer.writeheader()
    for row in rows:
        encoded = {key: "true" if value is True else "false" if value is False else format(value, ".17g") if isinstance(value, float) else str(value) for key, value in row.items()}
        writer.writerow(encoded)
    return stream.getvalue().encode("utf-8")


def make_manifest(fixture: dict[str, Any], csv_payloads: dict[str, bytes]) -> dict[str, Any]:
    return {
        "version": "v428-kerr-high-energy-response-submission-manifest-v1",
        "identity": fixture["identity"],
        "trueEnergyBins": fixture["trueEnergyBins"],
        "detectorChannels": fixture["detectorChannels"],
        "units": EXPECTED_UNITS,
        "files": {name: sha_bytes(payload) for name, payload in csv_payloads.items()},
        "acquisition": fixture["acquisition"],
        "provenance": {key: value for key, value in fixture["provenance"].items() if key != "fileSha256"},
        "admissionBoundary": "container-and-structure-validation-only-independent-scientific-validation-required",
    }


def zip_bytes(entries: dict[str, bytes], special: dict[str, zipfile.ZipInfo] | None = None, duplicate: str | None = None) -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as archive:
        for name in sorted(entries):
            info = special.get(name) if special else None
            if info is None:
                info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            info.flag_bits |= 0x800
            archive.writestr(info, entries[name], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            if duplicate == name:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    archive.writestr(info, entries[name], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return stream.getvalue()


def build_fixture() -> None:
    if file_sha(V427_ARTIFACT) != EXPECTED_V427_ARTIFACT_FILE_SHA:
        raise RuntimeError("v428-v427-file-lock")
    v427_artifact = json.loads(V427_ARTIFACT.read_text(encoding="utf-8"))
    if v427_artifact.get("artifactSha256") != EXPECTED_V427_ARTIFACT_SHA or v427_artifact.get("view", {}).get("counts", {}).get("measuredDataRowCount") != 0:
        raise RuntimeError("v428-v427-authority-lock")
    fixture = json.loads(V427_FIXTURE.read_text(encoding="utf-8"))
    csv_payloads = {
        "effective-area.csv": csv_bytes(fixture["effectiveAreaRows"], "effective-area.csv"),
        "modulation.csv": csv_bytes(fixture["modulationRows"], "modulation.csv"),
        "redistribution.csv": csv_bytes(fixture["redistributionRows"], "redistribution.csv"),
        "background.csv": csv_bytes(fixture["backgroundRows"], "background.csv"),
        "response-covariance.csv": csv_bytes(fixture["responseCovarianceRows"], "response-covariance.csv"),
        "redistribution-covariance.csv": csv_bytes(fixture["redistributionCovarianceRows"], "redistribution-covariance.csv"),
    }
    manifest = make_manifest(fixture, csv_payloads)
    entries = {**csv_payloads, "manifest.json": (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")}
    fixture_zip = OUTPUT / "nonpublishable-intake-fixture.zip"
    atomic(fixture_zip, zip_bytes(entries))
    report, normalized = validate_archive(fixture_zip, include_normalized=True)
    if report["status"] != "validated-test-fixture-intake-nonpublishable" or normalized is None:
        raise RuntimeError(f"v428-fixture-intake:{report}")
    atomic_json(OUTPUT / "normalized-fixture-submission.json", normalized)
    mutation_results: list[dict[str, Any]] = []
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v428-") as temporary_name:
        temporary = Path(temporary_name)
        mutations: list[tuple[str, dict[str, bytes], dict[str, zipfile.ZipInfo] | None, str | None]] = []
        mutations.append(("path-traversal", {**entries, "../escape": b"x"}, None, None))
        mutations.append(("absolute-path", {**entries, "/escape": b"x"}, None, None))
        mutations.append(("backslash-path", {**entries, "escape\\file": b"x"}, None, None))
        mutations.append(("duplicate-member", entries, None, "manifest.json"))
        mutations.append(("unexpected-member", {**entries, "extra.bin": b"x"}, None, None))
        missing = dict(entries); missing.pop("background.csv"); mutations.append(("missing-member", missing, None, None))
        symlink = zipfile.ZipInfo("manifest.json", date_time=(1980, 1, 1, 0, 0, 0)); symlink.create_system = 3; symlink.external_attr = (0o120777 << 16); mutations.append(("symlink-member", entries, {"manifest.json": symlink}, None))
        bad_sha = dict(entries); bad_sha["background.csv"] += b"\n"; mutations.append(("file-sha-mismatch", bad_sha, None, None))
        bad_header = dict(entries); bad_header["effective-area.csv"] = bad_header["effective-area.csv"].replace(b"measurementId", b"wrongId", 1); bad_header_manifest = copy.deepcopy(manifest); bad_header_manifest["files"]["effective-area.csv"] = sha_bytes(bad_header["effective-area.csv"]); bad_header["manifest.json"] = (json.dumps(bad_header_manifest, indent=2) + "\n").encode(); mutations.append(("csv-header-mismatch", bad_header, None, None))
        bad_utf8 = dict(entries); bad_utf8["modulation.csv"] = b"\xff"; bad_utf8_manifest = copy.deepcopy(manifest); bad_utf8_manifest["files"]["modulation.csv"] = sha_bytes(bad_utf8["modulation.csv"]); bad_utf8["manifest.json"] = (json.dumps(bad_utf8_manifest, indent=2) + "\n").encode(); mutations.append(("invalid-utf8", bad_utf8, None, None))
        bad_attestation = copy.deepcopy(manifest); bad_attestation["identity"]["sourceKind"] = "measured-import"; bad_attestation_entries = {**entries, "manifest.json": (json.dumps(bad_attestation, indent=2) + "\n").encode()}; mutations.append(("measured-attestation-mismatch", bad_attestation_entries, None, None))
        bad_units = copy.deepcopy(manifest); bad_units["units"]["energy"] = "keV"; bad_units_entries = {**entries, "manifest.json": (json.dumps(bad_units, indent=2) + "\n").encode()}; mutations.append(("unit-contract-mismatch", bad_units_entries, None, None))
        for mutation_id, mutation_entries, special, duplicate in mutations:
            path = temporary / f"{mutation_id}.zip"
            path.write_bytes(zip_bytes(mutation_entries, special, duplicate))
            mutation_report, _ = validate_archive(path)
            mutation_results.append({"id": mutation_id, "status": mutation_report["status"], "rejected": not mutation_report["valid"], "errors": mutation_report["errors"]})
    if len(mutation_results) != 12 or not all(entry["rejected"] for entry in mutation_results):
        raise RuntimeError(f"v428-mutation-gate:{mutation_results}")
    unsigned = {
        "version": "v428-kerr-high-energy-response-intake-fixture-report-v1",
        "generatedAt": v427_artifact["generatedAt"],
        "status": "qualified-intake-firewall-fixture-rejected-no-measured-submission",
        "sourceV427ArtifactSha256": EXPECTED_V427_ARTIFACT_SHA,
        "sourceV427ArtifactFileSha256": EXPECTED_V427_ARTIFACT_FILE_SHA,
        "fixtureArchiveSha256": file_sha(fixture_zip),
        "fixtureArchiveBytes": fixture_zip.stat().st_size,
        "fixtureReport": report,
        "mutationResults": mutation_results,
        "mutationCount": 12,
        "rejectedMutationCount": 12,
        "measuredSubmissionPresent": False,
        "measuredImportAttempted": False,
        "measuredAuthorityGranted": False,
        "scienceResponseApplicationCount": 0,
        "networkAttempted": False,
        "boundary": "fixture-proves-intake-firewall-only-no-measured-response-or-science-authority",
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(OUTPUT / "fixture-intake-report.json", artifact)
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "orbit-atlas://kerr/high-energy-response-submission/v428",
        "title": "Orbit Atlas v428 high-energy response submission container",
        "version": "v428-kerr-high-energy-response-submission-schema-v1",
        "archive": {"format": "zip", "maximumBytes": MAX_ARCHIVE_BYTES, "maximumTotalUncompressedBytes": MAX_TOTAL_UNCOMPRESSED_BYTES, "maximumMemberBytes": MAX_MEMBER_BYTES, "maximumCompressionRatio": MAX_COMPRESSION_RATIO, "expectedFiles": EXPECTED_FILES, "directoriesAllowed": False, "symlinksAllowed": False, "encryptedMembersAllowed": False},
        "csvHeaders": CSV_HEADERS,
        "rowCaps": ROW_CAPS,
        "units": EXPECTED_UNITS,
        "requiredRepeatCountMinimum": 2,
        "measuredAttestation": "real-measured-high-energy-response-not-synthetic-or-example",
        "admissionBoundary": "structural-intake-does-not-grant-measured-response-authority-independent-scientific-validation-required",
    }
    atomic_json(OUTPUT / "response-submission-schema.json", schema)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "fixtureArchiveSha256": artifact["fixtureArchiveSha256"], "fixtureRows": sum(report["metrics"][key] for key in ["effectiveAreaRowCount", "modulationRowCount", "redistributionRowCount", "backgroundRowCount", "responseCovarianceRowCount", "redistributionCovarianceRowCount"]), "mutationsRejected": "12/12", "measuredSubmissionPresent": False, "measuredAuthority": False, "scienceApplications": 0}, indent=2))


def validate_explicit_input(path_value: str) -> None:
    path = Path(path_value).expanduser().resolve(strict=True)
    report, _ = validate_archive(path, include_normalized=False)
    destination = STAGING / report["archiveSha256"] / "intake-report.json"
    unsigned = {**report, "generatedAt": "runtime-explicit-user-request", "inputFileName": path.name, "inputAbsolutePathRecorded": False, "inputCopied": False, "normalizedSubmissionPersisted": False, "authorityGranted": False}
    atomic_json(destination, {**unsigned, "artifactSha256": canonical_sha(unsigned)})
    print(json.dumps({"status": report["status"], "archiveSha256": report["archiveSha256"], "report": destination.relative_to(ROOT).as_posix(), "measuredAuthorityGranted": False, "scienceResponseApplicationAllowed": False}, indent=2))
    if not report["valid"]:
        raise SystemExit(2)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-fixture", action="store_true")
    parser.add_argument("--input")
    args = parser.parse_args()
    if args.build_fixture == (args.input is not None):
        raise SystemExit("choose exactly one of --build-fixture or --input")
    if args.build_fixture:
        build_fixture()
    else:
        validate_explicit_input(args.input)


if __name__ == "__main__":
    main()

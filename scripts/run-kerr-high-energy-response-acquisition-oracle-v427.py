from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-high-energy-response-v426/response-contract.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-response-acquisition-pack-v427"
FIXTURE = OUTPUT / "validator-fixture.json"
ORACLE = OUTPUT / "validator-oracle.json"
EXPECTED_SOURCE_FILE_SHA = "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061"
EXPECTED_SOURCE_ARTIFACT_SHA = "17de5699cef0619dc3ea165ede2d05828ec55bfd3b9cc09a12d24e4c35637c44"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def stable_sha(value: Any) -> str:
    if isinstance(value, list):
        normalized = [normalize(entry) for entry in value]
    else:
        normalized = normalize(value)
    payload = json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def normalize(value: Any) -> Any:
    if isinstance(value, list):
        return [normalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: normalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def tagged_sha(label: str) -> str:
    return hashlib.sha256(f"v427-nonpublishable-fixture:{label}".encode("utf-8")).hexdigest()


def build_fixture(manifest: dict[str, Any]) -> dict[str, Any]:
    edges = manifest["trueEnergyEdgesEv"]
    channel_edges = manifest["detectorChannelEdgesEv"]
    response = manifest["response"]
    bins = [{"id": f"e{index}", "lowerEv": edges[index], "upperEv": edges[index + 1]} for index in range(6)]
    channels = [{"id": f"c{index}", "lowerEv": channel_edges[index], "upperEv": channel_edges[index + 1]} for index in range(6)]
    area_rows: list[dict[str, Any]] = []
    modulation_rows: list[dict[str, Any]] = []
    redistribution_rows: list[dict[str, Any]] = []
    background_rows: list[dict[str, Any]] = []
    for repeat in range(2):
        for index, bin_record in enumerate(bins):
            area_rows.append({"measurementId": f"fixture-area-{index}-r{repeat}", "binId": bin_record["id"], "repeatIndex": repeat, "effectiveAreaM2": response["effectiveAreaM2"][index], "includesQuantumEfficiency": response["effectiveAreaIncludesQuantumEfficiency"], "exposureTimeS": 1000.0, "detectorTemperatureK": 190.0, "rawArtifactSha256": tagged_sha(f"area-{repeat}")})
            modulation_rows.append({"measurementId": f"fixture-mod-{index}-r{repeat}", "binId": bin_record["id"], "repeatIndex": repeat, "modulationFactor": response["modulationFactor"][index], "polarizationAngleZeroDeg": response["polarizationAngleZeroDeg"][index], "exposureTimeS": 1000.0, "detectorTemperatureK": 190.0, "rawArtifactSha256": tagged_sha(f"modulation-{repeat}")})
            for channel_index, channel in enumerate(channels):
                redistribution_rows.append({"measurementId": f"fixture-rmf-{index}-{channel_index}-r{repeat}", "trueEnergyBinId": bin_record["id"], "detectorChannelId": channel["id"], "repeatIndex": repeat, "probability": response["redistributionMatrix"][index][channel_index], "exposureTimeS": 1000.0, "detectorTemperatureK": 190.0, "rawArtifactSha256": tagged_sha(f"redistribution-{repeat}")})
        for index, channel in enumerate(channels):
            background_rows.append({"measurementId": f"fixture-background-{index}-r{repeat}", "detectorChannelId": channel["id"], "repeatIndex": repeat, "rateCountsPerS": response["backgroundRateCountsPerS"][index], "exposureTimeS": 1000.0, "detectorTemperatureK": 190.0, "rawArtifactSha256": tagged_sha(f"background-{repeat}")})
    parameter_ids = [
        *[f"effective-area:{entry['id']}" for entry in bins],
        *[f"modulation:{entry['id']}" for entry in bins],
        *[f"angle-zero:{entry['id']}" for entry in bins],
        *[f"background:{entry['id']}" for entry in channels],
    ]
    response_covariance_rows = [
        {"rowParameterId": row_id, "columnParameterId": column_id, "covariance": response["responseParameterCovariance"][row][column], "unitProduct": "declared-mixed-parameter-unit-product", "rawArtifactSha256": tagged_sha("response-covariance")}
        for row, row_id in enumerate(parameter_ids)
        for column, column_id in enumerate(parameter_ids)
    ]
    redistribution_covariance_rows = [
        {"trueEnergyBinId": bins[bin_index]["id"], "rowChannelId": channels[row]["id"], "columnChannelId": channels[column]["id"], "covariance": response["redistributionRowCovariances"][bin_index][row][column], "rawArtifactSha256": tagged_sha("redistribution-covariance")}
        for bin_index in range(6)
        for row in range(6)
        for column in range(6)
    ]
    return {
        "version": "v427-kerr-high-energy-response-acquisition-submission-v1",
        "identity": {"sourceKind": "test-fixture", "measuredAcquisition": False, "architecture": "band-appropriate-energy-resolved-polarimeter", "manufacturer": "NONPUBLISHABLE-FIXTURE", "model": "VALIDATOR-ONLY", "serialOrCampaignId": "V427-FIXTURE", "performedAtUtc": "2000-01-01T00:00:00.000Z", "laboratoryOrArchive": "NO-LAB-FIXTURE"},
        "trueEnergyBins": bins,
        "detectorChannels": channels,
        "effectiveAreaRows": area_rows,
        "modulationRows": modulation_rows,
        "redistributionRows": redistribution_rows,
        "backgroundRows": background_rows,
        "responseCovarianceRows": response_covariance_rows,
        "redistributionCovarianceRows": redistribution_covariance_rows,
        "acquisition": {"requiredRepeatCount": 2, "deadTimeModel": "fixture-none", "pileupModel": "fixture-none"},
        "provenance": {"sourceUrl": None, "licenseOrTerms": "nonpublishable validator fixture only", "processingParametersSha256": tagged_sha("processing"), "fileSha256": {name: tagged_sha(name) for name in ["identity", "effective-area", "modulation", "redistribution", "background", "response-covariance", "redistribution-covariance"]}, "attestation": "declared-test-fixture-nonpublishable"},
    }


def metrics(fixture: dict[str, Any]) -> dict[str, Any]:
    repeats = fixture["acquisition"]["requiredRepeatCount"]
    row_residual = 0.0
    for bin_record in fixture["trueEnergyBins"]:
        for repeat in range(repeats):
            row = [entry["probability"] for entry in fixture["redistributionRows"] if entry["trueEnergyBinId"] == bin_record["id"] and entry["repeatIndex"] == repeat]
            row_residual = max(row_residual, abs(sum(row) - 1.0))
    parameter_ids = [entry["rowParameterId"] for entry in fixture["responseCovarianceRows"][::24]]
    if len(parameter_ids) != 24:
        parameter_ids = sorted({entry["rowParameterId"] for entry in fixture["responseCovarianceRows"]})
    parameter_index = {value: index for index, value in enumerate(parameter_ids)}
    response_covariance = np.empty((24, 24), dtype=np.float64)
    for entry in fixture["responseCovarianceRows"]:
        response_covariance[parameter_index[entry["rowParameterId"]], parameter_index[entry["columnParameterId"]]] = entry["covariance"]
    response_symmetry = float(np.max(np.abs(response_covariance - response_covariance.T)))
    response_minimum = float(np.min(np.linalg.eigvalsh(response_covariance)))
    redistribution_symmetry = 0.0
    redistribution_minimum = float("inf")
    simplex_residual = 0.0
    for bin_record in fixture["trueEnergyBins"]:
        matrix = np.empty((6, 6), dtype=np.float64)
        subset = [entry for entry in fixture["redistributionCovarianceRows"] if entry["trueEnergyBinId"] == bin_record["id"]]
        channel_index = {entry["id"]: index for index, entry in enumerate(fixture["detectorChannels"])}
        for entry in subset:
            matrix[channel_index[entry["rowChannelId"]], channel_index[entry["columnChannelId"]]] = entry["covariance"]
        redistribution_symmetry = max(redistribution_symmetry, float(np.max(np.abs(matrix - matrix.T))))
        redistribution_minimum = min(redistribution_minimum, float(np.min(np.linalg.eigvalsh(matrix))))
        simplex_residual = max(simplex_residual, float(np.max(np.abs(np.sum(matrix, axis=1)))))
    measurement_ids = [entry["measurementId"] for name in ["effectiveAreaRows", "modulationRows", "redistributionRows", "backgroundRows"] for entry in fixture[name]]
    return {
        "trueEnergyBinCount": 6,
        "detectorChannelCount": 6,
        "repeatCount": repeats,
        "effectiveAreaRowCount": len(fixture["effectiveAreaRows"]),
        "modulationRowCount": len(fixture["modulationRows"]),
        "redistributionRowCount": len(fixture["redistributionRows"]),
        "backgroundRowCount": len(fixture["backgroundRows"]),
        "responseCovarianceRowCount": len(fixture["responseCovarianceRows"]),
        "redistributionCovarianceRowCount": len(fixture["redistributionCovarianceRows"]),
        "uniqueMeasurementIdCount": len(set(measurement_ids)),
        "maximumRedistributionRowSumAbsolute": row_residual,
        "maximumResponseCovarianceSymmetryAbsolute": response_symmetry,
        "minimumResponseCovarianceEigenvalue": response_minimum,
        "maximumRedistributionCovarianceSymmetryAbsolute": redistribution_symmetry,
        "minimumRedistributionCovarianceEigenvalue": redistribution_minimum,
        "maximumRedistributionCovarianceSimplexResidual": simplex_residual,
    }


def main() -> None:
    if file_sha(SOURCE) != EXPECTED_SOURCE_FILE_SHA:
        raise RuntimeError("v427-v426-file-lock")
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    if source.get("artifactSha256") != EXPECTED_SOURCE_ARTIFACT_SHA or source.get("view", {}).get("counts", {}).get("scienceResponseApplicationCount") != 0:
        raise RuntimeError("v427-v426-authority-lock")
    fixture = build_fixture(copy.deepcopy(source["view"]["fixture"]["manifest"]))
    fixture_metrics = metrics(fixture)
    if fixture_metrics["maximumRedistributionRowSumAbsolute"] >= 1e-12 or fixture_metrics["minimumResponseCovarianceEigenvalue"] < -1e-12 or fixture_metrics["minimumRedistributionCovarianceEigenvalue"] < -1e-12 or fixture_metrics["maximumRedistributionCovarianceSimplexResidual"] >= 1e-12:
        raise RuntimeError(f"v427-oracle-metric-gate:{fixture_metrics}")
    atomic_json(FIXTURE, fixture)
    unsigned = {
        "version": "v427-kerr-high-energy-response-acquisition-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00.000Z",
        "status": "qualified-validator-fixture-oracle-nonpublishable-no-measured-authority",
        "sourceV426ArtifactSha256": EXPECTED_SOURCE_ARTIFACT_SHA,
        "sourceV426FileSha256": EXPECTED_SOURCE_FILE_SHA,
        "fixtureFileSha256": file_sha(FIXTURE),
        "fixtureCanonicalSha256": stable_sha(fixture),
        "metrics": fixture_metrics,
        "mutationCatalog": ["duplicate-measurement-id", "missing-energy-repeat", "invalid-modulation", "redistribution-not-normalized", "negative-background", "response-covariance-missing-cell", "response-covariance-asymmetric", "response-covariance-not-psd", "redistribution-covariance-missing-cell", "redistribution-covariance-asymmetric", "redistribution-covariance-simplex-violation", "measured-attestation-mismatch"],
        "fixturePerformanceAuthorityGranted": False,
        "measuredResponseAuthorityGranted": False,
        "scienceResponseApplicationCount": 0,
        "boundary": "independent-python-oracle-validates-fixture-matrix-properties-only-never-measured-performance-or-science-response",
    }
    oracle = {**unsigned, "artifactSha256": stable_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "fixtureFileSha256": oracle["fixtureFileSha256"], "metrics": fixture_metrics}, indent=2))


if __name__ == "__main__":
    main()

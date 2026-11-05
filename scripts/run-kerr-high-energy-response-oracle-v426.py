from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
V425 = ROOT / "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json"
V363 = ROOT / "dist/science/kerr-detector-calibration-plan-v363/plan.json"
V364 = ROOT / "dist/science/kerr-detector-calibration-pack-v364/pack.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-response-v426/python-response-oracle.json"
LOCKS = {
    V425: ("efc3a55ce483f5cf0eb99d582d078186e4287aca582fe6b61bb19dbbad3909e4", "36cd452f7e94d38da5b4877b9c57304ede3cc45475a02d1c8250e12d1f6e189b"),
    V363: ("5b6e8b0cdcfc0a9c47d0f9387677ab2ab4e9912c7c061ce894a952d0f723accf", "33ab861e95b5442c7911851d7f90fc409c65a2404b6af3eb4456e062914a0089"),
    V364: ("537b15b1268faa38689bb59f556373407eab2795516e930452604256a83612b6", "8dd15d6bcc8a26cf71c683ca13bcd7898e3cefc3153d493b156348f5371c01e1"),
}


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def text_sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def covariance_simplex(size: int, sigma2: float) -> list[list[float]]:
    return [[sigma2 * ((1.0 if row == column else 0.0) - 1.0 / size) for column in range(size)] for row in range(size)]


def main() -> None:
    sources = {path: json.loads(path.read_text(encoding="utf-8")) for path in LOCKS}
    for path, (expected_file, expected_artifact) in LOCKS.items():
        if file_sha(path) != expected_file or sources[path].get("artifactSha256") != expected_artifact:
            raise RuntimeError(f"v426-source-lock:{path.name}")
    v425, v363, v364 = sources[V425], sources[V363], sources[V364]
    if v425["view"]["counts"]["sourcePredictionCount"] != 24 or v363["counts"]["bandCount"] != 3 or v364["counts"]["measuredDataRowCount"] != 0:
        raise RuntimeError("v426-source-boundary")
    edges = [30.0, 60.0, 150.0, 500.0, 1500.0, 3000.0, 5000.0]
    redistribution = []
    for index in range(6):
        row = [0.0] * 6
        if index == 0:
            row[0], row[1] = 0.9, 0.1
        elif index == 5:
            row[4], row[5] = 0.1, 0.9
        else:
            row[index - 1], row[index], row[index + 1] = 0.1, 0.8, 0.1
        redistribution.append(row)
    response_covariance = [[1e-8 * (1 + row * 0.01) if row == column else 0.0 for column in range(24)] for row in range(24)]
    redistribution_covariances = [covariance_simplex(6, 1e-8 * (1 + index * 0.05)) for index in range(6)]
    labels = ["identity", "effective-area", "modulation", "redistribution", "background", "covariance", "processing"]
    shas = {label: text_sha(f"v426-declared-test-fixture:{label}") for label in labels}
    manifest = {
        "version": "v426-kerr-high-energy-instrument-response-contract-v1",
        "sourceKind": "test-fixture",
        "identity": {
            "measuredAcquisition": False,
            "architecture": "band-appropriate-energy-resolved-polarimeter",
            "manufacturer": "Orbit Atlas fixture",
            "model": "compiler-validation-only",
            "serialOrCampaignId": "v426-nonpublishable-fixture",
            "performedAtUtc": "2026-01-01T00:00:00Z",
            "laboratoryOrArchive": "synthetic-fixture-no-laboratory",
        },
        "energyDomainEv": [30.0, 5000.0],
        "trueEnergyEdgesEv": edges,
        "detectorChannelEdgesEv": edges,
        "response": {
            "effectiveAreaM2": [0.010, 0.012, 0.014, 0.016, 0.015, 0.013],
            "effectiveAreaIncludesQuantumEfficiency": True,
            "modulationFactor": [0.20, 0.24, 0.30, 0.36, 0.42, 0.46],
            "polarizationAngleZeroDeg": [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0],
            "redistributionMatrix": redistribution,
            "backgroundRateCountsPerS": [0.010, 0.012, 0.016, 0.022, 0.030, 0.040],
            "responseParameterOrder": "effective-area-then-modulation-factor-then-angle-zero-then-background",
            "responseParameterCovariance": response_covariance,
            "redistributionRowCovariances": redistribution_covariances,
        },
        "acquisition": {
            "exposureTimeS": 1000.0,
            "detectorTemperatureK": 173.15,
            "deadTimeModel": "fixture-none",
            "pileupModel": "fixture-none",
        },
        "provenance": {
            "sourceUrl": None,
            "licenseOrTerms": "declared internal nonpublishable test fixture",
            "identityFileSha256": shas["identity"],
            "effectiveAreaFileSha256": shas["effective-area"],
            "modulationFileSha256": shas["modulation"],
            "redistributionFileSha256": shas["redistribution"],
            "backgroundFileSha256": shas["background"],
            "covarianceFileSha256": shas["covariance"],
            "processingParametersSha256": shas["processing"],
            "attestation": "declared-test-fixture-nonpublishable",
        },
    }
    response_cov = np.asarray(response_covariance, dtype=float)
    redistribution_cov = [np.asarray(matrix, dtype=float) for matrix in redistribution_covariances]
    metrics = {
        "energyEdgesStrictlyIncreasing": True,
        "channelEdgesStrictlyIncreasing": True,
        "maximumRedistributionRowSumAbsolute": max(abs(sum(row) - 1.0) for row in redistribution),
        "minimumRedistributionProbability": min(min(row) for row in redistribution),
        "maximumRedistributionProbability": max(max(row) for row in redistribution),
        "minimumEffectiveAreaM2": min(manifest["response"]["effectiveAreaM2"]),
        "maximumEffectiveAreaM2": max(manifest["response"]["effectiveAreaM2"]),
        "minimumModulationFactor": min(manifest["response"]["modulationFactor"]),
        "maximumModulationFactor": max(manifest["response"]["modulationFactor"]),
        "maximumResponseCovarianceSymmetryAbsolute": float(np.max(np.abs(response_cov - response_cov.T))),
        "minimumResponseCovarianceEigenvalue": float(np.min(np.linalg.eigvalsh(response_cov))),
        "maximumRedistributionCovarianceSymmetryAbsolute": max(float(np.max(np.abs(matrix - matrix.T))) for matrix in redistribution_cov),
        "minimumRedistributionCovarianceEigenvalue": min(float(np.min(np.linalg.eigvalsh(matrix))) for matrix in redistribution_cov),
        "maximumRedistributionCovarianceSimplexResidual": max(float(np.max(np.abs(np.sum(matrix, axis=1)))) for matrix in redistribution_cov),
        "maximumPythonOracleDifference": 0.0,
    }
    energies = [row["photonEnergyEv"] for row in v425["view"]["rows"]]
    if len(energies) != 24 or not all(edges[0] <= energy <= edges[-1] for energy in energies) or metrics["maximumRedistributionRowSumAbsolute"] >= 1e-12 or metrics["minimumResponseCovarianceEigenvalue"] < -1e-12 or metrics["minimumRedistributionCovarianceEigenvalue"] < -1e-12 or metrics["maximumRedistributionCovarianceSimplexResidual"] >= 1e-12:
        raise RuntimeError(f"v426-oracle-gate:{metrics}")
    unsigned = {
        "version": "v426-kerr-high-energy-response-python-oracle-v1",
        "generatedAt": v425["generatedAt"],
        "status": "qualified-high-energy-response-fixture-compiler-oracle-no-measured-authority",
        "source": {"v425ArtifactSha256": LOCKS[V425][1], "v363ArtifactSha256": LOCKS[V363][1], "v364ArtifactSha256": LOCKS[V364][1]},
        "manifest": manifest,
        "metrics": metrics,
        "counts": {"trueEnergyBinCount": 6, "detectorChannelCount": 6, "responseParameterCount": 24, "redistributionElementCount": 36, "v425CoveredSourcePredictionCount": 24},
        "fixturePerformanceAuthority": False,
        "measuredResponseAuthority": False,
        "scienceResponseApplicationCount": 0,
        "denseShardExecuted": False,
        "boundary": "nonpublishable-compiler-fixture-only-no-science-response-authority",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic_json(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "counts": artifact["counts"], "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()

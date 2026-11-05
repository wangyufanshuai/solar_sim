from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
SOURCE_ARTIFACT = ROOT / "dist/science/kerr-high-energy-response-uncertainty-v429/response-uncertainty.json"
SOURCE_ORACLE = ROOT / "dist/science/kerr-high-energy-response-uncertainty-v429/uncertainty-oracle.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-count-likelihood-v430"
ORACLE = OUTPUT / "count-likelihood-oracle.json"
CONTRACT = OUTPUT / "likelihood-contract.json"
EXPECTED_ARTIFACT_FILE_SHA = "fbf01ca284af3a8eaaa561b66c73d090202206f9635428330450616ab31ddfde"
EXPECTED_ARTIFACT_SHA = "aa176b9546928c880b9ab72ef49f8223a552fc08025cec2ccedc1add49d15e8d"
EXPECTED_ORACLE_FILE_SHA = "1b66c6080a770e7223e660fb9a879dc955580a55a0a08d9b475236d68e342909"
EXPECTED_ORACLE_SHA = "06ba28b689b65ce6ee1aaa1c61146c5302099d0f4ddfaa750ad50ea3831bb592"
SEED = 43020260730


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(value: Any) -> Any:
    if isinstance(value, list):
        return [normalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: normalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(normalize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def poisson_log_likelihood(observed: np.ndarray, expected: np.ndarray) -> float:
    return float(sum(value * math.log(mean) - mean - math.lgamma(value + 1.0) for value, mean in zip(observed, expected, strict=True)))


def deviance_contributions(observed: np.ndarray, expected: np.ndarray) -> np.ndarray:
    values = np.zeros_like(expected)
    positive = observed > 0
    values[positive] = 2.0 * (observed[positive] * np.log(observed[positive] / expected[positive]) - (observed[positive] - expected[positive]))
    values[~positive] = 2.0 * expected[~positive]
    return values


def group_closure(residual: np.ndarray, covariance: np.ndarray, groups: list[list[int]]) -> tuple[list[float], list[float]]:
    sums: list[float] = []
    z_scores: list[float] = []
    for indices in groups:
        sub = covariance[np.ix_(indices, indices)]
        variance = float(np.sum(sub))
        value = float(np.sum(residual[indices]))
        sums.append(value)
        z_scores.append(value / math.sqrt(variance) if variance > 0 else float("nan"))
    return sums, z_scores


def main() -> None:
    if file_sha(SOURCE_ARTIFACT) != EXPECTED_ARTIFACT_FILE_SHA or file_sha(SOURCE_ORACLE) != EXPECTED_ORACLE_FILE_SHA:
        raise RuntimeError("v430-source-file-lock")
    artifact = json.loads(SOURCE_ARTIFACT.read_text(encoding="utf-8"))
    source = json.loads(SOURCE_ORACLE.read_text(encoding="utf-8"))
    if artifact.get("artifactSha256") != EXPECTED_ARTIFACT_SHA or source.get("artifactSha256") != EXPECTED_ORACLE_SHA or artifact.get("view", {}).get("counts", {}).get("observedCountCount") != 0:
        raise RuntimeError("v430-source-authority-lock")
    expected = np.asarray(source["expected"]["predictedCounts"], dtype=np.float64)
    response_covariance = np.asarray(source["expected"]["totalCovariance"], dtype=np.float64)
    if expected.shape != (24,) or response_covariance.shape != (24, 24) or np.any(expected <= 0):
        raise RuntimeError("v430-source-shape")
    rng = np.random.Generator(np.random.PCG64(SEED))
    simulated = rng.poisson(expected).astype(np.int64)
    residual = simulated.astype(np.float64) - expected
    pearson = residual / np.sqrt(expected)
    deviance = deviance_contributions(simulated.astype(np.float64), expected)
    deviance_residual = np.sign(residual) * np.sqrt(np.maximum(deviance, 0.0))
    predictive_covariance = response_covariance + np.diag(expected)
    eigenvalues, eigenvectors = np.linalg.eigh(predictive_covariance)
    cutoff = float(np.max(eigenvalues) * len(eigenvalues) * np.finfo(np.float64).eps)
    retained = eigenvalues > cutoff
    inverse_sqrt = eigenvectors[:, retained] @ np.diag(1.0 / np.sqrt(eigenvalues[retained])) @ eigenvectors[:, retained].T
    pseudo_inverse = eigenvectors[:, retained] @ np.diag(1.0 / eigenvalues[retained]) @ eigenvectors[:, retained].T
    whitened = inverse_sqrt @ residual
    mahalanobis = float(residual @ pseudo_inverse @ residual)
    direct_mahalanobis = float(whitened @ whitened)
    angle_groups = [list(range(angle * 6, angle * 6 + 6)) for angle in range(4)]
    channel_groups = [[angle * 6 + channel for angle in range(4)] for channel in range(6)]
    angle_sums, angle_z = group_closure(residual, predictive_covariance, angle_groups)
    channel_sums, channel_z = group_closure(residual, predictive_covariance, channel_groups)
    log_likelihood = poisson_log_likelihood(simulated, expected)
    replay = np.random.Generator(np.random.PCG64(SEED)).poisson(expected).astype(np.int64)
    metrics = {
        "poissonLogLikelihood": log_likelihood,
        "poissonDeviance": float(np.sum(deviance)),
        "pearsonChiSquare": float(np.sum(pearson * pearson)),
        "predictiveMahalanobisSquared": mahalanobis,
        "whitenedNormSquared": direct_mahalanobis,
        "maximumMahalanobisIdentityDifference": abs(mahalanobis - direct_mahalanobis),
        "predictiveCovarianceSymmetryAbsolute": float(np.max(np.abs(predictive_covariance - predictive_covariance.T))),
        "minimumPredictiveCovarianceEigenvalue": float(np.min(eigenvalues)),
        "pseudoInverseCutoff": cutoff,
        "effectiveCovarianceRank": int(np.count_nonzero(retained)),
        "maximumAbsolutePearsonResidual": float(np.max(np.abs(pearson))),
        "maximumAbsoluteDevianceResidual": float(np.max(np.abs(deviance_residual))),
        "maximumAbsoluteWhitenedResidual": float(np.max(np.abs(whitened))),
        "maximumAbsoluteAngleClosureZ": float(np.max(np.abs(angle_z))),
        "maximumAbsoluteChannelClosureZ": float(np.max(np.abs(channel_z))),
        "maximumDeterministicReplayCountDifference": int(np.max(np.abs(simulated - replay))),
    }
    if not all(math.isfinite(value) for value in metrics.values()) or metrics["maximumMahalanobisIdentityDifference"] >= 1e-10 or metrics["predictiveCovarianceSymmetryAbsolute"] >= 1e-6 or metrics["minimumPredictiveCovarianceEigenvalue"] <= 0 or metrics["effectiveCovarianceRank"] != 24 or metrics["maximumDeterministicReplayCountDifference"] != 0:
        raise RuntimeError(f"v430-oracle-gate:{metrics}")
    fixture = {
        "version": "v430-kerr-high-energy-count-likelihood-fixture-v1",
        "sourceKind": "simulated-counts-fixed-seed-nonpublishable",
        "randomGenerator": "numpy-PCG64",
        "seed": SEED,
        "predictedCounts": expected.tolist(),
        "simulatedCounts": simulated.tolist(),
        "responsePredictiveCovariance": response_covariance.tolist(),
        "totalPredictiveCovariance": predictive_covariance.tolist(),
        "measuredObservedCounts": None,
        "measuredHoldoutDataset": None,
        "measuredAuthorityGranted": False,
    }
    diagnostics = {
        "rawResidual": residual.tolist(),
        "pearsonResidual": pearson.tolist(),
        "devianceContribution": deviance.tolist(),
        "devianceResidual": deviance_residual.tolist(),
        "whitenedResidual": whitened.tolist(),
        "angleClosureSums": angle_sums,
        "angleClosureZ": angle_z,
        "channelClosureSums": channel_sums,
        "channelClosureZ": channel_z,
        "metrics": metrics,
    }
    unsigned = {
        "version": "v430-kerr-high-energy-count-likelihood-python-oracle-v1",
        "generatedAt": artifact["generatedAt"],
        "status": "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-no-measured-validation",
        "sourceV429ArtifactSha256": EXPECTED_ARTIFACT_SHA,
        "sourceV429ArtifactFileSha256": EXPECTED_ARTIFACT_FILE_SHA,
        "sourceV429OracleSha256": EXPECTED_ORACLE_SHA,
        "sourceV429OracleFileSha256": EXPECTED_ORACLE_FILE_SHA,
        "fixture": fixture,
        "diagnostics": diagnostics,
        "counts": {"predictedCountCount": 24, "simulatedCountCount": 24, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "fixtureResidualVectorCount": 5, "fixtureClosureGroupCount": 10, "measuredResidualMetricCount": 0, "measuredValidationRunCount": 0, "scienceResponseApplicationCount": 0},
        "qualification": {"poissonLikelihoodEngineQualified": True, "devianceResidualEngineQualified": True, "pearsonResidualEngineQualified": True, "predictiveCovarianceWhiteningQualified": True, "angleAndChannelClosureQualified": True, "fixedSeedReplayQualified": True, "measuredLikelihoodQualified": False, "measuredResidualClosureQualified": False, "scienceResponseApplicationQualified": False},
        "independentScientificValidationStatus": "not-run-no-measured-holdout",
        "measuredResponseAuthorityGranted": False,
        "scienceResponseApplicationCount": 0,
        "networkAttempted": False,
        "boundary": "fixed-seed-simulated-counts-validate-likelihood-and-residual-mathematics-only-no-measured-observations-holdout-or-authority",
    }
    oracle = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    contract = {
        "version": "v430-kerr-high-energy-count-likelihood-contract-v1",
        "status": "contract-ready-awaiting-measured-count-likelihood-declaration",
        "poissonAllowedOnlyWhen": {"integerEventCounts": True, "conditionalIndependenceQualified": True, "liveTimeKnown": True, "deadTimeModelQualified": True, "pileupModelQualified": True, "backgroundModelQualified": True, "overdispersionRejectedByPreregisteredTest": True},
        "alternativeLikelihoodRequiredWhen": ["overdispersion", "event-correlation", "unresolved-dead-time", "unresolved-pileup", "background-mixture", "weighted-or-fractional-counts"],
        "predictiveCovariance": {"poissonCountingVarianceIncluded": True, "responseCovarianceIncluded": True, "redistributionCovarianceIncluded": True, "crossChannelTermsPreserved": True, "pseudoInverseCutoffRecorded": True, "rankRecorded": True},
        "requiredDiagnostics": ["log-likelihood", "deviance", "Pearson-residual", "deviance-residual", "whitened-residual", "angle-closure", "channel-closure", "covariance-rank", "deterministic-replay"],
        "inferencePolicy": {"fixtureGoodnessOfFitNeverInstrumentPerformance": True, "measuredThresholdsPreregistered": True, "multipleComparisonControlRequired": True, "effectSizeAndIntervalRequired": True, "postHocLikelihoodSwitchForbidden": True, "negativeEvidencePreserved": True},
        "admission": {"simulatedFixtureNeverAdmissible": True, "measuredObservedCountsRequired": True, "independentHoldoutRequired": True, "allLikelihoodAssumptionsMustBeResolved": True, "measuredAuthorityGranted": False, "currentStatus": "not-run-no-measured-holdout"},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "likelihood-contract-does-not-select-or-qualify-a-measured-likelihood-without-independent-count-data",
    }
    atomic_json(CONTRACT, contract)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "counts": oracle["counts"], "metrics": metrics, "measuredValidation": oracle["independentScientificValidationStatus"], "measuredAuthority": False, "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

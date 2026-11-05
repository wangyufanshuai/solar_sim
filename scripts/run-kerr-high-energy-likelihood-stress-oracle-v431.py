from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any, Callable

import numpy as np
from scipy.stats import poisson


ROOT = Path.cwd()
SOURCE_ROOT = ROOT / "dist/science/kerr-high-energy-count-likelihood-v430"
SOURCE_ARTIFACT = SOURCE_ROOT / "count-likelihood.json"
SOURCE_ORACLE = SOURCE_ROOT / "count-likelihood-oracle.json"
SOURCE_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v430-evidence.json"
SOURCE_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-likelihood-stress-v431"
ORACLE = OUTPUT / "likelihood-stress-oracle.json"
CONTRACT = OUTPUT / "likelihood-stress-contract.json"
EXPECTED = {
    "artifactCanonical": "e666aa7c7d7f65dcc65e91e3e1075b60752f1996aa5d7deba6878c6b26bd7405",
    "artifactFile": "18ac4d640611a6308f7a8275a755cb0d028094e6b734190d4f428065b76fe9c8",
    "oracleCanonical": "8c687b293a3b8792767e4ff515932bd31d8e520b28207663e0601ec36b336294",
    "oracleFile": "e620adc324a0bdd37075fa0ddbd1e2ba567a414a7dd16f5ce8e3025a38d68ec7",
    "evidenceCanonical": "9717bf3d26c3bd58b2b53dd013f2ae7199d20dea6c16fc432004d025950ca84e",
    "evidenceFile": "d79310afbd221891ec9f50424d9f0ab0e2328b0e7ac19a71cc7a544307fd4d19",
    "pointerCanonical": "1f3c0458df3205eaa2229ebb2a0fcdf7d0e6fd94eafc763002e576582e355abf",
    "pointerFile": "64507219eddbb2956d31e4b257bb1d075ea082f0879667e700f3a7bff18bda7e",
}
SEED = 43120260730
CALIBRATION_REPLICATES = 256
HOLDOUT_REPLICATES = 256


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


def generate_nominal(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    return rng.poisson(mean, size=(replicates, mean.size)).astype(np.int64)


def generate_overdispersed(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    alpha = 2.0e-5
    latent = rng.gamma(shape=1.0 / alpha, scale=mean * alpha, size=(replicates, mean.size))
    return rng.poisson(latent).astype(np.int64)


def generate_correlated(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    sigma = 8.0e-3
    common = np.exp(rng.normal(-0.5 * sigma * sigma, sigma, size=(replicates, 1)))
    return rng.poisson(common * mean.reshape(1, -1)).astype(np.int64)


def generate_background_mixture(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    base = rng.poisson(mean, size=(replicates, mean.size)).astype(np.int64)
    active = (rng.random((replicates, 1)) < 0.12).astype(np.float64)
    background = rng.poisson(active * mean.reshape(1, -1) * 0.02).astype(np.int64)
    return base + background


def generate_dead_time(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    coefficient = 0.04 / float(np.mean(mean))
    effective = mean / (1.0 + coefficient * mean)
    return rng.poisson(effective, size=(replicates, mean.size)).astype(np.int64)


def generate_pileup_migration(rng: np.random.Generator, mean: np.ndarray, replicates: int) -> np.ndarray:
    fraction = 0.015
    result = np.zeros((replicates, mean.size), dtype=np.int64)
    for angle in range(4):
        start = angle * 6
        source = rng.poisson(mean[start:start + 6], size=(replicates, 6)).astype(np.int64)
        moved = rng.binomial(source[:, :5], fraction).astype(np.int64)
        source[:, :5] -= moved
        source[:, 1:] += moved
        result[:, start:start + 6] = source
    return result


GENERATORS: dict[str, Callable[[np.random.Generator, np.ndarray, int], np.ndarray]] = {
    "poisson-nominal": generate_nominal,
    "negative-binomial-overdispersion": generate_overdispersed,
    "correlated-common-mode": generate_correlated,
    "background-mixture": generate_background_mixture,
    "nonparalyzable-dead-time": generate_dead_time,
    "pileup-channel-migration": generate_pileup_migration,
}


SCENARIOS = [
    {"id": "poisson-nominal", "stressKind": "none", "poissonAdmissibleByProvenance": True, "requiredLikelihoodFamily": "poisson", "expectedPoissonDisposition": "retain"},
    {"id": "negative-binomial-overdispersion", "stressKind": "overdispersion", "poissonAdmissibleByProvenance": False, "requiredLikelihoodFamily": "negative-binomial-or-quasi-poisson", "expectedPoissonDisposition": "reject-before-fit"},
    {"id": "correlated-common-mode", "stressKind": "event-correlation", "poissonAdmissibleByProvenance": False, "requiredLikelihoodFamily": "hierarchical-poisson-lognormal", "expectedPoissonDisposition": "reject-before-fit"},
    {"id": "background-mixture", "stressKind": "background-mixture", "poissonAdmissibleByProvenance": False, "requiredLikelihoodFamily": "poisson-background-mixture", "expectedPoissonDisposition": "reject-before-fit"},
    {"id": "nonparalyzable-dead-time", "stressKind": "unresolved-dead-time", "poissonAdmissibleByProvenance": False, "requiredLikelihoodFamily": "dead-time-aware-renewal", "expectedPoissonDisposition": "reject-before-fit"},
    {"id": "pileup-channel-migration", "stressKind": "unresolved-pileup", "poissonAdmissibleByProvenance": False, "requiredLikelihoodFamily": "pileup-aware-marked-event", "expectedPoissonDisposition": "reject-before-fit"},
]


THRESHOLDS = {
    "poisson-nominal": {"poissonPredictiveCoverage90Minimum": 0.88, "poissonPredictiveCoverage90Maximum": 0.92, "meanPearsonChiSquarePerDofMinimum": 0.90, "meanPearsonChiSquarePerDofMaximum": 1.10, "meanAbsoluteOffDiagonalResidualCorrelationMaximum": 0.06, "maximumAbsoluteStandardizedMeanBiasMaximum": 0.25},
    "negative-binomial-overdispersion": {"meanVarianceToPoissonRatioMinimum": 2.0, "poissonPredictiveCoverage90Maximum": 0.88},
    "correlated-common-mode": {"meanAbsoluteOffDiagonalResidualCorrelationMinimum": 0.20, "poissonPredictiveCoverage90Maximum": 0.88},
    "background-mixture": {"poissonPredictiveCoverage90Maximum": 0.88, "maximumAbsoluteStandardizedMeanBiasMinimum": 0.50},
    "nonparalyzable-dead-time": {"maximumAbsoluteStandardizedMeanBiasMinimum": 5.0, "poissonPredictiveCoverage90Maximum": 0.50},
    "pileup-channel-migration": {"maximumAbsoluteStandardizedMeanBiasMinimum": 3.0, "maximumAbsoluteMeanChannelClosureZMinimum": 3.0},
}


def diagnostics(counts: np.ndarray, mean: np.ndarray, covariance: np.ndarray, lower: np.ndarray, upper: np.ndarray) -> dict[str, float | int]:
    residual = counts.astype(np.float64) - mean.reshape(1, -1)
    empirical_mean = np.mean(counts, axis=0)
    empirical_variance = np.var(counts, axis=0, ddof=1)
    pearson = np.sum(residual * residual / mean.reshape(1, -1), axis=1) / mean.size
    positive = counts > 0
    contribution = np.empty_like(residual)
    contribution[positive] = 2.0 * (counts[positive] * np.log(counts[positive] / np.broadcast_to(mean, counts.shape)[positive]) - residual[positive])
    contribution[~positive] = 2.0 * np.broadcast_to(mean, counts.shape)[~positive]
    deviance = np.sum(contribution, axis=1) / mean.size
    correlation = np.corrcoef(residual, rowvar=False)
    off_diagonal = np.abs(correlation[~np.eye(mean.size, dtype=bool)])
    standardized_bias = np.abs(empirical_mean - mean) / np.sqrt(mean)
    coverage = np.mean((counts >= lower.reshape(1, -1)) & (counts <= upper.reshape(1, -1)))
    angle_groups = [list(range(angle * 6, angle * 6 + 6)) for angle in range(4)]
    channel_groups = [[angle * 6 + channel for angle in range(4)] for channel in range(6)]

    def closure(groups: list[list[int]]) -> tuple[float, float]:
        values = []
        means = []
        for indices in groups:
            variance = float(np.sum(covariance[np.ix_(indices, indices)]))
            z = np.sum(residual[:, indices], axis=1) / math.sqrt(variance)
            values.extend(z.tolist())
            means.append(float(np.mean(z)))
        return float(math.sqrt(np.mean(np.square(values)))), float(np.max(np.abs(means)))

    angle_rms, angle_mean_max = closure(angle_groups)
    channel_rms, channel_mean_max = closure(channel_groups)
    return {
        "replicateCount": int(counts.shape[0]),
        "countCellCount": int(counts.size),
        "meanPoissonDeviancePerDof": float(np.mean(deviance)),
        "meanPearsonChiSquarePerDof": float(np.mean(pearson)),
        "meanVarianceToPoissonRatio": float(np.mean(empirical_variance / mean)),
        "meanAbsoluteOffDiagonalResidualCorrelation": float(np.mean(off_diagonal)),
        "poissonPredictiveCoverage90": float(coverage),
        "poissonPredictiveTailRate": float(1.0 - coverage),
        "maximumAbsoluteStandardizedMeanBias": float(np.max(standardized_bias)),
        "angleClosureRmsZ": angle_rms,
        "channelClosureRmsZ": channel_rms,
        "maximumAbsoluteMeanAngleClosureZ": angle_mean_max,
        "maximumAbsoluteMeanChannelClosureZ": channel_mean_max,
    }


def gate(scenario_id: str, metrics: dict[str, float | int]) -> bool:
    limits = THRESHOLDS[scenario_id]
    for key, value in limits.items():
        metric_name = key.removesuffix("Minimum").removesuffix("Maximum")
        metric_value = float(metrics[metric_name])
        if key.endswith("Minimum") and metric_value < value:
            return False
        if key.endswith("Maximum") and metric_value > value:
            return False
    return True


def main() -> None:
    sources = [
        (SOURCE_ARTIFACT, "artifactFile"),
        (SOURCE_ORACLE, "oracleFile"),
        (SOURCE_EVIDENCE, "evidenceFile"),
        (SOURCE_POINTER, "pointerFile"),
    ]
    if any(file_sha(path) != EXPECTED[key] for path, key in sources):
        raise RuntimeError("v431-source-file-lock")
    artifact = json.loads(SOURCE_ARTIFACT.read_text(encoding="utf-8"))
    source = json.loads(SOURCE_ORACLE.read_text(encoding="utf-8"))
    evidence = json.loads(SOURCE_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(SOURCE_POINTER.read_text(encoding="utf-8"))
    if artifact.get("artifactSha256") != EXPECTED["artifactCanonical"] or source.get("artifactSha256") != EXPECTED["oracleCanonical"] or evidence.get("evidenceSha256") != EXPECTED["evidenceCanonical"] or pointer.get("pointerSha256") != EXPECTED["pointerCanonical"]:
        raise RuntimeError("v431-source-canonical-lock")
    mean = np.asarray(source["fixture"]["predictedCounts"], dtype=np.float64)
    covariance = np.asarray(source["fixture"]["totalPredictiveCovariance"], dtype=np.float64)
    lower = poisson.ppf(0.05, mean).astype(np.int64)
    upper = poisson.ppf(0.95, mean).astype(np.int64)
    if mean.shape != (24,) or covariance.shape != (24, 24) or np.any(mean <= 0) or np.any(lower > upper):
        raise RuntimeError("v431-source-shape")
    results = []
    for index, scenario in enumerate(SCENARIOS):
        generator = GENERATORS[scenario["id"]]
        calibration_seed = SEED + index * 2
        holdout_seed = calibration_seed + 1
        calibration = generator(np.random.default_rng(calibration_seed), mean, CALIBRATION_REPLICATES)
        holdout = generator(np.random.default_rng(holdout_seed), mean, HOLDOUT_REPLICATES)
        replay = generator(np.random.default_rng(holdout_seed), mean, HOLDOUT_REPLICATES)
        calibration_metrics = diagnostics(calibration, mean, covariance, lower, upper)
        holdout_metrics = diagnostics(holdout, mean, covariance, lower, upper)
        deterministic = bool(np.array_equal(holdout, replay))
        calibration_gate = gate(scenario["id"], calibration_metrics)
        holdout_gate = gate(scenario["id"], holdout_metrics)
        if not deterministic or not calibration_gate or not holdout_gate:
            raise RuntimeError(f"v431-scenario-gate:{scenario['id']}:{json.dumps({'calibration': calibration_metrics, 'holdout': holdout_metrics}, sort_keys=True)}")
        results.append({
            **scenario,
            "calibrationSeed": calibration_seed,
            "holdoutSeed": holdout_seed,
            "calibrationMetrics": calibration_metrics,
            "holdoutMetrics": holdout_metrics,
            "calibrationGatePassed": calibration_gate,
            "holdoutGatePassed": holdout_gate,
            "deterministicReplayPassed": deterministic,
            "holdoutCounts": holdout.tolist(),
        })
    contract = {
        "version": "v431-kerr-high-energy-likelihood-stress-contract-v1",
        "status": "preregistered-simulated-stress-routing-contract-ready",
        "selectionBasis": "acquisition-provenance-and-preregistered-assumption-state-before-residual-fit",
        "postHocLikelihoodSwitchForbidden": True,
        "residualDiagnosticsMayAuditButNeverSelectFamily": True,
        "scenarioThresholds": THRESHOLDS,
        "scenarioRouting": [{key: entry[key] for key in ["id", "stressKind", "poissonAdmissibleByProvenance", "requiredLikelihoodFamily", "expectedPoissonDisposition"]} for entry in SCENARIOS],
        "alternativeLikelihoodImplementationsQualified": [],
        "measuredObservedCountsRequiredForInstrumentAuthority": True,
        "independentMeasuredHoldoutRequired": True,
        "measuredAuthorityGranted": False,
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "internal-preregistered-routing-contract-does-not-qualify-any-alternative-likelihood-or-measured-instrument-performance",
    }
    unsigned = {
        "version": "v431-kerr-high-energy-likelihood-stress-python-oracle-v1",
        "generatedAt": artifact["generatedAt"],
        "status": "qualified-simulated-likelihood-stress-discriminator-and-preregistered-routing-firewall-no-measured-authority",
        "sourceV430ArtifactSha256": EXPECTED["artifactCanonical"],
        "sourceV430ArtifactFileSha256": EXPECTED["artifactFile"],
        "sourceV430OracleSha256": EXPECTED["oracleCanonical"],
        "sourceV430OracleFileSha256": EXPECTED["oracleFile"],
        "prediction": {"countCellCount": 24, "predictedCounts": mean.tolist(), "totalPredictiveCovariance": covariance.tolist(), "poissonPredictiveLower90": lower.tolist(), "poissonPredictiveUpper90": upper.tolist()},
        "campaign": {"seed": SEED, "scenarioCount": len(SCENARIOS), "calibrationReplicatesPerScenario": CALIBRATION_REPLICATES, "holdoutReplicatesPerScenario": HOLDOUT_REPLICATES, "results": results},
        "counts": {"scenarioCount": 6, "calibrationReplicateCount": 1536, "syntheticHoldoutReplicateCount": 1536, "syntheticCountCellCount": 73728, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "measuredValidationRunCount": 0, "measuredResidualMetricCount": 0, "alternativeLikelihoodImplementationQualifiedCount": 0, "scienceResponseApplicationCount": 0},
        "qualification": {"syntheticStressGenerationQualified": True, "nominalPoissonRecoveryQualified": True, "overdispersionDiscriminatorQualified": True, "correlationDiscriminatorQualified": True, "backgroundMixtureDiscriminatorQualified": True, "deadTimeDiscriminatorQualified": True, "pileupMigrationDiscriminatorQualified": True, "preregisteredRoutingFirewallQualified": True, "deterministicReplayQualified": True, "alternativeLikelihoodImplementationQualified": False, "measuredLikelihoodQualified": False, "measuredInstrumentPerformanceQualified": False},
        "measuredResponseAuthorityGranted": False,
        "scienceResponseApplicationCount": 0,
        "networkAttempted": False,
        "boundary": "fixed-seed-simulated-stress-campaign-validates-assumption-failure-discrimination-and-routing-firewall-only-not-alternative-likelihoods-measured-goodness-of-fit-instrument-performance-or-science-response",
    }
    oracle = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    atomic_json(CONTRACT, contract)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "counts": oracle["counts"], "scenarios": [{"id": item["id"], "family": item["requiredLikelihoodFamily"], "holdout": item["holdoutMetrics"]} for item in results], "measuredAuthority": False, "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

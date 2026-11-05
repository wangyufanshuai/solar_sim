from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np
from scipy.special import logsumexp
from scipy.stats import nbinom, poisson


ROOT = Path.cwd()
V431_ROOT = ROOT / "dist/science/kerr-high-energy-likelihood-stress-v431"
SOURCE_ARTIFACT = V431_ROOT / "likelihood-stress.json"
SOURCE_ORACLE = V431_ROOT / "likelihood-stress-oracle.json"
SOURCE_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v431-evidence.json"
SOURCE_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v431.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-likelihood-authority-v432"
ORACLE = OUTPUT / "likelihood-authority-oracle.json"
CONTRACT = OUTPUT / "likelihood-authority-contract.json"

EXPECTED = {
    "artifactCanonical": "291e960f25529c371f297deccdb3d436778ce905fbd29acea807887894d0c7e6",
    "artifactFile": "034132d9396712924d8cf88992bbfd60c60f3d1a6fe248e69843aaf625c94400",
    "oracleCanonical": "55fe6c8fb0621444cd2687aa66607c394e6e15bb7c37b6ee80a2d3330f91fdd2",
    "oracleFile": "bf57f621e55acf3a08676cc5412ddd99283aadf034a33bf4e37d437e449a9199",
    "evidenceCanonical": "6c9d3b11696d80376c9522bb0ba653c89d72527f7e5d5a838c1d6a692607404c",
    "evidenceFile": "0d0cc01179ccdda30a7f06952c5a3d1c1f6239b05627659f7fea92637a3d8125",
    "pointerCanonical": "8136f9c26a4d73cdaa399f4c5f916052a0e40f41ee096cc43bd072ac2392b541",
    "pointerFile": "e112295c65a1cccc84039a53f046a2c5249b21338568534dbf3d338c1ad5a2bd",
}
SEED = 43220260730
CALIBRATION_REPLICATES = 256
HOLDOUT_REPLICATES = 256
NB_ALPHA_TRUE = 2.0e-5
PLN_SIGMA_TRUE = 8.0e-3
QUADRATURE_NODES, QUADRATURE_WEIGHTS = np.polynomial.hermite.hermgauss(32)


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


def generate_negative_binomial(rng: np.random.Generator, mean: np.ndarray, replicates: int, alpha: float = NB_ALPHA_TRUE) -> np.ndarray:
    latent = rng.gamma(shape=1.0 / alpha, scale=mean * alpha, size=(replicates, mean.size))
    return rng.poisson(latent).astype(np.int64)


def generate_poisson_lognormal(rng: np.random.Generator, mean: np.ndarray, replicates: int, sigma: float = PLN_SIGMA_TRUE) -> np.ndarray:
    factor = np.exp(rng.normal(-0.5 * sigma * sigma, sigma, size=(replicates, 1)))
    return rng.poisson(factor * mean.reshape(1, -1)).astype(np.int64)


def fit_negative_binomial_alpha(counts: np.ndarray, mean: np.ndarray) -> float:
    residual = counts.astype(np.float64) - mean.reshape(1, -1)
    numerator = float(np.sum(residual * residual - counts))
    denominator = float(np.sum(mean * mean) * counts.shape[0])
    return max(1.0e-10, numerator / denominator)


def fit_poisson_lognormal_sigma(counts: np.ndarray, mean: np.ndarray) -> float:
    residual = counts.astype(np.float64) - mean.reshape(1, -1)
    covariance = np.cov(residual, rowvar=False, ddof=1)
    ratios: list[float] = []
    for left in range(mean.size):
        for right in range(left + 1, mean.size):
            ratios.append(float(covariance[left, right] / (mean[left] * mean[right])))
    return math.sqrt(math.log1p(max(1.0e-12, float(np.mean(ratios)))))


def poisson_log_likelihood(counts: np.ndarray, mean: np.ndarray) -> float:
    return float(np.sum(counts * np.log(mean.reshape(1, -1)) - mean.reshape(1, -1) - np.vectorize(math.lgamma)(counts + 1)))


def negative_binomial_log_likelihood(counts: np.ndarray, mean: np.ndarray, alpha: float) -> float:
    shape = 1.0 / alpha
    probability = shape / (shape + mean)
    return float(np.sum(np.vectorize(math.lgamma)(counts + shape) - math.lgamma(shape) - np.vectorize(math.lgamma)(counts + 1) + shape * np.log(probability.reshape(1, -1)) + counts * np.log1p(-probability.reshape(1, -1))))


def poisson_lognormal_log_likelihood(counts: np.ndarray, mean: np.ndarray, sigma: float) -> float:
    log_factor = -0.5 * sigma * sigma + math.sqrt(2.0) * sigma * QUADRATURE_NODES.reshape(-1, 1)
    intensity = mean.reshape(1, -1) * np.exp(log_factor)
    log_weights = np.log(QUADRATURE_WEIGHTS.reshape(-1, 1)) - 0.5 * math.log(math.pi)
    values: list[float] = []
    for row in counts:
        log_pmf = row.reshape(1, -1) * np.log(intensity) - intensity - np.vectorize(math.lgamma)(row.reshape(1, -1) + 1)
        values.append(float(logsumexp(log_weights[:, 0] + np.sum(log_pmf, axis=1))))
    return float(np.sum(values))


def predictive_intervals(model: str, mean: np.ndarray, parameter: float, seed: int) -> tuple[np.ndarray, np.ndarray, str]:
    if model == "negative-binomial":
        shape = 1.0 / parameter
        probability = shape / (shape + mean)
        return nbinom.ppf(0.05, shape, probability).astype(np.int64), nbinom.ppf(0.95, shape, probability).astype(np.int64), "exact-negative-binomial-quantile"
    rng = np.random.default_rng(seed)
    factor = np.exp(rng.normal(-0.5 * parameter * parameter, parameter, size=(20000, 1)))
    draws = rng.poisson(factor * mean.reshape(1, -1))
    return np.quantile(draws, 0.05, axis=0).astype(np.int64), np.quantile(draws, 0.95, axis=0).astype(np.int64), "fixed-seed-predictive-monte-carlo-20000"


def fit_and_score(model: str, calibration: np.ndarray, holdout: np.ndarray, mean: np.ndarray, interval_seed: int) -> dict[str, Any]:
    parameter = fit_negative_binomial_alpha(calibration, mean) if model == "negative-binomial" else fit_poisson_lognormal_sigma(calibration, mean)
    log_likelihood = negative_binomial_log_likelihood(holdout, mean, parameter) if model == "negative-binomial" else poisson_lognormal_log_likelihood(holdout, mean, parameter)
    poisson_log_likelihood_value = poisson_log_likelihood(holdout, mean)
    lower, upper, interval_method = predictive_intervals(model, mean, parameter, interval_seed)
    coverage = float(np.mean((holdout >= lower.reshape(1, -1)) & (holdout <= upper.reshape(1, -1))))
    cell_count = int(holdout.size)
    delta_aic_vs_poisson = float(2.0 * (log_likelihood - poisson_log_likelihood_value) - 2.0)
    return {"model": model, "fittedParameter": float(parameter), "trueParameter": NB_ALPHA_TRUE if model == "negative-binomial" else PLN_SIGMA_TRUE, "relativeParameterError": float(abs(parameter - (NB_ALPHA_TRUE if model == "negative-binomial" else PLN_SIGMA_TRUE)) / (NB_ALPHA_TRUE if model == "negative-binomial" else PLN_SIGMA_TRUE)), "holdoutLogLikelihood": log_likelihood, "poissonLogLikelihood": poisson_log_likelihood_value, "deltaAicVsPoisson": delta_aic_vs_poisson, "coverage90": coverage, "intervalMethod": interval_method, "lower90": lower.tolist(), "upper90": upper.tolist(), "holdoutCellCount": cell_count}


def main() -> None:
    for path, key in [(SOURCE_ARTIFACT, "artifactFile"), (SOURCE_ORACLE, "oracleFile"), (SOURCE_EVIDENCE, "evidenceFile"), (SOURCE_POINTER, "pointerFile")]:
        if file_sha(path) != EXPECTED[key]:
            raise RuntimeError("v432-source-file-lock")
    artifact = json.loads(SOURCE_ARTIFACT.read_text(encoding="utf-8"))
    source = json.loads(SOURCE_ORACLE.read_text(encoding="utf-8"))
    evidence = json.loads(SOURCE_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(SOURCE_POINTER.read_text(encoding="utf-8"))
    if artifact.get("artifactSha256") != EXPECTED["artifactCanonical"] or source.get("artifactSha256") != EXPECTED["oracleCanonical"] or evidence.get("evidenceSha256") != EXPECTED["evidenceCanonical"] or pointer.get("pointerSha256") != EXPECTED["pointerCanonical"]:
        raise RuntimeError("v432-source-canonical-lock")
    mean = np.asarray(source["prediction"]["predictedCounts"], dtype=np.float64)
    if mean.shape != (24,):
        raise RuntimeError("v432-source-shape")
    results: list[dict[str, Any]] = []
    for index, (family, generator) in enumerate([("negative-binomial", generate_negative_binomial), ("poisson-lognormal", generate_poisson_lognormal)]):
        calibration_seed = SEED + index * 2
        holdout_seed = calibration_seed + 1
        calibration = generator(np.random.default_rng(calibration_seed), mean, CALIBRATION_REPLICATES)
        holdout = generator(np.random.default_rng(holdout_seed), mean, HOLDOUT_REPLICATES)
        replay = generator(np.random.default_rng(holdout_seed), mean, HOLDOUT_REPLICATES)
        candidate_fits = [fit_and_score(model, calibration, holdout, mean, SEED + 1000 + index * 10 + candidate_index) for candidate_index, model in enumerate(["negative-binomial", "poisson-lognormal"])]
        correct = next(entry for entry in candidate_fits if entry["model"] == family)
        wrong = next(entry for entry in candidate_fits if entry["model"] != family)
        selection_delta = float(correct["holdoutLogLikelihood"] - wrong["holdoutLogLikelihood"])
        if not np.array_equal(holdout, replay) or correct["relativeParameterError"] >= 0.15 or not 0.87 <= correct["coverage90"] <= 0.93 or correct["deltaAicVsPoisson"] <= 100.0 or selection_delta <= 20.0:
            raise RuntimeError(f"v432-authority-gate:{family}:{json.dumps({'correct': correct, 'wrong': wrong, 'selectionDelta': selection_delta}, sort_keys=True)}")
        results.append({"id": f"{family}-authority", "generatingFamily": family, "calibrationSeed": calibration_seed, "holdoutSeed": holdout_seed, "calibrationReplicateCount": CALIBRATION_REPLICATES, "holdoutReplicateCount": HOLDOUT_REPLICATES, "trueParameter": correct["trueParameter"], "correctCandidate": correct, "wrongCandidate": wrong, "selectionDeltaLogLikelihood": selection_delta, "deterministicReplayPassed": True, "authorityGatePassed": True, "calibrationCounts": calibration.tolist(), "holdoutCounts": holdout.tolist()})
    contract = {"version": "v432-kerr-high-energy-likelihood-authority-contract-v1", "status": "synthetic-alternative-likelihood-authority-qualified-measured-authority-pending", "candidateModels": [{"id": "negative-binomial", "parameter": "alpha", "fitRule": "sum((n-mu)^2-n)/sum(mu^2)", "predictiveInterval": "exact-negative-binomial-quantile"}, {"id": "poisson-lognormal", "parameter": "sigma", "fitRule": "sqrt(log1p(mean(offDiagonalCovariance/(mu_i*mu_j))))", "predictiveInterval": "fixed-seed-predictive-monte-carlo-20000", "quadratureNodes": 32}], "quadrature": {"nodes": QUADRATURE_NODES.tolist(), "weights": QUADRATURE_WEIGHTS.tolist(), "measure": "exp(-z^2) dz / sqrt(pi)", "sharedLatentCommonMode": True}, "selectionMetric": "independent-holdout-log-likelihood-with-one-parameter-AIC-penalty", "selectionBeforeScienceUse": True, "residualDiagnosticsMayAuditButNeverSelectFamily": True, "postHocLikelihoodSwitchForbidden": True, "parameterRecoveryRelativeErrorMaximum": 0.15, "coverage90Range": [0.87, 0.93], "deltaAicVsPoissonMinimum": 100.0, "correctVsWrongHoldoutLogLikelihoodMinimum": 20.0, "alternativeLikelihoodImplementationsQualified": ["negative-binomial", "poisson-lognormal"], "measuredObservedCountsRequiredForInstrumentAuthority": True, "independentMeasuredHoldoutRequired": True, "measuredAuthorityGranted": False, "formalProductPointer": "v263", "denseCampaignStatus": "incomplete-0-of-49", "boundary": "synthetic-parameter-recovery-and-holdout-selection-only-no-measured-instrument-performance-or-science-response-authority"}
    unsigned = {"version": "v432-kerr-high-energy-likelihood-authority-python-oracle-v1", "generatedAt": artifact["generatedAt"], "status": "qualified-synthetic-negative-binomial-and-poisson-lognormal-authority-parameter-recovery-and-holdout-selection-no-measured-authority", "sourceV431ArtifactSha256": EXPECTED["artifactCanonical"], "sourceV431ArtifactFileSha256": EXPECTED["artifactFile"], "sourceV431OracleSha256": EXPECTED["oracleCanonical"], "sourceV431OracleFileSha256": EXPECTED["oracleFile"], "prediction": {"predictedCounts": mean.tolist()}, "campaign": {"seed": SEED, "calibrationReplicatesPerFamily": CALIBRATION_REPLICATES, "holdoutReplicatesPerFamily": HOLDOUT_REPLICATES, "families": results}, "counts": {"candidateFamilyCount": 2, "calibrationReplicateCount": 512, "syntheticHoldoutReplicateCount": 512, "syntheticCountCellCount": 24576, "parameterRecoveryResultCount": 2, "holdoutSelectionResultCount": 2, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "measuredResidualMetricCount": 0, "measuredValidationRunCount": 0, "alternativeLikelihoodImplementationQualifiedCount": 2, "scienceResponseApplicationCount": 0}, "qualification": {"negativeBinomialMathQualified": True, "poissonLognormalMathQualified": True, "negativeBinomialParameterRecoveryQualified": True, "poissonLognormalParameterRecoveryQualified": True, "negativeBinomialCoverageQualified": True, "poissonLognormalCoverageQualified": True, "holdoutSelectionQualified": True, "modelMisspecificationDiscriminatorQualified": True, "deterministicReplayQualified": True, "measuredLikelihoodQualified": False, "measuredInstrumentPerformanceQualified": False, "scienceResponseApplicationQualified": False}, "measuredResponseAuthorityGranted": False, "scienceResponseApplicationCount": 0, "networkAttempted": False, "boundary": "fixed-seed-synthetic-negative-binomial-and-poisson-lognormal-likelihood-math-parameter-recovery-and-independent-holdout-selection-only-no-measured-observations-instrument-performance-or-science-response"}
    oracle = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    atomic_json(CONTRACT, contract)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "counts": oracle["counts"], "families": [{"family": item["generatingFamily"], "correctParameter": item["correctCandidate"]["fittedParameter"], "relativeError": item["correctCandidate"]["relativeParameterError"], "coverage90": item["correctCandidate"]["coverage90"], "deltaAicVsPoisson": item["correctCandidate"]["deltaAicVsPoisson"], "correctVsWrongLogLikelihood": item["selectionDeltaLogLikelihood"]} for item in results], "measuredAuthority": False, "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

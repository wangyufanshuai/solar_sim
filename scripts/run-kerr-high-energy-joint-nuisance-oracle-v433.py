from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
V429_ROOT = ROOT / "dist/science/kerr-high-energy-response-uncertainty-v429"
V432_ROOT = ROOT / "dist/science/kerr-high-energy-likelihood-authority-v432"
SOURCE_V429_ARTIFACT = V429_ROOT / "response-uncertainty.json"
SOURCE_V429_ORACLE = V429_ROOT / "uncertainty-oracle.json"
SOURCE_V432_ARTIFACT = V432_ROOT / "likelihood-authority.json"
SOURCE_V432_ORACLE = V432_ROOT / "likelihood-authority-oracle.json"
SOURCE_V432_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v432-evidence.json"
SOURCE_V432_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v432.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-joint-nuisance-v433"
ORACLE = OUTPUT / "joint-nuisance-oracle.json"
CONTRACT = OUTPUT / "joint-nuisance-contract.json"

EXPECTED = {
    "v429ArtifactCanonical": "aa176b9546928c880b9ab72ef49f8223a552fc08025cec2ccedc1add49d15e8d",
    "v429ArtifactFile": "fbf01ca284af3a8eaaa561b66c73d090202206f9635428330450616ab31ddfde",
    "v429OracleCanonical": "06ba28b689b65ce6ee1aaa1c61146c5302099d0f4ddfaa750ad50ea3831bb592",
    "v429OracleFile": "1b66c6080a770e7223e660fb9a879dc955580a55a0a08d9b475236d68e342909",
    "v432ArtifactCanonical": "922418c9177de058a947fcf660995f69725306667b293165d578ec1f2e51173a",
    "v432ArtifactFile": "f958df8060ac22d79bc8613adf4b4e72c420a709ee3d9ea30d4a2836682c896e",
    "v432OracleCanonical": "29472ec43e41a240392c58bec38ed0ae0f47a3619eeb4c780a299b95e2346778",
    "v432OracleFile": "70a20446745ea960c1e89abcbad23e02f68d79a810ac0ce6ed774aa5d703d787",
    "v432EvidenceCanonical": "0490b3b26707d4fbc1643fede113271cb808b2fe6a94ed7f660edf9e7000687b",
    "v432EvidenceFile": "70e861c3afce923a1506ea053c4ddd7500cefca8d8ede7410116ad86d18c4e31",
    "v432PointerCanonical": "a0c7cb31bed6520d5ddd9a05a376a32a3430b20b93b0248009659c74d6570e1d",
    "v432PointerFile": "4258d1ce98f1a70aa9bc079fed4e297e5dde98e279613468f279fcc4a57b3530",
}
SEED = 43320260730
MONTE_CARLO_DRAWS = 8192


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


def psd_projection(matrix: np.ndarray) -> np.ndarray:
    values, vectors = np.linalg.eigh((matrix + matrix.T) * 0.5)
    return vectors @ np.diag(np.maximum(values, 0.0)) @ vectors.T


def group_uncertainty(matrix: np.ndarray) -> dict[str, list[dict[str, float | int | str]]]:
    angle_groups = [(f"angle-{index}", list(range(index * 6, index * 6 + 6))) for index in range(4)]
    channel_groups = [(f"channel-{index}", [angle * 6 + index for angle in range(4)]) for index in range(6)]

    def entries(groups: list[tuple[str, list[int]]]) -> list[dict[str, float | int | str]]:
        result = []
        for group_id, indices in groups:
            variance = float(np.sum(matrix[np.ix_(indices, indices)]))
            result.append({"id": group_id, "memberCount": len(indices), "variance": variance, "standardDeviation": math.sqrt(max(variance, 0.0))})
        return result

    return {"angle": entries(angle_groups), "channel": entries(channel_groups)}


def analytic_family(family: str, mean: np.ndarray, response_parameter: np.ndarray, redistribution: np.ndarray, parameter: float) -> dict[str, Any]:
    poisson_counting = np.diag(mean)
    if family == "negative-binomial":
        extra = np.diag(parameter * mean * mean)
        extra_kind = "independent-overdispersion-diagonal-alpha-mu2"
    else:
        common_variance = math.expm1(parameter * parameter)
        extra = np.outer(mean, mean) * common_variance
        extra_kind = "shared-lognormal-common-mode-mu-outer-product-expm1-sigma2"
    likelihood = poisson_counting + extra
    response_total = response_parameter + redistribution
    joint = response_total + likelihood
    response_decomposition_residual = float(np.max(np.abs(response_total - np.asarray(response_parameter + redistribution))))
    joint_decomposition_residual = float(np.max(np.abs(joint - response_parameter - redistribution - poisson_counting - extra)))
    eigenvalues = np.linalg.eigvalsh((joint + joint.T) * 0.5)
    standard_deviation = np.sqrt(np.diag(joint))
    correlation = joint / np.outer(standard_deviation, standard_deviation)
    traces = {"responseParameter": float(np.trace(response_parameter)), "redistribution": float(np.trace(redistribution)), "poissonCounting": float(np.trace(poisson_counting)), "familyExtra": float(np.trace(extra)), "joint": float(np.trace(joint))}
    fractions = {key: value / traces["joint"] for key, value in traces.items() if key != "joint"}
    return {"family": family, "fittedParameter": parameter, "familyExtraKind": extra_kind, "responseParameterCovariance": response_parameter.tolist(), "redistributionCovariance": redistribution.tolist(), "poissonCountingCovariance": poisson_counting.tolist(), "familyExtraCovariance": extra.tolist(), "likelihoodCovariance": likelihood.tolist(), "jointCovariance": joint.tolist(), "jointStandardDeviation": standard_deviation.tolist(), "jointCorrelation": correlation.tolist(), "groupUncertainty": group_uncertainty(joint), "traceBudget": traces, "traceFractions": fractions, "metrics": {"responseDecompositionMaximumAbsoluteResidual": response_decomposition_residual, "jointDecompositionMaximumAbsoluteResidual": joint_decomposition_residual, "jointSymmetryMaximumAbsolute": float(np.max(np.abs(joint - joint.T))), "jointMinimumEigenvalue": float(np.min(eigenvalues)), "jointMaximumEigenvalue": float(np.max(eigenvalues)), "jointConditionNumber": float(np.max(eigenvalues) / np.min(eigenvalues)), "jointEffectiveRank": int(np.count_nonzero(eigenvalues > np.max(eigenvalues) * 24 * np.finfo(np.float64).eps)), "maximumAbsoluteOffDiagonalCorrelation": float(np.max(np.abs(correlation - np.eye(24))))}}


def monte_carlo(family: str, mean: np.ndarray, response_total: np.ndarray, parameter: float, seed: int) -> dict[str, Any]:
    projected = psd_projection(response_total)
    response_rng = np.random.default_rng(seed)
    likelihood_rng = np.random.default_rng(seed + 1)
    response_delta = response_rng.multivariate_normal(np.zeros(24), projected, size=MONTE_CARLO_DRAWS, method="eigh")
    if family == "negative-binomial":
        latent = likelihood_rng.gamma(shape=1.0 / parameter, scale=mean * parameter, size=(MONTE_CARLO_DRAWS, 24))
        counts = likelihood_rng.poisson(latent)
    else:
        factor = np.exp(likelihood_rng.normal(-0.5 * parameter * parameter, parameter, size=(MONTE_CARLO_DRAWS, 1)))
        counts = likelihood_rng.poisson(factor * mean.reshape(1, -1))
    likelihood_delta = counts.astype(np.float64) - mean.reshape(1, -1)
    total_delta = response_delta + likelihood_delta
    empirical = np.cov(total_delta, rowvar=False, ddof=1)
    cross = (response_delta - np.mean(response_delta, axis=0)).T @ (likelihood_delta - np.mean(likelihood_delta, axis=0)) / (MONTE_CARLO_DRAWS - 1)
    response_replay_rng = np.random.default_rng(seed)
    likelihood_replay_rng = np.random.default_rng(seed + 1)
    response_replay = response_replay_rng.multivariate_normal(np.zeros(24), projected, size=MONTE_CARLO_DRAWS, method="eigh")
    if family == "negative-binomial":
        latent_replay = likelihood_replay_rng.gamma(shape=1.0 / parameter, scale=mean * parameter, size=(MONTE_CARLO_DRAWS, 24))
        counts_replay = likelihood_replay_rng.poisson(latent_replay)
    else:
        factor_replay = np.exp(likelihood_replay_rng.normal(-0.5 * parameter * parameter, parameter, size=(MONTE_CARLO_DRAWS, 1)))
        counts_replay = likelihood_replay_rng.poisson(factor_replay * mean.reshape(1, -1))
    return {"drawCount": MONTE_CARLO_DRAWS, "seed": seed, "empiricalJointCovariance": empirical.tolist(), "responseLikelihoodCrossCovariance": cross.tolist(), "deterministicReplayPassed": bool(np.array_equal(response_delta, response_replay) and np.array_equal(counts, counts_replay))}


def main() -> None:
    sources = [(SOURCE_V429_ARTIFACT, "v429ArtifactFile"), (SOURCE_V429_ORACLE, "v429OracleFile"), (SOURCE_V432_ARTIFACT, "v432ArtifactFile"), (SOURCE_V432_ORACLE, "v432OracleFile"), (SOURCE_V432_EVIDENCE, "v432EvidenceFile"), (SOURCE_V432_POINTER, "v432PointerFile")]
    if any(file_sha(path) != EXPECTED[key] for path, key in sources):
        raise RuntimeError("v433-source-file-lock")
    v429_artifact = json.loads(SOURCE_V429_ARTIFACT.read_text(encoding="utf-8"))
    v429 = json.loads(SOURCE_V429_ORACLE.read_text(encoding="utf-8"))
    v432_artifact = json.loads(SOURCE_V432_ARTIFACT.read_text(encoding="utf-8"))
    v432 = json.loads(SOURCE_V432_ORACLE.read_text(encoding="utf-8"))
    v432_evidence = json.loads(SOURCE_V432_EVIDENCE.read_text(encoding="utf-8"))
    v432_pointer = json.loads(SOURCE_V432_POINTER.read_text(encoding="utf-8"))
    if v429_artifact.get("artifactSha256") != EXPECTED["v429ArtifactCanonical"] or v429.get("artifactSha256") != EXPECTED["v429OracleCanonical"] or v432_artifact.get("artifactSha256") != EXPECTED["v432ArtifactCanonical"] or v432.get("artifactSha256") != EXPECTED["v432OracleCanonical"] or v432_evidence.get("evidenceSha256") != EXPECTED["v432EvidenceCanonical"] or v432_pointer.get("pointerSha256") != EXPECTED["v432PointerCanonical"]:
        raise RuntimeError("v433-source-canonical-lock")
    expected = v429["expected"]
    mean = np.asarray(expected["predictedCounts"], dtype=np.float64)
    response_parameter = np.asarray(expected["parameterCovarianceContribution"], dtype=np.float64)
    redistribution = np.asarray(expected["redistributionCovarianceContribution"], dtype=np.float64)
    v429_total = np.asarray(expected["totalCovariance"], dtype=np.float64)
    if mean.shape != (24,) or response_parameter.shape != (24, 24) or redistribution.shape != (24, 24) or np.max(np.abs(response_parameter + redistribution - v429_total)) >= 1e-6:
        raise RuntimeError("v433-response-decomposition-lock")
    parameters = {entry["generatingFamily"]: float(entry["correctCandidate"]["fittedParameter"]) for entry in v432_artifact["view"]["families"]}
    families = []
    for index, family in enumerate(["negative-binomial", "poisson-lognormal"]):
        analytic = analytic_family(family, mean, response_parameter, redistribution, parameters[family])
        empirical = monte_carlo(family, mean, v429_total, parameters[family], SEED + index * 10)
        joint = np.asarray(analytic["jointCovariance"])
        empirical_joint = np.asarray(empirical["empiricalJointCovariance"])
        cross = np.asarray(empirical["responseLikelihoodCrossCovariance"])
        relative_frobenius = float(np.linalg.norm(empirical_joint - joint) / np.linalg.norm(joint))
        maximum_diagonal_relative = float(np.max(np.abs(np.diag(empirical_joint) - np.diag(joint)) / np.diag(joint)))
        response_norm = np.linalg.norm(v429_total)
        likelihood_norm = np.linalg.norm(np.asarray(analytic["likelihoodCovariance"]))
        cross_relative = float(np.linalg.norm(cross) / math.sqrt(response_norm * likelihood_norm))
        monte_carlo_metrics = {"relativeFrobeniusCovarianceDifference": relative_frobenius, "maximumRelativeDiagonalDifference": maximum_diagonal_relative, "responseLikelihoodCrossBlockRelativeFrobenius": cross_relative}
        if analytic["metrics"]["responseDecompositionMaximumAbsoluteResidual"] >= 1e-6 or analytic["metrics"]["jointDecompositionMaximumAbsoluteResidual"] >= 1e-6 or analytic["metrics"]["jointSymmetryMaximumAbsolute"] >= 1e-6 or analytic["metrics"]["jointMinimumEigenvalue"] <= 0 or analytic["metrics"]["jointEffectiveRank"] != 24 or relative_frobenius >= 0.08 or maximum_diagonal_relative >= 0.12 or cross_relative >= 0.08 or empirical["deterministicReplayPassed"] is not True:
            raise RuntimeError(f"v433-family-gate:{family}:{json.dumps({'analytic': analytic['metrics'], 'mc': monte_carlo_metrics}, sort_keys=True)}")
        families.append({"family": family, "analytic": analytic, "monteCarlo": {**empirical, "metrics": monte_carlo_metrics}, "qualification": {"analyticDecompositionQualified": True, "positiveDefiniteQualified": True, "monteCarloCovarianceQualified": True, "syntheticCrossBlockIndependenceQualified": True, "deterministicReplayQualified": True}})
    contract = {"version": "v433-kerr-high-energy-joint-nuisance-contract-v1", "status": "synthetic-joint-nuisance-covariance-qualified-science-admission-pending", "componentOrder": ["response-parameter", "redistribution", "poisson-counting", "family-extra"], "responseSource": "v429-analytic-response-and-redistribution-covariance", "likelihoodSource": "v432-fitted-negative-binomial-or-shared-latent-poisson-lognormal", "factorization": {"responseAndLikelihoodBlocksIndependentBySyntheticConstruction": True, "measuredIndependenceProofAvailable": False, "measuredCrossCovarianceStatus": "unavailable"}, "scienceAdmission": {"immutableBoundaryArtifactRequired": True, "measuredResponseAuthorityRequired": True, "measuredLikelihoodAuthorityRequired": True, "independentMeasuredHoldoutRequired": True, "currentStatus": "not-admitted-no-measured-response-or-likelihood-authority", "scienceResponseApplicationCount": 0}, "thresholds": {"decompositionMaximumAbsolute": 1e-6, "symmetryMaximumAbsolute": 1e-6, "minimumEigenvalueExclusive": 0.0, "effectiveRank": 24, "monteCarloRelativeFrobeniusMaximum": 0.08, "monteCarloMaximumRelativeDiagonal": 0.12, "syntheticCrossBlockRelativeFrobeniusMaximum": 0.08}, "formalProductPointer": "v263", "denseCampaignStatus": "incomplete-0-of-49", "boundary": "synthetic-factorized-joint-nuisance-covariance-only-measured-cross-block-independence-response-likelihood-and-science-admission-unavailable"}
    unsigned = {"version": "v433-kerr-high-energy-joint-nuisance-python-oracle-v1", "generatedAt": v432_artifact["generatedAt"], "status": "qualified-synthetic-joint-response-redistribution-and-likelihood-nuisance-covariance-science-admission-pending", "sourceV429ArtifactSha256": EXPECTED["v429ArtifactCanonical"], "sourceV429ArtifactFileSha256": EXPECTED["v429ArtifactFile"], "sourceV429OracleSha256": EXPECTED["v429OracleCanonical"], "sourceV429OracleFileSha256": EXPECTED["v429OracleFile"], "sourceV432ArtifactSha256": EXPECTED["v432ArtifactCanonical"], "sourceV432ArtifactFileSha256": EXPECTED["v432ArtifactFile"], "sourceV432OracleSha256": EXPECTED["v432OracleCanonical"], "sourceV432OracleFileSha256": EXPECTED["v432OracleFile"], "prediction": {"predictedCounts": mean.tolist()}, "families": families, "counts": {"familyCount": 2, "covarianceDimension": 24, "covarianceElementCount": 11520, "groupUncertaintyCount": 20, "monteCarloDrawCount": 16384, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "measuredResidualMetricCount": 0, "measuredValidationRunCount": 0, "measuredResponseAuthorityCount": 0, "measuredLikelihoodAuthorityCount": 0, "scienceResponseApplicationCount": 0}, "qualification": {"jointNuisanceAnalyticMathQualified": True, "responseDecompositionQualified": True, "negativeBinomialJointCovarianceQualified": True, "poissonLognormalJointCovarianceQualified": True, "monteCarloCrossValidationQualified": True, "syntheticFactorizationQualified": True, "measuredCrossBlockIndependenceQualified": False, "measuredResponseAuthorityQualified": False, "measuredLikelihoodAuthorityQualified": False, "scienceAdmissionQualified": False}, "networkAttempted": False, "denseShardExecuted": False, "scienceResponseApplicationCount": 0, "boundary": "synthetic-joint-nuisance-covariance-and-science-admission-boundary-only-no-measured-response-likelihood-cross-block-independence-instrument-performance-or-science-application"}
    oracle = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    atomic_json(CONTRACT, contract)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "counts": oracle["counts"], "families": [{"family": entry["family"], "traceBudget": entry["analytic"]["traceBudget"], "metrics": entry["analytic"]["metrics"], "monteCarlo": entry["monteCarlo"]["metrics"]} for entry in families], "scienceAdmission": contract["scienceAdmission"]["currentStatus"], "measuredAuthority": False, "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import mpmath as mp

mp.mp.dps = 160
ROOT = Path.cwd()
PATHS = {
    "v530": Path("dist/science/kerr-allocation-regret-v530/atlas.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-regret-ranking-v531/atlas.json"),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
RESIDUAL_LIMIT = mp.mpf("1e-60")
SCALARIZATION_WEIGHTS = tuple(mp.mpf(index) / 100 for index in range(101))


def read_json(path: Path) -> dict[str, Any]:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def file_sha(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(
        canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def decimal_string(value: mp.mpf | float | int) -> str:
    return mp.nstr(mp.mpf(str(value)), 90)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def dominates(left: dict[str, Any], right: dict[str, Any]) -> bool:
    left_absolute = mp.mpf(left["maximumAbsoluteExcessCost"])
    left_relative = mp.mpf(left["maximumRelativeRegret"])
    right_absolute = mp.mpf(right["maximumAbsoluteExcessCost"])
    right_relative = mp.mpf(right["maximumRelativeRegret"])
    return (
        left_absolute <= right_absolute
        and left_relative <= right_relative
        and (left_absolute < right_absolute or left_relative < right_relative)
    )


def build_family(rows: list[dict[str, Any]], family: str) -> dict[str, Any]:
    count = len(rows)
    absolute_order = sorted(
        rows, key=lambda row: (mp.mpf(row["maximumAbsoluteExcessCost"]), row["candidateIndex"])
    )
    relative_order = sorted(
        rows, key=lambda row: (mp.mpf(row["maximumRelativeRegret"]), row["candidateIndex"])
    )
    absolute_rank = {row["candidateIndex"]: index + 1 for index, row in enumerate(absolute_order)}
    relative_rank = {row["candidateIndex"]: index + 1 for index, row in enumerate(relative_order)}

    candidate_map: list[dict[str, Any]] = []
    dominance_comparisons = 0
    for row in rows:
        dominated_by = []
        dominates_candidates = []
        for other in rows:
            if other["candidateIndex"] == row["candidateIndex"]:
                continue
            dominance_comparisons += 1
            if dominates(other, row):
                dominated_by.append(other["candidateIndex"])
            if dominates(row, other):
                dominates_candidates.append(other["candidateIndex"])
        candidate_map.append(
            {
                "candidateIndex": row["candidateIndex"],
                "scienceAllocationFraction": row["scienceAllocationFraction"],
                "maximumAbsoluteExcessCost": row["maximumAbsoluteExcessCost"],
                "maximumRelativeRegret": row["maximumRelativeRegret"],
                "absoluteRank": absolute_rank[row["candidateIndex"]],
                "relativeRank": relative_rank[row["candidateIndex"]],
                "absoluteRelativeRankDisplacement": abs(
                    absolute_rank[row["candidateIndex"]] - relative_rank[row["candidateIndex"]]
                ),
                "paretoNonDominated": len(dominated_by) == 0,
                "dominatesCandidateCount": len(dominates_candidates),
                "dominatedByCandidateCount": len(dominated_by),
                "firstDominatingCandidateIndex": dominated_by[0] if dominated_by else None,
                "recommended": False,
            }
        )
    pareto = [row for row in candidate_map if row["paretoNonDominated"]]
    for row in pareto:
        source = rows[row["candidateIndex"]]
        if any(
            dominates(other, source)
            for other in rows
            if other["candidateIndex"] != source["candidateIndex"]
        ):
            raise ValueError("v531-pareto-violation")
    for row in candidate_map:
        if not row["paretoNonDominated"]:
            witness = rows[row["firstDominatingCandidateIndex"]]
            source = rows[row["candidateIndex"]]
            if not dominates(witness, source):
                raise ValueError("v531-dominance-witness")

    rank_square_sum = sum(
        (absolute_rank[index] - relative_rank[index]) ** 2 for index in range(count)
    )
    spearman = mp.mpf(1) - mp.mpf(6 * rank_square_sum) / (count * (count * count - 1))
    concordant = 0
    discordant = 0
    for left in range(count):
        for right in range(left + 1, count):
            absolute_delta = absolute_rank[left] - absolute_rank[right]
            relative_delta = relative_rank[left] - relative_rank[right]
            if absolute_delta * relative_delta > 0:
                concordant += 1
            elif absolute_delta * relative_delta < 0:
                discordant += 1
            else:
                raise ValueError("v531-rank-tie")
    kendall = mp.mpf(concordant - discordant) / (concordant + discordant)
    top_overlap = {
        f"top{size}": len(
            {row["candidateIndex"] for row in absolute_order[:size]}
            & {row["candidateIndex"] for row in relative_order[:size]}
        )
        for size in (1, 3, 5, 10)
    }

    absolute_values = [mp.mpf(row["maximumAbsoluteExcessCost"]) for row in rows]
    relative_values = [mp.mpf(row["maximumRelativeRegret"]) for row in rows]
    absolute_minimum, absolute_maximum = min(absolute_values), max(absolute_values)
    relative_minimum, relative_maximum = min(relative_values), max(relative_values)
    absolute_span = absolute_maximum - absolute_minimum
    relative_span = relative_maximum - relative_minimum
    scalarization_path = []
    maximum_score_identity_residual = mp.mpf(0)
    for weight in SCALARIZATION_WEIGHTS:
        scores = []
        for row, absolute, relative in zip(rows, absolute_values, relative_values):
            normalized_absolute = (absolute - absolute_minimum) / absolute_span
            normalized_relative = (relative - relative_minimum) / relative_span
            score = weight * normalized_absolute + (1 - weight) * normalized_relative
            reconstructed = normalized_relative + weight * (
                normalized_absolute - normalized_relative
            )
            maximum_score_identity_residual = max(
                maximum_score_identity_residual, abs(score - reconstructed)
            )
            scores.append((score, row["candidateIndex"], normalized_absolute, normalized_relative))
        scores.sort(key=lambda entry: (entry[0], entry[1]))
        best_score = scores[0][0]
        tie_count = sum(abs(entry[0] - best_score) < mp.mpf("1e-70") for entry in scores)
        winner_index = scores[0][1]
        winner = candidate_map[winner_index]
        scalarization_path.append(
            {
                "weightIndex": len(scalarization_path),
                "absoluteObjectiveWeight": decimal_string(weight),
                "relativeObjectiveWeight": decimal_string(1 - weight),
                "winnerCandidateIndex": winner_index,
                "winnerScienceAllocationFraction": winner["scienceAllocationFraction"],
                "winnerScalarizedScore": decimal_string(best_score),
                "winnerAbsoluteRank": winner["absoluteRank"],
                "winnerRelativeRank": winner["relativeRank"],
                "winnerParetoNonDominated": winner["paretoNonDominated"],
                "tieCount": tie_count,
                "preferenceWeightMeasured": False,
                "recommended": False,
            }
        )
    if scalarization_path[0]["winnerRelativeRank"] != 1:
        raise ValueError("v531-relative-endpoint")
    if scalarization_path[-1]["winnerAbsoluteRank"] != 1:
        raise ValueError("v531-absolute-endpoint")
    if any(not row["winnerParetoNonDominated"] for row in scalarization_path):
        raise ValueError("v531-scalarization-pareto")
    unique_winners = sorted({row["winnerCandidateIndex"] for row in scalarization_path})
    transitions = sum(
        left["winnerCandidateIndex"] != right["winnerCandidateIndex"]
        for left, right in zip(scalarization_path, scalarization_path[1:])
    )
    return {
        "family": family,
        "candidateCount": count,
        "candidateMap": candidate_map,
        "paretoFront": {
            "candidateCount": len(pareto),
            "candidateIndices": [row["candidateIndex"] for row in pareto],
            "scienceAllocationFractions": [row["scienceAllocationFraction"] for row in pareto],
            "operationalRecommendation": False,
        },
        "rankingAgreement": {
            "absoluteWinnerCandidateIndex": absolute_order[0]["candidateIndex"],
            "relativeWinnerCandidateIndex": relative_order[0]["candidateIndex"],
            "winnerAgreement": absolute_order[0]["candidateIndex"]
            == relative_order[0]["candidateIndex"],
            "spearmanRankCorrelation": decimal_string(spearman),
            "kendallRankCorrelation": decimal_string(kendall),
            "concordantPairCount": concordant,
            "discordantPairCount": discordant,
            "rankPairCount": concordant + discordant,
            "rankSquareDisplacementSum": rank_square_sum,
            "maximumRankDisplacement": max(
                row["absoluteRelativeRankDisplacement"] for row in candidate_map
            ),
            "topSetOverlap": top_overlap,
            "rankingIsOperationalPreference": False,
        },
        "scalarizationPath": {
            "weightCount": len(scalarization_path),
            "weightsMeasured": False,
            "normalization": "independent-min-max-per-objective-within-family",
            "normalizationOperationallyValidated": False,
            "rows": scalarization_path,
            "uniqueWinnerCandidateCount": len(unique_winners),
            "uniqueWinnerCandidateIndices": unique_winners,
            "winnerTransitionCount": transitions,
            "selectedWeightIndex": None,
            "operationalSelectionAllowed": False,
        },
        "audits": {
            "dominanceComparisonCount": dominance_comparisons,
            "rankPairComparisonCount": concordant + discordant,
            "scalarizationEvaluationCount": count * len(SCALARIZATION_WEIGHTS),
            "maximumScoreIdentityResidual": decimal_string(maximum_score_identity_residual),
            "allScalarizationWinnersParetoNonDominated": True,
        },
        "selectionBoundary": {
            "utilityAvailable": False,
            "preferenceWeightAvailable": False,
            "normalizationPreferenceAvailable": False,
            "recommendedCandidateAvailable": False,
            "automaticSelectionAllowed": False,
        },
    }


def main() -> None:
    v530 = read_json(PATHS["v530"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v530.get("version") != "v530-kerr-allocation-regret-fragility-atlas-v1"
        or canonical_sha(v530) != v530.get("artifactSha256")
        or v530.get("qualification", {}).get("allocationRegretAtlasQualified") is not True
        or v530.get("selectionBoundary", {}).get("recommendedAllocationAvailable") is not False
        or v511.get("counts", {}).get("measuredCalibrationFiles") != 0
        or v511.get("counts", {}).get("requiredMeasuredCalibrationFiles") != 6
        or v458.get("inspect", {}).get("readyFileCount") != 0
        or dense.get("status") != "incomplete-0-of-49"
        or dense.get("completedShardCount") != 0
        or dense.get("attemptConsumed") is not False
        or formal.get("version") != "v263-current-product-evidence-pointer"
        or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn"
        or formal_evidence.get("contracts", {}).get("singleCanvas") is not True
        or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603
        or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84
    ):
        raise ValueError("v531-upstream-boundary")

    stochastic = build_family(
        v530["stochasticRegretAtlas"]["candidateEnvelope"], "stochastic-variance"
    )
    deterministic = build_family(
        v530["deterministicRegretAtlas"]["candidateEnvelope"], "deterministic-bound"
    )
    maxima = {
        "scalarizationScoreIdentityAbsolute": max(
            mp.mpf(stochastic["audits"]["maximumScoreIdentityResidual"]),
            mp.mpf(deterministic["audits"]["maximumScoreIdentityResidual"]),
        ),
        "paretoDominanceViolation": mp.mpf(0),
        "dominanceWitnessViolation": mp.mpf(0),
        "scalarizationEndpointViolation": mp.mpf(0),
    }
    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v531-threshold:{maxima}")

    display_geometry = {
        "stochasticCandidateMap": stochastic["candidateMap"],
        "deterministicCandidateMap": deterministic["candidateMap"],
        "stochasticScalarizationPath": stochastic["scalarizationPath"]["rows"],
        "deterministicScalarizationPath": deterministic["scalarizationPath"]["rows"],
        "scientificGeometryInputCount": 300,
    }
    if sum(len(value) for value in display_geometry.values() if isinstance(value, list)) != 300:
        raise ValueError("v531-display-geometry-count")

    source_paths = [
        PATHS["v530"],
        PATHS["v511"],
        PATHS["v458"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-regret-ranking-v531.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v531-kerr-regret-ranking-stability-atlas-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "regret-pareto-and-ranking-stability-qualified-operational-preference-unavailable",
        "source": {
            "v530ArtifactSha256": v530["artifactSha256"],
            "v511ArtifactSha256": v511["artifactSha256"],
            "v458ArtifactSha256": v458["artifactSha256"],
            "v314StateSha256": dense["stateSha256"],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 160,
            "candidateCountPerFamily": 49,
            "scalarizationWeightCount": 101,
            "scalarizationWeights": [decimal_string(value) for value in SCALARIZATION_WEIGHTS],
            "randomnessUsed": False,
        },
        "rankingDefinition": {
            "objectives": ["maximum_absolute_excess_cost", "maximum_relative_regret"],
            "paretoDominance": "weakly-no-worse-in-both-and-strictly-better-in-at-least-one",
            "rankTiesAllowed": False,
            "scalarizationNormalization": "independent-min-max-per-objective-within-family",
            "scalarizationWeightMeasured": False,
            "utilityFunctionAvailable": False,
            "priorUsed": False,
            "stressAnalysisOnlyNotOperationalPreference": True,
        },
        "stochasticRanking": stochastic,
        "deterministicRanking": deterministic,
        "displayGeometry": display_geometry,
        "rankingAudits": {
            "dominanceComparisonCount": stochastic["audits"]["dominanceComparisonCount"]
            + deterministic["audits"]["dominanceComparisonCount"],
            "rankPairComparisonCount": stochastic["audits"]["rankPairComparisonCount"]
            + deterministic["audits"]["rankPairComparisonCount"],
            "scalarizationEvaluationCount": stochastic["audits"]["scalarizationEvaluationCount"]
            + deterministic["audits"]["scalarizationEvaluationCount"],
            "allScalarizationWinnersParetoNonDominated": True,
            "selectedScalarizationWeightIndex": None,
            "operationalRankingAvailable": False,
        },
        "selectionBoundary": {
            "physicalTargetAvailable": False,
            "modelPriorAvailable": False,
            "utilityFunctionAvailable": False,
            "preferenceWeightAvailable": False,
            "normalizationPreferenceAvailable": False,
            "recommendedModelAvailable": False,
            "recommendedAllocationAvailable": False,
            "automaticSelectionAllowed": False,
            "operationalSchedulingAllowed": False,
        },
        "acquisitionBoundary": {
            "requiredMeasuredFileCount": 6,
            "readyMeasuredFileCount": 0,
            "measuredCalibrationRowCount": 0,
            "numericalScienceErrorBarsAvailable": False,
            "scienceRecoveryExecutable": False,
        },
        "counts": {
            "candidateCountPerFamily": 49,
            "candidateMapRowCount": 98,
            "scalarizationWeightCount": 101,
            "scalarizationPathRowCount": 202,
            "dominanceComparisonCount": 4704,
            "rankPairComparisonCount": 2352,
            "scalarizationEvaluationCount": 9898,
            "scientificGeometryInputCount": 300,
            "measuredCalibrationFileCount": 0,
            "requiredMeasuredCalibrationFileCount": 6,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT)},
        "qualification": {
            "paretoFrontQualified": True,
            "rankAgreementQualified": True,
            "scalarizationPathQualified": True,
            "normalizationFragilityQualified": True,
            "operationalPreferenceModelQualified": False,
            "recommendedAllocationQualified": False,
            "measuredInstrumentQualified": False,
            "scienceAuthorityPromotionAllowed": False,
        },
        "boundary": {
            "normalizedStressModelOnly": True,
            "physicalNoiseModelAvailable": False,
            "physicalCostModelAvailable": False,
            "measuredCalibrationAvailable": False,
            "expectedElectronCountsAvailable": False,
            "observedCountsAvailable": False,
            "scienceRasterAuthorityAvailable": False,
            "cinematicScienceWritebackAllowed": False,
            "networkAttempted": False,
            "automaticRetryApplied": False,
            "denseCampaignStatus": "incomplete-0-of-49",
            "browserQualification": "not-run",
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_write(PATHS["output"], artifact)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "dominanceComparisons": artifact["counts"]["dominanceComparisonCount"],
                "rankPairs": artifact["counts"]["rankPairComparisonCount"],
                "scalarizationEvaluations": artifact["counts"]["scalarizationEvaluationCount"],
                "scientificGeometryInputs": artifact["counts"]["scientificGeometryInputCount"],
                "recommendedAllocation": "unavailable",
                "measuredCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

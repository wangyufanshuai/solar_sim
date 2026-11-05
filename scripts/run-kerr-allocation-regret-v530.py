from __future__ import annotations

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Any

import mpmath as mp

mp.mp.dps = 160
ROOT = Path.cwd()
PATHS = {
    "v529": Path("dist/science/kerr-cost-law-robustness-v529/envelope.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-allocation-regret-v530/atlas.json"),
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
CANDIDATE_FRACTIONS = tuple(mp.mpf(index) / 50 for index in range(1, 50))
COVERAGE_THRESHOLDS = (mp.mpf("0.01"), mp.mpf("0.05"), mp.mpf("0.1"))


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


def cell_identity(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "sourceIndex": row["index"],
        "precisionExponent": row["precisionExponent"],
        "calibrationToScienceCostWeight": row["calibrationToScienceCostWeight"],
        "systematicFloorFraction": row.get(
            "systematicVarianceFraction", row.get("systematicBoundFraction")
        ),
        "fixedNormalizedOverhead": row["fixedNormalizedOverhead"],
    }


def evaluate_candidate(
    row: dict[str, Any], candidate_fraction: mp.mpf
) -> tuple[mp.mpf, mp.mpf, mp.mpf, mp.mpf]:
    exponent = mp.mpf(row["precisionExponent"])
    weight = mp.mpf(row["calibrationToScienceCostWeight"])
    overhead = mp.mpf(row["fixedNormalizedOverhead"])
    optimum = mp.mpf(row["minimumNormalizedCost"])
    if row["family"] == "stochastic-variance":
        budget = mp.mpf(row["randomVarianceBudget"])
        science = budget * candidate_fraction
        calibration = budget - science
        candidate_cost = (
            science ** (-exponent / 2)
            + weight * calibration ** (-exponent / 2)
            + overhead
        )
        reconstructed_optimum = (
            mp.mpf(row["scienceVariance"]) ** (-exponent / 2)
            + weight * mp.mpf(row["calibrationVariance"]) ** (-exponent / 2)
            + overhead
        )
    else:
        budget = mp.mpf(row["randomBoundBudget"])
        science = budget * candidate_fraction
        calibration = mp.sqrt(2) * (budget - science)
        candidate_cost = science ** (-exponent) + weight * calibration ** (-exponent) + overhead
        reconstructed_optimum = (
            mp.mpf(row["scienceBound"]) ** (-exponent)
            + weight * mp.mpf(row["calibrationBound"]) ** (-exponent)
            + overhead
        )
    raw_excess = candidate_cost - optimum
    negative_regret = max(mp.mpf(0), -raw_excess)
    absolute_excess = max(mp.mpf(0), raw_excess)
    relative_regret = absolute_excess / optimum
    identity_residual = abs(relative_regret * optimum - absolute_excess)
    reconstruction_residual = abs(reconstructed_optimum - optimum)
    return absolute_excess, relative_regret, identity_residual, max(
        reconstruction_residual, negative_regret
    )


def build_family(
    rows: list[dict[str, Any]], family: str
) -> tuple[dict[str, Any], dict[str, mp.mpf], dict[str, int]]:
    envelope: list[dict[str, Any]] = []
    maxima = {
        "regretIdentityAbsolute": mp.mpf(0),
        "sourceOptimumReconstructionAbsolute": mp.mpf(0),
        "overheadAbsoluteRegretDrift": mp.mpf(0),
        "relativeRegretMonotonicViolation": mp.mpf(0),
    }
    for candidate_index, candidate_fraction in enumerate(CANDIDATE_FRACTIONS):
        worst_absolute = mp.mpf(-1)
        worst_relative = mp.mpf(-1)
        best_absolute = mp.inf
        best_relative = mp.inf
        worst_absolute_cell: dict[str, Any] | None = None
        worst_relative_cell: dict[str, Any] | None = None
        coverage = {threshold: 0 for threshold in COVERAGE_THRESHOLDS}
        for row in rows:
            absolute, relative, identity_residual, reconstruction_residual = evaluate_candidate(
                row, candidate_fraction
            )
            maxima["regretIdentityAbsolute"] = max(
                maxima["regretIdentityAbsolute"], identity_residual
            )
            maxima["sourceOptimumReconstructionAbsolute"] = max(
                maxima["sourceOptimumReconstructionAbsolute"], reconstruction_residual
            )
            if absolute > worst_absolute:
                worst_absolute = absolute
                worst_absolute_cell = cell_identity(row)
            if relative > worst_relative:
                worst_relative = relative
                worst_relative_cell = cell_identity(row)
            best_absolute = min(best_absolute, absolute)
            best_relative = min(best_relative, relative)
            for threshold in COVERAGE_THRESHOLDS:
                if relative <= threshold:
                    coverage[threshold] += 1
        envelope.append(
            {
                "candidateIndex": candidate_index,
                "scienceAllocationFraction": decimal_string(candidate_fraction),
                "maximumAbsoluteExcessCost": decimal_string(worst_absolute),
                "maximumRelativeRegret": decimal_string(worst_relative),
                "minimumAbsoluteExcessCost": decimal_string(best_absolute),
                "minimumRelativeRegret": decimal_string(best_relative),
                "gridCellCountAtOrBelowOnePercentRelativeRegret": coverage[mp.mpf("0.01")],
                "gridCellCountAtOrBelowFivePercentRelativeRegret": coverage[mp.mpf("0.05")],
                "gridCellCountAtOrBelowTenPercentRelativeRegret": coverage[mp.mpf("0.1")],
                "sourceGridCellCount": len(rows),
                "worstAbsoluteCell": worst_absolute_cell,
                "worstRelativeCell": worst_relative_cell,
                "coverageIsProbability": False,
                "recommended": False,
            }
        )

    grouped: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        floor = row.get("systematicVarianceFraction", row.get("systematicBoundFraction"))
        grouped[(row["precisionExponent"], row["calibrationToScienceCostWeight"], floor)].append(
            row
        )
    overhead_invariance_comparisons = 0
    relative_monotonicity_comparisons = 0
    for group in grouped.values():
        group.sort(key=lambda row: mp.mpf(row["fixedNormalizedOverhead"]))
        for candidate_fraction in CANDIDATE_FRACTIONS:
            evaluations = [evaluate_candidate(row, candidate_fraction) for row in group]
            reference_absolute = evaluations[0][0]
            for evaluation in evaluations[1:]:
                maxima["overheadAbsoluteRegretDrift"] = max(
                    maxima["overheadAbsoluteRegretDrift"],
                    abs(evaluation[0] - reference_absolute),
                )
                overhead_invariance_comparisons += 1
            for left, right in zip(evaluations, evaluations[1:]):
                maxima["relativeRegretMonotonicViolation"] = max(
                    maxima["relativeRegretMonotonicViolation"], max(mp.mpf(0), right[1] - left[1])
                )
                relative_monotonicity_comparisons += 1

    absolute_minimax = min(
        envelope, key=lambda row: (mp.mpf(row["maximumAbsoluteExcessCost"]), row["candidateIndex"])
    )
    relative_minimax = min(
        envelope, key=lambda row: (mp.mpf(row["maximumRelativeRegret"]), row["candidateIndex"])
    )
    source_optimal_fractions = [mp.mpf(row["scienceFractionOfRandomBudget"]) for row in rows]
    result = {
        "family": family,
        "candidateCount": len(envelope),
        "sourceGridCellCount": len(rows),
        "candidateEnvelope": envelope,
        "descriptiveAbsoluteMinimax": {
            "candidateIndex": absolute_minimax["candidateIndex"],
            "scienceAllocationFraction": absolute_minimax["scienceAllocationFraction"],
            "maximumAbsoluteExcessCost": absolute_minimax["maximumAbsoluteExcessCost"],
            "recommended": False,
        },
        "descriptiveRelativeMinimax": {
            "candidateIndex": relative_minimax["candidateIndex"],
            "scienceAllocationFraction": relative_minimax["scienceAllocationFraction"],
            "maximumRelativeRegret": relative_minimax["maximumRelativeRegret"],
            "recommended": False,
        },
        "sourceOptimalFractionRange": {
            "minimum": decimal_string(min(source_optimal_fractions)),
            "maximum": decimal_string(max(source_optimal_fractions)),
            "span": decimal_string(max(source_optimal_fractions) - min(source_optimal_fractions)),
            "operationalRange": False,
        },
        "selectionBoundary": {
            "priorAvailable": False,
            "gridCoverageIsProbability": False,
            "descriptiveMinimaxIsRecommendation": False,
            "operationalSelectionAllowed": False,
        },
    }
    counts = {
        "overheadAbsoluteRegretInvarianceComparisons": overhead_invariance_comparisons,
        "relativeRegretOverheadMonotonicityComparisons": relative_monotonicity_comparisons,
    }
    return result, maxima, counts


def optimal_lattice(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    selected = [
        row
        for row in rows
        if mp.mpf(row["fixedNormalizedOverhead"]) == 0
        and mp.mpf(
            row.get("systematicVarianceFraction", row.get("systematicBoundFraction"))
        )
        == 0
    ]
    return [
        {
            "sourceIndex": row["index"],
            "precisionExponent": row["precisionExponent"],
            "calibrationToScienceCostWeight": row["calibrationToScienceCostWeight"],
            "scienceOptimalFraction": row["scienceFractionOfRandomBudget"],
            "operationalSelection": False,
        }
        for row in selected
    ]


def main() -> None:
    v529 = read_json(PATHS["v529"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v529.get("version") != "v529-kerr-cost-law-robustness-envelope-v1"
        or canonical_sha(v529) != v529.get("artifactSha256")
        or v529.get("qualification", {}).get("parametricRobustnessQualified") is not True
        or v529.get("selectionBoundary", {}).get("recommendedModelAvailable") is not False
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
        raise ValueError("v530-upstream-boundary")

    stochastic_rows = v529["stochasticRobustness"]["samples"]
    deterministic_rows = v529["deterministicRobustness"]["samples"]
    stochastic, stochastic_maxima, stochastic_counts = build_family(
        stochastic_rows, "stochastic-variance"
    )
    deterministic, deterministic_maxima, deterministic_counts = build_family(
        deterministic_rows, "deterministic-bound"
    )
    maxima = {
        key: max(stochastic_maxima[key], deterministic_maxima[key])
        for key in stochastic_maxima
    }
    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v530-threshold:{maxima}")

    stochastic_lattice = optimal_lattice(stochastic_rows)
    deterministic_lattice = optimal_lattice(deterministic_rows)
    display_geometry = {
        "stochasticCandidateEnvelope": stochastic["candidateEnvelope"],
        "deterministicCandidateEnvelope": deterministic["candidateEnvelope"],
        "stochasticOptimalFractionLattice": stochastic_lattice,
        "deterministicOptimalFractionLattice": deterministic_lattice,
        "scientificGeometryInputCount": 148,
    }
    if sum(len(value) for value in display_geometry.values() if isinstance(value, list)) != 148:
        raise ValueError("v530-display-geometry-count")

    source_paths = [
        PATHS["v529"],
        PATHS["v511"],
        PATHS["v458"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-allocation-regret-v530.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v530-kerr-allocation-regret-fragility-atlas-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "allocation-regret-fragility-qualified-operational-decision-unavailable",
        "source": {
            "v529ArtifactSha256": v529["artifactSha256"],
            "v511ArtifactSha256": v511["artifactSha256"],
            "v458ArtifactSha256": v458["artifactSha256"],
            "v314StateSha256": dense["stateSha256"],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 160,
            "sourceCellCount": 1000,
            "candidateAllocationCountPerFamily": 49,
            "candidateFractions": [decimal_string(value) for value in CANDIDATE_FRACTIONS],
            "randomnessUsed": False,
        },
        "regretDefinition": {
            "absoluteExcessCost": "candidate_cost-source_cell_optimum_cost",
            "relativeRegret": "absolute_excess_cost/source_cell_optimum_cost",
            "absoluteRegretIndependentOfAdditiveOverhead": True,
            "relativeRegretDependsOnAdditiveOverheadNormalization": True,
            "gridCoverageIsProbability": False,
            "priorUsed": False,
            "stressModelOnlyNotOperationalDecision": True,
        },
        "stochasticRegretAtlas": stochastic,
        "deterministicRegretAtlas": deterministic,
        "displayGeometry": display_geometry,
        "regretAudits": {
            "overheadAbsoluteRegretInvarianceComparisons": stochastic_counts[
                "overheadAbsoluteRegretInvarianceComparisons"
            ]
            + deterministic_counts["overheadAbsoluteRegretInvarianceComparisons"],
            "relativeRegretOverheadMonotonicityComparisons": stochastic_counts[
                "relativeRegretOverheadMonotonicityComparisons"
            ]
            + deterministic_counts["relativeRegretOverheadMonotonicityComparisons"],
            "absoluteRegretOverheadInvariant": True,
            "relativeRegretNonIncreasingWithOverhead": True,
            "descriptiveMinimaxComputed": True,
            "descriptiveMinimaxPromotedToRecommendation": False,
        },
        "selectionBoundary": {
            "physicalTargetAvailable": False,
            "modelPriorAvailable": False,
            "measuredCostLawAvailable": False,
            "measuredSystematicFloorAvailable": False,
            "measuredAcquisitionOverheadAvailable": False,
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
            "candidateAllocationCount": 49,
            "sourceGridCellCount": 1000,
            "stochasticRegretEvaluationCount": 24500,
            "deterministicRegretEvaluationCount": 24500,
            "regretEvaluationCount": 49000,
            "overheadAbsoluteRegretInvarianceComparisonCount": 36750,
            "relativeRegretOverheadMonotonicityComparisonCount": 36750,
            "scientificGeometryInputCount": 148,
            "measuredCalibrationFileCount": 0,
            "requiredMeasuredCalibrationFileCount": 6,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT)},
        "qualification": {
            "allocationRegretAtlasQualified": True,
            "absoluteOverheadInvarianceQualified": True,
            "relativeOverheadNormalizationAuditQualified": True,
            "allocationFragilityQualified": True,
            "operationalDecisionModelQualified": False,
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
                "regretEvaluations": artifact["counts"]["regretEvaluationCount"],
                "overheadComparisons": artifact["counts"][
                    "overheadAbsoluteRegretInvarianceComparisonCount"
                ],
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

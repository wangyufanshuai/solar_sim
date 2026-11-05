from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any, Callable

import mpmath as mp

mp.mp.dps = 160
ROOT = Path.cwd()
PATHS = {
    "v528": Path("dist/science/kerr-calibration-cost-sensitivity-v528/sensitivity.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-cost-law-robustness-v529/envelope.json"),
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
ITERATIONS = 512
EXPONENTS = tuple(mp.mpf(value) for value in ("1", "1.5", "2", "2.5", "3"))
COST_RATIOS = tuple(mp.mpf(value) for value in ("0.01", "0.1", "1", "10", "100"))
FLOOR_FRACTIONS = tuple(mp.mpf(value) for value in ("0", "0.1", "0.25", "0.5", "0.75"))
OVERHEADS = tuple(mp.mpf(value) for value in ("0", "0.1", "0.5", "1"))


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


def golden_minimum(
    function: Callable[[mp.mpf], mp.mpf], left: mp.mpf, right: mp.mpf
) -> tuple[mp.mpf, mp.mpf]:
    ratio = (mp.sqrt(5) - 1) / 2
    c = right - ratio * (right - left)
    d = left + ratio * (right - left)
    fc = function(c)
    fd = function(d)
    for _ in range(ITERATIONS):
        if fc <= fd:
            right, d, fd = d, c, fc
            c = right - ratio * (right - left)
            fc = function(c)
        else:
            left, c, fc = c, d, fd
            d = left + ratio * (right - left)
            fd = function(d)
    point = (left + right) / 2
    return point, function(point)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def stochastic_row(
    index: int,
    exponent: mp.mpf,
    cost_ratio: mp.mpf,
    floor_fraction: mp.mpf,
    overhead: mp.mpf,
) -> tuple[dict[str, Any], mp.mpf, mp.mpf]:
    power = exponent / 2
    random_budget = 2 * (1 - floor_fraction)
    allocation_ratio = mp.power(cost_ratio, 1 / (power + 1))
    science = random_budget / (1 + allocation_ratio)
    calibration = random_budget - science
    analytic_cost = science ** (-power) + cost_ratio * calibration ** (-power) + overhead
    tiny = random_budget * mp.mpf("1e-40")
    objective = (
        lambda candidate: candidate ** (-power)
        + cost_ratio * (random_budget - candidate) ** (-power)
        + overhead
    )
    numeric_science, numeric_cost = golden_minimum(objective, tiny, random_budget - tiny)
    return (
        {
            "index": index,
            "family": "stochastic-variance",
            "precisionExponent": decimal_string(exponent),
            "calibrationToScienceCostWeight": decimal_string(cost_ratio),
            "systematicVarianceFraction": decimal_string(floor_fraction),
            "fixedNormalizedOverhead": decimal_string(overhead),
            "randomVarianceBudget": decimal_string(random_budget),
            "scienceVariance": decimal_string(science),
            "calibrationVariance": decimal_string(calibration),
            "scienceFractionOfRandomBudget": decimal_string(science / random_budget),
            "calibrationFractionOfRandomBudget": decimal_string(calibration / random_budget),
            "minimumNormalizedCost": decimal_string(analytic_cost),
            "numericScienceVariance": decimal_string(numeric_science),
            "precisionExponentMeasured": False,
            "systematicFloorMeasured": False,
            "fixedOverheadMeasured": False,
            "recommended": False,
        },
        abs(numeric_science - science),
        abs(numeric_cost - analytic_cost),
    )


def deterministic_row(
    index: int,
    exponent: mp.mpf,
    cost_ratio: mp.mpf,
    floor_fraction: mp.mpf,
    overhead: mp.mpf,
) -> tuple[dict[str, Any], mp.mpf, mp.mpf]:
    random_budget = 1 - floor_fraction
    allocation_ratio = mp.power(mp.sqrt(2) * cost_ratio, 1 / (exponent + 1))
    science = random_budget / (1 + allocation_ratio / mp.sqrt(2))
    calibration = allocation_ratio * science
    analytic_cost = science ** (-exponent) + cost_ratio * calibration ** (-exponent) + overhead
    tiny = random_budget * mp.mpf("1e-40")
    objective = (
        lambda candidate: candidate ** (-exponent)
        + cost_ratio * (mp.sqrt(2) * (random_budget - candidate)) ** (-exponent)
        + overhead
    )
    numeric_science, numeric_cost = golden_minimum(objective, tiny, random_budget - tiny)
    return (
        {
            "index": index,
            "family": "deterministic-bound",
            "precisionExponent": decimal_string(exponent),
            "calibrationToScienceCostWeight": decimal_string(cost_ratio),
            "systematicBoundFraction": decimal_string(floor_fraction),
            "fixedNormalizedOverhead": decimal_string(overhead),
            "randomBoundBudget": decimal_string(random_budget),
            "scienceBound": decimal_string(science),
            "calibrationBound": decimal_string(calibration),
            "scienceFractionOfRandomBudget": decimal_string(science / random_budget),
            "calibrationContributionFraction": decimal_string(
                calibration / (mp.sqrt(2) * random_budget)
            ),
            "minimumNormalizedCost": decimal_string(analytic_cost),
            "numericScienceBound": decimal_string(numeric_science),
            "precisionExponentMeasured": False,
            "systematicFloorMeasured": False,
            "fixedOverheadMeasured": False,
            "recommended": False,
        },
        abs(numeric_science - science),
        abs(numeric_cost - analytic_cost),
    )


def select_rows(
    rows: list[dict[str, Any]],
    *,
    exponent: mp.mpf | None = None,
    cost_ratio: mp.mpf | None = None,
    floor: mp.mpf | None = None,
    overhead: mp.mpf | None = None,
) -> list[dict[str, Any]]:
    def matches(row: dict[str, Any]) -> bool:
        floor_value = row.get("systematicVarianceFraction", row.get("systematicBoundFraction"))
        return (
            (exponent is None or mp.mpf(row["precisionExponent"]) == exponent)
            and (
                cost_ratio is None
                or mp.mpf(row["calibrationToScienceCostWeight"]) == cost_ratio
            )
            and (floor is None or mp.mpf(floor_value) == floor)
            and (overhead is None or mp.mpf(row["fixedNormalizedOverhead"]) == overhead)
        )

    return [row for row in rows if matches(row)]


def display_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "sourceIndex": row["index"],
        "precisionExponent": row["precisionExponent"],
        "calibrationToScienceCostWeight": row["calibrationToScienceCostWeight"],
        "systematicFloorFraction": row.get(
            "systematicVarianceFraction", row.get("systematicBoundFraction")
        ),
        "fixedNormalizedOverhead": row["fixedNormalizedOverhead"],
        "scienceFractionOfRandomBudget": row["scienceFractionOfRandomBudget"],
        "minimumNormalizedCost": row["minimumNormalizedCost"],
    }


def main() -> None:
    mp.mp.dps = 160
    v528 = read_json(PATHS["v528"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v528.get("version") != "v528-kerr-calibration-cost-sensitivity-v1"
        or canonical_sha(v528) != v528.get("artifactSha256")
        or v528.get("qualification", {}).get("parametricCostSensitivityQualified") is not True
        or v528.get("selectionBoundary", {}).get("recommendedAllocationAvailable") is not False
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
        raise ValueError("v529-upstream-boundary")

    stochastic: list[dict[str, Any]] = []
    deterministic: list[dict[str, Any]] = []
    maxima = {
        "stochasticOptimizerPointAbsolute": mp.mpf(0),
        "stochasticOptimizerCostAbsolute": mp.mpf(0),
        "deterministicOptimizerPointAbsolute": mp.mpf(0),
        "deterministicOptimizerCostAbsolute": mp.mpf(0),
        "overheadAllocationDriftAbsolute": mp.mpf(0),
        "overheadCostTranslationAbsolute": mp.mpf(0),
        "stochasticEqualWeightSymmetryAbsolute": mp.mpf(0),
    }
    for exponent in EXPONENTS:
        for cost_ratio in COST_RATIOS:
            for floor_fraction in FLOOR_FRACTIONS:
                for overhead in OVERHEADS:
                    row, point_residual, cost_residual = stochastic_row(
                        len(stochastic), exponent, cost_ratio, floor_fraction, overhead
                    )
                    stochastic.append(row)
                    maxima["stochasticOptimizerPointAbsolute"] = max(
                        maxima["stochasticOptimizerPointAbsolute"], point_residual
                    )
                    maxima["stochasticOptimizerCostAbsolute"] = max(
                        maxima["stochasticOptimizerCostAbsolute"], cost_residual
                    )
                    row, point_residual, cost_residual = deterministic_row(
                        len(deterministic), exponent, cost_ratio, floor_fraction, overhead
                    )
                    deterministic.append(row)
                    maxima["deterministicOptimizerPointAbsolute"] = max(
                        maxima["deterministicOptimizerPointAbsolute"], point_residual
                    )
                    maxima["deterministicOptimizerCostAbsolute"] = max(
                        maxima["deterministicOptimizerCostAbsolute"], cost_residual
                    )

    overhead_invariance_comparisons = 0
    overhead_translation_comparisons = 0
    floor_monotonic_comparisons = 0
    for rows in (stochastic, deterministic):
        for exponent in EXPONENTS:
            for cost_ratio in COST_RATIOS:
                for floor_fraction in FLOOR_FRACTIONS:
                    group = select_rows(
                        rows,
                        exponent=exponent,
                        cost_ratio=cost_ratio,
                        floor=floor_fraction,
                    )
                    reference = group[0]
                    allocation_key = (
                        "scienceVariance"
                        if reference["family"] == "stochastic-variance"
                        else "scienceBound"
                    )
                    for row in group[1:]:
                        maxima["overheadAllocationDriftAbsolute"] = max(
                            maxima["overheadAllocationDriftAbsolute"],
                            abs(mp.mpf(row[allocation_key]) - mp.mpf(reference[allocation_key])),
                        )
                        expected_shift = mp.mpf(row["fixedNormalizedOverhead"]) - mp.mpf(
                            reference["fixedNormalizedOverhead"]
                        )
                        actual_shift = mp.mpf(row["minimumNormalizedCost"]) - mp.mpf(
                            reference["minimumNormalizedCost"]
                        )
                        maxima["overheadCostTranslationAbsolute"] = max(
                            maxima["overheadCostTranslationAbsolute"],
                            abs(actual_shift - expected_shift),
                        )
                        overhead_invariance_comparisons += 1
                        overhead_translation_comparisons += 1
                for overhead in OVERHEADS:
                    group = select_rows(
                        rows, exponent=exponent, cost_ratio=cost_ratio, overhead=overhead
                    )
                    for left, right in zip(group, group[1:]):
                        if mp.mpf(right["minimumNormalizedCost"]) <= mp.mpf(
                            left["minimumNormalizedCost"]
                        ):
                            raise ValueError("v529-floor-monotonicity")
                        floor_monotonic_comparisons += 1

    for exponent in EXPONENTS:
        for floor_fraction in FLOOR_FRACTIONS:
            for overhead in OVERHEADS:
                row = select_rows(
                    stochastic,
                    exponent=exponent,
                    cost_ratio=mp.mpf(1),
                    floor=floor_fraction,
                    overhead=overhead,
                )[0]
                maxima["stochasticEqualWeightSymmetryAbsolute"] = max(
                    maxima["stochasticEqualWeightSymmetryAbsolute"],
                    abs(mp.mpf(row["scienceFractionOfRandomBudget"]) - mp.mpf("0.5")),
                )

    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v529-threshold:{maxima}")

    stochastic_surface = [
        display_row(row)
        for row in select_rows(stochastic, floor=mp.mpf(0), overhead=mp.mpf(0))
    ]
    deterministic_surface = [
        display_row(row)
        for row in select_rows(deterministic, floor=mp.mpf(0), overhead=mp.mpf(0))
    ]
    stochastic_floor = [
        display_row(row)
        for row in select_rows(
            stochastic, exponent=mp.mpf(2), cost_ratio=mp.mpf(1), overhead=mp.mpf(0)
        )
    ]
    deterministic_floor = [
        display_row(row)
        for row in select_rows(
            deterministic, exponent=mp.mpf(2), cost_ratio=mp.mpf(1), overhead=mp.mpf(0)
        )
    ]
    stochastic_overhead = [
        display_row(row)
        for row in select_rows(
            stochastic,
            exponent=mp.mpf(2),
            cost_ratio=mp.mpf(1),
            floor=mp.mpf("0.25"),
        )
    ]
    deterministic_overhead = [
        display_row(row)
        for row in select_rows(
            deterministic,
            exponent=mp.mpf(2),
            cost_ratio=mp.mpf(1),
            floor=mp.mpf("0.25"),
        )
    ]
    display_geometry = {
        "stochasticExponentRatioSurface": stochastic_surface,
        "deterministicExponentRatioSurface": deterministic_surface,
        "stochasticFloorEnvelope": stochastic_floor,
        "deterministicFloorEnvelope": deterministic_floor,
        "stochasticOverheadTranslation": stochastic_overhead,
        "deterministicOverheadTranslation": deterministic_overhead,
        "scientificGeometryInputCount": 68,
    }
    if sum(len(value) for value in display_geometry.values() if isinstance(value, list)) != 68:
        raise ValueError("v529-display-geometry-count")

    source_paths = [
        PATHS["v528"],
        PATHS["v511"],
        PATHS["v458"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-cost-law-robustness-v529.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v529-kerr-cost-law-robustness-envelope-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "parametric-cost-law-robustness-qualified-operational-model-unavailable",
        "source": {
            "v528ArtifactSha256": v528["artifactSha256"],
            "v511ArtifactSha256": v511["artifactSha256"],
            "v458ArtifactSha256": v458["artifactSha256"],
            "v314StateSha256": dense["stateSha256"],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 160,
            "analyticConstrainedOptimum": True,
            "independentGoldenSectionIterationsPerCell": ITERATIONS,
            "randomnessUsed": False,
        },
        "parameterGrid": {
            "precisionExponents": [decimal_string(value) for value in EXPONENTS],
            "calibrationToScienceCostWeights": [
                decimal_string(value) for value in COST_RATIOS
            ],
            "systematicFloorFractions": [decimal_string(value) for value in FLOOR_FRACTIONS],
            "fixedNormalizedOverheads": [decimal_string(value) for value in OVERHEADS],
            "precisionExponentMeasured": False,
            "costWeightMeasured": False,
            "systematicFloorMeasured": False,
            "fixedOverheadMeasured": False,
        },
        "costLaw": {
            "stochasticEquation": "cost=science_variance^(-p/2)+weight*calibration_variance^(-p/2)+fixed_overhead",
            "deterministicEquation": "cost=science_bound^(-p)+weight*calibration_bound^(-p)+fixed_overhead",
            "fixedOverheadAllocationIndependentByDefinition": True,
            "fixedOverheadCanShiftOptimum": False,
            "systematicFloorReducesAvailableRandomBudget": True,
            "acquisitionOverheadCouplingModeled": False,
            "stressModelOnlyNotOperationalCost": True,
        },
        "stochasticRobustness": {
            "constraint": "science_variance+calibration_variance=2*(1-systematic_variance_fraction)",
            "sampleCount": len(stochastic),
            "samples": stochastic,
            "selectedSampleIndex": None,
        },
        "deterministicRobustness": {
            "constraint": "science_bound+calibration_bound/sqrt(2)=1-systematic_bound_fraction",
            "sampleCount": len(deterministic),
            "samples": deterministic,
            "selectedSampleIndex": None,
        },
        "displayGeometry": display_geometry,
        "robustnessAudits": {
            "overheadAllocationInvarianceComparisons": overhead_invariance_comparisons,
            "overheadCostTranslationComparisons": overhead_translation_comparisons,
            "floorMonotonicityComparisons": floor_monotonic_comparisons,
            "equalWeightStochasticSymmetryChecks": len(EXPONENTS)
            * len(FLOOR_FRACTIONS)
            * len(OVERHEADS),
            "overheadAllocationInvariant": True,
            "overheadCostTranslationExact": True,
            "floorCostStrictlyIncreasing": True,
        },
        "selectionBoundary": {
            "physicalTargetAvailable": False,
            "measuredPrecisionExponentAvailable": False,
            "calibrationToScienceCostRatioAvailable": False,
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
            "precisionExponentCount": len(EXPONENTS),
            "costRatioCount": len(COST_RATIOS),
            "systematicFloorCount": len(FLOOR_FRACTIONS),
            "fixedOverheadCount": len(OVERHEADS),
            "stochasticRobustnessCellCount": len(stochastic),
            "deterministicRobustnessCellCount": len(deterministic),
            "fullFactorialCellCount": len(stochastic) + len(deterministic),
            "optimizerIterationCount": ITERATIONS * (len(stochastic) + len(deterministic)),
            "scientificGeometryInputCount": 68,
            "measuredCalibrationFileCount": 0,
            "requiredMeasuredCalibrationFileCount": 6,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT)},
        "qualification": {
            "analyticRobustnessEnvelopeQualified": True,
            "independentOptimizerQualified": True,
            "overheadInvarianceQualified": True,
            "systematicFloorMonotonicityQualified": True,
            "parametricRobustnessQualified": True,
            "operationalCostModelQualified": False,
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
                "fullFactorialCells": artifact["counts"]["fullFactorialCellCount"],
                "optimizerIterations": artifact["counts"]["optimizerIterationCount"],
                "scientificGeometryInputs": artifact["counts"]["scientificGeometryInputCount"],
                "selectedModel": "unavailable",
                "recommendedAllocation": "unavailable",
                "measuredCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

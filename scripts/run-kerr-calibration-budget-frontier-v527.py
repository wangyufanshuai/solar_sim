from __future__ import annotations

import hashlib
import itertools
import json
import os
from pathlib import Path
from typing import Any

import mpmath as mp


ROOT = Path.cwd()
PATHS = {
    "v526": Path("dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-calibration-budget-frontier-v527/frontier.json"),
}
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"}
RESIDUAL_LIMIT = mp.mpf("1e-60")
SOURCE_DECIMAL_LIMIT = mp.mpf("1e-24")
SAMPLE_DENOMINATOR = 32


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
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()


def decimal_string(value: mp.mpf | float | int) -> str:
    return mp.nstr(mp.mpf(str(value)), 25)


def max_abs(matrix: mp.matrix) -> mp.mpf:
    return max(abs(matrix[row, column]) for row in range(matrix.rows) for column in range(matrix.cols))


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v526 = read_json(PATHS["v526"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v526.get("version") != "v526-kerr-calibration-uncertainty-transfer-v1"
        or canonical_sha(v526) != v526.get("artifactSha256")
        or v526.get("qualification", {}).get("uncertaintyTransferQualified") is not True
        or v526.get("qualification", {}).get("physicalUncertaintyQualified") is not False
        or v526.get("acquisitionBoundary", {}).get("readyMeasuredFileCount") != 0
        or v511.get("counts", {}).get("measuredCalibrationFiles") != 0
        or v511.get("counts", {}).get("requiredMeasuredCalibrationFiles") != 6
        or v458.get("inspect", {}).get("readyFileCount") != 0
        or v458.get("inspect", {}).get("attemptConsumed") is not False
        or dense.get("status") != "incomplete-0-of-49"
        or dense.get("completedShardCount") != 0
        or dense.get("attemptConsumed") is not False
        or dense.get("aggregateAvailable") is not False
        or formal.get("version") != "v263-current-product-evidence-pointer"
        or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn"
        or formal_evidence.get("contracts", {}).get("singleCanvas") is not True
        or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603
        or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84
    ):
        raise ValueError("v527-upstream-boundary")

    inverse_sqrt_two = 1 / mp.sqrt(2)
    observable = mp.matrix([
        [mp.mpf("0.5"), 0, mp.mpf("-0.5"), 0, -inverse_sqrt_two, 0],
        [0, mp.mpf("0.5"), 0, mp.mpf("-0.5"), 0, -inverse_sqrt_two],
    ])
    source_observable = mp.matrix([
        [mp.mpf(value) for value in row]
        for row in v526["observableTransfer"]["coefficientRows"]
    ])
    source_decimal_residual = max_abs(source_observable - observable)
    if source_decimal_residual >= SOURCE_DECIMAL_LIMIT:
        raise ValueError("v527-source-decimal-reconstruction")

    stochastic_frontier = []
    stochastic_matrix_residual = mp.mpf(0)
    for index in range(SAMPLE_DENOMINATOR + 1):
        science_fraction = mp.mpf(index) / SAMPLE_DENOMINATOR
        calibration_fraction = 1 - science_fraction
        science_sigma_per_target = mp.sqrt(2 * science_fraction)
        calibration_sigma_per_target = mp.sqrt(2 * calibration_fraction)
        input_covariance = mp.diag([
            science_sigma_per_target ** 2,
            science_sigma_per_target ** 2,
            science_sigma_per_target ** 2,
            science_sigma_per_target ** 2,
            calibration_sigma_per_target ** 2,
            calibration_sigma_per_target ** 2,
        ])
        output_covariance = observable * input_covariance * observable.T
        stochastic_matrix_residual = max(
            stochastic_matrix_residual,
            max_abs(output_covariance - mp.eye(2)),
        )
        stochastic_frontier.append({
            "index": index,
            "scienceVarianceFraction": decimal_string(science_fraction),
            "calibrationVarianceFraction": decimal_string(calibration_fraction),
            "scienceSigmaPerTargetSigma": decimal_string(science_sigma_per_target),
            "calibrationSigmaPerTargetSigma": decimal_string(calibration_sigma_per_target),
            "qVariancePerTargetVariance": decimal_string(output_covariance[0, 0]),
            "uVariancePerTargetVariance": decimal_string(output_covariance[1, 1]),
            "quCovariancePerTargetVariance": decimal_string(output_covariance[0, 1]),
            "physicalScaleAvailable": False,
        })

    deterministic_frontier = []
    deterministic_vertex_residual = mp.mpf(0)
    analytic_joint = mp.sqrt(2)
    for index in range(SAMPLE_DENOMINATOR + 1):
        science_fraction = mp.mpf(index) / SAMPLE_DENOMINATOR
        calibration_fraction = 1 - science_fraction
        science_bound_per_target = science_fraction
        calibration_bound_per_target = mp.sqrt(2) * calibration_fraction
        maximum_q = mp.mpf(0)
        maximum_u = mp.mpf(0)
        maximum_joint = mp.mpf(0)
        for signs in itertools.product((-1, 1), repeat=6):
            scaled_error = mp.matrix([
                [mp.mpf(signs[channel]) * (science_bound_per_target if channel < 4 else calibration_bound_per_target)]
                for channel in range(6)
            ])
            output_error = observable * scaled_error
            maximum_q = max(maximum_q, abs(output_error[0]))
            maximum_u = max(maximum_u, abs(output_error[1]))
            maximum_joint = max(maximum_joint, mp.sqrt(output_error[0] ** 2 + output_error[1] ** 2))
        deterministic_vertex_residual = max(
            deterministic_vertex_residual,
            abs(maximum_q - 1),
            abs(maximum_u - 1),
            abs(maximum_joint - analytic_joint),
        )
        deterministic_frontier.append({
            "index": index,
            "scienceBoundFraction": decimal_string(science_fraction),
            "calibrationBoundFraction": decimal_string(calibration_fraction),
            "scienceBoundPerTargetBound": decimal_string(science_bound_per_target),
            "calibrationBoundPerTargetBound": decimal_string(calibration_bound_per_target),
            "maximumQPerTargetBound": decimal_string(maximum_q),
            "maximumUPerTargetBound": decimal_string(maximum_u),
            "maximumJointL2PerTargetBound": decimal_string(maximum_joint),
            "vertexCount": 64,
            "physicalScaleAvailable": False,
        })

    correlation_surface = []
    correlation_residual = mp.mpf(0)
    rho_values = [mp.mpf("-0.9"), mp.mpf("-0.5"), mp.mpf(0), mp.mpf("0.5"), mp.mpf("0.9")]
    for frontier in stochastic_frontier:
        science_fraction = mp.mpf(frontier["index"]) / SAMPLE_DENOMINATOR
        calibration_fraction = 1 - science_fraction
        science_sigma = mp.sqrt(2 * science_fraction)
        calibration_sigma = mp.sqrt(2 * calibration_fraction)
        for rho in rho_values:
            covariance = mp.diag([
                science_sigma ** 2,
                science_sigma ** 2,
                science_sigma ** 2,
                science_sigma ** 2,
                calibration_sigma ** 2,
                calibration_sigma ** 2,
            ])
            covariance[4, 5] = rho * calibration_sigma ** 2
            covariance[5, 4] = rho * calibration_sigma ** 2
            output = observable * covariance * observable.T
            expected_covariance = rho * calibration_fraction
            expected_major = 1 + abs(expected_covariance)
            expected_minor = 1 - abs(expected_covariance)
            correlation_residual = max(
                correlation_residual,
                abs(output[0, 1] - expected_covariance),
                abs(max(mp.eigsy(output, eigvals_only=True)) - expected_major),
                abs(min(mp.eigsy(output, eigvals_only=True)) - expected_minor),
            )
            correlation_surface.append({
                "frontierIndex": frontier["index"],
                "constraintCorrelation": decimal_string(rho),
                "observableCovariancePerTargetVariance": decimal_string(output[0, 1]),
                "majorEigenvaluePerTargetVariance": decimal_string(expected_major),
                "minorEigenvaluePerTargetVariance": decimal_string(expected_minor),
                "stressSampleOnlyNotPrior": True,
            })

    maxima = {
        "stochasticFrontierMatrixAbsolute": stochastic_matrix_residual,
        "deterministicFrontierVertexAbsolute": deterministic_vertex_residual,
        "correlationSurfaceAnalyticAbsolute": correlation_residual,
    }
    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v527-threshold:{maxima}")

    source_paths = [PATHS["v526"], PATHS["v511"], PATHS["v458"], PATHS["dense"], PATHS["formal"], Path("scripts/run-kerr-calibration-budget-frontier-v527.py")]
    source_manifest = sorted(({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda entry: entry["path"])
    unsigned = {
        "version": "v527-kerr-calibration-budget-frontier-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "normalized-budget-frontiers-qualified-physical-target-and-cost-model-unavailable",
        "source": {"v526ArtifactSha256": v526["artifactSha256"], "v511ArtifactSha256": v511["artifactSha256"], "v458ArtifactSha256": v458["artifactSha256"], "v314StateSha256": dense["stateSha256"]},
        "oracle": {"backend": "mpmath-1.3.0", "decimalDigits": 80, "matrixAndClosedFormCrossCheck": True, "deterministicVertexEnumeration": True, "randomnessUsed": False},
        "sourceQuantizationAudit": {"sourceSerializedDecimalDigits": 25, "analyticRowsReconstructed": True, "maximumSourceDecimalAbsolute": decimal_string(source_decimal_residual), "limit": decimal_string(SOURCE_DECIMAL_LIMIT), "includedInMultiprecisionOracleResidual": False},
        "stochasticVarianceFrontier": {
            "equation": "0.5*sigma_science^2+0.5*sigma_calibration^2=target_variance",
            "normalization": "target-standard-deviation-equals-one",
            "sampleCount": len(stochastic_frontier),
            "samples": stochastic_frontier,
            "selectedSampleIndex": None,
            "selectionRequiresPhysicalTargetAndCostModel": True,
        },
        "deterministicBoundFrontier": {
            "equation": "epsilon_science+epsilon_calibration/sqrt(2)=target_absolute_bound",
            "normalization": "target-absolute-bound-equals-one",
            "sampleCount": len(deterministic_frontier),
            "samples": deterministic_frontier,
            "selectedSampleIndex": None,
            "selectionRequiresPhysicalTargetAndCostModel": True,
        },
        "correlationStressSurface": {
            "rhoSampleCount": len(rho_values),
            "frontierSampleCount": len(stochastic_frontier),
            "rowCount": len(correlation_surface),
            "rows": correlation_surface,
            "closedForm": "covariance_Q_U_over_target_variance=rho*(1-science_variance_fraction)",
            "physicalCorrelationPriorAvailable": False,
        },
        "allocationBoundary": {
            "physicalTargetStandardDeviationAvailable": False,
            "physicalTargetAbsoluteBoundAvailable": False,
            "scienceAcquisitionCostModelAvailable": False,
            "calibrationAcquisitionCostModelAvailable": False,
            "recommendedAllocationAvailable": False,
            "automaticAllocationSelectionAllowed": False,
            "normalizedFrontierReplacesMeasuredUncertainty": False,
        },
        "acquisitionBoundary": {
            "requiredMeasuredFileCount": 6,
            "readyMeasuredFileCount": 0,
            "measuredCalibrationRowCount": 0,
            "numericalScienceCovarianceAvailable": False,
            "numericalScienceErrorBarsAvailable": False,
            "scienceRecoveryExecutable": False,
        },
        "counts": {"stochasticFrontierSampleCount": 33, "deterministicFrontierSampleCount": 33, "frontierSampleCount": 66, "correlationSurfaceRowCount": 165, "vertexEvaluations": 2112, "measuredCalibrationFileCount": 0, "requiredMeasuredCalibrationFileCount": 6, "expectedElectronCountRowCount": 0, "observedCountRowCount": 0, "sciencePixelRowCount": 0},
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT), "sourceDecimalReconstruction": decimal_string(SOURCE_DECIMAL_LIMIT)},
        "qualification": {"stochasticVarianceFrontierQualified": True, "deterministicBoundFrontierQualified": True, "correlationStressSurfaceQualified": True, "normalizedBudgetFrontierQualified": True, "physicalBudgetQualified": False, "measuredInstrumentQualified": False, "scienceAuthorityPromotionAllowed": False},
        "boundary": {"normalizedCoefficientAuditOnly": True, "physicalNoiseModelAvailable": False, "physicalCalibrationPriorAvailable": False, "measuredCalibrationAvailable": False, "expectedElectronCountsAvailable": False, "observedCountsAvailable": False, "scienceRasterAuthorityAvailable": False, "cinematicScienceWritebackAllowed": False, "networkAttempted": False, "automaticRetryApplied": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_write(PATHS["output"], artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "stochasticSamples": 33, "deterministicSamples": 33, "correlationRows": 165, "vertexEvaluations": 2112, "recommendedAllocation": "unavailable", "measuredCalibration": "0/6", "denseCampaign": "0/49"}, indent=2))


if __name__ == "__main__":
    main()

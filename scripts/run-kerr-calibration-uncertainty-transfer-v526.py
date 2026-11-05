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
    "v525": Path("dist/science/kerr-calibration-excitation-design-v525/design.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json"),
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
SOURCE_DECIMAL_LIMIT = mp.mpf("1e-24")


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
    return hashlib.sha256(
        json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ).hexdigest()


def decimal_string(value: mp.mpf | float | int) -> str:
    return mp.nstr(mp.mpf(str(value)), 25)


def values(matrix: mp.matrix) -> list[list[str]]:
    return [
        [decimal_string(matrix[row, column]) for column in range(matrix.cols)]
        for row in range(matrix.rows)
    ]


def max_abs(matrix: mp.matrix) -> mp.mpf:
    return max(
        abs(matrix[row, column])
        for row in range(matrix.rows)
        for column in range(matrix.cols)
    )


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v525 = read_json(PATHS["v525"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v525.get("version") != "v525-kerr-calibration-excitation-design-v1"
        or canonical_sha(v525) != v525.get("artifactSha256")
        or v525.get("selectedDesign", {}).get("rank") != 6
        or v525.get("selectedDesign", {}).get("nullity") != 0
        or v525.get("selectedDesign", {}).get("constraintValuesAvailable") is not False
        or v525.get("acquisitionBoundary", {}).get("readyMeasuredFileCount") != 0
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
        raise ValueError("v526-upstream-boundary")

    source_design = mp.matrix(
        [[mp.mpf(value) for value in row] for row in v525["selectedDesign"]["matrix"]]
    )
    inverse_sqrt_two = 1 / mp.sqrt(2)
    design = mp.matrix(
        [
            [1, 0, 1, 0, 0, 0],
            [0, 1, 0, 1, 0, 0],
            [-1, 0, 0, 0, 1, 0],
            [0, -1, 0, 0, 0, 1],
            [0, 0, inverse_sqrt_two, 0, -inverse_sqrt_two, 0],
            [0, 0, 0, inverse_sqrt_two, 0, -inverse_sqrt_two],
        ]
    )
    source_decimal_reconstruction_residual = max_abs(source_design - design)
    if source_decimal_reconstruction_residual >= SOURCE_DECIMAL_LIMIT:
        raise ValueError("v526-source-decimal-reconstruction")
    estimator = design ** -1
    inverse_identity_residual = max_abs(estimator * design - mp.eye(6))
    analytic_observable = mp.matrix(
        [
            [mp.mpf("0.5"), 0, mp.mpf("-0.5"), 0, -inverse_sqrt_two, 0],
            [0, mp.mpf("0.5"), 0, mp.mpf("-0.5"), 0, -inverse_sqrt_two],
        ]
    )
    observable = mp.matrix([[estimator[row, column] for column in range(6)] for row in range(2)])
    analytic_observable_residual = max_abs(observable - analytic_observable)

    science_covariance = mp.diag([1, 1, 1, 1, 0, 0])
    calibration_covariance = mp.diag([0, 0, 0, 0, 1, 1])
    output_science_covariance = estimator * science_covariance * estimator.T
    output_calibration_covariance = estimator * calibration_covariance * estimator.T
    output_total_covariance = output_science_covariance + output_calibration_covariance
    observable_science_covariance = mp.matrix(
        [[output_science_covariance[row, column] for column in range(2)] for row in range(2)]
    )
    observable_calibration_covariance = mp.matrix(
        [[output_calibration_covariance[row, column] for column in range(2)] for row in range(2)]
    )
    observable_total_covariance = mp.matrix(
        [[output_total_covariance[row, column] for column in range(2)] for row in range(2)]
    )
    analytic_half_identity = mp.mpf("0.5") * mp.eye(2)
    covariance_decomposition_residual = max(
        max_abs(observable_science_covariance - analytic_half_identity),
        max_abs(observable_calibration_covariance - analytic_half_identity),
        max_abs(observable_total_covariance - mp.eye(2)),
    )

    correlation_samples = []
    correlation_residual = mp.mpf(0)
    for rho in [mp.mpf("-0.9"), mp.mpf("-0.5"), mp.mpf(0), mp.mpf("0.5"), mp.mpf("0.9")]:
        input_covariance = mp.eye(6)
        input_covariance[4, 5] = rho
        input_covariance[5, 4] = rho
        output_covariance = estimator * input_covariance * estimator.T
        observable_covariance = mp.matrix(
            [[output_covariance[row, column] for column in range(2)] for row in range(2)]
        )
        observed_correlation = observable_covariance[0, 1] / mp.sqrt(
            observable_covariance[0, 0] * observable_covariance[1, 1]
        )
        analytic_correlation = rho / 2
        correlation_residual = max(correlation_residual, abs(observed_correlation - analytic_correlation))
        correlation_samples.append(
            {
                "constraintCorrelation": decimal_string(rho),
                "observableCorrelation": decimal_string(observed_correlation),
                "analyticObservableCorrelation": decimal_string(analytic_correlation),
                "stressSampleOnlyNotPrior": True,
            }
        )

    vertex_max_q = mp.mpf(0)
    vertex_max_u = mp.mpf(0)
    vertex_max_joint = mp.mpf(0)
    maximizing_vertex_count = 0
    for signs in itertools.product((-1, 1), repeat=6):
        error = mp.matrix([[mp.mpf(sign)] for sign in signs])
        observable_error = observable * error
        absolute_q = abs(observable_error[0])
        absolute_u = abs(observable_error[1])
        joint = mp.sqrt(observable_error[0] ** 2 + observable_error[1] ** 2)
        vertex_max_q = max(vertex_max_q, absolute_q)
        vertex_max_u = max(vertex_max_u, absolute_u)
        if joint > vertex_max_joint + RESIDUAL_LIMIT:
            vertex_max_joint = joint
            maximizing_vertex_count = 1
        elif abs(joint - vertex_max_joint) < RESIDUAL_LIMIT:
            maximizing_vertex_count += 1
    analytic_scalar_bound = 1 + inverse_sqrt_two
    analytic_joint_bound = mp.sqrt(2) * analytic_scalar_bound
    vertex_bound_residual = max(
        abs(vertex_max_q - analytic_scalar_bound),
        abs(vertex_max_u - analytic_scalar_bound),
        abs(vertex_max_joint - analytic_joint_bound),
    )
    maxima = {
        "inverseIdentityAbsolute": inverse_identity_residual,
        "analyticObservableRowAbsolute": analytic_observable_residual,
        "covarianceDecompositionAbsolute": covariance_decomposition_residual,
        "correlationTransferAbsolute": correlation_residual,
        "unitBoxVertexBoundAbsolute": vertex_bound_residual,
    }
    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v526-threshold:{maxima}")

    source_paths = [
        PATHS["v525"],
        PATHS["v511"],
        PATHS["v458"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-calibration-uncertainty-transfer-v526.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v526-kerr-calibration-uncertainty-transfer-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "unit-uncertainty-transfer-qualified-measured-scale-unavailable",
        "source": {
            "v525ArtifactSha256": v525["artifactSha256"],
            "v511ArtifactSha256": v511["artifactSha256"],
            "v458ArtifactSha256": v458["artifactSha256"],
            "v314StateSha256": dense["stateSha256"],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "matrixInverseAndCovariance": True,
            "independentClosedFormObservableRows": True,
            "deterministicUnitBoxVertexEnumeration": True,
            "randomnessUsed": False,
        },
        "inputChannelOrder": [
            "science-a000",
            "science-a045",
            "science-a090",
            "science-a135",
            "calibration-delta-q",
            "calibration-delta-u",
        ],
        "outputParameterOrder": v525["parameterLabels"],
        "estimatorMatrix": values(estimator),
        "sourceQuantizationAudit": {
            "sourceSerializedDecimalDigits": 25,
            "analyticMatrixReconstructed": True,
            "maximumSourceDecimalAbsolute": decimal_string(source_decimal_reconstruction_residual),
            "limit": decimal_string(SOURCE_DECIMAL_LIMIT),
            "includedInMultiprecisionOracleResidual": False,
        },
        "observableTransfer": {
            "parameterIds": ["Q-over-I", "U-over-I"],
            "coefficientRows": values(observable),
            "closedForm": [
                "delta(Q/I)=0.5*e_a000-0.5*e_a090-(1/sqrt(2))*e_delta_q",
                "delta(U/I)=0.5*e_a045-0.5*e_a135-(1/sqrt(2))*e_delta_u",
            ],
            "rowL1Norms": [decimal_string(analytic_scalar_bound), decimal_string(analytic_scalar_bound)],
            "rowL2Norms": ["1.0", "1.0"],
        },
        "unitVarianceTransfer": {
            "inputSemantics": "independent unit variance coefficients; dimensionless transfer audit only",
            "scienceContribution": values(observable_science_covariance),
            "calibrationContribution": values(observable_calibration_covariance),
            "total": values(observable_total_covariance),
            "varianceRows": [
                {"parameterId": "Q-over-I", "scienceCoefficient": "0.5", "calibrationCoefficient": "0.5", "totalCoefficient": "1.0", "physicalVarianceAvailable": False},
                {"parameterId": "U-over-I", "scienceCoefficient": "0.5", "calibrationCoefficient": "0.5", "totalCoefficient": "1.0", "physicalVarianceAvailable": False},
            ],
        },
        "correlatedConstraintStress": {
            "sampleCount": len(correlation_samples),
            "samples": correlation_samples,
            "closedForm": "corr(Q/I,U/I)=rho_constraint/2 for unit science and calibration variances",
            "physicalCorrelationPriorAvailable": False,
        },
        "boundedUnitErrorTransfer": {
            "inputSemantics": "each of six normalized input errors independently bounded by absolute one",
            "vertexCount": 64,
            "maximumQOverIAbsoluteCoefficient": decimal_string(vertex_max_q),
            "maximumUOverIAbsoluteCoefficient": decimal_string(vertex_max_u),
            "maximumJointL2Coefficient": decimal_string(vertex_max_joint),
            "analyticScalarCoefficient": decimal_string(analytic_scalar_bound),
            "analyticJointL2Coefficient": decimal_string(analytic_joint_bound),
            "maximizingVertexCount": maximizing_vertex_count,
            "physicalErrorBoundAvailable": False,
        },
        "acquisitionBoundary": {
            "requiredMeasuredFileCount": 6,
            "readyMeasuredFileCount": 0,
            "measuredCalibrationRowCount": 0,
            "scienceNoiseScaleAvailable": False,
            "calibrationNoiseScaleAvailable": False,
            "calibrationCorrelationPriorAvailable": False,
            "numericalScienceCovarianceAvailable": False,
            "numericalScienceErrorBarsAvailable": False,
            "designTransferReplacesMeasuredUncertainty": False,
        },
        "counts": {
            "inputChannelCount": 6,
            "outputParameterCount": 6,
            "observableParameterCount": 2,
            "varianceComponentCount": 4,
            "correlationStressSampleCount": 5,
            "unitBoxVertexCount": 64,
            "measuredCalibrationFileCount": 0,
            "requiredMeasuredCalibrationFileCount": 6,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {
            "multiprecisionResidual": decimal_string(RESIDUAL_LIMIT),
            "sourceDecimalReconstruction": decimal_string(SOURCE_DECIMAL_LIMIT),
        },
        "qualification": {
            "matrixInverseQualified": True,
            "closedFormObservableTransferQualified": True,
            "unitVarianceDecompositionQualified": True,
            "correlationStressTransferQualified": True,
            "boundedUnitErrorTransferQualified": True,
            "uncertaintyTransferQualified": True,
            "physicalUncertaintyQualified": False,
            "measuredInstrumentQualified": False,
            "scienceAuthorityPromotionAllowed": False,
        },
        "boundary": {
            "normalizedCoefficientAuditOnly": True,
            "physicalNoiseModelAvailable": False,
            "physicalCalibrationPriorAvailable": False,
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
                "observableRows": 2,
                "unitVarianceScienceCoefficient": "0.5",
                "unitVarianceCalibrationCoefficient": "0.5",
                "unitBoxVertices": 64,
                "maximumScalarCoefficient": artifact["boundedUnitErrorTransfer"]["maximumQOverIAbsoluteCoefficient"],
                "maximumJointL2Coefficient": artifact["boundedUnitErrorTransfer"]["maximumJointL2Coefficient"],
                "measuredCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

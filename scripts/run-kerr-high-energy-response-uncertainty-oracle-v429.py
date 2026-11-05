from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
SOURCE_RESPONSE = ROOT / "dist/science/kerr-high-energy-response-v426/response-contract.json"
SOURCE_INTAKE = ROOT / "dist/science/kerr-high-energy-response-intake-v428/intake-firewall.json"
OUTPUT = ROOT / "dist/science/kerr-high-energy-response-uncertainty-v429"
ORACLE = OUTPUT / "uncertainty-oracle.json"
PROTOCOL = OUTPUT / "independent-validation-protocol.json"
EXPECTED_RESPONSE_FILE_SHA = "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061"
EXPECTED_RESPONSE_ARTIFACT_SHA = "17de5699cef0619dc3ea165ede2d05828ec55bfd3b9cc09a12d24e4c35637c44"
EXPECTED_INTAKE_FILE_SHA = "d1ddacbb369610f58f261ed1502f869883cfd09c8bd50e8065f6cdbc9f7899c5"
EXPECTED_INTAKE_ARTIFACT_SHA = "38ddd6aa601cf6bba5ccb2a05195de51d7cf031704323959284ffc30dcdc82fb"


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
    payload = json.dumps(normalize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def forward_counts(parameters: np.ndarray, redistribution: np.ndarray, photon_flux: np.ndarray, q_fraction: np.ndarray, u_fraction: np.ndarray, analyzer_angles_deg: np.ndarray, exposure_s: float) -> np.ndarray:
    area = parameters[0:6]
    modulation = parameters[6:12]
    angle_zero_deg = parameters[12:18]
    background = parameters[18:24]
    outputs: list[np.ndarray] = []
    for analyzer_angle in analyzer_angles_deg:
        phase = 2.0 * np.pi / 180.0 * (analyzer_angle - angle_zero_deg)
        polarized_term = q_fraction * np.cos(phase) + u_fraction * np.sin(phase)
        modulation_factor = 1.0 + modulation * polarized_term
        source_rate = photon_flux * area * modulation_factor
        outputs.append(exposure_s * (source_rate @ redistribution + background))
    return np.concatenate(outputs)


def analytic_parameter_jacobian(parameters: np.ndarray, redistribution: np.ndarray, photon_flux: np.ndarray, q_fraction: np.ndarray, u_fraction: np.ndarray, analyzer_angles_deg: np.ndarray, exposure_s: float) -> np.ndarray:
    area = parameters[0:6]
    modulation = parameters[6:12]
    angle_zero_deg = parameters[12:18]
    jacobian = np.zeros((24, 24), dtype=np.float64)
    radians_per_degree = np.pi / 180.0
    for angle_index, analyzer_angle in enumerate(analyzer_angles_deg):
        phase = 2.0 * radians_per_degree * (analyzer_angle - angle_zero_deg)
        polarized_term = q_fraction * np.cos(phase) + u_fraction * np.sin(phase)
        modulation_factor = 1.0 + modulation * polarized_term
        angle_derivative = modulation * 2.0 * radians_per_degree * (q_fraction * np.sin(phase) - u_fraction * np.cos(phase))
        for channel in range(6):
            output_index = angle_index * 6 + channel
            for energy_bin in range(6):
                common = exposure_s * photon_flux[energy_bin] * redistribution[energy_bin, channel]
                jacobian[output_index, energy_bin] = common * modulation_factor[energy_bin]
                jacobian[output_index, 6 + energy_bin] = common * area[energy_bin] * polarized_term[energy_bin]
                jacobian[output_index, 12 + energy_bin] = common * area[energy_bin] * angle_derivative[energy_bin]
            jacobian[output_index, 18 + channel] = exposure_s
    return jacobian


def analytic_redistribution_jacobians(parameters: np.ndarray, photon_flux: np.ndarray, q_fraction: np.ndarray, u_fraction: np.ndarray, analyzer_angles_deg: np.ndarray, exposure_s: float) -> list[np.ndarray]:
    area = parameters[0:6]
    modulation = parameters[6:12]
    angle_zero_deg = parameters[12:18]
    result: list[np.ndarray] = []
    for energy_bin in range(6):
        jacobian = np.zeros((24, 6), dtype=np.float64)
        for angle_index, analyzer_angle in enumerate(analyzer_angles_deg):
            phase = 2.0 * np.pi / 180.0 * (analyzer_angle - angle_zero_deg[energy_bin])
            polarized_term = q_fraction[energy_bin] * np.cos(phase) + u_fraction[energy_bin] * np.sin(phase)
            scale = exposure_s * photon_flux[energy_bin] * area[energy_bin] * (1.0 + modulation[energy_bin] * polarized_term)
            for channel in range(6):
                jacobian[angle_index * 6 + channel, channel] = scale
        result.append(jacobian)
    return result


def complex_step_parameter_jacobian(parameters: np.ndarray, redistribution: np.ndarray, photon_flux: np.ndarray, q_fraction: np.ndarray, u_fraction: np.ndarray, analyzer_angles_deg: np.ndarray, exposure_s: float) -> np.ndarray:
    step = 1e-30
    jacobian = np.empty((24, 24), dtype=np.float64)
    for index in range(24):
        perturbed = parameters.astype(np.complex128)
        perturbed[index] += 1j * step
        jacobian[:, index] = np.imag(forward_counts(perturbed, redistribution.astype(np.complex128), photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)) / step
    return jacobian


def complex_step_redistribution_jacobians(parameters: np.ndarray, redistribution: np.ndarray, photon_flux: np.ndarray, q_fraction: np.ndarray, u_fraction: np.ndarray, analyzer_angles_deg: np.ndarray, exposure_s: float) -> list[np.ndarray]:
    step = 1e-30
    result: list[np.ndarray] = []
    for energy_bin in range(6):
        jacobian = np.empty((24, 6), dtype=np.float64)
        for channel in range(6):
            perturbed = redistribution.astype(np.complex128)
            perturbed[energy_bin, channel] += 1j * step
            jacobian[:, channel] = np.imag(forward_counts(parameters.astype(np.complex128), perturbed, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)) / step
        result.append(jacobian)
    return result


def main() -> None:
    if file_sha(SOURCE_RESPONSE) != EXPECTED_RESPONSE_FILE_SHA or file_sha(SOURCE_INTAKE) != EXPECTED_INTAKE_FILE_SHA:
        raise RuntimeError("v429-source-file-lock")
    response_artifact = json.loads(SOURCE_RESPONSE.read_text(encoding="utf-8"))
    intake_artifact = json.loads(SOURCE_INTAKE.read_text(encoding="utf-8"))
    if response_artifact.get("artifactSha256") != EXPECTED_RESPONSE_ARTIFACT_SHA or intake_artifact.get("artifactSha256") != EXPECTED_INTAKE_ARTIFACT_SHA or intake_artifact.get("view", {}).get("counts", {}).get("measuredSubmissionCount") != 0:
        raise RuntimeError("v429-source-authority-lock")
    response = response_artifact["view"]["fixture"]["manifest"]["response"]
    parameters = np.asarray([*response["effectiveAreaM2"], *response["modulationFactor"], *response["polarizationAngleZeroDeg"], *response["backgroundRateCountsPerS"]], dtype=np.float64)
    parameter_covariance = np.asarray(response["responseParameterCovariance"], dtype=np.float64)
    redistribution = np.asarray(response["redistributionMatrix"], dtype=np.float64)
    redistribution_covariances = [np.asarray(entry, dtype=np.float64) for entry in response["redistributionRowCovariances"]]
    photon_flux = np.asarray([1.8e5, 1.35e5, 9.4e4, 6.1e4, 3.7e4, 2.2e4], dtype=np.float64)
    q_fraction = np.asarray([0.18, 0.12, -0.08, 0.21, -0.16, 0.09], dtype=np.float64)
    u_fraction = np.asarray([-0.06, 0.14, 0.11, -0.07, 0.08, -0.13], dtype=np.float64)
    analyzer_angles_deg = np.asarray([0.0, 22.5, 45.0, 67.5], dtype=np.float64)
    exposure_s = 120.0
    if np.any(np.hypot(q_fraction, u_fraction) >= 1.0):
        raise RuntimeError("v429-stokes-fixture")
    counts = forward_counts(parameters, redistribution, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    parameter_jacobian = analytic_parameter_jacobian(parameters, redistribution, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    redistribution_jacobians = analytic_redistribution_jacobians(parameters, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    complex_parameter = complex_step_parameter_jacobian(parameters, redistribution, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    complex_redistribution = complex_step_redistribution_jacobians(parameters, redistribution, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    parameter_covariance_output = parameter_jacobian @ parameter_covariance @ parameter_jacobian.T
    redistribution_covariance_output = np.zeros((24, 24), dtype=np.float64)
    per_bin_covariance: list[np.ndarray] = []
    for jacobian, covariance in zip(redistribution_jacobians, redistribution_covariances, strict=True):
        contribution = jacobian @ covariance @ jacobian.T
        per_bin_covariance.append(contribution)
        redistribution_covariance_output += contribution
    total_covariance = parameter_covariance_output + redistribution_covariance_output
    parameter_difference = float(np.max(np.abs(parameter_jacobian - complex_parameter)))
    redistribution_difference = float(max(np.max(np.abs(left - right)) for left, right in zip(redistribution_jacobians, complex_redistribution, strict=True)))
    covariance_symmetry = float(np.max(np.abs(total_covariance - total_covariance.T)))
    covariance_minimum = float(np.min(np.linalg.eigvalsh(total_covariance)))
    decomposition_residual = float(np.max(np.abs(total_covariance - parameter_covariance_output - sum(per_bin_covariance, np.zeros((24, 24), dtype=np.float64)))))
    repeat_counts = forward_counts(parameters, redistribution, photon_flux, q_fraction, u_fraction, analyzer_angles_deg, exposure_s)
    deterministic_difference = float(np.max(np.abs(counts - repeat_counts)))
    metrics = {
        "maximumAnalyticComplexStepParameterJacobianDifference": parameter_difference,
        "maximumAnalyticComplexStepRedistributionJacobianDifference": redistribution_difference,
        "maximumOutputCovarianceSymmetryAbsolute": covariance_symmetry,
        "minimumOutputCovarianceEigenvalue": covariance_minimum,
        "maximumCovarianceDecompositionResidual": decomposition_residual,
        "minimumPredictedCount": float(np.min(counts)),
        "maximumPredictedCount": float(np.max(counts)),
        "maximumDeterministicReplayDifference": deterministic_difference,
    }
    if parameter_difference >= 1e-8 or redistribution_difference >= 1e-8 or covariance_symmetry >= 1e-6 or covariance_minimum < -1e-6 or decomposition_residual >= 1e-6 or deterministic_difference != 0.0 or np.any(~np.isfinite(counts)) or np.any(counts <= 0):
        raise RuntimeError(f"v429-oracle-gate:{metrics}")
    fixture = {
        "version": "v429-kerr-high-energy-response-uncertainty-fixture-v1",
        "sourceKind": "test-fixture-nonpublishable",
        "photonFluxPerM2S": photon_flux.tolist(),
        "normalizedStokesQ": q_fraction.tolist(),
        "normalizedStokesU": u_fraction.tolist(),
        "analyzerAnglesDeg": analyzer_angles_deg.tolist(),
        "exposureTimeS": exposure_s,
        "responseParameters": parameters.tolist(),
        "responseParameterCovariance": parameter_covariance.tolist(),
        "redistributionMatrix": redistribution.tolist(),
        "redistributionRowCovariances": [entry.tolist() for entry in redistribution_covariances],
        "observedCounts": None,
        "holdoutDataset": None,
        "measuredAuthorityGranted": False,
    }
    expected = {
        "predictedCounts": counts.tolist(),
        "parameterJacobian": parameter_jacobian.tolist(),
        "redistributionJacobians": [entry.tolist() for entry in redistribution_jacobians],
        "parameterCovarianceContribution": parameter_covariance_output.tolist(),
        "redistributionCovarianceContribution": redistribution_covariance_output.tolist(),
        "totalCovariance": total_covariance.tolist(),
        "metrics": metrics,
    }
    unsigned = {
        "version": "v429-kerr-high-energy-response-uncertainty-python-oracle-v1",
        "generatedAt": intake_artifact["generatedAt"],
        "status": "qualified-forward-operator-jacobian-and-covariance-fixture-only-no-measured-validation",
        "sourceV426ResponseArtifactSha256": EXPECTED_RESPONSE_ARTIFACT_SHA,
        "sourceV426ResponseFileSha256": EXPECTED_RESPONSE_FILE_SHA,
        "sourceV428IntakeArtifactSha256": EXPECTED_INTAKE_ARTIFACT_SHA,
        "sourceV428IntakeFileSha256": EXPECTED_INTAKE_FILE_SHA,
        "fixture": fixture,
        "expected": expected,
        "counts": {"energyBinCount": 6, "detectorChannelCount": 6, "analyzerAngleCount": 4, "predictedCountCount": 24, "responseParameterCount": 24, "redistributionParameterCount": 36, "observedCountCount": 0, "holdoutDatasetCount": 0, "scienceResponseApplicationCount": 0},
        "qualification": {"forwardOperatorQualified": True, "analyticParameterJacobianQualifiedByComplexStep": True, "analyticRedistributionJacobianQualifiedByComplexStep": True, "covariancePropagationQualified": True, "covarianceDecompositionQualified": True, "measuredResponseValidationQualified": False, "residualClosureQualified": False, "scienceResponseApplicationQualified": False},
        "measuredResponseAuthorityGranted": False,
        "independentScientificValidationStatus": "not-run-no-measured-holdout",
        "scienceResponseApplicationCount": 0,
        "networkAttempted": False,
        "boundary": "nonpublishable-mathematical-fixture-validates-forward-operator-jacobians-and-covariance-only-no-observed-counts-residuals-or-measured-authority",
    }
    oracle = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ORACLE, oracle)
    protocol = {
        "version": "v429-kerr-high-energy-response-independent-validation-protocol-v1",
        "status": "protocol-ready-awaiting-independent-measured-holdout",
        "responseIdentityRequired": ["instrument-manufacturer", "instrument-model", "serial-or-campaign-id", "measured-response-artifact-sha256"],
        "holdoutIndependenceRequired": {"calibrationCampaignDisjoint": True, "sourceIdsDisjointFromFit": True, "rawEventFilesDisjoint": True, "analystBlindToAcceptanceUntilFreeze": True, "preregisteredAcceptanceArtifactSha256Required": True},
        "requiredObservationFields": ["holdout-source-id", "source-spectrum-and-covariance", "analyzer-angle", "detector-channel-counts", "background-counts", "exposure-time", "live-time", "detector-temperature", "dead-time-model", "pileup-model", "raw-event-file-sha256", "processing-parameters-sha256"],
        "validationStages": ["identity-and-provenance-lock", "holdout-disjointness", "forward-count-prediction", "full-covariance-propagation", "Poisson-or-declared-count-likelihood", "whitened-residual-and-channel-closure", "energy-redistribution-closure", "modulation-and-angle-zero-closure", "background-closure", "temperature-and-event-loss-stratification", "A-B-deterministic-replay", "independent-review-signoff"],
        "thresholdPolicy": {"numericThresholdsMustBePreregisteredFromInstrumentRequirementsOrDeclaredUncertainty": True, "postHocThresholdTuningForbidden": True, "multipleComparisonControlRequired": True, "effectSizeAndConfidenceIntervalRequired": True, "rssCombinationForbiddenWithoutIndependenceProof": True, "linearUncertaintySumWhenIndependenceUnproven": True},
        "admission": {"structuralIntakePassAloneInsufficient": True, "fixturePerformanceNeverAdmissible": True, "allHoldoutStagesMustPass": True, "negativeEvidencePreserved": True, "automaticRetryForbidden": True, "measuredAuthorityGranted": False, "currentStatus": "not-run-no-measured-holdout"},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "protocol-defines-independent-validation-evidence-but-does-not-claim-a-measured-validation-run",
    }
    atomic_json(PROTOCOL, protocol)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "counts": oracle["counts"], "metrics": metrics, "independentValidation": oracle["independentScientificValidationStatus"], "measuredAuthority": False, "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

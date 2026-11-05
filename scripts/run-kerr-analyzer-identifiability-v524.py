from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import mpmath as mp


ROOT = Path.cwd()
PATHS = {
    "v523": Path("dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-analyzer-identifiability-v524/identifiability.json"),
}
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"}
RESIDUAL_LIMIT = mp.mpf("1e-60")


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


def relative_difference(left: mp.mpf, right: mp.mpf) -> mp.mpf:
    return abs(left - right) / max(mp.mpf("1e-300"), abs(left), abs(right))


def values(matrix: mp.matrix) -> list[list[str]]:
    return [[decimal_string(matrix[row, column]) for column in range(matrix.cols)] for row in range(matrix.rows)]


def singular_values(matrix: mp.matrix) -> list[mp.mpf]:
    _, diagonal, _ = mp.svd(matrix)
    return sorted((mp.mpf(diagonal[index]) for index in range(len(diagonal))), reverse=True)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v523 = read_json(PATHS["v523"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v523.get("version") != "v523-kerr-ideal-analyzer-sensitivity-projection-v1"
        or canonical_sha(v523) != v523.get("artifactSha256")
        or v523.get("counts", {}).get("modulationRowCount") != 864
        or v523.get("qualification", {}).get("idealInverseReconstructionQualified") is not True
        or v523.get("boundary", {}).get("instrumentMuellerMatrixAvailable") is not False
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
        raise ValueError("v524-upstream-boundary")

    angles = [mp.mpf(0), mp.mpf(45), mp.mpf(90), mp.mpf(135)]
    normalized = mp.matrix([[mp.cos(mp.radians(2 * angle)), mp.sin(mp.radians(2 * angle))] for angle in angles])
    beam_rows = []
    for angle in angles:
        cosine, sine = mp.cos(mp.radians(2 * angle)), mp.sin(mp.radians(2 * angle))
        beam_rows.append([mp.mpf("0.5"), mp.mpf("0.5") * cosine, mp.mpf("0.5") * sine])
        beam_rows.append([mp.mpf("0.5"), -mp.mpf("0.5") * cosine, -mp.mpf("0.5") * sine])
    beam = mp.matrix(beam_rows)
    augmented = mp.matrix([[normalized[row, 0], normalized[row, 1]] + [mp.mpf(1) if column == row else mp.mpf(0) for column in range(4)] for row in range(4)])

    beam_singular = singular_values(beam)
    normalized_singular = singular_values(normalized)
    augmented_singular = singular_values(augmented)
    beam_pinv = (beam.T * beam) ** -1 * beam.T
    normalized_pinv = (normalized.T * normalized) ** -1 * normalized.T
    augmented_pinv = augmented.T * (augmented * augmented.T) ** -1
    beam_identity_residual = max_abs(beam_pinv * beam - mp.eye(3))
    normalized_identity_residual = max_abs(normalized_pinv * normalized - mp.eye(2))
    augmented_row_identity_residual = max_abs(augmented * augmented_pinv - mp.eye(4))

    sqrt_two, sqrt_three = mp.sqrt(2), mp.sqrt(3)
    expected_beam = [sqrt_two, mp.mpf(1), mp.mpf(1)]
    expected_normalized = [sqrt_two, sqrt_two]
    expected_augmented = [sqrt_three, sqrt_three, mp.mpf(1), mp.mpf(1)]
    svd_relative = max(
        *(relative_difference(actual, expected) for actual, expected in zip(beam_singular, expected_beam)),
        *(relative_difference(actual, expected) for actual, expected in zip(normalized_singular, expected_normalized)),
        *(relative_difference(actual, expected) for actual, expected in zip(augmented_singular, expected_augmented)),
    )
    normalization = sqrt_three
    nullspace = mp.matrix([
        [mp.mpf(1) / normalization, mp.mpf(0)],
        [mp.mpf(0), mp.mpf(1) / normalization],
        [-mp.mpf(1) / normalization, mp.mpf(0)],
        [mp.mpf(0), -mp.mpf(1) / normalization],
        [mp.mpf(1) / normalization, mp.mpf(0)],
        [mp.mpf(0), mp.mpf(1) / normalization],
    ])
    nullspace_residual = max_abs(augmented * nullspace)
    nullspace_orthonormal_residual = max_abs(nullspace.T * nullspace - mp.eye(2))
    maxima = {
        "svdAnalyticRelative": svd_relative,
        "beamPseudoinverseIdentityAbsolute": beam_identity_residual,
        "normalizedPseudoinverseIdentityAbsolute": normalized_identity_residual,
        "augmentedRowPseudoinverseIdentityAbsolute": augmented_row_identity_residual,
        "nullspaceResidualAbsolute": nullspace_residual,
        "nullspaceOrthonormalAbsolute": nullspace_orthonormal_residual,
    }
    if any(value >= RESIDUAL_LIMIT for value in maxima.values()):
        raise ValueError(f"v524-threshold:{maxima}")

    source_paths = [PATHS["v523"], PATHS["dense"], PATHS["formal"], Path("scripts/run-kerr-analyzer-identifiability-v524.py")]
    source_manifest = sorted(({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda entry: entry["path"])
    unsigned = {
        "version": "v524-kerr-analyzer-identifiability-and-nullspace-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "ideal-operator-ranked-calibration-nullspace-exposed-measured-authority-unavailable",
        "source": {"v523ArtifactSha256": v523["artifactSha256"], "v523AnalyzerPlanSha256": v523["analyzerPlanSha256"]},
        "oracle": {"backend": "mpmath-1.3.0", "decimalDigits": 80, "svdAlgorithm": "mpmath-arbitrary-precision-svd", "analyticGramOracle": True, "randomnessUsed": False},
        "matrices": {
            "idealDualBeam8x3": {"rowLabels": [f"{analyzer['analyzerId']}-ordinary" if index % 2 == 0 else f"{analyzer['analyzerId']}-extraordinary" for analyzer in v523["analyzerPlan"] for index in range(2)], "columnLabels": ["I", "Q", "U"], "values": values(beam)},
            "normalizedDifference4x2": {"rowLabels": [analyzer["analyzerId"] for analyzer in v523["analyzerPlan"]], "columnLabels": ["Q-over-I", "U-over-I"], "values": values(normalized)},
            "uncalibratedBiasAugmented4x6": {"rowLabels": [analyzer["analyzerId"] for analyzer in v523["analyzerPlan"]], "columnLabels": ["Q-over-I", "U-over-I", "bias-a000", "bias-a045", "bias-a090", "bias-a135"], "values": values(augmented)},
        },
        "diagnostics": {
            "idealDualBeam8x3": {"rank": 3, "columnCount": 3, "nullity": 0, "singularValues": [decimal_string(value) for value in beam_singular], "conditionNumber": decimal_string(beam_singular[0] / beam_singular[-1]), "scienceStokesIdentifiable": True},
            "normalizedDifference4x2": {"rank": 2, "columnCount": 2, "nullity": 0, "singularValues": [decimal_string(value) for value in normalized_singular], "conditionNumber": decimal_string(normalized_singular[0] / normalized_singular[-1]), "normalizedLinearStokesIdentifiable": True},
            "uncalibratedBiasAugmented4x6": {"rank": 4, "columnCount": 6, "nullity": 2, "singularValues": [decimal_string(value) for value in augmented_singular], "conditionNumberOnRowSpace": decimal_string(augmented_singular[0] / augmented_singular[-1]), "jointScienceAndBiasIdentifiable": False},
        },
        "nullspace": {"basisColumnCount": 2, "parameterLabels": ["Q-over-I", "U-over-I", "bias-a000", "bias-a045", "bias-a090", "bias-a135"], "basis": values(nullspace), "interpretation": ["Q-over-I is degenerate with opposite a000/a090 channel biases", "U-over-I is degenerate with opposite a045/a135 channel biases"], "measuredCalibrationRequired": True},
        "counts": {"matrixCount": 3, "svdCount": 3, "singularValueCount": 9, "nullspaceDimension": 2, "nullspaceBasisVectorCount": 2, "measuredCalibrationFileCount": 0, "expectedElectronCountRowCount": 0, "observedCountRowCount": 0, "sciencePixelRowCount": 0},
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT)},
        "qualification": {"idealBeamOperatorRankQualified": True, "normalizedDifferenceOperatorRankQualified": True, "analyticSvdAgreementQualified": True, "pseudoinverseQualified": True, "calibrationNullspaceExposed": True, "jointScienceCalibrationIdentifiabilityQualified": False, "measuredInstrumentQualified": False, "scienceAuthorityPromotionAllowed": False},
        "boundary": {"reducedLinearizedBiasFixtureOnly": True, "fullInstrumentMuellerModelAvailable": False, "physicalCalibrationPriorAvailable": False, "measuredCalibrationAvailable": False, "expectedElectronCountsAvailable": False, "observedCountsAvailable": False, "scienceRasterAuthorityAvailable": False, "cinematicScienceWritebackAllowed": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_write(PATHS["output"], artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "idealBeamConditionNumber": artifact["diagnostics"]["idealDualBeam8x3"]["conditionNumber"], "normalizedConditionNumber": artifact["diagnostics"]["normalizedDifference4x2"]["conditionNumber"], "augmentedNullity": 2, "maximumResidual": decimal_string(max(maxima.values())), "measuredCalibration": "0/6", "denseCampaign": "0/49"}, indent=2))


if __name__ == "__main__":
    main()

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
    "v524": Path("dist/science/kerr-analyzer-identifiability-v524/identifiability.json"),
    "v511": Path("dist/science/kerr-instrument-authority-matrix-v511/matrix.json"),
    "v458": Path("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-calibration-excitation-design-v525/design.json"),
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
RANK_THRESHOLD = mp.mpf("1e-60")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def file_sha(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in TRANSIENT
        }
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            canonicalize(value),
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
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


def singular_values(matrix: mp.matrix) -> list[mp.mpf]:
    _, diagonal, _ = mp.svd(matrix)
    return sorted(
        (abs(mp.mpf(diagonal[index])) for index in range(len(diagonal))),
        reverse=True,
    )


def rank(matrix: mp.matrix) -> int:
    return sum(value > RANK_THRESHOLD for value in singular_values(matrix))


def stack(*matrices: mp.matrix) -> mp.matrix:
    rows: list[list[mp.mpf]] = []
    for matrix in matrices:
        rows.extend(
            [[matrix[row, column] for column in range(matrix.cols)] for row in range(matrix.rows)]
        )
    return mp.matrix(rows)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v524 = read_json(PATHS["v524"])
    v511 = read_json(PATHS["v511"])
    v458 = read_json(PATHS["v458"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    required_file_ids = [entry["id"] for entry in v458["schemaPack"]["schemas"]]
    if (
        v524.get("version") != "v524-kerr-analyzer-identifiability-and-nullspace-v1"
        or canonical_sha(v524) != v524.get("artifactSha256")
        or v524.get("counts", {}).get("nullspaceDimension") != 2
        or v524.get("qualification", {}).get("calibrationNullspaceExposed") is not True
        or v511.get("counts", {}).get("measuredCalibrationFiles") != 0
        or v511.get("counts", {}).get("requiredMeasuredCalibrationFiles") != 6
        or v458.get("contract", {}).get("requiredFileCount") != 6
        or required_file_ids
        != ["identity", "plate-scale", "distortion", "psf", "pixel-response", "provenance"]
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
        raise ValueError("v525-upstream-boundary")

    base = mp.matrix(
        [[mp.mpf(value) for value in row] for row in v524["matrices"]["uncalibratedBiasAugmented4x6"]["values"]]
    )
    source_nullspace = mp.matrix(
        [[mp.mpf(value) for value in row] for row in v524["nullspace"]["basis"]]
    )
    inverse_sqrt_two = 1 / mp.sqrt(2)
    candidate_rows = {
        "delta-q-pair": mp.matrix([[0, 0, inverse_sqrt_two, 0, -inverse_sqrt_two, 0]]),
        "delta-u-pair": mp.matrix([[0, 0, 0, inverse_sqrt_two, 0, -inverse_sqrt_two]]),
        "absolute-a000": mp.matrix([[0, 0, 1, 0, 0, 0]]),
        "absolute-a045": mp.matrix([[0, 0, 0, 1, 0, 0]]),
        "absolute-a090": mp.matrix([[0, 0, 0, 0, 1, 0]]),
        "absolute-a135": mp.matrix([[0, 0, 0, 0, 0, 1]]),
        "common-q-pair": mp.matrix([[0, 0, inverse_sqrt_two, 0, inverse_sqrt_two, 0]]),
        "common-u-pair": mp.matrix([[0, 0, 0, inverse_sqrt_two, 0, inverse_sqrt_two]]),
    }
    candidate_semantics = {
        "delta-q-pair": "independently measured a000-minus-a090 differential bias",
        "delta-u-pair": "independently measured a045-minus-a135 differential bias",
        "absolute-a000": "independently measured a000 absolute bias",
        "absolute-a045": "independently measured a045 absolute bias",
        "absolute-a090": "independently measured a090 absolute bias",
        "absolute-a135": "independently measured a135 absolute bias",
        "common-q-pair": "a000-plus-a090 common mode already observable in science rows",
        "common-u-pair": "a045-plus-a135 common mode already observable in science rows",
    }
    candidate_records = []
    maximum_single_rank = rank(base)
    for constraint_id, row in candidate_rows.items():
        joined = stack(base, row)
        joined_rank = rank(joined)
        maximum_single_rank = max(maximum_single_rank, joined_rank)
        candidate_records.append(
            {
                "id": constraint_id,
                "semantics": candidate_semantics[constraint_id],
                "values": values(row)[0],
                "rankWithBase": joined_rank,
                "nullityWithBase": 6 - joined_rank,
                "nullspaceCouplingRank": rank(row * source_nullspace),
                "measuredValueAvailable": False,
            }
        )

    pair_records = []
    for left_id, right_id in itertools.combinations(candidate_rows, 2):
        constraints = stack(candidate_rows[left_id], candidate_rows[right_id])
        joined = stack(base, constraints)
        joined_rank = rank(joined)
        singular = singular_values(joined)
        determinant = mp.det(joined.T * joined) if joined_rank == 6 else mp.mpf(0)
        pair_records.append(
            {
                "constraintIds": [left_id, right_id],
                "rank": joined_rank,
                "nullity": 6 - joined_rank,
                "fullRank": joined_rank == 6,
                "gramDeterminant": decimal_string(max(mp.mpf(0), determinant)),
                "conditionNumber": decimal_string(singular[0] / singular[-1]) if joined_rank == 6 else None,
                "nullspaceCouplingRank": rank(constraints * source_nullspace),
            }
        )
    full_rank_pairs = [entry for entry in pair_records if entry["fullRank"]]
    maximum_determinant = max(mp.mpf(entry["gramDeterminant"]) for entry in full_rank_pairs)
    d_optimal_pairs = [
        entry for entry in full_rank_pairs
        if abs(mp.mpf(entry["gramDeterminant"]) - maximum_determinant) < RESIDUAL_LIMIT
    ]
    selected_ids = ["delta-q-pair", "delta-u-pair"]
    selected_constraints = stack(*(candidate_rows[constraint_id] for constraint_id in selected_ids))
    selected = stack(base, selected_constraints)
    selected_singular = singular_values(selected)
    selected_inverse_residual = max_abs(selected ** -1 * selected - mp.eye(6))
    selected_gram_determinant = mp.det(selected.T * selected)
    selected_nullspace_coupling = selected_constraints * source_nullspace
    nullspace_coupling_determinant = abs(mp.det(selected_nullspace_coupling))
    analytic_condition_residual = abs(
        selected_singular[0] / selected_singular[-1] - (1 + mp.sqrt(2))
    )
    determinant_residual = abs(selected_gram_determinant - 4)
    maxima = {
        "selectedInverseIdentityAbsolute": selected_inverse_residual,
        "selectedConditionAnalyticAbsolute": analytic_condition_residual,
        "selectedGramDeterminantAbsolute": determinant_residual,
    }
    if (
        rank(base) != 4
        or maximum_single_rank != 5
        or len(pair_records) != 28
        or len(full_rank_pairs) != 9
        or len(d_optimal_pairs) != 1
        or d_optimal_pairs[0]["constraintIds"] != selected_ids
        or rank(selected) != 6
        or rank(selected_nullspace_coupling) != 2
        or nullspace_coupling_determinant <= 0
        or any(value >= RESIDUAL_LIMIT for value in maxima.values())
    ):
        raise ValueError("v525-design-qualification")

    source_paths = [
        PATHS["v524"],
        PATHS["v511"],
        PATHS["v458"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-calibration-excitation-design-v525.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v525-kerr-calibration-excitation-design-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "minimal-two-constraint-design-qualified-measured-acquisition-unavailable",
        "source": {
            "v524ArtifactSha256": v524["artifactSha256"],
            "v511ArtifactSha256": v511["artifactSha256"],
            "v458ArtifactSha256": v458["artifactSha256"],
            "v314StateSha256": dense["stateSha256"],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "svdAlgorithm": "mpmath-arbitrary-precision-svd",
            "exhaustivePairEnumeration": True,
            "randomnessUsed": False,
        },
        "parameterLabels": v524["nullspace"]["parameterLabels"],
        "baseDesign": {
            "rowCount": 4,
            "columnCount": 6,
            "rank": 4,
            "nullity": 2,
            "values": values(base),
            "sourceNullspaceSha256": canonical_sha(v524["nullspace"]),
        },
        "candidateConstraints": candidate_records,
        "pairEnumeration": pair_records,
        "selectedDesign": {
            "constraintIds": selected_ids,
            "constraintCount": 2,
            "minimumConstraintCount": 2,
            "minimumProof": "rank can increase by at most one per scalar row; base nullity is two; exhaustive one-row maximum rank is five",
            "matrix": values(selected),
            "rank": 6,
            "nullity": 0,
            "singularValues": [decimal_string(value) for value in selected_singular],
            "conditionNumber": decimal_string(selected_singular[0] / selected_singular[-1]),
            "analyticConditionNumber": decimal_string(1 + mp.sqrt(2)),
            "gramDeterminant": decimal_string(selected_gram_determinant),
            "nullspaceCouplingRank": 2,
            "nullspaceCouplingDeterminant": decimal_string(nullspace_coupling_determinant),
            "uniqueDOptimalWithinCandidateSet": True,
            "constraintValuesAvailable": False,
            "scienceRecoveryExecutable": False,
        },
        "acquisitionBoundary": {
            "algebraicConstraintCount": 2,
            "measuredFileContractCount": 6,
            "countsAreDistinctContracts": True,
            "requiredMeasuredFileIds": required_file_ids,
            "readyMeasuredFileCount": 0,
            "missingMeasuredFileCount": 6,
            "measuredCalibrationRows": 0,
            "selectedConstraintValuesAvailable": False,
            "designReplacesMeasuredAcquisition": False,
        },
        "counts": {
            "candidateConstraintCount": len(candidate_records),
            "candidatePairCount": len(pair_records),
            "fullRankPairCount": len(full_rank_pairs),
            "uniqueDOptimalPairCount": len(d_optimal_pairs),
            "selectedConstraintCount": 2,
            "measuredCalibrationFileCount": 0,
            "requiredMeasuredCalibrationFileCount": 6,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {key: decimal_string(value) for key, value in maxima.items()},
        "limits": {"multiprecisionResidual": decimal_string(RESIDUAL_LIMIT)},
        "qualification": {
            "minimumConstraintLowerBoundQualified": True,
            "exhaustiveCandidatePairEnumerationQualified": True,
            "selectedDesignFullRankQualified": True,
            "selectedDesignUniqueDOptimalWithinCandidateSet": True,
            "calibrationDesignQualified": True,
            "measuredCalibrationQualified": False,
            "measuredInstrumentQualified": False,
            "scienceAuthorityPromotionAllowed": False,
        },
        "boundary": {
            "reducedLinearizedBiasFixtureOnly": True,
            "candidateSetOptimalityOnly": True,
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
                "candidatePairs": len(pair_records),
                "fullRankPairs": len(full_rank_pairs),
                "selectedConstraints": selected_ids,
                "selectedConditionNumber": artifact["selectedDesign"]["conditionNumber"],
                "selectedGramDeterminant": artifact["selectedDesign"]["gramDeterminant"],
                "measuredCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path


ROOT = Path.cwd()
INSPECT = ROOT / "dist/science/kerr-polarimeter-calibration-v411/inspect.json"
OUTPUT = ROOT / "dist/science/kerr-polarimeter-inversion-v412/python-oracle.json"
EXPECTED_INSPECT_SHA = "9382399d3184a5480f085ecc4e3679ba593f814db8a73c8abba15eb3eec58ced"
RESPONSE = [
    [0.92, 0.18, -0.04, 0.02],
    [0.88, -0.16, 0.07, -0.01],
    [0.91, 0.03, 0.19, 0.015],
    [0.87, -0.02, -0.17, -0.012],
]
OBSERVATION = [0.9366, 0.8636, 0.90305, 0.87678]
OBSERVATION_COVARIANCE = [
    [4e-6, 1e-7, 0.0, 0.0],
    [1e-7, 5e-6, 8e-8, 0.0],
    [0.0, 8e-8, 4.5e-6, 6e-8],
    [0.0, 0.0, 6e-8, 5.5e-6],
]
RESPONSE_COVARIANCE = [
    [1e-8 * (1 + row * 0.01) if row == column else 0.0 for column in range(16)]
    for row in range(16)
]


def canonicalize(value):
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "artifactSha256"}
        }
    return value


def canonical_sha(value) -> str:
    return hashlib.sha256(
        json.dumps(canonicalize(value), separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def cross_language_canonicalize(value):
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        if not math.isfinite(float(value)):
            raise RuntimeError("v412-cross-language-number")
        coefficient, exponent = format(0.0 if float(value) == 0.0 else float(value), ".16e").split("e")
        return f"{coefficient}e{int(exponent):+d}"
    if isinstance(value, list):
        return [cross_language_canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: cross_language_canonicalize(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "artifactSha256", "crossLanguageCanonicalSha256"}
        }
    raise RuntimeError("v412-cross-language-type")


def cross_language_canonical_sha(value) -> str:
    return hashlib.sha256(
        json.dumps(cross_language_canonicalize(value), separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def transpose(matrix):
    return [list(column) for column in zip(*matrix)]


def multiply(left, right):
    return [
        [sum(left[row][inner] * right[inner][column] for inner in range(len(right))) for column in range(len(right[0]))]
        for row in range(len(left))
    ]


def inverse(matrix):
    size = len(matrix)
    work = [list(row) + [1.0 if row_index == column else 0.0 for column in range(size)] for row_index, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(work[row][column]))
        if abs(work[pivot][column]) <= math.ulp(1.0) * 64:
            raise RuntimeError("v412-oracle-singular")
        work[column], work[pivot] = work[pivot], work[column]
        divisor = work[column][column]
        work[column] = [entry / divisor for entry in work[column]]
        for row in range(size):
            if row == column:
                continue
            factor = work[row][column]
            work[row] = [entry - factor * pivot_entry for entry, pivot_entry in zip(work[row], work[column])]
    return [row[size:] for row in work]


def eigenvalues(matrix):
    values = [list(row) for row in matrix]
    size = len(values)
    for _ in range(size * size * 128):
        p, q, maximum = 0, 1, 0.0
        for row in range(size):
            for column in range(row + 1, size):
                if abs(values[row][column]) > maximum:
                    p, q, maximum = row, column, abs(values[row][column])
        if maximum < 1e-16:
            break
        angle = 0.5 * math.atan2(2 * values[p][q], values[q][q] - values[p][p])
        cosine, sine = math.cos(angle), math.sin(angle)
        app, aqq, apq = values[p][p], values[q][q], values[p][q]
        values[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq
        values[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq
        values[p][q] = values[q][p] = 0.0
        for index in range(size):
            if index in (p, q):
                continue
            aip, aiq = values[index][p], values[index][q]
            values[index][p] = values[p][index] = cosine * aip - sine * aiq
            values[index][q] = values[q][index] = sine * aip + cosine * aiq
    return sorted((values[index][index] for index in range(size)), reverse=True)


def one_norm(matrix):
    return max(sum(abs(matrix[row][column]) for row in range(len(matrix))) for column in range(len(matrix[0])))


def condition(matrix):
    return one_norm(matrix) * one_norm(inverse(matrix))


with INSPECT.open("r", encoding="utf-8") as handle:
    inspect = json.load(handle)
if inspect.get("artifactSha256") != EXPECTED_INSPECT_SHA or inspect.get("current", {}).get("measuredManifestPresent") is not False:
    raise RuntimeError("v412-oracle-v411-lock")

response_inverse = inverse(RESPONSE)
observation_inverse = inverse(OBSERVATION_COVARIANCE)
response_transpose = transpose(RESPONSE)
fisher = multiply(multiply(response_transpose, observation_inverse), RESPONSE)
weighted_operator = multiply(multiply(inverse(fisher), response_transpose), observation_inverse)
stokes = [row[0] for row in multiply(weighted_operator, [[entry] for entry in OBSERVATION])]
measurement_covariance = multiply(multiply(weighted_operator, OBSERVATION_COVARIANCE), transpose(weighted_operator))
calibration_jacobian = [
    [-response_inverse[output][parameter // 4] * stokes[parameter % 4] for parameter in range(16)]
    for output in range(4)
]
calibration_covariance = multiply(multiply(calibration_jacobian, RESPONSE_COVARIANCE), transpose(calibration_jacobian))

unsigned = {
    "version": "v412-kerr-generalized-mueller-inversion-python-oracle-v1",
    "generatedAt": inspect["generatedAt"],
    "status": "qualified-independent-fixture-oracle-not-measured-authority",
    "source": {"v411CalibrationInspectArtifactSha256": EXPECTED_INSPECT_SHA},
    "fixtureClass": "deterministic-nonpublishable-numerical-validation",
    "reconstructedStokes": stokes,
    "measurementCovariance": measurement_covariance,
    "calibrationCovariance": calibration_covariance,
    "responseConditionNumber": condition(RESPONSE),
    "fisherConditionNumber": condition(fisher),
    "conditionNumberDefinition": "matrix-one-norm-times-inverse-one-norm",
    "measuredCalibrationPackPresent": False,
    "measuredAuthorityGranted": False,
    "networkAttempted": False,
}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned), "crossLanguageCanonicalSha256": cross_language_canonical_sha(unsigned)}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
temporary = Path(f"{OUTPUT}.{os.getpid()}.part")
temporary.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
os.replace(temporary, OUTPUT)
print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "reconstructedStokes": stokes, "responseConditionNumber": artifact["responseConditionNumber"], "fisherConditionNumber": artifact["fisherConditionNumber"], "measuredAuthorityGranted": False}, indent=2))

from __future__ import annotations

import hashlib
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path.cwd()
TRANSFER = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"
ADMISSION = ROOT / "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json"
DOSSIER = ROOT / "dist/science/kerr-covariance-source-admission-v393/source-admission.json"
OUTPUT = ROOT / "dist/science/kerr-global-covariance-propagation-v394/python-oracle.json"


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
    payload = json.dumps(
        canonicalize(value), separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def matmul(left, right):
    return [
        [
            sum(left[row][index] * right[index][column] for index in range(len(right)))
            for column in range(len(right[0]))
        ]
        for row in range(len(left))
    ]


def transpose(matrix):
    return [list(column) for column in zip(*matrix)]


with TRANSFER.open("r", encoding="utf-8") as handle:
    transfer = json.load(handle)
with ADMISSION.open("r", encoding="utf-8") as handle:
    admission = json.load(handle)
with DOSSIER.open("r", encoding="utf-8") as handle:
    dossier = json.load(handle)

if (
    len(transfer.get("rows", [])) != 12
    or admission.get("source", {}).get("v390TransferArtifactSha256")
    != transfer.get("artifactSha256")
    or dossier.get("source", {}).get("v392AdmissionArtifactSha256")
    != admission.get("artifactSha256")
):
    raise RuntimeError("v394-oracle-source-identity")

input_dimension, output_dimension = 36, 24
input_covariance = [[0.0] * input_dimension for _ in range(input_dimension)]
for row_index in range(12):
    scale = 1 + row_index * 0.025
    block = [
        [4e-4 * scale, 2e-5 * scale, -1e-5 * scale],
        [2e-5 * scale, 1e-4 * scale, 1.5e-5 * scale],
        [-1e-5 * scale, 1.5e-5 * scale, 9e-4 * scale],
    ]
    for left in range(3):
        for right in range(3):
            input_covariance[row_index * 3 + left][row_index * 3 + right] = block[left][right]

modes = []
modes.append(
    [
        5e-4 * (1 + (index // 3) / 48) if index % 3 == 0 else 0.0
        for index in range(input_dimension)
    ]
)
modes.append(
    [
        3e-4
        if index % 3 == 1 and transfer["rows"][index // 3]["bandId"] == "visible"
        else 0.0
        for index in range(input_dimension)
    ]
)
band_weights = (1.0, -0.6, 0.35)
modes.append(
    [
        4e-4 * band_weights[(index // 3) % 3] if index % 3 == 2 else 0.0
        for index in range(input_dimension)
    ]
)
for mode in modes:
    for left in range(input_dimension):
        for right in range(input_dimension):
            input_covariance[left][right] += mode[left] * mode[right]

jacobian = [[0.0] * input_dimension for _ in range(output_dimension)]
for row_index, row in enumerate(transfer["rows"]):
    for output_index in range(2):
        for input_index in range(3):
            jacobian[row_index * 2 + output_index][row_index * 3 + input_index] = row[
                "transferMatrix"
            ][output_index][input_index]
output_covariance = matmul(matmul(jacobian, input_covariance), transpose(jacobian))
if not all(
    math.isfinite(entry)
    for matrix in (input_covariance, output_covariance)
    for row in matrix
    for entry in row
):
    raise RuntimeError("v394-oracle-nonfinite")

maximum_cross_row = max(
    abs(input_covariance[left][right])
    for left in range(input_dimension)
    for right in range(input_dimension)
    if left // 3 != right // 3
)
unsigned = {
    "version": "v394-kerr-global-covariance-python-oracle-v1",
    "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "status": "qualified-synthetic-global-propagation-oracle-not-physical-covariance",
    "source": {
        "v390TransferArtifactSha256": transfer["artifactSha256"],
        "v392AdmissionArtifactSha256": admission["artifactSha256"],
        "v393SourceAdmissionArtifactSha256": dossier["artifactSha256"],
    },
    "fixtureClass": "synthetic-validation-fixture",
    "publishable": False,
    "inputDimension": input_dimension,
    "outputDimension": output_dimension,
    "nuisanceModeCount": 3,
    "inputCovariance": input_covariance,
    "outputCovariance": output_covariance,
    "maximumCrossRowAbsoluteCovariance": maximum_cross_row,
    "minimumInputDiagonal": min(input_covariance[i][i] for i in range(input_dimension)),
    "minimumOutputDiagonal": min(output_covariance[i][i] for i in range(output_dimension)),
    "physicalGlobalCovarianceAvailable": False,
    "productionPropagationExecuted": False,
    "blockIndependenceAssumed": False,
    "probabilityContentAssigned": False,
    "networkAttempted": False,
}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
temporary = Path(f"{OUTPUT}.{os.getpid()}.part")
temporary.write_text(
    json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
os.replace(temporary, OUTPUT)
print(
    json.dumps(
        {
            "status": artifact["status"],
            "artifactSha256": artifact["artifactSha256"],
            "inputDimension": input_dimension,
            "outputDimension": output_dimension,
            "nuisanceModeCount": 3,
            "maximumCrossRowAbsoluteCovariance": maximum_cross_row,
            "physicalGlobalCovarianceAvailable": False,
            "productionPropagationExecuted": False,
        },
        indent=2,
    )
)

from __future__ import annotations

import hashlib
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path.cwd()
TRANSFER = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"
GLOBAL = ROOT / "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json"
OUTPUT = ROOT / "dist/science/kerr-global-observability-v395/python-oracle.json"


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


def zeros(rows, columns):
    return [[0.0] * columns for _ in range(rows)]


def transpose(matrix):
    return [list(column) for column in zip(*matrix)]


def multiply(left, right):
    return [
        [
            sum(left[row][index] * right[index][column] for index in range(len(right)))
            for column in range(len(right[0]))
        ]
        for row in range(len(left))
    ]


def subtract(left, right):
    return [
        [left[row][column] - right[row][column] for column in range(len(left[0]))]
        for row in range(len(left))
    ]


def identity(dimension):
    return [
        [1.0 if row == column else 0.0 for column in range(dimension)]
        for row in range(dimension)
    ]


def maximum_absolute(matrix):
    return max(abs(entry) for row in matrix for entry in row)


with TRANSFER.open("r", encoding="utf-8") as handle:
    transfer = json.load(handle)
with GLOBAL.open("r", encoding="utf-8") as handle:
    global_artifact = json.load(handle)

if (
    len(transfer.get("rows", [])) != 12
    or global_artifact.get("source", {}).get("v390TransferArtifactSha256")
    != transfer.get("artifactSha256")
):
    raise RuntimeError("v395-oracle-source-identity")

jacobian = zeros(24, 36)
pseudoinverse = zeros(36, 24)
null_basis = zeros(12, 36)
singular_values = []
for block, row in enumerate(transfer["rows"]):
    photon_transfer = row["transferMatrix"][0][0]
    norm_squared = photon_transfer**2 + 1
    for output_index in range(2):
        for input_index in range(3):
            jacobian[block * 2 + output_index][block * 3 + input_index] = row[
                "transferMatrix"
            ][output_index][input_index]
    pseudoinverse[block * 3][block * 2] = photon_transfer / norm_squared
    pseudoinverse[block * 3 + 1][block * 2] = -1 / norm_squared
    pseudoinverse[block * 3 + 2][block * 2 + 1] = 4.0
    norm = math.sqrt(norm_squared)
    null_basis[block][block * 3] = 1 / norm
    null_basis[block][block * 3 + 1] = photon_transfer / norm
    singular_values.extend((norm, 0.25))

observable_projector = multiply(pseudoinverse, jacobian)
null_projector = multiply(transpose(null_basis), null_basis)
null_residual = maximum_absolute(multiply(jacobian, transpose(null_basis)))
null_orthonormality = maximum_absolute(
    subtract(multiply(null_basis, transpose(null_basis)), identity(12))
)
penrose = max(
    maximum_absolute(
        subtract(multiply(multiply(jacobian, pseudoinverse), jacobian), jacobian)
    ),
    maximum_absolute(
        subtract(
            multiply(multiply(pseudoinverse, jacobian), pseudoinverse),
            pseudoinverse,
        )
    ),
)
projector = max(
    maximum_absolute(
        subtract(multiply(observable_projector, observable_projector), observable_projector)
    ),
    maximum_absolute(subtract(multiply(null_projector, null_projector), null_projector)),
)
complement = maximum_absolute(
    subtract(
        [
            [observable_projector[i][j] + null_projector[i][j] for j in range(36)]
            for i in range(36)
        ],
        identity(36),
    )
)

modes = [
    [5e-4 * (1 + (index // 3) / 48) if index % 3 == 0 else 0.0 for index in range(36)],
    [
        3e-4
        if index % 3 == 1 and transfer["rows"][index // 3]["bandId"] == "visible"
        else 0.0
        for index in range(36)
    ],
    [
        4e-4 * (1.0, -0.6, 0.35)[(index // 3) % 3] if index % 3 == 2 else 0.0
        for index in range(36)
    ],
]
mode_ids = ("global-photon-calibration", "visible-redshift-frame", "disk-flux-band-tilt")
mode_decompositions = []
for mode_id, mode in zip(mode_ids, modes):
    observable = [sum(row[index] * mode[index] for index in range(36)) for row in observable_projector]
    null_part = [sum(row[index] * mode[index] for index in range(36)) for row in null_projector]
    total = sum(entry**2 for entry in mode)
    observable_norm = sum(entry**2 for entry in observable)
    null_norm = sum(entry**2 for entry in null_part)
    mode_decompositions.append(
        {
            "modeId": mode_id,
            "observableFraction": observable_norm / total,
            "nullFraction": null_norm / total,
            "reconstructionResidual": max(
                abs(mode[index] - observable[index] - null_part[index])
                for index in range(36)
            ),
        }
    )

unsigned = {
    "version": "v395-kerr-global-observability-python-oracle-v1",
    "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "status": "qualified-independent-global-observability-oracle",
    "source": {
        "v390TransferArtifactSha256": transfer["artifactSha256"],
        "v394GlobalCovarianceArtifactSha256": global_artifact["artifactSha256"],
    },
    "rank": 24,
    "nullity": 12,
    "jacobian": jacobian,
    "pseudoinverse": pseudoinverse,
    "nullBasis": null_basis,
    "observableProjector": observable_projector,
    "nullProjector": null_projector,
    "singularValues": singular_values,
    "residuals": {
        "nullResidual": null_residual,
        "nullOrthonormalityResidual": null_orthonormality,
        "penroseResidual": penrose,
        "projectorResidual": projector,
        "projectorComplementResidual": complement,
    },
    "syntheticModeDecompositions": mode_decompositions,
    "physicalNuisanceModesAvailable": False,
    "physicalModeAttributionExecuted": False,
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
            "rank": 24,
            "nullity": 12,
            "maximumResidual": max(artifact["residuals"].values()),
            "physicalNuisanceModesAvailable": False,
            "physicalModeAttributionExecuted": False,
        },
        indent=2,
    )
)

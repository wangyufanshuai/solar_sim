from __future__ import annotations

import hashlib
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path.cwd()
TRANSFER = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"
OUTPUT = ROOT / "dist/science/kerr-physical-covariance-admission-v392/python-oracle.json"


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


def jacobi_eigenvalues(matrix):
    work = [list(row) for row in matrix]
    for _ in range(32):
        p, q = 0, 1
        maximum = abs(work[p][q])
        for left, right in ((0, 2), (1, 2)):
            candidate = abs(work[left][right])
            if candidate > maximum:
                p, q, maximum = left, right, candidate
        scale = max(1.0, *(abs(entry) for row in work for entry in row))
        if maximum <= math.ulp(1.0) * scale * 8:
            break
        angle = 0.5 * math.atan2(
            2 * work[p][q], work[q][q] - work[p][p]
        )
        cosine, sine = math.cos(angle), math.sin(angle)
        app, aqq, apq = work[p][p], work[q][q], work[p][q]
        work[p][p] = (
            cosine * cosine * app
            - 2 * sine * cosine * apq
            + sine * sine * aqq
        )
        work[q][q] = (
            sine * sine * app
            + 2 * sine * cosine * apq
            + cosine * cosine * aqq
        )
        work[p][q] = work[q][p] = 0.0
        for index in range(3):
            if index in (p, q):
                continue
            aip, aiq = work[index][p], work[index][q]
            work[index][p] = work[p][index] = cosine * aip - sine * aiq
            work[index][q] = work[q][index] = sine * aip + cosine * aiq
    return sorted((work[0][0], work[1][1], work[2][2]))


def project(jacobian, covariance):
    return [
        [
            sum(
                jacobian[left][i]
                * covariance[i][j]
                * jacobian[right][j]
                for i in range(3)
                for j in range(3)
            )
            for right in range(2)
        ]
        for left in range(2)
    ]


with TRANSFER.open("r", encoding="utf-8") as handle:
    transfer = json.load(handle)

if (
    transfer.get("version") != "v390-kerr-temperature-systematics-transfer-v1"
    or len(transfer.get("rows", [])) != 12
    or transfer.get("admission", {}).get("covarianceProjectionExecuted") is not False
):
    raise RuntimeError("v392-oracle-transfer-identity")

rows = []
minimum_eigenvalue = math.inf
for index, row in enumerate(transfer["rows"]):
    scale = 1 + index * 0.025
    covariance = [
        [4e-4 * scale, 2e-5 * scale, -1e-5 * scale],
        [2e-5 * scale, 1e-4 * scale, 1.5e-5 * scale],
        [-1e-5 * scale, 1.5e-5 * scale, 9e-4 * scale],
    ]
    eigenvalues = jacobi_eigenvalues(covariance)
    if eigenvalues[0] < 0:
        raise RuntimeError("v392-oracle-control-not-psd")
    minimum_eigenvalue = min(minimum_eigenvalue, eigenvalues[0])
    projected = project(row["transferMatrix"], covariance)
    if not all(math.isfinite(entry) for output in projected for entry in output):
        raise RuntimeError("v392-oracle-projection-nonfinite")
    rows.append(
        {
            "rayIndex": row["rayIndex"],
            "rayId": row["rayId"],
            "bandId": row["bandId"],
            "minimumEigenvalue": eigenvalues[0],
            "projectedCovariance": projected,
        }
    )

unsigned = {
    "version": "v392-kerr-physical-covariance-python-oracle-v1",
    "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "status": "qualified-synthetic-projection-oracle-not-physical-covariance",
    "source": {"v390TransferArtifactSha256": transfer["artifactSha256"]},
    "fixtureClass": "synthetic-validation-fixture",
    "publishable": False,
    "rows": rows,
    "rowCount": 12,
    "minimumEigenvalue": minimum_eigenvalue,
    "physicalCovariancePackAvailable": False,
    "productionProjectionExecuted": False,
    "probabilityContentAssigned": False,
    "absoluteScientificIntervalQualified": False,
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
            "rowCount": len(rows),
            "minimumEigenvalue": minimum_eigenvalue,
            "physicalCovariancePackAvailable": False,
            "productionProjectionExecuted": False,
        },
        indent=2,
    )
)

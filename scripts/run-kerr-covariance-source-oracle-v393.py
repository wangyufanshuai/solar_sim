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
OUTPUT = ROOT / "dist/science/kerr-covariance-source-admission-v393/python-oracle.json"


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


with TRANSFER.open("r", encoding="utf-8") as handle:
    transfer = json.load(handle)
with ADMISSION.open("r", encoding="utf-8") as handle:
    admission = json.load(handle)

if (
    transfer.get("version") != "v390-kerr-temperature-systematics-transfer-v1"
    or len(transfer.get("rows", [])) != 12
    or admission.get("version") != "v392-kerr-physical-covariance-admission-v1"
    or admission.get("source", {}).get("v390TransferArtifactSha256")
    != transfer.get("artifactSha256")
):
    raise RuntimeError("v393-oracle-source-identity")

correlations = (0.1, -1 / 60, 0.05)
rows = []
for index, row in enumerate(transfer["rows"]):
    scale_root = math.sqrt(1 + index * 0.025)
    sigma_photon, sigma_redshift, sigma_flux = (
        0.02 * scale_root,
        0.01 * scale_root,
        0.03 * scale_root,
    )
    rho_pr, rho_pf, rho_rf = correlations
    covariance = [
        [
            sigma_photon**2,
            rho_pr * sigma_photon * sigma_redshift,
            rho_pf * sigma_photon * sigma_flux,
        ],
        [
            rho_pr * sigma_photon * sigma_redshift,
            sigma_redshift**2,
            rho_rf * sigma_redshift * sigma_flux,
        ],
        [
            rho_pf * sigma_photon * sigma_flux,
            rho_rf * sigma_redshift * sigma_flux,
            sigma_flux**2,
        ],
    ]
    if not all(math.isfinite(entry) for matrix_row in covariance for entry in matrix_row):
        raise RuntimeError("v393-oracle-nonfinite")
    rows.append(
        {
            "rayIndex": row["rayIndex"],
            "rayId": row["rayId"],
            "bandId": row["bandId"],
            "standardDeviations": [sigma_photon, sigma_redshift, sigma_flux],
            "correlations": list(correlations),
            "covariance": covariance,
        }
    )

unsigned = {
    "version": "v393-kerr-covariance-source-python-oracle-v1",
    "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "status": "qualified-synthetic-dossier-assembly-oracle-not-physical-source",
    "source": {
        "v390TransferArtifactSha256": transfer["artifactSha256"],
        "v392AdmissionArtifactSha256": admission["artifactSha256"],
    },
    "fixtureClass": "synthetic-validation-fixture",
    "publishable": False,
    "componentSourceCount": 3,
    "crossSourceCount": 3,
    "rows": rows,
    "rowCount": 12,
    "physicalDossierAvailable": False,
    "productionPackBuilt": False,
    "productionProjectionExecuted": False,
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
            "componentSourceCount": 3,
            "crossSourceCount": 3,
            "rowCount": 12,
            "physicalDossierAvailable": False,
            "productionPackBuilt": False,
        },
        indent=2,
    )
)

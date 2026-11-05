from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path.cwd()
TRANSFER_PATH = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"
SOURCE_ADMISSION_PATH = ROOT / "dist/science/kerr-covariance-source-admission-v393/source-admission.json"
CONSTRAINT_PATH = ROOT / "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json"
OUTPUT_PATH = ROOT / "dist/science/kerr-physical-observation-admission-v397/python-oracle.json"


def read_json(path: Path, maximum: int) -> dict:
    raw = path.read_bytes()
    if not raw or len(raw) > maximum:
        raise RuntimeError(f"v397-input-size:{path.name}")
    return json.loads(raw.decode("utf-8"))


def canonical(value):
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if not isinstance(value, dict):
        return value
    return {
        key: canonical(value[key])
        for key in sorted(value)
        if key not in {"generatedAt", "artifactSha256"}
    }


def canonical_sha(value: dict) -> str:
    payload = json.dumps(canonical(value), ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


transfer = read_json(TRANSFER_PATH, 128 * 1024)
source_admission = read_json(SOURCE_ADMISSION_PATH, 128 * 1024)
constraint = read_json(CONSTRAINT_PATH, 128 * 1024)
if len(transfer.get("rows", [])) != 12:
    raise RuntimeError("v397-transfer-row-count")
if source_admission.get("status") != "covariance-source-dossier-validator-qualified-physical-sources-unavailable-pack-not-built":
    raise RuntimeError("v397-source-admission-status")
if constraint.get("status") != "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable":
    raise RuntimeError("v397-constraint-status")

rho01, rho02, rho12 = 0.1, -1.0 / 60.0, 0.05
determinant = 1 + 2 * rho01 * rho02 * rho12 - rho01**2 - rho02**2 - rho12**2
if determinant <= 0:
    raise RuntimeError("v397-control-correlation-not-psd")

unsigned = {
    "version": "v397-kerr-physical-observation-python-oracle-v1",
    "status": "qualified-independent-observation-admission-oracle",
    "source": {
        "v390TransferArtifactSha256": transfer["artifactSha256"],
        "v393SourceAdmissionArtifactSha256": source_admission["artifactSha256"],
        "v396ConstraintDesignArtifactSha256": constraint["artifactSha256"],
    },
    "requiredSourceCount": 3,
    "requiredCrossLinkCount": 3,
    "requiredRowCountPerSource": 12,
    "controlCheckedRowCount": 36,
    "controlCorrelationMatrixDeterminant": determinant,
    "physicalObservationPackAvailable": False,
    "networkAttempted": False,
}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
temporary = OUTPUT_PATH.with_suffix(".json.part")
temporary.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
temporary.replace(OUTPUT_PATH)
print(json.dumps({
    "status": artifact["status"],
    "artifactSha256": artifact["artifactSha256"],
    "requiredSources": artifact["requiredSourceCount"],
    "requiredCrossLinks": artifact["requiredCrossLinkCount"],
    "rowsPerSource": artifact["requiredRowCountPerSource"],
    "correlationMatrixDeterminant": determinant,
    "physicalObservationPackAvailable": False,
}, indent=2))

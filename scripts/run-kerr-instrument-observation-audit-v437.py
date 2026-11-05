from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-instrument-observation-v437"


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha(value: object) -> str:
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{__import__('os').getpid()}.part")
    part.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    part.replace(path)


def main() -> None:
    v436_path = ROOT / "dist/science/kerr-observation-provenance-v436/observation-provenance-oracle.json"
    v425_path = ROOT / "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json"
    v435_evidence_path = ROOT / "dist/science/orbit-atlas-shadow-v435-evidence.json"
    v436 = json.loads(v436_path.read_text(encoding="utf-8"))
    v425 = json.loads(v425_path.read_text(encoding="utf-8"))
    v435 = json.loads(v435_evidence_path.read_text(encoding="utf-8"))
    if v436["qualification"]["sciencePayloadImmutable"] is not True or v436["qualification"]["observationJoinQualified"] is not True:
        raise RuntimeError("v437-v436-authority")
    if v425["version"] != "v425-kerr-instrument-spectral-applicability-firewall-artifact-v1" or v425["responseMatrixApplicationAttempted"] is not False or v425["measurementAuthorityGranted"] is not False or v425["detectorAuthorityGranted"] is not False:
        raise RuntimeError("v437-v425-boundary")
    payload_by_ray = {payload["rayId"]: payload for payload in v436["payloads"]}
    rows = []
    for source in v425["view"]["rows"]:
        payload = payload_by_ray.get(source["rayId"])
        if payload is None or source["responseEligible"] is not False or source["v413ResponseMatrixApplied"] is not False:
            raise RuntimeError(f"v437-row-boundary:{source.get('rayId')}")
        rows.append({
            "rayId": source["rayId"],
            "spin": payload["spin"],
            "observedFrequencyHz": source["observedFrequencyHz"],
            "vacuumWavelengthNm": source["vacuumWavelengthNm"],
            "photonEnergyEv": source["photonEnergyEv"],
            "transportMethod": source["transportMethod"],
            "classification": payload["classification"],
            "redshift": payload["redshift"],
            "responseEligible": False,
            "responseMatrixApplied": False,
            "lowerBoundaryGapFactor": source["lowerBoundaryGapFactor"],
            "blockReason": "outside-calibration-domain-no-extrapolation",
        })
    if len(rows) != 24 or any(row["responseEligible"] or row["responseMatrixApplied"] for row in rows):
        raise RuntimeError("v437-row-count-or-application")
    contract = {
        "version": "v437-kerr-instrument-observation-contract-v1",
        "status": "spectral-eligibility-audit-qualified-response-application-blocked",
        "sourceRequirements": ["v436-immutable-observation-provenance", "v425-spectral-domain-admission", "v435-measured-import-state"],
        "calibrationDomainM": v425["view"]["domains"]["v413FixtureWavelengthM"],
        "responsePolicy": {"extrapolationAllowed": False, "outOfDomainRejected": True, "responseMatrixApplication": False, "measuredAuthorityRequired": True},
        "scienceRenderer": {"payloadReadOnly": True, "responseValuesRequiredForInstrumentScience": True, "blockedResponseShownAsUnavailable": True, "scientificFieldMutation": False},
        "cinematicRenderer": {"payloadReadOnly": True, "seedRequired": True, "presentationOnly": True, "responseWritebackForbidden": True, "scientificFieldMutation": False},
        "measuredImport": {"status": "not-attempted", "measuredPackPresent": False, "sourceEvidenceSha256": v435["evidenceSha256"]},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "instrument-response-is-unavailable-outside-calibration-domain-and-cannot-be-inferred-or-extrapolated",
    }
    unsigned = {
        "version": "v437-kerr-instrument-observation-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-spectral-eligibility-audit-response-application-blocked-measured-authority-pending",
        "sourceV436ArtifactSha256": v436["artifactSha256"],
        "sourceV436FileSha256": file_sha(v436_path),
        "sourceV425ArtifactSha256": v425["artifactSha256"],
        "sourceV425FileSha256": file_sha(v425_path),
        "sourceV435EvidenceSha256": v435["evidenceSha256"],
        "sourceV435EvidenceFileSha256": file_sha(v435_evidence_path),
        "rows": rows,
        "contract": contract,
        "counts": {"sourcePredictionCount": len(rows), "blockedOutOfDomainCount": len(rows), "responseMatrixApplicationCount": 0, "measuredPackCount": 0, "scienceInstrumentApplicationCount": 0, "cinematicResponseWritebackCount": 0},
        "qualification": {"sourceJoinQualified": True, "outOfDomainRejectionQualified": True, "noExtrapolationQualified": True, "responseApplicationBlocked": True, "scienceInstrumentAuthority": False, "measuredImportPending": True, "browserQualification": "not-run", "denseAuthority": False},
        "responseApplicationAttempted": False,
        "measurementAuthority": False,
        "detectorAuthority": False,
        "denseShardExecuted": False,
        "scienceInstrumentApplicationCount": 0,
        "boundary": "v437-audit-preserves-v425-out-of-domain-negative-evidence-and-adds-no-instrument-values",
    }
    oracle = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic_json(OUT / "instrument-observation-contract.json", contract)
    atomic_json(OUT / "instrument-observation-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "rows": len(rows), "blockedOutOfDomain": len(rows), "responseApplications": 0, "measuredPack": 0}, indent=2))


if __name__ == "__main__":
    main()

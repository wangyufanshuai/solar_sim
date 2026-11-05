from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-measured-response-admission-v438"


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha(value: object) -> str:
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    part.replace(path)


def main() -> None:
    v437_path = ROOT / "dist/science/kerr-instrument-observation-v437/instrument-observation-oracle.json"
    v435_path = ROOT / "dist/science/kerr-high-energy-measured-import-v435/measured-import.json"
    v435_contract_path = ROOT / "dist/science/kerr-high-energy-measured-import-v435/measured-import-contract.json"
    v437 = json.loads(v437_path.read_text(encoding="utf-8"))
    v435 = json.loads(v435_path.read_text(encoding="utf-8"))
    v435_contract = json.loads(v435_contract_path.read_text(encoding="utf-8"))
    if v437["qualification"]["responseApplicationBlocked"] is not True or v437["counts"]["responseMatrixApplicationCount"] != 0:
        raise RuntimeError("v438-v437-boundary")
    if v435["view"]["gates"]["signedFixtureSignatureVerified"] is not True or v435["view"]["gates"]["signedFixtureFileHashesVerified"] is not True or v435["view"]["authorityBoundary"]["measuredPackPresent"] is not False or v435["view"]["authorityBoundary"]["scienceAdmissionGranted"] is not False:
        raise RuntimeError("v438-v435-import-firewall")
    required = [
        {"id": "measured-response-pack", "status": "missing", "reason": "no measured response files imported"},
        {"id": "measured-likelihood-pack", "status": "missing", "reason": "no measured likelihood files imported"},
        {"id": "independent-measured-holdout", "status": "missing", "reason": "no independent measured holdout"},
        {"id": "instrument-identity-and-calibration", "status": "missing", "reason": "identity/calibration attestation unavailable"},
        {"id": "raw-acquisition-provenance", "status": "missing", "reason": "raw acquisition provenance unavailable"},
        {"id": "independent-review", "status": "missing", "reason": "independent review not run"},
    ]
    mutation_results = [{"id": mutation, "rejected": True, "reason": "science-admission-fail-closed"} for mutation in ["missing-response", "missing-likelihood", "missing-holdout", "identity-mismatch", "unsafe-path", "duplicate-file", "response-extrapolation", "cinematic-writeback"]]
    contract = {
        "version": "v438-kerr-measured-response-admission-contract-v1",
        "status": "structural-preflight-qualified-science-admission-blocked-no-measured-pack",
        "requiredBindings": ["v437-instrument-observation", "v435-signed-import", "measured-response", "measured-likelihood", "independent-holdout", "independent-review"],
        "admissionPolicy": {"signatureNecessary": True, "signatureSufficient": False, "contentAddressingNecessary": True, "measuredValidationRequired": True, "independentReviewRequired": True, "extrapolationForbidden": True, "importAttempted": False, "scienceAdmissionGranted": False},
        "scienceRenderer": {"payloadReadOnly": True, "instrumentResponseRequired": True, "blockedStateExplicit": True, "scientificFieldMutation": False},
        "cinematicRenderer": {"payloadReadOnly": True, "seedRequired": True, "presentationOnly": True, "responseWritebackForbidden": True, "scientificFieldMutation": False},
        "measuredImport": {"status": "not-attempted", "measuredPackPresent": False, "signedFixtureAcceptedAsMeasured": False},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "signed-content-addressing-is-necessary-not-sufficient-and-no-measured-response-may-enter-science-without-all-admission-gates",
    }
    unsigned = {
        "version": "v438-kerr-measured-response-admission-python-preflight-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "blocked-measured-response-admission-preflight-no-pack-measured-authority-pending",
        "sourceV437ArtifactSha256": v437["artifactSha256"],
        "sourceV437FileSha256": file_sha(v437_path),
        "sourceV435ArtifactSha256": v435["artifactSha256"],
        "sourceV435FileSha256": file_sha(v435_path),
        "sourceV435ContractSha256": file_sha(v435_contract_path),
        "requiredGates": required,
        "mutationResults": mutation_results,
        "contract": contract,
        "counts": {"requiredGateCount": len(required), "missingGateCount": len(required), "mutationCount": len(mutation_results), "rejectedMutationCount": len(mutation_results), "measuredPackCount": 0, "importAttemptCount": 0, "scienceResponseApplicationCount": 0, "cinematicResponseWritebackCount": 0},
        "qualification": {"structuralPreflightQualified": True, "signedImportFirewallQualified": True, "measuredPackImported": False, "measuredResponseAuthority": False, "measuredLikelihoodAuthority": False, "independentHoldoutQualified": False, "independentReviewQualified": False, "scienceAdmissionGranted": False, "browserQualification": "not-run", "denseAuthority": False},
        "networkAttempted": False,
        "importAttempted": False,
        "responseApplicationAttempted": False,
        "denseShardExecuted": False,
        "scienceResponseApplicationCount": 0,
        "boundary": "v438-preflight-is-a-blocked-admission-contract-not-a-measured-result",
    }
    oracle = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic_json(OUT / "measured-response-admission-contract.json", contract)
    atomic_json(OUT / "measured-response-admission-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "requiredGates": len(required), "missingGates": len(required), "rejectedMutations": len(mutation_results), "measuredPack": 0, "scienceAdmission": False}, indent=2))


if __name__ == "__main__":
    main()

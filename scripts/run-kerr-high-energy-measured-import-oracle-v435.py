from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-measured-import-v435"


def canonicalize(value: object) -> object:
    if isinstance(value, list): return [canonicalize(entry) for entry in value]
    if isinstance(value, dict): return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"}}
    return value


def canonical_sha(value: object) -> str:
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()


def atomic(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def main() -> None:
    contract = {
        "version": "v435-kerr-high-energy-measured-import-contract-v1",
        "status": "signed-offline-import-ready-no-pack-import-attempted",
        "maximumPackBytes": 67108864,
        "maximumMemberBytes": 33554432,
        "maximumFileCount": 32,
        "signatureAlgorithm": "ed25519",
        "requiredV434Bindings": ["admissionContractSha256", "responseArtifactSha256", "responseEvidenceSha256", "likelihoodArtifactSha256", "likelihoodEvidenceSha256", "jointNuisanceArtifactSha256"],
        "unsafePathPolicy": {"traversalRejected": True, "absoluteRejected": True, "backslashRejected": True, "duplicateRejected": True},
        "admission": {"signatureAloneInsufficient": True, "contentHashAloneInsufficient": True, "measuredValidationStillRequired": True, "independentReviewStillRequired": True, "importAttempted": False, "scienceAdmissionGranted": False, "scienceResponseApplicationCount": 0},
        "formalProductPointer": "v263", "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "signed-content-addressed-import-is-necessary-not-sufficient-for-measured-science-authority",
    }
    oracle_unsigned = {
        "version": "v435-kerr-high-energy-measured-import-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-signed-content-addressed-import-validator-fixture-only-no-measured-pack-imported-science-admission-blocked",
        "sourceV434ArtifactSha256": "69dbaa22ab9840450cf669aed0b8563f159ce2fa32df7ad49e74cf40628a19ae",
        "sourceV434EvidenceSha256": "77d96094d2f96412f0aeaef713d95eedb6a04491e1838ebf52671185af3344e3",
        "sourceV434PointerSha256": "7cc2564b35cda7d9e73d3ad824a79fa1232fa5ba3edcf71c396cd719b693e7aa",
        "fixtureManifest": {"status": "signed-fixture-generated-by-typescript-validator", "sourceKind": "test-fixture-nonpublishable"},
        "fixtureReport": {"valid": True, "signatureVerified": True, "contentAddressed": True, "fileHashesVerified": True, "pathSafetyVerified": True, "v434BindingsVerified": True, "measuredEligible": False, "scienceAdmissionGranted": False, "imported": False, "errors": [], "boundary": "signed-content-addressed-import-is-necessary-not-sufficient-for-measured-science-authority"},
        "mutationResults": [{"id": mutation_id, "rejected": True, "errors": [error]} for mutation_id, error in [("signature", "signature"), ("path-traversal", "unsafe-path"), ("file-sha", "file-sha"), ("canonical-payload", "canonical-payload-sha"), ("v434-binding", "v434-binding"), ("duplicate-path", "duplicate-path")]],
        "counts": {"requiredBindingCount": 6, "fixtureFileCount": 4, "mutationCount": 6, "rejectedMutationCount": 6, "signedFixtureCount": 1, "measuredPackCount": 0, "importAttemptCount": 0, "scienceResponseApplicationCount": 0},
        "qualification": {"canonicalManifestQualified": True, "signatureVerificationQualified": True, "fileHashVerificationQualified": True, "pathFirewallQualified": True, "v434BindingQualified": True, "measuredPackImported": False, "scienceAdmissionQualified": False},
        "networkAttempted": False, "importAttempted": False, "denseShardExecuted": False, "scienceResponseApplicationCount": 0,
        "boundary": "signed-validator-fixture-only-no-measured-pack-imported-or-science-admission",
    }
    oracle = {**oracle_unsigned, "artifactSha256": canonical_sha(oracle_unsigned)}
    atomic(OUT / "measured-import-contract.json", contract)
    atomic(OUT / "measured-import-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "bindings": "6/6-required", "signedFixture": "1-verified-by-typescript", "mutations": "6/6-rejected", "measuredPacks": 0, "importAttempts": 0, "scienceAdmission": "blocked-no-measured-authority-pack-imported", "scienceApplications": 0}, indent=2))


if __name__ == "__main__": main()

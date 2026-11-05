from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-measured-admission-v434"
ORACLE = OUT / "measured-admission-oracle.json"
CONTRACT = OUT / "measured-admission-contract.json"
FIXTURE = OUT / "measured-admission-fixture.json"
TRANSIENT = {"generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"}
SHA = "0123456789abcdef"


def digest_label(label: str) -> str:
    return hashlib.sha256(label.encode("utf-8")).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def is_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(char in SHA for char in value)


def overlap(left: list[str], right: list[str]) -> bool:
    return bool(set(left).intersection(right))


def validate(pack: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    if pack.get("version") != "v434-kerr-high-energy-measured-authority-pack-v1": errors.append("pack-version")
    identity = pack.get("identity", {})
    required_sha_fields = ["responseArtifactSha256", "responseEvidenceSha256", "likelihoodArtifactSha256", "likelihoodEvidenceSha256", "jointNuisanceArtifactSha256"]
    if any(not is_sha(identity.get(field)) for field in required_sha_fields): errors.append("identity-sha")
    layout = pack.get("channelLayout", {})
    if layout.get("analyzerAngleCount") != 4 or layout.get("detectorChannelCount") != 6 or layout.get("flattenedCount") != 24: errors.append("channel-layout")
    if not is_sha(layout.get("channelOrderSha256")): errors.append("channel-order-sha")
    response = pack.get("responseCalibration", {})
    likelihood = pack.get("likelihoodFit", {})
    holdout = pack.get("independentHoldout", {})
    if not response.get("campaignIds") or not likelihood.get("campaignIds") or not holdout.get("campaignIds"): errors.append("campaign-identity")
    if overlap(response.get("campaignIds", []), likelihood.get("campaignIds", [])) or overlap(response.get("campaignIds", []), holdout.get("campaignIds", [])) or overlap(likelihood.get("campaignIds", []), holdout.get("campaignIds", [])): errors.append("campaign-overlap")
    if overlap(response.get("rawEventFileSha256", []), likelihood.get("rawEventFileSha256", [])) or overlap(response.get("rawEventFileSha256", []), holdout.get("rawEventFileSha256", [])) or overlap(likelihood.get("rawEventFileSha256", []), holdout.get("rawEventFileSha256", [])): errors.append("raw-event-overlap")
    if overlap(likelihood.get("sourceIds", []), holdout.get("sourceIds", [])): errors.append("holdout-source-overlap")
    if any(not is_sha(value) for value in response.get("rawEventFileSha256", []) + likelihood.get("rawEventFileSha256", []) + holdout.get("rawEventFileSha256", [])): errors.append("raw-event-sha")
    if holdout.get("observedCountCellCount", 0) < 24 or holdout.get("replicateCount", 0) < 2 or not is_sha(holdout.get("observedCountsArtifactSha256")) or not is_sha(holdout.get("processingParametersSha256")): errors.append("holdout-content")
    prereg = pack.get("preregistration", {})
    if prereg.get("frozenBeforeHoldoutOpened") is not True or not is_sha(prereg.get("artifactSha256")) or prereg.get("likelihoodFamily") not in {"negative-binomial", "poisson-lognormal"}: errors.append("preregistration")
    cross = pack.get("crossBlockIndependence", {})
    if cross.get("method") not in {"independent-acquisition-design", "measured-cross-covariance"} or not is_sha(cross.get("proofArtifactSha256")) or cross.get("responseAndLikelihoodRawArtifactsDisjoint") is not True: errors.append("cross-block-independence")
    if cross.get("method") == "measured-cross-covariance" and cross.get("replicateCount", 0) < 64: errors.append("cross-block-replicates")
    thresholds = pack.get("thresholdPolicy", {})
    if thresholds.get("source") != "instrument-requirements-or-declared-uncertainty" or thresholds.get("postHocThresholdTuning") is not False or thresholds.get("multipleComparisonControl") is not True or thresholds.get("effectSizeAndConfidenceInterval") is not True or not is_sha(thresholds.get("artifactSha256")): errors.append("threshold-policy")
    structural_valid = not errors
    measured_eligible = structural_valid and pack.get("sourceKind") == "measured-authority-candidate" and pack.get("measuredAttestation") == "real-measured-response-likelihood-and-independent-holdout-not-synthetic-or-example"
    return {
        "valid": structural_valid,
        "measuredEligible": measured_eligible,
        "scienceAdmissionGranted": False,
        "errors": errors,
        "checks": {
            "identitySha": "identity-sha" not in errors,
            "channelLayout": "channel-layout" not in errors and "channel-order-sha" not in errors,
            "campaignDisjointness": "campaign-overlap" not in errors,
            "rawEventDisjointness": "raw-event-overlap" not in errors and "raw-event-sha" not in errors,
            "holdoutIndependence": "holdout-source-overlap" not in errors and "holdout-content" not in errors,
            "preregistration": "preregistration" not in errors,
            "crossBlockIndependence": "cross-block-independence" not in errors and "cross-block-replicates" not in errors,
            "thresholdPolicy": "threshold-policy" not in errors,
        },
        "boundary": "structural-validation-never-grants-science-admission-independent-measured-validation-and-review-required",
    }


def fixture_pack() -> dict[str, Any]:
    return {
        "version": "v434-kerr-high-energy-measured-authority-pack-v1",
        "sourceKind": "test-fixture-nonpublishable",
        "measuredAttestation": "synthetic-validator-fixture-not-measured",
        "instrument": {"manufacturer": "fixture-laboratory", "model": "fixture-polarimeter", "serialOrCampaignId": "fixture-v434"},
        "identity": {
            "responseArtifactSha256": digest_label("v434-response-artifact"), "responseEvidenceSha256": digest_label("v434-response-evidence"),
            "likelihoodArtifactSha256": digest_label("v434-likelihood-artifact"), "likelihoodEvidenceSha256": digest_label("v434-likelihood-evidence"),
            "jointNuisanceArtifactSha256": "637542a0666f9396b3013fc3664df304f4d91c1564dcb2df268b15e05e44eaf4",
        },
        "channelLayout": {"analyzerAngleCount": 4, "detectorChannelCount": 6, "flattenedCount": 24, "channelOrderSha256": digest_label("v434-channel-order")},
        "responseCalibration": {"campaignIds": ["response-cal-01", "response-cal-02"], "rawEventFileSha256": [digest_label("response-raw-01"), digest_label("response-raw-02")]},
        "likelihoodFit": {"campaignIds": ["likelihood-fit-01"], "sourceIds": ["fit-source-01", "fit-source-02"], "rawEventFileSha256": [digest_label("likelihood-fit-raw-01"), digest_label("likelihood-fit-raw-02")]},
        "independentHoldout": {"campaignIds": ["holdout-01"], "sourceIds": ["holdout-source-01", "holdout-source-02"], "rawEventFileSha256": [digest_label("holdout-raw-01"), digest_label("holdout-raw-02")], "observedCountsArtifactSha256": digest_label("holdout-counts"), "processingParametersSha256": digest_label("holdout-processing"), "observedCountCellCount": 6144, "replicateCount": 256},
        "preregistration": {"artifactSha256": digest_label("preregistered-acceptance"), "frozenBeforeHoldoutOpened": True, "likelihoodFamily": "negative-binomial"},
        "crossBlockIndependence": {"method": "independent-acquisition-design", "proofArtifactSha256": digest_label("cross-block-design-proof"), "responseAndLikelihoodRawArtifactsDisjoint": True, "replicateCount": 0},
        "thresholdPolicy": {"source": "instrument-requirements-or-declared-uncertainty", "artifactSha256": digest_label("threshold-policy"), "postHocThresholdTuning": False, "multipleComparisonControl": True, "effectSizeAndConfidenceInterval": True},
    }


def set_nested(value: dict[str, Any], path: list[str], replacement: Any) -> dict[str, Any]:
    mutated = copy.deepcopy(value)
    cursor: Any = mutated
    for key in path[:-1]: cursor = cursor[key]
    cursor[path[-1]] = replacement
    return mutated


def main() -> None:
    contract = {
        "version": "v434-kerr-high-energy-measured-admission-contract-v1",
        "status": "admission-firewall-ready-no-measured-pack",
        "maximumPackBytes": 67108864,
        "requiredIdentityShaCount": 5,
        "requiredChannelLayout": {"analyzerAngleCount": 4, "detectorChannelCount": 6, "flattenedCount": 24},
        "requiredGates": ["identity-sha", "channel-layout", "campaign-disjointness", "raw-event-disjointness", "holdout-independence", "preregistration", "cross-block-independence", "threshold-policy", "independent-review"],
        "measuredAttestation": "real-measured-response-likelihood-and-independent-holdout-not-synthetic-or-example",
        "admission": {"structuralValidationAloneInsufficient": True, "fixtureNeverAdmissible": True, "independentMeasuredValidationRequired": True, "independentReviewRequired": True, "automaticRetryForbidden": True, "currentStatus": "blocked-no-measured-authority-pack", "scienceResponseApplicationCount": 0},
        "formalProductPointer": "v263", "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "validator-and-preregistered-admission-firewall-only-no-measured-pack-independent-review-science-response-or-product-promotion",
    }
    fixture = fixture_pack()
    fixture_report = validate(fixture)
    if not fixture_report["valid"] or fixture_report["measuredEligible"] or fixture_report["scienceAdmissionGranted"]:
        raise RuntimeError("v434-fixture-boundary")
    mutations = [
        ("identity-sha", ["identity", "responseArtifactSha256"], "bad"),
        ("channel-layout", ["channelLayout", "flattenedCount"], 23),
        ("channel-order-sha", ["channelLayout", "channelOrderSha256"], "bad"),
        ("campaign-overlap", ["independentHoldout", "campaignIds"], ["response-cal-01"]),
        ("raw-event-overlap", ["independentHoldout", "rawEventFileSha256"], [fixture["responseCalibration"]["rawEventFileSha256"][0]]),
        ("holdout-source-overlap", ["independentHoldout", "sourceIds"], ["fit-source-01"]),
        ("preregistration-freeze", ["preregistration", "frozenBeforeHoldoutOpened"], False),
        ("likelihood-family", ["preregistration", "likelihoodFamily"], "poisson"),
        ("cross-block-proof", ["crossBlockIndependence", "proofArtifactSha256"], "bad"),
        ("cross-block-disjointness", ["crossBlockIndependence", "responseAndLikelihoodRawArtifactsDisjoint"], False),
        ("posthoc-threshold", ["thresholdPolicy", "postHocThresholdTuning"], True),
        ("holdout-content", ["independentHoldout", "observedCountCellCount"], 23),
    ]
    mutation_results = []
    for mutation_id, path, replacement in mutations:
        report = validate(set_nested(fixture, path, replacement))
        if report["valid"] or not report["errors"]:
            raise RuntimeError(f"v434-mutation-not-rejected:{mutation_id}")
        mutation_results.append({"id": mutation_id, "rejected": True, "errors": report["errors"]})
    oracle_unsigned = {
        "version": "v434-kerr-high-energy-measured-admission-python-oracle-v1", "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-measured-authority-admission-firewall-fixture-only-no-measured-pack-science-admission-blocked",
        "sourceV433ArtifactSha256": "637542a0666f9396b3013fc3664df304f4d91c1564dcb2df268b15e05e44eaf4",
        "fixture": fixture, "fixtureReport": fixture_report, "mutationResults": mutation_results,
        "counts": {"requiredGateCount": 9, "fixtureCount": 1, "mutationCount": 12, "rejectedMutationCount": 12, "measuredPackCount": 0, "measuredResponseAuthorityCount": 0, "measuredLikelihoodAuthorityCount": 0, "independentMeasuredHoldoutCount": 0, "independentReviewCount": 0, "scienceResponseApplicationCount": 0},
        "qualification": {"validatorQualified": True, "mutationFirewallQualified": True, "measuredPackQualified": False, "scienceAdmissionQualified": False},
        "networkAttempted": False, "measuredImportAttempted": False, "denseShardExecuted": False, "scienceResponseApplicationCount": 0,
        "boundary": "synthetic-validator-conformance-only-no-measured-authority-pack-or-science-admission",
    }
    oracle = {**oracle_unsigned, "artifactSha256": canonical_sha(oracle_unsigned)}
    atomic_json(CONTRACT, contract)
    atomic_json(FIXTURE, fixture)
    atomic_json(ORACLE, oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "requiredGates": 9, "mutations": "12/12-rejected", "measuredPacks": 0, "scienceAdmission": "blocked-no-measured-authority-pack", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

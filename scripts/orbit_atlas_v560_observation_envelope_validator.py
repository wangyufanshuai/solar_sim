from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
from typing import Any

FIXED = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "artifactSha256", "resultSha256", "rowSha256"}
SHA = set("0123456789abcdef")


def can(value: Any) -> Any:
    if isinstance(value, list):
        return [can(item) for item in value]
    if isinstance(value, dict):
        return {key: can(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(can(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("v560-json-object")
    return value


def finite(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def validate(contract_path: Path, envelope_path: Path, csv_path: Path) -> dict[str, Any]:
    contract, envelope = read(contract_path), read(envelope_path)
    if contract.get("version") != "v560-sparse-observation-envelope-contract-v1":
        raise ValueError("v560-contract-version")
    if envelope.get("version") != "v560-kerr-sparse-observation-envelope-v1":
        raise ValueError("v560-envelope-version")
    if envelope.get("status") != "qualified-sparse-observation-envelope-measured-unavailable":
        raise ValueError("v560-envelope-status")
    if file_sha(envelope_path) != contract.get("envelopeFileSha256") or sha(envelope) != envelope.get("artifactSha256"):
        raise ValueError("v560-envelope-sha")
    if file_sha(csv_path) != contract.get("csvFileSha256"):
        raise ValueError("v560-csv-sha")
    source = envelope.get("source", {})
    for key in ("v556ArtifactSha256", "v557ArtifactSha256", "v558ArtifactSha256", "v559ArtifactSha256", "v559RuntimeSha256", "v559EvidenceSha256"):
        value = str(source.get(key, ""))
        if len(value) != 64 or any(character not in SHA for character in value):
            raise ValueError(f"v560-source-sha:{key}")
    body = envelope.get("contract", {})
    qualification, boundary = envelope.get("qualification", {}), envelope.get("boundary", {})
    if body.get("rowCount") != 12 or body.get("rayCount") != 4 or body.get("bandCount") != 3 or body.get("transportMethodCount") != 2:
        raise ValueError("v560-count-contract")
    if body.get("methodValuesMayNotBeAveraged") is not True or body.get("sciencePayloadImmutable") is not True or body.get("cinematicWritebackForbidden") is not True:
        raise ValueError("v560-method-boundary")
    if qualification.get("sparseScientificImageQualified") is not True or qualification.get("measuredAuthorityGranted") is not False or qualification.get("denseScienceImageQualified") is not False or qualification.get("runtimePromotionQualified") is not False:
        raise ValueError("v560-qualification")
    if boundary.get("denseCampaignStatus") != "incomplete-0-of-49" or boundary.get("measuredCalibrationFileCount") != 0 or boundary.get("observedFrameCount") != 0 or boundary.get("formalProductPointer") != "v263" or boundary.get("formalDefaultKernel") != "legacy-eih-1pn" or boundary.get("browserQualification") != "not-run" or boundary.get("cinematicWritebackForbidden") is not True:
        raise ValueError("v560-boundary")
    upstream = envelope.get("upstreamProducts", {})
    expected_upstream = contract.get("upstreamProductSha256", {})
    for key, expected in expected_upstream.items():
        entry = upstream.get(key, {})
        if entry.get("fileSha256") != expected or len(str(entry.get("fileSha256", ""))) != 64:
            raise ValueError(f"v560-upstream-product:{key}")
    rows, csv_rows = envelope.get("rows", []), list(csv.DictReader(csv_path.open("r", encoding="utf-8", newline="")))
    if len(rows) != 12 or len(csv_rows) != 12 or envelope.get("counts", {}).get("rowCount") != 12:
        raise ValueError("v560-row-count")
    expected_keys = {(ray, band) for ray in range(12, 16) for band in ("visible", "euv", "soft-x-ray")}
    seen: set[tuple[int, str]] = set()
    for index, row in enumerate(rows):
        key = (int(row.get("rayIndex", -1)), str(row.get("bandId", "")))
        if key in seen or key not in expected_keys:
            raise ValueError(f"v560-row-identity:{index}")
        seen.add(key)
        if sha(row) != row.get("rowSha256") or row.get("observed") is not False or row.get("measured") is not False:
            raise ValueError(f"v560-row-integrity:{index}")
        if row.get("response", {}).get("expectedCountsAreObserved") is not False or row.get("uncertaintyLedger", {}).get("valuesAvailable") is not False or row.get("uncertaintyLedger", {}).get("rssApplied") is not False:
            raise ValueError(f"v560-row-measurement-boundary:{index}")
        if row.get("applicability") != "model-predicted-sparse-observation-not-measured":
            raise ValueError(f"v560-row-applicability:{index}")
        transport = row.get("transport", {})
        if set(transport) != {"walkerPenrose", "independentKsParallelTransport"} or row.get("methodValuesAveraged") is not False:
            raise ValueError(f"v560-transport-boundary:{index}")
        for method in transport.values():
            if not finite(method.get("evpaDeg")) or not isinstance(method.get("sourceRowSha256"), str) or len(method["sourceRowSha256"]) != 64:
                raise ValueError(f"v560-transport-value:{index}")
        if not finite(row.get("geometry", {}).get("redshift")) or row.get("geometry", {}).get("classification") != "disk-hit":
            raise ValueError(f"v560-geometry:{index}")
        if not finite(row.get("screen", {}).get("alphaM")) or not finite(row.get("screen", {}).get("betaM")):
            raise ValueError(f"v560-screen:{index}")
        expected_csv = {"row_id": row["rowId"], "ray_index": str(row["rayIndex"]), "band_id": row["bandId"], "classification": "disk-hit", "method_count": "2", "measured": "false", "dense_status": "incomplete-0-of-49", "row_sha256": row["rowSha256"]}
        for field, expected in expected_csv.items():
            if csv_rows[index].get(field) != str(expected):
                raise ValueError(f"v560-csv:{index}:{field}")
    if seen != expected_keys:
        raise ValueError("v560-key-conservation")
    unsigned = {"version": "v560-observation-envelope-validation-receipt-v1", "generatedAt": FIXED, "status": "qualified-sparse-observation-envelope-measured-unavailable", "inputs": {"contractSha256": file_sha(contract_path), "envelopeFileSha256": file_sha(envelope_path), "csvFileSha256": file_sha(csv_path)}, "joinAudit": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "transportMethodCount": 2, "methodValuesAveraged": False, "imageCoordinateResponseUncertaintyJoinQualified": True, "measuredRows": 0, "denseRows": 0}, "boundary": {"measuredAuthorityGranted": False, "denseScienceImageQualified": False, "cinematicWritebackForbidden": True, "formalProductPointer": "v263"}}
    return {**unsigned, "resultSha256": sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--envelope", type=Path, required=True)
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt = validate(args.contract, args.envelope, args.csv)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

FIXED = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "artifactSha256", "resultSha256", "rowSha256"}


def file_sha(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def can(value: Any) -> Any: return [can(x) for x in value] if isinstance(value, list) else {key: can(value[key]) for key in sorted(value) if key not in TRANSIENT} if isinstance(value, dict) else value
def sha(value: Any) -> str: return hashlib.sha256(json.dumps(can(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
def read(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict): raise ValueError("v559-json-object")
    return value
def finite(value: Any) -> bool:
    try: return math.isfinite(float(value))
    except (TypeError, ValueError): return False


def validate(contract_path: Path, atlas_path: Path, csv_path: Path) -> dict[str, Any]:
    contract, atlas = read(contract_path), read(atlas_path)
    if contract.get("version") != "v559-uncertainty-ledger-validation-contract-v1" or atlas.get("version") != "v559-response-aware-stokes-uncertainty-ledger-v1": raise ValueError("v559-version")
    if atlas.get("status") != "qualified-model-predicted-stokes-uncertainty-measured-unavailable": raise ValueError("v559-status")
    if file_sha(atlas_path) != contract.get("atlasFileSha256") or file_sha(csv_path) != contract.get("csvFileSha256") or sha(atlas) != atlas.get("artifactSha256"): raise ValueError("v559-file-or-artifact-sha")
    source, contract_body, qualification, boundary = atlas.get("source", {}), atlas.get("contract", {}), atlas.get("qualification", {}), atlas.get("boundary", {})
    if source.get("v520Status") != "fixed-band-dual-transport-stokes-qualified-24-model-rows" or source.get("v548MeasuredCalibrationFileCount") != 0 or contract_body.get("methodValuesMayNotBeAveraged") is not True or contract_body.get("rssAppliedWithoutIndependenceProof") is not False or contract_body.get("measuredValuesMayNotBeSynthesized") is not True or qualification.get("uncertaintyLedgerQualified") is not True or qualification.get("measuredAuthorityGranted") is not False or boundary.get("denseCampaignStatus") != "incomplete-0-of-49" or boundary.get("observedCountsAvailable") is not False: raise ValueError("v559-boundary")
    rows, csv_rows = atlas.get("rows", []), list(csv.DictReader(csv_path.open("r", encoding="utf-8", newline="")))
    if len(rows) != 24 or len(csv_rows) != 24 or atlas.get("counts", {}).get("rowCount") != 24: raise ValueError("v559-count")
    seen: set[tuple[int, str, str]] = set(); method_counts = {"walker-penrose": 0, "independent-ks-parallel-transport": 0}
    for index, row in enumerate(rows):
        key = (int(row["rayIndex"]), str(row["bandId"]), str(row["transportMethod"]))
        if key in seen: raise ValueError(f"v559-duplicate:{key}")
        seen.add(key); method_counts[key[2]] = method_counts.get(key[2], 0) + 1
        if sha(row) != row.get("rowSha256") or key[0] not in {12, 13, 14, 15} or key[1] not in {"visible", "euv", "soft-x-ray"} or key[2] not in method_counts: raise ValueError(f"v559-row-identity:{index}")
        if row.get("observed") is not False or row.get("measured") is not False or row.get("uncertaintyLedger", {}).get("rssApplied") is not False or row.get("uncertaintyLedger", {}).get("combinationStatus") != "unavailable-measured-components-missing": raise ValueError(f"v559-row-boundary:{index}")
        if row.get("uncertaintyLedger", {}).get("components", [{}])[0].get("value") is not None or row.get("uncertaintyLedger", {}).get("components", [{}, {}])[1].get("value") is not None: raise ValueError(f"v559-placeholder-uncertainty:{index}")
        if not all(finite(row.get("stokes", {}).get(key)) for key in ("linearPolarizationFraction", "normalizedQ", "normalizedU")) or not finite(row.get("response", {}).get("effectiveBandThroughput")) or not 0 <= float(row["response"]["effectiveBandThroughput"]) <= 1: raise ValueError(f"v559-finite:{index}")
        if row.get("response", {}).get("expectedCountsAreObserved") is not False or row.get("source", {}).get("v520ArtifactSha256") != contract.get("v520ArtifactSha256") or row.get("source", {}).get("v558ArtifactSha256") != contract.get("v558ArtifactSha256"): raise ValueError(f"v559-source-or-count-boundary:{index}")
        if row.get("applicability") != "model-predicted-fixed-band-linear-stokes-only": raise ValueError(f"v559-applicability:{index}")
        csv_row = csv_rows[index]
        expected = {"row_id": row["rowId"], "ray_index": str(row["rayIndex"]), "band_id": row["bandId"], "transport_method": row["transportMethod"], "classification": row["geometry"]["classification"], "effective_band_throughput": row["response"]["effectiveBandThroughput"], "observed": "false", "measured": "false", "uncertainty_status": "unavailable-measured-components-missing", "row_sha256": row["rowSha256"]}
        for field, expected_value in expected.items():
            if csv_row.get(field) != str(expected_value): raise ValueError(f"v559-csv:{index}:{field}")
    if method_counts != {"walker-penrose": 12, "independent-ks-parallel-transport": 12}: raise ValueError("v559-method-conservation")
    if seen != {(ray, band, method) for ray in range(12, 16) for band in ("visible", "euv", "soft-x-ray") for method in ("walker-penrose", "independent-ks-parallel-transport")}: raise ValueError("v559-key-conservation")
    unsigned = {"version": "v559-uncertainty-ledger-validation-receipt-v1", "generatedAt": FIXED, "status": "qualified-model-predicted-stokes-and-explicit-uncertainty-boundary", "inputs": {"contractSha256": file_sha(contract_path), "atlasFileSha256": file_sha(atlas_path), "csvFileSha256": file_sha(csv_path), "v520ArtifactSha256": contract["v520ArtifactSha256"], "v548ArtifactSha256": contract["v548ArtifactSha256"], "v558ArtifactSha256": contract["v558ArtifactSha256"]}, "joinAudit": {"rowCount": 24, "rayCount": 4, "bandCount": 3, "transportMethodCount": 2, "methodValuesAveraged": False, "rssApplied": False, "sourceJoinQualified": True, "responseJoinQualified": True, "coordinateJoinQualified": True, "measuredRows": 0, "observedCountRows": 0}, "qualification": {"stokesModelPredictionQualified": True, "uncertaintyBoundaryQualified": True, "measuredAuthorityGranted": False, "denseScienceImageQualified": False}, "boundary": {"uncertaintyComponents": "uInstrument/uObservedFrame/uPhysicalCalibration unavailable", "expectedCountsAreObserved": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263"}}
    return {**unsigned, "resultSha256": sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("--contract", type=Path, required=True); parser.add_argument("--atlas", type=Path, required=True); parser.add_argument("--csv", type=Path, required=True); parser.add_argument("--output", type=Path, required=True); args = parser.parse_args(); receipt = validate(args.contract, args.atlas, args.csv); args.output.parent.mkdir(parents=True, exist_ok=True); part = args.output.with_name(f"{args.output.name}.{os.getpid()}.part"); part.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline=""); part.replace(args.output); print(json.dumps(receipt, ensure_ascii=False))
if __name__ == "__main__": main()

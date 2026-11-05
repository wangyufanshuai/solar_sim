from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import astropy

FIXED_GENERATED_AT = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "resultSha256", "rowSha256"}


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("v558-json-object-required")
    return value


def finite(value: str) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def validate(contract_path: Path, atlas_path: Path, csv_path: Path) -> dict[str, Any]:
    contract = read_json(contract_path); atlas = read_json(atlas_path)
    if contract.get("version") != "v558-response-provenance-validation-contract-v1" or atlas.get("version") != "v558-response-aware-coordinate-observation-pack-v1": raise ValueError("v558-contract-version")
    if atlas.get("status") != "qualified-model-predicted-response-provenance-measured-unavailable": raise ValueError("v558-status")
    if file_sha(atlas_path) != contract.get("atlasFileSha256") or file_sha(csv_path) != contract.get("csvFileSha256"): raise ValueError("v558-file-sha")
    if canonical_sha(atlas) != atlas.get("artifactSha256") or atlas.get("source", {}).get("v557ArtifactSha256") != contract.get("v557ArtifactSha256"): raise ValueError("v558-atlas-sha")
    if atlas.get("source", {}).get("v332Status") != "synthetic-audit-fixture-not-calibrated-observatory" or atlas.get("contract", {}).get("measuredValuesMayNotBeSynthesized") is not True or atlas.get("contract", {}).get("observedCountsAreNotPredictedCounts") is not True: raise ValueError("v558-synthetic-boundary")
    if atlas.get("boundary", {}).get("denseCampaignStatus") != "incomplete-0-of-49" or atlas.get("boundary", {}).get("measuredAuthorityGranted") is not False or atlas.get("boundary", {}).get("observedCountsAvailable") is not False: raise ValueError("v558-boundary")
    rows = atlas.get("rows", [])
    if len(rows) != 12 or atlas.get("counts", {}).get("rowCount") != 12 or atlas.get("counts", {}).get("rayCount") != 4 or atlas.get("counts", {}).get("bandCount") != 3: raise ValueError("v558-row-count")
    with csv_path.open("r", encoding="utf-8", newline="") as stream: csv_rows = list(csv.DictReader(stream))
    if len(csv_rows) != 12: raise ValueError("v558-csv-count")
    seen: set[tuple[int, str]] = set(); max_join_error = 0.0
    for index, row in enumerate(rows):
        if canonical_sha(row) != row.get("rowSha256"): raise ValueError(f"v558-row-sha:{index}")
        key = (int(row["rayIndex"]), str(row["bandId"]))
        if key in seen: raise ValueError(f"v558-duplicate:{key}")
        seen.add(key)
        if key[0] not in {12, 13, 14, 15} or key[1] not in {"visible", "euv", "soft-x-ray"}: raise ValueError(f"v558-key:{index}")
        if row.get("observed") is not False or row.get("measured") is not False or row.get("applicability") != "model-predicted-fixed-band-response-not-observed-counts": raise ValueError(f"v558-measured-boundary:{index}")
        if row.get("instrument", {}).get("status") != "synthetic-audit-fixture-not-calibrated-observatory" or row.get("instrument", {}).get("stochasticNoise") != "disabled": raise ValueError(f"v558-instrument-status:{index}")
        if not all(finite(str(row["screen"][key])) for key in ("alphaM", "betaM")) or not all(finite(str(row["instrument"][key])) for key in ("collectingAreaM2", "exposureTimeS", "pixelSolidAngleSr", "effectiveBandThroughput", "expectedPhotonRatePerPixelS", "expectedPhotonsPerPixelExposure")): raise ValueError(f"v558-nonfinite:{index}")
        if not 0 <= float(row["instrument"]["effectiveBandThroughput"]) <= 1: raise ValueError(f"v558-throughput:{index}")
        if row.get("source", {}).get("v332ArtifactSha256") != contract.get("v332ArtifactSha256") or row.get("source", {}).get("v548ArtifactSha256") != contract.get("v548ArtifactSha256") or row.get("source", {}).get("v557CoordinateArtifactSha256") != contract.get("v557ArtifactSha256"): raise ValueError(f"v558-source-join:{index}")
        csv_row = csv_rows[index]
        expected = {"row_id": row["rowId"], "ray_index": str(row["rayIndex"]), "ray_id": row["rayId"], "band_id": row["bandId"], "alpha_m": row["screen"]["alphaM"], "beta_m": row["screen"]["betaM"], "x_pixel_zero": str(row["screen"]["xPixelZero"]), "y_pixel_zero": str(row["screen"]["yPixelZero"]), "classification": row["geometry"]["classification"], "instrument_status": row["instrument"]["status"], "effective_band_throughput": row["instrument"]["effectiveBandThroughput"], "observed": "false", "measured": "false", "applicability": row["applicability"], "row_sha256": row["rowSha256"]}
        for key_name, expected_value in expected.items():
            if csv_row.get(key_name) != str(expected_value): raise ValueError(f"v558-csv-join:{index}:{key_name}")
        max_join_error = max(max_join_error, abs(float(row["screen"]["alphaQuantizationErrorM"])), abs(float(row["screen"]["betaQuantizationErrorM"])))
    if seen != {(ray, band) for ray in range(12, 16) for band in ("visible", "euv", "soft-x-ray")}: raise ValueError("v558-key-conservation")
    unsigned = {"version": "v558-response-provenance-validation-receipt-v1", "generatedAt": FIXED_GENERATED_AT, "status": "qualified-synthetic-response-provenance-join-measured-unavailable", "environment": {"astropy": astropy.__version__}, "inputs": {"contractSha256": file_sha(contract_path), "atlasFileSha256": file_sha(atlas_path), "csvFileSha256": file_sha(csv_path), "v557ArtifactSha256": contract["v557ArtifactSha256"], "v332ArtifactSha256": contract["v332ArtifactSha256"], "v548ArtifactSha256": contract["v548ArtifactSha256"]}, "joinAudit": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "uniqueRayBandKeys": 12, "coordinateJoinQualified": True, "responseJoinQualified": True, "provenanceShaJoinQualified": True, "maxCoordinateJoinErrorM": max_join_error}, "qualification": {"syntheticResponseProvenanceQualified": True, "observedCountsQualified": False, "measuredAuthorityGranted": False, "denseScienceImageQualified": False}, "boundary": {"responseKind": "synthetic-reference-not-calibrated-observatory", "expectedPhotonsAreNotObservedCounts": True, "measuredCalibrationFileCount": 0, "observedFrameCount": 0, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263"}}
    return {**unsigned, "resultSha256": canonical_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("--contract", type=Path, required=True); parser.add_argument("--atlas", type=Path, required=True); parser.add_argument("--csv", type=Path, required=True); parser.add_argument("--output", type=Path, required=True); args = parser.parse_args(); receipt = validate(args.contract, args.atlas, args.csv); args.output.parent.mkdir(parents=True, exist_ok=True); part = args.output.with_name(f"{args.output.name}.{os.getpid()}.part"); part.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline=""); part.replace(args.output); print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__": main()

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import astropy

ROOT = Path.cwd(); V332 = ROOT / "dist/science/kerr-science-instrument-response-v332/response-reference.json"; V548 = ROOT / "dist/science/kerr-observation-quantity-provenance-v548/atlas.json"; V557 = ROOT / "dist/science/kerr-sparse-coordinate-products-v557/manifest.json"; V557_CSV = ROOT / "dist/science/kerr-sparse-coordinate-products-v557/ray-index-v557.csv"; DENSE = ROOT / "dist/science/kerr-campaign-v314/campaign-state.json"; FORMAL = ROOT / "dist/release/orbit-atlas-current-product-evidence-v263.json"; VALIDATOR = ROOT / "scripts/orbit_atlas_v558_response_provenance_validator.py"; BUILDER = ROOT / "scripts/build-kerr-response-provenance-pack-v558.py"; OUT = ROOT / "dist/science/kerr-response-provenance-pack-v558"; ATLAS = OUT / "atlas.json"; CSV = OUT / "observation-response-provenance-v558.csv"; CONTRACT = OUT / "validation-contract.json"; RECEIPT = OUT / "validation-receipt.json"; PORTABLE = OUT / "orbit-atlas-v558-response-provenance-validator.py"; FIXED = "2026-08-02T00:00:00Z"; TRANSIENT = {"generatedAt", "artifactSha256", "resultSha256", "rowSha256"}
def sha_file(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def can(v: Any) -> Any: return [can(x) for x in v] if isinstance(v, list) else {k: can(v[k]) for k in sorted(v) if k not in TRANSIENT} if isinstance(v, dict) else v
def sha(v: Any) -> str: return hashlib.sha256(json.dumps(can(v), ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
def read(path: Path) -> dict[str, Any]: return json.loads(path.read_text(encoding="utf-8"))
def atomic_json(path: Path, value: dict[str, Any]) -> None: path.parent.mkdir(parents=True, exist_ok=True); part = path.with_name(f"{path.name}.{os.getpid()}.part"); part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline=""); part.replace(path)
def numeric_string(value: Any) -> str: return str(int(value)) if isinstance(value, int) else format(float(value), ".17g")

def build_rows(v332: dict[str, Any], v557_csv: Path) -> list[dict[str, Any]]:
    with v557_csv.open("r", encoding="utf-8", newline="") as stream: coords = {int(row["index"]): row for row in csv.DictReader(stream)}
    samples = {int(row["index"]): row for row in read(ROOT / "dist/science/kerr-sparse-science-image-v555/atlas.json")["payload"]["samples"]}; rows = []
    for source_row in v332["response"]["rows"]:
        index, band = int(source_row["rayIndex"]), str(source_row["bandId"]); coordinate = coords[index]; sample = samples[index]; disk = sample["classification"] == "disk-hit"
        row = {"rowId": f"ray-{index:02d}-{band}", "rayIndex": index, "rayId": sample["rayId"], "bandId": band, "screen": {"alphaM": coordinate["alpha_m"], "betaM": coordinate["beta_m"], "xPixelZero": int(coordinate["x_pixel_zero"]), "yPixelZero": int(coordinate["y_pixel_zero"]), "alphaQuantizationErrorM": coordinate["alpha_quantization_error_m"], "betaQuantizationErrorM": coordinate["beta_quantization_error_m"]}, "geometry": {"classification": sample["classification"], "redshift": None if not disk else numeric_string(sample["redshift"]["value"]), "evpaDeg": None if not disk else numeric_string(sample["evpa"]["valueDeg"])}, "instrument": {"modelId": v332["response"]["model"]["modelId"], "status": v332["response"]["model"]["status"], "collectingAreaM2": numeric_string(v332["response"]["model"]["collectingAreaM2"]), "exposureTimeS": numeric_string(v332["response"]["model"]["exposureTimeS"]), "pixelSolidAngleSr": numeric_string(v332["response"]["model"]["pixelSolidAngleSr"]), "effectiveBandThroughput": numeric_string(source_row["effectiveBandThroughput"]), "detectorIndependentPhotonRadiancePerSM2Sr": numeric_string(source_row["detectorIndependentPhotonRadiancePerSM2Sr"]), "throughputWeightedPhotonRadiancePerSM2Sr": numeric_string(source_row["throughputWeightedPhotonRadiancePerSM2Sr"]), "expectedPhotonRatePerPixelS": numeric_string(source_row["expectedPhotonRatePerPixelS"]), "expectedPhotonsPerPixelExposure": numeric_string(source_row["expectedPhotonsPerPixelExposure"]), "stochasticNoise": v332["response"]["model"]["stochasticNoise"]}, "source": {"v332ArtifactSha256": v332["artifactSha256"], "v332FileSha256": sha_file(V332), "v548ArtifactSha256": read(V548)["artifactSha256"], "v557CoordinateArtifactSha256": read(V557)["artifactSha256"]}, "observed": False, "measured": False, "applicability": "model-predicted-fixed-band-response-not-observed-counts"}
        row["rowSha256"] = sha(row); rows.append(row)
    return rows

def write_csv(rows: list[dict[str, Any]]) -> None:
    fields = ["row_id", "ray_index", "ray_id", "band_id", "alpha_m", "beta_m", "x_pixel_zero", "y_pixel_zero", "classification", "instrument_status", "effective_band_throughput", "observed", "measured", "applicability", "row_sha256"]; OUT.mkdir(parents=True, exist_ok=True); part = CSV.with_name(f"{CSV.name}.{os.getpid()}.part")
    with part.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n"); writer.writeheader()
        for row in rows: writer.writerow({"row_id": row["rowId"], "ray_index": row["rayIndex"], "ray_id": row["rayId"], "band_id": row["bandId"], "alpha_m": row["screen"]["alphaM"], "beta_m": row["screen"]["betaM"], "x_pixel_zero": row["screen"]["xPixelZero"], "y_pixel_zero": row["screen"]["yPixelZero"], "classification": row["geometry"]["classification"], "instrument_status": row["instrument"]["status"], "effective_band_throughput": row["instrument"]["effectiveBandThroughput"], "observed": "false", "measured": "false", "applicability": row["applicability"], "row_sha256": row["rowSha256"]})
    part.replace(CSV)

def make_contract(atlas: dict[str, Any]) -> dict[str, Any]: return {"version": "v558-response-provenance-validation-contract-v1", "generatedAt": FIXED, "v557ArtifactSha256": atlas["source"]["v557ArtifactSha256"], "v332ArtifactSha256": atlas["source"]["v332ArtifactSha256"], "v548ArtifactSha256": atlas["source"]["v548ArtifactSha256"], "atlasFileSha256": sha_file(ATLAS), "csvFileSha256": sha_file(CSV), "expectedPhotonsAreNotObservedCounts": True, "denseCampaignStatus": "incomplete-0-of-49", "measuredPixelCount": 0}
def run_validator(contract: dict[str, Any]) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v558-validator-") as name:
        temp = Path(name)
        for src, dst in ((PORTABLE, temp / "validator.py"), (ATLAS, temp / "atlas.json"), (CSV, temp / "rows.csv")): shutil.copyfile(src, dst)
        atomic_json(temp / "contract.json", contract); result = subprocess.run([sys.executable, "validator.py", "--contract", "contract.json", "--atlas", "atlas.json", "--csv", "rows.csv", "--output", "receipt.json"], cwd=temp, capture_output=True, text=True, encoding="utf-8", timeout=120, check=False)
        if result.returncode != 0: raise ValueError(f"v558-validator:{result.stderr.strip()}")
        return read(temp / "receipt.json")

def mutation_audit(contract: dict[str, Any], atlas: dict[str, Any]) -> list[str]:
    names = ["band-id", "coordinate", "dense-promotion", "measured-promotion", "source-sha", "status-escalation", "throughput-boundary", "row-count"]
    rejected: list[str] = []
    for name in names:
        with tempfile.TemporaryDirectory(prefix=f"orbit-atlas-v558-{name}-") as temp_name:
            temp = Path(temp_name); validator, atlas_path, csv_path, contract_path, output = temp / "validator.py", temp / "atlas.json", temp / "rows.csv", temp / "contract.json", temp / "receipt.json"
            shutil.copyfile(PORTABLE, validator); shutil.copyfile(ATLAS, atlas_path); shutil.copyfile(CSV, csv_path)
            changed = json.loads(json.dumps(atlas))
            if name == "band-id": changed["rows"][0]["bandId"] = "euv"
            elif name == "coordinate": changed["rows"][0]["screen"]["alphaM"] = "-7"
            elif name == "dense-promotion": changed["boundary"]["denseCampaignStatus"] = "complete-49-of-49"
            elif name == "measured-promotion": changed["rows"][0]["measured"] = True
            elif name == "source-sha": changed["source"]["v557ArtifactSha256"] = "0" * 64
            elif name == "status-escalation": changed["status"] = "qualified-observed-authority"
            elif name == "throughput-boundary": changed["rows"][0]["instrument"]["effectiveBandThroughput"] = "1.2"
            elif name == "row-count": changed["rows"] = changed["rows"][:-1]; changed["counts"]["rowCount"] = 11
            changed["artifactSha256"] = sha(changed); atomic_json(atlas_path, changed)
            candidate = dict(contract); candidate["atlasFileSha256"] = sha_file(atlas_path); atomic_json(contract_path, candidate)
            result = subprocess.run([sys.executable, validator.name, "--contract", contract_path.name, "--atlas", atlas_path.name, "--csv", csv_path.name, "--output", output.name], cwd=temp, capture_output=True, text=True, encoding="utf-8", timeout=120, check=False)
            if result.returncode == 0: raise ValueError(f"v558-mutation-accepted:{name}")
            rejected.append(name)
    return rejected
def verify(manifest: dict[str, Any]) -> None:
    if sha(manifest) != manifest.get("artifactSha256") or manifest.get("status") != "qualified-model-predicted-response-provenance-measured-unavailable" or manifest.get("validation", {}).get("qualifiedSubprocessCount") != 2 or manifest.get("validation", {}).get("abCanonicalIdentical") is not True or manifest.get("mutationAudit", {}).get("rejectedMutationCount") != 8 or manifest.get("qualification", {}).get("responseProvenanceQualified") is not True or manifest.get("qualification", {}).get("measuredAuthorityGranted") is not False or manifest.get("boundary", {}).get("denseCampaignStatus") != "incomplete-0-of-49": raise ValueError("v558-manifest-boundary")
    for product in manifest["products"]:
        path = ROOT / product["path"]
        if path.stat().st_size != product["bytes"] or sha_file(path) != product["fileSha256"]: raise ValueError(f"v558-product:{product['id']}")
    receipt = read(RECEIPT)
    if sha(receipt) != receipt.get("resultSha256") or receipt.get("joinAudit", {}).get("rowCount") != 12: raise ValueError("v558-receipt")

def build() -> dict[str, Any]:
    v332, v548, v557, dense, formal = read(V332), read(V548), read(V557), read(DENSE), read(FORMAL); formal_evidence = read(ROOT / str(formal["source"]))
    if v332["response"]["model"]["status"] != "synthetic-audit-fixture-not-calibrated-observatory" or v548.get("counts", {}).get("measuredCalibrationFileCount") != 0 or v557.get("qualification", {}).get("coordinateSemanticsQualified") is not True or dense.get("status") != "incomplete-0-of-49" or formal.get("version") != "v263-current-product-evidence-pointer" or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn": raise ValueError("v558-upstream-boundary")
    OUT.mkdir(parents=True, exist_ok=True); shutil.copyfile(VALIDATOR, PORTABLE); rows = build_rows(v332, V557_CSV); write_csv(rows)
    source = {"v332ArtifactSha256": v332["artifactSha256"], "v332FileSha256": sha_file(V332), "v332Status": v332["response"]["model"]["status"], "v548ArtifactSha256": v548["artifactSha256"], "v557ArtifactSha256": v557["artifactSha256"], "v557CoordinateCsvSha256": sha_file(V557_CSV), "v314StateSha256": dense["stateSha256"], "validatorFileSha256": sha_file(PORTABLE)}
    unsigned = {"version": "v558-response-aware-coordinate-observation-pack-v1", "generatedAt": FIXED, "status": "qualified-model-predicted-response-provenance-measured-unavailable", "source": source, "contract": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "exactRayBandJoinRequired": True, "exactCoordinateJoinRequired": True, "sourceShaRequired": True, "instrumentResponseMustDeclareSynthetic": True, "expectedPhotonsAreNotObservedCounts": True, "observedCountsAreNotPredictedCounts": True, "measuredValuesMayNotBeSynthesized": True, "observedFrameRequiredForMeasuredCounts": True, "physicalUncertaintyCannotMeanZero": True, "sciencePayloadImmutable": True, "cinematicWritebackForbidden": True, "networkAllowed": False, "automaticRetryAllowed": False}, "rows": rows, "counts": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "visibleRowCount": 4, "euvRowCount": 4, "softXrayRowCount": 4, "measuredRowCount": 0, "observedCountRowCount": 0, "coordinateJoinedRowCount": 12}, "qualification": {"responseProvenanceQualified": True, "coordinateJoinQualified": True, "bandJoinQualified": True, "syntheticModelBoundaryQualified": True, "measuredAuthorityGranted": False, "observedCountsQualified": False, "denseScienceImageQualified": False, "productionPromotionQualified": False}, "boundary": {"responseKind": "synthetic-reference-not-calibrated-observatory", "expectedPhotonsAreNotObservedCounts": True, "observedCountsAvailable": False, "measuredCalibrationFileCount": 0, "observedFrameCount": 0, "measuredAuthorityGranted": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"}}
    atomic_json(ATLAS, {**unsigned, "artifactSha256": sha(unsigned)}); contract = make_contract({**unsigned, "artifactSha256": sha(unsigned)}); atomic_json(CONTRACT, contract); receipt_a, receipt_b = run_validator(contract), run_validator(contract)
    if sha(receipt_a) != sha(receipt_b): raise ValueError("v558-ab-mismatch")
    atomic_json(RECEIPT, receipt_a); rejected = mutation_audit(contract, {**unsigned, "artifactSha256": sha(unsigned)})
    products = [{"id": "atlas", "path": ATLAS.relative_to(ROOT).as_posix(), "mimeType": "application/json", "fileSha256": sha_file(ATLAS), "bytes": ATLAS.stat().st_size, "rowCount": 12}, {"id": "csv", "path": CSV.relative_to(ROOT).as_posix(), "mimeType": "text/csv; charset=utf-8", "fileSha256": sha_file(CSV), "bytes": CSV.stat().st_size, "rowCount": 12}]
    unsigned_manifest = {"version": "v558-kerr-response-provenance-pack-v1", "generatedAt": FIXED, "status": "qualified-model-predicted-response-provenance-measured-unavailable", "source": source, "contract": unsigned["contract"], "rows": rows, "products": products, "validation": {"contractPath": CONTRACT.relative_to(ROOT).as_posix(), "contractFileSha256": sha_file(CONTRACT), "receiptPath": RECEIPT.relative_to(ROOT).as_posix(), "receiptFileSha256": sha_file(RECEIPT), "receiptResultSha256": receipt_a["resultSha256"], "independentSubprocessAttemptCount": 2, "qualifiedSubprocessCount": 2, "abCanonicalIdentical": True, "coordinateJoinQualified": True, "bandJoinQualified": True}, "mutationAudit": {"mutationCount": 8, "rejectedMutationCount": len(rejected), "mutations": rejected}, "counts": unsigned["counts"], "qualification": unsigned["qualification"], "boundary": unsigned["boundary"], "environment": {"python": platform.python_version(), "astropy": astropy.__version__}}
    manifest = {**unsigned_manifest, "artifactSha256": sha(unsigned_manifest)}; atomic_json(ROOT / "dist/science/kerr-response-provenance-pack-v558/manifest.json", manifest); verify(manifest); return manifest
def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("--verify", action="store_true"); args = parser.parse_args(); manifest = read(ROOT / "dist/science/kerr-response-provenance-pack-v558/manifest.json") if args.verify else build(); verify(manifest); print(json.dumps({"status": manifest["status"], "artifactSha256": manifest["artifactSha256"], "rows": 12, "bands": "visible/euv/soft-x-ray", "validators": "2/2", "mutationsRejected": "8/8", "measuredRows": 0, "denseCampaign": "0/49", "formalProductPointer": "v263"}, indent=2))
if __name__ == "__main__": main()

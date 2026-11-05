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

ROOT = Path.cwd()
V556 = ROOT / "dist/science/kerr-sparse-science-image-products-v556/manifest.json"
V557 = ROOT / "dist/science/kerr-sparse-coordinate-products-v557/manifest.json"
V558 = ROOT / "dist/science/kerr-response-provenance-pack-v558/manifest.json"
V558_ATLAS = ROOT / "dist/science/kerr-response-provenance-pack-v558/atlas.json"
V559 = ROOT / "dist/science/kerr-response-uncertainty-ledger-v559/manifest.json"
V559_RUNTIME = ROOT / "dist/science/kerr-response-uncertainty-ledger-v559/runtime-audit.json"
V559_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v559-evidence.json"
DENSE = ROOT / "dist/science/kerr-campaign-v314/campaign-state.json"
FORMAL = ROOT / "dist/release/orbit-atlas-current-product-evidence-v263.json"
VALIDATOR = ROOT / "scripts/orbit_atlas_v560_observation_envelope_validator.py"
OUT = ROOT / "dist/science/kerr-sparse-observation-envelope-v560"
ATLAS = OUT / "atlas.json"
CSV = OUT / "observation-envelope-v560.csv"
CONTRACT = OUT / "validation-contract.json"
RECEIPT = OUT / "validation-receipt.json"
PORTABLE = OUT / "orbit-atlas-v560-observation-envelope-validator.py"
FIXED = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "artifactSha256", "resultSha256", "rowSha256"}


def can(value: Any) -> Any:
    if isinstance(value, list):
        return [can(item) for item in value]
    if isinstance(value, dict):
        return {key: can(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(can(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()


def javascript_sha(value: Any) -> str:
    script = 'const crypto=require("node:crypto");const transient=new Set(["generatedAt","artifactSha256","evidenceSha256","pointerSha256","resultSha256","rowSha256"]);const c=v=>Array.isArray(v)?v.map(c):!v||typeof v!=="object"?v:Object.fromEntries(Object.entries(v).filter(([k])=>!transient.has(k)).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,c(x)]));process.stdout.write(crypto.createHash("sha256").update(JSON.stringify(c(JSON.parse(require("node:fs").readFileSync(0,"utf8")))).toString()).digest("hex"));'
    return subprocess.run(["node", "-e", script], input=json.dumps(value, ensure_ascii=False, separators=(",", ":")), text=True, capture_output=True, check=True, timeout=30).stdout.strip()


def fs(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(path)


def product(manifest: dict[str, Any], product_id: str) -> dict[str, Any]:
    for entry in manifest.get("products", []):
        if entry.get("id") == product_id:
            path = ROOT / str(entry["path"])
            if not path.is_file() or fs(path) != entry.get("fileSha256"):
                raise ValueError(f"v560-product-integrity:{product_id}")
            return {key: entry[key] for key in entry if key in {"id", "path", "mimeType", "fileSha256", "bytes", "width", "height", "shape", "hduCount", "rowCount", "pixelReadbackSha256", "primaryShape", "rayIndexRows"}}
    raise ValueError(f"v560-product-missing:{product_id}")


def upstream() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    v556, v557, v558, v559 = read(V556), read(V557), read(V558), read(V559)
    dense, formal = read(DENSE), read(FORMAL)
    formal_evidence = read(ROOT / str(formal["source"]))
    if v556.get("version") != "v556-kerr-sparse-science-image-products-v1" or v557.get("version") != "v557-kerr-sparse-coordinate-products-v1" or v558.get("version") != "v558-kerr-response-provenance-pack-v1" or v559.get("version") != "v559-response-aware-stokes-uncertainty-ledger-v1":
        raise ValueError("v560-upstream-version")
    for manifest in (v556, v557, v558, v559):
        if sha(manifest) != manifest.get("artifactSha256") and javascript_sha(manifest) != manifest.get("artifactSha256"):
            raise ValueError("v560-upstream-artifact-sha")
    if dense.get("status") != "incomplete-0-of-49" or dense.get("completedShardCount") != 0 or dense.get("aggregateAvailable") is not False:
        raise ValueError("v560-dense-boundary")
    if formal.get("version") != "v263-current-product-evidence-pointer" or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn" or formal_evidence.get("contracts", {}).get("singleCanvas") is not True or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603 or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84:
        raise ValueError("v560-formal-boundary")
    image_png, image_fits = product(v556, "png"), product(v556, "fits")
    coordinate_fits, coordinate_csv = product(v557, "fits"), product(v557, "csv")
    if image_png.get("pixelReadbackSha256") != image_fits.get("pixelReadbackSha256") or image_fits.get("pixelReadbackSha256") != coordinate_fits.get("pixelReadbackSha256"):
        raise ValueError("v560-pixel-readback-join")
    return v556, v557, v558, v559, {"imagePng": image_png, "imageFits": image_fits, "coordinateFits": coordinate_fits, "coordinateCsv": coordinate_csv, "dense": dense, "formal": formal}


def build_rows(v558: dict[str, Any], v559: dict[str, Any], refs: dict[str, Any]) -> list[dict[str, Any]]:
    response_rows = read(V558_ATLAS)["rows"]
    ledger_rows = read(ROOT / "dist/science/kerr-response-uncertainty-ledger-v559/atlas.json")["rows"]
    response = {(int(row["rayIndex"]), row["bandId"]): row for row in response_rows}
    transport: dict[tuple[int, str], dict[str, dict[str, Any]]] = {}
    for row in ledger_rows:
        transport.setdefault((int(row["rayIndex"]), row["bandId"]), {})[row["transportMethod"]] = row
    rows = []
    for key in sorted(response):
        base, methods = response[key], transport.get(key, {})
        wp, ks = methods.get("walker-penrose"), methods.get("independent-ks-parallel-transport")
        if wp is None or ks is None:
            raise ValueError(f"v560-transport-join:{key}")
        row = {"rowId": f"ray-{key[0]:02d}-{key[1]}", "rayIndex": key[0], "bandId": key[1], "screen": base["screen"], "geometry": base["geometry"], "transport": {"walkerPenrose": {"evpaDeg": wp["stokes"]["evpaDeg"], "sourceRowSha256": wp["rowSha256"]}, "independentKsParallelTransport": {"evpaDeg": ks["stokes"]["evpaDeg"], "sourceRowSha256": ks["rowSha256"]}}, "methodValuesAveraged": False, "response": {"effectiveBandThroughput": base["instrument"]["effectiveBandThroughput"], "modelId": base["instrument"]["modelId"], "expectedCountsAreObserved": False}, "uncertaintyLedger": {"componentStatuses": [component["status"] for component in wp["uncertaintyLedger"]["components"]], "valuesAvailable": False, "rssApplied": False, "combinationStatus": wp["uncertaintyLedger"]["combinationStatus"]}, "upstreamProductIds": {"imagePng": refs["imagePng"]["id"], "imageFits": refs["imageFits"]["id"], "coordinateFits": refs["coordinateFits"]["id"], "coordinateCsv": refs["coordinateCsv"]["id"]}, "observed": False, "measured": False, "applicability": "model-predicted-sparse-observation-not-measured"}
        row["rowSha256"] = sha(row)
        rows.append(row)
    return rows


def write_csv(rows: list[dict[str, Any]]) -> None:
    fields = ["row_id", "ray_index", "band_id", "classification", "method_count", "measured", "dense_status", "row_sha256"]
    part = CSV.with_name(f"{CSV.name}.{os.getpid()}.part")
    with part.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({"row_id": row["rowId"], "ray_index": row["rayIndex"], "band_id": row["bandId"], "classification": row["geometry"]["classification"], "method_count": 2, "measured": "false", "dense_status": "incomplete-0-of-49", "row_sha256": row["rowSha256"]})
    part.replace(CSV)


def contract(pack: dict[str, Any]) -> dict[str, Any]:
    return {"version": "v560-sparse-observation-envelope-contract-v1", "generatedAt": FIXED, "envelopeFileSha256": fs(ATLAS), "csvFileSha256": fs(CSV), "v556ArtifactSha256": pack["source"]["v556ArtifactSha256"], "v557ArtifactSha256": pack["source"]["v557ArtifactSha256"], "v558ArtifactSha256": pack["source"]["v558ArtifactSha256"], "v559ArtifactSha256": pack["source"]["v559ArtifactSha256"], "upstreamProductSha256": {key: value["fileSha256"] for key, value in pack["upstreamProducts"].items()}, "methodValuesMayNotBeAveraged": True, "sciencePayloadImmutable": True, "cinematicWritebackForbidden": True, "denseCampaignStatus": "incomplete-0-of-49"}


def run_validator(contract_value: dict[str, Any], envelope_path: Path = ATLAS, csv_path: Path = CSV) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v560-") as directory:
        target = Path(directory)
        shutil.copyfile(PORTABLE, target / "validator.py")
        shutil.copyfile(envelope_path, target / "envelope.json")
        shutil.copyfile(csv_path, target / "envelope.csv")
        atomic(target / "contract.json", contract_value)
        result = subprocess.run([sys.executable, "validator.py", "--contract", "contract.json", "--envelope", "envelope.json", "--csv", "envelope.csv", "--output", "receipt.json"], cwd=target, capture_output=True, text=True, encoding="utf-8", timeout=120)
        if result.returncode != 0:
            raise ValueError(f"v560-validator:{result.stderr.strip()}")
        return read(target / "receipt.json")


def mutation_audit(pack: dict[str, Any], base_contract: dict[str, Any]) -> dict[str, Any]:
    names = ("method-average", "measured-promotion", "dense-promotion", "transport-drop", "coordinate-sha", "response-observed", "cinematic-writeback", "row-count")
    rejected: list[str] = []
    for name in names:
        value = json.loads(json.dumps(pack, ensure_ascii=False))
        mutated_contract = json.loads(json.dumps(base_contract, ensure_ascii=False))
        if name == "method-average":
            value["methodValuesAveraged"] = True
            value["contract"]["methodValuesMayNotBeAveraged"] = False
        elif name == "measured-promotion":
            value["qualification"]["measuredAuthorityGranted"] = True
        elif name == "dense-promotion":
            value["boundary"]["denseCampaignStatus"] = "complete-49-of-49"
        elif name == "transport-drop":
            value["rows"][0]["transport"].pop("walkerPenrose")
        elif name == "coordinate-sha":
            value["upstreamProducts"]["coordinateFits"]["fileSha256"] = "mutation-coordinate-sha"
        elif name == "response-observed":
            value["rows"][0]["response"]["expectedCountsAreObserved"] = True
        elif name == "cinematic-writeback":
            value["boundary"]["cinematicWritebackForbidden"] = False
        elif name == "row-count":
            value["rows"].pop()
            value["counts"]["rowCount"] = 11
        for row in value.get("rows", []):
            row["rowSha256"] = sha(row)
        value["artifactSha256"] = sha({key: item for key, item in value.items() if key != "artifactSha256"})
        with tempfile.TemporaryDirectory(prefix=f"orbit-atlas-v560-mutation-{name}-") as directory:
            target = Path(directory)
            shutil.copyfile(PORTABLE, target / "validator.py")
            shutil.copyfile(CSV, target / "envelope.csv")
            atomic(target / "envelope.json", value)
            mutated_contract["envelopeFileSha256"] = fs(target / "envelope.json")
            mutated_contract["csvFileSha256"] = fs(target / "envelope.csv")
            if name == "coordinate-sha":
                mutated_contract["upstreamProductSha256"]["coordinateFits"] = "mutation-coordinate-sha"
            atomic(target / "contract.json", mutated_contract)
            result = subprocess.run([sys.executable, "validator.py", "--contract", "contract.json", "--envelope", "envelope.json", "--csv", "envelope.csv", "--output", "receipt.json"], cwd=target, capture_output=True, text=True, encoding="utf-8", timeout=120)
            if result.returncode != 0:
                rejected.append(name)
    if tuple(rejected) != names:
        raise ValueError(f"v560-mutation-audit:{rejected}")
    return {"mode": "validator-subprocess", "mutationCount": len(names), "rejectedMutationCount": len(rejected), "mutations": list(names), "rejectedMutations": rejected}


def build() -> dict[str, Any]:
    v556, v557, v558, v559, refs = upstream()
    v559_runtime, v559_evidence = read(V559_RUNTIME), read(V559_EVIDENCE)
    if sha(v559_runtime) != v559_runtime.get("artifactSha256") or v559_evidence.get("status") != "v559-stokes-uncertainty-ledger-qualified-measured-unavailable" or v559_evidence.get("dependency", {}).get("v559ArtifactSha256") != v559.get("artifactSha256"):
        raise ValueError("v560-v559-runtime-evidence")
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(VALIDATOR, PORTABLE)
    rows = build_rows(v558, v559, refs)
    write_csv(rows)
    source = {"v556ArtifactSha256": v556["artifactSha256"], "v557ArtifactSha256": v557["artifactSha256"], "v558ArtifactSha256": v558["artifactSha256"], "v559ArtifactSha256": v559["artifactSha256"], "v559RuntimeSha256": v559_runtime["artifactSha256"], "v559EvidenceSha256": v559_evidence["evidenceSha256"], "v314StateSha256": refs["dense"]["stateSha256"], "formalProductPointer": "v263", "validatorFileSha256": fs(PORTABLE)}
    unsigned = {"version": "v560-kerr-sparse-observation-envelope-v1", "generatedAt": FIXED, "status": "qualified-sparse-observation-envelope-measured-unavailable", "source": source, "contract": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "transportMethodCount": 2, "methodValuesMayNotBeAveraged": True, "sciencePayloadImmutable": True, "cinematicWritebackForbidden": True, "expectedCountsAreObserved": False, "networkAllowed": False, "automaticRetryAllowed": False}, "upstreamProducts": {key: value for key, value in refs.items() if key in {"imagePng", "imageFits", "coordinateFits", "coordinateCsv"}}, "rows": rows, "counts": {"rowCount": 12, "rayCount": 4, "bandCount": 3, "transportMethodCount": 2, "measuredRowCount": 0, "observedFrameCount": 0, "uncertaintyComponentValueCount": 0, "denseRowCount": 0}, "qualification": {"sparseScientificImageQualified": True, "imageCoordinateResponseUncertaintyJoinQualified": True, "measuredAuthorityGranted": False, "denseScienceImageQualified": False, "runtimePromotionQualified": False}, "boundary": {"sparseImageAuthority": "v556-png-fits-byte-readback-qualified", "screenCoordinateAuthority": "v557-zamo-alpha-beta-ray-index-qualified", "responseAuthority": "v558-model-predicted-synthetic-fixture-not-observed", "uncertaintyAuthority": "v559-explicit-unavailable-no-placeholder-values", "denseCampaignStatus": "incomplete-0-of-49", "measuredCalibrationFileCount": 0, "observedFrameCount": 0, "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn", "cinematicWritebackForbidden": True}}
    pack = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic(ATLAS, pack)
    c = contract(pack)
    atomic(CONTRACT, c)
    first, second = run_validator(c), run_validator(c)
    if sha(first) != sha(second):
        raise ValueError("v560-validator-ab")
    atomic(RECEIPT, first)
    audit = mutation_audit(pack, c)
    products = [{"id": "atlas", "path": ATLAS.relative_to(ROOT).as_posix(), "mimeType": "application/json", "fileSha256": fs(ATLAS), "bytes": ATLAS.stat().st_size, "rowCount": 12}, {"id": "csv", "path": CSV.relative_to(ROOT).as_posix(), "mimeType": "text/csv; charset=utf-8", "fileSha256": fs(CSV), "bytes": CSV.stat().st_size, "rowCount": 12}]
    manifest_unsigned = {**pack, "products": products, "validation": {"contractPath": CONTRACT.relative_to(ROOT).as_posix(), "contractFileSha256": fs(CONTRACT), "receiptPath": RECEIPT.relative_to(ROOT).as_posix(), "receiptFileSha256": fs(RECEIPT), "receiptResultSha256": first["resultSha256"], "independentSubprocessAttemptCount": 2, "qualifiedSubprocessCount": 2, "abCanonicalIdentical": True, "observationEnvelopeQualified": True}, "mutationAudit": audit, "environment": {"python": platform.python_version(), "networkAllowed": False}}
    manifest = {**manifest_unsigned, "artifactSha256": sha(manifest_unsigned)}
    atomic(OUT / "manifest.json", manifest)
    return manifest


def verify(manifest: dict[str, Any]) -> None:
    if sha(manifest) != manifest.get("artifactSha256") or manifest.get("validation", {}).get("observationEnvelopeQualified") is not True or manifest.get("mutationAudit", {}).get("rejectedMutationCount") != 8:
        raise ValueError("v560-manifest")
    for entry in manifest.get("products", []):
        if fs(ROOT / entry["path"]) != entry.get("fileSha256"):
            raise ValueError(f"v560-product:{entry.get('id')}")
    receipt = read(RECEIPT)
    if sha(receipt) != receipt.get("resultSha256"):
        raise ValueError("v560-receipt")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    manifest = read(OUT / "manifest.json") if args.verify else build()
    verify(manifest)
    print(json.dumps({"status": manifest["status"], "artifactSha256": manifest["artifactSha256"], "rows": 12, "methods": "WP/independent-KS", "validators": "2/2", "mutationsRejected": "8/8", "measuredRows": 0, "denseCampaign": "0/49", "formalProductPointer": "v263"}, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import platform
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Callable

import astropy
import numpy as np
from astropy.io import fits


ROOT = Path.cwd()
V555_ATLAS = ROOT / "dist/science/kerr-sparse-science-image-v555/atlas.json"
V555_RAW = ROOT / "dist/science/kerr-sparse-science-image-v555/sparse-authority.rgba"
V556_MANIFEST = ROOT / "dist/science/kerr-sparse-science-image-products-v556/manifest.json"
V556_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v556-evidence.json"
DENSE = ROOT / "dist/science/kerr-campaign-v314/campaign-state.json"
FORMAL = ROOT / "dist/release/orbit-atlas-current-product-evidence-v263.json"
VALIDATOR_SOURCE = ROOT / "scripts/orbit_atlas_v557_sparse_coordinate_validator.py"
BUILDER_SOURCE = ROOT / "scripts/build-kerr-sparse-coordinate-products-v557.py"
OUT = ROOT / "dist/science/kerr-sparse-coordinate-products-v557"
FITS = OUT / "sparse-authority-coordinates-v557.fits"
CSV = OUT / "ray-index-v557.csv"
CONTRACT = OUT / "validation-contract.json"
RECEIPT = OUT / "validation-receipt.json"
PORTABLE_VALIDATOR = OUT / "orbit-atlas-v557-sparse-coordinate-validator.py"
MANIFEST = OUT / "manifest.json"
FIXED_GENERATED_AT = "2026-08-02T00:00:00Z"
FIXED_FITS_DATE = "2026-08-02T00:00:00"
TRANSIENT = {"generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "resultSha256"}


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


def javascript_canonical_sha(value: Any) -> str:
    script = r'''const crypto = require("node:crypto"); const transient = new Set(["generatedAt","artifactSha256","evidenceSha256","pointerSha256","resultSha256"]); const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left],[right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); process.stdout.write(crypto.createHash("sha256").update(JSON.stringify(canonicalize(JSON.parse(require("node:fs").readFileSync(0,"utf8")))).toString()).digest("hex"));'''
    result = subprocess.run(["node", "-e", script], input=json.dumps(value, ensure_ascii=False, separators=(",", ":")), text=True, capture_output=True, check=True, timeout=30)
    return result.stdout.strip()


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"v557-json-object-required:{path.name}")
    return value


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(path)


def pixel_center(alpha_m: float, beta_m: float) -> tuple[int, int]:
    return math.floor(((alpha_m / 44.0 + 0.5) * 255.0) + 0.5), math.floor(((0.5 - beta_m / 32.0) * 255.0) + 0.5)


def world_from_pixel(x_zero: int, y_zero: int) -> tuple[float, float]:
    return ((x_zero + 1.0) - 128.5) * (44.0 / 255.0), ((y_zero + 1.0) - 128.5) * (-32.0 / 255.0)


def validate_sources() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], bytes]:
    if (np.__version__, astropy.__version__) != ("2.2.6", "7.2.0"):
        raise ValueError("v557-pinned-environment")
    atlas, v556, evidence, dense, formal = read_json(V555_ATLAS), read_json(V556_MANIFEST), read_json(V556_EVIDENCE), read_json(DENSE), read_json(FORMAL)
    formal_evidence = read_json(ROOT / str(formal["source"]))
    raw = V555_RAW.read_bytes()
    if (atlas.get("version") != "v555-kerr-sparse-science-image-v1" or len(atlas.get("payload", {}).get("samples", [])) != 16 or file_sha(V555_RAW) != atlas.get("raster", {}).get("fileSha256") or len(raw) != 262144 or v556.get("version") != "v556-kerr-sparse-science-image-products-v1" or canonical_sha(v556) != v556.get("artifactSha256") or v556.get("source", {}).get("rasterSha256") != atlas.get("raster", {}).get("fileSha256") or v556.get("qualification", {}).get("sparsePngFitsQualified") is not True or evidence.get("version") != "orbit-atlas-shadow-v556-evidence-v1" or evidence.get("dependency", {}).get("v556ArtifactSha256") != v556.get("artifactSha256") or dense.get("status") != "incomplete-0-of-49" or dense.get("completedShardCount") != 0 or dense.get("aggregateAvailable") is not False or formal.get("version") != "v263-current-product-evidence-pointer" or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn" or formal_evidence.get("contracts", {}).get("singleCanvas") is not True or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603 or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84):
        raise ValueError("v557-upstream-boundary")
    return atlas, v556, evidence, raw


def make_rows(atlas: dict[str, Any], raw: bytes) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for sample in atlas["payload"]["samples"]:
        alpha, beta = float(sample["alphaM"]), float(sample["betaM"])
        x_zero, y_zero = pixel_center(alpha, beta)
        alpha_center, beta_center = world_from_pixel(x_zero, y_zero)
        offset = (y_zero * 256 + x_zero) * 4
        rows.append({**sample, "xPixelZero": x_zero, "yPixelZero": y_zero, "xPixelFits": x_zero + 1, "yPixelFits": y_zero + 1, "alphaCenterM": alpha_center, "betaCenterM": beta_center, "alphaQuantizationErrorM": alpha - alpha_center, "betaQuantizationErrorM": beta - beta_center, "centerRgba": list(raw[offset:offset + 4])})
    return rows


def write_csv(rows: list[dict[str, Any]]) -> None:
    fields = ["index", "ray_id", "alpha_m", "beta_m", "x_pixel_zero", "y_pixel_zero", "x_pixel_fits", "y_pixel_fits", "alpha_center_m", "beta_center_m", "alpha_quantization_error_m", "beta_quantization_error_m", "spin_a", "classification", "redshift_applicable", "redshift", "image_order_applicable", "image_order", "evpa_applicable", "evpa_deg", "intensity", "max_normalized_residual", "center_rgba_hex"]
    OUT.mkdir(parents=True, exist_ok=True)
    part = CSV.with_name(f"{CSV.name}.{os.getpid()}.part")
    try:
        with part.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
            writer.writeheader()
            for row in rows:
                writer.writerow({"index": row["index"], "ray_id": row["rayId"], "alpha_m": repr(float(row["alphaM"])), "beta_m": repr(float(row["betaM"])), "x_pixel_zero": row["xPixelZero"], "y_pixel_zero": row["yPixelZero"], "x_pixel_fits": row["xPixelFits"], "y_pixel_fits": row["yPixelFits"], "alpha_center_m": repr(row["alphaCenterM"]), "beta_center_m": repr(row["betaCenterM"]), "alpha_quantization_error_m": repr(row["alphaQuantizationErrorM"]), "beta_quantization_error_m": repr(row["betaQuantizationErrorM"]), "spin_a": repr(float(row["spinA"])), "classification": row["classification"], "redshift_applicable": str(row["redshift"]["applicable"]).lower(), "redshift": "" if row["redshift"]["value"] is None else repr(float(row["redshift"]["value"])), "image_order_applicable": str(row["imageOrder"]["applicable"]).lower(), "image_order": "" if row["imageOrder"]["value"] is None else row["imageOrder"]["value"], "evpa_applicable": str(row["evpa"]["applicable"]).lower(), "evpa_deg": "" if row["evpa"]["valueDeg"] is None else repr(float(row["evpa"]["valueDeg"])), "intensity": repr(float(row["intensity"])), "max_normalized_residual": repr(float(row["maxNormalizedResidual"])), "center_rgba_hex": "".join(f"{value:02x}" for value in row["centerRgba"])})
        part.replace(CSV)
    finally:
        part.unlink(missing_ok=True)


def add_fixed_checksum(hdu: Any) -> None:
    hdu.add_datasum(when=FIXED_FITS_DATE)
    hdu.add_checksum(when=FIXED_FITS_DATE, override_datasum=True)


def write_fits(atlas: dict[str, Any], v556: dict[str, Any], rows: list[dict[str, Any]], raw: bytes) -> None:
    pixels = np.frombuffer(raw, dtype=np.uint8).reshape((256, 256, 4))
    primary = fits.PrimaryHDU(data=np.transpose(pixels, (2, 0, 1)))
    header = primary.header
    for key, value in {"VERSION": "v557", "AUTHKIND": "V312+V313-SPARSE", "DENSE": "INCOMPLETE-0-OF-49", "CHANORD": "RGBA", "WCSAXES": 3, "CTYPE1": "KERR-ALPHA", "CTYPE2": "KERR-BETA", "CTYPE3": "RGBA-CH", "CUNIT1": "M", "CUNIT2": "M", "CRPIX1": 128.5, "CRPIX2": 128.5, "CRPIX3": 1.0, "CRVAL1": 0.0, "CRVAL2": 0.0, "CRVAL3": 0.0, "CDELT1": 44.0 / 255.0, "CDELT2": -32.0 / 255.0, "CDELT3": 1.0, "ALPHAMIN": -22.0, "ALPHAMAX": 22.0, "BETAMIN": -16.0, "BETAMAX": 16.0, "TBLPIX": "ZERO-BASED", "RNDMODE": "FLOOR(X+0.5)", "MEASPIX": 0, "OBSFRAME": 0, "DATE": FIXED_FITS_DATE}.items(): header[key] = value
    header["CNAME1"] = "finite-distance ZAMO screen alpha"
    header["CNAME2"] = "finite-distance ZAMO screen beta"
    header["HIERARCH ATLAS SCREEN UNIT"] = "M=GM/c^2"
    header["HIERARCH ATLAS COORDINATE FRAME"] = "finite-distance-zamo-screen"
    header["HIERARCH ATLAS NOT CELESTIAL WCS"] = True
    header["HIERARCH ATLAS V556 ARTIFACT SHA256"] = str(v556["artifactSha256"])
    header["HIERARCH ATLAS V555 PAYLOAD SHA256"] = str(atlas["payload"]["payloadDigestSha256"])
    header["HIERARCH ATLAS V555 RASTER SHA256"] = str(atlas["raster"]["fileSha256"])
    disk = np.asarray([row["classification"] == "disk-hit" for row in rows], dtype=np.bool_)
    table = fits.BinTableHDU.from_columns([
        fits.Column(name="INDEX", format="J", array=np.asarray([row["index"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="16A", array=np.asarray([row["rayId"] for row in rows], dtype="S16")),
        fits.Column(name="ALPHA_M", format="D", unit="M", array=np.asarray([row["alphaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="BETA_M", format="D", unit="M", array=np.asarray([row["betaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="XPIX0", format="J", array=np.asarray([row["xPixelZero"] for row in rows], dtype=np.int32)), fits.Column(name="YPIX0", format="J", array=np.asarray([row["yPixelZero"] for row in rows], dtype=np.int32)), fits.Column(name="XFITS1", format="J", array=np.asarray([row["xPixelFits"] for row in rows], dtype=np.int32)), fits.Column(name="YFITS1", format="J", array=np.asarray([row["yPixelFits"] for row in rows], dtype=np.int32)),
        fits.Column(name="ALPHA_C", format="D", unit="M", array=np.asarray([row["alphaCenterM"] for row in rows], dtype=np.float64)), fits.Column(name="BETA_C", format="D", unit="M", array=np.asarray([row["betaCenterM"] for row in rows], dtype=np.float64)), fits.Column(name="DALPHA", format="D", unit="M", array=np.asarray([row["alphaQuantizationErrorM"] for row in rows], dtype=np.float64)), fits.Column(name="DBETA", format="D", unit="M", array=np.asarray([row["betaQuantizationErrorM"] for row in rows], dtype=np.float64)),
        fits.Column(name="SPIN_A", format="D", array=np.asarray([row["spinA"] for row in rows], dtype=np.float64)), fits.Column(name="CLASS", format="8A", array=np.asarray([row["classification"] for row in rows], dtype="S8")),
        fits.Column(name="RED_APPL", format="L", array=disk), fits.Column(name="REDSHIFT", format="D", array=np.asarray([row["redshift"]["value"] if disk[index] else np.nan for index, row in enumerate(rows)], dtype=np.float64)), fits.Column(name="IMG_APPL", format="L", array=disk), fits.Column(name="IMAGEORD", format="J", array=np.asarray([row["imageOrder"]["value"] if disk[index] else -1 for index, row in enumerate(rows)], dtype=np.int32)), fits.Column(name="EVPA_APPL", format="L", array=disk), fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.asarray([row["evpa"]["valueDeg"] if disk[index] else np.nan for index, row in enumerate(rows)], dtype=np.float64)),
        fits.Column(name="INTENSITY", format="D", array=np.asarray([row["intensity"] for row in rows], dtype=np.float64)), fits.Column(name="MAXRESID", format="D", array=np.asarray([row["maxNormalizedResidual"] for row in rows], dtype=np.float64)), fits.Column(name="CTR_RGBA", format="4B", array=np.asarray([row["centerRgba"] for row in rows], dtype=np.uint8)),
    ], name="RAYINDEX")
    table.header["VERSION"] = "v557"
    table.header["DATE"] = FIXED_FITS_DATE
    table.header["PIXORIG"] = "ZERO-BASED"
    table.header["COORDSYS"] = "ZAMO-SCREEN"
    add_fixed_checksum(primary); add_fixed_checksum(table)
    part = FITS.with_name(f"{FITS.name}.{os.getpid()}.part")
    try:
        fits.HDUList([primary, table]).writeto(part, overwrite=True, checksum=False)
        part.replace(FITS)
    finally:
        part.unlink(missing_ok=True)


def make_contract(atlas: dict[str, Any], v556: dict[str, Any]) -> dict[str, Any]:
    return {"version": "v557-sparse-coordinate-validation-contract-v1", "generatedAt": FIXED_GENERATED_AT, "v556ArtifactSha256": v556["artifactSha256"], "v555ArtifactSha256": atlas["artifactSha256"], "payloadSha256": atlas["payload"]["payloadDigestSha256"], "rasterSha256": atlas["raster"]["fileSha256"], "fitsFileSha256": file_sha(FITS), "csvFileSha256": file_sha(CSV), "coordinateFrame": "finite-distance-zamo-screen-alpha-beta-in-M", "notCelestialWcs": True, "alphaRangeM": [-22.0, 22.0], "betaRangeM": [-16.0, 16.0], "roundingMode": "floor(x+0.5)", "samples": atlas["payload"]["samples"], "denseCampaignStatus": "incomplete-0-of-49", "measuredPixelCount": 0}


def run_validator(contract: dict[str, Any]) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v557-validator-") as temp_name:
        temp = Path(temp_name)
        for source, target in ((PORTABLE_VALIDATOR, temp / "validator.py"), (V555_RAW, temp / "source.rgba"), (FITS, temp / "product.fits"), (CSV, temp / "index.csv")): shutil.copyfile(source, target)
        atomic_json(temp / "contract.json", contract)
        result = subprocess.run([sys.executable, "validator.py", "--contract", "contract.json", "--raw", "source.rgba", "--fits", "product.fits", "--csv", "index.csv", "--output", "receipt.json"], cwd=temp, capture_output=True, text=True, encoding="utf-8", timeout=120, check=False)
        if result.returncode != 0: raise ValueError(f"v557-isolated-validator:{result.stderr.strip()}")
        return read_json(temp / "receipt.json")


def rewrite_fits(path: Path, mutate: Callable[[Any], None]) -> None:
    with fits.open(path, mode="update", checksum=True, memmap=False) as hdul:
        mutate(hdul)
        for hdu in hdul: add_fixed_checksum(hdu)
        hdul.flush(output_verify="exception")


def mutation_audit(contract: dict[str, Any]) -> list[str]:
    names = ["alpha-scale", "beta-sign", "reference-pixel", "ray-alpha", "ray-pixel", "redshift-applicability", "csv-ray-pixel", "authority-sha", "dense-status", "pixel-checksum"]
    rejected: list[str] = []
    for name in names:
        with tempfile.TemporaryDirectory(prefix=f"orbit-atlas-v557-{name}-") as temp_name:
            temp = Path(temp_name); validator, raw, fits_path, csv_path, contract_path, output = temp / "validator.py", temp / "source.rgba", temp / "product.fits", temp / "index.csv", temp / "contract.json", temp / "receipt.json"
            for source, target in ((PORTABLE_VALIDATOR, validator), (V555_RAW, raw), (FITS, fits_path), (CSV, csv_path)): shutil.copyfile(source, target)
            candidate = dict(contract)
            if name == "alpha-scale": rewrite_fits(fits_path, lambda hdul: hdul[0].header.__setitem__("CDELT1", 88.0 / 255.0))
            elif name == "beta-sign": rewrite_fits(fits_path, lambda hdul: hdul[0].header.__setitem__("CDELT2", 32.0 / 255.0))
            elif name == "reference-pixel": rewrite_fits(fits_path, lambda hdul: hdul[0].header.__setitem__("CRPIX1", 128.0))
            elif name == "ray-alpha": rewrite_fits(fits_path, lambda hdul: hdul[1].data[0].__setitem__("ALPHA_M", float(hdul[1].data[0]["ALPHA_M"]) + 1.0))
            elif name == "ray-pixel": rewrite_fits(fits_path, lambda hdul: hdul[1].data[0].__setitem__("XPIX0", int(hdul[1].data[0]["XPIX0"]) + 1))
            elif name == "redshift-applicability": rewrite_fits(fits_path, lambda hdul: (hdul[1].data[0].__setitem__("RED_APPL", True), hdul[1].data[0].__setitem__("REDSHIFT", 1.0)))
            elif name == "csv-ray-pixel":
                rows = list(csv.DictReader(csv_path.open("r", encoding="utf-8", newline=""))); rows[0]["x_pixel_zero"] = str(int(rows[0]["x_pixel_zero"]) + 1)
                with csv_path.open("w", encoding="utf-8", newline="") as stream: writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator="\n"); writer.writeheader(); writer.writerows(rows)
                candidate["csvFileSha256"] = file_sha(csv_path)
            elif name == "authority-sha": rewrite_fits(fits_path, lambda hdul: hdul[0].header.__setitem__("HIERARCH ATLAS V556 ARTIFACT SHA256", "0" * 64))
            elif name == "dense-status": rewrite_fits(fits_path, lambda hdul: hdul[0].header.__setitem__("DENSE", "COMPLETE-49-OF-49"))
            elif name == "pixel-checksum":
                payload = bytearray(fits_path.read_bytes()); payload[2880 + 23] ^= 1; fits_path.write_bytes(payload)
            if name != "csv-ray-pixel": candidate["fitsFileSha256"] = file_sha(fits_path)
            atomic_json(contract_path, candidate)
            result = subprocess.run([sys.executable, validator.name, "--contract", contract_path.name, "--raw", raw.name, "--fits", fits_path.name, "--csv", csv_path.name, "--output", output.name], cwd=temp, capture_output=True, text=True, encoding="utf-8", timeout=120, check=False)
            if result.returncode == 0: raise ValueError(f"v557-mutation-accepted:{name}")
            rejected.append(name)
    return rejected


def verify_manifest(manifest: dict[str, Any]) -> None:
    if javascript_canonical_sha(manifest) != manifest.get("artifactSha256") or manifest.get("status") != "qualified-sparse-screen-coordinate-and-ray-index-products" or manifest.get("validation", {}).get("qualifiedSubprocessCount") != 2 or manifest.get("validation", {}).get("abCanonicalIdentical") is not True or manifest.get("mutationAudit", {}).get("rejectedMutationCount") != 10 or manifest.get("qualification", {}).get("coordinateSemanticsQualified") is not True or manifest.get("qualification", {}).get("denseScienceImageQualified") is not False or manifest.get("boundary", {}).get("formalProductPointer") != "v263": raise ValueError("v557-manifest-boundary")
    for product in manifest["products"]:
        path = ROOT / product["path"]
        if path.stat().st_size != product["bytes"] or file_sha(path) != product["fileSha256"]: raise ValueError(f"v557-product:{product['id']}")
    receipt = read_json(RECEIPT)
    if canonical_sha(receipt) != receipt.get("resultSha256") or receipt.get("coordinateAudit", {}).get("tableRowsMatched") != 16: raise ValueError("v557-receipt")


def build() -> dict[str, Any]:
    atlas, v556, evidence, raw = validate_sources(); OUT.mkdir(parents=True, exist_ok=True); shutil.copyfile(VALIDATOR_SOURCE, PORTABLE_VALIDATOR)
    rows = make_rows(atlas, raw); write_csv(rows); write_fits(atlas, v556, rows, raw); contract = make_contract(atlas, v556); atomic_json(CONTRACT, contract)
    receipt_a, receipt_b = run_validator(contract), run_validator(contract)
    if canonical_sha(receipt_a) != canonical_sha(receipt_b): raise ValueError("v557-ab-mismatch")
    atomic_json(RECEIPT, receipt_a); rejected = mutation_audit(contract)
    source_paths = [V555_ATLAS, V555_RAW, V556_MANIFEST, V556_EVIDENCE, DENSE, FORMAL, BUILDER_SOURCE, VALIDATOR_SOURCE]
    source_manifest = [{"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in sorted(source_paths)]
    products = [{"id": "fits", "path": FITS.relative_to(ROOT).as_posix(), "mimeType": "application/fits", "fileSha256": file_sha(FITS), "bytes": FITS.stat().st_size, "primaryShape": [4, 256, 256], "hduCount": 2, "rayIndexRows": 16, "pixelReadbackSha256": atlas["raster"]["fileSha256"]}, {"id": "csv", "path": CSV.relative_to(ROOT).as_posix(), "mimeType": "text/csv; charset=utf-8", "fileSha256": file_sha(CSV), "bytes": CSV.stat().st_size, "rowCount": 16}]
    unsigned = {"version": "v557-kerr-sparse-coordinate-products-v1", "generatedAt": FIXED_GENERATED_AT, "status": "qualified-sparse-screen-coordinate-and-ray-index-products", "source": {"v556ArtifactSha256": v556["artifactSha256"], "v556EvidenceSha256": evidence["evidenceSha256"], "v555ArtifactSha256": atlas["artifactSha256"], "payloadSha256": atlas["payload"]["payloadDigestSha256"], "rasterSha256": atlas["raster"]["fileSha256"], "validatorFileSha256": file_sha(PORTABLE_VALIDATOR)}, "contract": {"coordinateFrame": "finite-distance-zamo-screen-alpha-beta-in-M", "notCelestialWcs": True, "alphaRangeM": [-22.0, 22.0], "betaRangeM": [-16.0, 16.0], "width": 256, "height": 256, "alphaPixelScaleM": 44.0 / 255.0, "betaPixelScaleM": -32.0 / 255.0, "referencePixelFits": [128.5, 128.5], "roundingMode": "floor(x+0.5)", "tablePixelOrigin": "zero-based", "fitsPixelOrigin": "one-based", "exactAuthorityCoordinatesRetained": True, "quantizedCenterCoordinatesRetained": True, "pixelReadbackRequired": True}, "products": products, "validation": {"contractPath": CONTRACT.relative_to(ROOT).as_posix(), "contractFileSha256": file_sha(CONTRACT), "receiptPath": RECEIPT.relative_to(ROOT).as_posix(), "receiptFileSha256": file_sha(RECEIPT), "receiptResultSha256": receipt_a["resultSha256"], "independentSubprocessAttemptCount": 2, "qualifiedSubprocessCount": 2, "abCanonicalIdentical": True, "fitsChecksumQualified": True, "fitsCsvCrosscheckQualified": True, "primaryPixelReadbackSha256": atlas["raster"]["fileSha256"], "maxAlphaQuantizationErrorM": receipt_a["coordinateAudit"]["maxAlphaQuantizationErrorM"], "maxBetaQuantizationErrorM": receipt_a["coordinateAudit"]["maxBetaQuantizationErrorM"]}, "mutationAudit": {"mutationCount": 10, "rejectedMutationCount": len(rejected), "mutations": rejected}, "counts": {"authorityRayCount": 16, "captureCount": 6, "escapeCount": 6, "diskHitCount": 4, "rayIndexRowCount": 16, "fitsHduCount": 2, "coordinateAxisCount": 2, "channelAxisCount": 1, "measuredPixelCount": 0, "observedFrameCount": 0}, "qualification": {"coordinateSemanticsQualified": True, "rayIndexQualified": True, "fitsCsvCrosscheckQualified": True, "pixelReadbackQualified": True, "denseScienceImageQualified": False, "observedScienceImageQualified": False, "measuredAuthorityGranted": False, "productionPromotionQualified": False}, "boundary": {"denseCampaignStatus": "incomplete-0-of-49", "denseAggregateAvailable": False, "measuredFrameAvailable": False, "browserQualification": "not-run", "localShadowOnly": True, "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"}, "environment": {"python": platform.python_version(), "numpy": np.__version__, "astropy": astropy.__version__}, "sourceManifest": source_manifest, "sourceSha256": canonical_sha(source_manifest)}
    manifest = {**unsigned, "artifactSha256": javascript_canonical_sha(unsigned)}; atomic_json(MANIFEST, manifest); verify_manifest(manifest); return manifest


def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("--verify", action="store_true"); args = parser.parse_args(); manifest = read_json(MANIFEST) if args.verify else build(); verify_manifest(manifest)
    print(json.dumps({"status": manifest["status"], "artifactSha256": manifest["artifactSha256"], "fitsSha256": manifest["products"][0]["fileSha256"], "csvSha256": manifest["products"][1]["fileSha256"], "rays": 16, "coordinates": "alpha-beta-in-M", "validators": "2/2", "mutationsRejected": "10/10", "denseCampaign": "0/49", "formalProductPointer": "v263"}, indent=2))


if __name__ == "__main__": main()

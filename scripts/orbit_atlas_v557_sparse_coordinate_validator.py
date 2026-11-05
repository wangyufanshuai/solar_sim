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
import numpy as np
from astropy.io import fits


FIXED_GENERATED_AT = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "resultSha256"}


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
        raise ValueError("v557-validator-json-object-required")
    return value


def text(value: Any) -> str:
    if isinstance(value, bytes):
        return value.decode("ascii").strip()
    return str(value).strip()


def pixel_center(alpha_m: float, beta_m: float) -> tuple[int, int]:
    x = math.floor(((alpha_m / 44.0 + 0.5) * 255.0) + 0.5)
    y = math.floor(((0.5 - beta_m / 32.0) * 255.0) + 0.5)
    return x, y


def world_from_pixel(x_zero: int, y_zero: int) -> tuple[float, float]:
    return ((x_zero + 1.0) - 128.5) * (44.0 / 255.0), ((y_zero + 1.0) - 128.5) * (-32.0 / 255.0)


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as stream:
        return list(csv.DictReader(stream))


def validate(contract_path: Path, raw_path: Path, fits_path: Path, csv_path: Path) -> dict[str, Any]:
    contract = read_json(contract_path)
    if contract.get("version") != "v557-sparse-coordinate-validation-contract-v1":
        raise ValueError("v557-validator-contract-version")
    if (np.__version__, astropy.__version__) != ("2.2.6", "7.2.0"):
        raise ValueError("v557-validator-environment")
    samples = contract.get("samples")
    if not isinstance(samples, list) or len(samples) != 16:
        raise ValueError("v557-validator-sample-count")
    raw = raw_path.read_bytes()
    if len(raw) != 262144 or file_sha(raw_path) != contract.get("rasterSha256"):
        raise ValueError("v557-validator-raw")
    if file_sha(fits_path) != contract.get("fitsFileSha256") or file_sha(csv_path) != contract.get("csvFileSha256"):
        raise ValueError("v557-validator-product-sha")

    csv_rows = read_csv_rows(csv_path)
    if len(csv_rows) != 16:
        raise ValueError("v557-validator-csv-count")
    classifications: list[str] = []
    max_alpha_error = 0.0
    max_beta_error = 0.0
    with fits.open(fits_path, checksum=True, memmap=False) as hdul:
        if len(hdul) != 2 or hdul[1].name != "RAYINDEX":
            raise ValueError("v557-validator-hdu-layout")
        for hdu in hdul:
            if hdu.verify_checksum() != 1 or hdu.verify_datasum() != 1:
                raise ValueError("v557-validator-checksum")
        primary, table = hdul[0], hdul[1]
        if primary.data is None or primary.data.shape != (4, 256, 256):
            raise ValueError("v557-validator-primary-shape")
        header = primary.header
        expected_headers = {
            "BITPIX": 8,
            "VERSION": "v557",
            "AUTHKIND": "V312+V313-SPARSE",
            "DENSE": "INCOMPLETE-0-OF-49",
            "CHANORD": "RGBA",
            "WCSAXES": 3,
            "CTYPE1": "KERR-ALPHA",
            "CTYPE2": "KERR-BETA",
            "CTYPE3": "RGBA-CH",
            "CUNIT1": "M",
            "CUNIT2": "M",
            "CRPIX1": 128.5,
            "CRPIX2": 128.5,
            "CRPIX3": 1.0,
            "CRVAL1": 0.0,
            "CRVAL2": 0.0,
            "CRVAL3": 0.0,
            "CDELT1": 44.0 / 255.0,
            "CDELT2": -32.0 / 255.0,
            "CDELT3": 1.0,
            "ALPHAMIN": -22.0,
            "ALPHAMAX": 22.0,
            "BETAMIN": -16.0,
            "BETAMAX": 16.0,
            "TBLPIX": "ZERO-BASED",
            "RNDMODE": "FLOOR(X+0.5)",
            "MEASPIX": 0,
            "OBSFRAME": 0,
            "DATE": "2026-08-02T00:00:00",
            "HIERARCH ATLAS V556 ARTIFACT SHA256": str(contract["v556ArtifactSha256"]),
            "HIERARCH ATLAS V555 PAYLOAD SHA256": str(contract["payloadSha256"]),
            "HIERARCH ATLAS V555 RASTER SHA256": str(contract["rasterSha256"]),
        }
        for key, expected in expected_headers.items():
            actual = header.get(key)
            if isinstance(expected, float):
                if not math.isclose(float(actual), expected, rel_tol=0.0, abs_tol=1e-15):
                    raise ValueError(f"v557-validator-header:{key}")
            elif actual != expected:
                raise ValueError(f"v557-validator-header:{key}")
        readback = np.transpose(np.asarray(primary.data, dtype=np.uint8), (1, 2, 0)).tobytes(order="C")
        if readback != raw or hashlib.sha256(readback).hexdigest() != contract["rasterSha256"]:
            raise ValueError("v557-validator-primary-readback")
        expected_columns = ["INDEX", "RAY_ID", "ALPHA_M", "BETA_M", "XPIX0", "YPIX0", "XFITS1", "YFITS1", "ALPHA_C", "BETA_C", "DALPHA", "DBETA", "SPIN_A", "CLASS", "RED_APPL", "REDSHIFT", "IMG_APPL", "IMAGEORD", "EVPA_APPL", "EVPA_DEG", "INTENSITY", "MAXRESID", "CTR_RGBA"]
        if list(table.columns.names) != expected_columns or len(table.data) != 16:
            raise ValueError("v557-validator-table-columns")
        for index, sample in enumerate(samples):
            row = table.data[index]
            csv_row = csv_rows[index]
            alpha, beta = float(sample["alphaM"]), float(sample["betaM"])
            x_zero, y_zero = pixel_center(alpha, beta)
            alpha_center, beta_center = world_from_pixel(x_zero, y_zero)
            d_alpha, d_beta = alpha - alpha_center, beta - beta_center
            rgba_offset = (y_zero * 256 + x_zero) * 4
            center_rgba = list(raw[rgba_offset:rgba_offset + 4])
            disk = sample["classification"] == "disk-hit"
            classifications.append(str(sample["classification"]))
            exact_pairs = {
                "INDEX": index,
                "RAY_ID": str(sample["rayId"]),
                "XPIX0": x_zero,
                "YPIX0": y_zero,
                "XFITS1": x_zero + 1,
                "YFITS1": y_zero + 1,
                "CLASS": str(sample["classification"]),
                "RED_APPL": disk,
                "IMG_APPL": disk,
                "EVPA_APPL": disk,
            }
            for key, expected in exact_pairs.items():
                actual = text(row[key]) if isinstance(expected, str) else row[key].item() if hasattr(row[key], "item") else row[key]
                if actual != expected:
                    raise ValueError(f"v557-validator-row:{index}:{key}")
            float_pairs = {"ALPHA_M": alpha, "BETA_M": beta, "ALPHA_C": alpha_center, "BETA_C": beta_center, "DALPHA": d_alpha, "DBETA": d_beta, "SPIN_A": float(sample["spinA"]), "INTENSITY": float(sample["intensity"]), "MAXRESID": float(sample["maxNormalizedResidual"])}
            for key, expected in float_pairs.items():
                if not math.isclose(float(row[key]), expected, rel_tol=0.0, abs_tol=1e-14):
                    raise ValueError(f"v557-validator-row:{index}:{key}")
            if disk:
                if not math.isclose(float(row["REDSHIFT"]), float(sample["redshift"]["value"]), rel_tol=0.0, abs_tol=1e-14) or int(row["IMAGEORD"]) != int(sample["imageOrder"]["value"]) or not math.isclose(float(row["EVPA_DEG"]), float(sample["evpa"]["valueDeg"]), rel_tol=0.0, abs_tol=1e-13):
                    raise ValueError(f"v557-validator-disk-values:{index}")
            elif not (math.isnan(float(row["REDSHIFT"])) and int(row["IMAGEORD"]) == -1 and math.isnan(float(row["EVPA_DEG"]))):
                raise ValueError(f"v557-validator-not-applicable:{index}")
            if list(np.asarray(row["CTR_RGBA"], dtype=np.uint8)) != center_rgba:
                raise ValueError(f"v557-validator-center-rgba:{index}")
            expected_csv = {
                "index": str(index), "ray_id": str(sample["rayId"]), "alpha_m": repr(alpha), "beta_m": repr(beta), "x_pixel_zero": str(x_zero), "y_pixel_zero": str(y_zero), "x_pixel_fits": str(x_zero + 1), "y_pixel_fits": str(y_zero + 1), "classification": str(sample["classification"]), "center_rgba_hex": "".join(f"{value:02x}" for value in center_rgba),
            }
            for key, expected in expected_csv.items():
                if csv_row.get(key) != expected:
                    raise ValueError(f"v557-validator-csv:{index}:{key}")
            max_alpha_error = max(max_alpha_error, abs(d_alpha))
            max_beta_error = max(max_beta_error, abs(d_beta))
    if classifications.count("capture") != 6 or classifications.count("escape") != 6 or classifications.count("disk-hit") != 4:
        raise ValueError("v557-validator-classification-conservation")
    if max_alpha_error > 0.5 * (44.0 / 255.0) + 1e-14 or max_beta_error > 0.5 * (32.0 / 255.0) + 1e-14:
        raise ValueError("v557-validator-quantization-bound")

    unsigned = {
        "version": "v557-sparse-coordinate-validation-receipt-v1",
        "generatedAt": FIXED_GENERATED_AT,
        "status": "qualified-fits-screen-coordinate-and-ray-index-semantics",
        "environment": {"numpy": np.__version__, "astropy": astropy.__version__},
        "inputs": {"contractSha256": file_sha(contract_path), "rawSha256": file_sha(raw_path), "fitsFileSha256": file_sha(fits_path), "csvFileSha256": file_sha(csv_path), "v556ArtifactSha256": contract["v556ArtifactSha256"], "payloadSha256": contract["payloadSha256"]},
        "coordinateAudit": {"rayCount": 16, "axisCount": 2, "channelAxisCount": 1, "alphaRangeM": [-22.0, 22.0], "betaRangeM": [-16.0, 16.0], "alphaPixelScaleM": 44.0 / 255.0, "betaPixelScaleM": -32.0 / 255.0, "maxAlphaQuantizationErrorM": max_alpha_error, "maxBetaQuantizationErrorM": max_beta_error, "classificationCounts": {"capture": 6, "escape": 6, "diskHit": 4}, "primaryPixelReadbackSha256": contract["rasterSha256"], "tableRowsMatched": 16, "csvRowsMatched": 16, "fitsChecksumQualified": True},
        "qualification": {"linearScreenCoordinateSemanticsQualified": True, "rayIndexSemanticsQualified": True, "fitsCsvCrosscheckQualified": True, "pixelReadbackQualified": True, "denseScienceImageQualified": False, "measuredAuthorityGranted": False},
        "boundary": {"coordinateFrame": "finite-distance-zamo-screen-alpha-beta-in-M", "notCelestialWcs": True, "denseCampaignStatus": "incomplete-0-of-49", "measuredPixelCount": 0, "browserQualification": "not-run", "formalProductPointer": "v263"},
    }
    return {**unsigned, "resultSha256": canonical_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--raw", type=Path, required=True)
    parser.add_argument("--fits", dest="fits_path", type=Path, required=True)
    parser.add_argument("--csv", dest="csv_path", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt = validate(args.contract, args.raw, args.fits_path, args.csv_path)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    part = args.output.with_name(f"{args.output.name}.{os.getpid()}.part")
    part.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(args.output)
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()

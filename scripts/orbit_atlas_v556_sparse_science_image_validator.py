from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any

import astropy
import numpy as np
import PIL
from astropy.io import fits
from PIL import Image


FIXED_GENERATED_AT = "2026-08-02T00:00:00Z"
TRANSIENT = {"generatedAt", "resultSha256"}


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in TRANSIENT
        }
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(
        canonicalize(value), ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("v556-validator-json-object-required")
    return value


def validate(
    contract_path: Path,
    raw_path: Path,
    png_path: Path,
    fits_path: Path,
) -> dict[str, Any]:
    contract = read_json(contract_path)
    if contract.get("version") != "v556-sparse-science-image-validation-contract-v1":
        raise ValueError("v556-validator-contract-version")
    if (np.__version__, astropy.__version__, PIL.__version__) != (
        "2.2.6",
        "7.2.0",
        "11.3.0",
    ):
        raise ValueError("v556-validator-environment")

    width = int(contract.get("width", 0))
    height = int(contract.get("height", 0))
    raw_bytes = raw_path.read_bytes()
    expected_bytes = width * height * 4
    if width != 256 or height != 256 or len(raw_bytes) != expected_bytes:
        raise ValueError("v556-validator-raw-shape")
    raw_sha = hashlib.sha256(raw_bytes).hexdigest()
    if raw_sha != contract.get("rasterSha256"):
        raise ValueError("v556-validator-raw-sha")
    if file_sha(png_path) != contract.get("pngFileSha256"):
        raise ValueError("v556-validator-png-file-sha")
    if file_sha(fits_path) != contract.get("fitsFileSha256"):
        raise ValueError("v556-validator-fits-file-sha")

    expected_metadata = {
        "OrbitAtlasVersion": "v556",
        "SourceVersion": "v555-kerr-sparse-science-image-v1",
        "V555ArtifactSha256": str(contract["v555ArtifactSha256"]),
        "PayloadSha256": str(contract["payloadSha256"]),
        "RasterSha256": raw_sha,
        "AuthorityKind": "v312-v313-short-gate-sparse",
        "DenseCampaignStatus": "incomplete-0-of-49",
        "MeasuredPixelCount": "0",
        "ObservedFrameCount": "0",
        "ChannelOrder": "RGBA",
        "DisplayTransform": "fixed-linear-no-grade",
    }
    with Image.open(png_path) as image:
        if image.mode != "RGBA" or image.size != (width, height):
            raise ValueError("v556-validator-png-shape")
        for key, expected in expected_metadata.items():
            if image.info.get(key) != expected:
                raise ValueError(f"v556-validator-png-metadata:{key}")
        png_readback = image.tobytes()
    png_readback_sha = hashlib.sha256(png_readback).hexdigest()
    if png_readback_sha != raw_sha or png_readback != raw_bytes:
        raise ValueError("v556-validator-png-readback")

    with fits.open(fits_path, checksum=True, memmap=False) as hdul:
        if len(hdul) != 1:
            raise ValueError("v556-validator-fits-hdu-count")
        primary = hdul[0]
        if primary.verify_checksum() != 1 or primary.verify_datasum() != 1:
            raise ValueError("v556-validator-fits-checksum")
        if primary.data is None or primary.data.shape != (4, height, width):
            raise ValueError("v556-validator-fits-shape")
        header = primary.header
        expected_headers = {
            "BITPIX": 8,
            "VERSION": "v556",
            "AUTHKIND": "V312+V313-SPARSE",
            "DENSE": "INCOMPLETE-0-OF-49",
            "CHANORD": "RGBA",
            "MEASPIX": 0,
            "OBSFRAME": 0,
            "DISP": "FIXED-LINEAR-NO-GRADE",
            "DATE": "2026-08-02T00:00:00",
            "HIERARCH ATLAS V555 ARTIFACT SHA256": str(contract["v555ArtifactSha256"]),
            "HIERARCH ATLAS PAYLOAD SHA256": str(contract["payloadSha256"]),
            "HIERARCH ATLAS RASTER SHA256": raw_sha,
        }
        for key, expected in expected_headers.items():
            if header.get(key) != expected:
                raise ValueError(f"v556-validator-fits-header:{key}")
        fits_array = np.asarray(primary.data, dtype=np.uint8)
        fits_readback = np.transpose(fits_array, (1, 2, 0)).tobytes(order="C")
    fits_readback_sha = hashlib.sha256(fits_readback).hexdigest()
    if fits_readback_sha != raw_sha or fits_readback != raw_bytes:
        raise ValueError("v556-validator-fits-readback")

    unsigned = {
        "version": "v556-sparse-science-image-validation-receipt-v1",
        "generatedAt": FIXED_GENERATED_AT,
        "status": "qualified-exact-rgba-png-fits-readback",
        "environment": {
            "numpy": np.__version__,
            "astropy": astropy.__version__,
            "pillow": PIL.__version__,
        },
        "inputs": {
            "contractSha256": file_sha(contract_path),
            "rawFileSha256": raw_sha,
            "pngFileSha256": file_sha(png_path),
            "fitsFileSha256": file_sha(fits_path),
            "v555ArtifactSha256": contract["v555ArtifactSha256"],
            "payloadSha256": contract["payloadSha256"],
        },
        "readback": {
            "width": width,
            "height": height,
            "channelCount": 4,
            "channelOrder": "RGBA",
            "rawByteCount": len(raw_bytes),
            "pngPixelByteCount": len(png_readback),
            "fitsPixelByteCount": len(fits_readback),
            "rawSha256": raw_sha,
            "pngPixelSha256": png_readback_sha,
            "fitsPixelSha256": fits_readback_sha,
            "allPixelBytesIdentical": True,
            "fitsChecksumQualified": True,
        },
        "qualification": {
            "pngExactReadbackQualified": True,
            "fitsExactReadbackQualified": True,
            "scienceDisplayLinear": True,
            "resizeApplied": False,
            "gradeApplied": False,
            "randomnessApplied": False,
            "denseScienceImageQualified": False,
            "observedScienceImageQualified": False,
            "measuredAuthorityGranted": False,
        },
        "boundary": {
            "authorityKind": "v312-v313-short-gate-sparse",
            "denseCampaignStatus": "incomplete-0-of-49",
            "measuredPixelCount": 0,
            "observedFrameCount": 0,
            "formalProductPointer": "v263",
        },
    }
    return {**unsigned, "resultSha256": canonical_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--raw", type=Path, required=True)
    parser.add_argument("--png", type=Path, required=True)
    parser.add_argument("--fits", dest="fits_path", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt = validate(args.contract, args.raw, args.png, args.fits_path)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    part = args.output.with_name(f"{args.output.name}.{os.getpid()}.part")
    part.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="",
    )
    part.replace(args.output)
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()

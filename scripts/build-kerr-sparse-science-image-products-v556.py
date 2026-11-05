from __future__ import annotations

import argparse
import hashlib
import json
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
import PIL
from astropy.io import fits
from PIL import Image, PngImagePlugin


ROOT = Path.cwd()
SOURCE_DIR = ROOT / "dist/science/kerr-sparse-science-image-v555"
SOURCE_ATLAS = SOURCE_DIR / "atlas.json"
SOURCE_RAW = SOURCE_DIR / "sparse-authority.rgba"
SOURCE_CSV = SOURCE_DIR / "samples.csv"
V555_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v555-evidence.json"
DENSE_STATE = ROOT / "dist/science/kerr-campaign-v314/campaign-state.json"
FORMAL_POINTER = ROOT / "dist/release/orbit-atlas-current-product-evidence-v263.json"
VALIDATOR_SOURCE = ROOT / "scripts/orbit_atlas_v556_sparse_science_image_validator.py"
BUILDER_SOURCE = ROOT / "scripts/build-kerr-sparse-science-image-products-v556.py"
OUT = ROOT / "dist/science/kerr-sparse-science-image-products-v556"
PNG = OUT / "sparse-authority-v556.png"
FITS = OUT / "sparse-authority-v556.fits"
CONTRACT = OUT / "validation-contract.json"
RECEIPT = OUT / "validation-receipt.json"
PORTABLE_VALIDATOR = OUT / "orbit-atlas-v556-sparse-science-image-validator.py"
MANIFEST = OUT / "manifest.json"
FIXED_GENERATED_AT = "2026-08-02T00:00:00Z"
FIXED_FITS_DATE = "2026-08-02T00:00:00"
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "evidenceSha256",
    "pointerSha256",
    "resultSha256",
}


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
        raise ValueError(f"v556-json-object-required:{path.name}")
    return value


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="",
    )
    part.replace(path)


def validate_sources() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], bytes]:
    if (np.__version__, astropy.__version__, PIL.__version__) != (
        "2.2.6",
        "7.2.0",
        "11.3.0",
    ):
        raise ValueError("v556-pinned-image-environment")
    atlas = read_json(SOURCE_ATLAS)
    evidence = read_json(V555_EVIDENCE)
    dense = read_json(DENSE_STATE)
    formal = read_json(FORMAL_POINTER)
    formal_evidence = read_json(ROOT / str(formal["source"]))
    source_entry = next(
        (
            entry
            for entry in evidence.get("sourceManifest", [])
            if entry.get("path")
            == "dist/science/kerr-sparse-science-image-v555/atlas.json"
        ),
        None,
    )
    raw = SOURCE_RAW.read_bytes()
    if (
        atlas.get("version") != "v555-kerr-sparse-science-image-v1"
        or atlas.get("status")
        != "sparse-science-image-qualified-dense-and-measured-frame-incomplete"
        or evidence.get("version") != "orbit-atlas-shadow-v555-evidence-v1"
        or evidence.get("dependency", {}).get("v555ArtifactSha256")
        != atlas.get("artifactSha256")
        or source_entry is None
        or source_entry.get("sha256") != file_sha(SOURCE_ATLAS)
        or atlas.get("payload", {}).get("authorityKind")
        != "v312-v313-short-gate-sparse"
        or atlas.get("counts", {}).get("sampleCount") != 16
        or atlas.get("counts", {}).get("captureCount") != 6
        or atlas.get("counts", {}).get("escapeCount") != 6
        or atlas.get("counts", {}).get("diskHitCount") != 4
        or atlas.get("counts", {}).get("measuredPixelCount") != 0
        or atlas.get("counts", {}).get("observedFrameCount") != 0
        or atlas.get("qualification", {}).get("sparseScienceRasterQualified") is not True
        or atlas.get("qualification", {}).get("denseScienceImageQualified") is not False
        or atlas.get("boundary", {}).get("denseCampaignStatus")
        != "incomplete-0-of-49"
        or len(raw) != 256 * 256 * 4
        or file_sha(SOURCE_RAW) != atlas.get("raster", {}).get("fileSha256")
        or file_sha(SOURCE_CSV) != atlas.get("exports", {}).get("csvFileSha256")
        or dense.get("status") != "incomplete-0-of-49"
        or dense.get("completedShardCount") != 0
        or dense.get("aggregateAvailable") is not False
        or formal.get("version") != "v263-current-product-evidence-pointer"
        or formal_evidence.get("science", {}).get("defaultKernel")
        != "legacy-eih-1pn"
        or formal_evidence.get("contracts", {}).get("singleCanvas") is not True
        or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603
        or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84
    ):
        raise ValueError("v556-upstream-boundary")
    return atlas, evidence, dense, raw


def png_metadata(atlas: dict[str, Any]) -> dict[str, str]:
    return {
        "OrbitAtlasVersion": "v556",
        "SourceVersion": "v555-kerr-sparse-science-image-v1",
        "V555ArtifactSha256": str(atlas["artifactSha256"]),
        "PayloadSha256": str(atlas["payload"]["payloadDigestSha256"]),
        "RasterSha256": str(atlas["raster"]["fileSha256"]),
        "AuthorityKind": "v312-v313-short-gate-sparse",
        "DenseCampaignStatus": "incomplete-0-of-49",
        "MeasuredPixelCount": "0",
        "ObservedFrameCount": "0",
        "ChannelOrder": "RGBA",
        "DisplayTransform": "fixed-linear-no-grade",
    }


def write_png(atlas: dict[str, Any], raw: bytes) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image = Image.frombytes("RGBA", (256, 256), raw)
    metadata = PngImagePlugin.PngInfo()
    for key, value in png_metadata(atlas).items():
        metadata.add_text(key, value)
    part = PNG.with_name(f"{PNG.name}.{os.getpid()}.part")
    try:
        image.save(part, format="PNG", pnginfo=metadata, compress_level=9, optimize=False)
        part.replace(PNG)
    finally:
        part.unlink(missing_ok=True)


def write_fits(atlas: dict[str, Any], raw: bytes) -> None:
    pixels = np.frombuffer(raw, dtype=np.uint8).reshape((256, 256, 4))
    primary = fits.PrimaryHDU(data=np.transpose(pixels, (2, 0, 1)))
    header = primary.header
    header["VERSION"] = "v556"
    header["AUTHKIND"] = "V312+V313-SPARSE"
    header["DENSE"] = "INCOMPLETE-0-OF-49"
    header["CHANORD"] = "RGBA"
    header["MEASPIX"] = 0
    header["OBSFRAME"] = 0
    header["DISP"] = "FIXED-LINEAR-NO-GRADE"
    header["DATE"] = FIXED_FITS_DATE
    header["HIERARCH ATLAS V555 ARTIFACT SHA256"] = str(atlas["artifactSha256"])
    header["HIERARCH ATLAS PAYLOAD SHA256"] = str(
        atlas["payload"]["payloadDigestSha256"]
    )
    header["HIERARCH ATLAS RASTER SHA256"] = str(atlas["raster"]["fileSha256"])
    primary.add_datasum(when=FIXED_FITS_DATE)
    primary.add_checksum(when=FIXED_FITS_DATE, override_datasum=True)
    part = FITS.with_name(f"{FITS.name}.{os.getpid()}.part")
    try:
        fits.HDUList([primary]).writeto(part, overwrite=True, checksum=False)
        part.replace(FITS)
    finally:
        part.unlink(missing_ok=True)


def make_contract(atlas: dict[str, Any]) -> dict[str, Any]:
    return {
        "version": "v556-sparse-science-image-validation-contract-v1",
        "generatedAt": FIXED_GENERATED_AT,
        "width": 256,
        "height": 256,
        "channelOrder": "RGBA",
        "v555ArtifactSha256": atlas["artifactSha256"],
        "payloadSha256": atlas["payload"]["payloadDigestSha256"],
        "rasterSha256": atlas["raster"]["fileSha256"],
        "pngFileSha256": file_sha(PNG),
        "fitsFileSha256": file_sha(FITS),
        "authorityKind": "v312-v313-short-gate-sparse",
        "denseCampaignStatus": "incomplete-0-of-49",
        "measuredPixelCount": 0,
        "observedFrameCount": 0,
    }


def run_isolated_validator(contract: dict[str, Any]) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v556-validator-") as temp_name:
        temp = Path(temp_name)
        for source, target in (
            (PORTABLE_VALIDATOR, temp / "validator.py"),
            (SOURCE_RAW, temp / "source.rgba"),
            (PNG, temp / "product.png"),
            (FITS, temp / "product.fits"),
        ):
            shutil.copyfile(source, target)
        atomic_json(temp / "contract.json", contract)
        result = subprocess.run(
            [
                sys.executable,
                "validator.py",
                "--contract",
                "contract.json",
                "--raw",
                "source.rgba",
                "--png",
                "product.png",
                "--fits",
                "product.fits",
                "--output",
                "receipt.json",
            ],
            cwd=temp,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=120,
            check=False,
        )
        if result.returncode != 0:
            raise ValueError(f"v556-isolated-validator:{result.stderr.strip()}")
        return read_json(temp / "receipt.json")


def rewrite_png(path: Path, mutate: Callable[[dict[str, str], bytearray], None]) -> None:
    with Image.open(path) as image:
        metadata = {key: str(value) for key, value in image.info.items()}
        pixels = bytearray(image.convert("RGBA").tobytes())
    mutate(metadata, pixels)
    info = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        info.add_text(key, value)
    Image.frombytes("RGBA", (256, 256), bytes(pixels)).save(
        path, format="PNG", pnginfo=info, compress_level=9, optimize=False
    )


def rewrite_fits_header(path: Path, key: str, value: Any) -> None:
    with fits.open(path, mode="update", checksum=True, memmap=False) as hdul:
        hdul[0].header[key] = value
        hdul[0].add_datasum(when=FIXED_FITS_DATE)
        hdul[0].add_checksum(when=FIXED_FITS_DATE, override_datasum=True)
        hdul.flush(output_verify="exception")


def mutation_audit(contract: dict[str, Any]) -> list[str]:
    mutations = [
        "png-pixel",
        "png-metadata",
        "fits-checksum",
        "fits-channel-order",
        "fits-authority-sha",
        "fits-dense-status",
        "shape-byte-count",
        "measured-observed-promotion",
    ]
    rejected: list[str] = []
    for mutation in mutations:
        with tempfile.TemporaryDirectory(prefix=f"orbit-atlas-v556-{mutation}-") as temp_name:
            temp = Path(temp_name)
            validator = temp / "validator.py"
            raw = temp / "source.rgba"
            png = temp / "product.png"
            fits_path = temp / "product.fits"
            contract_path = temp / "contract.json"
            output = temp / "receipt.json"
            for source, target in (
                (PORTABLE_VALIDATOR, validator),
                (SOURCE_RAW, raw),
                (PNG, png),
                (FITS, fits_path),
            ):
                shutil.copyfile(source, target)
            candidate = dict(contract)
            if mutation == "png-pixel":
                rewrite_png(
                    png,
                    lambda _metadata, pixels: pixels.__setitem__(0, pixels[0] ^ 1),
                )
                candidate["pngFileSha256"] = file_sha(png)
            elif mutation == "png-metadata":
                rewrite_png(
                    png,
                    lambda metadata, _pixels: metadata.__setitem__(
                        "DenseCampaignStatus", "complete-49-of-49"
                    ),
                )
                candidate["pngFileSha256"] = file_sha(png)
            elif mutation == "fits-checksum":
                payload = bytearray(fits_path.read_bytes())
                payload[2880 + 17] ^= 1
                fits_path.write_bytes(payload)
                candidate["fitsFileSha256"] = file_sha(fits_path)
            elif mutation == "fits-channel-order":
                rewrite_fits_header(fits_path, "CHANORD", "ARGB")
                candidate["fitsFileSha256"] = file_sha(fits_path)
            elif mutation == "fits-authority-sha":
                rewrite_fits_header(
                    fits_path, "HIERARCH ATLAS V555 ARTIFACT SHA256", "0" * 64
                )
                candidate["fitsFileSha256"] = file_sha(fits_path)
            elif mutation == "fits-dense-status":
                rewrite_fits_header(fits_path, "DENSE", "COMPLETE-49-OF-49")
                candidate["fitsFileSha256"] = file_sha(fits_path)
            elif mutation == "shape-byte-count":
                raw.write_bytes(raw.read_bytes()[:-4])
            elif mutation == "measured-observed-promotion":
                rewrite_png(
                    png,
                    lambda metadata, _pixels: (
                        metadata.__setitem__("MeasuredPixelCount", "1"),
                        metadata.__setitem__("ObservedFrameCount", "1"),
                    ),
                )
                candidate["pngFileSha256"] = file_sha(png)
            atomic_json(contract_path, candidate)
            result = subprocess.run(
                [
                    sys.executable,
                    validator.name,
                    "--contract",
                    contract_path.name,
                    "--raw",
                    raw.name,
                    "--png",
                    png.name,
                    "--fits",
                    fits_path.name,
                    "--output",
                    output.name,
                ],
                cwd=temp,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=120,
                check=False,
            )
            if result.returncode == 0:
                raise ValueError(f"v556-mutation-accepted:{mutation}")
            rejected.append(mutation)
    return rejected


def verify_manifest(manifest: dict[str, Any]) -> None:
    if canonical_sha(manifest) != manifest.get("artifactSha256"):
        raise ValueError("v556-manifest-sha")
    if (
        manifest.get("status")
        != "qualified-sparse-authority-png-fits-dense-and-measured-incomplete"
        or manifest.get("validation", {}).get("qualifiedSubprocessCount") != 2
        or manifest.get("validation", {}).get("abCanonicalIdentical") is not True
        or manifest.get("mutationAudit", {}).get("rejectedMutationCount") != 8
        or manifest.get("qualification", {}).get("sparsePngFitsQualified") is not True
        or manifest.get("qualification", {}).get("denseScienceImageQualified") is not False
        or manifest.get("qualification", {}).get("observedScienceImageQualified") is not False
        or manifest.get("boundary", {}).get("denseCampaignStatus")
        != "incomplete-0-of-49"
        or manifest.get("boundary", {}).get("formalProductPointer") != "v263"
    ):
        raise ValueError("v556-manifest-boundary")
    for product in manifest.get("products", []):
        path = ROOT / str(product["path"])
        if not path.is_file() or path.stat().st_size != product.get("bytes"):
            raise ValueError(f"v556-product-size:{product.get('id')}")
        if file_sha(path) != product.get("fileSha256"):
            raise ValueError(f"v556-product-sha:{product.get('id')}")
    receipt = read_json(RECEIPT)
    if (
        canonical_sha(receipt) != receipt.get("resultSha256")
        or receipt.get("readback", {}).get("allPixelBytesIdentical") is not True
    ):
        raise ValueError("v556-receipt-boundary")


def build() -> dict[str, Any]:
    atlas, evidence, dense, raw = validate_sources()
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(VALIDATOR_SOURCE, PORTABLE_VALIDATOR)
    write_png(atlas, raw)
    write_fits(atlas, raw)
    contract = make_contract(atlas)
    atomic_json(CONTRACT, contract)
    receipt_a = run_isolated_validator(contract)
    receipt_b = run_isolated_validator(contract)
    if canonical_sha(receipt_a) != canonical_sha(receipt_b):
        raise ValueError("v556-isolated-ab-mismatch")
    atomic_json(RECEIPT, receipt_a)
    rejected = mutation_audit(contract)
    source_paths = [
        SOURCE_ATLAS,
        SOURCE_RAW,
        SOURCE_CSV,
        V555_EVIDENCE,
        DENSE_STATE,
        FORMAL_POINTER,
        BUILDER_SOURCE,
        VALIDATOR_SOURCE,
    ]
    source_manifest = [
        {"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)}
        for path in sorted(source_paths)
    ]
    products = [
        {
            "id": "png",
            "path": PNG.relative_to(ROOT).as_posix(),
            "mimeType": "image/png",
            "fileSha256": file_sha(PNG),
            "bytes": PNG.stat().st_size,
            "width": 256,
            "height": 256,
            "channelOrder": "RGBA",
            "pixelReadbackSha256": atlas["raster"]["fileSha256"],
        },
        {
            "id": "fits",
            "path": FITS.relative_to(ROOT).as_posix(),
            "mimeType": "application/fits",
            "fileSha256": file_sha(FITS),
            "bytes": FITS.stat().st_size,
            "shape": [4, 256, 256],
            "bitpix": 8,
            "channelOrder": "RGBA",
            "pixelReadbackSha256": atlas["raster"]["fileSha256"],
        },
    ]
    unsigned = {
        "version": "v556-kerr-sparse-science-image-products-v1",
        "generatedAt": FIXED_GENERATED_AT,
        "status": "qualified-sparse-authority-png-fits-dense-and-measured-incomplete",
        "source": {
            "v555ArtifactPath": SOURCE_ATLAS.relative_to(ROOT).as_posix(),
            "v555ArtifactFileSha256": file_sha(SOURCE_ATLAS),
            "v555ArtifactSha256": atlas["artifactSha256"],
            "v555EvidenceSha256": evidence["evidenceSha256"],
            "payloadSha256": atlas["payload"]["payloadDigestSha256"],
            "rasterSha256": atlas["raster"]["fileSha256"],
            "csvSha256": atlas["exports"]["csvFileSha256"],
            "validatorFileSha256": file_sha(PORTABLE_VALIDATOR),
            "denseStateSha256": dense["stateSha256"],
        },
        "contract": {
            "width": 256,
            "height": 256,
            "channelCount": 4,
            "channelOrder": "RGBA",
            "rawByteCount": 262144,
            "scienceDisplayLinear": True,
            "resizeAllowed": False,
            "gradeAllowed": False,
            "randomnessAllowed": False,
            "exactPixelReadbackRequired": True,
            "fitsChecksumRequired": True,
            "denseAggregateRequiredForFullImage": True,
            "measuredFrameRequiredForObservedImage": True,
        },
        "products": products,
        "validation": {
            "contractPath": CONTRACT.relative_to(ROOT).as_posix(),
            "contractFileSha256": file_sha(CONTRACT),
            "receiptPath": RECEIPT.relative_to(ROOT).as_posix(),
            "receiptFileSha256": file_sha(RECEIPT),
            "receiptResultSha256": receipt_a["resultSha256"],
            "independentSubprocessAttemptCount": 2,
            "qualifiedSubprocessCount": 2,
            "abCanonicalIdentical": True,
            "rawPngFitsPixelBytesIdentical": True,
            "fitsChecksumQualified": True,
        },
        "mutationAudit": {
            "mutationCount": len(rejected),
            "rejectedMutationCount": len(rejected),
            "mutations": rejected,
        },
        "counts": {
            "sourceAuthorityRayCount": 16,
            "sparseDisplayPixelCount": atlas["counts"]["sparseDisplayPixelCount"],
            "publishedProductCount": 2,
            "publishedPixelByteCount": 262144,
            "measuredPixelCount": 0,
            "observedFrameCount": 0,
        },
        "qualification": {
            "sparseAuthorityQualified": True,
            "pngExactReadbackQualified": True,
            "fitsExactReadbackQualified": True,
            "sparsePngFitsQualified": True,
            "denseScienceImageQualified": False,
            "observedScienceImageQualified": False,
            "measuredAuthorityGranted": False,
            "productionPromotionQualified": False,
        },
        "boundary": {
            "authorityKind": "v312-v313-short-gate-sparse",
            "denseCampaignStatus": "incomplete-0-of-49",
            "denseAggregateAvailable": False,
            "measuredFrameAvailable": False,
            "measuredValuesInvented": False,
            "browserQualification": "not-run",
            "localShadowOnly": True,
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "astropy": astropy.__version__,
            "pillow": PIL.__version__,
        },
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    manifest = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(MANIFEST, manifest)
    verify_manifest(manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    manifest = read_json(MANIFEST) if args.verify else build()
    verify_manifest(manifest)
    print(
        json.dumps(
            {
                "status": manifest["status"],
                "artifactSha256": manifest["artifactSha256"],
                "products": [
                    {
                        "id": product["id"],
                        "fileSha256": product["fileSha256"],
                        "bytes": product["bytes"],
                    }
                    for product in manifest["products"]
                ],
                "validators": "2/2",
                "mutationsRejected": "8/8",
                "pixelReadbackSha256": manifest["source"]["rasterSha256"],
                "denseCampaign": "0/49",
                "measuredPixels": 0,
                "formalProductPointer": "v263",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

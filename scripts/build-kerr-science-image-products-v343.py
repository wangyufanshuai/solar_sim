from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import astropy
import numpy as np
import PIL
from astropy.io import fits
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

ROOT = Path.cwd()
RASTER_PATH = Path("dist/science/kerr-observation-raster-v342/raster.json")
PRODUCT_PATH = Path("dist/science/kerr-observation-product-v341/observation-product.json")
REQUIREMENTS_PATH = Path("scripts/requirements-science-images-v343.txt")
OUTPUT_DIR = Path("dist/science/kerr-observation-images-v343")
FITS_PATH = OUTPUT_DIR / "science-raster-v343.fits"
PNG_PATH = OUTPUT_DIR / "science-raster-v343.png"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
BANDS = ("visible", "euv", "soft-x-ray")
RAYS = (12, 13, 14, 15)


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return sha256((ROOT / path).read_bytes())


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(item) for item in value]
    if isinstance(value, dict):
        excluded = {"generatedAt", "artifactSha256", "manifestSha256"}
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in excluded}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return sha256(payload)


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads((ROOT / path).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"v343 invalid JSON: {path}")
    return value


def validate_sources() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    if (np.__version__, astropy.__version__, PIL.__version__) != ("2.2.6", "7.2.0", "11.3.0"):
        raise ValueError("v343 pinned image environment mismatch")
    raster_artifact = read_json(RASTER_PATH)
    product_artifact = read_json(PRODUCT_PATH)
    if not isinstance(raster_artifact.get("artifactSha256"), str) or len(raster_artifact["artifactSha256"]) != 64:
        raise ValueError("v343 raster artifact SHA missing")
    if not isinstance(product_artifact.get("artifactSha256"), str) or len(product_artifact["artifactSha256"]) != 64:
        raise ValueError("v343 product artifact SHA missing")
    raster = raster_artifact.get("raster", {})
    product = product_artifact.get("product", {})
    cells = raster.get("scienceCells", [])
    if (
        raster.get("version") != "v342-kerr-sparse-observation-raster-v1"
        or raster.get("sourceProductArtifactSha256") != product_artifact.get("artifactSha256")
        or raster.get("authority", {}).get("denseCampaignStatus") != "incomplete-0-of-49"
        or raster.get("authority", {}).get("denseAggregateSha256") is not None
        or product.get("authority", {}).get("kind") != "v312-v313-short-gate-sparse"
        or len(cells) != 12
    ):
        raise ValueError("v343 source boundary mismatch")
    identities = {(cell.get("rayIndex"), cell.get("bandId")) for cell in cells}
    if identities != {(ray, band) for ray in RAYS for band in BANDS}:
        raise ValueError("v343 cell conservation mismatch")
    fields = (
        "observedEnergyRadianceWM2Sr", "lowerAuditEnvelopeWM2Sr", "upperAuditEnvelopeWM2Sr",
        "conservativeLinearRelativeEnvelope", "redshiftFactor", "walkerPenroseEvpaDeg",
        "parallelTransportEvpaDeg", "evpaDifferenceDeg", "imageOrder", "scienceLinearDisplay01",
    )
    for cell in cells:
        if not all(np.isfinite(float(cell[field])) for field in fields):
            raise ValueError("v343 non-finite cell")
        if not (float(cell["lowerAuditEnvelopeWM2Sr"]) <= float(cell["observedEnergyRadianceWM2Sr"]) <= float(cell["upperAuditEnvelopeWM2Sr"])):
            raise ValueError("v343 uncertainty envelope mismatch")
        if not 0 <= float(cell["evpaDifferenceDeg"]) < 0.5:
            raise ValueError("v343 EVPA boundary mismatch")
    return raster_artifact, product_artifact, cells


def image_array(cells: list[dict[str, Any]], field: str, dtype: Any = np.float64) -> np.ndarray:
    fill_value = 0 if np.issubdtype(np.dtype(dtype), np.integer) else np.nan
    result = np.full((3, 4), fill_value, dtype=dtype)
    for cell in cells:
        result[BANDS.index(str(cell["bandId"])), RAYS.index(int(cell["rayIndex"]))] = cell[field]
    if np.issubdtype(result.dtype, np.floating) and not np.all(np.isfinite(result)):
        raise ValueError(f"v343 non-finite FITS field: {field}")
    return result


def atomic_fits(raster: dict[str, Any], product: dict[str, Any], cells: list[dict[str, Any]]) -> None:
    primary = fits.PrimaryHDU(data=image_array(cells, "observedEnergyRadianceWM2Sr"))
    primary.header["BUNIT"] = "W m-2 sr-1"
    primary.header["ORIGIN"] = "Orbit Atlas Local Shadow"
    primary.header["VERSION"] = "v343"
    primary.header["AUTHKIND"] = "v312+v313 sparse"
    primary.header["DENSE"] = "INCOMPLETE-0-OF-49"
    primary.header["SCIDGST"] = str(raster["scienceDigest"])
    primary.header["DISP"] = "FIXED-LINEAR"
    primary.header["HIERARCH ATLAS GEOMETRY SHA256"] = str(product["authority"]["geometryEvidenceSha256"])
    primary.header["HIERARCH ATLAS POLARIZATION SHA256"] = str(product["authority"]["polarizationEvidenceSha256"])
    primary.header["HIERARCH ATLAS FULL SHORT SHA256"] = str(product["authority"]["fullShortAuthoritySha256"])
    fields = (
        ("ERRLOW", "lowerAuditEnvelopeWM2Sr", "W m-2 sr-1", np.float64),
        ("ERRHIGH", "upperAuditEnvelopeWM2Sr", "W m-2 sr-1", np.float64),
        ("RELERROR", "conservativeLinearRelativeEnvelope", "1", np.float64),
        ("REDSHIFT", "redshiftFactor", "1", np.float64),
        ("EVPA_WP", "walkerPenroseEvpaDeg", "deg", np.float64),
        ("EVPA_PT", "parallelTransportEvpaDeg", "deg", np.float64),
        ("EVPA_DIF", "evpaDifferenceDeg", "deg", np.float64),
        ("IMAGEORD", "imageOrder", "1", np.int16),
        ("SPIN", "spinA", "1", np.float64),
        ("LINVIEW", "scienceLinearDisplay01", "1", np.float64),
    )
    hdus: list[Any] = [primary]
    for name, field, unit, dtype in fields:
        hdu = fits.ImageHDU(data=image_array(cells, field, dtype), name=name)
        hdu.header["BUNIT"] = unit
        hdus.append(hdu)
    hdus.append(fits.BinTableHDU.from_columns([
        fits.Column(name="ROW", format="J", array=np.arange(3, dtype=np.int32)),
        fits.Column(name="BAND", format="12A", array=np.asarray(BANDS, dtype="S12")),
        fits.Column(name="FIXEDREF", format="D", unit="W m-2 sr-1", array=np.asarray([3.5e10, 9e14, 1.5e16])),
    ], name="BANDMETA"))
    hdus.append(fits.BinTableHDU.from_columns([
        fits.Column(name="COLUMN", format="J", array=np.arange(4, dtype=np.int32)),
        fits.Column(name="RAYINDEX", format="J", array=np.asarray(RAYS, dtype=np.int32)),
    ], name="RAYMETA"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(prefix="v343-", suffix=".fits.part", dir=ROOT / OUTPUT_DIR, delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        # FITS CHECKSUM cards can vary across rewrites in Astropy; the release
        # product is instead locked by the manifest SHA-256 over exact bytes.
        fits.HDUList(hdus).writeto(temporary_path, overwrite=True, checksum=False)
        os.replace(temporary_path, ROOT / FITS_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)


def atomic_png(raster: dict[str, Any], product: dict[str, Any], cells: list[dict[str, Any]]) -> None:
    image = Image.new("RGB", (1200, 720), (4, 9, 18))
    draw, font = ImageDraw.Draw(image), ImageFont.load_default()
    draw.rectangle((0, 0, 1199, 719), outline=(42, 83, 107), width=2)
    draw.text((44, 30), "ORBIT ATLAS / KERR SPARSE SCIENCE IMAGE v343", fill=(190, 230, 246), font=font)
    draw.text((44, 54), "FIXED LINEAR REFERENCES / RAW VALUES RETAINED / DENSE 0 OF 49", fill=(92, 137, 162), font=font)
    draw.text((910, 30), f"SCI {raster['scienceDigest']}", fill=(104, 190, 219), font=font)
    colors = {"visible": (231, 182, 92), "euv": (79, 189, 226), "soft-x-ray": (130, 145, 236)}
    labels = {"visible": "VIS", "euv": "EUV", "soft-x-ray": "SXR"}
    for row, band in enumerate(BANDS):
        draw.text((38, 174 + row * 174), labels[band], fill=colors[band], font=font)
        for column, ray in enumerate(RAYS):
            cell = next(item for item in cells if item["rayIndex"] == ray and item["bandId"] == band)
            x0, y0 = 142 + column * 266, 108 + row * 174
            value = max(0.0, min(1.0, float(cell["scienceLinearDisplay01"])))
            base = colors[band]
            fill = tuple(int(9 + channel * (0.08 + 0.36 * value)) for channel in base)
            draw.rectangle((x0, y0, x0 + 250, y0 + 158), fill=fill, outline=(65, 99, 119))
            draw.rectangle((x0, y0, x0 + 4 + int(value * 246), y0 + 5), fill=base)
            lines = (
                (16, f"RAY {ray:02d} / a={float(cell['spinA']):+.3f}", (207, 232, 242)),
                (42, f"I {float(cell['observedEnergyRadianceWM2Sr']):.4e}", (231, 240, 244)),
                (66, f"u/I {float(cell['conservativeLinearRelativeEnvelope']):.3e}", (146, 189, 207)),
                (90, f"g {float(cell['redshiftFactor']):.6f}", (146, 189, 207)),
                (114, f"EVPA {float(cell['walkerPenroseEvpaDeg']):.4f} deg", (146, 189, 207)),
                (136, f"dEVPA {float(cell['evpaDifferenceDeg']):.2e}", (123, 210, 174)),
            )
            for offset, label, color in lines:
                draw.text((x0 + 12, y0 + offset), label, fill=color, font=font)
    full_sha = str(product["authority"]["fullShortAuthoritySha256"])
    draw.text((44, 676), f"AUTHORITY {full_sha[:18]}... / sparse measurement product, not a dense transfer map", fill=(76, 120, 143), font=font)
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("OrbitAtlasVersion", "v343")
    metadata.add_text("ScienceDigest", str(raster["scienceDigest"]))
    metadata.add_text("FullShortAuthoritySha256", full_sha)
    metadata.add_text("DenseCampaignStatus", "incomplete-0-of-49")
    metadata.add_text("DisplayTransform", "fixed-linear-reference-per-band")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(prefix="v343-", suffix=".png.part", dir=ROOT / OUTPUT_DIR, delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        image.save(temporary_path, format="PNG", pnginfo=metadata, compress_level=9)
        os.replace(temporary_path, ROOT / PNG_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)


def verify(manifest: dict[str, Any]) -> None:
    if canonical_sha(manifest) != manifest.get("manifestSha256"):
        raise ValueError("v343 manifest SHA mismatch")
    for product in manifest.get("products", []):
        path = Path(str(product["path"]))
        if file_sha(path) != product.get("sha256") or (ROOT / path).stat().st_size != product.get("bytes"):
            raise ValueError(f"v343 product integrity mismatch: {path}")
    expected = ["PRIMARY", "ERRLOW", "ERRHIGH", "RELERROR", "REDSHIFT", "EVPA_WP", "EVPA_PT", "EVPA_DIF", "IMAGEORD", "SPIN", "LINVIEW", "BANDMETA", "RAYMETA"]
    with fits.open(ROOT / FITS_PATH, checksum=False, memmap=False) as hdul:
        names = ["PRIMARY" if index == 0 else hdu.name for index, hdu in enumerate(hdul)]
        if names != expected or hdul[0].data.shape != (3, 4) or hdul[0].header.get("DENSE") != "INCOMPLETE-0-OF-49":
            raise ValueError("v343 FITS structure mismatch")
    with Image.open(ROOT / PNG_PATH) as image:
        if image.size != (1200, 720) or image.mode != "RGB" or image.info.get("DenseCampaignStatus") != "incomplete-0-of-49" or image.info.get("DisplayTransform") != "fixed-linear-reference-per-band":
            raise ValueError("v343 PNG metadata mismatch")
    serialized = json.dumps(manifest, ensure_ascii=False)
    if any(key in serialized for key in ("absolutePath", '"host"', '"pid"', "peakRssGiB", "freeMemoryGiB")):
        raise ValueError("v343 sensitive provenance field")


def build() -> dict[str, Any]:
    raster_artifact, product_artifact, cells = validate_sources()
    raster, product = raster_artifact["raster"], product_artifact["product"]
    atomic_fits(raster, product, cells)
    atomic_png(raster, product, cells)
    products = [
        {"id": "fits", "path": FITS_PATH.as_posix(), "mimeType": "application/fits", "sha256": file_sha(FITS_PATH), "bytes": (ROOT / FITS_PATH).stat().st_size, "shape": [3, 4], "hduCount": 13, "integrity": "external-sha256-exact-bytes"},
        {"id": "png", "path": PNG_PATH.as_posix(), "mimeType": "image/png", "sha256": file_sha(PNG_PATH), "bytes": (ROOT / PNG_PATH).stat().st_size, "width": 1200, "height": 720, "displayTransform": "fixed-linear-reference-per-band"},
    ]
    unsigned = {
        "version": "v343-kerr-science-image-product-manifest-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "qualified-sparse-science-fits-png-products",
        "source": {"rasterPath": RASTER_PATH.as_posix(), "rasterFileSha256": file_sha(RASTER_PATH), "rasterArtifactSha256": raster_artifact["artifactSha256"], "productPath": PRODUCT_PATH.as_posix(), "productFileSha256": file_sha(PRODUCT_PATH), "productArtifactSha256": product_artifact["artifactSha256"], "requirementsPath": REQUIREMENTS_PATH.as_posix(), "requirementsSha256": file_sha(REQUIREMENTS_PATH), "fullShortAuthoritySha256": product["authority"]["fullShortAuthoritySha256"], "geometryEvidenceSha256": product["authority"]["geometryEvidenceSha256"], "polarizationEvidenceSha256": product["authority"]["polarizationEvidenceSha256"]},
        "products": products,
        "fields": ["radiance", "lower-envelope", "upper-envelope", "relative-envelope", "redshift", "walker-penrose-evpa", "parallel-transport-evpa", "evpa-difference", "image-order", "spin", "fixed-linear-display"],
        "bands": list(BANDS), "rays": list(RAYS), "shape": [3, 4],
        "units": {"radiance": "W m^-2 sr^-1", "angle": "deg", "redshift": "1", "spin": "1"},
        "display": {"science": "fixed-linear-reference-per-band", "adaptiveNormalization": False, "cinematicInput": False},
        "environment": {"python": platform.python_version(), "numpy": np.__version__, "astropy": astropy.__version__, "pillow": PIL.__version__},
        "denseCampaignStatus": "incomplete-0-of-49", "denseAggregateSha256": None,
        "browserQualification": "not-run", "sanitizedProvenance": True,
        "boundary": "offline-fits-png-from-v342-sparse-raster-not-dense-image-not-browser-fits-runtime",
    }
    manifest = {**unsigned, "manifestSha256": canonical_sha(unsigned)}
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    target = ROOT / MANIFEST_PATH
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", prefix="v343-", suffix=".json.part", dir=target.parent, delete=False) as temporary:
        json.dump(manifest, temporary, ensure_ascii=False, indent=2)
        temporary.write("\n")
        temporary_path = Path(temporary.name)
    try:
        os.replace(temporary_path, target)
    finally:
        temporary_path.unlink(missing_ok=True)
    verify(manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    manifest = read_json(MANIFEST_PATH) if args.verify else build()
    verify(manifest)
    print(json.dumps({"status": manifest["status"], "manifestSha256": manifest["manifestSha256"], "products": [{"id": product["id"], "sha256": product["sha256"], "bytes": product["bytes"]} for product in manifest["products"]], "shape": manifest["shape"], "dense": manifest["denseCampaignStatus"], "browser": manifest["browserQualification"]}, indent=2))


if __name__ == "__main__":
    main()

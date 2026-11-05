from __future__ import annotations

import csv
import hashlib
import json
import math
import os
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-observer-plane-WCS-v420"
ARTIFACT = OUT / "observer-plane-WCS.json"
CSV_PATH = OUT / "sparse-source-catalog.csv"
FITS_PATH = OUT / "sparse-source-catalog-WCS.fits"
PNG_PATH = OUT / "observer-plane-WCS-grid.png"
MANIFEST = OUT / "export-manifest.json"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic(path: Path, payload: bytes) -> None:
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_bytes(payload)
    temporary.replace(path)


def validate_csv() -> None:
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 4 or any(row["intensity"] or row["stokes"] or row["interpolation_allowed"] != "false" for row in rows):
        raise RuntimeError("v420-csv-no-raster-boundary")


def wcs_from_view(view: dict[str, object]) -> WCS:
    contract = view["wcs"]
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [contract["crpix1"], contract["crpix2"]]
    wcs.wcs.cdelt = np.asarray([contract["cdelt1MPerPixel"], contract["cdelt2MPerPixel"]], dtype=float)
    wcs.wcs.crval = [contract["crval1M"], contract["crval2M"]]
    wcs.wcs.ctype = [contract["ctype1"], contract["ctype2"]]
    wcs.wcs.cname = [contract["cname1"], contract["cname2"]]
    wcs.wcs.name = contract["name"]
    return wcs


def write_fits(view: dict[str, object]) -> None:
    rows = view["catalog"]["rows"]
    wcs = wcs_from_view(view)
    primary = fits.PrimaryHDU(header=wcs.to_header(relax=True))
    primary.header["WCSAXES"] = 2
    primary.header["KERRUNIT"] = ("GM/c^2", "Dimensionless geometrized screen length")
    primary.header["OBSERVER"] = "FINITE ZAMO"
    primary.header["R_OBS"] = (30.0, "Observer radius in GM/c^2")
    primary.header["INCL_DEG"] = (70.0, "Observer inclination in degrees")
    primary.header["GRIDW"] = (384, "Coordinate grid width only")
    primary.header["GRIDH"] = (384, "Coordinate grid height only")
    primary.header["HASIMAGE"] = (False, "Primary HDU has no raster data")
    primary.header["INTERPOL"] = (False, "Four rays are not interpolated")
    columns = [
        fits.Column(name="RAY_INDEX", format="J", array=np.array([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="8A", array=np.array([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="SPIN_A", format="D", array=np.array([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="ALPHA_M", format="D", array=np.array([row["alphaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="BETA_M", format="D", array=np.array([row["betaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_X", format="D", array=np.array([row["continuousPixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.array([row["continuousPixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.array([row["authorityEvpaDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="REDSHIFT", format="D", array=np.array([row["redshiftFactor"] for row in rows], dtype=np.float64)),
        fits.Column(name="INTENSITY", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_I", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_Q", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_U", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_V", format="D", array=np.full(4, np.nan, dtype=np.float64)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="SPARSE_SOURCES")
    table.header["AUTHORIT"] = "V419 SCREEN COORD"
    table.header["PIXVALUE"] = (False, "Continuous coordinates only")
    table.header["DENSE"] = (False, "Dense campaign remains 0/49")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or opened[0].header["INTERPOL"] or not isinstance(opened[1], fits.BinTableHDU) or len(opened[1].data) != 4:
            raise RuntimeError("v420-fits-no-image-boundary")
        validation_header = opened[0].header.copy()
        validation_header["NAXIS"] = 2
        validation_header["NAXIS1"] = 384
        validation_header["NAXIS2"] = 384
        recovered_wcs = WCS(validation_header)
        world = np.asarray([[row["alphaM"], row["betaM"]] for row in rows], dtype=float)
        pixels = recovered_wcs.all_world2pix(world, 1)
        expected = np.asarray([[row["continuousPixelX"], row["continuousPixelY"]] for row in rows], dtype=float)
        if float(np.max(np.abs(pixels - expected))) >= 1e-10:
            raise RuntimeError("v420-fits-WCS-roundtrip")


def write_png(view: dict[str, object]) -> None:
    rows = view["catalog"]["rows"]
    width, height = 1400, 800
    image = Image.new("RGB", (width, height), (3, 8, 11))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    left, top, right, bottom = 110, 105, 1325, 680
    draw.rectangle((0, 0, width - 1, height - 1), outline=(68, 103, 111), width=1)
    draw.text((38, 28), "V420 KERR OBSERVER-PLANE LINEAR WCS", fill=(211, 239, 233), font=font)
    draw.text((38, 49), "384 x 384 COORDINATE CONTRACT / 4 CONTINUOUS SOURCES / NO RASTER SCIENCE VALUES", fill=(247, 186, 91), font=font)
    draw.rectangle((left, top, right, bottom), fill=(4, 13, 17), outline=(53, 87, 95), width=1)

    def xy(alpha: float, beta: float) -> tuple[float, float]:
        return (left + (alpha + 22) / 44 * (right - left), bottom - (beta + 16) / 32 * (bottom - top))

    for alpha in range(-20, 21, 4):
        x, _ = xy(float(alpha), -16)
        draw.line((x, top, x, bottom), fill=(14, 37, 43), width=1)
        draw.text((x - 9, bottom + 11), str(alpha), fill=(83, 132, 139), font=font)
    for beta in range(-16, 17, 4):
        _, y = xy(-22, float(beta))
        draw.line((left, y, right, y), fill=(14, 37, 43), width=1)
        draw.text((left - 34, y - 5), str(beta), fill=(83, 132, 139), font=font)
    draw.text((right - 86, bottom + 36), "alpha / M", fill=(111, 169, 172), font=font)
    draw.text((left - 70, top - 24), "beta / M", fill=(111, 169, 172), font=font)
    for row in rows:
        x, y = xy(float(row["alphaM"]), float(row["betaM"]))
        angle = math.radians(float(row["authorityEvpaDeg"]))
        dx, dy = math.sin(angle) * 48, -math.cos(angle) * 48
        draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(247, 185, 89), outline=(255, 224, 158), width=1)
        draw.line((x - dx, y - dy, x + dx, y + dy), fill=(102, 232, 211), width=3)
        draw.text((x - 44, y + 18), row["rayId"], fill=(190, 224, 219), font=font)
        draw.text((x - 70, y + 34), f"pixel ({float(row['continuousPixelX']):.3f}, {float(row['continuousPixelY']):.3f})", fill=(103, 180, 178), font=font)
    draw.text((38, 742), "FITS 1-based continuous pixel centers | world edges alpha [-22,22]M beta [-16,16]M | interpolation prohibited | dense 0/49", fill=(117, 153, 158), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    if artifact.get("version") != "v420-kerr-observer-plane-WCS-artifact-v1" or artifact.get("view", {}).get("catalog", {}).get("rowCount") != 4:
        raise RuntimeError("v420-artifact-boundary")
    validate_csv()
    write_fits(artifact["view"])
    write_png(artifact["view"])
    manifest = {
        "version": "v420-kerr-observer-plane-WCS-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "WCS-and-sparse-source-catalog"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "sparse-source-catalog"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "primary-WCS-header-plus-binary-table-no-image-data"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "coordinate-grid-diagnostic-not-raster-science-image"},
        },
        "fitsImage": "unavailable-no-raster-science-values",
        "polarimetricRaster": "unavailable-dense-campaign-incomplete-0-of-49",
        "interpolationAllowed": False,
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v420-WCS-source-catalog", "artifactSha256": artifact["artifactSha256"], "fits": manifest["exports"]["fits"]["semantic"], "png": manifest["exports"]["png"]["semantic"], "fitsImage": manifest["fitsImage"]}, indent=2))


if __name__ == "__main__":
    main()

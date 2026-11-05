from __future__ import annotations

import csv
import hashlib
import json
import math
import os
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-screen-coordinate-provenance-v419"
ARTIFACT = OUT / "screen-coordinate-provenance.json"
CSV_PATH = OUT / "screen-coordinate-provenance.csv"
FITS_PATH = OUT / "screen-coordinate-table.fits"
PNG_PATH = OUT / "sparse-screen-quiver.png"
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
    expected = [(12, -8.0, 9.0), (13, -3.0, 9.0), (14, 3.0, 9.0), (15, 8.0, 9.0)]
    actual = [(int(row["ray_index"]), float(row["alpha_M"]), float(row["beta_M"])) for row in rows]
    if actual != expected or any(row["pixel_x"] or row["pixel_y"] or row["pixel_coordinate_status"] != "unavailable" for row in rows):
        raise RuntimeError("v419-csv-coordinate-conservation")


def write_fits(rows: list[dict[str, object]]) -> None:
    columns = [
        fits.Column(name="RAY_INDEX", format="J", array=np.array([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="8A", array=np.array([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="SPIN_A", format="D", array=np.array([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="ALPHA_M", format="D", unit="M", array=np.array([row["alphaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="BETA_M", format="D", unit="M", array=np.array([row["betaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="R_EMIT_M", format="D", unit="M", array=np.array([row["geometry"]["emissionRadiusM"] for row in rows], dtype=np.float64)),
        fits.Column(name="REDSHIFT", format="D", array=np.array([row["geometry"]["redshiftFactor"] for row in rows], dtype=np.float64)),
        fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.array([row["polarization"]["v313WalkerPenroseEvpaDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="ENERGY", format="D", array=np.array([row["constants"]["energy"] for row in rows], dtype=np.float64)),
        fits.Column(name="LZ", format="D", array=np.array([row["constants"]["angularMomentumZ"] for row in rows], dtype=np.float64)),
        fits.Column(name="CARTER_Q", format="D", array=np.array([row["constants"]["carterConstant"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_X", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="PIX_STAT", format="11A", array=np.array(["unavailable"] * 4, dtype="S11")),
    ]
    primary = fits.PrimaryHDU()
    primary.header["PRODUCT"] = "V419 SCREEN COORD"
    primary.header["OBSERVER"] = "FINITE ZAMO"
    primary.header["R_OBS"] = (30.0, "Observer radius in M")
    primary.header["INCL_DEG"] = (70.0, "Observer inclination in degrees")
    primary.header["SCIMAP"] = (False, "Sparse quiver is not an image map")
    primary.header["PIXWCS"] = (False, "No approved pixel WCS")
    table = fits.BinTableHDU.from_columns(columns, name="SCREEN_COORD")
    table.header["AUTHORIT"] = "V312/V313/V314"
    table.header["DENSE"] = (False, "Dense campaign remains 0/49")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or not isinstance(opened[1], fits.BinTableHDU) or len(opened[1].data) != 4 or opened[0].header["SCIMAP"] or opened[0].header["PIXWCS"]:
            raise RuntimeError("v419-fits-boundary")


def write_png(rows: list[dict[str, object]]) -> None:
    width, height = 1400, 720
    image = Image.new("RGB", (width, height), (3, 8, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    left, top, right, bottom = 110, 100, 1320, 610
    draw.rectangle((0, 0, width - 1, height - 1), outline=(72, 107, 110), width=1)
    draw.text((38, 28), "V419 FINITE-ZAMO SCREEN COORDINATE PROVENANCE", fill=(212, 239, 232), font=font)
    draw.text((38, 49), "4 AUTHORITY RAYS / SPARSE QUIVER / NOT A RASTER OR DENSE SCIENCE IMAGE", fill=(246, 187, 94), font=font)
    draw.rectangle((left, top, right, bottom), fill=(5, 13, 16), outline=(59, 91, 96), width=1)
    alpha_min, alpha_max = -12.0, 12.0
    beta_min, beta_max = 5.0, 13.0

    def screen_xy(alpha: float, beta: float) -> tuple[float, float]:
        x = left + (alpha - alpha_min) / (alpha_max - alpha_min) * (right - left)
        y = bottom - (beta - beta_min) / (beta_max - beta_min) * (bottom - top)
        return x, y

    for alpha in range(-12, 13, 3):
        x, _ = screen_xy(float(alpha), beta_min)
        draw.line((x, top, x, bottom), fill=(15, 36, 40), width=1)
        draw.text((x - 8, bottom + 12), str(alpha), fill=(91, 139, 140), font=font)
    for beta in range(5, 14, 2):
        _, y = screen_xy(alpha_min, float(beta))
        draw.line((left, y, right, y), fill=(15, 36, 40), width=1)
        draw.text((left - 30, y - 5), str(beta), fill=(91, 139, 140), font=font)
    draw.text((right - 80, bottom + 34), "alpha / M", fill=(118, 173, 172), font=font)
    draw.text((left - 66, top - 24), "beta / M", fill=(118, 173, 172), font=font)
    for row in rows:
        x, y = screen_xy(float(row["alphaM"]), float(row["betaM"]))
        angle = math.radians(float(row["polarization"]["v313WalkerPenroseEvpaDeg"]))
        dx, dy = math.sin(angle) * 54, -math.cos(angle) * 54
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(245, 187, 92), outline=(255, 224, 156), width=1)
        draw.line((x - dx, y - dy, x + dx, y + dy), fill=(113, 236, 214), width=4)
        draw.text((x - 36, y + 22), f"{row['rayId']} / a={float(row['spinA']):+.1f}", fill=(192, 224, 219), font=font)
        draw.text((x - 40, y + 40), f"EVPA {float(row['polarization']['v313WalkerPenroseEvpaDeg']):.5f} deg", fill=(103, 190, 181), font=font)
    draw.text((38, 675), "Observer: finite-distance ZAMO  r=30M  inclination=70deg  |  pixel WCS unavailable  |  dense campaign 0/49", fill=(120, 154, 155), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    rows = artifact.get("view", {}).get("rows", [])
    if artifact.get("version") != "v419-kerr-screen-coordinate-provenance-artifact-v1" or len(rows) != 4:
        raise RuntimeError("v419-artifact-boundary")
    validate_csv()
    write_fits(rows)
    write_png(rows)
    manifest = {
        "version": "v419-kerr-screen-coordinate-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "screen-coordinate-provenance-table"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "screen-coordinate-provenance-table"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "binary-table-not-image-HDU"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "sparse-quiver-diagnostic-not-science-image-map"},
        },
        "fitsImage": "unavailable-sparse-four-ray-and-no-approved-pixel-WCS",
        "densePolarimetricImage": "unavailable-campaign-incomplete-0-of-49",
        "networkAttempted": False,
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v419-screen-coordinate-products", "artifactSha256": artifact["artifactSha256"], "fits": manifest["exports"]["fits"]["semantic"], "png": manifest["exports"]["png"]["semantic"], "fitsImage": manifest["fitsImage"]}, indent=2))


if __name__ == "__main__":
    main()

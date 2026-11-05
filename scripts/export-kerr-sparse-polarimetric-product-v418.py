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
OUT = ROOT / "dist/science/kerr-sparse-polarimetric-product-v418"
ARTIFACT = OUT / "diagnostic-product.json"
CSV_PATH = OUT / "diagnostic-product.csv"
FITS_PATH = OUT / "diagnostic-product-table.fits"
PNG_PATH = OUT / "diagnostic-strip.png"
MANIFEST = OUT / "export-manifest.json"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_bytes(path: Path, payload: bytes) -> None:
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_bytes(payload)
    temporary.replace(path)


def validate_csv(rows: list[dict[str, object]]) -> None:
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        parsed = list(csv.DictReader(handle))
    if len(parsed) != 4 or [int(row["ray_index"]) for row in parsed] != [12, 13, 14, 15]:
        raise RuntimeError("v418-csv-row-conservation")
    if any(row["image_alpha"] or row["image_beta"] or row["image_plane_status"] != "unavailable" for row in parsed):
        raise RuntimeError("v418-csv-image-plane-boundary")
    if len(rows) != len(parsed):
        raise RuntimeError("v418-csv-artifact-conservation")


def write_fits(rows: list[dict[str, object]]) -> None:
    authority = [row["authorityPolarization"] for row in rows]
    fixture = [row["instrumentFixture"] for row in rows]
    columns = [
        fits.Column(name="RAY_INDEX", format="J", array=np.array([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="8A", array=np.array([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="SPIN_A", format="D", array=np.array([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="R_EMIT_M", format="D", unit="M", array=np.array([row["emissionRadiusM"] for row in rows], dtype=np.float64)),
        fits.Column(name="REDSHIFT", format="D", array=np.array([row["redshiftFactor"] for row in rows], dtype=np.float64)),
        fits.Column(name="WP_EVPA", format="D", unit="deg", array=np.array([entry["walkerPenroseEvpaDeg"] for entry in authority], dtype=np.float64)),
        fits.Column(name="PT_EVPA", format="D", unit="deg", array=np.array([entry["parallelTransportEvpaDeg"] for entry in authority], dtype=np.float64)),
        fits.Column(name="FIX_PL", format="D", array=np.array([entry["fixturePL"] for entry in fixture], dtype=np.float64)),
        fits.Column(name="FIX_PC", format="D", array=np.array([entry["fixturePC"] for entry in fixture], dtype=np.float64)),
        fits.Column(name="CNT_SPEV", format="D", unit="deg", array=np.array([entry["counting"]["marginalSigmaEvpaDeg"] for entry in fixture], dtype=np.float64)),
        fits.Column(name="CAL_SPEV", format="D", unit="deg", array=np.array([entry["calibration"]["marginalSigmaEvpaDeg"] for entry in fixture], dtype=np.float64)),
        fits.Column(name="IMG_ALPHA", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="IMG_BETA", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="IMG_STAT", format="11A", array=np.array(["unavailable"] * 4, dtype="S11")),
    ]
    primary = fits.PrimaryHDU()
    primary.header["PRODUCT"] = "V418 POL DIAGNOSTIC"
    primary.header["SCIMAP"] = (False, "Not a science image map")
    primary.header["DENSE"] = (False, "Dense campaign is incomplete 0/49")
    primary.header["IMGCOORD"] = (False, "No image-plane alpha/beta authority")
    table = fits.BinTableHDU.from_columns(columns, name="POL_DIAGNOSTIC")
    table.header["AUTHORIT"] = "V297 WP/PT"
    table.header["INSTFIX"] = "V417 FIXTURE"
    table.header["MEASURED"] = (False, "Synthetic instrument fixture only")
    hdul = fits.HDUList([primary, table])
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    hdul.writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or not isinstance(opened[1], fits.BinTableHDU) or len(opened[1].data) != 4:
            raise RuntimeError("v418-fits-table-conservation")
        if opened[0].header["SCIMAP"] or opened[0].header["IMGCOORD"]:
            raise RuntimeError("v418-fits-image-boundary")


def write_png(rows: list[dict[str, object]]) -> None:
    width, height = 1400, 420
    image = Image.new("RGB", (width, height), (4, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(84, 110, 116), width=1)
    draw.text((30, 22), "V418 AUTHORITY DIAGNOSTIC STRIP", fill=(218, 240, 235), font=font)
    draw.text((30, 42), "NO IMAGE-PLANE COORDINATES / NOT A SCIENCE IMAGE MAP", fill=(245, 185, 95), font=font)
    panel_width = 320
    for index, row in enumerate(rows):
        left = 30 + index * 338
        top = 82
        right = left + panel_width
        bottom = 380
        draw.rectangle((left, top, right, bottom), fill=(7, 13, 17), outline=(65, 98, 102), width=1)
        authority = row["authorityPolarization"]
        fixture = row["instrumentFixture"]
        cx, cy, radius = left + 160, top + 126, 82
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(47, 82, 88), width=1)
        angle = math.radians(float(authority["walkerPenroseEvpaDeg"]))
        dx, dy = math.cos(angle) * radius, -math.sin(angle) * radius
        draw.line((cx - dx, cy - dy, cx + dx, cy + dy), fill=(126, 237, 218), width=3)
        sigma_deg = float(fixture["calibration"]["marginalSigmaEvpaDeg"])
        sigma_px = max(2, min(14, int(round(sigma_deg * 300))))
        draw.arc((cx - radius - sigma_px, cy - radius - sigma_px, cx + radius + sigma_px, cy + radius + sigma_px), 205, 335, fill=(244, 185, 90), width=2)
        draw.text((left + 18, top + 18), f"{row['rayId']} / ray {row['rayIndex']}", fill=(220, 236, 233), font=font)
        draw.text((left + 18, top + 222), f"spin {float(row['spinA']):+.3f}", fill=(135, 184, 183), font=font)
        draw.text((left + 18, top + 240), f"WP EVPA {float(authority['walkerPenroseEvpaDeg']):.6f} deg", fill=(126, 237, 218), font=font)
        draw.text((left + 18, top + 258), f"fixture sigma {sigma_deg:.6f} deg", fill=(244, 185, 90), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)
    with Image.open(PNG_PATH) as opened:
        if opened.size != (width, height) or opened.mode != "RGB":
            raise RuntimeError("v418-png-conservation")


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    if artifact.get("version") != "v418-kerr-sparse-polarimetric-diagnostic-artifact-v1":
        raise RuntimeError("v418-artifact-version")
    rows = artifact.get("view", {}).get("rows", [])
    if len(rows) != 4 or artifact["view"]["counts"]["imagePlaneCoordinateCount"] != 0:
        raise RuntimeError("v418-row-boundary")
    validate_csv(rows)
    write_fits(rows)
    write_png(rows)
    manifest = {
        "version": "v418-kerr-sparse-polarimetric-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": "diagnostic-product.json", "sha256": file_sha(ARTIFACT), "semantic": "science-diagnostic-table"},
            "csv": {"path": "diagnostic-product.csv", "sha256": file_sha(CSV_PATH), "semantic": "science-diagnostic-table"},
            "fits": {"path": "diagnostic-product-table.fits", "sha256": file_sha(FITS_PATH), "semantic": "binary-table-not-image-HDU"},
            "png": {"path": "diagnostic-strip.png", "sha256": file_sha(PNG_PATH), "semantic": "diagnostic-strip-only-not-science-image"},
        },
        "fitsImage": "unavailable-dense-and-screen-coordinate-boundary",
        "scienceImageMap": "unavailable-dense-and-screen-coordinate-boundary",
        "networkAttempted": False,
        "denseShardExecuted": False,
    }
    payload = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    atomic_bytes(MANIFEST, payload)
    print(json.dumps({
        "status": "exported-four-row-table-and-diagnostic-strip",
        "artifactSha256": artifact["artifactSha256"],
        "fitsSemantic": manifest["exports"]["fits"]["semantic"],
        "pngSemantic": manifest["exports"]["png"]["semantic"],
        "fitsImage": manifest["fitsImage"],
    }, indent=2))


if __name__ == "__main__":
    main()

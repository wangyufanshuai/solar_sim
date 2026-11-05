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
OUT = ROOT / "dist/science/kerr-polarization-orientation-basis-v422"
ARTIFACT = OUT / "orientation-basis-catalog.json"
CSV_PATH = OUT / "orientation-basis-catalog.csv"
FITS_PATH = OUT / "orientation-basis-WCS-table.fits"
PNG_PATH = OUT / "orientation-basis-compass.png"
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
    if len(rows) != 4:
        raise RuntimeError("v422-csv-row-count")
    unavailable = ("stokes_I", "stokes_Q", "stokes_U", "stokes_V", "normalized_Q", "normalized_U", "linear_polarization_fraction", "polarization_amplitude")
    if any(any(row[key] for key in unavailable) or row["stokes_measurement_available"] != "false" or row["nearest_pixel_assignment_allowed"] != "false" or row["interpolation_allowed"] != "false" for row in rows):
        raise RuntimeError("v422-csv-measurement-boundary")


def create_wcs() -> WCS:
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [192.5, 192.5]
    wcs.wcs.cdelt = np.asarray([44.0 / 384.0, 32.0 / 384.0], dtype=float)
    wcs.wcs.crval = [0.0, 0.0]
    wcs.wcs.ctype = ["LINEAR", "LINEAR"]
    wcs.wcs.cname = ["KERR_ALPHA", "KERR_BETA"]
    wcs.wcs.name = "KERR_FINITE_ZAMO_OBSERVER_PLANE"
    return wcs


def write_fits(view: dict[str, object]) -> None:
    rows = view["rows"]
    wcs = create_wcs()
    primary = fits.PrimaryHDU(header=wcs.to_header(relax=True))
    primary.header["WCSAXES"] = 2
    primary.header["KERRUNIT"] = ("GM/c^2", "Observer-screen length")
    primary.header["HASIMAGE"] = (False, "Primary HDU contains no raster values")
    primary.header["ORIBASIS"] = (True, "Unit 2chi basis available")
    primary.header["MEASSTOK"] = (False, "No measured I,Q,U,V")
    primary.header["RASKMASK"] = (False, "No raster mask")
    primary.header["NEARPIX"] = (False, "No pixel assignment")
    primary.header["INTERPOL"] = (False, "No interpolation")
    columns = [
        fits.Column(name="RAY_INDEX", format="J", array=np.asarray([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="8A", array=np.asarray([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="SPIN_A", format="D", array=np.asarray([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.asarray([row["authorityEvpaDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_X", format="D", array=np.asarray([row["continuousCoordinate"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.asarray([row["continuousCoordinate"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="Q_HAT", format="D", array=np.asarray([row["orientationBasis"]["qHat"] for row in rows], dtype=np.float64)),
        fits.Column(name="U_HAT", format="D", array=np.asarray([row["orientationBasis"]["uHat"] for row in rows], dtype=np.float64)),
        fits.Column(name="ORI_AVAIL", format="L", array=np.ones(4, dtype=bool)),
        fits.Column(name="STOK_AVAIL", format="L", array=np.zeros(4, dtype=bool)),
        fits.Column(name="STOKES_I", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_Q", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_U", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKES_V", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="POL_FRAC", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="POL_AMP", format="D", array=np.full(4, np.nan, dtype=np.float64)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="ORIENTATION_BASIS")
    table.header["QHATSEM"] = "COS(2CHI)"
    table.header["UHATSEM"] = "SIN(2CHI)"
    table.header["UNITRAD"] = (True, "Unit radius is not pL")
    table.header["DENSE"] = (False, "Dense campaign remains 0/49")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["ORIBASIS"] or opened[0].header["MEASSTOK"] or opened[0].header["RASKMASK"] or opened[0].header["NEARPIX"] or opened[0].header["INTERPOL"] or len(opened[1].data) != 4 or np.any(opened[1].data["STOK_AVAIL"]):
            raise RuntimeError("v422-fits-boundary")


def write_png(view: dict[str, object]) -> None:
    rows = view["rows"]
    width, height = 1600, 900
    image = Image.new("RGB", (width, height), (2, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(66, 102, 112), width=1)
    draw.text((40, 28), "V422 MASK-AWARE POLARIZATION ORIENTATION BASIS", fill=(218, 244, 238), font=font)
    draw.text((40, 50), "Q-HAT = COS(2CHI), U-HAT = SIN(2CHI) / UNIT RADIUS BY DEFINITION / NOT Q/I OR U/I", fill=(250, 190, 92), font=font)

    left_box = (70, 110, 850, 760)
    right_box = (930, 110, 1530, 710)
    draw.rectangle(left_box, fill=(3, 13, 17), outline=(52, 88, 98), width=1)
    draw.rectangle(right_box, fill=(3, 13, 17), outline=(52, 88, 98), width=1)

    def observer_xy(pixel_x: float, pixel_y: float) -> tuple[float, float]:
        return (left_box[0] + (pixel_x - 0.5) / 384.0 * (left_box[2] - left_box[0]), left_box[3] - (pixel_y - 0.5) / 384.0 * (left_box[3] - left_box[1]))

    for index in range(1, 8):
        fraction = index / 8.0
        x = left_box[0] + fraction * (left_box[2] - left_box[0])
        y = left_box[1] + fraction * (left_box[3] - left_box[1])
        draw.line((x, left_box[1], x, left_box[3]), fill=(13, 35, 42), width=1)
        draw.line((left_box[0], y, left_box[2], y), fill=(13, 35, 42), width=1)
    draw.text((left_box[0] + 14, left_box[1] + 12), "FINITE-ZAMO CONTINUOUS SOURCE COORDINATES", fill=(118, 181, 181), font=font)
    colors = [(103, 232, 249), (94, 234, 212), (190, 242, 100), (251, 191, 36)]
    for row, color in zip(rows, colors):
        x, y = observer_xy(row["continuousCoordinate"]["pixelX"], row["continuousCoordinate"]["pixelY"])
        chi = math.radians(float(row["authorityEvpaDeg"]))
        dx, dy = math.sin(chi) * 46.0, -math.cos(chi) * 46.0
        draw.line((x - dx, y - dy, x + dx, y + dy), fill=color, width=4)
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(249, 188, 88), outline=(255, 231, 171), width=1)
        draw.text((x - 32, y + 20), row["rayId"], fill=(209, 235, 230), font=font)

    cx = (right_box[0] + right_box[2]) / 2
    cy = (right_box[1] + right_box[3]) / 2
    radius = 245
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(73, 129, 134), width=2)
    draw.line((cx - radius, cy, cx + radius, cy), fill=(44, 82, 89), width=1)
    draw.line((cx, cy - radius, cx, cy + radius), fill=(44, 82, 89), width=1)
    draw.text((right_box[2] - 66, cy + 8), "+Q-hat", fill=(117, 181, 181), font=font)
    draw.text((cx + 10, right_box[1] + 14), "+U-hat", fill=(117, 181, 181), font=font)
    draw.text((right_box[0] + 14, right_box[1] + 12), "DOUBLE-ANGLE ORIENTATION COMPASS", fill=(118, 181, 181), font=font)
    for row, color in zip(rows, colors):
        x = cx + row["orientationBasis"]["qHat"] * radius
        y = cy - row["orientationBasis"]["uHat"] * radius
        draw.line((cx, cy, x, y), fill=tuple(max(0, component - 95) for component in color), width=1)
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=color, outline=(239, 251, 247), width=1)
    legend_x, legend_y = right_box[0] + 28, right_box[3] - 105
    for index, (row, color) in enumerate(zip(rows, colors)):
        y = legend_y + index * 18
        draw.ellipse((legend_x, y, legend_x + 8, y + 8), fill=color)
        draw.text((legend_x + 15, y - 1), f"{row['rayId']}  qhat={row['orientationBasis']['qHat']:+.5f}  uhat={row['orientationBasis']['uHat']:+.5f}", fill=color, font=font)
    draw.text((960, 740), "ORIENTATION_AVAILABLE: 4 / STOKES_MEASUREMENT_AVAILABLE: 0", fill=(158, 211, 198), font=font)
    draw.text((960, 762), "I, Q, U, V, Q/I, U/I, pL and amplitude remain unavailable (not zero).", fill=(247, 186, 91), font=font)
    draw.text((40, 835), "No raster mask, nearest-pixel assignment or interpolation. Continuous coordinates are not pixel samples. Dense campaign 0/49.", fill=(117, 154, 159), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v422-kerr-polarization-orientation-basis-artifact-v1" or len(view.get("rows", [])) != 4 or view.get("rasterAdmission", {}).get("rasterMaskGenerated") is not False:
        raise RuntimeError("v422-artifact-boundary")
    validate_csv()
    write_fits(view)
    write_png(view)
    manifest = {
        "version": "v422-kerr-polarization-orientation-basis-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "mask-aware-orientation-basis-catalog"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "four-source-orientation-basis-and-applicability-mask"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "primary-WCS-plus-orientation-basis-binary-table-no-image-data"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "orientation-basis-compass-diagnostic-not-science-raster"},
        },
        "orientationBasis": "available-unit-double-angle-not-normalized-Stokes",
        "stokesMeasurement": "unavailable-no-I-Q-U-V",
        "polarizationAmplitude": "unavailable",
        "rasterMaskGenerated": False,
        "fitsImage": "unavailable-no-raster-science-values",
        "nearestPixelAssignmentAllowed": False,
        "interpolationAllowed": False,
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v422-orientation-basis-products", "artifactSha256": artifact["artifactSha256"], "fits": manifest["exports"]["fits"]["semantic"], "png": manifest["exports"]["png"]["semantic"], "stokesMeasurement": manifest["stokesMeasurement"]}, indent=2))


if __name__ == "__main__":
    main()

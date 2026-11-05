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
OUT = ROOT / "dist/science/kerr-predicted-stokes-admission-v423"
ARTIFACT = OUT / "predicted-stokes-catalog.json"
CSV_PATH = OUT / "predicted-stokes-catalog.csv"
FITS_PATH = OUT / "predicted-stokes-WCS-table.fits"
PNG_PATH = OUT / "predicted-stokes-diagnostic.png"
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
    if len(rows) != 24 or any(row["predicted_V"] or row["model_prediction"] != "true" or row["measurement_authority"] != "false" or row["pixel_sample_available"] != "false" or row["interpolation_allowed"] != "false" for row in rows):
        raise RuntimeError("v423-csv-boundary")


def create_wcs() -> WCS:
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [192.5, 192.5]
    wcs.wcs.cdelt = np.asarray([44.0 / 384.0, 32.0 / 384.0], dtype=float)
    wcs.wcs.crval = [0.0, 0.0]
    wcs.wcs.ctype = ["LINEAR", "LINEAR"]
    wcs.wcs.cname = ["KERR_ALPHA", "KERR_BETA"]
    return wcs


def write_fits(view: dict[str, object]) -> None:
    rows = view["rows"]
    primary = fits.PrimaryHDU(header=create_wcs().to_header(relax=True))
    primary.header["HASIMAGE"] = (False, "No raster data")
    primary.header["MODPRED"] = (True, "Model predictions")
    primary.header["MEASURED"] = (False, "No measurements")
    primary.header["DETECTOR"] = (False, "No detector projection")
    primary.header["PIXSAMP"] = (False, "No pixel samples")
    primary.header["DENSE"] = (False, "Dense campaign 0/49")
    columns = [
        fits.Column(name="RAY_ID", format="8A", array=np.asarray([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="RAY_INDEX", format="J", array=np.asarray([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="SPIN_A", format="D", array=np.asarray([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="FREQ_HZ", format="D", unit="Hz", array=np.asarray([row["observedFrequencyHz"] for row in rows], dtype=np.float64)),
        fits.Column(name="METHOD", format="33A", array=np.asarray([row["transportMethod"] for row in rows], dtype="S33")),
        fits.Column(name="PIXEL_X", format="D", array=np.asarray([row["continuousCoordinate"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.asarray([row["continuousCoordinate"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.asarray([row["evpaDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_I", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedSpectralStokes"]["i"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_Q", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedSpectralStokes"]["q"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_U", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedSpectralStokes"]["u"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_V", format="D", unit="W m-2 sr-1 Hz-1", array=np.full(24, np.nan, dtype=np.float64)),
        fits.Column(name="Q_OVER_I", format="D", array=np.asarray([row["normalizedOrientation"]["qOverI"] for row in rows], dtype=np.float64)),
        fits.Column(name="U_OVER_I", format="D", array=np.asarray([row["normalizedOrientation"]["uOverI"] for row in rows], dtype=np.float64)),
        fits.Column(name="MODEL", format="L", array=np.ones(24, dtype=bool)),
        fits.Column(name="MEASURED", format="L", array=np.zeros(24, dtype=bool)),
        fits.Column(name="PIX_SAMPLE", format="L", array=np.zeros(24, dtype=bool)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="PREDICTED_STOKES")
    table.header["STOKUNIT"] = "W m-2 sr-1 Hz-1"
    table.header["PLMODEL"] = (0.12, "Emitted linear fraction")
    table.header["CIRCPOL"] = "UNAVAILABLE"
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["MODPRED"] or opened[0].header["MEASURED"] or opened[0].header["DETECTOR"] or opened[0].header["PIXSAMP"] or opened[0].header["DENSE"] or len(opened[1].data) != 24 or np.any(opened[1].data["MEASURED"]) or np.any(opened[1].data["PIX_SAMPLE"]):
            raise RuntimeError("v423-fits-boundary")


def write_png(view: dict[str, object]) -> None:
    rows = view["rows"]
    width, height = 1600, 1000
    image = Image.new("RGB", (width, height), (2, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    colors = {"disk-00": (103, 232, 249), "disk-01": (94, 234, 212), "disk-02": (190, 242, 100), "disk-03": (251, 191, 36)}
    draw.rectangle((0, 0, width - 1, height - 1), outline=(65, 103, 112), width=1)
    draw.text((40, 28), "V423 WCS-LINKED MODEL-PREDICTED SPECTRAL STOKES", fill=(218, 244, 238), font=font)
    draw.text((40, 50), "24 PREDICTION ROWS / 0 MEASUREMENTS / NO DETECTOR, PIXEL, RASTER OR DENSE AUTHORITY", fill=(250, 190, 92), font=font)
    observer = (65, 105, 760, 540)
    compass = (835, 105, 1535, 540)
    spectrum = (65, 610, 1535, 905)
    for box in (observer, compass, spectrum):
        draw.rectangle(box, fill=(3, 13, 17), outline=(52, 88, 98), width=1)
    draw.text((observer[0] + 14, observer[1] + 12), "REFERENCE BAND 1E17 HZ / WALKER-PENROSE / CONTINUOUS COORDINATES", fill=(117, 181, 181), font=font)

    def observer_xy(px: float, py: float) -> tuple[float, float]:
        return (observer[0] + (px - 0.5) / 384.0 * (observer[2] - observer[0]), observer[3] - (py - 0.5) / 384.0 * (observer[3] - observer[1]))

    reference = [row for row in rows if row["observedFrequencyHz"] == 1e17 and row["transportMethod"] == "walker-penrose"]
    intensities = [row["predictedSpectralStokes"]["i"] for row in reference]
    minimum, maximum = min(intensities), max(intensities)
    for row in reference:
        x, y = observer_xy(row["continuousCoordinate"]["pixelX"], row["continuousCoordinate"]["pixelY"])
        chi = math.radians(row["evpaDeg"])
        dx, dy = math.sin(chi) * 42, -math.cos(chi) * 42
        color = colors[row["rayId"]]
        radius = 6 + 6 * (row["predictedSpectralStokes"]["i"] - minimum) / max(1e-300, maximum - minimum)
        draw.line((x - dx, y - dy, x + dx, y + dy), fill=color, width=4)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(249, 188, 88), outline=color, width=2)
        draw.text((x - 32, y + 20), row["rayId"], fill=color, font=font)
    draw.text((observer[0] + 14, observer[3] - 28), "Marker size: log-display aid from predicted I; coordinates remain non-pixel samples.", fill=(108, 151, 156), font=font)

    cx, cy, radius = (compass[0] + compass[2]) / 2, (compass[1] + compass[3]) / 2 + 8, 170
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(71, 126, 133), width=2)
    draw.line((cx - radius, cy, cx + radius, cy), fill=(43, 80, 87), width=1)
    draw.line((cx, cy - radius, cx, cy + radius), fill=(43, 80, 87), width=1)
    draw.text((compass[0] + 14, compass[1] + 12), "NORMALIZED Q/I - U/I / RADIUS 0.12 MODEL ASSUMPTION", fill=(117, 181, 181), font=font)
    for row in reference:
        x = cx + row["normalizedOrientation"]["qOverI"] / 0.12 * radius
        y = cy - row["normalizedOrientation"]["uOverI"] / 0.12 * radius
        color = colors[row["rayId"]]
        draw.line((cx, cy, x, y), fill=tuple(max(0, value - 100) for value in color), width=1)
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=color, outline=(239, 251, 247), width=1)
    for index, ray_id in enumerate(colors):
        y = compass[3] - 82 + index * 16
        draw.ellipse((compass[0] + 20, y, compass[0] + 28, y + 8), fill=colors[ray_id])
        draw.text((compass[0] + 35, y - 1), ray_id, fill=colors[ray_id], font=font)

    draw.text((spectrum[0] + 14, spectrum[1] + 12), "PREDICTED I SPECTRUM / WALKER-PENROSE / LOG10 DISPLAY", fill=(117, 181, 181), font=font)
    spectral = [row for row in rows if row["transportMethod"] == "walker-penrose"]
    all_log_i = [math.log10(row["predictedSpectralStokes"]["i"]) for row in spectral]
    log_min, log_max = min(all_log_i), max(all_log_i)
    x_positions = {1e16: spectrum[0] + 210, 1e17: (spectrum[0] + spectrum[2]) / 2, 1e18: spectrum[2] - 210}
    for frequency, x in x_positions.items():
        draw.line((x, spectrum[1] + 40, x, spectrum[3] - 45), fill=(16, 42, 48), width=1)
        draw.text((x - 25, spectrum[3] - 30), f"{frequency:.0e} Hz", fill=(95, 148, 153), font=font)
    for ray_id, color in colors.items():
        ray_rows = sorted([row for row in spectral if row["rayId"] == ray_id], key=lambda row: row["observedFrequencyHz"])
        points = []
        for row in ray_rows:
            x = x_positions[row["observedFrequencyHz"]]
            y = spectrum[3] - 55 - (math.log10(row["predictedSpectralStokes"]["i"]) - log_min) / (log_max - log_min) * (spectrum[3] - spectrum[1] - 115)
            points.append((x, y))
        draw.line(points, fill=color, width=3)
        for x, y in points:
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=color)
    legend_x, legend_y = spectrum[2] - 305, spectrum[1] + 18
    for index, (ray_id, color) in enumerate(colors.items()):
        y = legend_y + index * 17
        draw.line((legend_x, y + 4, legend_x + 22, y + 4), fill=color, width=3)
        draw.text((legend_x + 30, y), ray_id, fill=color, font=font)
    draw.text((40, 950), "MODEL PREDICTION QUALIFIED | MEASUREMENT / DETECTOR / PIXEL / RASTER / DENSE AUTHORITY UNAVAILABLE | unavailable != zero", fill=(129, 169, 169), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v423-kerr-predicted-stokes-WCS-admission-artifact-v1" or len(view.get("rows", [])) != 24 or view.get("authorityBoundary", {}).get("measurementAuthorityGranted") is not False:
        raise RuntimeError("v423-artifact-boundary")
    validate_csv(); write_fits(view); write_png(view)
    manifest = {"version": "v423-kerr-predicted-stokes-export-manifest-v1", "artifactSha256": artifact["artifactSha256"], "exports": {"json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "24-row-WCS-linked-model-predicted-Stokes-catalog"}, "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "24-row-model-predicted-I-Q-U-table"}, "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "primary-WCS-plus-predicted-Stokes-binary-table-no-image-data"}, "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "sparse-predicted-Stokes-diagnostic-not-science-raster"}}, "modelPrediction": "qualified", "measurementAuthority": "unavailable", "detectorAuthority": "unavailable", "pixelAuthority": "unavailable", "rasterAuthority": "unavailable", "circularV": "unavailable-not-modeled", "fitsImage": "unavailable-no-raster-science-values", "denseShardExecuted": False}
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v423-predicted-Stokes-products", "artifactSha256": artifact["artifactSha256"], "fits": manifest["exports"]["fits"]["semantic"], "png": manifest["exports"]["png"]["semantic"], "measurementAuthority": manifest["measurementAuthority"]}, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import csv
import hashlib
import json
import os
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-predicted-polarimeter-v424"
ARTIFACT = OUT / "predicted-ideal-dual-beam.json"
CSV_PATH = OUT / "predicted-ideal-dual-beam.csv"
FITS_PATH = OUT / "predicted-ideal-dual-beam-table.fits"
PNG_PATH = OUT / "predicted-modulation-diagnostic.png"
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
    if len(rows) != 96 or any(
        row["model_prediction"] != "true"
        or row["measurement_authority"] != "false"
        or row["photon_counts_available"] != "false"
        or row["electron_counts_available"] != "false"
        or row["measured_mueller_calibration"] != "false"
        for row in rows
    ):
        raise RuntimeError("v424-csv-boundary")


def write_fits(view: dict[str, object]) -> None:
    rows = view["modulationRows"]
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector or science raster")
    primary.header["MODPRED"] = (True, "Ideal-model modulation prediction")
    primary.header["MEASURED"] = (False, "No measurements")
    primary.header["DETECTOR"] = (False, "No detector calibration")
    primary.header["COUNTS"] = (False, "No photon or electron counts")
    primary.header["DENSE"] = (False, "Dense campaign 0/49")
    columns = [
        fits.Column(name="RAY_ID", format="8A", array=np.asarray([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="RAY_INDEX", format="J", array=np.asarray([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="FREQ_HZ", format="D", unit="Hz", array=np.asarray([row["observedFrequencyHz"] for row in rows], dtype=np.float64)),
        fits.Column(name="METHOD", format="33A", array=np.asarray([row["transportMethod"] for row in rows], dtype="S33")),
        fits.Column(name="PIXEL_X", format="D", array=np.asarray([row["continuousCoordinate"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.asarray([row["continuousCoordinate"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="HWP_INDEX", format="J", array=np.asarray([row["hwpIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="HWP_DEG", format="D", unit="deg", array=np.asarray([row["hwpAngleDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_FO", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedOrdinarySpectralRadiance"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_FE", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedExtraordinarySpectralRadiance"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_SUM", format="D", unit="W m-2 sr-1 Hz-1", array=np.asarray([row["predictedBeamSumSpectralRadiance"] for row in rows], dtype=np.float64)),
        fits.Column(name="PRED_F", format="D", array=np.asarray([row["predictedNormalizedFluxDifference"] for row in rows], dtype=np.float64)),
        fits.Column(name="MODEL", format="L", array=np.ones(96, dtype=bool)),
        fits.Column(name="MEASURED", format="L", array=np.zeros(96, dtype=bool)),
        fits.Column(name="COUNTS", format="L", array=np.zeros(96, dtype=bool)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="PREDICTED_MODULATION")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if (
            len(opened) != 2
            or opened[0].data is not None
            or opened[0].header["HASIMAGE"]
            or not opened[0].header["MODPRED"]
            or opened[0].header["MEASURED"]
            or opened[0].header["DETECTOR"]
            or opened[0].header["COUNTS"]
            or opened[0].header["DENSE"]
            or len(opened[1].data) != 96
            or np.any(opened[1].data["MEASURED"])
            or np.any(opened[1].data["COUNTS"])
        ):
            raise RuntimeError("v424-fits-boundary")


def write_png(view: dict[str, object]) -> None:
    width, height = 1600, 920
    image = Image.new("RGB", (width, height), (2, 7, 9))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    colors = {
        "disk-00": (103, 232, 249),
        "disk-01": (94, 234, 212),
        "disk-02": (190, 242, 100),
        "disk-03": (251, 191, 36),
    }
    draw.rectangle((0, 0, width - 1, height - 1), outline=(55, 96, 105), width=1)
    draw.text((42, 28), "V424 IDEAL HWP + WOLLASTON / MODEL-PREDICTED DUAL-BEAM MODULATION", fill=(218, 244, 238), font=font)
    draw.text((42, 51), "96 MODULATION ROWS / 192 PREDICTED BEAM RADIANCES / 0 MEASUREMENTS / 0 COUNTS", fill=(251, 191, 36), font=font)
    left, top, right, bottom = 70, 115, 1530, 790
    draw.rectangle((left, top, right, bottom), fill=(3, 13, 16), outline=(46, 85, 94), width=1)
    x_positions = [left + 160, left + 540, left + 920, left + 1300]
    for index, x in enumerate(x_positions):
        draw.line((x, top + 55, x, bottom - 75), fill=(18, 47, 53), width=1)
        draw.text((x - 30, bottom - 52), f"{[0, 22.5, 45, 67.5][index]} deg", fill=(105, 157, 163), font=font)
    draw.line((left + 80, (top + bottom) / 2, right - 80, (top + bottom) / 2), fill=(46, 85, 94), width=1)
    reference = [
        row for row in view["modulationRows"]
        if row["observedFrequencyHz"] == 1e17 and row["transportMethod"] == "walker-penrose"
    ]
    for ray_id, color in colors.items():
        ray_rows = sorted([row for row in reference if row["rayId"] == ray_id], key=lambda row: row["hwpIndex"])
        points = []
        for row, x in zip(ray_rows, x_positions):
            y = (top + bottom) / 2 - row["predictedNormalizedFluxDifference"] / 0.13 * (bottom - top - 150) / 2
            points.append((x, y))
        draw.line(points, fill=color, width=4)
        for x, y in points:
            draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=color, outline=(240, 253, 250), width=1)
    for index, (ray_id, color) in enumerate(colors.items()):
        y = top + 22 + index * 20
        draw.line((right - 250, y + 4, right - 224, y + 4), fill=color, width=3)
        draw.text((right - 214, y), ray_id, fill=color, font=font)
    draw.text((left + 18, top + 18), "F = (fO - fE) / (fO + fE) / 1e17 Hz / WALKER-PENROSE", fill=(117, 181, 181), font=font)
    draw.text((42, 850), "IDEAL-MODEL PREDICTION ONLY | NO MEASURED MUELLER CALIBRATION, THROUGHPUT, GAIN, NOISE, COUNTS, PIXEL OR DENSE AUTHORITY", fill=(126, 168, 171), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if (
        artifact.get("version") != "v424-kerr-predicted-ideal-dual-beam-modulation-artifact-v1"
        or len(view.get("modulationRows", [])) != 96
        or view.get("counts", {}).get("predictedBeamSpectralRadianceCount") != 192
        or view.get("authorityBoundary", {}).get("measurementAuthorityGranted") is not False
    ):
        raise RuntimeError("v424-artifact-boundary")
    validate_csv()
    write_fits(view)
    write_png(view)
    manifest = {
        "version": "v424-kerr-predicted-polarimeter-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "96-row-ideal-model-predicted-dual-beam-catalog"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "96-row-predicted-HWP-Wollaston-modulation-table"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "predicted-dual-beam-binary-table-no-image-data"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "ideal-modulation-diagnostic-not-detector-image"},
        },
        "modelPrediction": "qualified",
        "measurementAuthority": "unavailable",
        "detectorAuthority": "unavailable",
        "measuredMuellerCalibration": "unavailable",
        "throughputGainReadNoiseCovariance": "unavailable",
        "photonOrElectronCounts": "unavailable",
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({
        "status": "exported-v424-ideal-model-predicted-modulation-products",
        "artifactSha256": artifact["artifactSha256"],
        "fits": manifest["exports"]["fits"]["semantic"],
        "png": manifest["exports"]["png"]["semantic"],
        "measurementAuthority": manifest["measurementAuthority"],
    }, indent=2))


if __name__ == "__main__":
    main()

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
OUT = ROOT / "dist/science/kerr-instrument-spectral-admission-v425"
ARTIFACT = OUT / "spectral-admission.json"
CSV_PATH = OUT / "spectral-admission.csv"
FITS_PATH = OUT / "spectral-admission-table.fits"
PNG_PATH = OUT / "spectral-domain-diagnostic.png"
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
    if len(rows) != 24 or any(
        row["response_eligible"] != "false"
        or row["extrapolation_allowed"] != "false"
        or row["v413_response_matrix_applied"] != "false"
        or row["optical_HWP_Wollaston_applicability"] != "false"
        or row["measured_calibration_available"] != "false"
        or row["detector_projection_applied"] != "false"
        or row["spectral_admission_not_instrument_response"] != "true"
        for row in rows
    ):
        raise RuntimeError("v425-csv-boundary")


def write_fits(view: dict[str, object]) -> None:
    rows = view["rows"]
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No science or detector raster")
    primary.header["SPECAUD"] = (True, "Spectral applicability audit")
    primary.header["RESPAPP"] = (False, "No response matrix applied")
    primary.header["EXTRAP"] = (False, "Spectral extrapolation forbidden")
    primary.header["MEASURED"] = (False, "No measured calibration")
    primary.header["DETECTOR"] = (False, "No detector projection")
    primary.header["DENSE"] = (False, "Dense campaign 0/49")
    columns = [
        fits.Column(name="RAY_ID", format="8A", array=np.asarray([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="RAY_INDEX", format="J", array=np.asarray([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="METHOD", format="33A", array=np.asarray([row["transportMethod"] for row in rows], dtype="S33")),
        fits.Column(name="FREQ_HZ", format="D", unit="Hz", array=np.asarray([row["observedFrequencyHz"] for row in rows], dtype=np.float64)),
        fits.Column(name="WAVE_M", format="D", unit="m", array=np.asarray([row["vacuumWavelengthM"] for row in rows], dtype=np.float64)),
        fits.Column(name="WAVE_NM", format="D", unit="nm", array=np.asarray([row["vacuumWavelengthNm"] for row in rows], dtype=np.float64)),
        fits.Column(name="ENERGY_J", format="D", unit="J", array=np.asarray([row["photonEnergyJ"] for row in rows], dtype=np.float64)),
        fits.Column(name="ENERGY_EV", format="D", unit="eV", array=np.asarray([row["photonEnergyEv"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_X", format="D", array=np.asarray([row["continuousCoordinate"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="PIXEL_Y", format="D", array=np.asarray([row["continuousCoordinate"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="GAP_FACTOR", format="D", array=np.asarray([row["lowerBoundaryGapFactor"] for row in rows], dtype=np.float64)),
        fits.Column(name="ELIGIBLE", format="L", array=np.zeros(24, dtype=bool)),
        fits.Column(name="RESP_APPL", format="L", array=np.zeros(24, dtype=bool)),
        fits.Column(name="MEASURED", format="L", array=np.zeros(24, dtype=bool)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="SPECTRAL_ADMISSION")
    table.header["CALLO"] = (4e-7, "v413 lower wavelength, m")
    table.header["CALHI"] = (8e-7, "v413 upper wavelength, m")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if (
            len(opened) != 2
            or opened[0].data is not None
            or opened[0].header["HASIMAGE"]
            or not opened[0].header["SPECAUD"]
            or opened[0].header["RESPAPP"]
            or opened[0].header["EXTRAP"]
            or opened[0].header["MEASURED"]
            or opened[0].header["DETECTOR"]
            or opened[0].header["DENSE"]
            or len(opened[1].data) != 24
            or np.any(opened[1].data["ELIGIBLE"])
            or np.any(opened[1].data["RESP_APPL"])
            or np.any(opened[1].data["MEASURED"])
        ):
            raise RuntimeError("v425-fits-boundary")


def write_png(view: dict[str, object]) -> None:
    width, height = 1600, 900
    image = Image.new("RGB", (width, height), (2, 6, 8))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(61, 92, 101), width=1)
    draw.text((42, 28), "V425 SPECTRAL APPLICABILITY FIREWALL", fill=(223, 246, 241), font=font)
    draw.text((42, 51), "24 / 24 SOURCES OUTSIDE V413 400-800 NM FIXTURE DOMAIN | RESPONSE EXTRAPOLATION BLOCKED", fill=(251, 191, 36), font=font)
    left, top, right, bottom = 100, 180, 1500, 650
    draw.rectangle((left, top, right, bottom), fill=(3, 13, 16), outline=(43, 78, 87), width=1)
    log_min, log_max = -1.0, 3.0

    def x_for_nm(value: float) -> float:
        return left + 65 + (math.log10(value) - log_min) / (log_max - log_min) * (right - left - 130)

    rail_y = 430
    draw.line((left + 65, rail_y, right - 65, rail_y), fill=(87, 126, 132), width=2)
    for exponent in range(-1, 4):
        x = x_for_nm(10.0 ** exponent)
        draw.line((x, rail_y - 15, x, rail_y + 15), fill=(103, 158, 163), width=1)
        draw.text((x - 20, rail_y + 30), f"1e{exponent} nm", fill=(114, 158, 162), font=font)
    calibration_left = x_for_nm(400.0)
    calibration_right = x_for_nm(800.0)
    draw.rectangle((calibration_left, rail_y - 76, calibration_right, rail_y + 76), fill=(36, 96, 73), outline=(190, 242, 100), width=2)
    draw.text((calibration_left - 15, rail_y - 105), "V413 FIXTURE", fill=(190, 242, 100), font=font)
    draw.text((calibration_left - 15, rail_y - 86), "400-800 nm", fill=(143, 199, 151), font=font)
    colors = [(103, 232, 249), (94, 234, 212), (251, 191, 36)]
    for index, band in enumerate(view["bandSummaries"]):
        x = x_for_nm(float(band["vacuumWavelengthNm"]))
        color = colors[index]
        draw.line((x, rail_y - 145, x, rail_y + 90), fill=color, width=3)
        draw.polygon([(x, rail_y - 155), (x - 8, rail_y - 139), (x + 8, rail_y - 139)], fill=color)
        draw.text((x - 34, rail_y - 182), f"{band['vacuumWavelengthNm']:.3g} nm", fill=color, font=font)
        draw.text((x - 34, rail_y + 105), f"{band['photonEnergyEv']:.4g} eV", fill=color, font=font)
    draw.line((x_for_nm(29.9792458) + 12, rail_y - 20, calibration_left - 12, rail_y - 20), fill=(251, 191, 36), width=2)
    draw.text(((x_for_nm(29.9792458) + calibration_left) / 2 - 85, rail_y - 50), "NO CALIBRATION-DOMAIN OVERLAP", fill=(251, 191, 36), font=font)
    draw.text((left + 25, top + 24), "LOG10 VACUUM WAVELENGTH RAIL", fill=(112, 177, 181), font=font)
    draw.text((42, 740), "THE IDEAL V424 ALGEBRA REMAINS VALID AS A MODEL OPERATOR; A PHYSICAL NON-IDEAL INSTRUMENT RESPONSE IS NOT ADMITTED.", fill=(139, 181, 184), font=font)
    draw.text((42, 770), "NEXT AUTHORITY REQUIRES BAND-APPROPRIATE ARCHITECTURE, MEASURED RESPONSE/COVARIANCE, EFFECTIVE AREA, EXPOSURE AND DETECTOR PROVENANCE.", fill=(139, 181, 184), font=font)
    draw.text((42, 825), "NO MUELLER EXTRAPOLATION | NO MEASUREMENT | NO DETECTOR PROJECTION | NO COUNTS | NO PIXEL OR DENSE AUTHORITY", fill=(251, 191, 36), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if (
        artifact.get("version") != "v425-kerr-instrument-spectral-applicability-firewall-artifact-v1"
        or len(view.get("rows", [])) != 24
        or view.get("counts", {}).get("responseEligibleSourceCount") != 0
        or view.get("domains", {}).get("overlapM") is not None
    ):
        raise RuntimeError("v425-artifact-boundary")
    validate_csv()
    write_fits(view)
    write_png(view)
    manifest = {
        "version": "v425-kerr-instrument-spectral-admission-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "24-row-frequency-wavelength-energy-spectral-admission-catalog"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "24-row-spectral-domain-firewall-table"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "frequency-wavelength-energy-admission-binary-table-no-image-data"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "log-wavelength-domain-diagnostic-not-detector-image"},
        },
        "spectralApplicabilityAudit": "qualified",
        "responseEligibleSourceCount": 0,
        "responseMatrixApplicationCount": 0,
        "extrapolation": "forbidden",
        "measurementAuthority": "unavailable",
        "detectorAuthority": "unavailable",
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({
        "status": "exported-v425-spectral-applicability-products",
        "artifactSha256": artifact["artifactSha256"],
        "responseEligibleSourceCount": 0,
        "fits": manifest["exports"]["fits"]["semantic"],
        "png": manifest["exports"]["png"]["semantic"],
    }, indent=2))


if __name__ == "__main__":
    main()

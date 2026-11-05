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
OUT = ROOT / "dist/science/kerr-high-energy-response-uncertainty-v429"
ARTIFACT = OUT / "response-uncertainty.json"
ORACLE = OUT / "uncertainty-oracle.json"
PROTOCOL = OUT / "independent-validation-protocol.json"
CSV_PATH = OUT / "prediction-uncertainty-diagonal.csv"
FITS_PATH = OUT / "response-uncertainty-budget.fits"
PNG_PATH = OUT / "response-uncertainty-architecture.png"
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


def write_fits(oracle: dict[str, object]) -> None:
    expected = oracle["expected"]
    fixture = oracle["fixture"]
    counts = np.asarray(expected["predictedCounts"], dtype=np.float64)
    parameter_covariance = np.asarray(expected["parameterCovarianceContribution"], dtype=np.float64)
    redistribution_covariance = np.asarray(expected["redistributionCovarianceContribution"], dtype=np.float64)
    total_covariance = np.asarray(expected["totalCovariance"], dtype=np.float64)
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector or science image")
    primary.header["FIXTURE"] = (True, "Nonpublishable mathematical fixture")
    primary.header["OBSCOUNT"] = (0, "Observed count rows")
    primary.header["HOLDOUT"] = (0, "Measured holdout datasets")
    primary.header["MEASVAL"] = (False, "Measured validation not run")
    primary.header["AUTH"] = (False, "No measured response authority")
    primary.header["SCIAPPL"] = (0, "Science response applications")
    primary.header["DENSE"] = (False, "Dense campaign remains 0/49")
    angles = np.repeat(np.asarray(fixture["analyzerAnglesDeg"], dtype=np.float64), 6)
    channels = np.tile(np.arange(6, dtype=np.int16), 4)
    prediction = fits.BinTableHDU.from_columns([
        fits.Column(name="OBS_INDEX", format="J", array=np.arange(24, dtype=np.int32)),
        fits.Column(name="ANGLE", format="D", unit="deg", array=angles),
        fits.Column(name="CHANNEL", format="I", array=channels),
        fits.Column(name="PRED_COUNT", format="D", unit="count", array=counts),
        fits.Column(name="VAR_RESP", format="D", unit="count2", array=np.diag(parameter_covariance)),
        fits.Column(name="VAR_REDIST", format="D", unit="count2", array=np.diag(redistribution_covariance)),
        fits.Column(name="VAR_TOTAL", format="D", unit="count2", array=np.diag(total_covariance)),
        fits.Column(name="OBSERVED", format="L", array=np.zeros(24, dtype=bool)),
    ], name="PREDICTION_FIXTURE")
    covariance = fits.BinTableHDU.from_columns([
        fits.Column(name="ROW", format="J", array=np.arange(24, dtype=np.int32)),
        fits.Column(name="C_RESPONSE", format="24D", unit="count2", array=parameter_covariance),
        fits.Column(name="C_REDIST", format="24D", unit="count2", array=redistribution_covariance),
        fits.Column(name="C_TOTAL", format="24D", unit="count2", array=total_covariance),
    ], name="COVARIANCE_FIXTURE")
    covariance.header["NONPUB"] = (True, "Fixture only")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, prediction, covariance]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 3 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["OBSCOUNT"] != 0 or opened[0].header["HOLDOUT"] != 0 or opened[0].header["MEASVAL"] or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 24 or np.any(opened[1].data["OBSERVED"]) or len(opened[2].data) != 24:
            raise RuntimeError("v429-fits-boundary")


def write_png(artifact: dict[str, object]) -> None:
    view = artifact["view"]
    metrics = view["fixture"]["metrics"]
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (4, 6, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(64, 78, 101), width=1)
    draw.text((52, 32), "V429 HIGH-ENERGY RESPONSE UNCERTAINTY ENGINE", fill=(231, 238, 255), font=font)
    draw.text((52, 56), "FORWARD COUNTS + ANALYTIC JACOBIAN + FULL COVARIANCE | NO OBSERVED COUNTS / HOLDOUT / RESIDUAL CLAIM", fill=(167, 139, 250), font=font)
    stages = [("SOURCE", "flux + normalized Q/U"), ("RESPONSE", "area / modulation / angle / background"), ("REDISTRIBUTION", "6 x 6 row-stochastic matrix"), ("PREDICTION", "4 angles x 6 detector channels")]
    left, top, card_width, card_height, gap = 52, 140, 380, 220, 38
    for index, (title, subtitle) in enumerate(stages):
        x = left + index * (card_width + gap)
        draw.rectangle((x, top, x + card_width, top + card_height), fill=(7, 11, 20), outline=(80, 79, 130), width=2)
        draw.text((x + 22, top + 25), f"0{index + 1}", fill=(196, 181, 253), font=font)
        draw.text((x + 22, top + 70), title, fill=(229, 231, 255), font=font)
        draw.text((x + 22, top + 108), subtitle, fill=(151, 158, 193), font=font)
        draw.text((x + 22, top + 180), "FIXTURE MATH", fill=(125, 211, 252), font=font)
        if index < 3:
            arrow_x = x + card_width + 7
            draw.line((arrow_x, top + 110, arrow_x + gap - 14, top + 110), fill=(105, 89, 170), width=2)
            draw.polygon([(arrow_x + gap - 14, top + 104), (arrow_x + gap - 4, top + 110), (arrow_x + gap - 14, top + 116)], fill=(196, 181, 253))
    budget = (52, 425, 1110, 985)
    draw.rectangle(budget, fill=(6, 10, 17), outline=(56, 67, 92), width=1)
    draw.text((budget[0] + 24, budget[1] + 22), "UNCERTAINTY DECOMPOSITION", fill=(196, 181, 253), font=font)
    formulas = ["y = exposure x [ (flux x area x polarization) R + background ]", "C_response_out = J_response C_response J_response^T", "C_redistribution_out = SUM_b J_R,b C_R,b J_R,b^T", "C_total = C_response_out + C_redistribution_out"]
    for index, formula in enumerate(formulas):
        y = budget[1] + 78 + index * 58
        draw.text((budget[0] + 28, y), formula, fill=(167, 176, 211), font=font)
    metric_rows = [("ANALYTIC / COMPLEX-STEP J PARAM", metrics["maximumAnalyticComplexStepParameterJacobianDifference"]), ("ANALYTIC / COMPLEX-STEP J R", metrics["maximumAnalyticComplexStepRedistributionJacobianDifference"]), ("COVARIANCE SYMMETRY", metrics["maximumOutputCovarianceSymmetryAbsolute"]), ("DECOMPOSITION RESIDUAL", metrics["maximumCovarianceDecompositionResidual"]), ("PYTHON / TYPESCRIPT RELATIVE", view["fixture"]["maximumPythonRelativeDifference"])]
    for index, (label, value) in enumerate(metric_rows):
        y = budget[1] + 335 + index * 36
        draw.text((budget[0] + 28, y), label, fill=(125, 140, 169), font=font)
        draw.text((budget[0] + 690, y), f"{value:.3e}", fill=(190, 242, 100), font=font)
    authority = (1150, 425, 1748, 985)
    draw.rectangle(authority, fill=(12, 8, 4), outline=(112, 81, 34), width=1)
    draw.text((authority[0] + 24, authority[1] + 22), "VALIDATION / AUTHORITY", fill=(253, 224, 135), font=font)
    rows = [("FORWARD OPERATOR", "QUALIFIED", (190, 242, 100)), ("ANALYTIC JACOBIANS", "QUALIFIED", (190, 242, 100)), ("COVARIANCE PROPAGATION", "QUALIFIED", (190, 242, 100)), ("OBSERVED COUNTS", "0", (251, 191, 36)), ("HOLDOUT DATASETS", "0", (251, 191, 36)), ("RESIDUAL METRICS", "0", (251, 191, 36)), ("MEASURED VALIDATION", "NOT RUN", (251, 191, 36)), ("MEASURED AUTHORITY", "UNAVAILABLE", (251, 113, 133)), ("SCIENCE APPLICATIONS", "0", (251, 113, 133))]
    for index, (label, value, color) in enumerate(rows):
        y = authority[1] + 72 + index * 49
        draw.text((authority[0] + 24, y), label, fill=(143, 148, 157), font=font)
        draw.text((authority[0] + 276, y), value, fill=color, font=font)
    draw.text((52, 1030), "FIXTURE VALIDATES MATHEMATICS, NOT INSTRUMENT PERFORMANCE | INDEPENDENT MEASURED HOLDOUT REMAINS MANDATORY", fill=(151, 158, 188), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    oracle = json.loads(ORACLE.read_text(encoding="utf-8"))
    protocol = json.loads(PROTOCOL.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v429-kerr-high-energy-response-uncertainty-artifact-v1" or view.get("counts", {}).get("observedCountCount") != 0 or view.get("counts", {}).get("measuredValidationRunCount") != 0 or view.get("authorityBoundary", {}).get("measuredResponseAuthorityGranted") is not False or protocol.get("admission", {}).get("currentStatus") != "not-run-no-measured-holdout":
        raise RuntimeError("v429-artifact-boundary")
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 24 or any(row["observedCount"] != "" or row["residualApplicability"] != "unavailable-no-measured-holdout" or row["sourceKind"] != "test-fixture-nonpublishable" for row in rows):
        raise RuntimeError("v429-csv-boundary")
    write_fits(oracle)
    write_png(artifact)
    manifest = {
        "version": "v429-kerr-high-energy-response-uncertainty-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "forward-operator-uncertainty-summary-and-authority-boundary"},
            "oracle": {"path": ORACLE.name, "sha256": file_sha(ORACLE), "semantic": "nonpublishable-full-mathematical-fixture-oracle"},
            "protocol": {"path": PROTOCOL.name, "sha256": file_sha(PROTOCOL), "semantic": "independent-measured-holdout-validation-protocol-not-run"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "prediction-and-uncertainty-diagonal-fixture-no-observations"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "response-and-redistribution-covariance-budget-fixture-only"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "response-uncertainty-architecture-not-detector-image"},
        },
        "predictedCountCount": 24,
        "observedCountCount": 0,
        "measuredHoldoutDatasetCount": 0,
        "measuredValidationRunCount": 0,
        "residualMetricCount": 0,
        "measuredResponseAuthority": "unavailable",
        "scienceResponseApplicationCount": 0,
        "detectorCountProduct": "fixture-prediction-only-not-measured",
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v429-response-uncertainty", "artifactSha256": artifact["artifactSha256"], "predictedCounts": 24, "observedCounts": 0, "measuredValidationRuns": 0, "residualMetrics": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

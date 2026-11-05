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
OUT = ROOT / "dist/science/kerr-high-energy-likelihood-stress-v431"
ARTIFACT = OUT / "likelihood-stress.json"
ORACLE = OUT / "likelihood-stress-oracle.json"
CONTRACT = OUT / "likelihood-stress-contract.json"
CSV_PATH = OUT / "likelihood-stress-scenarios.csv"
FITS_PATH = OUT / "likelihood-stress-summary.fits"
PNG_PATH = OUT / "likelihood-stress-map.png"
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


def write_fits(artifact: dict[str, object]) -> None:
    scenarios = artifact["view"]["scenarios"]
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector image")
    primary.header["FIXTURE"] = (True, "Fixed-seed synthetic stress")
    primary.header["SCENARIO"] = (6, "Synthetic stress scenarios")
    primary.header["CALREPL"] = (1536, "Synthetic calibration replicates")
    primary.header["HLDREPL"] = (1536, "Synthetic holdout replicates")
    primary.header["MEASURED"] = (False, "No measured counts")
    primary.header["MEASVAL"] = (False, "Measured validation not run")
    primary.header["ALTLQUAL"] = (0, "Qualified alternative likelihoods")
    primary.header["AUTH"] = (False, "No measured authority")
    primary.header["SCIAPPL"] = (0, "Science applications")
    primary.header["DENSE"] = (False, "Dense remains 0/49")
    table = fits.BinTableHDU.from_columns([
        fits.Column(name="SCENARIO", format="40A", array=np.asarray([item["id"] for item in scenarios], dtype="S40")),
        fits.Column(name="FAMILY", format="40A", array=np.asarray([item["requiredLikelihoodFamily"] for item in scenarios], dtype="S40")),
        fits.Column(name="POISSON", format="L", array=np.asarray([item["poissonAdmissibleByProvenance"] for item in scenarios], dtype=bool)),
        fits.Column(name="COVER90", format="D", array=np.asarray([item["holdoutMetrics"]["poissonPredictiveCoverage90"] for item in scenarios], dtype=np.float64)),
        fits.Column(name="VAR_RATIO", format="D", array=np.asarray([item["holdoutMetrics"]["meanVarianceToPoissonRatio"] for item in scenarios], dtype=np.float64)),
        fits.Column(name="OFFCORR", format="D", array=np.asarray([item["holdoutMetrics"]["meanAbsoluteOffDiagonalResidualCorrelation"] for item in scenarios], dtype=np.float64)),
        fits.Column(name="MAX_BIAS", format="D", array=np.asarray([item["holdoutMetrics"]["maximumAbsoluteStandardizedMeanBias"] for item in scenarios], dtype=np.float64)),
        fits.Column(name="CHAN_Z", format="D", array=np.asarray([item["holdoutMetrics"]["maximumAbsoluteMeanChannelClosureZ"] for item in scenarios], dtype=np.float64)),
        fits.Column(name="MEASAUTH", format="L", array=np.zeros(6, dtype=bool)),
    ], name="SYNTHETIC_STRESS")
    table.header["NONPUB"] = (True, "Fixture only")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["SCENARIO"] != 6 or opened[0].header["MEASURED"] or opened[0].header["MEASVAL"] or opened[0].header["ALTLQUAL"] != 0 or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 6 or np.any(opened[1].data["MEASAUTH"]):
            raise RuntimeError("v431-fits-boundary")


def write_png(artifact: dict[str, object]) -> None:
    scenarios = artifact["view"]["scenarios"]
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (4, 7, 9))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(59, 83, 88), width=1)
    draw.text((52, 30), "V431 PREREGISTERED LIKELIHOOD STRESS ROUTING FIREWALL", fill=(224, 247, 246), font=font)
    draw.text((52, 54), "6 FIXED-SEED SYNTHETIC SCENARIOS | RESIDUALS AUDIT BUT NEVER SELECT LIKELIHOOD FAMILY", fill=(52, 211, 190), font=font)
    labels = ["NOMINAL", "OVERDISP", "CORRELATED", "BG MIXTURE", "DEAD TIME", "PILEUP"]
    panel = (52, 118, 1748, 770)
    draw.rectangle(panel, fill=(3, 14, 17), outline=(40, 87, 91), width=1)
    chart_left, chart_top, chart_width, chart_height = 105, 205, 1570, 430
    draw.line((chart_left, chart_top + chart_height, chart_left + chart_width, chart_top + chart_height), fill=(81, 111, 113), width=1)
    draw.line((chart_left, chart_top, chart_left, chart_top + chart_height), fill=(81, 111, 113), width=1)
    for index, scenario in enumerate(scenarios):
        metrics = scenario["holdoutMetrics"]
        x = chart_left + index * 255 + 42
        coverage_height = metrics["poissonPredictiveCoverage90"] * chart_height
        variance_height = min(chart_height, metrics["meanVarianceToPoissonRatio"] / 10.0 * chart_height)
        color = (190, 242, 100) if scenario["poissonAdmissibleByProvenance"] else (251, 113, 133)
        draw.rectangle((x, chart_top + chart_height - coverage_height, x + 72, chart_top + chart_height), fill=color)
        draw.rectangle((x + 82, chart_top + chart_height - variance_height, x + 154, chart_top + chart_height), fill=(80, 190, 211))
        draw.text((x - 4, chart_top + chart_height + 22), labels[index], fill=(160, 189, 190), font=font)
        draw.text((x, chart_top + chart_height - coverage_height - 20), f"C {metrics['poissonPredictiveCoverage90']:.3f}", fill=color, font=font)
        draw.text((x + 82, chart_top + chart_height - variance_height - 20), f"V {metrics['meanVarianceToPoissonRatio']:.2f}", fill=(125, 211, 252), font=font)
    draw.text((105, 151), "POISSON 90% COVERAGE", fill=(190, 242, 100), font=font)
    draw.text((310, 151), "VARIANCE / POISSON", fill=(125, 211, 252), font=font)
    draw.text((52, 810), "ROUTING AUTHORITY", fill=(253, 224, 135), font=font)
    cards = [
        ("NOMINAL POISSON", "RETAIN", (190, 242, 100)),
        ("STRESSED POISSON", "5 / 5 REJECT BEFORE FIT", (251, 113, 133)),
        ("ALTERNATIVE LIKELIHOODS", "0 QUALIFIED", (251, 191, 36)),
        ("MEASURED COUNTS", "0", (251, 191, 36)),
        ("INSTRUMENT AUTHORITY", "UNAVAILABLE", (251, 113, 133)),
    ]
    for index, (label, value, color) in enumerate(cards):
        x = 52 + index * 339
        draw.rectangle((x, 845, x + 310, 965), fill=(10, 9, 6), outline=(90, 72, 36), width=1)
        draw.text((x + 18, 868), label, fill=(142, 151, 149), font=font)
        draw.text((x + 18, 913), value, fill=color, font=font)
    draw.text((52, 1030), "SIMULATED STRESS DISCRIMINATION IS NOT ALTERNATIVE-LIKELIHOOD VALIDATION OR INSTRUMENT PERFORMANCE", fill=(133, 174, 171), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    oracle = json.loads(ORACLE.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v431-kerr-high-energy-likelihood-stress-artifact-v1" or len(view.get("scenarios", [])) != 6 or view.get("counts", {}).get("measuredObservedCountCount") != 0 or view.get("counts", {}).get("alternativeLikelihoodImplementationQualifiedCount") != 0 or view.get("authorityBoundary", {}).get("measuredInstrumentPerformanceAuthorityGranted") is not False or contract.get("postHocLikelihoodSwitchForbidden") is not True:
        raise RuntimeError("v431-artifact-boundary")
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 6 or any(row["measuredAuthority"] != "unavailable" or row["alternativeLikelihoodImplementationAuthority"] != "not-qualified" or row["sourceKind"] != "fixed-seed-simulated-stress-nonpublishable" for row in rows):
        raise RuntimeError("v431-csv-boundary")
    if oracle.get("counts", {}).get("syntheticCountCellCount") != 73728 or oracle.get("counts", {}).get("measuredObservedCountCount") != 0:
        raise RuntimeError("v431-oracle-boundary")
    write_fits(artifact)
    write_png(artifact)
    manifest = {
        "version": "v431-kerr-high-energy-likelihood-stress-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "stress-summary-routing-and-authority-boundary"},
            "oracle": {"path": ORACLE.name, "sha256": file_sha(ORACLE), "semantic": "full-fixed-seed-synthetic-stress-holdout-oracle"},
            "contract": {"path": CONTRACT.name, "sha256": file_sha(CONTRACT), "semantic": "preregistered-provenance-first-likelihood-routing-contract"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "six-scenario-synthetic-stress-diagnostics"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "synthetic-stress-summary-no-detector-image"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "likelihood-stress-routing-map-not-instrument-performance"},
        },
        "scenarioCount": 6,
        "syntheticCountCellCount": 73728,
        "measuredObservedCountCount": 0,
        "measuredHoldoutDatasetCount": 0,
        "measuredResidualMetricCount": 0,
        "measuredValidationRunCount": 0,
        "alternativeLikelihoodImplementationQualifiedCount": 0,
        "measuredResponseAuthority": "unavailable",
        "scienceResponseApplicationCount": 0,
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v431-likelihood-stress", "artifactSha256": artifact["artifactSha256"], "scenarios": 6, "syntheticCountCells": 73728, "measuredObservedCounts": 0, "alternativeLikelihoodImplementations": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

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
OUT = ROOT / "dist/science/kerr-high-energy-likelihood-authority-v432"
ARTIFACT = OUT / "likelihood-authority.json"
ORACLE = OUT / "likelihood-authority-oracle.json"
CONTRACT = OUT / "likelihood-authority-contract.json"
CSV_PATH = OUT / "likelihood-authority-families.csv"
FITS_PATH = OUT / "likelihood-authority-summary.fits"
PNG_PATH = OUT / "likelihood-authority-map.png"
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
    families = artifact["view"]["families"]
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector image")
    primary.header["FIXTURE"] = (True, "Fixed-seed synthetic authority")
    primary.header["FAMILY"] = (2, "Candidate likelihood families")
    primary.header["CALREPL"] = (512, "Synthetic calibration replicates")
    primary.header["HLDREPL"] = (512, "Synthetic holdout replicates")
    primary.header["ALTQUAL"] = (2, "Synthetic-qualified alternative families")
    primary.header["MEASURED"] = (False, "No measured counts")
    primary.header["MEASVAL"] = (False, "Measured validation not run")
    primary.header["AUTH"] = (False, "No measured authority")
    primary.header["SCIAPPL"] = (0, "Science applications")
    primary.header["DENSE"] = (False, "Dense remains 0/49")
    table = fits.BinTableHDU.from_columns([
        fits.Column(name="FAMILY", format="24A", array=np.asarray([item["generatingFamily"] for item in families], dtype="S24")),
        fits.Column(name="CORRECT", format="24A", array=np.asarray([item["correctCandidate"]["model"] for item in families], dtype="S24")),
        fits.Column(name="TRUEPAR", format="D", array=np.asarray([item["trueParameter"] for item in families], dtype=np.float64)),
        fits.Column(name="FITPAR", format="D", array=np.asarray([item["correctCandidate"]["fittedParameter"] for item in families], dtype=np.float64)),
        fits.Column(name="RELERR", format="D", array=np.asarray([item["correctCandidate"]["relativeParameterError"] for item in families], dtype=np.float64)),
        fits.Column(name="COVER90", format="D", array=np.asarray([item["correctCandidate"]["coverage90"] for item in families], dtype=np.float64)),
        fits.Column(name="AICDELTA", format="D", array=np.asarray([item["correctCandidate"]["deltaAicVsPoisson"] for item in families], dtype=np.float64)),
        fits.Column(name="SELECTDL", format="D", array=np.asarray([item["selectionDeltaLogLikelihood"] for item in families], dtype=np.float64)),
        fits.Column(name="MEASAUTH", format="L", array=np.zeros(2, dtype=bool)),
    ], name="SYNTHETIC_AUTHORITY")
    table.header["NONPUB"] = (True, "Fixture only")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["FAMILY"] != 2 or opened[0].header["ALTQUAL"] != 2 or opened[0].header["MEASURED"] or opened[0].header["MEASVAL"] or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 2 or np.any(opened[1].data["MEASAUTH"]):
            raise RuntimeError("v432-fits-boundary")


def write_png(artifact: dict[str, object]) -> None:
    families = artifact["view"]["families"]
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (4, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(63, 83, 93), width=1)
    draw.text((52, 30), "V432 ALTERNATIVE LIKELIHOOD AUTHORITY", fill=(228, 249, 247), font=font)
    draw.text((52, 54), "NEGATIVE-BINOMIAL + SHARED-LATENT POISSON-LOGNORMAL | PARAMETER RECOVERY / HOLDOUT SELECTION", fill=(45, 212, 191), font=font)
    colors = [(190, 242, 100), (125, 211, 252)]
    cards = [("NEGATIVE-BINOMIAL", "alpha", families[0]), ("POISSON-LOGNORMAL", "sigma", families[1])]
    for index, (title, parameter, family) in enumerate(cards):
        x = 92 + index * 845
        draw.rectangle((x, 142, x + 730, 720), fill=(4, 15, 18), outline=(47, 100, 103), width=2)
        draw.text((x + 30, 174), title, fill=(204, 251, 241), font=font)
        draw.text((x + 30, 210), f"parameter {parameter} · fitted {family['correctCandidate']['fittedParameter']:.8g} · true {family['trueParameter']:.8g}", fill=colors[index], font=font)
        draw.text((x + 30, 260), f"relative error {family['correctCandidate']['relativeParameterError']:.4f}", fill=(142, 177, 177), font=font)
        draw.text((x + 30, 298), f"holdout coverage 90% {family['correctCandidate']['coverage90']:.4f}", fill=(142, 177, 177), font=font)
        draw.text((x + 30, 336), f"ΔAIC vs Poisson {family['correctCandidate']['deltaAicVsPoisson']:.2f}", fill=(142, 177, 177), font=font)
        draw.text((x + 30, 374), f"correct − wrong log L {family['selectionDeltaLogLikelihood']:.2f}", fill=(142, 177, 177), font=font)
        draw.rectangle((x + 30, 450, x + 670, 496), fill=(8, 29, 30), outline=(46, 105, 103), width=1)
        draw.rectangle((x + 30, 450, x + 670 * min(1.0, family['correctCandidate']['coverage90']), 496), fill=colors[index])
        draw.text((x + 30, 545), "SYNTHETIC AUTHORITY QUALIFIED", fill=(190, 242, 100), font=font)
        draw.text((x + 30, 580), "instrument authority: unavailable", fill=(251, 113, 133), font=font)
    rows = [("PARAMETER RECOVERY", "2 / 2", (190, 242, 100)), ("HOLDOUT SELECTION", "2 / 2", (190, 242, 100)), ("ALTERNATIVE LIKELIHOODS", "2 QUALIFIED · SYNTHETIC ONLY", (125, 211, 252)), ("MEASURED COUNTS", "0", (251, 191, 36)), ("DENSE CAMPAIGN", "0 / 49", (251, 191, 36))]
    for index, (label, value, color) in enumerate(rows):
        x = 52 + index * 339
        draw.rectangle((x, 820, x + 310, 940), fill=(10, 9, 7), outline=(91, 73, 38), width=1)
        draw.text((x + 18, 845), label, fill=(142, 153, 151), font=font)
        draw.text((x + 18, 892), value, fill=color, font=font)
    draw.text((52, 1026), "SYNTHETIC PARAMETER RECOVERY IS NOT MEASURED GOODNESS-OF-FIT OR INSTRUMENT PERFORMANCE", fill=(133, 177, 172), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    oracle = json.loads(ORACLE.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v432-kerr-high-energy-likelihood-authority-artifact-v1" or len(view.get("families", [])) != 2 or view.get("counts", {}).get("alternativeLikelihoodImplementationQualifiedCount") != 2 or view.get("counts", {}).get("measuredObservedCountCount") != 0 or view.get("authorityBoundary", {}).get("alternativeLikelihoodImplementationAuthorityGranted") is not True or view.get("authorityBoundary", {}).get("measuredInstrumentPerformanceAuthorityGranted") is not False or contract.get("postHocLikelihoodSwitchForbidden") is not True:
        raise RuntimeError("v432-artifact-boundary")
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 2 or any(row["measuredAuthority"] != "unavailable" or row["alternativeLikelihoodAuthority"] != "qualified-synthetic-only" or row["sourceKind"] != "fixed-seed-likelihood-authority-nonpublishable" for row in rows):
        raise RuntimeError("v432-csv-boundary")
    if oracle.get("counts", {}).get("candidateFamilyCount") != 2 or oracle.get("counts", {}).get("alternativeLikelihoodImplementationQualifiedCount") != 2 or oracle.get("counts", {}).get("measuredObservedCountCount") != 0:
        raise RuntimeError("v432-oracle-boundary")
    write_fits(artifact)
    write_png(artifact)
    manifest = {"version": "v432-kerr-high-energy-likelihood-authority-export-manifest-v1", "artifactSha256": artifact["artifactSha256"], "exports": {"json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "authority-summary-selection-and-boundary"}, "oracle": {"path": ORACLE.name, "sha256": file_sha(ORACLE), "semantic": "full-synthetic-parameter-recovery-and-holdout-authority-fixture"}, "contract": {"path": CONTRACT.name, "sha256": file_sha(CONTRACT), "semantic": "preregistered-candidate-and-quadrature-contract"}, "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "family-recovery-and-selection-diagnostics"}, "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "synthetic-likelihood-authority-summary-no-detector-image"}, "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "likelihood-authority-map-not-instrument-performance"}}, "candidateFamilyCount": 2, "syntheticCountCellCount": 24576, "parameterRecoveryResultCount": 2, "holdoutSelectionResultCount": 2, "alternativeLikelihoodImplementationQualifiedCount": 2, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "measuredResidualMetricCount": 0, "measuredValidationRunCount": 0, "measuredResponseAuthority": "unavailable", "scienceResponseApplicationCount": 0, "pixelRasterAuthority": "unavailable", "denseShardExecuted": False}
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v432-likelihood-authority", "artifactSha256": artifact["artifactSha256"], "candidateFamilies": 2, "syntheticCountCells": 24576, "parameterRecoveryResults": 2, "holdoutSelections": 2, "alternativeLikelihoodImplementations": 2, "measuredObservedCounts": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

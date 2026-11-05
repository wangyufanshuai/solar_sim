from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-joint-nuisance-v433"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "joint-nuisance.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "joint-nuisance-oracle.json").read_text(encoding="utf-8"))
    contract = json.loads((OUT / "joint-nuisance-contract.json").read_text(encoding="utf-8"))
    boundary = json.loads((OUT / "science-boundary.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    if artifact["artifactSha256"] != "637542a0666f9396b3013fc3664df304f4d91c1564dcb2df268b15e05e44eaf4":
        raise RuntimeError("v433-artifact-canonical-sha-lock")
    if len(view["families"]) != 2 or view["model"]["covarianceDimension"] != 24 or view["model"]["responseLikelihoodIndependentBySyntheticConstruction"] is not True or view["model"]["measuredCrossBlockIndependenceAvailable"] is not False:
        raise RuntimeError("v433-model-boundary")
    for family in view["families"]:
        metrics = family["metrics"]
        monte_carlo = family["monteCarlo"]["metrics"]
        if metrics["jointMinimumEigenvalue"] <= 0 or metrics["jointEffectiveRank"] != 24 or metrics["jointDecompositionMaximumAbsoluteResidual"] >= 1e-6 or metrics["jointSymmetryMaximumAbsolute"] >= 1e-6 or family["maximumPythonRelativeDifference"] >= 1e-8 or monte_carlo["relativeFrobeniusCovarianceDifference"] >= 0.08 or monte_carlo["maximumRelativeDiagonalDifference"] >= 0.12 or monte_carlo["responseLikelihoodCrossBlockRelativeFrobenius"] >= 0.08:
            raise RuntimeError(f"v433-family-gate:{family['family']}")
    counts = view["counts"]
    if counts != {"familyCount": 2, "covarianceDimension": 24, "covarianceElementCount": 11520, "groupUncertaintyCount": 20, "monteCarloDrawCount": 16384, "measuredObservedCountCount": 0, "measuredHoldoutDatasetCount": 0, "measuredResidualMetricCount": 0, "measuredValidationRunCount": 0, "measuredResponseAuthorityCount": 0, "measuredLikelihoodAuthorityCount": 0, "scienceResponseApplicationCount": 0}:
        raise RuntimeError("v433-count-boundary")
    authority = view["authorityBoundary"]
    if authority["jointNuisanceAnalyticMathAuthorityGranted"] is not True or authority["monteCarloCrossValidationAuthorityGranted"] is not True or authority["syntheticFactorizationAuthorityGranted"] is not True or authority["measuredCrossBlockIndependenceAuthorityGranted"] is not False or authority["measuredResponseAuthorityGranted"] is not False or authority["measuredLikelihoodAuthorityGranted"] is not False or authority["scienceAdmissionGranted"] is not False or authority["scienceResponseApplicationCount"] != 0 or authority["denseAuthorityGranted"] is not False:
        raise RuntimeError("v433-authority-boundary")
    if contract["factorization"]["measuredIndependenceProofAvailable"] is not False or contract["factorization"]["measuredCrossCovarianceStatus"] != "unavailable" or contract["scienceAdmission"]["currentStatus"] != "not-admitted-no-measured-response-or-likelihood-authority" or boundary["status"] != "implemented-not-admitted" or boundary["admitted"] is not False or boundary["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v433-science-admission-boundary")
    if len(oracle["families"]) != 2 or any(np.asarray(family["analytic"]["jointCovariance"]).shape != (24, 24) or family["monteCarlo"]["drawCount"] != 8192 for family in oracle["families"]):
        raise RuntimeError("v433-oracle-shape")
    with (OUT / "joint-nuisance-diagonal.csv").open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 48 or any(row["scienceAdmitted"] != "false" or row["measuredAuthority"] != "unavailable" or row["sourceKind"] != "fixed-seed-synthetic-joint-nuisance-nonpublishable" for row in rows):
        raise RuntimeError("v433-csv-boundary")
    with fits.open(OUT / "joint-nuisance-covariance.fits") as opened:
        if len(opened) != 4 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["FAMILY"] != 2 or opened[0].header["COVDIM"] != 24 or opened[0].header["ADMITTED"] or opened[0].header["MEASRESP"] or opened[0].header["MEASLIKE"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 48 or np.any(opened[1].data["ADMITTED"]) or opened[2].data.shape != (24, 24) or opened[3].data.shape != (24, 24):
            raise RuntimeError("v433-fits-boundary")
    with Image.open(OUT / "joint-nuisance-budget.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v433-png-boundary")
    if set(exports["exports"]) != {"json", "oracle", "contract", "boundary", "csv", "fits", "png"}:
        raise RuntimeError("v433-export-whitelist")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v433-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v433-python-joint-nuisance", "families": 2, "covarianceDimension": 24, "monteCarloDraws": 16384, "scienceBoundary": "implemented-not-admitted", "measuredResponseAuthority": "unavailable", "measuredLikelihoodAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

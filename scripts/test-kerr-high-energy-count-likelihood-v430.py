from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-count-likelihood-v430"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "count-likelihood.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "count-likelihood-oracle.json").read_text(encoding="utf-8"))
    contract = json.loads((OUT / "likelihood-contract.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    counts = view["counts"]
    authority = view["authorityBoundary"]
    if counts["fixturePredictedCountCount"] != 24 or counts["fixtureSimulatedCountCount"] != 24 or counts["measuredObservedCountCount"] != 0 or counts["measuredHoldoutDatasetCount"] != 0 or counts["measuredResidualMetricCount"] != 0 or counts["measuredValidationRunCount"] != 0 or counts["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v430-count-boundary")
    if authority["likelihoodMathAuthorityGranted"] is not True or authority["residualMathAuthorityGranted"] is not True or authority["whiteningMathAuthorityGranted"] is not True or authority["fixtureGoodnessOfFitAuthorityGranted"] is not False or authority["measuredLikelihoodAuthorityGranted"] is not False or authority["measuredResidualClosureAuthorityGranted"] is not False or authority["measuredResponseAuthorityGranted"] is not False or authority["scienceProjectionAuthorityGranted"] is not False or authority["denseAuthorityGranted"] is not False:
        raise RuntimeError("v430-authority-boundary")
    metrics = oracle["diagnostics"]["metrics"]
    if metrics["maximumMahalanobisIdentityDifference"] >= 1e-8 or metrics["predictiveCovarianceSymmetryAbsolute"] >= 1e-6 or metrics["minimumPredictiveCovarianceEigenvalue"] <= 0 or metrics["effectiveCovarianceRank"] != 24 or metrics["maximumDeterministicReplayCountDifference"] != 0:
        raise RuntimeError("v430-metric-boundary")
    if contract["admission"]["currentStatus"] != "not-run-no-measured-holdout" or contract["admission"]["measuredAuthorityGranted"] is not False or contract["inferencePolicy"]["postHocLikelihoodSwitchForbidden"] is not True:
        raise RuntimeError("v430-contract-boundary")
    with (OUT / "simulated-residual-diagnostics.csv").open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 24 or any(row["measuredObservedCount"] != "" or row["measuredResidualApplicability"] != "unavailable-no-measured-holdout" or row["sourceKind"] != "simulated-counts-fixed-seed-nonpublishable" for row in rows):
        raise RuntimeError("v430-csv-boundary")
    with fits.open(OUT / "simulated-residual-diagnostics.fits") as opened:
        if len(opened) != 3 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["MEASURED"] or opened[0].header["HOLDOUT"] or opened[0].header["MEASVAL"] or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 24 or np.any(opened[1].data["MEASURED"]):
            raise RuntimeError("v430-fits-boundary")
    with Image.open(OUT / "count-likelihood-architecture.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v430-png-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v430-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v430-python-count-likelihood", "simulatedCounts": 24, "measuredObservedCounts": 0, "measuredResidualMetrics": 0, "measuredValidationRuns": 0, "measuredAuthority": "unavailable", "scienceApplications": 0, "mahalanobisIdentityDifference": metrics["maximumMahalanobisIdentityDifference"], "effectiveRank": metrics["effectiveCovarianceRank"]}, indent=2))


if __name__ == "__main__":
    main()

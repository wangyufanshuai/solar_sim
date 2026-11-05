from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-likelihood-authority-v432"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "likelihood-authority.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "likelihood-authority-oracle.json").read_text(encoding="utf-8"))
    contract = json.loads((OUT / "likelihood-authority-contract.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    families = view["families"]
    if len(families) != 2 or any(item["correctCandidate"]["relativeParameterError"] >= 0.15 or not 0.87 <= item["correctCandidate"]["coverage90"] <= 0.93 or item["correctCandidate"]["deltaAicVsPoisson"] <= 100 or item["selectionDeltaLogLikelihood"] <= 20 or item["correctCandidate"]["maximumPythonRelativeDifference"] >= 1e-8 or item["wrongCandidate"]["maximumPythonRelativeDifference"] >= 1e-8 for item in families):
        raise RuntimeError("v432-family-gate")
    if contract["selectionMetric"] != "independent-holdout-log-likelihood-with-one-parameter-AIC-penalty" or contract["selectionBeforeScienceUse"] is not True or contract["residualDiagnosticsMayAuditButNeverSelectFamily"] is not True or contract["postHocLikelihoodSwitchForbidden"] is not True or contract["alternativeLikelihoodImplementationsQualified"] != ["negative-binomial", "poisson-lognormal"] or contract["measuredAuthorityGranted"] is not False:
        raise RuntimeError("v432-contract-boundary")
    counts = view["counts"]
    authority = view["authorityBoundary"]
    if counts["candidateFamilyCount"] != 2 or counts["syntheticCountCellCount"] != 24576 or counts["parameterRecoveryResultCount"] != 2 or counts["holdoutSelectionResultCount"] != 2 or counts["alternativeLikelihoodImplementationQualifiedCount"] != 2 or counts["measuredObservedCountCount"] != 0 or counts["measuredHoldoutDatasetCount"] != 0 or counts["measuredResidualMetricCount"] != 0 or counts["measuredValidationRunCount"] != 0 or counts["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v432-count-boundary")
    if authority["negativeBinomialMathAuthorityGranted"] is not True or authority["poissonLognormalMathAuthorityGranted"] is not True or authority["parameterRecoveryAuthorityGranted"] is not True or authority["coverageAuthorityGranted"] is not True or authority["holdoutSelectionAuthorityGranted"] is not True or authority["modelMisspecificationDiscriminatorAuthorityGranted"] is not True or authority["alternativeLikelihoodImplementationAuthorityGranted"] is not True or authority["fixturePerformanceAuthorityGranted"] is not False or authority["measuredLikelihoodAuthorityGranted"] is not False or authority["measuredInstrumentPerformanceAuthorityGranted"] is not False or authority["measuredResponseAuthorityGranted"] is not False or authority["scienceProjectionAuthorityGranted"] is not False or authority["denseAuthorityGranted"] is not False:
        raise RuntimeError("v432-authority-boundary")
    if oracle["counts"]["candidateFamilyCount"] != 2 or oracle["counts"]["alternativeLikelihoodImplementationQualifiedCount"] != 2 or oracle["counts"]["measuredObservedCountCount"] != 0 or len(oracle["prediction"]["predictedCounts"]) != 24 or any(len(item["calibrationCounts"]) != 256 or len(item["holdoutCounts"]) != 256 for item in oracle["campaign"]["families"]):
        raise RuntimeError("v432-oracle-shape")
    with (OUT / "likelihood-authority-families.csv").open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 2 or any(row["measuredAuthority"] != "unavailable" or row["alternativeLikelihoodAuthority"] != "qualified-synthetic-only" or row["sourceKind"] != "fixed-seed-likelihood-authority-nonpublishable" for row in rows):
        raise RuntimeError("v432-csv-boundary")
    with fits.open(OUT / "likelihood-authority-summary.fits") as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["FAMILY"] != 2 or opened[0].header["ALTQUAL"] != 2 or opened[0].header["MEASURED"] or opened[0].header["MEASVAL"] or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 2 or np.any(opened[1].data["MEASAUTH"]):
            raise RuntimeError("v432-fits-boundary")
    with Image.open(OUT / "likelihood-authority-map.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v432-png-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v432-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v432-python-likelihood-authority", "candidateFamilies": 2, "parameterRecoveryResults": 2, "holdoutSelections": 2, "alternativeLikelihoodImplementations": 2, "measuredObservedCounts": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

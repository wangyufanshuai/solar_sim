from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-likelihood-stress-v431"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "likelihood-stress.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "likelihood-stress-oracle.json").read_text(encoding="utf-8"))
    contract = json.loads((OUT / "likelihood-stress-contract.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    scenarios = view["scenarios"]
    if len(scenarios) != 6 or sum(item["expectedPoissonDisposition"] == "retain" for item in scenarios) != 1 or sum(item["expectedPoissonDisposition"] == "reject-before-fit" for item in scenarios) != 5:
        raise RuntimeError("v431-routing-boundary")
    if contract["selectionBasis"] != "acquisition-provenance-and-preregistered-assumption-state-before-residual-fit" or contract["postHocLikelihoodSwitchForbidden"] is not True or contract["residualDiagnosticsMayAuditButNeverSelectFamily"] is not True or contract["alternativeLikelihoodImplementationsQualified"] != [] or contract["measuredAuthorityGranted"] is not False:
        raise RuntimeError("v431-contract-boundary")
    counts = view["counts"]
    authority = view["authorityBoundary"]
    if counts["syntheticCountCellCount"] != 73728 or counts["measuredObservedCountCount"] != 0 or counts["measuredHoldoutDatasetCount"] != 0 or counts["measuredResidualMetricCount"] != 0 or counts["measuredValidationRunCount"] != 0 or counts["alternativeLikelihoodImplementationQualifiedCount"] != 0 or counts["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v431-count-boundary")
    if authority["stressGenerationMathAuthorityGranted"] is not True or authority["discriminatorMathAuthorityGranted"] is not True or authority["preregisteredRoutingFirewallAuthorityGranted"] is not True or authority["alternativeLikelihoodImplementationAuthorityGranted"] is not False or authority["fixturePerformanceAuthorityGranted"] is not False or authority["measuredLikelihoodAuthorityGranted"] is not False or authority["measuredInstrumentPerformanceAuthorityGranted"] is not False or authority["measuredResponseAuthorityGranted"] is not False or authority["scienceProjectionAuthorityGranted"] is not False or authority["denseAuthorityGranted"] is not False:
        raise RuntimeError("v431-authority-boundary")
    if max(item["maximumPythonRelativeDifference"] for item in scenarios) >= 1e-8 or any(not item["calibrationGatePassed"] or not item["holdoutGatePassed"] or not item["deterministicReplayPassed"] for item in scenarios):
        raise RuntimeError("v431-cross-validation-boundary")
    if oracle["counts"]["syntheticCountCellCount"] != 73728 or sum(len(row) for scenario in oracle["campaign"]["results"] for row in scenario["holdoutCounts"]) != 36864:
        raise RuntimeError("v431-oracle-shape")
    with (OUT / "likelihood-stress-scenarios.csv").open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 6 or any(row["measuredAuthority"] != "unavailable" or row["alternativeLikelihoodImplementationAuthority"] != "not-qualified" or row["sourceKind"] != "fixed-seed-simulated-stress-nonpublishable" for row in rows):
        raise RuntimeError("v431-csv-boundary")
    with fits.open(OUT / "likelihood-stress-summary.fits") as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["SCENARIO"] != 6 or opened[0].header["MEASURED"] or opened[0].header["MEASVAL"] or opened[0].header["ALTLQUAL"] != 0 or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 6 or np.any(opened[1].data["MEASAUTH"]):
            raise RuntimeError("v431-fits-boundary")
    with Image.open(OUT / "likelihood-stress-map.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v431-png-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v431-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v431-python-likelihood-stress", "scenarios": 6, "syntheticCountCells": 73728, "nominalPoissonRetained": 1, "stressedPoissonRejectedBeforeFit": 5, "alternativeLikelihoodImplementations": 0, "measuredObservedCounts": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

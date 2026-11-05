from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-measured-admission-v434"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024): digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "measured-admission.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "measured-admission-oracle.json").read_text(encoding="utf-8"))
    contract = json.loads((OUT / "measured-admission-contract.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    if artifact["artifactSha256"] != "69dbaa22ab9840450cf669aed0b8563f159ce2fa32df7ad49e74cf40628a19ae": raise RuntimeError("v434-artifact-lock")
    if view["gates"]["requiredGateCount"] != 9 or view["gates"]["passedFixtureGateCount"] != 8 or view["gates"]["independentReviewStatus"] != "not-run" or view["fixture"]["mutationCount"] != 12 or view["fixture"]["rejectedMutationCount"] != 12: raise RuntimeError("v434-gate-count")
    if view["counts"]["measuredPackCount"] != 0 or view["counts"]["measuredResponseAuthorityCount"] != 0 or view["counts"]["measuredLikelihoodAuthorityCount"] != 0 or view["counts"]["independentMeasuredHoldoutCount"] != 0 or view["counts"]["independentReviewCount"] != 0 or view["counts"]["scienceResponseApplicationCount"] != 0: raise RuntimeError("v434-count-boundary")
    boundary = view["scienceBoundary"]
    if boundary["status"] != "blocked-no-measured-authority-pack" or boundary["admitted"] is not False or len(boundary["missingRequirements"]) != 5 or boundary["scienceResponseApplicationCount"] != 0: raise RuntimeError("v434-science-boundary")
    authority = view["authorityBoundary"]
    if authority["packSchemaAuthorityGranted"] is not True or authority["provenanceFirewallAuthorityGranted"] is not True or authority["disjointnessValidatorAuthorityGranted"] is not True or authority["preregistrationValidatorAuthorityGranted"] is not True or authority["crossBlockIndependenceValidatorAuthorityGranted"] is not True or authority["fixturePerformanceAuthorityGranted"] is not False or authority["measuredPackPresent"] is not False or authority["scienceAdmissionGranted"] is not False: raise RuntimeError("v434-authority-boundary")
    if oracle["counts"]["rejectedMutationCount"] != 12 or any(not mutation["rejected"] or not mutation["errors"] for mutation in oracle["mutationResults"]): raise RuntimeError("v434-mutation-boundary")
    if contract["admission"]["structuralValidationAloneInsufficient"] is not True or contract["admission"]["fixtureNeverAdmissible"] is not True or contract["admission"]["independentMeasuredValidationRequired"] is not True or contract["admission"]["independentReviewRequired"] is not True or contract["admission"]["currentStatus"] != "blocked-no-measured-authority-pack": raise RuntimeError("v434-contract-boundary")
    with (OUT / "measured-admission-gates.csv").open("r", encoding="utf-8", newline="") as handle: rows = list(csv.DictReader(handle))
    if len(rows) != 9 or sum(row["validatorPassed"] == "true" for row in rows) != 8 or any(row["measuredPackPresent"] != "false" or row["scienceAdmitted"] != "false" or row["scienceResponseApplications"] != "0" for row in rows): raise RuntimeError("v434-csv-boundary")
    with fits.open(OUT / "measured-admission-status.fits") as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["GATES"] != 9 or opened[0].header["GATEPASS"] != 8 or opened[0].header["MEASPACK"] or opened[0].header["ADMITTED"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 9 or np.any(opened[1].data["MEASURED"]) or np.any(opened[1].data["ADMITTED"]): raise RuntimeError("v434-fits-boundary")
    with Image.open(OUT / "measured-admission-firewall.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB": raise RuntimeError("v434-png-boundary")
    if set(manifest["exports"]) != {"json", "oracle", "contract", "fixture", "csv", "fits", "png"} or manifest["measuredPackCount"] != 0 or manifest["scienceAdmission"] != "blocked-no-measured-authority-pack": raise RuntimeError("v434-manifest-boundary")
    for entry in manifest["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]: raise RuntimeError(f"v434-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v434-python-measured-admission", "requiredGates": 9, "fixtureGates": 8, "mutations": "12/12-rejected", "measuredPacks": 0, "scienceAdmission": "blocked-no-measured-authority-pack", "scienceApplications": 0}, indent=2))


if __name__ == "__main__": main()

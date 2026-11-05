from __future__ import annotations
import csv, hashlib, json
from pathlib import Path
import numpy as np
from astropy.io import fits
from PIL import Image

ROOT = Path.cwd(); OUT = ROOT / "dist/science/kerr-high-energy-measured-import-v435"
def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024): digest.update(chunk)
    return digest.hexdigest()
def main() -> None:
    artifact = json.loads((OUT / "measured-import.json").read_text(encoding="utf-8")); oracle = json.loads((OUT / "measured-import-oracle.json").read_text(encoding="utf-8")); contract = json.loads((OUT / "measured-import-contract.json").read_text(encoding="utf-8")); manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8")); view = artifact["view"]
    if artifact["artifactSha256"] != "a47845279cc967a31fa253cd05af3d7f76d2d6fb8ff08db5c4b773b9860e4522": raise RuntimeError("v435-artifact-lock")
    if view["gates"]["requiredBindingCount"] != 6 or view["gates"]["signedFixtureSignatureVerified"] is not True or view["gates"]["signedFixtureFileHashesVerified"] is not True or view["gates"]["signedFixturePathSafetyVerified"] is not True or view["gates"]["signedFixtureV434BindingsVerified"] is not True or view["gates"]["measuredImportStatus"] != "not-attempted" or view["gates"]["independentReviewStatus"] != "not-run": raise RuntimeError("v435-gate-boundary")
    if view["fixture"]["signatureVerified"] is not True or view["fixture"]["contentAddressed"] is not True or view["fixture"]["fileHashesVerified"] is not True or view["fixture"]["measuredEligible"] is not False or view["fixture"]["mutationCount"] != 6 or view["fixture"]["rejectedMutationCount"] != 6: raise RuntimeError("v435-fixture-boundary")
    if view["counts"]["measuredPackCount"] != 0 or view["counts"]["importAttemptCount"] != 0 or view["counts"]["scienceResponseApplicationCount"] != 0 or view["scienceBoundary"]["status"] != "blocked-no-measured-authority-pack-imported" or view["scienceBoundary"]["admitted"] is not False: raise RuntimeError("v435-science-boundary")
    authority = view["authorityBoundary"]
    if authority["signatureAuthorityGranted"] is not True or authority["contentAddressingAuthorityGranted"] is not True or authority["pathFirewallAuthorityGranted"] is not True or authority["v434BindingAuthorityGranted"] is not True or authority["measuredPackPresent"] is not False or authority["measuredImportAttempted"] is not False or authority["scienceAdmissionGranted"] is not False: raise RuntimeError("v435-authority-boundary")
    if oracle["counts"]["rejectedMutationCount"] != 6 or any(not mutation["rejected"] or not mutation["errors"] for mutation in oracle["mutationResults"]): raise RuntimeError("v435-mutation-boundary")
    if contract["admission"]["signatureAloneInsufficient"] is not True or contract["admission"]["contentHashAloneInsufficient"] is not True or contract["admission"]["measuredValidationStillRequired"] is not True or contract["admission"]["independentReviewStillRequired"] is not True or contract["admission"]["importAttempted"] is not False: raise RuntimeError("v435-contract-boundary")
    with (OUT / "measured-import-gates.csv").open("r", encoding="utf-8", newline="") as handle: rows = list(csv.DictReader(handle))
    if len(rows) != 8 or sum(row["validatorPassed"] == "true" for row in rows) != 6 or any(row["measuredPackPresent"] != "false" or row["importAttempted"] != "false" or row["scienceAdmitted"] != "false" or row["scienceResponseApplications"] != "0" for row in rows): raise RuntimeError("v435-csv-boundary")
    with fits.open(OUT / "measured-import-status.fits") as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["BINDINGS"] != 6 or not opened[0].header["SIGOK"] or not opened[0].header["HASHOK"] or opened[0].header["MEASPACK"] or opened[0].header["IMPORTED"] or opened[0].header["ADMITTED"] or opened[0].header["SCIAPPL"] != 0 or opened[0].header["DENSE"] or len(opened[1].data) != 8 or np.any(opened[1].data["MEASURED"]) or np.any(opened[1].data["IMPORTED"]) or np.any(opened[1].data["ADMITTED"]): raise RuntimeError("v435-fits-boundary")
    with Image.open(OUT / "measured-import-firewall.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB": raise RuntimeError("v435-png-boundary")
    if set(manifest["exports"]) != {"json", "oracle", "contract", "manifest", "csv", "fits", "png"} or manifest["measuredPackCount"] != 0 or manifest["importAttemptCount"] != 0 or manifest["scienceAdmission"] != "blocked-no-measured-authority-pack-imported": raise RuntimeError("v435-manifest-boundary")
    for entry in manifest["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]: raise RuntimeError(f"v435-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v435-python-measured-import", "bindings": "6/6", "signature": "verified", "fileHashes": "verified", "mutations": "6/6-rejected", "measuredPacks": 0, "importAttempts": 0, "scienceAdmission": "blocked-no-measured-authority-pack-imported", "scienceApplications": 0}, indent=2))
if __name__ == "__main__": main()

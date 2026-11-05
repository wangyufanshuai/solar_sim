from __future__ import annotations

import csv
import hashlib
import json
import zipfile
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-response-acquisition-pack-v427"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "acquisition-pack.json").read_text(encoding="utf-8"))
    oracle = json.loads((OUT / "validator-oracle.json").read_text(encoding="utf-8"))
    fixture = json.loads((OUT / "validator-fixture.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    if view["counts"]["packFileCount"] != 9 or view["counts"]["measurementTemplateCount"] != 7 or view["counts"]["measurementTemplateDataRowCount"] != 0 or view["counts"]["measuredDataRowCount"] != 0 or view["counts"]["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v427-count-boundary")
    if view["validator"]["invalidFixtureMutationCount"] != 12 or view["validator"]["invalidFixtureRejectionCount"] != 12 or view["authorityBoundary"]["measuredResponseAuthorityGranted"] is not False:
        raise RuntimeError("v427-validator-boundary")
    if oracle["fixtureFileSha256"] != file_sha(OUT / "validator-fixture.json") or fixture["identity"]["sourceKind"] != "test-fixture" or fixture["identity"]["measuredAcquisition"] is not False:
        raise RuntimeError("v427-fixture-boundary")
    for entry in view["files"]:
        path = OUT / entry["relativePath"]
        if file_sha(path) != entry["sha256"] or entry["admissibleAsMeasured"] is not False:
            raise RuntimeError(f"v427-file-integrity:{entry['relativePath']}")
        if entry["measurementTemplate"] and entry["dataRowCount"] != 0:
            raise RuntimeError(f"v427-template-row-count:{entry['relativePath']}")
        if entry["measurementTemplate"] and entry["relativePath"].endswith(".csv"):
            with path.open("r", encoding="utf-8", newline="") as handle:
                if len(list(csv.reader(handle))) != 1:
                    raise RuntimeError(f"v427-template-not-empty:{entry['relativePath']}")
    with zipfile.ZipFile(OUT / "response-acquisition-pack.zip", "r") as archive:
        names = archive.namelist()
        if len(names) != 9 or names != sorted(names) or "validator-fixture.json" in names or "validator-oracle.json" in names or any(info.date_time != (1980, 1, 1, 0, 0, 0) for info in archive.infolist()):
            raise RuntimeError("v427-zip-boundary")
    with fits.open(OUT / "acquisition-plan.fits") as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["MEASURED"] or opened[0].header["SCIAPPL"] or opened[0].header["DENSE"] or len(opened[1].data) != 12 or np.any(opened[1].data["MEASURED"]):
            raise RuntimeError("v427-fits-boundary")
    with Image.open(OUT / "response-acquisition-pack-architecture.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v427-png-boundary")
    if exports["zipEntryCount"] != 9 or exports["measurementTemplateDataRowCount"] != 0 or exports["validatorFixtureIncludedInZip"] is not False or exports["measuredResponseAuthority"] != "unavailable" or exports["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v427-export-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v427-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v427-python-acquisition-pack", "packFiles": 9, "measurementTemplates": 7, "measurementRows": 0, "validatorMutationsRejected": 12, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

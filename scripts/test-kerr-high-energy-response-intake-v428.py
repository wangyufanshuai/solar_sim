from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-response-intake-v428"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    artifact = json.loads((OUT / "intake-firewall.json").read_text(encoding="utf-8"))
    report = json.loads((OUT / "fixture-intake-report.json").read_text(encoding="utf-8"))
    schema = json.loads((OUT / "response-submission-schema.json").read_text(encoding="utf-8"))
    exports = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    normalized = json.loads((OUT / "normalized-fixture-submission.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    if report["rejectedMutationCount"] != 12 or not all(entry["rejected"] and entry["status"] == "rejected-invalid-intake" for entry in report["mutationResults"]):
        raise RuntimeError("v428-mutation-boundary")
    if view["counts"]["measuredSubmissionCount"] != 0 or view["counts"]["measuredImportAttemptCount"] != 0 or view["counts"]["measuredDataRowCount"] != 0 or view["counts"]["scienceResponseApplicationCount"] != 0 or view["authorityBoundary"]["measuredResponseAuthorityGranted"] is not False:
        raise RuntimeError("v428-authority-boundary")
    if schema["archive"]["expectedFiles"] != sorted(schema["archive"]["expectedFiles"]) or len(schema["archive"]["expectedFiles"]) != 7 or len(schema["csvHeaders"]) != 6 or schema["archive"]["symlinksAllowed"] is not False:
        raise RuntimeError("v428-schema-boundary")
    with zipfile.ZipFile(OUT / "nonpublishable-intake-fixture.zip", "r") as archive:
        if archive.namelist() != sorted(archive.namelist()) or len(archive.namelist()) != 7 or any("/" in name or "\\" in name for name in archive.namelist()):
            raise RuntimeError("v428-archive-boundary")
    if normalized["identity"]["sourceKind"] != "test-fixture" or normalized["identity"]["measuredAcquisition"] is not False or report["fixtureReport"]["normalizedSubmissionSha256"] != file_sha(OUT / "normalized-fixture-submission.json"):
        raise RuntimeError("v428-normalized-boundary")
    with Image.open(OUT / "intake-firewall-architecture.png") as image:
        if image.size != (1800, 1080) or image.mode != "RGB":
            raise RuntimeError("v428-png-boundary")
    if exports["measuredSubmissionCount"] != 0 or exports["measuredImportAttemptCount"] != 0 or exports["measuredResponseAuthority"] != "unavailable" or exports["scienceResponseApplicationCount"] != 0:
        raise RuntimeError("v428-export-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT / entry["path"]) != entry["sha256"]:
            raise RuntimeError(f"v428-export-sha:{entry['path']}")
    print(json.dumps({"status": "passed-v428-python-intake-firewall", "archiveFiles": 7, "measurementCsv": 6, "fixtureRows": view["counts"]["fixtureDataRowCount"], "mutationsRejected": "12/12", "measuredSubmissions": 0, "measuredImportAttempts": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

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
OUT = ROOT / "dist/science/kerr-high-energy-measured-admission-v434"
ARTIFACT = OUT / "measured-admission.json"
ORACLE = OUT / "measured-admission-oracle.json"
CONTRACT = OUT / "measured-admission-contract.json"
FIXTURE = OUT / "measured-admission-fixture.json"
CSV_PATH = OUT / "measured-admission-gates.csv"
FITS_PATH = OUT / "measured-admission-status.fits"
PNG_PATH = OUT / "measured-admission-firewall.png"
MANIFEST = OUT / "export-manifest.json"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024): digest.update(chunk)
    return digest.hexdigest()


def atomic(path: Path, payload: bytes) -> None:
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_bytes(payload)
    temporary.replace(path)


def write_fits(rows: list[dict[str, str]]) -> None:
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector image")
    primary.header["FIXTURE"] = (True, "Validator fixture only")
    primary.header["GATES"] = (9, "Required admission gates")
    primary.header["GATEPASS"] = (8, "Fixture validator gates passed")
    primary.header["MEASPACK"] = (False, "No measured authority pack")
    primary.header["ADMITTED"] = (False, "Science admission blocked")
    primary.header["SCIAPPL"] = (0, "Science applications")
    primary.header["DENSE"] = (False, "Dense remains 0/49")
    table = fits.BinTableHDU.from_columns([
        fits.Column(name="GATE_ID", format="32A", array=np.asarray([row["gateId"] for row in rows], dtype="S32")),
        fits.Column(name="VALIDATED", format="L", array=np.asarray([row["validatorPassed"] == "true" for row in rows], dtype=bool)),
        fits.Column(name="SCOPE", format="16A", array=np.asarray([row["authorityScope"] for row in rows], dtype="S16")),
        fits.Column(name="MEASURED", format="L", array=np.zeros(len(rows), dtype=bool)),
        fits.Column(name="ADMITTED", format="L", array=np.zeros(len(rows), dtype=bool)),
    ], name="ADMISSION_GATES")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)


def write_png(rows: list[dict[str, str]]) -> None:
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (3, 8, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(46, 87, 92), width=1)
    draw.text((56, 34), "V434 MEASURED AUTHORITY ADMISSION FIREWALL", fill=(220, 252, 250), font=font)
    draw.text((56, 60), "STRUCTURAL VALIDATION IS NECESSARY — NEVER SUFFICIENT FOR SCIENCE ADMISSION", fill=(45, 212, 191), font=font)
    for index, row in enumerate(rows):
        column, line = index % 3, index // 3
        x, y = 56 + column * 565, 150 + line * 205
        passed = row["validatorPassed"] == "true"
        draw.rectangle((x, y, x + 520, y + 160), fill=(4, 18, 20), outline=(44, 104, 108) if passed else (133, 92, 45), width=2)
        draw.text((x + 22, y + 22), f"0{index + 1}  {row['gateId'].upper()}", fill=(153, 246, 228) if passed else (253, 186, 116), font=font)
        draw.text((x + 22, y + 70), "VALIDATOR PASS" if passed else "NOT RUN", fill=(94, 234, 212) if passed else (251, 146, 60), font=font)
        draw.text((x + 22, y + 112), f"scope: {row['authorityScope']}", fill=(115, 139, 141), font=font)
    draw.rectangle((56, 810, 1744, 994), fill=(18, 10, 5), outline=(153, 91, 35), width=2)
    draw.text((86, 846), "SCIENCE ADMISSION", fill=(191, 157, 116), font=font)
    draw.text((86, 892), "BLOCKED — NO MEASURED AUTHORITY PACK", fill=(251, 113, 133), font=font)
    draw.text((86, 940), "Missing: measured response | measured likelihood | independent holdout | cross-block proof | independent review", fill=(156, 163, 161), font=font)
    draw.text((56, 1030), "FIXTURE PERFORMANCE IS NOT INSTRUMENT PERFORMANCE · SCIENCE APPLICATIONS 0 · DENSE 0/49", fill=(112, 169, 166), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    oracle = json.loads(ORACLE.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle: rows = list(csv.DictReader(handle))
    if len(rows) != 9 or sum(row["validatorPassed"] == "true" for row in rows) != 8 or any(row["measuredPackPresent"] != "false" or row["scienceAdmitted"] != "false" or row["scienceResponseApplications"] != "0" for row in rows): raise RuntimeError("v434-csv-boundary")
    if artifact["view"]["scienceBoundary"]["admitted"] is not False or artifact["view"]["counts"]["measuredPackCount"] != 0 or artifact["view"]["counts"]["scienceResponseApplicationCount"] != 0 or oracle["counts"]["rejectedMutationCount"] != 12 or contract["admission"]["currentStatus"] != "blocked-no-measured-authority-pack": raise RuntimeError("v434-admission-boundary")
    write_fits(rows)
    write_png(rows)
    exports = {
        "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "measured-admission-summary-and-boundary"},
        "oracle": {"path": ORACLE.name, "sha256": file_sha(ORACLE), "semantic": "validator-conformance-fixture-and-mutations"},
        "contract": {"path": CONTRACT.name, "sha256": file_sha(CONTRACT), "semantic": "measured-authority-admission-contract"},
        "fixture": {"path": FIXTURE.name, "sha256": file_sha(FIXTURE), "semantic": "nonpublishable-validator-fixture"},
        "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "nine-gate-admission-status"},
        "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "admission-status-no-detector-image"},
        "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "admission-firewall-diagram-not-instrument-performance"},
    }
    manifest = {"version": "v434-kerr-high-energy-measured-admission-export-manifest-v1", "artifactSha256": artifact["artifactSha256"], "exports": exports, "requiredGateCount": 9, "passedFixtureGateCount": 8, "mutationCount": 12, "rejectedMutationCount": 12, "measuredPackCount": 0, "measuredResponseAuthority": "unavailable", "measuredLikelihoodAuthority": "unavailable", "independentMeasuredHoldout": "unavailable", "independentReview": "not-run", "scienceAdmission": "blocked-no-measured-authority-pack", "scienceResponseApplicationCount": 0, "denseShardExecuted": False}
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v434-measured-admission-firewall", "artifactSha256": artifact["artifactSha256"], "gates": "8-validator-pass-plus-independent-review-not-run", "mutations": "12/12-rejected", "measuredPacks": 0, "scienceAdmission": "blocked-no-measured-authority-pack", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import csv
import hashlib
import json
import os
import zipfile
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-response-acquisition-pack-v427"
ARTIFACT = OUT / "acquisition-pack.json"
ZIP_PATH = OUT / "response-acquisition-pack.zip"
FITS_PATH = OUT / "acquisition-plan.fits"
PNG_PATH = OUT / "response-acquisition-pack-architecture.png"
MANIFEST = OUT / "export-manifest.json"
PACK_FILES = [
    "README.md",
    "acquisition-plan.csv",
    "background.template.csv",
    "effective-area.template.csv",
    "manifest.template.json",
    "modulation.template.csv",
    "redistribution-covariance.template.csv",
    "redistribution.template.csv",
    "response-covariance.template.csv",
]
MEASUREMENT_TEMPLATES = [name for name in PACK_FILES if name == "manifest.template.json" or name.endswith(".template.csv")]


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


def validate_empty_templates(artifact: dict[str, object]) -> None:
    view = artifact["view"]
    files = {entry["relativePath"]: entry for entry in view["files"]}
    if set(files) != set(PACK_FILES) or view["counts"]["measurementTemplateCount"] != 7 or view["counts"]["measurementTemplateDataRowCount"] != 0:
        raise RuntimeError("v427-pack-file-contract")
    for name in MEASUREMENT_TEMPLATES:
        if files[name]["dataRowCount"] != 0 or files[name]["admissibleAsMeasured"] is not False:
            raise RuntimeError(f"v427-template-admission:{name}")
        if name.endswith(".csv"):
            lines = (OUT / name).read_text(encoding="utf-8").splitlines()
            if len(lines) != 1 or not lines[0].strip():
                raise RuntimeError(f"v427-template-data-row:{name}")
    manifest = json.loads((OUT / "manifest.template.json").read_text(encoding="utf-8"))
    if manifest.get("templateOnly") is not True or manifest.get("admissibleAsMeasured") is not False or manifest.get("trueEnergyBins") != [] or manifest.get("detectorChannels") != []:
        raise RuntimeError("v427-manifest-template-boundary")


def write_zip() -> None:
    temporary = ZIP_PATH.with_name(f"{ZIP_PATH.name}.{os.getpid()}.part")
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as archive:
        for name in PACK_FILES:
            info = zipfile.ZipInfo(filename=name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.flag_bits = 0x800
            archive.writestr(info, (OUT / name).read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    temporary.replace(ZIP_PATH)
    with zipfile.ZipFile(ZIP_PATH, "r") as archive:
        if archive.namelist() != PACK_FILES or any(info.date_time != (1980, 1, 1, 0, 0, 0) for info in archive.infolist()):
            raise RuntimeError("v427-zip-determinism")
        if "validator-fixture.json" in archive.namelist() or "validator-oracle.json" in archive.namelist():
            raise RuntimeError("v427-zip-fixture-leak")
        for name in PACK_FILES:
            if archive.read(name) != (OUT / name).read_bytes():
                raise RuntimeError(f"v427-zip-content:{name}")


def write_fits() -> None:
    with (OUT / "acquisition-plan.csv").open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 12 or any(row["executionStatus"] != "not-run" for row in rows):
        raise RuntimeError("v427-plan-rows")
    primary = fits.PrimaryHDU()
    primary.header["HASIMAGE"] = (False, "No detector or science image")
    primary.header["MEASURED"] = (False, "Empty acquisition plan only")
    primary.header["SCIAPPL"] = (False, "No science response application")
    primary.header["NONPUB"] = (True, "Plan is not response authority")
    primary.header["DENSE"] = (False, "Dense campaign remains 0/49")
    width = lambda key: max(len(row[key]) for row in rows)
    columns = [
        fits.Column(name="TASK_ID", format=f"{width('taskId')}A", array=np.asarray([row["taskId"] for row in rows])),
        fits.Column(name="PHASE", format=f"{width('phase')}A", array=np.asarray([row["phase"] for row in rows])),
        fits.Column(name="INSTRUCTION", format=f"{width('instruction')}A", array=np.asarray([row["instruction"] for row in rows])),
        fits.Column(name="CONSTRAINS", format=f"{width('constrains')}A", array=np.asarray([row["constrains"] for row in rows])),
        fits.Column(name="STATUS", format=f"{width('executionStatus')}A", array=np.asarray([row["executionStatus"] for row in rows])),
        fits.Column(name="MEASURED", format="L", array=np.zeros(len(rows), dtype=bool)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="ACQUISITION_PLAN")
    table.header["DATAROWS"] = (0, "Measured response rows in this file")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened) != 2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or opened[0].header["MEASURED"] or opened[0].header["SCIAPPL"] or not opened[0].header["NONPUB"] or opened[0].header["DENSE"] or len(opened[1].data) != 12 or np.any(opened[1].data["MEASURED"]):
            raise RuntimeError("v427-fits-boundary")


def write_png() -> None:
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (2, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(45, 85, 96), width=1)
    draw.text((52, 34), "V427 HIGH-ENERGY RESPONSE ACQUISITION HAND-OFF", fill=(224, 247, 248), font=font)
    draw.text((52, 58), "EMPTY MEASUREMENT TEMPLATES | STRICT STRUCTURAL VALIDATOR | NO MEASURED AUTHORITY", fill=(251, 191, 36), font=font)
    stages = [
        ("01", "IDENTITY + GRID", "instrument / campaign / energy-channel contract"),
        ("02", "REPEATED ACQUISITION", "area / modulation / redistribution / background"),
        ("03", "COVARIANCE", "24 x 24 response + per-energy simplex covariance"),
        ("04", "PROVENANCE", "raw SHA / terms / processing / event-loss models"),
        ("05", "VALIDATION", "structural admission then independent science review"),
    ]
    left, top, card_width, card_height, gap = 52, 150, 304, 220, 35
    for index, (number, title, subtitle) in enumerate(stages):
        x = left + index * (card_width + gap)
        draw.rectangle((x, top, x + card_width, top + card_height), fill=(3, 15, 20), outline=(50, 117, 130), width=2)
        draw.text((x + 22, top + 20), number, fill=(103, 232, 249), font=font)
        draw.text((x + 22, top + 58), title, fill=(207, 250, 254), font=font)
        words = subtitle.split(" ")
        line = ""
        yy = top + 96
        for word in words:
            candidate = f"{line} {word}".strip()
            if len(candidate) > 34:
                draw.text((x + 22, yy), line, fill=(123, 169, 177), font=font)
                line = word
                yy += 22
            else:
                line = candidate
        draw.text((x + 22, yy), line, fill=(123, 169, 177), font=font)
        draw.text((x + 22, top + 184), "NOT RUN", fill=(251, 191, 36), font=font)
        if index < len(stages) - 1:
            arrow_x = x + card_width + 7
            draw.line((arrow_x, top + 110, arrow_x + gap - 14, top + 110), fill=(74, 127, 137), width=2)
            draw.polygon([(arrow_x + gap - 14, top + 104), (arrow_x + gap - 4, top + 110), (arrow_x + gap - 14, top + 116)], fill=(103, 232, 249))
    checklist = (52, 450, 1120, 990)
    draw.rectangle(checklist, fill=(3, 13, 17), outline=(42, 88, 96), width=1)
    draw.text((checklist[0] + 24, checklist[1] + 22), "FAIL-CLOSED VALIDATOR SURFACE", fill=(126, 220, 225), font=font)
    checks = ["strictly increasing contiguous energy/channel bins", "complete repeat coverage and globally unique measurement IDs", "finite nonnegative area/background and bounded modulation", "row-stochastic redistribution for every bin and repeat", "complete symmetric PSD 24 x 24 response covariance", "complete symmetric PSD redistribution covariance with zero row sums", "exposure / temperature / dead-time / pileup / raw SHA provenance", "measured attestation plus independent scientific validation"]
    for index, text in enumerate(checks):
        y = checklist[1] + 74 + index * 50
        draw.rectangle((checklist[0] + 26, y, checklist[0] + 38, y + 12), outline=(190, 242, 100), width=2)
        draw.text((checklist[0] + 58, y - 1), text, fill=(164, 204, 207), font=font)
    boundary = (1160, 450, 1748, 990)
    draw.rectangle(boundary, fill=(10, 9, 3), outline=(116, 92, 35), width=1)
    draw.text((boundary[0] + 24, boundary[1] + 22), "AUTHORITY FIREWALL", fill=(253, 224, 135), font=font)
    status_rows = [("PACK / SCHEMA", "QUALIFIED", (190, 242, 100)), ("VALIDATOR FIXTURE", "QUALIFIED / NONPUBLISHABLE", (125, 211, 252)), ("MEASURED ROWS", "0", (251, 191, 36)), ("MEASURED RESPONSE", "UNAVAILABLE", (251, 113, 133)), ("SCIENCE APPLICATION", "0", (251, 113, 133)), ("DENSE CAMPAIGN", "0 / 49", (251, 191, 36)), ("BROWSER", "NOT RUN", (251, 191, 36))]
    for index, (label, value, color) in enumerate(status_rows):
        y = boundary[1] + 78 + index * 58
        draw.text((boundary[0] + 24, y), label, fill=(122, 151, 155), font=font)
        draw.text((boundary[0] + 255, y), value, fill=color, font=font)
    draw.text((52, 1032), "TEMPLATES DO NOT CONTAIN EXAMPLE PERFORMANCE VALUES | VALIDATOR SUCCESS NEVER GRANTS SCIENTIFIC AUTHORITY", fill=(138, 181, 185), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v427-kerr-high-energy-response-acquisition-pack-artifact-v1" or view.get("counts", {}).get("measuredDataRowCount") != 0 or view.get("authorityBoundary", {}).get("measuredResponseAuthorityGranted") is not False or view.get("denseCampaignStatus") != "incomplete-0-of-49":
        raise RuntimeError("v427-artifact-boundary")
    validate_empty_templates(artifact)
    write_zip()
    write_fits()
    write_png()
    manifest = {
        "version": "v427-kerr-high-energy-response-acquisition-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "empty-acquisition-pack-validator-and-authority-boundary"},
            "zip": {"path": ZIP_PATH.name, "sha256": file_sha(ZIP_PATH), "semantic": "deterministic-nine-file-empty-measurement-template-bundle"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "twelve-task-acquisition-plan-no-measured-response"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "acquisition-validator-authority-firewall-diagram-not-detector-image"},
        },
        "zipEntryCount": 9,
        "measurementTemplateCount": 7,
        "measurementTemplateDataRowCount": 0,
        "validatorFixtureIncludedInZip": False,
        "measuredResponseAuthority": "unavailable",
        "scienceResponseApplicationCount": 0,
        "detectorCountProduct": "unavailable",
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v427-empty-response-acquisition-pack", "artifactSha256": artifact["artifactSha256"], "zipEntries": 9, "measurementTemplateDataRows": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

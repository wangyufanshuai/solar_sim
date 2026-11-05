from __future__ import annotations

import hashlib
import json
import os
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-high-energy-response-intake-v428"
ARTIFACT = OUT / "intake-firewall.json"
SCHEMA = OUT / "response-submission-schema.json"
REPORT = OUT / "fixture-intake-report.json"
FIXTURE = OUT / "nonpublishable-intake-fixture.zip"
PNG = OUT / "intake-firewall-architecture.png"
MANIFEST = OUT / "export-manifest.json"


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


def write_png(artifact: dict[str, object]) -> None:
    view = artifact["view"]
    width, height = 1800, 1080
    image = Image.new("RGB", (width, height), (3, 7, 8))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((0, 0, width - 1, height - 1), outline=(58, 91, 92), width=1)
    draw.text((52, 32), "V428 MEASURED-RESPONSE INTAKE FIREWALL", fill=(225, 249, 245), font=font)
    draw.text((52, 56), "ZIP SAFETY -> SHA LOCK -> STRICT CSV -> UNIT CONTRACT -> SCIENCE STRUCTURE -> INDEPENDENT VALIDATION", fill=(94, 234, 212), font=font)
    stages = [("01", "CONTAINER", "paths / members / sizes / ratios"), ("02", "INTEGRITY", "manifest + six SHA-locked CSV files"), ("03", "NORMALIZE", "strict UTF-8 / headers / finite units"), ("04", "CROSS-CHECK", "Python metrics x TypeScript v427 validator"), ("05", "ADMISSION", "independent science validation still required")]
    left, top, card_width, card_height, gap = 52, 135, 304, 230, 35
    for index, (number, title, subtitle) in enumerate(stages):
        x = left + index * (card_width + gap)
        draw.rectangle((x, top, x + card_width, top + card_height), fill=(4, 16, 17), outline=(49, 117, 111), width=2)
        draw.text((x + 20, top + 18), number, fill=(94, 234, 212), font=font)
        draw.text((x + 20, top + 58), title, fill=(204, 251, 241), font=font)
        draw.text((x + 20, top + 96), subtitle[:38], fill=(116, 167, 161), font=font)
        if len(subtitle) > 38:
            draw.text((x + 20, top + 116), subtitle[38:], fill=(116, 167, 161), font=font)
        label = "QUALIFIED" if index < 4 else "NOT RUN / NO SUBMISSION"
        color = (190, 242, 100) if index < 4 else (251, 191, 36)
        draw.text((x + 20, top + 190), label, fill=color, font=font)
        if index < 4:
            arrow_x = x + card_width + 7
            draw.line((arrow_x, top + 115, arrow_x + gap - 13, top + 115), fill=(61, 131, 124), width=2)
            draw.polygon([(arrow_x + gap - 13, top + 109), (arrow_x + gap - 3, top + 115), (arrow_x + gap - 13, top + 121)], fill=(94, 234, 212))
    gates = (52, 430, 1130, 985)
    draw.rectangle(gates, fill=(3, 13, 14), outline=(43, 84, 82), width=1)
    draw.text((gates[0] + 24, gates[1] + 20), "12 ADVERSARIAL ARCHIVE / MANIFEST MUTATIONS", fill=(133, 231, 217), font=font)
    gate_labels = ["../ path traversal", "absolute member path", "backslash member path", "duplicate ZIP member", "unexpected member", "missing required member", "symbolic-link member", "file SHA mismatch", "CSV header mismatch", "invalid UTF-8", "measured attestation mismatch", "unit contract mismatch"]
    for index, label in enumerate(gate_labels):
        column = index % 2
        row = index // 2
        x = gates[0] + 26 + column * 520
        y = gates[1] + 76 + row * 70
        draw.rectangle((x, y, x + 12, y + 12), fill=(190, 242, 100))
        draw.text((x + 32, y - 1), label, fill=(166, 206, 201), font=font)
        draw.text((x + 358, y - 1), "REJECTED", fill=(190, 242, 100), font=font)
    authority = (1170, 430, 1748, 985)
    draw.rectangle(authority, fill=(12, 8, 3), outline=(112, 82, 31), width=1)
    draw.text((authority[0] + 24, authority[1] + 20), "AUTHORITY STATE", fill=(253, 224, 135), font=font)
    rows = [("INTAKE SCHEMA", "QUALIFIED", (190, 242, 100)), ("CONTAINER VALIDATOR", "QUALIFIED", (190, 242, 100)), ("CSV BRIDGE", "QUALIFIED", (190, 242, 100)), ("FIXTURE", "NONPUBLISHABLE", (125, 211, 252)), ("MEASURED SUBMISSIONS", "0", (251, 191, 36)), ("IMPORT ATTEMPTS", "0", (251, 191, 36)), ("MEASURED AUTHORITY", "UNAVAILABLE", (251, 113, 133)), ("SCIENCE APPLICATIONS", "0", (251, 113, 133)), ("DENSE CAMPAIGN", "0 / 49", (251, 191, 36))]
    for index, (label, value, color) in enumerate(rows):
        y = authority[1] + 72 + index * 50
        draw.text((authority[0] + 24, y), label, fill=(130, 153, 151), font=font)
        draw.text((authority[0] + 260, y), value, fill=color, font=font)
    draw.text((52, 1030), f"FIXTURE ROWS {view['counts']['fixtureDataRowCount']} | PYTHON/TS DIFFERENCE {view['fixture']['pythonTypeScriptMaximumDifference']:.3e} | VALIDATION NEVER GRANTS MEASURED RESPONSE AUTHORITY", fill=(136, 181, 176), font=font)
    temporary = PNG.with_name(f"{PNG.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if artifact.get("version") != "v428-kerr-high-energy-response-intake-firewall-artifact-v1" or view.get("counts", {}).get("measuredSubmissionCount") != 0 or view.get("counts", {}).get("measuredImportAttemptCount") != 0 or view.get("authorityBoundary", {}).get("measuredResponseAuthorityGranted") is not False or report.get("rejectedMutationCount") != 12 or schema.get("archive", {}).get("expectedFiles") is None:
        raise RuntimeError("v428-artifact-boundary")
    with zipfile.ZipFile(FIXTURE, "r") as archive:
        if len(archive.infolist()) != 7 or any("/" in entry.filename or "\\" in entry.filename for entry in archive.infolist()):
            raise RuntimeError("v428-fixture-archive-boundary")
    write_png(artifact)
    manifest = {
        "version": "v428-kerr-high-energy-response-intake-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "intake-firewall-cross-language-validation-and-authority-boundary"},
            "schema": {"path": SCHEMA.name, "sha256": file_sha(SCHEMA), "semantic": "measured-response-submission-container-csv-unit-and-size-contract"},
            "report": {"path": REPORT.name, "sha256": file_sha(REPORT), "semantic": "nonpublishable-fixture-intake-and-twelve-mutation-rejection-report"},
            "fixture": {"path": FIXTURE.name, "sha256": file_sha(FIXTURE), "semantic": "nonpublishable-validator-fixture-never-measured-response"},
            "png": {"path": PNG.name, "sha256": file_sha(PNG), "semantic": "intake-firewall-architecture-not-detector-image"},
        },
        "expectedArchiveFileCount": 7,
        "measurementCsvCount": 6,
        "fixtureMutationCount": 12,
        "fixtureRejectedMutationCount": 12,
        "measuredSubmissionCount": 0,
        "measuredImportAttemptCount": 0,
        "measuredResponseAuthority": "unavailable",
        "scienceResponseApplicationCount": 0,
        "detectorCountProduct": "unavailable",
        "pixelRasterAuthority": "unavailable",
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({"status": "exported-v428-response-intake-firewall", "artifactSha256": artifact["artifactSha256"], "mutationsRejected": "12/12", "measuredSubmissionCount": 0, "measuredImportAttemptCount": 0, "measuredAuthority": "unavailable", "scienceApplications": 0}, indent=2))


if __name__ == "__main__":
    main()

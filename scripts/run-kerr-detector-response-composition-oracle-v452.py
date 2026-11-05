from __future__ import annotations

import hashlib
import json
import os
from decimal import Decimal, getcontext
from pathlib import Path

getcontext().prec = 50
ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-detector-response-composition-v452/python-oracle.json"

rows = [
    {"fixtureId": "includes-qe-12", "rayIndex": 12, "semantics": "throughput-includes-detector-qe", "sourcePhotonRadiancePerSM2Sr": "12", "geometricAreaM2WithoutThroughput": "2", "pixelSolidAngleSr": "0.1", "exposureSeconds": "5", "throughputFraction": "0.7", "detectorQuantumEfficiencyFraction": "1", "backgroundElectronPerSecondPerPixel": "0.2", "darkCurrentElectronPerSecondPerPixel": "0.01", "gainElectronPerAdu": "2"},
    {"fixtureId": "includes-qe-13", "rayIndex": 13, "semantics": "throughput-includes-detector-qe", "sourcePhotonRadiancePerSM2Sr": "8.5", "geometricAreaM2WithoutThroughput": "1.25", "pixelSolidAngleSr": "0.08", "exposureSeconds": "12", "throughputFraction": "0.62", "detectorQuantumEfficiencyFraction": "1", "backgroundElectronPerSecondPerPixel": "0.05", "darkCurrentElectronPerSecondPerPixel": "0.004", "gainElectronPerAdu": "1.7"},
    {"fixtureId": "excludes-qe-14", "rayIndex": 14, "semantics": "throughput-excludes-detector-qe", "sourcePhotonRadiancePerSM2Sr": "21", "geometricAreaM2WithoutThroughput": "0.75", "pixelSolidAngleSr": "0.04", "exposureSeconds": "3", "throughputFraction": "0.8", "detectorQuantumEfficiencyFraction": "0.65", "backgroundElectronPerSecondPerPixel": "0.11", "darkCurrentElectronPerSecondPerPixel": "0.006", "gainElectronPerAdu": "3.2"},
    {"fixtureId": "excludes-qe-15", "rayIndex": 15, "semantics": "throughput-excludes-detector-qe", "sourcePhotonRadiancePerSM2Sr": "4.25", "geometricAreaM2WithoutThroughput": "3", "pixelSolidAngleSr": "0.015", "exposureSeconds": "20", "throughputFraction": "0.45", "detectorQuantumEfficiencyFraction": "0.9", "backgroundElectronPerSecondPerPixel": "0.03", "darkCurrentElectronPerSecondPerPixel": "0.002", "gainElectronPerAdu": "1.25"},
]

def dec(row, key):
    return Decimal(row[key])

def result(row):
    throughput = dec(row, "throughputFraction")
    qe = Decimal(1) if row["semantics"] == "throughput-includes-detector-qe" else dec(row, "detectorQuantumEfficiencyFraction")
    factor = throughput * qe
    source = dec(row, "sourcePhotonRadiancePerSM2Sr") * dec(row, "geometricAreaM2WithoutThroughput") * dec(row, "pixelSolidAngleSr") * dec(row, "exposureSeconds") * factor
    background = dec(row, "backgroundElectronPerSecondPerPixel") * dec(row, "exposureSeconds")
    dark = dec(row, "darkCurrentElectronPerSecondPerPixel") * dec(row, "exposureSeconds")
    total = source + background + dark
    return {
        "fixtureId": row["fixtureId"],
        "rayIndex": row["rayIndex"],
        "semantics": row["semantics"],
        "effectiveThroughputFraction": throughput,
        "effectiveDetectorQuantumEfficiencyFraction": qe,
        "photonToElectronFactor": factor,
        "sourceExpectedElectrons": source,
        "backgroundExpectedElectrons": background,
        "darkExpectedElectrons": dark,
        "totalExpectedElectrons": total,
        "expectedAduDiagnostic": total / dec(row, "gainElectronPerAdu"),
    }

def serializable(value):
    if isinstance(value, Decimal): return float(value)
    if isinstance(value, list): return [serializable(item) for item in value]
    if isinstance(value, dict): return {key: serializable(item) for key, item in value.items()}
    return value

unsigned = {
    "version": "v452-kerr-detector-response-composition-python-oracle-v1",
    "generatedAt": "2026-07-30T00:00:00Z",
    "status": "qualified-50-digit-decimal-response-composition-fixture-only",
    "precisionDigits": 50,
    "rows": serializable([result(row) for row in rows]),
    "measuredDetectorAuthorityGranted": False,
    "observedCountsAvailable": False,
    "scienceRasterAllowed": False,
}
canonical = json.dumps({key: value for key, value in unsigned.items() if key != "generatedAt"}, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
artifact = {**unsigned, "artifactSha256": hashlib.sha256(canonical).hexdigest()}
OUT.parent.mkdir(parents=True, exist_ok=True)
part = OUT.with_name(f"{OUT.name}.{os.getpid()}.part")
part.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
part.replace(OUT)
print(json.dumps({"status": artifact["status"], "precisionDigits": 50, "fixtureRows": 4, "measuredRows": 0, "scienceRasterRows": 0}, indent=2))

from __future__ import annotations
from decimal import Decimal, getcontext
import hashlib, json, os
from pathlib import Path

getcontext().prec = 50
ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-detector-electron-kernel-v447/fixture-input.json"
OUTPUT = ROOT / "dist/science/kerr-detector-electron-kernel-v447/python-oracle.json"

def canonical(value):
    if isinstance(value, list): return [canonical(item) for item in value]
    if isinstance(value, dict): return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    if isinstance(value, Decimal): return float(value)
    return value

def canonical_sha(value):
    return hashlib.sha256(json.dumps(canonical(value), separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def d(value): return value if isinstance(value, Decimal) else Decimal(str(value))
def f(value): return float(value)

def compute(row):
    source_rate = d(row["sourcePhotonRadiancePerSM2Sr"]) * d(row["geometricAreaM2"]) * d(row["pixelSolidAngleSr"]) * d(row["photonToElectronFactor"])
    exposure = d(row["exposureSeconds"])
    source = source_rate * exposure
    background = d(row["backgroundElectronPerSecondPerPixel"]) * exposure
    dark = d(row["darkCurrentElectronPerSecondPerPixel"]) * exposure
    total = source + background + dark
    read_variance = d(row["frameCount"]) * d(row["readNoiseRmsElectronPerFrame"]) ** 2
    predictive = total + read_variance
    u = row["uncertainty"]
    contributions = {
        "sourceRadiance": source * d(u["sourceRadianceRelative"]),
        "geometricArea": source * d(u["geometricAreaRelative"]),
        "pixelSolidAngle": source * d(u["pixelSolidAngleRelative"]),
        "exposure": (source_rate + d(row["backgroundElectronPerSecondPerPixel"]) + d(row["darkCurrentElectronPerSecondPerPixel"])) * d(u["exposureSecondsAbsolute"]),
        "photonToElectronFactor": source * d(u["photonToElectronFactorRelative"]),
        "backgroundRate": exposure * d(u["backgroundRateAbsolute"]),
        "darkCurrentRate": exposure * d(u["darkCurrentRateAbsolute"]),
        "knownComputational": source * d(u["knownComputationalRelative"]),
    }
    upper = sum(contributions.values(), Decimal(0))
    return {"fixtureId": row["fixtureId"], "rayIndex": row["rayIndex"], "sourceExpectedElectrons": f(source), "backgroundExpectedElectrons": f(background), "darkExpectedElectrons": f(dark), "totalExpectedElectrons": f(total), "poissonVarianceElectronSquared": f(total), "readNoiseVarianceElectronSquared": f(read_variance), "predictiveVarianceElectronSquared": f(predictive), "predictiveNoiseRmsElectron": f(predictive.sqrt()), "systematicContributionsElectron": {key: f(value) for key, value in contributions.items()}, "systematicUpperBoundElectron": f(upper), "systematicUpperBoundRelative": f(upper / total)}

with SOURCE.open(encoding="utf-8") as handle:
    fixture = json.load(handle, parse_float=Decimal)
if fixture.get("version") != "v447-kerr-detector-electron-fixture-input-v1" or fixture.get("status") != "test-fixture-only-no-measured-authority" or len(fixture.get("rows", [])) != 4 or fixture.get("measuredAuthorityGranted") is not False:
    raise RuntimeError("v447-oracle-fixture-boundary")
rows = [compute(row) for row in fixture["rows"]]
unsigned = {"version": "v447-kerr-detector-electron-python-decimal-oracle-v1", "generatedAt": "2026-07-30T00:00:00Z", "status": "qualified-independent-decimal-fixture-oracle-not-measured-authority", "sourceFixtureSha256": canonical_sha(fixture), "precisionDigits": 50, "rows": rows, "rowCount": 4, "measuredAuthorityGranted": False, "observedCountsAvailable": False, "scienceRasterAllowed": False, "networkAttempted": False}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
part = Path(f"{OUTPUT}.{os.getpid()}.part")
part.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
os.replace(part, OUTPUT)
print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "rows": 4, "precisionDigits": 50, "maximumExpectedElectron": max(row["totalExpectedElectrons"] for row in rows), "measuredAuthorityGranted": False}, indent=2))

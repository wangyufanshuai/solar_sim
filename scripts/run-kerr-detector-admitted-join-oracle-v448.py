from __future__ import annotations
from decimal import Decimal, getcontext
import hashlib, json, math, os
from pathlib import Path
getcontext().prec = 50
ROOT = Path.cwd(); SOURCE = ROOT / "dist/science/kerr-detector-admitted-input-join-v448/join-fixture-input.json"; OUTPUT = ROOT / "dist/science/kerr-detector-admitted-input-join-v448/python-oracle.json"
def canonical(value):
    if isinstance(value, list): return [canonical(item) for item in value]
    if isinstance(value, dict): return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt","artifactSha256"}}
    if isinstance(value, Decimal): return float(value)
    return value
def sha(value): return hashlib.sha256(json.dumps(canonical(value),separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def d(value): return value if isinstance(value,Decimal) else Decimal(str(value))
with SOURCE.open(encoding="utf-8") as handle: fixture=json.load(handle,parse_float=Decimal)
if fixture.get("version")!="v448-kerr-detector-admitted-input-join-fixture-v1" or len(fixture.get("rows",[]))!=4 or fixture.get("measuredAuthorityGranted") is not False: raise RuntimeError("v448-oracle-fixture-boundary")
rows=[]
for row in fixture["rows"]:
    source=d(row["expectationInput"]["sourcePhotonRadiancePerSM2Sr"])*d(row["expectationInput"]["geometricAreaM2"])*d(row["expectationInput"]["pixelSolidAngleSr"])*d(row["expectationInput"]["exposureSeconds"])*d(row["expectationInput"]["photonToElectronFactor"])
    background=d(row["expectationInput"]["backgroundElectronPerSecondPerPixel"])*d(row["expectationInput"]["exposureSeconds"]); dark=d(row["expectationInput"]["darkCurrentElectronPerSecondPerPixel"])*d(row["expectationInput"]["exposureSeconds"]); total=source+background+dark; variance=total+d(row["expectationInput"]["frameCount"])*d(row["expectationInput"]["readNoiseRmsElectronPerFrame"])**2
    rows.append({"rayIndex":row["rayIndex"],"expectedElectrons":float(total),"predictiveVarianceElectronSquared":float(variance)})
probe=fixture["likelihoodProbe"]; mean=float(probe["expectedElectrons"]); variance=float(probe["predictiveVarianceElectronSquared"]); observed=int(probe["hypotheticalObservedCount"]); log_like=-.5*(math.log(2*math.pi*variance)+(observed-mean)**2/variance)
unsigned={"version":"v448-kerr-detector-admitted-input-join-python-oracle-v1","generatedAt":"2026-07-30T00:00:00Z","status":"qualified-independent-decimal-join-and-likelihood-fixture-only","sourceFixtureSha256":sha(fixture),"precisionDigits":50,"rows":rows,"likelihoodProbe":{"expectedElectrons":mean,"predictiveVarianceElectronSquared":variance,"hypotheticalObservedCount":observed,"logLikelihood":log_like,"observedCountKind":"test-fixture-never-measured"},"rowCount":4,"measuredAuthorityGranted":False,"observedCountsAvailable":False,"scienceRasterAllowed":False,"networkAttempted":False}; artifact={**unsigned,"artifactSha256":sha(unsigned)}; OUTPUT.parent.mkdir(parents=True,exist_ok=True); part=Path(f"{OUTPUT}.{os.getpid()}.part"); part.write_text(json.dumps(artifact,indent=2)+"\n",encoding="utf-8"); os.replace(part,OUTPUT); print(json.dumps({"status":artifact["status"],"artifactSha256":artifact["artifactSha256"],"rows":4,"likelihoodProbeLog":log_like,"measuredAuthorityGranted":False},indent=2))

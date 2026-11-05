from __future__ import annotations
import hashlib, json, os
from decimal import Decimal, ROUND_FLOOR, getcontext
from pathlib import Path
getcontext().prec = 60
ROOT = Path.cwd(); OUT = ROOT / "dist/science/kerr-detector-readout-v453/python-oracle.json"
rows = [
    {"fixtureId":"nominal-readout","caseKind":"nominal","expectedPoissonElectrons":"9.45","count":9,"sigma":"1.2","z":"0.25","fullWell":"50000","gain":"0.5","bias":"100","bits":16},
    {"fixtureId":"underflow-floor","caseKind":"underflow-clipped","expectedPoissonElectrons":"1.3308","count":0,"sigma":"2","z":"-1.5","fullWell":"100","gain":"1","bias":"50","bits":12},
    {"fixtureId":"full-well-clip","caseKind":"full-well-saturated","expectedPoissonElectrons":"1024","count":1200,"sigma":"5","z":"0.1","fullWell":"1000","gain":"2","bias":"100","bits":16},
    {"fixtureId":"adc-clip","caseKind":"adc-saturated","expectedPoissonElectrons":"1024","count":1000,"sigma":"0.1","z":"0","fullWell":"5000","gain":"0.5","bias":"10","bits":10},
]
def evaluate(row):
    noise = Decimal(row["sigma"]) * Decimal(row["z"]); analog = Decimal(row["count"]) + noise; full_well = Decimal(row["fullWell"]); clipped = min(full_well, max(Decimal(0), analog)); analog_adu = clipped / Decimal(row["gain"]) + Decimal(row["bias"]); maximum = Decimal(2 ** row["bits"] - 1); rounded = (analog_adu + Decimal("0.5")).to_integral_value(rounding=ROUND_FLOOR); code = min(maximum, max(Decimal(0), rounded)); reconstructed = max(Decimal(0), (code - Decimal(row["bias"])) * Decimal(row["gain"]));
    return {"fixtureId":row["fixtureId"],"caseKind":row["caseKind"],"readNoiseElectronFixture":float(noise),"analogReadoutElectron":float(analog),"underflowClipped":analog < 0,"fullWellSaturated":analog > full_well,"clippedElectron":float(clipped),"analogAduBeforeQuantization":float(analog_adu),"adcCodeMaximum":int(maximum),"adcSaturated":analog_adu > maximum,"digitalAduCode":int(code),"digitizationResidualAdu":float(code-analog_adu),"reconstructedElectronDiagnostic":float(reconstructed)}
unsigned = {"version":"v453-kerr-detector-readout-python-oracle-v1","generatedAt":"2026-07-30T00:00:00Z","status":"qualified-60-digit-decimal-deterministic-readout-fixture-only","precisionDigits":60,"rows":[evaluate(row) for row in rows],"randomnessUsed":False,"observedCountsAvailable":False,"measuredDetectorAuthorityGranted":False,"digitalAduAuthorityGranted":False,"scienceRasterAllowed":False}
canonical = json.dumps({key:value for key,value in unsigned.items() if key != "generatedAt"},ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8"); artifact={**unsigned,"artifactSha256":hashlib.sha256(canonical).hexdigest()}; OUT.parent.mkdir(parents=True,exist_ok=True); part=OUT.with_name(f"{OUT.name}.{os.getpid()}.part"); part.write_text(json.dumps(artifact,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); part.replace(OUT); print(json.dumps({"status":artifact["status"],"precisionDigits":60,"fixtureRows":4,"randomnessUsed":False,"observedRows":0,"scienceRasterRows":0},indent=2))

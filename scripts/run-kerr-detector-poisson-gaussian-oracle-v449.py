from __future__ import annotations
from decimal import Decimal, ROUND_CEILING, getcontext
import hashlib,json,os
from pathlib import Path
getcontext().prec=80
ROOT=Path.cwd();SOURCE=ROOT/"dist/science/kerr-detector-poisson-gaussian-v449/likelihood-fixture.json";OUTPUT=ROOT/"dist/science/kerr-detector-poisson-gaussian-v449/python-oracle.json";PI=Decimal("3.141592653589793238462643383279502884197169399375105820974944592307816406286")
def canonical(value):
    if isinstance(value,list):return[canonical(item)for item in value]
    if isinstance(value,dict):return{key:canonical(value[key])for key in sorted(value)if key not in{"generatedAt","artifactSha256"}}
    if isinstance(value,Decimal):return float(value)
    return value
def sha(value):return hashlib.sha256(json.dumps(canonical(value),separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def compute(row):
    lam=Decimal(row["expectedPoissonElectrons"]);sigma=Decimal(row["readNoiseSigmaElectron"]);observed=Decimal(row["hypotheticalObservedElectron"]);upper=int((max(lam,observed,Decimal(0))+Decimal(18)*(lam+sigma*sigma+Decimal(1)).sqrt()+Decimal(64)).to_integral_value(rounding=ROUND_CEILING));poisson=(-lam).exp();normalizer=sigma*(Decimal(2)*PI).sqrt();density=Decimal(0)
    for count in range(upper+1):
        if count>0:poisson=poisson*lam/Decimal(count)
        residual=(observed-Decimal(count))/sigma;density+=poisson*(-residual*residual/Decimal(2)).exp()/normalizer
    exact_log=density.ln();threshold=Decimal(upper+1);ratio=threshold/lam;delta=ratio-Decimal(1);log_tail=lam*(delta-ratio*ratio.ln());tail=min(Decimal(1),log_tail.exp());tail_density=tail/normalizer;variance=lam+sigma*sigma;normal_log=-(Decimal(2)*PI*variance).ln()/Decimal(2)-(observed-lam)**2/(Decimal(2)*variance);normal_density=normal_log.exp()
    return{"fixtureId":row["fixtureId"],"supportUpperInclusive":upper,"exactLogLikelihood":float(exact_log),"exactLikelihoodDensity":float(density),"poissonTailProbabilityUpperBound":float(tail),"likelihoodTailDensityUpperBound":float(tail_density),"normalApproximationLogLikelihood":float(normal_log),"normalApproximationDensity":float(normal_density)}
with SOURCE.open(encoding="utf-8")as handle:fixture=json.load(handle,parse_float=Decimal)
if fixture.get("version")!="v449-kerr-detector-poisson-gaussian-fixture-v1"or len(fixture.get("rows",[]))!=4 or fixture.get("measuredObservedCountsAvailable")is not False:raise RuntimeError("v449-oracle-fixture-boundary")
rows=[compute(row)for row in fixture["rows"]];unsigned={"version":"v449-kerr-detector-poisson-gaussian-python-oracle-v1","generatedAt":"2026-07-30T00:00:00Z","status":"qualified-independent-decimal-exact-mixture-fixture-only","sourceFixtureSha256":sha(fixture),"precisionDigits":80,"rows":rows,"rowCount":4,"measuredObservedCountsAvailable":False,"scienceRasterAllowed":False,"networkAttempted":False};artifact={**unsigned,"artifactSha256":sha(unsigned)};OUTPUT.parent.mkdir(parents=True,exist_ok=True);part=Path(f"{OUTPUT}.{os.getpid()}.part");part.write_text(json.dumps(artifact,indent=2)+"\n",encoding="utf-8");os.replace(part,OUTPUT);print(json.dumps({"status":artifact["status"],"artifactSha256":artifact["artifactSha256"],"rows":4,"precisionDigits":80,"measuredObservedRows":0},indent=2))

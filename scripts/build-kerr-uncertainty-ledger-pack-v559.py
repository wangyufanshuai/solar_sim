from __future__ import annotations
import argparse, csv, hashlib, json, os, platform, shutil, subprocess, sys, tempfile
from pathlib import Path
from typing import Any
V520=Path.cwd()/"dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json"; V548=Path.cwd()/"dist/science/kerr-observation-quantity-provenance-v548/atlas.json"; V558=Path.cwd()/"dist/science/kerr-response-provenance-pack-v558/manifest.json"; V558_E=Path.cwd()/"dist/science/orbit-atlas-shadow-v558-evidence.json"; DENSE=Path.cwd()/"dist/science/kerr-campaign-v314/campaign-state.json"; FORMAL=Path.cwd()/"dist/release/orbit-atlas-current-product-evidence-v263.json"; VALIDATOR=Path.cwd()/"scripts/orbit_atlas_v559_uncertainty_ledger_validator.py"; OUT=Path.cwd()/"dist/science/kerr-response-uncertainty-ledger-v559"; ATLAS=OUT/"atlas.json"; CSV=OUT/"response-stokes-uncertainty-v559.csv"; CONTRACT=OUT/"validation-contract.json"; RECEIPT=OUT/"validation-receipt.json"; PORTABLE=OUT/"orbit-atlas-v559-uncertainty-ledger-validator.py"; FIXED="2026-08-02T00:00:00Z"; TRANSIENT={"generatedAt","artifactSha256","resultSha256","rowSha256"}
def fs(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def can(v): return [can(x) for x in v] if isinstance(v,list) else {k:can(v[k]) for k in sorted(v) if k not in TRANSIENT} if isinstance(v,dict) else v
def sha(v): return hashlib.sha256(json.dumps(can(v),ensure_ascii=False,separators=(",",":")).encode()).hexdigest()
def read(path): return json.loads(path.read_text(encoding="utf-8"))
def atomic(path,value): path.parent.mkdir(parents=True,exist_ok=True); part=path.with_name(f"{path.name}.{os.getpid()}.part"); part.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline=""); part.replace(path)
def rows_from_sources(v520,v558):
    response={(row["rayIndex"],row["bandId"]):row for row in v558["rows"]}; rows=[]
    for source in v520["rows"]:
        key=(int(source["rayIndex"]),source["bandId"]); base=response[key]; row={"rowId":f"ray-{key[0]:02d}-{key[1]}-{source['transportMethod']}","rayIndex":key[0],"bandId":key[1],"transportMethod":source["transportMethod"],"geometry":base["geometry"],"screen":base["screen"],"response":{"effectiveBandThroughput":base["instrument"]["effectiveBandThroughput"],"expectedCountsAreObserved":False,"modelId":base["instrument"]["modelId"]},"stokes":{"evpaDeg":source["evpaDeg"],"linearPolarizationFraction":source["linearPolarizationFraction"],"normalizedQ":source["normalizedQ"],"normalizedU":source["normalizedU"],"energyStokes":source["energyStokes"],"photonStokes":source["photonStokes"],"residuals":source["residuals"]},"uncertaintyLedger":{"components":[{"id":"uInstrument","value":None,"status":"unavailable-no-measured-calibration"},{"id":"uObservedFrame","value":None,"status":"unavailable-no-observed-frame"},{"id":"uPhysicalCalibration","value":None,"status":"unavailable-no-measured-physical-uncertainty"}],"combinationStatus":"unavailable-measured-components-missing","rssApplied":False,"crossChannelIndependenceProven":source["uncertainty"]["crossChannelIndependenceProven"]},"source":{"v520ArtifactSha256":v520["artifactSha256"],"v548ArtifactSha256":read(V548)["artifactSha256"],"v558ArtifactSha256":v558["artifactSha256"]},"observed":False,"measured":False,"applicability":source["applicability"]}; row["rowSha256"]=sha(row); rows.append(row)
    return rows
def write_csv(rows):
    fields=["row_id","ray_index","band_id","transport_method","classification","effective_band_throughput","observed","measured","uncertainty_status","row_sha256"]; part=CSV.with_name(f"{CSV.name}.{os.getpid()}.part");
    with part.open("w",encoding="utf-8",newline="") as stream:
        w=csv.DictWriter(stream,fieldnames=fields,lineterminator="\n"); w.writeheader()
        for row in rows:w.writerow({"row_id":row["rowId"],"ray_index":row["rayIndex"],"band_id":row["bandId"],"transport_method":row["transportMethod"],"classification":row["geometry"]["classification"],"effective_band_throughput":row["response"]["effectiveBandThroughput"],"observed":"false","measured":"false","uncertainty_status":row["uncertaintyLedger"]["combinationStatus"],"row_sha256":row["rowSha256"]})
    part.replace(CSV)
def contract(atlas): return {"version":"v559-uncertainty-ledger-validation-contract-v1","generatedAt":FIXED,"v520ArtifactSha256":atlas["source"]["v520ArtifactSha256"],"v548ArtifactSha256":atlas["source"]["v548ArtifactSha256"],"v558ArtifactSha256":atlas["source"]["v558ArtifactSha256"],"atlasFileSha256":fs(ATLAS),"csvFileSha256":fs(CSV),"methodValuesMayNotBeAveraged":True,"rssAppliedWithoutIndependenceProof":False,"measuredValuesMayNotBeSynthesized":True,"denseCampaignStatus":"incomplete-0-of-49"}
def run_validator(c):
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v559-") as name:
        t=Path(name); shutil.copyfile(PORTABLE,t/"validator.py"); shutil.copyfile(ATLAS,t/"atlas.json"); shutil.copyfile(CSV,t/"rows.csv"); atomic(t/"contract.json",c); r=subprocess.run([sys.executable,"validator.py","--contract","contract.json","--atlas","atlas.json","--csv","rows.csv","--output","receipt.json"],cwd=t,capture_output=True,text=True,encoding="utf-8",timeout=120); 
        if r.returncode: raise ValueError(f"v559-validator:{r.stderr.strip()}")
        return read(t/"receipt.json")
def mutation_audit(atlas, base_contract):
    names=("method-average","rss-promotion","measured-promotion","dense-promotion","source-sha","uncertainty-zero","observed-counts","row-count","transport-method","applicability")
    def mutate(name, value, contract):
        if name=="method-average": value["contract"]["methodValuesMayNotBeAveraged"]=False; contract["methodValuesMayNotBeAveraged"]=False
        elif name=="rss-promotion": value["rows"][0]["uncertaintyLedger"]["rssApplied"]=True
        elif name=="measured-promotion": value["rows"][0]["measured"]=True
        elif name=="dense-promotion": value["boundary"]["denseCampaignStatus"]="complete-49-of-49"; contract["denseCampaignStatus"]="complete-49-of-49"
        elif name=="source-sha": value["rows"][0]["source"]["v520ArtifactSha256"]="mutation-source-sha"
        elif name=="uncertainty-zero": value["rows"][0]["uncertaintyLedger"]["components"][0]["value"]=0
        elif name=="observed-counts": value["rows"][0]["response"]["expectedCountsAreObserved"]=True
        elif name=="row-count": value["rows"].pop(); value["counts"]["rowCount"]=23
        elif name=="transport-method": value["rows"][0]["transportMethod"]="method-average"
        elif name=="applicability": value["rows"][0]["applicability"]="measured-calibrated"
    rejected=[]
    for name in names:
        value=json.loads(json.dumps(atlas,ensure_ascii=False)); contract=json.loads(json.dumps(base_contract,ensure_ascii=False)); mutate(name,value,contract)
        for row in value.get("rows",[]): row["rowSha256"]=sha(row)
        unsigned={key:item for key,item in value.items() if key!="artifactSha256"}; value["artifactSha256"]=sha(unsigned)
        with tempfile.TemporaryDirectory(prefix=f"orbit-atlas-v559-mutation-{name}-") as directory:
            target=Path(directory); shutil.copyfile(PORTABLE,target/"validator.py"); shutil.copyfile(CSV,target/"rows.csv"); atomic(target/"atlas.json",value); contract["atlasFileSha256"]=fs(target/"atlas.json"); contract["csvFileSha256"]=fs(target/"rows.csv"); atomic(target/"contract.json",contract)
            result=subprocess.run([sys.executable,"validator.py","--contract","contract.json","--atlas","atlas.json","--csv","rows.csv","--output","receipt.json"],cwd=target,capture_output=True,text=True,encoding="utf-8",timeout=120)
            if result.returncode!=0: rejected.append(name)
    if tuple(rejected)!=names: raise ValueError(f"v559-mutation-audit:{rejected}")
    return {"mode":"validator-subprocess","mutationCount":len(names),"rejectedMutationCount":len(rejected),"mutations":list(names),"rejectedMutations":rejected}
def verify(m):
    if sha(m)!=m.get("artifactSha256") or m.get("status")!="qualified-model-predicted-stokes-uncertainty-measured-unavailable" or m["validation"]["qualifiedSubprocessCount"]!=2 or not m["validation"]["abCanonicalIdentical"] or m["mutationAudit"]["rejectedMutationCount"]!=10 or not m["qualification"]["uncertaintyLedgerQualified"] or m["qualification"]["measuredAuthorityGranted"] or m["boundary"]["denseCampaignStatus"]!="incomplete-0-of-49":raise ValueError("v559-manifest")
    for p in m["products"]:
        path=Path.cwd()/p["path"]
        if fs(path)!=p["fileSha256"]:raise ValueError("v559-product")
    rec=read(RECEIPT)
    if sha(rec)!=rec.get("resultSha256"):raise ValueError("v559-receipt")
def build():
    v520,v548,v558,dense,formal=read(V520),read(V548),read(V558),read(DENSE),read(FORMAL); fe=read(Path.cwd()/str(formal["source"]));
    if v520["status"]!="fixed-band-dual-transport-stokes-qualified-24-model-rows" or v548["counts"]["measuredCalibrationFileCount"]!=0 or not v558["qualification"]["responseProvenanceQualified"] or dense["status"]!="incomplete-0-of-49" or formal["version"]!="v263-current-product-evidence-pointer" or fe["science"]["defaultKernel"]!="legacy-eih-1pn":raise ValueError("v559-upstream")
    OUT.mkdir(parents=True,exist_ok=True);shutil.copyfile(VALIDATOR,PORTABLE); rows=rows_from_sources(v520,v558); write_csv(rows); source={"v520ArtifactSha256":v520["artifactSha256"],"v520FileSha256":fs(V520),"v520Status":v520["status"],"v548ArtifactSha256":v548["artifactSha256"],"v548MeasuredCalibrationFileCount":v548["counts"]["measuredCalibrationFileCount"],"v558ArtifactSha256":v558["artifactSha256"],"v314StateSha256":dense["stateSha256"],"validatorFileSha256":fs(PORTABLE)}
    unsigned={"version":"v559-response-aware-stokes-uncertainty-ledger-v1","generatedAt":FIXED,"status":"qualified-model-predicted-stokes-uncertainty-measured-unavailable","source":source,"contract":{"rowCount":24,"rayCount":4,"bandCount":3,"transportMethodCount":2,"methodValuesMayNotBeAveraged":True,"rssAppliedWithoutIndependenceProof":False,"measuredValuesMayNotBeSynthesized":True,"observedFrameRequiredForMeasuredCounts":True,"physicalUncertaintyCannotMeanZero":True,"sciencePayloadImmutable":True,"cinematicWritebackForbidden":True,"networkAllowed":False,"automaticRetryAllowed":False},"rows":rows,"counts":{"rowCount":24,"rayCount":4,"bandCount":3,"transportMethodCount":2,"walkerPenroseRowCount":12,"parallelTransportRowCount":12,"measuredRowCount":0,"observedCountRowCount":0,"uncertaintyComponentValueCount":0},"qualification":{"uncertaintyLedgerQualified":True,"stokesModelPredictionQualified":True,"independentTransportRowsPreserved":True,"methodValuesAveraged":False,"measuredAuthorityGranted":False,"observedCountsQualified":False,"denseScienceImageQualified":False,"productionPromotionQualified":False},"boundary":{"uncertaintyComponents":"uInstrument/uObservedFrame/uPhysicalCalibration unavailable","expectedCountsAreObserved":False,"observedCountsAvailable":False,"measuredCalibrationFileCount":0,"observedFrameCount":0,"measuredAuthorityGranted":False,"denseCampaignStatus":"incomplete-0-of-49","browserQualification":"not-run","formalProductPointer":"v263","formalDefaultKernel":"legacy-eih-1pn"}}
    pack={**unsigned,"artifactSha256":sha(unsigned)};atomic(ATLAS,pack);c=contract(pack);atomic(CONTRACT,c);a,b=run_validator(c),run_validator(c); 
    if sha(a)!=sha(b):raise ValueError("v559-ab")
    atomic(RECEIPT,a);products=[{"id":"atlas","path":ATLAS.relative_to(Path.cwd()).as_posix(),"mimeType":"application/json","fileSha256":fs(ATLAS),"bytes":ATLAS.stat().st_size,"rowCount":24},{"id":"csv","path":CSV.relative_to(Path.cwd()).as_posix(),"mimeType":"text/csv; charset=utf-8","fileSha256":fs(CSV),"bytes":CSV.stat().st_size,"rowCount":24}];audit=mutation_audit(pack,c);manifest={**pack,"products":products,"validation":{"contractPath":CONTRACT.relative_to(Path.cwd()).as_posix(),"contractFileSha256":fs(CONTRACT),"receiptPath":RECEIPT.relative_to(Path.cwd()).as_posix(),"receiptFileSha256":fs(RECEIPT),"receiptResultSha256":a["resultSha256"],"independentSubprocessAttemptCount":2,"qualifiedSubprocessCount":2,"abCanonicalIdentical":True,"uncertaintyLedgerQualified":True},"mutationAudit":audit,"environment":{"python":platform.python_version()},"artifactSha256":sha({**pack,"products":products,"validation":{"contractPath":CONTRACT.relative_to(Path.cwd()).as_posix(),"contractFileSha256":fs(CONTRACT),"receiptPath":RECEIPT.relative_to(Path.cwd()).as_posix(),"receiptFileSha256":fs(RECEIPT),"receiptResultSha256":a["resultSha256"],"independentSubprocessAttemptCount":2,"qualifiedSubprocessCount":2,"abCanonicalIdentical":True,"uncertaintyLedgerQualified":True},"mutationAudit":audit,"environment":{"python":platform.python_version()}})};atomic(Path.cwd()/"dist/science/kerr-response-uncertainty-ledger-v559/manifest.json",manifest);verify(manifest);return manifest
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--verify",action="store_true");args=parser.parse_args();m=read(Path.cwd()/"dist/science/kerr-response-uncertainty-ledger-v559/manifest.json") if args.verify else build();verify(m);print(json.dumps({"status":m["status"],"artifactSha256":m["artifactSha256"],"rows":24,"methods":"walker-penrose/independent-ks-parallel-transport","validators":"2/2","mutationsRejected":"10/10","uncertaintyValues":0,"measuredRows":0,"denseCampaign":"0/49","formalProductPointer":"v263"},indent=2))
if __name__=="__main__":main()

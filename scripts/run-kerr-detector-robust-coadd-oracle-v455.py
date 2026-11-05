from __future__ import annotations
import hashlib,json,os
from decimal import Decimal,getcontext
from pathlib import Path
getcontext().prec=60;ROOT=Path.cwd();OUT=ROOT/"dist/science/kerr-detector-robust-coadd-v455/python-oracle.json"
rows=[{"fixtureId":"cosmic-ray-stack","frames":[("c0","10","0.04",True,False),("c1","10.2","0.04",True,False),("c2","9.8","0.04",True,False),("c3","150","0.04",True,False),("c4","10.1","0.04",True,False)],"systematic":"0.2"},{"fixtureId":"bad-pixel-stack","frames":[("b0","20","0.04",True,False),("b1","20.1","0.04",True,False),("b2","1000","0.04",True,True),("b3","19.9","0.04",True,False),("b4","20.2","0.04",True,False)],"systematic":"0.3"},{"fixtureId":"missing-frame-stack","frames":[("m0","30","0.09",True,False),("m1","30.2","0.09",True,False),("m2","0","0.09",False,False),("m3","30.1","0.09",True,False),("m4","30.3","0.09",True,False)],"systematic":"0.4"},{"fixtureId":"insufficient-stack","frames":[("i0","5","0.16",True,False),("i1","5.2","0.16",True,False),("i2","0","0.16",False,False),("i3","0","0.16",False,False),("i4","0","0.16",False,False)],"systematic":"0.1"}]
def median(values):
    values=sorted(values);middle=len(values)//2;return values[middle] if len(values)%2 else (values[middle-1]+values[middle])/Decimal(2)
def evaluate(row):
    exclusions=[];eligible=[]
    for frame_id,value,variance,available,bad in row["frames"]:
        if not available:exclusions.append({"frameId":frame_id,"reason":"unavailable"})
        elif bad:exclusions.append({"frameId":frame_id,"reason":"bad-pixel"})
        else:eligible.append((frame_id,Decimal(value),Decimal(variance)))
    if len(eligible)<3:return{"fixtureId":row["fixtureId"],"admissibleForRobustCoadd":False,"rejectionReason":"insufficient-unmasked-frames","includedFrameIds":[],"exclusions":exclusions,"coaddElectron":None,"randomVarianceElectronSquared":None}
    center=median([value for _,value,_ in eligible]);mad=median([abs(value-center) for _,value,_ in eligible]);noise=median([variance.sqrt() for _,_,variance in eligible]);scale=max(Decimal("1.4826")*mad,noise);threshold=Decimal(5)*scale;included=[]
    for frame_id,value,variance in eligible:
        if abs(value-center)>threshold:exclusions.append({"frameId":frame_id,"reason":"robust-outlier"})
        else:included.append((frame_id,value,variance))
    weight_sum=sum(Decimal(1)/variance for _,_,variance in included);coadd=sum(value/variance for _,value,variance in included)/weight_sum
    return{"fixtureId":row["fixtureId"],"admissibleForRobustCoadd":True,"rejectionReason":None,"includedFrameIds":[frame_id for frame_id,_,_ in included],"exclusions":exclusions,"medianElectron":float(center),"madElectron":float(mad),"robustScaleElectron":float(scale),"outlierThresholdElectron":float(threshold),"coaddElectron":float(coadd),"randomVarianceElectronSquared":float(Decimal(1)/weight_sum),"sharedSystematicUpperBoundElectron":float(Decimal(row["systematic"]))}
unsigned={"version":"v455-kerr-detector-robust-coadd-python-oracle-v1","generatedAt":"2026-07-30T00:00:00Z","status":"qualified-60-digit-decimal-mask-robust-coadd-fixture-only","precisionDigits":60,"rows":[evaluate(row) for row in rows],"randomnessUsed":False,"observedFramesAvailable":False,"measuredImageAuthorityGranted":False,"scienceRasterAllowed":False};canonical=json.dumps({key:value for key,value in unsigned.items() if key!="generatedAt"},ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8");artifact={**unsigned,"artifactSha256":hashlib.sha256(canonical).hexdigest()};OUT.parent.mkdir(parents=True,exist_ok=True);part=OUT.with_name(f"{OUT.name}.{os.getpid()}.part");part.write_text(json.dumps(artifact,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");part.replace(OUT);print(json.dumps({"status":artifact["status"],"precisionDigits":60,"admittedRows":3,"rejectedRows":1,"randomnessUsed":False,"scienceRasterRows":0},indent=2))

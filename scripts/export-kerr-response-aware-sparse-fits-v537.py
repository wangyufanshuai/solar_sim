from __future__ import annotations
import hashlib,json,os
from pathlib import Path
from typing import Any
import numpy as np
from astropy.io import fits
ROOT=Path.cwd();SOURCE=ROOT/"dist/science/kerr-response-aware-sparse-image-v536/atlas.json";OUT_DIR=ROOT/"dist/science/kerr-response-aware-sparse-fits-v537";FITS_PATH=OUT_DIR/"response-aware-sparse-table.fits";ATLAS_PATH=OUT_DIR/"atlas.json";TRANSIENT={"generatedAt","artifactSha256","payloadSha256","evidenceSha256","pointerSha256","stageChainSha256"}
def file_sha(path:Path)->str:return hashlib.sha256(path.read_bytes()).hexdigest()
def canonicalize(value:Any)->Any:
    if isinstance(value,list):return[canonicalize(entry)for entry in value]
    if isinstance(value,dict):return{key:canonicalize(value[key])for key in sorted(value)if key not in TRANSIENT}
    return value
def sha(value:Any)->str:return hashlib.sha256(json.dumps(canonicalize(value),ensure_ascii=False,separators=(",",":"),sort_keys=True).encode()).hexdigest()
def atomic_json(path:Path,value:dict[str,Any])->None:
    path.parent.mkdir(parents=True,exist_ok=True);part=path.with_name(f"{path.name}.{os.getpid()}.part");part.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");part.replace(path)
def fits_text(value:Any)->str:
    if isinstance(value,(bytes,np.bytes_)):return value.decode("ascii").strip()
    return str(value).strip()
def build_hdul(source:dict[str,Any])->fits.HDUList:
    rows=source["rows"];primary=fits.PrimaryHDU();primary.header["HASIMAGE"]=(False,"No image HDU or raster pixels");primary.header["SPARSE"]=(True,"Four continuous image-plane samples");primary.header["NSAMPLE"]=(4,"Sparse authority sample count");primary.header["RASTER"]=(False,"Rasterization forbidden");primary.header["INTERPOL"]=(False,"Interpolation forbidden");primary.header["NEAREST"]=(False,"Nearest-pixel assignment forbidden");primary.header["MEASURED"]=(False,"No measured detector authority");primary.header["DENSE"]=(False,"Dense campaign remains 0/49");primary.header["SRCVER"]=source["version"];primary.header["SRCSHA"]=source["artifactSha256"]
    columns=[fits.Column(name="RAY_ID",format="16A",array=np.asarray([row["rayId"]for row in rows],dtype="S16")),fits.Column(name="RAY_INDEX",format="J",array=np.asarray([row["rayIndex"]for row in rows],dtype=np.int32)),fits.Column(name="SPIN_A",format="D",array=np.asarray([row["spinA"]for row in rows],dtype=np.float64)),fits.Column(name="X_CONT",format="D",unit="pixel",array=np.asarray([row["coordinate"]["continuousPixelX"]for row in rows],dtype=np.float64)),fits.Column(name="Y_CONT",format="D",unit="pixel",array=np.asarray([row["coordinate"]["continuousPixelY"]for row in rows],dtype=np.float64)),fits.Column(name="ALPHA_M",format="D",unit="M",array=np.asarray([row["screen"]["alphaM"]for row in rows],dtype=np.float64)),fits.Column(name="BETA_M",format="D",unit="M",array=np.asarray([row["screen"]["betaM"]for row in rows],dtype=np.float64)),fits.Column(name="REDSHIFT",format="D",array=np.asarray([row["responseAwareRadiometry"]["redshiftFactor"]for row in rows],dtype=np.float64)),fits.Column(name="EVPA_DEG",format="D",unit="deg",array=np.asarray([row["polarization"]["evpaDeg"]for row in rows],dtype=np.float64)),fits.Column(name="Q_HAT",format="D",array=np.asarray([row["polarization"]["orientationQHat"]for row in rows],dtype=np.float64)),fits.Column(name="U_HAT",format="D",array=np.asarray([row["polarization"]["orientationUHat"]for row in rows],dtype=np.float64)),fits.Column(name="PHOT_RAD",format="D",unit="ph s-1 m-2 sr-1",array=np.asarray([row["responseAwareRadiometry"]["observerBandpassPhotonRadiancePerSM2Sr"]for row in rows],dtype=np.float64)),fits.Column(name="RESP_J",format="D",array=np.asarray([row["responseAwareRadiometry"]["responseShiftLogJacobian"]for row in rows],dtype=np.float64)),fits.Column(name="NONLIN",format="D",array=np.asarray([row["responseAwareRadiometry"]["finiteShiftNonlinearRemainderRelative"]for row in rows],dtype=np.float64)),fits.Column(name="PHYS_UNC",format="L",array=np.zeros(4,dtype=bool)),fits.Column(name="PIXEL",format="L",array=np.zeros(4,dtype=bool)),fits.Column(name="ROW_SHA",format="64A",array=np.asarray([row["rowSha256"]for row in rows],dtype="S64"))]
    table=fits.BinTableHDU.from_columns(columns,name="SPARSE_SCIENCE");table.header["SCISAMP"]=(True,"Qualified sparse samples");table.header["SCIIMAGE"]=(False,"Not a science image");table.header["PHYSUNC"]=(False,"Physical uncertainty unavailable");table.header["BUNIT"]=("mixed-columns","Use TUNITn per numeric column");return fits.HDUList([primary,table])
def write_candidate(path:Path,source:dict[str,Any])->None:
    if path.exists():path.unlink()
    hdus=build_hdul(source)
    for hdu in hdus:hdu.add_checksum(when="2026-08-02T00:00:00")
    hdus.writeto(path,overwrite=False,checksum=False)
def main()->None:
    source=json.loads(SOURCE.read_text(encoding="utf-8"));rows=source.get("rows",[])
    if source.get("version")!="v536-kerr-response-aware-sparse-image-plane-v1"or sha(source)!=source.get("artifactSha256")or len(rows)!=4 or source.get("counts",{}).get("rasterPixelCount")!=0:raise RuntimeError("v537-source-boundary")
    OUT_DIR.mkdir(parents=True,exist_ok=True);a=OUT_DIR/"candidate-a.fits";b=OUT_DIR/"candidate-b.fits";write_candidate(a,source);write_candidate(b,source)
    if a.read_bytes()!=b.read_bytes():raise RuntimeError("v537-ab-nondeterministic")
    if FITS_PATH.exists():FITS_PATH.unlink()
    a.replace(FITS_PATH);b.unlink()
    with fits.open(FITS_PATH,checksum=True,memmap=False)as hdus:
        hdus.verify("exception")
        if len(hdus)!=2 or hdus[0].data is not None or hdus[0].header["NAXIS"]!=0 or hdus[0].header["HASIMAGE"]or not isinstance(hdus[1],fits.BinTableHDU)or len(hdus[1].data)!=4:raise RuntimeError("v537-hdu-boundary")
        names=list(hdus[1].columns.names);expected=["RAY_ID","RAY_INDEX","SPIN_A","X_CONT","Y_CONT","ALPHA_M","BETA_M","REDSHIFT","EVPA_DEG","Q_HAT","U_HAT","PHOT_RAD","RESP_J","NONLIN","PHYS_UNC","PIXEL","ROW_SHA"]
        if names!=expected or np.any(hdus[1].data["PHYS_UNC"])or np.any(hdus[1].data["PIXEL"]):raise RuntimeError("v537-table-boundary")
        for index,row in enumerate(rows):
            if int(hdus[1].data["RAY_INDEX"][index])!=row["rayIndex"]or fits_text(hdus[1].data["ROW_SHA"][index])!=row["rowSha256"]:raise RuntimeError("v537-row-replay")
        if any(hdu.verify_checksum()!=1 or hdu.verify_datasum()!=1 for hdu in hdus):raise RuntimeError("v537-checksum-validation")
        checksum_cards=sum(1 for hdu in hdus for key in("CHECKSUM","DATASUM")if key in hdu.header)
    manifest_paths=[SOURCE,Path("scripts/export-kerr-response-aware-sparse-fits-v537.py")];manifest=sorted(({"path":path.as_posix() if not path.is_absolute()else path.relative_to(ROOT).as_posix(),"sha256":file_sha(path if path.is_absolute()else ROOT/path)}for path in manifest_paths),key=lambda item:item["path"])
    unsigned={"version":"v537-kerr-response-aware-sparse-fits-table-v1","generatedAt":"2026-08-02T00:00:00Z","status":"sparse-fits-binary-table-qualified-image-hdu-unavailable","source":{"v536ArtifactSha256":source["artifactSha256"],"v536PayloadSha256":source["payloadSha256"]},"fits":{"path":"dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits","fileSha256":file_sha(FITS_PATH),"bytes":FITS_PATH.stat().st_size,"hduCount":2,"primaryNaxis":0,"imageHduCount":0,"binaryTableHduCount":1,"tableName":"SPARSE_SCIENCE","columnCount":17,"rowCount":4,"checksumCardCount":checksum_cards,"checksumValidationPassed":True,"abByteIdentical":True},"counts":{"sparseSampleCount":4,"pixelSampleCount":0,"rasterPixelCount":0,"fitsBinaryTableCount":1,"fitsImageHduCount":0,"pngImageCount":0},"qualification":{"fitsBinaryTableQualified":True,"columnUnitsQualified":True,"rowShaReplayQualified":True,"checksumQualified":True,"deterministicReplayQualified":True,"scienceImageQualified":False,"productionImageQualified":False},"boundary":{"binaryTableIsNotImage":True,"physicalUncertaintyAvailable":False,"measuredCalibrationFiles":0,"sciencePayloadMutationAllowed":False,"cinematicScienceWritebackAllowed":False,"denseCampaignStatus":"incomplete-0-of-49","browserQualification":"not-run","formalProductPointer":"v263","formalDefaultKernel":"legacy-eih-1pn"},"sourceManifest":manifest,"sourceSha256":sha(manifest)};artifact={**unsigned,"artifactSha256":sha(unsigned)};atomic_json(ATLAS_PATH,artifact);print(json.dumps({"status":artifact["status"],"artifactSha256":artifact["artifactSha256"],"fitsFileSha256":artifact["fits"]["fileSha256"],"bytes":artifact["fits"]["bytes"],"rows":4,"columns":17,"imageHdus":0,"checksumCards":checksum_cards},indent=2))
if __name__=="__main__":main()

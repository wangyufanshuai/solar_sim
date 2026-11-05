from __future__ import annotations
import hashlib,json
from pathlib import Path
import numpy as np
from astropy.io import fits
from PIL import Image
ROOT=Path.cwd();OUT=ROOT/"dist/science/kerr-high-energy-response-v426";LOCKS={ROOT/"dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json":"efc3a55ce483f5cf0eb99d582d078186e4287aca582fe6b61bb19dbbad3909e4",ROOT/"dist/science/kerr-detector-calibration-plan-v363/plan.json":"5b6e8b0cdcfc0a9c47d0f9387677ab2ab4e9912c7c061ce894a952d0f723accf",ROOT/"dist/science/kerr-detector-calibration-pack-v364/pack.json":"537b15b1268faa38689bb59f556373407eab2795516e930452604256a83612b6"}
def file_sha(path:Path)->str:
    digest=hashlib.sha256()
    with path.open("rb")as handle:
        while chunk:=handle.read(1024*1024):digest.update(chunk)
    return digest.hexdigest()
def main()->None:
    for path,expected in LOCKS.items():
        if file_sha(path)!=expected:raise RuntimeError(f"v426-history-mutated:{path.name}")
    oracle=json.loads((OUT/"python-response-oracle.json").read_text(encoding="utf-8"));artifact=json.loads((OUT/"response-contract.json").read_text(encoding="utf-8"));manifest=json.loads((OUT/"export-manifest.json").read_text(encoding="utf-8"));view=artifact["view"];fixture=view["fixture"];compilation=fixture["compilation"];response=fixture["manifest"]["response"]
    if oracle["status"]!="qualified-high-energy-response-fixture-compiler-oracle-no-measured-authority" or view["counts"]["fixtureTrueEnergyBinCount"]!=6 or view["counts"]["scienceResponseApplicationCount"]!=0 or fixture["admission"]["status"]!="rejected-test-fixture-nonpublishable" or fixture["admission"]["authorityGranted"]:raise RuntimeError("v426-authority-boundary")
    matrix=np.asarray(response["redistributionMatrix"],dtype=float);response_cov=np.asarray(response["responseParameterCovariance"],dtype=float);redistribution_cov=[np.asarray(entry,dtype=float)for entry in response["redistributionRowCovariances"]]
    if matrix.shape!=(6,6)or np.max(np.abs(np.sum(matrix,axis=1)-1))>=1e-12 or np.min(matrix)<0 or response_cov.shape!=(24,24)or np.max(np.abs(response_cov-response_cov.T))>=1e-12 or np.min(np.linalg.eigvalsh(response_cov))< -1e-12 or any(np.max(np.abs(cov-cov.T))>=1e-12 or np.min(np.linalg.eigvalsh(cov))< -1e-12 or np.max(np.abs(np.sum(cov,axis=1)))>=1e-12 for cov in redistribution_cov):raise RuntimeError("v426-matrix-covariance-gate")
    if compilation["metrics"]["maximumPythonOracleDifference"]>=1e-12 or compilation["counts"]["v425CoveredSourcePredictionCount"]!=24:raise RuntimeError("v426-oracle-gate")
    with fits.open(OUT/manifest["exports"]["fits"]["path"])as opened:
        if len(opened)!=2 or opened[0].data is not None or opened[0].header["HASIMAGE"]or not opened[0].header["FIXTURE"]or opened[0].header["MEASURED"]or opened[0].header["SCIAPPL"]or opened[0].header["COUNTS"]or opened[0].header["DENSE"]or len(opened[1].data)!=6 or np.any(opened[1].data["MEASURED"])or np.any(opened[1].data["SCI_APPL"]):raise RuntimeError("v426-fits-boundary")
    with Image.open(OUT/manifest["exports"]["png"]["path"])as image:
        if image.size!=(1600,980)or image.mode!="RGB":raise RuntimeError("v426-png-boundary")
    if manifest["contractAuthority"]!="qualified"or manifest["fixturePerformanceAuthority"]!="unavailable"or manifest["measuredResponseAuthority"]!="unavailable"or manifest["scienceResponseApplicationCount"]!=0:raise RuntimeError("v426-manifest-boundary")
    print(json.dumps({"status":"passed-v426-python-high-energy-response-products","counts":view["counts"],"metrics":compilation["metrics"],"admission":fixture["admission"]["status"],"measuredResponseAuthority":manifest["measuredResponseAuthority"]},indent=2))
if __name__=="__main__":main()

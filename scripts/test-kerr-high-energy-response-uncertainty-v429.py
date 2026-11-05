from __future__ import annotations
import csv, hashlib, json
from pathlib import Path
import numpy as np
from astropy.io import fits
from PIL import Image
ROOT=Path.cwd();OUT=ROOT/"dist/science/kerr-high-energy-response-uncertainty-v429"
def file_sha(path:Path)->str:
    digest=hashlib.sha256()
    with path.open("rb") as handle:
        while chunk:=handle.read(1024*1024):digest.update(chunk)
    return digest.hexdigest()
def main()->None:
    artifact=json.loads((OUT/"response-uncertainty.json").read_text(encoding="utf-8"));oracle=json.loads((OUT/"uncertainty-oracle.json").read_text(encoding="utf-8"));protocol=json.loads((OUT/"independent-validation-protocol.json").read_text(encoding="utf-8"));exports=json.loads((OUT/"export-manifest.json").read_text(encoding="utf-8"));view=artifact["view"]
    if view["counts"]["observedCountCount"]!=0 or view["counts"]["measuredHoldoutDatasetCount"]!=0 or view["counts"]["measuredValidationRunCount"]!=0 or view["counts"]["residualMetricCount"]!=0 or view["counts"]["scienceResponseApplicationCount"]!=0 or view["authorityBoundary"]["measuredResponseAuthorityGranted"] is not False:raise RuntimeError("v429-authority-boundary")
    metrics=oracle["expected"]["metrics"]
    if metrics["maximumAnalyticComplexStepParameterJacobianDifference"]>=1e-8 or metrics["maximumAnalyticComplexStepRedistributionJacobianDifference"]>=1e-8 or metrics["maximumOutputCovarianceSymmetryAbsolute"]>=1e-6 or metrics["minimumOutputCovarianceEigenvalue"]< -1e-6 or metrics["maximumCovarianceDecompositionResidual"]>=1e-6:raise RuntimeError("v429-metric-boundary")
    if protocol["admission"]["currentStatus"]!="not-run-no-measured-holdout" or protocol["admission"]["measuredAuthorityGranted"] is not False or not protocol["thresholdPolicy"]["postHocThresholdTuningForbidden"]:raise RuntimeError("v429-protocol-boundary")
    with (OUT/"prediction-uncertainty-diagonal.csv").open("r",encoding="utf-8",newline="") as handle:rows=list(csv.DictReader(handle))
    if len(rows)!=24 or any(row["observedCount"]!="" or row["residualApplicability"]!="unavailable-no-measured-holdout" for row in rows):raise RuntimeError("v429-csv-boundary")
    with fits.open(OUT/"response-uncertainty-budget.fits") as opened:
        if len(opened)!=3 or opened[0].data is not None or opened[0].header["OBSCOUNT"]!=0 or opened[0].header["HOLDOUT"]!=0 or opened[0].header["MEASVAL"] or opened[0].header["AUTH"] or opened[0].header["SCIAPPL"]!=0 or opened[0].header["DENSE"] or len(opened[1].data)!=24 or np.any(opened[1].data["OBSERVED"]):raise RuntimeError("v429-fits-boundary")
    with Image.open(OUT/"response-uncertainty-architecture.png") as image:
        if image.size!=(1800,1080) or image.mode!="RGB":raise RuntimeError("v429-png-boundary")
    for entry in exports["exports"].values():
        if file_sha(OUT/entry["path"])!=entry["sha256"]:raise RuntimeError(f"v429-export-sha:{entry['path']}")
    print(json.dumps({"status":"passed-v429-python-response-uncertainty","predictedCounts":24,"observedCounts":0,"holdoutDatasets":0,"measuredValidationRuns":0,"residualMetrics":0,"measuredAuthority":"unavailable","scienceApplications":0},indent=2))
if __name__=="__main__":main()

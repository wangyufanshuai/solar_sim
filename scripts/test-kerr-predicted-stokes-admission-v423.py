from __future__ import annotations
import hashlib, json, math
from pathlib import Path
import numpy as np
from astropy.io import fits
from PIL import Image
ROOT = Path.cwd(); OUT = ROOT / "dist/science/kerr-predicted-stokes-admission-v423"; LOCKS = {ROOT / "dist/science/kerr-stokes-transfer-v406/short-gate.json": "3abf793d1bf53407de93f5ab34abfc3c7eb9fefdfe4b4a1ee505fa802eb3023a", ROOT / "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json": "29953d0a54dbc841c9029c4553bf3566ba664b4c9b231ed5dd09da9b324a02f9"}
def file_sha(path: Path) -> str:
    digest = hashlib.sha256();
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024): digest.update(chunk)
    return digest.hexdigest()
def main() -> None:
    for path, expected in LOCKS.items():
        if file_sha(path) != expected: raise RuntimeError(f"v423-history-mutated:{path.name}")
    oracle = json.loads((OUT / "python-admission-oracle.json").read_text(encoding="utf-8")); artifact = json.loads((OUT / "predicted-stokes-catalog.json").read_text(encoding="utf-8")); manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8")); rows = artifact["view"]["rows"]
    if oracle["status"] != "qualified-sparse-model-predicted-stokes-WCS-identity-no-measurement-authority" or len(rows) != 24: raise RuntimeError("v423-oracle-or-count")
    for row in rows:
        stokes = row["predictedSpectralStokes"]
        if not all(math.isfinite(stokes[key]) for key in ("i", "q", "u", "linearAmplitude", "linearFraction")) or stokes["i"] <= 0 or stokes["v"] is not None or row["provenance"]["predictionNotMeasurement"] is not True or row["pixelSampleAvailable"] or row["interpolationAllowed"]: raise RuntimeError("v423-row-boundary")
        if abs(stokes["q"] / stokes["i"] - stokes["linearFraction"] * math.cos(2 * math.radians(row["evpaDeg"]))) >= 1e-12 or abs(stokes["u"] / stokes["i"] - stokes["linearFraction"] * math.sin(2 * math.radians(row["evpaDeg"]))) >= 1e-12: raise RuntimeError("v423-Stokes-orientation")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["MODPRED"] or opened[0].header["MEASURED"] or opened[0].header["DETECTOR"] or opened[0].header["PIXSAMP"] or opened[0].header["DENSE"] or len(opened[1].data) != 24 or np.any(opened[1].data["MEASURED"]): raise RuntimeError("v423-fits-boundary")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1600, 1000) or image.mode != "RGB": raise RuntimeError("v423-png-boundary")
    if manifest["modelPrediction"] != "qualified" or manifest["measurementAuthority"] != "unavailable" or manifest["rasterAuthority"] != "unavailable": raise RuntimeError("v423-manifest-boundary")
    print(json.dumps({"status": "passed-v423-python-predicted-Stokes-products", "rows": 24, "maxima": artifact["view"]["maxima"], "measurementAuthority": manifest["measurementAuthority"], "rasterAuthority": manifest["rasterAuthority"]}, indent=2))
if __name__ == "__main__": main()

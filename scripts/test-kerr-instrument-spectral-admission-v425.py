from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-instrument-spectral-admission-v425"
LOCKS = {
    ROOT / "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json": "ee46fa0819b9f41e30b4dd053d069c99783a50cb0afcdb2b34e095daa1b5e024",
    ROOT / "dist/science/kerr-polarimeter-calibration-v411/inspect.json": "5bd1831f70860125fb1e841f801566e0c92517cf7d9d6ad7748ad5812f4e2a31",
    ROOT / "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json": "d8972aa256d4ee1818ad3e4075e27c09e20a37c738e0853fa4a44068146e1413",
}
C = 299_792_458.0
H = 6.626_070_15e-34
E_CHARGE = 1.602_176_634e-19


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    for path, expected in LOCKS.items():
        if file_sha(path) != expected:
            raise RuntimeError(f"v425-history-mutated:{path.name}")
    oracle = json.loads((OUT / "python-spectral-admission-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "spectral-admission.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    rows = view["rows"]
    if oracle["status"] != "qualified-all-v424-predictions-outside-v413-domain-response-application-blocked" or len(rows) != 24 or len(view["bandSummaries"]) != 3:
        raise RuntimeError("v425-oracle-or-count")
    for row in rows:
        frequency = row["observedFrequencyHz"]
        if (
            not math.isclose(row["vacuumWavelengthM"], C / frequency, rel_tol=0, abs_tol=0)
            or not math.isclose(row["photonEnergyJ"], H * frequency, rel_tol=0, abs_tol=0)
            or not math.isclose(row["photonEnergyEv"], H * frequency / E_CHARGE, rel_tol=0, abs_tol=0)
            or row["vacuumWavelengthM"] >= 4e-7
            or row["responseEligible"]
            or row["extrapolationAllowed"]
            or row["v413ResponseMatrixApplied"]
            or row["opticalHwpWollastonPhysicalApplicabilityGranted"]
            or row["measuredCalibrationAvailable"]
            or row["detectorProjectionApplied"]
        ):
            raise RuntimeError("v425-row-boundary")
    if view["domains"]["overlapM"] is not None or view["domains"]["overlapFraction"] != 0 or view["counts"]["responseEligibleSourceCount"] != 0 or view["counts"]["v413ResponseMatrixApplicationCount"] != 0 or view["metrics"]["maximumPythonOracleRelativeDifference"] >= 1e-15:
        raise RuntimeError("v425-firewall-boundary")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if (
            opened[0].data is not None
            or opened[0].header["HASIMAGE"]
            or not opened[0].header["SPECAUD"]
            or opened[0].header["RESPAPP"]
            or opened[0].header["EXTRAP"]
            or opened[0].header["MEASURED"]
            or opened[0].header["DETECTOR"]
            or opened[0].header["DENSE"]
            or len(opened[1].data) != 24
            or np.any(opened[1].data["ELIGIBLE"])
            or np.any(opened[1].data["RESP_APPL"])
            or np.any(opened[1].data["MEASURED"])
        ):
            raise RuntimeError("v425-fits-boundary")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1600, 900) or image.mode != "RGB":
            raise RuntimeError("v425-png-boundary")
    if manifest["spectralApplicabilityAudit"] != "qualified" or manifest["responseEligibleSourceCount"] != 0 or manifest["responseMatrixApplicationCount"] != 0 or manifest["extrapolation"] != "forbidden" or manifest["measurementAuthority"] != "unavailable" or manifest["detectorAuthority"] != "unavailable":
        raise RuntimeError("v425-manifest-boundary")
    print(json.dumps({
        "status": "passed-v425-python-spectral-applicability-products",
        "sourcePredictionCount": 24,
        "responseEligibleSourceCount": 0,
        "domains": view["domains"],
        "bands": view["bandSummaries"],
        "metrics": view["metrics"],
    }, indent=2))


if __name__ == "__main__":
    main()

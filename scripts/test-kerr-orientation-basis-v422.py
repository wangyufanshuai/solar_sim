from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-polarization-orientation-basis-v422"
V421 = ROOT / "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json"
V421_SHA = "9b0165ba2af5781e734d34bb814dbb4793bdee76c0cdec7412aca6f558550a40"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def axial_difference(left: float, right: float) -> float:
    difference = abs(left - right) % 180.0
    return min(difference, 180.0 - difference)


def main() -> None:
    if file_sha(V421) != V421_SHA:
        raise RuntimeError("v422-v421-history-mutated")
    oracle = json.loads((OUT / "python-orientation-basis-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "orientation-basis-catalog.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    rows = artifact["view"]["rows"]
    if oracle["status"] != "qualified-independent-double-angle-orientation-basis-no-stokes-measurement" or len(rows) != 4:
        raise RuntimeError("v422-oracle-or-row-count")
    for row in rows:
        basis = row["orientationBasis"]
        recovered = 0.5 * math.degrees(math.atan2(basis["uHat"], basis["qHat"]))
        if abs(math.hypot(basis["qHat"], basis["uHat"]) - 1.0) >= 1e-12 or axial_difference(recovered, row["authorityEvpaDeg"]) >= 1e-12:
            raise RuntimeError("v422-basis-recovery")
        if any(value is not None for value in row["measurements"].values()) or row["applicabilityMask"]["stokesMeasurementAvailable"] or row["nearestPixelAssignmentAllowed"] or row["interpolationAllowed"]:
            raise RuntimeError("v422-measurement-boundary")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["ORIBASIS"] or opened[0].header["MEASSTOK"] or opened[0].header["RASKMASK"] or opened[0].header["NEARPIX"] or opened[0].header["INTERPOL"] or len(opened[1].data) != 4 or np.any(opened[1].data["STOK_AVAIL"]):
            raise RuntimeError("v422-fits-boundary")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1600, 900) or image.mode != "RGB":
            raise RuntimeError("v422-png-boundary")
    if manifest["rasterMaskGenerated"] or manifest["stokesMeasurement"] != "unavailable-no-I-Q-U-V" or manifest["nearestPixelAssignmentAllowed"] or manifest["interpolationAllowed"]:
        raise RuntimeError("v422-manifest-boundary")
    print(json.dumps({"status": "passed-v422-python-orientation-basis-products", "rows": 4, "maxima": artifact["view"]["maxima"], "stokesMeasurement": manifest["stokesMeasurement"], "rasterMaskGenerated": False}, indent=2))


if __name__ == "__main__":
    main()

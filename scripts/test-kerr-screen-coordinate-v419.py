from __future__ import annotations

import json
import math
from pathlib import Path

from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-screen-coordinate-provenance-v419"


def main() -> None:
    oracle = json.loads((OUT / "python-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "screen-coordinate-provenance.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    if oracle["status"] != "qualified-independent-screen-coordinate-replay" or len(oracle["rows"]) != 4:
        raise RuntimeError("v419-oracle-status")
    if max(oracle["maxima"].values()) >= 1e-12:
        raise RuntimeError("v419-oracle-threshold")
    rows = artifact["view"]["rows"]
    expected = [(-8.0, 9.0), (-3.0, 9.0), (3.0, 9.0), (8.0, 9.0)]
    if [(row["alphaM"], row["betaM"]) for row in rows] != expected:
        raise RuntimeError("v419-coordinate-identity")
    if any(not math.isfinite(row["polarization"]["v313WalkerPenroseEvpaDeg"]) for row in rows):
        raise RuntimeError("v419-evpa-finite")
    if any(row["pixelCoordinate"]["status"] != "unavailable" for row in rows):
        raise RuntimeError("v419-pixel-boundary")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if len(opened) != 2 or not isinstance(opened[1], fits.BinTableHDU) or len(opened[1].data) != 4:
            raise RuntimeError("v419-fits-table")
        if opened[0].header["SCIMAP"] or opened[0].header["PIXWCS"]:
            raise RuntimeError("v419-fits-image-boundary")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1400, 720) or image.mode != "RGB":
            raise RuntimeError("v419-png-boundary")
    print(json.dumps({"status": "passed-v419-python-exports", "rows": 4, "oracleMax": max(oracle["maxima"].values()), "fits": "binary-table", "png": "sparse-quiver"}, indent=2))


if __name__ == "__main__":
    main()

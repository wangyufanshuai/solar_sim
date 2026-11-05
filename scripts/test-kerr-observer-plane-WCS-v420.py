from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-observer-plane-WCS-v420"


def main() -> None:
    oracle = json.loads((OUT / "python-wcs-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "observer-plane-WCS.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    if oracle["status"] != "qualified-independent-astropy-linear-WCS-roundtrip" or max(oracle["maxima"].values()) >= 1e-12:
        raise RuntimeError("v420-oracle-gate")
    rows = artifact["view"]["catalog"]["rows"]
    if len(rows) != 4 or any(row["intensity"] is not None or row["stokes"] is not None or row["interpolationAllowed"] for row in rows):
        raise RuntimeError("v420-no-raster-boundary")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if opened[0].data is not None or opened[0].header["HASIMAGE"] or opened[0].header["INTERPOL"] or len(opened[1].data) != 4:
            raise RuntimeError("v420-fits-boundary")
        header = opened[0].header.copy()
        header["NAXIS"] = 2
        header["NAXIS1"] = 384
        header["NAXIS2"] = 384
        wcs = WCS(header)
        world = np.asarray([[row["alphaM"], row["betaM"]] for row in rows], dtype=float)
        pixels = wcs.all_world2pix(world, 1)
        expected = np.asarray([[row["continuousPixelX"], row["continuousPixelY"]] for row in rows], dtype=float)
        if float(np.max(np.abs(pixels - expected))) >= 1e-10:
            raise RuntimeError("v420-fits-WCS")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1400, 800) or image.mode != "RGB":
            raise RuntimeError("v420-png")
    print(json.dumps({"status": "passed-v420-python-WCS-exports", "rows": 4, "worldRoundtrip": oracle["maxima"]["worldRoundtripResidualM"], "fitsPrimaryData": None, "interpolation": False}, indent=2))


if __name__ == "__main__":
    main()

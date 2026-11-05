from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-axial-polarization-vectors-v421"
HISTORICAL = {
    ROOT / "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json": "adaebc0d0500c1b856dd8875a6f9edccf9ebd3ca07867d2cd3fdba76007d28aa",
    ROOT / "dist/science/kerr-screen-coordinate-provenance-v419/sparse-screen-quiver.png": "e2a13c42d82b29396c59b763142e6b19aca3ed498171ac18128b6789836f9486",
    ROOT / "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json": "e6c8ca822d81575d640b90ad87eeb49658d5c88afc44f473b0620fcefadac337",
    ROOT / "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS-grid.png": "6392b55ef2d701bea7ac8bf0581acb5bc70101d1a95020ba7003f62d2f2cb4a0",
}


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
    for path, expected in HISTORICAL.items():
        if file_sha(path) != expected:
            raise RuntimeError(f"v421-historical-file-mutated:{path.name}")
    oracle = json.loads((OUT / "python-axial-vector-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "axial-vector-catalog.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    rows = artifact["view"]["rows"]
    if oracle["status"] != "qualified-independent-axial-vector-WCS-endpoints" or len(rows) != 4:
        raise RuntimeError("v421-oracle-or-row-count")
    if any(row["intensity"] is not None or row["stokesAmplitude"] is not None or row["interpolationAllowed"] for row in rows):
        raise RuntimeError("v421-raster-boundary")
    for row in rows:
        chi = math.radians(row["authorityEvpaDeg"])
        direction = row["worldDirectionUnit"]
        if abs(direction["alpha"] - math.sin(chi)) >= 1e-12 or abs(direction["beta"] - math.cos(chi)) >= 1e-12:
            raise RuntimeError("v421-direction-convention")
        negative = row["presentationGlyph"]["negative"]
        positive = row["presentationGlyph"]["positive"]
        recovered = math.degrees(math.atan2(positive["alphaM"] - negative["alphaM"], positive["betaM"] - negative["betaM"]))
        if axial_difference(recovered, row["authorityEvpaDeg"]) >= 1e-12:
            raise RuntimeError("v421-EVPA-recovery")
        shifted = math.radians(row["authorityEvpaDeg"] + 180.0)
        center = np.asarray([(negative["alphaM"] + positive["alphaM"]) / 2.0, (negative["betaM"] + positive["betaM"]) / 2.0])
        shifted_direction = np.asarray([math.sin(shifted), math.cos(shifted)])
        if float(np.max(np.abs((center - 2.0 * shifted_direction) - np.asarray([positive["alphaM"], positive["betaM"]])))) >= 1e-12:
            raise RuntimeError("v421-axial-plus-180")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["AXIAL"] or opened[0].header["INTENS"] or opened[0].header["INTERPOL"] or len(opened[1].data) != 4:
            raise RuntimeError("v421-fits-boundary")
        header = opened[0].header.copy()
        header["NAXIS"] = 2
        header["NAXIS1"] = 384
        header["NAXIS2"] = 384
        wcs = WCS(header)
        world = np.asarray([[row["presentationGlyph"][side][axis] for axis in ("alphaM", "betaM")] for row in rows for side in ("negative", "positive")], dtype=float)
        pixels = np.asarray([[row["presentationGlyph"][side][axis] for axis in ("pixelX", "pixelY")] for row in rows for side in ("negative", "positive")], dtype=float)
        if float(np.max(np.abs(wcs.all_world2pix(world, 1) - pixels))) >= 1e-10:
            raise RuntimeError("v421-fits-endpoint-WCS")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1440, 840) or image.mode != "RGB":
            raise RuntimeError("v421-png-boundary")
    if manifest["historicalFilesOverwritten"] or manifest["priorV419V420PngOrientation"] != "withdrawn-display-only-90-degree-convention-mismatch":
        raise RuntimeError("v421-history-audit")
    print(json.dumps({
        "status": "passed-v421-python-axial-vector-products",
        "rows": 4,
        "maxima": artifact["view"]["maxima"],
        "historicalFilesOverwritten": False,
        "fitsImage": manifest["fitsImage"],
    }, indent=2))


if __name__ == "__main__":
    main()

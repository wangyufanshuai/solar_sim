from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-predicted-polarimeter-v424"
LOCKS = {
    ROOT / "dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json": "121d7ec75ae3ad5fad7f2abd0e07a32ad5181cd2e8c1decf55599364ecf25e73",
    ROOT / "dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json": "fce8084abd73c90a8c087d1b7605b4d4483dc65ddefeb95198291e65b3941776",
}


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    for path, expected in LOCKS.items():
        if file_sha(path) != expected:
            raise RuntimeError(f"v424-history-mutated:{path.name}")
    oracle = json.loads((OUT / "python-modulation-oracle.json").read_text(encoding="utf-8"))
    artifact = json.loads((OUT / "predicted-ideal-dual-beam.json").read_text(encoding="utf-8"))
    manifest = json.loads((OUT / "export-manifest.json").read_text(encoding="utf-8"))
    view = artifact["view"]
    rows = view["modulationRows"]
    reconstructions = view["reconstructions"]
    if (
        oracle["status"] != "qualified-ideal-model-predicted-modulation-no-measurement-authority"
        or len(rows) != 96
        or len(reconstructions) != 24
        or view["counts"]["predictedBeamSpectralRadianceCount"] != 192
    ):
        raise RuntimeError("v424-oracle-or-count")
    grouped: dict[tuple[str, float, str], list[dict[str, object]]] = {}
    for row in rows:
        values = (
            row["predictedOrdinarySpectralRadiance"],
            row["predictedExtraordinarySpectralRadiance"],
            row["predictedBeamSumSpectralRadiance"],
            row["predictedNormalizedFluxDifference"],
        )
        if (
            not all(math.isfinite(value) for value in values)
            or row["predictedOrdinarySpectralRadiance"] < 0
            or row["predictedExtraordinarySpectralRadiance"] < 0
            or row["provenance"]["predictionNotMeasurement"] is not True
            or row["provenance"]["photonOrElectronCountsProduced"] is not False
            or row["provenance"]["measuredMuellerCalibrationApplied"] is not False
        ):
            raise RuntimeError("v424-row-boundary")
        phase = math.radians(4.0 * row["hwpAngleDeg"])
        expected = row["sourceNormalizedStokes"]["qOverI"] * math.cos(phase) + row["sourceNormalizedStokes"]["uOverI"] * math.sin(phase)
        if abs(row["predictedNormalizedFluxDifference"] - expected) >= 1e-12:
            raise RuntimeError("v424-flux-law")
        key = (row["rayId"], row["observedFrequencyHz"], row["transportMethod"])
        grouped.setdefault(key, []).append(row)
    if len(grouped) != 24 or any(len(group) != 4 for group in grouped.values()):
        raise RuntimeError("v424-four-state-completeness")
    if view["maxima"]["pythonOracleDifference"] >= 1e-12 or view["maxima"]["nonnegativeBeamViolation"] != 0:
        raise RuntimeError("v424-maxima")
    with fits.open(OUT / manifest["exports"]["fits"]["path"]) as opened:
        if (
            opened[0].data is not None
            or opened[0].header["HASIMAGE"]
            or not opened[0].header["MODPRED"]
            or opened[0].header["MEASURED"]
            or opened[0].header["DETECTOR"]
            or opened[0].header["COUNTS"]
            or opened[0].header["DENSE"]
            or len(opened[1].data) != 96
            or np.any(opened[1].data["MEASURED"])
            or np.any(opened[1].data["COUNTS"])
        ):
            raise RuntimeError("v424-fits-boundary")
    with Image.open(OUT / manifest["exports"]["png"]["path"]) as image:
        if image.size != (1600, 920) or image.mode != "RGB":
            raise RuntimeError("v424-png-boundary")
    if (
        manifest["modelPrediction"] != "qualified"
        or manifest["measurementAuthority"] != "unavailable"
        or manifest["detectorAuthority"] != "unavailable"
        or manifest["photonOrElectronCounts"] != "unavailable"
        or manifest["pixelRasterAuthority"] != "unavailable"
    ):
        raise RuntimeError("v424-manifest-boundary")
    print(json.dumps({
        "status": "passed-v424-python-predicted-polarimeter-products",
        "modulationRows": 96,
        "predictedBeamSpectralRadiances": 192,
        "reconstructions": 24,
        "maxima": view["maxima"],
        "measurementAuthority": manifest["measurementAuthority"],
        "detectorAuthority": manifest["detectorAuthority"],
    }, indent=2))


if __name__ == "__main__":
    main()

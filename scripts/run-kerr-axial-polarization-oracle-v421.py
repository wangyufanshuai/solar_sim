from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np
from astropy.wcs import WCS


ROOT = Path.cwd()
V420 = ROOT / "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json"
V418 = ROOT / "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json"
OUTPUT = ROOT / "dist/science/kerr-axial-polarization-vectors-v421/python-axial-vector-oracle.json"
V420_ARTIFACT_SHA = "db07f09edfdf76cadaf8a3d709fb4c4781e5b71750b2e6c0d2fbe55a17e19152"
V418_ARTIFACT_SHA = "89bcfa79f4fcbcbddffcff8779d6b92eba1f7eff0e961834e44e063aae586e81"
HALF_LENGTH_M = 2.0


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonical(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "artifactSha256"}
        }
    return value


def value_sha(value: Any) -> str:
    payload = json.dumps(
        canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode()
    return hashlib.sha256(payload).hexdigest()


def atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def axial_difference_deg(left: float, right: float) -> float:
    difference = abs(left - right) % 180.0
    return min(difference, 180.0 - difference)


def endpoint_set_residual(
    negative: np.ndarray,
    positive: np.ndarray,
    shifted_negative: np.ndarray,
    shifted_positive: np.ndarray,
) -> float:
    return float(
        max(
            np.max(np.abs(negative - shifted_positive)),
            np.max(np.abs(positive - shifted_negative)),
        )
    )


def main() -> None:
    v420 = json.loads(V420.read_text(encoding="utf-8"))
    v418 = json.loads(V418.read_text(encoding="utf-8"))
    if (
        v420.get("artifactSha256") != V420_ARTIFACT_SHA
        or v418.get("artifactSha256") != V418_ARTIFACT_SHA
    ):
        raise RuntimeError("v421-source-lock")

    contract = v420["view"]["wcs"]
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [contract["crpix1"], contract["crpix2"]]
    wcs.wcs.cdelt = np.asarray(
        [contract["cdelt1MPerPixel"], contract["cdelt2MPerPixel"]], dtype=float
    )
    wcs.wcs.crval = [contract["crval1M"], contract["crval2M"]]
    wcs.wcs.ctype = [contract["ctype1"], contract["ctype2"]]
    fixtures = {row["rayIndex"]: row for row in v418["view"]["rows"]}
    rows: list[dict[str, Any]] = []

    for source in v420["view"]["catalog"]["rows"]:
        fixture = fixtures.get(source["rayIndex"])
        if fixture is None or fixture["rayId"] != source["rayId"]:
            raise RuntimeError("v421-fixture-identity")
        chi = math.radians(float(source["authorityEvpaDeg"]))
        direction = np.asarray([math.sin(chi), math.cos(chi)], dtype=float)
        center = np.asarray([source["alphaM"], source["betaM"]], dtype=float)
        negative_world = center - HALF_LENGTH_M * direction
        positive_world = center + HALF_LENGTH_M * direction
        pixels = wcs.all_world2pix(
            np.asarray([negative_world, positive_world], dtype=float), 1
        )
        restored = wcs.all_pix2world(pixels, 1)
        shifted_direction = np.asarray(
            [math.sin(chi + math.pi), math.cos(chi + math.pi)], dtype=float
        )
        shifted_negative = center - HALF_LENGTH_M * shifted_direction
        shifted_positive = center + HALF_LENGTH_M * shifted_direction
        recovered = math.degrees(
            math.atan2(
                positive_world[0] - negative_world[0],
                positive_world[1] - negative_world[1],
            )
        )
        tensor = np.asarray([math.cos(2.0 * chi), math.sin(2.0 * chi)])
        rows.append(
            {
                "rayIndex": source["rayIndex"],
                "rayId": source["rayId"],
                "authorityEvpaDeg": source["authorityEvpaDeg"],
                "negative": {
                    "alphaM": float(negative_world[0]),
                    "betaM": float(negative_world[1]),
                    "pixelX": float(pixels[0, 0]),
                    "pixelY": float(pixels[0, 1]),
                },
                "positive": {
                    "alphaM": float(positive_world[0]),
                    "betaM": float(positive_world[1]),
                    "pixelX": float(pixels[1, 0]),
                    "pixelY": float(pixels[1, 1]),
                },
                "axialTensorCos": float(tensor[0]),
                "axialTensorSin": float(tensor[1]),
                "directionNormResidual": float(abs(np.linalg.norm(direction) - 1.0)),
                "axialTensorNormResidual": float(abs(np.linalg.norm(tensor) - 1.0)),
                "worldPixelWorldResidualM": float(
                    np.max(np.abs(restored - np.asarray([negative_world, positive_world])))
                ),
                "recoveredAxialEvpaResidualDeg": axial_difference_deg(
                    recovered, float(source["authorityEvpaDeg"])
                ),
                "plus180EndpointSetResidualM": endpoint_set_residual(
                    negative_world,
                    positive_world,
                    shifted_negative,
                    shifted_positive,
                ),
                "countingFixtureSigmaEvpaDeg": fixture["instrumentFixture"]["counting"]["marginalSigmaEvpaDeg"],
                "calibrationFixtureSigmaEvpaDeg": fixture["instrumentFixture"]["calibration"]["marginalSigmaEvpaDeg"],
            }
        )

    maxima = {
        key: max(float(row[key]) for row in rows)
        for key in (
            "directionNormResidual",
            "axialTensorNormResidual",
            "worldPixelWorldResidualM",
            "recoveredAxialEvpaResidualDeg",
            "plus180EndpointSetResidualM",
        )
    }
    if (
        maxima["directionNormResidual"] >= 1e-12
        or maxima["axialTensorNormResidual"] >= 1e-12
        or maxima["worldPixelWorldResidualM"] >= 1e-12
        or maxima["recoveredAxialEvpaResidualDeg"] >= 1e-12
        or maxima["plus180EndpointSetResidualM"] >= 1e-12
    ):
        raise RuntimeError(f"v421-python-axial-vector-gate:{maxima}")

    unsigned = {
        "version": "v421-kerr-axial-vector-python-oracle-v1",
        "generatedAt": max(v420["generatedAt"], v418["generatedAt"]),
        "status": "qualified-independent-axial-vector-WCS-endpoints",
        "source": {
            "v420ObserverWcsArtifactSha256": V420_ARTIFACT_SHA,
            "v418InstrumentFixtureArtifactSha256": V418_ARTIFACT_SHA,
        },
        "convention": {
            "evpaDefinition": "atan2-horizontal-alpha-vertical-beta-modulo-180-degrees",
            "zeroDirection": "plus-beta",
            "positiveDirection": "toward-plus-alpha",
            "worldDirection": "dAlpha=sin-chi-dBeta=cos-chi",
            "imageDirection": "dx=sin-chi-dy=minus-cos-chi",
        },
        "halfLengthM": HALF_LENGTH_M,
        "rows": rows,
        "maxima": maxima,
        "intensityGenerated": False,
        "stokesAmplitudeGenerated": False,
        "confidenceWedgeGenerated": False,
        "interpolationAllowed": False,
        "historicalFilesOverwritten": False,
        "denseShardExecuted": False,
        "boundary": "independent-four-ray-axial-vector-and-WCS-endpoint-oracle-no-raster-values",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic(OUTPUT, artifact)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "rowCount": len(rows),
                "maxima": maxima,
                "historicalFilesOverwritten": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

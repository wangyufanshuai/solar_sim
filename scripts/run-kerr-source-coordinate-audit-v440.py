from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-source-coordinate-audit-v440"


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha(value: object) -> str:
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    part.replace(path)


def main() -> None:
    v425_path = ROOT / "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json"
    v439_path = ROOT / "dist/science/kerr-scientific-image-availability-v439/scientific-image-availability-oracle.json"
    v425 = json.loads(v425_path.read_text(encoding="utf-8"))
    v439 = json.loads(v439_path.read_text(encoding="utf-8"))
    if v439["qualification"]["imageBoundaryQualified"] is not True or v439["counts"]["responseBackedPixelCount"] != 0:
        raise RuntimeError("v440-v439-boundary")
    rows = []
    for source in v425["view"]["rows"]:
        continuous = source["continuousCoordinate"]
        if continuous["semantics"] != "FITS-1-based-continuous-source-coordinate-not-pixel-sample" or source["responseEligible"] is not False or source["v413ResponseMatrixApplied"] is not False:
            raise RuntimeError(f"v440-coordinate-boundary:{source['rayId']}")
        rows.append({
            "rayId": source["rayId"],
            "rayIndex": source["rayIndex"],
            "transportMethod": source["transportMethod"],
            "observedFrequencyHz": source["observedFrequencyHz"],
            "pixelX": continuous["pixelX"],
            "pixelY": continuous["pixelY"],
            "coordinateKind": "continuous-source-coordinate",
            "coordinateSemantics": continuous["semantics"],
            "pixelSample": False,
            "detectorPixel": False,
            "rasterEligible": False,
            "responseEligible": False,
            "responseMatrixApplied": False,
            "boundary": "source-coordinate-only-no-detector-projection",
        })
    if len(rows) != 24 or any(row["pixelSample"] or row["detectorPixel"] or row["rasterEligible"] for row in rows):
        raise RuntimeError("v440-coordinate-count")
    contract = {
        "version": "v440-kerr-source-coordinate-contract-v1",
        "status": "continuous-source-coordinate-audit-qualified-detector-pixel-projection-unavailable",
        "sourceRequirements": ["v425-continuous-coordinate", "v439-sparse-image-boundary", "v438-measured-response-admission"],
        "coordinateConvention": {"frame": "v424-source-image-plane", "origin": "FITS-1-based", "semantics": "continuous-source-coordinate-not-pixel-sample", "subpixelInterpretation": "not-a-detector-measurement"},
        "projectionPolicy": {"detectorProjectionAvailable": False, "pixelSamplingAvailable": False, "interpolationAllowed": False, "rasterizationAllowed": False, "responseConvolutionAllowed": False},
        "scienceRenderer": {"sourceCoordinatesDisplayAllowed": True, "detectorPixelsRequiredForImage": True, "pixelSampleDisplayForbidden": True, "linearDisplayOnly": True, "scientificFieldMutation": False},
        "cinematicRenderer": {"sourceCoordinateGeometryReuseAllowed": True, "seedRequired": True, "presentationOnly": True, "mayDecorateCoordinateOverlay": True, "mayClaimDetectorImage": False, "scienceWritebackForbidden": True, "scientificFieldMutation": False},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "continuous-source-coordinates-are-not-detector-pixels-and-cannot-be-rasterized-without-measured-response-and-projection",
    }
    unsigned = {
        "version": "v440-kerr-source-coordinate-audit-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-source-coordinate-audit-detector-pixel-projection-unavailable",
        "sourceV425ArtifactSha256": v425["artifactSha256"],
        "sourceV425FileSha256": file_sha(v425_path),
        "sourceV439ArtifactSha256": v439["artifactSha256"],
        "sourceV439FileSha256": file_sha(v439_path),
        "rows": rows,
        "contract": contract,
        "counts": {"sourceCoordinateRowCount": 24, "detectorPixelCount": 0, "pixelSampleCount": 0, "rasterEligibleCount": 0, "responseConvolutionCount": 0, "scienceImageApplicationCount": 0, "cinematicScienceWritebackCount": 0},
        "qualification": {"sourceCoordinateAuditQualified": True, "coordinateSemanticsQualified": True, "detectorPixelProjectionAvailable": False, "rasterizationBlocked": True, "responseConvolutionBlocked": True, "scienceImageApplication": False, "cinematicReadonlyBoundaryQualified": True, "browserQualification": "not-run", "denseAuthority": False},
        "networkAttempted": False,
        "detectorProjectionAttempted": False,
        "rasterizationAttempted": False,
        "denseShardExecuted": False,
        "boundary": "v440-source-coordinate-only-no-detector-pixels-no-raster-no-response-convolution",
    }
    oracle = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic_json(OUT / "source-coordinate-contract.json", contract)
    atomic_json(OUT / "source-coordinate-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "sourceCoordinateRows": 24, "detectorPixels": 0, "rasterEligible": 0, "denseAuthority": False}, indent=2))


if __name__ == "__main__":
    main()

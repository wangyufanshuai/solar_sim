from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-wcs-projection-availability-v441"


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
    v420_path = ROOT / "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json"
    v440_path = ROOT / "dist/science/kerr-source-coordinate-audit-v440/source-coordinate-oracle.json"
    v438_path = ROOT / "dist/science/kerr-measured-response-admission-v438/measured-response-admission-oracle.json"
    v420 = json.loads(v420_path.read_text(encoding="utf-8"))
    v440 = json.loads(v440_path.read_text(encoding="utf-8"))
    v438 = json.loads(v438_path.read_text(encoding="utf-8"))
    if v420["view"]["maxima"]["pythonAstropyPixelDifference"] != 0 or v420["view"]["maxima"]["tsWorldPixelWorldRoundtripResidualM"] >= 1e-12:
        raise RuntimeError("v441-v420-wcs")
    if v440["counts"]["detectorPixelCount"] != 0 or v438["qualification"]["scienceAdmissionGranted"] is not False:
        raise RuntimeError("v441-source-boundary")
    rows = []
    max_coordinate_join_residual = 0.0
    for wcs_row in v420["view"]["catalog"]["rows"]:
        matches = [row for row in v440["rows"] if row["rayId"] == wcs_row["rayId"]]
        if len(matches) != 6:
            raise RuntimeError(f"v441-coordinate-join:{wcs_row['rayId']}")
        residual = max(max(abs(row["pixelX"] - wcs_row["continuousPixelX"]), abs(row["pixelY"] - wcs_row["continuousPixelY"])) for row in matches)
        max_coordinate_join_residual = max(max_coordinate_join_residual, residual)
        rows.append({
            "rayId": wcs_row["rayId"],
            "rayIndex": wcs_row["rayIndex"],
            "alphaM": wcs_row["alphaM"],
            "betaM": wcs_row["betaM"],
            "continuousPixelX": wcs_row["continuousPixelX"],
            "continuousPixelY": wcs_row["continuousPixelY"],
            "worldRoundtripResidualM": max(wcs_row["worldRoundtripAlphaResidualM"], wcs_row["worldRoundtripBetaResidualM"]),
            "sourceCoordinateMatchCount": len(matches),
            "sourceCoordinateJoinResidualPixel": residual,
            "wcsCoordinateAuthority": True,
            "detectorGeometryAuthority": False,
            "psfAuthority": False,
            "pixelResponseAuthority": False,
            "rasterEligible": False,
        })
    if len(rows) != 4 or max_coordinate_join_residual >= 1e-12:
        raise RuntimeError("v441-join-residual")
    contract = {
        "version": "v441-kerr-wcs-projection-availability-contract-v1",
        "status": "linear-wcs-coordinate-authority-qualified-detector-projection-blocked",
        "sourceRequirements": ["v420-independent-astropy-linear-wcs", "v440-source-coordinate-audit", "v438-measured-response-admission"],
        "wcsAuthority": {"coordinateTransformAvailable": True, "astropyOracleQualified": True, "linearWorldToPixelOnly": True, "rasterValuesAvailable": False},
        "detectorProjection": {"measuredGeometryAvailable": False, "psfAvailable": False, "pixelResponseAvailable": False, "distortionCalibrationAvailable": False, "projectionAllowed": False, "convolutionAllowed": False},
        "scienceRenderer": {"wcsGridDisplayAllowed": True, "sourceCoordinateDisplayAllowed": True, "detectorProjectionRequiredForImage": True, "psfSynthesisForbidden": True, "rasterizationForbidden": True, "scientificFieldMutation": False},
        "cinematicRenderer": {"wcsGridStylingAllowed": True, "seedRequired": True, "presentationOnly": True, "maySynthesizePsf": False, "mayClaimDetectorImage": False, "scienceWritebackForbidden": True, "scientificFieldMutation": False},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "linear-observer-wcs-is-qualified-but-measured-detector-geometry-psf-pixel-response-and-raster-authority-are-unavailable",
    }
    unsigned = {
        "version": "v441-kerr-wcs-projection-availability-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-linear-wcs-coordinate-authority-detector-projection-blocked",
        "sourceV420ArtifactSha256": v420["artifactSha256"],
        "sourceV420FileSha256": file_sha(v420_path),
        "sourceV440ArtifactSha256": v440["artifactSha256"],
        "sourceV440FileSha256": file_sha(v440_path),
        "sourceV438ArtifactSha256": v438["artifactSha256"],
        "sourceV438FileSha256": file_sha(v438_path),
        "wcs": v420["view"]["wcs"],
        "rows": rows,
        "maxima": {"worldRoundtripResidualM": v420["view"]["maxima"]["tsWorldPixelWorldRoundtripResidualM"], "pythonAstropyPixelDifference": v420["view"]["maxima"]["pythonAstropyPixelDifference"], "sourceCoordinateJoinResidualPixel": max_coordinate_join_residual},
        "contract": contract,
        "counts": {"wcsSourceCount": 4, "joinedSourceCoordinateRowCount": 24, "detectorGeometryCount": 0, "psfModelCount": 0, "pixelResponseCount": 0, "detectorProjectionCount": 0, "rasterProductCount": 0, "cinematicScienceWritebackCount": 0},
        "qualification": {"wcsCoordinateAuthorityQualified": True, "astropyOracleQualified": True, "sourceCoordinateJoinQualified": True, "detectorGeometryAuthority": False, "psfAuthority": False, "pixelResponseAuthority": False, "detectorProjectionBlocked": True, "rasterizationBlocked": True, "cinematicReadonlyBoundaryQualified": True, "browserQualification": "not-run", "denseAuthority": False},
        "networkAttempted": False,
        "detectorProjectionAttempted": False,
        "psfConvolutionAttempted": False,
        "denseShardExecuted": False,
        "boundary": "v441-wcs-coordinate-authority-only-no-measured-detector-projection-psf-or-raster",
    }
    oracle = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic_json(OUT / "wcs-projection-contract.json", contract)
    atomic_json(OUT / "wcs-projection-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "wcsSources": 4, "joinedCoordinates": 24, "maxJoinResidualPixel": max_coordinate_join_residual, "detectorProjection": 0, "psfModels": 0}, indent=2))


if __name__ == "__main__":
    main()

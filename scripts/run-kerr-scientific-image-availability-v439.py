from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-scientific-image-availability-v439"


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
    v436_path = ROOT / "dist/science/kerr-observation-provenance-v436/observation-provenance-oracle.json"
    v437_path = ROOT / "dist/science/kerr-instrument-observation-v437/instrument-observation-oracle.json"
    v438_path = ROOT / "dist/science/kerr-measured-response-admission-v438/measured-response-admission-oracle.json"
    v436 = json.loads(v436_path.read_text(encoding="utf-8"))
    v437 = json.loads(v437_path.read_text(encoding="utf-8"))
    v438 = json.loads(v438_path.read_text(encoding="utf-8"))
    if len(v436["payloads"]) != 4 or v437["counts"]["responseMatrixApplicationCount"] != 0 or v438["qualification"]["scienceAdmissionGranted"] is not False:
        raise RuntimeError("v439-source-boundary")
    sparse_points = [{"rayId": payload["rayId"], "spin": payload["spin"], "classification": payload["classification"], "redshift": payload["redshift"], "walkerPenroseEvpaDeg": payload["walkerPenroseEvpaDeg"], "parallelTransportEvpaDeg": payload["parallelTransportEvpaDeg"], "evpaDifferenceDeg": payload["evpaDifferenceDeg"], "positionAvailability": "screen-ray-only", "scienceAuthority": True} for payload in v436["payloads"]]
    contract = {
        "version": "v439-kerr-scientific-image-availability-contract-v1",
        "status": "sparse-authority-available-calibrated-image-blocked",
        "sourceRequirements": ["v436-immutable-observation-provenance", "v437-response-eligibility-audit", "v438-measured-response-admission"],
        "imageProducts": {"sparseAuthorityPoints": "available", "scienceRaster": "unavailable", "fits": "not-produced", "png": "not-produced", "detectorCounts": "unavailable"},
        "scienceRenderer": {"sparsePointsAllowed": True, "responseBackedPixelsRequired": True, "interpolationForbidden": True, "detectorNoiseForbidden": True, "backgroundSynthesisForbidden": True, "linearDisplayOnly": True, "scientificFieldMutation": False},
        "cinematicRenderer": {"sparseGeometryReuseAllowed": True, "seedRequired": True, "presentationOnly": True, "mayDecorateSparsePreview": True, "mayProduceScienceImage": False, "scientificFieldMutation": False, "scienceWritebackForbidden": True},
        "formalProductPointer": "v263",
        "denseCampaignStatus": "incomplete-0-of-49",
        "boundary": "only-four-sparse-authority-points-are-available-and-no-calibrated-scientific-image-may-be-inferred",
    }
    unsigned = {
        "version": "v439-kerr-scientific-image-availability-python-oracle-v1",
        "generatedAt": "2026-07-30T00:00:00Z",
        "status": "qualified-sparse-authority-image-boundary-calibrated-image-blocked",
        "sourceV436ArtifactSha256": v436["artifactSha256"],
        "sourceV436FileSha256": file_sha(v436_path),
        "sourceV437ArtifactSha256": v437["artifactSha256"],
        "sourceV437FileSha256": file_sha(v437_path),
        "sourceV438ArtifactSha256": v438["artifactSha256"],
        "sourceV438FileSha256": file_sha(v438_path),
        "sparseAuthorityPoints": sparse_points,
        "contract": contract,
        "counts": {"sparseAuthorityPointCount": 4, "responseBackedPixelCount": 0, "scienceRasterCount": 0, "fitsProductCount": 0, "pngProductCount": 0, "detectorCountProductCount": 0, "cinematicScienceWritebackCount": 0},
        "qualification": {"sparseAuthorityQualified": True, "imageBoundaryQualified": True, "scienceRasterAvailable": False, "fitsAvailable": False, "pngAvailable": False, "detectorImageAuthority": False, "cinematicReadonlyBoundaryQualified": True, "browserQualification": "not-run", "denseAuthority": False},
        "networkAttempted": False,
        "imageProductsProduced": False,
        "scienceRasterAttempted": False,
        "denseShardExecuted": False,
        "boundary": "v439-sparse-authority-only-no-response-backed-pixels-no-fits-no-png-no-detector-image",
    }
    oracle = {**unsigned, "artifactSha256": sha(unsigned)}
    atomic_json(OUT / "scientific-image-availability-contract.json", contract)
    atomic_json(OUT / "scientific-image-availability-oracle.json", oracle)
    print(json.dumps({"status": oracle["status"], "artifactSha256": oracle["artifactSha256"], "sparseAuthorityPoints": 4, "responseBackedPixels": 0, "fits": "not-produced", "png": "not-produced", "denseAuthority": False}, indent=2))


if __name__ == "__main__":
    main()

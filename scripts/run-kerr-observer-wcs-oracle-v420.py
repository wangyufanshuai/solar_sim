from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import numpy as np
from astropy.wcs import WCS


ROOT = Path.cwd()
PLAN = ROOT / "dist/science/kerr-campaign-v314/ray-plan.json"
V419 = ROOT / "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json"
OUTPUT = ROOT / "dist/science/kerr-observer-plane-WCS-v420/python-wcs-oracle.json"
PLAN_SHA = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04"
V419_SHA = "cbaafe2390f4df7f1437cb3dffa632fb3d5feb55cd6ff16f5fb2972cc08d43df"
WIDTH = 384
HEIGHT = 384


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def main() -> None:
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    v419 = json.loads(V419.read_text(encoding="utf-8"))
    if plan.get("planSha256") != PLAN_SHA or v419.get("artifactSha256") != V419_SHA:
        raise RuntimeError("v420-source-lock")
    uniform = [row for row in plan["rays"] if row["stratum"] == "uniform-field"]
    alpha = sorted(set(row["alphaM"] for row in uniform))
    beta = sorted(set(row["betaM"] for row in uniform))
    if len(uniform) != 1681 or len(alpha) != 41 or len(beta) != 41 or (alpha[0], alpha[-1], beta[0], beta[-1]) != (-22.0, 22.0, -16.0, 16.0):
        raise RuntimeError("v420-world-support")
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [192.5, 192.5]
    wcs.wcs.cdelt = np.asarray([44.0 / WIDTH, 32.0 / HEIGHT], dtype=float)
    wcs.wcs.crval = [0.0, 0.0]
    wcs.wcs.ctype = ["LINEAR", "LINEAR"]
    wcs.wcs.cname = ["KERR_ALPHA", "KERR_BETA"]
    world = np.asarray([[row["alphaM"], row["betaM"]] for row in v419["view"]["rows"]], dtype=float)
    pixels = wcs.all_world2pix(world, 1)
    restored = wcs.all_pix2world(pixels, 1)
    residuals = np.max(np.abs(restored - world), axis=1)
    edges = np.asarray([[0.5, 0.5], [384.5, 384.5]], dtype=float)
    edge_world = wcs.all_pix2world(edges, 1)
    expected_edges = np.asarray([[-22.0, -16.0], [22.0, 16.0]], dtype=float)
    edge_residual = float(np.max(np.abs(edge_world - expected_edges)))
    rows = [{
        "rayIndex": source["rayIndex"],
        "rayId": source["rayId"],
        "alphaM": source["alphaM"],
        "betaM": source["betaM"],
        "continuousPixelX": float(pixel[0]),
        "continuousPixelY": float(pixel[1]),
        "worldRoundtripResidualM": float(residual),
    } for source, pixel, residual in zip(v419["view"]["rows"], pixels, residuals)]
    maxima = {"worldRoundtripResidualM": float(np.max(residuals)), "edgeWorldResidualM": edge_residual}
    if max(maxima.values()) >= 1e-12:
        raise RuntimeError(f"v420-astropy-WCS-gate:{maxima}")
    generated_at = max(plan["generatedAt"], v419["generatedAt"])
    unsigned = {
        "version": "v420-kerr-observer-plane-astropy-WCS-oracle-v1",
        "generatedAt": generated_at,
        "status": "qualified-independent-astropy-linear-WCS-roundtrip",
        "source": {"v314RayPlanSha256": PLAN_SHA, "v419ArtifactSha256": V419_SHA},
        "worldSupport": {"sourceStratum": "uniform-field", "sourceRayCount": 1681, "alphaSampleCount": 41, "betaSampleCount": 41, "alphaMinM": -22.0, "alphaMaxM": 22.0, "betaMinM": -16.0, "betaMaxM": 16.0},
        "wcs": {"width": WIDTH, "height": HEIGHT, "crpix1": 192.5, "crpix2": 192.5, "crval1M": 0.0, "crval2M": 0.0, "cdelt1MPerPixel": 44.0 / WIDTH, "cdelt2MPerPixel": 32.0 / HEIGHT, "ctype1": "LINEAR", "ctype2": "LINEAR", "origin": 1},
        "rows": rows,
        "maxima": maxima,
        "rasterScienceValuesGenerated": False,
        "denseShardExecuted": False,
        "boundary": "linear-WCS-coordinate-oracle-only-no-image-values-or-interpolation",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "rows": rows, "maxima": maxima}, indent=2))


if __name__ == "__main__":
    main()

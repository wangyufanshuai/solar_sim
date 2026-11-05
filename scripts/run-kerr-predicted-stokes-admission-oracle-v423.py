from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
V406 = ROOT / "dist/science/kerr-stokes-transfer-v406/short-gate.json"
V422 = ROOT / "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json"
OUTPUT = ROOT / "dist/science/kerr-predicted-stokes-admission-v423/python-admission-oracle.json"
V406_ARTIFACT_SHA = "92830ac3ac89856664fcfbfd00f698b02aa6daa851463de9dc019bfc207e8038"
V406_FILE_SHA = "3abf793d1bf53407de93f5ab34abfc3c7eb9fefdfe4b4a1ee505fa802eb3023a"
V422_ARTIFACT_SHA = "b087df36d8afe38d73e7afefbd711398e71f31d1d0e7e569d38af07a7e8cfc20"
V422_FILE_SHA = "29953d0a54dbc841c9029c4553bf3566ba664b4c9b231ed5dd09da9b324a02f9"


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def axial_difference(left: float, right: float) -> float:
    difference = abs(left - right) % 180.0
    return min(difference, 180.0 - difference)


def main() -> None:
    v406 = json.loads(V406.read_text(encoding="utf-8"))
    v422 = json.loads(V422.read_text(encoding="utf-8"))
    if file_sha(V406) != V406_FILE_SHA or v406.get("artifactSha256") != V406_ARTIFACT_SHA or file_sha(V422) != V422_FILE_SHA or v422.get("artifactSha256") != V422_ARTIFACT_SHA:
        raise RuntimeError("v423-source-lock")
    basis_by_ray = {row["rayId"]: row for row in v422["view"]["rows"]}
    rows: list[dict[str, Any]] = []
    for sample in v406["view"]["samples"]:
        basis = basis_by_ray.get(sample["rayId"])
        if basis is None or basis["rayIndex"] != sample["rayIndex"] or basis["spinA"] != sample["spinA"]:
            raise RuntimeError("v423-ray-identity")
        observed = sample["observedStokes"]
        chi = math.radians(float(sample["evpaDeg"]))
        q_hat = math.cos(2.0 * chi)
        u_hat = math.sin(2.0 * chi)
        q_normalized = observed["q"] / observed["i"]
        u_normalized = observed["u"] / observed["i"]
        linear_fraction = observed["linearAmplitude"] / observed["i"]
        rows.append({
            "rayId": sample["rayId"],
            "rayIndex": sample["rayIndex"],
            "spinA": sample["spinA"],
            "observedFrequencyHz": sample["observedFrequencyHz"],
            "transportMethod": sample["transportMethod"],
            "continuousPixelX": basis["continuousCoordinate"]["pixelX"],
            "continuousPixelY": basis["continuousCoordinate"]["pixelY"],
            "evpaDeg": sample["evpaDeg"],
            "qHat": q_hat,
            "uHat": u_hat,
            "qNormalized": q_normalized,
            "uNormalized": u_normalized,
            "linearFraction": linear_fraction,
            "normalizedQBasisResidual": abs(q_normalized - linear_fraction * q_hat),
            "normalizedUBasisResidual": abs(u_normalized - linear_fraction * u_hat),
            "linearFractionResidual": abs(linear_fraction - 0.12),
            "physicalConeViolation": max(0.0, observed["linearAmplitude"] - observed["i"]),
            "v422EvpaDifferenceDeg": axial_difference(sample["evpaDeg"], basis["authorityEvpaDeg"]),
            "v422BasisDifference": max(abs(q_hat - basis["orientationBasis"]["qHat"]), abs(u_hat - basis["orientationBasis"]["uHat"])),
        })
    maxima = {key: max(row[key] for row in rows) for key in ("normalizedQBasisResidual", "normalizedUBasisResidual", "linearFractionResidual", "physicalConeViolation", "v422EvpaDifferenceDeg", "v422BasisDifference")}
    if len(rows) != 24 or maxima["normalizedQBasisResidual"] >= 1e-12 or maxima["normalizedUBasisResidual"] >= 1e-12 or maxima["linearFractionResidual"] >= 1e-12 or maxima["physicalConeViolation"] != 0 or maxima["v422EvpaDifferenceDeg"] >= 1e-10 or maxima["v422BasisDifference"] >= 1e-10:
        raise RuntimeError(f"v423-admission-gate:{maxima}")
    unsigned = {
        "version": "v423-kerr-predicted-stokes-admission-python-oracle-v1",
        "generatedAt": max(v406["generatedAt"], v422["generatedAt"]),
        "status": "qualified-sparse-model-predicted-stokes-WCS-identity-no-measurement-authority",
        "source": {"v406ArtifactSha256": V406_ARTIFACT_SHA, "v406FileSha256": V406_FILE_SHA, "v422ArtifactSha256": V422_ARTIFACT_SHA, "v422FileSha256": V422_FILE_SHA},
        "counts": {"rayCount": 4, "frequencyCount": 3, "transportMethodCount": 2, "predictionRowCount": 24},
        "units": {"frequency": "Hz", "spectralStokes": "W m^-2 sr^-1 Hz^-1", "evpa": "deg modulo 180"},
        "rows": rows,
        "maxima": maxima,
        "predictionAuthority": True,
        "measurementAuthority": False,
        "detectorAuthority": False,
        "pixelAuthority": False,
        "rasterGenerated": False,
        "denseShardExecuted": False,
        "boundary": "sparse-model-predicted-I-Q-U-at-continuous-WCS-coordinates-no-V-measurement-detector-pixel-or-raster-authority",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "counts": artifact["counts"], "maxima": maxima}, indent=2))


if __name__ == "__main__":
    main()

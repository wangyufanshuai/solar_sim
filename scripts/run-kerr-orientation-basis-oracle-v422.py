from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json"
OUTPUT = ROOT / "dist/science/kerr-polarization-orientation-basis-v422/python-orientation-basis-oracle.json"
SOURCE_ARTIFACT_SHA = "34ac72927c251fb22d436bfba04fdbee757cd410c0708e60c00043be7e029f44"
SOURCE_FILE_SHA = "9b0165ba2af5781e734d34bb814dbb4793bdee76c0cdec7412aca6f558550a40"


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    payload = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(payload).hexdigest()


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
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    if file_sha(SOURCE) != SOURCE_FILE_SHA or source.get("artifactSha256") != SOURCE_ARTIFACT_SHA:
        raise RuntimeError("v422-source-lock")
    rows: list[dict[str, Any]] = []
    for source_row in source["view"]["rows"]:
        chi = math.radians(float(source_row["authorityEvpaDeg"]))
        q_hat = math.cos(2.0 * chi)
        u_hat = math.sin(2.0 * chi)
        recovered = 0.5 * math.degrees(math.atan2(u_hat, q_hat))
        shifted_q = math.cos(2.0 * (chi + math.pi))
        shifted_u = math.sin(2.0 * (chi + math.pi))
        rows.append({
            "rayIndex": source_row["rayIndex"],
            "rayId": source_row["rayId"],
            "authorityEvpaDeg": source_row["authorityEvpaDeg"],
            "qHat": q_hat,
            "uHat": u_hat,
            "basisNormResidual": abs(math.hypot(q_hat, u_hat) - 1.0),
            "recoveredAxialEvpaResidualDeg": axial_difference(recovered, float(source_row["authorityEvpaDeg"])),
            "plus180BasisResidual": max(abs(q_hat - shifted_q), abs(u_hat - shifted_u)),
            "v421TensorDifference": max(abs(q_hat - source_row["axialOrientationTensor"]["cosTwoChi"]), abs(u_hat - source_row["axialOrientationTensor"]["sinTwoChi"])),
            "continuousPixelX": (source_row["presentationGlyph"]["negative"]["pixelX"] + source_row["presentationGlyph"]["positive"]["pixelX"]) / 2.0,
            "continuousPixelY": (source_row["presentationGlyph"]["negative"]["pixelY"] + source_row["presentationGlyph"]["positive"]["pixelY"]) / 2.0,
        })
    maxima = {key: max(row[key] for row in rows) for key in ("basisNormResidual", "recoveredAxialEvpaResidualDeg", "plus180BasisResidual", "v421TensorDifference")}
    if max(maxima.values()) >= 1e-12:
        raise RuntimeError(f"v422-orientation-basis-gate:{maxima}")
    unsigned = {
        "version": "v422-kerr-polarization-orientation-basis-python-oracle-v1",
        "generatedAt": source["generatedAt"],
        "status": "qualified-independent-double-angle-orientation-basis-no-stokes-measurement",
        "source": {"v421ArtifactSha256": SOURCE_ARTIFACT_SHA, "v421FileSha256": SOURCE_FILE_SHA},
        "semantics": {
            "qHat": "cos-two-chi-unit-orientation-basis-not-Q-over-I",
            "uHat": "sin-two-chi-unit-orientation-basis-not-U-over-I",
            "radius": "unity-by-definition-not-polarization-fraction",
            "axialPeriodDeg": 180,
        },
        "rows": rows,
        "maxima": maxima,
        "stokesMeasurementGenerated": False,
        "polarizationAmplitudeGenerated": False,
        "rasterMaskGenerated": False,
        "nearestPixelAssignmentPerformed": False,
        "denseShardExecuted": False,
        "boundary": "four-continuous-source-orientation-bases-only-no-I-Q-U-V-amplitude-or-raster-mask",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "rowCount": len(rows), "maxima": maxima}, indent=2))


if __name__ == "__main__":
    main()

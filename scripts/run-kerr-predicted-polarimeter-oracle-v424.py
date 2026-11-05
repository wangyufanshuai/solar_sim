from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
V423 = ROOT / "dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json"
V410 = ROOT / "dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json"
OUTPUT = ROOT / "dist/science/kerr-predicted-polarimeter-v424/python-modulation-oracle.json"
V423_FILE_SHA = "121d7ec75ae3ad5fad7f2abd0e07a32ad5181cd2e8c1decf55599364ecf25e73"
V423_ARTIFACT_SHA = "41a2ccb38d6199af8b831b868b42827adea1f5187be73241377d8da10f3f9b8f"
V410_FILE_SHA = "fce8084abd73c90a8c087d1b7605b4d4483dc65ddefeb95198291e65b3941776"
V410_ARTIFACT_SHA = "5acfc19b1c1af8ac8f63c5d1a56e39f79501138fbe3b8b57a483b8771f949a22"
ANGLES = (0.0, 22.5, 45.0, 67.5)


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
    payload = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def main() -> None:
    v423 = json.loads(V423.read_text(encoding="utf-8"))
    v410 = json.loads(V410.read_text(encoding="utf-8"))
    if (
        file_sha(V423) != V423_FILE_SHA
        or v423.get("artifactSha256") != V423_ARTIFACT_SHA
        or file_sha(V410) != V410_FILE_SHA
        or v410.get("artifactSha256") != V410_ARTIFACT_SHA
    ):
        raise RuntimeError("v424-source-lock")
    operator = v410["view"]["operator"]
    if (
        operator["device"] != "ideal-half-wave-plate-plus-ideal-wollaston-dual-beam"
        or operator["hwpAnglesDeg"] != [0, 22.5, 45, 67.5]
        or operator["photonOrElectronCountsProduced"] is not False
    ):
        raise RuntimeError("v424-v410-operator-contract")

    rows: list[dict[str, Any]] = []
    reconstructions: list[dict[str, Any]] = []
    maximum_beam_sum = 0.0
    maximum_flux_law = 0.0
    maximum_reconstruction = 0.0
    for source in v423["view"]["rows"]:
        stokes = source["predictedSpectralStokes"]
        intensity = float(stokes["i"])
        q = float(stokes["q"])
        u = float(stokes["u"])
        source_rows: list[dict[str, Any]] = []
        for hwp_index, hwp_angle in enumerate(ANGLES):
            phase = math.radians(4.0 * hwp_angle)
            analyzer_signal = q * math.cos(phase) + u * math.sin(phase)
            ordinary = 0.5 * (intensity + analyzer_signal)
            extraordinary = 0.5 * (intensity - analyzer_signal)
            beam_sum = ordinary + extraordinary
            normalized_difference = (ordinary - extraordinary) / beam_sum
            expected = q / intensity * math.cos(phase) + u / intensity * math.sin(phase)
            if ordinary < 0.0 or extraordinary < 0.0:
                raise RuntimeError("v424-negative-predicted-beam")
            maximum_beam_sum = max(maximum_beam_sum, abs(beam_sum - intensity) / intensity)
            maximum_flux_law = max(maximum_flux_law, abs(normalized_difference - expected))
            row = {
                "rayId": source["rayId"],
                "rayIndex": source["rayIndex"],
                "observedFrequencyHz": source["observedFrequencyHz"],
                "transportMethod": source["transportMethod"],
                "hwpIndex": hwp_index,
                "hwpAngleDeg": hwp_angle,
                "ordinary": ordinary,
                "extraordinary": extraordinary,
                "beamSum": beam_sum,
                "normalizedDifference": normalized_difference,
            }
            rows.append(row)
            source_rows.append(row)
        flux = [row["normalizedDifference"] for row in source_rows]
        reconstructed_i = sum(row["beamSum"] for row in source_rows) / 4.0
        reconstructed_q = 0.5 * (flux[0] - flux[2])
        reconstructed_u = 0.5 * (flux[1] - flux[3])
        maximum_reconstruction = max(
            maximum_reconstruction,
            abs(reconstructed_i - intensity),
            abs(reconstructed_q - q / intensity),
            abs(reconstructed_u - u / intensity),
        )
        reconstructions.append({
            "rayId": source["rayId"],
            "rayIndex": source["rayIndex"],
            "observedFrequencyHz": source["observedFrequencyHz"],
            "transportMethod": source["transportMethod"],
            "i": reconstructed_i,
            "qOverI": reconstructed_q,
            "uOverI": reconstructed_u,
        })
    if (
        len(rows) != 96
        or len(reconstructions) != 24
        or maximum_beam_sum >= 1e-12
        or maximum_flux_law >= 1e-12
        or maximum_reconstruction >= 1e-12
    ):
        raise RuntimeError("v424-python-modulation-gate")

    unsigned = {
        "version": "v424-kerr-predicted-ideal-dual-beam-python-oracle-v1",
        "generatedAt": v423["generatedAt"],
        "status": "qualified-ideal-model-predicted-modulation-no-measurement-authority",
        "source": {
            "v423ArtifactSha256": V423_ARTIFACT_SHA,
            "v423FileSha256": V423_FILE_SHA,
            "v410OperatorReferenceArtifactSha256": V410_ARTIFACT_SHA,
            "v410FileSha256": V410_FILE_SHA,
        },
        "operator": {
            "device": "ideal-half-wave-plate-plus-ideal-Wollaston-dual-beam",
            "hwpAnglesDeg": list(ANGLES),
            "ordinaryLaw": "fO=0.5*(I+Q*cos(4theta)+U*sin(4theta))",
            "extraordinaryLaw": "fE=0.5*(I-Q*cos(4theta)-U*sin(4theta))",
            "normalizedDifferenceLaw": "F=(fO-fE)/(fO+fE)=q*cos(4theta)+u*sin(4theta)",
        },
        "counts": {
            "sourcePredictionCount": 24,
            "modulationRowCount": 96,
            "predictedBeamSpectralRadianceCount": 192,
            "reconstructionCount": 24,
            "measuredRowCount": 0,
            "photonCount": 0,
            "electronCount": 0,
        },
        "rows": rows,
        "reconstructions": reconstructions,
        "maxima": {
            "beamSumRelative": maximum_beam_sum,
            "normalizedFluxLawAbsolute": maximum_flux_law,
            "reconstructionAbsolute": maximum_reconstruction,
        },
        "modelPredictionQualified": True,
        "measurementAuthority": False,
        "detectorAuthority": False,
        "photonOrElectronCountsProduced": False,
        "measuredMuellerCalibrationApplied": False,
        "denseShardExecuted": False,
        "boundary": "ideal-model-predicted-dual-beam-radiance-only-no-measurement-detector-counts-pixel-raster-or-dense-authority",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic_json(OUTPUT, artifact)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "counts": artifact["counts"],
        "maxima": artifact["maxima"],
    }, indent=2))


if __name__ == "__main__":
    main()

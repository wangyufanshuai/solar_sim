from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
V424 = ROOT / "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json"
V411 = ROOT / "dist/science/kerr-polarimeter-calibration-v411/inspect.json"
V413 = ROOT / "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json"
OUTPUT = ROOT / "dist/science/kerr-instrument-spectral-admission-v425/python-spectral-admission-oracle.json"
LOCKS = {
    V424: ("ee46fa0819b9f41e30b4dd053d069c99783a50cb0afcdb2b34e095daa1b5e024", "934f3038aa2ca30fa804346008528c33479f5af5b09a173fca55cf0f76d4139d"),
    V411: ("5bd1831f70860125fb1e841f801566e0c92517cf7d9d6ad7748ad5812f4e2a31", "9382399d3184a5480f085ecc4e3679ba593f814db8a73c8abba15eb3eec58ced"),
    V413: ("d8972aa256d4ee1818ad3e4075e27c09e20a37c738e0853fa4a44068146e1413", "f4a10d65ca5e0c49495cf5be6b3a27298a4048da7acbdaba264905d3cf4ccd6f"),
}
C = 299_792_458.0
H = 6.626_070_15e-34
E_CHARGE = 1.602_176_634e-19


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
    sources = {path: json.loads(path.read_text(encoding="utf-8")) for path in LOCKS}
    for path, (expected_file, expected_artifact) in LOCKS.items():
        if file_sha(path) != expected_file or sources[path].get("artifactSha256") != expected_artifact:
            raise RuntimeError(f"v425-source-lock:{path.name}")
    v424, v411, v413 = sources[V424], sources[V411], sources[V413]
    domain = v413["view"]["wavelengthDomainM"]
    if (
        domain != [4e-7, 8e-7]
        or v413["pack"]["sourceKind"] != "test-fixture"
        or v413["pack"]["extrapolation"] != "forbidden"
        or v413["measuredPackPresent"] is not False
        or v411["current"]["measuredManifestPresent"] is not False
        or v411["wavelengthBoundary"] != "each-science-frequency-requires-in-domain-calibration-no-cross-band-hwp-assumption"
    ):
        raise RuntimeError("v425-calibration-domain-contract")

    rows: list[dict[str, Any]] = []
    for source in v424["view"]["reconstructions"]:
        frequency = float(source["observedFrequencyHz"])
        wavelength = C / frequency
        energy_j = H * frequency
        energy_ev = energy_j / E_CHARGE
        eligible = domain[0] <= wavelength <= domain[1]
        if eligible:
            raise RuntimeError("v425-unexpected-domain-overlap")
        rows.append({
            "rayId": source["rayId"],
            "rayIndex": source["rayIndex"],
            "observedFrequencyHz": frequency,
            "transportMethod": source["transportMethod"],
            "vacuumWavelengthM": wavelength,
            "vacuumWavelengthNm": wavelength * 1e9,
            "photonEnergyJ": energy_j,
            "photonEnergyEv": energy_ev,
            "lowerBoundaryGapFactor": domain[0] / wavelength,
            "responseEligible": False,
            "extrapolationAllowed": False,
            "responseMatrixApplied": False,
        })
    frequencies = sorted({row["observedFrequencyHz"] for row in rows})
    band_summaries = []
    for frequency in frequencies:
        band = [row for row in rows if row["observedFrequencyHz"] == frequency]
        if len(band) != 8:
            raise RuntimeError("v425-band-count")
        band_summaries.append({
            "observedFrequencyHz": frequency,
            "vacuumWavelengthNm": band[0]["vacuumWavelengthNm"],
            "photonEnergyEv": band[0]["photonEnergyEv"],
            "sourcePredictionCount": 8,
            "affectedV424ModulationRowCount": 32,
            "responseEligibleCount": 0,
        })
    if len(rows) != 24 or len(band_summaries) != 3:
        raise RuntimeError("v425-count")

    unsigned = {
        "version": "v425-kerr-instrument-spectral-applicability-python-oracle-v1",
        "generatedAt": v424["generatedAt"],
        "status": "qualified-all-v424-predictions-outside-v413-domain-response-application-blocked",
        "source": {
            "v424ArtifactSha256": LOCKS[V424][1],
            "v424FileSha256": LOCKS[V424][0],
            "v411ArtifactSha256": LOCKS[V411][1],
            "v411FileSha256": LOCKS[V411][0],
            "v413ArtifactSha256": LOCKS[V413][1],
            "v413FileSha256": LOCKS[V413][0],
        },
        "constants": {
            "speedOfLightMPerS": C,
            "planckConstantJS": H,
            "elementaryChargeC": E_CHARGE,
            "status": "exact-SI-defining-constants",
        },
        "calibrationDomainM": domain,
        "rows": rows,
        "bandSummaries": band_summaries,
        "counts": {
            "sourcePredictionCount": 24,
            "affectedV424ModulationRowCount": 96,
            "responseEligibleSourceCount": 0,
            "blockedOutOfDomainSourceCount": 24,
            "responseMatrixApplicationCount": 0,
        },
        "responseApplicationAttempted": False,
        "measurementAuthority": False,
        "detectorAuthority": False,
        "denseShardExecuted": False,
        "boundary": "spectral-domain-audit-only-no-response-extrapolation-or-instrument-authority",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic_json(OUTPUT, artifact)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "counts": artifact["counts"],
        "bands": band_summaries,
    }, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import bisect
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

ROOT = Path.cwd()
RAW = ROOT / "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml"
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
VISIBLE = ROOT / "dist/science/measured-visible-photon-observable-v384/observable.json"
OUTPUT = ROOT / "dist/science/kerr-bandpass-redshift-commutator-v534/python-oracle.json"

C = 299_792_458.0
H = 6.626_070_15e-34
KB = 1.380_649e-23
LOWER_WAVELENGTH_M = 4e-7
UPPER_WAVELENGTH_M = 7e-7
LOWER_FREQUENCY_HZ = C / UPPER_WAVELENGTH_M
UPPER_FREQUENCY_HZ = C / LOWER_WAVELENGTH_M
STEPS = 262_144
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256"}


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return sha_bytes(encoded)


def parse_profile(source: bytes) -> tuple[list[float], list[float]]:
    root = ElementTree.fromstring(source)
    rows: list[tuple[float, float]] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].upper() != "TR":
            continue
        cells = [child for child in list(element) if child.tag.rsplit("}", 1)[-1].upper() == "TD"]
        if len(cells) != 2 or cells[0].text is None or cells[1].text is None:
            raise RuntimeError("v534-profile-row")
        wavelength_m = float(cells[0].text.strip()) * 1e-10
        throughput = float(cells[1].text.strip())
        if not (math.isfinite(wavelength_m) and wavelength_m > 0 and math.isfinite(throughput) and 0 <= throughput <= 1):
            raise RuntimeError("v534-profile-value")
        rows.append((wavelength_m, throughput))
    if len(rows) != 8705 or any(right[0] <= left[0] for left, right in zip(rows, rows[1:])):
        raise RuntimeError("v534-profile-identity")
    return [row[0] for row in rows], [row[1] for row in rows]


def interpolate(wavelength_m: float, wavelengths: list[float], throughputs: list[float]) -> float:
    if wavelength_m < wavelengths[0] or wavelength_m > wavelengths[-1]:
        raise RuntimeError("v534-throughput-outside-profile")
    right = bisect.bisect_left(wavelengths, wavelength_m)
    if right == 0:
        return throughputs[0]
    if right == len(wavelengths):
        return throughputs[-1]
    if wavelengths[right] == wavelength_m:
        return throughputs[right]
    left = right - 1
    fraction = (wavelength_m - wavelengths[left]) / (wavelengths[right] - wavelengths[left])
    return throughputs[left] + fraction * (throughputs[right] - throughputs[left])


def observed_photon_per_hz(frequency_hz: float, temperature_k: float, redshift_factor: float) -> float:
    emitted_frequency_hz = frequency_hz / redshift_factor
    exponent = H * emitted_frequency_hz / (KB * temperature_k)
    emitted_energy = 2 * H * emitted_frequency_hz**3 / C**2 / math.expm1(exponent)
    observed_energy = redshift_factor**3 * emitted_energy
    value = observed_energy / (H * frequency_hz)
    if not math.isfinite(value) or value <= 0:
        raise RuntimeError("v534-photon-radiance")
    return value


def integrate(
    temperature_k: float,
    redshift_factor: float,
    wavelengths: list[float],
    throughputs: list[float],
    frozen_response: bool,
) -> float:
    width = (UPPER_FREQUENCY_HZ - LOWER_FREQUENCY_HZ) / STEPS
    total = 0.0
    for index in range(STEPS + 1):
        frequency_hz = LOWER_FREQUENCY_HZ + index * width
        observer_wavelength_m = C / frequency_hz
        response_wavelength_m = redshift_factor * observer_wavelength_m if frozen_response else observer_wavelength_m
        value = observed_photon_per_hz(frequency_hz, temperature_k, redshift_factor)
        value *= interpolate(response_wavelength_m, wavelengths, throughputs)
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * value
    result = total * width / 3
    if not math.isfinite(result) or result <= 0:
        raise RuntimeError("v534-integral")
    return result


def relative_difference(left: float, right: float) -> float:
    return abs(left - right) / max(float.fromhex("0x0.0000000000001p-1022"), abs(left), abs(right))


def main() -> None:
    raw = RAW.read_bytes()
    wavelengths, throughputs = parse_profile(raw)
    photon = json.loads(PHOTON.read_text(encoding="utf-8"))
    visible = json.loads(VISIBLE.read_text(encoding="utf-8"))
    view = photon.get("view", {})
    if view.get("status") != "qualified-fixed-band-photon-radiance" or len(view.get("rays", [])) != 4:
        raise RuntimeError("v534-photon-identity")
    if visible.get("version") != "v384-visible-throughput-weighted-photon-observable-v1" or len(visible.get("rows", [])) != 4:
        raise RuntimeError("v534-visible-identity")

    rows: list[dict[str, Any]] = []
    maximum_v384_difference = 0.0
    maximum_unit_identity = 0.0
    for ray in view["rays"]:
        ray_index = int(ray["rayIndex"])
        temperature_k = float(ray["effectiveTemperatureK"])
        redshift_factor = float(ray["redshiftFactor"])
        exact = integrate(temperature_k, redshift_factor, wavelengths, throughputs, False)
        frozen = integrate(temperature_k, redshift_factor, wavelengths, throughputs, True)
        unit_exact = integrate(temperature_k, 1.0, wavelengths, throughputs, False)
        unit_frozen = integrate(temperature_k, 1.0, wavelengths, throughputs, True)
        unit_identity = relative_difference(unit_exact, unit_frozen)
        source = next(row for row in visible["rows"] if int(row["rayIndex"]) == ray_index)
        v384_difference = relative_difference(exact, float(source["throughputWeightedPhotonRadiancePerSM2Sr"]))
        commutator = abs(exact - frozen) / exact
        if not (commutator > 0 and math.isfinite(commutator)):
            raise RuntimeError(f"v534-commutator:{ray_index}")
        maximum_v384_difference = max(maximum_v384_difference, v384_difference)
        maximum_unit_identity = max(maximum_unit_identity, unit_identity)
        rows.append({
            "rayIndex": ray_index,
            "spinA": ray["spinA"],
            "redshiftFactor": redshift_factor,
            "effectiveTemperatureK": temperature_k,
            "observerBandpassPhotonRadiancePerSM2Sr": exact,
            "frozenEmitterBandpassPhotonRadiancePerSM2Sr": frozen,
            "signedFrozenBiasRelative": (frozen - exact) / exact,
            "redshiftBandpassCommutatorRelative": commutator,
            "unitRedshiftIdentityResidual": unit_identity,
            "v384ObserverBandpassRelativeDifference": v384_difference,
        })

    unsigned = {
        "version": "v534-kerr-bandpass-redshift-frequency-domain-oracle-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "qualified-independent-frequency-domain-bandpass-redshift-oracle",
        "source": {
            "rawProfileSha256": sha_bytes(raw),
            "v328ArtifactSha256": photon["artifactSha256"],
            "v384ArtifactSha256": visible["artifactSha256"],
        },
        "formulation": {
            "integrationDomain": "observer-frequency",
            "quadrature": "fixed-simpson-262144",
            "exactResponseArgument": "eta(lambda_observer)",
            "frozenResponseArgument": "eta(g-times-lambda_observer)",
            "photonSpectralTransform": "N_nu_observer=g_squared-times-N_nu_emitter(nu_observer/g)",
            "randomnessUsed": False,
        },
        "rows": rows,
        "counts": {"rayCount": 4, "exactIntegralCount": 4, "frozenIntegralCount": 4, "unitIdentityFixtureCount": 4},
        "maxima": {
            "v384ObserverBandpassRelativeDifference": maximum_v384_difference,
            "unitRedshiftIdentityResidual": maximum_unit_identity,
        },
        "boundary": {
            "candidateThroughputOnly": True,
            "sourceDossierComplete": False,
            "measuredDetectorAuthorityGranted": False,
            "electronExpectationRows": 0,
            "observedCountRows": 0,
            "sciencePixelRows": 0,
            "networkAttempted": False,
            "denseCampaignStatus": "incomplete-0-of-49",
        },
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, OUTPUT)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "rows": 4,
        "maximumV384RelativeDifference": maximum_v384_difference,
        "maximumUnitIdentityResidual": maximum_unit_identity,
        "commutatorRange": [min(row["redshiftBandpassCommutatorRelative"] for row in rows), max(row["redshiftBandpassCommutatorRelative"] for row in rows)],
        "electronExpectationRows": 0,
    }, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import bisect
import hashlib
import json
import math
import os
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path.cwd()
RAW = ROOT / "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml"
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
OUTPUT = ROOT / "dist/science/measured-visible-photon-observable-v384/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
LOWER_WAVELENGTH_M = 4e-7
UPPER_WAVELENGTH_M = 7e-7
LOWER_FREQUENCY_HZ = C / UPPER_WAVELENGTH_M
UPPER_FREQUENCY_HZ = C / LOWER_WAVELENGTH_M
STEPS = 65_536
EXPECTED_PHOTON_ARTIFACT_SHA256 = "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def parse_profile(source: bytes):
    root = ElementTree.fromstring(source)
    rows = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].upper() != "TR":
            continue
        cells = [
            child
            for child in list(element)
            if child.tag.rsplit("}", 1)[-1].upper() == "TD"
        ]
        if len(cells) != 2 or cells[0].text is None or cells[1].text is None:
            raise RuntimeError("v384-python-profile-row")
        wavelength_text = cells[0].text.strip()
        throughput_text = cells[1].text.strip()
        wavelength_angstrom = float(wavelength_text)
        throughput = float(throughput_text)
        rows.append(
            (
                wavelength_angstrom * 1e-10,
                throughput,
                wavelength_text,
                throughput_text,
            )
        )
    if len(rows) != 8705 or any(
        right[0] <= left[0] for left, right in zip(rows, rows[1:])
    ):
        raise RuntimeError("v384-python-profile-identity")
    visible = [row for row in rows if 4000.0 <= float(row[2]) <= 7000.0]
    if (
        len(visible) != 3301
        or float(visible[0][2]) != 4000.0
        or float(visible[-1][2]) != 7000.0
    ):
        raise RuntimeError("v384-python-visible-boundary")
    canonical = "".join(
        f"{row[2]},{row[3]}\n" for row in visible
    ).encode("utf-8")
    return visible, sha256_bytes(canonical)


def interpolate_throughput(wavelength_m, wavelengths, throughputs):
    if wavelength_m <= wavelengths[0]:
        return throughputs[0]
    if wavelength_m >= wavelengths[-1]:
        return throughputs[-1]
    right = bisect.bisect_left(wavelengths, wavelength_m)
    if wavelengths[right] == wavelength_m:
        return throughputs[right]
    left = right - 1
    fraction = (wavelength_m - wavelengths[left]) / (
        wavelengths[right] - wavelengths[left]
    )
    return throughputs[left] + fraction * (
        throughputs[right] - throughputs[left]
    )


def photon_per_hz(frequency_hz, temperature_k, redshift_factor):
    emitted_frequency_hz = frequency_hz / redshift_factor
    exponent = H * emitted_frequency_hz / (KB * temperature_k)
    emitted_energy_radiance = (
        2 * H * emitted_frequency_hz**3 / C**2 / math.expm1(exponent)
    )
    observed_energy_radiance = redshift_factor**3 * emitted_energy_radiance
    value = observed_energy_radiance / (H * frequency_hz)
    if not math.isfinite(value) or value <= 0:
        raise RuntimeError("v384-python-spectral-radiance")
    return value


def simpson_integral(temperature_k, redshift_factor, wavelengths, throughputs, weighted):
    width = (UPPER_FREQUENCY_HZ - LOWER_FREQUENCY_HZ) / STEPS
    total = 0.0
    for index in range(STEPS + 1):
        frequency_hz = LOWER_FREQUENCY_HZ + index * width
        value = photon_per_hz(frequency_hz, temperature_k, redshift_factor)
        if weighted:
            wavelength_m = C / frequency_hz
            value *= interpolate_throughput(
                wavelength_m, wavelengths, throughputs
            )
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * value
    result = total * width / 3
    if not math.isfinite(result) or result <= 0:
        raise RuntimeError("v384-python-integral")
    return result


def relative_difference(left, right):
    return abs(left - right) / max(float.fromhex("0x0.0000000000001p-1022"), abs(left), abs(right))


def main():
    raw = RAW.read_bytes()
    profile, source_row_sha = parse_profile(raw)
    wavelengths = [row[0] for row in profile]
    throughputs = [row[1] for row in profile]
    photon_outer = json.loads(PHOTON.read_text(encoding="utf-8"))
    if photon_outer.get("artifactSha256") != EXPECTED_PHOTON_ARTIFACT_SHA256:
        raise RuntimeError("v384-python-v328-artifact-sha")
    view = photon_outer.get("view")
    if (
        not isinstance(view, dict)
        or view.get("status") != "qualified-fixed-band-photon-radiance"
        or len(view.get("rays", [])) != 4
    ):
        raise RuntimeError("v384-python-v328-view")
    rows = []
    maximum_reconstruction = 0.0
    for ray in view["rays"]:
        visible = next(
            measurement
            for measurement in ray["measurements"]
            if measurement["bandId"] == "visible"
        )
        unweighted = simpson_integral(
            ray["effectiveTemperatureK"],
            ray["redshiftFactor"],
            wavelengths,
            throughputs,
            False,
        )
        weighted = simpson_integral(
            ray["effectiveTemperatureK"],
            ray["redshiftFactor"],
            wavelengths,
            throughputs,
            True,
        )
        reconstruction_difference = relative_difference(
            unweighted, visible["observedPhotonRadiancePerSM2Sr"]
        )
        maximum_reconstruction = max(
            maximum_reconstruction, reconstruction_difference
        )
        rows.append(
            {
                "rayIndex": ray["rayIndex"],
                "unweightedPhotonRadiancePerSM2Sr": unweighted,
                "throughputWeightedPhotonRadiancePerSM2Sr": weighted,
                "effectiveBandThroughput": weighted / unweighted,
                "sourceReconstructionRelativeDifference": reconstruction_difference,
            }
        )
    unsigned = {
        "version": "v384-visible-photon-frequency-domain-python-oracle-v1",
        "status": "qualified-independent-frequency-domain-simpson-oracle",
        "input": {
            "rawProfileSha256": sha256_bytes(raw),
            "sourceRowCanonicalSha256": source_row_sha,
            "v328PhotonArtifactSha256": photon_outer["artifactSha256"],
            "v328FullShortAuthoritySha256": view["source"][
                "fullShortAuthoritySha256"
            ],
        },
        "parser": "python-xml-etree-plus-json-standard-library",
        "integration": "frequency-domain-fixed-simpson-65536-with-linear-throughput-interpolation",
        "steps": STEPS,
        "rows": rows,
        "maximumSourceReconstructionRelativeDifference": maximum_reconstruction,
        "networkAttempted": False,
        "electronExpectationAvailable": False,
        "observedCountsAvailable": False,
        "denseCampaignStatus": "incomplete-0-of-49",
    }
    encoded = json.dumps(
        unsigned,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    artifact = {**unsigned, "artifactSha256": sha256_bytes(encoded)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    temporary.write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, OUTPUT)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "rows": len(rows),
                "sourceRowCanonicalSha256": source_row_sha,
                "maximumSourceReconstructionRelativeDifference": maximum_reconstruction,
                "effectiveThroughputRange": [
                    min(row["effectiveBandThroughput"] for row in rows),
                    max(row["effectiveBandThroughput"] for row in rows),
                ],
                "electronExpectationAvailable": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

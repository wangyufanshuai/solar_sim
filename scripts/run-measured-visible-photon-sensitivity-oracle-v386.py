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
OBSERVABLE = ROOT / "dist/science/measured-visible-photon-observable-v384/observable.json"
THROUGHPUT = ROOT / "dist/science/measured-visible-throughput-v383/manifest.json"
OUTPUT = ROOT / "dist/science/measured-visible-photon-sensitivity-v386/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
LOWER_WAVELENGTH_M = 4e-7
UPPER_WAVELENGTH_M = 7e-7
BIN_COUNT = 12
TOTAL_STEPS = 65_536
BIN_STEPS = 4_096
FINITE_DIFFERENCE_STEP = 1e-4
EXPECTED_V384_SHA256 = "273831217d1ce94ffd36fe1c33bb389ddfd202d5094b0ca05617c5f949acdc42"
EXPECTED_V383_SHA256 = "f3c43854906a8441dacb357c0a45e3e4ad6e7333b760d25720a1d083387ea88e"


def canonicalize(value):
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "artifactSha256"}
        }
    return value


def canonical_sha(value) -> str:
    encoded = json.dumps(
        canonicalize(value),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def sha_bytes(value: bytes) -> str:
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
            raise RuntimeError("v386-oracle-profile-row")
        wavelength_angstrom = float(cells[0].text.strip())
        rows.append(
            (
                wavelength_angstrom * 1e-10,
                float(cells[1].text.strip()),
                wavelength_angstrom,
            )
        )
    visible = [row for row in rows if 4000.0 <= row[2] <= 7000.0]
    if (
        len(rows) != 8_705
        or len(visible) != 3_301
        or abs(visible[0][0] - LOWER_WAVELENGTH_M) / LOWER_WAVELENGTH_M >= 1e-15
        or abs(visible[-1][0] - UPPER_WAVELENGTH_M) / UPPER_WAVELENGTH_M >= 1e-15
        or any(right[0] <= left[0] for left, right in zip(visible, visible[1:]))
    ):
        raise RuntimeError("v386-oracle-profile-identity")
    return [(row[0], row[1]) for row in visible]


def interpolate(wavelength_m, wavelengths, throughputs):
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
    return throughputs[left] + fraction * (throughputs[right] - throughputs[left])


def photon_and_sensitivity_per_hz(frequency_hz, temperature_k, redshift_factor):
    emitted_frequency_hz = frequency_hz / redshift_factor
    exponent = H * emitted_frequency_hz / (KB * temperature_k)
    emitted_energy_radiance = (
        2 * H * emitted_frequency_hz**3 / C**2 / math.expm1(exponent)
    )
    observed_energy_radiance = redshift_factor**3 * emitted_energy_radiance
    photon_radiance = observed_energy_radiance / (H * frequency_hz)
    sensitivity = exponent / -math.expm1(-exponent)
    if (
        not math.isfinite(photon_radiance)
        or photon_radiance <= 0
        or not math.isfinite(sensitivity)
        or sensitivity <= 0
    ):
        raise RuntimeError("v386-oracle-spectral-response")
    return photon_radiance, sensitivity


def simpson_pair(
    lower_frequency_hz,
    upper_frequency_hz,
    steps,
    temperature_k,
    redshift_factor,
    wavelengths,
    throughputs,
):
    width = (upper_frequency_hz - lower_frequency_hz) / steps
    total = 0.0
    derivative = 0.0
    for index in range(steps + 1):
        frequency_hz = lower_frequency_hz + index * width
        photon, sensitivity = photon_and_sensitivity_per_hz(
            frequency_hz, temperature_k, redshift_factor
        )
        throughput = interpolate(C / frequency_hz, wavelengths, throughputs)
        coefficient = 1 if index in (0, steps) else 2 if index % 2 == 0 else 4
        weighted = photon * throughput
        total += coefficient * weighted
        derivative += coefficient * weighted * sensitivity
    scale = width / 3
    return total * scale, derivative * scale


def total_integral(temperature_k, redshift_factor, wavelengths, throughputs):
    return simpson_pair(
        C / UPPER_WAVELENGTH_M,
        C / LOWER_WAVELENGTH_M,
        TOTAL_STEPS,
        temperature_k,
        redshift_factor,
        wavelengths,
        throughputs,
    )


def central_log_sensitivity(
    temperature_k, redshift_factor, parameter, wavelengths, throughputs
):
    step = FINITE_DIFFERENCE_STEP
    plus_temperature = temperature_k * (1 + step) if parameter == "temperature" else temperature_k
    minus_temperature = temperature_k * (1 - step) if parameter == "temperature" else temperature_k
    plus_redshift = redshift_factor * (1 + step) if parameter == "redshift" else redshift_factor
    minus_redshift = redshift_factor * (1 - step) if parameter == "redshift" else redshift_factor
    plus = total_integral(plus_temperature, plus_redshift, wavelengths, throughputs)[0]
    minus = total_integral(minus_temperature, minus_redshift, wavelengths, throughputs)[0]
    return math.log(plus / minus) / math.log((1 + step) / (1 - step))


def main():
    raw = RAW.read_bytes()
    profile = parse_profile(raw)
    wavelengths = [row[0] for row in profile]
    throughputs = [row[1] for row in profile]
    observable = json.loads(OBSERVABLE.read_text(encoding="utf-8"))
    throughput = json.loads(THROUGHPUT.read_text(encoding="utf-8"))
    if (
        observable.get("artifactSha256") != EXPECTED_V384_SHA256
        or throughput.get("artifactSha256") != EXPECTED_V383_SHA256
        or observable.get("source", {}).get("v383ThroughputArtifactSha256")
        != throughput.get("artifactSha256")
        or throughput.get("input", {}).get("rawProfileSha256") != sha_bytes(raw)
        or len(observable.get("rows", [])) != 4
    ):
        raise RuntimeError("v386-oracle-input-identity")
    rows = []
    maximum_finite_difference = 0.0
    maximum_degeneracy = 0.0
    for source in observable["rows"]:
        total, derivative = total_integral(
            source["effectiveTemperatureK"],
            source["redshiftFactor"],
            wavelengths,
            throughputs,
        )
        bin_contributions = []
        for index in range(BIN_COUNT):
            lower_wavelength = LOWER_WAVELENGTH_M + index * (
                UPPER_WAVELENGTH_M - LOWER_WAVELENGTH_M
            ) / BIN_COUNT
            upper_wavelength = LOWER_WAVELENGTH_M + (index + 1) * (
                UPPER_WAVELENGTH_M - LOWER_WAVELENGTH_M
            ) / BIN_COUNT
            contribution, _ = simpson_pair(
                C / upper_wavelength,
                C / lower_wavelength,
                BIN_STEPS,
                source["effectiveTemperatureK"],
                source["redshiftFactor"],
                wavelengths,
                throughputs,
            )
            bin_contributions.append(contribution)
        bin_total = math.fsum(bin_contributions)
        weights = [entry / bin_total for entry in bin_contributions]
        analytic = derivative / total
        temperature_fd = central_log_sensitivity(
            source["effectiveTemperatureK"],
            source["redshiftFactor"],
            "temperature",
            wavelengths,
            throughputs,
        )
        redshift_fd = central_log_sensitivity(
            source["effectiveTemperatureK"],
            source["redshiftFactor"],
            "redshift",
            wavelengths,
            throughputs,
        )
        temperature_difference = abs(analytic - temperature_fd) / max(
            abs(analytic), abs(temperature_fd)
        )
        redshift_difference = abs(analytic - redshift_fd) / max(
            abs(analytic), abs(redshift_fd)
        )
        degeneracy = abs(temperature_fd - redshift_fd)
        maximum_finite_difference = max(
            maximum_finite_difference,
            temperature_difference,
            redshift_difference,
        )
        maximum_degeneracy = max(maximum_degeneracy, degeneracy)
        rows.append(
            {
                "rayIndex": source["rayIndex"],
                "throughputBinWeights": weights,
                "throughputWeightSum": math.fsum(weights),
                "logTemperatureSensitivity": analytic,
                "logRedshiftSensitivity": analytic,
                "temperatureFiniteDifferenceLogSensitivity": temperature_fd,
                "redshiftFiniteDifferenceLogSensitivity": redshift_fd,
                "sourceSensitivityDegeneracyAbsoluteDifference": degeneracy,
            }
        )
    unsigned = {
        "version": "v386-visible-photon-sensitivity-python-oracle-v1",
        "status": "qualified-independent-frequency-domain-sensitivity-oracle",
        "source": {
            "rawProfileSha256": sha_bytes(raw),
            "v384ObservableArtifactSha256": observable["artifactSha256"],
            "v383ThroughputArtifactSha256": throughput["artifactSha256"],
        },
        "parser": "python-xml-etree-plus-json-standard-library",
        "integration": "frequency-domain-simpson-65536-total-4096-per-bin",
        "derivative": "analytic-planck-plus-central-log-finite-difference",
        "rows": rows,
        "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
        "maximumSourceSensitivityDegeneracyAbsoluteDifference": maximum_degeneracy,
        "sourceJacobianRank": 1,
        "sourceIdentifiableCombination": "ln-g-plus-ln-T",
        "suppliedCovarianceAvailable": False,
        "uncertaintyProjectionAvailable": False,
        "networkAttempted": False,
        "absoluteScientificUncertaintyQualified": False,
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
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
                "binsPerRay": BIN_COUNT,
                "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
                "maximumSourceSensitivityDegeneracyAbsoluteDifference": maximum_degeneracy,
                "sourceJacobianRank": 1,
                "uncertaintyProjectionAvailable": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

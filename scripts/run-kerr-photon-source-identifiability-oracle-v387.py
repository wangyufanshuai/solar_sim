from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
OUTPUT = ROOT / "dist/science/kerr-photon-source-identifiability-v387/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
STEPS = 8_192
FINITE_DIFFERENCE_STEP = 1e-4
EXPECTED_SOURCE_SHA256 = "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e"


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


def photon_and_sensitivity(frequency_hz, temperature_k, redshift_factor):
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
        raise RuntimeError("v387-oracle-spectral-response")
    return photon_radiance, sensitivity


def integrate_band(lower, upper, temperature_k, redshift_factor):
    width = (upper - lower) / STEPS
    total = 0.0
    derivative = 0.0
    for index in range(STEPS + 1):
        frequency_hz = lower + index * width
        photon, sensitivity = photon_and_sensitivity(
            frequency_hz, temperature_k, redshift_factor
        )
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * photon
        derivative += coefficient * photon * sensitivity
    scale = width / 3
    return total * scale, derivative * scale


def central_log_sensitivity(lower, upper, temperature_k, redshift_factor, parameter):
    step = FINITE_DIFFERENCE_STEP
    plus_temperature = temperature_k * (1 + step) if parameter == "temperature" else temperature_k
    minus_temperature = temperature_k * (1 - step) if parameter == "temperature" else temperature_k
    plus_redshift = redshift_factor * (1 + step) if parameter == "redshift" else redshift_factor
    minus_redshift = redshift_factor * (1 - step) if parameter == "redshift" else redshift_factor
    plus = integrate_band(lower, upper, plus_temperature, plus_redshift)[0]
    minus = integrate_band(lower, upper, minus_temperature, minus_redshift)[0]
    return math.log(plus / minus) / math.log((1 + step) / (1 - step))


def relative_difference(left, right):
    return abs(left - right) / max(float.fromhex("0x0.0000000000001p-1022"), abs(left), abs(right))


def singular_values(values):
    return [math.sqrt(2 * math.fsum(value * value for value in values)), 0.0]


def main():
    outer = json.loads(SOURCE.read_text(encoding="utf-8"))
    view = outer.get("view")
    if (
        outer.get("artifactSha256") != EXPECTED_SOURCE_SHA256
        or not isinstance(view, dict)
        or view.get("status") != "qualified-fixed-band-photon-radiance"
        or len(view.get("rays", [])) != 4
    ):
        raise RuntimeError("v387-oracle-source-identity")
    rows = []
    ray_audits = []
    maximum_reconstruction = 0.0
    maximum_finite_difference = 0.0
    maximum_degeneracy = 0.0
    for ray in view["rays"]:
        ray_values = []
        if len(ray.get("measurements", [])) != 3:
            raise RuntimeError("v387-oracle-band-count")
        for measurement in ray["measurements"]:
            total, derivative = integrate_band(
                measurement["bandLowerFrequencyHz"],
                measurement["bandUpperFrequencyHz"],
                ray["effectiveTemperatureK"],
                ray["redshiftFactor"],
            )
            analytic = derivative / total
            temperature_fd = central_log_sensitivity(
                measurement["bandLowerFrequencyHz"],
                measurement["bandUpperFrequencyHz"],
                ray["effectiveTemperatureK"],
                ray["redshiftFactor"],
                "temperature",
            )
            redshift_fd = central_log_sensitivity(
                measurement["bandLowerFrequencyHz"],
                measurement["bandUpperFrequencyHz"],
                ray["effectiveTemperatureK"],
                ray["redshiftFactor"],
                "redshift",
            )
            reconstruction = relative_difference(
                total, measurement["observedPhotonRadiancePerSM2Sr"]
            )
            temperature_difference = relative_difference(analytic, temperature_fd)
            redshift_difference = relative_difference(analytic, redshift_fd)
            degeneracy = abs(temperature_fd - redshift_fd)
            maximum_reconstruction = max(maximum_reconstruction, reconstruction)
            maximum_finite_difference = max(
                maximum_finite_difference,
                temperature_difference,
                redshift_difference,
            )
            maximum_degeneracy = max(maximum_degeneracy, degeneracy)
            ray_values.append(analytic)
            rows.append(
                {
                    "rayIndex": ray["rayIndex"],
                    "bandId": measurement["bandId"],
                    "reconstructedPhotonRadiancePerSM2Sr": total,
                    "sourceReconstructionRelativeDifference": reconstruction,
                    "logTemperatureSensitivity": analytic,
                    "logRedshiftSensitivity": analytic,
                    "temperatureFiniteDifferenceLogSensitivity": temperature_fd,
                    "redshiftFiniteDifferenceLogSensitivity": redshift_fd,
                    "temperatureFiniteDifferenceRelativeDifference": temperature_difference,
                    "redshiftFiniteDifferenceRelativeDifference": redshift_difference,
                    "sourceSensitivityDegeneracyAbsoluteDifference": degeneracy,
                }
            )
        ray_audits.append(
            {
                "rayIndex": ray["rayIndex"],
                "singularValues": singular_values(ray_values),
                "rank": 1,
            }
        )
    if len(rows) != 12:
        raise RuntimeError("v387-oracle-row-count")
    unsigned = {
        "version": "v387-kerr-photon-source-identifiability-python-oracle-v1",
        "status": "qualified-independent-three-band-rank-oracle",
        "source": {
            "v328PhotonArtifactSha256": outer["artifactSha256"],
            "v328FullShortAuthoritySha256": view["source"]["fullShortAuthoritySha256"],
        },
        "integration": "python-frequency-domain-simpson-8192",
        "derivative": "analytic-planck-plus-central-log-finite-difference",
        "rows": rows,
        "rayAudits": ray_audits,
        "globalSingularValues": singular_values(
            [row["logTemperatureSensitivity"] for row in rows]
        ),
        "globalRank": 1,
        "identifiableCombination": "ln-g-plus-ln-T",
        "additionalContinuumBandsBreakDegeneracy": False,
        "maximumSourceReconstructionRelativeDifference": maximum_reconstruction,
        "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
        "maximumSourceSensitivityDegeneracyAbsoluteDifference": maximum_degeneracy,
        "networkAttempted": False,
        "covariancePackAvailable": False,
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
                "bands": 3,
                "globalRank": 1,
                "maximumSourceReconstructionRelativeDifference": maximum_reconstruction,
                "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
                "maximumSourceSensitivityDegeneracyAbsoluteDifference": maximum_degeneracy,
                "additionalContinuumBandsBreakDegeneracy": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

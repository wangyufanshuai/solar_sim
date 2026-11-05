from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import mpmath as mp


ROOT = Path.cwd()
PATHS = {
    "v320": Path("dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"),
    "v406": Path("dist/science/kerr-stokes-transfer-v406/short-gate.json"),
    "v519": Path("dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json"),
    "v520": Path("dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json"),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
DIRECT_RELATIVE_LIMIT = mp.mpf("1e-20")
FRACTION_RESIDUAL_LIMIT = mp.mpf("1e-20")
EVPA_RECONSTRUCTION_LIMIT_DEG = mp.mpf("1e-20")
METHOD_EVPA_DIFFERENCE_LIMIT_DEG = mp.mpf("1e-9")
METHOD_NORMALIZED_STOKES_LIMIT = mp.mpf("1e-12")
H = mp.mpf("6.62607015e-34")
C = mp.mpf("299792458")
KB = mp.mpf("1.380649e-23")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def file_sha(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in TRANSIENT
        }
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
        ).encode("utf-8")
    ).hexdigest()


def decimal_string(value: mp.mpf | float | int) -> str:
    return mp.nstr(mp.mpf(str(value)), 25)


def relative_difference(left: mp.mpf, right: mp.mpf) -> mp.mpf:
    return abs(left - right) / max(mp.mpf("1e-300"), abs(left), abs(right))


def axial_difference_deg(first: mp.mpf, second: mp.mpf) -> mp.mpf:
    difference = abs(first - second) % mp.mpf(180)
    return min(difference, mp.mpf(180) - difference)


def normalize_evpa_deg(value: mp.mpf) -> mp.mpf:
    return value % mp.mpf(180)


def planck_radiance(temperature_k: mp.mpf, frequency_hz: mp.mpf) -> mp.mpf:
    exponent = H * frequency_hz / (KB * temperature_k)
    return (mp.mpf(2) * H * frequency_hz**3 / C**2) / mp.expm1(exponent)


def integrate_direct_stokes(
    temperature_k: mp.mpf,
    redshift_factor: mp.mpf,
    lower_hz: mp.mpf,
    upper_hz: mp.mpf,
    polarization_fraction: mp.mpf,
    evpa_deg: mp.mpf,
) -> tuple[tuple[mp.mpf, mp.mpf, mp.mpf], tuple[mp.mpf, mp.mpf, mp.mpf]]:
    lower_log = mp.log(lower_hz)
    upper_log = mp.log(upper_hz)
    angle = mp.radians(mp.mpf(2) * evpa_deg)
    q_factor = polarization_fraction * mp.cos(angle)
    u_factor = polarization_fraction * mp.sin(angle)

    def observed_spectral(log_frequency: mp.mpf) -> mp.mpf:
        observed_frequency = mp.exp(log_frequency)
        emitted_frequency = observed_frequency / redshift_factor
        return redshift_factor**3 * planck_radiance(temperature_k, emitted_frequency)

    energy_i = mp.quadts(
        lambda log_frequency: observed_spectral(log_frequency) * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    energy_q = mp.quadts(
        lambda log_frequency: q_factor
        * observed_spectral(log_frequency)
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    energy_u = mp.quadts(
        lambda log_frequency: u_factor
        * observed_spectral(log_frequency)
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    photon_i = mp.quadts(
        lambda log_frequency: observed_spectral(log_frequency) / H,
        [lower_log, upper_log],
    )
    photon_q = mp.quadts(
        lambda log_frequency: q_factor * observed_spectral(log_frequency) / H,
        [lower_log, upper_log],
    )
    photon_u = mp.quadts(
        lambda log_frequency: u_factor * observed_spectral(log_frequency) / H,
        [lower_log, upper_log],
    )
    return (energy_i, energy_q, energy_u), (photon_i, photon_q, photon_u)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v320 = read_json(PATHS["v320"])
    v406 = read_json(PATHS["v406"])
    v519 = read_json(PATHS["v519"])
    v520 = read_json(PATHS["v520"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    view406 = v406.get("view", {})
    if (
        v320.get("version") != "v320-kerr-thin-disk-fixed-band-artifact-v1"
        or view406.get("status") != "qualified-sparse-derived-stokes-transfer"
        or view406.get("counts", {}).get("stokesSampleCount") != 24
        or v519.get("version")
        != "v519-kerr-fixed-band-radiometry-multiprecision-oracle-v1"
        or canonical_sha(v519) != v519.get("artifactSha256")
        or v520.get("version") != "v520-kerr-fixed-band-stokes-payload-v1"
        or canonical_sha(v520) != v520.get("artifactSha256")
        or v520.get("counts", {}).get("rowCount") != 24
        or v520.get("oracle", {}).get("methodValuesAveraged") is not False
        or dense.get("status") != "incomplete-0-of-49"
        or dense.get("completedShardCount") != 0
        or dense.get("attemptConsumed") is not False
        or dense.get("aggregateAvailable") is not False
        or formal.get("version") != "v263-current-product-evidence-pointer"
        or formal_evidence.get("science", {}).get("defaultKernel") != "legacy-eih-1pn"
        or formal_evidence.get("contracts", {}).get("singleCanvas") is not True
        or formal_evidence.get("contracts", {}).get("legacyRootAttributes") != 603
        or formal_evidence.get("contracts", {}).get("evidenceLedgerClaims") != 84
    ):
        raise ValueError("v521-upstream-boundary")

    band_view = v320["view"]
    if (
        band_view.get("status") != "qualified-fixed-band-sparse-science-imaging"
        or band_view.get("counts", {}).get("applicableDiskRayCount") != 4
        or view406.get("model", {}).get("emittedLinearPolarizationFraction") != 0.12
        or view406.get("model", {}).get("circularPolarization")
        != "unavailable-not-modeled"
        or view406.get("model", {}).get("faradayRotation")
        != "unavailable-not-modeled"
    ):
        raise ValueError("v521-source-contract")

    polarization_fraction = mp.mpf("0.12")
    definitions = {entry["id"]: entry for entry in band_view["definitions"]}
    source_rays = {
        entry["rayIndex"]: entry for entry in band_view["samples"] if entry["applicable"]
    }
    v519_rows = {(row["rayIndex"], row["bandId"]): row for row in v519["rows"]}
    v520_rows = {
        (row["rayIndex"], row["bandId"], row["transportMethod"]): row
        for row in v520["rows"]
    }
    methods = ("walker-penrose", "independent-ks-parallel-transport")
    evpa_groups: dict[tuple[int, str], list[mp.mpf]] = {}
    for sample in view406["samples"]:
        evpa_groups.setdefault(
            (sample["rayIndex"], sample["transportMethod"]), []
        ).append(mp.mpf(str(sample["evpaDeg"])))
    evpa_by_identity: dict[tuple[int, str], mp.mpf] = {}
    maximum_source_frequency_evpa_variation = mp.mpf(0)
    for ray_index in (12, 13, 14, 15):
        for method in methods:
            values = evpa_groups.get((ray_index, method), [])
            if len(values) != 3:
                raise ValueError(f"v521-evpa-count:{ray_index}:{method}")
            variation = max(axial_difference_deg(values[0], value) for value in values)
            maximum_source_frequency_evpa_variation = max(
                maximum_source_frequency_evpa_variation, variation
            )
            if variation >= METHOD_EVPA_DIFFERENCE_LIMIT_DEG:
                raise ValueError(f"v521-frequency-evpa-variation:{ray_index}:{method}")
            evpa_by_identity[(ray_index, method)] = normalize_evpa_deg(values[0])

    rows: list[dict[str, Any]] = []
    maxima = {
        "energyI": mp.mpf(0),
        "energyQ": mp.mpf(0),
        "energyU": mp.mpf(0),
        "photonI": mp.mpf(0),
        "photonQ": mp.mpf(0),
        "photonU": mp.mpf(0),
        "linearFraction": mp.mpf(0),
        "evpa": mp.mpf(0),
        "cone": mp.mpf(0),
        "methodEvpa": mp.mpf(0),
        "methodQ": mp.mpf(0),
        "methodU": mp.mpf(0),
    }
    for ray_index in (12, 13, 14, 15):
        source_ray = source_rays[ray_index]
        temperature = mp.mpf(str(source_ray["effectiveTemperatureK"]))
        redshift = mp.mpf(str(source_ray["redshiftFactor"]))
        for band_id in ("visible", "euv", "soft-x-ray"):
            definition = definitions[band_id]
            lower = mp.mpf(str(definition["lowerFrequencyHz"]))
            upper = mp.mpf(str(definition["upperFrequencyHz"]))
            radiometry = v519_rows[(ray_index, band_id)]
            for method in methods:
                evpa_deg = evpa_by_identity[(ray_index, method)]
                direct_energy, direct_photon = integrate_direct_stokes(
                    temperature,
                    redshift,
                    lower,
                    upper,
                    polarization_fraction,
                    evpa_deg,
                )
                stored = v520_rows[(ray_index, band_id, method)]
                stored_energy = (
                    mp.mpf(stored["energyStokes"]["iWM2Sr"]),
                    mp.mpf(stored["energyStokes"]["qWM2Sr"]),
                    mp.mpf(stored["energyStokes"]["uWM2Sr"]),
                )
                stored_photon = (
                    mp.mpf(stored["photonStokes"]["iPerSM2Sr"]),
                    mp.mpf(stored["photonStokes"]["qPerSM2Sr"]),
                    mp.mpf(stored["photonStokes"]["uPerSM2Sr"]),
                )
                energy_differences = tuple(
                    relative_difference(direct, reference)
                    for direct, reference in zip(direct_energy, stored_energy)
                )
                photon_differences = tuple(
                    relative_difference(direct, reference)
                    for direct, reference in zip(direct_photon, stored_photon)
                )
                for key, value in zip(("energyI", "energyQ", "energyU"), energy_differences):
                    maxima[key] = max(maxima[key], value)
                for key, value in zip(("photonI", "photonQ", "photonU"), photon_differences):
                    maxima[key] = max(maxima[key], value)
                normalized_q = direct_energy[1] / direct_energy[0]
                normalized_u = direct_energy[2] / direct_energy[0]
                fraction = mp.sqrt(normalized_q**2 + normalized_u**2)
                reconstructed_evpa = normalize_evpa_deg(
                    mp.degrees(mp.atan2(normalized_u, normalized_q)) / mp.mpf(2)
                )
                fraction_residual = abs(fraction - polarization_fraction)
                evpa_residual = axial_difference_deg(reconstructed_evpa, evpa_deg)
                cone = max(
                    mp.mpf(0),
                    direct_energy[1] ** 2 + direct_energy[2] ** 2 - direct_energy[0] ** 2,
                    direct_photon[1] ** 2 + direct_photon[2] ** 2 - direct_photon[0] ** 2,
                )
                maxima["linearFraction"] = max(maxima["linearFraction"], fraction_residual)
                maxima["evpa"] = max(maxima["evpa"], evpa_residual)
                maxima["cone"] = max(maxima["cone"], cone)
                rows.append(
                    {
                        "rayIndex": ray_index,
                        "bandId": band_id,
                        "transportMethod": method,
                        "evpaDeg": decimal_string(evpa_deg),
                        "linearPolarizationFraction": decimal_string(polarization_fraction),
                        "directEnergyStokes": {
                            "iWM2Sr": decimal_string(direct_energy[0]),
                            "qWM2Sr": decimal_string(direct_energy[1]),
                            "uWM2Sr": decimal_string(direct_energy[2]),
                            "v": "unavailable-not-modeled",
                        },
                        "directPhotonStokes": {
                            "iPerSM2Sr": decimal_string(direct_photon[0]),
                            "qPerSM2Sr": decimal_string(direct_photon[1]),
                            "uPerSM2Sr": decimal_string(direct_photon[2]),
                            "v": "unavailable-not-modeled",
                        },
                        "v520EnergyStokes": stored["energyStokes"],
                        "v520PhotonStokes": stored["photonStokes"],
                        "relativeDifferences": {
                            "energyI": decimal_string(energy_differences[0]),
                            "energyQ": decimal_string(energy_differences[1]),
                            "energyU": decimal_string(energy_differences[2]),
                            "photonI": decimal_string(photon_differences[0]),
                            "photonQ": decimal_string(photon_differences[1]),
                            "photonU": decimal_string(photon_differences[2]),
                        },
                        "residuals": {
                            "linearFractionAbsolute": decimal_string(fraction_residual),
                            "evpaReconstructionDeg": decimal_string(evpa_residual),
                            "physicalConeViolation": decimal_string(cone),
                        },
                        "uncertaintyEnvelope": {
                            "upstreamEnergyRadiometryRelative": radiometry[
                                "energyRadianceRelativeDifference"
                            ],
                            "upstreamPhotonRadiometryRelative": radiometry[
                                "photonRadianceRelativeDifference"
                            ],
                            "directIntegrationEnergyRelative": decimal_string(
                                max(energy_differences)
                            ),
                            "directIntegrationPhotonRelative": decimal_string(
                                max(photon_differences)
                            ),
                            "crossChannelIndependenceProven": False,
                            "rssApplied": False,
                            "scalarTotalAvailable": False,
                            "combination": "componentwise-linear-envelope-no-rss-no-scalar-total",
                        },
                        "applicability": "model-predicted-direct-fixed-band-linear-stokes-only",
                    }
                )

    for ray_index in (12, 13, 14, 15):
        wp = evpa_by_identity[(ray_index, methods[0])]
        ks = evpa_by_identity[(ray_index, methods[1])]
        maxima["methodEvpa"] = max(maxima["methodEvpa"], axial_difference_deg(wp, ks))
        wp_angle = mp.radians(mp.mpf(2) * wp)
        ks_angle = mp.radians(mp.mpf(2) * ks)
        maxima["methodQ"] = max(
            maxima["methodQ"],
            abs(polarization_fraction * (mp.cos(wp_angle) - mp.cos(ks_angle))),
        )
        maxima["methodU"] = max(
            maxima["methodU"],
            abs(polarization_fraction * (mp.sin(wp_angle) - mp.sin(ks_angle))),
        )

    if (
        len(rows) != 24
        or any(maxima[key] >= DIRECT_RELATIVE_LIMIT for key in (
            "energyI", "energyQ", "energyU", "photonI", "photonQ", "photonU"
        ))
        or maxima["linearFraction"] >= FRACTION_RESIDUAL_LIMIT
        or maxima["evpa"] >= EVPA_RECONSTRUCTION_LIMIT_DEG
        or maxima["methodEvpa"] >= METHOD_EVPA_DIFFERENCE_LIMIT_DEG
        or maxima["methodQ"] >= METHOD_NORMALIZED_STOKES_LIMIT
        or maxima["methodU"] >= METHOD_NORMALIZED_STOKES_LIMIT
        or maxima["cone"] != 0
    ):
        raise ValueError(f"v521-threshold:{maxima}")

    source_paths = [
        PATHS["v320"],
        PATHS["v406"],
        PATHS["v519"],
        PATHS["v520"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-fixed-band-stokes-oracle-v521.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v521-kerr-fixed-band-stokes-direct-integration-oracle-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "direct-fixed-band-stokes-multiprecision-oracle-qualified-24-rows",
        "source": {
            "v320ArtifactSha256": v320["artifactSha256"],
            "v406ArtifactSha256": v406["artifactSha256"],
            "v519ArtifactSha256": v519["artifactSha256"],
            "v520ArtifactSha256": v520["artifactSha256"],
            "fullShortAuthoritySha256": view406["authority"]["fullShortAuthoritySha256"],
        },
        "model": {
            "linearPolarizationFraction": decimal_string(polarization_fraction),
            "emittedBasis": view406["model"]["emittedBasis"],
            "propagation": view406["model"]["propagation"],
            "circularPolarization": "unavailable-not-modeled",
            "faradayRotation": "unavailable-not-modeled",
            "frequencyDependence": "constant-EVPA-and-linear-fraction-within-each-authority-ray",
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "integration": "six-independent-adaptive-tanh-sinh-log-frequency-integrals-per-row",
            "components": ["energy-I", "energy-Q", "energy-U", "photon-I", "photon-Q", "photon-U"],
            "v520IntegratedValuesConsumedAsInputs": False,
            "v520ValuesUsedForComparisonOnly": True,
            "transportMethods": list(methods),
            "independentTransportPathsPreserved": True,
            "methodValuesAveraged": False,
        },
        "counts": {
            "rayCount": 4,
            "bandCount": 3,
            "transportMethodCount": 2,
            "rowCount": 24,
            "directAdaptiveIntegralCount": 144,
            "energyStokesComponentCount": 72,
            "photonStokesComponentCount": 72,
            "componentwiseUncertaintyEnvelopeCount": 24,
            "measuredStokesRowCount": 0,
            "circularStokesRowCount": 0,
            "detectorProjectedRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {
            "directVsV520EnergyIRelative": decimal_string(maxima["energyI"]),
            "directVsV520EnergyQRelative": decimal_string(maxima["energyQ"]),
            "directVsV520EnergyURelative": decimal_string(maxima["energyU"]),
            "directVsV520PhotonIRelative": decimal_string(maxima["photonI"]),
            "directVsV520PhotonQRelative": decimal_string(maxima["photonQ"]),
            "directVsV520PhotonURelative": decimal_string(maxima["photonU"]),
            "linearFractionResidual": decimal_string(maxima["linearFraction"]),
            "evpaReconstructionDeg": decimal_string(maxima["evpa"]),
            "sourceFrequencyEvpaVariationDeg": decimal_string(
                maximum_source_frequency_evpa_variation
            ),
            "wpKsEvpaDifferenceDeg": decimal_string(maxima["methodEvpa"]),
            "wpKsNormalizedQDifference": decimal_string(maxima["methodQ"]),
            "wpKsNormalizedUDifference": decimal_string(maxima["methodU"]),
            "physicalConeViolation": decimal_string(maxima["cone"]),
        },
        "limits": {
            "directVsV520ComponentRelative": decimal_string(DIRECT_RELATIVE_LIMIT),
            "linearFractionResidual": decimal_string(FRACTION_RESIDUAL_LIMIT),
            "evpaReconstructionDeg": decimal_string(EVPA_RECONSTRUCTION_LIMIT_DEG),
            "wpKsEvpaDifferenceDeg": decimal_string(METHOD_EVPA_DIFFERENCE_LIMIT_DEG),
            "wpKsNormalizedStokesDifference": decimal_string(
                METHOD_NORMALIZED_STOKES_LIMIT
            ),
            "physicalConeViolation": "0.0",
        },
        "rows": rows,
        "qualification": {
            "directFrequencyDomainIntegrationQualified": True,
            "energyIquQualified": True,
            "photonIquQualified": True,
            "componentwiseUncertaintyEnvelopeQualified": True,
            "independentTransportPathsQualified": True,
            "crossLanguageCanonicalShaQualified": True,
            "modelPredictionQualified": True,
            "measuredPolarimetryQualified": False,
        },
        "uncertaintyPolicy": {
            "componentwiseOnly": True,
            "crossChannelIndependenceProven": False,
            "rssApplied": False,
            "scalarTotalAvailable": False,
            "correlationModelAvailable": False,
            "combination": "componentwise-linear-envelope-no-rss-no-scalar-total",
        },
        "boundary": {
            "modelPredictionOnly": True,
            "measuredPolarimeterAvailable": False,
            "measuredMuellerCalibrationAvailable": False,
            "circularPolarizationAvailable": False,
            "faradayRotationAvailable": False,
            "detectorThroughputAvailable": False,
            "observedCountsAvailable": False,
            "scienceRasterAuthorityAvailable": False,
            "cinematicScienceWritebackAllowed": False,
            "denseCampaignStatus": "incomplete-0-of-49",
            "browserQualification": "not-run",
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_write(PATHS["output"], artifact)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "rows": artifact["counts"]["rowCount"],
                "directAdaptiveIntegrals": artifact["counts"]["directAdaptiveIntegralCount"],
                "maximumDirectComponentRelative": max(
                    artifact["maxima"][key]
                    for key in (
                        "directVsV520EnergyIRelative",
                        "directVsV520EnergyQRelative",
                        "directVsV520EnergyURelative",
                        "directVsV520PhotonIRelative",
                        "directVsV520PhotonQRelative",
                        "directVsV520PhotonURelative",
                    )
                ),
                "maximumWpKsEvpaDifferenceDeg": artifact["maxima"][
                    "wpKsEvpaDifferenceDeg"
                ],
                "measuredStokesRows": 0,
                "detectorCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

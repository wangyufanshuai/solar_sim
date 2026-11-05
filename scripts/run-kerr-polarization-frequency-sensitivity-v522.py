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
    "v521": Path("dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path(
        "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json"
    ),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
BASELINE_RELATIVE_LIMIT = mp.mpf("1e-20")
MAX_LINEAR_FRACTION_LIMIT = mp.mpf("0.151")
MAX_EVPA_SHIFT_DEG_LIMIT = mp.mpf("5.1")
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


def observed_spectral(
    log_frequency: mp.mpf, temperature_k: mp.mpf, redshift_factor: mp.mpf
) -> mp.mpf:
    observed_frequency = mp.exp(log_frequency)
    emitted_frequency = observed_frequency / redshift_factor
    return redshift_factor**3 * planck_radiance(temperature_k, emitted_frequency)


def integrate_intensity(
    temperature_k: mp.mpf,
    redshift_factor: mp.mpf,
    lower_log: mp.mpf,
    upper_log: mp.mpf,
) -> tuple[mp.mpf, mp.mpf]:
    energy = mp.quadts(
        lambda log_frequency: observed_spectral(
            log_frequency, temperature_k, redshift_factor
        )
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    photon = mp.quadts(
        lambda log_frequency: observed_spectral(
            log_frequency, temperature_k, redshift_factor
        )
        / H,
        [lower_log, upper_log],
    )
    return energy, photon


def integrate_qu(
    temperature_k: mp.mpf,
    redshift_factor: mp.mpf,
    lower_log: mp.mpf,
    upper_log: mp.mpf,
    baseline_fraction: mp.mpf,
    baseline_evpa_deg: mp.mpf,
    fraction_slope: mp.mpf,
    evpa_twist_deg: mp.mpf,
) -> tuple[mp.mpf, mp.mpf, mp.mpf, mp.mpf]:
    midpoint = (lower_log + upper_log) / mp.mpf(2)
    half_width = (upper_log - lower_log) / mp.mpf(2)

    def factors(log_frequency: mp.mpf) -> tuple[mp.mpf, mp.mpf]:
        coordinate = (log_frequency - midpoint) / half_width
        fraction = baseline_fraction * (mp.mpf(1) + fraction_slope * coordinate)
        evpa_deg = baseline_evpa_deg + evpa_twist_deg * coordinate
        angle = mp.radians(mp.mpf(2) * evpa_deg)
        return fraction * mp.cos(angle), fraction * mp.sin(angle)

    energy_q = mp.quadts(
        lambda log_frequency: factors(log_frequency)[0]
        * observed_spectral(log_frequency, temperature_k, redshift_factor)
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    energy_u = mp.quadts(
        lambda log_frequency: factors(log_frequency)[1]
        * observed_spectral(log_frequency, temperature_k, redshift_factor)
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    photon_q = mp.quadts(
        lambda log_frequency: factors(log_frequency)[0]
        * observed_spectral(log_frequency, temperature_k, redshift_factor)
        / H,
        [lower_log, upper_log],
    )
    photon_u = mp.quadts(
        lambda log_frequency: factors(log_frequency)[1]
        * observed_spectral(log_frequency, temperature_k, redshift_factor)
        / H,
        [lower_log, upper_log],
    )
    return energy_q, energy_u, photon_q, photon_u


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
    v521 = read_json(PATHS["v521"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    view406 = v406.get("view", {})
    if (
        v320.get("version") != "v320-kerr-thin-disk-fixed-band-artifact-v1"
        or view406.get("status") != "qualified-sparse-derived-stokes-transfer"
        or v521.get("version")
        != "v521-kerr-fixed-band-stokes-direct-integration-oracle-v1"
        or canonical_sha(v521) != v521.get("artifactSha256")
        or v521.get("counts", {}).get("directAdaptiveIntegralCount") != 144
        or v521.get("qualification", {}).get(
            "directFrequencyDomainIntegrationQualified"
        )
        is not True
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
        raise ValueError("v522-upstream-boundary")

    band_view = v320["view"]
    if (
        band_view.get("status") != "qualified-fixed-band-sparse-science-imaging"
        or band_view.get("counts", {}).get("applicableDiskRayCount") != 4
        or view406.get("model", {}).get("emittedLinearPolarizationFraction") != 0.12
    ):
        raise ValueError("v522-source-contract")

    scenario_plan = []
    for slope_name, slope in (
        ("minus", mp.mpf("-0.25")),
        ("zero", mp.mpf(0)),
        ("plus", mp.mpf("0.25")),
    ):
        for twist_name, twist in (
            ("minus", mp.mpf("-5")),
            ("zero", mp.mpf(0)),
            ("plus", mp.mpf("5")),
        ):
            scenario_plan.append(
                {
                    "scenarioId": f"fraction-{slope_name}-evpa-{twist_name}",
                    "fractionSlopePerNormalizedLogFrequency": decimal_string(slope),
                    "evpaTwistDegPerNormalizedLogFrequency": decimal_string(twist),
                    "baseline": slope == 0 and twist == 0,
                }
            )
    scenario_plan_sha = canonical_sha(scenario_plan)
    definitions = {entry["id"]: entry for entry in band_view["definitions"]}
    source_rays = {
        entry["rayIndex"]: entry for entry in band_view["samples"] if entry["applicable"]
    }
    methods = ("walker-penrose", "independent-ks-parallel-transport")
    evpa_groups: dict[tuple[int, str], list[mp.mpf]] = {}
    for sample in view406["samples"]:
        evpa_groups.setdefault(
            (sample["rayIndex"], sample["transportMethod"]), []
        ).append(mp.mpf(str(sample["evpaDeg"])))
    baseline_evpa = {
        identity: normalize_evpa_deg(values[0])
        for identity, values in evpa_groups.items()
        if len(values) == 3
    }
    v521_rows = {
        (row["rayIndex"], row["bandId"], row["transportMethod"]): row
        for row in v521["rows"]
    }
    if len(baseline_evpa) != 8 or len(v521_rows) != 24:
        raise ValueError("v522-identity")

    scenario_rows: list[dict[str, Any]] = []
    envelope_state: dict[tuple[int, str, str], dict[str, Any]] = {}
    maxima = {
        "baselineEnergyI": mp.mpf(0),
        "baselineEnergyQ": mp.mpf(0),
        "baselineEnergyU": mp.mpf(0),
        "baselinePhotonI": mp.mpf(0),
        "baselinePhotonQ": mp.mpf(0),
        "baselinePhotonU": mp.mpf(0),
        "energyFraction": mp.mpf(0),
        "photonFraction": mp.mpf(0),
        "energyEvpaShift": mp.mpf(0),
        "photonEvpaShift": mp.mpf(0),
        "normalizedQShift": mp.mpf(0),
        "normalizedUShift": mp.mpf(0),
        "cone": mp.mpf(0),
    }
    baseline_fraction = mp.mpf("0.12")
    for ray_index in (12, 13, 14, 15):
        source_ray = source_rays[ray_index]
        temperature = mp.mpf(str(source_ray["effectiveTemperatureK"]))
        redshift = mp.mpf(str(source_ray["redshiftFactor"]))
        for band_id in ("visible", "euv", "soft-x-ray"):
            definition = definitions[band_id]
            lower_log = mp.log(mp.mpf(str(definition["lowerFrequencyHz"])))
            upper_log = mp.log(mp.mpf(str(definition["upperFrequencyHz"])))
            energy_i, photon_i = integrate_intensity(
                temperature, redshift, lower_log, upper_log
            )
            for method in methods:
                identity = (ray_index, band_id, method)
                reference = v521_rows[identity]
                reference_energy = (
                    mp.mpf(reference["directEnergyStokes"]["iWM2Sr"]),
                    mp.mpf(reference["directEnergyStokes"]["qWM2Sr"]),
                    mp.mpf(reference["directEnergyStokes"]["uWM2Sr"]),
                )
                reference_photon = (
                    mp.mpf(reference["directPhotonStokes"]["iPerSM2Sr"]),
                    mp.mpf(reference["directPhotonStokes"]["qPerSM2Sr"]),
                    mp.mpf(reference["directPhotonStokes"]["uPerSM2Sr"]),
                )
                reference_energy_q = reference_energy[1] / reference_energy[0]
                reference_energy_u = reference_energy[2] / reference_energy[0]
                reference_photon_q = reference_photon[1] / reference_photon[0]
                reference_photon_u = reference_photon[2] / reference_photon[0]
                state = {
                    "energyFraction": [],
                    "photonFraction": [],
                    "energyEvpaShift": [],
                    "photonEvpaShift": [],
                    "energyQShift": [],
                    "energyUShift": [],
                    "photonQShift": [],
                    "photonUShift": [],
                }
                envelope_state[identity] = state
                for scenario in scenario_plan:
                    slope = mp.mpf(scenario["fractionSlopePerNormalizedLogFrequency"])
                    twist = mp.mpf(scenario["evpaTwistDegPerNormalizedLogFrequency"])
                    energy_q, energy_u, photon_q, photon_u = integrate_qu(
                        temperature,
                        redshift,
                        lower_log,
                        upper_log,
                        baseline_fraction,
                        baseline_evpa[(ray_index, method)],
                        slope,
                        twist,
                    )
                    energy_normalized_q = energy_q / energy_i
                    energy_normalized_u = energy_u / energy_i
                    photon_normalized_q = photon_q / photon_i
                    photon_normalized_u = photon_u / photon_i
                    energy_fraction = mp.sqrt(
                        energy_normalized_q**2 + energy_normalized_u**2
                    )
                    photon_fraction = mp.sqrt(
                        photon_normalized_q**2 + photon_normalized_u**2
                    )
                    energy_evpa = normalize_evpa_deg(
                        mp.degrees(mp.atan2(energy_normalized_u, energy_normalized_q))
                        / mp.mpf(2)
                    )
                    photon_evpa = normalize_evpa_deg(
                        mp.degrees(mp.atan2(photon_normalized_u, photon_normalized_q))
                        / mp.mpf(2)
                    )
                    energy_evpa_shift = axial_difference_deg(
                        energy_evpa, baseline_evpa[(ray_index, method)]
                    )
                    photon_evpa_shift = axial_difference_deg(
                        photon_evpa, baseline_evpa[(ray_index, method)]
                    )
                    energy_q_shift = abs(energy_normalized_q - reference_energy_q)
                    energy_u_shift = abs(energy_normalized_u - reference_energy_u)
                    photon_q_shift = abs(photon_normalized_q - reference_photon_q)
                    photon_u_shift = abs(photon_normalized_u - reference_photon_u)
                    cone = max(
                        mp.mpf(0),
                        energy_q**2 + energy_u**2 - energy_i**2,
                        photon_q**2 + photon_u**2 - photon_i**2,
                    )
                    for key, value in (
                        ("energyFraction", energy_fraction),
                        ("photonFraction", photon_fraction),
                        ("energyEvpaShift", energy_evpa_shift),
                        ("photonEvpaShift", photon_evpa_shift),
                        ("energyQShift", energy_q_shift),
                        ("energyUShift", energy_u_shift),
                        ("photonQShift", photon_q_shift),
                        ("photonUShift", photon_u_shift),
                    ):
                        state[key].append(value)
                    maxima["energyFraction"] = max(maxima["energyFraction"], energy_fraction)
                    maxima["photonFraction"] = max(maxima["photonFraction"], photon_fraction)
                    maxima["energyEvpaShift"] = max(
                        maxima["energyEvpaShift"], energy_evpa_shift
                    )
                    maxima["photonEvpaShift"] = max(
                        maxima["photonEvpaShift"], photon_evpa_shift
                    )
                    maxima["normalizedQShift"] = max(
                        maxima["normalizedQShift"], energy_q_shift, photon_q_shift
                    )
                    maxima["normalizedUShift"] = max(
                        maxima["normalizedUShift"], energy_u_shift, photon_u_shift
                    )
                    maxima["cone"] = max(maxima["cone"], cone)
                    baseline_differences = {
                        "energyI": relative_difference(energy_i, reference_energy[0]),
                        "energyQ": relative_difference(energy_q, reference_energy[1]),
                        "energyU": relative_difference(energy_u, reference_energy[2]),
                        "photonI": relative_difference(photon_i, reference_photon[0]),
                        "photonQ": relative_difference(photon_q, reference_photon[1]),
                        "photonU": relative_difference(photon_u, reference_photon[2]),
                    }
                    if scenario["baseline"]:
                        for key, value in baseline_differences.items():
                            maxima[f"baseline{key[0].upper()}{key[1:]}"] = max(
                                maxima[f"baseline{key[0].upper()}{key[1:]}"], value
                            )
                    scenario_rows.append(
                        {
                            "rayIndex": ray_index,
                            "bandId": band_id,
                            "transportMethod": method,
                            "scenarioId": scenario["scenarioId"],
                            "fractionSlopePerNormalizedLogFrequency": scenario[
                                "fractionSlopePerNormalizedLogFrequency"
                            ],
                            "evpaTwistDegPerNormalizedLogFrequency": scenario[
                                "evpaTwistDegPerNormalizedLogFrequency"
                            ],
                            "directEnergyStokes": {
                                "iWM2Sr": decimal_string(energy_i),
                                "qWM2Sr": decimal_string(energy_q),
                                "uWM2Sr": decimal_string(energy_u),
                                "v": "unavailable-not-modeled",
                            },
                            "directPhotonStokes": {
                                "iPerSM2Sr": decimal_string(photon_i),
                                "qPerSM2Sr": decimal_string(photon_q),
                                "uPerSM2Sr": decimal_string(photon_u),
                                "v": "unavailable-not-modeled",
                            },
                            "observedEnergy": {
                                "linearFraction": decimal_string(energy_fraction),
                                "evpaDeg": decimal_string(energy_evpa),
                                "evpaShiftFromBaselineDeg": decimal_string(
                                    energy_evpa_shift
                                ),
                                "normalizedQShiftFromBaseline": decimal_string(
                                    energy_q_shift
                                ),
                                "normalizedUShiftFromBaseline": decimal_string(
                                    energy_u_shift
                                ),
                            },
                            "observedPhoton": {
                                "linearFraction": decimal_string(photon_fraction),
                                "evpaDeg": decimal_string(photon_evpa),
                                "evpaShiftFromBaselineDeg": decimal_string(
                                    photon_evpa_shift
                                ),
                                "normalizedQShiftFromBaseline": decimal_string(
                                    photon_q_shift
                                ),
                                "normalizedUShiftFromBaseline": decimal_string(
                                    photon_u_shift
                                ),
                            },
                            "baselineRelativeDifferences": {
                                key: decimal_string(value)
                                if scenario["baseline"]
                                else "not-applicable-nonbaseline-scenario"
                                for key, value in baseline_differences.items()
                            },
                            "physicalConeViolation": decimal_string(cone),
                            "applicability": "deterministic-model-sensitivity-stress-test-only",
                        }
                    )

    envelopes = []
    for identity in sorted(envelope_state):
        state = envelope_state[identity]
        envelopes.append(
            {
                "rayIndex": identity[0],
                "bandId": identity[1],
                "transportMethod": identity[2],
                "scenarioCount": 9,
                "energyLinearFractionMin": decimal_string(min(state["energyFraction"])),
                "energyLinearFractionMax": decimal_string(max(state["energyFraction"])),
                "photonLinearFractionMin": decimal_string(min(state["photonFraction"])),
                "photonLinearFractionMax": decimal_string(max(state["photonFraction"])),
                "maximumEnergyEvpaShiftDeg": decimal_string(max(state["energyEvpaShift"])),
                "maximumPhotonEvpaShiftDeg": decimal_string(max(state["photonEvpaShift"])),
                "maximumEnergyNormalizedQShift": decimal_string(max(state["energyQShift"])),
                "maximumEnergyNormalizedUShift": decimal_string(max(state["energyUShift"])),
                "maximumPhotonNormalizedQShift": decimal_string(max(state["photonQShift"])),
                "maximumPhotonNormalizedUShift": decimal_string(max(state["photonUShift"])),
                "combination": "envelope-only-no-probability-no-rss-no-scalar-total",
            }
        )

    baseline_keys = (
        "baselineEnergyI",
        "baselineEnergyQ",
        "baselineEnergyU",
        "baselinePhotonI",
        "baselinePhotonQ",
        "baselinePhotonU",
    )
    if (
        len(scenario_plan) != 9
        or len(scenario_rows) != 216
        or len(envelopes) != 24
        or any(maxima[key] >= BASELINE_RELATIVE_LIMIT for key in baseline_keys)
        or maxima["energyFraction"] > MAX_LINEAR_FRACTION_LIMIT
        or maxima["photonFraction"] > MAX_LINEAR_FRACTION_LIMIT
        or maxima["energyEvpaShift"] > MAX_EVPA_SHIFT_DEG_LIMIT
        or maxima["photonEvpaShift"] > MAX_EVPA_SHIFT_DEG_LIMIT
        or maxima["cone"] != 0
    ):
        raise ValueError(f"v522-threshold:{maxima}")

    source_paths = [
        PATHS["v320"],
        PATHS["v406"],
        PATHS["v521"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-polarization-frequency-sensitivity-v522.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v522-kerr-polarization-frequency-sensitivity-envelope-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "frequency-dependent-polarization-sensitivity-envelope-qualified-not-physical-prior",
        "source": {
            "v320ArtifactSha256": v320["artifactSha256"],
            "v406ArtifactSha256": v406["artifactSha256"],
            "v521ArtifactSha256": v521["artifactSha256"],
            "fullShortAuthoritySha256": view406["authority"]["fullShortAuthoritySha256"],
        },
        "model": {
            "baselineLinearPolarizationFraction": decimal_string(baseline_fraction),
            "frequencyCoordinate": "normalized-log-frequency-minus-one-to-plus-one-per-band",
            "fractionLaw": "p(nu)=p0*(1+slope*x)",
            "evpaLaw": "EVPA(nu)=EVPA0+twist*x",
            "fractionSlopeGrid": ["-0.25", "0.0", "0.25"],
            "evpaTwistDegGrid": ["-5.0", "0.0", "5.0"],
            "perturbationCalibration": "unavailable",
            "physicalPrior": "unavailable",
            "stressTestOnly": True,
        },
        "scenarioPlan": scenario_plan,
        "scenarioPlanSha256": scenario_plan_sha,
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "integration": "adaptive-tanh-sinh-log-frequency",
            "intensityIntegralsSharedOnlyWhen-Mathematically-Identical": True,
            "transportMethodsKeptSeparate": True,
            "randomnessUsed": False,
        },
        "counts": {
            "rayCount": 4,
            "bandCount": 3,
            "transportMethodCount": 2,
            "scenarioCount": 9,
            "scenarioRowCount": 216,
            "envelopeRowCount": 24,
            "directAdaptiveIntegralCount": 888,
            "measuredStokesRowCount": 0,
            "circularStokesRowCount": 0,
            "detectorProjectedRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {
            "baselineVsV521EnergyIRelative": decimal_string(maxima["baselineEnergyI"]),
            "baselineVsV521EnergyQRelative": decimal_string(maxima["baselineEnergyQ"]),
            "baselineVsV521EnergyURelative": decimal_string(maxima["baselineEnergyU"]),
            "baselineVsV521PhotonIRelative": decimal_string(maxima["baselinePhotonI"]),
            "baselineVsV521PhotonQRelative": decimal_string(maxima["baselinePhotonQ"]),
            "baselineVsV521PhotonURelative": decimal_string(maxima["baselinePhotonU"]),
            "energyLinearFraction": decimal_string(maxima["energyFraction"]),
            "photonLinearFraction": decimal_string(maxima["photonFraction"]),
            "energyEvpaShiftDeg": decimal_string(maxima["energyEvpaShift"]),
            "photonEvpaShiftDeg": decimal_string(maxima["photonEvpaShift"]),
            "normalizedQShift": decimal_string(maxima["normalizedQShift"]),
            "normalizedUShift": decimal_string(maxima["normalizedUShift"]),
            "physicalConeViolation": decimal_string(maxima["cone"]),
        },
        "limits": {
            "baselineVsV521ComponentRelative": decimal_string(BASELINE_RELATIVE_LIMIT),
            "linearFraction": decimal_string(MAX_LINEAR_FRACTION_LIMIT),
            "evpaShiftDeg": decimal_string(MAX_EVPA_SHIFT_DEG_LIMIT),
            "physicalConeViolation": "0.0",
        },
        "scenarioRows": scenario_rows,
        "envelopes": envelopes,
        "qualification": {
            "deterministicScenarioGridQualified": True,
            "baselineReconstructionQualified": True,
            "frequencySensitivityEnvelopeQualified": True,
            "physicalPolarizationConeQualified": True,
            "crossLanguageCanonicalShaQualified": True,
            "physicalPriorQualified": False,
            "measuredPolarimetryQualified": False,
            "scienceAuthorityPromotionAllowed": False,
        },
        "uncertaintyPolicy": {
            "modelSensitivityOnly": True,
            "probabilityDistributionAvailable": False,
            "crossScenarioIndependenceProven": False,
            "rssApplied": False,
            "scalarTotalAvailable": False,
            "combinationWithNumericalUncertaintyAllowed": False,
            "combination": "envelope-only-no-probability-no-rss-no-scalar-total",
        },
        "boundary": {
            "modelStressTestOnly": True,
            "physicalPriorAvailable": False,
            "perturbationCalibrationAvailable": False,
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
                "scenarioRows": artifact["counts"]["scenarioRowCount"],
                "directAdaptiveIntegrals": artifact["counts"][
                    "directAdaptiveIntegralCount"
                ],
                "maximumBaselineRelative": max(
                    artifact["maxima"][key]
                    for key in (
                        "baselineVsV521EnergyIRelative",
                        "baselineVsV521EnergyQRelative",
                        "baselineVsV521EnergyURelative",
                        "baselineVsV521PhotonIRelative",
                        "baselineVsV521PhotonQRelative",
                        "baselineVsV521PhotonURelative",
                    )
                ),
                "maximumEnergyEvpaShiftDeg": artifact["maxima"][
                    "energyEvpaShiftDeg"
                ],
                "maximumPhotonEvpaShiftDeg": artifact["maxima"][
                    "photonEvpaShiftDeg"
                ],
                "physicalPrior": "unavailable",
                "measuredStokesRows": 0,
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import mpmath as mp


ROOT = Path.cwd()
PATHS = {
    "v320": Path("dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"),
    "v328": Path("dist/science/kerr-science-photon-bands-v328/photon-radiance.json"),
    "v477": Path("dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json"),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
ENERGY_RELATIVE_LIMIT = mp.mpf("2e-6")
PHOTON_RELATIVE_LIMIT = mp.mpf("2e-6")
MEAN_FREQUENCY_RELATIVE_LIMIT = mp.mpf("2e-6")
TRANSFER_RELATIVE_LIMIT = mp.mpf("1e-14")
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
    payload = json.dumps(
        canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def relative_difference(left: mp.mpf, right: mp.mpf) -> mp.mpf:
    return abs(left - right) / max(mp.mpf("1e-300"), abs(left), abs(right))


def planck_radiance(temperature_k: mp.mpf, frequency_hz: mp.mpf) -> mp.mpf:
    exponent = H * frequency_hz / (KB * temperature_k)
    return (mp.mpf(2) * H * frequency_hz**3 / C**2) / mp.expm1(exponent)


def integrate_band(
    temperature_k: mp.mpf,
    redshift_factor: mp.mpf,
    lower_hz: mp.mpf,
    upper_hz: mp.mpf,
) -> tuple[mp.mpf, mp.mpf]:
    lower_log = mp.log(lower_hz)
    upper_log = mp.log(upper_hz)

    def observed_spectral_from_log(log_frequency: mp.mpf) -> mp.mpf:
        observed_frequency = mp.exp(log_frequency)
        emitted_frequency = observed_frequency / redshift_factor
        return redshift_factor**3 * planck_radiance(temperature_k, emitted_frequency)

    energy = mp.quadts(
        lambda log_frequency: observed_spectral_from_log(log_frequency)
        * mp.exp(log_frequency),
        [lower_log, upper_log],
    )
    photon = mp.quadts(
        lambda log_frequency: observed_spectral_from_log(log_frequency) / H,
        [lower_log, upper_log],
    )
    return energy, photon


def float_value(value: mp.mpf) -> float:
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("v519-non-finite-output")
    return result


def decimal_string(value: mp.mpf | float | int) -> str:
    return mp.nstr(mp.mpf(str(value)), 25)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v320 = read_json(PATHS["v320"])
    v328 = read_json(PATHS["v328"])
    v477 = read_json(PATHS["v477"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))

    if (
        not isinstance(v320.get("artifactSha256"), str)
        or len(v320["artifactSha256"]) != 64
        or not isinstance(v328.get("artifactSha256"), str)
        or len(v328["artifactSha256"]) != 64
        or not isinstance(v477.get("artifactSha256"), str)
        or len(v477["artifactSha256"]) != 64
        or v320.get("version") != "v320-kerr-thin-disk-fixed-band-artifact-v1"
        or v328.get("version") != "v328-kerr-science-photon-bands-artifact-v1"
        or v477.get("version") != "v477-kerr-photon-radiometry-transfer-artifact-v1"
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
        raise ValueError("v519-upstream-boundary")

    band_view = v320["view"]
    photon_view = v328["view"]
    if (
        band_view.get("status") != "qualified-fixed-band-sparse-science-imaging"
        or photon_view.get("status") != "qualified-fixed-band-photon-radiance"
        or band_view.get("counts", {}).get("applicableDiskRayCount") != 4
        or photon_view.get("counts", {}).get("bandMeasurementCount") != 12
        or photon_view.get("constants", {}).get("planckConstantJS") != float(H)
        or v477.get("audit", {}).get("applicableRowCount") != 4
        or v477.get("audit", {}).get("measuredRadianceRowCount") != 0
    ):
        raise ValueError("v519-source-contract")

    definitions = {entry["id"]: entry for entry in band_view["definitions"]}
    samples = {entry["rayIndex"]: entry for entry in band_view["samples"] if entry["applicable"]}
    photon_rays = {entry["rayIndex"]: entry for entry in photon_view["rays"]}
    transfer_rows = {index + 12: entry for index, entry in enumerate(v477["rows"])}
    if set(samples) != {12, 13, 14, 15} or set(photon_rays) != set(samples):
        raise ValueError("v519-ray-identity")

    rows: list[dict[str, Any]] = []
    maximum_energy_relative = mp.mpf(0)
    maximum_photon_relative = mp.mpf(0)
    maximum_mean_frequency_relative = mp.mpf(0)
    maximum_g3_relative = mp.mpf(0)
    maximum_g4_relative = mp.mpf(0)
    for ray_index in sorted(samples):
        sample = samples[ray_index]
        photon_ray = photon_rays[ray_index]
        transfer = transfer_rows[ray_index]
        temperature = mp.mpf(str(sample["effectiveTemperatureK"]))
        redshift = mp.mpf(str(sample["redshiftFactor"]))
        if (
            photon_ray["redshiftFactor"] != sample["redshiftFactor"]
            or photon_ray["effectiveTemperatureK"] != sample["effectiveTemperatureK"]
            or mp.mpf(str(transfer["redshiftFactor"])) != redshift
        ):
            raise ValueError(f"v519-ray-source-mismatch:{ray_index}")
        g3_relative = relative_difference(
            redshift**3, mp.mpf(str(transfer["spectralRadianceTransferG3"]))
        )
        g4_relative = relative_difference(
            redshift**4, mp.mpf(str(transfer["bolometricRadianceTransferG4"]))
        )
        maximum_g3_relative = max(maximum_g3_relative, g3_relative)
        maximum_g4_relative = max(maximum_g4_relative, g4_relative)
        band_rows = {entry["id"]: entry for entry in sample["bands"]}
        photon_rows = {entry["bandId"]: entry for entry in photon_ray["measurements"]}
        for band_id in ("visible", "euv", "soft-x-ray"):
            definition = definitions[band_id]
            band = band_rows[band_id]
            photon = photon_rows[band_id]
            lower = mp.mpf(str(definition["lowerFrequencyHz"]))
            upper = mp.mpf(str(definition["upperFrequencyHz"]))
            oracle_energy, oracle_photon = integrate_band(
                temperature, redshift, lower, upper
            )
            oracle_mean_energy = oracle_energy / oracle_photon
            oracle_mean_frequency = oracle_mean_energy / H
            stored_energy = mp.mpf(str(band["observedBandRadianceWM2Sr"]))
            stored_photon = mp.mpf(str(photon["observedPhotonRadiancePerSM2Sr"]))
            stored_mean_frequency = mp.mpf(str(photon["meanObservedFrequencyHz"]))
            energy_relative = relative_difference(oracle_energy, stored_energy)
            photon_relative = relative_difference(oracle_photon, stored_photon)
            mean_frequency_relative = relative_difference(
                oracle_mean_frequency, stored_mean_frequency
            )
            maximum_energy_relative = max(maximum_energy_relative, energy_relative)
            maximum_photon_relative = max(maximum_photon_relative, photon_relative)
            maximum_mean_frequency_relative = max(
                maximum_mean_frequency_relative, mean_frequency_relative
            )
            if not (lower <= oracle_mean_frequency <= upper):
                raise ValueError(f"v519-mean-frequency-boundary:{ray_index}:{band_id}")
            rows.append(
                {
                    "rayIndex": ray_index,
                    "bandId": band_id,
                    "spinA": decimal_string(sample["spinA"]),
                    "redshiftFactor": decimal_string(sample["redshiftFactor"]),
                    "effectiveTemperatureK": decimal_string(sample["effectiveTemperatureK"]),
                    "bandLowerFrequencyHz": decimal_string(definition["lowerFrequencyHz"]),
                    "bandUpperFrequencyHz": decimal_string(definition["upperFrequencyHz"]),
                    "storedEnergyRadianceWM2Sr": decimal_string(
                        band["observedBandRadianceWM2Sr"]
                    ),
                    "oracleEnergyRadianceWM2Sr": decimal_string(oracle_energy),
                    "energyRadianceRelativeDifference": decimal_string(energy_relative),
                    "storedPhotonRadiancePerSM2Sr": decimal_string(
                        photon["observedPhotonRadiancePerSM2Sr"]
                    ),
                    "oraclePhotonRadiancePerSM2Sr": decimal_string(oracle_photon),
                    "photonRadianceRelativeDifference": decimal_string(photon_relative),
                    "storedMeanObservedFrequencyHz": decimal_string(
                        photon["meanObservedFrequencyHz"]
                    ),
                    "oracleMeanObservedFrequencyHz": decimal_string(
                        oracle_mean_frequency
                    ),
                    "meanFrequencyRelativeDifference": decimal_string(
                        mean_frequency_relative
                    ),
                    "applicability": "model-predicted-thin-disk-radiometry-only",
                }
            )

    if (
        len(rows) != 12
        or maximum_energy_relative >= ENERGY_RELATIVE_LIMIT
        or maximum_photon_relative >= PHOTON_RELATIVE_LIMIT
        or maximum_mean_frequency_relative >= MEAN_FREQUENCY_RELATIVE_LIMIT
        or maximum_g3_relative >= TRANSFER_RELATIVE_LIMIT
        or maximum_g4_relative >= TRANSFER_RELATIVE_LIMIT
    ):
        raise ValueError(
            "v519-oracle-threshold:"
            f"{maximum_energy_relative}:{maximum_photon_relative}:"
            f"{maximum_mean_frequency_relative}:{maximum_g3_relative}:{maximum_g4_relative}"
        )

    source_paths = [
        PATHS["v320"],
        PATHS["v328"],
        PATHS["v477"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-fixed-band-radiometry-oracle-v519.py"),
    ]
    source_manifest = sorted(
        (
            {"path": path.as_posix(), "sha256": file_sha(path)}
            for path in source_paths
        ),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v519-kerr-fixed-band-radiometry-multiprecision-oracle-v1",
        "generatedAt": "2026-08-01T00:00:00Z",
        "status": "fixed-band-radiometry-multiprecision-oracle-qualified-12-rows",
        "source": {
            "v320ArtifactSha256": v320["artifactSha256"],
            "v328ArtifactSha256": v328["artifactSha256"],
            "v477ArtifactSha256": v477["artifactSha256"],
            "fullShortAuthoritySha256": photon_view["source"][
                "fullShortAuthoritySha256"
            ],
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "integration": "adaptive-tanh-sinh-log-frequency",
            "planckFormula": "B_nu=2*h*nu^3/c^2/expm1(h*nu/(k_B*T))",
            "redshiftFormula": "I_nu_observed=g^3*B_nu(nu_observed/g,T)",
            "photonFormula": "N_band=integral(I_nu/(h*nu),dnu)",
            "constants": {
                "planckConstantJS": decimal_string(H),
                "speedOfLightMS": decimal_string(C),
                "boltzmannConstantJK": decimal_string(KB),
                "siDefinitionExact": True,
            },
        },
        "counts": {
            "rayCount": 4,
            "bandCount": 3,
            "rowCount": 12,
            "energyIntegralCount": 12,
            "photonIntegralCount": 12,
            "meanFrequencyCount": 12,
            "transferCoefficientRayCount": 4,
            "measuredRadianceRowCount": 0,
            "detectorProjectedRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {
            "energyRadianceRelativeDifference": decimal_string(maximum_energy_relative),
            "photonRadianceRelativeDifference": decimal_string(maximum_photon_relative),
            "meanFrequencyRelativeDifference": decimal_string(
                maximum_mean_frequency_relative
            ),
            "g3TransferRelativeDifference": decimal_string(maximum_g3_relative),
            "g4TransferRelativeDifference": decimal_string(maximum_g4_relative),
        },
        "limits": {
            "energyRadianceRelativeDifference": decimal_string(ENERGY_RELATIVE_LIMIT),
            "photonRadianceRelativeDifference": decimal_string(PHOTON_RELATIVE_LIMIT),
            "meanFrequencyRelativeDifference": decimal_string(
                MEAN_FREQUENCY_RELATIVE_LIMIT
            ),
            "transferCoefficientRelativeDifference": decimal_string(
                TRANSFER_RELATIVE_LIMIT
            ),
        },
        "rows": rows,
        "qualification": {
            "independentAlgorithm": True,
            "v320EnergyRadianceQualified": True,
            "v328PhotonRadianceQualified": True,
            "meanPhotonFrequencyQualified": True,
            "v477G3G4TransferQualified": True,
            "productionMeasuredRadiometryQualified": False,
        },
        "boundary": {
            "modelPredictionOnly": True,
            "measuredEmitterSpectrumAvailable": False,
            "measuredAccretionParametersAvailable": False,
            "detectorThroughputAvailable": False,
            "observedDetectorCountsAvailable": False,
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
                "rows": len(rows),
                "maximumEnergyRelativeDifference": artifact["maxima"][
                    "energyRadianceRelativeDifference"
                ],
                "maximumPhotonRelativeDifference": artifact["maxima"][
                    "photonRadianceRelativeDifference"
                ],
                "maximumMeanFrequencyRelativeDifference": artifact["maxima"][
                    "meanFrequencyRelativeDifference"
                ],
                "maximumG3RelativeDifference": artifact["maxima"][
                    "g3TransferRelativeDifference"
                ],
                "maximumG4RelativeDifference": artifact["maxima"][
                    "g4TransferRelativeDifference"
                ],
                "measuredRadianceRows": 0,
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

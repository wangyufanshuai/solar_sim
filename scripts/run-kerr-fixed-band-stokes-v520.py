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
    "v406": Path("dist/science/kerr-stokes-transfer-v406/short-gate.json"),
    "v519": Path("dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json"),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json"),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
FRACTION_RESIDUAL_LIMIT = mp.mpf("1e-20")
EVPA_RECONSTRUCTION_LIMIT_DEG = mp.mpf("1e-20")
METHOD_EVPA_DIFFERENCE_LIMIT_DEG = mp.mpf("1e-9")
METHOD_NORMALIZED_STOKES_LIMIT = mp.mpf("1e-12")


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


def axial_difference_deg(first: mp.mpf, second: mp.mpf) -> mp.mpf:
    difference = abs(first - second) % mp.mpf(180)
    return min(difference, mp.mpf(180) - difference)


def normalize_evpa_deg(value: mp.mpf) -> mp.mpf:
    return value % mp.mpf(180)


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v406 = read_json(PATHS["v406"])
    v519 = read_json(PATHS["v519"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    view406 = v406.get("view", {})
    if (
        v406.get("version") != "v406-kerr-sparse-stokes-transfer-artifact-v1"
        or view406.get("status") != "qualified-sparse-derived-stokes-transfer"
        or view406.get("counts", {}).get("diskRayCount") != 4
        or view406.get("counts", {}).get("frequencyCount") != 3
        or view406.get("counts", {}).get("transportMethodCount") != 2
        or view406.get("counts", {}).get("stokesSampleCount") != 24
        or view406.get("model", {}).get("circularPolarization")
        != "unavailable-not-modeled"
        or view406.get("model", {}).get("faradayRotation") != "unavailable-not-modeled"
        or v519.get("version")
        != "v519-kerr-fixed-band-radiometry-multiprecision-oracle-v1"
        or canonical_sha(v519) != v519.get("artifactSha256")
        or v519.get("counts", {}).get("rowCount") != 12
        or v519.get("qualification", {}).get("independentAlgorithm") is not True
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
        raise ValueError("v520-upstream-boundary")

    polarization_fraction = mp.mpf(
        str(view406["model"]["emittedLinearPolarizationFraction"])
    )
    if polarization_fraction != mp.mpf("0.12"):
        raise ValueError("v520-polarization-model")
    methods = ("walker-penrose", "independent-ks-parallel-transport")
    evpa_by_ray_method: dict[tuple[int, str], mp.mpf] = {}
    maximum_frequency_evpa_variation = mp.mpf(0)
    grouped: dict[tuple[int, str], list[mp.mpf]] = {}
    for sample in view406["samples"]:
        key = (sample["rayIndex"], sample["transportMethod"])
        grouped.setdefault(key, []).append(mp.mpf(str(sample["evpaDeg"])))
    for ray_index in (12, 13, 14, 15):
        for method in methods:
            values = grouped.get((ray_index, method), [])
            if len(values) != 3:
                raise ValueError(f"v520-evpa-source-count:{ray_index}:{method}")
            reference = values[0]
            variation = max(axial_difference_deg(reference, value) for value in values)
            maximum_frequency_evpa_variation = max(
                maximum_frequency_evpa_variation, variation
            )
            if variation >= METHOD_EVPA_DIFFERENCE_LIMIT_DEG:
                raise ValueError(f"v520-frequency-evpa-variation:{ray_index}:{method}")
            evpa_by_ray_method[(ray_index, method)] = normalize_evpa_deg(reference)

    radiometry_rows = {
        (row["rayIndex"], row["bandId"]): row for row in v519["rows"]
    }
    if len(radiometry_rows) != 12:
        raise ValueError("v520-radiometry-source-count")

    rows: list[dict[str, Any]] = []
    maximum_fraction_residual = mp.mpf(0)
    maximum_evpa_reconstruction = mp.mpf(0)
    maximum_physical_cone_violation = mp.mpf(0)
    for ray_index in (12, 13, 14, 15):
        for band_id in ("visible", "euv", "soft-x-ray"):
            radiometry = radiometry_rows[(ray_index, band_id)]
            energy_i = mp.mpf(radiometry["oracleEnergyRadianceWM2Sr"])
            photon_i = mp.mpf(radiometry["oraclePhotonRadiancePerSM2Sr"])
            if energy_i <= 0 or photon_i <= 0:
                raise ValueError(f"v520-nonpositive-radiometry:{ray_index}:{band_id}")
            for method in methods:
                evpa_deg = evpa_by_ray_method[(ray_index, method)]
                angle = mp.radians(mp.mpf(2) * evpa_deg)
                q_over_i = polarization_fraction * mp.cos(angle)
                u_over_i = polarization_fraction * mp.sin(angle)
                energy_q = energy_i * q_over_i
                energy_u = energy_i * u_over_i
                photon_q = photon_i * q_over_i
                photon_u = photon_i * u_over_i
                reconstructed_fraction = mp.sqrt(q_over_i**2 + u_over_i**2)
                reconstructed_evpa = normalize_evpa_deg(
                    mp.degrees(mp.atan2(u_over_i, q_over_i)) / mp.mpf(2)
                )
                fraction_residual = abs(
                    reconstructed_fraction - polarization_fraction
                )
                evpa_residual = axial_difference_deg(reconstructed_evpa, evpa_deg)
                energy_cone = max(
                    mp.mpf(0), energy_q**2 + energy_u**2 - energy_i**2
                )
                photon_cone = max(
                    mp.mpf(0), photon_q**2 + photon_u**2 - photon_i**2
                )
                cone_violation = max(energy_cone, photon_cone)
                maximum_fraction_residual = max(
                    maximum_fraction_residual, fraction_residual
                )
                maximum_evpa_reconstruction = max(
                    maximum_evpa_reconstruction, evpa_residual
                )
                maximum_physical_cone_violation = max(
                    maximum_physical_cone_violation, cone_violation
                )
                rows.append(
                    {
                        "rayIndex": ray_index,
                        "bandId": band_id,
                        "transportMethod": method,
                        "evpaDeg": decimal_string(evpa_deg),
                        "linearPolarizationFraction": decimal_string(
                            polarization_fraction
                        ),
                        "normalizedQ": decimal_string(q_over_i),
                        "normalizedU": decimal_string(u_over_i),
                        "energyStokes": {
                            "iWM2Sr": radiometry["oracleEnergyRadianceWM2Sr"],
                            "qWM2Sr": decimal_string(energy_q),
                            "uWM2Sr": decimal_string(energy_u),
                            "v": "unavailable-not-modeled",
                        },
                        "photonStokes": {
                            "iPerSM2Sr": radiometry["oraclePhotonRadiancePerSM2Sr"],
                            "qPerSM2Sr": decimal_string(photon_q),
                            "uPerSM2Sr": decimal_string(photon_u),
                            "v": "unavailable-not-modeled",
                        },
                        "residuals": {
                            "linearFractionAbsolute": decimal_string(
                                fraction_residual
                            ),
                            "evpaReconstructionDeg": decimal_string(evpa_residual),
                            "physicalConeViolation": decimal_string(cone_violation),
                        },
                        "uncertainty": {
                            "radiometryEnergyRelativeDifference": radiometry[
                                "energyRadianceRelativeDifference"
                            ],
                            "radiometryPhotonRelativeDifference": radiometry[
                                "photonRadianceRelativeDifference"
                            ],
                            "crossChannelIndependenceProven": False,
                            "rssApplied": False,
                        },
                        "applicability": "model-predicted-fixed-band-linear-stokes-only",
                    }
                )

    maximum_method_evpa_difference = mp.mpf(0)
    maximum_method_q_difference = mp.mpf(0)
    maximum_method_u_difference = mp.mpf(0)
    for ray_index in (12, 13, 14, 15):
        wp = evpa_by_ray_method[(ray_index, methods[0])]
        ks = evpa_by_ray_method[(ray_index, methods[1])]
        maximum_method_evpa_difference = max(
            maximum_method_evpa_difference, axial_difference_deg(wp, ks)
        )
        wp_angle = mp.radians(mp.mpf(2) * wp)
        ks_angle = mp.radians(mp.mpf(2) * ks)
        maximum_method_q_difference = max(
            maximum_method_q_difference,
            abs(polarization_fraction * (mp.cos(wp_angle) - mp.cos(ks_angle))),
        )
        maximum_method_u_difference = max(
            maximum_method_u_difference,
            abs(polarization_fraction * (mp.sin(wp_angle) - mp.sin(ks_angle))),
        )

    if (
        len(rows) != 24
        or maximum_fraction_residual >= FRACTION_RESIDUAL_LIMIT
        or maximum_evpa_reconstruction >= EVPA_RECONSTRUCTION_LIMIT_DEG
        or maximum_method_evpa_difference >= METHOD_EVPA_DIFFERENCE_LIMIT_DEG
        or maximum_method_q_difference >= METHOD_NORMALIZED_STOKES_LIMIT
        or maximum_method_u_difference >= METHOD_NORMALIZED_STOKES_LIMIT
        or maximum_physical_cone_violation != 0
    ):
        raise ValueError(
            "v520-stokes-threshold:"
            f"{maximum_fraction_residual}:{maximum_evpa_reconstruction}:"
            f"{maximum_method_evpa_difference}:{maximum_method_q_difference}:"
            f"{maximum_method_u_difference}:{maximum_physical_cone_violation}"
        )

    source_paths = [
        PATHS["v406"],
        PATHS["v519"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-fixed-band-stokes-v520.py"),
    ]
    source_manifest = sorted(
        (
            {"path": path.as_posix(), "sha256": file_sha(path)}
            for path in source_paths
        ),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v520-kerr-fixed-band-stokes-payload-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "fixed-band-dual-transport-stokes-qualified-24-model-rows",
        "source": {
            "v406ArtifactSha256": v406["artifactSha256"],
            "v519ArtifactSha256": v519["artifactSha256"],
            "fullShortAuthoritySha256": view406["authority"][
                "fullShortAuthoritySha256"
            ],
            "geometryEvidenceSha256": view406["authority"][
                "geometryEvidenceSha256"
            ],
            "polarizationEvidenceSha256": view406["authority"][
                "polarizationEvidenceSha256"
            ],
        },
        "model": {
            "linearPolarizationFraction": decimal_string(polarization_fraction),
            "emittedBasis": view406["model"]["emittedBasis"],
            "propagation": view406["model"]["propagation"],
            "circularPolarization": "unavailable-not-modeled",
            "faradayRotation": "unavailable-not-modeled",
            "bandAssumption": "frequency-independent-EVPA-and-linear-fraction-within-each-authority-ray",
        },
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "stokesFormula": "Q=p*I*cos(2*EVPA),U=p*I*sin(2*EVPA)",
            "evpaFormula": "EVPA=0.5*atan2(U,Q)-mod-180-deg",
            "transportMethods": list(methods),
            "independentTransportPathsPreserved": True,
            "methodValuesAveraged": False,
        },
        "counts": {
            "rayCount": 4,
            "bandCount": 3,
            "transportMethodCount": 2,
            "rowCount": 24,
            "energyStokesTripletCount": 24,
            "photonStokesTripletCount": 24,
            "sourceMonochromaticSampleCount": 24,
            "measuredStokesRowCount": 0,
            "circularStokesRowCount": 0,
            "detectorProjectedRowCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {
            "sourceFrequencyEvpaVariationDeg": decimal_string(
                maximum_frequency_evpa_variation
            ),
            "linearFractionResidual": decimal_string(maximum_fraction_residual),
            "evpaReconstructionDeg": decimal_string(
                maximum_evpa_reconstruction
            ),
            "wpKsEvpaDifferenceDeg": decimal_string(
                maximum_method_evpa_difference
            ),
            "wpKsNormalizedQDifference": decimal_string(
                maximum_method_q_difference
            ),
            "wpKsNormalizedUDifference": decimal_string(
                maximum_method_u_difference
            ),
            "physicalConeViolation": decimal_string(
                maximum_physical_cone_violation
            ),
        },
        "limits": {
            "linearFractionResidual": decimal_string(FRACTION_RESIDUAL_LIMIT),
            "evpaReconstructionDeg": decimal_string(
                EVPA_RECONSTRUCTION_LIMIT_DEG
            ),
            "wpKsEvpaDifferenceDeg": decimal_string(
                METHOD_EVPA_DIFFERENCE_LIMIT_DEG
            ),
            "wpKsNormalizedStokesDifference": decimal_string(
                METHOD_NORMALIZED_STOKES_LIMIT
            ),
            "physicalConeViolation": "0.0",
        },
        "rows": rows,
        "qualification": {
            "fixedBandEnergyStokesQualified": True,
            "fixedBandPhotonStokesQualified": True,
            "walkerPenrosePathQualified": True,
            "independentKsParallelTransportPathQualified": True,
            "physicalPolarizationConeQualified": True,
            "modelPredictionQualified": True,
            "measuredPolarimetryQualified": False,
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
                "maximumFractionResidual": artifact["maxima"][
                    "linearFractionResidual"
                ],
                "maximumEvpaReconstructionDeg": artifact["maxima"][
                    "evpaReconstructionDeg"
                ],
                "maximumWpKsEvpaDifferenceDeg": artifact["maxima"][
                    "wpKsEvpaDifferenceDeg"
                ],
                "maximumWpKsNormalizedQDifference": artifact["maxima"][
                    "wpKsNormalizedQDifference"
                ],
                "maximumWpKsNormalizedUDifference": artifact["maxima"][
                    "wpKsNormalizedUDifference"
                ],
                "physicalConeViolation": artifact["maxima"][
                    "physicalConeViolation"
                ],
                "measuredStokesRows": 0,
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

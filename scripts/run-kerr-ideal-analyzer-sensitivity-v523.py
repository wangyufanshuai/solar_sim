from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import mpmath as mp


ROOT = Path.cwd()
PATHS = {
    "v410": Path("dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json"),
    "v522": Path(
        "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json"
    ),
    "dense": Path("dist/science/kerr-campaign-v314/campaign-state.json"),
    "formal": Path("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "output": Path("dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json"),
}
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}
ALGEBRA_LIMIT = mp.mpf("1e-60")


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


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(target)


def main() -> None:
    mp.mp.dps = 80
    v410 = read_json(PATHS["v410"])
    v522 = read_json(PATHS["v522"])
    dense = read_json(PATHS["dense"])
    formal = read_json(PATHS["formal"])
    formal_evidence = read_json(Path(formal["source"]))
    if (
        v410.get("view", {}).get("status")
        != "qualified-ideal-dual-beam-polarimeter-operator-detector-projection-unavailable"
        or v410.get("view", {}).get("operator", {}).get("device")
        != "ideal-half-wave-plate-plus-ideal-wollaston-dual-beam"
        or v410.get("view", {}).get("detectorProjection", {}).get(
            "expectedElectronCountsAvailable"
        )
        is not False
        or v522.get("version")
        != "v522-kerr-polarization-frequency-sensitivity-envelope-v1"
        or canonical_sha(v522) != v522.get("artifactSha256")
        or v522.get("counts", {}).get("scenarioRowCount") != 216
        or v522.get("qualification", {}).get("scienceAuthorityPromotionAllowed")
        is not False
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
        raise ValueError("v523-upstream-boundary")

    analyzer_plan = [
        {"analyzerId": "a000", "analyzerAngleDeg": "0.0"},
        {"analyzerId": "a045", "analyzerAngleDeg": "45.0"},
        {"analyzerId": "a090", "analyzerAngleDeg": "90.0"},
        {"analyzerId": "a135", "analyzerAngleDeg": "135.0"},
    ]
    analyzer_plan_sha = canonical_sha(analyzer_plan)
    modulation_rows: list[dict[str, Any]] = []
    reconstructions: list[dict[str, Any]] = []
    envelope_state: dict[tuple[int, str, str, str], list[dict[str, mp.mpf]]] = {}
    maxima = {
        "beamSum": mp.mpf(0),
        "fluxLaw": mp.mpf(0),
        "energyI": mp.mpf(0),
        "energyQ": mp.mpf(0),
        "energyU": mp.mpf(0),
        "photonI": mp.mpf(0),
        "photonQ": mp.mpf(0),
        "photonU": mp.mpf(0),
        "energyNormalizedQ": mp.mpf(0),
        "energyNormalizedU": mp.mpf(0),
        "photonNormalizedQ": mp.mpf(0),
        "photonNormalizedU": mp.mpf(0),
        "nonnegativeBeamViolation": mp.mpf(0),
    }
    for source in v522["scenarioRows"]:
        energy = (
            mp.mpf(source["directEnergyStokes"]["iWM2Sr"]),
            mp.mpf(source["directEnergyStokes"]["qWM2Sr"]),
            mp.mpf(source["directEnergyStokes"]["uWM2Sr"]),
        )
        photon = (
            mp.mpf(source["directPhotonStokes"]["iPerSM2Sr"]),
            mp.mpf(source["directPhotonStokes"]["qPerSM2Sr"]),
            mp.mpf(source["directPhotonStokes"]["uPerSM2Sr"]),
        )
        source_energy_normalized = (energy[1] / energy[0], energy[2] / energy[0])
        source_photon_normalized = (photon[1] / photon[0], photon[2] / photon[0])
        projected = []
        for analyzer in analyzer_plan:
            angle = mp.radians(mp.mpf(analyzer["analyzerAngleDeg"]) * mp.mpf(2))
            cosine = mp.cos(angle)
            sine = mp.sin(angle)
            energy_signal = energy[1] * cosine + energy[2] * sine
            photon_signal = photon[1] * cosine + photon[2] * sine
            energy_ordinary = mp.mpf("0.5") * (energy[0] + energy_signal)
            energy_extraordinary = mp.mpf("0.5") * (energy[0] - energy_signal)
            photon_ordinary = mp.mpf("0.5") * (photon[0] + photon_signal)
            photon_extraordinary = mp.mpf("0.5") * (photon[0] - photon_signal)
            energy_sum = energy_ordinary + energy_extraordinary
            photon_sum = photon_ordinary + photon_extraordinary
            energy_difference = (energy_ordinary - energy_extraordinary) / energy_sum
            photon_difference = (photon_ordinary - photon_extraordinary) / photon_sum
            expected_energy = source_energy_normalized[0] * cosine + source_energy_normalized[1] * sine
            expected_photon = source_photon_normalized[0] * cosine + source_photon_normalized[1] * sine
            beam_sum_residual = max(
                relative_difference(energy_sum, energy[0]),
                relative_difference(photon_sum, photon[0]),
            )
            flux_law_residual = max(
                abs(energy_difference - expected_energy),
                abs(photon_difference - expected_photon),
            )
            nonnegative_violation = max(
                mp.mpf(0),
                -energy_ordinary,
                -energy_extraordinary,
                -photon_ordinary,
                -photon_extraordinary,
            )
            maxima["beamSum"] = max(maxima["beamSum"], beam_sum_residual)
            maxima["fluxLaw"] = max(maxima["fluxLaw"], flux_law_residual)
            maxima["nonnegativeBeamViolation"] = max(
                maxima["nonnegativeBeamViolation"], nonnegative_violation
            )
            row = {
                "rayIndex": source["rayIndex"],
                "bandId": source["bandId"],
                "transportMethod": source["transportMethod"],
                "scenarioId": source["scenarioId"],
                "analyzerId": analyzer["analyzerId"],
                "analyzerAngleDeg": analyzer["analyzerAngleDeg"],
                "energyBeams": {
                    "ordinaryWM2Sr": decimal_string(energy_ordinary),
                    "extraordinaryWM2Sr": decimal_string(energy_extraordinary),
                    "sumWM2Sr": decimal_string(energy_sum),
                    "normalizedDifference": decimal_string(energy_difference),
                },
                "photonBeams": {
                    "ordinaryPerSM2Sr": decimal_string(photon_ordinary),
                    "extraordinaryPerSM2Sr": decimal_string(photon_extraordinary),
                    "sumPerSM2Sr": decimal_string(photon_sum),
                    "normalizedDifference": decimal_string(photon_difference),
                },
                "residuals": {
                    "beamSumRelative": decimal_string(beam_sum_residual),
                    "normalizedFluxLawAbsolute": decimal_string(flux_law_residual),
                    "nonnegativeBeamViolation": decimal_string(nonnegative_violation),
                },
                "applicability": "ideal-linear-analyzer-model-projection-only",
            }
            modulation_rows.append(row)
            projected.append(
                {
                    "analyzerId": analyzer["analyzerId"],
                    "energySum": energy_sum,
                    "energyDifference": energy_difference,
                    "photonSum": photon_sum,
                    "photonDifference": photon_difference,
                }
            )
            envelope_state.setdefault(
                (
                    source["rayIndex"],
                    source["bandId"],
                    source["transportMethod"],
                    analyzer["analyzerId"],
                ),
                [],
            ).append(
                {
                    "energyOrdinaryFraction": energy_ordinary / energy_sum,
                    "energyExtraordinaryFraction": energy_extraordinary / energy_sum,
                    "energyDifference": energy_difference,
                    "photonOrdinaryFraction": photon_ordinary / photon_sum,
                    "photonExtraordinaryFraction": photon_extraordinary / photon_sum,
                    "photonDifference": photon_difference,
                }
            )

        by_id = {row["analyzerId"]: row for row in projected}
        reconstructed_energy_i = sum(row["energySum"] for row in projected) / mp.mpf(4)
        reconstructed_photon_i = sum(row["photonSum"] for row in projected) / mp.mpf(4)
        reconstructed_energy_normalized_q = mp.mpf("0.5") * (
            by_id["a000"]["energyDifference"] - by_id["a090"]["energyDifference"]
        )
        reconstructed_energy_normalized_u = mp.mpf("0.5") * (
            by_id["a045"]["energyDifference"] - by_id["a135"]["energyDifference"]
        )
        reconstructed_photon_normalized_q = mp.mpf("0.5") * (
            by_id["a000"]["photonDifference"] - by_id["a090"]["photonDifference"]
        )
        reconstructed_photon_normalized_u = mp.mpf("0.5") * (
            by_id["a045"]["photonDifference"] - by_id["a135"]["photonDifference"]
        )
        reconstructed_energy = (
            reconstructed_energy_i,
            reconstructed_energy_i * reconstructed_energy_normalized_q,
            reconstructed_energy_i * reconstructed_energy_normalized_u,
        )
        reconstructed_photon = (
            reconstructed_photon_i,
            reconstructed_photon_i * reconstructed_photon_normalized_q,
            reconstructed_photon_i * reconstructed_photon_normalized_u,
        )
        residuals = {
            "energyI": relative_difference(reconstructed_energy[0], energy[0]),
            "energyQ": relative_difference(reconstructed_energy[1], energy[1]),
            "energyU": relative_difference(reconstructed_energy[2], energy[2]),
            "photonI": relative_difference(reconstructed_photon[0], photon[0]),
            "photonQ": relative_difference(reconstructed_photon[1], photon[1]),
            "photonU": relative_difference(reconstructed_photon[2], photon[2]),
            "energyNormalizedQ": abs(
                reconstructed_energy_normalized_q - source_energy_normalized[0]
            ),
            "energyNormalizedU": abs(
                reconstructed_energy_normalized_u - source_energy_normalized[1]
            ),
            "photonNormalizedQ": abs(
                reconstructed_photon_normalized_q - source_photon_normalized[0]
            ),
            "photonNormalizedU": abs(
                reconstructed_photon_normalized_u - source_photon_normalized[1]
            ),
        }
        for key, value in residuals.items():
            maxima[key] = max(maxima[key], value)
        reconstructions.append(
            {
                "rayIndex": source["rayIndex"],
                "bandId": source["bandId"],
                "transportMethod": source["transportMethod"],
                "scenarioId": source["scenarioId"],
                "sourceEnergyStokes": source["directEnergyStokes"],
                "sourcePhotonStokes": source["directPhotonStokes"],
                "reconstructedEnergyStokes": {
                    "iWM2Sr": decimal_string(reconstructed_energy[0]),
                    "qWM2Sr": decimal_string(reconstructed_energy[1]),
                    "uWM2Sr": decimal_string(reconstructed_energy[2]),
                    "v": "unavailable-not-modeled",
                },
                "reconstructedPhotonStokes": {
                    "iPerSM2Sr": decimal_string(reconstructed_photon[0]),
                    "qPerSM2Sr": decimal_string(reconstructed_photon[1]),
                    "uPerSM2Sr": decimal_string(reconstructed_photon[2]),
                    "v": "unavailable-not-modeled",
                },
                "normalizedReconstruction": {
                    "energyNormalizedQ": decimal_string(reconstructed_energy_normalized_q),
                    "energyNormalizedU": decimal_string(reconstructed_energy_normalized_u),
                    "photonNormalizedQ": decimal_string(reconstructed_photon_normalized_q),
                    "photonNormalizedU": decimal_string(reconstructed_photon_normalized_u),
                },
                "residuals": {key: decimal_string(value) for key, value in residuals.items()},
                "applicability": "ideal-linear-analyzer-algebraic-reconstruction-only",
            }
        )

    channel_envelopes = []
    for identity in sorted(envelope_state):
        rows = envelope_state[identity]
        channel_envelopes.append(
            {
                "rayIndex": identity[0],
                "bandId": identity[1],
                "transportMethod": identity[2],
                "analyzerId": identity[3],
                "scenarioCount": 9,
                "energyOrdinaryFractionMin": decimal_string(
                    min(row["energyOrdinaryFraction"] for row in rows)
                ),
                "energyOrdinaryFractionMax": decimal_string(
                    max(row["energyOrdinaryFraction"] for row in rows)
                ),
                "energyExtraordinaryFractionMin": decimal_string(
                    min(row["energyExtraordinaryFraction"] for row in rows)
                ),
                "energyExtraordinaryFractionMax": decimal_string(
                    max(row["energyExtraordinaryFraction"] for row in rows)
                ),
                "energyNormalizedDifferenceMin": decimal_string(
                    min(row["energyDifference"] for row in rows)
                ),
                "energyNormalizedDifferenceMax": decimal_string(
                    max(row["energyDifference"] for row in rows)
                ),
                "photonOrdinaryFractionMin": decimal_string(
                    min(row["photonOrdinaryFraction"] for row in rows)
                ),
                "photonOrdinaryFractionMax": decimal_string(
                    max(row["photonOrdinaryFraction"] for row in rows)
                ),
                "photonExtraordinaryFractionMin": decimal_string(
                    min(row["photonExtraordinaryFraction"] for row in rows)
                ),
                "photonExtraordinaryFractionMax": decimal_string(
                    max(row["photonExtraordinaryFraction"] for row in rows)
                ),
                "photonNormalizedDifferenceMin": decimal_string(
                    min(row["photonDifference"] for row in rows)
                ),
                "photonNormalizedDifferenceMax": decimal_string(
                    max(row["photonDifference"] for row in rows)
                ),
                "combination": "deterministic-channel-envelope-no-probability-no-rss",
            }
        )

    if (
        len(modulation_rows) != 864
        or len(reconstructions) != 216
        or len(channel_envelopes) != 96
        or any(maxima[key] >= ALGEBRA_LIMIT for key in maxima if key != "nonnegativeBeamViolation")
        or maxima["nonnegativeBeamViolation"] != 0
    ):
        raise ValueError(f"v523-threshold:{maxima}")

    source_paths = [
        PATHS["v410"],
        PATHS["v522"],
        PATHS["dense"],
        PATHS["formal"],
        Path("scripts/run-kerr-ideal-analyzer-sensitivity-v523.py"),
    ]
    source_manifest = sorted(
        ({"path": path.as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v523-kerr-ideal-analyzer-sensitivity-projection-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "ideal-four-angle-analyzer-projection-qualified-no-detector-authority",
        "source": {
            "v410ArtifactSha256": v410["artifactSha256"],
            "v522ArtifactSha256": v522["artifactSha256"],
            "v522ScenarioPlanSha256": v522["scenarioPlanSha256"],
        },
        "operator": {
            "device": "ideal-linear-analyzer-dual-beam",
            "analyzerAnglesDeg": ["0.0", "45.0", "90.0", "135.0"],
            "ordinaryLaw": "O(theta)=0.5*(I+Q*cos(2theta)+U*sin(2theta))",
            "extraordinaryLaw": "E(theta)=0.5*(I-Q*cos(2theta)-U*sin(2theta))",
            "reconstruction": "Q/I=0.5*(D0-D90),U/I=0.5*(D45-D135),I=mean(O+E)",
            "equivalentV410HwpAnglesDeg": ["0.0", "22.5", "45.0", "67.5"],
            "idealOnly": True,
        },
        "analyzerPlan": analyzer_plan,
        "analyzerPlanSha256": analyzer_plan_sha,
        "oracle": {
            "backend": "mpmath-1.3.0",
            "decimalDigits": 80,
            "independentForwardProjectionAndClosedFormInverse": True,
            "randomnessUsed": False,
        },
        "counts": {
            "sourceScenarioRowCount": 216,
            "analyzerStateCount": 4,
            "modulationRowCount": 864,
            "energyBeamValueCount": 1728,
            "photonBeamValueCount": 1728,
            "reconstructionCount": 216,
            "channelEnvelopeCount": 96,
            "expectedElectronCountRowCount": 0,
            "observedCountRowCount": 0,
            "measuredCalibrationFileCount": 0,
            "sciencePixelRowCount": 0,
        },
        "maxima": {
            "beamSumRelative": decimal_string(maxima["beamSum"]),
            "normalizedFluxLawAbsolute": decimal_string(maxima["fluxLaw"]),
            "energyIReconstructionRelative": decimal_string(maxima["energyI"]),
            "energyQReconstructionRelative": decimal_string(maxima["energyQ"]),
            "energyUReconstructionRelative": decimal_string(maxima["energyU"]),
            "photonIReconstructionRelative": decimal_string(maxima["photonI"]),
            "photonQReconstructionRelative": decimal_string(maxima["photonQ"]),
            "photonUReconstructionRelative": decimal_string(maxima["photonU"]),
            "energyNormalizedQAbsolute": decimal_string(maxima["energyNormalizedQ"]),
            "energyNormalizedUAbsolute": decimal_string(maxima["energyNormalizedU"]),
            "photonNormalizedQAbsolute": decimal_string(maxima["photonNormalizedQ"]),
            "photonNormalizedUAbsolute": decimal_string(maxima["photonNormalizedU"]),
            "nonnegativeBeamViolation": decimal_string(
                maxima["nonnegativeBeamViolation"]
            ),
        },
        "limits": {
            "idealAlgebraResidual": decimal_string(ALGEBRA_LIMIT),
            "nonnegativeBeamViolation": "0.0",
        },
        "modulationRows": modulation_rows,
        "reconstructions": reconstructions,
        "channelEnvelopes": channel_envelopes,
        "qualification": {
            "idealForwardProjectionQualified": True,
            "idealInverseReconstructionQualified": True,
            "energyAndPhotonChannelsQualified": True,
            "deterministicChannelEnvelopesQualified": True,
            "crossLanguageCanonicalShaQualified": True,
            "measuredInstrumentQualified": False,
            "detectorProjectionQualified": False,
            "scienceAuthorityPromotionAllowed": False,
        },
        "boundary": {
            "idealModelOnly": True,
            "v522StressTestOnly": True,
            "physicalPriorAvailable": False,
            "instrumentMuellerMatrixAvailable": False,
            "wavelengthDependentRetardanceAvailable": False,
            "beamThroughputCalibrationAvailable": False,
            "detectorGainNoiseAvailable": False,
            "expectedElectronCountsAvailable": False,
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
                "modulationRows": artifact["counts"]["modulationRowCount"],
                "reconstructions": artifact["counts"]["reconstructionCount"],
                "channelEnvelopes": artifact["counts"]["channelEnvelopeCount"],
                "maximumAlgebraResidual": max(
                    value
                    for key, value in artifact["maxima"].items()
                    if key != "nonnegativeBeamViolation"
                ),
                "expectedElectronCounts": 0,
                "measuredCalibration": "0/6",
                "denseCampaign": "0/49",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
GEOMETRY = ROOT / "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"
BANDS = ROOT / "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
IDENTIFIABILITY = ROOT / "dist/science/kerr-photon-source-identifiability-v387/identifiability.json"
OUTPUT = ROOT / "dist/science/kerr-geometry-conditioned-temperature-v388/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
STEPS = 16_384
ROOT_ITERATIONS = 104
EXPECTED_BAND_SHA256 = "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460"
EXPECTED_PHOTON_SHA256 = "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e"
CARTER = "carter-mino-dop853-constraint-stabilized-v296"
KS = "cartesian-kerr-schild-hamiltonian-dop853-v292"


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


def canonical_sha(value):
    encoded = json.dumps(
        canonicalize(value),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def integrate_product_temperature(lower, upper, product_temperature_k):
    width = (upper - lower) / STEPS
    total = 0.0
    for index in range(STEPS + 1):
        frequency_hz = lower + index * width
        exponent = H * frequency_hz / (KB * product_temperature_k)
        photon_radiance = (
            0.0
            if exponent > 700
            else 2 * frequency_hz**2 / C**2 / math.expm1(exponent)
        )
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * photon_radiance
    result = total * width / 3
    if not math.isfinite(result) or result < 0:
        raise RuntimeError("v388-oracle-product-integral")
    return result


def invert_product_temperature(lower_frequency, upper_frequency, target):
    lower = 100.0
    upper = 1e9
    if (
        integrate_product_temperature(lower_frequency, upper_frequency, lower) >= target
        or integrate_product_temperature(lower_frequency, upper_frequency, upper) <= target
    ):
        raise RuntimeError("v388-oracle-root-bracket")
    for _ in range(ROOT_ITERATIONS):
        midpoint = 0.5 * (lower + upper)
        value = integrate_product_temperature(lower_frequency, upper_frequency, midpoint)
        if value < target:
            lower = midpoint
        else:
            upper = midpoint
    result = 0.5 * (lower + upper)
    replay = integrate_product_temperature(lower_frequency, upper_frequency, result)
    residual = abs(replay - target) / max(replay, target)
    return result, residual


def relative_difference(left, right):
    return abs(left - right) / max(float.fromhex("0x0.0000000000001p-1022"), abs(left), abs(right))


def augmented_singular_values(values):
    sum_squares = math.fsum(value * value for value in values)
    a = sum_squares
    b = sum_squares
    d = sum_squares + 1
    trace = a + d
    discriminant = math.sqrt((a - d) ** 2 + 4 * b**2)
    return [
        math.sqrt(0.5 * (trace + discriminant)),
        math.sqrt(0.5 * (trace - discriminant)),
    ]


def main():
    geometry = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    bands_outer = json.loads(BANDS.read_text(encoding="utf-8"))
    photon_outer = json.loads(PHOTON.read_text(encoding="utf-8"))
    identifiability = json.loads(IDENTIFIABILITY.read_text(encoding="utf-8"))
    bands = bands_outer.get("view")
    photons = photon_outer.get("view")
    if (
        geometry.get("status") != "geometry-redshift-qualified"
        or geometry.get("executionCount") != 128
        or bands_outer.get("artifactSha256") != EXPECTED_BAND_SHA256
        or photon_outer.get("artifactSha256") != EXPECTED_PHOTON_SHA256
        or not isinstance(bands, dict)
        or not isinstance(photons, dict)
        or identifiability.get("global", {}).get("rank") != 1
    ):
        raise RuntimeError("v388-oracle-source-identity")
    rows = []
    ray_audits = []
    maximum_replay = 0.0
    maximum_formulation = 0.0
    maximum_residual = 0.0
    maximum_known_budget = 0.0
    for ray_offset, photon_ray in enumerate(photons["rays"]):
        ray_id = f"disk-{ray_offset:02d}"
        sample = next(
            entry
            for entry in bands["samples"]
            if entry["rayIndex"] == photon_ray["rayIndex"] and entry["applicable"]
        )
        carter = next(
            entry
            for entry in geometry["executions"]
            if entry["rayId"] == ray_id
            and entry["formulation"] == CARTER
            and entry["toleranceClass"] == "release"
            and entry["branch"] == "A"
        )
        ks = next(
            entry
            for entry in geometry["executions"]
            if entry["rayId"] == ray_id
            and entry["formulation"] == KS
            and entry["toleranceClass"] == "release"
            and entry["branch"] == "A"
        )
        sensitivities = [
            entry["logTemperatureSensitivity"]
            for entry in identifiability["rows"]
            if entry["rayIndex"] == photon_ray["rayIndex"]
        ]
        singular_values = augmented_singular_values(sensitivities)
        ray_audits.append(
            {
                "rayIndex": photon_ray["rayIndex"],
                "rayId": ray_id,
                "singularValues": singular_values,
                "conditionNumber": singular_values[0] / singular_values[1],
                "augmentedRank": 2,
            }
        )
        for measurement in photon_ray["measurements"]:
            band = next(entry for entry in sample["bands"] if entry["id"] == measurement["bandId"])
            product_temperature, residual = invert_product_temperature(
                measurement["bandLowerFrequencyHz"],
                measurement["bandUpperFrequencyHz"],
                measurement["observedPhotonRadiancePerSM2Sr"],
            )
            carter_temperature = product_temperature / carter["redshift"]
            ks_temperature = product_temperature / ks["redshift"]
            carter_replay = relative_difference(
                carter_temperature, sample["effectiveTemperatureK"]
            )
            ks_replay = relative_difference(
                ks_temperature, sample["effectiveTemperatureK"]
            )
            formulation = relative_difference(carter_temperature, ks_temperature)
            geometry_relative = abs(carter["redshift"] - ks["redshift"]) / min(
                carter["redshift"], ks["redshift"]
            )
            page_thorne_temperature = (
                sample["sourceErrorBudget"]["pageThorneQuadratureRelative"] / 4
            )
            known_upper = math.fsum(
                [
                    measurement["quadratureRelativeDifference"],
                    residual,
                    geometry_relative,
                    page_thorne_temperature,
                ]
            )
            maximum_replay = max(maximum_replay, carter_replay, ks_replay)
            maximum_formulation = max(maximum_formulation, formulation)
            maximum_residual = max(maximum_residual, residual)
            maximum_known_budget = max(maximum_known_budget, known_upper)
            rows.append(
                {
                    "rayIndex": photon_ray["rayIndex"],
                    "rayId": ray_id,
                    "bandId": measurement["bandId"],
                    "inferredProductTemperatureK": product_temperature,
                    "conditionedTemperatureCarterK": carter_temperature,
                    "conditionedTemperatureKerrSchildK": ks_temperature,
                    "carterTemperatureReplayRelativeDifference": carter_replay,
                    "kerrSchildTemperatureReplayRelativeDifference": ks_replay,
                    "formulationTemperatureRelativeDifference": formulation,
                    "inversionPhotonResidualRelative": residual,
                    "knownNumericalUpperBoundRelative": known_upper,
                }
            )
    if len(rows) != 12 or len(ray_audits) != 4:
        raise RuntimeError("v388-oracle-count")
    unsigned = {
        "version": "v388-kerr-geometry-conditioned-temperature-python-oracle-v1",
        "status": "qualified-independent-geometry-conditioned-root-oracle",
        "source": {
            "v296GeometryEvidenceSha256": geometry["evidenceSha256"],
            "v320BandArtifactSha256": bands_outer["artifactSha256"],
            "v328PhotonArtifactSha256": photon_outer["artifactSha256"],
            "v387IdentifiabilityArtifactSha256": identifiability["artifactSha256"],
        },
        "integration": "python-frequency-domain-simpson-16384",
        "inversion": "monotonic-bisection-104-iterations",
        "rows": rows,
        "rayAudits": ray_audits,
        "maximumTemperatureReplayRelativeDifference": maximum_replay,
        "maximumFormulationTemperatureRelativeDifference": maximum_formulation,
        "maximumInversionPhotonResidualRelative": maximum_residual,
        "maximumKnownNumericalUpperBoundRelative": maximum_known_budget,
        "spectralOnlyRank": 1,
        "geometryConditionedRank": 2,
        "combinationPolicy": "linear-sum-no-independence-proof-no-rss",
        "networkAttempted": False,
        "absoluteTemperatureAuthorityGranted": False,
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
                "spectralOnlyRank": 1,
                "geometryConditionedRank": 2,
                "maximumTemperatureReplayRelativeDifference": maximum_replay,
                "maximumInversionPhotonResidualRelative": maximum_residual,
                "maximumKnownNumericalUpperBoundRelative": maximum_known_budget,
                "absoluteTemperatureAuthorityGranted": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

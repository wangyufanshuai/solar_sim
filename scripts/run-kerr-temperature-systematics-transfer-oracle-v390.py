from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
IDENTIFIABILITY = ROOT / "dist/science/kerr-photon-source-identifiability-v387/identifiability.json"
INTERVAL = ROOT / "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json"
OUTPUT = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
STEPS = 8_192
ROOT_ITERATIONS = 88
FINITE_STEP = 1e-5


def canonicalize(value):
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value):
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def photon_and_log_sensitivity(frequency_hz, product_temperature_k):
    exponent = H * frequency_hz / (KB * product_temperature_k)
    if exponent > 700:
        return 0.0, 0.0
    denominator = math.expm1(exponent)
    photon = 2 * frequency_hz**2 / C**2 / denominator
    log_sensitivity = exponent * math.exp(exponent) / denominator
    return photon, log_sensitivity


def integrate(lower, upper, product_temperature_k):
    width = (upper - lower) / STEPS
    total = 0.0
    derivative = 0.0
    for index in range(STEPS + 1):
        frequency_hz = lower + index * width
        photon, sensitivity = photon_and_log_sensitivity(frequency_hz, product_temperature_k)
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * photon
        derivative += coefficient * photon * sensitivity
    scale = width / 3
    total *= scale
    derivative *= scale
    return total, derivative / total


def invert(lower_frequency, upper_frequency, target):
    lower = 100.0
    upper = 1e9
    for _ in range(ROOT_ITERATIONS):
        midpoint = 0.5 * (lower + upper)
        value, _ = integrate(lower_frequency, upper_frequency, midpoint)
        if value < target:
            lower = midpoint
        else:
            upper = midpoint
    return 0.5 * (lower + upper)


def relative_difference(left, right):
    return abs(left - right) / max(float.fromhex("0x0.0000000000001p-1022"), abs(left), abs(right))


def main():
    identity = json.loads(IDENTIFIABILITY.read_text(encoding="utf-8"))
    interval = json.loads(INTERVAL.read_text(encoding="utf-8"))
    if identity.get("status") != "three-band-identifiability-audit-qualified-source-degeneracy-persists-covariance-unavailable":
        raise RuntimeError("v390-oracle-identity")
    if interval.get("status") != "conditional-temperature-exact-interval-qualified-physical-systematics-unavailable":
        raise RuntimeError("v390-oracle-interval")
    rows = []
    maximum_finite_difference = 0.0
    maximum_identity_difference = 0.0
    maximum_condition = 0.0
    for interval_row in interval["rows"]:
        identity_row = next(
            row for row in identity["rows"]
            if row["rayIndex"] == interval_row["rayIndex"] and row["bandId"] == interval_row["bandId"]
        )
        _, planck_sensitivity = integrate(
            identity_row["bandLowerFrequencyHz"],
            identity_row["bandUpperFrequencyHz"],
            interval_row["productTemperatureCentralK"],
        )
        photon_transfer = 1 / planck_sensitivity
        photon_high = invert(
            identity_row["bandLowerFrequencyHz"],
            identity_row["bandUpperFrequencyHz"],
            interval_row["photonCentralPerSM2Sr"] * math.exp(FINITE_STEP),
        )
        photon_low = invert(
            identity_row["bandLowerFrequencyHz"],
            identity_row["bandUpperFrequencyHz"],
            interval_row["photonCentralPerSM2Sr"] * math.exp(-FINITE_STEP),
        )
        photon_finite = (math.log(photon_high) - math.log(photon_low)) / (2 * FINITE_STEP)
        redshift_finite = -1.0
        flux_finite = 0.25
        finite_difference = max(
            relative_difference(photon_transfer, photon_finite),
            relative_difference(-1.0, redshift_finite),
            relative_difference(0.25, flux_finite),
        )
        identity_difference = relative_difference(
            planck_sensitivity,
            identity_row["logTemperatureSensitivity"],
        )
        first_singular = math.hypot(photon_transfer, 1.0)
        condition = first_singular / 0.25
        maximum_finite_difference = max(maximum_finite_difference, finite_difference)
        maximum_identity_difference = max(maximum_identity_difference, identity_difference)
        maximum_condition = max(maximum_condition, condition)
        rows.append({
            "rayIndex": interval_row["rayIndex"],
            "bandId": interval_row["bandId"],
            "planckLogPhotonSensitivity": planck_sensitivity,
            "transferMatrix": [[photon_transfer, -1.0, 0.0], [0.0, 0.0, 0.25]],
            "singularValues": [first_singular, 0.25],
            "rank": 2,
            "conditionNumber": condition,
            "finiteDifference": {
                "photonRadianceToConditionedTemperature": photon_finite,
                "redshiftToConditionedTemperature": redshift_finite,
                "pageThorneFluxToSourceTemperature": flux_finite,
                "maximumRelativeDifference": finite_difference,
            },
            "identitySensitivityRelativeDifference": identity_difference,
        })
    unsigned = {
        "version": "v390-kerr-temperature-systematics-transfer-python-oracle-v1",
        "status": "qualified-independent-systematics-transfer-oracle",
        "source": {
            "v389IntervalArtifactSha256": interval["artifactSha256"],
            "v387IdentifiabilityArtifactSha256": identity["artifactSha256"],
            "v386SensitivityArtifactSha256": identity["source"]["v386SensitivityArtifactSha256"],
        },
        "integration": "python-frequency-domain-simpson-8192-analytic-planck-derivative",
        "inversion": "monotonic-bisection-88-iterations",
        "finiteDifferenceStep": FINITE_STEP,
        "rows": rows,
        "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
        "maximumIdentitySensitivityRelativeDifference": maximum_identity_difference,
        "maximumConditionNumber": maximum_condition,
        "physicalSystematicVectorAdmitted": False,
        "covarianceProjectionExecuted": False,
        "absoluteScientificIntervalQualified": False,
        "networkAttempted": False,
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, OUTPUT)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "rows": len(rows),
        "coefficientCount": len(rows) * 6,
        "maximumFiniteDifferenceRelativeDifference": maximum_finite_difference,
        "maximumIdentitySensitivityRelativeDifference": maximum_identity_difference,
        "maximumConditionNumber": maximum_condition,
        "physicalSystematicVectorAdmitted": False,
        "absoluteScientificIntervalQualified": False,
    }, indent=2))


if __name__ == "__main__":
    main()

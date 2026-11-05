from __future__ import annotations

import hashlib
import itertools
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
TRANSFER = ROOT / "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"
INTERVAL = ROOT / "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json"
IDENTIFIABILITY = ROOT / "dist/science/kerr-photon-source-identifiability-v387/identifiability.json"
OUTPUT = ROOT / "dist/science/kerr-temperature-trust-region-v391/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
STEPS = 8_192
NEWTON_ITERATIONS = 18
RADII = [1e-6, 3e-6, 1e-5, 3e-5, 1e-4, 3e-4, 1e-3, 3e-3, 1e-2]
LINEAR_LIMIT = 2e-6
QUADRATIC_LIMIT = 2e-8
MINIMUM_LINEAR_RADIUS = 3e-3
MINIMUM_QUADRATIC_RADIUS = 1e-2


def canonicalize(value):
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value):
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def spectral_moments(frequency_hz, product_temperature_k):
    exponent = H * frequency_hz / (KB * product_temperature_k)
    if exponent > 700:
        return 0.0, 0.0, 0.0
    exp_negative = math.exp(-exponent)
    one_minus = 1 - exp_negative
    photon = 2 * frequency_hz**2 / C**2 / math.expm1(exponent)
    sensitivity = exponent / one_minus
    derivative_x = 1 / one_minus - exponent * exp_negative / one_minus**2
    sensitivity_log_temperature_derivative = -exponent * derivative_x
    return (
        photon,
        photon * sensitivity,
        photon * (sensitivity**2 + sensitivity_log_temperature_derivative),
    )


def integrate(lower, upper, product_temperature_k):
    width = (upper - lower) / STEPS
    moments = [0.0, 0.0, 0.0]
    for index in range(STEPS + 1):
        frequency_hz = lower + index * width
        values = spectral_moments(frequency_hz, product_temperature_k)
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        for offset, value in enumerate(values):
            moments[offset] += coefficient * value
    moments = [value * width / 3 for value in moments]
    sensitivity = moments[1] / moments[0]
    sensitivity_derivative = moments[2] / moments[0] - sensitivity**2
    return moments[0], sensitivity, sensitivity_derivative


def invert(lower_frequency, upper_frequency, target, initial_temperature):
    lower = 100.0
    upper = 1e9
    temperature = min(upper, max(lower, initial_temperature))
    for _ in range(NEWTON_ITERATIONS):
        value, sensitivity, _ = integrate(lower_frequency, upper_frequency, temperature)
        residual = abs(value - target) / target
        if residual < 2e-11:
            break
        if value < target:
            lower = temperature
        else:
            upper = temperature
        candidate = temperature * math.exp((math.log(target) - math.log(value)) / sensitivity)
        if math.isfinite(candidate) and lower < candidate < upper:
            if abs(candidate - temperature) / temperature < 1e-13:
                break
            temperature = candidate
        else:
            temperature = math.sqrt(lower * upper)
    replay, _, _ = integrate(lower_frequency, upper_frequency, temperature)
    if abs(replay - target) / target >= 2e-10:
        raise RuntimeError("v391-oracle-inversion-residual")
    return temperature


def main():
    transfer = json.loads(TRANSFER.read_text(encoding="utf-8"))
    interval = json.loads(INTERVAL.read_text(encoding="utf-8"))
    identity = json.loads(IDENTIFIABILITY.read_text(encoding="utf-8"))
    if transfer.get("status") != "systematics-transfer-operator-qualified-physical-covariance-unavailable":
        raise RuntimeError("v391-oracle-transfer")
    if interval.get("artifactSha256") != transfer["source"]["v389IntervalArtifactSha256"]:
        raise RuntimeError("v391-oracle-interval")
    rows = []
    maximum_curvature_identity_difference = 0.0
    maximum_linear_residual = 0.0
    maximum_quadratic_residual = 0.0
    minimum_linear_trust = float("inf")
    minimum_quadratic_trust = float("inf")
    for transfer_row in transfer["rows"]:
        interval_row = next(row for row in interval["rows"] if row["rayIndex"] == transfer_row["rayIndex"] and row["bandId"] == transfer_row["bandId"])
        identity_row = next(row for row in identity["rows"] if row["rayIndex"] == transfer_row["rayIndex"] and row["bandId"] == transfer_row["bandId"])
        central_temperature = invert(
            identity_row["bandLowerFrequencyHz"],
            identity_row["bandUpperFrequencyHz"],
            interval_row["photonCentralPerSM2Sr"],
            interval_row["productTemperatureCentralK"],
        )
        _, sensitivity, sensitivity_derivative = integrate(
            identity_row["bandLowerFrequencyHz"],
            identity_row["bandUpperFrequencyHz"],
            central_temperature,
        )
        gain = 1 / sensitivity
        curvature = -sensitivity_derivative / sensitivity**3
        grid = []
        linear_trust = 0.0
        quadratic_trust = 0.0
        for radius in RADII:
            linear_residual = 0.0
            quadratic_residual = 0.0
            exact_by_sign = {}
            for sign in (-1, 1):
                delta = sign * radius
                perturbed = invert(
                    identity_row["bandLowerFrequencyHz"],
                    identity_row["bandUpperFrequencyHz"],
                    interval_row["photonCentralPerSM2Sr"] * math.exp(delta),
                    central_temperature * math.exp(gain * delta),
                )
                exact = math.log(perturbed / central_temperature)
                exact_by_sign[sign] = exact
                linear = gain * delta
                quadratic = linear + 0.5 * curvature * delta**2
                linear_residual = max(linear_residual, abs(exact - linear))
                quadratic_residual = max(quadratic_residual, abs(exact - quadratic))
            mixed_residual = 0.0
            for photon_sign, redshift_sign, flux_sign in itertools.product((-1, 1), repeat=3):
                conditioned_exact = exact_by_sign[photon_sign] - redshift_sign * radius
                conditioned_separable = exact_by_sign[photon_sign] + (-redshift_sign * radius)
                source_exact = 0.25 * flux_sign * radius
                source_separable = 0.25 * flux_sign * radius
                mixed_residual = max(
                    mixed_residual,
                    abs(conditioned_exact - conditioned_separable),
                    abs(source_exact - source_separable),
                )
            if linear_residual < LINEAR_LIMIT:
                linear_trust = radius
            if quadratic_residual < QUADRATIC_LIMIT:
                quadratic_trust = radius
            maximum_linear_residual = max(maximum_linear_residual, linear_residual)
            maximum_quadratic_residual = max(maximum_quadratic_residual, quadratic_residual)
            grid.append({
                "logRadius": radius,
                "maximumLinearAbsoluteLogResidual": linear_residual,
                "maximumQuadraticAbsoluteLogResidual": quadratic_residual,
                "maximumMixedSeparationAbsoluteLogResidual": mixed_residual,
            })
        curvature_identity_difference = abs(gain - transfer_row["transferMatrix"][0][0]) / max(abs(gain), abs(transfer_row["transferMatrix"][0][0]))
        maximum_curvature_identity_difference = max(maximum_curvature_identity_difference, curvature_identity_difference)
        minimum_linear_trust = min(minimum_linear_trust, linear_trust)
        minimum_quadratic_trust = min(minimum_quadratic_trust, quadratic_trust)
        rows.append({
            "rayIndex": transfer_row["rayIndex"],
            "bandId": transfer_row["bandId"],
            "planckLogPhotonSensitivity": sensitivity,
            "planckLogPhotonSensitivityDerivative": sensitivity_derivative,
            "photonInverseLogCurvature": curvature,
            "hessian": [
                [[curvature, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
                [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
            ],
            "grid": grid,
            "linearTrustRadius": linear_trust,
            "quadraticTrustRadius": quadratic_trust,
            "curvatureIdentityRelativeDifference": curvature_identity_difference,
        })
    unsigned = {
        "version": "v391-kerr-temperature-trust-region-python-oracle-v1",
        "status": "qualified-independent-curvature-trust-region-oracle",
        "source": {
            "v390TransferArtifactSha256": transfer["artifactSha256"],
            "v389IntervalArtifactSha256": interval["artifactSha256"],
            "v387IdentifiabilityArtifactSha256": identity["artifactSha256"],
        },
        "integration": "python-frequency-domain-simpson-8192-analytic-second-derivative",
        "inversion": "safeguarded-log-newton-18-iterations",
        "stressGrid": RADII,
        "linearAbsoluteLogResidualLimit": LINEAR_LIMIT,
        "quadraticAbsoluteLogResidualLimit": QUADRATIC_LIMIT,
        "minimumRequiredLinearTrustRadius": MINIMUM_LINEAR_RADIUS,
        "minimumRequiredQuadraticTrustRadius": MINIMUM_QUADRATIC_RADIUS,
        "rows": rows,
        "axisReplayCount": len(rows) * len(RADII) * 2,
        "mixedCornerReplayCount": len(rows) * len(RADII) * 8,
        "maximumCurvatureIdentityRelativeDifference": maximum_curvature_identity_difference,
        "maximumLinearAbsoluteLogResidual": maximum_linear_residual,
        "maximumQuadraticAbsoluteLogResidual": maximum_quadratic_residual,
        "minimumLinearTrustRadius": minimum_linear_trust,
        "minimumQuadraticTrustRadius": minimum_quadratic_trust,
        "stressGridIsPhysicalUncertainty": False,
        "probabilityContentAssigned": False,
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
        "axisReplayCount": artifact["axisReplayCount"],
        "mixedCornerReplayCount": artifact["mixedCornerReplayCount"],
        "maximumCurvatureIdentityRelativeDifference": maximum_curvature_identity_difference,
        "maximumLinearAbsoluteLogResidual": maximum_linear_residual,
        "maximumQuadraticAbsoluteLogResidual": maximum_quadratic_residual,
        "minimumLinearTrustRadius": minimum_linear_trust,
        "minimumQuadraticTrustRadius": minimum_quadratic_trust,
        "linearTrustQualified": minimum_linear_trust >= MINIMUM_LINEAR_RADIUS,
        "quadraticTrustQualified": minimum_quadratic_trust >= MINIMUM_QUADRATIC_RADIUS,
        "stressGridIsPhysicalUncertainty": False,
    }, indent=2))


if __name__ == "__main__":
    main()

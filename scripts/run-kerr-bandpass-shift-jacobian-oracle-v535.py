from __future__ import annotations

import bisect
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

ROOT = Path.cwd()
RAW = ROOT / "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml"
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
V534 = ROOT / "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json"
OUTPUT = ROOT / "dist/science/kerr-bandpass-shift-jacobian-v535/python-oracle.json"
C = 299_792_458.0
H_PLANCK = 6.626_070_15e-34
K_BOLTZMANN = 1.380_649e-23
LAMBDA_LOW = 4e-7
LAMBDA_HIGH = 7e-7
NU_LOW = C / LAMBDA_HIGH
NU_HIGH = C / LAMBDA_LOW
STEPS = 262_144
H_COARSE = 1e-4
H_FINE = 5e-5
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256"}
GAUSS_NODES = (
    -0.9602898564975363,
    -0.7966664774136267,
    -0.5255324099163290,
    -0.1834346424956498,
    0.1834346424956498,
    0.5255324099163290,
    0.7966664774136267,
    0.9602898564975363,
)
GAUSS_WEIGHTS = (
    0.1012285362903763,
    0.2223810344533745,
    0.3137066458778873,
    0.3626837833783620,
    0.3626837833783620,
    0.3137066458778873,
    0.2223810344533745,
    0.1012285362903763,
)


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return sha_bytes(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8"))


def parse_profile(source: bytes) -> tuple[list[float], list[float]]:
    root = ElementTree.fromstring(source)
    rows: list[tuple[float, float]] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].upper() != "TR":
            continue
        cells = [child for child in list(element) if child.tag.rsplit("}", 1)[-1].upper() == "TD"]
        if len(cells) != 2 or cells[0].text is None or cells[1].text is None:
            raise RuntimeError("v535-profile-row")
        rows.append((float(cells[0].text.strip()) * 1e-10, float(cells[1].text.strip())))
    if len(rows) != 8705 or any(right[0] <= left[0] for left, right in zip(rows, rows[1:])):
        raise RuntimeError("v535-profile-identity")
    return [row[0] for row in rows], [row[1] for row in rows]


def interpolate(wavelength_m: float, wavelengths: list[float], response: list[float]) -> float:
    if wavelength_m < wavelengths[0] or wavelength_m > wavelengths[-1]:
        raise RuntimeError("v535-response-outside-profile")
    right = bisect.bisect_left(wavelengths, wavelength_m)
    if right == 0:
        return response[0]
    if right == len(wavelengths):
        return response[-1]
    if wavelengths[right] == wavelength_m:
        return response[right]
    left = right - 1
    fraction = (wavelength_m - wavelengths[left]) / (wavelengths[right] - wavelengths[left])
    return response[left] + fraction * (response[right] - response[left])


def response_log_wavelength_derivative(wavelength_m: float, wavelengths: list[float], response: list[float]) -> float:
    if wavelength_m <= wavelengths[0] or wavelength_m >= wavelengths[-1]:
        raise RuntimeError("v535-derivative-outside-profile")
    right = bisect.bisect_left(wavelengths, wavelength_m)
    if right == 0:
        right = 1
    left = right - 1
    slope = (response[right] - response[left]) / (wavelengths[right] - wavelengths[left])
    return wavelength_m * slope


def photon_per_hz(frequency_hz: float, temperature_k: float, redshift_factor: float) -> float:
    emitted_frequency = frequency_hz / redshift_factor
    exponent = H_PLANCK * emitted_frequency / (K_BOLTZMANN * temperature_k)
    emitted_energy = 2 * H_PLANCK * emitted_frequency**3 / C**2 / math.expm1(exponent)
    observed_energy = redshift_factor**3 * emitted_energy
    value = observed_energy / (H_PLANCK * frequency_hz)
    if not math.isfinite(value) or value <= 0:
        raise RuntimeError("v535-photon-radiance")
    return value


def integrate_shifted_response(
    temperature_k: float,
    redshift_factor: float,
    delta_ln_lambda: float,
    wavelengths: list[float],
    response: list[float],
) -> float:
    width = (NU_HIGH - NU_LOW) / STEPS
    scale = math.exp(delta_ln_lambda)
    total = 0.0
    for index in range(STEPS + 1):
        frequency_hz = NU_LOW + index * width
        wavelength_observer = C / frequency_hz
        value = photon_per_hz(frequency_hz, temperature_k, redshift_factor)
        value *= interpolate(scale * wavelength_observer, wavelengths, response)
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * value
    result = total * width / 3
    if not math.isfinite(result) or result <= 0:
        raise RuntimeError("v535-integral")
    return result


def derivative(
    temperature_k: float,
    redshift_factor: float,
    step: float,
    wavelengths: list[float],
    response: list[float],
) -> float:
    plus = integrate_shifted_response(temperature_k, redshift_factor, step, wavelengths, response)
    minus = integrate_shifted_response(temperature_k, redshift_factor, -step, wavelengths, response)
    return (math.log(plus) - math.log(minus)) / (2 * step)


def frequency_domain_analytic_jacobian(
    temperature_k: float,
    redshift_factor: float,
    wavelengths: list[float],
    response: list[float],
) -> float:
    visible = [(wavelength, value) for wavelength, value in zip(wavelengths, response) if LAMBDA_LOW * (1 - 1e-15) <= wavelength <= LAMBDA_HIGH * (1 + 1e-15)]
    if len(visible) != 3301:
        raise RuntimeError("v535-visible-profile-count")
    denominator_terms: list[float] = []
    numerator_terms: list[float] = []
    for (lambda_left, response_left), (lambda_right, response_right) in zip(visible, visible[1:]):
        nu_left = C / lambda_right
        nu_right = C / lambda_left
        midpoint = (nu_left + nu_right) / 2
        half_width = (nu_right - nu_left) / 2
        slope = (response_right - response_left) / (lambda_right - lambda_left)
        for node, weight in zip(GAUSS_NODES, GAUSS_WEIGHTS):
            frequency_hz = midpoint + half_width * node
            wavelength_observer = C / frequency_hz
            photon = photon_per_hz(frequency_hz, temperature_k, redshift_factor)
            eta = response_left + slope * (wavelength_observer - lambda_left)
            coefficient = half_width * weight
            denominator_terms.append(coefficient * photon * eta)
            numerator_terms.append(coefficient * photon * wavelength_observer * slope)
    denominator = math.fsum(denominator_terms)
    numerator = math.fsum(numerator_terms)
    result = numerator / denominator
    if not math.isfinite(result):
        raise RuntimeError("v535-frequency-domain-jacobian")
    return result


def main() -> None:
    raw = RAW.read_bytes()
    wavelengths, response = parse_profile(raw)
    photon = json.loads(PHOTON.read_text(encoding="utf-8"))
    v534 = json.loads(V534.read_text(encoding="utf-8"))
    if len(photon.get("view", {}).get("rays", [])) != 4 or len(v534.get("rows", [])) != 4:
        raise RuntimeError("v535-upstream-rows")
    rows: list[dict[str, Any]] = []
    maximum_convergence = 0.0
    for ray in photon["view"]["rays"]:
        ray_index = int(ray["rayIndex"])
        authority_jacobian = frequency_domain_analytic_jacobian(
            float(ray["effectiveTemperatureK"]), float(ray["redshiftFactor"]), wavelengths, response
        )
        coarse = derivative(float(ray["effectiveTemperatureK"]), float(ray["redshiftFactor"]), H_COARSE, wavelengths, response)
        fine = derivative(float(ray["effectiveTemperatureK"]), float(ray["redshiftFactor"]), H_FINE, wavelengths, response)
        richardson = (4 * fine - coarse) / 3
        convergence = abs(fine - coarse)
        source = next(row for row in v534["rows"] if int(row["rayIndex"]) == ray_index)
        actual_bias = float(source["signedFrozenBiasRelative"])
        displacement = math.log(float(ray["redshiftFactor"]))
        predicted = authority_jacobian * displacement
        remainder = actual_bias - predicted
        maximum_convergence = max(maximum_convergence, convergence)
        rows.append({
            "rayIndex": ray_index,
            "responseShiftLogJacobian": authority_jacobian,
            "coarseCentralDifference": coarse,
            "fineCentralDifference": fine,
            "richardsonCentralDifferenceDiagnostic": richardson,
            "centralDifferenceConvergenceAbsolute": convergence,
            "finiteShiftLnG": displacement,
            "actualFiniteShiftSignedBiasRelative": actual_bias,
            "firstOrderSignedBiasRelative": predicted,
            "nonlinearRemainderSignedRelative": remainder,
            "nonlinearRemainderFractionOfActual": abs(remainder) / abs(actual_bias),
        })
    unsigned = {
        "version": "v535-kerr-bandpass-shift-frequency-domain-jacobian-oracle-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "qualified-independent-frequency-domain-response-shift-jacobian-oracle",
        "source": {
            "rawProfileSha256": sha_bytes(raw),
            "v328ArtifactSha256": photon["artifactSha256"],
            "v534ArtifactSha256": v534["artifactSha256"],
        },
        "formulation": {
            "quantity": "d-ln-band-photon-radiance-over-d-ln-response-wavelength",
            "responseArgument": "eta(exp(delta)-times-lambda-observer)",
            "quadrature": "observer-frequency-fixed-simpson-262144",
            "derivative": "piecewise-observer-frequency-gauss-legendre-8-direct-lambda-times-d-eta-d-lambda-integral",
            "finiteDifferenceDiagnostic": "two-step-centered-log-derivative-richardson-not-authority",
            "coarseStep": H_COARSE,
            "fineStep": H_FINE,
            "randomnessUsed": False,
        },
        "rows": rows,
        "counts": {"rayCount": 4, "centralDifferenceEvaluationCount": 16, "jacobianRowCount": 4},
        "maxima": {"centralDifferenceConvergenceAbsolute": maximum_convergence},
        "diagnosticBoundary": {
            "centralDifferenceQualifiedAsAuthority": False,
            "reason": "finite-difference-divides-independent-integration-error-by-small-step",
        },
        "boundary": {
            "measuredWavelengthCalibrationSigmaAvailable": False,
            "absoluteInstrumentUncertaintyAvailable": False,
            "electronExpectationRows": 0,
            "observedCountRows": 0,
            "sciencePixelRows": 0,
            "networkAttempted": False,
            "denseCampaignStatus": "incomplete-0-of-49",
        },
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    part = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    part.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(part, OUTPUT)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "rows": 4,
        "jacobianRange": [min(row["responseShiftLogJacobian"] for row in rows), max(row["responseShiftLogJacobian"] for row in rows)],
        "maximumConvergenceAbsolute": maximum_convergence,
        "absoluteInstrumentUncertainty": "unavailable",
    }, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
PROFILE = ROOT / "dist/science/measured-visible-throughput-v383/profile.csv"
SPECTRAL = ROOT / "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json"
DETECTOR = ROOT / "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json"
LIKELIHOOD = ROOT / "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json"
OUTPUT = ROOT / "dist/science/kerr-polarimeter-stokes-ensemble-v416/python-oracle.json"
EXPECTED_DETECTOR = "515bc2bf9e0100b9474edecafbc2676fb8b066bd08fb406e011da87590305ab5"
EXPECTED_LIKELIHOOD = "026df02475951260080eb33623a2328b6d6ec47a47691ebae4b879a46dd9e676"
SEED = "orbit-atlas-v416-stokes-ensemble-20260730"
TRIALS = 4096
TRUTH = [1.0, 0.08, -0.05, 0.01]
H = 6.62607015e-34
C = 299792458.0
KB = 1.380649e-23
TWO_POW_53 = 9_007_199_254_740_992
ONE_SIGMA = 0.6826894921370859
TWO_SIGMA = 0.9544997361036416


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
    payload = json.dumps(canonicalize(value), separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def uniform53(label):
    value = int.from_bytes(hashlib.sha256(label.encode()).digest()[:8], "big") >> 11
    return (value + 0.5) / TWO_POW_53


def normal(label):
    return math.sqrt(-2.0 * math.log(uniform53(f"{label}:u1"))) * math.cos(
        2.0 * math.pi * uniform53(f"{label}:u2")
    )


def poisson(lam, label):
    target = uniform53(f"{label}:poisson")
    probability = math.exp(-lam)
    cumulative = probability
    count = 0
    while target > cumulative:
        count += 1
        probability *= lam / count
        cumulative += probability
        if count > 128:
            raise RuntimeError("v416-poisson-tail")
    return count


def transpose(matrix):
    return [list(column) for column in zip(*matrix)]


def multiply(left, right):
    return [
        [sum(left[row][inner] * right[inner][column] for inner in range(len(right))) for column in range(len(right[0]))]
        for row in range(len(left))
    ]


def matrix_vector(matrix, vector):
    return [sum(row[index] * vector[index] for index in range(len(vector))) for row in matrix]


def inverse(matrix):
    size = len(matrix)
    work = [list(row) + [1.0 if column == row_index else 0.0 for column in range(size)] for row_index, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(work[row][column]))
        if abs(work[pivot][column]) <= 2.220446049250313e-16:
            raise RuntimeError("v416-inverse-singular")
        work[column], work[pivot] = work[pivot], work[column]
        scale = work[column][column]
        work[column] = [value / scale for value in work[column]]
        for row in range(size):
            if row == column:
                continue
            factor = work[row][column]
            work[row] = [work[row][offset] - factor * work[column][offset] for offset in range(size * 2)]
    return [row[size:] for row in work]


def cholesky(matrix):
    size = len(matrix)
    lower = [[0.0] * size for _ in range(size)]
    for row in range(size):
        for column in range(row + 1):
            value = matrix[row][column]
            for inner in range(column):
                value -= lower[row][inner] * lower[column][inner]
            if row == column:
                if value <= 0:
                    raise RuntimeError("v416-cholesky")
                lower[row][column] = math.sqrt(value)
            else:
                lower[row][column] = value / lower[column][column]
    return lower


def covariance_transform(operator, covariance):
    return multiply(multiply(operator, covariance), transpose(operator))


def response_at(pack, wavelength):
    intervals = pack["intervals"]
    interval = next(
        (index for index, entry in enumerate(intervals) if entry["lowerWavelengthM"] <= wavelength <= entry["upperWavelengthM"]),
        len(intervals) - 1,
    )
    lower = pack["nodes"][interval]
    upper = pack["nodes"][interval + 1]
    weight = (wavelength - lower["wavelengthM"]) / (upper["wavelengthM"] - lower["wavelengthM"])
    return [
        [
            lower["responseMatrix"][row][column] * (1.0 - weight)
            + upper["responseMatrix"][row][column] * weight
            for column in range(4)
        ]
        for row in range(4)
    ]


def photon_spectral(wavelength, temperature, redshift):
    observed = C / wavelength
    emitted = observed / redshift
    exponent = H * emitted / (KB * temperature)
    emitted_energy = 2.0 * H * emitted**3 / (C**2 * math.expm1(exponent))
    observed_energy = redshift**3 * emitted_energy
    return observed_energy / (H * observed) * C / wavelength**2


def effective_response(pack, profile, ray, fixture):
    matrix = [[0.0] * 4 for _ in range(4)]
    for index in range(1, len(profile)):
        left = profile[index - 1]
        right = profile[index]
        left_response = response_at(pack, left[0])
        right_response = response_at(pack, right[0])
        left_spectral = photon_spectral(left[0], ray["effectiveTemperatureK"], ray["redshiftFactor"]) * left[1]
        right_spectral = photon_spectral(right[0], ray["effectiveTemperatureK"], ray["redshiftFactor"]) * right[1]
        width = right[0] - left[0]
        for row in range(4):
            for column in range(4):
                matrix[row][column] += 0.5 * width * (
                    left_spectral * left_response[row][column]
                    + right_spectral * right_response[row][column]
                )
    factor = (
        fixture["collectingAreaM2"]
        * fixture["pixelSolidAngleSr"]
        * fixture["exposureTimeS"]
        * fixture["quantumEfficiency"]
    )
    return [[value * factor for value in row] for row in matrix]


def running():
    return {"count": 0, "mean": 0.0, "m2": 0.0, "one": 0, "two": 0}


def update(state, value):
    state["count"] += 1
    delta = value - state["mean"]
    state["mean"] += delta / state["count"]
    state["m2"] += delta * (value - state["mean"])
    if abs(value) <= 1.0:
        state["one"] += 1
    if abs(value) <= 2.0:
        state["two"] += 1


def finalize(state, component):
    one = state["one"] / state["count"]
    two = state["two"] / state["count"]
    return {
        "component": component,
        "count": state["count"],
        "mean": state["mean"],
        "standardDeviation": math.sqrt(state["m2"] / (state["count"] - 1)),
        "coverageOneSigma": one,
        "coverageTwoSigma": two,
        "coverageOneSigmaAbsoluteError": abs(one - ONE_SIGMA),
        "coverageTwoSigmaAbsoluteError": abs(two - TWO_SIGMA),
    }


with PHOTON.open(encoding="utf-8") as handle:
    photon = json.load(handle)
with SPECTRAL.open(encoding="utf-8") as handle:
    spectral = json.load(handle)
with DETECTOR.open(encoding="utf-8") as handle:
    detector = json.load(handle)
with LIKELIHOOD.open(encoding="utf-8") as handle:
    likelihood = json.load(handle)
if detector.get("artifactSha256") != EXPECTED_DETECTOR or likelihood.get("artifactSha256") != EXPECTED_LIKELIHOOD:
    raise RuntimeError("v416-authority-lock")
profile = []
for line in PROFILE.read_text(encoding="utf-8").splitlines()[1:]:
    wavelength, throughput = line.split(",")
    profile.append((float(wavelength), float(throughput)))
fixture = detector["view"]["fixture"]
rays = []
for detector_ray in detector["view"]["rays"]:
    photon_ray = next(ray for ray in photon["view"]["rays"] if ray["rayIndex"] == detector_ray["rayIndex"])
    response = effective_response(spectral["pack"], profile, photon_ray, fixture)
    response_inverse = inverse(response)
    counting_covariance = [
        [
            detector_ray["channels"][row]["countingVarianceElectronSquared"] if row == column else 0.0
            for column in range(4)
        ]
        for row in range(4)
    ]
    counting_stokes_covariance = covariance_transform(response_inverse, counting_covariance)
    calibration_stokes_covariance = covariance_transform(
        response_inverse, detector_ray["calibrationCovarianceElectronSquared"]
    )
    calibration_lower = cholesky(detector_ray["calibrationCovarianceElectronSquared"])
    counting_states = [running() for _ in range(4)]
    calibration_states = [running() for _ in range(4)]
    first_counting = None
    first_calibration = None
    for trial in range(TRIALS):
        counting_residual = []
        for channel in detector_ray["channels"]:
            prefix = f"{SEED}:ray-{detector_ray['rayIndex']}:trial-{trial}:channel-{channel['channelIndex']}"
            source = math.sqrt(channel["sourceElectronExpectation"]) * normal(f"{prefix}:source")
            dark = poisson(channel["darkElectronExpectation"], f"{prefix}:dark") - channel["darkElectronExpectation"]
            background = (
                poisson(channel["backgroundElectronExpectation"], f"{prefix}:background")
                - channel["backgroundElectronExpectation"]
            )
            read = fixture["readNoiseRmsElectronPerPixelRead"] * math.sqrt(fixture["readCount"]) * normal(f"{prefix}:read")
            counting_residual.append(source + dark + background + read)
        calibration_z = [
            normal(f"{SEED}:ray-{detector_ray['rayIndex']}:trial-{trial}:calibration-{channel['channelIndex']}")
            for channel in detector_ray["channels"]
        ]
        calibration_residual = matrix_vector(calibration_lower, calibration_z)
        counting_error = matrix_vector(response_inverse, counting_residual)
        calibration_error = matrix_vector(response_inverse, calibration_residual)
        counting_pull = [
            counting_error[index] / math.sqrt(counting_stokes_covariance[index][index]) for index in range(4)
        ]
        calibration_pull = [
            calibration_error[index] / math.sqrt(calibration_stokes_covariance[index][index]) for index in range(4)
        ]
        if trial == 0:
            first_counting = counting_pull
            first_calibration = calibration_pull
        for component in range(4):
            update(counting_states[component], counting_pull[component])
            update(calibration_states[component], calibration_pull[component])
    rays.append(
        {
            "rayIndex": detector_ray["rayIndex"],
            "effectiveResponseMatrix": response,
            "countingPullStatistics": [finalize(state, index) for index, state in enumerate(counting_states)],
            "calibrationPullStatistics": [finalize(state, index) for index, state in enumerate(calibration_states)],
            "firstTrial": {"countingPull": first_counting, "calibrationPull": first_calibration},
        }
    )

unsigned = {
    "version": "v416-kerr-polarimeter-stokes-ensemble-python-oracle-v1",
    "generatedAt": likelihood["generatedAt"],
    "status": "qualified-independent-streaming-stokes-ensemble-oracle",
    "source": {
        "v414DetectorArtifactSha256": EXPECTED_DETECTOR,
        "v415LikelihoodArtifactSha256": EXPECTED_LIKELIHOOD,
    },
    "seedNamespace": SEED,
    "trialCountPerRay": TRIALS,
    "totalTrialCount": TRIALS * 4,
    "rays": rays,
    "observedCountsAvailable": False,
    "measuredDetectorAuthorityGranted": False,
    "networkAttempted": False,
}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
temporary = Path(f"{OUTPUT}.{os.getpid()}.part")
temporary.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
os.replace(temporary, OUTPUT)
print(
    json.dumps(
        {
            "status": artifact["status"],
            "artifactSha256": artifact["artifactSha256"],
            "trialCount": TRIALS * 4,
            "observedCountsAvailable": False,
        },
        indent=2,
    )
)

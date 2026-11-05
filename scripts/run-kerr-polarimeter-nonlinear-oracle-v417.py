from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
DETECTOR = ROOT / "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json"
ENSEMBLE = ROOT / "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json"
OUTPUT = ROOT / "dist/science/kerr-polarimeter-nonlinear-observables-v417/python-oracle.json"
EXPECTED_DETECTOR = "515bc2bf9e0100b9474edecafbc2676fb8b066bd08fb406e011da87590305ab5"
EXPECTED_ENSEMBLE = "859f754ace836a18ba5671bee5d53504aa2987ac2d469c6bde8230d640e88e81"
SEED = "orbit-atlas-v417-nonlinear-polarization-20260730"
TRIALS = 8192
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
            raise RuntimeError("v417-poisson-tail")
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


def covariance_transform(operator, covariance):
    return multiply(multiply(operator, covariance), transpose(operator))


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
                    raise RuntimeError("v417-cholesky")
                lower[row][column] = math.sqrt(value)
            else:
                lower[row][column] = value / lower[column][column]
    return lower


def observables(stokes):
    i, q, u, v = stokes
    if i <= 0 or not all(math.isfinite(value) for value in stokes):
        return None
    linear = math.hypot(q, u)
    if linear <= 0:
        return None
    return {"pL": linear / i, "pC": v / i, "evpaRad": 0.5 * math.atan2(u, q)}


def axial_residual(value, truth):
    residual = value - truth
    while residual < -math.pi / 2:
        residual += math.pi
    while residual >= math.pi / 2:
        residual -= math.pi
    return residual


def jacobian(stokes):
    i, q, u, v = stokes
    linear = math.hypot(q, u)
    square = q * q + u * u
    return [
        [-linear / i**2, q / (i * linear), u / (i * linear), 0.0],
        [-v / i**2, 0.0, 0.0, 1.0 / i],
        [0.0, -0.5 * u / square, 0.5 * q / square, 0.0],
    ]


def running():
    return {"count": 0, "mean": 0.0, "m2": 0.0, "one": 0, "two": 0, "cosine": 0.0, "sine": 0.0}


def update(state, residual, sigma, axial=False):
    pull = residual / sigma
    state["count"] += 1
    delta = residual - state["mean"]
    state["mean"] += delta / state["count"]
    state["m2"] += delta * (residual - state["mean"])
    if abs(pull) <= 1.0:
        state["one"] += 1
    if abs(pull) <= 2.0:
        state["two"] += 1
    if axial:
        state["cosine"] += math.cos(2.0 * residual)
        state["sine"] += math.sin(2.0 * residual)


def finalize(state, observable, family, sigma):
    one = state["one"] / state["count"]
    two = state["two"] / state["count"]
    standard_deviation = math.sqrt(state["m2"] / (state["count"] - 1))
    axial = observable == "evpa"
    mean_cosine = state["cosine"] / state["count"]
    mean_sine = state["sine"] / state["count"]
    return {
        "observable": observable,
        "family": family,
        "count": state["count"],
        "predictedSigma": sigma,
        "meanResidual": state["mean"],
        "standardizedBias": state["mean"] / sigma,
        "residualStandardDeviation": standard_deviation,
        "standardDeviationRatio": standard_deviation / sigma,
        "coverageOneSigma": one,
        "coverageTwoSigma": two,
        "coverageOneSigmaAbsoluteError": abs(one - ONE_SIGMA),
        "coverageTwoSigmaAbsoluteError": abs(two - TWO_SIGMA),
        "axialResultantLength": math.hypot(mean_cosine, mean_sine) if axial else None,
        "axialMeanResidualRad": 0.5 * math.atan2(mean_sine, mean_cosine) if axial else None,
    }


with DETECTOR.open(encoding="utf-8") as handle:
    detector = json.load(handle)
with ENSEMBLE.open(encoding="utf-8") as handle:
    ensemble = json.load(handle)
if detector.get("artifactSha256") != EXPECTED_DETECTOR or ensemble.get("artifactSha256") != EXPECTED_ENSEMBLE:
    raise RuntimeError("v417-authority-lock")
truth_stokes = ensemble["view"]["truthStokes"]
truth = observables(truth_stokes)
if truth is None:
    raise RuntimeError("v417-truth")
jac = jacobian(truth_stokes)
fixture = detector["view"]["fixture"]
rays = []
for ensemble_ray in ensemble["view"]["rays"]:
    detector_ray = next(ray for ray in detector["view"]["rays"] if ray["rayIndex"] == ensemble_ray["rayIndex"])
    counting_covariance = covariance_transform(jac, ensemble_ray["countingStokesCovariance"])
    calibration_covariance = covariance_transform(jac, ensemble_ray["calibrationStokesCovariance"])
    counting_sigma = [math.sqrt(counting_covariance[index][index]) for index in range(3)]
    calibration_sigma = [math.sqrt(calibration_covariance[index][index]) for index in range(3)]
    calibration_lower = cholesky(detector_ray["calibrationCovarianceElectronSquared"])
    states = {"counting": [running() for _ in range(3)], "calibration": [running() for _ in range(3)]}
    raw = {"counting": running(), "calibration": running()}
    debiased = {"counting": running(), "calibration": running()}
    clamp = {"counting": 0, "calibration": 0}
    physical = {"counting": 0, "calibration": 0}
    invalid = {"counting": 0, "calibration": 0}
    first = {"counting": None, "calibration": None}
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
        stokes_by_family = {
            "counting": [
                truth_stokes[index] + value
                for index, value in enumerate(matrix_vector(ensemble_ray["inverseResponseMatrix"], counting_residual))
            ],
            "calibration": [
                truth_stokes[index] + value
                for index, value in enumerate(matrix_vector(ensemble_ray["inverseResponseMatrix"], calibration_residual))
            ],
        }
        for family in ("counting", "calibration"):
            current = observables(stokes_by_family[family])
            if current is None:
                invalid[family] += 1
                continue
            stokes = stokes_by_family[family]
            if math.sqrt(stokes[1] ** 2 + stokes[2] ** 2 + stokes[3] ** 2) / stokes[0] > 1.0:
                physical[family] += 1
            residuals = [
                current["pL"] - truth["pL"],
                current["pC"] - truth["pC"],
                axial_residual(current["evpaRad"], truth["evpaRad"]),
            ]
            sigma = counting_sigma if family == "counting" else calibration_sigma
            for observable in range(3):
                update(states[family][observable], residuals[observable], sigma[observable], observable == 2)
            update(raw[family], residuals[0], sigma[0])
            square = current["pL"] ** 2 - sigma[0] ** 2
            if square <= 0:
                clamp[family] += 1
            update(debiased[family], math.sqrt(max(0.0, square)) - truth["pL"], sigma[0])
            if trial == 0:
                first[family] = {
                    "pL": current["pL"],
                    "pC": current["pC"],
                    "evpaRad": current["evpaRad"],
                    "evpaResidualRad": residuals[2],
                }
    ids = ("pL", "pC", "evpa")
    rays.append(
        {
            "rayIndex": detector_ray["rayIndex"],
            "countingObservableCovariance": counting_covariance,
            "calibrationObservableCovariance": calibration_covariance,
            "countingStatistics": [finalize(states["counting"][index], ids[index], "counting", counting_sigma[index]) for index in range(3)],
            "calibrationStatistics": [finalize(states["calibration"][index], ids[index], "calibration", calibration_sigma[index]) for index in range(3)],
            "pLRawBiasSigma": {
                "counting": raw["counting"]["mean"] / counting_sigma[0],
                "calibration": raw["calibration"]["mean"] / calibration_sigma[0],
            },
            "pLDebiasedBiasSigma": {
                "counting": debiased["counting"]["mean"] / counting_sigma[0],
                "calibration": debiased["calibration"]["mean"] / calibration_sigma[0],
            },
            "pLDebiasClampCount": clamp,
            "physicalConeViolationCount": physical,
            "invalidObservableCount": invalid,
            "firstTrial": first,
        }
    )

unsigned = {
    "version": "v417-kerr-polarimeter-nonlinear-observables-python-oracle-v1",
    "generatedAt": ensemble["generatedAt"],
    "status": "qualified-independent-nonlinear-polarization-coverage-oracle",
    "source": {
        "v414DetectorArtifactSha256": EXPECTED_DETECTOR,
        "v416StokesEnsembleArtifactSha256": EXPECTED_ENSEMBLE,
    },
    "seedNamespace": SEED,
    "trialCountPerRay": TRIALS,
    "totalTrialCount": TRIALS * 4,
    "truth": truth,
    "rays": rays,
    "observedPolarizationAvailable": False,
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
            "observedPolarizationAvailable": False,
        },
        indent=2,
    )
)

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json"
OUTPUT = ROOT / "dist/science/kerr-polarimeter-detector-likelihood-v415/python-oracle.json"
EXPECTED_SOURCE = "515bc2bf9e0100b9474edecafbc2676fb8b066bd08fb406e011da87590305ab5"
SEED = "orbit-atlas-v415-detector-noise-fixture-20260730"
TWO_POW_53 = 9_007_199_254_740_992
TWO_PI = 2.0 * math.pi


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


def canonical_sha(value) -> str:
    payload = json.dumps(canonicalize(value), separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def uniform53(label: str) -> float:
    digest = hashlib.sha256(label.encode()).digest()
    value = int.from_bytes(digest[:8], "big") >> 11
    return (value + 0.5) / TWO_POW_53


def standard_normal(label: str) -> float:
    first = uniform53(f"{label}:u1")
    second = uniform53(f"{label}:u2")
    return math.sqrt(-2.0 * math.log(first)) * math.cos(TWO_PI * second)


def small_poisson(lam: float, label: str) -> int:
    target = uniform53(f"{label}:poisson")
    probability = math.exp(-lam)
    cumulative = probability
    count = 0
    while target > cumulative:
        count += 1
        probability *= lam / count
        cumulative += probability
        if count > 128:
            raise RuntimeError("v415-small-poisson-tail")
    return count


def poisson_nll(value: int, lam: float) -> float:
    return lam - value * math.log(lam) + math.lgamma(value + 1)


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
                    raise RuntimeError("v415-cholesky-positive-definite")
                lower[row][column] = math.sqrt(value)
            else:
                lower[row][column] = value / lower[column][column]
    return lower


with SOURCE.open(encoding="utf-8") as handle:
    source = json.load(handle)
if source.get("artifactSha256") != EXPECTED_SOURCE:
    raise RuntimeError("v415-v414-lock")

fixture = source["view"]["fixture"]
rays = []
for ray in source["view"]["rays"]:
    rows = []
    for channel in ray["channels"]:
        prefix = f"{SEED}:ray-{ray['rayIndex']}:channel-{channel['channelIndex']}"
        source_z = standard_normal(f"{prefix}:source")
        read_z = standard_normal(f"{prefix}:read")
        dark_draw = small_poisson(channel["darkElectronExpectation"], f"{prefix}:dark")
        background_draw = small_poisson(channel["backgroundElectronExpectation"], f"{prefix}:background")
        source_residual = math.sqrt(channel["sourceElectronExpectation"]) * source_z
        dark_residual = dark_draw - channel["darkElectronExpectation"]
        background_residual = background_draw - channel["backgroundElectronExpectation"]
        read_residual = fixture["readNoiseRmsElectronPerPixelRead"] * math.sqrt(fixture["readCount"]) * read_z
        total_residual = source_residual + dark_residual + background_residual + read_residual
        source_nll = 0.5 * (source_z**2 + math.log(TWO_PI * channel["sourceElectronExpectation"]))
        dark_nll = poisson_nll(dark_draw, channel["darkElectronExpectation"])
        background_nll = poisson_nll(background_draw, channel["backgroundElectronExpectation"])
        read_variance = fixture["readCount"] * fixture["readNoiseRmsElectronPerPixelRead"] ** 2
        read_nll = 0.5 * (read_z**2 + math.log(TWO_PI * read_variance))
        rows.append(
            {
                "channelIndex": channel["channelIndex"],
                "sourceNormalZ": source_z,
                "readGaussianZ": read_z,
                "darkPoissonDraw": dark_draw,
                "backgroundPoissonDraw": background_draw,
                "totalCountingResidualElectron": total_residual,
                "countingComponentNegativeLogLikelihood": source_nll + dark_nll + background_nll + read_nll,
            }
        )
    covariance = ray["calibrationCovarianceElectronSquared"]
    lower = cholesky(covariance)
    calibration_z = [
        standard_normal(f"{SEED}:ray-{ray['rayIndex']}:calibration-{channel['channelIndex']}")
        for channel in ray["channels"]
    ]
    calibration_residual = [
        sum(lower[row][inner] * calibration_z[inner] for inner in range(4)) for row in range(4)
    ]
    mahalanobis = sum(value**2 for value in calibration_z)
    log_determinant = 2.0 * sum(math.log(lower[index][index]) for index in range(4))
    rays.append(
        {
            "rayIndex": ray["rayIndex"],
            "rows": rows,
            "calibration": {
                "gaussianZ": calibration_z,
                "residualElectron": calibration_residual,
                "mahalanobisSquared": mahalanobis,
                "gaussianNegativeLogLikelihood": 0.5
                * (mahalanobis + 4.0 * math.log(TWO_PI) + log_determinant),
            },
        }
    )

unsigned = {
    "version": "v415-kerr-polarimeter-detector-noise-likelihood-python-oracle-v1",
    "generatedAt": source["generatedAt"],
    "status": "qualified-independent-deterministic-noise-likelihood-fixture-oracle",
    "source": {"v414DetectorArtifactSha256": EXPECTED_SOURCE},
    "seedNamespace": SEED,
    "rays": rays,
    "rayCount": 4,
    "rowCount": 16,
    "sourcePoissonIntegerExact": False,
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
            "rowCount": 16,
            "sourcePoissonIntegerExact": False,
            "observedCountsAvailable": False,
        },
        indent=2,
    )
)

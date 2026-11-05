from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
REPLAY = ROOT / "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json"
PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"
BANDS = ROOT / "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"
OUTPUT = ROOT / "dist/science/kerr-conditional-temperature-interval-v389/python-oracle.json"
C = 299_792_458.0
H = 6.62607015e-34
KB = 1.380649e-23
STEPS = 8_192
ROOT_ITERATIONS = 88


def canonicalize(value):
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value):
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def integrate(lower, upper, product_temperature_k):
    width = (upper - lower) / STEPS
    total = 0.0
    for index in range(STEPS + 1):
        frequency_hz = lower + index * width
        exponent = H * frequency_hz / (KB * product_temperature_k)
        photon = 0.0 if exponent > 700 else 2 * frequency_hz**2 / C**2 / math.expm1(exponent)
        coefficient = 1 if index in (0, STEPS) else 2 if index % 2 == 0 else 4
        total += coefficient * photon
    return total * width / 3


def invert(lower_frequency, upper_frequency, target):
    lower = 100.0
    upper = 1e9
    for _ in range(ROOT_ITERATIONS):
        midpoint = 0.5 * (lower + upper)
        if integrate(lower_frequency, upper_frequency, midpoint) < target:
            lower = midpoint
        else:
            upper = midpoint
    return 0.5 * (lower + upper)


def relative_radius(central, lower, upper):
    return max(abs(central - lower), abs(upper - central)) / central


def main():
    replay = json.loads(REPLAY.read_text(encoding="utf-8"))
    photon_outer = json.loads(PHOTON.read_text(encoding="utf-8"))
    band_outer = json.loads(BANDS.read_text(encoding="utf-8"))
    photons = photon_outer["view"]
    bands = band_outer["view"]
    if replay.get("status") != "geometry-conditioned-temperature-replay-qualified-absolute-authority-withheld" or len(replay.get("rows", [])) != 12:
        raise RuntimeError("v389-oracle-source-identity")
    rows = []
    maxima = {"photon": 0.0, "numerical": 0.0, "source": 0.0}
    overlap_count = 0
    for replay_row in replay["rows"]:
        photon_ray = next(ray for ray in photons["rays"] if ray["rayIndex"] == replay_row["rayIndex"])
        measurement = next(entry for entry in photon_ray["measurements"] if entry["bandId"] == replay_row["bandId"])
        sample = next(entry for entry in bands["samples"] if entry["rayIndex"] == replay_row["rayIndex"] and entry["applicable"])
        photon_radius = measurement["quadratureRelativeDifference"] + replay_row["pythonOracleMaximumRelativeDifference"] + replay_row["inversionPhotonResidualRelative"]
        photon_lower = measurement["observedPhotonRadiancePerSM2Sr"] * (1 - photon_radius)
        photon_upper = measurement["observedPhotonRadiancePerSM2Sr"] * (1 + photon_radius)
        product_central = invert(measurement["bandLowerFrequencyHz"], measurement["bandUpperFrequencyHz"], measurement["observedPhotonRadiancePerSM2Sr"])
        product_lower = invert(measurement["bandLowerFrequencyHz"], measurement["bandUpperFrequencyHz"], photon_lower)
        product_upper = invert(measurement["bandLowerFrequencyHz"], measurement["bandUpperFrequencyHz"], photon_upper)
        g_lower = min(replay_row["geometryRedshiftCarter"], replay_row["geometryRedshiftKerrSchild"])
        g_upper = max(replay_row["geometryRedshiftCarter"], replay_row["geometryRedshiftKerrSchild"])
        temperature_central = replay_row["conditionedTemperatureCarterK"]
        temperature_lower = product_lower / g_upper
        temperature_upper = product_upper / g_lower
        numerical_radius = relative_radius(temperature_central, temperature_lower, temperature_upper)
        flux_radius = sample["sourceErrorBudget"]["pageThorneQuadratureRelative"]
        source_central = sample["effectiveTemperatureK"]
        source_lower = source_central * (1 - flux_radius) ** 0.25
        source_upper = source_central * (1 + flux_radius) ** 0.25
        source_radius = relative_radius(source_central, source_lower, source_upper)
        overlap = temperature_lower <= source_upper and source_lower <= temperature_upper
        overlap_count += 1 if overlap else 0
        maxima["photon"] = max(maxima["photon"], photon_radius)
        maxima["numerical"] = max(maxima["numerical"], numerical_radius)
        maxima["source"] = max(maxima["source"], source_radius)
        rows.append({
            "rayIndex": replay_row["rayIndex"],
            "bandId": replay_row["bandId"],
            "photonRelativeRadius": photon_radius,
            "productTemperatureCentralK": product_central,
            "productTemperatureIntervalK": {"lower": product_lower, "upper": product_upper},
            "geometryRedshiftInterval": {"lower": g_lower, "upper": g_upper},
            "conditionedTemperatureNumericalIntervalK": {"lower": temperature_lower, "upper": temperature_upper},
            "conditionedTemperatureNumericalRelativeRadius": numerical_radius,
            "sourceModelTemperatureIntervalK": {"lower": source_lower, "upper": source_upper},
            "sourceModelTemperatureRelativeRadius": source_radius,
            "numericalAndSourceModelIntervalsOverlap": overlap,
        })
    unsigned = {
        "version": "v389-kerr-conditional-temperature-interval-python-oracle-v1",
        "status": "qualified-independent-exact-endpoint-interval-oracle",
        "source": {
            "v388ReplayArtifactSha256": replay["artifactSha256"],
            "v328PhotonArtifactSha256": photon_outer["artifactSha256"],
            "v320BandArtifactSha256": band_outer["artifactSha256"],
        },
        "integration": "python-frequency-domain-simpson-8192",
        "inversion": "monotonic-bisection-88-iterations",
        "rows": rows,
        "overlapCount": overlap_count,
        "maximumPhotonRelativeRadius": maxima["photon"],
        "maximumConditionedTemperatureNumericalRelativeRadius": maxima["numerical"],
        "maximumSourceModelTemperatureRelativeRadius": maxima["source"],
        "intervalCombination": "worst-case-endpoints-no-independence-proof-no-rss",
        "confidenceInterval": False,
        "probabilityContentAssigned": False,
        "networkAttempted": False,
        "absoluteScientificIntervalQualified": False,
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
        "overlapCount": overlap_count,
        "maximumPhotonRelativeRadius": maxima["photon"],
        "maximumConditionedTemperatureNumericalRelativeRadius": maxima["numerical"],
        "maximumSourceModelTemperatureRelativeRadius": maxima["source"],
        "absoluteScientificIntervalQualified": False,
    }, indent=2))


if __name__ == "__main__":
    main()

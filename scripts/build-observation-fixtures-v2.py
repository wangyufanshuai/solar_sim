from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
from pathlib import Path

import batman
import numpy as np

VERSION = "v149-independent-observation-fixtures-v2"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def value(record: dict, field: str, fallback: float | None = None) -> float:
    observed = record[field].get("value")
    if observed is None:
        if fallback is None:
            raise ValueError(f"{record['planetName']} is missing {field}")
        return fallback
    return float(observed)


def solve_eccentric_anomaly(mean_anomaly: float, eccentricity: float) -> float:
    eccentric_anomaly = mean_anomaly
    for _ in range(32):
        delta = (
            eccentric_anomaly - eccentricity * math.sin(eccentric_anomaly) - mean_anomaly
        ) / (1 - eccentricity * math.cos(eccentric_anomaly))
        eccentric_anomaly -= delta
        if abs(delta) < 1e-14:
            break
    return eccentric_anomaly


def true_anomaly(phase: float, eccentricity: float) -> float:
    eccentric_anomaly = solve_eccentric_anomaly(phase * math.tau, eccentricity)
    return 2 * math.atan2(
        math.sqrt(1 + eccentricity) * math.sin(eccentric_anomaly / 2),
        math.sqrt(1 - eccentricity) * math.cos(eccentric_anomaly / 2),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate independent batman and Keplerian observation fixtures.")
    parser.add_argument("--input", default="public/data/exoplanet-observations-v2/validation-systems.json")
    parser.add_argument("--output", default="public/data/observation-fixtures-v2.json")
    args = parser.parse_args()
    input_path = Path(args.input).resolve()
    records = json.loads(input_path.read_text(encoding="utf-8"))
    by_name = {record["planetName"].casefold(): record for record in records}

    transit_record = by_name["hd 209458 b"]
    transit_count = 360
    phases = np.array([(index / (transit_count - 1) - 0.5) * 0.3 for index in range(transit_count)])
    params = batman.TransitParams()
    params.t0 = 0.0
    params.per = 1.0
    params.rp = value(transit_record, "radiusRatio")
    params.a = value(transit_record, "scaledSemiMajorAxis")
    params.inc = value(transit_record, "inclinationDeg", 90.0)
    params.ecc = value(transit_record, "eccentricity", 0.0)
    params.w = value(transit_record, "argumentOfPeriastronDeg", 90.0)
    params.u = [0.3, 0.2]
    params.limb_dark = "quadratic"
    transit_flux = batman.TransitModel(params, phases).light_curve(params)

    rv_record = by_name["51 peg b"]
    rv_count = 240
    eccentricity = value(rv_record, "eccentricity", 0.0)
    omega = math.radians(value(rv_record, "argumentOfPeriastronDeg", 0.0))
    semi_amplitude = value(rv_record, "rvSemiAmplitudeMS")
    rv_samples = []
    for index in range(rv_count):
        phase = index / (rv_count - 1)
        anomaly = true_anomaly(phase, eccentricity)
        radial_velocity = semi_amplitude * (
            math.cos(anomaly + omega) + eccentricity * math.cos(omega)
        )
        rv_samples.append({"phase": phase, "value": radial_velocity})

    payload = {
        "version": VERSION,
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "batmanPackage": getattr(batman, "__version__", "2.5.3"),
        },
        "input": str(input_path),
        "inputSha256": sha256(input_path),
        "transit": {
            "systemId": transit_record["systemId"],
            "planetId": transit_record["planetId"],
            "document": {
                "periodDays": value(transit_record, "periodDays"),
                "radiusRatio": params.rp,
                "scaledSemiMajorAxis": params.a,
                "inclinationDeg": params.inc,
                "eccentricity": params.ecc,
                "argumentOfPeriastronDeg": params.w,
                "limbDarkening": params.u,
                "sampleCount": transit_count,
            },
            "samples": [
                {"phase": float(phase), "value": float(flux)}
                for phase, flux in zip(phases, transit_flux, strict=True)
            ],
            "rmsThresholdPpm": 50,
        },
        "radialVelocity": {
            "systemId": rv_record["systemId"],
            "planetId": rv_record["planetId"],
            "document": {
                "periodDays": value(rv_record, "periodDays"),
                "semiAmplitudeMS": semi_amplitude,
                "eccentricity": eccentricity,
                "argumentOfPeriastronDeg": math.degrees(omega),
                "systemicVelocityMS": 0,
                "sampleCount": rv_count,
            },
            "samples": rv_samples,
            "rmsThresholdMS": 0.1,
        },
        "boundary": "build-time-independent-fixtures-runtime-worker-never-writes-solar-nbody",
    }
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    report_path = Path("dist/science/observation-fixture-report-v2.json").resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps({
        "version": VERSION,
        "artifact": str(output_path),
        "sha256": sha256(output_path),
        "transitThresholdPpm": 50,
        "radialVelocityThresholdMS": 0.1,
        "independentReference": True,
    }, indent=2) + "\n", encoding="utf-8")
    print(output_path)


if __name__ == "__main__":
    main()


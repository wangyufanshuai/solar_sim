from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from scipy.optimize import brentq

VERSION = "v150-kerr-independent-fixtures-v5"


def radial_potential(r: float, a: float, energy: float, lz: float, q: float, mu2: float) -> float:
    delta = r * r - 2 * r + a * a
    p = energy * (r * r + a * a) - a * lz
    return p * p - delta * (mu2 * r * r + (lz - a * energy) ** 2 + q)


def polar_potential(theta: float, a: float, energy: float, lz: float, q: float, mu2: float) -> float:
    sin2 = max(1e-15, math.sin(theta) ** 2)
    cos2 = math.cos(theta) ** 2
    return q - cos2 * (a * a * (mu2 - energy * energy) + lz * lz / sin2)


def roots(function, start: float, end: float, segments: int = 20_000) -> list[float]:
    values: list[float] = []
    left = start
    left_value = function(left)
    for index in range(1, segments + 1):
        right = start + (end - start) * index / segments
        right_value = function(right)
        if left_value == 0:
            values.append(left)
        elif left_value * right_value < 0:
            root = brentq(function, left, right, xtol=1e-13)
            if not values or abs(root - values[-1]) > 1e-8:
                values.append(root)
        left, left_value = right, right_value
    return values


def fixture(kind: str, spin: float, energy: float, lz: float, carter_q: float, r: float, theta: float) -> dict:
    mu2 = 1.0 if kind == "timelike" else 0.0
    horizon = 1 + math.sqrt(1 - spin * spin)
    radial_roots = roots(lambda value: radial_potential(value, spin, energy, lz, carter_q, mu2), horizon + 1e-5, 80)
    polar_roots = roots(lambda value: polar_potential(value, spin, energy, lz, carter_q, mu2), 1e-4, math.pi - 1e-4, 8_000)
    return {
        "kind": kind,
        "spinA": spin,
        "energy": energy,
        "axialAngularMomentum": lz,
        "carterQ": carter_q,
        "state": {"r": r, "theta": theta},
        "radialPotential": radial_potential(r, spin, energy, lz, carter_q, mu2),
        "polarPotential": polar_potential(theta, spin, energy, lz, carter_q, mu2),
        "radialTurningPointsM": radial_roots,
        "polarTurningPointsRad": polar_roots,
        "outerHorizonRadiusM": horizon,
    }


def main() -> None:
    fixtures = [
        fixture("null", 0.72, 1.0, 2.1, 5.5, 14.0, 1.15),
        fixture("null", -0.45, 1.0, -3.6, 9.2, 18.0, 1.02),
        fixture("timelike", 0.6, 0.96, 3.1, 2.4, 12.0, 1.28),
        fixture("timelike", 0.0, 0.98, 3.7, 1.5, 10.0, 1.40),
    ]
    payload = {
        "version": VERSION,
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "coordinateSystem": "Boyer-Lindquist",
        "parameterization": "Mino parameter",
        "units": "G=c=M=1",
        "fixtures": fixtures,
        "analyticAnchors": {
            "schwarzschildHorizonRadiusM": 2.0,
            "schwarzschildPhotonSphereRadiusM": 3.0,
            "schwarzschildIscoRadiusM": 6.0,
            "weakField": [{"impactParameterM": impact, "deflectionRad": 4 / impact} for impact in (50.0, 100.0, 250.0)],
        },
        "provenance": [
            "Carter-separated radial and polar Kerr potentials",
            "SciPy brentq independent turning-point roots",
            "Schwarzschild analytic horizon, photon-sphere and ISCO anchors",
            "weak-field null deflection 4M/b",
        ],
        "boundary": "build-time-reference-only-runtime-typescript-test-particle-kernel",
    }
    output = Path("public/data/kerr-independent-fixtures-v5.json").resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    report = {
        "version": VERSION,
        "artifact": str(output),
        "sha256": digest,
        "fixtureCount": len(fixtures),
        "nonEquatorialNullCount": sum(item["kind"] == "null" for item in fixtures),
        "nonEquatorialTimelikeCount": sum(item["kind"] == "timelike" for item in fixtures),
        "turningPointFixtureCount": sum(bool(item["radialTurningPointsM"] or item["polarTurningPointsRad"]) for item in fixtures),
        "independentReference": True,
        "passed": len(fixtures) >= 4 and all(item["polarPotential"] >= 0 and item["radialPotential"] >= 0 for item in fixtures),
    }
    report_path = Path("dist/science/kerr-independent-fixture-report-v5.json").resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["passed"]:
        raise SystemExit("Kerr independent fixture gate failed")


if __name__ == "__main__":
    main()

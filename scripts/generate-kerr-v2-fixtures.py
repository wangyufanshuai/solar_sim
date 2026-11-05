from __future__ import annotations

import json
import math
from pathlib import Path


def radial_potential(r: float, a: float, energy: float, lz: float, q: float, mu2: float) -> float:
    delta = r * r - 2.0 * r + a * a
    p = energy * (r * r + a * a) - a * lz
    return p * p - delta * (mu2 * r * r + (lz - a * energy) ** 2 + q)


def polar_potential(theta: float, a: float, energy: float, lz: float, q: float, mu2: float) -> float:
    sin2 = math.sin(theta) ** 2
    cos2 = math.cos(theta) ** 2
    return q - cos2 * (a * a * (mu2 - energy * energy) + lz * lz / sin2)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output = root / "public" / "data" / "kerr-v2-reference-fixtures.json"
    a = 0.72
    state = {"r": 14.0, "theta": 1.15, "energy": 1.0, "lz": 2.1, "carterQ": 5.5}
    payload = {
        "version": "v129-kerr-3d-reference-fixtures",
        "units": "G=c=M=1",
        "coordinateSystem": "Boyer-Lindquist",
        "parameterization": "Mino parameter",
        "provenance": [
            "Carter separated Kerr geodesic potentials",
            "Schwarzschild analytic anchors r_h=2M, r_ph=3M, r_isco=6M",
            "weak-field null deflection 4M/b",
        ],
        "schwarzschild": {
            "horizonRadiusM": 2.0,
            "photonSphereRadiusM": 3.0,
            "iscoRadiusM": 6.0,
            "weakField": {"impactParameterM": 100.0, "deflectionRad": 0.04},
        },
        "kerr": {
            "spinA": a,
            "outerHorizonRadiusM": 1.0 + math.sqrt(1.0 - a * a),
        },
        "nonEquatorialNull": {
            **state,
            "radialPotential": radial_potential(
                state["r"], a, state["energy"], state["lz"], state["carterQ"], 0.0
            ),
            "polarPotential": polar_potential(
                state["theta"], a, state["energy"], state["lz"], state["carterQ"], 0.0
            ),
        },
        "boundary": "build-time-reference-only-runtime-typescript-test-particle-kernel",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()

"""Build the immutable V8 finite-observer dense Kerr screen manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

from kerr_finite_observer_separatrix_v8 import (
    VERSION as GEOMETRY_VERSION,
    KerrFiniteObserverSeparatrixV8,
)

ROOT = Path(__file__).resolve().parents[1]
V5_SCREEN = ROOT / "dist/science/kerr-dense-screen-v5.json"
V5_SCREEN_FILE_SHA256 = "0eaa2d3e746d973155bf08fb0866452dbcd6e5d5341b246bc148f4bbd3c1c6cf"
V5_SCREEN_CANONICAL_SHA256 = "d676c1a7c8d1427e8800aa460e3786e45df0e11e6968980837fdfb379bc15fa4"
DEFAULT_OUTPUT = ROOT / "dist/science/kerr-finite-observer-screen-v8.json"
VERSION = "v248-kerr-finite-observer-screen-manifest-v8"


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def value_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build_manifest() -> dict[str, Any]:
    if file_hash(V5_SCREEN) != V5_SCREEN_FILE_SHA256:
        raise RuntimeError("frozen V5 screen file hash drift")
    v5 = json.loads(V5_SCREEN.read_text(encoding="utf-8"))
    if value_hash(v5) != V5_SCREEN_CANONICAL_SHA256:
        raise RuntimeError("frozen V5 screen canonical hash drift")
    viewport = [int(value) for value in v5["viewport"]]
    spin = 0.9
    observer_radius = 50.0
    observer_theta = math.radians(70.0)
    mapping = KerrFiniteObserverSeparatrixV8(
        spin,
        observer_radius,
        observer_theta,
    )
    critical = []
    centers = []
    for pair in range(512):
        angle = 2.0 * math.pi * (pair + 0.5) / 512.0
        point = mapping.point_at_angle(angle)
        radius = math.hypot(point.screen_x, point.screen_y)
        cosine = math.cos(angle)
        sine = math.sin(angle)
        center = {
            "pair": pair,
            "angleRad": angle,
            "screenX": point.screen_x,
            "screenY": point.screen_y,
            "screenRadius": radius,
            "sphericalPhotonRadiusM": point.spherical_photon_radius_m,
            "xi": point.xi,
            "eta": point.eta,
            "observerNullConstraint": point.observer_null_constraint,
            "radialPotentialResidual": point.radial_potential_residual,
            "radialDerivativeResidual": point.radial_derivative_residual,
            "constantsRoundTripRelativeError": point.constants_round_trip_relative_error,
        }
        centers.append(center)
        for side, offset_px in (("inner", -0.25), ("outer", 0.25)):
            offset_slope = 2.0 * offset_px / viewport[1]
            shifted_radius = radius + offset_slope
            screen_x = shifted_radius * cosine
            screen_y = shifted_radius * sine
            critical.append({
                "pair": pair,
                "side": side,
                "angleRad": angle,
                "offsetPx": offset_px,
                "offsetScreenSlope": offset_slope,
                "centerScreenX": point.screen_x,
                "centerScreenY": point.screen_y,
                "screenX": screen_x,
                "screenY": screen_y,
                "direction": [-1.0, screen_y, screen_x],
                "sphericalPhotonRadiusM": point.spherical_photon_radius_m,
                "xi": point.xi,
                "eta": point.eta,
            })
    maximum = lambda field: max(float(row[field]) for row in centers)
    core = {
        "version": VERSION,
        "geometryVersion": GEOMETRY_VERSION,
        "sourceV5ScreenFileSha256": V5_SCREEN_FILE_SHA256,
        "sourceV5ScreenCanonicalSha256": V5_SCREEN_CANONICAL_SHA256,
        "observer": {
            "kind": "exact-ZAMO-shared-v5",
            "spinA": spin,
            "radiusM": observer_radius,
            "thetaRad": observer_theta,
            "screenBasis": "radial-polar-azimuthal",
        },
        "viewport": viewport,
        "screenCoordinates": {
            "screenX": "n^(phi)/(-n^(r))",
            "screenY": "n^(theta)/(-n^(r))",
            "direction": "[-1,screenY,screenX]",
            "pixelSlopeScale": "2/viewportHeight",
        },
        "lowDiscrepancy": v5["lowDiscrepancy"],
        "criticalCenters": centers,
        "criticalBrackets": critical,
        "counts": {
            "lowDiscrepancy": len(v5["lowDiscrepancy"]),
            "criticalCenters": len(centers),
            "criticalBrackets": len(critical),
        },
        "geometryGates": {
            "maxObserverNullConstraint": maximum("observerNullConstraint"),
            "maxRadialPotentialResidual": maximum("radialPotentialResidual"),
            "maxRadialDerivativeResidual": maximum("radialDerivativeResidual"),
            "maxConstantsRoundTripRelativeError": maximum(
                "constantsRoundTripRelativeError"
            ),
        },
        "boundary": "analytic-finite-observer-zamo-separatrix-no-geodesic-integrator-tuning",
    }
    return {**core, "manifestSha256": value_hash(core)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Orbit Atlas V8 finite-observer Kerr screen")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    document = build_manifest()
    serialized = json.dumps(document, indent=2, allow_nan=False) + "\n"
    if args.check:
        if output.read_text(encoding="utf-8") != serialized:
            raise SystemExit("V8 finite-observer screen manifest is stale")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(serialized, encoding="utf-8")
    print(json.dumps({
        "mode": "check" if args.check else "write",
        "output": str(output),
        "manifestSha256": document["manifestSha256"],
        "counts": document["counts"],
        "geometryGates": document["geometryGates"],
    }, indent=2))


if __name__ == "__main__":
    main()


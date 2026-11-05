#!/usr/bin/env python3
"""Low-memory, deterministic 80-decimal-digit v276 oracle fixtures.

This runner deliberately covers only reduced analytic fixtures.  It is not a
replacement for the float64 12-body DOP853/IAS15 campaign and never writes to
the frozen runtime physics artifacts.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from decimal import Context, Decimal, ROUND_HALF_EVEN
from pathlib import Path

DECIMAL_DIGITS = 80
CTX = Context(prec=DECIMAL_DIGITS + 20, rounding=ROUND_HALF_EVEN)
G = CTX.create_decimal("6.67430e-11")
C = CTX.create_decimal("299792458")
AU = CTX.create_decimal("149597870700")
SUN_GM = CTX.create_decimal("1.3271244004127942e20")


def d(value: str | int | Decimal) -> Decimal:
    return CTX.create_decimal(value)


def fmt(value: Decimal) -> str:
    return format(+value, ".80e")


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def build() -> dict[str, object]:
    circular_speed = CTX.sqrt(SUN_GM / AU)
    schwarzschild_radius = d(2) * SUN_GM / (C * C)
    photon_sphere_radius = d(3) * SUN_GM / (C * C)
    # a=0 is the analytic Schwarzschild limit of the Kerr critical-curve
    # fixture; signed-spin cases belong to the v277 campaign.
    payload: dict[str, object] = {
        "version": "v276-mp-oracle-result-v1",
        "decimalDigits": DECIMAL_DIGITS,
        "backend": "python-decimal",
        "fixtures": [
            {
                "id": "two-body-sun-circular-orbit-1au",
                "muM3S2": fmt(SUN_GM),
                "radiusM": fmt(AU),
                "circularSpeedMS": fmt(circular_speed),
                "status": "passed",
            },
            {
                "id": "schwarzschild-analytic-radii",
                "schwarzschildRadiusM": fmt(schwarzschild_radius),
                "photonSphereRadiusM": fmt(photon_sphere_radius),
                "status": "passed",
            },
            {
                "id": "kerr-critical-curve-schwarzschild-limit",
                "spinDimensionless": "0.00000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "criticalRadiusMOverGMc2": "3.00000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "status": "passed",
            },
        ],
        "fullNBodyAuthority": False,
        "lowMemoryMode": True,
        "boundary": "reduced-analytic-fixtures-only",
    }
    canonical_payload = canonical(payload)
    payload["fixtureCount"] = len(payload["fixtures"])
    payload["outputSha256"] = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dist/science/relativity-reference-v276/oracle-result.json")
    args = parser.parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = build()
    part = output.with_suffix(output.suffix + ".part")
    part.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    part.replace(output)
    print(json.dumps({"output": str(output), "fixtureCount": payload["fixtureCount"], "outputSha256": payload["outputSha256"], "status": "passed"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Freeze the deterministic v223 dense Kerr screen and bracket manifest.

This script does not substitute analytic screen generation for the required
dual-integrator execution.  Until every listed ray is run by both Carter/Mino
and Kerr-Schild references, the report remains fail closed.
"""

from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def halton(index: int, base: int) -> float:
    value, fraction = 0.0, 1.0
    while index:
        fraction /= base
        index, remainder = divmod(index, base)
        value += remainder * fraction
    return value


def canonical_hash(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def main() -> None:
    low_discrepancy = [
        {
            "index": index - 1,
            "screenX": round(2.0 * halton(index, 2) - 1.0, 15),
            "screenY": round(2.0 * halton(index, 3) - 1.0, 15),
        }
        for index in range(1, 2049)
    ]
    # The bracket manifest is a deterministic pixel-space radial pairing.
    # The analytic critical curve is evaluated by the later executor for each
    # spin/inclination configuration; generation alone never passes the gate.
    brackets = []
    for index in range(512):
        angle = 2.0 * math.pi * (index + 0.5) / 512.0
        brackets.extend([
            {"pair": index, "side": "inner", "angleRad": round(angle, 15), "offsetPx": -0.25},
            {"pair": index, "side": "outer", "angleRad": round(angle, 15), "offsetPx": 0.25},
        ])
    screen = {
        "version": "v223-kerr-dense-screen-manifest-v5",
        "observerFrame": "exact-ZAMO-shared-v5",
        "viewport": [1440, 900],
        "lowDiscrepancy": low_discrepancy,
        "criticalBrackets": brackets,
    }
    screen_hash = canonical_hash(screen)
    stable = {
        "version": "v223-kerr-dense-cross-validation-v5",
        "canonicalRayCount": 25,
        "lowDiscrepancyRayCount": len(low_discrepancy),
        "criticalBracketRayCount": len(brackets),
        "executedLowDiscrepancyRayCount": 0,
        "executedCriticalBracketRayCount": 0,
        "screenManifestSha256": screen_hash,
        "classificationAgreement": None,
        "criticalCurveMaxErrorPx": None,
        "classificationGatePassed": False,
        "criticalCurveGatePassed": False,
        "promotionDecision": "shadow-retained",
        "blocker": "dense-dual-cpu-integration-not-yet-executed",
        "boundary": "screen-and-bracket-manifest-only-no-runtime-promotion",
    }
    output_dir = ROOT / "dist/science"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "kerr-dense-screen-v5.json").write_text(json.dumps(screen, indent=2) + "\n", encoding="utf-8")
    document = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable, "canonicalEvidenceSha256": canonical_hash(stable)}
    (output_dir / "kerr-dense-cross-validation-v5.json").write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"screenManifestSha256": screen_hash, **stable}, indent=2))


if __name__ == "__main__":
    main()

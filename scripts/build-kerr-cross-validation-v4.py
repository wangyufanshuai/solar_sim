"""Cross-check Carter/Mino and Kerr-Schild CPU ray classifications.

The implementations remain independent.  This adapter only supplies the same
observer-screen directions and compares their emitted evidence.  A mismatch is
reported fail-closed; no browser or runtime Kerr state is modified.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CARTER = load_module("atlas_kerr_carter_v3", ROOT / "scripts/run-kerr-ray-reference-v3.py")


def canonical_hash(document: dict) -> str:
    stable = {key: value for key, value in document.items() if key not in {"generatedAt", "canonicalEvidenceSha256"}}
    return hashlib.sha256(
        json.dumps(stable, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    ).hexdigest()


def ray_class(status: str) -> str:
    return "captured" if status == "captured" else "not-captured"


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Kerr CPU cross validation V4")
    parser.add_argument("--kerr-schild", default="dist/science/kerr-schild-reference-v4.json")
    parser.add_argument("--output", default="dist/science/kerr-cross-validation-v4.json")
    parser.add_argument("--rtol", type=float, default=1e-12)
    parser.add_argument("--atol", type=float, default=1e-14)
    args = parser.parse_args()

    ks_path = (ROOT / args.kerr_schild).resolve()
    ks = json.loads(ks_path.read_text(encoding="utf-8"))
    observer = ks["observer"]
    spin = float(observer["spinA"])
    radius = float(observer["radiusM"])
    theta = float(observer["thetaRad"])

    comparisons = []
    carter_rays = []
    for index, ks_ray in enumerate(ks["rays"]):
        direction = np.asarray(ks_ray["direction"], dtype=float)
        inward = np.array([-math.sin(theta), 0.0, -math.cos(theta)])
        e_phi = np.array([0.0, 1.0, 0.0])
        e_theta = np.array([math.cos(theta), 0.0, -math.sin(theta)])
        local = np.array([
            float(np.dot(direction, -inward)),
            float(np.dot(direction, e_theta)),
            float(np.dot(direction, e_phi)),
        ])
        carter = CARTER.integrate_ray(spin, radius, theta, local, args.rtol, args.atol)
        carter_rays.append(carter)
        ks_class = ray_class(ks_ray["status"])
        carter_class = ray_class(carter["status"])
        comparisons.append({
            "rayIndex": index,
            "screenDirection": {
                "radial": float(local[0]),
                "polar": float(local[1]),
                "azimuthal": float(local[2]),
            },
            "kerrSchildStatus": ks_ray["status"],
            "carterStatus": carter["status"],
            "classificationAgreement": ks_class == carter_class,
            "kerrSchildNullConstraint": ks_ray["maxNullConstraint"],
            "carterNullConstraint": carter["nullConstraint"],
        })

    agreement_count = sum(row["classificationAgreement"] for row in comparisons)
    agreement = agreement_count / max(len(comparisons), 1)
    max_ks_null = max(float(row["maxNullConstraint"]) for row in ks["rays"])
    max_carter_null = max(float(row["nullConstraint"]) for row in carter_rays)
    stable = {
        "version": "v214-kerr-cpu-cross-validation-v4",
        "inputs": {
            "kerrSchildSha256": hashlib.sha256(ks_path.read_bytes()).hexdigest(),
            "kerrSchildCanonicalEvidenceSha256": ks["canonicalEvidenceSha256"],
            "carterImplementation": "scripts/run-kerr-ray-reference-v3.py",
        },
        "observer": observer,
        "rayCount": len(comparisons),
        "classificationAgreementCount": agreement_count,
        "classificationAgreement": agreement,
        "maxKerrSchildNullConstraint": max_ks_null,
        "maxCarterNullConstraint": max_carter_null,
        "gates": {
            "classificationAgreementAtLeast999": agreement >= 0.999,
            "kerrSchildNullBelow1e10": max_ks_null < 1e-10,
            "carterNullBelow1e10": max_carter_null < 1e-10,
            "redshiftCrossValidated": False,
            "polarizationCrossValidated": False,
        },
        "comparisons": comparisons,
        "promotionDecision": "shadow-retained",
        "liveStateMutated": False,
        "boundary": "offline-cpu-cross-check-no-runtime-promotion-no-grmhd-claim",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = canonical_hash(report)
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(output),
        "rayCount": len(comparisons),
        "classificationAgreement": agreement,
        "gates": report["gates"],
        "canonicalEvidenceSha256": report["canonicalEvidenceSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()

"""V5 cross-check for the shared-ZAMO Carter and analytic Kerr-Schild references."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
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


CARTER = load_module("atlas_kerr_carter_shared_zamo_v5", ROOT / "scripts/run-kerr-ray-reference-v3.py")


def canonical_hash(document: dict) -> str:
    stable = {key: value for key, value in document.items() if key not in {"generatedAt", "canonicalEvidenceSha256"}}
    return hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def ray_class(status: str) -> str:
    return "captured" if status == "captured" else "not-captured"


def relative_error(left: float, right: float) -> float:
    return abs(left - right) / max(1.0, abs(left), abs(right))


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Kerr CPU shared-ZAMO cross validation V5")
    parser.add_argument("--kerr-schild", default="dist/science/kerr-schild-reference-v5-fine.json")
    parser.add_argument("--output", default="dist/science/kerr-cross-validation-v5.json")
    parser.add_argument("--radiative", default="dist/science/kerr-radiative-transfer-v5-fine.json")
    parser.add_argument("--radiative-determinism", default="dist/science/kerr-radiative-transfer-v5-determinism.json")
    parser.add_argument("--rtol", type=float, default=1e-12)
    parser.add_argument("--atol", type=float, default=1e-14)
    args = parser.parse_args()
    ks_path = (ROOT / args.kerr_schild).resolve()
    ks = json.loads(ks_path.read_text(encoding="utf-8"))
    radiative_path = (ROOT / args.radiative).resolve()
    radiative_determinism_path = (ROOT / args.radiative_determinism).resolve()
    radiative = json.loads(radiative_path.read_text(encoding="utf-8"))
    radiative_determinism = json.loads(radiative_determinism_path.read_text(encoding="utf-8"))
    radiative_redshift = (
        radiative["gates"]["atLeast256StratifiedRays"]
        and radiative["gates"]["allEmissionSamplesFutureDirected"]
        and radiative["gates"]["redshiftInternalBelow001"]
        and radiative["gates"]["intensityInvariantPassed"]
    )
    radiative_polarization = (
        radiative["gates"]["polarizationCoverageAtLeast256"]
        and radiative["gates"]["polarizationInternalBelow01Deg"]
        and radiative_determinism["passed"]
    )
    observer = ks["observer"]
    spin = float(observer["spinA"])
    radius = float(observer["radiusM"])
    theta = float(observer["thetaRad"])
    comparisons = []
    carter_rays = []
    for index, ks_ray in enumerate(ks["rays"]):
        direction = np.asarray(ks_ray.get("screenDirection", ks_ray["direction"]), dtype=float)
        carter = CARTER.integrate_ray(spin, radius, theta, direction, args.rtol, args.atol)
        carter_rays.append(carter)
        ks_constants = ks_ray["constants"]
        carter_constants = carter["constants"]
        comparisons.append({
            "rayIndex": index,
            "screenDirection": direction.tolist(),
            "kerrSchildStatus": ks_ray["status"],
            "carterStatus": carter["status"],
            "classificationAgreement": ray_class(ks_ray["status"]) == ray_class(carter["status"]),
            "kerrSchildNullConstraint": ks_ray["maxNullConstraint"],
            "carterNullConstraint": carter["nullConstraint"],
            "observerConstantRelativeErrors": {
                "energy": relative_error(ks_constants["energy"], carter_constants["energy"]),
                "axialAngularMomentum": relative_error(ks_constants["axialAngularMomentum"], carter_constants["axialAngularMomentum"]),
                "carterQ": relative_error(ks_constants["carterQ"], carter_constants["carterQ"]),
            },
        })
    agreement_count = sum(row["classificationAgreement"] for row in comparisons)
    agreement = agreement_count / max(1, len(comparisons))
    max_observer_error = max(
        value for row in comparisons for value in row["observerConstantRelativeErrors"].values()
    )
    stable = {
        "version": "v221-kerr-cpu-shared-zamo-cross-validation-v5",
        "inputs": {
            "kerrSchildSha256": hashlib.sha256(ks_path.read_bytes()).hexdigest(),
            "kerrSchildCanonicalEvidenceSha256": ks["canonicalEvidenceSha256"],
            "carterImplementation": "scripts/run-kerr-ray-reference-v3.py",
            "observerFrame": "scripts/kerr_observer_frame_v5.py",
            "radiativeSha256": hashlib.sha256(radiative_path.read_bytes()).hexdigest(),
            "radiativeDeterminismSha256": hashlib.sha256(radiative_determinism_path.read_bytes()).hexdigest(),
        },
        "observer": observer,
        "rayCount": len(comparisons),
        "classificationAgreementCount": agreement_count,
        "classificationAgreement": agreement,
        "maxObserverConstantRelativeError": max_observer_error,
        "maxKerrSchildNullConstraint": max(float(ray["maxNullConstraint"]) for ray in ks["rays"]),
        "maxCarterNullConstraint": max(float(ray["nullConstraint"]) for ray in carter_rays),
        "gates": {
            "sharedObserverConstantsBelow1e12": max_observer_error < 1e-12,
            "classificationAgreementAtLeast999": agreement >= 0.999,
            "kerrSchildNullBelow1e10": max(float(ray["maxNullConstraint"]) for ray in ks["rays"]) < 1e-10,
            "carterNullBelow1e10": max(float(ray["nullConstraint"]) for ray in carter_rays) < 1e-10,
            "redshiftCrossValidated": radiative_redshift,
            "polarizationCrossValidated": radiative_polarization,
        },
        "comparisons": comparisons,
        "promotionDecision": "shadow-retained",
        "liveStateMutated": False,
        "boundary": "offline-shared-observer-cpu-cross-check-no-runtime-promotion-no-grmhd-claim",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = canonical_hash(report)
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "rayCount": len(comparisons), "classificationAgreement": agreement,
                      "maxObserverConstantRelativeError": max_observer_error, "gates": report["gates"],
                      "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

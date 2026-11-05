"""100-year weak-field diagnostic; explicitly excluded from promotion gates."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODES = (
    "newton", "legacy-eih-1pn", "full-eih-1pn", "full-eih-1pn-j2",
    "full-eih-1pn-2pn", "full-eih-1pn-2pn-lt",
)


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DOP = load_module("atlas_relativity_reference_v9", ROOT / "scripts/run-relativity-reference-v9.py")


def fixture_state(row, ids):
    source = {body["id"]: body for body in row["bodies"]}
    positions = np.array([[source[body_id][axis] for axis in ("x_au", "y_au", "z_au")] for body_id in ids]) * DOP.AU_M
    velocities = np.array([[source[body_id][axis] for axis in ("vx_au_d", "vy_au_d", "vz_au_d")] for body_id in ids]) * DOP.AU_M / DOP.DAY_S
    return DOP.state_vector(positions, velocities)


def bundle_state(row, ids):
    source = {body["id"]: body for body in row["bodies"]}
    positions = np.array([source[body_id]["positionAu"] for body_id in ids]) * DOP.AU_M
    velocities = np.array([source[body_id]["velocityAuDay"] for body_id in ids]) * DOP.AU_M / DOP.DAY_S
    return DOP.state_vector(positions, velocities)


def invariants(state, masses):
    positions, velocities = DOP.unpack(state, len(masses))
    kinetic = 0.5 * np.sum(masses[:, None] * velocities * velocities)
    potential = 0.0
    for i in range(len(masses)):
        for j in range(i + 1, len(masses)):
            potential -= DOP.G * masses[i] * masses[j] / np.linalg.norm(positions[j] - positions[i])
    angular = np.sum(np.cross(positions, masses[:, None] * velocities), axis=0)
    return float(kinetic + potential), float(np.linalg.norm(angular))


def residual(state, reference, count):
    positions, velocities = DOP.unpack(state, count)
    ref_positions, ref_velocities = DOP.unpack(reference, count)
    dp = (positions - positions[0]) - (ref_positions - ref_positions[0])
    dv = (velocities - velocities[0]) - (ref_velocities - ref_velocities[0])
    return {
        "positionRmsKm": float(np.sqrt(np.mean(np.sum(dp * dp, axis=1))) / 1000.0),
        "velocityRmsMS": float(np.sqrt(np.mean(np.sum(dv * dv, axis=1)))),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", default="dist/science/relativity-reference-fixture-v9.json")
    parser.add_argument("--bundle", default="dist/science/relativity-reference-bundle-v10.json")
    parser.add_argument("--output", default="dist/science/relativity-100y-diagnostic-v10.json")
    parser.add_argument("--rtol", type=float, default=1e-10)
    parser.add_argument("--atol", type=float, default=1e-12)
    parser.add_argument("--max-step-days", type=float, default=4.0)
    args = parser.parse_args()
    fixture_path, bundle_path = ROOT / args.fixture, ROOT / args.bundle
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
    ids = fixture["bodyIds"]
    initial = fixture_state(fixture["checkpoints"][0], ids)
    references = {
        row["source"]: bundle_state(row, ids)
        for row in bundle["epochs"] if row["offsetDays"] == 36525.0
    }
    if set(references) != {"de440-naif", "horizons-frozen"}:
        raise SystemExit("100-year diagnostic requires both reference sources")
    masses = np.array([DOP.GM[body_id] / DOP.G for body_id in ids])
    initial_energy, initial_angular = invariants(initial, masses)
    rows = []
    for mode in MODES:
        states, evaluations = DOP.integrate_mode(initial, masses, mode, [36525.0], args.rtol, args.atol, args.max_step_days)
        final = states[0]
        final_energy, final_angular = invariants(final, masses)
        reverse, reverse_evaluations = DOP.integrate_mode(final, masses, mode, [-36525.0], args.rtol, args.atol, args.max_step_days)
        delta = reverse[0] - initial
        positions, velocities = DOP.unpack(delta, len(ids))
        rows.append({
            "mode": mode, "functionEvaluations": evaluations,
            "reverseFunctionEvaluations": reverse_evaluations,
            "references": {source: residual(final, state, len(ids)) for source, state in references.items()},
            "newtonianDiagnosticEnergyRelativeDrift": abs((final_energy - initial_energy) / initial_energy),
            "angularMomentumRelativeDrift": abs((final_angular - initial_angular) / initial_angular),
            "timeReversalPositionRmsKm": float(np.sqrt(np.mean(np.sum(positions * positions, axis=1))) / 1000.0),
            "timeReversalVelocityRmsMS": float(np.sqrt(np.mean(np.sum(velocities * velocities, axis=1)))),
        })
    stable = {
        "version": "v212-relativity-100y-diagnostic-v10",
        "fixtureSha256": hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
        "bundleSha256": hashlib.sha256(bundle_path.read_bytes()).hexdigest(),
        "durationDays": 36525.0, "qualificationGate": False, "modes": rows,
        "defaultKernel": "legacy-eih-1pn", "promotionDecision": "shadow-retained",
        "boundary": "100-year-diagnostic-only-not-a-promotion-gate",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    output = (ROOT / args.output).resolve()
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "modeCount": len(rows), "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

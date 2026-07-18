"""Fail-closed 16-ray gate for the V8 finite-observer Kerr campaign."""

from __future__ import annotations

import argparse
import importlib.util
import json
import math
import multiprocessing as mp
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).resolve()
RUNNER_PATH = ROOT / "scripts/run-kerr-dense-shards-v8.py"
RADIATIVE_PATH = ROOT / "dist/science/kerr-radiative-transfer-v5-fine.json"
DEFAULT_OUTPUT = ROOT / "dist/science/kerr-dense-gate-v8.json"
VERSION = "v248-kerr-finite-observer-short-gate-v8"
CANONICAL_INDICES = (0, 12, 24)
LOW_DISCREPANCY_INDICES = (0, 1023, 2047)
CRITICAL_PAIRS = (0, 128, 256, 384, 511)


def load_runner():
    name = "atlas_kerr_dense_finite_observer_v8"
    spec = importlib.util.spec_from_file_location(name, RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {RUNNER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RUNNER = load_runner()


def atomic_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def selected_rays(plan: dict[str, Any]) -> list[dict[str, Any]]:
    ids = {
        *(f"canonical-{index:04d}" for index in CANONICAL_INDICES),
        *(f"low-discrepancy-{index:04d}" for index in LOW_DISCREPANCY_INDICES),
    }
    rows = [ray for ray in plan["rays"] if ray["id"] in ids]
    rows.extend(
        ray for ray in plan["rays"]
        if ray["rayClass"] == "critical-bracket"
        and int(ray["source"]["pair"]) in CRITICAL_PAIRS
    )
    if len(rows) != 16:
        raise RuntimeError(f"V8 gate selection drifted: {len(rows)}")
    return rows


def radiative_evidence() -> dict[str, Any]:
    value = json.loads(RADIATIVE_PATH.read_text(encoding="utf-8"))
    stable = {
        "sourceSha256": RUNNER.file_hash(RADIATIVE_PATH),
        "canonicalEvidenceSha256": value.get("canonicalEvidenceSha256"),
        "algebraicRayCount": int(value.get("algebraicRayCount", 0)),
        "polarizationRayCount": int(value.get("polarizationRayCount", 0)),
        "maxRedshiftRelativeError": float(value["maxRedshiftRelativeError"]),
        "maxEvpaErrorDeg": float(value["maxEvpaErrorDeg"]),
    }
    stable["passed"] = (
        stable["algebraicRayCount"] >= 256
        and stable["polarizationRayCount"] >= 256
        and stable["maxRedshiftRelativeError"] < 0.005
        and stable["maxEvpaErrorDeg"] < 0.5
    )
    return stable


def evaluate(rows: list[dict[str, Any]], plan: dict[str, Any], radiative: dict[str, Any]) -> dict[str, Any]:
    invalid = []
    non_physical = []
    deterministic = []
    constraints = []
    for ray in rows:
        lookup = {(row["solver"], row["tolerance"], row["run"]): row for row in ray["executions"]}
        for execution in ray["executions"]:
            if execution["status"] in {"invalid", "watchdog-timeout"}:
                invalid.append({"rayId": ray["id"], **execution})
            if execution["status"] not in RUNNER.PHYSICAL_STATUSES:
                non_physical.append({"rayId": ray["id"], **execution})
            if execution["maxNullConstraint"] is not None:
                constraints.append(float(execution["maxNullConstraint"]))
        for solver in plan["solvers"]:
            for tolerance in ("fine", "finer"):
                if lookup[(solver, tolerance, "A")]["outputSha256"] != lookup[(solver, tolerance, "B")]["outputSha256"]:
                    deterministic.append({"rayId": ray["id"], "solver": solver, "tolerance": tolerance})
    critical = RUNNER.critical_metrics(rows, plan["solvers"])
    max_null = max(constraints) if constraints else None
    gate = bool(
        not invalid
        and not non_physical
        and not deterministic
        and critical["pairCount"] == 5
        and critical["transitionCount"] == 40
        and critical["transitionExpected"] == 40
        and max_null is not None
        and max_null < 1e-10
        and radiative["passed"]
    )
    return {
        "executionCount": sum(len(ray["executions"]) for ray in rows),
        "invalidCount": len(invalid),
        "nonPhysicalCount": len(non_physical),
        "deterministicFailureCount": len(deterministic),
        "criticalPairCount": critical["pairCount"],
        "criticalTransitionCount": critical["transitionCount"],
        "criticalTransitionExpected": critical["transitionExpected"],
        "criticalCurveMaxErrorPx": critical["maxErrorPx"],
        "maxNullConstraint": max_null,
        "radiativeEvidencePassed": radiative["passed"],
        "gatePassed": gate,
        "failures": {"invalid": invalid, "nonPhysical": non_physical, "determinism": deterministic},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas V8 finite-observer Kerr short gate")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--watchdog-seconds", type=int, default=180)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    plan = RUNNER.build_plan(SimpleNamespace(profile="release", watchdog_seconds=args.watchdog_seconds))
    rays = selected_rays(plan)
    radiative = radiative_evidence()
    provenance = {
        "finiteObserverScreenManifestSha256": plan["finiteObserverScreenManifestSha256"],
        "finiteObserverScreenFileSha256": plan["finiteObserverScreenFileSha256"],
        "codeSha256": plan["codeSha256"],
        "environmentSha256": plan["environmentSha256"],
        "planInputSha256": plan["inputSha256"],
        "gateCodeSha256": RUNNER.file_hash(SCRIPT),
    }
    input_sha = RUNNER.value_hash({"version": VERSION, "provenance": provenance, "rays": rays, "radiative": radiative})
    if args.plan_only:
        print(json.dumps({
            "version": VERSION,
            "selectedRayCount": len(rays),
            "executionCount": len(rays) * 8,
            "selectedRayIds": [ray["id"] for ray in rays],
            "provenance": provenance,
            "gateInputSha256": input_sha,
            "radiativeEvidence": radiative,
        }, indent=2))
        return
    rows = []
    for position, ray in enumerate(rays, 1):
        rows.append(RUNNER.execute_ray(ray, plan, "release", args.watchdog_seconds))
        print(f"V8 Kerr gate: {position}/{len(rays)} {ray['id']}", flush=True)
    evaluation = evaluate(rows, plan, radiative)
    stable = {
        "version": VERSION,
        "profile": "gate-isolated-from-v8-release-shards",
        "gatePassed": evaluation["gatePassed"],
        "gateInputSha256": input_sha,
        "provenance": provenance,
        "selectedRayCount": len(rows),
        "selectedRayIds": [ray["id"] for ray in rows],
        "radiativeEvidence": radiative,
        "evaluation": evaluation,
        "rays": rows,
        "releaseShardCoverageContribution": 0,
        "promotionDecision": "shadow-retained",
        "boundary": "offline-finite-observer-short-gate-no-release-shard-no-runtime-promotion",
    }
    stable["canonicalEvidenceSha256"] = RUNNER.value_hash(stable)
    output = args.output if args.output.is_absolute() else ROOT / args.output
    atomic_json(output, {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable})
    print(json.dumps({
        "output": str(output),
        "gatePassed": evaluation["gatePassed"],
        "executionCount": evaluation["executionCount"],
        "maxNullConstraint": evaluation["maxNullConstraint"],
        "criticalTransitions": f"{evaluation['criticalTransitionCount']}/{evaluation['criticalTransitionExpected']}",
        "canonicalEvidenceSha256": stable["canonicalEvidenceSha256"],
    }, indent=2))
    if not evaluation["gatePassed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    mp.freeze_support()
    main()


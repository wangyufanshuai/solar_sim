"""Fail-closed 16-ray Kerr science gate for the v241-v248 campaign.

This wrapper deliberately does not modify or publish release shards. It derives
the exact release plan from run-kerr-dense-shards-v6.py, selects the frozen
representative rays, executes every solver/tolerance/rerun combination behind
an independent watchdog, and writes a separate diagnostic manifest.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import multiprocessing as mp
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).resolve()
RELEASE_RUNNER_PATH = ROOT / "scripts/run-kerr-dense-shards-v6.py"
RELEASE_PLAN_PATH = ROOT / "dist/science/kerr-dense-execution-plan-v6-release.json"
RADIATIVE_PATH = ROOT / "dist/science/kerr-radiative-transfer-v5-fine.json"
DEFAULT_OUTPUT = ROOT / "dist/science/kerr-dense-gate-v7.json"
VERSION = "v242-kerr-dense-short-gate-v7"
PHYSICAL_STATUSES = {"captured", "escaped"}
CANONICAL_INDICES = (0, 12, 24)
LOW_DISCREPANCY_INDICES = (0, 1023, 2047)
CRITICAL_PAIRS = (0, 128, 256, 384, 511)


def load_runner():
    name = "atlas_kerr_dense_release_v6"
    spec = importlib.util.spec_from_file_location(name, RELEASE_RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {RELEASE_RUNNER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RUNNER = load_runner()


def atomic_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(
        json.dumps(document, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, path)


def selected_rays(plan: dict[str, Any]) -> list[dict[str, Any]]:
    wanted_ids = {
        *(f"canonical-{index:04d}" for index in CANONICAL_INDICES),
        *(f"low-discrepancy-{index:04d}" for index in LOW_DISCREPANCY_INDICES),
    }
    selected = [ray for ray in plan["rays"] if ray["id"] in wanted_ids]
    selected.extend(
        ray
        for ray in plan["rays"]
        if ray["rayClass"] == "critical-bracket"
        and int(ray["source"]["pair"]) in CRITICAL_PAIRS
    )
    if len(selected) != 16:
        raise RuntimeError(f"representative ray selection drifted: expected 16, found {len(selected)}")
    if sum(ray["rayClass"] == "canonical" for ray in selected) != 3:
        raise RuntimeError("canonical gate selection drifted")
    if sum(ray["rayClass"] == "low-discrepancy" for ray in selected) != 3:
        raise RuntimeError("low-discrepancy gate selection drifted")
    critical = [ray for ray in selected if ray["rayClass"] == "critical-bracket"]
    for pair in CRITICAL_PAIRS:
        sides = {
            str(ray["source"]["side"])
            for ray in critical
            if int(ray["source"]["pair"]) == pair
        }
        if sides != {"inner", "outer"}:
            raise RuntimeError(f"critical gate pair {pair} does not contain inner and outer rays")
    return selected


def gate_child_entry(payload: dict[str, Any], queue) -> None:
    try:
        task = RUNNER.ExecutionTask(**payload)
        queue.put({"ok": True, "result": RUNNER.execute_task(task)})
    except BaseException as error:  # process boundary must serialize every failure
        queue.put({"ok": False, "error": f"{type(error).__name__}: {error}"})


def execute_with_watchdog(payload: dict[str, Any], seconds: int) -> dict[str, Any]:
    context = mp.get_context("spawn")
    queue = context.Queue(maxsize=1)
    process = context.Process(target=gate_child_entry, args=(payload, queue))
    process.start()
    process.join(seconds)
    if process.is_alive():
        process.terminate()
        process.join(10)
        return {
            "solver": payload["solver"],
            "tolerance": payload["tolerance"],
            "run": payload["run"],
            "status": "watchdog-timeout",
            "maxNullConstraint": None,
            "functionEvaluations": 0,
            "terminal": None,
            "outputSha256": RUNNER.value_hash({"payload": payload, "status": "watchdog-timeout"}),
        }
    if queue.empty():
        return {
            "solver": payload["solver"],
            "tolerance": payload["tolerance"],
            "run": payload["run"],
            "status": "invalid",
            "maxNullConstraint": None,
            "functionEvaluations": 0,
            "terminal": None,
            "outputSha256": RUNNER.value_hash({"payload": payload, "status": "invalid"}),
        }
    message = queue.get()
    if not message["ok"]:
        return {
            "solver": payload["solver"],
            "tolerance": payload["tolerance"],
            "run": payload["run"],
            "status": "invalid",
            "maxNullConstraint": None,
            "functionEvaluations": 0,
            "terminal": None,
            "error": message["error"],
            "outputSha256": RUNNER.value_hash({"payload": payload, "error": message["error"]}),
        }
    return message["result"]


def load_and_validate_release_plan(plan: dict[str, Any]) -> dict[str, Any]:
    frozen = json.loads(RELEASE_PLAN_PATH.read_text(encoding="utf-8"))
    fields = (
        "version",
        "profile",
        "frozenScreenManifestSha256",
        "codeSha256",
        "environmentSha256",
        "inputSha256",
        "shardCount",
    )
    drift = {
        field: {"frozen": frozen.get(field), "current": plan.get(field)}
        for field in fields
        if frozen.get(field) != plan.get(field)
    }
    if drift:
        raise RuntimeError(f"release plan provenance drift: {json.dumps(drift, sort_keys=True)}")
    return {field: plan[field] for field in fields}


def validate_radiative_evidence() -> dict[str, Any]:
    evidence = json.loads(RADIATIVE_PATH.read_text(encoding="utf-8"))
    redshift = float(evidence["maxRedshiftRelativeError"])
    evpa = float(evidence["maxEvpaErrorDeg"])
    algebraic_count = int(evidence.get("algebraicRayCount", 0))
    polarization_count = int(evidence.get("polarizationRayCount", 0))
    passed = (
        algebraic_count >= 256
        and polarization_count >= 256
        and redshift < 0.005
        and evpa < 0.5
    )
    return {
        "source": str(RADIATIVE_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sourceSha256": RUNNER.file_hash(RADIATIVE_PATH),
        "canonicalEvidenceSha256": evidence.get("canonicalEvidenceSha256"),
        "algebraicRayCount": algebraic_count,
        "polarizationRayCount": polarization_count,
        "maxRedshiftRelativeError": redshift,
        "maxEvpaErrorDeg": evpa,
        "passed": passed,
    }


def evaluate(rows: list[dict[str, Any]], radiative: dict[str, Any]) -> dict[str, Any]:
    invalid = []
    non_physical = []
    deterministic_failures = []
    constraints = []
    for ray in rows:
        lookup = {
            (execution["solver"], execution["tolerance"], execution["run"]): execution
            for execution in ray["executions"]
        }
        for execution in ray["executions"]:
            if execution["status"] in {"invalid", "watchdog-timeout"}:
                invalid.append({"rayId": ray["id"], **execution})
            if execution["status"] not in PHYSICAL_STATUSES:
                non_physical.append({"rayId": ray["id"], **execution})
            if execution.get("maxNullConstraint") is not None:
                constraints.append(float(execution["maxNullConstraint"]))
        for solver in ("carter-mino-dop853", "kerr-schild-hamiltonian-dop853"):
            for tolerance in ("fine", "finer"):
                a = lookup[(solver, tolerance, "A")]
                b = lookup[(solver, tolerance, "B")]
                if a["outputSha256"] != b["outputSha256"]:
                    deterministic_failures.append({
                        "rayId": ray["id"],
                        "solver": solver,
                        "tolerance": tolerance,
                        "a": a["outputSha256"],
                        "b": b["outputSha256"],
                    })

    transitions = []
    for pair in CRITICAL_PAIRS:
        pair_rows = {
            str(ray["source"]["side"]): ray
            for ray in rows
            if ray["rayClass"] == "critical-bracket"
            and int(ray["source"]["pair"]) == pair
        }
        for solver in ("carter-mino-dop853", "kerr-schild-hamiltonian-dop853"):
            for tolerance in ("fine", "finer"):
                for run in ("A", "B"):
                    def status(side: str) -> str:
                        return next(
                            item["status"]
                            for item in pair_rows[side]["executions"]
                            if item["solver"] == solver
                            and item["tolerance"] == tolerance
                            and item["run"] == run
                        )
                    inner_status = status("inner")
                    outer_status = status("outer")
                    transitions.append({
                        "pair": pair,
                        "solver": solver,
                        "tolerance": tolerance,
                        "run": run,
                        "inner": inner_status,
                        "outer": outer_status,
                        "passed": inner_status == "captured" and outer_status == "escaped",
                    })

    max_null = max(constraints) if constraints else None
    return {
        "executionCount": sum(len(ray["executions"]) for ray in rows),
        "invalidCount": len(invalid),
        "nonPhysicalCount": len(non_physical),
        "deterministicFailureCount": len(deterministic_failures),
        "criticalTransitionCount": sum(item["passed"] for item in transitions),
        "criticalTransitionExpected": len(transitions),
        "maxNullConstraint": max_null,
        "radiativeEvidencePassed": radiative["passed"],
        "gatePassed": bool(
            not invalid
            and not non_physical
            and not deterministic_failures
            and transitions
            and all(item["passed"] for item in transitions)
            and max_null is not None
            and max_null < 1e-10
            and radiative["passed"]
        ),
        "failures": {
            "invalid": invalid,
            "nonPhysical": non_physical,
            "determinism": deterministic_failures,
            "criticalTransitions": [item for item in transitions if not item["passed"]],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v242 16-ray Kerr short gate")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--watchdog-seconds", type=int, default=180)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    plan = RUNNER.build_plan(SimpleNamespace(profile="release", watchdog_seconds=args.watchdog_seconds))
    provenance = load_and_validate_release_plan(plan)
    rays = selected_rays(plan)
    radiative = validate_radiative_evidence()
    gate_code_sha = RUNNER.file_hash(SCRIPT)
    gate_input_sha = RUNNER.value_hash({
        "version": VERSION,
        "releaseProvenance": provenance,
        "gateCodeSha256": gate_code_sha,
        "rays": rays,
        "radiativeSourceSha256": radiative["sourceSha256"],
    })

    if args.plan_only:
        print(json.dumps({
            "version": VERSION,
            "rayCount": len(rays),
            "executionCount": len(rays) * 8,
            "rayIds": [ray["id"] for ray in rays],
            "releaseProvenance": provenance,
            "gateCodeSha256": gate_code_sha,
            "gateInputSha256": gate_input_sha,
            "radiativeEvidence": radiative,
        }, indent=2))
        return

    rows = []
    for position, ray in enumerate(rays, 1):
        executions = []
        for solver in plan["solvers"]:
            for tolerance in ("fine", "finer"):
                for run in ("A", "B"):
                    payload = {
                        "solver": solver,
                        "tolerance": tolerance,
                        "run": run,
                        "ray": ray,
                        "observer": plan["observer"],
                        "settings": plan["tolerances"][tolerance],
                        "profile": "release",
                    }
                    executions.append(execute_with_watchdog(payload, args.watchdog_seconds))
        rows.append({
            "id": ray["id"],
            "rayClass": ray["rayClass"],
            "direction": ray["direction"],
            "source": ray["source"],
            "executions": executions,
        })
        print(f"kerr gate: {position}/{len(rays)} {ray['id']}", flush=True)

    evaluation = evaluate(rows, radiative)
    stable = {
        "version": VERSION,
        "profile": "gate-isolated-from-release-shards",
        "releaseProvenance": provenance,
        "gateCodeSha256": gate_code_sha,
        "gateInputSha256": gate_input_sha,
        "selectedRayCount": len(rows),
        "selectedRayIds": [ray["id"] for ray in rows],
        "radiativeEvidence": radiative,
        "evaluation": evaluation,
        "rays": rows,
        "releaseShardCoverageContribution": 0,
        "promotionDecision": "shadow-retained",
        "boundary": "offline-short-gate-no-release-shard-no-runtime-promotion",
    }
    stable["canonicalEvidenceSha256"] = RUNNER.value_hash(stable)
    document = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    output = args.output if args.output.is_absolute() else ROOT / args.output
    atomic_json(output, document)
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


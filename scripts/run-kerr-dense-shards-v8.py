"""Resumable dense Kerr campaign using the exact finite-observer V8 screen."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import multiprocessing as mp
import os
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import scipy

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).resolve()
SCREEN_PATH = ROOT / "dist/science/kerr-finite-observer-screen-v8.json"
V6_RUNNER_PATH = ROOT / "scripts/run-kerr-dense-shards-v6.py"
GEOMETRY_PATH = ROOT / "scripts/kerr_finite_observer_separatrix_v8.py"
SCREEN_BUILDER_PATH = ROOT / "scripts/build-kerr-finite-observer-screen-v8.py"
KS_PATH = ROOT / "scripts/run-kerr-schild-reference-v5.py"
CARTER_PATH = ROOT / "scripts/run-kerr-carter-mino-reference-v6.py"
OBSERVER_PATH = ROOT / "scripts/kerr_observer_frame_v5.py"
VERSION = "v248-kerr-dense-finite-observer-sharded-v8"
SHARD_SIZE = 64
EXECUTIONS_PER_RAY = 8
PHYSICAL_STATUSES = {"captured", "escaped"}


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


V6 = load_module("atlas_kerr_dense_v6_executor_compat", V6_RUNNER_PATH)


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def value_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def frozen_screen() -> tuple[dict[str, Any], str]:
    screen = json.loads(SCREEN_PATH.read_text(encoding="utf-8"))
    if screen.get("version") != "v248-kerr-finite-observer-screen-manifest-v8":
        raise RuntimeError("unexpected V8 finite-observer screen identity")
    stable = {key: value for key, value in screen.items() if key != "manifestSha256"}
    if value_hash(stable) != screen.get("manifestSha256"):
        raise RuntimeError("V8 finite-observer screen manifest hash drift")
    if screen.get("counts") != {
        "lowDiscrepancy": 2048,
        "criticalCenters": 512,
        "criticalBrackets": 1024,
    }:
        raise RuntimeError("V8 finite-observer screen counts drifted")
    geometry = screen.get("geometryGates", {})
    if any(float(geometry.get(field, math.inf)) >= 1e-12 for field in (
        "maxObserverNullConstraint",
        "maxRadialPotentialResidual",
        "maxRadialDerivativeResidual",
        "maxConstantsRoundTripRelativeError",
    )):
        raise RuntimeError("V8 finite-observer analytic geometry gate failed")
    return screen, str(screen["manifestSha256"])


def build_rays(screen: dict[str, Any]) -> list[dict[str, Any]]:
    rays = []
    for index, horizontal in enumerate(np.linspace(-0.18, 0.18, 5)):
        for vertical_index, vertical in enumerate(np.linspace(-0.18, 0.18, 5)):
            canonical_index = index * 5 + vertical_index
            rays.append({
                "id": f"canonical-{canonical_index:04d}",
                "rayClass": "canonical",
                "direction": [-1.0, float(vertical), float(horizontal)],
                "source": {"gridIndex": canonical_index},
            })
    for item in screen["lowDiscrepancy"]:
        rays.append({
            "id": f"low-discrepancy-{int(item['index']):04d}",
            "rayClass": "low-discrepancy",
            "direction": [-1.0, float(item["screenY"]), float(item["screenX"])],
            "source": item,
        })
    for index, item in enumerate(screen["criticalBrackets"]):
        rays.append({
            "id": f"critical-bracket-{index:04d}",
            "rayClass": "critical-bracket",
            "direction": [float(value) for value in item["direction"]],
            "source": item,
        })
    if len(rays) != 25 + 2048 + 1024:
        raise RuntimeError("V8 dense ray plan count mismatch")
    return rays


def environment_document(profile: str) -> dict[str, Any]:
    return {
        "profile": profile,
        "python": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "numpy": np.__version__,
        "scipy": scipy.__version__,
    }


def code_hash() -> str:
    paths = (
        SCRIPT,
        V6_RUNNER_PATH,
        GEOMETRY_PATH,
        SCREEN_BUILDER_PATH,
        KS_PATH,
        CARTER_PATH,
        OBSERVER_PATH,
    )
    return value_hash({path.name: file_hash(path) for path in paths})


def build_plan(args) -> dict[str, Any]:
    screen, screen_sha = frozen_screen()
    rays = build_rays(screen)
    tolerances = {
        "fine": {"rtol": 1e-11, "atol": 1e-13, "maxStep": 0.02},
        "finer": {"rtol": 3e-12, "atol": 3e-14, "maxStep": 0.01},
    }
    if args.profile == "smoke":
        tolerances = {
            "fine": {"rtol": 1e-8, "atol": 1e-10, "maxStep": 0.1},
            "finer": {"rtol": 3e-9, "atol": 3e-11, "maxStep": 0.05},
        }
    stable = {
        "version": VERSION,
        "profile": args.profile,
        "finiteObserverScreenManifestSha256": screen_sha,
        "finiteObserverScreenFileSha256": file_hash(SCREEN_PATH),
        "sourceV5ScreenFileSha256": screen["sourceV5ScreenFileSha256"],
        "observer": screen["observer"],
        "projection": "exact-finite-radius-zamo-spherical-photon-separatrix-v8",
        "solvers": ["carter-mino-dop853", "kerr-schild-hamiltonian-dop853"],
        "tolerances": tolerances,
        "reruns": ["A", "B"],
        "shardSize": SHARD_SIZE,
        "watchdogSeconds": args.watchdog_seconds,
        "codeSha256": code_hash(),
        "environment": environment_document(args.profile),
        "rays": rays,
    }
    stable["environmentSha256"] = value_hash(stable["environment"])
    stable["inputSha256"] = value_hash(stable)
    stable["shardCount"] = math.ceil(len(rays) / SHARD_SIZE)
    return stable


def child_entry(payload: dict[str, Any], queue) -> None:
    try:
        task = V6.ExecutionTask(**payload)
        queue.put({"ok": True, "result": V6.execute_task(task)})
    except BaseException as error:
        queue.put({"ok": False, "error": f"{type(error).__name__}: {error}"})


def execute_payload_with_watchdog(payload: dict[str, Any], seconds: int) -> dict[str, Any]:
    context = mp.get_context("spawn")
    queue = context.Queue(maxsize=1)
    process = context.Process(target=child_entry, args=(payload, queue))
    process.start()
    process.join(seconds)
    if process.is_alive():
        process.terminate()
        process.join(10)
        status = "watchdog-timeout"
        error = None
    elif queue.empty():
        status = "invalid"
        error = "child-exited-without-result"
    else:
        message = queue.get()
        if message["ok"]:
            return message["result"]
        status = "invalid"
        error = message["error"]
    stable = {
        "solver": payload["solver"],
        "tolerance": payload["tolerance"],
        "run": payload["run"],
        "status": status,
        "maxNullConstraint": None,
        "functionEvaluations": 0,
        "terminal": None,
        **({"error": error} if error else {}),
    }
    stable["outputSha256"] = value_hash({"payload": payload, **stable})
    return stable


def execute_ray(ray: dict[str, Any], plan: dict[str, Any], profile: str, watchdog: int) -> dict[str, Any]:
    executions = []
    for solver in plan["solvers"]:
        for tolerance in ("fine", "finer"):
            for run in ("A", "B"):
                executions.append(execute_payload_with_watchdog({
                    "solver": solver,
                    "tolerance": tolerance,
                    "run": run,
                    "ray": ray,
                    "observer": plan["observer"],
                    "settings": plan["tolerances"][tolerance],
                    "profile": profile,
                }, watchdog))
    return {
        "id": ray["id"],
        "rayClass": ray["rayClass"],
        "direction": ray["direction"],
        "source": ray["source"],
        "executions": executions,
    }


def run_shard(plan: dict[str, Any], index: int, args) -> Path:
    start = index * SHARD_SIZE
    rays = plan["rays"][start:start + SHARD_SIZE]
    if not rays:
        raise RuntimeError(f"shard index outside V8 plan: {index}")
    output_root = ROOT / "dist/science" / (
        "kerr-shards-v8-smoke" if args.profile == "smoke" else "kerr-shards-v8"
    )
    output = output_root / f"shard-{index:04d}.json"
    expected_input = value_hash({
        "planInputSha256": plan["inputSha256"],
        "shardIndex": index,
        "rays": rays,
    })
    if output.exists():
        existing = json.loads(output.read_text(encoding="utf-8"))
        if (
            existing.get("inputSha256") == expected_input
            and existing.get("codeSha256") == plan["codeSha256"]
            and existing.get("environmentSha256") == plan["environmentSha256"]
            and existing.get("complete") is True
        ):
            print(json.dumps({"resumed": True, "output": str(output)}))
            return output
        raise RuntimeError(f"stale/incomplete V8 shard requires checksummed quarantine: {output}")
    rows = []
    for position, ray in enumerate(rays, 1):
        rows.append(execute_ray(ray, plan, args.profile, args.watchdog_seconds))
        print(f"V8 shard {index:04d}: {position}/{len(rays)} {ray['id']}", flush=True)
    complete = all(
        len(ray["executions"]) == EXECUTIONS_PER_RAY
        and all(execution["status"] in PHYSICAL_STATUSES for execution in ray["executions"])
        for ray in rows
    )
    stable = {
        "version": VERSION,
        "profile": args.profile,
        "shardId": f"{index:04d}",
        "shardIndex": index,
        "shardSizeLimit": SHARD_SIZE,
        "rayCount": len(rows),
        "rayClassCounts": {
            kind: sum(ray["rayClass"] == kind for ray in rows)
            for kind in ("canonical", "low-discrepancy", "critical-bracket")
        },
        "finiteObserverScreenManifestSha256": plan["finiteObserverScreenManifestSha256"],
        "codeSha256": plan["codeSha256"],
        "environmentSha256": plan["environmentSha256"],
        "inputSha256": expected_input,
        "complete": complete,
        "watchdogSeconds": args.watchdog_seconds,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "rays": rows,
    }
    stable["outputSha256"] = value_hash(stable)
    atomic_json(output, {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable})
    print(json.dumps({
        "output": str(output),
        "complete": complete,
        "outputSha256": stable["outputSha256"],
    }, indent=2))
    if not complete:
        raise SystemExit(2)
    return output


def critical_metrics(rays: list[dict[str, Any]], solvers: list[str]) -> dict[str, Any]:
    pairs: dict[int, dict[str, dict[str, Any]]] = {}
    for ray in rays:
        if ray["rayClass"] != "critical-bracket":
            continue
        source = ray["source"]
        pairs.setdefault(int(source["pair"]), {})[str(source["side"])] = ray
    transitions = 0
    expected = len(pairs) * len(solvers) * 2 * 2
    half_widths = []
    for pair in pairs.values():
        if set(pair) != {"inner", "outer"}:
            continue
        inner = {(row["solver"], row["tolerance"], row["run"]): row for row in pair["inner"]["executions"]}
        outer = {(row["solver"], row["tolerance"], row["run"]): row for row in pair["outer"]["executions"]}
        for solver in solvers:
            for tolerance in ("fine", "finer"):
                for run in ("A", "B"):
                    key = (solver, tolerance, run)
                    if inner[key]["status"] == "captured" and outer[key]["status"] == "escaped":
                        transitions += 1
                        half_widths.append(max(
                            abs(float(pair["inner"]["source"]["offsetPx"])),
                            abs(float(pair["outer"]["source"]["offsetPx"])),
                        ))
    return {
        "pairCount": len(pairs),
        "transitionCount": transitions,
        "transitionExpected": expected,
        "maxErrorPx": max(half_widths) if transitions == expected and half_widths else None,
    }


def aggregate(plan: dict[str, Any], args) -> Path:
    if args.profile != "release":
        raise RuntimeError("smoke evidence cannot enter the V8 release aggregate")
    root = ROOT / "dist/science/kerr-shards-v8"
    shards = []
    for index in range(plan["shardCount"]):
        file = root / f"shard-{index:04d}.json"
        if not file.exists():
            continue
        row = json.loads(file.read_text(encoding="utf-8"))
        planned = plan["rays"][index * SHARD_SIZE:(index + 1) * SHARD_SIZE]
        expected_input = value_hash({
            "planInputSha256": plan["inputSha256"],
            "shardIndex": index,
            "rays": planned,
        })
        stable = {key: value for key, value in row.items() if key not in {"generatedAt", "outputSha256"}}
        if (
            row.get("version") != VERSION
            or row.get("profile") != "release"
            or row.get("shardIndex") != index
            or row.get("rayCount") != len(planned)
            or row.get("finiteObserverScreenManifestSha256") != plan["finiteObserverScreenManifestSha256"]
            or row.get("codeSha256") != plan["codeSha256"]
            or row.get("environmentSha256") != plan["environmentSha256"]
            or row.get("inputSha256") != expected_input
            or row.get("outputSha256") != value_hash(stable)
        ):
            raise RuntimeError(f"V8 shard provenance drift: {file}")
        shards.append(row)
    complete = len(shards) == plan["shardCount"] and all(row.get("complete") for row in shards)
    rays = [ray for shard in shards for ray in shard["rays"]] if complete else []
    executed = {
        kind: sum(ray["rayClass"] == kind for ray in rays)
        for kind in ("canonical", "low-discrepancy", "critical-bracket")
    }
    coverage = complete and executed == {
        "canonical": 25,
        "low-discrepancy": 2048,
        "critical-bracket": 1024,
    }
    deterministic = False
    physical = False
    agreement = None
    max_null = None
    critical = {"pairCount": 0, "transitionCount": 0, "transitionExpected": 4096, "maxErrorPx": None}
    if coverage:
        deterministic_rows = []
        physical_rows = []
        agreement_rows = []
        constraints = []
        for ray in rays:
            lookup = {(row["solver"], row["tolerance"], row["run"]): row for row in ray["executions"]}
            agreement_rows.append(
                lookup[("carter-mino-dop853", "finer", "A")]["status"]
                == lookup[("kerr-schild-hamiltonian-dop853", "finer", "A")]["status"]
            )
            physical_rows.extend(row["status"] in PHYSICAL_STATUSES for row in ray["executions"])
            constraints.extend(float(row["maxNullConstraint"]) for row in ray["executions"] if row["maxNullConstraint"] is not None)
            for solver in plan["solvers"]:
                for tolerance in ("fine", "finer"):
                    deterministic_rows.append(
                        lookup[(solver, tolerance, "A")]["outputSha256"]
                        == lookup[(solver, tolerance, "B")]["outputSha256"]
                    )
        deterministic = all(deterministic_rows)
        physical = all(physical_rows)
        agreement = sum(agreement_rows) / len(agreement_rows)
        max_null = max(constraints)
        critical = critical_metrics(rays, plan["solvers"])
    radiative_path = ROOT / "dist/science/kerr-radiative-transfer-v5-fine.json"
    radiative = json.loads(radiative_path.read_text(encoding="utf-8"))
    redshift = radiative.get("maxRedshiftRelativeError")
    evpa = radiative.get("maxEvpaErrorDeg")
    report = {
        "version": VERSION,
        "finiteObserverScreenManifestSha256": plan["finiteObserverScreenManifestSha256"],
        "codeSha256": plan["codeSha256"],
        "environmentSha256": plan["environmentSha256"],
        "shardCount": plan["shardCount"],
        "completeShardCount": sum(bool(row.get("complete")) for row in shards),
        "expected": {"canonical": 25, "lowDiscrepancy": 2048, "criticalBracket": 1024},
        "executed": {
            "canonical": executed["canonical"],
            "lowDiscrepancy": executed["low-discrepancy"],
            "criticalBracket": executed["critical-bracket"],
        },
        "partialResultsAggregated": False,
        "physicalClassificationComplete": physical,
        "deterministicRerunPassed": deterministic,
        "classificationAgreement": agreement,
        "criticalPairCount": critical["pairCount"],
        "criticalTransitionCount": critical["transitionCount"],
        "criticalTransitionExpected": critical["transitionExpected"],
        "criticalCurveMaxErrorPx": critical["maxErrorPx"],
        "maxNullConstraint": max_null,
        "redshiftMaxRelativeError": redshift,
        "evpaMaxErrorDeg": evpa,
        "classificationGatePassed": bool(coverage and physical and agreement is not None and agreement >= 0.999),
        "criticalCurveGatePassed": bool(coverage and critical["pairCount"] == 512 and critical["transitionCount"] == critical["transitionExpected"] and critical["maxErrorPx"] is not None and critical["maxErrorPx"] < 0.5),
        "nullConstraintGatePassed": bool(coverage and max_null is not None and max_null < 1e-10),
        "redshiftGatePassed": bool(coverage and redshift is not None and redshift < 0.005),
        "evpaGatePassed": bool(coverage and evpa is not None and evpa < 0.5),
        "promotionDecision": "shadow-retained",
        "blocker": None if coverage else "v8-dense-shards-incomplete",
        "boundary": "offline-finite-observer-dense-kerr-reference-no-runtime-promotion",
    }
    report["gatePassed"] = all(report[field] for field in (
        "classificationGatePassed",
        "criticalCurveGatePassed",
        "nullConstraintGatePassed",
        "redshiftGatePassed",
        "evpaGatePassed",
    )) and deterministic
    report["canonicalEvidenceSha256"] = value_hash(report)
    output = ROOT / "dist/science/kerr-dense-cross-validation-v8.json"
    atomic_json(output, {"generatedAt": datetime.now(timezone.utc).isoformat(), **report})
    print(json.dumps({
        "output": str(output),
        "coverageComplete": coverage,
        "completeShardCount": report["completeShardCount"],
        "gatePassed": report["gatePassed"],
        "blocker": report["blocker"],
    }, indent=2))
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas V8 finite-observer Kerr shard executor")
    parser.add_argument("--profile", choices=("release", "smoke"), default="release")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--aggregate", action="store_true")
    parser.add_argument("--shard", type=int)
    parser.add_argument("--watchdog-seconds", type=int, default=180)
    args = parser.parse_args()
    if sum((args.plan_only, args.aggregate, args.shard is not None)) != 1:
        raise SystemExit("select exactly one of --plan-only, --aggregate or --shard N")
    plan = build_plan(args)
    output = ROOT / "dist/science" / f"kerr-dense-execution-plan-v8-{args.profile}.json"
    stable_plan = {**plan, "rays": plan["rays"] if args.plan_only else []}
    atomic_json(output, {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        **stable_plan,
        "planSha256": value_hash(plan),
    })
    if args.plan_only:
        print(json.dumps({
            "output": str(output),
            "rayCount": len(plan["rays"]),
            "shardCount": plan["shardCount"],
            "inputSha256": plan["inputSha256"],
            "codeSha256": plan["codeSha256"],
            "finiteObserverScreenManifestSha256": plan["finiteObserverScreenManifestSha256"],
        }, indent=2))
    elif args.aggregate:
        aggregate(plan, args)
    else:
        run_shard(plan, int(args.shard), args)


if __name__ == "__main__":
    mp.freeze_support()
    main()


"""Resumable, fail-closed dense Kerr cross-reference executor (v228/v6).

The frozen V5 screen manifest is never rewritten.  This program derives a
versioned execution plan, runs at most one explicitly selected 64-ray shard,
and atomically publishes a shard only after every requested solver/tolerance/
rerun execution is present.  Smoke shards use a distinct profile and can never
be aggregated into release evidence.
"""

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
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import numpy as np
import scipy

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).resolve()
SCREEN_PATH = ROOT / "dist/science/kerr-dense-screen-v5.json"
V5_REPORT_PATH = ROOT / "dist/science/kerr-dense-cross-validation-v5.json"
KS_PATH = ROOT / "scripts/run-kerr-schild-reference-v5.py"
CARTER_PATH = ROOT / "scripts/run-kerr-carter-mino-reference-v6.py"
VERSION = "v228-kerr-dense-sharded-cross-validation-v6"
SHARD_SIZE = 64
EXECUTIONS_PER_RAY = 8


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def value_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def frozen_screen() -> tuple[dict, str]:
    screen = json.loads(SCREEN_PATH.read_text(encoding="utf-8"))
    report = json.loads(V5_REPORT_PATH.read_text(encoding="utf-8"))
    digest = value_hash(screen)
    if screen.get("version") != "v223-kerr-dense-screen-manifest-v5":
        raise RuntimeError("unexpected frozen V5 screen identity")
    if digest != report.get("screenManifestSha256"):
        raise RuntimeError("frozen V5 screen hash drift")
    if len(screen.get("lowDiscrepancy", [])) != 2048 or len(screen.get("criticalBrackets", [])) != 1024:
        raise RuntimeError("frozen V5 ray counts drifted")
    return screen, digest


def nearest_curve_point(curve: np.ndarray, angle: float) -> tuple[float, float]:
    angles = np.arctan2(curve[:, 1], curve[:, 0])
    wrapped = np.abs(np.angle(np.exp(1j * (angles - angle))))
    point = curve[int(np.argmin(wrapped))]
    return float(point[0]), float(point[1])


def build_rays(screen: dict, spin: float, observer_radius: float, theta: float) -> list[dict]:
    carter = load_module("atlas_kerr_dense_plan_carter", CARTER_PATH)
    rays: list[dict] = []
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
    curve = carter.critical_curve(spin, theta, 16384)
    viewport_height = float(screen["viewport"][1])
    for index, item in enumerate(screen["criticalBrackets"]):
        alpha, beta = nearest_curve_point(curve, float(item["angleRad"]))
        norm = max(math.hypot(alpha, beta), 1e-15)
        # V5 normalized screen coordinates span the viewport height.  Convert
        # the frozen quarter-pixel bracket into impact-parameter M, then into
        # the shared ZAMO local direction at the frozen observer radius.
        impact_offset = float(item["offsetPx"]) * 2.0 * observer_radius / viewport_height
        alpha += impact_offset * alpha / norm
        beta += impact_offset * beta / norm
        rays.append({
            "id": f"critical-bracket-{index:04d}",
            "rayClass": "critical-bracket",
            "direction": [-1.0, beta / observer_radius, alpha / observer_radius],
            "source": item,
        })
    if len(rays) != 25 + 2048 + 1024:
        raise RuntimeError("derived dense ray plan count mismatch")
    return rays


def environment_document(profile: str) -> dict:
    return {
        "profile": profile,
        "python": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "numpy": np.__version__,
        "scipy": scipy.__version__,
    }


def code_hash() -> str:
    return value_hash({path.name: file_hash(path) for path in (SCRIPT, KS_PATH, CARTER_PATH, ROOT / "scripts/kerr_observer_frame_v5.py")})


def build_plan(args) -> dict:
    screen, screen_sha = frozen_screen()
    spin = 0.9
    observer_radius = 50.0
    theta = math.radians(70.0)
    rays = build_rays(screen, spin, observer_radius, theta)
    tolerances = {
        "fine": {"rtol": 1e-11, "atol": 1e-13, "maxStep": 0.02},
        "finer": {"rtol": 3e-12, "atol": 3e-14, "maxStep": 0.01},
    }
    if args.profile == "smoke":
        tolerances = {"fine": {"rtol": 1e-8, "atol": 1e-10, "maxStep": 0.1},
                      "finer": {"rtol": 3e-9, "atol": 3e-11, "maxStep": 0.05}}
    stable = {
        "version": VERSION,
        "profile": args.profile,
        "frozenScreenManifestSha256": screen_sha,
        "observer": {"kind": "exact-ZAMO-shared-v5", "spinA": spin, "radiusM": observer_radius,
                     "thetaRad": theta, "screenBasis": "radial-polar-azimuthal"},
        "projection": "v5-normalized-screen-and-quarter-pixel-critical-brackets",
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
    stable["inputSha256"] = value_hash({key: value for key, value in stable.items() if key not in {"environment", "rays"}} | {"rays": rays})
    stable["shardCount"] = math.ceil(len(rays) / SHARD_SIZE)
    return stable


@dataclass(frozen=True)
class ExecutionTask:
    solver: str
    tolerance: str
    run: str
    ray: dict
    observer: dict
    settings: dict
    profile: str


def execute_task(task: ExecutionTask) -> dict:
    direction = np.asarray(task.ray["direction"], dtype=float)
    theta = float(task.observer["thetaRad"])
    spin = float(task.observer["spinA"])
    radius = float(task.observer["radiusM"])
    if task.solver == "carter-mino-dop853":
        module = load_module("atlas_kerr_dense_carter_worker", CARTER_PATH)
        result = module.integrate_ray(
            spin, radius, theta, direction,
            float(task.settings["rtol"]), float(task.settings["atol"]),
            float(task.settings["maxStep"]),
            20.0 if task.profile == "smoke" else 80.0,
            80.0 if task.profile == "smoke" else 200.0,
        )
        null_constraint = float(result["nullConstraint"])
    else:
        module = load_module("atlas_kerr_dense_ks_worker", KS_PATH)
        runtime = SimpleNamespace(
            rtol=float(task.settings["rtol"]), atol=float(task.settings["atol"]),
            max_step=float(task.settings["maxStep"]),
            max_affine=40.0 if task.profile == "smoke" else 320.0,
            escape_radius=80.0 if task.profile == "smoke" else 200.0,
        )
        result = module.trace_ray(spin, radius, theta, direction, runtime)
        null_constraint = float(result["maxNullConstraint"])
    stable = {
        "solver": task.solver,
        "tolerance": task.tolerance,
        "run": task.run,
        "status": result["status"],
        "maxNullConstraint": null_constraint,
        "functionEvaluations": int(result["functionEvaluations"]),
        "terminal": result.get("terminal", {"radiusM": result.get("terminalRadiusM"), "coordinateTime": result.get("coordinateTime")}),
    }
    stable["outputSha256"] = value_hash({key: value for key, value in stable.items() if key != "run"})
    return stable


def child_entry(task: ExecutionTask, queue) -> None:
    try:
        queue.put({"ok": True, "result": execute_task(task)})
    except BaseException as error:  # child boundary must serialize every failure
        queue.put({"ok": False, "error": f"{type(error).__name__}: {error}"})


def execute_with_watchdog(task: ExecutionTask, seconds: int) -> dict:
    context = mp.get_context("spawn")
    queue = context.Queue(maxsize=1)
    process = context.Process(target=child_entry, args=(task, queue))
    process.start()
    process.join(seconds)
    if process.is_alive():
        process.terminate()
        process.join(10)
        return {"solver": task.solver, "tolerance": task.tolerance, "run": task.run,
                "status": "watchdog-timeout", "maxNullConstraint": None,
                "functionEvaluations": 0, "terminal": None,
                "outputSha256": value_hash({"task": task.__dict__, "status": "watchdog-timeout"})}
    if queue.empty():
        return {"solver": task.solver, "tolerance": task.tolerance, "run": task.run,
                "status": "invalid", "maxNullConstraint": None, "functionEvaluations": 0,
                "terminal": None, "outputSha256": value_hash({"task": task.__dict__, "status": "invalid"})}
    message = queue.get()
    if not message["ok"]:
        return {"solver": task.solver, "tolerance": task.tolerance, "run": task.run,
                "status": "invalid", "maxNullConstraint": None, "functionEvaluations": 0,
                "terminal": None, "error": message["error"],
                "outputSha256": value_hash({"task": task.__dict__, "error": message["error"]})}
    return message["result"]


def atomic_json(path: Path, document: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def run_shard(plan: dict, index: int, args) -> Path:
    start = index * SHARD_SIZE
    rays = plan["rays"][start:start + SHARD_SIZE]
    if not rays:
        raise RuntimeError(f"shard index outside plan: {index}")
    if args.max_rays is not None:
        rays = rays[:max(0, args.max_rays)]
    output_root = ROOT / "dist/science" / ("kerr-shards-v6-smoke" if args.profile == "smoke" else "kerr-shards-v6")
    output = output_root / f"shard-{index:04d}.json"
    expected_input = value_hash({"planInputSha256": plan["inputSha256"], "shardIndex": index, "rays": rays})
    if output.exists() and not args.force:
        existing = json.loads(output.read_text(encoding="utf-8"))
        if existing.get("inputSha256") == expected_input and existing.get("codeSha256") == plan["codeSha256"] and existing.get("complete"):
            print(json.dumps({"resumed": True, "output": str(output)}, indent=2))
            return output
        raise RuntimeError(f"stale or incomplete shard exists; inspect or use --force: {output}")
    ray_rows = []
    for position, ray in enumerate(rays, 1):
        executions = []
        for solver in plan["solvers"]:
            for tolerance in ("fine", "finer"):
                for run in ("A", "B"):
                    task = ExecutionTask(solver, tolerance, run, ray, plan["observer"], plan["tolerances"][tolerance], args.profile)
                    executions.append(execute_with_watchdog(task, args.watchdog_seconds))
        ray_rows.append({
            "id": ray["id"],
            "rayClass": ray["rayClass"],
            "direction": ray["direction"],
            "source": ray["source"],
            "executions": executions,
        })
        print(f"shard {index:04d}: {position}/{len(rays)} {ray['id']}", flush=True)
    class_counts = {kind: sum(ray["rayClass"] == kind for ray in ray_rows)
                    for kind in ("canonical", "low-discrepancy", "critical-bracket")}
    complete = len(rays) == min(SHARD_SIZE, len(plan["rays"]) - start) and all(
        len(ray["executions"]) == EXECUTIONS_PER_RAY and all(
            execution["status"] not in {"invalid", "watchdog-timeout"} for execution in ray["executions"]
        ) for ray in ray_rows
    )
    stable = {
        "version": VERSION,
        "profile": args.profile,
        "shardId": f"{index:04d}",
        "shardIndex": index,
        "shardSizeLimit": SHARD_SIZE,
        "rayCount": len(ray_rows),
        "rayClassCounts": class_counts,
        "frozenScreenManifestSha256": plan["frozenScreenManifestSha256"],
        "codeSha256": plan["codeSha256"],
        "environmentSha256": plan["environmentSha256"],
        "inputSha256": expected_input,
        "complete": complete,
        "watchdogSeconds": args.watchdog_seconds,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "rays": ray_rows,
    }
    stable["outputSha256"] = value_hash(stable)
    document = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    atomic_json(output, document)
    print(json.dumps({"output": str(output), "complete": complete, "outputSha256": stable["outputSha256"]}, indent=2))
    return output


def critical_bracket_metrics(rays: list[dict], solvers: list[str]) -> dict:
    critical_pairs: dict[int, dict[str, dict]] = {}
    for ray in rays:
        if ray["rayClass"] != "critical-bracket":
            continue
        source = ray.get("source", {})
        lookup = {
            (item["solver"], item["tolerance"], item["run"]): item
            for item in ray["executions"]
        }
        critical_pairs.setdefault(int(source["pair"]), {})[str(source["side"])] = {
            "offsetPx": float(source["offsetPx"]),
            "lookup": lookup,
        }
    expected = len(critical_pairs) * len(solvers) * 2 * 2
    transition_count = 0
    half_widths = []
    complete_pair_count = 0
    for pair in critical_pairs.values():
        if set(pair) != {"inner", "outer"}:
            continue
        complete_pair_count += 1
        inner = pair["inner"]
        outer = pair["outer"]
        for solver in solvers:
            for tolerance in ("fine", "finer"):
                for run in ("A", "B"):
                    key = (solver, tolerance, run)
                    if (
                        inner["lookup"][key]["status"] == "captured"
                        and outer["lookup"][key]["status"] == "escaped"
                    ):
                        transition_count += 1
                        half_widths.append(
                            max(abs(inner["offsetPx"]), abs(outer["offsetPx"]))
                        )
    max_error_px = None
    if (
        complete_pair_count == len(critical_pairs)
        and transition_count == expected
        and half_widths
    ):
        # Every solver/tolerance/rerun brackets the analytic center with a
        # captured inner and escaped outer ray. The half-width is a
        # conservative pixel-space upper bound rather than a fitted error.
        max_error_px = max(half_widths)
    return {
        "pairCount": len(critical_pairs),
        "completePairCount": complete_pair_count,
        "transitionCount": transition_count,
        "transitionExpected": expected,
        "maxErrorPx": max_error_px,
    }


def aggregate(plan: dict, args) -> Path:
    if args.profile != "release":
        raise RuntimeError("smoke shards are never accepted by the release aggregator")
    root = ROOT / "dist/science/kerr-shards-v6"
    shards = []
    for index in range(plan["shardCount"]):
        path = root / f"shard-{index:04d}.json"
        if path.exists():
            row = json.loads(path.read_text(encoding="utf-8"))
            start = index * SHARD_SIZE
            full_planned_rays = plan["rays"][start:start + SHARD_SIZE]
            recorded_ray_count = int(row.get("rayCount", -1))
            planned_rays = full_planned_rays[:max(0, recorded_ray_count)]
            expected_input = value_hash({
                "planInputSha256": plan["inputSha256"],
                "shardIndex": index,
                "rays": planned_rays,
            })
            stable_row = {
                key: value
                for key, value in row.items()
                if key not in {"generatedAt", "outputSha256"}
            }
            if (
                row.get("version") != VERSION
                or row.get("profile") != "release"
                or row.get("shardIndex") != index
                or recorded_ray_count != len(row.get("rays", []))
                or recorded_ray_count > len(full_planned_rays)
                or (
                    row.get("complete")
                    and recorded_ray_count != len(full_planned_rays)
                )
                or row.get("codeSha256") != plan["codeSha256"]
                or row.get("environmentSha256") != plan["environmentSha256"]
                or row.get("inputSha256") != expected_input
                or row.get("frozenScreenManifestSha256")
                != plan["frozenScreenManifestSha256"]
                or row.get("outputSha256") != value_hash(stable_row)
            ):
                raise RuntimeError(f"shard provenance drift: {path}")
            shards.append(row)
    complete = len(shards) == plan["shardCount"] and all(shard.get("complete") for shard in shards)
    rays = [ray for shard in shards for ray in shard.get("rays", [])] if complete else []
    executed = {kind: sum(ray["rayClass"] == kind for ray in rays)
                for kind in ("canonical", "low-discrepancy", "critical-bracket")}
    agreement = None
    deterministic = False
    max_null = None
    physical_classification_complete = False
    critical_curve_error_px = None
    critical_transition_count = 0
    critical_transition_expected = 512 * EXECUTIONS_PER_RAY
    critical_pair_count = 0
    if complete:
        pairs = []
        deterministic_rows = []
        constraints = []
        physical_rows = []
        for ray in rays:
            lookup = {(item["solver"], item["tolerance"], item["run"]): item for item in ray["executions"]}
            carter = lookup[("carter-mino-dop853", "finer", "A")]
            ks = lookup[("kerr-schild-hamiltonian-dop853", "finer", "A")]
            pairs.append(carter["status"] == ks["status"])
            physical_rows.extend(
                item["status"] in {"captured", "escaped"}
                for item in ray["executions"]
            )
            for solver in plan["solvers"]:
                for tolerance in ("fine", "finer"):
                    deterministic_rows.append(lookup[(solver, tolerance, "A")]["outputSha256"] == lookup[(solver, tolerance, "B")]["outputSha256"])
            constraints.extend(item["maxNullConstraint"] for item in ray["executions"] if item["maxNullConstraint"] is not None)
        agreement = sum(pairs) / len(pairs)
        deterministic = all(deterministic_rows)
        max_null = max(constraints) if constraints else None
        physical_classification_complete = all(physical_rows)
        critical_metrics = critical_bracket_metrics(rays, plan["solvers"])
        critical_pair_count = critical_metrics["pairCount"]
        critical_transition_count = critical_metrics["transitionCount"]
        critical_transition_expected = critical_metrics["transitionExpected"]
        critical_curve_error_px = critical_metrics["maxErrorPx"]
    radiative_path = ROOT / "dist/science/kerr-radiative-transfer-v5-fine.json"
    radiative = json.loads(radiative_path.read_text(encoding="utf-8")) if radiative_path.exists() else {}
    redshift = radiative.get("maxRedshiftRelativeError")
    evpa = radiative.get("maxEvpaErrorDeg")
    coverage = complete and executed == {"canonical": 25, "low-discrepancy": 2048, "critical-bracket": 1024}
    report = {
        "version": VERSION,
        "frozenScreenManifestSha256": plan["frozenScreenManifestSha256"],
        "expected": {"canonical": 25, "lowDiscrepancy": 2048, "criticalBracket": 1024},
        "executed": {"canonical": executed["canonical"], "lowDiscrepancy": executed["low-discrepancy"], "criticalBracket": executed["critical-bracket"]},
        "shardCount": plan["shardCount"], "completeShardCount": sum(bool(shard.get("complete")) for shard in shards),
        "partialResultsAggregated": False, "deterministicRerunPassed": deterministic,
        "physicalClassificationComplete": physical_classification_complete,
        "classificationAgreement": agreement,
        "criticalCurveMaxErrorPx": critical_curve_error_px,
        "criticalCurveMetric": "symmetric-captured-escaped-bracket-half-width-upper-bound",
        "criticalPairCount": critical_pair_count,
        "criticalTransitionCount": critical_transition_count,
        "criticalTransitionExpected": critical_transition_expected,
        "maxNullConstraint": max_null, "redshiftMaxRelativeError": redshift, "evpaMaxErrorDeg": evpa,
        "classificationGatePassed": bool(
            coverage
            and physical_classification_complete
            and agreement is not None
            and agreement >= 0.999
        ),
        "criticalCurveGatePassed": bool(
            coverage
            and physical_classification_complete
            and critical_pair_count == 512
            and critical_curve_error_px is not None
            and critical_curve_error_px < 0.5
        ),
        "nullConstraintGatePassed": bool(coverage and max_null is not None and max_null < 1e-10),
        "redshiftGatePassed": bool(coverage and redshift is not None and redshift < 0.005),
        "evpaGatePassed": bool(coverage and evpa is not None and evpa < 0.5),
        "promotionDecision": "shadow-retained",
        "blocker": None if coverage else "dense-shards-incomplete",
        "boundary": "offline-dense-kerr-reference-not-grmhd-no-runtime-promotion",
    }
    report["canonicalEvidenceSha256"] = value_hash(report)
    output = ROOT / "dist/science/kerr-dense-cross-validation-v6.json"
    atomic_json(output, {"generatedAt": datetime.now(timezone.utc).isoformat(), **report})
    print(json.dumps({"output": str(output), "coverageComplete": coverage, "executed": report["executed"], "blocker": report["blocker"]}, indent=2))
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v228 dense Kerr shard executor")
    parser.add_argument("--profile", choices=("release", "smoke"), default="release")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--aggregate", action="store_true")
    parser.add_argument("--shard", type=int)
    parser.add_argument("--max-rays", type=int)
    parser.add_argument("--watchdog-seconds", type=int, default=180)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if sum((args.plan_only, args.aggregate, args.shard is not None)) != 1:
        raise SystemExit("select exactly one of --plan-only, --aggregate or --shard N")
    plan = build_plan(args)
    plan_output = ROOT / "dist/science" / f"kerr-dense-execution-plan-v6-{args.profile}.json"
    atomic_json(plan_output, {"generatedAt": datetime.now(timezone.utc).isoformat(), **plan,
                              "rays": plan["rays"] if args.plan_only else [], "planSha256": value_hash(plan)})
    if args.plan_only:
        print(json.dumps({"output": str(plan_output), "rayCount": len(plan["rays"]),
                          "shardCount": plan["shardCount"], "inputSha256": plan["inputSha256"]}, indent=2))
    elif args.aggregate:
        aggregate(plan, args)
    else:
        run_shard(plan, int(args.shard), args)


if __name__ == "__main__":
    mp.freeze_support()
    main()

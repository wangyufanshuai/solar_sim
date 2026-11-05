"""Atomic v284 controller for the corrected 3,097-ray Kerr campaign."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/kerr-campaign-v284"
SHARDS = OUT / "shards"
STATE = OUT / "campaign-state.json"
AGGREGATE = OUT / "dense-aggregate.json"
SHORT_GATE = ROOT / "dist/science/kerr-reference-v283/short-gate-evidence.json"
AUTHORITY_SOURCE = ROOT / "scripts/run-kerr-short-gate-v283.py"
RAY_COUNT = 3097
SHARD_SIZE = 64
SHARD_COUNT = 49
EXECUTIONS_PER_RAY = 8


def load_authority():
    path = ROOT / "scripts/run-kerr-short-gate-v283.py"
    spec = importlib.util.spec_from_file_location("atlas_kerr_v283_authority", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v283 authority")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


AUTHORITY = load_authority()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def initial_state() -> dict[str, Any]:
    gate = read_json(SHORT_GATE) if SHORT_GATE.exists() else {}
    if gate.get("gatePassed") is not True or gate.get("executionCount") != 128:
        raise RuntimeError("v283 authority short gate has not passed")
    core = {
        "version": "v284-corrected-kerr-dense-campaign-state-v1", "generatedAt": utc(), "status": "pending",
        "plannedRayCount": RAY_COUNT, "plannedShardCount": SHARD_COUNT, "shardSizeLimit": SHARD_SIZE,
        "executionsPerRay": EXECUTIONS_PER_RAY, "completedShardIndices": [], "completedShardCount": 0,
        "nextShardIndex": 0, "failedShardIndex": None, "failure": None, "noAutomaticRetry": True,
        "partialResultsAggregated": False, "shortGateEvidenceSha256": gate["evidenceSha256"],
        "authoritySourceSha256": file_sha(AUTHORITY_SOURCE),
        "screenManifestSha256": "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
        "cpuAuthority": "v283-float64-dop853", "formalProductPointer": "v263", "promotionDecision": "shadow-retained",
        "boundary": "serial-offline-corrected-kerr-campaign-no-runtime-promotion",
    }
    return {**core, "stateSha256": value_sha(core)}


def load_state() -> dict[str, Any]:
    if not STATE.exists():
        state = initial_state()
        atomic_json(STATE, state)
        return state
    state = read_json(STATE)
    stable = {key: value for key, value in state.items() if key != "stateSha256"}
    if value_sha(stable) != state.get("stateSha256"):
        raise RuntimeError("campaign state SHA mismatch")
    gate = read_json(SHORT_GATE)
    if gate.get("gatePassed") is not True:
        raise RuntimeError("v283 authority short gate is no longer passing")
    if state.get("authoritySourceSha256") not in (None, file_sha(AUTHORITY_SOURCE)):
        raise RuntimeError("v284 authority source changed after campaign start")
    state["authoritySourceSha256"] = file_sha(AUTHORITY_SOURCE)
    state["shortGateEvidenceSha256"] = gate["evidenceSha256"]
    return state


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    stable = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(stable)
    atomic_json(STATE, state)


def completed_indices() -> list[int]:
    indices = []
    for path in sorted(SHARDS.glob("shard-*.json")) if SHARDS.exists() else []:
        document = read_json(path)
        stable = {key: value for key, value in document.items() if key != "shardSha256"}
        rays = document.get("rays", [])
        ray_identity_valid = all(all(execution.get("rayIndex") == ray.get("rayIndex") for execution in ray.get("executions", [])) for ray in rays)
        authority_valid = document.get("authoritySourceSha256") == file_sha(AUTHORITY_SOURCE)
        if document.get("complete") is True and ray_identity_valid and authority_valid and value_sha(stable) == document.get("shardSha256"):
            indices.append(int(document["shardIndex"]))
    return indices


def ray_executions(ray_index: int) -> list[dict[str, Any]]:
    spin = (-0.998, -0.9, -0.5, 0.0, 0.5, 0.9, 0.998)[ray_index % 7]
    rows = []
    for tolerance in (1e-9, 1e-11):
        for branch in ("A", "B"):
            rows.append(AUTHORITY.evaluate_carter(ray_index, spin, tolerance, branch))
            rows.append(AUTHORITY.evaluate_ks(ray_index, spin, tolerance, branch))
    return rows


def run_next() -> dict[str, Any]:
    state = load_state()
    if state.get("failedShardIndex") is not None:
        raise RuntimeError("previous shard failed; this controller never retries a failed range")
    completed = completed_indices()
    next_index = next((index for index in range(SHARD_COUNT) if index not in completed), None)
    if next_index is None:
        state.update({"status": "all-shards-complete-awaiting-aggregate", "completedShardIndices": completed, "completedShardCount": len(completed), "nextShardIndex": None})
        save_state(state)
        return state
    start = next_index * SHARD_SIZE
    stop = min(RAY_COUNT, start + SHARD_SIZE)
    try:
        rays = []
        for ray_index in range(start, stop):
            executions = ray_executions(ray_index)
            invalid = sum(1 for row in executions if row["invalid"] or row["timeout"])
            if len(executions) != EXECUTIONS_PER_RAY or invalid:
                raise RuntimeError(f"ray {ray_index} produced invalid authority executions")
            rays.append({"rayIndex": ray_index, "spin": executions[0]["spin"], "executionCount": len(executions), "executions": executions, "raySha256": value_sha(executions)})
        core = {"version": "v284-corrected-kerr-dense-shard-v1", "generatedAt": utc(), "shardIndex": next_index, "rayStart": start, "rayStopExclusive": stop, "rayCount": len(rays), "executionCount": len(rays) * EXECUTIONS_PER_RAY, "rays": rays, "authoritySourceSha256": file_sha(AUTHORITY_SOURCE), "shortGateEvidenceSha256": read_json(SHORT_GATE)["evidenceSha256"], "complete": True, "automaticRetryApplied": False}
        document = {**core, "shardSha256": value_sha(core)}
        path = SHARDS / f"shard-{next_index:02d}.json"
        atomic_json(path, document)
        published = read_json(path)
        published_core = {key: value for key, value in published.items() if key != "shardSha256"}
        if value_sha(published_core) != published.get("shardSha256"):
            raise RuntimeError("shard canonical SHA verification failed")
        completed = completed_indices()
        state.update({"status": "running" if len(completed) < SHARD_COUNT else "all-shards-complete-awaiting-aggregate", "completedShardIndices": completed, "completedShardCount": len(completed), "nextShardIndex": next((index for index in range(SHARD_COUNT) if index not in completed), None), "failure": None})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": next_index, "failure": str(error), "nextShardIndex": next_index})
        save_state(state)
        raise


def aggregate() -> dict[str, Any]:
    state = load_state()
    completed = completed_indices()
    if completed != list(range(SHARD_COUNT)):
        state["partialResultsAggregated"] = False
        save_state(state)
        raise RuntimeError(f"partial aggregate refused: {len(completed)}/{SHARD_COUNT} shards")
    shard_rows = []
    ray_count = execution_count = 0
    for index in completed:
        path = SHARDS / f"shard-{index:02d}.json"
        document = read_json(path)
        ray_count += int(document["rayCount"])
        execution_count += int(document["executionCount"])
        shard_rows.append({"index": index, "path": path.relative_to(ROOT).as_posix(), "fileSha256": file_sha(path), "shardSha256": document["shardSha256"]})
    if ray_count != RAY_COUNT or execution_count != RAY_COUNT * EXECUTIONS_PER_RAY:
        raise RuntimeError("dense campaign conservation failed")
    core = {"version": "v284-corrected-kerr-dense-aggregate-v1", "generatedAt": utc(), "status": "complete", "rayCount": ray_count, "executionCount": execution_count, "shardCount": len(shard_rows), "shards": shard_rows, "partialAggregate": False, "cpuAuthority": "v283-float64-dop853", "promotionDecision": "shadow-retained"}
    document = {**core, "aggregateSha256": value_sha(core)}
    atomic_json(AGGREGATE, document)
    state.update({"status": "complete", "partialResultsAggregated": False, "aggregate": {"path": AGGREGATE.relative_to(ROOT).as_posix(), "sha256": file_sha(AGGREGATE)}})
    save_state(state)
    return document


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v284 corrected dense campaign")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--run-next", action="store_true")
    group.add_argument("--run-series", action="store_true")
    group.add_argument("--status", action="store_true")
    group.add_argument("--aggregate", action="store_true")
    args = parser.parse_args()
    if args.status:
        result = load_state()
    elif args.aggregate:
        result = aggregate()
    elif args.run_next:
        result = run_next()
    else:
        result = load_state()
        while result.get("nextShardIndex") is not None and result.get("failedShardIndex") is None:
            child = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--run-next"], cwd=ROOT, check=False)
            if child.returncode != 0:
                raise SystemExit(child.returncode)
            result = load_state()
    print(json.dumps({key: result.get(key) for key in ("status", "completedShardCount", "nextShardIndex", "failedShardIndex", "failure")}, indent=2))


if __name__ == "__main__":
    main()

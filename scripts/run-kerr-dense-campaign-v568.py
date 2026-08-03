"""Run the current-worktree Kerr dense CPU-authority campaign.

v568 reuses the validated v312/v313 numerical kernels and the v314 streaming
implementation, but writes only to a new namespace.  It records the two known
non-numerical UI/CLI drifts from the historical v313 envelope and freezes all
current source hashes before the first shard is attempted.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_CONTROLLER_SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v314.py"


def load_base_controller():
    spec = importlib.util.spec_from_file_location("orbit_atlas_dense_v314_for_v568", BASE_CONTROLLER_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v314 streaming implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = load_base_controller()
PLANNER = BASE.PLANNER

OUT = ROOT / "dist/science/kerr-campaign-v568"
ENVELOPE = OUT / "execution-envelope.json"
PLAN = OUT / "ray-plan.json"
STATE = OUT / "campaign-state.json"
SHARDS = OUT / "shards"
CHECKPOINTS = OUT / "checkpoints"
AUDITS = OUT / "audits"
AGGREGATE = OUT / "dense-aggregate.json"

RAY_COUNT = BASE.RAY_COUNT
SHARD_COUNT = BASE.SHARD_COUNT
EXECUTIONS_PER_RAY = BASE.EXECUTIONS_PER_RAY
MINIMUM_FREE_MEMORY_BYTES = BASE.MINIMUM_FREE_MEMORY_BYTES
MINIMUM_FREE_DISK_BYTES = BASE.MINIMUM_FREE_DISK_BYTES
PEAK_RSS_LIMIT_BYTES = BASE.PEAK_RSS_LIMIT_BYTES
EXPECTED_GEOMETRY_SHA = BASE.EXPECTED_GEOMETRY_SHA
EXPECTED_POLARIZATION_SHA = BASE.EXPECTED_POLARIZATION_SHA
FULL_SHORT_AUTHORITY_SHA = BASE.FULL_SHORT_AUTHORITY_SHA
EXPECTED_HISTORICAL_ENVELOPE_CANONICAL_SHA = "7c45f357e4ecff41116083baa4478d8a2fbdf874254eae3eb5c455ff0cf70905"
CARTER_FORMULATION = BASE.CARTER_FORMULATION
KS_FORMULATION = BASE.KS_FORMULATION

HISTORICAL_ENVELOPE = BASE.ENVELOPE
GEOMETRY = BASE.GEOMETRY
POLARIZATION = BASE.POLARIZATION
ALLOWED_NON_NUMERICAL_DRIFT = {
    "scripts/atlas.mjs": "cli-orchestration",
    "app/components/RelativityResearchWorkbenchV280.tsx": "read-only-ui-projection",
}
NUMERICAL_AUTHORITY_SOURCES = {
    "scripts/run-kerr-authority-v312.py",
    "scripts/run-kerr-polarization-v313.py",
    "scripts/test-kerr-polarization-v313.py",
    "app/lib/kerrAuthorityV312.ts",
    "app/lib/kerrAuthorityV313.ts",
    "app/lib/kerrAuthorityV313.test.ts",
}

canonical = BASE.canonical
value_sha = BASE.value_sha
file_sha = BASE.file_sha
atomic_json = BASE.atomic_json
read_verified = BASE.read_verified
utc = BASE.utc


def build_execution_envelope() -> dict[str, Any]:
    historical = json.loads(HISTORICAL_ENVELOPE.read_text(encoding="utf-8"))
    if historical.get("status") != "full-kerr-short-authority-qualified":
        raise RuntimeError("historical v313 envelope is not qualified")
    # The historical envelope was sealed by the TypeScript/JavaScript
    # canonicalizer (localeCompare ordering), so preserve its fixed identity
    # instead of silently resealing it with Python's key ordering.
    if historical.get("evidenceSha256") != EXPECTED_HISTORICAL_ENVELOPE_CANONICAL_SHA:
        raise RuntimeError("historical v313 envelope identity mismatch")
    source_rows = []
    drift_paths = set()
    for source in historical.get("sourceManifest", []):
        path = source.get("path")
        expected = source.get("sha256")
        if not isinstance(path, str) or not isinstance(expected, str):
            raise RuntimeError("historical v313 source manifest is malformed")
        absolute = ROOT / path
        if not absolute.is_file():
            raise RuntimeError(f"current-worktree source missing: {path}")
        actual = file_sha(absolute)
        matched = actual == expected
        if not matched:
            drift_paths.add(path)
            if path not in ALLOWED_NON_NUMERICAL_DRIFT or path in NUMERICAL_AUTHORITY_SOURCES:
                raise RuntimeError(f"unapproved current-worktree source drift: {path}")
        source_rows.append({
            "path": path,
            "historicalSha256": expected,
            "currentSha256": actual,
            "status": "historical-match" if matched else "allowed-non-numerical-drift",
            "driftClass": None if matched else ALLOWED_NON_NUMERICAL_DRIFT[path],
        })
    if drift_paths != set(ALLOWED_NON_NUMERICAL_DRIFT):
        raise RuntimeError(f"v568 drift set mismatch: {sorted(drift_paths)}")
    unsigned = {
        "version": "v568-current-worktree-dense-execution-envelope-v1",
        "generatedAt": utc(),
        "status": "qualified-current-worktree-execution-envelope",
        "historicalAuthority": {
            "version": "v313",
            "canonicalSha256": historical["evidenceSha256"],
            "fileSha256": file_sha(HISTORICAL_ENVELOPE),
            "geometryCanonicalSha256": EXPECTED_GEOMETRY_SHA,
            "polarizationCanonicalSha256": EXPECTED_POLARIZATION_SHA,
        },
        "sourceManifest": source_rows,
        "allowedNonNumericalDriftPaths": sorted(ALLOWED_NON_NUMERICAL_DRIFT),
        "numericalAuthoritySourceDriftCount": 0,
        "controllerSources": [
            {"path": BASE_CONTROLLER_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(BASE_CONTROLLER_SOURCE)},
            {"path": Path(__file__).resolve().relative_to(ROOT).as_posix(), "sha256": file_sha(Path(__file__).resolve())},
            {"path": BASE.PLANNER_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(BASE.PLANNER_SOURCE)},
        ],
        "executionPolicy": {
            "cpuAuthority": "float64",
            "shardOrder": "strictly-serial-0-through-48",
            "automaticRetry": False,
            "partialAggregate": False,
            "gpuWritesScientificPayload": False,
        },
        "formalProductPointer": "v263",
    }
    return {**unsigned, "envelopeSha256": value_sha(unsigned)}


def verify_execution_envelope() -> dict[str, Any]:
    envelope = read_verified(ENVELOPE, "envelopeSha256")
    for source in envelope.get("sourceManifest", []):
        path = source.get("path")
        if not isinstance(path, str) or not (ROOT / path).is_file() or source.get("currentSha256") != file_sha(ROOT / path):
            raise RuntimeError(f"v568 source drift after envelope seal: {path}")
    for source in envelope.get("controllerSources", []):
        path = source.get("path")
        if not isinstance(path, str) or not (ROOT / path).is_file() or source.get("sha256") != file_sha(ROOT / path):
            raise RuntimeError(f"v568 controller drift after envelope seal: {path}")
    return envelope


def authority(envelope: dict[str, Any]) -> dict[str, Any]:
    geometry = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    polarization = json.loads(POLARIZATION.read_text(encoding="utf-8"))
    if geometry.get("evidenceSha256") != EXPECTED_GEOMETRY_SHA or geometry.get("correctedAuthorityQualified") is not True:
        raise RuntimeError("v312 authority mismatch")
    if (polarization.get("evidenceSha256") != EXPECTED_POLARIZATION_SHA
            or polarization.get("qualified") is not True
            or polarization.get("geometryEvidenceSha256") != EXPECTED_GEOMETRY_SHA):
        raise RuntimeError("v313 authority mismatch")
    return {
        "geometry": geometry,
        "identity": {
            "fullShortAuthoritySha256": FULL_SHORT_AUTHORITY_SHA,
            "geometryCanonicalSha256": EXPECTED_GEOMETRY_SHA,
            "geometryFileSha256": file_sha(GEOMETRY),
            "polarizationCanonicalSha256": EXPECTED_POLARIZATION_SHA,
            "polarizationFileSha256": file_sha(POLARIZATION),
            "historicalEnvelopeCanonicalSha256": envelope["historicalAuthority"]["canonicalSha256"],
            "executionEnvelopeCanonicalSha256": envelope["envelopeSha256"],
            "executionEnvelopeFileSha256": file_sha(ENVELOPE),
        },
    }


def shard_plan() -> list[dict[str, int]]:
    base, remainder = divmod(RAY_COUNT, SHARD_COUNT)
    cursor = 0
    shards = []
    for index in range(SHARD_COUNT):
        count = base + (1 if index < remainder else 0)
        shards.append({"shardIndex": index, "rayStart": cursor, "rayEndExclusive": cursor + count, "rayCount": count, "maxRayCount": 64})
        cursor += count
    return shards


def build_plan(authority_input: dict[str, Any]) -> dict[str, Any]:
    rays = PLANNER.build_rays(authority_input["geometry"])
    unsigned = {
        "version": "v568-kerr-current-worktree-dense-ray-plan-v1",
        "generatedAt": utc(),
        "rayCount": RAY_COUNT,
        "shardCount": SHARD_COUNT,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "strata": {"canonical": 16, "criticalBand": 560, "diskBand": 840, "uniformField": 1681},
        "signedSpins": list(PLANNER.SIGNED_SPINS),
        "rays": [asdict(ray) for ray in rays],
        "shards": shard_plan(),
        "authority": authority_input["identity"],
        "executionPolicy": {"geometry": BASE.CARTER_FORMULATION, "polarization": "v313-wp-independent-transport", "automaticRetry": False},
        "boundary": "v568-current-worktree-envelope-cpu-authority-no-runtime-promotion",
    }
    if len(rays) != RAY_COUNT or sum(item["rayCount"] for item in unsigned["shards"]) != RAY_COUNT:
        raise RuntimeError("v568 plan conservation failed")
    return {**unsigned, "planSha256": value_sha(unsigned)}


def initial_state(authority_input: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    unsigned = {
        "version": "v568-kerr-dense-campaign-state-v1",
        "generatedAt": utc(),
        "status": "incomplete-0-of-49",
        "plannedRayCount": RAY_COUNT,
        "plannedShardCount": SHARD_COUNT,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "completedShardIndices": [],
        "completedShardCount": 0,
        "nextShardIndex": 0,
        "failedShardIndex": None,
        "failure": None,
        "attemptConsumed": False,
        "activeShardIndex": None,
        "partialAggregate": False,
        "aggregateAvailable": False,
        "rayPlanSha256": plan["planSha256"],
        "rayPlanFileSha256": file_sha(PLAN),
        "authority": authority_input["identity"],
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "automaticRetryApplied": False,
        "boundary": "independent-v568-dense-candidate-no-formal-pointer-mutation",
    }
    return {**unsigned, "stateSha256": value_sha(unsigned)}


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(unsigned)
    atomic_json(STATE, state)


def verify_rows(path: Path, expected_rays: list[dict[str, Any]]) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            unsigned = {key: value for key, value in row.items() if key != "raySha256"}
            if count >= len(expected_rays) or row.get("raySha256") != value_sha(unsigned) or row.get("rayIndex") != expected_rays[count].get("rayIndex"):
                raise RuntimeError("v568 ray checkpoint identity mismatch")
            BASE.validate_ray_result(row, expected_rays[count])
            count += 1
    return count


def completed_shards(state: dict[str, Any], plan: dict[str, Any]) -> list[int]:
    completed = []
    for shard in plan["shards"]:
        index = int(shard["shardIndex"])
        data = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = SHARDS / f"shard-{index:02d}.sidecar.json"
        if not data.exists() and not sidecar_path.exists():
            continue
        if not data.exists() or not sidecar_path.exists():
            raise RuntimeError(f"v568 shard {index} publication is incomplete")
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        expected = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
        if (sidecar.get("fileSha256") != file_sha(data)
                or sidecar.get("rayPlanSha256") != plan["planSha256"]
                or sidecar.get("authority") != state["authority"]
                or verify_rows(data, expected) != shard["rayCount"]):
            raise RuntimeError(f"v568 shard {index} publication mismatch")
        completed.append(index)
    if completed != list(range(len(completed))):
        raise RuntimeError("v568 shards are not a strict serial prefix")
    return completed


def validate_state(state: dict[str, Any], plan: dict[str, Any], authority_input: dict[str, Any]) -> None:
    if state.get("authority") != authority_input["identity"] or plan.get("authority") != authority_input["identity"]:
        raise RuntimeError("v568 authority identity changed")
    if state.get("rayPlanSha256") != plan.get("planSha256") or state.get("rayPlanFileSha256") != file_sha(PLAN):
        raise RuntimeError("v568 ray-plan identity changed")
    completed = completed_shards({**state, "completedShardIndices": None}, plan)
    if state.get("completedShardIndices") != completed or state.get("completedShardCount") != len(completed):
        raise RuntimeError("v568 state/published shard mismatch")
    if state.get("automaticRetryApplied") is not False or state.get("formalProductPointer") != "v263":
        raise RuntimeError("v568 campaign boundary changed")


def initialize() -> dict[str, Any]:
    OUT.mkdir(parents=True, exist_ok=True)
    if ENVELOPE.exists():
        envelope = verify_execution_envelope()
    else:
        envelope = build_execution_envelope()
        atomic_json(ENVELOPE, envelope)
        envelope = verify_execution_envelope()
    authority_input = authority(envelope)
    candidate_plan = build_plan(authority_input)
    if PLAN.exists():
        plan = read_verified(PLAN, "planSha256")
        if plan.get("planSha256") != candidate_plan.get("planSha256"):
            raise RuntimeError("v568 sealed ray plan differs from current plan")
    else:
        atomic_json(PLAN, candidate_plan)
        plan = candidate_plan
    if STATE.exists():
        state = read_verified(STATE, "stateSha256")
        validate_state(state, plan, authority_input)
        return state
    state = initial_state(authority_input, plan)
    atomic_json(STATE, state)
    return state


def status() -> dict[str, Any]:
    return initialize()


def authorization_token(index: int) -> str:
    return f"v568-shard-{index}-attempt-1"


def evaluate_ray(ray: dict[str, Any]) -> dict[str, Any]:
    row = BASE.evaluate_ray(ray)
    row.pop("raySha256", None)
    row["version"] = "v568-kerr-current-worktree-dense-ray-result-v1"
    row["authority"] = {
        **row["authority"],
        "executionEnvelope": read_verified(ENVELOPE, "envelopeSha256")["envelopeSha256"],
    }
    return {**row, "raySha256": value_sha(row)}


def append_ray(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n")
        handle.flush()
        os.fsync(handle.fileno())


def shard_audit(index: int, plan: dict[str, Any], state: dict[str, Any], path: Path) -> dict[str, Any]:
    shard = plan["shards"][index]
    metrics = PLANNER.new_dense_metrics()
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                BASE.with_v314_validation(lambda row=json.loads(line): PLANNER.accumulate_dense_metrics(metrics, row))
    qualification = BASE.with_v314_validation(lambda: PLANNER.finalize_dense_metrics(metrics, shard["rayCount"], scope="shard"))
    error_budget = PLANNER.create_dimension_preserving_error_budget(metrics, qualification)
    error_budget["version"] = "v568-dense-kerr-error-budget-v1"
    error_budget["unreportedComponents"]["uReference"] = "held by v312/v313 full-short authority envelope"
    unsigned = {
        "version": "v568-kerr-dense-shard-science-audit-v1", "generatedAt": utc(),
        "status": "shard-structural-qualified", "shardIndex": index,
        "rayStart": shard["rayStart"], "rayEndExclusive": shard["rayEndExclusive"],
        "rayCount": metrics["rayCount"], "executionCount": metrics["executionCount"],
        "path": path.relative_to(ROOT).as_posix(), "fileSha256": file_sha(path),
        "rayPlanSha256": plan["planSha256"], "authority": state["authority"],
        "qualification": qualification, "errorBudget": error_budget,
        "partialAggregate": True, "aggregateEligible": False, "formalProductPointer": "v263", "automaticRetryApplied": False,
    }
    return {**unsigned, "auditSha256": value_sha(unsigned)}


def run_next(token: str | None) -> dict[str, Any]:
    state = status()
    if state.get("failedShardIndex") is not None:
        raise RuntimeError("previous v568 shard failed; automatic retry is forbidden")
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards({**state, "completedShardIndices": None}, plan)
    index = len(completed)
    if index >= SHARD_COUNT:
        raise RuntimeError("v568 campaign already contains all shards")
    if token != authorization_token(index):
        raise RuntimeError(f"explicit authorization token required: {authorization_token(index)}")
    free_memory = PLANNER.available_memory_bytes()
    free_disk = shutil.disk_usage(OUT.parent).free
    if free_memory < MINIMUM_FREE_MEMORY_BYTES or free_disk < MINIMUM_FREE_DISK_BYTES:
        return {**state, "resourcePreflight": {"passed": False, "freeMemoryBytes": free_memory, "freeDiskBytes": free_disk}}
    shard = plan["shards"][index]
    rays = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
    part = CHECKPOINTS / f"shard-{index:02d}.ndjson.part"
    checkpoint = CHECKPOINTS / f"shard-{index:02d}.checkpoint.json"
    resumed = verify_rows(part, rays)
    state.update({"status": f"running-shard-{index}", "attemptConsumed": True, "activeShardIndex": index,
                  "authorizationTokenSha256": hashlib.sha256(token.encode()).hexdigest()})
    save_state(state)
    monitor = PLANNER.PeakRssMonitor()
    try:
        with monitor:
            for local_index in range(resumed, len(rays)):
                row = evaluate_ray(rays[local_index])
                append_ray(part, row)
                checkpoint_unsigned = {
                    "version": "v568-kerr-dense-shard-checkpoint-v1", "generatedAt": utc(),
                    "shardIndex": index, "completedRayCount": local_index + 1,
                    "nextRayIndex": rays[local_index + 1]["rayIndex"] if local_index + 1 < len(rays) else None,
                    "partBytes": part.stat().st_size, "partSha256": file_sha(part),
                    "rayPlanSha256": plan["planSha256"], "authority": state["authority"], "automaticRetryApplied": False,
                }
                atomic_json(checkpoint, {**checkpoint_unsigned, "checkpointSha256": value_sha(checkpoint_unsigned)})
        if monitor.failure is not None or monitor.peak >= PEAK_RSS_LIMIT_BYTES or verify_rows(part, rays) != len(rays):
            raise RuntimeError(f"v568 shard resource or conservation failure: {monitor.failure or monitor.peak}")
        published = SHARDS / f"shard-{index:02d}.ndjson"
        published.parent.mkdir(parents=True, exist_ok=True)
        os.replace(part, published)
        sidecar_unsigned = {
            "version": "v568-kerr-dense-shard-sidecar-v1", "generatedAt": utc(),
            "shardIndex": index, "rayStart": shard["rayStart"], "rayEndExclusive": shard["rayEndExclusive"],
            "rayCount": shard["rayCount"], "executionCount": shard["rayCount"] * EXECUTIONS_PER_RAY,
            "path": published.relative_to(ROOT).as_posix(), "bytes": published.stat().st_size,
            "fileSha256": file_sha(published), "rayPlanSha256": plan["planSha256"], "authority": state["authority"],
            "peakRssBytes": monitor.peak,
            "rssTelemetry": {"status": "measured", "probe": BASE.RSS_TELEMETRY_VERSION, "peakRssBytes": monitor.peak, "limitBytes": PEAK_RSS_LIMIT_BYTES, "gatePassed": True},
            "complete": True, "automaticRetryApplied": False,
        }
        atomic_json(SHARDS / f"shard-{index:02d}.sidecar.json", {**sidecar_unsigned, "sidecarSha256": value_sha(sidecar_unsigned)})
        AUDITS.mkdir(parents=True, exist_ok=True)
        audit = shard_audit(index, plan, state, published)
        atomic_json(AUDITS / f"shard-{index:02d}.science-audit.json", audit)
        completed = completed_shards({**state, "completedShardIndices": None}, plan)
        next_index = len(completed) if len(completed) < SHARD_COUNT else None
        state.update({"status": f"incomplete-{len(completed)}-of-49" if next_index is not None else "complete-awaiting-aggregate",
                      "completedShardIndices": completed, "completedShardCount": len(completed), "nextShardIndex": next_index,
                      "activeShardIndex": None, "failure": None, "peakRssBytes": max(int(state.get("peakRssBytes", 0)), monitor.peak),
                      "aggregateAvailable": next_index is None})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": index, "nextShardIndex": index,
                      "failure": str(error)[:500], "peakRssBytes": monitor.peak, "attemptConsumed": True,
                      "activeShardIndex": None, "aggregateAvailable": False})
        save_state(state)
        raise


def aggregate() -> dict[str, Any]:
    state = status()
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards(state, plan)
    if completed != list(range(SHARD_COUNT)):
        raise RuntimeError(f"partial aggregate refused: {len(completed)}/{SHARD_COUNT} shards")
    metrics = PLANNER.new_dense_metrics()
    shard_rows = []
    for index in completed:
        path = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar = read_verified(SHARDS / f"shard-{index:02d}.sidecar.json", "sidecarSha256")
        shard_rows.append({"index": index, "path": path.relative_to(ROOT).as_posix(), "fileSha256": file_sha(path), "sidecarSha256": sidecar["sidecarSha256"]})
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if line.strip():
                    row = json.loads(line)
                    ray_index = row.get("rayIndex")
                    if not isinstance(ray_index, int) or ray_index < 0 or ray_index >= RAY_COUNT:
                        raise RuntimeError("v568 aggregate ray index is invalid")
                    BASE.validate_ray_result(row, plan["rays"][ray_index])
                    BASE.with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(metrics, row))
    qualification = BASE.with_v314_validation(lambda: PLANNER.finalize_dense_metrics(metrics, RAY_COUNT))
    error_budget = PLANNER.create_dimension_preserving_error_budget(metrics, qualification)
    error_budget["version"] = "v568-dense-kerr-error-budget-v1"
    error_budget["unreportedComponents"]["uReference"] = "held by v312/v313 full-short authority envelope"
    unsigned = {
        "version": "v568-kerr-dense-aggregate-v1", "generatedAt": utc(), "status": "complete",
        "rayCount": metrics["rayCount"], "executionCount": metrics["executionCount"], "shardCount": len(shard_rows),
        "classCounts": metrics["classCounts"],
        "applicablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["applicable-disk-hit"],
        "unavailablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["unavailable"],
        "qualification": qualification, "errorBudget": error_budget, "shards": shard_rows,
        "rayPlanSha256": plan["planSha256"], "authority": state["authority"],
        "partialAggregate": False, "formalProductPointer": "v263",
        "boundary": "complete-v568-dense-cpu-authority-no-runtime-promotion",
    }
    document = {**unsigned, "aggregateSha256": value_sha(unsigned)}
    atomic_json(AGGREGATE, document)
    state.update({"status": "complete", "partialAggregate": False, "aggregateAvailable": True,
                  "aggregate": {"path": AGGREGATE.relative_to(ROOT).as_posix(), "fileSha256": file_sha(AGGREGATE), "canonicalSha256": document["aggregateSha256"]}})
    save_state(state)
    return document


def run_all_authorized(token: str | None) -> dict[str, Any]:
    if token != "v568-all-49-shards-single-campaign-attempt-1":
        raise RuntimeError("explicit v568 full-campaign authorization token required")
    while True:
        state = status()
        if state["completedShardCount"] >= SHARD_COUNT:
            break
        result = run_next(authorization_token(state["completedShardCount"]))
        if result.get("resourcePreflight", {}).get("passed") is False:
            raise RuntimeError("v568 resource preflight failed without consuming the next shard")
        print(json.dumps({"status": result["status"], "completedShardCount": result["completedShardCount"], "stateSha256": result["stateSha256"]}), flush=True)
    return aggregate() if not AGGREGATE.exists() else read_verified(AGGREGATE, "aggregateSha256")


def benchmark(count: int) -> dict[str, Any]:
    initialize()
    plan = read_verified(PLAN, "planSha256")
    selected = plan["rays"][:max(1, min(count, 8))]
    started = time.perf_counter()
    rows = [evaluate_ray(ray) for ray in selected]
    elapsed = time.perf_counter() - started
    return {"version": "v568-dense-benchmark-v1", "rayCount": len(rows), "elapsedSeconds": elapsed,
            "secondsPerRay": elapsed / len(rows), "projectedCampaignHours": elapsed / len(rows) * RAY_COUNT / 3600,
            "stateMutationApplied": False, "raySha256": [row["raySha256"] for row in rows]}


def compact(value: dict[str, Any]) -> dict[str, Any]:
    keys = ("version", "status", "plannedRayCount", "plannedShardCount", "completedShardCount", "nextShardIndex",
            "attemptConsumed", "aggregateAvailable", "stateSha256", "aggregateSha256", "qualification", "rayCount",
            "elapsedSeconds", "secondsPerRay", "projectedCampaignHours", "stateMutationApplied", "resourcePreflight")
    return {key: value[key] for key in keys if key in value}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v568 current-worktree dense CPU-authority campaign")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init", action="store_true")
    group.add_argument("--status", action="store_true")
    group.add_argument("--run-next", action="store_true")
    group.add_argument("--run-all-authorized", action="store_true")
    group.add_argument("--aggregate", action="store_true")
    group.add_argument("--benchmark", type=int)
    parser.add_argument("--authorization-token")
    args = parser.parse_args()
    if args.init:
        result = initialize()
    elif args.status:
        result = status()
    elif args.run_next:
        result = run_next(args.authorization_token)
    elif args.run_all_authorized:
        result = run_all_authorized(args.authorization_token)
    elif args.aggregate:
        result = aggregate()
    else:
        result = benchmark(args.benchmark)
    print(json.dumps(compact(result), indent=2))


if __name__ == "__main__":
    main()

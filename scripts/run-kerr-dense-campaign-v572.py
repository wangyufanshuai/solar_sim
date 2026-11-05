"""Continue dense Kerr qualification with a preregistered solver ladder.

v568 remains immutable failed evidence.  v572 imports only its 22 fully
published, qualified shards and starts shard 22 from the beginning.  Carter
executions use a deterministic solver-control ladder while all scientific
residual thresholds remain unchanged.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
V568_SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v568.py"


def load_v568():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v568_for_v572", V568_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v568 dense implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = load_v568()
PLANNER = BASE.PLANNER
OUT = ROOT / "dist/science/kerr-campaign-v572"
ENVELOPE = OUT / "execution-envelope.json"
PLAN = OUT / "ray-plan.json"
STATE = OUT / "campaign-state.json"
SHARDS = OUT / "shards"
CHECKPOINTS = OUT / "checkpoints"
AUDITS = OUT / "audits"
AGGREGATE = OUT / "dense-aggregate.json"
V568_STATE = BASE.STATE
V568_PLAN = BASE.PLAN
V568_SHARDS = BASE.SHARDS
V568_AUDITS = BASE.AUDITS

RAY_COUNT = BASE.RAY_COUNT
SHARD_COUNT = BASE.SHARD_COUNT
EXECUTIONS_PER_RAY = BASE.EXECUTIONS_PER_RAY
IMPORTED_SHARD_COUNT = 22
MINIMUM_FREE_MEMORY_BYTES = BASE.MINIMUM_FREE_MEMORY_BYTES
MINIMUM_FREE_DISK_BYTES = BASE.MINIMUM_FREE_DISK_BYTES
PEAK_RSS_LIMIT_BYTES = BASE.PEAK_RSS_LIMIT_BYTES
CARTER_FORMULATION = BASE.CARTER_FORMULATION
KS_FORMULATION = BASE.KS_FORMULATION
CONTROL_FACTORS = (1.0, 0.75, 0.5, 0.25, 0.1)
CONTROL_BASE = {"release": 1e-7, "internal": 1e-9}
RESIDUAL_LIMIT = 1e-10

canonical = BASE.canonical
value_sha = BASE.value_sha
file_sha = BASE.file_sha
atomic_json = BASE.atomic_json
read_verified = BASE.read_verified
utc = BASE.utc


def imported_shard_rows(v568_plan: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for index in range(IMPORTED_SHARD_COUNT):
        shard = v568_plan["shards"][index]
        data = V568_SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = V568_SHARDS / f"shard-{index:02d}.sidecar.json"
        audit_path = V568_AUDITS / f"shard-{index:02d}.science-audit.json"
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        audit = read_verified(audit_path, "auditSha256")
        expected = v568_plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
        if (sidecar.get("fileSha256") != file_sha(data)
                or sidecar.get("rayPlanSha256") != v568_plan["planSha256"]
                or BASE.verify_rows(data, expected) != shard["rayCount"]
                or audit.get("status") != "shard-structural-qualified"
                or audit.get("fileSha256") != file_sha(data)
                or audit.get("qualification", {}).get("qualified") is not True):
            raise RuntimeError(f"v572 imported v568 shard {index} is not qualified")
        rows.append({
            "shardIndex": index,
            "rayStart": shard["rayStart"],
            "rayEndExclusive": shard["rayEndExclusive"],
            "rayCount": shard["rayCount"],
            "dataPath": data.relative_to(ROOT).as_posix(),
            "dataSha256": file_sha(data),
            "sidecarPath": sidecar_path.relative_to(ROOT).as_posix(),
            "sidecarSha256": sidecar["sidecarSha256"],
            "auditPath": audit_path.relative_to(ROOT).as_posix(),
            "auditSha256": audit["auditSha256"],
        })
    return rows


def build_envelope() -> dict[str, Any]:
    state = read_verified(V568_STATE, "stateSha256")
    plan = read_verified(V568_PLAN, "planSha256")
    expected_failure = "ray 1416 execution 0 carterResidualNormalized residual failed: 1.2083827913665795e-10>=1e-10"
    if (state.get("status") != "failed-no-automatic-retry"
            or state.get("completedShardIndices") != list(range(IMPORTED_SHARD_COUNT))
            or state.get("completedShardCount") != IMPORTED_SHARD_COUNT
            or state.get("failedShardIndex") != IMPORTED_SHARD_COUNT
            or state.get("failure") != expected_failure
            or state.get("aggregateAvailable") is not False
            or state.get("automaticRetryApplied") is not False):
        raise RuntimeError("v572 expected v568 failure boundary changed")
    imports = imported_shard_rows(plan)
    unsigned = {
        "version": "v572-adaptive-carter-dense-execution-envelope-v1",
        "generatedAt": utc(),
        "status": "qualified-imports-and-adaptive-solver-plan",
        "historicalScienceAuthority": state["authority"],
        "v568FailureEvidence": {
            "statePath": V568_STATE.relative_to(ROOT).as_posix(),
            "stateFileSha256": file_sha(V568_STATE),
            "stateCanonicalSha256": state["stateSha256"],
            "failedShardIndex": state["failedShardIndex"],
            "failure": state["failure"],
            "automaticRetryApplied": False,
        },
        "importedShards": imports,
        "adaptiveSolverPolicy": {
            "scope": "carter-executions-only",
            "controlBase": CONTROL_BASE,
            "controlFactors": list(CONTROL_FACTORS),
            "selection": "first-candidate-passing-unchanged-execution-gates",
            "carterResidualLimit": RESIDUAL_LIMIT,
            "classificationAndSelectedEventKindMustMatchFirstCandidate": True,
            "campaignRetry": False,
            "failedV568ShardImported": False,
        },
        "controllerSources": [
            {"path": Path(__file__).resolve().relative_to(ROOT).as_posix(), "sha256": file_sha(Path(__file__).resolve())},
            {"path": V568_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(V568_SOURCE)},
            {"path": BASE.BASE_CONTROLLER_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(BASE.BASE_CONTROLLER_SOURCE)},
            {"path": BASE.BASE.PLANNER_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(BASE.BASE.PLANNER_SOURCE)},
        ],
        "formalProductPointer": "v263",
        "automaticRetry": False,
    }
    return {**unsigned, "envelopeSha256": value_sha(unsigned)}


def verify_envelope() -> dict[str, Any]:
    envelope = read_verified(ENVELOPE, "envelopeSha256")
    for source in envelope["controllerSources"]:
        path = ROOT / source["path"]
        if not path.is_file() or file_sha(path) != source["sha256"]:
            raise RuntimeError(f"v572 controller source drift: {source['path']}")
    for row in envelope["importedShards"]:
        for path_key, sha_key in (("dataPath", "dataSha256"), ("sidecarPath", "sidecarSha256"), ("auditPath", "auditSha256")):
            path = ROOT / row[path_key]
            if not path.is_file():
                raise RuntimeError(f"v572 imported artifact missing: {row[path_key]}")
            if path_key == "dataPath" and file_sha(path) != row[sha_key]:
                raise RuntimeError(f"v572 imported data drift: {row[path_key]}")
            if path_key != "dataPath":
                field = "sidecarSha256" if path_key == "sidecarPath" else "auditSha256"
                if read_verified(path, field)[field] != row[sha_key]:
                    raise RuntimeError(f"v572 imported receipt drift: {row[path_key]}")
    return envelope


def authority(envelope: dict[str, Any]) -> dict[str, Any]:
    v568_plan = read_verified(V568_PLAN, "planSha256")
    identity = dict(v568_plan["authority"])
    identity["adaptiveExecutionEnvelopeCanonicalSha256"] = envelope["envelopeSha256"]
    identity["adaptiveExecutionEnvelopeFileSha256"] = file_sha(ENVELOPE)
    return {"identity": identity, "v568Plan": v568_plan}


def build_plan(authority_input: dict[str, Any]) -> dict[str, Any]:
    source = authority_input["v568Plan"]
    unsigned = {
        "version": "v572-kerr-adaptive-dense-ray-plan-v1",
        "generatedAt": utc(),
        "rayCount": source["rayCount"],
        "shardCount": source["shardCount"],
        "executionsPerRay": source["executionsPerRay"],
        "strata": source["strata"],
        "signedSpins": source["signedSpins"],
        "rays": source["rays"],
        "shards": source["shards"],
        "authority": authority_input["identity"],
        "importedQualifiedShardCount": IMPORTED_SHARD_COUNT,
        "executionPolicy": {"carter": "v572-preregistered-adaptive-control-ladder", "ks": source["executionPolicy"]["geometry"], "polarization": "v313-wp-independent-transport", "automaticRetry": False},
        "boundary": "v572-new-namespace-imports-only-fully-qualified-v568-shards",
    }
    return {**unsigned, "planSha256": value_sha(unsigned)}


def initial_state(authority_input: dict[str, Any], plan: dict[str, Any], envelope: dict[str, Any]) -> dict[str, Any]:
    unsigned = {
        "version": "v572-kerr-adaptive-dense-campaign-state-v1",
        "generatedAt": utc(),
        "status": f"incomplete-{IMPORTED_SHARD_COUNT}-of-49",
        "plannedRayCount": RAY_COUNT,
        "plannedShardCount": SHARD_COUNT,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "completedShardIndices": list(range(IMPORTED_SHARD_COUNT)),
        "completedShardCount": IMPORTED_SHARD_COUNT,
        "importedShardCount": IMPORTED_SHARD_COUNT,
        "nextShardIndex": IMPORTED_SHARD_COUNT,
        "failedShardIndex": None,
        "failure": None,
        "attemptConsumed": False,
        "activeShardIndex": None,
        "partialAggregate": False,
        "aggregateAvailable": False,
        "rayPlanSha256": plan["planSha256"],
        "rayPlanFileSha256": file_sha(PLAN),
        "authority": authority_input["identity"],
        "importManifestSha256": value_sha(envelope["importedShards"]),
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "automaticRetryApplied": False,
        "boundary": "v568-failure-preserved-v572-shard-22-first-attempt",
    }
    return {**unsigned, "stateSha256": value_sha(unsigned)}


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(unsigned)
    atomic_json(STATE, state)


def verify_rows(path: Path, expected: list[dict[str, Any]]) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            unsigned = {key: value for key, value in row.items() if key != "raySha256"}
            if count >= len(expected) or row.get("raySha256") != value_sha(unsigned) or row.get("rayIndex") != expected[count]["rayIndex"]:
                raise RuntimeError("v572 ray checkpoint identity mismatch")
            BASE.BASE.validate_ray_result(row, expected[count])
            count += 1
    return count


def completed_shards(state: dict[str, Any], plan: dict[str, Any], envelope: dict[str, Any]) -> list[int]:
    imported = [row["shardIndex"] for row in envelope["importedShards"]]
    if imported != list(range(IMPORTED_SHARD_COUNT)):
        raise RuntimeError("v572 imported shard prefix changed")
    completed = list(imported)
    for index in range(IMPORTED_SHARD_COUNT, SHARD_COUNT):
        shard = plan["shards"][index]
        data = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = SHARDS / f"shard-{index:02d}.sidecar.json"
        if not data.exists() and not sidecar_path.exists():
            break
        if not data.exists() or not sidecar_path.exists():
            raise RuntimeError(f"v572 shard {index} publication incomplete")
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        expected = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
        if (sidecar.get("fileSha256") != file_sha(data)
                or sidecar.get("rayPlanSha256") != plan["planSha256"]
                or sidecar.get("authority") != state["authority"]
                or verify_rows(data, expected) != shard["rayCount"]):
            raise RuntimeError(f"v572 shard {index} publication mismatch")
        completed.append(index)
    if completed != list(range(len(completed))):
        raise RuntimeError("v572 shard prefix is not contiguous")
    return completed


def initialize() -> dict[str, Any]:
    OUT.mkdir(parents=True, exist_ok=True)
    if ENVELOPE.exists():
        envelope = verify_envelope()
    else:
        envelope = build_envelope()
        atomic_json(ENVELOPE, envelope)
        envelope = verify_envelope()
    authority_input = authority(envelope)
    candidate_plan = build_plan(authority_input)
    if PLAN.exists():
        plan = read_verified(PLAN, "planSha256")
        if plan["planSha256"] != candidate_plan["planSha256"]:
            raise RuntimeError("v572 sealed plan differs")
    else:
        atomic_json(PLAN, candidate_plan)
        plan = candidate_plan
    if STATE.exists():
        state = read_verified(STATE, "stateSha256")
        completed = completed_shards({**state, "completedShardIndices": None}, plan, envelope)
        if state.get("completedShardIndices") != completed or state.get("completedShardCount") != len(completed):
            raise RuntimeError("v572 state/published shard mismatch")
        return state
    state = initial_state(authority_input, plan, envelope)
    atomic_json(STATE, state)
    return state


def status() -> dict[str, Any]:
    return initialize()


def carter_candidate(ray: dict[str, Any], fixture: Any, tolerance_class: str, branch: str) -> dict[str, Any]:
    declared = BASE.BASE.BASE.RELEASE_TOLERANCE if tolerance_class == "release" else BASE.BASE.BASE.INTERNAL_TOLERANCE
    first_geometry = None
    failures = []
    for attempt, factor in enumerate(CONTROL_FACTORS):
        control = CONTROL_BASE[tolerance_class] * factor
        frozen_interval = BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL
        BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL = BASE.BASE.V312.V312_CONSTRAINT_PROJECTION_INTERVAL
        try:
            raw = BASE.BASE.V312.V296.evaluate_carter_stabilized(fixture, control, branch)
        finally:
            BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL = frozen_interval
        row = {
            **raw,
            "formulation": CARTER_FORMULATION,
            "tolerance": declared,
            "declaredTolerance": declared,
            "toleranceClass": tolerance_class,
            "solverControlInput": control,
            "solverTolerance": float(raw["solverTolerance"]),
            "solverPolicy": "v572-preregistered-adaptive-control-ladder",
            "adaptiveSolverAttemptIndex": attempt,
            "adaptiveSolverControlFactor": factor,
            "adaptiveSolverControlFactors": list(CONTROL_FACTORS),
        }
        geometry = (row.get("classification"), row.get("selectedEvent", {}).get("kind"))
        if first_geometry is None:
            first_geometry = geometry
        elif geometry != first_geometry:
            raise RuntimeError(f"v572 adaptive solver changed physical branch for ray {ray['rayIndex']}")
        row["polarization"] = BASE.BASE.polarization_payload(row, fixture)
        try:
            BASE.BASE.with_v314_validation(lambda row=row: PLANNER.validate_execution(row, ray, f"v572 ray {ray['rayIndex']} {tolerance_class}"))
            row["adaptiveSolverFailuresBeforeSelection"] = failures
            return row
        except RuntimeError as error:
            failures.append({"attemptIndex": attempt, "controlFactor": factor, "reason": str(error)[:300]})
    raise RuntimeError(f"v572 adaptive Carter ladder exhausted for ray {ray['rayIndex']}: {failures[-1]['reason']}")


def evaluate_ray(ray: dict[str, Any]) -> dict[str, Any]:
    fixture = BASE.BASE.fixture(ray)
    executions = []
    for tolerance_class, declared in (("release", BASE.BASE.BASE.RELEASE_TOLERANCE), ("internal", BASE.BASE.BASE.INTERNAL_TOLERANCE)):
        for branch in ("A", "B"):
            carter = carter_candidate(ray, fixture, tolerance_class, branch)
            ks = BASE.BASE.V312.evaluate_ks_corrected(fixture, declared, branch)
            ks["formulation"] = KS_FORMULATION
            ks["polarization"] = BASE.BASE.polarization_payload(ks, fixture)
            executions.extend((carter, ks))
    result = {
        "version": "v572-kerr-adaptive-dense-ray-result-v1",
        "rayIndex": ray["rayIndex"], "rayId": ray["rayId"], "stratum": ray["stratum"],
        "alphaM": ray["alphaM"], "betaM": ray["betaM"], "spinA": ray["spinA"],
        "executionCount": len(executions),
        "classifications": sorted({str(row.get("classification")) for row in executions}),
        "executions": executions,
        "authority": {"fullShort": BASE.FULL_SHORT_AUTHORITY_SHA, "geometry": BASE.EXPECTED_GEOMETRY_SHA, "polarization": BASE.EXPECTED_POLARIZATION_SHA, "adaptiveExecutionEnvelope": read_verified(ENVELOPE, "envelopeSha256")["envelopeSha256"]},
    }
    BASE.BASE.validate_ray_result(result, ray)
    return {**result, "raySha256": value_sha(result)}


def append_ray(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n")
        handle.flush()
        os.fsync(handle.fileno())


def shard_audit(index: int, plan: dict[str, Any], state: dict[str, Any], path: Path) -> dict[str, Any]:
    shard = plan["shards"][index]
    metrics = PLANNER.new_dense_metrics()
    adaptive_counts: dict[str, int] = {}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            BASE.BASE.with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(metrics, row))
            for execution in row["executions"]:
                if execution["formulation"] == CARTER_FORMULATION:
                    key = str(execution.get("adaptiveSolverControlFactor"))
                    adaptive_counts[key] = adaptive_counts.get(key, 0) + 1
    qualification = BASE.BASE.with_v314_validation(lambda: PLANNER.finalize_dense_metrics(metrics, shard["rayCount"], scope="shard"))
    error_budget = PLANNER.create_dimension_preserving_error_budget(metrics, qualification)
    error_budget["version"] = "v572-dense-kerr-error-budget-v1"
    unsigned = {
        "version": "v572-kerr-adaptive-dense-shard-science-audit-v1", "generatedAt": utc(),
        "status": "shard-structural-qualified", "shardIndex": index,
        "rayStart": shard["rayStart"], "rayEndExclusive": shard["rayEndExclusive"],
        "rayCount": metrics["rayCount"], "executionCount": metrics["executionCount"],
        "path": path.relative_to(ROOT).as_posix(), "fileSha256": file_sha(path),
        "rayPlanSha256": plan["planSha256"], "authority": state["authority"],
        "adaptiveSolverControlFactorCounts": adaptive_counts,
        "qualification": qualification, "errorBudget": error_budget,
        "partialAggregate": True, "aggregateEligible": False, "formalProductPointer": "v263", "automaticRetryApplied": False,
    }
    return {**unsigned, "auditSha256": value_sha(unsigned)}


def authorization_token(index: int) -> str:
    return f"v572-shard-{index}-attempt-1"


def run_next(token: str | None) -> dict[str, Any]:
    state = status()
    if state.get("failedShardIndex") is not None:
        raise RuntimeError("previous v572 shard failed; automatic retry is forbidden")
    envelope = verify_envelope()
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards({**state, "completedShardIndices": None}, plan, envelope)
    index = len(completed)
    if index >= SHARD_COUNT:
        raise RuntimeError("v572 campaign already contains all shards")
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
    state.update({"status": f"running-shard-{index}", "attemptConsumed": True, "activeShardIndex": index, "authorizationTokenSha256": hashlib.sha256(token.encode()).hexdigest()})
    save_state(state)
    monitor = PLANNER.PeakRssMonitor()
    try:
        with monitor:
            for local_index in range(resumed, len(rays)):
                row = evaluate_ray(rays[local_index])
                append_ray(part, row)
                checkpoint_unsigned = {"version": "v572-kerr-adaptive-dense-shard-checkpoint-v1", "generatedAt": utc(), "shardIndex": index, "completedRayCount": local_index + 1, "nextRayIndex": rays[local_index + 1]["rayIndex"] if local_index + 1 < len(rays) else None, "partBytes": part.stat().st_size, "partSha256": file_sha(part), "rayPlanSha256": plan["planSha256"], "authority": state["authority"], "automaticRetryApplied": False}
                atomic_json(checkpoint, {**checkpoint_unsigned, "checkpointSha256": value_sha(checkpoint_unsigned)})
        if monitor.failure is not None or monitor.peak >= PEAK_RSS_LIMIT_BYTES or verify_rows(part, rays) != len(rays):
            raise RuntimeError(f"v572 shard resource or conservation failure: {monitor.failure or monitor.peak}")
        published = SHARDS / f"shard-{index:02d}.ndjson"
        published.parent.mkdir(parents=True, exist_ok=True)
        os.replace(part, published)
        sidecar_unsigned = {"version": "v572-kerr-adaptive-dense-shard-sidecar-v1", "generatedAt": utc(), "shardIndex": index, "rayStart": shard["rayStart"], "rayEndExclusive": shard["rayEndExclusive"], "rayCount": shard["rayCount"], "executionCount": shard["rayCount"] * EXECUTIONS_PER_RAY, "path": published.relative_to(ROOT).as_posix(), "bytes": published.stat().st_size, "fileSha256": file_sha(published), "rayPlanSha256": plan["planSha256"], "authority": state["authority"], "peakRssBytes": monitor.peak, "rssTelemetry": {"status": "measured", "probe": BASE.BASE.RSS_TELEMETRY_VERSION, "peakRssBytes": monitor.peak, "limitBytes": PEAK_RSS_LIMIT_BYTES, "gatePassed": True}, "complete": True, "automaticRetryApplied": False}
        atomic_json(SHARDS / f"shard-{index:02d}.sidecar.json", {**sidecar_unsigned, "sidecarSha256": value_sha(sidecar_unsigned)})
        AUDITS.mkdir(parents=True, exist_ok=True)
        audit = shard_audit(index, plan, state, published)
        atomic_json(AUDITS / f"shard-{index:02d}.science-audit.json", audit)
        completed = completed_shards({**state, "completedShardIndices": None}, plan, envelope)
        next_index = len(completed) if len(completed) < SHARD_COUNT else None
        state.update({"status": f"incomplete-{len(completed)}-of-49" if next_index is not None else "complete-awaiting-aggregate", "completedShardIndices": completed, "completedShardCount": len(completed), "nextShardIndex": next_index, "activeShardIndex": None, "failure": None, "peakRssBytes": max(int(state.get("peakRssBytes", 0)), monitor.peak), "aggregateAvailable": next_index is None})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": index, "nextShardIndex": index, "failure": str(error)[:500], "peakRssBytes": monitor.peak, "attemptConsumed": True, "activeShardIndex": None, "aggregateAvailable": False})
        save_state(state)
        raise


def aggregate() -> dict[str, Any]:
    state = status()
    envelope = verify_envelope()
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards(state, plan, envelope)
    if completed != list(range(SHARD_COUNT)):
        raise RuntimeError(f"partial aggregate refused: {len(completed)}/{SHARD_COUNT} shards")
    metrics = PLANNER.new_dense_metrics()
    shard_rows = []
    for index in completed:
        imported = index < IMPORTED_SHARD_COUNT
        path = (V568_SHARDS if imported else SHARDS) / f"shard-{index:02d}.ndjson"
        sidecar_path = (V568_SHARDS if imported else SHARDS) / f"shard-{index:02d}.sidecar.json"
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        shard_rows.append({"index": index, "importedFromV568": imported, "path": path.relative_to(ROOT).as_posix(), "fileSha256": file_sha(path), "sidecarSha256": sidecar["sidecarSha256"]})
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if line.strip():
                    row = json.loads(line)
                    ray_index = row.get("rayIndex")
                    if not isinstance(ray_index, int) or not 0 <= ray_index < RAY_COUNT:
                        raise RuntimeError("v572 aggregate ray index invalid")
                    (BASE.verify_rows if imported else verify_rows)
                    BASE.BASE.validate_ray_result(row, plan["rays"][ray_index])
                    BASE.BASE.with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(metrics, row))
    qualification = BASE.BASE.with_v314_validation(lambda: PLANNER.finalize_dense_metrics(metrics, RAY_COUNT))
    error_budget = PLANNER.create_dimension_preserving_error_budget(metrics, qualification)
    error_budget["version"] = "v572-dense-kerr-error-budget-v1"
    unsigned = {"version": "v572-kerr-adaptive-dense-aggregate-v1", "generatedAt": utc(), "status": "complete", "rayCount": metrics["rayCount"], "executionCount": metrics["executionCount"], "shardCount": len(shard_rows), "importedQualifiedShardCount": IMPORTED_SHARD_COUNT, "classCounts": metrics["classCounts"], "applicablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["applicable-disk-hit"], "unavailablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["unavailable"], "qualification": qualification, "errorBudget": error_budget, "shards": shard_rows, "rayPlanSha256": plan["planSha256"], "authority": state["authority"], "partialAggregate": False, "formalProductPointer": "v263", "boundary": "complete-v572-dense-cpu-authority-v568-failure-preserved-no-runtime-promotion"}
    document = {**unsigned, "aggregateSha256": value_sha(unsigned)}
    atomic_json(AGGREGATE, document)
    state.update({"status": "complete", "partialAggregate": False, "aggregateAvailable": True, "aggregate": {"path": AGGREGATE.relative_to(ROOT).as_posix(), "fileSha256": file_sha(AGGREGATE), "canonicalSha256": document["aggregateSha256"]}})
    save_state(state)
    return document


def run_all(token: str | None) -> dict[str, Any]:
    if token != "v572-shards-22-through-48-single-campaign-attempt-1":
        raise RuntimeError("explicit v572 continuation authorization token required")
    while True:
        state = status()
        if state["completedShardCount"] >= SHARD_COUNT:
            break
        result = run_next(authorization_token(state["completedShardCount"]))
        if result.get("resourcePreflight", {}).get("passed") is False:
            raise RuntimeError("v572 resource preflight failed without consuming the next shard")
        print(json.dumps({"status": result["status"], "completedShardCount": result["completedShardCount"], "stateSha256": result["stateSha256"]}), flush=True)
    return aggregate() if not AGGREGATE.exists() else read_verified(AGGREGATE, "aggregateSha256")


def diagnose_ray(index: int) -> dict[str, Any]:
    initialize()
    plan = read_verified(PLAN, "planSha256")
    row = evaluate_ray(plan["rays"][index])
    return {"version": "v572-adaptive-ray-diagnostic-v1", "rayIndex": index, "rayId": row["rayId"], "classifications": row["classifications"], "selectedControlFactors": [execution.get("adaptiveSolverControlFactor") for execution in row["executions"] if execution["formulation"] == CARTER_FORMULATION], "maxCarterResidualNormalized": max(float(execution["carterResidualNormalized"]) for execution in row["executions"] if execution["formulation"] == CARTER_FORMULATION), "stateMutationApplied": False, "raySha256": row["raySha256"]}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v572 adaptive dense campaign")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init", action="store_true")
    group.add_argument("--status", action="store_true")
    group.add_argument("--run-next", action="store_true")
    group.add_argument("--run-all-authorized", action="store_true")
    group.add_argument("--aggregate", action="store_true")
    group.add_argument("--diagnose-ray", type=int)
    parser.add_argument("--authorization-token")
    args = parser.parse_args()
    if args.init:
        result = initialize()
    elif args.status:
        result = status()
    elif args.run_next:
        result = run_next(args.authorization_token)
    elif args.run_all_authorized:
        result = run_all(args.authorization_token)
    elif args.aggregate:
        result = aggregate()
    else:
        result = diagnose_ray(args.diagnose_ray)
    keys = ("version", "status", "completedShardCount", "nextShardIndex", "failedShardIndex", "failure", "aggregateAvailable", "stateSha256", "aggregateSha256", "rayIndex", "rayId", "classifications", "selectedControlFactors", "maxCarterResidualNormalized", "stateMutationApplied", "raySha256")
    print(json.dumps({key: result[key] for key in keys if key in result}, indent=2))


if __name__ == "__main__":
    main()

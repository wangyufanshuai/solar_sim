"""Initialize the v312/v313-locked corrected dense Kerr campaign namespace.

This low-memory controller intentionally implements plan/state/status and a
fail-closed aggregate check only.  It has no shard execution path, so creating
the namespace cannot consume the user's future dense-shard authorization.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PLANNER_SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v298r1.py"
GEOMETRY = ROOT / "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"
POLARIZATION = ROOT / "dist/science/kerr-reference-v313/polarization-short-gate.json"
ENVELOPE = ROOT / "dist/science/kerr-reference-v313/portable-envelope.json"
OUT = ROOT / "dist/science/kerr-campaign-v314"
PLAN = OUT / "ray-plan.json"
STATE = OUT / "campaign-state.json"
HISTORY = OUT / "initialization-history"
SHARDS = OUT / "shards"
CHECKPOINTS = OUT / "checkpoints"
AUDITS = OUT / "audits"
V312_SOURCE = ROOT / "scripts/run-kerr-authority-v312.py"
V313_SOURCE = ROOT / "scripts/run-kerr-polarization-v313.py"

RAY_COUNT = 3097
SHARD_COUNT = 49
EXECUTIONS_PER_RAY = 8
MINIMUM_FREE_MEMORY_BYTES = 4 * 2**30
MINIMUM_FREE_DISK_BYTES = 30 * 2**30
PEAK_RSS_LIMIT_BYTES = 2 * 2**30
RSS_TELEMETRY_VERSION = "process-peak-working-set-v314-r1"
CARTER_FORMULATION = "carter-mino-dop853-constraint-stabilized-v312"
KS_FORMULATION = "cartesian-kerr-schild-hamiltonian-dop853-v312"
EXPECTED_GEOMETRY_SHA = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e"
EXPECTED_POLARIZATION_SHA = "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f"
FULL_SHORT_AUTHORITY_SHA = "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v298r1_planner_for_v314", PLANNER_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load frozen v298r1 ray planner")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


PLANNER = load_module()


def load_science_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load corrected authority: {path.name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V312 = load_science_module("orbit_atlas_kerr_v312_for_v314", V312_SOURCE)
V313 = load_science_module("orbit_atlas_kerr_v313_for_v314", V313_SOURCE)
BASE = V312.BASE


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(unsigned)
    atomic_json(STATE, state)


def read_verified(path: Path, field: str) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    expected = document.get(field)
    unsigned = {key: value for key, value in document.items() if key != field}
    if not isinstance(expected, str) or value_sha(unsigned) != expected:
        raise RuntimeError(f"canonical SHA mismatch: {path.relative_to(ROOT).as_posix()}")
    return document


def authority() -> dict[str, Any]:
    geometry = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    polarization = json.loads(POLARIZATION.read_text(encoding="utf-8"))
    envelope = json.loads(ENVELOPE.read_text(encoding="utf-8"))
    if geometry.get("evidenceSha256") != EXPECTED_GEOMETRY_SHA or geometry.get("correctedAuthorityQualified") is not True:
        raise RuntimeError("v312 authority mismatch")
    if polarization.get("evidenceSha256") != EXPECTED_POLARIZATION_SHA or polarization.get("qualified") is not True or polarization.get("geometryEvidenceSha256") != EXPECTED_GEOMETRY_SHA:
        raise RuntimeError("v313 authority mismatch")
    if (envelope.get("status") != "full-kerr-short-authority-qualified"
        or not isinstance(envelope.get("evidenceSha256"), str) or len(envelope["evidenceSha256"]) != 64
        or envelope.get("geometry", {}).get("evidenceSha256") != EXPECTED_GEOMETRY_SHA
        or envelope.get("polarization", {}).get("evidenceSha256") != EXPECTED_POLARIZATION_SHA):
        raise RuntimeError("v313 envelope mismatch")
    sources = envelope.get("sourceManifest")
    if not isinstance(sources, list) or not sources:
        raise RuntimeError("v313 envelope source manifest missing")
    for source in sources:
        if not isinstance(source, dict) or not isinstance(source.get("path"), str) or source.get("sha256") != file_sha(ROOT / source["path"]):
            raise RuntimeError("v313 envelope source manifest drift")
    return {
        "geometry": geometry,
        "provenance": {"envelopeCanonicalSha256": envelope["evidenceSha256"], "envelopeFileSha256": file_sha(ENVELOPE)},
        "identity": {
            "fullShortAuthoritySha256": FULL_SHORT_AUTHORITY_SHA,
            "geometryCanonicalSha256": EXPECTED_GEOMETRY_SHA,
            "geometryFileSha256": file_sha(GEOMETRY),
            "polarizationCanonicalSha256": EXPECTED_POLARIZATION_SHA,
            "polarizationFileSha256": file_sha(POLARIZATION),
            "plannerSourceSha256": file_sha(PLANNER_SOURCE),
            "controllerSourceSha256": file_sha(Path(__file__)),
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
        "version": "v314-kerr-corrected-dense-ray-plan-v1",
        "generatedAt": utc(),
        "rayCount": RAY_COUNT,
        "shardCount": SHARD_COUNT,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "strata": {"canonical": 16, "criticalBand": 560, "diskBand": 840, "uniformField": 1681},
        "signedSpins": list(PLANNER.SIGNED_SPINS),
        "rays": [asdict(ray) for ray in rays],
        "shards": shard_plan(),
        "authority": authority_input["identity"],
        "executionPolicy": {"geometry": "v312-explicit-release-1e-11-internal-1e-13", "polarization": "v313-wp-independent-ks-transport", "automaticRetry": False},
        "boundary": "deterministic-plan-only-no-shard-execution-authorization-consumed",
    }
    if len(rays) != RAY_COUNT or sum(item["rayCount"] for item in unsigned["shards"]) != RAY_COUNT or any(item["rayCount"] > 64 for item in unsigned["shards"]):
        raise RuntimeError("v314 plan conservation failed")
    return {**unsigned, "planSha256": value_sha(unsigned)}


def initial_state(authority_input: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    unsigned = {
        "version": "v314-kerr-corrected-dense-campaign-state-v1",
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
        "runNextAuthorized": False,
        "runNextAvailable": False,
        "controllerImplementation": "v312-v313-locked-streaming-ndjson-v1",
        "partialAggregate": False,
        "aggregateAvailable": False,
        "rayPlanSha256": plan["planSha256"],
        "rayPlanFileSha256": file_sha(PLAN),
        "authority": authority_input["identity"],
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "boundary": "new-corrected-namespace-no-shard-execution-without-explicit-future-implementation-and-authorization",
    }
    return {**unsigned, "stateSha256": value_sha(unsigned)}


def validate(plan: dict[str, Any], state: dict[str, Any], authority_input: dict[str, Any]) -> None:
    if plan.get("authority") != authority_input["identity"] or state.get("authority") != authority_input["identity"]:
        raise RuntimeError("v314 authority identity changed")
    if state.get("rayPlanSha256") != plan.get("planSha256") or state.get("rayPlanFileSha256") != file_sha(PLAN):
        raise RuntimeError("v314 ray-plan identity changed")
    if state.get("completedShardCount") != 0 or state.get("completedShardIndices") != [] or state.get("attemptConsumed") is not False or state.get("runNextAvailable") is not False:
        raise RuntimeError("v314 unauthorized shard state mutation")


def initialize() -> dict[str, Any]:
    authority_input = authority()
    plan = build_plan(authority_input)
    if PLAN.exists():
        existing_plan = read_verified(PLAN, "planSha256")
        if existing_plan.get("planSha256") != plan.get("planSha256"):
            if not STATE.exists():
                raise RuntimeError("existing v314 plan differs without a state lock")
            existing_state = read_verified(STATE, "stateSha256")
            if existing_state.get("completedShardCount") != 0 or existing_state.get("attemptConsumed") is not False or existing_state.get("aggregateAvailable") is not False:
                raise RuntimeError("existing v314 plan differs after campaign consumption")
            HISTORY.mkdir(parents=True, exist_ok=True)
            atomic_json(HISTORY / f"state-{existing_state['stateSha256']}.json", existing_state)
            atomic_json(HISTORY / f"plan-{existing_plan['planSha256']}.json", existing_plan)
            atomic_json(PLAN, plan)
            state = initial_state(authority_input, plan)
            atomic_json(STATE, state)
            return state
        plan = existing_plan
    else:
        atomic_json(PLAN, plan)
    if STATE.exists():
        state = read_verified(STATE, "stateSha256")
        validate(plan, state, authority_input)
        return state
    state = initial_state(authority_input, plan)
    atomic_json(STATE, state)
    return state


def status() -> dict[str, Any]:
    state = initialize()
    plan = read_verified(PLAN, "planSha256")
    validate(plan, state, authority())
    return state


def fixture(ray: dict[str, Any]):
    return BASE.RayFixture(ray["rayId"], float(ray["alphaM"]), float(ray["betaM"]), float(ray["spinA"]), ray["expectedFamily"])


def with_v314_validation(builder):
    original_base = PLANNER.BASE
    original_carter = PLANNER.CARTER_FORMULATION
    original_ks = PLANNER.KS_FORMULATION
    PLANNER.BASE = BASE
    PLANNER.CARTER_FORMULATION = CARTER_FORMULATION
    PLANNER.KS_FORMULATION = KS_FORMULATION
    try:
        return builder()
    finally:
        PLANNER.BASE = original_base
        PLANNER.CARTER_FORMULATION = original_carter
        PLANNER.KS_FORMULATION = original_ks


def validate_ray_result(row: dict[str, Any], expected_ray: dict[str, Any]) -> None:
    compatibility = {**row, "version": "v298r1-kerr-dense-ray-result-v1"}
    with_v314_validation(lambda: PLANNER.validate_ray_result(compatibility, expected_ray))


def polarization_payload(row: dict[str, Any], ray_fixture: Any) -> dict[str, Any]:
    if row.get("classification") != "disk-hit":
        return {"applicability": "not-applicable", "reason": "no-disk-emission-event"}
    if row.get("formulation") != CARTER_FORMULATION:
        return {"applicability": "geometry-cross-check-only", "reason": "v313-polarization-seed-authority-is-carter"}
    seed = row.get("polarizationSeed")
    if not isinstance(seed, dict):
        return {"applicability": "unavailable", "reason": "missing-polarization-seed"}
    try:
        authority = V313.V297
        coordinates = np.asarray(seed["coordinatesBl"], dtype=float)
        wavevector = np.asarray(seed["wavevectorBl"], dtype=float)
        emitter, polarization, emitter_residuals = authority.projected_disk_normal_polarization(coordinates, wavevector, ray_fixture.spin)
        constant = authority.walker_penrose_constant(ray_fixture.spin, float(coordinates[1]), float(coordinates[2]), wavevector, polarization)
        observer_coordinates = np.asarray((0.0, BASE.R_OBSERVER, BASE.THETA_OBSERVER, 0.0), dtype=float)
        observer_tetrad = BASE.zamo_tetrad(BASE.R_OBSERVER, BASE.THETA_OBSERVER, ray_fixture.spin)
        observer = observer_tetrad[:, 0]
        expected_wavevector = BASE.initial_bl_state(ray_fixture)["momentumUp"]
        reconstructed = authority.reconstruct_walker_penrose(observer_coordinates, expected_wavevector, observer, constant, ray_fixture.spin)
        direct = authority.direct_parallel_transport(coordinates, wavevector, polarization, ray_fixture.spin, float(row["tolerance"]), constant)
        if not direct.get("success"):
            raise RuntimeError(str(direct.get("failure") or "parallel-transport-failed"))
        direct_coordinates = np.asarray(direct["coordinatesBl"], dtype=float)
        direct_wavevector = np.asarray(direct["wavevectorBl"], dtype=float)
        direct_polarization = np.asarray(direct["polarizationBl"], dtype=float)
        direct_observer = BASE.zamo_tetrad(float(direct_coordinates[1]), float(direct_coordinates[2]), ray_fixture.spin)[:, 0]
        wp_evpa = authority.screen_evpa_deg(observer_coordinates, expected_wavevector, reconstructed, observer, ray_fixture.spin)
        pt_evpa = authority.screen_evpa_deg(direct_coordinates, direct_wavevector, direct_polarization, direct_observer, ray_fixture.spin)
        return {
            "applicability": "applicable-disk-hit",
            "emitterModel": "projected-disk-normal",
            "walkerPenroseEvpaDeg": wp_evpa,
            "parallelTransportEvpaDeg": pt_evpa,
            "evpaDifferenceDeg": authority.evpa_difference(wp_evpa, pt_evpa),
            "walkerPenroseConstant": {"real": constant.real, "imaginary": constant.imag},
            "emitterResiduals": emitter_residuals,
            "parallelTransport": {key: value for key, value in direct.items() if key not in {"coordinatesBl", "wavevectorBl", "polarizationBl"}},
        }
    except (RuntimeError, ValueError, FloatingPointError) as error:
        return {"applicability": "unavailable", "reason": str(error)[:240]}


def evaluate_ray(ray: dict[str, Any]) -> dict[str, Any]:
    ray_fixture = fixture(ray)
    executions: list[dict[str, Any]] = []
    for tolerance in (BASE.RELEASE_TOLERANCE, BASE.INTERNAL_TOLERANCE):
        for branch in ("A", "B"):
            carter = V312.evaluate_carter_corrected(ray_fixture, tolerance, branch)
            carter["formulation"] = CARTER_FORMULATION
            carter["polarization"] = polarization_payload(carter, ray_fixture)
            ks = V312.evaluate_ks_corrected(ray_fixture, tolerance, branch)
            ks["formulation"] = KS_FORMULATION
            ks["polarization"] = polarization_payload(ks, ray_fixture)
            executions.extend((carter, ks))
    result = {
        "version": "v314-kerr-corrected-dense-ray-result-v1",
        "rayIndex": ray["rayIndex"], "rayId": ray["rayId"], "stratum": ray["stratum"],
        "alphaM": ray["alphaM"], "betaM": ray["betaM"], "spinA": ray["spinA"],
        "executionCount": len(executions),
        "classifications": sorted({str(row.get("classification")) for row in executions}),
        "executions": executions,
        "authority": {"fullShort": FULL_SHORT_AUTHORITY_SHA, "geometry": EXPECTED_GEOMETRY_SHA, "polarization": EXPECTED_POLARIZATION_SHA},
    }
    if len(executions) != EXECUTIONS_PER_RAY or not PLANNER.finite_json(executions):
        raise RuntimeError(f"v314 ray {ray['rayIndex']} execution conservation failed")
    validate_ray_result(result, ray)
    return {**result, "raySha256": value_sha(result)}


def append_ray(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False))
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())


def verify_rows(path: Path, expected_rays: list[dict[str, Any]]) -> int:
    if not path.exists():
        return 0
    completed = 0
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            unsigned = {key: value for key, value in row.items() if key != "raySha256"}
            if row.get("raySha256") != value_sha(unsigned) or completed >= len(expected_rays) or row.get("rayIndex") != expected_rays[completed].get("rayIndex"):
                raise RuntimeError("v314 ray checkpoint identity mismatch")
            validate_ray_result(row, expected_rays[completed])
            completed += 1
    return completed


def completed_shards(state: dict[str, Any], plan: dict[str, Any]) -> list[int]:
    completed: list[int] = []
    for shard in plan["shards"]:
        index = int(shard["shardIndex"])
        data_path = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = SHARDS / f"shard-{index:02d}.sidecar.json"
        if not data_path.exists() or not sidecar_path.exists():
            continue
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        expected = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
        if sidecar.get("fileSha256") != file_sha(data_path) or sidecar.get("rayPlanSha256") != plan["planSha256"] or sidecar.get("authority") != state["authority"] or verify_rows(data_path, expected) != shard["rayCount"]:
            raise RuntimeError(f"v314 shard {index} publication mismatch")
        completed.append(index)
    if state.get("completedShardIndices") not in (None, completed):
        raise RuntimeError("v314 state/published shard mismatch")
    return completed


def authorization_token(shard_index: int) -> str:
    return f"v314-shard-{shard_index}-attempt-1"


def run_next_dry_run(token: str | None) -> dict[str, Any]:
    state = status()
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards({**state, "completedShardIndices": None}, plan)
    next_index = next((index for index in range(SHARD_COUNT) if index not in completed), None)
    expected = authorization_token(next_index) if next_index is not None else None
    return {
        "version": "v314-kerr-run-next-authorization-preflight-v1",
        "status": "authorized-dry-run" if token is not None and token == expected else "authorization-required",
        "nextShardIndex": next_index,
        "expectedAuthorizationToken": expected,
        "authorizationMatched": token is not None and token == expected,
        "attemptConsumed": False,
        "stateMutationApplied": False,
        "controllerImplementation": "v312-v313-locked-streaming-ndjson-v1",
    }


def shard_audit(shard_index: int, plan: dict[str, Any], state: dict[str, Any], path: Path) -> dict[str, Any]:
    shard = plan["shards"][shard_index]
    metrics = PLANNER.new_dense_metrics()
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            row = json.loads(line)
            with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(metrics, row))
    qualification = with_v314_validation(lambda: PLANNER.finalize_dense_metrics(metrics, shard["rayCount"], scope="shard"))
    error_budget = PLANNER.create_dimension_preserving_error_budget(metrics, qualification)
    error_budget["version"] = "v314-dense-kerr-error-budget-v1"
    error_budget["unreportedComponents"]["uReference"] = "held by v312/v313 full-short authority envelope"
    unsigned = {
        "version": "v314-kerr-corrected-dense-shard-science-audit-v1", "generatedAt": utc(),
        "status": "shard-structural-qualified", "shardIndex": shard_index,
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
        raise RuntimeError("previous v314 shard failed; automatic retry is forbidden")
    plan = read_verified(PLAN, "planSha256")
    completed = completed_shards({**state, "completedShardIndices": None}, plan)
    next_index = next((index for index in range(SHARD_COUNT) if index not in completed), None)
    if next_index is None:
        raise RuntimeError("v314 campaign already contains all shards")
    if token != authorization_token(next_index):
        raise RuntimeError(f"explicit authorization token required: {authorization_token(next_index)}")
    free_memory = PLANNER.available_memory_bytes()
    free_disk = shutil.disk_usage(OUT.parent).free
    if free_memory < MINIMUM_FREE_MEMORY_BYTES or free_disk < MINIMUM_FREE_DISK_BYTES:
        return {**state, "resourcePreflight": {"passed": False, "freeMemoryBytes": free_memory, "freeDiskBytes": free_disk}, "attemptConsumed": False}
    shard = plan["shards"][next_index]
    rays = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
    part = CHECKPOINTS / f"shard-{next_index:02d}.ndjson.part"
    checkpoint = CHECKPOINTS / f"shard-{next_index:02d}.checkpoint.json"
    resumed = verify_rows(part, rays)
    state.update({"status": f"running-shard-{next_index}", "attemptConsumed": True, "activeShardIndex": next_index, "authorizationTokenSha256": hashlib.sha256(token.encode()).hexdigest(), "runNextAuthorized": True, "runNextAvailable": False})
    save_state(state)
    monitor = PLANNER.PeakRssMonitor()
    try:
        with monitor:
            for local_index in range(resumed, len(rays)):
                result = evaluate_ray(rays[local_index])
                append_ray(part, result)
                checkpoint_unsigned = {
                    "version": "v314-kerr-corrected-dense-shard-checkpoint-v1", "generatedAt": utc(),
                    "shardIndex": next_index, "completedRayCount": local_index + 1,
                    "nextRayIndex": rays[local_index]["rayIndex"] + 1 if local_index + 1 < len(rays) else None,
                    "partBytes": part.stat().st_size, "partSha256": file_sha(part),
                    "rayPlanSha256": plan["planSha256"], "authority": state["authority"], "automaticRetryApplied": False,
                }
                atomic_json(checkpoint, {**checkpoint_unsigned, "checkpointSha256": value_sha(checkpoint_unsigned)})
        if monitor.failure is not None or monitor.peak >= PEAK_RSS_LIMIT_BYTES or verify_rows(part, rays) != len(rays):
            raise RuntimeError(f"v314 shard resource or conservation failure: {monitor.failure or monitor.peak}")
        published = SHARDS / f"shard-{next_index:02d}.ndjson"
        published.parent.mkdir(parents=True, exist_ok=True)
        os.replace(part, published)
        sidecar_unsigned = {
            "version": "v314-kerr-corrected-dense-shard-sidecar-v1", "generatedAt": utc(),
            "shardIndex": next_index, "rayStart": shard["rayStart"], "rayEndExclusive": shard["rayEndExclusive"],
            "rayCount": shard["rayCount"], "executionCount": shard["rayCount"] * EXECUTIONS_PER_RAY,
            "path": published.relative_to(ROOT).as_posix(), "bytes": published.stat().st_size,
            "fileSha256": file_sha(published), "rayPlanSha256": plan["planSha256"], "authority": state["authority"],
            "peakRssBytes": monitor.peak, "rssTelemetry": {"status": "measured", "probe": RSS_TELEMETRY_VERSION, "peakRssBytes": monitor.peak, "limitBytes": PEAK_RSS_LIMIT_BYTES, "gatePassed": True},
            "complete": True, "automaticRetryApplied": False,
        }
        atomic_json(SHARDS / f"shard-{next_index:02d}.sidecar.json", {**sidecar_unsigned, "sidecarSha256": value_sha(sidecar_unsigned)})
        audit = shard_audit(next_index, plan, state, published)
        AUDITS.mkdir(parents=True, exist_ok=True)
        atomic_json(AUDITS / f"shard-{next_index:02d}.science-audit.json", audit)
        completed = completed_shards({**state, "completedShardIndices": None}, plan)
        next_shard = next((index for index in range(SHARD_COUNT) if index not in completed), None)
        state.update({"status": f"incomplete-{len(completed)}-of-49" if next_shard is not None else "complete-awaiting-aggregate", "completedShardIndices": completed, "completedShardCount": len(completed), "nextShardIndex": next_shard, "activeShardIndex": None, "failure": None, "peakRssBytes": max(int(state.get("peakRssBytes", 0)), monitor.peak), "runNextAuthorized": False, "runNextAvailable": False, "aggregateAvailable": next_shard is None})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": next_index, "nextShardIndex": next_index, "failure": str(error)[:500], "peakRssBytes": monitor.peak, "attemptConsumed": True, "runNextAuthorized": False, "runNextAvailable": False, "aggregateAvailable": False})
        save_state(state)
        raise


def aggregate_check() -> dict[str, Any]:
    state = status()
    if state["completedShardCount"] != SHARD_COUNT:
        return {"version": "v314-kerr-aggregate-precondition-v1", "status": "refused-partial-aggregate", "completedShardCount": state["completedShardCount"], "plannedShardCount": SHARD_COUNT, "aggregateAvailable": False, "stateMutationApplied": False, "attemptConsumed": False}
    raise RuntimeError("v314 aggregate implementation is unavailable until all corrected shards are verified")


def compact(value: dict[str, Any]) -> dict[str, Any]:
    keys = ("version", "status", "plannedRayCount", "plannedShardCount", "completedShardCount", "nextShardIndex", "attemptConsumed", "runNextAuthorized", "runNextAvailable", "aggregateAvailable", "stateMutationApplied", "stateSha256")
    return {key: value[key] for key in keys if key in value}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v314 corrected dense campaign planner")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init", action="store_true")
    group.add_argument("--status", action="store_true")
    group.add_argument("--aggregate-check", action="store_true")
    group.add_argument("--run-next-dry-run", action="store_true")
    group.add_argument("--run-next", action="store_true")
    parser.add_argument("--authorization-token")
    args = parser.parse_args()
    result = initialize() if args.init else status() if args.status else aggregate_check() if args.aggregate_check else run_next_dry_run(args.authorization_token) if args.run_next_dry_run else run_next(args.authorization_token)
    print(json.dumps(compact(result), indent=2))


if __name__ == "__main__":
    main()

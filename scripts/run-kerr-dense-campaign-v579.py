"""Axis-complete v579 Kerr dense candidate derived from the sealed v575 shards.

The v575 aggregate failure is preserved.  Its five classification disagreements
all belong to the Boyer--Lindquist axis-degenerate family alpha=0, beta<0: the
ray crosses the north axis and reaches the far-side equatorial plane at
theta=-pi/2.  The frozen Carter event detected only theta=+pi/2.

v579 preregisters the complete equatorial surface cos(theta)=0 for the entire
21-ray axis-degenerate family.  Those rays are recomputed; every other sealed
row is verified and inherited without changing its scientific executions.
No threshold, classification, event radius, or scientific payload is edited.
"""

from __future__ import annotations

import argparse
import copy
import importlib.util
import json
import math
import os
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
V575_SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v575.py"


def load_v575():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v575_for_v579", V575_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v575 dense implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V575 = load_v575()
ENGINE = V575.ENGINE
PLANNER = ENGINE.PLANNER
V296 = ENGINE.BASE.BASE.V312.V296
OUT = ROOT / "dist/science/kerr-campaign-v579"
ENVELOPE = OUT / "execution-envelope.json"
PLAN = OUT / "ray-plan.json"
STATE = OUT / "campaign-state.json"
SHARDS = OUT / "shards"
AUDITS = OUT / "audits"
AGGREGATE = OUT / "dense-aggregate.json"
V575_STATE = ROOT / "dist/science/kerr-campaign-v575/campaign-state.json"
V575_PLAN = ROOT / "dist/science/kerr-campaign-v575/ray-plan.json"
V568_SHARDS = ROOT / "dist/science/kerr-campaign-v568/shards"
V575_SHARDS = ROOT / "dist/science/kerr-campaign-v575/shards"
AUTHORIZATION_TOKEN = "v579-axis-completion-single-attempt-1"
EXPECTED_V575_FAILURE = "v298r1 dense qualification gates failed: classificationAgreement"
EXPECTED_MISMATCH_RAYS = (1764, 1805, 1846, 1887, 2010)
CLASSIFICATION_AGREEMENT_MINIMUM = 0.999


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    ENGINE.atomic_json(path, value)


def save_state(value: dict[str, Any]) -> dict[str, Any]:
    unsigned = {key: item for key, item in value.items() if key != "stateSha256"}
    sealed = {**unsigned, "stateSha256": ENGINE.value_sha(unsigned)}
    atomic_json(STATE, sealed)
    return sealed


def axis_selector(ray: dict[str, Any]) -> bool:
    return float(ray["alphaM"]) == 0.0 and float(ray["betaM"]) < 0.0


def mismatch_diagnostic(plan: dict[str, Any]) -> dict[str, Any]:
    mismatches: list[dict[str, Any]] = []
    comparisons = 0
    agreements = 0
    for shard in plan["shards"]:
        index = int(shard["shardIndex"])
        source_dir = V568_SHARDS if index < 22 else V575_SHARDS
        with (source_dir / f"shard-{index:02d}.ndjson").open("r", encoding="utf-8") as handle:
            for line in handle:
                if not line.strip():
                    continue
                row = json.loads(line)
                by_identity = {
                    (entry["formulation"], entry["toleranceClass"], entry["branch"]): entry
                    for entry in row["executions"]
                }
                formulations = {entry["formulation"] for entry in row["executions"]}
                carter = next(item for item in formulations if "carter" in item)
                ks = next(item for item in formulations if "kerr-schild" in item)
                for tolerance in ("release", "internal"):
                    for branch in ("A", "B"):
                        left = by_identity[(carter, tolerance, branch)]["classification"]
                        right = by_identity[(ks, tolerance, branch)]["classification"]
                        comparisons += 1
                        agreements += int(left == right)
                        if left != right:
                            mismatches.append({
                                "rayIndex": row["rayIndex"],
                                "rayId": row["rayId"],
                                "toleranceClass": tolerance,
                                "branch": branch,
                                "carter": left,
                                "kerrSchild": right,
                            })
    unique = sorted({int(row["rayIndex"]) for row in mismatches})
    if tuple(unique) != EXPECTED_MISMATCH_RAYS:
        raise RuntimeError(f"v579 expected v575 mismatch boundary changed: {unique}")
    ratio = agreements / comparisons if comparisons else 0.0
    if ratio >= CLASSIFICATION_AGREEMENT_MINIMUM:
        raise RuntimeError("v579 expected v575 aggregate classification failure disappeared")
    return {
        "failure": EXPECTED_V575_FAILURE,
        "comparisonCount": comparisons,
        "agreementCount": agreements,
        "classificationAgreement": ratio,
        "classificationAgreementMinimum": CLASSIFICATION_AGREEMENT_MINIMUM,
        "mismatchExecutionCount": len(mismatches),
        "mismatchRayIndices": unique,
        "mismatches": mismatches,
    }


def build_envelope(source_plan: dict[str, Any], source_state: dict[str, Any]) -> dict[str, Any]:
    selected = [int(ray["rayIndex"]) for ray in source_plan["rays"] if axis_selector(ray)]
    if len(selected) != 21:
        raise RuntimeError(f"v579 axis selector count changed: {len(selected)}")
    negative = mismatch_diagnostic(source_plan)
    unsigned = {
        "version": "v579-kerr-axis-complete-dense-envelope-v1",
        "status": "preregistered-axis-coordinate-completion",
        "sourceCandidate": {
            "namespace": "v575",
            "statePath": V575_STATE.relative_to(ROOT).as_posix(),
            "stateFileSha256": ENGINE.file_sha(V575_STATE),
            "stateCanonicalSha256": source_state["stateSha256"],
            "planPath": V575_PLAN.relative_to(ROOT).as_posix(),
            "planFileSha256": ENGINE.file_sha(V575_PLAN),
            "planCanonicalSha256": source_plan["planSha256"],
            "aggregateFilePresent": False,
            "aggregateFailure": negative,
        },
        "axisCompletionPolicy": {
            "selector": "alphaM==0.0-and-betaM<0.0",
            "selectedRayCount": len(selected),
            "selectedRayIndices": selected,
            "physicalReason": "Boyer-Lindquist north-axis continuation reaches far-side theta=-pi/2",
            "oldEventSurface": "theta-pi/2=0",
            "completeEventSurface": "cos(theta)=0",
            "canonicalEmitterMap": "theta->abs(theta), phi->phi+pi, kTheta->-kTheta for negative-theta disk hits",
            "unselectedScientificExecutions": "byte-preserved-from-sealed-source-row",
            "thresholdChange": False,
            "classificationMutation": False,
            "scientificPayloadMutation": False,
        },
        "thresholds": {
            "classificationAgreementMinimum": CLASSIFICATION_AGREEMENT_MINIMUM,
            "carterResidualMaximumExclusive": ENGINE.RESIDUAL_LIMIT,
        },
        "sources": [
            {"path": Path(__file__).resolve().relative_to(ROOT).as_posix(), "sha256": ENGINE.file_sha(Path(__file__).resolve())},
            {"path": V575_SOURCE.relative_to(ROOT).as_posix(), "sha256": ENGINE.file_sha(V575_SOURCE)},
            {"path": V296.__file__ and Path(V296.__file__).resolve().relative_to(ROOT).as_posix(), "sha256": ENGINE.file_sha(Path(V296.__file__).resolve())},
        ],
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "automaticRetryApplied": False,
    }
    return {**unsigned, "envelopeSha256": ENGINE.value_sha(unsigned)}


def build_plan(source_plan: dict[str, Any], envelope: dict[str, Any]) -> dict[str, Any]:
    unsigned = {
        "version": "v579-kerr-axis-complete-dense-ray-plan-v1",
        "rayCount": source_plan["rayCount"],
        "shardCount": source_plan["shardCount"],
        "executionsPerRay": source_plan["executionsPerRay"],
        "rays": source_plan["rays"],
        "shards": source_plan["shards"],
        "sourcePlanSha256": source_plan["planSha256"],
        "axisCompletionEnvelopeSha256": envelope["envelopeSha256"],
        "axisCompletionSelector": envelope["axisCompletionPolicy"]["selector"],
        "rayOrderChanged": False,
        "shardBoundariesChanged": False,
    }
    return {**unsigned, "planSha256": ENGINE.value_sha(unsigned)}


def canonicalize_far_side_seed(execution: dict[str, Any], fixture: Any) -> bool:
    seed = execution.get("polarizationSeed")
    if not isinstance(seed, dict):
        return False
    coordinates = seed.get("coordinatesBl")
    wavevector = seed.get("wavevectorBl")
    if not isinstance(coordinates, list) or not isinstance(wavevector, list) or float(coordinates[2]) >= 0.0:
        return False
    coordinates[2] = -float(coordinates[2])
    coordinates[3] = (float(coordinates[3]) + math.pi) % (2.0 * math.pi)
    wavevector[2] = -float(wavevector[2])
    execution["polarization"] = ENGINE.BASE.BASE.polarization_payload(execution, fixture)
    return True


def evaluate_axis_complete(ray: dict[str, Any], envelope: dict[str, Any]) -> dict[str, Any]:
    original_solve_ivp = V296.solve_ivp

    def axis_complete_solve_ivp(fun, t_span, y0, **kwargs):
        events = kwargs.get("events")
        if events:
            _old_disk, horizon, escape = events

            def complete_disk(_parameter: float, state: Any) -> float:
                return math.cos(float(state[2]))

            complete_disk.terminal = False
            complete_disk.direction = 0
            kwargs["events"] = (complete_disk, horizon, escape)
        return original_solve_ivp(fun, t_span, y0, **kwargs)

    V296.solve_ivp = axis_complete_solve_ivp
    try:
        row = V575.evaluate_ray(ray)
    finally:
        V296.solve_ivp = original_solve_ivp
    fixture = ENGINE.BASE.BASE.fixture(ray)
    canonicalized = 0
    for execution in row["executions"]:
        if execution["formulation"] == ENGINE.CARTER_FORMULATION:
            canonicalized += int(canonicalize_far_side_seed(execution, fixture))
            execution["axisContinuation"] = {
                "eventSurface": "cos(theta)=0",
                "farSideEmitterCanonicalized": bool(execution.get("polarizationSeed") and float(execution["polarizationSeed"]["coordinatesBl"][2]) >= 0.0),
            }
    row["classifications"] = sorted({str(execution["classification"]) for execution in row["executions"]})
    row["axisCompletion"] = {
        "selected": True,
        "farSidePolarizationSeedCount": canonicalized,
        "envelopeSha256": envelope["envelopeSha256"],
    }
    return row


def seal_row(source: dict[str, Any], ray: dict[str, Any], envelope: dict[str, Any]) -> dict[str, Any]:
    source_unsigned = {key: item for key, item in source.items() if key != "raySha256"}
    if source.get("raySha256") != ENGINE.value_sha(source_unsigned):
        raise RuntimeError(f"v579 source row SHA mismatch: {source.get('rayIndex')}")
    ENGINE.BASE.BASE.validate_ray_result(source, ray)
    selected = axis_selector(ray)
    working = evaluate_axis_complete(ray, envelope) if selected else copy.deepcopy(source)
    prior_sha = source["raySha256"]
    working.pop("raySha256", None)
    working["version"] = "v579-kerr-axis-complete-dense-ray-result-v1"
    working["authority"] = {**working["authority"], "axisCompletionEnvelope": envelope["envelopeSha256"]}
    working["v579Provenance"] = {
        "sourceRaySha256": prior_sha,
        "axisCompletionRecomputed": selected,
        "unselectedScientificExecutionsBytePreserved": not selected,
    }
    ENGINE.BASE.BASE.validate_ray_result(working, ray)
    return {**working, "raySha256": ENGINE.value_sha(working)}


def run(token: str | None) -> dict[str, Any]:
    if token != AUTHORIZATION_TOKEN:
        raise RuntimeError("explicit v579 axis-completion authorization token required")
    if STATE.exists() or AGGREGATE.exists():
        raise RuntimeError("v579 is a single-attempt candidate and already has evidence")
    source_state = ENGINE.read_verified(V575_STATE, "stateSha256")
    source_plan = ENGINE.read_verified(V575_PLAN, "planSha256")
    if source_state.get("completedShardCount") != 49 or (ROOT / "dist/science/kerr-campaign-v575/dense-aggregate.json").exists():
        raise RuntimeError("v579 expected sealed v575 49-shard aggregate-negative boundary changed")
    envelope = build_envelope(source_plan, source_state)
    plan = build_plan(source_plan, envelope)
    OUT.mkdir(parents=True, exist_ok=True)
    atomic_json(ENVELOPE, envelope)
    atomic_json(PLAN, plan)
    state = save_state({
        "version": "v579-kerr-axis-complete-dense-state-v1",
        "status": "running-shard-0",
        "completedShardCount": 0,
        "completedShardIndices": [],
        "plannedShardCount": 49,
        "plannedRayCount": 3097,
        "recomputedAxisRayCount": 0,
        "inheritedRayCount": 0,
        "aggregateAvailable": False,
        "failure": None,
        "automaticRetryApplied": False,
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "authorizationTokenSha256": ENGINE.value_sha(AUTHORIZATION_TOKEN),
    })
    global_metrics = PLANNER.new_dense_metrics()
    try:
        for shard in plan["shards"]:
            index = int(shard["shardIndex"])
            source_dir = V568_SHARDS if index < 22 else V575_SHARDS
            source_path = source_dir / f"shard-{index:02d}.ndjson"
            source_sidecar_path = source_dir / f"shard-{index:02d}.sidecar.json"
            source_sidecar = ENGINE.read_verified(source_sidecar_path, "sidecarSha256")
            if source_sidecar.get("fileSha256") != ENGINE.file_sha(source_path):
                raise RuntimeError(f"v579 source shard mismatch: {index}")
            destination = SHARDS / f"shard-{index:02d}.ndjson"
            part = destination.with_name(f"{destination.name}.{os.getpid()}.part")
            destination.parent.mkdir(parents=True, exist_ok=True)
            shard_metrics = PLANNER.new_dense_metrics()
            selected_count = 0
            inherited_count = 0
            expected = plan["rays"][int(shard["rayStart"]):int(shard["rayEndExclusive"])]
            with source_path.open("r", encoding="utf-8") as source_handle, part.open("x", encoding="utf-8", newline="\n") as output_handle:
                source_rows = [json.loads(line) for line in source_handle if line.strip()]
                if len(source_rows) != len(expected):
                    raise RuntimeError(f"v579 source shard row count mismatch: {index}")
                for source_row, ray in zip(source_rows, expected):
                    if int(source_row["rayIndex"]) != int(ray["rayIndex"]):
                        raise RuntimeError(f"v579 source ray order mismatch: {index}")
                    row = seal_row(source_row, ray, envelope)
                    selected = axis_selector(ray)
                    selected_count += int(selected)
                    inherited_count += int(not selected)
                    ENGINE.BASE.BASE.with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(shard_metrics, row))
                    ENGINE.BASE.BASE.with_v314_validation(lambda row=row: PLANNER.accumulate_dense_metrics(global_metrics, row))
                    output_handle.write(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n")
                output_handle.flush()
                os.fsync(output_handle.fileno())
            os.replace(part, destination)
            qualification = ENGINE.BASE.BASE.with_v314_validation(
                lambda: PLANNER.finalize_dense_metrics(shard_metrics, len(expected), scope="shard")
            )
            sidecar_unsigned = {
                "version": "v579-kerr-axis-complete-shard-sidecar-v1",
                "shardIndex": index,
                "rayStart": shard["rayStart"],
                "rayEndExclusive": shard["rayEndExclusive"],
                "rayCount": len(expected),
                "executionCount": len(expected) * 8,
                "recomputedAxisRayCount": selected_count,
                "inheritedRayCount": inherited_count,
                "path": destination.relative_to(ROOT).as_posix(),
                "bytes": destination.stat().st_size,
                "fileSha256": ENGINE.file_sha(destination),
                "planSha256": plan["planSha256"],
                "envelopeSha256": envelope["envelopeSha256"],
                "source": {
                    "path": source_path.relative_to(ROOT).as_posix(),
                    "fileSha256": ENGINE.file_sha(source_path),
                    "sidecarCanonicalSha256": source_sidecar["sidecarSha256"],
                },
                "complete": True,
                "automaticRetryApplied": False,
            }
            atomic_json(SHARDS / f"shard-{index:02d}.sidecar.json", {**sidecar_unsigned, "sidecarSha256": ENGINE.value_sha(sidecar_unsigned)})
            audit_unsigned = {
                "version": "v579-kerr-axis-complete-shard-audit-v1",
                "shardIndex": index,
                "qualification": qualification,
                "qualified": qualification["qualified"],
                "scientificThresholdChanged": False,
            }
            AUDITS.mkdir(parents=True, exist_ok=True)
            atomic_json(AUDITS / f"shard-{index:02d}.science-audit.json", {**audit_unsigned, "auditSha256": ENGINE.value_sha(audit_unsigned)})
            state = save_state({
                **state,
                "status": f"incomplete-{index + 1}-of-49" if index < 48 else "complete-awaiting-aggregate",
                "completedShardCount": index + 1,
                "completedShardIndices": list(range(index + 1)),
                "recomputedAxisRayCount": int(state["recomputedAxisRayCount"]) + selected_count,
                "inheritedRayCount": int(state["inheritedRayCount"]) + inherited_count,
            })
        qualification = ENGINE.BASE.BASE.with_v314_validation(
            lambda: PLANNER.finalize_dense_metrics(global_metrics, 3097)
        )
        error_budget = PLANNER.create_dimension_preserving_error_budget(global_metrics, qualification)
        unsigned = {
            "version": "v579-kerr-axis-complete-dense-aggregate-v1",
            "status": "complete",
            "rayCount": global_metrics["rayCount"],
            "executionCount": global_metrics["executionCount"],
            "shardCount": 49,
            "recomputedAxisRayCount": state["recomputedAxisRayCount"],
            "inheritedRayCount": state["inheritedRayCount"],
            "classCounts": global_metrics["classCounts"],
            "qualification": qualification,
            "errorBudget": error_budget,
            "planSha256": plan["planSha256"],
            "envelopeSha256": envelope["envelopeSha256"],
            "partialAggregate": False,
            "formalProductPointer": "v263",
            "defaultKernel": "legacy-eih-1pn",
            "boundary": "v575-aggregate-negative-preserved-v579-axis-coordinate-completion-no-runtime-promotion",
        }
        aggregate = {**unsigned, "aggregateSha256": ENGINE.value_sha(unsigned)}
        atomic_json(AGGREGATE, aggregate)
        save_state({
            **state,
            "status": "complete",
            "aggregateAvailable": True,
            "aggregate": {
                "path": AGGREGATE.relative_to(ROOT).as_posix(),
                "fileSha256": ENGINE.file_sha(AGGREGATE),
                "canonicalSha256": aggregate["aggregateSha256"],
            },
        })
        return aggregate
    except Exception as error:
        save_state({
            **state,
            "status": "failed-no-automatic-retry",
            "aggregateAvailable": False,
            "failure": str(error)[:500],
            "automaticRetryApplied": False,
        })
        raise


def status() -> dict[str, Any]:
    if not STATE.exists():
        return {"version": "v579-kerr-axis-complete-dense-state-v1", "status": "not-started", "aggregateAvailable": False}
    return ENGINE.read_verified(STATE, "stateSha256")


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v579 axis-complete Kerr dense candidate")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status", action="store_true")
    group.add_argument("--run-authorized", action="store_true")
    parser.add_argument("--authorization-token")
    args = parser.parse_args()
    result = status() if args.status else run(args.authorization_token)
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()

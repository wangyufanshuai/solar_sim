"""v575 two-dimensional adaptive continuation of the Kerr dense campaign.

The v568 and v572 failures remain immutable.  This namespace imports only the
22 fully qualified v568 shards and applies a preregistered Carter ladder over
both solver control and constraint-projection interval from shard 22 onward.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
V572_SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v572.py"


def load_v572():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v572_for_v575", V572_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v572 adaptive implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


ENGINE = load_v572()
OUT = ROOT / "dist/science/kerr-campaign-v575"
ENVELOPE = OUT / "execution-envelope.json"
PLAN = OUT / "ray-plan.json"
STATE = OUT / "campaign-state.json"
SHARDS = OUT / "shards"
CHECKPOINTS = OUT / "checkpoints"
AUDITS = OUT / "audits"
AGGREGATE = OUT / "dense-aggregate.json"
V572_STATE = ROOT / "dist/science/kerr-campaign-v572/campaign-state.json"
V572_ENVELOPE = ROOT / "dist/science/kerr-campaign-v572/execution-envelope.json"
CONTROL_FACTORS = (1.0, 0.75, 0.5, 0.25, 0.1, 0.05, 0.02, 0.01)
PROJECTION_INTERVALS = (0.005, 0.0025, 0.001)

ORIGINAL_BUILD_ENVELOPE = ENGINE.build_envelope
ORIGINAL_BUILD_PLAN = ENGINE.build_plan
ORIGINAL_INITIAL_STATE = ENGINE.initial_state
ORIGINAL_EVALUATE_RAY = ENGINE.evaluate_ray
ORIGINAL_SHARD_AUDIT = ENGINE.shard_audit
ORIGINAL_AGGREGATE = ENGINE.aggregate


def build_envelope() -> dict[str, Any]:
    base = ORIGINAL_BUILD_ENVELOPE()
    v572_state = ENGINE.read_verified(V572_STATE, "stateSha256")
    v572_envelope = ENGINE.read_verified(V572_ENVELOPE, "envelopeSha256")
    expected_failure = "v572 adaptive Carter ladder exhausted for ray 1456: v572 ray 1456 release carterResidualNormalized residual failed: 1.0328312197199277e-10>=1e-10"
    if (v572_state.get("status") != "failed-no-automatic-retry"
            or v572_state.get("completedShardCount") != 22
            or v572_state.get("failedShardIndex") != 22
            or v572_state.get("failure") != expected_failure
            or v572_state.get("aggregateAvailable") is not False
            or v572_state.get("automaticRetryApplied") is not False):
        raise RuntimeError("v575 expected v572 failure boundary changed")
    unsigned = {key: value for key, value in base.items() if key != "envelopeSha256"}
    unsigned.update({
        "version": "v575-two-dimensional-adaptive-carter-dense-envelope-v1",
        "status": "qualified-v568-imports-v572-failure-preserved-two-dimensional-ladder",
        "v572FailureEvidence": {
            "statePath": V572_STATE.relative_to(ROOT).as_posix(),
            "stateFileSha256": ENGINE.file_sha(V572_STATE),
            "stateCanonicalSha256": v572_state["stateSha256"],
            "envelopePath": V572_ENVELOPE.relative_to(ROOT).as_posix(),
            "envelopeFileSha256": ENGINE.file_sha(V572_ENVELOPE),
            "envelopeCanonicalSha256": v572_envelope["envelopeSha256"],
            "failedShardIndex": 22,
            "failure": expected_failure,
            "automaticRetryApplied": False,
        },
        "adaptiveSolverPolicy": {
            "scope": "carter-executions-only",
            "controlBase": ENGINE.CONTROL_BASE,
            "controlFactors": list(CONTROL_FACTORS),
            "projectionIntervals": list(PROJECTION_INTERVALS),
            "iterationOrder": "projection-interval-outer-control-factor-inner",
            "selection": "first-candidate-passing-unchanged-execution-gates",
            "carterResidualLimit": ENGINE.RESIDUAL_LIMIT,
            "classificationAndSelectedEventKindMustMatchFirstCandidate": True,
            "campaignRetry": False,
            "failedV568OrV572ShardImported": False,
        },
        "implementationBoundary": "v572-streaming-controller-reused-v575-envelope-and-observable-versions",
    })
    unsigned["controllerSources"] = [
        *unsigned["controllerSources"],
        {"path": Path(__file__).resolve().relative_to(ROOT).as_posix(), "sha256": ENGINE.file_sha(Path(__file__).resolve())},
    ]
    return {**unsigned, "envelopeSha256": ENGINE.value_sha(unsigned)}


def build_plan(authority_input: dict[str, Any]) -> dict[str, Any]:
    base = ORIGINAL_BUILD_PLAN(authority_input)
    unsigned = {key: value for key, value in base.items() if key != "planSha256"}
    unsigned["version"] = "v575-kerr-two-dimensional-adaptive-dense-ray-plan-v1"
    unsigned["executionPolicy"] = {**unsigned["executionPolicy"], "carter": "v575-two-dimensional-control-and-projection-ladder"}
    unsigned["boundary"] = "v575-imports-only-v568-qualified-0-through-21-v572-failure-preserved"
    return {**unsigned, "planSha256": ENGINE.value_sha(unsigned)}


def initial_state(authority_input: dict[str, Any], plan: dict[str, Any], envelope: dict[str, Any]) -> dict[str, Any]:
    base = ORIGINAL_INITIAL_STATE(authority_input, plan, envelope)
    unsigned = {key: value for key, value in base.items() if key != "stateSha256"}
    unsigned["version"] = "v575-kerr-two-dimensional-adaptive-dense-campaign-state-v1"
    unsigned["boundary"] = "v568-v572-failures-preserved-v575-shard-22-first-attempt"
    unsigned["previousFailedCandidate"] = {"namespace": "v572", "stateCanonicalSha256": envelope["v572FailureEvidence"]["stateCanonicalSha256"]}
    return {**unsigned, "stateSha256": ENGINE.value_sha(unsigned)}


def carter_candidate(ray: dict[str, Any], fixture: Any, tolerance_class: str, branch: str) -> dict[str, Any]:
    declared = ENGINE.BASE.BASE.BASE.RELEASE_TOLERANCE if tolerance_class == "release" else ENGINE.BASE.BASE.BASE.INTERNAL_TOLERANCE
    first_branch = None
    failures = []
    for projection_index, interval in enumerate(PROJECTION_INTERVALS):
        for control_index, factor in enumerate(CONTROL_FACTORS):
            control = ENGINE.CONTROL_BASE[tolerance_class] * factor
            frozen_interval = ENGINE.BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL
            ENGINE.BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL = interval
            try:
                raw = ENGINE.BASE.BASE.V312.V296.evaluate_carter_stabilized(fixture, control, branch)
            finally:
                ENGINE.BASE.BASE.V312.V296.CONSTRAINT_PROJECTION_INTERVAL = frozen_interval
            row = {
                **raw,
                "formulation": ENGINE.CARTER_FORMULATION,
                "tolerance": declared,
                "declaredTolerance": declared,
                "toleranceClass": tolerance_class,
                "solverControlInput": control,
                "solverTolerance": float(raw["solverTolerance"]),
                "solverPolicy": "v575-two-dimensional-control-and-projection-ladder",
                "adaptiveSolverProjectionIndex": projection_index,
                "adaptiveSolverProjectionInterval": interval,
                "adaptiveSolverControlIndex": control_index,
                "adaptiveSolverControlFactor": factor,
                "adaptiveSolverProjectionIntervals": list(PROJECTION_INTERVALS),
                "adaptiveSolverControlFactors": list(CONTROL_FACTORS),
            }
            physical_branch = (row.get("classification"), row.get("selectedEvent", {}).get("kind"))
            if first_branch is None:
                first_branch = physical_branch
            elif physical_branch != first_branch:
                raise RuntimeError(f"v575 adaptive solver changed physical branch for ray {ray['rayIndex']}")
            row["polarization"] = ENGINE.BASE.BASE.polarization_payload(row, fixture)
            try:
                ENGINE.BASE.BASE.with_v314_validation(lambda row=row: ENGINE.PLANNER.validate_execution(row, ray, f"v575 ray {ray['rayIndex']} {tolerance_class}"))
                row["adaptiveSolverFailuresBeforeSelection"] = failures
                return row
            except RuntimeError as error:
                failures.append({"projectionIndex": projection_index, "projectionInterval": interval, "controlIndex": control_index, "controlFactor": factor, "reason": str(error)[:300]})
    raise RuntimeError(f"v575 adaptive Carter ladder exhausted for ray {ray['rayIndex']}: {failures[-1]['reason']}")


def evaluate_ray(ray: dict[str, Any]) -> dict[str, Any]:
    row = ORIGINAL_EVALUATE_RAY(ray)
    row.pop("raySha256", None)
    row["version"] = "v575-kerr-two-dimensional-adaptive-dense-ray-result-v1"
    return {**row, "raySha256": ENGINE.value_sha(row)}


def shard_audit(index: int, plan: dict[str, Any], state: dict[str, Any], path: Path) -> dict[str, Any]:
    audit = ORIGINAL_SHARD_AUDIT(index, plan, state, path)
    audit.pop("auditSha256", None)
    audit["version"] = "v575-kerr-two-dimensional-adaptive-dense-shard-audit-v1"
    audit["adaptivePolicy"] = {"controlFactors": list(CONTROL_FACTORS), "projectionIntervals": list(PROJECTION_INTERVALS)}
    return {**audit, "auditSha256": ENGINE.value_sha(audit)}


def aggregate() -> dict[str, Any]:
    document = ORIGINAL_AGGREGATE()
    document.pop("aggregateSha256", None)
    document["version"] = "v575-kerr-two-dimensional-adaptive-dense-aggregate-v1"
    document["boundary"] = "complete-v575-dense-cpu-authority-v568-v572-failures-preserved-no-runtime-promotion"
    document["adaptivePolicy"] = {"controlFactors": list(CONTROL_FACTORS), "projectionIntervals": list(PROJECTION_INTERVALS)}
    document["aggregateSha256"] = ENGINE.value_sha(document)
    ENGINE.atomic_json(AGGREGATE, document)
    state = ENGINE.read_verified(STATE, "stateSha256")
    state["aggregate"] = {"path": AGGREGATE.relative_to(ROOT).as_posix(), "fileSha256": ENGINE.file_sha(AGGREGATE), "canonicalSha256": document["aggregateSha256"]}
    ENGINE.save_state(state)
    return document


# Rebind the reusable streaming implementation to the v575 namespace before
# any initialization or execution function is invoked.
ENGINE.OUT = OUT
ENGINE.ENVELOPE = ENVELOPE
ENGINE.PLAN = PLAN
ENGINE.STATE = STATE
ENGINE.SHARDS = SHARDS
ENGINE.CHECKPOINTS = CHECKPOINTS
ENGINE.AUDITS = AUDITS
ENGINE.AGGREGATE = AGGREGATE
ENGINE.CONTROL_FACTORS = CONTROL_FACTORS
ENGINE.build_envelope = build_envelope
ENGINE.build_plan = build_plan
ENGINE.initial_state = initial_state
ENGINE.carter_candidate = carter_candidate
ENGINE.evaluate_ray = evaluate_ray
ENGINE.shard_audit = shard_audit
ENGINE.aggregate = aggregate
ENGINE.authorization_token = lambda index: f"v575-shard-{index}-attempt-1"


def diagnose(index: int) -> dict[str, Any]:
    ENGINE.initialize()
    plan = ENGINE.read_verified(PLAN, "planSha256")
    row = evaluate_ray(plan["rays"][index])
    carter = [entry for entry in row["executions"] if entry["formulation"] == ENGINE.CARTER_FORMULATION]
    return {
        "version": "v575-two-dimensional-adaptive-ray-diagnostic-v1",
        "rayIndex": index,
        "rayId": row["rayId"],
        "classifications": row["classifications"],
        "selectedProjectionIntervals": [entry["adaptiveSolverProjectionInterval"] for entry in carter],
        "selectedControlFactors": [entry["adaptiveSolverControlFactor"] for entry in carter],
        "maxCarterResidualNormalized": max(float(entry["carterResidualNormalized"]) for entry in carter),
        "stateMutationApplied": False,
        "raySha256": row["raySha256"],
    }


def run_all(token: str | None) -> dict[str, Any]:
    if token != "v575-shards-22-through-48-single-campaign-attempt-1":
        raise RuntimeError("explicit v575 continuation authorization token required")
    return ENGINE.run_all("v572-shards-22-through-48-single-campaign-attempt-1")


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v575 two-dimensional adaptive dense campaign")
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
        result = ENGINE.initialize()
    elif args.status:
        result = ENGINE.status()
    elif args.run_next:
        result = ENGINE.run_next(args.authorization_token)
    elif args.run_all_authorized:
        result = run_all(args.authorization_token)
    elif args.aggregate:
        result = aggregate()
    else:
        result = diagnose(args.diagnose_ray)
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()

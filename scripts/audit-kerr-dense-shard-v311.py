from __future__ import annotations

import hashlib
import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CAMPAIGN = ROOT / "dist/science/kerr-campaign-v298r1"
SHARD = CAMPAIGN / "shards/shard-00.ndjson"
SIDECAR = CAMPAIGN / "shards/shard-00.sidecar.json"
CHECKPOINT = CAMPAIGN / "checkpoints/shard-00.checkpoint.json"
STRUCTURAL_AUDIT = CAMPAIGN / "audits/shard-00.science-audit.json"
STATE = CAMPAIGN / "campaign-state.json"
PLAN = CAMPAIGN / "ray-plan.json"
OUTPUT = CAMPAIGN / "audits/shard-00.truth-audit-v311.json"

VOLATILE_KEYS = {"generatedAt", "absolutePath", "host", "pid", "peakRssGiB"}
FORMULATIONS = (
    "carter-mino-dop853-constraint-stabilized-v296",
    "cartesian-kerr-schild-hamiltonian-dop853-v292",
)
TOLERANCE_CLASSES = ("release", "internal")
BRANCHES = ("A", "B")
EXPECTED_MATRIX = {(formula, tolerance, branch) for formula in FORMULATIONS for tolerance in TOLERANCE_CLASSES for branch in BRANCHES}


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in VOLATILE_KEYS}
    return value


def value_sha(value: Any) -> str:
    encoded = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_verified(path: Path, sha_key: str) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    claimed = document.get(sha_key)
    unsigned = {key: value for key, value in document.items() if key != sha_key}
    if not isinstance(claimed, str) or value_sha(unsigned) != claimed:
        raise RuntimeError(f"canonical SHA mismatch: {path.relative_to(ROOT).as_posix()}")
    return document


def atomic_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def geometry_fingerprint(execution: dict[str, Any]) -> str:
    excluded = {"branch", "tolerance", "toleranceClass", "solverTolerance", "polarization"}
    return value_sha({key: value for key, value in execution.items() if key not in excluded})


def residual_fingerprint(execution: dict[str, Any]) -> str:
    keys = (
        "classification", "selectedEvent", "stepCount", "massShellResidualNormalized",
        "carterResidualNormalized", "metricDerivativeAuditResidual", "metricPullbackResidual",
        "covectorRoundtripResidual", "tetradResidual", "diskRadiusM", "redshift",
        "intensityInvariantResidual", "radialTurningPoints", "polarTurningPoints",
    )
    return value_sha({key: execution.get(key) for key in keys})


def main() -> int:
    sidecar = read_verified(SIDECAR, "sidecarSha256")
    checkpoint = read_verified(CHECKPOINT, "checkpointSha256")
    structural = read_verified(STRUCTURAL_AUDIT, "auditSha256")
    state = read_verified(STATE, "stateSha256")
    plan = read_verified(PLAN, "planSha256")
    shard_file_sha = file_sha(SHARD)
    if shard_file_sha != sidecar.get("fileSha256") or shard_file_sha != structural.get("fileSha256"):
        raise RuntimeError("v311 shard file SHA mismatch")
    if sidecar.get("sidecarSha256") != structural.get("sidecarSha256"):
        raise RuntimeError("v311 sidecar authority mismatch")
    if checkpoint.get("partSha256") != shard_file_sha or checkpoint.get("completedRayCount") != 64:
        raise RuntimeError("v311 checkpoint conservation failed")
    if state.get("status") != "incomplete-1-of-49" or state.get("completedShardCount") != 1 or state.get("nextShardIndex") != 1:
        raise RuntimeError("v311 campaign state drift")
    planned_rays = plan.get("rays")
    if not isinstance(planned_rays, list) or len(planned_rays) != 3097:
        raise RuntimeError("v311 ray plan conservation failed")

    matrix_counts: Counter[str] = Counter()
    ray_class_counts: Counter[str] = Counter()
    spin_counts: Counter[str] = Counter()
    solver_tolerances: dict[str, dict[str, set[float]]] = {
        formula: {tolerance: set() for tolerance in TOLERANCE_CLASSES} for formula in FORMULATIONS
    }
    declared_tolerances: dict[str, set[float]] = {tolerance: set() for tolerance in TOLERANCE_CLASSES}
    ray_shas: set[str] = set()
    event_parameters: set[float] = set()
    redshifts: set[float] = set()
    evpas: set[float] = set()
    numerical_fingerprints: set[str] = set()
    strict_solver_ladder_pair_count = 0
    geometry_distinct_pair_count = 0
    step_count_distinct_pair_count = 0
    residual_distinct_pair_count = 0
    ab_deterministic_pair_count = 0
    execution_count = 0

    with SHARD.open("r", encoding="utf-8") as handle:
        rows = [json.loads(line) for line in handle if line.strip()]
    if len(rows) != 64:
        raise RuntimeError("v311 ray count conservation failed")

    for expected_index, row in enumerate(rows):
        claimed_ray_sha = row.get("raySha256")
        unsigned = {key: value for key, value in row.items() if key != "raySha256"}
        if row.get("rayIndex") != expected_index or value_sha(unsigned) != claimed_ray_sha:
            raise RuntimeError(f"v311 ray {expected_index} SHA or index mismatch")
        expected = planned_rays[expected_index]
        if any(row.get(key) != expected.get(key) for key in ("rayIndex", "rayId", "stratum", "alphaM", "betaM", "spinA")):
            raise RuntimeError(f"v311 ray {expected_index} plan identity mismatch")
        ray_shas.add(str(claimed_ray_sha))
        spin_counts[str(row["spinA"])] += 1
        executions = row.get("executions")
        if not isinstance(executions, list) or len(executions) != 8:
            raise RuntimeError(f"v311 ray {expected_index} execution conservation failed")
        by_identity: dict[tuple[str, str, str], dict[str, Any]] = {}
        for execution in executions:
            identity = (str(execution.get("formulation")), str(execution.get("toleranceClass")), str(execution.get("branch")))
            if identity in by_identity:
                raise RuntimeError(f"v311 ray {expected_index} duplicate matrix identity")
            by_identity[identity] = execution
            matrix_counts["|".join(identity)] += 1
            execution_count += 1
            solver_tolerance = execution.get("solverTolerance")
            declared_tolerance = execution.get("tolerance")
            if not isinstance(solver_tolerance, (int, float)) or not isinstance(declared_tolerance, (int, float)):
                raise RuntimeError(f"v311 ray {expected_index} tolerance telemetry missing")
            solver_tolerances[identity[0]][identity[1]].add(float(solver_tolerance))
            declared_tolerances[identity[1]].add(float(declared_tolerance))
            numerical_fingerprints.add(geometry_fingerprint(execution))
            selected = execution.get("selectedEvent")
            if isinstance(selected, dict) and isinstance(selected.get("parameter"), (int, float)):
                event_parameters.add(float(selected["parameter"]))
            if isinstance(execution.get("redshift"), (int, float)):
                redshifts.add(float(execution["redshift"]))
            polarization = execution.get("polarization")
            if isinstance(polarization, dict) and isinstance(polarization.get("walkerPenroseEvpaDeg"), (int, float)):
                evpas.add(float(polarization["walkerPenroseEvpaDeg"]))
        if set(by_identity) != EXPECTED_MATRIX:
            raise RuntimeError(f"v311 ray {expected_index} execution matrix incomplete")
        classes = {str(execution.get("classification")) for execution in executions}
        if len(classes) != 1:
            raise RuntimeError(f"v311 ray {expected_index} classification disagreement")
        ray_class_counts[next(iter(classes))] += 1
        for formula in FORMULATIONS:
            for tolerance_class in TOLERANCE_CLASSES:
                left = {key: value for key, value in by_identity[(formula, tolerance_class, "A")].items() if key != "branch"}
                right = {key: value for key, value in by_identity[(formula, tolerance_class, "B")].items() if key != "branch"}
                if value_sha(left) == value_sha(right):
                    ab_deterministic_pair_count += 1
            for branch in BRANCHES:
                release = by_identity[(formula, "release", branch)]
                internal = by_identity[(formula, "internal", branch)]
                if float(internal["solverTolerance"]) < float(release["solverTolerance"]):
                    strict_solver_ladder_pair_count += 1
                if geometry_fingerprint(release) != geometry_fingerprint(internal):
                    geometry_distinct_pair_count += 1
                if release.get("stepCount") != internal.get("stepCount"):
                    step_count_distinct_pair_count += 1
                if residual_fingerprint(release) != residual_fingerprint(internal):
                    residual_distinct_pair_count += 1

    expected_pair_count = 64 * len(FORMULATIONS) * len(BRANCHES)
    structural_gates = {
        "rayCount": len(rows) == 64,
        "executionCount": execution_count == 512,
        "uniqueRaySha": len(ray_shas) == 64,
        "executionMatrix": len(matrix_counts) == 8 and all(count == 64 for count in matrix_counts.values()),
        "abDeterminism": ab_deterministic_pair_count == 64 * len(FORMULATIONS) * len(TOLERANCE_CLASSES),
        "classCoverage": set(ray_class_counts) == {"capture", "escape", "disk-hit"},
        "authorityLocks": sidecar.get("authority") == state.get("authority") == checkpoint.get("authority"),
    }
    cross_ray_non_degeneracy = {
        "uniqueSpinCount": len(spin_counts),
        "uniqueSelectedEventParameterCount": len(event_parameters),
        "uniqueRedshiftCount": len(redshifts),
        "uniqueWalkerPenroseEvpaCount": len(evpas),
        "uniqueGeometryFingerprintCount": len(numerical_fingerprints),
        "passed": len(spin_counts) >= 5 and len(event_parameters) >= 16 and len(redshifts) >= 2 and len(evpas) >= 2 and len(numerical_fingerprints) >= 32,
    }
    tolerance_ladder = {
        "expectedPairCount": expected_pair_count,
        "declaredToleranceByClass": {key: sorted(values) for key, values in declared_tolerances.items()},
        "solverToleranceByFormulaAndClass": {
            formula: {tolerance: sorted(values) for tolerance, values in classes.items()}
            for formula, classes in solver_tolerances.items()
        },
        "strictSolverLadderPairCount": strict_solver_ladder_pair_count,
        "geometryDistinctPairCount": geometry_distinct_pair_count,
        "stepCountDistinctPairCount": step_count_distinct_pair_count,
        "residualDistinctPairCount": residual_distinct_pair_count,
        "allPairsUseSameSolverTolerance": strict_solver_ladder_pair_count == 0,
        "allGeometryPayloadsDuplicateAcrossTolerance": geometry_distinct_pair_count == 0,
        "passed": strict_solver_ladder_pair_count == expected_pair_count and geometry_distinct_pair_count > 0,
    }
    structural_passed = all(structural_gates.values()) and cross_ray_non_degeneracy["passed"]
    status = "qualified-numerically-nondegenerate" if structural_passed and tolerance_ladder["passed"] else "failed-tolerance-ladder-degenerate"
    unsigned_output = {
        "version": "v311-kerr-dense-shard-truth-audit-v1",
        "status": status,
        "scope": "published-shard-0-read-only-audit-no-campaign-state-mutation",
        "shard": {
            "index": 0,
            "path": SHARD.relative_to(ROOT).as_posix(),
            "fileSha256": shard_file_sha,
            "sidecarSha256": sidecar["sidecarSha256"],
            "checkpointSha256": checkpoint["checkpointSha256"],
            "structuralAuditSha256": structural["auditSha256"],
            "rayCount": len(rows),
            "executionCount": execution_count,
            "rayClassCounts": dict(sorted(ray_class_counts.items())),
            "spinCounts": dict(sorted(spin_counts.items())),
        },
        "campaign": {
            "stateSha256": state["stateSha256"],
            "status": state["status"],
            "completedShardCount": state["completedShardCount"],
            "nextShardIndex": state["nextShardIndex"],
            "campaignStateMutationApplied": False,
            "nextShardAttempted": False,
            "automaticRetryApplied": False,
        },
        "structuralGates": structural_gates,
        "crossRayNonDegeneracy": cross_ray_non_degeneracy,
        "toleranceLadder": tolerance_ladder,
        "qualification": {
            "structuralShardStatus": "qualified" if structural_passed else "failed",
            "denseToleranceConvergenceStatus": "qualified" if tolerance_ladder["passed"] else "withdrawn",
            "denseCampaignContinuation": "requires-corrected-authority-and-new-campaign-namespace" if not tolerance_ladder["passed"] else "eligible-after-explicit-user-authorization",
            "aggregateEligible": False,
            "partialAggregateAccepted": False,
        },
        "boundary": "negative-truth-evidence-preserves-v296-v297-and-v298r1-artifacts-no-retroactive-mutation",
    }
    output = {**unsigned_output, "truthAuditSha256": value_sha(unsigned_output)}
    atomic_json(OUTPUT, output)
    print(json.dumps({
        "status": output["status"],
        "truthAuditSha256": output["truthAuditSha256"],
        "strictSolverLadderPairCount": strict_solver_ladder_pair_count,
        "expectedPairCount": expected_pair_count,
        "geometryDistinctPairCount": geometry_distinct_pair_count,
        "campaignStateMutationApplied": False,
        "output": OUTPUT.relative_to(ROOT).as_posix(),
    }, indent=2))
    return 0 if status == "failed-tolerance-ladder-degenerate" else 2


if __name__ == "__main__":
    raise SystemExit(main())

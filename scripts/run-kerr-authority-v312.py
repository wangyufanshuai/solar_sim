"""Corrected two-tolerance Kerr short authority for Orbit Atlas v312.

The qualified v296 geometry equations and event implementation are imported
without modification.  v312 changes only the solver-control adapter so the
declared release/internal classes reach distinct DOP853 tolerances.  Historical
v296/v297 artifacts and the quarantined v298r1 campaign remain immutable.
"""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import importlib.util
import json
import math
import os
import shutil
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

try:
    import psutil  # type: ignore
except ImportError:
    psutil = None

ROOT = Path(__file__).resolve().parents[1]
V296_SOURCE = ROOT / "scripts/run-kerr-authority-v296.py"
V291_SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"
V296_ARTIFACT = ROOT / "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"
OUT = ROOT / "dist/science/kerr-reference-v312"
GATE = OUT / "geometry-redshift-tolerance-short-gate.json"
NEGATIVE = OUT / "geometry-redshift-tolerance-short-gate-negative.json"

EXPECTED_V296_EVIDENCE_SHA = "76d2d4d3b803104ba477da627c428ed51d7b62b9691d2dc81e53f1e5bb8e81f7"
EXPECTED_V296_SOURCE_SHA = "fda40194e7d3c55c3671024d3be172f49dd7ae55e75984a565f8e52c82553318"
EXPECTED_V291_SOURCE_SHA = "03b609562dad3efb149976b17fee81b5bbd865ef8ca90d2a9b64eb79a3848884"

DECLARED_RELEASE_TOLERANCE = 1e-10
DECLARED_INTERNAL_TOLERANCE = 1e-12
SOLVER_CONTROL_INPUT = {"release": 1e-7, "internal": 1e-9}
EXPECTED_SOLVER_TOLERANCE = {"release": 1e-11, "internal": 1e-13}
EXPECTED_EXECUTION_COUNT = 128
EXPECTED_LADDER_PAIR_COUNT = 64
CONVERGENCE_OBSERVABLES_PER_PAIR = 4
V312_CONSTRAINT_PROJECTION_INTERVAL = 0.005
MINIMUM_FREE_MEMORY_GIB = 4.0
MINIMUM_FREE_DISK_GIB = 30.0
MAX_PEAK_RSS_GIB = 2.0


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load frozen authority: {path.name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V296 = load_module("orbit_atlas_kerr_v296_for_v312", V296_SOURCE)
BASE = V296.BASE
FROZEN_EVALUATE_KS: Callable[[Any, float, str], dict[str, Any]] = BASE.evaluate_ks


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {
            key: canonical(value[key])
            for key in sorted(value)
            if key not in {
                "generatedAt",
                "pid",
                "host",
                "absolutePath",
                "peakRssGiB",
                "freeMemoryGiB",
                "freeDiskGiB",
            }
        }
    return value


def value_sha(value: Any) -> str:
    encoded = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


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


def preserve_attempt(path: Path) -> None:
    if not path.exists():
        return
    previous = json.loads(path.read_text(encoding="utf-8"))
    previous_sha = previous.get("evidenceSha256")
    if isinstance(previous_sha, str):
        atomic_json(path.parent / "attempts" / f"{previous_sha}.json", previous)


def available_memory_bytes() -> int:
    if psutil is not None:
        return int(psutil.virtual_memory().available)
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("memoryLoad", ctypes.c_ulong), ("totalPhys", ctypes.c_ulonglong), ("availPhys", ctypes.c_ulonglong), ("totalPageFile", ctypes.c_ulonglong), ("availPageFile", ctypes.c_ulonglong), ("totalVirtual", ctypes.c_ulonglong), ("availVirtual", ctypes.c_ulonglong), ("availExtended", ctypes.c_ulonglong)]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return int(status.availPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def process_rss_bytes() -> int:
    if psutil is not None:
        return int(psutil.Process(os.getpid()).memory_info().rss)
    if os.name == "nt":
        from ctypes import wintypes

        class Counters(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("pageFaultCount", ctypes.c_ulong), ("peakWorkingSetSize", ctypes.c_size_t), ("workingSetSize", ctypes.c_size_t), ("quotaPeakPagedPoolUsage", ctypes.c_size_t), ("quotaPagedPoolUsage", ctypes.c_size_t), ("quotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("quotaNonPagedPoolUsage", ctypes.c_size_t), ("pagefileUsage", ctypes.c_size_t), ("peakPagefileUsage", ctypes.c_size_t)]
        counters = Counters()
        counters.cb = ctypes.sizeof(Counters)
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        psapi.GetProcessMemoryInfo.argtypes = (wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD)
        psapi.GetProcessMemoryInfo.restype = wintypes.BOOL
        if psapi.GetProcessMemoryInfo(kernel32.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
            return int(counters.workingSetSize)
    return 0


class PeakRssSampler:
    def __init__(self) -> None:
        self.peak = process_rss_bytes()
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._sample, daemon=True)

    def _sample(self) -> None:
        while not self.stop_event.wait(0.02):
            self.peak = max(self.peak, process_rss_bytes())

    def __enter__(self) -> "PeakRssSampler":
        self.thread.start()
        return self

    def __exit__(self, *_args: object) -> None:
        self.stop_event.set()
        self.thread.join()
        self.peak = max(self.peak, process_rss_bytes())

    @property
    def peak_gib(self) -> float:
        return self.peak / 1024**3


def resource_preflight() -> dict[str, Any]:
    free_memory_gib = available_memory_bytes() / 1024**3
    free_disk_gib = shutil.disk_usage(ROOT).free / 1024**3
    return {
        "freeMemoryGiB": free_memory_gib,
        "freeDiskGiB": free_disk_gib,
        "minimumFreeMemoryGiB": MINIMUM_FREE_MEMORY_GIB,
        "minimumFreeDiskGiB": MINIMUM_FREE_DISK_GIB,
        "passed": free_memory_gib >= MINIMUM_FREE_MEMORY_GIB and free_disk_gib >= MINIMUM_FREE_DISK_GIB,
    }


def validate_frozen_inputs() -> dict[str, str]:
    source_shas = {
        "v291SourceSha256": file_sha(V291_SOURCE),
        "v296SourceSha256": file_sha(V296_SOURCE),
    }
    if source_shas["v291SourceSha256"] != EXPECTED_V291_SOURCE_SHA:
        raise RuntimeError("frozen v291 source SHA mismatch")
    if source_shas["v296SourceSha256"] != EXPECTED_V296_SOURCE_SHA:
        raise RuntimeError("frozen v296 source SHA mismatch")
    document = json.loads(V296_ARTIFACT.read_text(encoding="utf-8"))
    unsigned = {key: value for key, value in document.items() if key != "evidenceSha256"}
    if document.get("evidenceSha256") != EXPECTED_V296_EVIDENCE_SHA or BASE.value_sha(unsigned) != EXPECTED_V296_EVIDENCE_SHA:
        raise RuntimeError("frozen v296 authority canonical SHA mismatch")
    if not document.get("geometryRedshiftQualified"):
        raise RuntimeError("frozen v296 geometry authority is not qualified")
    return {**source_shas, "v296EvidenceSha256": EXPECTED_V296_EVIDENCE_SHA, "v296FileSha256": file_sha(V296_ARTIFACT)}


def tolerance_class(declared_tolerance: float) -> str:
    if declared_tolerance == DECLARED_RELEASE_TOLERANCE:
        return "release"
    if declared_tolerance == DECLARED_INTERNAL_TOLERANCE:
        return "internal"
    raise RuntimeError(f"unsupported declared tolerance: {declared_tolerance!r}")


def adapt_execution(row: dict[str, Any], declared_tolerance: float, tolerance_name: str, formulation: str) -> dict[str, Any]:
    expected_solver_tolerance = EXPECTED_SOLVER_TOLERANCE[tolerance_name]
    actual_solver_tolerance = float(row["solverTolerance"])
    if not math.isclose(actual_solver_tolerance, expected_solver_tolerance, rel_tol=1e-15, abs_tol=0.0):
        raise RuntimeError(f"{formulation} solver adapter mismatch for {tolerance_name}")
    return {
        **row,
        "formulation": formulation,
        "tolerance": declared_tolerance,
        "declaredTolerance": declared_tolerance,
        "toleranceClass": tolerance_name,
        "solverControlInput": SOLVER_CONTROL_INPUT[tolerance_name],
        "solverTolerance": actual_solver_tolerance,
        "solverPolicy": "explicit-v312-declared-to-dop853-control-adapter",
    }


def evaluate_carter_corrected(ray: Any, declared_tolerance: float, branch: str) -> dict[str, Any]:
    name = tolerance_class(declared_tolerance)
    frozen_interval = V296.CONSTRAINT_PROJECTION_INTERVAL
    V296.CONSTRAINT_PROJECTION_INTERVAL = V312_CONSTRAINT_PROJECTION_INTERVAL
    try:
        row = V296.evaluate_carter_stabilized(ray, SOLVER_CONTROL_INPUT[name], branch)
    finally:
        V296.CONSTRAINT_PROJECTION_INTERVAL = frozen_interval
    # Compatibility labels are required while the frozen v291 aggregator runs.
    return adapt_execution(row, declared_tolerance, name, "carter-mino-dop853-v292")


def evaluate_ks_corrected(ray: Any, declared_tolerance: float, branch: str) -> dict[str, Any]:
    name = tolerance_class(declared_tolerance)
    row = FROZEN_EVALUATE_KS(ray, SOLVER_CONTROL_INPUT[name], branch)
    return adapt_execution(row, declared_tolerance, name, "cartesian-kerr-schild-hamiltonian-dop853-v292")


def with_corrected_solver_ladder(builder: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    original_carter = BASE.evaluate_carter
    original_ks = BASE.evaluate_ks
    BASE.evaluate_carter = evaluate_carter_corrected
    BASE.evaluate_ks = evaluate_ks_corrected
    try:
        return builder()
    finally:
        BASE.evaluate_carter = original_carter
        BASE.evaluate_ks = original_ks


def geometry_observable(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "classification": row["classification"],
        "selectedEvent": row["selectedEvent"],
        "diskRadiusM": row["diskRadiusM"],
        "radialTurningPoints": row["radialTurningPoints"],
        "polarTurningPoints": row["polarTurningPoints"],
    }


def residual_observable(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "massShellResidualRaw": row["massShellResidualRaw"],
        "massShellResidualNormalized": row["massShellResidualNormalized"],
        "carterResidualRaw": row["carterResidualRaw"],
        "carterResidualNormalized": row["carterResidualNormalized"],
        "metricDerivativeAuditResidual": row["metricDerivativeAuditResidual"],
    }


def convergence_audit(executions: list[dict[str, Any]]) -> dict[str, Any]:
    groups: dict[tuple[str, str, str], dict[str, dict[str, Any]]] = {}
    for row in executions:
        key = (str(row["rayId"]), str(row["formulation"]), str(row["branch"]))
        groups.setdefault(key, {})[str(row["toleranceClass"])] = row
    strict_count = 0
    geometry_distinct = 0
    step_count_distinct = 0
    residual_distinct = 0
    event_parameter_distinct = 0
    pair_rows: list[dict[str, Any]] = []
    for key in sorted(groups):
        rows = groups[key]
        release = rows.get("release")
        internal = rows.get("internal")
        strict = bool(
            release
            and internal
            and float(release["solverTolerance"]) > float(internal["solverTolerance"])
            and math.isclose(float(release["solverTolerance"]), EXPECTED_SOLVER_TOLERANCE["release"], rel_tol=1e-15)
            and math.isclose(float(internal["solverTolerance"]), EXPECTED_SOLVER_TOLERANCE["internal"], rel_tol=1e-15)
        )
        strict_count += int(strict)
        if release is None or internal is None:
            pair_rows.append({"rayId": key[0], "formulation": key[1], "branch": key[2], "complete": False})
            continue
        geometry_changed = geometry_observable(release) != geometry_observable(internal)
        steps_changed = int(release["stepCount"]) != int(internal["stepCount"])
        residual_changed = residual_observable(release) != residual_observable(internal)
        release_parameter = (release.get("selectedEvent") or {}).get("parameter")
        internal_parameter = (internal.get("selectedEvent") or {}).get("parameter")
        event_changed = release_parameter != internal_parameter
        geometry_distinct += int(geometry_changed)
        step_count_distinct += int(steps_changed)
        residual_distinct += int(residual_changed)
        event_parameter_distinct += int(event_changed)
        pair_rows.append({
            "rayId": key[0],
            "formulation": key[1],
            "branch": key[2],
            "complete": True,
            "strictSolverLadder": strict,
            "releaseSolverTolerance": release["solverTolerance"],
            "internalSolverTolerance": internal["solverTolerance"],
            "geometryDistinct": geometry_changed,
            "stepCountDistinct": steps_changed,
            "residualDistinct": residual_changed,
            "eventParameterDistinct": event_changed,
        })
    observable_distinct_count = geometry_distinct + step_count_distinct + residual_distinct + event_parameter_distinct
    return {
        "pairIdentity": "rayId+formulation+branch release-vs-internal",
        "expectedStrictSolverLadderPairCount": EXPECTED_LADDER_PAIR_COUNT,
        "strictSolverLadderPairCount": strict_count,
        "solverLadderQualified": len(groups) == EXPECTED_LADDER_PAIR_COUNT and strict_count == EXPECTED_LADDER_PAIR_COUNT,
        "convergenceObservableCount": len(groups) * CONVERGENCE_OBSERVABLES_PER_PAIR,
        "expectedConvergenceObservableCount": EXPECTED_LADDER_PAIR_COUNT * CONVERGENCE_OBSERVABLES_PER_PAIR,
        "distinctConvergenceObservableCount": observable_distinct_count,
        "geometryDistinctPairCount": geometry_distinct,
        "stepCountDistinctPairCount": step_count_distinct,
        "residualDistinctPairCount": residual_distinct,
        "eventParameterDistinctPairCount": event_parameter_distinct,
        "numericallyNondegenerate": observable_distinct_count > 0,
        "pairs": pair_rows,
    }


def build_gate(preflight: dict[str, Any]) -> dict[str, Any]:
    inputs = validate_frozen_inputs()
    prior_negative = None
    if NEGATIVE.exists():
        previous = json.loads(NEGATIVE.read_text(encoding="utf-8"))
        prior_negative = {
            "path": "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate-negative.json",
            "evidenceSha256": previous.get("evidenceSha256"),
            "status": previous.get("status"),
            "preserved": True,
        }
    with PeakRssSampler() as rss:
        base = with_corrected_solver_ladder(BASE.build_geometry_gate)
    unsigned = {key: value for key, value in base.items() if key != "evidenceSha256"}
    executions = unsigned["executions"]
    for row in executions:
        if row["formulation"] == "carter-mino-dop853-v292":
            row["formulation"] = "carter-mino-dop853-constraint-stabilized-v312"
        elif row["formulation"] == "cartesian-kerr-schild-hamiltonian-dop853-v292":
            row["formulation"] = "cartesian-kerr-schild-hamiltonian-dop853-v312"
    class_counts = unsigned["classCounts"]
    unsigned["classCounts"] = {
        "carter-mino-dop853-constraint-stabilized-v312": class_counts["carter-mino-dop853-v292"],
        "cartesian-kerr-schild-hamiltonian-dop853-v312": class_counts["cartesian-kerr-schild-hamiltonian-dop853-v292"],
    }
    audit = convergence_audit(executions)
    reasons = list(unsigned.get("failureReasons", []))
    if len(executions) != EXPECTED_EXECUTION_COUNT:
        reasons.append("v312-execution-count-mismatch")
    if not audit["solverLadderQualified"]:
        reasons.append("v312-strict-solver-ladder-failed")
    if not audit["numericallyNondegenerate"]:
        reasons.append("v312-tolerance-results-degenerate")
    if rss.peak_gib >= MAX_PEAK_RSS_GIB:
        reasons.append("v312-peak-rss-threshold-failed")
    qualified = not reasons
    unsigned.update({
        "version": "v312-kerr-corrected-tolerance-short-gate-v1",
        "attemptId": "v312-corrected-tolerance-attempt-2",
        "algorithmRevision": "explicit-solver-ladder-projection-interval-0.005-rss-sampler-v2",
        "generatedAt": utc(),
        "status": "corrected-authority-qualified" if qualified else "corrected-authority-failed",
        "geometryRedshiftQualified": bool(base.get("geometryRedshiftQualified")),
        "toleranceConvergenceQualified": bool(audit["solverLadderQualified"] and audit["numericallyNondegenerate"]),
        "correctedAuthorityQualified": qualified,
        "fullKerrAuthorityQualified": False,
        "polarizationStatus": "requires-v312-locked-polarization-requalification" if qualified else "blocked-by-v312",
        "failureReasons": reasons,
        "tolerancePolicy": {
            "declaredReleaseTolerance": DECLARED_RELEASE_TOLERANCE,
            "declaredInternalTolerance": DECLARED_INTERNAL_TOLERANCE,
            "releaseSolverControlInput": SOLVER_CONTROL_INPUT["release"],
            "internalSolverControlInput": SOLVER_CONTROL_INPUT["internal"],
            "releaseSolverTolerance": EXPECTED_SOLVER_TOLERANCE["release"],
            "internalSolverTolerance": EXPECTED_SOLVER_TOLERANCE["internal"],
            "adapter": "explicit-v312-declared-to-dop853-control-adapter",
            "carterConstraintProjectionIntervalMino": V312_CONSTRAINT_PROJECTION_INTERVAL,
            "thresholdRelaxation": "not-applied",
        },
        "toleranceConvergence": audit,
        "attemptConsumed": True,
        "resource": {"preflight": preflight, "peakRssGiB": rss.peak_gib, "maximumPeakRssGiB": MAX_PEAK_RSS_GIB, "qualified": rss.peak_gib < MAX_PEAK_RSS_GIB},
        "authorityInputs": inputs,
        "priorNegativeEvidence": prior_negative,
        "science": {"defaultKernel": "legacy-eih-1pn", "workerPhysicsMutation": "not-applied", "legacyKerrMutation": "not-applied", "v296Mutation": "not-applied", "v297Mutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "denseShardExecuted": False, "correctedDenseCampaignCreated": False},
        "boundary": "independent-v312-corrected-tolerance-authority-no-polarization-promotion-no-dense-campaign",
    })
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v312 corrected Kerr tolerance authority")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--inspect", action="store_true")
    group.add_argument("--short-gate", action="store_true")
    group.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    preflight = resource_preflight()
    if args.inspect:
        print(json.dumps({"status": "ready" if preflight["passed"] else "not-ready", "attemptConsumed": False, "resource": preflight}, indent=2))
        return
    if not preflight["passed"]:
        print(json.dumps({"status": "resource-preflight-not-passed", "attemptConsumed": False, "resource": preflight}, indent=2))
        raise SystemExit(2)
    validate_frozen_inputs()
    if args.self_test:
        ray = BASE.FIXTURE_BY_ID["capture-02"]
        release = evaluate_carter_corrected(ray, DECLARED_RELEASE_TOLERANCE, "A")
        internal = evaluate_carter_corrected(ray, DECLARED_INTERNAL_TOLERANCE, "A")
        print(json.dumps({
            "status": "self-test",
            "attemptConsumed": False,
            "release": {"solverTolerance": release["solverTolerance"], "carterResidualNormalized": release["carterResidualNormalized"], "stepCount": release["stepCount"]},
            "internal": {"solverTolerance": internal["solverTolerance"], "carterResidualNormalized": internal["carterResidualNormalized"], "stepCount": internal["stepCount"]},
        }, indent=2))
        return
    else:
        result = build_gate(preflight)
        preserve_attempt(GATE)
        atomic_json(GATE, result)
        if not result["correctedAuthorityQualified"]:
            preserve_attempt(NEGATIVE)
            atomic_json(NEGATIVE, result)
    summary = {key: result.get(key) for key in ("status", "attemptConsumed", "executionCount", "geometryRedshiftQualified", "toleranceConvergenceQualified", "correctedAuthorityQualified", "failureReasons", "tolerancePolicy", "toleranceConvergence", "resource", "evidenceSha256")}
    if "attemptConsumed" not in summary or summary["attemptConsumed"] is None:
        summary["attemptConsumed"] = bool(args.short_gate)
    if isinstance(summary.get("toleranceConvergence"), dict):
        summary["toleranceConvergence"] = {key: summary["toleranceConvergence"][key] for key in summary["toleranceConvergence"] if key != "pairs"}
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

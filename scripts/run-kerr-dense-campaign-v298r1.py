"""Executable low-memory v298r1 corrected Kerr dense campaign.

The historical v298 planner is immutable.  This controller locks the qualified
v296 geometry and v297 polarization envelope, writes one canonical ray per
NDJSON line, and refuses partial aggregates.  Dense results remain local
shadow research evidence and never mutate the realtime solar physics kernel.
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
import subprocess
import sys
import threading
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/kerr-campaign-v298r1"
SHARDS = OUT / "shards"
CHECKPOINTS = OUT / "checkpoints"
AUDITS = OUT / "audits"
STATE = OUT / "campaign-state.json"
RAY_PLAN = OUT / "ray-plan.json"
AGGREGATE = OUT / "dense-aggregate.json"
AGGREGATE_NEGATIVE = OUT / "aggregate-attempt-negative.json"
RSS_PROBE_EVIDENCE = OUT / "rss-probe-v2.json"
GEOMETRY = ROOT / "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"
POLARIZATION = ROOT / "dist/science/kerr-reference-v297/polarization-short-gate.json"
ENVELOPE = ROOT / "dist/science/kerr-reference-v297/portable-envelope.json"
GEOMETRY_SOURCE = ROOT / "scripts/run-kerr-authority-v296.py"
POLARIZATION_SOURCE = ROOT / "scripts/run-kerr-polarization-v297.py"

RAY_COUNT = 3097
SHARD_COUNT = 49
EXECUTIONS_PER_RAY = 8
MINIMUM_FREE_MEMORY_BYTES = 4 * 2**30
MINIMUM_FREE_DISK_BYTES = 30 * 2**30
PEAK_RSS_LIMIT_BYTES = 2 * 2**30
RSS_PROBE_VERSION = "process-peak-working-set-v298r1-r2"
SIGNED_SPINS = (-0.998, -0.9, -0.5, 0.0, 0.5, 0.9, 0.998)
CRITICAL_OFFSETS = (-0.1, -0.02, -0.005, -0.001, -0.0002, -0.00005, -0.00001,
                    0.00001, 0.00005, 0.0002, 0.001, 0.005, 0.02, 0.1)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load {path.name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


GEOMETRY_AUTHORITY = load_module("orbit_atlas_kerr_v296_for_v298r1", GEOMETRY_SOURCE)
POLARIZATION_AUTHORITY = load_module("orbit_atlas_kerr_v297_for_v298r1", POLARIZATION_SOURCE)
BASE = GEOMETRY_AUTHORITY.BASE


@dataclass(frozen=True)
class DenseRay:
    rayIndex: int
    rayId: str
    stratum: str
    alphaM: float
    betaM: float
    spinA: float
    expectedFamily: str


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value)
                if key not in {"generatedAt", "pid", "host", "absolutePath", "peakRssGiB"}}
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


def read_verified(path: Path, hash_field: str) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    expected = document.get(hash_field)
    unsigned = {key: value for key, value in document.items() if key != hash_field}
    if not isinstance(expected, str) or value_sha(unsigned) != expected:
        raise RuntimeError(f"canonical SHA mismatch: {path.relative_to(ROOT).as_posix()}")
    return document


def available_memory_bytes() -> int:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("memoryLoad", ctypes.c_ulong),
                        ("totalPhys", ctypes.c_ulonglong), ("availPhys", ctypes.c_ulonglong),
                        ("totalPageFile", ctypes.c_ulonglong), ("availPageFile", ctypes.c_ulonglong),
                        ("totalVirtual", ctypes.c_ulonglong), ("availVirtual", ctypes.c_ulonglong),
                        ("availExtended", ctypes.c_ulonglong)]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise RuntimeError("unable to inspect physical memory")
        return int(status.availPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def process_rss_bytes() -> int:
    if os.name == "nt":
        import ctypes.wintypes as wintypes

        class Counters(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("pageFaultCount", ctypes.c_ulong),
                        ("peakWorkingSetSize", ctypes.c_size_t), ("workingSetSize", ctypes.c_size_t),
                        ("quotaPeakPagedPoolUsage", ctypes.c_size_t), ("quotaPagedPoolUsage", ctypes.c_size_t),
                        ("quotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("quotaNonPagedPoolUsage", ctypes.c_size_t),
                        ("pagefileUsage", ctypes.c_size_t), ("peakPagefileUsage", ctypes.c_size_t)]
        counters = Counters()
        counters.cb = ctypes.sizeof(Counters)
        psapi = ctypes.WinDLL("Psapi.dll", use_last_error=True)
        kernel32 = ctypes.WinDLL("Kernel32.dll", use_last_error=True)
        get_current_process = kernel32.GetCurrentProcess
        get_current_process.argtypes = []
        get_current_process.restype = wintypes.HANDLE
        get_process_memory_info = psapi.GetProcessMemoryInfo
        get_process_memory_info.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
        get_process_memory_info.restype = wintypes.BOOL
        if get_process_memory_info(get_current_process(), ctypes.byref(counters), counters.cb):
            return int(counters.peakWorkingSetSize)
        error_code = ctypes.get_last_error()
        raise RuntimeError(f"GetProcessMemoryInfo failed with Windows error {error_code}")
    import resource
    return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == "darwin" else 1024))


class PeakRssMonitor:
    def __init__(self) -> None:
        self.peak = process_rss_bytes()
        self.failure: str | None = None
        self.stop = threading.Event()
        self.thread = threading.Thread(target=self._run, name="v298r1-rss", daemon=True)

    def _run(self) -> None:
        try:
            while not self.stop.wait(0.05):
                self.peak = max(self.peak, process_rss_bytes())
        except Exception as error:  # Fail closed when the platform probe becomes unavailable.
            self.failure = str(error)[:300]
            self.stop.set()

    def __enter__(self) -> "PeakRssMonitor":
        self.thread.start()
        return self

    def __exit__(self, *_args: object) -> None:
        self.stop.set()
        self.thread.join(timeout=1)
        self.peak = max(self.peak, process_rss_bytes())


def hammersley(index: int, count: int) -> tuple[float, float]:
    bits = index
    inverse = 0.0
    factor = 0.5
    while bits:
        inverse += factor * (bits & 1)
        bits >>= 1
        factor *= 0.5
    return ((index + 0.5) / count, inverse)


def build_rays(geometry: dict[str, Any]) -> list[DenseRay]:
    rays: list[DenseRay] = []
    for fixture in BASE.FIXTURES:
        rays.append(DenseRay(len(rays), fixture.ray_id, "canonical", fixture.alpha_m, fixture.beta_m,
                            fixture.spin, fixture.expected_family))

    brackets = geometry.get("criticalBrackets", [])
    if len(brackets) != 40 or any(item.get("valid") is not True for item in brackets):
        raise RuntimeError("v296 critical bracket conservation failed")
    for bracket in brackets:
        midpoint = 0.5 * (float(bracket["leftImpactM"]) + float(bracket["rightImpactM"]))
        for offset in CRITICAL_OFFSETS:
            index = len(rays)
            rays.append(DenseRay(index, f"critical-{index:04d}", "critical-band", midpoint + offset, 0.0,
                                float(bracket["spin"]), "unclassified"))

    for local_index in range(840):
        u, v = hammersley(local_index, 840)
        index = len(rays)
        rays.append(DenseRay(index, f"disk-band-{index:04d}", "disk-band", -12.0 + 24.0 * u,
                            5.0 + 8.0 * v, SIGNED_SPINS[local_index % len(SIGNED_SPINS)], "unclassified"))

    for y in range(41):
        for x in range(41):
            index = len(rays)
            local_index = y * 41 + x
            rays.append(DenseRay(index, f"field-{index:04d}", "uniform-field", -22.0 + 44.0 * x / 40.0,
                                -16.0 + 32.0 * y / 40.0,
                                SIGNED_SPINS[local_index % len(SIGNED_SPINS)], "unclassified"))
    if len(rays) != RAY_COUNT or [ray.rayIndex for ray in rays] != list(range(RAY_COUNT)):
        raise RuntimeError("v298r1 ray-plan conservation failed")
    return rays


def shard_plan() -> list[dict[str, int]]:
    base, remainder = divmod(RAY_COUNT, SHARD_COUNT)
    cursor = 0
    result = []
    for shard_index in range(SHARD_COUNT):
        count = base + (1 if shard_index < remainder else 0)
        result.append({"shardIndex": shard_index, "rayStart": cursor,
                       "rayEndExclusive": cursor + count, "rayCount": count, "maxRayCount": 64})
        cursor += count
    return result


def load_authority() -> dict[str, Any]:
    geometry = read_verified(GEOMETRY, "evidenceSha256")
    polarization = read_verified(POLARIZATION, "evidenceSha256")
    envelope = json.loads(ENVELOPE.read_text(encoding="utf-8"))
    if not isinstance(envelope.get("evidenceSha256"), str) or len(envelope["evidenceSha256"]) != 64:
        raise RuntimeError("v297 portable envelope canonical SHA is missing")
    if geometry.get("geometryRedshiftQualified") is not True:
        raise RuntimeError("v296 geometry is not qualified")
    if polarization.get("qualified") is not True or envelope.get("status") != "full-kerr-short-authority-qualified":
        raise RuntimeError("v297 polarization authority is not qualified")
    if envelope.get("geometry", {}).get("evidenceSha256") != geometry.get("evidenceSha256"):
        raise RuntimeError("v297 envelope geometry identity mismatch")
    if envelope.get("polarization", {}).get("evidenceSha256") != polarization.get("evidenceSha256"):
        raise RuntimeError("v297 envelope polarization identity mismatch")
    return {
        "geometry": geometry,
        "polarization": polarization,
        "envelope": envelope,
        "identity": {
            "geometryCanonicalSha256": geometry["evidenceSha256"],
            "geometryFileSha256": file_sha(GEOMETRY),
            "polarizationCanonicalSha256": polarization["evidenceSha256"],
            "polarizationFileSha256": file_sha(POLARIZATION),
            "envelopeCanonicalSha256": envelope["evidenceSha256"],
            "envelopeFileSha256": file_sha(ENVELOPE),
            "geometrySourceSha256": file_sha(GEOMETRY_SOURCE),
            "polarizationSourceSha256": file_sha(POLARIZATION_SOURCE),
        },
    }


def write_plan(authority: dict[str, Any]) -> dict[str, Any]:
    rays = build_rays(authority["geometry"])
    unsigned = {
        "version": "v298r1-kerr-dense-ray-plan-v1",
        "generatedAt": utc(),
        "rayCount": RAY_COUNT,
        "shardCount": SHARD_COUNT,
        "executionsPerRay": EXECUTIONS_PER_RAY,
        "strata": {"canonical": 16, "criticalBand": 560, "diskBand": 840, "uniformField": 1681},
        "signedSpins": list(SIGNED_SPINS),
        "rays": [asdict(ray) for ray in rays],
        "shards": shard_plan(),
        "authority": authority["identity"],
        "boundary": "deterministic-finite-observer-dense-plan-no-runtime-promotion",
    }
    document = {**unsigned, "planSha256": value_sha(unsigned)}
    if RAY_PLAN.exists():
        previous = read_verified(RAY_PLAN, "planSha256")
        if value_sha(previous.get("rays")) != value_sha(document.get("rays")):
            raise RuntimeError("existing v298r1 ray plan differs")
        return previous
    atomic_json(RAY_PLAN, document)
    return document


def initial_state(authority: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    unsigned = {
        "version": "v298r1-kerr-dense-campaign-state-v1",
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
        "partialAggregate": False,
        "runNextAvailable": True,
        "aggregateAvailable": False,
        "rayPlanSha256": plan["planSha256"],
        "rayPlanFileSha256": file_sha(RAY_PLAN),
        "authority": authority["identity"],
        "formalProductPointer": "v263",
        "defaultKernel": "legacy-eih-1pn",
        "boundary": "serial-explicit-shards-no-automatic-retry-no-partial-aggregate",
    }
    return {**unsigned, "stateSha256": value_sha(unsigned)}


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(unsigned)
    atomic_json(STATE, state)


def initialize() -> dict[str, Any]:
    authority = load_authority()
    plan = write_plan(authority)
    if STATE.exists():
        state = read_verified(STATE, "stateSha256")
        validate_state_identity(state, authority, plan)
        return state
    state = initial_state(authority, plan)
    atomic_json(STATE, state)
    return state


def validate_state_identity(state: dict[str, Any], authority: dict[str, Any], plan: dict[str, Any]) -> None:
    if state.get("authority") != authority["identity"]:
        raise RuntimeError("v298r1 authority changed after campaign initialization")
    if state.get("rayPlanSha256") != plan.get("planSha256") or state.get("rayPlanFileSha256") != file_sha(RAY_PLAN):
        raise RuntimeError("v298r1 ray-plan identity changed")


def load_state() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    authority = load_authority()
    plan = write_plan(authority)
    state = initialize() if not STATE.exists() else read_verified(STATE, "stateSha256")
    validate_state_identity(state, authority, plan)
    return state, authority, plan


def fixture(ray: dict[str, Any]):
    return BASE.RayFixture(ray["rayId"], float(ray["alphaM"]), float(ray["betaM"]),
                           float(ray["spinA"]), ray["expectedFamily"])


def finite_json(value: Any) -> bool:
    if isinstance(value, float):
        return math.isfinite(value)
    if isinstance(value, list):
        return all(finite_json(item) for item in value)
    if isinstance(value, dict):
        return all(finite_json(item) for item in value.values())
    return True


CARTER_FORMULATION = "carter-mino-dop853-constraint-stabilized-v296"
KS_FORMULATION = "cartesian-kerr-schild-hamiltonian-dop853-v292"
CLASSIFICATIONS = {"capture", "escape", "disk-hit"}


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def require_residual_below(row: dict[str, Any], key: str, limit: float, context: str) -> None:
    value = row.get(key)
    if not finite_number(value) or abs(float(value)) >= limit:
        raise RuntimeError(f"{context} {key} residual failed: {value!r}>={limit}")


def validate_polarization_execution(row: dict[str, Any], context: str) -> None:
    polarization = row.get("polarization")
    if not isinstance(polarization, dict):
        raise RuntimeError(f"{context} polarization payload missing")
    classification = row.get("classification")
    formulation = row.get("formulation")
    if classification != "disk-hit":
        if polarization.get("applicability") != "not-applicable":
            raise RuntimeError(f"{context} non-disk polarization must be not-applicable")
        return
    if formulation == KS_FORMULATION:
        if polarization.get("applicability") != "geometry-cross-check-only":
            raise RuntimeError(f"{context} KS disk polarization crossed the Carter authority boundary")
        return
    if polarization.get("applicability") != "applicable-disk-hit":
        raise RuntimeError(f"{context} Carter disk polarization is unavailable")
    if polarization.get("emitterModel") != "projected-disk-normal":
        raise RuntimeError(f"{context} emitter model mismatch")
    tolerance_class = row.get("toleranceClass")
    residual_limit = 1e-10 if tolerance_class == "release" else 1e-11
    evpa_limit = 0.5 if tolerance_class == "release" else 0.1
    for key in ("walkerPenroseEvpaDeg", "parallelTransportEvpaDeg", "evpaDifferenceDeg"):
        if not finite_number(polarization.get(key)):
            raise RuntimeError(f"{context} {key} is not finite")
    if abs(float(polarization["evpaDifferenceDeg"])) >= evpa_limit:
        raise RuntimeError(f"{context} EVPA difference failed")
    constant = polarization.get("walkerPenroseConstant")
    if not isinstance(constant, dict) or not finite_number(constant.get("real")) or not finite_number(constant.get("imaginary")):
        raise RuntimeError(f"{context} Walker-Penrose constant missing")
    emitter = polarization.get("emitterResiduals")
    direct = polarization.get("parallelTransport")
    if not isinstance(emitter, dict) or not isinstance(direct, dict) or direct.get("success") is not True:
        raise RuntimeError(f"{context} independent parallel transport failed")
    for key in ("waveOrthogonality", "emitterOrthogonality", "norm"):
        require_residual_below(emitter, key, residual_limit, context)
    for key in ("nullResidualNormalized", "orthogonalityResidualNormalized", "normResidual",
                "finalKsNormResidual", "walkerPenroseInvariantDrift", "endpointResidual"):
        require_residual_below(direct, key, residual_limit, context)


def validate_execution(row: dict[str, Any], expected_ray: dict[str, Any], context: str) -> None:
    if row.get("invalid") is not False or row.get("timeout") is not False:
        raise RuntimeError(f"{context} invalid or timeout execution")
    if row.get("rayId") != expected_ray.get("rayId") or row.get("spin") != expected_ray.get("spinA"):
        raise RuntimeError(f"{context} ray identity mismatch")
    formulation = row.get("formulation")
    tolerance_class = row.get("toleranceClass")
    branch = row.get("branch")
    expected_tolerances = {"release": BASE.RELEASE_TOLERANCE, "internal": BASE.INTERNAL_TOLERANCE}
    if formulation not in {CARTER_FORMULATION, KS_FORMULATION} or tolerance_class not in expected_tolerances or branch not in {"A", "B"}:
        raise RuntimeError(f"{context} execution matrix identity mismatch")
    if row.get("tolerance") != expected_tolerances[tolerance_class]:
        raise RuntimeError(f"{context} tolerance value mismatch")
    classification = row.get("classification")
    if classification not in CLASSIFICATIONS:
        raise RuntimeError(f"{context} invalid classification")
    events = row.get("events")
    selected = row.get("selectedEvent")
    if not isinstance(events, list) or not events or not isinstance(selected, dict) or selected.get("valid") is not True:
        raise RuntimeError(f"{context} event timeline missing")
    valid_events = [event for event in events if isinstance(event, dict) and event.get("valid") is True]
    if not valid_events or any(not finite_number(event.get("parameter")) or not finite_number(event.get("radiusM")) for event in valid_events):
        raise RuntimeError(f"{context} event timeline is non-finite")
    earliest = min(valid_events, key=lambda event: float(event["parameter"]))
    if selected.get("kind") != classification or selected.get("kind") != earliest.get("kind") \
            or selected.get("parameter") != earliest.get("parameter") or selected.get("radiusM") != earliest.get("radiusM"):
        raise RuntimeError(f"{context} selected event is not the earliest valid classification event")
    require_residual_below(row, "tetradResidual", 1e-12, context)
    require_residual_below(row, "massShellResidualNormalized", 1e-10, context)
    if formulation == CARTER_FORMULATION:
        require_residual_below(row, "carterResidualNormalized", 1e-10, context)
    else:
        require_residual_below(row, "metricDerivativeAuditResidual", 1e-8, context)
        require_residual_below(row, "metricPullbackResidual", 1e-12, context)
        require_residual_below(row, "covectorRoundtripResidual", 1e-12, context)
    if classification == "disk-hit":
        if row.get("redshiftApplicability") != "applicable" or not finite_number(row.get("redshift")) or float(row["redshift"]) <= 0:
            raise RuntimeError(f"{context} disk redshift is unavailable")
        if not finite_number(row.get("diskRadiusM")) or float(row["diskRadiusM"]) <= 0:
            raise RuntimeError(f"{context} disk radius is invalid")
        require_residual_below(row, "intensityInvariantResidual", 1e-12, context)
    elif row.get("redshiftApplicability") != "not-applicable" or row.get("redshift") is not None or row.get("diskRadiusM") is not None:
        raise RuntimeError(f"{context} non-disk observables must be not-applicable")
    validate_polarization_execution(row, context)


def validate_ray_result(row: dict[str, Any], expected_ray: dict[str, Any]) -> None:
    context = f"ray {expected_ray.get('rayIndex')}"
    if row.get("version") != "v298r1-kerr-dense-ray-result-v1" or row.get("rayIndex") != expected_ray.get("rayIndex"):
        raise RuntimeError(f"{context} result identity mismatch")
    for key in ("rayId", "stratum", "alphaM", "betaM", "spinA"):
        if row.get(key) != expected_ray.get(key):
            raise RuntimeError(f"{context} plan field {key} mismatch")
    executions = row.get("executions")
    if row.get("executionCount") != EXECUTIONS_PER_RAY or not isinstance(executions, list) or len(executions) != EXECUTIONS_PER_RAY:
        raise RuntimeError(f"{context} execution conservation failed")
    matrix: dict[tuple[str, str, str], dict[str, Any]] = {}
    for index, execution in enumerate(executions):
        if not isinstance(execution, dict):
            raise RuntimeError(f"{context} execution {index} is not an object")
        validate_execution(execution, expected_ray, f"{context} execution {index}")
        identity = (str(execution["formulation"]), str(execution["toleranceClass"]), str(execution["branch"]))
        if identity in matrix:
            raise RuntimeError(f"{context} duplicate execution matrix member {identity}")
        matrix[identity] = execution
    expected_matrix = {(formulation, tolerance, branch) for formulation in (CARTER_FORMULATION, KS_FORMULATION)
                       for tolerance in ("release", "internal") for branch in ("A", "B")}
    if set(matrix) != expected_matrix:
        raise RuntimeError(f"{context} execution matrix is incomplete")
    for formulation in (CARTER_FORMULATION, KS_FORMULATION):
        for tolerance in ("release", "internal"):
            left = {key: value for key, value in matrix[(formulation, tolerance, "A")].items() if key != "branch"}
            right = {key: value for key, value in matrix[(formulation, tolerance, "B")].items() if key != "branch"}
            if value_sha(left) != value_sha(right):
                raise RuntimeError(f"{context} A/B payload is nondeterministic for {formulation}/{tolerance}")
    classes = sorted({str(execution["classification"]) for execution in executions})
    if row.get("classifications") != classes:
        raise RuntimeError(f"{context} classification summary mismatch")


def new_dense_metrics() -> dict[str, Any]:
    return {
        "rayCount": 0,
        "executionCount": 0,
        "classCounts": {"capture": 0, "escape": 0, "disk-hit": 0},
        "selectedEventCounts": {"capture": 0, "escape": 0, "disk-hit": 0},
        "executionMatrixCounts": {},
        "classificationComparisonCount": 0,
        "classificationAgreementCount": 0,
        "redshiftComparisonCount": 0,
        "redshiftApplicableExecutionCount": 0,
        "polarizationApplicabilityCounts": {
            "applicable-disk-hit": 0,
            "geometry-cross-check-only": 0,
            "not-applicable": 0,
            "unavailable": 0,
        },
        "abCanonicalPairCount": 0,
        "invalidCount": 0,
        "timeoutCount": 0,
        "maxRedshiftFormulaDifference": 0.0,
        "maxIntensityInvariantResidual": 0.0,
        "maxMassShellResidualNormalized": 0.0,
        "maxCarterResidualNormalized": 0.0,
        "maxMetricDerivativeAuditResidual": 0.0,
        "maxMetricPullbackResidual": 0.0,
        "maxCovectorRoundtripResidual": 0.0,
        "maxTetradResidual": 0.0,
        "maxReleaseEvpaDifferenceDeg": 0.0,
        "maxInternalEvpaDifferenceDeg": 0.0,
        "maxReleasePolarizationResidual": 0.0,
        "maxInternalPolarizationResidual": 0.0,
    }


def update_metric_max(metrics: dict[str, Any], key: str, value: Any) -> None:
    if finite_number(value):
        metrics[key] = max(float(metrics[key]), abs(float(value)))


def accumulate_dense_metrics(metrics: dict[str, Any], ray: dict[str, Any]) -> None:
    metrics["rayCount"] += 1
    executions = ray["executions"]
    by_identity: dict[tuple[str, str, str], dict[str, Any]] = {}
    for execution in executions:
        metrics["executionCount"] += 1
        classification = execution["classification"]
        metrics["classCounts"][classification] += 1
        metrics["selectedEventCounts"][execution["selectedEvent"]["kind"]] += 1
        identity = (execution["formulation"], execution["toleranceClass"], execution["branch"])
        by_identity[identity] = execution
        matrix_key = "|".join(identity)
        metrics["executionMatrixCounts"][matrix_key] = metrics["executionMatrixCounts"].get(matrix_key, 0) + 1
        metrics["invalidCount"] += int(execution["invalid"] is True)
        metrics["timeoutCount"] += int(execution["timeout"] is True)
        update_metric_max(metrics, "maxMassShellResidualNormalized", execution.get("massShellResidualNormalized"))
        update_metric_max(metrics, "maxCarterResidualNormalized", execution.get("carterResidualNormalized"))
        update_metric_max(metrics, "maxMetricDerivativeAuditResidual", execution.get("metricDerivativeAuditResidual"))
        update_metric_max(metrics, "maxMetricPullbackResidual", execution.get("metricPullbackResidual"))
        update_metric_max(metrics, "maxCovectorRoundtripResidual", execution.get("covectorRoundtripResidual"))
        update_metric_max(metrics, "maxTetradResidual", execution.get("tetradResidual"))
        if execution["classification"] == "disk-hit":
            metrics["redshiftApplicableExecutionCount"] += 1
            update_metric_max(metrics, "maxIntensityInvariantResidual", execution.get("intensityInvariantResidual"))
        polarization = execution["polarization"]
        applicability = polarization["applicability"]
        metrics["polarizationApplicabilityCounts"][applicability] = metrics["polarizationApplicabilityCounts"].get(applicability, 0) + 1
        if applicability == "applicable-disk-hit":
            tolerance_class = execution["toleranceClass"]
            evpa_key = "maxReleaseEvpaDifferenceDeg" if tolerance_class == "release" else "maxInternalEvpaDifferenceDeg"
            residual_key = "maxReleasePolarizationResidual" if tolerance_class == "release" else "maxInternalPolarizationResidual"
            update_metric_max(metrics, evpa_key, polarization.get("evpaDifferenceDeg"))
            emitter = polarization["emitterResiduals"]
            direct = polarization["parallelTransport"]
            for key in ("waveOrthogonality", "emitterOrthogonality", "norm"):
                update_metric_max(metrics, residual_key, emitter.get(key))
            for key in ("nullResidualNormalized", "orthogonalityResidualNormalized", "normResidual",
                        "finalKsNormResidual", "walkerPenroseInvariantDrift", "endpointResidual"):
                update_metric_max(metrics, residual_key, direct.get(key))
    metrics["abCanonicalPairCount"] += 4
    for tolerance in ("release", "internal"):
        for branch in ("A", "B"):
            carter = by_identity[(CARTER_FORMULATION, tolerance, branch)]
            ks = by_identity[(KS_FORMULATION, tolerance, branch)]
            metrics["classificationComparisonCount"] += 1
            metrics["classificationAgreementCount"] += int(carter["classification"] == ks["classification"])
            if carter["classification"] == "disk-hit" and ks["classification"] == "disk-hit":
                metrics["redshiftComparisonCount"] += 1
                metrics["maxRedshiftFormulaDifference"] = max(
                    metrics["maxRedshiftFormulaDifference"],
                    abs(float(carter["redshift"]) - float(ks["redshift"])),
                )


def finalize_dense_metrics(metrics: dict[str, Any], expected_ray_count: int, scope: str = "aggregate") -> dict[str, Any]:
    expected_execution_count = expected_ray_count * EXECUTIONS_PER_RAY
    expected_matrix_keys = {f"{formulation}|{tolerance}|{branch}" for formulation in (CARTER_FORMULATION, KS_FORMULATION)
                            for tolerance in ("release", "internal") for branch in ("A", "B")}
    matrix_conserved = set(metrics["executionMatrixCounts"]) == expected_matrix_keys \
        and all(metrics["executionMatrixCounts"][key] == expected_ray_count for key in expected_matrix_keys)
    comparison_count = metrics["classificationComparisonCount"]
    classification_agreement = metrics["classificationAgreementCount"] / comparison_count if comparison_count else 0.0
    polarization_total = sum(metrics["polarizationApplicabilityCounts"].values())
    gates = {
        "rayConservation": metrics["rayCount"] == expected_ray_count,
        "executionConservation": metrics["executionCount"] == expected_execution_count,
        "executionMatrixConservation": matrix_conserved,
        "abCanonicalConservation": metrics["abCanonicalPairCount"] == expected_ray_count * 4,
        "classificationAgreement": scope != "aggregate" or classification_agreement >= 0.999,
        "classificationCoverage": scope != "aggregate" or all(metrics["classCounts"][kind] > 0 for kind in CLASSIFICATIONS),
        "selectedEventConservation": metrics["selectedEventCounts"] == metrics["classCounts"],
        "redshiftApplicabilityConservation": metrics["redshiftApplicableExecutionCount"] == metrics["classCounts"]["disk-hit"],
        "redshiftFormulaDifference": metrics["redshiftComparisonCount"] == 0 or metrics["maxRedshiftFormulaDifference"] < 0.005,
        "intensityInvariant": metrics["maxIntensityInvariantResidual"] < 1e-12,
        "polarizationApplicabilityConservation": polarization_total == expected_execution_count
            and metrics["polarizationApplicabilityCounts"]["unavailable"] == 0
            and (scope != "aggregate" or metrics["polarizationApplicabilityCounts"]["applicable-disk-hit"] > 0),
        "releaseEvpa": metrics["maxReleaseEvpaDifferenceDeg"] < 0.5,
        "internalEvpa": metrics["maxInternalEvpaDifferenceDeg"] < 0.1,
        "releasePolarizationResidual": metrics["maxReleasePolarizationResidual"] < 1e-10,
        "internalPolarizationResidual": metrics["maxInternalPolarizationResidual"] < 1e-11,
        "massShell": metrics["maxMassShellResidualNormalized"] < 1e-10,
        "carter": metrics["maxCarterResidualNormalized"] < 1e-10,
        "metricDerivative": metrics["maxMetricDerivativeAuditResidual"] < 1e-8,
        "metricPullback": metrics["maxMetricPullbackResidual"] < 1e-12,
        "covectorRoundtrip": metrics["maxCovectorRoundtripResidual"] < 1e-12,
        "tetrad": metrics["maxTetradResidual"] < 1e-12,
        "zeroInvalidTimeout": metrics["invalidCount"] == 0 and metrics["timeoutCount"] == 0,
    }
    failed = [name for name, passed in gates.items() if not passed]
    if failed:
        raise RuntimeError(f"v298r1 dense qualification gates failed: {','.join(failed)}")
    return {
        **metrics,
        "classificationAgreement": classification_agreement,
        "thresholds": {
            "classificationAgreementMinimum": 0.999,
            "redshiftFormulaDifferenceMaximum": 0.005,
            "intensityInvariantMaximum": 1e-12,
            "releaseEvpaDifferenceDegMaximum": 0.5,
            "internalEvpaDifferenceDegMaximum": 0.1,
            "releasePolarizationResidualMaximum": 1e-10,
            "internalPolarizationResidualMaximum": 1e-11,
        },
        "gates": gates,
        "scope": scope,
        "statisticalGatesApplied": scope == "aggregate",
        "qualified": True,
    }


def create_dimension_preserving_error_budget(metrics: dict[str, Any], qualification: dict[str, Any]) -> dict[str, Any]:
    return {
        "version": "v298r1-dense-kerr-error-budget-v1",
        "scope": qualification["scope"],
        "authority": "measured-residuals-and-formula-differences-only",
        "independenceAssumption": "not-established",
        "combinationPolicy": "componentwise-reporting-no-rss-no-cross-dimension-sum",
        "components": {
            "massShellNormalized": {"observed": metrics["maxMassShellResidualNormalized"], "threshold": 1e-10, "unit": "dimensionless", "source": "execution.massShellResidualNormalized"},
            "carterFirstIntegralNormalized": {"observed": metrics["maxCarterResidualNormalized"], "threshold": 1e-10, "unit": "dimensionless", "source": "execution.carterResidualNormalized"},
            "metricDerivativeAudit": {"observed": metrics["maxMetricDerivativeAuditResidual"], "threshold": 1e-8, "unit": "dimensionless", "source": "execution.metricDerivativeAuditResidual"},
            "metricPullback": {"observed": metrics["maxMetricPullbackResidual"], "threshold": 1e-12, "unit": "dimensionless", "source": "execution.metricPullbackResidual"},
            "covectorRoundtrip": {"observed": metrics["maxCovectorRoundtripResidual"], "threshold": 1e-12, "unit": "dimensionless", "source": "execution.covectorRoundtripResidual"},
            "tetrad": {"observed": metrics["maxTetradResidual"], "threshold": 1e-12, "unit": "dimensionless", "source": "execution.tetradResidual"},
            "redshiftFormulaDifference": {"observed": metrics["maxRedshiftFormulaDifference"], "threshold": 0.005, "unit": "dimensionless", "source": "Carter-vs-KS disk-hit pair"},
            "intensityInvariant": {"observed": metrics["maxIntensityInvariantResidual"], "threshold": 1e-12, "unit": "dimensionless", "source": "execution.intensityInvariantResidual"},
            "releaseEvpaDifference": {"observed": metrics["maxReleaseEvpaDifferenceDeg"], "threshold": 0.5, "unit": "deg", "source": "Carter WP-vs-parallel-transport"},
            "internalEvpaDifference": {"observed": metrics["maxInternalEvpaDifferenceDeg"], "threshold": 0.1, "unit": "deg", "source": "Carter WP-vs-parallel-transport"},
            "releasePolarizationResidual": {"observed": metrics["maxReleasePolarizationResidual"], "threshold": 1e-10, "unit": "dimensionless", "source": "emitter/transport residuals"},
            "internalPolarizationResidual": {"observed": metrics["maxInternalPolarizationResidual"], "threshold": 1e-11, "unit": "dimensionless", "source": "emitter/transport residuals"},
        },
        "unreportedComponents": {
            "uReference": "held by v296/v297 authority envelope",
            "uInitialState": "not-estimated-by-dense-ray-campaign",
            "uFit": "not-estimated-by-dense-ray-campaign",
            "uConstants": "not-estimated-by-dense-ray-campaign",
            "uModel": "not-estimated-by-dense-ray-campaign",
        },
    }


def polarization_payload(row: dict[str, Any], ray_fixture: Any) -> dict[str, Any]:
    if row.get("classification") != "disk-hit":
        return {"applicability": "not-applicable", "reason": "no-disk-emission-event"}
    if row.get("formulation") != "carter-mino-dop853-constraint-stabilized-v296":
        return {"applicability": "geometry-cross-check-only", "reason": "v297-polarization-seed-authority-is-carter"}
    seed = row.get("polarizationSeed")
    if not isinstance(seed, dict):
        return {"applicability": "unavailable", "reason": "missing-polarization-seed"}
    try:
        coordinates = np.asarray(seed["coordinatesBl"], dtype=float)
        wavevector = np.asarray(seed["wavevectorBl"], dtype=float)
        emitter, polarization, emitter_residuals = POLARIZATION_AUTHORITY.projected_disk_normal_polarization(
            coordinates, wavevector, ray_fixture.spin
        )
        constant = POLARIZATION_AUTHORITY.walker_penrose_constant(
            ray_fixture.spin, float(coordinates[1]), float(coordinates[2]), wavevector, polarization
        )
        observer_coordinates = np.asarray((0.0, BASE.R_OBSERVER, BASE.THETA_OBSERVER, 0.0), dtype=float)
        observer_tetrad = BASE.zamo_tetrad(BASE.R_OBSERVER, BASE.THETA_OBSERVER, ray_fixture.spin)
        observer = observer_tetrad[:, 0]
        expected_wavevector = BASE.initial_bl_state(ray_fixture)["momentumUp"]
        reconstructed = POLARIZATION_AUTHORITY.reconstruct_walker_penrose(
            observer_coordinates, expected_wavevector, observer, constant, ray_fixture.spin
        )
        direct = POLARIZATION_AUTHORITY.direct_parallel_transport(
            coordinates, wavevector, polarization, ray_fixture.spin, float(row["tolerance"]), constant
        )
        if not direct.get("success"):
            raise RuntimeError(str(direct.get("failure") or "parallel-transport-failed"))
        direct_coordinates = np.asarray(direct["coordinatesBl"], dtype=float)
        direct_wavevector = np.asarray(direct["wavevectorBl"], dtype=float)
        direct_polarization = np.asarray(direct["polarizationBl"], dtype=float)
        direct_observer = BASE.zamo_tetrad(float(direct_coordinates[1]), float(direct_coordinates[2]), ray_fixture.spin)[:, 0]
        wp_evpa = POLARIZATION_AUTHORITY.screen_evpa_deg(
            observer_coordinates, expected_wavevector, reconstructed, observer, ray_fixture.spin
        )
        pt_evpa = POLARIZATION_AUTHORITY.screen_evpa_deg(
            direct_coordinates, direct_wavevector, direct_polarization, direct_observer, ray_fixture.spin
        )
        difference = POLARIZATION_AUTHORITY.evpa_difference(wp_evpa, pt_evpa)
        return {
            "applicability": "applicable-disk-hit",
            "emitterModel": "projected-disk-normal",
            "walkerPenroseEvpaDeg": wp_evpa,
            "parallelTransportEvpaDeg": pt_evpa,
            "evpaDifferenceDeg": difference,
            "walkerPenroseConstant": {"real": constant.real, "imaginary": constant.imag},
            "emitterResiduals": emitter_residuals,
            "parallelTransport": {key: value for key, value in direct.items()
                                  if key not in {"coordinatesBl", "wavevectorBl", "polarizationBl"}},
        }
    except (RuntimeError, ValueError, FloatingPointError) as error:
        return {"applicability": "unavailable", "reason": str(error)[:240]}


def evaluate_ray(ray: dict[str, Any]) -> dict[str, Any]:
    ray_fixture = fixture(ray)
    executions: list[dict[str, Any]] = []
    for tolerance in (BASE.RELEASE_TOLERANCE, BASE.INTERNAL_TOLERANCE):
        for branch in ("A", "B"):
            carter = GEOMETRY_AUTHORITY.evaluate_carter_stabilized(ray_fixture, tolerance, branch)
            carter["formulation"] = "carter-mino-dop853-constraint-stabilized-v296"
            carter["polarization"] = polarization_payload(carter, ray_fixture)
            ks = BASE.evaluate_ks(ray_fixture, tolerance, branch)
            ks["polarization"] = polarization_payload(ks, ray_fixture)
            executions.extend((carter, ks))
    if len(executions) != EXECUTIONS_PER_RAY:
        raise RuntimeError(f"ray {ray['rayIndex']} execution conservation failed")
    if any(row.get("invalid") is True or row.get("timeout") is True for row in executions):
        raise RuntimeError(f"ray {ray['rayIndex']} produced invalid or timeout execution")
    if not finite_json(executions):
        raise RuntimeError(f"ray {ray['rayIndex']} produced a non-finite JSON value")
    classes = sorted({str(row.get("classification")) for row in executions})
    result = {
        "version": "v298r1-kerr-dense-ray-result-v1",
        "rayIndex": ray["rayIndex"],
        "rayId": ray["rayId"],
        "stratum": ray["stratum"],
        "alphaM": ray["alphaM"],
        "betaM": ray["betaM"],
        "spinA": ray["spinA"],
        "executionCount": len(executions),
        "classifications": classes,
        "executions": executions,
    }
    validate_ray_result(result, ray)
    return {**result, "raySha256": value_sha(result)}


def verify_part(path: Path, expected_rays: list[dict[str, Any]]) -> int:
    if not path.exists():
        return 0
    completed = 0
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            unsigned = {key: value for key, value in row.items() if key != "raySha256"}
            if value_sha(unsigned) != row.get("raySha256"):
                raise RuntimeError("v298r1 ray checkpoint SHA mismatch")
            if completed >= len(expected_rays) or row.get("rayIndex") != expected_rays[completed].get("rayIndex"):
                raise RuntimeError("v298r1 ray checkpoint ordering mismatch")
            validate_ray_result(row, expected_rays[completed])
            completed += 1
    return completed


def append_ray(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False))
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())


def completed_shards(state: dict[str, Any], plan: dict[str, Any]) -> list[int]:
    completed: list[int] = []
    for shard in plan["shards"]:
        index = int(shard["shardIndex"])
        data_path = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = SHARDS / f"shard-{index:02d}.sidecar.json"
        if not data_path.exists() or not sidecar_path.exists():
            continue
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        if sidecar.get("fileSha256") != file_sha(data_path) or sidecar.get("rayPlanSha256") != plan["planSha256"]:
            raise RuntimeError(f"v298r1 shard {index} sidecar mismatch")
        if sidecar.get("rayCount") != shard["rayCount"] or sidecar.get("executionCount") != shard["rayCount"] * EXECUTIONS_PER_RAY:
            raise RuntimeError(f"v298r1 shard {index} conservation mismatch")
        expected_rays = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
        if verify_part(data_path, expected_rays) != shard["rayCount"]:
            raise RuntimeError(f"v298r1 shard {index} payload validation mismatch")
        completed.append(index)
    if state.get("completedShardIndices") not in (None, completed):
        raise RuntimeError("v298r1 campaign state does not match published shards")
    return completed


def run_next() -> dict[str, Any]:
    state, authority, plan = load_state()
    if state.get("failedShardIndex") is not None:
        raise RuntimeError("previous v298r1 shard failed; automatic retry is forbidden")
    completed = completed_shards(state, plan)
    next_index = next((index for index in range(SHARD_COUNT) if index not in completed), None)
    if next_index is None:
        state.update({"status": "complete-awaiting-aggregate", "completedShardIndices": completed,
                      "completedShardCount": SHARD_COUNT, "nextShardIndex": None,
                      "runNextAvailable": False, "aggregateAvailable": True})
        save_state(state)
        return state
    free_memory = available_memory_bytes()
    free_disk = shutil.disk_usage(OUT.parent).free
    if free_memory < MINIMUM_FREE_MEMORY_BYTES or free_disk < MINIMUM_FREE_DISK_BYTES:
        state.update({"status": f"incomplete-{len(completed)}-of-49", "attemptConsumed": False,
                      "resourcePreflight": {"freeMemoryBytes": free_memory, "freeDiskBytes": free_disk,
                                            "minimumFreeMemoryBytes": MINIMUM_FREE_MEMORY_BYTES,
                                            "minimumFreeDiskBytes": MINIMUM_FREE_DISK_BYTES, "passed": False}})
        save_state(state)
        return state
    shard = plan["shards"][next_index]
    rays = plan["rays"][shard["rayStart"]:shard["rayEndExclusive"]]
    part = CHECKPOINTS / f"shard-{next_index:02d}.ndjson.part"
    checkpoint_path = CHECKPOINTS / f"shard-{next_index:02d}.checkpoint.json"
    resumed = verify_part(part, rays)
    state.update({"status": f"running-shard-{next_index}", "attemptConsumed": True,
                  "activeShardIndex": next_index, "resourcePreflight": {
                      "freeMemoryBytes": free_memory, "freeDiskBytes": free_disk,
                      "minimumFreeMemoryBytes": MINIMUM_FREE_MEMORY_BYTES,
                      "minimumFreeDiskBytes": MINIMUM_FREE_DISK_BYTES, "passed": True}})
    save_state(state)
    monitor = PeakRssMonitor()
    try:
        with monitor:
            for local_index in range(resumed, len(rays)):
                result = evaluate_ray(rays[local_index])
                append_ray(part, result)
                checkpoint_unsigned = {
                    "version": "v298r1-kerr-dense-shard-checkpoint-v1", "generatedAt": utc(),
                    "shardIndex": next_index, "completedRayCount": local_index + 1,
                    "nextRayIndex": rays[local_index]["rayIndex"] + 1 if local_index + 1 < len(rays) else None,
                    "partBytes": part.stat().st_size, "partSha256": file_sha(part),
                    "rayPlanSha256": plan["planSha256"], "authority": authority["identity"],
                    "automaticRetryApplied": False,
                }
                atomic_json(checkpoint_path, {**checkpoint_unsigned, "checkpointSha256": value_sha(checkpoint_unsigned)})
        if monitor.failure is not None:
            raise RuntimeError(f"RSS telemetry failed: {monitor.failure}")
        if monitor.peak >= PEAK_RSS_LIMIT_BYTES:
            raise RuntimeError(f"peak RSS exceeded: {monitor.peak}>={PEAK_RSS_LIMIT_BYTES}")
        if verify_part(part, rays) != len(rays):
            raise RuntimeError("v298r1 completed shard ray conservation failed")
        published = SHARDS / f"shard-{next_index:02d}.ndjson"
        published.parent.mkdir(parents=True, exist_ok=True)
        os.replace(part, published)
        sidecar_unsigned = {
            "version": "v298r1-kerr-dense-shard-sidecar-v1", "generatedAt": utc(),
            "shardIndex": next_index, "rayStart": shard["rayStart"],
            "rayEndExclusive": shard["rayEndExclusive"], "rayCount": shard["rayCount"],
            "executionCount": shard["rayCount"] * EXECUTIONS_PER_RAY,
            "path": published.relative_to(ROOT).as_posix(), "bytes": published.stat().st_size,
            "fileSha256": file_sha(published), "rayPlanSha256": plan["planSha256"],
            "authority": authority["identity"], "peakRssBytes": monitor.peak,
            "rssTelemetry": {"status": "measured", "probe": RSS_PROBE_VERSION,
                             "peakRssBytes": monitor.peak, "limitBytes": PEAK_RSS_LIMIT_BYTES,
                             "gatePassed": monitor.peak < PEAK_RSS_LIMIT_BYTES},
            "complete": True, "automaticRetryApplied": False,
        }
        sidecar = {**sidecar_unsigned, "sidecarSha256": value_sha(sidecar_unsigned)}
        atomic_json(SHARDS / f"shard-{next_index:02d}.sidecar.json", sidecar)
        completed = completed_shards({**state, "completedShardIndices": None}, plan)
        next_shard = next((index for index in range(SHARD_COUNT) if index not in completed), None)
        campaign_peak_rss = max(int(state.get("peakRssBytes", 0)), monitor.peak)
        state.update({"status": f"incomplete-{len(completed)}-of-49" if next_shard is not None else "complete-awaiting-aggregate",
                      "completedShardIndices": completed, "completedShardCount": len(completed),
                      "nextShardIndex": next_shard, "activeShardIndex": None, "failure": None,
                      "peakRssBytes": campaign_peak_rss,
                      "rssTelemetry": {"status": "measured", "probe": RSS_PROBE_VERSION,
                                       "peakRssBytes": campaign_peak_rss, "lastShardPeakRssBytes": monitor.peak,
                                       "limitBytes": PEAK_RSS_LIMIT_BYTES,
                                       "gatePassed": campaign_peak_rss < PEAK_RSS_LIMIT_BYTES},
                      "runNextAvailable": next_shard is not None, "aggregateAvailable": next_shard is None})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": next_index,
                      "nextShardIndex": next_index, "failure": str(error)[:500],
                      "peakRssBytes": monitor.peak, "attemptConsumed": True,
                      "rssTelemetry": {"status": "measurement-failed" if monitor.failure else "measured",
                                       "probe": RSS_PROBE_VERSION, "peakRssBytes": monitor.peak,
                                       "limitBytes": PEAK_RSS_LIMIT_BYTES,
                                       "gatePassed": False, "failure": monitor.failure},
                      "runNextAvailable": False, "aggregateAvailable": False})
        save_state(state)
        raise


def aggregate() -> dict[str, Any]:
    state, authority, plan = load_state()
    if state.get("status") == "aggregate-failed-no-automatic-retry":
        raise RuntimeError("previous v298r1 aggregate failed; automatic retry is forbidden")
    completed = completed_shards(state, plan)
    if completed != list(range(SHARD_COUNT)):
        state["partialAggregate"] = False
        state["aggregateAvailable"] = False
        save_state(state)
        raise RuntimeError(f"partial aggregate refused: {len(completed)}/{SHARD_COUNT} shards")
    metrics = new_dense_metrics()
    shard_rows = []
    for index in completed:
        path = SHARDS / f"shard-{index:02d}.ndjson"
        sidecar_path = SHARDS / f"shard-{index:02d}.sidecar.json"
        sidecar = read_verified(sidecar_path, "sidecarSha256")
        shard_rows.append({"index": index, "path": path.relative_to(ROOT).as_posix(),
                           "fileSha256": file_sha(path), "sidecarSha256": sidecar["sidecarSha256"]})
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                ray = json.loads(line)
                ray_index = ray.get("rayIndex")
                if not isinstance(ray_index, int) or ray_index < 0 or ray_index >= len(plan["rays"]):
                    raise RuntimeError("v298r1 aggregate ray index is invalid")
                validate_ray_result(ray, plan["rays"][ray_index])
                accumulate_dense_metrics(metrics, ray)
    qualification = finalize_dense_metrics(metrics, RAY_COUNT)
    error_budget = create_dimension_preserving_error_budget(metrics, qualification)
    unsigned = {
        "version": "v298r1-kerr-dense-aggregate-v1", "generatedAt": utc(), "status": "complete",
        "rayCount": metrics["rayCount"], "executionCount": metrics["executionCount"], "shardCount": len(shard_rows),
        "classCounts": metrics["classCounts"],
        "applicablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["applicable-disk-hit"],
        "unavailablePolarizationExecutionCount": metrics["polarizationApplicabilityCounts"]["unavailable"],
        "qualification": qualification, "errorBudget": error_budget, "shards": shard_rows,
        "rayPlanSha256": plan["planSha256"], "authority": authority["identity"],
        "partialAggregate": False, "formalProductPointer": "v263",
        "boundary": "complete-dense-authority-summary-no-runtime-promotion",
    }
    document = {**unsigned, "aggregateSha256": value_sha(unsigned)}
    atomic_json(AGGREGATE, document)
    state.update({"status": "complete", "partialAggregate": False, "aggregateAvailable": True,
                  "aggregate": {"path": AGGREGATE.relative_to(ROOT).as_posix(), "fileSha256": file_sha(AGGREGATE),
                                "canonicalSha256": document["aggregateSha256"]}})
    save_state(state)
    return document


def audit_published_shard(shard_index: int) -> dict[str, Any]:
    state, authority, plan = load_state()
    completed = completed_shards(state, plan)
    if shard_index not in completed:
        raise RuntimeError(f"v298r1 shard {shard_index} is not published")
    shard = plan["shards"][shard_index]
    path = SHARDS / f"shard-{shard_index:02d}.ndjson"
    sidecar_path = SHARDS / f"shard-{shard_index:02d}.sidecar.json"
    sidecar = read_verified(sidecar_path, "sidecarSha256")
    metrics = new_dense_metrics()
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            ray = json.loads(line)
            index = ray.get("rayIndex")
            if not isinstance(index, int) or index < shard["rayStart"] or index >= shard["rayEndExclusive"]:
                raise RuntimeError(f"v298r1 shard {shard_index} ray range mismatch")
            validate_ray_result(ray, plan["rays"][index])
            accumulate_dense_metrics(metrics, ray)
    if metrics["rayCount"] != shard["rayCount"]:
        raise RuntimeError(f"v298r1 shard {shard_index} ray count mismatch")
    qualification = finalize_dense_metrics(metrics, shard["rayCount"], scope="shard")
    unsigned = {
        "version": "v298r1-kerr-dense-shard-science-audit-v1",
        "generatedAt": utc(),
        "status": "shard-structural-qualified",
        "shardIndex": shard_index,
        "rayStart": shard["rayStart"],
        "rayEndExclusive": shard["rayEndExclusive"],
        "rayCount": metrics["rayCount"],
        "executionCount": metrics["executionCount"],
        "path": path.relative_to(ROOT).as_posix(),
        "fileSha256": file_sha(path),
        "sidecarSha256": sidecar["sidecarSha256"],
        "rayPlanSha256": plan["planSha256"],
        "authority": authority["identity"],
        "qualification": qualification,
        "errorBudget": create_dimension_preserving_error_budget(metrics, qualification),
        "partialAggregate": True,
        "aggregateEligible": False,
        "formalProductPointer": "v263",
        "automaticRetryApplied": False,
    }
    document = {**unsigned, "auditSha256": value_sha(unsigned)}
    AUDITS.mkdir(parents=True, exist_ok=True)
    atomic_json(AUDITS / f"shard-{shard_index:02d}.science-audit.json", document)
    return document


def validate_published_audits(
    authority: dict[str, Any],
    plan: dict[str, Any],
    completed: list[int],
) -> list[int]:
    validated: list[int] = []
    for shard_index in completed:
        audit_path = AUDITS / f"shard-{shard_index:02d}.science-audit.json"
        if not audit_path.exists():
            continue
        audit = read_verified(audit_path, "auditSha256")
        shard = plan["shards"][shard_index]
        data_path = SHARDS / f"shard-{shard_index:02d}.ndjson"
        gates = audit.get("qualification", {}).get("gates", {})
        if audit.get("status") != "shard-structural-qualified" \
                or audit.get("shardIndex") != shard_index \
                or audit.get("rayCount") != shard["rayCount"] \
                or audit.get("executionCount") != shard["rayCount"] * EXECUTIONS_PER_RAY \
                or audit.get("fileSha256") != file_sha(data_path) \
                or audit.get("rayPlanSha256") != plan["planSha256"] \
                or audit.get("authority") != authority["identity"] \
                or audit.get("qualification", {}).get("qualified") is not True \
                or audit.get("qualification", {}).get("scope") != "shard" \
                or audit.get("qualification", {}).get("statisticalGatesApplied") is not False \
                or not isinstance(gates, dict) or not gates or any(passed is not True for passed in gates.values()) \
                or audit.get("errorBudget", {}).get("combinationPolicy") != "componentwise-reporting-no-rss-no-cross-dimension-sum" \
                or audit.get("aggregateEligible") is not False:
            raise RuntimeError(f"v298r1 shard {shard_index} science audit mismatch")
        validated.append(shard_index)
    return validated


def record_aggregate_failure(error: Exception) -> None:
    try:
        state, authority, plan = load_state()
        if state.get("status") == "aggregate-failed-no-automatic-retry":
            return
        completed = completed_shards(state, plan)
        if completed != list(range(SHARD_COUNT)):
            return
        unsigned = {
            "version": "v298r1-kerr-dense-aggregate-negative-evidence-v1",
            "generatedAt": utc(),
            "status": "aggregate-failed-no-automatic-retry",
            "completedShardCount": len(completed),
            "plannedShardCount": SHARD_COUNT,
            "failure": str(error)[:500],
            "rayPlanSha256": plan["planSha256"],
            "authority": authority["identity"],
            "partialAggregate": False,
            "automaticRetryApplied": False,
            "formalProductPointer": "v263",
        }
        document = {**unsigned, "negativeEvidenceSha256": value_sha(unsigned)}
        atomic_json(AGGREGATE_NEGATIVE, document)
        state.update({
            "status": "aggregate-failed-no-automatic-retry",
            "aggregateAvailable": False,
            "partialAggregate": False,
            "aggregateFailure": str(error)[:500],
            "aggregateNegativeEvidence": {
                "path": AGGREGATE_NEGATIVE.relative_to(ROOT).as_posix(),
                "fileSha256": file_sha(AGGREGATE_NEGATIVE),
                "canonicalSha256": document["negativeEvidenceSha256"],
            },
        })
        save_state(state)
    except Exception:
        # Preserve the original aggregate error if even the negative-evidence
        # path cannot establish the immutable authority/state locks.
        return


def compact(result: dict[str, Any]) -> dict[str, Any]:
    keys = ("version", "status", "shardIndex", "rayCount", "executionCount", "auditSha256",
            "completedShardCount", "nextShardIndex", "failedShardIndex", "failure",
            "attemptConsumed", "peakRssBytes", "stateSha256")
    return {key: result[key] for key in keys if key in result}


def rss_probe() -> dict[str, Any]:
    """Read-only verification for the corrected future-shard RSS probe.

    This deliberately does not rewrite the immutable shard-0 history or
    consume a campaign attempt. It only proves that the current process can
    obtain a positive bounded peak-working-set measurement and reports the
    campaign state as context.
    """
    peak = process_rss_bytes()
    state, _authority, _plan = load_state()
    return {
        "version": "v298r1-kerr-dense-rss-probe-v1",
        "status": "rss-probe-verified" if 0 < peak < PEAK_RSS_LIMIT_BYTES else "rss-probe-failed",
        "probe": RSS_PROBE_VERSION,
        "peakRssBytes": peak,
        "limitBytes": PEAK_RSS_LIMIT_BYTES,
        "gate": 0 < peak < PEAK_RSS_LIMIT_BYTES,
        "attemptConsumed": False,
        "campaignStatus": state.get("status"),
        "completedShardCount": state.get("completedShardCount"),
        "nextShardIndex": state.get("nextShardIndex"),
        "campaignAttemptConsumed": state.get("attemptConsumed"),
        "campaignStateSha256": state.get("stateSha256"),
    }


def publish_rss_probe() -> dict[str, Any]:
    """Publish a bounded instrumentation audit without rewriting shard history.

    The positive process measurement validates the corrected Windows probe for
    future shards.  It cannot reconstruct shard 0's historical peak, so that
    resource gate remains explicitly unqualified instead of being backfilled.
    """
    result = rss_probe()
    unsigned = {
        **result,
        "version": "v298r1-kerr-dense-rss-probe-evidence-v2",
        "generatedAt": utc(),
        "status": "corrected-probe-qualified-shard0-unmeasured" if result["gate"] else "corrected-probe-failed",
        "scope": "instrumentation-only-future-shards-not-retrospective-shard-measurement",
        "historicalShardIndex": 0,
        "historicalShardRssQualified": False,
        "campaignStateMutationApplied": False,
        "automaticRetryApplied": False,
        "formalProductPointer": "v263",
    }
    evidence = {**unsigned, "evidenceSha256": value_sha(unsigned)}
    atomic_json(RSS_PROBE_EVIDENCE, evidence)
    return evidence


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v298r1 corrected dense Kerr campaign")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init", action="store_true")
    group.add_argument("--status", action="store_true")
    group.add_argument("--run-next", action="store_true")
    group.add_argument("--run-series", action="store_true")
    group.add_argument("--aggregate", action="store_true")
    group.add_argument("--audit-published", type=int, metavar="SHARD_INDEX")
    group.add_argument("--probe-rss", action="store_true")
    args = parser.parse_args()
    if args.probe_rss:
        print(json.dumps(publish_rss_probe(), indent=2))
        return
    if args.init:
        result = initialize()
    elif args.status:
        result, authority, plan = load_state()
        published = completed_shards(result, plan)
        if len(published) != int(result.get("completedShardCount", -1)):
            raise RuntimeError("v298r1 status/published shard conservation mismatch")
        validate_published_audits(authority, plan, published)
    elif args.run_next:
        result = run_next()
    elif args.aggregate:
        try:
            result = aggregate()
        except Exception as error:
            record_aggregate_failure(error)
            raise
    elif args.audit_published is not None:
        result = audit_published_shard(args.audit_published)
    else:
        result, _authority, _plan = load_state()
        while result.get("nextShardIndex") is not None and result.get("failedShardIndex") is None:
            child = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--run-next"], cwd=ROOT, check=False)
            if child.returncode != 0:
                raise SystemExit(child.returncode)
            result, _authority, _plan = load_state()
    print(json.dumps(compact(result), indent=2))


if __name__ == "__main__":
    main()

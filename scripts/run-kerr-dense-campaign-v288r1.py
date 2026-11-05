"""Single-shard controller for the v288r1 corrected Kerr campaign."""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import importlib.util
import json
import math
import os
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/kerr-campaign-v288r1"
SHARDS = OUT / "shards"
STATE = OUT / "campaign-state.json"
AUTHORITY_SOURCE = ROOT / "scripts/run-kerr-authority-v288.py"
AUTHORITY_EVIDENCE = ROOT / "dist/science/kerr-reference-v288/short-gate-evidence.json"
RAY_COUNT = 3097
SHARD_COUNT = 49
SHARD_SIZE = 64
EXECUTIONS_PER_RAY = 8
MINIMUM_FREE_MEMORY_BYTES = 4 * 2**30
PEAK_RSS_LIMIT_BYTES = 2 * 2**30


def load_authority():
    spec = importlib.util.spec_from_file_location("atlas_kerr_v288_authority", AUTHORITY_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v288 authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
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


def free_memory_bytes() -> int:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong), ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong), ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong), ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong), ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]
        status = MemoryStatus(); status.dwLength = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise RuntimeError("unable to inspect physical memory")
        return int(status.ullAvailPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def current_rss_bytes() -> int:
    if os.name == "nt":
        class ProcessMemoryCounters(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong), ("PeakWorkingSetSize", ctypes.c_size_t), ("WorkingSetSize", ctypes.c_size_t), ("QuotaPeakPagedPoolUsage", ctypes.c_size_t), ("QuotaPagedPoolUsage", ctypes.c_size_t), ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("QuotaNonPagedPoolUsage", ctypes.c_size_t), ("PagefileUsage", ctypes.c_size_t), ("PeakPagefileUsage", ctypes.c_size_t)]
        counters = ProcessMemoryCounters(); counters.cb = ctypes.sizeof(counters)
        handle = ctypes.windll.kernel32.GetCurrentProcess()
        if not ctypes.windll.psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb):
            return 0
        return int(counters.WorkingSetSize)
    import resource
    return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024)


def initial_state(gate: dict[str, Any]) -> dict[str, Any]:
    status = "pending" if gate.get("gatePassed") is True else "blocked-short-gate"
    core = {
        "version": "v288r1-corrected-kerr-dense-campaign-state-v1", "generatedAt": utc(),
        "status": status, "plannedRayCount": RAY_COUNT, "plannedShardCount": SHARD_COUNT,
        "shardSizeLimit": SHARD_SIZE, "executionsPerRay": EXECUTIONS_PER_RAY,
        "completedShardIndices": [], "completedShardCount": 0, "nextShardIndex": 0 if status == "pending" else None,
        "failedShardIndex": None, "failure": None, "automaticRetryApplied": False,
        "authorityEvidenceSha256": gate.get("evidenceSha256", ""), "authoritySourceSha256": file_sha(AUTHORITY_SOURCE),
        "formalProductPointer": "v263", "defaultKernel": "legacy-eih-1pn",
        "boundary": "new-authority-namespace-single-shard-explicit-only",
    }
    return {**core, "stateSha256": value_sha(core)}


def load_gate() -> dict[str, Any]:
    if not AUTHORITY_EVIDENCE.exists():
        raise RuntimeError("v288 short-gate evidence is missing")
    gate = json.loads(AUTHORITY_EVIDENCE.read_text(encoding="utf-8"))
    unsigned = {key: value for key, value in gate.items() if key != "evidenceSha256"}
    if value_sha(unsigned) != gate.get("evidenceSha256"):
        raise RuntimeError("v288 short-gate evidence SHA mismatch")
    return gate


def load_state() -> dict[str, Any]:
    gate = load_gate()
    if not STATE.exists():
        state = initial_state(gate)
        atomic_json(STATE, state)
        return state
    state = json.loads(STATE.read_text(encoding="utf-8"))
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    if value_sha(unsigned) != state.get("stateSha256"):
        raise RuntimeError("v288r1 campaign state SHA mismatch")
    if state.get("authorityEvidenceSha256") != gate.get("evidenceSha256") or state.get("authoritySourceSha256") != file_sha(AUTHORITY_SOURCE):
        raise RuntimeError("v288r1 authority identity changed")
    return state


def save_state(state: dict[str, Any]) -> None:
    state["generatedAt"] = utc()
    unsigned = {key: value for key, value in state.items() if key != "stateSha256"}
    state["stateSha256"] = value_sha(unsigned)
    atomic_json(STATE, state)


def dense_fixture(index: int):
    side = 56
    x = index % side
    y = (index // side) % side
    alpha = -22.0 + 44.0 * x / (side - 1)
    beta = -16.0 + 32.0 * y / (side - 1)
    spin = (-0.9, 0.0, 0.9)[index % 3]
    return AUTHORITY.RayFixture(f"dense-{index:04d}", alpha, beta, spin, "unclassified")


def run_next() -> dict[str, Any]:
    gate = load_gate()
    state = load_state()
    if gate.get("gatePassed") is not True:
        state.update({"status": "blocked-short-gate", "nextShardIndex": None, "failure": "v288-short-gate-not-qualified"})
        save_state(state)
        return state
    if state.get("failedShardIndex") is not None or state.get("completedShardCount", 0) > 0:
        raise RuntimeError("the single authorized v288r1 shard attempt was already consumed")
    available = free_memory_bytes()
    if available < MINIMUM_FREE_MEMORY_BYTES:
        state.update({"status": "blocked-resource-preflight", "attemptConsumed": False, "freeMemoryBytes": available})
        save_state(state)
        return state
    stop_event = threading.Event()
    peak = current_rss_bytes()
    def monitor() -> None:
        nonlocal peak
        while not stop_event.wait(0.05):
            peak = max(peak, current_rss_bytes())
    thread = threading.Thread(target=monitor, name="v288-rss-monitor", daemon=True)
    thread.start()
    try:
        rays = []
        for index in range(SHARD_SIZE):
            fixture = dense_fixture(index)
            executions = []
            for tolerance in (1e-8, 1e-10):
                for branch in ("A", "B"):
                    executions.append(AUTHORITY.evaluate_carter(fixture, tolerance, branch))
                    executions.append(AUTHORITY.evaluate_ks(fixture, tolerance, branch))
            if len(executions) != EXECUTIONS_PER_RAY or any(row["invalid"] or row["timeout"] for row in executions):
                raise RuntimeError(f"dense ray {index} produced invalid authority executions")
            rays.append({"rayIndex": index, "executionCount": len(executions), "executions": executions, "raySha256": value_sha(executions)})
        peak = max(peak, current_rss_bytes())
        if peak > PEAK_RSS_LIMIT_BYTES:
            raise RuntimeError(f"peak RSS exceeded: {peak}>{PEAK_RSS_LIMIT_BYTES}")
        core = {
            "version": "v288r1-corrected-kerr-dense-shard-v1", "generatedAt": utc(),
            "shardIndex": 0, "rayStart": 0, "rayStopExclusive": SHARD_SIZE, "rayCount": len(rays),
            "executionCount": len(rays) * EXECUTIONS_PER_RAY, "rays": rays, "peakRssBytes": peak,
            "authorityEvidenceSha256": gate["evidenceSha256"], "authoritySourceSha256": file_sha(AUTHORITY_SOURCE),
            "complete": True, "automaticRetryApplied": False,
        }
        shard = {**core, "shardSha256": value_sha(core)}
        path = SHARDS / "shard-00.json"
        atomic_json(path, shard)
        published = json.loads(path.read_text(encoding="utf-8"))
        if value_sha({key: value for key, value in published.items() if key != "shardSha256"}) != published.get("shardSha256"):
            raise RuntimeError("v288r1 shard SHA verification failed")
        state.update({"status": "running", "completedShardIndices": [0], "completedShardCount": 1, "nextShardIndex": 1, "peakRssBytes": peak, "attemptConsumed": True})
        save_state(state)
        return state
    except Exception as error:
        state.update({"status": "failed-no-automatic-retry", "failedShardIndex": 0, "failure": str(error), "nextShardIndex": 0, "attemptConsumed": True, "peakRssBytes": peak})
        save_state(state)
        return state
    finally:
        stop_event.set(); thread.join(timeout=1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v288r1 single-shard campaign")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status", action="store_true")
    group.add_argument("--run-next", action="store_true")
    args = parser.parse_args()
    result = load_state() if args.status else run_next()
    print(json.dumps({key: result.get(key) for key in ("status", "completedShardCount", "nextShardIndex", "failedShardIndex", "failure", "attemptConsumed", "peakRssBytes")}, indent=2))
    if result.get("status") in {"blocked-short-gate", "blocked-resource-preflight", "failed-no-automatic-retry"}:
        raise SystemExit(2)


if __name__ == "__main__":
    main()

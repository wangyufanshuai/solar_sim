"""Requalify WP/direct-transport polarization against v312 geometry.

The v297 polarization equations remain frozen.  v313 replaces only their
geometry input with the SHA-locked v312 corrected two-tolerance authority and
records a new independent namespace.  No dense shard or runtime physics path
is created or modified.
"""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import importlib.util
import json
import os
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import psutil  # type: ignore
except ImportError:
    psutil = None

ROOT = Path(__file__).resolve().parents[1]
V297_SOURCE = ROOT / "scripts/run-kerr-polarization-v297.py"
V297_ARTIFACT = ROOT / "dist/science/kerr-reference-v297/polarization-short-gate.json"
V312_GEOMETRY = ROOT / "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"
OUT = ROOT / "dist/science/kerr-reference-v313"
EVIDENCE = OUT / "polarization-short-gate.json"
NEGATIVE = OUT / "polarization-short-gate-negative.json"

EXPECTED_V297_SOURCE_SHA = "9af38d3306febbb6d2becd1a7a65d8c8fa970262bf7a3d2dd6aae441beda8326"
EXPECTED_V297_EVIDENCE_SHA = "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854"
EXPECTED_V297_FILE_SHA = "c30589b114d2d6b8f4ab4ca85814e5f0524c22613df3aab2b44d8928e712f778"
EXPECTED_V312_EVIDENCE_SHA = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e"
EXPECTED_V312_FILE_SHA = "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load frozen source: {path.name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V297 = load_module("orbit_atlas_kerr_v297_for_v313", V297_SOURCE)


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


def validate_inputs() -> dict[str, Any]:
    if file_sha(V297_SOURCE) != EXPECTED_V297_SOURCE_SHA:
        raise RuntimeError("frozen v297 source SHA mismatch")
    historical = json.loads(V297_ARTIFACT.read_text(encoding="utf-8"))
    if historical.get("evidenceSha256") != EXPECTED_V297_EVIDENCE_SHA or file_sha(V297_ARTIFACT) != EXPECTED_V297_FILE_SHA or historical.get("qualified") is not True:
        raise RuntimeError("historical v297 authority lock mismatch")
    geometry = json.loads(V312_GEOMETRY.read_text(encoding="utf-8"))
    if (geometry.get("evidenceSha256") != EXPECTED_V312_EVIDENCE_SHA
        or file_sha(V312_GEOMETRY) != EXPECTED_V312_FILE_SHA
        or geometry.get("correctedAuthorityQualified") is not True
        or geometry.get("toleranceConvergenceQualified") is not True):
        raise RuntimeError("v312 corrected geometry lock mismatch")
    return geometry


def load_geometry_v313() -> dict[str, Any]:
    return validate_inputs()


def preserve_attempt(path: Path) -> None:
    if not path.exists():
        return
    previous = json.loads(path.read_text(encoding="utf-8"))
    previous_sha = previous.get("evidenceSha256")
    if isinstance(previous_sha, str):
        V297.atomic_json(path.parent / "attempts" / f"{previous_sha}.json", previous)


def build_gate() -> dict[str, Any]:
    geometry = validate_inputs()
    original_geometry = V297.GEOMETRY
    original_load = V297.load_geometry
    original_carter = V297.CARTER_FORMULATION
    original_ks = V297.KS_FORMULATION
    original_sampler = V297.PeakRssSampler
    V297.GEOMETRY = V312_GEOMETRY
    V297.load_geometry = load_geometry_v313
    V297.CARTER_FORMULATION = "carter-mino-dop853-constraint-stabilized-v312"
    V297.KS_FORMULATION = "cartesian-kerr-schild-hamiltonian-dop853-v312"
    V297.PeakRssSampler = PeakRssSampler
    try:
        base = V297.build_gate()
    finally:
        V297.GEOMETRY = original_geometry
        V297.load_geometry = original_load
        V297.CARTER_FORMULATION = original_carter
        V297.KS_FORMULATION = original_ks
        V297.PeakRssSampler = original_sampler
    unsigned = {key: value for key, value in base.items() if key != "evidenceSha256"}
    qualified = bool(base.get("qualified"))
    unsigned.update({
        "version": "v313-kerr-disk-polarization-requalification-v1",
        "attemptId": "v313-polarization-attempt-1",
        "generatedAt": utc(),
        "status": "full-kerr-short-authority-qualified" if qualified else "polarization-requalification-failed",
        "qualified": qualified,
        "fullKerrShortAuthorityQualified": qualified,
        "geometryAuthorityVersion": "v312",
        "geometryEvidenceSha256": geometry["evidenceSha256"],
        "geometryFileSha256": file_sha(V312_GEOMETRY),
        "historicalV297": {"evidenceSha256": EXPECTED_V297_EVIDENCE_SHA, "fileSha256": EXPECTED_V297_FILE_SHA, "preserved": True},
        "source": {"implementation": "scripts/run-kerr-polarization-v297.py", "implementationSha256": file_sha(V297_SOURCE), "wrapper": "scripts/run-kerr-polarization-v313.py", "wrapperSha256": file_sha(Path(__file__))},
        "tolerancePolicy": {"geometrySolverLadder": "v312-release-1e-11-internal-1e-13", "polarizationTransportThresholds": "v297-frozen", "thresholdRelaxation": "not-applied"},
        "science": {**base["science"], "v297Mutation": "not-applied", "v312Mutation": "not-applied"},
        "release": {**base["release"], "correctedDenseCampaignCreated": False, "correctedDenseShardExecuted": False},
        "boundary": "v312-locked-polarization-short-authority-no-corrected-dense-campaign-no-product-promotion",
    })
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v313 v312-locked polarization requalification")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--inspect", action="store_true")
    group.add_argument("--gate", action="store_true")
    args = parser.parse_args()
    if args.inspect:
        geometry = validate_inputs()
        print(json.dumps({"status": "ready" if V297.resource_preflight()["passed"] else "not-ready", "attemptConsumed": False, "resource": V297.resource_preflight(), "geometryEvidenceSha256": geometry["evidenceSha256"]}, indent=2))
        return
    result = build_gate()
    preserve_attempt(EVIDENCE)
    V297.atomic_json(EVIDENCE, result)
    if not result["qualified"]:
        preserve_attempt(NEGATIVE)
        V297.atomic_json(NEGATIVE, result)
    print(json.dumps({key: result.get(key) for key in ("status", "qualified", "fullKerrShortAuthorityQualified", "applicableExecutionCount", "failureReasons", "thresholds", "gates", "resource", "geometryEvidenceSha256", "evidenceSha256")}, indent=2, allow_nan=False, default=V297.json_default))


if __name__ == "__main__":
    main()

"""Low-memory, single-request-per-target Horizons barycenter cache for v282r1."""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import math
import os
import re
import shutil
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/relativity-reference-v282r1"
CACHE = OUT / "horizons-barycenters"
CHECKPOINT = OUT / "fetch-checkpoint.json"
BUNDLE = OUT / "barycenter-identity-bundle.json"
API = "https://ssd.jpl.nasa.gov/api/horizons.api"
MINIMUM_FREE_MEMORY_BYTES = 3 * 2**30
MINIMUM_E_DRIVE_BYTES = 30 * 2**30
EPOCHS = tuple([2451545.0 + float(day) for day in range(31)] + [2451545.0 + 365.0, 2451545.0 + 3652.5])
TARGETS = (
    ("mercury", "1", 1), ("venus", "2", 2), ("earth", "3", 3),
    ("mars", "4", 4), ("jupiter", "5", 5), ("saturn", "6", 6),
    ("uranus", "7", 7), ("neptune", "8", 8), ("pluto", "9", 9),
)
VECTOR_RE = re.compile(r"X\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Y\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Z\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)")
VELOCITY_RE = re.compile(r"VX=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VY=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VZ=\s*([+-]?[0-9.]+E[+-][0-9]+)")
JD_RE = re.compile(r"^([0-9]+\.[0-9]+)\s*=")
TARGET_HEADER_RE = re.compile(r"Target body name:\s*(.+?Barycenter)\s*\(([0-9]+)\)", re.IGNORECASE)


def utc_now() -> str:
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
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
        status = MemoryStatus()
        status.dwLength = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise RuntimeError("unable to inspect physical memory")
        return int(status.ullAvailPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def load_checkpoint() -> dict[str, Any]:
    if not CHECKPOINT.exists():
        core = {
            "version": "v282r1-relativity-reference-fetch-checkpoint-v1", "generatedAt": utc_now(),
            "status": "pending", "targets": [target[0] for target in TARGETS], "completedTargets": [],
            "attemptedTargets": [], "nextTarget": TARGETS[0][0], "failedTarget": None, "failure": None,
            "epochJdTdb": list(EPOCHS), "requestsPerTargetLimit": 1, "automaticRetryApplied": False,
            "minimumFreeMemoryGiB": 3, "minimumEDriveFreeGiB": 30,
        }
        checkpoint = {**core, "checkpointSha256": value_sha(core)}
        atomic_json(CHECKPOINT, checkpoint)
        return checkpoint
    checkpoint = json.loads(CHECKPOINT.read_text(encoding="utf-8"))
    expected = checkpoint.pop("checkpointSha256", None)
    if expected != value_sha(checkpoint):
        raise RuntimeError("v282r1 checkpoint SHA mismatch")
    checkpoint["checkpointSha256"] = expected
    return checkpoint


def save_checkpoint(checkpoint: dict[str, Any]) -> None:
    checkpoint["generatedAt"] = utc_now()
    checkpoint.pop("checkpointSha256", None)
    checkpoint["checkpointSha256"] = value_sha(checkpoint)
    atomic_json(CHECKPOINT, checkpoint)


def parse_vectors(result: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    inside = False
    for line in result.splitlines():
        if line.strip() == "$$SOE":
            inside = True
            continue
        if line.strip() == "$$EOE":
            if current:
                rows.append(current)
            break
        if not inside:
            continue
        match = JD_RE.match(line)
        if match:
            if current:
                rows.append(current)
            current = {"jdTdb": float(match.group(1))}
            continue
        position = VECTOR_RE.search(line)
        if position and current is not None:
            current["positionAu"] = [float(value) for value in position.groups()]
        velocity = VELOCITY_RE.search(line)
        if velocity and current is not None:
            current["velocityAuDay"] = [float(value) for value in velocity.groups()]
    if len(rows) != len(EPOCHS):
        raise RuntimeError(f"expected {len(EPOCHS)} vector rows, received {len(rows)}")
    for expected, row in zip(EPOCHS, rows):
        if abs(float(row.get("jdTdb", 0)) - expected) > 1e-7:
            raise RuntimeError("Horizons epoch identity mismatch")
        values = [*row.get("positionAu", []), *row.get("velocityAuDay", [])]
        if len(values) != 6 or not all(math.isfinite(float(value)) for value in values):
            raise RuntimeError("Horizons returned non-finite or incomplete vectors")
    return rows


def query_url(command: str) -> str:
    parameters = {
        "format": "json", "COMMAND": f"'{command}'", "OBJ_DATA": "'NO'", "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'VECTORS'", "CENTER": "'@0'", "TLIST": "'" + ",".join(f"{value:.7f}" for value in EPOCHS) + "'",
        "TLIST_TYPE": "'JD'", "REF_PLANE": "'FRAME'", "OUT_UNITS": "'AU-D'", "VEC_TABLE": "'2'", "TIME_TYPE": "'TDB'",
    }
    return API + "?" + urllib.parse.urlencode(parameters)


def parse_barycenter_header(header: str, target_id: str) -> int:
    match = TARGET_HEADER_RE.search(header)
    if not match or "barycenter" not in match.group(1).lower() or target_id not in match.group(1).lower().replace("-", " "):
        raise RuntimeError(f"Horizons target identity mismatch for {target_id}")
    return int(match.group(2))


def fetch_target(target_id: str, command: str, naif_id: int) -> dict[str, Any]:
    CACHE.mkdir(parents=True, exist_ok=True)
    raw_path = CACHE / f"{target_id}-barycenter-horizons.json"
    part = raw_path.with_suffix(raw_path.suffix + ".part")
    url = query_url(command)
    started = utc_now()
    total = 0
    request = urllib.request.Request(url, headers={"User-Agent": "Orbit-Atlas-v282r1-local-shadow"})
    with urllib.request.urlopen(request, timeout=60) as response, part.open("wb") as output:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > 4 * 1024 * 1024:
                raise RuntimeError("Horizons response exceeds 4 MiB")
            output.write(chunk)
        output.flush()
        os.fsync(output.fileno())
    document = json.loads(part.read_text(encoding="utf-8"))
    if document.get("error") or not isinstance(document.get("result"), str):
        raise RuntimeError("Horizons returned an error or missing result")
    result = document["result"]
    header = result.split("$$SOE", 1)[0]
    reported_target_id = parse_barycenter_header(header, target_id)
    rows = parse_vectors(result)
    raw_sha = file_sha(part)
    os.replace(part, raw_path)
    normalized = {
        "version": "v282r1-horizons-barycenter-target-v1", "generatedAt": utc_now(), "id": target_id,
        "naifTargetId": naif_id, "reportedHorizonsTargetId": reported_target_id, "horizonsCommand": command, "targetKind": "planetary-system-barycenter",
        "frame": "ICRF/J2000", "origin": "solar-system-barycenter", "timeScale": "TDB",
        "units": {"position": "AU", "velocity": "AU/day"}, "rows": rows,
        "rawSha256": raw_sha, "boundary": "reference-identity-cache-only-not-force-model-state",
    }
    normalized_path = CACHE / f"{target_id}-barycenter-normalized.json"
    atomic_json(normalized_path, {**normalized, "canonicalSha256": value_sha(normalized)})
    sidecar = {
        "version": "v282r1-horizons-barycenter-sidecar-v1", "targetId": target_id, "naifTargetId": naif_id, "reportedHorizonsTargetId": reported_target_id,
        "horizonsCommand": command, "startedAt": started, "finishedAt": utc_now(), "requestCount": 1,
        "epochCount": len(rows), "bytes": total, "rawSha256": file_sha(raw_path),
        "normalizedSha256": file_sha(normalized_path), "querySha256": hashlib.sha256(url.encode()).hexdigest(),
        "automaticRetryApplied": False,
    }
    sidecar_path = CACHE / f"{target_id}-barycenter-sidecar.json"
    atomic_json(sidecar_path, {**sidecar, "sidecarSha256": value_sha(sidecar)})
    return {"targetId": target_id, "raw": raw_path.relative_to(ROOT).as_posix(), "normalized": normalized_path.relative_to(ROOT).as_posix(), "sidecar": sidecar_path.relative_to(ROOT).as_posix(), "rawSha256": sidecar["rawSha256"], "normalizedSha256": sidecar["normalizedSha256"], "epochCount": len(rows)}


def build_bundle(checkpoint: dict[str, Any]) -> None:
    targets = []
    for target_id, command, naif_id in TARGETS:
        normalized_path = CACHE / f"{target_id}-barycenter-normalized.json"
        source = json.loads(normalized_path.read_text(encoding="utf-8"))
        targets.append({"id": target_id, "naifTargetId": naif_id, "horizonsCommand": command, "targetKind": "planetary-system-barycenter", "rows": source["rows"], "sourceSha256": file_sha(normalized_path)})
    unsigned = {
        "version": "v282r1-corrected-barycenter-identity-bundle-v1", "generatedAt": utc_now(),
        "status": "identity-cache-ready-awaiting-campaign-adapter", "targetCount": len(targets), "epochCountPerTarget": len(EPOCHS),
        "targets": targets, "frame": "ICRF/J2000", "origin": "solar-system-barycenter", "timeScale": "TDB",
        "bodyCenterFamily": {"status": "separate-immutable-family", "notMergedIntoThisBundle": True},
        "scienceCodeSha256": "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
        "screenSha256": "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
        "boundary": "identity-cache-only-no-dop853-ias15-stm-or-runtime-promotion",
    }
    atomic_json(BUNDLE, {**unsigned, "bundleSha256": value_sha(unsigned)})
    checkpoint["status"] = "identity-cache-ready-awaiting-campaign"
    checkpoint["nextTarget"] = None
    checkpoint["bundle"] = {"path": BUNDLE.relative_to(ROOT).as_posix(), "sha256": file_sha(BUNDLE)}
    save_checkpoint(checkpoint)


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v282r1 low-memory barycenter cache")
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    memory = free_memory_bytes()
    disk = shutil.disk_usage("E:\\" if os.name == "nt" else ROOT).free
    checkpoint = load_checkpoint()
    if args.inspect:
        print(json.dumps({"status": checkpoint["status"], "freeMemoryGiB": round(memory / 2**30, 2), "eDriveFreeGiB": round(disk / 2**30, 2), "nextTarget": checkpoint.get("nextTarget"), "attemptedTargets": checkpoint["attemptedTargets"], "completedTargets": checkpoint["completedTargets"]}, indent=2))
        return
    if memory < MINIMUM_FREE_MEMORY_BYTES or disk < MINIMUM_E_DRIVE_BYTES:
        print(json.dumps({"status": "blocked-resource-preflight", "shardAttempted": False, "freeMemoryGiB": round(memory / 2**30, 2), "eDriveFreeGiB": round(disk / 2**30, 2)}, indent=2))
        raise SystemExit(2)
    if checkpoint.get("failedTarget") is not None:
        raise SystemExit("previous target failed; a new attempt requires explicit authorization and namespace")
    completed = set(checkpoint["completedTargets"])
    attempted = set(checkpoint["attemptedTargets"])
    for target_id, command, naif_id in TARGETS:
        if target_id in completed:
            continue
        if target_id in attempted:
            raise SystemExit(f"target {target_id} was already attempted and will not be retried")
        checkpoint["attemptedTargets"].append(target_id)
        checkpoint["status"] = "fetching"
        checkpoint["nextTarget"] = target_id
        save_checkpoint(checkpoint)
        try:
            result = fetch_target(target_id, command, naif_id)
        except Exception as error:
            checkpoint["status"] = "failed-no-automatic-retry"
            checkpoint["failedTarget"] = target_id
            checkpoint["failure"] = str(error)
            save_checkpoint(checkpoint)
            print(json.dumps({"status": checkpoint["status"], "failedTarget": target_id, "failure": str(error), "automaticRetryApplied": False}, indent=2))
            raise SystemExit(1)
        checkpoint.setdefault("results", []).append(result)
        checkpoint["completedTargets"].append(target_id)
        checkpoint["nextTarget"] = next((entry[0] for entry in TARGETS if entry[0] not in checkpoint["completedTargets"]), None)
        save_checkpoint(checkpoint)
    build_bundle(checkpoint)
    print(json.dumps({"status": checkpoint["status"], "completedTargets": len(checkpoint["completedTargets"]), "bundle": checkpoint.get("bundle"), "automaticRetryApplied": False}, indent=2))


if __name__ == "__main__":
    main()

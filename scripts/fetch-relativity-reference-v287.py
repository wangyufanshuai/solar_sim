"""One-request Mercury system-barycenter identity fetch for Orbit Atlas v287."""

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
OUT = ROOT / "dist/science/relativity-reference-v282r2"
CACHE = OUT / "horizons-barycenters"
CHECKPOINT = OUT / "fetch-checkpoint.json"
RAW = CACHE / "mercury-barycenter-horizons.json"
NORMALIZED = CACHE / "mercury-barycenter-normalized.json"
SIDECAR = CACHE / "mercury-barycenter-sidecar.json"
EVIDENCE = OUT / "identity-fetch-evidence.json"
NEGATIVE_EVIDENCE = OUT / "fetch-attempt-2-negative-evidence.json"
API = "https://ssd.jpl.nasa.gov/api/horizons.api"
MINIMUM_FREE_MEMORY_BYTES = 3 * 2**30
MINIMUM_E_DRIVE_BYTES = 30 * 2**30
MAXIMUM_RESPONSE_BYTES = 4 * 1024 * 1024
EPOCHS = tuple([2451545.0 + float(day) for day in range(31)] + [2451545.0 + 365.0, 2451545.0 + 3652.5])
VECTOR_RE = re.compile(r"X\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Y\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Z\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)")
VELOCITY_RE = re.compile(r"VX=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VY=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VZ=\s*([+-]?[0-9.]+E[+-][0-9]+)")
JD_RE = re.compile(r"^([0-9]+\.[0-9]+)\s*=")
TARGET_HEADER_RE = re.compile(r"Target body name:\s*(.+?)\s*\(([0-9]+)\)", re.IGNORECASE)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def value_sha(value: Any) -> str:
    payload = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(payload).hexdigest()


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
        status = MemoryStatus()
        status.dwLength = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise RuntimeError("unable to inspect physical memory")
        return int(status.ullAvailPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def query_url() -> str:
    parameters = {
        "format": "json", "COMMAND": "'1'", "OBJ_DATA": "'NO'", "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'VECTORS'", "CENTER": "'@0'",
        "TLIST": "'" + ",".join(f"{value:.7f}" for value in EPOCHS) + "'", "TLIST_TYPE": "'JD'",
        "REF_PLANE": "'FRAME'", "OUT_UNITS": "'AU-D'", "VEC_TABLE": "'2'", "TIME_TYPE": "'TDB'",
    }
    return API + "?" + urllib.parse.urlencode(parameters)


def parse_identity(header: str) -> tuple[str, int]:
    match = TARGET_HEADER_RE.search(header)
    if not match:
        raise RuntimeError("Horizons target header is missing")
    reported_name = " ".join(match.group(1).split())
    reported_id = int(match.group(2))
    if reported_name.casefold() != "mercury barycenter" or reported_id != 199:
        raise RuntimeError(f"Horizons Mercury identity mismatch: {reported_name} ({reported_id})")
    return reported_name, reported_id


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


def checkpoint_core(status: str, attempted: bool, **extra: Any) -> dict[str, Any]:
    return {
        "version": "v287-relativity-reference-fetch-checkpoint-v1", "generatedAt": utc_now(),
        "attemptId": 2, "status": status, "requestedTarget": "mercury", "requestedCommand": "1",
        "requestLimit": 1, "requestAttempted": attempted, "automaticRetryApplied": False,
        "minimumFreeMemoryGiB": 3, "minimumEDriveFreeGiB": 30, **extra,
    }


def write_checkpoint(status: str, attempted: bool, **extra: Any) -> dict[str, Any]:
    core = checkpoint_core(status, attempted, **extra)
    document = {**core, "checkpointSha256": value_sha(core)}
    atomic_json(CHECKPOINT, document)
    return document


def inspect() -> dict[str, Any]:
    checkpoint = json.loads(CHECKPOINT.read_text(encoding="utf-8")) if CHECKPOINT.exists() else None
    memory = free_memory_bytes()
    disk = shutil.disk_usage("E:\\" if os.name == "nt" else ROOT).free
    return {
        "status": checkpoint.get("status", "not-started") if checkpoint else "not-started",
        "attemptConsumed": bool(checkpoint and checkpoint.get("requestAttempted")),
        "freeMemoryGiB": round(memory / 2**30, 2), "eDriveFreeGiB": round(disk / 2**30, 2),
        "eligible": memory >= MINIMUM_FREE_MEMORY_BYTES and disk >= MINIMUM_E_DRIVE_BYTES,
    }


def fetch_once() -> dict[str, Any]:
    memory = free_memory_bytes()
    disk = shutil.disk_usage("E:\\" if os.name == "nt" else ROOT).free
    if memory < MINIMUM_FREE_MEMORY_BYTES or disk < MINIMUM_E_DRIVE_BYTES:
        return {"status": "blocked-resource-preflight", "requestAttempted": False, "freeMemoryGiB": round(memory / 2**30, 2), "eDriveFreeGiB": round(disk / 2**30, 2)}
    if CHECKPOINT.exists():
        existing = json.loads(CHECKPOINT.read_text(encoding="utf-8"))
        if existing.get("requestAttempted") is True:
            raise RuntimeError("v287 Mercury attempt 2 was already consumed and cannot be retried")
    CACHE.mkdir(parents=True, exist_ok=True)
    part = RAW.with_suffix(RAW.suffix + ".part")
    url = query_url()
    started = utc_now()
    write_checkpoint("fetching", True, startedAt=started)
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Orbit-Atlas-v287-local-shadow"})
        total = 0
        with urllib.request.urlopen(request, timeout=60) as response, part.open("wb") as output:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAXIMUM_RESPONSE_BYTES:
                    raise RuntimeError("Horizons response exceeds 4 MiB")
                output.write(chunk)
            output.flush()
            os.fsync(output.fileno())
        document = json.loads(part.read_text(encoding="utf-8"))
        if document.get("error") or not isinstance(document.get("result"), str):
            raise RuntimeError("Horizons returned an error or missing result")
        result = document["result"]
        reported_name, reported_id = parse_identity(result.split("$$SOE", 1)[0])
        rows = parse_vectors(result)
        raw_sha = file_sha(part)
        os.replace(part, RAW)
        normalized_core = {
            "version": "v287-horizons-mercury-barycenter-v1", "generatedAt": utc_now(),
            "requestedBarycenterId": 1, "requestedCommand": "1", "reportedHorizonsId": reported_id,
            "reportedName": reported_name, "targetKind": "planetary-system-barycenter",
            "identityResolution": "command-1-resolved-by-horizons-to-mercury-barycenter-199",
            "bodyCenterFamily": "separate-not-merged", "frame": "ICRF/J2000",
            "origin": "solar-system-barycenter", "timeScale": "TDB",
            "units": {"position": "AU", "velocity": "AU/day"}, "rows": rows,
            "rawSha256": raw_sha, "boundary": "identity-cache-only-no-force-model-promotion",
        }
        atomic_json(NORMALIZED, {**normalized_core, "canonicalSha256": value_sha(normalized_core)})
        sidecar_core = {
            "version": "v287-horizons-mercury-sidecar-v1", "generatedAt": utc_now(),
            "attemptId": 2, "requestCount": 1, "requestedCommand": "1", "reportedHorizonsId": reported_id,
            "epochCount": len(rows), "bytes": total, "startedAt": started, "finishedAt": utc_now(),
            "rawSha256": file_sha(RAW), "normalizedSha256": file_sha(NORMALIZED),
            "querySha256": hashlib.sha256(url.encode()).hexdigest(), "automaticRetryApplied": False,
        }
        atomic_json(SIDECAR, {**sidecar_core, "sidecarSha256": value_sha(sidecar_core)})
        checkpoint = write_checkpoint(
            "identity-cache-partial-1-of-9", True, completedTargets=["mercury"], remainingTargetCount=8,
            rawSha256=file_sha(RAW), normalizedSha256=file_sha(NORMALIZED), sidecarSha256=file_sha(SIDECAR),
        )
        evidence_core = {
            "version": "v287-mercury-identity-fetch-evidence-v1", "generatedAt": utc_now(),
            "status": "identity-cache-partial-1-of-9", "attemptId": 2, "requestCount": 1,
            "identity": {"requestedBarycenterId": 1, "requestedCommand": "1", "reportedHorizonsId": 199, "reportedName": "Mercury Barycenter", "targetKind": "planetary-system-barycenter"},
            "epochCount": len(rows), "automaticRetryApplied": False, "subsequentTargetRequested": False,
            "artifacts": {"rawSha256": file_sha(RAW), "normalizedSha256": file_sha(NORMALIZED), "sidecarSha256": file_sha(SIDECAR), "checkpointSha256": file_sha(CHECKPOINT)},
            "formalProductPointer": "v263", "defaultKernel": "legacy-eih-1pn",
            "boundary": "single-authorized-request-partial-identity-cache-no-campaign",
        }
        evidence = {**evidence_core, "evidenceSha256": value_sha(evidence_core)}
        atomic_json(EVIDENCE, evidence)
        return checkpoint
    except Exception as error:
        checkpoint = write_checkpoint("failed-no-automatic-retry", True, failedTarget="mercury", failure=str(error), rawPartRetained=part.exists())
        negative_core = {
            "version": "v287-mercury-fetch-attempt-2-negative-evidence-v1", "generatedAt": utc_now(),
            "status": "failed-no-automatic-retry", "attemptId": 2, "failure": str(error),
            "requestCount": 1, "rawPartRetained": part.exists(), "automaticRetryApplied": False,
            "subsequentTargetRequested": False, "checkpointSha256": file_sha(CHECKPOINT),
            "formalProductPointer": "v263", "boundary": "single-request-failed-closed",
        }
        atomic_json(NEGATIVE_EVIDENCE, {**negative_core, "evidenceSha256": value_sha(negative_core)})
        return checkpoint


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v287 one-request Mercury identity cache")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--inspect", action="store_true")
    group.add_argument("--fetch", action="store_true")
    args = parser.parse_args()
    result = inspect() if args.inspect else fetch_once()
    print(json.dumps(result, indent=2))
    if result["status"] in {"failed-no-automatic-retry", "blocked-resource-preflight"}:
        raise SystemExit(2)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Run v272 Gaia downloads serially, one fresh subprocess per shard.

The controller never retries a failed range.  It validates the newly published
checkpoint before starting the next child and records a resumable series state.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

VERSION = "v272-gaia-dr3-presentation-fetch-series-v1"
FETCH_VERSION = "v272-gaia-dr3-presentation-fetch-next-v2"
SHARD_ROWS = 100_000
MAX_SHARDS = 102
TARGET_VALID = 10_000_000


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json_atomic(path: Path, value: object) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    os.replace(temporary, path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_progress(root: Path) -> dict[str, object]:
    path = root / "progress.json"
    if not path.is_file():
        return {"completedShards": 0, "uniqueValidCandidateRows": 0, "status": "not-started"}
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError("Gaia v272 progress is not an object")
    return value


def validate_checkpoint(root: Path, expected_completed: int) -> dict[str, object]:
    progress = read_progress(root)
    completed = int(progress.get("completedShards") or 0)
    if completed != expected_completed:
        raise RuntimeError(f"Gaia v272 progress advanced to {completed}, expected {expected_completed}")
    previous_end = 0
    for shard in range(completed):
        csv_path = root / f"gaia-v9-{shard:03d}.csv"
        sidecar_path = root / f"gaia-v9-{shard:03d}.json"
        query_path = root / f"gaia-v9-{shard:03d}.adql"
        if not csv_path.is_file() or not sidecar_path.is_file() or not query_path.is_file():
            raise RuntimeError(f"Gaia v272 shard {shard} publication is incomplete")
        sidecar = json.loads(sidecar_path.read_text(encoding="utf-8"))
        start, end = [int(value) for value in sidecar.get("randomIndexRange", [])]
        if sidecar.get("version") != FETCH_VERSION or sidecar.get("shard") != shard:
            raise RuntimeError(f"Gaia v272 shard {shard} version/provenance drifted")
        if start != previous_end or end != start + SHARD_ROWS:
            raise RuntimeError(f"Gaia v272 shard {shard} range overlaps or is discontinuous")
        if int(sidecar.get("rowCount") or 0) < 1 or int(sidecar.get("rowCount") or 0) > SHARD_ROWS:
            raise RuntimeError(f"Gaia v272 shard {shard} row count is invalid")
        if int(sidecar.get("bytes") or -1) != csv_path.stat().st_size:
            raise RuntimeError(f"Gaia v272 shard {shard} byte count drifted")
        # Only the newly published shard is re-hashed. Older files are tracked
        # by the fetcher's SQLite mtime/size/SHA verification cache.
        if shard == completed - 1 and sidecar.get("sha256") != sha256_file(csv_path):
            raise RuntimeError(f"Gaia v272 shard {shard} SHA drifted")
        query = query_path.read_text(encoding="utf-8")
        if query != str(sidecar.get("query")) + "\n" or sidecar.get("querySha256") != sha256_file(query_path):
            raise RuntimeError(f"Gaia v272 shard {shard} ADQL provenance drifted")
        if sidecar.get("automaticRetryApplied") is not False:
            raise RuntimeError(f"Gaia v272 shard {shard} retry contract drifted")
        previous_end = end
    if int(progress.get("uniqueValidCandidateRows") or 0) > completed * SHARD_ROWS:
        raise RuntimeError("Gaia v272 candidate count exceeds the shard row bound")
    return progress


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-root", type=Path, default=Path("tools/asset-cache/gaia-dr3-presentation-v272-shards"))
    parser.add_argument("--minimum-free-memory-gib", type=float, default=6.0)
    parser.add_argument("--timeout-seconds", type=int, default=600)
    parser.add_argument("--preflight-timeout-seconds", type=int, default=20)
    parser.add_argument("--maximum-new-shards", type=int, default=MAX_SHARDS, help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.maximum_new_shards < 1 or args.maximum_new_shards > MAX_SHARDS:
        raise RuntimeError("maximum-new-shards is outside 1..102")

    root = args.checkpoint_root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    initial = read_progress(root)
    initial_completed = int(initial.get("completedShards") or 0)
    state: dict[str, object] = {
        "version": VERSION,
        "status": "running",
        "startedAt": utc_now(),
        "finishedAt": None,
        "minimumFreeMemoryGiB": args.minimum_free_memory_gib,
        "defaultMinimumFreeMemoryGiB": 6,
        "lowMemoryOverrideApplied": args.minimum_free_memory_gib < 6,
        "authorization": "user-authorized-3-gib-fetch-only" if args.minimum_free_memory_gib < 6 else "default-policy",
        "initialCompletedShards": initial_completed,
        "maximumNewShards": args.maximum_new_shards,
        "automaticRetryApplied": False,
        "attempts": [],
    }
    state_path = root / "series-state.json"
    write_json_atomic(state_path, state)
    fetcher = Path(__file__).with_name("fetch-gaia-presentation-v272.py")

    for _ in range(args.maximum_new_shards):
        before = read_progress(root)
        completed_before = int(before.get("completedShards") or 0)
        if int(before.get("uniqueValidCandidateRows") or 0) >= TARGET_VALID:
            state["status"] = "ready-for-build"
            break
        if completed_before >= MAX_SHARDS:
            state["status"] = "blocked-insufficient-candidates"
            break
        attempt = {
            "shard": completed_before,
            "startedAt": utc_now(),
            "finishedAt": None,
            "exitCode": None,
            "automaticRetryApplied": False,
        }
        attempts = state["attempts"]
        assert isinstance(attempts, list)
        attempts.append(attempt)
        write_json_atomic(state_path, state)
        command = [
            sys.executable,
            str(fetcher),
            "--checkpoint-root", str(root),
            "--minimum-free-memory-gib", str(args.minimum_free_memory_gib),
            "--timeout-seconds", str(args.timeout_seconds),
            "--preflight-timeout-seconds", str(args.preflight_timeout_seconds),
        ]
        result = subprocess.run(command, cwd=Path.cwd(), check=False)
        attempt["finishedAt"] = utc_now()
        attempt["exitCode"] = result.returncode
        if result.returncode != 0:
            last_preflight_path = root / "last-preflight.json"
            last_preflight = json.loads(last_preflight_path.read_text(encoding="utf-8")) if last_preflight_path.is_file() else {}
            shard_attempted = last_preflight.get("shardAttempted") is not False
            attempt["outcome"] = "failed-no-retry" if shard_attempted else "blocked-preflight-shard-not-attempted"
            attempt["shardAttempted"] = shard_attempted
            state["status"] = "blocked-first-shard-failure" if shard_attempted else "blocked-child-preflight"
            state["failedShard"] = completed_before
            break
        progress = validate_checkpoint(root, completed_before + 1)
        attempt["outcome"] = "checkpoint-verified"
        attempt["validCandidateRowsAfter"] = int(progress.get("uniqueValidCandidateRows") or 0)
        write_json_atomic(state_path, state)
    else:
        state["status"] = "paused-maximum-new-shards"

    final_progress = read_progress(root)
    if int(final_progress.get("uniqueValidCandidateRows") or 0) >= TARGET_VALID:
        state["status"] = "ready-for-build"
    state["finishedAt"] = utc_now()
    state["completedShards"] = int(final_progress.get("completedShards") or 0)
    state["uniqueValidCandidateRows"] = int(final_progress.get("uniqueValidCandidateRows") or 0)
    write_json_atomic(state_path, state)
    print(json.dumps(state, ensure_ascii=False, indent=2), flush=True)
    if state["status"] not in {"ready-for-build", "paused-maximum-new-shards"}:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

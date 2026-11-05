"""Bounded v298 dense-campaign planner.

This module only creates and inspects a deterministic 3,097-ray/49-shard
plan.  It deliberately has no run-next or aggregate operation; numerical
shards require a later explicit authorization.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ENVELOPE = ROOT / "dist/science/kerr-reference-v297/portable-envelope.json"
OUT = ROOT / "dist/science/kerr-campaign-v298"
STATE = OUT / "campaign-state.json"


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def sha(value: Any) -> str:
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
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def shard_plan() -> list[dict[str, int]]:
    total_rays, shards = 3097, 49
    base, remainder = divmod(total_rays, shards)
    result: list[dict[str, int]] = []
    cursor = 0
    for index in range(shards):
        count = base + (1 if index < remainder else 0)
        result.append({"shardIndex": index, "rayStart": cursor, "rayEndExclusive": cursor + count, "rayCount": count, "maxRayCount": 64})
        cursor += count
    return result


def build_state() -> dict[str, Any]:
    if not ENVELOPE.exists():
        raise RuntimeError("v297 portable envelope is missing")
    envelope = json.loads(ENVELOPE.read_text(encoding="utf-8"))
    envelope_sha = envelope.get("evidenceSha256")
    if not isinstance(envelope_sha, str):
        raise RuntimeError("v297 portable envelope SHA is missing")
    qualified = envelope.get("status") == "full-kerr-short-authority-qualified" and envelope.get("polarization", {}).get("qualified") is True
    plan = shard_plan()
    unsigned = {
        "version": "v298-kerr-dense-campaign-state-v1",
        "generatedAt": utc(),
        "status": "incomplete-0-of-49" if qualified else "blocked-by-v297",
        "qualifiedInput": qualified,
        "plannedRayCount": 3097,
        "plannedShardCount": 49,
        "maxRaysPerShard": 64,
        "executionsPerRay": 8,
        "plannedExecutionCount": 24776,
        "completedShardCount": 0,
        "nextShardIndex": 0 if qualified else None,
        "partialAggregate": False,
        "runNextAvailable": False,
        "aggregateAvailable": False,
        "authority": {
            "v297EnvelopePath": "dist/science/kerr-reference-v297/portable-envelope.json",
            "v297EnvelopeSha256": file_sha(ENVELOPE),
            "v297CanonicalSha256": envelope_sha,
        },
        "shards": plan,
        "release": {"formalProductPointer": "v263", "denseShardExecuted": False, "browserQualificationRun": False},
        "boundary": "planner-only-no-shard-no-aggregate",
    }
    return {**unsigned, "stateSha256": sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v298 dense campaign planner")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init", action="store_true")
    group.add_argument("--status", action="store_true")
    args = parser.parse_args()
    if args.init:
        state = build_state()
        atomic_json(STATE, state)
    else:
        state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {
            "version": "v298-kerr-dense-campaign-state-v1",
            "status": "not-initialized",
            "completedShardCount": 0,
            "plannedShardCount": 49,
            "nextShardIndex": None,
            "runNextAvailable": False,
        }
    print(json.dumps(state, indent=2))


if __name__ == "__main__":
    main()

"""Single-instance controller for the frozen V8 finite-observer Kerr campaign.

The controller is deliberately outside the numerical code hash.  It verifies
that every numerical source file is byte-identical to the selected Git freeze
commit before it quarantines V6 shards or launches a V8 release shard.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).resolve()
RUNNER = ROOT / "scripts/run-kerr-dense-shards-v8.py"
PLAN = ROOT / "dist/science/kerr-dense-execution-plan-v8-release.json"
SCREEN = ROOT / "dist/science/kerr-finite-observer-screen-v8.json"
GATE = ROOT / "dist/science/kerr-dense-gate-v8.json"
V7_GATE = ROOT / "dist/science/kerr-dense-gate-v7.json"
V5_SCREEN = ROOT / "dist/science/kerr-dense-screen-v5.json"
V6_SHARDS = ROOT / "dist/science/kerr-shards-v6"
V8_SHARDS = ROOT / "dist/science/kerr-shards-v8"
QUARANTINE = ROOT / "dist/science/quarantine/kerr-shards-v6-pre-v8"
QUARANTINE_MANIFEST = QUARANTINE / "quarantine-manifest.json"
PROGRESS = ROOT / "dist/science/kerr-dense-campaign-progress-v8.json"
LOCK = ROOT / "dist/science/kerr-dense-campaign-v8.lock"
BRANCH = "codex/orbit-atlas-v241-science-freeze"
VERSION = "v248-kerr-dense-campaign-progress-v8"
EXPECTED_V6_RUNNER_SHA256 = "b56f2e1f6854ad392820a6a0a6c2757dbae93119858bae0e10fe04c1113776fe"
EXPECTED_V5_SCREEN_SHA256 = "0eaa2d3e746d973155bf08fb0866452dbcd6e5d5341b246bc148f4bbd3c1c6cf"
EXPECTED_V7_GATE_SHA256 = "47e0c37faeadf96374bf12465bec9f2b616e6cf86fd22056477c76ee68366927"
NUMERICAL_SOURCES = (
    "scripts/run-kerr-dense-shards-v8.py",
    "scripts/run-kerr-dense-shards-v6.py",
    "scripts/kerr_finite_observer_separatrix_v8.py",
    "scripts/build-kerr-finite-observer-screen-v8.py",
    "scripts/run-kerr-schild-reference-v5.py",
    "scripts/run-kerr-carter-mino-reference-v6.py",
    "scripts/kerr_observer_frame_v5.py",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def value_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def inside(path: Path, boundary: Path) -> bool:
    try:
        path.resolve(strict=False).relative_to(boundary.resolve(strict=False))
        return True
    except ValueError:
        return False


def run_git(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        check=check,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout.strip()


def git_identity() -> dict[str, str]:
    return {
        "commit": run_git("rev-parse", "HEAD"),
        "branch": run_git("branch", "--show-current"),
        "projectPrefix": run_git("rev-parse", "--show-prefix").replace("\\", "/"),
    }


def verify_frozen_sources(freeze_commit: str, identity: dict[str, str]) -> None:
    if identity["commit"] != freeze_commit:
        raise RuntimeError(f"HEAD drifted from freeze commit: {identity['commit']} != {freeze_commit}")
    if identity["branch"] != BRANCH:
        raise RuntimeError(f"campaign must run on {BRANCH}; current branch is {identity['branch']}")
    for relative in NUMERICAL_SOURCES:
        committed = subprocess.run(
            ["git", "show", f"{freeze_commit}:{identity['projectPrefix']}{relative}"],
            cwd=ROOT,
            check=True,
            capture_output=True,
        ).stdout
        current = (ROOT / relative).read_bytes()
        if current != committed:
            raise RuntimeError(f"numerical source drifted from freeze commit: {relative}")
    if file_hash(ROOT / "scripts/run-kerr-dense-shards-v6.py") != EXPECTED_V6_RUNNER_SHA256:
        raise RuntimeError("frozen V6 runner hash drifted")
    if file_hash(V5_SCREEN) != EXPECTED_V5_SCREEN_SHA256:
        raise RuntimeError("frozen V5 screen hash drifted")
    if file_hash(V7_GATE) != EXPECTED_V7_GATE_SHA256:
        raise RuntimeError("immutable V7 negative evidence hash drifted")


def refresh_and_verify_plan(freeze_commit: str) -> dict[str, Any]:
    identity = git_identity()
    verify_frozen_sources(freeze_commit, identity)
    subprocess.run(
        [sys.executable, str(RUNNER), "--profile", "release", "--plan-only"],
        cwd=ROOT,
        check=True,
    )
    plan = read_json(PLAN)
    screen = read_json(SCREEN)
    gate = read_json(GATE)
    if plan.get("version") != "v248-kerr-dense-finite-observer-sharded-v8":
        raise RuntimeError("unexpected V8 plan version")
    if plan.get("profile") != "release" or plan.get("shardCount") != 49:
        raise RuntimeError("V8 release plan must contain 49 shards")
    if gate.get("gatePassed") is not True or gate.get("evaluation", {}).get("gatePassed") is not True:
        raise RuntimeError("V8 isolated gate has not passed")
    provenance = gate.get("provenance", {})
    comparisons = {
        "finiteObserverScreenManifestSha256": plan.get("finiteObserverScreenManifestSha256"),
        "codeSha256": plan.get("codeSha256"),
        "environmentSha256": plan.get("environmentSha256"),
        "planInputSha256": plan.get("inputSha256"),
    }
    for key, expected in comparisons.items():
        if provenance.get(key) != expected:
            raise RuntimeError(f"V8 gate/plan provenance mismatch: {key}")
    if screen.get("manifestSha256") != plan.get("finiteObserverScreenManifestSha256"):
        raise RuntimeError("V8 screen/plan provenance mismatch")
    return {
        "identity": identity,
        "plan": plan,
        "screen": screen,
        "gate": gate,
    }


@contextmanager
def campaign_lock(action: str) -> Iterator[None]:
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    try:
        descriptor = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as error:
        owner = LOCK.read_text(encoding="utf-8") if LOCK.exists() else "unknown"
        raise RuntimeError(f"V8 campaign lock already exists; no automatic recovery: {owner}") from error
    try:
        os.write(descriptor, canonical_json({"pid": os.getpid(), "action": action, "startedAt": utc_now()}))
        os.close(descriptor)
        yield
    finally:
        if LOCK.exists():
            LOCK.unlink()


def quarantine_v6_shards() -> dict[str, Any]:
    if not inside(V6_SHARDS, ROOT) or not inside(QUARANTINE, ROOT):
        raise RuntimeError("quarantine path escapes the Orbit Atlas workspace")
    QUARANTINE.mkdir(parents=True, exist_ok=True)
    source_files = sorted(path for path in V6_SHARDS.glob("*") if path.is_file()) if V6_SHARDS.exists() else []
    moved = []
    for source in source_files:
        destination = QUARANTINE / source.name
        if destination.exists():
            raise RuntimeError(f"quarantine destination already exists; refusing overwrite: {destination}")
        row = {
            "source": source.relative_to(ROOT).as_posix(),
            "quarantine": destination.relative_to(ROOT).as_posix(),
            "bytes": source.stat().st_size,
            "sha256": file_hash(source),
        }
        os.replace(source, destination)
        if file_hash(destination) != row["sha256"]:
            raise RuntimeError(f"quarantine checksum failed: {destination}")
        moved.append(row)
    core = {
        "version": "v248-kerr-v6-shard-quarantine-before-v8",
        "generatedAt": utc_now(),
        "sourceDirectory": V6_SHARDS.relative_to(ROOT).as_posix(),
        "quarantineDirectory": QUARANTINE.relative_to(ROOT).as_posix(),
        "files": moved,
        "deleted": False,
        "reusableByV8": False,
    }
    document = {**core, "manifestSha256": value_hash(core)}
    atomic_json(QUARANTINE_MANIFEST, document)
    return document


def completed_indices() -> list[int]:
    if not V8_SHARDS.exists():
        return []
    indices = []
    for path in sorted(V8_SHARDS.glob("shard-*.json")):
        document = read_json(path)
        if document.get("complete") is True:
            indices.append(int(document["shardIndex"]))
    return indices


def progress_document(
    verified: dict[str, Any],
    freeze_commit: str,
    status: str,
    *,
    quarantine: dict[str, Any] | None = None,
    failed_shard: int | None = None,
    failure: str | None = None,
) -> dict[str, Any]:
    plan = verified["plan"]
    completed = completed_indices()
    core = {
        "version": VERSION,
        "generatedAt": utc_now(),
        "status": status,
        "freezeCommitSha": freeze_commit,
        "freezeBranch": verified["identity"]["branch"],
        "controllerSha256": file_hash(SCRIPT),
        "planInputSha256": plan["inputSha256"],
        "planSha256": plan["planSha256"],
        "codeSha256": plan["codeSha256"],
        "environmentSha256": plan["environmentSha256"],
        "finiteObserverScreenManifestSha256": plan["finiteObserverScreenManifestSha256"],
        "shortGateCanonicalEvidenceSha256": verified["gate"]["canonicalEvidenceSha256"],
        "shortGatePassed": True,
        "plannedShardCount": plan["shardCount"],
        "completedShardCount": len(completed),
        "completedShardIndices": completed,
        "nextShardIndex": next((index for index in range(plan["shardCount"]) if index not in completed), None),
        "failedShardIndex": failed_shard,
        "failure": failure,
        "v6QuarantineManifestSha256": (
            quarantine or (read_json(QUARANTINE_MANIFEST) if QUARANTINE_MANIFEST.exists() else {})
        ).get("manifestSha256"),
        "noAutomaticRetry": True,
        "promotionDecision": "shadow-retained",
        "boundary": "serial-offline-v8-campaign-no-runtime-promotion",
    }
    return {**core, "progressSha256": value_hash(core)}


def prepare(freeze_commit: str) -> None:
    with campaign_lock("prepare"):
        if PROGRESS.exists():
            raise RuntimeError("V8 campaign progress already exists; refusing to replace it")
        verified = refresh_and_verify_plan(freeze_commit)
        quarantine = quarantine_v6_shards()
        progress = progress_document(verified, freeze_commit, "prepared", quarantine=quarantine)
        atomic_json(PROGRESS, progress)
        print(json.dumps(progress, indent=2))


def run_campaign(freeze_commit: str | None) -> None:
    with campaign_lock("run"):
        if not PROGRESS.exists():
            raise RuntimeError("run --prepare before starting the V8 campaign")
        previous = read_json(PROGRESS)
        frozen = str(freeze_commit or previous.get("freezeCommitSha"))
        if previous.get("freezeCommitSha") != frozen:
            raise RuntimeError("requested freeze commit disagrees with prepared campaign")
        if previous.get("status") == "failed":
            raise RuntimeError("campaign is failed; no automatic retry is permitted")
        verified = refresh_and_verify_plan(frozen)
        subprocess.run([sys.executable, str(RUNNER), "--aggregate"], cwd=ROOT, check=True)
        plan = verified["plan"]
        for index in range(plan["shardCount"]):
            if index in completed_indices():
                continue
            atomic_json(PROGRESS, progress_document(verified, frozen, "running"))
            try:
                subprocess.run(
                    [sys.executable, str(RUNNER), "--profile", "release", "--shard", str(index)],
                    cwd=ROOT,
                    check=True,
                )
            except BaseException as error:
                failed = progress_document(
                    verified,
                    frozen,
                    "failed",
                    failed_shard=index,
                    failure=f"{type(error).__name__}: {error}",
                )
                atomic_json(PROGRESS, failed)
                raise
            atomic_json(PROGRESS, progress_document(verified, frozen, "running"))
        subprocess.run([sys.executable, str(RUNNER), "--aggregate"], cwd=ROOT, check=True)
        aggregate = read_json(ROOT / "dist/science/kerr-dense-cross-validation-v8.json")
        status = "complete" if aggregate.get("completeShardCount") == 49 else "failed"
        failure = None if status == "complete" else "aggregate-did-not-observe-49-complete-shards"
        atomic_json(PROGRESS, progress_document(verified, frozen, status, failure=failure))
        print(PROGRESS.read_text(encoding="utf-8"))
        if status != "complete":
            raise SystemExit(2)


def status() -> None:
    if not PROGRESS.exists():
        print(json.dumps({"version": VERSION, "status": "not-prepared"}, indent=2))
        return
    print(PROGRESS.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas V8 dense Kerr campaign controller")
    actions = parser.add_subparsers(dest="action", required=True)
    prepare_parser = actions.add_parser("prepare")
    prepare_parser.add_argument("--freeze-commit", required=True)
    run_parser = actions.add_parser("run")
    run_parser.add_argument("--freeze-commit")
    actions.add_parser("status")
    args = parser.parse_args()
    if args.action == "prepare":
        prepare(args.freeze_commit)
    elif args.action == "run":
        run_campaign(args.freeze_commit)
    else:
        status()


if __name__ == "__main__":
    main()

"""Checkpointed v282 reference-campaign controller.

This controller owns orchestration and provenance only.  The numerical
implementations remain the frozen v9/v10/v12 runners and are invoked as child
processes; no browser physics or Worker code is imported.  A target-identity
mismatch is fail-closed rather than silently comparing a body centre with a
system barycentre.
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
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/science/relativity-reference-v282"
CHECKPOINT = OUT / "checkpoint.json"
FIXTURE = OUT / "reference-fixture-v282.json"
BUNDLE = OUT / "reference-bundle-v282.json"
DOP853 = OUT / "dop853-v282.json"
STM = OUT / "stm-v282.json"
IAS15 = OUT / "ias15-v282.json"
CAMPAIGN = OUT / "campaign-state-v282.json"

BODY_IDS = ("sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "ceres")
EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha_file(path: Path) -> str | None:
    return sha_bytes(path.read_bytes()) if path.exists() else None


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "host", "pid", "absolutePath"}}
    return value


def value_sha(value: Any) -> str:
    return sha_bytes(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode())


def read_json(path: Path) -> dict[str, Any] | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def target_identity_matrix() -> list[dict[str, Any]]:
    # Horizons command ids are deliberately explicit.  The @N commands are
    # system barycentres; body-centre commands remain a separate family.
    barycentres = {"mercury": "@1", "venus": "@2", "earth": "@3", "mars": "@4", "jupiter": "@5", "saturn": "@6", "uranus": "@7", "neptune": "@8", "pluto": "@9"}
    body_centres = {"sun": "10", "moon": "301", "ceres": "2000001"}
    naif = {"sun": 10, "mercury": 1, "venus": 2, "earth": 3, "moon": 301, "mars": 4, "jupiter": 5, "saturn": 6, "uranus": 7, "neptune": 8, "pluto": 9, "ceres": 2000001}
    rows = []
    for body_id in BODY_IDS:
        target_kind = "planetary-system-barycenter" if body_id in barycentres else "body-center"
        rows.append({
            "id": body_id,
            "naifTargetId": naif[body_id],
            "horizonsCommand": barycentres.get(body_id, body_centres.get(body_id)),
            "targetKind": target_kind,
            "frame": "ICRF/J2000",
            "origin": "solar-system-barycenter",
            "timeScale": "TDB",
            "units": {"position": "m", "velocity": "m/s", "gm": "m^3/s^2"},
            "gmSource": "DE440s frozen constants table",
        })
    return rows


def run_child(args: list[str]) -> None:
    result = subprocess.run([sys.executable, *args], cwd=ROOT, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"child command failed ({result.returncode}): {' '.join(args)}")


def prepare() -> dict[str, Any]:
    OUT.mkdir(parents=True, exist_ok=True)
    existing = read_json(CHECKPOINT)
    inputs = {
        "fixtureSource": "dist/science/relativity-reference-fixture-v9.json",
        "bundleSource": "dist/science/relativity-reference-bundle-v10.json",
        "fixtureSha256": sha_file(ROOT / "dist/science/relativity-reference-fixture-v9.json"),
        "bundleSha256": sha_file(ROOT / "dist/science/relativity-reference-bundle-v10.json"),
        "scienceCodeSha256": EXPECTED_CODE_SHA,
        "screenSha256": EXPECTED_SCREEN_SHA,
    }
    checkpoint = {
        "version": "v282-relativity-reference-checkpoint-v1",
        "generatedAt": now(),
        "stage": existing.get("stage", "prepared") if existing else "prepared",
        "schema": "RelativityReferenceCampaignStateV282",
        "inputIdentity": inputs,
        "chunkSize": {"calibrationDays": 30, "fitIterations": 3, "holdoutsDays": [365.0, 3652.5]},
        "targetIdentityMatrix": target_identity_matrix(),
        "bodyCount": len(BODY_IDS),
        "stateDimension": 72,
        "parameterDimension": 66,
        "jointDimension": 4824,
        "automaticRetryApplied": False,
        "failedClosed": False,
    }
    # Reuse already checksummed frozen fixture/bundle; the v282 namespace is
    # new and does not overwrite v9/v10 artifacts.
    if not (ROOT / "dist/science/relativity-reference-fixture-v9.json").exists() or not (ROOT / "dist/science/relativity-reference-bundle-v10.json").exists():
        checkpoint["stage"] = "blocked-missing-frozen-input"
        checkpoint["failedClosed"] = True
        atomic_json(CHECKPOINT, checkpoint)
        return checkpoint
    atomic_json(CHECKPOINT, checkpoint)
    return checkpoint


def inspect_identity(checkpoint: dict[str, Any]) -> dict[str, Any]:
    bundle = read_json(ROOT / "dist/science/relativity-reference-bundle-v10.json")
    if not bundle or bundle.get("provenanceReady") is not True or len(bundle.get("epochs", [])) < 2:
        return {"status": "blocked-missing-provenance-ready-bundle", "mismatches": ["bundle"]}
    source_queries = {row.get("bodyId"): row.get("command") for row in bundle.get("queries", [])}
    mismatches = []
    for expected in checkpoint["targetIdentityMatrix"]:
        actual = source_queries.get(expected["id"])
        if actual is None:
            mismatches.append({"id": expected["id"], "reason": "missing-source-query"})
        # The old v10 bundle used body-centre commands (e.g. 599).  Do not
        # bless those rows as barycentres; this is the real v282 correction.
        elif actual not in {expected["horizonsCommand"], expected["horizonsCommand"].lstrip("@")}: 
            mismatches.append({"id": expected["id"], "expected": expected["horizonsCommand"], "actual": actual, "reason": "target-kind-or-command-mismatch"})
    return {"status": "passed" if not mismatches else "blocked-target-identity-mismatch", "mismatches": mismatches, "sourceBodyCount": len(source_queries), "bundleSha256": sha_file(ROOT / "dist/science/relativity-reference-bundle-v10.json")}


def run_campaign(checkpoint: dict[str, Any]) -> dict[str, Any]:
    identity = inspect_identity(checkpoint)
    checkpoint["identityValidation"] = identity
    if identity["status"] != "passed":
        checkpoint["stage"] = "blocked-target-identity-mismatch"
        checkpoint["failedClosed"] = True
        atomic_json(CHECKPOINT, checkpoint)
        return checkpoint
    # Build/reuse the fixture in the v282 namespace, then run the independent
    # DOP853/STM/IAS15 authorities.  Every child is atomic and a failure leaves
    # the last checkpoint for explicit recovery; there is no retry loop.
    run_child(["scripts/build-relativity-reference-fixture-v9.py", "--output", str(FIXTURE.relative_to(ROOT))])
    run_child(["scripts/run-relativity-reference-v9.py", "--output", str(DOP853.relative_to(ROOT)), "--reference-fixture", str(FIXTURE.relative_to(ROOT)), "--max-days", "3652.5"])
    run_child(["scripts/run-relativity-variational-stm-v12.py", "--bundle", "dist/science/relativity-reference-bundle-v10.json", "--output", str(STM.relative_to(ROOT)), "--profile", "release", "--fit-iterations", "3"])
    run_child(["scripts/run-relativity-ias15-v9.py", "--fixture", str(FIXTURE.relative_to(ROOT)), "--output", str(IAS15.relative_to(ROOT)), "--max-days", "3652.5", "--reruns", "2"])
    checkpoint["stage"] = "campaign-complete"
    checkpoint["artifacts"] = {"fixture": sha_file(FIXTURE), "dop853": sha_file(DOP853), "stm": sha_file(STM), "ias15": sha_file(IAS15)}
    checkpoint["campaign"] = {"calibrationDays": 30, "fitIterations": 3, "holdoutDays": [365.0, 3652.5], "solverDifferenceSource": "dop853-vs-ias15-artifact-comparison", "solverDifferenceRecorded": True}
    checkpoint["failedClosed"] = False
    atomic_json(CHECKPOINT, checkpoint)
    return checkpoint


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v282 checkpointed relativity reference campaign")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    checkpoint = prepare() if not args.resume or not CHECKPOINT.exists() else read_json(CHECKPOINT) or prepare()
    if args.prepare_only or checkpoint.get("stage") == "blocked-target-identity-mismatch":
        print(json.dumps({"checkpoint": str(CHECKPOINT), "stage": checkpoint.get("stage"), "identity": checkpoint.get("identityValidation")}, indent=2))
        return
    try:
        checkpoint = run_campaign(checkpoint)
    except Exception as error:
        checkpoint["stage"] = "failed-child-command"
        checkpoint["failure"] = str(error)
        checkpoint["failedClosed"] = True
        atomic_json(CHECKPOINT, checkpoint)
        raise
    print(json.dumps({"checkpoint": str(CHECKPOINT), "stage": checkpoint.get("stage"), "failedClosed": checkpoint.get("failedClosed", False)}, indent=2))


if __name__ == "__main__":
    main()

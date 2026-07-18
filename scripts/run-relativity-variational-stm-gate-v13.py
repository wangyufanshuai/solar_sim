"""Deterministic A/B short gate for the Orbit Atlas variational STM campaign."""

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
SCRIPT = Path(__file__).resolve()
RUNNER = ROOT / "scripts/run-relativity-variational-stm-v12.py"
BUNDLE = ROOT / "dist/science/relativity-reference-bundle-v10.json"
FINITE = ROOT / "dist/science/relativity-stm-fit-v10.json"
OUTPUT = ROOT / "dist/science/relativity-variational-stm-gate-v13.json"
A_OUTPUT = ROOT / "dist/science/relativity-variational-stm-gate-v13-a.json"
B_OUTPUT = ROOT / "dist/science/relativity-variational-stm-gate-v13-b.json"
JACOBIAN_OUTPUT = ROOT / "dist/science/relativity-variational-stm-gate-v13-jacobian.json"
VERSION = "v243-relativity-variational-stm-gate-v13"
MODES = ("legacy-eih-1pn", "full-eih-1pn-2pn-lt")
JACOBIAN_MODES = (
    "newton",
    "legacy-eih-1pn",
    "full-eih-1pn-j2",
    "full-eih-1pn-2pn-lt",
)


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def value_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def run_checked(command: list[str], label: str) -> None:
    print(json.dumps({"phase": label, "command": command}), flush=True)
    completed = subprocess.run(command, cwd=ROOT, check=False)
    if completed.returncode != 0:
        raise RuntimeError(f"{label} failed with exit code {completed.returncode}")


def runner_command(output: Path) -> list[str]:
    return [
        sys.executable,
        str(RUNNER),
        "--profile", "gate",
        "--modes", *MODES,
        "--calibration-days", "30",
        "--fit-iterations", "1",
        "--output", str(output.relative_to(ROOT)).replace("\\", "/"),
    ]


def jacobian_command() -> list[str]:
    return [
        sys.executable,
        str(RUNNER),
        "--profile", "gate",
        "--modes", *JACOBIAN_MODES,
        "--jacobian-only",
        "--jacobian-output", str(JACOBIAN_OUTPUT.relative_to(ROOT)).replace("\\", "/"),
    ]


def mercury(checkpoint: dict[str, Any]) -> dict[str, Any] | None:
    return next(
        (row for row in checkpoint.get("perBody", []) if row.get("body") == "mercury"),
        None,
    )


def validate_run(document: dict[str, Any], label: str) -> dict[str, Any]:
    failures = []
    if document.get("profile") != "gate":
        failures.append(f"{label}: profile is not gate")
    reports = document.get("reports", [])
    if [row.get("mode") for row in reports] != list(MODES):
        failures.append(f"{label}: mode set/order drifted")
    summaries = []
    for report in reports:
        conditioning = report.get("conditioning", {})
        jacobians = report.get("jacobians", {})
        comparisons = report.get("comparisons", {})
        stm = comparisons.get("variationalSTMFit", [])
        ias = comparisons.get("ias15VariationalFit", [])
        mercury_dop = mercury(stm[0]) if len(stm) == 1 else None
        mercury_ias = mercury(ias[0]) if len(ias) == 1 else None
        checks = {
            "fullStateDimension": report.get("fullStateDimension") == 72,
            "parameterDimension": report.get("independentParameterDimension") == 66,
            "jointDimension": report.get("integratedStateAndPhiDimension") == 4824,
            "effectiveRank": conditioning.get("effectiveRank") == 66,
            "directionalError": jacobians.get("directionalValidationMaxRelativeError", float("inf")) < 5e-5,
            "fitIteration": report.get("nonlinearBatchFit", {}).get("completedIterations") == 1,
            "calibrationWindow": report.get("calibrationWindowDays") == [0, 30.0],
            "dop853Holdout": len(stm) == 1 and stm[0].get("offsetDays") == 365.0,
            "ias15Holdout": len(ias) == 1 and ias[0].get("offsetDays") == 365.0,
            "mercuryDop853": mercury_dop is not None,
            "mercuryIas15": mercury_ias is not None,
        }
        for check, passed in checks.items():
            if not passed:
                failures.append(f"{label}:{report.get('mode')}:{check}")
        summaries.append({
            "mode": report.get("mode"),
            "checks": checks,
            "effectiveRank": conditioning.get("effectiveRank"),
            "directionalValidationMaxRelativeError": jacobians.get("directionalValidationMaxRelativeError"),
            "mercury365Day": {
                "scipyDop853": mercury_dop,
                "reboundIas15": mercury_ias,
            },
        })
    return {"failures": failures, "reports": summaries}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v243 variational STM short gate")
    parser.add_argument("--plan-only", action="store_true")
    args = parser.parse_args()

    provenance = {
        "gateCodeSha256": file_hash(SCRIPT),
        "runnerCodeSha256": file_hash(RUNNER),
        "referenceBundleSha256": file_hash(BUNDLE),
        "finiteDifferenceEvidenceSha256": file_hash(FINITE),
        "python": sys.version,
    }
    plan = {
        "version": VERSION,
        "jacobianModes": list(JACOBIAN_MODES),
        "fitModes": list(MODES),
        "calibrationDays": 30,
        "gaussNewtonIterations": 1,
        "holdoutDays": [365.0],
        "propagators": ["scipy-dop853", "rebound-ias15"],
        "reruns": ["A", "B"],
        "provenance": provenance,
    }
    plan["inputSha256"] = value_hash(plan)
    if args.plan_only:
        print(json.dumps({
            **plan,
            "commands": {
                "jacobian": jacobian_command(),
                "A": runner_command(A_OUTPUT),
                "B": runner_command(B_OUTPUT),
            },
        }, indent=2))
        return

    run_checked(jacobian_command(), "jacobian-direction-validation")
    jacobian = json.loads(JACOBIAN_OUTPUT.read_text(encoding="utf-8"))
    jacobian_failures = [
        row for row in jacobian.get("rows", [])
        if not row.get("passed") or float(row.get("maxRelativeError", float("inf"))) >= 5e-5
    ]
    if len(jacobian.get("rows", [])) != 4 or jacobian_failures:
        stable = {
            **plan,
            "gatePassed": False,
            "failurePhase": "jacobian-direction-validation",
            "jacobian": jacobian,
            "failures": jacobian_failures or ["expected-four-jacobian-modes"],
            "promotionDecision": "shadow-retained",
            "boundary": "offline-short-gate-no-runtime-promotion",
        }
        stable["canonicalEvidenceSha256"] = value_hash(stable)
        atomic_json(OUTPUT, {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable})
        raise SystemExit(2)

    run_checked(runner_command(A_OUTPUT), "variational-stm-gate-A")
    run_checked(runner_command(B_OUTPUT), "variational-stm-gate-B")
    run_a = json.loads(A_OUTPUT.read_text(encoding="utf-8"))
    run_b = json.loads(B_OUTPUT.read_text(encoding="utf-8"))
    validation_a = validate_run(run_a, "A")
    validation_b = validate_run(run_b, "B")
    deterministic = run_a.get("canonicalEvidenceSha256") == run_b.get("canonicalEvidenceSha256")
    failures = [*validation_a["failures"], *validation_b["failures"]]
    if not deterministic:
        failures.append("A/B-canonical-hash-mismatch")
    stable = {
        **plan,
        "gatePassed": not failures,
        "failurePhase": None if not failures else "A/B-validation",
        "jacobian": {
            "sourceSha256": file_hash(JACOBIAN_OUTPUT),
            "canonicalEvidenceSha256": jacobian.get("canonicalEvidenceSha256"),
            "rows": jacobian.get("rows", []),
        },
        "rerun": {
            "deterministic": deterministic,
            "aCanonicalEvidenceSha256": run_a.get("canonicalEvidenceSha256"),
            "bCanonicalEvidenceSha256": run_b.get("canonicalEvidenceSha256"),
            "aSourceSha256": file_hash(A_OUTPUT),
            "bSourceSha256": file_hash(B_OUTPUT),
        },
        "validation": {"A": validation_a, "B": validation_b},
        "failures": failures,
        "promotionDecision": "shadow-retained",
        "boundary": "offline-short-gate-no-runtime-promotion",
    }
    stable["canonicalEvidenceSha256"] = value_hash(stable)
    atomic_json(OUTPUT, {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable})
    print(json.dumps({
        "output": str(OUTPUT),
        "gatePassed": stable["gatePassed"],
        "deterministic": deterministic,
        "failures": failures,
        "canonicalEvidenceSha256": stable["canonicalEvidenceSha256"],
    }, indent=2))
    if failures:
        raise SystemExit(2)


if __name__ == "__main__":
    main()


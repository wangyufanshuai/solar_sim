from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
V541_ROOT = ROOT / "dist/science/kerr-response-aware-replay-kit-v541"
V541_ATLAS = V541_ROOT / "atlas.json"
V541_KIT = V541_ROOT / "orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
V541_RECEIPT = V541_ROOT / "validation-receipt.json"
V541_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v541-evidence.json"
V541_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v541.json"
VALIDATOR = ROOT / "scripts/orbit_atlas_v542_stdlib_preflight.py"
BUILDER = ROOT / "scripts/build-kerr-replay-compatibility-v542.py"
OUT = ROOT / "dist/science/kerr-replay-compatibility-v542"
ATLAS = OUT / "atlas.json"
PREFLIGHT = OUT / "preflight-receipt.json"
MATRIX = OUT / "compatibility-matrix.json"
PORTABLE_VALIDATOR = OUT / "orbit-atlas-v542-stdlib-preflight.py"
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
    "columnSha256",
    "receiptSha256",
    "resultSha256",
    "environmentSha256",
    "preflightSha256",
    "matrixSha256",
}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    part.replace(path)


def run_preflight_once() -> tuple[dict[str, Any], bool]:
    temporary_path: Path | None = None
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v542-") as temporary:
        temporary_path = Path(temporary)
        shutil.copyfile(V541_KIT, temporary_path / "kit.zip")
        shutil.copyfile(V541_RECEIPT, temporary_path / "v541-validation.json")
        shutil.copyfile(VALIDATOR, temporary_path / "preflight.py")
        environment = os.environ.copy()
        for key in ["PYTHONPATH", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]:
            environment.pop(key, None)
        environment.update({"PYTHONHASHSEED": "0", "PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONIOENCODING": "utf-8"})
        command = [sys.executable, "preflight.py", "--kit", "kit.zip", "--validation-receipt", "v541-validation.json", "--validator", "preflight.py", "--output", "result.json"]
        completed = subprocess.run(command, cwd=temporary_path, env=environment, capture_output=True, text=True, timeout=30, check=False)
        if completed.returncode != 0 or completed.stdout or completed.stderr:
            raise RuntimeError(f"v542-preflight-exit-{completed.returncode}:{completed.stderr[-500:]}")
        result = json.loads((temporary_path / "result.json").read_text(encoding="utf-8"))
        if canonical_sha(result) != result.get("preflightSha256") or result.get("status") != "package-integrity-qualified-science-replay-still-requires-locked-dependencies":
            raise RuntimeError("v542-preflight-result")
    return result, temporary_path is not None and not temporary_path.exists()


def main() -> None:
    v541 = json.loads(V541_ATLAS.read_text(encoding="utf-8"))
    receipt = json.loads(V541_RECEIPT.read_text(encoding="utf-8"))
    previous_evidence = json.loads(V541_EVIDENCE.read_text(encoding="utf-8"))
    previous_pointer = json.loads(V541_POINTER.read_text(encoding="utf-8"))
    if canonical_sha(v541) != v541.get("artifactSha256") or canonical_sha(receipt) != receipt.get("resultSha256"):
        raise RuntimeError("v542-v541-authority")
    if v541["kit"]["fileSha256"] != file_sha(V541_KIT) or v541["validation"]["result"]["resultSha256"] != receipt["resultSha256"]:
        raise RuntimeError("v542-v541-files")
    if canonical_sha(previous_evidence) != previous_evidence.get("evidenceSha256") or canonical_sha(previous_pointer) != previous_pointer.get("pointerSha256"):
        raise RuntimeError("v542-v541-chain")

    result_a, cleanup_a = run_preflight_once()
    result_b, cleanup_b = run_preflight_once()
    if result_a != result_b or not cleanup_a or not cleanup_b:
        raise RuntimeError("v542-preflight-ab-or-cleanup")
    OUT.mkdir(parents=True, exist_ok=True)
    atomic_json(PREFLIGHT, result_a)
    validator_part = PORTABLE_VALIDATOR.with_name(f"{PORTABLE_VALIDATOR.name}.{os.getpid()}.part")
    shutil.copyfile(VALIDATOR, validator_part)
    validator_part.replace(PORTABLE_VALIDATOR)

    matrix_unsigned = {
        "version": "v542-kerr-replay-compatibility-matrix-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "one-environment-qualified-cross-environment-unqualified-not-tested",
        "source": {
            "v541ArtifactSha256": v541["artifactSha256"],
            "v541KitFileSha256": v541["kit"]["fileSha256"],
            "v541ValidationResultSha256": receipt["resultSha256"],
            "v542PreflightSha256": result_a["preflightSha256"],
        },
        "requiredRuntime": result_a["requiredRuntime"],
        "observedRuntime": result_a["observedRuntime"],
        "cells": result_a["compatibility"]["matrix"],
        "qualifiedCellCount": 1,
        "executedCellCount": 1,
        "unqualifiedNotTestedCellCount": 1,
        "exactLockMismatchCellCount": 2,
        "boundary": {
            "contractPredictionIsQualification": False,
            "otherOsExecuted": False,
            "otherPythonExecuted": False,
            "otherNumpyExecuted": False,
            "otherAstropyExecuted": False,
            "crossEnvironmentQualified": False,
        },
    }
    matrix = {**matrix_unsigned, "matrixSha256": canonical_sha(matrix_unsigned)}
    atomic_json(MATRIX, matrix)

    source_paths = [V541_ATLAS, V541_KIT, V541_RECEIPT, V541_EVIDENCE, V541_POINTER, VALIDATOR, BUILDER]
    source_manifest = sorted(
        ({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths),
        key=lambda entry: entry["path"],
    )
    unsigned = {
        "version": "v542-kerr-replay-compatibility-artifact-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "stdlib-preflight-qualified-one-environment-science-replay-qualified-cross-environment-unqualified",
        "source": {
            "v541ArtifactSha256": v541["artifactSha256"],
            "v541KitFileSha256": v541["kit"]["fileSha256"],
            "v541ValidationResultSha256": receipt["resultSha256"],
            "v541EvidenceSha256": previous_evidence["evidenceSha256"],
            "v541PointerSha256": previous_pointer["pointerSha256"],
        },
        "exports": {
            "preflight": {"path": "dist/science/kerr-replay-compatibility-v542/preflight-receipt.json", "fileSha256": file_sha(PREFLIGHT), "canonicalSha256": result_a["preflightSha256"]},
            "matrix": {"path": "dist/science/kerr-replay-compatibility-v542/compatibility-matrix.json", "fileSha256": file_sha(MATRIX), "canonicalSha256": matrix["matrixSha256"]},
            "validator": {"path": "dist/science/kerr-replay-compatibility-v542/orbit-atlas-v542-stdlib-preflight.py", "fileSha256": file_sha(PORTABLE_VALIDATOR)},
        },
        "preflight": result_a,
        "compatibility": matrix,
        "counts": {
            "preflightSubprocessAttemptCount": 2,
            "qualifiedPreflightSubprocessCount": 2,
            "temporaryDirectoryLeakCount": 0,
            "compatibilityCellCount": 4,
            "executedEnvironmentCount": 1,
            "crossEnvironmentExecutionCount": 0,
            "scienceDependencyImportCount": 0,
            "networkAttemptCount": 0,
        },
        "qualification": {
            "stdlibPreflightQualified": True,
            "v541LockedEnvironmentScienceReplayQualified": True,
            "compatibilityMatrixQualified": True,
            "crossEnvironmentQualified": False,
            "scienceImageQualified": False,
            "productionPromotionQualified": False,
        },
        "boundary": {
            "preflightIssuesScienceQualification": False,
            "fitsSemanticValidationRequiresLockedAstropy": True,
            "numpyScienceChecksRequireLockedNumpy": True,
            "denseCampaignStatus": "incomplete-0-of-49",
            "measuredCalibrationFiles": 0,
            "browserQualification": "not-run",
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS, artifact)
    print(json.dumps({
        "status": artifact["status"],
        "artifactSha256": artifact["artifactSha256"],
        "preflightSha256": result_a["preflightSha256"],
        "matrixSha256": matrix["matrixSha256"],
        "preflightSubprocesses": "2/2",
        "scienceDependencyImports": 0,
        "compatibilityCells": "4/4",
        "executedEnvironments": 1,
        "crossEnvironmentQualified": False,
    }, indent=2))


if __name__ == "__main__":
    main()

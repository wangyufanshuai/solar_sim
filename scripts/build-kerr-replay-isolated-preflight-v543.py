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
V541_KIT = V541_ROOT / "orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
V541_RECEIPT = V541_ROOT / "validation-receipt.json"
V542_ROOT = ROOT / "dist/science/kerr-replay-compatibility-v542"
V542_ATLAS = V542_ROOT / "atlas.json"
V542_PREFLIGHT = V542_ROOT / "preflight-receipt.json"
V542_MATRIX = V542_ROOT / "compatibility-matrix.json"
V542_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v542-evidence.json"
V542_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v542.json"
VALIDATOR = ROOT / "scripts/orbit_atlas_v542_stdlib_preflight.py"
RUNNER = ROOT / "scripts/orbit_atlas_v543_isolated_preflight.py"
BUILDER = ROOT / "scripts/build-kerr-replay-isolated-preflight-v543.py"
OUT = ROOT / "dist/science/kerr-replay-isolated-preflight-v543"
ATLAS = OUT / "atlas.json"
RECEIPT = OUT / "isolated-preflight-receipt.json"
MATRIX = OUT / "execution-matrix.json"
PORTABLE_RUNNER = OUT / "orbit-atlas-v543-isolated-preflight.py"
PORTABLE_VALIDATOR = OUT / "orbit-atlas-v542-stdlib-preflight.py"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256", "preflightSha256", "matrixSha256", "isolatedReceiptSha256", "executionMatrixSha256"}


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


def atomic_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(f"{target.name}.{os.getpid()}.part")
    shutil.copyfile(source, part)
    part.replace(target)


def run_isolated_once() -> tuple[dict[str, Any], bool]:
    temporary_path: Path | None = None
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v543-") as temporary:
        temporary_path = Path(temporary)
        shutil.copyfile(V541_KIT, temporary_path / "kit.zip")
        shutil.copyfile(V541_RECEIPT, temporary_path / "v541-validation.json")
        shutil.copyfile(VALIDATOR, temporary_path / "preflight.py")
        shutil.copyfile(RUNNER, temporary_path / "isolated.py")
        environment = os.environ.copy()
        for key in ["PYTHONPATH", "PYTHONHOME", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]:
            environment.pop(key, None)
        environment.update({"PYTHONHASHSEED": "0", "PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONIOENCODING": "utf-8"})
        command = [sys.executable, "-I", "-S", "isolated.py", "--validator", "preflight.py", "--kit", "kit.zip", "--validation-receipt", "v541-validation.json", "--output", "receipt.json"]
        completed = subprocess.run(command, cwd=temporary_path, env=environment, capture_output=True, text=True, timeout=30, check=False)
        if completed.returncode != 0 or completed.stdout or completed.stderr:
            raise RuntimeError(f"v543-isolated-exit-{completed.returncode}:{completed.stderr[-600:]}")
        receipt = json.loads((temporary_path / "receipt.json").read_text(encoding="utf-8"))
        if canonical_sha(receipt) != receipt.get("isolatedReceiptSha256") or receipt.get("status") != "isolated-package-preflight-qualified-science-replay-unavailable-no-site-packages":
            raise RuntimeError("v543-isolated-receipt")
    return receipt, temporary_path is not None and not temporary_path.exists()


def main() -> None:
    v542 = json.loads(V542_ATLAS.read_text(encoding="utf-8"))
    v542_preflight = json.loads(V542_PREFLIGHT.read_text(encoding="utf-8"))
    v542_matrix = json.loads(V542_MATRIX.read_text(encoding="utf-8"))
    previous_evidence = json.loads(V542_EVIDENCE.read_text(encoding="utf-8"))
    previous_pointer = json.loads(V542_POINTER.read_text(encoding="utf-8"))
    if canonical_sha(v542) != v542.get("artifactSha256") or canonical_sha(v542_preflight) != v542_preflight.get("preflightSha256") or canonical_sha(v542_matrix) != v542_matrix.get("matrixSha256"):
        raise RuntimeError("v543-v542-authority")
    if json.dumps(v542_preflight, sort_keys=True) != json.dumps(v542["preflight"], sort_keys=True) or json.dumps(v542_matrix, sort_keys=True) != json.dumps(v542["compatibility"], sort_keys=True):
        raise RuntimeError("v543-v542-link")
    if canonical_sha(previous_evidence) != previous_evidence.get("evidenceSha256") or canonical_sha(previous_pointer) != previous_pointer.get("pointerSha256"):
        raise RuntimeError("v543-v542-chain")

    receipt_a, cleanup_a = run_isolated_once()
    receipt_b, cleanup_b = run_isolated_once()
    if receipt_a != receipt_b or not cleanup_a or not cleanup_b:
        raise RuntimeError("v543-isolated-ab-or-cleanup")
    if receipt_a["execution"] != {"pythonIsolatedFlag": 1, "pythonNoSiteFlag": 1, "siteModuleLoaded": False, "sitePackagePathCount": 0, "numpyModuleLoaded": False, "astropyModuleLoaded": False, "commandFlags": ["-I", "-S"]}:
        raise RuntimeError("v543-isolation-proof")
    if receipt_a["observedRuntime"]["numpyVersion"] != "unavailable" or receipt_a["observedRuntime"]["astropyVersion"] != "unavailable" or receipt_a["compatibility"]["scienceReplayQualified"] is not False:
        raise RuntimeError("v543-science-boundary")

    OUT.mkdir(parents=True, exist_ok=True)
    atomic_json(RECEIPT, receipt_a)
    atomic_copy(RUNNER, PORTABLE_RUNNER)
    atomic_copy(VALIDATOR, PORTABLE_VALIDATOR)
    cells = [
        {
            "id": "locked-runtime-science-replay",
            "execution": "executed-v541-two-of-two",
            "pythonMode": "normal-locked-environment",
            "dependencyState": "exact-cpython-numpy-astropy-zlib-lock",
            "packagePreflight": "qualified-v542-two-of-two",
            "scienceReplay": "qualified-v541-current-environment-only",
            "scienceQualified": True,
        },
        {
            "id": "isolated-no-site-packages",
            "execution": "executed-v543-two-of-two",
            "pythonMode": "isolated-no-site",
            "dependencyState": "numpy-unavailable-astropy-unavailable",
            "packagePreflight": "qualified-v543-two-of-two",
            "scienceReplay": "unavailable-exact-dependencies-absent",
            "scienceQualified": False,
        },
        {
            "id": "same-lock-other-os",
            "execution": "not-run",
            "pythonMode": "unknown",
            "dependencyState": "contract-only",
            "packagePreflight": "not-run",
            "scienceReplay": "unqualified-not-tested",
            "scienceQualified": False,
        },
        {
            "id": "different-python",
            "execution": "not-run",
            "pythonMode": "different-version",
            "dependencyState": "exact-lock-mismatch",
            "packagePreflight": "not-run",
            "scienceReplay": "unqualified-not-tested",
            "scienceQualified": False,
        },
        {
            "id": "different-science-dependencies",
            "execution": "not-run",
            "pythonMode": "unknown",
            "dependencyState": "numpy-or-astropy-version-mismatch",
            "packagePreflight": "not-run",
            "scienceReplay": "unqualified-not-tested",
            "scienceQualified": False,
        },
    ]
    matrix_unsigned = {
        "version": "v543-isolated-preflight-execution-matrix-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "two-executed-package-environments-one-science-qualified-cross-environment-unqualified",
        "source": {"v542ArtifactSha256": v542["artifactSha256"], "v542PreflightSha256": v542_preflight["preflightSha256"], "v543IsolatedReceiptSha256": receipt_a["isolatedReceiptSha256"]},
        "cells": cells,
        "cellCount": 5,
        "executedCellCount": 2,
        "packagePreflightQualifiedCellCount": 2,
        "scienceQualifiedCellCount": 1,
        "crossOperatingSystemExecutedCellCount": 0,
        "unexecutedCellCount": 3,
        "boundary": {"packageQualificationPromotedToScience": False, "crossOperatingSystemQualified": False, "crossEnvironmentScienceQualified": False},
    }
    matrix = {**matrix_unsigned, "executionMatrixSha256": canonical_sha(matrix_unsigned)}
    atomic_json(MATRIX, matrix)

    source_paths = [V541_KIT, V541_RECEIPT, V542_ATLAS, V542_PREFLIGHT, V542_MATRIX, V542_EVIDENCE, V542_POINTER, VALIDATOR, RUNNER, BUILDER]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda entry: entry["path"])
    unsigned = {
        "version": "v543-kerr-replay-isolated-preflight-artifact-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "isolated-stdlib-preflight-qualified-science-boundary-preserved-cross-environment-unqualified",
        "source": {"v542ArtifactSha256": v542["artifactSha256"], "v542PreflightSha256": v542_preflight["preflightSha256"], "v542MatrixSha256": v542_matrix["matrixSha256"], "v542EvidenceSha256": previous_evidence["evidenceSha256"], "v542PointerSha256": previous_pointer["pointerSha256"]},
        "exports": {
            "receipt": {"path": "dist/science/kerr-replay-isolated-preflight-v543/isolated-preflight-receipt.json", "fileSha256": file_sha(RECEIPT), "canonicalSha256": receipt_a["isolatedReceiptSha256"]},
            "matrix": {"path": "dist/science/kerr-replay-isolated-preflight-v543/execution-matrix.json", "fileSha256": file_sha(MATRIX), "canonicalSha256": matrix["executionMatrixSha256"]},
            "runner": {"path": "dist/science/kerr-replay-isolated-preflight-v543/orbit-atlas-v543-isolated-preflight.py", "fileSha256": file_sha(PORTABLE_RUNNER)},
            "validator": {"path": "dist/science/kerr-replay-isolated-preflight-v543/orbit-atlas-v542-stdlib-preflight.py", "fileSha256": file_sha(PORTABLE_VALIDATOR)},
        },
        "receipt": receipt_a,
        "executionMatrix": matrix,
        "counts": {"isolatedSubprocessAttemptCount": 2, "qualifiedIsolatedSubprocessCount": 2, "temporaryDirectoryLeakCount": 0, "executedEnvironmentCount": 2, "packageQualifiedEnvironmentCount": 2, "scienceQualifiedEnvironmentCount": 1, "crossOperatingSystemExecutionCount": 0, "scienceDependencyImportCount": 0, "networkAttemptCount": 0},
        "qualification": {"isolatedNoSitePackagePreflightQualified": True, "v541LockedEnvironmentScienceReplayQualified": True, "packagePreflightPortabilityDemonstratedWithoutScienceDependencies": True, "crossOperatingSystemQualified": False, "crossEnvironmentScienceQualified": False, "scienceImageQualified": False, "productionPromotionQualified": False},
        "boundary": {"isolatedPreflightIssuesScienceQualification": False, "fitsSemanticValidationPerformedInIsolation": False, "denseCampaignStatus": "incomplete-0-of-49", "measuredCalibrationFiles": 0, "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "isolatedReceiptSha256": receipt_a["isolatedReceiptSha256"], "executionMatrixSha256": matrix["executionMatrixSha256"], "isolatedSubprocesses": "2/2", "executedEnvironments": 2, "scienceQualifiedEnvironments": 1, "numpyImports": 0, "astropyImports": 0, "crossEnvironmentScienceQualified": False}, indent=2))


if __name__ == "__main__":
    main()

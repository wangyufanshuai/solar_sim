from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import zipfile
from io import BytesIO
from pathlib import Path

import pytest


ROOT = Path.cwd()
MODULE_PATH = ROOT / "scripts/orbit_atlas_v542_stdlib_preflight.py"
ARTIFACT = ROOT / "dist/science/kerr-replay-compatibility-v542/atlas.json"
PREFLIGHT = ROOT / "dist/science/kerr-replay-compatibility-v542/preflight-receipt.json"
MATRIX = ROOT / "dist/science/kerr-replay-compatibility-v542/compatibility-matrix.json"
KIT = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
VALIDATION = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/validation-receipt.json"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v542_stdlib_preflight", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_artifact_and_matrix_are_canonical_and_fail_closed() -> None:
    module = load_module()
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    assert module.canonical_sha(artifact) == artifact["artifactSha256"]
    assert module.canonical_sha(preflight) == preflight["preflightSha256"]
    assert module.canonical_sha(matrix) == matrix["matrixSha256"]
    assert artifact["exports"]["preflight"]["fileSha256"] == file_sha(PREFLIGHT)
    assert artifact["exports"]["matrix"]["fileSha256"] == file_sha(MATRIX)
    assert artifact["counts"] == {
        "preflightSubprocessAttemptCount": 2,
        "qualifiedPreflightSubprocessCount": 2,
        "temporaryDirectoryLeakCount": 0,
        "compatibilityCellCount": 4,
        "executedEnvironmentCount": 1,
        "crossEnvironmentExecutionCount": 0,
        "scienceDependencyImportCount": 0,
        "networkAttemptCount": 0,
    }
    assert matrix["qualifiedCellCount"] == matrix["executedCellCount"] == 1
    assert matrix["boundary"]["crossEnvironmentQualified"] is False
    assert preflight["qualification"]["scientificReplayQualifiedByThisPreflight"] is False


def test_preflight_source_imports_only_the_standard_library() -> None:
    source = MODULE_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source)
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".")[0])
    assert imports <= {
        "__future__", "argparse", "hashlib", "importlib", "json", "platform", "socket", "stat", "sys", "zipfile", "zlib", "io", "pathlib", "typing"
    }
    assert "numpy" not in imports and "astropy" not in imports


def test_preflight_runs_from_an_isolated_directory_without_science_imports() -> None:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v542-test-") as temporary:
        directory = Path(temporary)
        (directory / "kit.zip").write_bytes(KIT.read_bytes())
        (directory / "receipt.json").write_bytes(VALIDATION.read_bytes())
        (directory / "preflight.py").write_bytes(MODULE_PATH.read_bytes())
        environment = os.environ.copy()
        environment.pop("PYTHONPATH", None)
        environment.update({"PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONHASHSEED": "0"})
        result = subprocess.run(
            [sys.executable, "preflight.py", "--kit", "kit.zip", "--validation-receipt", "receipt.json", "--validator", "preflight.py", "--output", "result.json"],
            cwd=directory,
            env=environment,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        assert result.returncode == 0 and result.stdout == "" and result.stderr == ""
        receipt = json.loads((directory / "result.json").read_text(encoding="utf-8"))
        assert receipt["checks"]["numpyImported"] is False
        assert receipt["checks"]["astropyImported"] is False
        assert receipt["checks"]["networkAttemptCount"] == 0


def test_manifest_and_path_tampering_fail_closed() -> None:
    module = load_module()
    original = KIT.read_bytes()
    with zipfile.ZipFile(BytesIO(original), "r") as archive:
        members = {name: archive.read(name) for name in archive.namelist()}
        infos = {entry.filename: entry for entry in archive.infolist()}
    members["README.md"] += b"tampered"
    output = BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        for name in sorted(members):
            archive.writestr(infos[name], members[name])
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v542-mutation-") as temporary:
        directory = Path(temporary)
        (directory / "kit.zip").write_bytes(output.getvalue())
        (directory / "receipt.json").write_bytes(VALIDATION.read_bytes())
        (directory / "preflight.py").write_bytes(MODULE_PATH.read_bytes())
        previous = Path.cwd()
        os.chdir(directory)
        try:
            with pytest.raises(RuntimeError, match="v542-kit-manifest"):
                module.preflight(Path("kit.zip"), Path("receipt.json"), Path("preflight.py"))
        finally:
            os.chdir(previous)


def test_unexecuted_environments_are_never_promoted_by_contract() -> None:
    module = load_module()
    required = {"pythonImplementation": "cpython", "pythonVersion": "3.12.3", "numpyVersion": "2.2.6", "astropyVersion": "7.2.0", "zlibVersion": "1.3.1"}
    observed = {**required, "osFamily": "windows", "osRelease": "11", "machine": "amd64"}
    cells = module.compatibility_matrix(required, observed)
    assert cells[0]["executed"] is True and cells[0]["scienceReplay"].startswith("qualified-v541")
    assert all(cell["executed"] is False for cell in cells[1:])
    assert all(cell["scienceReplay"].startswith("unqualified") for cell in cells[1:])


def test_package_preflight_survives_missing_science_distributions_without_promoting_science(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_module()
    monkeypatch.setattr(module, "installed_distribution", lambda _name: "unavailable")
    monkeypatch.delitem(sys.modules, "numpy", raising=False)
    monkeypatch.delitem(sys.modules, "astropy", raising=False)
    previous = Path.cwd()
    os.chdir(ROOT)
    try:
        result = module.preflight(
            Path("dist/science/kerr-response-aware-replay-kit-v541/orbit-atlas-kerr-response-aware-replay-kit-v541.zip"),
            Path("dist/science/kerr-response-aware-replay-kit-v541/validation-receipt.json"),
            Path("scripts/orbit_atlas_v542_stdlib_preflight.py"),
        )
    finally:
        os.chdir(previous)
    assert result["qualification"]["stdlibPackagePreflightQualified"] is True
    assert result["qualification"]["exactDependencyTupleDetected"] is False
    assert result["compatibility"]["observedEnvironmentReadyForLockedScienceReplay"] is False
    assert result["compatibility"]["matrix"][0]["scienceReplay"] == "unqualified-environment-mismatch"

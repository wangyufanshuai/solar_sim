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


ROOT = Path.cwd()
RUNNER = ROOT / "scripts/orbit_atlas_v543_isolated_preflight.py"
VALIDATOR = ROOT / "scripts/orbit_atlas_v542_stdlib_preflight.py"
KIT = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
V541_RECEIPT = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/validation-receipt.json"
OUT = ROOT / "dist/science/kerr-replay-isolated-preflight-v543"


def load_runner():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v543_isolated_preflight", RUNNER)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_isolated(directory: Path, kit_bytes: bytes) -> subprocess.CompletedProcess[str]:
    (directory / "kit.zip").write_bytes(kit_bytes)
    (directory / "receipt.json").write_bytes(V541_RECEIPT.read_bytes())
    (directory / "preflight.py").write_bytes(VALIDATOR.read_bytes())
    (directory / "isolated.py").write_bytes(RUNNER.read_bytes())
    environment = os.environ.copy()
    for key in ["PYTHONPATH", "PYTHONHOME"]:
        environment.pop(key, None)
    environment.update({"PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONHASHSEED": "0"})
    return subprocess.run([sys.executable, "-I", "-S", "isolated.py", "--validator", "preflight.py", "--kit", "kit.zip", "--validation-receipt", "receipt.json", "--output", "result.json"], cwd=directory, env=environment, capture_output=True, text=True, timeout=30, check=False)


def test_artifact_receipt_and_execution_matrix_are_canonical() -> None:
    module = load_runner()
    artifact = json.loads((OUT / "atlas.json").read_text(encoding="utf-8"))
    receipt = json.loads((OUT / "isolated-preflight-receipt.json").read_text(encoding="utf-8"))
    matrix = json.loads((OUT / "execution-matrix.json").read_text(encoding="utf-8"))
    assert module.canonical_sha(artifact) == artifact["artifactSha256"]
    assert module.canonical_sha(receipt) == receipt["isolatedReceiptSha256"]
    assert module.canonical_sha(matrix) == matrix["executionMatrixSha256"]
    assert artifact["exports"]["receipt"]["fileSha256"] == file_sha(OUT / "isolated-preflight-receipt.json")
    assert artifact["executionMatrix"]["executedCellCount"] == 2
    assert artifact["executionMatrix"]["scienceQualifiedCellCount"] == 1
    assert artifact["qualification"]["crossEnvironmentScienceQualified"] is False


def test_runner_uses_only_the_standard_library() -> None:
    tree = ast.parse(RUNNER.read_text(encoding="utf-8"))
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".")[0])
    assert imports <= {"__future__", "argparse", "hashlib", "json", "runpy", "sys", "pathlib", "typing"}
    assert "numpy" not in imports and "astropy" not in imports and "site" not in imports


def test_real_isolated_no_site_execution_qualifies_package_only() -> None:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v543-test-") as temporary:
        directory = Path(temporary)
        completed = run_isolated(directory, KIT.read_bytes())
        assert completed.returncode == 0 and completed.stdout == "" and completed.stderr == ""
        result = json.loads((directory / "result.json").read_text(encoding="utf-8"))
        assert result["execution"] == {"pythonIsolatedFlag": 1, "pythonNoSiteFlag": 1, "siteModuleLoaded": False, "sitePackagePathCount": 0, "numpyModuleLoaded": False, "astropyModuleLoaded": False, "commandFlags": ["-I", "-S"]}
        assert result["observedRuntime"]["numpyVersion"] == "unavailable"
        assert result["observedRuntime"]["astropyVersion"] == "unavailable"
        assert result["qualification"]["isolatedStdlibPreflightQualified"] is True
        assert result["qualification"]["scienceReplayQualified"] is False


def test_isolated_manifest_tampering_fails_closed() -> None:
    with zipfile.ZipFile(BytesIO(KIT.read_bytes()), "r") as archive:
        members = {name: archive.read(name) for name in archive.namelist()}
        infos = {entry.filename: entry for entry in archive.infolist()}
    members["README.md"] += b"tamper"
    output = BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        for name in sorted(members):
            archive.writestr(infos[name], members[name])
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v543-mutation-") as temporary:
        completed = run_isolated(Path(temporary), output.getvalue())
        assert completed.returncode != 0
        assert "v542-kit-manifest" in completed.stderr

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import zipfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_PATH = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/atlas.json"
RESULT_PATH = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/validation-receipt.json"
KIT_PATH = ROOT / "dist/science/kerr-response-aware-replay-kit-v541/orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
BUILDER_PATH = ROOT / "scripts/build-kerr-response-aware-replay-kit-v541.py"
SPEC = importlib.util.spec_from_file_location("v541_builder", BUILDER_PATH)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def rebuild_kit(members: dict[str, bytes]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        for name in sorted(members):
            archive.writestr(name, members[name])
    return output.getvalue()


def test_v541_kit_artifact_environment_and_result_are_canonical() -> None:
    artifact = json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))
    result = json.loads(RESULT_PATH.read_text(encoding="utf-8"))
    assert BUILDER.canonical_sha(artifact) == artifact["artifactSha256"]
    assert BUILDER.canonical_sha(result) == result["resultSha256"]
    assert hashlib.sha256(KIT_PATH.read_bytes()).hexdigest() == artifact["kit"]["fileSha256"]
    assert artifact["environment"]["environmentSha256"] == BUILDER.canonical_sha(artifact["environment"])
    assert artifact["environment"]["runtime"] == {"pythonImplementation": "cpython", "pythonVersion": "3.12.3", "numpyVersion": "2.2.6", "astropyVersion": "7.2.0", "zlibVersion": "1.3.1"}
    assert artifact["qualification"]["portabilityBeyondLockedEnvironmentQualified"] is False


def test_v541_kit_replays_in_another_subprocess_temp_directory() -> None:
    artifact = json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))
    expected = json.loads(RESULT_PATH.read_text(encoding="utf-8"))
    replay, removed = BUILDER.validate_kit_once(KIT_PATH.read_bytes())
    assert replay == expected
    assert removed is True
    assert replay["checks"]["kitManifestReplayCount"] == 6
    assert replay["checks"]["networkAttemptCount"] == 0
    assert replay["boundary"]["workspaceImportCount"] == 0
    assert artifact["validation"]["qualifiedSubprocessCount"] == 2


def test_v541_environment_validator_and_path_mutations_fail_closed() -> None:
    with zipfile.ZipFile(KIT_PATH, "r") as archive:
        members = {name: archive.read(name) for name in archive.namelist()}

    environment = json.loads(members["environment/environment.json"])
    environment["runtime"]["pythonVersion"] = "0.0.0"
    environment["environmentSha256"] = BUILDER.canonical_sha(environment)
    members["environment/environment.json"] = (json.dumps(environment, ensure_ascii=False, indent=2) + "\n").encode()
    covered = {name: value for name, value in members.items() if name != "manifest-sha256.txt"}
    members["manifest-sha256.txt"] = "".join(f"{hashlib.sha256(value).hexdigest()}  {name}\n" for name, value in sorted(covered.items())).encode("ascii")
    with pytest.raises(Exception):
        BUILDER.validate_kit_once(rebuild_kit(members))

    with zipfile.ZipFile(KIT_PATH, "r") as archive:
        members = {name: archive.read(name) for name in archive.namelist()}
    members["validator/validate_replay_kit.py"] = b"raise RuntimeError('mutated-validator')\n"
    covered = {name: value for name, value in members.items() if name != "manifest-sha256.txt"}
    members["manifest-sha256.txt"] = "".join(f"{hashlib.sha256(value).hexdigest()}  {name}\n" for name, value in sorted(covered.items())).encode("ascii")
    with pytest.raises(Exception):
        BUILDER.validate_kit_once(rebuild_kit(members))

    traversal = io.BytesIO()
    with zipfile.ZipFile(traversal, "w") as archive:
        archive.writestr("../escape.txt", b"forbidden")
    with pytest.raises(Exception):
        BUILDER.validate_kit_once(traversal.getvalue())

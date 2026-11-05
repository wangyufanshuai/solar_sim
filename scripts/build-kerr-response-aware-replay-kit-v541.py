from __future__ import annotations

import hashlib
import json
import os
import platform
import stat
import subprocess
import sys
import tempfile
import zipfile
import zlib
from pathlib import Path, PurePosixPath
from typing import Any

import astropy
import numpy as np

ROOT = Path.cwd()
V539_CRATE = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip"
V540_RECEIPT = ROOT / "dist/science/kerr-response-aware-offline-replay-v540/replay-receipt.json"
V540_ATLAS = ROOT / "dist/science/kerr-response-aware-offline-replay-v540/atlas.json"
V540_EVIDENCE = ROOT / "dist/science/orbit-atlas-shadow-v540-evidence.json"
V540_POINTER = ROOT / "dist/release/orbit-atlas-current-local-shadow-candidate-v540.json"
VALIDATOR = ROOT / "scripts/orbit_atlas_v541_standalone_validator.py"
OUT_DIR = ROOT / "dist/science/kerr-response-aware-replay-kit-v541"
KIT_PATH = OUT_DIR / "orbit-atlas-kerr-response-aware-replay-kit-v541.zip"
RESULT_PATH = OUT_DIR / "validation-receipt.json"
ATLAS_PATH = OUT_DIR / "atlas.json"
FIXED_ZIP_TIME = (2026, 8, 2, 0, 0, 0)
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256"}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()).hexdigest()


def byte_sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return byte_sha(path.read_bytes())


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_bytes(json_bytes(value))
    part.replace(path)


def zip_info(name: str) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_STORED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    return info


def write_zip(path: Path, members: dict[str, bytes]) -> None:
    if path.exists():
        path.unlink()
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED, allowZip64=False, strict_timestamps=True) as archive:
        for name in sorted(members):
            archive.writestr(zip_info(name), members[name])


def safe_name(name: str) -> bool:
    path = PurePosixPath(name)
    return bool(name) and not path.is_absolute() and ".." not in path.parts and "\\" not in name


def validate_kit_once(kit_bytes: bytes) -> tuple[dict[str, Any], bool]:
    temporary_path: Path | None = None
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v541-") as temporary:
        temporary_path = Path(temporary)
        with zipfile.ZipFile(__import__("io").BytesIO(kit_bytes), "r") as archive:
            infos = archive.infolist()
            if len(infos) != 7 or archive.testzip() is not None or len({info.filename for info in infos}) != 7:
                raise RuntimeError("v541-kit-layout")
            for info in infos:
                if not safe_name(info.filename) or stat.S_IFMT(info.external_attr >> 16) == stat.S_IFLNK or info.file_size <= 0 or info.file_size > 1024 * 1024:
                    raise RuntimeError("v541-kit-member-safety")
                payload = archive.read(info.filename)
                target = temporary_path.joinpath(*PurePosixPath(info.filename).parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(payload)
        environment = os.environ.copy()
        for key in ["PYTHONPATH", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]:
            environment.pop(key, None)
        environment.update({"PYTHONHASHSEED": "0", "PYTHONDONTWRITEBYTECODE": "1", "PYTHONNOUSERSITE": "1", "PYTHONIOENCODING": "utf-8"})
        command = [sys.executable, "validator/validate_replay_kit.py", "--crate", "payload/orbit-atlas-kerr-response-aware-v539.zip", "--receipt", "receipts/v540-replay-receipt.json", "--environment", "environment/environment.json", "--runtime-lock", "environment/runtime-lock.txt", "--kit-manifest", "manifest-sha256.txt", "--output", "validation-result.json"]
        completed = subprocess.run(command, cwd=temporary_path, env=environment, capture_output=True, text=True, timeout=30, check=False)
        if completed.returncode != 0 or completed.stdout or completed.stderr:
            raise RuntimeError(f"v541-validator-exit-{completed.returncode}:{completed.stderr[-400:]}")
        result = json.loads((temporary_path / "validation-result.json").read_text(encoding="utf-8"))
        if canonical_sha(result) != result.get("resultSha256") or result.get("status") != "standalone-replay-kit-qualified" or result.get("checks", {}).get("networkAttemptCount") != 0:
            raise RuntimeError("v541-validator-result")
    return result, temporary_path is not None and not temporary_path.exists()


def main() -> None:
    validator_bytes = VALIDATOR.read_bytes()
    runtime_lock = (f"python=={platform.python_version()}\nnumpy=={np.__version__}\nastropy=={astropy.__version__}\nzlib=={zlib.ZLIB_VERSION}\n").encode("ascii")
    environment_unsigned = {
        "version": "v541-replay-kit-environment-lock-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "exact-runtime-lock-qualified-current-environment-only",
        "runtime": {"pythonImplementation": sys.implementation.name, "pythonVersion": platform.python_version(), "numpyVersion": np.__version__, "astropyVersion": astropy.__version__, "zlibVersion": zlib.ZLIB_VERSION},
        "validatorFileSha256": byte_sha(validator_bytes),
        "runtimeLockFileSha256": byte_sha(runtime_lock),
        "strictExactVersions": True,
        "portabilityBeyondLockedEnvironmentQualified": False,
        "absolutePathStored": False,
    }
    environment_manifest = {**environment_unsigned, "environmentSha256": canonical_sha(environment_unsigned)}
    base_members = {
        "README.md": b"# Orbit Atlas v541 standalone replay kit\n\nRun the bundled validator with the included exact runtime lock. The kit replays the v539 sparse-science crate and v540 receipt without importing the Orbit Atlas workspace. Exact versions are required; portability beyond the locked environment is not qualified. No science image, pixel sample, physical uncertainty interval, dense authority, or production promotion is created.\n",
        "environment/environment.json": json_bytes(environment_manifest),
        "environment/runtime-lock.txt": runtime_lock,
        "payload/orbit-atlas-kerr-response-aware-v539.zip": V539_CRATE.read_bytes(),
        "receipts/v540-replay-receipt.json": V540_RECEIPT.read_bytes(),
        "validator/validate_replay_kit.py": validator_bytes,
    }
    manifest = "".join(f"{byte_sha(value)}  {name}\n" for name, value in sorted(base_members.items())).encode("ascii")
    members = {**base_members, "manifest-sha256.txt": manifest}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    candidate_a = OUT_DIR / "candidate-a.zip"
    candidate_b = OUT_DIR / "candidate-b.zip"
    write_zip(candidate_a, members)
    write_zip(candidate_b, members)
    if candidate_a.read_bytes() != candidate_b.read_bytes():
        raise RuntimeError("v541-kit-ab-nondeterministic")
    if KIT_PATH.exists():
        KIT_PATH.unlink()
    candidate_a.replace(KIT_PATH)
    candidate_b.unlink()
    result_a, removed_a = validate_kit_once(KIT_PATH.read_bytes())
    result_b, removed_b = validate_kit_once(KIT_PATH.read_bytes())
    if result_a != result_b or not removed_a or not removed_b:
        raise RuntimeError("v541-validator-ab-or-cleanup")
    atomic_json(RESULT_PATH, result_a)

    v540 = json.loads(V540_ATLAS.read_text(encoding="utf-8"))
    evidence = json.loads(V540_EVIDENCE.read_text(encoding="utf-8"))
    pointer = json.loads(V540_POINTER.read_text(encoding="utf-8"))
    if canonical_sha(v540) != v540.get("artifactSha256") or result_a["v540ReceiptSha256"] != v540["receipt"]["receiptSha256"] or canonical_sha(evidence) != evidence.get("evidenceSha256") or canonical_sha(pointer) != pointer.get("pointerSha256"):
        raise RuntimeError("v541-upstream-link")
    member_records = [{"path": name, "sha256": byte_sha(value), "bytes": len(value), "role": "integrity-manifest" if name == "manifest-sha256.txt" else "validator" if name.startswith("validator/") else "environment" if name.startswith("environment/") else "science-crate" if name.startswith("payload/") else "receipt" if name.startswith("receipts/") else "readme"} for name, value in sorted(members.items())]
    source_paths = [V539_CRATE, V540_RECEIPT, V540_ATLAS, V540_EVIDENCE, V540_POINTER, VALIDATOR, ROOT / "scripts/build-kerr-response-aware-replay-kit-v541.py"]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda item: item["path"])
    unsigned = {
        "version": "v541-kerr-response-aware-standalone-replay-kit-artifact-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "standalone-replay-kit-qualified-locked-environment-only-heavy-browser-pending",
        "source": {"v539CrateFileSha256": file_sha(V539_CRATE), "v540ArtifactSha256": v540["artifactSha256"], "v540ReceiptSha256": v540["receipt"]["receiptSha256"], "v540EvidenceSha256": evidence["evidenceSha256"], "v540PointerSha256": pointer["pointerSha256"]},
        "kit": {"path": "dist/science/kerr-response-aware-replay-kit-v541/orbit-atlas-kerr-response-aware-replay-kit-v541.zip", "fileSha256": file_sha(KIT_PATH), "bytes": KIT_PATH.stat().st_size, "memberCount": 7, "manifestCoveredMemberCount": 6, "abByteIdentical": True, "fixedTimestamp": "2026-08-02T00:00:00", "fixedMode": "100644", "compression": "stored"},
        "members": member_records,
        "environment": environment_manifest,
        "validation": {"result": result_a, "resultExportPath": "dist/science/kerr-response-aware-replay-kit-v541/validation-receipt.json", "resultFileSha256": file_sha(RESULT_PATH), "resultCanonicalSha256": result_a["resultSha256"], "subprocessAttemptCount": 2, "qualifiedSubprocessCount": 2, "temporaryDirectoryLeakCount": 0, "workspaceImportCount": 0, "networkAttemptCount": 0},
        "counts": {"kitMemberCount": 7, "manifestReplayCount": 6, "validatorCount": 1, "environmentManifestCount": 1, "runtimeLockCount": 1, "scienceCrateCount": 1, "sourceReceiptCount": 1, "validationReceiptCount": 1, "pixelSampleCount": 0, "fitsImageHduCount": 0, "physicalUncertaintyValueCount": 0},
        "qualification": {"standaloneReplayKitQualified": True, "deterministicKitQualified": True, "exactEnvironmentQualified": True, "independentSubprocessReplayQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False, "productionPromotionQualified": False, "portabilityBeyondLockedEnvironmentQualified": False},
        "boundary": {"workspaceImportCount": 0, "absolutePathStored": False, "networkAttempted": False, "exactRuntimeRequired": True, "sciencePayloadMutationAllowed": False, "cinematicScienceWritebackAllowed": False, "measuredCalibrationFiles": 0, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS_PATH, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "kitSha256": artifact["kit"]["fileSha256"], "resultSha256": result_a["resultSha256"], "members": 7, "manifest": "6/6", "subprocesses": "2/2", "networkAttempts": 0, "temporaryLeaks": 0, "lockedEnvironmentOnly": True}, indent=2))


if __name__ == "__main__":
    main()

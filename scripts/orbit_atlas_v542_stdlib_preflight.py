from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import platform
import socket
import stat
import sys
import zipfile
import zlib
from io import BytesIO
from pathlib import Path, PurePosixPath
from typing import Any


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
OUTER_MEMBERS = {
    "README.md",
    "environment/environment.json",
    "environment/runtime-lock.txt",
    "manifest-sha256.txt",
    "payload/orbit-atlas-kerr-response-aware-v539.zip",
    "receipts/v540-replay-receipt.json",
    "validator/validate_replay_kit.py",
}
OUTER_MANIFEST_MEMBERS = OUTER_MEMBERS - {"manifest-sha256.txt"}
CRATE_MEMBERS = {
    "README.md",
    "data/column-schema.csv",
    "data/response-aware-sparse-table.fits",
    "manifest-sha256.txt",
    "metadata/v537-fits-atlas.json",
    "metadata/v538-column-schema-atlas.json",
    "metadata/v538-evidence.json",
    "metadata/v538-pointer.json",
    "ro-crate-metadata.json",
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


def byte_sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def safe_name(name: str) -> bool:
    path = PurePosixPath(name)
    return bool(name) and not path.is_absolute() and ".." not in path.parts and "\\" not in name and not name.startswith("/")


def read_manifest(value: bytes) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in value.decode("ascii").splitlines():
        digest, name = line.split("  ", 1)
        if name in result or not safe_name(name) or len(digest) != 64 or any(character not in "0123456789abcdef" for character in digest):
            raise RuntimeError("v542-manifest-shape")
        result[name] = digest
    return result


def inspect_archive(payload: bytes, expected: set[str], label: str) -> tuple[dict[str, bytes], dict[str, int]]:
    with zipfile.ZipFile(BytesIO(payload), "r") as archive:
        infos = archive.infolist()
        names = [entry.filename for entry in infos]
        if set(names) != expected or len(names) != len(expected) or names != sorted(names) or archive.testzip() is not None:
            raise RuntimeError(f"v542-{label}-layout")
        counters = {"pathTraversalCount": 0, "symlinkCount": 0, "duplicateNameCount": len(names) - len(set(names)), "encryptedMemberCount": 0}
        members: dict[str, bytes] = {}
        for entry in infos:
            if not safe_name(entry.filename):
                counters["pathTraversalCount"] += 1
            if stat.S_IFMT(entry.external_attr >> 16) == stat.S_IFLNK:
                counters["symlinkCount"] += 1
            if entry.flag_bits & 0x1:
                counters["encryptedMemberCount"] += 1
            if entry.file_size <= 0 or entry.file_size > 1024 * 1024 or entry.compress_size > 1024 * 1024:
                raise RuntimeError(f"v542-{label}-member-size")
            members[entry.filename] = archive.read(entry.filename)
        if any(counters.values()):
            raise RuntimeError(f"v542-{label}-member-safety")
        return members, counters


def installed_distribution(name: str) -> str:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return "unavailable"


def compatibility_matrix(required: dict[str, str], observed: dict[str, str]) -> list[dict[str, Any]]:
    exact = all(observed[key] == value for key, value in required.items())
    return [
        {
            "id": "observed-current-environment",
            "osFamily": observed["osFamily"],
            "runtimeRelation": "exact-locked-dependency-tuple" if exact else "dependency-mismatch",
            "stdlibPreflight": "qualified" if exact else "qualified-package-only-environment-mismatch",
            "scienceReplay": "qualified-v541-current-environment-only" if exact else "unqualified-environment-mismatch",
            "executed": True,
        },
        {
            "id": "same-dependencies-other-os",
            "osFamily": "other-than-observed",
            "runtimeRelation": "same-dependencies-unobserved-platform",
            "stdlibPreflight": "not-run",
            "scienceReplay": "unqualified-not-tested",
            "executed": False,
        },
        {
            "id": "different-python",
            "osFamily": "any",
            "runtimeRelation": "python-version-mismatch",
            "stdlibPreflight": "not-run",
            "scienceReplay": "unqualified-exact-lock-mismatch",
            "executed": False,
        },
        {
            "id": "different-science-dependencies",
            "osFamily": "any",
            "runtimeRelation": "numpy-or-astropy-version-mismatch",
            "stdlibPreflight": "not-run",
            "scienceReplay": "unqualified-exact-lock-mismatch",
            "executed": False,
        },
    ]


def preflight(kit_path: Path, validation_path: Path, validator_path: Path) -> dict[str, Any]:
    if kit_path.is_absolute() or validation_path.is_absolute() or validator_path.is_absolute():
        raise RuntimeError("v542-relative-paths-required")
    kit_bytes = kit_path.read_bytes()
    if not kit_bytes or len(kit_bytes) > 1024 * 1024:
        raise RuntimeError("v542-kit-size")
    outer, outer_safety = inspect_archive(kit_bytes, OUTER_MEMBERS, "kit")
    manifest = read_manifest(outer["manifest-sha256.txt"])
    if set(manifest) != OUTER_MANIFEST_MEMBERS or any(byte_sha(outer[name]) != digest for name, digest in manifest.items()):
        raise RuntimeError("v542-kit-manifest")

    environment = json.loads(outer["environment/environment.json"])
    if environment.get("version") != "v541-replay-kit-environment-lock-v1" or environment.get("strictExactVersions") is not True or canonical_sha(environment) != environment.get("environmentSha256"):
        raise RuntimeError("v542-environment")
    if byte_sha(outer["environment/runtime-lock.txt"]) != environment.get("runtimeLockFileSha256") or byte_sha(outer["validator/validate_replay_kit.py"]) != environment.get("validatorFileSha256"):
        raise RuntimeError("v542-environment-member-sha")

    crate, crate_safety = inspect_archive(outer["payload/orbit-atlas-kerr-response-aware-v539.zip"], CRATE_MEMBERS, "crate")
    crate_manifest = read_manifest(crate["manifest-sha256.txt"])
    if len(crate_manifest) != 8 or any(name not in crate or byte_sha(crate[name]) != digest for name, digest in crate_manifest.items()):
        raise RuntimeError("v542-crate-manifest")

    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    if validation.get("version") != "v541-standalone-replay-kit-validation-result-v1" or validation.get("status") != "standalone-replay-kit-qualified" or canonical_sha(validation) != validation.get("resultSha256"):
        raise RuntimeError("v542-v541-validation")
    if validation.get("environmentSha256") != environment["environmentSha256"] or validation.get("crateFileSha256") != byte_sha(outer["payload/orbit-atlas-kerr-response-aware-v539.zip"]):
        raise RuntimeError("v542-v541-link")

    runtime = environment["runtime"]
    required = {
        "pythonImplementation": runtime["pythonImplementation"],
        "pythonVersion": runtime["pythonVersion"],
        "numpyVersion": runtime["numpyVersion"],
        "astropyVersion": runtime["astropyVersion"],
        "zlibVersion": runtime["zlibVersion"],
    }
    observed = {
        "pythonImplementation": sys.implementation.name,
        "pythonVersion": platform.python_version(),
        "numpyVersion": installed_distribution("numpy"),
        "astropyVersion": installed_distribution("astropy"),
        "zlibVersion": zlib.ZLIB_VERSION,
        "osFamily": platform.system().lower(),
        "osRelease": platform.release(),
        "machine": platform.machine().lower(),
    }
    exact = all(observed[key] == value for key, value in required.items())
    if "numpy" in sys.modules or "astropy" in sys.modules:
        raise RuntimeError("v542-science-dependency-imported")

    matrix = compatibility_matrix(required, observed)
    unsigned = {
        "version": "v542-stdlib-preflight-receipt-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "package-integrity-qualified-science-replay-still-requires-locked-dependencies",
        "source": {
            "v541KitFileSha256": byte_sha(kit_bytes),
            "v541EnvironmentSha256": environment["environmentSha256"],
            "v541ValidationResultSha256": validation["resultSha256"],
            "preflightValidatorFileSha256": byte_sha(validator_path.read_bytes()),
        },
        "requiredRuntime": required,
        "observedRuntime": observed,
        "checks": {
            "kitMemberCount": len(outer),
            "kitManifestReplayCount": len(manifest),
            "crateMemberCount": len(crate),
            "crateManifestReplayCount": len(crate_manifest),
            "pathTraversalCount": outer_safety["pathTraversalCount"] + crate_safety["pathTraversalCount"],
            "symlinkCount": outer_safety["symlinkCount"] + crate_safety["symlinkCount"],
            "duplicateNameCount": outer_safety["duplicateNameCount"] + crate_safety["duplicateNameCount"],
            "encryptedMemberCount": outer_safety["encryptedMemberCount"] + crate_safety["encryptedMemberCount"],
            "networkAttemptCount": 0,
            "workspaceImportCount": 0,
            "numpyImported": False,
            "astropyImported": False,
            "exactDependencyTupleMatch": exact,
        },
        "compatibility": {
            "matrix": matrix,
            "observedEnvironmentPreflightQualified": True,
            "observedEnvironmentReadyForLockedScienceReplay": exact,
            "lockedTupleScienceReplayQualifiedByV541": True,
            "preflightIssuesScienceQualification": False,
            "crossEnvironmentQualified": False,
        },
        "qualification": {
            "stdlibPackagePreflightQualified": True,
            "exactDependencyTupleDetected": exact,
            "scientificReplayQualifiedByThisPreflight": False,
            "crossEnvironmentQualified": False,
            "scienceImageQualified": False,
            "productionPromotionQualified": False,
        },
        "boundary": {
            "scienceDependenciesImported": False,
            "fitsSemanticValidationPerformed": False,
            "scienceReplayExecuted": False,
            "denseCampaignStatus": "incomplete-0-of-49",
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
    }
    return {**unsigned, "preflightSha256": canonical_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kit", required=True)
    parser.add_argument("--validation-receipt", required=True)
    parser.add_argument("--validator", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    paths = [Path(args.kit), Path(args.validation_receipt), Path(args.validator), Path(args.output)]
    if any(path.is_absolute() for path in paths):
        raise RuntimeError("v542-relative-paths-required")

    network_attempt_count = 0
    original_connect = socket.socket.connect
    original_create_connection = socket.create_connection

    def blocked_connect(*_args: Any, **_kwargs: Any) -> Any:
        nonlocal network_attempt_count
        network_attempt_count += 1
        raise RuntimeError("v542-network-forbidden")

    socket.socket.connect = blocked_connect  # type: ignore[method-assign]
    socket.create_connection = blocked_connect  # type: ignore[assignment]
    try:
        result = preflight(paths[0], paths[1], paths[2])
    finally:
        socket.socket.connect = original_connect  # type: ignore[method-assign]
        socket.create_connection = original_create_connection  # type: ignore[assignment]
    if network_attempt_count:
        raise RuntimeError("v542-network-attempt")
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")


if __name__ == "__main__":
    main()

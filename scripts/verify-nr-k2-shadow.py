"""Verify deterministic checkpoint/restart behavior of the NR-K2 shadow binary.

This is a local shadow-backend check.  It does not promote scientific payloads
or modify the web/runtime state.  The caller supplies an already-built binary;
the script intentionally does not download toolchains or rebuild it.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile


def _run(binary: Path, args: list[str]) -> str:
    completed = subprocess.run(
        [str(binary), *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    binary = args.binary.resolve()
    if not binary.is_file():
        raise SystemExit(f"binary does not exist: {binary}")

    with tempfile.TemporaryDirectory(prefix="nr-k2-verify-") as temporary:
        root = args.output.resolve() if args.output else Path(temporary)
        root.mkdir(parents=True, exist_ok=True)
        common = [
            "--points", "32", "--threads", "4", "--scenario", "homogeneous-trace-k",
            "--initial-trace-k", "0.1", "--dt", "0.001",
        ]
        _run(binary, [*common, "--steps", "8", "--threads", "1",
                      "--manifest", str(root / "direct.json"),
                      "--checkpoint", str(root / "direct.bin")])
        _run(binary, [*common, "--steps", "4",
                      "--manifest", str(root / "part.json"),
                      "--checkpoint", str(root / "part.bin")])
        _run(binary, [*common, "--steps", "4", "--restart", str(root / "part.bin"),
                      "--manifest", str(root / "restart.json"),
                      "--checkpoint", str(root / "restart.bin")])

        direct_manifest = json.loads((root / "direct.json").read_text(encoding="utf-8"))
        restart_manifest = json.loads((root / "restart.json").read_text(encoding="utf-8"))
        if direct_manifest != restart_manifest:
            raise SystemExit("direct and restarted manifests differ")
        direct_hash = _sha256(root / "direct.bin")
        restart_hash = _sha256(root / "restart.bin")
        if direct_hash != restart_hash:
            raise SystemExit("direct and restarted checkpoints differ")
        if direct_manifest["schema_version"] != "nr-run-manifest-v1":
            raise SystemExit("manifest schema is not aligned with nr-run-manifest-v1")
        if direct_manifest["diagnostics"]["variable_count"] != 25:
            raise SystemExit("state variable count is not the 25-slot contract")
        if direct_manifest["diagnostics"]["scenario"] != "homogeneous-trace-k":
            raise SystemExit("the deterministic baseline scenario changed unexpectedly")
        mismatch = subprocess.run(
            [
                str(binary),
                "--points", "32", "--threads", "1", "--scenario", "bssn-wave",
                "--steps", "1", "--dt", "0.001", "--restart", str(root / "part.bin"),
                "--manifest", str(root / "mismatch.json"),
                "--checkpoint", str(root / "mismatch.bin"),
            ],
            capture_output=True,
            text=True,
        )
        if mismatch.returncode == 0 or "restart scenario" not in mismatch.stderr:
            raise SystemExit("scenario-mismatched restart was not rejected")
        print(json.dumps({
            "checkpoint_sha256": direct_hash,
            "manifest_equal": True,
            "mismatched_restart_rejected": True,
            "schema_version": direct_manifest["schema_version"],
            "kernel_id": direct_manifest["kernel_id"],
            "promotion": direct_manifest["promotion"],
        }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

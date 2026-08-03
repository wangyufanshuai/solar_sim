"""Explicit, single-attempt IXPE acquisition command.

The command is intentionally opt-in.  Without ``--execute-network`` it only
prints the validated acquisition plan.  It never retries, substitutes a
target, or writes expected/synthetic counts.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

DEFAULT_TARGET = "Cyg X-1"
ALLOWED_HOST = "heasarc.gsfc.nasa.gov"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_child(root: Path, relative: str) -> Path:
    if not relative or os.path.isabs(relative) or ".." in Path(relative).parts:
        raise ValueError(f"path-traversal:{relative}")
    root = root.resolve()
    child = (root / relative).resolve()
    if root not in child.parents:
        raise ValueError(f"path-traversal:{relative}")
    return child


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    partial = path.with_name(f"{path.name}.{os.getpid()}.part")
    with partial.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(partial, path)


def load_manifest(path: Path) -> tuple[str, list[dict[str, Any]]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if value.get("target") != DEFAULT_TARGET:
        raise ValueError("target-not-approved")
    urls = value.get("urls")
    if not isinstance(urls, list) or not urls:
        raise ValueError("urls-required")
    normalized: list[dict[str, Any]] = []
    for entry in urls:
        if not isinstance(entry, dict) or not isinstance(entry.get("url"), str) or not isinstance(entry.get("fileName"), str):
            raise ValueError("url-entry-invalid")
        parsed = urlparse(entry["url"])
        if parsed.scheme != "https" or parsed.hostname != ALLOWED_HOST:
            raise ValueError("url-host-not-allowed")
        safe_child(Path("."), entry["fileName"])
        expected_bytes = entry.get("expectedBytes")
        if expected_bytes is not None and (not isinstance(expected_bytes, int) or expected_bytes <= 0):
            raise ValueError("expected-bytes-invalid")
        normalized.append({
            "url": entry["url"],
            "fileName": entry["fileName"],
            "expectedBytes": expected_bytes,
            "role": entry.get("role"),
            "observationId": entry.get("observationId"),
            "detector": entry.get("detector"),
        })
    return str(value["target"]), normalized


def main() -> int:
    parser = argparse.ArgumentParser(prog="acquire-ixpe-public-data-v562")
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--execute-network", action="store_true", help="perform the explicitly listed HTTPS requests once")
    args = parser.parse_args()
    try:
        target, entries = load_manifest(args.manifest)
        plan = {"version": "v562-ixpe-acquisition-plan-v1", "target": target, "urlCount": len(entries), "automaticRetry": False, "automaticTargetReplacement": False, "syntheticValuesWritten": False, "networkAttempted": False}
        if not args.execute_network:
            print(json.dumps({**plan, "status": "dry-run-no-network"}, indent=2))
            return 0
        args.output.mkdir(parents=True, exist_ok=True)
        results: list[dict[str, Any]] = []
        for entry_index, entry in enumerate(entries):
            destination = safe_child(args.output, entry["fileName"])
            if destination.exists():
                raise ValueError(f"destination-exists:{entry['fileName']}")
            partial = destination.with_name(f"{destination.name}.part")
            if partial.exists():
                raise ValueError(f"partial-destination-exists:{entry['fileName']}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            # urlopen is called exactly once.  urllib's default redirect is
            # accepted only while the final host remains the archive host.
            try:
                with urllib.request.urlopen(entry["url"], timeout=60) as response, partial.open("xb") as handle:
                    http_status = response.status
                    final_url = response.geturl()
                    final_host = urlparse(final_url).hostname
                    if final_host != ALLOWED_HOST:
                        raise ValueError("redirect-host-not-allowed")
                    while True:
                        chunk = response.read(1024 * 1024)
                        if not chunk:
                            break
                        handle.write(chunk)
                    handle.flush()
                    os.fsync(handle.fileno())
                actual_bytes = partial.stat().st_size
                if entry.get("expectedBytes") is not None and actual_bytes != entry["expectedBytes"]:
                    raise ValueError(f"byte-count-mismatch:{entry['fileName']}:{actual_bytes}:{entry['expectedBytes']}")
                partial.replace(destination)
            except Exception as exc:
                partial.unlink(missing_ok=True)
                blocked = {
                    **plan,
                    "status": "blocked-explicit-single-attempt",
                    "networkAttempted": True,
                    "failedEntryIndex": entry_index,
                    "failedFileName": entry["fileName"],
                    "failure": f"{type(exc).__name__}:{exc}"[:500],
                    "completedFiles": results,
                }
                atomic_json(args.output / "acquisition-receipt.json", blocked)
                print(json.dumps(blocked, indent=2), file=sys.stderr)
                return 2
            results.append({
                "fileName": entry["fileName"],
                "url": entry["url"],
                "finalUrl": final_url,
                "finalHost": final_host,
                "httpStatus": http_status,
                "bytes": destination.stat().st_size,
                "sha256": sha256(destination),
                "role": entry.get("role"),
                "observationId": entry.get("observationId"),
                "detector": entry.get("detector"),
            })
            atomic_json(args.output / "acquisition-progress.json", {
                **plan,
                "status": f"incomplete-{len(results)}-of-{len(entries)}",
                "networkAttempted": True,
                "files": results,
            })
        receipt = {**plan, "status": "download-complete-explicit-single-attempt", "networkAttempted": True, "files": results}
        receipt_path = args.output / "acquisition-receipt.json"
        atomic_json(receipt_path, receipt)
        (args.output / "acquisition-progress.json").unlink(missing_ok=True)
        print(json.dumps(receipt, indent=2))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"acquisition-blocked: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

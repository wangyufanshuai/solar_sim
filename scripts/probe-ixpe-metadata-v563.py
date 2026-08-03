"""Single-pass IXPE archive metadata probe.

Only HEAD metadata requests are allowed. The command never downloads event,
response, attitude or background payloads and never promotes authority.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

TARGET = "Cyg X-1"
VERSION = "v563-ixpe-metadata-probe-v1"
ALLOWED_HOSTS = {"heasarc.gsfc.nasa.gov", "heasarc.nasa.gov"}


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def canonical_sha(value: object) -> str:
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def load_manifest(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if value.get("target") != TARGET:
        raise ValueError("target-not-approved")
    sources = value.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("metadata-sources-required")
    for source in sources:
        if not isinstance(source, dict) or source.get("kind") != "metadata" or not isinstance(source.get("id"), str):
            raise ValueError("metadata-source-schema-invalid")
        parsed = urlparse(str(source.get("url")))
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
            raise ValueError("metadata-host-not-allowed")
    return value


def probe_one(source: dict[str, object]) -> dict[str, object]:
    url = str(source["url"])
    request = urllib.request.Request(url, method="HEAD", headers={"Accept": "application/json, text/plain, */*", "User-Agent": "Orbit-Atlas-v563-metadata-probe/1"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            final_host = urlparse(response.geturl()).hostname
            if final_host not in ALLOWED_HOSTS:
                return {"id": source["id"], "url": url, "status": "blocked-redirect-host", "httpStatus": response.status, "finalUrl": response.geturl(), "payloadRead": False}
            headers = {key.lower(): value for key, value in response.headers.items()}
            return {"id": source["id"], "url": url, "status": "metadata-ready" if response.status < 400 else "metadata-unavailable", "httpStatus": response.status, "finalUrl": response.geturl(), "contentLength": headers.get("content-length"), "etag": headers.get("etag"), "lastModified": headers.get("last-modified"), "contentType": headers.get("content-type"), "payloadRead": False}
    except urllib.error.HTTPError as error:
        return {"id": source["id"], "url": url, "status": "metadata-unavailable", "httpStatus": error.code, "finalUrl": error.geturl(), "payloadRead": False}
    except (OSError, urllib.error.URLError) as error:
        return {"id": source["id"], "url": url, "status": "metadata-request-failed", "error": str(error), "payloadRead": False}


def main() -> int:
    parser = argparse.ArgumentParser(prog="probe-ixpe-metadata-v563")
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--execute-network", action="store_true")
    args = parser.parse_args()
    try:
        manifest = load_manifest(args.manifest)
        base = {"version": VERSION, "target": TARGET, "sourceManifestSha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(), "networkAttempted": False, "payloadRead": False, "automaticRetry": False, "automaticTargetReplacement": False, "measuredAuthorityGranted": False}
        if not args.execute_network:
            result = {**base, "status": "dry-run-no-network", "sources": []}
        else:
            observations = [probe_one(source) for source in manifest["sources"]]
            identity_conflict = len({(item.get("status"), item.get("contentLength"), item.get("lastModified")) for item in observations}) > 1 and len(observations) > 1
            result = {**base, "status": "blocked-metadata-identity-conflict" if identity_conflict else "metadata-probe-complete", "sources": observations, "networkAttempted": True, "mirrorIdentityConflict": identity_conflict}
        args.output.mkdir(parents=True, exist_ok=True)
        partial = args.output / "metadata-probe.json.part"
        partial.write_text(json.dumps({**result, "artifactSha256": canonical_sha(result)}, indent=2) + "\n", encoding="utf-8")
        partial.replace(args.output / "metadata-probe.json")
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"metadata-probe-blocked: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

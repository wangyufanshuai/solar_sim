#!/usr/bin/env python3
"""Verify the published v271 aggregate without mutating it."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import astropy_healpix


EXPECTED = {
    "scienceRows": 200_000,
    "skyOrder3Rows": 200_000,
    "skyOrder5Rows": 200_000,
    "motherEligibleRows": 1_066_208,
    "motherGaiaEligibleRows": 1_047_028,
    "motherWithoutGaiaIdRows": 19_180,
    "selectionEligibleRows": 199_957,
    "hrEligibleRows": 159_330,
    "gold": 30_028,
    "silver": 169_972,
    "limited": 0,
    "astrophysicalOverlapRows": 51_145,
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical_sha(manifest: dict[str, object]) -> str:
    value = {key: entry for key, entry in manifest.items() if key not in {"generatedAt", "manifestSha256"}}
    return sha256_bytes(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8"))


def scalar(database: sqlite3.Connection, query: str, params: tuple[object, ...] = ()) -> int:
    row = database.execute(query, params).fetchone()
    return 0 if row is None or row[0] is None else int(row[0])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=Path("dist/gaia-research-v271/gaia-research-v271.manifest.json"))
    parser.add_argument("--part", type=Path, default=Path("dist/gaia-research-v271/gaia-research-v271.sqlite.part"))
    parser.add_argument("--output", type=Path, default=Path("dist/science/gaia-research-v271-closure-validation.json"))
    args = parser.parse_args()
    manifest_path = args.manifest.resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest["version"] != "v271-gaia-research-aggregate-v2":
        raise RuntimeError("v271 manifest version drifted")
    if canonical_sha(manifest) != manifest["manifestSha256"]:
        raise RuntimeError("v271 canonical manifest SHA mismatch")
    if astropy_healpix.__version__ != "1.1.2":
        raise RuntimeError("astropy-healpix version drifted")
    for source in (manifest["scienceSource"], manifest["motherCatalog"], manifest["aggregate"]):
        path = Path(source["path"])
        if path.stat().st_size != source["bytes"] or sha256_file(path) != source["sha256"]:
            raise RuntimeError(f"v271 source mismatch: {path.name}")
    if manifest["counts"] != EXPECTED:
        raise RuntimeError("v271 manifest conservation drifted")

    aggregate_path = Path(manifest["aggregate"]["path"])
    database = sqlite3.connect(f"file:{aggregate_path.as_posix()}?mode=ro", uri=True)
    try:
        integrity = database.execute("PRAGMA integrity_check").fetchone()[0]
        counts = {
            "scienceRows": scalar(database, "SELECT SUM(count) FROM quality_summary"),
            "skyOrder3Rows": scalar(database, "SELECT SUM(count) FROM sky_density WHERE order_n=3"),
            "skyOrder5Rows": scalar(database, "SELECT SUM(count) FROM sky_density WHERE order_n=5"),
            "motherEligibleRows": scalar(database, "SELECT SUM(count) FROM mother_cube WHERE population=0"),
            "motherGaiaEligibleRows": scalar(database, "SELECT SUM(count) FROM mother_cube WHERE population=1"),
            "selectionEligibleRows": scalar(database, "SELECT SUM(count) FROM selected_cube"),
            "hrEligibleRows": scalar(database, "SELECT SUM(count) FROM hr_density WHERE variant=0"),
            "gold": scalar(database, "SELECT count FROM quality_summary WHERE quality=0"),
            "silver": scalar(database, "SELECT count FROM quality_summary WHERE quality=1"),
            "limited": scalar(database, "SELECT count FROM quality_summary WHERE quality=2"),
            "astrophysicalOverlapRows": scalar(database, "SELECT count FROM overlap_summary WHERE metric='science-astrophysical-parameter-row'"),
        }
        counts["motherWithoutGaiaIdRows"] = counts["motherEligibleRows"] - counts["motherGaiaEligibleRows"]
        table_counts = {
            row[0]: scalar(database, f'SELECT COUNT(*) FROM "{row[0]}"')
            for row in database.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        }
        metadata = {key: json.loads(value) for key, value in database.execute("SELECT key,value FROM metadata ORDER BY key")}
    finally:
        database.close()
    if integrity != "ok" or counts != EXPECTED or metadata.get("counts") != EXPECTED:
        raise RuntimeError("v271 aggregate integrity or conservation failed")

    part_path = args.part.resolve()
    part = sqlite3.connect(f"file:{part_path.as_posix()}?mode=ro", uri=True)
    try:
        checkpoint = [list(row) for row in part.execute("SELECT phase,last_key,processed_rows,eligible_rows FROM build_checkpoint ORDER BY phase")]
        identity = {key: json.loads(value) for key, value in part.execute("SELECT key,value FROM build_identity ORDER BY key")}
        part_integrity = part.execute("PRAGMA integrity_check").fetchone()[0]
    finally:
        part.close()
    if part_integrity != "ok" or checkpoint != [["mother", 1_224_219, 1_224_219, 1_066_208], ["selected", 6_917_291_773_648_776_704, 200_000, 199_957]]:
        raise RuntimeError("v271 checkpoint recovery identity failed")
    if identity.get("astropyHealpix") != "1.1.2" or identity.get("chunkSize") != 10_000:
        raise RuntimeError("v271 checkpoint dependency identity drifted")

    result = {
        "version": "v271-gaia-research-closure-validation-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": "passed-v271-generated-integrity",
        "manifest": {
            "path": args.manifest.as_posix(),
            "fileSha256": sha256_file(manifest_path),
            "canonicalSha256": manifest["manifestSha256"],
        },
        "aggregate": {
            "path": manifest["aggregate"]["path"],
            "bytes": manifest["aggregate"]["bytes"],
            "sha256": manifest["aggregate"]["sha256"],
            "contentAddressed": aggregate_path.stem.endswith(manifest["aggregate"]["sha256"]),
            "integrity": integrity,
            "tableRowCounts": table_counts,
        },
        "inputs": {
            "scienceSha256": manifest["scienceSource"]["sha256"],
            "motherSha256": manifest["motherCatalog"]["sha256"],
            "astropyHealpix": astropy_healpix.__version__,
        },
        "checkpoint": {
            "path": args.part.as_posix(),
            "bytes": part_path.stat().st_size,
            "sha256": sha256_file(part_path),
            "integrity": part_integrity,
            "identity": identity,
            "rows": checkpoint,
            "resumeApplied": True,
        },
        "counts": counts,
        "gaiaSurveyCompleteness": "unavailable",
        "readOnlyVerification": True,
    }
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".part")
    temporary.write_text(payload, encoding="utf-8", newline="\n")
    os.replace(temporary, output)
    print(payload, end="")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Deterministic unit fixtures for the resumable v271 aggregate builder."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "orbit_atlas_gaia_research_v271",
    ROOT / "scripts/build-gaia-research-v271.py",
)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to load v271 builder")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def test_scalar_missing_group_is_zero() -> None:
    database = sqlite3.connect(":memory:")
    database.execute("CREATE TABLE counts(tier INTEGER PRIMARY KEY,count INTEGER NOT NULL)")
    database.execute("INSERT INTO counts VALUES(0,7)")
    assert BUILDER.scalar(database, "SELECT count FROM counts WHERE tier=?", (2,)) == 0
    assert BUILDER.scalar(database, "SELECT SUM(count) FROM counts WHERE tier=?", (2,)) == 0
    assert BUILDER.scalar(database, "SELECT count FROM counts WHERE tier=?", (0,)) == 7
    database.close()


def test_overlap_reconciliation_ignores_plot_bounds_and_resumes() -> None:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v271-test-") as temporary:
        root = Path(temporary)
        science_path = root / "science.sqlite"
        mother_path = root / "mother.sqlite"
        aggregate = sqlite3.connect(root / "aggregate.sqlite")
        science = sqlite3.connect(science_path)
        mother = sqlite3.connect(mother_path)
        science.execute("CREATE TABLE gaia_science(source_id INTEGER PRIMARY KEY)")
        science.executemany("INSERT INTO gaia_science VALUES(?)", [(1,), (2,), (3,), (4,)])
        mother.execute("CREATE TABLE stellar_astrophysical_parameters(source_id INTEGER PRIMARY KEY,extinction_mag REAL)")
        mother.executemany("INSERT INTO stellar_astrophysical_parameters VALUES(?,?)", [(1, 0.1), (3, None), (4, 0.2)])
        aggregate.execute("CREATE TABLE overlap_summary(metric TEXT PRIMARY KEY,count INTEGER NOT NULL)")
        aggregate.execute("INSERT INTO overlap_summary VALUES('science-astrophysical-parameter-row',1)")
        science.commit()
        mother.commit()
        science.close()
        mother.close()

        total = BUILDER.reconcile_astrophysical_overlap_summary(
            aggregate,
            science_path,
            mother_path,
            chunk_size=2,
        )
        assert total == 3
        assert aggregate.execute(
            "SELECT count FROM overlap_summary WHERE metric='science-astrophysical-parameter-row'"
        ).fetchone() == (3,)
        aggregate.close()


def verify_real_part_on_temporary_copy() -> dict[str, object]:
    part = ROOT / "dist/gaia-research-v271/gaia-research-v271.sqlite.part"
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v271-recovery-dry-run-") as temporary:
        candidate = Path(temporary) / "candidate.sqlite"
        shutil.copy2(part, candidate)
        database = sqlite3.connect(candidate)
        try:
            overlap = BUILDER.reconcile_astrophysical_overlap_summary(
                database,
                ROOT / "dist/gaia-science-v8/gaia-science-v8.sqlite",
                ROOT / "dist/catalog-v7/catalog-v7.sqlite",
                chunk_size=10_000,
            )
            counts = BUILDER.validate(database)
            integrity = database.execute("PRAGMA integrity_check").fetchone()[0]
        finally:
            database.close()
    return {
        "version": "v271-recovery-temporary-copy-diagnostic-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": "passed-recovery-diagnostic-only",
        "diagnosticOnly": True,
        "formalAttemptConsumed": False,
        "publishCalled": False,
        "sourcePart": {
            "path": "dist/gaia-research-v271/gaia-research-v271.sqlite.part",
            "bytes": part.stat().st_size,
            "sha256": sha256(part),
        },
        "reconciledOverlapRows": overlap,
        "counts": counts,
        "integrity": integrity,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--real-part", action="store_true")
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()
    test_scalar_missing_group_is_zero()
    test_overlap_reconciliation_ignores_plot_bounds_and_resumes()
    if not args.real_part:
        print("v271 recovery fixtures passed: zero-group scalar and checkpoint-safe overlap reconciliation")
        return
    result = verify_real_part_on_temporary_copy()
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_output is not None:
        output = args.json_output.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".part")
        temporary.write_text(payload, encoding="utf-8", newline="\n")
        os.replace(temporary, output)
    print(payload, end="")


if __name__ == "__main__":
    main()

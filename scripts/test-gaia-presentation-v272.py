#!/usr/bin/env python3
"""Deterministic low-memory fetch and external-sort fixtures for Gaia v272."""

from __future__ import annotations

import csv
import importlib.util
import json
import sqlite3
import tempfile
from pathlib import Path
from unittest.mock import patch

import numpy as np

from gaia_presentation_external_sort_v272 import SOURCE_DTYPE, create_sorted_work, write_source_index


def load_fetcher():
    path = Path(__file__).with_name("fetch-gaia-presentation-v272.py")
    spec = importlib.util.spec_from_file_location("orbit_atlas_gaia_v272_fetch", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load v272 fetcher")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_fixture_csv(path: Path, rows: list[tuple[object, ...]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(("random_index", "source_id", "ra", "dec", "phot_g_mean_mag", "bp_rp", "parallax"))
        writer.writerows(rows)


class RecordingConnection:
    def __init__(self) -> None:
        self.batch_sizes: list[int] = []

    def executemany(self, _query: str, rows: list[tuple[int, int, int]]) -> None:
        self.batch_sizes.append(len(rows))


def test_low_memory_fetch_contract(root: Path) -> None:
    fetcher = load_fetcher()
    with (
        patch.object(fetcher, "free_physical_memory", return_value=5 * 1024**3),
        patch.object(fetcher.shutil, "disk_usage", return_value=type("Usage", (), {"free": 31 * 1024**3})()),
        patch.object(fetcher, "project_runtime_residuals", return_value=[]),
        patch.object(fetcher, "network_preflight", return_value={"tapStatus": 200}) as network,
    ):
        try:
            fetcher.resource_preflight(root, 1, 6)
        except RuntimeError as error:
            if "resource-preflight-memory" not in str(error):
                raise
        else:
            raise RuntimeError("Default 6 GiB policy did not fail closed")
        if network.called:
            raise RuntimeError("Blocked memory preflight touched the network")
        passed = fetcher.resource_preflight(root, 1, 3)
        if not passed["lowMemoryOverrideApplied"] or passed["requiredDiskBytes"] != 30 * 1024**3:
            raise RuntimeError("Explicit 3 GiB policy did not preserve the 30 GiB disk gate")
    try:
        fetcher.resource_preflight(root, 1, 2.99)
    except RuntimeError as error:
        if "resource-preflight-policy" not in str(error):
            raise
    else:
        raise RuntimeError("Sub-3 GiB fetch policy was accepted")


def test_batched_validation_and_rollback(root: Path) -> None:
    fetcher = load_fetcher()
    fixture = root / "batch.csv"
    rows = [(index, 100_000 + index, 10.0, -20.0, 12.0, "", "") for index in range(10_001)]
    write_fixture_csv(fixture, rows)
    recorder = RecordingConnection()
    counts = fetcher.validate_shard(fixture, 0, 0, 100_000, set(), recorder)
    if recorder.batch_sizes != [5_000, 5_000, 1] or counts["validRows"] != 10_001:
        raise RuntimeError(f"v272 validation batching drifted: {recorder.batch_sizes}")

    rollback_root = root / "rollback"
    rollback_root.mkdir()
    database = fetcher.progress_database(rollback_root)
    duplicate = root / "duplicate.csv"
    write_fixture_csv(duplicate, [(0, 42, 10, 0, 12, "", ""), (1, 42, 11, 1, 13, "", "")])
    database.execute("BEGIN IMMEDIATE")
    try:
        fetcher.validate_shard(duplicate, 0, 0, 100_000, set(), database)
    except RuntimeError as error:
        database.rollback()
        if "not unique" not in str(error):
            raise
    else:
        raise RuntimeError("Duplicate source ID did not fail closed")
    if database.execute("SELECT COUNT(*) FROM candidates").fetchone()[0] != 0:
        raise RuntimeError("Failed v272 validation leaked a transaction")
    database.close()


def test_atomic_publication(root: Path) -> None:
    fetcher = load_fetcher()
    checkpoint = root / "publish"
    checkpoint.mkdir()
    partial = checkpoint / "gaia-v9-000.fixture.csv.part"
    write_fixture_csv(partial, [(0, 88, 10, -10, 11, "", "")])
    metadata = {
        "version": fetcher.VERSION,
        "shard": 0,
        "endpoint": fetcher.ENDPOINT,
        "query": fetcher.shard_query(0, 100_000),
        "randomIndexRange": [0, 100_000],
        "bytes": partial.stat().st_size,
        "sha256": fetcher.sha256_file(partial),
        "startedAt": "2026-01-01T00:00:00Z",
        "completedAt": "2026-01-01T00:00:01Z",
        "automaticRetryApplied": False,
    }
    policy = {
        "defaultMinimumFreeMemoryGiB": 6,
        "requestedMinimumFreeMemoryGiB": 3,
        "minimumAllowedMemoryGiB": 3,
        "overrideApplied": True,
        "authorization": "user-authorized-3-gib-fetch-only",
        "buildThresholdUnchangedGiB": 6,
    }
    database = fetcher.progress_database(checkpoint)
    database.execute("BEGIN IMMEDIATE")
    counts = fetcher.validate_shard(partial, 0, 0, 100_000, set(), database)
    destination = fetcher.publish_validated_shard(checkpoint, partial, metadata, counts, database, policy)
    database.commit()
    sidecar = json.loads((checkpoint / "gaia-v9-000.json").read_text(encoding="utf-8"))
    if not destination.is_file() or not (checkpoint / "gaia-v9-000.adql").is_file():
        raise RuntimeError("v272 atomic publication omitted an artifact")
    if sidecar["validationBatchRows"] != 5_000 or sidecar["lowMemoryPolicy"] != policy:
        raise RuntimeError("v272 sidecar omitted low-memory provenance")
    if database.execute("SELECT COUNT(*) FROM candidates").fetchone()[0] != 1:
        raise RuntimeError("v272 progress commit did not conserve candidates")
    database.close()


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v272-sort-") as temporary:
        root = Path(temporary)
        test_low_memory_fetch_contract(root)
        test_batched_validation_and_rollback(root)
        test_atomic_publication(root)
        database = sqlite3.connect(root / "fixture.sqlite")
        database.execute("CREATE TABLE rows(random_index INTEGER NOT NULL,source_id INTEGER PRIMARY KEY,ra REAL NOT NULL,dec REAL NOT NULL,g REAL NOT NULL,color REAL,parallax REAL)")
        rows = [
            (index, 10_000 + index, (index * 137.17) % 360, -80 + (index * 17.3) % 160, 4 + (index % 190) / 10, None if index % 7 == 0 else -0.5 + (index % 40) / 10, None if index % 11 == 0 else 0.1 + index / 10_000)
            for index in range(2_000)
        ]
        database.executemany("INSERT INTO rows VALUES(?,?,?,?,?,?,?)", reversed(rows))
        database.commit()
        sorted_rows = create_sorted_work(database, root, len(rows))
        order = np.lexsort((sorted_rows["source_id"], sorted_rows["g_quant"], sorted_rows["cell"]))
        if not np.array_equal(order, np.arange(len(rows))):
            raise RuntimeError("v272 spatial fixture is not ordered")
        source = write_source_index(root, sorted_rows)
        source_rows = np.fromfile(source["data"], dtype=SOURCE_DTYPE)
        if len(source_rows) != len(rows) or np.any(source_rows[1:]["source_id"] <= source_rows[:-1]["source_id"]):
            raise RuntimeError("v272 source fixture is not unique and ordered")
        if set(source_rows["source_id"].tolist()) != {row[1] for row in rows}:
            raise RuntimeError("v272 source fixture failed conservation")
        sorted_rows._mmap.close()
        database.close()
    print("v272 low-memory fetch + external-sort fixtures passed: batch=5000 sort=2000/2000")


if __name__ == "__main__":
    main()

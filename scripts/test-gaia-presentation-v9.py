#!/usr/bin/env python3
"""Small deterministic reconstruction test for the v265 10m builder."""

from __future__ import annotations

import csv
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="atlas-gaia-v265-") as temporary:
        root = Path(temporary)
        checkpoint = root / "checkpoint"
        checkpoint.mkdir()
        csv_path = checkpoint / "gaia-v9-000.csv"
        fields = ["random_index", "source_id", "ra", "dec", "phot_g_mean_mag", "bp_rp", "parallax"]
        with csv_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            for index in range(256):
                writer.writerow({
                    "random_index": index,
                    "source_id": 8_000_000_000_000_000_000 + index,
                    "ra": (index * 137.50776405) % 360,
                    "dec": -80 + (index % 161),
                    "phot_g_mean_mag": 6 + (index % 120) / 10,
                    "bp_rp": "" if index % 7 == 0 else -0.5 + (index % 40) / 10,
                    "parallax": "" if index % 11 == 0 else 0.1 + index / 100,
                })
        query = (
            "SELECT random_index,source_id,ra,dec,phot_g_mean_mag,bp_rp,parallax "
            "FROM gaiadr3.gaia_source WHERE random_index >= 0 AND random_index < 100000 "
            "ORDER BY random_index,source_id"
        )
        sidecar = {
            "version": "v265-gaia-dr3-presentation-shards-v9",
            "shard": 0,
            "query": query,
            "randomIndexRange": [0, 100_000],
            "rowCount": 256,
            "sha256": sha256(csv_path),
        }
        (checkpoint / "gaia-v9-000.json").write_text(json.dumps(sidecar), encoding="utf-8")
        (checkpoint / "progress.json").write_text(json.dumps({
            "version": "v265-gaia-dr3-presentation-shards-v9",
            "status": "ready-for-build",
            "completedShards": 1,
        }), encoding="utf-8")
        output = root / "output"
        result = subprocess.run([
            sys.executable,
            str(ROOT / "scripts" / "build-gaia-presentation-v9.py"),
            "--checkpoint-root", str(checkpoint),
            "--output", str(output),
            "--target-rows", "256",
            "--no-public",
        ], cwd=ROOT, capture_output=True, text=True, check=False)
        if result.returncode != 0:
            raise RuntimeError(f"v265 fixture builder failed:\n{result.stdout}\n{result.stderr}")
        manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
        expected_sizes = {
            "catalog-v9.bin": 256 * 24,
            "order3.aggregate.bin": 768 * 24,
            "order6.directory.bin": 49_152 * 28,
            "order8.index.bin": 786_432 * 16,
            "source.index.bin": 256 * 16,
            "source.directory.bin": 24,
        }
        for name, expected in expected_sizes.items():
            actual = (output / name).stat().st_size
            if actual != expected:
                raise RuntimeError(f"v265 fixture {name} size changed: {actual} != {expected}")
        if manifest["counts"]["presentation"] != 256 or manifest["counts"]["duplicateSourceIds"] != 0:
            raise RuntimeError("v265 fixture manifest count contract changed")
        print(json.dumps({
            "passed": True,
            "fixtureRows": 256,
            "archiveBytes": expected_sizes["catalog-v9.bin"],
            "manifestSha256": manifest["manifestSha256"],
        }, indent=2))


if __name__ == "__main__":
    main()

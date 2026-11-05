#!/usr/bin/env python3
"""Stream a deterministic one-million-row Gaia DR3 export in restartable shards."""

from __future__ import annotations

import hashlib
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "tools" / "asset-cache" / "gaia-dr3-random-index-1m.csv"
SHARD_ROOT = ROOT / "tools" / "asset-cache" / "gaia-dr3-random-index-1m-shards"
ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync"
SHARD_SIZE = 100_000
SHARD_COUNT = 10
COLUMNS = "source_id,ra,dec,phot_g_mean_mag,bp_rp,parallax,teff_gspphot,logg_gspphot,ruwe"


def row_count(path: Path) -> int:
    with path.open("rb") as handle:
        return sum(1 for _ in handle) - 1


def shard_query(start: int, end: int) -> str:
    return f"SELECT {COLUMNS} FROM gaiadr3.gaia_source WHERE random_index >= {start} AND random_index < {end}"


def download_shard(index: int) -> tuple[Path, str]:
    start = index * SHARD_SIZE
    end = start + SHARD_SIZE
    query = shard_query(start, end)
    destination = SHARD_ROOT / f"gaia-{index:02d}.csv"
    if destination.exists() and row_count(destination) == SHARD_SIZE:
        print(f"shard {index + 1}/{SHARD_COUNT}: cached", flush=True)
        return destination, query
    destination.unlink(missing_ok=True)
    part = destination.with_suffix(".csv.part")
    params = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "MAXREC": str(SHARD_SIZE + 100), "QUERY": query})
    request = urllib.request.Request(f"{ENDPOINT}?{params}", headers={"User-Agent": "SolarAtlasCatalogBuilder/1.0"})
    with urllib.request.urlopen(request, timeout=600) as response, part.open("wb") as output:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            output.write(chunk)
    rows = row_count(part)
    if rows != SHARD_SIZE:
        part.unlink(missing_ok=True)
        raise RuntimeError(f"Gaia shard {index} incomplete: {rows:,}/{SHARD_SIZE:,}")
    part.replace(destination)
    print(f"shard {index + 1}/{SHARD_COUNT}: {rows:,} rows", flush=True)
    return destination, query


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    SHARD_ROOT.mkdir(parents=True, exist_ok=True)
    shards = [download_shard(index) for index in range(SHARD_COUNT)]
    part = OUTPUT.with_suffix(".csv.part")
    digest = hashlib.sha256()
    total = 0
    with part.open("wb") as output:
        for index, (source, _) in enumerate(shards):
            with source.open("rb") as handle:
                if index > 0:
                    handle.readline()
                while True:
                    chunk = handle.read(1024 * 1024)
                    if not chunk:
                        break
                    output.write(chunk)
                    digest.update(chunk)
                    total += len(chunk)
    part.replace(OUTPUT)
    rows = row_count(OUTPUT)
    if rows != SHARD_SIZE * SHARD_COUNT:
        OUTPUT.unlink(missing_ok=True)
        raise RuntimeError(f"Gaia merged export incomplete: {rows:,}")
    manifest = {
        "source": "Gaia DR3 gaiadr3.gaia_source",
        "endpoint": ENDPOINT,
        "queries": [query for _, query in shards],
        "rowCount": rows,
        "bytes": total,
        "sha256": digest.hexdigest(),
        "runtimePolicy": "build-time-only-offline-runtime",
    }
    OUTPUT.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Gaia export rows={rows:,} bytes={total:,} sha256={digest.hexdigest()}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        raise

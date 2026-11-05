#!/usr/bin/env python3
"""Read-only audit of a retained v271 aggregate part file."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def rows(database: sqlite3.Connection, query: str) -> list[list[object]]:
    return [list(row) for row in database.execute(query)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--part", type=Path, default=Path("dist/gaia-research-v271/gaia-research-v271.sqlite.part"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    part = args.part.resolve()
    database = sqlite3.connect(f"file:{part.as_posix()}?mode=ro", uri=True)
    try:
        tables = [row[0] for row in database.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
        audit = {
            "version": "v271-retained-part-read-only-audit-v1",
            "generatedAt": utc_now(),
            "part": {
                "path": args.part.as_posix(),
                "bytes": part.stat().st_size,
                "sha256": sha256(part),
                "integrity": database.execute("PRAGMA integrity_check").fetchone()[0],
            },
            "tables": tables,
            "tableRowCounts": {
                table: database.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
                for table in tables
            },
            "checkpoint": rows(database, "SELECT phase,last_key,processed_rows,eligible_rows FROM build_checkpoint ORDER BY phase"),
            "conservation": {
                "quality": rows(database, "SELECT quality,count FROM quality_summary ORDER BY quality"),
                "sky": rows(database, "SELECT order_n,SUM(count) FROM sky_density GROUP BY order_n ORDER BY order_n"),
                "mother": rows(database, "SELECT population,SUM(count) FROM mother_cube GROUP BY population ORDER BY population"),
                "selected": database.execute("SELECT COALESCE(SUM(count),0) FROM selected_cube").fetchone()[0],
                "hr": rows(database, "SELECT variant,SUM(count) FROM hr_density GROUP BY variant ORDER BY variant"),
                "overlap": rows(database, "SELECT metric,count FROM overlap_summary ORDER BY metric"),
            },
            "readOnly": True,
        }
    finally:
        database.close()
    payload = json.dumps(audit, ensure_ascii=False, indent=2) + "\n"
    if args.output is None:
        print(payload, end="")
        return
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".part")
    temporary.write_text(payload, encoding="utf-8", newline="\n")
    os.replace(temporary, output)


if __name__ == "__main__":
    main()

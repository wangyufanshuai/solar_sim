#!/usr/bin/env python3
"""Build the desktop SQLite/FTS5 stellar catalog with bounded memory usage.

The local v4 shards are always imported. A Gaia CSV or CSV.GZ export supplies the
remaining rows. The strict default refuses to publish fewer than one million
unique focusable objects; --allow-partial is intended only for development tests.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable, Iterator

ROOT = Path(__file__).resolve().parents[1]
V4_ROOT = ROOT / "public" / "data" / "stellar-search-v4"
DEFAULT_OUTPUT = ROOT / "dist" / "catalog-v5" / "catalog-v5.sqlite"
TARGET_ROWS = 1_000_000


def number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if result == result else None


def tier(teff: Any, logg: Any, radius: Any, bp_rp: Any, spectral_type: Any) -> str:
    if number(teff) is not None and number(logg) is not None and number(radius) is not None:
        return "parameter-rich"
    if number(teff) is not None or number(bp_rp) is not None or str(spectral_type or "").strip():
        return "photometric-derived"
    return "catalog-basic"


def iter_v4_documents() -> Iterator[dict[str, Any]]:
    manifest = json.loads((V4_ROOT / "manifest.json").read_text(encoding="utf-8"))
    for shard in manifest["documents"]:
        path = ROOT / "public" / shard["path"].lstrip("/")
        for document in json.loads(path.read_text(encoding="utf-8")):
            yield document


def open_csv(path: Path):
    if path.suffix.lower() == ".gz":
        return gzip.open(path, "rt", encoding="utf-8-sig", newline="")
    return path.open("r", encoding="utf-8-sig", newline="")


def iter_gaia_csv(path: Path) -> Iterator[dict[str, Any]]:
    with open_csv(path) as handle:
        reader = csv.DictReader(line for line in handle if not line.startswith("#"))
        for row in reader:
            source_id = str(row.get("source_id") or row.get("SOURCE_ID") or "").strip()
            ra = number(row.get("ra") or row.get("RA"))
            dec = number(row.get("dec") or row.get("DEC"))
            if not source_id or ra is None or dec is None:
                continue
            yield {
                "sourceId": source_id,
                "catalogKey": f"gaia:{source_id}",
                "gaiaSourceId": source_id,
                "designation": f"Gaia DR3 {source_id}",
                "displayName": f"Gaia DR3 {source_id}",
                "aliases": [source_id, f"Gaia DR3 {source_id}"],
                "raDeg": ra,
                "decDeg": dec,
                "magG": number(row.get("phot_g_mean_mag")),
                "bpRp": number(row.get("bp_rp")),
                "parallaxMas": number(row.get("parallax")),
                "teffK": number(row.get("teff_gspphot") or row.get("teff_gspspec")),
                "logg": number(row.get("logg_gspphot") or row.get("logg_gspspec")),
                "radiusSolar": number(row.get("radius_gspphot")),
                "spectralType": None,
                "source": "gaia-dr3-build-export",
                "provenance": ["Gaia DR3 build-time export"],
            }


SCHEMA = """
PRAGMA page_size=8192;
PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
PRAGMA temp_store=MEMORY;
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE catalog_objects (
  id TEXT PRIMARY KEY,
  object_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  aliases_json TEXT NOT NULL,
  ra_deg REAL NOT NULL,
  dec_deg REAL NOT NULL,
  gaia_source_id INTEGER,
  mag_g REAL,
  bp_rp REAL,
  parallax_mas REAL,
  teff_k REAL,
  logg REAL,
  radius_solar REAL,
  spectral_type TEXT,
  data_tier TEXT NOT NULL,
  exoplanet_system_id TEXT,
  provenance_json TEXT NOT NULL
);
CREATE UNIQUE INDEX catalog_objects_gaia_id ON catalog_objects(gaia_source_id) WHERE gaia_source_id IS NOT NULL;
CREATE INDEX catalog_objects_exoplanet_system ON catalog_objects(exoplanet_system_id) WHERE exoplanet_system_id IS NOT NULL;
CREATE VIRTUAL TABLE catalog_fts USING fts5(search_text, content='', tokenize='unicode61 remove_diacritics 2');
"""


def record(document: dict[str, Any]) -> tuple[tuple[Any, ...], str | None] | None:
    ra = number(document.get("raDeg"))
    dec = number(document.get("decDeg"))
    if ra is None or dec is None:
        return None
    catalog_key = str(document.get("catalogKey") or document.get("sourceId"))
    gaia_only = catalog_key.startswith("gaia:")
    aliases = list(dict.fromkeys(str(value).strip() for value in document.get("aliases", []) if str(value).strip()))
    stored_aliases = [] if gaia_only else aliases
    object_type = "exoplanet-host" if document.get("exoplanetSystemId") else "star"
    display_name = str(document.get("displayName") or document.get("designation") or document.get("sourceId"))
    designation = "" if gaia_only else str(document.get("designation") or document.get("sourceId"))
    gaia_source_id = str(document.get("gaiaSourceId") or "")
    row = (
        catalog_key,
        object_type,
        display_name,
        designation,
        json.dumps(stored_aliases, ensure_ascii=False, separators=(",", ":")),
        ra,
        dec,
        int(gaia_source_id) if gaia_source_id.isdigit() else None,
        number(document.get("magG")),
        number(document.get("bpRp")),
        number(document.get("parallaxMas")),
        number(document.get("teffK")),
        number(document.get("logg")),
        number(document.get("radiusSolar")),
        str(document.get("spectralType") or "") or None,
        tier(document.get("teffK"), document.get("logg"), document.get("radiusSolar"), document.get("bpRp"), document.get("spectralType")),
        str(document.get("exoplanetSystemId") or "") or None,
        "gaia-dr3" if gaia_only else json.dumps(document.get("provenance") or [document.get("source") or "local"], ensure_ascii=False, separators=(",", ":")),
    )
    search_text = None if gaia_only else f"{catalog_key} {display_name} {designation} {' '.join(aliases)}"
    return row, search_text


INSERT = """INSERT OR IGNORE INTO catalog_objects
(id,object_type,display_name,designation,aliases_json,ra_deg,dec_deg,gaia_source_id,mag_g,bp_rp,parallax_mas,teff_k,logg,radius_solar,spectral_type,data_tier,exoplanet_system_id,provenance_json)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"""


def insert_documents(connection: sqlite3.Connection, documents: Iterable[dict[str, Any]]) -> int:
    count = 0
    cursor = connection.cursor()
    cursor.execute("BEGIN")
    for index, document in enumerate(documents, 1):
        record_value = record(document)
        if record_value is None:
            continue
        row, search_text = record_value
        cursor.execute(INSERT, row)
        if cursor.rowcount:
            rowid = cursor.lastrowid
            if search_text:
                cursor.execute("INSERT INTO catalog_fts(rowid,search_text) VALUES (?,?)", (rowid, search_text))
            count += 1
        if index % 20_000 == 0:
            connection.commit()
            cursor.execute("BEGIN")
            print(f"  processed={index:,} inserted={count:,}")
    connection.commit()
    return count


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gaia-csv", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--allow-partial", action="store_true")
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.unlink(missing_ok=True)
    connection = sqlite3.connect(args.output)
    connection.executescript(SCHEMA)
    print("Importing v4 catalog shards serially...")
    insert_documents(connection, iter_v4_documents())
    if args.gaia_csv:
        print(f"Importing Gaia build export {args.gaia_csv}...")
        insert_documents(connection, iter_gaia_csv(args.gaia_csv))
    row_count = connection.execute("SELECT count(*) FROM catalog_objects").fetchone()[0]
    tier_counts = dict(connection.execute("SELECT data_tier,count(*) FROM catalog_objects GROUP BY data_tier"))
    connection.executemany("INSERT INTO metadata(key,value) VALUES (?,?)", [
        ("version", "v135-million-star-sqlite-atlas"),
        ("rowCount", str(row_count)),
        ("targetRows", str(TARGET_ROWS)),
        ("runtimePolicy", "offline-sqlite-fts5-desktop-web-shard-fallback"),
        ("tierCounts", json.dumps(tier_counts, sort_keys=True)),
    ])
    connection.execute("PRAGMA optimize")
    connection.commit()
    connection.close()
    if row_count < TARGET_ROWS and not args.allow_partial:
        args.output.unlink(missing_ok=True)
        raise SystemExit(f"v135 gate failed: unique focusable rows {row_count:,} < {TARGET_ROWS:,}")
    digest = checksum(args.output)
    manifest = {"version": "v135-million-star-sqlite-atlas", "rowCount": row_count, "targetRows": TARGET_ROWS, "sha256": digest, "bytes": args.output.stat().st_size, "tierCounts": tier_counts, "runtimePolicy": "offline-sqlite-fts5-desktop-web-shard-fallback", "provenance": ["Gaia DR3", "HYG v4.1", "IAU aliases", "NASA Exoplanet Archive"]}
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"catalog-v5 rows={row_count:,} bytes={args.output.stat().st_size:,} sha256={digest}")


if __name__ == "__main__":
    main()

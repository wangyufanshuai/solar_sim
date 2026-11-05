import argparse
import csv
import json
import shutil
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description="Enrich catalog V6 from a cached Gaia DR3 astrophysical_parameters export.")
parser.add_argument("--input", default="tools/asset-cache/gaia-dr3-astrophysical-parameters.csv")
parser.add_argument("--catalog", default="dist/catalog-v5/catalog-v5.sqlite")
parser.add_argument("--output", default="dist/catalog-v6/catalog-v6.sqlite")
parser.add_argument("--minimum-rich", type=int, default=180_000)
args = parser.parse_args()

source = Path(args.input).resolve()
catalog = Path(args.catalog).resolve()
output = Path(args.output).resolve()
if not source.is_file():
    raise SystemExit(f"Gaia astrophysical_parameters cache is missing: {source}")
if not catalog.is_file():
    raise SystemExit(f"Catalog SQLite source is missing: {catalog}")
output.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(catalog, output)

def first(row, *names):
    for name in names:
        value = row.get(name)
        if value not in (None, "", "null"):
            return value
    return None

connection = sqlite3.connect(output)
connection.execute("PRAGMA journal_mode=DELETE")
connection.execute("PRAGMA synchronous=NORMAL")
updated = 0
with source.open("r", encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    batch = []
    for row in reader:
        source_id = first(row, "source_id", "SOURCE_ID")
        teff = first(row, "teff_gspphot", "teff_esphs", "teff_k")
        logg = first(row, "logg_gspphot", "logg_esphs", "logg")
        radius = first(row, "radius_gspphot", "radius_flame", "radius_solar")
        if not source_id or not teff or not logg or not radius:
            continue
        batch.append((float(teff), float(logg), float(radius), str(source_id)))
        if len(batch) >= 5_000:
            before = connection.total_changes
            connection.executemany("UPDATE catalog_objects SET teff_k=?, logg=?, radius_solar=?, data_tier='parameter-rich' WHERE CAST(gaia_source_id AS TEXT)=?", batch)
            updated += connection.total_changes - before
            connection.commit()
            batch.clear()
    if batch:
        before = connection.total_changes
        connection.executemany("UPDATE catalog_objects SET teff_k=?, logg=?, radius_solar=?, data_tier='parameter-rich' WHERE CAST(gaia_source_id AS TEXT)=?", batch)
        updated += connection.total_changes - before
        connection.commit()

rich = connection.execute("SELECT count(*) FROM catalog_objects WHERE data_tier='parameter-rich'").fetchone()[0]
connection.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('gaia_astrophysical_parameters_source', ?)", (str(source),))
connection.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('parameter_rich_count', ?)", (str(rich),))
connection.commit()
connection.close()
report = {"version": "v142-gaia-astrophysical-parameters-v1", "input": str(source), "output": str(output), "updatedRows": updated, "parameterRichCount": rich, "minimumRequired": args.minimum_rich, "passed": rich >= args.minimum_rich}
report_path = output.with_suffix(".astrophysical-report.json")
report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
if rich < args.minimum_rich:
    raise SystemExit(f"parameter-rich gate failed: {rich} < {args.minimum_rich}")

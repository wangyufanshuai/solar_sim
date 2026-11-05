#!/usr/bin/env python3
"""Freeze OpenNGC for public local use and Cosmicflows-4 for local-only review."""

from __future__ import annotations

import csv
import gzip
import hashlib
import io
import json
import math
import os
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from astropy import units as u
from astropy.coordinates import Angle
from astroquery.vizier import Vizier


OPENNGC_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
OPENNGC_LICENSE_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/LICENSES/CC-BY-SA-4.0.txt"
COSMICFLOWS_CATALOG = "J/ApJ/944/94/table2"
COSMICFLOWS_ROWS = 55_877


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def fetch_once(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "OrbitAtlasV260/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def parse_float(value: str | None) -> float | None:
    if value is None or not value.strip():
        return None
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except ValueError:
        return None


def build_openngc(output_root: Path) -> dict[str, object]:
    raw = fetch_once(OPENNGC_URL)
    license_text = fetch_once(OPENNGC_LICENSE_URL)
    rows = []
    type_counts: Counter[str] = Counter()
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")), delimiter=";")
    for source in reader:
        try:
            ra_deg = float(Angle(source["RA"], unit=u.hourangle).degree)
            dec_deg = float(Angle(source["Dec"], unit=u.deg).degree)
        except Exception:
            continue
        object_type = (source.get("Type") or "Other").strip()
        type_counts[object_type] += 1
        rows.append({
            "id": (source.get("Name") or "").strip(),
            "type": object_type,
            "raDeg": ra_deg,
            "decDeg": dec_deg,
            "constellation": (source.get("Const") or "").strip(),
            "majorAxisArcmin": parse_float(source.get("MajAx")),
            "minorAxisArcmin": parse_float(source.get("MinAx")),
            "positionAngleDeg": parse_float(source.get("PosAng")),
            "bMag": parse_float(source.get("B-Mag")),
            "vMag": parse_float(source.get("V-Mag")),
            "hubble": (source.get("Hubble") or "").strip() or None,
            "commonNames": [name.strip() for name in (source.get("Common names") or "").split(",") if name.strip()],
            "messier": (source.get("M") or "").strip() or None,
        })
    rows.sort(key=lambda row: row["id"])
    output_root.mkdir(parents=True, exist_ok=True)
    catalog_path = output_root / "openngc-v260.json.gz"
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
    with gzip.GzipFile(filename="", mode="wb", fileobj=catalog_path.open("wb"), mtime=0) as target:
        target.write(payload)
    license_path = output_root / "CC-BY-SA-4.0.txt"
    license_path.write_bytes(license_text)
    manifest = {
        "version": "v260-openngc-local-group-ngc-v1",
        "source": "OpenNGC",
        "sourceUrl": OPENNGC_URL,
        "sourceSha256": sha256_bytes(raw),
        "rowCount": len(rows),
        "typeCounts": dict(sorted(type_counts.items())),
        "output": {"path": "data/openngc-v260/openngc-v260.json.gz", "bytes": catalog_path.stat().st_size, "sha256": sha256_file(catalog_path)},
        "license": {"id": "CC-BY-SA-4.0", "url": OPENNGC_LICENSE_URL, "sha256": sha256_bytes(license_text), "attributionRequired": True},
        "presentationBoundary": "catalog-coordinates-and-morphology-markers-not-observation-imagery",
        "publicDeploymentBlocked": False,
    }
    (output_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def safe_value(value: object) -> object:
    if getattr(value, "mask", False) is not False:
        return None
    if isinstance(value, bytes):
        return value.decode("utf-8")
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def build_cosmicflows(output_root: Path) -> dict[str, object]:
    vizier = Vizier(columns=["*"], row_limit=-1)
    tables = vizier.get_catalogs(COSMICFLOWS_CATALOG)
    if len(tables) != 1 or len(tables[0]) != COSMICFLOWS_ROWS:
        raise RuntimeError(f"Cosmicflows-4 row contract changed: {[len(table) for table in tables]}")
    table = tables[0]
    output_root.mkdir(parents=True, exist_ok=True)
    catalog_path = output_root / "cosmicflows4-v260.csv.gz"
    columns = ["PGC", "1PGC", "T17", "Vcmb", "DM", "e_DM", "RAJ2000", "DEJ2000", "GLON", "GLAT", "SGL", "SGB"]
    with gzip.GzipFile(filename="", mode="wb", fileobj=catalog_path.open("wb"), mtime=0) as compressed:
        with io.TextIOWrapper(compressed, encoding="utf-8", newline="") as text:
            writer = csv.DictWriter(text, fieldnames=[*columns, "distance_mpc"])
            writer.writeheader()
            for row in table:
                values = {column: safe_value(row[column]) for column in columns}
                distance_modulus = values["DM"]
                values["distance_mpc"] = 10 ** ((float(distance_modulus) - 25) / 5) if distance_modulus is not None else None
                writer.writerow(values)
    manifest = {
        "version": "v260-cosmicflows4-local-candidate-v1",
        "source": "Cosmicflows-4 via VizieR",
        "catalog": COSMICFLOWS_CATALOG,
        "citation": "Tully et al. 2023, ApJ, 944, 94",
        "retrievedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "rowCount": COSMICFLOWS_ROWS,
        "output": {"path": "dist/local-candidate/cosmicflows4-v260/cosmicflows4-v260.csv.gz", "bytes": catalog_path.stat().st_size, "sha256": sha256_file(catalog_path)},
        "distanceInterpretation": "distance_mpc=10^((DM-25)/5); FRW is explanatory and does not replace catalog distances",
        "redistributionLicenseStatus": "unconfirmed-for-public-bundling",
        "publicDeploymentBlocked": True,
        "litePackageApplied": False,
    }
    (output_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    openngc = build_openngc(Path("public/data/openngc-v260"))
    cosmicflows = build_cosmicflows(Path("dist/local-candidate/cosmicflows4-v260"))
    print(json.dumps({"passed": True, "openNgcRows": openngc["rowCount"], "cosmicflowsRows": cosmicflows["rowCount"], "publicDeploymentBlocked": True}, indent=2))


if __name__ == "__main__":
    main()

"""Acquire and seal the 24-star SIMBAD identity/basic-data snapshot.

This is an intake tool, not part of the deterministic product build.  The
generated snapshot is reviewed and then consumed as an immutable input by
``build-post-v593-stellar-provenance.mjs``.  Running the product builder never
contacts SIMBAD.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from astroquery.simbad import Simbad
except ModuleNotFoundError:  # Offline fixture tests do not require astroquery.
    Simbad = None


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json"

TARGETS = (
    ("sirius-a", "Sirius A", "exact-component"),
    ("canopus", "Canopus", "exact-named-star"),
    ("alpha-centauri-a", "Alpha Centauri A", "exact-component"),
    ("alpha-centauri-b", "Alpha Centauri B", "exact-component"),
    ("arcturus", "Arcturus", "exact-named-star"),
    ("vega", "Vega", "exact-named-star"),
    # SIMBAD resolves Capella as the unresolved spectroscopic system; do not
    # silently promote it to a component-specific identity.
    ("capella-a", "Capella", "system-only-component-ambiguous"),
    ("rigel", "Rigel", "exact-named-star"),
    ("procyon-a", "Procyon A", "exact-component"),
    ("betelgeuse", "Betelgeuse", "exact-named-star"),
    ("aldebaran", "Aldebaran", "exact-named-star"),
    ("antares", "Antares", "exact-named-star"),
    ("achernar", "Achernar", "exact-named-star"),
    ("hadar", "Hadar", "exact-named-star"),
    ("altair", "Altair", "exact-named-star"),
    ("acrux", "* alf01 Cru", "exact-component"),
    # These roster labels specify components that are not separately returned
    # by the resolver.  Their system records remain useful as search evidence,
    # but are not component identity authority.
    ("spica", "Spica", "system-only-component-ambiguous"),
    ("pollux", "Pollux", "exact-named-star"),
    ("fomalhaut", "Fomalhaut", "exact-named-star"),
    ("deneb", "Deneb", "exact-named-star"),
    ("regulus", "Regulus", "system-only-component-ambiguous"),
    ("polaris", "Polaris", "system-only-component-ambiguous"),
    ("bellatrix", "Bellatrix", "exact-named-star"),
    ("alnilam", "Alnilam", "exact-named-star"),
)

SIMBAD_VOTABLE_FIELDS = (
    "ids",
    "otype",
    "coo_err_maj",
    "coo_err_min",
    "coo_err_angle",
    "coo_wavelength",
    "coo_bibcode",
    "plx_value",
    "plx_err",
    "plx_bibcode",
    "sp_type",
    "sp_qual",
    "sp_bibcode",
    "pmra",
    "pmdec",
    "pm_err_maj",
    "pm_err_min",
)

SIMBAD_REQUIRED_RESULT_COLUMNS = (
    "main_id",
    "otype",
    "ra",
    "dec",
    *SIMBAD_VOTABLE_FIELDS,
)


def normalize(value: Any) -> Any:
    """Convert masked/numpy/astropy scalar values to JSON values."""

    if value is None:
        return None
    if getattr(value, "mask", False) is True:
        return None
    try:
        if value != value:  # NaN
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        try:
            value = value.item()
        except ValueError:
            pass
    if isinstance(value, bytes):
        return value.decode("utf-8")
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(item) for item in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value)}
    return value


def canonical_sha(value: Any) -> str:
    """Use the product's JavaScript canonical JSON number semantics."""

    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"))
    script = """
import { createHash } from 'node:crypto';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
    : value;
process.stdout.write(createHash('sha256').update(JSON.stringify(canonicalize(JSON.parse(input))), 'utf8').digest('hex'));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        input=payload,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()


def configure_simbad_client(client: Any) -> None:
    """Request every optional column consumed by the sealed row parser."""

    client.add_votable_fields(*SIMBAD_VOTABLE_FIELDS)


def row_column_names(row: Any) -> set[str]:
    columns = getattr(row, "colnames", None)
    if columns is None:
        columns = getattr(getattr(row, "table", None), "colnames", None)
    if columns is None and isinstance(row, dict):
        columns = row.keys()
    return {str(column).lower() for column in (columns or ())}


def blocked_row(
    hero_id: str,
    query_id: str,
    resolution: str,
    status: str,
    *,
    missing_fields: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "id": hero_id,
        "queryId": query_id,
        "resolutionClass": resolution,
        "queryStatus": status,
        "mainId": None,
        "identifiers": [],
        "missingVotableFields": sorted(missing_fields or []),
        "blockingReasons": [status],
    }


def parse_simbad_row(
    row: Any,
    hero_id: str,
    query_id: str,
    resolution: str,
) -> dict[str, Any]:
    columns = row_column_names(row)
    missing_fields = [
        field for field in SIMBAD_REQUIRED_RESULT_COLUMNS if field.lower() not in columns
    ]
    if missing_fields:
        return blocked_row(
            hero_id,
            query_id,
            resolution,
            "blocked-missing-required-votable-fields",
            missing_fields=missing_fields,
        )

    identifiers = [
        identifier.strip()
        for identifier in str(normalize(row["ids"]) or "").split("|")
        if identifier.strip()
    ]
    return {
        "id": hero_id,
        "queryId": query_id,
        "resolutionClass": resolution,
        "queryStatus": "resolved",
        "mainId": normalize(row["main_id"]),
        "objectType": normalize(row["otype"]),
        "raDeg": normalize(row["ra"]),
        "decDeg": normalize(row["dec"]),
        "coordinate": {
            "frame": "ICRS",
            "epoch": None,
            "errorMajorMas": normalize(row["coo_err_maj"]),
            "errorMinorMas": normalize(row["coo_err_min"]),
            "errorAngleDeg": normalize(row["coo_err_angle"]),
            "wavelength": normalize(row["coo_wavelength"]),
            "bibcode": normalize(row["coo_bibcode"]),
        },
        "properMotion": {
            "raMasPerYear": normalize(row["pmra"]),
            "decMasPerYear": normalize(row["pmdec"]),
            "errorMajorMasPerYear": normalize(row["pm_err_maj"]),
            "errorMinorMasPerYear": normalize(row["pm_err_min"]),
        },
        "parallax": {
            "valueMas": normalize(row["plx_value"]),
            "errorMas": normalize(row["plx_err"]),
            "bibcode": normalize(row["plx_bibcode"]),
        },
        "spectralType": {
            "value": normalize(row["sp_type"]),
            "quality": normalize(row["sp_qual"]),
            "bibcode": normalize(row["sp_bibcode"]),
        },
        "identifiers": sorted(set(identifiers)),
    }


def query_target(client: Any, hero_id: str, query_id: str, resolution: str) -> dict[str, Any]:
    table = client.query_object(query_id)
    if table is None or len(table) != 1:
        return blocked_row(
            hero_id,
            query_id,
            resolution,
            "search-not-found" if table is None or len(table) == 0 else "blocked-nonunique-result",
        )
    return parse_simbad_row(table[0], hero_id, query_id, resolution)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--retrieved-at")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    output = args.output.resolve()
    if output.exists() and not args.overwrite:
        raise SystemExit(f"snapshot already exists: {output}")

    retrieved_at = args.retrieved_at or datetime.now(timezone.utc).replace(
        microsecond=0
    ).isoformat().replace("+00:00", "Z")

    if Simbad is None:
        raise SystemExit("astroquery is required for live SIMBAD intake")
    client = Simbad()
    configure_simbad_client(client)
    records = [query_target(client, *target) for target in TARGETS]
    blocked = [record for record in records if record["queryStatus"] != "resolved"]
    if blocked:
        detail = ", ".join(
            f"{record['id']}:{record['queryStatus']}" for record in blocked
        )
        raise SystemExit(f"SIMBAD intake failed closed; snapshot not written: {detail}")

    unsigned = {
        "version": "post-v593-simbad-stellar-source-snapshot-v1",
        "retrievedAt": retrieved_at,
        "service": {
            "name": "SIMBAD Astronomical Database",
            "release": "SIMBAD4 1.8 - 2026-07",
            "endpoint": "https://simbad.cds.unistra.fr/simbad/",
            "serviceDoi": "10.26093/cds/simbad",
            "license": "ODbL-1.0",
            "citation": "Wenger et al. 2000, A&AS, 143, 9",
            "queryClient": "astroquery.simbad 0.4.11",
        },
        "policy": {
            "simbadIsMetaCompilationNotCatalogue": True,
            "componentAmbiguityBlocksIdentityBinding": True,
            "coordinateFrameIsNotCoordinateEpoch": True,
            "missingValuesAreNullNeverZero": True,
        },
        "records": records,
    }
    snapshot = {**unsigned, "snapshotSha256": canonical_sha(unsigned)}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(output),
                "resolved": sum(item["queryStatus"] == "resolved" for item in records),
                "identityBindable": sum(
                    item["queryStatus"] == "resolved"
                    and item["resolutionClass"] != "system-only-component-ambiguous"
                    for item in records
                ),
                "snapshotSha256": snapshot["snapshotSha256"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

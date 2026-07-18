"""Freeze a dual-source DE440/NAIF + JPL Horizons V10 reference bundle.

Horizons responses are stored verbatim under the local science cache. This
script never feeds them into runtime physics; it only creates checksummed
provenance and normalized ICRF/J2000/TDB states for offline research.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.parse
import urllib.request
import time
import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path

BODY_COMMANDS = {
    "sun": "10", "mercury": "199", "venus": "299", "earth": "399",
    "moon": "301", "mars": "499", "jupiter": "599", "saturn": "699",
    "uranus": "799", "neptune": "899", "pluto": "999", "ceres": "2000001",
}
BODY_IDS = tuple(BODY_COMMANDS)
EPOCHS = tuple([float(day) for day in range(31)] + [365.0, 3652.5, 36525.0])
J2000 = datetime(2000, 1, 1, 12, 0, 0)
API = "https://ssd.jpl.nasa.gov/api/horizons.api"
VECTOR_RE = re.compile(
    r"X\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Y\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+Z\s*=\s*([+-]?[0-9.]+E[+-][0-9]+)"
)
VELOCITY_RE = re.compile(
    r"VX=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VY=\s*([+-]?[0-9.]+E[+-][0-9]+)\s+VZ=\s*([+-]?[0-9.]+E[+-][0-9]+)"
)
JD_RE = re.compile(r"^([0-9]+\.[0-9]+)\s*=")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load reference builder: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def format_time(value: datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M")


def query(command: str, start: datetime, stop: datetime, step: str) -> tuple[bytes, dict]:
    parameters = {
        "format": "json", "COMMAND": f"'{command}'", "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'VECTORS'", "CENTER": "'@0'",
        "START_TIME": f"'{format_time(start)}'", "STOP_TIME": f"'{format_time(stop)}'",
        "STEP_SIZE": f"'{step}'", "REF_PLANE": "'FRAME'", "OUT_UNITS": "'AU-D'",
        "VEC_TABLE": "'2'", "TIME_TYPE": "'TDB'",
    }
    url = API + "?" + urllib.parse.urlencode(parameters)
    last_error = None
    for attempt in range(5):
        try:
            raw = urllib.request.urlopen(url, timeout=60).read()
            document = json.loads(raw)
            if document.get("error") or "result" not in document:
                raise RuntimeError(f"Horizons query failed for {command}: {document}")
            return raw, {"url": url, "apiVersion": document.get("signature", {}).get("version"), "result": document["result"]}
        except Exception as error:  # network service is external; retry deterministically
            last_error = error
            if attempt < 4:
                time.sleep(2.0 * (attempt + 1))
    raise RuntimeError(f"Horizons query failed after retries: {url}: {last_error}")


def parse_result(result: str) -> list[dict]:
    rows, current = [], None
    inside = False
    for line in result.splitlines():
        if line.strip() == "$$SOE":
            inside = True
            continue
        if line.strip() == "$$EOE":
            inside = False
            if current:
                rows.append(current)
                current = None
            continue
        if not inside:
            continue
        jd_match = JD_RE.match(line)
        if jd_match:
            if current:
                rows.append(current)
            current = {"jdTdb": float(jd_match.group(1))}
            continue
        position = VECTOR_RE.search(line)
        if position and current is not None:
            current["positionAu"] = [float(value) for value in position.groups()]
            continue
        velocity = VELOCITY_RE.search(line)
        if velocity and current is not None:
            current["velocityAuDay"] = [float(value) for value in velocity.groups()]
    if current:
        rows.append(current)
    if not rows or any("positionAu" not in row or "velocityAuDay" not in row for row in rows):
        raise RuntimeError("Horizons response did not contain complete vector rows")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Orbit Atlas V10 dual-source reference bundle")
    parser.add_argument("--output", default="dist/science/relativity-reference-bundle-v10.json")
    parser.add_argument("--cache", default="tools/science-cache/horizons-v210")
    parser.add_argument("--no-network", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    cache = (root / args.cache).resolve()
    cache.mkdir(parents=True, exist_ok=True)
    epoch_rows = {
        day: {
            "offsetDays": day,
            "epochJdTdb": 2451545.0 + day,
            "source": "horizons-frozen",
            "bodies": [],
            "rawSourceHashes": [],
        }
        for day in EPOCHS
    }
    query_manifest = []
    for body_id, command in BODY_COMMANDS.items():
        body_cache = cache / f"{body_id}.json"
        if body_cache.exists():
            document = json.loads(body_cache.read_text(encoding="utf-8"))
        elif args.no_network:
            raise SystemExit(f"missing cached Horizons response: {body_cache}")
        else:
            daily_raw, daily_document = query(command, J2000, J2000 + timedelta(days=30, minutes=1), "1 d")
            holdout_documents = []
            for day in (365.0, 3652.5, 36525.0):
                start = J2000 + timedelta(days=day)
                raw, document = query(command, start, start + timedelta(minutes=1), "1 m")
                holdout_documents.append({"offsetDays": day, "rawSha256": sha256_bytes(raw), "document": document})
            document = {"bodyId": body_id, "command": command, "daily": {"rawSha256": sha256_bytes(daily_raw), "document": daily_document}, "holdouts": holdout_documents}
            body_cache.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
        daily = parse_result(document["daily"]["document"]["result"])
        if len(daily) < 31:
            raise RuntimeError(f"expected 31 daily rows for {body_id}, got {len(daily)}")
        for index, row in enumerate(daily[:31]):
            target = epoch_rows[float(index)]
            target["bodies"].append({"id": body_id, **row})
            target["rawSourceHashes"].append(document["daily"]["rawSha256"])
        for holdout in document["holdouts"]:
            row = parse_result(holdout["document"]["result"])[0]
            target = epoch_rows[float(holdout["offsetDays"])]
            target["bodies"].append({"id": body_id, **row})
            target["rawSourceHashes"].append(holdout["rawSha256"])
        query_manifest.append({"bodyId": body_id, "command": command, "cacheSha256": sha256_bytes(body_cache.read_bytes())})

    horizons_epochs = []
    for day in EPOCHS:
        row = epoch_rows[day]
        raw_hash_payload = json.dumps(sorted(row.pop("rawSourceHashes")), separators=(",", ":")).encode()
        converted = json.dumps(row, sort_keys=True, separators=(",", ":")).encode()
        horizons_epochs.append({
            **row,
            "frame": "ICRF-J2000-barycentric",
            "timeScale": "TDB",
            "origin": "solar-system-barycenter",
            "rawSha256": sha256_bytes(raw_hash_payload),
            "convertedSha256": sha256_bytes(converted),
        })
    fixture_path = root / "dist/science/relativity-reference-fixture-v9.json"
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    naif_epochs = []
    for checkpoint in fixture["checkpoints"]:
        normalized = {
            "offsetDays": float(checkpoint["offsetDays"]),
            "epochJdTdb": float(checkpoint["julianDateTdb"]),
            "source": "de440-naif",
            "bodies": [{
                "id": body["id"],
                "jdTdb": float(checkpoint["julianDateTdb"]),
                "positionAu": [body["x_au"], body["y_au"], body["z_au"]],
                "velocityAuDay": [body["vx_au_d"], body["vy_au_d"], body["vz_au_d"]],
            } for body in checkpoint["bodies"]],
        }
        payload = json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode()
        naif_epochs.append({
            **normalized,
            "frame": "ICRF-J2000-barycentric", "timeScale": "TDB",
            "origin": "solar-system-barycenter",
            "rawSha256": sha256_bytes(payload), "convertedSha256": sha256_bytes(payload),
        })
    # DE440s covers the 100-year diagnostic epoch. Ceres is evaluated through
    # the checksummed NAIF type-13 SPK and frame kernel with CSPICE.
    fixture_builder = load_module("atlas_reference_fixture_v9", root / "scripts/build-relativity-reference-fixture-v9.py")
    science = root / "tools/science-cache/naif-v201"
    planets = fixture_builder.SPK.open(str(science / "de440s.bsp"))
    for kernel in ("naif0012.tls", "de440s.bsp", "codes_300ast_20100725.tf", "codes_300ast_20100725.bsp"):
        fixture_builder.spice.furnsh(str(science / kernel))
    checkpoint = fixture_builder.checkpoint_state(planets, 36525.0, "+100y diagnostic", 2451545.0 + 36525.0)
    fixture_builder.spice.kclear()
    normalized = {
        "offsetDays": 36525.0, "epochJdTdb": float(checkpoint["julianDateTdb"]),
        "source": "de440-naif",
        "bodies": [{
            "id": body["id"], "jdTdb": float(checkpoint["julianDateTdb"]),
            "positionAu": [body["x_au"], body["y_au"], body["z_au"]],
            "velocityAuDay": [body["vx_au_d"], body["vy_au_d"], body["vz_au_d"]],
        } for body in checkpoint["bodies"]],
    }
    payload = json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode()
    naif_epochs.append({
        **normalized, "frame": "ICRF-J2000-barycentric", "timeScale": "TDB",
        "origin": "solar-system-barycenter",
        "rawSha256": sha256_bytes(payload), "convertedSha256": sha256_bytes(payload),
    })
    epochs = [*naif_epochs, *horizons_epochs]
    assets_manifest = root / "dist/science/relativity-research-assets-v9.json"
    bundle = {
        "version": "v209-relativity-reference-bundle-v10",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fixtureSha256": sha256_bytes(fixture_path.read_bytes()),
        "coordinateFrame": "ICRF-J2000-barycentric",
        "timeScale": "TDB",
        "units": {"position": "AU", "velocity": "AU/day", "time": "TDB days"},
        "epochs": epochs,
        "sources": {"horizonsApi": API, "horizonsApiVersion": "1.2", "naifFixture": "dist/science/relativity-reference-fixture-v9.json"},
        "queries": query_manifest,
        "assets": [
            {**asset, "localOnly": True}
            for asset in json.loads(assets_manifest.read_text(encoding="utf-8")).get("assets", [])
        ],
        "provenanceReady": len(naif_epochs) == len(EPOCHS) and len(horizons_epochs) == len(EPOCHS) and all(len(row["bodies"]) == len(BODY_IDS) for row in epochs),
        "boundary": "offline-reference-only-no-runtime-physics",
    }
    output = (root / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(bundle, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"version": bundle["version"], "output": str(output), "epochCount": len(epochs), "sourceEpochCount": len(EPOCHS), "provenanceReady": bundle["provenanceReady"]}, indent=2))


if __name__ == "__main__":
    main()

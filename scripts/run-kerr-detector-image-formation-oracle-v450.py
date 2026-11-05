from __future__ import annotations

import hashlib
import json
import os
from decimal import Decimal, getcontext
from pathlib import Path


getcontext().prec = 60
ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-detector-image-formation-v450/python-oracle.json"


def read_decimal_json(path: str):
    with (ROOT / path).open("r", encoding="utf-8") as handle:
        return json.load(handle, parse_float=Decimal, parse_int=int)


def serializable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [serializable(item) for item in value]
    if isinstance(value, dict):
        return {key: serializable(item) for key, item in value.items()}
    return value


wcs = read_decimal_json(
    "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json"
)
electron = read_decimal_json(
    "dist/science/kerr-detector-electron-kernel-v447/electron-kernel-qualification.json"
)
electron_by_ray = {row["rayIndex"]: row for row in electron["rows"]}
rows = []
for wcs_row in wcs["rows"]:
    ray_index = wcs_row["rayIndex"]
    electron_row = electron_by_ray[ray_index]
    x = wcs_row["continuousPixelX"]
    y = wcs_row["continuousPixelY"]
    x0 = int(x)
    y0 = int(y)
    fx = x - Decimal(x0)
    fy = y - Decimal(y0)
    expected = electron_row["sourceExpectedElectrons"]
    cells = (
        (x0, y0, (Decimal(1) - fx) * (Decimal(1) - fy)),
        (x0 + 1, y0, fx * (Decimal(1) - fy)),
        (x0, y0 + 1, (Decimal(1) - fx) * fy),
        (x0 + 1, y0 + 1, fx * fy),
    )
    deposits = [
        {
            "pixelX": pixel_x,
            "pixelY": pixel_y,
            "linearIndexZeroBased": (pixel_y - 1) * 384 + (pixel_x - 1),
            "weight": weight,
            "expectedSourceElectrons": expected * weight,
        }
        for pixel_x, pixel_y, weight in cells
    ]
    rows.append(
        {
            "fixtureId": f"v450-ray-{ray_index}",
            "rayIndex": ray_index,
            "continuousPixelX": x,
            "continuousPixelY": y,
            "sourceExpectedElectrons": expected,
            "deposits": deposits,
            "depositWeightSum": sum(
                (item["weight"] for item in deposits), Decimal(0)
            ),
            "depositElectronSum": sum(
                (item["expectedSourceElectrons"] for item in deposits), Decimal(0)
            ),
        }
    )

unsigned = {
    "version": "v450-kerr-detector-expected-image-python-oracle-v1",
    "generatedAt": "2026-07-30T00:00:00Z",
    "status": "qualified-decimal-bilinear-sparse-fixture-only",
    "precisionDigits": 60,
    "rows": serializable(rows),
    "measuredDetectorGeometryAvailable": False,
    "psfAvailable": False,
    "pixelResponseAvailable": False,
    "scienceRasterAllowed": False,
    "observedImageAvailable": False,
}
canonical = json.dumps(
    {key: value for key, value in unsigned.items() if key != "generatedAt"},
    ensure_ascii=False,
    separators=(",", ":"),
    sort_keys=True,
).encode("utf-8")
artifact = {**unsigned, "artifactSha256": hashlib.sha256(canonical).hexdigest()}
OUT.parent.mkdir(parents=True, exist_ok=True)
part = OUT.with_name(f"{OUT.name}.{os.getpid()}.part")
part.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
part.replace(OUT)
print(
    json.dumps(
        {
            "status": artifact["status"],
            "precisionDigits": artifact["precisionDigits"],
            "sourceRows": len(rows),
            "sparseDeposits": sum(len(row["deposits"]) for row in rows),
            "scienceRasterRows": 0,
        },
        indent=2,
    )
)

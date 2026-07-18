#!/usr/bin/env python3
"""Export a small Gaia DR3 kinematics validation catalog.

Uses only Python standard-library modules. The output is intended to be
committed under public/data so the app can validate offline.
"""

from __future__ import annotations

import json
import pathlib
import urllib.parse
import urllib.request


TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
OUTPUT = pathlib.Path(__file__).resolve().parents[1] / "public" / "data" / "gaia-dr3-kinematics-2000.json"

FIELDS = [
    "source_id",
    "ra",
    "dec",
    "parallax",
    "pmra",
    "pmdec",
    "radial_velocity",
    "phot_g_mean_mag",
    "bp_rp",
    "parallax_over_error",
    "ruwe",
    "radial_velocity_error",
]

QUERY = """
SELECT TOP 2000
  source_id,
  ra,
  dec,
  parallax,
  pmra,
  pmdec,
  radial_velocity,
  phot_g_mean_mag,
  bp_rp,
  parallax_over_error,
  ruwe,
  radial_velocity_error
FROM gaiadr3.gaia_source
WHERE parallax > 5
  AND parallax_over_error >= 10
  AND ruwe < 1.4
  AND pmra IS NOT NULL
  AND pmdec IS NOT NULL
  AND radial_velocity IS NOT NULL
  AND radial_velocity_error IS NOT NULL
  AND radial_velocity_error <= 5
  AND phot_g_mean_mag IS NOT NULL
  AND bp_rp IS NOT NULL
ORDER BY phot_g_mean_mag ASC
"""


def fetch_tap_json() -> object:
  body = urllib.parse.urlencode({
      "REQUEST": "doQuery",
      "LANG": "ADQL",
      "FORMAT": "json",
      "QUERY": QUERY,
  }).encode("utf-8")
  request = urllib.request.Request(
      TAP_URL,
      data=body,
      headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "solar-next-web-gaia-export/1.0"},
      method="POST",
  )
  with urllib.request.urlopen(request, timeout=120) as response:
    return json.loads(response.read().decode("utf-8"))


def normalize(payload: object) -> list[dict[str, float | str]]:
  if isinstance(payload, list):
    rows = payload
  elif isinstance(payload, dict) and isinstance(payload.get("data"), list):
    rows = []
    metadata = payload.get("metadata")
    if isinstance(metadata, list):
      names = [str(item.get("name")) for item in metadata if isinstance(item, dict)]
    else:
      names = FIELDS
    for values in payload["data"]:
      if not isinstance(values, list):
        raise ValueError("Unexpected Gaia TAP data row shape")
      rows.append(dict(zip(names, values)))
  else:
    raise ValueError("Unexpected Gaia TAP JSON response shape")

  out: list[dict[str, float | str]] = []
  for row in rows:
    if not isinstance(row, dict):
      raise ValueError("Unexpected Gaia TAP row shape")
    normalized: dict[str, float | str] = {}
    for field in FIELDS:
      value = row.get(field)
      if field == "source_id":
        normalized[field] = str(value)
      else:
        if value is None:
          raise ValueError(f"Missing value for {field}")
        normalized[field] = float(value)
    out.append(normalized)

  out.sort(key=lambda item: float(item["phot_g_mean_mag"]))
  return out[:2000]


def main() -> None:
  rows = normalize(fetch_tap_json())
  if len(rows) != 2000:
    raise SystemExit(f"Expected 2000 Gaia rows, got {len(rows)}")
  OUTPUT.parent.mkdir(parents=True, exist_ok=True)
  OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  print(f"Wrote {len(rows)} rows to {OUTPUT}")


if __name__ == "__main__":
  main()

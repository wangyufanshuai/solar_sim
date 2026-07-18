"""Compare two complete V5 radiative reports without tolerating drift."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--first", default="dist/science/kerr-radiative-transfer-v5-fine.json")
    parser.add_argument("--second", default="dist/science/kerr-radiative-transfer-v5-fine-rerun.json")
    parser.add_argument("--output", default="dist/science/kerr-radiative-transfer-v5-determinism.json")
    args = parser.parse_args()
    first_path, second_path = ROOT / args.first, ROOT / args.second
    first = json.loads(first_path.read_text(encoding="utf-8"))
    second = json.loads(second_path.read_text(encoding="utf-8"))
    same = first["canonicalEvidenceSha256"] == second["canonicalEvidenceSha256"]
    stable = {
        "version": "v222-kerr-radiative-determinism-v5",
        "first": {"file": args.first, "sha256": sha256(first_path), "canonicalEvidenceSha256": first["canonicalEvidenceSha256"]},
        "second": {"file": args.second, "sha256": sha256(second_path), "canonicalEvidenceSha256": second["canonicalEvidenceSha256"]},
        "rayCount": first["polarizationRayCount"],
        "diskHitCount": first["polarizationDiskHitCount"],
        "canonicalEvidenceIdentical": same,
        "gatesIdentical": first["gates"] == second["gates"],
        "passed": same and first["gates"] == second["gates"] and first["gates"]["polarizationCoverageAtLeast256"],
    }
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), **stable}, indent=2))
    if not stable["passed"]:
        raise SystemExit("Kerr V5 radiative deterministic rerun gate failed")


if __name__ == "__main__":
    main()

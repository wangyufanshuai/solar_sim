"""Build fail-closed V11 STM semantics and DE440/Horizons disagreement evidence.

V10 propagated separate perturbed trajectories. That is finite-difference
batch sensitivity, not an integrated variational state-transition matrix.
This adapter preserves the negative result and records the missing evidence.
No browser or Worker physics is imported.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AU_KM = 149_597_870.7
AU_DAY_TO_MS = 149_597_870_700.0 / 86_400.0


def canonical_hash(value: dict) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def by_source(bundle: dict, source: str) -> dict[float, dict]:
    return {float(row["offsetDays"]): row for row in bundle["epochs"] if row["source"] == source}


def source_disagreement(bundle: dict) -> list[dict]:
    de440 = by_source(bundle, "de440-naif")
    horizons = by_source(bundle, "horizons-frozen")
    rows = []
    for day in sorted(set(de440) & set(horizons)):
        left = {body["id"]: body for body in de440[day]["bodies"]}
        right = {body["id"]: body for body in horizons[day]["bodies"]}
        common = sorted(set(left) & set(right))
        position, velocity = [], []
        for body_id in common:
            position.append(float(np.linalg.norm(
                np.asarray(left[body_id]["positionAu"], dtype=float) -
                np.asarray(right[body_id]["positionAu"], dtype=float)
            ) * AU_KM))
            velocity.append(float(np.linalg.norm(
                np.asarray(left[body_id]["velocityAuDay"], dtype=float) -
                np.asarray(right[body_id]["velocityAuDay"], dtype=float)
            ) * AU_DAY_TO_MS))
        rows.append({
            "offsetDays": day,
            "bodyCount": len(common),
            "positionRmsKm": math.sqrt(float(np.mean(np.square(position)))),
            "positionMaxKm": max(position),
            "velocityRmsMS": math.sqrt(float(np.mean(np.square(velocity)))),
            "velocityMaxMS": max(velocity),
        })
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle", default="dist/science/relativity-reference-bundle-v10.json")
    parser.add_argument("--finite-difference", default="dist/science/relativity-stm-fit-v10.json")
    parser.add_argument("--output", default="dist/science/relativity-v11-evidence.json")
    args = parser.parse_args()
    bundle = json.loads((ROOT / args.bundle).read_text(encoding="utf-8"))
    finite_difference = json.loads((ROOT / args.finite_difference).read_text(encoding="utf-8"))
    disagreement = source_disagreement(bundle)
    semantic_reports = []
    for report in finite_difference["reports"]:
        ten_year_raw = next(row for row in report["raw"]["checkpoints"] if row["offsetDays"] == 3652.5)
        ten_year_fit = next(row for row in report["fitted"]["checkpoints"] if row["offsetDays"] == 3652.5)
        semantic_reports.append({
            "mode": report["mode"],
            "calibrationWindowDays": [0, 30],
            "finiteDifferenceSensitivity": {
                "method": "finite-difference-batch-sensitivity",
                "available": True,
                "conditioning": {
                    "unregularizedConditionNumber": None,
                    "effectiveRank": None,
                    "parameterCount": report["parameterCount"],
                    "rankTolerance": None,
                    "regularizedConditionNumber": report["conditionNumber"],
                    "regularizationLambda": report["regularizationLambda"],
                },
            },
            "variationalSTM": {
                "method": "integrated-variational-stm",
                "available": False,
                "stateAndPhiIntegratedTogether": False,
                "conditioning": None,
            },
            "raw": {"positionRmsKm": ten_year_raw["positionRmsKm"], "velocityRmsMS": None},
            "finiteDifferenceFit": {"positionRmsKm": ten_year_fit["positionRmsKm"], "velocityRmsMS": None},
            "variationalFit": None,
            "blindHoldoutDays": [365, 3652.5],
            "rawPropagationReplaced": False,
            "promotionDecision": "shadow-retained",
            "boundary": "offline-research-only-no-runtime-promotion",
        })
    stable = {
        "version": "v223-relativity-variational-stm-contract-v11",
        "referenceDisagreement": {
            "sources": ["de440-naif", "horizons-frozen"],
            "frame": "ICRF-J2000-barycentric",
            "timeScale": "TDB",
            "checkpoints": disagreement,
            "referenceAgreementQuantifiedBeforeModelResiduals": True,
            "provenanceReady": bool(bundle.get("provenanceReady")),
            "promotionDecision": "shadow-retained",
            "boundary": "offline-reference-disagreement-no-runtime-promotion",
        },
        "stmReports": semantic_reports,
        "gates": {
            "finiteDifferenceSemanticsCorrected": True,
            "unregularizedConditioningAvailable": False,
            "integratedVariationalSTMAvailable": False,
            "referenceDisagreementQuantified": len(disagreement) > 0,
            "promotionQualified": False,
        },
        "defaultScientificKernel": "legacy-eih-1pn",
        "liveWorkerPhysicsMutated": False,
        "promotionDecision": "shadow-retained",
    }
    document = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    document["canonicalEvidenceSha256"] = canonical_hash(stable)
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "checkpointCount": len(disagreement), "gates": stable["gates"], "canonicalEvidenceSha256": document["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()

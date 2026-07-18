"""Build fail-closed evidence for the frozen Carter/Mino v6 canonical grid."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VOLATILE_KEYS = {"generatedAt", "canonicalEvidenceSha256"}


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_payload(document: dict) -> dict:
    return {key: value for key, value in document.items() if key not in VOLATILE_KEYS}


def canonical_hash(document: dict) -> str:
    encoded = json.dumps(
        canonical_payload(document),
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_record(path: Path, document: dict) -> dict:
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "canonicalEvidenceSha256": document["canonicalEvidenceSha256"],
    }


def ray_classes(document: dict) -> list[str]:
    return [ray["status"] for ray in document["rays"]]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Carter/Mino v6 canonical evidence")
    parser.add_argument("--fine-a", default="dist/science/kerr-carter-mino-reference-v6-fine-a.json")
    parser.add_argument("--fine-b", default="dist/science/kerr-carter-mino-reference-v6-fine-b.json")
    parser.add_argument("--finer-a", default="dist/science/kerr-carter-mino-reference-v6-finer-a.json")
    parser.add_argument("--finer-b", default="dist/science/kerr-carter-mino-reference-v6-finer-b.json")
    parser.add_argument("--output", default="dist/science/kerr-carter-mino-reference-v6-evidence.json")
    args = parser.parse_args()

    paths = {
        name: (ROOT / getattr(args, name.replace("-", "_"))).resolve()
        for name in ("fine-a", "fine-b", "finer-a", "finer-b")
    }
    documents = {name: read_json(path) for name, path in paths.items()}
    canonical_self_checks = {
        name: canonical_hash(document) == document["canonicalEvidenceSha256"]
        for name, document in documents.items()
    }
    fine_deterministic = (
        documents["fine-a"]["canonicalEvidenceSha256"]
        == documents["fine-b"]["canonicalEvidenceSha256"]
    )
    finer_deterministic = (
        documents["finer-a"]["canonicalEvidenceSha256"]
        == documents["finer-b"]["canonicalEvidenceSha256"]
    )
    fine = documents["fine-a"]
    finer = documents["finer-a"]
    same_grid = [ray["direction"] for ray in fine["rays"]] == [
        ray["direction"] for ray in finer["rays"]
    ]
    same_classification = ray_classes(fine) == ray_classes(finer)
    projection_policy_frozen = all(
        document["constraintControl"]
        == "short-segment-pre-residual-reported-carter-first-integral-projection"
        and all(ray["projectionIntervalMino"] == 0.005 for ray in document["rays"])
        for document in documents.values()
    )

    gates = {
        "allCanonicalHashesSelfVerified": all(canonical_self_checks.values()),
        "fineABDeterministic": fine_deterministic,
        "finerABDeterministic": finer_deterministic,
        "sameFrozenGrid": same_grid,
        "fineFinerClassificationStable": same_classification,
        "projectionPolicyFrozen": projection_policy_frozen,
        "fineReleaseNullBelow1e10": float(fine["maxNullConstraint"]) < 1e-10,
        "finerInternalNullBelow1e11": float(finer["maxNullConstraint"]) < 1e-11,
        "projectionCorrectionBelowReleaseGate": max(
            float(fine["maxProjectionCorrection"]),
            float(finer["maxProjectionCorrection"]),
        ) < 1e-10,
        "rayCount25": len(fine["rays"]) == len(finer["rays"]) == 25,
    }
    qualified = all(gates.values())
    stable = {
        "version": "v228-carter-mino-canonical-evidence-v6",
        "status": (
            "canonical-release-gate-qualified-dense-unlock-pending-cross-classification"
            if qualified
            else "canonical-reference-failed-closed"
        ),
        "inputs": {
            name: file_record(paths[name], documents[name])
            for name in ("fine-a", "fine-b", "finer-a", "finer-b")
        },
        "solverPolicy": {
            "fine": {
                "rtol": fine["solver"]["rtol"],
                "atol": fine["solver"]["atol"],
                "maxStepMino": fine["solver"]["maxStepMino"],
                "requiredNullConstraint": "<1e-10",
            },
            "finer": {
                "rtol": finer["solver"]["rtol"],
                "atol": finer["solver"]["atol"],
                "maxStepMino": finer["solver"]["maxStepMino"],
                "requiredNullConstraint": "<1e-11",
            },
            "projectionIntervalMino": 0.005,
            "projectionSemantics": (
                "pre-projection normalized separated-equation residual is reported; "
                "Carter first-integral projection only initializes the next short segment"
            ),
        },
        "measurements": {
            "rayCount": len(fine["rays"]),
            "fineMaxNullConstraint": fine["maxNullConstraint"],
            "finerMaxNullConstraint": finer["maxNullConstraint"],
            "fineMaxProjectionCorrection": fine["maxProjectionCorrection"],
            "finerMaxProjectionCorrection": finer["maxProjectionCorrection"],
            "fineFinerClassificationAgreement": (
                sum(
                    left == right
                    for left, right in zip(ray_classes(fine), ray_classes(finer), strict=True)
                )
                / len(fine["rays"])
            ),
        },
        "canonicalHashSelfChecks": canonical_self_checks,
        "gates": gates,
        "qualifiedForDenseCanonicalCrossCheck": qualified,
        "promotionDecision": "shadow-retained",
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": (
            "offline-null-geodesic-canonical-reference-only-"
            "not-runtime-promotion-not-grmhd"
        ),
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = canonical_hash(report)
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(output),
                "status": report["status"],
                "measurements": report["measurements"],
                "gates": report["gates"],
                "canonicalEvidenceSha256": report["canonicalEvidenceSha256"],
            },
            indent=2,
        )
    )
    if not qualified:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

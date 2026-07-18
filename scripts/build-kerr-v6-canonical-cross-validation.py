"""Cross-validate the frozen 25-ray Carter/Mino and Kerr-Schild references."""

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


def canonical_hash(document: dict) -> str:
    stable = {key: value for key, value in document.items() if key not in VOLATILE_KEYS}
    encoded = json.dumps(stable, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def relative_error(left: float, right: float) -> float:
    return abs(left - right) / max(1.0, abs(left), abs(right))


def file_record(path: Path, document: dict) -> dict:
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "canonicalEvidenceSha256": document["canonicalEvidenceSha256"],
        "canonicalHashSelfVerified": canonical_hash(document)
        == document["canonicalEvidenceSha256"],
    }


def compare_pair(carter: dict, kerr_schild: dict, tolerance: str) -> dict:
    rows = []
    for index, (carter_ray, ks_ray) in enumerate(
        zip(carter["rays"], kerr_schild["rays"], strict=True)
    ):
        constant_errors = {
            key: relative_error(
                float(carter_ray["constants"][key]),
                float(ks_ray["constants"][key]),
            )
            for key in ("energy", "axialAngularMomentum", "carterQ")
        }
        rows.append(
            {
                "rayIndex": index,
                "direction": carter_ray["direction"],
                "directionExactMatch": carter_ray["direction"] == ks_ray["direction"],
                "carterStatus": carter_ray["status"],
                "kerrSchildStatus": ks_ray["status"],
                "classificationAgreement": carter_ray["status"] == ks_ray["status"],
                "observerConstantRelativeErrors": constant_errors,
                "carterNullConstraint": carter_ray["nullConstraint"],
                "kerrSchildNullConstraint": ks_ray["maxNullConstraint"],
                "kerrSchildTerminalAffineParameterM": ks_ray["terminalAffineParameterM"],
            }
        )
    agreement_count = sum(row["classificationAgreement"] for row in rows)
    return {
        "tolerance": tolerance,
        "rayCount": len(rows),
        "classificationAgreementCount": agreement_count,
        "classificationAgreement": agreement_count / len(rows),
        "allDirectionsExactMatch": all(row["directionExactMatch"] for row in rows),
        "maxObserverConstantRelativeError": max(
            value
            for row in rows
            for value in row["observerConstantRelativeErrors"].values()
        ),
        "maxCarterNullConstraint": max(row["carterNullConstraint"] for row in rows),
        "maxKerrSchildNullConstraint": max(row["kerrSchildNullConstraint"] for row in rows),
        "rows": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build canonical Kerr v6 CPU cross-validation")
    defaults = {
        "carter_fine_a": "dist/science/kerr-carter-mino-reference-v6-fine-a.json",
        "carter_fine_b": "dist/science/kerr-carter-mino-reference-v6-fine-b.json",
        "carter_finer_a": "dist/science/kerr-carter-mino-reference-v6-finer-a.json",
        "carter_finer_b": "dist/science/kerr-carter-mino-reference-v6-finer-b.json",
        "ks_fine_a": "dist/science/kerr-schild-reference-v5-fine-a.json",
        "ks_fine_b": "dist/science/kerr-schild-reference-v5-fine-b.json",
        "ks_finer_a": "dist/science/kerr-schild-reference-v5-finer-a.json",
        "ks_finer_b": "dist/science/kerr-schild-reference-v5-finer-b.json",
    }
    for name, default in defaults.items():
        parser.add_argument(f"--{name.replace('_', '-')}", default=default)
    parser.add_argument(
        "--carter-evidence",
        default="dist/science/kerr-carter-mino-reference-v6-evidence.json",
    )
    parser.add_argument(
        "--output",
        default="dist/science/kerr-canonical-cross-validation-v6.json",
    )
    args = parser.parse_args()

    paths = {name: (ROOT / getattr(args, name)).resolve() for name in defaults}
    documents = {name: read_json(path) for name, path in paths.items()}
    evidence_path = (ROOT / args.carter_evidence).resolve()
    evidence = read_json(evidence_path)

    fine = compare_pair(documents["carter_fine_a"], documents["ks_fine_a"], "fine")
    finer = compare_pair(documents["carter_finer_a"], documents["ks_finer_a"], "finer")
    ab_deterministic = {
        "carterFine": documents["carter_fine_a"]["canonicalEvidenceSha256"]
        == documents["carter_fine_b"]["canonicalEvidenceSha256"],
        "carterFiner": documents["carter_finer_a"]["canonicalEvidenceSha256"]
        == documents["carter_finer_b"]["canonicalEvidenceSha256"],
        "kerrSchildFine": documents["ks_fine_a"]["canonicalEvidenceSha256"]
        == documents["ks_fine_b"]["canonicalEvidenceSha256"],
        "kerrSchildFiner": documents["ks_finer_a"]["canonicalEvidenceSha256"]
        == documents["ks_finer_b"]["canonicalEvidenceSha256"],
    }
    input_records = {
        name: file_record(paths[name], documents[name]) for name in defaults
    }
    all_hashes_verified = all(
        record["canonicalHashSelfVerified"] for record in input_records.values()
    )
    ks_complete = all(
        documents[name]["classificationComplete"]
        and documents[name]["incompleteCount"] == 0
        for name in ("ks_fine_a", "ks_fine_b", "ks_finer_a", "ks_finer_b")
    )
    gates = {
        "allInputCanonicalHashesSelfVerified": all_hashes_verified,
        "allABRerunsDeterministic": all(ab_deterministic.values()),
        "carterCanonicalEvidenceQualified": evidence[
            "qualifiedForDenseCanonicalCrossCheck"
        ],
        "kerrSchildClassificationComplete": ks_complete,
        "fineClassificationAgreementAtLeast999": fine["classificationAgreement"] >= 0.999,
        "finerClassificationAgreementAtLeast999": finer["classificationAgreement"] >= 0.999,
        "allScreenDirectionsExact": fine["allDirectionsExactMatch"]
        and finer["allDirectionsExactMatch"],
        "sharedObserverConstantsBelow1e12": max(
            fine["maxObserverConstantRelativeError"],
            finer["maxObserverConstantRelativeError"],
        )
        < 1e-12,
        "fineCarterNullBelow1e10": fine["maxCarterNullConstraint"] < 1e-10,
        "finerCarterNullBelow1e11": finer["maxCarterNullConstraint"] < 1e-11,
        "kerrSchildNullBelow1e10": max(
            fine["maxKerrSchildNullConstraint"],
            finer["maxKerrSchildNullConstraint"],
        )
        < 1e-10,
        "rayCount25": fine["rayCount"] == finer["rayCount"] == 25,
    }
    qualified = all(gates.values())
    stable = {
        "version": "v228-kerr-canonical-cpu-cross-validation-v6",
        "status": (
            "canonical-cross-validation-qualified-dense-shard-smoke-unlocked"
            if qualified
            else "canonical-cross-validation-failed-closed"
        ),
        "inputs": {
            **input_records,
            "carterEvidence": {
                "path": evidence_path.relative_to(ROOT).as_posix(),
                "sha256": hashlib.sha256(evidence_path.read_bytes()).hexdigest(),
                "canonicalEvidenceSha256": evidence["canonicalEvidenceSha256"],
            },
        },
        "abDeterministic": ab_deterministic,
        "fine": fine,
        "finer": finer,
        "gates": gates,
        "qualifiedForDenseShardSmoke": qualified,
        "promotionDecision": "shadow-retained",
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": (
            "offline-two-implementation-null-geodesic-cross-validation-"
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
                "fineAgreement": fine["classificationAgreement"],
                "finerAgreement": finer["classificationAgreement"],
                "maxObserverConstantRelativeError": max(
                    fine["maxObserverConstantRelativeError"],
                    finer["maxObserverConstantRelativeError"],
                ),
                "maxNullConstraints": {
                    "carterFine": fine["maxCarterNullConstraint"],
                    "carterFiner": finer["maxCarterNullConstraint"],
                    "kerrSchildFine": fine["maxKerrSchildNullConstraint"],
                    "kerrSchildFiner": finer["maxKerrSchildNullConstraint"],
                },
                "gates": gates,
                "canonicalEvidenceSha256": report["canonicalEvidenceSha256"],
            },
            indent=2,
        )
    )
    if not qualified:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

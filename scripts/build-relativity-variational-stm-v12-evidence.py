"""Build deterministic, fail-closed evidence for variational STM V12 A/B runs."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VOLATILE_KEYS = {"generatedAt", "canonicalEvidenceSha256"}


def canonical_hash(document: dict) -> str:
    stable = {key: value for key, value in document.items() if key not in VOLATILE_KEYS}
    encoded = json.dumps(stable, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def checkpoint_map(rows: list[dict]) -> dict[float, dict]:
    return {float(row["offsetDays"]): row for row in rows}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build variational STM V12 A/B evidence")
    parser.add_argument(
        "--run-a",
        default="dist/science/relativity-variational-stm-v12-pn-ias15-smoke-a.json",
    )
    parser.add_argument(
        "--run-b",
        default="dist/science/relativity-variational-stm-v12-pn-ias15-smoke-b.json",
    )
    parser.add_argument(
        "--output",
        default="dist/science/relativity-variational-stm-v12-smoke-evidence.json",
    )
    args = parser.parse_args()
    paths = {
        "runA": (ROOT / args.run_a).resolve(),
        "runB": (ROOT / args.run_b).resolve(),
    }
    documents = {
        name: json.loads(path.read_text(encoding="utf-8"))
        for name, path in paths.items()
    }
    run_a = documents["runA"]
    run_b = documents["runB"]
    reports_a = {row["mode"]: row for row in run_a["reports"]}
    reports_b = {row["mode"]: row for row in run_b["reports"]}
    mode_rows = []
    for mode in sorted(reports_a):
        report = reports_a[mode]
        dop = checkpoint_map(report["comparisons"]["variationalSTMFit"])
        ias = checkpoint_map(report["comparisons"]["ias15VariationalFit"])
        common_days = sorted(set(dop) & set(ias))
        position_differences_m = [
            abs(float(dop[day]["positionRmsKm"]) - float(ias[day]["positionRmsKm"]))
            * 1000.0
            for day in common_days
        ]
        velocity_differences_ms = [
            abs(float(dop[day]["velocityRmsMS"]) - float(ias[day]["velocityRmsMS"]))
            for day in common_days
        ]
        release_semantics = (
            report["calibrationWindowDays"] == [0, 30]
            and report["nonlinearBatchFit"]["completedIterations"] >= 2
            and len(report["calibrationResiduals"]) == 30
            and len(report["leaveOneDayOut"]) == 30
            and set(common_days) == {365.0, 3652.5}
        )
        mode_rows.append({
            "mode": mode,
            "effectiveRank": report["conditioning"]["effectiveRank"],
            "rankDeficient": report["rankDeficient"],
            "directionalValidationMaxRelativeError": report["jacobians"][
                "directionalValidationMaxRelativeError"
            ],
            "directionalValidationPassed": report["jacobians"][
                "directionalValidationPassed"
            ],
            "fitIterations": report["nonlinearBatchFit"]["completedIterations"],
            "leaveOneDayOutMethod": report["leaveOneDayOutMethod"],
            "holdoutDays": common_days,
            "maxDop853Ias15PositionDifferenceM": max(
                position_differences_m,
                default=None,
            ),
            "maxDop853Ias15VelocityDifferenceMS": max(
                velocity_differences_ms,
                default=None,
            ),
            "tenYearRegressionDetected": report["tenYearRegressionDetected"],
            "releaseSemanticsComplete": release_semantics,
        })

    input_records = {
        name: {
            "path": path.relative_to(ROOT).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "canonicalEvidenceSha256": documents[name]["canonicalEvidenceSha256"],
            "canonicalHashSelfVerified": canonical_hash(documents[name])
            == documents[name]["canonicalEvidenceSha256"],
        }
        for name, path in paths.items()
    }
    deterministic = (
        run_a["canonicalEvidenceSha256"] == run_b["canonicalEvidenceSha256"]
    )
    smoke_gates = {
        "allInputCanonicalHashesSelfVerified": all(
            row["canonicalHashSelfVerified"] for row in input_records.values()
        ),
        "abDeterministic": deterministic,
        "sameProfile": run_a["profile"] == run_b["profile"],
        "sameModes": set(reports_a) == set(reports_b),
        "integratedDimension4824": all(
            row["integratedStateAndPhiDimension"] == 4824
            for row in reports_a.values()
        ),
        "fullRank66": all(
            row["conditioning"]["effectiveRank"] == 66
            and not row["rankDeficient"]
            for row in reports_a.values()
        ),
        "directionalJacobiansPassed": all(
            row["jacobians"]["directionalValidationPassed"]
            for row in reports_a.values()
        ),
        "groupedPressSemantics": all(
            row["leaveOneDayOutMethod"]
            == "regularized-linearized-grouped-press"
            for row in reports_a.values()
        ),
        "ias15CoverageMatchesDop853": all(
            len(row["holdoutDays"]) > 0 for row in mode_rows
        ),
    }
    smoke_qualified = all(smoke_gates.values())
    release_qualified = (
        smoke_qualified
        and run_a["profile"] == "release"
        and all(row["releaseSemanticsComplete"] for row in mode_rows)
        and all(not row["tenYearRegressionDetected"] for row in mode_rows)
    )
    stable = {
        "version": "v229-relativity-variational-stm-evidence-v12",
        "status": (
            "release-variational-evidence-qualified-shadow-retained"
            if release_qualified
            else "smoke-determinism-qualified-release-long-horizon-pending"
            if smoke_qualified
            else "variational-evidence-failed-closed"
        ),
        "profile": run_a["profile"],
        "inputs": input_records,
        "modes": mode_rows,
        "gates": {
            **smoke_gates,
            "releaseSemanticsComplete": release_qualified,
        },
        "deterministicRerunPassed": deterministic,
        "releaseQualificationAvailable": release_qualified,
        "promotionDecision": "shadow-retained",
        "defaultScientificKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": (
            "offline-variational-stm-evidence-no-runtime-promotion-"
            "smoke-does-not-substitute-for-ten-year-holdout"
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
                "profile": report["profile"],
                "modes": report["modes"],
                "gates": report["gates"],
                "canonicalEvidenceSha256": report["canonicalEvidenceSha256"],
            },
            indent=2,
        )
    )
    if not smoke_qualified:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

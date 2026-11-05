from __future__ import annotations

import hashlib
import json
import os
from decimal import Decimal, getcontext
from pathlib import Path

ROOT = Path.cwd()
OBSERVABLE = ROOT / "dist/science/measured-visible-photon-observable-v384/observable.json"
THROUGHPUT = ROOT / "dist/science/measured-visible-throughput-v383/manifest.json"
OUTPUT = ROOT / "dist/science/measured-visible-photon-error-budget-v385/python-oracle.json"
getcontext().prec = 50


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def decimal(value) -> Decimal:
    return Decimal(str(value))


def main() -> None:
    observable = json.loads(OBSERVABLE.read_text(encoding="utf-8"))
    throughput = json.loads(THROUGHPUT.read_text(encoding="utf-8"))
    if (
        observable.get("status")
        != "throughput-weighted-visible-photon-observable-qualified-dual-domain-electron-authority-withheld"
        or len(observable.get("rows", [])) != 4
        or throughput.get("status")
        != "visible-throughput-candidate-qualified-dual-implementation-authority-withheld-source-dossier-incomplete"
    ):
        raise RuntimeError("v385-python-input-identity")
    normalization = decimal(
        throughput["dualImplementation"]["maximumMetricRelativeDifference"]
    )
    rows = []
    maximum = Decimal(0)
    for source in observable["rows"]:
        components = [
            decimal(source["sourcePhotonQuadratureRelativeDifference"]),
            normalization,
            decimal(source["unweightedReconstructionRelativeDifference"]),
            decimal(source["pythonOracleRelativeDifference"]),
        ]
        known = sum(components, Decimal(0))
        photon = decimal(source["throughputWeightedPhotonRadiancePerSM2Sr"])
        lower = photon * (Decimal(1) - known)
        upper = photon * (Decimal(1) + known)
        maximum = max(maximum, known)
        rows.append(
            {
                "rayIndex": source["rayIndex"],
                "componentRelativeUpperBounds": [
                    format(component, ".40g") for component in components
                ],
                "knownComputationalUpperBoundRelative": format(known, ".40g"),
                "knownComputationalInterval": {
                    "lower": format(lower, ".40g"),
                    "upper": format(upper, ".40g"),
                },
                "totalScientificUncertaintyRelative": "unavailable",
                "totalScientificInterval": None,
            }
        )
    unsigned = {
        "version": "v385-visible-photon-error-budget-python-decimal-oracle-v1",
        "status": "qualified-independent-decimal-linear-budget-oracle",
        "source": {
            "v384ObservableArtifactSha256": observable["artifactSha256"],
            "v383ThroughputArtifactSha256": throughput["artifactSha256"],
        },
        "arithmetic": "python-decimal-50-digit-linear-sum-and-interval",
        "rows": rows,
        "maximumKnownComputationalUpperBoundRelative": format(maximum, ".40g"),
        "combinationRule": "linear-sum-no-independence-proof",
        "rssApplied": False,
        "unknownSystematicsTreatedAsZero": False,
        "networkAttempted": False,
        "absoluteScientificBudgetQualified": False,
        "denseCampaignStatus": "incomplete-0-of-49",
    }
    encoded = json.dumps(
        unsigned,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    artifact = {**unsigned, "artifactSha256": sha256_bytes(encoded)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    temporary.write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, OUTPUT)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "rows": len(rows),
                "maximumKnownComputationalUpperBoundRelative": artifact[
                    "maximumKnownComputationalUpperBoundRelative"
                ],
                "rssApplied": False,
                "absoluteScientificBudgetQualified": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

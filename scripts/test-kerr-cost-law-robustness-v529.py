from __future__ import annotations

import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path("scripts/run-kerr-cost-law-robustness-v529.py")
SPEC = importlib.util.spec_from_file_location("v529_authority", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ARTIFACT_PATH = Path("dist/science/kerr-cost-law-robustness-v529/envelope.json")


def load_artifact() -> dict:
    return json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))


def test_v529_artifact_is_canonical_and_full_factorial() -> None:
    artifact = load_artifact()
    assert artifact["version"] == "v529-kerr-cost-law-robustness-envelope-v1"
    assert MODULE.canonical_sha(artifact) == artifact["artifactSha256"]
    assert artifact["counts"]["stochasticRobustnessCellCount"] == 500
    assert artifact["counts"]["deterministicRobustnessCellCount"] == 500
    assert artifact["counts"]["fullFactorialCellCount"] == 1000
    assert artifact["counts"]["optimizerIterationCount"] == 512000
    assert artifact["counts"]["scientificGeometryInputCount"] == 68


def test_v529_optimizer_and_invariance_residuals_are_strict() -> None:
    artifact = load_artifact()
    limit = float(artifact["limits"]["multiprecisionResidual"])
    assert all(float(value) < limit for value in artifact["maxima"].values())
    audits = artifact["robustnessAudits"]
    assert audits["overheadAllocationInvarianceComparisons"] == 750
    assert audits["overheadCostTranslationComparisons"] == 750
    assert audits["floorMonotonicityComparisons"] == 800
    assert audits["equalWeightStochasticSymmetryChecks"] == 100
    assert audits["overheadAllocationInvariant"] is True
    assert audits["floorCostStrictlyIncreasing"] is True


def test_v529_display_geometry_is_a_traceable_subset() -> None:
    artifact = load_artifact()
    geometry = artifact["displayGeometry"]
    arrays = [value for value in geometry.values() if isinstance(value, list)]
    assert sum(map(len, arrays)) == 68
    stochastic = {row["index"] for row in artifact["stochasticRobustness"]["samples"]}
    deterministic = {row["index"] for row in artifact["deterministicRobustness"]["samples"]}
    for key, rows in geometry.items():
        if not isinstance(rows, list):
            continue
        authority = stochastic if key.startswith("stochastic") else deterministic
        assert all(row["sourceIndex"] in authority for row in rows)


def test_v529_preserves_scientific_and_product_boundaries() -> None:
    artifact = load_artifact()
    assert artifact["costLaw"]["stressModelOnlyNotOperationalCost"] is True
    assert artifact["parameterGrid"]["precisionExponentMeasured"] is False
    assert artifact["selectionBoundary"]["recommendedModelAvailable"] is False
    assert artifact["selectionBoundary"]["recommendedAllocationAvailable"] is False
    assert artifact["selectionBoundary"]["operationalSchedulingAllowed"] is False
    assert artifact["acquisitionBoundary"]["readyMeasuredFileCount"] == 0
    assert artifact["boundary"]["denseCampaignStatus"] == "incomplete-0-of-49"
    assert artifact["boundary"]["formalProductPointer"] == "v263"
    assert artifact["boundary"]["formalDefaultKernel"] == "legacy-eih-1pn"

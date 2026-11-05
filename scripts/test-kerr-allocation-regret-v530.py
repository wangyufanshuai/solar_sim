from __future__ import annotations

import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path("scripts/run-kerr-allocation-regret-v530.py")
SPEC = importlib.util.spec_from_file_location("v530_authority", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ARTIFACT_PATH = Path("dist/science/kerr-allocation-regret-v530/atlas.json")


def load_artifact() -> dict:
    return json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))


def test_v530_artifact_is_canonical_and_complete() -> None:
    artifact = load_artifact()
    assert artifact["version"] == "v530-kerr-allocation-regret-fragility-atlas-v1"
    assert MODULE.canonical_sha(artifact) == artifact["artifactSha256"]
    assert artifact["counts"]["candidateAllocationCount"] == 49
    assert artifact["counts"]["sourceGridCellCount"] == 1000
    assert artifact["counts"]["regretEvaluationCount"] == 49000
    assert artifact["counts"]["scientificGeometryInputCount"] == 148


def test_v530_regret_and_overhead_invariants_are_strict() -> None:
    artifact = load_artifact()
    limit = float(artifact["limits"]["multiprecisionResidual"])
    assert all(float(value) < limit for value in artifact["maxima"].values())
    audits = artifact["regretAudits"]
    assert audits["overheadAbsoluteRegretInvarianceComparisons"] == 36750
    assert audits["relativeRegretOverheadMonotonicityComparisons"] == 36750
    assert audits["absoluteRegretOverheadInvariant"] is True
    assert audits["relativeRegretNonIncreasingWithOverhead"] is True


def test_v530_minimax_is_descriptive_not_recommended() -> None:
    artifact = load_artifact()
    for key in ("stochasticRegretAtlas", "deterministicRegretAtlas"):
        atlas = artifact[key]
        assert len(atlas["candidateEnvelope"]) == 49
        assert atlas["descriptiveAbsoluteMinimax"]["recommended"] is False
        assert atlas["descriptiveRelativeMinimax"]["recommended"] is False
        assert atlas["selectionBoundary"]["priorAvailable"] is False
        assert atlas["selectionBoundary"]["gridCoverageIsProbability"] is False
        assert atlas["selectionBoundary"]["operationalSelectionAllowed"] is False


def test_v530_preserves_scientific_and_product_boundaries() -> None:
    artifact = load_artifact()
    assert artifact["regretDefinition"]["stressModelOnlyNotOperationalDecision"] is True
    assert artifact["selectionBoundary"]["recommendedAllocationAvailable"] is False
    assert artifact["selectionBoundary"]["operationalSchedulingAllowed"] is False
    assert artifact["acquisitionBoundary"]["readyMeasuredFileCount"] == 0
    assert artifact["boundary"]["denseCampaignStatus"] == "incomplete-0-of-49"
    assert artifact["boundary"]["formalProductPointer"] == "v263"
    assert artifact["boundary"]["formalDefaultKernel"] == "legacy-eih-1pn"

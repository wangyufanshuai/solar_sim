from __future__ import annotations

import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path("scripts/run-kerr-regret-ranking-v531.py")
SPEC = importlib.util.spec_from_file_location("v531_authority", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ARTIFACT_PATH = Path("dist/science/kerr-regret-ranking-v531/atlas.json")


def load_artifact() -> dict:
    return json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))


def test_v531_artifact_is_canonical_and_complete() -> None:
    artifact = load_artifact()
    assert artifact["version"] == "v531-kerr-regret-ranking-stability-atlas-v1"
    assert MODULE.canonical_sha(artifact) == artifact["artifactSha256"]
    assert artifact["counts"]["dominanceComparisonCount"] == 4704
    assert artifact["counts"]["rankPairComparisonCount"] == 2352
    assert artifact["counts"]["scalarizationEvaluationCount"] == 9898
    assert artifact["counts"]["scientificGeometryInputCount"] == 300


def test_v531_pareto_and_scalarization_are_consistent() -> None:
    artifact = load_artifact()
    for key in ("stochasticRanking", "deterministicRanking"):
        ranking = artifact[key]
        assert ranking["paretoFront"]["candidateCount"] >= 2
        assert ranking["paretoFront"]["operationalRecommendation"] is False
        assert ranking["scalarizationPath"]["weightCount"] == 101
        assert ranking["scalarizationPath"]["selectedWeightIndex"] is None
        assert all(row["winnerParetoNonDominated"] for row in ranking["scalarizationPath"]["rows"])


def test_v531_rank_stability_is_descriptive() -> None:
    artifact = load_artifact()
    for key in ("stochasticRanking", "deterministicRanking"):
        ranking = artifact[key]
        assert ranking["rankingAgreement"]["rankPairCount"] == 1176
        assert ranking["rankingAgreement"]["winnerAgreement"] is False
        assert ranking["selectionBoundary"]["utilityAvailable"] is False
        assert ranking["selectionBoundary"]["preferenceWeightAvailable"] is False
        assert ranking["selectionBoundary"]["recommendedCandidateAvailable"] is False


def test_v531_preserves_scientific_and_product_boundaries() -> None:
    artifact = load_artifact()
    assert artifact["rankingDefinition"]["stressAnalysisOnlyNotOperationalPreference"] is True
    assert artifact["selectionBoundary"]["recommendedAllocationAvailable"] is False
    assert artifact["acquisitionBoundary"]["readyMeasuredFileCount"] == 0
    assert artifact["boundary"]["denseCampaignStatus"] == "incomplete-0-of-49"
    assert artifact["boundary"]["formalProductPointer"] == "v263"
    assert artifact["boundary"]["formalDefaultKernel"] == "legacy-eih-1pn"

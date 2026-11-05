from __future__ import annotations
import importlib.util,json
from pathlib import Path
SPEC=importlib.util.spec_from_file_location("v532",Path("scripts/run-kerr-regret-jackknife-v532.py"));assert SPEC and SPEC.loader;MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE);PATH=Path("dist/science/kerr-regret-jackknife-v532/atlas.json")
def artifact():return json.loads(PATH.read_text(encoding="utf-8"))
def test_canonical_counts():
    value=artifact();assert MODULE.canonical_sha(value)==value["artifactSha256"];assert value["counts"]["jackknifeRunCount"]==38;assert value["counts"]["regretEvaluationCount"]==735000;assert value["counts"]["dominanceComparisonCount"]==89376;assert value["counts"]["scientificGeometryInputCount"]==136
def test_all_omissions_are_deterministic_and_complete():
    value=artifact()
    for key in("stochasticJackknife","deterministicJackknife"):
        family=value[key];assert family["omissionCount"]==19;assert len(family["omissionSummaries"])==19;assert len(family["candidateMembership"])==49;assert all(row["frequencyIsProbability"]is False for row in family["omissionSummaries"])
def test_stability_is_descriptive_not_probability():
    value=artifact();assert value["jackknifeDefinition"]["frequencyIsProbability"]is False;assert value["jackknifeDefinition"]["bootstrapUsed"]if"bootstrapUsed"in value["jackknifeDefinition"]else True
    assert value["selectionBoundary"]["gridDesignPriorAvailable"]is False;assert value["selectionBoundary"]["recommendedAllocationAvailable"]is False
def test_boundaries():
    value=artifact();assert value["acquisitionBoundary"]["readyMeasuredFileCount"]==0;assert value["boundary"]["denseCampaignStatus"]=="incomplete-0-of-49";assert value["boundary"]["formalProductPointer"]=="v263";assert value["boundary"]["formalDefaultKernel"]=="legacy-eih-1pn"

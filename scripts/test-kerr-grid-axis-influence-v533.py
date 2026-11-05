from __future__ import annotations
import importlib.util,json
from pathlib import Path
SPEC=importlib.util.spec_from_file_location("v533",Path("scripts/run-kerr-grid-axis-influence-v533.py"));assert SPEC and SPEC.loader;MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE);PATH=Path("dist/science/kerr-grid-axis-influence-v533/atlas.json")
def artifact():return json.loads(PATH.read_text(encoding="utf-8"))
def test_canonical_counts():
    value=artifact();assert MODULE.sha(value)==value["artifactSha256"];assert value["counts"]["axisSummaryRowCount"]==8;assert value["counts"]["directedAxisComparisonCount"]==24;assert value["counts"]["scientificGeometryInputCount"]==46
def test_all_axes_present():
    value=artifact();expected={"precision-exponent","cost-ratio","systematic-floor","fixed-overhead"}
    for key in("stochasticInfluence","deterministicInfluence"):assert{row["axis"]for row in value[key]["axisSummaries"]}==expected
def test_no_single_score_or_probability():
    value=artifact();assert value["influenceDefinition"]["singleScoreComputed"]is False;assert value["influenceDefinition"]["aggregationIsProbability"]is False;assert value["selectionBoundary"]["recommendedAxisAvailable"]is False
def test_product_boundaries():
    value=artifact();assert value["acquisitionBoundary"]["readyMeasuredFileCount"]==0;assert value["boundary"]["denseCampaignStatus"]=="incomplete-0-of-49";assert value["boundary"]["formalProductPointer"]=="v263";assert value["boundary"]["formalDefaultKernel"]=="legacy-eih-1pn"

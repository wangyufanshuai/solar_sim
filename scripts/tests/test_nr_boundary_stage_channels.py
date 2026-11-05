"""Pair/source/output coverage and no-overwrite controls; no physics claims."""
import copy
from pathlib import Path
import runpy

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-boundary-stage-channels.py"))


def rows():
    return [{"original_n": n, "left_domain": a, "right_domain": b, "active_node_count": (n-4)**3,
        "core_node_count": 125, "new_evolution_steps": 0, "physical_validation": False, "causal_speed_measured": False,
        **{k: {"by_slot": [{"slot": s} for s in range(58)], "by_output_family": dict.fromkeys(R["C"].OUTPUTS)}
           for k in R["VALUE_NAMES"]},
        "signed_core": {k: {"values": [[0.]*125 for _ in range(58)]} for k in R["VALUE_NAMES"]}}
        for n in (17, 25, 33) for a, b in R["COMPARISONS"]]


def test_complete_six_pair_matrix_is_nonmutating():
    value = rows()
    before = copy.deepcopy(value)
    R["coverage"](value)
    assert value == before


@pytest.mark.parametrize("defect", ["missing", "duplicate", "reverse", "grid", "active", "core", "slot", "family", "core-values", "promotion", "evolution", "speed"])
def test_incomplete_or_misrepresented_matrix_is_rejected(defect):
    value = rows()
    if defect == "missing":
        value.pop()
    elif defect == "duplicate":
        value[-1] = copy.deepcopy(value[0])
    elif defect == "reverse":
        value[0]["left_domain"], value[0]["right_domain"] = value[0]["right_domain"], value[0]["left_domain"]
    elif defect == "grid":
        value[0]["original_n"] = 49
    elif defect in ("active", "core"):
        value[0]["active_node_count" if defect == "active" else "core_node_count"] -= 1
    elif defect == "slot":
        value[0]["source_B"]["by_slot"].pop()
    elif defect == "family":
        value[0]["predicted"]["by_output_family"].pop("D")
    elif defect == "core-values":
        value[0]["signed_core"]["observed"]["values"][0].pop()
    elif defect == "promotion":
        value[0]["physical_validation"] = True
    elif defect == "evolution":
        value[0]["new_evolution_steps"] = 1
    else:
        value[0]["causal_speed_measured"] = True
    with pytest.raises(ValueError):
        R["coverage"](value)


def test_only_fresh_child_is_allowed():
    root = R["EVIDENCE"]
    with pytest.raises(ValueError):
        R["fresh_output"](root)
    with pytest.raises(ValueError):
        R["fresh_output"](root.parent)
    with pytest.raises(ValueError):
        R["fresh_output"](root/"nr-k3-rk-stage-locality-v1-20261008")
    # Does not create this path.
    child = root/"nr-boundary-channel-path-unit-fixture-no-write"
    assert not child.exists()
    assert R["fresh_output"](child) == child.resolve()
    assert not child.exists()

"""Coverage, no-overwrite and retained-scope checks for the final mechanism batch."""
import copy
from pathlib import Path
import runpy

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-boundary-compatibility.py"))


def fixture():
    def base(n):
        return {"active_node_count": (n-4)**3, "core_node_count": 125,
                "new_evolution_steps": 0, "physical_validation": False}
    cases = [{"domain": d, "n": n, "core_values": [0.]*125, "decimal_core_values": [0.]*125, **base(n)}
        for ns in R["P"]["TRIPLES"] for d, n in zip(R["P"]["NAMES"], ns, strict=True)]
    pairs = [{"original_n": n, "left_domain": a, "right_domain": b, **base(n),
        "signed_core": {k: [[0.]*125 for _ in range(3)] for k in R["VALUES"]}}
        for n in (17, 25, 33) for a, b in R["COMPARISONS"]]
    return cases, pairs


def test_complete_matrix_is_nonmutating():
    cases, pairs = fixture()
    before = copy.deepcopy((cases, pairs))
    R["coverage"](cases, pairs)
    assert (cases, pairs) == before


@pytest.mark.parametrize("defect", ["case-missing", "case-duplicate", "pair-missing", "pair-duplicate",
    "reverse", "active", "core", "source-value", "A-value", "promotion", "evolution"])
def test_missing_or_misrepresented_coverage_is_rejected(defect):
    cases, pairs = fixture()
    if defect == "case-missing":
        cases.pop()
    elif defect == "case-duplicate":
        cases[-1] = copy.deepcopy(cases[0])
    elif defect == "pair-missing":
        pairs.pop()
    elif defect == "pair-duplicate":
        pairs[-1] = copy.deepcopy(pairs[0])
    elif defect == "reverse":
        pairs[0]["left_domain"], pairs[0]["right_domain"] = pairs[0]["right_domain"], pairs[0]["left_domain"]
    elif defect in ("active", "core"):
        cases[0]["active_node_count" if defect == "active" else "core_node_count"] -= 1
    elif defect == "source-value":
        cases[0]["decimal_core_values"].pop()
    elif defect == "A-value":
        pairs[0]["signed_core"]["shell"][0].pop()
    elif defect == "promotion":
        pairs[0]["physical_validation"] = True
    else:
        cases[0]["new_evolution_steps"] = 1
    with pytest.raises(ValueError):
        R["coverage"](cases, pairs)


def test_fresh_directory_rejects_parent_existing_and_outside():
    for path in (R["EVIDENCE"], R["EVIDENCE"].parent, R["ANCHOR"].parent):
        with pytest.raises(ValueError):
            R["PARENT"]["fresh_output"](path)
    child = R["EVIDENCE"]/"compatibility-output-fixture-no-write"
    assert not child.exists()
    assert R["PARENT"]["fresh_output"](child) == child.resolve()
    assert not child.exists()

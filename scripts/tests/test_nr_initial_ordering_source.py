"""Coverage and exploratory-order controls for the read-only source audit."""
import copy
from pathlib import Path
import runpy

import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1] / "audit-nr-k3-initial-ordering-source.py"))


def rows():
    result = []
    for ns in R["L"]["TRIPLES"]:
        h = 2./(ns[0]-1)
        for name, n in zip(R["L"]["NAMES"], ns, strict=True):
            result.append({"domain": name, "n": n, "core_rms": h**4,
                "slots": [{"slot": s, "rms": 0. if (s-28)%4 == 0 else h**4,
                           "core_values": [0.]*125, "decimal_core_values": [0.]*125} for s in range(28, 37)]})
    return result


def test_exact_matrix_and_exploratory_orders():
    value = rows()
    before = copy.deepcopy(value)
    result = R["trends"](value)
    assert len(result) == 30 and value == before
    assert sum(r["orders"] is None for r in result) == 9
    for r in result:
        assert r["exploratory_not_admission"] is True
        if r["orders"] is not None:
            assert r["orders"] == pytest.approx([4., 4.])


@pytest.mark.parametrize("defect", ["missing", "duplicate", "domain", "grid", "slot", "core", "decimal"])
def test_incomplete_coverage_is_rejected(defect):
    value = rows()
    if defect == "missing":
        value.pop()
    elif defect == "duplicate":
        value[-1] = copy.deepcopy(value[0])
    elif defect == "domain":
        value[0]["domain"] = "lower"
    elif defect == "grid":
        value[0]["n"] = 99
    elif defect == "slot":
        value[0]["slots"][0]["slot"] = 29
    else:
        value[0]["slots"][0]["core_values" if defect == "core" else "decimal_core_values"].pop()
    with pytest.raises(ValueError):
        R["coverage"](value)


@pytest.mark.parametrize("bad", [-1., float("nan"), float("inf")])
def test_bad_norm_is_not_an_order(bad):
    value = rows()
    value[0]["core_rms"] = bad
    with pytest.raises(ValueError):
        R["trends"](value)

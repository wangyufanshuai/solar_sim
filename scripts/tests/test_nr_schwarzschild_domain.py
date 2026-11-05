from copy import deepcopy
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-domain.py"))


@pytest.mark.parametrize("order", [2, 4])
def test_refinement_uses_unequal_mesh_ratios(order):
    result = RUN["refinement"]([(1./n)**order for n in (16, 24, 32)], order)
    assert result["passed"] and result["orders"] == pytest.approx([order, order])


@pytest.mark.parametrize("values,status,passed", [([0., 0., 0.], "bounded-null", True),
    ([1.e-6, 1.e-7, 1.e-13], "floor-limited", False), ([1., 1., 1.], "measured", False)])
def test_no_fake_order_from_zero_or_flat_error(values, status, passed):
    result = RUN["refinement"](values, 4)
    assert result["status"] == status and result["passed"] is passed


def fixture_rows():
    return [{"order": o, "n": n, "samples": [{"diagnostics": {"time": t,
        "norms": {m: {"l2": (1./(n-1))**o} for m in RUN["METRICS"]}}} for t in RUN["TIMES"]]}
        for o in (2, 4) for n in RUN["SIZES"]]


def test_complete_matrix_assessor():
    result = RUN["assess"](fixture_rows())
    assert result["passed"] and len(result["groups"]) == 20 and len(result["initial_groups"]) == 6


@pytest.mark.parametrize("mutation", ["row", "duplicate", "sample", "bad-error"])
def test_matrix_cannot_pass_with_missing_data(mutation):
    rows = deepcopy(fixture_rows())
    if mutation == "row":
        rows.pop()
    elif mutation == "duplicate":
        rows[-1] = rows[0]
    elif mutation == "sample":
        rows[0]["samples"].pop()
    else:
        rows[0]["samples"][1]["diagnostics"]["norms"]["state"]["l2"] = float("nan")
    with pytest.raises(ValueError):
        RUN["assess"](rows)


def test_command_explicitly_binds_nonperiodic_domain():
    args = RUN["command"]("native", RUN["seed"](9, 4), "out", "meta", 4, 1, "seed")
    assert args[args.index("--scenario")+1] == "schwarzschild-exterior"
    assert args[args.index("--mass")+1] == 1.
    assert args[args.index("--domain-lower")+1] == 1.
    assert args[args.index("--domain-upper")+1] == 3.

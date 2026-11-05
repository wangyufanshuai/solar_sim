from copy import deepcopy
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-relaxation-convergence.py"))


def rows():
    return [{"label":c.label,"samples":[{"time":t,"metrics":{k:{"l2":0.,"linf":0.}
            for k in RUN["FLOORS"]}} for t in RUN["TIMES"]]} for c in RUN["CASES"]]


def test_complete_contract_is_nonmutating():
    values = rows()
    before = deepcopy(values)
    RUN["complete_rows"](values)
    assert values == before


@pytest.mark.parametrize("change", ("missing","duplicate","unknown","time","constraint"))
def test_incomplete_matrix_or_diagnostic_coverage_rejected(change):
    values = rows()
    if change == "missing":
        values.pop()
    elif change == "duplicate":
        values[-1] = values[0]
    elif change == "unknown":
        values[-1]["label"] = "invented"
    elif change == "time":
        values[-1]["samples"][-1]["time"] = .5
    else:
        del values[-1]["samples"][-1]["metrics"]["H"]
    with pytest.raises(ValueError):
        RUN["complete_rows"](values)


def test_new_sources_do_not_replace_retained_solver():
    assert len(RUN["NEW"]) == 4
    assert not any(n.endswith(".cpp") or n.endswith("fo_ccz4_rhs.py") for n in RUN["NEW"])
    assert RUN["BINARY_SHA"] == "20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38"

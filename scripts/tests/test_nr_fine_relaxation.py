from copy import deepcopy
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-fine-relaxation.py"))


def rows():
    return [{**RUN["metadata"](c), "samples": [{"time": t, "metrics": {
        k: {"l2": 0., "linf": 0.} for k in RUN["FLOORS"]}} for t in RUN["TIMES"]]}
        for c in RUN["CASES"]]


def test_complete_contract_is_nonmutating_and_separates_origin():
    values = rows()
    before = deepcopy(values)
    RUN["complete_rows"](values)
    assert values == before
    assert sum(v["origin"] == "retained-parent" for v in values) == 8


@pytest.mark.parametrize("change", ("missing", "duplicate", "unknown", "time", "constraint",
                                     "identity", "origin", "negative", "nonfinite", "missing_norm"))
def test_incomplete_or_inconsistent_matrix_rejected(change):
    values = rows()
    if change == "missing":
        values.pop()
    elif change == "duplicate":
        values[-1] = values[0]
    elif change == "unknown":
        values[-1]["label"] = "invented"
    elif change == "time":
        values[-1]["samples"][-1]["time"] = .5
    elif change == "constraint":
        del values[-1]["samples"][-1]["metrics"]["H"]
    elif change == "identity":
        values[-1]["spatial_order"] = 2
    elif change == "origin":
        values[-1]["origin"] = "retained-parent"
    elif change == "missing_norm":
        del values[-1]["samples"][-1]["metrics"]["H"]["linf"]
    else:
        values[-1]["samples"][-1]["metrics"]["H"]["l2"] = -1. if change == "negative" else float("nan")
    with pytest.raises(ValueError):
        RUN["complete_rows"](values)


def test_no_solver_replacement_or_old_gate_regrade():
    assert len(RUN["NEW"]) == 4
    assert not any(n.endswith(".cpp") or n.endswith("fo_ccz4_rhs.py") for n in RUN["NEW"])
    assert RUN["PARENT_SHA"] == "bfbc9c97a57d97e9fab733331f54adaf4d975e9d8aad438c6a72f2a28a78e5b3"
    assert RUN["BINARY_SHA"] == "20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38"

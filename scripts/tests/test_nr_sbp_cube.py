from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
RUN = runpy.run_path(str(ROOT/"scripts/run-nr-k3-sbp-cube.py"))
NAMES = ("H_metric", "H_fo", "M_stored_K", "M_metric", "Gamma_metric", "Theta", "trace_h", "trace_a", "C_A", "C_P", "C_B", "C_D")


def cases():
    return [{"family": f, "n": n, "state_error": 1.e-3/(2**j)**3,
             "constraint_errors": {name: 1.e-4/(2**j)**2 for name in NAMES}}
            for f in ("full58", "tt-plus") for j, n in enumerate((9, 17, 33))]


def test_cube_refinement_requires_all_families_and_keeps_failures():
    rows = cases()
    assert RUN["assess"](rows)["passed"]
    rows[2]["constraint_errors"]["H_metric"] = 1.
    assert not RUN["assess"](rows)["passed"]
    rows = cases()
    rows[2]["state_error"] = rows[1]["state_error"]
    assert not RUN["assess"](rows)["passed"]


@pytest.mark.parametrize("kind", ("missing", "duplicate", "nan", "negative", "constraint"))
def test_invalid_or_incomplete_spatial_matrix_is_not_passed(kind):
    rows = cases()
    if kind == "missing":
        rows.pop()
    elif kind == "duplicate":
        rows[-1] = deepcopy(rows[0])
    elif kind == "constraint":
        rows[0]["constraint_errors"].pop("C_D")
    else:
        rows[0]["state_error"] = np.nan if kind == "nan" else -1.
    with pytest.raises(ValueError):
        RUN["assess"](rows)


def test_null_constraints_are_bounded_not_invented_orders():
    rows = cases()
    for row in rows:
        row["constraint_errors"]["Theta"] = 1.e-16
    result = RUN["assess"](rows)
    assert result["passed"]
    assert all(c["order"] is None for g in result["groups"] for c in g["constraint_checks"] if c["name"] == "Theta")
    rows[2]["constraint_errors"]["Theta"] = 3.e-12
    assert not RUN["assess"](rows)["passed"]


def test_missing_skew_volume_fails_energy_identity():
    row = {"energy": .1, "direct_rate": .3, "skew_volume_rate": .3, "balance_residual": 1.e-16}
    assert RUN["balance_passed"](row)
    row["balance_residual"] = .3
    assert not RUN["balance_passed"](row)
    row["energy"] = np.nan
    with pytest.raises(ValueError):
        RUN["balance_passed"](row)


def test_time_floor_is_inconclusive_not_success():
    class Euclidean:
        @staticmethod
        def norm(q):
            return float(np.linalg.norm(q))
    report = RUN["BASE"]["temporal_order"](Euclidean(), [np.zeros(58)]*3)
    assert not report["passed"] and report["order"] is None


def test_storage_and_timeout_guards(monkeypatch, tmp_path):
    ns = RUN["guard_factory"].__globals__
    monkeypatch.setattr(ns["shutil"], "disk_usage", lambda path: type("Usage", (), {"free": 0})())
    with pytest.raises(ValueError, match="disk"):
        RUN["guard_factory"](tmp_path, ns["time"].perf_counter())()
    monkeypatch.setattr(ns["shutil"], "disk_usage", lambda path: type("Usage", (), {"free": 10**12})())
    with pytest.raises(ValueError, match="600s"):
        RUN["guard_factory"](tmp_path, ns["time"].perf_counter()-601.)()

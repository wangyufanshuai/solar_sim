from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
RUN = runpy.run_path(str(ROOT/"scripts/run-nr-k3-full58-sbp.py"))


def cases():
    return [{"direction": d, "family": f, "n": n, "state_error": 1.e-3*(16./(n-1))**3,
             "constraint_errors": {f"constraint{i}": 1.e-4*(16./(n-1))**2 for i in range(12)}}
            for d in RUN["NORMALS"] for f in RUN["FAMILIES"] for n in (17, 33, 65)]


def test_frozen_refinement_detects_state_and_constraint_failures():
    rows = cases()
    assert RUN["refinement"](rows)["passed"]
    bad = deepcopy(rows)
    bad[2]["state_error"] = bad[1]["state_error"]*.5
    assert not RUN["refinement"](bad)["passed"]
    bad = deepcopy(rows)
    bad[2]["constraint_errors"]["constraint0"] = 2.*bad[1]["constraint_errors"]["constraint0"]
    assert not RUN["refinement"](bad)["passed"]


def test_bounded_null_and_floor_transition_have_no_assigned_order():
    rows = cases()
    for row in rows:
        row["constraint_errors"]["constraint0"] = 0.
        row["constraint_errors"]["constraint1"] = 1.e-11 if row["n"] == 17 else 1.e-13
    report = RUN["refinement"](rows)
    assert report["passed"]
    checks = report["groups"][0]["constraint_checks"]
    assert checks[0]["status"] == "bounded-null" and checks[0]["order"] is None
    assert checks[2]["status"] == "to-floor" and checks[2]["order"] is None
    rows[2]["constraint_errors"]["constraint0"] = 1.e-8
    assert not RUN["refinement"](rows)["passed"]


@pytest.mark.parametrize("kind", ("missing", "duplicate", "unknown", "family", "nan", "negative"))
def test_bad_coverage_and_error_norms_rejected(kind):
    rows = cases()
    if kind == "missing":
        rows.pop()
    elif kind == "duplicate":
        rows[-1] = rows[0]
    elif kind == "unknown":
        rows[-1]["direction"] = "not-an-axis"
    elif kind == "family":
        rows[-1]["constraint_errors"].pop("constraint0")
    else:
        rows[-1]["state_error"] = np.nan if kind == "nan" else -1.
    with pytest.raises(ValueError):
        RUN["refinement"](rows)


def test_time_null_is_inconclusive_not_promoted():
    f = RUN["F"]
    line = f.FrozenSBPLine(f.build_system(), f.SBP42(17, 1./8.))
    q = np.zeros((17, 58))
    result = RUN["temporal_order"](line, [q, q, q])
    assert result["status"] == "inconclusive-floor" and not result["passed"] and result["order"] is None
    data = [np.full((17, 58), value) for value in (256.e-5, 16.e-5, 1.e-5)]
    result = RUN["temporal_order"](line, data)
    assert result["passed"] and result["order"] == pytest.approx(4.)


def test_energy_failure_is_not_hidden():
    row = {"balance_residual": 0., "boundary_identity_residual": 0., "source_excess": -1.}
    assert RUN["balance_passed"](row)
    for key in row:
        assert not RUN["balance_passed"]({**row, key: .001})
    with pytest.raises(ValueError):
        RUN["balance_passed"]({**row, "balance_residual": np.nan})


def test_fresh_output_refuses_existing_or_out_of_scope(tmp_path, monkeypatch):
    globals_ = RUN["fresh_output"].__globals__
    monkeypatch.setitem(globals_, "EVIDENCE", tmp_path)
    expected = tmp_path/"fresh"
    assert RUN["fresh_output"](expected) == expected
    expected.mkdir()
    with pytest.raises(ValueError, match="exists"):
        RUN["fresh_output"](expected)
    with pytest.raises(ValueError, match="direct child"):
        RUN["fresh_output"](tmp_path/"nested"/"fresh")


def test_artifact_writers_refuse_overwrite_and_array_roundtrips(tmp_path):
    data = np.arange(58.*17).reshape(17, 58)
    RUN["save_array"](tmp_path, "state.npy", data)
    np.testing.assert_array_equal(np.load(tmp_path/"state.npy", allow_pickle=False), data)
    with pytest.raises(FileExistsError):
        RUN["save_array"](tmp_path, "state.npy", data)
    RUN["new_json"](tmp_path/"receipt.json", {"passed": False})
    with pytest.raises(FileExistsError):
        RUN["new_json"](tmp_path/"receipt.json", {"passed": True})


def test_source_path_cannot_leave_workspace():
    with pytest.raises(ValueError, match="outside workspace"):
        RUN["bounded_path"]("../outside.py")

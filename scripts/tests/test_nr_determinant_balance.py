"""Synthetic control and failure tests, not physical determinant evidence."""
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-determinant-balance.py"))
G = R["main"].__globals__


@pytest.mark.parametrize("n", [9, 13])
def test_actual_rhs_and_independent_dense_terms_match(n):
    q = R["A"]["A"]["initial_slots"](n, True)
    q[7:10] = np.array([.02, -.03, .01])[:, None, None, None]
    driver = R["NonlinearSBPCube"](R["Grid3D"]((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))
    before = q.tobytes()
    fields, record = R["sample"](driver, q)
    assert q.tobytes() == before and record["input_unchanged"]
    assert record["maximum_balance_residual"] <= 2.e-14
    assert max(record["independent_term_max_differences"].values()) <= 2.e-14
    assert np.max(abs(fields["reduction_forcing"])) > 1.e-8


def polynomial_states(points, scale=1.):
    t = np.linspace(0., 1., points)
    one = np.ones((2, 2, 2))
    states = []
    for value in t:
        state = {key: np.zeros_like(one) for key in R["FIELDS"]}
        state.update(log_determinant=scale*value**3/3.*one, rhs_trace=scale*value**2*one,
                     transport=scale*value**2*one)
        states.append(state)
    return t, states, one


def test_quadrature_residual_is_kept_separate_from_balance_closure():
    times, states, weights = polynomial_states(5)
    fields, record = R["time_budget"](times, states, weights)
    np.testing.assert_allclose(fields["quadrature_residual"], -1./96., atol=1.e-15, rtol=0.)
    np.testing.assert_allclose(fields["signed_closure"], 0., atol=1.e-15, rtol=0.)
    assert record["projection"]["signed_projections"]["transport"] > 1.
    assert record["projection"]["signed_projections"]["quadrature_residual"] < 0.


def test_descriptive_quadrature_order_is_not_a_physical_gate():
    budgets = [R["time_budget"](*polynomial_states(n))[0] for n in (5, 9, 17)]
    rows = R["time_orders"](budgets, np.ones((2, 2, 2)))
    for row in rows:
        assert row["physical_gate"] is False
        if row["field"] in ("rhs_integral", "transport", "quadrature_residual"):
            assert row["resolved"] and row["observed_order"] == pytest.approx(2., abs=1.e-12)
        else:
            assert not row["resolved"] and row["observed_order"] is None


def test_roundoff_sized_budget_differences_are_unresolved():
    budgets = [R["time_budget"](*polynomial_states(n, scale=1.e-14))[0] for n in (5, 9, 17)]
    assert all(not row["resolved"] and row["observed_order"] is None for row in R["time_orders"](budgets, np.ones((2, 2, 2))))


@pytest.mark.parametrize("position", ["before", "at", "after"])
def test_absolute_deadline_has_no_renewal(monkeypatch, tmp_path, position):
    deadline = 137.+180.
    now = math.nextafter(deadline, -math.inf) if position == "before" else (deadline if position == "at" else deadline+1.)
    monkeypatch.setattr(G["time"], "perf_counter", lambda: now)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    if position == "before":
        R["guard"](tmp_path, deadline)
    else:
        with pytest.raises(ValueError, match="deadline"):
            R["guard"](tmp_path, deadline)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_disk_floors_unchanged(monkeypatch, tmp_path, drive):
    def free(path):
        low = (drive == "C" and str(path) == "C:/") or (drive == "E" and path == R["ROOT"])
        return SimpleNamespace(free=(R[drive+"_RESERVE"]-1) if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", free)
    with pytest.raises(ValueError, match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_output_cap_preserves_receipt_headroom(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    with pytest.raises(ValueError, match="cap"):
        R["guard"](tmp_path, math.inf, additional=24*1024**2+1)


@pytest.mark.parametrize("mode", ["sample", "save"])
def test_partial_point_failure_cannot_disappear(monkeypatch, tmp_path, mode):
    parent = tmp_path/"parent"
    parent.mkdir()
    output = tmp_path/"output"
    output.mkdir()
    for i in range(2):
        np.save(parent/f"p{i}.npy", np.zeros((58, 9, 9, 9)), allow_pickle=False)
    monkeypatch.setitem(G, "PARENT", parent/"receipt.json")
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    row = dict(label="case", completed=False, phase="initialization", points=[])
    def sample(*args):
        if mode == "sample" and len(row["points"]) == 2:
            raise ValueError("injected sample failure")
        return {key: np.zeros((9, 9, 9)) for key in R["FIELDS"]}, {"input_unchanged": True}
    monkeypatch.setitem(G, "sample", sample)
    original_save = R["save"]
    def save(directory, name, fields, layout, deadline):
        if mode == "save" and len(row["points"]) == 2:
            raise OSError("injected save failure")
        original_save(directory, name, fields, layout, deadline)
    monkeypatch.setitem(G, "save", save)
    case = dict(label="case", n=9, dt=.1, trajectory=[dict(point=i, time=i*.1, input_unchanged=True, array=f"p{i}.npy") for i in range(2)])
    with pytest.raises((ValueError, OSError)):
        R["run_case"](case, None, output, math.inf, row)
    assert not row["completed"] and len(row["points"]) == 2
    assert row["points"][0]["completed"] and not row["points"][1]["completed"]
    assert len(list(output.glob("*.npy"))) == 1


def test_initialization_failure_receipt_remains_unadmitted(monkeypatch, tmp_path):
    for name in ("source.py", "protocol.md", "report.xml"):
        (tmp_path/name).write_text("fixture")
    parent = tmp_path/"parent.json"
    parent.write_text(json.dumps({"artifact_hashes": {}}))
    audit = tmp_path/"audit.json"
    audit.write_text("{}")
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output, report = evidence/"new", tmp_path/"report.xml"
    tests = dict(runner_tests=dict(sha256=R["sha"](report)))
    before = {"source.py": R["sha"](tmp_path/"source.py"), "protocol.md": R["sha"](tmp_path/"protocol.md")}
    old = runpy.run_path(str(ROOT/"scripts/tests/test_nr_nonlinear_refinement.py"))
    cases = old["rows"]()
    for case in cases:
        case["trajectory"] = [{}]*(case["steps"]+1)
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PROTOCOL", "protocol.md")
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "AUDIT", audit)
    monkeypatch.setitem(G, "RETAINED", {parent: R["sha"](parent), audit: R["sha"](audit)})
    monkeypatch.setitem(G, "sources", lambda _: (before, tests, dict(cases=cases)))
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    def broken(_grid):
        raise RuntimeError("injected initialization failure")
    monkeypatch.setitem(G, "NonlinearSBPCube", broken)
    monkeypatch.setattr(G["sys"], "argv", ["runner", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text())
    assert not data["completed"] and not data["instantaneous_balance_passed"]
    assert len(data["cases"]) == 1 and data["cases"][0]["phase"] == "initialization"
    assert "initialization failure" in data["cases"][0]["failure"]
    assert all(data[k] is False for k in R["FLAGS"])

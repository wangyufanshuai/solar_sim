"""Analytic controls, complete pilot matrix, resource and evidence guards."""
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-projected-rk.py"))
G = R["main"].__globals__


def test_fixed_matrix_has_common_time_and_all_policies():
    matrix = R["MATRIX"]
    assert len(matrix) == 12 and len({c[0] for c in matrix}) == 12
    assert sum(c[4] for c in matrix) == 24
    for policy in R["POLICIES"]:
        rows = [c for c in matrix if c[1] == policy]
        assert len(rows) == 4 and sum(c[2] for c in rows) == 3
        assert all(dt*steps == 1./256 for _, _, _, dt, steps in rows)


def test_same_rk_controls_resolve_tangency_and_first_order_counterexample():
    result = R["analytic_controls"]()
    assert len(result["rows"]) == 9 and result["tangent_controls_passed"]
    assert result["first_order_negative_control_resolved"] and not result["proves_fo_ccz4_order"]
    for row in result["rows"]:
        if row["problem"] == "non-tangent-circle" and row["policy"] == "stages-and-endpoint":
            assert row["constrained_target_errors"][-1] > .003
            assert .99 < row["constrained_target_orders"][-1] < 1.
            assert row["original_ode_errors"][-1] > .49
        if row["problem"] == "non-tangent-circle" and row["policy"] == "none":
            assert row["constrained_target_orders"] == [None, None, None]
            assert row["original_ode_orders"][-1] > 3.9


def test_incorrect_integrator_fails_positive_analytic_gate(monkeypatch):
    def euler(q, index, dt, evaluate, **kwargs):
        f, _ = evaluate(q, 2*index)
        return q+dt*f, []
    monkeypatch.setitem(G, "rk4_policy_step", euler)
    with pytest.raises(ValueError, match="tangent analytic"):
        R["analytic_controls"]()


@pytest.mark.parametrize("t", [0., .123, 1.])
def test_tensor_exact_solution_is_tangent_and_rhs_matches_derivative(t):
    q = R["tensor_exact"](t)
    f = R["tensor_rhs"](q, t)
    assert max(R["algebraic_errors"](q).values()) < 1.e-14
    assert max(np.max(abs(x)) for x in R["algebraic_velocity"](q, f).values()) < 2.e-15
    eps = 1.e-5
    numerical = (R["tensor_exact"](t+eps)-R["tensor_exact"](t-eps))/(2*eps)
    np.testing.assert_allclose(numerical, f, rtol=2.e-8, atol=2.e-10)


@pytest.mark.parametrize("errors,expected", [([1., 1./16, 1./256], [4., 4.]),
    ([1.e-14, 1.e-15], [None]), ([1., 2.], [None]), ([0., 0.], [None]),
    ([2.e-13, 1.e-13], [None])])
def test_unresolved_order_is_not_upgraded(errors, expected):
    assert R["observed_orders"](errors) == expected


@pytest.mark.parametrize("bad", [-1., math.inf, math.nan])
def test_nonfinite_or_negative_errors_rejected(bad):
    with pytest.raises(ValueError):
        R["observed_orders"]([bad, 1.])


@pytest.mark.parametrize("perturbed", [False, True])
def test_actual_initial_data_and_diagnostics_independently_reconstructed(perturbed):
    reference = R["A"]["A"]["initial_slots"](9)
    raw = R["A"]["A"]["initial_slots"](9, perturbed)
    q = R["project_algebraic_slots"](raw, enabled=True)
    grid = R["Grid3D"]((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    row = R["measured"](R["NonlinearSBPCube"](grid), q, reference)
    assert row["independent_diagnostics_max"] < 2.e-12
    assert max(row["algebraic_errors"].values()) < 2.e-12
    if perturbed:
        assert q.tobytes() != raw.tobytes()
    else:
        assert q.tobytes() == raw.tobytes()


def test_initial_rate_finite_difference_records_roundoff():
    q = R["tensor_exact"](.2)
    f = R["tensor_rhs"](q, .2)
    rows = R["finite_difference_rate"](q, f)
    assert [r["epsilon"] for r in rows] == [1.e-3, 1.e-4]
    assert all(max(r["maximum_absolute_errors"].values()) <= r["tolerance"] for r in rows)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_both_original_disk_floors_preserved(monkeypatch, tmp_path, drive):
    def usage(path):
        low = str(path) == "C:/" if drive == "C" else path == R["ROOT"]
        return SimpleNamespace(free=R[drive+"_RESERVE"]-1 if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", usage)
    with pytest.raises(ValueError, match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_absolute_deadline_not_extended(monkeypatch, tmp_path):
    monkeypatch.setattr(G["time"], "perf_counter", lambda: 3000.)
    with pytest.raises(ValueError, match="deadline"):
        R["guard"](tmp_path, 3000.)


def test_receipt_space_reserved(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    with pytest.raises(ValueError, match="cap"):
        R["guard"](tmp_path, math.inf, additional=176*1024**2+1)


def test_failed_stage_keeps_raw_effective_and_rhs_without_acceptance(monkeypatch, tmp_path):
    grid = R["Grid3D"]((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    driver = R["NonlinearSBPCube"](grid)
    q = R["A"]["A"]["initial_slots"](9)
    row = dict(policy="none", observations=[])
    observe = R["Observer"](tmp_path, math.inf, "failure", driver, row)
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G["R"]["OLD"], "valid_stage", lambda _: False)
    observe("stage-raw", 1, 0, q, None, None, None)
    observe("stage-input", 1, 0, q, q, None, None)
    with pytest.raises(ValueError, match="stage contract"):
        observe("stage-rhs", 1, 0, q, q, np.zeros_like(q), {})
    assert len(list(tmp_path.glob("*.npy"))) == 3
    assert len(row["observations"]) == 1 and not row["observations"][0]["completed"]
    assert row["observations"][0]["phase"] == "stage-rhs"


@pytest.mark.parametrize("problem", ["failure", "source-drift", "nonfinite"])
def test_final_receipt_cannot_admit_failed_partial_or_changed_source(monkeypatch, tmp_path, problem):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"study"
    source, protocol, report, regression, parent, replay = (tmp_path/name for name in (
        "source.py", "protocol.md", "report.xml", "regression.xml", "parent.json", "replay.json"))
    for path in (source, protocol, report, regression, parent, replay):
        path.write_text("{}", encoding="utf-8")
    before = {"source.py": R["sha"](source), "protocol.md": R["sha"](protocol)}
    tests = dict(focused=dict(sha256=R["sha"](report)), regression=dict(sha256=R["sha"](regression)))
    retained = {parent: R["sha"](parent), replay: R["sha"](replay)}
    for name, value in dict(ROOT=tmp_path, EVIDENCE=evidence, PROTOCOL="protocol.md", PARENT=parent,
                            REPLAY=replay, RETAINED=retained).items():
        monkeypatch.setitem(G, name, value)
    monkeypatch.setitem(G, "sources", lambda *args: (before, tests))
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G, "analytic_controls", lambda: {})
    monkeypatch.setitem(G["D"], "verify_artifacts", lambda *args: 0)
    def collect(_directory, _deadline, result):
        result["cases"].append(dict(label="one", completed=False, phase="step"))
        if problem == "failure":
            raise ValueError("injected RK failure")
        result["cases"] = [dict(completed=True, input_unchanged=True) for _ in range(12)]
        if problem == "source-drift":
            source.write_text("changed", encoding="utf-8")
        else:
            result["metric"] = math.nan
    monkeypatch.setitem(G, "collect", collect)
    monkeypatch.setattr(G["argparse"].ArgumentParser, "parse_args", lambda _: SimpleNamespace(
        output_directory=output, test_report=report, regression_report=regression))
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert not data["completed"] and not data["component_passed"] and not data["parent_probe_passed"]
    assert all(data[k] is False for k in R["FLAGS"])
    if problem == "source-drift":
        assert "source identity changed" in data["errors"]
    elif problem == "nonfinite":
        assert data["nonfinite_record_paths"]
    else:
        assert "injected RK failure" in data["errors"][0]

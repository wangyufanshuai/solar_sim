"""Accepted-prefix audit must never regrade a failed parent method."""
import copy
from pathlib import Path
import runpy

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-common-initial-window.py"))
G = A["audit_prefix"].__globals__
F = runpy.run_path(str(ROOT/"scripts/tests/test_nr_projected_rk_audit.py"))


@pytest.mark.parametrize("policy", A["POLICIES"])
@pytest.mark.parametrize("completed", [False, True])
def test_prefix_audits_without_regrading_original(monkeypatch, policy, completed):
    row, q, store = F["fixture"](policy)
    row.update(accepted_steps=1, steps=1 if completed else 16, completed=completed,
               status="completed" if completed else "method-failed", failure="next stage contract",
               restart_permitted=False)
    row["trajectory"][0]["array"] = "initial-common.npy"
    for point in row["trajectory"]:
        point["measurements"] = {}
    monkeypatch.setitem(G["A"], "reconstructed", lambda *args: ({}, 0.))
    monkeypatch.setitem(G["A"], "compare_norms", lambda *args: 0.)
    before = copy.deepcopy(row)
    result = A["audit_prefix"](row, q, q, store.__getitem__)
    assert result["accepted_steps"] == 1 and result["prefix_only"] is not completed
    assert result["original_case_completed"] is completed and not result["failure_regraded"]
    assert row == before


@pytest.mark.parametrize("tamper", ["count", "complete", "restart", "input", "initial", "extra"])
def test_invalid_or_regraded_prefix_rejected(monkeypatch, tamper):
    row, q, store = F["fixture"]("none")
    row.update(accepted_steps=1, status="completed", restart_permitted=False)
    row["trajectory"][0]["array"] = "initial-common.npy"
    for point in row["trajectory"]:
        point["measurements"] = {}
    monkeypatch.setitem(G["A"], "reconstructed", lambda *args: ({}, 0.))
    monkeypatch.setitem(G["A"], "compare_norms", lambda *args: 0.)
    if tamper == "count":
        row["accepted_steps"] = 2
    elif tamper == "complete":
        row["steps"] = 16
    elif tamper == "restart":
        row["restart_permitted"] = True
    elif tamper == "input":
        row["input_unchanged"] = False
    elif tamper == "initial":
        row["trajectory"][0]["array"] = "wrong.npy"
    else:
        row["observations"].append(row["observations"][0])
    with pytest.raises(ValueError):
        A["audit_prefix"](row, q, q, store.__getitem__)


def test_unattempted_is_not_a_zero_step_success():
    row = dict(label="none", status="not-attempted", accepted_steps=0, steps=16, input_unchanged=True,
               completed=False, restart_permitted=False, observations=[], trajectory=[])
    result = A["audit_prefix"](row, None, None, None)
    assert not result["prefix_audited"] and result["status"] == "not-attempted"


def test_failed_first_stage_is_retained_separately_from_empty_prefix(monkeypatch):
    q = np.zeros((58, 2, 2, 2))
    q[[0, 3, 5]] = 1.
    row = dict(label="failed", policy="none", n=2, dt=.01, steps=16, accepted_steps=0,
        status="method-failed", completed=False, input_unchanged=True, restart_permitted=False,
        failure="det contract", trajectory=[dict(point=0, time=0., array="initial-common.npy", measurements={})],
        observations=[dict(step=0, stage=1, half_index=0, completed=False, raw_array="raw.npy", effective_array="effective.npy")])
    monkeypatch.setitem(G["A"], "reconstructed", lambda *args: ({}, 0.))
    monkeypatch.setitem(G["A"], "compare_norms", lambda *args: 0.)
    result = A["audit_prefix"](row, q, q, lambda name: q)
    assert result["prefix_only"] and result["accepted_steps"] == 0 and result["partial_array_count"] == 2
    assert not result["original_case_completed"]

"""Independent determinant reconstruction and rejection-scope controls."""
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-longer-window-probe.py"))
G = R["main"].__globals__


def cube(n=13):
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.
    return q


def test_cofactor_determinant_matches_non_diagonal_positive_control():
    q = cube(2)
    lower = np.array([[1.2, 0., 0.], [.3, .9, 0.], [-.2, .1, 1.1]])
    h = lower@lower.T
    for slot, (i, j) in enumerate(((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))):
        q[slot] = h[i, j]
    assert R["determinant_error"](q) == pytest.approx(abs(np.linalg.det(h)-1.), abs=2.e-14)


@pytest.mark.parametrize("bad", ["shape", "dtype", "complex", "nan", "rectangular"])
def test_bad_canonical_array_rejected(bad):
    q = cube(2)
    if bad == "shape":
        q = q[:57]
    elif bad == "dtype":
        q = q.astype(np.float32)
    elif bad == "complex":
        q = q.astype(complex)
    elif bad == "nan":
        q[0, 0, 0, 0] = np.nan
    else:
        q = np.zeros((58, 2, 2, 3))
    with pytest.raises(ValueError, match="canonical"):
        R["determinant_error"](q)


def rejected_fixture(tmp_path, *, endpoint=False, deviation=5.e-10):
    q = cube()
    q[0] += deviation
    np.save(tmp_path/"bad.npy", q, allow_pickle=False)
    np.save(tmp_path/"rhs.npy", np.zeros_like(q), allow_pickle=False)
    det = R["determinant_error"](q)
    stages = [dict(stage=i+1, rhs_completed=True, stage_contract_passed=True) for i in range(4 if endpoint else 2)]
    if not endpoint:
        stages[-1].update(stage_contract_passed=False, failure="stage contract",
                          report=dict(det_h_max_error=det))
    row = dict(last_completed_step=10, attempted_steps=[dict(step=11, accepted=False, stages=stages)],
        rejection=dict(accepted=False, restart_permitted=False, state_array="bad.npy", rhs_array="rhs.npy",
            location="candidate-endpoint-determinant" if endpoint else "stage-rhs-or-gate", determinant_max=det))
    return row


@pytest.mark.parametrize("endpoint", [False, True])
def test_rejected_stage_or_endpoint_time_is_not_last_accepted_time(tmp_path, endpoint):
    row = rejected_fixture(tmp_path, endpoint=endpoint)
    result = R["check_rejection"](tmp_path, row)
    assert result["determinant_crossing_confirmed"] and result["step_zero_based"] == 11
    assert result["candidate_time"] == (12. if endpoint else 11.5)/256.
    assert result["rhs_shape_and_finiteness_checked"] and not result["rhs_independently_recomputed"]
    assert not result["rejected_restart_permitted"]


@pytest.mark.parametrize("bad", ["accepted", "restart", "location", "record", "report", "step", "stage", "rhs", "limit"])
def test_wrong_rejection_cannot_be_certified(tmp_path, bad):
    row = rejected_fixture(tmp_path, deviation=1.e-10 if bad == "limit" else 5.e-10)
    if bad == "accepted":
        row["rejection"]["accepted"] = True
    elif bad == "restart":
        row["rejection"]["restart_permitted"] = True
    elif bad == "location":
        row["rejection"]["location"] = "unverified-characteristic-failure"
    elif bad == "record":
        row["rejection"]["determinant_max"] = 1.e-8
    elif bad == "report":
        row["attempted_steps"][-1]["stages"][-1]["report"]["det_h_max_error"] = 1.e-11
    elif bad == "step":
        row["attempted_steps"][-1]["step"] = 12
    elif bad == "stage":
        row["attempted_steps"][-1]["stages"][-1]["stage"] = False
    elif bad == "rhs":
        np.save(tmp_path/"rhs.npy", np.full((58, 13, 13, 13), np.nan), allow_pickle=False)
    with pytest.raises(ValueError):
        R["check_rejection"](tmp_path, row)


@pytest.mark.parametrize("bad", [None, "interior-only", "different-error"])
def test_speed_contract_can_reject_before_complete_rhs_exists(tmp_path, bad):
    row = rejected_fixture(tmp_path)
    del row["rejection"]["rhs_array"]
    stage = row["attempted_steps"][-1]["stages"][-1]
    del stage["report"]
    stage.update(rhs_completed=False, failure="ValueError: published speed contract requires det(h)=1")
    if bad == "interior-only":
        q = cube()
        q[0, 6, 6, 6] += 5.e-10
        np.save(tmp_path/"bad.npy", q, allow_pickle=False)
    elif bad == "different-error":
        stage["failure"] = "ValueError: eigenbasis failed"
    if bad:
        with pytest.raises(ValueError):
            R["check_rejection"](tmp_path, row)
    else:
        result = R["check_rejection"](tmp_path, row)
        assert result["rejection_gate"] == "boundary-speed-contract-before-rhs-return"
        assert not result["rhs_shape_and_finiteness_checked"] and not result["rhs_independently_recomputed"]


@pytest.mark.parametrize("where", ["before", "at", "after"])
def test_audit_deadline_not_renewed(monkeypatch, where):
    deadline = 13.+120.
    now = math.nextafter(deadline, -math.inf) if where == "before" else deadline+(where == "after")
    monkeypatch.setattr(G["time"], "perf_counter", lambda: now)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    if where == "before":
        R["guard"](deadline)
    else:
        with pytest.raises(ValueError, match="deadline"):
            R["guard"](deadline)


def test_main_preserves_failed_audit_without_admission(monkeypatch, tmp_path):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    campaign = evidence/"campaign"
    campaign.mkdir()
    receipt, output = campaign/"receipt.json", evidence/"audit.json"
    receipt.write_text("{}")
    parent, balance = tmp_path/"parent.json", tmp_path/"balance.json"
    parent.write_text("{}")
    balance.write_text("{}")
    # The auditor itself and its existing tests remain real bounded inputs.
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "BALANCE", balance)
    monkeypatch.setitem(G, "guard", lambda *a: None)
    def fail(*args):
        raise ValueError("injected audit failure")
    monkeypatch.setitem(G, "audit", fail)
    monkeypatch.setattr(G["argparse"].ArgumentParser, "parse_args", lambda _: SimpleNamespace(receipt=receipt, output=output))
    assert R["main"]() == 1
    data = json.loads(output.read_text())
    assert not data["audit_completed"] and "injected audit failure" in data["errors"][0]
    assert all(data[k] is False for k in R["FLAGS"])

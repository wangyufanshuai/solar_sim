"""Tamper controls for the independent saved-stage method audit."""
import copy
from pathlib import Path
import runpy

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-projected-rk.py"))


def fixture(policy):
    q = np.zeros((58, 2, 2, 2))
    q[[0, 3, 5]] = 1.
    q[1] = .03
    q = A["projected"](q)
    store, observations, slopes = {}, [], []
    dt = .01
    for index in range(5):
        if index == 0:
            raw = q.copy()
        elif index < 3:
            raw = q+.5*dt*slopes[-1]
        elif index == 3:
            raw = q+dt*slopes[-1]
        else:
            raw = q+dt*(slopes[0]+2.*slopes[1]+2.*slopes[2]+slopes[3])/6.
        stage = index+1 if index < 4 else 0
        mapped = policy == "stages-and-endpoint" or policy == "endpoint" and stage == 0
        effective = A["projected"](raw) if mapped else raw.copy()
        names = {key+"_array": str(index)+"-"+key for key in ("raw", "effective", "rhs")}
        store[names["raw_array"]], store[names["effective_array"]] = raw, effective
        f = .02*effective+np.linspace(-.01, .01, 58)[:, None, None, None]
        store[names["rhs_array"]] = f
        slopes.append(f)
        observations.append(dict(step=0, stage=stage, half_index=(0, 1, 1, 2, 2)[index], completed=True, **names))
    row = dict(label="fixture", policy=policy, n=2, dt=dt, steps=1, observations=observations,
               trajectory=[dict(point=0, time=0.), dict(point=1, time=dt, array="4-effective")],
               completed=True, input_unchanged=True)
    return row, q, store


@pytest.mark.parametrize("policy", A["POLICIES"])
def test_valid_arithmetic_passes_and_does_not_mutate_inputs(policy):
    row, q, store = fixture(policy)
    before = copy.deepcopy(row)
    result = A["audit_case"](row, q, store.__getitem__)
    assert result["steps"] == 1 and result["rhs_stages"] == 4
    assert row == before


@pytest.mark.parametrize("bad", ["raw", "effective", "rhs", "half", "endpoint", "incomplete", "policy"])
def test_tampered_method_or_stage_link_is_rejected(bad):
    row, q, store = fixture("stages-and-endpoint")
    if bad in ("raw", "effective", "rhs"):
        store["0-"+bad] = store["0-"+bad].copy()
        store["0-"+bad][20] += 1.e-4
    elif bad == "half":
        row["observations"][1]["half_index"] = 2
    elif bad == "endpoint":
        row["trajectory"][1]["array"] = "3-effective"
    elif bad == "incomplete":
        row["observations"].pop()
    else:
        row["policy"] = "endpoint"
    with pytest.raises(ValueError):
        A["audit_case"](row, q, store.__getitem__)


def test_paths_cannot_escape_evidence_directory(tmp_path):
    with pytest.raises(ValueError, match="escape"):
        A["contained"](tmp_path, "../outside.npy")


def test_nonfinite_saved_state_rejected():
    row, q, store = fixture("none")
    store["0-raw"][20] = np.nan
    with pytest.raises(ValueError, match="finite"):
        A["audit_case"](row, q, store.__getitem__)

"""Signed error accounting, without evolving or regrading a spacetime."""
from pathlib import Path
import runpy

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-nonlinear-refinement-error.py"))


@pytest.mark.parametrize("final", [0., .25, 1., 2., -1.])
def test_signed_identity_retains_cancellation_and_reinforcement(final):
    initial = np.ones((3, 3, 3))
    weights = np.arange(1., 28.).reshape(3, 3, 3)
    row = R["decomposition"](initial, final*initial, weights)
    assert row["initial_rms"] == 1.
    assert row["final_rms"] == abs(final)
    assert row["change_rms"] == abs(final-1.)
    assert row["signed_cross_term"] == 2.*(final-1.)
    assert row["squared_norm_identity_defect"] <= 1.e-14


def test_equal_norms_can_have_nonzero_field_difference():
    initial = np.empty((2, 2, 2, 2))
    initial[..., 0], initial[..., 1] = 1., 2.
    final = initial[..., ::-1]
    row = R["decomposition"](initial, final, np.ones((2, 2, 2)))
    assert row["initial_rms"] == row["final_rms"]
    assert row["change_rms"] == 1.
    assert row["signed_cross_term"] == -1.


def test_zero_initial_error_is_not_divided_by_zero():
    initial = np.zeros((2, 2, 2, 3))
    row = R["decomposition"](initial, np.ones_like(initial), np.ones((2, 2, 2)))
    assert row["change_over_initial"] is None and row["change_rms"] == 1.


@pytest.mark.parametrize("kind", ["shape", "initial-nan", "final-inf", "weight-zero", "weight-nan"])
def test_invalid_inputs_are_not_zero_error(kind):
    initial = np.ones((2, 2, 2))
    final, weights = initial.copy(), initial.copy()
    if kind == "shape":
        final = final[:1]
    elif kind == "initial-nan":
        initial[0, 0, 0] = np.nan
    elif kind == "final-inf":
        final[0, 0, 0] = np.inf
    elif kind == "weight-zero":
        weights[0, 0, 0] = 0.
    else:
        weights[0, 0, 0] = np.nan
    with pytest.raises(ValueError):
        R["decomposition"](initial, final, weights)

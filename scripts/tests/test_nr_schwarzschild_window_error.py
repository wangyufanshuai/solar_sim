"""Synthetic arithmetic tests, not numerical-relativity evidence."""
from pathlib import Path
import runpy

import numpy as np
import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-schwarzschild-window-error.py"))


def test_signed_cancellation_is_retained():
    value = RUN["decompose"](np.array([1., 2.]), np.array([10., 20.]))
    assert value["alignment_cosine"] == pytest.approx(-1.)
    assert value["evolution_to_initial_ratio"] == pytest.approx(.9)
    assert value["total_rms"] < value["initial_discrete_rms"]
    assert value["twice_signed_inner_product"] < 0.


def test_no_evolution_and_null_baseline_are_not_divided_by_zero():
    fixed = RUN["decompose"]([1., 2.], [1., 2.])
    assert fixed["evolution_change_rms"] == 0.
    assert fixed["alignment_cosine"] is None
    null = RUN["decompose"]([1., 2.], [0., 0.])
    assert null["evolution_to_initial_ratio"] is None
    assert null["total_rms"] == null["evolution_change_rms"]
    zero = RUN["decompose"]([0.], [0.])
    assert zero["squared_norm_closure"] == 0.


@pytest.mark.parametrize("total,initial", [([], []), ([1.], [1., 2.]),
    ([float("nan")], [1.]), ([1.], [float("inf")])])
def test_invalid_fields_rejected(total, initial):
    with pytest.raises(ValueError, match="matched finite"):
        RUN["decompose"](total, initial)

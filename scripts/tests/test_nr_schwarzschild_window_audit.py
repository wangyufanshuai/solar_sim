"""Synthetic structural tests, not physical or numerical-run evidence."""
from pathlib import Path
import runpy

import pytest

AUDIT = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-schwarzschild-window-completion.py"))


def test_exact_physical_matrix_has_all_62_distinct_samples():
    matrix = AUDIT["expected_matrix"]()
    assert len(matrix) == 62
    assert sum(row[0] == 2 for row in matrix) == 16
    assert sum(row[2] == .5 for row in matrix) == 8
    assert sum(row[4] == 1./512 for row in matrix) == 14
    assert (4, 33, 1., 3., 1./512, .1875) in matrix
    assert (4, 33, 1., 3., 1./512, 1.) in matrix


@pytest.mark.parametrize("values,order", [
    ([1., .1, .02], 4),
    ([1., .5, .3], 4),
    ([1.e-13, 2.e-13, 1.e-13], 4),
    ([1.e-6, 1.e-9, 1.e-13], 4),
    ([1., 4./9, .25], 2),
    ([4.510425544759288e-6, 6.527210518057334e-7, 3.056654662129175e-7], 4),
])
def test_direct_formula_matches_frozen_decision_without_regrading(values, order):
    expected = AUDIT["B"]["refinement"](values, order)
    assert AUDIT["independent_refinement"](values, order) == (
        expected["orders"], expected["status"], expected["passed"])


@pytest.mark.parametrize("values,order", [
    ([], 4), ([1., 2.], 4), ([-1., 2., 3.], 4), ([float("nan"), 2., 3.], 4),
    ([float("inf"), 2., 3.], 4), ([1., 2., 3.], 3),
])
def test_invalid_order_inputs_are_rejected(values, order):
    with pytest.raises(ValueError, match="invalid refinement"):
        AUDIT["independent_refinement"](values, order)

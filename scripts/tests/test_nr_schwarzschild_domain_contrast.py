"""Synthetic post-hoc contrast arithmetic, not physical validation."""
from pathlib import Path
import runpy

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-k3-schwarzschild-domain-contrast.py"))


def test_signed_field_difference_is_not_difference_of_rms_norms():
    value = R["contrast"]([1., -1.], [-1., 1.], [0., 0.])
    assert value["original_rms"] == value["upper_rms"] == 1.
    assert value["original_upper_field_difference_rms"] == 2.
    assert value["original_upper_difference_to_original_rms"] == 2.
    assert value["not_a_reflection_coefficient"] is True


def test_identical_arrays_have_zero_contrasts_without_mutation():
    a = np.arange(12.).reshape(2, 2, 3)
    before = a.copy()
    value = R["contrast"](a, a, a)
    for key in ("original_upper_field_difference_rms", "original_both_field_difference_rms", "upper_both_field_difference_rms"):
        assert value[key] == 0.
    np.testing.assert_array_equal(a, before)


def test_zero_reference_uses_explicit_floor_not_physical_relative_error():
    value = R["contrast"]([0.], [2.e-12], [0.])
    assert value["original_upper_difference_to_original_rms"] == 1.


@pytest.mark.parametrize("arrays", [([], [], []), ([1.], [1., 2.], [1.]), ([float("nan")], [0.], [0.]),
    ([0.], [float("inf")], [0.]), ([0.], [0.], [-float("inf")])])
def test_invalid_contrast_inputs_fail(arrays):
    with pytest.raises(ValueError, match="matched finite"):
        R["contrast"](*arrays)


def test_signed_decomposition_reconstructs_total_squared_norm():
    value = R["D"]["ERROR"]["decompose"](np.array([.5, -.5]), np.array([1., -1.]))
    assert value["alignment_cosine"] == -1.
    assert value["squared_norm_closure"] == 0.
    assert value["total_rms"] == .5


def test_finite_fields_that_overflow_norm_are_rejected():
    with pytest.raises(ValueError, match="overflow"):
        R["contrast"]([1.e308], [0.], [0.])

from pathlib import Path
import runpy

import numpy as np
import pytest

from science.numerical_relativity.fo_ccz4_sbp_frozen import INDEX, constraint_fields, unit_normal

ROOT = Path(__file__).resolve().parents[2]
AUDIT = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-full58-sbp.py"))


@pytest.mark.parametrize("n", (9, 17, 33, 65))
def test_independent_matrix_satisfies_SBP_and_polynomial_moments(n):
    derivative, weights = AUDIT["sbp_matrix"](n)
    boundary = np.zeros((n, n))
    boundary[0, 0], boundary[-1, -1] = -1., 1.
    np.testing.assert_allclose(weights[:, None]*derivative+derivative.T*weights, boundary, atol=3.e-16, rtol=0.)
    x = np.linspace(-1., 1., n)
    for degree in range(3):
        expected = degree*x**max(0, degree-1)
        np.testing.assert_allclose(derivative@x**degree, expected, atol=3.e-14, rtol=0.)


@pytest.mark.parametrize("normal", ((1., 0., 0.), (0., 1., 0.), (0., 0., -1.), (1., 2., 3.)))
def test_tensor_reconstruction_matches_packed_formulas_for_general_data(normal):
    n = unit_normal(normal)
    generator = np.random.default_rng(61)
    q, dq, ddq = (generator.normal(size=(17, 58)) for _ in range(3))
    tensor = AUDIT["tensor_constraints"](q, dq, ddq, n, INDEX)
    packed = constraint_fields(q, dq, ddq, n)
    assert set(tensor) == set(packed)
    for name in tensor:
        np.testing.assert_allclose(tensor[name], packed[name], atol=8.e-15, rtol=0.)


def test_independent_metric_curvature_and_momentum_have_correct_signs():
    q, dq, ddq = (np.zeros((17, 58)) for _ in range(3))
    ddq[:, INDEX["h11"]] = 2.
    dq[:, INDEX["A11"]] = 3.
    result = AUDIT["tensor_constraints"](q, dq, ddq, (1., 0., 0.), INDEX)
    np.testing.assert_array_equal(result["H_metric"], -2.*np.ones(17))
    np.testing.assert_array_equal(result["M_metric"][:, 0], -3.*np.ones(17))
    assert not np.any(result["M_stored_K"]) and not np.any(result["H_fo"])

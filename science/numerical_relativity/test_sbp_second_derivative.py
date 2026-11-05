"""Operator identities are not nonlinear Einstein evolution validation."""
from fractions import Fraction as F

import numpy as np
import pytest

from .sbp_boundary_operator import SBP42
from .sbp_second_derivative import BOUNDARY_S, D2_LEFT_ROWS, SBP42Second


@pytest.mark.parametrize("n", [9, 13, 17, 33, 65])
def test_sbp_energy_and_compatibility_matrices(n):
    h = 2./(n-1)
    first, second = SBP42(n, h), SBP42Second(n, h)
    d1, d2, weights = first.matrix(), second.matrix(), second.norm_weights
    np.testing.assert_array_equal(weights, first.norm_weights)
    assert not weights.flags.writeable
    boundary = np.zeros((n, n))
    boundary[0] = -second.boundary_derivative(np.eye(n), 0)
    boundary[-1] = second.boundary_derivative(np.eye(n), 1)
    m = boundary-weights[:, None]*d2
    np.testing.assert_allclose(m, m.T, rtol=0., atol=2.e-13)
    remainder = m-d1.T@(weights[:, None]*d1)
    for matrix in (m, remainder):
        assert np.linalg.eigvalsh((matrix+matrix.T)/2.).min() >= -2.e-12
        np.testing.assert_allclose(matrix@np.ones(n), 0., rtol=0., atol=2.e-12)
    u, v = np.random.default_rng(91).normal(size=(2, n))
    lhs = u@(weights*second.second_derivative(v))
    rhs = -u@m@v-u[0]*second.boundary_derivative(v, 0)+u[-1]*second.boundary_derivative(v, 1)
    np.testing.assert_allclose(lhs, rhs, rtol=2.e-14, atol=2.e-12)
    assert not np.allclose(second.boundary_derivative(np.eye(n), 0), d1[0])


def test_exact_rational_boundary_moments():
    for i, row in enumerate(D2_LEFT_ROWS):
        for degree in range(4):
            target = 0 if degree < 2 else degree*(degree-1)*i**(degree-2)
            assert sum(F(*v)*j**degree for j, v in enumerate(row)) == target
    for degree in range(4):
        assert sum(F(*v)*j**degree for j, v in enumerate(BOUNDARY_S)) == (1 if degree == 1 else 0)


@pytest.mark.parametrize("axis", [0, 1, 2, -1])
@pytest.mark.parametrize("degree", range(6))
def test_polynomial_exactness_packed_axes_and_no_input_mutation(axis, degree):
    shape = [2, 3, 4]
    shape[axis] = 17
    x = np.indices(shape)[axis]/16.
    q = x**degree
    before = q.copy()
    second = SBP42Second(17, 1./16)
    actual = second.second_derivative(q, axis)
    expected = np.zeros_like(x) if degree < 2 else degree*(degree-1)*x**(degree-2)
    selected = [slice(None)]*3
    if degree >= 4:
        selected[axis] = slice(4, -4)
    np.testing.assert_allclose(actual[tuple(selected)], expected[tuple(selected)], rtol=0., atol=5.e-12)
    np.testing.assert_array_equal(q, before)


@pytest.mark.parametrize("side", [0, 1])
def test_boundary_S_has_correct_orientation(side):
    x = np.linspace(1., 3., 17)
    second = SBP42Second(17, .125)
    assert second.boundary_derivative(x, side) == 1.
    np.testing.assert_allclose(second.boundary_derivative(x**3, side), 3.*x[0 if side == 0 else -1]**2,
                               rtol=0., atol=5.e-12)


def test_constant_slots_are_exact_and_candidate_is_not_live():
    q = np.broadcast_to(np.arange(58)[:, None]/19., (58, 17))
    second = SBP42Second(17, .125)
    np.testing.assert_array_equal(second.second_derivative(q, 1), np.zeros_like(q))
    for key in ("evolution_connected", "physical_boundary_validated", "runtime_writeback",
                "fully_compatible_S_equals_D1"):
        assert second.identity[key] is False


@pytest.mark.parametrize("n,spacing", [(8, .1), (True, .1), (9., .1), (9, 0.), (9, -1.), (9, float('inf'))])
def test_bad_grid_rejected(n, spacing):
    with pytest.raises(ValueError):
        SBP42Second(n, spacing)


@pytest.mark.parametrize("q,axis", [(np.zeros(8), 0), (np.ones(9)*np.nan, 0), (np.ones(9)*1j, 0),
                                  (np.zeros(9), True), (np.zeros(9), 1), (np.zeros((9, 0)), 0)])
def test_bad_field_rejected(q, axis):
    with pytest.raises(ValueError):
        SBP42Second(9, .25).second_derivative(q, axis)


@pytest.mark.parametrize("side", [True, -1, 2, 0.])
def test_invalid_side_rejected(side):
    with pytest.raises(ValueError):
        SBP42Second(9, .25).boundary_derivative(np.ones(9), side)


def test_dense_grid_cap():
    with pytest.raises(ValueError):
        SBP42Second(259, .1).matrix()

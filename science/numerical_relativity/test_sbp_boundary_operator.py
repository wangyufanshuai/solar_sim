"""Spatial algebra and scalar energy controls, not a physical boundary campaign."""
from dataclasses import FrozenInstanceError
from fractions import Fraction as F

import numpy as np
import pytest

from .sbp_boundary_operator import LEFT_ROWS, NORM_EDGE, SBP42


def test_exact_rational_sbp_identity_and_moments_on_nine_nodes():
    n = 9
    d = [[F(0) for _ in range(n)] for _ in range(n)]
    h = [F(1) for _ in range(n)]
    for i, row in enumerate(LEFT_ROWS):
        h[i] = h[-1-i] = F(*NORM_EDGE[i])
        for j, pair in enumerate(row):
            d[i][j], d[-1-i][-1-j] = F(*pair), -F(*pair)
    for j, v in ((2, F(1, 12)), (3, F(-2, 3)), (5, F(2, 3)), (6, F(-1, 12))):
        d[4][j] = v
    for i in range(n):
        for j in range(n):
            boundary = -1 if i == j == 0 else 1 if i == j == n-1 else 0
            assert h[i]*d[i][j]+h[j]*d[j][i] == boundary
        for degree in range(5 if i == 4 else 3):
            expected = 0 if degree == 0 else degree*i**(degree-1)
            assert sum(d[i][j]*j**degree for j in range(n)) == expected


@pytest.mark.parametrize("n", [9, 17, 25, 33, 65])
def test_floating_matrix_obeys_sbp_and_positive_norm(n):
    op = SBP42(n, 1./(n-1))
    d, h = op.matrix(), op.norm_weights
    boundary = np.zeros((n, n))
    boundary[0, 0], boundary[-1, -1] = -1., 1.
    assert np.all(h > 0.)
    np.testing.assert_allclose(h[:, None]*d+d.T*h[None, :], boundary, rtol=0., atol=6.e-16)
    assert abs(h.sum()-1.) < 3.e-16
    assert not h.flags.writeable


@pytest.mark.parametrize("axis", range(4))
@pytest.mark.parametrize("degree", range(5))
def test_all_array_axes_and_polynomial_orders(axis, degree):
    n = 17
    shape = [2, 3, 4, 5]
    shape[axis] = n
    x = np.indices(shape)[axis]/(n-1)
    op = SBP42(n, 1./(n-1))
    value = x**degree
    before = value.copy()
    actual = op.derivative(value, axis)
    exact = np.zeros_like(x) if degree == 0 else degree*x**(degree-1)
    if degree <= 2:
        np.testing.assert_allclose(actual, exact, rtol=0., atol=8.e-14)
    else:
        interior = [slice(None)]*4
        interior[axis] = slice(4, -4)
        np.testing.assert_allclose(actual[tuple(interior)], exact[tuple(interior)], rtol=0., atol=8.e-14)
    np.testing.assert_array_equal(value, before)


def test_boundary_order_is_not_misrepresented_as_fourth_order():
    op = SBP42(17, .0625)
    x = np.linspace(0., 1., 17)
    errors = op.derivative(x**3)-3.*x*x
    assert abs(errors[0]) > 1.e-5
    assert op.identity["boundary_order"] == 2
    assert op.identity["interior_order"] == 4
    assert not op.identity["physical_boundary_validated"]
    assert not op.identity["runtime_writeback"]


def test_all58_constant_slots_are_exactly_preserved():
    op = SBP42(9, .125)
    q = np.broadcast_to(np.arange(58)[:, None, None, None]/13., (58, 9, 9, 9))
    for axis in (1, 2, 3, -1):
        np.testing.assert_array_equal(op.derivative(q, axis), np.zeros_like(q))


@pytest.mark.parametrize("speed", [-2., -.2, 0., .2, 2.])
@pytest.mark.parametrize("n", [9, 17, 33])
def test_homogeneous_scalar_sat_energy_identity(speed, n):
    op = SBP42(n, 1./(n-1))
    q = np.random.default_rng(531).normal(size=n)
    rhs = op.scalar_advection_rhs(q, speed)
    rate = np.dot(q*op.norm_weights, rhs)
    expected = -.5*abs(speed)*(q[0]**2+q[-1]**2)
    assert rate == pytest.approx(expected, rel=0., abs=5.e-14)


@pytest.mark.parametrize("speed", [-1.25, 1.25])
def test_inhomogeneous_sat_uses_only_incoming_data(speed):
    op = SBP42(17, .125)
    q = np.linspace(-1., 2., 17)**2
    rhs = op.scalar_advection_rhs(q, speed, left_data=.7, right_data=-.3)
    incoming, outgoing, data = (q[0], q[-1], .7) if speed > 0. else (q[-1], q[0], -.3)
    expected = .5*abs(speed)*(data*data-(incoming-data)**2-outgoing*outgoing)
    assert np.dot(q*op.norm_weights, rhs) == pytest.approx(expected, abs=3.e-14)
    other = op.scalar_advection_rhs(q, speed, left_data=.7 if speed > 0. else 999.,
        right_data=-.3 if speed < 0. else 999.)
    np.testing.assert_array_equal(rhs, other)


@pytest.mark.parametrize("n", [8, 0, -1, 17., True])
def test_bad_grid_size_rejected(n):
    with pytest.raises(ValueError):
        SBP42(n, .1)


@pytest.mark.parametrize("spacing", [0., -1., True, 1.j, float("nan"), float("inf")])
def test_bad_spacing_rejected(spacing):
    with pytest.raises(ValueError):
        SBP42(17, spacing)


@pytest.mark.parametrize("defect", ["axis", "bool-axis", "shape", "empty", "nan", "complex"])
def test_bad_field_rejected(defect):
    op, q, axis = SBP42(9, .125), np.ones(9), 0
    if defect == "axis":
        axis = 1
    elif defect == "bool-axis":
        axis = False
    elif defect == "shape":
        q = np.ones(10)
    elif defect == "empty":
        q = np.empty((9, 0))
    elif defect == "nan":
        q[0] = np.nan
    else:
        q = q.astype(complex)
    with pytest.raises(ValueError):
        op.derivative(q, axis)


@pytest.mark.parametrize("defect", ["speed", "left", "right", "shape"])
def test_bad_sat_scope_rejected(defect):
    op, q = SBP42(9, .125), np.ones(9)
    with pytest.raises(ValueError):
        op.scalar_advection_rhs(q[:, None] if defect == "shape" else q,
            float("inf") if defect == "speed" else 1.,
            left_data=float("nan") if defect == "left" else 0.,
            right_data=1.j if defect == "right" else 0.)


def test_operator_parameters_are_frozen_and_dense_diagnostics_bounded():
    op = SBP42(9, .125)
    with pytest.raises(FrozenInstanceError):
        op.spacing = .25
    with pytest.raises(ValueError):
        SBP42(300, .1).matrix()

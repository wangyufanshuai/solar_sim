"""Small exact-algebra and fail-closed controls, owned batch execution only."""

from decimal import Decimal, localcontext
from fractions import Fraction as F

import numpy as np
import pytest

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_profile_exact_coefficients as Q


@pytest.mark.parametrize("bad", [[], [F(1)], [[[F(1)]]], [[1]], [[1.0]]])
def test_only_explicit_two_dimensional_fractions_are_accepted(bad):
    with pytest.raises(ValueError):
        R.exact_array(bad)


def test_sparse_product_retains_arbitrarily_small_nonzero_coefficients():
    tiny = F(1, 10**90)
    a = np.array([[F(1), tiny]], dtype=object)
    b = np.array([[F(2)], [F(3)]], dtype=object)
    assert R.product(a, b)[0, 0] == 2 + 3 * tiny


def test_product_rejects_incompatible_dimensions():
    with pytest.raises(ValueError):
        R.product(R.eye(2), R.eye(3))


def test_quotient_is_independent_of_distinct_exact_sections():
    d = np.array([[F(1), F(0), F(1)], [F(0), F(1), F(0)]], dtype=object)
    a = R.eye(3)
    a[0, 0] = a[2, 2] = F(2)
    a[1, 1] = F(3)
    first, j, p = R.quotient(d, a)
    second, k, q = R.quotient(d, a, reverse=True)
    assert p == [0, 1] and q == [2, 1] and not np.array_equal(j, k)
    assert np.array_equal(first, second)
    assert np.array_equal(first, np.array([[F(2), F(0)], [F(0), F(3)]], dtype=object))
    assert np.array_equal(R.product(first, d), R.product(d, a))
    assert all(np.array_equal(x, y) for x, y in zip(R.quotient(d, a)[:2], (first, j)))


def test_rank_deficiency_is_not_repaired_by_pseudoinverse():
    d = np.array([[F(1), F(0)], [F(2), F(0)]], dtype=object)
    with pytest.raises(ValueError, match="not full row rank"):
        R.right_inverse(d)


def test_wrong_main_shape_is_rejected():
    with pytest.raises(ValueError):
        R.quotient(R.eye(2), R.eye(3))


@pytest.mark.parametrize("reverse", [0, "reverse"])
def test_nonboolean_pivot_choice_is_rejected(reverse):
    with pytest.raises(ValueError):
        R.right_inverse(R.eye(2), reverse=reverse)


def test_a_right_inverse_does_not_manufacture_kernel_invariance():
    d = np.array([[F(1), F(0)]], dtype=object)
    a = R.zeros(2, 2)
    a[0, 1] = F(1)
    assert np.array_equal(R.product(d, R.right_inverse(d)[0]), R.eye(1))
    for reverse in (False, True):
        with pytest.raises(ValueError, match="kernel is not invariant"):
            R.quotient(d, a, reverse=reverse)


def test_base_lapse_and_offdiagonal_metric_columns_keep_definition_factors():
    b = Q.case12()
    d = R.leading(b)
    lapse, metric = R.zeros(43, 1), R.zeros(43, 1)
    for k in range(3):
        lapse[8 + k, 0] = -b.ray[k]
        metric[20 + 6 * k + 1, 0] = -b.ray[k] / 2
    assert np.array_equal(d[:, 6:7], lapse)
    assert np.array_equal(d[:, 1:2], metric)


@pytest.mark.parametrize("k", [0, 1, 2])
def test_hamiltonian_conformal_gradient_has_physical_factor_four(k):
    b = Q.case12()
    u = Q.inverse(b.metric)
    expected = 4 * b.chi * sum(u[k][j] * b.ray[j] for j in range(3))
    assert R.leading(b)[0, 55 + k] == expected


def test_momentum_and_trace_use_full_symmetric_contractions():
    b = Q.case12()
    u, d = Q.inverse(b.metric), R.leading(b)
    assert [d[1 + i, 17] for i in range(3)] == [-2 * x / 3 for x in b.ray]
    assert d[42, 12] == 2 * u[0][1]
    assert d[41, 38] == 4 * b.ray[0] * u[0][1]
    assert all(d[5 + i, 19 + j] == b.metric[i][j] / 2 for i in range(3) for j in range(3))


def test_auxiliary_ode_projector_intertwines_only_the_eleven_base_modes():
    b = Q.case12()
    d, o = R.leading(b), R.ode_projector(b)
    o58 = R.zeros(58, 58)
    o58[:11, :11] = R.eye(11)
    assert np.array_equal(R.product(o, o), o) and sum(o.diagonal()) == 11
    assert np.array_equal(R.product(o, d), R.product(d, o58))


def test_missing_determinant_compensation_fails_full_rank():
    d = R.leading(Q.case12())
    d[41] = F(0)
    with pytest.raises(ValueError, match="not full row rank"):
        R.right_inverse(d)


@pytest.mark.parametrize("precision", [50, 70])
def test_similarity_and_normal_scalings_are_undone_explicitly(precision):
    b = Q.case12()
    a, d = R.zeros(43, 43), R.zeros(43, 58)
    a[0, 4] = a[4, 0] = a[4, 4] = F(1)
    d[0, 0] = d[4, 0] = d[4, 11] = F(1)
    principal = R.normalized(a, b, kind="principal", precision=precision)
    mapping = R.normalized(d, b, kind="leading", precision=precision)
    with localcontext() as ctx:
        ctx.prec = precision
        assert principal[0, 4] == mapping[0, 0] == Decimal(1) / 6
        assert principal[4, 0] == mapping[4, 11] == 1
        assert principal[4, 4] == mapping[4, 0] == Decimal(1) / Decimal(6).sqrt()


@pytest.mark.parametrize("kind,shape", [("fitted", (43, 43)), ("leading", (43, 43)), ("principal", (42, 42))])
def test_unregistered_scaling_requests_are_rejected(kind, shape):
    with pytest.raises(ValueError):
        R.normalized(R.zeros(*shape), Q.case12(), kind=kind)


def test_intrinsic_shift_preserves_the_auxiliary_ode_subspace():
    b = Q.case12()
    o = R.ode_projector(b)
    a = b.shift_ray * (R.eye(43) - o)
    assert not np.any(R.intrinsic(a, b))
    assert np.any(a - b.shift_ray * R.eye(43))


def test_mutated_coefficient_is_rejected_by_unchanged_comparison_threshold():
    expected = np.array([[Decimal(1), Decimal(0)]], dtype=object)
    report = Q.compare(np.array([[1., 1e-8]]), expected)
    assert report["relative"] > 2e-12
    assert report["coefficient_fitting"] is False and report["input_substituted"] is False

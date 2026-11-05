"""Control tests for the unqualified full-symbol candidate; owned run only."""

from decimal import Decimal, localcontext
from fractions import Fraction as F

import numpy as np
import pytest

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_constraint_full_symbol as A
from scripts import nr_profile_exact_coefficients as Q


@pytest.fixture(scope="module")
def case12():
    b = Q.case12()
    return b, A.physical_coefficients(b), A.source(b)


def test_source_retains_base_gauge_and_damping_terms(case12):
    b, _, j = case12
    assert j[6, 17] == -2 and j[6, 18] == 4
    assert j[17, 18] == -3 * b.alpha / 10 and j[18, 18] == -b.alpha / 5
    assert not np.any(j[25:]) and not np.any(j[:, 6])
    for k in range(3):
        assert j[6, 25 + k] == j[10, 55 + k] == b.shift[k]
        assert j[7 + k, 22 + k] == 3 * b.alpha * b.chi
        assert j[19 + k, 19 + k] == j[22 + k, 19 + k] == -b.alpha / 10


def test_determinant_and_trace_relaxation_have_factor_three(case12):
    b, _, j = case12
    u = Q.inverse(b.metric)
    trace = np.array([[u[i][k] * (1 if i == k else 2) for i, k in Q.PAIRS]], dtype=object)
    assert np.array_equal(R.product(trace, j[:6, :6]), -3 * trace)
    assert np.array_equal(R.product(trace, j[11:17, 11:17]), -3 * trace)
    assert all(j[index, 1] == -2 * b.metric[i][k] * u[0][1]
               for index, (i, k) in enumerate(Q.PAIRS))


def test_hamiltonian_and_momentum_true_derivative_orders(case12):
    b, c, _ = case12
    u = Q.inverse(b.metric)
    norm = sum(b.ray[i] * u[i][j] * b.ray[j] for i in range(3) for j in range(3))
    assert not np.any(c[0][:4]) and not np.any(c[1][0])
    assert not np.any(c[2][1:])
    assert c[2][0, 10] == 4 * b.chi * norm
    assert [c[1][1 + i, 17] for i in range(3)] == [-2 * x / 3 for x in b.ray]


def test_z_and_definition_metric_half_factors(case12):
    b, c, _ = case12
    u, v = Q.inverse(b.metric), b.ray
    vu = [sum(u[i][j] * v[j] for j in range(3)) for i in range(3)]
    for i in range(3):
        contracted = vu[1] if i == 0 else vu[0] if i == 1 else F(0)
        assert c[1][5 + i, 1] == -(contracted - v[i] * u[0][1]) / 2
        assert c[0][20 + 6 * i + 1, 37 + 6 * i + 1] == 1
        assert c[1][20 + 6 * i + 1, 1] == -v[i] / 2


def toy():
    c0, c1, c2 = (R.zeros(1, 2) for _ in range(3))
    c0[0, 0], c1[0, 1] = F(1), F(1)
    return (c0, c1, c2), (2 * R.eye(2), R.zeros(2, 2))


def test_coefficient_matching_gives_the_same_unique_polynomial_with_two_sections():
    c, l = toy()
    first, second = A.derive(c, l), A.derive(c, l, reverse=True)
    assert not np.array_equal(first["section"], second["section"])
    assert len(first["pivots"]) == 3 and first["operator"].shape == (3, 10)
    for actual, other, expected in zip(first["coefficients"], second["coefficients"], (2, 0, 0), strict=True):
        assert np.array_equal(actual, other) and actual[0, 0] == expected
    assert not np.any(first["residual"])


def test_highest_polynomial_coefficient_is_retained_and_constrained():
    c = (R.zeros(1, 1), R.zeros(1, 1), R.eye(1))
    l = (R.zeros(1, 1), R.eye(1))
    result = A.derive(c, l)
    assert result["target"].shape == (1, 5) and result["operator"][2, 4] == 1
    assert [x[0, 0] for x in result["coefficients"]] == [0, 1, 0]
    assert len(A.polynomial_product(c, c)) == 5
    assert A.polynomial_product(c, c)[4][0, 0] == 1


def test_nonclosed_polynomial_constraints_are_not_repaired():
    c0 = np.array([[F(1), F(0)]], dtype=object)
    c = (c0, R.zeros(1, 2), R.zeros(1, 2))
    j = R.zeros(2, 2)
    j[0, 1] = F(1)
    original_c0, original_j = c0.copy(), j.copy()
    with pytest.raises(A.PolynomialClosureError, match="full polynomial intertwining failed") as caught:
        A.derive(c, (j, R.zeros(2, 2)))
    evidence = caught.value.evidence
    assert isinstance(caught.value, ValueError)
    assert np.count_nonzero(evidence["residual"]) == 1
    assert evidence["residual"][0, 1] == -1
    joined = np.hstack(evidence["coefficients"])
    assert np.array_equal(R.product(joined, evidence["operator"]) - evidence["target"], evidence["residual"])
    assert np.array_equal(R.product(evidence["operator"], evidence["section"]), R.eye(3))
    assert np.array_equal(c0, original_c0) and np.array_equal(j, original_j)


@pytest.mark.parametrize("degree", [0, 1, 3, True])
def test_degree_search_or_discarding_terms_is_rejected(degree):
    c, l = toy()
    with pytest.raises(ValueError):
        A.coefficient_system(c, l, degree=degree)


def test_rank_deficient_coefficient_system_is_rejected():
    with pytest.raises(ValueError, match="not full row rank"):
        A.derive((R.zeros(1, 2),) * 3, (R.eye(2), R.zeros(2, 2)))


def test_zero_frequency_cannot_have_a_full43_right_inverse(case12):
    _, c, _ = case12
    with pytest.raises(ValueError, match="not full row rank"):
        R.right_inverse(c[0])
    inverse, pivots = R.right_inverse(c[0][4:])
    assert len(pivots) == 39 and np.array_equal(R.product(c[0][4:], inverse), R.eye(39))


def test_zero_frequency_off_image_ambiguity_is_explicit(case12):
    _, c, _ = case12
    # A zero generator is a toy control, not the scientific case12 source.
    audit = A.zero_frequency(c, (R.zeros(43, 43),) * 3, R.zeros(58, 58))
    assert audit["rank"] == 39 and audit["full43_right_inverse_exists"] is False
    assert np.count_nonzero(audit["off_image_ambiguity"]) == 1
    assert not np.any(R.product(audit["off_image_ambiguity"], c[0]))


def test_zero_frequency_leak_into_unreachable_hm_rows_is_rejected(case12):
    _, c, _ = case12
    invalid = R.zeros(43, 43)
    invalid[0, 4] = F(1)
    with pytest.raises(ValueError, match="image is not invariant"):
        A.zero_frequency(c, (invalid,) * 3, R.zeros(58, 58))


@pytest.mark.parametrize("precision", [50, 70])
def test_fourier_frequency_conversion_preserves_minus_sign_and_zero(precision):
    b = Q.case12()
    coefficients = (R.eye(1), 2 * R.eye(1), 3 * R.eye(1))
    real, imag = A.frequency_value(coefficients, b, F(2), precision=precision)
    with localcontext() as ctx:
        ctx.prec = precision
        assert real[0, 0] == -1
        assert abs(imag[0, 0] - Decimal(4) / Decimal(6).sqrt()) < Decimal(10) ** (-precision + 3)
    real0, imag0 = A.frequency_value(coefficients, b, F(0), precision=precision)
    assert real0[0, 0] == 1 and imag0[0, 0] == 0


@pytest.mark.parametrize("rho", [F(-1), F(9), 1.0, True])
def test_invalid_frequency_is_not_clipped_or_repaired(rho):
    with pytest.raises(ValueError):
        A.frequency_value((R.eye(1),), Q.case12(), rho)


def test_polynomial_shapes_cannot_be_silently_broadcast():
    with pytest.raises(ValueError):
        A.polynomial_product((R.eye(1), R.eye(2)), (R.eye(1),))
    with pytest.raises(ValueError):
        A.coefficient_system((R.zeros(1, 2),) * 3, (R.eye(3), R.eye(3)))

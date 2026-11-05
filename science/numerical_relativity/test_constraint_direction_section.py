"""16 unexecuted candidate controls; owned authorized batch only."""

from dataclasses import replace
from fractions import Fraction as F

import numpy as np
import pytest

from scripts import nr_constraint_direction_section as S
from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_profile_exact_coefficients as Q


def unit(column):
    value = [F(0)] * 43
    value[column] = F(1)
    return value


def test_background_type_and_zero_ray_are_not_coerced():
    with pytest.raises(ValueError, match="Background"):
        S.lift(None, unit(0))
    with pytest.raises(ValueError, match="nonzero"):
        replace(Q.case12(), ray=(F(0), F(0), F(0)))


def test_constraint_length_is_exact():
    for length in (0, 42, 44):
        with pytest.raises(ValueError, match="43"):
            S.lift(Q.case12(), [F(0)] * length)


def test_float_integer_and_boolean_coordinates_are_not_design_rationals():
    for value in (0.0, 1, True):
        c = unit(0)
        c[7] = value
        with pytest.raises(ValueError, match="Fraction"):
            S.lift(Q.case12(), c)


def test_zero_constraints_lift_to_zero():
    assert not np.any(S.lift(Q.case12(), [F(0)] * 43))


def test_lift_is_exactly_linear_in_constraints():
    b = Q.case12()
    c = tuple(F(i - 21, 7) for i in range(43))
    d = tuple(F(4 - i, 13) for i in range(43))
    combined = tuple(3*x - 2*y for x, y in zip(c, d, strict=True))
    assert np.array_equal(S.lift(b, combined), 3*S.lift(b, c) - 2*S.lift(b, d))


def test_original_ray_section_has_all43_independent_constraint_columns():
    b = Q.case12()
    assert np.array_equal(R.product(R.leading(b), S.section(b)), R.eye(43))


def test_construction_does_not_call_a_map_or_matrix_inverse_solver(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("section must come from definitions")
    b = Q.case12()
    leading = R.leading(b)
    for name in ("leading", "right_inverse", "quotient"):
        monkeypatch.setattr(R, name, forbidden)
    assert np.array_equal(R.product(leading, S.section(b)), R.eye(43))


def test_metric_base_factor_two_and_longitudinal_sign():
    b = Q.case12()
    for p in range(6):
        q = S.lift(b, unit(20 + p))
        assert q[p] == -2*b.ray[0]/b.ray_squared


def test_momentum_and_trace_are_simultaneously_reproduced():
    b = Q.case12()
    c = [F(0)] * 43
    c[1:4], c[42] = [F(1), F(-2), F(3)], F(5)
    q, u = S.lift(b, c), Q.inverse(b.metric)
    w = [sum(u[i][j]*b.ray[j] for j in range(3)) for i in range(3)]
    a = lambda i, j: q[11 + Q.PAIR_INDEX[min(i, j), max(i, j)]]
    assert sum(u[i][j]*a(i, j) for i in range(3) for j in range(3)) == c[42]
    assert q[17] == -3*c[42]/2
    assert [sum(w[j]*a(j, i) for j in range(3)) for i in range(3)] == c[1:4]


def test_compensated_determinant_uses_metric_trace_and_ray_norm():
    b = Q.case12()
    q, u = S.lift(b, unit(41)), Q.inverse(b.metric)
    result = 2*sum(b.ray[k]*u[i][j]*q[37+6*k+Q.PAIR_INDEX[min(i,j), max(i,j)]]
                   for k in range(3) for i in range(3) for j in range(3))
    assert result == 1


def test_pure_hamiltonian_uses_longitudinal_p_without_base_substitution():
    b = Q.case12()
    q = S.lift(b, unit(0))
    g = b.metric_normal_squared * b.ray_squared
    assert all(q[55+k] == b.ray[k]/(4*b.chi*g) for k in range(3))
    assert not np.any(q[:55])


def test_z_reconstruction_has_the_factor_two():
    b = Q.case12()
    u = Q.inverse(b.metric)
    for j in range(3):
        q = S.lift(b, unit(5+j))
        assert all(q[19+i] == 2*u[i][j] for i in range(3))


def test_guard_failure_propagates_on_first_call_without_retry():
    calls = []
    def stop():
        calls.append(1)
        raise RuntimeError("owned stop")
    with pytest.raises(RuntimeError, match="owned stop"):
        S.section(Q.case12(), guard=stop)
    assert calls == [1]


def test_registered_direction_bounds_remain_exact_and_do_not_qualify_spectrum():
    bounds = S.case12_direction_bounds(Q.case12())
    assert bounds["metric_normal_lower"] == F(5, 6)
    assert bounds["metric_normal_upper"] == F(964403, 781250)
    assert bounds["branch_constants"] == (F(2601,100000), F(2601,50000), F(2601,5000),
                                           F(153,125), F(459,250), F(306,125))
    assert bounds["squared_speed_gap_lower"] == F(867,40000)
    assert bounds["claimed_spectrum_validated"] is bounds["direction_uniform_energy_validated"] is False


def test_case12_bound_rejects_changed_physical_background():
    with pytest.raises(ValueError, match="fixed case12"):
        S.case12_direction_bounds(replace(Q.case12(), alpha=F(1)))


def test_lift_does_not_modify_input_constraints():
    c = unit(42)
    before = c.copy()
    S.lift(Q.case12(), c)
    assert c == before

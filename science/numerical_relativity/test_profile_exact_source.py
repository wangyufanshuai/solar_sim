"""Small source/input-contract controls; run only in the owned case12 batch."""

from dataclasses import replace
from decimal import Decimal, localcontext
from fractions import Fraction as F
from unittest.mock import patch

import numpy as np
import pytest

from scripts import nr_profile_exact_coefficients as Q
from . import profile_hermite_candidate as A


def test_case12_design_inverse_and_direction():
    background = Q.case12()
    h, u = background.metric, Q.inverse(background.metric)
    assert Q.determinant(h) == 1
    assert background.ray_squared == 6 and background.shift_ray == -F(1, 10)
    assert 3 * background.alpha * background.chi == F(459, 250)
    assert background.chi / 5 == F(18, 125)
    assert all(sum(h[i][k] * u[k][j] for k in range(3)) == int(i == j)
               for i in range(3) for j in range(3))


@pytest.mark.parametrize("change", [
    {"alpha": F(0)}, {"alpha": F(2)}, {"alpha": .85}, {"alpha": True},
    {"chi": F(0)}, {"chi": F(-1)}, {"ray": (0, 0, 0)}, {"ray": (1, 2)},
    {"ray": (1, 2, -1.)}, {"shift": (0, 0)},
    {"metric": ((1, 0), (0, 1))},
    {"metric": ((1, 1, 0), (0, 1, 0), (0, 0, 1))},
    {"metric": ((2, 0, 0), (0, 1, 0), (0, 0, 1))},
    {"metric": ((-1, 0, 0), (0, -1, 0), (0, 0, 1))},
])
def test_invalid_background_rejected_without_repair(change):
    with pytest.raises(ValueError):
        replace(Q.case12(), **change)


@pytest.mark.parametrize("precision", [50, 70])
def test_analytical_nodes_are_symmetric_ordered_and_squared(precision):
    background = Q.case12()
    roots = Q.nodes(background, precision=precision)
    assert len(roots) == 13 and roots[6] == 0
    assert all(a == b.copy_negate() for a, b in zip(roots, reversed(roots)))
    assert all(a < b for a, b in zip(roots[:-1], roots[1:]))
    with localcontext() as ctx:
        ctx.prec = precision
        assert max(abs(a * a - Q.decimal(s)) for a, s in zip(roots[7:], background.squared_speeds())) <= Decimal(10) ** (-precision + 4)


@pytest.mark.parametrize("precision", [49, 51, True, 70.0])
def test_unregistered_precision_rejected(precision):
    with pytest.raises(ValueError):
        Q.nodes(Q.case12(), precision=precision)


def test_intrinsic_shift_leaves_all_ode_modes_zero():
    background = Q.case12()
    raw = np.full((58, 58), F(0), dtype=object)
    for i in range(11, 58):
        raw[i, i] = background.shift_ray
    assert not np.any(Q.intrinsic(raw, background))
    assert not np.any(raw[:11]) and not np.any(raw[:, :11])


def test_normalization_is_explicit_not_metric_unit():
    background = Q.case12()
    raw = np.array([[F(1), F(2), F(-1)]], dtype=object)
    normalized = Q.normalized(raw, background)
    with localcontext() as ctx:
        ctx.prec = 70
        assert abs(sum(x*x for x in normalized[0]) - 1) < Decimal("1e-65")
        assert background.metric_normal_squared != 1


def test_coefficient_comparison_detects_mutation():
    expected = np.array([[Decimal(1), Decimal(0)]], dtype=object)
    report = Q.compare(np.array([[1., 1e-8]]), expected)
    assert report["relative"] > 2e-12 and report["unequal_to_rounded_design"] == 1
    assert report["input_substituted"] is False


def test_shifted_adapter_passes_new_actual_input_not_a_cached_matrix():
    background = Q.case12()
    roots = Q.nodes(background)
    raw = np.diag(np.linspace(-1, 1, 47)).astype(np.float64)
    before = raw.copy()
    with patch.object(A.V, "hermite_projectors", return_value=np.zeros((13, 47, 47))) as construct:
        A.shifted_projectors(raw, .125, roots)
        assert np.array_equal(construct.call_args.args[0], raw - .125 * np.eye(47))
        changed = raw.copy()
        changed[0, 1] = 1e-7
        A.shifted_projectors(changed, .125, roots)
        assert construct.call_args.args[0][0, 1] == 1e-7
        assert construct.call_count == 2
    assert np.array_equal(raw, before)


def test_adapter_rejects_ode_block_shift_and_incomplete_evidence():
    with pytest.raises(ValueError):
        A.shifted_projectors(np.zeros((58, 58)), .125, Q.nodes(Q.case12()))
    with pytest.raises(ValueError):
        A.candidate({}, Q.nodes(Q.case12()))

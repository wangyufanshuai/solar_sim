"""Small exact controls for integer convolution and the owned energy-v2 wiring.

No full scientific matrix or saved energy candidate is evaluated here. The
frozen Fraction convolution remains the independent oracle for a fixed grid.
"""

import copy
from fractions import Fraction as F
import importlib.util
import os
from pathlib import Path
import sys

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned supervisor required before polynomial arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import nr_integer_polynomial_replay as R  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

ZERO = (0, 0, 0)


def load_runner(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def v1():
    return load_runner(
        "owned_integer_oracle_v1", "run-nr-k3-case12-polynomial-energy.py"
    )


@pytest.fixture(scope="module")
def v2():
    return load_runner(
        "owned_integer_integration_v2", "run-nr-k3-case12-polynomial-energy-v2.py"
    )


def grid_polynomials():
    return (
        {},
        {ZERO: F(-7, 15)},
        {(1, 0, 0): F(1, 2), (0, 1, 0): F(-2, 3), (0, 0, 1): F(1, 5)},
        {(2, 0, 0): F(7, 11), (0, 1, 1): F(-13, 17), ZERO: F(19, 23)},
    )


def scaled(poly, factor):
    return {
        power: coefficient * factor
        for power, coefficient in poly.items()
        if coefficient * factor
    }


def malformed(case):
    if case == "container":
        return [(ZERO, F(1))]
    if case == "short-exponent":
        return {(1, 2): F(1)}
    if case == "long-exponent":
        return {(1, 2, 3, 4): F(1)}
    if case == "negative-exponent":
        return {(-1, 0, 0): F(1)}
    if case == "float-exponent":
        return {(1.0, 0, 0): F(1)}
    if case == "bool-exponent":
        return {(True, 0, 0): F(1)}
    if case == "string-exponent":
        return {"xyz": F(1)}
    coefficients = {
        "integer": 1,
        "float": 1.0,
        "bool": True,
        "zero": F(0),
        "string": "1",
    }
    return {ZERO: coefficients[case]}


def test_integer_multivariate_product_matches_six_hand_calculated_rationals():
    left = {(1, 0, 0): F(1, 2), (0, 1, 0): F(-2, 3), (0, 0, 1): F(1, 5)}
    right = {(1, 0, 0): F(3, 7), (0, 1, 0): F(5, 11), (0, 0, 1): F(-1, 13)}
    expected = {
        (2, 0, 0): F(3, 14),
        (1, 1, 0): F(-9, 154),
        (1, 0, 1): F(43, 910),
        (0, 2, 0): F(-10, 33),
        (0, 1, 1): F(61, 429),
        (0, 0, 2): F(-1, 65),
    }
    before = (dict(left), dict(right))
    assert R.multiply_polynomials(left, right) == expected
    assert (left, right) == before


def test_integer_exponent_coordinates_do_not_alias_under_a_packed_base_carry():
    left = {(8, 0, 0): F(1), (0, 1, 0): F(2)}
    right = {(5, 0, 0): F(3), (0, 0, 1): F(-5)}
    expected = {(13, 0, 0): F(3), (8, 0, 1): F(-5), (5, 1, 0): F(6), (0, 1, 1): F(-10)}
    assert R.multiply_polynomials(left, right) == expected
    assert (3, 1, 0) not in expected
    large = 2**80 + 3
    assert R.multiply_polynomials({(large, 0, 1): F(2)}, {(5, large, 0): F(-3)}) == {
        (large + 5, large, 1): F(-6)
    }


def test_integer_axis_vanishing_polynomial_product_is_preserved_as_nonzero():
    result = R.multiply_polynomials(
        {(1, 1, 1): F(1)}, {(1, 0, 0): F(1), (0, 1, 0): F(-1)}
    )
    assert result == {(2, 1, 1): F(1), (1, 2, 1): F(-1)}
    with pytest.raises(ValueError):
        V.zero_check([[result]], (1, 1))


def test_integer_large_coefficients_and_denominators_do_not_use_float_or_digit_carry():
    a, b, coefficient = 2**127 - 1, 3**79 + 7, 10**90 + 7
    left = {(1, 0, 0): F(coefficient, a), ZERO: F(1, b)}
    right = {(1, 0, 0): F(coefficient, a), ZERO: F(-1, b)}
    expected = {(2, 0, 0): F(coefficient**2, a**2), ZERO: F(-1, b**2)}
    result = R.multiply_polynomials(left, right)
    assert result == expected and all(type(value) is F for value in result.values())
    assert (1, 0, 0) not in result


@pytest.mark.parametrize(
    "left_index,right_index",
    [
        (0, 0),
        (0, 1),
        (0, 2),
        (0, 3),
        (1, 0),
        (1, 1),
        (1, 2),
        (1, 3),
        (2, 0),
        (2, 1),
        (2, 2),
        (2, 3),
        (3, 0),
        (3, 1),
        (3, 2),
        (3, 3),
    ],
)
def test_integer_fixed_small_grid_matches_frozen_fraction_convolution(
    left_index, right_index
):
    polynomials = grid_polynomials()
    left, right = polynomials[left_index], polynomials[right_index]
    expected = {}
    V.add_product(expected, left, right)
    result = R.multiply_polynomials(left, right)
    assert result == expected
    V.encode_polynomial(result)


def test_integer_same_operand_square_and_zero_outputs_do_not_alias_inputs():
    operand = {(1, 0, 0): F(1), (0, 1, 0): F(-1)}
    original = dict(operand)
    result = R.multiply_polynomials(operand, operand)
    assert result == {(2, 0, 0): F(1), (1, 1, 0): F(-2), (0, 2, 0): F(1)}
    result[ZERO] = F(5)
    assert operand == original
    empty = {}
    zero_result = R.multiply_polynomials(empty, operand)
    assert zero_result == {} and zero_result is not empty and zero_result is not operand


@pytest.mark.parametrize("factor", [F(1), F(-3, 5), F(0)])
def test_integer_accumulator_preserves_exact_factor_and_cancels_only_exact_zero(factor):
    left, right = grid_polynomials()[2:]
    target = {ZERO: F(7, 11), (3, 0, 0): F(-7, 22)}
    expected = dict(target)
    V.add_product(expected, left, right, factor=factor)
    assert R.exact_add_product(target, left, right, factor=factor) is None
    assert target == expected
    V.encode_polynomial(target)


def test_integer_accumulated_product_removes_every_cancelled_monomial():
    left = {(1, 0, 0): F(1), (0, 1, 0): F(1)}
    right = {(1, 0, 0): F(1), (0, 1, 0): F(-1)}
    target = {(2, 0, 0): F(-1), (0, 2, 0): F(1)}
    R.exact_add_product(target, left, right)
    assert target == {}


@pytest.mark.parametrize("alias", ["left", "right", "both"])
def test_integer_ambiguous_target_alias_is_refused_without_changing_any_input(alias):
    target = {(1, 0, 0): F(1), ZERO: F(2)}
    other = {(0, 1, 0): F(3)}
    left = target if alias in ("left", "both") else other
    right = target if alias in ("right", "both") else other
    before = (dict(target), dict(other))
    with pytest.raises(ValueError):
        R.exact_add_product(target, left, right)
    assert (target, other) == before


@pytest.mark.parametrize("side", ["left", "right"])
@pytest.mark.parametrize(
    "case",
    [
        "container",
        "short-exponent",
        "long-exponent",
        "negative-exponent",
        "float-exponent",
        "bool-exponent",
        "string-exponent",
        "integer",
        "float",
        "bool",
        "zero",
        "string",
    ],
)
def test_integer_invalid_canonical_operand_is_not_hidden_by_multiplication_by_zero(
    side, case
):
    bad = malformed(case)
    left, right = (bad, {}) if side == "left" else ({}, bad)
    with pytest.raises(ValueError):
        R.multiply_polynomials(left, right)


@pytest.mark.parametrize("factor", [1, True, 0.0, "1", None])
def test_integer_accumulator_rejects_non_fraction_factors_before_mutation(factor):
    target = {ZERO: F(5)}
    with pytest.raises(ValueError):
        R.exact_add_product(target, {}, {}, factor=factor)
    assert target == {ZERO: F(5)}


@pytest.mark.parametrize("bad_location", ["target", "left", "right"])
def test_integer_zero_factor_still_validates_every_polynomial(bad_location):
    values = {"target": {ZERO: F(5)}, "left": {}, "right": {}}
    values[bad_location] = {ZERO: 1.0}
    before = copy.deepcopy(values)
    with pytest.raises(ValueError):
        R.exact_add_product(
            values["target"], values["left"], values["right"], factor=F(0)
        )
    assert values == before


@pytest.mark.parametrize("operation", ["multiply", "add", "zero-factor"])
def test_integer_deadline_callback_exception_is_propagated_without_mutating_inputs(
    operation,
):
    target, left, right = {ZERO: F(7)}, {(1, 0, 0): F(1)}, {(0, 1, 0): F(2)}
    before = copy.deepcopy((target, left, right))

    def stop():
        raise RuntimeError("owned integer deadline stop")

    with pytest.raises(RuntimeError, match="owned integer deadline stop"):
        if operation == "multiply":
            R.multiply_polynomials(left, right, check=stop)
        else:
            R.exact_add_product(
                target,
                left,
                right,
                factor=F(0) if operation == "zero-factor" else F(1),
                check=stop,
            )
    assert (target, left, right) == before


def test_integer_late_callback_failure_leaves_the_accumulator_transaction_unchanged():
    left, right = grid_polynomials()[2:]
    baseline_target = {ZERO: F(11)}
    checks = []
    R.exact_add_product(baseline_target, left, right, check=lambda: checks.append(1))
    assert len(checks) >= 2
    target, calls = {ZERO: F(11)}, []

    def stop_at_final_checkpoint():
        calls.append(1)
        if len(calls) == len(checks):
            raise RuntimeError("owned late integer stop")

    with pytest.raises(RuntimeError, match="owned late integer stop"):
        R.exact_add_product(target, left, right, check=stop_at_final_checkpoint)
    assert target == {ZERO: F(11)}


def test_integer_inner_convolution_checks_deadline_across_4096_paired_products():
    assert R.CHECK_INTERVAL == 4096
    short_checks, long_checks = [], []
    one = {ZERO: F(1)}
    assert R.multiply_polynomials(one, one, check=lambda: short_checks.append(1)) == one
    polynomial = {(degree, 0, 0): F(1) for degree in range(65)}
    result = R.multiply_polynomials(
        polynomial, polynomial, check=lambda: long_checks.append(1)
    )
    expected = {(degree, 0, 0): F(65 - abs(64 - degree)) for degree in range(129)}
    assert result == expected
    # 4225 pairs cross the inner deadline boundary; all input/output lists are
    # shorter than 4096, so this is not an input validation/output-length check.
    assert len(long_checks) > len(short_checks)


@pytest.mark.parametrize("check", [None, False, 1])
def test_integer_noncallable_deadline_is_refused(check):
    with pytest.raises(ValueError):
        R.multiply_polynomials({}, {}, check=check)


def test_integer_v2_rectangular_product_matches_hand_result_and_original_v1(v1, v2):
    x, y, z = {(1, 0, 0): F(1)}, {(0, 1, 0): F(1)}, {(0, 0, 1): F(1)}
    left = [[x, {ZERO: F(1)}, {}], [{}, y, {ZERO: F(1)}]]
    right = [[{}, {ZERO: F(2)}], [{ZERO: F(3)}, {}], [{}, z]]
    before = copy.deepcopy((left, right))
    expected = [[{ZERO: F(3)}, scaled(x, F(2))], [scaled(y, F(3)), z]]
    assert (
        v2.independent_product(left, right)
        == expected
        == v1.independent_product(left, right)
    )
    assert (left, right) == before


def test_integer_v2_polynomial_weighted_gram_keeps_scaling_signs_and_matches_v1(v1, v2):
    p, d = {(1, 0, 0): F(1), (0, 1, 0): F(1)}, {(1, 0, 0): F(1), (0, 1, 0): F(2)}
    matrix = [[p, scaled(p, F(2))], [scaled(p, F(-3)), p]]
    diagonal = [d, scaled(d, F(3))]
    common = {(3, 0, 0): F(1), (2, 1, 0): F(4), (1, 2, 0): F(5), (0, 3, 0): F(2)}
    expected = [
        [scaled(common, F(28)), scaled(common, F(-7))],
        [scaled(common, F(-7)), scaled(common, F(7))],
    ]
    before = copy.deepcopy((matrix, diagonal))
    assert (
        v2.independent_gram(matrix, diagonal)
        == expected
        == v1.independent_gram(matrix, diagonal)
    )
    assert (matrix, diagonal) == before


def test_integer_v2_cache_evicts_at_its_entry_limit_without_altering_exact_products(v2):
    cache = v2.ProductCache()
    one = ((ZERO, F(1)),)
    for number in range(1, 1026):
        polynomial = ((ZERO, F(number)), ((1, 0, 0), F(1)))
        assert cache.product(one, polynomial) == dict(polynomial)
        assert len(cache.values) <= 1024 and cache.terms <= 100000
    assert len(cache.values) == 1 and cache.terms == 2


def test_integer_v2_product_cache_is_connected_to_the_new_engine_and_propagates_failures(
    v2, monkeypatch
):
    calls = []

    def stop(left, right, *, check=lambda: None):
        calls.append((left, right))
        raise RuntimeError("owned integer engine wiring stop")

    monkeypatch.setattr(v2.R, "multiply_polynomials", stop)
    with pytest.raises(RuntimeError, match="owned integer engine wiring stop"):
        v2.independent_product([[{ZERO: F(2)}]], [[{ZERO: F(3)}]])
    assert len(calls) == 1


def test_integer_v2_matrix_accumulation_is_connected_to_exact_add_product(
    v2, monkeypatch
):
    original_add, calls = v2.R.exact_add_product, []

    def record(target, left, right, **kwargs):
        calls.append(1)
        return original_add(target, left, right, **kwargs)

    monkeypatch.setattr(v2.R, "exact_add_product", record)
    target = [[{ZERO: F(1)}, {}]]
    value = [[{(1, 0, 0): F(2)}, {ZERO: F(3)}]]
    v2.accumulate_matrix(target, {ZERO: F(-1, 2)}, value)
    assert target == [[{ZERO: F(1), (1, 0, 0): F(-1)}, {ZERO: F(-3, 2)}]]
    assert len(calls) == 2

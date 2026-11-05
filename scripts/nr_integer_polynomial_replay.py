"""Exact, independent stdlib integer convolution for sparse QQ[x,y,z].

For A, choose D_A as the LCM of its coefficient denominators and g_A as
the content of the resulting integer polynomial.  Then A=(g_A/D_A)*a,
where a has integer coefficients.  The same construction for B gives
A*B=(g_A*g_B)/(D_A*D_B)*(a*b).  Every term of a*b is accumulated using
Python integers; only each final nonzero coefficient becomes a Fraction.

No degree, term, exponent, or integer-size restriction changes the input
domain.  The caller supplies a deadline-only check; it is called between
stages and every CHECK_INTERVAL items or paired products.  There is no
hidden cache, numerical library, float conversion, or sampled identity.
"""

from fractions import Fraction
from math import gcd, lcm
from typing import Callable, TypeAlias


Exponent: TypeAlias = tuple[int, int, int]
Polynomial: TypeAlias = dict[Exponent, Fraction]
Check: TypeAlias = Callable[[], None]

CHECK_INTERVAL = 4096


def _require(condition, message):
    if not condition:
        raise ValueError(message)


def _validated_terms(poly, *, check):
    """Snapshot the same exact in-memory domain as V.encode_polynomial."""
    _require(type(poly) is dict, "sparse polynomial dictionary required")
    check()
    terms = []
    for index, (exponent, coefficient) in enumerate(poly.items(), 1):
        _require(
            type(exponent) is tuple
            and len(exponent) == 3
            and all(type(power) is int and power >= 0 for power in exponent),
            "three exact nonnegative integer exponents required",
        )
        _require(
            type(coefficient) is Fraction and coefficient != 0,
            "nonzero Fraction coefficients required",
        )
        terms.append((exponent, coefficient))
        if index % CHECK_INTERVAL == 0:
            check()
    check()
    return terms


def _integer_form(terms, *, check):
    """Return (integer terms, positive content, positive denominator)."""
    check()
    denominator = 1
    for index, (_, coefficient) in enumerate(terms, 1):
        if denominator % coefficient.denominator:
            denominator = lcm(denominator, coefficient.denominator)
        if index % CHECK_INTERVAL == 0:
            check()
    check()

    integers = []
    content = 0
    for index, (exponent, coefficient) in enumerate(terms, 1):
        value = coefficient.numerator * (denominator // coefficient.denominator)
        integers.append((exponent, value))
        if content != 1:
            content = gcd(content, value)
        if index % CHECK_INTERVAL == 0:
            check()
    check()

    if content > 1:
        for index, (exponent, value) in enumerate(integers, 1):
            integers[index - 1] = (exponent, value // content)
            if index % CHECK_INTERVAL == 0:
                check()
    check()
    return integers, content or 1, denominator


def multiply_polynomials(
    left: Polynomial, right: Polynomial, *, check: Check = lambda: None
) -> Polynomial:
    """Return an exact new product; neither input is modified.

    Both inputs are validated even when one is zero.  ``left is right`` is
    permitted.  A callback exception propagates without modifying inputs.
    """
    _require(callable(check), "callable deadline check required")
    left_terms = _validated_terms(left, check=check)
    right_terms = _validated_terms(right, check=check)
    if not left_terms or not right_terms:
        check()
        return {}

    left_integers, left_content, left_denominator = _integer_form(
        left_terms, check=check
    )
    right_integers, right_content, right_denominator = _integer_form(
        right_terms, check=check
    )

    numerator_scale = left_content * right_content
    denominator = left_denominator * right_denominator
    common = gcd(numerator_scale, denominator)
    numerator_scale //= common
    denominator //= common
    check()

    convolution = {}
    paired_products = 0
    for (a0, a1, a2), a_value in left_integers:
        for (b0, b1, b2), b_value in right_integers:
            exponent = (a0 + b0, a1 + b1, a2 + b2)
            convolution[exponent] = convolution.get(exponent, 0) + a_value * b_value
            paired_products += 1
            if paired_products == CHECK_INTERVAL:
                check()
                paired_products = 0
    check()

    result = {}
    for index, (exponent, value) in enumerate(convolution.items(), 1):
        if value:
            result[exponent] = Fraction(value * numerator_scale, denominator)
        if index % CHECK_INTERVAL == 0:
            check()
    check()
    return result


def exact_add_product(
    target: Polynomial,
    left: Polynomial,
    right: Polynomial,
    *,
    factor: Fraction = Fraction(1),
    check: Check = lambda: None,
) -> None:
    """Accumulate ``factor * left * right`` after all fallible work/checks.

    The target must be distinct from both inputs.  Invalid inputs and
    callback exceptions leave it unchanged; all input dictionaries are
    read-only to this function.  Zero factors still validate all inputs.
    The final commit contains no callbacks or coefficient arithmetic.
    """
    _require(callable(check), "callable deadline check required")
    _require(type(factor) is Fraction, "Fraction accumulation factor required")
    _require(
        target is not left and target is not right,
        "accumulation target must not alias either input",
    )
    target_terms = _validated_terms(target, check=check)
    if not factor:
        _validated_terms(left, check=check)
        _validated_terms(right, check=check)
        check()
        return

    product = multiply_polynomials(left, right, check=check)
    updated = dict(target_terms)
    for index, (exponent, coefficient) in enumerate(product.items(), 1):
        value = updated.get(exponent, Fraction(0)) + factor * coefficient
        if value:
            updated[exponent] = value
        else:
            updated.pop(exponent, None)
        if index % CHECK_INTERVAL == 0:
            check()
    check()
    target.clear()
    target.update(updated)

"""Small exact controls; execution belongs to the registered owned batch.

No test constructs the full 43-by-43 certificate.  Axis samples below are a
counterexample to sampling, never the basis of an all-direction claim.
"""

import ast
import copy
from fractions import Fraction
import os
from pathlib import Path
import sys
from types import SimpleNamespace

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned supervisor required before mathematical imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402
from sympy import Float  # noqa: E402
from sympy.polys.domains import QQ  # noqa: E402
from sympy.polys.fields import field  # noqa: E402

import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def rational_field():
    return field("x,y,z", QQ)


@pytest.fixture(scope="module")
def context():
    # Source parsing, field creation and 3-by-3 exact background checks only.
    # Never request leading(), section(), or build_certificate() in this suite.
    return P.build_context(guard=lambda: None)


def basis(column):
    values = [Fraction(0)] * 43
    values[column] = Fraction(1)
    return values


def context_inverse(context):
    return tuple(
        tuple(Fraction(value) for value in row) for row in context["domain"]["inverse"]
    )


def record(entries, shape=(2, 2)):
    return {
        "schema": "nr-case12-polynomial-matrix-v1",
        "variables": ["x", "y", "z"],
        "shape": list(shape),
        "entries": entries,
    }


def known_record():
    return record(
        [
            [0, 0, []],
            [0, 1, [[1, 0, 0, "2", "3"]]],
            [1, 0, [[0, 0, 0, "-5", "7"]]],
            [1, 1, []],
        ]
    )


@pytest.mark.parametrize(
    "suffix",
    ["nr_constraint_direction_section.py", "nr_constraint_exact_coefficients.py"],
)
def test_pinned_source_byte_mutation_is_refused(suffix):
    sources = P.verify_sources()
    name = next(name for name in sources if name.endswith(suffix))
    with pytest.raises(ValueError):
        P.translated_ast(sources[name] + b"\n# untrusted alteration\n", name)


def test_unregistered_source_cannot_enter_ast_adaptation():
    source = next(iter(P.verify_sources().values()))
    with pytest.raises(ValueError):
        P.translated_ast(source, "scripts/not-a-registered-coefficient-source.py")


def test_pinned_profile_has_no_permitted_formula_adaptation():
    sources = P.verify_sources()
    with pytest.raises(ValueError):
        P.translated_ast(sources[P.PROFILE_SOURCE], P.PROFILE_SOURCE)


@pytest.mark.parametrize(
    "suffix",
    ["nr_constraint_direction_section.py", "nr_constraint_exact_coefficients.py"],
)
def test_registered_translation_is_audited_and_has_no_float_literals(suffix):
    sources = P.verify_sources()
    name = next(name for name in sources if name.endswith(suffix))
    translated, audit = P.translated_ast(sources[name], name)
    assert isinstance(translated, ast.Module)
    assert isinstance(audit, dict) and audit
    assert len(audit["edits"]) == 2
    assert audit["formula_and_index_bodies_unchanged"] is True
    assert not any(
        isinstance(node, ast.Constant) and type(node.value) is float
        for node in ast.walk(translated)
    )


def test_fixed_metric_inverse_and_spd_have_independent_exact_checks(context):
    h, u = context["background"].metric, context_inverse(context)
    assert all(
        sum(h[i][k] * u[k][j] for k in range(3)) == Fraction(i == j)
        for i in range(3)
        for j in range(3)
    )
    # Sylvester's criterion is separate from the producer's L L^T argument.
    first = h[0][0]
    second = h[0][0] * h[1][1] - h[0][1] * h[1][0]
    determinant = (
        h[0][0] * (h[1][1] * h[2][2] - h[1][2] * h[2][1])
        - h[0][1] * (h[1][0] * h[2][2] - h[1][2] * h[2][0])
        + h[0][2] * (h[1][0] * h[2][1] - h[1][1] * h[2][0])
    )
    assert (first, second, determinant) == (Fraction(1), Fraction(1), Fraction(1))


def test_fixed_domain_keeps_zero_frequency_out_and_exact_denominator_floor(context):
    domain = context["domain"]
    background = context["background"]
    assert (background.alpha, background.chi, background.shift) == (
        Fraction(17, 20),
        Fraction(18, 25),
        (Fraction(3, 100), Fraction(-1, 25), Fraction(1, 20)),
    )
    assert domain["zero_frequency_admitted"] is False
    assert domain["domain"] == "fixed case12 constants; real (x,y,z) != (0,0,0)"
    lower = Fraction(domain["g_over_r_lower"])
    assert lower == Fraction(5, 6)
    assert context["background"].chi * lower**2 == Fraction(1, 2)
    assert Fraction(domain["section_denominator_over_r_cubed_lower"]) == Fraction(1, 2)
    assert Fraction(domain["residual_denominator_over_r_fourth_lower"]) == Fraction(
        1, 2
    )


@pytest.mark.parametrize("constant", ["metric", "alpha", "chi", "shift", "inverse"])
def test_fixed_case12_domain_refuses_changed_constants(context, constant):
    values = vars(context["background"]).copy()
    inverse = context_inverse(context)
    if constant == "metric":
        values["metric"] = (
            (Fraction(-1), Fraction(0), Fraction(0)),
            (Fraction(0), Fraction(1), Fraction(0)),
            (Fraction(0), Fraction(0), Fraction(-1)),
        )
    elif constant == "shift":
        values["shift"] = (Fraction(0), Fraction(0), Fraction(0))
    elif constant == "inverse":
        inverse = tuple(
            tuple(value + Fraction(i == j == 0) for j, value in enumerate(row))
            for i, row in enumerate(inverse)
        )
    else:
        values[constant] = Fraction(0) if constant == "chi" else Fraction(1)
    with pytest.raises(ValueError):
        P.fixed_domain(SimpleNamespace(**values), inverse)


def test_translated_metric_factor_two_defect_has_nonzero_polynomial_witness(context):
    b, f, r = context["background"], context["field"], context["r"]
    q = context["lift"](b, basis(20), guard=lambda: None)
    v = b.ray
    projected = sum(
        (f(int(k == 0)) - v[0] * v[k] / r) * q[37 + 6 * k] for k in range(3)
    )
    assert projected - v[0] * q[0] / 2 == f.one
    defect = projected - v[0] * (q[0] / 2) / 2 - f.one
    witness = P.polynomial(defect * r, f)
    assert witness == P.polynomial(-(v[0] ** 2) / 2, f)
    assert witness


def test_translated_gamma_factor_two_defect_has_nonzero_exact_witness(context):
    b, f = context["background"], context["field"]
    q = context["lift"](b, basis(5), guard=lambda: None)
    observed = sum(b.metric[0][j] * q[19 + j] for j in range(3)) / 2
    assert observed == f.one
    assert P.polynomial(observed / 2 - f.one, f) == P.polynomial(f(-1) / 2, f)


def test_translated_hamiltonian_factor_four_defect_has_nonzero_exact_witness(context):
    b, f, u = context["background"], context["field"], context_inverse(context)
    q = context["lift"](b, basis(0), guard=lambda: None)
    assert all(value == 0 for value in q[:55])
    w = [sum(u[i][j] * b.ray[j] for j in range(3)) for i in range(3)]
    observed = 4 * b.chi * sum(w[k] * q[55 + k] for k in range(3))
    assert observed == f.one
    assert P.polynomial(observed / 2 - f.one, f) == P.polynomial(f(-1) / 2, f)


def test_translated_momentum_trace_sign_defect_has_nonzero_polynomial_witness(context):
    b, f, u = context["background"], context["field"], context_inverse(context)
    q = context["lift"](b, basis(42), guard=lambda: None)
    pairs = {(0, 0): 0, (0, 1): 1, (0, 2): 2, (1, 1): 3, (1, 2): 4, (2, 2): 5}

    def a(i, j):
        return q[11 + pairs[min(i, j), max(i, j)]]

    trace = sum(u[i][j] * a(i, j) for i in range(3) for j in range(3))
    w = [sum(u[i][j] * b.ray[j] for j in range(3)) for i in range(3)]
    momentum = sum(w[j] * a(j, 0) for j in range(3))
    assert trace == f.one
    assert momentum - b.ray[0] * (trace + 2 * q[17] / 3) == f.zero
    defect = momentum - b.ray[0] * (trace - 2 * q[17] / 3)
    assert P.polynomial(defect, f) == P.polynomial(-2 * b.ray[0], f)


@pytest.mark.parametrize(
    "value",
    [
        0.0,
        0.1,
        float("nan"),
        float("inf"),
        True,
        np.float32(0.1),
        np.float64(0.1),
        Float("0.1"),
    ],
)
def test_inexact_coefficients_are_not_exact_design_data(rational_field, value):
    domain, *_ = rational_field
    with pytest.raises((ValueError, TypeError)):
        P.polynomial(value, domain)


def test_uncleared_denominator_is_refused(rational_field):
    domain, x, y, _ = rational_field
    with pytest.raises(ValueError):
        P.polynomial(x / (y + 1), domain)


def test_exact_denominator_cancellation_and_degree_bound(rational_field):
    domain, x, y, _ = rational_field
    cleared = P.polynomial((x / (y + 1)) * (y + 1), domain, max_degree=1)
    assert P.canonical_polynomial(cleared) == [[1, 0, 0, "1", "1"]]
    with pytest.raises(ValueError):
        P.polynomial(x**2, domain, max_degree=1)


def test_wrong_polynomial_ring_is_refused(rational_field):
    domain, *_ = rational_field
    _, u, v = field("u,v", QQ)
    with pytest.raises((ValueError, TypeError)):
        P.polynomial(u + v, domain)


def test_matrix_encoding_includes_all_zero_coordinates_once(rational_field):
    domain, x, _, _ = rational_field
    matrix = np.array(
        [
            [P.polynomial(domain.zero, domain), P.polynomial(2 * x / 3, domain)],
            [P.polynomial(domain(-5) / 7, domain), P.polynomial(domain.zero, domain)],
        ],
        dtype=object,
    )
    encoded = P.encode_matrix(matrix)
    assert encoded == known_record()
    assert len({(entry[0], entry[1]) for entry in encoded["entries"]}) == 4
    decoded = V.decode_matrix(encoded, shape=(2, 2), max_degree=1)
    assert decoded == [
        [{}, {(1, 0, 0): Fraction(2, 3)}],
        [{(0, 0, 0): Fraction(-5, 7)}, {}],
    ]


def test_nonzero_axis_vanishing_polynomial_is_not_an_identity(rational_field):
    domain, x, y, _ = rational_field
    # x*y vanishes on all three coordinate axes but its coefficient is nonzero.
    for coordinate in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
        assert coordinate[0] * coordinate[1] == 0
    polynomial = P.polynomial(x * y, domain)
    assert P.canonical_polynomial(polynomial) == [[1, 1, 0, "1", "1"]]
    with pytest.raises(ValueError):
        P.validate_zero_matrix(
            np.array([[polynomial]], dtype=object), shape=(1, 1), guard=lambda: None
        )
    with pytest.raises(ValueError):
        V.zero_check([[{(1, 1, 0): Fraction(1)}]], (1, 1))


def test_zero_validation_requires_exact_matrix_shape(rational_field):
    domain, *_ = rational_field
    zero = P.polynomial(domain.zero, domain)
    with pytest.raises(ValueError):
        P.validate_zero_matrix(
            np.array([[zero]], dtype=object), shape=(1, 2), guard=lambda: None
        )


def test_zero_validation_propagates_owned_stop(rational_field):
    domain, *_ = rational_field
    zero = P.polynomial(domain.zero, domain)
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned polynomial stop")

    with pytest.raises(RuntimeError, match="owned polynomial stop"):
        P.validate_zero_matrix(
            np.array([[zero]], dtype=object), shape=(1, 1), guard=stop
        )
    assert calls == [1]


@pytest.mark.parametrize("kind", ["missing", "duplicate", "out-of-range", "order"])
def test_independent_parser_rejects_coordinate_coverage_defects(kind):
    value = known_record()
    if kind == "missing":
        value["entries"].pop()
    elif kind == "duplicate":
        value["entries"][-1] = copy.deepcopy(value["entries"][0])
    elif kind == "out-of-range":
        value["entries"][-1][0] = 2
    else:
        value["entries"][0], value["entries"][1] = (
            value["entries"][1],
            value["entries"][0],
        )
    with pytest.raises(ValueError):
        V.decode_matrix(value, shape=(2, 2), max_degree=1)


@pytest.mark.parametrize(
    "terms",
    [
        [[1.0, 0, 0, "1", "1"]],
        [[True, 0, 0, "1", "1"]],
        [[-1, 0, 0, "1", "1"]],
        [[1, 0, 0, "2", "4"]],
        [[1, 0, 0, "1", "-2"]],
        [[1, 0, 0, "1", "0"]],
        [[1, 0, 0, "0", "1"]],
        [[1, 0, 0, "01", "1"]],
        [[1, 0, 0, 1.0, "1"]],
        [[1, 0, 0, "1", "1"], [1, 0, 0, "-1", "1"]],
    ],
)
def test_independent_parser_rejects_inexact_or_noncanonical_terms(terms):
    with pytest.raises(ValueError):
        V.decode_polynomial(terms, max_degree=2)


def test_independent_parser_enforces_total_degree():
    with pytest.raises(ValueError):
        V.decode_polynomial([[2, 2, 0, "1", "1"]], max_degree=3)


@pytest.mark.parametrize(
    "field_name,value",
    [
        ("schema", "unknown"),
        ("variables", ["z", "y", "x"]),
        ("shape", [1, 4]),
    ],
)
def test_independent_parser_rejects_wrong_coordinate_contract(field_name, value):
    data = known_record()
    data[field_name] = value
    with pytest.raises(ValueError):
        V.decode_matrix(data, shape=(2, 2), max_degree=1)


def test_independent_small_product_uses_exact_cross_terms():
    zero, one = {}, {(0, 0, 0): Fraction(1)}
    x = {(1, 0, 0): Fraction(1)}
    minus_x = {(1, 0, 0): Fraction(-1)}
    product = V.multiply(
        [[one, x], [zero, one]], [[one, minus_x], [zero, one]], guard=lambda: None
    )
    assert product == [[one, zero], [zero, one]]
    assert (
        V.decode_matrix(V.encode_matrix(product), shape=(2, 2), max_degree=0) == product
    )


def test_independent_product_does_not_discard_tiny_exact_coefficient():
    tiny = Fraction(1, 10**80)
    product = V.multiply(
        [[{(1, 0, 0): tiny}]], [[{(0, 1, 0): Fraction(1)}]], guard=lambda: None
    )
    assert product == [[{(1, 1, 0): tiny}]]
    with pytest.raises(ValueError):
        V.zero_check(product, (1, 1))


def test_independent_product_dimension_mismatch_is_refused():
    with pytest.raises(ValueError):
        V.multiply([[{}, {}]], [[{}]], guard=lambda: None)


def test_independent_multiplier_propagates_owned_guard_without_retry():
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned replay stop")

    with pytest.raises(RuntimeError, match="owned replay stop"):
        V.multiply(
            [[{(0, 0, 0): Fraction(1)}]], [[{(0, 0, 0): Fraction(1)}]], guard=stop
        )
    assert calls == [1]


def test_independent_scaled_identity_checks_every_small_matrix_cell():
    zero = {}
    one, minus_one = {(0, 0, 0): Fraction(1)}, {(0, 0, 0): Fraction(-1)}
    x, x_squared = {(1, 0, 0): Fraction(1)}, {(2, 0, 0): Fraction(1)}
    leading = [[x, one], [zero, x]]
    section = [[x, minus_one], [zero, x]]
    residual = V.residual(leading, section, x_squared, guard=lambda: None)
    assert residual == [[{}, {}], [{}, {}]]
    assert V.zero_check(residual, (2, 2)) == 4
    assert V.coefficient_count(residual) == 0
    section[0][1] = {}
    wrong = V.residual(leading, section, x_squared, guard=lambda: None)
    assert wrong == [[{}, x], [{}, {}]]
    with pytest.raises(ValueError):
        V.zero_check(wrong, (2, 2))

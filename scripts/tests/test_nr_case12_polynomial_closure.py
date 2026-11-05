"""Cheap controls for the separate fixed-case12 closure certificate batch.

The owner constructs the full K and 43-by-58 residual once. These controls use
source-bound individual columns or independently specified tiny matrices only.
No direction samples establish an all-direction polynomial identity.
"""

import ast
import copy
from fractions import Fraction as F
import os
from pathlib import Path
import sys

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned supervisor required before mathematical imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_polynomial_closure as C  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    # Only fixed 3-by-3 data, source cloning and field creation; no K matrix.
    return C.build_context(guard=lambda: None)


def basis(column):
    values = [F(0)] * 58
    values[column] = F(1)
    return values


def source_bytes():
    return (ROOT / P.PROFILE_SOURCE).read_bytes()


@pytest.mark.parametrize("change", ["append", "coefficient", "branch"])
def test_principal_source_hash_refuses_formula_or_wrapper_drift(change):
    source = source_bytes()
    if change == "append":
        changed = source + b"\n# unregistered source\n"
    elif change == "coefficient":
        assert b"-F(4, 3)" in source
        changed = source.replace(b"-F(4, 3)", b"-F(2, 3)", 1)
    else:
        assert b"geometric=False" in source
        changed = source.replace(b"geometric=False", b"geometric=True", 1)
    with pytest.raises(ValueError):
        C.verify_source(changed)
    with pytest.raises(ValueError):
        C.translated_ast(changed)


def test_source_translation_keeps_complete_registered_function_asts():
    raw = source_bytes()
    C.verify_source(raw)
    expected = ast.Module(
        body=[
            node
            for node in ast.parse(raw.decode("utf-8")).body
            if isinstance(node, ast.FunctionDef)
            and node.name in ("principal_rates", "matrix")
        ],
        type_ignores=[],
    )
    translated, audit = C.translated_ast(raw)
    assert [node.name for node in translated.body] == ["principal_rates", "matrix"]
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        expected, include_attributes=False
    )
    assert isinstance(audit, dict) and audit
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]
    assert audit["fraction_basis_guard_retained"] is True
    assert audit["per_column_resource_guard_retained"] is True
    assert audit["executed_geometric"] is False
    assert not any(
        isinstance(node, ast.Constant) and type(node.value) is float
        for node in ast.walk(translated)
    )


def test_context_binds_fixed_case12_constants_and_nonzero_real_domain(context):
    background = context["background"]
    assert type(background.alpha) is F and background.alpha == F(17, 20)
    assert type(background.chi) is F and background.chi == F(18, 25)
    assert background.shift == (F(3, 100), F(-1, 25), F(1, 20))
    lower = ((F(1), F(0), F(0)), (F(3, 25), F(1), F(0)), (F(-2, 25), F(3, 50), F(1)))
    expected_metric = tuple(
        tuple(sum(lower[i][k] * lower[j][k] for k in range(3)) for j in range(3))
        for i in range(3)
    )
    assert background.metric == expected_metric
    assert context["domain"]["zero_frequency_admitted"] is False
    assert (
        context["domain"]["domain"] == "fixed case12 constants; real (x,y,z) != (0,0,0)"
    )


@pytest.mark.parametrize("geometric", [True, 0, 1, None, "False"])
def test_principal_wrapper_refuses_unregistered_geometric_branch(context, geometric):
    with pytest.raises(ValueError):
        context["principal_rates"](basis(22), geometric=geometric)


@pytest.mark.parametrize("kind", ["short", "long", "int", "float", "bool"])
def test_principal_wrapper_preserves_explicit_fraction_basis_guard(context, kind):
    values = basis(22)
    if kind == "short":
        values.pop()
    elif kind == "long":
        values.append(F(0))
    else:
        values[0] = {"int": 0, "float": 0.0, "bool": False}[kind]
    with pytest.raises(ValueError):
        context["principal_rates"](values)


@pytest.mark.parametrize("column", [0, 6, 10])
def test_base_coordinate_principal_columns_are_exactly_zero(context, column):
    values = context["principal_rates"](basis(column))
    assert len(values) == 58
    assert all(value == 0 for value in values)


@pytest.mark.parametrize("column", [17, 18, 22])
def test_single_source_column_has_independent_degree_one_physical_coefficients(
    context, column
):
    f, background = context["field"], context["background"]
    ray = background.ray
    inverse = [[F(value) for value in row] for row in context["domain"]["inverse"]]
    alpha, chi = F(17, 20), F(18, 25)
    shift = (F(3, 100), F(-1, 25), F(1, 20))
    beta = sum(shift[i] * ray[i] for i in range(3))
    expected = [f.zero] * 58
    expected[column] = beta
    if column == 22:
        for k in range(3):
            expected[28 + 3 * k] = 3 * alpha * chi * ray[k]
    else:
        for i in range(3):
            raised_ray = sum(inverse[i][j] * ray[j] for j in range(3))
            expected[19 + i] = expected[22 + i] = (
                -F(4, 3) * alpha * raised_ray
                if column == 17
                else 2 * alpha * raised_ray
            )
            expected[25 + i] = (-2 if column == 17 else 4) * ray[i]
            expected[55 + i] = alpha * ray[i] / 3 if column == 17 else f.zero
    actual = context["principal_rates"](basis(column), geometric=False)
    assert len(actual) == 58
    assert actual == expected
    for value in actual:
        polynomial = P.polynomial(value, f, max_degree=1)
        assert all(sum(exponent) == 1 for exponent in polynomial)


def test_real_theta_from_driver_k_error_has_an_exact_constraint_witness(context):
    # Source col22 is b^0. Dhat_4 selects Theta (row18), so the original
    # driver column cannot transport Theta; the actual K[18,22]+=x error does.
    f, background = context["field"], context["background"]
    x, y, z = background.ray
    rates = context["principal_rates"](basis(22))
    assert rates[18] == 0
    inverse = [[F(value) for value in row] for row in context["domain"]["inverse"]]
    ray = (x, y, z)
    r = x * x + y * y + z * z
    g = sum(ray[i] * inverse[i][j] * ray[j] for i in range(3) for j in range(3))
    delta = F(18, 25) * r * r * g * g
    rates[18] += x
    residue = P.polynomial(r * delta * rates[18], f, max_degree=11)
    encoded = P.canonical_polynomial(residue)
    decoded = V.decode_polynomial(encoded, max_degree=11)
    # Pure x^11 coefficient from the independently recorded inverse metric.
    assert decoded[(11, 0, 0)] == F(18, 25) * inverse[0][0] ** 2
    assert all(sum(exponent) == 11 for exponent in decoded)
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check([[decoded]], (1, 1))


def test_context_propagates_owned_stop_before_source_or_symbol_construction():
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned source stop")

    with pytest.raises(RuntimeError, match="owned source stop"):
        C.build_context(guard=stop)
    assert calls == [1]


def monomial(exponent=(0, 0, 0), coefficient=F(1)):
    return {exponent: coefficient} if coefficient else {}


def poly_matrix(values, context):
    ring = context["field"].ring
    return np.array(
        [[ring.from_dict(value) for value in row] for row in values], dtype=object
    )


def decoded_matrix(matrix, shape):
    return V.decode_matrix(P.encode_matrix(matrix), shape=shape, max_degree=13)


def test_zero_storage_has_exact_ring_values_and_every_requested_coordinate(context):
    ring = context["field"].ring
    array = C.zeros(2, 3, ring)
    assert array.shape == (2, 3) and array.dtype == object
    assert all(value.ring == ring and not value for value in array.flat)
    assert decoded_matrix(array, (2, 3)) == [[{}, {}, {}], [{}, {}, {}]]
    array[0, 0] = ring.one
    assert all(not array[i, j] for i, j in ((0, 1), (0, 2), (1, 0), (1, 1), (1, 2)))


@pytest.mark.parametrize(
    "rows,columns",
    [
        (0, 1),
        (1, 0),
        (-1, 1),
        (59, 1),
        (1, 59),
        (True, 1),
        (1, False),
        (1.0, 1),
        (1, None),
    ],
)
def test_zero_storage_refuses_invalid_or_unregistered_dimensions(
    context, rows, columns
):
    with pytest.raises(ValueError):
        C.zeros(rows, columns, context["field"].ring)


@pytest.mark.parametrize("kind", ["base-row", "base-column", "constant", "quadratic"])
def test_kernel_structure_refuses_nonphysical_zero_or_degree_contracts(context, kind):
    ring = context["field"].ring
    # Synthetic sparse storage only, never construction of the physical K.
    k = C.zeros(58, 58, ring)
    x = ring.gens[0]
    if kind == "base-row":
        k[0, 12] = x
    elif kind == "base-column":
        k[12, 0] = x
    else:
        k[12, 12] = ring.one if kind == "constant" else x * x
    with pytest.raises(ValueError):
        C.validate_kernel_structure(k)


def test_kernel_structure_refuses_incomplete_coordinate_shape(context):
    with pytest.raises(ValueError):
        C.validate_kernel_structure(C.zeros(57, 58, context["field"].ring))


def test_small_producer_closure_matches_independent_kernel_leak_counterexample(context):
    one, x = monomial(), monomial((1, 0, 0))
    d, s, k = [[one, {}]], [[one], [{}]], [[{}, x], [{}, {}]]
    produced = C.closure_from_matrices(
        poly_matrix(d, context),
        poly_matrix(s, context),
        poly_matrix(k, context),
        context["field"].ring.one,
        guard=lambda: None,
    )
    assert decoded_matrix(produced["transport"], (1, 2)) == [[{}, x]]
    assert decoded_matrix(produced["quotient_numerator"], (1, 1)) == [[{}]]
    assert decoded_matrix(produced["residual"], (1, 2)) == small_closure(d, s, k, one)


def test_small_producer_closure_matches_scaled_identity_on_every_column(context):
    x, xx, y = monomial((1, 0, 0)), monomial((2, 0, 0)), monomial((0, 1, 0))
    d, s, k = [[x, {}]], [[x], [{}]], [[y, {}], [{}, {}]]
    produced = C.closure_from_matrices(
        poly_matrix(d, context),
        poly_matrix(s, context),
        poly_matrix(k, context),
        context["field"].ring.from_dict(xx),
        guard=lambda: None,
    )
    assert decoded_matrix(produced["residual"], (1, 2)) == [[{}, {}]]
    assert decoded_matrix(produced["residual"], (1, 2)) == small_closure(d, s, k, xx)


def test_small_producer_closure_refuses_mismatched_state_dimensions(context):
    one = monomial()
    with pytest.raises(ValueError):
        C.closure_from_matrices(
            poly_matrix([[one, {}]], context),
            poly_matrix([[one], [{}]], context),
            poly_matrix([[one]], context),
            context["field"].ring.one,
            guard=lambda: None,
        )


def test_small_producer_closure_propagates_owned_guard_without_retry(context):
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned producer closure stop")

    one = poly_matrix([[monomial()]], context)
    with pytest.raises(RuntimeError, match="owned producer closure stop"):
        C.closure_from_matrices(one, one, one, context["field"].ring.one, guard=stop)
    assert calls == [1]


def small_closure(d, s, k, delta):
    """Independent exact algebra, restricted in tests to at most 2-by-2 input."""
    transport = V.multiply(d, k)
    principal = V.multiply(transport, s)
    out = V.multiply(principal, d)
    one = monomial()
    for i, row in enumerate(out):
        for j, value in enumerate(row):
            scaled = {}
            V.add_product(scaled, delta, transport[i][j])
            V.add_product(scaled, value, one, factor=F(-1))
            row[j] = scaled
    return out


def known_k_record():
    # All coordinates, including off-diagonal zeros, are part of the contract.
    return {
        "schema": V.SCHEMA,
        "variables": ["x", "y", "z"],
        "shape": [2, 2],
        "entries": [
            [0, 0, [[1, 0, 0, "1", "1"]]],
            [0, 1, []],
            [1, 0, []],
            [1, 1, [[0, 1, 0, "-2", "3"]]],
        ],
    }


def test_right_inverse_does_not_imply_closure_on_kernel_columns():
    one, x = monomial(), monomial((1, 0, 0))
    d, s = [[one, {}]], [[one], [{}]]
    k = [[{}, x], [{}, {}]]
    assert V.zero_check(V.residual(d, s, one), (1, 1)) == 1
    transport = V.multiply(d, k)
    principal = V.multiply(transport, s)
    assert principal == [[{}]]
    # Checking only the section column misses the second, kernel column.
    assert V.multiply(principal, d)[0][0] == transport[0][0] == {}
    residual = small_closure(d, s, k, one)
    assert residual == [[{}, x]]
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check(residual, (1, 2))


def test_small_complete_closure_allows_transport_inside_constraint_kernel():
    one = monomial()
    x, y, z = (monomial(tuple(int(i == j) for i in range(3))) for j in range(3))
    d, s = [[one, {}]], [[one], [{}]]
    k = [[x, {}], [y, z]]
    assert V.multiply(V.multiply(d, k), s) == [[x]]
    assert V.zero_check(small_closure(d, s, k, one), (1, 2)) == 2


def test_scaled_section_requires_delta_in_the_complete_closure_identity():
    one, x = monomial(), monomial((1, 0, 0))
    xx, y = monomial((2, 0, 0)), monomial((0, 1, 0))
    d, s = [[x, {}]], [[x], [{}]]
    k = [[y, {}], [{}, {}]]
    assert V.zero_check(V.residual(d, s, xx), (1, 1)) == 1
    assert V.zero_check(small_closure(d, s, k, xx), (1, 2)) == 2
    wrong = small_closure(d, s, k, one)
    assert wrong == [[{(1, 1, 0): F(1), (3, 1, 0): F(-1)}, {}]]
    with pytest.raises(ValueError):
        V.zero_check(wrong, (1, 2))


def test_axis_invisible_kernel_leak_is_not_a_zero_closure_identity():
    one, xyz = monomial(), monomial((1, 1, 1))
    d, s = [[one, {}]], [[one], [{}]]
    k = [[{}, xyz], [{}, {}]]
    assert V.zero_check(V.residual(d, s, one), (1, 1)) == 1
    for point in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
        assert point[0] * point[1] * point[2] == 0
    residue = small_closure(d, s, k, one)
    assert residue == [[{}, xyz]]
    with pytest.raises(ValueError):
        V.zero_check(residue, (1, 2))
    # This synthetic counterexample also fails the physical degree-one K gate.
    with pytest.raises(ValueError):
        V.decode_matrix(V.encode_matrix(k), shape=(2, 2), max_degree=1)


def test_degree_one_k_roundtrip_registers_every_zero_coordinate():
    data = known_k_record()
    decoded = V.decode_matrix(data, shape=(2, 2), max_degree=1)
    assert decoded == [
        [monomial((1, 0, 0)), {}],
        [{}, monomial((0, 1, 0), F(-2, 3))],
    ]
    assert V.encode_matrix(decoded) == data
    assert len({tuple(cell[:2]) for cell in data["entries"]}) == 4


@pytest.mark.parametrize("kind", ["missing-zero", "duplicate", "reordered", "extra"])
def test_k_parser_refuses_incomplete_or_ambiguous_coordinate_coverage(kind):
    data = known_k_record()
    if kind == "missing-zero":
        del data["entries"][1]
    elif kind == "duplicate":
        data["entries"][1] = copy.deepcopy(data["entries"][2])
    elif kind == "reordered":
        data["entries"][1], data["entries"][2] = data["entries"][2], data["entries"][1]
    else:
        data["entries"].append([2, 0, []])
    with pytest.raises(ValueError):
        V.decode_matrix(data, shape=(2, 2), max_degree=1)


@pytest.mark.parametrize(
    "terms",
    [
        [[1.0, 0, 0, "1", "1"]],
        [[True, 0, 0, "1", "1"]],
        [[1, 0, 0, 0.25, "1"]],
        [[1, 0, 0, "2", "4"]],
        [[1, 0, 0, "1", "-2"]],
        [[1, 0, 0, "0", "1"]],
        [[1, 1, 0, "1", "1"]],
    ],
)
def test_k_parser_refuses_inexact_noncanonical_or_excess_degree_terms(terms):
    data = known_k_record()
    data["entries"][0][2] = terms
    with pytest.raises(ValueError):
        V.decode_matrix(data, shape=(2, 2), max_degree=1)


@pytest.mark.parametrize(
    "key,value",
    [
        ("shape", [1, 4]),
        ("variables", ["x", "z", "y"]),
        ("schema", "nr-unregistered-closure-matrix"),
    ],
)
def test_k_parser_refuses_wrong_coordinate_or_schema_contract(key, value):
    data = known_k_record()
    data[key] = value
    with pytest.raises(ValueError):
        V.decode_matrix(data, shape=(2, 2), max_degree=1)


def test_complete_closure_replay_refuses_mismatched_main_operator_dimensions():
    with pytest.raises(ValueError):
        small_closure([[monomial(), {}]], [[monomial()], [{}]], [[{}]], monomial())


def test_exact_multiplier_propagates_owned_deadline_without_retry():
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned closure deadline")

    with pytest.raises(RuntimeError, match="owned closure deadline"):
        V.multiply([[monomial()]], [[monomial()]], guard=stop)
    assert calls == [1]

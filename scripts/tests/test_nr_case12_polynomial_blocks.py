"""Cheap independent controls for the fixed-case12 polynomial block batch.

Only the frozen ODE assignment stencil and tiny polynomial matrices are used.
No full quotient construction or 43-by-43 matrix product occurs in these tests.
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
from sympy.polys.domains import QQ  # noqa: E402
from sympy.polys.rings import ring  # noqa: E402

import nr_case12_polynomial_blocks as B  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    # Source binding and exact 3-by-3 constants only, no full quotient.
    return B.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def ode(context):
    # Original 43-by-43 zero storage and assignment stencil, no matrix product.
    return context["ode_projector"]()


def matrix(values, context):
    return np.array(
        [[P.polynomial(value, context["field"]) for value in row] for row in values],
        dtype=object,
    )


def scalar(value, context):
    return P.polynomial(value, context["field"])


def decoded(value):
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=24)


def zero_check(value):
    return V.zero_check(decoded(value), value.shape)


@pytest.mark.parametrize("change", ["append", "groups", "scaled-rows", "ode-factor"])
def test_frozen_ode_source_refuses_constant_or_formula_drift(change):
    raw = (ROOT / P.LEADING_SOURCE).read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered block source\n"
    else:
        old, new = {
            "groups": (b"GROUPS = ((8, 1)", b"GROUPS = ((9, 1)"),
            "scaled-rows": (
                b"SCALED_ROWS = (0, 1, 2, 3, 41)",
                b"SCALED_ROWS = (0, 1, 2, 3, 42)",
            ),
            "ode-factor": (
                b"background.ray[k] * background.ray[ell] / background.ray_squared",
                b"2 * background.ray[k] * background.ray[ell] / background.ray_squared",
            ),
        }[change]
        assert old in raw
        altered = raw.replace(old, new, 1)
    with pytest.raises(ValueError):
        B.verify_source(altered)
    with pytest.raises(ValueError):
        B.translated_ast(altered)


def test_ode_translation_retains_original_formula_ast_and_no_unregistered_edits():
    raw = (ROOT / P.LEADING_SOURCE).read_bytes()
    B.verify_source(raw)
    original = ast.Module(
        body=[
            node
            for node in ast.parse(raw.decode("utf-8")).body
            if isinstance(node, ast.FunctionDef)
            and node.name in ("zeros", "ode_projector")
        ],
        type_ignores=[],
    )
    translated, audit = B.translated_ast(raw)
    assert [node.name for node in translated.body] == ["zeros", "ode_projector"]
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        original, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]


def test_groups_and_scaled_rows_are_bound_to_explicit_frozen_coordinates(context):
    expected_groups = ((8, 1), (11, 3), (20, 6), (38, 1))
    expected_rows = (0, 1, 2, 3, 41)
    assert B.GROUPS == context["groups"] == expected_groups
    assert B.SCALED_ROWS == context["scaled_rows"] == expected_rows
    raw = ast.parse((ROOT / P.LEADING_SOURCE).read_text(encoding="utf-8"))
    assignments = {
        node.targets[0].id: node.value
        for node in raw.body
        if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name)
    }
    assert ast.literal_eval(assignments["GROUPS"]) == expected_groups
    assert ast.literal_eval(assignments["SCALED_ROWS"]) == expected_rows


@pytest.mark.parametrize("start,width", [(8, 1), (11, 3), (20, 6), (38, 1)])
def test_original_ode_group_gives_hand_calculated_three_axis_block(
    context, ode, start, width
):
    ray = context["background"].ray
    r = sum(value * value for value in ray)
    component = width - 1
    ot = matrix(
        [
            [
                r * ode[start + width * k + component, start + width * ell + component]
                for ell in range(3)
            ]
            for k in range(3)
        ],
        context,
    )
    expected = matrix(
        [[ray[k] * ray[ell] for ell in range(3)] for k in range(3)], context
    )
    assert decoded(ot) == decoded(expected)
    V.decode_matrix(P.encode_matrix(ot), shape=(3, 3), max_degree=2)
    if width > 1:
        assert ode[start, start + width + component] == 0


@pytest.mark.parametrize("coordinate", [0, 1, 2, 3, 41])
def test_scaled_constraint_rows_and_columns_are_outside_the_ode_projector(
    ode, coordinate
):
    assert ode.shape == (43, 43)
    assert all(ode[coordinate, j] == ode[j, coordinate] == 0 for j in range(43))


def test_ode_trace_counts_all_eleven_component_groups(ode):
    # A diagonal sum, no 43-dimensional multiplication or quotient build.
    assert sum(ode[i, i] for i in range(43)) == 11


def test_two_dimensional_ot_pt_blocks_have_independent_hand_calculated_entries(context):
    x, y, _ = context["background"].ray
    r = x * x + y * y
    ot = matrix([[x * x, x * y], [x * y, y * y]], context)
    zero = matrix([[0, 0], [0, 0]], context)
    result = B.block_relations(
        zero,
        ot,
        scalar(r, context),
        scalar(1, context),
        scalar(0, context),
        guard=lambda: None,
    )
    expected = matrix([[y * y, -x * y], [-x * y, x * x]], context)
    assert decoded(result["Pt"]) == decoded(expected)
    for residual in result["block_residuals"].values():
        assert zero_check(residual) == 4
    # Independent sparse convolution verifies both complementary products.
    assert V.zero_check(V.multiply(decoded(ot), decoded(expected)), (2, 2)) == 4
    assert V.zero_check(V.multiply(decoded(expected), decoded(ot)), (2, 2)) == 4


@pytest.mark.parametrize("orientation", ["upper", "lower"])
def test_one_annihilation_side_does_not_imply_the_other(context, orientation):
    x, _, _ = context["background"].ray
    ot = matrix([[1, 0], [0, 0]], context)
    a = matrix(
        [[0, x], [0, 0]] if orientation == "upper" else [[0, 0], [x, 0]], context
    )
    result = B.block_relations(
        a,
        ot,
        scalar(1, context),
        scalar(1, context),
        scalar(0, context),
        guard=lambda: None,
    )
    assert zero_check(result["block_residuals"]["ode_idempotence"]) == 4
    # The registered names mean left=B*Ot and right=Ot*B, explicitly.
    left = decoded(result["block_residuals"]["left_annihilation"])
    right = decoded(result["block_residuals"]["right_annihilation"])
    assert left == V.multiply(decoded(a), decoded(ot))
    assert right == V.multiply(decoded(ot), decoded(a))
    vanished, nonzero = (left, right) if orientation == "upper" else (right, left)
    assert V.zero_check(vanished, (2, 2)) == 4
    assert nonzero == decoded(a)
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check(nonzero, (2, 2))


def test_intrinsic_subtraction_retains_all_r_sigma_and_shift_factors(context):
    x, y, z = context["background"].ray
    r, sigma, shift = x * x + y * y, x + 1, z
    ot = matrix([[r, 0], [0, 0]], context)
    a = matrix([[0, 0], [0, shift * sigma * r]], context)
    result = B.block_relations(
        a,
        ot,
        scalar(r, context),
        scalar(sigma, context),
        scalar(shift, context),
        guard=lambda: None,
    )
    assert decoded(result["Pt"]) == decoded(matrix([[0, 0], [0, r]], context))
    assert zero_check(result["B"]) == 4
    assert set(result["block_residuals"]) == {
        "ode_idempotence",
        "left_annihilation",
        "right_annihilation",
    }
    for residual in result["block_residuals"].values():
        assert zero_check(residual) == 4


def test_inexact_projector_retains_nonzero_idempotence_evidence(context):
    zero = matrix([[0, 0], [0, 0]], context)
    bad_ot = matrix([[2, 0], [0, 0]], context)
    result = B.block_relations(
        zero,
        bad_ot,
        scalar(1, context),
        scalar(1, context),
        scalar(0, context),
        guard=lambda: None,
    )
    residue = result["block_residuals"]["ode_idempotence"]
    assert decoded(residue) == decoded(matrix([[2, 0], [0, 0]], context))
    with pytest.raises(ValueError):
        zero_check(residue)


def test_original_ode_factor_two_mutation_has_independent_three_axis_residual(
    context, ode
):
    x, y, z = context["background"].ray
    r = x * x + y * y + z * z
    ot = matrix([[r * ode[8 + i, 8 + j] for j in range(3)] for i in range(3)], context)
    ot[0, 0] = ot[0, 0] + scalar(x * x, context)
    result = B.block_relations(
        matrix([[0, 0, 0], [0, 0, 0], [0, 0, 0]], context),
        ot,
        scalar(r, context),
        scalar(1, context),
        scalar(0, context),
        guard=lambda: None,
    )
    expected = matrix(
        [
            [2 * x**4 - x * x * y * y - x * x * z * z, x**3 * y, x**3 * z],
            [x**3 * y, 0, 0],
            [x**3 * z, 0, 0],
        ],
        context,
    )
    actual = decoded(result["block_residuals"]["ode_idempotence"])
    assert actual == decoded(expected)
    assert sum(bool(poly) for row in actual for poly in row) == 5
    with pytest.raises(ValueError):
        V.zero_check(actual, (3, 3))


def test_axis_vanishing_intrinsic_error_is_still_nonzero_on_one_side(context):
    x, y, z = context["background"].ray
    a, ot = matrix([[0, x * y * z], [0, 0]], context), matrix([[1, 0], [0, 0]], context)
    for point in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
        assert point[0] * point[1] * point[2] == 0
    result = B.block_relations(
        a,
        ot,
        scalar(1, context),
        scalar(1, context),
        scalar(0, context),
        guard=lambda: None,
    )
    assert zero_check(result["block_residuals"]["left_annihilation"]) == 4
    assert decoded(result["block_residuals"]["right_annihilation"]) == [
        [{}, {(1, 1, 1): F(1)}],
        [{}, {}],
    ]
    with pytest.raises(ValueError):
        zero_check(result["block_residuals"]["right_annihilation"])


def test_exact_division_preserves_zero_cells_and_every_quotient_entry(context):
    x, y, z = context["background"].ray
    sigma = x + y + 1
    expected = matrix([[x, 0], [y, z - x]], context)
    a = matrix([[sigma * x, 0], [sigma * y, sigma * (z - x)]], context)
    result = B.divide_matrix(a, scalar(sigma, context), guard=lambda: None)
    assert result["accepted"] is True
    assert result["normal_form_verified"] is True
    assert result["monomial_order"] == "lex"
    assert decoded(result["division_quotient"]) == decoded(expected)
    for key in ("division_remainder", "division_identity", "multiplication_residual"):
        assert zero_check(result[key]) == 4
    record = P.encode_matrix(result["division_remainder"])
    assert record["entries"] == [[0, 0, []], [0, 1, []], [1, 0, []], [1, 1, []]]


def test_nondivisible_candidate_keeps_exact_quotient_remainder_and_failed_acceptance(
    context,
):
    x, y, _ = context["background"].ray
    a = matrix([[x * x + y, 0], [x * y, 1]], context)
    result = B.divide_matrix(a, scalar(x, context), guard=lambda: None)
    assert result["accepted"] is False
    assert result["normal_form_verified"] is True
    assert result["monomial_order"] == "lex"
    assert result["divisor_leading_exponent"] == [1, 0, 0]
    assert result["divisor_leading_coefficient"] == ["1", "1"]
    assert decoded(result["division_quotient"]) == decoded(
        matrix([[x, 0], [y, 0]], context)
    )
    expected_remainder = matrix([[y, 0], [0, 1]], context)
    assert decoded(result["division_remainder"]) == decoded(expected_remainder)
    assert decoded(result["multiplication_residual"]) == decoded(expected_remainder)
    assert zero_check(result["division_identity"]) == 4
    with pytest.raises(ValueError):
        zero_check(result["division_remainder"])


def test_nondivisible_axis_invisible_remainder_is_not_discarded(context):
    x, y, z = context["background"].ray
    # Division by x^2 cannot divide the xyz term, despite its axis values.
    a = matrix([[x * x + x * y * z]], context)
    result = B.divide_matrix(a, scalar(x * x, context), guard=lambda: None)
    assert result["accepted"] is False
    assert decoded(result["division_quotient"]) == [[{(0, 0, 0): F(1)}]]
    assert decoded(result["division_remainder"]) == [[{(1, 1, 1): F(1)}]]
    assert zero_check(result["division_identity"]) == 1


def test_tiny_exact_remainder_cannot_be_rounded_into_acceptance(context):
    x, y, _ = context["background"].ray
    tiny = F(1, 10**80)
    result = B.divide_matrix(
        matrix([[x + tiny * y]], context), scalar(x, context), guard=lambda: None
    )
    assert result["accepted"] is False
    assert decoded(result["division_remainder"]) == [[{(0, 1, 0): tiny}]]
    assert zero_check(result["division_identity"]) == 1


def test_scalar_constant_mutation_of_divisible_input_preserves_failure_witness(context):
    x, y, z = context["background"].ray
    sigma = scalar(x * x + y * y + z * z, context)
    expected_quotient = scalar(x, context)
    result = B.divide_scalar(sigma * expected_quotient + sigma.ring.one, sigma)
    assert result["accepted"] is False
    assert result["normal_form_verified"] is True
    assert result["quotient"] == expected_quotient
    assert result["remainder"] == result["multiplication_residual"] == sigma.ring.one
    assert not result["division_identity"]


@pytest.mark.parametrize("value", [0.0, True, F(1), "x", None])
def test_division_refuses_nonpolynomial_scalar_input(context, value):
    with pytest.raises(ValueError):
        B.divide_scalar(value, scalar(1, context))
    with pytest.raises(ValueError):
        B.divide_scalar(scalar(1, context), value)


def test_division_refuses_zero_polynomial_divisor(context):
    with pytest.raises(ValueError):
        B.divide_matrix(matrix([[1]], context), scalar(0, context), guard=lambda: None)


@pytest.mark.parametrize("kind", ["foreign-variables", "nonlex"])
def test_division_refuses_unregistered_ring_or_monomial_order(kind):
    domain, x, _, _ = ring(
        "u,v,w" if kind == "foreign-variables" else "x,y,z",
        QQ,
        order="lex" if kind == "foreign-variables" else "grlex",
    )
    with pytest.raises(ValueError):
        B.divide_scalar(x * x, x)


@pytest.mark.parametrize("value", [0.0, True, F(0)])
def test_division_refuses_nonpolynomial_matrix_entries(context, value):
    invalid = np.array([[value]], dtype=object)
    with pytest.raises(ValueError):
        B.divide_matrix(invalid, scalar(1, context), guard=lambda: None)


def test_small_block_relations_refuse_mismatched_operator_shapes(context):
    with pytest.raises(ValueError):
        B.block_relations(
            matrix([[1]], context),
            matrix([[1, 0], [0, 0]], context),
            scalar(1, context),
            scalar(1, context),
            scalar(0, context),
            guard=lambda: None,
        )


@pytest.mark.parametrize("name", ["r", "sigma", "b"])
def test_small_block_relations_refuse_inexact_scalar_parameters(context, name):
    values = {
        "r": scalar(1, context),
        "sigma": scalar(1, context),
        "b": scalar(0, context),
    }
    values[name] = 0.5
    with pytest.raises(ValueError):
        B.block_relations(
            matrix([[1]], context),
            matrix([[1]], context),
            values["r"],
            values["sigma"],
            values["b"],
            guard=lambda: None,
        )


@pytest.mark.parametrize("name", ["r", "sigma"])
def test_small_block_relations_refuse_zero_direction_or_divisor(context, name):
    values = {"r": scalar(1, context), "sigma": scalar(1, context)}
    values[name] = scalar(0, context)
    with pytest.raises(ValueError):
        B.block_relations(
            matrix([[1]], context),
            matrix([[1]], context),
            values["r"],
            values["sigma"],
            scalar(0, context),
            guard=lambda: None,
        )


def test_polynomial_degree_gate_rejects_hidden_excess_degree_in_ode_block(context):
    x, _, _ = context["background"].ray
    record = P.encode_matrix(matrix([[x * x * x]], context))
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(1, 1), max_degree=2)


@pytest.mark.parametrize(
    "kind", ["missing-zero", "duplicate", "wrong-shape", "wrong-schema"]
)
def test_saved_block_parser_refuses_missing_coordinates_or_wrong_contract(
    context, kind
):
    data = P.encode_matrix(matrix([[0, 1], [0, 0]], context))
    if kind == "missing-zero":
        del data["entries"][0]
    elif kind == "duplicate":
        data["entries"][-1] = copy.deepcopy(data["entries"][0])
    elif kind == "wrong-shape":
        data["shape"] = [1, 4]
    else:
        data["schema"] = "unregistered-ode-block"
    with pytest.raises(ValueError):
        V.decode_matrix(data, shape=(2, 2), max_degree=2)


def test_context_propagates_owned_stop_before_symbol_construction():
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned block source stop")

    with pytest.raises(RuntimeError, match="owned block source stop"):
        B.build_context(guard=stop)
    assert calls == [1]


@pytest.mark.parametrize("operation", ["blocks", "division"])
def test_small_matrix_work_propagates_owned_stop_without_retry(context, operation):
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned block algebra stop")

    one = matrix([[1]], context)
    with pytest.raises(RuntimeError, match="owned block algebra stop"):
        if operation == "blocks":
            B.block_relations(
                one,
                one,
                scalar(1, context),
                scalar(1, context),
                scalar(0, context),
                guard=stop,
            )
        else:
            B.divide_matrix(one, scalar(1, context), guard=stop)
    assert calls == [1]

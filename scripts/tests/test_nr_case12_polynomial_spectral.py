"""Cheap exact controls for the single owned seventh-degree spectral batch.

The three registered factors are fixed in advance. Small matrices below never
construct or multiply the full 43-coordinate operator or extend a failed run.
"""

import ast
import copy
from fractions import Fraction as F
import importlib.util
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

import nr_case12_polynomial_spectral as S  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

EXPECTED = (
    F(2601, 100000),
    F(2601, 50000),
    F(2601, 5000),
    F(153, 125),
    F(459, 250),
    F(306, 125),
)
_DEFAULT = object()


@pytest.fixture(scope="module")
def context():
    return S.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def univariate():
    return S.univariate_certificate()


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-polynomial-spectral.py"
    spec = importlib.util.spec_from_file_location(
        "owned_spectral_univariate_control", path
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def poly(value, context):
    return P.polynomial(value, context["field"])


def matrix(values, context):
    return np.array(
        [[poly(value, context) for value in row] for row in values], dtype=object
    )


def decoded(value):
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=28)


def run(
    value,
    context,
    *,
    r=_DEFAULT,
    g=_DEFAULT,
    guard=lambda: None,
    sink=lambda name, array: None,
):
    return S.recurrence(
        value,
        poly(1, context) if r is _DEFAULT else r,
        poly(1, context) if g is _DEFAULT else g,
        EXPECTED,
        guard=guard,
        sink=sink,
    )


@pytest.mark.parametrize("change", ["append", "coefficient", "branch-order"])
def test_frozen_spectral_source_refuses_formula_or_branch_order_drift(change):
    raw = (ROOT / P.PROFILE_SOURCE).read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered spectral source\n"
    else:
        old, new = {
            "coefficient": (b"a * a * mu * g / 4", b"a * a * mu * g / 3"),
            "branch-order": (
                b'"ordering-T", "ordering-L"',
                b'"ordering-L", "ordering-T"',
            ),
        }[change]
        assert old in raw
        altered = raw.replace(old, new, 1)
    with pytest.raises(ValueError):
        S.verify_source(altered)
    with pytest.raises(ValueError):
        S.translated_ast(altered)


def test_squared_speed_method_is_bound_without_formula_adaptation():
    raw = (ROOT / P.PROFILE_SOURCE).read_bytes()
    original_class = next(
        node
        for node in ast.parse(raw.decode("utf-8")).body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    original = next(
        node
        for node in original_class.body
        if isinstance(node, ast.FunctionDef) and node.name == "squared_speeds"
    )
    translated, audit = S.translated_ast(raw)
    assert [node.name for node in translated.body] == ["squared_speeds"]
    assert ast.dump(translated.body[0], include_attributes=False) == ast.dump(
        original, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]


def test_six_branch_constants_match_independent_frozen_profile_arithmetic():
    a, chi = F(17, 20), F(18, 25)
    expected = (
        a * a * chi / 20,
        a * a * chi / 10,
        a * a * chi,
        2 * a * chi,
        3 * a * chi,
        4 * a * chi,
    )
    assert S.branch_constants() == expected == EXPECTED
    assert all(type(value) is F for value in S.branch_constants())
    assert all(value > 0 for value in expected)
    assert len(set(expected)) == 6


@pytest.mark.parametrize("branch", [0, 1, 2, 3, 4, 5])
def test_companion_blocks_separate_registered_roots_from_the_other_three_branches(
    context, branch
):
    squared = EXPECTED[branch]
    x = matrix([[0, squared], [1, 0]], context)
    result = run(x, context)
    assert set(result) == {"X", "Q", "Z1", "Z2", "Z3"}
    assert decoded(result["Q"]) == decoded(
        matrix([[squared, 0], [0, squared]], context)
    )
    factor = F(1)
    for selected in EXPECTED[:3]:
        factor *= squared - selected
    expected = matrix([[0, factor * squared], [factor, 0]], context)
    assert decoded(result["Z3"]) == decoded(expected)
    if branch < 3:
        assert V.zero_check(decoded(result["Z3"]), (2, 2)) == 4
    else:
        assert factor != 0
        with pytest.raises(ValueError):
            V.zero_check(decoded(result["Z3"]), (2, 2))


def test_nonzero_nilpotent_is_rejected_even_though_its_square_is_zero(context):
    nilpotent = matrix([[0, 1], [0, 0]], context)
    result = run(nilpotent, context)
    assert V.zero_check(decoded(result["Q"]), (2, 2)) == 4
    assert decoded(result["X"]) == [[{}, {(0, 0, 0): F(1)}], [{}, {}]]
    factor = -EXPECTED[0] * EXPECTED[1] * EXPECTED[2]
    assert decoded(result["Z3"]) == [[{}, {(0, 0, 0): factor}], [{}, {}]]
    assert factor != 0
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check(decoded(result["Z3"]), (2, 2))


def test_scalar_seventh_degree_residual_matches_hand_expanded_coefficients(context):
    x, _, _ = context["background"].ray
    result = run(matrix([[x]], context), context)
    c1, c2, c3 = EXPECTED[:3]
    expected = {
        (1, 0, 0): -c1 * c2 * c3,
        (3, 0, 0): c1 * c2 + c1 * c3 + c2 * c3,
        (5, 0, 0): -(c1 + c2 + c3),
        (7, 0, 0): F(1),
    }
    assert decoded(result["Z3"]) == [[expected]]
    assert max(sum(power) for power in decoded(result["Z1"])[0][0]) == 3
    assert max(sum(power) for power in decoded(result["Z2"])[0][0]) == 5
    assert max(sum(power) for power in decoded(result["Z3"])[0][0]) == 7


def test_nonunit_r_and_g_use_unnormalized_branch_values_without_losing_r_squared(
    context,
):
    # X^2 = r^2*c1*g*I is a registered root; replacing g by g/r breaks it.
    # The factor three avoids accidentally landing on c2=2*c1 in the defect.
    r, g = F(3), F(2)
    squared = r * r * EXPECTED[0] * g
    x = matrix([[0, squared], [1, 0]], context)
    result = run(x, context, r=poly(r, context), g=poly(g, context))
    assert V.zero_check(decoded(result["Z1"]), (2, 2)) == 4
    assert V.zero_check(decoded(result["Z3"]), (2, 2)) == 4
    wrong = run(x, context, r=poly(r, context), g=poly(g / r, context))
    assert any(value for row in decoded(wrong["Z3"]) for value in row)


def test_polynomial_r_and_g_recurrence_has_independently_expanded_cross_terms(context):
    x, y, z = context["background"].ray
    result = run(
        matrix([[x]], context), context, r=poly(y, context), g=poly(z, context)
    )
    c1, c2, c3 = EXPECTED[:3]
    assert decoded(result["Z3"]) == [
        [
            {
                (7, 0, 0): F(1),
                (5, 2, 1): -(c1 + c2 + c3),
                (3, 4, 2): c1 * c2 + c1 * c3 + c2 * c3,
                (1, 6, 3): -c1 * c2 * c3,
            }
        ]
    ]


def test_nonzero_candidate_is_emitted_with_every_stage_and_without_rewriting_earlier_stages(
    context,
):
    x, _, _ = context["background"].ray
    snapshots, references = [], []

    def save(name, value):
        snapshots.append((name, P.encode_matrix(value)))
        references.append(value)

    result = run(matrix([[x, 0], [0, 0]], context), context, sink=save)
    assert [name for name, _ in snapshots] == ["X", "Q", "Z1", "Z2", "Z3"]
    assert len(references) == 5
    for (name, record), reference in zip(snapshots, references, strict=True):
        assert P.encode_matrix(reference) == record == P.encode_matrix(result[name])
        assert len(record["entries"]) == 4
    assert any(value for row in decoded(result["Z3"]) for value in row)


def test_sink_failure_stops_at_the_exact_stage_and_is_not_retried(context):
    names = []

    def stop(name, value):
        names.append(name)
        if name == "Z1":
            raise RuntimeError("owned spectral save stop")

    with pytest.raises(RuntimeError, match="owned spectral save stop"):
        run(matrix([[1]], context), context, sink=stop)
    assert names == ["X", "Q", "Z1"]


def test_axis_vanishing_nilpotent_error_remains_a_nonzero_polynomial(context):
    x, y, z = context["background"].ray
    result = run(matrix([[0, x * y * z], [0, 0]], context), context)
    for point in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
        assert point[0] * point[1] * point[2] == 0
    assert V.zero_check(decoded(result["Q"]), (2, 2)) == 4
    factor = -EXPECTED[0] * EXPECTED[1] * EXPECTED[2]
    assert decoded(result["Z3"]) == [[{}, {(1, 1, 1): factor}], [{}, {}]]
    with pytest.raises(ValueError):
        V.zero_check(decoded(result["Z3"]), (2, 2))


def test_saved_nilpotent_control_contains_the_actual_odd_and_even_results():
    data = S.nilpotent_witness()

    def read_matrix(name):
        value = data[name]
        assert len(value) == 2 and all(len(row) == 2 for row in value)
        return [[F(coefficient) for coefficient in row] for row in value]

    coefficient = -EXPECTED[0] * EXPECTED[1] * EXPECTED[2]
    assert data["r"] == data["g"] == "1"
    assert read_matrix("N") == [[F(0), F(1)], [F(0), F(0)]]
    assert read_matrix("N_squared") == [[F(0), F(0)], [F(0), F(0)]]
    assert read_matrix("even_result") == [[F(0), F(0)], [F(0), F(0)]]
    assert read_matrix("odd_result") == [[F(0), coefficient], [F(0), F(0)]]
    assert data["nonzero_slots"] == 1
    assert data["zero_mode_rejected"] is True


def test_independent_univariate_replay_accepts_all_six_original_branches(
    univariate, replay_runner
):
    assert replay_runner.verify_univariate(univariate) == {
        "nodes": 7,
        "projector_products": 49,
        "speed_relations": 6,
        "absent_branches": [4, 5, 6],
        "simple_zero_root": True,
    }
    assert univariate["constants"] == list(map(str, EXPECTED))
    c1, c2, c3 = EXPECTED[:3]
    expected = {
        1: -c1 * c2 * c3,
        3: c1 * c2 + c1 * c3 + c2 * c3,
        5: -(c1 + c2 + c3),
        7: F(1),
    }
    assert replay_runner.decode_uni(univariate["squarefree"]["polynomial"]) == expected
    assert all(row["remainder"] == [] for row in univariate["projectors"][4:])


@pytest.mark.parametrize(
    "corruption",
    [
        "projector-quotient",
        "projector-remainder",
        "bezout",
        "node-order",
        "missing-relation",
        "duplicate-relation",
        "speed-branch",
        "zero-action",
        "accepted",
    ],
)
def test_independent_univariate_replay_refuses_corrupted_evidence(
    univariate, replay_runner, corruption
):
    data = copy.deepcopy(univariate)
    if corruption == "projector-quotient":
        data["projectors"][0]["quotient"] = []
    elif corruption == "projector-remainder":
        data["projectors"][1]["remainder"] = [[0, "1", "1"]]
    elif corruption == "bezout":
        data["squarefree"]["bezout_p"] = []
        data["squarefree"]["bezout_derivative"] = []
    elif corruption == "node-order":
        data["projectors"][1]["node"], data["projectors"][2]["node"] = (
            data["projectors"][2]["node"],
            data["projectors"][1]["node"],
        )
    elif corruption == "missing-relation":
        data["relations"].pop()
    elif corruption == "duplicate-relation":
        data["relations"][-1] = copy.deepcopy(data["relations"][0])
    elif corruption == "speed-branch":
        data["speed_relations"][0]["branch_index"] = 6
    elif corruption == "zero-action":
        data["zero_action"]["remainder"] = [[0, "1", "1"]]
    else:
        data["accepted"] = False
    with pytest.raises(ValueError):
        replay_runner.verify_univariate(data)


@pytest.mark.parametrize(
    "terms",
    [
        [[1.0, "1", "1"]],
        [[True, "1", "1"]],
        [[1, "2", "4"]],
        [[1, "0", "1"]],
        [[1, "1", "1"], [1, "-1", "1"]],
    ],
)
def test_independent_univariate_parser_refuses_inexact_or_noncanonical_terms(
    replay_runner, terms
):
    with pytest.raises(ValueError):
        replay_runner.decode_uni(terms)


@pytest.mark.parametrize(
    "change", ["short", "permuted", "float", "bool", "wrong-rational", "list"]
)
def test_branch_parameter_drift_is_refused_before_recurrence(context, change):
    values = list(EXPECTED)
    if change == "short":
        values.pop()
    elif change == "permuted":
        values[0], values[1] = values[1], values[0]
    elif change == "float":
        values[0] = float(values[0])
    elif change == "bool":
        values[0] = True
    elif change == "wrong-rational":
        values[0] += F(1, 1000000)
    candidate = values if change == "list" else tuple(values)
    with pytest.raises(ValueError):
        S.recurrence(
            matrix([[1]], context),
            poly(1, context),
            poly(1, context),
            candidate,
            guard=lambda: None,
            sink=lambda name, array: None,
        )


@pytest.mark.parametrize("name", ["r", "g"])
def test_zero_direction_scalars_are_not_in_the_registered_domain(context, name):
    values = {"r": poly(1, context), "g": poly(1, context)}
    values[name] = poly(0, context)
    with pytest.raises(ValueError):
        run(matrix([[1]], context), context, **values)


@pytest.mark.parametrize("value", [0.5, True, F(1), "x", None])
def test_recurrence_rejects_nonpolynomial_scalars(context, value):
    with pytest.raises(ValueError):
        run(matrix([[1]], context), context, r=value)


@pytest.mark.parametrize("value", [0.0, True, F(0)])
def test_recurrence_rejects_nonpolynomial_operator_entries(context, value):
    with pytest.raises(ValueError):
        run(np.array([[value]], dtype=object), context)


def test_recurrence_rejects_nonsquare_operator(context):
    with pytest.raises(ValueError):
        run(matrix([[1, 0]], context), context)


def test_recurrence_rejects_foreign_coordinate_ring(context):
    foreign, u, _, _ = ring("u,v,w", QQ)
    with pytest.raises(ValueError):
        run(np.array([[u]], dtype=object), context)


def test_saved_residual_degree_bound_detects_an_excess_seventh_degree_term(context):
    x, _, _ = context["background"].ray
    result = run(matrix([[x]], context), context)
    record = P.encode_matrix(result["Z3"])
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(1, 1), max_degree=6)
    assert V.decode_matrix(record, shape=(1, 1), max_degree=7) == decoded(result["Z3"])


@pytest.mark.parametrize(
    "change", ["missing-zero", "duplicate", "wrong-shape", "wrong-schema"]
)
def test_saved_spectral_matrix_requires_complete_registered_slots(context, change):
    record = P.encode_matrix(matrix([[0, 1], [0, 0]], context))
    if change == "missing-zero":
        del record["entries"][0]
    elif change == "duplicate":
        record["entries"][-1] = copy.deepcopy(record["entries"][0])
    elif change == "wrong-shape":
        record["shape"] = [1, 4]
    else:
        record["schema"] = "unregistered-spectral-matrix"
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(2, 2), max_degree=1)


@pytest.mark.parametrize("operation", ["context", "recurrence", "univariate"])
def test_owned_guard_is_propagated_without_retry(context, operation):
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned spectral stop")

    with pytest.raises(RuntimeError, match="owned spectral stop"):
        if operation == "context":
            S.build_context(guard=stop)
        elif operation == "univariate":
            S.univariate_certificate(guard=stop)
        else:
            run(matrix([[1]], context), context, guard=stop)
    assert calls == [1]

"""Cheap controls for the single owned full-58 odd spectral certificate.

Six tiny companion blocks test the actual degree-13 polynomial. Structural
58-coordinate controls replace the recurrence with a recording stub, so the
registered scientific operator is constructed and multiplied only by its owner.
"""

import ast
import copy
from fractions import Fraction as F
from itertools import combinations
import json
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

import nr_case12_full58_spectral as S  # noqa: E402
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
STAGES = ("Q", "Z1", "Z2", "Z3", "Z4", "Z5", "Z6")


@pytest.fixture(scope="module")
def algebra():
    return ring("x,y,z", QQ)[0]


@pytest.fixture(scope="module")
def parent_records():
    directory = S.PARENT_DIRECTORY
    return (
        json.loads((directory / "qualification-gate.json").read_text(encoding="utf-8")),
        json.loads((directory / "worker-result.json").read_text(encoding="utf-8")),
    )


def matrix(rows, algebra):
    return np.array([[algebra(value) for value in row] for row in rows], dtype=object)


def zero_matrix(rows, columns, algebra):
    return np.array(
        [[algebra.zero for _ in range(columns)] for _ in range(rows)], dtype=object
    )


def decoded(value):
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=26)


def product(values):
    result = F(1)
    for value in values:
        result *= value
    return result


def run(value, g, *, guard=lambda: None, sink=lambda name, value: None):
    return S.spectral_recurrence(value, g, EXPECTED, guard=guard, sink=sink)


def test_full58_six_constants_match_independent_fixed_profile_arithmetic():
    alpha, chi = F(17, 20), F(18, 25)
    assert (
        S.branch_constants()
        == EXPECTED
        == (
            alpha * alpha * chi / 20,
            alpha * alpha * chi / 10,
            alpha * alpha * chi,
            2 * alpha * chi,
            3 * alpha * chi,
            4 * alpha * chi,
        )
    )
    assert all(type(value) is F and value > 0 for value in S.branch_constants())
    assert len(set(S.branch_constants())) == 6


@pytest.mark.parametrize("change", ["append", "coefficient", "branch-order"])
def test_full58_source_sha_refuses_formula_and_branch_drift(change):
    raw = (ROOT / S.PROFILE_SOURCE).read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered full58 profile\n"
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


def test_full58_source_bridge_retains_unedited_speed_and_shift_functions(monkeypatch):
    raw = (ROOT / S.PROFILE_SOURCE).read_bytes()
    S.verify_source(raw)
    parsed = ast.parse(raw.decode("utf-8"))
    background = next(
        node
        for node in parsed.body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    speeds = next(
        node
        for node in background.body
        if isinstance(node, ast.FunctionDef) and node.name == "squared_speeds"
    )
    intrinsic = next(
        node
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name == "intrinsic"
    )
    translated, audit = S.translated_ast(raw)
    expected = ast.Module(body=[speeds, intrinsic], type_ignores=[])
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        expected, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]

    def forbidden_math_import():
        raise AssertionError("pure manifest must not load scientific modules")

    monkeypatch.setattr(S, "_modules", forbidden_math_import)
    bridge = S.source_bridge_manifest()
    assert bridge["compiled"] == audit
    assert bridge["branches"] == [
        "ordering-T",
        "ordering-L",
        "light",
        "lapse",
        "shift-T",
        "shift-L",
    ]
    assert bridge["shift"] == "K0=K-b*diag(0_11,I_47)"
    assert "r^2" not in bridge["recurrence"]


@pytest.mark.parametrize(
    "name",
    ["BRANCHES", "BRANCH_RATIONALS", "MATRIX_CAPS", "MATRIX_ORDER", "NEGATIVE_CAPS"],
)
def test_full58_registered_state_refuses_runtime_drift(monkeypatch, name):
    original = getattr(S, name)
    if isinstance(original, dict):
        changed = dict(original)
        changed[next(iter(changed))] += 1
    else:
        changed = tuple(reversed(original))
    monkeypatch.setattr(S, name, changed)
    with pytest.raises(ValueError):
        S.branch_constants()
    with pytest.raises(ValueError):
        S.source_bridge_manifest()


def test_full58_parent_status_accepts_the_frozen_complete_closure(parent_records):
    S.validate_parent_status(*parent_records)


@pytest.mark.parametrize(
    "change",
    ["failed", "incomplete", "scope", "cleanup", "source", "input", "worker-binding"],
)
def test_full58_parent_status_refuses_unqualified_or_drifted_inputs(
    parent_records, change
):
    gate, worker = copy.deepcopy(parent_records)
    if change == "failed":
        worker["passed"] = False
    elif change == "incomplete":
        worker["completed"] = False
    elif change == "scope":
        worker["live_admission"] = True
    elif change == "cleanup":
        gate["supervisor"]["cleanup_verified"] = False
    elif change == "source":
        worker["source_after"][S.PROFILE_SOURCE] = "0" * 64
    elif change == "input":
        gate["artifact_hashes"]["K.json"] = "0" * 64
    else:
        gate["artifact_hashes"]["worker-result.json"] = "0" * 64
    with pytest.raises(ValueError):
        S.validate_parent_status(gate, worker)


@pytest.mark.parametrize("branch", [0, 1, 2, 3, 4, 5])
def test_full58_all_six_homogeneous_companions_require_the_registered_factors(
    algebra, branch
):
    x, _, _ = algebra.gens
    # A nonunit g tests the unnormalized speed, with no denominator r or r^2.
    squared = 3 * EXPECTED[branch]
    original = matrix([[0, squared * x], [x, 0]], algebra)
    result = run(original, 3 * x**2)
    assert tuple(result) == STAGES
    assert decoded(result["Q"]) == decoded(
        matrix([[squared * x**2, 0], [0, squared * x**2]], algebra)
    )
    for j in range(1, 7):
        coefficient = product(3 * (EXPECTED[branch] - c) for c in EXPECTED[:j])
        expected = matrix(
            [
                [0, squared * coefficient * x ** (2 * j + 1)],
                [coefficient * x ** (2 * j + 1), 0],
            ],
            algebra,
        )
        assert decoded(result[f"Z{j}"]) == decoded(expected)
        assert bool(coefficient) is (j <= branch)
    assert V.zero_check(decoded(result["Z6"]), (2, 2)) == 4


def test_full58_scalar_thirteenth_degree_expansion_has_all_cross_terms(algebra):
    x, y, _ = algebra.gens
    result = run(matrix([[x]], algebra), y**2)
    expected = {}
    for k in range(7):
        coefficient = (-1) ** k * sum(
            (product(selected) for selected in combinations(EXPECTED, k)), F(0)
        )
        expected[(13 - 2 * k, 2 * k, 0)] = coefficient
    assert decoded(result["Z6"]) == [[expected]]
    assert len(expected) == 7
    assert all(sum(exponent) == 13 for exponent in expected)
    assert expected[(13, 0, 0)] == 1
    assert expected[(1, 12, 0)] == product(EXPECTED)


def test_full58_nonzero_nilpotent_survives_the_odd_polynomial(algebra):
    x, y, _ = algebra.gens
    nilpotent = matrix([[0, x], [0, 0]], algebra)
    result = run(nilpotent, 2 * y**2)
    assert V.zero_check(decoded(result["Q"]), (2, 2)) == 4
    coefficient = 64 * product(EXPECTED)
    assert decoded(result["Z6"]) == [
        [{}, {(1, 12, 0): coefficient}],
        [{}, {}],
    ]
    # x*y^12 vanishes on every coordinate axis but is not a polynomial identity.
    assert all(sum(power > 0 for power in exponent) > 1 for exponent in [(1, 12, 0)])
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check(decoded(result["Z6"]), (2, 2))


def test_full58_nilpotent_witness_retains_every_exact_stage_and_full_slots(algebra):
    _, y, _ = algebra.gens
    result = S.nilpotent_witness(2 * y**2, guard=lambda: None)
    assert result["schema"] == "nr-case12-full58-spectral-nilpotent-v1"
    assert result["constants"] == [str(value) for value in EXPECTED]
    assert result["square_zero"] is True
    assert result["expected_identity"] is True
    assert result["zero_mode_rejected"] is True
    assert result["nonzero_slots"] == result["coefficients"] == 1
    assert tuple(result["stages"]) == ("Z1", "Z2", "Z3", "Z4", "Z5", "Z6")
    assert V.decode_matrix(result["N"], shape=(2, 2), max_degree=1) == [
        [{}, {(1, 0, 0): F(1)}],
        [{}, {}],
    ]
    assert (
        V.zero_check(V.decode_matrix(result["Q"], shape=(2, 2), max_degree=2), (2, 2))
        == 4
    )
    for j in range(1, 7):
        record = result["stages"][f"Z{j}"]
        assert len(record["entries"]) == 4
        expected = (-2) ** j * product(EXPECTED[:j])
        assert V.decode_matrix(record, shape=(2, 2), max_degree=13) == [
            [{}, {(1, 2 * j, 0): expected}],
            [{}, {}],
        ]
    assert result["expected_Z6"] == result["stages"]["Z6"]


def test_full58_no_hidden_r_squared_or_g_normalization_is_permitted(algebra):
    x, _, _ = algebra.gens
    original = matrix([[0, 3 * EXPECTED[0] * x], [x, 0]], algebra)
    correct = run(original, 3 * x**2)
    wrong = run(original, 27 * x**2)
    assert V.zero_check(decoded(correct["Z6"]), (2, 2)) == 4
    assert decoded(wrong["Z6"])[0][1]
    assert decoded(wrong["Z6"])[1][0]


def test_full58_nonzero_stages_are_saved_and_never_rewritten(algebra):
    x, y, _ = algebra.gens
    original = matrix([[x, y], [0, x]], algebra)
    before = copy.deepcopy(P.encode_matrix(original))
    saved = []

    def sink(name, value):
        saved.append((name, value, copy.deepcopy(P.encode_matrix(value))))

    result = run(original, algebra.one, sink=sink)
    assert [name for name, _, _ in saved] == list(STAGES)
    assert P.encode_matrix(original) == before
    assert any(cell for row in decoded(result["Z6"]) for cell in row)
    for name, retained, record in saved:
        assert retained is result[name]
        assert P.encode_matrix(retained) == record


def test_full58_zero_stages_serialize_every_matrix_coordinate(algebra):
    result = run(zero_matrix(2, 2, algebra), algebra.one)
    for stage in STAGES:
        record = P.encode_matrix(result[stage])
        assert record["shape"] == [2, 2]
        assert record["entries"] == [
            [0, 0, []],
            [0, 1, []],
            [1, 0, []],
            [1, 1, []],
        ]
        assert V.zero_check(decoded(result[stage]), (2, 2)) == 4


@pytest.mark.parametrize("change", ["missing", "order", "float", "integer", "list"])
def test_full58_branch_registration_refuses_approximations_or_partial_sets(
    algebra, change
):
    constants = {
        "missing": EXPECTED[:-1],
        "order": tuple(reversed(EXPECTED)),
        "float": (float(EXPECTED[0]),) + EXPECTED[1:],
        "integer": (1,) + EXPECTED[1:],
        "list": list(EXPECTED),
    }[change]
    with pytest.raises(ValueError):
        S.spectral_recurrence(matrix([[1]], algebra), algebra.one, constants)


@pytest.mark.parametrize(
    "change", ["empty", "rectangular", "float", "integer", "wrong-ring", "list"]
)
def test_full58_recurrence_refuses_inexact_or_malformed_matrices(algebra, change):
    value = matrix([[1]], algebra)
    if change == "empty":
        value = np.empty((0, 0), dtype=object)
    elif change == "rectangular":
        value = matrix([[1, 0]], algebra)
    elif change == "float":
        value[0, 0] = 1.0
    elif change == "integer":
        value[0, 0] = 1
    elif change == "wrong-ring":
        other = ring("u,v,w", QQ)[0]
        value[0, 0] = other.gens[0]
    else:
        value = value.tolist()
    with pytest.raises(ValueError):
        run(value, algebra.one)


@pytest.mark.parametrize("change", ["zero", "float", "fraction", "wrong-ring"])
def test_full58_recurrence_refuses_invalid_speed_polynomials(algebra, change):
    other = ring("u,v,w", QQ)[0]
    value = {
        "zero": algebra.zero,
        "float": 1.0,
        "fraction": F(1),
        "wrong-ring": other.one,
    }[change]
    with pytest.raises(ValueError):
        run(matrix([[1]], algebra), value)


@pytest.mark.parametrize("fail_at", [1, 3])
def test_full58_deadline_guard_exception_escapes_without_a_result(algebra, fail_at):
    calls = 0

    def guard():
        nonlocal calls
        calls += 1
        if calls == fail_at:
            raise RuntimeError("owned synthetic deadline")

    with pytest.raises(RuntimeError, match="owned synthetic deadline"):
        run(matrix([[1]], algebra), algebra.one, guard=guard)
    assert calls == fail_at


def test_full58_sink_exception_stops_before_later_stages(algebra):
    names = []

    def sink(name, value):
        names.append(name)
        if name == "Z2":
            raise RuntimeError("owned synthetic storage refusal")

    with pytest.raises(RuntimeError, match="owned synthetic storage refusal"):
        run(matrix([[1]], algebra), algebra.one, sink=sink)
    assert names == ["Q", "Z1", "Z2"]


@pytest.mark.parametrize(
    "value,degree", [("linear", 1), ("quadratic", 2), ("zero", 13)]
)
def test_full58_homogeneous_gate_accepts_exact_degree_and_complete_zeros(
    algebra, value, degree
):
    x, y, _ = algebra.gens
    entry = {"linear": x - 2 * y, "quadratic": x * y, "zero": algebra.zero}[value]
    S.validate_homogeneous(matrix([[entry, 0], [0, 0]], algebra), degree)


@pytest.mark.parametrize(
    "value,degree",
    [
        ("constant", 1),
        ("mixed", 1),
        ("quadratic", 1),
        ("float", 1),
        ("linear", True),
        ("linear", -1),
    ],
)
def test_full58_homogeneous_gate_refuses_mixed_or_unregistered_degrees(
    algebra, value, degree
):
    x, y, _ = algebra.gens
    entry = {
        "constant": algebra.one,
        "mixed": x + 1,
        "quadratic": x * y,
        "float": 1.0,
        "linear": x,
    }[value]
    array = np.array([[entry]], dtype=object)
    with pytest.raises(ValueError):
        S.validate_homogeneous(array, degree)


@pytest.mark.parametrize("row,column", [(0, 11), (10, 57), (11, 0), (57, 10), (0, 0)])
def test_full58_fixed_base_rows_and_columns_must_both_be_zero(algebra, row, column):
    value = zero_matrix(58, 58, algebra)
    value[row, column] = algebra.gens[0]
    with pytest.raises(ValueError):
        S.validate_structure(value)


def test_full58_structure_rejects_a_truncated_operator(algebra):
    with pytest.raises(ValueError):
        S.validate_structure(zero_matrix(47, 47, algebra))


def test_full58_shift_uses_only_dynamical_coordinates_and_embeds_all_slots(
    algebra, monkeypatch
):
    x, y, z = algebra.gens
    b = 2 * x - 3 * y + z
    original = zero_matrix(58, 58, algebra)
    for i in range(11, 58):
        original[i, i] = b
    original[11, 12] = x
    original[57, 11] = y
    before = P.encode_matrix(original)
    observed = []
    stages = {}

    def recording_recurrence(value, g, constants=None, *, guard, sink):
        assert value.shape == (47, 47)
        assert g == x**2 + y**2 + z**2
        assert constants is None or constants == EXPECTED
        expected = zero_matrix(47, 47, algebra)
        expected[0, 1] = x
        expected[46, 0] = y
        assert decoded(value) == decoded(expected)
        observed.append(value.shape)
        for index, name in enumerate(STAGES):
            degree = 2 if name == "Q" else 2 * index + 1
            stage = zero_matrix(47, 47, algebra)
            stage[0, 46] = x**degree
            stages[name] = stage
            sink(name, stage)
        return stages

    saved = []

    def sink(name, value):
        saved.append((name, value, copy.deepcopy(P.encode_matrix(value))))

    monkeypatch.setattr(S, "spectral_recurrence", recording_recurrence)
    result = S.full58_from_matrix(
        original, b, x**2 + y**2 + z**2, guard=lambda: None, sink=sink
    )
    assert observed == [(47, 47)]
    assert P.encode_matrix(original) == before
    names = ("Pi", "K0", "shift_residual", "embedding_residual") + STAGES
    assert tuple(result["matrices"]) == names
    assert [name for name, _, _ in saved] == list(names)
    pi = result["matrices"]["Pi"]
    k0 = result["matrices"]["K0"]
    for i in range(58):
        for j in range(58):
            assert pi[i, j] == (algebra.one if i == j and i >= 11 else algebra.zero)
            expected = (
                x if (i, j) == (11, 12) else y if (i, j) == (57, 11) else algebra.zero
            )
            assert k0[i, j] == expected
    for name in ("shift_residual", "embedding_residual"):
        assert V.zero_check(decoded(result["matrices"][name]), (58, 58)) == 3364
    for name in STAGES:
        value = result["matrices"][name]
        assert value.shape == (58, 58)
        record = P.encode_matrix(value)
        assert len(record["entries"]) == 3364
        assert [(i, j) for i, j, terms in record["entries"] if terms] == [(11, 57)]
        assert value[11, 57] == stages[name][0, 46]
    for name, retained, record in saved:
        assert retained is result["matrices"][name]
        assert P.encode_matrix(retained) == record
    assert result["acceptance"]["annihilator_zero"] is False
    assert result["acceptance"]["accepted"] is False

    # Subtracting b*I58 changes the eleven frozen coordinates and is rejected.
    wrong = original.copy()
    for i in range(58):
        wrong[i, i] -= b
    assert wrong[0, 0] == -b and k0[0, 0] == 0
    with pytest.raises(ValueError):
        S.validate_structure(wrong)


def test_full58_mutation_changes_the_registered_real_residual_coordinate(algebra):
    x, y, _ = algebra.gens
    original = zero_matrix(58, 58, algebra)
    original[12, 12] = y**13
    before = P.encode_matrix(original)
    result = S.mutation_witness({"matrices": {"Z6": original}}, guard=lambda: None)
    assert P.encode_matrix(original) == before
    delta, mutant = result["delta_Z6"], result["mutant_Z6"]
    assert delta.shape == mutant.shape == (58, 58)
    delta_record = P.encode_matrix(delta)
    mutant_record = P.encode_matrix(mutant)
    assert len(delta_record["entries"]) == len(mutant_record["entries"]) == 3364
    assert [(i, j) for i, j, terms in delta_record["entries"] if terms] == [(11, 11)]
    assert [(i, j) for i, j, terms in mutant_record["entries"] if terms] == [
        (11, 11),
        (12, 12),
    ]
    assert delta[11, 11] == mutant[11, 11] == x**13
    assert mutant[12, 12] == y**13
    assert result["metadata"]["name"] == "add-x13-to-Z6-11-11"
    assert result["metadata"]["rejected"] is True
    with pytest.raises(ValueError, match="nonzero polynomial residual"):
        V.zero_check(decoded(mutant), (58, 58))
    with pytest.raises(ValueError):
        S.validate_zero_residual(mutant)

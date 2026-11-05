"""Cheap projector/action controls for the single registered owned batch.

Only one- and two-dimensional examples are constructed here. Full directional
matrices and any energy matrix belong to separate registered computations.
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

import nr_case12_polynomial_projectors as J  # noqa: E402
import nr_case12_polynomial_spectral as S  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

CONSTANTS = (
    F(2601, 100000),
    F(2601, 50000),
    F(2601, 5000),
    F(153, 125),
    F(459, 250),
    F(306, 125),
)
INPUT_NAMES = ("X", "Q", "Z1", "Z2", "Pt", "r", "g", "constants", "univariate")
STAGES = (
    "Q2",
    "Q3",
    "X3",
    "X5",
    "NO",
    "N1",
    "N2",
    "N3",
    "N4",
    "N5",
    "N6",
    "N0",
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
    "projector_completeness",
    "action_completeness",
)


@pytest.fixture(scope="module")
def context():
    return S.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def univariate():
    return S.univariate_certificate()


@pytest.fixture(scope="module")
def actions(univariate):
    return J.action_univariate_certificate(univariate, guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-polynomial-projectors.py"
    spec = importlib.util.spec_from_file_location(
        "owned_projector_action_control", path
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


def zero_check(value):
    return V.zero_check(decoded(value), value.shape)


def input_data(x, context, univariate, *, r=F(3), g=F(2), pt=None):
    rp, gp = poly(r, context), poly(g, context)
    spectral = S.recurrence(x, rp, gp, CONSTANTS, guard=lambda: None)
    if pt is None:
        pt = matrix(
            [[r if i == j else 0 for j in range(len(x))] for i in range(len(x))],
            context,
        )
    return {
        **{name: spectral[name] for name in ("X", "Q", "Z1", "Z2")},
        "Pt": pt,
        "r": rp,
        "g": gp,
        "constants": CONSTANTS,
        "univariate": univariate,
    }


def construct(data, *, guard=lambda: None, sink=lambda name, value: None):
    return J.projectors_from_matrices(
        *(data[name] for name in INPUT_NAMES), guard=guard, sink=sink
    )


@pytest.fixture(scope="module")
def basic_inputs(context, univariate):
    x = matrix([[0, 18 * CONSTANTS[0]], [1, 0]], context)
    return input_data(x, context, univariate)


@pytest.mark.parametrize("change", ["append", "zero-separation", "action-order"])
def test_original_projector_source_drift_is_refused(change):
    raw = (ROOT / "scripts/nr_constraint_laurent_energy.py").read_bytes()
    if change == "append":
        changed = raw + b"\n# unregistered projector source\n"
    else:
        old, new = {
            "zero-separation": (
                b"e0 = p - sum(pairs, zero.copy())",
                b"e0 = p + sum(pairs, zero.copy())",
            ),
            "action-order": (
                b"actions.append(mul(k, e))",
                b"actions.append(mul(e, k))",
            ),
        }[change]
        assert old in raw
        changed = raw.replace(old, new, 1)
    with pytest.raises(ValueError):
        J.verify_source(changed)
    with pytest.raises(ValueError):
        J.translated_ast(changed)


def test_original_paired_formula_is_bound_without_executing_the_energy_builder():
    raw = (ROOT / "scripts/nr_constraint_laurent_energy.py").read_bytes()
    source = next(
        node
        for node in ast.parse(raw.decode("utf-8")).body
        if isinstance(node, ast.FunctionDef) and node.name == "paired_energy"
    )
    translated, audit = J.translated_ast(raw)
    assert [node.name for node in translated.body] == ["paired_energy"]
    assert ast.dump(translated.body[0], include_attributes=False) == ast.dump(
        source, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]


def test_independent_action_replay_preserves_six_branches_and_exact_completeness(
    actions, univariate, replay_runner
):
    coefficients = replay_runner.verify_action_univariate(actions, univariate)
    assert len(coefficients) == 6
    assert coefficients == [
        [F(value) for value in row["coefficients"]] for row in actions["rows"]
    ]
    assert coefficients[3:] == [[F(0), F(0), F(0)]] * 3
    assert [sum(row[index] for row in coefficients) for index in range(3)] == [
        F(1),
        F(0),
        F(0),
    ]


@pytest.mark.parametrize(
    "change",
    [
        "order",
        "coefficient",
        "remainder",
        "original-projector",
        "original-action",
        "quotient",
        "raw-odd",
        "missing-branch",
        "accepted",
    ],
)
def test_independent_action_replay_refuses_corrupted_source_or_division_witness(
    actions, univariate, replay_runner, change
):
    record = copy.deepcopy(actions)
    if change == "order":
        record["rows"][0], record["rows"][1] = record["rows"][1], record["rows"][0]
    elif change == "coefficient":
        value = F(record["rows"][0]["coefficients"][0]) + 1
        record["rows"][0]["coefficients"][0] = str(value)
    elif change == "remainder":
        record["rows"][0]["remainder"] = [[0, "1", "1"]]
    elif change == "original-projector":
        record["rows"][0]["original_projector"] = []
    elif change == "original-action":
        record["rows"][0]["original_polynomial"] = copy.deepcopy(
            record["rows"][0]["remainder"]
        )
    elif change == "quotient":
        record["rows"][0]["quotient"] = []
    elif change == "raw-odd":
        record["odd_annihilator"] = [[7, "1", "1"]]
    elif change == "missing-branch":
        record["rows"].pop()
    else:
        record["accepted"] = False
    with pytest.raises(ValueError):
        replay_runner.verify_action_univariate(record, univariate)


def test_action_certificate_propagates_owned_stop_without_retry(univariate):
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned action stop")

    with pytest.raises(RuntimeError, match="owned action stop"):
        J.action_univariate_certificate(univariate, guard=stop)
    assert calls == [1]


@pytest.mark.parametrize(
    "branch,sign", [(1, 1), (1, -1), (2, 1), (2, -1), (3, 1), (3, -1)]
)
def test_companion_projectors_and_actions_have_the_exact_nonunit_r_g_scale(
    context, univariate, branch, sign
):
    r, g = F(3), F(2)
    x = matrix([[0, sign * r * r * g * CONSTANTS[branch - 1]], [sign, 0]], context)
    result = construct(input_data(x, context, univariate, r=r, g=g))
    denominator, action_scale = r**6 * g**3, r**4 * g**2
    assert set(result) == set(STAGES)
    assert zero_check(result["NO"]) == zero_check(result["N0"]) == 4
    for index in range(1, 7):
        expected_projector = (
            matrix([[denominator, 0], [0, denominator]], context)
            if index == branch
            else matrix([[0, 0], [0, 0]], context)
        )
        expected_action = (
            x * action_scale if index == branch else matrix([[0, 0], [0, 0]], context)
        )
        assert decoded(result["N" + str(index)]) == decoded(expected_projector)
        assert decoded(result["M" + str(index)]) == decoded(expected_action)
    assert zero_check(result["projector_completeness"]) == 4
    assert zero_check(result["action_completeness"]) == 4


def test_odd_power_recovery_matches_independent_small_matrix_products(
    context, univariate
):
    x, y, z = context["background"].ray
    operator = matrix([[x, y], [0, z]], context)
    result = construct(input_data(operator, context, univariate))
    raw = decoded(operator)
    square = V.multiply(raw, raw)
    cube = V.multiply(square, raw)
    fourth = V.multiply(square, square)
    fifth = V.multiply(fourth, raw)
    sixth = V.multiply(fourth, square)
    assert decoded(result["X3"]) == cube
    assert decoded(result["X5"]) == fifth
    assert decoded(result["Q2"]) == fourth
    assert decoded(result["Q3"]) == sixth


def test_reversing_intrinsic_sign_preserves_projectors_and_reverses_actions(
    context, univariate
):
    x = matrix([[0, 18 * CONSTANTS[1]], [1, 0]], context)
    forward = construct(input_data(x, context, univariate))
    reverse = construct(input_data(-x, context, univariate))
    for key in ("NO", "N0", "N1", "N2", "N3", "N4", "N5", "N6"):
        assert decoded(forward[key]) == decoded(reverse[key])
    for key in ("X3", "X5", "M1", "M2", "M3", "M4", "M5", "M6"):
        assert decoded(reverse[key]) == decoded(-forward[key])


@pytest.fixture(scope="module")
def zero_components(context, univariate):
    r, g = F(3), F(2)
    pt = matrix([[0, 0], [0, r]], context)
    result = construct(
        input_data(
            matrix([[0, 0], [0, 0]], context), context, univariate, r=r, g=g, pt=pt
        )
    )
    return result, poly(r**6 * g**3, context)


def test_ode_and_zero_speed_subspaces_are_kept_as_distinct_projectors(
    context, zero_components
):
    result, denominator = zero_components
    assert decoded(result["NO"]) == decoded(matrix([[denominator, 0], [0, 0]], context))
    assert decoded(result["N0"]) == decoded(matrix([[0, 0], [0, denominator]], context))
    assert decoded(result["NO"]) != decoded(result["N0"])
    for index in range(1, 7):
        assert zero_check(result["N" + str(index)]) == 4
        assert zero_check(result["M" + str(index)]) == 4
    assert zero_check(result["projector_completeness"]) == 4


def component_subset(result):
    return {
        name: result[name] for name in ("NO", "N0", "N1", "N2", "N3", "N4", "N5", "N6")
    }


def test_trace_ranks_come_from_actual_small_projector_matrices(zero_components):
    result, denominator = zero_components
    record = J.trace_certificate(
        component_subset(result), denominator, expected_ode_rank=1, guard=lambda: None
    )
    assert record["accepted"] is True
    assert record["rank_sum"] == 2
    rows = {row["name"]: row for row in record["rows"]}
    assert len(rows) == 8
    assert [
        rows[name]["rank"] for name in ("NO", "N0", "N1", "N2", "N3", "N4", "N5", "N6")
    ] == [1, 1, 0, 0, 0, 0, 0, 0]
    assert all(
        row["residual"] == [] and row["satisfied"] is True for row in rows.values()
    )


@pytest.mark.parametrize("change", ["fractional-rank", "directional-trace", "rank-sum"])
def test_trace_candidate_failures_preserve_evidence_without_assigned_ranks(
    context, zero_components, change
):
    result, denominator = zero_components
    components = {
        name: value.copy() for name, value in component_subset(result).items()
    }
    if change == "fractional-rank":
        components["NO"][0, 0] = denominator / 2
    elif change == "directional-trace":
        components["NO"][0, 0] += context["field"].ring.gens[0] * denominator
    else:
        components["N1"][0, 0] = denominator
    record = J.trace_certificate(
        components, denominator, expected_ode_rank=1, guard=lambda: None
    )
    assert record["accepted"] is False
    rows = {row["name"]: row for row in record["rows"]}
    if change == "fractional-rank":
        assert rows["NO"]["candidate"] == "1/2"
        assert rows["NO"]["rank"] is None
        assert rows["NO"]["satisfied"] is False
    elif change == "directional-trace":
        assert rows["NO"]["residual"]
        assert rows["NO"]["rank"] is None
    else:
        assert rows["N1"]["rank"] == 1
        assert record["rank_sum"] == 3


def test_expected_ode_rank_does_not_override_the_measured_rank(zero_components):
    result, denominator = zero_components
    record = J.trace_certificate(
        component_subset(result), denominator, expected_ode_rank=2, guard=lambda: None
    )
    assert record["accepted"] is False
    assert record["rows"][0]["name"] == "NO"
    assert record["rows"][0]["rank"] == 1


def test_trace_certificate_propagates_owned_stop_without_retry(zero_components):
    result, denominator = zero_components
    calls = []

    def stop():
        calls.append(1)
        raise RuntimeError("owned trace stop")

    with pytest.raises(RuntimeError, match="owned trace stop"):
        J.trace_certificate(component_subset(result), denominator, guard=stop)
    assert calls == [1]


@pytest.mark.parametrize("name", ["N4", "N5", "N6", "M4", "M5", "M6"])
def test_absent_original_branches_retain_explicit_zero_matrix_coordinates(
    basic_inputs, name
):
    result = construct(basic_inputs)
    record = P.encode_matrix(result[name])
    assert record["shape"] == [2, 2]
    assert record["entries"] == [[0, 0, []], [0, 1, []], [1, 0, []], [1, 1, []]]


def test_every_stage_is_saved_without_later_mutation_or_missing_zero_branches(
    basic_inputs,
):
    stored, references = [], []

    def sink(name, value):
        stored.append((name, P.encode_matrix(value)))
        references.append(value)

    result = construct(basic_inputs, sink=sink)
    assert [name for name, _ in stored] == list(STAGES)
    for (name, record), reference in zip(stored, references, strict=True):
        assert record == P.encode_matrix(reference) == P.encode_matrix(result[name])
        assert len(record["entries"]) == 4


def test_sink_error_stops_after_the_registered_completed_stage(basic_inputs):
    names = []

    def sink(name, value):
        names.append(name)
        if name == "N0":
            raise RuntimeError("owned projector save stop")

    with pytest.raises(RuntimeError, match="owned projector save stop"):
        construct(basic_inputs, sink=sink)
    assert names == list(STAGES[:12])


@pytest.mark.parametrize("name", ["X", "Q", "Z1", "Z2", "Pt"])
def test_matrix_shape_drift_is_refused_before_family_construction(
    context, basic_inputs, name
):
    data = {**basic_inputs, name: matrix([[1]], context)}
    with pytest.raises(ValueError):
        construct(data)


@pytest.mark.parametrize("value", [0.0, True, F(0)])
def test_nonpolynomial_input_matrix_values_are_refused(basic_inputs, value):
    data = {
        **basic_inputs,
        "X": np.array([[value, value], [value, value]], dtype=object),
    }
    with pytest.raises(ValueError):
        construct(data)


@pytest.mark.parametrize("name", ["r", "g"])
def test_zero_direction_scalars_are_refused(context, basic_inputs, name):
    with pytest.raises(ValueError):
        construct({**basic_inputs, name: poly(0, context)})


@pytest.mark.parametrize("value", [0.5, True, F(1), None])
def test_nonpolynomial_direction_scalar_is_refused(basic_inputs, value):
    with pytest.raises(ValueError):
        construct({**basic_inputs, "r": value})


def test_foreign_polynomial_coordinates_are_refused(basic_inputs):
    _, u, _, _ = ring("u,v,w", QQ)
    with pytest.raises(ValueError):
        construct({**basic_inputs, "r": u})


@pytest.mark.parametrize("change", ["float", "permuted", "short", "list"])
def test_original_six_branch_contract_cannot_be_changed(basic_inputs, change):
    values = list(CONSTANTS)
    if change == "float":
        values[0] = float(values[0])
    elif change == "permuted":
        values[0], values[1] = values[1], values[0]
    elif change == "short":
        values.pop()
    candidate = values if change == "list" else tuple(values)
    with pytest.raises(ValueError):
        construct({**basic_inputs, "constants": candidate})


def test_guard_stops_projector_work_without_retry_or_sink_emission(basic_inputs):
    calls, names = [], []

    def stop():
        calls.append(1)
        raise RuntimeError("owned projector stop")

    with pytest.raises(RuntimeError, match="owned projector stop"):
        construct(basic_inputs, guard=stop, sink=lambda name, value: names.append(name))
    assert calls == [1] and names == []


@pytest.mark.parametrize("change", ["missing-zero", "duplicate", "shape", "schema"])
def test_saved_projection_requires_complete_canonical_matrix_slots(context, change):
    record = P.encode_matrix(matrix([[1, 0], [0, 0]], context))
    if change == "missing-zero":
        del record["entries"][1]
    elif change == "duplicate":
        record["entries"][-1] = copy.deepcopy(record["entries"][0])
    elif change == "shape":
        record["shape"] = [1, 4]
    else:
        record["schema"] = "unregistered-projector-record"
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(2, 2), max_degree=0)


def test_reconstructed_odd_power_keeps_a_detectable_degree_bound(context, univariate):
    x, _, _ = context["background"].ray
    data = input_data(matrix([[x]], context), context, univariate)
    result = construct(data)
    assert decoded(result["X5"]) == [[{(5, 0, 0): F(1)}]]
    with pytest.raises(ValueError):
        V.decode_matrix(P.encode_matrix(result["X5"]), shape=(1, 1), max_degree=4)

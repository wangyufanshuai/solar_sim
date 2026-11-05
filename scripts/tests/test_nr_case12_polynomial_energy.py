"""Independent small controls for the single owned H/Gram certificate batch.

These controls use one- and two-dimensional energy examples, never reconstruct
the accepted parent matrices and never confer a full-system evolution claim.
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

import nr_case12_polynomial_energy as E  # noqa: E402
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
COMPONENTS = (
    "NO",
    "N0",
    "N1",
    "N2",
    "N3",
    "N4",
    "N5",
    "N6",
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
)
STAGES = (
    "Gt",
    "F_NO",
    "F_N0",
    "F_N1",
    "F_N2",
    "F_N3",
    "F_N4",
    "F_N5",
    "F_N6",
    "Hbar",
    "Cgram",
    "Hsym",
    "HL",
    "HP",
    "Gram",
)


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-polynomial-energy.py"
    spec = importlib.util.spec_from_file_location("owned_energy_control", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def poly(value, context):
    return P.polynomial(value, context["field"])


def matrix(values, context):
    return np.array(
        [[poly(value, context) for value in row] for row in values], dtype=object
    )


def scale(value, scalar, context):
    return matrix([[scalar * item for item in row] for row in value], context)


def decoded(value):
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=24)


def scalar_record(value):
    return V.decode_polynomial(P.canonical_polynomial(value), max_degree=24)


@pytest.fixture(scope="module")
def energy_inputs(context):
    # c1*g=1, L^2=I, and G=Gt/r=diag(1/3,1); no unit-r shortcut.
    r, g = poly(3, context), poly(1 / CONSTANTS[0], context)
    direction = matrix([[0, 2], [F(1, 2), 0]], context)
    eye = matrix([[1, 0], [0, 1]], context)
    components = {name: matrix([[0, 0], [0, 0]], context) for name in COMPONENTS}
    components["N1"] = scale(eye, r * g**3, context)
    components["M1"] = scale(direction, r * g**2, context)
    return dict(
        components=components,
        X=scale(direction, r, context),
        Pt=scale(eye, r, context),
        r=r,
        g=g,
        constants=CONSTANTS,
        scaled_rows=(0,),
    )


def construct(data, *, guard=lambda: None, sink=lambda name, value: None):
    return E.energy_from_matrices(
        data["components"],
        data["X"],
        data["Pt"],
        data["r"],
        data["g"],
        data["constants"],
        scaled_rows=data["scaled_rows"],
        guard=guard,
        sink=sink,
    )


@pytest.fixture(scope="module")
def energy_result(energy_inputs):
    stored, references = [], []
    before = {
        name: P.encode_matrix(value)
        for name, value in energy_inputs["components"].items()
    }
    before.update({name: P.encode_matrix(energy_inputs[name]) for name in ("X", "Pt")})

    def sink(name, value):
        stored.append((name, P.encode_matrix(value)))
        references.append(value)

    return construct(energy_inputs, sink=sink), stored, references, before


@pytest.mark.parametrize("change", ["append", "pair-weight", "gram-difference"])
def test_frozen_energy_source_refuses_weight_or_gram_formula_drift(change):
    raw = (ROOT / "scripts/nr_constraint_laurent_energy.py").read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered energy source\n"
    else:
        old, new = {
            "pair-weight": (b"*(F(1, 2) for _ in pairs)", b"*(F(1, 3) for _ in pairs)"),
            "gram-difference": (
                b"difference = e - eye / (denominator * a)",
                b"difference = e + eye / (denominator * a)",
            ),
        }[change]
        assert old in raw
        altered = raw.replace(old, new, 1)
    with pytest.raises(ValueError):
        E.verify_source(altered)
    with pytest.raises(ValueError):
        E.translated_ast(altered)


def test_source_binding_preserves_the_original_paired_energy_ast():
    raw = (ROOT / "scripts/nr_constraint_laurent_energy.py").read_bytes()
    E.verify_source(raw)
    original = ast.Module(
        body=[
            node
            for node in ast.parse(raw.decode("utf-8")).body
            if isinstance(node, ast.FunctionDef) and node.name == "paired_energy"
        ],
        type_ignores=[],
    )
    translated, audit = E.translated_ast(raw)
    assert [node.name for node in translated.body] == ["paired_energy"]
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        original, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]


@pytest.mark.parametrize("cached", [False, True])
def test_rectangular_weighted_gram_matches_hand_calculated_cross_terms(
    context, replay_runner, cached
):
    x, y, z = context["field"].ring.gens
    value = matrix([[x, 1], [0, y], [z, 0]], context)
    diagonal = tuple(poly(item, context) for item in (2, 3, 5))
    expected = matrix([[2 * x * x + 5 * z * z, 2 * x], [2 * x, 2 + 3 * y * y]], context)
    actual = E.gram_matrix(value, diagonal, guard=lambda: None, cache_products=cached)
    assert decoded(actual) == decoded(expected)
    replay = replay_runner.independent_gram(
        decoded(value), [scalar_record(item) for item in diagonal]
    )
    assert replay == decoded(expected)


def test_normalized_product_cache_keeps_distinct_signs_and_scalar_multiples(
    context, replay_runner
):
    x, y, _ = context["field"].ring.gens
    p = x + y
    value = matrix([[p, 2 * p], [-3 * p, p]], context)
    diagonal = (poly(2, context), poly(5, context))
    expected = decoded(
        matrix([[47 * p * p, -11 * p * p], [-11 * p * p, 13 * p * p]], context)
    )
    assert decoded(E.gram_matrix(value, diagonal, cache_products=False)) == expected
    assert decoded(E.gram_matrix(value, diagonal, cache_products=True)) == expected
    assert (
        replay_runner.independent_gram(
            decoded(value), [scalar_record(item) for item in diagonal]
        )
        == expected
    )


def test_general_symmetrizer_residuals_keep_both_sides_when_H_is_nonsymmetric(context):
    h = matrix([[1, 1], [0, 1]], context)
    x = matrix([[0, 2], [F(1, 2), 0]], context)
    pt = matrix([[1, 1], [0, 0]], context)
    result = E.symmetrizer_residuals(h, x, pt, guard=lambda: None)
    assert decoded(result["Hsym"]) == decoded(matrix([[0, 1], [-1, 0]], context))
    assert decoded(result["HL"]) == decoded(
        matrix([[F(1, 2), F(3, 2)], [F(-3, 2), -2]], context)
    )
    assert decoded(result["HP"]) == decoded(matrix([[0, 0], [-1, -1]], context))


def test_actual_H_coefficients_give_the_exact_reported_uniform_upper_bound(
    context, replay_runner
):
    x, y, z = context["field"].ring.gens
    h = matrix([[x - 2 * y, 3 * x * z], [0, -F(5, 2) + y * y]], context)
    result = E.coefficient_bound(h, guard=lambda: None)
    assert result["schema"] == "nr-case12-energy-coefficient-bound-v1"
    assert result["shape"] == [2, 2]
    assert result["entries"] == [[0, 0, "3"], [0, 1, "3"], [1, 0, "0"], [1, 1, "7/2"]]
    assert result["total"] == "19/2"
    assert result["g_lower"] == "5/6" and result["denominator_power"] == 6
    assert F(result["upper"]) == F(19, 2) / F(5, 6) ** 6
    assert result["lower_energy"] == "1/14"
    assert result["consistent_lower_upper"] is True
    assert replay_runner.coefficient_bound(decoded(h)) == result


def test_zero_energy_bound_keeps_the_contradiction_with_the_proposed_positive_lower_bound(
    context,
):
    result = E.coefficient_bound(matrix([[0]], context))
    assert result["entries"] == [[0, 0, "0"]] and result["total"] == "0"
    assert result["upper"] == "0" and result["lower_energy"] == "1/14"
    assert result["consistent_lower_upper"] is False


@pytest.mark.parametrize("lower", [F(0), F(1), 5 / 6, True])
def test_unregistered_or_inexact_metric_domain_lower_bound_is_refused(context, lower):
    with pytest.raises(ValueError):
        E.coefficient_bound(matrix([[1]], context), lower=lower)


def test_nonzero_real_smoothness_domain_uses_the_bound_metric_and_positive_denominators(
    context,
):
    domain = context["domain"]
    inverse = [[F(value) for value in row] for row in domain["inverse"]]
    # Exact Sylvester minors of h^-1-(5/6)I independently support g >= (5/6)r.
    b = [
        [inverse[i][j] - (F(5, 6) if i == j else 0) for j in range(3)] for i in range(3)
    ]
    determinant = (
        b[0][0] * (b[1][1] * b[2][2] - b[1][2] * b[2][1])
        - b[0][1] * (b[1][0] * b[2][2] - b[1][2] * b[2][0])
        + b[0][2] * (b[1][0] * b[2][1] - b[1][1] * b[2][0])
    )
    assert b[0][0] > 0 and b[0][0] * b[1][1] - b[0][1] * b[1][0] > 0
    assert determinant > 0
    xyz = context["field"].ring.gens
    expected_g = sum(
        (inverse[i][j] * xyz[i] * xyz[j] for i in range(3) for j in range(3)),
        poly(0, context),
    )
    assert scalar_record(poly(context["g"], context)) == scalar_record(expected_g)
    assert scalar_record(poly(context["r"], context)) == scalar_record(
        sum((value * value for value in xyz), poly(0, context))
    )
    assert (
        domain["g_over_r_lower"] == "5/6" and domain["zero_frequency_admitted"] is False
    )
    assert context["source_bridge"]["scaled_rows"] == [0, 1, 2, 3, 41]
    assert context["source_bridge"]["weights"] == [
        "1",
        "1",
        "1/2",
        "1/2",
        "1/2",
        "1/2",
        "1/2",
        "1/2",
    ]


def test_nonunit_direction_and_nonidentity_metric_symmetrize_a_nonsymmetric_operator(
    context, energy_inputs, energy_result
):
    result, _, _, _ = energy_result
    matrices = result["matrices"]
    tau = energy_inputs["r"] ** 3 * energy_inputs["g"] ** 6
    assert decoded(matrices["Gt"]) == decoded(matrix([[1, 0], [0, 3]], context))
    assert decoded(matrices["Hbar"]) == decoded(
        scale(matrix([[F(7, 24), 0], [0, F(7, 6)]], context), tau, context)
    )
    assert decoded(matrices["Cgram"]) == decoded(
        scale(matrix([[F(15, 56), 0], [0, F(23, 21)]], context), tau, context)
    )
    assert decoded(energy_inputs["X"]) != decoded(energy_inputs["X"].T)
    for name in ("Hsym", "HL", "HP", "Gram"):
        assert V.zero_check(decoded(matrices[name]), (2, 2)) == 4
    assert result["acceptance"] == dict(
        energy_symmetry=True,
        intrinsic_symmetrization=True,
        pde_symmetrization=True,
        gram_identity=True,
        uniform_bounds=True,
        accepted=True,
    )


def test_all_eight_gram_offsets_remain_present_even_when_original_projectors_vanish(
    context, energy_inputs, energy_result
):
    result, _, _, _ = energy_result
    denominator = energy_inputs["r"] * energy_inputs["g"] ** 3
    eye = matrix([[1, 0], [0, 1]], context)
    weights = (F(1), F(1), F(1, 2), F(1, 2), F(1, 2), F(1, 2), F(1, 2), F(1, 2))
    assert sum(1 / weight for weight in weights) == 14
    for name, weight in zip(COMPONENTS[:8], weights, strict=True):
        coefficient = (F(1) if name == "N1" else F(0)) - F(1, 14) / weight
        expected = scale(eye, denominator * coefficient, context)
        assert decoded(result["matrices"]["F_" + name]) == decoded(expected)
        assert any(item for row in decoded(expected) for item in row)


def test_gram_is_constructed_independently_and_exposes_incomplete_projectors(
    context, energy_inputs
):
    inputs = {
        **energy_inputs,
        "components": {name: matrix([[0, 0], [0, 0]], context) for name in COMPONENTS},
    }
    result = construct(inputs)
    denominator = inputs["r"] * inputs["g"] ** 3
    gt = matrix([[1, 0], [0, 3]], context)
    assert V.zero_check(decoded(result["matrices"]["Hbar"]), (2, 2)) == 4
    assert decoded(result["matrices"]["Cgram"]) == decoded(
        scale(gt, denominator**2 / 14, context)
    )
    assert decoded(result["matrices"]["Gram"]) == decoded(
        scale(gt, -(denominator**2) / 7, context)
    )
    assert result["acceptance"]["gram_identity"] is False
    assert result["acceptance"]["uniform_bounds"] is False
    assert result["acceptance"]["accepted"] is False
    # An assignment Cgram=Hbar-lower would make this residual spuriously zero.
    with pytest.raises(ValueError):
        V.zero_check(decoded(result["matrices"]["Gram"]), (2, 2))


def test_wrong_action_coefficient_breaks_intrinsic_symmetrization_while_gram_remains_exact(
    context, energy_inputs
):
    components = dict(energy_inputs["components"])
    components["M1"] = scale(components["M1"], poly(2, context), context)
    result = construct({**energy_inputs, "components": components})
    tau = energy_inputs["r"] ** 3 * energy_inputs["g"] ** 6
    assert decoded(result["matrices"]["Hbar"]) == decoded(
        scale(matrix([[F(2, 3), 0], [0, F(19, 6)]], context), tau, context)
    )
    assert decoded(result["matrices"]["HL"]) == decoded(
        scale(matrix([[0, F(-3, 4)], [F(3, 4), 0]], context), tau, context)
    )
    assert V.zero_check(decoded(result["matrices"]["Hsym"]), (2, 2)) == 4
    assert V.zero_check(decoded(result["matrices"]["Gram"]), (2, 2)) == 4
    assert result["acceptance"]["intrinsic_symmetrization"] is False
    assert result["acceptance"]["accepted"] is False


def test_actual_offdiagonal_energy_mutation_retains_the_complete_failed_symmetry(
    context, energy_result
):
    result, _, _, _ = energy_result
    h = result["matrices"]["Hbar"]
    before = P.encode_matrix(h)
    names = []
    witness = E.mutation_witness(h, sink=lambda name, value: names.append(name))
    assert names == ["delta_Hbar", "mutant_Hsym"]
    assert P.encode_matrix(h) == before
    assert decoded(witness["delta_Hbar"]) == decoded(matrix([[0, 1], [0, 0]], context))
    assert decoded(witness["mutant_Hsym"]) == decoded(
        matrix([[0, 1], [-1, 0]], context)
    )
    assert witness["mutation"]["name"] == "add-one-to-Hbar-01"
    assert witness["mutation"]["entry"] == [0, 1]
    assert (
        witness["mutation"]["nonzero_slots"] == witness["mutation"]["coefficients"] == 2
    )
    assert witness["mutation"]["rejected"] is True


def test_complete_save_order_preserves_full_residual_slots_and_prior_values(
    energy_inputs, energy_result
):
    result, stored, references, before = energy_result
    assert [name for name, _ in stored] == list(STAGES)
    assert tuple(result["matrices"]) == STAGES
    for (name, record), reference in zip(stored, references, strict=True):
        assert (
            record
            == P.encode_matrix(reference)
            == P.encode_matrix(result["matrices"][name])
        )
        assert len(record["entries"]) == 4
        if name in ("Hsym", "HL", "HP", "Gram"):
            assert record["entries"] == [[0, 0, []], [0, 1, []], [1, 0, []], [1, 1, []]]
    after = {
        name: P.encode_matrix(value)
        for name, value in energy_inputs["components"].items()
    }
    after.update({name: P.encode_matrix(energy_inputs[name]) for name in ("X", "Pt")})
    assert before == after


def test_sink_failure_stops_without_retries_or_later_saved_stages(energy_inputs):
    names = []

    def sink(name, value):
        names.append(name)
        if name == "Cgram":
            raise RuntimeError("owned energy save stop")

    with pytest.raises(RuntimeError, match="owned energy save stop"):
        construct(energy_inputs, sink=sink)
    assert names == list(STAGES[:11])


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero-action",
        "nonzero-absent-action",
        "shape",
        "float-constant",
        "branch-order",
    ],
)
def test_energy_input_contract_refuses_missing_branches_or_source_constant_drift(
    context, energy_inputs, change
):
    inputs = {**energy_inputs, "components": dict(energy_inputs["components"])}
    if change == "missing-zero-action":
        del inputs["components"]["M6"]
    elif change == "nonzero-absent-action":
        inputs["components"]["M6"] = matrix([[1, 0], [0, 0]], context)
    elif change == "shape":
        inputs["components"]["N6"] = matrix([[0]], context)
    else:
        constants = list(CONSTANTS)
        if change == "float-constant":
            constants[0] = float(constants[0])
        else:
            constants[0], constants[1] = constants[1], constants[0]
        inputs["constants"] = tuple(constants)
    with pytest.raises(ValueError):
        construct(inputs)


@pytest.mark.parametrize("value", [0.0, True, F(0)])
def test_gram_refuses_inexact_or_nonpolynomial_entries(context, value):
    with pytest.raises(ValueError):
        E.gram_matrix(np.array([[value]], dtype=object), (poly(1, context),))


@pytest.mark.parametrize("change", ["missing-zero", "duplicate", "schema"])
def test_saved_energy_and_residuals_require_the_complete_polynomial_matrix_schema(
    context, change
):
    record = P.encode_matrix(matrix([[1, 0], [0, 0]], context))
    if change == "missing-zero":
        del record["entries"][1]
    elif change == "duplicate":
        record["entries"][-1] = copy.deepcopy(record["entries"][0])
    else:
        record["schema"] = "unregistered-energy"
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(2, 2), max_degree=0)


@pytest.mark.parametrize(
    "operation", ["gram", "energy", "bounds", "symmetry", "mutation"]
)
def test_guard_failure_propagates_without_retry_or_saved_output(
    context, energy_inputs, operation
):
    calls, names = [], []

    def stop():
        calls.append(1)
        raise RuntimeError("owned energy stop")

    with pytest.raises(RuntimeError, match="owned energy stop"):
        if operation == "gram":
            E.gram_matrix(matrix([[1]], context), (poly(1, context),), guard=stop)
        elif operation == "energy":
            construct(
                energy_inputs, guard=stop, sink=lambda name, value: names.append(name)
            )
        elif operation == "bounds":
            E.coefficient_bound(matrix([[1]], context), guard=stop)
        elif operation == "symmetry":
            E.symmetrizer_residuals(
                energy_inputs["Pt"], energy_inputs["X"], energy_inputs["Pt"], guard=stop
            )
        else:
            E.mutation_witness(
                energy_inputs["Pt"],
                guard=stop,
                sink=lambda name, value: names.append(name),
            )
    assert calls == [1] and names == []


def test_independent_product_retains_order_for_noncommuting_polynomial_matrices(
    context, replay_runner
):
    x, y, _ = context["field"].ring.gens
    a = matrix([[x, 1], [0, y]], context)
    b = matrix([[0, 2], [3, 0]], context)
    assert replay_runner.independent_product(decoded(a), decoded(b)) == decoded(
        matrix([[3, 2 * x], [3 * y, 0]], context)
    )
    assert replay_runner.independent_product(decoded(b), decoded(a)) == decoded(
        matrix([[0, 2 * y], [3 * x, 3]], context)
    )

"""Small exact controls for the one registered numerator compression batch.

No parent matrix is loaded or reconstructed here. Hand-calculated rectangular
examples and independent Fraction replay distinguish divisibility from a valid
division identity, including complete nonzero failure evidence.
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

import nr_case12_polynomial_compression as C  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

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
POWERS = {
    "NO": 5,
    "N0": 5,
    "N1": 5,
    "N2": 5,
    "N3": 5,
    "N4": 5,
    "N5": 5,
    "N6": 5,
    "M1": 4,
    "M2": 4,
    "M3": 4,
    "M4": 4,
    "M5": 4,
    "M6": 4,
}
KINDS = ("quotient", "remainder", "multiplyback")
ABSENT = ("N4", "N5", "N6", "M4", "M5", "M6")
STAGES = tuple(name + "_" + kind for name in COMPONENTS for kind in KINDS)


@pytest.fixture(scope="module")
def context():
    return C.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-polynomial-compression.py"
    spec = importlib.util.spec_from_file_location("owned_compression_control", path)
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
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=24)


def decoded_scalar(value):
    return V.decode_polynomial(P.canonical_polynomial(value), max_degree=24)


def replay_result(runner, original, factor, result, **kwargs):
    return runner.verify_division(
        decoded(original),
        decoded_scalar(factor),
        *(decoded(result[kind]) for kind in KINDS),
        **kwargs,
    )


@pytest.fixture(scope="module")
def family_inputs(context):
    x, y, z = context["field"].ring.gens
    r = poly(2 * x + y, context)
    expected, original = {}, {}
    for number, name in enumerate(COMPONENTS, 1):
        expected[name] = matrix(
            [[0, 0], [0, 0]] if name in ABSENT else [[number * x, 0], [number, z / 2]],
            context,
        )
        original[name] = matrix(
            [[value * r ** POWERS[name] for value in row] for row in expected[name]],
            context,
        )
    return original, r, expected


@pytest.fixture(scope="module")
def family_result(family_inputs):
    original, r, _ = family_inputs
    before = {name: P.encode_matrix(value) for name, value in original.items()}
    stored, references = [], []

    def sink(name, value):
        stored.append((name, P.encode_matrix(value)))
        references.append(value)

    result = C.compress_components(original, r, guard=lambda: None, sink=sink)
    return result, stored, references, before


@pytest.mark.parametrize("change", ["append", "normal-form", "multiplyback"])
def test_frozen_division_source_refuses_formula_or_byte_drift(change):
    raw = (ROOT / "scripts/nr_case12_polynomial_blocks.py").read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered compression source\n"
    else:
        old, new = {
            "normal-form": (b"powers[k] >= leading[k]", b"powers[k] > leading[k]"),
            "multiplyback": (
                b"multiply_back = value - divisor * quotient",
                b"multiply_back = value + divisor * quotient",
            ),
        }[change]
        assert old in raw
        altered = raw.replace(old, new, 1)
    with pytest.raises(ValueError):
        C.verify_source(altered)
    with pytest.raises(ValueError):
        C.translated_ast(altered)


def test_division_translation_preserves_both_frozen_helper_asts():
    raw = (ROOT / "scripts/nr_case12_polynomial_blocks.py").read_bytes()
    C.verify_source(raw)
    original = ast.Module(
        body=[
            node
            for node in ast.parse(raw.decode("utf-8")).body
            if isinstance(node, ast.FunctionDef)
            and node.name in ("_divide_scalar", "divide_matrix")
        ],
        type_ignores=[],
    )
    translated, audit = C.translated_ast(raw)
    assert [node.name for node in translated.body] == [
        "_divide_scalar",
        "divide_matrix",
    ]
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        original, include_attributes=False
    )
    assert audit["edits"] == []
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]


def test_fixed_family_registry_and_factor_powers_match_the_preregistered_candidate():
    assert C.COMPONENTS == COMPONENTS
    assert C.FACTOR_POWERS == POWERS
    assert C.OUTPUT_KINDS == KINDS
    assert C.MATRIX_ORDER == STAGES
    assert C.INPUT_CAPS == {
        name: 19 if name.startswith("N") else 16 for name in COMPONENTS
    }
    assert C.MATRIX_CAPS == {
        name + "_" + kind: (
            (9 if name.startswith("N") else 8)
            if kind == "quotient"
            else (19 if name.startswith("N") else 16)
        )
        for name in COMPONENTS
        for kind in KINDS
    }


@pytest.mark.parametrize(
    "change", ["N-power", "M-power", "component-order", "degree-cap"]
)
def test_mutated_factor_registration_is_refused(family_inputs, monkeypatch, change):
    original, r, _ = family_inputs
    if change == "component-order":
        monkeypatch.setattr(C, "COMPONENTS", tuple(reversed(COMPONENTS)))
    elif change == "degree-cap":
        caps = dict(C.INPUT_CAPS)
        caps["N1"] += 1
        monkeypatch.setattr(C, "INPUT_CAPS", caps)
    else:
        powers = dict(C.FACTOR_POWERS)
        powers["N1" if change == "N-power" else "M1"] -= 1
        monkeypatch.setattr(C, "FACTOR_POWERS", powers)
    with pytest.raises(ValueError):
        C.compress_components(original, r)


def test_mixed_rectangular_slots_preserve_exact_quotients_and_nonzero_remainders(
    context, replay_runner
):
    x, y, z = context["field"].ring.gens
    factor = poly((x + y) ** 2, context)
    original = matrix(
        [
            [factor * (2 * x - z), 3 * factor + z, 0],
            [factor * (x + y) + x * y * z, factor / 2, 1],
        ],
        context,
    )
    expected_q = matrix([[2 * x - z, 3, 0], [x + y, F(1, 2), 0]], context)
    expected_r = matrix([[0, z, 0], [x * y * z, 0, 1]], context)
    result = C.compress_matrix(original, factor)
    assert decoded(result["quotient"]) == decoded(expected_q)
    assert decoded(result["remainder"]) == decoded(expected_r)
    assert decoded(result["multiplyback"]) == decoded(expected_r)
    assert result["division_identity_zero"] is result["normal_form_verified"] is True
    assert (
        result["accepted"]
        is result["remainder_zero"]
        is result["multiplyback_zero"]
        is False
    )
    assert result["divisor_leading_exponent"] == [2, 0, 0]
    assert result["divisor_leading_coefficient"] == ["1", "1"]
    replay = replay_result(replay_runner, original, factor, result)
    assert all(result[key] == value for key, value in replay.items())


def test_nonmonic_factor_retains_rational_quotient_coefficients(context, replay_runner):
    x, y, z = context["field"].ring.gens
    factor = poly(2 * x + 2 * y, context)
    original = matrix([[x + y, 0], [factor * (z + 1), 0]], context)
    result = C.compress_matrix(original, factor)
    assert decoded(result["quotient"]) == decoded(
        matrix([[F(1, 2), 0], [z + 1, 0]], context)
    )
    assert result["accepted"] is True
    assert result["divisor_leading_coefficient"] == ["2", "1"]
    assert V.zero_check(decoded(result["remainder"]), (2, 2)) == 4
    assert replay_result(replay_runner, original, factor, result)["accepted"] is True


def test_lex_normal_form_uses_componentwise_divisibility_not_total_degree(context):
    x, y, _ = context["field"].ring.gens
    factor = poly(x + y, context)
    result = C.compress_matrix(matrix([[2 * factor + y**8]], context), factor)
    assert decoded(result["quotient"]) == [[{(0, 0, 0): F(2)}]]
    assert decoded(result["remainder"]) == [[{(0, 8, 0): F(1)}]]
    assert result["normal_form_verified"] is True and result["accepted"] is False
    with pytest.raises(ValueError):
        V.decode_matrix(
            P.encode_matrix(result["remainder"]), shape=(1, 1), max_degree=7
        )


def test_nonzero_axis_vanishing_remainder_is_not_a_divisibility_certificate(context):
    x, y, z = context["field"].ring.gens
    factor = poly(x * x + y * y + z * z, context)
    result = C.compress_matrix(matrix([[3 * factor + x * y * z]], context), factor)
    assert decoded(result["remainder"]) == [[{(1, 1, 1): F(1)}]]
    assert result["division_identity_zero"] is True and result["accepted"] is False
    with pytest.raises(ValueError):
        V.zero_check(decoded(result["multiplyback"]), (1, 1))


@pytest.mark.parametrize("factor_power,quotient_degree", [(5, 9), (4, 8)])
def test_quadratic_direction_factor_reduces_to_the_registered_quotient_degree(
    context, factor_power, quotient_degree
):
    x, y, z = context["field"].ring.gens
    r = x * x + 2 * y * y + 3 * z * z
    factor = r**factor_power
    original = matrix([[factor * y**quotient_degree]], context)
    result = C.compress_matrix(original, factor)
    assert result["accepted"] is True
    record = P.encode_matrix(result["quotient"])
    expected = [[{(0, quotient_degree, 0): F(1)}]]
    assert V.decode_matrix(record, shape=(1, 1), max_degree=quotient_degree) == expected
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(1, 1), max_degree=quotient_degree - 1)


def test_all_fixed_components_divide_by_their_prescribed_nonunit_power(
    family_inputs, family_result
):
    _, _, expected = family_inputs
    result, _, _, _ = family_result
    assert result["acceptance"] == {
        "division_identity": True,
        "remainder_zero": True,
        "multiplyback_zero": True,
        "remainder_normal_form": True,
        "accepted": True,
    }
    metadata = result["division_metadata"]
    assert metadata["schema"] == "nr-case12-compression-divisions-v1"
    assert metadata["monomial_order"] == "lex"
    assert [row["name"] for row in metadata["rows"]] == list(COMPONENTS)
    for row in metadata["rows"]:
        name = row["name"]
        assert row["factor_power"] == POWERS[name]
        assert row["divisor_leading_exponent"] == [POWERS[name], 0, 0]
        assert row["divisor_leading_coefficient"] == [str(2 ** POWERS[name]), "1"]
        assert row["accepted"] is True
        assert decoded(result["matrices"][name + "_quotient"]) == decoded(
            expected[name]
        )


@pytest.mark.parametrize("name", ["NO", "M1"])
def test_smaller_factor_candidate_is_rejected_without_searching_alternatives(
    context, family_inputs, name
):
    original, r, _ = family_inputs
    candidate = dict(original)
    candidate[name] = matrix([[r ** (POWERS[name] - 1), 0], [0, 0]], context)
    result = C.compress_components(candidate, r)
    row = next(
        row for row in result["division_metadata"]["rows"] if row["name"] == name
    )
    assert row["factor_power"] == POWERS[name]
    assert row["division_identity_zero"] is row["normal_form_verified"] is True
    assert row["accepted"] is False
    assert decoded(result["matrices"][name + "_remainder"]) == decoded(candidate[name])
    assert result["acceptance"]["accepted"] is False
    assert tuple(result["matrices"]) == STAGES


@pytest.mark.parametrize("name", ["N4", "N5", "N6", "M4", "M5", "M6"])
def test_absent_branches_preserve_all_zero_slots_in_all_three_outputs(
    family_result, name
):
    result, _, _, _ = family_result
    for kind in KINDS:
        record = P.encode_matrix(result["matrices"][name + "_" + kind])
        assert record["shape"] == [2, 2]
        assert record["entries"] == [[0, 0, []], [0, 1, []], [1, 0, []], [1, 1, []]]


def test_sink_retains_every_stage_and_leaves_saved_history_and_inputs_unchanged(
    family_inputs, family_result
):
    original, _, _ = family_inputs
    result, stored, references, before = family_result
    assert [name for name, _ in stored] == list(STAGES)
    for (name, record), reference in zip(stored, references, strict=True):
        assert (
            record
            == P.encode_matrix(reference)
            == P.encode_matrix(result["matrices"][name])
        )
    assert before == {name: P.encode_matrix(value) for name, value in original.items()}


def test_sink_failure_propagates_after_exactly_the_last_saved_stage(family_inputs):
    original, r, _ = family_inputs
    names = []

    def sink(name, value):
        names.append(name)
        if name == "N1_remainder":
            raise RuntimeError("owned compression save stop")

    with pytest.raises(RuntimeError, match="owned compression save stop"):
        C.compress_components(original, r, sink=sink)
    assert names == list(STAGES[:8])


def test_real_N1_unit_perturbation_preserves_nondivisible_evidence_without_input_mutation(
    family_inputs, replay_runner
):
    original, r, _ = family_inputs
    before = P.encode_matrix(original["N1"])
    stored = []
    result = C.mutation_witness(
        original["N1"], r, sink=lambda name, value: stored.append(name)
    )
    assert stored == ["mutation_N1_" + kind for kind in KINDS]
    assert P.encode_matrix(original["N1"]) == before
    metadata = result["mutation"]
    assert metadata["name"] == "add-one-to-N1-00" and metadata["entry"] == [0, 0]
    assert (
        metadata["rejected"]
        is metadata["division_identity_zero"]
        is metadata["normal_form_verified"]
        is True
    )
    assert (
        metadata["remainder_nonzero_slots"]
        == metadata["multiplyback_nonzero_slots"]
        == 1
    )
    assert (
        metadata["remainder_coefficients"] == metadata["multiplyback_coefficients"] == 1
    )
    expected = [[{(0, 0, 0): F(1)}, {}], [{}, {}]]
    assert decoded(result["mutation_N1_remainder"]) == expected
    assert decoded(result["mutation_N1_multiplyback"]) == expected
    mutated = decoded(original["N1"])
    V.add_product(mutated[0][0], {(0, 0, 0): F(1)}, {(0, 0, 0): F(1)})
    replay = replay_runner.verify_division(
        mutated,
        decoded_scalar(r**5),
        *(decoded(result["mutation_N1_" + kind]) for kind in KINDS),
    )
    assert replay["division_identity_zero"] is True and replay["accepted"] is False


@pytest.mark.parametrize("change", ["missing", "extra", "shape"])
def test_component_input_drift_is_refused_before_any_save(
    context, family_inputs, change
):
    original, r, _ = family_inputs
    changed, saved = dict(original), []
    if change == "missing":
        del changed["M6"]
    elif change == "extra":
        changed["N7"] = original["N6"]
    else:
        changed["M6"] = matrix([[0]], context)
    with pytest.raises(ValueError):
        C.compress_components(changed, r, sink=lambda name, value: saved.append(name))
    assert saved == []


@pytest.mark.parametrize("value", [0.0, True, F(0), None])
def test_inexact_or_nonpolynomial_matrix_entries_are_refused(context, value):
    with pytest.raises(ValueError):
        C.compress_matrix(np.array([[value]], dtype=object), poly(1, context))


@pytest.mark.parametrize("value", [0.5, True, F(1), None])
def test_nonpolynomial_factors_are_refused(context, value):
    with pytest.raises(ValueError):
        C.compress_matrix(matrix([[1]], context), value)


@pytest.mark.parametrize("change", ["zero", "foreign", "nonlex"])
def test_zero_or_unregistered_factor_ring_is_refused(context, change):
    if change == "zero":
        factor = poly(0, context)
    elif change == "foreign":
        _, factor, _, _ = ring("u,v,w", QQ)
    else:
        _, factor, _, _ = ring("x,y,z", QQ, order="grlex")
    with pytest.raises(ValueError):
        C.compress_matrix(matrix([[1]], context), factor)


@pytest.mark.parametrize("shape", [(0, 1), (1, 0), (44, 1), (1, 44), (1,)])
def test_empty_or_out_of_bounds_matrix_shapes_are_refused(context, shape):
    value = np.empty(shape, dtype=object)
    value.fill(poly(0, context))
    with pytest.raises(ValueError):
        C.compress_matrix(value, poly(1, context))


@pytest.mark.parametrize("operation", ["matrix", "family", "mutation"])
def test_guard_failure_propagates_without_retry_or_sink_emission(
    context, family_inputs, operation
):
    original, r, _ = family_inputs
    calls, saved = [], []

    def stop():
        calls.append(1)
        raise RuntimeError("owned compression stop")

    with pytest.raises(RuntimeError, match="owned compression stop"):
        if operation == "matrix":
            C.compress_matrix(matrix([[1]], context), poly(1, context), guard=stop)
        elif operation == "family":
            C.compress_components(
                original, r, guard=stop, sink=lambda name, value: saved.append(name)
            )
        else:
            C.mutation_witness(
                original["N1"],
                r,
                guard=stop,
                sink=lambda name, value: saved.append(name),
            )
    assert calls == [1] and saved == []


@pytest.mark.parametrize("change", ["missing-zero", "duplicate", "shape", "schema"])
def test_saved_output_requires_every_registered_matrix_slot(context, change):
    record = P.encode_matrix(matrix([[1, 0], [0, 0]], context))
    if change == "missing-zero":
        del record["entries"][1]
    elif change == "duplicate":
        record["entries"][-1] = copy.deepcopy(record["entries"][0])
    elif change == "shape":
        record["shape"] = [1, 4]
    else:
        record["schema"] = "unregistered-compression-matrix"
    with pytest.raises(ValueError):
        V.decode_matrix(record, shape=(2, 2), max_degree=0)


def test_independent_fraction_long_division_matches_hand_calculated_lex_remainder(
    replay_runner,
):
    # (x^2*y + 2*x*z + 1) / (x*y + z) = x + (x*z + 1)/(x*y+z).
    value = {(2, 1, 0): F(1), (1, 0, 1): F(2), (0, 0, 0): F(1)}
    divisor = {(1, 1, 0): F(1), (0, 0, 1): F(1)}
    before = (dict(value), dict(divisor))
    quotient, remainder = replay_runner.poly_divide(value, divisor)
    assert quotient == {(1, 0, 0): F(1)}
    assert remainder == {(1, 0, 1): F(1), (0, 0, 0): F(1)}
    assert (value, divisor) == before


@pytest.mark.parametrize(
    "change",
    [
        "quotient",
        "remainder",
        "multiplyback",
        "non-normal",
        "shape",
        "float-q",
        "float-r",
        "float-back",
    ],
)
def test_independent_replay_refuses_corrupted_or_inexact_division_evidence(
    replay_runner, change
):
    factor = {(1, 0, 0): F(1), (0, 1, 0): F(1)}
    original = [[{(1, 0, 0): F(2), (0, 1, 0): F(2), (0, 0, 0): F(1)}]]
    saved = {
        "quotient": [[{(0, 0, 0): F(2)}]],
        "remainder": [[{(0, 0, 0): F(1)}]],
        "multiplyback": [[{(0, 0, 0): F(1)}]],
    }
    baseline = replay_runner.verify_division(
        original, factor, *(saved[kind] for kind in KINDS)
    )
    assert (
        baseline["division_identity_zero"] is baseline["normal_form_verified"] is True
    )
    assert baseline["accepted"] is False
    if change in KINDS:
        saved[change][0][0][(0, 0, 0)] += F(1)
    elif change == "non-normal":
        # Identity alone still holds: q=1, r=x+y+1. It is not the lex remainder.
        saved["quotient"] = [[{(0, 0, 0): F(1)}]]
        saved["remainder"] = [[{**factor, (0, 0, 0): F(1)}]]
        saved["multiplyback"] = copy.deepcopy(saved["remainder"])
    elif change == "shape":
        saved["quotient"][0].append({})
    else:
        key = {
            "float-q": "quotient",
            "float-r": "remainder",
            "float-back": "multiplyback",
        }[change]
        saved[key][0][0][(0, 0, 0)] = float(saved[key][0][0][(0, 0, 0)])
    with pytest.raises(ValueError):
        replay_runner.verify_division(
            original, factor, *(saved[kind] for kind in KINDS)
        )


@pytest.mark.parametrize(
    "change",
    ["zero-divisor", "float-coefficient", "negative-exponent", "zero-coefficient"],
)
def test_independent_long_division_rejects_noncanonical_input(replay_runner, change):
    value, divisor = {(1, 0, 0): F(1)}, {(0, 0, 0): F(1)}
    if change == "zero-divisor":
        divisor = {}
    elif change == "float-coefficient":
        value = {(1, 0, 0): 1.0}
    elif change == "negative-exponent":
        value = {(-1, 0, 0): F(1)}
    else:
        value = {(1, 0, 0): F(0)}
    with pytest.raises(ValueError):
        replay_runner.poly_divide(value, divisor)


def test_independent_long_division_propagates_guard_failure_inside_work(replay_runner):
    calls = []

    def stop():
        calls.append(1)
        if len(calls) == 2:
            raise RuntimeError("owned replay division stop")

    with pytest.raises(RuntimeError, match="owned replay division stop"):
        replay_runner.poly_divide({(8, 0, 0): F(1)}, {(1, 0, 0): F(1)}, guard=stop)
    assert calls == [1, 1]


@pytest.mark.parametrize(
    "change",
    [
        "passed",
        "completed",
        "projector",
        "action",
        "scope",
        "source-after",
        "input-digest",
        "dependency-digest",
    ],
)
def test_parent_status_refuses_incomplete_or_drifted_synthetic_records(change):
    # Synthetic status contract control only; this does not qualify any parent.
    base = dict(
        schema="nr-case12-polynomial-projectors-controls-v1",
        passed=True,
        completed=True,
        projector_family_validated=True,
        action_family_validated=True,
        errors=[],
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
    gate, worker = copy.deepcopy(base), copy.deepcopy(base)
    gate["artifact_hashes"] = {
        **C.PARENT_INPUT_HASHES,
        "worker-result.json": C.PARENT_WORKER_SHA,
    }
    worker["source_before"] = dict(C.DEPENDENCIES)
    worker["source_after"] = dict(C.DEPENDENCIES)
    C.validate_parent_status(gate, worker)
    if change in ("passed", "completed"):
        gate[change] = False
    elif change in ("projector", "action"):
        worker[change + "_family_validated"] = False
    elif change == "scope":
        worker["physical_gate"] = True
    elif change == "source-after":
        worker["source_after"][C.SOURCE] = "0" * 64
    elif change == "input-digest":
        gate["artifact_hashes"]["N1.json"] = "0" * 64
    else:
        worker["source_before"][C.SOURCE] = "0" * 64
        worker["source_after"][C.SOURCE] = "0" * 64
    with pytest.raises(ValueError):
        C.validate_parent_status(gate, worker)

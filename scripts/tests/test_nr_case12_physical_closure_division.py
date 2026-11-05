"""Owned small controls for fixed-divisor physical closure reduction.

Hand-calculated one- and two-row examples exercise division, homogeneity and
direct closure separately. No scientific parent matrix is rebuilt here.
"""

import ast
import copy
from fractions import Fraction as F
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned supervisor required before closure-division arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_physical_closure_division as E  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-physical-closure-division.py"
    spec = importlib.util.spec_from_file_location(
        "owned_physical_division_control", path
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def matrix(context, rows):
    return np.array(
        [[context["ring"](value) for value in row] for row in rows], dtype=object
    )


def record(value):
    return P.encode_matrix(value)


def decoded(value):
    return V.decode_matrix(record(value), shape=value.shape, max_degree=32)


def scalar(value):
    return V.decode_polynomial(P.canonical_polynomial(value), max_degree=32)


def assert_matrix(actual, expected):
    assert record(actual) == record(expected)


def assert_zero(value):
    assert all(not poly for row in value for poly in row)


def inputs(context):
    x, y, _ = context["ring"].gens
    divisor = (x + y) ** 2
    original = {
        0: matrix(context, [[5 * divisor]]),
        1: matrix(context, [[3 * x * divisor]]),
        2: matrix(context, [[0]]),
    }
    physical = {
        0: matrix(context, [[1, 0]]),
        1: matrix(context, [[0, 0]]),
        2: matrix(context, [[0, 0]]),
    }
    generator = {
        0: matrix(context, [[5, 0], [0, 7]]),
        1: matrix(context, [[3 * x, 0], [0, 11 * x]]),
    }
    return original, physical, generator, divisor


def replay_arguments(arguments):
    original, physical, generator, divisor = arguments
    return (
        {j: decoded(a) for j, a in original.items()},
        {j: decoded(c) for j, c in physical.items()},
        {j: decoded(value) for j, value in generator.items()},
        scalar(divisor),
    )


def run_small(arguments, **kwargs):
    return E.division_from_matrices(*arguments, **kwargs)


def assert_replay(arguments, result, replay_runner):
    replay = replay_runner.independent_division(*replay_arguments(arguments))
    assert replay["matrices"] == {
        key: decoded(value) for key, value in result["matrices"].items()
    }
    for key in ("division_metadata", "acceptance", "mutation"):
        assert replay_runner.canonical_equal(replay[key], result[key])


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("owned closure-division interruption")


def test_physical_division_nonunit_factor_and_actual_constant_mutation(
    context, replay_runner
):
    arguments = inputs(context)
    original, _, _, divisor = arguments
    x, _, _ = context["ring"].gens
    result = run_small(arguments)
    saved = result["matrices"]
    for j, quotient in enumerate((5, 3 * x, 0)):
        assert_matrix(saved["Q" + str(j)], matrix(context, [[quotient]]))
        assert_zero(saved["R" + str(j)])
        assert_zero(saved["M" + str(j)])
    assert_matrix(saved["bad_A"], matrix(context, [[original[0][0, 0] + 1]]))
    assert_matrix(saved["bad_Q"], matrix(context, [[5]]))
    assert_matrix(saved["bad_R"], matrix(context, [[1]]))
    assert_matrix(saved["bad_M"], matrix(context, [[1]]))
    assert divisor != context["ring"].one
    for j in range(5):
        assert_zero(saved["direct_closure__p_" + str(j)])
    assert result["acceptance"]["accepted"] is True
    assert all(value is True for value in result["acceptance"].values())
    metadata = result["division_metadata"]
    assert metadata["schema"] == "nr-case12-physical-closure-divisions-v1"
    assert metadata["monomial_order"] == "lex"
    assert metadata["divisor"] == "delta_squared"
    for j, row in enumerate(metadata["rows"]):
        assert row["power"] == j
        assert row["divisor_leading_exponent"] == [2, 0, 0]
        assert row["divisor_leading_coefficient"] == ["1", "1"]
        assert row["homogeneity"] == {
            "expected_degree": j,
            "nonzero_slots": 0 if j == 2 else 1,
            "monomials": 0 if j == 2 else 1,
            "degree_histogram": [] if j == 2 else [[j, 1]],
            "inhomogeneous_slots": 0,
            "homogeneous": True,
        }
    assert result["mutation"] == {
        "schema": "nr-case12-physical-closure-division-mutation-v1",
        "name": "add-one-to-Bbar0-00",
        "entry": [0, 0],
        "division_identity_zero": True,
        "normal_form_verified": True,
        "remainder_nonzero_slots": 1,
        "multiplyback_nonzero_slots": 1,
        "remainder_coefficients": 1,
        "multiplyback_coefficients": 1,
        "rejected": True,
    }
    assert_replay(arguments, result, replay_runner)


def test_physical_division_noncommuting_coordinates_and_nonmonic_rational_factor(
    context, replay_runner
):
    x, y, z = context["ring"].gens
    divisor = 2 * (x + y) ** 2
    expected = {
        0: matrix(context, [[2, 1], [0, 3]]),
        1: matrix(context, [[x, y - x], [0, y]]),
        2: matrix(context, [[0, 0], [0, 0]]),
    }
    original = {
        j: matrix(context, [[divisor * poly for poly in row] for row in value])
        for j, value in expected.items()
    }
    physical = {j: matrix(context, [[0, 0, 0], [0, 0, 0]]) for j in range(3)}
    physical[0] = matrix(context, [[1, 1, 0], [0, 1, 0]])
    generator = {
        0: matrix(context, [[2, 0, 0], [0, 3, 0], [0, 0, 7]]),
        1: matrix(context, [[x, 0, 0], [0, y, 0], [0, 0, z]]),
    }
    arguments = original, physical, generator, divisor
    result = run_small(arguments)
    for j in range(3):
        assert_matrix(result["matrices"]["Q" + str(j)], expected[j])
    for j in range(5):
        assert_zero(result["matrices"]["direct_closure__p_" + str(j)])
    assert result["acceptance"]["accepted"] is True
    assert_replay(arguments, result, replay_runner)


def test_physical_division_nondivisible_numerator_preserves_remainder_and_quotient(
    context, replay_runner
):
    original, physical, generator, divisor = inputs(context)
    _, _, z = context["ring"].gens
    original[0][0, 0] += z
    arguments = original, physical, generator, divisor
    result = run_small(arguments)
    saved = result["matrices"]
    assert_matrix(saved["Q0"], matrix(context, [[5]]))
    assert_matrix(saved["R0"], matrix(context, [[z]]))
    assert_matrix(saved["M0"], matrix(context, [[z]]))
    assert_matrix(saved["bad_R"], matrix(context, [[z + 1]]))
    assert_matrix(saved["bad_M"], matrix(context, [[z + 1]]))
    assert result["acceptance"]["accepted"] is False
    assert result["acceptance"]["direct_closure"] is True
    assert result["acceptance"]["remainder_zero"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_division_mixed_slots_use_monomial_divisibility_not_total_degree(
    context, replay_runner
):
    x, y, z = context["ring"].gens
    divisor = (x + y) ** 2
    original = {j: matrix(context, [[0, 0], [0, 0]]) for j in range(3)}
    original[0] = matrix(
        context, [[5 * divisor + x * y * z, divisor / 2], [0, divisor + 1]]
    )
    physical = {j: matrix(context, [[0, 0], [0, 0]]) for j in range(3)}
    generator = {j: matrix(context, [[0, 0], [0, 0]]) for j in range(2)}
    arguments = original, physical, generator, divisor
    result = run_small(arguments)
    assert_matrix(result["matrices"]["Q0"], matrix(context, [[5, F(1, 2)], [0, 1]]))
    expected = matrix(context, [[x * y * z, 0], [0, 1]])
    assert_matrix(result["matrices"]["R0"], expected)
    assert_matrix(result["matrices"]["M0"], expected)
    assert_matrix(
        result["matrices"]["bad_R"], matrix(context, [[x * y * z + 1, 0], [0, 1]])
    )
    assert result["division_metadata"]["rows"][0]["normal_form_verified"] is True
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


@pytest.mark.parametrize("power", [0, 1, 2])
def test_physical_division_wrong_homogeneous_quotient_is_saved_before_rejection(
    context, replay_runner, power
):
    original, physical, generator, divisor = inputs(context)
    x, _, _ = context["ring"].gens
    wrong = x ** (power + 1)
    original[power] = matrix(context, [[divisor * wrong]])
    arguments = original, physical, generator, divisor
    observed = {}
    result = run_small(
        arguments, sink=lambda name, value: observed.__setitem__(name, record(value))
    )
    assert_matrix(result["matrices"]["Q" + str(power)], matrix(context, [[wrong]]))
    assert len(observed) == 18
    assert observed["Q" + str(power)] == record(matrix(context, [[wrong]]))
    for j in range(3):
        assert_zero(result["matrices"]["R" + str(j)])
        assert_zero(result["matrices"]["M" + str(j)])
    assert result["acceptance"]["accepted"] is False
    assert result["acceptance"]["quotient_homogeneity"] is False
    assert result["division_metadata"]["rows"][power]["homogeneity"] == {
        "expected_degree": power,
        "nonzero_slots": 1,
        "monomials": 1,
        "degree_histogram": [[power + 1, 1]],
        "inhomogeneous_slots": 1,
        "homogeneous": False,
    }
    assert_replay(arguments, result, replay_runner)


def test_physical_division_highest_direct_frequency_coefficient_is_not_truncated(
    context, replay_runner
):
    x, y, _ = context["ring"].gens
    divisor = (x + y) ** 2
    original = {j: matrix(context, [[0]]) for j in range(3)}
    original[2] = matrix(context, [[divisor * x**2]])
    physical = {
        0: matrix(context, [[0]]),
        1: matrix(context, [[0]]),
        2: matrix(context, [[y**2]]),
    }
    generator = {j: matrix(context, [[0]]) for j in range(2)}
    arguments = original, physical, generator, divisor
    result = run_small(arguments)
    assert_matrix(
        result["matrices"]["direct_closure__p_4"], matrix(context, [[x**2 * y**2]])
    )
    for j in range(4):
        assert_zero(result["matrices"]["direct_closure__p_" + str(j)])
    assert result["acceptance"]["accepted"] is False
    assert result["acceptance"]["quotient_homogeneity"] is True
    assert result["acceptance"]["direct_closure"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_division_input_arrays_and_saved_stages_are_unchanged(context):
    arguments = inputs(context)
    before = [{j: record(a) for j, a in series.items()} for series in arguments[:3]]
    order, snapshots = [], {}

    def sink(name, value):
        order.append(name)
        snapshots[name] = record(value)

    result = run_small(arguments, sink=sink)
    expected = (
        [kind + str(j) for j in range(3) for kind in ("Q", "R", "M")]
        + ["bad_A", "bad_Q", "bad_R", "bad_M"]
        + ["direct_closure__p_" + str(j) for j in range(5)]
    )
    assert order == expected and len(order) == 18
    assert snapshots == {
        name: record(value) for name, value in result["matrices"].items()
    }
    assert before == [
        {j: record(a) for j, a in series.items()} for series in arguments[:3]
    ]


@pytest.mark.parametrize(
    "change",
    [
        "non-normal-remainder",
        "wrong-multiplyback",
        "wrong-quotient",
        "noncanonical-coefficient",
    ],
)
def test_physical_division_independent_division_refuses_incorrect_saved_evidence(
    context, replay_runner, change
):
    x, y, _ = context["ring"].gens
    divisor = x + y
    original = decoded(matrix(context, [[divisor]]))
    quotient = decoded(matrix(context, [[1]]))
    remainder = decoded(matrix(context, [[0]]))
    multiplyback = decoded(matrix(context, [[0]]))
    if change == "non-normal-remainder":
        quotient = decoded(matrix(context, [[0]]))
        remainder = decoded(matrix(context, [[divisor]]))
        multiplyback = copy.deepcopy(remainder)
    elif change == "wrong-multiplyback":
        multiplyback = decoded(matrix(context, [[1]]))
    elif change == "wrong-quotient":
        quotient = decoded(matrix(context, [[2]]))
    else:
        quotient[0][0][(0, 0, 0)] = 1.0
    with pytest.raises(ValueError):
        replay_runner.compression_helper().verify_division(
            original, scalar(divisor), quotient, remainder, multiplyback
        )


@pytest.mark.parametrize("implementation", ["producer", "replay"])
@pytest.mark.parametrize("callback", ["guard", "check"])
def test_physical_division_deadline_interruption_propagates(
    context, replay_runner, implementation, callback
):
    with pytest.raises(StopControl, match="owned closure-division interruption"):
        if implementation == "producer":
            run_small(inputs(context), **{callback: stop})
        else:
            replay_runner.independent_division(
                *replay_arguments(inputs(context)), **{callback: stop}
            )


@pytest.mark.parametrize("implementation", ["producer", "replay"])
def test_physical_division_first_sink_exception_stops_further_output(
    context, replay_runner, implementation
):
    observed = []

    def sink(name, value):
        observed.append(name)
        stop()

    with pytest.raises(StopControl, match="owned closure-division interruption"):
        if implementation == "producer":
            run_small(inputs(context), sink=sink)
        else:
            replay_runner.independent_division(
                *replay_arguments(inputs(context)), sink=sink
            )
    assert observed == ["Q0"]


@pytest.mark.parametrize(
    "change",
    [
        "missing-A2",
        "missing-C2",
        "missing-L1",
        "bool-power",
        "wrong-A-shape",
        "wrong-L-shape",
        "zero-divisor",
        "float-divisor",
        "fraction-divisor",
        "float-cell",
    ],
)
def test_physical_division_exact_dimensions_support_and_ring_inputs_are_required(
    context, change
):
    original, physical, generator, divisor = inputs(context)
    if change == "missing-A2":
        del original[2]
    elif change == "missing-C2":
        del physical[2]
    elif change == "missing-L1":
        del generator[1]
    elif change == "bool-power":
        original[False] = original.pop(0)
    elif change == "wrong-A-shape":
        original[2] = matrix(context, [[0, 0]])
    elif change == "wrong-L-shape":
        generator[1] = matrix(context, [[0]])
    elif change == "zero-divisor":
        divisor = context["ring"].zero
    elif change == "float-divisor":
        divisor = 1.0
    elif change == "fraction-divisor":
        divisor = F(1)
    else:
        physical[2][0, 0] = 0.0
    with pytest.raises(ValueError):
        run_small((original, physical, generator, divisor))


def test_physical_division_homogeneity_records_every_monomial_and_zero_slot(
    context, replay_runner
):
    x, y, z = context["ring"].gens
    value = matrix(context, [[x + y, 1], [x * y * z, 0]])
    expected = {
        "expected_degree": 1,
        "nonzero_slots": 3,
        "monomials": 4,
        "degree_histogram": [[0, 1], [1, 2], [3, 1]],
        "inhomogeneous_slots": 2,
        "homogeneous": False,
    }
    assert E.homogeneity_metadata(value, 1) == expected
    assert replay_runner.homogeneity(decoded(value), 1) == expected
    zero = matrix(context, [[0, 0, 0], [0, 0, 0]])
    assert E.homogeneity_metadata(zero, 2) == {
        "expected_degree": 2,
        "nonzero_slots": 0,
        "monomials": 0,
        "degree_histogram": [],
        "inhomogeneous_slots": 0,
        "homogeneous": True,
    }


@pytest.mark.parametrize("degree", [True, 1.0, -1])
def test_physical_division_homogeneity_degree_has_strict_integer_type(context, degree):
    with pytest.raises(ValueError):
        E.homogeneity_metadata(matrix(context, [[0]]), degree)


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero-slot",
        "duplicate-slot",
        "boolean-coordinate",
        "float-exponent",
        "unreduced-rational",
        "wrong-quotient",
        "over-cap",
    ],
)
def test_physical_division_saved_matrix_requires_canonical_complete_slots(
    context, replay_runner, change
):
    x, _, _ = context["ring"].gens
    original = matrix(context, [[x, 0], [0, 1]])
    expected = decoded(original)
    saved = record(original)
    assert len(saved["entries"]) == 4
    replay_runner.check_matrix(saved, expected, (2, 2), 6)
    changed = copy.deepcopy(saved)
    if change == "missing-zero-slot":
        changed["entries"].pop(1)
    elif change == "duplicate-slot":
        changed["entries"][1] = copy.deepcopy(changed["entries"][0])
    elif change == "boolean-coordinate":
        changed["entries"][1][0] = False
    elif change == "float-exponent":
        changed["entries"][0][2][0][0] = 1.0
    elif change == "unreduced-rational":
        changed["entries"][0][2][0][3:] = ["2", "2"]
    elif change == "wrong-quotient":
        changed["entries"][0][2][0][3] = "2"
    else:
        changed["entries"][0][2][0][0] = 7
    with pytest.raises(ValueError):
        replay_runner.check_matrix(changed, expected, (2, 2), 6)


@pytest.mark.parametrize(
    "change",
    ["boolean-degree", "float-count", "missing-zero-histogram", "false-acceptance"],
)
def test_physical_division_metadata_type_aliases_cannot_equal_independent_evidence(
    context, replay_runner, change
):
    arguments = inputs(context)
    result = run_small(arguments)
    expected = replay_runner.independent_division(*replay_arguments(arguments))[
        "division_metadata"
    ]
    assert replay_runner.canonical_equal(result["division_metadata"], expected)
    changed = copy.deepcopy(result["division_metadata"])
    row = changed["rows"][0]
    if change == "boolean-degree":
        row["homogeneity"]["expected_degree"] = False
    elif change == "float-count":
        row["homogeneity"]["monomials"] = 1.0
    elif change == "missing-zero-histogram":
        del changed["rows"][2]["homogeneity"]["degree_histogram"]
    else:
        row["accepted"] = False
    assert not replay_runner.canonical_equal(changed, expected)


def test_physical_division_source_bridge_binds_unchanged_division_and_generator_asts(
    monkeypatch,
):
    monkeypatch.setattr(E, "_modules", stop)
    bridge = E.source_bridge_manifest()
    assert bridge["divisor"] == "delta_squared"
    assert bridge["monomial_order"] == "lex"
    assert bridge["quotient_save_degree_cap"] == 6
    assert bridge["homogeneity_degrees"] == [0, 1, 2]
    assert bridge["generator"] == "J+zeta*K"
    assert bridge["principal_shift_retained"] is True
    assert (
        bridge["geometric"]
        is bridge["factor_search"]
        is bridge["original_matrices_rebuilt"]
        is False
    )
    expected = {
        "scripts/nr_case12_polynomial_compression.py": {"compress_matrix"},
        "scripts/nr_case12_polynomial_blocks.py": {"_divide_scalar"},
        "scripts/nr_case12_physical_closure.py": {"closure_from_matrices"},
        "scripts/nr_constraint_full_symbol.py": {"source", "physical_coefficients"},
        "scripts/nr_profile_exact_coefficients.py": {"principal_rates", "matrix"},
    }
    assert set(bridge["bindings"]) == set(expected)
    for path, names in expected.items():
        raw = (ROOT / path).read_bytes()
        E.verify_source(raw, path)
        tree = ast.parse(raw.decode("utf-8"))
        nodes = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in names
        ]
        binding = bridge["bindings"][path]
        assert set(binding["functions"]) == names
        assert binding["edits"] == []
        assert (
            binding["ast_sha256"]
            == hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest()
        )


@pytest.mark.parametrize(
    "change", ["comment", "division-formula", "unknown-source", "mutable-bytes"]
)
def test_physical_division_source_byte_and_formula_drift_are_rejected(change):
    path = "scripts/nr_case12_polynomial_blocks.py"
    raw = (ROOT / path).read_bytes()
    if change == "comment":
        raw += b"\n# unregistered division source\n"
    elif change == "division-formula":
        old = b"multiply_back = value - divisor * quotient"
        assert old in raw
        raw = raw.replace(old, b"multiply_back = value + divisor * quotient", 1)
    elif change == "unknown-source":
        path = "scripts/unregistered-division.py"
    else:
        raw = bytearray(raw)
    with pytest.raises(ValueError):
        E.verify_source(raw, path)


@pytest.mark.parametrize(
    "change",
    [
        "premature-quotient-cap",
        "drop-direct-highest",
        "drop-bad-input",
        "bool-frequency",
    ],
)
def test_physical_division_complete_failure_evidence_registration_is_fixed(
    monkeypatch, change
):
    assert (
        E.MATRIX_SPECS["Q0"]
        == E.MATRIX_SPECS["Q1"]
        == E.MATRIX_SPECS["Q2"]
        == (43, 43, 6)
    )
    assert E.MATRIX_SPECS["direct_closure__p_4"] == (43, 58, 8)
    if change == "bool-frequency":
        monkeypatch.setattr(E, "POWERS", (False, 1, 2))
    else:
        specs = dict(E.MATRIX_SPECS)
        if change == "premature-quotient-cap":
            specs["Q0"] = (43, 43, 0)
        elif change == "drop-direct-highest":
            del specs["direct_closure__p_4"]
        else:
            del specs["bad_A"]
        monkeypatch.setattr(E, "MATRIX_SPECS", specs)
    with pytest.raises(ValueError):
        E.source_bridge_manifest()


@pytest.fixture(scope="module")
def parent_inputs():
    return {
        name: (
            ROOT / "tmp/nr-shadow-evidence" / spec["directory"] / spec["path"]
        ).read_bytes()
        for name, spec in E.PARENT_FILES.items()
    }


def test_physical_division_parent_bytes_bind_fixed_factor_and_shift_without_external_reads(
    parent_inputs, monkeypatch
):
    assert len(parent_inputs) == 16
    assert (
        E.PARENT_FILES["closure_scalars.json"]["sha256"]
        == "316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5"
    )
    assert (
        E.PARENT_FILES["K.json"]["sha256"]
        == "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283"
    )
    assert (
        E.PARENT_FILES["J.json"]["sha256"]
        == "19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b"
    )

    def forbid_read(*args, **kwargs):
        raise AssertionError("parent byte manifest attempted an external read")

    monkeypatch.setattr(Path, "read_bytes", forbid_read)
    parent = E.parent_provenance_manifest(parent_inputs)
    assert parent["input_hashes"] == {
        name: hashlib.sha256(raw).hexdigest() for name, raw in parent_inputs.items()
    }
    assert (
        parent["inherited_physical_closure_verified"]
        is parent["original_shift_principal_retained"]
        is True
    )
    assert (
        parent["external_parent_reads"]
        is parent["parent_matrices_rebuilt"]
        is parent["old_results_regraded"]
        is False
    )


@pytest.mark.parametrize(
    "change",
    [
        "missing-Bbar2",
        "extra-input",
        "mutable-scalars",
        "changed-divisor",
        "different-K",
    ],
)
def test_physical_division_parent_drift_is_refused_before_context_or_arithmetic(
    parent_inputs, monkeypatch, change
):
    supplied = dict(parent_inputs)
    if change == "missing-Bbar2":
        del supplied["Bbar__p_2.json"]
    elif change == "extra-input":
        supplied["alternative-factor.json"] = b"{}"
    elif change == "mutable-scalars":
        supplied["closure_scalars.json"] = bytearray(supplied["closure_scalars.json"])
    elif change == "changed-divisor":
        scalars = json.loads(supplied["closure_scalars.json"])
        scalars["delta_squared"] = scalars["delta"]
        supplied["closure_scalars.json"] = json.dumps(scalars).encode()
    else:
        supplied["K.json"] = supplied["J.json"]
    monkeypatch.setattr(E, "build_context", stop)
    with pytest.raises(ValueError):
        E.build_certificate(supplied)


@pytest.mark.parametrize(
    "change", ["failed", "incomplete", "unqualified-closure", "cleanup-failed"]
)
def test_physical_division_parent_acceptance_is_checked_beyond_byte_identity(
    parent_inputs, monkeypatch, change
):
    supplied = dict(parent_inputs)
    gate = json.loads(supplied["closure_gate.json"])
    if change == "failed":
        gate["passed"] = False
    elif change == "incomplete":
        gate["completed"] = False
    elif change == "unqualified-closure":
        gate["full_frequency_closure_validated"] = False
    else:
        gate["supervisor"]["cleanup_verified"] = False
    supplied["closure_gate.json"] = json.dumps(gate).encode()
    pins = copy.deepcopy(E.PARENT_FILES)
    pins["closure_gate.json"]["sha256"] = hashlib.sha256(
        supplied["closure_gate.json"]
    ).hexdigest()
    # This process-local pin fault injection reaches the status check. No
    # accepted artifact or frozen source is edited or requalified.
    monkeypatch.setattr(E, "PARENT_FILES", pins)
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(supplied)


def test_physical_division_polynomial_extension_does_not_extend_the_old_laurent_inverse():
    domain = E.domain_metadata()
    assert domain["fixed_case"] == 12 and domain["geometric"] is False
    assert domain["divisor"] == "delta_squared=chi^2*r^4*g^4"
    assert domain["divisor_homogeneous_degree"] == 16
    assert domain["quotient_homogeneous_degrees"] == [0, 1, 2]
    assert domain["division_direction"] == "real-nonzero"
    assert domain["polynomial_extension_direction"] == "all-real-after-acceptance"
    assert domain["frequency"] == "complex-all-after-acceptance"
    assert domain["substitution"] == "zeta^j*Q_j(v)=Q_j(zeta*v)"
    assert domain["zero_frequency_reachable_rank"] == 39
    for key in (
        "zero_frequency_full43_inverse_exists",
        "zero_frequency_off_image_unique",
        "old_laurent_maps_extended_to_zero",
        "actual_nonlinear_rhs_bridge_proved",
        "variable_background_proved",
        "uniform_frequency_energy_proved",
        "boundary_well_posedness_proved",
    ):
        assert domain[key] is False

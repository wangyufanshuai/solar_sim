"""Owned small controls for complete physical constraint closure.

The examples have one or two observable rows and at most three state columns.
They never reconstruct the scientific 43-by-58 candidate or its parent proofs.
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
    "owned supervisor required before physical-closure arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_physical_closure as E  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-physical-closure.py"
    spec = importlib.util.spec_from_file_location(
        "owned_physical_closure_control", path
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


def independent(value):
    return V.decode_matrix(record(value), shape=value.shape, max_degree=32)


def assert_matrix(actual, expected):
    assert record(actual) == record(expected)


def assert_zero(value):
    assert all(not poly for row in value for poly in row)


def name(family, power):
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def inputs(context, *, leak=0):
    x, _, _ = context["ring"].gens
    denominator = 2 + x * x
    physical = {p: matrix(context, [[0, 0]]) for p in range(3)}
    physical[0] = matrix(context, [[1, 0]])
    generator = {
        0: matrix(context, [[5, leak], [0, 7]]),
        1: matrix(context, [[3, 0], [0, 11]]),
    }
    section = {p: matrix(context, [[0], [0]]) for p in range(-2, 3)}
    section[0] = matrix(context, [[denominator], [0]])
    delta_source = matrix(context, [[0, 1], [0, 0]])
    return physical, generator, section, denominator, delta_source


def replay_arguments(arguments):
    physical, generator, section, denominator, delta_source = arguments
    return (
        {p: independent(a) for p, a in physical.items()},
        {p: independent(a) for p, a in generator.items()},
        {p: independent(a) for p, a in section.items()},
        V.decode_polynomial(P.canonical_polynomial(denominator), max_degree=32),
        independent(delta_source),
    )


def run_small(arguments, **keywords):
    return E.closure_from_matrices(*arguments, **keywords)


def assert_replay(arguments, result, replay_runner):
    observed = replay_runner.independent_closure(*replay_arguments(arguments))
    assert observed == {
        key: independent(value) for key, value in result["matrices"].items()
    }


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("physical-closure owned interruption")


def test_physical_closure_rectangular_right_section_and_real_kernel_leak(
    context, replay_runner
):
    arguments = inputs(context)
    denominator = arguments[3]
    result = run_small(arguments)
    matrices = result["matrices"]
    assert V.multiply(
        independent(arguments[0][0]), independent(arguments[2][0])
    ) == independent(matrix(context, [[denominator]]))
    assert_matrix(matrices[name("Bbar", 0)], matrix(context, [[5 * denominator]]))
    assert_matrix(matrices[name("Bbar", 1)], matrix(context, [[3 * denominator]]))
    for power in range(-2, 8):
        assert_zero(matrices[name("closure", power)])
    for power in range(-2, 6):
        assert_zero(matrices[name("delta_Bbar", power)])
    assert_matrix(matrices["delta_J"], arguments[4])
    assert_matrix(
        matrices[name("mutated_closure", 0)], matrix(context, [[0, -denominator]])
    )
    assert result["acceptance"] == {
        "registered_frequency_degree": True,
        "full_state_closure": True,
        "mutation_rejected": True,
        "accepted": True,
    }
    assert result["mutation"] == {
        "schema": "nr-case12-physical-closure-mutation-v1",
        "name": "theta-driver-source-feedback",
        "source_matrix": "delta_J",
        "entry": [0, 1],
        "delta_Bbar_powers": list(range(-2, 6)),
        "closure_powers": list(range(-2, 8)),
        "baseline_residual_preserved": True,
        "delta_nonzero_slots": 1,
        "residual_nonzero_slots": 1,
        "residual_coefficients": 2,
        "change_nonzero_slots": 1,
        "rejected": True,
    }
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_right_inverse_alone_does_not_imply_kernel_invariance(
    context, replay_runner
):
    arguments = inputs(context, leak=2)
    denominator = arguments[3]
    result = run_small(arguments)
    matrices = result["matrices"]
    assert V.multiply(
        independent(arguments[0][0]), independent(arguments[2][0])
    ) == independent(matrix(context, [[denominator]]))
    assert_matrix(
        matrices[name("closure", 0)], matrix(context, [[0, -2 * denominator]])
    )
    # The actual baseline residual must be included in the perturbed residual.
    assert_matrix(
        matrices[name("mutated_closure", 0)], matrix(context, [[0, -3 * denominator]])
    )
    assert result["acceptance"]["registered_frequency_degree"] is True
    assert result["acceptance"]["full_state_closure"] is False
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_cleared_section_requires_delta_squared_not_delta(
    context, replay_runner
):
    physical, generator, section, delta, delta_source = inputs(context)
    delta_squared = delta * delta
    section[0] = matrix(context, [[delta_squared], [0]])
    arguments = physical, generator, section, delta_squared, delta_source
    correct = run_small(arguments)
    assert correct["acceptance"]["full_state_closure"] is True
    wrong_arguments = physical, generator, section, delta, delta_source
    wrong = run_small(wrong_arguments)
    assert_matrix(
        wrong["matrices"][name("closure", 0)],
        matrix(context, [[5 * (delta_squared - delta), 0]]),
    )
    assert_matrix(
        wrong["matrices"][name("closure", 1)],
        matrix(context, [[3 * (delta_squared - delta), 0]]),
    )
    assert wrong["acceptance"]["full_state_closure"] is False
    assert wrong["acceptance"]["accepted"] is False
    assert_replay(arguments, correct, replay_runner)
    assert_replay(wrong_arguments, wrong, replay_runner)


def test_physical_closure_nonzero_delta_Bbar_cancels_a_kernel_preserving_mutation(
    context, replay_runner
):
    physical, generator, section, denominator, _ = inputs(context)
    delta_source = matrix(context, [[1, 0], [0, 0]])
    arguments = physical, generator, section, denominator, delta_source
    result = run_small(arguments)
    assert_matrix(
        result["matrices"][name("delta_Bbar", 0)], matrix(context, [[denominator]])
    )
    for power in range(-2, 8):
        assert_zero(result["matrices"][name("mutated_closure", power)])
    assert result["acceptance"] == {
        "registered_frequency_degree": True,
        "full_state_closure": True,
        "mutation_rejected": False,
        "accepted": False,
    }
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_baseline_failure_without_actual_change_is_not_a_negative_control(
    context, replay_runner
):
    physical, generator, section, denominator, _ = inputs(context, leak=2)
    arguments = (
        physical,
        generator,
        section,
        denominator,
        matrix(context, [[0, 0], [0, 0]]),
    )
    result = run_small(arguments)
    assert_matrix(
        result["matrices"][name("mutated_closure", 0)],
        matrix(context, [[0, -2 * denominator]]),
    )
    for power in range(-2, 8):
        assert_matrix(
            result["matrices"][name("mutated_closure", power)],
            result["matrices"][name("closure", power)],
        )
    assert result["mutation"]["delta_nonzero_slots"] == 0
    assert result["mutation"]["change_nonzero_slots"] == 0
    assert result["mutation"]["residual_nonzero_slots"] == 1
    assert result["mutation"]["entry"] is None
    assert result["acceptance"]["mutation_rejected"] is False
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_noncommuting_observable_coordinates_preserve_product_order(
    context, replay_runner
):
    x, _, _ = context["ring"].gens
    denominator = 2 + x * x
    physical = {p: matrix(context, [[0, 0, 0], [0, 0, 0]]) for p in range(3)}
    physical[0] = matrix(context, [[1, 1, 0], [0, 1, 0]])
    generator = {
        0: matrix(context, [[2, 0, 0], [0, 3, 0], [0, 0, 7]]),
        1: matrix(context, [[0, 0, 0], [0, 0, 0], [0, 0, 0]]),
    }
    section = {p: matrix(context, [[0, 0], [0, 0], [0, 0]]) for p in range(-2, 3)}
    section[0] = matrix(
        context, [[denominator, -denominator], [0, denominator], [0, 0]]
    )
    delta_source = matrix(context, [[0, 0, 1], [0, 0, 0], [0, 0, 0]])
    arguments = physical, generator, section, denominator, delta_source
    result = run_small(arguments)
    assert_matrix(
        result["matrices"][name("Bbar", 0)],
        matrix(context, [[2 * denominator, denominator], [0, 3 * denominator]]),
    )
    assert_matrix(
        result["matrices"][name("mutated_closure", 0)],
        matrix(context, [[0, 0, -denominator], [0, 0, 0]]),
    )
    assert result["acceptance"]["accepted"] is True
    assert_replay(arguments, result, replay_runner)


@pytest.mark.parametrize("extreme", ["lowest", "highest"])
def test_physical_closure_real_extreme_frequency_terms_are_retained_and_refused(
    context, replay_runner, extreme
):
    denominator = context["ring"](3)
    physical = {p: matrix(context, [[0]]) for p in range(3)}
    generator = {p: matrix(context, [[0]]) for p in range(2)}
    section = {p: matrix(context, [[0]]) for p in range(-2, 3)}
    if extreme == "lowest":
        physical[0] = matrix(context, [[1]])
        generator[0] = matrix(context, [[1]])
        section[-2] = matrix(context, [[denominator]])
        bpower, rpower = -2, -2
    else:
        physical[2] = matrix(context, [[1]])
        generator[1] = matrix(context, [[1]])
        section[2] = matrix(context, [[denominator]])
        bpower, rpower = 5, 7
    arguments = physical, generator, section, denominator, matrix(context, [[1]])
    result = run_small(arguments)
    assert_matrix(
        result["matrices"][name("Bbar", bpower)], matrix(context, [[denominator]])
    )
    assert_matrix(
        result["matrices"][name("closure", rpower)], matrix(context, [[denominator]])
    )
    assert result["acceptance"]["registered_frequency_degree"] is False
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_valid_right_inverse_can_still_generate_a_forbidden_cubic_term(
    context, replay_runner
):
    physical, generator, section, denominator, delta_source = inputs(context)
    generator = {0: matrix(context, [[0, 0], [0, 0]]), 1: delta_source.copy()}
    section[2] = matrix(context, [[0], [denominator]])
    arguments = physical, generator, section, denominator, delta_source
    result = run_small(arguments)
    assert V.multiply(independent(physical[0]), independent(section[2])) == [[{}]]
    assert_matrix(result["matrices"][name("Bbar", 3)], matrix(context, [[denominator]]))
    assert_matrix(
        result["matrices"][name("closure", 3)], matrix(context, [[denominator, 0]])
    )
    assert_matrix(
        result["matrices"][name("closure", 1)], matrix(context, [[0, -denominator]])
    )
    assert result["acceptance"]["registered_frequency_degree"] is False
    assert_replay(arguments, result, replay_runner)


def test_physical_closure_original_shift_changes_subsidiary_coefficient(
    context, replay_runner
):
    physical, generator, section, denominator, delta_source = inputs(context)
    x, y, z = context["ring"].gens
    shift = x + 2 * y + 3 * z
    intrinsic = run_small((physical, generator, section, denominator, delta_source))
    shifted_generator = {
        0: generator[0].copy(),
        1: matrix(context, [[3 + shift, 0], [0, 11 + shift]]),
    }
    arguments = physical, shifted_generator, section, denominator, delta_source
    shifted = run_small(arguments)
    difference = (
        shifted["matrices"][name("Bbar", 1)] - intrinsic["matrices"][name("Bbar", 1)]
    )
    assert_matrix(difference, matrix(context, [[denominator * shift]]))
    assert (
        shifted["acceptance"]["full_state_closure"]
        is intrinsic["acceptance"]["full_state_closure"]
        is True
    )
    # A generic algebra helper cannot infer the physical shift: parent byte
    # binding, separately checked below, fixes which K belongs to the model.
    assert_replay(arguments, shifted, replay_runner)


def test_physical_closure_complete_sink_order_and_existing_inputs_are_unchanged(
    context,
):
    arguments = inputs(context)
    before = [
        dict((p, record(a)) for p, a in series.items()) for series in arguments[:3]
    ] + [record(arguments[4])]
    seen, snapshots = [], {}

    def sink(key, value):
        seen.append(key)
        snapshots[key] = record(value)

    result = run_small(arguments, sink=sink)
    expected = (
        [name("Bbar", p) for p in range(-2, 6)]
        + [name("closure", p) for p in range(-2, 8)]
        + ["delta_J"]
        + [name("delta_Bbar", p) for p in range(-2, 6)]
        + [name("mutated_closure", p) for p in range(-2, 8)]
    )
    assert seen == expected and len(expected) == 37
    assert snapshots == {
        key: record(value) for key, value in result["matrices"].items()
    }
    after = [
        dict((p, record(a)) for p, a in series.items()) for series in arguments[:3]
    ] + [record(arguments[4])]
    assert before == after


@pytest.mark.parametrize(
    "change",
    [
        "missing-C2",
        "missing-L1",
        "missing-e-minus2",
        "missing-e2",
        "bool-power",
        "float-power",
        "wrong-shape",
    ],
)
def test_physical_closure_requires_complete_input_frequency_support(context, change):
    physical, generator, section, denominator, delta_source = inputs(context)
    if change == "missing-C2":
        del physical[2]
    elif change == "missing-L1":
        del generator[1]
    elif change == "missing-e-minus2":
        del section[-2]
    elif change == "missing-e2":
        del section[2]
    elif change == "bool-power":
        generator[False] = generator.pop(0)
    elif change == "float-power":
        section[1.0] = section.pop(1)
    else:
        delta_source = delta_source[:1].copy()
    with pytest.raises(ValueError):
        E.closure_from_matrices(physical, generator, section, denominator, delta_source)


@pytest.mark.parametrize(
    "change",
    [
        "zero-denominator",
        "float-denominator",
        "fraction-denominator",
        "float-cell",
        "integer-cell",
    ],
)
def test_physical_closure_exact_ring_types_and_nonzero_denominator_are_required(
    context, change
):
    physical, generator, section, denominator, delta_source = inputs(context)
    if change == "zero-denominator":
        denominator = context["ring"].zero
    elif change == "float-denominator":
        denominator = 2.0
    elif change == "fraction-denominator":
        denominator = F(2)
    elif change == "float-cell":
        delta_source[0, 0] = 0.0
    else:
        physical[2][0, 0] = 0
    with pytest.raises(ValueError):
        E.closure_from_matrices(physical, generator, section, denominator, delta_source)


@pytest.mark.parametrize("implementation", ["producer", "replay"])
@pytest.mark.parametrize("callback", ["guard", "check"])
def test_physical_closure_deadline_callbacks_propagate(
    context, replay_runner, implementation, callback
):
    with pytest.raises(StopControl, match="owned interruption"):
        if implementation == "producer":
            run_small(inputs(context), **{callback: stop})
        else:
            replay_runner.independent_closure(
                *replay_arguments(inputs(context)), **{callback: stop}
            )


@pytest.mark.parametrize("implementation", ["producer", "replay"])
def test_physical_closure_first_sink_failure_is_not_swallowed(
    context, replay_runner, implementation
):
    observed = []

    def sink(key, value):
        observed.append(key)
        assert key == name("Bbar", -2)
        stop()

    with pytest.raises(StopControl, match="owned interruption"):
        if implementation == "producer":
            run_small(inputs(context), sink=sink)
        else:
            replay_runner.independent_closure(
                *replay_arguments(inputs(context)), sink=sink
            )
    assert observed == [name("Bbar", -2)]


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero",
        "duplicate-slot",
        "bool-coordinate",
        "float-exponent",
        "unreduced-rational",
        "zero-term",
        "degree-overflow",
        "wrong-polynomial",
    ],
)
def test_physical_closure_replay_requires_complete_canonical_slots(
    context, replay_runner, change
):
    x, _, _ = context["ring"].gens
    original = matrix(context, [[x, 0], [0, 1]])
    expected = independent(original)
    good = record(original)
    assert len(good["entries"]) == 4
    replay_runner.check_matrix(good, expected, (2, 2), 3)
    bad = copy.deepcopy(good)
    if change == "missing-zero":
        bad["entries"].pop(1)
    elif change == "duplicate-slot":
        bad["entries"][1] = copy.deepcopy(bad["entries"][0])
    elif change == "bool-coordinate":
        bad["entries"][1][0] = False
    elif change == "float-exponent":
        bad["entries"][0][2][0][0] = 1.0
    elif change == "unreduced-rational":
        bad["entries"][0][2][0][3:] = ["2", "2"]
    elif change == "zero-term":
        bad["entries"][0][2][0][3] = "0"
    elif change == "degree-overflow":
        bad["entries"][0][2][0][0] = 4
    else:
        bad["entries"][0][2][0][3] = "2"
    with pytest.raises(ValueError):
        replay_runner.check_matrix(bad, expected, (2, 2), 3)


def test_physical_closure_source_bridge_is_pure_and_preserves_original_formula_ast(
    monkeypatch,
):
    monkeypatch.setattr(E, "_modules", stop)
    manifest = E.source_bridge_manifest()
    assert manifest["generator"] == "J+zeta*K"
    assert manifest["principal_shift_retained"] is True
    assert manifest["geometric"] is False
    assert manifest["original_matrices_rebuilt"] is False
    assert manifest["direction_denominator_division_executed"] is False
    expected_functions = {
        "scripts/nr_constraint_direction_section.py": {"lift", "section"},
        "scripts/nr_constraint_exact_coefficients.py": {"leading", "ode_projector"},
        "scripts/nr_profile_exact_coefficients.py": {"principal_rates", "matrix"},
        "scripts/nr_constraint_full_symbol.py": {"source", "physical_coefficients"},
        "scripts/nr_constraint_laurent_energy.py": {"factors", "bridge"},
    }
    assert set(manifest["bindings"]) == set(expected_functions)
    for path, names in expected_functions.items():
        raw = (ROOT / path).read_bytes()
        E.verify_source(raw, path)
        assert hashlib.sha256(raw).hexdigest() == manifest["source_hashes"][path]
        tree = ast.parse(raw.decode("utf-8"))
        nodes = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in names
        ]
        binding = manifest["bindings"][path]
        assert set(binding["functions"]) == names
        assert binding["executed"] is False
        assert (
            binding["ast_sha256"]
            == hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest()
        )


@pytest.mark.parametrize(
    "change", ["byte-change", "formula-ast-change", "unknown-source", "mutable-bytes"]
)
def test_physical_closure_formula_drift_and_unregistered_sources_are_refused(change):
    path = "scripts/nr_profile_exact_coefficients.py"
    raw = (ROOT / path).read_bytes()
    if change == "byte-change":
        raw += b"\n# changed source identity\n"
    elif change == "formula-ast-change":
        tree = ast.parse(raw.decode("utf-8"))
        node = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "principal_rates"
        )
        node.body = [ast.Return(value=ast.Constant(value=None))]
        raw = ast.unparse(ast.fix_missing_locations(tree)).encode()
    elif change == "unknown-source":
        path = "scripts/unregistered-closure-formula.py"
    else:
        raw = bytearray(raw)
    with pytest.raises(ValueError):
        E.verify_source(raw, path)


@pytest.mark.parametrize(
    "change",
    ["drop-highest-residual", "drop-delta-padding", "bool-power", "weaken-degree-cap"],
)
def test_physical_closure_complete_registration_cannot_be_weakened(monkeypatch, change):
    if change == "bool-power":
        monkeypatch.setattr(E, "L_POWERS", (False, 1))
    else:
        specs = dict(E.MATRIX_SPECS)
        if change == "drop-highest-residual":
            del specs[name("closure", 7)]
        elif change == "drop-delta-padding":
            del specs[name("delta_Bbar", 5)]
        else:
            specs[name("Bbar", 0)] = (43, 43, 23)
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


def test_physical_closure_parent_binding_uses_supplied_bytes_and_original_shift_K(
    parent_inputs, monkeypatch
):
    assert len(parent_inputs) == 26
    kspec = E.PARENT_FILES["K.json"]
    assert kspec["path"] == "K.json"
    assert (
        kspec["sha256"]
        == "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283"
    )

    def forbid_external_read(*args, **kwargs):
        raise AssertionError("parent manifest must use its archived byte arguments")

    monkeypatch.setattr(Path, "read_bytes", forbid_external_read)
    manifest = E.parent_provenance_manifest(parent_inputs)
    assert manifest["input_hashes"] == {
        name: hashlib.sha256(raw).hexdigest() for name, raw in parent_inputs.items()
    }
    assert manifest["inherited_physical_right_section_verified"] is True
    assert manifest["original_shift_principal_retained"] is True
    assert manifest["external_parent_reads"] is False
    assert manifest["parent_matrices_rebuilt"] is False
    assert manifest["old_results_regraded"] is False


@pytest.mark.parametrize(
    "change",
    [
        "missing-extreme-section",
        "extra-parent",
        "mutable-parent",
        "changed-parent-byte",
        "different-principal-matrix",
    ],
)
def test_physical_closure_parent_drift_is_refused_before_arithmetic(
    parent_inputs, monkeypatch, change
):
    supplied = dict(parent_inputs)
    if change == "missing-extreme-section":
        del supplied["e__p_2.json"]
    elif change == "extra-parent":
        supplied["unregistered.json"] = b"{}"
    elif change == "mutable-parent":
        supplied["K.json"] = bytearray(supplied["K.json"])
    elif change == "changed-parent-byte":
        supplied["right_gate.json"] += b" "
    else:
        supplied["K.json"] = supplied["J.json"]
    monkeypatch.setattr(E, "build_context", stop)
    with pytest.raises(ValueError):
        E.build_certificate(supplied)


@pytest.mark.parametrize(
    "change", ["failed-parent", "incomplete-parent", "live-parent", "uncleaned-parent"]
)
def test_physical_closure_parent_status_is_checked_beyond_a_hash(
    parent_inputs, monkeypatch, change
):
    supplied = dict(parent_inputs)
    gate = json.loads(supplied["right_gate.json"])
    if change == "failed-parent":
        gate["passed"] = False
    elif change == "incomplete-parent":
        gate["completed"] = False
    elif change == "live-parent":
        gate["live_admission"] = True
    else:
        gate["supervisor"]["cleanup_verified"] = False
    supplied["right_gate.json"] = json.dumps(gate).encode()
    # Process-local pin fault injection reaches the semantic acceptance gates;
    # it does not alter any archived file or relax the production source hash.
    pins = copy.deepcopy(E.PARENT_FILES)
    pins["right_gate.json"]["sha256"] = hashlib.sha256(
        supplied["right_gate.json"]
    ).hexdigest()
    monkeypatch.setattr(E, "PARENT_FILES", pins)
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(supplied)


def test_physical_closure_zero_frequency_scope_remains_rank39_and_conditional():
    domain = E.domain_metadata()
    assert domain["fixed_case"] == 12
    assert domain["frequency"] == "complex-all-after-acceptance"
    assert domain["direction"] == "real-nonzero"
    assert domain["generator"] == "J+zeta*K"
    assert domain["principal_shift_retained"] is True
    assert domain["denominator"] == "delta_squared=chi^2*r^4*g^4"
    assert domain["denominator_lower_over_r8"] == "1/4"
    assert domain["rational_direction_coefficients"] is True
    assert domain["zero_frequency_reachable_rank"] == 39
    for key in (
        "zero_frequency_full43_inverse_exists",
        "zero_frequency_off_image_unique",
        "local_differential_closure_proved",
        "low_frequency_uniform_energy_proved",
        "nonlinear_closure_proved",
    ):
        assert domain[key] is False

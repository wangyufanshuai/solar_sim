"""Owned small controls for the nonzero-frequency physical right section.

No test builds the scientific 43-by-58 candidate. Small coefficient examples
distinguish a nonzero square-zero correction from a general matrix and keep
every registered Laurent coefficient, including all explicit zero matrices.
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
    "owned supervisor required before right-section arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_physical_right_section as E  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-physical-right-section.py"
    spec = importlib.util.spec_from_file_location(
        "owned_physical_right_section_control", path
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def matrix(context, rows):
    return np.array(
        [[context["ring"](value) for value in row] for row in rows], dtype=object
    )


def matrix_record(value):
    return P.encode_matrix(value)


def independent(value):
    return V.decode_matrix(matrix_record(value), shape=value.shape, max_degree=32)


def assert_matrix(actual, expected):
    assert matrix_record(actual) == matrix_record(expected)


def assert_zero(value):
    assert all(not poly for row in value for poly in row)


def name(family, power):
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def inputs(context, columns=2, *, nilpotent=True):
    x, _, _ = context["ring"].gens
    delta = 2 + x * x
    nil = matrix(context, [[0, x], [0, 0]] if nilpotent else [[x, 0], [0, 0]])
    section = matrix(context, [[int(i == j) for j in range(2)] for i in range(columns)])
    source = matrix(
        context,
        [[delta * nil[i, j] if j < 2 else 0 for j in range(columns)] for i in range(2)],
    )
    zero = matrix(context, [[0, 0], [0, 0]])
    transform = {p: zero.copy() for p in range(-1, 3)}
    transform[-1] = matrix(context, [[delta, 0], [0, delta]])
    physical = {p: matrix(context, [[0] * columns for _ in range(2)]) for p in range(3)}
    physical[0] = matrix(
        context, [[nil[i, j] if j < 2 else 0 for j in range(columns)] for i in range(2)]
    )
    physical[1] = matrix(
        context, [[int(i == j) for j in range(columns)] for i in range(2)]
    )
    return source, section, transform, physical, delta


def run_small(arguments, **keywords):
    return E.right_section_from_matrices(*arguments, **keywords)


def replay_arguments(arguments):
    source, section, transform, physical, delta = arguments
    return (
        independent(source),
        independent(section),
        {p: independent(a) for p, a in transform.items()},
        {p: independent(a) for p, a in physical.items()},
        V.decode_polynomial(P.canonical_polynomial(delta), max_degree=32),
    )


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("right-section owned interruption")


@pytest.mark.parametrize("columns", [2, 3])
def test_physical_right_section_nonzero_square_zero_correction_has_exact_inverse(
    context, replay_runner, columns
):
    arguments = inputs(context, columns)
    delta = arguments[-1]
    x, _, _ = context["ring"].gens
    result = run_small(arguments, guard=lambda: None)
    matrices = result["matrices"]
    assert_matrix(matrices["H"], matrix(context, [[0, delta * x], [0, 0]]))
    assert matrices["H"][0, 1]
    assert_zero(matrices["H_squared"])
    expected_minus2 = matrix(
        context,
        [[0, -delta * delta * x], [0, 0]] + [[0, 0] for _ in range(columns - 2)],
    )
    expected_minus1 = matrix(
        context,
        [[delta * delta, 0], [0, delta * delta]] + [[0, 0] for _ in range(columns - 2)],
    )
    assert_matrix(matrices[name("e", -2)], expected_minus2)
    assert_matrix(matrices[name("e", -1)], expected_minus1)
    for power in range(3):
        assert_zero(matrices[name("e", power)])
    for power in range(-2, 5):
        assert_zero(matrices[name("right_inverse", power)])
    assert result["acceptance"] == {
        "nilpotence": True,
        "physical_right_inverse": True,
        "mutation_rejected": True,
        "accepted": True,
    }
    replayed = replay_runner.independent_section(*replay_arguments(arguments))
    assert replayed == {key: independent(value) for key, value in matrices.items()}


def test_physical_right_section_non_nilpotent_candidate_keeps_full_failure_evidence(
    context, replay_runner
):
    arguments = inputs(context, nilpotent=False)
    delta = arguments[-1]
    x, _, _ = context["ring"].gens
    result = run_small(arguments, guard=lambda: None)
    matrices = result["matrices"]
    assert_matrix(
        matrices["H_squared"], matrix(context, [[delta * delta * x * x, 0], [0, 0]])
    )
    assert_matrix(
        matrices[name("right_inverse", -2)],
        matrix(context, [[-delta * delta * x * x, 0], [0, 0]]),
    )
    assert all(name("right_inverse", p) in matrices for p in range(-2, 5))
    assert result["acceptance"]["nilpotence"] is False
    assert result["acceptance"]["physical_right_inverse"] is False
    assert result["acceptance"]["accepted"] is False
    replayed = replay_runner.independent_section(*replay_arguments(arguments))
    assert replayed == {key: independent(value) for key, value in matrices.items()}


def test_physical_right_section_deleted_negative_frequency_correction_is_real_mutation(
    context,
):
    arguments = inputs(context)
    delta = arguments[-1]
    x, _, _ = context["ring"].gens
    result = run_small(arguments, guard=lambda: None)
    matrices = result["matrices"]
    assert_zero(matrices[name("bad_e", -2)])
    assert_matrix(
        matrices[name("bad_e", -1)],
        matrix(context, [[delta * delta, 0], [0, delta * delta]]),
    )
    assert_matrix(
        matrices[name("bad_right_inverse", -1)],
        matrix(context, [[0, delta * delta * x], [0, 0]]),
    )
    for power in (-2, 0, 1, 2, 3, 4):
        assert_zero(matrices[name("bad_right_inverse", power)])
    assert matrices[name("e", -2)][0, 1] != matrices[name("bad_e", -2)][0, 1]
    mutation = result["mutation"]
    assert mutation["name"] == "omit-negative-frequency-correction"
    assert mutation["changed_formula"] == "bad_e=s*delta*t"
    assert mutation["residual_powers"] == list(range(-2, 5))
    assert mutation["residual_nonzero_slots"] == 1
    assert mutation["residual_coefficients"] == 3
    assert mutation["rejected"] is True


def test_physical_right_section_delta_squared_scale_is_not_replaced_by_delta(context):
    arguments = inputs(context)
    result = run_small(arguments, guard=lambda: None)
    delta = arguments[-1]
    physical = {p: independent(a) for p, a in arguments[3].items()}
    section = {p: independent(result["matrices"][name("e", p)]) for p in range(-2, 3)}
    # Independent exact products of tiny matrices, without producer recurrence.
    product0 = [[{} for _ in range(2)] for _ in range(2)]
    for p, left in physical.items():
        right = section.get(-p)
        if right is None:
            continue
        term = V.multiply(left, right)
        for i in range(2):
            for j in range(2):
                for exponent, coefficient in term[i][j].items():
                    product0[i][j][exponent] = (
                        product0[i][j].get(exponent, F(0)) + coefficient
                    )
                    if not product0[i][j][exponent]:
                        del product0[i][j][exponent]
    assert product0 == independent(
        matrix(context, [[delta * delta, 0], [0, delta * delta]])
    )
    assert product0 != independent(matrix(context, [[delta, 0], [0, delta]]))


def test_physical_right_section_noncommuting_left_and_right_factors_keep_order(
    context, replay_runner
):
    x, _, _ = context["ring"].gens
    section = matrix(context, [[1, 1], [0, 1]])
    source = matrix(context, [[0, 0], [x, -x]])
    zero = matrix(context, [[0, 0], [0, 0]])
    transform = {p: zero.copy() for p in range(-1, 3)}
    transform[0] = matrix(context, [[1, 0], [0, 3]])
    physical = {p: zero.copy() for p in range(3)}
    arguments = (source, section, transform, physical, context["ring"](2))
    result = E.right_section_from_matrices(*arguments, guard=lambda: None)
    matrices = result["matrices"]
    assert_matrix(matrices["H"], matrix(context, [[0, 0], [x, 0]]))
    assert_matrix(matrices[name("e", 0)], matrix(context, [[2, 6], [0, 6]]))
    assert_matrix(matrices[name("e", -1)], matrix(context, [[-x, 0], [-x, 0]]))
    # H*s*t would instead have a nonzero (1,1) entry; t*s changes e0 too.
    assert_matrix(
        matrices[name("right_inverse", 0)], matrix(context, [[-4, 0], [0, -4]])
    )
    replayed = replay_runner.independent_section(*replay_arguments(arguments))
    assert replayed == {key: independent(value) for key, value in matrices.items()}


def test_physical_right_section_full_support_sink_order_and_saved_values_are_stable(
    context,
):
    arguments = inputs(context)
    before = [
        matrix_record(arguments[0]),
        matrix_record(arguments[1]),
        {p: matrix_record(a) for p, a in arguments[2].items()},
        {p: matrix_record(a) for p, a in arguments[3].items()},
    ]
    observed, snapshots = [], {}

    def sink(key, value):
        observed.append(key)
        snapshots[key] = matrix_record(value)

    result = run_small(arguments, guard=lambda: None, sink=sink)
    expected = ["H", "H_squared"]
    expected += [
        name(family, p)
        for family, powers in (
            ("e", range(-2, 3)),
            ("right_inverse", range(-2, 5)),
            ("bad_e", range(-2, 3)),
            ("bad_right_inverse", range(-2, 5)),
        )
        for p in powers
    ]
    assert observed == expected
    assert set(result["matrices"]) == set(expected)
    assert snapshots == {
        key: matrix_record(value) for key, value in result["matrices"].items()
    }
    after = [
        matrix_record(arguments[0]),
        matrix_record(arguments[1]),
        {p: matrix_record(a) for p, a in arguments[2].items()},
        {p: matrix_record(a) for p, a in arguments[3].items()},
    ]
    assert before == after


@pytest.mark.parametrize(
    "change",
    [
        "missing-negative",
        "missing-highest",
        "missing-C2",
        "bool-power",
        "float-power",
        "wrong-shape",
    ],
)
def test_physical_right_section_incomplete_or_malformed_input_support_is_refused(
    context, change
):
    source, section, transform, physical, delta = inputs(context)
    if change == "missing-negative":
        del transform[-1]
    elif change == "missing-highest":
        del transform[2]
    elif change == "missing-C2":
        del physical[2]
    elif change == "bool-power":
        transform[False] = transform.pop(0)
    elif change == "float-power":
        physical[1.0] = physical.pop(1)
    else:
        section = section[:1].copy()
    with pytest.raises(ValueError):
        E.right_section_from_matrices(
            source, section, transform, physical, delta, guard=lambda: None
        )


@pytest.mark.parametrize(
    "change",
    ["zero-delta", "float-delta", "fraction-delta", "float-cell", "integer-cell"],
)
def test_physical_right_section_exact_ring_and_nonzero_denominator_are_enforced(
    context, change
):
    source, section, transform, physical, delta = inputs(context)
    if change == "zero-delta":
        delta = context["ring"].zero
    elif change == "float-delta":
        delta = 2.0
    elif change == "fraction-delta":
        delta = F(2)
    elif change == "float-cell":
        source[0, 0] = 0.0
    else:
        source[0, 0] = 0
    with pytest.raises(ValueError):
        E.right_section_from_matrices(
            source, section, transform, physical, delta, guard=lambda: None
        )


@pytest.mark.parametrize("callback", ["guard", "check"])
@pytest.mark.parametrize("implementation", ["producer", "replay"])
def test_physical_right_section_deadline_callbacks_propagate(
    context, replay_runner, callback, implementation
):
    with pytest.raises(StopControl, match="owned interruption"):
        if implementation == "producer":
            run_small(inputs(context), **{callback: stop})
        else:
            replay_runner.independent_section(
                *replay_arguments(inputs(context)), **{callback: stop}
            )


@pytest.mark.parametrize("implementation", ["producer", "replay"])
def test_physical_right_section_first_sink_error_stops_and_retains_caller_inputs(
    context, replay_runner, implementation
):
    arguments = inputs(context)
    before = matrix_record(arguments[0])
    seen = []

    def sink(key, value):
        seen.append(key)
        assert key == "H"
        assert value[0, 1] if implementation == "producer" else value[0][1]
        stop()

    with pytest.raises(StopControl, match="owned interruption"):
        if implementation == "producer":
            run_small(arguments, guard=lambda: None, sink=sink)
        else:
            replay_runner.independent_section(*replay_arguments(arguments), sink=sink)
    assert seen == ["H"]
    assert matrix_record(arguments[0]) == before


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero",
        "duplicate",
        "bool-coordinate",
        "float-exponent",
        "unreduced",
        "zero-term",
        "over-degree",
    ],
)
def test_physical_right_section_full_polynomial_reader_rejects_noncanonical_slots(
    context, replay_runner, change
):
    x, _, _ = context["ring"].gens
    expected = independent(matrix(context, [[0, x], [0, 0]]))
    bad = V.encode_matrix(expected)
    if change == "missing-zero":
        bad["entries"].pop()
    elif change == "duplicate":
        bad["entries"][2] = copy.deepcopy(bad["entries"][1])
    elif change == "bool-coordinate":
        bad["entries"][0][0] = False
    elif change == "float-exponent":
        bad["entries"][1][2][0][0] = 1.0
    elif change == "unreduced":
        bad["entries"][1][2][0][3:] = ["2", "2"]
    elif change == "zero-term":
        bad["entries"][1][2][0][3] = "0"
    else:
        bad["entries"][1][2][0][0] = 2
    with pytest.raises(ValueError):
        V.decode_matrix(bad, shape=(2, 2), max_degree=1)
    with pytest.raises(ValueError):
        replay_runner.check_matrix(bad, expected, (2, 2), 1)


def test_physical_right_section_zero_correction_does_not_pass_ineffective_negative_control(
    context,
):
    source, section, transform, physical, delta = inputs(context)
    source = matrix(context, [[0, 0], [0, 0]])
    physical[0] = source.copy()
    result = E.right_section_from_matrices(source, section, transform, physical, delta)
    assert_zero(result["matrices"]["H"])
    assert result["acceptance"] == {
        "nilpotence": True,
        "physical_right_inverse": True,
        "mutation_rejected": False,
        "accepted": False,
    }
    assert result["mutation"]["residual_nonzero_slots"] == 0
    assert result["mutation"]["rejected"] is False


@pytest.mark.parametrize(
    "change", ["missing-e-minus2", "missing-residual4", "bool-degree"]
)
def test_physical_right_section_output_registration_cannot_drop_full_powers(
    monkeypatch, change
):
    with monkeypatch.context() as patch:
        if change == "missing-e-minus2":
            patch.setattr(E, "E_POWERS", (-1, 0, 1, 2))
        elif change == "missing-residual4":
            patch.setattr(E, "RESIDUAL_POWERS", (-2, -1, 0, 1, 2, 3))
        else:
            bad = copy.deepcopy(E.MATRIX_SPECS)
            bad["H_squared"] = (43, 43, True)
            patch.setattr(E, "MATRIX_SPECS", bad)
        with pytest.raises(ValueError):
            E.source_bridge_manifest()


@pytest.mark.parametrize(
    "source_name",
    [
        "scripts/nr_constraint_direction_section.py",
        "scripts/nr_constraint_exact_coefficients.py",
        "scripts/nr_profile_exact_coefficients.py",
        "scripts/nr_constraint_full_symbol.py",
        "scripts/nr_constraint_laurent_energy.py",
    ],
)
def test_physical_right_section_frozen_source_bytes_refuse_drift(source_name):
    raw = (ROOT / source_name).read_bytes()
    E.verify_source(raw, source_name)
    with pytest.raises(ValueError, match="SHA"):
        E.verify_source(raw + b"\n# changed right-section dependency\n", source_name)
    with pytest.raises(ValueError):
        E.verify_source(raw.decode("utf-8"), source_name)


def test_physical_right_section_source_ast_binding_is_pure_and_complete(monkeypatch):
    selected = {
        "scripts/nr_constraint_direction_section.py": {"lift", "section"},
        "scripts/nr_constraint_exact_coefficients.py": {"leading", "ode_projector"},
        "scripts/nr_profile_exact_coefficients.py": {"inverse", "case12"},
        "scripts/nr_constraint_full_symbol.py": {"physical_coefficients"},
        "scripts/nr_constraint_laurent_energy.py": {"factors", "bridge"},
    }
    with monkeypatch.context() as patch:
        patch.setattr(E, "_modules", stop)
        manifest = E.source_bridge_manifest()
    assert set(manifest["bindings"]) == set(selected)
    for filename, names in selected.items():
        tree = ast.parse((ROOT / filename).read_text(encoding="utf-8"))
        nodes = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in names
        ]
        assert len(nodes) == len(names)
        expected = hashlib.sha256(
            ast.dump(
                ast.Module(body=nodes, type_ignores=[]), include_attributes=False
            ).encode()
        ).hexdigest()
        assert manifest["bindings"][filename] == {
            "functions": [node.name for node in nodes],
            "ast_sha256": expected,
            "executed": False,
        }
    assert manifest["construction"] == "H=F*s; e=s*(delta*I-zeta^-1*H)*t"
    assert manifest["original_formulas_rebuilt"] is False
    assert manifest["general_symbolic_elimination"] is False
    assert manifest["direction_sampling"] is False
    assert manifest["complete_frequency_support"] is True
    with pytest.raises(ValueError):
        E.verify_source(b"", "unregistered.py")


@pytest.fixture(scope="module")
def parent_inputs():
    evidence = ROOT / "tmp/nr-shadow-evidence"
    return {
        name: (evidence / spec["directory"] / spec["path"]).read_bytes()
        for name, spec in E.PARENT_FILES.items()
    }


def test_physical_right_section_archived_parents_bind_full_inverse_and_zero39_limits(
    parent_inputs, monkeypatch
):
    with monkeypatch.context() as patch:
        patch.setattr(Path, "read_bytes", lambda path: stop())
        manifest = E.parent_provenance_manifest(parent_inputs)
    assert set(manifest["input_hashes"]) == set(parent_inputs)
    assert manifest["inherited_right_section_verified"] is True
    assert manifest["inherited_coordinate_inverse_verified"] is True
    assert manifest["external_parent_reads"] is False
    assert manifest["parent_matrices_rebuilt"] is False
    assert manifest["old_results_regraded"] is False
    gate = json.loads(parent_inputs["coordinate_gate.json"])
    assert gate["zero_frequency_physical39_validated"] is True
    assert gate["zero_frequency_full43_inverse_exists"] is False
    assert gate["full_frequency_closure_validated"] is False


@pytest.mark.parametrize(
    "change", ["missing-s", "mutated-F", "worker-drift", "wrong-type", "extra"]
)
def test_physical_right_section_parent_input_mutations_are_refused(
    parent_inputs, change
):
    bad = dict(parent_inputs)
    if change == "missing-s":
        del bad["s.json"]
    elif change == "mutated-F":
        bad["F.json"] += b"\n"
    elif change == "worker-drift":
        bad["coordinate_worker.json"] += b"\n"
    elif change == "wrong-type":
        bad["section_replay.json"] = bad["section_replay.json"].decode("utf-8")
    else:
        bad["replacement.json"] = b"{}"
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(bad)


def test_physical_right_section_denominator_domain_excludes_zero_frequency_without_axis_exclusions():
    domain = E.domain_metadata()
    assert domain["fixed_case"] == 12
    assert domain["direction"] == "real-nonzero"
    assert domain["frequency"] == "complex-nonzero"
    assert domain["denominator"] == "delta_squared=chi^2*r^4*g^4"
    assert domain["g_lower_over_r"] == "5/6"
    assert domain["chi"] == "18/25"
    assert (
        F(domain["chi"]) ** 2 * F(domain["g_lower_over_r"]) ** 4
        == F(domain["denominator_lower_over_r8"])
        == F(1, 4)
    )
    assert domain["zero_frequency_admitted"] is False
    assert domain["full43_zero_frequency_right_inverse_exists"] is False
    assert domain["full_frequency_closure_proved"] is False
    assert domain["low_frequency_uniform_energy_proved"] is False

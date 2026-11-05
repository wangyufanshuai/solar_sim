"""Focused controls for an owned, factorized full58 energy certificate.

These controls expand small one-variable identities and a formal 14-coordinate
Gram expression. They scan complete serialized 58-by-58 inputs but never form
the unexpanded scientific H, H*K or matrix coercivity residuals.
"""

import ast
import copy
from fractions import Fraction as F
import importlib.util
import json
import os
from pathlib import Path
import sys

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned supervisor required before certificate arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import nr_case12_full58_factorized_energy as E  # noqa: E402

CONSTANTS = (
    F(2601, 100000),
    F(2601, 50000),
    F(2601, 5000),
    F(153, 125),
    F(459, 250),
    F(306, 125),
)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-full58-factorized-energy.py"
    spec = importlib.util.spec_from_file_location("owned_full58_energy_control", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def parent_records():
    return (
        json.loads((E.PARENT_DIRECTORY / "qualification-gate.json").read_bytes()),
        json.loads((E.PARENT_DIRECTORY / "worker-result.json").read_bytes()),
    )


@pytest.fixture(scope="module")
def univariate():
    return E.univariate_certificate(guard=lambda: None)


@pytest.fixture(scope="module")
def formal():
    return E.formal_gram_certificate(guard=lambda: None)


@pytest.fixture(scope="module")
def bounds(univariate):
    return E.coefficient_bound(
        complete_operator(), univariate["projectors"], guard=lambda: None
    )


@pytest.fixture(scope="module")
def negatives(univariate):
    return E.negative_controls(univariate, guard=lambda: None)


def complete_operator():
    record = {
        "schema": "nr-case12-polynomial-matrix-v1",
        "variables": ["x", "y", "z"],
        "shape": [58, 58],
        "entries": [[i, j, []] for i in range(58) for j in range(58)],
    }
    record["entries"][11 * 58 + 12][2] = [
        [0, 1, 0, "5", "7"],
        [1, 0, 0, "-3", "2"],
    ]
    record["entries"][57 * 58 + 11][2] = [[0, 0, 1, "11", "13"]]
    return record


def polynomial_value(record, point):
    # Independent direct evaluation is a local sanity check, never the proof.
    return sum(
        (
            F(int(numerator), int(denominator)) * point**power
            for power, numerator, denominator in record
        ),
        F(0),
    )


def table_values(record):
    rows, columns = record["shape"]
    assert len(record["entries"]) == rows * columns
    result = [[F(0) for _ in range(columns)] for _ in range(rows)]
    for index, (i, j, value) in enumerate(record["entries"]):
        assert (i, j) == divmod(index, columns)
        result[i][j] = F(value)
        assert str(result[i][j]) == value
    return result


def test_full58_energy_all_69_relations_have_independent_exact_divisions(
    univariate, replay_runner
):
    expected = [f"projector-{i}-{j}" for i in range(7) for j in range(7)]
    expected += ["completeness"]
    expected += [f"action-{j}" for j in range(1, 7)]
    expected += [f"speed-{j}" for j in range(1, 7)]
    expected += [f"transfer-{j}" for j in range(1, 7)]
    expected += ["zero-action"]
    assert [row["name"] for row in univariate["relations"]] == expected
    assert len(expected) == len(set(expected)) == 69
    assert univariate["accepted"] is True
    for row in univariate["relations"]:
        assert replay_runner.verify_division(row, univariate["modulus"]) is True
    assert univariate == replay_runner.univariate_certificate()
    assert replay_runner.check_univariate_record(univariate) is True


@pytest.mark.parametrize(
    "change", ["projector", "action", "relation", "order", "zero-action"]
)
def test_full58_energy_independent_identity_registration_rejects_omissions(
    univariate, replay_runner, change
):
    bad = copy.deepcopy(univariate)
    if change == "projector":
        bad["projectors"].pop()
    elif change == "action":
        bad["actions"].pop()
    elif change == "relation":
        bad["relations"].pop(0)
    elif change == "order":
        bad["projectors"][1], bad["projectors"][2] = (
            bad["projectors"][2],
            bad["projectors"][1],
        )
    else:
        bad["relations"][-1]["name"] = "square-only-zero-mode"
    with pytest.raises(ValueError):
        replay_runner.check_univariate_record(bad)


@pytest.mark.parametrize("branch", [1, 2, 3, 4, 5, 6])
def test_full58_energy_preserves_every_branch_and_its_odd_action(univariate, branch):
    projectors = univariate["projectors"]
    assert len(projectors) == 7 and len(univariate["actions"]) == 6
    row = projectors[branch]
    assert row["name"] == f"branch-{branch}"
    assert F(row["node"]) == CONSTANTS[branch - 1]
    assert row["u"] == [
        [2 * power, numerator, denominator]
        for power, numerator, denominator in row["e"]
    ]
    for index, point in enumerate((F(0), *CONSTANTS)):
        assert polynomial_value(row["e"], point) == F(index == branch)
    action = univariate["actions"][branch - 1]
    assert action["branch_index"] == branch and action["a"]
    assert all(power % 2 == 1 and power <= 11 for power, _, _ in action["a"])


def test_full58_energy_odd_modulus_detects_the_nonzero_zero_jordan_mode(univariate):
    modulus = univariate["modulus"]
    assert modulus[-1] == [13, "1", "1"]
    assert all(power % 2 == 1 for power, _, _ in modulus)
    linear = next(F(int(n), int(d)) for power, n, d in modulus if power == 1)
    product = F(1)
    for constant in CONSTANTS:
        product *= constant
    assert linear == product > 0
    # For N=E01, N^2=0. Only the linear coefficient contributes to p(N).
    odd_at_n = [[F(0), linear], [F(0), F(0)]]
    even_at_n_squared = [[F(0), F(0)], [F(0), F(0)]]
    assert odd_at_n != even_at_n_squared
    zero_action = next(
        row for row in univariate["relations"] if row["name"] == "zero-action"
    )
    assert zero_action["polynomial"]
    assert (
        next(
            F(int(n), int(d)) for power, n, d in zero_action["polynomial"] if power == 1
        )
        == 1
    )
    assert zero_action["quotient"] and zero_action["remainder"] == []


@pytest.mark.parametrize(
    "field", ["polynomial", "quotient", "remainder", "multiplyback", "name"]
)
def test_full58_energy_independent_division_rejects_tampered_relation_fields(
    univariate, replay_runner, field
):
    row = copy.deepcopy(univariate["relations"][0])
    if field == "name":
        row[field] = ""
    elif field in ("remainder", "multiplyback"):
        row[field] = [[0, "1", "1"]]
    else:
        terms = row[field]
        if terms and terms[0][0] == 0:
            terms[0][1] = str(int(terms[0][1]) + int(terms[0][2]))
        else:
            terms.insert(0, [0, "1", "1"])
    with pytest.raises(ValueError):
        replay_runner.verify_division(row, univariate["modulus"])


def test_full58_energy_nonzero_remainder_is_evidence_not_a_false_zero(replay_runner):
    # t^3+1 = (t^2-1)t + (t+1), with an explicitly retained remainder.
    row = {
        "name": "owned-nondivisible-example",
        "polynomial": [[0, "1", "1"], [3, "1", "1"]],
        "quotient": [[1, "1", "1"]],
        "remainder": [[0, "1", "1"], [1, "1", "1"]],
        "multiplyback": [],
    }
    before = copy.deepcopy(row)
    assert replay_runner.verify_division(row, [[0, "-1", "1"], [2, "1", "1"]]) is False
    assert row == before


@pytest.mark.parametrize(
    "terms",
    [
        [[True, "1", "1"]],
        [[-1, "1", "1"]],
        [[1.0, "1", "1"]],
        [[0, "0", "1"]],
        [[0, "2", "2"]],
        [[0, "1", "-1"]],
        [[0, "+1", "1"]],
        [[0, 1, "1"]],
        [[1, "1", "1"], [0, "1", "1"]],
        [[0, "1", "1"], [0, "2", "1"]],
        [[27, "1", "1"]],
    ],
)
def test_full58_energy_independent_univariate_parser_is_strict(
    context, replay_runner, terms
):
    with pytest.raises(ValueError):
        replay_runner.decode_univariate(terms)
    with pytest.raises(ValueError):
        E.decode_univariate(terms, context["ring"])


def test_full58_energy_sparse_codec_roundtrips_exact_fractions_and_zeros(context):
    ring, t = context["ring"], context["t"]
    value = t**2 - ring.domain.convert(F(2, 3)) * t + ring.domain.convert(F(5, 7))
    record = [[0, "5", "7"], [1, "-2", "3"], [2, "1", "1"]]
    assert E.encode_univariate(value) == record
    assert E.decode_univariate(record, ring, degree_cap=2) == value
    assert E.encode_univariate(ring.zero) == []
    assert E.decode_univariate([], ring) == ring.zero
    with pytest.raises(ValueError):
        E.decode_univariate(record, ring, degree_cap=1)


def test_full58_energy_formal_gram_matches_hand_computed_coefficients(
    formal, replay_runner
):
    assert formal["basis"] == [
        "O",
        "E0",
        *[f"E{j}" for j in range(1, 7)],
        *[f"a{j}" for j in range(1, 7)],
    ]
    weights = (F(1), F(1), *([F(1, 2)] * 6))
    assert formal["component_weights"] == [str(value) for value in weights]
    assert sum((1 / value for value in weights), F(0)) == 14
    assert formal["action_weights"] == [str(1 / (2 * c)) for c in CONSTANTS]
    h = table_values(formal["tables"]["H"])
    gram = table_values(formal["tables"]["Cgram"])
    shifted = table_values(formal["shifted_components"])
    for i in range(14):
        for j in range(14):
            expected_h = (
                (weights[i] if i < 8 else 1 / (2 * CONSTANTS[i - 8]))
                if i == j
                else F(0)
            )
            expected_gram = (
                (weights[i] if i == j else F(0)) - F(1, 14)
                if i < 8 and j < 8
                else (1 / (2 * CONSTANTS[i - 8]) if i == j and i >= 8 else F(0))
            )
            assert h[i][j] == expected_h
            assert gram[i][j] == expected_gram
    for k, weight in enumerate(weights):
        for i in range(14):
            assert shifted[k][i] == F(k == i) - (1 / (14 * weight) if i < 8 else F(0))
    assert replay_runner.check_formal_record(formal) is True


def test_full58_energy_formal_right_action_and_ode_are_separate(formal):
    right = table_values(formal["tables"]["right_action"])
    pi = table_values(formal["tables"]["pi_action"])
    expected = [[F(0) for _ in range(14)] for _ in range(14)]
    for branch, constant in enumerate(CONSTANTS):
        expected[branch + 2][branch + 8] = F(1)
        expected[branch + 8][branch + 2] = constant
    assert right == expected
    assert all(pi[i][j] == F(i == j and i != 0) for i in range(14) for j in range(14))
    assert all(value == 0 for value in right[0] + right[1])
    for name in ("Hsym", "HT", "HPi", "Gram"):
        record = formal["tables"][name]
        assert len(record["entries"]) == 196
        assert all(value == "0" for _, _, value in record["entries"])


@pytest.mark.parametrize(
    "change",
    [
        "gram-coefficient",
        "action-coefficient",
        "missing-zero-slot",
        "missing-component",
        "shift-sign",
        "zero-ode-mix",
        "residual",
        "bool-coordinate",
    ],
)
def test_full58_energy_independent_formal_replay_rejects_real_coefficient_defects(
    formal, replay_runner, change
):
    bad = copy.deepcopy(formal)
    if change == "gram-coefficient":
        bad["tables"]["Cgram"]["entries"][1][2] = "1/14"
    elif change == "action-coefficient":
        bad["action_weights"][0] = str(1 / CONSTANTS[0])
    elif change == "missing-zero-slot":
        bad["tables"]["Hsym"]["entries"].pop()
    elif change == "missing-component":
        bad["basis"].remove("E6")
    elif change == "shift-sign":
        bad["shifted_components"]["entries"][1][2] = "1/14"
    elif change == "zero-ode-mix":
        bad["tables"]["pi_action"]["entries"][0][2] = "1"
    elif change == "bool-coordinate":
        bad["tables"]["H"]["entries"][0][0] = False
    else:
        bad["tables"]["HT"]["entries"][0][2] = "1"
    with pytest.raises(ValueError):
        replay_runner.check_formal_record(bad)


def test_full58_energy_bound_scans_all_3364_slots_and_matches_hand_sum(
    bounds, univariate, replay_runner
):
    assert bounds["shape"] == [58, 58]
    assert len(bounds["entries"]) == 3364
    for index, (i, j, value) in enumerate(bounds["entries"]):
        assert (i, j) == divmod(index, 58)
        expected = (
            F(31, 14)
            if (i, j) == (11, 12)
            else F(11, 13)
            if (i, j) == (57, 11)
            else F(0)
        )
        assert F(value) == expected and str(expected) == value
    assert bounds["B"] == "557/182"
    assert bounds["m"] == "5/6" and bounds["sphere"] == "r=1"
    assert bounds["lower"] == "1/14" and bounds["accepted"] is True
    assert bounds["shift_norm_upper"] == "3/25"
    assert F(bounds["main_norm_upper"]) == F(557, 182) + F(3, 25)
    record = complete_operator()
    before = copy.deepcopy(record)
    assert bounds == replay_runner.coefficient_bound(record, univariate["projectors"])
    assert (
        replay_runner.check_bound_record(bounds, record, univariate["projectors"])
        is True
    )
    assert record == before


def test_full58_energy_upper_bound_uses_evaluated_exact_seven_projector_terms(
    bounds, univariate
):
    ratio = F(557, 182) ** 2 / F(5, 6)
    assert F(bounds["ratio"]) == ratio
    q = []
    for index, projector in enumerate(univariate["projectors"]):
        terms = [
            [
                power,
                str(abs(F(int(n), int(d)))),
                str(abs(F(int(n), int(d))) * ratio**power),
            ]
            for power, n, d in projector["e"]
        ]
        value = sum((F(row[2]) for row in terms), F(0))
        q.append(value)
        assert bounds["q_rows"][index] == {
            "name": projector["name"],
            "terms": terms,
            "value": str(value),
        }
    assert bounds["q"] == [str(value) for value in q]
    pairs = [value**2 / 2 for value in q[1:]]
    actions = [
        ratio * value**2 / (2 * constant)
        for value, constant in zip(q[1:], CONSTANTS, strict=True)
    ]
    assert bounds["upper_terms"] == {
        "ode": "1",
        "zero": str(q[0] ** 2),
        "pairs": [str(value) for value in pairs],
        "actions": [str(value) for value in actions],
    }
    assert bounds["upper"] == str(1 + q[0] ** 2 + sum(pairs, F(0)) + sum(actions, F(0)))


def test_full58_energy_last_coordinate_changes_the_actual_bound(univariate, bounds):
    record = complete_operator()
    record["entries"][-1][2] = [[0, 0, 1, "-1", "17"]]
    result = E.coefficient_bound(record, univariate["projectors"], guard=lambda: None)
    assert result["entries"][-1] == [57, 57, "1/17"]
    assert F(result["B"]) == F(557, 182) + F(1, 17)
    assert F(result["upper"]) > F(bounds["upper"])


@pytest.mark.parametrize(
    "change",
    [
        "missing-last",
        "duplicate",
        "reorder",
        "fraction",
        "float-power",
        "zero-coefficient",
        "nonlinear",
        "constant",
        "variables",
        "shape",
        "extra-field",
        "ode-row",
        "ode-column",
    ],
)
def test_full58_energy_bound_refuses_incomplete_or_noncanonical_actual_inputs(
    univariate, replay_runner, change
):
    record = complete_operator()
    if change == "missing-last":
        record["entries"].pop()
    elif change == "duplicate":
        record["entries"][-1][:2] = [57, 56]
    elif change == "reorder":
        record["entries"][-1], record["entries"][-2] = (
            record["entries"][-2],
            record["entries"][-1],
        )
    elif change == "fraction":
        record["entries"][-1][2] = [[1, 0, 0, "2", "2"]]
    elif change == "float-power":
        record["entries"][-1][2] = [[1.0, 0, 0, "1", "1"]]
    elif change == "zero-coefficient":
        record["entries"][-1][2] = [[1, 0, 0, "0", "1"]]
    elif change == "nonlinear":
        record["entries"][-1][2] = [[2, 0, 0, "1", "1"]]
    elif change == "constant":
        record["entries"][-1][2] = [[0, 0, 0, "1", "1"]]
    elif change == "variables":
        record["variables"] = ["y", "x", "z"]
    elif change == "shape":
        record["shape"] = [57, 58]
    elif change == "extra-field":
        record["omitted_zeros"] = True
    else:
        i, j = (0, 57) if change == "ode-row" else (57, 0)
        record["entries"][i * 58 + j][2] = [[1, 0, 0, "1", "1"]]
    for implementation in (E.coefficient_bound, replay_runner.coefficient_bound):
        with pytest.raises(ValueError):
            implementation(record, univariate["projectors"], guard=lambda: None)


@pytest.mark.parametrize("lower", [F(1), F(0), 5 / 6, "5/6", True])
def test_full58_energy_bound_refuses_changed_or_inexact_domain_lower(univariate, lower):
    with pytest.raises(ValueError):
        E.coefficient_bound(complete_operator(), univariate["projectors"], m=lower)


@pytest.mark.parametrize(
    "change",
    [
        "last-slot",
        "total",
        "upper",
        "missing-slot",
        "missing-branch",
        "lower",
        "bool-coordinate",
    ],
)
def test_full58_energy_independent_bound_replay_rejects_saved_claim_changes(
    bounds, univariate, replay_runner, change
):
    bad = copy.deepcopy(bounds)
    if change == "last-slot":
        bad["entries"][-1][2] = "1"
    elif change == "total":
        bad["B"] = str(F(bad["B"]) + 1)
    elif change == "upper":
        bad["upper"] = "1"
    elif change == "missing-slot":
        bad["entries"].pop()
    elif change == "missing-branch":
        bad["q_rows"].pop()
    elif change == "bool-coordinate":
        bad["entries"][0][0] = False
    else:
        bad["lower"] = "1/13"
    with pytest.raises(ValueError):
        replay_runner.check_bound_record(
            bad, complete_operator(), univariate["projectors"]
        )


@pytest.mark.parametrize("change", ["missing", "order", "u-bool"])
def test_full58_energy_bound_requires_complete_canonical_projector_inputs(
    univariate, bounds, replay_runner, change
):
    projectors = copy.deepcopy(univariate["projectors"])
    if change == "missing":
        projectors.pop()
    elif change == "order":
        projectors[1], projectors[2] = projectors[2], projectors[1]
    else:
        assert projectors[0]["u"][0][0] == 0
        projectors[0]["u"][0][0] = False
    with pytest.raises(ValueError):
        E.coefficient_bound(complete_operator(), projectors)
    with pytest.raises(ValueError):
        replay_runner.check_bound_record(bounds, complete_operator(), projectors)


def test_full58_energy_real_negative_controls_have_independent_saved_evidence(
    negatives, univariate, replay_runner
):
    assert negatives == replay_runner.negative_controls(univariate)
    assert negatives["accepted"] is True
    jordan = negatives["jordan"]
    assert table_values(jordan["N"]) == [[F(0), F(1)], [F(0), F(0)]]
    assert (
        table_values(jordan["N_squared"])
        == table_values(jordan["even_result"])
        == [[F(0), F(0)], [F(0), F(0)]]
    )
    assert table_values(jordan["zero_action_result"]) == table_values(jordan["N"])
    product = F(1)
    for constant in CONSTANTS:
        product *= constant
    assert table_values(jordan["odd_result"]) == [[F(0), product], [F(0), F(0)]]
    assert jordan["detected"] is True
    mutation = negatives["relation_mutation"]
    assert mutation["name"] == "add-one-to-zero-action"
    assert mutation["original_relation"] == "zero-action"
    assert mutation["remainder"] == [[0, "1", "1"]]
    assert mutation["multiplyback"] == [] and mutation["rejected"] is True
    row = {
        key: mutation[key]
        for key in ("name", "polynomial", "quotient", "remainder", "multiplyback")
    }
    assert replay_runner.verify_division(row, univariate["modulus"]) is False


@pytest.mark.parametrize("change", ["missing", "duplicate", "order", "float", "list"])
def test_full58_energy_fixed_six_branches_cannot_be_replaced_or_dropped(change):
    constants = {
        "missing": CONSTANTS[:-1],
        "duplicate": CONSTANTS[:-1] + (CONSTANTS[0],),
        "order": tuple(reversed(CONSTANTS)),
        "float": (float(CONSTANTS[0]),) + CONSTANTS[1:],
        "list": list(CONSTANTS),
    }[change]
    for implementation in (E.univariate_certificate, E.formal_gram_certificate):
        with pytest.raises(ValueError):
            implementation(constants, guard=lambda: None)


@pytest.mark.parametrize("entry", ["univariate", "formal", "bound", "negative"])
def test_full58_energy_deadline_callback_failures_propagate(univariate, entry):
    def fail():
        raise RuntimeError("owned synthetic deadline")

    with pytest.raises(RuntimeError, match="owned synthetic deadline"):
        if entry == "univariate":
            E.univariate_certificate(guard=fail)
        elif entry == "formal":
            E.formal_gram_certificate(guard=fail)
        elif entry == "bound":
            E.coefficient_bound(
                complete_operator(), univariate["projectors"], guard=fail
            )
        else:
            E.negative_controls(univariate, guard=fail)


@pytest.mark.parametrize("change", ["append", "pair-weight", "gram-difference"])
def test_full58_energy_original_formula_bytes_refuse_weight_or_sign_drift(change):
    raw = (ROOT / E.ENERGY_SOURCE).read_bytes()
    if change == "append":
        altered = raw + b"\n# unregistered factorized source\n"
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


def test_full58_energy_source_bridge_is_exact_and_keeps_unexpanded_scope(monkeypatch):
    raw = (ROOT / E.ENERGY_SOURCE).read_bytes()
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
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        original, include_attributes=False
    )
    assert audit["edits"] == [] and audit["executed"] is False
    assert audit["original_ast_sha256"] == audit["adapted_ast_sha256"]

    def forbidden_context(*args, **kwargs):
        raise AssertionError(
            "pure source manifest must not create a mathematical context"
        )

    monkeypatch.setattr(E, "build_context", forbidden_context)
    bridge = E.source_bridge_manifest()
    assert bridge["bindings"][E.ENERGY_SOURCE] == audit
    assert (
        bridge["original_formula_executed"]
        is bridge["expanded_energy_computed"]
        is False
    )
    assert bridge["formula_correspondence"]["weights"] == ["1", "1", *(["1/2"] * 6)]
    assert bridge["formula_correspondence"]["coercivity_denominator"] == "14"
    assert bridge["formula_correspondence"]["diagonal"] == "I58"
    with pytest.raises(ValueError):
        E.verify_source(raw, "unregistered.py")


def test_full58_energy_parent_status_accepts_the_actual_complete_spectral_parent(
    parent_records,
):
    E.validate_parent_status(*parent_records)


@pytest.mark.parametrize(
    "change", ["failed", "incomplete", "scope", "cleanup", "source", "input"]
)
def test_full58_energy_parent_status_refuses_missing_qualification(
    parent_records, change
):
    gate, worker = copy.deepcopy(parent_records)
    if change == "failed":
        worker["passed"] = False
    elif change == "incomplete":
        worker["completed"] = False
    elif change == "scope":
        worker["scientificPayloadWriteback"] = True
    elif change == "cleanup":
        gate["supervisor"]["cleanup_verified"] = False
    elif change == "source":
        worker["source_after"][E.ENERGY_SOURCE] = "0" * 64
    else:
        gate["artifact_hashes"]["K0.json"] = "0" * 64
    with pytest.raises(ValueError):
        E.validate_parent_status(gate, worker)


@pytest.mark.parametrize("name", ["K0.json", "parent-inputs/parent-inputs/domain.json"])
def test_full58_energy_parent_loader_detects_byte_drift_without_touching_files(
    monkeypatch, name
):
    target = (E.PARENT_DIRECTORY / name).resolve()
    original_read = Path.read_bytes
    original = original_read(target)

    def observed_read(path):
        data = original_read(path)
        return data + b"\n" if path.resolve() == target else data

    with monkeypatch.context() as patch:
        patch.setattr(Path, "read_bytes", observed_read)
        with pytest.raises(ValueError, match="SHA mismatch"):
            E.load_parent()
    assert original_read(target) == original


def test_full58_energy_domain_keeps_real_nonzero_and_factorized_limits(replay_runner):
    record = E.domain_metadata()
    assert record == replay_runner.domain_metadata()
    assert record["real_domain"] == "v!=0"
    assert record["unit_sphere"] == "r=1" and record["g_lower"] == "5/6"
    assert record["gram_metric"] == "I58"
    assert record["normalization"] == "T=K0/sqrt(g); a_j=A_j/sqrt(g)"
    assert record["denominators"] == ["g"]
    assert record["smooth_on_real_domain"] is True
    assert record["expanded_H_computed"] is False


@pytest.mark.parametrize(
    "change", ["bool-coordinate", "float-coordinate", "nonreduced", "missing-zero"]
)
def test_full58_energy_formal_table_codec_rejects_noncanonical_slots(change):
    original = [[F(1, 2), F(0)], [F(0), F(-2, 3)]]
    record = E.encode_table(original)
    assert E.decode_table(record, shape=(2, 2)) == original
    if change == "bool-coordinate":
        record["entries"][0][0] = False
    elif change == "float-coordinate":
        record["entries"][0][0] = 0.0
    elif change == "nonreduced":
        record["entries"][0][2] = "2/4"
    else:
        record["entries"].pop(1)
    with pytest.raises(ValueError):
        E.decode_table(record, shape=(2, 2))

"""Owned small controls for complete physical frequency reduction.

These examples distinguish matrix order, cleared scale and the actual changed
quadratic coefficient. The scientific 43-row transform is not rebuilt here.
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
    "owned supervisor required before frequency-reduction arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_physical_frequency_reduction as E  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-physical-frequency-reduction.py"
    spec = importlib.util.spec_from_file_location(
        "owned_frequency_reduction_control", path
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


def name(family, power):
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def inputs(context):
    x, y, _ = context["ring"].gens
    r = 2 + x * x
    t = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    u = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    t[0], u[0] = matrix(context, [[r]]), matrix(context, [[r]])
    q = {
        0: matrix(context, [[3]]),
        1: matrix(context, [[x + 2 * y]]),
        2: matrix(context, [[0]]),
    }
    ab = matrix(context, [[r * (x + 2 * y)]])
    return t, q, u, ab, r


def replay_arguments(arguments):
    t, q, u, ab, r = arguments
    return (
        {j: decoded(a) for j, a in t.items()},
        {j: decoded(a) for j, a in q.items()},
        {j: decoded(a) for j, a in u.items()},
        decoded(ab),
        scalar(r),
    )


def run_small(arguments, **kwargs):
    return E.reduction_from_matrices(*arguments, **kwargs)


def assert_replay(arguments, result, replay_runner):
    replay = replay_runner.independent_reduction(*replay_arguments(arguments))
    assert replay["matrices"] == {
        key: decoded(value) for key, value in result["matrices"].items()
    }
    assert replay_runner.canonical_equal(replay["acceptance"], result["acceptance"])
    assert replay_runner.canonical_equal(replay["mutation"], result["mutation"])


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("owned frequency-reduction interruption")


def test_frequency_reduction_nonunit_scale_and_actual_homogeneous_quadratic_mutation(
    context, replay_runner
):
    arguments = inputs(context)
    _, q, _, ab, r = arguments
    x, y, _ = context["ring"].gens
    result = run_small(arguments)
    saved = result["matrices"]
    assert_matrix(saved[name("Z", 0)], matrix(context, [[3 * r**2]]))
    assert_matrix(saved[name("Z", 1)], matrix(context, [[r**2 * (x + 2 * y)]]))
    assert_matrix(saved[name("Z", 1)], matrix(context, [[r * ab[0, 0]]]))
    assert_zero(saved["leading_residual"])
    for power in (-2, -1, 2, 3, 4, 5, 6):
        assert_zero(saved[name("Z", power)])
    assert_matrix(saved["bad_Q2"], matrix(context, [[q[2][0, 0] + x**2]]))
    assert_matrix(saved[name("mutated_Z", 2)], matrix(context, [[r**2 * x**2]]))
    for power in (-2, -1, 0, 1, 3, 4, 5, 6):
        assert_matrix(saved[name("mutated_Z", power)], saved[name("Z", power)])
    assert result["acceptance"] == {
        "above_first_order_zero": True,
        "leading_principal_match": True,
        "mutation_rejected": True,
        "accepted": True,
    }
    assert result["mutation"] == {
        "schema": "nr-case12-physical-frequency-reduction-mutation-v1",
        "name": "add-x2-identity-to-Q2",
        "source_matrix": "bad_Q2",
        "power": 2,
        "checked_powers": [2, 3, 4, 5, 6],
        "baseline_preserved": True,
        "input_changed_slots": 1,
        "mutated_high_nonzero_slots": 1,
        "mutated_high_coefficients": 3,
        "change_high_nonzero_slots": 1,
        "rejected": True,
    }
    assert_replay(arguments, result, replay_runner)


def test_frequency_reduction_noncommuting_similarity_preserves_both_matrix_orders(
    context, replay_runner
):
    x, y, _ = context["ring"].gens
    r = context["ring"](2)
    t = {j: matrix(context, [[0, 0], [0, 0]]) for j in range(-1, 3)}
    u = {j: matrix(context, [[0, 0], [0, 0]]) for j in range(-1, 3)}
    t[0] = matrix(context, [[r, r], [0, r]])
    u[0] = matrix(context, [[r, -r], [0, r]])
    q = {
        0: matrix(context, [[2, 0], [0, 3]]),
        1: matrix(context, [[x, 0], [0, y]]),
        2: matrix(context, [[0, 0], [0, 0]]),
    }
    ab = matrix(context, [[2 * x, 2 * (y - x)], [0, 2 * y]])
    arguments = t, q, u, ab, r
    result = run_small(arguments)
    assert_matrix(result["matrices"][name("Z", 0)], matrix(context, [[8, 4], [0, 12]]))
    assert_matrix(
        result["matrices"][name("Z", 1)],
        matrix(context, [[4 * x, 4 * (y - x)], [0, 4 * y]]),
    )
    assert_matrix(
        result["matrices"][name("mutated_Z", 2)],
        matrix(context, [[4 * x**2, 0], [0, 4 * x**2]]),
    )
    assert result["acceptance"]["accepted"] is True
    assert_replay(arguments, result, replay_runner)


@pytest.mark.parametrize("extreme", ["lowest", "highest"])
def test_frequency_reduction_full_endpoint_support_is_retained(
    context, replay_runner, extreme
):
    x, _, z = context["ring"].gens
    r = context["ring"].one
    t = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    u = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    q = {j: matrix(context, [[0]]) for j in range(3)}
    if extreme == "lowest":
        t[-1], u[-1], q[0] = (
            matrix(context, [[1]]),
            matrix(context, [[1]]),
            matrix(context, [[1]]),
        )
        target, expected, changed_power = -2, 1, 0
    else:
        t[2], u[2], q[2] = (
            matrix(context, [[1]]),
            matrix(context, [[1]]),
            matrix(context, [[z**2]]),
        )
        target, expected, changed_power = 6, z**2, 6
    arguments = t, q, u, matrix(context, [[0]]), r
    result = run_small(arguments)
    saved = result["matrices"]
    assert_matrix(saved[name("Z", target)], matrix(context, [[expected]]))
    assert_matrix(
        saved[name("mutated_Z", changed_power)],
        matrix(context, [[x**2 if extreme == "lowest" else z**2 + x**2]]),
    )
    assert result["acceptance"]["above_first_order_zero"] is (extreme == "lowest")
    assert result["acceptance"]["mutation_rejected"] is (extreme == "highest")
    assert result["acceptance"]["accepted"] is False
    assert len(saved) == 20
    assert_replay(arguments, result, replay_runner)


@pytest.mark.parametrize("coefficient", [5, -1])
def test_frequency_reduction_actual_failed_baseline_is_retained_in_mutated_high_power(
    context, replay_runner, coefficient
):
    t, q, u, ab, r = inputs(context)
    x, _, _ = context["ring"].gens
    q[2] = matrix(context, [[coefficient * x**2]])
    arguments = t, q, u, ab, r
    result = run_small(arguments)
    assert_matrix(
        result["matrices"][name("Z", 2)], matrix(context, [[coefficient * r**2 * x**2]])
    )
    assert_matrix(
        result["matrices"][name("mutated_Z", 2)],
        matrix(context, [[(coefficient + 1) * r**2 * x**2]]),
    )
    assert result["acceptance"]["above_first_order_zero"] is False
    assert result["acceptance"]["mutation_rejected"] is (coefficient != -1)
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


@pytest.mark.parametrize(
    "change", ["missing-r-factor", "extra-sqrt-scale", "discarded-shift"]
)
def test_frequency_reduction_wrong_principal_target_is_detected_without_extra_normalization(
    context, replay_runner, change
):
    x, y, z = context["ring"].gens
    r = context["ring"](4)
    t = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    u = {j: matrix(context, [[0]]) for j in range(-1, 3)}
    t[0], u[0] = matrix(context, [[r]]), matrix(context, [[r]])
    shift = y + 2 * z
    speed = x + shift
    q = {
        0: matrix(context, [[0]]),
        1: matrix(context, [[speed]]),
        2: matrix(context, [[0]]),
    }
    if change == "missing-r-factor":
        target, expected = speed, 12 * speed
    elif change == "extra-sqrt-scale":
        target, expected = 2 * speed, 8 * speed
    else:
        target, expected = 4 * x, 16 * shift
    arguments = t, q, u, matrix(context, [[target]]), r
    result = run_small(arguments)
    assert_matrix(result["matrices"]["leading_residual"], matrix(context, [[expected]]))
    assert result["acceptance"]["above_first_order_zero"] is True
    assert result["acceptance"]["leading_principal_match"] is False
    assert result["acceptance"]["accepted"] is False
    assert_replay(arguments, result, replay_runner)


def test_frequency_reduction_all_saved_outputs_and_inputs_remain_unchanged(context):
    arguments = inputs(context)
    before = [{j: record(a) for j, a in series.items()} for series in arguments[:3]] + [
        record(arguments[3])
    ]
    order, snapshots = [], {}

    def sink(key, value):
        order.append(key)
        snapshots[key] = record(value)

    result = run_small(arguments, sink=sink)
    expected = (
        [name("Z", p) for p in range(-2, 7)]
        + ["leading_residual", "bad_Q2"]
        + [name("mutated_Z", p) for p in range(-2, 7)]
    )
    assert order == expected and len(expected) == 20
    assert snapshots == {
        key: record(value) for key, value in result["matrices"].items()
    }
    assert before == [
        {j: record(a) for j, a in series.items()} for series in arguments[:3]
    ] + [record(arguments[3])]


@pytest.mark.parametrize(
    "change",
    [
        "missing-t-minus1",
        "missing-u2",
        "missing-Q2",
        "bool-power",
        "wrong-t-shape",
        "wrong-Ab-shape",
        "zero-r",
        "float-r",
        "fraction-r",
        "float-cell",
    ],
)
def test_frequency_reduction_complete_support_and_exact_ring_dimensions_are_required(
    context, change
):
    t, q, u, ab, r = inputs(context)
    if change == "missing-t-minus1":
        del t[-1]
    elif change == "missing-u2":
        del u[2]
    elif change == "missing-Q2":
        del q[2]
    elif change == "bool-power":
        q[False] = q.pop(0)
    elif change == "wrong-t-shape":
        t[0] = matrix(context, [[1, 0]])
    elif change == "wrong-Ab-shape":
        ab = matrix(context, [[1, 0]])
    elif change == "zero-r":
        r = context["ring"].zero
    elif change == "float-r":
        r = 1.0
    elif change == "fraction-r":
        r = F(1)
    else:
        u[2][0, 0] = 0.0
    with pytest.raises(ValueError):
        run_small((t, q, u, ab, r))


@pytest.mark.parametrize("implementation", ["producer", "replay"])
@pytest.mark.parametrize("callback", ["guard", "check"])
def test_frequency_reduction_deadline_exceptions_propagate(
    context, replay_runner, implementation, callback
):
    with pytest.raises(StopControl, match="owned frequency-reduction interruption"):
        if implementation == "producer":
            run_small(inputs(context), **{callback: stop})
        else:
            replay_runner.independent_reduction(
                *replay_arguments(inputs(context)), **{callback: stop}
            )


@pytest.mark.parametrize("implementation", ["producer", "replay"])
def test_frequency_reduction_first_sink_exception_stops_output(
    context, replay_runner, implementation
):
    observed = []

    def sink(key, value):
        observed.append(key)
        stop()

    with pytest.raises(StopControl, match="owned frequency-reduction interruption"):
        if implementation == "producer":
            run_small(inputs(context), sink=sink)
        else:
            replay_runner.independent_reduction(
                *replay_arguments(inputs(context)), sink=sink
            )
    assert observed == [name("Z", -2)]


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero-slot",
        "duplicate-slot",
        "boolean-coordinate",
        "float-exponent",
        "unreduced-rational",
        "wrong-polynomial",
        "degree-overflow",
    ],
)
def test_frequency_reduction_saved_coefficient_matrices_are_complete_and_canonical(
    context, replay_runner, change
):
    x, _, _ = context["ring"].gens
    original = matrix(context, [[x, 0], [0, 1]])
    expected = decoded(original)
    saved = record(original)
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
    elif change == "wrong-polynomial":
        changed["entries"][0][2][0][3] = "2"
    else:
        changed["entries"][0][2][0][0] = 7
    with pytest.raises(ValueError):
        replay_runner.check_matrix(changed, expected, (2, 2), 6)


@pytest.mark.parametrize(
    "change",
    ["boolean-count", "float-power", "missing-highest-power", "baseline-discarded"],
)
def test_frequency_reduction_mutation_metadata_has_strict_types_and_complete_powers(
    context, replay_runner, change
):
    arguments = inputs(context)
    result = run_small(arguments)
    expected = replay_runner.independent_reduction(*replay_arguments(arguments))[
        "mutation"
    ]
    assert replay_runner.canonical_equal(result["mutation"], expected)
    altered = copy.deepcopy(result["mutation"])
    if change == "boolean-count":
        altered["input_changed_slots"] = True
    elif change == "float-power":
        altered["power"] = 2.0
    elif change == "missing-highest-power":
        altered["checked_powers"].pop()
    else:
        altered["baseline_preserved"] = False
    assert not replay_runner.canonical_equal(altered, expected)


def test_frequency_reduction_normalized_energy_lower_bound_is_not_the_raw_bound(
    context,
):
    # A two-coordinate subexample with r=4: the first coordinate is scaled.
    # H=G/14 symmetrizes Khat, whereas only S^T H S has the I/14 lower bound.
    scaling = decoded(matrix(context, [[2, 0], [0, 1]]))
    inverse_scaling = decoded(matrix(context, [[F(1, 2), 0], [0, 1]]))
    energy = decoded(matrix(context, [[F(1, 56), 0], [0, F(1, 14)]]))
    principal = decoded(matrix(context, [[0, 4], [1, 0]]))
    normalized_energy = V.multiply(scaling, V.multiply(energy, scaling))
    assert normalized_energy == decoded(matrix(context, [[F(1, 14), 0], [0, F(1, 14)]]))
    assert normalized_energy != energy
    conjugated_principal = V.multiply(inverse_scaling, V.multiply(principal, scaling))
    assert conjugated_principal == decoded(matrix(context, [[0, 2], [2, 0]]))
    normalized_principal = V.multiply(
        decoded(matrix(context, [[F(1, 2), 0], [0, F(1, 2)]])),
        conjugated_principal,
    )
    assert normalized_principal == decoded(matrix(context, [[0, 1], [1, 0]]))
    # Dividing the conjugated principal by sqrt(r)=2 is a later coordinate
    # normalization. It must not enter the separate Z1=r*Ab comparison.
    assert V.multiply(energy, principal) == decoded(
        matrix(context, [[0, F(1, 14)], [F(1, 14), 0]])
    )


def test_frequency_reduction_source_bridge_binds_original_transform_and_normalization(
    monkeypatch,
):
    monkeypatch.setattr(E, "_modules", stop)
    bridge = E.source_bridge_manifest()
    assert bridge["construction"] == "Z=(t*Q)*u=r_squared*T*Q*Ti"
    assert bridge["leading_identity"] == "Z[1]-r*Ab=0; Khat43=Ab/r"
    assert bridge["normal_principal"] == "S43^-1*Khat43*S43/sqrt(r)"
    assert bridge["normal_energy"] == "S43.T*H*S43"
    assert bridge["complete_powers"] == [-2, -1, 0, 1, 2, 3, 4, 5, 6]
    assert bridge["original_shift_retained"] is True
    assert (
        bridge["geometric"]
        is bridge["direction_sampling"]
        is bridge["original_matrices_rebuilt"]
        is bridge["alternative_transform_search"]
        is bridge["new_uniform_growth_bound"]
        is False
    )
    expected = {
        "scripts/nr_constraint_laurent_energy.py": {
            "factors",
            "bridge",
            "reduction",
            "normal_coordinates",
        },
        "scripts/nr_constraint_exact_coefficients.py": {
            "leading",
            "intrinsic",
            "normalized",
        },
        "scripts/nr_profile_exact_coefficients.py": {"principal_rates", "matrix"},
        "scripts/nr_case12_physical_coordinate_bridge.py": {"laurent_product"},
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
    source = ast.parse(
        (ROOT / "scripts/nr_constraint_exact_coefficients.py").read_bytes()
    )
    scaled = [
        ast.literal_eval(node.value)
        for node in source.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "SCALED_ROWS"
            for target in node.targets
        )
    ]
    assert len(scaled) == 1
    assert tuple(scaled[0]) == (0, 1, 2, 3, 41)
    assert bridge["scaled_rows"] == list(scaled[0])


@pytest.mark.parametrize(
    "change", ["comment", "normalization-formula", "unknown-source", "mutable-bytes"]
)
def test_frequency_reduction_source_byte_and_formula_drift_are_rejected(change):
    path = "scripts/nr_constraint_laurent_energy.py"
    raw = (ROOT / path).read_bytes()
    if change == "comment":
        raw += b"\n# unregistered transform\n"
    elif change == "normalization-formula":
        tree = ast.parse(raw.decode("utf-8"))
        selected = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "normal_coordinates"
        ]
        assert len(selected) == 1
        selected[0].body = [ast.Pass()]
        raw = ast.unparse(ast.fix_missing_locations(tree)).encode()
    elif change == "unknown-source":
        path = "scripts/unregistered-frequency-transform.py"
    else:
        raw = bytearray(raw)
    with pytest.raises(ValueError):
        E.verify_source(raw, path)


@pytest.mark.parametrize(
    "change",
    ["drop-highest", "drop-mutated-lowest", "weaken-leading-cap", "bool-power"],
)
def test_frequency_reduction_complete_output_registration_cannot_drift(
    monkeypatch, change
):
    assert E.MATRIX_SPECS["Z__p_6"] == (43, 43, 10)
    assert E.MATRIX_SPECS["mutated_Z__p_m2"] == (43, 43, 2)
    assert E.MATRIX_SPECS["leading_residual"] == (43, 43, 6)
    if change == "bool-power":
        monkeypatch.setattr(E, "T_POWERS", (-1, False, 1, 2))
    else:
        specs = dict(E.MATRIX_SPECS)
        if change == "drop-highest":
            del specs["Z__p_6"]
        elif change == "drop-mutated-lowest":
            del specs["mutated_Z__p_m2"]
        else:
            specs["leading_residual"] = (43, 43, 7)
        monkeypatch.setattr(E, "MATRIX_SPECS", specs)
    with pytest.raises(ValueError):
        E.source_bridge_manifest()


@pytest.fixture(scope="module")
def parent_inputs():
    return {
        key: (
            ROOT / "tmp/nr-shadow-evidence" / spec["directory"] / spec["path"]
        ).read_bytes()
        for key, spec in E.PARENT_FILES.items()
    }


def test_frequency_reduction_parent_bytes_bind_the_qualified_43_row_principal(
    parent_inputs,
    monkeypatch,
):
    assert len(parent_inputs) == 28
    assert E.PARENT_FILES["Ab.json"]["path"] == "division_quotient.json"
    assert E.PARENT_FILES["Ab.json"]["sha256"] == (
        "40c4811594ad4828f4a0562635ea78b98df23fdcd5b2bace6fe213a5f5a9fa96"
    )

    def forbid_read(*args, **kwargs):
        raise AssertionError("parent bytes manifest attempted external access")

    monkeypatch.setattr(Path, "read_bytes", forbid_read)
    provenance = E.parent_provenance_manifest(parent_inputs)
    assert provenance["input_hashes"] == {
        key: hashlib.sha256(raw).hexdigest() for key, raw in parent_inputs.items()
    }
    assert (
        provenance["inherited_coordinate_inverses_verified"]
        is provenance["inherited_polynomial_physical_closure_verified"]
        is provenance["inherited_principal_quotient_verified"]
        is True
    )
    assert (
        provenance["external_parent_reads"]
        is provenance["parent_matrices_rebuilt"]
        is provenance["old_results_regraded"]
        is False
    )


@pytest.mark.parametrize(
    "change",
    [
        "missing-negative-t",
        "missing-highest-u",
        "changed-Q2",
        "mutable-scalars",
        "different-Ab",
    ],
)
def test_frequency_reduction_parent_drift_fails_before_context_or_arithmetic(
    parent_inputs,
    monkeypatch,
    change,
):
    supplied = dict(parent_inputs)
    if change == "missing-negative-t":
        del supplied["rT__p_m1.json"]
    elif change == "missing-highest-u":
        del supplied["rTi__p_2.json"]
    elif change == "changed-Q2":
        supplied["Q2.json"] += b"\n"
    elif change == "mutable-scalars":
        supplied["division_scalars.json"] = bytearray(supplied["division_scalars.json"])
    else:
        assert supplied["Ab.json"] != supplied["Q1.json"]
        supplied["Ab.json"] = supplied["Q1.json"]
    monkeypatch.setattr(E, "build_context", stop)
    with pytest.raises(ValueError):
        E.build_certificate(supplied)


@pytest.mark.parametrize(
    "change",
    [
        "division-failed",
        "coordinate-incomplete",
        "blocks-unqualified",
        "cleanup-failed",
    ],
)
def test_frequency_reduction_parent_qualification_is_checked_beyond_hash_identity(
    parent_inputs,
    monkeypatch,
    change,
):
    supplied = dict(parent_inputs)
    key = {
        "division-failed": "division_gate.json",
        "coordinate-incomplete": "coordinate_gate.json",
        "blocks-unqualified": "blocks_gate.json",
        "cleanup-failed": "division_gate.json",
    }[change]
    gate = json.loads(supplied[key])
    if change == "division-failed":
        gate["passed"] = False
    elif change == "coordinate-incomplete":
        gate["completed"] = False
    elif change == "blocks-unqualified":
        gate["ode_blocks_validated"] = False
    else:
        gate["supervisor"]["cleanup_verified"] = False
    supplied[key] = json.dumps(gate).encode()
    pins = copy.deepcopy(E.PARENT_FILES)
    pins[key]["sha256"] = hashlib.sha256(supplied[key]).hexdigest()
    # In-memory pin injection reaches status validation without changing any
    # frozen parent evidence or establishing new qualification for it.
    monkeypatch.setattr(E, "PARENT_FILES", pins)
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(supplied)


def test_frequency_reduction_domain_keeps_zero_frequency_and_energy_claims_separate():
    domain = E.domain_metadata()
    assert domain["fixed_case"] == 12
    assert domain["direction"] == "real-nonzero"
    assert domain["frequency"] == "complex-nonzero"
    assert domain["physical_frequency"] == "zeta=i*rho/sqrt(r); rho>0"
    assert domain["cleared_denominator"] == "r_squared"
    assert domain["transformed_symbol"] == "Ared=Z/r_squared=T*Q*Ti"
    assert domain["principal43"] == "Khat43=Ab/r"
    assert domain["original_shift_retained"] is True
    assert domain["scaled_rows"] == [0, 1, 2, 3, 41]
    assert domain["normal_principal"] == "S43^-1*Khat43*S43/sqrt(r)"
    assert domain["normal_energy"] == "S43.T*H*S43"
    assert domain["full_saved_powers"] == [-2, -1, 0, 1, 2, 3, 4, 5, 6]
    assert domain["required_zero_powers"] == [2, 3, 4, 5, 6]
    assert (
        domain["geometric"]
        is domain["discarded_frequency_powers"]
        is domain["zero_frequency_full43_inverse_exists"]
        is domain["laurent_evaluated_at_zero"]
        is domain["uniform_frequency_energy_proved"]
        is domain["actual_nonlinear_rhs_bridge_proved"]
        is domain["boundary_well_posedness_proved"]
        is False
    )

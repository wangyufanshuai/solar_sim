"""Owned controls for the physical43 Laurent coordinate bridge.

Small exact examples test the algebra and the independent reader. The complete
scientific bridge and its two actual coefficient mutations belong to the single
owned certificate construction, not repeated unit-test constructions.
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
    "owned supervisor required before coordinate arithmetic imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np  # noqa: E402

import nr_case12_physical_coordinate_bridge as E  # noqa: E402
import nr_case12_polynomial_section as P  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def context():
    return E.build_context(guard=lambda: None)


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-physical-coordinate-bridge.py"
    spec = importlib.util.spec_from_file_location("owned_physical_bridge_control", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def matrix(context, rows):
    ring = context["ring"]
    return np.array([[ring(value) for value in row] for row in rows], dtype=object)


def independent(value):
    return V.decode_matrix(P.encode_matrix(value), shape=value.shape, max_degree=32)


def assert_matrix(actual, expected):
    assert P.encode_matrix(actual) == P.encode_matrix(expected)


def assert_zero(value):
    assert all(not cell for row in value for cell in row)


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("owned control interruption")


def test_physical_bridge_laurent_convolution_retains_entire_formal_support(
    context, replay_runner
):
    x, _, z = context["ring"].gens
    left = {
        -1: matrix(context, [[x]]),
        0: matrix(context, [[0]]),
        1: matrix(context, [[2]]),
    }
    right = {
        0: matrix(context, [[z]]),
        1: matrix(context, [[0]]),
        2: matrix(context, [[3]]),
    }
    before = {p: P.encode_matrix(a) for p, a in left.items()}
    result = E.laurent_product(left, right, guard=lambda: None)
    expected = {
        -1: matrix(context, [[x * z]]),
        0: matrix(context, [[0]]),
        1: matrix(context, [[3 * x + 2 * z]]),
        2: matrix(context, [[0]]),
        3: matrix(context, [[6]]),
    }
    assert list(result) == [-1, 0, 1, 2, 3]
    for power in expected:
        assert_matrix(result[power], expected[power])
    replay = replay_runner.laurent_product(
        {p: independent(a) for p, a in left.items()},
        {p: independent(a) for p, a in right.items()},
    )
    assert replay == {p: independent(a) for p, a in expected.items()}
    assert {p: P.encode_matrix(a) for p, a in left.items()} == before
    # Spatial coordinate z is inside QQ[x,y,z]; Laurent power is a separate key.
    assert independent(result[-1]) == [[{(1, 0, 1): F(1)}]]


def test_physical_bridge_two_sided_scaled_inverse_keeps_zero_extreme_powers(
    context, replay_runner
):
    x, y, _ = context["ring"].gens
    r = x * x + y * y + 3
    scaled_eye = matrix(context, [[r, 0], [0, r]])
    nil = matrix(context, [[0, x], [0, 0]])
    zero = matrix(context, [[0, 0], [0, 0]])
    forward = {-1: zero.copy(), 0: scaled_eye, 1: nil}
    reverse = {-1: zero.copy(), 0: scaled_eye.copy(), 1: -nil}
    for left, right in ((forward, reverse), (reverse, forward)):
        residual = E.inverse_residual(left, right, r * r, guard=lambda: None)
        assert list(residual) == [-2, -1, 0, 1, 2]
        for coefficient in residual.values():
            assert_zero(coefficient)
        product = replay_runner.laurent_product(
            {p: independent(a) for p, a in left.items()},
            {p: independent(a) for p, a in right.items()},
        )
        reference = replay_runner.verify_identity(
            product, independent(matrix(context, [[r * r]]))[0][0], range(-2, 3), (2, 2)
        )
        assert all(not cell for a in reference.values() for row in a for cell in row)


def test_physical_bridge_left_and_right_noncommuting_defects_remain_distinct(context):
    left = {0: matrix(context, [[1, 1], [0, 1]])}
    right = {0: matrix(context, [[1, 0], [1, 1]])}
    one = context["ring"].one
    lr = E.inverse_residual(left, right, one, guard=lambda: None)
    rl = E.inverse_residual(right, left, one, guard=lambda: None)
    assert_matrix(lr[0], matrix(context, [[1, 1], [1, 0]]))
    assert_matrix(rl[0], matrix(context, [[0, 1], [1, 1]]))
    assert P.encode_matrix(lr[0]) != P.encode_matrix(rl[0])


@pytest.mark.parametrize("bad", ["empty", "bool-power", "float-power", "gap", "shape"])
def test_physical_bridge_producer_and_replay_refuse_invalid_series(
    context, replay_runner, bad
):
    one = matrix(context, [[1]])
    series = {0: one}
    if bad == "empty":
        series = {}
    elif bad == "bool-power":
        series = {False: one}
    elif bad == "float-power":
        series = {0.0: one}
    elif bad == "gap":
        series = {-1: one, 1: one}
    else:
        series[1] = matrix(context, [[1, 0]])
    with pytest.raises(ValueError):
        E.laurent_product(series, {0: one}, guard=lambda: None)
    with pytest.raises(ValueError):
        replay_runner.laurent_product(
            {p: independent(a) for p, a in series.items()}, {0: independent(one)}
        )


@pytest.mark.parametrize("bad", [0, 1.0, True, F(1, 2)])
def test_physical_bridge_raw_nonpolynomial_coefficients_are_refused(context, bad):
    valid = matrix(context, [[1]])
    invalid = np.array([[bad]], dtype=object)
    with pytest.raises(ValueError):
        E.laurent_product({0: invalid}, {0: valid}, guard=lambda: None)


@pytest.mark.parametrize(
    "operation", ["product", "inverse", "replay-product", "replay-identity"]
)
def test_physical_bridge_deadline_callback_propagates(
    context, replay_runner, operation
):
    one = matrix(context, [[1]])
    with pytest.raises(StopControl, match="owned control interruption"):
        if operation == "product":
            E.laurent_product({0: one}, {0: one}, guard=stop)
        elif operation == "inverse":
            E.inverse_residual({0: one}, {0: one}, context["ring"].one, guard=stop)
        elif operation == "replay-product":
            replay_runner.laurent_product(
                {0: independent(one)}, {0: independent(one)}, guard=stop
            )
        else:
            replay_runner.verify_identity(
                {0: independent(one)}, {(0, 0, 0): F(1)}, [0], (1, 1), guard=stop
            )


def test_physical_bridge_replay_requires_all_positive_tc_powers(context, replay_runner):
    zero = independent(matrix(context, [[0]]))
    actual = {p: copy.deepcopy(zero) for p in range(-1, 5)}
    assert replay_runner.require_series(actual, range(-1, 5), (1, 1)) is actual
    for power in (1, 2, 3, 4):
        incomplete = dict(actual)
        del incomplete[power]
        with pytest.raises(ValueError):
            replay_runner.require_series(incomplete, range(-1, 5), (1, 1))
    # A highest-power xyz term vanishes on every coordinate axis but is nonzero.
    actual[4][0][0] = {(1, 1, 1): F(1)}
    with pytest.raises(ValueError, match="nonzero"):
        V.zero_check(actual[4], (1, 1))


def test_physical_bridge_full_slot_matrix_roundtrip_includes_all_zeros(
    context, replay_runner
):
    x, _, _ = context["ring"].gens
    expected = independent(matrix(context, [[0, x], [0, 0]]))
    record = V.encode_matrix(expected)
    assert [entry[:2] for entry in record["entries"]] == [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ]
    assert sum(not entry[2] for entry in record["entries"]) == 3
    assert replay_runner.check_matrix(record, expected, (2, 2), 1) == expected


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero",
        "duplicate",
        "bool-slot",
        "float-exponent",
        "unreduced",
        "degree",
        "coefficient",
    ],
)
def test_physical_bridge_independent_full_slot_parser_rejects_tampering(
    context, replay_runner, change
):
    x, _, _ = context["ring"].gens
    expected = independent(matrix(context, [[0, x], [0, 0]]))
    bad = V.encode_matrix(expected)
    if change == "missing-zero":
        bad["entries"].pop()
    elif change == "duplicate":
        bad["entries"][2] = copy.deepcopy(bad["entries"][1])
    elif change == "bool-slot":
        bad["entries"][0][0] = False
    elif change == "float-exponent":
        bad["entries"][1][2][0][0] = 1.0
    elif change == "unreduced":
        bad["entries"][1][2][0][3:] = ["2", "2"]
    elif change == "degree":
        bad["entries"][1][2][0][0] = 2
    else:
        bad["entries"][1][2][0][3] = "-1"
    with pytest.raises(ValueError):
        replay_runner.check_matrix(bad, expected, (2, 2), 1)


def constant_record():
    return {
        "shape": [2, 3],
        "representation": "sparse-exact-rational-zero-fill",
        "entries": [[0, 2, "-5", "7"], [1, 0, "11", "13"]],
    }


def test_physical_bridge_legacy_parent_sparse_reader_reconstructs_zeros(replay_runner):
    result = replay_runner.constant_matrix(constant_record(), (2, 3))
    assert result == [[{}, {}, {(0, 0, 0): F(-5, 7)}], [{(0, 0, 0): F(11, 13)}, {}, {}]]


@pytest.mark.parametrize(
    "change",
    [
        "shape-bool",
        "coordinate-bool",
        "order",
        "duplicate",
        "zero",
        "unreduced",
        "negative-denominator",
        "float-numerator",
    ],
)
def test_physical_bridge_legacy_parent_sparse_reader_rejects_noncanonical(
    replay_runner, change
):
    bad = constant_record()
    if change == "shape-bool":
        bad["shape"][0] = True
    elif change == "coordinate-bool":
        bad["entries"][0][0] = False
    elif change == "order":
        bad["entries"].reverse()
    elif change == "duplicate":
        bad["entries"].append(bad["entries"][-1][:])
    elif change == "zero":
        bad["entries"][0][2] = "0"
    elif change == "unreduced":
        bad["entries"][0][2:] = ["-10", "14"]
    elif change == "negative-denominator":
        bad["entries"][0][3] = "-7"
    else:
        bad["entries"][0][2] = -5.0
    with pytest.raises(ValueError):
        replay_runner.constant_matrix(bad, (2, 3))


@pytest.fixture(scope="module")
def weight_factors(context):
    # Assignment-only source bridge: no complete Laurent product is built here.
    forward, reverse = context["factors"]()
    r = context["background"].ray_squared
    field = context["field"]
    return tuple(
        {
            p: np.array(
                [[P.polynomial(value * r, field) for value in row] for row in a],
                dtype=object,
            )
            for p, a in series.items()
        }
        for series in (forward, reverse)
    )


@pytest.fixture(scope="module")
def reference_factors(context, replay_runner):
    return replay_runner.reference_factors(context["domain"], guard=lambda: None)


def test_physical_bridge_actual_trace_coefficients_include_offdiagonal_twice(
    context, weight_factors, reference_factors
):
    rw, rwi = weight_factors
    x, _, z = context["ring"].gens
    r = P.polynomial(context["r"], context["field"])
    u00, u01 = F(1596881, 1562500), F(-7827, 62500)
    assert rw[0][41, 20] == 2 * r * x * u00
    assert rw[0][41, 21] == 4 * r * x * u01
    assert rw[0][41, 37] == 2 * r * z
    assert rwi[0][41, 21] == -4 * x * u01
    assert rw[1][41, 41] == r * r
    assert rwi[-1][41, 41] == 1
    for name, series in (("rW", rw), ("rWi", rwi)):
        for power in (-1, 0, 1):
            assert independent(series[power]) == reference_factors[name][power]


def test_physical_bridge_last_physical_coordinates_and_homogeneity_are_retained(
    context, reference_factors
):
    x, y, z = context["ring"].gens
    chi = F(18, 25)
    expected = [
        ("C1", 40, 10, -z),
        ("C1", 37, 5, -z / 2),
        ("C1", 19, 9, -z),
        ("C2", 0, 10, 4 * chi * P.polynomial(context["g"], context["field"])),
    ]
    for name, i, j, value in expected:
        assert (
            reference_factors[name][i][j]
            == independent(matrix(context, [[value]]))[0][0]
        )
    expected_last = 4 * chi * (F(109, 1250) * x - F(3, 50) * y + z)
    assert (
        reference_factors["U"][1][0][40]
        == independent(matrix(context, [[expected_last]]))[0][0]
    )
    for name, degree in (("C1", 1), ("C2", 2)):
        assert len(reference_factors[name]) == 43
        assert all(len(row) == 58 for row in reference_factors[name])
        terms = [
            exponent
            for row in reference_factors[name]
            for cell in row
            for exponent in cell
        ]
        assert terms and all(sum(exponent) == degree for exponent in terms)


@pytest.mark.parametrize("kind", ["determinant", "offdiagonal"])
def test_physical_bridge_actual_compensation_mutation_has_hand_computed_column(
    context, weight_factors, kind
):
    rw, _ = weight_factors
    before = P.encode_matrix(rw[0])
    delta = E.mutate_weight(rw[0], kind=kind)
    x, y, z = context["ring"].gens
    r = P.polynomial(context["r"], context["field"])
    u01 = F(-7827, 62500)
    c1 = matrix(context, [[0] for _ in range(43)])
    # Actual C1 definition-defect column for metric component h_01.
    for k, coordinate in enumerate((x, y, z)):
        c1[20 + 6 * k + 1, 0] = -coordinate / 2
    zero_column = matrix(context, [[0] for _ in range(43)])
    zero_square = matrix(context, [[0] * 43 for _ in range(43)])
    identity = matrix(context, [[int(i == j) for j in range(43)] for i in range(43)])
    result = E.mutation_residual(
        delta[41:42, :].copy(),
        {0: identity, 1: zero_square},
        {0: zero_column, 1: c1, 2: zero_column.copy()},
        matrix(context, [[0]]),
        guard=lambda: None,
    )
    expected = matrix(context, [[0]])
    expected[0, 0] = (2 * r * r if kind == "determinant" else r * x * x) * u01
    assert_matrix(result, expected)
    assert result[0, 0]
    assert P.encode_matrix(rw[0]) == before
    changed = [
        (i, j) for i, row in enumerate(delta) for j, value in enumerate(row) if value
    ]
    if kind == "offdiagonal":
        assert changed == [(41, 21)]
        assert delta[41, 21] == -rw[0][41, 21] / 2
    else:
        assert changed == [(41, j) for j in range(20, 38)]


def test_physical_bridge_mutation_convolution_preserves_both_terms_and_base(context):
    result = E.mutation_residual(
        matrix(context, [[0, 2], [0, 0]]),
        {0: matrix(context, [[1, 0], [1, 1]]), 1: matrix(context, [[0, 0], [3, 0]])},
        {
            0: matrix(context, [[2, 0], [0, 1]]),
            1: matrix(context, [[1, 0], [0, 4]]),
            2: matrix(context, [[0, 0], [0, 0]]),
        },
        matrix(context, [[5, 0], [0, 0]]),
        guard=lambda: None,
    )
    assert_matrix(result, matrix(context, [[19, 8], [0, 0]]))


def zero_image_example(context):
    return {
        "c0": matrix(context, [[0, 0, 0], [1, 0, 0], [0, 1, 0]]),
        "j": matrix(context, [[2, 0, 0], [0, 3, 0], [0, 0, 7]]),
        "d": matrix(context, [[1, 0, 0], [0, 1, 0]]),
        "s": matrix(context, [[1, 0], [0, 1], [0, 0]]),
        "b": matrix(context, [[2, 0], [0, 3]]),
        "ambiguity": matrix(context, [[0, 0, 0], [1, 0, 0], [0, 0, 0]]),
    }


def test_physical_bridge_zero_image_right_section_does_not_invert_full_space(context):
    example = zero_image_example(context)
    result = E.zero_image_residuals(**example, guard=lambda: None)
    assert set(result) == {"top", "map", "section", "transport", "ambiguity"}
    expected_shapes = {
        "top": (1, 3),
        "map": (2, 3),
        "section": (2, 2),
        "transport": (2, 3),
        "ambiguity": (3, 3),
    }
    for name, residual in result.items():
        assert residual.shape == expected_shapes[name]
        assert_zero(residual)
    assert example["ambiguity"][1, 0] == 1
    # Two full-space extensions differ on e0 while agreeing on every image vector.
    extension = matrix(context, [[0, 0, 0], [0, 2, 0], [0, 0, 3]])
    changed = extension + example["ambiguity"]
    assert extension[1, 0] == 0 and changed[1, 0] == 1
    full_section = matrix(context, [[0, 1, 0], [0, 0, 1], [0, 0, 0]])
    full = E.inverse_residual(
        {0: example["c0"]}, {0: full_section}, context["ring"].one
    )
    assert_matrix(full[0], matrix(context, [[-1, 0, 0], [0, 0, 0], [0, 0, 0]]))
    assert E.MATRIX_SPECS["D39"] == (39, 58, 0)
    assert E.MATRIX_SPECS["S39"] == (58, 39, 0)
    assert E.MATRIX_SPECS["zero_top_residual"] == (4, 58, 0)


@pytest.mark.parametrize("change", ["top", "map", "section", "transport", "ambiguity"])
def test_physical_bridge_zero_image_defects_are_saved_as_complete_nonzero_residuals(
    context, change
):
    example = zero_image_example(context)
    if change == "top":
        example["c0"][0, 2] = context["ring"].one
    elif change == "map":
        example["c0"][1, 2] = context["ring"].one
    elif change == "section":
        example["s"][0, 0] = context["ring"].zero
    elif change == "transport":
        example["b"][0, 1] = context["ring"].one
    else:
        example["ambiguity"][1, 1] = context["ring"].one
    result = E.zero_image_residuals(**example, guard=lambda: None)
    assert any(value for row in result[change] for value in row)
    assert set(result) == {"top", "map", "section", "transport", "ambiguity"}
    for coefficient in result.values():
        record = P.encode_matrix(coefficient)
        assert len(record["entries"]) == coefficient.shape[0] * coefficient.shape[1]


@pytest.mark.parametrize("change", ["full-rank", "section-shape", "ambiguity-shape"])
def test_physical_bridge_zero_image_shape_contract_cannot_claim_full43_inverse(
    context, change
):
    example = zero_image_example(context)
    if change == "full-rank":
        example["d"] = example["c0"].copy()
    elif change == "section-shape":
        example["s"] = example["s"][:2].copy()
    else:
        example["ambiguity"] = example["ambiguity"][:2, :2].copy()
    with pytest.raises(ValueError):
        E.zero_image_residuals(**example, guard=lambda: None)


@pytest.mark.parametrize(
    "operation", ["stage", "zero-image", "context", "reference-check"]
)
def test_physical_bridge_source_stage_and_inner_guards_propagate(
    context, replay_runner, operation
):
    one = matrix(context, [[1]])
    with pytest.raises(StopControl):
        if operation == "stage":
            E.laurent_product({0: one}, {0: one}, stage=lambda power: stop())
        elif operation == "zero-image":
            E.zero_image_residuals(**zero_image_example(context), guard=stop)
        elif operation == "context":
            E.build_context(guard=stop)
        else:
            replay_runner.laurent_product(
                {0: independent(one)}, {0: independent(one)}, check=stop
            )


@pytest.mark.parametrize(
    "source_name",
    [
        "scripts/nr_constraint_full_symbol.py",
        "scripts/nr_constraint_laurent_energy.py",
        "scripts/nr_constraint_exact_coefficients.py",
        "scripts/nr_profile_exact_coefficients.py",
    ],
)
def test_physical_bridge_source_hash_refuses_even_parseable_drift(source_name):
    raw = (ROOT / source_name).read_bytes()
    E.verify_source(raw, source_name)
    with pytest.raises(ValueError, match="SHA"):
        E.verify_source(raw + b"\n# locally altered formula source\n", source_name)
    with pytest.raises(ValueError):
        E.verify_source(raw.decode("utf-8"), source_name)


@pytest.mark.parametrize(
    "source_name",
    [
        "scripts/nr_constraint_full_symbol.py",
        "scripts/nr_constraint_laurent_energy.py",
        "scripts/nr_constraint_exact_coefficients.py",
    ],
)
def test_physical_bridge_ast_keeps_every_formula_except_registered_adaptations(
    source_name,
):
    raw = (ROOT / source_name).read_bytes()
    translated, audit = E.translated_ast(raw, source_name)
    names = {
        "scripts/nr_constraint_full_symbol.py": ("source", "physical_coefficients"),
        "scripts/nr_constraint_laurent_energy.py": ("factors", "bridge"),
        "scripts/nr_constraint_exact_coefficients.py": (
            "zeros",
            "eye",
            "ode_projector",
        ),
    }[source_name]
    original = ast.parse(raw.decode("utf-8"))
    expected = [
        copy.deepcopy(node)
        for node in original.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    assert tuple(node.name for node in expected) == names
    expected_operations = []
    for function in expected:
        if source_name != E.CONSTRAINT_SOURCE:
            # The first statement is a docstring; only the known concrete type
            # guard is removed for rational-function background substitution.
            guard = function.body.pop(1)
            assert isinstance(guard, ast.If)
            assert ast.unparse(guard.test) == "not isinstance(background, Q.Background)"
            expected_operations.append((function.name, "remove-background-type-guard"))
        if function.name == "source":
            function.body[-1] = ast.parse("return answer").body[0]
            expected_operations.append(
                (function.name, "remove-fraction-output-validation")
            )
        elif function.name == "physical_coefficients":
            function.body[-1] = ast.parse("return tuple(c for c in (c0, c1, c2))").body[
                0
            ]
            expected_operations.append(
                (function.name, "remove-fraction-output-validation")
            )
        elif function.name == "factors":
            matching = [
                node
                for node in ast.walk(function)
                if isinstance(node, ast.BinOp) and ast.unparse(node) == "r * low"
            ]
            assert len(matching) == 1
            matching[0].left, matching[0].right = matching[0].right, matching[0].left
            expected_operations.append(
                (function.name, "commute-exact-scalar-array-product")
            )
    normalized = ast.Module(body=expected, type_ignores=[])
    assert ast.dump(translated, include_attributes=False) == ast.dump(
        normalized, include_attributes=False
    )
    assert [
        (entry["function"], entry["operation"]) for entry in audit["edits"]
    ] == expected_operations
    assert audit["formula_and_index_bodies_unchanged_except_scalar_commutation"] is True


def test_physical_bridge_source_manifest_is_pure_and_scope_remains_bounded(monkeypatch):
    with monkeypatch.context() as patch:
        patch.setattr(E, "_modules", stop)
        manifest = E.source_bridge_manifest()
    assert manifest["direction_variables"] == ["x", "y", "z"]
    assert manifest["frequency_representation"] == "finite integer Laurent index"
    assert manifest["full_frequency_closure_proved"] is False
    assert manifest["nonlinear_sat_qualified"] is False
    assert manifest["source_hashes"] == E.SOURCE_HASHES
    with pytest.raises(ValueError):
        E.translated_ast((ROOT / E.PROFILE_SOURCE).read_bytes(), E.PROFILE_SOURCE)
    with pytest.raises(ValueError):
        E.verify_source(b"", "unregistered-source.py")


@pytest.fixture(scope="module")
def parent_inputs():
    evidence = ROOT / "tmp/nr-shadow-evidence"
    return {
        name: (evidence / spec["directory"] / spec["path"]).read_bytes()
        for name, spec in E.PARENT_FILES.items()
    }


def test_physical_bridge_archived_parent_binding_is_complete_and_read_free(
    parent_inputs, monkeypatch
):
    with monkeypatch.context() as patch:
        patch.setattr(Path, "read_bytes", lambda path: stop())
        manifest = E.parent_provenance_manifest(parent_inputs)
    assert set(manifest["input_hashes"]) == set(E.PARENT_FILES)
    assert manifest["external_parent_reads"] is False
    assert manifest["old_results_regraded"] is False


@pytest.mark.parametrize("change", ["missing", "hash", "wrong-type", "extra"])
def test_physical_bridge_archived_parent_mutations_fail_before_arithmetic(
    parent_inputs, change
):
    altered = dict(parent_inputs)
    if change == "missing":
        del altered["D39.json"]
    elif change == "hash":
        altered["S39.json"] += b"\n"
    elif change == "wrong-type":
        altered["energy_gate.json"] = altered["energy_gate.json"].decode("utf-8")
    else:
        altered["replacement.json"] = b"{}"
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(altered)


@pytest.mark.parametrize("change", ["output-validator", "scalar-storage-order"])
def test_physical_bridge_unsupported_ast_adaptation_is_independently_refused(
    monkeypatch, change
):
    if change == "output-validator":
        source_name = E.PHYSICAL_SOURCE
        old, new = b"return R.exact_array(answer)", b"return R.exact_array(answer + 1)"
    else:
        source_name = E.LAURENT_SOURCE
        old, new = b"1: r * low", b"1: low * r"
    raw = (ROOT / source_name).read_bytes()
    assert raw.count(old) == 1
    altered = raw.replace(old, new, 1)
    with pytest.raises(ValueError, match="SHA"):
        E.translated_ast(altered, source_name)
    # Isolate the structural adaptation gate after independently checking that
    # the real source-hash gate rejects these bytes. No altered code executes.
    with monkeypatch.context() as patch:
        patch.setattr(E, "verify_source", lambda source, name: None)
        with pytest.raises(ValueError):
            E.translated_ast(altered, source_name)


@pytest.mark.parametrize(
    "change", ["missing-highest-power", "bool-degree", "section-shape"]
)
def test_physical_bridge_registered_support_and_dimensions_refuse_drift(
    monkeypatch, change
):
    with monkeypatch.context() as patch:
        if change == "section-shape":
            bad = copy.deepcopy(E.MATRIX_SPECS)
            bad["S39"] = (58, 43, 0)
            patch.setattr(E, "MATRIX_SPECS", bad)
        else:
            bad = copy.deepcopy(E.FAMILY_CAPS)
            if change == "missing-highest-power":
                del bad["rTC"][4]
            else:
                bad["U"][0] = False
            patch.setattr(E, "FAMILY_CAPS", bad)
        with pytest.raises(ValueError):
            E.source_bridge_manifest()


def test_physical_bridge_first_certificate_sink_failure_stops_before_laurent_products(
    parent_inputs, monkeypatch
):
    observed = []

    def refuse_sink(name, record):
        observed.append(name)
        assert name == "C0"
        assert record["shape"] == [43, 58]
        assert len(record["entries"]) == 43 * 58
        raise StopControl("first certificate sink failed")

    def no_laurent_products(*args, **kwargs):
        raise AssertionError("a failed first sink must stop before Laurent products")

    with monkeypatch.context() as patch:
        patch.setattr(E, "laurent_product", no_laurent_products)
        with pytest.raises(StopControl, match="first certificate sink failed"):
            E.build_certificate(parent_inputs, guard=lambda: None, sink=refuse_sink)
    assert observed == ["C0"]

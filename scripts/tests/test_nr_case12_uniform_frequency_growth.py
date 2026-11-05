"""Owned exact controls for coefficient bounds and frequency-weighted growth.

Only canonical coefficient scans and small rational counterexamples belong
here. No inherited spectral, projector or energy matrix is rebuilt.
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
    "owned supervisor required before uniform-growth imports"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import nr_case12_uniform_frequency_growth as E  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402


@pytest.fixture(scope="module")
def replay_runner():
    path = ROOT / "scripts/run-nr-k3-case12-uniform-frequency-growth.py"
    spec = importlib.util.spec_from_file_location("owned_uniform_growth_control", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def polynomial_matrix(rows):
    return V.encode_matrix(rows)


def small_record():
    return polynomial_matrix(
        [
            [{(1, 0, 0): F(-3, 2), (0, 2, 0): F(2)}, {}, {(0, 0, 0): F(-7, 3)}],
            [{(1, 1, 1): F(5, 6)}, {(2, 0, 0): F(2, 7), (0, 2, 0): F(-2, 7)}, {}],
        ]
    )


def totals():
    return {
        "norm_J58": F(3),
        "norm_Q0": F(1),
        "norm_Q1": F(2),
        "norm_Q2": F(4),
        "norm_Z_m2": F(0),
        "norm_Z_m1": F(2),
        "norm_Z_0": F(3),
        "norm_T_m1": F(1),
        "norm_T_0": F(2),
        "norm_T_1": F(3),
        "norm_T_2": F(0),
        "norm_Ti_m1": F(2),
        "norm_Ti_0": F(1),
        "norm_Ti_1": F(1),
        "norm_Ti_2": F(2),
    }


class StopControl(RuntimeError):
    pass


def stop(*args, **kwargs):
    raise StopControl("owned uniform-growth interruption")


def test_uniform_growth_small_coefficient_table_has_all_slots_and_hand_sum(
    replay_runner,
):
    source = small_record()
    before = copy.deepcopy(source)
    actual = E.bound_table(source, shape=(2, 3), degree_cap=3)
    expected = {
        "schema": "nr-case12-growth-coefficient-bound-v1",
        "shape": [2, 3],
        "degree_cap": 3,
        "homogeneous_degree": None,
        "entries": [
            [0, 0, "7/2"],
            [0, 1, "0"],
            [0, 2, "7/3"],
            [1, 0, "5/6"],
            [1, 1, "4/7"],
            [1, 2, "0"],
        ],
        "total": "152/21",
        "slots": 6,
        "nonzero_slots": 4,
        "coefficients": 6,
        "max_degree": 3,
        "all_zero": False,
    }
    assert actual == expected
    independent = replay_runner.independent_bound_table(
        source, shape=(2, 3), degree_cap=3
    )
    assert independent == expected
    assert replay_runner.compare_bound(actual, independent) is True
    assert source == before


def test_uniform_growth_axes_vanishing_polynomial_still_contributes_exact_norm(
    replay_runner,
):
    source = polynomial_matrix([[{(1, 1, 1): F(-5, 6)}, {}]])
    for implementation in (E.bound_table, replay_runner.independent_bound_table):
        result = implementation(
            source, shape=(1, 2), degree_cap=3, homogeneous_degree=3
        )
        assert result["entries"] == [[0, 0, "5/6"], [0, 1, "0"]]
        assert result["total"] == "5/6"
        assert result["all_zero"] is False
        assert result["coefficients"] == 1


def test_uniform_growth_zero_matrix_keeps_every_slot_and_empty_degree(replay_runner):
    source = polynomial_matrix([[{}, {}, {}], [{}, {}, {}]])
    for implementation in (E.bound_table, replay_runner.independent_bound_table):
        result = implementation(
            source, shape=(2, 3), degree_cap=2, homogeneous_degree=2
        )
        assert result["entries"] == [[i, j, "0"] for i in range(2) for j in range(3)]
        assert result["total"] == "0"
        assert result["slots"] == 6
        assert result["nonzero_slots"] == result["coefficients"] == 0
        assert result["max_degree"] == -1 and result["all_zero"] is True


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero",
        "duplicate",
        "float-coordinate",
        "bool-exponent",
        "float-coefficient",
        "unreduced",
        "explicit-zero",
        "wrong-variables",
        "bool-shape",
        "degree-overflow",
        "wrong-homogeneity",
        "extra-field",
    ],
)
def test_uniform_growth_actual_coefficient_input_is_complete_and_canonical(
    replay_runner, change
):
    source = small_record()
    homogeneous = None
    if change == "missing-zero":
        source["entries"].pop(1)
    elif change == "duplicate":
        source["entries"][1] = copy.deepcopy(source["entries"][0])
    elif change == "float-coordinate":
        source["entries"][0][0] = 0.0
    elif change == "bool-exponent":
        source["entries"][0][2][0][0] = False
    elif change == "float-coefficient":
        source["entries"][0][2][0][3] = 2.0
    elif change == "unreduced":
        source["entries"][0][2][0][3:] = ["4", "2"]
    elif change == "explicit-zero":
        source["entries"][1][2] = [[0, 0, 0, "0", "1"]]
    elif change == "wrong-variables":
        source["variables"] = ["z", "y", "x"]
    elif change == "bool-shape":
        source["shape"][0] = True
    elif change == "degree-overflow":
        source["entries"][3][2][0][0] = 3
    elif change == "wrong-homogeneity":
        homogeneous = 3
    else:
        source["zero_fill"] = True
    for implementation in (E.bound_table, replay_runner.independent_bound_table):
        with pytest.raises(ValueError):
            implementation(
                source, shape=(2, 3), degree_cap=3, homogeneous_degree=homogeneous
            )


@pytest.mark.parametrize(
    "change",
    [
        "missing-zero",
        "last-slot",
        "total",
        "bool-slots",
        "float-degree",
        "unreduced-total",
        "wrong-zero-flag",
        "extra-field",
    ],
)
def test_uniform_growth_independent_comparison_rejects_saved_table_claims(
    replay_runner, change
):
    source = small_record()
    original = E.bound_table(source, shape=(2, 3), degree_cap=3)
    expected = replay_runner.independent_bound_table(source, shape=(2, 3), degree_cap=3)
    altered = copy.deepcopy(original)
    if change == "missing-zero":
        altered["entries"].pop()
    elif change == "last-slot":
        altered["entries"][-1][2] = "1"
    elif change == "total":
        altered["total"] = "1"
    elif change == "bool-slots":
        altered["slots"] = True
    elif change == "float-degree":
        altered["degree_cap"] = 3.0
    elif change == "unreduced-total":
        altered["total"] = "304/42"
    elif change == "wrong-zero-flag":
        altered["all_zero"] = True
    else:
        altered["sampled_directions"] = 0
    with pytest.raises(ValueError):
        replay_runner.compare_bound(altered, expected)


def test_uniform_growth_rates_and_weighted_constants_match_hand_arithmetic(
    replay_runner,
):
    values = totals()
    before = dict(values)
    expected = {
        "growth58": {
            "schema": "nr-case12-full58-frequency-growth-v1",
            "lower": "1/14",
            "upper": "1/14",
            "upper_global": "1",
            "source_norm": "3",
            "high_rate": "6",
            "zero_rate": "6",
            "rate": "6",
        },
        "growth43": {
            "schema": "nr-case12-physical43-frequency-growth-v1",
            "lower": "1/14",
            "upper": "1/7",
            "cutoff": "1/2",
            "low_rate": "6",
            "high_rate": "28",
            "rate": "28",
        },
        "transform_bounds": {
            "schema": "nr-case12-transform-frequency-bounds-v1",
            "cutoff": "1/2",
            "T_constant": "7",
            "Ti_constant": "8",
            "energy_lower_coefficient": "1/896",
            "energy_upper_coefficient": "7",
            "euclidean_flow_squared_prefactor": "6272",
            "T_power": 1,
            "Ti_power": 2,
            "energy_lower_power": -4,
            "energy_upper_power": 2,
            "euclidean_flow_squared_power": 6,
            "euclidean_flow_power": 3,
            "T2_zero": True,
            "plain_L2_uniform": False,
            "no_derivative_loss": False,
        },
    }
    actual = E.growth_from_totals(values, F(1, 14), F(1, 7))
    assert actual == expected
    assert replay_runner.independent_growth(values, F(1, 14), F(1, 7)) == expected
    assert values == before


@pytest.mark.parametrize(
    "change",
    [
        "missing-t2",
        "extra-total",
        "integer-total",
        "negative-total",
        "float-C58",
        "small-C43",
        "changed-lower",
        "float-cutoff",
        "changed-cutoff",
    ],
)
def test_uniform_growth_growth_inputs_keep_exact_registered_domain(
    replay_runner, change
):
    values = totals()
    c58, c43, lower, cutoff = F(1, 14), F(1, 7), F(1, 14), F(1, 2)
    if change == "missing-t2":
        del values["norm_T_2"]
    elif change == "extra-total":
        values["norm_T_3"] = F(0)
    elif change == "integer-total":
        values["norm_Q0"] = 1
    elif change == "negative-total":
        values["norm_J58"] = F(-1)
    elif change == "float-C58":
        c58 = 1.0
    elif change == "small-C43":
        c43 = F(1, 28)
    elif change == "changed-lower":
        lower = F(1, 13)
    elif change == "float-cutoff":
        cutoff = 0.5
    else:
        cutoff = F(1)
    for implementation in (E.growth_from_totals, replay_runner.independent_growth):
        with pytest.raises(ValueError):
            implementation(values, c58, c43, lower=lower, cutoff=cutoff)


@pytest.mark.parametrize("family", ["T", "Ti"])
def test_uniform_growth_zero_transform_bound_is_not_used_as_a_divisor(
    replay_runner, family
):
    values = totals()
    for suffix in ("m1", "0", "1", "2"):
        values["norm_" + family + "_" + suffix] = F(0)
    for implementation in (E.growth_from_totals, replay_runner.independent_growth):
        with pytest.raises(ValueError):
            implementation(values, F(1, 14), F(1, 7))


def test_uniform_growth_nonzero_quadratic_transform_cannot_enable_linear_weight(
    replay_runner,
):
    values = totals()
    values["norm_T_2"] = F(1)
    for implementation in (E.growth_from_totals, replay_runner.independent_growth):
        result = implementation(values, F(1, 14), F(1, 7))
        assert result["transform_bounds"]["T2_zero"] is False
        assert result["transform_bounds"]["T_power"] == 1


@pytest.mark.parametrize(
    "entry", ["producer-guard", "producer-check", "replay-guard", "replay-check"]
)
def test_uniform_growth_coefficient_scan_interruptions_propagate(replay_runner, entry):
    implementation = (
        E.bound_table
        if entry.startswith("producer")
        else replay_runner.independent_bound_table
    )
    argument = {"guard" if entry.endswith("guard") else "check": stop}
    with pytest.raises(StopControl):
        implementation(small_record(), shape=(2, 3), degree_cap=3, **argument)


def test_uniform_growth_fifteen_registered_tables_scan_all_29250_slots(replay_runner):
    expected = {
        "norm_J58": (58, 58, 0, 0),
        "norm_Q0": (43, 43, 0, 0),
        "norm_Q1": (43, 43, 1, 1),
        "norm_Q2": (43, 43, 2, 2),
        "norm_Z_m2": (43, 43, 2, None),
        "norm_Z_m1": (43, 43, 4, None),
        "norm_Z_0": (43, 43, 5, None),
        "norm_T_m1": (43, 43, 2, None),
        "norm_T_0": (43, 43, 3, None),
        "norm_T_1": (43, 43, 4, None),
        "norm_T_2": (43, 43, 5, None),
        "norm_Ti_m1": (43, 43, 0, None),
        "norm_Ti_0": (43, 43, 2, None),
        "norm_Ti_1": (43, 43, 3, None),
        "norm_Ti_2": (43, 43, 3, None),
    }
    assert E.TABLE_SPECS == expected
    assert E.TABLE_ORDER == tuple(expected)
    slots = 0
    for name, (rows, columns, cap, degree) in expected.items():
        values = [[{} for _ in range(columns)] for _ in range(rows)]
        if name not in ("norm_Z_m2", "norm_T_2"):
            values[-1][-1] = {(degree or 0, 0, 0): F(-2, 3)}
        source = polynomial_matrix(values)
        actual = E.bound_table(
            source, shape=(rows, columns), degree_cap=cap, homogeneous_degree=degree
        )
        independent = replay_runner.independent_bound_table(
            source, shape=(rows, columns), degree_cap=cap, homogeneous_degree=degree
        )
        assert replay_runner.compare_bound(actual, independent) is True
        assert len(actual["entries"]) == rows * columns
        assert actual["entries"][0] == [0, 0, "0"]
        assert actual["entries"][-1] == [
            rows - 1,
            columns - 1,
            "0" if name in ("norm_Z_m2", "norm_T_2") else "2/3",
        ]
        slots += actual["slots"]
    assert slots == 29250


def mutation_inputs():
    j = polynomial_matrix([[{(0, 0, 0): F(-2, 3)}, {(0, 0, 0): F(5, 6)}], [{}, {}]])
    t2 = polynomial_matrix([[{}, {}], [{}, {}]])
    return (
        j,
        t2,
        E.bound_table(j, shape=(2, 2), degree_cap=0, homogeneous_degree=0),
        E.bound_table(t2, shape=(2, 2), degree_cap=5),
    )


def test_uniform_growth_real_input_mutations_are_saved_and_recounted(replay_runner):
    arguments = mutation_inputs()
    before = copy.deepcopy(arguments)
    emitted = {}
    result = E.mutation_witness(
        *arguments,
        guard=lambda: None,
        sink=lambda name, value: emitted.setdefault(name, copy.deepcopy(value)),
    )
    assert list(emitted) == [
        "mutant_J58",
        "norm_mutant_J58",
        "mutant_T2",
        "norm_mutant_T2",
    ]
    assert arguments == before
    assert emitted["mutant_J58"]["entries"][-1] == [1, 1, [[0, 0, 0, "1", "1"]]]
    assert emitted["mutant_J58"]["entries"][:-1] == arguments[0]["entries"][:-1]
    assert emitted["mutant_T2"]["entries"] == [
        [0, 0, [[2, 0, 0, "1", "1"]]],
        [0, 1, []],
        [1, 0, []],
        [1, 1, []],
    ]
    assert emitted["norm_mutant_J58"]["total"] == "5/2"
    assert emitted["norm_mutant_T2"]["total"] == "1"
    assert (
        emitted["norm_mutant_T2"]["nonzero_slots"]
        == emitted["norm_mutant_T2"]["coefficients"]
        == 1
    )
    for family, shape, cap, homogeneous in [
        ("J58", (2, 2), 0, 0),
        ("T2", (2, 2), 5, None),
    ]:
        independent = replay_runner.independent_bound_table(
            emitted["mutant_" + family],
            shape=shape,
            degree_cap=cap,
            homogeneous_degree=homogeneous,
        )
        assert (
            replay_runner.compare_bound(emitted["norm_mutant_" + family], independent)
            is True
        )
    # These are actual changed inputs with freshly scanned tables. Reusing the
    # old J table is invalid even though the changed system has its own bound.
    with pytest.raises(ValueError):
        replay_runner.compare_bound(arguments[2], emitted["norm_mutant_J58"])
    assert result["J"]["name"] == "add-one-to-J58-last-diagonal"
    assert result["J"]["entry"] == [1, 1]
    assert result["J"]["original_slot_zero"] is True
    assert result["J"]["changed_slots"] == 1
    assert result["J"]["total_delta"] == "1"
    assert result["J"]["delta_entries"] == [
        [0, 0, "0"],
        [0, 1, "0"],
        [1, 0, "0"],
        [1, 1, "1"],
    ]
    assert (
        result["J"]["rejected"]
        is result["T2"]["rejected"]
        is result["accepted"]
        is True
    )


@pytest.mark.parametrize("entry", ["guard", "check", "sink"])
def test_uniform_growth_mutation_controls_propagate_early_interruption(entry):
    emitted = []

    def sink(name, value):
        emitted.append(name)
        if entry == "sink":
            stop()

    kwargs = {"sink": sink, "guard": lambda: None}
    if entry != "sink":
        kwargs[entry] = stop
    with pytest.raises(StopControl):
        E.mutation_witness(*mutation_inputs(), **kwargs)
    assert emitted == (["mutant_J58"] if entry == "sink" else [])


@pytest.mark.parametrize("changed", ["J-table", "T2-table"])
def test_uniform_growth_mutation_does_not_trust_stale_baseline_tables(changed):
    arguments = list(mutation_inputs())
    arguments[2 if changed == "J-table" else 3]["entries"][-1][2] = "1"
    with pytest.raises(ValueError):
        E.mutation_witness(*arguments, guard=lambda: None)


def test_uniform_growth_missing_inverse_lower_factor_has_a_real_positive_defect():
    controls = E.reasoning_controls()
    example = controls["missing_inverse_lower"]
    assert example == {
        "H": "1/14",
        "J": "1",
        "state": "1",
        "energy": "1/14",
        "derivative": "1/7",
        "bad_rate": "1/7",
        "residual": "13/98",
        "rejected": True,
    }
    assert F(example["derivative"]) - F(example["bad_rate"]) * F(
        example["energy"]
    ) == F(13, 98)
    values = totals()
    values["norm_J58"] = F(1)
    correct = E.growth_from_totals(values, F(1, 14), F(1, 7))["growth58"]["rate"]
    assert correct == "2"
    assert F(example["derivative"]) == F(correct) * F(example["energy"])


def test_uniform_growth_pullback_energy_cannot_use_a_uniform_euclidean_lower_bound():
    example = E.reasoning_controls()["false_euclidean_lower"]
    assert example == {
        "rho": "2",
        "T": [["2", "0"], ["0", "1/2"]],
        "Ti": [["1/2", "0"], ["0", "2"]],
        "state": ["0", "1"],
        "energy": "1/4",
        "claimed_lower": "1",
        "residual": "-3/4",
        "rejected": True,
    }
    # T has an exact inverse; this alone gives no frequency-independent lower
    # bound of I for T* I T. The actual second basis energy is one quarter.
    assert F(example["T"][0][0]) * F(example["Ti"][0][0]) == 1
    assert F(example["T"][1][1]) * F(example["Ti"][1][1]) == 1
    assert F(example["T"][1][1]) ** 2 == F(example["energy"])
    assert (
        F(example["energy"]) - F(example["claimed_lower"]) == F(example["residual"]) < 0
    )


@pytest.mark.parametrize(
    "value", [True, 1, 0.5, "1.0", "01", "2/2", "-0", "1/0", " 1", "1/02"]
)
def test_uniform_growth_rational_fields_reject_aliases_and_noncanonical_strings(value):
    with pytest.raises(ValueError):
        E.rational(value)


def test_uniform_growth_rational_fields_keep_exact_large_and_signed_values():
    assert E.rational("0") == F(0)
    assert E.rational("-7/3") == F(-7, 3)
    assert E.rational("1/14") == F(1, 14)
    assert E.rational("1000000000000000000000000000000000000001/2") == F(
        1000000000000000000000000000000000000001, 2
    )


def test_uniform_growth_source_bridge_preserves_original_state_and_unevaluated_asts(
    monkeypatch,
):
    monkeypatch.setattr(E, "_module", stop)
    bridge = E.source_bridge_manifest()
    assert bridge["original_state58"] is bridge["original_shift_retained"] is True
    assert bridge["full58_frequency"] == "J58+i*rho*K58(n); n.n=1"
    assert bridge["constraint_frequency"] == "zeta=i*rho; r=1"
    assert bridge["lower_energy"] == "1/14" and bridge["cutoff"] == "1/2"
    assert (
        bridge["full58_state_similarity"]
        is bridge["old_fixed_ray_growth_function_executed"]
        is bridge["original_matrices_rebuilt"]
        is bridge["expanded_energy_computed"]
        is bridge["direction_sampling"]
        is bridge["frequency_sampling"]
        is bridge["geometric"]
        is False
    )
    expected = {
        "scripts/nr_profile_exact_coefficients.py": {
            "normalized",
            "principal_rates",
            "matrix",
        },
        "scripts/nr_constraint_full_symbol.py": {"source", "physical_coefficients"},
        "scripts/nr_constraint_exact_coefficients.py": {"leading", "normalized"},
        "scripts/nr_constraint_laurent_energy.py": {
            "factors",
            "bridge",
            "paired_energy",
            "growth_bounds",
            "normal_coordinates",
        },
    }
    assert set(bridge["bindings"]) == set(expected)
    for path, names in expected.items():
        raw = (ROOT / path).read_bytes()
        E.verify_source(raw, path)
        tree = ast.parse(raw)
        nodes = [
            n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names
        ]
        binding = bridge["bindings"][path]
        assert set(binding["functions"]) == names
        assert binding["edits"] == [] and binding["executed"] is False
        assert (
            binding["ast_sha256"]
            == hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest()
        )
        if path == "scripts/nr_constraint_full_symbol.py":
            source = next(node for node in nodes if node.name == "source")
            assert not any(
                isinstance(node, ast.Attribute)
                and node.attr
                in ("ray", "ray_squared", "shift_ray", "metric_normal_squared")
                for node in ast.walk(source)
            )


@pytest.mark.parametrize(
    "change", ["comment", "source-formula", "unknown-source", "mutable-bytes"]
)
def test_uniform_growth_source_bytes_refuse_formula_or_identity_changes(change):
    path = "scripts/nr_constraint_full_symbol.py"
    raw = (ROOT / path).read_bytes()
    if change == "comment":
        raw += b"\n# unregistered growth source\n"
    elif change == "source-formula":
        tree = ast.parse(raw)
        node = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "source"
        )
        node.body = [ast.Return(value=ast.Constant(value=0))]
        raw = ast.unparse(ast.fix_missing_locations(tree)).encode()
    elif change == "unknown-source":
        path = "scripts/unknown-growth-source.py"
    else:
        raw = bytearray(raw)
    with pytest.raises(ValueError):
        E.verify_source(raw, path)


@pytest.mark.parametrize(
    "change", ["drop-negative-power", "weaken-J-degree", "drop-mutation-output"]
)
def test_uniform_growth_registration_cannot_omit_premises_or_failure_evidence(
    monkeypatch, change
):
    if change == "drop-mutation-output":
        monkeypatch.setattr(
            E,
            "RECORD_ORDER",
            tuple(name for name in E.RECORD_ORDER if name != "mutant_T2"),
        )
    else:
        specs = dict(E.TABLE_SPECS)
        if change == "drop-negative-power":
            del specs["norm_Z_m2"]
        else:
            specs["norm_J58"] = (58, 58, 1, 0)
        monkeypatch.setattr(E, "TABLE_SPECS", specs)
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


def test_uniform_growth_parent_manifest_binds_actual_energy_and_original_source_bytes(
    parent_inputs, monkeypatch
):
    assert len(parent_inputs) == 72
    assert (
        E.PARENT_FILES["J58.json"]["sha256"]
        == "19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b"
    )
    assert (
        E.PARENT_FILES["K58.json"]["sha256"]
        == "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283"
    )
    assert (
        E.PARENT_FILES["energy43_bounds.json"]["sha256"]
        == "476c0141567c4b8ec8dd04423f68b934bb0b8d33975c4054d209731447ec17ca"
    )
    assert (
        E.PARENT_FILES["energy58_bounds.json"]["sha256"]
        == "9359dc3a5b36e6ed267a88a31eb3198b1e1fc163d723814faf96251706f0a607"
    )

    def forbid_read(*args, **kwargs):
        raise AssertionError("parent bytes manifest attempted external access")

    monkeypatch.setattr(Path, "read_bytes", forbid_read)
    monkeypatch.setattr(E, "_module", stop)
    parent = E.parent_provenance_manifest(parent_inputs)
    assert parent["input_hashes"] == {
        name: hashlib.sha256(raw).hexdigest() for name, raw in parent_inputs.items()
    }
    assert parent["external_parent_reads"] is False
    assert parent["parent_matrices_rebuilt"] is False


@pytest.mark.parametrize(
    "change",
    ["missing-highest-Z", "altered-upper", "mutable-J", "wrong-main-principal"],
)
def test_uniform_growth_parent_input_drift_is_refused(parent_inputs, change):
    supplied = dict(parent_inputs)
    if change == "missing-highest-Z":
        del supplied["Z__p_6.json"]
    elif change == "altered-upper":
        record = json.loads(supplied["energy58_bounds.json"])
        record["upper"] = "1"
        supplied["energy58_bounds.json"] = json.dumps(record).encode()
    elif change == "mutable-J":
        supplied["J58.json"] = bytearray(supplied["J58.json"])
    else:
        supplied["K58.json"] = supplied["Ab.json"]
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(supplied)


@pytest.mark.parametrize(
    "change",
    ["failed-energy43", "incomplete-energy58", "unqualified-reduction", "bad-cleanup"],
)
def test_uniform_growth_parent_status_is_checked_after_process_local_hash_injection(
    parent_inputs, monkeypatch, change
):
    supplied = dict(parent_inputs)
    key = {
        "failed-energy43": "energy43_gate.json",
        "incomplete-energy58": "energy58_gate.json",
        "unqualified-reduction": "frequency_gate.json",
        "bad-cleanup": "coordinate_gate.json",
    }[change]
    record = json.loads(supplied[key])
    if change == "failed-energy43":
        record["passed"] = False
    elif change == "incomplete-energy58":
        record["completed"] = False
    elif change == "unqualified-reduction":
        record["physical_frequency_reduction_validated"] = False
    else:
        record["supervisor"]["cleanup_verified"] = False
    supplied[key] = json.dumps(record).encode()
    pins = copy.deepcopy(E.PARENT_FILES)
    pins[key]["sha256"] = hashlib.sha256(supplied[key]).hexdigest()
    # Only in-memory pins change, to reach the qualification check independently
    # of the byte-identity gate. Accepted files stay untouched.
    monkeypatch.setattr(E, "PARENT_FILES", pins)
    gates = copy.deepcopy(E.PARENT_GATES)
    gates[pins[key]["directory"]]["gate_sha256"] = pins[key]["sha256"]
    monkeypatch.setattr(E, "PARENT_GATES", gates)
    with pytest.raises(ValueError):
        E.parent_provenance_manifest(supplied)


def energy_parent_records(parent_inputs):
    return [
        json.loads(parent_inputs[name])
        for name in (
            "energy58_bounds.json",
            "energy43_bounds.json",
            "energy58_replay.json",
            "energy43_replay.json",
        )
    ]


def test_uniform_growth_energy_bounds_use_the_actual_accepted_parent_constants(
    parent_inputs,
):
    records = energy_parent_records(parent_inputs)
    actual = E.energy_bounds(*records)
    assert actual == (E.rational(records[0]["upper"]), E.rational(records[1]["upper"]))
    assert all(type(value) is F and value >= F(1, 14) for value in actual)
    assert records[0]["upper"] == records[2]["uniform_upper"]
    assert records[1]["upper"] == records[3]["uniform_upper"]


@pytest.mark.parametrize(
    "change",
    [
        "float-upper",
        "unreduced-upper",
        "changed-sphere",
        "float-denominator-power",
        "below-floor",
        "replay-disagrees",
    ],
)
def test_uniform_growth_energy_parent_interpretation_refuses_noncanonical_or_unproved_bounds(
    parent_inputs, change
):
    records = energy_parent_records(parent_inputs)
    b58, b43, r58, r43 = records
    if change == "float-upper":
        b58["upper"] = r58["uniform_upper"] = 1.0
    elif change == "unreduced-upper":
        b58["upper"] = r58["uniform_upper"] = "2/2"
    elif change == "changed-sphere":
        b58["sphere"] = "r>=1"
    elif change == "float-denominator-power":
        b43["denominator_power"] = 6.0
    elif change == "below-floor":
        b43["upper"] = r43["uniform_upper"] = "1/28"
    else:
        r43["uniform_upper"] = "1/28"
    with pytest.raises(ValueError):
        E.energy_bounds(*records)


def test_uniform_growth_domain_keeps_weighted_frequency_and_zero_image_limits():
    domain = E.domain_metadata()
    assert domain["fixed_case"] == 12 and domain["background"] == "constant"
    assert domain["direction"] == "real unit n; n.n=1"
    assert domain["radial_frequency"] == "rho>=0"
    assert domain["cutoff"] == "1/2"
    assert (
        domain["low_interval"] == "0<=rho<1/2" and domain["high_interval"] == "rho>=1/2"
    )
    assert domain["conjugate_transpose"] is domain["frequency_fixed_in_time"] is True
    assert domain["full58_operator"] == "J58+i*rho*K58(n)"
    assert (
        domain["full58_zero_energy"] == "y*y"
        and domain["full58_global_upper"] == "max(C58,1)"
    )
    assert domain["physical43_low_energy"] == "c*c"
    assert domain["physical43_high_energy"] == "(T*c)*H43(n)*(T*c)"
    assert domain["complete_Z_powers"] == [-2, -1, 0, 1, 2, 3, 4, 5, 6]
    assert domain["complete_T_powers"] == domain["complete_Ti_powers"] == [-1, 0, 1, 2]
    assert (
        domain["T2_required_zero"] is True
        and domain["zero_frequency_reachable_rank"] == 39
    )
    assert (
        domain["full58_state_similarity"]
        is domain["geometric"]
        is domain["zero_frequency_full43_inverse_exists"]
        is domain["laurent_evaluated_at_zero"]
        is domain["physical43_uniform_euclidean_growth_validated"]
        is domain["constraint_derivative_loss_absent_proved"]
        is domain["euclidean_three_derivative_reserve_is_optimal"]
        is domain["variable_background_energy_validated"]
        is domain["actual_nonlinear_rhs_bridge_proved"]
        is domain["boundary_well_posedness_proved"]
        is domain["coefficient_bounds_are_sharp"]
        is domain["stable_timestep_proved"]
        is False
    )


@pytest.mark.parametrize("entry", ["guard", "sink"])
def test_uniform_growth_full_builder_stops_before_any_new_bound_when_control_raises(
    parent_inputs, monkeypatch, entry
):
    emitted = []

    def no_bounds(*args, **kwargs):
        raise AssertionError("continued into new bound after requested early stop")

    def sink(name, record):
        emitted.append(name)
        stop()

    monkeypatch.setattr(E, "bound_table", no_bounds)
    with pytest.raises(StopControl):
        E.build_certificate(
            parent_inputs, guard=stop if entry == "guard" else lambda: None, sink=sink
        )
    assert emitted == ([] if entry == "guard" else ["source_bridge"])

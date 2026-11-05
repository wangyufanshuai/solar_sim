"""Deterministic physical definition-surface identities; no evolution or promotion."""

import ast
from dataclasses import replace
from itertools import permutations
import json
import math
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import curved_constraint_propagation as P
from science.numerical_relativity.spatial_taylor3 import Jet, INDICES, LOOKUP, einsum


def close(actual, expected):
    assert np.max(abs(np.asarray(actual) - expected)) <= P.TOLERANCE


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(index):
        if index not in cache:
            case = P.CASES[index]
            s = P.fixture(*case)
            arrays = P.compare(s, *P.DAMPING[case[3]])
            cache[index] = (s, arrays, P.inspect_arrays(arrays))
        return cache[index]

    return get


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=P.METHOD,
        cases=[],
        native_calls=0,
        definition_surface_only=True,
        **{key: False for key in P.FALSE_FLAGS},
    )
    yield result
    location = os.environ.get("NR_CURVED_CONSTRAINT_ROOT")
    if location:
        with (Path(location) / "curved-constraint-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(22))
def test_registered_curved_physical_identity_and_full58_reference(
    index, probe, observations
):
    state, arrays, report = probe(index)
    case = P.CASES[index]
    location = os.environ.get("NR_CURVED_CONSTRAINT_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(P.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in arrays.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as stream:
                np.save(stream, value, allow_pickle=False)
    observations["cases"].append(
        dict(index=index, fixture=case, damping=P.DAMPING[case[3]], **report)
    )
    for key in ("constraint_rate_error", "pointwise_error", "full58_error"):
        assert report[key] <= P.TOLERANCE, (case, key, report)
    close(arrays["terms"].sum(axis=0), arrays["closed"])
    assert state.gamma.order == 3
    if case[0] != "curved":
        close(arrays["pointwise"], 0.0)
        close(arrays["direct"], 0.0)
        close(arrays["closed"], 0.0)
        close(arrays["full58"], 0.0)
        if case[0] == "static":
            assert report["curvature"] > 1e-5
    else:
        for key in ("curvature", "hamiltonian", "momentum"):
            assert report[key] > 1e-4
        assert abs(state.theta.value) > 1e-3
        assert np.min(abs(state.z.value)) > 1e-3
        assert np.max(abs(state.gamma.derivative(3))) > 1e-3
        assert np.max(abs(state.alpha.derivative(1))) > 1e-2
        assert np.max(abs(state.beta.derivative(1))) > 1e-2
    assert arrays["metric_rate"].shape[0] == 10
    assert arrays["extrinsic_rate"].shape[0] == 4


@pytest.mark.parametrize("axis", range(3))
def test_exact_pure_cubic_derivatives_and_order_tracking(axis):
    x = Jet.coordinate(0.3, axis)
    f = x * x * x
    close(f.value, 0.027)
    for degree, expected in ((1, 0.27), (2, 1.8), (3, 6.0)):
        derivative = f.derivative(degree)
        reference = np.zeros((3,) * degree)
        reference[(axis,) * degree] = expected
        close(derivative, reference)
    assert f.gradient().order == 2 and f.gradient().gradient().order == 1


def test_mixed_third_derivatives_include_factorials_and_commute():
    x, y, z = (Jet.coordinate(0.0, i) for i in range(3))
    f = x * x * x + 2 * x * y * z - 4 * y * y * z
    expected = np.zeros((3, 3, 3))
    expected[0, 0, 0] = 6
    for p in permutations((0, 1, 2)):
        expected[p] = 2
    for p in set(permutations((1, 1, 2))):
        expected[p] = -8
    close(f.derivative(3), expected)
    close(f.derivative(2), 0)


@pytest.mark.parametrize("mode", range(3))
def test_matrix_inverse_product_to_all_third_coefficients(mode):
    s = P.fixture("curved", mode, 1, 0)
    actual = einsum("ij,jk->ik", s.gamma, s.gamma.inverse())
    close(actual.c, Jet.constant(np.eye(3)).c)
    assert not actual.c.flags.writeable


@pytest.mark.parametrize("power", (-1.0, 0.5, 4.0))
def test_scalar_fractional_power_coefficients_from_binomial_formula(power):
    f = Jet.coordinate(2.0, 0).power(power)
    expected = np.zeros(20)
    for n in range(4):
        coefficient = math.prod(power - k for k in range(n)) / math.factorial(n)
        expected[LOOKUP[(n, 0, 0)]] = coefficient * 2 ** (power - n)
    close(f.c, expected)


@pytest.mark.parametrize("invalid", ("shape", "complex", "nan", "order", "empty"))
def test_invalid_taylor_coefficients_rejected(invalid):
    c, order = np.zeros(20), 3
    if invalid == "shape":
        c = np.zeros(19)
    elif invalid == "complex":
        c = np.zeros(20, dtype=complex)
    elif invalid == "nan":
        c[0] = np.nan
    elif invalid == "order":
        order = True
    else:
        c = np.zeros((20, 0))
    with pytest.raises(ValueError):
        Jet(c, order)


@pytest.mark.parametrize("operation", ("gradient", "trim", "variation"))
def test_missing_spatial_derivatives_never_become_known_zeros(operation):
    with pytest.raises(ValueError, match="derivative"):
        if operation == "gradient":
            Jet.constant(1.0, 0).gradient()
        elif operation == "trim":
            Jet.constant(1.0, 1).trim(2)
        else:
            s = P.fixture("flat", 0, 1, 0)
            P.direct_variation(s.gamma, s.extrinsic, s.extrinsic.trim(1), s.extrinsic)


@pytest.mark.parametrize(
    "mutation", ("asymmetric", "negative", "alpha0", "alpha2", "shape", "order")
)
def test_invalid_physical_state_is_rejected_without_projection(mutation):
    state = P.fixture("flat", 0, 1, 0)
    with pytest.raises(ValueError):
        if mutation == "asymmetric":
            c = state.gamma.c.copy()
            c[7, 0, 1] = 1e-3
            replace(state, gamma=Jet(c))
        elif mutation == "negative":
            replace(state, gamma=Jet.constant(-np.eye(3)))
        elif mutation.startswith("alpha"):
            replace(state, alpha=Jet.constant(float(mutation[-1])))
        elif mutation == "shape":
            replace(state, beta=Jet.constant(np.zeros(2)))
        else:
            replace(state, gamma=state.gamma.trim(2))


@pytest.mark.parametrize("c,d", ((0.3, -0.2), (-0.4, 0.1), (0.0, 0.2)))
def test_direct_time_variation_against_exact_homogeneous_scaling(c, d):
    g = Jet.constant(np.array([[1.2, 0.1, 0.0], [0.1, 0.9, 0.04], [0.0, 0.04, 1.1]]))
    k = Jet.constant(
        np.array([[0.1, 0.02, -0.01], [0.02, -0.03, 0.04], [-0.01, 0.04, 0.08]])
    )
    mixed = np.linalg.inv(g.value) @ k.value
    h = np.trace(mixed) ** 2 - np.trace(mixed @ mixed)
    actual = P.direct_variation(g, k, c * g, d * k)
    close(actual, np.r_[2 * (d - c) * h, np.zeros(3)])
    assert abs(h) > 1e-4


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize(
    "mutation", ("lapse-gradient", "covector-shift", "z4-adjustment", "damping")
)
def test_omitted_geometric_and_damping_terms_are_detected(mode, mutation, probe):
    index = P.CASES.index(("curved", mode, 1, 0))
    s, arrays, _ = probe(index)
    term = {"lapse-gradient": 3, "covector-shift": 1, "z4-adjustment": 5}
    if mutation in term:
        corrupted = arrays["closed"] - arrays["terms"][term[mutation]]
    else:
        _, _, extra, data, _, _ = P.physical_rates(s, 0.0, 0.0)
        corrupted, _ = P.subsidiary(s, extra, data)
    assert np.max(abs(corrupted - arrays["direct"])) > 1e-8


@pytest.mark.parametrize("mutation", ("missing", "shape", "dtype", "nonfinite"))
def test_incomplete_or_malformed_saved_comparison_rejected(mutation, probe):
    arrays = {name: a.copy() for name, a in probe(0)[1].items()}
    if mutation == "missing":
        del arrays["inputs"]
    elif mutation == "shape":
        arrays["direct"] = np.zeros(3)
    elif mutation == "dtype":
        arrays["direct"] = np.zeros(4, dtype=np.float32)
    else:
        arrays["direct"][0] = np.inf
    with pytest.raises(ValueError):
        P.inspect_arrays(arrays)


def test_pack_roundtrip_preserves_all_mixed_coefficients():
    assert len(INDICES) == 20 and len(set(INDICES)) == 20
    for case in P.CASES:
        original = P.fixture(*case)
        assert np.array_equal(
            original.packed(), P.State.unpack(original.packed()).packed()
        )
    with pytest.raises(ValueError):
        P.State.unpack(np.zeros((19, 29)))


def test_independent_variation_and_subsidiary_paths_do_not_import_solver():
    tree = ast.parse(Path(P.__file__).read_text(encoding="utf-8"))
    functions = {
        node.name: node for node in tree.body if isinstance(node, ast.FunctionDef)
    }
    forbidden = {
        "compare",
        "physical_rates",
        "subsidiary",
        "evaluate",
        "direct_variation",
    }
    for name in ("direct_variation", "subsidiary"):
        calls = {
            node.func.id
            for node in ast.walk(functions[name])
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
        }
        assert not calls.intersection(forbidden)
        assert not any(
            isinstance(node, (ast.Import, ast.ImportFrom))
            for node in ast.walk(functions[name])
        )
    assert all(
        key in P.FALSE_FLAGS
        for key in ("physical_gate", "live_admission", "scientificPayloadWriteback")
    )

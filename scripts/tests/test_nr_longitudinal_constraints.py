"""Invertible full43 mapping, retained curls, and independent state compatibility."""

import ast
import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import longitudinal_constraint_controls as C

L = C.L


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(case):
        if case not in cache:
            a = C.compare(*case)
            cache[case] = a, C.metrics(a, *case)
        return cache[case]

    return get


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=C.METHOD,
        cases=[],
        native_calls=0,
        integration_steps=0,
        **{key: False for key in C.FALSE_FLAGS},
    )
    yield result
    location = os.environ.get("NR_LONGITUDINAL_ROOT")
    if location:
        with (Path(location) / "observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(27))
def test_full43_derivative_aware_reduction(index, probe, observations):
    case = C.CASES[index]
    a, report = probe(case)
    location = os.environ.get("NR_LONGITUDINAL_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(C.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in a.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as stream:
                np.save(stream, value, allow_pickle=False)
    observations["cases"].append(
        dict(index=index, mode=case[0], wave_index=case[1], **report)
    )
    C.require_gates(report)


@pytest.mark.parametrize("axis", range(3))
def test_cartesian_projectors_preserve_all_eleven_transverse_auxiliary_columns(axis):
    parallel, perpendicular = L.projectors(np.eye(3)[axis])
    expected = np.zeros(43)
    for start, width in L.GROUPS:
        expected[start + axis * width : start + (axis + 1) * width] = 1
    np.testing.assert_array_equal(parallel, np.diag(expected))
    assert np.trace(parallel) == 11
    assert np.trace(perpendicular) == 22
    np.testing.assert_array_equal(parallel @ perpendicular, np.zeros((43, 43)))


@pytest.mark.parametrize("mode", (1, 2))
def test_tangent_shift_moves_old_rA_Jordan_forcing_to_retained_lower_order(mode, probe):
    a, report = probe((mode, 6))
    principal = a["symbol"][L.SYMBOL_POWERS.index(1)]
    lower = a["symbol"][L.SYMBOL_POWERS.index(0)]
    assert abs(report["shift_projection"]) <= C.TOLERANCE
    assert np.max(abs(principal[8:11])) <= C.TOLERANCE
    assert np.linalg.norm(lower[8:11, 8:11]) > 1e-3
    old = C.O.compare(mode, 6, "algebraic-weighted")
    assert np.linalg.norm(old["principal"][8:11]) > 1e-3


@pytest.mark.parametrize("corruption", range(6))
def test_omissions_or_changed_state_map_fail_closed(corruption, probe):
    case = (2, 6)
    original, _ = probe(case)
    a = {key: value.copy() for key, value in original.items()}
    if corruption == 0:
        a["forward"][L.FORWARD_POWERS.index(0), 41] = 0
    elif corruption == 1:
        a["inverse"][L.INVERSE_POWERS.index(0), 0, 0] += 0.01
    elif corruption == 2:
        a["symbol"][L.SYMBOL_POWERS.index(0), 8:11, 42] = 0
    elif corruption == 3:
        a["rows"][L.ROW_POWERS.index(0), 41] = 0
    elif corruption == 4:
        a["longitudinal"][8, 8] += 0.1
    else:
        a["generator"][1, 0, 0] += 0.01
    with pytest.raises(ValueError):
        C.require_gates(C.metrics(a, *case))


@pytest.mark.parametrize("case", range(12))
def test_bad_or_singular_inputs_are_rejected(case):
    q, n = C.P.fixture(0), np.array([1.0, 0, 0])
    with pytest.raises((ValueError, TypeError)):
        if case == 0:
            L.coefficients(q, np.zeros(3))
        elif case == 1:
            L.coefficients(q, [2.0, 0, 0])
        elif case == 2:
            L.coefficients(q, [float("nan"), 0, 0])
        elif case == 3:
            L.coefficients(q, [1j, 0, 0])
        elif case == 4:
            L.coefficients(q, [1.0, 0])
        elif case == 5:
            L.direct(q, n, 0)
        elif case == 6:
            L.direct(q, n, 9)
        elif case == 7:
            L.direct(q, n, True)
        elif case == 8:
            q = q.copy()
            q[11] = 0.01
            L.coefficients(q, n)
        elif case == 9:
            L.pack({99: np.zeros((43, 43), dtype=complex)}, L.FORWARD_POWERS, (43, 43))
        elif case == 10:
            L.unpack(np.zeros((3, 43, 43)), L.FORWARD_POWERS, (43, 43))
        else:
            L.unpack(
                np.full((3, 43, 43), complex(float("nan"))), L.FORWARD_POWERS, (43, 43)
            )


def test_constructor_does_not_fit_a_generator_or_remove_modes():
    tree = ast.parse(Path(L.__file__).read_text(encoding="utf-8"))
    calls = {
        node.func.attr
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
    }
    assert not calls.intersection(
        {"pinv", "lstsq", "svd", "eig", "eigvals", "generator", "closure"}
    )


def test_fixed_coverage_and_scientific_scope():
    assert len(C.CASES) == len(set(C.CASES)) == 27
    assert len(C.SHAPES) == 9
    assert C.CASES == tuple((m, w) for m in range(3) for w in range(9))
    assert "uniform_strong_hyperbolicity_validated" in C.FALSE_FLAGS
    assert "physical_boundary_validated" in C.FALSE_FLAGS
    assert "scientificPayloadWriteback" in C.FALSE_FLAGS

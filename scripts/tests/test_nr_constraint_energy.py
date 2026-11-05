"""Prescribed spectral projectors and candidate energy; no global theorem."""

import ast
import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import constraint_energy_controls as C

E = C.E


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(index):
        if index not in cache:
            a = C.compare(index)
            cache[index] = a, C.metrics(a, index)
        return cache[index]

    return get


@pytest.fixture(scope="session")
def observations():
    result = dict(method=C.METHOD, cases=[], precision_controls=[], native_calls=0, integration_steps=0, **{key: False for key in C.FALSE_FLAGS})
    yield result
    location = os.environ.get("NR_CONSTRAINT_ENERGY_ROOT")
    if location:
        with (Path(location) / "observations.json").open("x", encoding="utf-8") as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(66))
def test_full43_and_full58_projectors_and_energy(index, probe, observations):
    a, report = probe(index)
    location = os.environ.get("NR_CONSTRAINT_ENERGY_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == Path(C.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        for name, value in a.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as stream:
                np.save(stream, value, allow_pickle=False)
    observations["cases"].append(dict(index=index, **report))
    C.require_gates(report)


@pytest.mark.parametrize("mode", range(3))
def test_decimal50_and70_agree_without_eigenvector_fitting(mode, observations):
    report = C.precision_probe(mode)
    observations["precision_controls"].append(report)
    assert report["constraint_relative"] <= C.TOLERANCE
    assert report["full_state_relative"] <= C.TOLERANCE


@pytest.mark.parametrize("node", range(13))
def test_registered_node_crossings_keep_the_ODE_projector_separate(node, probe):
    a, report = probe(27 + 3 * node + 1)
    assert abs(report["target_speed"]) <= C.TOLERANCE
    assert C.S.relative(a["projectors"][node] @ a["ode"], np.zeros((43, 43))) <= C.TOLERANCE
    assert C.S.relative(a["principal"] @ a["projectors"][node], np.zeros((43, 43))) <= C.TOLERANCE
    # Zero-multiplicity prescribed nodes are allowed and remain explicitly recorded.
    assert report["constraint"]["ranks"][node][0] >= 0


@pytest.mark.parametrize("corruption", range(6))
def test_incomplete_modes_or_false_energy_cannot_be_accepted(corruption, probe):
    original, _ = probe(24)
    a = {key: value.copy() for key, value in original.items()}
    if corruption == 0:
        a["projectors"][6, 0, 0] += .01
    elif corruption == 1:
        a["energy"][0, 0] -= 10 * a["energy_eigenvalues"][-1]
        a["energy_eigenvalues"] = np.linalg.eigvalsh(a["energy"])
    elif corruption == 2:
        a["principal"][0, 0] += .01
    elif corruption == 3:
        a["roots"][0] += .001
    elif corruption == 4:
        a["full_projectors"][6, 11, 11] += .01
    else:
        a["leading"][0, 0] += .01
    with pytest.raises(ValueError):
        C.require_gates(C.metrics(a, 24))


@pytest.mark.parametrize("case", range(10))
def test_bad_projector_inputs_are_rejected(case):
    q, n = C.fixture(0)
    roots = E.nodes(q, n)
    matrix, pde, precision = np.eye(43), np.eye(43), 50
    with pytest.raises((ValueError, TypeError)):
        if case == 0:
            matrix = np.eye(42)
        elif case == 1:
            matrix = 1j * matrix
        elif case == 2:
            matrix[0, 0] = np.nan
        elif case == 3:
            pde = np.eye(42)
        elif case == 4:
            roots = roots[:-1]
        elif case == 5:
            roots[:] = 0
        elif case == 6:
            roots[0] -= .1
        elif case == 7:
            precision = 53
        elif case == 8:
            precision = True
        else:
            q[11] = .01
            E.nodes(q, n)
        E.polynomial_projectors(matrix, pde, roots, precision=precision)


def test_energy_constructor_has_no_eigendecomposition_or_closure_fit():
    tree = ast.parse(Path(E.__file__).read_text(encoding="utf-8"))
    calls = {node.func.attr for node in ast.walk(tree) if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)}
    assert not calls.intersection({"svd", "eig", "eigh", "eigvals", "eigvalsh", "pinv", "lstsq", "closure"})


def test_registered_coverage_and_unchanged_scientific_scope():
    assert C.CASES == tuple(range(66))
    assert len(C.SHAPES) == 14
    assert "common_symmetrizer_validated" in C.FALSE_FLAGS
    assert "uniform_strong_hyperbolicity_validated" in C.FALSE_FLAGS
    assert "scientificPayloadWriteback" in C.FALSE_FLAGS

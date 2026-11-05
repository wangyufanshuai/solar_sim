"""Physical/formal basis bridge; no physical admission or evolution."""

import ast
import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import constraint_symbol_controls as S


def close(actual, expected):
    assert np.max(abs(np.asarray(actual) - expected)) <= S.TOLERANCE


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(index):
        if index not in cache:
            arrays = S.compare(*S.CASES[index])
            cache[index] = arrays, S.metrics(arrays)
        return cache[index]

    return get


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=S.METHOD, cases=[], native_calls=0, **{k: False for k in S.FALSE_FLAGS}
    )
    yield result
    location = os.environ.get("NR_CONSTRAINT_SYMBOL_ROOT")
    if location:
        with (Path(location) / "observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(21))
def test_complete_symbol_bridge_and_registered_nonlinear_probes(
    index, probe, observations
):
    arrays, report = probe(index)
    mode, wave_index = S.CASES[index]
    location = os.environ.get("NR_CONSTRAINT_SYMBOL_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(S.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in arrays.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as stream:
                np.save(stream, value, allow_pickle=False)
    observations["cases"].append(
        dict(index=index, mode=mode, wave_index=wave_index, **report)
    )
    S.require_gates(report)
    assert np.array_equal(arrays["cell"], S.P.fixture(mode))
    assert np.array_equal(arrays["wave"], np.array(S.P.WAVES[wave_index]))
    assert np.array_equal(arrays["probes"], S.PROBES)


@pytest.mark.parametrize("channel", range(43))
def test_all_columns_against_qualified_constraint_jet_rhs(channel, probe):
    arrays, _ = probe(S.CASES.index((0, 4)))
    amplitude = np.eye(43, dtype=complex)[channel] / 8
    close(
        S.jet_tangent(arrays["cell"], arrays["wave"], amplitude),
        arrays["symbol"] @ amplitude,
    )


@pytest.mark.parametrize("index", range(21))
def test_triangular_conversion_inverse_and_unchanged_other_rows(index, probe):
    a, _ = probe(index)
    delta = a["transform"] - np.eye(43)
    close(delta @ delta, 0.0)
    close(a["inverse"] @ a["transform"], np.eye(43))
    close(a["inverse"] @ a["formal"], a["physical"])
    close(delta[np.r_[1:5, 8:43]], 0.0)
    close(delta[:, np.r_[0:8, 41:43]], 0.0)


@pytest.mark.parametrize("index", range(21))
def test_compatible_rank_and_formal_operator_identification(index, probe):
    a, report = probe(index)
    expected = 39 if report["zero_frequency"] else 43
    assert report["ranks"] == [[expected] * 3] * 2
    assert (
        S.relative(a["mapped"] @ a["formal"], a["formal"] @ a["generator"])
        <= S.TOLERANCE
    )
    if report["zero_frequency"]:
        close(a["formal"][:4], 0.0)
        close(a["physical"][:4], 0.0)
        assert report["formal_matrix_absolute"] > 1e-8
    else:
        assert report["formal_matrix_relative"] <= S.TOLERANCE


@pytest.mark.parametrize("axis", range(3))
def test_minkowski_physical_H_Z_and_conversion_have_analytic_rows(axis):
    cell, wave = S.P.fixture(0), np.eye(3)[axis]
    rows = S.B.physical_rows(cell, wave)
    transform, _ = S.B.transformation(cell, wave)
    pairs = S.B.PAIRS

    def slot(i, j):
        return pairs.index(tuple(sorted((i, j))))

    hrow = np.zeros(58, dtype=complex)
    hrow[10] = -4
    for j in range(3):
        hrow[slot(j, j)] += 1
    hrow[slot(axis, axis)] -= 1
    close(rows[0], hrow)
    zrows = np.zeros((3, 58), dtype=complex)
    for i in range(3):
        zrows[i, 19 + i] = 0.5
        zrows[i, slot(i, axis)] -= 0.5j
    for j in range(3):
        zrows[axis, slot(j, j)] += 0.25j
    close(rows[5:8], zrows)
    conversion = np.zeros(43, dtype=complex)
    conversion[38 + axis] = 4j
    for j in range(3):
        conversion[20 + 6 * j + slot(axis, j)] += 2j
        conversion[20 + 6 * axis + slot(j, j)] -= 2j
    close(transform[0] - np.eye(43)[0], conversion)
    zconversion = np.zeros(43, dtype=complex)
    for j in range(3):
        zconversion[20 + 6 * j + slot(axis, j)] -= 1
        zconversion[20 + 6 * axis + slot(j, j)] += 0.5
    close(transform[5 + axis] - np.eye(43)[5 + axis], zconversion)


@pytest.mark.parametrize("mode", range(3))
def test_zero_frequency_off_image_difference_is_not_physical_failure(mode, probe):
    a, _ = probe(S.CASES.index((mode, 0)))
    difference = a["mapped"] - a["diagnostic"]
    alpha = np.exp(a["cell"][6])
    close(difference[4, 0], 0.5 * alpha)
    close(difference[5:8, 1:4], alpha * np.eye(3))
    close(difference @ a["formal"], 0.0)
    assert np.max(abs(difference)) > 0.1


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("mutation", ("conversion", "source"))
def test_omitting_conversion_or_full_source_is_detected(mode, mutation, probe):
    a, _ = probe(S.CASES.index((mode, 4)))
    if mutation == "conversion":
        assert np.max(abs(a["physical"] - a["formal"])) > 1e-8
        error = S.relative(
            a["diagnostic"] @ a["physical"], a["physical"] @ a["generator"]
        )
    else:
        incomplete = a["generator"] - S.P.source_matrix(a["cell"])
        error = S.relative(a["symbol"] @ a["physical"], a["physical"] @ incomplete)
    assert error > 1e-8


@pytest.mark.parametrize("bad", (17, 25, 55, "infinite", "complex", "large", "short"))
def test_nonflat_backgrounds_and_invalid_waves_rejected(bad):
    cell, wave = S.P.fixture(0).copy(), np.array([1.0, 0.0, 0.0])
    if isinstance(bad, int):
        cell[bad] = 1e-10
    elif bad == "infinite":
        wave[0] = np.inf
    elif bad == "complex":
        wave = wave.astype(complex)
    elif bad == "large":
        wave[0] = 9
    else:
        wave = wave[:2]
    for method in (S.B.physical_rows, S.B.transformation, S.B.linear_symbol):
        with pytest.raises(ValueError):
            method(cell, wave)


@pytest.mark.parametrize("bad", ("missing", "shape", "nan", "dtype"))
def test_malformed_evidence_rejected(bad, probe):
    a = {k: v.copy() for k, v in probe(0)[0].items()}
    if bad == "missing":
        del a["probes"]
    elif bad == "shape":
        a["physical"] = a["physical"][:-1]
    elif bad == "nan":
        a["rates"][0, 0, 0] = np.nan
    else:
        a["symbol"] = a["symbol"].astype(np.complex64)
    with pytest.raises(ValueError):
        S.metrics(a)


def test_symbol_construction_never_fits_rows_or_calls_reference_rhs(monkeypatch):
    cell, wave = S.P.fixture(1), S.P.WAVES[4]

    def forbidden(*args, **kwargs):
        raise AssertionError("forbidden symbol construction dependency")

    for module, names in (
        (S.P, ("constraint_rows", "generator", "closure", "source_matrix")),
        (S.P.G, ("evaluate",)),
        (S.J.F, ("evaluate",)),
        (np.linalg, ("svd", "pinv", "lstsq")),
    ):
        for name in names:
            monkeypatch.setattr(module, name, forbidden)
    assert S.B.linear_symbol(cell, wave).shape == (43, 43)
    assert S.B.physical_rows(cell, wave).shape == (43, 58)
    assert len(S.B.transformation(cell, wave)) == 2
    tree = ast.parse(Path(S.B.__file__).read_text(encoding="utf-8"))
    forbidden_names = {
        "constraint_rows",
        "generator",
        "closure",
        "source_matrix",
        "svd",
        "pinv",
        "lstsq",
        "evaluate",
    }
    assert not any(
        isinstance(n, ast.Attribute) and n.attr in forbidden_names
        for n in ast.walk(tree)
    )


def test_fixed_coverage_and_original_profile():
    assert len(S.CASES) == len(set(S.CASES)) == 21
    assert S.CASES == tuple((m, w) for m in range(3) for w in range(7))
    assert len(S.P.WAVES) == 7 and S.P.WAVES[0] == (0.0, 0.0, 0.0)
    assert S.PROBES.shape == (4, 43) and np.max(abs(S.PROBES)) < 0.2
    assert S.TOLERANCE == 2e-12

"""Registered Theta/Z forcing controls; no time integration or admission."""

import ast
import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import offsurface_z4_feedback as Q
from science.numerical_relativity.spatial_taylor3 import Jet, einsum as e


def close(a, b):
    assert np.max(abs(np.asarray(a) - b)) <= Q.TOLERANCE


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(i):
        if i not in cache:
            q = Q.fixture(*Q.CASES[i])
            a = Q.compare(q)
            cache[i] = q, a, Q.metrics(a)
        return cache[i]

    return get


@pytest.fixture(scope="session")
def observations():
    record = dict(
        method=Q.METHOD,
        cases=[],
        native_calls=0,
        term_names=Q.TERM_NAMES,
        **{k: False for k in Q.FALSE_FLAGS},
    )
    yield record
    location = os.environ.get("NR_THETA_Z_ROOT")
    if location:
        with (Path(location) / "observations.json").open("x", encoding="utf-8") as f:
            json.dump(record, f, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(132))
def test_registered_theta_z_and_instantaneous43_rates(index, probe, observations):
    q, a, report = probe(index)
    mode, pattern = Q.CASES[index]
    location = os.environ.get("NR_THETA_Z_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(Q.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in a.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as f:
                np.save(f, value, allow_pickle=False)
    observations["cases"].append(
        dict(index=index, mode=mode, pattern=pattern, **report)
    )
    assert (
        max(report[k] for k in ("z4_error", "rates43_error", "bridge_error"))
        <= Q.TOLERANCE
    )
    close(a["baseline_z4"] + a["correction_terms"].sum(axis=0), a["predicted_z4"])
    close(a["rates43"][0, 4:8], a["direct_z4"])
    close(a["rates43"][1, 4:8], a["predicted_z4"])
    assert np.array_equal(q.c, Q.fixture(mode, pattern).c)
    if pattern == "clean":
        close(a["correction_terms"], 0.0)
    if pattern in ("nonunit", "nonunit-mixed"):
        assert abs(a["constraints43"][41]) > 1e-3
        assert abs(a["constraints43"][42]) > 1e-3
    if pattern == "nonunit":
        close(a["constraints43"][8:41], 0.0)


@pytest.mark.parametrize("mode", range(3))
def test_covariant_contracted_variation_matches_raw_coordinates(mode):
    _, h, *_ = Q.P.fields(Q.fixture(mode, "nonunit-mixed"))
    x, y = Jet.coordinate(0.2, 0), Jet.coordinate(-0.1, 1)
    fixed = Jet.constant(
        np.array([[0.2, 0.01, -0.03], [0.01, -0.1, 0.02], [-0.03, 0.02, 0.08]])
    )
    v = (0.3 + 0.04 * x * y) * h + (0.1 + 0.02 * x) * fixed
    close(
        Q.contracted_variation(h, v).value,
        Q.raw_contracted_variation(h.value, h.derivative(1), v.value, v.derivative(1)),
    )


@pytest.mark.parametrize("mode", range(3))
def test_conformal_variation_has_independent_closed_form(mode):
    _, h, *_ = Q.P.fields(Q.fixture(mode, "nonunit"))
    x, y = Jet.coordinate(0.2, 0), Jet.coordinate(-0.1, 1)
    f = 0.12 + 0.08 * x - 0.03 * y
    hi, conn, _ = Q.C.geometry(h)
    target = -2 * f * e("jk,ijk->i", hi, conn) - e("ij,j->i", hi, f.gradient())
    close(Q.contracted_variation(h, 2 * f * h).value, target.value)


@pytest.mark.parametrize("mode", range(3))
def test_pure_trace_feedback_has_exact_five_thirds_coefficient(mode):
    x, y, z = (Jet.coordinate(v, i) for i, v in enumerate(Q.C.POINTS[mode]))
    c = 0.1 + 0.03 * x - 0.02 * y + 0.01 * z
    raw = np.zeros((20, 58))
    raw[0, [0, 3, 5]] = 1.0
    for slot in (11, 14, 16):
        raw[:, slot] = c.c / 3
    a = Q.compare(Jet(raw))
    close(
        a["predicted_z4"] - a["baseline_z4"],
        np.r_[-0.5 * c.value**2, (5 / 3) * c.derivative(1)],
    )
    close(a["direct_z4"], np.r_[-(c.value**2) / 6, c.derivative(1)])


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("term", range(11))
def test_omitting_each_feedback_group_is_detected(mode, term, probe):
    _, a, _ = probe(Q.CASES.index((mode, "nonunit-mixed")))
    broken = a["predicted_z4"] - a["correction_terms"][term]
    assert np.max(abs(a["direct_z4"] - broken)) > 1e-8


@pytest.mark.parametrize("bad", ("order", "shape", "nan", "lapse", "metric", "complex"))
def test_bad_inputs_fail_closed(bad):
    q = Q.fixture(0, "clean")
    raw = q.c.copy()
    with pytest.raises(ValueError):
        if bad == "order":
            Q.corrections(q.trim(2))
        elif bad == "shape":
            Q.corrections(Jet(raw[:, :57]))
        else:
            if bad == "nan":
                raw[3, 50] = np.nan
            elif bad == "lapse":
                raw[0, 6] = 1.0
            elif bad == "metric":
                raw[0, 0] = -1.0
            else:
                raw = raw.astype(complex)
            Q.corrections(Jet(raw))


@pytest.mark.parametrize("bad", ("missing", "shape", "nan", "dtype"))
def test_invalid_evidence_rejected(bad, probe):
    a = {k: v.copy() for k, v in probe(0)[1].items()}
    if bad == "missing":
        del a["inputs"]
    elif bad == "shape":
        a["rates43"] = np.zeros((2, 42))
    elif bad == "nan":
        a["rates43"][0, 0] = np.nan
    else:
        a["rates43"] = a["rates43"].astype(np.float32)
    with pytest.raises(ValueError):
        Q.metrics(a)


def test_fixed_coverage_and_no_full_rhs_subtraction_in_correction():
    assert len(Q.CASES) == len(set(Q.CASES)) == 132
    assert Q.CASES[:126] == Q.P.CASES
    assert len(set(Q.TERM_NAMES)) == 11
    tree = ast.parse(Path(Q.__file__).read_text(encoding="utf-8"))
    for function in (
        n
        for n in tree.body
        if isinstance(n, ast.FunctionDef)
        and n.name in ("corrections", "formal_curvature_z", "contracted_variation")
    ):
        assert not any(
            isinstance(n, ast.Name)
            and n.id in ("G", "R", "raw_contracted_variation", "compare")
            for n in ast.walk(function)
        )


def test_unregistered_case_rejected():
    with pytest.raises(ValueError):
        Q.fixture(3, "nonunit")

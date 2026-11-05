"""Offsurface H/M feedback controls, never an evolution or CPBC claim."""

import ast
import json
import os
from pathlib import Path
import runpy
import numpy as np
import pytest
from science.numerical_relativity import offsurface_physical_feedback as P
from science.numerical_relativity.spatial_taylor3 import Jet, einsum as e


def close(a, b):
    assert np.max(abs(np.asarray(a) - b)) <= P.TOLERANCE


@pytest.fixture(scope="session")
def probe():
    saved = {}

    def get(i):
        if i not in saved:
            q = P.fixture(*P.CASES[i])
            arrays = P.compare(q)
            saved[i] = q, arrays, P.metrics(arrays)
        return saved[i]

    return get


@pytest.fixture(scope="session")
def observations():
    out = dict(
        method=P.METHOD, cases=[], native_calls=0, **{k: False for k in P.FALSE_FLAGS}
    )
    yield out
    location = os.environ.get("NR_OFFSURFACE_ROOT")
    if location:
        with (Path(location) / "observations.json").open("x", encoding="utf-8") as f:
            json.dump(out, f, allow_nan=False, sort_keys=True)


@pytest.mark.parametrize("case", ("exact-cap", "missing", "hash", "over-cap"))
def test_authorized_snapshot_cap_and_preflight_rejection(case):
    runner = runpy.run_path(
        str(
            Path(__file__).resolve().parents[1]
            / "run-nr-k3-offsurface-feedback-controls.py"
        )
    )
    cap, writes = runner["SOURCE_CAP"], []
    assert cap == 8 * 1024**2

    class BudgetSpy:
        def save(self, name, raw):
            writes.append((name, raw))

    payloads = {"first.py": b"a", "second.py": b"b"}
    if case in ("exact-cap", "over-cap"):
        payloads["second.py"] = b"b" * (cap - 1 + (case == "over-cap"))
    table = {name: runner["N"].codec.sha(raw) for name, raw in payloads.items()}
    if case == "missing":
        del payloads["second.py"]
    elif case == "hash":
        table["second.py"] = "0" * 64
    if case == "exact-cap":
        runner["save_checked_payloads"](BudgetSpy(), table, payloads)
        assert writes == [("source-snapshot/" + n, r) for n, r in payloads.items()]
    else:
        with pytest.raises(ValueError):
            runner["save_checked_payloads"](BudgetSpy(), table, payloads)
        assert writes == []


@pytest.mark.parametrize("index", range(126))
def test_complete_registered_feedback_and_independent_rate_derivatives(
    index, probe, observations
):
    q, a, r = probe(index)
    mode, pattern = P.CASES[index]
    location = os.environ.get("NR_OFFSURFACE_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(P.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in a.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as f:
                np.save(f, value, allow_pickle=False)
    observations["cases"].append(dict(index=index, mode=mode, pattern=pattern, **r))
    assert r["identity_error"] <= P.TOLERANCE
    assert r["derivative_probe_error"] <= P.TOLERANCE
    close(a["baseline"] + a["correction"], a["predicted"])
    assert np.array_equal(q.c, P.fixture(mode, pattern).c)
    if pattern == "clean":
        close(a["defects"], 0.0)
        close(a["correction"], 0.0)
    else:
        assert r["defect_max"] > 1e-6
    if isinstance(pattern, int) and pattern >= 25:
        assert abs(a["defects"][pattern - 25]) > 1e-3
        close(np.delete(a["defects"], pattern - 25), 0.0)


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("which", ("metric", "extrinsic"))
def test_covariant_variation_against_raw_product_rules(mode, which):
    s, *_ = P.fields(P.fixture(mode, "mixed"))
    x, y = Jet.coordinate(0.2, 0), Jet.coordinate(-0.1, 1)
    v, w = (0.2 + 0.1 * x) * s.gamma, (0.03 + 0.04 * y) * s.extrinsic
    if which == "metric":
        w = Jet.constant(np.zeros((3, 3)))
    else:
        v = Jet.constant(np.zeros((3, 3)))
    close(
        P.covariant_variation(s.gamma, s.extrinsic, v, w),
        P.C.direct_variation(s.gamma, s.extrinsic, v, w),
    )


@pytest.mark.parametrize("mode", range(3))
def test_curved_uniform_rescaling_has_exact_analytic_variation(mode):
    s, *_ = P.fields(P.fixture(mode, "mixed"))
    h, m, u, _, ricci, mixed, _ = P.C.constraints(s.gamma, s.extrinsic)
    scalar = e("ij,ij->", u, ricci).value
    c, d = 0.3, -0.2
    target = np.r_[-c * scalar + 2 * (d - c) * (h.value - scalar), (d - c) * m.value]
    close(
        P.covariant_variation(s.gamma, s.extrinsic, c * s.gamma, d * s.extrinsic),
        target,
    )
    assert abs(scalar) > 1e-5 and np.max(abs(mixed.value)) > 1e-3


@pytest.mark.parametrize("bad", ("order", "shape", "nan", "lapse", "metric", "complex"))
def test_bad_canonical_inputs_rejected(bad):
    q = P.fixture(0, "clean")
    raw = q.c.copy()
    with pytest.raises(ValueError):
        if bad == "order":
            P.fields(q.trim(2))
        elif bad == "shape":
            P.fields(Jet(raw[:, :57]))
        else:
            if bad == "nan":
                raw[3, 42] = np.nan
            elif bad == "lapse":
                raw[0, 6] = 1.0
            elif bad == "metric":
                raw[0, 0] = -1.0
            else:
                raw = raw.astype(complex)
            P.fields(Jet(raw))


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("omit", ("all", "metric", "extrinsic"))
def test_silently_discarding_offsurface_feedback_is_detected(mode, omit, probe):
    q, a, _ = probe(P.CASES.index((mode, "mixed")))
    s, *_ = P.fields(q)
    v, w = P.physical_fo_rates(q)
    vb, wb, *_ = P.C.physical_rates(s)
    v, w = v - vb, w - wb
    zero = Jet.constant(np.zeros((3, 3)))
    correction = (
        np.zeros(4)
        if omit == "all"
        else P.covariant_variation(
            s.gamma,
            s.extrinsic,
            zero if omit == "metric" else v,
            zero if omit == "extrinsic" else w,
        )
    )
    assert np.max(abs(a["direct"] - a["baseline"] - correction)) > 1e-8


@pytest.mark.parametrize("bad", ("missing", "shape", "nonfinite", "dtype"))
def test_malformed_evidence_is_rejected(bad, probe):
    a = {k: v.copy() for k, v in probe(0)[1].items()}
    if bad == "missing":
        del a["inputs"]
    elif bad == "shape":
        a["correction"] = np.zeros(3)
    elif bad == "nonfinite":
        a["correction"][0] = np.nan
    else:
        a["correction"] = np.zeros(4, dtype=np.float32)
    with pytest.raises(ValueError):
        P.metrics(a)


def test_coverage_and_no_snapshot_polynomial_promotion_in_operator():
    assert len(P.CASES) == 126 and len(set(P.CASES)) == 126
    assert {p for p in P.PATTERNS if isinstance(p, int) and p >= 25} == set(
        range(25, 58)
    )
    tree = ast.parse(Path(P.__file__).read_text(encoding="utf-8"))
    f = next(
        n
        for n in tree.body
        if isinstance(n, ast.FunctionDef) and n.name == "covariant_variation"
    )
    assert not any(
        isinstance(n, ast.Attribute) and n.attr == "direct_variation"
        for n in ast.walk(f)
    )


def test_nonregistered_case_rejected():
    with pytest.raises(ValueError):
        P.fixture(3, "clean")

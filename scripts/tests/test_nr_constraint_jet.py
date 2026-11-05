"""Registered independent constraint-jet controls; no scientific evolution."""

import ast
import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import constraint_jet_controls as J
from science.numerical_relativity.spatial_taylor3 import Jet


def close(a, b):
    assert np.max(abs(np.asarray(a) - b)) <= J.TOLERANCE


@pytest.fixture(scope="session")
def probe():
    cache = {}

    def get(i):
        if i not in cache:
            q = J.Q.fixture(*J.CASES[i])
            a = J.compare(q)
            cache[i] = q, a, J.metrics(a)
        return cache[i]

    return get


@pytest.fixture(scope="session")
def observations():
    record = dict(
        method=J.METHOD,
        cases=[],
        native_calls=0,
        derivative_orders=dict(background=3, hm=1, other=2),
        **{k: False for k in J.FALSE_FLAGS},
    )
    yield record
    location = os.environ.get("NR_CONSTRAINT_JET_ROOT")
    if location:
        with (Path(location) / "observations.json").open("x", encoding="utf-8") as f:
            json.dump(record, f, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(132))
def test_registered_full_state_comparison(index, probe, observations):
    q, arrays, report = probe(index)
    mode, pattern = J.CASES[index]
    location = os.environ.get("NR_CONSTRAINT_JET_ROOT")
    if location:
        root = Path(location).resolve()
        assert (
            root.parent
            == Path(J.__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        for name, value in arrays.items():
            with (root / f"case-{index}-{name}.npy").open("xb") as f:
                np.save(f, value, allow_pickle=False)
    observations["cases"].append(
        dict(index=index, mode=mode, pattern=pattern, **report)
    )
    assert max(report.values()) <= J.TOLERANCE
    assert np.array_equal(q.c, J.Q.fixture(mode, pattern).c)
    background, constraints = J.extract(q)
    assert np.array_equal(arrays["background"], background.fields.c)
    assert np.array_equal(arrays["hm"], constraints.hm.c)
    assert np.array_equal(arrays["extra"], constraints.other.c)


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("pattern", ("clean", "mixed", "nonunit-mixed"))
def test_exact_zero_constraint_jets_on_nonzero_background(mode, pattern):
    background = J.background_from(J.Q.fixture(mode, pattern))
    result = J.F.evaluate(background, J.zero_constraints())
    assert np.array_equal(result["rates"], np.zeros(43))
    for name in ("metric", "extrinsic", "ricci_z", "z_formal", "hessian"):
        assert np.array_equal(result[name].c, np.zeros_like(result[name].c))


@pytest.mark.parametrize("kind", range(7))
@pytest.mark.parametrize("axis", range(3))
def test_flat_derivative_inputs_have_independent_analytic_rates(kind, axis):
    background, constraints, expected = J.analytic_input(kind, axis)
    close(J.F.evaluate(background, constraints)["rates"], expected)


@pytest.mark.parametrize("kind", range(3))
@pytest.mark.parametrize("axis", range(3))
def test_second_derivative_deletion_is_detected(kind, axis):
    background, constraints, expected = J.analytic_input(kind, axis)
    truncated = constraints.other.c.copy()
    truncated[4:] = 0.0
    broken = J.F.Constraints(constraints.hm, Jet(truncated, 2))
    result = J.F.evaluate(background, broken)["rates"]
    assert np.array_equal(result, np.zeros(43))
    assert np.max(abs(expected - result)) > 1e-8
    close(J.F.evaluate(background, constraints)["rates"], expected)


@pytest.mark.parametrize("mode", range(3))
def test_background_does_not_read_omitted_complete_state_fields(mode):
    q = J.Q.fixture(mode, "nonunit-mixed")
    background, constraints = J.extract(q)
    changed = q.c.copy()
    changed[:, 18:22] += 0.02
    changed[:, 25:] -= 0.03
    independent = J.background_from(Jet(changed))
    assert np.array_equal(background.fields.c, independent.fields.c)
    assert np.array_equal(
        J.F.evaluate(background, constraints)["rates"],
        J.F.evaluate(independent, constraints)["rates"],
    )


@pytest.mark.parametrize(
    "bad",
    (
        "background-order",
        "background-shape",
        "metric",
        "lapse",
        "hm-order",
        "hm-shape",
        "other-order",
        "determinant",
    ),
)
def test_malformed_inputs_rejected(bad):
    background, constraints, _ = J.analytic_input(0, 0)
    with pytest.raises(ValueError):
        if bad == "background-order":
            J.F.Background(background.fields.trim(2))
        elif bad == "background-shape":
            J.F.Background(background.fields[:20])
        elif bad in ("metric", "lapse"):
            values = background.fields.c.copy()
            values[0, 0 if bad == "metric" else 6] = -1 if bad == "metric" else 1
            J.F.Background(Jet(values))
        elif bad == "hm-order":
            J.F.Constraints(constraints.hm.trim(0), constraints.other)
        elif bad == "hm-shape":
            J.F.Constraints(constraints.hm[:3], constraints.other)
        elif bad == "other-order":
            J.F.Constraints(constraints.hm, constraints.other.trim(1))
        else:
            values = constraints.other.c.copy()
            values[0, 37] = -1
            J.F.Constraints(constraints.hm, Jet(values, 2))


@pytest.mark.parametrize("bad", ("missing", "shape", "nan", "dtype"))
def test_malformed_evidence_rejected(bad, probe):
    arrays = {k: v.copy() for k, v in probe(0)[1].items()}
    if bad == "missing":
        del arrays["background"]
    elif bad == "shape":
        arrays["hm"] = np.zeros((4, 3))
    elif bad == "nan":
        arrays["rates"][0, 0] = np.nan
    else:
        arrays["rates"] = arrays["rates"].astype(np.float32)
    with pytest.raises(ValueError):
        J.metrics(arrays)


def test_rhs_never_reextracts_constraints_or_calls_complete_state_rhs(monkeypatch):
    background, constraints = J.extract(J.Q.fixture(0, "nonunit-mixed"))

    def forbidden(*args, **kwargs):
        raise AssertionError("forbidden complete-state dependency")

    for module, names in (
        (J.Q.G, ("evaluate",)),
        (J.Q.R, ("evaluate",)),
        (J.Q.C, ("constraints", "physical_rates", "direct_variation")),
        (J.Q.P, ("physical_fo_rates", "fields", "compare", "reference")),
        (J.Q, ("corrections", "compare", "formal_curvature_z")),
        (J, ("extract", "compare")),
    ):
        for name in names:
            monkeypatch.setattr(module, name, forbidden)
    result = J.F.evaluate(background, constraints)
    assert result["rates"].shape == (43,)
    assert np.isfinite(result["rates"]).all()


@pytest.mark.parametrize("channel", range(43))
def test_each_independent_constraint_channel_has_finite_nonzero_response(channel):
    # These are interface probes, not asserted to be physically realizable jets.
    background = J.background_from(J.Q.fixture(0, "nonunit-mixed"))
    before = background.fields.c.copy()
    x, y, z = (Jet.coordinate(0.0, i) for i in range(3))
    polynomial = 0.01 * (1 + x + 2 * y + 3 * z + x * x + x * y + y * z)
    hm, extra = np.zeros((4, 4)), np.zeros((10, 39))
    if channel < 4:
        hm[:, channel] = polynomial.trim(1).c
    else:
        extra[:, channel - 4] = polynomial.trim(2).c
    constraints = J.F.Constraints(Jet(hm, 1), Jet(extra, 2))
    rates = J.F.evaluate(background, constraints)["rates"]
    assert rates.shape == (43,) and np.isfinite(rates).all()
    assert np.max(abs(rates)) > 1e-8
    assert np.array_equal(background.fields.c, before)


def test_fixed_coverage_and_independent_operator_contract():
    assert J.CASES == J.Q.CASES and len(set(J.CASES)) == 132
    assert J.SHAPES["inputs"] == (20, 58)
    assert J.SHAPES["background"] == (20, 21)
    assert J.SHAPES["hm"] == (4, 4) and J.SHAPES["extra"] == (10, 39)
    assert J.SHAPES["rates"] == (2, 43)
    tree = ast.parse(Path(J.F.__file__).read_text(encoding="utf-8"))
    banned = {
        "constraints",
        "physical_rates",
        "physical_fo_rates",
        "direct_variation",
        "raw_contracted_variation",
        "compare",
        "reference",
        "extract",
        "corrections",
    }
    assert not any(
        isinstance(n, ast.Attribute) and n.attr in banned for n in ast.walk(tree)
    )
    assert not any(
        isinstance(n, ast.Name) and n.id in ("Q", "R", "G") for n in ast.walk(tree)
    )

"""Order identities and analytic obstructions, not scientific admission."""

import json
import os
from pathlib import Path
import numpy as np
import pytest
from science.numerical_relativity import constraint_order_controls as C

R = C.R


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
    location = os.environ.get("NR_CONSTRAINT_ORDER_ROOT")
    if location:
        with (Path(location) / "observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("index", range(54))
def test_full_polynomial_normalization_and_registered_witnesses(
    index, probe, observations
):
    case = C.CASES[index]
    a, report = probe(case)
    location = os.environ.get("NR_CONSTRAINT_ORDER_ROOT")
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
        dict(index=index, mode=case[0], wave_index=case[1], scheme=case[2], **report)
    )
    C.require_gates(report)


@pytest.mark.parametrize("wave", range(9))
def test_minkowski_hm_only_has_closed_nondiagonalizable_quotient(wave, probe):
    a, report = probe((0, wave, "hm-only"))
    assert report["jordan_witness_applicable"]
    np.testing.assert_allclose(a["left_rows"][1], -2 * np.eye(43)[42], atol=0, rtol=0)
    assert report["jordan_successor_norm"] == 2
    C.require_gates(report)


@pytest.mark.parametrize("mode,scheme", [(m, s) for m in (1, 2) for s in R.SCHEMES])
def test_shift_tangent_has_a_prespecified_left_Jordan_chain(mode, scheme, probe):
    a, report = probe((mode, 6, scheme))
    assert report["jordan_witness_applicable"]
    assert abs(report["shift_projection"]) <= R.TOLERANCE
    assert np.linalg.norm(a["cell"][7:10]) > 0
    C.require_gates(report)


@pytest.mark.parametrize("wave", range(9))
def test_weighting_algebraic_errors_retains_the_trace_forcing_as_lower_order(
    wave, probe
):
    a, report = probe((0, wave, "algebraic-weighted"))
    assert not report["jordan_witness_applicable"]
    assert np.max(abs(a["principal"][8:11, 42])) == 0
    np.testing.assert_allclose(
        a["graded"][R.POWERS.index(0), 8:11, 42],
        -2 * a["wave"],
        atol=R.TOLERANCE,
        rtol=0,
    )


@pytest.mark.parametrize("case", range(12))
def test_rejects_unregistered_or_singular_inputs(case):
    q, n = C.S.P.fixture(0), np.array([1.0, 0, 0])
    with pytest.raises((ValueError, TypeError)):
        if case == 0:
            R.polynomial(q, np.zeros(3))
        elif case == 1:
            R.polynomial(q, [2.0, 0, 0])
        elif case == 2:
            R.polynomial(q, [float("nan"), 0, 0])
        elif case == 3:
            R.polynomial(q, [1j, 0, 0])
        elif case == 4:
            R.polynomial(q, [1.0, 0])
        elif case == 5:
            R.weights(0, "hm-only")
        elif case == 6:
            R.weights(9, "hm-only")
        elif case == 7:
            R.weights(1, "invented")
        elif case == 8:
            R.grade(np.zeros((2, 43, 43), dtype=complex), "hm-only")
        elif case == 9:
            R.grade(np.full((3, 43, 43), complex(float("nan"))), "hm-only")
        elif case == 10:
            curved = q.copy()
            curved[11] = 0.01
            R.polynomial(curved, n)
        else:
            R.evaluate(np.zeros((7, 42, 43), dtype=complex), 1)


@pytest.mark.parametrize("corruption", range(4))
def test_omitted_terms_cannot_be_promoted_to_a_passing_reduction(corruption, probe):
    case = (2, 6, "algebraic-weighted")
    original, _ = probe(case)
    a = {key: value.copy() for key, value in original.items()}
    if corruption == 0:
        a["lower"][:] = 0
    elif corruption == 1:
        a["principal"][8, 8] += 0.01
    elif corruption == 2:
        a["graded"][R.POWERS.index(2), 0, 0] = 0.01
    else:
        a["raw"][2] *= -1
    with pytest.raises(ValueError):
        C.require_gates(C.metrics(a, *case))


def test_registered_coverage_and_no_admission_flags():
    assert len(C.CASES) == len(set(C.CASES)) == 54
    assert len(R.SCALES) == 5 and len(R.POWERS) == 7
    assert "uniform_strong_hyperbolicity_validated" in C.FALSE_FLAGS
    assert "physical_boundary_validated" in C.FALSE_FLAGS
    assert "scientificPayloadWriteback" in C.FALSE_FLAGS

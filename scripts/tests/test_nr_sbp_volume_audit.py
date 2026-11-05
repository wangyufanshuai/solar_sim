"""Independent closed-form algebra and audit rejection tests, not physics admission."""
from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

AUDIT = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-sbp-volume.py"))


def test_static_minkowski_is_zero_without_calling_production_rhs():
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    rhs, ricci = AUDIT["static_rhs"](q)
    np.testing.assert_array_equal(rhs, np.zeros_like(rhs))
    np.testing.assert_array_equal(ricci, np.zeros_like(ricci))


def test_static_schwarzschild_has_nonzero_curvature_and_traceless_a_rhs():
    q, exact = AUDIT["analytic_state"](17)
    before = q.copy()
    rhs, ricci = AUDIT["static_rhs"](q)
    assert np.max(abs(exact)) > .1
    assert np.max(abs(ricci-exact)) < .03
    np.testing.assert_allclose(rhs[11]+rhs[14]+rhs[16], 0., atol=3.e-17, rtol=0.)
    np.testing.assert_array_equal(q, before)
    for slot in list(range(11))+list(range(19, 28))+list(range(37, 58)):
        np.testing.assert_array_equal(rhs[slot], np.zeros_like(rhs[slot]))


@pytest.mark.parametrize("slot", [1, 2, 4, 7, 11, 17, 18, 19, 22, 28, 37])
def test_nonstatic_fields_cannot_use_static_oracle(slot):
    q, _ = AUDIT["analytic_state"](9)
    q[slot, 0, 0, 0] = .01
    with pytest.raises(ValueError, match="restricted"):
        AUDIT["static_rhs"](q)


@pytest.mark.parametrize("shape", [(57, 9, 9, 9), (58, 9, 9, 10), (58, 8, 8, 8)])
def test_wrong_shape_is_rejected(shape):
    with pytest.raises(ValueError):
        AUDIT["static_rhs"](np.zeros(shape))


@pytest.mark.parametrize("value", [float("nan"), float("inf")])
def test_nonfinite_state_is_rejected(value):
    q, _ = AUDIT["analytic_state"](9)
    q[25, 0, 0, 0] = value
    with pytest.raises(ValueError, match="finite"):
        AUDIT["static_rhs"](q)


@pytest.mark.parametrize("n", [17, 25, 33])
def test_norms_preserve_constant_components_and_count_faces(n):
    result = AUDIT["norms"](np.ones((n, n, n, 2)))
    for norm in result.values():
        assert norm == pytest.approx(1., abs=3.e-14)


def rows():
    return [{"points": n, **{key: dict(core_rms=(2./(n-1))**4,
            whole_sbp_rms=(2./(n-1))**2.5, six_faces_rms=(2./(n-1))**2)
            for key in ("rhs", "ricci_error")}} for n in (17, 25, 33)]


def test_independent_refinement_checks_both_pairs_and_all_regions():
    assert AUDIT["refinement"](rows())["passed"]
    for metric in ("rhs", "ricci_error"):
        for region in AUDIT["REGIONS"]:
            for index in (1, 2):
                values = rows()
                values[index][metric][region] = values[index-1][metric][region]
                assert not AUDIT["refinement"](values)["passed"]
    values = rows()
    values[-1]["rhs"]["core_rms"] = 1.e-15
    assert not AUDIT["refinement"](values)["passed"]
    with pytest.raises(ValueError, match="complete"):
        AUDIT["refinement"](rows()[:-1])


def test_replay_excludes_only_time_and_rejects_numeric_change():
    a = {"seconds": 1., "curved": [{"metric": 1.e-8}], "completed": True}
    b = deepcopy(a)
    b["seconds"] = 7.
    AUDIT["compare_replay"](a, b)
    b["curved"][0]["metric"] += 1.e-20
    with pytest.raises(ValueError, match="replay"):
        AUDIT["compare_replay"](a, b)


def test_empty_or_wrong_scope_is_rejected():
    with pytest.raises(ValueError, match="schema"):
        AUDIT["validate_scope"]({})
    with pytest.raises(ValueError, match="scope"):
        AUDIT["validate_scope"]({"schema": "nr-nonlinear-sbp-volume-campaign-v1", "scope": "physical-boundary"})


@pytest.mark.parametrize("flag", AUDIT["FLAGS"])
def test_promoted_or_missing_flags_are_rejected(flag):
    data = {"schema": "nr-nonlinear-sbp-volume-campaign-v1",
            "scope": "actual-nonlinear-FO-CCZ4-volume-only;no-IBVP-or-new-evolution",
            "completed": True, "volume_gate_passed": True, "errors": [],
            **{key: False for key in AUDIT["FLAGS"]}}
    data[flag] = True
    with pytest.raises(ValueError, match="flags"):
        AUDIT["validate_scope"](data)
    del data[flag]
    with pytest.raises(ValueError, match="flags"):
        AUDIT["validate_scope"](data)


def test_paths_reject_escape_absolute_missing_and_output_overwrite(tmp_path):
    for name in ("../outside.npy", str(tmp_path/"absolute.npy"), "missing.npy"):
        with pytest.raises(ValueError):
            AUDIT["contained_file"](tmp_path, name)
    with pytest.raises(ValueError, match="fresh"):
        AUDIT["fresh_output"](tmp_path/"new.json")
    with pytest.raises(ValueError, match="fresh"):
        AUDIT["fresh_output"](AUDIT["EVIDENCE"]/"nr-k3-sbp-volume-v2-20261008/receipt.json")

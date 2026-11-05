"""Nonlinear volume campaign calculations and fail-closed decision tests."""
from pathlib import Path
import runpy

import numpy as np
import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-sbp-volume.py"))


@pytest.mark.parametrize("n", [9, 17, 25, 33])
def test_independent_dense_matrix_matches_rational_sbp_identity(n):
    matrix = RUN["dense_sbp_matrix"](n, .125)
    diagonal = np.ones(n)*.125
    diagonal[:4] = np.array((17., 59., 43., 49.))*.125/48.
    diagonal[-4:] = diagonal[:4][::-1]
    boundary = np.zeros((n, n))
    boundary[0, 0], boundary[-1, -1] = -1., 1.
    np.testing.assert_allclose(diagonal[:, None]*matrix+matrix.T*diagonal[None, :], boundary, atol=3.e-16, rtol=0.)
    np.testing.assert_allclose(matrix@np.ones(n), 0., atol=3.e-15, rtol=0.)


def fake_rows():
    rows = []
    for n in (17, 25, 33):
        spacing = 2./(n-1)
        errors = {"core_rms": spacing**4, "whole_sbp_rms": spacing**2.5, "six_faces_rms": spacing**2}
        rows.append({"points": n, "spacing": spacing, "rhs": dict(errors), "ricci_error": dict(errors)})
    return rows


def test_scientific_decision_uses_all_regions_and_both_pairs():
    assessment = RUN["assess_curved"](fake_rows())
    assert assessment["passed"]
    assert len(assessment["checks"]) == 12


@pytest.mark.parametrize("metric", ["rhs", "ricci_error"])
@pytest.mark.parametrize("region", ["core_rms", "whole_sbp_rms", "six_faces_rms"])
def test_nonconvergent_region_cannot_be_hidden(metric, region):
    rows = fake_rows()
    rows[-1][metric][region] = rows[0][metric][region]
    assert RUN["assess_curved"](rows)["passed"] is False


def test_subfloor_error_is_inconclusive_not_an_order():
    result = RUN["order_pair"](1.e-13, 1.e-14, .125, .0625)
    assert result["order"] is None and result["measurable"] is False
    rows = fake_rows()
    rows[-1]["rhs"]["core_rms"] = 0.
    assert RUN["assess_curved"](rows)["passed"] is False


def test_incomplete_or_reordered_matrix_is_rejected():
    for rows in (fake_rows()[:-1], fake_rows()[::-1]):
        with pytest.raises(ValueError, match="complete frozen"):
            RUN["assess_curved"](rows)


def test_real_nonlinear_curved_principal_source_decomposition():
    row, q, rhs = RUN["nonlinear_decomposition"]()
    assert row["passed"], row
    assert q.shape == rhs.shape == (58, 9, 9, 9)
    assert max(r["source_max_abs"] for r in row["principal_checks"]) > 1.e-3


def test_real_nonlinear_rhs_approaches_independent_flat_linearization():
    result = RUN["flat_linearization"]()
    assert result["passed"], result


def test_nonperiodic_legacy_fixture_does_not_claim_analytic_gauge_wave():
    state = RUN["legacy_state"]("sommerfeld-proxy", 2)
    assert state.grid.boundary == "sommerfeld"
    assert state.base.metadata["initial_data"] == "synthetic-nonperiodic-legacy-rollback-fixture"
    assert np.max(abs(state.base.shift)) > 0.
    rhs = RUN["fo_ccz4_rhs_3d"](state, boundary_mode="sommerfeld-proxy")
    assert np.all(np.isfinite(rhs.trace_k))


def test_no_output_overwrite_or_path_escape(tmp_path):
    with pytest.raises(ValueError, match="fresh direct"):
        RUN["fresh_output"](tmp_path)
    with pytest.raises(FileExistsError):
        path = tmp_path/"same.npy"
        RUN["save_array"](tmp_path, path.name, np.ones(3))
        RUN["save_array"](tmp_path, path.name, np.zeros(3))
    np.testing.assert_array_equal(np.load(path, allow_pickle=False), np.ones(3))

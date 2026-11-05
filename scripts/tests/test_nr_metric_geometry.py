"""Manufactured controls, declared decisions and retained-failure tests."""
import json
from pathlib import Path
import runpy

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-metric-geometry.py"))
G = R["main"].__globals__


@pytest.mark.parametrize("family", R["FAMILIES"])
def test_analytic_controls_have_consistent_full_tensor_and_ADM_targets(family):
    g, k, ricci, h, momentum = R["controls"](9, family)
    inverse = np.linalg.inv(g)
    mixed = np.einsum("...ij,...jk->...ik", inverse, k)
    scalar = np.einsum("...ij,...ij->...", inverse, ricci)
    target = scalar+np.trace(mixed, axis1=-2, axis2=-1)**2-np.einsum("...ij,...ji->...", mixed, mixed)
    np.testing.assert_allclose(h, target, atol=3.e-16, rtol=0.)
    assert g.shape == k.shape == ricci.shape == (9, 9, 9, 3, 3)
    assert momentum.shape == (9, 9, 9, 3)
    assert np.all(np.linalg.eigvalsh(g) > 0.)
    if family == "flat-shear":
        np.testing.assert_allclose(np.linalg.det(g), 1., rtol=0., atol=7.e-16)
        assert np.ptp(g[..., 0, 1]) > .2
    if family == "schwarzschild":
        assert np.max(abs(ricci)) > .02  # Nonzero spatial tensor despite zero scalar.
    if family == "skew-warped":
        assert np.max(abs(ricci[..., 0, 1])) > .01
        np.testing.assert_array_equal(momentum[0, 0, 0], [-.02, .03, -.01])


@pytest.mark.parametrize("n,family", [(8, "schwarzschild"), (True, "flat-shear"), (9, "unknown")])
def test_bad_control_rejected(n, family):
    with pytest.raises(ValueError):
        R["controls"](n, family)


def fake_rows(order=4.):
    return [dict(family=family, n=n, completed=True,
                 norms={key: {region: (2./(n-1))**order for region in ("whole", "fixed_box")}
                        for key in ("Ricci_error", "H_error")}) for family in R["FAMILIES"] for n in R["GRIDS"]]


def test_frozen_matrix_and_all_24_convergence_decisions():
    assert R["GRIDS"] == (17, 25, 33)
    rows = R["decisions"](fake_rows())
    assert len(rows) == 24 and all(r["passed"] for r in rows)
    assert {r["minimum"] for r in rows} == {2.2, 3.5}
    rows = R["decisions"](fake_rows(1.5))
    assert not any(r["passed"] for r in rows)


def test_unresolved_and_incomplete_are_not_passes():
    rows = fake_rows()
    rows[0]["norms"]["H_error"]["whole"] = 1.e-14
    assert R["decisions"](rows)[2]["passed"] is False
    with pytest.raises(ValueError, match="full analytic"):
        R["decisions"](rows[:-1])
    rows[0]["completed"] = False
    with pytest.raises(ValueError, match="full analytic"):
        R["decisions"](rows)


def test_component_average_norm_and_packed_layout():
    n = 9
    fields = np.broadcast_to([3., 4., 0.], (n, n, n, 3))
    for value in R["norms"](fields, n).values():
        assert abs(value-np.sqrt(25./3)) < 1.e-15
    result = dict(Ricci=np.ones((n, n, n, 3, 3)), R_scalar=np.ones((n,)*3)*2,
                  H_metric_hessian=np.ones((n,)*3)*3, M_metric=np.ones((n, n, n, 3))*4)
    data = R["packed"](result, np.ones((n,)*3)*5)
    assert data.shape == (15, n, n, n)
    np.testing.assert_array_equal(data[:, 0, 0, 0], [1.]*9+[2., 3., 4., 4., 4., 5.])


def test_nonfinite_norm_rejected():
    with pytest.raises(ValueError):
        R["norms"](np.full((9,)*3, np.nan), 9)
    with pytest.raises(FloatingPointError):
        R["norms"](np.full((9,)*3, 1.e300), 9)


def test_failure_retains_attempted_case_and_does_not_overwrite(tmp_path, monkeypatch):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    source, report, parent, evolution = [tmp_path/name for name in ("source.py", "tests.xml", "parent.json", "evolution.json")]
    for path in (source, report, parent, evolution):
        path.write_text("fixture", encoding="utf-8")
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "EVOLUTION", evolution)
    monkeypatch.setitem(G, "RETAINED", {parent: R["sha"](parent), evolution: R["sha"](evolution)})
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "sources", lambda p: ({"source.py": R["sha"](source)}, {"sha256": R["sha"](report)}))

    def fail(*args):
        raise ValueError("injected curvature failure")

    monkeypatch.setitem(G, "metric_constraints", fail)
    output = evidence/"attempt"
    monkeypatch.setattr(G["sys"], "argv", ["study", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert data["completed"] is False and data["cases"][0]["completed"] is False
    assert data["cases"][0]["family"] == "schwarzschild" and data["cases"][0]["n"] == 17
    assert data["errors"] == ["ValueError: injected curvature failure"]
    assert data["evolution_executed"] is False and all(data[k] is False for k in R["S"]["FLAGS"])
    original = (output/"receipt.json").read_bytes()
    with pytest.raises(ValueError, match="fresh"):
        R["main"]()
    assert (output/"receipt.json").read_bytes() == original

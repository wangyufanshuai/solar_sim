"""Analytic/operator and failure controls, not an evolution admission suite."""
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

R = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-static-derivative-study.py"))
G = R["main"].__globals__


def test_frozen_scope_and_exact_cubic_law():
    assert R["GRIDS"] == (9, 13, 17, 25, 33, 49, 65)
    assert R["FAMILIES"] == ("schwarzschild", "nonzero-curvature")
    assert R["FLOOR"] == 2.e-13 and R["SECONDS"] == 180.
    low, high = [R["rational_cubic"](n) for n in (17, 33)]
    assert low["squared_rms_over_h_cubed"] == high["squared_rms_over_h_cubed"]
    assert low["left_six"] == high["left_six"]
    assert low["left_six"][5] == "-11/588"
    assert low["interior_exact"] is True


@pytest.mark.parametrize("n", [9, True, 17.])
def test_bad_rational_grid_rejected(n):
    with pytest.raises(ValueError):
        R["rational_cubic"](n)


@pytest.mark.parametrize("n", R["GRIDS"])
def test_masks_partition_full_template_band_and_fixed_box(n):
    regions = R["masks"](n, 3)
    band, interior = regions["composite_band"], regions["unaffected_interior"]
    assert np.all(band | interior) and not np.any(band & interior)
    assert bool(np.any(regions["fixed_box"] & band)) is (n < 17)
    if n == 9:
        assert not np.any(interior)


def test_regions_report_shares_and_empty_is_not_zero():
    q = np.ones((9,)*3)
    summary = R["summaries"](q, q)
    assert summary["unaffected_interior"] is None
    assert summary["whole"]["rms"] == 1.
    assert summary["composite_band"]["whole_squared_share"] == 1.
    n = 17
    values = np.arange(n**3, dtype=float).reshape((n,)*3)
    summary = R["summaries"](values, np.ones_like(values))
    assert abs(summary["composite_band"]["whole_squared_share"]+summary["unaffected_interior"]["whole_squared_share"]-1.) < 3.e-16
    assert R["summaries"](np.zeros(n), np.ones(n))["whole"]["whole_squared_share"] is None


@pytest.mark.parametrize("field,weights", [(np.ones(9)*np.nan, np.ones(9)), (np.ones(9), np.zeros(9)),
                                         (np.ones((3, 3)), np.ones((3, 3))), (np.ones(9), np.ones(8))])
def test_bad_norm_inputs_rejected(field, weights):
    with pytest.raises(ValueError):
        R["summaries"](field, weights)


def test_nonfinite_squared_norm_rejected():
    with pytest.raises((FloatingPointError, ValueError)):
        R["summaries"](np.ones(9)*1.e300, np.ones(9))


@pytest.mark.parametrize("family", R["FAMILIES"])
@pytest.mark.parametrize("n", [9, 17])
def test_signed_curvature_decomposition(family, n):
    fields, weights, defect = R["curvature_fields"](n, family)
    assert tuple(fields) == R["FIELD_KEYS"]
    assert weights.shape == (n,)*3 and defect <= 2.e-11
    np.testing.assert_allclose(fields["old_error"], fields["analytic_connection_error"]
                               +fields["differentiated_first_error"]+fields["quadratic_first_error"], rtol=0., atol=2.e-11)
    psi, gradient, exact = R["analytic_fields"](n, family)
    assert np.all(psi > 0.) and len(gradient) == 3
    if family == "schwarzschild":
        assert np.all(exact == 0.)
    else:
        assert np.max(abs(exact)) > .1


def test_nonzero_polynomial_curvature_analytic_oracle(monkeypatch):
    n = 17
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    psi = 1.+.01*sum(x*x for x in xyz)
    expected = -.48*psi**(-5)
    monkeypatch.setitem(G, "analytic_fields", lambda *a: (psi, [.02*x for x in xyz], expected))
    fields, _, _ = R["curvature_fields"](n, "nonzero-curvature")
    assert np.max(abs(expected)) > .1
    np.testing.assert_allclose(fields["candidate_D2_error"], 0., atol=6.e-12, rtol=0.)


def test_measurement_floor_does_not_count_as_order():
    assert R["order"](1.e-12, 2.e-13, 2.)["observed_order"] is None
    assert R["order"](None, 1.e-4, 2.)["resolved"] is False
    assert R["order"](16.e-6, 1.e-6, 2.)["observed_order"] == 4.


@pytest.mark.parametrize("a,b,ratio", [(1., -1., 2.), (1., 1., 1.), (True, 1., 2.),
                                     (1., 1., float('inf')), (float('nan'), 1., 2.)])
def test_invalid_error_pair_rejected(a, b, ratio):
    with pytest.raises(ValueError):
        R["order"](a, b, ratio)


def test_guard_uses_original_reserves_and_absolute_deadline(tmp_path, monkeypatch):
    monkeypatch.setattr(G["time"], "perf_counter", lambda: 10.)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda p: SimpleNamespace(free=10*1024**3))
    R["guard"](tmp_path, 10.00001)
    with pytest.raises(ValueError, match="deadline"):
        R["guard"](tmp_path, 10.)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda p: SimpleNamespace(free=(3*1024**3-1) if str(p) == "C:/" else 10*1024**3))
    with pytest.raises(ValueError, match="storage"):
        R["guard"](tmp_path, 20.)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda p: SimpleNamespace(free=10*1024**3 if str(p) == "C:/" else 4*1024**3+32*1024**2-1))
    with pytest.raises(ValueError, match="storage"):
        R["guard"](tmp_path, 20.)


def test_output_cap_includes_headroom(tmp_path, monkeypatch):
    monkeypatch.setattr(G["time"], "perf_counter", lambda: 0.)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda p: SimpleNamespace(free=10*1024**3))
    R["guard"](tmp_path, 10., additional=R["OUTPUT_CAP"]-R["HEADROOM"])
    with pytest.raises(ValueError, match="budget"):
        R["guard"](tmp_path, 10., additional=R["OUTPUT_CAP"]-R["HEADROOM"]+1)


@pytest.mark.parametrize("tag", ["failure", "error", "skipped"])
def test_incomplete_test_report_rejected(tmp_path, tag):
    path = tmp_path/"failed.xml"
    path.write_text(f'<testsuites><testcase classname="x"><{tag}/></testcase></testsuites>', encoding="utf-8")
    with pytest.raises(ValueError, match="green"):
        R["green_tests"](path)


def test_main_preserves_failure_and_refuses_overwrite(tmp_path, monkeypatch):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    source, report, parent, audit = [tmp_path/name for name in ("source.py", "tests.xml", "parent.json", "audit.json")]
    for path in (source, report, parent, audit):
        path.write_text("fixture", encoding="utf-8")
    monkeypatch.setitem(G, "ROOT", tmp_path)
    monkeypatch.setitem(G, "EVIDENCE", evidence)
    monkeypatch.setitem(G, "PARENT", parent)
    monkeypatch.setitem(G, "AUDIT", audit)
    monkeypatch.setitem(G, "RETAINED", {parent: R["sha"](parent), audit: R["sha"](audit)})
    monkeypatch.setitem(G, "guard", lambda *a, **k: None)
    monkeypatch.setitem(G, "sources", lambda p: ({"source.py": R["sha"](source)}, {}, {"sha256": R["sha"](report)}))

    def fail(_parent):
        raise ValueError("injected static oracle failure")

    monkeypatch.setitem(G, "compare_saved", fail)
    output = evidence/"attempt"
    monkeypatch.setattr(G["sys"], "argv", ["study", "--output-directory", str(output), "--test-report", str(report)])
    assert R["main"]() == 1
    receipt = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert receipt["completed"] is False and receipt["evolution_executed"] is False
    assert "injected static oracle failure" in receipt["errors"][0]
    assert all(receipt[k] is False for k in R["FLAGS"])
    before = (output/"receipt.json").read_bytes()
    with pytest.raises(ValueError, match="fresh"):
        R["main"]()
    assert (output/"receipt.json").read_bytes() == before

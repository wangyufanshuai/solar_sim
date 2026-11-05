"""Independent curvature controls and fail-closed receipt auditing."""
from copy import deepcopy
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"))
G = A["main"].__globals__


@pytest.mark.parametrize("n", [9, 13, 17, 33])
def test_dense_second_has_exact_cubic_action(n):
    h = 2./(n-1)
    x = np.linspace(-1., 1., n)
    d2 = A["dense_second"](n, h)
    for power in range(4):
        expected = power*(power-1)*x**max(0, power-2)
        np.testing.assert_allclose(d2@x**power, expected, atol=2.e-12, rtol=0.)


@pytest.mark.parametrize("n,h", [(True, .1), (8, .1), (9, 0.), (9, math.inf)])
def test_bad_second_grid_rejected(n, h):
    with pytest.raises(ValueError):
        A["dense_second"](n, h)


@pytest.mark.parametrize("skew", [False, True])
def test_lower_riemann_exact_warped_jets(skew):
    transform = np.array([[1., .2, -.15], [.3, 1., .1], [-.1, .25, 1.]]) if skew else np.eye(3)
    point = np.array([1.25, 1.75, 2.25])
    u = transform[0]@point
    a, b = .2, -.15
    outer = [np.outer(row, row) for row in transform]
    v, w = np.exp(2*a*u), np.exp(2*b*u)
    g = outer[0]+v*outer[1]+w*outer[2]
    du, ddu = 2*a*v*outer[1]+2*b*w*outer[2], 4*a*a*v*outer[1]+4*b*b*w*outer[2]
    first = np.einsum("a,ij->aij", transform[0], du)
    second = np.einsum("a,b,ij->abij", transform[0], transform[0], ddu)
    expected = -(a*a+b*b)*outer[0]-a*(a+b)*v*outer[1]-b*(a+b)*w*outer[2]
    np.testing.assert_allclose(A["lower_riemann_ricci"](g, first, second), expected, atol=2.e-15, rtol=0.)


@pytest.mark.parametrize("n", [9, 13, 17])
def test_nonlinear_polynomial_coordinates_are_flat(n):
    _x, y, z = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    j = np.broadcast_to(np.eye(3), (n, n, n, 3, 3)).copy()
    j[..., 0, 1], j[..., 0, 2] = .17*z, .17*y
    g = np.einsum("...ai,...aj->...ij", j, j)
    np.testing.assert_allclose(A["geometry"](g, (2./(n-1),)*3), 0., atol=3.e-12, rtol=0.)


@pytest.mark.parametrize("bad", ["shape", "nan", "complex", "negative", "asymmetry"])
def test_bad_jet_fields_fail_closed(bad):
    g, first, second = np.eye(3), np.zeros((3, 3, 3)), np.zeros((3, 3, 3, 3))
    if bad == "shape":
        first = first[0]
    elif bad == "nan":
        second[0, 0, 0, 0] = np.nan
    elif bad == "complex":
        first = first.astype(complex)
    elif bad == "negative":
        g[0, 0] = -1.
    else:
        g[0, 1] = .1
    with pytest.raises(ValueError):
        A["lower_riemann_ricci"](g, first, second)


@pytest.mark.parametrize("family", ["schwarzschild", "flat-shear", "skew-warped"])
def test_independent_dense_curvature_matches_stencil_candidate(family):
    control = runpy.run_path(str(ROOT/"scripts/run-nr-k3-metric-geometry.py"))
    n = 17
    g, k, _exact_r, _h, _m = control["controls"](n, family)
    independent = A["geometry"](g, (2./(n-1),)*3)
    production = control["metric_constraints"](g, k, (2./(n-1),)*3)
    np.testing.assert_allclose(independent, production["Ricci"], atol=2.e-12, rtol=0.)


@pytest.mark.parametrize("perturbed", [False, True])
def test_reconstructed_constraints_retain_nonzero_trace(perturbed):
    runner = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-dual-diagnostics.py"))
    n = 9
    q = A["A"]["initial_slots"](n, perturbed)
    driver = runner["NonlinearSBPCube"](runner["Grid3D"]((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))
    reference = A["A"]["initial_slots"](n)
    independent, anti = A["reconstructed"](q, reference)
    measured = runner["measurements"](driver, q, reference)["measurements"]
    assert A["compare_norms"](independent, measured) <= 2.e-12 and anti <= 2.e-11


@pytest.mark.parametrize("mutation", ["missing-region", "missing-field", "nan", "boolean", "negative", "mismatch"])
def test_corrupt_measured_norms_rejected(mutation):
    expected = {region: dict(H=.1) for region in A["REGIONS"]}
    stored = deepcopy(expected)
    if mutation == "missing-region":
        del stored["corners"]
    elif mutation == "missing-field":
        del stored["whole"]["H"]
    else:
        stored["whole"]["H"] = {"nan": np.nan, "boolean": True, "negative": -1., "mismatch": .10001}[mutation]
    with pytest.raises(ValueError):
        A["compare_norms"](expected, stored)


@pytest.mark.parametrize("mutation", ["extra", "missing", "changed"])
def test_manifest_membership_and_content_are_exact(tmp_path, mutation):
    receipt = tmp_path/"receipt.json"
    receipt.write_text("{}")
    raw = tmp_path/"state.npy"
    raw.write_bytes(b"synthetic state")
    data = dict(artifact_hashes={"state.npy": A["sha"](raw)})
    if mutation == "extra":
        (tmp_path/"extra").write_text("extra")
    elif mutation == "missing":
        data["artifact_hashes"]["absent"] = "0"*64
    else:
        raw.write_bytes(b"changed state")
    with pytest.raises(ValueError):
        A["verify_manifest"](receipt, data)


@pytest.mark.parametrize("mutation", ["none", "live", "source", "cap", "regrade", "identity", "protocol"])
def test_header_cannot_change_source_or_admission(monkeypatch, tmp_path, mutation):
    monkeypatch.setitem(G, "ROOT", tmp_path)
    for name in A["EXTRA"]:
        path = tmp_path/name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("fixture")
    parent = dict(source_after={}, diagnostic_identity={"method": "fixture"})
    sources = {name: A["sha"](tmp_path/name) for name in A["EXTRA"]}
    data = dict(schema="nr-nonlinear-dual-diagnostics-v1", completed=True, errors=[], closure_completed=False,
        regrades_legacy=False, source_before=sources, source_after=sources, parent_sha256=A["PARENT_SHA"],
        evolution_sha256=A["LEGACY_SHA"], protocol_sha256=sources[A["PROTOCOL"]], diagnostic_identity=parent["diagnostic_identity"],
        resource_caps=dict(seconds=2400., output_bytes=96*1024**2, c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2),
        **{k: False for k in A["FLAGS"]})
    if mutation == "none":
        A["check_header"](data, parent)
        return
    if mutation == "live":
        data["runtime_writeback"] = True
    elif mutation == "source":
        data["source_after"] = {}
    elif mutation == "cap":
        data["resource_caps"]["c_reserve"] -= 1
    elif mutation == "regrade":
        data["regrades_legacy"] = True
    elif mutation == "identity":
        data["diagnostic_identity"] = {}
    else:
        data["protocol_sha256"] = "0"*64
    with pytest.raises(ValueError):
        A["check_header"](data, parent)


@pytest.mark.parametrize("mode", ["deadline", "C", "E"])
def test_audit_resource_limits(monkeypatch, mode):
    monkeypatch.setattr(G["time"], "perf_counter", lambda: 180.)
    def free(path):
        low = (mode == "C" and str(path) == "C:/") or (mode == "E" and path == A["ROOT"])
        return SimpleNamespace(free=0 if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", free)
    with pytest.raises(ValueError):
        A["guard"](180. if mode == "deadline" else 181.)

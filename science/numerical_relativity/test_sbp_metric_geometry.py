"""Known non-diagonal tensor jets and ADM constraints; not physical evolution."""
import numpy as np
import pytest

from .sbp_metric_geometry import (constraints_from_slots, identity, metric_constraints,
                                  metric_jets, physical_metric, ricci_from_jets)


def warped_jets(shape=(9, 9, 9)):
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for n in shape), indexing="ij")
    transform = np.array([[1., .2, -.15], [.3, 1., .1], [-.1, .25, 1.]])
    u = sum(transform[0, i]*xyz[i] for i in range(3))
    a, b = .2, -.15
    v, w = np.exp(2*a*u), np.exp(2*b*u)
    tensors = [np.outer(t, t) for t in transform]
    g = tensors[0]+v[..., None, None]*tensors[1]+w[..., None, None]*tensors[2]
    gu = 2*a*v[..., None, None]*tensors[1]+2*b*w[..., None, None]*tensors[2]
    guu = 4*a*a*v[..., None, None]*tensors[1]+4*b*b*w[..., None, None]*tensors[2]
    dg = np.stack([transform[0, i]*gu for i in range(3)], axis=-3)
    ddg = np.stack([np.stack([transform[0, i]*transform[0, j]*guu for j in range(3)], axis=-3)
                     for i in range(3)], axis=-4)
    ricci = -(a*a+b*b)*tensors[0]-a*(a+b)*v[..., None, None]*tensors[1]-b*(a+b)*w[..., None, None]*tensors[2]
    return xyz, g, dg, ddg, ricci, -2*(a*a+b*b+a*b)


def test_exact_anisotropic_nondiagonal_jets_recover_nonzero_tensor_and_scalar():
    _xyz, g, dg, ddg, expected, scalar = warped_jets((2, 3, 4))
    result = ricci_from_jets(g, dg, ddg)
    assert np.max(abs(expected[..., 0, 1])) > .01
    np.testing.assert_allclose(result["ricci"], expected, rtol=0., atol=3.e-16)
    np.testing.assert_allclose(result["scalar"], scalar, rtol=0., atol=3.e-16)
    assert result["ricci_antisymmetry_max"] < 3.e-16


def test_polynomial_coordinate_shear_flat_geometry_and_mixed_derivatives():
    n, shear = 13, .17
    x, y, z = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    jacobian = np.broadcast_to(np.eye(3), (*x.shape, 3, 3)).copy()
    jacobian[..., 0, 1], jacobian[..., 0, 2] = shear*z, shear*y
    metric = np.einsum("...ai,...aj->...ij", jacobian, jacobian)
    before = metric.copy()
    dg, ddg = metric_jets(metric, (1./6,)*3)
    np.testing.assert_allclose(ddg[..., 1, 2, 1, 2], shear**2, rtol=0., atol=1.e-13)
    result = ricci_from_jets(metric, dg, ddg)
    np.testing.assert_allclose(result["ricci"], 0., rtol=0., atol=2.e-12)
    assert np.max(abs(result["connection"])) > .1
    np.testing.assert_array_equal(before, metric)


def test_rectangular_axes_spacings_and_nonzero_constraints():
    shape = (9, 13, 17)
    xyz, metric, _dg, _ddg, _ricci, _scalar = warped_jets(shape)
    coefficient = .02+.01*xyz[0]-.015*xyz[1]+.005*xyz[2]
    extrinsic = coefficient[..., None, None]*metric
    before = extrinsic.copy()
    result = metric_constraints(metric, extrinsic, tuple(2./(n-1) for n in shape))
    np.testing.assert_allclose(result["physical_trace_K"], 3*coefficient, rtol=0., atol=1.e-15)
    np.testing.assert_allclose(result["H_metric_hessian"]-result["R_scalar"], 6*coefficient**2, rtol=0., atol=1.e-15)
    np.testing.assert_allclose(result["M_metric"], np.broadcast_to([-.02, .03, -.01], (*shape, 3)), rtol=0., atol=2.e-14)
    np.testing.assert_array_equal(extrinsic, before)


def test_canonical_adapter_uses_full_trace_even_when_A_not_trace_free():
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    q[11] = .1
    q[14] = .2
    q[16] = -.05
    q[17] = .3
    result = constraints_from_slots(q, (.25,)*3)
    diagonal = np.array([.2, .3, .05])
    np.testing.assert_allclose(result["physical_trace_K"], .55, rtol=0., atol=2.e-16)
    np.testing.assert_allclose(result["H_metric_hessian"], .55**2-np.sum(diagonal**2), rtol=0., atol=2.e-16)
    np.testing.assert_array_equal(result["M_metric"], np.zeros((9, 9, 9, 3)))


def test_constant_nondiagonal_metric_exact_flatness_and_identity():
    metric = np.broadcast_to(np.array([[2., .1, .2], [.1, 1., .05], [.2, .05, 3.]]), (9, 9, 9, 3, 3))
    result = metric_constraints(metric, np.zeros_like(metric), (.25,)*3)
    np.testing.assert_array_equal(result["Ricci"], np.zeros_like(metric))
    np.testing.assert_array_equal(result["H_metric_hessian"], np.zeros((9, 9, 9)))
    for key in ("old_H_replaced", "evolution_connected", "physical_validation", "runtime_writeback"):
        assert identity()[key] is False


@pytest.mark.parametrize("metric", [np.eye(2), np.diag([1., 1., -1.]), np.diag([1., 1., 1.e-10]),
                                    np.eye(3)*np.nan, np.eye(3).astype(complex)*1j, [[1, 1, 0], [0, 1, 0], [0, 0, 1]]])
def test_bad_metric_rejected(metric):
    with pytest.raises(ValueError):
        physical_metric(metric)


def test_mismatched_and_nonsymmetric_jets_rejected():
    _, g, dg, ddg, _, _ = warped_jets((2, 3, 4))
    with pytest.raises(ValueError, match="layout"):
        ricci_from_jets(g, dg[..., 0], ddg)
    broken = ddg.copy()
    broken[..., 0, 1, 0, 0] += 1.e-3
    with pytest.raises(ValueError, match="Hessian"):
        ricci_from_jets(g, dg, broken)
    with pytest.raises(ValueError, match="three spatial"):
        metric_jets(g, (.1, .2))


def test_mixed_derivatives_commute_and_match_exact_jets_interior():
    _, g, exact_first, exact_second, _, _ = warped_jets((17,)*3)
    dg, ddg = metric_jets(g, (.125,)*3)
    np.testing.assert_allclose(dg[4:-4, 4:-4, 4:-4], exact_first[4:-4, 4:-4, 4:-4], rtol=0., atol=5.e-7)
    np.testing.assert_allclose(ddg[4:-4, 4:-4, 4:-4], exact_second[4:-4, 4:-4, 4:-4], rtol=0., atol=5.e-7)
    from .sbp_boundary_operator import SBP42
    first = SBP42(17, .125)
    reversed_xy = first.derivative(first.derivative(g, 0), 1)
    np.testing.assert_allclose(ddg[..., 0, 1, :, :], reversed_xy, rtol=0., atol=4.e-13)

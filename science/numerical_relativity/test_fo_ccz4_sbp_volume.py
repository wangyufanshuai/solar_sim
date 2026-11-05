"""Behavioral tests for real nonlinear volume coupling, not physical admission."""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from . import fo_ccz4_sbp_volume as V
from .bssn3d import advance_bssn_rk4_3d
from .ccz4_3d import advance_ccz4_rk4_3d
from .fo_ccz4_checkpoint import checkpoint_from_state, state_slots
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile, PROFILE_METADATA_KEY
from .fo_ccz4_rhs import FOCCZ4Config, advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d
from .fo_ccz4_schwarzschild import analytic_slots
from .nr3d import Grid3D


def mesh(shape=(9, 9, 9)):
    return Grid3D(shape, (1., 1., 1.), (3., 3., 3.), boundary=V.BOUNDARY, spatial_order=4)


def flat_slots(shape=(9, 9, 9)):
    result = np.zeros((58, *shape))
    result[[0, 3, 5]] = 1.
    return result


def state():
    return V.state_from_slots(mesh(), flat_slots())


def test_grid_endpoints_and_interior_boundary_orders_are_explicit():
    operator = V.SBPVolumeOperator(mesh((9, 10, 11)))
    for axis in range(3):
        assert operator.grid.coordinates[axis].min() == 1.
        assert operator.grid.coordinates[axis].max() == 3.
        assert operator.grid.spacing[axis] == 2./(operator.grid.shape[axis]-1)
    assert operator.identity["interior_order"] == 4
    assert operator.identity["boundary_order"] == 2
    assert operator.identity["boundary_conditions_applied"] is False
    assert operator.identity["evolution_supported"] is False
    assert all(operator.identity[key] is False for key in V.FLAGS)


@pytest.mark.parametrize("boundary", ["periodic", "sommerfeld", "excision", "schwarzschild-dirichlet"])
def test_operator_rejects_legacy_grid_aliases(boundary):
    with pytest.raises(ValueError, match="explicit sbp-volume"):
        V.SBPVolumeOperator(replace(mesh(), boundary=boundary))


@pytest.mark.parametrize("shape,order", [((8, 9, 9), 4), ((9, 9, 9), 2), ((9., 9, 9), 4)])
def test_grid_rejects_unsupported_stencil_identity(shape, order):
    with pytest.raises(ValueError, match="SBP"):
        Grid3D(shape, (1.,)*3, (3.,)*3, boundary=V.BOUNDARY, spatial_order=order)


def test_independent_slots_are_copied_not_reconstructed():
    q = flat_slots()
    for slot in range(6, 58):
        q[slot] += .001*(slot+1)
    q[1] = .002
    actual = V.state_from_slots(mesh(), q)
    packed = np.asarray(state_slots(actual))
    np.testing.assert_allclose(packed, q, atol=2.e-16, rtol=0.)
    assert np.all(actual.auxiliary.lapse_gradient[..., 0] == q[25])
    assert np.all(actual.auxiliary.metric_gradient[..., 2, 1, 2] == q[53])
    q[:] = 0.
    assert actual.base.h[0, 0, 0, 0, 0] == 1.
    assert actual.auxiliary.lapse_gradient.max() > 0.


@pytest.mark.parametrize("bad", [np.nan, np.inf, -np.inf])
def test_constructor_rejects_nonfinite_fields(bad):
    q = flat_slots()
    q[30, 1, 2, 3] = bad
    with pytest.raises(ValueError, match="finite"):
        V.state_from_slots(mesh(), q)


@pytest.mark.parametrize("bad", [1j, "bad", True])
def test_constructor_rejects_non_real_numeric_dtypes(bad):
    q = np.full((58, 9, 9, 9), bad)
    with pytest.raises(ValueError, match="58 real finite"):
        V.state_from_slots(mesh(), q)


@pytest.mark.parametrize("slot,value", [(0, -1.), (0, 0.), (6, 1.e4), (6, -1.e4), (10, 1.e4)])
def test_invalid_geometry_is_rejected_without_clipping(slot, value):
    q = flat_slots()
    q[slot] = value
    with pytest.raises(ValueError):
        V.state_from_slots(mesh(), q)


@pytest.mark.parametrize("metadata", [{V.METADATA_KEY: {}}, {"schwarzschild_domain": {}}, {"checkpoint_version": "5"}])
def test_false_boundary_restart_or_operator_metadata_is_rejected(metadata):
    with pytest.raises(ValueError):
        V.state_from_slots(mesh(), flat_slots(), metadata=metadata)


@pytest.mark.parametrize("axis", [0, 1, 2])
def test_derivative_uses_correct_rectangular_spatial_axis(axis):
    geometry = mesh((9, 10, 11))
    operator = V.SBPVolumeOperator(geometry)
    actual = V.state_from_slots(geometry, flat_slots(geometry.shape))
    x, y, z = geometry.coordinates
    polynomial = 2.*x+3.*y*y+4.*z
    expected = (np.full_like(x, 2.), 6.*y, np.full_like(z, 4.))[axis]
    fields = np.stack((polynomial, 2.*polynomial), axis=-1)
    derivative = operator.derivative(fields, actual.base, axis)
    np.testing.assert_allclose(derivative, np.stack((expected, 2.*expected), axis=-1), atol=2.e-13, rtol=0.)


@pytest.mark.parametrize("axis", [True, -1, 3, 1.5])
def test_invalid_derivative_axes_fail_closed(axis):
    actual = state()
    with pytest.raises(ValueError, match="axis"):
        V.SBPVolumeOperator(actual.grid).derivative(actual.base.chi, actual.base, axis)


def test_minkowski_volume_rhs_is_exactly_zero():
    actual = state()
    rhs = V.SBPVolumeOperator(actual.grid).rhs(actual, config=FOCCZ4Config(tau_inverse=1.), gauge_profile=FOCCZ4GaugeProfile())
    assert all(np.count_nonzero(getattr(rhs, name)) == 0 for name in rhs.__dataclass_fields__)


def test_curved_volume_has_nonzero_curvature_and_unclamped_surface_rhs():
    actual = V.state_from_slots(mesh(), analytic_slots(9, 4))
    before = np.asarray(state_slots(actual)).tobytes()
    operator = V.SBPVolumeOperator(actual.grid)
    ricci = operator.geometry(actual)[4]
    rhs = operator.rhs(actual)
    assert np.max(abs(ricci)) > .01
    assert np.max(abs(rhs.trace_k[0])) > 1.e-8
    assert np.asarray(state_slots(actual)).tobytes() == before


@pytest.mark.parametrize("mutation", ["identity", "mask", "metric", "lapse"])
def test_mutated_state_is_revalidated(mutation):
    actual = state()
    if mutation == "identity":
        actual.base.metadata[V.METADATA_KEY]["boundary_order"] = 4
    elif mutation == "mask":
        actual.base.valid_mask[0, 0, 0] = False
    elif mutation == "metric":
        actual.base.h[0, 0, 0, 0, 0] = -1.
    else:
        actual.base.lapse[0, 0, 0] = 0.
    with pytest.raises(ValueError):
        V.SBPVolumeOperator(actual.grid).rhs(actual)


def test_profile_identity_is_not_silently_dropped():
    actual = state()
    actual.base.metadata[PROFILE_METADATA_KEY] = FOCCZ4GaugeProfile().identity()
    with pytest.raises(ValueError, match="profile mismatch"):
        V.SBPVolumeOperator(actual.grid).rhs(actual)


def test_no_legacy_rhs_rk_or_checkpoint_accepts_volume_only_grid():
    actual = state()
    with pytest.raises(ValueError):
        fo_ccz4_rhs_3d(actual)
    with pytest.raises(ValueError):
        advance_fo_ccz4_rk4_3d(actual, 1.e-4)
    with pytest.raises(ValueError):
        advance_bssn_rk4_3d(actual.base, 1.e-4)
    with pytest.raises(ValueError):
        advance_ccz4_rk4_3d(actual.base, 1.e-4)
    with pytest.raises(ValueError):
        checkpoint_from_state(actual, profile=None, dt=1.e-4)

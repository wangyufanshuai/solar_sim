"""Exact invariants for the paired-difference first derivative, not clipping."""
import numpy as np
import pytest

from .bssn3d import _d1
from .fo_ccz4 import build_fo_ccz4_auxiliary_3d
from .fo_ccz4_linear_modes import GAUGE, PROFILE
from .fo_ccz4_rhs import FOCCZ4State3D, advance_fo_ccz4_rk4_3d
from .nr3d import BSSNState3D, Grid3D, _grid_d1
from .plane_constraint_oracle import plane_diagonal_hamiltonian


@pytest.mark.parametrize("points", (5, 6, 9, 13, 17, 25))
@pytest.mark.parametrize("value", (.1, -.3, 1.23456789, 1.e-20, 1.e20))
def test_all_axes_annihilate_constants_exactly(points, value):
    state = BSSNState3D.minkowski(Grid3D((points,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=4))
    values = np.full(state.grid.shape, value)
    for axis in range(3):
        assert np.all(_d1(values, state, axis) == 0.)
        assert np.all(_grid_d1(values, state, axis) == 0.)


@pytest.mark.parametrize("normal", range(3))
def test_invariant_directions_are_exactly_zero_without_projection(normal):
    n = 9
    state = BSSNState3D.minkowski(Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=4))
    shape = [1]*3
    shape[normal] = n
    line = np.sin(.731*np.arange(n))+1.23456789
    values = np.broadcast_to(line.reshape(shape), state.grid.shape)
    before = values.copy()
    for axis in range(3):
        actual = _d1(values, state, axis)
        np.testing.assert_array_equal(actual, _grid_d1(values, state, axis))
        if axis != normal:
            assert np.all(actual == 0.)
        else:
            assert np.max(abs(actual)) > 0.
    np.testing.assert_array_equal(values, before)


def test_old_unpaired_rounding_error_is_a_failing_control():
    value = np.float64(1.23456789)
    old = (value-8.*value+8.*value-value)/(12./9.)
    paired = (8.*(value-value)-(value-value))/(12./9.)
    assert old != 0. and paired == 0.


def test_plane_auxiliaries_and_short_evolution_remain_exactly_diagonal():
    state = BSSNState3D.gauge_wave(Grid3D((9,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=4), amplitude=1.e-4)
    aux = build_fo_ccz4_auxiliary_3d(state)
    assert np.all(aux.metric_gradient[..., 1:, :, :] == 0.)
    assert np.all(aux.lapse_gradient[..., 1:] == 0.)
    result = advance_fo_ccz4_rk4_3d(FOCCZ4State3D(state, aux), 1./512, steps=8,
                                  gauge=GAUGE, gauge_profile=PROFILE)
    offdiag = ~np.eye(3, dtype=bool)
    assert np.all(result.base.h[..., offdiag] == 0.)
    assert np.all(result.base.a[..., offdiag] == 0.)
    assert np.all(np.isfinite(plane_diagonal_hamiltonian(result.base).hamiltonian))

"""Post-hoc algebraic controls; not an evolution/stability acceptance gate.

Jacobi's identity gives d_t log det(h) = 2 beta^k h^ij D_kij
- 3 tau_inverse (det(h)-1) for the unchanged independent-auxiliary RHS.
The shift-gradient and trace-free-A contributions cancel in this contraction.
Off-constraint D may force det(h) even when det(h) is initially one.
"""
import numpy as np
import pytest

from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.nr3d import Grid3D


@pytest.mark.parametrize("shift_present", [False, True])
@pytest.mark.parametrize("auxiliary_present", [False, True])
@pytest.mark.parametrize("det_offset", [0., 1.e-6])
def test_logdet_rhs_balance_without_projection(shift_present, auxiliary_present, det_offset):
    grid = Grid3D((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    driver = NonlinearSBPCube(grid)
    lower = np.array([[1., 0., 0.], [.15, 1., 0.], [-.08, .12, 1.+det_offset]])
    metric = lower@lower.T
    q = np.zeros((58, 9, 9, 9))
    for slot, (i, j) in enumerate((i, j) for i in range(3) for j in range(i, 3)):
        q[slot] = metric[i, j]
        q[11+slot] = .001*(slot+1)
    q[6], q[10] = np.log(.8), .5*np.log(.6)
    if shift_present:
        q[7:10] = np.array([.02, -.03, .01])[:, None, None, None]
    q[28:37] = (.0001*np.arange(1, 10))[:, None, None, None]
    if auxiliary_present:
        q[37:55] = (.0003*np.arange(1, 19))[:, None, None, None]
    before = q.tobytes()
    state = driver.state(q)
    rhs = driver.volume.rhs(state, gauge=driver.gauge, config=driver.config, gauge_profile=driver.profile)
    inverse = np.linalg.inv(state.base.h)
    observed = np.einsum("...ij,...ij->...", inverse, rhs.h)
    trace_d = np.einsum("...ij,...kij->...k", inverse, state.auxiliary.metric_gradient)
    forcing = 2.*np.einsum("...k,...k->...", state.base.shift, trace_d)
    damping = -3.*driver.config.tau_inverse*(np.linalg.det(state.base.h)-1.)
    np.testing.assert_allclose(observed, forcing+damping, rtol=0., atol=2.e-14)
    assert q.tobytes() == before
    assert np.max(abs(forcing)) > 1.e-6 if shift_present and auxiliary_present else np.all(forcing == 0.)
    if det_offset:
        assert np.max(abs(damping)) > 1.e-6
    # This checks an instantaneous identity only, never a trajectory budget,
    # a proof of stability, or permission to relax the 1e-10 stage bound.

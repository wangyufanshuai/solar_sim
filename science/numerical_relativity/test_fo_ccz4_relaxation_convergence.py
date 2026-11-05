from dataclasses import replace

import numpy as np
import pytest

from .fo_ccz4_checkpoint import checkpoint_from_state
from .fo_ccz4_rhs import FOCCZ4State3D
from .fo_ccz4_relaxation_convergence import (AMPLITUDE, CASES, Case, FLOORS, PROFILE,
    constraint_fields, constraint_order, derivative, difference_order, initial, norms)
from .nr3d import BSSNState3D, Grid3D


def test_matrix_is_unique_and_contains_only_declared_controls():
    assert len(CASES) == len({c.label for c in CASES}) == 26
    assert sum(c.steps_per_unit == 512 for c in CASES) == 14


@pytest.mark.parametrize("order", (2,4))
@pytest.mark.parametrize("rate", (0.,1.))
def test_axis_initial_data_matches_existing_harmonic_slice_not_time_evolution(order,rate):
    case = Case(order,8,rate,wave=(1,0,0))
    data = initial(case)
    grid = Grid3D((8,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=order)
    old = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(BSSNState3D.gauge_wave(grid,amplitude=AMPLITUDE)),
                                profile=PROFILE,tau_inverse=rate,dt=1./512.,scenario=1,amplitude=AMPLITUDE)
    assert data.header == old.header
    for a,b in zip(data.slots,old.slots):
        np.testing.assert_allclose(a,b,atol=2.e-15,rtol=0.)


@pytest.mark.parametrize("order", (2,4))
def test_rotated_initial_slice_preserves_metric_and_rank_one_curvature(order):
    data = initial(Case(order,8,1.))
    state = data.to_state().base
    xyz = np.indices((8,)*3)/8.
    phase = 2*np.pi*np.sum(xyz,axis=0)
    h = 1.-AMPLITUDE*np.sin(phase)
    n = np.ones(3)/np.sqrt(3)
    metric = state.h/state.chi[...,None,None]
    expected = np.eye(3)+(h-1.)[...,None,None]*np.outer(n,n)
    np.testing.assert_allclose(metric,expected,atol=5.e-16,rtol=0.)
    np.testing.assert_allclose(np.linalg.det(state.h),1.,atol=2.e-15,rtol=0.)
    trace = np.einsum("...ij,...ij->...",np.linalg.inv(state.h),state.a)
    assert np.max(abs(trace)) < 5.e-17
    physical_k = (state.a+state.h*state.trace_k[...,None,None]/3.)/state.chi[...,None,None]
    perpendicular = np.array([1.,-1.,0.])/np.sqrt(2.)
    assert np.max(abs(physical_k@perpendicular)) < 5.e-17


@pytest.mark.parametrize("order", (2,4))
@pytest.mark.parametrize("axis", (0,1,2))
def test_independent_fourier_fd_symbol_matches_paired_stencil(order,axis):
    q = np.random.default_rng(123).normal(size=(8,8,8,3,3))
    near = np.roll(q,-1,axis)-np.roll(q,1,axis)
    expected = 4*near if order == 2 else (8*near-(np.roll(q,-2,axis)-np.roll(q,2,axis)))*(8./12.)
    np.testing.assert_allclose(derivative(q,axis,order),expected,atol=2.e-14,rtol=0.)


@pytest.mark.parametrize("order", (2,4))
def test_nyquist_and_constant_derivative_zero(order):
    x = np.indices((8,)*3)[0]
    np.testing.assert_array_equal(derivative((-1.)**x,0,order),np.zeros((8,)*3))
    np.testing.assert_array_equal(derivative(np.ones((8,)*3),0,order),np.zeros((8,)*3))


@pytest.mark.parametrize("order", (2,4))
def test_actual_adm_trace_and_momentum_have_independent_flat_oracle(order):
    grid = Grid3D((8,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=order)
    data = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid)),
                                profile=PROFILE,dt=1./512.)
    f = .01*np.sin(2*np.pi*np.sum(np.indices((8,)*3)/8.,axis=0))
    q = list(data.slots)
    for slot in (11,14,16):
        q[slot] = f/3.
    data = replace(data,slots=tuple(q))
    fields = constraint_fields(data)
    np.testing.assert_allclose(fields["H"],2*f*f/3.,atol=1.e-19,rtol=0.)
    np.testing.assert_allclose(fields["M"],-2./3.*np.stack([derivative(f,i,order) for i in range(3)],axis=-1),
                               atol=4.e-17,rtol=0.)
    # Violating independent derivative slots cannot contaminate metric ADM.
    altered = replace(data,slots=tuple(q[:25]+[v+.017 for v in q[25:]]))
    other = constraint_fields(altered)
    np.testing.assert_array_equal(other["H"],fields["H"])
    np.testing.assert_array_equal(other["M"],fields["M"])


def test_diagnostics_report_all_named_constraints():
    data = initial(Case(4,8,0.))
    summary = norms(constraint_fields(data))
    assert set(summary) == set(FLOORS)
    assert all(np.isfinite(v) for r in summary.values() for v in r.values())
    assert max(summary[k]["linf"] for k in ("A","B","D","P")) < 3.e-15


@pytest.mark.parametrize("order", (2,4))
def test_constraint_orders_never_promote_floor_or_nonconvergence(order):
    assert constraint_order([.01,.01/2**order,.01/4**order],order,"H")["passed"]
    assert not constraint_order([.01,.01,.01],order,"H")["passed"]
    assert constraint_order([0.,0.,0.],order,"H")["status"] == "bounded-null"
    assert not constraint_order([1.e-5,1.e-10,1.e-12],order,"H")["passed"]
    assert constraint_order([1.e-5,1.e-10,1.e-12],order,"H")["status"] == "floor-limited"


def test_state_difference_order_has_no_silent_floor_success():
    q = np.ones((58,8,8,8))
    assert difference_order(q*.01,q*.01/16,q*.01/256,order=4,temporal=True)["passed"]
    assert not difference_order(q,q,q,order=4)["passed"]
    assert not difference_order(q*4,q*2,q,order=4,temporal=True)["passed"]


@pytest.mark.parametrize("kwargs", ({"order":3},{"n":12},{"rate":2.},{"rate":True},
                                     {"steps_per_unit":100},{"wave":(0,0,0)}))
def test_undeclared_configuration_rejected(kwargs):
    with pytest.raises(ValueError):
        Case(**({"order":4,"n":8,"rate":1.}|kwargs))

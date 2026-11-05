from __future__ import annotations

from dataclasses import fields, replace

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_frozen_characteristics import audit_frozen_fo_ccz4_eigenspaces_3d
from .fo_ccz4_frozen_symbol import frozen_fo_ccz4_principal_matrix_3d, probe_frozen_fo_ccz4_rhs_matrix_3d
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile, PROFILE_METADATA_KEY
from .fo_ccz4_rhs import FOCCZ4Config, FOCCZ4State3D, advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d
from .nr3d import BSSNState3D, Grid3D


PROFILE = FOCCZ4GaugeProfile()


def _manufactured_state(points=12, axis=0, order=2, constant_b=False):
    shape = [5, 5, 5]
    shape[axis] = points
    grid = Grid3D(tuple(shape), (0.,0.,0.), (1.,1.,1.), boundary="periodic", spatial_order=order)
    base = BSSNState3D.minkowski(grid)
    phase = 2.*np.pi*grid.coordinates[axis]
    base.lapse *= .8*np.exp(.04*np.sin(phase))
    base.chi *= .6*np.exp(.05*np.cos(phase))
    base.b[..., 0] = .03 if constant_b else .03*np.sin(phase)
    state = FOCCZ4State3D.from_bssn_state(base)
    a = np.zeros_like(state.auxiliary.lapse_gradient)
    p = np.zeros_like(state.auxiliary.conformal_factor_gradient)
    a[..., axis] = .04*2.*np.pi*np.cos(phase)
    p[..., axis] = -.025*2.*np.pi*np.sin(phase)
    state = FOCCZ4State3D(base, replace(state.auxiliary, lapse_gradient=a, conformal_factor_gradient=p))
    f = 3.*base.lapse*base.chi
    bprime = 0. if constant_b else .03*2.*np.pi*np.cos(phase)
    analytic = f*(bprime + (a[..., axis]+2.*p[..., axis])*base.b[..., 0])
    return state, analytic


@pytest.mark.parametrize("axis", (0,1,2))
def test_state_dependent_shift_gradient_includes_product_rule(axis):
    state, expected = _manufactured_state(axis=axis, constant_b=True)
    rhs = fo_ccz4_rhs_3d(state, gauge_profile=PROFILE)
    # b is constant, so dropping b*d(f) would incorrectly yield zero here.
    assert np.max(abs(expected)) > .01
    np.testing.assert_allclose(rhs.shift_gradient[..., axis, 0], expected, rtol=0., atol=2.e-14)
    np.testing.assert_allclose(rhs.shift[..., 0], 3.*state.base.lapse*state.base.chi*.03, rtol=0., atol=1.e-15)


@pytest.mark.parametrize("axis", (0,1,2))
@pytest.mark.parametrize("order", (2,4))
def test_product_rule_manufactured_derivative_converges(axis, order):
    errors = []
    for points in (12,24,48):
        state, expected = _manufactured_state(points, axis, order)
        rhs = fo_ccz4_rhs_3d(state, gauge_profile=PROFILE)
        errors.append(float(np.sqrt(np.mean((rhs.shift_gradient[..., axis, 0]-expected)**2))))
    observed = np.log(np.asarray(errors[:-1])/errors[1:])/np.log(2.)
    assert np.all(observed > order-.15)
    assert errors[-1] < errors[0]


@pytest.mark.parametrize("chi,lapse", ((2./3.,1.),(.5,1.),(.5,.6817928305074291),(.7655790150423762,.8708006013327899)))
def test_profile_covers_previous_nonflat_degeneracies_and_actual_rhs(chi, lapse):
    args = (np.eye(3), chi, lapse, (0.,0.,0.), (1.,0.,0.))
    old = audit_frozen_fo_ccz4_eigenspaces_3d(*args)
    assert not old.pointwise_eigenbasis_validated
    candidate = audit_frozen_fo_ccz4_eigenspaces_3d(*args, gauge_profile=PROFILE)
    assert candidate.basis_rank == 58
    assert candidate.pointwise_eigenbasis_validated
    assert not candidate.strong_hyperbolicity_validated
    assert candidate.gauge_profile_identity == PROFILE.identity()
    matrix = frozen_fo_ccz4_principal_matrix_3d(*args, gauge_profile=PROFILE)
    probe = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, gauge_profile=PROFILE)
    np.testing.assert_allclose(matrix, probe, rtol=0., atol=2.e-12)


def test_profile_speed_ordering_samples_match_the_derived_identity():
    alpha = np.geomspace(.001,1.999,91)
    f, mu = PROFILE.coefficients(alpha, .37)
    # Divide speed squares by alpha**2*chi*Hn, eliminating chi and the normal.
    ratios = np.stack((np.ones_like(alpha)*mu/(4.*.37),np.ones_like(alpha)*mu/(2.*.37),np.ones_like(alpha),2./alpha,
                       f/(alpha**2*.37),4.*f/(3.*alpha**2*.37)))
    assert np.all(np.diff(ratios, axis=0) > 0.)


def test_profile_rhs_is_repeatable_and_does_not_mutate_input():
    state, _ = _manufactured_state()
    before = {field.name: getattr(state.base,field.name).copy() for field in fields(state.base)
              if isinstance(getattr(state.base,field.name),np.ndarray)}
    first, second = fo_ccz4_rhs_3d(state,gauge_profile=PROFILE), fo_ccz4_rhs_3d(state,gauge_profile=PROFILE)
    for field in fields(first):
        np.testing.assert_array_equal(getattr(first,field.name),getattr(second,field.name))
    for name, value in before.items():
        np.testing.assert_array_equal(getattr(state.base,name),value)
    assert PROFILE_METADATA_KEY not in state.base.metadata


def test_rk4_keeps_profile_on_every_stage_and_rejects_silent_restart_switch():
    state, _ = _manufactured_state()
    whole = advance_fo_ccz4_rk4_3d(state,1.e-5,steps=2,gauge_profile=PROFILE)
    first = advance_fo_ccz4_rk4_3d(state,1.e-5,gauge_profile=PROFILE)
    split = advance_fo_ccz4_rk4_3d(first,1.e-5,gauge_profile=PROFILE)
    for obj, other in ((whole.base,split.base),(whole.auxiliary,split.auxiliary)):
        for field in fields(obj):
            if isinstance(getattr(obj,field.name),np.ndarray):
                np.testing.assert_array_equal(getattr(obj,field.name),getattr(other,field.name))
    assert whole.base.metadata[PROFILE_METADATA_KEY] == PROFILE.identity()
    assert PROFILE_METADATA_KEY not in state.base.metadata
    with pytest.raises(ValueError,match="profile mismatch"):
        advance_fo_ccz4_rk4_3d(whole,1.e-5)
    with pytest.raises(ValueError,match="profile mismatch"):
        fo_ccz4_rhs_3d(whole,gauge_profile=FOCCZ4GaugeProfile(shift_scale=4.))


def test_profile_is_off_by_default():
    state, _ = _manufactured_state()
    omitted = fo_ccz4_rhs_3d(state)
    explicit = fo_ccz4_rhs_3d(state,gauge_profile=None)
    for field in fields(omitted):
        np.testing.assert_array_equal(getattr(omitted,field.name),getattr(explicit,field.name))
    assert np.max(abs(omitted.shift-fo_ccz4_rhs_3d(state,gauge_profile=PROFILE).shift)) > .001


def test_profile_rejects_unsupported_domain_without_clipping():
    for alpha in (0.,2.,float("nan")):
        with pytest.raises(ValueError,match="lapse"):
            PROFILE.coefficients(alpha,1.)
    with pytest.raises(ValueError,match="chi"):
        PROFILE.coefficients(1.,0.)
    with pytest.raises(ValueError,match="shift_scale"):
        FOCCZ4GaugeProfile(shift_scale=2.)
    state, _ = _manufactured_state()
    with pytest.raises(ValueError,match="c=e=s=1"):
        fo_ccz4_rhs_3d(state,gauge_profile=PROFILE,config=FOCCZ4Config(cleaning_speed=2.))
    with pytest.raises(ValueError,match="c=e=s=1"):
        fo_ccz4_rhs_3d(state,gauge_profile=PROFILE,gauge=GaugeConfig(lapse_coefficient=1.))

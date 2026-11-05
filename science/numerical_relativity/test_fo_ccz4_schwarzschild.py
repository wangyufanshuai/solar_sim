from dataclasses import replace
import struct

import numpy as np
import pytest

from .fo_ccz4_checkpoint import (
    HEADER, ORDER_HEADER, CONTROL_HEADER, checkpoint_from_state, decode_checkpoint, state_slots,
)
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4Config, advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d
from .ccz4_reference import GaugeConfig
from .fo_ccz4_schwarzschild import (
    BOUNDARY, SchwarzschildDomain, analytic_slots, initial_state, halo_mask,
    closed_derivative, analytic_ricci_and_kretschmann,
)
from .fo_ccz4_exterior_audit import derivative, physical_fields, common_indices, sampled

DOMAIN = SchwarzschildDomain()
PROFILE = FOCCZ4GaugeProfile()
GAUGE = GaugeConfig(theta_coupling=2., shift_coefficient=1., shift_damping=0.)


def checkpoint(order=4, rate=1.):
    return checkpoint_from_state(initial_state(9, order), profile=PROFILE, dt=1./256,
                                 scenario=2, amplitude=0., tau_inverse=rate, domain=DOMAIN)


@pytest.mark.parametrize("args", [(0, 3, 1), (1, 1, 1), (1, 3, 0), (1, 3, 4), (1, float("inf"), 1)])
def test_invalid_exterior_rejected(args):
    with pytest.raises(ValueError):
        SchwarzschildDomain(*args)


@pytest.mark.parametrize("order", [2, 4])
@pytest.mark.parametrize("rate", [0., 1.])
def test_domain_checkpoint_roundtrip_and_explicit_selection(order, rate):
    data = checkpoint(order, rate)
    raw = data.to_bytes()
    read = decode_checkpoint(raw, expected_profile=PROFILE, expected_spatial_order=order,
                             expected_tau_inverse=rate, expected_domain=DOMAIN)
    assert read.header["version"] == 5 and read.to_bytes() == raw
    assert read.to_state().grid == DOMAIN.grid(9, order)
    np.testing.assert_allclose(state_slots(read.to_state()), data.slots, atol=2.e-16, rtol=0.)
    with pytest.raises(ValueError, match="domain mismatch"):
        decode_checkpoint(raw, expected_profile=PROFILE, expected_spatial_order=order, expected_tau_inverse=rate)


@pytest.mark.parametrize("offset,value", [(0, 2), (8, 1), (16, float("nan")), (24, 0.), (32, 4.)])
def test_domain_corruption_rejected(offset, value):
    data = checkpoint()
    raw = bytearray(data.to_bytes())
    fmt = "<Q" if offset < 16 else "<d"
    struct.pack_into(fmt, raw, HEADER.size+ORDER_HEADER.size+CONTROL_HEADER.size+offset, value)
    with pytest.raises(ValueError):
        decode_checkpoint(bytes(raw), expected_profile=PROFILE, expected_spatial_order=4,
                          expected_tau_inverse=1., expected_domain=DOMAIN)


def test_corrupt_halo_rejected_but_independent_interior_auxiliary_survives():
    data = checkpoint()
    data.slots[55][4, 4, 4] += .002
    assert data.to_state().auxiliary.conformal_factor_gradient[4, 4, 4, 0] == data.slots[55][4, 4, 4]
    data.slots[55][0, 4, 4] += .002
    with pytest.raises(ValueError, match="halo corrupted"):
        data.to_bytes()


@pytest.mark.parametrize("order", [2, 4])
def test_closed_stencil_polynomial_exact_and_no_periodic_wrap(order):
    grid = DOMAIN.grid(9, order)
    x = grid.coordinates[0]
    q = x**order
    actual = closed_derivative(q, grid, 0)
    np.testing.assert_allclose(actual[2:-2], order*x[2:-2]**(order-1), atol=1.e-12)
    independent = derivative(q, grid, 0)
    np.testing.assert_allclose(independent, order*x**(order-1), atol=1.e-11)
    q[-1] += 1.e3
    assert np.array_equal(actual[2], closed_derivative(q, grid, 0)[2])


@pytest.mark.parametrize("order", [2, 4])
def test_every_stage_freezes_halo_but_evolves_curved_interior(order):
    data = checkpoint(order)
    state = data.to_state()
    rhs = fo_ccz4_rhs_3d(state, gauge=GAUGE, config=FOCCZ4Config(tau_inverse=1.),
                         gauge_profile=PROFILE, boundary_mode=BOUNDARY)
    mask = halo_mask(state.grid.shape)
    for name in rhs.__dataclass_fields__:
        assert np.all(getattr(rhs, name)[mask] == 0.)
    assert np.max(np.abs(rhs.trace_k[~mask])) > 1.e-10
    end = advance_fo_ccz4_rk4_3d(state, 1./256, steps=2, gauge=GAUGE,
                                config=FOCCZ4Config(tau_inverse=1.), gauge_profile=PROFILE, boundary_mode=BOUNDARY)
    q0, q1 = np.asarray(state_slots(state)), np.asarray(state_slots(end))
    assert np.array_equal(q0[:, mask], q1[:, mask])
    assert np.max(np.abs(q1[:, ~mask]-q0[:, ~mask])) > 1.e-12
    with pytest.raises(ValueError, match="boundary mode/grid"):
        fo_ccz4_rhs_3d(state, gauge_profile=PROFILE, config=FOCCZ4Config(tau_inverse=1.))


def test_curvature_oracle_nonzero_and_mass_scaling():
    grid = DOMAIN.grid(17, 4)
    r, invariant = analytic_ricci_and_kretschmann(grid, 1.)
    q = analytic_slots(17, 4)
    mixed = np.exp(2*q[10])[..., None, None]*r
    assert np.max(abs(np.trace(mixed, axis1=-2, axis2=-1))) < 1.e-16
    np.testing.assert_allclose(8*np.trace(mixed@mixed, axis1=-2, axis2=-1), invariant, rtol=2.e-15)
    _, scaled = analytic_ricci_and_kretschmann(SchwarzschildDomain(2., 6., 2.).grid(17, 4), 2.)
    np.testing.assert_allclose(scaled, invariant/16., rtol=2.e-15)
    assert float(invariant.min()) > 0.


@pytest.mark.parametrize("order", [2, 4])
def test_independent_curvature_converges_without_evolved_auxiliaries(order):
    errors = []
    for n in (17, 25, 33):
        q = analytic_slots(n, order)
        grid = DOMAIN.grid(n, order)
        oracle = analytic_ricci_and_kretschmann(grid, 1.)[1]
        fields = physical_fields(q, grid)
        idx = common_indices(n)
        errors.append(np.sqrt(np.mean(sampled(fields["vacuum_weyl_invariant"]-oracle, idx)**2)))
        if n == 17:
            q[19:22] += .4
            q[25:] += .9
            again = physical_fields(q, grid)
            assert np.array_equal(again["H"], fields["H"])
            assert np.array_equal(again["vacuum_weyl_invariant"], fields["vacuum_weyl_invariant"])
    rates = np.log(np.array(errors[:-1])/errors[1:])/np.log(np.array([24/16, 32/24]))
    assert min(rates) > order-.5


def test_scenario_alias_and_trailing_bytes_fail_closed():
    data = checkpoint()
    with pytest.raises(ValueError, match="scenario"):
        replace(data, header={**data.header, "scenario": 1}).to_bytes()
    with pytest.raises(ValueError, match="payload length"):
        decode_checkpoint(data.to_bytes()+b"x", expected_profile=PROFILE, expected_spatial_order=4,
                          expected_tau_inverse=1., expected_domain=DOMAIN)

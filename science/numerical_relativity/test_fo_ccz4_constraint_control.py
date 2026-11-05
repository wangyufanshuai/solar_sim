"""Contract negatives and analytic relaxation identities, not physics admission."""
from copy import deepcopy
from dataclasses import replace
import struct

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_checkpoint import (HEADER, ORDER_HEADER, CONTROL_HEADER, checkpoint_from_state,
                                checkpoint_version, decode_checkpoint)
from .fo_ccz4_constraint_control import (CONTROL_METADATA_KEY, constraint_control_identity,
                                       validate_tau_inverse)
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_lapse_constraint_balance import balance_fields, rhs_slots
from .fo_ccz4_rhs import FOCCZ4Config, advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d
from .manifest import validate_fo_ccz4_cpp_manifest
from .test_auxiliary_manifest import current_manifest
from .test_fo_ccz4_spatial_checkpoint import seed

GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)


def controlled(data, rate):
    return replace(data, header={**data.header, "version": checkpoint_version(
        data.header["spatial_order"], data.profile, rate)}, tau_inverse=rate)


@pytest.mark.parametrize("value", (-1., float("nan"), float("inf"), True, False, "1", None))
def test_invalid_rates_fail_closed(value):
    for validate in (validate_tau_inverse, FOCCZ4Config, constraint_control_identity):
        with pytest.raises((ValueError, TypeError)):
            validate(tau_inverse=value) if validate is FOCCZ4Config else validate(value)


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("profile", (None, FOCCZ4GaugeProfile()))
@pytest.mark.parametrize("rate", (.25, 1., 4.))
def test_v4_roundtrip_and_explicit_restore_identity(order, profile, rate):
    old = seed(order, profile)
    original = old.to_bytes()
    data = controlled(old, rate)
    raw = data.to_bytes()
    checked = decode_checkpoint(raw, expected_profile=profile, expected_spatial_order=order,
                                expected_tau_inverse=rate)
    assert checked.to_bytes() == raw and checked.header["version"] == 4
    assert checked.to_state().base.metadata[CONTROL_METADATA_KEY] == constraint_control_identity(rate)
    for a, b in zip(checked.slots, old.slots):
        np.testing.assert_array_equal(a, b)
    assert old.to_bytes() == original
    for wrong in (0., rate*2):
        with pytest.raises(ValueError, match="control mismatch"):
            decode_checkpoint(raw, expected_profile=profile, expected_spatial_order=order,
                              expected_tau_inverse=wrong)
    with pytest.raises(ValueError, match="control mismatch"):
        decode_checkpoint(original, expected_profile=profile, expected_spatial_order=order,
                          expected_tau_inverse=rate)


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("profile", (None, FOCCZ4GaugeProfile()))
def test_zero_rate_keeps_legacy_bytes_and_no_new_state_tag(order, profile):
    data = seed(order, profile)
    assert controlled(data, 0.).to_bytes() == data.to_bytes()
    assert CONTROL_METADATA_KEY not in data.to_state().base.metadata


@pytest.mark.parametrize("code,rate", ((0, 1.), (2, 1.), (1, 0.), (1, -1.),
                                      (1, float("nan")), (1, float("inf"))))
def test_corrupted_v4_policy_rejected(code, rate):
    raw = controlled(seed(), 1.).to_bytes()
    offset = HEADER.size+ORDER_HEADER.size
    malformed = raw[:offset]+CONTROL_HEADER.pack(code, rate)+raw[offset+CONTROL_HEADER.size:]
    with pytest.raises(ValueError):
        decode_checkpoint(malformed, expected_profile=None, expected_spatial_order=4, expected_tau_inverse=1.)


@pytest.mark.parametrize("change", ("short-control", "short-payload", "trailing", "analytic", "legacy-version"))
def test_v4_layout_and_solver_mode_rejections(change):
    raw = bytearray(controlled(seed(), 1.).to_bytes())
    if change == "short-control":
        raw = raw[:HEADER.size+ORDER_HEADER.size+8]
    elif change == "short-payload":
        raw = raw[:-1]
    elif change == "trailing":
        raw += b"x"
    else:
        struct.pack_into("<Q", raw, 48 if change == "analytic" else 8, 0 if change == "analytic" else 3)
    with pytest.raises(ValueError):
        decode_checkpoint(bytes(raw), expected_profile=None, expected_spatial_order=4, expected_tau_inverse=1.)


def test_restored_state_cannot_silently_forget_or_change_control():
    state = controlled(seed(2), 1.).to_state()
    for rate in (0., 2.):
        config = FOCCZ4Config(tau_inverse=rate)
        with pytest.raises(ValueError, match="control mismatch"):
            fo_ccz4_rhs_3d(state, config=config)
        with pytest.raises(ValueError, match="control mismatch"):
            advance_fo_ccz4_rk4_3d(state, 1.e-4, config=config)
        with pytest.raises(ValueError, match="control mismatch"):
            checkpoint_from_state(state, profile=None, dt=1.e-4, tau_inverse=rate)
    out = advance_fo_ccz4_rk4_3d(seed(2).to_state(), 1.e-4, config=FOCCZ4Config(tau_inverse=1.))
    assert out.base.metadata[CONTROL_METADATA_KEY] == constraint_control_identity(1.)
    assert CONTROL_METADATA_KEY not in seed(2).to_state().base.metadata


@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("profile", (None, FOCCZ4GaugeProfile()))
@pytest.mark.parametrize("rate", (.25, 1., 4.))
def test_only_published_relaxation_terms_change_and_geometric_trace_identity(order, profile, rate):
    data = seed(order, profile)
    rng = np.random.default_rng(20261007)
    data = replace(data, slots=tuple(q+rng.uniform(-.01,.01,q.shape) for q in data.slots))
    state = data.to_state()
    zero = fo_ccz4_rhs_3d(state, gauge=GAUGE, gauge_profile=profile)
    rhs = fo_ccz4_rhs_3d(state, gauge=GAUGE, gauge_profile=profile, config=FOCCZ4Config(tau_inverse=rate))
    h, a = state.base.h, state.base.a
    hi = np.linalg.inv(h)
    trace = np.einsum("...ij,...ij->...", hi, a)
    det = np.linalg.det(h)
    np.testing.assert_allclose(rhs.h-zero.h, -rate*(det-1.)[...,None,None]*h, atol=2.e-15, rtol=0.)
    np.testing.assert_allclose(rhs.a-zero.a, -rate*trace[...,None,None]*h, atol=2.e-15, rtol=0.)
    for i, (r, z) in enumerate(zip(rhs_slots(rhs), rhs_slots(zero))):
        if i not in (0,1,2,3,4,5,11,12,13,14,15,16):
            np.testing.assert_array_equal(r, z)
    balance = balance_fields(data, rhs_slots(rhs))
    np.testing.assert_allclose(balance["trace_rate"], balance["trace_prediction"]
                               + rate*(det-4.)*trace, atol=2.e-12, rtol=0.)
    np.testing.assert_allclose(balance["measured"], balance["predicted"], atol=2.e-12, rtol=0.)


def manifest(rate=1., order=4, profile=False, dynamic=True):
    payload = current_manifest(dynamic=dynamic, order=order, profile=profile)
    payload["kernel_version"] = "0.4.0"
    d = payload["diagnostics"]
    d["constraint_control"] = constraint_control_identity(rate)
    d["constraint_control_bound_to_checkpoint"] = True
    d["fo_ccz4_parameters"]["tau_inverse"] = rate
    d["checkpoint_version"] = checkpoint_version(order, profile, rate)
    return payload


@pytest.mark.parametrize("order", (2,4))
@pytest.mark.parametrize("profile", (False,True))
@pytest.mark.parametrize("rate", (0., .25, 1., 4.))
def test_manifest_exact_identity_and_no_mutation(order, profile, rate):
    payload = manifest(rate, order, profile)
    before = deepcopy(payload)
    validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=order, expected_tau_inverse=rate,
                                  expected_profile=FOCCZ4GaugeProfile() if profile else None)
    assert payload == before


@pytest.mark.parametrize("key", tuple(constraint_control_identity(1.)))
@pytest.mark.parametrize("change", ("remove", "wrong", "type"))
def test_manifest_policy_drift_rejected(key, change):
    payload = manifest()
    control = payload["diagnostics"]["constraint_control"]
    if change == "remove":
        del control[key]
    elif change == "wrong":
        control[key] = "unexpected"
    else:
        control[key] = True if key == "tau_inverse" else None
    with pytest.raises(ValueError, match="constraint control"):
        validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=4, expected_tau_inverse=1.)


def test_manifest_rejects_unbound_historical_and_analytic_control():
    for key, value in (("constraint_control_bound_to_checkpoint", False), ("checkpoint_version", 3)):
        payload = manifest()
        payload["diagnostics"][key] = value
        with pytest.raises(ValueError):
            validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=4, expected_tau_inverse=1.)
    payload = manifest()
    payload["kernel_version"] = "0.3.2"
    with pytest.raises(ValueError, match="historical"):
        validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=4, expected_tau_inverse=1.)
    with pytest.raises(ValueError, match="dynamic"):
        validate_fo_ccz4_cpp_manifest(manifest(dynamic=False), expected_spatial_order=4, expected_tau_inverse=1.)
    with pytest.raises(ValueError):
        validate_fo_ccz4_cpp_manifest(manifest(), expected_spatial_order=4)

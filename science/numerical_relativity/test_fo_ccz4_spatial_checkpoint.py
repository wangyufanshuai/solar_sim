from copy import deepcopy
from dataclasses import replace
import struct

import numpy as np
import pytest

from .fo_ccz4_checkpoint import (HEADER, ORDER_HEADER, FOCheckpoint, checkpoint_from_state,
                                decode_checkpoint, state_slots)
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4State3D
from .manifest import validate_fo_ccz4_cpp_manifest
from .nr3d import BSSNState3D, Grid3D
from .test_fo_ccz4_checkpoint import profile_manifest
from .test_manifest import _valid_cpp_manifest


def seed(order=4, profile=None):
    grid = Grid3D((5,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=order)
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.gauge_wave(grid, amplitude=.001))
    return checkpoint_from_state(state, profile=profile, dt=1.e-4, scenario=1)


@pytest.mark.parametrize("profile", (None, FOCCZ4GaugeProfile(), FOCCZ4GaugeProfile(4., .4)))
def test_v3_roundtrip_preserves_order_profile_and_independent_auxiliaries(profile):
    initial = seed(profile=profile)
    rng = np.random.default_rng(12)
    slots = tuple(slot+rng.uniform(-1.e-6,1.e-6,slot.shape) for slot in initial.slots)
    initial = replace(initial, slots=slots)
    raw = initial.to_bytes()
    loaded = decode_checkpoint(raw, expected_profile=profile, expected_spatial_order=4)
    assert loaded.header["version"] == 3
    assert loaded.to_bytes() == raw
    state = loaded.to_state()
    assert state.grid.spatial_order == state.auxiliary.derivative_order == 4
    for a,b in zip(state_slots(state),slots):
        np.testing.assert_allclose(a,b,atol=3.e-16,rtol=0.)
    for a,b in zip(state.auxiliary.arrays(), slots[25:]):
        np.testing.assert_array_equal(a,b)


@pytest.mark.parametrize("profile", (None,FOCCZ4GaugeProfile()))
def test_fd4_requires_explicit_reader_and_fd2_cannot_be_silently_upgraded(profile):
    with pytest.raises(ValueError,match="spatial order mismatch"):
        decode_checkpoint(seed(profile=profile).to_bytes(),expected_profile=profile)
    with pytest.raises(ValueError,match="spatial order mismatch"):
        decode_checkpoint(seed(2,profile).to_bytes(),expected_profile=profile,expected_spatial_order=4)
    old = decode_checkpoint(seed(2,profile).to_bytes(),expected_profile=profile)
    assert old.header["spatial_order"] == old.to_state().grid.spatial_order == 2
    assert old.header["version"] == (2 if profile else 1)


@pytest.mark.parametrize("order,code,a,k", ((2,0,0.,0.),(6,1,3.,.2),(4,2,0.,0.),
                                           (4,0,3.,.2),(4,0,float("nan"),0.),
                                           (4,1,2.,.2),(4,1,3.,0.)))
def test_v3_bad_extension_rejected(order,code,a,k):
    raw = seed().to_bytes()
    raw = raw[:HEADER.size]+ORDER_HEADER.pack(order,code,a,k)+raw[HEADER.size+ORDER_HEADER.size:]
    with pytest.raises(ValueError):
        decode_checkpoint(raw,expected_profile=None,expected_spatial_order=4)


@pytest.mark.parametrize("transform", (lambda raw:raw[:HEADER.size+16],lambda raw:raw[:-1],lambda raw:raw+b"x"))
def test_v3_truncated_or_trailing_payload_rejected(transform):
    with pytest.raises(ValueError):
        decode_checkpoint(transform(seed().to_bytes()),expected_profile=None,expected_spatial_order=4)


@pytest.mark.parametrize("profile", (None,FOCCZ4GaugeProfile()))
def test_v3_cannot_be_relabelled_as_old_format_or_forget_order(profile):
    data = seed(profile=profile)
    header = {**data.header,"version":2 if profile else 1}
    with pytest.raises(ValueError,match="conflicts"):
        FOCheckpoint(header,data.slots,profile).to_bytes()
    header = dict(data.header)
    del header["spatial_order"]
    with pytest.raises(ValueError,match="conflicts"):
        FOCheckpoint(header,data.slots,profile).to_bytes()


@pytest.mark.parametrize("wrong", (True,4.,None,6))
def test_order_type_and_value_are_not_inferred(wrong):
    data = seed()
    with pytest.raises(ValueError,match="integer 2 or 4"):
        replace(data,header={**data.header,"spatial_order":wrong}).to_bytes()


def test_profile_v3_cannot_use_analytic_contract():
    raw = bytearray(seed(profile=FOCCZ4GaugeProfile()).to_bytes())
    struct.pack_into("<Q",raw,48,0)
    with pytest.raises(ValueError,match="dynamic solver"):
        decode_checkpoint(bytes(raw),expected_profile=FOCCZ4GaugeProfile(),expected_spatial_order=4)


def manifest(order=4, profile=False):
    data = profile_manifest() if profile else _valid_cpp_manifest()
    data["kernel_version"] = "0.3.0"
    data["grid"]["spatial_order"] = order
    data["diagnostics"].update({"checkpoint_version":3 if order == 4 else (2 if profile else 1),
                                "spatial_order_bound_to_checkpoint":True,
                                "spatial_operator":"centered-periodic","numerical_dissipation":"none"})
    return data


@pytest.mark.parametrize("order,profile", ((2,False),(2,True),(4,False),(4,True)))
def test_new_manifest_binds_order_and_does_not_mutate_input(order,profile):
    data = manifest(order,profile)
    before = deepcopy(data)
    validate_fo_ccz4_cpp_manifest(data,expected_profile=FOCCZ4GaugeProfile() if profile else None,
                                 expected_spatial_order=order)
    assert before == data


@pytest.mark.parametrize("field,value", (("checkpoint_version",2),("spatial_order_bound_to_checkpoint",False),
                                       ("spatial_operator","upwind"),("numerical_dissipation","KO")))
def test_manifest_operator_drift_rejected(field,value):
    data = manifest()
    data["diagnostics"][field] = value
    with pytest.raises(ValueError):
        validate_fo_ccz4_cpp_manifest(data,expected_spatial_order=4)


def test_manifest_cannot_drop_order_in_new_version():
    data = manifest(2)
    del data["grid"]["spatial_order"]
    with pytest.raises(ValueError,match="missing"):
        validate_fo_ccz4_cpp_manifest(data)
    with pytest.raises(ValueError,match="order mismatch"):
        validate_fo_ccz4_cpp_manifest(manifest())

from dataclasses import replace
import struct

import numpy as np
import pytest

from .fo_ccz4_checkpoint import HEADER, HEADER_NAMES, PROFILE_HEADER, checkpoint_from_state, decode_checkpoint, state_slots
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile, PROFILE_METADATA_KEY
from .fo_ccz4_rhs import FOCCZ4State3D, advance_fo_ccz4_rk4_3d
from .manifest import validate_fo_ccz4_cpp_manifest
from .nr3d import BSSNState3D, Grid3D
from .test_manifest import _valid_cpp_manifest


def seed():
    return FOCCZ4State3D.from_bssn_state(BSSNState3D.gauge_wave(
        Grid3D((5,)*3,(0.,)*3,(1.,)*3,boundary="periodic"),amplitude=.001))


def change_header(raw, name, value):
    h = dict(zip(HEADER_NAMES,HEADER.unpack_from(raw)))
    h[name] = value
    return HEADER.pack(*(h[key] for key in HEADER_NAMES))+raw[HEADER.size:]


@pytest.mark.parametrize("profile", (None,FOCCZ4GaugeProfile(),FOCCZ4GaugeProfile(4.,.4)))
def test_checkpoint_roundtrip_all_slots_and_profile_binding(profile):
    state = seed()
    data = checkpoint_from_state(state,profile=profile,dt=1.e-5)
    raw = data.to_bytes()
    loaded = decode_checkpoint(raw,expected_profile=profile)
    assert loaded.to_bytes() == raw
    restored = loaded.to_state()
    for before,after in zip(state_slots(state),state_slots(restored)):
        np.testing.assert_allclose(after,before,rtol=0.,atol=2.e-16)
    if profile:
        assert restored.base.metadata[PROFILE_METADATA_KEY] == profile.identity()
        with pytest.raises(ValueError,match="profile mismatch"):
            advance_fo_ccz4_rk4_3d(restored,1.e-5)
        with pytest.raises(ValueError,match="profile mismatch"):
            checkpoint_from_state(restored,profile=None,dt=1.e-5)


@pytest.mark.parametrize("wrong", (None,FOCCZ4GaugeProfile(4.,.2),FOCCZ4GaugeProfile(3.,.4)))
def test_checkpoint_rejects_missing_or_different_profile(wrong):
    raw = checkpoint_from_state(seed(),profile=FOCCZ4GaugeProfile(),dt=1.e-5).to_bytes()
    with pytest.raises(ValueError,match="profile mismatch"):
        decode_checkpoint(raw,expected_profile=wrong)
    old = checkpoint_from_state(seed(),profile=None,dt=1.e-5).to_bytes()
    with pytest.raises(ValueError,match="profile mismatch"):
        decode_checkpoint(old,expected_profile=FOCCZ4GaugeProfile())


@pytest.mark.parametrize("name,value", (("version",99),("dimension",2),("points",2**63),
                                      ("scenario",2),("formulation",1),("variable_count",25),
                                      ("dt",float("nan")),("time",-1.),("wavelength",0.)))
def test_checkpoint_rejects_invalid_metadata_before_allocation(name,value):
    raw = checkpoint_from_state(seed(),profile=None,dt=1.e-5).to_bytes()
    with pytest.raises(ValueError):
        decode_checkpoint(change_header(raw,name,value),expected_profile=None)


@pytest.mark.parametrize("transform", (lambda raw:raw[:7],lambda raw:raw[:-1],lambda raw:raw+b"x",
                                      lambda raw:raw[:HEADER.size+3]))
def test_checkpoint_rejects_truncated_or_trailing_bytes(transform):
    raw = checkpoint_from_state(seed(),profile=FOCCZ4GaugeProfile(),dt=1.e-5).to_bytes()
    with pytest.raises(ValueError):
        decode_checkpoint(transform(raw),expected_profile=FOCCZ4GaugeProfile())


@pytest.mark.parametrize("code,a,k", ((0,3.,.2),(9,3.,.2),(1,2.,.2),(1,3.,0.),(1,3.,float("nan"))))
def test_checkpoint_rejects_invalid_profile_extension(code,a,k):
    raw = checkpoint_from_state(seed(),profile=FOCCZ4GaugeProfile(),dt=1.e-5).to_bytes()
    raw = raw[:HEADER.size]+PROFILE_HEADER.pack(code,a,k)+raw[HEADER.size+PROFILE_HEADER.size:]
    with pytest.raises(ValueError):
        decode_checkpoint(raw,expected_profile=FOCCZ4GaugeProfile())


@pytest.mark.parametrize("slot,value", ((6,np.log(2.)),(6,-1000.),(10,-1000.),(22,float("nan"))))
def test_checkpoint_rejects_invalid_field_domain(slot,value):
    raw = bytearray(checkpoint_from_state(seed(),profile=FOCCZ4GaugeProfile(),dt=1.e-5).to_bytes())
    struct.pack_into("<d",raw,HEADER.size+PROFILE_HEADER.size+slot*5**3*8,value)
    with pytest.raises(ValueError):
        decode_checkpoint(bytes(raw),expected_profile=FOCCZ4GaugeProfile())


def test_checkpoint_rejects_positive_determinant_but_indefinite_metric():
    state = seed()
    state.base.h[...,0,0] = -1.
    state.base.h[...,1,1] = -1.
    with pytest.raises(ValueError,match="positive definite"):
        checkpoint_from_state(state,profile=FOCCZ4GaugeProfile(),dt=1.e-5)


def test_checkpoint_rejects_noncanonical_grid_and_wrong_slot_shape():
    state = seed()
    state.base.grid = replace(state.grid,spatial_order=4)
    with pytest.raises(ValueError,match="auxiliary spatial order mismatch"):
        checkpoint_from_state(state,profile=None,dt=1.e-5)
    record = checkpoint_from_state(seed(),profile=None,dt=1.e-5)
    with pytest.raises(ValueError,match="58 complete"):
        replace(record,slots=record.slots[:-1]).to_bytes()


def profile_manifest():
    data = _valid_cpp_manifest()
    data["kernel_version"] = "0.2.0"
    d = data["diagnostics"]
    d.update({"gauge_profile":FOCCZ4GaugeProfile().identity(),"checkpoint_version":2,
              "gauge_profile_bound_to_checkpoint":True,"runtime_writeback":False,
              "dynamic_rhs_implemented":True,"dynamic_evolution_validated":False,
              "solver_mode":"fo-ccz4-rhs-shadow-rk4"})
    d["fo_ccz4_parameters"].update({"ordering_mu":None,"shift_coefficient":None})
    return data


def test_manifest_requires_explicit_matching_profile_and_variable_coefficients():
    data = profile_manifest()
    validate_fo_ccz4_cpp_manifest(data,expected_profile=FOCCZ4GaugeProfile())
    with pytest.raises(ValueError,match="profile"):
        validate_fo_ccz4_cpp_manifest(data)
    with pytest.raises(ValueError,match="profile"):
        validate_fo_ccz4_cpp_manifest(data,expected_profile=FOCCZ4GaugeProfile(4.,.2))
    data["diagnostics"]["fo_ccz4_parameters"]["shift_coefficient"] = 3.
    with pytest.raises(ValueError,match="variable coefficient"):
        validate_fo_ccz4_cpp_manifest(data,expected_profile=FOCCZ4GaugeProfile())


@pytest.mark.parametrize("name,value", (("checkpoint_version",1),("gauge_profile_bound_to_checkpoint",False),
                                      ("runtime_writeback",True),("dynamic_evolution_validated",True)))
def test_manifest_rejects_profile_boundary_drift(name,value):
    data = profile_manifest()
    data["diagnostics"][name] = value
    with pytest.raises(ValueError):
        validate_fo_ccz4_cpp_manifest(data,expected_profile=FOCCZ4GaugeProfile())

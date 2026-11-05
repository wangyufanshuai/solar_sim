"""Strict v1-v4 periodic and opt-in v5 Schwarzschild exterior checkpoints.

This is a scientific shadow interchange format, not untrusted-file sandboxing.
It validates layout/domain and explicit profile identity, not arbitrary finite
bit corruption. Bind artifacts to their externally recorded SHA-256 receipts.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
import struct

import numpy as np

from .fo_ccz4 import FOCCZ4Auxiliary3D
from .fo_ccz4_constraint_control import (
    CONTROL_METADATA_KEY, constraint_control_identity,
    require_matching_constraint_control, validate_tau_inverse,
)
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile, PROFILE_METADATA_KEY, require_matching_gauge_profile
from .fo_ccz4_rhs import FOCCZ4State3D
from .nr3d import BSSNState3D, Grid3D
from .fo_ccz4_schwarzschild import (
    SchwarzschildDomain, BOUNDARY, DOMAIN_KEY, require_analytic_halo, domain_from_state,
)

MAGIC = b"NRK2FO01"
HEADER = struct.Struct("<8sQQQQQQQddddQ")
PROFILE_HEADER = struct.Struct("<Qdd")
ORDER_HEADER = struct.Struct("<QQdd")  # order, profile id, shift scale, ordering scale
CONTROL_HEADER = struct.Struct("<Qd")  # v4: policy id (1 = relaxation), positive rate
DOMAIN_HEADER = struct.Struct("<QQddd")  # v5: boundary id, frozen layers, lower, upper, M
HEADER_NAMES = ("magic", "version", "dimension", "points", "scenario", "formulation",
                "solver_mode", "variable_count", "dt", "time", "amplitude", "wavelength", "step")
SYMMETRIC = tuple((i,j) for i in range(3) for j in range(i,3))


def state_slots(state):
    base, aux = state.base, state.auxiliary
    return tuple([*[base.h[...,i,j] for i,j in SYMMETRIC], np.log(base.lapse),
                  *[base.shift[...,i] for i in range(3)], .5*np.log(base.chi),
                  *[base.a[...,i,j] for i,j in SYMMETRIC], base.trace_k, base.theta,
                  *[base.conformal_gamma[...,i] for i in range(3)],
                  *[base.b[...,i] for i in range(3)], *aux.arrays()])


@dataclass(frozen=True)
class FOCheckpoint:
    header: dict
    slots: tuple[np.ndarray, ...]
    profile: FOCCZ4GaugeProfile | None
    tau_inverse: float = 0.0
    domain: SchwarzschildDomain | None = None

    def to_bytes(self):
        order = self.header.get("spatial_order", 2)
        version = checkpoint_version(order, self.profile, self.tau_inverse, self.domain)
        if self.header.get("version") != version or self.header.get("magic") != MAGIC:
            raise ValueError("checkpoint version/magic conflicts with spatial order/profile")
        header = dict(self.header)
        raw = HEADER.pack(*(header[name] for name in HEADER_NAMES))
        if order == 4 or version >= 4:
            raw += ORDER_HEADER.pack(order, int(self.profile is not None),
                                     self.profile.shift_scale if self.profile else 0.,
                                     self.profile.ordering_scale if self.profile else 0.)
        elif self.profile:
            raw += PROFILE_HEADER.pack(1,self.profile.shift_scale,self.profile.ordering_scale)
        if version >= 4:
            raw += CONTROL_HEADER.pack(int(self.tau_inverse > 0.), self.tau_inverse)
        if self.domain:
            raw += DOMAIN_HEADER.pack(1, 2, self.domain.lower, self.domain.upper, self.domain.mass)
        if len(self.slots) != 58 or any(slot.shape != (header["points"],)*3 for slot in self.slots):
            raise ValueError("checkpoint requires 58 complete cubic slots")
        raw += b"".join(np.asarray(slot,dtype="<f8",order="C").tobytes() for slot in self.slots)
        decode_checkpoint(raw,expected_profile=self.profile,expected_spatial_order=order,
                          expected_tau_inverse=self.tau_inverse, expected_domain=self.domain)
        return raw

    def to_state(self):
        # Revalidate mutable arrays/header rather than trusting dataclass freezing.
        checked = decode_checkpoint(self.to_bytes(),expected_profile=self.profile,
                                    expected_spatial_order=self.header.get("spatial_order",2),
                                    expected_tau_inverse=self.tau_inverse, expected_domain=self.domain)
        q, n = checked.slots, checked.header["points"]
        order = checked.header["spatial_order"]
        grid = (self.domain.grid(n, order) if self.domain else
                Grid3D((n,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=order))
        base = BSSNState3D.minkowski(grid)
        for offset,(i,j) in enumerate(SYMMETRIC):
            base.h[...,i,j] = base.h[...,j,i] = q[offset]
            base.a[...,i,j] = base.a[...,j,i] = q[11+offset]
        base.lapse[:] = np.exp(q[6])
        base.shift[:] = np.stack(q[7:10],axis=-1)
        base.chi[:] = np.exp(2.*q[10])
        base.trace_k[:], base.theta[:] = q[17],q[18]
        base.conformal_gamma[:] = np.stack(q[19:22],axis=-1)
        base.b[:] = np.stack(q[22:25],axis=-1)
        base.metadata = {"checkpoint_version": str(checked.header["version"]),
                         "checkpoint_spatial_order": str(order),
                         "checkpoint_step": str(checked.header["step"]),
                         "checkpoint_time": repr(checked.header["time"])}
        if self.profile:
            base.metadata[PROFILE_METADATA_KEY] = self.profile.identity()
        if self.tau_inverse > 0.:
            base.metadata[CONTROL_METADATA_KEY] = constraint_control_identity(self.tau_inverse)
        if self.domain:
            base.metadata[DOMAIN_KEY] = self.domain.identity()
        d = np.zeros((*base.grid.shape,3,3,3))
        for axis in range(3):
            for offset,(i,j) in enumerate(SYMMETRIC):
                d[...,axis,i,j] = d[...,axis,j,i] = q[37+6*axis+offset]
        auxiliary = FOCCZ4Auxiliary3D(
            lapse_gradient=np.stack(q[25:28],axis=-1),
            shift_gradient=np.stack(q[28:37],axis=-1).reshape((*base.grid.shape,3,3)),
            metric_gradient=d, conformal_factor_gradient=np.stack(q[55:58],axis=-1),
            derivative_order=order, source_state_sha256=hashlib.sha256(self.to_bytes()).hexdigest(),
            method="fo-ccz4-checkpoint-restored-not-reconstructed-v1")
        return FOCCZ4State3D(base,auxiliary)


def checkpoint_version(order, profile, tau_inverse=0.0, domain=None):
    rate = validate_tau_inverse(tau_inverse)
    if type(order) is not int or order not in (2,4):
        raise ValueError("checkpoint spatial order must be integer 2 or 4")
    if domain is not None and not isinstance(domain, SchwarzschildDomain):
        raise ValueError("explicit SchwarzschildDomain required")
    return 5 if domain else (4 if rate > 0. else (3 if order == 4 else (2 if profile else 1)))


def decode_checkpoint(raw: bytes, *, expected_profile: FOCCZ4GaugeProfile | None,
                      expected_spatial_order: int = 2, expected_tau_inverse: float = 0.0,
                      expected_domain: SchwarzschildDomain | None = None):
    checkpoint_version(expected_spatial_order, expected_profile, expected_tau_inverse)
    if len(raw) < HEADER.size:
        raise ValueError("checkpoint header truncated")
    h = dict(zip(HEADER_NAMES,HEADER.unpack_from(raw)))
    if h["magic"] != MAGIC or h["version"] not in (1,2,3,4,5) or h["dimension"] != 3:
        raise ValueError("checkpoint magic/version/dimension mismatch")
    if h["points"] < 5 or h["scenario"] not in (0,1,2) or h["formulation"] != 0 or h["solver_mode"] not in (0,1) or h["variable_count"] != 58:
        raise ValueError("checkpoint grid/scenario/formulation/solver/variable contract mismatch")
    if (h["scenario"] == 2) != (h["version"] == 5):
        raise ValueError("Schwarzschild scenario requires version 5 and explicit domain")
    if (not all(math.isfinite(h[name]) for name in ("dt","time","amplitude","wavelength"))
            or h["dt"] <= 0. or h["time"] < 0. or abs(h["amplitude"]) >= 1. or h["wavelength"] <= 0.):
        raise ValueError("checkpoint time/wave metadata invalid")
    offset, profile, tau_inverse = HEADER.size, None, 0.0
    h["spatial_order"] = 2
    if h["version"] == 2:
        if len(raw) < offset+PROFILE_HEADER.size:
            raise ValueError("checkpoint profile header truncated")
        code,a,k = PROFILE_HEADER.unpack_from(raw,offset)
        if code != 1 or h["solver_mode"] != 1:
            raise ValueError("checkpoint v2 requires known dynamic gauge profile")
        profile = FOCCZ4GaugeProfile(a,k)
        offset += PROFILE_HEADER.size
    elif h["version"] in (3,4,5):
        if len(raw) < offset+ORDER_HEADER.size:
            raise ValueError("checkpoint order extension truncated")
        order,code,a,k = ORDER_HEADER.unpack_from(raw,offset)
        if (order not in (2,4) or (h["version"] == 3 and order != 4) or code not in (0,1)):
            raise ValueError("checkpoint v3/v4 spatial order or profile id invalid")
        h["spatial_order"] = order
        if code == 1:
            if h["solver_mode"] != 1:
                raise ValueError("checkpoint profile requires dynamic solver")
            profile = FOCCZ4GaugeProfile(a,k)
        elif a != 0. or k != 0.:
            raise ValueError("checkpoint legacy profile requires zero reserved coefficients")
        offset += ORDER_HEADER.size
    if h["version"] in (4,5):
        if len(raw) < offset+CONTROL_HEADER.size:
            raise ValueError("checkpoint constraint control extension truncated")
        code, tau_inverse = CONTROL_HEADER.unpack_from(raw, offset)
        validate_tau_inverse(tau_inverse)
        if (code != int(tau_inverse > 0.) or (h["version"] == 4 and tau_inverse <= 0.)
                or h["solver_mode"] != 1):
            raise ValueError("checkpoint v4 requires positive relaxation and dynamic solver")
        offset += CONTROL_HEADER.size
    domain = None
    if h["version"] == 5:
        if len(raw) < offset + DOMAIN_HEADER.size:
            raise ValueError("checkpoint domain header truncated")
        code, layers, lower, upper, mass = DOMAIN_HEADER.unpack_from(raw, offset)
        if code != 1 or layers != 2 or h["points"] < 9 or h["amplitude"] != 0. or h["wavelength"] != 1.:
            raise ValueError("checkpoint Schwarzschild boundary/halo/reserved metadata invalid")
        domain = SchwarzschildDomain(lower, upper, mass)
        offset += DOMAIN_HEADER.size
    if domain != expected_domain:
        raise ValueError("checkpoint domain mismatch; explicitly select stored Schwarzschild domain")
    if tau_inverse != expected_tau_inverse:
        raise ValueError("checkpoint constraint control mismatch; explicitly select stored tau_inverse")
    if h["spatial_order"] != expected_spatial_order:
        raise ValueError("checkpoint spatial order mismatch; explicitly select stored order")
    if profile != expected_profile:
        raise ValueError("checkpoint gauge profile mismatch; explicitly select the stored profile")
    n = h["points"]
    if len(raw) != offset+58*n**3*8:
        raise ValueError("checkpoint payload length mismatch (truncated or trailing bytes)")
    values = np.frombuffer(raw,dtype="<f8",offset=offset).reshape((58,n,n,n))
    if not np.all(np.isfinite(values)):
        raise ValueError("checkpoint slots must be finite")
    with np.errstate(over="ignore",under="ignore",invalid="ignore"):
        alpha, chi = np.exp(values[6]), np.exp(2.*values[10])
        if not np.all(np.isfinite(alpha)) or not np.all(np.isfinite(chi)) or np.any(alpha<=0.) or np.any(chi<=0.):
            raise ValueError("checkpoint lapse/chi must be finite and positive")
        if profile:
            profile.coefficients(alpha,chi)
    metric = np.empty((n,n,n,3,3))
    for index,(i,j) in enumerate(SYMMETRIC):
        metric[...,i,j] = metric[...,j,i] = values[index]
    det = np.linalg.det(metric)
    if not np.all(np.isfinite(det)) or np.any(det<=1.e-12) or np.any(np.linalg.eigvalsh(metric)<=0.):
        raise ValueError("checkpoint conformal metric must be positive definite")
    if domain:
        require_analytic_halo(values, domain, h["spatial_order"])
    return FOCheckpoint(h,tuple(value.copy() for value in values),profile,tau_inverse,domain)


def checkpoint_from_state(state, *, profile, dt, step=0, time=0., scenario=0, amplitude=.001, wavelength=1.,
                          tau_inverse=0.0, domain=None):
    grid = state.grid
    if domain is not None:
        if (not isinstance(domain, SchwarzschildDomain) or grid.boundary != BOUNDARY
                or domain_from_state(state.base) != domain or scenario != 2
                or amplitude != 0. or wavelength != 1. or not np.all(state.base.valid_mask)):
            raise ValueError("explicit Schwarzschild scenario/domain/validity required")
    elif (grid.boundary != "periodic" or grid.spatial_order not in (2,4) or len(set(grid.shape)) != 1
            or tuple(grid.lower) != (0.,)*3 or tuple(grid.upper) != (1.,)*3 or not np.all(state.base.valid_mask)):
        raise ValueError("C++ checkpoint requires a complete second/fourth-order periodic unit cube")
    if state.auxiliary.derivative_order != grid.spatial_order:
        raise ValueError("checkpoint auxiliary spatial order mismatch")
    require_matching_gauge_profile(state.base.metadata,profile)
    require_matching_constraint_control(state.base.metadata,tau_inverse)
    header = dict(zip(HEADER_NAMES,(MAGIC,checkpoint_version(grid.spatial_order,profile,tau_inverse,domain),3,grid.shape[0],scenario,0,1,58,
                                   dt,time,amplitude,wavelength,step)))
    header["spatial_order"] = grid.spatial_order
    result = FOCheckpoint(header,state_slots(state),profile,tau_inverse,domain)
    result.to_bytes()
    return result

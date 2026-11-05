"""Vacuum initial data and independent metric diagnostics for a frozen audit.

The initial slice is a rotated harmonic gauge wave; time evolution uses the
solver's advective 1+log/Gamma-driver. The harmonic spacetime is NOT an exact
time-dependent reference for that different gauge. No solver equations live
here. Metric constraints use actual tr_gamma(K_ij), not the stored K alone.
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from .fo_ccz4_checkpoint import checkpoint_from_state, SYMMETRIC
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4State3D
from .nr3d import BSSNState3D, Grid3D

PROFILE = FOCCZ4GaugeProfile()
AMPLITUDE = .01
TIMES = (0., .125, .25)
FLOORS = {"H":5.e-11, "M":5.e-12, "A":5.e-12, "B":5.e-12,
          "D":5.e-12, "P":5.e-12, "Ghat":5.e-12, "Theta":5.e-13,
          "det_h":5.e-13, "trace_a":5.e-13}


def require(condition, message):
    if not condition:
        raise ValueError(message)


@dataclass(frozen=True)
class Case:
    order: int
    n: int
    rate: float
    steps_per_unit: int = 512
    wave: tuple[int,int,int] = (1,1,1)

    def __post_init__(self):
        require(type(self.order) is int and self.order in (2,4), "FD2/4 required")
        require(type(self.n) is int and self.n in (8,16,32), "N=8/16/32 required")
        require(type(self.rate) in (int,float) and self.rate in (0.,1.), "rate 0 or 1 required")
        require(type(self.steps_per_unit) is int and self.steps_per_unit in (64,128,256,512),
                "declared timestep required")
        require(self.wave in ((1,0,0),(1,1,1)), "axis/oblique wave required")

    @property
    def label(self):
        return f"fd{self.order}-n{self.n}-rate{self.rate:g}-s{self.steps_per_unit}-k{''.join(map(str,self.wave))}"


SPATIAL = tuple(Case(o,n,r) for o in (2,4) for r in (0.,1.) for n in (8,16,32))
TEMPORAL = tuple(Case(o,16,r,s) for o in (2,4) for r in (0.,1.) for s in (64,128,256))
AXIS = tuple(Case(o,16,1.,512,(1,0,0)) for o in (2,4))
CASES = SPATIAL+TEMPORAL+AXIS


def initial(case):
    grid = Grid3D((case.n,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=case.order)
    base = BSSNState3D.minkowski(grid)
    k = np.asarray(case.wave,dtype=float)
    length = np.linalg.norm(k)
    direction = k/length
    nn = np.outer(direction,direction)
    phase = 2*np.pi*sum(ki*x for ki,x in zip(k,grid.coordinates))
    h = 1.-AMPLITUDE*np.sin(phase)
    ht = 2*np.pi*length*AMPLITUDE*np.cos(phase)
    metric = np.eye(3)+(h-1.)[...,None,None]*nn
    curvature = (-ht/(2*np.sqrt(h)))[...,None,None]*nn
    base.chi[:] = h**(-1./3.)
    base.lapse[:] = np.sqrt(h)
    base.h[:] = base.chi[...,None,None]*metric
    base.trace_k[:] = -ht/(2*h**1.5)
    base.a[:] = base.chi[...,None,None]*(curvature-metric*base.trace_k[...,None,None]/3.)
    base.conformal_gamma[:] = (-2*ht/(3*h**(5./3.)))[...,None]*direction
    base.metadata = {"initial_data":"rotated-vacuum-harmonic-gauge-wave-slice",
                     "wave_vector":str(case.wave),"amplitude":repr(AMPLITUDE),
                     "evolution_gauge":"1+log-not-harmonic-analytic-time-reference"}
    return checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE,
        tau_inverse=case.rate,dt=1./case.steps_per_unit,scenario=1,amplitude=AMPLITUDE,wavelength=1.)


def derivative(field,axis,order):
    """Fourier symbol of centered FD2/4, independent of production stencils."""
    q = np.asarray(field)
    require(q.ndim >= 3 and len(set(q.shape[:3])) == 1 and q.shape[0] >= 5
            and axis in (0,1,2) and type(order) is int and order in (2,4)
            and not np.iscomplexobj(q) and np.all(np.isfinite(q)), "real finite cubic FD field required")
    n = q.shape[axis]
    phase = 2*np.pi*np.fft.fftfreq(n)
    symbol = n*np.sin(phase) if order == 2 else n*(8*np.sin(phase)-np.sin(2*phase))/6.
    if n%2 == 0:
        symbol[n//2] = 0.  # The centered derivative of a Nyquist mode is exactly zero.
    shape = [1]*q.ndim
    shape[axis] = n
    return np.fft.ifft(1j*symbol.reshape(shape)*np.fft.fft(q,axis=axis),axis=axis).real


def symmetric(q,offset):
    out = np.empty((*q[0].shape,3,3))
    for index,(i,j) in enumerate(SYMMETRIC):
        out[...,i,j] = out[...,j,i] = q[offset+index]
    return out


def christoffel(metric,inverse,order):
    dmetric = [derivative(metric,k,order) for k in range(3)]
    result = np.zeros((*metric.shape[:-2],3,3,3))
    for up in range(3):
        for i in range(3):
            for j in range(3):
                result[...,up,i,j] = .5*sum(inverse[...,up,ell]*(dmetric[i][...,ell,j]
                    + dmetric[j][...,ell,i] - dmetric[ell][...,i,j]) for ell in range(3))
    return result


def constraint_fields(data):
    """Direct g/K Christoffel/Ricci/ADM constraints; no evolved Gamma/aux RHS."""
    q,order = data.slots,data.header["spatial_order"]
    require(len(q) == 58 and all(np.all(np.isfinite(v)) for v in q), "58 finite slots required")
    h,a = symmetric(q,0),symmetric(q,11)
    chi = np.exp(2*q[10])
    g = h/chi[...,None,None]
    gi = np.linalg.inv(g)
    curvature = (a+h*q[17][...,None,None]/3.)/chi[...,None,None]
    mixed = gi@curvature
    actual_trace = np.trace(mixed,axis1=-2,axis2=-1)
    gamma = christoffel(g,gi,order)
    dg = [derivative(gamma,k,order) for k in range(3)]
    ricci = np.zeros_like(g)
    for i in range(3):
        for j in range(3):
            for k in range(3):
                ricci[...,i,j] += dg[k][...,k,i,j]-dg[j][...,k,i,k]
                for ell in range(3):
                    ricci[...,i,j] += (gamma[...,k,i,j]*gamma[...,ell,k,ell]
                                       - gamma[...,ell,i,k]*gamma[...,k,j,ell])
    hamiltonian = np.einsum("...ij,...ij->...",gi,ricci)+actual_trace**2-np.einsum("...ij,...ji->...",mixed,mixed)
    dm = [derivative(mixed,k,order) for k in range(3)]
    momentum = np.stack([sum(dm[j][...,j,i] for j in range(3))-derivative(actual_trace,i,order)
        + sum(gamma[...,j,j,ell]*mixed[...,ell,i]-gamma[...,ell,j,i]*mixed[...,j,ell]
              for j in range(3) for ell in range(3)) for i in range(3)],axis=-1)
    hi = np.linalg.inv(h)
    metric_gamma = np.einsum("...jk,...ijk->...i",hi,christoffel(h,hi,order))
    fields = {"H":hamiltonian,"M":momentum,"det_h":np.linalg.det(h)-1.,
              "trace_a":np.einsum("...ij,...ij->...",hi,a),"Theta":q[18],
              "Ghat":np.stack(q[19:22],axis=-1)-metric_gamma,
              "A":np.stack([q[25+i]-derivative(q[6],i,order) for i in range(3)],axis=-1),
              "B":np.stack([q[28+3*i+j]-derivative(q[7+j],i,order)
                            for i in range(3) for j in range(3)],axis=-1),
              "D":np.stack([q[37+6*i+j]-.5*derivative(q[j],i,order)
                            for i in range(3) for j in range(6)],axis=-1),
              "P":np.stack([q[55+i]-derivative(q[10],i,order) for i in range(3)],axis=-1)}
    require(all(np.all(np.isfinite(v)) for v in fields.values()),"nonfinite constraint diagnostic")
    return fields


def norms(fields):
    return {k:{"l2":float(np.sqrt(np.mean(v*v))),"linf":float(np.max(abs(v)))} for k,v in fields.items()}


def constraint_order(values,order,name):
    require(len(values) == 3 and name in FLOORS and order in (2,4)
            and all(math.isfinite(v) and v >= 0. for v in values),"three finite norms required")
    floor = FLOORS[name]
    if max(values) <= floor:
        return {"status":"bounded-null","orders":None,"passed":True,"values":values,"floor":floor}
    if min(values) <= floor:
        return {"status":"floor-limited","orders":None,"passed":False,"values":values,"floor":floor}
    orders = [math.log2(a/b) for a,b in zip(values,values[1:])]
    return {"status":"measured","orders":orders,"passed":min(orders) >= (1.5 if order == 2 else 3.0),
            "values":values,"floor":floor}


def difference_order(a,b,c,*,order,temporal=False):
    require(a.shape == b.shape == c.shape and all(np.all(np.isfinite(q)) for q in (a,b,c)),
            "equal-shaped finite state arrays required")
    errors = [float(np.sqrt(np.mean((x-y)**2))) for x,y in ((a,b),(b,c))]
    if min(errors) <= 2.e-12:
        return {"status":"floor-limited","errors":errors,"order":None,"passed":False}
    observed = math.log2(errors[0]/errors[1])
    target = 3.5 if temporal else (1.5 if order == 2 else 3.0)
    return {"status":"measured","errors":errors,"order":observed,"minimum_order":target,
            "passed":observed >= target}

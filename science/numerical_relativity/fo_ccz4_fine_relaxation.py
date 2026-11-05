"""Additive N16/24/32 experiment; never changes the frozen coarse-grid audit.

For u(h) = u_exact + c h**p + o(h**p), consecutive state-difference
norms have ratio ((24/16)**p - 1) / (1 - (24/32)**p). Equal-grid log2
is incorrect here. Alignment is checked separately from that scalar fit.
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from .fo_ccz4_relaxation_convergence import FLOORS, initial, require

RESOLUTIONS = (16, 24, 32)
TIMES = (0., .125, .25)
STATE_FLOOR = 2.e-12
ALIGNMENT_MIN = .99
TIME_RATIO_MAX = .05


@dataclass(frozen=True)
class FineCase:
    order: int
    n: int
    rate: float
    steps_per_unit: int = 512
    wave: tuple[int, int, int] = (1, 1, 1)

    def __post_init__(self):
        require(type(self.order) is int and self.order in (2, 4), "FD2/4 required")
        require(type(self.n) is int and self.n in RESOLUTIONS, "N16/24/32 required")
        require(type(self.rate) in (int, float) and self.rate in (0., 1.), "rate 0/1 required")
        require(type(self.steps_per_unit) is int and self.steps_per_unit in (512, 1024),
                "declared fine-grid timestep required")
        require(self.wave == (1, 1, 1), "oblique wave only")
        require(self.steps_per_unit == 512 or self.n in (24, 32), "time controls only N24/32")

    @property
    def label(self):
        return f"fd{self.order}-n{self.n}-rate{self.rate:g}-s{self.steps_per_unit}-k111"


SPATIAL = tuple(FineCase(o, n, r) for o in (2, 4) for r in (0., 1.) for n in RESOLUTIONS)
REFINED_TIME = tuple(FineCase(o, n, r, 1024) for o in (2, 4) for r in (0., 1.) for n in (24, 32))
CASES = SPATIAL + REFINED_TIME
RETAINED = tuple(c for c in SPATIAL if c.n in (16, 32))
FRESH = tuple(c for c in CASES if c not in RETAINED)


def initial_data(case):
    require(isinstance(case, FineCase), "explicit fine-study case required")
    return initial(case)  # Same analytic slice and centered auxiliaries; no policy change.


def constraint_orders(values, spatial_order, name):
    require(spatial_order in (2, 4) and name in FLOORS and len(values) == 3
            and all(math.isfinite(v) and v >= 0. for v in values), "three finite constraint norms required")
    floor = FLOORS[name]
    result = {"values": list(values), "floor": floor, "observed_orders": None,
              "minimum_order": 1.5 if spatial_order == 2 else 3., "passed": False}
    if max(values) <= floor:
        return {**result, "status": "bounded-null", "passed": True}
    if min(values) <= floor:
        return {**result, "status": "floor-limited"}
    orders = [math.log(values[i]/values[i+1])/math.log(RESOLUTIONS[i+1]/RESOLUTIONS[i])
              for i in range(2)]
    return {**result, "status": "measured", "observed_orders": orders,
            "passed": min(orders) >= result["minimum_order"]}


def richardson_ratio(p):
    require(math.isfinite(p) and 0. <= p <= 12., "fit order must be in [0,12]")
    if p == 0.:
        return math.log(1.5)/math.log(4./3.)
    return math.expm1(p*math.log(1.5)) / -math.expm1(p*math.log(.75))


def fit_order(ratio):
    require(math.isfinite(ratio) and ratio > 0., "positive finite difference ratio required")
    if not richardson_ratio(0.) < ratio < richardson_ratio(12.):
        return None
    low, high = 0., 12.
    for _ in range(64):
        middle = (low+high)/2.
        if richardson_ratio(middle) < ratio:
            low = middle
        else:
            high = middle
    return (low+high)/2.


def rms(field):
    require(np.size(field) > 0 and np.all(np.isfinite(field)), "finite nonempty field required")
    value = float(np.sqrt(np.mean(np.square(field))))
    require(math.isfinite(value), "overflowed field norm")
    return value


def state_orders(states, spatial_order):
    require(spatial_order in (2, 4) and len(states) == 3
            and states[0].shape == states[1].shape == states[2].shape,
            "three common-grid state arrays required")
    d1, d2 = states[0]-states[1], states[1]-states[2]
    errors = [rms(d1), rms(d2)]
    result = {"errors": errors, "observed_order": None, "alignment": None,
              "alignment_minimum": ALIGNMENT_MIN, "minimum_order": 1.5 if spatial_order == 2 else 3.,
              "passed": False}
    if min(errors) <= STATE_FLOOR:
        return {**result, "status": "floor-limited"}
    ratio = errors[0]/errors[1]
    observed = fit_order(ratio)
    alignment = float(np.mean((d1/errors[0])*(d2/errors[1])))
    require(math.isfinite(alignment), "nonfinite error direction alignment")
    return {**result, "status": "measured" if observed is not None else "outside-positive-fit-range",
            "difference_ratio": ratio, "observed_order": observed, "alignment": alignment,
            "passed": observed is not None and observed >= result["minimum_order"]
                      and alignment >= ALIGNMENT_MIN}


def signed_time_control(coarse, fine, floor):
    require(coarse.shape == fine.shape and math.isfinite(floor) and floor > 0.,
            "matching time-control fields and positive floor required")
    difference = rms(coarse-fine)
    values = [rms(coarse), rms(fine)]
    if max(values) <= floor:
        return {"status": "bounded-null", "norms": values, "difference": difference,
                "ratio": None, "passed": True}
    ratio = difference/max(values[0], floor)
    return {"status": "measured", "norms": values, "difference": difference,
            "ratio": ratio, "passed": ratio <= TIME_RATIO_MAX}

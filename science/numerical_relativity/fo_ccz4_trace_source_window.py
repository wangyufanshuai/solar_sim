"""Prospective, off-constraint trace-source control; never a physics admission.

No evolution equations live here. Stored coordinate trace, geometric trace,
and the ADM trace of reconstructed K_ij are deliberately distinct.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, replace
import math

import numpy as np

from .constraints3d import constraint_report_3d
from .fo_ccz4_checkpoint import checkpoint_from_state, decode_checkpoint
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4State3D
from .nr3d import BSSNState3D, Grid3D

PROFILE = FOCCZ4GaugeProfile()
TIMES = (0., .25, .5, .75, 1.)
AMPLITUDES = (1.e-6, 2.e-6, 4.e-6)
WAVES = ((1, 0, 0), (0, 1, 0), (0, 0, 1), (1, 1, 1))
FLOOR, RELATIVE_LIMIT, PARITY_LIMIT = 1.e-12, .005, 2.e-12


@dataclass(frozen=True)
class Case:
    order: int
    n: int
    wave: tuple[int, int, int]
    family: str
    amplitude: float
    steps_per_unit: int = 256

    @property
    def label(self):
        return (f"fd{self.order}-n{self.n}-k{''.join(map(str, self.wave))}-"
                f"{self.family}-a{self.amplitude:.0e}-s{self.steps_per_unit}")

    def record(self):
        return {**asdict(self), "wave": list(self.wave), "label": self.label}


CASES = tuple(Case(o, 8, k, f, a) for o in (2, 4) for k in WAVES
              for f in ("trace", "tracefree") for a in AMPLITUDES) + tuple(
    Case(o, 8, WAVES[-1], f, AMPLITUDES[1], 512)
    for o in (2, 4) for f in ("trace", "tracefree")) + tuple(
    Case(o, n, WAVES[-1], f, AMPLITUDES[1])
    for o in (2, 4) for n in (12, 16) for f in ("trace", "tracefree")) + tuple(
    Case(o, 8, (0, 0, 0), "flat", 0.) for o in (2, 4))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def d1(values, axis, order):
    """Independent paired periodic stencil on a unit cube, including tensors."""
    q = np.asarray(values)
    require(q.ndim >= 3 and len(set(q.shape[:3])) == 1 and q.shape[0] >= 5
            and axis in (0, 1, 2) and type(order) is int and order in (2, 4)
            and not np.iscomplexobj(q) and np.all(np.isfinite(q)),
            "finite cubic real field, Cartesian axis and FD2/4 required")
    near = np.roll(q, -1, axis) - np.roll(q, 1, axis)
    if order == 2:
        return near * (.5*q.shape[0])
    far = np.roll(q, -2, axis) - np.roll(q, 2, axis)
    return (8*near - far) * (q.shape[0]/12.)


def mode(case):
    phase = sum(k*x for k, x in zip(case.wave, np.indices((case.n,)*3))) / case.n
    return case.amplitude*np.sin(2*np.pi*phase)


def initial(case):
    require(case in CASES, "undeclared case")
    grid = Grid3D((case.n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=case.order)
    data = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid)),
                                 profile=PROFILE, dt=1./case.steps_per_unit,
                                 amplitude=case.amplitude, scenario=0, wavelength=1.)
    q = [v.copy() for v in data.slots]
    f = mode(case)
    if case.family == "trace":
        q[11], q[14], q[16] = f/3., f/3., f/3.
    elif case.family == "tracefree":
        q[11], q[14] = f/math.sqrt(6.), -f/math.sqrt(6.)
    # Both perturbations have Frobenius norm squared f^2/3. Neither is a
    # constraint-satisfying wave. No auxiliary reconstruction follows this edit.
    data = replace(data, slots=tuple(q))
    return decode_checkpoint(data.to_bytes(), expected_profile=PROFILE, expected_spatial_order=case.order)


def residual(slots, order):
    require(len(slots) == 58 and all(q.shape == slots[0].shape and np.all(np.isfinite(q))
                                   for q in slots), "58 finite equal-shaped slots required")
    return np.stack([slots[25+i] - d1(slots[6], i, order) for i in range(3)])


def source_prediction(data, time):
    require(math.isfinite(time) and time >= 0., "finite nonnegative time required")
    trace = data.slots[11] + data.slots[14] + data.slots[16]
    return residual(data.slots, data.header["spatial_order"]) - 2*time*np.stack([
        d1(trace, i, data.header["spatial_order"]) for i in range(3)])


def metric_constraints(data):
    """Metric-only diagnostic, independent of evolved FO derivative slots.

    The retained reporter substitutes the stored K in H and M. Away from
    tr_h(A)=0, actual tr_gamma(K_ij)=K+tr_h(A). Preserve the old report and add
    the exact off-algebraic-constraint conversion; do not relabel old evidence.
    Spatial geometry still shares the existing metric Ricci implementation.
    """
    base = data.to_state().base
    report = constraint_report_3d(base)
    actual_trace = base.trace_k + report.trace_a
    h = report.hamiltonian + actual_trace**2 - base.trace_k**2
    m = report.momentum - np.stack([d1(report.trace_a, i, data.header["spatial_order"])
                                    for i in range(3)], axis=-1)
    return report, h, m


def norm_summary(h, m):
    return {"hamiltonian_l_inf": float(np.max(abs(h))),
            "hamiltonian_l2": float(np.sqrt(np.mean(h*h))),
            "momentum_l_inf": float(np.max(abs(m))),
            "momentum_l2": float(np.sqrt(np.mean(m*m)))}


def initial_oracle(case, data):
    require(data.header["time"] == data.header["step"] == 0, "initial oracle requires time zero")
    weights = (1./3.,)*3 if case.family == "trace" else (
        (1./math.sqrt(6.), -1./math.sqrt(6.), 0.) if case.family == "tracefree" else (0.,)*3)
    f, total, square = mode(case), sum(weights), sum(w*w for w in weights)
    report, h, m = metric_constraints(data)
    predicted_m = np.stack([(w-total)*d1(f, i, case.order) for i, w in enumerate(weights)], axis=-1)
    stored_m = np.stack([w*d1(f, i, case.order) for i, w in enumerate(weights)], axis=-1)
    errors = {"ADM_H": float(np.max(abs(h-(total**2-square)*f*f))),
              "ADM_M": float(np.max(abs(m-predicted_m))),
              "stored_H": float(np.max(abs(report.hamiltonian+square*f*f))),
              "stored_M": float(np.max(abs(report.momentum-stored_m)))}
    require(max(errors.values()) <= 5.e-13, "flat initial constraint oracle mismatch")
    return errors


def observe(case, data, seed):
    expected = initial_header(case, data.header["time"])
    require(data.header == {**seed.header, **expected} and data.profile == seed.profile == PROFILE,
            "sample metadata mismatch")
    t = data.header["time"]
    c = residual(data.slots, case.order)
    p = source_prediction(seed, t)
    reference = -2*t*np.stack([d1(mode(case), i, case.order) for i in range(3)])
    peak, error = float(np.max(abs(c))), float(np.max(abs(c-p)))
    reference_peak = float(np.max(abs(reference)))
    slope = float(np.vdot(c, p).real/np.vdot(p, p).real) if case.family == "trace" and t > 0. else None
    xyz = np.indices((case.n,)*3)/case.n
    phase = sum(k*x for k, x in zip(case.wave, xyz))
    continuum = np.stack([-4*np.pi*t*case.amplitude*k*np.cos(2*np.pi*phase) for k in case.wave])
    report, adm_h, adm_m = metric_constraints(data)
    base = data.to_state().base
    inverse = np.linalg.inv(base.h)
    f, _ = PROFILE.coefficients(base.lapse, base.chi)
    speeds = abs(base.shift) + np.sqrt((4./3.)*f[..., None]*np.diagonal(inverse, axis1=-2, axis2=-1))
    cfl = float(data.header["dt"]*case.n*np.sum(np.max(speeds, axis=(0, 1, 2))))
    domain = [float(np.min(base.lapse)), float(np.max(base.lapse)), float(np.min(base.chi)),
              float(np.min(np.linalg.eigvalsh(base.h))), cfl]
    tr0 = seed.slots[11] + seed.slots[14] + seed.slots[16]
    tr = data.slots[11] + data.slots[14] + data.slots[16]
    stored, adm = dict(report.norms), norm_summary(adm_h, adm_m)
    magnitude = max(abs(float(v)) for v in (*stored.values(), *adm.values()))
    values = [peak, error, reference_peak, magnitude, *domain]
    gates = {
        "finite": bool(np.all(np.isfinite(values))),
        "sampled_domain": 0. < domain[0] <= domain[1] < 2. and min(domain[2:4]) > 0.,
        "sampled_cfl": 0. <= cfl <= .45,
        "constraint_safety_ceiling": magnitude <= .01,
        "signed_source_prediction": error <= FLOOR + RELATIVE_LIMIT*reference_peak,
        "signed_slope": slope is None or abs(slope - 1.) <= RELATIVE_LIMIT,
        "flat_exact": case.family != "flat" or all(np.array_equal(a, b) for a, b in zip(data.slots, seed.slots)),
    }
    return {"time": t, "step": data.header["step"], "A_residual_peak": peak,
            "prediction_error": error, "matched_trace_reference_peak": reference_peak,
            "signed_slope": slope, "continuum_source_error": float(np.max(abs(c-continuum)))
            if case.family == "trace" else None,
            "coordinate_trace_drift": float(np.max(abs(tr-tr0))),
            "stored_K_metric_constraints": stored, "reconstructed_ADM_constraints": adm,
            "min_lapse": domain[0], "max_lapse": domain[1], "min_chi": domain[2],
            "min_metric_eigenvalue": domain[3], "sampled_cfl": cfl,
            "gates": gates, "sample_passed": all(gates.values()),
            "rk_stage_cfl_monitored": False, "runtime_writeback": False}


def initial_header(case, time):
    require(time in TIMES, "unscheduled sample")
    return {"time": time, "step": round(time*case.steps_per_unit)}


def remainder_scaling(errors):
    require(len(errors) == 3 and all(math.isfinite(v) and v >= 0. for v in errors),
            "three finite nonnegative errors required")
    if min(errors) <= FLOOR:
        return {"status": "inconclusive-roundoff-floor", "errors": list(errors), "orders": [], "passed": False}
    orders = [math.log(b/a, 2.) for a, b in zip(errors, errors[1:])]
    passed = all(1.7 <= p <= 2.3 for p in orders)
    return {"status": "pass" if passed else "fail", "errors": list(errors), "orders": orders, "passed": passed}


def temporal_comparison(coarse, fine, amplitude):
    for key in ("time", "points", "amplitude", "spatial_order", "scenario", "wavelength"):
        require(coarse.header[key] == fine.header[key], "temporal metadata mismatch")
    require(coarse.header["dt"] == 2*fine.header["dt"] and coarse.header["step"]*2 == fine.header["step"]
            and coarse.profile == fine.profile == PROFILE and amplitude == coarse.header["amplitude"] > 0.,
            "temporal control identity mismatch")
    field_error = max(float(np.max(abs(a-b))) for a, b in zip(coarse.slots, fine.slots))
    order = coarse.header["spatial_order"]
    residual_error = float(np.max(abs(residual(coarse.slots, order)-residual(fine.slots, order))))
    a, h_a, m_a = metric_constraints(coarse)
    b, h_b, m_b = metric_constraints(fine)
    constraints = {}
    for name, x, y in (("stored_H", a.hamiltonian, b.hamiltonian), ("stored_M", a.momentum, b.momentum),
                       ("ADM_H", h_a, h_b), ("ADM_M", m_a, m_b)):
        delta = float(np.max(abs(x-y)))
        bound = FLOOR + .01*max(float(np.max(abs(x))), float(np.max(abs(y))))
        constraints[name] = {"difference": delta, "bound": bound, "passed": delta <= bound}
    return {"field_max_abs_error": field_error, "field_bound": FLOOR + .01*amplitude,
            "A_residual_max_abs_error": residual_error, "residual_bound": FLOOR + .01*amplitude,
            "constraints": constraints,
            "passed": field_error <= FLOOR + .01*amplitude and residual_error <= FLOOR + .01*amplitude
            and all(v["passed"] for v in constraints.values())}


def assess(rows, temporal):
    require(len(rows) == len(CASES) and {r["label"] for r in rows} == {c.label for c in CASES},
            "all 62 frozen cases required exactly once")
    indexed = {r["label"]: r for r in rows}
    for case in CASES:
        row = indexed[case.label]
        require(all(row[k] == v for k, v in case.record().items()), "case metadata drift")
        require([s["time"] for s in row["samples"]] == list(TIMES), "all five samples required")
        require(all(s["step"] == t*case.steps_per_unit and s["sample_passed"] is True
                    and all(s["gates"].values()) for s, t in zip(row["samples"], TIMES)), "sample gate failed")
    scaling = []
    for order in (2, 4):
        for wave in WAVES:
            for family in ("trace", "tracefree"):
                errors = [indexed[Case(order, 8, wave, family, a).label]["samples"][-1]["prediction_error"]
                          for a in AMPLITUDES]
                scaling.append({"order": order, "wave": list(wave), "family": family, **remainder_scaling(errors)})
    spatial = []
    for order in (2, 4):
        errors = [indexed[Case(order, n, WAVES[-1], "trace", AMPLITUDES[1]).label]["samples"][-1]["continuum_source_error"]
                  for n in (8, 12, 16)]
        require(all(math.isfinite(e) and e > FLOOR for e in errors), "unmeasurable spatial source errors")
        orders = [math.log(a/b)/math.log(n2/n1) for a, b, n1, n2 in zip(errors, errors[1:], (8, 12), (12, 16))]
        lo, hi = (1.8, 2.2) if order == 2 else (3.5, 4.3)
        spatial.append({"order": order, "errors": errors, "observed_orders": orders,
                        "passed": all(lo <= p <= hi for p in orders)})
    temporal_keys = {(o, f) for o in (2, 4) for f in ("trace", "tracefree")}
    require(len(temporal) == 4 and {(t["order"], t["family"]) for t in temporal} == temporal_keys,
            "four temporal controls required")
    gates = {"sampled_source_and_suppression": True,
             "quadratic_remainder_scaling": all(s["passed"] for s in scaling),
             "continuum_source_spatial_order": all(s["passed"] for s in spatial),
             "step_halving": all(t["passed"] for t in temporal)}
    return {"scaling": scaling, "spatial": spatial, "temporal": temporal, "gates": gates,
            "prospective_trace_source_screen_passed": all(gates.values()),
            "physical_validation": False, "constraint_decay_validated": False,
            "strong_hyperbolicity_validated": False, "runtime_writeback": False}

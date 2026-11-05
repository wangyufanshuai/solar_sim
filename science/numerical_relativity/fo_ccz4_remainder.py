"""Predeclared small-amplitude remainder gates; never a physical NR certificate."""
from __future__ import annotations

import numpy as np

POINTS = (9, 13, 17, 25)
AMPLITUDE = 1.e-4
STEPS = 512
TIMES = tuple(i/8. for i in range(9))
FIELDS = ("H_primary", "H_fourier", "M_x", "Theta")
FLOOR = 1.e-12
CASES = tuple(("space", n, AMPLITUDE, STEPS) for n in POINTS) + (
    ("amplitude", 13, AMPLITUDE/2., STEPS),
    ("amplitude", 13, AMPLITUDE/4., STEPS),
    ("time", 13, AMPLITUDE, STEPS*2),
)


def case_key(row):
    return row["family"], row["points"], row["amplitude"], row["steps"]


def series(row, field):
    """Retain signed fields and every nonzero-time sample, never just norms."""
    values = np.asarray([sample["planes"][field] for sample in row["samples"][1:]], dtype=float)
    if values.shape != (8, row["points"]) or not np.all(np.isfinite(values)):
        raise ValueError("finite, complete signed plane fields required")
    return values


def rms(values):
    return float(np.sqrt(np.mean(np.asarray(values)**2)))


def observed_orders(values, refinement):
    return [float(np.log(a/b)/np.log(r)) if min(a, b) > FLOOR else None
            for a, b, r in zip(values[:-1], values[1:], refinement)]


def _validate(rows):
    keys = [case_key(row) for row in rows]
    if len(keys) != len(CASES) or set(keys) != set(CASES):
        raise ValueError("all seven frozen cases exactly once are required")
    for row in rows:
        if (row["dt"] != 1./row["steps"] or len(row["samples"]) != 9
                or tuple(s["time"] for s in row["samples"]) != TIMES
                or tuple(s["step"] for s in row["samples"]) != tuple(int(t*row["steps"]) for t in TIMES)):
            raise ValueError("matched steps, time steps and all nine sample times required")
        for field in FIELDS:
            series(row, field)


def assess_remainder(rows):
    """Uniform sampled-window RMS/peak, amplitude-field collapse and dt separation.

    Spatial gates use every adjacent pair, including the deliberately coarse 9/13.
    Passing these bounded gates is neither a continuous-time supremum nor an AwA
    benchmark, global convergence theorem, hyperbolicity proof or promotion gate.
    """
    _validate(rows)
    lookup = {case_key(row): row for row in rows}
    spatial_rows = [lookup["space", n, AMPLITUDE, STEPS] for n in POINTS]
    amp_rows = [lookup["space", 13, AMPLITUDE, STEPS],
                lookup["amplitude", 13, AMPLITUDE/2., STEPS],
                lookup["amplitude", 13, AMPLITUDE/4., STEPS]]
    time_row = lookup["time", 13, AMPLITUDE, STEPS*2]
    spatial, amplitude, temporal = {}, {}, {}
    refinement = [b/a for a, b in zip(POINTS[:-1], POINTS[1:])]
    for field in FIELDS:
        arrays = [series(row, field) for row in spatial_rows]
        norms = [rms(value) for value in arrays]
        peaks = [float(np.max(np.sqrt(np.mean(value**2, axis=1)))) for value in arrays]
        orders = observed_orders(norms, refinement)
        peak_orders = observed_orders(peaks, refinement)
        spatial[field] = {"window_rms": norms, "peak_sample_l2": peaks,
                          "orders": orders, "peak_orders": peak_orders,
                          "pointwise_orders": [observed_orders([rms(v[i]) for v in arrays], refinement) for i in range(8)],
                          "passed": all(p is not None and p >= 1.5 for p in orders+peak_orders)}
        amp_arrays = [series(row, field) for row in amp_rows]
        amp_norms = [rms(value) for value in amp_arrays]
        amp_orders = observed_orders(amp_norms, [2., 2.])
        # Compare complete signed fields. A sign/phase reversal cannot pass via equal norms.
        collapse = [rms(value*(AMPLITUDE/row["amplitude"])**2-amp_arrays[0])/amp_norms[0]
                    if amp_norms[0] > FLOOR else None for row, value in zip(amp_rows[1:], amp_arrays[1:])]
        amplitude[field] = {"window_rms": amp_norms, "amplitude_orders": amp_orders,
                            "scaled_signed_field_errors": collapse,
                            "passed": (all(p is not None and 1.8 <= p <= 2.2 for p in amp_orders)
                                       and all(e is not None and e <= .05 for e in collapse))}
        coarse, fine = amp_arrays[0], series(time_row, field)
        reference = rms(fine)
        fraction = rms(coarse-fine)/reference if reference > FLOOR else None
        by_time = [rms(a-b)/rms(b) if rms(b) > FLOOR else None for a, b in zip(coarse, fine)]
        temporal[field] = {"field_difference_rms": rms(coarse-fine), "reference_rms": reference,
                           "fraction": fraction, "fractions_by_time": by_time,
                           "passed": (fraction is not None and fraction <= .01
                                      and all(e is not None and e <= .01 for e in by_time))}
    samples = [s for row in rows for s in row["samples"]]
    cfl = [s["sampled_cfl_sum"] for s in samples]
    if not np.all(np.isfinite(cfl)) or min(cfl) < 0.:
        raise ValueError("finite non-negative CFL samples required")
    result = {"spatial": spatial, "amplitude": amplitude, "temporal": temporal,
              "sampled_domain_passed": all(s["finite_positive"] is True for s in samples),
              "max_sampled_cfl": max(cfl), "sampled_cfl_passed": max(cfl) <= .45,
              "max_sampled_constraint": max(abs(v) for row in rows for f in FIELDS for v in series(row, f).flat),
              "continuous_window_convergence_validated": False,
              "physical_validation": False, "runtime_writeback": False}
    result["bounded_remainder_gates_passed"] = bool(
        all(r["passed"] for group in (spatial, amplitude, temporal) for r in group.values())
        and result["sampled_domain_passed"] and result["sampled_cfl_passed"]
        and result["max_sampled_constraint"] <= 1.e-3)
    return result

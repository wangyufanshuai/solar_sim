"""Frozen, sampled FD4 full-cube noise screen; not a well-posedness proof."""
from __future__ import annotations

import numpy as np

POINTS = (8, 12, 16)  # Even grids retain the Nyquist/checkerboard modes.
SEEDS = (20261007, 20261008)
TIMES = tuple(float(t) for t in range(11))
CASES = tuple(("noise", n, seed, 256) for seed in SEEDS for n in POINTS) + (
    ("time", 12, SEEDS[0], 512), ("minkowski", 6, 0, 256),
)
FLOOR, GROWTH_LIMIT, RESOLUTION_RATIO_LIMIT = 1.e-13, 100., 2.
TEMPORAL_LIMIT, ABSOLUTE_LIMIT, CFL_LIMIT = .01, 1.e-3, .45
CONSTRAINT_NAMES = ("hamiltonian_l_inf", "hamiltonian_l2", "momentum_l_inf",
                    "momentum_l2", "det_h_l_inf", "trace_a_l_inf",
                    "conformal_gamma_l_inf", "theta_l_inf")
SUPPLEMENTAL = ("ordering_max_curl_l_inf", "ordering_max_algebraic_l_inf",
                "max_auxiliary_reduction_l_inf")


def case_key(row):
    return row["family"], row["points"], row["seed"], row["steps_per_unit"]


def noise_amplitude(points):
    return 1.e-10*(8./points)**2


def slot_norms(slots):
    if len(slots) != 58 or any(not np.all(np.isfinite(q)) for q in slots):
        raise ValueError("all 58 finite slots required")
    return [float(np.sqrt(np.mean((q-(1. if i in (0, 3, 5) else 0.))**2)))
            for i, q in enumerate(slots)]


def signed_comparison(left, right, initial):
    """No subtraction of norms: compare signed fields, including their phase.

    The denominator max(initial norm, fine norm) avoids division by a decayed
    field. An unmeasurable initial field fails; no epsilon replacement occurs.
    """
    a, b, c = (np.asarray(v, dtype=float) for v in (left, right, initial))
    if a.shape != b.shape or a.shape != c.shape or not all(np.all(np.isfinite(v)) for v in (a, b, c)):
        raise ValueError("signed comparison requires equal finite field shapes")
    initial_norm, reference_norm, delta = (float(np.sqrt(np.mean(v*v))) for v in (c, b, a-b))
    measurable = initial_norm > FLOOR
    fraction = delta/max(initial_norm, reference_norm) if measurable else None
    return {"initial_l2": initial_norm, "reference_l2": reference_norm,
            "difference_l2": delta, "fraction": fraction,
            "passed": bool(measurable and fraction <= TEMPORAL_LIMIT)}


def _require(condition, message):
    if not condition:
        raise ValueError(message)


def _norm_vector(sample):
    return [sample["perturbation_l2"], *sample["slot_l2"],
            *(sample["constraints"][k] for k in CONSTRAINT_NAMES),
            *(sample[k] for k in SUPPLEMENTAL)]


def assess_robust_window(rows, temporal):
    _require(len(rows) == len(CASES) and {case_key(r) for r in rows} == set(CASES),
             "all eight frozen cases must occur exactly once")
    for row in rows:
        _require(row["dt"] == 1./row["steps_per_unit"] and row["spatial_order"] == 4,
                 "frozen dt/order mismatch")
        _require([s["time"] for s in row["samples"]] == list(TIMES)
                 and all(s["step"] == t*row["steps_per_unit"] for s, t in zip(row["samples"], TIMES)),
                 "all eleven scheduled samples required")
        expected_amplitude = 0. if row["family"] == "minkowski" else noise_amplitude(row["points"])
        _require(row["amplitude"] == expected_amplitude, "frozen noise amplitude mismatch")
        for s in row["samples"]:
            _require(len(s["slot_l2"]) == 58 and len(s["auxiliary_reduction_l_inf_by_slot"]) == 33,
                     "missing independent slot diagnostics")
            values = _norm_vector(s) + s["auxiliary_reduction_l_inf_by_slot"]
            _require(all(np.isfinite(values)) and min(values) >= 0., "nonfinite or negative norm")
            domain = [s["sampled_cfl_sum"], s["min_lapse"], s["min_chi"], s["min_metric_eigenvalue"]]
            _require(all(np.isfinite(domain)), "nonfinite domain diagnostic")
            _require(np.isclose(np.linalg.norm(s["slot_l2"]), s["perturbation_l2"], rtol=1.e-12, atol=0.),
                     "aggregate norm disagrees with 58-slot norms")
            _require(s["runtime_writeback"] is False and s["rk_stage_cfl_monitored"] is False,
                     "unexpected writeback or unsupported stage-monitor claim")

    growth = []
    for row in rows:
        if row["family"] == "minkowski":
            continue
        values = np.asarray([_norm_vector(s) for s in row["samples"]])
        _require(np.min(values[0]) > FLOOR, "initial normalization is not measurable")
        factors = np.max(values, axis=0)/values[0]
        growth.append({"case": list(case_key(row)), "total_state_growth": float(factors[0]),
                       "slot_growth": factors[1:59].tolist(),
                       "constraint_growth": dict(zip(CONSTRAINT_NAMES, factors[59:67].tolist())),
                       "supplemental_growth": dict(zip(SUPPLEMENTAL, factors[67:].tolist())),
                       "max_growth": float(np.max(factors)),
                       "passed": bool(np.max(factors) <= GROWTH_LIMIT)})
    resolution = []
    for seed in SEEDS:
        selected = [next(g for g in growth if g["case"] == ["noise", n, seed, 256]) for n in POINTS]
        # Only the whole-state and physical H/M norms enter this resolution screen.
        # Relative per-slot changes can be dominated by small random means.
        for name in ("total_state_growth", "hamiltonian_l_inf", "momentum_l_inf"):
            factors = [g[name] if name == "total_state_growth" else g["constraint_growth"][name]
                       for g in selected]
            ratio = factors[-1]/factors[0]
            resolution.append({"seed": seed, "norm": name, "growth": factors,
                               "fine_coarse_ratio": ratio, "passed": ratio <= RESOLUTION_RATIO_LIMIT})
    _require([t["time"] for t in temporal] == list(TIMES[1:]), "ten temporal controls required")
    for t in temporal:
        _require(len(t["slots"]) == 58 and set(t["constraints"]) == {"hamiltonian", "momentum"},
                 "temporal control requires all signed fields")
        for field in [*t["slots"], *t["constraints"].values()]:
            magnitudes = [field[k] for k in ("initial_l2", "reference_l2", "difference_l2")]
            _require(all(np.isfinite(magnitudes)) and min(magnitudes) >= 0., "invalid temporal norm")
            _require(field["initial_l2"] > FLOOR and np.isfinite(field["fraction"])
                     and field["fraction"] >= 0., "unmeasurable temporal control")
            expected = field["difference_l2"]/max(field["initial_l2"], field["reference_l2"])
            _require(field["fraction"] == expected and field["passed"] == (expected <= TEMPORAL_LIMIT),
                     "temporal fraction/gate inconsistent")
    samples = [s for row in rows for s in row["samples"]]
    flat = next(row for row in rows if row["family"] == "minkowski")
    absolute = max(max([*(s["constraints"][k] for k in CONSTRAINT_NAMES),
                        *(s[k] for k in SUPPLEMENTAL)]) for s in samples)
    cfl = max(s["sampled_cfl_sum"] for s in samples)
    temporal_peak = max(f["fraction"] for t in temporal for f in [*t["slots"], *t["constraints"].values()])
    gates = {
        "growth": all(g["passed"] for g in growth),
        "resolution": all(g["passed"] for g in resolution),
        "temporal": temporal_peak <= TEMPORAL_LIMIT,
        "absolute_constraints": absolute <= ABSOLUTE_LIMIT,
        "sampled_domain": all(s["finite_positive"] and min(s["min_lapse"], s["min_chi"],
                                                        s["min_metric_eigenvalue"]) > 0. for s in samples),
        "sampled_cfl": bool(np.isfinite(cfl) and 0. <= cfl <= CFL_LIMIT),
        "exact_flat_state": all(s["perturbation_l2"] == 0. for s in flat["samples"]),
    }
    return {"growth": growth, "resolution": resolution, "constraint_peak": absolute,
            "sampled_cfl_peak": cfl, "temporal_fraction_peak": temporal_peak, "gates": gates,
            "sampled_robust_window_gates_passed": all(gates.values()),
            "continuum_convergence_claim": False, "standard_awa_benchmark_passed": False,
            "strong_hyperbolicity_validated": False, "long_time_stability_validated": False,
            "runtime_writeback": False}

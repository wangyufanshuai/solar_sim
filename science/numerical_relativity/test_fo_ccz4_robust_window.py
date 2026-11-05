from copy import deepcopy

import numpy as np
import pytest

from .fo_ccz4_robust_window import (
    CASES, CONSTRAINT_NAMES, SUPPLEMENTAL, TIMES, assess_robust_window,
    noise_amplitude, signed_comparison, slot_norms,
)


def fixture():
    rows = []
    for family, n, seed, steps in CASES:
        flat = family == "minkowski"
        amplitude = 0. if flat else noise_amplitude(n)
        samples = []
        for t in TIMES:
            norms = [amplitude]*58
            samples.append({"time": t, "step": t*steps, "slot_l2": norms,
                "perturbation_l2": float(np.linalg.norm(norms)),
                "constraints": dict.fromkeys(CONSTRAINT_NAMES, amplitude),
                **dict.fromkeys(SUPPLEMENTAL, amplitude),
                "auxiliary_reduction_l_inf_by_slot": [amplitude]*33,
                "min_lapse": 1., "min_chi": 1., "min_metric_eigenvalue": 1.,
                "sampled_cfl_sum": .375, "finite_positive": True,
                "runtime_writeback": False, "rk_stage_cfl_monitored": False})
        rows.append({"family": family, "points": n, "seed": seed, "steps_per_unit": steps,
                     "dt": 1./steps, "spatial_order": 4, "amplitude": amplitude, "samples": samples})
    zero = signed_comparison(np.array([1.e-10]), np.array([1.e-10]), np.array([1.e-10]))
    temporal = [{"time": t, "slots": [deepcopy(zero) for _ in range(58)],
                 "constraints": {k: deepcopy(zero) for k in ("hamiltonian", "momentum")}}
                for t in TIMES[1:]]
    return rows, temporal


def test_complete_synthetic_screen_preserves_nonpromotion_flags():
    rows, temporal = fixture()
    before = deepcopy((rows, temporal))
    result = assess_robust_window(rows, temporal)
    assert result["sampled_robust_window_gates_passed"]
    assert len(result["growth"]) == 7 and len(result["resolution"]) == 6
    assert all(result[key] is False for key in ("continuum_convergence_claim", "standard_awa_benchmark_passed",
               "long_time_stability_validated", "strong_hyperbolicity_validated", "runtime_writeback"))
    assert (rows, temporal) == before


@pytest.mark.parametrize("mutation", ("missing", "duplicate", "time", "step", "dt", "seed", "order", "amplitude",
                                      "slots", "aux", "nan", "nan_cfl", "unmeasurable", "writeback", "stage", "total"))
def test_incomplete_or_inconsistent_samples_fail_closed(mutation):
    rows, temporal = fixture()
    r, s = rows[0], rows[0]["samples"][0]
    if mutation == "missing":
        rows.pop()
    elif mutation == "duplicate":
        rows[-1] = deepcopy(rows[0])
    elif mutation in ("time", "step"):
        s[mutation] += .1
    elif mutation == "dt":
        r["dt"] *= .5
    elif mutation == "seed":
        r["seed"] += 7
    elif mutation == "order":
        r["spatial_order"] = 2
    elif mutation == "amplitude":
        r["amplitude"] *= 2
    elif mutation == "slots":
        s["slot_l2"].pop()
    elif mutation == "aux":
        s["auxiliary_reduction_l_inf_by_slot"].pop()
    elif mutation == "nan":
        s["constraints"]["momentum_l2"] = float("nan")
    elif mutation == "nan_cfl":
        rows[3]["samples"][6]["sampled_cfl_sum"] = float("nan")
    elif mutation == "unmeasurable":
        s["constraints"]["momentum_l2"] = 0.
    elif mutation == "writeback":
        s["runtime_writeback"] = True
    elif mutation == "stage":
        s["rk_stage_cfl_monitored"] = True
    else:
        s["perturbation_l2"] *= 1.01
    with pytest.raises(ValueError):
        assess_robust_window(rows, temporal)


@pytest.mark.parametrize("name", ("growth", "resolution", "temporal", "absolute_constraints",
                                  "sampled_domain", "sampled_cfl", "exact_flat_state"))
def test_each_declared_gate_can_reject(name):
    rows, temporal = fixture()
    s = rows[0]["samples"][-1]
    if name == "growth":
        s["constraints"]["hamiltonian_l_inf"] *= 101
    elif name == "resolution":
        rows[2]["samples"][-1]["constraints"]["momentum_l_inf"] *= 3
    elif name == "temporal":
        temporal[0]["slots"][57] = signed_comparison([1.02e-10], [1.e-10], [1.e-10])
    elif name == "absolute_constraints":
        s["ordering_max_curl_l_inf"] = .002
    elif name == "sampled_domain":
        s["finite_positive"] = False
    elif name == "sampled_cfl":
        s["sampled_cfl_sum"] = .46
    else:
        s = rows[-1]["samples"][-1]
        s["slot_l2"][0] = s["perturbation_l2"] = 1.e-16
    result = assess_robust_window(rows, temporal)
    assert not result["gates"][name] and not result["sampled_robust_window_gates_passed"]


@pytest.mark.parametrize("mutation", ("missing", "slot", "time", "fraction", "gate", "norm"))
def test_incomplete_or_falsified_time_control_rejected(mutation):
    rows, temporal = fixture()
    if mutation == "missing":
        temporal.pop()
    elif mutation == "slot":
        temporal[0]["slots"].pop()
    elif mutation == "time":
        temporal[0]["time"] += .1
    elif mutation == "fraction":
        temporal[0]["slots"][0]["fraction"] = .0001
    elif mutation == "gate":
        temporal[0]["slots"][0]["passed"] = False
    else:
        temporal[0]["slots"][0]["reference_l2"] = -1.
    with pytest.raises(ValueError):
        assess_robust_window(rows, temporal)


def test_signed_phase_error_not_hidden_by_equal_norms():
    q = np.array([1.e-10, -1.e-10])
    result = signed_comparison(q, -q, q)
    assert result["fraction"] == 2. and not result["passed"]
    result = signed_comparison(q, q*0., q)
    assert result["fraction"] == 1. and not result["passed"]
    result = signed_comparison(q, q, q*0.)
    assert result["fraction"] is None and not result["passed"]


@pytest.mark.parametrize("bad", ([1.], [float("nan"), 2.]))
def test_invalid_signed_fields_rejected(bad):
    with pytest.raises(ValueError):
        signed_comparison(bad, [1., 2.], [1., 2.])


def test_slot_norm_subtracts_only_three_flat_metric_slots():
    q = [np.full((2, 2, 2), 1. if i in (0, 3, 5) else 0.) for i in range(58)]
    assert slot_norms(q) == [0.]*58
    for i in range(58):
        changed = [v.copy() for v in q]
        changed[i] += 1.e-8
        result = slot_norms(changed)
        assert result[i] == pytest.approx(1.e-8, abs=1.e-16)
        assert sum(v != 0. for v in result) == 1
    with pytest.raises(ValueError):
        slot_norms(q[:-1])

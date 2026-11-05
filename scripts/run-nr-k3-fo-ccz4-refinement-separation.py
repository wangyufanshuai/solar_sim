"""Separate time/space/diagnostic errors without altering the old failed gate.

Every evolution is a full periodic cube. A strictly plane-symmetric Fourier
oracle is an additional diagnostic only. This is not the standard harmonic
gauge-wave long-time benchmark and never permits live promotion.
"""

from __future__ import annotations

import argparse
from dataclasses import fields
import hashlib
import json
from pathlib import Path
import platform
import runpy
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, Grid3D, advance_fo_ccz4_rk4_3d, constraint_report_3d,
)
from science.numerical_relativity.plane_constraint_oracle import (  # noqa: E402
    exact_plane_line, plane_diagonal_hamiltonian,
)

REFERENCE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py"))
FINAL_TIME, AMPLITUDE, FIXED_STEPS = .02, 1.e-4, 64
PROFILE, GAUGE, CONFIG = (REFERENCE[name] for name in ("PROFILE","GAUGE","CONFIG"))
ORIGINAL_POINTS, DOUBLED_POINTS = (9,13,17), (18,26,34)
TIME_STEPS = {9: (11,22,44), 13: (16,32,64), 17: (21,42,84)}
CASES = tuple(dict.fromkeys([(n,s) for n,steps in TIME_STEPS.items() for s in steps]
                           + [(n,FIXED_STEPS) for n in (*ORIGINAL_POINTS,*DOUBLED_POINTS)]))
NAMES = ("hamiltonian_l2","momentum_l2","conformal_gamma_l_inf","theta_l_inf")
MAX_TEMPORAL_FRACTION, FLOOR, HARD_TIMEOUT = .01, 1.e-13, 1800.
EXTRA_SOURCES = (
    "science/numerical_relativity/plane_constraint_oracle.py",
    "science/numerical_relativity/test_plane_constraint_oracle.py",
    "scripts/run-nr-k3-fo-ccz4-refinement-separation.py",
    "science/numerical_relativity/test_fo_ccz4_refinement_separation.py",
)


def source_identity():
    hashes = dict(REFERENCE["source_identity"]()["files"])
    hashes.update({name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in EXTRA_SOURCES})
    return {"sha256": hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(), "files": hashes}


def validate_baseline(baseline):
    if baseline["schema_version"] != "nr-k3-fo-ccz4-state-dependent-gauge-v2":
        raise ValueError("requires the preserved v2 baseline")
    identity = REFERENCE["source_identity"]()
    if identity != baseline["source_identity_before"] or identity != baseline["source_identity_after"]:
        raise ValueError("baseline source identity no longer matches; do not reuse stale evidence")
    if baseline["profile"] != PROFILE.identity():
        raise ValueError("baseline gauge profile mismatch")
    method = baseline["method"]
    if method["amplitude"] != AMPLITUDE or method["final_time"] != FINAL_TIME or method["spatial_order"] != 2:
        raise ValueError("baseline experiment parameters mismatch")


def norm(values, name):
    values = np.asarray(values, dtype=float)
    if not np.all(np.isfinite(values)) or values.size == 0:
        raise ValueError("constraint samples must be finite and nonempty")
    return float(np.max(abs(values))) if name.endswith("l_inf") else float(np.sqrt(np.mean(values**2)))


def temporal_contrast(rows):
    if len(rows) != 3 or len({row["points"] for row in rows}) != 1:
        raise ValueError("time comparison requires three rows on the same grid")
    if not all(right["steps"] == 2*left["steps"] for left,right in zip(rows,rows[1:])):
        raise ValueError("time comparison requires step-count doubling")
    if any(abs(row["simulated_time"]-FINAL_TIME) > 1.e-15 for row in rows):
        raise ValueError("time comparison requires the same final time")
    reports = {}
    for name in NAMES:
        arrays = [np.asarray(row["constraint_profiles"][name]) for row in rows]
        if len({array.shape for array in arrays}) != 1:
            raise ValueError("time comparison constraint shapes differ")
        baseline = norm(arrays[-1],name)
        delta = norm(arrays[0]-arrays[-1],name)
        half_differences = [norm(a-b,name) for a,b in zip(arrays,arrays[1:])]
        measurable = baseline > FLOOR
        fraction = delta/baseline if measurable else None
        reports[name] = {
            "reference_norm": baseline, "coarse_to_fine_field_difference": delta,
            "fraction_of_constraint_residual": fraction, "half_step_differences": half_differences,
            "time_influence_below_one_percent": bool(measurable and fraction <= MAX_TEMPORAL_FRACTION),
            "temporal_order": float(np.log2(half_differences[0]/half_differences[1]))
                if min(half_differences) > FLOOR else None,
        }
    return {"points": rows[0]["points"], "steps": [row["steps"] for row in rows], "constraints": reports}


def _health(state):
    base = state.base
    f, _ = PROFILE.coefficients(base.lapse,base.chi)
    metric_eigenvalue = float(np.min(np.linalg.eigvalsh(base.h)))
    if metric_eigenvalue <= 0.:
        raise FloatingPointError("metric lost positive definiteness")
    hii = np.diagonal(np.linalg.inv(base.h),axis1=-2,axis2=-1)
    maximum_speed = float(np.max(abs(base.shift)+np.sqrt((4./3.)*f[...,None]*hii)))
    return {"min_lapse": float(np.min(base.lapse)), "min_chi": float(np.min(base.chi)),
            "min_metric_eigenvalue": metric_eigenvalue, "max_coordinate_speed": maximum_speed}


def run_case(points, steps, deadline):
    grid = Grid3D((points,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=2)
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.gauge_wave(grid,amplitude=AMPLITUDE,wavelength=1.,formulation="ccz4"))
    initial = REFERENCE["diagnostics"](state)
    initial_oracle = plane_diagonal_hamiltonian(state.base).norms
    dt, working, health = FINAL_TIME/steps, state, [_health(state)]
    for step in range(steps):
        if time.perf_counter() >= deadline:
            raise TimeoutError("declared 30 minute campaign limit reached")
        working = advance_fo_ccz4_rk4_3d(working,dt,gauge=GAUGE,config=CONFIG,gauge_profile=PROFILE)
        health.append(_health(working))
        if (step+1) % 4 == 0 or step+1 == steps:
            print(json.dumps({"points":points,"steps_total":steps,"completed_steps":step+1}),flush=True)
    final = REFERENCE["diagnostics"](working)
    constraints = constraint_report_3d(working.base)
    oracle = plane_diagonal_hamiltonian(working.base)
    profiles = {name: exact_plane_line(getattr(constraints,slot)).tolist() for name,slot in zip(
        NAMES,("hamiltonian","momentum","conformal_gamma","theta"))}
    state_lines = {f"{label}.{field.name}": exact_plane_line(getattr(obj,field.name)).tolist()
                   for label,obj in (("base",working.base),("auxiliary",working.auxiliary))
                   for field in fields(obj) if isinstance(getattr(obj,field.name),np.ndarray)}
    return {
        "points": points, "shape": list(grid.shape), "spacing": grid.spacing[0],
        "steps": steps, "dt": dt, "simulated_time": dt*steps, "initial": initial, "final": final,
        "initial_oracle": initial_oracle, "oracle": oracle.norms,
        "oracle_hamiltonian_profile": oracle.hamiltonian.tolist(),
        "primary_minus_oracle_l2": norm(np.asarray(profiles["hamiltonian_l2"])-oracle.hamiltonian,"hamiltonian_l2"),
        "constraint_profiles": profiles, "state_line_arrays": state_lines,
        "all_state_fields_exactly_plane_symmetric": True,
        "completed_step_health": health,
        "input_unchanged": initial["array_sha256"] == REFERENCE["array_digest"](state.base,state.auxiliary),
        "rk_stage_speed_cap_monitored": False, "runtime_writeback": False,
    }


def spatial_orders(rows, *, oracle=False):
    if len(rows) != 3 or any(a["points"] >= b["points"] for a,b in zip(rows,rows[1:])):
        raise ValueError("spatial comparison requires three increasing grids")
    if len({row["dt"] for row in rows}) != 1 or any(abs(row["simulated_time"]-FINAL_TIME) > 1.e-15 for row in rows):
        raise ValueError("spatial comparison requires fixed dt and final time")
    if not oracle:
        return REFERENCE["constraint_orders"](rows)
    values = [row["oracle"]["hamiltonian_l2"] for row in rows]
    measurable = min(values) > FLOOR
    orders = [float(np.log(a/b)/np.log(left["spacing"]/right["spacing"]))
              for a,b,left,right in zip(values,values[1:],rows,rows[1:])] if measurable else []
    return {"values":values,"measurable":measurable,"observed_orders":orders,
            "second_order_gate": bool(measurable and min(orders) >= 1.5)}


def summarize(rows, baseline):
    if {(row["points"],row["steps"]) for row in rows} != set(CASES) or len(rows) != len(CASES):
        raise ValueError("campaign must retain every predeclared case exactly once")
    lookup = {(row["points"],row["steps"]):row for row in rows}
    time_results = [temporal_contrast([lookup[n,s] for s in TIME_STEPS[n]]) for n in ORIGINAL_POINTS]
    original = [lookup[n,FIXED_STEPS] for n in ORIGINAL_POINTS]
    refined = [lookup[n,FIXED_STEPS] for n in DOUBLED_POINTS]
    replay = {str(row["points"]): lookup[row["points"],row["steps"]]["final"]["array_sha256"] == row["final"]["array_sha256"]
              for row in baseline["evolution_rows"]}
    coarse_orders, fine_orders = spatial_orders(original), spatial_orders(refined)
    fine_oracle = spatial_orders(refined,oracle=True)
    small_time_effect = all(row["constraints"]["hamiltonian_l2"]["time_influence_below_one_percent"] for row in time_results)
    paired = {name:[float(np.log2(a["final"]["constraint_norms"][name]/b["final"]["constraint_norms"][name]))
                    if min(a["final"]["constraint_norms"][name],b["final"]["constraint_norms"][name]) > FLOOR else None
                    for a,b in zip(original,refined)] for name in NAMES}
    return {
        "temporal":time_results, "fixed_dt_original_grids":coarse_orders,
        "fixed_dt_doubled_grids":fine_orders, "paired_grid_halving_orders":paired,
        "fixed_dt_original_oracle":spatial_orders(original,oracle=True), "fixed_dt_doubled_oracle":fine_oracle,
        "baseline_bitwise_replay":replay,
        "hypothesis_supported": bool(all(replay.values()) and small_time_effect
            and not coarse_orders["hamiltonian_l2"]["second_order_gate"]
            and fine_orders["hamiltonian_l2"]["second_order_gate"] and fine_oracle["second_order_gate"]),
        "hypothesis_scope":"this short plane-wave constraint experiment; not a general error bound or solver validation",
        "old_failed_gate_retained":baseline["validation"]["bounded_campaign_passed"] is False,
        "runtime_writeback":False, "scientificPayloadWriteback":False,
        "strong_hyperbolicity_validated":False, "physical_boundary_validated":False,
        "black_hole_evolution_validated":False, "long_time_stability_validated":False,
    }


def write_new_json(path, value):
    encoded = json.dumps(value,sort_keys=True,indent=2,allow_nan=False)+"\n"
    with path.open("x",encoding="utf-8") as stream:
        stream.write(encoded)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline",required=True,type=Path)
    parser.add_argument("--output",required=True,type=Path)
    args = parser.parse_args()
    row_directory = args.output.with_suffix("")
    if args.output.exists() or row_directory.exists():
        raise SystemExit("output or row directory already exists; choose a fresh path")
    original_bytes = args.baseline.read_bytes()
    baseline = json.loads(original_bytes)
    validate_baseline(baseline)
    before, started = source_identity(), time.perf_counter()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    row_directory.mkdir()
    rows, error = [], None
    try:
        for points,steps in CASES:
            row = run_case(points,steps,started+HARD_TIMEOUT)
            rows.append(row)
            write_new_json(row_directory/f"n{points}-steps{steps}.json",{
                "source_identity":before, "profile":PROFILE.identity(),"row":row})
    except (TimeoutError,FloatingPointError,ValueError) as exc:
        error = f"{type(exc).__name__}: {exc}"
    complete = error is None and len(rows) == len(CASES)
    analysis = summarize(rows,baseline) if complete else None
    unchanged = before == source_identity() and args.baseline.read_bytes() == original_bytes
    result = {
        "schema_version":"nr-k3-fo-ccz4-refinement-separation-v1", "source_identity":before,
        "source_and_baseline_unchanged":unchanged,
        "baseline_file":str(args.baseline.resolve()),"baseline_sha256":hashlib.sha256(original_bytes).hexdigest(),
        "protocol":{"cases":CASES,"final_time":FINAL_TIME,"fixed_steps":FIXED_STEPS,"amplitude":AMPLITUDE,
                    "maximum_temporal_fraction":MAX_TEMPORAL_FRACTION,"roundoff_floor":FLOOR,
                    "minimum_order":1.5,"hard_timeout_seconds":HARD_TIMEOUT,"profile":PROFILE.identity()},
        "environment":{"python":sys.version,"numpy":np.__version__,"platform":platform.platform()},
        "elapsed_seconds":time.perf_counter()-started,"completed":complete,"error":error,
        "completed_case_count":len(rows),"expected_case_count":len(CASES),"row_directory":str(row_directory.resolve()),
        "rows":rows,"analysis":analysis,"solver_promoted":False,
        "runtime_writeback":False,"scientificPayloadWriteback":False,
    }
    write_new_json(args.output,result)
    print(json.dumps({"output":str(args.output.resolve()),"completed":complete,"source_unchanged":unchanged,
                      "analysis":analysis,"error":error}),flush=True)
    return 0 if complete and unchanged and all(analysis["baseline_bitwise_replay"].values()) else 2


if __name__ == "__main__":
    raise SystemExit(main())

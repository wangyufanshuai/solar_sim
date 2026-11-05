"""Reproducible, bounded validation of an opt-in FO-CCZ4 gauge candidate.

Finite samples, a manufactured derivative, and a short periodic evolution
cannot establish uniform hyperbolicity, physical boundaries or black-hole
accuracy. Keep the old defective points as explicit negative controls.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, fields, replace
import hashlib
import json
from pathlib import Path
import platform
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4Config, FOCCZ4GaugeProfile, FOCCZ4State3D, GaugeConfig,
    Grid3D, advance_fo_ccz4_rk4_3d, audit_frozen_fo_ccz4_eigenspaces_3d,
    constraint_report_3d, fo_ccz4_ordering_constraints_3d, fo_ccz4_rhs_3d,
    frozen_fo_ccz4_principal_matrix_3d, probe_frozen_fo_ccz4_rhs_matrix_3d,
)

PROFILE = FOCCZ4GaugeProfile(shift_scale=3., ordering_scale=.2)
GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
CONFIG = FOCCZ4Config()
ALPHAS, CHIS = (.2, .5, 1., 1.5, 1.8), (.02, .1, .5, 1.)
NORMALS = ((1.,0.,0.), (0.,1.,0.), (0.,0.,1.), (1.,-2.,.3), (-1.,2.,-.3))
SHIFT = (.15, -.08, .04)
POINTS, FINAL_TIME, AMPLITUDE = (9,13,17), .02, 1.e-4
CFL, COORDINATE_SPEED_CAP = .05, 3.
RHS_TOLERANCE, ROUND_OFF_FLOOR = 2.e-12, 1.e-13
SOURCES = (
    "science/numerical_relativity/__init__.py",
    "science/numerical_relativity/ccz4_reference.py",
    "science/numerical_relativity/nr3d.py",
    "science/numerical_relativity/bssn3d.py",
    "science/numerical_relativity/constraints3d.py",
    "science/numerical_relativity/fo_ccz4.py",
    "science/numerical_relativity/fo_ccz4_rhs.py",
    "science/numerical_relativity/fo_ccz4_gauge_profile.py",
    "science/numerical_relativity/fo_ccz4_principal_symbol.py",
    "science/numerical_relativity/fo_ccz4_frozen_symbol.py",
    "science/numerical_relativity/fo_ccz4_frozen_characteristics.py",
    "science/numerical_relativity/test_fo_ccz4_gauge_profile.py",
    "science/numerical_relativity/test_fo_ccz4_gauge_campaign.py",
    "scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py",
)


def source_identity():
    hashes = {name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in SOURCES}
    digest = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()
    return {"sha256": digest, "files": hashes}


def array_digest(*objects):
    digest = hashlib.sha256()
    for obj in objects:
        digest.update(type(obj).__name__.encode())
        for field in fields(obj):
            value = getattr(obj, field.name)
            if isinstance(value, np.ndarray):
                digest.update(field.name.encode()+str(value.shape).encode())
                digest.update(np.asarray(value, dtype="<f8").tobytes())
    return digest.hexdigest()


def metric_cases():
    h = np.array(((1.1,.13,-.1),(.13,.9,.02),(-.1,.02,1.2)))
    h /= np.linalg.det(h)**(1./3.)
    return (("identity", np.eye(3)), ("anisotropic", h))


def pointwise_campaign():
    rows = []
    for metric_name, h in metric_cases():
        for alpha in ALPHAS:
            for chi in CHIS:
                for normal in NORMALS:
                    args = (h, chi, alpha, SHIFT, normal)
                    first = audit_frozen_fo_ccz4_eigenspaces_3d(*args, gauge_profile=PROFILE)
                    replay = audit_frozen_fo_ccz4_eigenspaces_3d(*args, gauge_profile=PROFILE)
                    rows.append({
                        "metric": metric_name, "h": h.tolist(), "lapse": alpha,
                        "chi": chi, "shift": SHIFT, "normal": normal,
                        "audit": asdict(first), "deterministic_replay": first == replay,
                    })
        print(json.dumps({"stage": "local-basis", "metric": metric_name, "rows": len(rows)}), flush=True)
    return rows


def negative_controls():
    # name, chi, lapse, old f: include actual Schwarzschild exterior values.
    cases = (
        ("legacy-light-shift", 1., 1., .75),
        ("lapse-shift", 2./3., 1., 1.),
        ("light-ordering", .5, 1., 1.),
        ("schwarzschild-r2.642606754", .5, .6817928305074291, 1.),
        ("schwarzschild-r7.239974104", .7655790150423762, .8708006013327899, 1.),
    )
    rows = []
    for name, chi, alpha, old_f in cases:
        args = (np.eye(3), chi, alpha, (0.,0.,0.), (1.,0.,0.))
        old = audit_frozen_fo_ccz4_eigenspaces_3d(*args, gauge=replace(GAUGE, shift_coefficient=old_f))
        new = audit_frozen_fo_ccz4_eigenspaces_3d(*args, gauge_profile=PROFILE)
        matrix = frozen_fo_ccz4_principal_matrix_3d(*args, gauge_profile=PROFILE)
        actual = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, gauge_profile=PROFILE)
        error = float(np.max(abs(matrix-actual)))
        rows.append({
            "case": name, "chi": chi, "lapse": alpha, "legacy_f": old_f,
            "legacy_audit": asdict(old), "candidate_audit": asdict(new),
            "actual_rhs_l_inf": error,
            "control_reproduced": bool(not old.pointwise_eigenbasis_validated
                and new.pointwise_eigenbasis_validated and error <= RHS_TOLERANCE),
        })
    # The direct and grid paths must also agree away from isotropic x normals.
    h = metric_cases()[1][1]
    for alpha, chi, normal in ((.2,.02,NORMALS[3]), (1.8,1.,NORMALS[4])):
        args = (h, chi, alpha, SHIFT, normal)
        matrix = frozen_fo_ccz4_principal_matrix_3d(*args, gauge_profile=PROFILE)
        affine = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, gauge_profile=PROFILE)
        sine = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, gauge_profile=PROFILE, profile="sine")
        error = max(float(np.max(abs(matrix-affine))), float(np.max(abs(matrix-sine))))
        rows.append({"case": "anisotropic-rhs-probe", "lapse": alpha, "chi": chi,
                     "h": h.tolist(), "shift": SHIFT, "normal": normal,
                     "actual_rhs_l_inf": error, "control_reproduced": error <= RHS_TOLERANCE})
    return rows


def manufactured_derivative_campaign():
    rows = []
    for axis in range(3):
        for order in (2,4):
            errors = []
            for points in (12,24,48):
                shape = [5,5,5]
                shape[axis] = points
                grid = Grid3D(tuple(shape), (0.,0.,0.), (1.,1.,1.), boundary="periodic", spatial_order=order)
                base = BSSNState3D.minkowski(grid)
                angle = 2.*np.pi*grid.coordinates[axis]
                base.lapse *= .8*np.exp(.04*np.sin(angle))
                base.chi *= .6*np.exp(.05*np.cos(angle))
                base.b[...,0] = .03*np.sin(angle)
                state = FOCCZ4State3D.from_bssn_state(base)
                a, p = np.zeros_like(state.auxiliary.lapse_gradient), np.zeros_like(state.auxiliary.conformal_factor_gradient)
                a[...,axis], p[...,axis] = .04*2.*np.pi*np.cos(angle), -.025*2.*np.pi*np.sin(angle)
                state = FOCCZ4State3D(base, replace(state.auxiliary, lapse_gradient=a, conformal_factor_gradient=p))
                exact = 3.*base.lapse*base.chi*(.03*2.*np.pi*np.cos(angle)+(a[...,axis]+2.*p[...,axis])*base.b[...,0])
                numerical = fo_ccz4_rhs_3d(state, gauge_profile=PROFILE).shift_gradient[...,axis,0]
                errors.append(float(np.sqrt(np.mean((numerical-exact)**2))))
            orders = (np.log(np.asarray(errors[:-1])/errors[1:])/np.log(2.)).tolist()
            rows.append({"axis": axis, "spatial_order": order, "points": [12,24,48],
                         "l2_errors": errors, "observed_orders": orders,
                         "passed": min(orders) > order-.15})
    return rows


def diagnostics(state):
    constraints = constraint_report_3d(state.base)
    ordering = fo_ccz4_ordering_constraints_3d(state.base, state.auxiliary)
    finite = all(np.all(np.isfinite(getattr(obj, field.name)))
                 for obj in (state.base, state.auxiliary) for field in fields(obj)
                 if isinstance(getattr(obj, field.name), np.ndarray))
    positive = (np.min(state.base.lapse) > 0. and np.max(state.base.lapse) < 2.
                and np.min(state.base.chi) > 0. and np.min(np.linalg.eigvalsh(state.base.h)) > 0.)
    f, _ = PROFILE.coefficients(state.base.lapse, state.base.chi)
    # Shift-longitudinal is the largest intrinsic branch in the declared domain.
    hii = np.diagonal(np.linalg.inv(state.base.h), axis1=-2, axis2=-1)
    speed = float(np.max(abs(state.base.shift)+np.sqrt((4./3.)*f[...,None]*hii)))
    return {
        "finite_positive_state": bool(finite and positive and ordering.finite),
        "constraint_norms": dict(constraints.norms),
        "ordering_max_curl_l_inf": ordering.max_curl_l_inf,
        "ordering_max_algebraic_l_inf": ordering.max_algebraic_l_inf,
        "min_lapse": float(np.min(state.base.lapse)), "max_lapse": float(np.max(state.base.lapse)),
        "min_chi": float(np.min(state.base.chi)), "max_coordinate_speed": speed,
        "array_sha256": array_digest(state.base, state.auxiliary),
    }


def evolution_row(points):
    grid = Grid3D((points,)*3, (0.,0.,0.), (1.,1.,1.), boundary="periodic", spatial_order=2)
    base = BSSNState3D.gauge_wave(grid, amplitude=AMPLITUDE, wavelength=1., formulation="ccz4")
    state = FOCCZ4State3D.from_bssn_state(base)
    initial = diagnostics(state)
    steps = int(np.ceil(FINAL_TIME/(CFL*min(grid.spacing)/COORDINATE_SPEED_CAP)))
    dt = FINAL_TIME/steps
    working, history = state, []
    for _ in range(steps):
        working = advance_fo_ccz4_rk4_3d(working, dt, gauge=GAUGE, config=CONFIG, gauge_profile=PROFILE)
        history.append(diagnostics(working))
    replay = advance_fo_ccz4_rk4_3d(state, dt, steps=steps, gauge=GAUGE, config=CONFIG, gauge_profile=PROFILE)
    final = history[-1]
    speed = max(row["max_coordinate_speed"] for row in (initial, *history))
    row = {
        "points": points, "spacing": min(grid.spacing), "dt": dt, "steps": steps,
        "simulated_time": steps*dt, "initial": initial, "final": final,
        "max_completed_step_speed": speed, "speed_cap_respected_at_completed_steps": speed <= COORDINATE_SPEED_CAP,
        "rk_stage_speed_cap_monitored": False,
        "all_completed_steps_finite_positive": all(row["finite_positive_state"] for row in (initial,*history)),
        "deterministic_replay": array_digest(replay.base,replay.auxiliary) == final["array_sha256"],
        "input_unchanged": array_digest(state.base,state.auxiliary) == initial["array_sha256"],
        "profile_metadata": working.base.metadata["fo_ccz4_gauge_profile"],
        "completed_step_constraint_history": [row["constraint_norms"] for row in history],
    }
    print(json.dumps({"stage": "periodic-evolution", "points": points, "steps": steps,
                      "replay": row["deterministic_replay"]}), flush=True)
    return row


def constraint_orders(rows):
    result = {}
    for name in ("hamiltonian_l2", "momentum_l2", "conformal_gamma_l_inf", "theta_l_inf"):
        values = [row["final"]["constraint_norms"][name] for row in rows]
        measurable = all(value > ROUND_OFF_FLOOR for value in values)
        orders = [float(np.log(a/b)/np.log(left["spacing"]/right["spacing"]))
                  for a,b,left,right in zip(values, values[1:], rows, rows[1:])] if measurable else []
        result[name] = {"values": values, "measurable": measurable, "observed_orders": orders,
                        "second_order_gate": measurable and len(orders) == 2 and min(orders) >= 1.5}
    return result


def validation_summary(gates, orders):
    """Keep partial successes, but fail the aggregate on ANY constraint gap."""
    independent = {name: bool(orders[name]["second_order_gate"]) for name in
                   ("hamiltonian_l2", "momentum_l2", "conformal_gamma_l_inf", "theta_l_inf")}
    all_constraints = all(independent.values())
    return {
        "campaign_gates": gates,
        "bounded_components_passed": all(gates.values()),
        "independent_constraint_gates": independent,
        "all_four_constraint_convergence": all_constraints,
        "bounded_campaign_passed": all(gates.values()) and all_constraints,
        "strong_hyperbolicity_validated": False, "analytic_uniform_basis_validated": False,
        "nonlinear_subsidiary_system_validated": False, "physical_boundary_validated": False,
        "cpbc_ready": False, "long_time_stability_validated": False,
        "exact_evolved_gauge_wave_validated": False, "black_hole_evolution_validated": False,
        "cross_backend_validated": False, "disk_checkpoint_profile_validated": False,
        "runtime_writeback": False, "scientificPayloadWriteback": False,
        "promotion": "hold-shadow-only-pending-uniform-basis-constraints-boundaries-and-physical-benchmarks",
    }


def run_campaign():
    started, before = time.perf_counter(), source_identity()
    pointwise = pointwise_campaign()
    controls = negative_controls()
    derivatives = manufactured_derivative_campaign()
    evolution = [evolution_row(points) for points in POINTS]
    orders = constraint_orders(evolution)
    after = source_identity()
    gates = {
        "source_unchanged": before == after,
        "sampled_local_bases": len(pointwise) == 200 and all(row["audit"]["pointwise_eigenbasis_validated"] for row in pointwise),
        "local_deterministic_replay": all(row["deterministic_replay"] for row in pointwise),
        "mandatory_controls": len(controls) == 7 and all(row["control_reproduced"] for row in controls),
        "manufactured_derivative_convergence": len(derivatives) == 6 and all(row["passed"] for row in derivatives),
        "bounded_evolution_finite_positive": all(row["all_completed_steps_finite_positive"] for row in evolution),
        "bounded_evolution_replay": all(row["deterministic_replay"] and row["input_unchanged"] for row in evolution),
        "completed_step_speed_cap": all(row["speed_cap_respected_at_completed_steps"] for row in evolution),
        "same_final_time": all(abs(row["simulated_time"]-FINAL_TIME) <= 1.e-15 for row in evolution),
        # H/M are always reported; roundoff values are never promoted to measured orders.
        "connection_and_theta_convergence": all(orders[name]["second_order_gate"] for name in ("conformal_gamma_l_inf","theta_l_inf")),
    }
    return {
        "schema_version": "nr-k3-fo-ccz4-state-dependent-gauge-v2", "profile": PROFILE.identity(),
        "source_identity_before": before, "source_identity_after": after,
        "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
        "elapsed_seconds": time.perf_counter()-started,
        "primary_references": ["https://arxiv.org/html/1707.09910v3#A2",
            "https://pure.mpg.de/rest/items/item_151562/component/file_151561/content",
            "https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/MovingPunctureGauge.hpp"],
        "coefficient_domain": {"lapse": "0 < alpha < 2", "chi": "chi > 0", "det_h": 1., "c_e_s": [1.,1.,1.]},
        "speed_squared_ratios_to_light": ["k/4", "k/2", "1", "2/alpha", "a/alpha", "4a/(3alpha)"],
        "method": {"gauge": asdict(GAUGE), "config": asdict(CONFIG), "boundary": "periodic",
            "spatial_order": 2, "time_integrator": "RK4", "points": POINTS, "amplitude": AMPLITUDE,
            "final_time": FINAL_TIME, "cfl": CFL, "coordinate_speed_cap": COORDINATE_SPEED_CAP,
            "rhs_tolerance": RHS_TOLERANCE, "roundoff_floor": ROUND_OFF_FLOOR,
            "minimum_constraint_order": 1.5, "minimum_manufactured_order": "stencil_order-0.15"},
        "pointwise_rows": pointwise, "control_rows": controls,
        "manufactured_derivatives": derivatives, "evolution_rows": evolution, "constraint_convergence": orders,
        "validation": validation_summary(gates, orders),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output already exists; choose a fresh receipt path")
    result = run_campaign()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(result, indent=2, sort_keys=True, allow_nan=False)+"\n"
    with args.output.open("x", encoding="utf-8") as stream:
        stream.write(encoded)
    print(json.dumps({"output": str(args.output.resolve()), "validation": result["validation"],
                      "orders": result["constraint_convergence"]}), flush=True)
    return 0 if result["validation"]["bounded_campaign_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

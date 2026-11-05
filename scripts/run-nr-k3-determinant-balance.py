"""Retained nonlinear trajectory decomposition; no evolution is advanced."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity.determinant_balance import (  # noqa: E402
    FIELDS, TERMS, NUMERICAL_FLOOR, decompose, identity, integrate_trapezoid, signed_budget,
)
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube  # noqa: E402
from science.numerical_relativity.nr3d import Grid3D  # noqa: E402

R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-refinement.py"))
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"))
require, sha, bounded = (R[k] for k in ("require", "sha", "bounded"))
MATRIX, FLAGS, EVIDENCE = (R[k] for k in ("MATRIX", "FLAGS", "EVIDENCE"))
PARENT = EVIDENCE/"nr-k3-nonlinear-dual-diagnostics-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-nonlinear-dual-diagnostics-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-dual-final-regression-v2-20261009.xml"
RETAINED = {
    PARENT: "31e78ece7f718bad5ef0453844407a9029a4a61ef2bcf791ba194e37007c2233",
    AUDIT: "6e0f314ae9082d620a93ef324e01afec79c9aadc8e4a3de4769cd99c4378bf09",
    REGRESSION: "9fdcff889a5575800c73c503144e9157b92088b587d772e06eca81f10b7f4805",
    R["OLD"]["NATIVE"]: R["OLD"]["NATIVE_SHA"],
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-determinant-balance.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/determinant_balance.py",
         "science/numerical_relativity/test_determinant_balance.py", "scripts/run-nr-k3-determinant-balance.py",
         "scripts/tests/test_nr_determinant_balance.py", "science/numerical_relativity/test_fo_ccz4_determinant_balance.py",
         "science/numerical_relativity/ANALYSIS-20261009-determinant-balance.md")
INTEGRANDS = ("rhs_trace", *TERMS)
BUDGET_FIELDS = ("endpoint_change", *TERMS, "rhs_integral", "quadrature_residual", "signed_closure")
SECONDS, OUTPUT_CAP, HEADROOM = 180., 32*1024**2, 8*1024**2
C_RESERVE, E_RESERVE = R["C_RESERVE"], R["E_RESERVE"]


def guard(directory, deadline, *, additional=0):
    require(time.perf_counter() < deadline, "180s absolute determinant study deadline reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free-additional >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used+additional+HEADROOM <= OUTPUT_CAP, "32MiB determinant study output cap reached")


def sources(report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity changed: "+path.name)
    parent, audit = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, AUDIT))
    require(parent["completed"] is True and audit["audit_completed"] is True
            and parent["metric_hessian_screen_passed"] is audit["metric_hessian_screen_passed"] is True
            and parent["legacy_refinement_screen_passed"] is audit["legacy_refinement_screen_passed"] is False
            and audit["receipt_sha256"] == RETAINED[PARENT] and audit["independent_saved_states"] == 58
            and parent["errors"] == audit["errors"] == [], "closed diagnostic parent required")
    require(all(d.get(k) is False for d in (parent, audit) for k in FLAGS), "parent admission changed")
    require(parent["source_before"] == parent["source_after"] and audit["auditor_sources"] == audit["auditor_sources_after"],
            "closed source identity required")
    checked = A["verify_manifest"](PARENT, parent)
    before = dict(parent["source_after"])
    for name, digest in audit["auditor_sources"].items():
        require(name not in before or before[name] == digest, "auditor source conflict")
        before[name] = digest
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source drift: "+name)
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    regression = R["green_report"](REGRESSION, expected_count=1708)
    report = bounded(ROOT, report.resolve().relative_to(ROOT).as_posix())
    tests = R["green_report"](report)
    suffixes = ("science.numerical_relativity.test_determinant_balance", "scripts.tests.test_nr_determinant_balance")
    require(len(tests["classes"]) == 2 and all(any(c.endswith(suffix) for c in tests["classes"]) for suffix in suffixes),
            "both new diagnostic test modules required")
    tests["path"] = report.relative_to(ROOT).as_posix()
    return before, dict(runner_tests=tests, regression=regression, retained_artifacts_checked=checked), parent


def independent_terms(q, tau):
    """Dense SBP and explicit index contractions, independent of decompose."""
    n = q.shape[1]
    h, d = np.zeros((n, n, n, 3, 3)), np.zeros((n, n, n, 3, 3, 3))
    for slot, (i, j) in enumerate(A["A"]["PAIRS"]):
        h[..., i, j] = h[..., j, i] = q[slot]
        for k in range(3):
            d[..., k, i, j] = d[..., k, j, i] = q[37+6*k+slot]
    inverse = np.linalg.inv(h)
    determinant = np.linalg.det(h)
    ell = np.log(determinant)
    matrix, _w = A["A"]["SBP"](n)
    transport, reduction, chain = (np.zeros((n, n, n)) for _ in range(3))
    for k in range(3):
        dh = A["A"]["derivative"](matrix, h, k)
        dell = A["A"]["derivative"](matrix, ell, k)
        trace_dh, trace_c = np.zeros((n, n, n)), np.zeros((n, n, n))
        for i in range(3):
            for j in range(3):
                trace_dh += inverse[..., i, j]*dh[..., i, j]
                trace_c += inverse[..., i, j]*(d[..., k, i, j]-.5*dh[..., i, j])
        transport += q[7+k]*dell
        reduction += 2.*q[7+k]*trace_c
        chain += q[7+k]*(trace_dh-dell)
    return dict(transport=transport, reduction_forcing=reduction, chain_rule=chain, damping=-3.*tau*(determinant-1.))


def norms(driver, fields):
    weights, masks = R["weights_and_regions"](driver)
    return {region: {key: R["weighted_rms"](value, weights, mask) for key, value in fields.items()}
            for region, mask in masks.items()}


def sample(driver, q):
    original = q.tobytes()
    state = driver.state(q)
    rhs = driver.volume.rhs(state, gauge=driver.gauge, config=driver.config, gauge_profile=driver.profile)
    fields = decompose(state.base.h, state.auxiliary.metric_gradient, state.base.shift, rhs.h,
        lambda value, axis: driver.volume.axes[axis].derivative(value, axis=axis), driver.config.tau_inverse)
    independent = independent_terms(q, driver.config.tau_inverse)
    differences = {key: float(np.max(abs(fields[key]-independent[key]))) for key in TERMS}
    maximum = float(np.max(abs(fields["balance_residual"])))
    require(max(differences.values()) <= 2.e-14 and maximum <= 2.e-14, "instantaneous determinant balance failed")
    require(q.tobytes() == original, "saved state mutated")
    return fields, dict(norms=norms(driver, fields), maximum_balance_residual=maximum,
                        independent_term_max_differences=differences, input_unchanged=True)


def time_budget(times, states, weights):
    times = np.asarray(times)
    values = np.stack([np.stack([state[key] for key in INTEGRANDS]) for state in states])
    integrals = integrate_trapezoid(times, values)
    independent = np.zeros_like(integrals)
    for i in range(len(times)-1):
        independent += (times[i+1]-times[i])*(values[i]+values[i+1])/2.
    difference = float(np.max(abs(integrals-independent)))
    require(difference <= 2.e-14, "independent trapezoid integral differs")
    observed = states[-1]["log_determinant"]-states[0]["log_determinant"]
    contributions = dict(zip(TERMS, integrals[1:], strict=True))
    residual = observed-integrals[0]
    closure = observed-sum(contributions.values())-residual
    require(float(np.max(abs(closure))) <= 2.e-14, "signed time-balance closure failed")
    fields = dict(endpoint_change=observed, **contributions, rhs_integral=integrals[0],
                  quadrature_residual=residual, signed_closure=closure)
    projection = signed_budget(observed, {**contributions, "quadrature_residual": residual}, weights)
    return fields, dict(independent_integral_max_difference=difference,
                        signed_closure_max=float(np.max(abs(closure))), projection=projection)


def time_orders(budgets, weights):
    require(len(budgets) == 3, "three temporal budgets required")
    output = []
    for key in ("rhs_integral", *TERMS, "quadrature_residual"):
        errors = [R["weighted_rms"](budgets[i][key]-budgets[i+1][key], weights) for i in (0, 1)]
        resolved = all(error > NUMERICAL_FLOOR for error in errors)
        output.append(dict(field=key, differences=errors, floor=NUMERICAL_FLOOR, resolved=resolved,
                           observed_order=math.log2(errors[0]/errors[1]) if resolved else None,
                           status="descriptive" if resolved else "unresolved", physical_gate=False))
    return output


def save(directory, name, fields, layout, deadline):
    array = np.stack([fields[key] for key in layout])
    guard(directory, deadline, additional=array.nbytes+1024)
    with (directory/name).open("xb") as handle:
        np.save(handle, array, allow_pickle=False)
    guard(directory, deadline)


def run_case(case, driver, directory, deadline, row):
    label, times, states = case["label"], [], []
    for index, point in enumerate(case["trajectory"]):
        row["phase"] = "point"
        record = dict(point=index, completed=False)
        row["points"].append(record)
        require(type(point["point"]) is int and point["point"] == index and point["time"] == index*case["dt"]
                and point["input_unchanged"] is True, "ordered saved point required")
        guard(directory, deadline)
        source = bounded(PARENT.parent, point["array"])
        q = np.load(source, allow_pickle=False)
        require(q.dtype == np.float64 and q.shape == (58, case["n"], case["n"], case["n"]), "canonical FP64 state required")
        fields, measured = sample(driver, q)
        filename = f"{label}-point-{index:04d}.npy"
        save(directory, filename, fields, FIELDS, deadline)
        record.update(**measured, time=point["time"], input_sha256=sha(source), fields_array=filename, completed=True)
        times.append(point["time"])
        states.append(fields)
    row["phase"] = "time-budget"
    fields, measured = time_budget(times, states, R["weights_and_regions"](driver)[0])
    filename = label+"-budget.npy"
    save(directory, filename, fields, BUDGET_FIELDS, deadline)
    row.update(budget=measured, budget_norms=norms(driver, fields), budget_array=filename, completed=True, phase="completed")
    print(json.dumps(dict(case=label, states=len(states), projection=measured["projection"])), flush=True)
    return fields


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.parent == EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence directory required")
    started = time.perf_counter()
    deadline = started+SECONDS
    guard(directory, deadline)
    before, tests, parent = sources(args.test_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-determinant-balance-study-v1", completed=False, instantaneous_balance_passed=False,
        errors=[], source_before=before, source_after={}, cases=[], tests=tests, identity=identity(),
        parent_sha256=RETAINED[PARENT], audit_sha256=RETAINED[AUDIT], protocol_sha256=before[PROTOCOL],
        hypothesis_selected_post_hoc=True, new_evolution_executed=False, regrades_parent=False,
        intermediate_rk_fields_reconstructed=False, closure_completed=False,
        point_field_layout=FIELDS, budget_field_layout=BUDGET_FIELDS,
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
        python=sys.version, numpy=np.__version__, platform=platform.platform(), **{k: False for k in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot differs")
        require(len(parent["cases"]) == len(MATRIX), "complete parent case matrix required")
        budgets, weights = [], None
        for case, spec in zip(parent["cases"], MATRIX, strict=True):
            label, n, _dt, steps, perturbed = spec
            row = dict(label=label, n=n, completed=False, phase="initialization", points=[])
            result["cases"].append(row)
            R["check_case"](case, spec)
            require(len(case["trajectory"]) == steps+1, "complete parent trajectory required")
            guard(directory, deadline)
            grid = Grid3D((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
            driver = NonlinearSBPCube(grid)
            require(A["same"](driver.identity, case["operator_identity"]) and A["same"](
                dict(gauge=vars(driver.gauge), config=vars(driver.config), profile=driver.profile.identity()), case["parameters"]),
                "unchanged production parameters required")
            budget = run_case(case, driver, directory, deadline, row)
            if perturbed:
                budgets.append(budget)
                weights = R["weights_and_regions"](driver)[0]
        result["temporal_quadrature_comparison"] = time_orders(budgets, weights)
        result.update(completed=True, instantaneous_balance_passed=True)
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if result["cases"]:
            result["cases"][-1].update(completed=False, failure=f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = sha(bounded(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source recheck {name}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source identity changed")
    try:
        for path, digest in {**RETAINED, args.test_report.resolve(): tests["runner_tests"]["sha256"]}.items():
            require(sha(path) == digest, "retained input/report changed")
        A["verify_manifest"](PARENT, parent)
        result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["instantaneous_balance_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, instantaneous_balance_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "instantaneous_balance_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["instantaneous_balance_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

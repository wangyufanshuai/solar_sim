"""Fresh shadow evolution; dual diagnostics never replace the retained H gate."""
from __future__ import annotations

import argparse
import json
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
from science.numerical_relativity.sbp_metric_geometry import constraints_from_slots, identity  # noqa: E402

R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-refinement.py"))
require, sha, bounded = (R[k] for k in ("require", "sha", "bounded"))
MATRIX, FLAGS, EVIDENCE = (R[k] for k in ("MATRIX", "FLAGS", "EVIDENCE"))
NonlinearSBPCube, Grid3D = R["NonlinearSBPCube"], R["Grid3D"]
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-nonlinear-dual-diagnostics.md"
EXTRA = (PROTOCOL, "scripts/run-nr-k3-nonlinear-dual-diagnostics.py",
         "scripts/tests/test_nr_nonlinear_dual_diagnostics.py")
PARENT = EVIDENCE/"nr-k3-metric-geometry-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-metric-geometry-replay-v1-20261009/receipt.json"
EVOLUTION = EVIDENCE/"nr-k3-nonlinear-refinement-v1-20261009/receipt.json"
REGRESSION = ROOT/"tmp/nr-metric-geometry-regression-v1-20261009.xml"
RETAINED = {
    PARENT: "91d83db1eea622d95570b0760699204ae644beb4e545a5be95d7315a51bbb422",
    REPLAY: "437a21558bd235dd82236eb5923f278e07a7042461db87fa0fb3705c6ff64954",
    EVOLUTION: "463a8ec5da3693097cc861b7481fd8c434801b2849161db4abbb5fa27b14fc3f",
    EVIDENCE/"nr-k3-nonlinear-refinement-audit-v1-20261009.json":
        "7339b041d77a4892ad5a2c2510457ed9fdbc5d3e77ad06efd493a7162e52c3d4",
    REGRESSION: "b49f541d2575ba190646d9106cef8da1db858cef982eab15f55d957df159d901",
    R["OLD"]["NATIVE"]: R["OLD"]["NATIVE_SHA"],
}
SECONDS, OUTPUT_CAP, HEADROOM = 2400., 96*1024**2, 8*1024**2
C_RESERVE, E_RESERVE = R["C_RESERVE"], R["E_RESERVE"]
OLD_KEYS = R["OLD"]["DIAGNOSTICS"] | {"state_error"}
NEW_KEYS = {"H_metric_hessian", "M_metric_hessian", "H_diagnostic_difference"}


def same(a, b):
    return json.dumps(a, sort_keys=True, allow_nan=False) == json.dumps(b, sort_keys=True, allow_nan=False)


def verify_artifacts(path, data):
    names = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(names == set(data["artifact_hashes"]), "complete retained artifact set required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(bounded(path.parent, name)) == digest, "retained artifact changed: "+name)
    return len(names)


def sources(report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity changed: "+path.name)
    parent, replay, evolution = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, REPLAY, EVOLUTION))
    require(same({k: v for k, v in parent.items() if k != "seconds"},
                 {k: v for k, v in replay.items() if k != "seconds"}), "general geometry exact replay required")
    checked = 0
    for path, data in ((PARENT, parent), (REPLAY, replay), (EVOLUTION, evolution)):
        require(data["completed"] is True and data["errors"] == [] and data["source_before"] == data["source_after"]
                and all(data.get(k) is False for k in FLAGS), "complete unadmitted parent required")
        checked += verify_artifacts(path, data)
    require(parent["static_geometry_passed"] is True and evolution["refinement_screen_passed"] is False,
            "static gate and retained failed evolution identity required")
    before = dict(parent["source_after"])
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source changed: "+name)
    require(all(before.get(k) == v for k, v in evolution["source_after"].items()), "evolution source changed")
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    regression = R["green_report"](REGRESSION, expected_count=1623)
    report = bounded(ROOT, report.resolve().relative_to(ROOT).as_posix())
    tests = R["green_report"](report, classname_suffix="scripts.tests.test_nr_nonlinear_dual_diagnostics")
    tests["path"] = report.relative_to(ROOT).as_posix()
    return before, dict(runner_tests=tests, regression=regression, retained_artifacts_checked=checked), evolution


def guard(directory, deadline, *, additional=0):
    require(time.perf_counter() < deadline, "2400s absolute dual-diagnostic deadline reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free-additional >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used+additional+HEADROOM <= OUTPUT_CAP, "96MiB dual-diagnostic output cap reached")


def measurements(driver, q, reference):
    original = q.tobytes()
    fields = driver.metric_constraints(q)
    geometry = constraints_from_slots(q, driver.volume.grid.spacing)
    delta_m = float(np.max(abs(geometry["M_metric"]-fields["M_metric"])))
    require(delta_m <= 2.e-11 and geometry["ricci_antisymmetry_max"] <= 2.e-11,
            "momentum/symmetry diagnostic agreement failed")
    fields.update(state_error=np.moveaxis(q-reference, 0, -1), H_metric_hessian=geometry["H_metric_hessian"],
                  M_metric_hessian=geometry["M_metric"], H_diagnostic_difference=geometry["H_metric_hessian"]-fields["H_metric"])
    weights, masks = R["weights_and_regions"](driver)
    result = {region: {key: R["weighted_rms"](value, weights, mask) for key, value in fields.items()}
              for region, mask in masks.items()}
    require(q.tobytes() == original, "diagnostics mutated an evolved state")
    return dict(measurements=result, input_unchanged=True, maximum_M_difference=delta_m,
                ricci_antisymmetry_max=geometry["ricci_antisymmetry_max"])


def old_measurements(point):
    return {region: {key: value for key, value in values.items() if key in OLD_KEYS}
            for region, values in point["measurements"].items()}


def sample_name(label, point, steps):
    return label+("-initial.npy" if point == 0 else ("-final.npy" if point == steps else f"-step-{point:04d}.npy"))


def validate_trajectory(row):
    points, steps = row.get("trajectory", []), row["steps"]
    require(len(points) == steps+1, "complete accepted-state trajectory required")
    for index, point in enumerate(points):
        require(type(point.get("point")) is int and point["point"] == index
                and R["numeric"](point.get("time")) and point["time"] == index*row["dt"]
                and point.get("array") == sample_name(row["label"], index, steps)
                and point.get("input_unchanged") is True, "ordered unchanged trajectory binding required")
        for key in ("maximum_M_difference", "ricci_antisymmetry_max"):
            require(R["numeric"](point.get(key)) and 0. <= point[key] <= 2.e-11, "point diagnostic consistency failed")
        require(set(point.get("measurements", {})) == set(R["REGIONS"]), "all trajectory regions required")
        for norms in point["measurements"].values():
            require(set(norms) == OLD_KEYS | NEW_KEYS and all(R["numeric"](v) and v >= 0. for v in norms.values()),
                    "complete finite dual diagnostics required")
    require(same(old_measurements(points[0]), row["initial_measurements"])
            and same(old_measurements(points[-1]), row["final_measurements"]), "endpoint diagnostic binding changed")


def evaluate(cases, differences):
    legacy = R["evaluate"](cases, differences)
    for row in cases:
        validate_trajectory(row)
        require(row.get("exact_legacy_endpoint_replay") is True and row.get("exact_legacy_record_replay") is True,
                "unchanged evolution replay required")
    spatial = []
    for key, minimum in (("state_error", 1.5), ("M_metric", 1.5), ("H_metric_hessian", 2.2)):
        for a, b in ((0, 1), (1, 2)):
            pair = R["order_record"](cases[a]["trajectory"][-1]["measurements"]["whole"][key],
                cases[b]["trajectory"][-1]["measurements"]["whole"][key], (MATRIX[b][1]-1)/(MATRIX[a][1]-1), minimum)
            spatial.append(dict(metric=key, minimum=minimum, grids=[MATRIX[a][1], MATRIX[b][1]], **pair))
    return dict(legacy=legacy, spatial=spatial, temporal=legacy["temporal"],
                metric_hessian_screen_passed=all(p["passed"] for p in spatial) and legacy["temporal_passed"]
                    and legacy["active_updated_sat"],
                accepted_state_points=sum(len(row["trajectory"]) for row in cases),
                exact_legacy_endpoint_replay=True, regrades_legacy=False)


def save_sample(directory, driver, q, reference, row, point, deadline):
    name = sample_name(row["label"], point, row["steps"])
    guard(directory, deadline, additional=q.nbytes+1024)
    R["save_array"](directory, name, q)
    row["last_persisted_point"] = point
    guard(directory, deadline)
    result = measurements(driver, q, reference)
    guard(directory, deadline)
    row["trajectory"].append(dict(point=point, time=point*row["dt"], array=name, **result))
    return row["trajectory"][-1]


def run_case(driver, initial, reference, spec, directory, deadline, row):
    label, _n, dt, steps, _perturbed = spec
    q, original = None, initial.tobytes()
    try:
        guard(directory, deadline)
        q = initial.copy()
        row.update(operator_identity=driver.identity, trajectory=[],
                   parameters=dict(gauge=vars(driver.gauge), config=vars(driver.config), profile=driver.profile.identity()))
        row["phase"] = "initial-diagnostics"
        point = save_sample(directory, driver, q, reference, row, 0, deadline)
        row.update(initial_array=point["array"], initial_measurements=old_measurements(point))
        targets = driver.boundary_targets(reference)

        def boundary(_half_index):
            guard(directory, deadline)
            return targets

        for index in range(steps):
            row.update(phase="step", attempted_step=index)
            guard(directory, deadline)
            candidate, stages = driver.step(q, index, dt, boundary)
            require(R["valid_stages"](stages), "invalid stage contract")
            require(candidate.shape == q.shape and candidate.dtype == np.float64 and np.all(np.isfinite(candidate)),
                    "finite canonical accepted state required")
            q = candidate
            row["step_records"].append(dict(step=index, stages=stages))
            row["last_completed_step"] = index
            row["phase"] = "accepted-diagnostics"
            point = save_sample(directory, driver, q, reference, row, index+1, deadline)
            print(json.dumps(dict(case=label, completed_step=index+1, steps=steps,
                old_H=point["measurements"]["whole"]["H_metric"], new_H=point["measurements"]["whole"]["H_metric_hessian"],
                max_det_error=max(s["det_h_max_error"] for s in stages))), flush=True)
        row.update(final_array=point["array"], final_measurements=old_measurements(point))
        require(initial.tobytes() == original, "initial data mutated")
        guard(directory, deadline)
        row.update(completed=True, phase="completed")
    except Exception as error:
        row.update(completed=False, failure=f"{type(error).__name__}: {error}")
        if q is not None:
            try:
                used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
                require(used+q.nbytes+HEADROOM < OUTPUT_CAP and shutil.disk_usage(ROOT).free-q.nbytes-1024 >= E_RESERVE,
                        "failure-state reserve unavailable")
                R["save_array"](directory, label+"-last-accepted.npy", q)
                row["last_accepted_array"] = label+"-last-accepted.npy"
            except Exception as persistence_error:
                row["failure_state_persistence_error"] = str(persistence_error)
        raise
    finally:
        row["input_unchanged"] = initial.tobytes() == original
    return q


def compare_legacy(row, old, directory):
    require(row["label"] == old["label"], "legacy case binding mismatch")
    row["exact_legacy_endpoint_replay"] = all(
        sha(bounded(directory, row[key])) == sha(bounded(EVOLUTION.parent, old[key]))
        for key in ("initial_array", "final_array"))
    keys = ("step_records", "initial_measurements", "final_measurements", "operator_identity", "parameters")
    row["exact_legacy_record_replay"] = all(same(row[key], old[key]) for key in keys)
    require(row["exact_legacy_endpoint_replay"] and row["exact_legacy_record_replay"], "legacy evolution replay differs")


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
    before, tests, evolution = sources(args.test_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-nonlinear-dual-diagnostics-v1", completed=False, metric_hessian_screen_passed=False,
        legacy_refinement_screen_passed=False, closure_completed=False, regrades_legacy=False, errors=[], cases=[],
        source_before=before, source_after={}, tests=tests, diagnostic_identity=identity(),
        parent_sha256=RETAINED[PARENT], evolution_sha256=RETAINED[EVOLUTION], protocol_sha256=sha(ROOT/PROTOCOL),
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
        python=sys.version, numpy=np.__version__, platform=platform.platform(),
        **{key: False for key in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot mismatch")
        finals, weights = [], None
        for spec, old in zip(MATRIX, evolution["cases"], strict=True):
            _label, n, _dt, _steps, perturbed = spec
            row = R["new_case_record"](spec)
            result["cases"].append(row)
            row["phase"] = "initialization"
            guard(directory, deadline)
            grid = Grid3D((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
            driver = NonlinearSBPCube(grid)
            reference = np.array(R["analytic_slots"](n, 4, R["SchwarzschildDomain"]()), dtype=np.float64)
            initial = reference.copy()
            if perturbed:
                initial[11:] += 1.e-4*R["OLD"]["disturbance"](grid)[11:]
            final = run_case(driver, initial, reference, spec, directory, deadline, row)
            row["phase"] = "legacy-comparison"
            compare_legacy(row, old, directory)
            row["phase"] = "completed"
            if perturbed:
                finals.append(final)
                weights = R["weights_and_regions"](driver)[0]
        differences = [R["weighted_rms"](np.moveaxis(finals[i]-finals[i+1], 0, -1), weights) for i in (0, 1)]
        result["decision"] = evaluate(result["cases"], differences)
        result.update(completed=True, metric_hessian_screen_passed=result["decision"]["metric_hessian_screen_passed"],
                      legacy_refinement_screen_passed=result["decision"]["legacy"]["passed"])
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
            require(sha(path) == digest, "retained identity changed: "+path.name)
        result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["metric_hessian_screen_passed"] &= result["completed"]
    result["legacy_refinement_screen_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, metric_hessian_screen_passed=False, legacy_refinement_screen_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "metric_hessian_screen_passed",
        "legacy_refinement_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["metric_hessian_screen_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

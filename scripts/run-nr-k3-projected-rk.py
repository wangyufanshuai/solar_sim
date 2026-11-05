"""Prospective default-off RK policy controls and bounded common-initial-data pilot."""
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
from science.numerical_relativity.fo_ccz4_algebraic_projection import (  # noqa: E402
    algebraic_errors, algebraic_fields, correction_fields, project_algebraic_slots,
)
from science.numerical_relativity.fo_ccz4_projected_rk import (  # noqa: E402
    POLICIES, ProjectedShadowCube, algebraic_velocity, rk4_policy_step,
)

S = runpy.run_path(str(ROOT/"scripts/run-nr-k3-algebraic-projection.py"))
D, A, R = (S[k] for k in ("D", "A", "R"))
require, sha, bounded = (R[k] for k in ("require", "sha", "bounded"))
FLAGS, EVIDENCE, NonlinearSBPCube, Grid3D = (R[k] for k in ("FLAGS", "EVIDENCE", "NonlinearSBPCube", "Grid3D"))
PARENT = EVIDENCE/"nr-k3-algebraic-projection-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-algebraic-projection-replay-v1-20261009/receipt.json"
REGRESSION = ROOT/"tmp/nr-algebraic-projection-regression-v1-20261009.xml"
RETAINED = {
    PARENT: "b06ae9e74fe3714d6fc582ba9996674d1fa7f9008b159549c9ab43dc0749c694",
    REPLAY: "493cf1247f86d924789b20b17bacd659a1ed09f32312a983f38107def73c07b6",
    REGRESSION: "61c7f8838112b55d0b23788c2de0c2c68126de396fc97992781deefc1d5b6dc8",
    R["OLD"]["NATIVE"]: R["OLD"]["NATIVE_SHA"],
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-projected-rk.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/fo_ccz4_projected_rk.py",
         "science/numerical_relativity/test_fo_ccz4_projected_rk.py",
         "scripts/run-nr-k3-projected-rk.py", "scripts/tests/test_nr_projected_rk.py")
C_RESERVE, E_RESERVE = R["C_RESERVE"], R["E_RESERVE"]
SECONDS, OUTPUT_CAP, HEADROOM = 1200., 192*1024**2, 16*1024**2
FLOOR = 2.e-13
STEPS = (8, 16, 32, 64)
PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
MATRIX = tuple((f"static-{policy}", policy, False, 1./256, 1) for policy in POLICIES)+tuple(
    (f"perturbed-{policy}-{steps}", policy, True, 1./(256*steps), steps)
    for policy in POLICIES for steps in (1, 2, 4))


def guard(directory, deadline, *, additional=0):
    require(time.perf_counter() < deadline, "1200s absolute RK pilot deadline reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free-additional >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used+additional+HEADROOM <= OUTPUT_CAP, "192MiB RK pilot output cap reached")


def sources(report, regression):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity drift: "+path.name)
    parent, replay = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, REPLAY))
    require(D["same"]({k: v for k, v in parent.items() if k != "seconds"},
                      {k: v for k, v in replay.items() if k != "seconds"}), "exact standalone-map replay required")
    checked = 0
    for path, data in ((PARENT, parent), (REPLAY, replay)):
        require(data["completed"] is True and data["component_passed"] is True and data["errors"] == []
                and data["source_before"] == data["source_after"]
                and data["parent_probe_passed"] is False and all(data.get(k) is False for k in FLAGS),
                "complete unadmitted algebraic-map parent required")
        checked += D["verify_artifacts"](path, data)
    before = dict(parent["source_after"])
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source drift: "+name)
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    report, regression = (bounded(ROOT, p.resolve().relative_to(ROOT).as_posix()) for p in (report, regression))
    tests, merged, baseline = (R["green_report"](p) for p in (report, regression, REGRESSION))
    suffixes = ("science.numerical_relativity.test_fo_ccz4_projected_rk", "scripts.tests.test_nr_projected_rk")
    require(len(tests["classes"]) == 2 and all(any(c.endswith(s) for c in tests["classes"]) for s in suffixes),
            "both new focused modules required")
    require(set(merged["classes"]) == set(baseline["classes"]) | set(tests["classes"])
            and merged["tests"] == 1898+tests["tests"], "full inherited and new regression required")
    tests["path"], merged["path"] = report.relative_to(ROOT).as_posix(), regression.relative_to(ROOT).as_posix()
    return before, dict(focused=tests, regression=merged, inherited=baseline, retained_artifacts_checked=checked)


def observed_orders(errors):
    require(len(errors) >= 2 and all(math.isfinite(v) and v >= 0. for v in errors), "finite errors required")
    return [math.log2(a/b) if a > FLOOR and b > FLOOR and a > b else None
            for a, b in zip(errors[:-1], errors[1:], strict=True)]


def rotation(theta):
    c, s = math.cos(theta), math.sin(theta)
    return np.array([[c, -s, 0.], [s, c, 0.], [0., 0., 1.]])


def tensor_exact(t):
    """Independent constructed solution, not the projection implementation."""
    diagonal = np.diag(np.exp([.4, -.15, -.25]))
    root = np.diag(np.exp([.2, -.075, -.125]))
    shear = np.array([[.2, -.1, .04], [-.1, -.05, .02], [.04, .02, -.15]])
    tensors = [diagonal, root@shear@root]+[root@(shear*(k+1)*.3)@root for k in range(3)]
    rotate = rotation(t+.15*t*t+.37)
    q = np.linspace(-.01, .01, 58)
    for offset, value in zip((0, 11, 37, 43, 49), tensors, strict=True):
        value = rotate@value@rotate.T
        for slot, (i, j) in enumerate(PAIRS):
            q[offset+slot] = value[i, j]
    q[7] = math.sin(t)
    return q


def tensor_rhs(q, t):
    generator = np.array([[0., -1., 0.], [1., 0., 0.], [0., 0., 0.]])
    f = np.zeros(58)
    for offset in (0, 11, 37, 43, 49):
        tensor = np.zeros((3, 3))
        for slot, (i, j) in enumerate(PAIRS):
            tensor[i, j] = tensor[j, i] = q[offset+slot]
        derivative = (1.+.3*t)*(generator@tensor-tensor@generator)
        for slot, (i, j) in enumerate(PAIRS):
            f[offset+slot] = derivative[i, j]
    f[7] = math.cos(t)
    return f


def analytic_controls():
    rows = []
    for problem in ("tangent-circle", "tangent-canonical58", "non-tangent-circle"):
        for policy in POLICIES:
            errors, original_errors, norm_defects = [], [], []
            for steps in STEPS:
                dt = 1./steps
                is_tensor = problem == "tangent-canonical58"
                normal = problem == "non-tangent-circle"
                q = tensor_exact(0.) if is_tensor else np.array([1., 0.])
                def evaluate(value, half):
                    t = .5*half*dt
                    if is_tensor:
                        f = tensor_rhs(value, t)
                    else:
                        f = (1. if normal else 1.+.3*t)*np.array([-value[1], value[0]])
                        if normal:
                            f += .4*value
                    return f, {}
                def project(value):
                    return project_algebraic_slots(value, enabled=True) if is_tensor else value/np.linalg.norm(value)
                for index in range(steps):
                    q, _ = rk4_policy_step(q, index, dt, evaluate, policy=policy, projector=project)
                theta = 1. if normal else 1.15
                constrained = tensor_exact(1.) if is_tensor else np.array([math.cos(theta), math.sin(theta)])
                original = math.exp(.4)*constrained if normal else constrained
                errors.append(float(np.linalg.norm(q-constrained)))
                original_errors.append(float(np.linalg.norm(q-original)))
                norm_defects.append(max(algebraic_errors(q).values()) if is_tensor else abs(float(q@q)-1.))
            row = dict(problem=problem, policy=policy, steps=list(STEPS), constrained_target_errors=errors,
                       original_ode_errors=original_errors, algebraic_residuals=norm_defects,
                       constrained_target_orders=observed_orders(errors), original_ode_orders=observed_orders(original_errors))
            rows.append(row)
    for row in rows:
        if row["problem"].startswith("tangent"):
            require(all(p is not None and 3.7 <= p <= 4.3 for p in row["constrained_target_orders"][-2:]),
                    "tangent analytic order gate failed: "+row["problem"]+"/"+row["policy"])
        elif row["policy"] == "stages-and-endpoint":
            require(all(p is not None and .8 <= p <= 1.2 for p in row["constrained_target_orders"][-2:]),
                    "non-tangency negative control did not resolve predicted first order")
    return dict(rows=rows, tangent_controls_passed=True, first_order_negative_control_resolved=True,
                proves_fo_ccz4_order=False, nonlinear_stability_validated=False)


def finite_difference_rate(q, f):
    predicted = algebraic_velocity(q, f)
    rows = []
    for eps in (1.e-3, 1.e-4):
        plus, minus = algebraic_fields(q+eps*f), algebraic_fields(q-eps*f)
        fields = dict(logdet_rate=(np.log1p(plus["det_h"])-np.log1p(minus["det_h"]))/2./eps,
                      trace_a_rate=(plus["trace_a"]-minus["trace_a"])/2./eps,
                      trace_D_rate=(plus["trace_D"]-minus["trace_D"])/2./eps)
        error = {k: float(np.max(abs(fields[k]-predicted[k]))) for k in predicted}
        require(max(error.values()) <= 2.e-8, "directional derivative check failed")
        rows.append(dict(epsilon=eps, maximum_absolute_errors=error, tolerance=2.e-8,
                         predicted_maxima={k: float(np.max(abs(v))) for k, v in predicted.items()}))
    return rows


def save(directory, name, q, deadline):
    guard(directory, deadline, additional=q.nbytes+1024)
    with (directory/name).open("xb") as handle:
        np.save(handle, q, allow_pickle=False)
    return name


def measured(driver, q, reference):
    record = D["measurements"](driver, q, reference)
    independent, _ = A["reconstructed"](q, reference)
    record["independent_diagnostics_max"] = A["compare_norms"](independent, record["measurements"])
    record["algebraic_errors"] = algebraic_errors(q)
    return record


class Observer:
    def __init__(self, directory, deadline, label, driver, row):
        self.directory, self.deadline, self.label, self.driver, self.row = directory, deadline, label, driver, row
        self.step = 0

    def __call__(self, event, stage, half, raw, effective, rhs, report):
        guard(self.directory, self.deadline)
        key = f"{self.label}-step-{self.step:04d}-"+(f"stage-{stage}" if stage else "endpoint")
        if event in ("stage-raw", "endpoint-raw"):
            self.record = dict(step=self.step, stage=stage, half_index=half, completed=False, phase=event,
                               raw_array=save(self.directory, key+"-raw.npy", raw, self.deadline))
            self.row["observations"].append(self.record)
        else:
            self.record["phase"] = event
        if event in ("stage-input", "endpoint"):
            self.record.update(effective_array=save(self.directory, key+"-effective.npy", effective, self.deadline),
                raw_algebraic_errors=algebraic_errors(raw), effective_algebraic_errors=algebraic_errors(effective),
                corrections=S["norms"](self.driver, correction_fields(raw, effective)))
            if self.row["policy"] == "none":
                require(raw.tobytes() == effective.tobytes(), "off policy changed state")
        if event == "stage-rhs":
            self.record.update(rhs_array=save(self.directory, key+"-rhs.npy", rhs, self.deadline), report=report,
                               algebraic_velocity=S["norms"](self.driver, algebraic_velocity(effective, rhs)))
            require(R["OLD"]["valid_stage"](report) and report["min_lapse"] < 2.
                    and report["det_h_max_error"] <= 1.e-10, "unchanged stage contract failed")
            if self.step == 0 and stage == 1:
                self.record["directional_derivative_check"] = finite_difference_rate(effective, rhs)
            self.record["completed"] = True
        if event == "endpoint":
            require(algebraic_errors(effective)["det_h"] <= 1.e-10, "unchanged endpoint determinant cap failed")
            self.record["completed"] = True


def collect(directory, deadline, result):
    grid = Grid3D((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    old = NonlinearSBPCube(grid)
    reference = A["A"]["initial_slots"](9)
    initials = {}
    result["initial_data"] = []
    for perturbed in (False, True):
        raw = A["A"]["initial_slots"](9, perturbed)
        initial = project_algebraic_slots(raw, enabled=True)
        label = "perturbed" if perturbed else "static"
        raw_name = save(directory, label+"-original-initial.npy", raw, deadline)
        mapped_name = save(directory, label+"-common-initial.npy", initial, deadline)
        result["initial_data"].append(dict(label=label, original_array=raw_name, common_array=mapped_name,
            original_sha256=sha(directory/raw_name), common_sha256=sha(directory/mapped_name),
            original=measured(old, raw, reference), common=measured(old, initial, reference),
            correction_norms=S["norms"](old, correction_fields(raw, initial)), einstein_constraint_solve=False,
            is_new_initial_value_problem=True, restart_of_failed_parent=False))
        initials[perturbed] = initial
    targets = old.boundary_targets(reference)
    endpoints = {}
    for label, policy, perturbed, dt, steps in MATRIX:
        guard(directory, deadline)
        initial = initials[perturbed]
        q, original = initial.copy(), initial.tobytes()
        row = dict(label=label, policy=policy, n=9, dt=dt, steps=steps, observations=[], trajectory=[],
                   completed=False, phase="initial", common_initial_sha256=sha(directory/(
                       ("perturbed" if perturbed else "static")+"-common-initial.npy")))
        result["cases"].append(row)
        driver = ProjectedShadowCube(grid, policy=policy)
        observe = Observer(directory, deadline, label, driver, row)
        driver.observer = observe
        row["operator_identity"] = driver.identity
        try:
            row["trajectory"].append(dict(point=0, time=0., **measured(driver, q, reference)))
            for index in range(steps):
                observe.step, row["phase"] = index, "step"
                input_bytes = q.tobytes()
                candidate, reports = driver.step(q, index, dt, lambda half: targets)
                require(q.tobytes() == input_bytes and R["valid_stages"](reports), "complete unmutated step required")
                row["phase"] = "endpoint-diagnostics"
                point = dict(point=index+1, time=(index+1)*dt, **measured(driver, candidate, reference))
                point["array"] = row["observations"][-1]["effective_array"]
                row["trajectory"].append(point)
                q = candidate
                print(json.dumps(dict(case=label, completed_step=index+1, steps=steps,
                                      H=point["measurements"]["whole"]["H_metric_hessian"],
                                      M=point["measurements"]["whole"]["M_metric"])), flush=True)
            if label == "static-none":
                row["phase"] = "independent-old-step"
                guard(directory, deadline)
                old_endpoint, old_reports = old.step(initial, 0, dt, lambda half: targets)
                old_name = save(directory, "static-unchanged-old-endpoint.npy", old_endpoint, deadline)
                require(old_endpoint.tobytes() == q.tobytes() and D["same"](
                    old_reports, [dict(stage=x["stage"], **x["report"]) for x in row["observations"] if x["stage"]]),
                    "off adapter differs from actual old driver")
                row.update(old_step_array=old_name, unchanged_old_step_byte_exact=True)
            endpoints[label] = q
            row.update(completed=True, phase="completed")
        except Exception as error:
            row["failure"] = f"{type(error).__name__}: {error}"
            row["restart_permitted"] = False
            raise
        finally:
            row["input_unchanged"] = initial.tobytes() == original
            if not row["input_unchanged"]:
                row["completed"] = False
    result["temporal_self_comparisons"] = []
    for policy in POLICIES:
        q = [endpoints[f"perturbed-{policy}-{n}"] for n in (1, 2, 4)]
        weights, masks = R["weights_and_regions"](old)
        regional = {}
        for region, mask in masks.items():
            diffs = [R["weighted_rms"](np.moveaxis(a-b, 0, -1), weights, mask)
                     for a, b in zip(q[:-1], q[1:], strict=True)]
            regional[region] = dict(differences=diffs, order=observed_orders(diffs)[0], floor=FLOOR)
        result["temporal_self_comparisons"].append(dict(policy=policy, regions=regional,
            physical_gate=False, time_window=1./256, analytic_fo_ccz4_reference=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    parser.add_argument("--regression-report", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.parent == EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence directory required")
    started = time.perf_counter()
    deadline = started+SECONDS
    guard(directory, deadline)
    before, tests = sources(args.test_report, args.regression_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-projected-rk-policy-pilot-v1", completed=False, component_passed=False,
        cases=[], errors=[], source_before=before, source_after={}, tests=tests,
        parent_sha256=RETAINED[PARENT], parent_probe_passed=False, protocol_sha256=before[PROTOCOL],
        old_failure_regraded=False, new_initial_value_problem=True, long_time_validation=False,
        fo_ccz4_temporal_order_validated=False, native_checkpoint_supported=False, closure_completed=False,
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
        python=sys.version, numpy=np.__version__, platform=platform.platform(), **{key: False for key in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot differs")
        result["analytic_controls"] = analytic_controls()
        print(json.dumps(dict(analytic_controls_passed=True)), flush=True)
        collect(directory, deadline, result)
        require(len(result["cases"]) == 12 and all(c["completed"] and c["input_unchanged"] for c in result["cases"]),
                "complete fixed12-case matrix required")
        result.update(completed=True, component_passed=True)
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = sha(bounded(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source recheck {name}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source identity changed")
    try:
        reports = {args.test_report.resolve(): tests["focused"]["sha256"],
                   args.regression_report.resolve(): tests["regression"]["sha256"]}
        for path, digest in {**RETAINED, **reports}.items():
            require(sha(path) == digest, "retained input or report changed")
        for path in (PARENT, REPLAY):
            D["verify_artifacts"](path, json.loads(path.read_text(encoding="utf-8")))
        result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["component_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, component_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "component_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["component_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

"""Pre-registered N13 common-initial-data policy windows; no old-source edits."""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
P = runpy.run_path(str(ROOT/"scripts/run-nr-k3-projected-rk.py"))
RK_AUDIT = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-projected-rk.py"))
R, D, S = (P[k] for k in ("R", "D", "S"))
require, sha, bounded = (P[k] for k in ("require", "sha", "bounded"))
EVIDENCE, FLAGS, POLICIES = (P[k] for k in ("EVIDENCE", "FLAGS", "POLICIES"))
C_RESERVE, E_RESERVE = P["C_RESERVE"], P["E_RESERVE"]
PARENT = EVIDENCE/"nr-k3-projected-rk-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-projected-rk-replay-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-projected-rk-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-projected-rk-final-regression-v1-20261009.xml"
MAP_RECEIPT, OLD_RECEIPT = P["PARENT"], S["PARENT"]
RETAINED = {
    PARENT: "14f3ac404750a5f21540f5c8209e6cfbbe0cea85c2bb406e4a58f98124c81ccc",
    REPLAY: "2f793a52a972163ed7a178a1a8c6d8715a89fbb90e262d8987f243c291d381fc",
    AUDIT: "211e86e0b469671cc730c18c1df164b5c6576b1b6dd032edf7a17a21397e869d",
    REGRESSION: "f3fba10e76788c2659adcf1c894b64fa6fc272b49559afcb2fbffeebf42666d4",
    MAP_RECEIPT: P["RETAINED"][P["PARENT"]], OLD_RECEIPT: S["RETAINED"][S["PARENT"]],
    R["OLD"]["NATIVE"]: R["OLD"]["NATIVE_SHA"],
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-common-initial-window.md"
EXTRA = (PROTOCOL, "scripts/run-nr-k3-common-initial-window.py", "scripts/tests/test_nr_common_initial_window.py",
         "scripts/audit-nr-k3-common-initial-window.py", "scripts/tests/test_nr_common_initial_window_audit.py",
         "scripts/audit-nr-k3-projected-rk.py", "scripts/tests/test_nr_projected_rk_audit.py")
SECONDS, OUTPUT_CAP, HEADROOM = 2400., 768*1024**2, 32*1024**2
N, DT, STEPS = 13, 1./256, 16
RAW_NAME, REFERENCE_NAME = "perturbed-13-long-point-0000.npy", "static-13-long-point-0000.npy"
MAPPED_NAME = "perturbed-13-long-point-0000-mapped.npy"
INITIAL_SHA = "d1e70bc8e22efbb83a25b09948809b63b8f4c194bf3bee41767425da7433d1d2"
REFERENCE_SHA = "683a3540c7247aab2d57c9846cabdf6f42396d63f21a58540c01fafb6e14f0ae"


class ResourceLimit(ValueError):
    """A resource limit aborts the entire matrix, never just one policy."""


class EvidenceFailure(ValueError):
    """Record/diagnostic failure is not a numerical-method comparison outcome."""


def guard(directory, deadline, *, additional=0):
    if time.perf_counter() >= deadline:
        raise ResourceLimit("2400s absolute common-initial window deadline reached")
    if shutil.disk_usage("C:/").free < C_RESERVE or shutil.disk_usage(ROOT).free-additional < E_RESERVE:
        raise ResourceLimit("C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    if used+additional+HEADROOM > OUTPUT_CAP:
        raise ResourceLimit("768MiB common-initial window output cap reached")


def verify_retained():
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity drift: "+path.name)
    for path in (PARENT, REPLAY, MAP_RECEIPT, OLD_RECEIPT):
        data = json.loads(path.read_text(encoding="utf-8"))
        D["verify_artifacts"](path, data)
    require(sha(OLD_RECEIPT.parent/RAW_NAME) == INITIAL_SHA
            and sha(OLD_RECEIPT.parent/REFERENCE_NAME) == REFERENCE_SHA, "time-zero input drift")


def sources(report, regression):
    verify_retained()
    parent, _ = RK_AUDIT["audit_receipt"](PARENT)
    replay, _ = RK_AUDIT["audit_receipt"](REPLAY)
    require(D["same"]({k: v for k, v in parent.items() if k != "seconds"},
                      {k: v for k, v in replay.items() if k != "seconds"}), "exact projected-RK parent replay required")
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and audit["exact_replay_except_root_seconds"]
            and audit["auditor_sha256"] == sha(ROOT/"scripts/audit-nr-k3-projected-rk.py")
            and audit["auditor_tests_source_sha256"] == sha(ROOT/"scripts/tests/test_nr_projected_rk_audit.py"),
            "frozen independent audit required")
    before = dict(parent["source_after"])
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    report, regression = (bounded(ROOT, path.resolve().relative_to(ROOT).as_posix()) for path in (report, regression))
    tests, merged, baseline = (R["green_report"](path) for path in (report, regression, REGRESSION))
    suffixes = ("scripts.tests.test_nr_common_initial_window", "scripts.tests.test_nr_common_initial_window_audit")
    require(len(tests["classes"]) == 2 and all(any(c.endswith(s) for c in tests["classes"]) for s in suffixes),
            "both window test modules required")
    require(set(merged["classes"]) == set(baseline["classes"]) | set(tests["classes"])
            and merged["tests"] == 1971+tests["tests"], "complete inherited and new regression required")
    tests["path"], merged["path"] = report.relative_to(ROOT).as_posix(), regression.relative_to(ROOT).as_posix()
    return before, dict(focused=tests, regression=merged, baseline=baseline)


def save(directory, name, q, deadline):
    guard(directory, deadline, additional=q.nbytes+1024)
    with (directory/name).open("xb") as handle:
        np.save(handle, q, allow_pickle=False)
    return name


class Observer:
    def __init__(self, directory, deadline, driver, row):
        self.directory, self.deadline, self.driver, self.row = directory, deadline, driver, row
        self.step = 0

    def __call__(self, event, stage, half, raw, effective, rhs, report):
        key = f"{self.row['label']}-step-{self.step:04d}-"+(f"stage-{stage}" if stage else "endpoint")
        if event in ("stage-raw", "endpoint-raw"):
            self.record = dict(step=self.step, stage=stage, half_index=half, completed=False, phase=event)
            self.row["observations"].append(self.record)  # before any fallible save/guard
        else:
            self.record["phase"] = event
        guard(self.directory, self.deadline)
        if event in ("stage-raw", "endpoint-raw"):
            self.record["raw_array"] = save(self.directory, key+"-raw.npy", raw, self.deadline)
        if event in ("stage-input", "endpoint"):
            self.record["effective_array"] = save(self.directory, key+"-effective.npy", effective, self.deadline)
            self.record.update(raw_algebraic_errors=P["algebraic_errors"](raw),
                effective_algebraic_errors=P["algebraic_errors"](effective),
                corrections=S["norms"](self.driver, P["correction_fields"](raw, effective)))
            if self.row["policy"] == "none" and raw.tobytes() != effective.tobytes():
                raise EvidenceFailure("off observer detected undeclared state change")
        if event == "stage-rhs":
            self.record["rhs_array"] = save(self.directory, key+"-rhs.npy", rhs, self.deadline)
            self.record.update(report=report, algebraic_velocity=S["norms"](
                self.driver, P["algebraic_velocity"](effective, rhs)))
            require(R["OLD"]["valid_stage"](report) and report["min_lapse"] < 2.
                    and report["det_h_max_error"] <= 1.e-10, "unchanged stage contract failed")
            self.record["completed"] = True
        if event == "endpoint":
            require(P["algebraic_errors"](effective)["det_h"] <= 1.e-10, "unchanged endpoint determinant cap failed")
            self.record["completed"] = True


def rows():
    return [dict(label="common-13-"+policy, policy=policy, n=N, dt=DT, steps=STEPS, status="not-attempted",
                 completed=False, input_unchanged=True, trajectory=[], observations=[], accepted_steps=0,
                 restart_permitted=False) for policy in POLICIES]


def prepare(directory, deadline, driver, result):
    raw = np.load(OLD_RECEIPT.parent/RAW_NAME, allow_pickle=False)
    reference = np.load(OLD_RECEIPT.parent/REFERENCE_NAME, allow_pickle=False)
    expected = np.load(MAP_RECEIPT.parent/MAPPED_NAME, allow_pickle=False)
    initial = P["project_algebraic_slots"](raw, enabled=True)
    require(raw.shape == reference.shape == initial.shape == (58, N, N, N)
            and initial.tobytes() == expected.tobytes(), "same frozen time-zero mapping required")
    result["initial_data"] = dict(original_sha256=INITIAL_SHA, reference_sha256=REFERENCE_SHA,
        mapped_source_sha256=sha(MAP_RECEIPT.parent/MAPPED_NAME), new_initial_value_problem=True,
        restart_of_failed_parent=False, einstein_constraint_solve=False)
    for name, value in (("original", raw), ("reference", reference), ("common", initial), ("delta", initial-raw)):
        result["initial_data"][name+"_array"] = save(directory, "initial-"+name+".npy", value, deadline)
    result["initial_data"].update(common_sha256=sha(directory/"initial-common.npy"),
        original=P["measured"](driver, raw, reference), common=P["measured"](driver, initial, reference),
        correction_norms=S["norms"](driver, P["correction_fields"](raw, initial)))
    return initial, reference


def run_case(driver, initial, reference, row, directory, deadline):
    q, original = initial.copy(), initial.tobytes()
    row.update(status="running", phase="initial-diagnostics", operator_identity=driver.identity)
    observer = Observer(directory, deadline, driver, row)
    driver.observer = observer
    targets = driver.boundary_targets(reference)
    try:
        row["trajectory"].append(dict(point=0, time=0., array="initial-common.npy", **P["measured"](driver, q, reference)))
        for index in range(row["steps"]):
            observer.step = index
            row.update(phase="step", attempted_step=index)
            guard(directory, deadline)
            step_input = q.tobytes()
            try:
                candidate, reports = driver.step(q, index, row["dt"], lambda half: targets)
            except (ResourceLimit, EvidenceFailure):
                raise
            except (ValueError, FloatingPointError, np.linalg.LinAlgError) as error:
                row.update(status="method-failed", failure=f"{type(error).__name__}: {error}",
                           failure_location=copy.deepcopy(row["observations"][-1]) if row["observations"] else None)
                return  # no retry of this method; remaining registered policies are independent
            require(q.tobytes() == step_input and R["valid_stages"](reports), "incomplete or mutated RK step")
            row["phase"] = "endpoint-diagnostics"
            point = dict(point=index+1, time=(index+1)*row["dt"], array=row["observations"][-1]["effective_array"],
                         **P["measured"](driver, candidate, reference))
            guard(directory, deadline)
            row["trajectory"].append(point)
            row["accepted_steps"], q = index+1, candidate
            print(json.dumps(dict(case=row["label"], accepted_steps=index+1, planned_steps=row["steps"],
                time=point["time"], det=point["algebraic_errors"]["det_h"],
                H=point["measurements"]["whole"]["H_metric_hessian"], M=point["measurements"]["whole"]["M_metric"])), flush=True)
        row.update(completed=True, status="completed", phase="completed")
    except Exception as error:
        row.update(status="batch-aborted", failure=f"{type(error).__name__}: {error}")
        raise
    finally:
        row["input_unchanged"] = initial.tobytes() == original
        if row["trajectory"]:
            row["last_accepted_array"] = row["trajectory"][-1]["array"]
            row["last_accepted_time"] = row["trajectory"][-1]["time"]
        require(row["input_unchanged"], "shared initial data mutated")


def collect(directory, deadline, result):
    grid = P["Grid3D"]((N,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    baseline = P["NonlinearSBPCube"](grid)
    initial, reference = prepare(directory, deadline, baseline, result)
    result["cases"] = rows()  # register all policies before beginning any evolution
    for row in result["cases"]:
        row["common_initial_sha256"] = result["initial_data"]["common_sha256"]
    for row in result["cases"]:
        guard(directory, deadline)
        driver = P["ProjectedShadowCube"](grid, policy=row["policy"])
        run_case(driver, initial, reference, row, directory, deadline)
        print(json.dumps(dict(case=row["label"], status=row["status"], accepted_steps=row["accepted_steps"])), flush=True)
    result["matrix_executed"] = True


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
    if shutil.disk_usage(ROOT).free-OUTPUT_CAP < E_RESERVE:
        raise ResourceLimit("E drive cannot reserve the complete declared batch")
    before, tests = sources(args.test_report, args.regression_report)
    directory.mkdir()
    result = dict(schema="nr-common-initial-window-v1", completed=False, window_passed=False, matrix_executed=False,
        cases=rows(), errors=[], source_before=before, source_after={}, tests=tests,
        parent_sha256=RETAINED[PARENT], old_failed_receipt_sha256=RETAINED[OLD_RECEIPT], old_failure_regraded=False,
        protocol_sha256=before[PROTOCOL], temporal_order_validated=False, long_time_stability_validated=False,
        native_checkpoint_supported=False, resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP,
            c_reserve=C_RESERVE, e_reserve=E_RESERVE), python=sys.version, numpy=np.__version__,
        platform=platform.platform(), **{k: False for k in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot mismatch")
        collect(directory, deadline, result)
        for row in result["cases"]:
            if not row["completed"]:
                result["errors"].append(row["label"]+": "+row.get("failure", row["status"]))
        result["completed"] = result["window_passed"] = result["matrix_executed"] and not result["errors"]
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = sha(bounded(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source check {name}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source identity changed")
    try:
        verify_retained()
        for path, key in ((args.test_report, "focused"), (args.regression_report, "regression")):
            require(sha(path) == tests[key]["sha256"], "test report changed")
        result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["window_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, window_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "window_passed", "matrix_executed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

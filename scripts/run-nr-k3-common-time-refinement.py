"""Fixed common-initial-data temporal refinement; no frozen solver edits."""
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
W = runpy.run_path(str(ROOT/"scripts/run-nr-k3-common-initial-window.py"))
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-common-initial-window.py"))
P, R = W["P"], W["R"]
require, sha, bounded, guard = (W[k] for k in ("require", "sha", "bounded", "guard"))
EVIDENCE, FLAGS, SECONDS, OUTPUT_CAP = (W[k] for k in ("EVIDENCE", "FLAGS", "SECONDS", "OUTPUT_CAP"))
PARENT = EVIDENCE/"nr-k3-common-initial-window-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-common-initial-window-replay-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-common-initial-window-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-common-window-regression-v1-20261009.xml"
RETAINED = {
    PARENT: "f6598b941dfc1215b94dfe7748730e3d734de0962c35a1b19476209b7b951c1f",
    REPLAY: "428922957c3b4f5ef052f4f024a0306a2090ff149fa3fd934fac0cf38236901d",
    AUDIT: "e144264d7c7dd33fa82f4d5bf71d7b99c1d2658b1a5962c50fba9872ad8fbf94",
    REGRESSION: "2c6131c97e5cbd6dc13c1e153095df6647088fb90bc439435fa89ad9860f5b7d",
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-common-time-refinement.md"
EXTRA = (PROTOCOL, "scripts/run-nr-k3-common-time-refinement.py", "scripts/audit-nr-k3-common-time-refinement.py",
         "scripts/tests/test_nr_common_time_refinement.py", "scripts/tests/test_nr_common_time_refinement_audit.py")
N, END_TIME, STEPS = 13, 1./16, (7, 14, 28)
FLOOR, MINIMUM, MAXIMUM = 2.e-13, 3.5, 4.5
REGIONS = ("whole", "central_box", "faces", "edges", "corners")
COMMON_SHA = "413c4f4b614e68456420c0ccb37070455fffa9d77f452e6eb4d62800c3f576b5"


def verify_retained():
    W["verify_retained"]()
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained temporal-parent identity drift: "+path.name)
    for path in (PARENT, REPLAY):
        W["D"]["verify_artifacts"](path, json.loads(path.read_text(encoding="utf-8")))


def sources(report, regression):
    verify_retained()
    parent, _ = A["audit"](PARENT)
    replay, _ = A["audit"](REPLAY)
    require(parent["completed"] and parent["window_passed"]
            and {k: v for k, v in parent.items() if k != "seconds"}
            == {k: v for k, v in replay.items() if k != "seconds"}, "completed exact parent replay required")
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and audit["exact_replay_except_root_seconds"]
            and audit["auditor_sha256"] == sha(ROOT/"scripts/audit-nr-k3-common-initial-window.py")
            and audit["tests_source_sha256"] == sha(ROOT/"scripts/tests/test_nr_common_initial_window_audit.py"),
            "source-bound independent parent audit required")
    before = dict(parent["source_after"])
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    report, regression = (bounded(ROOT, p.resolve().relative_to(ROOT).as_posix()) for p in (report, regression))
    focused, merged, baseline = (R["green_report"](p) for p in (report, regression, REGRESSION))
    suffixes = ("scripts.tests.test_nr_common_time_refinement", "scripts.tests.test_nr_common_time_refinement_audit")
    require(len(focused["classes"]) == 2 and all(any(c.endswith(s) for c in focused["classes"]) for s in suffixes),
            "both temporal test modules required")
    require(set(merged["classes"]) == set(baseline["classes"]) | set(focused["classes"])
            and merged["tests"] == 2002+focused["tests"], "complete inherited temporal regression required")
    focused["path"], merged["path"] = report.relative_to(ROOT).as_posix(), regression.relative_to(ROOT).as_posix()
    return before, dict(focused=focused, regression=merged, baseline=baseline)


def rows():
    return [dict(label=f"time-13-{steps}", policy="none", n=N, dt=END_TIME/steps, steps=steps,
                 status="not-attempted", completed=False, input_unchanged=True, trajectory=[], observations=[],
                 accepted_steps=0, restart_permitted=False, common_initial_sha256=COMMON_SHA) for steps in STEPS]


def summary(cases, driver, load):
    require(len(cases) == 3, "three temporal resolutions required")
    arrays = []
    for row, expected in zip(cases, rows(), strict=True):
        require(all(row.get(k) == expected[k] for k in ("label", "policy", "n", "dt", "steps", "common_initial_sha256"))
                and row["completed"] is True and row["status"] == "completed"
                and row["accepted_steps"] == row["steps"] and row["input_unchanged"] is True
                and row["restart_permitted"] is False, "complete common-initial fixed matrix required")
        require(row["trajectory"][-1]["time"] == END_TIME, "same final physical time required")
        q = load(row["trajectory"][-1]["array"])
        require(q.shape == (58, N, N, N) and q.dtype == np.float64 and np.all(np.isfinite(q)), "finite FP64 endpoints required")
        arrays.append(q)
    weights, masks = R["weights_and_regions"](driver)
    regional = {}
    for region in REGIONS:
        errors = [R["weighted_rms"](np.moveaxis(a-b, 0, -1), weights, masks[region])
                  for a, b in zip(arrays[:-1], arrays[1:], strict=True)]
        regional[region] = dict(**R["order_record"](*errors, 2., MINIMUM, MAXIMUM),
                                minimum_difference_over_floor=min(errors)/FLOOR)
    status = "failed" if any(r["status"] == "failed" for r in regional.values()) else (
        "passed" if all(r["passed"] for r in regional.values()) else "unresolved")
    return dict(regions=regional, status=status, passed=status == "passed", floor=FLOOR,
                minimum_order=MINIMUM, maximum_order=MAXIMUM, time=END_TIME, steps=list(STEPS),
                policy="none", spatial_order_validated=False, analytic_evolution_reference=False, physical_gate=False)


def collect(directory, deadline, result):
    grid = P["Grid3D"]((N,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    baseline = P["NonlinearSBPCube"](grid)
    initial, reference = W["prepare"](directory, deadline, baseline, result)
    require(result["initial_data"]["common_sha256"] == COMMON_SHA, "frozen common initial identity required")
    for row in result["cases"]:
        guard(directory, deadline)
        driver = P["ProjectedShadowCube"](grid, policy="none")
        W["run_case"](driver, initial, reference, row, directory, deadline)
        print(json.dumps(dict(case=row["label"], status=row["status"], accepted_steps=row["accepted_steps"])), flush=True)
    result["matrix_executed"] = True
    if all(r["completed"] for r in result["cases"]):
        result["temporal_screen"] = summary(result["cases"], baseline,
            lambda name: np.load(bounded(directory, name), allow_pickle=False))
        result["temporal_screen_passed"] = result["temporal_screen"]["passed"]


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
    require(shutil.disk_usage(ROOT).free-OUTPUT_CAP >= W["E_RESERVE"], "E drive cannot reserve complete batch")
    before, tests = sources(args.test_report, args.regression_report)
    directory.mkdir()
    result = dict(schema="nr-common-time-refinement-v1", completed=False, matrix_executed=False, errors=[],
        cases=rows(), temporal_screen=None, temporal_screen_passed=False, source_before=before, source_after={}, tests=tests,
        parent_sha256=RETAINED[PARENT], protocol_sha256=before[PROTOCOL], old_failure_regraded=False,
        temporal_order_validated=False, long_time_stability_validated=False, native_checkpoint_supported=False,
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=W["C_RESERVE"], e_reserve=W["E_RESERVE"]),
        python=sys.version, numpy=np.__version__, platform=platform.platform(), **{k: False for k in FLAGS})
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
        result["completed"] = result["matrix_executed"] and not result["errors"]
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
    result["temporal_screen_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, temporal_screen_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "matrix_executed", "temporal_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

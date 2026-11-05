"""Physical-initial-data preserving Schwarzschild lapse pulse, shadow only."""
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
T = runpy.run_path(str(ROOT/"scripts/run-nr-k3-common-time-refinement.py"))
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-common-time-refinement.py"))
from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots, identity  # noqa: E402
P, R = W["P"], W["R"]
require, sha, bounded, guard = (W[k] for k in ("require", "sha", "bounded", "guard"))
EVIDENCE, FLAGS, SECONDS, OUTPUT_CAP = (W[k] for k in ("EVIDENCE", "FLAGS", "SECONDS", "OUTPUT_CAP"))
PARENT = EVIDENCE/"nr-k3-common-time-refinement-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-common-time-refinement-replay-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-common-time-refinement-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-common-time-regression-v2-20261009.xml"
RETAINED = {
    PARENT: "c86f57d76b656b19b73118204c210a1c217428de490463eec8f0f7aa50dc8c56",
    REPLAY: "1c4afb196ee5c882bcd9f28330ca18240dcd32c8b98ee3fef94b214a3cafa08e",
    AUDIT: "508dada74add44933a90d24cd88f83f6e57b603ae92c5f9152ea055e0db50530",
    REGRESSION: "1e3bf68f3dbe09ee559666f99aeb9a293284d35ecce1e00fca2f263e8e27e76f",
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-schwarzschild-gauge-pulse.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/fo_ccz4_gauge_pulse.py",
         "science/numerical_relativity/test_fo_ccz4_gauge_pulse.py",
         "scripts/run-nr-k3-schwarzschild-gauge-pulse.py", "scripts/audit-nr-k3-schwarzschild-gauge-pulse.py",
         "scripts/tests/test_nr_schwarzschild_gauge_pulse.py", "scripts/tests/test_nr_schwarzschild_gauge_pulse_audit.py")
N, END_TIME, STEPS = 13, 1./16, (7, 14, 28)
FLOOR, MINIMUM, MAXIMUM = 2.e-13, 3.5, 4.5
REGIONS = ("whole", "central_box", "faces", "edges", "corners")



def verify_retained():
    T["verify_retained"]()
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained temporal-parent identity drift: "+path.name)
    for path in (PARENT, REPLAY):
        W["D"]["verify_artifacts"](path, json.loads(path.read_text(encoding="utf-8")))


def sources(report, regression):
    verify_retained()
    parent, _ = A["audit"](PARENT)
    replay, _ = A["audit"](REPLAY)
    require(parent["completed"] and parent["temporal_screen"]["status"] == "unresolved"
            and {k: v for k, v in parent.items() if k != "seconds"}
            == {k: v for k, v in replay.items() if k != "seconds"}, "completed exact parent replay required")
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and audit["exact_replay_except_root_seconds"]
            and audit["auditor_sha256"] == sha(ROOT/"scripts/audit-nr-k3-common-time-refinement.py")
            and audit["tests_source_sha256"] == sha(ROOT/"scripts/tests/test_nr_common_time_refinement_audit.py"),
            "source-bound independent parent audit required")
    before = dict(parent["source_after"])
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    report, regression = (bounded(ROOT, p.resolve().relative_to(ROOT).as_posix()) for p in (report, regression))
    focused, merged, baseline = (R["green_report"](p) for p in (report, regression, REGRESSION))
    suffixes = ("science.numerical_relativity.test_fo_ccz4_gauge_pulse",
                "scripts.tests.test_nr_schwarzschild_gauge_pulse", "scripts.tests.test_nr_schwarzschild_gauge_pulse_audit")
    require(len(focused["classes"]) == 3 and all(any(c.endswith(s) for c in focused["classes"]) for s in suffixes),
            "initial-data, runner and auditor test modules required")
    require(set(merged["classes"]) == set(baseline["classes"]) | set(focused["classes"])
            and merged["tests"] == 2042+focused["tests"], "complete inherited temporal regression required")
    focused["path"], merged["path"] = report.relative_to(ROOT).as_posix(), regression.relative_to(ROOT).as_posix()
    return before, dict(focused=focused, regression=merged, baseline=baseline)


def rows(common_sha=None):
    return [dict(label=f"gauge-pulse-13-{steps}", policy="none", n=N, dt=END_TIME/steps, steps=steps,
                 status="not-attempted", completed=False, input_unchanged=True, trajectory=[], observations=[],
                 accepted_steps=0, restart_permitted=False, common_initial_sha256=common_sha) for steps in STEPS]


def summary(cases, driver, load):
    require(len(cases) == 3, "three temporal resolutions required")
    arrays = []
    common_sha = cases[0].get("common_initial_sha256")
    require(isinstance(common_sha, str) and len(common_sha) == 64
            and all(c in "0123456789abcdef" for c in common_sha), "common initial hash required")
    for row, expected in zip(cases, rows(common_sha), strict=True):
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
    initial, reference = initial_slots(N)
    result["initial_data"] = dict(identity=identity(), new_gauge_initial_value_problem=True,
        old_perturbed_problem_replaced=False, einstein_constraint_solve=False, algebraic_projection=False)
    for name, value in (("reference", reference), ("common", initial), ("delta", initial-reference)):
        result["initial_data"][name+"_array"] = W["save"](directory, "initial-"+name+".npy", value, deadline)
        result["initial_data"][name+"_sha256"] = sha(directory/result["initial_data"][name+"_array"])
    require(result["initial_data"]["reference_sha256"] == W["REFERENCE_SHA"], "static reference identity drift")
    result["initial_data"].update(common=P["measured"](baseline, initial, reference),
                                  reference=P["measured"](baseline, reference, reference))
    for row in result["cases"]:
        row["common_initial_sha256"] = result["initial_data"]["common_sha256"]
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
    result = dict(schema="nr-schwarzschild-gauge-pulse-v1", completed=False, matrix_executed=False, errors=[],
        cases=rows(), temporal_screen=None, temporal_screen_passed=False, source_before=before, source_after={}, tests=tests,
        parent_sha256=RETAINED[PARENT], protocol_sha256=before[PROTOCOL], old_failure_regraded=False,
        temporal_order_validated=False, long_time_stability_validated=False, native_checkpoint_supported=False, old_temporal_screen_regraded=False,
        state_error_interpretation="departure from static background, NOT analytic positive-time error",
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

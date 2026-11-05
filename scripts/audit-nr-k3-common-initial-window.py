"""Independent saved-prefix/diagnostic audit, including failed method outcomes.

No production integrator or RHS is executed. A completed accepted PREFIX is
audited separately; it never changes the original failed case's completed flag.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import runpy
import shutil
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RK_AUDIT = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-projected-rk.py"))
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"))
require, sha, contained = (RK_AUDIT[k] for k in ("require", "sha", "contained"))
FLAGS, POLICIES, EVIDENCE = RK_AUDIT["FLAGS"], RK_AUDIT["POLICIES"], RK_AUDIT["EVIDENCE"]


def audit_prefix(row, initial, reference, load):
    accepted = row["accepted_steps"]
    require(type(accepted) is int and 0 <= accepted <= row["steps"], "accepted step count invalid")
    require(row["input_unchanged"] is True and row["restart_permitted"] is False, "unchanged nonrestartable input required")
    if row["status"] == "not-attempted":
        require(accepted == 0 and not row["observations"] and not row["trajectory"] and not row["completed"],
                "not-attempted case contains evolution")
        return dict(label=row["label"], status=row["status"], accepted_steps=0, prefix_audited=False)
    require(len(row["trajectory"]) == accepted+1, "only accepted trajectory points required")
    require(row["trajectory"][0]["array"] == "initial-common.npy" and row["trajectory"][0]["time"] == 0.
            and row["trajectory"][0]["point"] == 0, "common time-zero link required")
    if row["completed"]:
        require(accepted == row["steps"] and row["status"] == "completed", "false complete case")
    else:
        require(row["status"] in ("method-failed", "batch-aborted") and isinstance(row.get("failure"), str),
                "explicit failure required")
    prefix = copy.deepcopy(row)
    prefix.update(steps=accepted, completed=True, observations=row["observations"][:5*accepted])
    checked = RK_AUDIT["audit_case"](prefix, initial, load)
    maximum = 0.
    for point in row["trajectory"]:
        q = initial if point["point"] == 0 else load(point["array"])
        norms, _ = A["reconstructed"](q, reference)
        maximum = max(maximum, A["compare_norms"](norms, point["measurements"]))
    remainder = row["observations"][5*accepted:]
    require(len(remainder) <= 5, "more than one failed step recorded")
    require(not row["completed"] or not remainder, "complete case contains extra failed observations")
    partial_arrays = 0
    for index, record in enumerate(remainder):
        require(record["step"] == accepted and record["stage"] == (index+1 if index < 4 else 0)
                and record["half_index"] == 2*accepted+(0, 1, 1, 2, 2)[index], "failed-stage identity mismatch")
        for key in ("raw_array", "effective_array", "rhs_array"):
            if key in record:
                value = load(record[key])
                require(value.shape == initial.shape and value.dtype == np.float64, "partial array shape/dtype mismatch")
                partial_arrays += 1
    return dict(label=row["label"], status=row["status"], original_case_completed=row["completed"],
                accepted_steps=accepted, prefix_audited=True, prefix_only=not row["completed"],
                raw_rk_byte_exact=True, map_relative_max=checked["map_relative_max"],
                independent_diagnostics_max=maximum, partial_array_count=partial_arrays, failure_regraded=False)


def audit(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-common-initial-window-v1" and data["source_before"] == data["source_after"]
            and data["old_failure_regraded"] is False and data["temporal_order_validated"] is False
            and all(data.get(k) is False for k in FLAGS), "unchanged unadmitted window receipt required")
    files = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(files == set(data["artifact_hashes"]), "complete artifact manifest required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(contained(path.parent, name)) == digest, "artifact hash mismatch")
    for name, digest in data["source_after"].items():
        require(sha(contained(ROOT, name)) == digest, "current source drift")
    def load(name):
        return np.load(contained(path.parent, name), allow_pickle=False)
    initial_data = data["initial_data"]
    raw, initial, reference = (load(initial_data[k+"_array"]) for k in ("original", "common", "reference"))
    for key in ("original", "common", "reference"):
        require(sha(contained(path.parent, initial_data[key+"_array"])) == initial_data[key+"_sha256"], "initial hash drift")
    error = float(np.max(abs(RK_AUDIT["projected"](raw)-initial)/np.maximum(1., abs(initial))))
    require(error <= 2.e-12 and np.array_equal(load(initial_data["delta_array"]), initial-raw), "independent initial mapping failed")
    require(len(data["cases"]) == 3, "three pre-registered policy cases required")
    result = []
    for row, policy in zip(data["cases"], POLICIES, strict=True):
        require((row["label"], row["policy"], row["n"], row["dt"], row["steps"]) == (
            "common-13-"+policy, policy, 13, 1./256, 16), "fixed method matrix mismatch")
        require(row["common_initial_sha256"] == initial_data["common_sha256"], "common initial identity differs")
        result.append(audit_prefix(row, initial, reference, load))
    expected_pass = data["matrix_executed"] and not data["errors"] and all(row["completed"] for row in data["cases"])
    require(data["completed"] is expected_pass and data["window_passed"] is expected_pass, "window pass regraded")
    return data, dict(receipt_sha256=sha(path), cases=result, initial_map_relative_max=error,
                      artifacts_checked=len(files), source_keys_checked=len(data["source_after"]),
                      window_passed=data["window_passed"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--primary", type=Path, required=True)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--test-report", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh direct audit output required")
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2+65536,
            "original disk reserves required")
    for path in (args.primary, args.test_report, *([args.replay] if args.replay else [])):
        require(path.resolve().is_relative_to(ROOT), "local evidence input required")
    tests = list(ET.parse(args.test_report).getroot().iter("testcase"))
    require(tests and all(c.get("classname", "").endswith("scripts.tests.test_nr_common_initial_window_audit") for c in tests)
            and not any(x.tag in ("failure", "error", "skipped") for c in tests for x in c), "green dedicated audit tests required")
    primary, checked = audit(args.primary.resolve())
    result = dict(schema="nr-common-initial-window-audit-v1", audit_completed=True, primary=checked,
        exact_replay_except_root_seconds=False, rhs_recomputed=False, original_failure_regraded=False,
        auditor_sha256=sha(Path(__file__)), tests_source_sha256=sha(ROOT/"scripts/tests/test_nr_common_initial_window_audit.py"),
        tests_sha256=sha(args.test_report), tests_passed=len(tests), **{k: False for k in FLAGS})
    if args.replay:
        require(args.primary.resolve() != args.replay.resolve() and primary["completed"], "distinct replay of successful batch required")
        replay, repeated = audit(args.replay.resolve())
        require({k: v for k, v in primary.items() if k != "seconds"} == {k: v for k, v in replay.items() if k != "seconds"},
                "exact scientific replay differs")
        result.update(replay=repeated, exact_replay_except_root_seconds=True)
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2+65536,
            "original disk reserves required")
    with output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True, allow_nan=False)
        handle.write("\n")
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()

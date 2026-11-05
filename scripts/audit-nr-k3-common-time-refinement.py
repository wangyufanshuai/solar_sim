"""Independent saved-state temporal norms/orders; never executes a solver RHS."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import runpy
import shutil
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
W = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-common-initial-window.py"))
RK_AUDIT = W["RK_AUDIT"]
require, sha, contained, FLAGS, EVIDENCE = (W[k] for k in ("require", "sha", "contained", "FLAGS", "EVIDENCE"))
COMMON_SHA = "413c4f4b614e68456420c0ccb37070455fffa9d77f452e6eb4d62800c3f576b5"
REGIONS = ("whole", "central_box", "faces", "edges", "corners")
FLOOR = 2.e-13


def independent_screen(cases, load):
    """Explicit diagonal SBP norm and index-defined regions, separate summation."""
    require(len(cases) == 3, "three time resolutions required")
    q = []
    for row, steps in zip(cases, (7, 14, 28), strict=True):
        require((row["label"], row["policy"], row["n"], row["steps"], row["dt"], row["common_initial_sha256"])
                == (f"time-13-{steps}", "none", 13, steps, 1./(16*steps), COMMON_SHA)
                and row["completed"] is True and row["status"] == "completed"
                and row["accepted_steps"] == steps and row["input_unchanged"] is True
                and row["restart_permitted"] is False, "fixed completed time matrix required")
        require(row["trajectory"][-1]["time"] == 1./16, "common endpoint time required")
        q.append(RK_AUDIT["check_array"](load(row["trajectory"][-1]["array"]), 13))
    w = np.ones(13)
    w[:4] = np.array((17., 59., 43., 49.))/48.
    w[-4:] = w[:4][::-1]
    w /= 6.
    weights = w[:, None, None]*w[None, :, None]*w[None, None, :]
    i, j, k = np.indices((13, 13, 13))
    boundary_count = sum(((x == 0) | (x == 12)).astype(int) for x in (i, j, k))
    masks = dict(whole=np.ones((13,)*3, dtype=bool),
                 central_box=np.logical_and.reduce([(x >= 3) & (x <= 9) for x in (i, j, k)]),
                 faces=boundary_count == 1, edges=boundary_count == 2, corners=boundary_count == 3)
    differences = [a-b for a, b in zip(q[:-1], q[1:], strict=True)]
    regions = {}
    for region in REGIONS:
        selected = masks[region]
        errors = []
        for difference in differences:
            per_node = np.sum(difference*difference, axis=0)/58.
            numerator = math.fsum((per_node[selected]*weights[selected]).tolist())
            denominator = math.fsum(weights[selected].tolist())
            errors.append(math.sqrt(numerator/denominator))
        coarse, fine = errors
        resolved = min(errors) > FLOOR
        order = math.log2(coarse/fine) if resolved else None
        passed = bool(resolved and coarse > fine and 3.5 <= order <= 4.5)
        regions[region] = dict(coarse_error=coarse, fine_error=fine, refinement_ratio=2., floor=FLOOR,
            observed_order=order, resolved=resolved, passed=passed,
            status="passed" if passed else "failed" if resolved else "unresolved",
            minimum_difference_over_floor=min(errors)/FLOOR)
    status = "failed" if any(r["status"] == "failed" for r in regions.values()) else (
        "passed" if all(r["passed"] for r in regions.values()) else "unresolved")
    return dict(regions=regions, status=status, passed=status == "passed", floor=FLOOR,
        minimum_order=3.5, maximum_order=4.5, time=1./16, steps=[7, 14, 28], policy="none",
        spatial_order_validated=False, analytic_evolution_reference=False, physical_gate=False)


def compare_screen(reported, independent):
    require(set(reported) == set(independent) and all(reported[k] == independent[k] for k in independent if k != "regions"),
            "temporal scope/status changed")
    require(set(reported["regions"]) == set(REGIONS), "all five regions required")
    maximum = 0.
    for region, expected in independent["regions"].items():
        actual = reported["regions"][region]
        require(set(actual) == set(expected), "complete regional classification required")
        for key in ("refinement_ratio", "floor", "resolved", "passed", "status"):
            require(actual[key] == expected[key], "temporal classification changed")
        for key in ("coarse_error", "fine_error", "minimum_difference_over_floor"):
            require(type(actual[key]) in (float, int) and math.isfinite(actual[key]) and actual[key] >= 0., "finite errors required")
            relative = abs(actual[key]-expected[key])/max(abs(expected[key]), 1.e-300)
            require(relative <= 1.e-12, "independent SBP temporal norm differs")
            maximum = max(maximum, relative)
        if expected["observed_order"] is None:
            require(actual["observed_order"] is None, "unresolved order fabricated")
        else:
            require(type(actual["observed_order"]) in (float, int) and math.isfinite(actual["observed_order"])
                    and abs(actual["observed_order"]-expected["observed_order"]) <= 1.e-10, "temporal order differs")
    return maximum


def audit(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-common-time-refinement-v1" and data["source_before"] == data["source_after"]
            and all(data.get(k) is False for k in (*FLAGS, "old_failure_regraded", "temporal_order_validated",
                                                  "long_time_stability_validated", "native_checkpoint_supported")),
            "unchanged unadmitted temporal receipt required")
    files = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(files == set(data["artifact_hashes"]), "complete artifact manifest required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(contained(path.parent, name)) == digest, "artifact hash mismatch")
    for name, digest in data["source_after"].items():
        require(sha(contained(ROOT, name)) == digest, "current source drift")
    def load(name):
        return np.load(contained(path.parent, name), allow_pickle=False)
    initial_data = data["initial_data"]
    require(initial_data["common_sha256"] == COMMON_SHA, "fixed common initial required")
    raw, initial, reference = (load(initial_data[k+"_array"]) for k in ("original", "common", "reference"))
    for key in ("original", "common", "reference"):
        require(sha(contained(path.parent, initial_data[key+"_array"])) == initial_data[key+"_sha256"], "initial identity drift")
    initial_error = float(np.max(abs(RK_AUDIT["projected"](raw)-initial)/np.maximum(1., abs(initial))))
    require(initial_error <= 2.e-12 and np.array_equal(load(initial_data["delta_array"]), initial-raw), "initial mapping differs")
    require(len(data["cases"]) == 3, "complete registered time matrix required")
    checked = []
    for row, steps in zip(data["cases"], (7, 14, 28), strict=True):
        require((row["label"], row["policy"], row["n"], row["steps"], row["dt"], row["common_initial_sha256"])
                == (f"time-13-{steps}", "none", 13, steps, 1./(16*steps), COMMON_SHA), "time matrix drift")
        checked.append(W["audit_prefix"](row, initial, reference, load))
    expected_complete = data["matrix_executed"] and not data["errors"] and all(row["completed"] for row in data["cases"])
    require(data["completed"] is expected_complete, "computation completion regraded")
    independent, discrepancy = None, None
    if all(row["completed"] for row in data["cases"]):
        independent = independent_screen(data["cases"], load)
        discrepancy = compare_screen(data["temporal_screen"], independent)
    else:
        require(data["temporal_screen"] is None, "partial evolution used for time order")
    require(data["temporal_screen_passed"] is bool(expected_complete and independent and independent["passed"]),
            "scientific screen regraded")
    return data, dict(receipt_sha256=sha(path), artifacts_checked=len(files), source_keys_checked=len(data["source_after"]),
        cases=checked, initial_map_relative_max=initial_error, independent_temporal_screen=independent,
        temporal_norm_relative_difference_max=discrepancy)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--primary", type=Path, required=True)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--test-report", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh direct audit output required")
    def reserve():
        require(shutil.disk_usage("C:/").free >= 3*1024**3
                and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2+65536, "original disk reserves required")
    reserve()
    for path in (args.primary, args.test_report, *([args.replay] if args.replay else [])):
        require(path.resolve().is_relative_to(ROOT), "local inputs required")
    tests = list(ET.parse(args.test_report).getroot().iter("testcase"))
    require(tests and all(c.get("classname", "").endswith("scripts.tests.test_nr_common_time_refinement_audit") for c in tests)
            and not any(x.tag in ("failure", "error", "skipped") for c in tests for x in c), "green dedicated audit tests required")
    primary, checked = audit(args.primary.resolve())
    result = dict(schema="nr-common-time-refinement-audit-v1", audit_completed=True, primary=checked,
        exact_replay_except_root_seconds=False, rhs_recomputed=False, original_failure_regraded=False,
        temporal_order_validated=False, auditor_sha256=sha(Path(__file__)),
        tests_source_sha256=sha(ROOT/"scripts/tests/test_nr_common_time_refinement_audit.py"),
        tests_sha256=sha(args.test_report), tests_passed=len(tests), **{k: False for k in FLAGS})
    if args.replay:
        require(args.primary.resolve() != args.replay.resolve() and primary["completed"], "distinct replay of complete computation required")
        replay, repeated = audit(args.replay.resolve())
        require({k: v for k, v in primary.items() if k != "seconds"} == {k: v for k, v in replay.items() if k != "seconds"},
                "exact scientific replay differs")
        result.update(replay=repeated, exact_replay_except_root_seconds=True)
    reserve()
    with output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True, allow_nan=False)
        handle.write("\n")
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()

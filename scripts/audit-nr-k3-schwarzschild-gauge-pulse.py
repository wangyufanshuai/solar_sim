"""Independent analytic lapse-pulse and saved-state audit; no solver imports."""
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
REFERENCE_SHA = "683a3540c7247aab2d57c9846cabdf6f42396d63f21a58540c01fafb6e14f0ae"
REGIONS = ("whole", "central_box", "faces", "edges", "corners")
FLOOR = 2.e-13
INITIAL_IDENTITY = dict(schema="nr-schwarzschild-lapse-pulse-v1", amplitude=.001,
    center=[2.]*3, half_width=[.75]*3, polynomial_power=6, domain=[1., 3.], mass=1.,
    regularity="C5 compact support; not C-infinity", physical_metric_unchanged=True,
    physical_extrinsic_curvature_unchanged=True, analytically_constraint_satisfying_initial_data=True,
    einstein_constraint_solve=False, algebraic_projection=False,
    analytic_positive_time_solution=False, gravitational_radiation_injected=False,
    physical_boundary_validated=False, scientificPayloadWriteback=False)


def check_initial_metadata(data):
    require(data["identity"] == INITIAL_IDENTITY and data["new_gauge_initial_value_problem"] is True
            and data["old_perturbed_problem_replaced"] is False
            and data["algebraic_projection"] is False and data["einstein_constraint_solve"] is False,
            "fixed new gauge initial problem metadata required")


def independent_screen(cases, load, common_sha):
    """Explicit diagonal SBP norm and index-defined regions, separate summation."""
    require(len(cases) == 3, "three time resolutions required")
    q = []
    for row, steps in zip(cases, (7, 14, 28), strict=True):
        require((row["label"], row["policy"], row["n"], row["steps"], row["dt"], row["common_initial_sha256"])
                == (f"gauge-pulse-13-{steps}", "none", 13, steps, 1./(16*steps), common_sha)
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


def check_initial(initial, reference, delta):
    """Independent factorized compact polynomial; physical data are byte-identical."""
    RK_AUDIT["check_array"](initial, 13)
    RK_AUDIT["check_array"](reference, 13)
    keep = [k for k in range(58) if k not in (6, 25, 26, 27)]
    require(np.array_equal(initial[keep], reference[keep])
            and np.array_equal(delta, initial-reference), "physical or delta initial data changed")
    xyz = np.meshgrid(*(np.linspace(1., 3., 13) for _ in range(3)), indexing="ij")
    radius = np.sqrt(sum(x*x for x in xyz))
    analytic_reference = np.zeros_like(reference)
    analytic_reference[[0, 3, 5]] = 1.
    analytic_reference[6] = np.log((2.*radius-1.)/(2.*radius+1.))
    analytic_reference[10] = -2.*np.log(1.+.5/radius)
    for k in range(3):
        analytic_reference[25+k] = 4.*xyz[k]/(radius*(4.*radius**2-1.))
        analytic_reference[55+k] = xyz[k]/(radius**2*(radius+.5))
    reference_error = float(np.max(abs(reference-analytic_reference)))
    require(reference_error <= 2.e-14, "independent Schwarzschild reference differs")
    u = [(x-2.)/.75 for x in xyz]
    factors = [np.where(abs(v) < 1., (1.-v)**6*(1.+v)**6, 0.) for v in u]
    gradients = [np.where(abs(v) < 1.,
        6./.75*((1.-v)**6*(1.+v)**5-(1.-v)**5*(1.+v)**6), 0.) for v in u]
    pulse = factors[0]*factors[1]*factors[2]
    expected = reference.copy()
    expected[6] += .001*pulse
    for k in range(3):
        expected[25+k] += .001*gradients[k]*factors[(k+1) % 3]*factors[(k+2) % 3]
    error = float(np.max(abs(initial-expected)))
    require(error <= 2.e-14, "independent analytic pulse differs")
    require(float(np.max(abs(initial[6]-reference[6]))) > .00099, "missing lapse pulse")
    boundary = np.logical_or.reduce([(x == 1.) | (x == 3.) for x in xyz])
    require(initial[:, boundary].tobytes() == reference[:, boundary].tobytes(), "initial face target changed")
    return dict(analytic_initial_max_difference=error, analytic_reference_max_difference=reference_error,
                physical_initial_slots_byte_exact=True,
                initial_boundary_byte_exact=True, einstein_constraint_solve=False)


def audit(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-schwarzschild-gauge-pulse-v1" and data["source_before"] == data["source_after"]
            and all(data.get(k) is False for k in (*FLAGS, "old_failure_regraded", "old_temporal_screen_regraded", "temporal_order_validated",
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
    check_initial_metadata(initial_data)
    common_sha = initial_data["common_sha256"]
    require(initial_data["reference_sha256"] == REFERENCE_SHA, "known static Schwarzschild reference required")
    require(initial_data["new_gauge_initial_value_problem"] is True
            and initial_data["old_perturbed_problem_replaced"] is False
            and initial_data["algebraic_projection"] is False, "new gauge problem identity required")
    for key in ("common", "reference", "delta"):
        require(sha(contained(path.parent, initial_data[key+"_array"])) == initial_data[key+"_sha256"], "initial identity drift")
    initial, reference, delta = (load(initial_data[k+"_array"]) for k in ("common", "reference", "delta"))
    initial_checked = check_initial(initial, reference, delta)
    require(len(data["cases"]) == 3, "complete registered time matrix required")
    checked = []
    for row, steps in zip(data["cases"], (7, 14, 28), strict=True):
        require((row["label"], row["policy"], row["n"], row["steps"], row["dt"], row["common_initial_sha256"])
                == (f"gauge-pulse-13-{steps}", "none", 13, steps, 1./(16*steps), common_sha), "time matrix drift")
        checked.append(W["audit_prefix"](row, initial, reference, load))
    expected_complete = data["matrix_executed"] and not data["errors"] and all(row["completed"] for row in data["cases"])
    require(data["completed"] is expected_complete, "computation completion regraded")
    independent, discrepancy = None, None
    if all(row["completed"] for row in data["cases"]):
        independent = independent_screen(data["cases"], load, common_sha)
        discrepancy = compare_screen(data["temporal_screen"], independent)
    else:
        require(data["temporal_screen"] is None, "partial evolution used for time order")
    require(data["temporal_screen_passed"] is bool(expected_complete and independent and independent["passed"]),
            "scientific screen regraded")
    return data, dict(receipt_sha256=sha(path), artifacts_checked=len(files), source_keys_checked=len(data["source_after"]),
        cases=checked, initial_data=initial_checked, independent_temporal_screen=independent,
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
    require(tests and all(c.get("classname", "").endswith("scripts.tests.test_nr_schwarzschild_gauge_pulse_audit") for c in tests)
            and not any(x.tag in ("failure", "error", "skipped") for c in tests for x in c), "green dedicated audit tests required")
    primary, checked = audit(args.primary.resolve())
    result = dict(schema="nr-schwarzschild-gauge-pulse-audit-v1", audit_completed=True, primary=checked,
        exact_replay_except_root_seconds=False, rhs_recomputed=False, original_failure_regraded=False,
        temporal_order_validated=False, auditor_sha256=sha(Path(__file__)),
        tests_source_sha256=sha(ROOT/"scripts/tests/test_nr_schwarzschild_gauge_pulse_audit.py"),
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

"""Fixed7/14/28-step native campaign, no new equations and no promotion."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import sys
import time
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots, identity as pulse_identity
from science.numerical_relativity.nr3d import Grid3D
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube

P = runpy.run_path(str(ROOT / "scripts/run-nr-k3-projected-rk.py"))
require = N.require
PRIMARY = N.EVIDENCE / "nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json"
PRIMARY_SHA = "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0"
EXTRA = ("science/numerical_relativity/EXPERIMENT-20261010-native-gauge-pulse.md",
         "science/numerical_relativity/native_campaign.py", "scripts/run-nr-k3-native-gauge-pulse.py",
         "scripts/audit-nr-k3-native-gauge-pulse.py", "scripts/tests/test_nr_native_campaign.py")


def verify_tests(xml, receipt):
    for path in (xml, receipt):
        require(path.resolve().is_relative_to(ROOT / "tmp"), "local test evidence required")
    testcases = list(ET.parse(xml).getroot().iter("testcase"))
    require(testcases and not any(x.tag in ("failure", "error", "skipped") for t in testcases for x in t), "green zero-skip tests required")
    expected = {"scripts.tests.test_nr_native_campaign", "science.numerical_relativity.test_fo_ccz4_sbp_nonlinear",
                "science.numerical_relativity.test_fo_ccz4_gauge_pulse", "science.numerical_relativity.test_manifest",
                "science.numerical_relativity.test_auxiliary_manifest"}
    require({t.get("classname") for t in testcases} == expected, "new controls plus four reference modules required")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-native-campaign-tests-v1" and data["source_before"] == data["source_after"], "source-bound campaign tests required")
    require(data.get("real_native_multisegment") is True and data.get("real_diagnostic_failure") is True, "actual native orchestration and diagnostic-failure controls required")
    require(set(data["source_after"]) == set(EXTRA), "exact new source set required")
    for name, digest in data["source_after"].items():
        require(N.sha(ROOT / name) == digest, "test source drift")
    for name, digest in data["artifact_hashes"].items():
        require(N.sha(N.contained(receipt.parent, name)) == digest, "test artifact drift")
    return dict(xml=str(xml.relative_to(ROOT)), xml_sha256=N.sha(xml), tests=len(testcases),
                receipt=str(receipt.relative_to(ROOT)), receipt_sha256=N.sha(receipt))


def compare_python(result, directory, binding):
    require(N.sha(PRIMARY) == PRIMARY_SHA, "original Python experiment drift")
    primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
    results = []
    for row, old in zip(result["cases"], primary["cases"], strict=True):
        require((row["steps"], row["dt"], row["n"]) == (old["steps"], old["dt"], old["n"]), "Python time matrix mismatch")
        for point in row["trajectory"][1:]:
            checkpoint = N.codec.decode(N.contained(directory, point["checkpoint"]).read_bytes(), binding, point["segment_plan_sha256"])
            old_name = old["trajectory"][point["point"]]["array"]
            path = N.contained(PRIMARY.parent, old_name)
            require(N.sha(path) == primary["artifact_hashes"][old_name], "Python reference array changed")
            reference = np.load(path, allow_pickle=False)
            errors = N.regional_slot_errors(checkpoint["q"], reference)
            maximum = max(max(v) for v in errors.values())
            require(maximum <= 2e-11, "original Python endpoint parity failed")
            results.append(dict(case=row["label"], point=point["point"], reference=old_name,
                                reference_sha256=primary["artifact_hashes"][old_name], region_slot_errors=errors))
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    parser.add_argument("--test-receipt", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.parent == N.EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence directory required")
    require(N.worst_case_bytes() <= N.OUTPUT_CAP, "conservative storage estimate exceeds registration")
    budget = N.Budget(directory)
    tests = verify_tests(args.test_report.resolve(), args.test_receipt.resolve())
    identity, binding, before = N.native_identity()
    require(N.sha(PRIMARY) == PRIMARY_SHA, "Python parent SHA mismatch")
    primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
    for name, digest in primary["source_after"].items():
        require(N.sha(N.contained(ROOT, name)) == digest, "original physical problem source drift")
    before = N.merge_source_tables(before, {name: N.sha(ROOT / name) for name in EXTRA}, primary["source_after"])
    initial, reference = initial_slots(13)
    old_initial = primary["initial_data"]["common_array"]
    require(N.sha(PRIMARY.parent / old_initial) == primary["artifact_hashes"][old_initial] and initial.tobytes() == np.load(PRIMARY.parent / old_initial, allow_pickle=False).tobytes(), "original initial data bytes changed")
    cases = [dict(label=f"native-gauge-pulse-13-{steps}", n=13, steps=steps, dt=1/(16*steps), status="not-attempted", completed=False,
                  accepted_steps=0, native_published_steps=0, segments=[], trajectory=[]) for steps in (7, 14, 28)]
    global_plan = dict(schema="nr-native-gauge-pulse-plan-v1", n=13, lower=[1., 1., 1.], upper=[3., 3., 3.], end_time=1/16,
                       case_matrix=[dict(label=r["label"], steps=r["steps"], dt=r["dt"]) for r in cases],
                       segment_steps=2, initial_state_sha256=N.codec.sha(initial.tobytes()), reference_state_sha256=N.codec.sha(reference.tobytes()),
                       initial_identity=pulse_identity(), native_identity=identity, source_sha256=N.codec.sha(N.json_bytes(before)),
                       physical_gate=False, live_admission=False, scientificPayloadWriteback=False)
    global_raw = N.json_bytes(global_plan)
    global_sha = N.codec.sha(global_raw)
    directory.mkdir()
    started = time.monotonic()
    result = dict(schema="nr-native-gauge-pulse-v1", completed=False, cases=cases, errors=[], source_before=before, source_after={}, tests=tests,
                  global_plan_sha256=global_sha, global_plan="global-plan.json", native_identity=identity,
                  python_parent_sha256=PRIMARY_SHA, old_python_replay_completed=False, old_failure_regraded=False,
                  temporal_screen=None, temporal_screen_passed=False, spatial_order_validated=False, constraint_convergence_validated=False,
                  physical_gate=False, live_admission=False, scientificPayloadWriteback=False,
                  resource_caps=dict(seconds=N.SECONDS, output_bytes=N.OUTPUT_CAP, headroom=N.HEADROOM, c_reserve=N.C_RESERVE, e_reserve=N.E_RESERVE),
                  worst_case_bytes=N.worst_case_bytes(), state_error_interpretation="departure from static background, not exact positive-time error")
    try:
        budget.save("global-plan.json", global_raw)
        budget.save("binding.txt", binding)
        budget.record("registered-cases.json", cases)
        for name, value in (("initial", initial), ("reference", reference)):
            import io
            buffer = io.BytesIO()
            np.save(buffer, value, allow_pickle=False)
            budget.save(name + ".npy", buffer.getvalue())
        N.save_source_snapshot(budget, before)
        mesh = Grid3D((13,) * 3, (1.,) * 3, (3.,) * 3, boundary="sbp-volume", spatial_order=4)
        driver = NonlinearSBPCube(mesh)
        ends = []
        for row in cases:
            try:
                ends.append(N.run_case(budget, row, mesh, initial, reference, binding, global_sha, lambda q: P["measured"](driver, q, reference)))
            except Exception as error:
                row.update(status="batch-aborted", completed=False, failure=f"{type(error).__name__}: {error}")
                raise
        result["temporal_screen"] = N.temporal_screen(ends, driver, P["R"])
        result["python_endpoint_comparisons"] = compare_python(result, directory, binding)
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = N.sha(N.contained(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source:{name}: {error}")
    if result["source_after"] != before:
        result["errors"].append("source identity changed")
    try:
        after_identity, _, _ = N.native_identity()
        require(after_identity == identity, "native runtime changed")
        require(verify_tests(args.test_report.resolve(), args.test_receipt.resolve()) == tests, "test evidence changed")
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["temporal_screen_passed"] = bool(result["completed"] and result["temporal_screen"] and result["temporal_screen"]["passed"])
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): N.sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.monotonic() - started
    budget.record("receipt.json", result, finalizing=True)
    print(json.dumps({k: result[k] for k in ("completed", "temporal_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

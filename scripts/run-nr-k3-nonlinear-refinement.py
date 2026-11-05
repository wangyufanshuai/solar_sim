"""Prospective nonlinear space/time refinement; never physical admission."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import SchwarzschildDomain, analytic_slots  # noqa: E402
from science.numerical_relativity.nr3d import Grid3D  # noqa: E402

OLD = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-sat.py"))
FLAGS, EVIDENCE = OLD["FLAGS"], ROOT/"tmp/nr-shadow-evidence"
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-nonlinear-refinement.md"
PRIMARY = EVIDENCE/"nr-k3-nonlinear-sat-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-nonlinear-sat-replay-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-nonlinear-sat-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-deadline-regression-tests-v2-20261009.xml"
RETAINED = {
    PRIMARY: "e51a2b6dd4ad3ec3ed613135ef67561dae2ba3c6d9f105f90ac1464ae6d7a281",
    REPLAY: "bdacba46c4cb2ab04d3e80cc660ce242eaf4eb7e65604b6aaf5ab6495a5b39d4",
    AUDIT: "1e6149bb69b53826b0dde9be17cbbba72b6b71b6a65226d52d847c45513be7c6",
    OLD["NATIVE"]: OLD["NATIVE_SHA"],
    EVIDENCE/"nr-k3-schwarzschild-replay-e-storage-v1-20261008/receipt.json":
        "2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2",
    ROOT/"tmp/nr-nonlinear-sat-regression-v1-20261009.xml":
        "8ef63165806cc78683f35806da16a33b81a8fea3bf5ab61939a1bcef887aaafa",
    ROOT/"tmp/nr-deadline-regression-tests-v1-20261009.xml":
        "12a5ff5b6272db844b14055bf2aa813cd4561b23a84455714d371a5203416ab8",
    ROOT/"tmp/nr-deadline-parent-red-tests-v1-20261009.xml":
        "7e7a71bbd54c433cc12311dbaa11618ae7b12ea9cf8fa300eba8130168ce5274",
    REGRESSION: "65cc48b9dea03363d0884e5738ab0c6b9ed5166b730a701e2524a8734e247dd6",
}
TRANSITIONS = {
    "scripts/run-nr-k3-rk-stage-locality.py": (
        "e3e448edf7bdde7b570bc4628972192a91901dddbf353109b822934792b24eb7",
        "88e21026f47dd8f71d2fed1072a1e16241b8d9b7a313066d9ea923e400f50b32"),
    "scripts/run-nr-k3-initial-rhs-locality.py": (
        "5f315a6dcb9f42195ac86687a18af1366af6438962a3409ed6da966f809dcf6c",
        "644380dac80d3ddbe29d0578a254f0a8984fe2e6265e1481118eadda3df2115e"),
    "scripts/tests/test_nr_rk_stage_locality.py": (
        "b488b7f82f3e39519202eb767630b1e7a866cf240a4fdf8628a1bb7ee7358687",
        "e5c769eaf148f3567f4ea1996310b954a9ab13d6323efe0cc7c3a06f38eb4f10"),
}
EXTRA = (PROTOCOL, "scripts/run-nr-k3-nonlinear-refinement.py",
         "scripts/tests/test_nr_nonlinear_refinement.py",
         "science/numerical_relativity/EXPERIMENT-20261009-deadline-transition.md",
         "science/numerical_relativity/EXPERIMENT-20261009-deadline-transition-v2.md")
MATRIX = (("spatial-9", 9, 1./256, 8, False), ("spatial-13", 13, 1./256, 8, False),
          ("spatial-17", 17, 1./256, 8, False), ("temporal-coarse", 13, 1./128, 4, True),
          ("temporal-medium", 13, 1./256, 8, True), ("temporal-fine", 13, 1./512, 16, True))
FLOOR, SPATIAL_MIN = 2.e-13, 1.5
TIME_MIN, TIME_MAX, END_TIME = 3.5, 4.5, 1./32
SECONDS, OUTPUT_CAP, HEADROOM = 2400., 64*1024**2, 8*1024**2
C_RESERVE, E_RESERVE = 3*1024**3, 4*1024**3+32*1024**2
REGIONS = ("whole", "central_box", "faces", "edges", "corners")
METRICS = ("state_error", "H_metric", "M_metric")


def require(value, message):
    if not value:
        raise ValueError(message)


def sha(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def bounded(base, name):
    require(isinstance(name, str) and name and not Path(name).is_absolute(), "relative file required")
    path = (base/name).resolve()
    require(path.is_relative_to(base.resolve()) and path.is_file(), "bounded existing file required: "+name)
    return path


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def green_report(path, *, expected_count=None, classname_suffix=None):
    root = ET.parse(path).getroot()
    suites, cases = list(root.iter("testsuite")), list(root.iter("testcase"))
    require(suites and cases and not any(x.tag in ("failure", "error", "skipped") for c in cases for x in c),
            "green nonempty regression required")
    require(all(int(s.get(k, "0")) == 0 for s in suites for k in ("failures", "errors", "skipped")),
            "failed/skipped regression summary")
    require(sum(int(s.get("tests", "0")) for s in suites) == len(cases), "test count mismatch")
    require(len({(c.get("classname"), c.get("name")) for c in cases}) == len(cases), "duplicate tests")
    require(expected_count is None or len(cases) == expected_count, "incomplete regression scope")
    require(classname_suffix is None or all(c.get("classname", "").endswith(classname_suffix) for c in cases),
            "wrong runner test suite")
    return {"sha256": sha(path), "tests": len(cases), "classes": sorted({c.get("classname") for c in cases})}


def source_identity(test_report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity drift: "+path.name)
    primary, replay, audit = [json.loads(p.read_text(encoding="utf-8")) for p in (PRIMARY, REPLAY, AUDIT)]
    require(audit["audit_completed"] is True and audit["separate_process_exact_replay"] is True
            and audit["primary_sha256"] == RETAINED[PRIMARY] and audit["replay_sha256"] == RETAINED[REPLAY],
            "closed independent nonlinear parent required")
    require(all(d.get(k) is False for d in (primary, replay, audit) for k in FLAGS), "parent admission changed")
    require(primary["source_after"] == replay["source_after"], "parent replay sources differ")
    checked = 0
    for path, data in ((PRIMARY, primary), (REPLAY, replay)):
        require(data["completed"] is True and data["coupling_screen_passed"] is True and data["errors"] == []
                and data["source_before"] == data["source_after"], "closed parent source required")
        actual = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*")
                  if p.is_file() and p != path}
        require(actual == set(data["artifact_hashes"]), "complete retained artifact set required")
        for name, digest in data["artifact_hashes"].items():
            require(sha(bounded(path.parent, name)) == digest, "retained artifact changed: "+name)
            checked += 1
        for name, digest in data["source_after"].items():
            require(sha(bounded(path.parent/"source-snapshot", name)) == digest, "old source snapshot changed")
    inherited = dict(primary["source_after"])
    for name, digest in audit["auditor_sources"].items():
        require(name not in inherited or inherited[name] == digest, "auditor source conflict")
        inherited[name] = digest
    require(audit["auditor_sources"] == audit["auditor_sources_after"], "auditor source drift")
    transition = {}
    for name, old in inherited.items():
        current = sha(bounded(ROOT, name))
        if name in TRANSITIONS:
            require((old, current) == TRANSITIONS[name] and old != current, "explicit transition mismatch: "+name)
            transition[name] = {"old_sha256": old, "new_sha256": current}
        else:
            require(current == old, "unauthorized inherited source drift: "+name)
    require(set(transition) == set(TRANSITIONS), "complete three-file transition required")
    regression = green_report(REGRESSION, expected_count=1387)
    old = ET.parse(ROOT/"tmp/nr-nonlinear-sat-regression-v1-20261009.xml")
    classes = {x.get("classname") for x in old.iter("testcase")}
    classes.add("solar_sim.next-web.scripts.tests.test_nr_nonlinear_sat_audit")
    require(set(regression["classes"]) == classes, "all 46 regression files required")
    test_report = bounded(ROOT, test_report.resolve().relative_to(ROOT).as_posix())
    tests = green_report(test_report, classname_suffix="scripts.tests.test_nr_nonlinear_refinement")
    before = {name: sha(bounded(ROOT, name)) for name in sorted(set(inherited) | set(EXTRA))}
    record = dict(schema="nr-deadline-source-transition-v2", transition_completed=True,
                  parent_sha256=RETAINED[PRIMARY], replay_sha256=RETAINED[REPLAY],
                  audit_sha256=RETAINED[AUDIT], retained_artifacts_checked=checked,
                  transitions=transition, regression=regression, runner_tests=tests,
                  runner_test_report=test_report.relative_to(ROOT).as_posix(), source_after=before,
                  **{key: False for key in FLAGS})
    return before, record


def guard(directory, deadline, *, headroom=HEADROOM):
    require(time.perf_counter() < deadline, "2400s absolute refinement deadline reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free >= E_RESERVE,
            "C/E storage reserve reached")
    size = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(size+headroom <= OUTPUT_CAP, "64MiB refinement output cap reached")


def weighted_rms(values, weights, mask=None):
    values = np.asarray(values)
    require(values.shape[:3] == weights.shape and np.all(np.isfinite(values)), "finite node-first field required")
    if mask is None:
        mask = np.ones(weights.shape, dtype=bool)
    require(mask.shape == weights.shape and np.any(mask), "nonempty region required")
    w = weights[mask]
    require(np.all(np.isfinite(w)) and np.all(w > 0.), "positive finite weights required")
    squares = np.mean(values.reshape((*weights.shape, -1))**2, axis=-1)
    value = float(np.sqrt(np.sum(w*squares[mask])/np.sum(w)))
    require(math.isfinite(value), "nonfinite weighted norm")
    return value


def weights_and_regions(driver):
    w = np.einsum("i,j,k->ijk", *(axis.norm_weights for axis in driver.volume.axes))
    xyz = driver.volume.grid.coordinates
    count = sum(((x == 1.) | (x == 3.)).astype(int) for x in xyz)
    core = np.logical_and.reduce([(x >= 1.5) & (x <= 2.5) for x in xyz])
    return w, {"whole": np.ones(w.shape, dtype=bool), "central_box": core,
               "faces": count == 1, "edges": count == 2, "corners": count == 3}


def measurements(driver, state, reference):
    fields = driver.metric_constraints(state)
    fields["state_error"] = np.moveaxis(state-reference, 0, -1)
    weights, masks = weights_and_regions(driver)
    return {region: {key: weighted_rms(value, weights, mask) for key, value in fields.items()}
            for region, mask in masks.items()}


def order_record(coarse, fine, ratio, minimum, maximum=None):
    require(all(numeric(x) for x in (coarse, fine, ratio, minimum)) and coarse >= 0. and fine >= 0.
            and ratio > 1. and (maximum is None or numeric(maximum)), "finite refinement inputs required")
    resolved = coarse > FLOOR and fine > FLOOR
    order = math.log(coarse/fine)/math.log(ratio) if resolved else None
    passed = bool(resolved and coarse > fine and order >= minimum and (maximum is None or order <= maximum))
    return dict(coarse_error=coarse, fine_error=fine, refinement_ratio=ratio, floor=FLOOR,
                observed_order=order, resolved=resolved, passed=passed,
                status="passed" if passed else ("failed" if resolved else "unresolved"))


def valid_stages(stages):
    return (OLD["valid_stage_sequence"](stages)
            and all(stage["min_lapse"] < 2. and stage["det_h_max_error"] <= 1.e-10 for stage in stages))


def check_case(row, spec):
    label, n, dt, steps, perturbed = spec
    require(row.get("label") == label and type(row.get("n")) is int and row["n"] == n
            and numeric(row.get("dt")) and row["dt"] == dt and type(row.get("steps")) is int
            and row["steps"] == steps and row.get("perturbed") is perturbed
            and row.get("end_time") == END_TIME, "frozen refinement matrix changed")
    require(row.get("completed") is True and row.get("input_unchanged") is True
            and row.get("phase") == "completed" and "failure" not in row, "incomplete refinement case")
    require(row.get("initial_array") == label+"-initial.npy" and row.get("final_array") == label+"-final.npy",
            "state artifact binding changed")
    require(all(type(row.get(k)) is int and row[k] == steps-1 for k in ("attempted_step", "last_completed_step")),
            "incomplete step endpoints")
    records = row.get("step_records", [])
    require([r.get("step") for r in records] == list(range(steps)) and all(type(r.get("step")) is int for r in records)
            and all(valid_stages(r["stages"]) for r in records), "invalid ordered RK stages")
    for phase in ("initial_measurements", "final_measurements"):
        require(set(row.get(phase, {})) == set(REGIONS), "complete region measurements required")
        for norms in row[phase].values():
            require(set(norms) == OLD["DIAGNOSTICS"] | {"state_error"}
                    and all(numeric(v) and v >= 0. for v in norms.values()), "finite complete diagnostics required")


def evaluate(cases, temporal_differences):
    require(len(cases) == len(MATRIX), "complete six-case matrix required")
    for row, spec in zip(cases, MATRIX, strict=True):
        check_case(row, spec)
    require(len(temporal_differences) == 2, "two time-refinement differences required")
    spatial = []
    for metric in METRICS:
        for a, b in ((0, 1), (1, 2)):
            ratio = (MATRIX[b][1]-1)/(MATRIX[a][1]-1)
            spatial.append(dict(metric=metric, grids=[MATRIX[a][1], MATRIX[b][1]],
                **order_record(cases[a]["final_measurements"]["whole"][metric],
                               cases[b]["final_measurements"]["whole"][metric], ratio, SPATIAL_MIN)))
    temporal = order_record(*temporal_differences, 2., TIME_MIN, TIME_MAX)
    disturbed = [stage for row in cases[3:] for step in row["step_records"] for stage in step["stages"]]
    active = all(max(stage["sat_max_abs"] for step in row["step_records"] for stage in step["stages"]) > 2.e-12
                 and len({stage["coefficients_sha256"] for step in row["step_records"] for stage in step["stages"]}) > 1
                 for row in cases[3:])
    spatial_passed = all(r["passed"] for r in spatial)
    return dict(spatial=spatial, temporal=temporal, spatial_passed=spatial_passed,
                temporal_passed=temporal["passed"], active_updated_sat=active,
                disturbed_stages=len(disturbed), stages_checked=sum(4*r["steps"] for r in cases),
                passed=bool(spatial_passed and temporal["passed"] and active),
                interpretation="resolved mixed-order refinement screen only; independent closure still required")


def save_array(directory, name, value):
    OLD["save_array"](directory, name, value)


def write_json(path, value):
    data = json.dumps(value, sort_keys=True, indent=2, allow_nan=False)+"\n"
    require(len(data.encode("utf-8")) <= HEADROOM, "receipt headroom exceeded")
    with path.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(data)


def new_case_record(spec):
    label, n, dt, steps, perturbed = spec
    return dict(label=label, n=n, dt=dt, steps=steps, perturbed=perturbed, end_time=dt*steps,
                step_records=[], completed=False, phase="preflight", last_completed_step=-1)


def run_case(driver, initial, reference, spec, directory, deadline, records, *, row=None):
    label, _n, dt, steps, _perturbed = spec
    if row is None:
        row = new_case_record(spec)
        records.append(row)
    original, q = None, None
    try:
        guard(directory, deadline)
        original, q = initial.tobytes(), np.ascontiguousarray(initial).copy()
        row["operator_identity"] = driver.identity
        row["parameters"] = {"gauge": vars(driver.gauge), "config": vars(driver.config), "profile": driver.profile.identity()}
        row["phase"] = "save-initial"
        save_array(directory, label+"-initial.npy", q)
        row["initial_array"] = label+"-initial.npy"
        row["phase"] = "initial-diagnostics"
        row["initial_measurements"] = measurements(driver, q, reference)
        targets = driver.boundary_targets(reference)

        def boundary(_half_index):
            guard(directory, deadline)
            return targets

        for index in range(steps):
            row.update(phase="step", attempted_step=index)
            guard(directory, deadline)
            candidate, stages = driver.step(q, index, dt, boundary)
            require(valid_stages(stages), "invalid stage contract")
            require(candidate.shape == q.shape and np.all(np.isfinite(candidate)), "invalid accepted state")
            q = candidate
            row["step_records"].append(dict(step=index, stages=stages))
            row["last_completed_step"] = index
            guard(directory, deadline)
            print(json.dumps(dict(case=label, completed_step=index+1, steps=steps,
                                  cfl=max(r["cfl"] for r in stages), max_sat=max(r["sat_max_abs"] for r in stages))), flush=True)
        row["phase"] = "final-diagnostics"
        row["final_measurements"] = measurements(driver, q, reference)
        row["input_unchanged"] = initial.tobytes() == original
        require(row["input_unchanged"], "initial data mutated")
        row["phase"] = "save-final"
        guard(directory, deadline)
        save_array(directory, label+"-final.npy", q)
        row["final_array"] = label+"-final.npy"
        guard(directory, deadline)
        row.update(completed=True, phase="completed")
    except Exception as error:
        row.update(completed=False, failure=f"{type(error).__name__}: {error}")
        if q is not None:
            try:
                # A finalization reserve is not a renewed scientific budget.
                used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
                require(used+q.nbytes+4*1024**2 < OUTPUT_CAP and shutil.disk_usage(ROOT).free-q.nbytes >= E_RESERVE,
                        "failure-state reserve unavailable")
                save_array(directory, label+"-last-accepted.npy", q)
                row["last_accepted_array"] = label+"-last-accepted.npy"
            except Exception as persistence_error:
                row["failure_state_persistence_error"] = f"{type(persistence_error).__name__}: {persistence_error}"
        raise
    finally:
        if original is not None:
            row["input_unchanged"] = initial.tobytes() == original
    return q


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
    before, transition = source_identity(args.test_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-nonlinear-refinement-campaign-v1", completed=False, refinement_screen_passed=False,
                  closure_completed=False, source_before=before, source_after={}, cases=[], errors=[],
                  protocol_sha256=sha(ROOT/PROTOCOL), parent_sha256=RETAINED[PRIMARY],
                  resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
                  python=sys.version, numpy=np.__version__, platform=platform.platform(),
                  scope="analytic incoming exterior candidate; no physical boundary or black-hole admission",
                  **{key: False for key in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "new source snapshot mismatch")
        write_json(directory/"transition.json", transition)
        result["transition_sha256"] = sha(directory/"transition.json")
        finals = []
        temporal_weights = None
        for spec in MATRIX:
            _label, n, _dt, _steps, perturbed = spec
            row = new_case_record(spec)
            result["cases"].append(row)
            row["phase"] = "initialization"
            guard(directory, deadline)
            grid = Grid3D((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
            driver = NonlinearSBPCube(grid)
            reference = np.array(analytic_slots(n, 4, SchwarzschildDomain()), dtype=np.float64)
            initial = reference.copy()
            if perturbed:
                initial[11:] += 1.e-4*OLD["disturbance"](grid)[11:]
            final = run_case(driver, initial, reference, spec, directory, deadline, result["cases"], row=row)
            if perturbed:
                finals.append(final)
                temporal_weights = weights_and_regions(driver)[0]
        differences = [weighted_rms(np.moveaxis(finals[i]-finals[i+1], 0, -1), temporal_weights) for i in (0, 1)]
        result["decision"] = evaluate(result["cases"], differences)
        guard(directory, deadline)
        result.update(completed=True, refinement_screen_passed=result["decision"]["passed"])
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if result["cases"] and not result["cases"][-1]["completed"]:
            result["cases"][-1].setdefault("failure", f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = sha(bounded(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source recheck {name}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source identity changed during experiment")
    for path, digest in {**RETAINED, args.test_report.resolve(): transition["runner_tests"]["sha256"]}.items():
        try:
            require(sha(path) == digest, "retained receipt/binary/report identity changed: "+path.name)
        except Exception as error:
            result["errors"].append(str(error))
    result["artifact_hashes"] = {}
    for path in sorted(directory.rglob("*")):
        if path.is_file():
            try:
                result["artifact_hashes"][path.relative_to(directory).as_posix()] = sha(path)
            except Exception as error:
                result["errors"].append(f"artifact recheck {path.name}: {error}")
    try:
        guard(directory, deadline, headroom=HEADROOM)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["refinement_screen_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = OLD["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result["refinement_screen_passed"] = False
    write_json(directory/"receipt.json", result)
    print(json.dumps({key: result[key] for key in ("completed", "refinement_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["refinement_screen_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

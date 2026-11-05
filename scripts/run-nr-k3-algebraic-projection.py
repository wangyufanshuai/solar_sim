"""Local map/correction study on retained states; never resumes their evolution."""
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
from science.numerical_relativity.fo_ccz4_algebraic_projection import (  # noqa: E402
    algebraic_errors, algebraic_fields, correction_fields, geometry, identity, project_algebraic_slots,
)

D = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-dual-diagnostics.py"))
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"))
R = D["R"]
require, sha, bounded = (R[k] for k in ("require", "sha", "bounded"))
FLAGS, EVIDENCE, NonlinearSBPCube, Grid3D = (R[k] for k in ("FLAGS", "EVIDENCE", "NonlinearSBPCube", "Grid3D"))
PARENT = EVIDENCE/"nr-k3-longer-window-probe-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-longer-window-probe-audit-v1-20261009.json"
REGRESSION = ROOT/"tmp/nr-longer-window-final-regression-v2-20261009.xml"
RETAINED = {
    PARENT: "b0b37e728425ee9b47b3cdec828ff137003d14df07d28d1601b6edb108f9b6df",
    AUDIT: "73057c38465deebe2cf47242fca42ace8cca8d7365e1b9ef2681ff1be6643173",
    REGRESSION: "e67d8cc2e9f77472ecdc19ef993f8b17027068b702041930d3f0a310a979164c",
    R["OLD"]["NATIVE"]: R["OLD"]["NATIVE_SHA"],
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-algebraic-projection.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/fo_ccz4_algebraic_projection.py",
         "science/numerical_relativity/test_fo_ccz4_algebraic_projection.py",
         "scripts/run-nr-k3-algebraic-projection.py", "scripts/tests/test_nr_algebraic_projection.py")
SECONDS, OUTPUT_CAP, HEADROOM = 180., 96*1024**2, 8*1024**2
C_RESERVE, E_RESERVE = R["C_RESERVE"], R["E_RESERVE"]
TOLERANCE, FLOOR = 2.e-12, 2.e-14


def guard(directory, deadline, *, additional=0):
    require(time.perf_counter() < deadline, "180s absolute algebraic study deadline reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free-additional >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used+additional+HEADROOM <= OUTPUT_CAP, "96MiB algebraic study output cap reached")


def sources(report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity changed: "+path.name)
    parent, audit = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, AUDIT))
    require(parent["completed"] is parent["probe_passed"] is False and audit["audit_completed"] is True
            and audit["probe_passed"] is False and audit["errors"] == []
            and audit["receipt_sha256"] == RETAINED[PARENT] and audit["independent_saved_states"] == 29,
            "independently checked failed parent required")
    require(all(data.get(k) is False for data in (parent, audit) for k in FLAGS)
            and parent["source_before"] == parent["source_after"], "unchanged unadmitted source required")
    checked = D["verify_artifacts"](PARENT, parent)
    before = dict(parent["source_after"])
    for name, digest in audit["auditor_sources"].items():
        require(name not in before or before[name] == digest, "auditor source conflict")
        before[name] = digest
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source drift: "+name)
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    report = bounded(ROOT, report.resolve().relative_to(ROOT).as_posix())
    tests = R["green_report"](report)
    suffixes = ("science.numerical_relativity.test_fo_ccz4_algebraic_projection", "scripts.tests.test_nr_algebraic_projection")
    require(len(tests["classes"]) == 2 and all(any(c.endswith(suffix) for c in tests["classes"]) for suffix in suffixes),
            "component and study test modules required")
    tests["path"] = report.relative_to(ROOT).as_posix()
    return before, dict(runner_tests=tests, regression=R["green_report"](REGRESSION, expected_count=1807),
                        retained_artifacts_checked=checked), parent


def independent_map(q):
    """Cofactor polynomial + cube root + explicit indices; no candidate helpers."""
    q = np.asarray(q)
    require(q.ndim == 4 and q.shape[0] == 58 and q.dtype == np.float64 and np.all(np.isfinite(q)), "finite58 cube required")
    pairs = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
    aa, b, c, d, e, f = q[:6]
    det = aa*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c)
    require(np.all(det > 0.), "positive cofactor determinant required")
    out = q.copy()
    out[:6] /= np.cbrt(det)
    aa, b, c, d, e, f = out[:6]
    det = aa*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c)
    inverse = ((d*f-e*e, c*e-b*f, b*e-c*d), (c*e-b*f, aa*f-c*c, b*c-aa*e),
               (b*e-c*d, b*c-aa*e, aa*d-b*b))
    for offset in (11, 37, 43, 49):
        trace = np.zeros(q.shape[1:])
        for slot, (i, j) in enumerate(pairs):
            trace += (1. if i == j else 2.)*inverse[i][j]*q[offset+slot]/det
        for slot in range(6):
            out[offset+slot] = q[offset+slot]-out[slot]*trace/3.
    require(np.all(np.isfinite(out)), "nonfinite independent projection")
    return out


def fields(driver, q, reference):
    data = driver.metric_constraints(q)
    hessian = D["constraints_from_slots"](q, driver.volume.grid.spacing)
    g = geometry(q)
    data.update(H_metric_hessian=hessian["H_metric_hessian"], M_metric_hessian=hessian["M_metric"],
                H_diagnostic_difference=hessian["H_metric_hessian"]-data["H_metric"],
                state_error=np.moveaxis(q-reference, 0, -1), trace_D=algebraic_fields(q)["trace_D"],
                physical_metric=g["metric"], physical_extrinsic=g["extrinsic"],
                physical_trace_K=np.einsum("...ij,...ij->...", g["inverse"], g["a"])+q[17])
    return data


def norms(driver, data):
    weights, masks = R["weights_and_regions"](driver)
    return {region: {key: R["weighted_rms"](value, weights, mask) for key, value in data.items()}
            for region, mask in masks.items()}


def ratio(before, after):
    require(R["numeric"](before) and R["numeric"](after) and before >= 0. and after >= 0., "finite nonnegative norms required")
    return dict(before=before, after=after, after_over_before=after/before if before > FLOOR else None,
                resolved=before > FLOOR, floor=FLOOR, physical_gate=False)


def sample(driver, q, reference):
    original = q.tobytes()
    disabled = project_algebraic_slots(q)
    require(disabled.tobytes() == original, "default path changed values")
    mapped = project_algebraic_slots(q, enabled=True)
    independent = independent_map(q)
    difference = float(np.max(abs(mapped-independent)/np.maximum(1., abs(independent))))
    twice = project_algebraic_slots(mapped, enabled=True)
    idempotence = float(np.max(abs(twice-mapped)/np.maximum(1., abs(mapped))))
    require(difference <= TOLERANCE and idempotence <= TOLERANCE, "independent map/idempotence failed")
    pre, post = fields(driver, q, reference), fields(driver, mapped, reference)
    pre_norms, post_norms = norms(driver, pre), norms(driver, post)
    independent_differences = []
    for value, measured in ((q, pre_norms), (mapped, post_norms)):
        independent_norms, _anti = A["reconstructed"](value, reference)
        observed = {region: {key: measured[region][key] for key in independent_norms[region]}
                    for region in independent_norms}
        independent_differences.append(A["compare_norms"](independent_norms, observed))
    require(max(independent_differences) <= TOLERANCE, "independent H/M/reduction diagnostics failed")
    require(q.tobytes() == original, "input state mutated")
    effects = {region: {key: ratio(pre_norms[region][key], post_norms[region][key]) for key in pre_norms[region]}
               for region in pre_norms}
    record = dict(before=pre_norms, after=post_norms, effects=effects,
                  field_change_norms=norms(driver, {key: post[key]-pre[key] for key in pre}),
                  correction_norms=norms(driver, correction_fields(q, mapped)),
                  before_algebraic_errors=algebraic_errors(q), after_algebraic_errors=algebraic_errors(mapped),
                  independent_map_relative_max=difference, idempotence_relative_max=idempotence,
                  independent_diagnostics_max=max(independent_differences), input_unchanged=True,
                  disabled_byte_exact=True, original_state_improved=False, evolution_executed=False,
                  restart_permitted=False)
    return mapped, record


def selected(parent):
    """All accepted/initial states plus the one rejected stage, no cherry-pick."""
    require([c["label"] for c in parent["cases"]] == ["static-13-long", "perturbed-13-long"], "exact parent cases required")
    result = []
    reference = parent["cases"][0]["trajectory"][0]["array"]
    for case, count in zip(parent["cases"], (17, 12), strict=True):
        require(case["n"] == 13 and case["dt"] == 1./256 and len(case["trajectory"]) == count, "complete retained trajectory required")
        for index, point in enumerate(case["trajectory"]):
            require(point["completed"] is True and point["input_unchanged"] is True
                    and point["point"] == index and point["time"] == index/256., "canonical point order required")
            result.append(dict(label=case["label"]+f"-point-{index:04d}", array=point["array"], time=point["time"],
                               input_kind="initial" if index == 0 else "accepted", stored=point["measurements"],
                               reference=reference))
    failed = parent["cases"][1]
    require(failed["completed"] is False and failed["rejection"]["accepted"] is False
            and failed["rejection"]["restart_permitted"] is False, "retained rejection required")
    result.append(dict(label="perturbed-13-long-rejected", array=failed["rejection"]["state_array"], time=11.5/256.,
                       input_kind="rejected", stored=None, reference=reference))
    return result


def save(directory, name, values, deadline):
    guard(directory, deadline, additional=values.nbytes+1024)
    with (directory/name).open("xb") as handle:
        np.save(handle, values, allow_pickle=False)


def collect(parent, directory, deadline, result):
    for spec in selected(parent):
        row = dict(label=spec["label"], completed=False, phase="loading", input_kind=spec["input_kind"],
                   time=spec["time"], restart_permitted=False)
        result["states"].append(row)
        guard(directory, deadline)
        source = bounded(PARENT.parent, spec["array"])
        q, reference = (np.load(path, allow_pickle=False) for path in (source, bounded(PARENT.parent, spec["reference"])))
        require(q.shape == reference.shape == (58, 13, 13, 13), "retained N13 cube required")
        row.update(input_sha256=sha(source), input_array=spec["array"], phase="measurement")
        driver = NonlinearSBPCube(Grid3D((13,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))
        mapped, measured = sample(driver, q, reference)
        if spec["stored"] is not None:
            calculated = {region: {key: measured["before"][region][key] for key in values}
                          for region, values in spec["stored"].items()}
            require(D["same"](calculated, spec["stored"]), "retained production diagnostics changed")
        row.update(**measured, phase="save-mapped")
        mapped_name, delta_name = spec["label"]+"-mapped.npy", spec["label"]+"-delta.npy"
        save(directory, mapped_name, mapped, deadline)
        row.update(mapped_array=mapped_name, phase="save-correction")
        save(directory, delta_name, mapped-q, deadline)
        row.update(correction_array=delta_name, completed=True, phase="completed")
        print(json.dumps(dict(state=row["label"], input_kind=row["input_kind"],
                              residuals=row["after_algebraic_errors"])), flush=True)


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
    before, tests, parent = sources(args.test_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-three-algebraic-constraints-study-v1", completed=False, component_passed=False,
        states=[], errors=[], source_before=before, source_after={}, tests=tests,
        parent_sha256=RETAINED[PARENT], parent_probe_passed=False, audit_sha256=RETAINED[AUDIT],
        protocol_sha256=before[PROTOCOL], identity=identity(enabled=True), new_evolution_executed=False,
        parent_regraded=False, integration_policy_validated=False, checkpoint_supported=False, closure_completed=False,
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
        python=sys.version, numpy=np.__version__, platform=platform.platform(), **{k: False for k in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot differs")
        collect(parent, directory, deadline, result)
        require(len(result["states"]) == 30 and all(row["completed"] for row in result["states"]), "complete30-state study required")
        result.update(completed=True, component_passed=True)
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if result["states"]:
            result["states"][-1].update(completed=False, failure=f"{type(error).__name__}: {error}")
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
            require(sha(path) == digest, "retained input/report changed")
        D["verify_artifacts"](PARENT, parent)
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

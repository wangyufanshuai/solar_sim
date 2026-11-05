"""Analytic general tensor curvature and unchanged saved-state comparison."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from science.numerical_relativity.sbp_boundary_operator import SBP42  # noqa: E402
from science.numerical_relativity.sbp_metric_geometry import constraints_from_slots, identity, metric_constraints  # noqa: E402

S = runpy.run_path(str(ROOT/"scripts/run-nr-k3-static-derivative-study.py"))
require, sha, bounded, guard, order = (S[k] for k in ("require", "sha", "bounded", "guard", "order"))
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PARENT = EVIDENCE/"nr-k3-static-derivative-v1-20261009/receipt.json"
REPLAY = EVIDENCE/"nr-k3-static-derivative-replay-v1-20261009/receipt.json"
EVOLUTION = EVIDENCE/"nr-k3-nonlinear-refinement-v1-20261009/receipt.json"
RETAINED = {PARENT: "60a33cd2acac6f71b476d932f81b7677e2f05a40e2cb50936ba169b80084283a",
            REPLAY: "17e56ae008fb4d003556033cabab983580d489e0377ef493ec13e7605507d0e2",
            EVOLUTION: "463a8ec5da3693097cc861b7481fd8c434801b2849161db4abbb5fa27b14fc3f",
            ROOT/"tmp/nr-static-derivative-regression-v1-20261009.xml":
            "089f752b2ee98a59aea657dce1700e1db2b1549996832919227652fbe8a890f3"}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-metric-geometry.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/sbp_metric_geometry.py",
         "science/numerical_relativity/test_sbp_metric_geometry.py", "scripts/run-nr-k3-metric-geometry.py",
         "scripts/tests/test_nr_metric_geometry.py")
GRIDS, FAMILIES = (17, 25, 33), ("schwarzschild", "flat-shear", "skew-warped")
PACKED_FIELDS = ("Ricci[9]", "R_scalar", "H_metric_hessian", "M_metric[3]", "H_reference_or_old")


def controls(n, family):
    require(type(n) is int and n >= 9 and family in FAMILIES, "analytic grid/family required")
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    shape = (n,)*3
    if family == "schwarzschild":
        r = np.sqrt(sum(x*x for x in xyz))
        psi = 1.+.5/r
        grad = [-.5*x/r**3 for x in xyz]
        hessian = np.empty((*shape, 3, 3))
        for i in range(3):
            for j in range(3):
                hessian[..., i, j] = .5*(3.*xyz[i]*xyz[j]/r**5-(1./r**3 if i == j else 0.))
        metric = psi[..., None, None]**4*np.eye(3)
        gradient = np.stack(grad, axis=-1)
        ricci = -2.*hessian/psi[..., None, None]+6.*gradient[..., :, None]*gradient[..., None, :]/psi[..., None, None]**2
        ricci -= 2.*sum(g*g for g in grad)[..., None, None]*np.eye(3)/psi[..., None, None]**2
        return metric, np.zeros_like(metric), ricci, np.zeros(shape), np.zeros((*shape, 3))
    if family == "flat-shear":
        jacobian = np.broadcast_to(np.eye(3), (*shape, 3, 3)).copy()
        jacobian[..., 0, 1] = jacobian[..., 0, 2] = .17*np.cos(xyz[1]+xyz[2])
        metric = np.einsum("...ai,...aj->...ij", jacobian, jacobian)
        return metric, np.zeros_like(metric), np.zeros_like(metric), np.zeros(shape), np.zeros((*shape, 3))
    transform = np.array([[1., .2, -.15], [.3, 1., .1], [-.1, .25, 1.]])
    u = sum(transform[0, i]*xyz[i] for i in range(3))
    a, b = .2, -.15
    v, w = np.exp(2*a*u), np.exp(2*b*u)
    t = [np.outer(row, row) for row in transform]
    metric = t[0]+v[..., None, None]*t[1]+w[..., None, None]*t[2]
    ricci = -(a*a+b*b)*t[0]-a*(a+b)*v[..., None, None]*t[1]-b*(a+b)*w[..., None, None]*t[2]
    c = .02+.01*xyz[0]-.015*xyz[1]+.005*xyz[2]
    exact_h = -2*(a*a+b*b+a*b)+6*c*c
    return metric, c[..., None, None]*metric, ricci, exact_h, np.broadcast_to([-.02, .03, -.01], (*shape, 3))


def norms(field, n):
    require(field.shape[:3] == (n,)*3 and np.all(np.isfinite(field)), "finite node-first field required")
    w = SBP42(n, 2./(n-1)).norm_weights
    weight = w[:, None, None]*w[None, :, None]*w[None, None, :]
    x = np.linspace(1., 3., n)
    inner = (x >= 1.75) & (x <= 2.25)
    box = inner[:, None, None] & inner[None, :, None] & inner[None, None, :]
    with np.errstate(over="raise", invalid="raise"):
        squared = np.mean(field.reshape(n, n, n, -1)**2, axis=-1)
    return {region: float(np.sqrt(np.sum(weight[mask]*squared[mask])/np.sum(weight[mask])))
            for region, mask in (("whole", np.ones((n,)*3, dtype=bool)), ("fixed_box", box))}


def packed(result, reference):
    shape = reference.shape
    return np.concatenate((np.moveaxis(result["Ricci"].reshape(*shape, 9), -1, 0),
        result["R_scalar"][None], result["H_metric_hessian"][None], np.moveaxis(result["M_metric"], -1, 0),
        reference[None]), axis=0)


def decisions(cases):
    rows = []
    for family in FAMILIES:
        selected = [row for row in cases if row["family"] == family]
        require([r["n"] for r in selected] == list(GRIDS) and all(r["completed"] is True for r in selected),
                "full analytic matrix required")
        for low, high in zip(selected[:-1], selected[1:], strict=True):
            for key in ("Ricci_error", "H_error"):
                for region, minimum in (("whole", 2.2), ("fixed_box", 3.5)):
                    pair = order(low["norms"][key][region], high["norms"][key][region], (high["n"]-1)/(low["n"]-1))
                    p = pair["observed_order"]
                    rows.append(dict(family=family, field=key, region=region, grids=[low["n"], high["n"]],
                                     minimum=minimum, **pair, passed=p is not None and p >= minimum))
    return rows


def sources(test_report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity changed")
    parent, replay = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, REPLAY))
    require(parent["completed"] is True and parent["static_hypothesis_checks_passed"] is True
            and parent["source_before"] == parent["source_after"] == replay["source_after"], "completed static parent required")
    before = dict(parent["source_after"])
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source changed: "+name)
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    test_report = bounded(ROOT, test_report.resolve().relative_to(ROOT).as_posix())
    root = ET.parse(test_report).getroot()
    cases = list(root.iter("testcase"))
    require(cases and not list(root.iter("failure")) and not list(root.iter("error")) and not list(root.iter("skipped")),
            "green tests required")
    for suffix in ("science.numerical_relativity.test_sbp_metric_geometry", "scripts.tests.test_nr_metric_geometry"):
        require(any(c.get("classname", "").endswith(suffix) for c in cases), "both new test modules required")
    return before, dict(tests=len(cases), sha256=sha(test_report), path=test_report.relative_to(ROOT).as_posix())


def save(directory, name, array, deadline):
    guard(directory, deadline, additional=array.nbytes+1024)
    with (directory/name).open("xb") as handle:
        np.save(handle, array, allow_pickle=False)
    guard(directory, deadline)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.parent == EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence directory required")
    started = time.perf_counter()
    deadline = started+180.
    guard(directory, deadline)
    before, tests = sources(args.test_report)
    directory.mkdir()
    result = dict(schema="nr-metric-geometry-v1", completed=False, static_geometry_passed=False, errors=[],
                  evolution_executed=False, original_refinement_screen_passed=False, regrades_parent=False,
                  parent_sha256=RETAINED[PARENT], retained_evolution_sha256=RETAINED[EVOLUTION],
                  source_before=before, source_after={}, tests=tests, cases=[], saved_states=[],
                  diagnostic_identity=identity(), packed_field_layout=PACKED_FIELDS,
                  resource_caps=dict(seconds=180., output_bytes=S["OUTPUT_CAP"], c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2),
                  python=sys.version, numpy=np.__version__, platform=platform.platform(), **{k: False for k in S["FLAGS"]})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot mismatch")
        for family in FAMILIES:
            for n in GRIDS:
                row = dict(family=family, n=n, completed=False)
                result["cases"].append(row)
                guard(directory, deadline)
                g, k, exact_ricci, exact_h, exact_m = controls(n, family)
                fields = metric_constraints(g, k, (2./(n-1),)*3)
                row.update(norms={key: norms(field, n) for key, field in (
                    ("Ricci_error", fields["Ricci"]-exact_ricci), ("H_error", fields["H_metric_hessian"]-exact_h),
                    ("M_error", fields["M_metric"]-exact_m))}, ricci_antisymmetry_max=fields["ricci_antisymmetry_max"],
                    M_oracle_max_difference=float(np.max(abs(fields["M_metric"]-exact_m))),
                    field_array=f"{family}-{n}.npy")
                require(row["ricci_antisymmetry_max"] <= 2.e-11 and row["M_oracle_max_difference"] <= 2.e-11,
                        "tensor symmetry/momentum oracle failed")
                save(directory, row["field_array"], packed(fields, exact_h), deadline)
                row["completed"] = True
                print(json.dumps(dict(family=family, n=n, completed=True)), flush=True)
        result["decisions"] = decisions(result["cases"])
        old = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-refinement.py"))
        evolution = json.loads(EVOLUTION.read_text(encoding="utf-8"))
        for case in evolution["cases"]:
            n = case["n"]
            for phase in ("initial", "final"):
                row = dict(label=case["label"], n=n, phase=phase, completed=False)
                result["saved_states"].append(row)
                guard(directory, deadline)
                name = case[phase+"_array"]
                path = bounded(EVOLUTION.parent, name)
                require(sha(path) == evolution["artifact_hashes"][name], "retained state changed")
                q = np.load(path, allow_pickle=False)
                previous, _weights = old["tensor_fields"](q)
                fields = constraints_from_slots(q, (2./(n-1),)*3)
                row.update(input_sha256=sha(path), old_H=norms(previous["H_metric"], n),
                           new_H=norms(fields["H_metric_hessian"], n),
                           H_change=norms(fields["H_metric_hessian"]-previous["H_metric"], n),
                           maximum_M_difference=float(np.max(abs(fields["M_metric"]-previous["M_metric"]))),
                           ricci_antisymmetry_max=fields["ricci_antisymmetry_max"], field_array=case["label"]+"-"+phase+".npy")
                require(row["maximum_M_difference"] <= 2.e-11 and row["ricci_antisymmetry_max"] <= 2.e-11,
                        "saved-state momentum/symmetry disagreement")
                save(directory, row["field_array"], packed(fields, previous["H_metric"]), deadline)
                row["completed"] = True
        static = [r for r in result["saved_states"] if r["phase"] == "final" and r["label"].startswith("spatial-")]
        result["saved_positive_time_orders"] = [dict(grids=[a["n"], b["n"]], diagnostic=key,
            **order(a[key]["whole"], b[key]["whole"], (b["n"]-1)/(a["n"]-1)))
            for a, b in zip(static[:-1], static[1:], strict=True) for key in ("old_H", "new_H")]
        result.update(completed=True, static_geometry_passed=all(r["passed"] for r in result["decisions"]))
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
        for path, digest in {**RETAINED, args.test_report.resolve(): tests["sha256"]}.items():
            require(sha(path) == digest, "retained identity changed")
        guard(directory, deadline)
        result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["static_geometry_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    with (directory/"receipt.json").open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({k: result[k] for k in ("completed", "static_geometry_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["static_geometry_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

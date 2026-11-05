"""Static analytic curvature/operator investigation; never regrades evolution."""
from __future__ import annotations

import argparse
from fractions import Fraction as F
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
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from science.numerical_relativity.sbp_boundary_operator import LEFT_ROWS, NORM_EDGE, SBP42  # noqa: E402
from science.numerical_relativity.sbp_second_derivative import SBP42Second  # noqa: E402

EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PARENT = EVIDENCE/"nr-k3-nonlinear-refinement-v1-20261009/receipt.json"
AUDIT = EVIDENCE/"nr-k3-nonlinear-refinement-audit-v1-20261009.json"
RETAINED = {PARENT: "463a8ec5da3693097cc861b7481fd8c434801b2849161db4abbb5fa27b14fc3f",
            AUDIT: "7339b041d77a4892ad5a2c2510457ed9fdbc5d3e77ad06efd493a7162e52c3d4",
            ROOT/"tmp/nr-nonlinear-refinement-final-regression-v2-20261009.xml":
            "b13ded3feb0be72dd5583a649b6a4650693846f42593134ad4dead092b041da1"}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-static-derivative-study.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/sbp_second_derivative.py",
         "science/numerical_relativity/test_sbp_second_derivative.py",
         "scripts/run-nr-k3-static-derivative-study.py", "scripts/tests/test_nr_static_derivative_study.py")
GRIDS = (9, 13, 17, 25, 33, 49, 65)
FAMILIES = ("schwarzschild", "nonzero-curvature")
FIELD_KEYS = ("old_error", "analytic_connection_error", "differentiated_first_error",
              "quadratic_first_error", "candidate_D2_error")
FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated")
FLOOR = 2.e-13
SECONDS, OUTPUT_CAP, HEADROOM = 180., 64*1024**2, 8*1024**2


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def bounded(base, name):
    require(isinstance(name, str) and name and not Path(name).is_absolute(), "relative path required")
    path = (base/name).resolve()
    require(path.is_relative_to(base.resolve()) and path.is_file(), "bounded existing file required")
    return path


def guard(directory, deadline, additional=0):
    require(time.perf_counter() < deadline, "absolute static-study deadline reached")
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
            "original C/E storage reserve reached")
    size = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(size+additional <= OUTPUT_CAP-HEADROOM, "static-study output budget reached")


def green_tests(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    require(cases and not list(root.iter("failure")) and not list(root.iter("error"))
            and not list(root.iter("skipped")), "complete green test report required")
    for suffix in ("science.numerical_relativity.test_sbp_second_derivative", "scripts.tests.test_nr_static_derivative_study"):
        require(any(c.get("classname", "").endswith(suffix) for c in cases), "both new test modules required")
    return dict(tests=len(cases), sha256=sha(path), path=path.relative_to(ROOT).as_posix())


def sources(test_report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained receipt/report changed")
    parent, audit = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, AUDIT))
    require(parent["completed"] is True and parent["refinement_screen_passed"] is False
            and audit["audit_completed"] is True and audit["receipt_sha256"] == RETAINED[PARENT]
            and parent["source_before"] == parent["source_after"]
            and audit["auditor_sources"] == audit["auditor_sources_after"]
            and all(d.get(k) is False for d in (parent, audit) for k in FLAGS),
            "completed unadmitted failed parent and audit required")
    expected = {**parent["source_after"], **audit["auditor_sources"]}
    for name, digest in expected.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source changed: "+name)
    for name in EXTRA:
        expected[name] = sha(bounded(ROOT, name))
    tests = green_tests(bounded(ROOT, test_report.resolve().relative_to(ROOT).as_posix()))
    return expected, parent, tests


def rational_cubic(n):
    require(type(n) is int and n >= 17, "separated cubic boundary bands required")
    d = [[F(0) for _ in range(n)] for _ in range(n)]
    weights = [F(1) for _ in range(n)]
    for i, row in enumerate(LEFT_ROWS):
        weights[i] = weights[-1-i] = F(*NORM_EDGE[i])
        for j, pair in enumerate(row):
            d[i][j], d[-1-i][-1-j] = F(*pair), -F(*pair)
    for i in range(4, n-4):
        for offset, value in ((-2, F(1, 12)), (-1, F(-2, 3)), (1, F(2, 3)), (2, F(-1, 12))):
            d[i][i+offset] = value
    first = [sum(d[i][j]*j**3 for j in range(n)) for i in range(n)]
    error = [sum(d[i][j]*first[j] for j in range(n))-6*i for i in range(n)]
    require(all(v == 0 for v in error[6:-6]) and any(v != 0 for v in error[:6]), "cubic boundary support differs")
    # x=j*h in [0,2]; composed derivative error=h*error; norm length=2.
    constant = sum(w*v*v for w, v in zip(weights, error, strict=True))/2
    return dict(n=n, left_six=[str(v) for v in error[:6]], right_six=[str(v) for v in error[-6:]],
                squared_rms_over_h_cubed=str(constant), interior_exact=True)


def masks(n, dimension):
    axes = np.meshgrid(*(np.arange(n) for _ in range(dimension)), indexing="ij")
    band = np.zeros((n,)*dimension, dtype=bool)
    box = np.ones_like(band)
    for axis in axes:
        band |= (axis < 6) | (axis >= n-6)
        x = 1.+2.*axis/(n-1)
        box &= (x >= 1.75) & (x <= 2.25)
    return dict(whole=np.ones_like(band), composite_band=band, unaffected_interior=~band, fixed_box=box)


def summaries(field, weights):
    require(field.shape == weights.shape and field.ndim in (1, 3) and np.all(np.isfinite(field))
            and np.all(np.isfinite(weights)) and np.all(weights > 0.), "finite field/positive matching weights required")
    with np.errstate(over="raise", invalid="raise"):
        square = weights*field**2
    total = float(np.sum(square))
    require(math.isfinite(total), "nonfinite squared norm")
    output = {}
    for name, mask in masks(field.shape[0], field.ndim).items():
        if not np.any(mask):
            output[name] = None
            continue
        selected = float(np.sum(square[mask]))
        output[name] = dict(rms=float(np.sqrt(selected/np.sum(weights[mask]))),
                            max_abs=float(np.max(np.abs(field[mask]))), points=int(mask.sum()),
                            whole_squared_share=selected/total if total > 0. else None)
    return output


def analytic_fields(n, family):
    require(type(n) is int and n in GRIDS and family in FAMILIES, "frozen grid/family required")
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    if family == "schwarzschild":
        r = np.sqrt(sum(x*x for x in xyz))
        psi = 1.+.5/r
        gradient = [-.5*x/r**3 for x in xyz]
        laplacian = np.zeros_like(r)
    else:
        x, y, z = xyz
        psi = 1.+.05*(np.sin(x)+np.cos(2.*y)+.5*np.sin(3.*z))
        gradient = [.05*np.cos(x), -.1*np.sin(2.*y), .075*np.cos(3.*z)]
        laplacian = -.05*np.sin(x)-.2*np.cos(2.*y)-.225*np.sin(3.*z)
    require(np.all(psi > 0.), "positive conformal factor required")
    return psi, gradient, -8.*psi**(-5)*laplacian


def curvature_fields(n, family):
    psi, gradient, exact = analytic_fields(n, family)
    first, second = SBP42(n, 2./(n-1)), SBP42Second(n, 2./(n-1))
    f = psi**4
    b_num = [first.derivative(f, i)/(2.*f) for i in range(3)]
    b_exact = [2.*g/psi for g in gradient]
    difference = [a-b for a, b in zip(b_num, b_exact, strict=True)]
    old = (-4.*sum(first.derivative(b_num[i], i) for i in range(3))-2.*sum(b*b for b in b_num))/f
    oracle = (-4.*sum(first.derivative(b_exact[i], i) for i in range(3))-2.*sum(b*b for b in b_exact))/f
    propagated = -4.*sum(first.derivative(difference[i], i) for i in range(3))/f
    quadratic = -2.*sum(2.*b*e+e*e for b, e in zip(b_exact, difference, strict=True))/f
    candidate = -8.*psi**(-5)*sum(second.second_derivative(psi, i) for i in range(3))
    result = dict(zip(FIELD_KEYS, (old-exact, oracle-exact, propagated, quadratic, candidate-exact), strict=True))
    defect = float(np.max(abs(result["old_error"]-(result["analytic_connection_error"]+propagated+quadratic))))
    require(defect <= 2.e-11, "signed curvature decomposition identity failed")
    w = first.norm_weights
    return result, w[:, None, None]*w[None, :, None]*w[None, None, :], defect


def one_dimensional(n):
    x = np.linspace(1., 3., n)
    exact = np.exp(x)
    d1, d2 = SBP42(n, 2./(n-1)), SBP42Second(n, 2./(n-1))
    return dict(n=n, measurements={key: summaries(field, d1.norm_weights) for key, field in
        (("D1", d1.derivative(exact)-exact), ("D1_composed", d1.derivative(d1.derivative(exact))-exact),
         ("D2", d2.second_derivative(exact)-exact))})


def order(low, high, ratio):
    require(type(ratio) in (int, float) and math.isfinite(ratio) and ratio > 1.
            and all(v is None or (type(v) in (int, float) and math.isfinite(v) and v >= 0.) for v in (low, high)),
            "invalid error pair")
    resolved = low is not None and high is not None and low > FLOOR and high > FLOOR
    return dict(coarse_error=low, fine_error=high, ratio=ratio, resolved=resolved,
                observed_order=math.log(low/high)/math.log(ratio) if resolved else None)


def order_rows(rows, keys):
    result = []
    for low, high in list(zip(rows[:-1], rows[1:], strict=True))+[(rows[4], rows[6])]:
        for key in keys:
            for region in masks(low["n"], 1):
                def value(row):
                    item = row["measurements"][key][region]
                    return item["rms"] if item is not None else None
                result.append(dict(grids=[low["n"], high["n"]], field=key, region=region,
                    **order(value(low), value(high), (high["n"]-1)/(low["n"]-1))))
    return result


def compare_saved(parent):
    audit = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-nonlinear-refinement.py"))
    rows = []
    for n, case in zip((9, 13, 17), parent["cases"][:3], strict=True):
        name = case["initial_array"]
        path = bounded(PARENT.parent, name)
        require(case["n"] == n and sha(path) == parent["artifact_hashes"][name], "saved initial identity changed")
        q = np.load(path, allow_pickle=False)
        fields, _weights = audit["tensor_fields"](q)
        first = SBP42(n, 2./(n-1))
        f = 1./np.exp(2.*q[10])
        b = [first.derivative(f, i)/(2.*f) for i in range(3)]
        reduced = (-4.*sum(first.derivative(b[i], i) for i in range(3))-2.*sum(v*v for v in b))/f
        analytic_reduced = curvature_fields(n, "schwarzschild")[0]["old_error"]
        discrepancy = float(np.max(abs(reduced-fields["H_metric"])))
        analytic_difference = float(np.max(abs(analytic_reduced-fields["H_metric"])))
        require(max(discrepancy, analytic_difference) <= 2.e-11, "conformal reduction differs from saved tensor H")
        rows.append(dict(n=n, initial_sha256=sha(path), maximum_tensor_reduction_difference=discrepancy,
                         maximum_analytic_grid_difference=analytic_difference))
    return rows


def hypothesis_checks(one, curved):
    def observed(rows, field, region):
        matches = [r for r in rows if r["grids"] == [33, 65] and r["field"] == field and r["region"] == region]
        require(len(matches) == 1, "one fixed comparison required")
        return matches[0]["observed_order"]
    p = observed(one, "D1_composed", "whole")
    rows = [dict(check="exp_composed_whole", observed_order=p, passed=p is not None and 1.3 <= p <= 1.7)]
    for family in FAMILIES:
        for region, minimum in (("whole", 2.2), ("fixed_box", 3.5)):
            p = observed(curved[family], "candidate_D2_error", region)
            rows.append(dict(check=family+"_D2_"+region, observed_order=p, minimum=minimum,
                             passed=p is not None and p >= minimum))
    return rows


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
    before, parent, tests = sources(args.test_report)
    result = dict(schema="nr-static-derivative-study-v1", completed=False, static_hypothesis_checks_passed=False,
                  original_refinement_screen_passed=False, regrades_parent=False, evolution_executed=False,
                  source_before=before, source_after={}, cases=[], one_dimensional=[], errors=[], tests=tests,
                  parent_sha256=RETAINED[PARENT], parent_audit_sha256=RETAINED[AUDIT],
                  resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2),
                  python=sys.version, numpy=np.__version__, platform=platform.platform(), **{key: False for key in FLAGS})
    directory.mkdir()
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(bounded(ROOT, name), target)
            require(sha(target) == digest, "source snapshot changed")
        result["rational_cubic"] = [rational_cubic(n) for n in (17, 33)]
        require(result["rational_cubic"][0]["squared_rms_over_h_cubed"] == result["rational_cubic"][1]["squared_rms_over_h_cubed"],
                "cubic h^(3/2) norm law differs")
        guard(directory, deadline)
        result["saved_initial_comparisons"] = compare_saved(parent)
        for n in GRIDS:
            guard(directory, deadline)
            result["one_dimensional"].append(one_dimensional(n))
        for family in FAMILIES:
            for n in GRIDS:
                row = dict(family=family, n=n, completed=False)
                result["cases"].append(row)
                guard(directory, deadline)
                fields, weights, defect = curvature_fields(n, family)
                row.update(measurements={key: summaries(value, weights) for key, value in fields.items()},
                           signed_identity_max_defect=defect, candidate_operator=SBP42Second(n, 2./(n-1)).identity,
                           fixed_box_unaffected_by_composite_closure=bool(not np.any(masks(n, 3)["fixed_box"] & masks(n, 3)["composite_band"])))
                array = np.stack([fields[key] for key in FIELD_KEYS])
                row["field_array"] = f"{family}-{n}.npy"
                guard(directory, deadline, additional=array.nbytes+1024)
                with (directory/row["field_array"]).open("xb") as handle:
                    np.save(handle, array, allow_pickle=False)
                guard(directory, deadline)
                row["completed"] = True
                print(json.dumps(dict(family=family, n=n, completed=True)), flush=True)
        result["one_dimensional_orders"] = order_rows(result["one_dimensional"], ("D1", "D1_composed", "D2"))
        result["curved_orders"] = {family: order_rows([r for r in result["cases"] if r["family"] == family], FIELD_KEYS)
                                   for family in FAMILIES}
        result["hypotheses"] = hypothesis_checks(result["one_dimensional_orders"], result["curved_orders"])
        result.update(completed=True, static_hypothesis_checks_passed=all(r["passed"] for r in result["hypotheses"]))
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
    except Exception as error:
        result["errors"].append(str(error))
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    try:
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] &= not result["errors"]
    result["static_hypothesis_checks_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    with (directory/"receipt.json").open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({k: result[k] for k in ("completed", "static_hypothesis_checks_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["static_hypothesis_checks_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

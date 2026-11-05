"""Independent dense metric/Riemann diagnostic audit, never physical admission.

Uses lower-index Riemann contractions rather than the production derivative
of inverse metric / derivative of Christoffel implementation. No production
geometry, volume RHS or nonlinear driver is imported by this auditor.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import shutil
import time
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
HELPER = ROOT/"scripts/audit-nr-k3-nonlinear-refinement.py"
HELPER_SHA = "f904bc8856a263435f236b7d18ba0ea964745f24fa1ade7504bae25c5cf05c1b"
A = runpy.run_path(str(HELPER))
require, sha, bounded, same = (A[k] for k in ("require", "sha", "bounded", "same"))
require(sha(HELPER) == HELPER_SHA, "independent dense helper changed")
FLAGS, MATRIX = A["FLAGS"], A["MATRIX"]
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-nonlinear-dual-diagnostics.md"
EXTRA = (PROTOCOL, "scripts/run-nr-k3-nonlinear-dual-diagnostics.py",
         "scripts/tests/test_nr_nonlinear_dual_diagnostics.py")
PARENT = EVIDENCE/"nr-k3-metric-geometry-v1-20261009/receipt.json"
PARENT_SHA = "91d83db1eea622d95570b0760699204ae644beb4e545a5be95d7315a51bbb422"
LEGACY = EVIDENCE/"nr-k3-nonlinear-refinement-v1-20261009/receipt.json"
LEGACY_SHA = "463a8ec5da3693097cc861b7481fd8c434801b2849161db4abbb5fa27b14fc3f"
REGIONS = ("whole", "central_box", "faces", "edges", "corners")


def dense_second(n, spacing):
    require(type(n) is int and n >= 9 and A["finite"](spacing) and spacing > 0., "valid dense second grid required")
    matrix = np.zeros((n, n))
    rows = ((2., -5., 4., -1.), (1., -2., 1.), (-4/43, 59/43, -110/43, 59/43, -4/43),
            (-1/49, 0., 59/49, -118/49, 64/49, -4/49))
    for i, row in enumerate(rows):
        matrix[i, :len(row)] = row
        matrix[-1-i, -len(row):] = np.array(row)[::-1]
    for i in range(4, n-4):
        matrix[i, i-2:i+3] = (-1/12, 4/3, -5/2, 4/3, -1/12)
    return matrix/spacing**2


def lower_riemann_ricci(metric, first, second):
    """Contract g^ac R_aicj, using first-kind Christoffels C_mab.

    R_aicj = (g_aj,ic + g_ic,aj - g_ij,ac - g_ac,ij)/2
              + g^mn (C_maj C_nic - C_mac C_nij).
    """
    g, dg, ddg = (np.asarray(x) for x in (metric, first, second))
    shape = g.shape[:-2]
    require(g.shape[-2:] == (3, 3) and dg.shape == (*shape, 3, 3, 3)
            and ddg.shape == (*shape, 3, 3, 3, 3), "tensor jet layout mismatch")
    require(all(not np.iscomplexobj(x) and np.all(np.isfinite(x)) for x in (g, dg, ddg)), "finite real jets required")
    require(np.allclose(g, np.swapaxes(g, -1, -2), rtol=0., atol=1.e-14)
            and np.all(np.linalg.eigvalsh(g) > 0.), "symmetric positive metric required")
    inverse = np.linalg.inv(g)
    c = np.empty((*shape, 3, 3, 3))
    for m in range(3):
        for a in range(3):
            for b in range(3):
                c[..., m, a, b] = .5*(dg[..., a, m, b]+dg[..., b, m, a]-dg[..., m, a, b])
    ricci = np.zeros_like(g, dtype=np.float64)
    for i in range(3):
        for j in range(3):
            for a in range(3):
                for b in range(3):
                    ricci[..., i, j] += .5*inverse[..., a, b]*(ddg[..., i, b, a, j]+ddg[..., a, j, i, b]
                        -ddg[..., a, b, i, j]-ddg[..., i, j, a, b])
            ricci[..., i, j] += np.einsum("...ac,...mn,...ma,...nc->...", inverse, inverse, c[..., :, :, j], c[..., :, i, :])
            ricci[..., i, j] -= np.einsum("...ac,...mn,...mac,...n->...", inverse, inverse, c, c[..., :, i, j])
    require(np.all(np.isfinite(ricci)), "nonfinite independent curvature")
    return ricci


def geometry(metric, spacing):
    g = np.asarray(metric)
    require(g.ndim == 5 and g.shape[-2:] == (3, 3) and len(spacing) == 3, "three spatial axes required")
    first_ops = [A["SBP"](n)[0]*(2./(n-1))/h for n, h in zip(g.shape[:3], spacing, strict=True)]
    second_ops = [dense_second(n, h) for n, h in zip(g.shape[:3], spacing, strict=True)]
    first = np.stack([A["derivative"](op, g, a) for a, op in enumerate(first_ops)], axis=-3)
    second = np.empty((*g.shape[:3], 3, 3, 3, 3))
    for a in range(3):
        for b in range(a, 3):
            value = A["derivative"](second_ops[a], g, a) if a == b else A["derivative"](first_ops[a], first[..., b, :, :], a)
            second[..., a, b, :, :] = second[..., b, a, :, :] = value
    return lower_riemann_ricci(g, first, second)


def reconstructed(q, reference):
    fields, weights = A["tensor_fields"](q)
    n = q.shape[1]
    h, a = np.zeros((n, n, n, 3, 3)), np.zeros((n, n, n, 3, 3))
    for slot, (i, j) in enumerate(A["PAIRS"]):
        h[..., i, j] = h[..., j, i] = q[slot]
        a[..., i, j] = a[..., j, i] = q[11+slot]
    chi = np.exp(2.*q[10])
    g = h/chi[..., None, None]
    k = (a+h*q[17, ..., None, None]/3.)/chi[..., None, None]
    inverse = np.linalg.inv(g)
    mixed = np.einsum("...ij,...jk->...ik", inverse, k)
    ricci = geometry(g, (2./(n-1),)*3)
    new_h = np.einsum("...ij,...ij->...", inverse, ricci)+np.trace(mixed, axis1=-2, axis2=-1)**2
    new_h -= np.einsum("...ij,...ji->...", mixed, mixed)
    fields.update(H_metric_hessian=new_h, H_diagnostic_difference=new_h-fields["H_metric"],
                  M_metric_hessian=fields["M_metric"], state_error=np.moveaxis(q-reference, 0, -1))
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    count = sum(((x == 1.) | (x == 3.)).astype(int) for x in xyz)
    central = np.logical_and.reduce([(x >= 1.5) & (x <= 2.5) for x in xyz])
    masks = dict(whole=np.ones((n, n, n), dtype=bool), central_box=central,
                 faces=count == 1, edges=count == 2, corners=count == 3)
    norms = {region: {key: A["rms"](v, weights, mask) for key, v in fields.items()} for region, mask in masks.items()}
    return norms, float(np.max(abs(ricci-np.swapaxes(ricci, -1, -2))))


def compare_norms(calculated, stored):
    require(set(calculated) == set(stored) == set(REGIONS), "complete regions required")
    maximum = 0.
    for region, values in calculated.items():
        require(set(values) == set(stored[region]), "complete diagnostic fields required")
        for key, value in values.items():
            observed = stored[region][key]
            require(A["finite"](observed) and observed >= 0., "finite norm required")
            maximum = max(maximum, abs(observed-value))
    require(maximum <= 2.e-12, "independent diagnostic disagreement")
    return maximum


def verify_manifest(path, data):
    actual = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(actual == set(data["artifact_hashes"]), "complete artifact manifest required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(bounded(path.parent, name)) == digest, "saved artifact changed")
    return len(actual)


def check_header(data, parent):
    require(data.get("schema") == "nr-nonlinear-dual-diagnostics-v1" and data.get("completed") is True
            and data.get("errors") == [] and data.get("closure_completed") is False
            and data.get("regrades_legacy") is False and all(data.get(k) is False for k in FLAGS), "unadmitted completed run required")
    require(data.get("parent_sha256") == PARENT_SHA and data.get("evolution_sha256") == LEGACY_SHA
            and data.get("source_before") == data.get("source_after"), "source/parent identity mismatch")
    expected = {**parent["source_after"], **{k: sha(bounded(ROOT, k)) for k in EXTRA}}
    require(data["source_after"] == expected and data["protocol_sha256"] == expected[PROTOCOL], "exact inherited sources required")
    require(same(data.get("diagnostic_identity"), parent.get("diagnostic_identity")), "diagnostic identity changed")
    require(same(data.get("resource_caps"), dict(seconds=2400., output_bytes=96*1024**2,
                c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2)), "resource contract changed")


def audit(receipt, deadline):
    require(receipt.name == "receipt.json" and receipt.parent.parent == EVIDENCE.resolve(), "bounded receipt required")
    require(sha(PARENT) == PARENT_SHA and sha(LEGACY) == LEGACY_SHA, "retained parent drift")
    parent, legacy, data = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, LEGACY, receipt))
    check_header(data, parent)
    artifact_count = verify_manifest(receipt, data)
    legacy_artifacts = verify_manifest(LEGACY, legacy)
    test_record = data["tests"]["runner_tests"]
    require(sha(bounded(ROOT, test_record["path"])) == test_record["sha256"], "runner test report changed")
    distinct = set()
    for name, digest in data["source_after"].items():
        current = bounded(ROOT, name)
        require(sha(current) == digest and sha(bounded(receipt.parent/"source-snapshot", name)) == digest, "current/saved source mismatch")
        distinct.add(current)
    require(len(data["cases"]) == 6, "six complete cases required")
    results, finals, endpoint_pairs = [], [], []
    maximum = max_seed = max_antisymmetry = 0.
    points_checked = 0
    for row, spec, old in zip(data["cases"], MATRIX, legacy["cases"], strict=True):
        label, n, dt, steps, perturbed = spec
        A["check_case"](row, spec, old)
        require(row.get("exact_legacy_endpoint_replay") is True and row.get("exact_legacy_record_replay") is True,
                "explicit unchanged-evolution replay required")
        for key in ("step_records", "initial_measurements", "final_measurements", "operator_identity", "parameters"):
            require(same(row[key], old[key]), "legacy stage/diagnostic record differs")
        for key in ("initial_array", "final_array"):
            left, right = bounded(receipt.parent, row[key]), bounded(LEGACY.parent, old[key])
            require(sha(left) == sha(right), "legacy array replay differs")
            endpoint_pairs.append(dict(label=label, field=key, sha256=sha(left)))
        require(len(row.get("trajectory", [])) == steps+1, "complete saved trajectory required")
        reference = A["initial_slots"](n)
        computed = []
        for index, p in enumerate(row["trajectory"]):
            guard(deadline)
            expected_name = label+("-initial.npy" if index == 0 else ("-final.npy" if index == steps else f"-step-{index:04d}.npy"))
            require(type(p.get("point")) is int and p["point"] == index and A["finite"](p.get("time"))
                    and p["time"] == index*dt and p.get("array") == expected_name and p.get("input_unchanged") is True,
                    "ordered unchanged trajectory binding required")
            for key in ("maximum_M_difference", "ricci_antisymmetry_max"):
                require(A["finite"](p.get(key)) and 0. <= p[key] <= 2.e-11, "diagnostic consistency bound failed")
            q = np.load(bounded(receipt.parent, p["array"]), allow_pickle=False)
            if index == 0:
                max_seed = max(max_seed, float(np.max(abs(q-A["initial_slots"](n, perturbed)))))
            norms, antisymmetry = reconstructed(q, reference)
            maximum = max(maximum, compare_norms(norms, p["measurements"]))
            max_antisymmetry = max(max_antisymmetry, antisymmetry)
            computed.append(dict(point=index, time=index*dt, array=expected_name, measurements=norms))
            points_checked += 1
            if index == steps and perturbed:
                finals.append(q)
        results.append(dict(label=label, trajectory=computed))
        print(json.dumps(dict(case=label, audited_points=steps+1)), flush=True)
    require(max_seed <= 2.e-14 and max_antisymmetry <= 2.e-11, "analytic seed or symmetry check failed")
    spatial, old_spatial = [], []
    for key, minimum in (("state_error", 1.5), ("M_metric", 1.5), ("H_metric_hessian", 2.2)):
        for a, b in ((0, 1), (1, 2)):
            values = [results[i]["trajectory"][-1]["measurements"]["whole"][key] for i in (a, b)]
            spatial.append(dict(metric=key, minimum=minimum, grids=[MATRIX[a][1], MATRIX[b][1]],
                **A["decision_pair"](*values, (MATRIX[b][1]-1)/(MATRIX[a][1]-1), minimum)))
    for key in ("state_error", "H_metric", "M_metric"):
        for a, b in ((0, 1), (1, 2)):
            values = [results[i]["trajectory"][-1]["measurements"]["whole"][key] for i in (a, b)]
            old_spatial.append(dict(metric=key, grids=[MATRIX[a][1], MATRIX[b][1]],
                **A["decision_pair"](*values, (MATRIX[b][1]-1)/(MATRIX[a][1]-1), 1.5)))
    _, w = A["SBP"](13)
    weights = w[:, None, None]*w[None, :, None]*w[None, None, :]
    differences = [A["rms"](np.moveaxis(finals[i]-finals[i+1], 0, -1), weights) for i in (0, 1)]
    temporal = A["decision_pair"](*differences, 2., 3.5, 4.5)
    decision = data["decision"]
    require(len(decision["spatial"]) == 6 and len(decision["legacy"]["spatial"]) == 6, "complete decision pairs required")
    for calculated, stored in zip(spatial+old_spatial, decision["spatial"]+decision["legacy"]["spatial"], strict=True):
        A["compare_decision"](calculated, stored)
    A["compare_decision"](temporal, decision["temporal"])
    A["compare_decision"](temporal, decision["legacy"]["temporal"])
    active = all(max(s["sat_max_abs"] for t in row["step_records"] for s in t["stages"]) > 2.e-12
        and len({s["coefficients_sha256"] for t in row["step_records"] for s in t["stages"]}) > 1 for row in data["cases"][3:])
    passed = bool(all(p["passed"] for p in spatial) and temporal["passed"] and active)
    old_passed = bool(all(p["passed"] for p in old_spatial) and temporal["passed"] and active)
    require(data.get("metric_hessian_screen_passed") is passed and decision.get("metric_hessian_screen_passed") is passed
            and data.get("legacy_refinement_screen_passed") is old_passed and decision["legacy"].get("passed") is old_passed
            and decision.get("regrades_legacy") is False and decision.get("exact_legacy_endpoint_replay") is True
            and type(decision.get("accepted_state_points")) is int and decision["accepted_state_points"] == points_checked == 58,
            "aggregate diagnostic decision mismatch")
    old_decision = decision["legacy"]
    require(old_decision.get("active_updated_sat") is active and old_decision.get("temporal_passed") is temporal["passed"]
            and old_decision.get("spatial_passed") is all(p["passed"] for p in old_spatial)
            and type(old_decision.get("stages_checked")) is int and old_decision["stages_checked"] == 208
            and type(old_decision.get("disturbed_stages")) is int and old_decision["disturbed_stages"] == 112,
            "legacy aggregate mismatch")
    verify_manifest(receipt, data)
    verify_manifest(LEGACY, legacy)
    for name, digest in data["source_after"].items():
        require(sha(bounded(ROOT, name)) == digest, "source changed during audit")
    return dict(audit_completed=True, metric_hessian_screen_passed=passed, legacy_refinement_screen_passed=old_passed,
        independent_saved_states=points_checked, maximum_diagnostic_difference=maximum, maximum_seed_difference=max_seed,
        maximum_ricci_antisymmetry=max_antisymmetry, spatial=spatial, temporal=temporal, legacy_spatial=old_spatial,
        cases=results, endpoint_replay_pairs=endpoint_pairs, exact_legacy_endpoint_replay=True,
        artifacts_checked=artifact_count, legacy_artifacts_checked=legacy_artifacts,
        source_keys_checked=len(data["source_after"]), distinct_source_files_checked=len(distinct), receipt_sha256=sha(receipt))


def guard(deadline):
    require(time.perf_counter() < deadline, "180s independent audit deadline reached")
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
            "C/E storage reserve reached")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    args = parser.parse_args()
    output, receipt = args.output.resolve(), args.receipt.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh bounded audit output required")
    started = time.perf_counter()
    guard(started+180.)
    report = bounded(ROOT, args.test_report.resolve().relative_to(ROOT).as_posix())
    test_root = ET.parse(report).getroot()
    tests = list(test_root.iter("testcase"))
    require(tests and not any(list(test_root.iter(k)) for k in ("failure", "error", "skipped"))
            and all(t.get("classname", "").endswith("scripts.tests.test_nr_nonlinear_dual_diagnostics_audit") for t in tests),
            "green auditor tests required")
    paths = (Path(__file__).resolve(), HELPER, ROOT/PROTOCOL, ROOT/"scripts/tests/test_nr_nonlinear_dual_diagnostics_audit.py")
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    receipt_before, report_before = sha(receipt), sha(report)
    result = dict(schema="nr-nonlinear-dual-independent-audit-v1", audit_completed=False, errors=[],
        closure_completed=False, metric_hessian_screen_passed=False, legacy_refinement_screen_passed=False,
        intermediate_rk_fields_reconstructed=False, independent_evolution_solver=False, regrades_legacy=False,
        scope="independent saved-endpoint curvature/constraint diagnostics only",
        tests=dict(path=report.relative_to(ROOT).as_posix(), sha256=report_before, cases=len(tests)), **{k: False for k in FLAGS})
    try:
        result.update(audit(receipt, started+180.))
        guard(started+180.)
        require(sha(receipt) == receipt_before and sha(report) == report_before, "input/report changed during audit")
    except Exception as error:
        result.update(audit_completed=False, metric_hessian_screen_passed=False)
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["auditor_sources"] = before
    result["auditor_sources_after"] = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    if before != result["auditor_sources_after"]:
        result.update(audit_completed=False, metric_hessian_screen_passed=False)
        result["errors"].append("auditor source drift")
    result["seconds"] = time.perf_counter()-started
    text = json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n"
    require(len(text.encode("utf-8")) <= 8*1024**2, "8MiB audit report cap reached")
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
    print(json.dumps({k: result[k] for k in ("audit_completed", "metric_hessian_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["audit_completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

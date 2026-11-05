"""Independent saved-state checks of a passed or determinant-rejected probe.

No production evolution module is imported. This is not a second evolution.
Other rejection classes remain outside this auditor's numerical-failure scope.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
HELPER = ROOT/"scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"
HELPER_SHA = "f345cc4f37ae8e17199ea87cf4aecb49c552da1ab03242dbcd2c4c3d1b26453a"
A = runpy.run_path(str(HELPER))
require, sha, bounded, same = (A[k] for k in ("require", "sha", "bounded", "same"))
require(sha(HELPER) == HELPER_SHA, "independent geometry helper changed")
PARENT = EVIDENCE/"nr-k3-nonlinear-dual-diagnostics-v1-20261009/receipt.json"
PARENT_SHA = "31e78ece7f718bad5ef0453844407a9029a4a61ef2bcf791ba194e37007c2233"
BALANCE = EVIDENCE/"nr-k3-determinant-balance-v1-20261009/receipt.json"
BALANCE_SHA = "4919e2e8f8b85baf00dbe70bffb96df8411508f2cad6f6c21609783179c78b3b"
EXTRA = ("science/numerical_relativity/EXPERIMENT-20261009-longer-window-probe.md",
         "scripts/run-nr-k3-longer-window-probe.py", "scripts/tests/test_nr_longer_window_probe.py")
MATRIX = (("static-13-long", False, "spatial-13"), ("perturbed-13-long", True, "temporal-medium"))
FLAGS = A["FLAGS"]


def guard(deadline):
    require(time.perf_counter() < deadline, "120s independent audit deadline reached")
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
            "C/E storage reserve reached")


def determinant_errors(q):
    """Explicit symmetric 3x3 cofactor polynomial, not numpy.linalg.det."""
    q = np.asarray(q)
    require(q.dtype == np.float64 and q.ndim == 4 and q.shape[0] == 58
            and len(set(q.shape[1:])) == 1 and q.shape[1] >= 1 and np.all(np.isfinite(q)), "finite FP64 canonical cube required")
    a, b, c, d, e, f = q[:6]
    det = a*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c)
    require(np.all(np.isfinite(det)), "nonfinite determinant polynomial")
    return abs(det-1.)


def determinant_error(q):
    return float(np.max(determinant_errors(q)))


def check_rejection(directory, row):
    data = row.get("rejection", {})
    require(data.get("accepted") is False and data.get("restart_permitted") is False,
            "rejected state cannot be an accepted checkpoint")
    require(data.get("location") in ("stage-rhs-or-gate", "candidate-endpoint-determinant"),
            "only explicit determinant rejection is in this audit scope")
    q = np.load(bounded(directory, data["state_array"]), allow_pickle=False)
    require(q.shape == (58, 13, 13, 13), "rejected canonical N13 state required")
    error = determinant_error(q)
    require(A["A"]["finite"](data.get("determinant_max")) and abs(error-data["determinant_max"]) <= 2.e-14,
            "recorded/reconstructed rejected determinant differs")
    require(error > 1.e-10+2.e-14, "determinant crossing not independently resolved")
    rhs_checked = False
    if "rhs_array" in data:
        rhs = np.load(bounded(directory, data["rhs_array"]), allow_pickle=False)
        require(rhs.shape == q.shape and rhs.dtype == np.float64 and np.all(np.isfinite(rhs)), "finite recorded rejected RHS required")
        rhs_checked = True
    last = row["attempted_steps"][-1]
    require(last["accepted"] is False and last["step"] == row["last_completed_step"]+1, "first unaccepted step required")
    if data["location"] == "stage-rhs-or-gate":
        stage = last["stages"][-1]
        require(stage.get("stage_contract_passed") is False and "failure" in stage,
                "explicit rejected determinant stage required")
        if stage.get("rhs_completed") is True:
            require(stage["report"]["det_h_max_error"] > 1.e-10
                    and abs(stage["report"]["det_h_max_error"]-error) <= 2.e-14, "rejected stage determinant differs")
            rejection_gate = "returned-stage-report"
        else:
            require(stage.get("rhs_completed") is False and "report" not in stage and not rhs_checked
                    and stage["failure"] == "ValueError: published speed contract requires det(h)=1",
                    "recognized pre-return speed-contract rejection required")
            field = determinant_errors(q)
            boundary_error = max(float(np.max(np.take(field, side, axis=axis)))
                                 for axis in range(3) for side in (0, -1))
            require(boundary_error > 1.e-10+2.e-14, "characteristic-boundary determinant crossing not resolved")
            rejection_gate = "boundary-speed-contract-before-rhs-return"
        stage_index = stage["stage"]
        require(type(stage_index) is int and 1 <= stage_index <= 4 and stage_index == len(last["stages"]),
                "canonical RK stage index required")
        failure_time = (last["step"]+(0., .5, .5, 1.)[stage_index-1])/256.
    else:
        stage_index = None
        rejection_gate = "candidate-endpoint-determinant"
        require(len(last["stages"]) == 4 and all(s["stage_contract_passed"] is True for s in last["stages"]),
                "four valid stages before endpoint rejection required")
        failure_time = (last["step"]+1)/256.
    return dict(determinant_crossing_confirmed=True, polynomial_max_error=error,
                recorded_max_error=data["determinant_max"], original_limit=1.e-10,
                rejection_gate=rejection_gate,
                step_zero_based=last["step"], rk_stage=stage_index, candidate_time=failure_time,
                rhs_shape_and_finiteness_checked=rhs_checked, rhs_independently_recomputed=False,
                rejected_restart_permitted=False)


def audit(receipt, deadline):
    require(receipt.name == "receipt.json" and receipt.parent.parent == EVIDENCE.resolve(), "bounded probe receipt required")
    require(sha(PARENT) == PARENT_SHA and sha(BALANCE) == BALANCE_SHA, "closed parent identity changed")
    data, parent, balance = (json.loads(p.read_text(encoding="utf-8")) for p in (receipt, PARENT, BALANCE))
    require(data.get("schema") == "nr-nonlinear-longer-window-probe-v1"
            and data.get("parent_sha256") == PARENT_SHA and data.get("closure_completed") is False
            and all(data.get(k) is False for k in FLAGS)
            and all(data.get(k) is False for k in ("full_evolution_replay", "convergence_validated",
                "nonlinear_stability_validated", "observer_changes_rhs")), "unadmitted probe identity required")
    require(type(data.get("completed")) is bool and data.get("probe_passed") is data["completed"], "probe verdict mismatch")
    require((data["errors"] == []) is data["completed"], "probe errors and completion disagree")
    expected = {**balance["source_after"], **{name: sha(bounded(ROOT, name)) for name in EXTRA}}
    require(data["source_before"] == data["source_after"] == expected
            and data["protocol_sha256"] == expected[EXTRA[0]], "complete unchanged source identity required")
    distinct = set()
    for name, digest in expected.items():
        source = bounded(ROOT, name)
        require(sha(source) == digest and sha(bounded(receipt.parent/"source-snapshot", name)) == digest,
                "source/current snapshot mismatch")
        distinct.add(source)
    artifacts = A["verify_manifest"](receipt, data)
    require(1 <= len(data["cases"]) <= 2, "ordered nonempty case prefix required")
    rows, maximum, count, prefix_states, prefix_steps = [], 0., 0, 0, 0
    for index, row in enumerate(data["cases"]):
        guard(deadline)
        label, perturbed, parent_label = MATRIX[index]
        old = next(c for c in parent["cases"] if c["label"] == parent_label)
        require(row["label"] == label and row["perturbed"] is perturbed and row["parent_label"] == parent_label
                and type(row["n"]) is int and row["n"] == 13 and row["dt"] == 1./256
                and type(row["steps"]) is int and row["steps"] == 16 and row["end_time"] == 1./16
                and row["input_unchanged"] is True, "frozen case metadata changed")
        require(same(row["operator_identity"], old["operator_identity"]) and same(row["parameters"], old["parameters"]),
                "unchanged numerical method required")
        steps = len(row["step_records"])
        require(0 <= steps <= 16 and row["last_completed_step"] == steps-1
                and len(row["trajectory"]) == steps+1, "complete accepted-state prefix required")
        reference = A["A"]["initial_slots"](13, False)
        for point_index, point in enumerate(row["trajectory"]):
            guard(deadline)
            require(type(point["point"]) is int and point["point"] == point_index
                    and point["time"] == point_index/256 and point["completed"] is True
                    and point["input_unchanged"] is True, "ordered completed saved points required")
            q = np.load(bounded(receipt.parent, point["array"]), allow_pickle=False)
            require(q.shape == (58, 13, 13, 13) and q.dtype == np.float64, "canonical saved state required")
            det = determinant_error(q)
            require(det <= 1.e-10+2.e-14 and abs(det-point["determinant_max"]) <= 2.e-14,
                    "accepted determinant observation disagreement")
            calculated, antisymmetry = A["reconstructed"](q, reference)
            difference = A["compare_norms"](calculated, point["measurements"])
            require(antisymmetry <= 2.e-11, "independent curvature antisymmetry failed")
            maximum = max(maximum, difference)
            if point_index <= 8:
                require(point.get("exact_parent_prefix") is True and sha(receipt.parent/point["array"])
                        == sha(bounded(PARENT.parent, old["trajectory"][point_index]["array"])), "exact parent array prefix required")
                prefix_states += 1
            count += 1
        for step_index, record in enumerate(row["step_records"]):
            require(type(record["step"]) is int and record["step"] == step_index, "ordered accepted steps required")
            A["A"]["check_stages"](record["stages"])
            attempt = row["attempted_steps"][step_index]
            require(attempt["step"] == step_index and attempt["accepted"] is True and len(attempt["stages"]) == 4
                    and all(s["rhs_completed"] is True and s["stage_contract_passed"] is True for s in attempt["stages"])
                    and same([s["report"] for s in attempt["stages"]], record["stages"]), "accepted observation binding differs")
            if step_index < 8:
                require(same(record, old["step_records"][step_index]) and attempt.get("exact_parent_prefix") is True,
                        "exact parent stage prefix required")
                prefix_steps += 1
        summary = dict(label=label, accepted_steps=steps, accepted_states=steps+1)
        if row["completed"] is True:
            require(steps == 16 and len(row["attempted_steps"]) == 16 and row["phase"] == "completed"
                    and "failure" not in row and "rejection" not in row, "complete successful case required")
        else:
            require(row["completed"] is False and index == len(data["cases"])-1 and not data["completed"]
                    and "failure" in row and len(row["attempted_steps"]) == steps+1, "first rejected final case required")
            summary["rejection"] = check_rejection(receipt.parent, row)
        rows.append(summary)
    require(not data["completed"] or len(rows) == 2, "full successful matrix required")
    require(data["completed"] or any("rejection" in row for row in rows),
            "non-determinant/global failures are outside this failure-audit scope")
    guard(deadline)
    return dict(audit_completed=True, probe_completed=data["completed"], probe_passed=data["probe_passed"],
                independent_saved_states=count, maximum_norm_difference=maximum, exact_parent_prefix_states=prefix_states,
                exact_parent_prefix_steps=prefix_steps, source_keys=len(expected), distinct_source_files=len(distinct),
                artifact_hashes_checked=artifacts, cases=rows, full_evolution_replay=False,
                physical_admission=False, **{k: False for k in FLAGS})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt, output = args.receipt.resolve(), args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh direct audit output required")
    started = time.perf_counter()
    deadline = started+120.
    guard(deadline)
    inputs = {p: sha(p) for p in (receipt, PARENT, BALANCE, HELPER, Path(__file__).resolve(),
                                ROOT/"scripts/tests/test_nr_longer_window_audit.py")}
    result = dict(schema="nr-longer-window-independent-audit-v1", audit_completed=False, errors=[],
                  receipt_sha256=inputs[receipt], **{k: False for k in FLAGS})
    try:
        result.update(audit(receipt, deadline))
        for path, digest in inputs.items():
            require(sha(path) == digest, "audit input/source identity changed")
        data = json.loads(receipt.read_text(encoding="utf-8"))
        for name, digest in data["source_after"].items():
            require(sha(bounded(ROOT, name)) == digest, "current source drift during audit")
        A["verify_manifest"](receipt, data)
        guard(deadline)
    except Exception as error:
        result.update(audit_completed=False)
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["auditor_sources"] = {str(p.relative_to(ROOT)): digest for p, digest in inputs.items()
                                  if p.suffix == ".py"}
    result["seconds"] = time.perf_counter()-started
    encoded = json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n"
    require(len(encoded.encode("utf-8")) <= 1024**2, "1MiB audit output cap exceeded")
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(encoded)
    print(json.dumps(result, sort_keys=True), flush=True)
    return 0 if result["audit_completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

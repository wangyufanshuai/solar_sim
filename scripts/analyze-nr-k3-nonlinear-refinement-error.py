"""Post-hoc signed initial/evolution error separation; no regrading."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import runpy

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT/"scripts/audit-nr-k3-nonlinear-refinement.py"
A = runpy.run_path(str(HELPER))
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PROTOCOL = ROOT/"science/numerical_relativity/ANALYSIS-20261009-refinement-initial-error.md"


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def decomposition(initial, final, weights):
    require(initial.shape == final.shape and initial.shape[:3] == weights.shape,
            "matching node-first fields required")
    require(np.all(np.isfinite(initial)) and np.all(np.isfinite(final))
            and np.all(np.isfinite(weights)) and np.all(weights > 0.), "finite fields/positive weights required")
    initial = initial.reshape((*weights.shape, -1))
    final = final.reshape((*weights.shape, -1))
    change = final-initial

    def inner(x, y):
        return float(np.sum(weights*np.mean(x*y, axis=-1))/np.sum(weights))

    e0, e1, delta, cross = inner(initial, initial), inner(final, final), inner(change, change), inner(initial, change)
    require(all(np.isfinite(x) for x in (e0, e1, delta, cross)), "nonfinite inner product")
    defect = abs(e1-(e0+delta+2.*cross))
    scale = max(e0+e1+delta+2.*abs(cross), np.finfo(float).tiny)
    require(defect <= 128*np.finfo(float).eps*scale, "signed norm identity failed")
    return dict(initial_rms=float(np.sqrt(e0)), final_rms=float(np.sqrt(e1)), change_rms=float(np.sqrt(delta)),
                change_over_initial=float(np.sqrt(delta/e0)) if e0 > 0. else None,
                signed_cross_term=2.*cross, squared_norm_identity_defect=defect)


def analyze(receipt, audit_path):
    require(receipt.name == "receipt.json" and receipt.parent.parent == EVIDENCE.resolve(), "bounded receipt required")
    require(audit_path.parent == EVIDENCE.resolve(), "bounded independent audit required")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    checked = json.loads(audit_path.read_text(encoding="utf-8"))
    require(data.get("completed") is True and checked.get("audit_completed") is True
            and checked.get("receipt_sha256") == sha(receipt), "completed independently audited campaign required")
    require(data.get("refinement_screen_passed") is False and checked.get("refinement_screen_passed") is False
            and any(r.get("metric") == "H_metric" and r.get("status") == "failed"
                    for r in checked.get("spatial", [])), "retained Hamiltonian refinement failure required")
    require(checked.get("schema") == "nr-nonlinear-refinement-independent-audit-v1"
            and all(d.get(k) is False for d in (data, checked) for k in A["FLAGS"]), "unadmitted audit required")
    require(checked["auditor_sources"] == checked["auditor_sources_after"], "auditor identity changed")
    for name, digest in checked["auditor_sources"].items():
        require(sha(A["bounded"](ROOT, name)) == digest, "current auditor differs from verified audit")
    rows = []
    for row, n in zip(data["cases"][:3], (9, 13, 17), strict=True):
        require(row["label"] == f"spatial-{n}" and row["perturbed"] is False and row["completed"] is True,
                "three static cases required")
        arrays = []
        for name in (row["initial_array"], row["final_array"]):
            path = A["bounded"](receipt.parent, name)
            require(sha(path) == data["artifact_hashes"][name], "saved state changed")
            arrays.append(np.load(path, allow_pickle=False))
        initial, weights = A["tensor_fields"](arrays[0])
        final, _ = A["tensor_fields"](arrays[1])
        rows.append(dict(n=n, H=decomposition(initial["H_metric"], final["H_metric"], weights),
                         M=decomposition(initial["M_metric"], final["M_metric"], weights)))
    initial_orders = []
    for i in (0, 1):
        low, high = rows[i], rows[i+1]
        initial_orders.append(dict(grids=[low["n"], high["n"]],
            observed_order=float(np.log(low["H"]["initial_rms"]/high["H"]["initial_rms"])
                                 /np.log((high["n"]-1)/(low["n"]-1)))))
    return dict(analysis_completed=True, campaign_sha256=sha(receipt), independent_audit_sha256=sha(audit_path),
                original_refinement_screen_passed=data["refinement_screen_passed"], rows=rows,
                initial_H_orders=initial_orders)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh analysis output required")
    A["storage_guard"]()
    paths = (Path(__file__).resolve(), HELPER, PROTOCOL, ROOT/"scripts/tests/test_nr_nonlinear_refinement_error.py")
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    result = dict(schema="nr-nonlinear-refinement-post-hoc-error-v1", analysis_completed=False,
                  selected_after_observing_H_failure=True, regrades_experiment=False, errors=[],
                  **{key: False for key in A["FLAGS"]})
    try:
        result.update(analyze(args.receipt.resolve(), args.audit.resolve()))
        A["storage_guard"]()
    except Exception as error:
        result["analysis_completed"] = False
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_before"] = before
    result["source_after"] = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    if before != result["source_after"]:
        result["analysis_completed"] = False
        result["errors"].append("analysis source changed")
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({key: result[key] for key in ("analysis_completed", "errors")}), flush=True)
    return 0 if result["analysis_completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

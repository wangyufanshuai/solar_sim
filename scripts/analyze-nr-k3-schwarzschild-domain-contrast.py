"""Post-hoc three-domain signed-error contrasts, not a new acceptance gate."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-schwarzschild-upper-domain.py"))
R, RUN, W, B, D = (A[k] for k in ("R", "RUN", "W", "B", "D"))
require, sha256 = R["require"], R["sha256"]
from science.numerical_relativity.fo_ccz4_exterior_window import audit_fields, core_values  # noqa: E402


def contrast(original, upper, both):
    arrays = [np.asarray(a, dtype=float) for a in (original, upper, both)]
    require(arrays[0].size > 0 and all(a.shape == arrays[0].shape and np.all(np.isfinite(a)) for a in arrays),
            "three matched finite nonempty fields required")
    a, b, c = arrays
    def rms(v):
        with np.errstate(over="ignore", invalid="ignore"):
            value = float(np.sqrt(np.mean(v*v)))
        require(np.isfinite(value), "contrast norm overflow")
        return value

    original_norm = rms(a)
    return {"original_rms": original_norm, "upper_rms": rms(b), "both_rms": rms(c),
            "original_upper_field_difference_rms": rms(a-b),
            "original_both_field_difference_rms": rms(a-c),
            "upper_both_field_difference_rms": rms(b-c),
            "original_upper_difference_to_original_rms": rms(a-b)/max(original_norm, 2.e-12),
            "not_a_reflection_coefficient": True}


def selected(initial, samples, model, n):
    return {"initial": initial, "samples": {s["diagnostics"]["time"]: s for s in samples}, "model": model, "n": n}


def analyze(original, upper, both, result, budget):
    for index, (small, n) in enumerate(R["PAIRS"]):
        expanded_n = (25, 37, 49)[index]
        old = next(r for r in original["cases"] if r["order"] == 4 and r["n"] == small)
        new = next(r for r in upper["study_cases"] if r["n"] == n)
        expanded = next(r for r in both["study_cases"] if r["n"] == expanded_n)
        boxes = {
            "original": selected(W["PARENT"].parent/f"fd4-n{small}-initial.bin", old["samples"], B["seed"](small, 4), small),
            "upper": selected(Path(new["initial"]["path"]), new["samples"], R["upper_seed"](n), n),
            "both": selected(Path(expanded["initial"]["path"]), expanded["samples"], D["expanded_seed"](expanded_n), expanded_n),
        }
        initial_fields, fields = {}, {}
        for name, row in boxes.items():
            budget()
            initial = B["read"](row["initial"], row["model"])
            require(initial.to_bytes() == row["model"].to_bytes(), "analytic initial identity changed")
            result["input_checkpoint_hashes"][str(row["initial"])] = sha256(row["initial"])
            baseline, grid = audit_fields(initial)
            initial_fields[name] = {m: core_values(baseline[m], grid) for m in ("H", "ricci_error")}
            for t in (.5, 1.):
                budget()
                saved = row["samples"][t]
                path = Path(saved["path"])
                require(sha256(path) == saved["sha256"], "evolved sample identity changed")
                result["input_checkpoint_hashes"][str(path)] = saved["sha256"]
                current, other_grid = audit_fields(B["read"](path, row["model"]))
                require(grid == other_grid, "within-domain grid changed")
                for metric in ("H", "ricci_error"):
                    field = core_values(current[metric], grid)
                    fields[name, t, metric] = field
                    value = D["ERROR"]["decompose"](field, initial_fields[name][metric])
                    require(value["total_rms"] == saved["diagnostics"]["core"][metric]["l2"], "stored RMS differs")
                    result["decomposition"].append({"domain": name, "n": row["n"], "spacing": grid.spacing[0],
                        "time": t, "metric": metric, **value})
        for metric in ("H", "ricci_error"):
            result["initial_contrasts"].append({"main_n": small, "metric": metric,
                **contrast(*(initial_fields[name][metric] for name in boxes))})
            for t in (.5, 1.):
                result["evolved_contrasts"].append({"main_n": small, "upper_n": n, "both_n": expanded_n,
                    "time": t, "metric": metric, **contrast(*(fields[name, t, metric] for name in boxes))})
    require(len(result["decomposition"]) == 36 and len(result["initial_contrasts"]) == 6
            and len(result["evolved_contrasts"]) == 12 and len(result["input_checkpoint_hashes"]) == 27,
            "three-domain comparison coverage incomplete")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--audit-sha256", required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    path, audit_path, directory = args.receipt.resolve(), args.audit.resolve(), args.output_directory.resolve()
    require(all(p.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) for p in (path, audit_path, directory))
            and directory != RUN["EVIDENCE_ROOT"].resolve() and not directory.exists(), "fresh E output and declared inputs required")
    receipt = RUN["archive"](path, args.receipt_sha256)
    A["validate_final"](receipt)
    original, anchor = R["predecessors"]()
    R["parent_for"]("replay", Path(receipt["parent"]), receipt["parent_sha256"], anchor)
    require(sha256(audit_path) == args.audit_sha256, "audit SHA drift")
    checked = json.loads(audit_path.read_text(encoding="utf-8"))
    require(checked["schema"] == "nr-upper-domain-independent-process-audit-v1" and checked["audit_completed"]
            and checked["errors"] == [] and checked["receipt_sha256"] == args.receipt_sha256
            and checked["reproduced_study_passed"] == receipt["study_passed"], "completed matching audit required")
    require(sha256(ROOT/"scripts/audit-nr-k3-schwarzschild-upper-domain.py") == checked["audit_script_sha256"], "audit source drift")
    started = time.perf_counter()

    def budget():
        require(time.perf_counter()-started < 180., "180s contrast cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+8*1024**2
                and shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "contrast disk reserve reached")
        require(sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) < 8*1024**2, "contrast output cap reached")

    budget()
    directory.mkdir(parents=True)
    shutil.copyfile(__file__, directory/Path(__file__).name)
    result = {"schema": "nr-three-domain-posthoc-contrast-v1", "exploratory_posthoc": True,
        "receipt_sha256": args.receipt_sha256, "audit_sha256": args.audit_sha256,
        "original_receipt_sha256": D["BASELINE_SHA"], "both_receipt_sha256": R["ANCHOR_SHA"],
        "script_sha256": sha256(Path(__file__)), "completed": False, "errors": [],
        "input_checkpoint_hashes": {}, "decomposition": [], "initial_contrasts": [], "evolved_contrasts": [],
        "retained_original_passed": original["window_passed"], "retained_both_passed": anchor["study_passed"],
        "retained_upper_passed": receipt["study_passed"], "new_acceptance_gate": False,
        **{key: False for key in R["FLAGS"]}}
    try:
        analyze(original, receipt, anchor, result, budget)
        budget()
        require(sha256(path) == args.receipt_sha256 and sha256(audit_path) == args.audit_sha256
                and sha256(Path(__file__)) == result["script_sha256"], "analysis identity drift")
        require(all(sha256(ROOT/n) == digest for n, digest in receipt["source_after"].items()), "imported source drift")
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    RUN["new_json"](directory/"analysis.json", result)
    print(json.dumps({"completed": result["completed"], "rows": len(result["decomposition"]), "errors": result["errors"]}), flush=True)
    return 0 if result["completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

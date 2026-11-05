"""Localize retained signed errors; no new evolution or acceptance decision."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-schwarzschild-upper-domain.py"))
R, RUN, W, B, D = (A[k] for k in ("R", "RUN", "W", "B", "D"))
require, sha256 = R["require"], R["sha256"]
from science.numerical_relativity.exterior_error_localization import localize_error  # noqa: E402
from science.numerical_relativity.fo_ccz4_exterior_window import audit_fields, core_values  # noqa: E402

RECEIPT = RUN["EVIDENCE_ROOT"]/"nr-k3-upper-domain-replay-v1-20261008/receipt.json"
RECEIPT_SHA = "ac35d3e159b9c0ad603f7bde4068171f2a396a4a690799b5c0ccc42462e33da7"
AUDIT = RUN["EVIDENCE_ROOT"]/"nr-k3-upper-domain-audit-v1-20261008/audit.json"
AUDIT_SHA = "37cf4c470b614fbfa226999eaefa62b0162fa7fcc7b1c28de0c18ef2ad7813ff"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-error-localization.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(),
         "science/numerical_relativity/exterior_error_localization.py",
         "science/numerical_relativity/test_exterior_error_localization.py",
         "scripts/analyze-nr-k3-schwarzschild-error-localization.py",
         "scripts/tests/test_nr_schwarzschild_error_localization.py"}
TIMES = (.125, .25, .5, 1.)
METRICS = ("H", "ricci_error")
TRIPLES = ((17, 21, 25), (25, 31, 37), (33, 41, 49))
NAMES = ("original", "upper", "both")
PAIRS = (("upper", "original"), ("both", "upper"))


def validate_audit(value):
    require(value["schema"] == "nr-upper-domain-independent-process-audit-v1"
            and value["audit_completed"] is True and value["errors"] == []
            and value["receipt_sha256"] == RECEIPT_SHA
            and value["reproduced_study_passed"] is False, "completed matching failed-study audit required")
    expected = {"samples_recomputed": 31, "spatial_groups_recomputed": 30,
                "signed_time_metrics_recomputed": 39, "native_manifest_pairs_rechecked": 29,
                "shared_initial_pairs_recomputed": 3, "region_comparisons_recomputed": 12}
    require(all(value[k] == n for k, n in expected.items())
            and value["deterministic_replay_rechecked"] is True
            and all(value[k] is False for k in R["FLAGS"]), "audit coverage/admission changed")


def declared_times(samples):
    values = [s["diagnostics"]["time"] for s in samples]
    require(all(type(t) in (int, float) and math.isfinite(t) for t in values)
            and len(values) == len(set(values)), "unique finite saved times required")
    require(set(TIMES).issubset(values), "declared saved time missing")
    return {t: next(s for s in samples if s["diagnostics"]["time"] == t) for t in TIMES}


def selected_row(rows, n, *, original=False):
    found = [r for r in rows if r["n"] == n and (not original or r["order"] == 4)]
    require(len(found) == 1, "unique declared grid row required")
    return found[0]


def check_coverage(result):
    expected = {(name, n, t, metric) for ns in TRIPLES for name, n in zip(NAMES, ns, strict=True)
                for t in TIMES for metric in METRICS}
    actual = [(r["domain"], r["n"], r["time"], r["metric"]) for r in result["profiles"]]
    require(len(actual) == len(set(actual)) == 72 and set(actual) == expected, "72 unique profiles required")
    expected_pairs = {(ns[0], left, right, t, m) for ns in TRIPLES for left, right in PAIRS
                      for t in TIMES for m in METRICS}
    actual_pairs = [(r["original_n"], r["left_domain"], r["right_domain"], r["time"], r["metric"])
                    for r in result["pair_profiles"]]
    require(len(actual_pairs) == len(set(actual_pairs)) == 48 and set(actual_pairs) == expected_pairs,
            "48 unique signed pair profiles required")
    expected_inputs = {(name, n, t) for ns in TRIPLES for name, n in zip(NAMES, ns, strict=True)
                       for t in (0., *TIMES)}
    actual_inputs = [(r["domain"], r["n"], r["time"]) for r in result["inventory"]]
    require(len(actual_inputs) == len(set(actual_inputs)) == 45 and set(actual_inputs) == expected_inputs
            and len(result["input_checkpoint_hashes"]) == 45, "45 distinct declared checkpoints required")
    require(result["shared_initial_metric_pairs"] == 12, "all shared initial field pairs required")


class Budget:
    def __init__(self, directory):
        self.directory = directory
        self.started = time.perf_counter()

    def check(self):
        require(time.perf_counter()-self.started < 240., "240s localization cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+16*1024**2
                and shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "localization disk reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) < 16*1024**2,
                "16MiB localization output cap reached")


def analyze(original, upper, both, result, budget):
    for triple in TRIPLES:
        fields, initials = {}, {}
        for name, n in zip(NAMES, triple, strict=True):
            budget.check()
            if name == "original":
                row = selected_row(original["cases"], n, original=True)
                seed = B["seed"](n, 4)
                initial = {"path": str(W["PARENT"].parent/f"fd4-n{n}-initial.bin")}
            else:
                row = selected_row((upper if name == "upper" else both)["study_cases"], n)
                seed = R["upper_seed"](n) if name == "upper" else D["expanded_seed"](n)
                initial = row["initial"]
            saved = {0.: initial, **declared_times(row["samples"])}
            for t, sample in saved.items():
                budget.check()
                path = Path(sample["path"])
                digest = sha256(path)
                require("sha256" not in sample or digest == sample["sha256"], "checkpoint SHA drift")
                require(str(path) not in result["input_checkpoint_hashes"], "duplicate checkpoint path")
                data = B["read"](path, seed)
                require(data.header["time"] == t and data.header["dt"] == 1./256, "checkpoint time identity differs")
                if t == 0.:
                    require(data.to_bytes() == seed.to_bytes(), "analytic initial identity differs")
                values, grid = audit_fields(data)
                current = {m: core_values(values[m], grid) for m in METRICS}
                result["input_checkpoint_hashes"][str(path)] = digest
                result["inventory"].append({"domain": name, "n": n, "time": t, "path": str(path), "sha256": digest})
                if t == 0.:
                    initials[name] = current
                    continue
                for metric in METRICS:
                    value = localize_error(current[metric], initials[name][metric])
                    stored = sample["diagnostics"]["core"][metric]["l2"]
                    require(math.isclose(value["whole"]["total_rms"], stored,
                            rel_tol=128.*np.finfo(float).eps, abs_tol=np.finfo(float).tiny), "retained RMS differs")
                    result["profiles"].append({"domain": name, "n": n, "spacing": grid.spacing[0],
                                               "time": t, "metric": metric, **value})
                    fields[name, t, metric] = current[metric]
            print(json.dumps({"localized_checkpoints": len(result["inventory"]), "total": 45}), flush=True)
        for metric in METRICS:
            for name in ("upper", "both"):
                require(np.array_equal(initials["original"][metric], initials[name][metric]), "shared initial field differs")
                result["shared_initial_metric_pairs"] += 1
        for left, right in PAIRS:
            for t in TIMES:
                for metric in METRICS:
                    difference = fields[left, t, metric]-fields[right, t, metric]
                    result["pair_profiles"].append({"original_n": triple[0], "left_domain": left,
                        "right_domain": right, "time": t, "metric": metric,
                        **localize_error(difference, np.zeros_like(difference))})
    check_coverage(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve())
            and directory != RUN["EVIDENCE_ROOT"].resolve() and not directory.exists(), "fresh E evidence child required")
    budget = Budget(directory)
    budget.check()
    upper = RUN["archive"](RECEIPT, RECEIPT_SHA)
    A["validate_final"](upper)
    original, both = R["predecessors"]()
    R["parent_for"]("replay", Path(upper["parent"]), upper["parent_sha256"], both)
    require(sha256(AUDIT) == AUDIT_SHA, "audit SHA drift")
    checked = json.loads(AUDIT.read_text(encoding="utf-8"))
    validate_audit(checked)
    require(sha256(ROOT/"scripts/audit-nr-k3-schwarzschild-upper-domain.py") == checked["audit_script_sha256"],
            "audit source drift")
    names = set(upper["source_after"]) | EXTRA
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    budget.check()
    directory.mkdir(parents=True)
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    result = {"schema": "nr-retained-schwarzschild-error-localization-v1", "exploratory_posthoc": True,
        "new_acceptance_gate": False, "completed": False, "errors": [], "source_before": before,
        "receipt": str(RECEIPT), "receipt_sha256": RECEIPT_SHA, "audit_sha256": AUDIT_SHA,
        "protocol_sha256": sha256(PROTOCOL), "binary_sha256": upper["binary_sha256"],
        "retained_original_passed": original["window_passed"], "retained_upper_passed": upper["study_passed"],
        "retained_both_passed": both["study_passed"], "inventory": [], "input_checkpoint_hashes": {},
        "profiles": [], "pair_profiles": [], "shared_initial_metric_pairs": 0,
        **{k: False for k in R["FLAGS"]}}
    try:
        analyze(original, upper, both, result, budget)
        budget.check()
        require(all(sha256(Path(path)) == digest for path, digest in result["input_checkpoint_hashes"].items()), "input drift")
        require(sha256(RECEIPT) == RECEIPT_SHA and sha256(AUDIT) == AUDIT_SHA, "retained receipt drift")
        after = {n: sha256(ROOT/n) for n in sorted(names)}
        require(before == after, "source drift during localization")
        result["source_after"] = after
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {n: sha256(ROOT/n) for n in sorted(names)}
    if result["source_after"] != before and "source drift during localization" not in " ".join(result["errors"]):
        result["errors"].append("source drift during localization")
        result["completed"] = False
    result["seconds"] = time.perf_counter()-budget.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    payload_size = len(json.dumps(result, indent=2, allow_nan=False).encode("utf-8"))
    require(sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())+payload_size < 16*1024**2,
            "serialized localization output cap reached")
    RUN["new_json"](directory/"analysis.json", result)
    print(json.dumps({"completed": result["completed"], "profiles": len(result["profiles"]),
                      "pair_profiles": len(result["pair_profiles"]), "errors": result["errors"]}), flush=True)
    return 0 if result["completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

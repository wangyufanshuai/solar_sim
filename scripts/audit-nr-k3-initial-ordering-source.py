"""Read-only initial B-source audit, with independently evaluated radial fields."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import fo_ccz4_initial_ordering_source as O  # noqa: E402

L = runpy.run_path(str(ROOT / "scripts/run-nr-k3-initial-rhs-locality.py"))
F = runpy.run_path(str(ROOT / "scripts/run-nr-k3-schwarzschild-lower-domain.py"))
require, sha256, new_json = (L[k] for k in ("require", "sha256", "new_json"))
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
ANCHORS = {
    "initial": (EVIDENCE / "nr-k3-initial-rhs-locality-v1-20261008/receipt.json",
        "015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf"),
    "lower": (EVIDENCE / "nr-k3-lower-domain-replay-v1-20261008/receipt.json",
        "7d8d34bc4092f3cfd523e2e04797c77803904d7a698784873aeef3ba6fad6c52"),
    "audit": (EVIDENCE / "nr-k3-lower-domain-audit-v1-20261008/audit.json",
        "ee9afb66b19fe5a473cc600e8121ed4f6e30d915bed6bee9002f055ca16cfc54")}
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261008-initial-ordering-source.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/audit-nr-k3-initial-ordering-source.py",
    "scripts/tests/test_nr_initial_ordering_source.py",
    "science/numerical_relativity/fo_ccz4_initial_ordering_source.py",
    "science/numerical_relativity/test_fo_ccz4_initial_ordering_source.py"}
EXPECTED = {(name, n) for ns in L["TRIPLES"] for name, n in zip(L["NAMES"], ns, strict=True)}


def coverage(rows):
    keys = [(r["domain"], r["n"]) for r in rows]
    require(len(keys) == len(set(keys)) == 9 and set(keys) == EXPECTED, "nine declared unique cases required")
    for row in rows:
        if "slots" in row:
            require([s["slot"] for s in row["slots"]] == list(range(28, 37))
                and all(len(s["core_values"]) == len(s["decimal_core_values"]) == 125 for s in row["slots"]),
                "complete nine-slot/core coverage required")


def trends(rows):
    coverage(rows)
    result = []
    for name in L["NAMES"]:
        group = sorted((r for r in rows if r["domain"] == name), key=lambda r: r["n"])
        for slot in (None, *range(28, 37)):
            values = [r["core_rms"] if slot is None else r["slots"][slot-28]["rms"] for r in group]
            require(all(math.isfinite(x) and x >= 0 for x in values), "finite nonnegative norms required")
            order = None if min(values) <= O.LIMIT else [math.log(values[0]/values[1])/math.log(1.5),
                math.log(values[1]/values[2])/math.log(4./3.)]
            result.append({"domain": name, "slot": slot, "values": values, "orders": order,
                "exploratory_not_admission": True})
    return result


def anchors():
    loaded = {k: F["verified_json"](p, h) for k, (p, h) in ANCHORS.items()}
    initial, lower, audit = (loaded[k] for k in ("initial", "lower", "audit"))
    require(initial["schema"] == "nr-schwarzschild-initial-rhs-locality-v1"
        and initial["completed"] and initial["operator_consistency_passed"] and not initial["errors"], "completed initial RHS required")
    L["complete_coverage"](initial)
    F["validate_stage"](lower, "replay")
    require(lower["study_completed"] and not lower["study_passed"] and audit["audit_completed"]
        and not audit["study_passed"] and not audit["errors"] and audit["receipt_sha256"] == ANCHORS["lower"][1],
        "reproduced failed lower study required")
    for value, key in ((initial, "initial"), (lower, "lower")):
        F["verify_files"](value, ANCHORS[key][0])
        require(all(value[k] is False for k in F["FLAGS"]), "admission changed")
    require(sha256(Path(initial["probe_binary"])) == initial["probe_sha256"]
        and sha256(ROOT / "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp") == initial["bound_solver_source_sha256"],
        "bound native probe/source changed")
    coverage(initial["cases"])
    inputs = {}
    for row in initial["cases"]:
        for key in ("input", "rhs"):
            require(row[key] not in inputs, "distinct retained state/RHS files required")
            inputs[row[key]] = row[key + "_sha256"]
    require(len(inputs) == 18, "18 distinct retained files required")
    return initial, lower, inputs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve()
        and not directory.exists(), "fresh E evidence child required")
    started = time.perf_counter()
    def guard():
        require(time.perf_counter()-started < 600., "600s analysis cap reached")
        require(shutil.disk_usage(ROOT).free >= L["E_RESERVE"] + 8*1024**2
            and shutil.disk_usage("C:/").free >= L["C_RESERVE"], "analysis disk reserve reached")
        used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
        require(used + 8*1024**2 <= 16*1024**2, "16MiB analysis output cap reached")
    guard()
    initial, lower, inputs = anchors()
    for name, digest in inputs.items():
        require(sha256(Path(name)) == digest, "raw input changed")
    names = set(lower["source_before"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    require(len(before) == 235, "frozen source coverage changed")
    guard()
    directory.mkdir()
    result = {"schema": "nr-initial-ordering-source-v1", "completed": False, "source_contract_passed": False,
        "errors": [], "cases": [], "evolution_steps": 0, "source_before": before,
        "input_hashes": inputs, "anchor_hashes": {str(p): h for p, h in ANCHORS.values()},
        "protocol_sha256": sha256(PROTOCOL), "python": sys.version, "numpy": np.__version__, "platform": platform.platform(),
        "retained_failures": {k: False for k in ("original", "upper", "both", "lower")},
        **{k: False for k in F["FLAGS"]}}
    try:
        for name, digest in before.items():
            target = directory / "source-snapshot" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "snapshot changed")
        decimal = {den: O.decimal_core_source(den) for den in (8, 12, 16)}
        result["decimal_precision_error"] = {str(den): float(np.max(abs(q-O.decimal_core_source(den, precision=80))))
            for den, q in decimal.items()}
        require(all(v == 0. for v in result["decimal_precision_error"].values()), "60/80 digit float64 projection differs")
        for row in initial["cases"]:
            guard()
            data = L["B"]["read"](Path(row["input"]), L["seed"](row["domain"], row["n"]))
            raw_rhs = L["PROBE"]["read_rhs"](Path(row["rhs"]).read_bytes(), row["n"])
            den = (row["original_n"]-1)//2
            checked = O.inspect_initial(data, raw_rhs, decimal[den])
            result["cases"].append({"domain": row["domain"], "n": row["n"], "original_n": row["original_n"], **checked})
            print(json.dumps({"case": [row["domain"], row["n"]], "source_contract_passed": checked["source_contract_passed"]}), flush=True)
        result["trends"] = trends(result["cases"])
        guard()
        require(all(sha256(Path(p)) == h for p, h in inputs.items()), "raw input changed during audit")
        require(all(sha256(p) == h for p, h in ANCHORS.values()), "anchor changed during audit")
        result["completed"] = True
        result["source_contract_passed"] = all(r["source_contract_passed"] for r in result["cases"])
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
    if result["source_after"] != before:
        result["errors"].append("source changed during audit")
    result["completed"] &= not result["errors"]
    result["source_contract_passed"] &= not result["errors"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.perf_counter()-started
    guard()
    require(len(json.dumps(result, allow_nan=False).encode("utf-8")) < 8*1024**2, "receipt headroom exceeded")
    new_json(directory / "receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "source_contract_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["source_contract_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

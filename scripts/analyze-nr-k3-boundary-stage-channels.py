"""Predict six retained first-k2 boundary differences without evolving states."""
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
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import fo_ccz4_boundary_stage_channels as C  # noqa: E402
from science.numerical_relativity import schwarzschild_rhs_locality as LC  # noqa: E402
from science.numerical_relativity import rk_stage_locality as ST  # noqa: E402

A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-initial-ordering-source.py"))
P, F = A["L"], A["F"]
S = runpy.run_path(str(ROOT/"scripts/run-nr-k3-rk-stage-locality.py"))
require, sha256, new_json = (P[k] for k in ("require", "sha256", "new_json"))
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
ANCHORS = {
    "ordering": (EVIDENCE/"nr-k3-initial-ordering-source-replay-v1-20261008/receipt.json",
        "c1ab418f3afa736704079572bd9ed32ef9d0313e4ec5855aff1c93322e5d9776"),
    "stages": (EVIDENCE/"nr-k3-rk-stage-locality-v1-20261008/receipt.json",
        "cd1872626f3f572bf1f2a41b528794510ec08a21e7180c606a2cc3b61eedb0e1")}
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-boundary-stage-channels.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/analyze-nr-k3-boundary-stage-channels.py",
    "scripts/tests/test_nr_boundary_stage_channels.py",
    "science/numerical_relativity/fo_ccz4_boundary_stage_channels.py",
    "science/numerical_relativity/test_fo_ccz4_boundary_stage_channels.py",
    "science/numerical_relativity/RESULTS-20261008-initial-ordering-source.md"}
COMPARISONS = (("upper", "original"), ("both", "upper"))
VALUE_NAMES = ("observed", "predicted", "residual", "B_only_residual", "source_a", "source_K", "source_Theta", "source_B")


def coverage(rows):
    expected = {(n, left, right) for n in (17, 25, 33) for left, right in COMPARISONS}
    actual = [(r["original_n"], r["left_domain"], r["right_domain"]) for r in rows]
    require(len(actual) == len(set(actual)) == 6 and set(actual) == expected, "six declared unique pairs required")
    for row in rows:
        require(row["active_node_count"] == (row["original_n"]-4)**3 and row["core_node_count"] == 125,
                "whole active cube and 125-node core required")
        require(row["new_evolution_steps"] == 0 and row["physical_validation"] is False
                and row["causal_speed_measured"] is False, "diagnostic scope changed")
        require(set(row["signed_core"]) == set(VALUE_NAMES), "complete signed channel cores required")
        for name in VALUE_NAMES:
            require([v["slot"] for v in row[name]["by_slot"]] == list(range(58))
                    and set(row[name]["by_output_family"]) == set(C.OUTPUTS), "58 slots and output families required")
            require(len(row["signed_core"][name]["values"]) == 58
                    and all(len(v) == 125 for v in row["signed_core"][name]["values"]), "58x125 core required")


def fresh_output(path):
    directory = Path(path).resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve()
            and not directory.exists(), "fresh E evidence child required")
    return directory


def validate_ordering(value):
    require(value["schema"] == "nr-initial-ordering-source-v1" and value["completed"] is True
            and value["source_contract_passed"] is True and value["errors"] == []
            and value["evolution_steps"] == 0 and value["source_before"] == value["source_after"],
            "completed unchanged initial source audit required")
    require(all(value[k] is False for k in F["FLAGS"])
            and value["retained_failures"] == {k: False for k in ("original", "upper", "both", "lower")},
            "retained failure or admission changed")
    A["coverage"](value["cases"])


def anchors():
    initial, lower, _ = A["anchors"]()
    ordering, stages = (F["verified_json"](*ANCHORS[k]) for k in ("ordering", "stages"))
    validate_ordering(ordering)
    require(stages["schema"] == "nr-schwarzschild-rk-stage-locality-v1" and stages["completed"] is True
            and stages["stage_consistency_passed"] is True and stages["errors"] == []
            and stages["source_before"] == stages["source_after"], "complete unchanged stage audit required")
    S["coverage"](stages)
    for name, value in (("ordering", ordering), ("stages", stages)):
        F["verify_files"](value, ANCHORS[name][0])
        require(all(value[k] is False for k in F["FLAGS"]), "admission changed")
    require(sha256(Path(stages["probe_binary"])) == stages["probe_sha256"]
            and stages["bound_solver_source_sha256"] == initial["bound_solver_source_sha256"], "native provenance changed")
    old = {(r["domain"], r["n"]): r for r in initial["cases"]}
    inputs = {}
    for row in stages["cases"]:
        oldrow = old[row["domain"], row["n"]]
        require(row["input"] == oldrow["input"] and row["input_sha256"] == oldrow["input_sha256"], "initial identity differs")
        for key in ("input", "trace"):
            require(row[key] not in inputs, "distinct retained input/trace required")
            inputs[row[key]] = row[key+"_sha256"]
    require(len(inputs) == 18 and lower["study_passed"] is False, "18 retained files and failed study required")
    return ordering, stages, inputs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    directory = fresh_output(args.output_directory)
    started = time.perf_counter()
    def guard():
        require(time.perf_counter()-started < 600., "600s analysis cap reached")
        require(shutil.disk_usage(ROOT).free >= P["E_RESERVE"]+16*1024**2
                and shutil.disk_usage("C:/").free >= P["C_RESERVE"], "analysis disk reserve reached")
        used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
        require(used+16*1024**2 <= 32*1024**2, "32MiB analysis output cap reached")
    guard()
    ordering, stages, inputs = anchors()
    for p, digest in inputs.items():
        require(sha256(Path(p)) == digest, "retained trace/input changed")
    names = set(ordering["source_after"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    require(len(before) == 241, "frozen source coverage changed")
    guard()
    directory.mkdir()
    result = {"schema": "nr-boundary-stage-channels-v1", "completed": False, "prediction_passed": False,
        "errors": [], "pairs": [], "source_before": before, "input_hashes": inputs,
        "anchor_hashes": {str(p): h for p, h in ANCHORS.values()}, "protocol_sha256": sha256(PROTOCOL),
        "retained_failures": ordering["retained_failures"], "python": sys.version,
        "numpy": np.__version__, "platform": platform.platform(), "new_evolution_steps": 0,
        **{k: False for k in F["FLAGS"]}}
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "snapshot changed")
        index = {(r["domain"], r["n"]): r for r in stages["cases"]}
        for ns in P["TRIPLES"]:
            common = {}
            for name, n in zip(P["NAMES"], ns, strict=True):
                guard()
                row = index[name, n]
                data = P["B"]["read"](Path(row["input"]), P["seed"](name, n))
                require(data.header["time"] == 0. and data.header["step"] == 0
                        and data.header["dt"] == 1./256., "frozen initial stage settings required")
                grid = data.domain.grid(n, 4)
                trace = ST.read_trace(row["trace"], n)
                common[name] = {"q0": LC.common_cube(data.slots, grid, ns[0])}
                for label, block in (("k1", 0), ("s2", 1), ("k2", 2)):
                    common[name][label] = LC.common_cube(trace[block], grid, ns[0])
                del trace, data
            for left, right in COMPARISONS:
                guard()
                checked = C.inspect_pair(common[left], common[right])
                result["pairs"].append({"original_n": ns[0], "left_domain": left, "right_domain": right, **checked})
                print(json.dumps({"pair": [ns[0], left, right], "prediction_passed": checked["prediction_passed"],
                    "residual_max": checked["residual"]["max_abs"], "B_only_status": checked["B_only_status"]}), flush=True)
            del common
        coverage(result["pairs"])
        guard()
        require(all(sha256(Path(p)) == h for p, h in inputs.items()), "inputs changed during analysis")
        require(all(sha256(p) == h for p, h in ANCHORS.values()), "anchor changed during analysis")
        result["completed"] = True
        result["prediction_passed"] = all(r["prediction_passed"] for r in result["pairs"])
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
    if result["source_after"] != before:
        result["errors"].append("source changed during analysis")
    result["completed"] &= not result["errors"]
    result["prediction_passed"] &= not result["errors"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.perf_counter()-started
    guard()
    require(len(json.dumps(result, allow_nan=False).encode("utf-8")) < 16*1024**2, "receipt headroom exceeded")
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "prediction_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["prediction_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

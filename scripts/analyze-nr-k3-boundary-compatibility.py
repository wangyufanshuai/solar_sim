"""Final fixed-halo mechanism batch; no solver changes or time evolution."""
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
from science.numerical_relativity import fo_ccz4_boundary_compatibility as Q  # noqa: E402
from science.numerical_relativity.fo_ccz4_initial_ordering_source import core_indices  # noqa: E402

PARENT = runpy.run_path(str(ROOT/"scripts/analyze-nr-k3-boundary-stage-channels.py"))
P, F, LC, ST = (PARENT[k] for k in ("P", "F", "LC", "ST"))
require, sha256, new_json = (PARENT[k] for k in ("require", "sha256", "new_json"))
EVIDENCE = PARENT["EVIDENCE"]
ANCHOR = EVIDENCE/"nr-k3-boundary-stage-channels-v1-20261008/receipt.json"
ANCHOR_SHA = "79aded076b8b6638f09fc23ae900a5b9dbd380cd68252274c297f379a4fb0172"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-boundary-compatibility.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/analyze-nr-k3-boundary-compatibility.py",
    "scripts/tests/test_nr_boundary_compatibility.py",
    "science/numerical_relativity/fo_ccz4_boundary_compatibility.py",
    "science/numerical_relativity/test_fo_ccz4_boundary_compatibility.py",
    "science/numerical_relativity/RESULTS-20261008-boundary-stage-channels.md"}
COMPARISONS = PARENT["COMPARISONS"]
VALUES = ("observed", "predicted", "residual", "shell", "coordinate", "shell_only_residual", "additivity_error")


def validate_parent(value):
    require(value["schema"] == "nr-boundary-stage-channels-v1" and value["completed"] is True
            and value["prediction_passed"] is True and value["errors"] == []
            and value["source_before"] == value["source_after"] and value["new_evolution_steps"] == 0,
            "completed unchanged stage-channel parent required")
    require(all(value[k] is False for k in F["FLAGS"])
            and value["retained_failures"] == {k: False for k in ("original", "upper", "both", "lower")},
            "parent admissions or retained failures changed")
    PARENT["coverage"](value["pairs"])


def coverage(cases, pairs):
    expected = {(domain, n) for ns in P["TRIPLES"] for domain, n in zip(P["NAMES"], ns, strict=True)}
    actual = [(row["domain"], row["n"]) for row in cases]
    require(len(actual) == len(set(actual)) == 9 and set(actual) == expected, "nine unique source cases required")
    expected_pairs = {(n, a, b) for n in (17, 25, 33) for a, b in COMPARISONS}
    actual_pairs = [(row["original_n"], row["left_domain"], row["right_domain"]) for row in pairs]
    require(len(actual_pairs) == len(set(actual_pairs)) == 6 and set(actual_pairs) == expected_pairs,
            "six unique stage pairs required")
    for row in cases+pairs:
        n = row.get("original_n", row.get("n"))
        require(row["active_node_count"] == (n-4)**3 and row["core_node_count"] == 125
                and row["new_evolution_steps"] == 0 and row["physical_validation"] is False,
                "coverage or scope changed")
    for row in cases:
        require(len(row["core_values"]) == len(row["decimal_core_values"]) == 125, "all125 source core values required")
    for row in pairs:
        require(set(row["signed_core"]) == set(VALUES)
                and all(len(v) == 3 and all(len(a) == 125 for a in v) for v in row["signed_core"].values()),
                "all3 A outputs at125 nodes required")


def crop_scalar(value, grid, n):
    coordinates = np.linspace(1., 3., n)
    indices = [LC.indices(grid, coordinates, axis) for axis in range(3)]
    require(all(np.array_equal(np.diff(v), np.ones(n-1, dtype=int)) for v in indices), "contiguous matched nodes required")
    return value[tuple(slice(int(v[0]), int(v[-1])+1) for v in indices)].copy()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = PARENT["fresh_output"](args.output_directory)
    started = time.perf_counter()
    def guard():
        require(time.perf_counter()-started < 600., "600s compatibility cap reached")
        require(shutil.disk_usage(ROOT).free >= P["E_RESERVE"]+16*1024**2
                and shutil.disk_usage("C:/").free >= P["C_RESERVE"], "compatibility disk reserve reached")
        used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
        require(used+16*1024**2 <= 32*1024**2, "32MiB output cap reached")
    guard()
    parent = F["verified_json"](ANCHOR, ANCHOR_SHA)
    validate_parent(parent)
    F["verify_files"](parent, ANCHOR)
    _, stages, inputs = PARENT["anchors"]()
    require(inputs == parent["input_hashes"], "same18 retained input identities required")
    require(all(sha256(Path(p)) == h for p, h in inputs.items()), "retained input changed")
    names = set(parent["source_after"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    require(len(before) == 247, "247 frozen sources required")
    guard()
    directory.mkdir()
    result = {"schema": "nr-boundary-compatibility-v1", "completed": False, "prediction_passed": False,
        "errors": [], "cases": [], "pairs": [], "source_before": before, "input_hashes": inputs,
        "anchor_hashes": {str(ANCHOR): ANCHOR_SHA}, "protocol_sha256": sha256(PROTOCOL),
        "retained_failures": parent["retained_failures"], "python": sys.version,
        "numpy": np.__version__, "platform": platform.platform(), "new_evolution_steps": 0,
        "diagnostic_batch_budget_exhausted": True, **{k: False for k in F["FLAGS"]}}
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "snapshot changed")
        index = {(row["domain"], row["n"]): row for row in stages["cases"]}
        for ns in P["TRIPLES"]:
            common = {}
            decimal = Q.decimal_core_source((ns[0]-1)//2)
            for name, n in zip(P["NAMES"], ns, strict=True):
                guard()
                row = index[name, n]
                data = P["B"]["read"](Path(row["input"]), P["seed"](name, n))
                require(data.header["time"] == 0. and data.header["step"] == 0
                        and data.header["dt"] == 1./256. and data.header["spatial_order"] == 4
                        and data.domain.mass == 1. and data.tau_inverse == 1.
                        and data.profile.shift_scale == 3. and data.profile.ordering_scale == .2,
                        "frozen initial gauge/grid/control required")
                grid = data.domain.grid(n, 4)
                trace = ST.read_trace(row["trace"], n)
                xyz = np.stack(grid.coordinates, axis=-1)
                checked, raw, mask = Q.inspect_initial(data.slots, trace[0], xyz,
                    grid.spacing[0], core_indices(grid), decimal)
                result["cases"].append({"domain": name, "n": n, **checked})
                state = {"q0": LC.common_cube(data.slots, grid, ns[0])}
                for label, block in (("k1", 0), ("s2", 1), ("k2", 2)):
                    state[label] = LC.common_cube(trace[block], grid, ns[0])
                common[name] = {"state": state, "raw_Qdot": crop_scalar(raw, grid, ns[0]),
                    "active_mask": crop_scalar(mask, grid, ns[0])}
                print(json.dumps({"case": [name, n], "source_prediction_passed": checked["source_prediction_passed"],
                    "native_Qdot_error": checked["errors"]["native_Qdot"]}), flush=True)
                del data, trace, xyz, raw, mask
            for left, right in COMPARISONS:
                guard()
                checked = Q.inspect_pair(common[left], common[right])
                result["pairs"].append({"original_n": ns[0], "left_domain": left, "right_domain": right, **checked})
                print(json.dumps({"pair": [ns[0], left, right], "prediction_passed": checked["prediction_passed"],
                    "interpretation": checked["interpretation"], "residual": checked["residual"]["max_abs"]}), flush=True)
            del common
        coverage(result["cases"], result["pairs"])
        guard()
        require(all(sha256(Path(p)) == h for p, h in inputs.items()), "inputs changed during analysis")
        require(sha256(ANCHOR) == ANCHOR_SHA, "parent changed during analysis")
        result["completed"] = True
        result["prediction_passed"] = all(r["source_prediction_passed"] for r in result["cases"])
        result["prediction_passed"] &= all(r["prediction_passed"] for r in result["pairs"])
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

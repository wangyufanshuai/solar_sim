"""Matched-spacing domain study; immutable solver and retained failed baseline."""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path
import platform
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ERROR = runpy.run_path(str(ROOT/"scripts/analyze-nr-k3-schwarzschild-window-error.py"))
RUN, W, B = (ERROR[k] for k in ("RUN", "W", "B"))
require, sha256, new_json = (RUN[k] for k in ("require", "sha256", "new_json"))
DOMAIN = B["SchwarzschildDomain"](.5, 3.5)
BASELINE = RUN["EVIDENCE_ROOT"]/"nr-k3-schwarzschild-replay-e-storage-v1-20261008/receipt.json"
BASELINE_SHA = "2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2"
AUDIT = RUN["EVIDENCE_ROOT"]/"nr-k3-schwarzschild-window-audit-e-storage-v1-20261008/audit.json"
AUDIT_SHA = "6993655b9d71015cef1d61d165f9c5f3c93abb47e7601b473aa65bcf9a99ed35"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-schwarzschild-domain-matrix.md"
STAGES = ("n37", "n49", "dt49", "replay")
CAPS = {"n37": (1400., 320, 32, 180.), "n49": (2400., 640, 64, 180.),
        "dt49": (3000., 384, 64, 600.), "replay": (800., 32, 8, 600.)}
TIMES = tuple(i/8. for i in range(1, 9))
SCHEMA = "nr-k3-schwarzschild-matched-domain-v1"
EXTRA = {"scripts/"+s for s in (
    "audit-nr-k3-schwarzschild-window-completion.py", "analyze-nr-k3-schwarzschild-window-error.py",
    "tests/test_nr_schwarzschild_window_audit.py", "tests/test_nr_schwarzschild_window_error.py",
    "run-nr-k3-schwarzschild-domain-matrix.py", "tests/test_nr_schwarzschild_domain_matrix.py")}
FLAGS = ERROR["AUDIT"]["FLAGS"]


def expanded_seed(n, dt=1./256):
    require(n in (25, 37, 49), "declared expanded grid required")
    return B["checkpoint_from_state"](B["initial_state"](n, 4, DOMAIN), profile=B["PROFILE"],
        dt=dt, scenario=2, amplitude=0., tau_inverse=1., domain=DOMAIN)


def shared_initial(base, expanded):
    n, large = base.header["points"], expanded.header["points"]
    require((n, large) in ((17, 25), (25, 37), (33, 49)), "matched grid pair required")
    grid, other = base.domain.grid(n, 4), expanded.domain.grid(large, 4)
    require(base.domain == B["DOMAIN"] and expanded.domain == DOMAIN and grid.spacing == other.spacing,
            "matched domains/spacing required")
    start = (large-1)//6
    subset = (slice(start, start+n),)*3
    coordinates = max(float(np.max(np.abs(a-b[subset]))) for a, b in zip(grid.coordinates, other.coordinates, strict=True))
    left = np.asarray(base.slots, dtype="<f8")
    right = np.ascontiguousarray(np.asarray(expanded.slots)[:, start:start+n, start:start+n, start:start+n], dtype="<f8")
    maximum = float(np.max(np.abs(left-right)))
    require(coordinates <= 2.e-15 and maximum <= 2.e-14, "shared initial fields outside declared rounding bounds")
    return {"main_n": n, "expanded_n": large, "spacing": list(grid.spacing),
            "coordinate_linf": coordinates, "state_linf": maximum, "byte_equal": left.tobytes() == right.tobytes()}


def baseline():
    value = RUN["archive"](BASELINE, BASELINE_SHA)
    RUN["lineage"]("replay", Path(value["parent"]), value["parent_sha256"])
    require(value["completed"] and not value["window_passed"] and not value["errors"], "retained failure changed")
    require(sha256(AUDIT) == AUDIT_SHA, "baseline audit drift")
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and not audit["errors"] and audit["receipt_sha256"] == BASELINE_SHA
            and not audit["reproduced_window_passed"], "baseline audit incomplete")
    require(sha256(ROOT/"scripts/audit-nr-k3-schwarzschild-window-completion.py") == audit["audit_script_sha256"],
            "audit source drift")
    return value


def parent_for(stage, path, digest, original):
    if stage == "n37":
        require(path is None and digest is None, "first stage uses fixed baseline")
        return original, BASELINE, BASELINE_SHA, 0.
    require(path is not None and digest is not None, "explicit preceding receipt and SHA required")
    current, expected, result = path.resolve(), digest, None
    for i in range(STAGES.index(stage)-1, -1, -1):
        require(current.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "parent outside declared E evidence")
        value = RUN["archive"](current, expected)
        require(value["schema"] == SCHEMA and value["stage"] == STAGES[i] and value["stage_completed"]
                and not value["errors"] and value["protocol_sha256"] == sha256(PROTOCOL), "incomplete/drifted parent")
        if result is None:
            result = value
        current, expected = Path(value["parent"]), value["parent_sha256"]
    require(current == BASELINE and expected == BASELINE_SHA, "baseline lineage mismatch")
    return result, path.resolve(), digest, result["study_chain_seconds"]


def initial_collections(original):
    saved = copy.deepcopy(original["expanded_samples"])
    saved += [copy.deepcopy(s) for s in original["intermediate_samples"] if Path(s["path"]).name.startswith("expanded-n25-")]
    saved.sort(key=lambda s: s["diagnostics"]["time"])
    require([s["diagnostics"]["time"] for s in saved] == list(TIMES), "retained N25 times incomplete")
    for s in saved:
        s["retained"] = True
    path = Path(original["parent"]).parent/"expanded-initial.bin"
    data = B["read"](path, expanded_seed(25))
    comparison = shared_initial(B["read"](W["PARENT"].parent/"fd4-n17-initial.bin", B["seed"](17, 4)), data)
    return {"study_cases": [{"n": 25, "initial": W["sample"](data, path, retained=True), "samples": saved}],
            "shared_initial": [comparison], "time_samples": [], "time_controls": [], "region_comparisons": []}


def all_samples(value):
    return [s for r in value["study_cases"] for s in [r["initial"], *r["samples"]]]+value["time_samples"]


class Runner(RUN["Runner"]):
    def budget(self):
        cap, size, headroom, single = CAPS[self.stage]
        elapsed = time.perf_counter()-self.started
        remaining = min(cap-elapsed, 7200.-self.prior_seconds-elapsed)
        require(remaining > 0., "stage/7200s study cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+headroom*1024**2, "E reserve plus next-output headroom reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+headroom*1024**2
                <= size*1024**2, "stage output cap reached")
        return min(single, remaining)


def primary(value, n, t):
    row = next(r for r in value["study_cases"] if r["n"] == n)
    saved = next(s for s in row["samples"] if s["diagnostics"]["time"] == t)
    path = Path(saved["path"])
    require(sha256(path) == saved["sha256"], "retained checkpoint changed")
    data = B["read"](path, expanded_seed(n))
    require(W["sample"](data, path, retained=saved["retained"]) == saved, "retained diagnostics changed")
    return data, path


def assess_spatial(value):
    rows = {r["n"]: r for r in value["study_cases"]}
    require(set(rows) == {25, 37, 49} and len(value["study_cases"]) == 3, "three distinct expanded grids required")
    require(all([s["diagnostics"]["time"] for s in r["samples"]] == list(TIMES) for r in rows.values()),
            "eight times per grid required")
    comparisons = {(c["expanded_n"], c["time"]): c for c in value["region_comparisons"]}
    require(len(value["region_comparisons"]) == 12 and set(comparisons) == {(n, t) for n in rows for t in W["TIMES"]},
            "twelve matched region comparisons required")
    groups, differences = [], []
    for t in (.25, .5, 1.):
        index = TIMES.index(t)
        for metric in W["PRIMARY"]:
            norms = [rows[n]["samples"][index]["diagnostics"]["core"][metric]["l2"] for n in (25, 37, 49)]
            delta = [comparisons[n, t]["metrics"][metric]["rms_difference"] for n in (25, 37, 49)]
            groups.append({"time": t, "metric": metric, **B["refinement"](norms, 4)})
            differences.append({"time": t, "metric": metric, **B["refinement"](delta, 4)})
    return {"expanded_groups": groups, "region_difference_groups": differences,
            "expanded_spatial_passed": all(g["passed"] for g in groups),
            "region_difference_spatial_passed": all(g["passed"] for g in differences)}


def region_study(original, receipt):
    values = []
    for n, small in ((25, 17), (37, 25), (49, 33)):
        base_row = next(r for r in original["cases"] if r["order"] == 4 and r["n"] == small)
        for saved in base_row["samples"]:
            t = saved["diagnostics"]["time"]
            data = B["read"](Path(saved["path"]), B["seed"](small, 4))
            other, _ = primary(receipt, n, t)
            values.append({"main_n": small, "expanded_n": n, **W["boundary_location_difference"](data, other)})
    receipt["region_comparisons"] = values
    receipt["spatial_assessment"] = assess_spatial(receipt)


def run_grid(runner, original, receipt, n):
    data = expanded_seed(n)
    small = 2*(n-1)//3+1
    old = B["read"](W["PARENT"].parent/f"fd4-n{small}-initial.bin", B["seed"](small, 4))
    receipt["shared_initial"].append(shared_initial(old, data))
    path = runner.directory/f"expanded-n{n}-initial.bin"
    runner.budget()
    B["encode"](path, data)
    row = {"n": n, "initial": W["sample"](data, path), "samples": []}
    receipt["study_cases"].append(row)
    for t in TIMES:
        data, path, _ = runner.native(Path(receipt["binary"]), f"expanded-n{n}-t{t:g}", data, path, 32)
        require(data.header["time"] == t, "grid target mismatch")
        row["samples"].append(W["sample"](data, path))
    receipt["stage_passed"] = all(s["bounded_window"] for s in all_samples(receipt))
    if n == 49:
        region_study(original, receipt)
        receipt["stage_passed"] &= receipt["spatial_assessment"]["expanded_spatial_passed"]
        receipt["stage_passed"] &= receipt["spatial_assessment"]["region_difference_spatial_passed"]


def run_time(runner, receipt):
    data = expanded_seed(49, 1./512)
    row = next(r for r in receipt["study_cases"] if r["n"] == 49)
    original = B["read"](Path(row["initial"]["path"]), expanded_seed(49))
    require(np.asarray(data.slots).tobytes() == np.asarray(original.slots).tobytes(), "time-control initial bytes differ")
    path = runner.directory/"dt49-initial.bin"
    runner.budget()
    B["encode"](path, data)
    receipt["time_initial"] = {"path": str(path), "sha256": sha256(path), "state_byte_equal": True}
    for t in (.25, .5, .75, 1.):
        data, path, _ = runner.native(Path(receipt["binary"]), f"dt-expanded-n49-t{t:g}", data, path, 128)
        require(data.header["time"] == t, "time-control target mismatch")
        receipt["time_samples"].append(W["sample"](data, path))
        if t != .75:
            base, _ = primary(receipt, 49, t)
            receipt["time_controls"].append(W["timestep_difference"](base, data))
    receipt["stage_passed"] = all(s["bounded_window"] for s in all_samples(receipt)) and all(c["passed"] for c in receipt["time_controls"])


def final_assessment(receipt):
    assessment = assess_spatial(receipt)
    require(receipt["spatial_assessment"] == assessment, "spatial assessment drift")
    require([s["diagnostics"]["time"] for s in receipt["time_samples"]] == [.25, .5, .75, 1.]
            and [c["time"] for c in receipt["time_controls"]] == [.25, .5, 1.], "time coverage incomplete")
    require(len(all_samples(receipt)) == 31 and len({s["path"] for s in all_samples(receipt)}) == 31,
            "31 distinct diagnostic samples required")
    require([r["expanded_n"] for r in receipt["shared_initial"]] == [25, 37, 49], "initial matching matrix incomplete")
    for shared in receipt["shared_initial"]:
        require(all(math.isfinite(shared[k]) and 0. <= shared[k] <= limit
                    for k, limit in (("coordinate_linf", 2.e-15), ("state_linf", 2.e-14))),
                "shared initial rounding bound changed")
    require(receipt.get("deterministic_replay") is True and receipt["time_initial"]["state_byte_equal"], "replay/initial identity incomplete")
    for control in receipt["time_controls"]:
        require(set(control["metrics"]) == set(W["METRICS"]), "all thirteen signed time fields required")
        for metric in control["metrics"].values():
            require(all(math.isfinite(metric[k]) and metric[k] >= 0.
                        for k in ("rms_difference", "coarse_norm", "fine_norm", "ratio")), "invalid time fields")
            ratio = metric["rms_difference"]/max(metric["coarse_norm"], 2.e-12)
            passed = max(metric["coarse_norm"], metric["fine_norm"]) <= 2.e-12 or ratio <= .05
            require(metric["ratio"] == ratio and metric["passed"] == passed, "time verdict drift")
        require(control["passed"] == all(x["passed"] for x in control["metrics"].values()), "time summary drift")
    bounded = all(s["bounded_window"] for s in all_samples(receipt))
    return {"bounded_study": bounded, "study_passed": bounded and assessment["expanded_spatial_passed"]
            and assessment["region_difference_spatial_passed"] and all(c["passed"] for c in receipt["time_controls"])}


def run_replay(runner, original, receipt):
    data = expanded_seed(25)
    initial = Path(original["parent"]).parent/"expanded-initial.bin"
    direct = runner.native(Path(receipt["binary"]), "expanded-n25-serial-t1", data, initial, 256, threads=1)
    _, path = primary(receipt, 25, 1.)
    require(direct[1].read_bytes() == path.read_bytes() and direct[2].read_bytes() == path.with_suffix(".json").read_bytes(),
            "expanded serial/staged replay mismatch")
    receipt["deterministic_replay"] = True
    receipt["replay_paths"] = {"direct": str(direct[1]), "staged": str(path)}
    receipt.update(final_assessment(receipt))
    receipt["study_completed"] = True
    receipt["stage_passed"] = receipt["study_passed"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, choices=STAGES)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--parent-receipt", type=Path)
    parser.add_argument("--parent-sha256")
    args = parser.parse_args()
    original = baseline()
    parent, parent_path, parent_sha, prior = parent_for(args.stage, args.parent_receipt, args.parent_sha256, original)
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh declared E child required")
    names = set(original["source_after"]) | EXTRA
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    receipt = {"schema": SCHEMA, "stage": args.stage, "parent": str(parent_path), "parent_sha256": parent_sha,
        "baseline": str(BASELINE), "baseline_sha256": BASELINE_SHA, "retained_window_passed": False,
        "c_reserve_bytes": RUN["C_RESERVE"], "e_reserve_bytes": RUN["E_RESERVE"], "stage_caps": CAPS[args.stage],
        "protocol_sha256": sha256(PROTOCOL), "source_before": before,
        "binary": original["binary"], "binary_sha256": original["binary_sha256"], "python": platform.python_version(),
        "numpy": np.__version__, "stage_completed": False, "stage_passed": False,
        "study_completed": False, "study_passed": False, "commands": [], "errors": [], **{k: False for k in FLAGS}}
    runner = Runner(directory, receipt, args.stage, prior)
    runner.budget()
    directory.mkdir(parents=True)
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    try:
        if args.stage == "n37":
            receipt.update(initial_collections(original))
        else:
            for key in ("study_cases", "shared_initial", "time_samples", "time_controls", "region_comparisons",
                        "spatial_assessment", "time_initial"):
                if key in parent:
                    receipt[key] = copy.deepcopy(parent[key])
            for saved in all_samples(receipt):
                saved["retained"] = True
        if args.stage in ("n37", "n49"):
            run_grid(runner, original, receipt, int(args.stage[1:]))
        elif args.stage == "dt49":
            run_time(runner, receipt)
        else:
            run_replay(runner, original, receipt)
        runner.budget()
        receipt["stage_completed"] = True
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
        receipt["stage_completed"] = receipt["stage_passed"] = receipt["study_completed"] = receipt["study_passed"] = False
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["study_chain_seconds"] = prior+receipt["seconds"]
        receipt["source_after"] = {n: sha256(ROOT/n) for n in sorted(names)}
        if before != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]:
            receipt["errors"].append("source/protocol changed during execution")
            receipt["stage_completed"] = receipt["stage_passed"] = receipt["study_completed"] = receipt["study_passed"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({k: receipt[k] for k in ("stage", "stage_completed", "study_completed", "stage_passed", "study_passed", "errors")}), flush=True)
    return 0 if receipt["stage_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

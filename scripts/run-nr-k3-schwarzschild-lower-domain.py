"""Unchanged-solver lower-domain control; retain failures and forbid promotion."""
from __future__ import annotations

import argparse
import copy
import json
import math
import os
from pathlib import Path
import platform
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
U = runpy.run_path(str(ROOT / "scripts/run-nr-k3-schwarzschild-upper-domain.py"))
RUN, W, B = (U[k] for k in ("RUN", "W", "B"))
from science.numerical_relativity import fo_ccz4_exterior_window as GEOMETRY  # noqa: E402
from science.numerical_relativity import halo_intervention as H  # noqa: E402

require, sha256, new_json = (RUN[k] for k in ("require", "sha256", "new_json"))
EVIDENCE, FLAGS = RUN["EVIDENCE_ROOT"], U["FLAGS"]
DOMAIN = B["SchwarzschildDomain"](.5, 3.)
SIZES, PAIRS, TIMES = U["SIZES"], U["PAIRS"], U["TIMES"]
STAGES = ("n21", "n31", "n41", "dt41", "replay")
CAPS = {**U["CAPS"], "n41": (2400., 448, 48, 240.)}
SCHEMA = "nr-k3-schwarzschild-lower-domain-v1"
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261008-schwarzschild-lower-domain.md"
ANCHOR = EVIDENCE / "nr-k3-halo-intervention-v1-20261008/receipt.json"
ANCHOR_SHA = "aba75f5d5bbadda6891e7f33dce2e0712aece034304fa6cc5e32fed0a6ee4ef3"
INVENTORY = EVIDENCE / "nr-k3-error-localization-v1-20261008/analysis.json"
INVENTORY_SHA = "482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a"
OLD = {"original": (U["D"]["BASELINE"], U["D"]["BASELINE_SHA"]),
       "upper": (EVIDENCE / "nr-k3-upper-domain-replay-v1-20261008/receipt.json",
                 "ac35d3e159b9c0ad603f7bde4068171f2a396a4a690799b5c0ccc42462e33da7"),
       "both": (U["ANCHOR"], U["ANCHOR_SHA"])}
BINARY_SHA = "fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(),
         "scripts/run-nr-k3-schwarzschild-lower-domain.py",
         "scripts/audit-nr-k3-schwarzschild-lower-domain.py",
         "scripts/tests/test_nr_schwarzschild_lower_domain.py"}
COLLECTIONS = ("study_cases", "shared_initial", "region_comparisons", "spatial_assessment",
               "time_samples", "time_controls", "time_initial", "historical_controls", "factorial_records",
               "factorial_trends")


def lower_seed(n, dt=1. / 256):
    require(type(n) is int and n in SIZES and dt in (1. / 256, 1. / 512), "declared lower grid/timestep required")
    require(dt == 1. / 256 or n == 41, "half-step control is N41 only")
    return B["checkpoint_from_state"](B["initial_state"](n, 4, DOMAIN), profile=B["PROFILE"],
        dt=dt, scenario=2, amplitude=0., tau_inverse=1., domain=DOMAIN)


def shared_initial(base, lower):
    n, large = base.header["points"], lower.header["points"]
    require((n, large) in PAIRS and base.domain == B["DOMAIN"] and lower.domain == DOMAIN,
            "lower-only matched domain pair required")
    grid, other = base.domain.grid(n, 4), lower.domain.grid(large, 4)
    require(grid.spacing == other.spacing, "matched spacing required")
    start = large - n
    subset = (slice(start, large),) * 3
    coordinate = max(float(np.max(np.abs(a - b[subset]))) for a, b in zip(grid.coordinates, other.coordinates, strict=True))
    left, right = np.asarray(base.slots, dtype="<f8"), np.ascontiguousarray(np.asarray(lower.slots)[:, start:, start:, start:], dtype="<f8")
    maximum = float(np.max(np.abs(left - right)))
    require(coordinate <= 2.e-15 and maximum <= 2.e-14, "shared initial rounding bound exceeded")
    return {"main_n": n, "lower_n": large, "spacing": list(grid.spacing), "upper": 3.,
            "coordinate_linf": coordinate, "state_linf": maximum, "byte_equal": left.tobytes() == right.tobytes()}


def verified_json(path, digest):
    require(sha256(path) == digest, "receipt identity drift")
    return json.loads(path.read_text(encoding="utf-8"))


def verify_files(value, path):
    require(value["source_before"] == value["source_after"], "source changed during execution")
    for name, digest in value["source_after"].items():
        require((ROOT / name).resolve().is_relative_to(ROOT), "source escapes workspace")
        require(sha256(ROOT / name) == sha256(path.parent / "source-snapshot" / name) == digest, "source drift: " + name)
    actual = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(actual == set(value["artifact_hashes"]), "artifact inventory changed")
    for name, digest in value["artifact_hashes"].items():
        require((path.parent / name).resolve().is_relative_to(path.parent), "artifact escapes archive")
        require(sha256(path.parent / name) == digest, "artifact drift: " + name)


def predecessors():
    anchor = verified_json(ANCHOR, ANCHOR_SHA)
    require(anchor["completed"] is True and anchor["operator_controls_passed"] is True and anchor["errors"] == [],
            "completed intervention required")
    require(all(anchor[k] is False for k in FLAGS), "anchor admission changed")
    verify_files(anchor, ANCHOR)
    old = {k: verified_json(path, digest) for k, (path, digest) in OLD.items()}
    for k, value in old.items():
        require(value["completed" if k == "original" else "study_completed"] is True
                and value["window_passed" if k == "original" else "study_passed"] is False
                and value["errors"] == [] and all(value[f] is False for f in FLAGS), "retained failure changed")
        require(value["binary_sha256"] == BINARY_SHA and sha256(Path(value["binary"])) == BINARY_SHA, "binary drift")
    inventory = verified_json(INVENTORY, INVENTORY_SHA)
    rows = inventory["inventory"]
    expected = {(d, n, t) for d, ns in (("original", (17, 25, 33)), ("upper", SIZES), ("both", (25, 37, 49)))
                for n in ns for t in (0., *W["TIMES"])}
    keys = [(r["domain"], r["n"], r["time"]) for r in rows]
    require(len(keys) == len(set(keys)) == 45 and set(keys) == expected, "45 unique old inputs required")
    for row in rows:
        require(inventory["input_checkpoint_hashes"].get(row["path"]) == row["sha256"] == sha256(Path(row["path"])),
                "old raw checkpoint drift")
    return anchor, old["original"], dict(zip(keys, rows, strict=True))


def historical(data, records):
    n, t = data.header["points"], data.header["time"]
    require(n == 21 and data.domain == DOMAIN and t in W["TIMES"], "coarse lower historical identity required")
    raw = next(r["q"] for r in records if r["time"] == t)
    expected = np.ascontiguousarray(raw[:, :21, :21, :21], dtype="<f8")
    require(np.asarray(data.slots, dtype="<f8").tobytes() == expected.tobytes(), "high-clamp/lower-domain bytes differ")
    return {"n": n, "time": t, "entire_lower_cube_bytes_equal": True}


def validate_stage(value, stage):
    require(value["schema"] == SCHEMA and value["stage"] == stage and value["stage_completed"] is True
            and value["errors"] == [] and value["protocol_sha256"] == sha256(PROTOCOL), "incomplete/drifted lower stage")
    require(value["anchor_sha256"] == ANCHOR_SHA and value["inventory_sha256"] == INVENTORY_SHA
            and value["domain"] == DOMAIN.identity() and value["binary_sha256"] == BINARY_SHA, "stage identity drift")
    require(all(value[k] is False for k in FLAGS) and value["retained_failures"] == {k: False for k in OLD}, "admission changed")
    require(value["stage_caps"] == list(CAPS[stage]) and value["c_reserve_bytes"] == RUN["C_RESERVE"]
            and value["e_reserve_bytes"] == RUN["E_RESERVE"], "resource identity drift")
    require(0 <= value["seconds"] < CAPS[stage][0] and 0 <= value["study_chain_seconds"] < 8000., "resource cap exceeded")
    require(len(value["commands"]) == (1 if stage == "replay" else 4 if stage == "dt41" else 8)
            and all(c["returncode"] == 0 for c in value["commands"]), "native execution matrix incomplete")
    require(value["historical_controls"] == [{"n": 21, "time": t, "entire_lower_cube_bytes_equal": True}
            for t in W["TIMES"]], "four historical controls required")


def parent_for(stage, path, digest, anchor):
    if stage == "n21":
        require(path is None and digest is None, "first stage uses fixed anchor")
        return anchor, ANCHOR, ANCHOR_SHA, 0.
    require(path is not None and digest is not None, "explicit previous receipt/hash required")
    current, expected, chain = path.resolve(), digest, []
    for i in range(STAGES.index(stage) - 1, -1, -1):
        require(current.is_relative_to(EVIDENCE.resolve()), "parent outside E evidence")
        value = verified_json(current, expected)
        validate_stage(value, STAGES[i])
        verify_files(value, current)
        chain.append(value)
        current, expected = Path(value["parent"]), value["parent_sha256"]
    require(current == ANCHOR and expected == ANCHOR_SHA, "anchor lineage mismatch")
    cumulative = 0.
    for value in reversed(chain):
        cumulative += value["seconds"]
        require(cumulative == value["study_chain_seconds"], "chain time mismatch")
    return chain[0], path.resolve(), digest, cumulative


class Runner(RUN["Runner"]):
    def budget(self):
        cap, size, headroom, single = CAPS[self.stage]
        elapsed = time.perf_counter() - self.started
        remaining = min(cap - elapsed, 8000. - self.prior_seconds - elapsed)
        require(remaining > 0., "stage/8000s lower-domain cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"] + headroom * 1024**2, "E reserve/headroom reached")
        require(shutil.disk_usage("C:/").free >= RUN["C_RESERVE"], "C reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) + headroom * 1024**2
                <= size * 1024**2, "stage output cap reached")
        return min(single, remaining)


def all_samples(value):
    return [s for row in value["study_cases"] for s in [row["initial"], *row["samples"]]] + value["time_samples"]


def primary(value, n, t):
    row = next(r for r in value["study_cases"] if r["n"] == n)
    saved = row["initial"] if t == 0. else next(s for s in row["samples"] if s["diagnostics"]["time"] == t)
    path = Path(saved["path"])
    require(sha256(path) == saved["sha256"], "lower raw state drift")
    return B["read"](path, lower_seed(n)), path


def old_state(inventory, domain, n, t):
    row = inventory[domain, n, t]
    model = {"original": lambda: B["seed"](n, 4), "upper": lambda: U["upper_seed"](n),
             "both": lambda: U["D"]["expanded_seed"](n)}[domain]()
    require(sha256(Path(row["path"])) == row["sha256"], "old state changed")
    return B["read"](Path(row["path"]), model)


def core_fields(data):
    fields, grid = GEOMETRY.audit_fields(data)
    return {m: GEOMETRY.core_values(fields[m], grid).copy() for m in ("H", "ricci_error")}


def factorial_study(value, inventory):
    output = []
    for small, n in PAIRS:
        for t in W["TIMES"]:
            states = {"both": core_fields(old_state(inventory, "original", small, t)),
                      "low": core_fields(old_state(inventory, "upper", n, t)),
                      "none": core_fields(old_state(inventory, "both", 3 * (small - 1) // 2 + 1, t)),
                      "high": core_fields(primary(value, n, t)[0])}
            for metric in ("H", "ricci_error"):
                result = H.factorial({mode: field[metric] for mode, field in states.items()})
                require(result["identity_residual"] <= H.LIMIT, "factorial identity exceeded floor")
                output.append({"n": n, "time": t, "metric": metric, **result})
    return output


def factorial_trends(records):
    lookup = {(r["n"], r["time"], r["metric"]): r for r in records}
    require(len(records) == len(lookup) == 24 and set(lookup) == {(n, t, m) for n in SIZES
        for t in W["TIMES"] for m in ("H", "ricci_error")}, "24 factorial records required")
    return [{"time": t, "metric": m, "contrast": c, "exploratory_not_admission": True,
        **B["refinement"]([lookup[n, t, m]["contrasts"][c]["rms"] for n in SIZES], 4)}
        for t in (.25, .5, 1.) for m in ("H", "ricci_error")
        for c in ("release_low_from_both", "release_high_from_both", "interaction", "release_both")]


def assess_spatial(value):
    rows = {r["n"]: r for r in value["study_cases"]}
    require(len(value["study_cases"]) == 3 and set(rows) == set(SIZES), "three distinct lower grids required")
    require(all([s["diagnostics"]["time"] for s in r["samples"]] == list(TIMES) for r in rows.values()), "eight times per grid required")
    comparisons = {(c["main_n"], c["lower_n"], c["time"]): c for c in value["region_comparisons"]}
    require(len(value["region_comparisons"]) == 12 and set(comparisons) == {(s, n, t) for s, n in PAIRS for t in W["TIMES"]}, "12 matched region comparisons required")
    groups, differences = [], []
    for t in (.25, .5, 1.):
        for metric in W["PRIMARY"]:
            groups.append({"time": t, "metric": metric, **B["refinement"]([
                rows[n]["samples"][TIMES.index(t)]["diagnostics"]["core"][metric]["l2"] for n in SIZES], 4)})
            differences.append({"time": t, "metric": metric, **B["refinement"]([
                comparisons[s, n, t]["metrics"][metric]["rms_difference"] for s, n in PAIRS], 4)})
    return {"lower_groups": groups, "region_difference_groups": differences,
            "lower_spatial_passed": all(g["passed"] for g in groups),
            "region_difference_spatial_passed": all(g["passed"] for g in differences)}


def final_assessment(value):
    assessment = assess_spatial(value)
    require(value["spatial_assessment"] == assessment, "spatial decision drift")
    require([s["diagnostics"]["time"] for s in value["time_samples"]] == [.25, .5, .75, 1.]
            and [c["time"] for c in value["time_controls"]] == [.25, .5, 1.], "time matrix incomplete")
    require(len(all_samples(value)) == len({s["path"] for s in all_samples(value)}) == 31, "31 unique samples required")
    require([(s["main_n"], s["lower_n"]) for s in value["shared_initial"]] == list(PAIRS), "initial matrix incomplete")
    for (_, n), s in zip(PAIRS, value["shared_initial"], strict=True):
        require(s["upper"] == 3. and s["spacing"] == list(DOMAIN.grid(n, 4).spacing)
                and 0 <= s["coordinate_linf"] <= 2.e-15 and 0 <= s["state_linf"] <= 2.e-14, "shared initial mismatch")
    require(value["historical_controls"] == [{"n": 21, "time": t, "entire_lower_cube_bytes_equal": True}
        for t in W["TIMES"]], "four historical controls required")
    require(value.get("deterministic_replay") is True and value["time_initial"]["state_byte_equal"] is True, "identity control missing")
    require(value["factorial_trends"] == factorial_trends(value["factorial_records"]), "factorial trends drift")
    for record in value["factorial_records"]:
        require(0 <= record["identity_residual"] <= H.LIMIT and record["reflection_measurement"] is False
                and record["unique_source_decomposition"] is False, "factorial identity/admission changed")
    for control in value["time_controls"]:
        require(set(control["metrics"]) == set(W["METRICS"]), "13 time fields required")
        for m in control["metrics"].values():
            require(all(math.isfinite(m[k]) and m[k] >= 0. for k in ("rms_difference", "coarse_norm", "fine_norm", "ratio")), "invalid time metric")
            ratio = m["rms_difference"] / max(m["coarse_norm"], 2.e-12)
            require(m["ratio"] == ratio and m["passed"] == (max(m["coarse_norm"], m["fine_norm"]) <= 2.e-12 or ratio <= .05), "time decision drift")
        require(control["passed"] == all(m["passed"] for m in control["metrics"].values()), "time aggregate drift")
    bounded = all(s["bounded_window"] for s in all_samples(value))
    return {"bounded_study": bounded, "study_passed": bounded and assessment["lower_spatial_passed"]
            and assessment["region_difference_spatial_passed"] and all(c["passed"] for c in value["time_controls"])}


def run_grid(runner, value, inventory, n):
    small = next(s for s, large in PAIRS if large == n)
    data = lower_seed(n)
    value["shared_initial"].append(shared_initial(old_state(inventory, "original", small, 0.), data))
    path = runner.directory / f"lower-n{n}-initial.bin"
    runner.budget()
    B["encode"](path, data)
    row = {"n": n, "initial": W["sample"](data, path), "samples": []}
    value["study_cases"].append(row)
    records = H.read_records(ANCHOR.parent / "high-steps256-threads4.diagnostic", "high", 256) if n == 21 else None
    for t in TIMES:
        data, path, _ = runner.native(Path(value["binary"]), f"lower-n{n}-t{t:g}", data, path, 32)
        require(data.header["time"] == t, "target time mismatch")
        row["samples"].append(W["sample"](data, path))
        if n == 21 and t in W["TIMES"]:
            value["historical_controls"].append(historical(data, records))
        if t in W["TIMES"]:
            base = old_state(inventory, "original", small, t)
            value["region_comparisons"].append({"main_n": small, "lower_n": n, **W["boundary_location_difference"](base, data)})
    value["stage_passed"] = all(s["bounded_window"] for s in all_samples(value))
    if n == 41:
        value["spatial_assessment"] = assess_spatial(value)
        value["factorial_records"] = factorial_study(value, inventory)
        value["factorial_trends"] = factorial_trends(value["factorial_records"])
        value["stage_passed"] &= value["spatial_assessment"]["lower_spatial_passed"] and value["spatial_assessment"]["region_difference_spatial_passed"]


def run_time(runner, value):
    data = lower_seed(41, 1. / 512)
    require(np.asarray(data.slots).tobytes() == np.asarray(primary(value, 41, 0.)[0].slots).tobytes(), "time initial differs")
    path = runner.directory / "dt41-initial.bin"
    runner.budget()
    B["encode"](path, data)
    value["time_initial"] = {"path": str(path), "sha256": sha256(path), "state_byte_equal": True}
    for t in (.25, .5, .75, 1.):
        data, path, _ = runner.native(Path(value["binary"]), f"dt-lower-n41-t{t:g}", data, path, 128)
        require(data.header["time"] == t, "time control target differs")
        value["time_samples"].append(W["sample"](data, path))
        if t != .75:
            value["time_controls"].append(W["timestep_difference"](primary(value, 41, t)[0], data))
    value["stage_passed"] = all(s["bounded_window"] for s in all_samples(value)) and all(c["passed"] for c in value["time_controls"])


def run_replay(runner, value):
    _, initial = primary(value, 21, 0.)
    direct = runner.native(Path(value["binary"]), "lower-n21-serial-t1", lower_seed(21), initial, 256, threads=1)
    _, staged = primary(value, 21, 1.)
    require(direct[1].read_bytes() == staged.read_bytes() and direct[2].read_bytes() == staged.with_suffix(".json").read_bytes(), "serial/staged byte mismatch")
    value.update(deterministic_replay=True, replay_paths={"direct": str(direct[1]), "staged": str(staged)})
    value.update(final_assessment(value))
    value["study_completed"], value["stage_passed"] = True, value["study_passed"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, choices=STAGES)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--parent-receipt", type=Path)
    parser.add_argument("--parent-sha256")
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve() and not directory.exists(), "fresh E child required")
    anchor, original, inventory = predecessors()
    parent, parent_path, parent_sha, prior = parent_for(args.stage, args.parent_receipt, args.parent_sha256, anchor)
    names = set(anchor["source_after"]) | EXTRA
    before = {n: sha256(ROOT / n) for n in sorted(names)}
    value = {"schema": SCHEMA, "stage": args.stage, "parent": str(parent_path), "parent_sha256": parent_sha,
        "anchor_sha256": ANCHOR_SHA, "inventory_sha256": INVENTORY_SHA, "domain": DOMAIN.identity(),
        "retained_failures": {k: False for k in OLD}, "old_receipt_hashes": {str(p): h for p, h in OLD.values()},
        "input_hashes": {r["path"]: r["sha256"] for r in inventory.values()},
        "c_reserve_bytes": RUN["C_RESERVE"], "e_reserve_bytes": RUN["E_RESERVE"], "stage_caps": list(CAPS[args.stage]),
        "protocol_sha256": sha256(PROTOCOL), "source_before": before, "binary": original["binary"], "binary_sha256": BINARY_SHA,
        "python": platform.python_version(), "numpy": np.__version__, "stage_completed": False, "stage_passed": False,
        "study_completed": False, "study_passed": False, "commands": [], "errors": [], "study_cases": [],
        "shared_initial": [], "region_comparisons": [], "time_samples": [], "time_controls": [], "historical_controls": [],
        **{k: False for k in FLAGS}}
    runner = Runner(directory, value, args.stage, prior)
    runner.budget()
    directory.mkdir(parents=True)
    for name in before:
        target = directory / "source-snapshot" / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    temp = directory / "native-temp"
    temp.mkdir()
    previous_env = {k: os.environ.get(k) for k in ("TEMP", "TMP")}
    os.environ.update(TEMP=str(temp), TMP=str(temp))
    try:
        if args.stage != "n21":
            for key in COLLECTIONS:
                if key in parent:
                    value[key] = copy.deepcopy(parent[key])
            for sample in all_samples(value):
                sample["retained"] = True
        if args.stage in ("n21", "n31", "n41"):
            run_grid(runner, value, inventory, int(args.stage[1:]))
        elif args.stage == "dt41":
            run_time(runner, value)
        else:
            run_replay(runner, value)
        runner.budget()
        value["stage_completed"] = True
    except Exception as error:
        value["errors"].append(f"{type(error).__name__}: {error}")
        for key in ("stage_completed", "stage_passed", "study_completed", "study_passed"):
            value[key] = False
    finally:
        for key, old in previous_env.items():
            if old is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = old
        value["seconds"] = time.perf_counter() - runner.started
        value["study_chain_seconds"] = prior + value["seconds"]
        value["source_after"] = {n: sha256(ROOT / n) for n in sorted(names)}
        stable = before == value["source_after"] and sha256(PROTOCOL) == value["protocol_sha256"] and sha256(Path(value["binary"])) == BINARY_SHA
        stable &= all(sha256(Path(p)) == h for p, h in value["input_hashes"].items())
        stable &= all(sha256(Path(p)) == h for p, h in value["old_receipt_hashes"].items())
        stable &= sha256(ANCHOR) == ANCHOR_SHA and sha256(INVENTORY) == INVENTORY_SHA
        if not stable:
            value["errors"].append("frozen identities changed during execution")
            for key in ("stage_completed", "stage_passed", "study_completed", "study_passed"):
                value[key] = False
        value["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory / "receipt.json", value)
        print(json.dumps({k: value[k] for k in ("stage", "stage_completed", "stage_passed", "study_completed", "study_passed", "errors")}), flush=True)
    return 0 if value["stage_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

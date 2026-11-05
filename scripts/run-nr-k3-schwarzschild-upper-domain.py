"""Upper-face-only Schwarzschild control, with the numerical kernel unchanged."""
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
D = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-domain-matrix.py"))
RUN, W, B = (D[key] for key in ("RUN", "W", "B"))
require, sha256, new_json = (RUN[key] for key in ("require", "sha256", "new_json"))
DOMAIN = B["SchwarzschildDomain"](1., 3.5)
SIZES, PAIRS = (21, 31, 41), ((17, 21), (25, 31), (33, 41))
TIMES, FLAGS = D["TIMES"], D["FLAGS"]
SCHEMA = "nr-k3-schwarzschild-upper-domain-v1"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-schwarzschild-upper-domain.md"
ANCHOR = RUN["EVIDENCE_ROOT"]/"nr-k3-domain-matrix-replay-completion-v1-20261008/receipt.json"
ANCHOR_SHA = "7e8ed82d234b56309c54093298ec475da4f00a2e47eea5a052a48026bd2d2157"
ANCHOR_AUDIT = RUN["EVIDENCE_ROOT"]/"nr-k3-domain-matrix-audit-completion-v1-20261008/audit.json"
ANCHOR_AUDIT_SHA = "72604cc5c78215806d920e0704aa8efae7d52d63edeb5ae846413f8ee930b652"
STAGES = ("n21", "n31", "n41", "dt41", "replay")
CAPS = {"n21": (900., 128, 16, 180.), "n31": (1400., 256, 32, 180.),
        "n41": (2200., 448, 48, 240.), "dt41": (2600., 288, 48, 700.),
        "replay": (700., 32, 8, 600.)}
EXTRA = {"scripts/"+name for name in ("run-nr-k3-schwarzschild-upper-domain.py",
    "audit-nr-k3-schwarzschild-upper-domain.py", "tests/test_nr_schwarzschild_upper_domain.py")}
EXTRA.add(PROTOCOL.relative_to(ROOT).as_posix())
COLLECTIONS = ("study_cases", "shared_initial", "region_comparisons", "spatial_assessment",
               "time_samples", "time_controls", "time_initial")


def upper_seed(n, dt=1./256):
    require(type(n) is int and n in SIZES and dt in (1./256, 1./512), "declared upper grid/timestep required")
    require(dt == 1./256 or n == 41, "half-step control is N41 only")
    return B["checkpoint_from_state"](B["initial_state"](n, 4, DOMAIN), profile=B["PROFILE"],
        dt=dt, scenario=2, amplitude=0., tau_inverse=1., domain=DOMAIN)


def shared_initial(base, upper):
    n, large = base.header["points"], upper.header["points"]
    require((n, large) in PAIRS and base.domain == B["DOMAIN"] and upper.domain == DOMAIN,
            "upper-only matched domain pair required")
    grid, other = base.domain.grid(n, 4), upper.domain.grid(large, 4)
    require(grid.spacing == other.spacing and grid.lower == other.lower, "lower faces/spacing changed")
    subset = (slice(0, n),)*3
    coordinate = max(float(np.max(np.abs(a-b[subset]))) for a, b in zip(grid.coordinates, other.coordinates, strict=True))
    left = np.asarray(base.slots, dtype="<f8")
    right = np.ascontiguousarray(np.asarray(upper.slots)[:, :n, :n, :n], dtype="<f8")
    maximum = float(np.max(np.abs(left-right)))
    require(coordinate <= 2.e-15 and maximum <= 2.e-14, "shared initial rounding bound exceeded")
    return {"main_n": n, "upper_n": large, "spacing": list(grid.spacing), "lower": list(grid.lower),
            "coordinate_linf": coordinate, "state_linf": maximum, "byte_equal": left.tobytes() == right.tobytes()}


def predecessors():
    original = D["baseline"]()
    anchor = RUN["archive"](ANCHOR, ANCHOR_SHA)
    require(anchor["study_completed"] is True and anchor["study_passed"] is False and anchor["errors"] == [],
            "retained completed numerical failure required")
    require(all(anchor[k] is False for k in FLAGS), "retained admission changed")
    require(sha256(ANCHOR_AUDIT) == ANCHOR_AUDIT_SHA, "retained audit drift")
    audit = json.loads(ANCHOR_AUDIT.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and audit["errors"] == [] and audit["receipt_sha256"] == ANCHOR_SHA
            and audit["reproduced_study_passed"] is False, "retained audit incomplete")
    require(sha256(ROOT/"scripts/audit-nr-k3-schwarzschild-domain-matrix.py") == audit["audit_script_sha256"],
            "retained audit source changed")
    require(anchor["binary_sha256"] == original["binary_sha256"], "predecessor binary mismatch")
    return original, anchor


def verify_stage(value, stage):
    require(value["schema"] == SCHEMA and value["stage"] == stage and value["stage_completed"] is True
            and value["errors"] == [] and value["protocol_sha256"] == sha256(PROTOCOL), "incomplete/drifted stage")
    require(all(value[k] is False for k in FLAGS) and value["retained_study_passed"] is False
            and value["retained_window_passed"] is False, "old failure/admission changed")
    require(value["baseline_sha256"] == D["BASELINE_SHA"] and value["anchor_sha256"] == ANCHOR_SHA
            and value["domain"] == DOMAIN.identity(), "study identity changed")
    require(value["stage_caps"] == list(CAPS[stage]) and value["c_reserve_bytes"] == RUN["C_RESERVE"]
            and value["e_reserve_bytes"] == RUN["E_RESERVE"], "resource contract changed")
    require(all(math.isfinite(value[k]) and value[k] >= 0. for k in ("seconds", "study_chain_seconds"))
            and value["seconds"] < CAPS[stage][0] and value["study_chain_seconds"] < 7800., "resource cap exceeded")


def parent_for(stage, path, digest, anchor):
    if stage == "n21":
        require(path is None and digest is None, "first stage uses fixed anchor")
        return anchor, ANCHOR, ANCHOR_SHA, 0.
    require(path is not None and digest is not None, "explicit previous stage receipt/hash required")
    current, expected, chain = path.resolve(), digest, []
    for i in range(STAGES.index(stage)-1, -1, -1):
        require(current.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "parent outside E evidence")
        value = RUN["archive"](current, expected)
        verify_stage(value, STAGES[i])
        chain.append(value)
        current, expected = Path(value["parent"]), value["parent_sha256"]
    require(current == ANCHOR and expected == ANCHOR_SHA, "anchor lineage mismatch")
    cumulative = 0.
    for value in reversed(chain):
        cumulative += value["seconds"]
        require(cumulative == value["study_chain_seconds"], "stage time accounting mismatch")
    return chain[0], path.resolve(), digest, cumulative


class Runner(RUN["Runner"]):
    def budget(self):
        cap, size, headroom, single = CAPS[self.stage]
        elapsed = time.perf_counter()-self.started
        remaining = min(cap-elapsed, 7800.-self.prior_seconds-elapsed)
        require(remaining > 0., "stage/7800s upper-domain cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+headroom*1024**2, "E reserve plus next-output headroom reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+headroom*1024**2
                <= size*1024**2, "stage output cap reached")
        return min(single, remaining)


def all_samples(value):
    return [s for row in value["study_cases"] for s in [row["initial"], *row["samples"]]]+value["time_samples"]


def primary(value, n, t):
    row = next(r for r in value["study_cases"] if r["n"] == n)
    saved = next(s for s in row["samples"] if s["diagnostics"]["time"] == t)
    path = Path(saved["path"])
    require(sha256(path) == saved["sha256"], "retained upper state changed")
    data = B["read"](path, upper_seed(n))
    require(W["sample"](data, path, retained=saved["retained"]) == saved, "retained upper diagnostics changed")
    return data, path


def assess_spatial(value):
    rows = {r["n"]: r for r in value["study_cases"]}
    require(set(rows) == set(SIZES) and len(value["study_cases"]) == 3, "three distinct upper grids required")
    require(all([s["diagnostics"]["time"] for s in r["samples"]] == list(TIMES) for r in rows.values()),
            "eight times per upper grid required")
    comparisons = {(c["main_n"], c["upper_n"], c["time"]): c for c in value["region_comparisons"]}
    require(len(value["region_comparisons"]) == 12 and set(comparisons) == {(s, n, t) for s, n in PAIRS for t in W["TIMES"]},
            "twelve correctly paired region comparisons required")
    groups, differences = [], []
    for t in (.25, .5, 1.):
        for metric in W["PRIMARY"]:
            norms = [rows[n]["samples"][TIMES.index(t)]["diagnostics"]["core"][metric]["l2"] for n in SIZES]
            delta = [comparisons[s, n, t]["metrics"][metric]["rms_difference"] for s, n in PAIRS]
            groups.append({"time": t, "metric": metric, **B["refinement"](norms, 4)})
            differences.append({"time": t, "metric": metric, **B["refinement"](delta, 4)})
    return {"upper_groups": groups, "region_difference_groups": differences,
            "upper_spatial_passed": all(g["passed"] for g in groups),
            "region_difference_spatial_passed": all(g["passed"] for g in differences)}


def final_assessment(receipt):
    assessment = assess_spatial(receipt)
    require(receipt["spatial_assessment"] == assessment, "spatial assessment drift")
    require([s["diagnostics"]["time"] for s in receipt["time_samples"]] == [.25, .5, .75, 1.]
            and [c["time"] for c in receipt["time_controls"]] == [.25, .5, 1.], "time matrix incomplete")
    samples = all_samples(receipt)
    require(len(samples) == len({s["path"] for s in samples}) == 31, "31 distinct samples required")
    require([(r["main_n"], r["upper_n"]) for r in receipt["shared_initial"]] == list(PAIRS), "initial pairs incomplete")
    for (small, n), shared in zip(PAIRS, receipt["shared_initial"], strict=True):
        require(shared["lower"] == [1., 1., 1.] and shared["spacing"] == list(DOMAIN.grid(n, 4).spacing),
                "lower face/spacing identity changed")
        require(all(math.isfinite(shared[k]) and 0. <= shared[k] <= limit
                    for k, limit in (("coordinate_linf", 2.e-15), ("state_linf", 2.e-14))), "initial bounds changed")
    require(receipt.get("deterministic_replay") is True and receipt["time_initial"]["state_byte_equal"] is True,
            "replay/initial byte control incomplete")
    for control in receipt["time_controls"]:
        require(set(control["metrics"]) == set(W["METRICS"]), "all thirteen time fields required")
        for metric in control["metrics"].values():
            require(all(math.isfinite(metric[k]) and metric[k] >= 0.
                        for k in ("rms_difference", "coarse_norm", "fine_norm", "ratio")), "invalid time metric")
            ratio = metric["rms_difference"]/max(metric["coarse_norm"], 2.e-12)
            passed = max(metric["coarse_norm"], metric["fine_norm"]) <= 2.e-12 or ratio <= .05
            require(metric["ratio"] == ratio and metric["passed"] == passed, "time verdict drift")
        require(control["passed"] == all(m["passed"] for m in control["metrics"].values()), "time summary drift")
    bounded = all(s["bounded_window"] for s in samples)
    return {"bounded_study": bounded, "study_passed": bounded and assessment["upper_spatial_passed"]
            and assessment["region_difference_spatial_passed"] and all(c["passed"] for c in receipt["time_controls"])}


def run_grid(runner, original, receipt, n):
    data = upper_seed(n)
    small = next(s for s, large in PAIRS if large == n)
    old = B["read"](W["PARENT"].parent/f"fd4-n{small}-initial.bin", B["seed"](small, 4))
    receipt["shared_initial"].append(shared_initial(old, data))
    path = runner.directory/f"upper-n{n}-initial.bin"
    runner.budget()
    B["encode"](path, data)
    row = {"n": n, "initial": W["sample"](data, path), "samples": []}
    receipt["study_cases"].append(row)
    for t in TIMES:
        data, path, _ = runner.native(Path(receipt["binary"]), f"upper-n{n}-t{t:g}", data, path, 32)
        require(data.header["time"] == t, "upper grid target mismatch")
        row["samples"].append(W["sample"](data, path))
    receipt["stage_passed"] = all(s["bounded_window"] for s in all_samples(receipt))
    if n == 41:
        for small, large in PAIRS:
            base_row = next(r for r in original["cases"] if r["order"] == 4 and r["n"] == small)
            for saved in base_row["samples"]:
                runner.budget()
                path = Path(saved["path"])
                require(sha256(path) == saved["sha256"], "original region checkpoint drift")
                base = B["read"](path, B["seed"](small, 4))
                upper, _ = primary(receipt, large, base.header["time"])
                receipt["region_comparisons"].append({"main_n": small, "upper_n": large,
                    **W["boundary_location_difference"](base, upper)})
        receipt["spatial_assessment"] = assess_spatial(receipt)
        receipt["stage_passed"] &= receipt["spatial_assessment"]["upper_spatial_passed"]
        receipt["stage_passed"] &= receipt["spatial_assessment"]["region_difference_spatial_passed"]


def run_time(runner, receipt):
    data = upper_seed(41, 1./512)
    row = next(r for r in receipt["study_cases"] if r["n"] == 41)
    initial = B["read"](Path(row["initial"]["path"]), upper_seed(41))
    require(np.asarray(data.slots).tobytes() == np.asarray(initial.slots).tobytes(), "time initial slot bytes differ")
    path = runner.directory/"dt41-initial.bin"
    runner.budget()
    B["encode"](path, data)
    receipt["time_initial"] = {"path": str(path), "sha256": sha256(path), "state_byte_equal": True}
    for t in (.25, .5, .75, 1.):
        data, path, _ = runner.native(Path(receipt["binary"]), f"dt-upper-n41-t{t:g}", data, path, 128)
        require(data.header["time"] == t, "time-control target mismatch")
        receipt["time_samples"].append(W["sample"](data, path))
        if t != .75:
            base, _ = primary(receipt, 41, t)
            receipt["time_controls"].append(W["timestep_difference"](base, data))
    receipt["stage_passed"] = all(s["bounded_window"] for s in all_samples(receipt)) and all(c["passed"] for c in receipt["time_controls"])


def run_replay(runner, receipt):
    initial = Path(next(r for r in receipt["study_cases"] if r["n"] == 21)["initial"]["path"])
    direct = runner.native(Path(receipt["binary"]), "upper-n21-serial-t1", upper_seed(21), initial, 256, threads=1)
    _, staged = primary(receipt, 21, 1.)
    require(direct[1].read_bytes() == staged.read_bytes()
            and direct[2].read_bytes() == staged.with_suffix(".json").read_bytes(), "serial/staged replay mismatch")
    receipt["deterministic_replay"] = True
    receipt["replay_paths"] = {"direct": str(direct[1]), "staged": str(staged)}
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
    original, anchor = predecessors()
    parent, parent_path, parent_sha, prior = parent_for(args.stage, args.parent_receipt, args.parent_sha256, anchor)
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh E evidence child required")
    names = set(anchor["source_after"]) | EXTRA
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    receipt = {"schema": SCHEMA, "stage": args.stage, "parent": str(parent_path), "parent_sha256": parent_sha,
        "baseline": str(D["BASELINE"]), "baseline_sha256": D["BASELINE_SHA"], "anchor": str(ANCHOR), "anchor_sha256": ANCHOR_SHA,
        "retained_window_passed": False, "retained_study_passed": False, "domain": DOMAIN.identity(),
        "c_reserve_bytes": RUN["C_RESERVE"], "e_reserve_bytes": RUN["E_RESERVE"], "stage_caps": list(CAPS[args.stage]),
        "protocol_sha256": sha256(PROTOCOL), "source_before": before, "binary": anchor["binary"],
        "binary_sha256": anchor["binary_sha256"], "python": platform.python_version(), "numpy": np.__version__,
        "stage_completed": False, "stage_passed": False, "study_completed": False, "study_passed": False,
        "commands": [], "errors": [], "study_cases": [], "shared_initial": [], "region_comparisons": [],
        "time_samples": [], "time_controls": [], **{k: False for k in FLAGS}}
    runner = Runner(directory, receipt, args.stage, prior)
    runner.budget()
    directory.mkdir(parents=True)
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    try:
        if args.stage != "n21":
            for key in COLLECTIONS:
                if key in parent:
                    receipt[key] = copy.deepcopy(parent[key])
            for saved in all_samples(receipt):
                saved["retained"] = True
        if args.stage in ("n21", "n31", "n41"):
            run_grid(runner, original, receipt, int(args.stage[1:]))
        elif args.stage == "dt41":
            run_time(runner, receipt)
        else:
            run_replay(runner, receipt)
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
        print(json.dumps({k: receipt[k] for k in ("stage", "stage_completed", "stage_passed", "study_completed", "study_passed", "errors")}), flush=True)
    return 0 if receipt["stage_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

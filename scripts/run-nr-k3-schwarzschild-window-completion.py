"""Finish the original Schwarzschild window matrix in three frozen batches.

Only execution segmentation/storage changes. No solver, equation, diagnostic
definition or numerical threshold is changed. Failed numerical gates do not
prevent collecting the remaining controls; execution failures stop the batch.
"""
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
FD2 = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-fd2-completion.py"))
WINDOW = FD2["WINDOW"]
sha256, require, new_json, read, seed, sample = (
    FD2[k] for k in ("sha256", "require", "new_json", "read", "seed", "sample"))
BASE = WINDOW["BASE"]
ANCHOR = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-fd2-completion-v1-20261007/receipt.json")
ANCHOR_SHA = "e2a53d442dcf20ab3b915933a600490e1d1dea4714d7540b6525b5e677603141"
BASE_PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-schwarzschild-window-completion.md"
BASE_PROTOCOL_SHA = "42c93e65e591097f989e2e5562058e5e6001b23cce0b1695d805b0f5d9fb0dc5"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-schwarzschild-window-e-storage.md"
EVIDENCE_ROOT = ROOT/"tmp/nr-shadow-evidence"
DISK_STOP = EVIDENCE_ROOT/"nr-k3-schwarzschild-fd4-v1-20261008/receipt.json"
DISK_STOP_SHA = "b0843f7c2386aa3a7cd900f384f306cbd740952eacad82b283f8f49cba65a3a5"
SCHEMA = "nr-k3-schwarzschild-window-e-storage-v1"
C_RESERVE, E_RESERVE = 3*1024**3, 4*1024**3+32*1024**2
STAGES = ("fd4", "controls", "replay")
CAPS = {"fd4": (2000., 256, 32), "controls": (2400., 384, 32), "replay": (900., 64, 8)}
NEW = {"scripts/run-nr-k3-schwarzschild-window-completion.py",
       "scripts/tests/test_nr_schwarzschild_window_completion.py"}
COLLECTIONS = ("cases", "intermediate_samples", "expanded_samples", "boundary_comparisons",
               "time_samples", "time_controls")


def archive(path, expected_sha, *, allowed_current_changes=frozenset()):
    require(sha256(path) == expected_sha, "receipt identity drift")
    value = json.loads(path.read_text(encoding="utf-8"))
    require(value["source_before"] == value["source_after"], "source changed during parent execution")
    for name, digest in value["source_after"].items():
        require((ROOT/name).resolve().is_relative_to(ROOT), "source escapes workspace")
        require(sha256(path.parent/"source-snapshot"/name) == digest, "snapshot drift: "+name)
        if name not in allowed_current_changes:
            require(sha256(ROOT/name) == digest, "source drift: "+name)
    actual = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*")
              if p.is_file() and p != path}
    require(actual == set(value["artifact_hashes"]), "parent artifact inventory changed")
    for name, digest in value["artifact_hashes"].items():
        require((path.parent/name).resolve().is_relative_to(path.parent), "artifact escapes archive")
        require(sha256(path.parent/name) == digest, "artifact drift: "+name)
    require(sha256(Path(value["binary"])) == value["binary_sha256"], "binary drift")
    return value


def lineage(stage, parent_path=None, parent_sha=None):
    FD2["verify_stopped"]()
    disk_stop = archive(DISK_STOP, DISK_STOP_SHA, allowed_current_changes=NEW)
    require(disk_stop["commands"] == [] and disk_stop["errors"] == ["ValueError: C reserve reached"]
            and not disk_stop["stage_completed"] and not disk_stop["completed"] and not disk_stop["window_passed"],
            "unexpected resource-stop predecessor")
    require(sha256(BASE_PROTOCOL) == BASE_PROTOCOL_SHA == disk_stop["protocol_sha256"], "original batch protocol drift")
    anchor = archive(ANCHOR, ANCHOR_SHA)
    require(anchor["fd2_completed"] and anchor["completion_passed"] and not anchor["errors"], "FD2 evidence incomplete")
    require(sha256(FD2["PROTOCOL"]) == anchor["protocol_sha256"], "FD2 protocol drift")
    if stage == "fd4":
        require(parent_path is None and parent_sha is None, "fd4 uses the fixed anchor")
        return anchor, ANCHOR, ANCHOR_SHA, 0.
    require(parent_path is not None and parent_sha is not None, "explicit preceding receipt and hash required")
    path = parent_path.resolve()
    require(path.is_relative_to(EVIDENCE_ROOT.resolve()), "parent outside declared evidence directory")
    parent = archive(path, parent_sha)
    require(parent["schema"] == SCHEMA and parent["stage"] == STAGES[STAGES.index(stage)-1]
            and parent["stage_completed"] and not parent["errors"], "preceding execution batch incomplete")
    require(parent["protocol_sha256"] == sha256(PROTOCOL), "completion protocol changed")
    if stage == "replay":
        previous_path = Path(parent["parent"]).resolve()
        require(previous_path.is_relative_to(EVIDENCE_ROOT.resolve()), "earlier parent outside evidence directory")
        previous = archive(previous_path, parent["parent_sha256"])
        require(previous["stage"] == "fd4" and previous["stage_completed"] and not previous["errors"],
                "FD4 batch lineage incomplete")
    return parent, path, parent_sha, parent["extension_chain_seconds"]


def observations(receipt):
    values = [s for row in receipt.get("cases", []) for s in row["samples"]]
    for key in ("intermediate_samples", "expanded_samples", "time_samples"):
        values += receipt.get(key, [])
    if "execution_split" in receipt:
        values.append(receipt["execution_split"])
    return values


def inherit(parent, receipt):
    for key in COLLECTIONS:
        receipt[key] = copy.deepcopy(parent.get(key, []))
    for key in ("execution_split", "assessment", "initial_shared_fields_byte_equal"):
        if key in parent:
            receipt[key] = copy.deepcopy(parent[key])
    for saved in observations(receipt):
        saved["retained"] = True


def halo_bytes(data):
    mask = BASE["halo_mask"](data.slots[0].shape)
    return b"".join(np.asarray(v[mask], dtype="<f8").tobytes() for v in data.slots)


class Runner(WINDOW["Runner"]):
    def __init__(self, directory, receipt, stage, prior_seconds):
        super().__init__(directory, receipt)
        self.stage, self.prior_seconds = stage, prior_seconds

    def budget(self):
        cap, size, headroom = CAPS[self.stage]
        elapsed = time.perf_counter()-self.started
        remaining = min(cap-elapsed, 5000.-self.prior_seconds-elapsed)
        require(remaining > 0., "stage/5000s extension cap reached")
        require(shutil.disk_usage(ROOT).free >= E_RESERVE, "E reserve reached")
        require(shutil.disk_usage(ANCHOR.parent).free >= C_RESERVE, "C reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+headroom*1024**2
                <= size*1024**2, "stage output cap reached")
        return min(600. if self.stage == "replay" else 180., remaining)

    def native(self, binary, label, data, path, steps, threads=4, version="0.5.0"):
        result = super().native(binary, label, data, path, steps, threads, version)
        require(halo_bytes(data) == halo_bytes(result[0]), "prescribed halo bytes changed")
        return result


def segment_counts(start, target, dt):
    require(all(math.isfinite(x) for x in (start, target, dt)) and dt > 0., "finite positive timestep required")
    count = (target-start)/dt
    require(count > 0 and count == int(count), "positive integral interval required")
    return [32]*(int(count)//32)+([int(count)%32] if int(count)%32 else [])


def segmented(runner, receipt, label, data, path, target):
    for count in segment_counts(data.header["time"], target, data.header["dt"]):
        t = data.header["time"]+count*data.header["dt"]
        data, path, _ = runner.native(Path(receipt["binary"]), label+f"-t{t:g}", data, path, count)
        saved = sample(data, path)
        if t != target:
            receipt["intermediate_samples"].append(saved)
    require(data.header["time"] == target, "segmented target time mismatch")
    return data, path, saved


def main_sample(receipt, n, t):
    row = next(r for r in receipt["cases"] if r["order"] == 4 and r["n"] == n)
    saved = next(s for s in row["samples"] if s["diagnostics"]["time"] == t)
    path = Path(saved["path"])
    data = read(path, seed(n, 4))
    require(sample(data, path, retained=saved["retained"]) == saved, "retained primary sample drift")
    return data, path


def run_fd4(runner, receipt):
    for row in receipt["cases"]:
        for saved in row["samples"]:
            path = Path(saved["path"])
            data = read(path, seed(row["n"], 2))
            require(sample(data, path, retained=True) == saved, "FD2 diagnostic drift")
    parent = json.loads(WINDOW["PARENT"].read_text(encoding="utf-8"))
    lookup = {r["n"]: r for r in parent["cases"] if r["order"] == 4}
    for n in (17, 25, 33):
        old = lookup[n]["samples"][-1]
        path = Path(old["path"])
        data = read(path, seed(n, 4))
        require(BASE["sample"](data, path) == old, "short FD4 sample drift")
        row = {"n": n, "order": 4, "samples": [sample(data, path, retained=True)]}
        receipt["cases"].append(row)
        for t in WINDOW["TIMES"][1:]:
            data, path, saved = segmented(runner, receipt, f"fd4-n{n}", data, path, t)
            row["samples"].append(saved)
    receipt["assessment"] = WINDOW["assess"](receipt["cases"])
    receipt["bounded_so_far"] = all(s["bounded_window"] for s in observations(receipt))
    receipt["stage_passed"] = receipt["assessment"]["passed"] and receipt["bounded_so_far"]


def run_controls(runner, receipt):
    data = WINDOW["expanded_seed"]()
    original = read(WINDOW["PARENT"].parent/"fd4-n17-initial.bin", seed(17, 4))
    shared = np.ascontiguousarray(np.asarray(data.slots)[:, 4:21, 4:21, 4:21], dtype="<f8").tobytes()
    require(np.asarray(original.slots, dtype="<f8").tobytes() == shared, "initial shared bytes differ")
    receipt["initial_shared_fields_byte_equal"] = True
    path = runner.directory/"expanded-initial.bin"
    WINDOW["encode"](path, data)
    for t in WINDOW["TIMES"]:
        data, path, saved = segmented(runner, receipt, "expanded-n25", data, path, t)
        receipt["expanded_samples"].append(saved)
        base, _ = main_sample(receipt, 17, t)
        receipt["boundary_comparisons"].append(WINDOW["boundary_location_difference"](base, data))
    path = WINDOW["PARENT"].parent/"dt-control-fd4.bin"
    data = read(path, seed(33, 4, 1./512))
    for t in (.25, .5, .75, 1.):
        data, path, saved = segmented(runner, receipt, "dt-control-fd4-n33", data, path, t)
        if t == .75:
            receipt["execution_split"] = saved
        else:
            receipt["time_samples"].append(saved)
            base, _ = main_sample(receipt, 33, t)
            receipt["time_controls"].append(WINDOW["timestep_difference"](base, data))
    receipt["bounded_so_far"] = all(s["bounded_window"] for s in observations(receipt))
    receipt["stage_passed"] = receipt["bounded_so_far"] and all(x["passed"] for x in receipt["time_controls"])


def full_assessment(receipt):
    assessment = WINDOW["assess"](receipt["cases"])
    require(receipt["assessment"] == assessment, "refinement assessment drift")
    require([x["diagnostics"]["time"] for x in receipt["expanded_samples"]] == list(WINDOW["TIMES"])
            and [x["time"] for x in receipt["boundary_comparisons"]] == list(WINDOW["TIMES"]), "boundary matrix incomplete")
    require(receipt.get("initial_shared_fields_byte_equal") is True, "shared initial data not verified")
    for comparison in receipt["boundary_comparisons"]:
        require(set(comparison["metrics"]) == set(WINDOW["METRICS"]), "13 boundary metrics required")
        for result in comparison["metrics"].values():
            require(all(math.isfinite(result[k]) and result[k] >= 0.
                        for k in ("rms_difference", "baseline_error", "ratio_to_baseline")), "nonfinite boundary evidence")
            require(result["ratio_to_baseline"] == result["rms_difference"]/max(result["baseline_error"], 2.e-12)
                    and result["resolved_above_floor"] == (result["rms_difference"] > 2.e-12), "boundary diagnostic drift")
    require([x["diagnostics"]["time"] for x in receipt["time_samples"]] == [.25, .5, 1.]
            and [x["time"] for x in receipt["time_controls"]] == [.25, .5, 1.], "time matrix incomplete")
    require(receipt["execution_split"]["diagnostics"]["time"] == .75, "declared time split missing")
    for control in receipt["time_controls"]:
        require(set(control["metrics"]) == set(WINDOW["METRICS"]), "13 signed time metrics required")
        for result in control["metrics"].values():
            require(all(math.isfinite(result[k]) and result[k] >= 0.
                        for k in ("rms_difference", "coarse_norm", "fine_norm", "ratio")), "nonfinite time evidence")
            ratio = result["rms_difference"]/max(result["coarse_norm"], 2.e-12)
            passed = max(result["coarse_norm"], result["fine_norm"]) <= 2.e-12 or ratio <= .05
            require(result["ratio"] == ratio and result["passed"] == passed, "time verdict drift")
        require(control["passed"] == all(x["passed"] for x in control["metrics"].values()), "time summary drift")
    values = observations(receipt)
    require(len(values) == 62 and len({s["path"] for s in values}) == 62, "62 distinct saved diagnostic samples required")
    require(receipt.get("deterministic_replay") is True, "byte replay unverified")
    bounded = all(s["bounded_window"] for s in values)
    return {"bounded_window": bounded, "window_passed": bounded and assessment["passed"]
            and all(x["passed"] for x in receipt["time_controls"])}


def run_replay(runner, receipt):
    _, path = main_sample(receipt, 17, 1.)
    direct = runner.native(Path(receipt["binary"]), "serial-direct-fd4-n17-t1", seed(17, 4),
                           WINDOW["PARENT"].parent/"fd4-n17-initial.bin", 256, threads=1)
    require(direct[1].read_bytes() == path.read_bytes()
            and direct[2].read_bytes() == path.with_suffix(".json").read_bytes(), "checkpoint/manifest replay mismatch")
    receipt["deterministic_replay"] = True
    receipt["replay_paths"] = {"direct": str(direct[1]), "staged": str(path)}
    receipt.update(full_assessment(receipt))
    receipt["completed"] = True
    receipt["stage_passed"] = receipt["window_passed"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, choices=STAGES)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--parent-receipt", type=Path)
    parser.add_argument("--parent-sha256")
    args = parser.parse_args()
    parent, parent_path, parent_sha, prior = lineage(args.stage, args.parent_receipt, args.parent_sha256)
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE_ROOT.resolve()) and directory != EVIDENCE_ROOT.resolve(),
            "output must be a child of the declared project evidence root")
    require(not directory.exists(), "fresh output directory required")
    directory.mkdir(parents=True)
    names = set(parent["source_after"]) | NEW
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    shutil.copyfile(BASE_PROTOCOL, directory/BASE_PROTOCOL.name)
    receipt = {"schema": SCHEMA, "stage": args.stage, "parent": str(parent_path), "parent_sha256": parent_sha,
        "source_before": before, "protocol_sha256": sha256(PROTOCOL), "python": platform.python_version(),
        "base_protocol_sha256": BASE_PROTOCOL_SHA, "resource_predecessor": str(DISK_STOP),
        "resource_predecessor_sha256": DISK_STOP_SHA, "c_reserve_bytes": C_RESERVE, "e_reserve_bytes": E_RESERVE,
        "numpy": np.__version__, "binary": parent["binary"], "binary_sha256": parent["binary_sha256"],
        "stage_completed": False, "stage_passed": False, "completed": False, "window_passed": False,
        "physical_validation": False, "physical_boundary_validated": False, "black_hole_evolution_validated": False,
        "amr_validated": False, "waveform_validated": False, "gpu_validated": False,
        "runtime_writeback": False, "scientificPayloadWriteback": False, "errors": [], "commands": []}
    inherit(parent, receipt)
    runner = Runner(directory, receipt, args.stage, prior)
    try:
        {"fd4": run_fd4, "controls": run_controls, "replay": run_replay}[args.stage](runner, receipt)
        runner.budget()
        receipt["stage_completed"] = True
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
        receipt["stage_completed"] = receipt["stage_passed"] = receipt["completed"] = receipt["window_passed"] = False
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["extension_chain_seconds"] = prior+receipt["seconds"]
        anchor = json.loads(ANCHOR.read_text(encoding="utf-8"))
        disk_stop = json.loads(DISK_STOP.read_text(encoding="utf-8"))
        receipt["resource_stop_seconds"] = disk_stop["seconds"]
        receipt["combined_all_attempt_seconds"] = (anchor["combined_attempt_seconds"]+disk_stop["seconds"]
                                                   +receipt["extension_chain_seconds"])
        receipt["source_after"] = {n: sha256(ROOT/n) for n in sorted(names)}
        if before != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]:
            receipt["errors"].append("source/protocol changed during batch")
            receipt["stage_completed"] = receipt["stage_passed"] = receipt["completed"] = receipt["window_passed"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({k: receipt[k] for k in ("stage", "stage_completed", "stage_passed", "completed", "window_passed", "errors")}), flush=True)
    return 0 if receipt["stage_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

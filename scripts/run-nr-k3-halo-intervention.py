"""Same-grid fixed-layer intervention. Test-only, not a physical solver upgrade."""
from __future__ import annotations

import argparse
from dataclasses import replace
import hashlib
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
from science.numerical_relativity import halo_intervention as H  # noqa: E402
from science.numerical_relativity import schwarzschild_rhs_locality as L  # noqa: E402
from science.numerical_relativity import rk_stage_locality as S  # noqa: E402
from science.numerical_relativity import fo_ccz4_exterior_window as W  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import halo_mask  # noqa: E402

P = runpy.run_path(str(ROOT/"scripts/run-nr-k3-rk-stage-locality.py"))
B, NATIVE = P["B"], P["NATIVE"]
sha256, require, new_json = (P[k] for k in ("sha256", "require", "new_json"))
FLAGS, EVIDENCE = P["FLAGS"], P["EVIDENCE"]
PARENT = EVIDENCE/"nr-k3-rk-stage-locality-v1-20261008/receipt.json"
PARENT_SHA = "cd1872626f3f572bf1f2a41b528794510ec08a21e7180c606a2cc3b61eedb0e1"
INVENTORY = EVIDENCE/"nr-k3-error-localization-v1-20261008/analysis.json"
INVENTORY_SHA = "482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-halo-intervention.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/run-nr-k3-halo-intervention.py",
         "scripts/tests/test_nr_halo_intervention.py", "science/numerical_relativity/halo_intervention.py",
         "science/numerical_relativity/test_halo_intervention.py",
         "science/numerical_relativity/native_halo_intervention/CMakeLists.txt",
         "science/numerical_relativity/native_halo_intervention/probe.cpp"}
OUTPUT_LIMIT, HEADROOM = 512*1024**2, 64*1024**2
C_RESERVE, E_RESERVE = P["C_RESERVE"], P["E_RESERVE"]
OLD = {"none": ("both", 25), "low": ("upper", 21), "both": ("original", 17)}


def validate_parent(parent, inventory):
    require(parent["schema"] == "nr-schwarzschild-rk-stage-locality-v1"
            and parent["completed"] is True and parent["stage_consistency_passed"] is True
            and not parent["errors"] and parent["source_before"] == parent["source_after"],
            "completed unchanged stage parent required")
    P["coverage"](parent)
    for obj in (parent, inventory):
        require(all(obj[k] is False for k in FLAGS)
                and all(obj[k] is False for k in ("retained_original_passed", "retained_upper_passed", "retained_both_passed")),
                "retained failure/admission changed")
    require(inventory["schema"] == "nr-retained-schwarzschild-error-localization-v1"
            and inventory["completed"] is True and not inventory["errors"], "completed retained inventory required")
    rows = [r for r in inventory["inventory"] if (r["domain"], r["n"]) in OLD.values()]
    keys = [(r["domain"], r["n"], r["time"]) for r in rows]
    expected = {(domain, n, t) for domain, n in OLD.values() for t in (0., *W.TIMES)}
    require(len(keys) == len(set(keys)) == 15 and set(keys) == expected, "15 unique historical inputs required")
    require(all(inventory["input_checkpoint_hashes"].get(r["path"]) == r["sha256"] for r in rows),
            "historical input inventory differs")
    return {key: row for key, row in zip(keys, rows, strict=True)}


def coverage(result):
    rows = result["cases"]
    require([r["mode"] for r in rows] == list(H.MODES), "four ordered intervention cases required")
    for row in rows:
        require([r["step"] for r in row["samples"]] == list(H.STEPS)
                and all(r["time"] == r["step"]/256. for r in row["samples"]), "five identified samples required")
        require(row["python_first_step_passed"] is True and len(row["parity_by_slot"]) == 58
                and row["first_step_thread_bytes_equal"] is True and row["fixed_bytes_equal"] is True,
                "Python/native, thread and fixed-layer controls required")
        require(all(set(r["metrics"]) == {"H", "ricci_error"} for r in row["samples"]), "two metric fields required")
    require(rows[0]["retained_first_step_bytes_equal"] is True, "parent first-step replay required")
    keys = [(r["mode"], r["time"]) for r in result["historical_controls"]]
    require(len(keys) == len(set(keys)) == 12 and set(keys) == {(m, t) for m in OLD for t in W.TIMES}
            and all(r["bytes_equal"] is True for r in result["historical_controls"]), "12 historical byte controls required")
    keys = [(r["step"], r["metric"]) for r in result["contrasts"]]
    require(len(keys) == len(set(keys)) == 10 and set(keys) == {(s, m) for s in H.STEPS for m in ("H", "ricci_error")}
            and all(r["identity_residual"] <= H.LIMIT for r in result["contrasts"]), "ten factorial identities required")
    require(result["native_calls"] == 8, "four trajectories and four first-step serial controls required")
    require({r["label"] for r in result["negative_controls"]} == {"collision", "mode", "steps", "unknown"}
            and len(result["negative_controls"]) == 4
            and all(r["side_effect_free"] is True for r in result["negative_controls"]), "four executed negative controls required")


class Runner(P["Runner"]):
    def budget(self):
        remaining = 1800.-(time.perf_counter()-self.started)
        require(remaining > 0., "1800s intervention cap reached")
        require(shutil.disk_usage(ROOT).free >= E_RESERVE+HEADROOM
                and shutil.disk_usage("C:/").free >= C_RESERVE, "intervention disk reserve reached")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used+HEADROOM <= OUTPUT_LIMIT, "512MiB intervention output cap reached")
        return min(600., remaining)

    def trajectory(self, binary, input_path, mode, steps, threads):
        label = f"{mode}-steps{steps}-threads{threads}"
        path = self.directory/f"{label}.diagnostic"
        require(not path.exists(), "fresh intervention output required")
        out, _ = self.execute(label, [binary, "--input", input_path, "--output", path,
            "--clamp", mode, "--steps", steps, "--threads", threads])
        require(json.loads(out) == {"schema": "nr-halo-intervention-native-v1", "test_only": True,
            "points": 25, "variables": 58, "clamp": mode, "steps": steps, "records": 1 if steps == 1 else 5,
            "observed_threads": threads, "fixed_bytes_equal": True,
            "ordinary_first_step_bytes_equal": mode == "none"}, "native intervention metadata mismatch")
        self.receipt["native_calls"] += 1
        return H.read_records(path, mode, steps), path


def build(runner, result):
    instance = NATIVE["discover_instance"]()
    cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
    snapshot = runner.directory/"source-snapshot/science/numerical_relativity"
    build_dir = runner.directory/"probe-build"
    command = NATIVE["configure_command"](cmake, instance, snapshot/"native_halo_intervention", build_dir)
    command += [f"-DNR_SHADOW_SOURCE={(snapshot/'cpp/nr_k2_fo_ccz4_shadow.cpp').as_posix()}"]
    runner.execute("configure", command)
    runner.execute("build", [cmake, "--build", build_dir, "--config", "Release", "--parallel", 2])
    binary = build_dir/"Release/nr-halo-intervention.exe"
    result.update(probe_binary=str(binary), probe_sha256=sha256(binary), vs_instance=str(instance),
        cmake_sha256=sha256(cmake), bound_solver_source_sha256=sha256(snapshot/"cpp/nr_k2_fo_ccz4_shadow.cpp"))
    return binary


def negatives(runner, binary, input_path, existing):
    retained, input_sha = sha256(existing), sha256(input_path)
    for label, mode, steps, extra, reason in (
        ("collision", "none", 1, [], "output already exists"),
        ("mode", "other", 1, [], "unknown clamp mode"),
        ("steps", "none", 2, [], "steps 1 or 256"),
        ("unknown", "none", 1, ["--unknown", "1"], "unknown or duplicate")):
        output = existing if label == "collision" else runner.directory/f"negative-{label}.diagnostic"
        require(label == "collision" or not output.exists(), "fresh negative target required")
        count = len(runner.receipt["commands"])
        try:
            runner.execute("negative-"+label, [binary, "--input", input_path, "--output", output,
                "--clamp", mode, "--steps", steps, "--threads", 4, *extra])
        except ValueError:
            require(len(runner.receipt["commands"]) == count+1
                    and runner.receipt["commands"][-1]["label"] == "negative-"+label
                    and runner.receipt["commands"][-1].get("returncode") == 2, "wrong negative exit")
        else:
            raise ValueError("invalid intervention accepted")
        require(reason in (runner.directory/f"negative-{label}.log").read_text(encoding="utf-8"), "wrong negative reason")
        require(sha256(existing) == retained and sha256(input_path) == input_sha
                and (label == "collision" or not output.exists()), "negative wrote output")
        runner.receipt["negative_controls"].append({"label": label, "side_effect_free": True})


def run_cases(runner, binary, inputs, parent, result):
    seed = P["P"]["seed"]("both", 25)
    input_path = Path(inputs["both", 25, 0.]["path"])
    data = B["read"](input_path, seed)
    require(data.to_bytes() == seed.to_bytes(), "retained input differs from frozen seed")
    grid = data.domain.grid(25, 4)
    parent_row = next(r for r in parent["cases"] if r["domain"] == "both" and r["n"] == 25)
    require(sha256(Path(parent_row["trace"])) == parent_row["trace_sha256"], "parent trace drift")
    old_trace = S.read_trace(parent_row["trace"], 25)
    metric_fields = {}
    for mode in H.MODES:
        runner.budget()
        serial, serial_path = runner.trajectory(binary, input_path, mode, 1, 1)
        py = H.first_step(data, mode, B["GAUGE"])
        error = np.max(np.abs(serial[0]["q"]-py), axis=(1, 2, 3))
        require(float(error.max()) <= H.LIMIT, "Python/native first-step parity failed")
        del py
        records, path = runner.trajectory(binary, input_path, mode, 256, 4)
        replay = records[0]["q"].tobytes() == serial[0]["q"].tobytes()
        require(replay, "first-step thread replay differs")
        parent_equal = records[0]["q"].tobytes() == old_trace[-1].tobytes() if mode == "none" else None
        if mode == "none":
            require(parent_equal, "unclamped first step differs from retained stage")
            negatives(runner, binary, input_path, path)
        mask = H.clamp_mask(mode) | halo_mask(grid.shape)
        initial_fixed = np.asarray(data.slots)[:, mask].tobytes()
        row = {"mode": mode, "input": str(input_path), "input_sha256": sha256(input_path),
            "output": str(path), "sha256": sha256(path), "serial_first_step": str(serial_path),
            "serial_sha256": sha256(serial_path), "parity_by_slot": error.tolist(),
            "python_first_step_passed": True, "first_step_thread_bytes_equal": replay,
            "retained_first_step_bytes_equal": parent_equal, "fixed_bytes_equal": True,
            "fixed_nodes": int(mask.sum()), "samples": []}
        for record in records:
            runner.budget()
            step, t, q = int(record["step"]), float(record["time"]), record["q"]
            require(q[:, mask].tobytes() == initial_fixed, "fixed layer changed")
            derived = replace(data, slots=tuple(q), header={**data.header, "step": step, "time": t})
            fields, field_grid = W.audit_fields(derived)
            metric_fields[mode, step] = {k: W.core_values(fields[k], field_grid).copy() for k in ("H", "ricci_error")}
            row["samples"].append({"step": step, "time": t,
                "state_sha256": hashlib.sha256(q.tobytes()).hexdigest(),
                "metrics": {k: {"fields": v.tolist(), **H.summarize(v)} for k, v in metric_fields[mode, step].items()}})
            if mode in OLD and t in W.TIMES:
                domain, n = OLD[mode]
                item = inputs[domain, n, t]
                require(sha256(Path(item["path"])) == item["sha256"], "historical checkpoint drift")
                old = B["read"](Path(item["path"]), P["P"]["seed"](domain, n))
                require(old.header["time"] == t and old.header["dt"] == 1./256, "historical time differs")
                a = L.common_cube(q, grid, 17)
                b = L.common_cube(old.slots, old.domain.grid(n, 4), 17)
                equal = a.tobytes() == b.tobytes()
                result["historical_controls"].append({"mode": mode, "time": t,
                    "domain": domain, "n": n, "path": item["path"], "sha256": item["sha256"],
                    "bytes_equal": equal, "max_abs_difference": float(np.max(np.abs(a-b)))})
                require(equal, "historical common-cube bytes differ")
                del a, b, old
            del fields, derived
        result["cases"].append(row)
        del records, serial
        print(json.dumps({"intervention_cases": len(result["cases"]), "total": 4}), flush=True)
    for step in H.STEPS:
        for metric in ("H", "ricci_error"):
            result["contrasts"].append({"step": step, "time": step/256., "metric": metric,
                **H.factorial({mode: metric_fields[mode, step][metric] for mode in H.MODES})})
    coverage(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve()
            and not directory.exists(), "fresh E evidence child required")
    require(shutil.disk_usage(ROOT).free >= E_RESERVE+OUTPUT_LIMIT
            and shutil.disk_usage("C:/").free >= C_RESERVE, "startup disk reserve reached")
    require(sha256(PARENT) == PARENT_SHA and sha256(INVENTORY) == INVENTORY_SHA, "parent/inventory anchor changed")
    parent, inventory = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, INVENTORY))
    inputs = validate_parent(parent, inventory)
    for row in inputs.values():
        require(sha256(Path(row["path"])) == row["sha256"], "retained input changed")
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == digest, "frozen source changed: "+name)
    names = set(parent["source_after"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    directory.mkdir(parents=True)
    (directory/"compiler-temp").mkdir()
    result = {"schema": "nr-halo-intervention-coarse-v1", "completed": False,
        "operator_controls_passed": False, "commands": [], "errors": [], "cases": [], "contrasts": [],
        "historical_controls": [], "negative_controls": [], "native_calls": 0, "source_before": before,
        "parent_sha256": PARENT_SHA, "inventory_sha256": INVENTORY_SHA, "protocol_sha256": sha256(PROTOCOL),
        "input_hashes": {r["path"]: r["sha256"] for r in inputs.values()},
        "python": sys.version, "python_executable": sys.executable, "numpy": np.__version__, "platform": platform.platform(),
        "single_resolution_only": True, "test_only": True, "diagnostic_floor": H.LIMIT,
        "retained_original_passed": False, "retained_upper_passed": False, "retained_both_passed": False,
        **{k: False for k in FLAGS}}
    runner = Runner(directory, result)
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "source snapshot drift")
        binary = build(runner, result)
        run_cases(runner, binary, inputs, parent, result)
        require(all(sha256(Path(p)) == digest for p, digest in result["input_hashes"].items()), "input changed during run")
        require(sha256(PARENT) == PARENT_SHA and sha256(INVENTORY) == INVENTORY_SHA, "parent changed during run")
        result["completed"] = result["operator_controls_passed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
    if result["source_after"] != before:
        result["errors"].append("source changed during experiment")
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    try:
        runner.budget()
    except Exception as error:
        result["errors"].append(f"finalization {type(error).__name__}: {error}")
    result["completed"] &= not result["errors"]
    result["operator_controls_passed"] &= not result["errors"]
    result["seconds"] = time.perf_counter()-runner.started
    require(len(json.dumps(result, allow_nan=False).encode("utf-8")) < 16*1024**2, "receipt exceeds reserved size")
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "operator_controls_passed", "errors")}), flush=True)
    return 0 if result["completed"] and result["operator_controls_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

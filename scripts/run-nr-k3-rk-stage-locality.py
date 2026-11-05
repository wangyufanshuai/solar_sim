"""Nine first-step traces; no solver edits, live admission or old-gate changes."""
from __future__ import annotations

import argparse
from dataclasses import replace
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
from science.numerical_relativity import rk_stage_locality as S  # noqa: E402
from science.numerical_relativity import schwarzschild_rhs_locality as L  # noqa: E402
from science.numerical_relativity import fo_ccz4_exterior_window as W  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import state_slots  # noqa: E402
from science.numerical_relativity.fo_ccz4_lapse_constraint_balance import rhs_slots  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import (  # noqa: E402
    FOCCZ4Config, fo_ccz4_rhs_3d, _state_add, _state_rk4_update,
)
from science.numerical_relativity.fo_ccz4_schwarzschild import BOUNDARY, halo_mask  # noqa: E402

P = runpy.run_path(str(ROOT/"scripts/run-nr-k3-initial-rhs-locality.py"))
B, NATIVE = P["B"], P["PROBE"]["NATIVE"]
sha256, require, new_json = (P[k] for k in ("sha256", "require", "new_json"))
TRIPLES, NAMES, PAIRS, FLAGS = (P[k] for k in ("TRIPLES", "NAMES", "PAIRS", "FLAGS"))
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PARENT = EVIDENCE/"nr-k3-initial-rhs-locality-v1-20261008/receipt.json"
PARENT_SHA = "015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-rk-stage-locality.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/run-nr-k3-rk-stage-locality.py",
         "scripts/tests/test_nr_rk_stage_locality.py",
         "science/numerical_relativity/rk_stage_locality.py",
         "science/numerical_relativity/test_rk_stage_locality.py",
         "science/numerical_relativity/native_stage_probe/CMakeLists.txt",
         "science/numerical_relativity/native_stage_probe/probe.cpp"}
OUTPUT_LIMIT, HEADROOM = 2*1024**3, 512*1024**2
C_RESERVE, E_RESERVE = P["C_RESERVE"], P["E_RESERVE"]


def validate_parent(parent):
    require(parent["schema"] == "nr-schwarzschild-initial-rhs-locality-v1"
            and parent["completed"] is True and parent["operator_consistency_passed"] is True
            and not parent["errors"] and parent["source_before"] == parent["source_after"],
            "completed unchanged initial-RHS parent required")
    require(all(parent[k] is False for k in FLAGS)
            and all(parent[k] is False for k in ("retained_original_passed", "retained_upper_passed", "retained_both_passed")),
            "old admission/failure changed")
    P["complete_coverage"](parent)
    return {(r["domain"], r["n"]): r for r in parent["cases"]}


def coverage(result):
    expected = {(name, n) for ns in TRIPLES for name, n in zip(NAMES, ns, strict=True)}
    actual = [(r["domain"], r["n"]) for r in result["cases"]]
    require(len(actual) == len(set(actual)) == 9 and set(actual) == expected, "nine stage cases required")
    for row in result["cases"]:
        require([v["label"] for v in row["stages"]] == list(S.LABELS)
                and all(len(v["parity_by_slot"]) == 58 for v in row["stages"]), "eight complete stage blocks required")
        require(row["k1_bytes_equal"] is True and row["ordinary_step_bytes_equal"] is True,
                "retained k1 and ordinary final-step byte controls required")
    expected_pairs = {(ns[0], a, b, label) for ns in TRIPLES for a, b in PAIRS for label in S.LABELS}
    actual_pairs = [(r["original_n"], r["left_domain"], r["right_domain"], r["label"]) for r in result["pairs"]]
    require(len(actual_pairs) == len(set(actual_pairs)) == 48 and set(actual_pairs) == expected_pairs,
            "48 distinct stage pairs required")
    for row in result["pairs"]:
        require(set(row["regions"]) == {"active", "core", "lower_only", "upper_only", "mixed_lower_upper",
                    "depth_1_2", "depth_3_4", "depth_5_6", "depth_7_plus"}, "nine stage regions required")
        require(all([v["slot"] for v in r["slot_norms"]] == list(range(58)) for r in row["regions"].values()),
                "all 58 difference slots required")
    metric_pairs = [(r["original_n"], r["left_domain"], r["right_domain"]) for r in result["final_metric_pairs"]]
    require(len(metric_pairs) == len(set(metric_pairs)) == 6
            and set(metric_pairs) == {(ns[0], a, b) for ns in TRIPLES for a, b in PAIRS}
            and all(set(r["metrics"]) == {"H", "ricci_error"} for r in result["final_metric_pairs"]),
            "six complete metric pairs required")
    require(result["trace_calls"] == 10
            and result["thread_replay"]["bytes_equal"] is True, "six metric pairs and ten replayed traces required")
    require({r["label"] for r in result["negative_controls"]} == {"collision", "threads", "unknown"}
            and len(result["negative_controls"]) == 3
            and all(r["side_effect_free"] is True for r in result["negative_controls"]), "three negative controls required")


class Runner(P["Runner"]):
    def budget(self):
        # Subtract from the represented deadline so cancellation cannot leave
        # a positive allowance at exactly started+900. No grace interval.
        remaining = (self.started+900.)-time.perf_counter()
        require(remaining > 0., "900s stage locality cap reached")
        require(shutil.disk_usage(ROOT).free >= E_RESERVE+HEADROOM
                and shutil.disk_usage("C:/").free >= C_RESERVE, "stage locality disk reserve reached")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used+HEADROOM <= OUTPUT_LIMIT, "2GiB stage output cap reached")
        return min(180., remaining)

    def trace(self, binary, name, n, path, threads=4):
        label = f"{name}-n{n}-threads{threads}"
        output = self.directory/f"{label}.trace"
        require(not output.exists(), "fresh stage output required")
        stdout, _ = self.execute(label, [binary, "--input", path, "--output", output, "--threads", threads])
        require(json.loads(stdout) == {"schema_version": "nr-rk4-stage-inspection-v1", "test_only": True,
                "evolution_steps": 1, "observed_threads": threads, "points": n, "variable_count": 58,
                "blocks": 8, "ordinary_step_bytes_equal": True}, "stage probe provenance mismatch")
        self.receipt["trace_calls"] += 1
        return S.read_trace(output, n), output


def build(runner, result):
    instance = NATIVE["discover_instance"]()
    cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
    snapshot = runner.directory/"source-snapshot/science/numerical_relativity"
    build_dir = runner.directory/"probe-build"
    command = NATIVE["configure_command"](cmake, instance, snapshot/"native_stage_probe", build_dir)
    command += [f"-DNR_SHADOW_SOURCE={(snapshot/'cpp/nr_k2_fo_ccz4_shadow.cpp').as_posix()}"]
    runner.execute("configure", command)
    runner.execute("build", [cmake, "--build", build_dir, "--config", "Release", "--parallel", 2])
    binary = build_dir/"Release/nr-rk4-stage-probe.exe"
    result.update(probe_binary=str(binary), probe_sha256=sha256(binary), vs_instance=str(instance),
                  cmake_sha256=sha256(cmake), bound_solver_source_sha256=sha256(snapshot/"cpp/nr_k2_fo_ccz4_shadow.cpp"))
    return binary


def python_blocks(data):
    state, dt = data.to_state(), data.header["dt"]
    def rhs(value):
        return fo_ccz4_rhs_3d(value, gauge=B["GAUGE"], gauge_profile=data.profile,
                              config=FOCCZ4Config(tau_inverse=data.tau_inverse), boundary_mode=BOUNDARY)
    k1 = rhs(state)
    yield rhs_slots(k1)
    stage = _state_add(state, k1, .5*dt)
    yield state_slots(stage)
    k2 = rhs(stage)
    yield rhs_slots(k2)
    stage = _state_add(state, k2, .5*dt)
    yield state_slots(stage)
    k3 = rhs(stage)
    yield rhs_slots(k3)
    stage = _state_add(state, k3, dt)
    yield state_slots(stage)
    k4 = rhs(stage)
    yield rhs_slots(k4)
    yield state_slots(_state_rk4_update(state, dt, k1, k2, k3, k4))


def negatives(runner, binary, input_path, existing):
    retained = sha256(existing)
    input_sha = sha256(input_path)
    for label, threads, extra in (("collision", 4, []), ("threads", 2, []), ("unknown", 4, ["--unknown", "1"])):
        output = existing if label == "collision" else runner.directory/f"negative-{label}.trace"
        if label != "collision":
            require(not output.exists(), "fresh negative target required")
        count = len(runner.receipt["commands"])
        try:
            runner.execute("negative-"+label, [binary, "--input", input_path, "--output", output, "--threads", threads, *extra])
        except ValueError:
            require(len(runner.receipt["commands"]) == count+1
                    and runner.receipt["commands"][-1]["label"] == "negative-"+label
                    and runner.receipt["commands"][-1].get("returncode") == 2, "wrong negative exit")
        else:
            raise ValueError("negative trace was accepted")
        message = {"collision": "output already exists", "threads": "threads 1 or 4", "unknown": "unknown or duplicate"}[label]
        require(message in (runner.directory/f"negative-{label}.log").read_text(encoding="utf-8"), "wrong negative reason")
        require(sha256(input_path) == input_sha and sha256(existing) == retained
                and (label == "collision" or not output.exists()), "negative wrote output")
        runner.receipt["negative_controls"].append({"label": label, "side_effect_free": True})


def run_cases(runner, binary, inputs, result):
    for ns in TRIPLES:
        common, metrics = {}, {}
        for name, n in zip(NAMES, ns, strict=True):
            runner.budget()
            old = inputs[name, n]
            path = Path(old["input"])
            require(sha256(path) == old["input_sha256"] and sha256(Path(old["rhs"])) == old["rhs_sha256"], "retained input/RHS drift")
            expected = P["seed"](name, n)
            data = B["read"](path, expected)
            require(data.to_bytes() == expected.to_bytes(), "initial checkpoint differs")
            grid = data.domain.grid(n, 4)
            trace, output = runner.trace(binary, name, n, path)
            old_rhs = L.fields(P["PROBE"]["read_rhs"](Path(old["rhs"]).read_bytes(), n))
            require(trace[0].tobytes() == old_rhs.tobytes(), "k1 differs from retained instantaneous RHS")
            del old_rhs, expected
            mask = halo_mask(grid.shape)
            initial_halo = np.asarray(data.slots)[:, mask].tobytes()
            row = {"domain": name, "n": n, "input": str(path), "input_sha256": old["input_sha256"],
                   "trace": str(output), "trace_sha256": sha256(output), "k1_bytes_equal": True,
                   "ordinary_step_bytes_equal": True, "stages": []}
            common[name] = {}
            for index, (label, py_values) in enumerate(zip(S.LABELS, python_blocks(data), strict=True)):
                print(json.dumps({"phase": "python-stage", "domain": name, "n": n, "stage": label}), flush=True)
                runner.budget()
                py, native = L.fields(py_values), L.fields(trace[index])
                error = np.max(np.abs(native-py), axis=(1, 2, 3))
                is_rhs = label.startswith("k")
                halo_ok = bool(np.all(native[:, mask] == 0.) and np.all(py[:, mask] == 0.)) if is_rhs else native[:, mask].tobytes() == initial_halo
                row["stages"].append({"label": label, "parity_by_slot": error.tolist(),
                    "parity_max_abs": float(error.max()), "parity_passed": bool(error.max() <= S.LIMIT), "halo_passed": halo_ok})
                common[name][label] = L.common_cube(native, grid, ns[0])
                del py, native, py_values
            final = replace(data, slots=tuple(trace[-1]), header={**data.header, "time": data.header["dt"], "step": 1})
            fields, final_grid = W.audit_fields(final)
            metrics[name] = {k: W.core_values(fields[k], final_grid).copy() for k in ("H", "ricci_error")}
            row["final_metric_core_fields"] = {k: v.tolist() for k, v in metrics[name].items()}
            del fields, final, data
            result["cases"].append(row)
            if name == "original" and n == 17:
                serial, serial_path = runner.trace(binary, name, n, path, threads=1)
                result["thread_replay"] = {"bytes_equal": sha256(output) == sha256(serial_path),
                    "serial_trace": str(serial_path), "sha256": sha256(serial_path)}
                del serial
                negatives(runner, binary, path, output)
            del trace
            print(json.dumps({"stage_cases": len(result["cases"]), "total": 9}), flush=True)
        for left, right in PAIRS:
            for label in S.LABELS:
                result["pairs"].append({"original_n": ns[0], "left_domain": left, "right_domain": right, "label": label,
                    **S.compare_stage(common[left][label], common[right][label], label, "high" if left == "upper" else "low")})
            result["final_metric_pairs"].append({"original_n": ns[0], "left_domain": left, "right_domain": right,
                "metrics": {k: {"fields": (metrics[left][k]-metrics[right][k]).tolist(),
                    "rms_difference": float(np.sqrt(np.mean((metrics[left][k]-metrics[right][k])**2))),
                    "max_abs_difference": float(np.max(np.abs(metrics[left][k]-metrics[right][k])))} for k in metrics[left]}})
    coverage(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve()
            and not directory.exists(), "fresh E evidence child required")
    require(shutil.disk_usage(ROOT).free >= E_RESERVE+OUTPUT_LIMIT
            and shutil.disk_usage("C:/").free >= C_RESERVE, "startup disk reserve reached")
    require(sha256(PARENT) == PARENT_SHA, "initial RHS anchor changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    inputs = validate_parent(parent)
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == digest, "frozen source changed: "+name)
    names = set(parent["source_after"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    directory.mkdir(parents=True)
    (directory/"compiler-temp").mkdir()
    result = {"schema": "nr-schwarzschild-rk-stage-locality-v1", "completed": False,
        "stage_consistency_passed": False, "commands": [], "errors": [], "cases": [], "pairs": [],
        "final_metric_pairs": [], "negative_controls": [], "thread_replay": {}, "trace_calls": 0,
        "source_before": before, "parent_sha256": PARENT_SHA, "protocol_sha256": sha256(PROTOCOL),
        "python": sys.version, "python_executable": sys.executable, "numpy": np.__version__, "platform": platform.platform(),
        "evolution_steps_per_trace": 1, "ordinary_step_control_per_trace": 1,
        "diagnostic_floor": S.LIMIT, "retained_original_passed": False, "retained_upper_passed": False,
        "retained_both_passed": False, **{k: False for k in FLAGS}}
    runner = Runner(directory, result)
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "source snapshot drift")
        binary = build(runner, result)
        run_cases(runner, binary, inputs, result)
        require(all(sha256(Path(r["input"])) == r["input_sha256"] for r in inputs.values()), "initial input changed")
        require(sha256(PARENT) == PARENT_SHA, "parent changed during experiment")
        result["completed"] = True
        result["stage_consistency_passed"] = all(s["parity_passed"] and s["halo_passed"] for r in result["cases"] for s in r["stages"]) and all(r["support_consistency_passed"] for r in result["pairs"])
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
    result["stage_consistency_passed"] &= not result["errors"]
    result["seconds"] = time.perf_counter()-runner.started
    require(len(json.dumps(result, indent=2, sort_keys=True, allow_nan=False).encode("utf-8")) < 16*1024**2,
            "stage receipt exceeds reserved headroom; raw outputs retained")
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "stage_consistency_passed", "errors")}), flush=True)
    return 0 if result["completed"] and result["stage_consistency_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

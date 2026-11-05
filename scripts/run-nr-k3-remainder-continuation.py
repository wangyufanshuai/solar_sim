"""Explicit continuation of a terminal, timed-out frozen campaign; no discarded data."""
from __future__ import annotations

import argparse
from copy import deepcopy
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import runpy
import shutil
import subprocess
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MAIN = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fo-ccz4-nonlinear-remainder.py"))
CASES, TIMES = MAIN["CASES"], MAIN["TIMES"]
sha256, write_json = MAIN["sha256"], MAIN["write_json"]
decode, PROFILE = MAIN["decode_checkpoint"], MAIN["PROFILE"]
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-remainder-continuation.md"
TIME_LIMIT, OUTPUT_LIMIT = 600., 32*1024**2


def windows_process_alive(pid):
    if os.name != "nt":
        raise RuntimeError("Windows process identity check required")
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
    kernel.GetExitCodeProcess.restype = wintypes.BOOL
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL
    handle = kernel.OpenProcess(0x1000, False, pid)
    if not handle:
        error = ctypes.get_last_error()
        if error in (87, 1168):  # Invalid/nonexistent process; denial is not termination.
            return False
        raise OSError(error, "cannot establish parent process state")
    try:
        code = wintypes.DWORD()
        if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
            raise OSError(ctypes.get_last_error(), "parent exit-code query failed")
        return code.value == 259
    finally:
        kernel.CloseHandle(handle)


def require_stopped(pid, alive=windows_process_alive):
    if isinstance(pid, bool) or not isinstance(pid, int) or not 0 < pid < 2**32:
        raise ValueError("explicit positive parent PID required")
    if alive(pid):
        raise RuntimeError("original campaign is still alive; do not restart or continue")


def validate_prefix(rows):
    if len(rows) > len(CASES) or [MAIN["case_key"](r) for r in rows] != list(CASES[:len(rows)]):
        raise ValueError("parent cases must be the exact ordered frozen prefix")
    for i, row in enumerate(rows):
        size = len(row["samples"])
        if not 1 <= size <= 9 or (i < len(rows)-1 and size != 9):
            raise ValueError("only the last parent case may be incomplete")
        if (row["dt"] != 1./row["steps"]
                or tuple(s["time"] for s in row["samples"]) != TIMES[:size]
                or tuple(s["step"] for s in row["samples"]) != tuple(int(t*row["steps"]) for t in TIMES[:size])):
            raise ValueError("parent samples must be an unbroken frozen time/step prefix")


def validate_parent(path, expected_sha):
    if sha256(path) != expected_sha:
        raise ValueError("parent receipt hash mismatch")
    value = json.loads(path.read_text(encoding="utf-8"))
    if (value.get("schema_version") != "nr-k3-nonlinear-remainder-v1" or value.get("completed") is not False
            or value.get("identity_unchanged") is not True or value.get("origin_artifacts_unchanged") is not True
            or value["identity_before"] != value["identity_after"] or not value.get("errors")
            or any(e["type"] not in ("TimeoutExpired", "TimeoutError") for e in value["errors"])):
        raise ValueError("only a terminal unchanged timeout receipt may be continued")
    for name, expected in value["identity_before"]["source"].items():
        source = (ROOT/name).resolve()
        if not source.is_relative_to(ROOT) or sha256(source) != expected:
            raise ValueError(f"parent source drift: {name}")
    for name, expected in value["artifact_hashes"].items():
        artifact = (path.parent/name).resolve()
        if not artifact.is_relative_to(path.parent) or sha256(artifact) != expected:
            raise ValueError(f"parent artifact drift: {name}")
    binary = MAIN["validate_origin"](Path(value["origin"]))
    if str(binary) != value["binary"] or sha256(binary) != value["identity_before"]["binary_sha256"]:
        raise ValueError("parent binary drift")
    validate_prefix(value["cases"])
    # Only explicitly recorded, fully decoded checkpoints may seed continuation.
    for row in value["cases"]:
        paths = [row["initial_checkpoint"]]+[s["checkpoint"] for s in row["samples"][1:]]
        for i, name in enumerate(paths):
            checkpoint_path = Path(name).resolve()
            relative = checkpoint_path.relative_to(path.parent).as_posix()
            if relative not in value["artifact_hashes"]:
                raise ValueError("unbound parent checkpoint")
            cp = decode(checkpoint_path.read_bytes(), expected_profile=PROFILE)
            if (cp.header["points"] != row["points"] or cp.header["amplitude"] != row["amplitude"]
                    or cp.header["dt"] != row["dt"] or cp.header["time"] != TIMES[i]
                    or cp.header["step"] != int(TIMES[i]*row["steps"])):
                raise ValueError("parent checkpoint metadata does not match recorded sample")
    return value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parent", type=Path, required=True)
    parser.add_argument("--parent-sha256", required=True)
    parser.add_argument("--parent-pid", type=int, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    require_stopped(args.parent_pid)
    parent_path, directory = args.parent.resolve(), args.output_directory.resolve()
    parent = validate_parent(parent_path, args.parent_sha256)
    binary = Path(parent["binary"])
    if directory.exists() or shutil.disk_usage(directory.parent).free < 1024**3+OUTPUT_LIMIT:
        raise SystemExit("fresh directory and reserved disk capacity required")
    directory.mkdir()
    started = time.perf_counter()

    def identity():
        source = MAIN["source_identity"]()
        for p in (Path(__file__).resolve(), ROOT/"scripts/tests/test_nr_remainder_continuation.py"):
            source[p.relative_to(ROOT).as_posix()] = sha256(p)
        return {"source": source, "binary_sha256": sha256(binary), "parent_sha256": sha256(parent_path),
                "protocol_sha256": sha256(PROTOCOL), "original_frozen_protocol_sha256": parent["identity_before"]["protocol_sha256"]}

    before = identity()
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result = {"schema_version": "nr-k3-remainder-continuation-v1", "parent_receipt": str(parent_path),
              "parent_completed": False, "parent_errors_retained": parent["errors"],
              "parent_process_confirmed_stopped": True, "parent_pid": args.parent_pid,
              "identity_before": before, "cases": deepcopy(parent["cases"]), "commands": [], "errors": [],
              "completed": False, "bounded_remainder_gates_passed": False,
              **{key: False for key in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "nonlinear_initialization_promoted",
                 "runtime_writeback", "scientificPayloadWriteback")}}
    write_json(directory/"frozen-input.json", {"identity": before, "cases": CASES, "times": TIMES,
               "parent_samples_per_case": [len(r["samples"]) for r in parent["cases"]], "hard_timeout_seconds": TIME_LIMIT})

    def run_native(name, path, steps):
        remaining = TIME_LIMIT-(time.perf_counter()-started)
        if remaining <= 0.:
            raise TimeoutError("continuation time budget exhausted; no retry")
        if (shutil.disk_usage(directory).free < 1024**3+4*1024**2
                or sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) > OUTPUT_LIMIT-4*1024**2):
            raise OSError("continuation disk budget exhausted")
        h = decode(path.read_bytes(), expected_profile=PROFILE).header
        output, manifest = directory/f"{name}.bin", directory/f"{name}.json"
        command = [str(binary), "--points", str(h["points"]), "--steps", str(steps), "--threads", "4",
                   "--dt", repr(h["dt"]), "--scenario", "gauge-wave", "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow",
                   "--amplitude", repr(h["amplitude"]), "--wavelength", "1", "--gauge-profile", "state-dependent-v1",
                   "--shift-scale", "3", "--ordering-scale", ".2", "--restart", str(path),
                   "--checkpoint", str(output), "--manifest", str(manifest)]
        print(json.dumps({"continuation": name, "from_step": h["step"], "steps": steps}), flush=True)
        try:
            process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, errors="replace", timeout=min(180., remaining))
        except subprocess.TimeoutExpired as exc:
            def as_text(x):
                return x.decode("utf-8", errors="replace") if isinstance(x, bytes) else (x or "")
            with (directory/f"{name}.log").open("x", encoding="utf-8") as stream:
                stream.write(as_text(exc.stdout)+"\n[timeout stderr]\n"+as_text(exc.stderr))
            result["commands"].append({"command": command, "timed_out": True})
            raise
        with (directory/f"{name}.log").open("x", encoding="utf-8") as stream:
            stream.write(process.stdout+"\n[stderr]\n"+process.stderr)
        result["commands"].append({"command": command, "returncode": process.returncode})
        if process.returncode:
            raise RuntimeError(process.stderr.strip())
        cp = decode(output.read_bytes(), expected_profile=PROFILE)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        MAIN["validate_fo_ccz4_cpp_manifest"](payload, expected_solver_mode="fo-ccz4-rhs-shadow-rk4", expected_profile=PROFILE)
        step, t = h["step"]+steps, h["time"]+steps*h["dt"]
        if (cp.header != {**h, "step": step, "time": t} or payload["kernel_version"] != "0.2.0"
                or payload["grid"]["shape"] != [h["points"]]*3
                or payload["diagnostics"]["step"] != step or payload["diagnostics"]["time"] != t):
            raise ValueError("continuation output metadata mismatch")
        return cp, output

    try:
        for index, (family, n, amplitude, steps) in enumerate(CASES):
            label = f"{family}-n{n}-a{amplitude}-s{steps}"
            if index == len(result["cases"]):
                initial = MAIN["initial_checkpoint"](n, amplitude, steps)
                path = directory/f"{label}-initial.bin"
                with path.open("xb") as stream:
                    stream.write(initial.to_bytes())
                result["cases"].append({"family": family, "points": n, "amplitude": amplitude, "steps": steps,
                    "dt": 1./steps, "initial_checkpoint": str(path), "other_55_initial_slots_byte_identical": True,
                    "samples": [MAIN["sample"](initial)]})
            row = result["cases"][index]
            if family == "time":
                a = decode(Path(row["initial_checkpoint"]).read_bytes(), expected_profile=PROFILE)
                b = decode(Path(result["cases"][1]["initial_checkpoint"]).read_bytes(), expected_profile=PROFILE)
                if any(x.tobytes() != y.tobytes() for x, y in zip(a.slots, b.slots)):
                    raise ValueError("time-step control initial fields differ")
                result["temporal_initial_slots_equal"] = True
            if len(row["samples"]) == 9:
                continue
            path = Path(row["samples"][-1]["checkpoint"] if len(row["samples"]) > 1 else row["initial_checkpoint"])
            for target_time in TIMES[len(row["samples"]):]:
                name = f"{label}-step{int(target_time*steps)}"
                cp, path = run_native(name, path, steps//8)
                observation = {**MAIN["sample"](cp), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
                row["samples"].append(observation)
                write_json(directory/f"{name}-diagnostics.json", observation)
            write_json(directory/f"{label}-row.json", row)
        path = Path(result["cases"][0]["samples"][-1]["checkpoint"])
        initial = decode(path.read_bytes(), expected_profile=PROFILE)
        actual, _ = run_native("space-n9-python-continuation", path, 1)
        reference = MAIN["advance_fo_ccz4_rk4_3d"](initial.to_state(), initial.header["dt"], gauge=MAIN["GAUGE"], gauge_profile=PROFILE)
        error = max(float(np.max(abs(a-b))) for a, b in zip(MAIN["state_slots"](reference), actual.slots))
        result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}
        result["assessment"] = MAIN["assess_remainder"](result["cases"])
        result["completed"] = True
        result["bounded_remainder_gates_passed"] = bool(result["assessment"]["bounded_remainder_gates_passed"]
            and result["python_continuation"]["passed"] and result["temporal_initial_slots_equal"])
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["identity_after"] = identity()
        result["identity_unchanged"] = before == result["identity_after"]
        validate_parent(parent_path, args.parent_sha256)
        result["parent_artifacts_unchanged"] = True
    except Exception as exc:
        result["identity_unchanged"] = False
        result["parent_artifacts_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["bounded_remainder_gates_passed"] &= result["identity_unchanged"] and result["parent_artifacts_unchanged"]
    result["elapsed_seconds"] = time.perf_counter()-started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    write_json(directory/"receipt.json", result)
    print(json.dumps({"receipt": str(directory/"receipt.json"), "completed": result["completed"],
                      "bounded_remainder_gates_passed": result["bounded_remainder_gates_passed"], "errors": result["errors"]}), flush=True)
    return 0 if result["completed"] and result["identity_unchanged"] and result["parent_artifacts_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

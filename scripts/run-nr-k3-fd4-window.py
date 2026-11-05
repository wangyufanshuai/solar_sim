"""Prospective FD4 nonlinear constraint window using the bound native 0.3.0."""
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
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, Grid3D, advance_fo_ccz4_rk4_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_fd4_window import assess_fd4_window  # noqa: E402
from science.numerical_relativity.fo_ccz4_linear_modes import (  # noqa: E402
    GAUGE, PROFILE, connection_consistent_initial_checkpoint,
)
from science.numerical_relativity.fo_ccz4_remainder import CASES, TIMES, case_key  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

STENCIL = runpy.run_path(str(ROOT / "scripts/run-nr-k3-spatial-order.py"))
REMAINDER = runpy.run_path(str(ROOT / "scripts/run-nr-k3-fo-ccz4-nonlinear-remainder.py"))
sha256, require, new_json = (STENCIL[name] for name in ("sha256", "require", "new_json"))
ORIGIN_SHA = "cfa93ce5617ebf7f78a7ed42e4563e6668c4e23bea9da5b3b65f77ad71a26cb7"
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261007-fd4-window.md"
HARD_TIMEOUT, PROCESS_TIMEOUT = 1200., 180.
OUTPUT_LIMIT, RESERVED_BYTES, INFLIGHT_BYTES = 192*1024**2, 1024**3, 12*1024**2
NEW_FILES = (
    "science/numerical_relativity/fo_ccz4_fd4_window.py",
    "science/numerical_relativity/test_fo_ccz4_fd4_window.py",
    "scripts/run-nr-k3-fd4-window.py", "scripts/tests/test_nr_fd4_window.py",
)


def validate_origin(path):
    require(sha256(path) == ORIGIN_SHA, "origin does not match the predeclared SHA-256")
    origin = json.loads(path.read_text(encoding="utf-8"))
    require(origin.get("schema_version") == "nr-k3-spatial-order-v1"
            and origin.get("completed") is True and origin.get("passed") is True
            and origin["source_before"] == origin["source_after"], "verified FD4 origin required")
    for name, digest in origin["source_before"].items():
        source = (ROOT/name).resolve()
        require(source.is_relative_to(ROOT) and sha256(source) == digest, f"origin source drift: {name}")
    for name, digest in origin["artifact_hashes"].items():
        artifact = (path.parent/name).resolve()
        require(artifact.is_relative_to(path.parent) and sha256(artifact) == digest, f"origin artifact drift: {name}")
    binary = Path(origin["binary"])
    require(sha256(binary) == origin["binary_sha256"], "origin binary drift")
    return origin, binary


def source_identity(origin):
    names = set(origin["source_before"]) | set(NEW_FILES)
    return {name: sha256(ROOT/name) for name in sorted(names)}


def initial_checkpoint(n, amplitude, steps):
    grid = Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=4)
    base = BSSNState3D.gauge_wave(grid, amplitude=amplitude, wavelength=1.)
    raw = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE,
                                dt=1./steps, scenario=1, amplitude=amplitude, wavelength=1.)
    adjusted = connection_consistent_initial_checkpoint(raw)
    require(raw.header == adjusted.header and all(a.tobytes() == b.tobytes()
            for i, (a, b) in enumerate(zip(raw.slots, adjusted.slots)) if i not in (19, 20, 21)),
            "connection control changed another initial slot/header")
    return adjusted


def sample(checkpoint):
    require(checkpoint.header["spatial_order"] == 4 and checkpoint.header["version"] == 3,
            "FD4 diagnostics require v3/order 4")
    state = checkpoint.to_state()
    require(state.grid.spatial_order == state.auxiliary.derivative_order == 4,
            "restored diagnostic/auxiliary order mismatch")
    return {**REMAINDER["sample"](checkpoint), "spatial_order": 4,
            "checkpoint_version": 3, "auxiliary_derivative_order": 4}


def native_command(binary, data, path, output, manifest, steps, threads):
    h = data.header
    return [binary, "--points", h["points"], "--steps", steps, "--threads", threads,
            "--dt", h["dt"], "--scenario", "gauge-wave", "--formulation", "ccz4",
            "--solver-mode", "fo-rhs-shadow", "--amplitude", h["amplitude"], "--wavelength", 1,
            "--gauge-profile", "state-dependent-v1", "--shift-scale", 3, "--ordering-scale", .2,
            "--spatial-order", 4, "--restart", path, "--checkpoint", output, "--manifest", manifest]


def validate_output(data, raw, payload, steps):
    observed = decode_checkpoint(raw, expected_profile=PROFILE, expected_spatial_order=4)
    validate_fo_ccz4_cpp_manifest(payload, expected_profile=PROFILE, expected_spatial_order=4,
                                 expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
    STENCIL["verify_manifest_checksums"](raw, payload)
    h = data.header
    target = {**h, "step": h["step"]+steps, "time": h["time"]+steps*h["dt"]}
    require(observed.header == target, "native output header differs from requested evolution")
    require(payload["diagnostics"]["step"] == target["step"]
            and payload["diagnostics"]["time"] == target["time"]
            and payload["grid"]["shape"] == [h["points"]]*3
            and payload["grid"]["dt"] == h["dt"]
            and payload["grid"]["spacing"] == [1./h["points"]]*3
            and payload["kernel_version"] == "0.3.0", "native manifest evolution metadata mismatch")
    return observed


class Runner(STENCIL["TOPO"]["BoundedRun"]):
    def budget(self):
        remaining = HARD_TIMEOUT-(time.perf_counter()-self.started)
        require(remaining > 0., "predeclared 20-minute budget exhausted")
        require(shutil.disk_usage(self.directory).free >= RESERVED_BYTES+INFLIGHT_BYTES,
                "reserved disk capacity exhausted")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used+INFLIGHT_BYTES <= OUTPUT_LIMIT, "predeclared output capacity exhausted")
        return min(PROCESS_TIMEOUT, remaining)

    def native(self, label, binary, path, steps, threads=4):
        data = decode_checkpoint(path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
        output, manifest = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        command = native_command(binary, data, path, output, manifest, steps, threads)
        self.execute(label, command)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        return validate_output(data, output.read_bytes(), payload, steps), output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    origin_path, directory = args.origin.resolve(), args.output_directory.resolve()
    origin, binary = validate_origin(origin_path)
    require(not directory.exists(), "choose a fresh directory; nothing overwritten")
    require(shutil.disk_usage(directory.parent).free >= RESERVED_BYTES+OUTPUT_LIMIT,
            "insufficient reserved disk capacity; nothing written")
    before = source_identity(origin)
    directory.mkdir()
    result = {"schema_version": "nr-k3-fd4-window-v1", "source_before": before,
              "origin": str(origin_path), "origin_sha256": ORIGIN_SHA,
              "binary": str(binary), "binary_sha256": sha256(binary),
              "profile": PROFILE.identity(), "cases": [], "commands": [], "errors": [],
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              "completed": False, "sampled_fd4_window_gates_passed": False,
              **{name: False for name in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "nonlinear_initialization_promoted",
                 "continuous_window_convergence_validated", "runtime_writeback", "scientificPayloadWriteback")}}
    runner = Runner(directory, result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json", {"cases": CASES, "times": TIMES, "spatial_order": 4,
             "hard_timeout_seconds": HARD_TIMEOUT, "process_timeout_seconds": PROCESS_TIMEOUT,
             "output_limit_bytes": OUTPUT_LIMIT, "disk_reserve_bytes": RESERVED_BYTES,
             "source": before, "binary_sha256": result["binary_sha256"], "origin_sha256": ORIGIN_SHA})
    try:
        for family, n, amplitude, steps in CASES:
            runner.budget()
            label = f"{family}-n{n}-a{amplitude}-s{steps}"
            initial = initial_checkpoint(n, amplitude, steps)
            path = directory/f"{label}-initial.bin"
            STENCIL["write_checkpoint"](path, initial)
            if family == "time":
                baseline = next(r for r in result["cases"] if case_key(r) == ("space", 13, amplitude, 512))
                old = decode_checkpoint(Path(baseline["initial_checkpoint"]).read_bytes(),
                                        expected_profile=PROFILE, expected_spatial_order=4)
                require(all(a.tobytes() == b.tobytes() for a, b in zip(initial.slots, old.slots)),
                        "time-step control changed initial fields")
                result["temporal_initial_slots_equal"] = True
            row = {"family": family, "points": n, "amplitude": amplitude, "steps": steps,
                   "dt": 1./steps, "spatial_order": 4, "initial_checkpoint": str(path),
                   "other_55_initial_slots_byte_identical": True, "samples": [sample(initial)]}
            result["cases"].append(row)
            for target_time in TIMES[1:]:
                name = f"{label}-step{int(target_time*steps)}"
                checkpoint, path = runner.native(name, binary, path, steps//8)
                observation = {**sample(checkpoint), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
                row["samples"].append(observation)
                new_json(directory/f"{name}-diagnostics.json", observation)
            new_json(directory/f"{label}-row.json", row)
            print(json.dumps({"case_complete": label, "sample_count": len(row["samples"])}), flush=True)
        # Repeat N9 as unsplit full runs, including an actual single-thread execution.
        row = result["cases"][0]
        expected_path = Path(row["samples"][-1]["checkpoint"])
        result["replays"] = []
        for threads in (1, 4):
            _, path = runner.native(f"direct-n9-threads{threads}", binary, Path(row["initial_checkpoint"]), 512, threads)
            equal = [path.read_bytes() == expected_path.read_bytes(),
                     path.with_suffix(".json").read_bytes() == expected_path.with_suffix(".json").read_bytes()]
            result["replays"].append({"threads": threads, "checkpoint_equal": equal[0], "manifest_equal": equal[1]})
        state = decode_checkpoint(expected_path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
        continued, _ = runner.native("n9-python-continuation", binary, expected_path, 1)
        reference = advance_fo_ccz4_rk4_3d(state.to_state(), state.header["dt"], gauge=GAUGE, gauge_profile=PROFILE)
        error = max(float(np.max(abs(a-b))) for a, b in zip(state_slots(reference), continued.slots))
        require(np.isfinite(error), "cross-backend continuation error not finite")
        result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}
        result["assessment"] = assess_fd4_window(result["cases"])
        result["completed"] = True
        result["sampled_fd4_window_gates_passed"] = bool(
            result["assessment"]["sampled_fd4_window_gates_passed"] and result["python_continuation"]["passed"]
            and result["temporal_initial_slots_equal"]
            and all(row["checkpoint_equal"] and row["manifest_equal"] for row in result["replays"]))
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(origin)
        result["source_unchanged"] = before == result["source_after"]
        validate_origin(origin_path)
        result["origin_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol changed during run")
    except Exception as exc:
        result["source_unchanged"] = False
        result["origin_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["sampled_fd4_window_gates_passed"] &= bool(result["source_unchanged"] and result["origin_unchanged"])
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({"receipt": str(directory/"receipt.json"), "completed": result["completed"],
                      "sampled_fd4_window_gates_passed": result["sampled_fd4_window_gates_passed"],
                      "errors": result["errors"]}), flush=True)
    # Execution completion and the scientific gate are deliberately separate.
    return 0 if result["completed"] and result["source_unchanged"] and result["origin_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

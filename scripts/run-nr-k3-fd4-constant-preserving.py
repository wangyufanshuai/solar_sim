"""Versioned constant-preserving FD4 repair and unchanged seven-case window."""
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
WINDOW = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fd4-window.py"))
STENCIL = WINDOW["STENCIL"]
TOPO, NATIVE = STENCIL["TOPO"], STENCIL["NATIVE"]
sha256, require, new_json = (STENCIL[k] for k in ("sha256", "require", "new_json"))
PROFILE, GAUGE = WINDOW["PROFILE"], WINDOW["GAUGE"]
decode = WINDOW["decode_checkpoint"]
PARENT_SHA = "a878c19d253076b35bbd792cbad35a2ef8cf3d56438268218a887518e8bc328c"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-fd4-constant-preserving.md"
NEW_FILES = ("science/numerical_relativity/test_fd4_constant_preserving.py",
             "scripts/run-nr-k3-fd4-constant-preserving.py", "scripts/tests/test_nr_fd4_constant_preserving.py")


def archive_identity(archive):
    path = archive/"baseline-receipt.json"
    require(sha256(path) == PARENT_SHA, "wrong frozen failure receipt")
    parent = json.loads(path.read_text(encoding="utf-8"))
    require(parent["completed"] is False and parent["source_unchanged"] is True
            and parent["source_before"] == parent["source_after"], "retained unchanged failure required")
    for name, digest in parent["source_before"].items():
        source = (archive/"baseline-source"/name).resolve()
        require(source.is_relative_to(archive) and sha256(source) == digest, f"archive source drift: {name}")
    require(sha256(archive/"baseline-retained.exe") == parent["binary_sha256"], "old binary drift")
    return parent


def source_identity(parent):
    names = set(parent["source_before"]) | set(NEW_FILES)
    return {name: sha256(ROOT/name) for name in sorted(names)}


def validate_output(data, raw, payload, steps, version):
    h = data.header
    observed = decode(raw, expected_profile=data.profile, expected_spatial_order=h["spatial_order"])
    WINDOW["validate_fo_ccz4_cpp_manifest"](payload, expected_profile=data.profile,
        expected_spatial_order=h["spatial_order"], expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
    STENCIL["verify_manifest_checksums"](raw, payload)
    target = {**h, "step": h["step"]+steps, "time": h["time"]+steps*h["dt"]}
    require(observed.header == target, "unexpected evolved header")
    require(payload["kernel_version"] == version and payload["grid"]["shape"] == [h["points"]]*3
            and payload["grid"]["spacing"] == [1./h["points"]]*3 and payload["grid"]["dt"] == h["dt"],
            "unexpected version/grid metadata")
    diagnostics = payload["diagnostics"]
    require(all(diagnostics[k] == target[k] for k in ("step", "time", "amplitude", "wavelength")),
            "manifest/checkpoint metadata disagree")
    return observed


def offdiagonal_peak(data):
    return max(float(np.max(abs(data.slots[i]))) for i in (1, 2, 4, 12, 13, 15))


class Runner(WINDOW["Runner"]):
    def native(self, label, binary, data, path, steps=8, threads=4, version="0.3.1"):
        h = data.header
        output, manifest = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        command = [binary, "--points", h["points"], "--steps", steps, "--threads", threads,
                   "--dt", h["dt"], "--scenario", "gauge-wave" if h["scenario"] else "minkowski",
                   "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow", "--amplitude", h["amplitude"],
                   "--wavelength", h["wavelength"], "--spatial-order", h["spatial_order"],
                   "--restart", path, "--checkpoint", output, "--manifest", manifest]
        if data.profile:
            command += ["--gauge-profile", "state-dependent-v1", "--shift-scale", data.profile.shift_scale,
                        "--ordering-scale", data.profile.ordering_scale]
        self.execute(label, command)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        observed = validate_output(data, output.read_bytes(), payload, steps, version)
        return {"data": observed, "path": output, "manifest": payload}


def run_integration(runner, binary, old_binary, result):
    result["integration"] = []
    for order in (2, 4):
        for family in ("wave", "noise"):
            for profile in (None, PROFILE):
                label = f"fd{order}-{family}-{'profile' if profile else 'legacy'}"
                data = STENCIL["initial"](order, family, profile)
                path = runner.directory/f"{label}-initial.bin"
                STENCIL["write_checkpoint"](path, data)
                current = runner.native(f"{label}-new", binary, data, path)
                row = {"label": label}
                if order == 2:
                    old = runner.native(f"{label}-old", old_binary, data, path, version="0.3.0")
                    require(current["path"].read_bytes() == old["path"].read_bytes(), "FD2 bytes changed")
                    TOPO["equivalent_manifests"](old["manifest"], current["manifest"], "0.3.0", "0.3.1")
                    row["fd2_checkpoint_equal"] = True
                else:
                    reference = STENCIL["evolved"](data, 8)
                    error = STENCIL["state_error"](reference, current["data"])
                    require(error <= 2.e-12, "FD4 Python/C++ parity failed")
                    row["python_cpp_max_absolute_error"] = error
                row["passed"] = True
                result["integration"].append(row)


def run_window(runner, binary, result):
    for family, n, amplitude, steps in WINDOW["CASES"]:
        runner.budget()
        label = f"{family}-n{n}-a{amplitude}-s{steps}"
        data = WINDOW["initial_checkpoint"](n, amplitude, steps)
        path = runner.directory/f"{label}-initial.bin"
        STENCIL["write_checkpoint"](path, data)
        if family == "time":
            baseline = next(r for r in result["cases"] if WINDOW["case_key"](r) == ("space", 13, amplitude, 512))
            old = decode(Path(baseline["initial_checkpoint"]).read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
            require(all(a.tobytes() == b.tobytes() for a, b in zip(data.slots, old.slots)), "time control initial drift")
            result["temporal_initial_slots_equal"] = True
        row = {"family": family, "points": n, "amplitude": amplitude, "steps": steps,
               "dt": 1./steps, "spatial_order": 4, "initial_checkpoint": str(path),
               "other_55_initial_slots_byte_identical": True, "samples": [WINDOW["sample"](data)]}
        result["cases"].append(row)
        for target_time in WINDOW["TIMES"][1:]:
            name = f"{label}-step{int(target_time*steps)}"
            current = runner.native(name, binary, data, path, steps//8)
            data, path = current["data"], current["path"]
            require(offdiagonal_peak(data) == 0., "candidate diagonal plane invariance failed")
            observation = {**WINDOW["sample"](data), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
            row["samples"].append(observation)
            new_json(runner.directory/f"{name}-diagnostics.json", observation)
        new_json(runner.directory/f"{label}-row.json", row)
        print(json.dumps({"case_complete": label, "sample_count": len(row["samples"])}), flush=True)
    first = result["cases"][0]
    initial_path, final_path = Path(first["initial_checkpoint"]), Path(first["samples"][-1]["checkpoint"])
    initial = decode(initial_path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
    result["replays"] = []
    for threads in (1, 4):
        current = runner.native(f"direct-n9-threads{threads}", binary, initial, initial_path, 512, threads)
        row = {"threads": threads, "checkpoint_equal": current["path"].read_bytes() == final_path.read_bytes(),
               "manifest_equal": current["path"].with_suffix(".json").read_bytes() == final_path.with_suffix(".json").read_bytes()}
        result["replays"].append(row)
    data = decode(final_path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
    current = runner.native("n9-python-continuation", binary, data, final_path, 1)
    python = WINDOW["advance_fo_ccz4_rk4_3d"](data.to_state(), data.header["dt"], gauge=GAUGE, gauge_profile=PROFILE)
    error = max(float(np.max(abs(a-b))) for a, b in zip(WINDOW["state_slots"](python), current["data"].slots))
    require(np.isfinite(error), "nonfinite cross-backend continuation error")
    result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}
    result["assessment"] = WINDOW["assess_fd4_window"](result["cases"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--vs-install", type=Path, required=True)
    args = parser.parse_args()
    archive, directory = args.archive.resolve(), args.output_directory.resolve()
    parent = archive_identity(archive)
    require(not directory.exists(), "fresh output directory required")
    require(shutil.disk_usage(directory.parent).free >= WINDOW["RESERVED_BYTES"]+WINDOW["OUTPUT_LIMIT"], "insufficient reserved disk capacity")
    before = source_identity(parent)
    directory.mkdir()
    result = {"schema_version": "nr-k3-fd4-constant-preserving-v1", "source_before": before,
              "parent_sha256": PARENT_SHA, "cases": [], "commands": [], "errors": [],
              "completed": False, "repair_gates_passed": False, "sampled_fd4_window_gates_passed": False,
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              **{name: False for name in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "nonlinear_initialization_promoted",
                 "continuous_window_convergence_validated", "runtime_writeback", "scientificPayloadWriteback")}}
    runner = Runner(directory, result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json", {"cases": WINDOW["CASES"], "times": WINDOW["TIMES"],
             "source": before, "parent_sha256": PARENT_SHA,
             "hard_timeout_seconds": WINDOW["HARD_TIMEOUT"], "output_limit_bytes": WINDOW["OUTPUT_LIMIT"]})
    try:
        cmake = args.vs_install/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        source, build = directory/"native-source", directory/"native-build"
        shutil.copytree(ROOT/"science/numerical_relativity/cpp", source)
        runner.execute("configure", NATIVE["configure_command"](cmake, args.vs_install, source, build))
        runner.execute("build", [cmake, "--build", build, "--config", "Release", "--parallel", 2,
                                 "--target", "nr-k2-fo-ccz4-shadow", "nr-fo-topology-test", "nr-fo-spatial-order-test"])
        binary = build/"Release/nr-k2-fo-ccz4-shadow.exe"
        result.update(binary=str(binary), binary_sha256=sha256(binary))
        stdout, _ = runner.execute("topology", [build/"Release/nr-fo-topology-test.exe"])
        result["topology"] = json.loads(stdout)
        require(result["topology"]["passed"] and result["topology"]["observed_threads"] == 4, "topology gate failed")
        stdout, _ = runner.execute("spatial-template", [build/"Release/nr-fo-spatial-order-test.exe"])
        unit = json.loads(stdout)
        require(unit["passed"] and unit["constant_checks"] == 364755 and unit["transverse_checks"] == 145902,
                "constant/invariant-direction native checks failed")
        result["native_unit"] = unit
        result["manufactured"] = STENCIL["manufactured_gate"](unit["manufactured"])
        require(all(r["passed"] for r in result["manufactured"]), "manufactured order gate failed")
        old_binary = archive/"baseline-retained.exe"
        run_integration(runner, binary, old_binary, result)
        # Prospective causal control on identical clean initial data, not a retry
        # of the failed scientific campaign or reuse of its unclean auxiliaries.
        clean = WINDOW["initial_checkpoint"](9, 1.e-4, 512)
        path = directory/"clean-control-initial.bin"
        STENCIL["write_checkpoint"](path, clean)
        old = runner.native("old-operator-clean-initial-control", old_binary, clean, path, 64, version="0.3.0")
        current = runner.native("new-operator-clean-initial-control", binary, clean, path, 64)
        result["constant_control"] = {"initial_offdiag": offdiagonal_peak(clean),
                                       "old_offdiag": offdiagonal_peak(old["data"]),
                                       "candidate_offdiag": offdiagonal_peak(current["data"])}
        require(result["constant_control"]["initial_offdiag"] == 0. and result["constant_control"]["old_offdiag"] > 0.
                and result["constant_control"]["candidate_offdiag"] == 0., "causal constant-preservation control failed")
        WINDOW["sample"](current["data"])  # Strict independent oracle unchanged.
        result["repair_gates_passed"] = True
        run_window(runner, binary, result)
        result["completed"] = True
        result["sampled_fd4_window_gates_passed"] = bool(result["assessment"]["sampled_fd4_window_gates_passed"]
            and result["python_continuation"]["passed"] and result["temporal_initial_slots_equal"]
            and all(r["checkpoint_equal"] and r["manifest_equal"] for r in result["replays"]))
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(parent)
        result["source_unchanged"] = result["source_after"] == before
        archive_identity(archive)
        result["archive_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol drift during run")
    except Exception as exc:
        result["source_unchanged"] = result["archive_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    valid = result["source_unchanged"] and result["archive_unchanged"]
    result["repair_gates_passed"] &= valid
    result["sampled_fd4_window_gates_passed"] &= valid
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({key: result[key] for key in ("completed", "repair_gates_passed", "sampled_fd4_window_gates_passed", "errors")}), flush=True)
    return 0 if result["completed"] and valid else 1


if __name__ == "__main__":
    raise SystemExit(main())

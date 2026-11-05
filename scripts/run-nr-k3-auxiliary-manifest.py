"""Metadata-only 0.3.2 repair, with retained 0.3.1 byte-equality controls."""
from __future__ import annotations

import argparse
from copy import deepcopy
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
from science.numerical_relativity.fo_ccz4_checkpoint import decode_checkpoint  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

STENCIL = runpy.run_path(str(ROOT/"scripts/run-nr-k3-spatial-order.py"))
TOPO, NATIVE = STENCIL["TOPO"], STENCIL["NATIVE"]
sha256, require, new_json = (STENCIL[k] for k in ("sha256", "require", "new_json"))
PROFILE = STENCIL["PROFILE"]
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-fd4-robust-continuation-v1-20261007/receipt.json")
PARENT_SHA = "bb4e8efb398c757a56ec1b35f2676d5d41490f6ebf0001fae965bb60e06c4e1b"
BINARY_SHA = "791bde6f0639a9b6be873c895a40a461f4473d0543b59a64600b5a8a7e768a1e"
CPP = "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-auxiliary-manifest.md"
CHANGED = {CPP, "science/numerical_relativity/manifest.py",
           "scripts/verify-nr-k2-fo-ccz4-contract.py", "scripts/run-nr-k2-native-msvc.py",
           "science/numerical_relativity/test_native_msvc_audit.py"}
NEW = {"science/numerical_relativity/test_auxiliary_manifest.py",
       "scripts/run-nr-k3-auxiliary-manifest.py", "scripts/tests/test_nr_auxiliary_manifest.py"}
HARD_TIMEOUT, OUTPUT_LIMIT, INFLIGHT = 1200., 192*1024**2, 8*1024**2


def archive_identity(archive):
    require(sha256(archive/"baseline-receipt.json") == PARENT_SHA == sha256(PARENT), "wrong frozen parent receipt")
    parent = json.loads((archive/"baseline-receipt.json").read_text(encoding="utf-8"))
    require(parent["completed"] is True and parent["sampled_robust_window_gates_passed"] is True
            and parent["source_before"] == parent["source_after"] and len(parent["source_before"]) == 141,
            "verified unchanged continuation required")
    for mapping, base in ((parent["source_before"], archive/"baseline-source"),
                          (parent["artifact_hashes"], PARENT.parent)):
        for name, digest in mapping.items():
            path = (base/name).resolve()
            require(path.is_relative_to(base.resolve()) and sha256(path) == digest, f"retained identity drift: {name}")
    require(sha256(archive/"baseline-retained.exe") == parent["binary_sha256"] == BINARY_SHA,
            "retained binary drift")
    return parent


def source_identity(parent):
    return {name: sha256(ROOT/name) for name in sorted(set(parent["source_before"]) | NEW)}


def numerical_source_unchanged(old, new):
    # Whitelist the writer, not a broad source-file change. No RHS, operators,
    # checkpoint I/O, initializer, driver or compiler option may change.
    head = "void write_manifest("
    tail = "} // namespace\n\nint main("
    require(old.count(head) == new.count(head) == old.count(tail) == new.count(tail) == 1,
            "writer boundaries missing or ambiguous")
    require(old.split(head)[0] == new.split(head)[0] and old.split(tail)[1] == new.split(tail)[1],
            "non-writer C++ source changed")


def metadata_parity(old, new, *, profile, order):
    for payload, version in ((old, "0.3.1"), (new, "0.3.2")):
        require(payload.get("kernel_version") == version, "wrong compared version")
        validate_fo_ccz4_cpp_manifest(payload, expected_profile=profile, expected_spatial_order=order)
    a, b = deepcopy(old), deepcopy(new)
    del a["kernel_version"], b["kernel_version"]
    del a["diagnostics"]["auxiliary_ordering_reconstructed"], b["diagnostics"]["auxiliary_evolution"]
    require(a == b, "unapproved manifest difference outside auxiliary policy/version")


def validate_output(data, raw, payload, steps, version):
    h = data.header
    observed = decode_checkpoint(raw, expected_profile=data.profile, expected_spatial_order=h["spatial_order"])
    mode = "fo-ccz4-rhs-shadow-rk4" if h["solver_mode"] else "analytic-3d-fo-ccz4-contract"
    validate_fo_ccz4_cpp_manifest(payload, expected_profile=data.profile,
                                  expected_spatial_order=h["spatial_order"], expected_solver_mode=mode)
    STENCIL["verify_manifest_checksums"](raw, payload)
    target = {**h, "step": h["step"]+steps, "time": h["time"]+steps*h["dt"]}
    require(observed.header == target, "unexpected evolved header")
    require(payload["kernel_version"] == version and payload["grid"]["shape"] == [h["points"]]*3
            and payload["grid"]["spacing"] == [1./h["points"]]*3 and payload["grid"]["dt"] == h["dt"],
            "unexpected version/grid metadata")
    require(all(payload["diagnostics"][k] == target[k] for k in ("step", "time", "amplitude", "wavelength")),
            "manifest/checkpoint metadata disagree")
    return observed


class Runner(TOPO["BoundedRun"]):
    def budget(self):
        remaining = HARD_TIMEOUT-(time.perf_counter()-self.started)
        require(remaining > 0., "campaign time budget exhausted")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3, "C evidence reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E workspace reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+INFLIGHT <= OUTPUT_LIMIT,
                "campaign output budget reached")
        return min(180., remaining)

    def native(self, label, binary, data, path=None, *, steps=8, threads=4, version="0.3.2"):
        h = data.header
        output, manifest = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        require(not output.exists() and not manifest.exists(), "native artifact collision")
        command = [binary, "--points", h["points"], "--steps", steps, "--threads", threads,
                   "--dt", h["dt"], "--scenario", "gauge-wave" if h["scenario"] else "minkowski",
                   "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow" if h["solver_mode"] else "analytic-contract",
                   "--amplitude", h["amplitude"], "--wavelength", h["wavelength"], "--spatial-order", h["spatial_order"],
                   "--checkpoint", output, "--manifest", manifest]
        if path is not None:
            command += ["--restart", path]
        if data.profile:
            command += ["--gauge-profile", "state-dependent-v1", "--shift-scale", data.profile.shift_scale,
                        "--ordering-scale", data.profile.ordering_scale]
        self.execute(label, command)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        observed = validate_output(data, output.read_bytes(), payload, steps, version)
        return {"data": observed, "path": output, "manifest": payload}


def compare_pair(old, new, *, cross_version):
    require(old["path"].read_bytes() == new["path"].read_bytes(), "complete checkpoint bytes changed")
    if cross_version:
        metadata_parity(old["manifest"], new["manifest"], profile=new["data"].profile,
                        order=new["data"].header["spatial_order"])
    else:
        require(old["path"].with_suffix(".json").read_bytes() == new["path"].with_suffix(".json").read_bytes(),
                "same-version complete manifest bytes changed")


def run_case(runner, binary, old_binary, label, data, path, result):
    zero = runner.native(label+"-new-zero", binary, data, path, steps=0)
    old_zero = runner.native(label+"-old-zero", old_binary, data, path, steps=0, version="0.3.1")
    compare_pair(old_zero, zero, cross_version=True)
    if path is not None:
        require(zero["path"].read_bytes() == path.read_bytes(), "zero-step restart reconstructed stored slots")
    current = runner.native(label+"-new-eight", binary, data, path)
    old = runner.native(label+"-old-eight", old_binary, data, path, version="0.3.1")
    compare_pair(old, current, cross_version=True)
    threaded = runner.native(label+"-new-one-thread", binary, data, path, threads=1)
    compare_pair(current, threaded, cross_version=False)
    partial = runner.native(label+"-new-three", binary, data, path, steps=3)
    resumed = runner.native(label+"-new-plus-five", binary, partial["data"], partial["path"], steps=5)
    compare_pair(current, resumed, cross_version=False)
    row = {"label": label, "cross_version_zero_and_eight_bytes_equal": True,
           "thread_checkpoint_and_manifest_bytes_equal": True, "split_checkpoint_and_manifest_bytes_equal": True,
           "zero_step_input_bytes_equal": True if path is not None else None}
    if data.header["solver_mode"]:
        reference = STENCIL["evolved"](data, 8)
        error = STENCIL["state_error"](reference, current["data"])
        require(error <= 2.e-12, "Python/C++ parity failed")
        row["python_cpp_max_absolute_error"] = error
    result["cases"].append(row)
    new_json(runner.directory/f"{label}-row.json", row)
    return zero


def analytic_restore_control(runner, binary, old_binary, zero, result):
    slots = tuple(q.copy() if i < 25 else q+1.e-6 for i, q in enumerate(zero["data"].slots))
    data = replace(zero["data"], slots=slots)
    path = runner.directory/"analytic-perturbed-input.bin"
    STENCIL["write_checkpoint"](path, data)
    old_zero = runner.native("analytic-perturbed-old-zero", old_binary, data, path, steps=0, version="0.3.1")
    new_zero = runner.native("analytic-perturbed-new-zero", binary, data, path, steps=0)
    compare_pair(old_zero, new_zero, cross_version=True)
    require(new_zero["path"].read_bytes() == path.read_bytes(), "analytic zero-step restore reconstructed auxiliaries")
    old = runner.native("analytic-perturbed-old-one", old_binary, data, path, steps=1, version="0.3.1")
    new = runner.native("analytic-perturbed-new-one", binary, data, path, steps=1)
    compare_pair(old, new, cross_version=True)
    fresh = runner.native("analytic-fresh-one", binary, zero["data"], steps=1)
    compare_pair(new, fresh, cross_version=False)
    result["analytic_restore_control"] = {"perturbed_auxiliary_slots": 33, "perturbation": 1.e-6,
        "zero_step_preserves_all_stored_bytes": True, "next_step_matches_fresh_analytic_reconstruction": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    archive, directory = args.archive.resolve(), args.output_directory.resolve()
    parent = archive_identity(archive)
    allowed = Path("C:/Users/86137/NRShadowEvidence").resolve()
    require(directory.is_relative_to(allowed) and directory != allowed and not directory.exists(), "fresh C subdirectory required")
    require(shutil.disk_usage(directory.parent).free >= 4*1024**3+OUTPUT_LIMIT
            and shutil.disk_usage(ROOT).free >= 1024**3, "capacity insufficient; nothing written")
    before = source_identity(parent)
    changed = {name for name, digest in parent["source_before"].items() if before[name] != digest}
    require(changed == CHANGED, "unexpected baseline source change")
    numerical_source_unchanged((archive/"baseline-source"/CPP).read_text(encoding="utf-8"),
                               (ROOT/CPP).read_text(encoding="utf-8"))
    directory.mkdir()
    result = {"schema_version": "nr-k3-auxiliary-manifest-v1", "parent": str(PARENT), "parent_sha256": PARENT_SHA,
              "archive": str(archive), "baseline_binary_sha256": BINARY_SHA, "source_before": before,
              "changed_baseline_files": sorted(changed), "non_writer_cpp_source_unchanged": True,
              "commands": [], "cases": [], "errors": [], "completed": False, "metadata_repair_gates_passed": False,
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              **{k: False for k in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "runtime_writeback", "scientificPayloadWriteback")}}
    runner = Runner(directory, result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json", {"source": before, "orders": [2,4], "points": 8,
        "noise_seed": 20261007, "noise_amplitude": 1.e-5, "wave_amplitude": STENCIL["AMPLITUDE"],
        "dt": STENCIL["DT"], "steps": [0,8,3,5], "python_tolerance": 2.e-12, "hard_timeout": HARD_TIMEOUT,
        "output_limit": OUTPUT_LIMIT, "expected_commands": 99})
    try:
        instance = NATIVE["discover_instance"]()
        cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        result.update(vs_instance=str(instance), cmake_sha256=sha256(cmake))
        for label, folder in (("native", "cpp"), ("probe", "native_probe")):
            source, build = directory/f"{label}-source", directory/f"{label}-build"
            shutil.copytree(ROOT/"science/numerical_relativity"/folder, source)
            runner.execute(label+"-configure", NATIVE["configure_command"](cmake, instance, source, build))
            command = [cmake, "--build", build, "--config", "Release", "--parallel", 2]
            if label == "native":
                command += ["--target", "nr-k2-fo-ccz4-shadow", "nr-fo-topology-test", "nr-fo-spatial-order-test"]
            runner.execute(label+"-build", command)
        stdout, _ = runner.execute("probe", [directory/"probe-build/Release/nr-native-toolchain-probe.exe"])
        result["probe"] = json.loads(stdout)
        require(NATIVE["validate_probe"](result["probe"]), "real native OpenMP probe failed")
        for label, executable in (("topology", "nr-fo-topology-test"), ("spatial", "nr-fo-spatial-order-test")):
            stdout, _ = runner.execute(label, [directory/f"native-build/Release/{executable}.exe"])
            result[label] = json.loads(stdout)
            require(result[label]["passed"] is True, f"native {label} test failed")
        binary, old_binary = directory/"native-build/Release/nr-k2-fo-ccz4-shadow.exe", archive/"baseline-retained.exe"
        result.update(binary=str(binary), binary_sha256=sha256(binary))
        for order in (2,4):
            for family in ("wave", "noise"):
                for profile in (None, PROFILE):
                    label = f"dynamic-fd{order}-{family}-{'profile' if profile else 'legacy'}"
                    data = STENCIL["initial"](order, family, profile)
                    path = directory/f"{label}-initial.bin"
                    STENCIL["write_checkpoint"](path, data)
                    run_case(runner, binary, old_binary, label, data, path, result)
        for order in (2,4):
            for family in ("flat", "wave"):
                data = STENCIL["initial"](order, family, None)
                data = replace(data, header={**data.header, "solver_mode": 0})
                zero = run_case(runner, binary, old_binary, f"analytic-fd{order}-{family}", data, None, result)
                if order == 4 and family == "wave":
                    analytic_restore_control(runner, binary, old_binary, zero, result)
        retained = parent["cases"][0]
        require(retained["points"] == 8 and retained["seed"] == 20261007, "unexpected retained case")
        retained_sample = retained["samples"][-1]
        path = Path(retained_sample["checkpoint"])
        require(retained_sample["time"] == 10. and sha256(path) == retained_sample["checkpoint_sha256"], "T10 checkpoint drift")
        copied = directory/"retained-t10-input.bin"
        shutil.copyfile(path, copied)
        data = decode_checkpoint(copied.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
        old = runner.native("t10-old-plus-one", old_binary, data, copied, steps=1, version="0.3.1")
        new = runner.native("t10-new-plus-one", binary, data, copied, steps=1)
        compare_pair(old, new, cross_version=True)
        result["retained_t10_continuation"] = {"input_sha256": sha256(copied), "source": str(path),
                                               "full_checkpoint_bytes_equal": True, "new_t10_window_executed": False}
        output = directory/"analytic-contract-v2.json"
        runner.execute("analytic-contract-v2", [sys.executable, ROOT/"scripts/verify-nr-k2-fo-ccz4-contract.py",
                                                "--binary", binary, "--output", output])
        replay = json.loads(output.read_text(encoding="utf-8"))
        require(NATIVE["validate_replay"](replay, dynamic=False), "analytic verifier metadata consumer failed")
        result["analytic_contract"] = replay
        require(len(result["commands"]) == 99 and len(result["cases"]) == 12, "frozen execution matrix incomplete")
        runner.budget()
        result["completed"] = result["metadata_repair_gates_passed"] = True
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(parent)
        result["source_unchanged"] = result["source_after"] == before
        archive_identity(archive)
        result["archive_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol drift during campaign")
    except Exception as exc:
        result["source_unchanged"] = result["archive_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["metadata_repair_gates_passed"] &= result["source_unchanged"] and result["archive_unchanged"] and not result["errors"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "metadata_repair_gates_passed", "errors")}), flush=True)
    return 0 if result["metadata_repair_gates_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

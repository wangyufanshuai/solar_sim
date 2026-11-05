"""Explicit corrective protocol: function inspection is NOT a solver CLI run."""
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
BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-auxiliary-manifest.py"))
STENCIL, NATIVE = BASE["STENCIL"], BASE["NATIVE"]
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
PROFILE, CPP = BASE["PROFILE"], BASE["CPP"]
STOP_SHA = "58f58c35f444a1005329ef4b21fff6b11167883411ad5e8d4285977aaae9a445"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-auxiliary-manifest-v2.md"
NEW = {"science/numerical_relativity/native_inspector/inspect.cpp",
       "science/numerical_relativity/native_inspector/CMakeLists.txt",
       "scripts/run-nr-k3-auxiliary-manifest-v2.py", "scripts/tests/test_nr_auxiliary_manifest_v2.py"}
EXPECTED_COMMANDS = 123


def retained_identity(archive):
    parent = BASE["archive_identity"](archive)
    stop_path = archive/"campaign-v1/receipt.json"
    require(sha256(stop_path) == STOP_SHA, "wrong immutable zero-step failure")
    stop = json.loads(stop_path.read_text(encoding="utf-8"))
    require(stop["completed"] is False and stop["metadata_repair_gates_passed"] is False
            and stop["source_unchanged"] is True and stop["archive_unchanged"] is True
            and stop["source_before"] == stop["source_after"] and len(stop["source_before"]) == 144
            and stop["errors"] == [{"type": "ValueError", "message": "unexpected exit code in dynamic-fd2-wave-legacy-new-zero: 2"}],
            "unexpected stopped campaign state")
    require([c["returncode"] for c in stop["commands"]] == [0]*7+[2], "stopped command history changed")
    for mapping, root in ((stop["source_before"], ROOT), (stop["source_before"], archive/"stopped-v1-source"),
                          (stop["artifact_hashes"], stop_path.parent)):
        for name, digest in mapping.items():
            path = (root/name).resolve()
            require(path.is_relative_to(root.resolve()) and sha256(path) == digest, f"v1 identity changed: {name}")
    BASE["numerical_source_unchanged"]((archive/"baseline-source"/CPP).read_text(encoding="utf-8"),
                                        (ROOT/CPP).read_text(encoding="utf-8"))
    return parent, stop


def source_identity(stop):
    return {name: sha256(ROOT/name) for name in sorted(set(stop["source_before"]) | NEW)}


def command_for(binary, data, output, manifest, *, steps=0, path=None, threads=4):
    h = data.header
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
    return command


class Runner(BASE["Runner"]):
    def __init__(self, directory, receipt):
        super().__init__(directory, receipt)
        self.inspectors = {}

    def execute(self, label, command, *, reject=False):
        name = Path(command[0]).name
        kind = ("function-level-zero-step-inspector" if name.startswith("nr-fo-inspect-") else
                "production-shadow-cli" if name == "nr-k2-fo-ccz4-shadow.exe" or name == "baseline-retained.exe"
                else "build-probe-or-verifier")
        count = len(self.receipt["commands"])
        try:
            stdout, seconds = super().execute(label, command, reject=reject)
            if kind == "function-level-zero-step-inspector" and not reject:
                evidence = json.loads(stdout)
                require(evidence.get("test_only") is True and evidence.get("execution_kind") == kind
                        and type(evidence.get("evolution_steps")) is int and evidence["evolution_steps"] == 0,
                        "inspector execution kind/step report mismatch")
            return stdout, seconds
        finally:
            if len(self.receipt["commands"]) > count:
                self.receipt["commands"][-1].update(execution_kind=kind, expected_rejection=reject)

    def native(self, label, binary, data, path=None, *, steps=8, threads=4, version="0.3.2"):
        if type(steps) is not int or steps < 0:
            raise ValueError("integer nonnegative requested step count required")
        if steps == 0:
            require(str(binary) in self.inspectors, "zero-step inspection binding required")
            binary = self.inspectors[str(binary)]
            label += "-function-inspection"
        return super().native(label, binary, data, path, steps=steps, threads=threads, version=version)

    def rejected(self, label, command, output, manifest, expected_error, *, retained_bytes=None):
        self.execute(label, command, reject=True)
        record = self.receipt["commands"][-1]
        require(record["returncode"] == 2 and expected_error in (self.directory/f"{label}.log").read_text(encoding="utf-8"),
                "negative control rejected for the wrong reason")
        require(not manifest.exists(), "rejected control wrote a manifest")
        require(not output.exists() if retained_bytes is None else output.read_bytes() == retained_bytes,
                "rejected control wrote or overwrote a checkpoint")


def interface_controls(runner, old_binary, binary, result):
    rows = []
    for order in (2,4):
        for dynamic, profile in ((False, None), (True, None), (True, PROFILE)):
            data = STENCIL["initial"](order, "wave", profile)
            data = replace(data, header={**data.header, "solver_mode": int(dynamic)})
            for version, exe in (("old", old_binary), ("new", binary)):
                label = f"cli-reject-zero-{version}-fd{order}-mode{int(dynamic)}-profile{int(profile is not None)}"
                output, manifest = runner.directory/f"{label}.bin", runner.directory/f"{label}.json"
                runner.rejected(label, command_for(exe, data, output, manifest), output, manifest, "--steps must be positive")
                rows.append({"label": label, "rejected_zero_without_output": True})
    result["cli_negative_controls"] = rows

    rows = []
    data = STENCIL["initial"](4, "noise", PROFILE)
    path = runner.directory/"inspector-negative-input.bin"
    STENCIL["write_checkpoint"](path, data)
    for version, exe in (("old", old_binary), ("new", binary)):
        helper = runner.inspectors[str(exe)]
        for case in ("positive", "missing", "duplicate", "metadata", "collision"):
            label = f"inspector-reject-{version}-{case}"
            output, manifest = runner.directory/f"{label}.bin", runner.directory/f"{label}.json"
            command = command_for(helper, data, output, manifest, path=path)
            error, retained_bytes = "inspector requires exactly one --steps 0", None
            index = command.index("--steps")
            if case == "positive":
                command[index+1] = 1
            elif case == "missing":
                del command[index:index+2]
            elif case == "duplicate":
                command += ["--steps", 0]
            elif case == "metadata":
                command[command.index("--points")+1] = 9
                error = "inspector restart metadata mismatch"
            else:
                STENCIL["write_checkpoint"](output, data)
                retained_bytes = output.read_bytes()
                error = "inspector requires distinct fresh output paths"
            runner.rejected(label, command, output, manifest, error, retained_bytes=retained_bytes)
            rows.append({"label": label, "rejected_without_new_or_overwritten_output": True})
    result["inspector_negative_controls"] = rows


def build(runner, archive, result):
    directory = runner.directory
    instance = NATIVE["discover_instance"]()
    cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
    result.update(vs_instance=str(instance), cmake_sha256=sha256(cmake))
    for label, folder in (("native", "cpp"), ("probe", "native_probe")):
        source, build_dir = directory/f"{label}-source", directory/f"{label}-build"
        shutil.copytree(ROOT/"science/numerical_relativity"/folder, source)
        runner.execute(label+"-configure", NATIVE["configure_command"](cmake, instance, source, build_dir))
        command = [cmake, "--build", build_dir, "--config", "Release", "--parallel", 2]
        if label == "native":
            command += ["--target", "nr-k2-fo-ccz4-shadow", "nr-fo-topology-test", "nr-fo-spatial-order-test"]
        runner.execute(label+"-build", command)
    stdout, _ = runner.execute("probe", [directory/"probe-build/Release/nr-native-toolchain-probe.exe"])
    result["probe"] = json.loads(stdout)
    require(NATIVE["validate_probe"](result["probe"]), "real OpenMP probe failed")
    for label, executable in (("topology", "nr-fo-topology-test"), ("spatial", "nr-fo-spatial-order-test")):
        stdout, _ = runner.execute(label, [directory/f"native-build/Release/{executable}.exe"])
        result[label] = json.loads(stdout)
        require(result[label]["passed"] is True, f"native {label} test failed")
    inspector_source, inspector_build = directory/"inspector-source", directory/"inspector-build"
    shutil.copytree(ROOT/"science/numerical_relativity/native_inspector", inspector_source)
    old_source = directory/"baseline-native-source"
    shutil.copytree(archive/"baseline-source/science/numerical_relativity/cpp", old_source)
    relative_cpp = "nr_k2_fo_ccz4_shadow.cpp"
    command = NATIVE["configure_command"](cmake, instance, inspector_source, inspector_build)
    command += [f"-DNR_OLD_SOURCE={(old_source/relative_cpp).as_posix()}",
                f"-DNR_NEW_SOURCE={(directory/'native-source'/relative_cpp).as_posix()}"]
    runner.execute("inspector-configure", command)
    runner.execute("inspector-build", [cmake, "--build", inspector_build, "--config", "Release", "--parallel", 2])
    old_binary = archive/"baseline-retained.exe"
    binary = directory/"native-build/Release/nr-k2-fo-ccz4-shadow.exe"
    runner.inspectors = {str(exe): inspector_build/f"Release/nr-fo-inspect-{label}.exe"
                         for label, exe in (("old", old_binary), ("new", binary))}
    result["binaries"] = {str(p): sha256(p) for p in (old_binary, binary, *runner.inspectors.values())}
    result["inspector_source_bindings"] = {"old": sha256(old_source/relative_cpp),
                                            "new": sha256(directory/"native-source"/relative_cpp)}
    return old_binary, binary


def integration(runner, old_binary, binary, parent, result):
    for order in (2,4):
        for family in ("wave", "noise"):
            for profile in (None, PROFILE):
                label = f"dynamic-fd{order}-{family}-{'profile' if profile else 'legacy'}"
                data = STENCIL["initial"](order, family, profile)
                path = runner.directory/f"{label}-initial.bin"
                STENCIL["write_checkpoint"](path, data)
                BASE["run_case"](runner, binary, old_binary, label, data, path, result)
    for order in (2,4):
        for family in ("flat", "wave"):
            data = STENCIL["initial"](order, family, None)
            data = replace(data, header={**data.header, "solver_mode": 0})
            zero = BASE["run_case"](runner, binary, old_binary, f"analytic-fd{order}-{family}", data, None, result)
            if order == 4 and family == "wave":
                BASE["analytic_restore_control"](runner, binary, old_binary, zero, result)
    retained = parent["cases"][0]
    require(retained["points"] == 8 and retained["seed"] == 20261007, "unexpected retained case")
    sample = retained["samples"][-1]
    path = Path(sample["checkpoint"])
    require(sample["time"] == 10. and sha256(path) == sample["checkpoint_sha256"], "T10 input drift")
    copied = runner.directory/"retained-t10-input.bin"
    shutil.copyfile(path, copied)
    data = BASE["decode_checkpoint"](copied.read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)
    old = runner.native("t10-old-plus-one", old_binary, data, copied, steps=1, version="0.3.1")
    new = runner.native("t10-new-plus-one", binary, data, copied, steps=1)
    BASE["compare_pair"](old, new, cross_version=True)
    result["retained_t10_continuation"] = {"input_sha256": sha256(copied), "source": str(path),
                                           "full_checkpoint_bytes_equal": True, "new_t10_window_executed": False}
    output = runner.directory/"analytic-contract-v2.json"
    runner.execute("analytic-contract-v2", [sys.executable, ROOT/"scripts/verify-nr-k2-fo-ccz4-contract.py",
                                            "--binary", binary, "--output", output])
    replay = json.loads(output.read_text(encoding="utf-8"))
    require(NATIVE["validate_replay"](replay, dynamic=False), "analytic metadata consumer failed")
    result["analytic_contract"] = replay


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    archive, directory = args.archive.resolve(), args.output_directory.resolve()
    parent, stop = retained_identity(archive)
    allowed = Path("C:/Users/86137/NRShadowEvidence").resolve()
    require(directory.is_relative_to(allowed) and directory != allowed and not directory.exists(), "fresh C subdirectory required")
    require(shutil.disk_usage(directory.parent).free >= 4*1024**3+BASE["OUTPUT_LIMIT"]
            and shutil.disk_usage(ROOT).free >= 1024**3, "capacity insufficient; nothing written")
    before = source_identity(stop)
    directory.mkdir()
    result = {"schema_version": "nr-k3-auxiliary-manifest-v2", "archive": str(archive),
              "stop_sha256": STOP_SHA, "parent_sha256": BASE["PARENT_SHA"], "source_before": before,
              "existing_144_sources_unchanged": True, "commands": [], "cases": [], "errors": [],
              "completed": False, "metadata_repair_gates_passed": False,
              "zero_step_evidence_scope": "function-level-inspection-not-production-cli",
              "positive_step_evidence_scope": "retained-old-and-fresh-new-production-shadow-cli",
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
        "dt": STENCIL["DT"], "steps": [0,8,3,5], "python_tolerance": 2.e-12,
        "expected_commands": EXPECTED_COMMANDS, "cli_negative_cases": 12, "inspector_negative_cases": 10,
        "hard_timeout": BASE["HARD_TIMEOUT"], "output_limit": BASE["OUTPUT_LIMIT"]})
    try:
        old_binary, binary = build(runner, archive, result)
        interface_controls(runner, old_binary, binary, result)
        integration(runner, old_binary, binary, parent, result)
        require(len(result["commands"]) == EXPECTED_COMMANDS and len(result["cases"]) == 12,
                "frozen execution matrix incomplete")
        runner.budget()
        result["completed"] = result["metadata_repair_gates_passed"] = True
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(stop)
        result["source_unchanged"] = result["source_after"] == before
        retained_identity(archive)
        result["retained_evidence_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol drift during campaign")
    except Exception as exc:
        result["source_unchanged"] = result["retained_evidence_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["metadata_repair_gates_passed"] &= result["source_unchanged"] and result["retained_evidence_unchanged"] and not result["errors"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "metadata_repair_gates_passed", "errors")}), flush=True)
    return 0 if result["metadata_repair_gates_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

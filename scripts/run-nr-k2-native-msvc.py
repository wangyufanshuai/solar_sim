"""Fresh Windows-native build and bounded legacy FO-CCZ4 replay; never install.

Uses the installed VS 2022 generator, without changing global PATH or requiring
cl.exe on PATH. A separate executable measures a real four-worker OpenMP team.
All output is retained in a fresh directory; failures never become solver gates.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
SCIENCE = ROOT / "science/numerical_relativity"
CHECKS = ("verify-nr-k2-fo-ccz4-contract.py", "verify-nr-k2-fo-ccz4-rhs.py")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_identity():
    paths = [p for p in SCIENCE.rglob("*") if p.is_file()
             and (p.suffix in (".py", ".cpp") or p.name == "CMakeLists.txt")]
    paths += [Path(__file__).resolve(), *(ROOT / "scripts" / name for name in CHECKS)]
    return {p.relative_to(ROOT).as_posix(): sha256(p) for p in sorted(set(paths))}


def write_new_json(path, value):
    encoded = json.dumps(value, sort_keys=True, indent=2, allow_nan=False) + "\n"
    with path.open("x", encoding="utf-8") as stream:
        stream.write(encoded)


def configure_command(cmake, instance, source, build):
    return [str(cmake), "-S", str(source), "-B", str(build),
            "-G", "Visual Studio 17 2022", "-A", "x64", "-T", "v143,host=x64",
            f"-DCMAKE_GENERATOR_INSTANCE={instance}"]


def validate_probe(probe):
    return bool(probe.get("passed") is True and probe.get("cpp_standard", 0) >= 201703
                and probe.get("openmp_version", 0) > 0 and probe.get("pointer_bytes") == 8
                and probe.get("requested_threads") == probe.get("observed_threads") == 4
                and probe.get("worker_mask") == 15
                and probe.get("checksum") == probe.get("expected_checksum") == 5559680)


def validate_replay(receipt, *, dynamic):
    required = ["cross_backend_passed", "checkpoint_equal_thread_count", "checkpoint_equal_restart",
                "manifest_equal_thread_count", "manifest_equal_restart", "manifest_identity_parity",
                "mismatched_scenario_rejected"]
    required += ["ordering_fixture_passed", "dynamic_rhs_implemented"] if dynamic else ["analytic_auxiliary_agreement"]
    return (all(receipt.get(name) is True for name in required)
            and receipt.get("runtime_writeback") is False
            and receipt.get("physical_validation") is False
            and str(receipt.get("promotion", "")).startswith("blocked-"))


def discover_instance():
    installer = Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Microsoft Visual Studio/Installer/vswhere.exe"
    result = subprocess.run([str(installer), "-latest", "-products", "*", "-version", "[17.0,18.0)",
                             "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
                             "-property", "installationPath"], capture_output=True, text=True,
                            check=True, timeout=20, creationflags=subprocess.CREATE_NO_WINDOW)
    value = result.stdout.strip()
    if not value or not Path(value).is_dir():
        raise RuntimeError("No installed VS 2022 C++ instance; no installation attempted")
    return Path(value)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--vs-install", type=Path)
    args = parser.parse_args()
    if os.name != "nt":
        raise SystemExit("This audit is specifically for Windows-native MSVC")
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True, exist_ok=False)
    started = time.perf_counter()
    before = source_identity()
    receipt = {"schema_version": "nr-k2-native-msvc-v1", "source_identity_before": before,
               "commands": [], "environment": {"platform": platform.platform(), "python": sys.version},
               "environment_changed_globally": False, "software_installed": False,
               "passed": False, "new_gauge_profile_cpp_validated": False,
               "cuda_validated": False, "physical_validation": False,
               "runtime_writeback": False, "scientificPayloadWriteback": False,
               "promotion": "blocked-pending-profile-parity-and-physical-validation", "error": None}

    def execute(name, command, timeout=180):
        print(json.dumps({"phase": name}), flush=True)
        result = subprocess.run(command, capture_output=True, text=True, errors="replace",
                                check=False, timeout=timeout, cwd=ROOT,
                                creationflags=subprocess.CREATE_NO_WINDOW)
        log = directory / f"{name}.log"
        with log.open("x", encoding="utf-8") as stream:
            stream.write(result.stdout + "\n[stderr]\n" + result.stderr)
        receipt["commands"].append({"phase": name, "arguments": command, "returncode": result.returncode,
                                    "log": str(log), "log_sha256": sha256(log)})
        if result.returncode:
            raise RuntimeError(f"{name} failed with exit {result.returncode}; see retained log")
        return result.stdout

    try:
        instance = (args.vs_install or discover_instance()).resolve()
        cmake = instance / "Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        if not cmake.is_file():
            raise RuntimeError("Installed instance has no bundled CMake; no installation attempted")
        receipt["vs_instance"] = str(instance)
        receipt["cmake_sha256"] = sha256(cmake)
        for label, source in (("probe", SCIENCE / "native_probe"), ("solver", SCIENCE / "cpp")):
            build = directory / f"{label}-build"
            execute(f"{label}-configure", configure_command(cmake, instance, source, build))
            execute(f"{label}-build", [str(cmake), "--build", str(build), "--config", "Release", "--parallel", "2"])
        probe_binary = directory / "probe-build/Release/nr-native-toolchain-probe.exe"
        solver_binary = directory / "solver-build/Release/nr-k2-fo-ccz4-shadow.exe"
        probe = json.loads(execute("probe-run", [str(probe_binary)], timeout=30))
        receipt["probe"] = probe
        if not validate_probe(probe):
            raise RuntimeError("Actual C++17/binary64/OpenMP team probe did not meet the gate")
        receipt["replays"] = {}
        for name in CHECKS:
            output = directory / name.replace(".py", ".json")
            execute(name[:-3], [sys.executable, str(ROOT / "scripts" / name),
                               "--binary", str(solver_binary), "--output", str(output)])
            replay = json.loads(output.read_text(encoding="utf-8"))
            if not validate_replay(replay, dynamic="-rhs" in name):
                raise RuntimeError(f"{name}: result envelope did not meet the gate")
            receipt["replays"][name] = {"file": str(output), "sha256": sha256(output), "result": replay}
        receipt["binary_sha256"] = {str(p): sha256(p) for p in (probe_binary, solver_binary)}
        receipt["passed"] = True
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        receipt["error"] = f"{type(error).__name__}: {error}"
    after = source_identity()
    receipt["source_identity_after"] = after
    receipt["source_unchanged"] = before == after
    receipt["passed"] = receipt["passed"] and before == after
    receipt["elapsed_seconds"] = time.perf_counter() - started
    write_new_json(directory / "receipt.json", receipt)
    print(json.dumps({"receipt": str(directory / "receipt.json"), "passed": receipt["passed"],
                      "error": receipt["error"], "source_unchanged": before == after}), flush=True)
    return 0 if receipt["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

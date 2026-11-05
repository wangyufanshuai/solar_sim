"""Bounded, paired native CPU optimization audit; no physics promotion.

Build an archived 0.2.0 and the current 0.2.1 using the same installed compiler.
The only permitted manifest difference is the explicitly checked kernel version.
Failed runs and every timed checkpoint are retained; there is no retry loop.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import runpy
import shutil
import statistics
import struct
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, GaugeConfig, Grid3D, advance_fo_ccz4_rk4_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    FOCheckpoint, HEADER, PROFILE_HEADER, checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

NATIVE = runpy.run_path(str(ROOT / "scripts/run-nr-k2-native-msvc.py"))
PROFILE = FOCCZ4GaugeProfile()
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261007-topology-cache.md"
PARENT_SHA = "86202287af446853ade39ac06d8c6ce710e4c56929ee32900fc91fcbfbc80f48"
DT, AMPLITUDE = 1. / 512., 1.e-4
PAIRS, TIMED_STEPS, TIMED_GRIDS = 6, 16, (13, 25)
HARD_TIMEOUT, PROCESS_TIMEOUT = 1200., 180.
OUTPUT_LIMIT, DISK_RESERVE = 256 * 1024**2, 1024**3
# name, grid, scenario, profile, solver mode, independent random fixture
CASES = (
    ("legacy-analytic", 5, "gauge-wave", False, "analytic-contract", False),
    ("legacy-wave", 5, "gauge-wave", False, "fo-rhs-shadow", False),
    ("profile-wave", 9, "gauge-wave", True, "fo-rhs-shadow", False),
    ("profile-flat", 6, "minkowski", True, "fo-rhs-shadow", False),
    ("legacy-noise", 5, "minkowski", False, "fo-rhs-shadow", True),
    ("profile-noise", 8, "minkowski", True, "fo-rhs-shadow", True),
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def new_json(path, data):
    with path.open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(data, sort_keys=True, indent=2, allow_nan=False) + "\n")


def verify_archive(archive):
    path = archive / "baseline-receipt.json"
    require(sha256(path) == PARENT_SHA, "unexpected archived receipt")
    receipt = json.loads(path.read_text(encoding="utf-8"))
    for name, digest in receipt["identity_before"]["source"].items():
        candidate = (archive / "baseline-source" / name).resolve()
        require(candidate.is_relative_to(archive.resolve()), "source path escapes archive")
        require(sha256(candidate) == digest, f"archived source drift: {name}")
    require(sha256(archive / "baseline-retained.exe") == receipt["identity_before"]["binary_sha256"],
            "archived binary drift")
    return receipt


def source_identity(parent):
    paths = {ROOT / name for name in parent["identity_before"]["source"]}
    paths.update(ROOT / name for name in NATIVE["source_identity"]())
    paths.update((Path(__file__).resolve(), ROOT / "scripts/tests/test_nr_topology_cache.py"))
    return {p.relative_to(ROOT).as_posix(): sha256(p) for p in sorted(paths)}


def equivalent_manifests(left, right, left_version, right_version):
    require(left.get("kernel_version") == left_version and right.get("kernel_version") == right_version,
            "unexpected kernel version")
    a, b = copy.deepcopy(left), copy.deepcopy(right)
    del a["kernel_version"], b["kernel_version"]
    require(a == b, "manifest differs beyond kernel version")
    return True


def performance_summary(rows):
    require(len(rows) == 2 * PAIRS, "all paired timing samples are required")
    mapping = {}
    for row in rows:
        key = row["pair"], row["backend"]
        require(key not in mapping and key[0] in range(PAIRS) and key[1] in ("baseline", "candidate"),
                "duplicate or invalid timing sample")
        require(isinstance(row["seconds"], (float, int)) and math.isfinite(row["seconds"])
                and row["seconds"] > 0., "timings must be finite and positive")
        mapping[key] = row["seconds"]
    expected = [(i, name) for i in range(PAIRS)
                for name in (("baseline", "candidate") if i % 2 == 0 else ("candidate", "baseline"))]
    require([(r["pair"], r["backend"]) for r in rows] == expected, "paired AB/BA order changed")
    baseline = [mapping[i, "baseline"] for i in range(PAIRS)]
    candidate = [mapping[i, "candidate"] for i in range(PAIRS)]
    ratios = [a / b for a, b in zip(baseline, candidate)]
    speedup = statistics.median(baseline) / statistics.median(candidate)
    return {"baseline_seconds": baseline, "candidate_seconds": candidate, "paired_speedups": ratios,
            "baseline_median": statistics.median(baseline), "candidate_median": statistics.median(candidate),
            "median_speedup": speedup, "faster_pairs": sum(r > 1. for r in ratios),
            "local_speedup_gate": speedup >= 1.10 and sum(r > 1. for r in ratios) >= 5}


def independent_seed(points, profile):
    base = BSSNState3D.minkowski(Grid3D((points,) * 3, (0.,) * 3, (1.,) * 3,
                                     boundary="periodic", spatial_order=2))
    checkpoint = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=profile,
                                       dt=DT, amplitude=AMPLITUDE, scenario=0)
    rng = np.random.Generator(np.random.PCG64(20261007))
    slots = tuple(slot + rng.uniform(-1.e-5, 1.e-5, slot.shape) for slot in checkpoint.slots)
    return FOCheckpoint(checkpoint.header, slots, profile)


def bad_payloads(checkpoint):
    raw = checkpoint.to_bytes()
    offset = HEADER.size + (PROFILE_HEADER.size if checkpoint.profile else 0)
    points = bytearray(raw)
    struct.pack_into("<Q", points, 24, 4)
    nonfinite, indefinite = bytearray(raw), bytearray(raw)
    struct.pack_into("<d", nonfinite, offset, float("nan"))
    struct.pack_into("<d", indefinite, offset, -1.)
    return {"truncated": raw[:-1], "trailing": raw + b"x", "points": bytes(points),
            "nonfinite": bytes(nonfinite), "indefinite": bytes(indefinite), "profile": raw}


class BoundedRun:
    def __init__(self, directory, receipt):
        self.directory, self.receipt = directory, receipt
        self.started = time.perf_counter()

    def budget(self):
        remaining = HARD_TIMEOUT - (time.perf_counter() - self.started)
        require(remaining > 0., "hard execution budget exhausted")
        require(shutil.disk_usage(self.directory).free >= DISK_RESERVE, "disk reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) < OUTPUT_LIMIT,
                "output budget reached")
        return min(PROCESS_TIMEOUT, remaining)

    def execute(self, label, command, *, reject=False):
        timeout = self.budget()
        print(json.dumps({"phase": label}), flush=True)
        start = time.perf_counter()
        record = {"label": label, "arguments": list(map(str, command)), "timeout_seconds": timeout}
        self.receipt["commands"].append(record)
        try:
            result = subprocess.run(record["arguments"], cwd=ROOT, capture_output=True, text=True,
                                    errors="replace", timeout=timeout, check=False,
                                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            record.update(returncode=result.returncode, seconds=time.perf_counter() - start)
            stdout, stderr = result.stdout, result.stderr
        except subprocess.TimeoutExpired as error:
            record.update(returncode=None, seconds=time.perf_counter() - start, timed_out=True)
            stdout, stderr = error.stdout or b"", error.stderr or b""
            raise
        finally:
            if "stdout" in locals():
                output = (stdout.decode(errors="replace") if isinstance(stdout, bytes) else stdout)
                output += "\n[stderr]\n" + (stderr.decode(errors="replace") if isinstance(stderr, bytes) else stderr)
                with (self.directory / f"{label}.log").open("x", encoding="utf-8") as stream:
                    stream.write(output)
        require((result.returncode != 0) if reject else (result.returncode == 0),
                f"unexpected exit code in {label}: {result.returncode}")
        return result.stdout, record["seconds"]

    def native(self, label, binary, case, *, steps=8, threads=4, restart=None, reject=False):
        _, n, scenario, profile, mode, _ = case
        checkpoint, manifest = self.directory / f"{label}.bin", self.directory / f"{label}.json"
        command = [binary, "--points", n, "--steps", steps, "--threads", threads, "--dt", DT,
                   "--scenario", scenario, "--formulation", "ccz4", "--solver-mode", mode,
                   "--amplitude", AMPLITUDE, "--wavelength", 1,
                   "--checkpoint", checkpoint, "--manifest", manifest]
        if profile:
            command += ["--gauge-profile", "state-dependent-v1", "--shift-scale", 3, "--ordering-scale", .2]
        if restart:
            command += ["--restart", restart]
        _, seconds = self.execute(label, command, reject=reject)
        if reject:
            require(not checkpoint.exists() and not manifest.exists(), "rejected restart wrote output")
            return None
        raw = checkpoint.read_bytes()
        state = decode_checkpoint(raw, expected_profile=PROFILE if profile else None)
        data = json.loads(manifest.read_text(encoding="utf-8"))
        validate_fo_ccz4_cpp_manifest(data, expected_profile=PROFILE if profile else None,
                                     expected_solver_mode="analytic-3d-fo-ccz4-contract" if mode == "analytic-contract"
                                     else "fo-ccz4-rhs-shadow-rk4")
        require(state.header["points"] == n and state.header["dt"] == DT, "output grid mismatch")
        require(state.header["step"] == data["diagnostics"]["step"], "step/manifest mismatch")
        return {"path": checkpoint, "manifest": data, "seconds": seconds}


def compare_outputs(left, right, versions):
    require(left["path"].read_bytes() == right["path"].read_bytes(), "complete checkpoint bytes differ")
    equivalent_manifests(left["manifest"], right["manifest"], *versions)
    if versions[0] == versions[1]:
        require(left["path"].with_suffix(".json").read_bytes() == right["path"].with_suffix(".json").read_bytes(),
                "same-version manifest bytes differ")
    return {"checkpoint_sha256": sha256(left["path"]), "checkpoint_equal": True,
            "manifest_equal_except_version": True, "versions": list(versions)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--vs-install", required=True, type=Path)
    args = parser.parse_args()
    require(os.name == "nt", "this is a Windows-native experiment")
    archive, directory = args.archive.resolve(), args.output_directory.resolve()
    parent = verify_archive(archive)
    require(not directory.exists(), "output directory already exists; no overwrite")
    require(shutil.disk_usage(directory.parent).free >= DISK_RESERVE + OUTPUT_LIMIT, "insufficient free disk")
    directory.mkdir()
    before = source_identity(parent)
    receipt = {"schema_version": "nr-k3-topology-cache-v1", "source_before": before, "commands": [],
               "environment": {"platform": platform.platform(), "python": sys.version, "numpy": np.__version__},
               "cases": [], "negative_cases": [], "performance": {}, "errors": [], "completed": False,
               "output_preservation_passed": False, "local_speedup_passed": False,
               "physical_validation": False, "spatial_convergence_validated": False,
               "strong_hyperbolicity_validated": False, "cpbc": False, "black_hole_evolution_validated": False,
               "amr_validated": False, "cuda_validated": False, "long_time_stability_validated": False,
               "runtime_writeback": False, "scientificPayloadWriteback": False, "parent_sha256": PARENT_SHA}
    runner = BoundedRun(directory, receipt)
    with (directory / "protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    receipt["protocol_sha256"] = sha256(directory / "protocol.frozen.md")
    new_json(directory / "frozen-input.json", receipt)
    try:
        cmake = args.vs_install / "Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        receipt["cmake_sha256"] = sha256(cmake)
        candidate_source = directory / "candidate-source"
        shutil.copytree(ROOT / "science/numerical_relativity/cpp", candidate_source,
                        ignore=shutil.ignore_patterns("__pycache__"))
        binaries = {}
        for label, source in (("baseline", archive / "baseline-source/science/numerical_relativity/cpp"),
                              ("candidate", candidate_source)):
            build = directory / f"{label}-build"
            runner.execute(f"{label}-configure", NATIVE["configure_command"](cmake, args.vs_install, source, build))
            targets = ["nr-k2-fo-ccz4-shadow"] + (["nr-fo-topology-test"] if label == "candidate" else [])
            runner.execute(f"{label}-build", [cmake, "--build", build, "--config", "Release", "--parallel", 2,
                                               "--target", *targets])
            binaries[label] = build / "Release/nr-k2-fo-ccz4-shadow.exe"
        receipt["binaries"] = {name: {"path": str(path), "sha256": sha256(path)} for name, path in binaries.items()}
        stdout, _ = runner.execute("topology-unit", [directory / "candidate-build/Release/nr-fo-topology-test.exe"])
        unit = json.loads(stdout)
        expected_cells = sum(n**3 for n in (5, 6, 8, 9, 13, 17, 25))
        require(unit.get("passed") is True and unit.get("observed_threads") == 4
                and unit.get("index_checks") == expected_cells * 6
                and unit.get("derivative_bit_checks") == expected_cells * 3 * 58, "topology unit gate failed")
        receipt["topology_unit"] = unit
        for case in CASES:
            name, n, _, profile, _, noise = case
            seed = None
            if noise:
                seed = directory / f"{name}-seed.bin"
                with seed.open("xb") as stream:
                    stream.write(independent_seed(n, PROFILE if profile else None).to_bytes())
            runs = {}
            runs["base"] = runner.native(f"{name}-base", binaries["baseline"], case, restart=seed)
            runs["retained"] = runner.native(f"{name}-retained", archive / "baseline-retained.exe", case, restart=seed)
            runs["new"] = runner.native(f"{name}-new", binaries["candidate"], case, restart=seed)
            runs["serial"] = runner.native(f"{name}-serial", binaries["candidate"], case, restart=seed, threads=1)
            half_old = runner.native(f"{name}-half-old", binaries["baseline"], case, restart=seed, steps=4)
            half_new = runner.native(f"{name}-half-new", binaries["candidate"], case, restart=seed, steps=4)
            runs["split"] = runner.native(f"{name}-split", binaries["candidate"], case,
                                           restart=half_new["path"], steps=4, threads=1)
            runs["old-new"] = runner.native(f"{name}-old-new", binaries["candidate"], case,
                                             restart=half_old["path"], steps=4)
            runs["new-old"] = runner.native(f"{name}-new-old", binaries["baseline"], case,
                                             restart=half_new["path"], steps=4)
            checks = {}
            for key, row in runs.items():
                version = "0.2.0" if key in ("base", "retained", "new-old") else "0.2.1"
                checks[key] = compare_outputs(runs["base"], row, ("0.2.0", version))
            receipt["cases"].append({"name": name, "checks": checks})
        for profile in (False, True):
            state = independent_seed(5, PROFILE if profile else None)
            for bad, payload in bad_payloads(state).items():
                label = f"reject-v{2 if profile else 1}-{bad}"
                seed = directory / f"{label}-input.bin"
                with seed.open("xb") as stream:
                    stream.write(payload)
                case = (label, 5, "minkowski", not profile if bad == "profile" else profile, "fo-rhs-shadow", True)
                for backend in ("baseline", "candidate"):
                    runner.native(f"{label}-{backend}", binaries[backend], case, restart=seed, reject=True)
                receipt["negative_cases"].append(label)
        profile_case = CASES[-1]
        initial = independent_seed(8, PROFILE)
        native = runner.native("python-cross-step", binaries["candidate"], profile_case,
                               restart=directory / "profile-noise-seed.bin", steps=1)
        runner.budget()
        evolved = advance_fo_ccz4_rk4_3d(initial.to_state(), DT, steps=1, gauge_profile=PROFILE,
                                        gauge=GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.),
                                        boundary_mode="periodic")
        observed = decode_checkpoint(native["path"].read_bytes(), expected_profile=PROFILE)
        error = max(float(np.max(abs(a - b))) for a, b in zip(state_slots(evolved), observed.slots))
        receipt["python_cross_step"] = {"max_absolute_error": error, "passed": error <= 2.e-12}
        require(error <= 2.e-12, "Python cross-step mismatch")
        for n in TIMED_GRIDS:
            case = (f"timing-{n}", n, "gauge-wave", True, "fo-rhs-shadow", False)
            warm = {name: runner.native(f"timing-{n}-warm-{name}", binary, case, steps=TIMED_STEPS)
                    for name, binary in binaries.items()}
            compare_outputs(warm["baseline"], warm["candidate"], ("0.2.0", "0.2.1"))
            samples = []
            for pair in range(PAIRS):
                for backend in (("baseline", "candidate") if pair % 2 == 0 else ("candidate", "baseline")):
                    row = runner.native(f"timing-{n}-pair{pair}-{backend}", binaries[backend], case, steps=TIMED_STEPS)
                    compare_outputs(warm["baseline"], row, ("0.2.0", "0.2.0" if backend == "baseline" else "0.2.1"))
                    samples.append({"pair": pair, "backend": backend, "seconds": row["seconds"]})
            receipt["performance"][str(n)] = {"samples": samples, **performance_summary(samples)}
        receipt["local_speedup_passed"] = all(row["local_speedup_gate"] for row in receipt["performance"].values())
        runner.budget()
        receipt["output_preservation_passed"] = True
        receipt["completed"] = True
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        receipt["source_after"] = source_identity(parent)
        receipt["source_unchanged_during_run"] = receipt["source_after"] == before
        try:
            verify_archive(archive)
            receipt["archive_unchanged"] = True
        except (OSError, ValueError) as error:
            receipt["archive_unchanged"] = False
            receipt["errors"].append(f"archive verification: {error}")
        receipt["elapsed_seconds"] = time.perf_counter() - runner.started
        receipt["passed"] = (receipt["completed"] and receipt["output_preservation_passed"]
                             and receipt["local_speedup_passed"] and receipt["source_unchanged_during_run"]
                             and receipt["archive_unchanged"] and not receipt["errors"])
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                      for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory / "receipt.json", receipt)
    print(json.dumps({"receipt": str(directory / "receipt.json"), "completed": receipt["completed"],
                      "passed": receipt["passed"], "performance": receipt["performance"],
                      "errors": receipt["errors"]}), flush=True)
    return 0 if receipt["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

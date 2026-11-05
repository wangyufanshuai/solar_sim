"""Prospective T=10 even-grid, all-slot noise screen of the bound 0.3.1 CPU."""
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
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, Grid3D, advance_fo_ccz4_rk4_3d, constraint_report_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_robust_window import (  # noqa: E402
    CASES, TIMES, assess_robust_window, case_key, noise_amplitude, signed_comparison, slot_norms,
)

REPAIR = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fd4-constant-preserving.py"))
PERIODIC = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fo-ccz4-periodic-window.py"))
STENCIL = REPAIR["STENCIL"]
sha256, require, new_json = (REPAIR[k] for k in ("sha256", "require", "new_json"))
PROFILE, GAUGE = REPAIR["PROFILE"], REPAIR["GAUGE"]
PARENT_SHA = "687bfd0b27bd509e0f9c1b29c66f83d81005097c415d7cc62e9021616c300158"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-fd4-robust-window.md"
HARD_TIMEOUT, PROCESS_TIMEOUT = 1800., 180.
OUTPUT_LIMIT, RESERVE_C, RESERVE_E, INFLIGHT = 192*1024**2, 4*1024**3, 1024**3, 8*1024**2
NEW_FILES = ("science/numerical_relativity/fo_ccz4_robust_window.py",
             "science/numerical_relativity/test_fo_ccz4_robust_window.py",
             "scripts/run-nr-k3-fd4-robust-window.py", "scripts/tests/test_nr_fd4_robust_window.py")


def parent_identity(path):
    require(sha256(path) == PARENT_SHA, "wrong frozen 0.3.1 receipt")
    parent = json.loads(path.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["repair_gates_passed"] and parent["sampled_fd4_window_gates_passed"]
            and parent["source_before"] == parent["source_after"], "verified unchanged 0.3.1 required")
    for names, root in ((parent["source_before"], ROOT), (parent["artifact_hashes"], path.parent)):
        for name, digest in names.items():
            resolved = (root/name).resolve()
            require(resolved.is_relative_to(root) and sha256(resolved) == digest, f"parent identity drift: {name}")
    binary = Path(parent["binary"])
    require(sha256(binary) == parent["binary_sha256"], "bound binary drift")
    return parent, binary


def source_identity(parent):
    return {name: sha256(ROOT/name) for name in sorted(set(parent["source_before"]) | set(NEW_FILES))}


def initial_checkpoint(family, n, seed, steps_per_unit):
    require((family, n, seed, steps_per_unit) in CASES, "undeclared initial condition")
    grid = Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=4)
    amplitude = 0. if family == "minkowski" else noise_amplitude(n)
    data = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid)),
                                  profile=PROFILE, dt=1./steps_per_unit, scenario=0,
                                  amplitude=amplitude, wavelength=1.)
    if amplitude:
        rng = np.random.Generator(np.random.PCG64(seed))
        data = replace(data, slots=tuple(q+rng.uniform(-amplitude, amplitude, q.shape) for q in data.slots))
    # All auxiliaries are independent. No reconstruction, mean removal or projection.
    return decode_checkpoint(data.to_bytes(), expected_profile=PROFILE, expected_spatial_order=4)


def sample(data):
    require(data.header["spatial_order"] == 4 and data.profile == PROFILE, "diagnostic identity mismatch")
    result = PERIODIC["diagnostics"](data, "noise")
    result["slot_l2"] = slot_norms(data.slots)
    # Record all seven checkerboard combinations, rather than suppressing them.
    n = data.header["points"]
    xyz = np.indices((n,)*3)
    patterns = [1.-2.*(sum(xyz[axis] for axis in range(3) if mask & (1 << axis)) % 2)
                for mask in range(1, 8)]
    result["checkerboard_signed_mean_by_slot"] = [
        [float(np.mean((q-(1. if i in (0, 3, 5) else 0.))*p)) for p in patterns]
        for i, q in enumerate(data.slots)]
    result["spatial_order"], result["checkpoint_version"] = 4, 3
    return result


def temporal_comparison(coarse, fine, initial):
    for key in ("points", "time", "scenario", "amplitude", "wavelength", "spatial_order"):
        require(coarse.header[key] == fine.header[key], "temporal metadata mismatch")
    require(coarse.header["dt"] == 2*fine.header["dt"] and coarse.header["step"]*2 == fine.header["step"]
            and coarse.profile == fine.profile == initial.profile == PROFILE,
            "temporal dt/profile mismatch")
    require(initial.header["step"] == 0 and initial.header["points"] == coarse.header["points"]
            and initial.header["amplitude"] == coarse.header["amplitude"], "temporal initial mismatch")
    slots = []
    for i, (a, b, c) in enumerate(zip(coarse.slots, fine.slots, initial.slots)):
        flat = 1. if i in (0, 3, 5) else 0.
        slots.append(signed_comparison(a-flat, b-flat, c-flat))
    reports = [constraint_report_3d(c.to_state().base) for c in (coarse, fine, initial)]
    return {"time": coarse.header["time"], "slots": slots,
            "constraints": {name: signed_comparison(*(getattr(r, name) for r in reports))
                            for name in ("hamiltonian", "momentum")}}


class Runner(REPAIR["Runner"]):
    def budget(self):
        remaining = HARD_TIMEOUT-(time.perf_counter()-self.started)
        require(remaining > 0., "frozen 30-minute campaign budget exhausted")
        require(shutil.disk_usage(self.directory).free >= RESERVE_C+INFLIGHT, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= RESERVE_E, "E workspace reserve reached")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used+INFLIGHT <= OUTPUT_LIMIT, "frozen output budget exhausted")
        return min(PROCESS_TIMEOUT, remaining)


def read_checkpoint(path):
    return decode_checkpoint(Path(path).read_bytes(), expected_profile=PROFILE, expected_spatial_order=4)


def run_cases(runner, binary, result):
    for family, n, seed, steps in CASES:
        runner.budget()
        label = f"{family}-n{n}-seed{seed}-s{steps}"
        data = initial_checkpoint(family, n, seed, steps)
        path = runner.directory/f"{label}-initial.bin"
        STENCIL["write_checkpoint"](path, data)
        row = {"family": family, "points": n, "seed": seed, "steps_per_unit": steps,
               "dt": 1./steps, "amplitude": data.header["amplitude"], "spatial_order": 4,
               "initial_checkpoint": str(path), "initial_checkpoint_sha256": sha256(path),
               "samples": [sample(data)]}
        result["cases"].append(row)
        if family == "time":
            baseline = next(r for r in result["cases"] if case_key(r) == ("noise", n, seed, 256))
            initial = read_checkpoint(baseline["initial_checkpoint"])
            require(all(a.tobytes() == b.tobytes() for a, b in zip(initial.slots, data.slots)),
                    "time control changed initial fields")
            result["temporal_initial_slots_equal"] = True
        for t in TIMES[1:]:
            name = f"{label}-t{int(t)}"
            current = runner.native(name, binary, data, path, steps)
            data, path = current["data"], current["path"]
            observation = {**sample(data), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
            row["samples"].append(observation)
            new_json(runner.directory/f"{name}-diagnostics.json", observation)
            if family == "time":
                coarse = read_checkpoint(baseline["samples"][int(t)]["checkpoint"])
                comparison = temporal_comparison(coarse, data, initial)
                result["temporal"].append(comparison)
                new_json(runner.directory/f"{name}-temporal.json", comparison)
        new_json(runner.directory/f"{label}-row.json", row)
        print(json.dumps({"case_complete": label, "samples": len(row["samples"])}), flush=True)
    first = result["cases"][0]
    initial_path, final_path = Path(first["initial_checkpoint"]), Path(first["samples"][-1]["checkpoint"])
    initial = read_checkpoint(initial_path)
    result["replays"] = []
    for threads in (1, 4):
        current = runner.native(f"direct-n8-threads{threads}", binary, initial, initial_path, 2560, threads)
        result["replays"].append({"threads": threads,
            "checkpoint_equal": current["path"].read_bytes() == final_path.read_bytes(),
            "manifest_equal": current["path"].with_suffix(".json").read_bytes() == final_path.with_suffix(".json").read_bytes()})
    data = read_checkpoint(final_path)
    current = runner.native("n8-t10-python-continuation", binary, data, final_path, 1)
    reference = advance_fo_ccz4_rk4_3d(data.to_state(), data.header["dt"], gauge=GAUGE, gauge_profile=PROFILE)
    error = max(float(np.max(abs(a-b))) for a, b in zip(state_slots(reference), current["data"].slots))
    require(np.isfinite(error), "nonfinite cross-backend continuation")
    result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parent", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    parent_path, directory = args.parent.resolve(), args.output_directory.resolve()
    parent, binary = parent_identity(parent_path)
    require(not directory.exists() and directory.parent.is_dir(), "fresh directory with existing parent required")
    allowed_root = Path("C:/Users/86137/NRShadowEvidence").resolve()
    require(directory.is_relative_to(allowed_root) and directory != allowed_root, "dedicated C evidence subdirectory required")
    require(shutil.disk_usage(directory.parent).free >= RESERVE_C+OUTPUT_LIMIT
            and shutil.disk_usage(ROOT).free >= RESERVE_E, "insufficient reserved capacity; nothing written")
    before = source_identity(parent)
    directory.mkdir()
    result = {"schema_version": "nr-k3-fd4-robust-window-v1", "source_before": before,
              "parent": str(parent_path), "parent_sha256": PARENT_SHA,
              "binary": str(binary), "binary_sha256": sha256(binary), "profile": PROFILE.identity(),
              "cases": [], "temporal": [], "commands": [], "errors": [], "completed": False,
              "sampled_robust_window_gates_passed": False,
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              **{key: False for key in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                  "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                  "standard_awa_benchmark_passed", "long_time_stability_validated", "continuum_convergence_claim",
                  "runtime_writeback", "scientificPayloadWriteback")}}
    runner = Runner(directory, result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json", {"cases": CASES, "times": TIMES, "source": before,
        "parent_sha256": PARENT_SHA, "binary_sha256": result["binary_sha256"], "spatial_order": 4,
        "hard_timeout_seconds": HARD_TIMEOUT, "process_timeout_seconds": PROCESS_TIMEOUT,
        "output_limit_bytes": OUTPUT_LIMIT, "reserve_c_bytes": RESERVE_C, "reserve_e_bytes": RESERVE_E})
    try:
        run_cases(runner, binary, result)
        result["assessment"] = assess_robust_window(result["cases"], result["temporal"])
        result["completed"] = True
        result["sampled_robust_window_gates_passed"] = bool(
            result["assessment"]["sampled_robust_window_gates_passed"]
            and result["temporal_initial_slots_equal"] and result["python_continuation"]["passed"]
            and all(r["checkpoint_equal"] and r["manifest_equal"] for r in result["replays"]))
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(parent)
        result["source_unchanged"] = result["source_after"] == before
        parent_identity(parent_path)
        result["parent_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol changed during run")
    except Exception as exc:
        result["source_unchanged"] = result["parent_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["sampled_robust_window_gates_passed"] &= result["source_unchanged"] and result["parent_unchanged"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "sampled_robust_window_gates_passed", "errors")}), flush=True)
    return 0 if result["completed"] and result["source_unchanged"] and result["parent_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

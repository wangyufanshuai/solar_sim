"""Explicit continuation of the retained capacity stop; no changed physics/gates."""
from __future__ import annotations

import argparse
from copy import deepcopy
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fd4-robust-window.py"))
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
read_checkpoint, sample, case_key = (BASE[k] for k in ("read_checkpoint", "sample", "case_key"))
CASES, TIMES = BASE["CASES"], BASE["TIMES"]
STOP_SHA = "e956ae5de4708342b472567a18864938053b14168ec2cecb562dc6bed09ba471"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-fd4-robust-continuation.md"
NEW_FILES = ("scripts/run-nr-k3-fd4-robust-continuation.py",
             "scripts/tests/test_nr_fd4_robust_continuation.py")


def validate_prefix(parent):
    require(parent["schema_version"] == "nr-k3-fd4-robust-window-v1"
            and parent["completed"] is False and parent["sampled_robust_window_gates_passed"] is False
            and parent["source_unchanged"] is True and parent["parent_unchanged"] is True,
            "retained incomplete, unchanged campaign required")
    require(parent["errors"] == [{"type": "ValueError", "message": "E workspace reserve reached"}],
            "only the exact retained capacity stop is eligible")
    require([case_key(r) for r in parent["cases"]] == list(CASES[:6]), "wrong frozen case prefix")
    for i, row in enumerate(parent["cases"]):
        expected = list(TIMES if i < 5 else TIMES[:2])
        require([s["time"] for s in row["samples"]] == expected
                and all(s["step"] == t*256 for s, t in zip(row["samples"], expected))
                and row["dt"] == 1./256 and row["spatial_order"] == 4,
                "changed or incomplete retained sample prefix")
    require(len(parent["commands"]) == 51 and all(c["returncode"] == 0 for c in parent["commands"])
            and parent["temporal"] == [] and "replays" not in parent and "assessment" not in parent,
            "unexpected executed controls or failed native process")


def stop_identity(path):
    require(sha256(path) == STOP_SHA, "wrong frozen stop receipt")
    parent = json.loads(path.read_text(encoding="utf-8"))
    validate_prefix(parent)
    require(parent["source_before"] == parent["source_after"], "stop source drift")
    for names, root in ((parent["source_before"], ROOT), (parent["artifact_hashes"], path.parent)):
        for name, digest in names.items():
            resolved = (root/name).resolve()
            require(resolved.is_relative_to(root) and sha256(resolved) == digest, f"stop identity drift: {name}")
    _, binary = BASE["parent_identity"](Path(parent["parent"]))
    require(sha256(binary) == parent["binary_sha256"], "stop binary drift")
    require(sha256(path.parent/"protocol.frozen.md") == parent["protocol_sha256"], "original protocol drift")
    return parent, binary


def source_identity(parent):
    return {name: sha256(ROOT/name) for name in sorted(set(parent["source_before"]) | set(NEW_FILES))}


def remaining_times(row):
    observed = [s["time"] for s in row["samples"]]
    require(observed and observed == list(TIMES[:len(observed)]), "noncontiguous time prefix")
    return TIMES[len(observed):]


def verify_handoff(reference, current):
    identical = {"checkpoint_equal": reference.read_bytes() == current.read_bytes(),
                 "manifest_equal": reference.with_suffix(".json").read_bytes() == current.with_suffix(".json").read_bytes()}
    require(all(identical.values()), "handoff replay differs from retained T=1")
    return identical


class Runner(BASE["Runner"]):
    def budget(self):
        local = super().budget()
        remaining = BASE["HARD_TIMEOUT"]-self.receipt["original_elapsed_seconds"]-(time.perf_counter()-self.started)
        require(remaining > 0., "original combined 30-minute budget exhausted")
        local_bytes = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(local_bytes+self.receipt["original_artifact_bytes"]+BASE["INFLIGHT"] <= BASE["OUTPUT_LIMIT"],
                "original combined output budget exhausted")
        return min(local, remaining)


def append_samples(runner, binary, row, result):
    baseline, initial = None, None
    if row["family"] == "time":
        baseline = next(r for r in result["cases"] if case_key(r) == ("noise", 12, 20261007, 256))
        initial = read_checkpoint(baseline["initial_checkpoint"])
        fine_initial = read_checkpoint(row["initial_checkpoint"])
        require(all(a.tobytes() == b.tobytes() for a, b in zip(initial.slots, fine_initial.slots)),
                "temporal initial slots changed")
        result["temporal_initial_slots_equal"] = True
    path = Path(row["samples"][-1].get("checkpoint", row["initial_checkpoint"]))
    data = read_checkpoint(path)
    family, n, seed, steps = case_key(row)
    label = f"{family}-n{n}-seed{seed}-s{steps}"
    for t in remaining_times(row):
        name = f"{label}-t{int(t)}"
        current = runner.native(name, binary, data, path, steps)
        data, path = current["data"], current["path"]
        observation = {**sample(data), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
        row["samples"].append(observation)
        new_json(runner.directory/f"{name}-diagnostics.json", observation)
        if baseline is not None:
            comparison = BASE["temporal_comparison"](read_checkpoint(baseline["samples"][int(t)]["checkpoint"]), data, initial)
            result["temporal"].append(comparison)
            new_json(runner.directory/f"{name}-temporal.json", comparison)
    new_json(runner.directory/f"{label}-row.json", row)
    print(json.dumps({"case_complete": label, "samples": len(row["samples"])}), flush=True)


def run_continuation(runner, binary, result):
    partial = result["cases"][-1]
    initial_path = Path(partial["initial_checkpoint"])
    initial = read_checkpoint(initial_path)
    current = runner.native("handoff-n16-seed20261008-t1", binary, initial, initial_path, 256)
    result["handoff"] = verify_handoff(Path(partial["samples"][-1]["checkpoint"]), current["path"])
    # Continue from the original retained checkpoint, NOT from the control output.
    append_samples(runner, binary, partial, result)
    for family, n, seed, steps in CASES[6:]:
        runner.budget()
        data = BASE["initial_checkpoint"](family, n, seed, steps)
        path = runner.directory/f"{family}-n{n}-seed{seed}-s{steps}-initial.bin"
        BASE["STENCIL"]["write_checkpoint"](path, data)
        row = {"family": family, "points": n, "seed": seed, "steps_per_unit": steps,
               "dt": 1./steps, "amplitude": data.header["amplitude"], "spatial_order": 4,
               "initial_checkpoint": str(path), "initial_checkpoint_sha256": sha256(path), "samples": [sample(data)]}
        result["cases"].append(row)
        append_samples(runner, binary, row, result)
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
    reference = BASE["advance_fo_ccz4_rk4_3d"](data.to_state(), data.header["dt"],
                                              gauge=BASE["GAUGE"], gauge_profile=BASE["PROFILE"])
    error = max(float(np.max(abs(a-b))) for a, b in zip(BASE["state_slots"](reference), current["data"].slots))
    require(np.isfinite(error), "nonfinite Python/C++ continuation")
    result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stop", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    stop, directory = args.stop.resolve(), args.output_directory.resolve()
    parent, binary = stop_identity(stop)
    allowed = Path("C:/Users/86137/NRShadowEvidence").resolve()
    require(directory.is_relative_to(allowed) and directory != allowed and not directory.exists(), "fresh C subdirectory required")
    require(shutil.disk_usage(directory.parent).free >= BASE["RESERVE_C"]+BASE["OUTPUT_LIMIT"]
            and shutil.disk_usage(ROOT).free >= BASE["RESERVE_E"], "capacity not restored; nothing written")
    before = source_identity(parent)
    directory.mkdir()
    result = {"schema_version": "nr-k3-fd4-robust-continuation-v1", "stop": str(stop), "stop_sha256": STOP_SHA,
              "source_before": before, "binary": str(binary), "binary_sha256": sha256(binary),
              "original_elapsed_seconds": parent["elapsed_seconds"],
              "original_artifact_bytes": sum(p.stat().st_size for p in stop.parent.rglob("*") if p.is_file()),
              "cases": deepcopy(parent["cases"]), "temporal": [], "commands": [], "errors": [],
              "completed": False, "sampled_robust_window_gates_passed": False,
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              **{key: False for key in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "continuum_convergence_claim",
                 "runtime_writeback", "scientificPayloadWriteback")}}
    runner = Runner(directory, result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json", {"stop_sha256": STOP_SHA, "source": before,
        "cases": CASES, "times": TIMES, "original_protocol_sha256": parent["protocol_sha256"],
        "original_elapsed_seconds": parent["elapsed_seconds"], "combined_timeout_seconds": BASE["HARD_TIMEOUT"],
        "combined_output_limit_bytes": BASE["OUTPUT_LIMIT"], "reserve_c_bytes": BASE["RESERVE_C"],
        "reserve_e_bytes": BASE["RESERVE_E"], "process_timeout_seconds": BASE["PROCESS_TIMEOUT"]})
    try:
        run_continuation(runner, binary, result)
        result["assessment"] = BASE["assess_robust_window"](result["cases"], result["temporal"])
        result["completed"] = True
        result["sampled_robust_window_gates_passed"] = bool(result["assessment"]["sampled_robust_window_gates_passed"]
            and result["temporal_initial_slots_equal"] and result["python_continuation"]["passed"]
            and all(result["handoff"].values()) and all(r["checkpoint_equal"] and r["manifest_equal"] for r in result["replays"]))
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(parent)
        result["source_unchanged"] = before == result["source_after"]
        stop_identity(stop)
        result["stop_unchanged"] = True
        require(sha256(PROTOCOL) == result["protocol_sha256"], "continuation protocol drift")
    except Exception as exc:
        result["source_unchanged"] = result["stop_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["sampled_robust_window_gates_passed"] &= result["source_unchanged"] and result["stop_unchanged"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["combined_elapsed_seconds"] = result["original_elapsed_seconds"]+result["elapsed_seconds"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "sampled_robust_window_gates_passed", "errors")}), flush=True)
    return 0 if result["completed"] and result["source_unchanged"] and result["stop_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

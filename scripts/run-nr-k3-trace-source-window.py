"""Execute the frozen trace-source controls once; retain every failed artifact."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import advance_fo_ccz4_rk4_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import checkpoint_from_state, decode_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_trace_source_window import (  # noqa: E402
    AMPLITUDES, CASES, PARITY_LIMIT, PROFILE, TIMES, WAVES, Case, assess,
    initial, initial_oracle, observe, temporal_comparison,
)

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-auxiliary-manifest.py"))
STENCIL = BASE["STENCIL"]
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
ARCHIVE = Path("C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007")
PARENT = ARCHIVE/"campaign-v2/receipt.json"
PARENT_SHA = "68b1a7c1b2cb5579b9a4aaf7e85e95a49ed2d967694beade2b24b503ed308bbc"
ANALYSIS = ARCHIVE/"trace-source-posthoc-v1.json"
ANALYSIS_SHA = "835ad088d0d51fd9db48a9261545edefecf1a5e8afa339b2368ce2d3db06f04c"
BINARY = ARCHIVE/"campaign-v2/native-build/Release/nr-k2-fo-ccz4-shadow.exe"
BINARY_SHA = "554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-trace-source-window.md"
NEW_FILES = ("science/numerical_relativity/fo_ccz4_trace_source_window.py",
             "science/numerical_relativity/test_fo_ccz4_trace_source_window.py",
             "scripts/run-nr-k3-trace-source-window.py", "scripts/tests/test_nr_trace_source_window.py")
OUTPUT_LIMIT, INFLIGHT, TIME_LIMIT = 192*1024**2, 8*1024**2, 1800.


def retained_identity():
    require(sha256(PARENT) == PARENT_SHA and sha256(ANALYSIS) == ANALYSIS_SHA
            and sha256(BINARY) == BINARY_SHA, "bound receipts or binary changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    analysis = json.loads(ANALYSIS.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["metadata_repair_gates_passed"]
            and parent["source_before"] == parent["source_after"]
            and analysis["source_before"] == analysis["source_after"], "unchanged validated baseline required")
    require(len(analysis["source_before"]) == 150 and all(analysis["source_before"][n] == d
            for n, d in parent["source_before"].items()), "source lineage differs")
    for mapping, base in ((analysis["source_before"], ROOT), (parent["artifact_hashes"], PARENT.parent)):
        for name, digest in mapping.items():
            path = (base/name).resolve()
            require(path.is_relative_to(base.resolve()) and sha256(path) == digest, f"identity drift: {name}")
    return analysis


def source_identity(analysis):
    return {name: sha256(ROOT/name) for name in sorted(set(analysis["source_before"]) | set(NEW_FILES))}


class Runner(BASE["Runner"]):
    def budget(self):
        remaining = TIME_LIMIT-(time.perf_counter()-self.started)
        require(remaining > 0., "frozen 30-minute time budget exhausted")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3 + INFLIGHT, "C evidence reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E workspace reserve reached")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used + INFLIGHT <= OUTPUT_LIMIT, "192MiB output budget reached")
        return min(180., remaining)


def parity_cases():
    return [c for c in CASES if c.n == 8 and c.steps_per_unit == 256 and c.amplitude == AMPLITUDES[1]]


def read(path, order):
    return decode_checkpoint(path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=order)


def python_step(path, output, order):
    require(not output.exists(), "Python output collision")
    data = read(path, order)
    h = data.header
    state = advance_fo_ccz4_rk4_3d(data.to_state(), h["dt"], steps=1,
                                  gauge=STENCIL["GAUGE"], gauge_profile=PROFILE, boundary_mode="periodic")
    result = checkpoint_from_state(state, profile=PROFILE, dt=h["dt"], step=h["step"]+1,
                                   time=h["time"]+h["dt"], scenario=h["scenario"],
                                   amplitude=h["amplitude"], wavelength=h["wavelength"])
    STENCIL["write_checkpoint"](output, result)


def run_cases(runner, result):
    outputs, seeds = {}, {}
    for case in CASES:
        runner.budget()
        data = seed = initial(case)
        path = seed_path = runner.directory/f"{case.label}-t0.bin"
        STENCIL["write_checkpoint"](path, seed)
        row = {**case.record(), "initial_checkpoint": str(path), "initial_sha256": sha256(path),
               "initial_constraint_oracle": initial_oracle(case, seed), "samples": []}
        result["cases"].append(row)
        for t in TIMES:
            runner.budget()
            if t:
                steps = round((t-data.header["time"])*case.steps_per_unit)
                current = runner.native(f"{case.label}-t{t:g}", BINARY, data, path, steps=steps)
                data, path = current["data"], current["path"]
            sample = {**observe(case, data, seed), "checkpoint": str(path), "sha256": sha256(path)}
            row["samples"].append(sample)
            new_json(runner.directory/f"{case.label}-t{t:g}-diagnostics.json", sample)
            require(sample["sample_passed"], f"prospective sample gate failed: {case.label} t={t}")
        outputs[case.label] = current
        seeds[case.label] = (seed, seed_path)
        new_json(runner.directory/f"{case.label}-row.json", row)
    for case in parity_cases():
        current = outputs[case.label]
        native = runner.native(case.label+"-cpp-plus-one", BINARY, current["data"], current["path"], steps=1)
        target = runner.directory/f"{case.label}-python-plus-one.bin"
        runner.execute(case.label+"-python-plus-one", [sys.executable, "-B", Path(__file__),
                        "--python-input", current["path"], "--python-output", target, "--order", case.order])
        error = STENCIL["state_error"](native["data"], read(target, case.order))
        row = {"label": case.label, "max_abs_error": error, "passed": error <= PARITY_LIMIT}
        result["python_parity"].append(row)
        require(row["passed"], "full 58-slot Python/C++ one-step continuation mismatch")
        if case.wave == WAVES[-1]:
            seed, path = seeds[case.label]
            direct = runner.native(case.label+"-direct", BINARY, seed, path, steps=256)
            serial = runner.native(case.label+"-serial", BINARY, seed, path, steps=256, threads=1)
            BASE["compare_pair"](current, direct, cross_version=False)
            BASE["compare_pair"](direct, serial, cross_version=False)
            result["determinism"].append({"label": case.label, "full_checkpoint_and_manifest_bytes_equal": True})
    temporal = []
    for o in (2, 4):
        for f in ("trace", "tracefree"):
            a = outputs[Case(o, 8, WAVES[-1], f, AMPLITUDES[1]).label]["data"]
            b = outputs[Case(o, 8, WAVES[-1], f, AMPLITUDES[1], 512).label]["data"]
            temporal.append({"order": o, "family": f, **temporal_comparison(a, b, AMPLITUDES[1])})
    return assess(result["cases"], temporal)


def campaign(directory):
    analysis = retained_identity()
    require(not directory.exists(), "fresh output directory required; no retries or overwrites")
    require(shutil.disk_usage(directory.parent).free >= 4*1024**3 + OUTPUT_LIMIT, "insufficient evidence reserve")
    before = source_identity(analysis)
    directory.mkdir()
    result = {"schema_version": "nr-k3-trace-source-prospective-v1", "source_before": before,
              "commands": [], "cases": [], "python_parity": [], "determinism": [], "errors": [],
              "completed": False, "prospective_trace_source_screen_passed": False,
              "physical_validation": False, "dynamic_constraint_convergence_validated": False,
              "strong_hyperbolicity_validated": False, "cpbc": False, "black_hole_evolution_validated": False,
              "amr_validated": False, "cuda_validated": False, "long_time_stability_validated": False,
              "runtime_writeback": False, "scientificPayloadWriteback": False,
              "binary": str(BINARY), "binary_sha256": BINARY_SHA,
              "parent_receipt_sha256": PARENT_SHA, "posthoc_analysis_sha256": ANALYSIS_SHA,
              "python_version": sys.version, "platform": platform.platform()}
    runner = Runner(directory, result)
    # Freeze before ANY native evolution; archive copies are exclusive by fresh directory.
    shutil.copyfile(PROTOCOL, directory/"protocol.frozen.md")
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
        require(sha256(target) == before[name], "snapshot identity drift")
    new_json(directory/"frozen-input.json", result)
    try:
        result["assessment"] = run_cases(runner, result)
        require(len(result["commands"]) == 288 and len(result["python_parity"]) == 16
                and len(result["determinism"]) == 4, "frozen execution matrix incomplete")
        runner.budget()
        result["completed"] = True
        result["prospective_trace_source_screen_passed"] = result["assessment"]["prospective_trace_source_screen_passed"]
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(analysis)
        require(result["source_after"] == before, "source changed during campaign")
        require(sha256(PROTOCOL) == result["protocol_sha256"], "protocol changed during campaign")
        retained_identity()
        result["retained_and_source_identity_unchanged"] = True
    except Exception as exc:
        result["retained_and_source_identity_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["prospective_trace_source_screen_passed"] &= not result["errors"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "prospective_trace_source_screen_passed", "errors")}), flush=True)
    return 0 if result["prospective_trace_source_screen_passed"] else 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path)
    parser.add_argument("--python-input", type=Path)
    parser.add_argument("--python-output", type=Path)
    parser.add_argument("--order", type=int, choices=(2, 4))
    args = parser.parse_args()
    if args.python_input:
        require(args.output_directory is None and args.python_output is not None and args.order is not None,
                "Python worker needs input/output/order only")
        python_step(args.python_input, args.python_output, args.order)
        return 0
    require(args.output_directory is not None and args.python_output is None and args.order is None,
            "campaign needs a fresh output directory only")
    return campaign(args.output_directory.resolve())


if __name__ == "__main__":
    raise SystemExit(main())

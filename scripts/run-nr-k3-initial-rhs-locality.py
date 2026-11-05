"""Frozen nine-case instantaneous RHS diagnostic, without time evolution."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import platform
import runpy
import shutil
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import schwarzschild_rhs_locality as L  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import FOCCZ4Config, fo_ccz4_rhs_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import BOUNDARY, halo_mask  # noqa: E402
from science.numerical_relativity.fo_ccz4_lapse_constraint_balance import rhs_slots  # noqa: E402

PREVIOUS = runpy.run_path(str(ROOT/"scripts/analyze-nr-k3-schwarzschild-error-localization.py"))
B, R, D = (PREVIOUS[k] for k in ("B", "R", "D"))
PROBE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-lapse-balance.py"))
sha256, require, new_json = (B[k] for k in ("sha256", "require", "new_json"))
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PARENT = EVIDENCE/"nr-k3-error-localization-v1-20261008/analysis.json"
PARENT_SHA = "482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-initial-rhs-locality.md"
EXTRA = {PROTOCOL.relative_to(ROOT).as_posix(), "scripts/run-nr-k3-initial-rhs-locality.py",
         "scripts/tests/test_nr_initial_rhs_locality.py",
         "science/numerical_relativity/schwarzschild_rhs_locality.py",
         "science/numerical_relativity/test_schwarzschild_rhs_locality.py"}
TRIPLES = PREVIOUS["TRIPLES"]
NAMES = PREVIOUS["NAMES"]
PAIRS = PREVIOUS["PAIRS"]
FLAGS = R["FLAGS"]
PARITY, INPUT_LIMIT = 2.e-12, 2.e-14
OUTPUT_LIMIT, HEADROOM = 384*1024**2, 64*1024**2
C_RESERVE, E_RESERVE = 3*1024**3, 4*1024**3+32*1024**2


def initial_rows(parent):
    rows = [r for r in parent["inventory"] if type(r["time"]) in (int, float) and r["time"] == 0.]
    expected = {(name, n) for ns in TRIPLES for name, n in zip(NAMES, ns, strict=True)}
    actual = [(r["domain"], r["n"]) for r in rows]
    require(len(actual) == len(set(actual)) == 9 and set(actual) == expected,
            "nine unique declared initial checkpoints required")
    require(all(parent["input_checkpoint_hashes"].get(r["path"]) == r["sha256"] for r in rows),
            "initial checkpoint hash inventory mismatch")
    return {(r["domain"], r["n"]): r for r in rows}


def validate_parent(parent):
    require(parent["schema"] == "nr-retained-schwarzschild-error-localization-v1"
            and parent["completed"] is True and parent["errors"] == []
            and parent["source_before"] == parent["source_after"], "completed unchanged localization required")
    require(all(parent[k] is False for k in FLAGS)
            and all(parent[k] is False for k in ("retained_original_passed", "retained_upper_passed", "retained_both_passed")),
            "retained failure/admission changed")
    PREVIOUS["check_coverage"](parent)
    return initial_rows(parent)


def complete_coverage(result):
    expected = {(name, n) for ns in TRIPLES for name, n in zip(NAMES, ns, strict=True)}
    actual = [(r["domain"], r["n"]) for r in result["cases"]]
    require(len(actual) == len(set(actual)) == 9 and set(actual) == expected, "nine RHS cases required")
    expected_pairs = {(ns[0], a, b) for ns in TRIPLES for a, b in PAIRS}
    actual_pairs = [(r["original_n"], r["left_domain"], r["right_domain"]) for r in result["pairs"]]
    require(len(actual_pairs) == len(set(actual_pairs)) == 6 and set(actual_pairs) == expected_pairs,
            "six RHS domain pairs required")
    for row in result["cases"]:
        require([r["slot"] for r in row["core_slot_norms"]] == list(range(58))
                and len(row["parity_by_slot"]) == 58, "all 58 case slots required")
    for row in result["pairs"]:
        require(set(row["regions"]) == {"active", "lower_only", "upper_only", "mixed_lower_upper", "core"},
                "all original-domain partitions required")
        for region in row["regions"].values():
            for field in ("left", "right", "difference"):
                require([r["slot"] for r in region[field]] == list(range(58)), "all 58 pair slots required")
    require(result["thread_replay"]["bytes_equal"] is True and result["probe_call_count"] == 10,
            "ten probe calls including byte replay required")


class Runner:
    def __init__(self, directory, receipt):
        self.directory, self.receipt = directory, receipt
        self.started = time.perf_counter()

    def budget(self):
        # Use the represented absolute deadline, with no floating-point grace.
        remaining = (self.started+900.)-time.perf_counter()
        require(remaining > 0., "900s RHS locality cap reached")
        require(shutil.disk_usage(ROOT).free >= E_RESERVE+HEADROOM
                and shutil.disk_usage("C:/").free >= C_RESERVE, "RHS locality disk reserve reached")
        used = sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
        require(used+HEADROOM <= OUTPUT_LIMIT, "384MiB RHS locality output cap reached")
        return min(180., remaining)

    def execute(self, label, command):
        record = {"label": label, "arguments": list(map(str, command)), "timeout_seconds": self.budget()}
        self.receipt["commands"].append(record)
        print(json.dumps({"phase": label}), flush=True)
        env = dict(os.environ)
        env.update(TEMP=str(self.directory/"compiler-temp"), TMP=str(self.directory/"compiler-temp"),
                   PYTHONDONTWRITEBYTECODE="1")
        start = time.perf_counter()
        try:
            process = subprocess.run(record["arguments"], cwd=ROOT, capture_output=True, text=True,
                errors="replace", env=env, timeout=record["timeout_seconds"], check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            record["returncode"] = process.returncode
            stdout, stderr = process.stdout, process.stderr
        except subprocess.TimeoutExpired as error:
            record.update(returncode=None, timed_out=True)
            stdout, stderr = error.stdout or b"", error.stderr or b""
            raise
        finally:
            record["seconds"] = time.perf_counter()-start
            if "stdout" in locals():
                a = stdout.decode(errors="replace") if isinstance(stdout, bytes) else stdout
                b = stderr.decode(errors="replace") if isinstance(stderr, bytes) else stderr
                with (self.directory/f"{label}.log").open("x", encoding="utf-8") as stream:
                    stream.write(a+"\n[stderr]\n"+b)
        require(process.returncode == 0, f"{label} exited {process.returncode}")
        return stdout, record["seconds"]

    def probe(self, binary, name, n, path, threads=4):
        label = f"{name}-n{n}-threads{threads}"
        output = self.directory/f"{label}.rhs"
        require(not output.exists(), "fresh RHS output required")
        stdout, _ = self.execute(label, [binary, "--input", path, "--output", output, "--threads", threads])
        meta = json.loads(stdout)
        require(meta == {"schema_version": "nr-fo-rhs-inspection-v1", "test_only": True,
                        "evolution_steps": 0, "observed_threads": threads, "points": n, "variable_count": 58},
                "native instantaneous provenance differs")
        self.receipt["probe_call_count"] += 1
        return L.fields(PROBE["read_rhs"](output.read_bytes(), n)), output


def seed(name, n):
    return {"original": lambda: B["seed"](n, 4), "upper": lambda: R["upper_seed"](n),
            "both": lambda: D["expanded_seed"](n)}[name]()


def run_cases(runner, binary, inputs, result):
    for ns in TRIPLES:
        common_rhs, common_inputs = {}, {}
        for name, n in zip(NAMES, ns, strict=True):
            runner.budget()
            item = inputs[name, n]
            path, digest = Path(item["path"]), item["sha256"]
            require(sha256(path) == digest, "retained initial checkpoint drift")
            expected = seed(name, n)
            data = B["read"](path, expected)
            require(data.to_bytes() == expected.to_bytes(), "retained initial differs from declared analytic seed")
            grid = data.domain.grid(n, 4)
            native, output = runner.probe(binary, name, n, path)
            runner.budget()
            print(json.dumps({"phase": "python-rhs", "domain": name, "n": n}), flush=True)
            python_started = time.perf_counter()
            py = L.fields(rhs_slots(fo_ccz4_rhs_3d(data.to_state(), gauge=B["GAUGE"],
                gauge_profile=data.profile, config=FOCCZ4Config(tau_inverse=data.tau_inverse), boundary_mode=BOUNDARY)))
            python_seconds = time.perf_counter()-python_started
            runner.budget()
            error = np.max(np.abs(native-py), axis=(1, 2, 3))
            mask = halo_mask(grid.shape)
            common_rhs[name] = L.common_cube(native, grid, ns[0])
            common_inputs[name] = L.common_cube(data.slots, grid, ns[0])
            result["cases"].append({"domain": name, "n": n, "original_n": ns[0], "spacing": grid.spacing[0],
                "input": str(path), "input_sha256": digest, "rhs": str(output), "rhs_sha256": sha256(output),
                "analytic_seed_bytes_equal": True, "parity_by_slot": error.tolist(),
                "python_rhs_seconds": python_seconds,
                "parity_max_abs": float(error.max()), "parity_passed": bool(error.max() <= PARITY),
                "halo_zero_native": bool(np.all(native[:, mask] == 0.)),
                "halo_zero_python": bool(np.all(py[:, mask] == 0.)),
                "core_slot_norms": L.slot_norms(common_rhs[name], L.core_mask(ns[0])),
                "support_envelopes": L.support_envelopes(grid)})
            if name == "original" and n == 17:
                replay, replay_path = runner.probe(binary, name, n, path, threads=1)
                result["thread_replay"] = {"n": 17, "bytes_equal": output.read_bytes() == replay_path.read_bytes(),
                    "serial_rhs": str(replay_path), "serial_sha256": sha256(replay_path)}
                del replay
            del py, native, data, expected
            print(json.dumps({"RHS_cases": len(result["cases"]), "total": 9}), flush=True)
        for left, right in PAIRS:
            regions = L.compare(common_rhs[left], common_rhs[right])
            input_difference = float(np.max(np.abs(common_inputs[left]-common_inputs[right])))
            result["pairs"].append({"original_n": ns[0], "left_domain": left, "right_domain": right,
                "input_max_abs_difference": input_difference, "input_consistency_passed": input_difference <= INPUT_LIMIT,
                "regions": regions, "active_consistency_passed": regions["active"]["max_abs_difference"] <= PARITY,
                "core_consistency_passed": regions["core"]["max_abs_difference"] <= PARITY})
    complete_coverage(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(EVIDENCE.resolve()) and directory != EVIDENCE.resolve()
            and not directory.exists(), "fresh E evidence child required")
    require(shutil.disk_usage(ROOT).free >= E_RESERVE+OUTPUT_LIMIT
            and shutil.disk_usage("C:/").free >= C_RESERVE, "startup disk reserve reached")
    require(sha256(PARENT) == PARENT_SHA, "localization anchor changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    inputs = validate_parent(parent)
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == digest, "frozen source drift: "+name)
    names = set(parent["source_after"]) | EXTRA
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    directory.mkdir(parents=True)
    (directory/"compiler-temp").mkdir()
    result = {"schema": "nr-schwarzschild-initial-rhs-locality-v1", "completed": False,
        "operator_consistency_passed": False, "errors": [], "commands": [], "cases": [], "pairs": [],
        "thread_replay": {}, "probe_call_count": 0, "source_before": before, "parent_sha256": PARENT_SHA,
        "python": sys.version, "python_executable": sys.executable,
        "numpy": np.__version__, "platform": platform.platform(),
        "protocol_sha256": sha256(PROTOCOL), "retained_evolution_binary_sha256": parent["binary_sha256"],
        "evolution_steps": 0, "new_physical_acceptance_gate": False,
        "retained_original_passed": False, "retained_upper_passed": False, "retained_both_passed": False,
        "parity_limit": PARITY, "input_limit": INPUT_LIMIT, **{k: False for k in FLAGS}}
    runner = Runner(directory, result)
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "source snapshot drift")
        binary = PROBE["build"](runner, result)
        run_cases(runner, binary, inputs, result)
        runner.budget()
        require(all(sha256(Path(r["path"])) == r["sha256"] for r in inputs.values()), "initial input changed")
        require(sha256(PARENT) == PARENT_SHA, "anchor changed during experiment")
        result["completed"] = True
        result["operator_consistency_passed"] = all(r["parity_passed"] and r["halo_zero_native"]
            and r["halo_zero_python"] for r in result["cases"]) and all(r["input_consistency_passed"]
            and r["active_consistency_passed"] and r["core_consistency_passed"] for r in result["pairs"])
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
    if result["source_after"] != before:
        result["errors"].append("source changed during experiment")
    result["operator_consistency_passed"] &= not result["errors"]
    result["completed"] &= not result["errors"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    try:
        runner.budget()
    except Exception as error:
        result["errors"].append(f"finalization {type(error).__name__}: {error}")
        result["completed"] = result["operator_consistency_passed"] = False
    result["seconds"] = time.perf_counter()-runner.started
    # If metadata itself is unexpectedly oversized, preserve raw outputs and
    # abort without creating an oversized receipt, including on failure paths.
    require(len(json.dumps(result, indent=2, sort_keys=True, allow_nan=False).encode("utf-8"))
            < HEADROOM//2, "receipt exceeds reserved output headroom; raw outputs retained")
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "operator_consistency_passed", "errors")}), flush=True)
    return 0 if result["completed"] and result["operator_consistency_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

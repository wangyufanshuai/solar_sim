"""Explicit six-segment FD2 completion after the retained window timeout.

This completes only the FD2 submatrix, never the full longer-window gate.
The old receipt, native binary, numerical criteria and solver stay unchanged.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import runpy
import shutil
import time

ROOT = Path(__file__).resolve().parents[1]
WINDOW = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-window.py"))
sha256, require, new_json, read, seed, sample = (
    WINDOW[k] for k in ("sha256", "require", "new_json", "read", "seed", "sample"))
STOPPED = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-window-v1-20261007/receipt.json")
STOPPED_SHA = "1145c54a096e6754f56b9de15067b017d9d29881a661b3779b7fbd631765e887"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-schwarzschild-fd2-completion.md"
NEW = {"scripts/run-nr-k3-schwarzschild-fd2-completion.py",
       "scripts/tests/test_nr_schwarzschild_fd2_completion.py"}
TARGETS = (.375, .5, .625, .75, .875, 1.)


def verify_stopped():
    WINDOW["lineage"]()
    require(sha256(STOPPED) == STOPPED_SHA, "stopped receipt identity changed")
    value = json.loads(STOPPED.read_text(encoding="utf-8"))
    require(not value["completed"] and not value["window_passed"]
            and len(value["errors"]) == 1 and len(value["commands"]) == 8
            and value["commands"][-1]["label"] == "fd2-n33-t0.5"
            and value["commands"][-1].get("timed_out") is True
            and all(c["returncode"] == 0 for c in value["commands"][:-1]), "unexpected failure lineage")
    require(value["source_before"] == value["source_after"], "stopped source changed")
    for name, digest in value["source_after"].items():
        require(sha256(ROOT/name) == sha256(STOPPED.parent/"source-snapshot"/name) == digest,
                "inherited source drift: "+name)
    for name, digest in value["artifact_hashes"].items():
        require(sha256(STOPPED.parent/name) == digest, "stopped artifact drift: "+name)
    require(sha256(WINDOW["PROTOCOL"]) == value["protocol_sha256"], "old protocol changed")
    require(not (STOPPED.parent/"fd2-n33-t0.5.bin").exists()
            and not (STOPPED.parent/"fd2-n33-t0.5.json").exists(), "timed-out output unexpectedly exists")
    return value


def retained_rows(value):
    rows = copy.deepcopy(value["cases"])
    require([(r["order"], r["n"]) for r in rows] == [(2, 17), (2, 25), (2, 33)], "unexpected retained cases")
    for row in rows:
        expected = list(WINDOW["TIMES"] if row["n"] != 33 else WINDOW["TIMES"][:2])
        require([s["diagnostics"]["time"] for s in row["samples"]] == expected, "unexpected retained times")
        for saved in row["samples"]:
            path = Path(saved["path"])
            data = read(path, seed(row["n"], 2))
            require(sample(data, path, retained=saved["retained"]) == saved, "retained diagnostics changed")
            saved["retained"] = True
    return rows


def assess_fd2(rows):
    require(len(rows) == 3 and {(r["order"], r["n"]) for r in rows} == {(2, n) for n in (17, 25, 33)},
            "exact FD2 grid triple required")
    lookup = {r["n"]: r for r in rows}
    for row in rows:
        require([s["diagnostics"]["time"] for s in row["samples"]] == list(WINDOW["TIMES"]),
                "all four FD2 diagnostic times required")
        require(all(set(s["diagnostics"]["core"]) == set(WINDOW["METRICS"]) for s in row["samples"]),
                "complete FD2 diagnostics required")
    groups = []
    for index, t in enumerate(WINDOW["TIMES"][1:], 1):
        for metric in WINDOW["PRIMARY"]:
            values = [lookup[n]["samples"][index]["diagnostics"]["core"][metric]["l2"] for n in (17, 25, 33)]
            groups.append({"spatial_order": 2, "time": t, "metric": metric,
                           **WINDOW["BASE"]["refinement"](values, 2)})
    return {"groups": groups, "passed": all(g["passed"] for g in groups)}


class Runner(WINDOW["Runner"]):
    def budget(self):
        remaining = 1000.-(time.perf_counter()-self.started)
        require(remaining > 0., "1000s FD2 completion cap reached")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3+32*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+16*1024**2
                <= 128*1024**2, "128MiB output cap reached")
        return min(180., remaining)


def run(runner, stopped, receipt):
    receipt["cases"] = retained_rows(stopped)
    row = next(r for r in receipt["cases"] if r["n"] == 33)
    path = Path(row["samples"][-1]["path"])
    data = read(path, seed(33, 2))
    for target in TARGETS:
        require(WINDOW["steps_to"](data, target) == 32, "frozen 32-step segmentation changed")
        data, path, _ = runner.native(Path(stopped["binary"]), f"fd2-n33-t{target:g}", data, path, 32)
        observation = sample(data, path)
        (row["samples"] if target in WINDOW["TIMES"] else receipt["intermediate_samples"]).append(observation)
    receipt["fd2_assessment"] = assess_fd2(receipt["cases"])
    observations = [s for r in receipt["cases"] for s in r["samples"]]+receipt["intermediate_samples"]
    receipt["bounded_fd2_window"] = all(s["bounded_window"] for s in observations)
    receipt["completion_passed"] = receipt["bounded_fd2_window"] and receipt["fd2_assessment"]["passed"]
    receipt["fd2_completed"] = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    directory = parser.parse_args().output_directory.resolve()
    stopped = verify_stopped()
    require(not directory.exists(), "fresh completion directory required")
    directory.mkdir(parents=True)
    names = set(stopped["source_after"]) | NEW
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    for name in before:
        dest = directory/"source-snapshot"/name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, dest)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    receipt = {"schema": "nr-k3-schwarzschild-fd2-completion-v1", "parent": str(STOPPED),
        "parent_sha256": STOPPED_SHA, "source_before": before, "protocol_sha256": sha256(PROTOCOL),
        "binary": stopped["binary"], "binary_sha256": stopped["binary_sha256"],
        "fd2_completed": False, "completion_passed": False, "completed": False, "window_passed": False,
        "physical_validation": False, "physical_boundary_validated": False,
        "black_hole_evolution_validated": False, "runtime_writeback": False,
        "scientificPayloadWriteback": False, "gpu_validated": False,
        "original_attempt_seconds": stopped["seconds"], "errors": [], "commands": [],
        "cases": [], "intermediate_samples": []}
    runner = Runner(directory, receipt)
    try:
        run(runner, stopped, receipt)
        runner.budget()
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
        receipt["fd2_completed"] = receipt["completion_passed"] = False
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["combined_attempt_seconds"] = receipt["seconds"]+stopped["seconds"]
        receipt["source_after"] = {n: sha256(ROOT/n) for n in sorted(names)}
        if before != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]:
            receipt["errors"].append("source/protocol changed during execution")
            receipt["fd2_completed"] = receipt["completion_passed"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({k: receipt[k] for k in ("fd2_completed", "completion_passed", "window_passed", "errors")}), flush=True)
    return 0 if receipt["fd2_completed"] and receipt["completion_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

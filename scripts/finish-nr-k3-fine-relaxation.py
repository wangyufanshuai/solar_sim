"""Explicit resource-stop completion; never rewrites either failed parent."""
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
BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fine-relaxation.py"))
sha256, new_json, require, read = (BASE[k] for k in ("sha256", "new_json", "require", "read"))
FineCase = BASE["FineCase"]
MISSING = FineCase(4, 32, 1., 1024)
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-fine-relaxation-v1-20261007/receipt.json")
PARENT_SHA = "8425a85ee03170aafef3236a43c07c1e46c8021b8477c6a733e940189bee0fb5"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-fine-relaxation-completion.md"
NEW = {"scripts/finish-nr-k3-fine-relaxation.py", "scripts/tests/test_nr_fine_relaxation_completion.py"}


def validate_stop(parent):
    require(parent["schema_version"] == "nr-k3-fine-relaxation-v1"
            and parent["completed"] is False and parent["convergence_passed"] is False
            and parent["serial_direct_restart_equal"] is False, "expected incomplete resource-stop parent")
    require(len(parent["errors"]) == 1 and parent["errors"][0]["type"] == "TimeoutExpired",
            "not the declared timeout stop")
    commands = parent["commands"]
    require(len(commands) == 24 and all(c.get("returncode") == 0 and not c.get("timed_out")
                                      for c in commands[:-1]), "unexpected command prefix")
    last = commands[-1]
    require(last["label"] == MISSING.label+"-t0.25" and last.get("returncode") is None
            and last.get("timed_out") is True and 0. < last["timeout_seconds"] < 180.
            and last["seconds"] >= last["timeout_seconds"] and 1800. <= parent["seconds"] < 1805.,
            "not the declared total-budget timeout")
    rows = parent["cases"]
    require(len(rows) == 20 and {r["label"] for r in rows} == {c.label for c in BASE["CASES"]},
            "unexpected case prefix")
    by_label = {r["label"]: r for r in rows}
    for case in BASE["CASES"]:
        row = by_label[case.label]
        require(all(row[k] == v for k, v in BASE["metadata"](case).items()), "retained case identity mismatch")
        times = [0., .125] if case == MISSING else list(BASE["TIMES"])
        require([s["time"] for s in row["samples"]] == times, "unexpected partial sample prefix")
        require(all(set(s["metrics"]) == set(BASE["FLOORS"]) for s in row["samples"]),
                "incomplete retained diagnostic coverage")


def retained():
    BASE["retained"]()  # Also bind the coarse study and its native binary.
    require(sha256(PARENT) == PARENT_SHA, "resource-stop receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    validate_stop(parent)
    require(parent["source_before"] == parent["source_after"] and len(parent["source_after"]) == 174,
            "source coverage/drift at resource stop")
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == sha256(PARENT.parent/"source-snapshot"/name) == digest,
                "retained source drift: "+name)
    for name, digest in parent["artifact_hashes"].items():
        require(sha256(PARENT.parent/name) == digest, "retained artifact drift: "+name)
    for suffix in ("bin", "json"):
        require(not (PARENT.parent/f"{MISSING.label}-t0.25.{suffix}").exists(),
                "timed-out output unexpectedly exists")
    for row in parent["cases"]:
        case = FineCase(row["spatial_order"], row["n"], row["rate"], row["steps_per_unit"])
        for sample in row["samples"]:
            path = Path(sample["path"])
            data = read(path, case)
            require(data.header["points"] == case.n and data.header["dt"] == 1./case.steps_per_unit,
                    "retained checkpoint grid mismatch")
            require(BASE["sample_record"](data, path, sample["time"]) == sample,
                    "retained diagnostic mismatch")
    return parent


class Runner(BASE["Runner"]):
    def budget(self):
        remaining = 900. - (time.perf_counter() - self.started)
        require(remaining > 0., "900s completion budget exhausted")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3 + 32*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) + 32*1024**2
                <= 128*1024**2, "128MiB completion output cap")
        return min(180., remaining)


def finish(runner, receipt):
    binary = Path(receipt["binary"])
    row = next(r for r in receipt["cases"] if r["label"] == MISSING.label)
    previous = row["samples"][-1]
    path = Path(previous["path"])
    data, final, _ = runner.native(binary, "continued-"+MISSING.label+"-t0.25", read(path, MISSING), path,
                                   steps=128)
    sample = BASE["sample_record"](data, final, .25)
    row["samples"].append(sample)
    new_json(runner.directory/"continued-final-diagnostics.json", sample)
    replay_case = FineCase(4, 24, 1.)
    seed = PARENT.parent/f"{replay_case.label}-initial.bin"
    _, replay, _ = runner.native(binary, "direct-serial-replay", read(seed, replay_case), seed,
                                 steps=128, threads=1)
    target = PARENT.parent/f"{replay_case.label}-t0.25.bin"
    require(replay.read_bytes() == target.read_bytes(), "serial/direct checkpoint mismatch")
    require(replay.with_suffix(".json").read_bytes() == target.with_suffix(".json").read_bytes(),
            "serial/direct manifest mismatch")
    receipt["serial_direct_restart_equal"] = True
    receipt["assessment"] = BASE["assess"](receipt["cases"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    parent = retained()
    names = set(parent["source_after"]) | NEW
    before = BASE["BASE"]["identity"](names)
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True, exist_ok=False)
    receipt = {"schema_version": "nr-k3-fine-relaxation-completion-v1", "completed": False,
        "convergence_passed": False, "source_before": before, "commands": [], "errors": [],
        "cases": deepcopy(parent["cases"]), "serial_direct_restart_equal": False,
        "parent_receipt": str(PARENT), "parent_receipt_sha256": PARENT_SHA,
        "parent_completed": False, "parent_convergence_passed": False, "inherited_sample_count": 59,
        "parent_seconds": parent["seconds"], "binary": parent["binary"], "binary_sha256": parent["binary_sha256"],
        "protocol_sha256": sha256(PROTOCOL), "physical_validation": False, "runtime_writeback": False,
        "scientificPayloadWriteback": False, "live_admitted": False, "cuda_validated": False,
        "constraint_propagation_proved": False,
        "environment": {"platform": platform.platform(), "python": sys.version, "numpy": np.__version__}}
    runner = Runner(directory, receipt)
    try:
        runner.budget()
        for name in before:
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT/name, target)
        shutil.copy2(PROTOCOL, directory/PROTOCOL.name)
        finish(runner, receipt)
        runner.budget()
        receipt["completed"] = True
        receipt["convergence_passed"] = receipt["assessment"]["passed"] and receipt["serial_direct_restart_equal"]
    except Exception as error:
        receipt["errors"].append({"type": type(error).__name__, "message": str(error)})
    finally:
        receipt["source_after"] = BASE["BASE"]["identity"](names)
        if (before != receipt["source_after"] or sha256(PARENT) != PARENT_SHA
                or sha256(Path(receipt["binary"])) != receipt["binary_sha256"]
                or sha256(PROTOCOL) != receipt["protocol_sha256"]):
            receipt["completed"] = receipt["convergence_passed"] = False
            receipt["errors"].append({"type": "IdentityDrift", "message": "source/parent/binary/protocol changed"})
        receipt["seconds"] = time.perf_counter() - runner.started
        receipt["combined_execution_seconds"] = parent["seconds"] + receipt["seconds"]
        receipt["original_1800s_budget_met"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                      for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({k: receipt[k] for k in ("completed", "convergence_passed", "errors", "seconds")}), flush=True)
    return 0 if receipt["convergence_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

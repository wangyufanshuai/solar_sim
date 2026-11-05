"""Immutable-solver extended Schwarzschild window and moved-boundary control."""
from __future__ import annotations

import argparse
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
from science.numerical_relativity.fo_ccz4_exterior_window import (  # noqa: E402
    TIMES, METRICS, PRIMARY, diagnostics, boundary_location_difference, timestep_difference,
)
from science.numerical_relativity.fo_ccz4_checkpoint import checkpoint_from_state  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import SchwarzschildDomain, initial_state  # noqa: E402

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-domain.py"))
sha256, require, new_json, read, encode, seed = (BASE[k] for k in ("sha256", "require", "new_json", "read", "encode", "seed"))
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007/receipt.json")
PARENT_SHA = "118aa862fd0646a122a9b1d5e60ac1d8737875ec2cb098ffd404d8781366a964"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-schwarzschild-window.md"
NEW = {"science/numerical_relativity/fo_ccz4_exterior_window.py",
       "science/numerical_relativity/test_fo_ccz4_exterior_window.py",
       "scripts/run-nr-k3-schwarzschild-window.py", "scripts/tests/test_nr_schwarzschild_window.py"}
SIZES = (17, 25, 33)


def lineage():
    require(sha256(PARENT) == PARENT_SHA, "parent receipt drift")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["convergence_passed"] and not parent["errors"]
            and parent["source_before"] == parent["source_after"], "completed parent required")
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == sha256(PARENT.parent/"source-snapshot"/name) == digest, "source drift: "+name)
    for name, digest in parent["artifact_hashes"].items():
        require(sha256(PARENT.parent/name) == digest, "artifact drift: "+name)
    require(sha256(Path(parent["binary"])) == parent["binary_sha256"], "binary drift")
    return parent


class Runner(BASE["Runner"]):
    def budget(self):
        remaining = 1200.-(time.perf_counter()-self.started)
        require(remaining > 0., "1200s window cap reached")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3+32*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+32*1024**2
                <= 384*1024**2, "384MiB output cap reached")
        return min(180., remaining)


def sample(data, path, *, retained=False):
    value = diagnostics(data)
    bounded = (0. < value["alpha_range"][0] <= value["alpha_range"][1] < 2.
               and value["chi_range"][0] > 0. and value["all_active_state_error"]["linf"] <= .01
               and value["halo_error_linf"] <= 2.e-14)
    return {"path": str(path), "sha256": sha256(path), "retained": retained,
            "diagnostics": value, "bounded_window": bounded}


def assess(rows):
    require(len(rows) == 6 and {(r["order"], r["n"]) for r in rows} == {(o, n) for o in (2, 4) for n in SIZES},
            "complete six-case matrix required")
    lookup = {(r["order"], r["n"]): r for r in rows}
    for row in rows:
        require([s["diagnostics"]["time"] for s in row["samples"]] == list(TIMES), "missing window times")
        for s in row["samples"]:
            require(set(s["diagnostics"]["core"]) == set(METRICS), "incomplete field diagnostics")
    groups = []
    for order in (2, 4):
        for index, t in enumerate(TIMES[1:], 1):
            for metric in PRIMARY:
                values = [lookup[order, n]["samples"][index]["diagnostics"]["core"][metric]["l2"] for n in SIZES]
                groups.append({"spatial_order": order, "time": t, "metric": metric,
                               **BASE["refinement"](values, order)})
    return {"groups": groups, "passed": all(g["passed"] for g in groups)}


def expanded_seed():
    domain = SchwarzschildDomain(.5, 3.5)
    return checkpoint_from_state(initial_state(25, 4, domain), profile=BASE["PROFILE"],
                                 dt=1./256, scenario=2, amplitude=0., tau_inverse=1., domain=domain)


def steps_to(data, target):
    count = (target-data.header["time"])/data.header["dt"]
    require(count > 0 and count == int(count), "exact positive integer step count required")
    return int(count)


def run(runner, parent, receipt):
    binary = Path(parent["binary"])
    lookup = {(c["order"], c["n"]): c for c in parent["cases"]}
    outputs = {}
    for order in (2, 4):
        for n in SIZES:
            label = f"fd{order}-n{n}"
            old = lookup[order, n]["samples"][-1]
            path = Path(old["path"])
            data = read(path, seed(n, order))
            require(BASE["sample"](data, path) == old, "retained diagnostic changed")
            row = {"order": order, "n": n, "samples": [sample(data, path, retained=True)]}
            receipt["cases"].append(row)
            outputs[order, n, .125] = data, path, path.with_suffix(".json")
            for t in TIMES[1:]:
                data, path, meta = runner.native(binary, label+f"-t{t:g}", data, path, steps_to(data, t))
                row["samples"].append(sample(data, path))
                outputs[order, n, t] = data, path, meta
    receipt["assessment"] = assess(receipt["cases"])
    data = expanded_seed()
    original = read(PARENT.parent/"fd4-n17-initial.bin", seed(17, 4))
    require(np.array_equal(original.slots, np.asarray(data.slots)[:, 4:21, 4:21, 4:21]), "initial shared fields differ")
    path = runner.directory/"expanded-initial.bin"
    encode(path, data)
    receipt["initial_shared_fields_byte_equal"] = True
    for t in TIMES:
        data, path, _ = runner.native(binary, f"expanded-n25-t{t:g}", data, path, steps_to(data, t))
        receipt["expanded_samples"].append(sample(data, path))
        receipt["boundary_comparisons"].append(boundary_location_difference(outputs[4, 17, t][0], data))
    path = PARENT.parent/"dt-control-fd4.bin"
    data = read(path, seed(33, 4, 1./512))
    for t in (.25, .5, .75, 1.):
        data, path, _ = runner.native(binary, f"dt-control-fd4-n33-t{t:g}", data, path, steps_to(data, t))
        if t != .75:
            receipt["time_samples"].append(sample(data, path))
            receipt["time_controls"].append(timestep_difference(outputs[4, 33, t][0], data))
        else:
            receipt["execution_split"] = sample(data, path)
    direct = runner.native(binary, "serial-direct-fd4-n17-t1", seed(17, 4),
                           PARENT.parent/"fd4-n17-initial.bin", 256, threads=1)
    staged = outputs[4, 17, 1.]
    require(direct[1].read_bytes() == staged[1].read_bytes() and direct[2].read_bytes() == staged[2].read_bytes(),
            "longer-window replay mismatch")
    receipt["deterministic_replay"] = True
    samples = ([s for row in receipt["cases"] for s in row["samples"]]+receipt["expanded_samples"]
               +receipt["time_samples"]+[receipt["execution_split"]])
    receipt["bounded_window"] = all(s["bounded_window"] for s in samples)
    receipt["window_passed"] = (receipt["bounded_window"] and receipt["assessment"]["passed"]
                                and all(r["passed"] for r in receipt["time_controls"]))
    receipt["completed"] = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    directory = parser.parse_args().output_directory.resolve()
    parent = lineage()
    require(not directory.exists(), "fresh evidence directory required")
    directory.mkdir(parents=True)
    names = set(parent["source_after"]) | NEW
    before = {n: sha256(ROOT/n) for n in sorted(names)}
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    receipt = {"schema": "nr-k3-schwarzschild-window-v1", "parent": str(PARENT), "parent_sha256": PARENT_SHA,
        "source_before": before, "protocol_sha256": sha256(PROTOCOL), "python": platform.python_version(),
        "numpy": np.__version__, "binary": parent["binary"], "binary_sha256": parent["binary_sha256"],
        "completed": False, "window_passed": False, "physical_validation": False,
        "physical_boundary_validated": False, "black_hole_evolution_validated": False,
        "runtime_writeback": False, "scientificPayloadWriteback": False, "gpu_validated": False,
        "errors": [], "commands": [], "cases": [], "expanded_samples": [], "boundary_comparisons": [],
        "time_samples": [], "time_controls": []}
    runner = Runner(directory, receipt)
    try:
        run(runner, parent, receipt)
        runner.budget()
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
        receipt["completed"] = receipt["window_passed"] = False
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["source_after"] = {n: sha256(ROOT/n) for n in sorted(names)}
        if before != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]:
            receipt["errors"].append("source/protocol changed during execution")
            receipt["completed"] = receipt["window_passed"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({"completed": receipt["completed"], "window_passed": receipt["window_passed"],
                          "errors": receipt["errors"], "receipt": str(directory/"receipt.json")}), flush=True)
    return 0 if receipt["completed"] and receipt["window_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

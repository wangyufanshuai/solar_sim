"""Complete the exact retained E-reserve stop without retrying finished work.

The original matrix runner, source snapshot, protocol, numerical decisions and
native binary remain immutable. This separate lineage permits only the two
missing dt49 intervals followed by the originally specified coarse replay.
"""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path
import platform
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
D = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-domain-matrix.py"))
RUN, W, B = D["RUN"], D["W"], D["B"]
require, sha256, new_json = D["require"], D["sha256"], D["new_json"]
STOPPED = RUN["EVIDENCE_ROOT"]/"nr-k3-domain-matrix-dt49-v1-20261008/receipt.json"
STOPPED_SHA = "0f34ebc5d77b493d3675c8dff6777c2f4e75dddc7da271c8d2853b5c46261047"
BASE_PROTOCOL_SHA = "cbc6caf883289c11dad76dd5fec3df941c440b02e4e3b2d774e44492663e9e0c"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-domain-matrix-completion.md"
SCHEMA = "nr-k3-domain-matrix-resource-completion-v1"
NEW = {"scripts/finish-nr-k3-schwarzschild-domain-matrix.py",
       "scripts/tests/test_nr_schwarzschild_domain_completion.py"}
COLLECTIONS = ("study_cases", "shared_initial", "time_samples", "time_controls",
               "region_comparisons", "spatial_assessment", "time_initial")
FLAGS = D["FLAGS"]


def validate_stop(value):
    require(value["schema"] == D["SCHEMA"] and value["stage"] == "dt49", "wrong resource predecessor")
    require(all(value[k] is False for k in (*FLAGS, "stage_completed", "stage_passed",
                "study_completed", "study_passed", "retained_window_passed")), "stop/promotion flags changed")
    require(value["errors"] == ["ValueError: E reserve plus next-output headroom reached"],
            "only the exact reviewed storage stop is admissible")
    commands = value["commands"]
    require([c["label"] for c in commands] == ["dt-expanded-n49-t0.25", "dt-expanded-n49-t0.5"],
            "exact successful command prefix required")
    require(all(c["returncode"] == 0 and not c.get("timed_out", False)
                and c["timeout_seconds"] == 600. for c in commands), "failed/changed retained command")
    require([s["diagnostics"]["time"] for s in value["time_samples"]] == [.25, .5]
            and [c["time"] for c in value["time_controls"]] == [.25, .5], "exact dt49 prefix required")
    require(all(set(c["metrics"]) == set(W["METRICS"]) and c["passed"] is True
                for c in value["time_controls"]), "retained time control incomplete")
    samples = D["all_samples"](value)
    require(len(samples) == 29 and len({s["path"] for s in samples}) == 29, "29 distinct retained samples required")
    require(value["spatial_assessment"] == D["assess_spatial"](value), "retained spatial decisions changed")
    require(value["time_initial"]["state_byte_equal"] is True, "retained analytic initial identity missing")
    require(not value.get("deterministic_replay", False) and "replay_paths" not in value, "unexpected completed replay")
    require(all(math.isfinite(value[k]) and value[k] > 0. for k in ("seconds", "study_chain_seconds"))
            and value["seconds"] < 3000. and value["seconds"] < value["study_chain_seconds"] < 7200.,
            "retained resource accounting invalid")
    require(value["stage_caps"] == list(D["CAPS"]["dt49"]), "retained resource limits changed")


def verify_stop():
    original = D["baseline"]()
    value = RUN["archive"](STOPPED, STOPPED_SHA)
    validate_stop(value)
    require(value["protocol_sha256"] == sha256(D["PROTOCOL"]) == BASE_PROTOCOL_SHA, "frozen protocol drift")
    parent, _, _, _ = D["parent_for"]("dt49", Path(value["parent"]), value["parent_sha256"], original)
    require(value["binary_sha256"] == original["binary_sha256"]
            and value["source_after"] == parent["source_after"], "predecessor kernel/source mismatch")
    return original, value


def directory_bytes(directory):
    return sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())


class Runner(D["Runner"]):
    def __init__(self, directory, receipt, stage, prior_seconds, prior_stage_seconds=0., prior_stage_bytes=0):
        super().__init__(directory, receipt, stage, prior_seconds)
        self.prior_stage_seconds = prior_stage_seconds
        self.prior_stage_bytes = prior_stage_bytes

    def budget(self):
        cap, size, headroom, single = D["CAPS"]["dt49" if self.stage == "dt49-tail" else "replay"]
        elapsed = time.perf_counter()-self.started
        remaining = min(cap-self.prior_stage_seconds-elapsed, 7200.-self.prior_seconds-elapsed)
        require(remaining > 0., "cumulative stage/7200s study cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+headroom*1024**2,
                "E reserve plus next-output headroom reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C reserve reached")
        require(self.prior_stage_bytes+directory_bytes(self.directory)+headroom*1024**2 <= size*1024**2,
                "cumulative stage output cap reached")
        return min(single, remaining)


def inherit(parent):
    value = {key: copy.deepcopy(parent[key]) for key in COLLECTIONS}
    for sample in D["all_samples"](value):
        sample["retained"] = True
    return value


def check_time_prefix(receipt):
    seed = D["expanded_seed"](49, 1./512)
    initial_path = Path(receipt["time_initial"]["path"])
    require(sha256(initial_path) == receipt["time_initial"]["sha256"], "time initial changed")
    initial = B["read"](initial_path, seed)
    require(np.asarray(initial.slots).tobytes() == np.asarray(seed.slots).tobytes(), "analytic initial bytes differ")
    last = None
    for saved, control in zip(receipt["time_samples"], receipt["time_controls"], strict=True):
        path = Path(saved["path"])
        require(sha256(path) == saved["sha256"], "retained time checkpoint changed")
        data = D["ERROR"]["AUDIT"]["load"](path, checksums=True)
        require(data.header["points"] == 49 and data.header["dt"] == 1./512
                and data.domain == D["DOMAIN"] and data.header["time"] == control["time"], "retained state identity mismatch")
        require(W["sample"](data, path, retained=True) == saved, "retained diagnostics changed")
        require(RUN["halo_bytes"](data) == RUN["halo_bytes"](initial), "retained halo bytes changed")
        base, _ = D["primary"](receipt, 49, control["time"])
        require(W["timestep_difference"](base, data) == control, "retained signed time control changed")
        last = data, path
    require(last is not None and last[0].header["time"] == .5 and last[0].header["step"] == 256,
            "exact T=.5 restart required")
    return last


def run_tail(runner, receipt):
    data, path = check_time_prefix(receipt)
    for target in (.75, 1.):
        data, path, _ = runner.native(Path(receipt["binary"]), f"dt-expanded-n49-t{target:g}", data, path, 128)
        require(data.header["time"] == target, "tail target mismatch")
        receipt["time_samples"].append(W["sample"](data, path))
        if target == 1.:
            base, _ = D["primary"](receipt, 49, target)
            receipt["time_controls"].append(W["timestep_difference"](base, data))
    receipt["stage_passed"] = (all(s["bounded_window"] for s in D["all_samples"](receipt))
                               and all(c["passed"] for c in receipt["time_controls"]))


def tail_parent(path, digest):
    require(path is not None and digest is not None, "explicit completed tail parent required")
    path = path.resolve()
    require(path.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "tail outside declared E evidence")
    value = RUN["archive"](path, digest)
    require(value["schema"] == SCHEMA and value["stage"] == "dt49-tail" and value["stage_completed"]
            and not value["study_completed"] and not value["errors"], "tail execution incomplete")
    require(value["parent"] == str(STOPPED) and value["parent_sha256"] == STOPPED_SHA
            and value["resource_predecessor_sha256"] == STOPPED_SHA
            and value["protocol_sha256"] == sha256(PROTOCOL)
            and value["base_protocol_sha256"] == BASE_PROTOCOL_SHA, "tail lineage/protocol drift")
    require(all(value[k] is False for k in FLAGS), "tail cannot promote")
    require([s["diagnostics"]["time"] for s in value["time_samples"]] == [.25, .5, .75, 1.]
            and [c["label"] for c in value["commands"]] == ["dt-expanded-n49-t0.75", "dt-expanded-n49-t1"]
            and all(c["returncode"] == 0 for c in value["commands"]), "tail inventory/commands incomplete")
    return value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=("dt49-tail", "replay"), required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--parent-receipt", type=Path)
    parser.add_argument("--parent-sha256")
    args = parser.parse_args()
    original, stopped = verify_stop()
    if args.stage == "dt49-tail":
        require(args.parent_receipt is None and args.parent_sha256 is None, "tail uses the fixed stopped receipt")
        parent, parent_path, parent_sha = stopped, STOPPED, STOPPED_SHA
    else:
        parent = tail_parent(args.parent_receipt, args.parent_sha256)
        parent_path, parent_sha = args.parent_receipt.resolve(), args.parent_sha256
    directory = args.output_directory.resolve()
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh declared E child required")
    names = set(stopped["source_after"]) | NEW
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    receipt = {"schema": SCHEMA, "stage": args.stage, "parent": str(parent_path), "parent_sha256": parent_sha,
        "resource_predecessor": str(STOPPED), "resource_predecessor_sha256": STOPPED_SHA,
        "baseline": str(D["BASELINE"]), "baseline_sha256": D["BASELINE_SHA"], "retained_window_passed": False,
        "protocol_sha256": sha256(PROTOCOL), "base_protocol_sha256": BASE_PROTOCOL_SHA,
        "c_reserve_bytes": RUN["C_RESERVE"], "e_reserve_bytes": RUN["E_RESERVE"],
        "binary": stopped["binary"], "binary_sha256": stopped["binary_sha256"],
        "source_before": before, "python": platform.python_version(), "numpy": np.__version__,
        "stage_completed": False, "stage_passed": False, "study_completed": False, "study_passed": False,
        "commands": [], "errors": [], **{k: False for k in FLAGS}, **inherit(parent)}
    prior_stage = stopped["seconds"] if args.stage == "dt49-tail" else 0.
    prior_bytes = directory_bytes(STOPPED.parent) if args.stage == "dt49-tail" else 0
    receipt.update(prior_stage_seconds=prior_stage, prior_stage_bytes=prior_bytes,
                   stage_caps=D["CAPS"]["dt49" if args.stage == "dt49-tail" else "replay"])
    runner = Runner(directory, receipt, args.stage, parent["study_chain_seconds"], prior_stage, prior_bytes)
    runner.budget()
    directory.mkdir(parents=True)
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    for protocol in (PROTOCOL, D["PROTOCOL"]):
        shutil.copyfile(protocol, directory/protocol.name)
    try:
        if args.stage == "dt49-tail":
            run_tail(runner, receipt)
        else:
            D["run_replay"](runner, original, receipt)
        runner.budget()
        receipt["stage_completed"] = True
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["stage_combined_seconds"] = prior_stage+receipt["seconds"]
        receipt["study_chain_seconds"] = parent["study_chain_seconds"]+receipt["seconds"]
        receipt["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
        if (before != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]
                or sha256(D["PROTOCOL"]) != BASE_PROTOCOL_SHA or sha256(STOPPED) != STOPPED_SHA
                or sha256(Path(receipt["binary"])) != receipt["binary_sha256"]):
            receipt["errors"].append("source/protocol/predecessor/binary changed during execution")
        if receipt["errors"]:
            for key in ("stage_completed", "stage_passed", "study_completed", "study_passed"):
                receipt[key] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({key: receipt[key] for key in
              ("stage", "stage_completed", "stage_passed", "study_completed", "study_passed", "errors")}), flush=True)
    return 0 if receipt["stage_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Separately frozen finer-grid test; the parent aggregate remains failed."""
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
from science.numerical_relativity.fo_ccz4_fine_relaxation import (  # noqa: E402
    CASES, FRESH, RETAINED, TIMES, FineCase, constraint_orders, initial_data,
    rms, signed_time_control, state_orders, STATE_FLOOR, TIME_RATIO_MAX,
)
from science.numerical_relativity.fo_ccz4_relaxation_convergence import (  # noqa: E402
    FLOORS, constraint_fields, norms, require,
)

BASE = runpy.run_path(str(ROOT / "scripts/run-nr-k3-relaxation-convergence.py"))
sha256, new_json, encode, read = (BASE[k] for k in ("sha256", "new_json", "encode", "read"))
BINARY_SHA = BASE["BINARY_SHA"]
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-relaxation-convergence-v1-20261007/receipt.json")
PARENT_SHA = "bfbc9c97a57d97e9fab733331f54adaf4d975e9d8aad438c6a72f2a28a78e5b3"
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261007-fine-relaxation.md"
NEW = {"science/numerical_relativity/fo_ccz4_fine_relaxation.py",
       "science/numerical_relativity/test_fo_ccz4_fine_relaxation.py",
       "scripts/run-nr-k3-fine-relaxation.py", "scripts/tests/test_nr_fine_relaxation.py"}


def retained():
    require(sha256(PARENT) == PARENT_SHA, "parent receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] is True and parent["convergence_passed"] is False
            and not parent["errors"] and parent["source_before"] == parent["source_after"],
            "completed, explicitly failed, unchanged parent required")
    require(len(parent["source_after"]) == 170, "unexpected parent source coverage")
    for name, digest in parent["source_after"].items():
        require(sha256(ROOT/name) == sha256(PARENT.parent/"source-snapshot"/name) == digest,
                "retained source drift: " + name)
    for name, digest in parent["artifact_hashes"].items():
        require(sha256(PARENT.parent/name) == digest, "retained artifact drift: " + name)
    require(sha256(Path(parent["binary"])) == parent["binary_sha256"] == BINARY_SHA, "binary drift")
    BASE["complete_rows"](parent["cases"])
    return parent


class Runner(BASE["Runner"]):
    def budget(self):
        remaining = 1800. - (time.perf_counter() - self.started)
        require(remaining > 0., "1800s campaign timeout")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3 + 32*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) + 32*1024**2
                <= 512*1024**2, "512MiB output cap")
        return min(180., remaining)


def metadata(case):
    return {"label": case.label, "spatial_order": case.order, "n": case.n, "rate": case.rate,
            "steps_per_unit": case.steps_per_unit, "wave": list(case.wave),
            "origin": "retained-parent" if case in RETAINED else "fresh"}


def complete_rows(rows):
    require(len(rows) == len(CASES) and {row["label"] for row in rows} == {c.label for c in CASES},
            "missing/duplicate/unknown fine-study case")
    by_label = {row["label"]: row for row in rows}
    for case in CASES:
        row = by_label[case.label]
        require(all(row[k] == v for k, v in metadata(case).items()), "case identity mismatch")
        require([s["time"] for s in row["samples"]] == list(TIMES), "incomplete sample times")
        for sample in row["samples"]:
            require(set(sample["metrics"]) == set(FLOORS), "incomplete constraint coverage")
            require(all(set(v) == {"l2", "linf"} and
                        all(np.isfinite(x) and x >= 0. for x in v.values())
                        for v in sample["metrics"].values()), "invalid constraint norm")


def sample_record(data, path, t):
    require(data.header["time"] == t, "sample checkpoint time mismatch")
    return {"time": t, "path": str(path), "sha256": sha256(path), "metrics": norms(constraint_fields(data))}


def run_cases(runner, parent, receipt):
    old = {row["label"]: row for row in parent["cases"]}
    for case in RETAINED:
        runner.budget()
        row = {**metadata(case), "samples": []}
        receipt["cases"].append(row)
        for previous in old[case.label]["samples"]:
            t, path = previous["time"], Path(previous["path"])
            sample = sample_record(read(path, case), path, t)
            require(sample == previous, "retained diagnostic changed")
            row["samples"].append(sample)
            new_json(runner.directory/f"{case.label}-retained-diagnostics-t{t:g}.json", sample)
    binary = Path(parent["binary"])
    for case in FRESH:
        runner.budget()
        seed = data = initial_data(case)
        zero = initial_data(FineCase(case.order, case.n, 0., 512))
        require(all(np.array_equal(a, b) for a, b in zip(seed.slots, zero.slots)),
                "initial payload changed across rates/timesteps")
        path = runner.directory/f"{case.label}-initial.bin"
        encode(path, data)
        row = {**metadata(case), "initial_payload_matches_zero_rate_dt512": True, "samples": []}
        receipt["cases"].append(row)
        for t in TIMES:
            runner.budget()
            if t:
                steps = round((t - data.header["time"]) * case.steps_per_unit)
                data, path, _ = runner.native(binary, f"{case.label}-t{t:g}", data, path, steps=steps)
            print(json.dumps({"phase": "fine-grid-constraints", "case": case.label, "time": t}), flush=True)
            sample = sample_record(data, path, t)
            row["samples"].append(sample)
            new_json(runner.directory/f"{case.label}-diagnostics-t{t:g}.json", sample)
    case = FineCase(4, 24, 1.)
    seed_path = runner.directory/f"{case.label}-initial.bin"
    _, direct, _ = runner.native(binary, "direct-serial-replay", read(seed_path, case), seed_path,
                                 steps=128, threads=1)
    sampled = runner.directory/f"{case.label}-t0.25.bin"
    require(direct.read_bytes() == sampled.read_bytes(), "direct/serial checkpoint mismatch")
    require(direct.with_suffix(".json").read_bytes() == sampled.with_suffix(".json").read_bytes(),
            "direct/serial manifest mismatch")
    receipt["serial_direct_restart_equal"] = True


def assess(rows):
    complete_rows(rows)
    by_label = {row["label"]: row for row in rows}
    constraints, spatial, time_state, time_constraints = [], [], [], []

    def sample(case, index):
        return by_label[case.label]["samples"][index]

    def state(case, index=-1):
        return read(Path(sample(case, index)["path"]), case)

    for order in (2, 4):
        for rate in (0., 1.):
            cases = [FineCase(order, n, rate) for n in (16, 24, 32)]
            common = [np.stack(state(c).slots)[:, ::s, ::s, ::s] for c, s in zip(cases, (2, 3, 4))]
            spatial.append({"spatial_order": order, "rate": rate, **state_orders(common, order)})
            spatial_difference = rms(common[1] - common[2])
            for index, t in enumerate(TIMES[1:], start=1):
                for name in FLOORS:
                    values = [sample(c, index)["metrics"][name]["l2"] for c in cases]
                    constraints.append({"spatial_order": order, "rate": rate, "time": t, "name": name,
                                        **constraint_orders(values, order, name)})
            for n in (24, 32):
                coarse, fine = FineCase(order, n, rate), FineCase(order, n, rate, 1024)
                stride = n//8
                q = [np.stack(state(c).slots)[:, ::stride, ::stride, ::stride] for c in (coarse, fine)]
                error = rms(q[0] - q[1])
                ratio = error/spatial_difference if spatial_difference > STATE_FLOOR else None
                time_state.append({"spatial_order": order, "rate": rate, "n": n,
                                   "dt_difference": error, "spatial_difference": spatial_difference,
                                   "ratio": ratio, "passed": ratio is not None and ratio <= TIME_RATIO_MAX})
                for index, t in enumerate(TIMES[1:], start=1):
                    fields = [constraint_fields(state(c, index)) for c in (coarse, fine)]
                    for name, floor in FLOORS.items():
                        time_constraints.append({"spatial_order": order, "rate": rate, "n": n,
                            "time": t, "name": name, **signed_time_control(fields[0][name], fields[1][name], floor)})
    groups = (constraints, spatial, time_state, time_constraints)
    return {"constraint_convergence": constraints, "spatial_state": spatial,
            "temporal_state_contamination": time_state, "temporal_constraint_contamination": time_constraints,
            "passed": all(row["passed"] for group in groups for row in group)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    parent = retained()
    names = set(parent["source_after"]) | NEW
    before = BASE["identity"](names)
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True, exist_ok=False)
    receipt = {"schema_version": "nr-k3-fine-relaxation-v1", "completed": False, "convergence_passed": False,
        "source_before": before, "commands": [], "cases": [], "errors": [], "serial_direct_restart_equal": False,
        "parent_receipt": str(PARENT), "parent_receipt_sha256": PARENT_SHA, "parent_convergence_passed": False,
        "binary": parent["binary"], "binary_sha256": BINARY_SHA, "protocol_sha256": sha256(PROTOCOL),
        "physical_validation": False, "runtime_writeback": False, "scientificPayloadWriteback": False,
        "live_admitted": False, "cuda_validated": False, "constraint_propagation_proved": False,
        "environment": {"platform": platform.platform(), "python": sys.version, "numpy": np.__version__}}
    runner = Runner(directory, receipt)
    try:
        runner.budget()
        for name in before:
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT/name, target)
        shutil.copy2(PROTOCOL, directory/PROTOCOL.name)
        run_cases(runner, parent, receipt)
        receipt["assessment"] = assess(receipt["cases"])
        runner.budget()
        receipt["completed"] = True
        receipt["convergence_passed"] = receipt["assessment"]["passed"] and receipt["serial_direct_restart_equal"]
    except Exception as error:
        receipt["errors"].append({"type": type(error).__name__, "message": str(error)})
    finally:
        receipt["source_after"] = BASE["identity"](names)
        if (before != receipt["source_after"] or sha256(Path(parent["binary"])) != BINARY_SHA
                or sha256(PARENT) != PARENT_SHA or sha256(PROTOCOL) != receipt["protocol_sha256"]):
            receipt["completed"] = receipt["convergence_passed"] = False
            receipt["errors"].append({"type": "IdentityDrift", "message": "source/binary/parent/protocol changed"})
        receipt["seconds"] = time.perf_counter() - runner.started
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                      for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({k: receipt[k] for k in ("completed", "convergence_passed", "errors", "seconds")}), flush=True)
    return 0 if receipt["convergence_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

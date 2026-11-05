"""Frozen vacuum initial-slice convergence; never tune/regrade after execution."""
from __future__ import annotations

import argparse
from dataclasses import asdict
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from science.numerical_relativity.fo_ccz4_checkpoint import checkpoint_from_state, decode_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import FOCCZ4Config, advance_fo_ccz4_rk4_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_relaxation_convergence import (  # noqa: E402
    CASES, FLOORS, TIMES, Case, PROFILE, constraint_fields, constraint_order,
    difference_order, initial, norms, require,
)

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-algebraic-relaxation.py"))
sha256,new_json,encode = (BASE[k] for k in ("sha256","new_json","encode"))
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-algebraic-relaxation-v1-20261007/receipt.json")
PARENT_SHA = "7398ecaa7563a0e1df58e45903721b6b21be3fe86b7dca74dec88c1e79133c80"
BINARY_SHA = "20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-relaxation-convergence.md"
NEW = {"science/numerical_relativity/fo_ccz4_relaxation_convergence.py",
       "science/numerical_relativity/test_fo_ccz4_relaxation_convergence.py",
       "scripts/run-nr-k3-relaxation-convergence.py", "scripts/tests/test_nr_relaxation_convergence.py"}


def retained():
    require(sha256(PARENT) == PARENT_SHA,"parent receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["gates_passed"] and not parent["errors"]
            and parent["source_before"] == parent["source_after"],"validated parent required")
    for name,digest in parent["source_after"].items():
        require(sha256(ROOT/name) == sha256(PARENT.parent/"source-snapshot"/name) == digest,
                "retained source drift: "+name)
    for name,digest in parent["artifact_hashes"].items():
        require(sha256(PARENT.parent/name) == digest,"retained artifact drift: "+name)
    require(sha256(Path(parent["binary"])) == parent["binary_sha256"] == BINARY_SHA,"binary drift")
    return parent


def identity(names):
    return {name:sha256(ROOT/name) for name in sorted(names)}


class Runner(BASE["Runner"]):
    def budget(self):
        remaining = 1800.-(time.perf_counter()-self.started)
        require(remaining > 0.,"1800s campaign timeout")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3+32*1024**2,"C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3,"E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+32*1024**2
                <= 384*1024**2,"384MiB output cap")
        return min(180.,remaining)


def read(path,case):
    return decode_checkpoint(path.read_bytes(),expected_profile=PROFILE,
                              expected_spatial_order=case.order,expected_tau_inverse=case.rate)


def python_comparison(runner,case,seed,native):
    evolved = advance_fo_ccz4_rk4_3d(seed.to_state(),1./case.steps_per_unit,
        steps=case.steps_per_unit//8,gauge=BASE["GAUGE"],gauge_profile=PROFILE,
        config=FOCCZ4Config(tau_inverse=case.rate))
    h = native.header
    py = checkpoint_from_state(evolved,profile=PROFILE,tau_inverse=case.rate,dt=h["dt"],
        step=h["step"],time=h["time"],scenario=h["scenario"],amplitude=h["amplitude"],wavelength=h["wavelength"])
    require(py.header == h,"Python checkpoint header mismatch")
    encode(runner.directory/f"{case.label}-python-t0.125.bin",py)
    error = max(float(np.max(abs(a-b))) for a,b in zip(py.slots,native.slots))
    require(error <= 2.e-12,"64-step Python/native disagreement")
    return error


def run_cases(runner,binary,receipt):
    paths = {}
    for case in CASES:
        runner.budget()
        data = seed = initial(case)
        if case.rate == 1.:
            zero = initial(Case(case.order,case.n,0.,case.steps_per_unit,case.wave))
            require(all(np.array_equal(a,b) for a,b in zip(seed.slots,zero.slots)),"unmatched rate initial payload")
        path = runner.directory/f"{case.label}-initial.bin"
        encode(path,data)
        row = {**asdict(case),"wave":list(case.wave),"label":case.label,"samples":[]}
        receipt["cases"].append(row)
        for t in TIMES:
            runner.budget()
            if t:
                steps = int(round((t-data.header["time"])*case.steps_per_unit))
                data,path,_ = runner.native(binary,f"{case.label}-t{t:g}",data,path,steps=steps)
            print(json.dumps({"phase":"independent-constraints","case":case.label,"time":t}),flush=True)
            sample = {"time":t,"path":str(path),"sha256":sha256(path),"metrics":norms(constraint_fields(data))}
            row["samples"].append(sample)
            new_json(runner.directory/f"{case.label}-diagnostics-t{t:g}.json",sample)
            if case.n == 8 and t == .125:
                row["python_cpp_error"] = python_comparison(runner,case,seed,data)
        paths[case] = path
    # A fresh direct serial replay, not just byte comparison of cached files.
    case = Case(4,16,1.)
    seed_path = runner.directory/f"{case.label}-initial.bin"
    result = runner.native(binary,"direct-serial-replay",read(seed_path,case),seed_path,
                           steps=128,threads=1)
    require(result[1].read_bytes() == paths[case].read_bytes(),"serial/direct checkpoint mismatch")
    require(result[1].with_suffix(".json").read_bytes() == paths[case].with_suffix(".json").read_bytes(),
            "serial/direct manifest mismatch")
    receipt["serial_direct_restart_equal"] = True
    return paths


def complete_rows(rows):
    require(len(rows) == len(CASES) and {r["label"] for r in rows} == {c.label for c in CASES},
            "missing/duplicate/unknown case")
    for row in rows:
        require([s["time"] for s in row["samples"]] == list(TIMES),"missing/duplicate sample time")
        require(all(set(s["metrics"]) == set(FLOORS) for s in row["samples"]),"constraint coverage missing")


def assess(rows,paths):
    complete_rows(rows)
    by_label = {r["label"]:r for r in rows}
    spatial,temporal,contamination,constraints,ratios = [],[],[],[],[]
    for order in (2,4):
        for rate in (0.,1.):
            cases = [Case(order,n,rate) for n in (8,16,32)]
            states = [np.stack(read(paths[c],c).slots)[:,::factor,::factor,::factor]
                      for c,factor in zip(cases,(1,2,4))]
            spatial_check = difference_order(*states,order=order)
            spatial.append({"order":order,"rate":rate,**spatial_check})
            for index,t in enumerate(TIMES[1:],start=1):
                for name in FLOORS:
                    values = [by_label[c.label]["samples"][index]["metrics"][name]["l2"] for c in cases]
                    constraints.append({"order":order,"rate":rate,"time":t,"name":name,
                                        **constraint_order(values,order,name)})
            temporal_cases = [Case(order,16,rate,s) for s in (64,128,256)]
            state_time = [np.stack(read(paths[c],c).slots) for c in temporal_cases]
            temporal.append({"order":order,"rate":rate,**difference_order(*state_time,order=order,temporal=True)})
            last = state_time[-1][:,::2,::2,::2]
            dt_error = float(np.sqrt(np.mean((last-states[1])**2)))
            spatial_error = spatial_check["errors"][1]
            ratio = dt_error/spatial_error if spatial_error > 2.e-12 else None
            contamination.append({"order":order,"rate":rate,"dt_difference":dt_error,
                                  "spatial_difference":spatial_error,"ratio":ratio,
                                  "passed":ratio is not None and ratio <= .05})
        for n in (8,16,32):
            zero,one = (by_label[Case(order,n,r).label]["samples"][-1]["metrics"] for r in (0.,1.))
            ratios.append({"order":order,"n":n,"lambda1_over_lambda0":{
                k:one[k]["l2"]/zero[k]["l2"] if zero[k]["l2"] > FLOORS[k] else None for k in FLOORS}})
    passed = all(v["passed"] for group in (spatial,temporal,contamination,constraints) for v in group)
    return {"spatial_state":spatial,"temporal_state":temporal,"temporal_contamination":contamination,
            "constraint_convergence":constraints,"rate_effect_descriptive":ratios,"passed":passed}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory",required=True,type=Path)
    args = parser.parse_args()
    parent = retained()
    names = set(parent["source_after"])|NEW
    before = identity(names)
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True,exist_ok=False)
    receipt = {"schema_version":"nr-k3-relaxation-convergence-v1","completed":False,"convergence_passed":False,
               "source_before":before,"commands":[],"cases":[],"errors":[],"serial_direct_restart_equal":False,
               "parent_receipt_sha256":PARENT_SHA,"binary":parent["binary"],"binary_sha256":BINARY_SHA,
               "protocol_sha256":sha256(PROTOCOL),"physical_validation":False,"runtime_writeback":False,
               "scientificPayloadWriteback":False,"live_admitted":False,"cuda_validated":False,
               "constraint_propagation_proved":False,
               "environment":{"platform":platform.platform(),"python":sys.version,"numpy":np.__version__}}
    runner = Runner(directory,receipt)
    try:
        runner.budget()
        for name in before:
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/name,target)
        shutil.copy2(PROTOCOL,directory/PROTOCOL.name)
        paths = run_cases(runner,Path(parent["binary"]),receipt)
        receipt["assessment"] = assess(receipt["cases"],paths)
        receipt["completed"] = True
        receipt["convergence_passed"] = receipt["assessment"]["passed"]
    except Exception as error:
        receipt["errors"].append({"type":type(error).__name__,"message":str(error)})
    finally:
        receipt["source_after"] = identity(names)
        if before != receipt["source_after"] or sha256(Path(parent["binary"])) != BINARY_SHA:
            receipt["completed"] = receipt["convergence_passed"] = False
            receipt["errors"].append({"type":"IdentityDrift","message":"source or binary changed"})
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix():sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json",receipt)
        print(json.dumps({k:receipt[k] for k in ("completed","convergence_passed","errors","seconds")}),flush=True)
    return 0 if receipt["convergence_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Opt-in finite-rate CPU integration; immutable zero-rate rollback controls."""
from __future__ import annotations

import argparse
from copy import deepcopy
from dataclasses import replace
import json
from pathlib import Path
import platform
import runpy
import shutil
import struct
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    HEADER, ORDER_HEADER, CONTROL_HEADER, checkpoint_from_state, checkpoint_version, decode_checkpoint,
)
from science.numerical_relativity.fo_ccz4_lapse_constraint_balance import (  # noqa: E402
    balance_fields, rhs_slots, symmetric,
)
from science.numerical_relativity.fo_ccz4_rhs import (  # noqa: E402
    FOCCZ4Config, advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d,
)
from science.numerical_relativity.fo_ccz4_trace_source_window import (  # noqa: E402
    Case, initial, residual, d1, metric_constraints, norm_summary,
)
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-lapse-balance.py"))
STENCIL = BASE["STENCIL"]
TOPO, NATIVE = STENCIL["TOPO"], STENCIL["NATIVE"]
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
PROFILE, GAUGE = STENCIL["PROFILE"], STENCIL["GAUGE"]
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-completion-v1-20261007/receipt.json")
PARENT_SHA = "95447ede8a9b9ed52e285506f1bd3005febe824bc5babe227404d6e3e8d7252b"
OLD = Path("C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v2/native-build/Release/nr-k2-fo-ccz4-shadow.exe")
OLD_SHA = "554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b"
CPP = "science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-algebraic-relaxation.md"
CHANGED = {CPP, "science/numerical_relativity/fo_ccz4_rhs.py",
           "science/numerical_relativity/fo_ccz4_checkpoint.py", "science/numerical_relativity/manifest.py"}
NEW = {"science/numerical_relativity/fo_ccz4_constraint_control.py",
       "science/numerical_relativity/test_fo_ccz4_constraint_control.py",
       "scripts/run-nr-k3-algebraic-relaxation.py", "scripts/tests/test_nr_algebraic_relaxation.py"}


def controlled(data, rate):
    return replace(data, tau_inverse=rate, header={**data.header,
        "version": checkpoint_version(data.header["spatial_order"], data.profile, rate)})


def encode(path, data):
    raw = data.to_bytes()  # Validate completely before creating an output.
    with path.open("xb") as stream:
        stream.write(raw)


def source_identity(names):
    return {n: sha256(ROOT/n) for n in sorted(names)}


def lineage():
    require(sha256(PARENT) == PARENT_SHA and sha256(OLD) == OLD_SHA, "retained receipt/binary drift")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["instantaneous_balance_audit_passed"]
            and parent["source_before"] == parent["source_after"], "validated source baseline required")
    for name, digest in parent["source_after"].items():
        require(sha256(PARENT.parent/"source-snapshot"/name) == digest, "snapshot drift: "+name)
        if name not in CHANGED:
            require(sha256(ROOT/name) == digest, "unapproved source change: "+name)
    return parent


def command(binary, data, output, manifest, *, path=None, steps=8, threads=4, rate=None):
    h = data.header
    result = [binary, "--points", h["points"], "--spatial-order", h["spatial_order"],
              "--dt", h["dt"], "--amplitude", h["amplitude"], "--wavelength", h["wavelength"],
              "--scenario", "gauge-wave" if h["scenario"] else "minkowski",
              "--solver-mode", "fo-rhs-shadow" if h["solver_mode"] else "analytic-contract",
              "--steps", steps, "--threads", threads, "--checkpoint", output, "--manifest", manifest]
    if path is not None:
        result += ["--restart", path]
    if data.profile:
        result += ["--gauge-profile", "state-dependent-v1", "--shift-scale", data.profile.shift_scale,
                   "--ordering-scale", data.profile.ordering_scale]
    if rate is not None:
        result += ["--tau-inverse", rate]
    return result


def read(path, data):
    return decode_checkpoint(path.read_bytes(), expected_spatial_order=data.header["spatial_order"],
                              expected_profile=data.profile, expected_tau_inverse=data.tau_inverse)


def validate_output(data, path, manifest, steps, version):
    result = read(path, data)
    expected = {**data.header, "step": data.header["step"]+steps,
                "time": data.header["time"]+steps*data.header["dt"]}
    require(result.header == expected, "evolved checkpoint header mismatch")
    payload = json.loads(manifest.read_text(encoding="utf-8"))
    validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=expected["spatial_order"],
                                  expected_profile=data.profile, expected_tau_inverse=data.tau_inverse,
                                  expected_solver_mode="fo-ccz4-rhs-shadow-rk4" if expected["solver_mode"]
                                  else "analytic-3d-fo-ccz4-contract")
    require(payload["kernel_version"] == version, "wrong binary version")
    require(payload["grid"]["shape"] == [expected["points"]]*3 and payload["grid"]["dt"] == expected["dt"],
            "manifest grid mismatch")
    require(all(payload["diagnostics"][k] == expected[k] for k in ("step", "time", "amplitude", "wavelength")),
            "manifest state metadata mismatch")
    STENCIL["verify_manifest_checksums"](path.read_bytes(), payload)
    return result, payload


class Runner(TOPO["BoundedRun"]):
    def budget(self):
        remaining = 1200.-(time.perf_counter()-self.started)
        require(remaining > 0., "1200s campaign timeout")
        require(shutil.disk_usage(self.directory).free > 4*1024**3+8*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free > 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+8*1024**2
                < 192*1024**2, "192MiB output cap")
        return min(180., remaining)

    def native(self, binary, label, data, path=None, *, steps=8, threads=4, version="0.4.0"):
        out, meta = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        require(not out.exists() and not meta.exists(), "output collision")
        self.execute(label, command(binary, data, out, meta, path=path, steps=steps, threads=threads,
                                    rate=data.tau_inverse if version == "0.4.0" else None))
        checked, payload = validate_output(data, out, meta, steps, version)
        return checked, out, payload


def compare(a, b):
    require(a[1].read_bytes() == b[1].read_bytes(), "checkpoint bytes differ")
    require(a[1].with_suffix(".json").read_bytes() == b[1].with_suffix(".json").read_bytes(),
            "manifest bytes differ")


def legacy_compare(a, b):
    require(a[1].read_bytes() == b[1].read_bytes(), "rollback checkpoint differs")
    x, y = deepcopy(a[2]), deepcopy(b[2])
    del x["kernel_version"], y["kernel_version"]
    del y["diagnostics"]["constraint_control"], y["diagnostics"]["constraint_control_bound_to_checkpoint"]
    require(x == y, "rollback manifest differs beyond explicit policy/version")


def rollback(runner, binary, receipt):
    for order in (2,4):
        for kind in ("analytic", "dynamic", "profile"):
            data = STENCIL["initial"](order, "wave", PROFILE if kind == "profile" else None)
            if kind == "analytic":
                data = replace(data, header={**data.header, "solver_mode": 0})
            label = f"rollback-fd{order}-{kind}"
            old = runner.native(OLD, label+"-old", data, version="0.3.2")
            new = runner.native(binary, label+"-new", data)
            legacy_compare(old, new)
            receipt["rollback"].append({"label": label, "checkpoint_bytes_equal": True,
                                        "manifest_policy_only_delta": True})


def instantaneous(runner, probe, label, data, path):
    outputs = []
    for threads in (1,4):
        out = runner.directory/f"{label}-rhs-{threads}.rhs"
        stdout, _ = runner.execute(f"{label}-rhs-{threads}",
            [probe, "--input", path, "--output", out, "--threads", threads])
        meta = json.loads(stdout)
        require(meta == {"schema_version": "nr-fo-rhs-inspection-v1", "test_only": True,
                         "evolution_steps": 0, "observed_threads": threads,
                         "points": data.header["points"], "variable_count": 58}, "probe identity mismatch")
        outputs.append(out.read_bytes())
    require(outputs[0] == outputs[1], "RHS thread bytes differ")
    native = BASE["read_rhs"](outputs[0], data.header["points"])
    py = rhs_slots(fo_ccz4_rhs_3d(data.to_state(), gauge=GAUGE, gauge_profile=data.profile,
                                  config=FOCCZ4Config(tau_inverse=data.tau_inverse)))
    error = max(float(np.max(abs(a-b))) for a,b in zip(native,py))
    balances = []
    for rhs in (native,py):
        f = balance_fields(data, rhs)
        correction = data.tau_inverse*(np.linalg.det(symmetric(data.slots,0))-4.)*f["trace"]
        balances.append({"lapse": float(np.max(abs(f["measured"]-f["predicted"]))),
                         "trace": float(np.max(abs(f["trace_rate"]-f["trace_prediction"]-correction)))})
    require(error <= 2.e-12 and all(max(b.values()) <= 2.e-12 for b in balances), "instantaneous gate failed")
    return {"rhs_python_cpp_error": error, "balance_errors_native_python": balances, "thread_bytes_equal": True}


def finite_cases(runner, binary, probe, receipt):
    for order in (2,4):
        for profile in (None, PROFILE):
            for rate in (.25,1.,4.):
                data = STENCIL["initial"](order, "flat", profile)
                rng = np.random.Generator(np.random.PCG64(20261007))
                data = controlled(replace(data, header={**data.header,"dt":1./256.},
                    slots=tuple(q+rng.uniform(-1.e-4,1.e-4,q.shape) for q in data.slots)), rate)
                label = f"finite-fd{order}-profile{int(profile is not None)}-rate{rate:g}"
                path = runner.directory/f"{label}-initial.bin"
                encode(path, data)
                row = {"label":label,"rate":rate,"order":order,"profile":profile is not None,
                       "instantaneous":instantaneous(runner,probe,label,data,path)}
                receipt["finite_cases"].append(row)
                direct = runner.native(binary,label+"-direct",data,path)
                serial = runner.native(binary,label+"-serial",data,path,threads=1)
                part = runner.native(binary,label+"-split-a",data,path,steps=3,threads=1)
                split = runner.native(binary,label+"-split-b",part[0],part[1],steps=5)
                compare(direct, serial)
                compare(direct, split)
                h = data.header
                evolved = advance_fo_ccz4_rk4_3d(data.to_state(),h["dt"],steps=8,gauge=GAUGE,
                    gauge_profile=profile,config=FOCCZ4Config(tau_inverse=rate))
                py = checkpoint_from_state(evolved,profile=profile,tau_inverse=rate,dt=h["dt"],
                     time=8*h["dt"],step=8,scenario=h["scenario"],amplitude=h["amplitude"],wavelength=h["wavelength"])
                encode(runner.directory/f"{label}-python.bin",py)
                require(py.header == direct[0].header and py.profile == direct[0].profile
                        and py.tau_inverse == direct[0].tau_inverse, "Python output identity mismatch")
                error = max(float(np.max(abs(a-b))) for a,b in zip(py.slots,direct[0].slots))
                require(error <= 2.e-12,"finite cross-backend gate failed")
                report, ham, mom = metric_constraints(direct[0])
                row.update(python_cpp_error=error,thread_bytes_equal=True,restart_bytes_equal=True,
                           adm_constraints=norm_summary(ham,mom),
                           determinant_error=float(np.max(abs(np.linalg.det(evolved.base.h)-1.))),
                           geometric_trace=float(np.max(abs(report.trace_a))),
                           lapse_reduction=float(np.max(abs(residual(direct[0].slots,order)))))


def kinetics(runner,binary,receipt):
    for order in (2,4):
        for family in ("trace","tracefree"):
            seed = controlled(initial(Case(order,8,(1,1,1),family,2.e-6)),1.)
            label = f"kinetic-fd{order}-{family}"
            data, path = seed, runner.directory/f"{label}-initial.bin"
            encode(path,data)
            row = {"label":label,"samples":[]}
            receipt["kinetics"].append(row)
            t0 = sum(seed.slots[i] for i in (11,14,16))
            for t in (0.,.25,.5,.75,1.):
                if t:
                    data,path,_ = runner.native(binary,f"{label}-t{t:g}",data,path,steps=64)
                trace = np.einsum("...ij,...ij->...", np.linalg.inv(symmetric(data.slots,0)),symmetric(data.slots,11))
                c = residual(data.slots,order)
                expected = -2*(-np.expm1(-3*t))/3*np.stack([d1(t0,i,order) for i in range(3)])
                e_trace,e_c = float(np.max(abs(trace-np.exp(-3*t)*t0))),float(np.max(abs(c-expected)))
                bound = 5.e-10 if family == "trace" else 1.e-12
                report, ham, mom = metric_constraints(data)
                row["samples"].append({"time":t,"trace_reference_error":e_trace,"lapse_reference_error":e_c,
                                       "bound":bound,"checkpoint":str(path),"sha256":sha256(path),
                                       "adm_constraints":norm_summary(ham,mom)})
                require(max(e_trace,e_c) <= bound,"kinetic response gate failed")


def negative_cases(runner,binary,receipt):
    data = controlled(STENCIL["initial"](4,"flat",PROFILE),1.)
    good = runner.directory/"negative-good.bin"
    encode(good,data)
    malformed = {}
    for name,code,rate in (("policy",2,1.),("zero",1,0.),("nan",1,float("nan"))):
        raw = bytearray(data.to_bytes())
        CONTROL_HEADER.pack_into(raw,HEADER.size+ORDER_HEADER.size,code,rate)
        malformed[name] = bytes(raw)
    raw = bytearray(data.to_bytes())
    struct.pack_into("<Q",raw,48,0)
    malformed.update(analytic=bytes(raw),short=data.to_bytes()[:HEADER.size+ORDER_HEADER.size+8],
                     payload=data.to_bytes()[:-1])
    variants = [("missing-rate",data,good,None,[]),("wrong-rate",data,good,2.,[]),
                ("negative-rate",data,good,-1.,[]),("nan-rate",data,good,"nan",[]),
                ("inf-rate",data,good,"inf",[]),("duplicate",data,good,1.,["--tau-inverse","1"])]
    for name,raw in malformed.items():
        path = runner.directory/f"negative-{name}-input.bin"
        with path.open("xb") as stream:
            stream.write(raw)
        variants.append((name,data,path,1.,[]))
    old = controlled(data,0.)
    old_path = runner.directory/"negative-legacy-input.bin"
    encode(old_path,old)
    variants.extend((("legacy-positive",old,old_path,1.,[]),
                     ("analytic-option",replace(old,header={**old.header,"solver_mode":0},profile=None),None,1.,[]),
                     ("wrong-order",replace(data,header={**data.header,"spatial_order":2}),good,1.,[]),
                     ("wrong-profile",replace(data,profile=None),good,1.,[])))
    for name,fixture,path,rate,extra in variants:
        out,meta = runner.directory/f"reject-{name}.bin",runner.directory/f"reject-{name}.json"
        runner.execute("reject-"+name,command(binary,fixture,out,meta,path=path,rate=rate)+extra,reject=True)
        require(runner.receipt["commands"][-1]["returncode"] == 2,"wrong negative exit code")
        require(not out.exists() and not meta.exists(),"negative produced output")
        receipt["negatives"].append({"name":name,"exit_code":2,"no_output":True})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory",required=True,type=Path)
    args = parser.parse_args()
    parent = lineage()
    names = set(parent["source_after"])|NEW
    before = source_identity(names)
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True,exist_ok=False)
    receipt = {"schema_version":"nr-k3-algebraic-relaxation-v1","completed":False,"gates_passed":False,
               "source_before":before,"commands":[],"errors":[],"rollback":[],"finite_cases":[],"kinetics":[],"negatives":[],
               "parent_receipt_sha256":PARENT_SHA,"old_binary_sha256":OLD_SHA,"protocol_sha256":sha256(PROTOCOL),
               "physical_validation":False,"runtime_writeback":False,"scientificPayloadWriteback":False,
               "live_admitted":False,"cuda_validated":False,"constraint_propagation_proved":False,
               "environment":{"platform":platform.platform(),"python":sys.version,"numpy":np.__version__}}
    runner = Runner(directory,receipt)
    try:
        for name in before:
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/name,target)
        shutil.copy2(PROTOCOL,directory/PROTOCOL.name)
        instance = NATIVE["discover_instance"]()
        cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        receipt["toolchain"] = {"instance":str(instance),"cmake":str(cmake),"cmake_sha256":sha256(cmake)}
        build = directory/"native-build"
        source = directory/"source-snapshot/science/numerical_relativity/cpp"
        runner.execute("configure",NATIVE["configure_command"](cmake,instance,source,build))
        runner.execute("build",[cmake,"--build",build,"--config","Release","--target","nr-k2-fo-ccz4-shadow"])
        binary = build/"Release/nr-k2-fo-ccz4-shadow.exe"
        receipt.update(binary=str(binary),binary_sha256=sha256(binary))
        probe_build = directory/"probe-build"
        probe_source = directory/"source-snapshot/science/numerical_relativity/native_rhs_probe"
        runner.execute("probe-configure",NATIVE["configure_command"](cmake,instance,probe_source,probe_build)
                        + [f"-DNR_SHADOW_SOURCE={(directory/'source-snapshot'/CPP).as_posix()}"])
        runner.execute("probe-build",[cmake,"--build",probe_build,"--config","Release"])
        probe = probe_build/"Release/nr-fo-rhs-probe.exe"
        receipt.update(probe=str(probe),probe_sha256=sha256(probe))
        rollback(runner,binary,receipt)
        finite_cases(runner,binary,probe,receipt)
        kinetics(runner,binary,receipt)
        negative_cases(runner,binary,receipt)
        require(len(receipt["rollback"]) == 6 and len(receipt["finite_cases"]) == 12
                and len(receipt["kinetics"]) == 4 and len(receipt["negatives"]) == 16,"incomplete matrix")
        receipt["completed"] = receipt["gates_passed"] = True
    except Exception as error:
        receipt["errors"].append({"type":type(error).__name__,"message":str(error)})
    finally:
        receipt["source_after"] = source_identity(names)
        if before != receipt["source_after"]:
            receipt["completed"] = receipt["gates_passed"] = False
            receipt["errors"].append({"type":"SourceDrift","message":"source changed during campaign"})
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix():sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json",receipt)
        print(json.dumps({"completed":receipt["completed"],"gates_passed":receipt["gates_passed"],
                          "errors":receipt["errors"],"receipt":str(directory/"receipt.json")}),flush=True)
    return 0 if receipt["gates_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

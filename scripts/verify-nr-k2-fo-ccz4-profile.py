"""Fresh native build, legacy invariance and opt-in profile/restart campaign.

All cases are bounded periodic CPU shadow checks. Cross-language consistency
does not certify the common equations, hyperbolicity, boundaries or physics.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import runpy
import struct
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, GaugeConfig, Grid3D, advance_fo_ccz4_rk4_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    HEADER, HEADER_NAMES, PROFILE_HEADER, checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

TOLERANCE = 2.e-12
PROFILES = (FOCCZ4GaugeProfile(),FOCCZ4GaugeProfile(4.,.4),FOCCZ4GaugeProfile(2.5,1.2))
GAUGE = GaugeConfig(shift_coefficient=1.,shift_damping=0.,theta_coupling=2.)
NATIVE = runpy.run_path(str(ROOT/"scripts/run-nr-k2-native-msvc.py"))
LEGACY = runpy.run_path(str(ROOT/"scripts/verify-nr-k2-fo-ccz4-rhs.py"))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_identity():
    result = NATIVE["source_identity"]()
    result[Path(__file__).relative_to(ROOT).as_posix()] = sha256(Path(__file__))
    return result


def mixed_fixture(points=7):
    state = LEGACY["_ordering_fixture"](points)
    base, aux = state.base,state.auxiliary
    x,y,z = (2.*np.pi*c for c in base.grid.coordinates)
    base.lapse[:] = .9+.03*np.sin(x+y)
    base.chi[:] = .7+.05*np.cos(y+z)
    base.h[...,0,0] = 1.+.03*np.sin(x)
    base.h[...,1,1] = 1.+.04*np.cos(y)
    base.h[...,2,2] = 1.+.02*np.sin(z)
    base.h[...,0,1] = base.h[...,1,0] = .01*np.sin(x+z)
    base.trace_k[:] = .002*np.sin(y)
    base.theta[:] = .001*np.cos(x+z)
    for axis in range(3):
        base.shift[...,axis] = .01*np.sin((x,y,z)[(axis+1)%3])
        base.b[...,axis] = .1*(axis+1)+.01*np.cos((x,y,z)[axis])
        base.conformal_gamma[...,axis] = .001*np.sin(x+y+z+axis)
        base.a[...,axis,axis] = .003*np.cos((x,y,z)[axis])
        aux.lapse_gradient[...,axis] = .02*np.cos((x,y,z)[axis])
        aux.shift_gradient[...,axis,(axis+1)%3] = .01*np.cos((x,y,z)[axis])
    return state


def commands(points,steps,dt,profile=None):
    args = ["--points",str(points),"--steps",str(steps),"--dt",format(dt,".17g"),
            "--scenario","gauge-wave" if points==8 else "minkowski", "--formulation","ccz4",
            "--solver-mode","fo-rhs-shadow","--amplitude","0.001","--wavelength","1"]
    if profile:
        args += ["--gauge-profile","state-dependent-v1","--shift-scale",repr(profile.shift_scale),
                 "--ordering-scale",repr(profile.ordering_scale)]
    return args


def replace_argument(args, name, value):
    result = list(args)
    result[result.index(name)+1] = str(value)
    return result


def changed_header(raw,name,value):
    fields = dict(zip(HEADER_NAMES,HEADER.unpack_from(raw)))
    fields[name] = value
    return HEADER.pack(*(fields[key] for key in HEADER_NAMES))+raw[HEADER.size:]


def malformed_checkpoints(raw):
    n = HEADER.unpack_from(raw)[3]
    offset = HEADER.size+PROFILE_HEADER.size
    outputs = {"unknown-version":changed_header(raw,"version",99), "truncated":raw[:-1],
               "trailing":raw+b"x", "huge-grid":changed_header(raw,"points",2**63),
               "nan-dt":changed_header(raw,"dt",float("nan")),
               "unknown-profile":raw[:HEADER.size]+PROFILE_HEADER.pack(9,3.,.2)+raw[offset:],
               "nan-profile":raw[:HEADER.size]+PROFILE_HEADER.pack(1,float("nan"),.2)+raw[offset:]}
    for name,slot,value in (("lapse-bound",6,np.log(2.)),("chi-underflow",10,-1000.),("nonfinite-state",22,float("nan"))):
        data = bytearray(raw)
        struct.pack_into("<d",data,offset+slot*n**3*8,value)
        outputs[name] = bytes(data)
    data = bytearray(raw)
    for slot in (0,3):
        struct.pack_into("<d",data,offset+slot*n**3*8,-1.)
    outputs["indefinite-metric"] = bytes(data)
    return outputs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory",required=True,type=Path)
    parser.add_argument("--legacy-binary",required=True,type=Path)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    directory.mkdir(parents=True,exist_ok=False)
    before, started = source_identity(),time.perf_counter()
    legacy_hash = sha256(args.legacy_binary)
    result = {"schema_version":"nr-k2-fo-ccz4-profile-v2-ode-erratum","source_identity_before":before,
              "legacy_binary":str(args.legacy_binary.resolve()),"legacy_binary_sha256":legacy_hash,
              "tolerance":TOLERANCE,"cases":[],"rejections":[],"legacy_invariance":[],"commands":[],
              "passed":False,"error":None,"physical_validation":False,"strong_hyperbolicity_validated":False,
              "cpbc":False,"runtime_writeback":False,"scientificPayloadWriteback":False,
              "promotion":"blocked-pending-long-time-domain-and-physical-validation"}

    def execute(name,command,*,rejected=False):
        print(json.dumps({"phase":name}),flush=True)
        process = subprocess.run([str(value) for value in command],cwd=ROOT,capture_output=True,text=True,
                                 errors="replace",timeout=180,check=False)
        log = directory/f"{name}.log"
        with log.open("x",encoding="utf-8") as stream:
            stream.write(process.stdout+"\n[stderr]\n"+process.stderr)
        result["commands"].append({"name":name,"arguments":[str(value) for value in command],
                                   "returncode":process.returncode,"log_sha256":sha256(log)})
        if (process.returncode == 0) == rejected:
            raise RuntimeError(f"{name}: unexpected return code {process.returncode}; see log")
        return process

    def run(name,options,*,binary=None,rejected=False):
        checkpoint,manifest = directory/f"{name}.bin",directory/f"{name}.json"
        process = execute(name,[binary or solver,*options,"--checkpoint",checkpoint,"--manifest",manifest],rejected=rejected)
        if rejected:
            if checkpoint.exists() or manifest.exists():
                raise RuntimeError(f"{name}: rejected run wrote output artifacts")
            result["rejections"].append({"name":name,"returncode":process.returncode,"stderr":process.stderr.strip(),
                                         "no_output_artifacts":True})
        return checkpoint,manifest

    try:
        execute("native-build",[sys.executable,ROOT/"scripts/run-nr-k2-native-msvc.py",
                                 "--output-directory",directory/"native"])
        native = json.loads((directory/"native/receipt.json").read_text(encoding="utf-8"))
        if not native["passed"]:
            raise RuntimeError("fresh native legacy audit failed")
        result["native_receipt_sha256"] = sha256(directory/"native/receipt.json")
        solver = directory/"native/solver-build/Release/nr-k2-fo-ccz4-shadow.exe"
        binary_hash = sha256(solver)
        result["binary_sha256"] = binary_hash
        for mode in ("analytic-contract","fo-rhs-shadow"):
            options = replace_argument(commands(8,8,1.e-5),"--solver-mode",mode)
            old = run(f"old-{mode}",options,binary=args.legacy_binary)
            new = run(f"new-{mode}",options)
            equal = all(a.read_bytes()==b.read_bytes() for a,b in zip(old,new))
            old_manifest = json.loads(old[1].read_text(encoding="utf-8"))
            new_manifest = json.loads(new[1].read_text(encoding="utf-8"))
            result["legacy_invariance"].append({"mode":mode,"checkpoint_and_manifest_equal":equal,
                                                "checkpoint_equal":old[0].read_bytes()==new[0].read_bytes(),
                                                "old_version":old_manifest["kernel_version"],
                                                "new_version":new_manifest["kernel_version"],
                                                "checkpoint_sha256":sha256(new[0])})
            if new_manifest["kernel_version"] != "0.2.0":
                raise RuntimeError("ODE correction requires a distinct kernel version")
            if mode=="analytic-contract" and old[0].read_bytes()!=new[0].read_bytes():
                raise RuntimeError("non-evolving analytic legacy checkpoint changed")
        # Independent Eq. (12b,d) oracle: constant primary scalars, nonzero
        # independent A/P and shift. Spatial re-differentiation wrongly gives 0.
        ode_seed = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(
            Grid3D((5,)*3,(0.,)*3,(1.,)*3,boundary="periodic")))
        ode_seed.base.shift[:] = [.2,-.1,.05]
        ode_seed.auxiliary.lapse_gradient[:] = [.03,-.04,.02]
        ode_seed.auxiliary.conformal_factor_gradient[:] = [.05,.02,-.03]
        ode_dt = 1.e-7
        ode_path = directory/"ode-oracle-input.bin"
        with ode_path.open("xb") as stream:
            stream.write(checkpoint_from_state(ode_seed,profile=None,dt=ode_dt).to_bytes())
        ode_options = commands(5,1,ode_dt)+["--restart",str(ode_path)]
        ode_old = run("ode-oracle-old",ode_options,binary=args.legacy_binary)
        ode_new = run("ode-oracle-new",ode_options)
        expected = np.array([.011,.0065])
        rates = []
        for output in (ode_old,ode_new):
            loaded = decode_checkpoint(output[0].read_bytes(),expected_profile=None)
            rates.append(np.array([np.mean(loaded.slots[slot])/ode_dt for slot in (6,10)]))
        old_error,new_error = (float(np.max(abs(rate-expected))) for rate in rates)
        result["ode_oracle"] = {"dt":ode_dt,"expected_initial_rates":expected.tolist(),
                                "old_rates":rates[0].tolist(),"corrected_rates":rates[1].tolist(),
                                "old_max_error":old_error,"corrected_max_error":new_error,
                                "rate_tolerance":5.e-7,"old_rejected":old_error>1.e-3,
                                "corrected_passed":new_error<=5.e-7}
        if not (old_error>1.e-3 and new_error<=5.e-7):
            raise RuntimeError("independent ODE regression did not discriminate old and corrected kernels")
        result["original_bitwise_compatibility_gate_passed"] = all(
            row["checkpoint_and_manifest_equal"] for row in result["legacy_invariance"])
        for index,profile in enumerate(PROFILES):
            for label,n,steps,dt in (("wave",8,8,1.e-5),("mixed",7,4,1.e-4)):
                name = f"p{index}-{label}"
                seed = mixed_fixture(n) if label=="mixed" else FOCCZ4State3D.from_bssn_state(BSSNState3D.gauge_wave(
                    Grid3D((n,)*3,(0.,)*3,(1.,)*3,boundary="periodic"),amplitude=.001))
                options = commands(n,steps,dt,profile)
                if label=="mixed":
                    initial = directory/f"{name}-input.bin"
                    with initial.open("xb") as stream:
                        stream.write(checkpoint_from_state(seed,profile=profile,dt=dt).to_bytes())
                    options += ["--restart",str(initial)]
                    seed = decode_checkpoint(initial.read_bytes(),expected_profile=profile).to_state()
                direct = run(name,options+["--threads","1"])
                threaded = run(name+"-threads",options+["--threads","4"])
                part = run(name+"-part",replace_argument(options,"--steps",steps//2)+["--threads","4"])
                restart = run(name+"-restart",commands(n,steps-steps//2,dt,profile)+["--threads","1","--restart",str(part[0])])
                loaded = decode_checkpoint(direct[0].read_bytes(),expected_profile=profile)
                manifest = json.loads(direct[1].read_text(encoding="utf-8"))
                validate_fo_ccz4_cpp_manifest(manifest,expected_profile=profile)
                python = advance_fo_ccz4_rk4_3d(seed,dt,steps=steps,gauge=GAUGE,gauge_profile=profile)
                error = max(float(np.max(abs(a-b))) for a,b in zip(loaded.slots,state_slots(python)))
                continuation = run(name+"-continue",commands(n,1,dt,profile)+["--restart",str(direct[0])])
                continued = decode_checkpoint(continuation[0].read_bytes(),expected_profile=profile)
                python_continued = advance_fo_ccz4_rk4_3d(loaded.to_state(),dt,gauge=GAUGE,gauge_profile=profile)
                continuation_error = max(float(np.max(abs(a-b))) for a,b in zip(continued.slots,state_slots(python_continued)))
                replay_equal = all(a.read_bytes()==b.read_bytes()==c.read_bytes() for a,b,c in zip(direct,threaded,restart))
                byte_roundtrip = loaded.to_bytes()==direct[0].read_bytes()
                row = {"name":name,"profile":profile.identity(),"points":n,"steps":steps,"dt":dt,
                       "cross_backend_max_abs":error,"python_continuation_max_abs":continuation_error,
                       "thread_and_restart_bytes_equal":replay_equal,"codec_byte_roundtrip":byte_roundtrip,
                       "manifest_identity_valid":True,"checkpoint_sha256":sha256(direct[0])}
                result["cases"].append(row)
                if not (error<=TOLERANCE and continuation_error<=TOLERANCE and replay_equal and byte_roundtrip):
                    raise RuntimeError(f"{name}: profile/restart gate failed")
        part = directory/"p0-wave-part.bin"
        profile_options = commands(8,1,1.e-5,PROFILES[0])+["--restart",str(part)]
        run("reject-missing-profile",commands(8,1,1.e-5)+["--restart",str(part)],rejected=True)
        run("reject-shift-scale",replace_argument(profile_options,"--shift-scale",4.),rejected=True)
        run("reject-ordering-scale",replace_argument(profile_options,"--ordering-scale",.4),rejected=True)
        run("reject-v1-as-profile",commands(8,1,1.e-5,PROFILES[0])+["--restart",str(directory/"new-fo-rhs-shadow.bin")],rejected=True)
        run("reject-legacy-parameters",commands(8,1,1.e-5)+["--shift-scale","3"],rejected=True)
        for name,raw in malformed_checkpoints(part.read_bytes()).items():
            bad = directory/f"malformed-{name}.bin"
            with bad.open("xb") as stream:
                stream.write(raw)
            run("reject-"+name,replace_argument(profile_options,"--restart",bad),rejected=True)
        result["binary_unchanged"] = binary_hash==sha256(solver) and legacy_hash==sha256(args.legacy_binary)
        result["passed"] = result["binary_unchanged"] and len(result["cases"])==6 and len(result["rejections"])==16
    except (OSError,ValueError,RuntimeError,subprocess.SubprocessError) as error:
        result["error"] = f"{type(error).__name__}: {error}"
    after = source_identity()
    result["source_identity_after"] = after
    result["source_unchanged"] = before==after
    result["passed"] = result["passed"] and before==after
    result["elapsed_seconds"] = time.perf_counter()-started
    NATIVE["write_new_json"](directory/"receipt.json",result)
    print(json.dumps({"receipt":str(directory/"receipt.json"),"passed":result["passed"],
                      "case_count":len(result["cases"]),"rejection_count":len(result["rejections"]),
                      "error":result["error"]}),flush=True)
    return 0 if result["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

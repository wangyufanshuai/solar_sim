"""Frozen FD4 template and checkpoint integration audit; not a physics gate."""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path
import runpy
import shutil
import struct
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, GaugeConfig, Grid3D, advance_fo_ccz4_rk4_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    HEADER, ORDER_HEADER, FOCheckpoint, checkpoint_from_state, decode_checkpoint,
)
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402

TOPO = runpy.run_path(str(ROOT / "scripts/run-nr-k3-topology-cache.py"))
NATIVE, sha256, require, new_json = (TOPO[k] for k in ("NATIVE", "sha256", "require", "new_json"))
PROFILE = FOCCZ4GaugeProfile()
GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261007-spatial-order.md"
PARENT_SHA = "23c2cf755c475019f35af6efdc4798605508d0eba83649bdacb01b96785fd34b"
OUTPUT_LIMIT = 192 * 1024**2
DT, AMPLITUDE = 1. / 1024., 1.e-4


def archive_identity(archive):
    path = archive / "baseline-receipt.json"
    require(sha256(path) == PARENT_SHA, "wrong 0.2.1 archive receipt")
    parent = json.loads(path.read_text(encoding="utf-8"))
    require(parent.get("passed") is True, "baseline was not verified")
    for name, digest in parent["source_before"].items():
        source = (archive / "baseline-source" / name).resolve()
        require(source.is_relative_to(archive.resolve()) and sha256(source) == digest,
                f"archived source drift: {name}")
    require(sha256(archive / "baseline-retained.exe") == parent["binaries"]["candidate"]["sha256"],
            "baseline binary drift")
    return parent


def source_identity(parent):
    paths = {ROOT / name for name in parent["source_before"]}
    paths.update(ROOT / name for name in NATIVE["source_identity"]())
    paths.update((Path(__file__).resolve(), ROOT / "scripts/tests/test_nr_spatial_order.py"))
    return {p.relative_to(ROOT).as_posix(): sha256(p) for p in sorted(paths)}


def manufactured_gate(rows):
    keys = {(o, n, a) for o in (2,4) for n in (16,24,32) for a in range(3)}
    require(len(rows) == 18 and {(r["order"],r["points"],r["axis"]) for r in rows} == keys,
            "all 18 manufactured rows are required")
    require(all(math.isfinite(r["l2"]) and r["l2"] > 1.e-12 for r in rows),
            "manufactured errors must be finite and measurable")
    result = []
    for order in (2,4):
        for axis in range(3):
            values = [next(r["l2"] for r in rows if (r["order"],r["points"],r["axis"]) ==
                           (order,n,axis)) for n in (16,24,32)]
            orders = [math.log(a/b)/math.log(n2/n1) for a,b,n1,n2 in
                      zip(values,values[1:],(16,24),(24,32))]
            lo,hi = (1.8,2.2) if order == 2 else (3.5,4.3)
            result.append({"spatial_order":order,"axis":axis,"errors":values,"observed_orders":orders,
                           "passed":all(lo <= p <= hi for p in orders)})
    return result


def legacy_manifest_equal(old, new):
    require(old.get("kernel_version") == "0.2.1" and new.get("kernel_version") == "0.3.0",
            "unexpected legacy comparison versions")
    a,b = copy.deepcopy(old),copy.deepcopy(new)
    require(b["grid"].pop("spatial_order",None) == 2, "legacy comparison must use order 2")
    for name,expected in (("spatial_order_bound_to_checkpoint",True),
                          ("spatial_operator","centered-periodic"),("numerical_dissipation","none")):
        require(b["diagnostics"].pop(name,None) == expected, "unexpected spatial metadata")
    if "checkpoint_version" not in a["diagnostics"]:
        require(b["diagnostics"].pop("checkpoint_version",None) == 1, "unexpected legacy checkpoint version")
    del a["kernel_version"],b["kernel_version"]
    require(a == b, "manifest differs outside frozen additions")
    return True


def initial(order, family, profile, points=8):
    grid = Grid3D((points,)*3,(0.,)*3,(1.,)*3,boundary="periodic",spatial_order=order)
    base = BSSNState3D.gauge_wave(grid,amplitude=AMPLITUDE) if family == "wave" else BSSNState3D.minkowski(grid)
    data = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base),profile=profile,dt=DT,
                                 amplitude=AMPLITUDE,scenario=int(family == "wave"))
    if family == "noise":
        rng = np.random.Generator(np.random.PCG64(20261007))
        data = FOCheckpoint(data.header,tuple(q+rng.uniform(-1.e-5,1.e-5,q.shape) for q in data.slots),profile)
    return data


def evolved(checkpoint, steps):
    state = advance_fo_ccz4_rk4_3d(checkpoint.to_state(),DT,steps=steps,gauge=GAUGE,
                                  gauge_profile=checkpoint.profile,boundary_mode="periodic")
    header = checkpoint.header
    return checkpoint_from_state(state,profile=checkpoint.profile,dt=DT,
                                 step=header["step"]+steps,time=header["time"]+steps*DT,
                                 amplitude=header["amplitude"],wavelength=header["wavelength"],scenario=header["scenario"])


def state_error(a,b):
    require(len(a.slots) == len(b.slots) == 58, "all 58 slots required")
    require(a.header == b.header and a.profile == b.profile, "cross-backend metadata mismatch")
    errors = [float(np.max(abs(x-y))) for x,y in zip(a.slots,b.slots)]
    require(all(math.isfinite(e) for e in errors), "nonfinite comparison")
    return max(errors)


def write_checkpoint(path, checkpoint):
    with path.open("xb") as stream:
        stream.write(checkpoint.to_bytes())


def legacy_fnv(raw):
    # Preserve this project's historical offset basis (not the standard FNV basis).
    value = 1469598103934665603
    for byte in raw:
        value = ((value ^ byte)*1099511628211) & ((1 << 64)-1)
    return f"{value:016x}"


def verify_manifest_checksums(raw, manifest):
    diagnostics = manifest["diagnostics"]
    require(diagnostics.get("checkpoint_checksum_fnv1a64") == legacy_fnv(raw), "checkpoint checksum mismatch")
    # State identity omits magic/version/dimension/variable-count, but includes
    # all profile/order extensions and every physical/auxiliary payload byte.
    require(diagnostics.get("state_checksum_fnv1a64") == legacy_fnv(raw[24:56]+raw[64:]),
            "state checksum mismatch")


class Runner(TOPO["BoundedRun"]):
    def budget(self):
        timeout = super().budget()
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file()) < OUTPUT_LIMIT,
                "192MiB output budget reached")
        return timeout

    def native(self, label, binary, data, *, steps=8, threads=4, restart=None,
               cli_order="stored", reject=False, expected_version="0.3.0"):
        h = data.header
        path, manifest = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        command = [binary,"--points",h["points"],"--steps",steps,"--threads",threads,"--dt",DT,
                   "--scenario","gauge-wave" if h["scenario"] else "minkowski","--formulation","ccz4",
                   "--solver-mode","fo-rhs-shadow","--amplitude",AMPLITUDE,"--wavelength",1,
                   "--checkpoint",path,"--manifest",manifest]
        if data.profile:
            command += ["--gauge-profile","state-dependent-v1","--shift-scale",data.profile.shift_scale,
                        "--ordering-scale",data.profile.ordering_scale]
        selected = h["spatial_order"] if cli_order == "stored" else cli_order
        if selected is not None:
            command += ["--spatial-order",selected]
        if restart:
            command += ["--restart",restart]
        self.execute(label,command,reject=reject)
        if reject:
            require(not path.exists() and not manifest.exists(),"rejected input wrote outputs")
            return None
        raw = path.read_bytes()
        observed = decode_checkpoint(raw,expected_profile=data.profile,
                                     expected_spatial_order=h["spatial_order"])
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        verify_manifest_checksums(raw,payload)
        validate_fo_ccz4_cpp_manifest(payload,expected_profile=data.profile,
                                     expected_spatial_order=h["spatial_order"])
        require(payload.get("kernel_version") == expected_version,"unexpected kernel version")
        expected_step = (h["step"] if restart else 0)+steps
        require(observed.header["step"] == payload["diagnostics"]["step"] == expected_step,"wrong output step")
        return {"path":path,"data":observed,"manifest":payload}


def deterministic_equal(a,b):
    require(a["path"].read_bytes() == b["path"].read_bytes(),"deterministic checkpoint bytes differ")
    require(a["path"].with_suffix(".json").read_bytes() == b["path"].with_suffix(".json").read_bytes(),
            "deterministic manifest bytes differ")


def corrupt_v3(data):
    raw = data.to_bytes()
    variants = {"truncated":raw[:-1],"trailing":raw+b"x"}
    for label,values in (("order2",(2,1,3.,.2)),("unknown-profile",(4,9,3.,.2)),
                         ("invalid-profile",(4,1,2.,.2)),("legacy-reserved",(4,0,3.,.2))):
        variants[label] = raw[:HEADER.size]+ORDER_HEADER.pack(*values)+raw[HEADER.size+ORDER_HEADER.size:]
    nan = bytearray(raw)
    struct.pack_into("<d",nan,HEADER.size+ORDER_HEADER.size,float("nan"))
    variants["nan"] = bytes(nan)
    return variants


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive",required=True,type=Path)
    parser.add_argument("--output-directory",required=True,type=Path)
    parser.add_argument("--vs-install",required=True,type=Path)
    args = parser.parse_args()
    archive,directory = args.archive.resolve(),args.output_directory.resolve()
    parent = archive_identity(archive)
    require(not directory.exists(),"fresh directory required")
    require(shutil.disk_usage(directory.parent).free >= TOPO["DISK_RESERVE"]+OUTPUT_LIMIT,"disk reserve insufficient")
    directory.mkdir()
    before = source_identity(parent)
    result = {"schema_version":"nr-k3-spatial-order-v1","source_before":before,"commands":[],"cases":[],
              "errors":[],"completed":False,"passed":False,"physical_validation":False,
              "dynamic_constraint_convergence_validated":False,"strong_hyperbolicity_validated":False,
              "cpbc":False,"black_hole_evolution_validated":False,"amr_validated":False,
              "cuda_validated":False,"long_time_stability_validated":False,"runtime_writeback":False,
              "scientificPayloadWriteback":False,"parent_sha256":PARENT_SHA}
    runner = Runner(directory,result)
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    new_json(directory/"frozen-input.json",result)
    try:
        cmake = args.vs_install/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
        source,build = directory/"native-source",directory/"native-build"
        shutil.copytree(ROOT/"science/numerical_relativity/cpp",source)
        runner.execute("configure",NATIVE["configure_command"](cmake,args.vs_install,source,build))
        runner.execute("build",[cmake,"--build",build,"--config","Release","--parallel",2,"--target",
                                 "nr-k2-fo-ccz4-shadow","nr-fo-topology-test","nr-fo-spatial-order-test"])
        binary = build/"Release/nr-k2-fo-ccz4-shadow.exe"
        result["binary"] = str(binary)
        result["binary_sha256"] = sha256(binary)
        stdout,_ = runner.execute("topology",[build/"Release/nr-fo-topology-test.exe"])
        topo = json.loads(stdout)
        require(topo.get("passed") is True and topo.get("observed_threads") == 4,"legacy topology gate failed")
        result["topology"] = topo
        stdout,_ = runner.execute("spatial-template",[build/"Release/nr-fo-spatial-order-test.exe"])
        unit = json.loads(stdout)
        require(unit.get("passed") is True and unit.get("far_index_checks") == 145902
                and unit.get("moment_error",1.) <= 2.e-13,"spatial unit gate failed")
        result["manufactured"] = manufactured_gate(unit["manufactured"])
        result["native_unit"] = unit
        require(all(r["passed"] for r in result["manufactured"]),"manufactured convergence gate failed")
        for order in (2,4):
            for family in ("wave","noise"):
                for profile in (None,PROFILE):
                    label = f"order{order}-{family}-{'profile' if profile else 'legacy'}"
                    data = initial(order,family,profile)
                    path = directory/f"{label}-initial.bin"
                    write_checkpoint(path,data)
                    direct = runner.native(f"{label}-direct",binary,data,restart=path)
                    row = {"label":label,"checkpoint_sha256":sha256(direct["path"])}
                    if order == 2:
                        old = runner.native(f"{label}-old",archive/"baseline-retained.exe",data,restart=path,
                                            cli_order=None,expected_version="0.2.1")
                        require(old["path"].read_bytes() == direct["path"].read_bytes(),"legacy bytes changed")
                        row["legacy_manifest_equal"] = legacy_manifest_equal(old["manifest"],direct["manifest"])
                    else:
                        serial = runner.native(f"{label}-serial",binary,data,restart=path,threads=1)
                        half = runner.native(f"{label}-half",binary,data,restart=path,steps=4)
                        split = runner.native(f"{label}-split",binary,half["data"],restart=half["path"],steps=4,threads=1)
                        deterministic_equal(direct,serial)
                        deterministic_equal(direct,split)
                        python = evolved(data,8)
                        row["python_cpp_error"] = state_error(direct["data"],python)
                        require(row["python_cpp_error"] <= 2.e-12,"FD4 Python/C++ mismatch")
                        # Both directions: raw C++ -> Python step -> v3 -> C++ step.
                        python_tail = evolved(direct["data"],1)
                        tail_path = directory/f"{label}-python-tail.bin"
                        write_checkpoint(tail_path,python_tail)
                        mixed = runner.native(f"{label}-mixed",binary,python_tail,restart=tail_path,steps=1)
                        pure = runner.native(f"{label}-pure-tail",binary,direct["data"],restart=direct["path"],steps=2)
                        row["bidirectional_error"] = state_error(mixed["data"],pure["data"])
                        require(row["bidirectional_error"] <= 5.e-12,"mixed-language restart mismatch")
                    row["passed"] = True
                    result["cases"].append(row)
        cold = runner.native("native-cold",binary,initial(4,"wave",PROFILE),steps=2)
        cold_tail = runner.native("native-cold-tail",binary,cold["data"],restart=cold["path"],steps=1)
        result["cold_initialization_error"] = state_error(cold_tail["data"],evolved(cold["data"],1))
        require(result["cold_initialization_error"] <= 2.e-12,"cold initializer cross-step failed")
        flat = initial(4,"flat",PROFILE,5)
        flat_out = runner.native("minkowski",binary,flat)
        require(all(np.array_equal(x,y) for x,y in zip(flat.slots,flat_out["data"].slots)),"Minkowski changed")
        result["minkowski_exact"] = True
        negative = initial(4,"noise",PROFILE)
        result["negative_cases"] = []
        for name,raw in corrupt_v3(negative).items():
            path = directory/f"bad-{name}-input.bin"
            with path.open("xb") as stream:
                stream.write(raw)
            runner.native(f"bad-{name}",binary,negative,restart=path,reject=True)
            result["negative_cases"].append(name)
        valid = directory/"bad-cli-input.bin"
        write_checkpoint(valid,negative)
        for name,selected in (("wrong-cli",2),("missing-cli",None),("invalid-cli",6)):
            runner.native(name,binary,negative,restart=valid,cli_order=selected,reject=True)
            result["negative_cases"].append(name)
        runner.native("old-rejects-v3",archive/"baseline-retained.exe",negative,restart=valid,cli_order=None,reject=True)
        require("checkpoint version" in (directory/"old-rejects-v3.log").read_text(),"old reader failed for wrong reason")
        result["negative_cases"].append("old-rejects-v3")
        runner.budget()
        require(len(result["cases"]) == 8,"missing case")
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        result["source_after"] = source_identity(parent)
        result["source_unchanged"] = before == result["source_after"]
        try:
            archive_identity(archive)
            result["archive_unchanged"] = True
        except (OSError,ValueError) as error:
            result["archive_unchanged"] = False
            result["errors"].append(str(error))
        result["elapsed_seconds"] = time.perf_counter()-runner.started
        result["passed"] = (result["completed"] and result["source_unchanged"]
                            and result["archive_unchanged"] and not result["errors"])
        result["artifact_hashes"] = {p.relative_to(directory).as_posix():sha256(p)
                                     for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json",result)
    print(json.dumps({"receipt":str(directory/"receipt.json"),"passed":result["passed"],
                      "cases":result["cases"],"manufactured":result.get("manufactured"),"errors":result["errors"]}),flush=True)
    return 0 if result["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

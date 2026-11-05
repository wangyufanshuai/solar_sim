"""Fresh native nonperiodic curved-vacuum audit. No installs, retries or live writes."""
from __future__ import annotations

import argparse
import json
import math
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
    HEADER, ORDER_HEADER, CONTROL_HEADER, checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_schwarzschild import (  # noqa: E402
    SchwarzschildDomain, BOUNDARY, initial_state, halo_mask,
)
from science.numerical_relativity.fo_ccz4_exterior_audit import (  # noqa: E402
    diagnose, common_indices, sampled, norms,
)
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import FOCCZ4Config, advance_fo_ccz4_rk4_3d  # noqa: E402
from science.numerical_relativity.ccz4_reference import GaugeConfig  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402
from science.numerical_relativity.fo_ccz4_relaxation_convergence import Case, initial  # noqa: E402

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-topology-cache.py"))
NATIVE = BASE["NATIVE"]
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
DOMAIN, PROFILE = SchwarzschildDomain(), FOCCZ4GaugeProfile()
GAUGE = GaugeConfig(theta_coupling=2., shift_coefficient=1., shift_damping=0.)
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-fine-relaxation-completion-v1-20261007/receipt.json")
PARENT_SHA = "716d9c560b6a7de5118d227e19d8024e40fdf812154c4dcd7cae93d3c874c23c"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-schwarzschild-domain.md"
CHANGED = {"science/numerical_relativity/"+name for name in (
    "fo_ccz4_checkpoint.py", "fo_ccz4_rhs.py", "manifest.py", "nr3d.py", "bssn3d.py",
    "cpp/nr_k2_fo_ccz4_shadow.cpp", "cpp/CMakeLists.txt")}
NEW = {"science/numerical_relativity/"+name for name in (
    "fo_ccz4_schwarzschild.py", "fo_ccz4_exterior_audit.py", "test_fo_ccz4_schwarzschild.py",
    "cpp/tests/schwarzschild_domain_test.cpp")}
NEW |= {"scripts/run-nr-k3-schwarzschild-domain.py", "scripts/tests/test_nr_schwarzschild_domain.py"}
SIZES, TIMES = (17, 25, 33), (0., 1./16, 1./8)
METRICS = ("state", "H", "M", "ricci_error", "weyl_invariant_error")


def lineage():
    require(sha256(PARENT) == PARENT_SHA, "parent receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["convergence_passed"]
            and parent["source_before"] == parent["source_after"], "validated parent required")
    for name, digest in parent["source_after"].items():
        require(sha256(PARENT.parent/"source-snapshot"/name) == digest, "retained source drift: "+name)
        if name not in CHANGED:
            require(sha256(ROOT/name) == digest, "unapproved current source drift: "+name)
    for name, digest in parent["artifact_hashes"].items():
        require(sha256(PARENT.parent/name) == digest, "parent artifact drift: "+name)
    require(sha256(Path(parent["binary"])) == parent["binary_sha256"], "retained binary changed")
    return parent


def seed(n, order, dt=1./256):
    return checkpoint_from_state(initial_state(n, order), profile=PROFILE, dt=dt, scenario=2,
                                 amplitude=0., tau_inverse=1., domain=DOMAIN)


def encode(path, data):
    raw = data.to_bytes()
    with path.open("xb") as stream:
        stream.write(raw)


def read(path, model):
    return decode_checkpoint(path.read_bytes(), expected_profile=model.profile,
                             expected_spatial_order=model.header["spatial_order"],
                             expected_tau_inverse=model.tau_inverse, expected_domain=model.domain)


def command(binary, data, out, meta, steps, threads, restart):
    h = data.header
    args = [binary, "--points", h["points"], "--spatial-order", h["spatial_order"], "--dt", h["dt"],
            "--amplitude", h["amplitude"], "--wavelength", h["wavelength"],
            "--scenario", ("minkowski", "gauge-wave", "schwarzschild-exterior")[h["scenario"]],
            "--solver-mode", "fo-rhs-shadow", "--steps", steps, "--threads", threads,
            "--checkpoint", out, "--manifest", meta, "--tau-inverse", data.tau_inverse,
            "--gauge-profile", "state-dependent-v1", "--shift-scale", data.profile.shift_scale,
            "--ordering-scale", data.profile.ordering_scale]
    if data.domain:
        args += ["--domain-lower", data.domain.lower, "--domain-upper", data.domain.upper, "--mass", data.domain.mass]
    if restart:
        args += ["--restart", restart]
    return args


def fnv(raw):
    value = 1469598103934665603
    for byte in raw:
        value = ((value ^ byte)*1099511628211) & ((1 << 64)-1)
    return f"{value:016x}"


def verify_checksums(raw, metadata):
    h = HEADER.unpack_from(raw)
    state_prefix = struct.pack("<QQQQddddQ", h[3], h[4], h[5], h[6], *h[8:13])
    diagnostic = metadata["diagnostics"]
    require(fnv(raw) == diagnostic["checkpoint_checksum_fnv1a64"], "checkpoint manifest checksum mismatch")
    require(fnv(state_prefix+raw[HEADER.size:]) == diagnostic["state_checksum_fnv1a64"], "state manifest checksum mismatch")


class Runner(BASE["BoundedRun"]):
    def budget(self):
        remaining = 900.-(time.perf_counter()-self.started)
        require(remaining > 0., "900s execution cap reached")
        require(shutil.disk_usage(self.directory).free >= 4*1024**3+32*1024**2, "C reserve reached")
        require(shutil.disk_usage(ROOT).free >= 1024**3, "E reserve reached")
        require(sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())+32*1024**2
                <= 384*1024**2, "384MiB artifact cap reached")
        return min(180., remaining)

    def native(self, binary, label, data, path, steps, threads=4, version="0.5.0"):
        out, meta = self.directory/f"{label}.bin", self.directory/f"{label}.json"
        require(not out.exists() and not meta.exists(), "output collision")
        self.execute(label, command(binary, data, out, meta, steps, threads, path))
        end = read(out, data)
        expected = {**data.header, "step": data.header["step"]+steps, "time": data.header["time"]+steps*data.header["dt"]}
        require(end.header == expected, "output header mismatch")
        payload = json.loads(meta.read_text(encoding="utf-8"))
        validate_fo_ccz4_cpp_manifest(payload, expected_profile=data.profile, expected_spatial_order=expected["spatial_order"],
                                    expected_tau_inverse=data.tau_inverse, expected_domain=data.domain,
                                    expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
        require(payload["kernel_version"] == version and payload["grid"]["shape"] == [expected["points"]]*3
                and payload["grid"]["dt"] == expected["dt"], "native build/grid identity mismatch")
        require(all(payload["diagnostics"][k] == expected[k] for k in ("time", "step", "amplitude", "wavelength")),
                "manifest state metadata mismatch")
        verify_checksums(out.read_bytes(), payload)
        if data.domain and path is not None:
            mask = halo_mask(data.slots[0].shape)
            require(all(np.array_equal(x[mask], y[mask]) for x, y in zip(end.slots, data.slots)), "halo bytes changed")
        return end, out, meta


def sample(data, path):
    return {"path": str(path), "sha256": sha256(path), "diagnostics": diagnose(data)}


def refinement(values, order):
    require(len(values) == 3 and all(math.isfinite(x) and x >= 0. for x in values), "three finite norms required")
    floor = 2.e-12
    rates = None
    if max(values) <= floor:
        status, passed = "bounded-null", True
    elif min(values) <= floor:
        status, passed = "floor-limited", False
    else:
        rates = [math.log(a/b)/math.log(ratio) for a, b, ratio in zip(values, values[1:], (24/16, 32/24))]
        status, passed = "measured", min(rates) >= (1.5 if order == 2 else 3.)
    return {"values": values, "orders": rates, "status": status, "passed": passed, "floor": floor}


def assess(rows):
    require(len(rows) == 6 and {(r["order"], r["n"]) for r in rows} == {(o, n) for o in (2, 4) for n in SIZES},
            "complete six-case matrix required")
    mapping = {(r["order"], r["n"]): r for r in rows}
    for row in rows:
        require([s["diagnostics"]["time"] for s in row["samples"]] == list(TIMES), "incomplete times")
    groups = []
    for order in (2, 4):
        for t_index in (1, 2):
            for metric in METRICS:
                values = [mapping[order, n]["samples"][t_index]["diagnostics"]["norms"][metric]["l2"] for n in SIZES]
                groups.append({"spatial_order": order, "time": TIMES[t_index], "metric": metric, **refinement(values, order)})
    initial_groups = []
    for order in (2, 4):
        for metric in ("H", "ricci_error", "weyl_invariant_error"):
            values = [mapping[order, n]["samples"][0]["diagnostics"]["norms"][metric]["l2"] for n in SIZES]
            initial_groups.append({"spatial_order": order, "metric": metric, **refinement(values, order)})
    return {"groups": groups, "initial_groups": initial_groups,
            "passed": all(r["passed"] for r in groups+initial_groups)}


def cross_backend(runner, binary, receipt):
    for order in (2, 4):
        for perturbed in (False, True):
            data = seed(9, order)
            if perturbed:
                data.slots[25][4, 4, 4] += .0001
                data.slots[55][4, 4, 4] -= .0001
            label = f"parity-fd{order}-perturbed{int(perturbed)}"
            path = runner.directory/f"{label}-initial.bin"
            encode(path, data)
            result = runner.native(binary, label, data, path, 4)
            python_state = advance_fo_ccz4_rk4_3d(data.to_state(), data.header["dt"], steps=4, gauge=GAUGE,
                gauge_profile=PROFILE, config=FOCCZ4Config(tau_inverse=1.), boundary_mode=BOUNDARY)
            error = float(np.max(np.abs(np.asarray(result[0].slots)-np.asarray(state_slots(python_state)))))
            receipt["parity"].append({"order": order, "perturbed": perturbed, "error": error, "passed": error <= 2.e-12})
            require(error <= 2.e-12, "cross-backend mismatch")
            if not perturbed:
                fresh = runner.native(binary, label+"-fresh", data, None, 4)
                error = float(np.max(np.abs(np.asarray(result[0].slots)-np.asarray(fresh[0].slots))))
                require(error <= 2.e-12, "fresh initializer mismatch")
                receipt["fresh_initialization"].append({"order": order, "error": error})


def rejections(runner, binary, receipt):
    data = seed(9, 4)
    raw = data.to_bytes()
    domain_offset = HEADER.size+ORDER_HEADER.size+CONTROL_HEADER.size
    values = {"truncated": raw[:-1]}
    for name, offset, fmt, value in (("boundary-id", domain_offset, "<Q", 2),
                                    ("halo-layers", domain_offset+8, "<Q", 1),
                                    ("alias", 32, "<Q", 1),
                                    ("halo-value", domain_offset+40, "<d", 1.01)):
        bad = bytearray(raw)
        struct.pack_into(fmt, bad, offset, value)
        values[name] = bytes(bad)
    values["wrong-mass"] = values["wrong-domain"] = raw
    for name, content in values.items():
        path = runner.directory/f"reject-{name}-input.bin"
        with path.open("xb") as stream:
            stream.write(content)
        out, meta = runner.directory/f"reject-{name}.bin", runner.directory/f"reject-{name}.json"
        args = command(binary, data, out, meta, 1, 4, path)
        if name == "wrong-mass":
            args[args.index("--mass")+1] = 1.1
        if name == "wrong-domain":
            args[args.index("--domain-upper")+1] = 3.1
        runner.execute("reject-"+name, args, reject=True)
        require(not out.exists() and not meta.exists(), "rejected invocation emitted output")
        receipt["rejections"].append(name)


def run(runner, parent, receipt):
    instance = NATIVE["discover_instance"]()
    cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
    receipt["cmake_sha256"] = sha256(cmake)
    for label, source in (("native", "cpp"), ("probe", "native_probe")):
        build = runner.directory/f"{label}-build"
        runner.execute(label+"-configure", NATIVE["configure_command"](cmake, instance,
            runner.directory/"source-snapshot/science/numerical_relativity"/source, build))
        args = [cmake, "--build", build, "--config", "Release", "--parallel", 2]
        if label == "native":
            args += ["--target", "nr-k2-fo-ccz4-shadow", "nr-fo-topology-test", "nr-fo-spatial-order-test", "nr-fo-schwarzschild-domain-test"]
        runner.execute(label+"-build", args)
    probe = runner.directory/"probe-build/Release/nr-native-toolchain-probe.exe"
    output, _ = runner.execute("probe", [probe])
    receipt["probe"] = json.loads(output)
    require(NATIVE["validate_probe"](receipt["probe"]), "real four-worker OpenMP probe failed")
    for name in ("topology", "spatial-order", "schwarzschild-domain"):
        runner.execute("test-"+name, [runner.directory/f"native-build/Release/nr-fo-{name}-test.exe"])
    binary = runner.directory/"native-build/Release/nr-k2-fo-ccz4-shadow.exe"
    receipt["binary"], receipt["binary_sha256"] = str(binary), sha256(binary)
    for order in (2, 4):
        for rate in (0., 1.):
            data = initial(Case(order, 8, rate))
            label = f"legacy-fd{order}-rate{rate:g}"
            path = runner.directory/f"{label}-initial.bin"
            encode(path, data)
            old = runner.native(Path(parent["binary"]), label+"-old", data, path, 4, version="0.4.0")
            new = runner.native(binary, label+"-new", data, path, 4)
            require(old[1].read_bytes() == new[1].read_bytes(), "periodic checkpoint regression")
            a, b = (json.loads(p[2].read_text(encoding="utf-8")) for p in (old, new))
            BASE["equivalent_manifests"](a, b, "0.4.0", "0.5.0")
            receipt["legacy_replay"].append(label)
    cross_backend(runner, binary, receipt)
    rejections(runner, binary, receipt)
    outputs = {}
    for order in (2, 4):
        for n in SIZES:
            data = seed(n, order)
            label = f"fd{order}-n{n}"
            path = runner.directory/f"{label}-initial.bin"
            encode(path, data)
            row = {"order": order, "n": n, "samples": [sample(data, path)]}
            receipt["cases"].append(row)
            for t in TIMES[1:]:
                data, path, meta = runner.native(binary, label+f"-t{t:g}", data, path, 16)
                row["samples"].append(sample(data, path))
            outputs[order, n] = data, path, meta
    receipt["assessment"] = assess(receipt["cases"])
    for order in (2, 4):
        data = seed(33, order, 1./512)
        path = runner.directory/f"dt-control-fd{order}-initial.bin"
        encode(path, data)
        fine, out, _ = runner.native(binary, f"dt-control-fd{order}", data, path, 64)
        coarse = outputs[order, 33][0]
        diff = np.moveaxis(np.asarray(fine.slots)-np.asarray(coarse.slots), 0, -1)
        error = norms(sampled(diff, common_indices(33)))["l2"]
        denominator = max(diagnose(coarse)["norms"]["state"]["l2"], 2.e-12)
        receipt["time_controls"].append({"order": order, "path": str(out), "sha256": sha256(out),
            "rms_difference": error, "denominator": denominator, "ratio": error/denominator,
            "passed": error/denominator <= .05})
    direct = runner.native(binary, "serial-direct-fd4-n17", seed(17, 4),
                           runner.directory/"fd4-n17-initial.bin", 32, threads=1)
    staged = outputs[4, 17]
    require(direct[1].read_bytes() == staged[1].read_bytes() and direct[2].read_bytes() == staged[2].read_bytes(),
            "serial/restart determinism failure")
    receipt["deterministic_replay"] = True
    receipt["convergence_passed"] = receipt["assessment"]["passed"] and all(c["passed"] for c in receipt["time_controls"])
    receipt["completed"] = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    parent = lineage()
    directory = args.output_directory.resolve()
    require(not directory.exists(), "fresh output directory required")
    directory.mkdir(parents=True)
    names = set(parent["source_after"]) | CHANGED | NEW
    before = {name: sha256(ROOT/name) for name in sorted(names)}
    for name in before:
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
    shutil.copyfile(PROTOCOL, directory/PROTOCOL.name)
    receipt = {"schema": "nr-k3-schwarzschild-domain-v1", "parent": str(PARENT), "parent_sha256": PARENT_SHA,
        "source_before": before, "protocol_sha256": sha256(PROTOCOL), "python": platform.python_version(),
        "numpy": np.__version__, "completed": False, "convergence_passed": False,
        "physical_validation": False, "black_hole_evolution_validated": False, "cpbc_validated": False,
        "runtime_writeback": False, "scientificPayloadWriteback": False, "gpu_validated": False,
        "commands": [], "errors": [], "cases": [], "parity": [], "fresh_initialization": [],
        "legacy_replay": [], "rejections": [], "time_controls": []}
    runner = Runner(directory, receipt)
    try:
        run(runner, parent, receipt)
        runner.budget()
    except Exception as error:
        receipt["errors"].append(f"{type(error).__name__}: {error}")
        receipt["completed"] = receipt["convergence_passed"] = False
    finally:
        receipt["seconds"] = time.perf_counter()-runner.started
        receipt["source_after"] = {name: sha256(ROOT/name) for name in sorted(names)}
        if receipt["source_before"] != receipt["source_after"] or sha256(PROTOCOL) != receipt["protocol_sha256"]:
            receipt["errors"].append("source/protocol changed during campaign")
            receipt["completed"] = receipt["convergence_passed"] = False
        receipt["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
            for p in sorted(directory.rglob("*")) if p.is_file()}
        new_json(directory/"receipt.json", receipt)
        print(json.dumps({"completed": receipt["completed"], "convergence_passed": receipt["convergence_passed"],
                          "errors": receipt["errors"], "receipt": str(directory/"receipt.json")}), flush=True)
    return 0 if receipt["completed"] and receipt["convergence_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

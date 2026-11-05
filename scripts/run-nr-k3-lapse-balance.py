"""Frozen instantaneous RHS balance audit; no evolution or old-gate promotion."""
from __future__ import annotations

import argparse
from dataclasses import replace
import json
from pathlib import Path
import runpy
import shutil
import struct
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity.fo_ccz4_checkpoint import decode_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import fo_ccz4_rhs_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_lapse_constraint_balance import rhs_slots, summarize  # noqa: E402
from science.numerical_relativity.fo_ccz4_trace_source_window import (  # noqa: E402
    AMPLITUDES, PROFILE, WAVES, Case, initial,
)

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-trace-source-window.py"))
STENCIL = BASE["STENCIL"]
NATIVE = STENCIL["NATIVE"]
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-trace-source-prospective-v1-20261007/receipt.json")
PARENT_SHA = "55ed425f00fdddbda227b6ad7af0f75a3002cf237baa1b2f752b54affbc7ec1c"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-lapse-balance.md"
NEW_FILES = ("science/numerical_relativity/fo_ccz4_lapse_constraint_balance.py",
             "science/numerical_relativity/test_fo_ccz4_lapse_constraint_balance.py",
             "science/numerical_relativity/native_rhs_probe/CMakeLists.txt",
             "science/numerical_relativity/native_rhs_probe/probe.cpp",
             "scripts/run-nr-k3-lapse-balance.py", "scripts/tests/test_nr_lapse_balance.py")
HEADER = struct.Struct("<8sQQQ")
RHS_MAGIC, PARITY_BOUND = b"NRFORHS1", 2.e-12


def read_rhs(raw, points):
    require(len(raw) >= HEADER.size and HEADER.unpack_from(raw) == (RHS_MAGIC, 1, points, 58),
            "not an identified 58-slot RHS inspection")
    require(len(raw) == HEADER.size+58*points**3*8, "RHS inspection size mismatch")
    q = np.frombuffer(raw, dtype="<f8", offset=HEADER.size).reshape(58, points, points, points)
    require(np.all(np.isfinite(q)), "nonfinite RHS inspection")
    return tuple(q)


def retained_identity():
    require(sha256(PARENT) == PARENT_SHA, "prospective v1 receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] is True and parent["prospective_trace_source_screen_passed"] is False
            and not parent["errors"] and parent["source_before"] == parent["source_after"],
            "retained completed but inconclusive v1 required")
    for mapping, base in ((parent["source_before"], ROOT), (parent["artifact_hashes"], PARENT.parent)):
        for name, digest in mapping.items():
            path = (base/name).resolve()
            require(path.is_relative_to(base.resolve()) and sha256(path) == digest, f"retained drift: {name}")
    require(sha256(Path(parent["binary"])) == parent["binary_sha256"], "retained solver changed")
    return parent


def source_identity(parent):
    return {n: sha256(ROOT/n) for n in sorted(set(parent["source_before"]) | set(NEW_FILES))}


def fixtures():
    """Twenty preregistered inputs; larger fields are NOT time evolved."""
    result = []
    for order in (2, 4):
        for wave in WAVES:
            for family in ("trace", "tracefree"):
                c = Case(order, 8, wave, family, AMPLITUDES[1])
                base = initial(c)
                q = list(base.slots)
                for i in (11, 14, 16):
                    q[i] = q[i]*500.  # exactly specified epsilon=1e-3
                data = replace(base, slots=tuple(q), header={**base.header, "amplitude": .001})
                result.append((f"fixture-fd{order}-k{''.join(map(str,wave))}-{family}", data, family))
        for seed in (20261007, 20261008):
            base = initial(Case(order, 8, (0, 0, 0), "flat", 0.))
            rng = np.random.Generator(np.random.PCG64(seed))
            x = np.indices((8,)*3)/8
            slots = []
            for q in base.slots:
                perturbation = sum(rng.uniform(-1., 1.)*np.sin(2*np.pi*sum(k*v for k,v in zip(w,x))
                                   + rng.uniform(-np.pi, np.pi)) for w in WAVES)/4.
                slots.append(q + .01*perturbation)
            data = replace(base, slots=tuple(slots), header={**base.header, "amplitude": .01})
            result.append((f"fixture-fd{order}-seed{seed}-independent", data, "independent"))
    return result


class Runner(BASE["Runner"]):
    def probe(self, binary, label, data, path, threads=4):
        target = self.directory/f"{label}.rhs"
        require(not target.exists(), "RHS output collision")
        stdout, _ = self.execute(label, [binary, "--input", path, "--output", target, "--threads", threads])
        meta = json.loads(stdout)
        require(meta == {"schema_version": "nr-fo-rhs-inspection-v1", "test_only": True, "evolution_steps": 0,
                         "observed_threads": threads, "points": data.header["points"], "variable_count": 58},
                "probe provenance differs")
        return read_rhs(target.read_bytes(), data.header["points"]), target, meta


def build(runner, result):
    instance = NATIVE["discover_instance"]()
    cmake = instance/"Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"
    snapshot = runner.directory/"source-snapshot/science/numerical_relativity"
    build_dir = runner.directory/"probe-build"
    command = NATIVE["configure_command"](cmake, instance, snapshot/"native_rhs_probe", build_dir)
    command += [f"-DNR_SHADOW_SOURCE={(snapshot/'cpp/nr_k2_fo_ccz4_shadow.cpp').as_posix()}"]
    runner.execute("configure", command)
    runner.execute("build", [cmake, "--build", build_dir, "--config", "Release", "--parallel", 2])
    binary = build_dir/"Release/nr-fo-rhs-probe.exe"
    result.update(vs_instance=str(instance), cmake_sha256=sha256(cmake),
                  probe_binary=str(binary), probe_sha256=sha256(binary),
                  bound_solver_source_sha256=sha256(snapshot/"cpp/nr_k2_fo_ccz4_shadow.cpp"))
    return binary


def negative_controls(runner, binary, data, path, existing):
    before = sha256(existing)
    rows = []
    analytic = runner.directory/"negative-analytic.bin"
    STENCIL["write_checkpoint"](analytic, replace(data, header={**data.header, "solver_mode": 0}))
    truncated = runner.directory/"negative-truncated.bin"
    with truncated.open("xb") as f:
        f.write(data.to_bytes()[:-1])
    variants = (("collision", path, existing, [], "output already exists"),
                ("analytic", analytic, None, [], "requires dynamic checkpoint"),
                ("truncated", truncated, None, [], None),
                ("unknown", path, None, ["--unknown", "1"], "unknown or duplicate"),
                ("duplicate", path, None, ["--threads", "4"], "unknown or duplicate"),
                ("threads", path, None, [], "threads 1 or 4"))
    for name, input_path, output, extra, message in variants:
        output = output or runner.directory/f"negative-{name}.rhs"
        command = [binary, "--input", input_path, "--output", output, "--threads", 2 if name == "threads" else 4, *extra]
        runner.execute("negative-"+name, command, reject=True)
        require(runner.receipt["commands"][-1]["returncode"] == 2, "wrong rejection exit")
        log = (runner.directory/f"negative-{name}.log").read_text(encoding="utf-8")
        require(message is None or message in log, "wrong rejection reason")
        require(sha256(existing) == before and (name == "collision" or not output.exists()), "rejected probe wrote output")
        rows.append({"name": name, "side_effect_free_rejection": True})
    return rows


def run_audit(runner, parent, binary, result):
    inputs = []
    for row in parent["cases"]:
        for s in row["samples"]:
            path = Path(s["checkpoint"])
            require(sha256(path) == s["sha256"], "retained input changed")
            data = decode_checkpoint(path.read_bytes(), expected_profile=PROFILE, expected_spatial_order=row["order"])
            inputs.append((f"retained-{row['label']}-t{s['time']:g}", data, path, "retained"))
    for label, data, family in fixtures():
        path = runner.directory/f"{label}.bin"
        STENCIL["write_checkpoint"](path, data)
        inputs.append((label, data, path, family))
    for label, data, path, family in inputs:
        runner.budget()
        native, target, meta = runner.probe(binary, label, data, path)
        py = rhs_slots(fo_ccz4_rhs_3d(data.to_state(), gauge=STENCIL["GAUGE"], gauge_profile=PROFILE))
        error = max(float(np.max(abs(a-b))) for a,b in zip(native, py))
        a, b = summarize(data, native), summarize(data, py)
        row = {"label": label, "family": family, "input": str(path), "input_sha256": sha256(path),
               "rhs": str(target), "rhs_sha256": sha256(target), "inspection": meta,
               "native_balance": a, "python_balance": b, "rhs_python_cpp_max_abs_error": error}
        result["rows"].append(row)
        new_json(runner.directory/f"{label}-diagnostics.json", row)
        require(error <= PARITY_BOUND and a["identity_passed"] and b["identity_passed"], "RHS balance/parity failed")
        if family == "tracefree":
            require(a["measured_lapse_rate_l_inf"] <= 1.e-12 and a["geometric_trace_rate_l_inf"] <= 1.e-12,
                    "initial tracefree null-rate control failed")
        if family == "independent":
            require(min(a["parts_l_inf"].values()) > 1.e-10, "not all seven balance terms were exercised")
            _, serial, _ = runner.probe(binary, label+"-serial", data, path, threads=1)
            require(serial.read_bytes() == target.read_bytes(), "1/4-thread full RHS bytes differ")
            result["serial_replays"].append({"label": label, "full_rhs_bytes_equal": True})
        runner.budget()
    label, data, path, _ = inputs[-1]
    result["negative_controls"] = negative_controls(runner, binary, data, path, runner.directory/f"{label}.rhs")
    require(len(inputs) == 330 and len(result["commands"]) == 342 and len(result["serial_replays"]) == 4,
            "frozen instantaneous audit matrix incomplete")


def campaign(directory):
    parent = retained_identity()
    require(not directory.exists(), "fresh evidence directory required")
    require(shutil.disk_usage(directory.parent).free >= 4*1024**3 + BASE["OUTPUT_LIMIT"], "insufficient evidence reserve")
    directory.mkdir()
    before = source_identity(parent)
    result = {"schema_version": "nr-k3-lapse-balance-v1", "source_before": before, "rows": [],
              "commands": [], "serial_replays": [], "errors": [], "completed": False,
              "instantaneous_balance_audit_passed": False, "parent_sha256": PARENT_SHA,
              "old_prospective_gate_changed": False, "new_time_evolution_executed": False,
              "physical_validation": False, "strong_hyperbolicity_validated": False,
              "full_constraint_propagation_validated": False, "black_hole_evolution_validated": False,
              "cpbc": False, "amr_validated": False, "cuda_validated": False,
              "long_time_stability_validated": False, "runtime_writeback": False, "scientificPayloadWriteback": False}
    runner = Runner(directory, result)
    shutil.copyfile(PROTOCOL, directory/"protocol.frozen.md")
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    for name, digest in before.items():
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
        require(sha256(target) == digest, "snapshot drift")
    new_json(directory/"frozen-input.json", result)
    try:
        binary = build(runner, result)
        run_audit(runner, parent, binary, result)
        result["completed"] = result["instantaneous_balance_audit_passed"] = True
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = source_identity(parent)
        require(result["source_after"] == before and sha256(PROTOCOL) == result["protocol_sha256"], "source/protocol drift")
        retained_identity()
        result["retained_identity_unchanged"] = True
    except Exception as exc:
        result["retained_identity_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["instantaneous_balance_audit_passed"] &= not result["errors"]
    result["elapsed_seconds"] = time.perf_counter()-runner.started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    new_json(directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "instantaneous_balance_audit_passed", "errors")}), flush=True)
    return 0 if result["instantaneous_balance_audit_passed"] else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    raise SystemExit(campaign(args.output_directory.resolve()))

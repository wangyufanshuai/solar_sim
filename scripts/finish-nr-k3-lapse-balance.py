"""Complete only the unexecuted negative controls; preserve the stopped v1."""
from __future__ import annotations

import argparse
from dataclasses import replace
import json
from pathlib import Path
import runpy
import shutil
import struct
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-lapse-balance.py"))
sha256, require, new_json = (BASE[k] for k in ("sha256", "require", "new_json"))
PARENT = Path("C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-v1-20261007/receipt.json")
PARENT_SHA = "68884a3e941f6acd37167af6669e30357d59b93a6c5397e5c91c022a03db18a1"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-lapse-balance-completion.md"
NEW_FILES = ("scripts/finish-nr-k3-lapse-balance.py", "scripts/tests/test_nr_lapse_balance_completion.py")


def analytic_input(data):
    """A valid analytic envelope has NO dynamic-only gauge profile."""
    return replace(data, header={**data.header, "solver_mode": 0,
                                 "version": 3 if data.header["spatial_order"] == 4 else 1}, profile=None)


def decode_input(path):
    raw = path.read_bytes()
    version = struct.unpack_from("<Q", raw, 8)[0]
    return BASE["decode_checkpoint"](raw, expected_profile=BASE["PROFILE"],
                                      expected_spatial_order=4 if version == 3 else 2)


def retained_identity():
    require(sha256(PARENT) == PARENT_SHA, "stopped v1 receipt changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] is False and parent["instantaneous_balance_audit_passed"] is False
            and parent["errors"] == [{"type": "ValueError", "message": "checkpoint profile requires dynamic solver"}]
            and len(parent["rows"]) == 330 and len(parent["commands"]) == 336
            and all(c["returncode"] == 0 for c in parent["commands"])
            and len(parent["serial_replays"]) == 4 and parent["source_before"] == parent["source_after"],
            "known completed numerical prefix and unexecuted negative controls required")
    for mapping, base in ((parent["source_before"], ROOT), (parent["artifact_hashes"], PARENT.parent)):
        for name, digest in mapping.items():
            path = (base/name).resolve()
            require(path.is_relative_to(base.resolve()) and sha256(path) == digest, f"retained identity drift: {name}")
    require(sha256(Path(parent["probe_binary"])) == parent["probe_sha256"], "bound probe changed")
    require((PARENT.parent/"negative-analytic.bin").stat().st_size == 0, "failed construction artifact changed")
    BASE["retained_identity"]()
    return parent


def recheck_numeric_prefix(parent):
    maximum = 0.
    for row in parent["rows"]:
        path, target = Path(row["input"]), Path(row["rhs"])
        require(sha256(path) == row["input_sha256"] and sha256(target) == row["rhs_sha256"], "input/RHS changed")
        data = decode_input(path)
        cpp = BASE["read_rhs"](target.read_bytes(), data.header["points"])
        py = BASE["rhs_slots"](BASE["fo_ccz4_rhs_3d"](data.to_state(), gauge=BASE["STENCIL"]["GAUGE"],
                                                       gauge_profile=BASE["PROFILE"]))
        error = max(float(np.max(abs(a-b))) for a,b in zip(cpp, py))
        require(error == row["rhs_python_cpp_max_abs_error"] <= BASE["PARITY_BOUND"], "retained RHS parity drift")
        for name, fields in (("native_balance", cpp), ("python_balance", py)):
            result = BASE["summarize"](data, fields)
            require(result == row[name] and result["identity_passed"], "retained balance drift")
        if row["family"] == "tracefree":
            require(row["native_balance"]["measured_lapse_rate_l_inf"] <= 1.e-12
                    and row["native_balance"]["geometric_trace_rate_l_inf"] <= 1.e-12, "retained null gate failed")
        if row["family"] == "independent":
            require(min(row["native_balance"]["parts_l_inf"].values()) > 1.e-10, "term coverage missing")
            require((PARENT.parent/f"{row['label']}-serial.rhs").read_bytes() == target.read_bytes(), "serial replay drift")
        maximum = max(maximum, error)
    return {"recomputed_rows": 330, "max_rhs_python_cpp_error": maximum,
            "all_instantaneous_balance_and_coverage_gates": True}


def write_encoded(path, raw):
    with path.open("xb") as stream:
        stream.write(raw)


def negative_controls(runner, binary, data, path, existing):
    before = sha256(existing)
    analytic, truncated = runner.directory/"negative-analytic.bin", runner.directory/"negative-truncated.bin"
    raw = analytic_input(data).to_bytes()  # Encode before opening any file.
    checked = BASE["decode_checkpoint"](raw, expected_profile=None, expected_spatial_order=data.header["spatial_order"])
    require(checked.header["solver_mode"] == 0, "analytic negative input is not structurally valid")
    write_encoded(analytic, raw)
    write_encoded(truncated, data.to_bytes()[:-1])
    variants = (("collision", path, existing, [], "output already exists"),
                ("analytic", analytic, None, [], "requires dynamic checkpoint"),
                ("truncated", truncated, None, [], "truncated"),
                ("unknown", path, None, ["--unknown", "1"], "unknown or duplicate"),
                ("duplicate", path, None, ["--threads", "4"], "unknown or duplicate"),
                ("threads", path, None, [], "threads 1 or 4"))
    rows = []
    for name, input_path, output, extra, message in variants:
        output = output or runner.directory/f"negative-{name}.rhs"
        runner.execute("negative-"+name, [binary, "--input", input_path, "--output", output,
                       "--threads", 2 if name == "threads" else 4, *extra], reject=True)
        require(runner.receipt["commands"][-1]["returncode"] == 2, "wrong rejection code")
        log = (runner.directory/f"negative-{name}.log").read_text(encoding="utf-8")
        require(message in log, "wrong negative-control error reason")
        require(sha256(existing) == before and (name == "collision" or not output.exists()), "negative output side effect")
        rows.append({"name": name, "exact_expected_rejection": True, "side_effect_free": True})
    return rows


def campaign(directory):
    parent = retained_identity()
    require(not directory.exists(), "fresh completion directory required")
    directory.mkdir()
    before = {n: sha256(ROOT/n) for n in sorted(set(parent["source_before"]) | set(NEW_FILES))}
    result = {"schema_version": "nr-k3-lapse-balance-completion-v1", "source_before": before,
              "parent_receipt": str(PARENT), "parent_sha256": PARENT_SHA, "commands": [], "errors": [],
              "completed": False, "instantaneous_balance_audit_passed": False,
              "stopped_v1_rewritten": False, "old_prospective_gate_changed": False, "new_time_evolution_executed": False,
              "physical_validation": False, "full_constraint_propagation_validated": False,
              "strong_hyperbolicity_validated": False, "black_hole_evolution_validated": False,
              "cpbc": False, "amr_validated": False, "cuda_validated": False,
              "long_time_stability_validated": False, "runtime_writeback": False, "scientificPayloadWriteback": False}
    runner = BASE["Runner"](directory, result)
    runner.budget()
    shutil.copyfile(PROTOCOL, directory/"protocol.frozen.md")
    result["protocol_sha256"] = sha256(directory/"protocol.frozen.md")
    for name, digest in before.items():
        target = directory/"source-snapshot"/name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)
        require(sha256(target) == digest, "snapshot changed")
    new_json(directory/"frozen-input.json", result)
    try:
        result["numeric_prefix_recheck"] = recheck_numeric_prefix(parent)
        runner.budget()
        binary = Path(parent["probe_binary"])
        result.update(probe_binary=str(binary), probe_sha256=sha256(binary))
        selected = [row for row in parent["rows"] if row["family"] == "independent"
                    and "20261007" in row["label"]]
        require(len(selected) == 2, "FD2/4 positive smoke pair missing")
        result["fresh_positive_replays"] = []
        for row in selected:
            path = Path(row["input"])
            data = decode_input(path)
            _, target, _ = runner.probe(binary, row["label"]+"-fresh", data, path)
            require(target.read_bytes() == Path(row["rhs"]).read_bytes(), "fresh positive replay differs")
            result["fresh_positive_replays"].append({"label": row["label"], "full_rhs_bytes_equal": True})
        result["negative_controls"] = negative_controls(runner, binary, data, path, target)
        require(len(result["commands"]) == 8 and len(result["negative_controls"]) == 6, "completion matrix incomplete")
        runner.budget()
        result["completed"] = result["instantaneous_balance_audit_passed"] = True
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["source_after"] = {n: sha256(ROOT/n) for n in before}
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

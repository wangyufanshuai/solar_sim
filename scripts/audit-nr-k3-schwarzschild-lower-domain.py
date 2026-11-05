"""Separate-process reconstruction, not independent physical-formula validation."""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
R = runpy.run_path(str(ROOT / "scripts/run-nr-k3-schwarzschild-lower-domain.py"))
B, W, H = (R[k] for k in ("B", "W", "H"))
require, sha256 = R["require"], R["sha256"]


def independent_refinement(values):
    require(len(values) == 3 and all(math.isfinite(x) and x >= 0 for x in values), "three finite norms required")
    if max(values) <= 2.e-12:
        rates, status, passed = None, "bounded-null", True
    elif min(values) <= 2.e-12:
        rates, status, passed = None, "floor-limited", False
    else:
        rates = [math.log(values[0] / values[1]) / math.log(1.5),
                 math.log(values[1] / values[2]) / math.log(4. / 3.)]
        status, passed = "measured", all(p >= 3. for p in rates)
    return {"values": values, "orders": rates, "status": status, "passed": passed, "floor": 2.e-12}


def recompute_groups(value):
    rows = {r["n"]: r for r in value["study_cases"]}
    differences = {(c["lower_n"], c["time"]): c for c in value["region_comparisons"]}
    groups, changes = [], []
    for t in (.25, .5, 1.):
        for metric in W["PRIMARY"]:
            norms = [next(s for s in rows[n]["samples"] if s["diagnostics"]["time"] == t)["diagnostics"]["core"][metric]["l2"]
                     for n in (21, 31, 41)]
            delta = [differences[n, t]["metrics"][metric]["rms_difference"] for n in (21, 31, 41)]
            groups.append({"time": t, "metric": metric, **independent_refinement(norms)})
            changes.append({"time": t, "metric": metric, **independent_refinement(delta)})
    return {"lower_groups": groups, "region_difference_groups": changes,
            "lower_spatial_passed": all(g["passed"] for g in groups),
            "region_difference_spatial_passed": all(g["passed"] for g in changes)}


def load(path, n, dt, t):
    model = R["lower_seed"](n, dt)
    data = B["read"](path, model)
    expected = {**model.header, "time": t, "step": int(t / dt)}
    require(data.header == expected, "audited checkpoint identity differs")
    require(R["RUN"]["halo_bytes"](data) == R["RUN"]["halo_bytes"](model), "audited halo changed")
    if t != 0.:
        meta = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
        B["validate_fo_ccz4_cpp_manifest"](meta, expected_profile=data.profile, expected_spatial_order=4,
            expected_tau_inverse=1., expected_domain=R["DOMAIN"], expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
        require(meta["kernel_version"] == "0.5.0" and meta["grid"]["shape"] == [n] * 3 and meta["grid"]["dt"] == dt,
                "audited manifest grid/version differs")
        require(all(meta["diagnostics"][k] == data.header[k] for k in ("time", "step", "amplitude", "wavelength")),
                "audited manifest state differs")
        B["verify_checksums"](path.read_bytes(), meta)
    return data


def reconstruct(receipt, inventory, guard):
    value = copy.deepcopy(receipt)
    count = 0
    records = H.read_records(R["ANCHOR"].parent / "high-steps256-threads4.diagnostic", "high", 256)
    value["historical_controls"], value["shared_initial"], value["region_comparisons"] = [], [], []
    for (small, n), row in zip(R["PAIRS"], value["study_cases"], strict=True):
        require(row["n"] == n, "ordered sample grids required")
        for saved in [row["initial"], *row["samples"]]:
            guard()
            t, path = saved["diagnostics"]["time"], Path(saved["path"])
            require(sha256(path) == saved["sha256"], "audited sample digest differs")
            data = load(path, n, 1. / 256, t)
            require(W["sample"](data, path, retained=saved["retained"]) == saved, "diagnostic reconstruction differs")
            count += 1
            if t == 0.:
                value["shared_initial"].append(R["shared_initial"](R["old_state"](inventory, "original", small, 0.), data))
            elif t in W["TIMES"]:
                value["region_comparisons"].append({"main_n": small, "lower_n": n,
                    **W["boundary_location_difference"](R["old_state"](inventory, "original", small, t), data)})
                if n == 21:
                    value["historical_controls"].append(R["historical"](data, records))
        print(json.dumps({"audit_grid": n, "samples_recomputed": count}), flush=True)
    value["time_controls"] = []
    time_initial = Path(value["time_initial"]["path"])
    require(sha256(time_initial) == value["time_initial"]["sha256"], "time initial digest differs")
    initial = load(time_initial, 41, 1. / 512, 0.)
    require(np.asarray(initial.slots).tobytes() == np.asarray(R["primary"](value, 41, 0.)[0].slots).tobytes(), "time initial slots differ")
    for saved in value["time_samples"]:
        guard()
        t, path = saved["diagnostics"]["time"], Path(saved["path"])
        require(sha256(path) == saved["sha256"], "time sample digest differs")
        data = load(path, 41, 1. / 512, t)
        require(W["sample"](data, path, retained=saved["retained"]) == saved, "time diagnostic differs")
        count += 1
        if t != .75:
            value["time_controls"].append(W["timestep_difference"](R["primary"](value, 41, t)[0], data))
    require(count == 31, "31 reconstructed samples required")
    value["spatial_assessment"] = recompute_groups(value)
    guard()
    value["factorial_records"] = R["factorial_study"](value, inventory)
    value["factorial_trends"] = R["factorial_trends"](value["factorial_records"])
    for key in ("historical_controls", "shared_initial", "region_comparisons", "time_controls", "spatial_assessment", "factorial_records", "factorial_trends"):
        require(value[key] == receipt[key], "raw reconstruction differs: " + key)
    paths = receipt["replay_paths"]
    direct, staged = Path(paths["direct"]), Path(paths["staged"])
    load(direct, 21, 1. / 256, 1.)
    require(direct.read_bytes() == staged.read_bytes() and direct.with_suffix(".json").read_bytes() == staged.with_suffix(".json").read_bytes(), "audited replay differs")
    verdict = R["final_assessment"](value)
    require(all(receipt[k] == v for k, v in verdict.items()), "final decision differs")
    return {"samples_recomputed": count, "factorial_records_recomputed": len(value["factorial_records"]), **verdict}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    directory, path = args.output_directory.resolve(), args.receipt.resolve()
    require(directory.is_relative_to(R["EVIDENCE"].resolve()) and directory != R["EVIDENCE"].resolve()
            and not directory.exists(), "fresh E audit child required")
    receipt = R["verified_json"](path, args.receipt_sha256)
    R["validate_stage"](receipt, "replay")
    require(receipt["study_completed"] is True, "completed lower study required")
    R["verify_files"](receipt, path)
    anchor, _, inventory = R["predecessors"]()
    _, _, _, prior = R["parent_for"]("replay", Path(receipt["parent"]), receipt["parent_sha256"], anchor)
    require(prior + receipt["seconds"] == receipt["study_chain_seconds"], "final chain time differs")
    started = time.perf_counter()
    def guard():
        require(time.perf_counter() - started < 1500., "1500s audit cap reached")
        require(shutil.disk_usage(ROOT).free >= R["RUN"]["E_RESERVE"] + 8 * 1024**2
                and shutil.disk_usage("C:/").free >= R["RUN"]["C_RESERVE"], "audit disk reserve reached")
    guard()
    directory.mkdir()
    result = {"schema": "nr-k3-schwarzschild-lower-domain-audit-v1", "receipt_sha256": args.receipt_sha256,
        "audit_script_sha256": sha256(Path(__file__)), "audit_completed": False, "errors": [], **{k: False for k in R["FLAGS"]}}
    try:
        result.update(reconstruct(receipt, inventory, guard))
        guard()
        R["verify_files"](receipt, path)
        require(sha256(path) == args.receipt_sha256, "receipt changed during audit")
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter() - started
    R["new_json"](directory / "audit.json", result)
    print(json.dumps(result), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

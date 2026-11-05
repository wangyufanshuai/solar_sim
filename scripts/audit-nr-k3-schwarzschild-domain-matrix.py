"""Read-only full domain-matrix recomputation, including resource-stop lineage.

Independent process, same frozen Python diagnostic definitions: not an external
solver, independently authored Einstein formulation, or physical admission.
"""
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
F = runpy.run_path(str(ROOT/"scripts/finish-nr-k3-schwarzschild-domain-matrix.py"))
D, RUN, W, B = (F[key] for key in ("D", "RUN", "W", "B"))
A = D["ERROR"]["AUDIT"]
require, sha256 = F["require"], F["sha256"]
FLAGS = F["FLAGS"]


def expected_matrix():
    return ({(4, n, .5, 3.5, 1./256, i/8.) for n in (25, 37, 49) for i in range(9)}
            | {(4, 49, .5, 3.5, 1./512, t) for t in (.25, .5, .75, 1.)})


def strip_retained(sample):
    return {key: value for key, value in sample.items() if key != "retained"}


def verify_retained_samples(stopped, receipt):
    old = {s["path"]: strip_retained(s) for s in D["all_samples"](stopped)}
    current = {s["path"]: strip_retained(s) for s in D["all_samples"](receipt)}
    require(len(old) == 29 and len(current) == 31 and old.keys() <= current.keys(), "retained inventory replaced")
    require(all(current[path] == row for path, row in old.items()), "retained numerical evidence changed")
    added = [s for s in D["all_samples"](receipt) if s["path"] not in old]
    require([s["diagnostics"]["time"] for s in added] == [.75, 1.], "only the two missing samples may be added")
    require(receipt["region_comparisons"] == stopped["region_comparisons"]
            and receipt["spatial_assessment"] == stopped["spatial_assessment"]
            and receipt["time_controls"][:2] == stopped["time_controls"], "old decisions or controls changed")


def validate_final(receipt):
    require(receipt["schema"] == F["SCHEMA"] and receipt["stage"] == "replay"
            and receipt["stage_completed"] is True and receipt["study_completed"] is True
            and receipt["errors"] == [], "final complete execution required")
    require(all(receipt[key] is False for key in FLAGS), "unexpected admission")
    require(receipt["retained_window_passed"] is False, "old failed window was regraded")
    require(receipt["resource_predecessor"] == str(F["STOPPED"])
            and receipt["resource_predecessor_sha256"] == F["STOPPED_SHA"]
            and receipt["base_protocol_sha256"] == F["BASE_PROTOCOL_SHA"], "resource lineage identity mismatch")
    require(receipt["base_protocol_sha256"] == sha256(D["PROTOCOL"])
            and receipt["protocol_sha256"] == sha256(F["PROTOCOL"]), "protocol drift")
    require(receipt["stage_passed"] == receipt["study_passed"], "final stage/aggregate verdict mismatch")
    require(len(receipt["commands"]) == 1 and receipt["commands"][0]["label"] == "expanded-n25-serial-t1"
            and receipt["commands"][0]["returncode"] == 0, "exact coarse serial replay command required")


def recompute_groups(receipt):
    expected = D["assess_spatial"](receipt)
    require(receipt["spatial_assessment"] == expected, "spatial assessment changed")
    for key in ("expanded_groups", "region_difference_groups"):
        for group in expected[key]:
            rates, status, passed = A["independent_refinement"](group["values"], 4)
            require((group["orders"], group["status"], group["passed"], group["floor"])
                    == (rates, status, passed, 2.e-12), "independent spatial verdict differs")
    return expected


def verify_resource_accounting(stopped, tail, receipt):
    for value, cap in ((tail, 3000.), (receipt, 800.)):
        require(all(math.isfinite(value[k]) and value[k] >= 0.
                    for k in ("seconds", "prior_stage_seconds", "stage_combined_seconds", "study_chain_seconds")),
                "nonfinite resource accounting")
        require(value["stage_combined_seconds"] == value["seconds"]+value["prior_stage_seconds"] < cap
                and value["study_chain_seconds"] < 7200., "combined execution limit exceeded")
        require(value["c_reserve_bytes"] == RUN["C_RESERVE"] and value["e_reserve_bytes"] == RUN["E_RESERVE"],
                "reserve policy changed")
    require(tail["prior_stage_seconds"] == stopped["seconds"]
            and tail["study_chain_seconds"] == stopped["study_chain_seconds"]+tail["seconds"]
            and receipt["study_chain_seconds"] == tail["study_chain_seconds"]+receipt["seconds"]
            and receipt["prior_stage_seconds"] == 0., "missing or duplicated execution cost")


def audit(receipt, original, stopped, result, budget):
    validate_final(receipt)
    verify_retained_samples(stopped, receipt)
    identities, halos, initial_data, primary = set(), {}, {}, {}
    samples = D["all_samples"](receipt)
    require(len(samples) == len({s["path"] for s in samples}) == 31, "31 distinct paths required")
    rows = {r["n"]: r for r in receipt["study_cases"]}
    require(set(rows) == {25, 37, 49} and len(receipt["study_cases"]) == 3, "three expanded grids required")
    manifests = set()
    for n, row in rows.items():
        saved = row["initial"]
        path = Path(saved["path"])
        seed = D["expanded_seed"](n)
        data = B["read"](path, seed)
        require(data.header == seed.header and data.to_bytes() == seed.to_bytes(), "analytic initial checkpoint changed")
        initial_data[n] = data
        halos[n] = RUN["halo_bytes"](data)
    for index, saved in enumerate(samples, 1):
        budget()
        path = Path(saved["path"])
        require(sha256(path) == saved["sha256"], "checkpoint SHA drift")
        if saved["diagnostics"]["time"] == 0.:
            n = next(n for n, row in rows.items() if row["initial"]["path"] == str(path))
            data = initial_data[n]
        else:
            data = A["load"](path, checksums=True)
            manifests.add(str(path))
        key = A["identity"](data)
        require(key not in identities and key in expected_matrix(), "duplicate/unexpected physical sample")
        identities.add(key)
        require(W["sample"](data, path, retained=saved["retained"]) == saved, "recomputed diagnostic differs: "+str(path))
        require(RUN["halo_bytes"](data) == halos[data.header["points"]], "own fixed halo bytes changed")
        if key[4] == 1./256:
            primary[key[1], key[5]] = path
        if index % 5 == 0 or index == 31:
            print(json.dumps({"audit_samples": index, "total": 31}), flush=True)
    require(identities == expected_matrix(), "physical matrix incomplete")
    result["samples_recomputed"] = len(identities)

    for small, n, shared in zip((17, 25, 33), (25, 37, 49), receipt["shared_initial"], strict=True):
        main = B["read"](W["PARENT"].parent/f"fd4-n{small}-initial.bin", B["seed"](small, 4))
        require(D["shared_initial"](main, initial_data[n]) == shared, "shared initial bounds/byte result changed")
    result["shared_initial_pairs_recomputed"] = 3
    initial_path = Path(receipt["time_initial"]["path"])
    fine_seed = D["expanded_seed"](49, 1./512)
    fine_initial = B["read"](initial_path, fine_seed)
    require(sha256(initial_path) == receipt["time_initial"]["sha256"]
            and fine_initial.to_bytes() == fine_seed.to_bytes()
            and np.asarray(fine_initial.slots).tobytes() == np.asarray(initial_data[49].slots).tobytes(),
            "time initial state identity changed")
    require(RUN["halo_bytes"](fine_initial) == halos[49], "time initial halo changed")

    region = []
    for small, n in ((17, 25), (25, 37), (33, 49)):
        row = next(r for r in original["cases"] if r["order"] == 4 and r["n"] == small)
        for saved in row["samples"]:
            budget()
            path = Path(saved["path"])
            require(sha256(path) == saved["sha256"], "original region state changed")
            main = A["load"](path)
            expanded = A["load"](primary[n, main.header["time"]])
            region.append({"main_n": small, "expanded_n": n, **W["boundary_location_difference"](main, expanded)})
    require(region == receipt["region_comparisons"], "signed domain fields differ")
    result["region_comparisons_recomputed"] = len(region)
    assessment = recompute_groups(receipt)
    result["spatial_groups_recomputed"] = sum(len(assessment[key]) for key in ("expanded_groups", "region_difference_groups"))
    result["failed_expanded_groups"] = [g for g in assessment["expanded_groups"] if not g["passed"]]
    result["failed_region_difference_groups"] = [g for g in assessment["region_difference_groups"] if not g["passed"]]

    controls = []
    for saved in receipt["time_samples"]:
        budget()
        fine = A["load"](Path(saved["path"]))
        if fine.header["time"] != .75:
            controls.append(W["timestep_difference"](A["load"](primary[49, fine.header["time"]]), fine))
    require(controls == receipt["time_controls"], "signed time fields differ")
    result["signed_time_metrics_recomputed"] = sum(len(c["metrics"]) for c in controls)

    replay = receipt["replay_paths"]
    direct, staged = Path(replay["direct"]), Path(replay["staged"])
    require(staged == primary[25, 1.], "replay references wrong staged case")
    data = A["load"](direct, checksums=True)
    manifests.add(str(direct))
    require(A["identity"](data) == (4, 25, .5, 3.5, 1./256, 1.)
            and direct.read_bytes() == staged.read_bytes()
            and direct.with_suffix(".json").read_bytes() == staged.with_suffix(".json").read_bytes(),
            "coarse serial/staged replay differs")
    require(RUN["halo_bytes"](data) == halos[25], "replay halo differs")
    require(D["final_assessment"](receipt) == {"bounded_study": receipt["bounded_study"],
                "study_passed": receipt["study_passed"]}, "final aggregate differs")
    result.update(native_manifest_pairs_rechecked=len(manifests), deterministic_replay_rechecked=True,
                  reproduced_study_passed=receipt["study_passed"], retained_samples_preserved=29,
                  completion_samples_added=2, all_admission_flags_false=True)
    budget()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    path, directory = args.receipt.resolve(), args.output_directory.resolve()
    require(path.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "receipt outside declared evidence")
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh declared E audit child required")
    receipt = RUN["archive"](path, args.receipt_sha256)
    validate_final(receipt)
    original, stopped = F["verify_stop"]()
    tail = F["tail_parent"](Path(receipt["parent"]), receipt["parent_sha256"])
    verify_resource_accounting(stopped, tail, receipt)
    old_bytes = F["directory_bytes"](F["STOPPED"].parent)
    require(tail["prior_stage_bytes"] == old_bytes
            and old_bytes+F["directory_bytes"](Path(receipt["parent"]).parent)+64*1024**2 <= 384*1024**2,
            "retained plus tail output exceeds original capacity limit")
    require(F["directory_bytes"](path.parent)+8*1024**2 <= 32*1024**2, "replay output exceeds original capacity limit")
    started = time.perf_counter()

    def budget():
        require(time.perf_counter()-started < 1200., "1200s full audit cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+8*1024**2, "E audit reserve reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C reserve reached")
        require(F["directory_bytes"](directory) < 8*1024**2, "8MiB audit output cap reached")

    budget()
    directory.mkdir(parents=True)
    shutil.copyfile(__file__, directory/Path(__file__).name)
    result = {"schema": "nr-domain-matrix-independent-process-audit-v1", "receipt": str(path),
        "receipt_sha256": args.receipt_sha256, "audit_script_sha256": sha256(Path(__file__)),
        "resource_predecessor_sha256": F["STOPPED_SHA"], "audit_completed": False, "errors": [],
        **{key: False for key in FLAGS}}
    try:
        audit(copy.deepcopy(receipt), original, stopped, result, budget)
        require(all(sha256(ROOT/n) == digest for n, digest in receipt["source_after"].items()), "source changed during audit")
        require(sha256(path) == args.receipt_sha256 and sha256(F["STOPPED"]) == F["STOPPED_SHA"]
                and sha256(Path(__file__)) == result["audit_script_sha256"], "audit identity changed")
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    RUN["new_json"](directory/"audit.json", result)
    print(json.dumps(result), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Recompute upper-face-only evidence in a separate process, without evolution.

Uses the frozen geometric diagnostics, not an independent external formulation.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-upper-domain.py"))
RUN, W, B, D = (R[k] for k in ("RUN", "W", "B", "D"))
A = D["ERROR"]["AUDIT"]
require, sha256, FLAGS = (R[k] for k in ("require", "sha256", "FLAGS"))


def expected_matrix():
    return ({(4, n, 1., 3.5, 1./256, i/8.) for n in R["SIZES"] for i in range(9)}
            | {(4, 41, 1., 3.5, 1./512, t) for t in (.25, .5, .75, 1.)})


def load(path, *, checksums=False):
    metadata = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
    grid, diagnostic = metadata["grid"], metadata["diagnostics"]
    spec = diagnostic["schwarzschild_domain"]
    domain = B["SchwarzschildDomain"](spec["lower"], spec["upper"], spec["mass"])
    require(domain == R["DOMAIN"], "upper-domain manifest required")
    raw = path.read_bytes()
    data = B["decode_checkpoint"](raw, expected_profile=B["PROFILE"], expected_spatial_order=4,
        expected_tau_inverse=1., expected_domain=domain)
    B["validate_fo_ccz4_cpp_manifest"](metadata, expected_profile=data.profile, expected_spatial_order=4,
        expected_tau_inverse=1., expected_domain=domain, expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
    require(metadata["kernel_version"] == "0.5.0" and grid["shape"] == [data.header["points"]]*3
            and grid["spatial_order"] == 4 and grid["dt"] == data.header["dt"], "native/grid identity mismatch")
    require(all(diagnostic[k] == data.header[k] for k in ("step", "time", "amplitude", "wavelength")),
            "header/manifest mismatch")
    require(data.header["time"] == data.header["dt"]*data.header["step"], "step/time mismatch")
    if checksums:
        B["verify_checksums"](raw, metadata)
    return data


def validate_final(receipt):
    R["verify_stage"](receipt, "replay")
    require(receipt["study_completed"] is True and receipt["stage_passed"] == receipt["study_passed"],
            "final completion/verdict mismatch")
    require(len(receipt["commands"]) == 1 and receipt["commands"][0]["label"] == "upper-n21-serial-t1"
            and receipt["commands"][0]["returncode"] == 0, "exact replay command required")


def recompute_groups(receipt):
    assessment = R["assess_spatial"](receipt)
    require(assessment == receipt["spatial_assessment"], "spatial assessment changed")
    for key in ("upper_groups", "region_difference_groups"):
        for group in assessment[key]:
            rates, status, passed = A["independent_refinement"](group["values"], 4)
            require((rates, status, passed, 2.e-12) == (group["orders"], group["status"], group["passed"], group["floor"]),
                    "independent spatial verdict differs")
    return assessment


def audit(receipt, original, result, budget):
    validate_final(receipt)
    rows = {r["n"]: r for r in receipt["study_cases"]}
    require(set(rows) == set(R["SIZES"]) and len(receipt["study_cases"]) == 3, "three upper grids required")
    samples = R["all_samples"](receipt)
    require(len(samples) == len({s["path"] for s in samples}) == 31, "31 distinct sample paths required")
    initial_data, halos, primary, identities, manifests = {}, {}, {}, set(), set()
    for n, row in rows.items():
        path = Path(row["initial"]["path"])
        seed = R["upper_seed"](n)
        initial_data[n] = B["read"](path, seed)
        require(initial_data[n].to_bytes() == seed.to_bytes(), "analytic initial checkpoint differs")
        halos[n] = RUN["halo_bytes"](initial_data[n])
    for index, saved in enumerate(samples, 1):
        budget()
        path = Path(saved["path"])
        require(sha256(path) == saved["sha256"], "sample SHA drift")
        if saved["diagnostics"]["time"] == 0.:
            n = next(n for n, row in rows.items() if row["initial"]["path"] == str(path))
            data = initial_data[n]
        else:
            data = load(path, checksums=True)
            manifests.add(str(path))
        key = A["identity"](data)
        require(key not in identities and key in expected_matrix(), "unexpected/duplicate physical sample")
        identities.add(key)
        require(W["sample"](data, path, retained=saved["retained"]) == saved, "sample diagnostics differ")
        require(RUN["halo_bytes"](data) == halos[key[1]], "fixed halo bytes changed")
        if key[4] == 1./256:
            primary[key[1], key[5]] = path
        if index % 5 == 0 or index == 31:
            print(json.dumps({"audit_samples": index, "total": 31}), flush=True)
    require(identities == expected_matrix(), "physical sample matrix incomplete")
    result["samples_recomputed"] = len(identities)

    for (small, n), saved in zip(R["PAIRS"], receipt["shared_initial"], strict=True):
        base = B["read"](W["PARENT"].parent/f"fd4-n{small}-initial.bin", B["seed"](small, 4))
        require(R["shared_initial"](base, initial_data[n]) == saved, "shared initial control changed")
    result["shared_initial_pairs_recomputed"] = 3
    seed = R["upper_seed"](41, 1./512)
    path = Path(receipt["time_initial"]["path"])
    fine_initial = B["read"](path, seed)
    require(sha256(path) == receipt["time_initial"]["sha256"] and fine_initial.to_bytes() == seed.to_bytes()
            and np.asarray(fine_initial.slots).tobytes() == np.asarray(initial_data[41].slots).tobytes(),
            "time initial identity differs")

    region = []
    for small, n in R["PAIRS"]:
        row = next(r for r in original["cases"] if r["order"] == 4 and r["n"] == small)
        for saved in row["samples"]:
            budget()
            path = Path(saved["path"])
            require(sha256(path) == saved["sha256"], "original checkpoint changed")
            base = A["load"](path)
            upper = load(primary[n, base.header["time"]])
            region.append({"main_n": small, "upper_n": n, **W["boundary_location_difference"](base, upper)})
    require(region == receipt["region_comparisons"], "signed region comparison differs")
    result["region_comparisons_recomputed"] = len(region)
    groups = recompute_groups(receipt)
    result["spatial_groups_recomputed"] = 30
    result["failed_upper_groups"] = [g for g in groups["upper_groups"] if not g["passed"]]
    result["failed_region_difference_groups"] = [g for g in groups["region_difference_groups"] if not g["passed"]]
    controls = []
    for saved in receipt["time_samples"]:
        budget()
        fine = load(Path(saved["path"]))
        if fine.header["time"] != .75:
            controls.append(W["timestep_difference"](load(primary[41, fine.header["time"]]), fine))
    require(controls == receipt["time_controls"], "signed time comparison differs")
    result["signed_time_metrics_recomputed"] = sum(len(c["metrics"]) for c in controls)

    direct, staged = (Path(receipt["replay_paths"][k]) for k in ("direct", "staged"))
    data = load(direct, checksums=True)
    manifests.add(str(direct))
    require(staged == primary[21, 1.] and A["identity"](data) == (4, 21, 1., 3.5, 1./256, 1.)
            and direct.read_bytes() == staged.read_bytes()
            and direct.with_suffix(".json").read_bytes() == staged.with_suffix(".json").read_bytes(), "replay differs")
    require(RUN["halo_bytes"](data) == halos[21], "replay halo differs")
    require(R["final_assessment"](receipt) == {"bounded_study": receipt["bounded_study"],
                "study_passed": receipt["study_passed"]}, "aggregate verdict differs")
    result.update(native_manifest_pairs_rechecked=len(manifests), deterministic_replay_rechecked=True,
                  reproduced_study_passed=receipt["study_passed"], all_admission_flags_false=True)
    budget()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    path, directory = args.receipt.resolve(), args.output_directory.resolve()
    require(path.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "receipt outside E evidence")
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh E audit child required")
    receipt = RUN["archive"](path, args.receipt_sha256)
    validate_final(receipt)
    original, anchor = R["predecessors"]()
    _, _, _, prior = R["parent_for"]("replay", Path(receipt["parent"]), receipt["parent_sha256"], anchor)
    require(receipt["study_chain_seconds"] == prior+receipt["seconds"], "final time accounting differs")
    started = time.perf_counter()

    def budget():
        require(time.perf_counter()-started < 1200., "1200s upper audit cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]+8*1024**2, "E audit reserve reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C audit reserve reached")
        require(sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) < 8*1024**2, "audit output cap reached")

    budget()
    directory.mkdir(parents=True)
    shutil.copyfile(__file__, directory/Path(__file__).name)
    result = {"schema": "nr-upper-domain-independent-process-audit-v1", "receipt": str(path),
        "receipt_sha256": args.receipt_sha256, "audit_script_sha256": sha256(Path(__file__)),
        "audit_completed": False, "errors": [], **{key: False for key in FLAGS}}
    try:
        audit(receipt, original, result, budget)
        require(all(sha256(ROOT/n) == digest for n, digest in receipt["source_after"].items()), "source changed during audit")
        require(sha256(path) == args.receipt_sha256 and sha256(Path(__file__)) == result["audit_script_sha256"], "audit identity drift")
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    RUN["new_json"](directory/"audit.json", result)
    print(json.dumps(result), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

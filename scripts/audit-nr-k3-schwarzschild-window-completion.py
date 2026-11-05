"""Recompute a completed Schwarzschild window without evolving or regrading it.

The geometry/constraint audit is independent of the native RHS auxiliary fields.
This uses the frozen Python diagnostic definitions in a fresh process; it is not
a second independent formulation, an external code comparison or physical admission.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RUN = runpy.run_path(str(ROOT/"scripts/run-nr-k3-schwarzschild-window-completion.py"))
W, B = RUN["WINDOW"], RUN["BASE"]
require, sha256 = RUN["require"], RUN["sha256"]
FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback")


def identity(data):
    return (data.header["spatial_order"], data.header["points"], data.domain.lower,
            data.domain.upper, data.header["dt"], data.header["time"])


def expected_matrix():
    rows = {(o, n, 1., 3., 1./256, t) for o in (2, 4) for n in (17, 25, 33) for t in W["TIMES"]}
    rows |= {(2, 33, 1., 3., 1./256, t) for t in (.375, .625, .75, .875)}
    rows |= {(4, n, 1., 3., 1./256, t) for n in (17, 25, 33) for t in (.375, .625, .75, .875)}
    rows |= {(4, 25, .5, 3.5, 1./256, i/8.) for i in range(1, 9)}
    rows |= {(4, 33, 1., 3., 1./512, i/16.) for i in range(3, 17)}
    return rows


def independent_refinement(values, order):
    require(len(values) == 3 and order in (2, 4) and all(math.isfinite(v) and v >= 0 for v in values),
            "invalid refinement input")
    if max(values) <= 2.e-12:
        return None, "bounded-null", True
    if min(values) <= 2.e-12:
        return None, "floor-limited", False
    rates = [math.log(values[0]/values[1])/math.log(1.5),
             math.log(values[1]/values[2])/math.log(4./3)]
    return rates, "measured", min(rates) >= (1.5 if order == 2 else 3.)


def load(path, *, checksums=False):
    metadata = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
    grid, diagnostic = metadata["grid"], metadata["diagnostics"]
    spec = diagnostic["schwarzschild_domain"]
    domain = B["SchwarzschildDomain"](spec["lower"], spec["upper"], spec["mass"])
    require((domain.lower, domain.upper) in ((1., 3.), (.5, 3.5)) and domain.mass == 1., "unexpected domain")
    raw = path.read_bytes()
    data = B["decode_checkpoint"](raw, expected_profile=B["PROFILE"], expected_spatial_order=grid["spatial_order"],
        expected_tau_inverse=1., expected_domain=domain)
    B["validate_fo_ccz4_cpp_manifest"](metadata, expected_profile=data.profile,
        expected_spatial_order=data.header["spatial_order"], expected_tau_inverse=1., expected_domain=domain,
        expected_solver_mode="fo-ccz4-rhs-shadow-rk4")
    require(metadata["kernel_version"] == "0.5.0" and grid["shape"] == [data.header["points"]]*3
            and grid["dt"] == data.header["dt"], "native/grid identity mismatch")
    require(all(diagnostic[k] == data.header[k] for k in ("step", "time", "amplitude", "wavelength")),
            "header/manifest mismatch")
    require(data.header["time"] == data.header["dt"]*data.header["step"], "step/time mismatch")
    if checksums:
        B["verify_checksums"](raw, metadata)
    return data


def audit(receipt, result, check_budget):
    values = RUN["observations"](receipt)
    require(len(values) == 62 and len({s["path"] for s in values}) == 62, "sample count/path mismatch")
    require(receipt["completed"] and receipt["stage_completed"] and not receipt["errors"], "unfinished execution")
    require(all(receipt[k] is False for k in FLAGS), "unexpected promotion")
    identities, halos = set(), {}
    for index, saved in enumerate(values, 1):
        check_budget()
        path = Path(saved["path"])
        data = load(path, checksums=True)
        key = identity(data)
        require(key not in identities, "duplicate physical sample")
        identities.add(key)
        require(W["sample"](data, path, retained=saved["retained"]) == saved, "saved diagnostic mismatch: "+str(path))
        halo_key = key[:4]
        if halo_key not in halos:
            if data.domain.lower == .5:
                initial_path = Path(receipt["parent"]).parent/"expanded-initial.bin"
            else:
                initial_path = W["PARENT"].parent/f"fd{key[0]}-n{key[1]}-initial.bin"
            initial = B["read"](initial_path, data)
            halos[halo_key] = RUN["halo_bytes"](initial)
        require(RUN["halo_bytes"](data) == halos[halo_key], "fixed halo byte drift")
        if index % 5 == 0 or index == 62:
            print(json.dumps({"audit_samples": index, "total": 62}), flush=True)
    require(identities == expected_matrix(), "physical sample matrix differs")
    result["samples_recomputed"] = len(identities)
    require(W["assess"](receipt["cases"]) == receipt["assessment"], "assessment mismatch")
    lookup = {(row["order"], row["n"]): row for row in receipt["cases"]}
    for group in receipt["assessment"]["groups"]:
        i = list(W["TIMES"]).index(group["time"])
        norms = [lookup[group["spatial_order"], n]["samples"][i]["diagnostics"]["core"][group["metric"]]["l2"]
                 for n in (17, 25, 33)]
        rates, status, passed = independent_refinement(norms, group["spatial_order"])
        require((norms, rates, status, passed) == (group["values"], group["orders"], group["status"], group["passed"]),
                "independent refinement verdict mismatch")
    result["refinement_groups_recomputed"] = len(receipt["assessment"]["groups"])
    result["failed_refinement_groups"] = [g for g in receipt["assessment"]["groups"] if not g["passed"]]
    primary = {(row["n"], s["diagnostics"]["time"]): Path(s["path"])
               for row in receipt["cases"] if row["order"] == 4 for s in row["samples"]}
    for saved, comparison in zip(receipt["expanded_samples"], receipt["boundary_comparisons"], strict=True):
        data = load(Path(saved["path"]))
        base = load(primary[17, data.header["time"]])
        require(W["boundary_location_difference"](base, data) == comparison, "boundary comparison mismatch")
    result["boundary_comparisons_recomputed"] = len(receipt["boundary_comparisons"])
    original = B["read"](W["PARENT"].parent/"fd4-n17-initial.bin", B["seed"](17, 4))
    expanded = B["read"](Path(receipt["parent"]).parent/"expanded-initial.bin", W["expanded_seed"]())
    require(np.asarray(original.slots, dtype="<f8").tobytes() ==
            np.ascontiguousarray(np.asarray(expanded.slots)[:, 4:21, 4:21, 4:21], dtype="<f8").tobytes(),
            "initial shared bytes changed")
    for saved, control in zip(receipt["time_samples"], receipt["time_controls"], strict=True):
        fine = load(Path(saved["path"]))
        require(W["timestep_difference"](load(primary[33, fine.header["time"]]), fine) == control,
                "signed timestep difference mismatch")
    result["signed_time_metrics_recomputed"] = sum(len(c["metrics"]) for c in receipt["time_controls"])
    replay = receipt["replay_paths"]
    direct, staged = Path(replay["direct"]), Path(replay["staged"])
    load(direct, checksums=True)
    require(direct.read_bytes() == staged.read_bytes() and
            direct.with_suffix(".json").read_bytes() == staged.with_suffix(".json").read_bytes(),
            "serial/staged byte replay mismatch")
    require(RUN["full_assessment"](receipt) == {"bounded_window": receipt["bounded_window"],
                                              "window_passed": receipt["window_passed"]}, "final gate mismatch")
    result.update(deterministic_replay_rechecked=True, manifests_and_checksums_rechecked=63,
                  reproduced_window_passed=receipt["window_passed"],
                  max_active_error=max(s["diagnostics"]["all_active_state_error"]["linf"] for s in values))
    check_budget()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    path, directory = args.receipt.resolve(), args.output_directory.resolve()
    require(path.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()), "receipt outside declared evidence root")
    require(directory.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) and directory != RUN["EVIDENCE_ROOT"].resolve()
            and not directory.exists(), "fresh child audit directory required")
    receipt = RUN["archive"](path, args.receipt_sha256)
    RUN["lineage"]("replay", Path(receipt["parent"]), receipt["parent_sha256"])
    require(receipt["stage"] == "replay" and receipt["schema"] == RUN["SCHEMA"], "final replay receipt required")
    started = time.perf_counter()

    def budget():
        require(time.perf_counter()-started < 1200., "1200s read-only audit cap")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"], "E reserve reached")
        require(shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "C reserve reached")

    budget()
    directory.mkdir(parents=True)
    shutil.copyfile(__file__, directory/Path(__file__).name)
    result = {"schema": "nr-schwarzschild-window-independent-process-audit-v1", "receipt": str(path),
              "receipt_sha256": args.receipt_sha256, "audit_script_sha256": sha256(Path(__file__)),
              "audit_completed": False, "errors": [], **{k: False for k in FLAGS}}
    try:
        audit(receipt, result, budget)
        require(all(sha256(ROOT/n) == h for n, h in receipt["source_after"].items()), "source changed during audit")
        require(sha256(path) == args.receipt_sha256 and sha256(Path(__file__)) == result["audit_script_sha256"],
                "audit identity changed")
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    RUN["new_json"](directory/"audit.json", result)
    print(json.dumps(result), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

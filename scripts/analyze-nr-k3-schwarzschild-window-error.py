"""Post-hoc signed error decomposition; no evolution, new gate or regrading.

F_h(q(t))-F_exact = [F_h(q(0))-F_exact] + [F_h(q(t))-F_h(q(0))].
The second term is an evolution-induced diagnostic change, not a separately
identified boundary, temporal or continuum-physics error. RMS is coordinate
component RMS on the same frozen 125 points, not a proper-volume tensor norm.
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
AUDIT = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-schwarzschild-window-completion.py"))
RUN, W, B = (AUDIT[k] for k in ("RUN", "W", "B"))
require, sha256 = RUN["require"], RUN["sha256"]
from science.numerical_relativity.fo_ccz4_exterior_window import audit_fields, core_values  # noqa: E402


def decompose(total, initial):
    total, initial = np.asarray(total, dtype=float), np.asarray(initial, dtype=float)
    require(total.shape == initial.shape and total.size > 0
            and np.all(np.isfinite(total)) and np.all(np.isfinite(initial)), "matched finite nonempty fields required")
    delta = total-initial
    norms2 = [float(np.mean(x*x)) for x in (total, initial, delta)]
    cross = float(2.*np.mean(initial*delta))
    require(np.all(np.isfinite(norms2+[cross])), "nonfinite squared norm")
    closure = norms2[0]-norms2[1]-norms2[2]-cross
    tolerance = 64.*np.finfo(float).eps*max(norms2)
    require(abs(closure) <= tolerance, "quadratic identity failed")
    cosine = cross/(2.*np.sqrt(norms2[1]*norms2[2])) if norms2[1]*norms2[2] > 0. else None
    return {"total_rms": np.sqrt(norms2[0]), "initial_discrete_rms": np.sqrt(norms2[1]),
            "evolution_change_rms": np.sqrt(norms2[2]), "twice_signed_inner_product": cross,
            "alignment_cosine": cosine, "squared_norm_closure": closure,
            "evolution_to_initial_ratio": np.sqrt(norms2[2]/norms2[1]) if norms2[1] > 0. else None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--receipt-sha256", required=True)
    parser.add_argument("--audit", required=True, type=Path)
    parser.add_argument("--audit-sha256", required=True)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    path, directory, audit_path = args.receipt.resolve(), args.output_directory.resolve(), args.audit.resolve()
    require(all(p.is_relative_to(RUN["EVIDENCE_ROOT"].resolve()) for p in (path, directory, audit_path))
            and not directory.exists(), "fresh declared E output and retained inputs required")
    receipt = RUN["archive"](path, args.receipt_sha256)
    RUN["lineage"]("replay", Path(receipt["parent"]), receipt["parent_sha256"])
    require(sha256(audit_path) == args.audit_sha256, "audit identity mismatch")
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    require(audit["audit_completed"] and not audit["errors"]
            and audit["receipt_sha256"] == args.receipt_sha256
            and audit["reproduced_window_passed"] == receipt["window_passed"], "completed matching audit required")
    started = time.perf_counter()

    def budget():
        require(time.perf_counter()-started < 120., "120s analysis cap reached")
        require(shutil.disk_usage(ROOT).free >= RUN["E_RESERVE"]
                and shutil.disk_usage(RUN["ANCHOR"].parent).free >= RUN["C_RESERVE"], "disk reserve reached")

    budget()
    directory.mkdir(parents=True)
    shutil.copyfile(__file__, directory/Path(__file__).name)
    result = {"schema": "nr-schwarzschild-posthoc-signed-error-v1", "exploratory_posthoc": True,
              "receipt": str(path), "receipt_sha256": args.receipt_sha256,
              "audit_sha256": args.audit_sha256, "script_sha256": sha256(Path(__file__)),
              "completed": False, "retained_window_passed": receipt["window_passed"],
              "scientificPayloadWriteback": False, "input_checkpoint_hashes": {}, "rows": [], "errors": []}
    try:
        for row in receipt["cases"]:
            if row["order"] != 4:
                continue
            budget()
            initial_path = W["PARENT"].parent/f"fd4-n{row['n']}-initial.bin"
            result["input_checkpoint_hashes"][str(initial_path)] = sha256(initial_path)
            initial = B["read"](initial_path, B["seed"](row["n"], 4))
            baseline, grid = audit_fields(initial)
            for saved in row["samples"]:
                if saved["diagnostics"]["time"] not in (.5, 1.):
                    continue
                budget()
                file = Path(saved["path"])
                require(sha256(file) == saved["sha256"], "sample drift")
                result["input_checkpoint_hashes"][str(file)] = saved["sha256"]
                fields, other_grid = audit_fields(AUDIT["load"](file))
                require(grid == other_grid, "diagnostic grids differ")
                for metric in ("H", "ricci_error"):
                    value = decompose(core_values(fields[metric], grid), core_values(baseline[metric], grid))
                    require(value["total_rms"] == saved["diagnostics"]["core"][metric]["l2"], "RMS drift")
                    result["rows"].append({"n": row["n"], "time": saved["diagnostics"]["time"],
                                           "metric": metric, **value})
        budget()
        require(len(result["rows"]) == 12 and sha256(path) == args.receipt_sha256
                and sha256(Path(__file__)) == result["script_sha256"], "analysis identity/coverage drift")
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    RUN["new_json"](directory/"analysis.json", result)
    print(json.dumps(result), flush=True)
    return 0 if result["completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

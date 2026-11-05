"""One explicitly confirmed N9 scientific batch; no retries or other grids."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_n9_campaign as S  # noqa: E402
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube  # noqa: E402
from science.numerical_relativity.nr3d import Grid3D  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--entry-test-gate", type=Path, required=True)
    parser.add_argument(
        "--confirm-fixed-n9-experiment",
        action="store_true",
        help="Only after separate human approval of N9 14/28/56 steps under the fixed budget.",
    )
    args = parser.parse_args()
    N.require(
        args.confirm_fixed_n9_experiment, "explicit fixed N9 confirmation required"
    )
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct N9 scientific directory required",
    )
    budget = N.Budget(directory)
    started = time.monotonic()
    tests = S.entry_qualification(args.entry_test_gate)
    sources = S.source_closure()
    plan, binding, initial, reference = S.prepare(sources, tests)
    directory.mkdir()
    result = S.new_receipt(plan, sources)
    try:
        S.save_registration(budget, plan, binding, initial, reference, sources)
        result["snapshot_completed"] = True
        mesh = Grid3D(
            (9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
        )
        driver = NonlinearSBPCube(mesh)
        measurement = runpy.run_path(str(ROOT / "scripts/run-nr-k3-projected-rk.py"))
        ends = S.evolve_cases(
            budget,
            result,
            mesh,
            initial,
            reference,
            binding,
            lambda q: measurement["measured"](driver, q, reference),
        )
        result["temporal_screen"] = S.temporal_screen(ends, driver, measurement["R"])
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    for name in sources:
        try:
            result["source_after"][name] = N.sha(N.contained(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source:{name}: {error}")
    try:
        N.require(
            result["source_after"] == sources, "scientific source identity changed"
        )
        N.require(
            N.native_identity()[0] == result["native_identity"],
            "native identity changed",
        )
        N.require(
            S.entry_qualification(args.entry_test_gate) == tests,
            "entry qualification changed",
        )
        budget.guard()
    except Exception as error:
        result["errors"].append(str(error))
    result["completed"] = bool(result["completed"] and not result["errors"])
    result["temporal_screen_passed"] = bool(
        result["completed"]
        and result["temporal_screen"]
        and result["temporal_screen"]["passed"]
    )
    result["counts"] = S.counts(result["cases"])
    result["seconds"] = time.monotonic() - started
    result["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): N.sha(p)
        for p in sorted(directory.rglob("*"))
        if p.is_file()
    }
    budget.record("receipt.json", result, finalizing=True)
    print(
        json.dumps(
            {
                k: result[k]
                for k in (
                    "completed",
                    "temporal_screen_passed",
                    "counts",
                    "seconds",
                    "errors",
                )
            }
        ),
        flush=True,
    )
    return 0 if result["completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

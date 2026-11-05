"""One fixed parent-to-T=1/8 native scientific continuation, no automatic retry."""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import runpy
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_continuation as C  # noqa: E402
from science.numerical_relativity import native_continuation_campaign as F  # noqa: E402
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube  # noqa: E402
from science.numerical_relativity.nr3d import Grid3D  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--entry-test-gate", type=Path, required=True)
    parser.add_argument(
        "--confirm-fixed-experiment",
        action="store_true",
        help="Use only after human confirmation of the fixed continuation experiment.",
    )
    args = parser.parse_args()
    N.require(
        args.confirm_fixed_experiment, "explicit fixed-experiment confirmation required"
    )
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct scientific evidence directory required",
    )
    budget = N.Budget(directory)
    started = time.monotonic()
    component = F.component_qualification()
    parent_check = C.verify_parent("gauge-pulse-v2")
    tests = F.entry_qualification(args.entry_test_gate)
    sources = F.source_closure()
    plan, binding, initial, reference = F.prepare(sources, component, tests)
    N.require(
        plan["worst_case_bytes"] <= N.OUTPUT_CAP,
        "complete prospective bound exceeds original budget",
    )
    directory.mkdir()
    result = dict(
        schema="nr-native-gauge-continuation-v1",
        completed=False,
        errors=[],
        fixture_kind=None,
        source_before=sources,
        source_after={},
        cases=copy.deepcopy(plan["case_matrix"]),
        component_qualification=component,
        entry_qualification=tests,
        parent_check=parent_check,
        parent_dependencies=plan["parent_dependencies"],
        parent_self_contained=False,
        native_identity=plan["native_identity"],
        resource_caps=F.CAPS,
        worst_case_bytes=plan["worst_case_bytes"],
        snapshot_completed=False,
        global_plan="global-plan.json",
        global_plan_sha256=N.codec.sha(N.json_bytes(plan)),
        temporal_screen=None,
        temporal_screen_passed=False,
        counts=F.counts(plan["case_matrix"]),
        **F.FALSE_FLAGS,
    )
    try:
        F.save_registration(budget, plan, binding, initial, reference, sources)
        result["snapshot_completed"] = True
        driver = NonlinearSBPCube(
            Grid3D(
                (13,) * 3,
                (1.0,) * 3,
                (3.0,) * 3,
                boundary="sbp-volume",
                spatial_order=4,
            )
        )
        measurement = runpy.run_path(str(ROOT / "scripts/run-nr-k3-projected-rk.py"))
        ends = F.evolve_cases(
            budget,
            result,
            reference,
            binding,
            lambda q: measurement["measured"](driver, q, reference),
        )
        result["temporal_screen"] = F.temporal_screen(
            ends, result["cases"], driver, measurement["R"]
        )
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    for name in sources:
        try:
            result["source_after"][name] = N.sha(N.contained(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source:{name}: {error}")
    if result["source_after"] != sources:
        result["errors"].append("source identity changed")
    try:
        N.require(
            N.native_identity()[0] == result["native_identity"],
            "native runtime changed",
        )
        N.require(
            F.component_qualification() == component, "component qualification changed"
        )
        N.require(
            F.entry_qualification(args.entry_test_gate) == tests,
            "entry qualification changed",
        )
        N.require(
            C.verify_parent("gauge-pulse-v2") == parent_check,
            "external parent evidence changed",
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
    result["counts"] = F.counts(result["cases"])
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

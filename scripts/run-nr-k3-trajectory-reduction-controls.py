"""Bounded controls and saved N13 budget audit; no native call or evolution."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_continuation_campaign as F  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-discrete-reduction-controls-v1-20261011"
PARENT_SHA = "4d9d878631a32e3a10f148d14cf50fcc4daea823d9917a6a9a741800282b215b"
EXTRA = (
    "science/numerical_relativity/trajectory_reduction_balance.py",
    "science/numerical_relativity/EXPERIMENT-20261011-trajectory-reduction.md",
    "scripts/tests/test_nr_trajectory_reduction.py",
    "scripts/nr-trajectory-reduction-tests.ini",
    "scripts/run-nr-k3-trajectory-reduction-controls.py",
)
FALSE_FLAGS = (
    "boundary_residual_independently_recomputed",
    "independent_einstein_rhs_validated",
    "nonlinear_constraint_stability_validated",
    "new_scientific_evolution",
    "full_scientific_matrix_executed",
    "old_failure_regraded",
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
)


def predecessor():
    return runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-discrete-reduction-controls.py")
    )


def volume_identity():
    return predecessor()["volume_identity"]()


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "parent qualification changed",
    )
    parent = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        parent["completed"] is parent["passed"] is True and not parent["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 82, "scripts.tests.test_nr_discrete_reduction")
    F.check_xml(
        PARENT / "formal-python-regression.xml",
        68,
        "scripts.tests.test_nr_formal_fo_geometry",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 449
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified449 identity required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot changed",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive source files required")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def validate_analysis(directory):
    result = json.loads((directory / "trajectory-reduction-result.json").read_text())
    N.require(
        result["method"] == T.METHOD and result["completed"] is True,
        "complete saved-data analysis required",
    )
    N.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["native_calls"] == 0,
        "narrow saved-data scope required",
    )
    N.require(
        result["parent_receipt_sha256"] == T.RECEIPT_SHA
        and result["parent_audit_sha256"] == T.AUDIT_SHA,
        "pinned trajectory required",
    )
    N.require(
        result["steps"] == 49 and result["stages"] == 196 and len(result["cases"]) == 3,
        "complete49/196 audit required",
    )
    for name in (
        "max_stage_error",
        "max_step_error",
        "max_endpoint_norm_error",
        "max_base_residual",
        "max_interior_auxiliary_residual",
    ):
        N.require(
            0 <= result[name] <= T.TOLERANCE,
            "saved-data residual exceeds original tolerance",
        )
    op = T.D.DenseSBP((13,) * 3, (1 / 6,) * 3)
    expected_records = set()
    max_array_error = 0.0
    max_norm_error = 0.0
    for count, case in zip((7, 14, 28), result["cases"], strict=True):
        label = f"native-gauge-continuation-13-{count}"
        N.require(
            case["label"] == label
            and case["dt"] == 1 / (16 * count)
            and case["start_time"] == 1 / 16
            and case["end_time"] == 1 / 8
            and case["stage_count"] == 4 * count
            and [s["step"] for s in case["steps"]] == list(range(count, 2 * count)),
            "fixed case coverage changed",
        )
        N.require(
            json.loads((directory / f"cases/{label}.json").read_text()) == case,
            "case copy mismatch",
        )
        N.require(
            0 <= case["maximum_cumulative_error"] <= T.TOLERANCE, "case closure failed"
        )
        for step in case["steps"]:
            N.require(
                all(0 <= x <= T.TOLERANCE for x in step["errors"].values())
                and 0 <= step["cumulative_error"] <= T.TOLERANCE,
                "step closure failed",
            )
            for s, offset in enumerate((0, 1, 1, 2), 1):
                name = f"{label}-{step['step']:04d}-{s}.json"
                expected_records.add(name)
                row = json.loads((directory / "stages" / name).read_text())
                N.require(
                    (
                        row["case"],
                        row["step"],
                        row["stage"],
                        row["boundary_tick"],
                        row["time"],
                    )
                    == (
                        label,
                        step["step"],
                        s,
                        2 * step["step"] + offset,
                        (2 * step["step"] + offset) * case["dt"] / 2,
                    ),
                    "saved stage identity mismatch",
                )
                for key in (
                    "balance_error",
                    "base_residual_max",
                    "interior_auxiliary_residual_max",
                ):
                    N.require(0 <= row[key] <= T.TOLERANCE, "stage residual failed")
                N.require(
                    set(row["part_norms"]) == set(T.PARTS),
                    "three separated terms required",
                )
                for regions in row["part_norms"].values():
                    N.require(
                        set(regions) == set(T.masks(op.shape)), "five regions required"
                    )
                    for norms in regions.values():
                        N.require(
                            set(norms) == set(T.D.FAMILIES)
                            and all(
                                type(v) is float and np.isfinite(v) and v >= 0
                                for v in norms.values()
                            ),
                            "finite family norms required",
                        )
        arrays = {
            key: np.load(directory / f"budgets/{label}-{key}.npy", allow_pickle=False)
            for key in ("initial_defects", "final_defects", "delta", *T.PARTS)
        }
        for value in arrays.values():
            N.require(
                value.shape == (33, 13, 13, 13)
                and value.dtype == np.float64
                and np.isfinite(value).all(),
                "complete saved33 array required",
            )
        N.require(
            np.array_equal(
                arrays["final_defects"] - arrays["initial_defects"], arrays["delta"]
            ),
            "saved endpoint delta changed",
        )
        error = float(
            np.max(abs(arrays["delta"] - sum(arrays[key] for key in T.PARTS)))
        )
        N.require(error <= T.TOLERANCE, "saved whole-interval arrays do not close")
        max_array_error = max(max_array_error, error)
        for key, saved in (
            ("initial_defects", case["initial_norms"]),
            ("final_defects", case["final_norms"]),
            ("delta", case["delta_norms"]),
            *((key, case["integrated_norms"][key]) for key in T.PARTS),
        ):
            actual = T.norms(arrays[key], op)
            error = max(
                abs(v - saved[region][family])
                for region, row in actual.items()
                for family, v in row.items()
            )
            N.require(error <= T.TOLERANCE, "persisted field norm mismatch")
            max_norm_error = max(max_norm_error, error)
    N.require(
        {p.name for p in (directory / "stages").iterdir()} == expected_records,
        "exact196 stage records required",
    )
    return dict(
        steps=49,
        stages=196,
        cases=3,
        saved_array_closure_error=max_array_error,
        saved_norm_error=max_norm_error,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct evidence directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    directory.mkdir()
    started, child, sources = time.monotonic(), None, {}
    result = dict(
        schema="nr-trajectory-reduction-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        parent_gate_sha256=PARENT_SHA,
        source_before={},
        source_after={},
        native_before={},
        native_after={},
        suites=[],
        tests=0,
        regression_tests=0,
        native_calls=0,
        saved_reduction_budget_consistent=False,
        boundary_residual_localized=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{k: False for k in FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    try:
        sources = qualified_sources()
        result["source_before"] = sources
        result["native_before"] = volume_identity()
        budget.record("native-identity-before.json", result["native_before"])
        N.save_source_snapshot(budget, sources)
        environment = dict(
            os.environ,
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            PYTHONDONTWRITEBYTECODE="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(directory),
            TMP=str(directory),
            NR_TRAJECTORY_ANALYSIS_ROOT=str(directory),
        )
        for name in (
            "NR_INITIAL_ADM_CONTROL_ROOT",
            "NR_CONTINUUM_ADM_CONTROL_ROOT",
            "NR_NONZERO_Z4_CONTROL_ROOT",
            "NR_REDUCTION_CONTROL_ROOT",
            "NR_FORMAL_CONTROL_ROOT",
            "NR_DISCRETE_CONTROL_ROOT",
        ):
            environment.pop(name, None)
        phases = []
        for phase, count, script, selection in (
            ("tests", 65, "scripts/tests/test_nr_trajectory_reduction.py", []),
            (
                "discrete-python-regression",
                79,
                "scripts/tests/test_nr_discrete_reduction.py",
                ["-k", "not native_semidiscrete_all33"],
            ),
        ):
            command = [
                sys.executable,
                "-B",
                "-m",
                "pytest",
                "-q",
                "--maxfail=1",
                "--rootdir",
                str(ROOT),
                "--confcutdir",
                str(ROOT / "scripts/tests"),
                "-c",
                str(ROOT / "scripts/nr-trajectory-reduction-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
                *selection,
            ]
            phases.append((phase, count, script, selection, command))
        phases.append(
            (
                "saved-analysis",
                0,
                "",
                [],
                [
                    sys.executable,
                    "-B",
                    "-m",
                    "science.numerical_relativity.trajectory_reduction_balance",
                    "--output-directory",
                    str(directory),
                    "--deadline",
                    str(budget.deadline),
                ],
            )
        )
        for phase, count, script, selection, command in phases:
            budget.guard()
            row = dict(
                phase=phase,
                command=command,
                expected_tests=count,
                tests=0,
                returncode=None,
                selection=selection,
            )
            result["suites"].append(row)
            with (directory / (phase + ".log")).open("xb") as log:
                child = subprocess.Popen(
                    command,
                    cwd=ROOT,
                    env=environment,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
                budget.record(
                    phase + "-process.json",
                    dict(pid=child.pid, owned=True, retries=0, command=command),
                )
                print(
                    json.dumps(
                        dict(
                            status="trajectory-reduction-controls-running",
                            phase=phase,
                            pid=child.pid,
                        )
                    ),
                    flush=True,
                )
                while child.poll() is None:
                    budget.guard()
                    time.sleep(0.5)
                row["returncode"] = child.returncode
            budget.guard()
            N.require(child.returncode == 0, phase + " failed; no automatic retry")
            if count:
                F.check_xml(
                    directory / (phase + ".xml"), count, script[:-3].replace("/", ".")
                )
                row.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
                result["tests" if phase == "tests" else "regression_tests"] = count
        result["saved_array_audit"] = validate_analysis(directory)
        N.require(qualified_sources() == sources, "qualified source drift")
        result["native_after"] = volume_identity()
        N.require(
            result["native_after"] == result["native_before"], "native identity drift"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            analysis_sha256=N.sha(directory / "trajectory-reduction-result.json"),
        )
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if child is not None and child.poll() is None:
            print(
                json.dumps(dict(status="stopping-owned-controls", reason=str(error))),
                flush=True,
            )
            runpy.run_path(
                str(ROOT / "scripts/run-nr-k3-native-continuation-controls.py")
            )["stop_owned"](child)
            result["stopped_child_returncode"] = child.returncode
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in sources
        }
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["saved_reduction_budget_consistent"] = result["passed"]
        result["boundary_residual_localized"] = result["passed"]
        result["artifact_hashes"] = {
            p.relative_to(directory).as_posix(): N.sha(p)
            for p in sorted(directory.rglob("*"))
            if p.is_file()
        }
        budget.record("qualification-gate.json", result, finalizing=True)
    print(
        json.dumps(
            {
                k: result[k]
                for k in (
                    "completed",
                    "passed",
                    "tests",
                    "regression_tests",
                    "native_calls",
                    "seconds",
                    "errors",
                )
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

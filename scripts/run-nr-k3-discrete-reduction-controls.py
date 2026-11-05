"""Bounded semidiscrete33 controls; no positive-time or full scientific batch."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_continuation_campaign as F  # noqa: E402
from science.numerical_relativity import discrete_reduction_balance as D  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-formal-profile-controls-v1-20261011"
PARENT_SHA = "042729bd6d603d50f43daf10875fb30295ee773b58bf4a2c579b980486f3e48c"
EXTRA = (
    "science/numerical_relativity/discrete_reduction_balance.py",
    "science/numerical_relativity/EXPERIMENT-20261011-discrete-reduction.md",
    "scripts/tests/test_nr_discrete_reduction.py",
    "scripts/nr-discrete-reduction-tests.ini",
    "scripts/run-nr-k3-discrete-reduction-controls.py",
)


def predecessor():
    return runpy.run_path(str(ROOT / "scripts/run-nr-k3-formal-profile-controls.py"))


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
    F.check_xml(PARENT / "tests.xml", 74, "scripts.tests.test_nr_formal_fo_geometry")
    F.check_xml(
        PARENT / "reduction-python-regression.xml",
        66,
        "scripts.tests.test_nr_reduction_balance",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 444
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified444 identity required",
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


def validate_observations(obs):
    N.require(
        obs["method"] == D.METHOD
        and obs["new_scientific_evolution"] is False
        and obs["independent_einstein_rhs_validated"] is False,
        "narrow diagnostic scope required",
    )
    rows = obs["python_cases"]
    N.require(
        len(rows) == 18
        and {(r["n"], r["tau"], r["sign"]) for r in rows}
        == {
            (n, t, s) for n in (9, 13, 17) for t in (0.0, 1.0, 2.0) for s in (-1.0, 1.0)
        },
        "complete18 Python cases required",
    )
    for row in [*rows, *obs["native_cases"]]:
        for key in ("base_error", "auxiliary_error", "balance_error"):
            N.require(0 <= row[key] <= D.TOLERANCE, "discrete identity mismatch")
        N.require(
            set(row["chain_peaks"]) == set(D.FAMILIES)
            and all(x > 2e-13 for x in row["chain_peaks"].values()),
            "resolved four-family chain defect required",
        )
    for row in rows:
        N.require(
            len(row["per_slot_errors"]) == 33
            and all(0 <= x <= D.TOLERANCE for x in row["per_slot_errors"]),
            "all33 Python slots required",
        )
    refinements = obs["refinement"]
    N.require(
        len(refinements) == 2 and {r["sign"] for r in refinements} == {-1.0, 1.0},
        "two refinement signs required",
    )
    for row in refinements:
        N.require(
            [x["n"] for x in row["levels"]] == [9, 17, 33],
            "fixed static levels required",
        )
        expected = {
            (a, b, region, family)
            for a, b in ((9, 17), (17, 33))
            for region in ("whole", "center")
            for family in D.FAMILIES
        }
        comparisons = row["comparisons"]
        N.require(
            len(comparisons) == 16
            and {
                (x["coarse"], x["fine"], x["region"], x["family"]) for x in comparisons
            }
            == expected,
            "complete refinement comparisons required",
        )
        levels = {x["n"]: x for x in row["levels"]}
        for item in comparisons:
            region, family = item["region"], item["family"]
            p = D.orders(
                levels[item["coarse"]][region][family],
                levels[item["fine"]][region][family],
            )
            window = [1.6, 2.4] if region == "whole" else [3.6, 4.4]
            N.require(
                p == item["order"]
                and item["window"] == window
                and p is not None
                and window[0] <= p <= window[1],
                "manufactured refinement failed or unresolved",
            )
    native = obs["native_cases"]
    N.require(
        len(native) == 3 and [r["n"] for r in native] == [9, 13, 17],
        "three native grids required",
    )
    for row in native:
        N.require(
            row["native_calls"] == 4
            and row["evolution_steps"] == 0
            and len(row["derivative_errors"]) == 3
            and all(0 <= x <= D.TOLERANCE for x in row["derivative_errors"]),
            "native derivative/scope mismatch",
        )
        N.require(
            set(row["region_errors"]) == {"whole", "faces", "edges", "corners"},
            "all surface regions required",
        )
        for errors in row["region_errors"].values():
            N.require(
                len(errors) == 33 and all(0 <= x <= D.TOLERANCE for x in errors),
                "all33 native regional slots required",
            )
    calls = obs["native_calls"]
    N.require(
        len(calls) == 12 and [r["index"] for r in calls] == list(range(12)),
        "complete12 native calls required",
    )
    N.require(
        [(r["mode"], r["threads"]) for r in calls]
        == [(m, 1) for m in ("dx", "dy", "dz", "rhs")] * 3,
        "fixed native order required",
    )
    N.require(
        all(
            r["returncode"] == 0
            and type(r["pid"]) is int
            and not r.get("timeout", False)
            for r in calls
        ),
        "native failure",
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
        schema="nr-discrete-reduction-controls-v1",
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
        discrete_reduction_identity_consistent=False,
        manufactured_chain_refinement_observed=False,
        independent_einstein_rhs_validated=False,
        nonlinear_constraint_stability_validated=False,
        new_scientific_evolution=False,
        full_scientific_matrix_executed=False,
        spatial_convergence_validated=False,
        physical_boundary_validated=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            native_call_seconds=30,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
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
            NR_DISCRETE_CONTROL_ROOT=str(directory),
        )
        for name in (
            "NR_INITIAL_ADM_CONTROL_ROOT",
            "NR_CONTINUUM_ADM_CONTROL_ROOT",
            "NR_NONZERO_Z4_CONTROL_ROOT",
            "NR_REDUCTION_CONTROL_ROOT",
            "NR_FORMAL_CONTROL_ROOT",
        ):
            environment.pop(name, None)
        for phase, count, script, selection in (
            ("tests", 82, "scripts/tests/test_nr_discrete_reduction.py", []),
            (
                "formal-python-regression",
                68,
                "scripts/tests/test_nr_formal_fo_geometry.py",
                ["-k", "not native_full58_formal_profile"],
            ),
        ):
            budget.guard()
            current = dict(environment)
            if phase == "tests":
                current.update(
                    NR_REDUCTION_CONTROL_ROOT=str(directory),
                    NR_REDUCTION_DEADLINE=str(budget.deadline),
                )
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
                str(ROOT / "scripts/nr-discrete-reduction-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
                *selection,
            ]
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
                    env=current,
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
                            status="discrete-reduction-controls-running",
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
            F.check_xml(
                directory / (phase + ".xml"), count, script[:-3].replace("/", ".")
            )
            row.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
            result["tests" if phase == "tests" else "regression_tests"] = count
        observed = json.loads(
            (directory / "discrete-reduction-observations.json").read_text(
                encoding="utf-8"
            )
        )
        validate_observations(observed)
        N.require(qualified_sources() == sources, "qualified source drift")
        result["native_after"] = volume_identity()
        N.require(
            result["native_after"] == result["native_before"], "native identity drift"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            observations_sha256=N.sha(
                directory / "discrete-reduction-observations.json"
            ),
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
        observed = directory / "discrete-reduction-observations.json"
        if observed.is_file():
            result["native_calls"] = len(
                json.loads(observed.read_text(encoding="utf-8"))["native_calls"]
            )
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["discrete_reduction_identity_consistent"] = result["passed"]
        result["manufactured_chain_refinement_observed"] = result["passed"]
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

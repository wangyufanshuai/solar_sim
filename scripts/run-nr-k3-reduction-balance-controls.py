"""Bounded independent reduction-balance controls; no scientific trajectory."""

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
from science.numerical_relativity import reduction_constraint_oracle as O  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-nonzero-z4-controls-v1-20261011"
PARENT_SHA = "679d5b69be2177b384bfa2beb0294a8da70df8e376c0140e37f75e3beca147a9"
EXTRA = (
    "science/numerical_relativity/reduction_constraint_oracle.py",
    "science/numerical_relativity/EXPERIMENT-20261011-reduction-balance.md",
    "scripts/tests/test_nr_reduction_balance.py",
    "scripts/nr-reduction-balance-tests.ini",
    "scripts/run-nr-k3-reduction-balance-controls.py",
)
CASES = (
    "general-plus",
    "general-minus",
    "zero-shift",
    "zero-driver",
    "metric-consistent",
    "all-definitions",
)


def predecessor():
    return runpy.run_path(str(ROOT / "scripts/run-nr-k3-nonzero-z4-controls.py"))


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "nonzero-Z4 parent gate changed",
    )
    parent = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        parent["passed"] is True
        and parent["completed"] is True
        and not parent["errors"],
        "passed parent controls required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 64, "scripts.tests.test_nr_nonzero_z4")
    F.check_xml(
        PARENT / "continuum-adm-regression.xml",
        54,
        "scripts.tests.test_nr_continuum_adm",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 434
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified434 identity required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot changed",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive files required")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def validate_observations(observed):
    N.require(
        observed["method"] == O.METHOD
        and observed["new_scientific_evolution"] is False
        and observed["independent_einstein_rhs_validated"] is False,
        "narrow observation semantics required",
    )
    rows = observed["python_cases"]
    N.require(
        len(rows) == 18
        and {(r["mode"], r["tau"]) for r in rows}
        == {(c, t) for c in CASES for t in (0.0, 1.0, 2.0)},
        "complete18 Python cases required",
    )
    native = observed["native_cases"]
    N.require(
        len(native) == 6 and {r["mode"] for r in native} == set(CASES),
        "complete6 native cases required",
    )
    for row in [*rows, *native]:
        for key in ("channel44_error", "logdet_error", "trace_error"):
            N.require(0 <= row[key] <= O.TOLERANCE, "balance mismatch: " + key)
        N.require(
            len(row["per_channel_errors"]) == 44
            and all(0 <= x <= O.TOLERANCE for x in row["per_channel_errors"]),
            "all44 channels required",
        )
        N.require(
            row["determinant_error_peak"] > 1e-3 and row["trace_peak"] > 1e-3,
            "off-algebraic-constraint field required",
        )
    for row in native:
        N.require(
            len(row["derivative_errors"]) == 3
            and all(0 <= x <= O.TOLERANCE for x in row["derivative_errors"]),
            "native derivatives mismatch",
        )
        N.require(
            row["thread_payload_byte_identical"] is True
            and row["fresh_process_stdout_byte_identical"] is True
            and row["native_calls"] == 7
            and row["evolution_steps"] == 0,
            "native replay/scope mismatch",
        )
        N.require(
            set(row["region_errors"]) == {"whole", "faces", "edges", "corners"},
            "surface regions required",
        )
        for errors in row["region_errors"].values():
            N.require(
                len(errors) == 44 and all(0 <= x <= O.TOLERANCE for x in errors),
                "all44 native regional channels required",
            )
    calls = observed["native_calls"]
    N.require(
        len(calls) == 42 and [r["index"] for r in calls] == list(range(42)),
        "complete42 native calls required",
    )
    pattern = [
        ("dx", 1),
        ("dy", 1),
        ("dz", 1),
        ("rhs", 1),
        ("rhs", 2),
        ("rhs", 4),
        ("rhs", 1),
    ] * 6
    N.require(
        [(r["mode"], r["threads"]) for r in calls] == pattern, "native order mismatch"
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
        schema="nr-reduction-balance-controls-v1",
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
        continuum_reduction_balances_consistent=False,
        native_reduction_balances_consistent=False,
        independent_einstein_rhs_validated=False,
        full58_off_constraint_validated=False,
        nonlinear_constraint_stability_validated=False,
        discrete_product_rule_validated=False,
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
        result["native_before"] = predecessor()["volume_identity"]()
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
            NR_REDUCTION_CONTROL_ROOT=str(directory),
            NR_REDUCTION_DEADLINE=str(budget.deadline),
        )
        for name in (
            "NR_INITIAL_ADM_CONTROL_ROOT",
            "NR_CONTINUUM_ADM_CONTROL_ROOT",
            "NR_NONZERO_Z4_CONTROL_ROOT",
        ):
            environment.pop(name, None)
        for phase, count, script, selection in (
            ("tests", 72, "scripts/tests/test_nr_reduction_balance.py", []),
            (
                "nonzero-z4-python-regression",
                60,
                "scripts/tests/test_nr_nonzero_z4.py",
                ["-k", "not native_sbp_polynomial_fields"],
            ),
        ):
            budget.guard()
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
                str(ROOT / "scripts/nr-reduction-balance-tests.ini"),
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
                            status="reduction-controls-running",
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
            (directory / "reduction-observations.json").read_text(encoding="utf-8")
        )
        validate_observations(observed)
        N.require(qualified_sources() == sources, "qualified source drift")
        result["native_after"] = predecessor()["volume_identity"]()
        N.require(
            result["native_after"] == result["native_before"], "native identity drift"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            observations_sha256=N.sha(directory / "reduction-observations.json"),
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
        observed_path = directory / "reduction-observations.json"
        if observed_path.is_file():
            result["native_calls"] = len(
                json.loads(observed_path.read_text(encoding="utf-8"))["native_calls"]
            )
        result["passed"] = bool(result["passed"] and not result["errors"])
        for key in (
            "continuum_reduction_balances_consistent",
            "native_reduction_balances_consistent",
        ):
            result[key] = result["passed"]
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

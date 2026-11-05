"""Bounded independent initial ADM controls. No time integration/native calls."""

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
from science.numerical_relativity import native_n9_campaign as S  # noqa: E402
from science.numerical_relativity import schwarzschild_initial_adm as O  # noqa: E402

PARENT = (
    N.EVIDENCE / "nr-k3-native-n9-entry-controls-v1-20261011/qualification-gate.json"
)
PARENT_SHA = "efa38fec98554a93c709cbcd3532e5a43450ee854c2479d4699a2cf8f5cc9d6e"
EXTRA = (
    "science/numerical_relativity/schwarzschild_initial_adm.py",
    "science/numerical_relativity/EXPERIMENT-20261011-initial-adm.md",
    "scripts/tests/test_nr_initial_adm.py",
    "scripts/nr-initial-adm-tests.ini",
    "scripts/run-nr-k3-initial-adm-controls.py",
)


def qualified_sources():
    N.require(N.sha(PARENT) == PARENT_SHA, "qualified N9 control parent changed")
    S.entry_qualification(PARENT)
    inherited = S.source_closure()
    N.require(
        len(inherited) == 419 and not set(inherited).intersection(EXTRA),
        "additive controls required",
    )
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
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
        schema="nr-initial-adm-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        parent_gate_sha256=PARENT_SHA,
        source_before={},
        source_after={},
        suites=[],
        tests=0,
        regression_tests=0,
        analytic_initial_adm_acceleration_consistent=False,
        independent_einstein_rhs_validated=False,
        new_scientific_evolution=False,
        full_scientific_matrix_executed=False,
        spatial_convergence_validated=False,
        physical_boundary_validated=False,
        physical_gate=False,
        native_calls=0,
        live_admission=False,
        scientificPayloadWriteback=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
    )
    budget.record("attempt.json", result)
    try:
        sources = qualified_sources()
        result["source_before"] = sources
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
            NR_INITIAL_ADM_CONTROL_ROOT=str(directory),
        )
        for phase, count, script in (
            ("tests", 78, "scripts/tests/test_nr_initial_adm.py"),
            (
                "preflight-regression",
                70,
                "scripts/tests/test_nr_native_spatial_preflight.py",
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
                str(ROOT / "scripts/nr-initial-adm-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            row = dict(
                phase=phase,
                command=command,
                expected_tests=count,
                tests=0,
                returncode=None,
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
                            status="initial-adm-controls-running",
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
            (directory / "initial-adm-observations.json").read_text(encoding="utf-8")
        )
        rows = observed["cases"]
        N.require(
            len(rows) == 9
            and {(r["n"], r["amplitude"]) for r in rows}
            == {(n, a) for n in (9, 13, 17) for a in (0.0, 0.001, -0.001)},
            "complete registered cases required",
        )
        for row in rows:
            N.require(
                row["initial_error"] <= O.INITIAL_TOLERANCE, "initial identity error"
            )
            for key in (
                "canonical58_error",
                "physical_k_error",
                "direct_vs_cancellation_error",
                "zero51_error",
            ):
                N.require(
                    0 <= row[key] <= O.ABS_TOLERANCE, "initial oracle error: " + key
                )
        N.require(qualified_sources() == sources, "qualified sources changed")
        result.update(
            completed=True,
            passed=True,
            analytic_initial_adm_acceleration_consistent=True,
            observations_sha256=N.sha(directory / "initial-adm-observations.json"),
        )
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if child is not None and child.poll() is None:
            print(
                json.dumps(dict(status="stopping-owned-controls", reason=str(error))),
                flush=True,
            )
            stop = runpy.run_path(
                str(ROOT / "scripts/run-nr-k3-native-continuation-controls.py")
            )["stop_owned"]
            stop(child)
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
        result["analytic_initial_adm_acceleration_consistent"] = result["passed"]
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

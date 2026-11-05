"""Bounded N9 entry controls, never the 98-step scientific matrix."""

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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct controls directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    started = time.monotonic()
    sources = S.source_closure()
    identity = N.native_identity()[0]
    directory.mkdir()
    result = dict(
        schema="nr-native-n9-entry-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        returncode=None,
        tests=0,
        regression_tests=0,
        source_before=sources,
        source_after={},
        preflight_gate_sha256=S.PREFLIGHT_SHA,
        native_identity=identity,
        registration_fixture_audited=False,
        real_pulse_multisegment_audited=False,
        real_failure_prefix_audited=False,
        full_scientific_matrix_executed=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        suites=[],
        **S.FALSE_FLAGS,
    )
    budget.record("attempt.json", result)
    child = None
    try:
        N.save_source_snapshot(budget, sources)
        environment = dict(
            os.environ,
            NR_N9_ENTRY_TEST_ROOT=str(directory),
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            PYTHONDONTWRITEBYTECODE="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(directory),
            TMP=str(directory),
        )
        for phase, count, script in (
            ("tests", S.EXPECTED_TESTS, "scripts/tests/test_nr_native_n9_campaign.py"),
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
                str(ROOT / "scripts/nr-native-n9-entry-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            row = dict(
                phase=phase,
                expected_tests=count,
                command=command,
                returncode=None,
                tests=0,
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
                            status="n9-entry-controls-running",
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
            if phase == "tests":
                result["returncode"] = child.returncode
            N.require(child.returncode == 0, phase + " failed; artifacts retained")
            F.check_xml(
                directory / (phase + ".xml"), count, script[:-3].replace("/", ".")
            )
            row.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
            result["tests" if phase == "tests" else "regression_tests"] = count
        observed = json.loads(
            (directory / "control-observations.json").read_text(encoding="utf-8")
        )
        N.require(
            observed["registration_fixture_audited"] is True
            and observed["pulse_accepted_steps"] == 3
            and observed["pulse_rhs_stages_audited"] == 12
            and observed["failure_accepted_steps"] == 1
            and observed["failure_native_published_steps"] == 2
            and observed["full_scientific_matrix_executed"] is False,
            "required real controls incomplete",
        )
        N.require(
            S.source_closure() == sources and N.native_identity()[0] == identity,
            "qualified identity drift",
        )
        result.update(
            registration_fixture_audited=True,
            real_pulse_multisegment_audited=True,
            real_failure_prefix_audited=True,
            completed=True,
            passed=True,
            xml_sha256=N.sha(directory / "tests.xml"),
        )
        budget.guard()
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
        for name in sources:
            try:
                result["source_after"][name] = N.sha(N.contained(ROOT, name))
            except Exception as error:
                result["source_after"][name] = None
                result["errors"].append(f"source:{name}: {error}")
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["completed"] = bool(result["completed"] and not result["errors"])
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

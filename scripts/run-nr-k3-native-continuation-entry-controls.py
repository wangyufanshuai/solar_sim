"""Bounded whole-entry tests; no fresh native trajectory is executed."""

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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh bounded entry-control directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    sources = F.source_closure()
    component = F.component_qualification()
    directory.mkdir()
    started = time.monotonic()
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
        str(ROOT / "scripts/nr-native-continuation-entry-tests.ini"),
        "--basetemp",
        str(directory / "pytest-temp"),
        "--junitxml",
        str(directory / "tests.xml"),
        "scripts/tests/test_nr_native_continuation_campaign.py",
    ]
    result = dict(
        schema="nr-native-continuation-entry-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        returncode=None,
        command=command,
        tests=0,
        expected_tests=F.ENTRY_TEST_COUNT,
        source_before=sources,
        source_after={},
        component_gate_sha256=component["gate_sha256"],
        registration_fixture_audited=False,
        new_scientific_evolution=False,
        physical_gate=False,
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
    N.save_source_snapshot(budget, sources)
    child = None
    try:
        environment = dict(
            os.environ,
            NR_CONTINUATION_ENTRY_TEST_ROOT=str(directory),
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            PYTHONDONTWRITEBYTECODE="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(ROOT / "tmp"),
            TMP=str(ROOT / "tmp"),
        )
        with (directory / "pytest.log").open("xb") as log:
            child = subprocess.Popen(
                command,
                cwd=ROOT,
                env=environment,
                stdout=log,
                stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            budget.record("process.json", dict(pid=child.pid, owned=True, retries=0))
            print(
                json.dumps(
                    dict(
                        status="entry-controls-running",
                        pid=child.pid,
                        seconds_cap=600,
                        bytes_cap=64 * 1024**2,
                    )
                ),
                flush=True,
            )
            while child.poll() is None:
                budget.guard()
                time.sleep(0.5)
            result["returncode"] = child.returncode
        budget.guard()
        N.require(
            child.returncode == 0, "entry controls failed; retained without retry"
        )
        F.check_xml(
            directory / "tests.xml",
            F.ENTRY_TEST_COUNT,
            "scripts.tests.test_nr_native_continuation_campaign",
        )
        result["tests"] = F.ENTRY_TEST_COUNT
        checked = json.loads(
            (directory / "registration-fixture-audit.json").read_text(encoding="utf-8")
        )
        N.require(
            checked["audit_completed"] is True
            and checked["registration_fixture"] is True
            and checked["physical_experiment_completed"] is False
            and checked["additional_native_steps"]
            == checked["additional_scientific_steps"]
            == 0,
            "whole-entry zero-evolution fixture audit required",
        )
        N.require(
            F.component_qualification() == component, "component qualification drift"
        )
        result.update(
            completed=True,
            passed=True,
            registration_fixture_audited=True,
            xml_sha256=N.sha(directory / "tests.xml"),
        )
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if child is not None and child.poll() is None:
            print(
                json.dumps(
                    dict(status="stopping-owned-entry-controls", reason=str(error))
                ),
                flush=True,
            )
            stop = runpy.run_path(
                str(ROOT / "scripts/run-nr-k3-native-continuation-controls.py")
            )["stop_owned"]
            stop(child)
        if child is not None:
            result["returncode"] = child.returncode
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(N.contained(ROOT, name)) for name in sources
        }
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
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
                    "seconds",
                    "errors",
                    "returncode",
                )
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

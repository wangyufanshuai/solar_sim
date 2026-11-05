"""64MiB/600s isolated controls then saved-state analysis; no scientific evolution."""

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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh bounded control directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    analysis = runpy.run_path(str(ROOT / "scripts/analyze-nr-k3-constraint-fields.py"))
    frozen = analysis["frozen_sources"]()
    extra = {name: N.sha(ROOT / name) for name in analysis["EXTRA_SOURCES"]}
    N.require(
        not set(frozen).intersection(extra), "new tools must not replace frozen sources"
    )
    sources = N.merge_source_tables(frozen, extra)
    directory.mkdir()
    started = time.monotonic()
    commands = [
        [
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
            str(ROOT / "scripts/nr-constraint-field-tests.ini"),
            "--basetemp",
            str(directory / "pytest-temp"),
            "--junitxml",
            str(directory / "tests.xml"),
            "scripts/tests/test_nr_constraint_field_comparison.py",
        ],
        [
            sys.executable,
            "-B",
            str(ROOT / "scripts/analyze-nr-k3-constraint-fields.py"),
            "--control-directory",
            str(directory),
        ],
    ]
    result = dict(
        schema="nr-constraint-field-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        commands=commands,
        process_results=[],
        tests=0,
        expected_tests=analysis["EXPECTED_TESTS"],
        source_before=sources,
        source_after={},
        frozen_source_count=len(frozen),
        additional_source_count=len(extra),
        endpoint_diagnostics_completed=False,
        new_scientific_evolution=False,
        primary_result_regraded=False,
        constraint_convergence_validated=False,
        spatial_convergence_validated=False,
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
    child = None
    try:
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
        )
        for phase, command in zip(
            ("pytest", "saved-state-analysis"), commands, strict=True
        ):
            budget.guard()
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
                        dict(status="controls-running", phase=phase, pid=child.pid)
                    ),
                    flush=True,
                )
                while child.poll() is None:
                    budget.guard()
                    time.sleep(0.5)
                result["process_results"].append(
                    dict(phase=phase, returncode=child.returncode)
                )
            budget.guard()
            N.require(
                child.returncode == 0, phase + " failed; original evidence retained"
            )
            if phase == "pytest":
                F.check_xml(
                    directory / "tests.xml",
                    analysis["EXPECTED_TESTS"],
                    analysis["TEST_MODULE"],
                )
                result["tests"] = analysis["EXPECTED_TESTS"]
                result["xml_sha256"] = N.sha(directory / "tests.xml")
                analysis["check_hashes"](sources)
        report = json.loads(
            (directory / "endpoint-field-report.json").read_text(encoding="utf-8")
        )
        N.require(
            report["completed"]
            and not report["errors"]
            and report["new_evolution"] is False
            and report["test_report_sha256"] == result["xml_sha256"]
            and report["adapter_sources"] == extra
            and report["frozen_source_count"] == len(frozen),
            "bound zero-evolution endpoint diagnostics required",
        )
        result.update(
            completed=True,
            passed=True,
            endpoint_diagnostics_completed=True,
            endpoint_report_sha256=N.sha(directory / "endpoint-field-report.json"),
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
                for k in ("completed", "passed", "tests", "seconds", "errors")
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

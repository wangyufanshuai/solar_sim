"""Bounded alignment controls and same-grid regression; never evolve states."""

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
from science.numerical_relativity import constraint_grid_alignment as G  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-constraint-field-controls-v2-20261011"
PARENT_SHA = "747c73712890e759103b3d74ef91fb31555857ce762dc15a295f735d5bcbd07b"
EXTRA = (
    "science/numerical_relativity/constraint_grid_alignment.py",
    "science/numerical_relativity/EXPERIMENT-20261011-constraint-grid-alignment.md",
    "scripts/tests/test_nr_constraint_grid_alignment.py",
    "scripts/nr-constraint-alignment-tests.ini",
    "scripts/run-nr-k3-constraint-alignment-controls.py",
)
SUITES = (
    ("alignment", 71, "scripts/tests/test_nr_constraint_grid_alignment.py"),
    (
        "same-grid-regression",
        77,
        "scripts/tests/test_nr_constraint_field_comparison.py",
    ),
)


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "prior comparison gate changed",
    )
    parent = json.loads(
        (PARENT / "qualification-gate.json").read_text(encoding="utf-8")
    )
    N.require(
        parent["passed"] is True
        and parent["completed"] is True
        and not parent["errors"],
        "prior qualified comparison controls required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(
        PARENT / "tests.xml", 77, "scripts.tests.test_nr_constraint_field_comparison"
    )
    inherited = parent["source_after"]
    N.require(
        len(inherited) == 402 and inherited == parent["source_before"],
        "qualified402 sources required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(ROOT, name)) == digest,
            "qualified source changed: " + name,
        )
    N.require(not set(inherited).intersection(EXTRA), "additive alignment only")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def control_observations():
    # Algebraic diagnostic observations, not simulation output or a physical gate.
    h = (1.0 / 4.0, 1.0 / 6.0, 1.0 / 8.0)
    return dict(
        fixture_only=True,
        alignment_method=G.METHOD,
        source_grid_points=[9, 13, 17],
        target_grid_points=9,
        transfers=[G.transfer_metadata(G.axis_transfer(n, 9)) for n in (9, 13, 17)],
        unequal_grid_manufactured_difference_ratios={
            str(p): (h[0] ** p - h[1] ** p) / (h[1] ** p - h[2] ** p) for p in (2, 4)
        },
        spatial_convergence_validated=False,
        amr_validated=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh bounded controls directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    sources = qualified_sources()
    directory.mkdir()
    started = time.monotonic()
    result = dict(
        schema="nr-constraint-alignment-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        parent_gate_sha256=PARENT_SHA,
        suites=[],
        source_before=sources,
        source_after={},
        inherited_source_count=402,
        additional_source_count=len(EXTRA),
        new_tests=0,
        regression_tests=0,
        new_scientific_evolution=False,
        primary_result_regraded=False,
        spatial_convergence_validated=False,
        constraint_convergence_validated=False,
        amr_validated=False,
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
        for phase, count, script in SUITES:
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
                str(ROOT / "scripts/nr-constraint-alignment-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            record = dict(
                phase=phase,
                command=command,
                expected_tests=count,
                tests=0,
                returncode=None,
            )
            result["suites"].append(record)
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
                            status="alignment-controls-running",
                            phase=phase,
                            pid=child.pid,
                        )
                    ),
                    flush=True,
                )
                while child.poll() is None:
                    budget.guard()
                    time.sleep(0.5)
                record["returncode"] = child.returncode
            budget.guard()
            N.require(
                child.returncode == 0, phase + " controls failed; artifacts retained"
            )
            module = script[:-3].replace("/", ".")
            F.check_xml(directory / (phase + ".xml"), count, module)
            record.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
            result["new_tests" if phase == "alignment" else "regression_tests"] = count
        N.require(qualified_sources() == sources, "source/parent identity drift")
        budget.record("control-observations.json", control_observations())
        result.update(completed=True, passed=True)
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
                key: result[key]
                for key in (
                    "completed",
                    "passed",
                    "new_tests",
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

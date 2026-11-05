"""Bounded no-evolution preflight controls; never starts a scientific matrix."""

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
from science.numerical_relativity import native_spatial_preflight as P  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-constraint-alignment-controls-v1-20261011"
PARENT_SHA = "87a34882b6afa831b2423d9d5e7242a10692952961c0cc977b5ca845ed8d62bb"
EXTRA = (
    "science/numerical_relativity/native_spatial_preflight.py",
    "science/numerical_relativity/EXPERIMENT-20261011-native-spatial-preflight.md",
    "scripts/tests/test_nr_native_spatial_preflight.py",
    "scripts/nr-spatial-preflight-tests.ini",
    "scripts/run-nr-k3-spatial-preflight-controls.py",
)
SUITES = (
    ("preflight", 70, "scripts/tests/test_nr_native_spatial_preflight.py"),
    ("alignment-regression", 71, "scripts/tests/test_nr_constraint_grid_alignment.py"),
    ("field-regression", 77, "scripts/tests/test_nr_constraint_field_comparison.py"),
)


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA, "prior gate changed"
    )
    gate = json.loads((PARENT / "qualification-gate.json").read_text(encoding="utf-8"))
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "qualified parent required",
    )
    F.verify_inventory(PARENT, gate, "qualification-gate.json")
    F.check_xml(
        PARENT / "alignment.xml", 71, "scripts.tests.test_nr_constraint_grid_alignment"
    )
    F.check_xml(
        PARENT / "same-grid-regression.xml",
        77,
        "scripts.tests.test_nr_constraint_field_comparison",
    )
    inherited = gate["source_after"]
    N.require(
        len(inherited) == 407 and inherited == gate["source_before"],
        "qualified407 sources required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(ROOT, name)) == digest,
            "qualified source changed: " + name,
        )
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "qualified snapshot changed: " + name,
        )
    N.require(
        not set(inherited).intersection(EXTRA), "additive preflight sources required"
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
        "fresh direct controls directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    started = time.monotonic()
    sources = qualified_sources()
    identity, _binding, _native_sources = N.native_identity()
    directory.mkdir()
    result = dict(
        schema="nr-spatial-preflight-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        parent_gate_sha256=PARENT_SHA,
        source_before=sources,
        source_after={},
        inherited_source_count=407,
        additional_source_count=len(EXTRA),
        native_identity=identity,
        suites=[],
        new_tests=0,
        regression_tests=0,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        initial_data_only=True,
        scientific_ancestry_reaudited=False,
        primary_result_regraded=False,
        **P.FLAGS,
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
                str(ROOT / "scripts/nr-spatial-preflight-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            record = dict(
                phase=phase,
                expected_tests=count,
                tests=0,
                returncode=None,
                command=command,
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
                            status="preflight-controls-running",
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
                child.returncode == 0, phase + " controls failed; evidence retained"
            )
            F.check_xml(
                directory / (phase + ".xml"), count, script[:-3].replace("/", ".")
            )
            record.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
            result["new_tests" if phase == "preflight" else "regression_tests"] += count
        for name in P.NAMES:
            budget.guard()
            candidate = P.proposal(name)
            P.validate_proposal(candidate)
            budget.record(name + ".json", candidate)
        N.require(qualified_sources() == sources, "source/parent drift")
        N.require(N.native_identity()[0] == identity, "native identity drift")
        result.update(completed=True, passed=True)
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
            except OSError as error:
                result["errors"].append(
                    f"source unreadable: {name}: {type(error).__name__}"
                )
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

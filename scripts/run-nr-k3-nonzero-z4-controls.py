"""Bounded independent nonzero-Z4 controls, without scientific time evolution."""

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
from science.numerical_relativity import continuum_z4 as O  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-continuum-adm-controls-v1-20261011"
PARENT_SHA = "b1f0e195d80c4dc6d074707725c120609f5e74f36dd7c7b721f7d21f7b2f0803"
VOLUME = N.EVIDENCE / "nr-k3-native-sbp-volume-component-v2-20261010"
VOLUME_SHA = "a9f55559c01fbdb982436283272ef5cbb811768f15273269c0bfa3be3abe8816"
EXE = (
    ROOT
    / "tmp/nr-native-sbp-volume-build-v2-20261010/Release/nr-sbp-volume-component.exe"
)
EXE_SHA = "b7459bdb251702ec51e6cf16282daaa05f835b4b624a1a494fb30c3753d01251"
VOLUME_XML = ROOT / "tmp/nr-native-sbp-volume-component-v2-20261010.xml"
VOLUME_XML_SHA = "68b2f2d9c8d0171aa0e4795da0c989943f6383cfa2dd73fe5b3878edd64ee4da"
EXTRA = (
    "science/numerical_relativity/continuum_z4.py",
    "science/numerical_relativity/EXPERIMENT-20261011-nonzero-z4.md",
    "scripts/tests/test_nr_nonzero_z4.py",
    "scripts/nr-nonzero-z4-tests.ini",
    "scripts/run-nr-k3-nonzero-z4-controls.py",
)


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "ADM parent gate changed",
    )
    parent = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        parent["passed"] is True
        and parent["completed"] is True
        and not parent["errors"],
        "passed ADM controls required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 54, "scripts.tests.test_nr_continuum_adm")
    F.check_xml(
        PARENT / "initial-adm-regression.xml", 78, "scripts.tests.test_nr_initial_adm"
    )
    previous = runpy.run_path(str(ROOT / "scripts/run-nr-k3-continuum-adm-controls.py"))
    inherited = previous["qualified_sources"]()
    N.require(
        len(inherited) == 429
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified429 source identity required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "ADM snapshot changed",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive controls required")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def volume_identity():
    N.require(
        N.sha(VOLUME / "receipt.json") == VOLUME_SHA, "qualified native receipt changed"
    )
    receipt = json.loads((VOLUME / "receipt.json").read_text())
    F.verify_inventory(VOLUME, receipt, "receipt.json")
    N.require(N.sha(VOLUME_XML) == VOLUME_XML_SHA, "qualified native XML changed")
    F.check_xml(VOLUME_XML, 68, "scripts.tests.test_nr_native_sbp_volume_component")
    N.require(
        receipt["source_before"] == receipt["source_after"]
        and len(receipt["source_after"]) == 7,
        "seven frozen native source identities required",
    )
    N.require(
        receipt["generated_before"] == receipt["generated_after"]
        and len(receipt["generated_after"]) == 4,
        "four frozen generated identities required",
    )
    for name, digest in {
        **receipt["source_after"],
        **receipt["generated_after"],
    }.items():
        N.require(
            N.sha(N.contained(ROOT, name)) == digest,
            "native component source/generated drift",
        )
    N.require(
        N.sha(EXE) == receipt["executable_sha256"] == EXE_SHA,
        "qualified native executable changed",
    )
    N.require(
        N.sha(N.OMP) == receipt["openmp_runtime_sha256"] == N.RUNTIMES[N.OMP],
        "qualified OpenMP runtime changed",
    )
    return dict(
        receipt_sha256=VOLUME_SHA,
        executable_sha256=EXE_SHA,
        xml_sha256=VOLUME_XML_SHA,
        runtime_sha256=N.RUNTIMES[N.OMP],
        sources=receipt["source_after"],
        generated=receipt["generated_after"],
    )


def validate_observations(observed):
    N.require(
        observed["method"] == O.METHOD
        and observed["new_scientific_evolution"] is False
        and observed["independent_einstein_rhs_validated"] is False,
        "narrow observation semantics required",
    )
    rows = observed["python_cases"]
    expected = {
        (r, sign, mode, damping)
        for r in (1, 2)
        for sign in (-1.0, 1.0)
        for mode in ("theta", "z", "both")
        for damping in ((0.1, 0.0), (0.2, 0.25))
    }
    N.require(
        len(rows) == 24
        and {
            (r["orientation"], r["sign"], r["mode"], tuple(r["damping"])) for r in rows
        }
        == expected,
        "complete24 Python physical cases required",
    )
    for row in rows:
        for key in (
            "all58_error",
            "physical_metric_error",
            "physical_extrinsic_error",
            "physical_z_error",
        ):
            N.require(0 <= row[key] <= O.TOLERANCE, "nonzero-Z4 comparison: " + key)
        N.require(
            len(row["per_slot_errors"]) == 58
            and all(0 <= x <= O.TOLERANCE for x in row["per_slot_errors"]),
            "all58 Python slots required",
        )
    rows = observed["native_cases"]
    N.require(
        len(rows) == 4 and {r["mode"] for r in rows} == {"zero", "theta", "z", "both"},
        "complete4 native field set required",
    )
    for row in rows:
        N.require(
            0 <= row["all58_error"] <= O.TOLERANCE
            and len(row["derivative_errors"]) == 3
            and all(0 <= x <= O.TOLERANCE for x in row["derivative_errors"]),
            "native analytic comparison failed",
        )
        N.require(
            row["thread_payload_byte_identical"] is True
            and row["fresh_process_stdout_byte_identical"] is True
            and row["native_calls"] == 7
            and row["evolution_steps"] == 0,
            "native replay scope mismatch",
        )
        regions = row["per_region_slot_errors"]
        N.require(
            set(regions) == {"whole", "faces", "edges", "corners"},
            "native surface regions required",
        )
        for errors in regions.values():
            N.require(
                len(errors) == 58 and all(0 <= x <= O.TOLERANCE for x in errors),
                "native region/slot mismatch",
            )
    calls = observed["native_calls"]
    N.require(
        len(calls) == 28 and [r["index"] for r in calls] == list(range(28)),
        "complete28 native calls required",
    )
    pattern = [
        ("dx", 1),
        ("dy", 1),
        ("dz", 1),
        ("rhs", 1),
        ("rhs", 2),
        ("rhs", 4),
        ("rhs", 1),
    ] * 4
    N.require(
        [(r["mode"], r["threads"]) for r in calls] == pattern,
        "exact native mode/thread order required",
    )
    N.require(
        all(
            r["returncode"] == 0
            and type(r["pid"]) is int
            and not r.get("timeout", False)
            for r in calls
        ),
        "all native calls must succeed",
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
        schema="nr-nonzero-z4-controls-v1",
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
        nonzero_z4_continuum_consistent=False,
        native_polynomial_component_consistent=False,
        independent_einstein_rhs_validated=False,
        auxiliary_constraint_violations_validated=False,
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
            NR_NONZERO_Z4_CONTROL_ROOT=str(directory),
            NR_NONZERO_Z4_DEADLINE=str(budget.deadline),
        )
        for name in ("NR_INITIAL_ADM_CONTROL_ROOT", "NR_CONTINUUM_ADM_CONTROL_ROOT"):
            environment.pop(name, None)
        for phase, count, script in (
            ("tests", 64, "scripts/tests/test_nr_nonzero_z4.py"),
            ("continuum-adm-regression", 54, "scripts/tests/test_nr_continuum_adm.py"),
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
                str(ROOT / "scripts/nr-nonzero-z4-tests.ini"),
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
                            status="nonzero-z4-controls-running",
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
            (directory / "nonzero-z4-observations.json").read_text(encoding="utf-8")
        )
        validate_observations(observed)
        N.require(qualified_sources() == sources, "qualified sources changed")
        result["native_after"] = volume_identity()
        N.require(
            result["native_after"] == result["native_before"], "native identity changed"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            observations_sha256=N.sha(directory / "nonzero-z4-observations.json"),
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
        observed_path = directory / "nonzero-z4-observations.json"
        if observed_path.is_file():
            result["native_calls"] = len(
                json.loads(observed_path.read_text(encoding="utf-8"))["native_calls"]
            )
        result["passed"] = bool(result["passed"] and not result["errors"])
        for key in (
            "nonzero_z4_continuum_consistent",
            "native_polynomial_component_consistent",
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

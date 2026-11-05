"""Resource-bounded second-order ADM versus first-order CCZ4 controls."""

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
from science.numerical_relativity import continuum_adm as O  # noqa: E402

PARENT = N.EVIDENCE / "nr-k3-initial-adm-controls-v1-20261011"
PARENT_SHA = "0cbaf529b95641a2c47e0522e8b82e5609c4f26b7af869dca06649de6bd81329"
EXTRA = (
    "science/numerical_relativity/continuum_adm.py",
    "science/numerical_relativity/EXPERIMENT-20261011-continuum-adm.md",
    "scripts/tests/test_nr_continuum_adm.py",
    "scripts/nr-continuum-adm-tests.ini",
    "scripts/run-nr-k3-continuum-adm-controls.py",
)


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "initial ADM gate changed",
    )
    parent = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        parent["passed"] is True
        and parent["completed"] is True
        and not parent["errors"],
        "passed initial ADM controls required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 78, "scripts.tests.test_nr_initial_adm")
    F.check_xml(
        PARENT / "preflight-regression.xml",
        70,
        "scripts.tests.test_nr_native_spatial_preflight",
    )
    previous = runpy.run_path(str(ROOT / "scripts/run-nr-k3-initial-adm-controls.py"))
    inherited = previous["qualified_sources"]()
    N.require(
        len(inherited) == 424
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified424 source identity required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "initial ADM snapshot changed",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive controls required")
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
        schema="nr-continuum-adm-controls-v1",
        completed=False,
        passed=False,
        errors=[],
        parent_gate_sha256=PARENT_SHA,
        source_before={},
        source_after={},
        suites=[],
        tests=0,
        regression_tests=0,
        zero_z4_continuum_adm_consistent=False,
        independent_einstein_rhs_validated=False,
        nonzero_z4_validated=False,
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
            NR_CONTINUUM_ADM_CONTROL_ROOT=str(directory),
        )
        # Prevent a inherited shell setting from redirecting the old regression
        # fixture into its historical frozen evidence directory.
        environment.pop("NR_INITIAL_ADM_CONTROL_ROOT", None)
        for phase, count, script in (
            ("tests", 54, "scripts/tests/test_nr_continuum_adm.py"),
            ("initial-adm-regression", 78, "scripts/tests/test_nr_initial_adm.py"),
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
                str(ROOT / "scripts/nr-continuum-adm-tests.ini"),
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
                            status="continuum-adm-controls-running",
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
            (directory / "continuum-adm-observations.json").read_text(encoding="utf-8")
        )
        rows = observed["cases"]
        N.require(
            len(rows) == 6
            and {(r["orientation"], r["extrinsic_sign"]) for r in rows}
            == {(r, sign) for r in (0, 1, 2) for sign in (-1.0, 1.0)},
            "complete nonlinear case set required",
        )
        for row in rows:
            for key in (
                "canonical58_error",
                "physical_metric_rate_error",
                "physical_extrinsic_rate_error",
            ):
                N.require(
                    0 <= row[key] <= O.TOLERANCE, "continuum comparison error: " + key
                )
            N.require(
                len(row["per_slot_errors"]) == 58
                and all(0 <= x <= O.TOLERANCE for x in row["per_slot_errors"]),
                "all58 slot controls required",
            )
        N.require(qualified_sources() == sources, "qualified sources changed")
        result.update(
            completed=True,
            passed=True,
            zero_z4_continuum_adm_consistent=True,
            observations_sha256=N.sha(directory / "continuum-adm-observations.json"),
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
        result["zero_z4_continuum_adm_consistent"] = result["passed"]
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

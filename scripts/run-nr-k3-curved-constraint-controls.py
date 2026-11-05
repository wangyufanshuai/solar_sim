"""Bounded curved physical constraint-identity controls; no evolution/native call."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import curved_constraint_propagation as P  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-profile-constraint-controls-v1-20261011"
PARENT_SHA = "7f7bfa4a25374288ab2ca463ad00ca27b482dd54db960a07cc6d1527c7ff1f13"
EXTRA = (
    "science/numerical_relativity/spatial_taylor3.py",
    "science/numerical_relativity/curved_constraint_propagation.py",
    "science/numerical_relativity/EXPERIMENT-20261011-curved-constraints.md",
    "scripts/tests/test_nr_curved_constraints.py",
    "scripts/nr-curved-constraint-tests.ini",
    "scripts/run-nr-k3-curved-constraint-controls.py",
)


def predecessor():
    return runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-profile-constraint-controls.py")
    )


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA, "parent gate drift"
    )
    report = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        report["completed"] is report["passed"] is True and not report["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, report, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 53, "scripts.tests.test_nr_profile_constraints")
    F.check_xml(
        PARENT / "spectral-python-regression.xml",
        66,
        "scripts.tests.test_nr_spectral_sat",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 465
        and inherited == report["source_before"] == report["source_after"],
        "qualified465 sources required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot drift",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive sources only")
    sources = N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )
    N.require(
        sum((ROOT / name).stat().st_size for name in sources) <= 4 * 1024**2,
        "unchanged4MiB source cap exceeded",
    )
    return sources


def validate(directory, budget=None):
    obs = json.loads((directory / "curved-constraint-observations.json").read_text())
    N.require(
        obs["method"] == P.METHOD
        and obs["native_calls"] == 0
        and obs["definition_surface_only"] is True
        and all(obs[key] is False for key in P.FALSE_FLAGS),
        "observation scope mismatch",
    )
    N.require(
        len(obs["cases"]) == len(P.CASES)
        and [r["index"] for r in obs["cases"]] == list(range(22)),
        "all22 ordered cases required",
    )
    maximum = dict(constraint_rate_error=0.0, pointwise_error=0.0, full58_error=0.0)
    for row in obs["cases"]:
        if budget is not None:
            budget.guard()
        index = row["index"]
        case = P.CASES[index]
        damping = P.DAMPING[case[3]]
        N.require(
            tuple(row["fixture"]) == case and tuple(row["damping"]) == damping,
            "case identity mismatch",
        )
        arrays = {
            name: np.load(directory / f"case-{index}-{name}.npy", allow_pickle=False)
            for name in (
                "inputs",
                "direct",
                "closed",
                "terms",
                "pointwise",
                "full58",
                "ricci",
                "metric_rate",
                "extrinsic_rate",
            )
        }
        report = P.inspect_arrays(arrays)
        N.require(
            all(row[name] == value for name, value in report.items()),
            "persisted metrics mismatch",
        )
        state = P.State.unpack(arrays["inputs"])
        N.require(
            np.array_equal(state.packed(), P.fixture(*case).packed()),
            "registered input coefficients changed",
        )
        expected = P.compare(state, *damping)
        for name, value in expected.items():
            N.require(
                np.array_equal(arrays[name], value),
                "deterministic saved comparison changed: " + name,
            )
        for name in maximum:
            maximum[name] = max(maximum[name], report[name])
            N.require(
                report[name] <= P.TOLERANCE, "physical identity discrepancy: " + name
            )
        if case[0] != "curved":
            N.require(
                max(
                    report["hamiltonian"],
                    report["momentum"],
                    report["full_physical_rate"],
                    float(np.max(abs(arrays["direct"]))),
                    float(np.max(abs(arrays["closed"]))),
                    float(np.max(abs(arrays["full58"]))),
                )
                <= P.TOLERANCE,
                "known static solution discrepancy",
            )
        else:
            N.require(
                min(report["curvature"], report["hamiltonian"], report["momentum"])
                > 1e-4,
                "nontrivial curved case required",
            )
    return dict(
        cases=22,
        curved_cases=18,
        static_schwarzschild_cases=3,
        minkowski_cases=1,
        maximum_errors=maximum,
        definition_surface_physical_identities_validated=True,
        **{key: False for key in P.FALSE_FLAGS},
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
        schema=P.METHOD,
        completed=False,
        passed=False,
        errors=[],
        suites=[],
        source_before={},
        source_after={},
        native_before={},
        native_after={},
        tests=0,
        regression_tests=0,
        native_calls=0,
        parent_gate_sha256=PARENT_SHA,
        definition_surface_physical_identities_validated=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{key: False for key in P.FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    try:
        sources = qualified_sources()
        result["source_before"] = sources
        T.parent()
        identity = predecessor()["predecessor"]()["volume_identity"]
        result["native_before"] = identity()
        budget.record("native-identity-before.json", result["native_before"])
        N.save_source_snapshot(budget, sources)
        environment = {
            k: v
            for k, v in os.environ.items()
            if not (k.startswith("NR_") and k.endswith("_ROOT"))
        }
        environment.update(
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            PYTHONDONTWRITEBYTECODE="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(directory),
            TMP=str(directory),
        )
        for phase, count, script in (
            ("tests", 67, "scripts/tests/test_nr_curved_constraints.py"),
            (
                "profile-python-regression",
                53,
                "scripts/tests/test_nr_profile_constraints.py",
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
                str(ROOT / "scripts/nr-curved-constraint-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            current = dict(environment)
            if phase == "tests":
                current["NR_CURVED_CONSTRAINT_ROOT"] = str(directory)
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
                            status="curved-controls-running", phase=phase, pid=child.pid
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
        result["audit"] = validate(directory, budget)
        N.require(qualified_sources() == sources, "qualified source drift")
        T.parent()
        result["native_after"] = identity()
        N.require(
            result["native_before"] == result["native_after"], "native identity drift"
        )
        budget.guard()
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
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in sources
        }
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        if result["passed"]:
            result["definition_surface_physical_identities_validated"] = result[
                "audit"
            ]["definition_surface_physical_identities_validated"]
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

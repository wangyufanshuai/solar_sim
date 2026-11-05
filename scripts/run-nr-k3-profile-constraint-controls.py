"""Bounded fixed-profile physical-kernel audit and static target compatibility."""

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
from science.numerical_relativity import profile_constraint_closure as P  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-spectral-sat-controls-v1-20261011"
PARENT_SHA = "20bc6cd9269505a7359a181d6997c74f56ae3a5cfeceb06c96f1840d209f2456"
EXTRA = (
    "science/numerical_relativity/profile_constraint_closure.py",
    "science/numerical_relativity/EXPERIMENT-20261011-profile-constraints.md",
    "scripts/tests/test_nr_profile_constraints.py",
    "scripts/nr-profile-constraint-tests.ini",
    "scripts/run-nr-k3-profile-constraint-controls.py",
)


def predecessor():
    return runpy.run_path(str(ROOT / "scripts/run-nr-k3-spectral-sat-controls.py"))


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
    F.check_xml(PARENT / "tests.xml", 66, "scripts.tests.test_nr_spectral_sat")
    F.check_xml(
        PARENT / "trajectory-python-regression.xml",
        65,
        "scripts.tests.test_nr_trajectory_reduction",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 460
        and inherited == report["source_before"] == report["source_after"],
        "qualified460 sources required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot drift",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive sources only")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def validate(directory, budget=None):
    obs = json.loads((directory / "profile-constraint-observations.json").read_text())
    N.require(
        obs["method"] == P.METHOD
        and obs["native_calls"] == 0
        and all(obs[key] is False for key in P.FALSE_FLAGS),
        "observation scope mismatch",
    )
    N.require(
        len(obs["coefficients"]) == 3
        and {r["mode"] for r in obs["coefficients"]} == {0, 1, 2},
        "three source cases required",
    )

    def load(name):
        return np.load(directory / (name + ".npy"), allow_pickle=False)

    largest_source = 0.0
    for row in obs["coefficients"]:
        mode = row["mode"]
        source, probe = load(f"source-{mode}"), load(f"source-probe-{mode}")
        expected = P.source_matrix(P.fixture(mode))
        N.require(
            source.shape == probe.shape == (58, 58)
            and source.dtype == probe.dtype == np.float64
            and np.isfinite(source).all()
            and np.isfinite(probe).all(),
            "complete source matrices required",
        )
        error = float(np.max(abs(source - probe)))
        N.require(
            error <= P.TOLERANCE
            and np.max(abs(source - expected)) <= P.TOLERANCE
            and error == row["error"],
            "source tangent discrepancy",
        )
        largest_source = max(largest_source, error)
    cases = obs["cases"]
    N.require(
        len(cases) == 21
        and {(r["mode"], r["wave_index"]) for r in cases}
        == {(m, w) for m in range(3) for w in range(7)},
        "all21 fixed combinations required",
    )
    largest_row = largest_null = 0.0
    for row in cases:
        if budget is not None:
            budget.guard()
        mode, wave_index = row["mode"], row["wave_index"]
        wave = P.WAVES[wave_index]
        N.require(tuple(row["wave"]) == wave, "wave registration mismatch")
        q = P.fixture(mode)
        arrays = {
            key: load(f"case-{mode}-{wave_index}-{key}")
            for key in ("C", "L", "B", "null", "witness")
        }
        report, _, _, _ = P.closure(arrays["C"], arrays["L"])
        N.require(
            all(row[key] == value for key, value in report.items()),
            "persisted closure report mismatch",
        )
        shapes = dict(
            C=(43, 58),
            L=(58, 58),
            B=(43, 43),
            null=(58, report["nullity"]),
            witness=(58,),
        )
        N.require(
            all(
                a.shape == shapes[key]
                and a.dtype == np.complex128
                and np.isfinite(a).all()
                for key, a in arrays.items()
            ),
            "full finite complex diagnostic arrays required",
        )
        N.require(
            np.max(abs(arrays["C"] - P.constraint_rows(q, wave))) <= P.TOLERANCE
            and np.max(abs(arrays["L"] - P.generator(q, wave))) <= P.TOLERANCE,
            "saved physical rows or full generator changed",
        )
        N.require(
            np.max(abs(arrays["C"] @ arrays["null"])) <= P.TOLERANCE
            and np.max(abs(arrays["C"] @ arrays["witness"])) <= P.TOLERANCE,
            "saved diagnostic null vectors invalid",
        )
        measured = np.max(abs(arrays["C"] @ arrays["L"] - arrays["B"] @ arrays["C"]))
        N.require(
            abs(measured - row["max_row_residual"]) <= P.TOLERANCE,
            "saved propagation matrix mismatch",
        )
        largest_row = max(largest_row, row["relative_row_residual"])
        largest_null = max(largest_null, row["relative_null_leak"])
    target, expected = P.target_compatibility(
        np.load(T.DIRECTORY / "reference.npy", allow_pickle=False)
    )
    N.require(target == obs["target"], "target compatibility observation changed")
    for key, value in expected.items():
        actual = load("target-" + key)
        N.require(
            actual.dtype == value.dtype and np.array_equal(actual, value),
            "saved target jet/rate changed: " + key,
        )
    for key in (
        "static_target_error",
        "static_full58_rate",
        "initial_boundary_full58_rate",
        "initial_boundary_value_difference",
        "initial_boundary_gradient_difference",
        "static_hamiltonian",
        "static_z",
        "static_definition",
    ):
        N.require(
            target[key] <= P.TOLERANCE, "static or initial compatibility failed: " + key
        )
    return dict(
        source_cases=3,
        symbol_cases=21,
        boundary_points=866,
        maximum_source_error=largest_source,
        maximum_relative_row_residual=largest_row,
        maximum_relative_null_leak=largest_null,
        fixed_background_constraint_kernel_closed=all(r["closed"] for r in cases),
        closed_cases=sum(r["closed"] for r in cases),
        static_and_initial_target_consistent=True,
        target=target,
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
        fixed_background_constraint_kernel_closed=False,
        static_and_initial_target_consistent=False,
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
        identity = predecessor()["volume_identity"]
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
            ("tests", 53, "scripts/tests/test_nr_profile_constraints.py"),
            ("spectral-python-regression", 66, "scripts/tests/test_nr_spectral_sat.py"),
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
                str(ROOT / "scripts/nr-profile-constraint-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            current = dict(environment)
            if phase == "tests":
                current["NR_PROFILE_CONSTRAINT_ROOT"] = str(directory)
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
                            status="profile-constraints-running",
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
            n: N.sha(ROOT / n) if (ROOT / n).is_file() else None for n in sources
        }
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        if result["passed"]:
            result["fixed_background_constraint_kernel_closed"] = result["audit"][
                "fixed_background_constraint_kernel_closed"
            ]
            result["static_and_initial_target_consistent"] = result["audit"][
                "static_and_initial_target_consistent"
            ]
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

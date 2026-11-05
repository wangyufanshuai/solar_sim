"""Bounded physical/formal constraint-symbol controls; immutable ancestry, no retries."""

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
from science.numerical_relativity import constraint_symbol_controls as S  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-constraint-jet-controls-v1-20261011"
SHA = "84ef24b08478d34841bb06e6ef614de966dbfdef6302b752a8e04dbc16ffa725"
SOURCE_CAP = 8 * 1024**2
EXTRA = (
    "science/numerical_relativity/constraint_symbol_bridge.py",
    "science/numerical_relativity/constraint_symbol_controls.py",
    "science/numerical_relativity/EXPERIMENT-20261011-constraint-symbol.md",
    "scripts/tests/test_nr_constraint_symbol.py",
    "scripts/run-nr-k3-constraint-symbol-controls.py",
)


def previous():
    return runpy.run_path(str(ROOT / "scripts/run-nr-k3-constraint-jet-controls.py"))


def sources():
    N.require(N.sha(PARENT / "qualification-gate.json") == SHA, "parent gate drift")
    gate = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, gate, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 231, "scripts.tests.test_nr_constraint_jet")
    F.check_xml(
        PARENT / "theta-z-regression.xml",
        186,
        "scripts.tests.test_nr_theta_z_feedback",
    )
    old = previous()["sources"]()
    N.require(
        len(old) == 484 and old == gate["source_before"] == gate["source_after"],
        "qualified484 required",
    )
    for name, digest in old.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "saved source drift",
        )
    N.require(not set(EXTRA).intersection(old), "additive source closure required")
    merged = N.merge_source_tables(old, {name: N.sha(ROOT / name) for name in EXTRA})
    N.require(
        sum((ROOT / name).stat().st_size for name in merged) <= SOURCE_CAP,
        "authorized8MiB exceeded",
    )
    return merged


def validate(directory, budget=None):
    observations = json.loads((directory / "observations.json").read_text())
    N.require(
        observations["method"] == S.METHOD
        and observations["native_calls"] == 0
        and all(observations[key] is False for key in S.FALSE_FLAGS),
        "scope mismatch",
    )
    N.require(
        [row["index"] for row in observations["cases"]] == list(range(21)),
        "complete ordered21 required",
    )
    maxima = {
        key: 0.0
        for key in (
            "row_error",
            "inverse_error",
            "intertwining_relative",
            "intertwining_absolute",
            "formal_action_relative",
            "jet_error",
        )
    }
    nonzero_matrix_relative, zero_matrix_difference = 0.0, 0.0
    for row in observations["cases"]:
        if budget is not None:
            budget.guard()
        index = row["index"]
        N.require(
            (row["mode"], row["wave_index"]) == S.CASES[index],
            "registered case mismatch",
        )
        arrays = {
            name: np.load(directory / f"case-{index}-{name}.npy", allow_pickle=False)
            for name in S.SHAPES
        }
        report = S.metrics(arrays)
        N.require(
            all(row[key] == value for key, value in report.items()), "metrics changed"
        )
        S.require_gates(report)
        fresh = S.compare(*S.CASES[index])
        N.require(
            all(np.array_equal(arrays[key], value) for key, value in fresh.items()),
            "deterministic replay changed",
        )
        for key in maxima:
            maxima[key] = max(maxima[key], report[key])
        if report["zero_frequency"]:
            zero_matrix_difference = max(
                zero_matrix_difference, report["formal_matrix_absolute"]
            )
        else:
            nonzero_matrix_relative = max(
                nonzero_matrix_relative, report["formal_matrix_relative"]
            )
    return dict(
        cases=21,
        **maxima,
        nonzero_matrix_relative=nonzero_matrix_relative,
        zero_off_image_matrix_difference=zero_matrix_difference,
        constraint_symbol_bridge_validated=True,
        **{key: False for key in S.FALSE_FLAGS},
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
    started, child, table = time.monotonic(), None, {}
    result = dict(
        schema=S.METHOD,
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
        parent_gate_sha256=SHA,
        constraint_symbol_bridge_validated=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            source_snapshot_bytes=SOURCE_CAP,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{key: False for key in S.FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    try:
        table = sources()
        result["source_before"] = table
        T.parent()
        identity = runpy.run_path(
            str(ROOT / "scripts/run-nr-k3-spectral-sat-controls.py")
        )["volume_identity"]
        result["native_before"] = identity()
        runpy.run_path(str(ROOT / "scripts/run-nr-k3-offsurface-feedback-controls.py"))[
            "save_snapshot"
        ](budget, table)
        env = {
            key: value
            for key, value in os.environ.items()
            if not (key.startswith("NR_") and key.endswith("_ROOT"))
        }
        env.update(
            PYTHONDONTWRITEBYTECODE="1",
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(directory),
            TMP=str(directory),
        )
        for phase, count, script in (
            ("tests", 131, "test_nr_constraint_symbol"),
            ("constraint-jet-regression", 231, "test_nr_constraint_jet"),
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
                "scripts/tests/" + script + ".py",
            ]
            current = dict(env)
            if phase == "tests":
                current["NR_CONSTRAINT_SYMBOL_ROOT"] = str(directory)
            row = dict(phase=phase, expected_tests=count, tests=0, returncode=None)
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
                            status="constraint-symbol-controls-running",
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
            F.check_xml(directory / (phase + ".xml"), count, "scripts.tests." + script)
            row.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
            result["tests" if phase == "tests" else "regression_tests"] = count
        result["audit"] = validate(directory, budget)
        N.require(sources() == table, "qualified source drift")
        T.parent()
        result["native_after"] = identity()
        N.require(result["native_before"] == result["native_after"], "native drift")
        budget.guard()
        result.update(
            completed=True, passed=True, constraint_symbol_bridge_validated=True
        )
    except Exception as err:
        result["errors"].append(f"{type(err).__name__}: {err}")
        if child is not None and child.poll() is None:
            print(
                json.dumps(dict(status="stopping-owned-controls", reason=str(err))),
                flush=True,
            )
            runpy.run_path(
                str(ROOT / "scripts/run-nr-k3-native-continuation-controls.py")
            )["stop_owned"](child)
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in table
        }
        if result["source_after"] != table:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["constraint_symbol_bridge_validated"] = result["passed"]
        result["artifact_hashes"] = {
            path.relative_to(directory).as_posix(): N.sha(path)
            for path in sorted(directory.rglob("*"))
            if path.is_file()
        }
        budget.record("qualification-gate.json", result, finalizing=True)
    print(
        json.dumps(
            {
                key: result[key]
                for key in (
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

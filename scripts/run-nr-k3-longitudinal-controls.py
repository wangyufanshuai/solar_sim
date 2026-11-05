"""Bounded derivative-aware reduction controls; preserve all prior failures."""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
from science.numerical_relativity import longitudinal_constraint_controls as C  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-constraint-order-controls-v1-20261012"
SHA = "b0baa81718d8faad6af9a7784dd58dda42a1f008608ef89db9eb6287908f8045"
EXTRA = (
    "science/numerical_relativity/longitudinal_constraint_reduction.py",
    "science/numerical_relativity/longitudinal_constraint_controls.py",
    "science/numerical_relativity/EXPERIMENT-20261012-longitudinal-constraints.md",
    "scripts/tests/test_nr_longitudinal_constraints.py",
    "scripts/run-nr-k3-longitudinal-controls.py",
)


def sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == SHA, "pinned order parent changed"
    )
    gate = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "successful order controls required",
    )
    N.require(
        gate["tests"] == 93
        and gate["regression_tests"] == 131
        and all(gate[key] is False for key in C.FALSE_FLAGS),
        "parent scope changed",
    )
    F.verify_inventory(PARENT, gate, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 93, "scripts.tests.test_nr_constraint_order")
    F.check_xml(
        PARENT / "symbol-regression.xml", 131, "scripts.tests.test_nr_constraint_symbol"
    )
    inherited = runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-constraint-order-controls.py")
    )["sources"]()
    N.require(
        len(inherited) == 496
        and inherited == gate["source_before"] == gate["source_after"]
        and not set(EXTRA).intersection(inherited),
        "immutable496 source ancestry required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent source snapshot drift",
        )
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def validate(directory, budget):
    obs = json.loads((directory / "observations.json").read_text())
    N.require(
        obs["method"] == C.METHOD
        and obs["native_calls"] == obs["integration_steps"] == 0
        and all(obs[key] is False for key in C.FALSE_FLAGS),
        "observation scope changed",
    )
    N.require(
        [row["index"] for row in obs["cases"]] == list(range(27)),
        "complete ordered27 cases required",
    )
    maxima, smallest = {}, dict(leading=float("inf"), finite=float("inf"))
    for row in obs["cases"]:
        budget.guard()
        index = row["index"]
        case = C.CASES[index]
        N.require((row["mode"], row["wave_index"]) == case, "fixed case changed")
        a = {
            name: np.load(directory / f"case-{index}-{name}.npy", allow_pickle=False)
            for name in C.SHAPES
        }
        report = C.metrics(a, *case)
        N.require(
            all(row[key] == value for key, value in report.items()),
            "saved metrics changed",
        )
        C.require_gates(report)
        fresh = C.compare(*case)
        N.require(
            all(np.array_equal(a[name], value) for name, value in fresh.items()),
            "exact replay changed",
        )
        for key, value in report.items():
            if key.endswith(("_error", "_relative", "_max")):
                maxima[key] = max(maxima.get(key, 0.0), value)
        smallest["leading"] = min(
            smallest["leading"], report["leading_smallest_singular"]
        )
        smallest["finite"] = min(smallest["finite"], report["finite_smallest_singular"])
        budget.record(
            f"replay-{index:02d}.json",
            dict(index=index, passed=True, arrays=len(a), report=report),
        )
    return dict(
        cases=27,
        arrays=27 * len(C.SHAPES),
        maxima=maxima,
        smallest_singular=smallest,
        longitudinal_order_reduction_validated=True,
        **{key: False for key in C.FALSE_FLAGS},
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct evidence directory required",
    )
    N.require(
        all(
            os.environ.get(key) == "1"
            for key in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread environment required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    directory.mkdir()
    started, child, table = time.monotonic(), None, {}
    result = dict(
        schema=C.METHOD,
        completed=False,
        passed=False,
        errors=[],
        phase="intake",
        suites=[],
        source_before={},
        source_after={},
        native_before={},
        native_after={},
        tests=0,
        regression_tests=0,
        native_calls=0,
        integration_steps=0,
        parent_gate_sha256=SHA,
        longitudinal_order_reduction_validated=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            source_snapshot_bytes=8 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{key: False for key in C.FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    budget.record(
        "process.json", dict(pid=os.getpid(), command=sys.argv, retries=0, owned=True)
    )
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
            ("tests", 52, "test_nr_longitudinal_constraints"),
            ("order-regression", 93, "test_nr_constraint_order"),
        ):
            result["phase"] = phase
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
                current["NR_LONGITUDINAL_ROOT"] = str(directory)
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
                    dict(pid=child.pid, command=command, owned=True, retries=0),
                )
                print(
                    json.dumps(
                        dict(
                            status="longitudinal-controls-running",
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
        result["phase"] = "exact-replay"
        result["audit"] = validate(directory, budget)
        result["phase"] = "final-integrity"
        N.require(sources() == table, "source drift")
        for name, digest in table.items():
            N.require(
                N.sha(N.contained(directory / "source-snapshot", name)) == digest,
                "new source snapshot drift",
            )
        T.parent()
        result["native_after"] = identity()
        N.require(
            result["native_before"] == result["native_after"], "native identity drift"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            phase="complete",
            longitudinal_order_reduction_validated=True,
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
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in table
        }
        if result["source_after"] != table:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["longitudinal_order_reduction_validated"] = result["passed"]
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
                    "phase",
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

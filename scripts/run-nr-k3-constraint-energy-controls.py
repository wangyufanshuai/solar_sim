"""Bounded spectral-projector/energy controls with immutable ancestry."""

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

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402

PARENT = G.EVIDENCE / "nr-k3-longitudinal-controls-v1-20261012"
SHA = "ffb93ab382da9d28019586e0e3b674ca414c1a4b577c261bdf3ee74f3461438a"
EXTRA = (
    "science/numerical_relativity/constraint_projector_energy.py",
    "science/numerical_relativity/constraint_energy_controls.py",
    "science/numerical_relativity/EXPERIMENT-20261012-constraint-energy.md",
    "scripts/tests/test_nr_constraint_energy.py",
    "scripts/run-nr-k3-constraint-energy-controls.py",
    "scripts/nr_owned_control.py",
)


def initialize_worker():
    # Scientific imports and every replay run only inside the owned process tree.
    global np, C, T, N, F
    import numpy as np
    from science.numerical_relativity import constraint_energy_controls as C
    from science.numerical_relativity import trajectory_reduction_balance as T

    N, F = T.N, T.F


def sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == SHA,
        "pinned longitudinal parent changed",
    )
    gate = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "successful longitudinal controls required",
    )
    N.require(
        gate["tests"] == 52
        and gate["regression_tests"] == 93
        and all(gate[key] is False for key in C.FALSE_FLAGS),
        "parent scope changed",
    )
    F.verify_inventory(PARENT, gate, "qualification-gate.json")
    F.check_xml(
        PARENT / "tests.xml", 52, "scripts.tests.test_nr_longitudinal_constraints"
    )
    F.check_xml(
        PARENT / "order-regression.xml", 93, "scripts.tests.test_nr_constraint_order"
    )
    inherited = runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-longitudinal-controls.py")
    )["sources"]()
    N.require(
        len(inherited) == 501
        and inherited == gate["source_before"] == gate["source_after"]
        and not set(EXTRA).intersection(inherited),
        "immutable501 source ancestry required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot drift",
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
        [row["index"] for row in obs["cases"]] == list(range(66)),
        "complete ordered66 cases required",
    )
    maxima, energy_min, energy_max, condition = {}, float("inf"), 0.0, 0.0
    multiplicities = []
    for row in obs["cases"]:
        budget.guard()
        index = row["index"]
        a = {
            name: np.load(directory / f"case-{index}-{name}.npy", allow_pickle=False)
            for name in C.SHAPES
        }
        report = C.metrics(a, index)
        N.require(
            all(row[key] == value for key, value in report.items()),
            "saved metrics changed",
        )
        C.require_gates(report)
        fresh = C.compare(index)
        N.require(
            all(np.array_equal(a[name], value) for name, value in fresh.items()),
            "exact replay changed",
        )
        for prefix, values in (
            ("", report),
            ("constraint_", report["constraint"]),
            ("full_state_", report["full_state"]),
        ):
            for key, value in values.items():
                if key.endswith(("_relative", "_error", "_deficit")):
                    maxima[prefix + key] = max(maxima.get(prefix + key, 0.0), value)
        energy_min, energy_max = (
            min(energy_min, report["energy_min"]),
            max(energy_max, report["energy_max"]),
        )
        condition = max(condition, report["energy_condition"])
        multiplicities.append([r[0] for r in report["constraint"]["ranks"]])
        budget.record(
            f"replay-{index:02d}.json",
            dict(index=index, passed=True, arrays=len(a), report=report),
        )
        if index % 9 == 8 or index == 65:
            print(
                json.dumps(
                    dict(status="energy-replay", completed_cases=index + 1, total=66)
                ),
                flush=True,
            )
    N.require(
        [row["mode"] for row in obs["precision_controls"]] == [0, 1, 2],
        "three precision controls required",
    )
    for row in obs["precision_controls"]:
        budget.guard()
        N.require(row == C.precision_probe(row["mode"]), "precision replay changed")
        N.require(
            row["constraint_relative"] <= C.TOLERANCE
            and row["full_state_relative"] <= C.TOLERANCE,
            "precision control failed",
        )
    return dict(
        cases=66,
        arrays=66 * len(C.SHAPES),
        maxima=maxima,
        energy_min=energy_min,
        energy_max=energy_max,
        energy_condition_max=condition,
        constraint_multiplicities=multiplicities,
        precision_controls=obs["precision_controls"],
        fixed_projector_energy_validated=True,
        **{key: False for key in C.FALSE_FLAGS},
    )


def worker(directory):
    G.require(
        bool(os.environ.get("NR_OWNED_CONTROL_RUN_ID")),
        "owned supervisor required before scientific imports",
    )
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        token["run_id"] == os.environ["NR_OWNED_CONTROL_RUN_ID"]
        and token["passed"] is False,
        "prepared supervisor identity required",
    )
    initialize_worker()
    N.require(
        directory.parent == N.EVIDENCE and directory.is_dir(),
        "prepared direct evidence directory required",
    )
    N.require(
        all(
            os.environ.get(key) == "1"
            for key in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread environment required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
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
        fixed_projector_energy_validated=False,
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
            ("tests", 100, "test_nr_constraint_energy"),
            ("longitudinal-regression", 52, "test_nr_longitudinal_constraints"),
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
                current["NR_CONSTRAINT_ENERGY_ROOT"] = str(directory)
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
                            status="energy-controls-running", phase=phase, pid=child.pid
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
                "new snapshot drift",
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
            fixed_projector_energy_validated=True,
        )
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        if child is not None and child.poll() is None:
            print(
                json.dumps(
                    dict(status="stopping-owned-controls", reason="worker finalization")
                ),
                flush=True,
            )
            runpy.run_path(
                str(ROOT / "scripts/run-nr-k3-native-continuation-controls.py")
            )["stop_owned"](child)
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in table
        }
        if result["source_after"] != table:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["fixed_projector_energy_validated"] = result["passed"]
        result["completed"] = result["passed"]
        # This is a proposal, never the authoritative terminal. Resource failure
        # here is caught by the outer supervisor using its preallocated receipt.
        budget.record("worker-result.json", result, finalizing=True)
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


def finalizer(directory, budget):
    budget.guard()
    result = json.loads((directory / "worker-result.json").read_text(encoding="utf-8"))
    G.require(
        result["completed"] is result["passed"] is True and not result["errors"],
        "worker did not qualify",
    )
    G.require(
        result["tests"] == 100
        and result["regression_tests"] == 52
        and result["native_calls"] == result["integration_steps"] == 0,
        "worker control scope changed",
    )
    G.require(
        result["parent_gate_sha256"] == SHA
        and result["source_before"] == result["source_after"]
        and result["native_before"] == result["native_after"],
        "worker identity mismatch",
    )
    G.require(
        result["fixed_projector_energy_validated"] is True
        and result["scientificPayloadWriteback"] is False,
        "worker admission scope changed",
    )
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    directory = args.output_directory.resolve()
    if args.guard_worker:
        return worker(directory)
    command = [
        sys.executable,
        "-B",
        str(Path(__file__).resolve()),
        "--guard-worker",
        "--output-directory",
        str(directory),
    ]
    result = G.supervise(command, directory, finalizer=finalizer)
    print(
        json.dumps({key: result[key] for key in ("completed", "passed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

"""Bounded Theta/Z controls with immutable ancestry, exact replay and no retries."""

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
from science.numerical_relativity import offsurface_z4_feedback as Q  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-offsurface-feedback-controls-v1-20261011"
SHA = "8c4c01eb08cd64ab64aee1b359021b05a22897a651d05824847f6855bfd37042"
SOURCE_CAP = 8 * 1024**2
EXTRA = (
    "science/numerical_relativity/offsurface_z4_feedback.py",
    "science/numerical_relativity/EXPERIMENT-20261011-theta-z-feedback.md",
    "scripts/tests/test_nr_theta_z_feedback.py",
    "scripts/run-nr-k3-theta-z-feedback-controls.py",
)


def previous():
    return runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-offsurface-feedback-controls.py")
    )


def sources():
    N.require(N.sha(PARENT / "qualification-gate.json") == SHA, "parent gate drift")
    g = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        g["completed"] is g["passed"] is True and not g["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, g, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 160, "scripts.tests.test_nr_offsurface_feedback")
    F.check_xml(
        PARENT / "curved-regression.xml", 67, "scripts.tests.test_nr_curved_constraints"
    )
    old = previous()["sources"]()
    N.require(
        len(old) == 475 and old == g["source_before"] == g["source_after"],
        "qualified475 required",
    )
    for name, digest in old.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "saved source drift",
        )
    N.require(not set(EXTRA).intersection(old), "additive source closure required")
    merged = N.merge_source_tables(old, {n: N.sha(ROOT / n) for n in EXTRA})
    N.require(
        sum((ROOT / n).stat().st_size for n in merged) <= SOURCE_CAP,
        "authorized8MiB exceeded",
    )
    return merged


def validate(directory, budget=None):
    obs = json.loads((directory / "observations.json").read_text())
    N.require(
        obs["method"] == Q.METHOD
        and obs["native_calls"] == 0
        and obs["term_names"] == list(Q.TERM_NAMES)
        and all(obs[k] is False for k in Q.FALSE_FLAGS),
        "scope mismatch",
    )
    N.require(
        [r["index"] for r in obs["cases"]] == list(range(132)),
        "complete ordered132 required",
    )
    maxima = dict(z4_error=0.0, rates43_error=0.0, bridge_error=0.0)
    for row in obs["cases"]:
        if budget is not None:
            budget.guard()
        i = row["index"]
        N.require(
            (row["mode"], row["pattern"]) == Q.CASES[i], "registered case mismatch"
        )
        arrays = {
            n: np.load(directory / f"case-{i}-{n}.npy", allow_pickle=False)
            for n in Q.SHAPES
        }
        report = Q.metrics(arrays)
        N.require(all(row[k] == v for k, v in report.items()), "metrics changed")
        q = Q.Jet(arrays["inputs"])
        N.require(np.array_equal(q.c, Q.fixture(*Q.CASES[i]).c), "input drift")
        fresh = Q.compare(q)
        N.require(
            all(np.array_equal(arrays[k], v) for k, v in fresh.items()),
            "deterministic replay changed",
        )
        for key in maxima:
            N.require(report[key] <= Q.TOLERANCE, key + " failed")
            maxima[key] = max(maxima[key], report[key])
        if row["pattern"] == "clean":
            N.require(
                np.max(abs(arrays["correction_terms"])) <= Q.TOLERANCE,
                "clean correction changed",
            )
        if row["pattern"] == "nonunit-mixed":
            N.require(
                np.min(np.max(abs(arrays["correction_terms"]), axis=1)) > 1e-8,
                "ineffective omission control",
            )
    return dict(
        cases=132,
        **maxima,
        instantaneous_theta_z_validated=True,
        instantaneous43_assembly_validated=True,
        **{k: False for k in Q.FALSE_FLAGS},
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    d = parser.parse_args().output_directory.resolve()
    N.require(
        d.parent == N.EVIDENCE and not d.exists(),
        "fresh direct evidence directory required",
    )
    b = N.Budget(d, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    d.mkdir()
    started, child, table = time.monotonic(), None, {}
    result = dict(
        schema=Q.METHOD,
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
        instantaneous_theta_z_validated=False,
        instantaneous43_assembly_validated=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            source_snapshot_bytes=SOURCE_CAP,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{k: False for k in Q.FALSE_FLAGS},
    )
    b.record("attempt.json", result)
    try:
        table = sources()
        result["source_before"] = table
        T.parent()
        identity = runpy.run_path(
            str(ROOT / "scripts/run-nr-k3-spectral-sat-controls.py")
        )["volume_identity"]
        result["native_before"] = identity()
        previous()["save_snapshot"](b, table)
        env = {
            k: v
            for k, v in os.environ.items()
            if not (k.startswith("NR_") and k.endswith("_ROOT"))
        }
        env.update(
            PYTHONDONTWRITEBYTECODE="1",
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(d),
            TMP=str(d),
        )
        for phase, count, script in (
            ("tests", 186, "test_nr_theta_z_feedback"),
            ("offsurface-regression", 160, "test_nr_offsurface_feedback"),
        ):
            b.guard()
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
                str(d / (phase + "-temp")),
                "--junitxml",
                str(d / (phase + ".xml")),
                "scripts/tests/" + script + ".py",
            ]
            current = dict(env)
            if phase == "tests":
                current["NR_THETA_Z_ROOT"] = str(d)
            row = dict(phase=phase, expected_tests=count, tests=0, returncode=None)
            result["suites"].append(row)
            with (d / (phase + ".log")).open("xb") as log:
                child = subprocess.Popen(
                    command,
                    cwd=ROOT,
                    env=current,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
                b.record(
                    phase + "-process.json",
                    dict(pid=child.pid, owned=True, retries=0, command=command),
                )
                print(
                    json.dumps(
                        dict(
                            status="theta-z-controls-running",
                            phase=phase,
                            pid=child.pid,
                        )
                    ),
                    flush=True,
                )
                while child.poll() is None:
                    b.guard()
                    time.sleep(0.5)
                row["returncode"] = child.returncode
            b.guard()
            N.require(child.returncode == 0, phase + " failed; no automatic retry")
            F.check_xml(d / (phase + ".xml"), count, "scripts.tests." + script)
            row.update(tests=count, xml_sha256=N.sha(d / (phase + ".xml")))
            result["tests" if phase == "tests" else "regression_tests"] = count
        result["audit"] = validate(d, b)
        N.require(sources() == table, "qualified source drift")
        T.parent()
        result["native_after"] = identity()
        N.require(result["native_before"] == result["native_after"], "native drift")
        b.guard()
        result.update(
            completed=True,
            passed=True,
            instantaneous_theta_z_validated=True,
            instantaneous43_assembly_validated=True,
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
            n: N.sha(ROOT / n) if (ROOT / n).is_file() else None for n in table
        }
        if result["source_after"] != table:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["instantaneous_theta_z_validated"] = result["passed"]
        result["instantaneous43_assembly_validated"] = result["passed"]
        result["artifact_hashes"] = {
            p.relative_to(d).as_posix(): N.sha(p)
            for p in sorted(d.rglob("*"))
            if p.is_file()
        }
        b.record("qualification-gate.json", result, finalizing=True)
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

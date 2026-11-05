"""Bounded offsurface feedback controls; immutable ancestry and no retries."""

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
from science.numerical_relativity import offsurface_physical_feedback as P  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-curved-constraint-controls-v1-20261011"
SHA = "ac804c25099ccc73470e135dd60ac185a3473326c4ea77000bc662d3cd3d2567"
SOURCE_CAP = 8 * 1024**2  # Explicit user approval; no other resource cap changes.
EXTRA = (
    "science/numerical_relativity/offsurface_physical_feedback.py",
    "science/numerical_relativity/EXPERIMENT-20261011-offsurface-feedback.md",
    "scripts/tests/test_nr_offsurface_feedback.py",
    "scripts/run-nr-k3-offsurface-feedback-controls.py",
)


def previous():
    return runpy.run_path(str(ROOT / "scripts/run-nr-k3-curved-constraint-controls.py"))


def save_checked_payloads(budget, table, payloads):
    """Check the complete in-memory snapshot before its first exclusive write."""
    N.require(set(payloads) == set(table), "complete snapshot keys required")
    N.require(
        all(type(raw) is bytes for raw in payloads.values()),
        "immutable snapshot bytes required",
    )
    N.require(
        sum(map(len, payloads.values())) <= SOURCE_CAP,
        "authorized 8 MiB source snapshot budget exceeded",
    )
    for name, raw in payloads.items():
        N.require(
            N.codec.sha(raw) == table[name], "source changed before snapshot: " + name
        )
    for name, raw in payloads.items():
        budget.save("source-snapshot/" + name, raw)


def save_snapshot(budget, table):
    """Additive 8 MiB entry point; the frozen 4 MiB saver is unchanged."""
    N.require(table == N.merge_source_tables(table), "canonical source table required")
    payloads = {name: N.contained(ROOT, name).read_bytes() for name in table}
    save_checked_payloads(budget, table, payloads)


def sources():
    N.require(N.sha(PARENT / "qualification-gate.json") == SHA, "parent gate drift")
    p = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        p["completed"] is p["passed"] is True and not p["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, p, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 67, "scripts.tests.test_nr_curved_constraints")
    F.check_xml(
        PARENT / "profile-python-regression.xml",
        53,
        "scripts.tests.test_nr_profile_constraints",
    )
    inherited = previous()["qualified_sources"]()
    N.require(
        len(inherited) == 471 and inherited == p["source_before"] == p["source_after"],
        "qualified471 required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "snapshot drift",
        )
    N.require(
        not set(EXTRA).intersection(inherited), "additive source closure required"
    )
    all_sources = N.merge_source_tables(inherited, {n: N.sha(ROOT / n) for n in EXTRA})
    N.require(
        sum((ROOT / n).stat().st_size for n in all_sources) <= SOURCE_CAP,
        "authorized source cap exceeded",
    )
    return all_sources


def validate(directory, budget=None):
    obs = json.loads((directory / "observations.json").read_text())
    N.require(
        obs["method"] == P.METHOD
        and obs["native_calls"] == 0
        and all(obs[k] is False for k in P.FALSE_FLAGS),
        "scope mismatch",
    )
    N.require(
        [r["index"] for r in obs["cases"]] == list(range(126)),
        "complete ordered cases required",
    )
    largest = 0.0
    probe = 0.0
    for row in obs["cases"]:
        if budget is not None:
            budget.guard()
        i = row["index"]
        N.require(
            (row["mode"], row["pattern"]) == P.CASES[i], "fixture identity mismatch"
        )
        a = {
            n: np.load(directory / f"case-{i}-{n}.npy", allow_pickle=False)
            for n in (
                "inputs",
                "direct",
                "baseline",
                "correction",
                "predicted",
                "defects",
                "metric_rate",
                "extrinsic_rate",
                "probe_errors",
            )
        }
        report = P.metrics(a)
        N.require(all(row[k] == v for k, v in report.items()), "metrics mismatch")
        q = P.Jet(a["inputs"])
        N.require(np.array_equal(q.c, P.fixture(*P.CASES[i]).c), "input drift")
        expected = P.compare(q)
        N.require(
            all(np.array_equal(a[k], v) for k, v in expected.items()),
            "deterministic array drift",
        )
        N.require(
            report["identity_error"] <= P.TOLERANCE
            and report["derivative_probe_error"] <= P.TOLERANCE,
            "identity/probe gate failed",
        )
        if row["pattern"] == "clean":
            N.require(
                max(report["omitted_feedback"], report["defect_max"]) <= P.TOLERANCE,
                "clean feedback changed",
            )
        else:
            N.require(report["defect_max"] > 1e-6, "nonzero defect required")
        largest = max(largest, report["identity_error"])
        probe = max(probe, report["derivative_probe_error"])
    return dict(
        cases=126,
        identity_error=largest,
        derivative_probe_error=probe,
        instantaneous_feedback_validated=True,
        **{k: False for k in P.FALSE_FLAGS},
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
        parent_gate_sha256=SHA,
        instantaneous_feedback_validated=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            source_snapshot_bytes=SOURCE_CAP,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{k: False for k in P.FALSE_FLAGS},
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
        save_snapshot(b, table)
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
            ("tests", 160, "test_nr_offsurface_feedback"),
            ("curved-regression", 67, "test_nr_curved_constraints"),
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
                current["NR_OFFSURFACE_ROOT"] = str(d)
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
                            status="offsurface-controls-running",
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
            completed=True, passed=True, instantaneous_feedback_validated=True
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
        result["instantaneous_feedback_validated"] = result["passed"]
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

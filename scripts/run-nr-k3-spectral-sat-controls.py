"""Bounded independent SAT controls and fixed saved-stage probes; no evolution."""

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
from science.numerical_relativity import saved_sat_audit as P  # noqa: E402

N, F, S = P.N, P.T.F, P.S
PARENT = N.EVIDENCE / "nr-k3-trajectory-reduction-controls-v1-20261011"
PARENT_SHA = "5cf975241c24cc97de9dc639257dfc965584a582852e39f660c0b6ac99cc7104"
EXTRA = (
    "science/numerical_relativity/spectral_sat_oracle.py",
    "science/numerical_relativity/saved_sat_audit.py",
    "science/numerical_relativity/EXPERIMENT-20261011-spectral-sat.md",
    "scripts/tests/test_nr_spectral_sat.py",
    "scripts/nr-spectral-sat-tests.ini",
    "scripts/run-nr-k3-spectral-sat-controls.py",
)


def predecessor():
    return runpy.run_path(
        str(ROOT / "scripts/run-nr-k3-trajectory-reduction-controls.py")
    )


def volume_identity():
    return predecessor()["volume_identity"]()


def qualified_sources():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA, "parent gate drift"
    )
    parent = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        parent["completed"] is parent["passed"] is True and not parent["errors"],
        "green parent required",
    )
    F.verify_inventory(PARENT, parent, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 65, "scripts.tests.test_nr_trajectory_reduction")
    F.check_xml(
        PARENT / "discrete-python-regression.xml",
        79,
        "scripts.tests.test_nr_discrete_reduction",
    )
    inherited = predecessor()["qualified_sources"]()
    N.require(
        len(inherited) == 454
        and inherited == parent["source_before"] == parent["source_after"],
        "qualified454 sources required",
    )
    for name, digest in inherited.items():
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "parent snapshot drift",
        )
    N.require(not set(inherited).intersection(EXTRA), "additive sources required")
    return N.merge_source_tables(
        inherited, {name: N.sha(ROOT / name) for name in EXTRA}
    )


def validate_controls(directory):
    obs = json.loads((directory / "spectral-sat-observations.json").read_text())
    N.require(
        obs["method"] == S.METHOD
        and obs["native_calls"] == 0
        and obs["new_scientific_evolution"] is False,
        "control scope mismatch",
    )
    rows = obs["coefficient_cases"]
    N.require(
        len(rows) == 9
        and {(r["mode"], r["axis"]) for r in rows}
        == {(m, a) for m in range(3) for a in range(3)},
        "complete nine coefficient cases required",
    )
    largest = 0.0
    for row in rows:
        for value in (
            row["principal_error"],
            row["absolute_error"],
            row["algebra_error"],
            *row["penalty_errors"],
        ):
            N.require(0 <= value <= S.TOLERANCE, "coefficient comparison failed")
            largest = max(largest, value)
        arrays = {
            name: np.load(
                directory / f"coefficient-{row['mode']}-{row['axis']}-{name}.npy",
                allow_pickle=False,
            )
            for name in (
                "principal",
                "absolute",
                "production_principal",
                "production_absolute",
            )
        }
        N.require(
            all(
                a.shape == (58, 58) and a.dtype == np.float64 and np.isfinite(a).all()
                for a in arrays.values()
            ),
            "complete coefficient matrices required",
        )
        N.require(
            float(np.max(abs(arrays["principal"] - arrays["production_principal"])))
            <= S.TOLERANCE
            and float(np.max(abs(arrays["absolute"] - arrays["production_absolute"])))
            <= S.TOLERANCE,
            "saved coefficient comparison failed",
        )
    return dict(cases=9, maximum_comparison_error=largest)


def validate_saved(directory, budget=None):
    result = json.loads((directory / "saved-sat-result.json").read_text())
    N.require(
        result["method"] == S.METHOD
        and result["completed"] is True
        and result["native_calls"] == 0,
        "complete saved audit required",
    )
    N.require(
        all(result[k] is False for k in P.FALSE_FLAGS),
        "scientific scope escalation forbidden",
    )
    N.require(
        result["parent_receipt_sha256"] == P.T.RECEIPT_SHA
        and result["parent_audit_sha256"] == P.T.AUDIT_SHA,
        "pinned scientific parent required",
    )
    N.require(
        (result["stages"], result["points"], result["face_terms"]) == (6, 156, 324)
        and len(result["cases"]) == 6,
        "complete fixed coverage required",
    )
    for key in ("max_rhs_error", "max_interior_full58_error", "max_ode_penalty"):
        N.require(0 <= result[key] <= S.TOLERANCE, "saved audit failed")
    maximum = precision_error = 0.0
    for record, (count, phase) in zip(
        result["cases"],
        [(n, p) for n in (7, 14, 28) for p in ("first", "last")],
        strict=True,
    ):
        label = f"native-gauge-continuation-13-{count}"
        index, stage = (count, 1) if phase == "first" else (2 * count - 1, 4)
        tick = 2 * index + (0 if phase == "first" else 2)
        N.require(
            (
                record["label"],
                record["phase"],
                record["step"],
                record["stage"],
                record["boundary_tick"],
                record["time"],
                record["dt"],
            )
            == (
                label,
                phase,
                index,
                stage,
                tick,
                tick / (32 * count),
                1 / (16 * count),
            ),
            "fixed saved stage identity changed",
        )
        stem = f"{label}-{phase}"
        N.require(
            json.loads((directory / f"probes/{stem}.json").read_text()) == record,
            "saved record changed",
        )
        shapes = dict(
            q=(26, 58),
            dq=(26, 3, 58),
            rhs=(26, 58),
            bulk=(26, 58),
            penalty=(26, 58),
            principal=(54, 58, 58),
            jump=(54, 58),
            term=(54, 58),
        )
        arrays = {
            k: np.load(directory / f"probes/{stem}-{k}.npy", allow_pickle=False)
            for k in shapes
        }
        N.require(
            all(
                v.shape == shapes[k] and v.dtype == np.float64 and np.isfinite(v).all()
                for k, v in arrays.items()
            ),
            "finite complete saved probe arrays required",
        )
        N.require(
            [tuple(p["point"]) for p in record["points"]] == list(P.points())
            and len(record["faces"]) == 54,
            "all26 point strata and54 face incidences required",
        )
        used = []
        for j, row in enumerate(record["points"]):
            point = tuple(row["point"])
            expected = [
                (a, s)
                for a in range(3)
                for s in range(2)
                if point[a] == (0 if s == 0 else 12)
            ]
            indices = row["face_indices"]
            N.require(
                [
                    (record["faces"][k]["axis"], record["faces"][k]["side"])
                    for k in indices
                ]
                == expected,
                "incident face ordering changed",
            )
            N.require(
                row["region"] == {1: "faces", 2: "edges", 3: "corners"}[len(expected)],
                "stratum mismatch",
            )
            used.extend(indices)
            sum_terms = np.sum(arrays["term"][indices], axis=0)
            N.require(
                np.max(abs(sum_terms - arrays["penalty"][j])) <= S.TOLERANCE,
                "face sums changed",
            )
            error = float(np.max(abs(arrays["rhs"][j] - arrays["bulk"][j] - sum_terms)))
            N.require(
                error <= S.TOLERANCE and abs(error - row["error"]) <= S.TOLERANCE,
                "saved full58 closure mismatch",
            )
            maximum = max(maximum, error)
        N.require(sorted(used) == list(range(54)), "every face incidence required once")
        for j, face in enumerate(record["faces"]):
            if budget is not None:
                budget.guard()
            N.require(
                face["weight"] == (1 / 6) * 17 / 48, "original SBP face weight required"
            )
            split = S.SpectralSAT(
                arrays["principal"][j], np.array(face["roots"]), face["advection"]
            )
            recomputed = split.penalty(
                arrays["jump"][j], face["side"], face["weight"], precision=70
            )
            error = float(np.max(abs(recomputed - arrays["term"][j])))
            N.require(error <= S.TOLERANCE, "saved50/70 digit penalty discrepancy")
            precision_error = max(precision_error, error)
    return dict(
        stages=6,
        points=156,
        face_terms=324,
        saved_full58_error=maximum,
        decimal50_70_error=precision_error,
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
        schema="nr-spectral-sat-controls-v1",
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
        independent_sat_action_consistent=False,
        sampled_boundary_rhs_consistent=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{k: False for k in P.FALSE_FLAGS},
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
            NR_SAVED_SAT_ROOT=str(directory),
        )
        for name in (
            "NR_INITIAL_ADM_CONTROL_ROOT",
            "NR_CONTINUUM_ADM_CONTROL_ROOT",
            "NR_NONZERO_Z4_CONTROL_ROOT",
            "NR_REDUCTION_CONTROL_ROOT",
            "NR_FORMAL_CONTROL_ROOT",
            "NR_DISCRETE_CONTROL_ROOT",
            "NR_SPECTRAL_CONTROL_ROOT",
        ):
            environment.pop(name, None)
        phases = []
        for phase, count, script in (
            ("tests", 66, "scripts/tests/test_nr_spectral_sat.py"),
            (
                "trajectory-python-regression",
                65,
                "scripts/tests/test_nr_trajectory_reduction.py",
            ),
        ):
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
                str(ROOT / "scripts/nr-spectral-sat-tests.ini"),
                "--basetemp",
                str(directory / (phase + "-temp")),
                "--junitxml",
                str(directory / (phase + ".xml")),
                script,
            ]
            phases.append((phase, count, script, command))
        phases.append(
            (
                "saved-analysis",
                0,
                "",
                [
                    sys.executable,
                    "-B",
                    "-m",
                    "science.numerical_relativity.saved_sat_audit",
                    "--output-directory",
                    str(directory),
                    "--deadline",
                    str(budget.deadline),
                ],
            )
        )
        for phase, count, script, command in phases:
            budget.guard()
            current = dict(environment)
            if phase == "tests":
                current["NR_SPECTRAL_CONTROL_ROOT"] = str(directory)
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
                            status="spectral-sat-controls-running",
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
            if count:
                F.check_xml(
                    directory / (phase + ".xml"), count, script[:-3].replace("/", ".")
                )
                row.update(tests=count, xml_sha256=N.sha(directory / (phase + ".xml")))
                result["tests" if phase == "tests" else "regression_tests"] = count
        result["coefficient_audit"] = validate_controls(directory)
        result["saved_array_audit"] = validate_saved(directory, budget)
        N.require(qualified_sources() == sources, "qualified source drift")
        result["native_after"] = volume_identity()
        N.require(
            result["native_before"] == result["native_after"], "native identity drift"
        )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            analysis_sha256=N.sha(directory / "saved-sat-result.json"),
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
            n: N.sha(ROOT / n) if (ROOT / n).is_file() else None for n in sources
        }
        if result["source_after"] != sources:
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["independent_sat_action_consistent"] = result["passed"]
        result["sampled_boundary_rhs_consistent"] = result["passed"]
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

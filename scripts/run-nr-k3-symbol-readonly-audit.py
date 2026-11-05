"""Authorized read-only replay with exclusive progress and terminal receipts."""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import runpy
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
from science.numerical_relativity import constraint_symbol_controls as S  # noqa: E402
from science.numerical_relativity import trajectory_reduction_balance as T  # noqa: E402

N, F = T.N, T.F
PARENT = N.EVIDENCE / "nr-k3-constraint-symbol-controls-v1-20261011"
PARENT_SHA = "46199dc7bf8e710bd8dc1261f368c50b41a848980e901660cfdb36ce109c7dfd"
AUDIT_SOURCES = (
    "science/numerical_relativity/EXPERIMENT-20261012-symbol-readonly.md",
    "scripts/run-nr-k3-symbol-readonly-audit.py",
)
METHOD = "nr-constraint-symbol-readonly-audit-v1"


def parent_evidence():
    N.require(
        N.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "pinned parent gate changed",
    )
    gate = json.loads((PARENT / "qualification-gate.json").read_text())
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "successful original batch required",
    )
    N.require(
        gate["tests"] == 131
        and gate["regression_tests"] == 231
        and gate["native_calls"] == 0,
        "original execution counts changed",
    )
    N.require(
        all(gate[key] is False for key in S.FALSE_FLAGS),
        "original scientific scope changed",
    )
    N.require(
        gate["source_before"] == gate["source_after"]
        and len(gate["source_after"]) == 489,
        "qualified489 source identities required",
    )
    F.verify_inventory(PARENT, gate, "qualification-gate.json")
    F.check_xml(PARENT / "tests.xml", 131, "scripts.tests.test_nr_constraint_symbol")
    F.check_xml(
        PARENT / "constraint-jet-regression.xml",
        231,
        "scripts.tests.test_nr_constraint_jet",
    )
    for name, digest in gate["source_after"].items():
        N.require(
            N.sha(N.contained(ROOT, name)) == digest,
            "current qualified source changed: " + name,
        )
        N.require(
            N.sha(N.contained(PARENT / "source-snapshot", name)) == digest,
            "saved qualified source changed: " + name,
        )
    return gate


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
        "registered single-thread environment required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    directory.mkdir()
    os.environ["TEMP"] = os.environ["TMP"] = str(directory)
    started = time.monotonic()
    audit_before = {name: N.sha(ROOT / name) for name in AUDIT_SOURCES}
    result = dict(
        schema=METHOD,
        completed=False,
        passed=False,
        errors=[],
        phase="intake",
        cases=[],
        parent_gate_sha256=PARENT_SHA,
        parent_directory=PARENT.relative_to(ROOT).as_posix(),
        prior_extra_replay_terminal="unconfirmed-preserved",
        source_before={},
        source_after={},
        audit_source_before=audit_before,
        audit_source_after={},
        native_before={},
        native_after={},
        tests_reexecuted=0,
        native_calls=0,
        integration_steps=0,
        independent_replay_passed=False,
        resource_caps=dict(
            seconds=600,
            output_bytes=64 * 1024**2,
            headroom=2 * 1024**2,
            source_snapshot_bytes=8 * 1024**2,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **{key: False for key in S.FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    budget.record(
        "process.json", dict(pid=os.getpid(), command=sys.argv, owned=True, retries=0)
    )
    table = {}
    try:
        result["phase"] = "parent-integrity"
        gate = parent_evidence()
        table = gate["source_after"]
        result["source_before"] = table
        N.require(
            not set(AUDIT_SOURCES).intersection(table),
            "audit provenance must be additive",
        )
        snapshot_table = N.merge_source_tables(table, audit_before)
        runpy.run_path(str(ROOT / "scripts/run-nr-k3-offsurface-feedback-controls.py"))[
            "save_snapshot"
        ](budget, snapshot_table)
        result["snapshot_sources"] = len(snapshot_table)
        budget.record(
            "parent-integrity.json",
            dict(
                passed=True,
                sources=489,
                indexed_files=len(gate["artifact_hashes"]),
                seconds=time.monotonic() - started,
            ),
        )
        print(
            json.dumps(dict(status="parent-integrity-passed", sources=489)), flush=True
        )
        observations = json.loads((PARENT / "observations.json").read_text())
        N.require(
            observations["method"] == S.METHOD
            and observations["native_calls"] == 0
            and all(observations[key] is False for key in S.FALSE_FLAGS),
            "observation scope changed",
        )
        N.require(
            [row["index"] for row in observations["cases"]] == list(range(21)),
            "ordered21 cases required",
        )
        for row in observations["cases"]:
            budget.guard()
            index = row["index"]
            result["phase"] = f"replay-case-{index}"
            N.require(
                (row["mode"], row["wave_index"]) == S.CASES[index],
                "case identity changed",
            )
            arrays = {
                name: np.load(PARENT / f"case-{index}-{name}.npy", allow_pickle=False)
                for name in S.SHAPES
            }
            report = S.metrics(arrays)
            N.require(
                all(row[key] == value for key, value in report.items()),
                "saved metrics changed",
            )
            S.require_gates(report)
            fresh = S.compare(*S.CASES[index])
            N.require(
                all(
                    np.array_equal(arrays[name], value) for name, value in fresh.items()
                ),
                "exact replay mismatch",
            )
            progress = dict(
                index=index,
                mode=row["mode"],
                wave_index=row["wave_index"],
                passed=True,
                arrays=len(arrays),
                seconds=time.monotonic() - started,
                metrics=report,
            )
            budget.record(f"replay-{index:02d}.json", progress)
            result["cases"].append(progress)
            print(
                json.dumps(dict(status="case-replay-passed", index=index, total=21)),
                flush=True,
            )
        result["phase"] = "scientific-parent-and-native-identity"
        budget.guard()
        T.parent()
        identity = runpy.run_path(
            str(ROOT / "scripts/run-nr-k3-spectral-sat-controls.py")
        )["volume_identity"]
        result["native_before"] = identity()
        N.require(
            result["native_before"] == gate["native_before"] == gate["native_after"],
            "original native identity changed",
        )
        budget.record(
            "scientific-parent-and-native.json",
            dict(passed=True, native_calls=0, seconds=time.monotonic() - started),
        )
        result["phase"] = "final-integrity"
        N.require(parent_evidence() == gate, "parent changed during read-only replay")
        result["native_after"] = identity()
        N.require(
            result["native_before"] == result["native_after"], "native identity drift"
        )
        for name, digest in snapshot_table.items():
            N.require(
                N.sha(N.contained(directory / "source-snapshot", name)) == digest,
                "new snapshot drift",
            )
        budget.guard()
        result.update(
            completed=True,
            passed=True,
            independent_replay_passed=True,
            phase="complete",
        )
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in table
        }
        result["audit_source_after"] = {
            name: N.sha(ROOT / name) if (ROOT / name).is_file() else None
            for name in audit_before
        }
        if (
            result["source_after"] != table
            or result["audit_source_after"] != audit_before
        ):
            result["errors"].append("source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["independent_replay_passed"] = result["passed"]
        result["artifact_hashes"] = {
            path.relative_to(directory).as_posix(): N.sha(path)
            for path in sorted(directory.rglob("*"))
            if path.is_file()
        }
        budget.record("replay-terminal.json", result, finalizing=True)
    print(
        json.dumps(
            {
                key: result[key]
                for key in ("completed", "passed", "phase", "seconds", "errors")
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

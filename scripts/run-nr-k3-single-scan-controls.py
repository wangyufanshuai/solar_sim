"""Bounded single-traversal guard qualification; no numerical-relativity run."""

from __future__ import annotations

import argparse
import ast
from collections import Counter
import importlib.util
import json
import math
import os
from pathlib import Path
import statistics
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as C  # noqa: E402

METHOD = "nr-single-scan-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-guard-overhead-diagnostic-v1-20261013"
PARENT_GATE_SHA = "d7d17e5799b2d86ffe1d2c9f6c036ebabf82ae9c1e66b24c9002a1ac4e14639c"
PARENT_WORKER_SHA = "767f0ffa6a2aa35a578b24f45b22df80418ac21ed2a5d1da474bc99963abacd3"
spec = importlib.util.spec_from_file_location(
    "nr_original_guard_diagnostic", ROOT / "scripts/run-nr-k3-guard-overhead.py"
)
D = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = D
spec.loader.exec_module(D)

NEW_FILES = (
    "scripts/nr_single_scan_control.py",
    "scripts/tests/test_nr_single_scan_control.py",
    "scripts/tests/nr_single_scan_child.py",
    "scripts/run-nr-k3-single-scan-controls.py",
    "science/numerical_relativity/pytest-single-scan-controls.ini",
    "science/numerical_relativity/EXPERIMENT-20261014-single-scan-controls.md",
    "science/numerical_relativity/PLAN-20261013-guard-scan-equivalence.md",
    "science/numerical_relativity/RESULTS-20261013-guard-overhead-diagnostic.md",
)
TARGETS = ("empty", "snapshot", "one-ray", "failed-full", "accepted-parent")
REPEATS = 6
OPERATIONS = ("old-scan", "new-scan", "old-guard", "new-guard")
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "eight_ray_rerun",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "gpu_executed",
    "old_failure_regraded",
    "old_timeout_time_share_measured",
)


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def sources(budget):
    G.require(
        G.sha(PARENT / "qualification-gate.json") == PARENT_GATE_SHA,
        "diagnostic terminal changed",
    )
    G.require(
        G.sha(PARENT / "worker-result.json") == PARENT_WORKER_SHA,
        "diagnostic worker changed",
    )
    parent = read(PARENT / "worker-result.json")
    table = D.sources(budget)
    G.require(
        parent["passed"] is parent["completed"] is True
        and table == parent["source_before"] == parent["source_after"],
        "562-source parent closure required",
    )
    G.require(
        not set(table).intersection(NEW_FILES), "candidate files must be additive"
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in NEW_FILES})
    return table


def history(budget):
    old = D.history(budget)
    parent = G.read_terminal(PARENT / "qualification-gate.json")
    G.require(
        parent["passed"] is parent["completed"] is True
        and parent["supervisor"]["cleanup_verified"] is True,
        "completed diagnostic parent required",
    )
    files = G.inventory(PARENT, "", budget)
    without_terminal = {
        k: v for k, v in files.items() if k != "qualification-gate.json"
    }
    G.require(
        without_terminal == parent["artifact_hashes"], "diagnostic inventory changed"
    )
    old[PARENT.name] = files
    return old


def source_snapshot(budget, table):
    total = sum(G.contained(ROOT, name).stat().st_size for name in table)
    G.require(total <= 8 * 1024**2, "8 MiB source cap")
    for name, digest in table.items():
        raw = G.contained(ROOT, name).read_bytes()
        G.require(
            G.hashlib.sha256(raw).hexdigest() == digest, "source drift during snapshot"
        )
        budget.save("source-snapshot/" + name, raw)
    return total


def registered_controls():
    tree = ast.parse((ROOT / NEW_FILES[1]).read_text(encoding="utf-8"))
    expected = {}
    for node in tree.body:
        if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
            continue
        count = 1
        for decorator in node.decorator_list:
            G.require(
                isinstance(decorator, ast.Call)
                and ast.unparse(decorator.func) == "pytest.mark.parametrize"
                and len(decorator.args) == 2
                and isinstance(decorator.args[1], (ast.List, ast.Tuple))
                and not decorator.keywords,
                "control registration must use explicit parameter lists",
            )
            count *= len(decorator.args[1].elts)
        G.require(
            node.name not in expected and count > 0, "unique control registration"
        )
        expected[node.name] = count
    G.require(sum(expected.values()) >= 30, "minimum registered control coverage")
    return expected


def parse_tests(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    ids = [(row.get("classname"), row.get("name")) for row in cases]
    G.require(
        len(ids) == len(set(ids)),
        "complete unique control cases required",
    )
    expected = registered_controls()
    observed = Counter(row.get("name", "").split("[", 1)[0] for row in cases)
    G.require(dict(observed) == expected, "exact registered controls required")
    G.require(
        not any(list(root.iter(tag)) for tag in ("failure", "error", "skipped")),
        "all controls must pass without skips",
    )
    return dict(
        tests=len(cases),
        failures=0,
        errors=0,
        skipped=0,
        cases=ids,
        registered_controls=expected,
    )


def unit_controls(budget):
    config = ROOT / NEW_FILES[4]
    command = [
        sys.executable,
        "-B",
        "-m",
        "pytest",
        "-q",
        "-c",
        str(config),
        "--rootdir",
        str(ROOT),
        str(ROOT / NEW_FILES[1]),
        "--basetemp",
        str(budget.directory / "test-temp"),
        "--junitxml",
        str(budget.directory / "unit-controls.xml"),
    ]
    budget.record("unit-command.json", command)
    with (budget.directory / "unit-controls.log").open("xb") as stream:
        child = subprocess.Popen(
            command,
            cwd=ROOT,
            stdout=stream,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
            env=dict(
                os.environ,
                PYTEST_ADDOPTS="",
                PYTEST_PLUGINS="",
                PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            ),
        )
        while child.poll() is None:
            budget.guard()
            time.sleep(0.05)
        budget.guard()
        G.require(child.returncode == 0, "control test failure; no retry")
    result = parse_tests(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


class OldProbe(D.ReadOnlyProbe):
    pass


class NewProbe(C.SingleScanBudget):
    def save(self, *args, **kwargs):
        raise ValueError("historical candidate probe is read-only")

    def record(self, *args, **kwargs):
        raise ValueError("historical candidate probe is read-only")


def census(path, budget):
    # Stable-domain independent oracle: unchanged pathlib traversal and stat.
    files = []
    size = directories = 0
    for index, item in enumerate(path.rglob("*")):
        if index % 32 == 0:
            budget.guard()
        G.contained(path, item.relative_to(path))
        if item.is_file():
            files.append(item.relative_to(path).as_posix())
            size += item.stat().st_size
        elif item.is_dir():
            directories += 1
        else:
            raise ValueError("unknown reference entry")
    result = dict(
        used_bytes=size,
        files=len(files),
        directories=directories,
        file_paths=sorted(files),
    )
    budget.guard()
    candidate = C.scan_tree(path, check=budget._check_deadline, collect_paths=True)
    budget.guard()
    G.require(
        result
        == dict(
            used_bytes=candidate.used_bytes,
            files=candidate.files,
            directories=candidate.directories,
            file_paths=sorted(candidate.file_paths),
        ),
        "stable-domain exact census differs",
    )
    return result


def sample_keys(rows):
    keys = [(x["target"], x["repeat"], x["operation"]) for x in rows]
    expected = {
        (target, repeat, op)
        for target in TARGETS
        for repeat in range(REPEATS)
        for op in OPERATIONS
    }
    G.require(
        len(keys) == len(set(keys)) and set(keys) == expected,
        "timing coverage mismatch",
    )


def validate_samples(rows, shapes, *, warmup=False):
    expected_repeats = (-1,) if warmup else range(REPEATS)
    expected = {
        (target, repeat, op)
        for target in TARGETS
        for repeat in expected_repeats
        for op in OPERATIONS
    }
    keys = [(row["target"], row["repeat"], row["operation"]) for row in rows]
    G.require(
        len(keys) == len(set(keys)) and set(keys) == expected,
        "raw measurement coverage mismatch",
    )
    G.require(set(shapes) == set(TARGETS), "census target coverage mismatch")
    for row in rows:
        G.require(
            type(row["wall_ns"]) is int
            and row["wall_ns"] > 0
            and type(row["thread_cpu_ns"]) is int
            and row["thread_cpu_ns"] >= 0,
            "valid raw wall and CPU timing required",
        )
        if row["operation"].endswith("scan"):
            G.require(
                type(row["returned_bytes"]) is int
                and row["returned_bytes"] == shapes[row["target"]]["used_bytes"],
                "raw scan bytes disagree with independent census",
            )
        else:
            value = row["remaining_seconds"]
            G.require(
                type(value) in (float, int) and math.isfinite(value) and value > 0,
                "raw guard deadline required",
            )


def summary(rows):
    sample_keys(rows)
    result = {}
    for target in TARGETS:
        result[target] = {}
        for op in OPERATIONS:
            values = [
                x["wall_ns"]
                for x in rows
                if x["target"] == target and x["operation"] == op
            ]
            G.require(
                all(type(x) is int and x > 0 for x in values),
                "positive timings required",
            )
            result[target][op] = dict(
                count=len(values),
                minimum_ns=min(values),
                median_ns=statistics.median(values),
                maximum_ns=max(values),
            )
        for suffix in ("scan", "guard"):
            result[target][suffix + "_median_ratio_old_over_new"] = (
                result[target]["old-" + suffix]["median_ns"]
                / result[target]["new-" + suffix]["median_ns"]
            )
    return result


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        directory.parent == G.EVIDENCE
        and prepared["passed"] is False
        and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"),
        "owned worker required",
    )
    budget = C.SingleScanBudget(directory)
    started = time.monotonic()
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        errors=[],
        phase="intake",
        stages=[],
        guard_implementation="nr_single_scan_control.SingleScanBudget",
        original_threshold=2e-12,
        integration_steps=0,
        matrix_evaluations=0,
        native_calls=0,
        retries=0,
        optimization_implemented=True,
        single_scan_qualified=False,
        **{name: False for name in FALSE_FLAGS},
    )
    budget.record("attempt.json", result)

    def stage(name, **fields):
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["phase"] = name
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table, old = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", old)
        result["snapshot_bytes"] = source_snapshot(budget, table)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, old.values())),
        )
        result["unit_controls"] = unit_controls(budget)
        stage("controls-complete", tests=result["unit_controls"]["tests"])
        empty = directory / "empty-probe"
        empty.mkdir()
        paths = dict(
            zip(
                TARGETS,
                (
                    empty,
                    D.FAILED / "source-snapshot",
                    D.FAILED / "ray-0",
                    D.FAILED,
                    D.PARENT,
                ),
                strict=True,
            )
        )
        shapes = {name: census(path, budget) for name, path in paths.items()}
        budget.record("target-census.json", shapes)
        old_probes = {name: OldProbe(path) for name, path in paths.items()}
        new_probes = {name: NewProbe(path) for name, path in paths.items()}
        G.require(
            OldProbe.guard is G.Budget.guard
            and NewProbe.guard is C.SingleScanBudget.guard
            and NewProbe.disk_check is G.Budget.disk_check,
            "original checks and candidate identity required",
        )

        def sample(name, op, repeat):
            operations = {
                "old-scan": lambda: D.scan_only(old_probes[name]),
                "new-scan": lambda: C.scan_tree(paths[name]).used_bytes,
                "old-guard": old_probes[name].guard,
                "new-guard": new_probes[name].guard,
            }
            timing, value = D.measure(budget, operations[op])
            if op.endswith("scan"):
                G.require(value == shapes[name]["used_bytes"], "measured bytes changed")
                returned = dict(returned_bytes=value)
            else:
                G.require(value > 0, "probe deadline")
                returned = dict(remaining_seconds=value)
            return dict(target=name, repeat=repeat, operation=op, **timing, **returned)

        warmup = [sample(name, op, -1) for name in TARGETS for op in OPERATIONS]
        validate_samples(warmup, shapes, warmup=True)
        budget.record("warmup.json", warmup)
        rows = []
        for repeat in range(REPEATS):
            order = TARGETS if repeat % 2 == 0 else tuple(reversed(TARGETS))
            ops = OPERATIONS if repeat % 2 == 0 else tuple(reversed(OPERATIONS))
            block = [sample(name, op, repeat) for name in order for op in ops]
            budget.record(f"samples/round-{repeat}.json", block)
            rows.extend(block)
            stage("timing-round", repeat=repeat)
        validate_samples(rows, shapes)
        result["summary"] = summary(rows)
        budget.record("timing-summary.json", result["summary"])
        G.require(
            {name: census(path, budget) for name, path in paths.items()} == shapes,
            "target census changed",
        )
        stage("final-integrity")
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "source/snapshot drift",
        )
        after = history(budget)
        G.require(old == after, "historical evidence changed")
        budget.record("history-after.json", after)
        G.require(
            not any(
                name == "numpy" or name.startswith("numpy.") for name in sys.modules
            ),
            "no numerical imports",
        )
        result.update(
            passed=True,
            completed=True,
            single_scan_qualified=True,
            source_after=table,
            old_artifacts_unchanged=True,
            targets=list(TARGETS),
            timing_samples=len(rows),
            statistical_scope="One Windows batch; warmed metadata; unisolated background load; not historical timeout attribution",
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, single_scan_qualified=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {key: result[key] for key in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["single_scan_qualified"]
        is True
        and not result["errors"],
        "complete controls required",
    )
    G.require(
        result["guard_implementation"] == "nr_single_scan_control.SingleScanBudget"
        and result["optimization_implemented"] is True,
        "candidate identity required",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["original_threshold"] == 2e-12
        and result["integration_steps"]
        == result["matrix_evaluations"]
        == result["native_calls"]
        == result["retries"]
        == 0,
        "control-only scope",
    )
    # JSON roundtrip normalizes testcase identity tuples to lists.
    tests = json.loads(json.dumps(parse_tests(directory / "unit-controls.xml")))
    G.require(
        tests == result["unit_controls"] == read(directory / "unit-controls.json"),
        "test artifact mismatch",
    )
    rows = [
        row
        for repeat in range(REPEATS)
        for row in read(directory / f"samples/round-{repeat}.json")
    ]
    shapes = read(directory / "target-census.json")
    validate_samples(read(directory / "warmup.json"), shapes, warmup=True)
    validate_samples(rows, shapes)
    G.require(
        result["timing_samples"]
        == len(rows)
        == len(TARGETS) * REPEATS * len(OPERATIONS),
        "sample count mismatch",
    )
    G.require(
        summary(rows) == result["summary"] == read(directory / "timing-summary.json"),
        "timing summary mismatch",
    )
    table = sources(budget)
    G.require(
        table
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "source finalization drift",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "history finalization drift",
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == D.GUARD_SHA,
        "unchanged supervisor required",
    )
    result = G.supervise(
        [
            sys.executable,
            "-B",
            str(Path(__file__).resolve()),
            "--guard-worker",
            "--output-directory",
            str(directory),
        ],
        directory,
        finalizer=finalizer,
        budget_factory=C.SingleScanBudget,
    )
    print(
        json.dumps({key: result[key] for key in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

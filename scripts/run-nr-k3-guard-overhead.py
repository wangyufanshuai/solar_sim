"""One authorized, stdlib-only guard-overhead diagnostic; no physics execution."""

from __future__ import annotations

import argparse
import ast
import copy
import importlib.util
import inspect
import json
import os
from pathlib import Path
import statistics
import sys
import textwrap
import time
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402

METHOD = "nr-guard-overhead-diagnostic-v1"
FAILED = G.EVIDENCE / "nr-k3-case12-direction-section-controls-v1-20261013"
PARENT = G.EVIDENCE / "nr-k3-case12-lower-energy-controls-v1-20261013"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
FAILED_GATE_SHA = "9e24c46e4aa5c57d1b1e308f5baded04b551ffe13b2b5021e618d5d2d24fce4d"
HISTORY_SHA = "9618a56eb058dddde6ac1532b0dfe67601da5b23263062a53e69696dd4d61f4e"
WORKER_SHA = "01e6642c5f21c91b09880f172615f90c08bfb536d3dfe8bb99b2f2dd699c0bf4"
OLD_EXTRA = {
    "scripts/nr_constraint_direction_section.py": "e73b54e528e635f51dc1e25af2489068fad0b26e89e1c85940ca7515c8b476c0",
    "scripts/run-nr-k3-case12-direction-section.py": "ba961d797d11656c026f6e4412804d8731dcd7a0fcaaa51df055446049d18478",
    "science/numerical_relativity/test_constraint_direction_section.py": "2d5ada7943c3edb8a7f9b65c8fee8fe499a4c4191b51485a37cc46bd4deb7a32",
    "science/numerical_relativity/pytest-case12-direction-section.ini": "aaabed120d2fb059160bb38bf8843dc0bbb6abca5f013dffb5228bfffb9a3404",
    "science/numerical_relativity/DERIVATION-20261013-case12-direction-section.md": "e7183f7d201eb8f8ccedd83502a0b2f01be0733e9903c5001ef5be1b671ce9ea",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-direction-section.md": "c7d26e1cf674a7a50101fbe9848c460d7c3ef7b2df3bed23ab30f0c031dbff73",
    "science/numerical_relativity/RESULTS-20261013-case12-lower-energy.md": "e8e38a8d2620420e096c2d20e55b421682956466ac6bf8d367f6b872b0c2152f",
}
PRIOR_REPORT = "science/numerical_relativity/RESULTS-20261013-case12-direction-section.md"
PRIOR_REPORT_SHA = "f423be87e1e474f290129fa50b0270899a9fcb758f6e7db384a4b73efa32ce47"
NEW_FILES = (
    "scripts/run-nr-k3-guard-overhead.py",
    "science/numerical_relativity/test_guard_overhead_diagnostic.py",
    "science/numerical_relativity/EXPERIMENT-20261013-guard-overhead-diagnostic.md",
)
TARGETS = ("empty", "snapshot", "one-ray", "failed-full", "accepted-parent")
OPERATIONS = ("guard", "scan", "disk")
ROUNDS, REPEATS, PROFILE_CALLS = 3, 3, 3
FALSE_FLAGS = (
    "physical_gate", "live_admission", "scientificPayloadWriteback",
    "new_scientific_evolution", "full_scientific_matrix_executed",
    "eight_ray_rerun", "gpu_executed", "optimization_implemented",
    "old_failure_regraded", "old_timeout_time_share_measured",
)


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


class ReadOnlyProbe(G.Budget):
    """Only prevent writes; guard and disk_check are inherited without overrides."""

    def save(self, *args, **kwargs):
        raise ValueError("diagnostic probe is read-only")

    def record(self, *args, **kwargs):
        raise ValueError("diagnostic probe is read-only")


def scan_only(probe):
    return (
        sum(p.stat().st_size for p in probe.directory.rglob("*") if p.is_file())
        if probe.directory.exists()
        else 0
    )


def scan_equivalence(guard_source, scan_source):
    guard = ast.parse(textwrap.dedent(guard_source)).body[0]
    scan = ast.parse(textwrap.dedent(scan_source)).body[0]
    assignments = [x for x in guard.body if isinstance(x, ast.Assign)
                   and len(x.targets) == 1 and isinstance(x.targets[0], ast.Name)
                   and x.targets[0].id == "used"]
    returns = [x for x in scan.body if isinstance(x, ast.Return)]
    G.require(len(assignments) == len(returns) == 1, "unique scan expression required")

    class Rename(ast.NodeTransformer):
        def visit_Name(self, node):
            if node.id == "self":
                node.id = "probe"
            return node

    original = Rename().visit(copy.deepcopy(assignments[0].value))
    G.require(ast.dump(original) == ast.dump(returns[0].value), "scan expression drift")
    return True


def timed_operation(operation, *, wall=time.perf_counter_ns, cpu=time.thread_time_ns):
    start_wall, start_cpu = wall(), cpu()
    value = operation()
    end_cpu, end_wall = cpu(), wall()
    elapsed, active = end_wall - start_wall, end_cpu - start_cpu
    G.require(type(elapsed) is int and elapsed > 0 and type(active) is int and active >= 0,
              "valid monotonic timing required")
    return dict(wall_ns=elapsed, thread_cpu_ns=active), value


def measure(owner, operation, **clocks):
    owner.guard()
    result = timed_operation(operation, **clocks)
    owner.guard()
    return result


def summarize(rows):
    G.require(rows and all(type(x["wall_ns"]) is int and x["wall_ns"] > 0
                          and type(x["thread_cpu_ns"]) is int and x["thread_cpu_ns"] >= 0 for x in rows),
              "nonempty valid timing samples required")
    wall, cpu = [x["wall_ns"] for x in rows], [x["thread_cpu_ns"] for x in rows]
    return dict(count=len(rows), min_wall_ns=min(wall), median_wall_ns=statistics.median(wall),
                max_wall_ns=max(wall), median_thread_cpu_ns=statistics.median(cpu))


def expected_keys():
    return {(target, round_index, repeat, op) for target in TARGETS
            for round_index in range(ROUNDS) for repeat in range(REPEATS) for op in OPERATIONS}


def validate_samples(rows):
    keys = [(x["target"], x["round"], x["repeat"], x["operation"]) for x in rows]
    G.require(len(keys) == len(set(keys)) and set(keys) == expected_keys(), "missing/duplicate timing coverage")
    summarize(rows)


def sources(budget):
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "unchanged production supervisor required")
    G.require(G.sha(PARENT / "worker-result.json") == WORKER_SHA, "accepted source provenance drift")
    parent = read(PARENT / "worker-result.json")
    table = dict(parent["source_before"])
    G.require(len(table) == 551 and table == parent["source_after"] and parent["passed"] is True,
              "551 accepted parent sources required")
    G.require(not set(table).intersection(OLD_EXTRA), "additive source closure required")
    table.update(OLD_EXTRA)
    for index, (name, digest) in enumerate(table.items()):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(FAILED / "source-snapshot", name)) == digest,
                  "frozen source/snapshot drift: " + name)
    G.require(G.sha(ROOT / PRIOR_REPORT) == PRIOR_REPORT_SHA, "preserved failure report required")
    table[PRIOR_REPORT] = PRIOR_REPORT_SHA
    G.require(not set(table).intersection(NEW_FILES), "new diagnostic files only")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in NEW_FILES})
    G.require(len(table) == 562, "562-source diagnostic closure required")
    return table


def history(budget):
    G.require(G.sha(FAILED / "qualification-gate.json") == FAILED_GATE_SHA
              and G.sha(FAILED / "ancestry-before.json") == HISTORY_SHA, "old failure evidence drift")
    terminal = G.read_terminal(FAILED / "qualification-gate.json")
    G.require(terminal["passed"] is terminal["completed"] is False
              and terminal["errors"] == ["ResourceLimit: registered control deadline reached"]
              and terminal["supervisor"]["cleanup_verified"] is True, "old timeout must remain failed")
    previous = read(FAILED / "ancestry-before.json")
    G.require(len(previous) == 8 and sum(map(len, previous.values())) == 5152, "registered eight historical directories required")
    result = {}
    for name, expected in previous.items():
        current = G.inventory(G.contained(G.EVIDENCE, name), "", budget)
        G.require(current == expected, "historical artifact drift: " + name)
        result[name] = current
    current = G.inventory(FAILED, "", budget)
    G.require(len(current) == 1087, "unchanged partial failure file set required")
    result[FAILED.name] = current
    return result


def save_snapshot(budget, table):
    total = sum(G.contained(ROOT, name).stat().st_size for name in table)
    G.require(total <= 8 * 1024**2, "8 MiB snapshot cap")
    for name, digest in table.items():
        raw = G.contained(ROOT, name).read_bytes()
        G.require(G.hashlib.sha256(raw).hexdigest() == digest, "source changed during snapshot")
        budget.save("source-snapshot/" + name, raw)
    return total


def topology(path, budget):
    count = directories = size = maximum_depth = 0
    for index, item in enumerate(path.rglob("*")):
        if index % 32 == 0:
            budget.guard()
        G.contained(path, item.relative_to(path))
        maximum_depth = max(maximum_depth, len(item.relative_to(path).parts))
        if item.is_file():
            count += 1
            size += item.stat().st_size
        elif item.is_dir():
            directories += 1
        else:
            raise ValueError("unexpected target entry")
    return dict(files=count, directories=directories, bytes=size, maximum_depth=maximum_depth)


def unit_controls(budget):
    path = ROOT / NEW_FILES[1]
    spec = importlib.util.spec_from_file_location("nr_guard_diagnostic_tests", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.D = sys.modules[__name__]
    suite = unittest.defaultTestLoader.loadTestsFromModule(module)
    budget.guard()
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    budget.guard()
    record = dict(tests=result.testsRun, failures=len(result.failures), errors=len(result.errors),
                  skipped=len(result.skipped), expected_failures=len(result.expectedFailures),
                  unexpected_successes=len(result.unexpectedSuccesses))
    budget.record("unit-controls.json", record)
    G.require(record == dict(tests=12, failures=0, errors=0, skipped=0, expected_failures=0,
                            unexpected_successes=0), "12 isolated diagnostic controls required; no retry")
    return record


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(directory.parent == G.EVIDENCE and prepared["passed"] is False
              and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"), "owned worker required")
    G.require(all(os.environ.get(name) == "1" for name in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single numerical thread environment required")
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, phase="intake", errors=[], stages=[],
                  source_before={}, source_after={}, samples=[], diagnostic_completed=False,
                  original_threshold=2e-12, integration_steps=0, matrix_evaluations=0, native_calls=0,
                  retries=0, **{name: False for name in FALSE_FLAGS})
    budget.record("attempt.json", result)

    def stage(name, **fields):
        row = dict(stage=name, seconds=time.monotonic()-started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["phase"] = name
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table, old = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", old)
        result["snapshot_bytes"] = save_snapshot(budget, table)
        stage("intake-complete", sources=len(table), historical_files=sum(map(len, old.values())))
        result["unit_controls"] = unit_controls(budget)
        scan_equivalence(inspect.getsource(G.Budget.guard), inspect.getsource(scan_only))
        G.require(ReadOnlyProbe.guard is G.Budget.guard and ReadOnlyProbe.disk_check is G.Budget.disk_check,
                  "measured production checks must be unmodified")
        budget.guard()
        empty = G.contained(directory, "empty-readonly-probe")
        empty.mkdir()
        paths = dict(zip(TARGETS, (empty, FAILED / "source-snapshot", FAILED / "ray-0", FAILED, PARENT), strict=True))
        shapes = {name: topology(path, budget) for name, path in paths.items()}
        budget.record("target-topology.json", shapes)
        probes = {name: ReadOnlyProbe(path) for name, path in paths.items()}
        result["environment"] = dict(python=sys.version, platform=sys.platform, timer="perf_counter_ns",
                                     cpu_timer="thread_time_ns", metadata_cache="warmed by provenance and census; not cold-cache")

        def sample(name, op, **identity):
            probe = probes[name]
            operation = {"guard": probe.guard, "scan": lambda: scan_only(probe), "disk": probe.disk_check}[op]
            timing, value = measure(budget, operation)
            if op == "scan":
                G.require(value == shapes[name]["bytes"], "directory byte total drift")
            elif op == "guard":
                G.require(value > 0, "probe deadline exceeded")
            else:
                G.require(value is None, "unchanged disk check return contract")
            return dict(target=name, operation=op, **identity, **timing)

        warmup = [sample(name, op) for name in TARGETS for op in OPERATIONS]
        budget.record("warmup-observations.json", warmup)
        stage("measurements-start", targets=len(TARGETS))
        for round_index in range(ROUNDS):
            order = TARGETS if round_index == 0 else tuple(reversed(TARGETS)) if round_index == 1 else TARGETS[2:]+TARGETS[:2]
            for name in order:
                block = []
                for repeat in range(REPEATS):
                    offset = (round_index + repeat) % len(OPERATIONS)
                    for op in OPERATIONS[offset:]+OPERATIONS[:offset]:
                        block.append(sample(name, op, round=round_index, repeat=repeat))
                budget.record(f"samples/round-{round_index}-{name}.json", block)
                result["samples"].extend(block)
                stage("measurement-block", target=name, round=round_index)
        validate_samples(result["samples"])
        result["summary"] = {name: {op: summarize([x for x in result["samples"] if x["target"] == name and x["operation"] == op])
                                    for op in OPERATIONS} for name in TARGETS}
        budget.record("timing-summary.json", result["summary"])

        import cProfile
        import pstats
        profiles = {}
        for name in TARGETS:
            profiler = cProfile.Profile()
            for _ in range(PROFILE_CALLS):
                budget.guard()
                profiler.runcall(probes[name].guard)
                budget.guard()
            rows = [dict(file=file, line=line, function=function, primitive_calls=values[0], calls=values[1],
                         self_seconds=values[2], cumulative_seconds=values[3])
                    for (file, line, function), values in pstats.Stats(profiler).stats.items()]
            rows.sort(key=lambda x: (-x["cumulative_seconds"], x["file"], x["line"], x["function"]))
            guard_rows = [x for x in rows if x["file"] == G.Budget.guard.__code__.co_filename and x["function"] == "guard"]
            disk_rows = [x for x in rows if x["file"] == G.Budget.disk_check.__code__.co_filename and x["function"] == "disk_check"]
            G.require(len(guard_rows) == len(disk_rows) == 1 and guard_rows[0]["calls"] == disk_rows[0]["calls"] == PROFILE_CALLS,
                      "unchanged guard/disk profiler coverage required")
            profiles[name] = dict(calls=PROFILE_CALLS, guard_seconds=guard_rows[0]["cumulative_seconds"],
                                  disk_seconds=disk_rows[0]["cumulative_seconds"], functions=rows)
            budget.record(f"profiles/{name}.json", profiles[name])
            stage("profile-complete", target=name)
        result["profile_totals"] = {name: {k: v for k, v in value.items() if k != "functions"} for name, value in profiles.items()}
        budget.record("static-call-sites.json", dict(
            guard_scan_expression_matches=True, production_guard_sha256=GUARD_SHA,
            matrix_product_source="scripts/nr_constraint_exact_coefficients.py:39",
            matrix_product_source_sha256=table["scripts/nr_constraint_exact_coefficients.py"],
            explanatory_guard_calls_per_43_row_product=6,
            explanation="Source loop checks rows 0,8,16,24,32,40. No matrix execution or historical full-run attribution.",
            supervisor_poll="Unchanged full guard, then time.sleep(0.05); not a guaranteed 20 Hz frequency."))
        stage("final-integrity")
        G.require(sources(budget) == table, "source drift")
        G.require(G.inventory(directory / "source-snapshot", "", budget) == table, "snapshot drift")
        after = history(budget)
        budget.record("history-after.json", after)
        G.require(after == old, "old evidence changed")
        G.require(all(not (name == "numpy" or name.startswith("numpy.") or name.startswith("scripts.nr_constraint")
                           or name.startswith("scripts.nr_profile")) for name in sys.modules), "no physics/numerical imports")
        result.update(passed=True, completed=True, diagnostic_completed=True, source_after=table,
                      old_artifacts_unchanged=True, measured_targets=list(TARGETS), profiled_targets=list(TARGETS))
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, diagnostic_completed=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is result["diagnostic_completed"] is True
              and not result["errors"], "complete diagnostic required")
    G.require(all(result[name] is False for name in FALSE_FLAGS) and result["original_threshold"] == 2e-12
              and result["integration_steps"] == result["matrix_evaluations"] == result["native_calls"] == result["retries"] == 0,
              "diagnostic-only scope required")
    G.require(result["unit_controls"] == dict(tests=12, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0),
              "registered diagnostic tests required")
    G.require(result["measured_targets"] == result["profiled_targets"] == list(TARGETS), "five targets required")
    validate_samples(result["samples"])
    G.require(result["summary"] == read(directory / "timing-summary.json"), "saved summary mismatch")
    saved = []
    for round_index in range(ROUNDS):
        for target in TARGETS:
            saved.extend(read(directory / f"samples/round-{round_index}-{target}.json"))
    validate_samples(saved)
    key = lambda row: (row["target"], row["round"], row["repeat"], row["operation"])
    G.require(sorted(saved, key=key) == sorted(result["samples"], key=key), "saved sample mismatch")
    for target in TARGETS:
        profile = read(directory / f"profiles/{target}.json")
        G.require({k: v for k, v in profile.items() if k != "functions"} == result["profile_totals"][target]
                  and profile["calls"] == PROFILE_CALLS, "saved profile mismatch")
    table = sources(budget)
    G.require(table == result["source_before"] == result["source_after"]
              == G.inventory(directory / "source-snapshot", "", budget), "562 immutable source snapshots required")
    G.require(history(budget) == read(directory / "history-before.json") == read(directory / "history-after.json"), "history drift")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "unchanged production supervisor required")
    result = G.supervise([sys.executable, "-B", str(Path(__file__).resolve()), "--guard-worker", "--output-directory", str(directory)],
                         directory, finalizer=finalizer)
    print(json.dumps({k: result[k] for k in ("passed", "completed", "errors")}), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

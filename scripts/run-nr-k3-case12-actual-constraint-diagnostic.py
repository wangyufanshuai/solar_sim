"""Owned full actual physical-constraint continuum bridge; unexecuted candidate."""

from __future__ import annotations
import argparse
import ast
from collections import Counter
from fractions import Fraction as F
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
for folder in (ROOT, ROOT / "scripts"):
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as C  # noqa: E402
import nr_case12_actual_constraint_diagnostic as M  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

METHOD = "nr-case12-actual-constraint-diagnostic-controls-v1"
HELPER = "scripts/run-nr-k3-case12-actual-volume-linearization.py"
HELPER_SHA = "805badfb0b73327621dffccdb4c7cef7304dc3c6418d3eda47edbbf72c057d7a"
PARENT = G.EVIDENCE / M.PARENT_DIRECTORY
PARENT_GATE, PARENT_WORKER = M.PARENT_GATE, M.PARENT_WORKER
EXTRA = (
    "scripts/nr_case12_actual_constraint_jet.py",
    "scripts/nr_case12_actual_constraint_diagnostic.py",
    "scripts/nr_case12_actual_constraint_replay.py",
    "scripts/tests/test_nr_case12_actual_constraint_diagnostic.py",
    "scripts/run-nr-k3-case12-actual-constraint-diagnostic.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-actual-constraint-diagnostic.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-actual-constraint-diagnostic.md",
    "science/numerical_relativity/RESULTS-20261015-case12-actual-volume-linearization.md",
    "science/numerical_relativity/NOTE-20261015-case12-actual-constraint-diagnostic-bridge-next.md",
)
TEST_FILES = (EXTRA[3], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = (
    (28, 65),
    (21, 73),
)  # Explicit AST registration: 49 functions, 138 total instances.
SCOPE = M.SCOPE
QUALIFICATIONS = M.QUALIFICATIONS
FALSE_FLAGS = M.FALSE_FLAGS


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen accepted growth runner")
    spec = importlib.util.spec_from_file_location(
        "nr_actual_constraint_parent", ROOT / HELPER
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read(path):
    return json.loads(Path(path).read_bytes())


def canonical_equal(actual, expected):
    return helper().canonical_equal(actual, expected)


def registered_tests():
    tests = {}
    for filename, (functions, instances) in zip(
        TEST_FILES, TEST_REGISTRATION, strict=True
    ):
        tree = ast.parse((ROOT / filename).read_text(encoding="utf-8"))
        current = {}
        for node in tree.body:
            if not isinstance(node, ast.FunctionDef) or not node.name.startswith(
                "test_"
            ):
                continue
            count = 1
            for item in node.decorator_list:
                G.require(
                    isinstance(item, ast.Call)
                    and ast.unparse(item.func) == "pytest.mark.parametrize"
                    and len(item.args) == 2
                    and isinstance(item.args[1], (ast.List, ast.Tuple))
                    and not item.keywords,
                    "explicit test parameter registration",
                )
                count *= len(item.args[1].elts)
            G.require(
                node.name not in current and node.name not in tests and count > 0,
                "unique tests",
            )
            current[node.name] = count
        G.require(
            len(current) == functions and sum(current.values()) == instances,
            "frozen test count",
        )
        tests.update(current)
    return tests


def test_evidence(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    names = [[row.get("classname"), row.get("name")] for row in cases]
    expected = registered_tests()
    G.require(
        len(names) == len({tuple(row) for row in names})
        and dict(Counter(row.get("name", "").split("[", 1)[0] for row in cases))
        == expected
        and not any(list(root.iter(tag)) for tag in ("error", "failure", "skipped")),
        "all registered controls passed without skips",
    )
    return dict(
        tests=len(cases),
        identities=names,
        registered=expected,
        failures=0,
        errors=0,
        skipped=0,
    )


def controls(budget):
    command = [
        sys.executable,
        "-B",
        "-m",
        "pytest",
        "-q",
        "-s",
        "--noconftest",
        "-c",
        str(ROOT / "science/numerical_relativity/pytest-single-scan-controls.ini"),
        "--rootdir",
        str(ROOT),
        "--junitxml",
        str(budget.directory / "unit-controls.xml"),
        *[str(ROOT / name) for name in TEST_FILES],
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
        G.require(
            child.returncode == 0,
            "actual-constraint controls failed; no automatic retry",
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        directory.parent == G.EVIDENCE
        and prepared["passed"] is False
        and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"),
        "owned worker required",
    )
    G.require(
        all(
            os.environ.get(name) == "1"
            for name in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "one numerical thread",
    )
    budget, started = C.SingleScanBudget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        errors=[],
        stages=[],
        phase="intake",
        case_indices=[12],
        scope=SCOPE,
        parent_gate_sha256=PARENT_GATE,
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        coefficient_acceptance="exact-rational-equality",
        required_zero_acceptance="exact-zero-only",
        **{name: False for name in (*FALSE_FLAGS, *QUALIFICATIONS)},
    )
    budget.record("attempt.json", result)

    def stage(name, **fields):
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["phase"] = name
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table, before = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", before)
        result["snapshot_bytes"] = (
            helper().helper().foundation().snapshot(budget, table)
        )
        parent = input_records()
        for name, raw in parent.items():
            budget.save("parent-inputs/" + name, raw)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
            parent_inputs=len(parent),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        saved, expected = set(), set(M.RECORD_ORDER)

        def sink(name, record):
            G.require(
                name in expected
                and name not in saved
                and name == M.RECORD_ORDER[len(saved)],
                "unique registered actual-constraint output in frozen order",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        result["acceptance"] = M.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(saved == expected, "all 22 registered actual-constraint outputs")
        stage("complete-candidate-evidence-saved", outputs=len(saved))
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record(
            "dependencies.json", helper().helper().foundation().dependencies(budget)
        )
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "all sources and snapshot unchanged",
        )
        after = history(budget)
        G.require(before == after, "all historical evidence unchanged")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True
            and result["acceptance"]["accepted"] is True,
            "actual constraint bridge failed; retain complete counterexample, no automatic repair or retry",
        )
        result.update(passed=True, completed=True, **{q: True for q in QUALIFICATIONS})
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False, completed=False, **{q: False for q in QUALIFICATIONS}
        )
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {name: result[name] for name in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def parent_gate():
    G.require(
        G.sha(PARENT / "qualification-gate.json") == PARENT_GATE
        and G.sha(PARENT / "worker-result.json") == PARENT_WORKER,
        "frozen actual-volume parent identity",
    )
    gate = read(PARENT / "qualification-gate.json")
    G.require(
        gate["passed"] is gate["completed"] is True
        and gate["errors"] == []
        and gate["actual_volume_real_formula_linearization_validated"] is True
        and gate["supervisor"]["cleanup_verified"] is True,
        "qualified actual-volume parent",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 687
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all687 frozen sources",
    )
    G.require(not set(table).intersection(EXTRA), "nine additive constraint sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 696, "all696 sources")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed
        == dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
        and len(observed) == 790,
        "complete actual-volume parent",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 29 and sum(map(len, table.values())) == 21199, "all29 histories"
    )
    return table


def input_records():
    parent_gate()
    raw = {}
    for name, (directory, path, digest) in M.PARENT_FILES.items():
        data = G.contained(G.EVIDENCE / directory, path).read_bytes()
        G.require(
            G.hashlib.sha256(data).hexdigest() == digest, "registered parent input"
        )
        raw[name] = data
    M.parent_provenance_manifest(raw)
    return raw


def replay_inputs():
    return {"parent-inputs/" + n for n in M.PARENT_FILES} | {
        n + ".json" for n in M.RECORD_ORDER
    }


def independent_oracle(raw, check):
    """Separate complete coefficient extraction; no direction evaluation."""
    out = [[F(0) for _ in range(580)] for _ in range(43)]
    exponents = [
        (0, 0, 0),
        (1, 0, 0),
        (0, 1, 0),
        (0, 0, 1),
        (2, 0, 0),
        (1, 1, 0),
        (1, 0, 1),
        (0, 2, 0),
        (0, 1, 1),
        (0, 0, 2),
    ]
    block_for = {e: i for i, e in enumerate(exponents)}
    for degree in range(3):
        matrix = V.decode_matrix(
            json.loads(raw[f"C{degree}.json"]), shape=(43, 58), max_degree=degree
        )
        for row in range(43):
            check()
            for col in range(58):
                for exponent, value in matrix[row][col].items():
                    G.require(
                        sum(exponent) == degree and exponent in block_for,
                        "all independent homogeneous coefficients",
                    )
                    out[row][58 * block_for[exponent] + col] = value
    return out


def independent_rows(rows, count, check):
    G.require(len(rows) == count, "independent full scalar rows")
    f0, coefficients = [], []
    for row in rows:
        check()
        values = dict(row.coefficients)
        G.require(
            type(row.value) is F
            and all(
                type(k) is int and 0 <= k < 580 and type(v) is F and v != 0
                for k, v in values.items()
            ),
            "independent rational580",
        )
        f0.append([row.value])
        coefficients.append([values.get(i, F(0)) for i in range(580)])
    return f0, coefficients


def independent_driver(rows, baseline, check):
    f0, matrix = independent_rows(rows, 49, check)
    combined = [[f0[i][0], *matrix[i]] for i in range(49)]
    physical = [[baseline["F0"][i][0], *baseline["C"][i]] for i in range(43)]
    mapping = [(i, i) for i in range(5)] + [(i, i + 3) for i in range(5, 17)]
    for k in range(3):
        pair_index = 0
        for i in range(3):
            for j in range(i, 3):
                mapping.append((17 + 9 * k + 3 * i + j, 20 + 6 * k + pair_index))
                pair_index += 1
    mapping += [(i, i - 6) for i in range(44, 49)]
    G.require(len(mapping) == 40, "full40 independent driver mapping")
    agreement = []
    for raw, target in mapping:
        check()
        agreement.append([combined[raw][j] - physical[target][j] for j in range(581)])
    symmetry = []
    for k in range(3):
        for i in range(3):
            for j in range(i + 1, 3):
                check()
                symmetry.append(
                    [
                        combined[17 + 9 * k + 3 * i + j][n]
                        - combined[17 + 9 * k + 3 * j + i][n]
                        for n in range(581)
                    ]
                )
    return dict(
        driverF0=f0, driverC=matrix, driverAgreement=agreement, driverSymmetry=symmetry
    )


def replay(directory, budget, stage):
    import nr_case12_actual_constraint_replay as independent
    import nr_case12_actual_constraint_jet as production

    raw = {n: (directory / "parent-inputs" / n).read_bytes() for n in M.PARENT_FILES}
    provenance = M.parent_provenance_manifest(raw)
    oracle = independent_oracle(raw, budget._check_deadline)
    cases, stats, executions = {}, {}, {}
    driver_rows = None

    def compare(name, record):
        budget.guard()
        G.require(
            canonical_equal(read(directory / (name + ".json")), record),
            "independent mismatch: " + name,
        )

    def compare_matrix(name, matrix):
        saved = M.decode_matrix(read(directory / (name + ".json")), M.SHAPES[name])
        G.require(
            saved == matrix, "independent actual formula matrix mismatch: " + name
        )
        rows, cols = M.SHAPES[name]
        nz = sum(x != 0 for row in matrix for x in row)
        stats[name] = dict(
            shape=[rows, cols], slots=rows * cols, nonzero_slots=nz, all_zero=nz == 0
        )

    for case in M.CASE_NAMES:
        budget.guard()
        actual = independent.evaluate_case(
            case=case, guard=budget.guard, check=budget._check_deadline
        )
        f0, matrix = independent_rows(actual["rows"], 43, budget._check_deadline)
        residual = [
            [matrix[i][j] - oracle[i][j] for j in range(580)] for i in range(43)
        ]
        cases[case] = dict(F0=f0, C=matrix, R=residual)
        for field in M.FIELDS:
            compare_matrix(case + "__" + field, cases[case][field])
        # Shared source/chart metadata must agree; operation counts legitimately differ.
        ex = dict(actual["execution"])
        saved = read(directory / (case + "__execution.json"))

        def stable(metadata):
            return {
                k: v
                for k, v in metadata.items()
                if k not in ("operations", "independent_backend")
            }

        G.require(
            canonical_equal(stable(ex), stable(saved)),
            "actual case/source/chart identity",
        )
        executions[case] = ex
        if case == "baseline":
            driver_rows = actual["raw_driver"]
        else:
            G.require(actual["raw_driver"] is None, "independent baseline-only driver")
        stage("independent-" + case + "-complete")
    for name, matrix in independent_driver(
        driver_rows, cases["baseline"], budget._check_deadline
    ).items():
        compare_matrix(name, matrix)
    controls = {}
    for name, targets in (
        ("momentum_trace_mutant", [1, 2, 3]),
        ("connection_target_mutant", [5, 6, 7]),
    ):
        changes = [
            (i, j)
            for i in range(43)
            for j in range(580)
            if cases[name]["C"][i][j] != cases["baseline"]["C"][i][j]
        ]
        causal = sum(i in targets and cases[name]["R"][i][j] != 0 for i, j in changes)
        outside = sum(i not in targets for i, j in changes)
        controls[name] = dict(
            target_rows=targets,
            changed_slots=len(changes),
            changed_outside_target_rows=outside,
            causal_changed_residual_slots=causal,
            original_diagnostic_symbol_rejected=causal > 0,
            accepted=bool(changes) and causal > 0 and outside == 0,
        )
    mutations = dict(
        schema="nr-case12-actual-constraint-real-source-controls-v1",
        controls=controls,
        accepted=all(c["accepted"] for c in controls.values()),
        prefilled_theoretical_pattern=False,
        actual_mutated_source_evaluated=True,
    )
    acceptance = dict(
        baseline_equilibrium=stats["baseline__F0"]["all_zero"],
        complete_physical43_bridge=stats["baseline__R"]["all_zero"],
        driver_equilibrium=stats["driverF0"]["all_zero"],
        driver_complete40_bridge=stats["driverAgreement"]["all_zero"],
        driver_nine_symmetry_relations=stats["driverSymmetry"]["all_zero"],
        real_source_negative_controls=mutations["accepted"],
    )
    acceptance["accepted"] = all(acceptance.values())
    summary = dict(
        cases=3,
        matrices=13,
        total_slots=206707,
        main_slots=106861,
        mutation_slots=99846,
        required_baseline_zero_slots=53501,
        outputs=22,
        parent_files=13,
        matrices_by_name=stats,
    )
    for name, record in (
        ("mutations", mutations),
        ("acceptance", acceptance),
        ("stats", summary),
        ("source_bridge", production.source_manifest()),
        ("parent_provenance", provenance),
        ("domain", M.domain_metadata()),
    ):
        compare(name, record)
    hashes = {n: G.sha(G.contained(directory, n)) for n in sorted(replay_inputs())}
    G.require(len(hashes) == 35, "all35 replay inputs")
    return dict(
        schema="nr-case12-independent-actual-constraint-diagnostic-v1",
        passed=acceptance["accepted"],
        computation_completed=True,
        scope=SCOPE,
        parent_gate_sha256=PARENT_GATE,
        input_hashes=hashes,
        acceptance=acceptance,
        mutations=mutations,
        stats=summary,
        domain=M.domain_metadata(),
        independent_executions=executions,
        independent_arithmetic=independent.replay_manifest(),
        shared_trusted_base="actual AST adapters,array routing,chart/packing,codecs; independent scalar reverse AD and cofactor matrix arithmetic",
        production_jacobians_used_as_inputs=False,
        finite_direction_sampling=False,
        **{k: False for k in FALSE_FLAGS},
    )


def finalizer(directory, budget):
    """Read-only metadata/hashes: no scalar derivatives or residual mathematics."""
    import nr_case12_actual_constraint_jet as production
    import nr_case12_actual_constraint_replay as independent

    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["phase"] == "complete"
        and result["passed"] is result["completed"] is True
        and result["errors"] == []
        and all(result[k] is True for k in QUALIFICATIONS),
        "complete qualified worker",
    )
    G.require(
        all(result[k] is False for k in FALSE_FLAGS)
        and result["scope"] == SCOPE
        and result["case_indices"] == [12]
        and result["parent_gate_sha256"] == PARENT_GATE
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-rational-equality"
        and result["required_zero_acceptance"] == "exact-zero-only"
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0,
        "unchanged scientific scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "complete test identities",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        canonical_equal(report, result["replay"])
        and report["passed"] is True
        and report["computation_completed"] is True
        and report["scope"] == SCOPE
        and report["schema"] == "nr-case12-independent-actual-constraint-diagnostic-v1"
        and report["parent_gate_sha256"] == PARENT_GATE
        and set(report["input_hashes"]) == replay_inputs()
        and len(report["input_hashes"]) == 35,
        "complete independent replay",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replay input unchanged"
        )
    expected_acceptance = {
        "baseline_equilibrium",
        "complete_physical43_bridge",
        "driver_equilibrium",
        "driver_complete40_bridge",
        "driver_nine_symmetry_relations",
        "real_source_negative_controls",
        "accepted",
    }
    G.require(
        report["acceptance"]
        == result["acceptance"]
        == read(directory / "acceptance.json")
        and set(report["acceptance"]) == expected_acceptance
        and all(value is True for value in report["acceptance"].values()),
        "seven explicit decisions",
    )
    G.require(
        set(report["independent_executions"]) == set(M.CASE_NAMES),
        "three actual reverse runs",
    )
    for case, ex in report["independent_executions"].items():
        saved = read(directory / (case + "__execution.json"))

        def stable(d):
            return {
                k: v
                for k, v in d.items()
                if k not in ("operations", "independent_backend")
            }

        G.require(
            canonical_equal(stable(ex), stable(saved)),
            "saved case source/chart identity",
        )
        graph = ex["independent_backend"]
        G.require(
            graph["method"] == "exact 580-seed reverse scalar graph"
            and all(
                type(graph[k]) is int and graph[k] > 0
                for k in ("nodes", "reverse_sweeps", "edge_visits")
            ),
            "actual reverse algorithm executed",
        )
    for name in ("mutations", "stats", "domain"):
        G.require(
            canonical_equal(report[name], read(directory / (name + ".json"))),
            "metadata binding",
        )
    G.require(
        canonical_equal(report["domain"], M.domain_metadata())
        and canonical_equal(
            production.source_manifest(), read(directory / "source_bridge.json")
        )
        and canonical_equal(
            independent.replay_manifest(), report["independent_arithmetic"]
        )
        and report["production_jacobians_used_as_inputs"] is False
        and report["finite_direction_sampling"] is False
        and all(report[k] is False for k in FALSE_FLAGS),
        "exact continuum scope",
    )
    expected_stats = dict(
        cases=3,
        matrices=13,
        total_slots=206707,
        main_slots=106861,
        mutation_slots=99846,
        required_baseline_zero_slots=53501,
        outputs=22,
        parent_files=13,
    )
    G.require(
        {k: report["stats"][k] for k in expected_stats} == expected_stats
        and set(report["stats"]["matrices_by_name"]) == set(M.MATRIX_NAMES),
        "complete coverage",
    )
    for name, shape in M.SHAPES.items():
        record = read(directory / (name + ".json"))
        rows, cols = shape
        G.require(
            record["schema"] == M.MATRIX_SCHEMA
            and record["shape"] == list(shape)
            and len(record["entries"]) == rows * cols
            and all(
                entry[:2] == list(divmod(i, cols)) and type(entry[2]) is str
                for i, entry in enumerate(record["entries"])
            ),
            "full saved slots",
        )
        nz = sum(entry[2] != "0" for entry in record["entries"])
        G.require(
            report["stats"]["matrices_by_name"][name]
            == dict(
                shape=list(shape), slots=rows * cols, nonzero_slots=nz, all_zero=nz == 0
            ),
            "saved counts",
        )
    parents = input_records()
    G.require(
        all(
            (directory / "parent-inputs" / n).read_bytes() == raw
            for n, raw in parents.items()
        )
        and canonical_equal(
            M.parent_provenance_manifest(parents),
            read(directory / "parent_provenance.json"),
        ),
        "complete qualified parents",
    )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["numpy"] == "2.2.6"
        and dependency["versions"]["sympy"] == "1.13.3",
        "registered installed dependencies",
    )
    for i, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "runtime file identity")
    G.require(
        sources(budget)
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "immutable sources",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "complete histories preserved",
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
        G.sha(ROOT / "scripts/nr_owned_control.py")
        == "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1",
        "unchanged supervisor",
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
        json.dumps({name: result[name] for name in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

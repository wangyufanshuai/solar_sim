"""Owned complete actual-volume real-formula linearization; unexecuted candidate."""

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
import nr_case12_actual_volume_linearization as M  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

METHOD = "nr-case12-actual-volume-linearization-controls-v1"
HELPER = "scripts/run-nr-k3-case12-uniform-frequency-growth.py"
HELPER_SHA = "9d7198189e500d6e9a0e1396220216c1862d697cef29d557947a31c9ff2c08ae"
PARENT = G.EVIDENCE / M.PARENT_DIRECTORY
PARENT_GATE, PARENT_WORKER = M.PARENT_GATE, M.PARENT_WORKER
EXTRA = (
    "scripts/nr_case12_actual_volume_jet.py",
    "scripts/nr_case12_actual_volume_linearization.py",
    "scripts/nr_case12_actual_volume_replay.py",
    "scripts/tests/test_nr_case12_actual_volume_linearization.py",
    "scripts/run-nr-k3-case12-actual-volume-linearization.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-actual-volume-linearization.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-actual-volume-linearization.md",
    "science/numerical_relativity/RESULTS-20261015-case12-uniform-frequency-growth.md",
    "science/numerical_relativity/NOTE-20261015-case12-actual-volume-linearization-next.md",
)
TEST_FILES = (EXTRA[3], "scripts/tests/test_nr_integer_polynomial_replay.py")
# Freeze explicit AST function/instance counts before the only owned execution.
TEST_REGISTRATION = ((34, 85), (21, 73))
SCOPE = "fixed-case12 actual continuum volume real-formula Frechet linearization in all 58 off-constraint states and 174 independent spatial gradients; no FP64, SBP, SAT, evolution or nonlinear stability qualification"
QUALIFICATION = "actual_volume_real_formula_linearization_validated"
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "full_frequency_energy_validated",
    "local_differential_constraint_pde_derived",
    "constraint_damping_proved",
    "zero_frequency_full43_inverse_exists",
    "nonlinear_stability_validated",
    "physical_boundary_validated",
    "constraint_convergence_validated",
    "full_python_semantics_proved",
    "independent_external_review",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "gpu_executed",
    "historical_results_regraded",
    "eight_ray_rerun",
    "physical43_uniform_euclidean_growth_validated",
    "constraint_derivative_loss_absent_proved",
    "variable_background_energy_validated",
    "actual_binary64_rhs_executed",
    "actual_constraint_diagnostic_bridge_proved",
    "sbp_semidiscrete_energy_validated",
)


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen accepted growth runner")
    spec = importlib.util.spec_from_file_location(
        "nr_actual_volume_parent", ROOT / HELPER
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read(path):
    return json.loads(Path(path).read_bytes())


def canonical_equal(actual, expected):
    return helper().canonical_equal(actual, expected)


def parent_gate():
    gate = helper().qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["full58_uniform_frequency_l2_growth_validated"] is True
        and gate["physical43_weighted_frequency_growth_validated"] is True,
        "both precise parent growth qualifications",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 678
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 678 accepted sources unchanged",
    )
    G.require(not set(table).intersection(EXTRA), "nine additive actual-volume sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 687, "687-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(observed == expected and len(observed) == 853, "complete growth evidence")
    table[PARENT.name] = observed
    G.require(
        len(table) == 28 and sum(map(len, table.values())) == 20409,
        "twenty-eight immutable histories",
    )
    return table


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
            child.returncode == 0, "actual-volume controls failed; no automatic retry"
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def input_records():
    parent_gate()
    result = {}
    for name, (path, digest) in M.PARENT_FILES.items():
        raw = G.contained(PARENT, path).read_bytes()
        G.require(
            G.hashlib.sha256(raw).hexdigest() == digest, "fixed parent input bytes"
        )
        result[name] = raw
    M.parent_provenance_manifest(result)
    return result


def replay_inputs():
    return {"parent-inputs/" + name for name in M.PARENT_FILES} | {
        name + ".json" for name in M.RECORD_ORDER
    }


def independent_oracle(raw, check):
    # Shared strict parent codec, separate extraction; no production jet or oracle helper.
    j = V.decode_matrix(json.loads(raw["J58.json"]), shape=(58, 58), max_degree=0)
    k = V.decode_matrix(json.loads(raw["K58.json"]), shape=(58, 58), max_degree=1)
    out = {field: [] for field in ("J", "Ax", "Ay", "Az")}
    for i in range(58):
        check()
        out["J"].append([j[i][col].get((0, 0, 0), F(0)) for col in range(58)])
        for axis, field in enumerate(("Ax", "Ay", "Az")):
            exponent = tuple(int(component == axis) for component in range(3))
            out[field].append([k[i][col].get(exponent, F(0)) for col in range(58)])
        G.require(
            all(sum(exp) == 1 for poly in k[i] for exp in poly),
            "independent K homogeneous linear coefficients",
        )
    return out


def independent_chart_controls(chart):
    names = ("omit-alpha-center", "omit-chi-center", "omit-chi-factor-two")
    rows = chart.get("chain_rule_negative_controls", [])
    if (
        len(rows) != 3
        or chart.get("chain_rule_controls_are_case12_rhs_counterexamples") is not False
    ):
        return False
    for index, row in enumerate(rows):
        slot = 6 if index == 0 else 10
        if (
            row.get("name") != names[index]
            or type(row.get("slot")) is not int
            or row["slot"] != slot
            or row.get("rejected") is not True
        ):
            return False
        a, b, difference = (
            M.rational(row[field])
            for field in (
                "actual_correct_coefficient",
                "actual_wrong_coefficient",
                "actual_gap",
            )
        )
        expected_bad = (F(1), F(2), M.rational(chart["chi"]["value"]))[index]
        field = chart["alpha" if index == 0 else "chi"]
        if (
            a != M.rational(dict(field["coefficients"])[slot])
            or b != expected_bad
            or a == b
            or a - b != difference
        ):
            return False
    return True


def replay(directory, budget, stage):
    import nr_case12_actual_volume_replay as independent
    import nr_case12_actual_volume_jet as production

    raw = {
        name: (directory / "parent-inputs" / name).read_bytes()
        for name in M.PARENT_FILES
    }
    provenance = M.parent_provenance_manifest(raw)
    oracle = independent_oracle(raw, budget._check_deadline)
    all_cases, stats, executions, chart_checks = {}, {}, {}, {}

    def compare(name, record):
        budget.guard()
        G.require(
            canonical_equal(read(directory / (name + ".json")), record),
            "independent mismatch: " + name,
        )

    for case in M.CASE_NAMES:
        budget.guard()
        # Both real parameter controls are evaluated from the actual AST anew.
        request = dict(
            kappa1=F(1, 5) if case == "kappa1_mutant" else F(1, 10),
            ordering_scale=F(2, 5) if case == "ordering_mutant" else F(1, 5),
        )
        actual = independent.evaluate_case(
            **request, guard=budget.guard, check=budget._check_deadline
        )
        values = {key: actual[key] for key in ("F0", "J", "Ax", "Ay", "Az")}
        for key, source in (("RJ", "J"), ("Rx", "Ax"), ("Ry", "Ay"), ("Rz", "Az")):
            values[key] = [
                [actual[source][i][j] - oracle[source][i][j] for j in range(58)]
                for i in range(58)
            ]
        all_cases[case] = values
        for field in M.FIELDS:
            name = case + "__" + field
            shape = (58, 1 if field == "F0" else 58)
            saved = M.decode_matrix(read(directory / (name + ".json")), shape)
            G.require(
                canonical_equal(values[field], saved),
                "independent full actual-RHS matrix mismatch: " + name,
            )
            nonzero = sum(bool(value) for row in values[field] for value in row)
            stats[name] = dict(
                shape=list(shape),
                slots=shape[0] * shape[1],
                nonzero_slots=nonzero,
                all_zero=nonzero == 0,
            )
        saved_execution = read(directory / (case + "__execution.json"))
        G.require(
            canonical_equal(
                saved_execution["requested_parameters"],
                {key: str(value) for key, value in request.items()},
            )
            and canonical_equal(saved_execution["parameters"], actual["parameters"])
            and canonical_equal(saved_execution["chart"], actual["chart"]),
            "independent complete parameter/chart identity",
        )
        executions[case] = dict(
            parameters=actual["parameters"],
            chart=actual["chart"],
            operations=actual["operations"],
            independent_backend=actual["independent_backend"],
        )
        chart_checks[case] = independent_chart_controls(actual["chart"])
        stage("independent-" + case + "-complete")
    controls = {}
    for case in M.CASE_NAMES[1:]:
        changes, residuals = {}, {}
        for field in ("F0", "J", "Ax", "Ay", "Az"):
            values = all_cases[case][field]
            n = sum(
                value != all_cases["baseline"][field][i][j]
                for i, row in enumerate(values)
                for j, value in enumerate(row)
            )
            columns = 1 if field == "F0" else 58
            changes[field] = dict(
                shape=[58, columns],
                slots=58 * columns,
                nonzero_slots=n,
                all_zero=n == 0,
            )
        for field in ("RJ", "Rx", "Ry", "Rz"):
            residuals[field] = stats[case + "__" + field]
        causal = {}
        for field, residual in (("J", "RJ"), ("Ax", "Rx"), ("Ay", "Ry"), ("Az", "Rz")):
            causal[field] = sum(
                all_cases[case][field][i][j] != all_cases["baseline"][field][i][j]
                and all_cases[case][residual][i][j] != 0
                for i in range(58)
                for j in range(58)
            )
        changed = (
            changes["J"]["nonzero_slots"] > 0
            if case == "kappa1_mutant"
            else any(changes[f]["nonzero_slots"] > 0 for f in ("Ax", "Ay", "Az"))
        )
        rejected = (
            causal["J"] > 0
            if case == "kappa1_mutant"
            else any(causal[f] > 0 for f in ("Ax", "Ay", "Az"))
        )
        controls[case] = dict(
            parameters={k: str(v) for k, v in M.variant_parameters(case).items()},
            actual_changes=changes,
            actual_bridge_differences=residuals,
            causal_changed_residual_slots=causal,
            parameter_caused_registered_change=changed,
            stale_original_symbol_rejected=rejected,
            accepted=changed and rejected,
        )
    mutations = dict(
        schema="nr-case12-actual-volume-real-parameter-controls-v1",
        controls=controls,
        accepted=all(row["accepted"] for row in controls.values()),
        prefilled_theoretical_pattern=False,
    )
    acceptance = dict(
        baseline_equilibrium=stats["baseline__F0"]["all_zero"],
        algebraic_jacobian_bridge=stats["baseline__RJ"]["all_zero"],
        spatial_jacobian_bridge=all(
            stats["baseline__" + field]["all_zero"] for field in ("Rx", "Ry", "Rz")
        ),
        real_parameter_controls=mutations["accepted"],
        chart_chain_rule_controls=all(chart_checks.values()),
    )
    acceptance["accepted"] = all(acceptance.values())
    summary = dict(
        cases=3,
        matrices=27,
        main_slots=26970,
        mutation_slots=53940,
        total_slots=80910,
        required_baseline_zero_slots=13514,
        outputs=36,
        parent_files=9,
        matrices_by_name=stats,
    )
    compare("mutations", mutations)
    compare("acceptance", acceptance)
    compare("stats", summary)
    compare("source_bridge", production.source_manifest())
    compare("parent_provenance", provenance)
    compare("domain", M.domain_metadata())
    hashes = {
        name: G.sha(G.contained(directory, name)) for name in sorted(replay_inputs())
    }
    G.require(len(hashes) == 45, "all 45 replay inputs")
    return dict(
        schema="nr-case12-independent-actual-volume-linearization-v1",
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
        shared_trusted_base="actual AST adaptation, array routing, chart/packing and saved codecs; independent scalar AD and determinant/inverse",
        production_jacobians_used_as_inputs=False,
        finite_direction_sampling=False,
        **{name: False for name in FALSE_FLAGS},
    )


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
        **{name: False for name in (*FALSE_FLAGS, QUALIFICATION)},
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
        result["snapshot_bytes"] = helper().foundation().snapshot(budget, table)
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
                "unique registered actual-volume output in frozen order",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        result["acceptance"] = M.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(saved == expected, "all 36 registered actual-volume outputs")
        stage("complete-candidate-evidence-saved", outputs=len(saved))
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", helper().foundation().dependencies(budget))
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
            "actual volume bridge failed; retain complete counterexample, no automatic repair or retry",
        )
        result.update(passed=True, completed=True, **{QUALIFICATION: True})
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, **{QUALIFICATION: False})
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {name: result[name] for name in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    """Metadata and hashes only: never evaluate jets, controls or residuals here."""
    import nr_case12_actual_volume_jet as production
    import nr_case12_actual_volume_replay as independent

    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["phase"] == "complete"
        and result["passed"] is result["completed"] is True
        and result["errors"] == []
        and result[QUALIFICATION] is True,
        "complete qualified actual-volume worker",
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
        "complete exact test identities",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        canonical_equal(report, result["replay"])
        and report["passed"] is True
        and report["computation_completed"] is True
        and report["scope"] == SCOPE
        and report["parent_gate_sha256"] == PARENT_GATE
        and report["schema"] == "nr-case12-independent-actual-volume-linearization-v1"
        and set(report["input_hashes"]) == replay_inputs()
        and len(report["input_hashes"]) == 45,
        "complete independent replay",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replay input unchanged"
        )
    G.require(
        canonical_equal(report["acceptance"], result["acceptance"])
        and canonical_equal(report["acceptance"], read(directory / "acceptance.json"))
        and all(value is True for value in report["acceptance"].values()),
        "complete baseline and negative acceptance",
    )
    G.require(
        set(report["acceptance"])
        == {
            "baseline_equilibrium",
            "algebraic_jacobian_bridge",
            "spatial_jacobian_bridge",
            "real_parameter_controls",
            "chart_chain_rule_controls",
            "accepted",
        },
        "six explicit acceptance decisions",
    )
    G.require(
        set(report["independent_executions"]) == set(M.CASE_NAMES),
        "three independent actual evaluations",
    )
    for case, execution in report["independent_executions"].items():
        saved = read(directory / (case + "__execution.json"))
        G.require(
            canonical_equal(execution["chart"], saved["chart"])
            and canonical_equal(execution["parameters"], saved["parameters"])
            and len(execution["chart"]["chain_rule_negative_controls"]) == 3
            and all(
                row["rejected"] is True and row["actual_gap"] != "0"
                for row in execution["chart"]["chain_rule_negative_controls"]
            ),
            "saved nonzero chart controls, without finalizer recomputation",
        )
        graph = execution["independent_backend"]
        G.require(
            graph["method"] == "exact reverse scalar graph"
            and all(
                type(graph[key]) is int and graph[key] > 0
                for key in ("nodes", "reverse_sweeps", "edge_visits")
            ),
            "actual independent arithmetic graph executed",
        )
    for name in ("mutations", "stats", "domain"):
        G.require(
            canonical_equal(report[name], read(directory / (name + ".json"))),
            "saved metadata binding",
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
        "precise real-formula and independent scope",
    )
    expected_stats = dict(
        cases=3,
        matrices=27,
        main_slots=26970,
        mutation_slots=53940,
        total_slots=80910,
        required_baseline_zero_slots=13514,
        outputs=36,
        parent_files=9,
    )
    G.require(
        {k: report["stats"][k] for k in expected_stats} == expected_stats
        and set(report["stats"]["matrices_by_name"]) == set(M.MATRIX_NAMES),
        "complete registered matrix coverage",
    )
    for name, shape in M.SHAPES.items():
        record = read(directory / (name + ".json"))
        # Saved string inspection only, no Fraction construction or residual computation.
        G.require(
            record["schema"] == M.MATRIX_SCHEMA
            and record["shape"] == list(shape)
            and len(record["entries"]) == shape[0] * shape[1]
            and all(
                entry[:2] == list(divmod(index, shape[1])) and type(entry[2]) is str
                for index, entry in enumerate(record["entries"])
            ),
            "full saved slot identities",
        )
        stats = report["stats"]["matrices_by_name"][name]
        nonzero = sum(entry[2] != "0" for entry in record["entries"])
        G.require(
            stats
            == dict(
                shape=list(shape),
                slots=shape[0] * shape[1],
                nonzero_slots=nonzero,
                all_zero=nonzero == 0,
            ),
            "saved nonzero counts",
        )
    parent = input_records()
    G.require(
        all(
            (directory / "parent-inputs" / n).read_bytes() == raw
            for n, raw in parent.items()
        )
        and canonical_equal(
            M.parent_provenance_manifest(parent),
            read(directory / "parent_provenance.json"),
        ),
        "qualified original parent inputs",
    )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "registered installed dependency versions",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "loaded runtime file identity")
    G.require(
        sources(budget)
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "full immutable source closure",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "all histories preserved",
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

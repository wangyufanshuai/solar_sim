"""One owned fixed-case12 all-real-direction principal closure certificate."""

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
import nr_polynomial_certificate_replay as V  # noqa: E402

METHOD = "nr-case12-polynomial-closure-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-section-controls-v1-20261014"
PARENT_GATE = "d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be"
PARENT_WORKER = "2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d"
HELPER = "scripts/run-nr-k3-case12-polynomial-section.py"
HELPER_SHA = "f9cba84d97f79fe663d24b3fd487dc886778cc3eaebb3cbadd0483064da373ef"
EXTRA = (
    "scripts/nr_case12_polynomial_closure.py",
    "scripts/tests/test_nr_case12_polynomial_closure.py",
    "scripts/run-nr-k3-case12-polynomial-closure.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-closure.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-closure.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-section.md",
)
PARENT_INPUTS = ("Dtilde.json", "Stilde.json", "domain.json", "denominators.json")
MATRIX_SPECS = {
    "K": ((58, 58), 1),
    "transport": ((43, 58), 4),
    "quotient_numerator": ((43, 43), 10),
    "residual": ((43, 58), 13),
    "delta_K": ((58, 58), 1),
    "delta_residual": ((43, 58), 13),
}
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "direction_uniform_energy_validated",
    "uniform_strong_hyperbolicity_validated",
    "nonlinear_stability_validated",
    "physical_boundary_validated",
    "constraint_convergence_validated",
    "constraint_damping_proved",
    "zero_frequency_full43_inverse_exists",
    "full_python_semantics_proved",
    "independent_external_review",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "gpu_executed",
    "historical_results_regraded",
    "eight_ray_rerun",
)


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen section runner required")
    spec = importlib.util.spec_from_file_location(
        "nr_closure_history_only", ROOT / HELPER
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parent_gate():
    G.require(
        G.sha(PARENT / "qualification-gate.json") == PARENT_GATE
        and G.sha(PARENT / "worker-result.json") == PARENT_WORKER,
        "qualified parent identity",
    )
    gate = G.read_terminal(PARENT / "qualification-gate.json")
    G.require(
        gate["passed"]
        is gate["completed"]
        is gate["all_real_section_formula_checked"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete right-section parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 580
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive closure sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 586, "586-source closure contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 621,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 13 and sum(map(len, table.values())) == 9337,
        "thirteen immutable historical trees",
    )
    return table


def registered_tests():
    tree = ast.parse((ROOT / EXTRA[1]).read_text(encoding="utf-8"))
    tests = {}
    for node in tree.body:
        if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
            continue
        count = 1
        for item in node.decorator_list:
            G.require(
                isinstance(item, ast.Call)
                and ast.unparse(item.func) == "pytest.mark.parametrize"
                and len(item.args) == 2
                and isinstance(item.args[1], (ast.List, ast.Tuple))
                and not item.keywords,
                "explicit parameterized control registration",
            )
            count *= len(item.args[1].elts)
        G.require(node.name not in tests and count > 0, "unique tests")
        tests[node.name] = count
    G.require(
        len(tests) == 27 and sum(tests.values()) == 63,
        "exact27 functions and63 controls",
    )
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
        "all registered controls without failure or skip",
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
        str(ROOT / EXTRA[1]),
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
        G.require(child.returncode == 0, "closure controls failed; no automatic retry")
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def scaled_difference(delta, left, right, budget):
    G.require(V.matrix_shape(left) == V.matrix_shape(right), "same residual dimensions")
    result = []
    one = {(0, 0, 0): F(1)}
    for a, b in zip(left, right, strict=True):
        budget.guard()
        row = []
        for x, y in zip(a, b, strict=True):
            poly = {}
            V.add_product(poly, delta, x)
            V.add_product(poly, y, one, factor=F(-1))
            row.append(poly)
        result.append(row)
    return result


def matrix_stats(matrix, cap):
    rows, columns = V.matrix_shape(matrix)
    return dict(
        shape=[rows, columns],
        slots=rows * columns,
        nonzero_slots=sum(bool(poly) for row in matrix for poly in row),
        terms=V.coefficient_count(matrix),
        degree_max=max(
            (sum(powers) for row in matrix for poly in row for powers in poly),
            default=-1,
        ),
        degree_cap=cap,
    )


def replay(directory, budget):
    hashes = {}

    def load(name):
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    gate = parent_gate()
    d = V.decode_matrix(load("parent-inputs/Dtilde.json"), shape=(43, 58), max_degree=3)
    s = V.decode_matrix(load("parent-inputs/Stilde.json"), shape=(58, 43), max_degree=6)
    parent_polys = load("parent-inputs/denominators.json")
    domain = helper().verify_domain(load("parent-inputs/domain.json"), parent_polys)
    G.require(
        all(
            hashes["parent-inputs/" + name] == gate["artifact_hashes"][name]
            for name in PARENT_INPUTS
        ),
        "exact qualified parent input bytes",
    )
    delta = domain.pop("delta")
    matrices = {
        name: V.decode_matrix(load(name + ".json"), shape=shape, max_degree=cap)
        for name, (shape, cap) in MATRIX_SPECS.items()
    }
    k = matrices["K"]
    G.require(
        all(sum(powers) == 1 for row in k for poly in row for powers in poly),
        "independent homogeneous principal degree-one check",
    )
    G.require(
        not any(poly for row in k[:11] for poly in row)
        and not any(poly for row in k for poly in row[:11]),
        "frozen first11 base block is zero",
    )
    t = V.multiply(d, k, guard=budget.guard)
    a = V.multiply(t, s, guard=budget.guard)
    n = scaled_difference(delta, t, V.multiply(a, d, guard=budget.guard), budget)
    G.require(
        t == matrices["transport"]
        and a == matrices["quotient_numerator"]
        and n == matrices["residual"],
        "independent full closure products differ",
    )
    checked = V.zero_check(n, (43, 58))
    stats = {
        name: matrix_stats(matrices[name], MATRIX_SPECS[name][1])
        for name in ("K", "transport", "quotient_numerator")
    }
    stats["residual"] = dict(
        slots_checked=checked, nonzero_slots=0, coefficientwise_zero=True
    )
    G.require(stats == load("stats.json"), "independent complete statistics")
    r = V.decode_polynomial(parent_polys["r"], max_degree=2)
    denominator = {}
    V.add_product(denominator, r, delta)
    G.require(
        V.decode_polynomial(load("closure-denominator.json"), max_degree=10)
        == denominator,
        "nonzero closure denominator r*delta",
    )
    expected_change = [[{} for _ in range(58)] for _ in range(58)]
    expected_change[18][22] = {(1, 0, 0): F(1)}
    G.require(
        matrices["delta_K"] == expected_change, "registered kernel-breaking K feedback"
    )
    dt = V.multiply(d, expected_change, guard=budget.guard)
    da = V.multiply(dt, s, guard=budget.guard)
    dn = scaled_difference(delta, dt, V.multiply(da, d, guard=budget.guard), budget)
    nonzero = sum(bool(poly) for row in dn for poly in row)
    G.require(
        dn == matrices["delta_residual"] and nonzero > 0,
        "complete nonzero physical principal perturbation",
    )
    analytic_witness = [[{} for _ in range(58)] for _ in range(43)]
    V.add_product(analytic_witness[4][22], denominator, {(1, 0, 0): F(1)})
    G.require(
        dn == analytic_witness and nonzero == 1,
        "independent r*delta*x kernel-breaking witness",
    )
    mutation = load("mutation.json")
    G.require(
        mutation["name"] == "theta-driver-kernel-feedback"
        and mutation["nonzero_slots"] == nonzero
        and mutation["entry"] == [18, 22]
        and mutation["expected_nonzero_coordinate"] == [4, 22],
        "negative witness metadata",
    )
    return dict(
        schema="nr-case12-independent-polynomial-closure-replay-v1",
        passed=True,
        all_direction_closure_validated=True,
        closure_slots=checked,
        closure_coefficients=0,
        mutation_nonzero_slots=nonzero,
        mutation_coefficients=V.coefficient_count(dn),
        parent_gate_sha256=PARENT_GATE,
        fixed_domain=domain,
        closure_denominator_over_r_fifth_lower="1/2",
        input_hashes=hashes,
        library="stdlib Fraction sparse convolution; no SymPy or direction sampling",
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
        "single numerical thread",
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
        all_direction_closure_validated=False,
        parent_gate_sha256=PARENT_GATE,
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        coefficient_acceptance="exact-zero-only",
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
        table, before = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", before)
        result["snapshot_bytes"] = helper().snapshot(budget, table)
        gate = parent_gate()
        for name in PARENT_INPUTS:
            raw = (PARENT / name).read_bytes()
            G.require(
                G.hashlib.sha256(raw).hexdigest() == gate["artifact_hashes"][name],
                "parent input identity",
            )
            budget.save("parent-inputs/" + name, raw)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_polynomial_closure as P
        import nr_case12_polynomial_section as S

        stage("closure-construction-start")
        certificate = P.build_certificate(PARENT, guard=budget.guard)
        G.require(
            certificate["section_rebuilt"]
            is certificate["direction_uniform_energy_proved"]
            is certificate["physical_boundary_proved"]
            is certificate["full_python_semantics_proved"]
            is False,
            "fixed closure only without parent rebuild",
        )
        result["theorem"] = certificate["theorem"]
        result["section_rebuilt"] = False
        stage("closure-construction-complete", slots=2494)
        for name in ("K", "transport", "quotient_numerator", "residual"):
            budget.record(
                name + ".json", S.encode_matrix(certificate[name], guard=budget.guard)
            )
        budget.record(
            "closure-denominator.json",
            S.canonical_polynomial(certificate["closure_denominator"]),
        )
        for name in ("source_bridge", "parent_provenance", "stats"):
            budget.record(name + ".json", certificate[name])
        witness = P.mutation_witness(certificate, guard=budget.guard)
        for name in ("delta_K", "delta_residual"):
            budget.record(
                name + ".json", S.encode_matrix(witness[name], guard=budget.guard)
            )
        budget.record(
            "mutation.json",
            {
                key: value
                for key, value in witness.items()
                if key not in ("delta_K", "delta_residual")
            },
        )
        stage("closure-and-mutation-saved")
        result["replay"] = replay(directory, budget)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", closure_slots=2494)
        budget.record("dependencies.json", helper().dependencies(budget))
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            passed=True,
            completed=True,
            all_direction_closure_validated=True,
            source_after=table,
            old_artifacts_unchanged=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False, completed=False, all_direction_closure_validated=False
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


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["all_direction_closure_validated"]
        is True
        and not result["errors"],
        "complete closure certificate",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["case_indices"] == [12]
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-zero-only"
        and result["parent_gate_sha256"] == PARENT_GATE,
        "fixed principal formula scope",
    )
    G.require(
        result["section_rebuilt"] is False
        and result["theorem"]
        == "fixed-case12 rational principal formulas: Dhat K(I-S Dhat)=0 for all real v!=0",
        "registered formula theorem and unchanged parent reuse",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "complete saved controls",
    )
    import nr_case12_polynomial_closure as P

    G.require(
        P.source_bridge_manifest() == read(directory / "source_bridge.json"),
        "frozen original K source bridge",
    )
    G.require(
        P.parent_provenance_manifest(PARENT)
        == read(directory / "parent_provenance.json"),
        "qualified parent provenance manifest",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        report == result["replay"]
        and report["passed"] is report["all_direction_closure_validated"] is True
        and report["schema"] == "nr-case12-independent-polynomial-closure-replay-v1"
        and report["closure_slots"] == 2494
        and report["closure_coefficients"] == 0
        and type(report["mutation_nonzero_slots"]) is int
        and report["mutation_nonzero_slots"] == 1
        and report["mutation_coefficients"] > 0
        and report["parent_gate_sha256"] == PARENT_GATE
        and report["closure_denominator_over_r_fifth_lower"] == "1/2"
        and report["library"]
        == "stdlib Fraction sparse convolution; no SymPy or direction sampling",
        "complete independent owned closure replay",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update(name + ".json" for name in MATRIX_SPECS)
    expected.update(("stats.json", "closure-denominator.json", "mutation.json"))
    G.require(
        set(report["input_hashes"]) == expected,
        "complete13 replay input byte identities",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest,
            "replayed input bytes changed",
        )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "fixed dependencies",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "recorded dependency changed")
    table = sources(budget)
    G.require(
        table
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "final source closure",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "final historical closure",
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
        "frozen supervisor",
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

"""One owned fixed-case12 ODE blocks and exact quotient cancellation batch."""

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

METHOD = "nr-case12-polynomial-blocks-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-closure-controls-v1-20261014"
PARENT_GATE = "3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1"
PARENT_WORKER = "c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2"
HELPER = "scripts/run-nr-k3-case12-polynomial-closure.py"
HELPER_SHA = "ddb30b6cb6445b8412161bf88d1cc2faef1b43d3c6214ce2ccf7119e18eb6ec3"
EXTRA = (
    "scripts/nr_case12_polynomial_blocks.py",
    "scripts/tests/test_nr_case12_polynomial_blocks.py",
    "scripts/run-nr-k3-case12-polynomial-blocks.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-blocks.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-blocks.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-closure.md",
)
PARENT_INPUTS = (
    "quotient_numerator.json",
    "parent-inputs/domain.json",
    "parent-inputs/denominators.json",
)
MATRIX_CAPS = dict(
    Ot=2,
    Pt=2,
    B=10,
    division_quotient=4,
    division_remainder=10,
    division_identity=10,
    multiplication_residual=10,
    ode_idempotence=4,
    left_annihilation=12,
    right_annihilation=12,
)
MUTATION_CAPS = dict(delta_Ot=2, mutant_idempotence=4)
BLOCK_NAMES = ("ode_idempotence", "left_annihilation", "right_annihilation")
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
        is gate["all_direction_closure_validated"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete principal closure parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 586
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive closure sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 592, "592-source blocks contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 622,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 14 and sum(map(len, table.values())) == 9959,
        "fourteen immutable historical trees",
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
        len(tests) == 28 and sum(tests.values()) == 53,
        "exact28 functions and53 controls",
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


def combination(terms, budget):
    shape = V.matrix_shape(terms[0][1])
    G.require(
        all(V.matrix_shape(matrix) == shape for _, matrix in terms),
        "linear combination dimensions",
    )
    result = [[{} for _ in range(shape[1])] for _ in range(shape[0])]
    for i in range(shape[0]):
        budget.guard()
        for j in range(shape[1]):
            for scalar, matrix in terms:
                V.add_product(result[i][j], scalar, matrix[i][j])
    return result


def replay(directory, budget):
    hashes = {}

    def load(name):
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    gate = parent_gate()
    parent = {name: load("parent-inputs/" + name) for name in PARENT_INPUTS}
    G.require(
        all(
            hashes["parent-inputs/" + name] == gate["artifact_hashes"][name]
            for name in PARENT_INPUTS
        ),
        "qualified closure input bytes",
    )
    a = V.decode_matrix(
        parent["quotient_numerator.json"], shape=(43, 43), max_degree=10
    )
    polys = parent["parent-inputs/denominators.json"]
    domain = helper().helper().verify_domain(parent["parent-inputs/domain.json"], polys)
    r = V.decode_polynomial(polys["r"], max_degree=2)
    g = V.decode_polynomial(polys["g"], max_degree=2)
    sigma = V.decode_polynomial(polys["section_denominator"], max_degree=6)
    delta = domain.pop("delta")
    one, minus = {(0, 0, 0): F(1)}, {(0, 0, 0): F(-1)}
    axes = [{tuple(int(k == axis) for k in range(3)): F(1)} for axis in range(3)]
    b = {(1, 0, 0): F(3, 100), (0, 1, 0): F(-1, 25), (0, 0, 1): F(1, 20)}
    identity = [[one.copy() if i == j else {} for j in range(43)] for i in range(43)]
    ot = [[{} for _ in range(43)] for _ in range(43)]
    for start, width in ((8, 1), (11, 3), (20, 6), (38, 1)):
        for k in range(3):
            for ell in range(3):
                for j in range(width):
                    V.add_product(
                        ot[start + width * k + j][start + width * ell + j],
                        axes[k],
                        axes[ell],
                    )
    pt = combination(((r, identity), (minus, ot)), budget)
    negative_bs = {}
    V.add_product(negative_bs, b, sigma, factor=F(-1))
    intrinsic = combination(((one, a), (negative_bs, pt)), budget)
    matrices = {
        name: V.decode_matrix(load(name + ".json"), shape=(43, 43), max_degree=cap)
        for name, cap in {**MATRIX_CAPS, **MUTATION_CAPS}.items()
    }
    G.require(
        matrices["Ot"] == ot and matrices["Pt"] == pt and matrices["B"] == intrinsic,
        "independent original ODE and shift construction",
    )
    negative_r = {powers: -value for powers, value in r.items()}
    expected = dict(
        ode_idempotence=combination(
            ((one, V.multiply(ot, ot, guard=budget.guard)), (negative_r, ot)), budget
        ),
        left_annihilation=V.multiply(intrinsic, ot, guard=budget.guard),
        right_annihilation=V.multiply(ot, intrinsic, guard=budget.guard),
    )
    negative_sigma = {powers: -value for powers, value in sigma.items()}
    multiplication = combination(
        ((one, a), (negative_sigma, matrices["division_quotient"])), budget
    )
    division_identity = combination(
        ((one, multiplication), (minus, matrices["division_remainder"])), budget
    )
    expected.update(
        multiplication_residual=multiplication, division_identity=division_identity
    )
    G.require(
        all(matrices[name] == matrix for name, matrix in expected.items()),
        "all saved residuals equal independent complete products",
    )
    stats = {
        name: matrix_stats(matrices[name], cap) for name, cap in MATRIX_CAPS.items()
    }
    G.require(
        stats == load("stats.json"), "all matrix statistics match exact saved data"
    )
    trace = {}
    for i in range(43):
        V.add_product(trace, ot[i][i], one)
    V.add_product(trace, r, one, factor=F(-11))
    expected_scalars = dict(
        r=r, g=g, delta=delta, sigma=sigma, b=b, trace_residual=trace
    )
    scalars = load("scalars.json")
    G.require(
        set(scalars) == set(expected_scalars)
        and all(
            V.decode_polynomial(scalars[name], max_degree=8) == value
            for name, value in expected_scalars.items()
        ),
        "complete independent denominator, shift and rank trace identities",
    )
    leading = max(sigma)
    normal = all(
        not all(e >= d for e, d in zip(powers, leading, strict=True))
        for row in matrices["division_remainder"]
        for poly in row
        for powers in poly
    )

    def is_zero(matrix):
        return not any(poly for row in matrix for poly in row)

    acceptance = {name: is_zero(expected[name]) for name in BLOCK_NAMES}
    acceptance.update(
        trace_rank=not trace,
        division_identity=is_zero(division_identity),
        division_remainder_zero=is_zero(matrices["division_remainder"]),
        multiplication_identity=is_zero(multiplication),
        remainder_normal_form=normal,
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        acceptance == load("acceptance.json"),
        "independent candidate acceptance differs",
    )
    change = [[{} for _ in range(43)] for _ in range(43)]
    V.add_product(change[8][8], axes[0], axes[0])
    G.require(
        matrices["delta_Ot"] == change,
        "registered doubled longitudinal projector coefficient",
    )
    mutant = combination(((one, ot), (one, change)), budget)
    mutation = combination(
        ((one, V.multiply(mutant, mutant, guard=budget.guard)), (negative_r, mutant)),
        budget,
    )
    G.require(
        mutation == matrices["mutant_idempotence"],
        "complete independently reconstructed projector defect",
    )
    nonzero = sum(bool(poly) for row in mutation for poly in row)
    meta = load("mutation.json")
    G.require(
        nonzero > 0
        and meta["name"] == "ode-projector-factor-two"
        and meta["entry"] == [8, 8]
        and meta["nonzero_slots"] == nonzero,
        "nonzero genuine projector error witness",
    )
    return dict(
        schema="nr-case12-independent-polynomial-blocks-replay-v1",
        passed=acceptance["accepted"],
        acceptance=acceptance,
        block_slots=3 * 1849,
        division_slots=1849,
        monomial_order="lex",
        ode_rank=11 if not trace and acceptance["ode_idempotence"] else None,
        pde_rank=32 if not trace and acceptance["ode_idempotence"] else None,
        mutation_nonzero_slots=nonzero,
        mutation_coefficients=V.coefficient_count(mutation),
        parent_gate_sha256=PARENT_GATE,
        fixed_domain=domain,
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
        ode_blocks_validated=False,
        exact_quotient_cancellation_validated=False,
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
        result["snapshot_bytes"] = helper().helper().snapshot(budget, table)
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
        import nr_case12_polynomial_blocks as P
        import nr_case12_polynomial_section as S

        stage("blocks-construction-start")
        certificate = P.build_certificate(PARENT, guard=budget.guard)
        stage("blocks-construction-complete")
        for name in MATRIX_CAPS:
            matrix = (
                certificate["block_residuals"][name]
                if name in BLOCK_NAMES
                else certificate[name]
            )
            budget.record(name + ".json", S.encode_matrix(matrix, guard=budget.guard))
        budget.record(
            "scalars.json",
            {
                name: S.canonical_polynomial(certificate[name])
                for name in ("r", "g", "delta", "sigma", "b", "trace_residual")
            },
        )
        for name in ("source_bridge", "parent_provenance", "stats", "acceptance"):
            budget.record(name + ".json", certificate[name])
        G.require(
            certificate["monomial_order"] == "lex", "registered division term order"
        )
        stage("complete-candidate-evidence-saved", acceptance=certificate["acceptance"])
        witness = P.mutation_witness(certificate, guard=budget.guard)
        for name in MUTATION_CAPS:
            budget.record(
                name + ".json", S.encode_matrix(witness[name], guard=budget.guard)
            )
        budget.record(
            "mutation.json",
            {k: v for k, v in witness.items() if k not in MUTATION_CAPS},
        )
        result["replay"] = replay(directory, budget)
        decisions = result["replay"]["acceptance"]
        result["candidate_decisions"] = dict(
            ode_blocks=all(decisions[name] for name in (*BLOCK_NAMES, "trace_rank")),
            exact_quotient_cancellation=all(
                decisions[name]
                for name in (
                    "division_identity",
                    "division_remainder_zero",
                    "multiplication_identity",
                    "remainder_normal_form",
                )
            ),
        )
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", helper().helper().dependencies(budget))
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
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "registered block/cancellation candidate failed; complete residual evidence retained",
        )
        result.update(
            passed=True,
            completed=True,
            ode_blocks_validated=True,
            exact_quotient_cancellation_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            ode_blocks_validated=False,
            exact_quotient_cancellation_validated=False,
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
        is result["ode_blocks_validated"]
        is result["exact_quotient_cancellation_validated"]
        is True
        and not result["errors"],
        "complete blocks/cancellation candidate",
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
        "fixed principal block scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    import nr_case12_polynomial_blocks as P

    G.require(
        P.source_bridge_manifest() == read(directory / "source_bridge.json"),
        "pure source binding",
    )
    G.require(
        P.parent_provenance_manifest(PARENT)
        == read(directory / "parent_provenance.json"),
        "parent provenance",
    )
    report = read(directory / "independent-replay.json")
    expected_acceptance = {
        *BLOCK_NAMES,
        "trace_rank",
        "division_identity",
        "division_remainder_zero",
        "multiplication_identity",
        "remainder_normal_form",
        "accepted",
    }
    G.require(
        set(report["acceptance"]) == expected_acceptance,
        "complete candidate decision schema",
    )
    G.require(
        report == result["replay"]
        and report["passed"] is True
        and all(value is True for value in report["acceptance"].values())
        and report["schema"] == "nr-case12-independent-polynomial-blocks-replay-v1"
        and report["block_slots"] == 5547
        and report["division_slots"] == 1849
        and report["monomial_order"] == "lex"
        and report["ode_rank"] == 11
        and report["pde_rank"] == 32
        and report["mutation_nonzero_slots"] > 0
        and report["mutation_coefficients"] > 0
        and report["parent_gate_sha256"] == PARENT_GATE
        and report["library"]
        == "stdlib Fraction sparse convolution; no SymPy or direction sampling",
        "complete owned independent replay",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update(name + ".json" for name in {**MATRIX_CAPS, **MUTATION_CAPS})
    expected.update(("stats.json", "scalars.json", "acceptance.json", "mutation.json"))
    G.require(
        set(report["input_hashes"]) == expected, "complete replay input byte identities"
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replayed bytes changed"
        )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "registered dependencies",
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
        "final history closure",
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

"""One owned fixed-case12 direction projector and action certificate batch."""

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

METHOD = "nr-case12-polynomial-projectors-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-spectral-controls-v1-20261014"
PARENT_GATE = "67e2eda4ab922a09390ff8207a709ede327ac1619caca5a1322c16fd3825b0e6"
PARENT_WORKER = "6b320f7812c754dd8a8ebfdf06168af9d90719e851e5391e047203641c1f7e9e"
HELPER = "scripts/run-nr-k3-case12-polynomial-spectral.py"
HELPER_SHA = "d4772efb2d7c247834e79a939e65c2693a61271ef8afcb2b56b9f32ff6c3ac6e"
EXTRA = (
    "scripts/nr_case12_polynomial_projectors.py",
    "scripts/tests/test_nr_case12_polynomial_projectors.py",
    "scripts/run-nr-k3-case12-polynomial-projectors.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-projectors.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-projectors.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-spectral.md",
)
PARENT_INPUTS = (
    "X.json",
    "Q.json",
    "Z1.json",
    "Z2.json",
    "univariate.json",
    "scalars.json",
    "parent-inputs/Pt.json",
    "parent-inputs/parent-inputs/parent-inputs/domain.json",
    "parent-inputs/parent-inputs/parent-inputs/denominators.json",
)
MATRIX_CAPS = dict(
    Q2=16,
    Q3=24,
    X3=12,
    X5=20,
    NO=18,
    N0=24,
    **{f"N{j}": 24 for j in range(1, 7)},
    **{f"M{j}": 20 for j in range(1, 7)},
    projector_completeness=24,
    action_completeness=20,
)
MUTATION_CAPS = dict(delta_N1=25, mutant_projector_completeness=25)
BRANCH_CONSTANTS = (
    F(2601, 100000),
    F(2601, 50000),
    F(2601, 5000),
    F(153, 125),
    F(459, 250),
    F(306, 125),
)
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
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen spectral runner required")
    spec = importlib.util.spec_from_file_location(
        "nr_spectral_history_only", ROOT / HELPER
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
        is gate["spectral_annihilator_validated"]
        is gate["six_branch_reduction_validated"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete spectral parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 598
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive projectors sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 604, "604-source projectors contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 645,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 16 and sum(map(len, table.values())) == 11238,
        "sixteen immutable historical trees",
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
        len(tests) == 25 and sum(tests.values()) == 63,
        "exact25 functions and63 controls",
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
        G.require(
            child.returncode == 0, "projector controls failed; no automatic retry"
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
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


def uni_add(a, b, factor=F(1)):
    result = dict(a)
    for power, value in b.items():
        result[power] = result.get(power, F(0)) + factor * value
        if not result[power]:
            del result[power]
    return result


def uni_mul(a, b):
    result = {}
    for i, x in a.items():
        for j, y in b.items():
            result = uni_add(result, {i + j: x * y})
    return result


def uni_div(a, b):
    G.require(bool(b), "nonzero univariate divisor")
    remainder, quotient = dict(a), {}
    top = max(b)
    while remainder and max(remainder) >= top:
        degree = max(remainder) - top
        term = {degree: remainder[max(remainder)] / b[top]}
        quotient = uni_add(quotient, term)
        remainder = uni_add(remainder, uni_mul(term, b), F(-1))
    return quotient, remainder


def decode_uni(terms):
    G.require(type(terms) is list, "canonical univariate term list")
    result, previous = {}, -1
    for row in terms:
        G.require(
            type(row) is list
            and len(row) == 3
            and type(row[0]) is int
            and previous < row[0] <= 32
            and all(type(x) is str for x in row[1:]),
            "canonical univariate exponent",
        )
        degree, n, d = row
        value = F(int(n), int(d))
        G.require(
            value != 0 and str(value.numerator) == n and str(value.denominator) == d,
            "canonical univariate fraction",
        )
        result[degree] = value
        previous = degree
    return result


def lagrange(nodes, index):
    result = {0: F(1)}
    for j, node in enumerate(nodes):
        if j != index:
            result = uni_mul(
                result,
                {1: F(1) / (nodes[index] - node), 0: -node / (nodes[index] - node)}
                if node
                else {1: F(1) / nodes[index]},
            )
    return result


def verify_action_univariate(record, parent):
    helper().verify_univariate(parent)
    G.require(
        record["schema"] == "nr-case12-projector-actions-univariate-v1"
        and record["constants"] == list(map(str, BRANCH_CONSTANTS)),
        "six action branch constants",
    )
    odd = decode_uni(parent["squarefree"]["polynomial"])
    G.require(
        decode_uni(record["odd_annihilator"]) == odd and len(record["rows"]) == 6,
        "original odd annihilator and all actions",
    )
    coefficients = []
    for index, row in enumerate(record["rows"], 1):
        original = decode_uni(parent["projectors"][index]["polynomial"])
        action = {2 * power + 1: value for power, value in original.items()}
        quotient, remainder = uni_div(action, odd)
        values = [remainder.get(power, F(0)) for power in (1, 3, 5)]
        residual = uni_add(
            uni_add(action, uni_mul(quotient, odd), F(-1)), remainder, F(-1)
        )
        G.require(
            row["name"] == "branch-" + str(index)
            and type(row["branch_index"]) is int
            and row["branch_index"] == index
            and decode_uni(row["original_projector"]) == original
            and decode_uni(row["original_polynomial"]) == action
            and decode_uni(row["quotient"]) == quotient
            and decode_uni(row["remainder"]) == remainder
            and row["coefficients"] == list(map(str, values))
            and decode_uni(row["identity_residual"]) == residual == {}
            and row["odd_degree_at_most_five"] is True
            and set(remainder) <= {1, 3, 5},
            "complete action polynomial division",
        )
        G.require(index <= 3 or not remainder, "all absent branch actions zero")
        coefficients.append(values)
    G.require(record["accepted"] is True, "complete action scalar acceptance")
    return coefficients


def poly_mul(*values):
    result = {(0, 0, 0): F(1)}
    for value in values:
        product = {}
        V.add_product(product, result, value)
        result = product
    return result


def poly_scale(value, scalar):
    return {
        power: scalar * coefficient
        for power, coefficient in value.items()
        if scalar * coefficient
    }


def verify_traces(record, matrices, denominator):
    G.require(
        record["schema"] == "nr-case12-projector-traces-v1"
        and V.decode_polynomial(record["denominator"], max_degree=18) == denominator
        and len(record["rows"]) == 8
        and record["expected_ode_rank"] == 11,
        "complete trace schema",
    )
    ranks = {}
    satisfied = []
    names = ["NO", "N0", *[f"N{j}" for j in range(1, 7)]]
    probe = max(denominator)
    one = {(0, 0, 0): F(1)}
    for name, row in zip(names, record["rows"], strict=True):
        matrix = matrices[name]
        trace = {}
        for i in range(43):
            V.add_product(trace, matrix[i][i], one)
        candidate = trace.get(probe, F(0)) / denominator[probe]
        residual = dict(trace)
        V.add_product(residual, denominator, one, factor=-candidate)
        rank = (
            int(candidate)
            if not residual and candidate.denominator == 1 and 0 <= candidate <= 43
            else None
        )
        good = not residual and rank is not None
        G.require(
            row["name"] == name
            and V.decode_polynomial(row["trace_numerator"], max_degree=24) == trace
            and row["probe_exponent"] == list(probe)
            and row["candidate"] == str(candidate)
            and row["rank"] == rank
            and (rank is None or type(row["rank"]) is int)
            and V.decode_polynomial(row["residual"], max_degree=24) == residual
            and row["satisfied"] is good,
            "trace coefficient ratio and full residual",
        )
        ranks[name] = rank
        satisfied.append(good)
    rank_sum = (
        sum(ranks.values())
        if all(value is not None for value in ranks.values())
        else None
    )
    accepted = (
        all(satisfied)
        and rank_sum == 43
        and ranks["NO"] == 11
        and all(ranks[f"N{j}"] == 0 for j in (4, 5, 6))
    )
    G.require(
        record["rank_sum"] == rank_sum and record["accepted"] is accepted,
        "trace global rank accounting",
    )
    return accepted, ranks


def replay(directory, budget, *, stage=lambda *args, **kwargs: None):
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
        "qualified spectral input bytes",
    )
    polys = parent["parent-inputs/parent-inputs/parent-inputs/denominators.json"]
    domain = (
        helper()
        .helper()
        .helper()
        .helper()
        .verify_domain(
            parent["parent-inputs/parent-inputs/parent-inputs/domain.json"], polys
        )
    )
    domain.pop("delta")
    r = V.decode_polynomial(polys["r"], max_degree=2)
    g = V.decode_polynomial(polys["g"], max_degree=2)
    G.require(
        all(
            V.decode_polynomial(parent["scalars.json"][name], max_degree=2) == value
            for name, value in [("r", r), ("g", g)]
        ),
        "source direction scalars",
    )
    x = V.decode_matrix(parent["X.json"], shape=(43, 43), max_degree=4)
    q = V.decode_matrix(parent["Q.json"], shape=(43, 43), max_degree=8)
    z1 = V.decode_matrix(parent["Z1.json"], shape=(43, 43), max_degree=12)
    z2 = V.decode_matrix(parent["Z2.json"], shape=(43, 43), max_degree=20)
    pt = V.decode_matrix(parent["parent-inputs/Pt.json"], shape=(43, 43), max_degree=2)
    one = {(0, 0, 0): F(1)}
    minus = {(0, 0, 0): F(-1)}
    d = poly_mul(r, r, g)
    D = poly_mul(d, d, d)
    eta = poly_mul(r, r, r, r, r, g, g)
    scalars = load("scalars.json")
    expected = {"r": r, "g": g, "d": d, "D": D, "eta": eta}
    G.require(
        set(scalars) == set(expected)
        and all(
            V.decode_polynomial(scalars[name], max_degree=18) == value
            for name, value in expected.items()
        ),
        "all projector and action denominators",
    )
    coefficients = verify_action_univariate(
        load("action_univariate.json"), parent["univariate.json"]
    )
    matrices = {}
    stats = {}

    def check(name, matrix):
        saved = V.decode_matrix(
            load(name + ".json"), shape=(43, 43), max_degree=MATRIX_CAPS[name]
        )
        G.require(saved == matrix, "independent projector stage " + name)
        matrices[name] = matrix
        stats[name] = matrix_stats(matrix, MATRIX_CAPS[name])
        stage("replay-" + name + "-complete", terms=stats[name]["terms"])

    q2 = V.multiply(q, q, guard=budget.guard)
    check("Q2", q2)
    q3 = V.multiply(q2, q, guard=budget.guard)
    check("Q3", q3)
    x3 = combination(((one, z1), (poly_scale(d, BRANCH_CONSTANTS[0]), x)), budget)
    check("X3", x3)
    x5 = combination(
        (
            (one, z2),
            (poly_scale(d, BRANCH_CONSTANTS[0] + BRANCH_CONSTANTS[1]), x3),
            (poly_scale(poly_mul(d, d), -BRANCH_CONSTANTS[0] * BRANCH_CONSTANTS[1]), x),
        ),
        budget,
    )
    check("X5", x5)
    identity = [[one.copy() if i == j else {} for j in range(43)] for i in range(43)]
    ot = combination(((r, identity), (minus, pt)), budget)
    d_over_r = poly_mul(r, r, r, r, r, g, g, g)
    check("NO", combination(((d_over_r, ot),), budget))
    d2 = poly_mul(d, d)
    for index in range(1, 7):
        reduced = decode_uni(
            parent["univariate.json"]["projectors"][index]["remainder"]
        )
        G.require(
            set(reduced) <= {1, 2, 3}, "nonzero branch projector has zero constant"
        )
        check(
            "N" + str(index),
            combination(
                (
                    (poly_scale(d2, reduced.get(1, F(0))), q),
                    (poly_scale(d, reduced.get(2, F(0))), q2),
                    ({(0, 0, 0): reduced[3]} if 3 in reduced else {}, q3),
                ),
                budget,
            ),
        )
    check(
        "N0",
        combination(
            ((d_over_r, pt), *((minus, matrices[f"N{j}"]) for j in range(1, 7))), budget
        ),
    )
    r4g2 = poly_mul(r, r, r, r, g, g)
    r2g = d
    for index, (u1, u3, u5) in enumerate(coefficients, 1):
        check(
            "M" + str(index),
            combination(
                (
                    (poly_scale(r4g2, u1), x),
                    (poly_scale(r2g, u3), x3),
                    ({(0, 0, 0): u5} if u5 else {}, x5),
                ),
                budget,
            ),
        )
    check(
        "projector_completeness",
        combination(
            tuple(
                (one, matrices[name])
                for name in ["NO", "N0", *[f"N{j}" for j in range(1, 7)]]
            )
            + ((poly_scale(D, F(-1)), identity),),
            budget,
        ),
    )
    check(
        "action_completeness",
        combination(
            tuple((one, matrices[f"M{j}"]) for j in range(1, 7))
            + ((poly_scale(r4g2, F(-1)), x),),
            budget,
        ),
    )
    G.require(stats == load("stats.json"), "all exact projector statistics")
    trace_ok, ranks = verify_traces(load("traces.json"), matrices, D)
    delta = [[{} for _ in range(43)] for _ in range(43)]
    delta[0][0] = poly_mul({(1, 0, 0): F(1)}, D)
    mutant = combination(
        ((one, matrices["projector_completeness"]), (one, delta)), budget
    )
    for name, matrix in [
        ("delta_N1", delta),
        ("mutant_projector_completeness", mutant),
    ]:
        G.require(
            V.decode_matrix(load(name + ".json"), shape=(43, 43), max_degree=25)
            == matrix,
            "actual independently reconstructed projector mutation",
        )
    mutation = load("mutation.json")
    nonzero = sum(bool(poly) for row in mutant for poly in row)
    terms = V.coefficient_count(mutant)
    G.require(
        mutation["schema"] == "nr-case12-projector-mutation-v1"
        and mutation["name"] == "add-xD-to-N1-00"
        and mutation["entry"] == [0, 0]
        and mutation["nonzero_slots"] == nonzero
        and mutation["coefficients"] == terms
        and mutation["rejected"] is True
        and nonzero > 0,
        "genuine incorrect projector rejected",
    )

    def zero(matrix):
        return not any(poly for row in matrix for poly in row)

    acceptance = dict(
        projector_completeness=zero(matrices["projector_completeness"]),
        action_completeness=zero(matrices["action_completeness"]),
        action_univariate=True,
        trace_ranks=trace_ok,
        absent_branches_zero=all(
            zero(matrices[f"{prefix}{j}"]) for prefix in ("N", "M") for j in (4, 5, 6)
        ),
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        acceptance == load("acceptance.json"),
        "independent projector candidate acceptance",
    )
    return dict(
        schema="nr-case12-independent-polynomial-projectors-replay-v1",
        passed=acceptance["accepted"],
        acceptance=acceptance,
        matrix_slots=36980,
        completeness_slots=3698,
        ranks=ranks,
        mutation_nonzero_slots=nonzero,
        mutation_coefficients=terms,
        fixed_domain=domain,
        parent_gate_sha256=PARENT_GATE,
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
        projector_family_validated=False,
        action_family_validated=False,
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
        result["snapshot_bytes"] = (
            helper().helper().helper().helper().snapshot(budget, table)
        )
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
        import nr_case12_polynomial_projectors as P
        import nr_case12_polynomial_section as S

        stage("projector-construction-start")

        def sink(name, matrix):
            G.require(
                name in {**MATRIX_CAPS, **MUTATION_CAPS}, "registered stage matrix"
            )
            record = S.encode_matrix(matrix, guard=budget.guard)
            budget.record(name + ".json", record)
            raw = json.dumps(record, separators=(",", ":"), ensure_ascii=False).encode()
            stage(
                "matrix-" + name + "-saved",
                bytes=len(raw),
                terms=sum(len(row[2]) for row in record["entries"]),
                degree_max=max(
                    (sum(term[:3]) for row in record["entries"] for term in row[2]),
                    default=-1,
                ),
                coefficient_decimal_chars=sum(
                    len(term[3]) + len(term[4])
                    for row in record["entries"]
                    for term in row[2]
                ),
            )

        certificate = P.build_certificate(PARENT, guard=budget.guard, sink=sink)
        for name in (
            "source_bridge",
            "parent_provenance",
            "stats",
            "acceptance",
            "action_univariate",
            "traces",
            "mutation",
            "scalars",
        ):
            budget.record(name + ".json", certificate[name])
        stage("complete-candidate-evidence-saved", acceptance=certificate["acceptance"])
        result["replay"] = replay(directory, budget, stage=stage)
        result["candidate_decisions"] = result["replay"]["acceptance"]
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record(
            "dependencies.json",
            helper().helper().helper().helper().dependencies(budget),
        )
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
            "registered projector candidate failed; complete residual evidence retained",
        )
        result.update(
            passed=True,
            completed=True,
            projector_family_validated=True,
            action_family_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            projector_family_validated=False,
            action_family_validated=False,
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
        is result["projector_family_validated"]
        is result["action_family_validated"]
        is True
        and not result["errors"],
        "complete projector candidate",
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
        "fixed projector scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    import nr_case12_polynomial_projectors as P

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
    G.require(
        report == result["replay"] and report["passed"] is True,
        "complete owned independent replay",
    )
    G.require(
        report["schema"] == "nr-case12-independent-polynomial-projectors-replay-v1"
        and report["matrix_slots"] == 36980
        and report["parent_gate_sha256"] == PARENT_GATE,
        "complete registered projector replay",
    )
    G.require(
        set(report["acceptance"])
        == {
            "projector_completeness",
            "action_completeness",
            "action_univariate",
            "trace_ranks",
            "absent_branches_zero",
            "accepted",
        }
        and all(value is True for value in report["acceptance"].values())
        and report["completeness_slots"] == 3698
        and report["mutation_nonzero_slots"] > 0
        and report["mutation_coefficients"] > 0
        and report["library"]
        == "stdlib Fraction sparse convolution; no SymPy or direction sampling",
        "complete projector candidate and actual negative witness",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update(name + ".json" for name in {**MATRIX_CAPS, **MUTATION_CAPS})
    expected.update(
        (
            "stats.json",
            "scalars.json",
            "acceptance.json",
            "action_univariate.json",
            "traces.json",
            "mutation.json",
        )
    )
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

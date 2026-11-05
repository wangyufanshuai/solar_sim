"""One owned fixed-case12 seventh-degree spectral certificate batch."""

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

METHOD = "nr-case12-polynomial-spectral-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-blocks-controls-v1-20261014"
PARENT_GATE = "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7"
PARENT_WORKER = "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e"
HELPER = "scripts/run-nr-k3-case12-polynomial-blocks.py"
HELPER_SHA = "c67cea634973b9dcb2f37de5151d46a43807d4b48ba1d28b39e54acfd0563dc2"
EXTRA = (
    "scripts/nr_case12_polynomial_spectral.py",
    "scripts/tests/test_nr_case12_polynomial_spectral.py",
    "scripts/run-nr-k3-case12-polynomial-spectral.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-spectral.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-spectral.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-blocks.md",
)
PARENT_INPUTS = (
    "division_quotient.json",
    "Pt.json",
    "scalars.json",
    "parent-inputs/parent-inputs/domain.json",
    "parent-inputs/parent-inputs/denominators.json",
)
MATRIX_CAPS = dict(X=4, Q=8, Z1=12, Z2=20, Z3=28)
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
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen blocks runner required")
    spec = importlib.util.spec_from_file_location(
        "nr_blocks_history_only", ROOT / HELPER
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
        is gate["ode_blocks_validated"]
        is gate["exact_quotient_cancellation_validated"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete blocks parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 592
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive spectral sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 598, "598-source spectral contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 634,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 15 and sum(map(len, table.values())) == 10593,
        "fifteen immutable historical trees",
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
        len(tests) == 24 and sum(tests.values()) == 60,
        "exact24 functions and60 controls",
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
        G.require(child.returncode == 0, "spectral controls failed; no automatic retry")
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


def verify_univariate(record):
    G.require(
        record["schema"] == "nr-case12-spectral-univariate-v1"
        and record["variable"] == "y"
        and record["constants"] == list(map(str, BRANCH_CONSTANTS)),
        "registered six branch constants",
    )
    nodes = (F(0), *BRANCH_CONSTANTS)
    modulus = {1: F(1)}
    for c in BRANCH_CONSTANTS[:3]:
        modulus = uni_mul(modulus, {1: F(1), 0: -c})
    G.require(
        decode_uni(record["modulus"]) == modulus, "independent square-spectrum modulus"
    )
    rows = record["projectors"]
    G.require(len(rows) == 7, "all seven paired nodes")
    reduced = []
    for i, row in enumerate(rows):
        poly = lagrange(nodes, i)
        quotient, remainder = uni_div(poly, modulus)
        expected = lagrange(nodes[:4], i) if i < 4 else {}
        G.require(
            row["name"] == ("zero" if i == 0 else "branch-" + str(i))
            and row["node"] == str(nodes[i]),
            "original branch ordering",
        )
        G.require(
            decode_uni(row["polynomial"]) == poly
            and decode_uni(row["quotient"]) == quotient
            and decode_uni(row["remainder"]) == remainder
            and decode_uni(row["expected_remainder"]) == expected
            and decode_uni(row["remainder_difference"])
            == uni_add(remainder, expected, F(-1)),
            "complete original interpolation division",
        )
        G.require(remainder == expected, "retained and absent branch reductions")
        reduced.append(remainder)
    total = {}
    for poly in reduced:
        total = uni_add(total, poly)
    complete = uni_add(total, {0: F(1)}, F(-1))
    G.require(
        decode_uni(record["completeness"]) == complete == {}, "paired completeness"
    )
    relations = record["relations"]
    G.require(len(relations) == 49, "all projector products")
    for index, row in enumerate(relations):
        i, j = divmod(index, 7)
        value = uni_mul(reduced[i], reduced[j])
        if i == j:
            value = uni_add(value, reduced[i], F(-1))
        quotient, remainder = uni_div(value, modulus)
        G.require(
            row["i"] == i
            and row["j"] == j
            and decode_uni(row["quotient"]) == quotient
            and decode_uni(row["remainder"]) == remainder == {},
            "complete projector product remainder",
        )
    speed = record["speed_relations"]
    G.require(len(speed) == 6, "all speed relations")
    for index, row in enumerate(speed):
        quotient, remainder = uni_div(
            uni_mul({1: F(1), 0: -BRANCH_CONSTANTS[index]}, reduced[index + 1]), modulus
        )
        G.require(
            row["branch_index"] == index + 1
            and decode_uni(row["quotient"]) == quotient
            and decode_uni(row["remainder"]) == remainder == {},
            "all branch speed remainders",
        )
    odd = {1: F(1)}
    for c in BRANCH_CONSTANTS[:3]:
        odd = uni_mul(odd, {2: F(1), 0: -c})
    action = {2 * i + 1: value for i, value in reduced[0].items()}
    quotient, remainder = uni_div(action, odd)
    zero = record["zero_action"]
    G.require(
        zero["variable"] == "t"
        and decode_uni(zero["polynomial"]) == action
        and decode_uni(zero["quotient"]) == quotient
        and decode_uni(zero["remainder"]) == remainder == {},
        "single zero-root action",
    )
    squarefree = record["squarefree"]
    derivative = {i - 1: F(i) * value for i, value in odd.items() if i}
    bezout = uni_add(
        uni_mul(decode_uni(squarefree["bezout_p"]), odd),
        uni_mul(decode_uni(squarefree["bezout_derivative"]), derivative),
    )
    G.require(
        squarefree["variable"] == "t"
        and decode_uni(squarefree["polynomial"]) == odd
        and decode_uni(squarefree["derivative"]) == derivative
        and decode_uni(squarefree["gcd"]) == {0: F(1)}
        and bezout == {0: F(1)}
        and decode_uni(squarefree["residual"]) == {}
        and squarefree["zero_constant"] == "0"
        and squarefree["zero_linear"] == str(odd[1]),
        "exact squarefree Bezout and simple zero root",
    )
    G.require(record["accepted"] is True, "complete univariate certificate")
    return dict(
        nodes=7,
        projector_products=49,
        speed_relations=6,
        absent_branches=[4, 5, 6],
        simple_zero_root=True,
    )


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
        "qualified blocks input bytes",
    )
    a = V.decode_matrix(parent["division_quotient.json"], shape=(43, 43), max_degree=4)
    pt = V.decode_matrix(parent["Pt.json"], shape=(43, 43), max_degree=2)
    source_scalars = parent["scalars.json"]
    polys = parent["parent-inputs/parent-inputs/denominators.json"]
    domain = (
        helper()
        .helper()
        .helper()
        .verify_domain(parent["parent-inputs/parent-inputs/domain.json"], polys)
    )
    domain.pop("delta")
    r = V.decode_polynomial(polys["r"], max_degree=2)
    g = V.decode_polynomial(polys["g"], max_degree=2)
    b = {(1, 0, 0): F(3, 100), (0, 1, 0): F(-1, 25), (0, 0, 1): F(1, 20)}
    G.require(
        all(
            V.decode_polynomial(source_scalars[name], max_degree=2) == value
            for name, value in [("r", r), ("g", g), ("b", b)]
        ),
        "parent denominator and shift identity",
    )
    one = {(0, 0, 0): F(1)}
    minus_b = {key: -value for key, value in b.items()}
    x = combination(((one, a), (minus_b, pt)), budget)
    scalars = load("scalars.json")
    squared = [
        {power: c * value for power, value in g.items()} for c in BRANCH_CONSTANTS
    ]
    G.require(
        set(scalars) == {"r", "g", "b", "squared_speeds"}
        and all(
            V.decode_polynomial(scalars[name], max_degree=2) == value
            for name, value in [("r", r), ("g", g), ("b", b)]
        )
        and len(scalars["squared_speeds"]) == 6
        and all(
            V.decode_polynomial(saved, max_degree=2) == value
            for saved, value in zip(scalars["squared_speeds"], squared, strict=True)
        ),
        "unnormalized six squared speeds",
    )
    stats = {}

    def check(name, matrix):
        saved = V.decode_matrix(
            load(name + ".json"), shape=(43, 43), max_degree=MATRIX_CAPS[name]
        )
        G.require(saved == matrix, "independent full spectral stage " + name)
        stats[name] = matrix_stats(matrix, MATRIX_CAPS[name])
        stage("replay-" + name + "-complete", terms=stats[name]["terms"])

    check("X", x)
    q = V.multiply(x, x, guard=budget.guard)
    check("Q", q)
    rr = {}
    V.add_product(rr, r, r)
    z = x
    for index in range(3):
        scalar = {}
        V.add_product(scalar, squared[index], rr, factor=F(-1))
        z = combination(
            ((one, V.multiply(z, q, guard=budget.guard)), (scalar, z)), budget
        )
        check("Z" + str(index + 1), z)
    G.require(stats == load("stats.json"), "all spectral statistics")
    univariate = verify_univariate(load("univariate.json"))
    negative = load("nilpotent_witness.json")
    zero = [["0", "0"], ["0", "0"]]
    nilpotent = [["0", "1"], ["0", "0"]]
    factor = -BRANCH_CONSTANTS[0] * BRANCH_CONSTANTS[1] * BRANCH_CONSTANTS[2]
    G.require(
        negative["schema"] == "nr-case12-spectral-nilpotent-v1"
        and negative["r"] == negative["g"] == "1"
        and negative["constants"] == list(map(str, BRANCH_CONSTANTS))
        and negative["N"] == nilpotent
        and negative["N_squared"] == negative["even_result"] == zero
        and negative["odd_result"] == [["0", str(factor)], ["0", "0"]]
        and negative["nonzero_slots"] == 1
        and negative["zero_mode_rejected"] is True,
        "independent actual nilpotent negative control",
    )
    acceptance = dict(
        annihilator_zero=not any(poly for row in z for poly in row),
        six_branch_reduction=True,
        nilpotent_detected=True,
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        acceptance == load("acceptance.json"),
        "independent spectral candidate acceptance",
    )
    return dict(
        schema="nr-case12-independent-polynomial-spectral-replay-v1",
        passed=acceptance["accepted"],
        acceptance=acceptance,
        matrix_slots=9245,
        annihilator_slots=1849,
        univariate=univariate,
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
        spectral_annihilator_validated=False,
        six_branch_reduction_validated=False,
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
        result["snapshot_bytes"] = helper().helper().helper().snapshot(budget, table)
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
        import nr_case12_polynomial_spectral as P
        import nr_case12_polynomial_section as S

        stage("spectral-construction-start")

        def sink(name, matrix):
            G.require(name in MATRIX_CAPS, "registered stage matrix")
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
            "univariate",
            "nilpotent_witness",
            "scalars",
        ):
            budget.record(name + ".json", certificate[name])
        stage("complete-candidate-evidence-saved", acceptance=certificate["acceptance"])
        result["replay"] = replay(directory, budget, stage=stage)
        result["candidate_decisions"] = result["replay"]["acceptance"]
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record(
            "dependencies.json", helper().helper().helper().dependencies(budget)
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
            "registered spectral candidate failed; complete residual evidence retained",
        )
        result.update(
            passed=True,
            completed=True,
            spectral_annihilator_validated=True,
            six_branch_reduction_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            spectral_annihilator_validated=False,
            six_branch_reduction_validated=False,
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
        is result["spectral_annihilator_validated"]
        is result["six_branch_reduction_validated"]
        is True
        and not result["errors"],
        "complete spectral candidate",
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
        "fixed spectral scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    import nr_case12_polynomial_spectral as P

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
        set(report["acceptance"])
        == {
            "annihilator_zero",
            "six_branch_reduction",
            "nilpotent_detected",
            "accepted",
        }
        and all(value is True for value in report["acceptance"].values()),
        "all spectral decisions",
    )
    G.require(
        report["schema"] == "nr-case12-independent-polynomial-spectral-replay-v1"
        and report["matrix_slots"] == 9245
        and report["annihilator_slots"] == 1849
        and report["parent_gate_sha256"] == PARENT_GATE
        and report["library"]
        == "stdlib Fraction sparse convolution; no SymPy or direction sampling",
        "registered replay scope",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update(name + ".json" for name in MATRIX_CAPS)
    expected.update(
        (
            "stats.json",
            "scalars.json",
            "acceptance.json",
            "univariate.json",
            "nilpotent_witness.json",
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

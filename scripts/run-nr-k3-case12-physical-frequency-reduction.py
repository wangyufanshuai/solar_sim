"""Owned complete physical frequency reduction; unexecuted candidate."""

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
import nr_integer_polynomial_replay as R  # noqa: E402

INTEGER_SOURCE = "scripts/nr_integer_polynomial_replay.py"
INTEGER_SHA = "5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f"

METHOD = "nr-case12-physical-frequency-reduction-controls-v1"
HELPER = "scripts/run-nr-k3-case12-physical-closure-division.py"
HELPER_SHA = "ff9db28a40dedeca8836431353cf287aba11d09a583177143bd79f3a1557efb6"
PARENT = G.EVIDENCE / "nr-k3-case12-physical-closure-division-controls-v1-20261015"
PARENT_GATE = "7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6"
PARENT_WORKER = "d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6"
EXTRA = (
    "scripts/nr_case12_physical_frequency_reduction.py",
    "scripts/tests/test_nr_case12_physical_frequency_reduction.py",
    "scripts/run-nr-k3-case12-physical-frequency-reduction.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-physical-frequency-reduction.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-physical-frequency-reduction.md",
    "science/numerical_relativity/RESULTS-20261015-case12-physical-closure-division.md",
    "science/numerical_relativity/NOTE-20261015-case12-physical-frequency-reduction-next.md",
)
TEST_FILES = (EXTRA[1], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = ((19, 58), (21, 73))
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "mutation",
    "domain",
    "source_bridge",
    "parent_provenance",
)
SCOPE = "fixed-case12 geometric=False physical43 Laurent frequency reduction and principal bridge; real v!=0; complex zeta!=0; no low-order energy or nonlinear RHS bridge"
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
)


def qualified(directory, gate_sha, worker_sha):
    G.require(
        G.sha(directory / "qualification-gate.json") == gate_sha
        and G.sha(directory / "worker-result.json") == worker_sha,
        "unchanged qualified ancestor identity",
    )
    gate = G.read_terminal(directory / "qualification-gate.json")
    G.require(
        gate["passed"] is gate["completed"] is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete cleaned ancestor required",
    )
    return gate


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(
        G.sha(ROOT / HELPER) == HELPER_SHA, "frozen physical closure-division runner"
    )
    spec = importlib.util.spec_from_file_location("nr_coordinate_parent", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def producer():
    import nr_case12_physical_frequency_reduction as module

    return module


def foundation():
    return helper().foundation()


def parent_gate():
    gate = qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["physical_direction_polynomial_generator_validated"] is True,
        "complete parent local polynomial symbol qualification",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 664
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 664 parent sources unchanged",
    )
    G.require(
        not set(table).intersection(EXTRA),
        "seven additive physical-frequency-reduction sources",
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 671, "671-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 769,
        "complete physical division evidence",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 26 and sum(map(len, table.values())) == 18764,
        "twenty-six unchanged historical trees",
    )
    return table


def canonical_equal(actual, expected):
    if type(actual) is not type(expected):
        return False
    if type(expected) is dict:
        return (
            all(type(k) in (str, int) for k in actual)
            and set(actual) == set(expected)
            and all(canonical_equal(actual[k], expected[k]) for k in expected)
        )
    if type(expected) in (list, tuple):
        return len(actual) == len(expected) and all(
            canonical_equal(a, b) for a, b in zip(actual, expected, strict=True)
        )
    return type(expected) in (str, int, bool, type(None), F) and actual == expected


def empty(shape):
    G.require(
        type(shape) in (tuple, list)
        and len(shape) == 2
        and all(type(x) is int and x > 0 for x in shape),
        "positive matrix shape",
    )
    return [[{} for _ in range(shape[1])] for _ in range(shape[0])]


def identity(size, scale=None):
    result = empty((size, size))
    for i in range(size):
        result[i][i] = dict({(0, 0, 0): F(1)} if scale is None else scale)
    return result


def combine(left, right, factor=F(1)):
    G.require(
        V.matrix_shape(left) == V.matrix_shape(right) and type(factor) is F,
        "matching exact polynomial matrices",
    )
    result = [[dict(cell) for cell in row] for row in left]
    for i, row in enumerate(right):
        for j, poly in enumerate(row):
            for exponent, value in poly.items():
                total = result[i][j].get(exponent, F(0)) + factor * value
                if total:
                    result[i][j][exponent] = total
                else:
                    result[i][j].pop(exponent, None)
    return result


def require_series(value, powers, shape):
    G.require(
        type(value) is dict
        and value
        and all(type(k) is int for k in value)
        and type(powers) in (list, tuple, range)
        and all(type(k) is int for k in powers)
        and set(value) == set(powers),
        "complete strict Laurent powers",
    )
    G.require(
        list(powers) == list(range(min(powers), max(powers) + 1)),
        "contiguous registered powers including zero coefficients",
    )
    for matrix in value.values():
        G.require(
            V.matrix_shape(matrix) == tuple(shape), "uniform Laurent coefficient shape"
        )
    return value


def check_matrix(record, expected, shape, degree_cap):
    observed = V.decode_matrix(record, shape=shape, max_degree=degree_cap)
    G.require(
        canonical_equal(V.encode_matrix(observed), V.encode_matrix(expected)),
        "independently rebuilt complete matrix mismatch",
    )
    return observed


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
                "unique test names",
            )
            current[node.name] = count
        G.require(
            len(current) == functions and sum(current.values()) == instances,
            "registered frequency reduction control count",
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
        "all registered controls without errors or skips",
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
            "physical frequency reduction controls failed; no automatic retry",
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def input_records():
    module = producer()
    for name, hashes in module.PARENT_GATES.items():
        qualified(G.EVIDENCE / name, hashes["gate_sha256"], hashes["worker_sha256"])
    result = {}
    for name, item in module.PARENT_FILES.items():
        raw = G.contained(G.EVIDENCE / item["directory"], item["path"]).read_bytes()
        G.require(
            G.hashlib.sha256(raw).hexdigest() == item["sha256"],
            "fixed physical-frequency-reduction parent bytes",
        )
        result[name] = raw
    return result


def replay_inputs():
    module = producer()
    return {"parent-inputs/" + name for name in module.PARENT_FILES} | {
        name + ".json" for name in (*module.MATRIX_SPECS, *METADATA)
    }


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
        physical_frequency_reduction_validated=False,
        physical_reduced_principal_bridge_validated=False,
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
        result["snapshot_bytes"] = foundation().snapshot(budget, table)
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
        module, saved = producer(), set()
        expected = set(module.MATRIX_SPECS) | set(METADATA)

        def sink(name, record):
            G.require(
                name in expected and name not in saved,
                "unique registered physical-frequency-reduction evidence",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        module.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(
            saved == expected,
            "every registered physical-frequency-reduction certificate part saved",
        )
        stage("complete-candidate-evidence-saved", matrices=len(module.MATRIX_SPECS))
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", foundation().dependencies(budget))
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "physical-frequency-reduction source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "physical frequency reduction failed; preserve all evidence",
        )
        result.update(
            passed=True,
            completed=True,
            physical_frequency_reduction_validated=True,
            physical_reduced_principal_bridge_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            physical_frequency_reduction_validated=False,
            physical_reduced_principal_bridge_validated=False,
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


def scale_matrix(matrix, scale, *, check=lambda: None):
    result = empty(V.matrix_shape(matrix))
    for i, row in enumerate(matrix):
        check()
        for j, poly in enumerate(row):
            result[i][j] = R.multiply_polynomials(poly, scale, check=check)
    return result


def independent_product(left, right, *, guard=lambda: None, check=lambda: None):
    """Direct full rectangular product; independent of producer SymPy algebra."""
    rows, inner = V.matrix_shape(left)
    other, columns = V.matrix_shape(right)
    G.require(inner == other, "compatible exact product shapes")
    guard()
    result = empty((rows, columns))
    sparse = [[(j, poly) for j, poly in enumerate(row) if poly] for row in right]
    for i, row in enumerate(left):
        check()
        for k, a in enumerate(row):
            if a:
                for j, b in sparse[k]:
                    R.exact_add_product(result[i][j], a, b, check=check)
    guard()
    return result


def laurent_product(left, right, *, guard=lambda: None, check=lambda: None):
    G.require(
        type(left) is type(right) is dict and left and right,
        "nonempty Laurent coefficient dictionaries",
    )
    ls = V.matrix_shape(next(iter(left.values())))
    rs = V.matrix_shape(next(iter(right.values())))
    G.require(all(type(p) is int for p in (*left, *right)), "integer Laurent powers")
    require_series(left, range(min(left), max(left) + 1), ls)
    require_series(right, range(min(right), max(right) + 1), rs)
    G.require(ls[1] == rs[0], "Laurent multiplication dimensions")
    result = {
        p: empty((ls[0], rs[1]))
        for p in range(min(left) + min(right), max(left) + max(right) + 1)
    }
    for p, a in left.items():
        for q, b in right.items():
            term = independent_product(a, b, guard=guard, check=check)
            result[p + q] = combine(result[p + q], term)
    return result


def matrix_name(prefix, power):
    G.require(type(power) is int, "strict Laurent power")
    return f"{prefix}__p_{'m' + str(-power) if power < 0 else power}"


def matrix_stats(matrix, cap):
    rows, cols = V.matrix_shape(matrix)
    return dict(
        shape=[rows, cols],
        slots=rows * cols,
        nonzero_slots=sum(bool(poly) for row in matrix for poly in row),
        terms=V.coefficient_count(matrix),
        degree_max=max(
            (sum(p) for row in matrix for poly in row for p in poly), default=-1
        ),
        degree_cap=cap,
    )


def independent_reduction(
    t,
    Q,
    u,
    Ab,
    r,
    *,
    guard=lambda: None,
    check=lambda: None,
    sink=lambda name, matrix: None,
):
    """Direct t*(Q*u), with the actually changed Q independently recomputed."""
    G.require(type(t) is dict and t, "nonempty coordinate series")
    m, n = V.matrix_shape(next(iter(t.values())))
    G.require(m == n, "square transformed constraint matrices")
    require_series(t, range(-1, 3), (m, m))
    require_series(Q, range(3), (m, m))
    require_series(u, range(-1, 3), (m, m))
    G.require(V.matrix_shape(Ab) == (m, m), "complete same-shape principal target")
    V.encode_polynomial(r)
    G.require(bool(r), "nonzero directional denominator")
    result = {}

    def product(left, right):
        return laurent_product(left, right, guard=guard, check=check)

    def emit(name, matrix):
        guard()
        sink(name, matrix)
        result[name] = matrix

    Z = product(t, product(Q, u))
    for power in range(-2, 7):
        emit(matrix_name("Z", power), Z[power])
    leading = combine(Z[1], scale_matrix(Ab, r, check=check), F(-1))
    emit("leading_residual", leading)
    delta = identity(m, {(2, 0, 0): F(1)})
    bad_Q = {p: [[dict(poly) for poly in row] for row in Q[p]] for p in range(3)}
    bad_Q[2] = combine(Q[2], delta)
    emit("bad_Q2", bad_Q[2])
    changed_Z = product(t, product(bad_Q, u))
    for power in range(-2, 7):
        emit(matrix_name("mutated_Z", power), changed_Z[power])
    change_high = 0
    for power in range(2, 7):
        check()
        change = combine(changed_Z[power], Z[power], F(-1))
        change_high += sum(bool(poly) for row in change for poly in row)
    input_change = combine(bad_Q[2], Q[2], F(-1))
    input_slots = sum(bool(poly) for row in input_change for poly in row)
    high_slots = sum(
        bool(poly) for p in range(2, 7) for row in changed_Z[p] for poly in row
    )
    high_terms = sum(V.coefficient_count(changed_Z[p]) for p in range(2, 7))
    mutation = dict(
        schema="nr-case12-physical-frequency-reduction-mutation-v1",
        name="add-x2-identity-to-Q2",
        source_matrix="bad_Q2",
        power=2,
        checked_powers=list(range(2, 7)),
        baseline_preserved=True,
        input_changed_slots=input_slots,
        mutated_high_nonzero_slots=high_slots,
        mutated_high_coefficients=high_terms,
        change_high_nonzero_slots=change_high,
        rejected=input_slots > 0 and high_slots > 0 and change_high > 0,
    )
    acceptance = dict(
        above_first_order_zero=not any(
            poly for p in range(2, 7) for row in Z[p] for poly in row
        ),
        leading_principal_match=not any(poly for row in leading for poly in row),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    return dict(matrices=result, acceptance=acceptance, mutation=mutation)


def replay(directory, budget, stage):
    module, hashes = producer(), {}
    G.require(G.sha(ROOT / INTEGER_SOURCE) == INTEGER_SHA, "frozen integer arithmetic")

    def load(name):
        budget.guard()
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    parent = {name: load("parent-inputs/" + name) for name in module.PARENT_FILES}
    raw_parent = {}
    for name, spec in module.PARENT_FILES.items():
        G.require(
            hashes["parent-inputs/" + name] == spec["sha256"],
            "archived fixed parent identity",
        )
        raw_parent[name] = (directory / "parent-inputs" / name).read_bytes()
    provenance = module.parent_provenance_manifest(raw_parent)
    domain_check = foundation().verify_domain(
        parent["domain.json"], parent["denominators.json"]
    )
    domain_check.pop("delta")
    r = V.decode_polynomial(parent["denominators.json"]["r"], max_degree=2)
    G.require(
        r == {(2, 0, 0): F(1), (0, 2, 0): F(1), (0, 0, 2): F(1)},
        "fixed r=sum of three squares",
    )
    r_squared = R.multiply_polynomials(r, r, check=budget._check_deadline)
    scalars = dict(
        r=V.encode_polynomial(r),
        r_squared=V.encode_polynomial(r_squared),
        mutation_x_squared=V.encode_polynomial({(2, 0, 0): F(1)}),
    )
    domain = independent_domain_metadata()
    for name, expected in (
        ("scalars", scalars),
        ("domain", domain),
        ("parent_provenance", provenance),
        ("source_bridge", module.source_bridge_manifest()),
    ):
        G.require(
            canonical_equal(load(name + ".json"), expected),
            "independent domain/source: " + name,
        )
    tcaps, ucaps = {-1: 2, 0: 3, 1: 4, 2: 5}, {-1: 0, 0: 2, 1: 3, 2: 3}
    t = {
        p: V.decode_matrix(
            parent[matrix_name("rT", p) + ".json"], shape=(43, 43), max_degree=tcaps[p]
        )
        for p in range(-1, 3)
    }
    u = {
        p: V.decode_matrix(
            parent[matrix_name("rTi", p) + ".json"], shape=(43, 43), max_degree=ucaps[p]
        )
        for p in range(-1, 3)
    }
    Q = {
        p: V.decode_matrix(parent[f"Q{p}.json"], shape=(43, 43), max_degree=6)
        for p in range(3)
    }
    G.require(
        all(
            sum(power) == p for p in Q for row in Q[p] for poly in row for power in poly
        ),
        "accepted quotient homogeneity rechecked on actual inputs",
    )
    Ab = V.decode_matrix(parent["Ab.json"], shape=(43, 43), max_degree=4)
    stats = {}

    def compare(name, expected):
        G.require(
            name in module.MATRIX_SPECS and name not in stats,
            "unique independent transformed matrix",
        )
        rows, cols, cap = module.MATRIX_SPECS[name]
        actual = check_matrix(load(name + ".json"), expected, (rows, cols), cap)
        stats[name] = matrix_stats(actual, cap)
        stage(
            "replay-" + name,
            nonzero_slots=stats[name]["nonzero_slots"],
            coefficients=stats[name]["terms"],
        )

    rebuilt = independent_reduction(
        t, Q, u, Ab, r, guard=budget.guard, check=budget._check_deadline, sink=compare
    )
    G.require(
        set(stats) == set(module.MATRIX_SPECS), "complete 20-matrix reconstruction"
    )
    for name, expected in (
        ("stats", stats),
        ("acceptance", rebuilt["acceptance"]),
        ("mutation", rebuilt["mutation"]),
    ):
        G.require(
            canonical_equal(load(name + ".json"), expected),
            "independent calculated metadata: " + name,
        )
    G.require(
        set(hashes) == replay_inputs() and len(hashes) == 55,
        "all 55 registered parsed inputs",
    )
    zero_names = [matrix_name("Z", p) for p in range(2, 7)] + ["leading_residual"]
    return dict(
        schema="nr-case12-independent-physical-frequency-reduction-v1",
        passed=rebuilt["acceptance"]["accepted"],
        input_hashes=hashes,
        parent_gate_sha256=PARENT_GATE,
        arithmetic_source=dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2])),
        integer_arithmetic_source=dict(path=INTEGER_SOURCE, sha256=INTEGER_SHA),
        library="stdlib Fraction and exact Python integer convolution",
        matrix_count=len(stats),
        matrix_slots=sum(v["slots"] for v in stats.values()),
        residual_matrices=len(zero_names),
        residual_slots=sum(stats[n]["slots"] for n in zero_names),
        residual_nonzero_slots=sum(stats[n]["nonzero_slots"] for n in zero_names),
        actual_matrix_stats=stats,
        acceptance=rebuilt["acceptance"],
        mutation=rebuilt["mutation"],
        domain=domain,
        domain_check=domain_check,
        scope=SCOPE,
        complete_frequency_support=True,
        original_shift_retained=True,
        real_changed_symbol_recomputed=True,
        baseline_failure_preserved=True,
        principal_target="Ab/r",
        principal_target_state_dimension=43,
        main_source_state_dimension=58,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        laurent_transforms_evaluated_at_zero=False,
        nonlinear_rhs_bridge_executed=False,
        lower_order_energy_executed=False,
    )


def independent_domain_metadata():
    return dict(
        schema="nr-case12-physical-frequency-reduction-domain-v1",
        fixed_case=12,
        geometric=False,
        direction="real-nonzero",
        frequency="complex-nonzero",
        physical_frequency="zeta=i*rho/sqrt(r); rho>0",
        cleared_denominator="r_squared",
        transformed_symbol="Ared=Z/r_squared=T*Q*Ti",
        principal43="Khat43=Ab/r",
        leading_identity="Z[1]=r*Ab after acceptance",
        original_shift_retained=True,
        discarded_frequency_powers=False,
        full_saved_powers=list(range(-2, 7)),
        required_zero_powers=list(range(2, 7)),
        scaled_rows=[0, 1, 2, 3, 41],
        normal_principal="S43^-1*Khat43*S43/sqrt(r)",
        normal_energy="S43.T*H*S43",
        zero_frequency_full43_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        uniform_frequency_energy_proved=False,
        actual_nonlinear_rhs_bridge_proved=False,
        boundary_well_posedness_proved=False,
    )


def finalizer(directory, budget):
    """Only audit saved JSON/XML, source AST and byte hashes after computation."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["physical_frequency_reduction_validated"]
        is result["physical_reduced_principal_bridge_validated"]
        is True
        and not result["errors"],
        "complete physical-frequency-reduction candidate",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["scope"] == SCOPE
        and result["case_indices"] == [12]
        and result["parent_gate_sha256"] == PARENT_GATE
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-zero-only"
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0,
        "unchanged physical scope and resource contract",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "complete saved controls",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        canonical_equal(report, result["replay"])
        and report["passed"] is True
        and report["schema"] == "nr-case12-independent-physical-frequency-reduction-v1"
        and report["arithmetic_source"]
        == dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2]))
        and report["integer_arithmetic_source"]
        == dict(path=INTEGER_SOURCE, sha256=INTEGER_SHA)
        and G.sha(ROOT / INTEGER_SOURCE) == INTEGER_SHA
        and report["matrix_count"] == 20
        and report["matrix_slots"] == 36980
        and report["residual_matrices"] == 6
        and report["residual_slots"] == 11094
        and report["residual_nonzero_slots"] == 0
        and len(report["input_hashes"]) == 55
        and set(report["input_hashes"]) == replay_inputs()
        and canonical_equal(report["acceptance"], read(directory / "acceptance.json"))
        and all(v is True for v in report["acceptance"].values())
        and canonical_equal(report["mutation"], read(directory / "mutation.json"))
        and report["mutation"]["rejected"] is True
        and report["mutation"]["baseline_preserved"] is True
        and report["mutation"]["input_changed_slots"] > 0
        and report["mutation"]["mutated_high_nonzero_slots"] > 0
        and report["mutation"]["change_high_nonzero_slots"] > 0
        and canonical_equal(
            report["actual_matrix_stats"], read(directory / "stats.json")
        )
        and canonical_equal(report["domain"], read(directory / "domain.json"))
        and canonical_equal(report["domain"], independent_domain_metadata())
        and canonical_equal(report["domain"], producer().domain_metadata())
        and report["complete_frequency_support"] is True
        and report["original_shift_retained"] is True
        and report["real_changed_symbol_recomputed"] is True
        and report["baseline_failure_preserved"] is True
        and report["principal_target"] == "Ab/r"
        and report["principal_target_state_dimension"] == 43
        and report["main_source_state_dimension"] == 58
        and report["zero_frequency_reachable_rank"] == 39
        and report["zero_frequency_full43_inverse_exists"] is False
        and report["laurent_transforms_evaluated_at_zero"] is False
        and report["nonlinear_rhs_bridge_executed"] is False
        and report["lower_order_energy_executed"] is False
        and report["scope"] == SCOPE
        and report["library"] == "stdlib Fraction and exact Python integer convolution",
        "complete independent physical frequency reduction replay",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(G.sha(G.contained(directory, name)) == digest, "replayed byte drift")
    module = producer()
    G.require(
        module.source_bridge_manifest() == read(directory / "source_bridge.json"),
        "saved original formula AST bindings",
    )
    parent = input_records()
    G.require(
        all(
            (directory / "parent-inputs" / name).read_bytes() == raw
            for name, raw in parent.items()
        ),
        "saved parent bytes",
    )
    G.require(
        module.parent_provenance_manifest(parent)
        == read(directory / "parent_provenance.json"),
        "saved accepted mathematical parents",
    )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "registered runtime versions",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "runtime source drift")
    table = sources(budget)
    G.require(
        table
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "source snapshot closure",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "historical closure",
    )
    return result


if __name__ == "__main__":
    raise SystemExit(main())

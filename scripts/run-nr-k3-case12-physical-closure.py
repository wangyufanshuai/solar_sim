"""Owned all-direction physical closure; unexecuted candidate."""

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

METHOD = "nr-case12-physical-closure-controls-v1"
HELPER = "scripts/run-nr-k3-case12-physical-right-section.py"
HELPER_SHA = "2f68adf45c1729c90ab3bd750470f06d26b980ae8339fdee7ac1ebaf49ee926b"
PARENT = G.EVIDENCE / "nr-k3-case12-physical-right-section-controls-v1-20261015"
PARENT_GATE = "3533a207230fe823eb9774b4ca46ae3dccc14287fe38cc7b0d70d9af30e0822a"
PARENT_WORKER = "75948ceb52f6443dbef91fb5413a7f60b718df614c6ca09dbc104c013ba1ab59"
EXTRA = (
    "scripts/nr_case12_physical_closure.py",
    "scripts/tests/test_nr_case12_physical_closure.py",
    "scripts/run-nr-k3-case12-physical-closure.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-physical-closure.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-physical-closure.md",
    "science/numerical_relativity/RESULTS-20261015-case12-physical-right-section.md",
    "science/numerical_relativity/NOTE-20261015-case12-physical-closure-next.md",
)
TEST_FILES = (EXTRA[1], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = ((22, 57), (21, 73))
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "mutation",
    "domain",
    "source_bridge",
    "parent_provenance",
)
SCOPE = "fixed-case12 geometric=False physical43 full generator closure; real v!=0; all complex zeta"
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
        G.sha(ROOT / HELPER) == HELPER_SHA, "frozen physical right-section runner"
    )
    spec = importlib.util.spec_from_file_location("nr_coordinate_parent", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def producer():
    import nr_case12_physical_closure as module

    return module


def foundation():
    return helper().foundation()


def parent_gate():
    gate = qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["physical_nonzero_frequency_right_section_validated"] is True,
        "complete parent right-section qualification",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 650
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 650 parent sources unchanged",
    )
    G.require(
        not set(table).intersection(EXTRA), "seven additive physical-closure sources"
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 657, "657-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 781, "complete right-section evidence"
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 24 and sum(map(len, table.values())) == 17168,
        "twenty-four unchanged historical trees",
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
            "registered physical closure control count",
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
            "physical closure controls failed; no automatic retry",
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
            "fixed physical-closure parent bytes",
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
        full_frequency_closure_validated=False,
        physical_frequency_polynomial_generator_validated=False,
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
                "unique registered physical-closure evidence",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        module.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(
            saved == expected,
            "every registered physical-closure certificate part saved",
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
            "physical-closure source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "physical closure failed; preserve all evidence",
        )
        result.update(
            passed=True,
            completed=True,
            full_frequency_closure_validated=True,
            physical_frequency_polynomial_generator_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            full_frequency_closure_validated=False,
            physical_frequency_polynomial_generator_validated=False,
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


def independent_closure(
    Cmatrix,
    L,
    e,
    delta_squared,
    delta_J,
    *,
    guard=lambda: None,
    check=lambda: None,
    sink=lambda name, matrix: None,
):
    """Direct C*(L*e) and the actual changed-generator residual, not the producer expansion."""
    G.require(type(Cmatrix) is dict and Cmatrix, "nonempty physical map")
    m, n = V.matrix_shape(next(iter(Cmatrix.values())))
    require_series(Cmatrix, range(3), (m, n))
    require_series(L, range(2), (n, n))
    require_series(e, range(-2, 3), (n, m))
    G.require(
        V.matrix_shape(delta_J) == (n, n) and bool(delta_squared),
        "registered source perturbation and nonzero denominator",
    )
    result = {}

    def product(a, b):
        return laurent_product(a, b, guard=guard, check=check)

    def emit(name, matrix):
        guard()
        sink(name, matrix)
        result[name] = matrix

    Bbar = product(Cmatrix, product(L, e))
    for p in range(-2, 6):
        emit(matrix_name("Bbar", p), Bbar[p])
    CL = product(Cmatrix, L)

    def full_residual(B, source):
        residual = product(B, Cmatrix)
        for power in range(-2, 8):
            check()
            if power in source:
                residual[power] = combine(
                    residual[power],
                    scale_matrix(source[power], delta_squared, check=check),
                    F(-1),
                )
        return residual

    baseline = full_residual(Bbar, CL)
    for p in range(-2, 8):
        emit(matrix_name("closure", p), baseline[p])
    emit("delta_J", [[dict(poly) for poly in row] for row in delta_J])
    delta_Bbar = product(Cmatrix, product({0: delta_J}, e))
    delta_Bbar[5] = empty((m, m))
    for p in range(-2, 6):
        emit(matrix_name("delta_Bbar", p), delta_Bbar[p])
    changed_L = {0: combine(L[0], delta_J), 1: L[1]}
    changed_Bbar = {p: combine(Bbar[p], delta_Bbar[p]) for p in range(-2, 6)}
    changed_residual = full_residual(changed_Bbar, product(Cmatrix, changed_L))
    for p in range(-2, 8):
        emit(matrix_name("mutated_closure", p), changed_residual[p])
    return result


def replay(directory, budget, stage):
    module, hashes = producer(), {}
    G.require(
        G.sha(ROOT / INTEGER_SOURCE) == INTEGER_SHA, "frozen exact integer convolution"
    )

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
            "independent archived parent identity",
        )
        raw_parent[name] = (directory / "parent-inputs" / name).read_bytes()
    provenance = module.parent_provenance_manifest(raw_parent)
    domain_check = foundation().verify_domain(
        parent["domain.json"], parent["denominators.json"]
    )
    delta = domain_check.pop("delta")
    polys = parent["denominators.json"]
    r = V.decode_polynomial(polys["r"], max_degree=2)
    g = V.decode_polynomial(polys["g"], max_degree=2)
    sigma = V.decode_polynomial(polys["section_denominator"], max_degree=6)
    delta2 = R.multiply_polynomials(delta, delta, check=budget._check_deadline)
    scalars = {
        name: V.encode_polynomial(value)
        for name, value in dict(
            r=r, g=g, sigma=sigma, delta=delta, delta_squared=delta2
        ).items()
    }
    G.require(
        canonical_equal(parent["right_scalars.json"], scalars)
        and F(18, 25) ** 2 * F(5, 6) ** 4 == F(1, 4),
        "accepted right-section scale and denominator floor",
    )
    domain = dict(
        schema="nr-case12-physical-closure-domain-v1",
        fixed_case=12,
        direction="real-nonzero",
        frequency="complex-all-after-acceptance",
        generator="J+zeta*K",
        principal_shift_retained=True,
        g_lower_over_r="5/6",
        chi="18/25",
        denominator="delta_squared=chi^2*r^4*g^4",
        denominator_lower_over_r8="1/4",
        rational_direction_coefficients=True,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        zero_frequency_off_image_unique=False,
        local_differential_closure_proved=False,
        low_frequency_uniform_energy_proved=False,
        nonlinear_closure_proved=False,
    )
    for name, expected in (
        ("scalars", scalars),
        ("domain", domain),
        ("parent_provenance", provenance),
        ("source_bridge", module.source_bridge_manifest()),
    ):
        G.require(
            canonical_equal(load(name + ".json"), expected),
            "independent scalar/domain/source identity: " + name,
        )
    Cmatrix = {
        p: V.decode_matrix(parent[f"C{p}.json"], shape=(43, 58), max_degree=p)
        for p in range(3)
    }
    L = {
        p: V.decode_matrix(parent[name + ".json"], shape=(58, 58), max_degree=p)
        for p, name in ((0, "J"), (1, "K"))
    }
    e = {
        p: V.decode_matrix(
            parent[matrix_name("e", p) + ".json"], shape=(58, 43), max_degree=19
        )
        for p in range(-2, 3)
    }
    delta_J = empty((58, 58))
    delta_J[18][22] = {(0, 0, 0): F(1)}
    stats = {}

    def compare(name, expected):
        G.require(
            name in module.MATRIX_SPECS and name not in stats,
            "unique independently recomputed matrix",
        )
        rows, cols, cap = module.MATRIX_SPECS[name]
        actual = check_matrix(load(name + ".json"), expected, (rows, cols), cap)
        stats[name] = matrix_stats(actual, cap)
        stage(
            "replay-" + name,
            nonzero_slots=stats[name]["nonzero_slots"],
            coefficients=stats[name]["terms"],
        )

    rebuilt = independent_closure(
        Cmatrix,
        L,
        e,
        delta2,
        delta_J,
        guard=budget.guard,
        check=budget._check_deadline,
        sink=compare,
    )
    G.require(
        set(stats) == set(module.MATRIX_SPECS), "complete 37-matrix reconstruction"
    )
    forbidden = [matrix_name("Bbar", p) for p in (-2, -1, 3, 4, 5)]
    residuals = [matrix_name("closure", p) for p in range(-2, 8)]
    mutated = [matrix_name("mutated_closure", p) for p in range(-2, 8)]
    changed_slots = 0
    for power in range(-2, 8):
        budget._check_deadline()
        difference = combine(
            rebuilt[matrix_name("mutated_closure", power)],
            rebuilt[matrix_name("closure", power)],
            F(-1),
        )
        changed_slots += sum(bool(poly) for row in difference for poly in row)
    bad_slots = sum(stats[n]["nonzero_slots"] for n in mutated)
    mutation = dict(
        schema="nr-case12-physical-closure-mutation-v1",
        name="theta-driver-source-feedback",
        source_matrix="delta_J",
        entry=[18, 22],
        delta_Bbar_powers=list(range(-2, 6)),
        closure_powers=list(range(-2, 8)),
        baseline_residual_preserved=True,
        delta_nonzero_slots=stats["delta_J"]["nonzero_slots"],
        residual_nonzero_slots=bad_slots,
        residual_coefficients=sum(stats[n]["terms"] for n in mutated),
        change_nonzero_slots=changed_slots,
        rejected=stats["delta_J"]["nonzero_slots"] > 0
        and bad_slots > 0
        and changed_slots > 0,
    )
    acceptance = dict(
        registered_frequency_degree=all(
            stats[n]["nonzero_slots"] == 0 for n in forbidden
        ),
        full_state_closure=all(stats[n]["nonzero_slots"] == 0 for n in residuals),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    for name, expected in (
        ("stats", stats),
        ("acceptance", acceptance),
        ("mutation", mutation),
    ):
        G.require(
            canonical_equal(load(name + ".json"), expected),
            "independently derived metadata: " + name,
        )
    G.require(
        set(hashes) == replay_inputs() and len(hashes) == 70,
        "every registered input parsed and hashed",
    )
    zero_names = forbidden + residuals
    return dict(
        schema="nr-case12-independent-physical-closure-v1",
        passed=acceptance["accepted"],
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
        acceptance=acceptance,
        mutation=mutation,
        domain=domain,
        domain_check=domain_check,
        scope=SCOPE,
        complete_frequency_support=True,
        original_shift_retained=True,
        mutated_generator_recomputed=True,
        baseline_failure_not_dropped=True,
        zero_frequency_closure_identity_verified=acceptance[
            "registered_frequency_degree"
        ]
        and acceptance["full_state_closure"],
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        zero_frequency_off_image_unique=False,
        laurent_right_inverse_evaluated_at_zero=False,
        parent_right_inverse_inherited=True,
        new_right_inverse_proof_executed=False,
    )


def finalizer(directory, budget):
    """Only audit saved JSON/XML, source AST and byte hashes after computation."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["full_frequency_closure_validated"]
        is result["physical_frequency_polynomial_generator_validated"]
        is True
        and not result["errors"],
        "complete physical-closure candidate",
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
        report == result["replay"]
        and report["passed"] is True
        and report["schema"] == "nr-case12-independent-physical-closure-v1"
        and report["arithmetic_source"]
        == dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2]))
        and report["integer_arithmetic_source"]
        == dict(path=INTEGER_SOURCE, sha256=INTEGER_SHA)
        and G.sha(ROOT / INTEGER_SOURCE) == INTEGER_SHA
        and report["matrix_count"] == 37
        and report["matrix_slots"] == 82828
        and report["residual_matrices"] == 15
        and report["residual_slots"] == 34185
        and report["residual_nonzero_slots"] == 0
        and len(report["input_hashes"]) == 70
        and set(report["input_hashes"]) == replay_inputs()
        and report["acceptance"] == read(directory / "acceptance.json")
        and all(v is True for v in report["acceptance"].values())
        and report["mutation"] == read(directory / "mutation.json")
        and report["mutation"]["rejected"] is True
        and report["mutation"]["residual_nonzero_slots"] > 0
        and report["mutation"]["change_nonzero_slots"] > 0
        and report["mutation"]["baseline_residual_preserved"] is True
        and report["actual_matrix_stats"] == read(directory / "stats.json")
        and report["domain"]
        == read(directory / "domain.json")
        == producer().domain_metadata()
        and report["complete_frequency_support"] is True
        and report["original_shift_retained"] is True
        and report["mutated_generator_recomputed"] is True
        and report["baseline_failure_not_dropped"] is True
        and report["zero_frequency_closure_identity_verified"] is True
        and report["zero_frequency_reachable_rank"] == 39
        and report["zero_frequency_full43_inverse_exists"] is False
        and report["zero_frequency_off_image_unique"] is False
        and report["laurent_right_inverse_evaluated_at_zero"] is False
        and report["parent_right_inverse_inherited"] is True
        and report["new_right_inverse_proof_executed"] is False
        and report["scope"] == SCOPE
        and report["library"] == "stdlib Fraction and exact Python integer convolution",
        "complete independent physical-closure replay",
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

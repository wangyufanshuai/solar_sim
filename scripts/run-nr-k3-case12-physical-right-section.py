"""Owned all-direction physical right section; unexecuted candidate."""

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

METHOD = "nr-case12-physical-right-section-controls-v1"
HELPER = "scripts/run-nr-k3-case12-physical-coordinate-bridge.py"
HELPER_SHA = "79777e3b5e71f4998236f6b71f57e38d4ff79eb039d0002decf11a3975bdd787"
PARENT = G.EVIDENCE / "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"
PARENT_GATE = "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708"
PARENT_WORKER = "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811"
EXTRA = (
    "scripts/nr_case12_physical_right_section.py",
    "scripts/tests/test_nr_case12_physical_right_section.py",
    "scripts/run-nr-k3-case12-physical-right-section.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-physical-right-section.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-physical-right-section.md",
    "science/numerical_relativity/RESULTS-20261015-case12-physical-coordinate-bridge.md",
    "science/numerical_relativity/NOTE-20261015-case12-physical-right-section-next.md",
)
TEST_FILES = (EXTRA[1], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = ((18, 48), (21, 73))
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "mutation",
    "domain",
    "source_bridge",
    "parent_provenance",
)
SCOPE = "fixed-case12 physical43 right section; real v!=0; complex zeta!=0"
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "full_frequency_closure_validated",
    "full_frequency_energy_validated",
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
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen coordinate runner")
    spec = importlib.util.spec_from_file_location("nr_coordinate_parent", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def producer():
    import nr_case12_physical_right_section as module

    return module


def foundation():
    return helper().foundation()


def parent_gate():
    gate = qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["physical_coordinate_bridge_validated"] is True,
        "complete parent coordinate qualification",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 643
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 643 parent sources unchanged",
    )
    G.require(
        not set(table).intersection(EXTRA), "seven additive right-section sources"
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 650, "650-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 853, "complete coordinate evidence"
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 23 and sum(map(len, table.values())) == 16387,
        "twenty-three unchanged historical trees",
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
            "registered physical right section control count",
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
            "physical right section controls failed; no automatic retry",
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
            "fixed coordinate parent bytes",
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
        physical_nonzero_frequency_right_section_validated=False,
        physical_full43_nonzero_frequency_rank_validated=False,
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
                "unique registered right-section evidence",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        module.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(
            saved == expected, "every registered right-section certificate part saved"
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
            "right-section source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "physical right section failed; preserve all evidence",
        )
        result.update(
            passed=True,
            completed=True,
            physical_nonzero_frequency_right_section_validated=True,
            physical_full43_nonzero_frequency_rank_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            physical_nonzero_frequency_right_section_validated=False,
            physical_full43_nonzero_frequency_rank_validated=False,
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


def independent_section(
    Fmatrix,
    s,
    t,
    Cmatrix,
    delta,
    *,
    guard=lambda: None,
    check=lambda: None,
    sink=lambda name, matrix: None,
):
    """Use s*((delta I-zeta^-1 H)*t), unlike producer's distributed order."""
    m, n = V.matrix_shape(s)
    G.require(V.matrix_shape(Fmatrix) == (n, m), "right-section F dimensions")
    require_series(t, range(-1, 3), (n, n))
    require_series(Cmatrix, range(3), (n, m))
    G.require(bool(delta), "nonzero direction denominator polynomial")
    result = {}

    def emit(name, matrix):
        guard()
        sink(name, matrix)
        result[name] = matrix

    H = independent_product(Fmatrix, s, guard=guard, check=check)
    emit("H", H)
    emit("H_squared", independent_product(H, H, guard=guard, check=check))
    correction = {
        -1: scale_matrix(H, {(0, 0, 0): F(-1)}, check=check),
        0: identity(n, delta),
    }
    middle = laurent_product(correction, t, guard=guard, check=check)
    e = laurent_product({0: s}, middle, guard=guard, check=check)
    for p in range(-2, 3):
        emit(matrix_name("e", p), e[p])
    delta2 = R.multiply_polynomials(delta, delta, check=check)

    def residuals(prefix, values):
        residual = laurent_product(Cmatrix, values, guard=guard, check=check)
        residual[0] = combine(residual[0], identity(n, delta2), F(-1))
        for p in range(-2, 5):
            emit(matrix_name(prefix, p), residual[p])

    residuals("right_inverse", e)
    bad = {-2: empty((m, n))}
    for p in range(-1, 3):
        bad[p] = scale_matrix(
            independent_product(s, t[p], guard=guard, check=check), delta, check=check
        )
    for p in range(-2, 3):
        emit(matrix_name("bad_e", p), bad[p])
    residuals("bad_right_inverse", bad)
    return result


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
        F(18, 25) ** 2 * F(5, 6) ** 4 == F(1, 4), "positive squared denominator floor"
    )
    domain = dict(
        schema="nr-case12-physical-right-section-domain-v1",
        fixed_case=12,
        direction="real-nonzero",
        frequency="complex-nonzero",
        g_lower_over_r="5/6",
        chi="18/25",
        denominator="delta_squared=chi^2*r^4*g^4",
        denominator_lower_over_r8="1/4",
        zero_frequency_admitted=False,
        full43_zero_frequency_right_inverse_exists=False,
        full_frequency_closure_proved=False,
        low_frequency_uniform_energy_proved=False,
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
    s = V.decode_matrix(parent["s.json"], shape=(58, 43), max_degree=6)
    V.decode_matrix(parent["d.json"], shape=(43, 58), max_degree=3)
    Fmatrix = V.decode_matrix(parent["F.json"], shape=(43, 58), max_degree=2)
    t = {
        p: V.decode_matrix(
            parent[matrix_name("t", p) + ".json"], shape=(43, 43), max_degree=p + 3
        )
        for p in range(-1, 3)
    }
    Cmatrix = {
        p: V.decode_matrix(parent[f"C{p}.json"], shape=(43, 58), max_degree=p)
        for p in range(3)
    }
    G.require(not V.coefficient_count(t[2]), "complete parent zero t2 retained")
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

    independent_section(
        Fmatrix,
        s,
        t,
        Cmatrix,
        delta,
        guard=budget.guard,
        check=budget._check_deadline,
        sink=compare,
    )
    G.require(
        set(stats) == set(module.MATRIX_SPECS), "complete 26-matrix reconstruction"
    )
    main_residuals = [
        "H_squared",
        *[matrix_name("right_inverse", p) for p in range(-2, 5)],
    ]
    bad_residuals = [matrix_name("bad_right_inverse", p) for p in range(-2, 5)]
    bad_slots = sum(stats[name]["nonzero_slots"] for name in bad_residuals)
    mutation = dict(
        schema="nr-case12-physical-right-section-mutation-v1",
        name="omit-negative-frequency-correction",
        changed_formula="bad_e=s*delta*t",
        residual_powers=list(range(-2, 5)),
        residual_nonzero_slots=bad_slots,
        residual_coefficients=sum(stats[name]["terms"] for name in bad_residuals),
        rejected=bad_slots > 0,
    )
    acceptance = dict(
        nilpotence=stats["H_squared"]["nonzero_slots"] == 0,
        physical_right_inverse=all(
            stats[n]["nonzero_slots"] == 0 for n in main_residuals[1:]
        ),
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
        set(hashes) == replay_inputs() and len(hashes) == 53,
        "every registered input parsed and hashed",
    )
    return dict(
        schema="nr-case12-independent-physical-right-section-v1",
        passed=acceptance["accepted"],
        input_hashes=hashes,
        parent_gate_sha256=PARENT_GATE,
        arithmetic_source=dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2])),
        integer_arithmetic_source=dict(path=INTEGER_SOURCE, sha256=INTEGER_SHA),
        library="stdlib Fraction and exact Python integer convolution",
        matrix_count=len(stats),
        matrix_slots=sum(v["slots"] for v in stats.values()),
        residual_matrices=len(main_residuals),
        residual_slots=sum(stats[n]["slots"] for n in main_residuals),
        residual_nonzero_slots=sum(stats[n]["nonzero_slots"] for n in main_residuals),
        actual_matrix_stats=stats,
        acceptance=acceptance,
        mutation=mutation,
        domain=domain,
        domain_check=domain_check,
        scope=SCOPE,
        complete_frequency_support=True,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        parent_principal_identity_inherited=True,
        new_principal_proof_executed=False,
    )


def finalizer(directory, budget):
    """Only audit saved JSON/XML, source AST and byte hashes after computation."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["physical_nonzero_frequency_right_section_validated"]
        is result["physical_full43_nonzero_frequency_rank_validated"]
        is True
        and not result["errors"],
        "complete right-section candidate",
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
        and report["schema"] == "nr-case12-independent-physical-right-section-v1"
        and report["arithmetic_source"]
        == dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2]))
        and report["integer_arithmetic_source"]
        == dict(path=INTEGER_SOURCE, sha256=INTEGER_SHA)
        and G.sha(ROOT / INTEGER_SOURCE) == INTEGER_SHA
        and report["matrix_count"] == 26
        and report["matrix_slots"] == 54524
        and report["residual_matrices"] == 8
        and report["residual_slots"] == 14792
        and report["residual_nonzero_slots"] == 0
        and len(report["input_hashes"]) == 53
        and set(report["input_hashes"]) == replay_inputs()
        and report["acceptance"] == read(directory / "acceptance.json")
        and all(v is True for v in report["acceptance"].values())
        and report["mutation"] == read(directory / "mutation.json")
        and report["mutation"]["rejected"] is True
        and report["mutation"]["residual_nonzero_slots"] > 0
        and report["actual_matrix_stats"] == read(directory / "stats.json")
        and report["domain"]
        == read(directory / "domain.json")
        == producer().domain_metadata()
        and report["complete_frequency_support"] is True
        and report["zero_frequency_reachable_rank"] == 39
        and report["zero_frequency_full43_inverse_exists"] is False
        and report["laurent_evaluated_at_zero"] is False
        and report["parent_principal_identity_inherited"] is True
        and report["new_principal_proof_executed"] is False
        and report["scope"] == SCOPE
        and report["library"] == "stdlib Fraction and exact Python integer convolution",
        "complete independent section replay",
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

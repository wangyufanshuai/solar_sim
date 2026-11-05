"""Owned all-direction physical-coordinate bridge; unexecuted candidate."""

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

METHOD = "nr-case12-physical-coordinate-bridge-controls-v1"
HELPER = "scripts/run-nr-k3-case12-full58-factorized-energy.py"
HELPER_SHA = "b29bc5d541fff761a351e163dfce99c03f63a9cc198dbe600341f09dc5e90fb4"
PARENT = G.EVIDENCE / "nr-k3-case12-full58-factorized-energy-controls-v1-20261014"
PARENT_GATE = "64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4"
PARENT_WORKER = "35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357"
EXTRA = (
    "scripts/nr_case12_physical_coordinate_bridge.py",
    "scripts/tests/test_nr_case12_physical_coordinate_bridge.py",
    "scripts/run-nr-k3-case12-physical-coordinate-bridge.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-physical-coordinate-bridge.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-physical-coordinate-bridge.md",
    "science/numerical_relativity/RESULTS-20261015-case12-full58-factorized-energy.md",
)
TEST_FILES = (EXTRA[1],)
TEST_REGISTRATION = ((27, 71),)
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "zero_frequency",
    "mutations",
    "source_bridge",
    "parent_provenance",
)
SCOPE = "fixed-case12 physical43 rational direction extension; real v!=0; nonzero Laurent frequency"
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


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen full58 energy runner")
    spec = importlib.util.spec_from_file_location("nr_coordinate_parent", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def producer():
    import nr_case12_physical_coordinate_bridge as module

    return module


def foundation():
    return helper().foundation()


def parent_gate():
    gate = helper().helper().qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["full58_principal_factorized_energy_validated"] is True,
        "complete parent energy qualification",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 637
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 637 parent sources unchanged",
    )
    G.require(not set(table).intersection(EXTRA), "six additive coordinate sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 643, "643-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(observed == expected and len(observed) == 688, "complete energy evidence")
    table[PARENT.name] = observed
    G.require(
        len(table) == 22 and sum(map(len, table.values())) == 15534,
        "twenty-two unchanged historical trees",
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


def scale_matrix(matrix, scale):
    result = empty(V.matrix_shape(matrix))
    for i, row in enumerate(matrix):
        for j, poly in enumerate(row):
            V.add_product(result[i][j], poly, scale)
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


def laurent_product(left, right, *, guard=lambda: None, check=lambda: None):
    G.require(
        type(left) is type(right) is dict and left and right,
        "nonempty Laurent coefficient dictionaries",
    )
    lshape, rshape = (
        V.matrix_shape(next(iter(left.values()))),
        V.matrix_shape(next(iter(right.values()))),
    )
    G.require(all(type(p) is int for p in (*left, *right)), "integer Laurent powers")
    require_series(left, range(min(left), max(left) + 1), lshape)
    require_series(right, range(min(right), max(right) + 1), rshape)
    G.require(lshape[1] == rshape[0], "Laurent multiplication dimensions")
    result = {
        p: empty((lshape[0], rshape[1]))
        for p in range(min(left) + min(right), max(left) + max(right) + 1)
    }
    for p, a in left.items():
        for q, b in right.items():
            guard()
            # Each bounded sparse coefficient product is enclosed by guards;
            # the Windows Job independently enforces the whole-run deadline.
            term = V.multiply(a, b, guard=check)
            result[p + q] = combine(result[p + q], term)
    guard()
    return result


def check_matrix(record, expected, shape, degree_cap):
    observed = V.decode_matrix(record, shape=shape, max_degree=degree_cap)
    G.require(
        canonical_equal(V.encode_matrix(observed), V.encode_matrix(expected)),
        "independently rebuilt complete matrix mismatch",
    )
    return observed


def constant_matrix(record, shape):
    G.require(
        type(record) is dict
        and set(record) == {"shape", "representation", "entries"}
        and type(record["shape"]) is list
        and all(type(x) is int for x in record["shape"])
        and record["shape"] == list(shape)
        and record["representation"] == "sparse-exact-rational-zero-fill"
        and type(record["entries"]) is list,
        "registered constant rational matrix",
    )
    result, previous = empty(shape), None
    for entry in record["entries"]:
        G.require(
            type(entry) is list
            and len(entry) == 4
            and type(entry[0]) is type(entry[1]) is int,
            "constant sparse coordinates",
        )
        i, j, n, d = entry
        G.require(
            0 <= i < shape[0]
            and 0 <= j < shape[1]
            and (previous is None or previous < (i, j))
            and type(n) is type(d) is str,
            "ordered unique constant entries",
        )
        numerator, denominator = int(n), int(d)
        G.require(
            str(numerator) == n
            and str(denominator) == d
            and numerator != 0
            and denominator > 0,
            "canonical rational entry",
        )
        coefficient = F(numerator, denominator)
        G.require(
            str(coefficient.numerator) == n and str(coefficient.denominator) == d,
            "reduced constant rational entry",
        )
        result[i][j] = {(0, 0, 0): coefficient}
        previous = i, j
    return result


def verify_identity(series, scale_poly, powers, shape, *, guard=lambda: None):
    require_series(series, powers, shape)
    G.require(shape[0] == shape[1], "square inverse identity")
    result = {}
    for power, matrix in series.items():
        guard()
        target = identity(shape[0], scale_poly) if power == 0 else empty(shape)
        result[power] = combine(matrix, target, F(-1))
    return result


def polynomial_sum(*terms):
    result = {}
    for poly, factor in terms:
        G.require(type(factor) is F, "exact polynomial linear combination")
        for exponent, coefficient in poly.items():
            value = result.get(exponent, F(0)) + factor * coefficient
            if value:
                result[exponent] = value
            else:
                result.pop(exponent, None)
    return result


def polynomial_product(left, right):
    result = {}
    V.add_product(result, left, right)
    return result


def reference_factors(domain, *, guard=lambda: None):
    """Independent direct-index assembly, without producer arrays or AST calls.

    J and C0 are separately bound to the accepted constant physical source.
    The remaining physical maps and both elementary Laurent factors are
    reconstructed here by scalar coefficient accumulation in standard Python.
    """
    u = [[F(value) for value in row] for row in domain["inverse"]]
    chi = F(domain["chi"])
    one = {(0, 0, 0): F(1)}
    v = [{tuple(int(i == j) for j in range(3)): F(1)} for i in range(3)]
    r = polynomial_sum(*[(polynomial_product(x, x), F(1)) for x in v])
    vu = [polynomial_sum(*[(v[j], u[i][j]) for j in range(3)]) for i in range(3)]
    g = polynomial_sum(*[(polynomial_product(v[i], vu[i]), F(1)) for i in range(3)])
    pairs = [(0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2)]

    def index(i, j):
        return pairs.index((min(i, j), max(i, j)))

    def aux(k, i, j):
        return 20 + 6 * k + index(i, j)

    def add(matrix, row, col, poly, factor=F(1)):
        matrix[row][col] = polynomial_sum((matrix[row][col], F(1)), (poly, factor))

    c1, c2 = empty((43, 58)), empty((43, 58))
    for i in range(3):
        guard()
        for j in range(3):
            add(c2, 0, index(i, j), polynomial_product(vu[i], vu[j]), chi)
            add(c2, 0, index(i, j), g, -chi * u[i][j])
            add(c1, 1 + i, 11 + index(j, i), vu[j])
            add(c1, 5 + i, index(i, j), vu[j], F(-1, 2))
        add(c1, 1 + i, 17, v[i], F(-2, 3))
        for a in range(3):
            for b in range(3):
                add(c1, 1 + i, 11 + index(a, b), v[i], -u[a][b])
                add(c1, 5 + i, index(a, b), v[i], u[a][b] / 4)
        add(c1, 8 + i, 6, v[i], F(-1))
        add(c1, 38 + i, 10, v[i], F(-1))
        for j in range(3):
            add(c1, 11 + 3 * i + j, 7 + j, v[i], F(-1))
        for j in range(6):
            add(c1, 20 + 6 * i + j, j, v[i], F(-1, 2))
    add(c2, 0, 10, g, 4 * chi)

    parallel, auxiliary = empty((43, 43)), empty((43, 43))
    for start, width in ((8, 1), (11, 3), (20, 6), (38, 1)):
        for k in range(3):
            for j in range(width):
                auxiliary[start + width * k + j][start + width * k + j] = dict(one)
                for ell in range(3):
                    parallel[start + width * k + j][start + width * ell + j] = (
                        polynomial_product(v[k], v[ell])
                    )
    high = [[dict(cell) for cell in row] for row in parallel]
    for i in range(4):
        high[i][i] = dict(r)
    low = empty((43, 43))
    low[41][41] = dict(one)
    common = combine(scale_matrix(auxiliary, r), parallel, F(-1))
    for i in (*range(4, 8), 42):
        common[i][i] = dict(r)
    trace = empty((43, 43))
    for k in range(3):
        for p, (i, j) in enumerate(pairs):
            add(trace, 41, 20 + 6 * k + p, v[k], 2 * u[i][j] * (1 if i == j else 2))
    rw = {
        -1: high,
        0: combine(common, scale_matrix(trace, r)),
        1: scale_matrix(low, polynomial_product(r, r)),
    }
    rwi = {-1: low, 0: combine(common, trace, F(-1)), 1: high}

    z0, z1 = empty((43, 43)), empty((43, 43))
    for i in range(3):
        guard()
        for j in range(3):
            for ell in range(3):
                add(z0, 5 + i, aux(j, i, ell), one, -u[j][ell])
                add(z0, 5 + i, aux(i, j, ell), one, u[j][ell] / 2)
                add(z1, 0, aux(i, ell, j), vu[ell], 2 * chi * u[i][j])
                add(z1, 0, aux(ell, i, j), vu[ell], -2 * chi * u[i][j])
        add(z1, 0, 38 + i, vu[i], 4 * chi)
    return dict(
        C1=c1,
        C2=c2,
        rW=rw,
        rWi=rwi,
        U={0: combine(identity(43), z0), 1: z1},
        Ui={
            0: combine(identity(43), z0, F(-1)),
            1: scale_matrix(z1, {(0, 0, 0): F(-1)}),
        },
        r=r,
        g=g,
    )


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
            "registered coordinate bridge control count",
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
            "coordinate bridge controls failed; no automatic retry",
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def input_records():
    module = producer()
    for name, hashes in module.PARENT_GATES.items():
        helper().helper().qualified(
            G.EVIDENCE / name, hashes["gate_sha256"], hashes["worker_sha256"]
        )
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


def replay(directory, budget, stage):
    """Rebuild every saved coefficient with independent stdlib arithmetic."""
    module, hashes, records = producer(), {}, {}

    def load(name):
        budget.guard()
        raw = (directory / name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    parent = {name: load("parent-inputs/" + name) for name in module.PARENT_FILES}
    for name, item in module.PARENT_FILES.items():
        G.require(
            hashes["parent-inputs/" + name] == item["sha256"],
            "independent parent input byte binding",
        )
    raw_parent = {
        name: (directory / "parent-inputs" / name).read_bytes()
        for name in module.PARENT_FILES
    }
    provenance = module.parent_provenance_manifest(raw_parent)
    domain = foundation().verify_domain(
        parent["domain.json"], parent["denominators.json"]
    )
    domain.pop("delta")
    G.require(
        canonical_equal(load("parent_provenance.json"), provenance)
        and canonical_equal(
            load("source_bridge.json"), module.source_bridge_manifest()
        ),
        "source and parent interpretations bound to actual bytes",
    )
    actual = {}
    for name, (rows, cols, cap) in module.MATRIX_SPECS.items():
        records[name] = load(name + ".json")
        actual[name] = V.decode_matrix(
            records[name], shape=(rows, cols), max_degree=cap
        )
    for i in range(3):
        G.require(
            all(
                sum(exponent) == i
                for row in actual[f"C{i}"]
                for poly in row
                for exponent in poly
            ),
            "homogeneous physical frequency coefficients",
        )
    reference = reference_factors(parent["domain.json"], guard=budget._check_deadline)
    expected = {
        "C0": constant_matrix(parent["physical_C0.json"], (43, 58)),
        "C1": reference["C1"],
        "C2": reference["C2"],
        "J": constant_matrix(parent["source58.json"], (58, 58)),
    }
    for name in expected:
        rows, cols, cap = module.MATRIX_SPECS[name]
        check_matrix(records[name], expected[name], (rows, cols), cap)
    r, g = reference["r"], reference["g"]
    r2 = polynomial_product(r, r)
    scalar_record = {
        "r": V.encode_polynomial(r),
        "r_squared": V.encode_polynomial(r2),
        "g": V.encode_polynomial(g),
    }
    G.require(
        canonical_equal(load("scalars.json"), scalar_record),
        "independent exact direction scalars",
    )

    def multiply(a, b):
        budget.guard()
        return V.multiply(a, b, guard=budget._check_deadline)

    def convolution(a, b):
        return laurent_product(a, b, guard=budget.guard, check=budget._check_deadline)

    def family(label, values):
        shape = (43, 58 if label == "rTC" else 43)
        require_series(values, tuple(module.FAMILY_CAPS[label]), shape)
        for power, matrix in values.items():
            name = module.matrix_name(label, power)
            expected[name] = matrix
            check_matrix(records[name], matrix, shape, module.FAMILY_CAPS[label][power])
        return values

    rw, rwi, u, ui = (
        family(name, reference[name]) for name in ("rW", "rWi", "U", "Ui")
    )
    rt = family("rT", convolution(rw, u))
    rti = family("rTi", convolution(ui, rwi))
    stage("replay-source-maps-and-transforms-complete")
    for label, left, right in (("W", rw, rwi), ("U", u, ui), ("T", rt, rti)):
        for orientation, a, b in (("forward", left, right), ("reverse", right, left)):
            label_name = "inverse_" + label + "_" + orientation
            product = convolution(a, b)
            residual = verify_identity(
                product,
                {(0, 0, 0): F(1)} if label == "U" else r2,
                tuple(module.FAMILY_CAPS[label_name]),
                (43, 43),
                guard=budget._check_deadline,
            )
            if label == "U":
                residual = {
                    p: scale_matrix(matrix, r2) for p, matrix in residual.items()
                }
            family(label_name, residual)
    stage("replay-six-complete-inverses")
    physical = {i: expected[f"C{i}"] for i in range(3)}
    tc = family("rTC", convolution(rt, physical))
    leading = V.decode_matrix(parent["Dtilde.json"], shape=(43, 58), max_degree=3)
    expected["leading_residual"] = combine(tc[0], leading, F(-1))
    for power in range(1, 5):
        expected[f"positive_residual_{power}"] = tc[power]
    stage("replay-all-transformed-frequency-powers")

    for name in ("D39", "S39", "B39", "off_image_ambiguity"):
        expected[name] = constant_matrix(
            parent[name + ".json"], module.MATRIX_SPECS[name][:2]
        )
    d, s, b, ambiguity = (
        expected[name] for name in ("D39", "S39", "B39", "off_image_ambiguity")
    )
    c0, source = actual["C0"], actual["J"]
    expected.update(
        zero_top_residual=c0[:4],
        zero_map_residual=combine(c0[4:], d, F(-1)),
        zero_section_residual=combine(multiply(d, s), identity(39), F(-1)),
        zero_transport_residual=combine(multiply(b, d), multiply(d, source), F(-1)),
        zero_ambiguity_residual=multiply(ambiguity, c0),
        source_residual=combine(source, expected["J"], F(-1)),
        C0_parent_residual=combine(c0, expected["C0"], F(-1)),
    )
    exact_ambiguity = empty((43, 43))
    exact_ambiguity[4][0] = {(0, 0, 0): F(1)}
    ambiguity_is_e40 = canonical_equal(
        V.encode_matrix(ambiguity), V.encode_matrix(exact_ambiguity)
    )
    stage("replay-zero-frequency-image")
    for kind in ("determinant", "offdiagonal"):
        delta = empty((43, 43))
        for col in range(20, 38) if kind == "determinant" else [21]:
            delta[41][col] = polynomial_sum(
                (rw[0][41][col], F(-1) if kind == "determinant" else F(-1, 2))
            )
        residual = combine(tc[1], multiply(multiply(delta, u[0]), physical[1]))
        residual = combine(residual, multiply(multiply(delta, u[1]), physical[0]))
        expected[f"negative_{kind}_delta_rW0"] = delta
        expected[f"negative_{kind}_positive1"] = residual
    G.require(
        set(expected) == set(module.MATRIX_SPECS),
        "all independent matrices accounted for",
    )
    stats = {}
    for name, matrix in expected.items():
        budget.guard()
        rows, cols, cap = module.MATRIX_SPECS[name]
        observed = check_matrix(records[name], matrix, (rows, cols), cap)
        cells = [poly for row in observed for poly in row]
        stats[name] = dict(
            shape=[rows, cols],
            slots=rows * cols,
            nonzero_slots=sum(bool(poly) for poly in cells),
            terms=sum(len(poly) for poly in cells),
            degree_max=max(
                (sum(exponent) for poly in cells for exponent in poly), default=-1
            ),
            degree_cap=cap,
        )
    G.require(
        canonical_equal(load("stats.json"), stats),
        "actual complete coefficient statistics",
    )
    zero_names = [
        name
        for name in expected
        if name.startswith("zero_") and name.endswith("_residual")
    ]
    inverse_names = [name for name in expected if name.startswith("inverse_")]

    def is_zero(names):
        return all(stats[name]["nonzero_slots"] == 0 for name in names)

    zero_ok = is_zero(zero_names) and ambiguity_is_e40
    zero_record = dict(
        schema="nr-case12-physical-zero-image-v1",
        reachable_rank=39 if zero_ok else None,
        zero_rows=[0, 1, 2, 3],
        direction_independent_source_and_map=True,
        right_section_verified=is_zero(["zero_section_residual"]),
        invariant_image_verified=is_zero(["zero_transport_residual"]),
        ambiguity_nonzero_slots=stats["off_image_ambiguity"]["nonzero_slots"],
        ambiguity_is_E40=ambiguity_is_e40,
        full43_right_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        accepted=zero_ok,
    )
    mutation_rows = []
    for kind, label in (
        ("determinant", "remove-determinant-compensation"),
        ("offdiagonal", "halve-symmetric-offdiagonal"),
    ):
        dn, rn = f"negative_{kind}_delta_rW0", f"negative_{kind}_positive1"
        mutation_rows.append(
            dict(
                name=label,
                kind=kind,
                delta_matrix=dn,
                residual_matrix=rn,
                changed_row=41,
                changed_columns=list(range(20, 38)) if kind == "determinant" else [21],
                delta_nonzero_slots=stats[dn]["nonzero_slots"],
                nonzero_slots=stats[rn]["nonzero_slots"],
                coefficients=stats[rn]["terms"],
                rejected=stats[dn]["nonzero_slots"] > 0
                and stats[rn]["nonzero_slots"] > 0,
            )
        )
    mutation_record = dict(
        schema="nr-case12-physical-coordinate-mutations-v1",
        rows=mutation_rows,
        accepted=all(row["rejected"] for row in mutation_rows),
    )
    acceptance = dict(
        inverse_relations=is_zero(inverse_names),
        leading_map=is_zero(["leading_residual"]),
        positive_frequency_powers=is_zero(
            [f"positive_residual_{p}" for p in range(1, 5)]
        ),
        fixed_constant_source=is_zero(["source_residual", "C0_parent_residual"]),
        zero_frequency_image=zero_ok,
        mutation_controls=mutation_record["accepted"],
    )
    acceptance["accepted"] = all(acceptance.values())
    for name, expected_record in (
        ("zero_frequency", zero_record),
        ("mutations", mutation_record),
        ("acceptance", acceptance),
    ):
        G.require(
            canonical_equal(load(name + ".json"), expected_record),
            "independently decided " + name,
        )
    residual_names = inverse_names + [
        "leading_residual",
        *[f"positive_residual_{p}" for p in range(1, 5)],
        *zero_names,
        "source_residual",
        "C0_parent_residual",
    ]
    G.require(
        set(hashes) == replay_inputs() and len(hashes) == 101,
        "all 101 parsed replay inputs",
    )
    stage("replay-negative-controls-and-acceptance", accepted=acceptance["accepted"])
    return dict(
        schema="nr-case12-independent-physical-coordinate-bridge-v1",
        passed=acceptance["accepted"],
        parent_gate_sha256=PARENT_GATE,
        input_hashes=hashes,
        arithmetic_source=dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2])),
        library="stdlib Fraction direct-index source maps and sparse Laurent convolution",
        matrix_count=len(stats),
        matrix_slots=sum(row["slots"] for row in stats.values()),
        residual_matrices=len(residual_names),
        residual_slots=sum(stats[name]["slots"] for name in residual_names),
        residual_nonzero_slots=sum(
            stats[name]["nonzero_slots"] for name in residual_names
        ),
        actual_matrix_stats=stats,
        acceptance=acceptance,
        mutations=mutation_record,
        zero_frequency=zero_record,
        domain=domain,
        scope=SCOPE,
        negative_frequency_coefficients_preserved=True,
        old_zero39_section_reused=True,
        new_zero39_products_computed=True,
        full43_right_inverse_exists=False,
        laurent_evaluated_at_zero=False,
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
        physical_coordinate_bridge_validated=False,
        zero_frequency_physical39_validated=False,
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
                "unique registered coordinate evidence",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        module.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(
            saved == expected, "every registered coordinate certificate part saved"
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
            "coordinate source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "coordinate bridge failed; preserve all evidence",
        )
        result.update(
            passed=True,
            completed=True,
            physical_coordinate_bridge_validated=True,
            zero_frequency_physical39_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            physical_coordinate_bridge_validated=False,
            zero_frequency_physical39_validated=False,
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
    """Pure saved metadata/AST/hash audit after the owned computation."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["physical_coordinate_bridge_validated"]
        is result["zero_frequency_physical39_validated"]
        is True
        and not result["errors"],
        "complete coordinate candidate",
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
        "fixed scientific scope and resource contract",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved complete tests",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        report == result["replay"]
        and report["passed"] is True
        and report["schema"] == "nr-case12-independent-physical-coordinate-bridge-v1"
        and report["arithmetic_source"]
        == dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2]))
        and report["matrix_count"] == 78
        and report["matrix_slots"] == 158241
        and report["residual_matrices"] == 42
        and report["residual_slots"] == 82569
        and report["residual_nonzero_slots"] == 0
        and len(report["input_hashes"]) == 101
        and report["acceptance"] == read(directory / "acceptance.json")
        and all(value is True for value in report["acceptance"].values())
        and report["zero_frequency"] == read(directory / "zero_frequency.json")
        and report["zero_frequency"]["reachable_rank"] == 39
        and report["mutations"] == read(directory / "mutations.json")
        and report["mutations"]["accepted"] is True
        and report["actual_matrix_stats"] == read(directory / "stats.json")
        and report["negative_frequency_coefficients_preserved"] is True
        and report["old_zero39_section_reused"] is True
        and report["new_zero39_products_computed"] is True
        and report["full43_right_inverse_exists"] is False
        and report["laurent_evaluated_at_zero"] is False
        and report["scope"] == SCOPE
        and report["library"]
        == "stdlib Fraction direct-index source maps and sparse Laurent convolution"
        and set(report["input_hashes"]) == replay_inputs(),
        "complete independent coordinate report",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replayed bytes changed"
        )
    module = producer()
    G.require(
        module.source_bridge_manifest() == read(directory / "source_bridge.json"),
        "final source AST bindings",
    )
    parent = input_records()
    G.require(
        all(
            (directory / "parent-inputs" / name).read_bytes() == raw
            for name, raw in parent.items()
        ),
        "final parent input identity",
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

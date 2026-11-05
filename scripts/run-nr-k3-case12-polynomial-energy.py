"""One owned fixed-case12 complete direction energy and Gram certificate batch."""

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

METHOD = "nr-case12-polynomial-energy-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-compression-controls-v1-20261014"
PARENT_GATE = "04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda"
PARENT_WORKER = "fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6"
HELPER = "scripts/run-nr-k3-case12-polynomial-compression.py"
HELPER_SHA = "3e221e127f0ba6e22a251da0a322909d853cb076180897dc4e2390f03aa05cdf"
EXTRA = (
    "scripts/nr_case12_polynomial_energy.py",
    "scripts/tests/test_nr_case12_polynomial_energy.py",
    "scripts/run-nr-k3-case12-polynomial-energy.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-energy.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-energy.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-compression.md",
)
NAMES = ("NO", "N0", *[f"N{j}" for j in range(1, 7)])
COMPONENTS = (*NAMES, *[f"M{j}" for j in range(1, 7)])
WEIGHTS = (F(1), F(1), *([F(1, 2)] * 6))
CONSTANTS = (
    F(2601, 100000),
    F(2601, 50000),
    F(2601, 5000),
    F(153, 125),
    F(459, 250),
    F(306, 125),
)
DOMAIN_PATH = "parent-inputs/" * 5 + "domain.json"
DENOMINATORS_PATH = DOMAIN_PATH.replace("domain.json", "denominators.json")
PARENT_INPUTS = tuple(name + "_quotient.json" for name in COMPONENTS) + (
    "scalars.json",
    DOMAIN_PATH,
    DENOMINATORS_PATH,
)
ANCESTOR = G.EVIDENCE / "nr-k3-case12-polynomial-projectors-controls-v1-20261014"
ANCESTOR_GATE = "a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1"
ANCESTOR_WORKER = "7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9"
ANCESTOR_INPUTS = {
    "X.json": (
        "parent-inputs/X.json",
        "8ca8cbbcb17810fe0f48a2681285648bcd659c602091c0ba863f72d5e801a3e0",
    ),
    "Pt.json": (
        "parent-inputs/parent-inputs/Pt.json",
        "1e34f1af36c881793cda6a323d1ec62e43258cf15089b4fb06d30acb2da02def",
    ),
}
MATRIX_CAPS = {
    "Gt": 2,
    **{"F_" + name: 9 for name in NAMES},
    "Hbar": 20,
    "Cgram": 20,
    "Hsym": 20,
    "HL": 24,
    "HP": 22,
    "Gram": 20,
}
MUTATION_CAPS = {"delta_Hbar": 0, "mutant_Hsym": 20}
ACCEPTANCE_KEYS = {
    "energy_symmetry",
    "intrinsic_symmetrization",
    "pde_symmetrization",
    "gram_identity",
    "uniform_bounds",
    "accepted",
}
PRINCIPAL_SCOPE = "fixed-case12 43-dimensional principal quotient only"
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
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
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen compression runner required")
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
        is gate["numerator_compression_validated"]
        is gate["fixed_factors_validated"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete compression parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 610
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive energy sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 616, "616-source energy contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 758,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 18 and sum(map(len, table.values())) == 12701,
        "eighteen immutable historical trees",
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
        len(tests) == 21 and sum(tests.values()) == 39,
        "frozen energy controls",
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
        G.require(child.returncode == 0, "energy controls failed; no automatic retry")
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


def foundation():
    return helper().foundation()


def ancestor_gate():
    G.require(
        G.sha(ANCESTOR / "qualification-gate.json") == ANCESTOR_GATE
        and G.sha(ANCESTOR / "worker-result.json") == ANCESTOR_WORKER,
        "qualified X/Pt ancestor identity",
    )
    record = G.read_terminal(ANCESTOR / "qualification-gate.json")
    G.require(
        record["passed"] is record["completed"] is True
        and record["supervisor"]["cleanup_verified"] is True,
        "complete ancestor",
    )
    for name, digest in ANCESTOR_INPUTS.values():
        G.require(
            record["artifact_hashes"][name] == digest, "ancestor X/Pt bytes bound"
        )
    return record


def poly_mul(*values):
    answer = {(0, 0, 0): F(1)}
    for value in values:
        output = {}
        V.add_product(output, answer, value)
        answer = output
    return answer


def poly_scale(poly, coefficient):
    return {
        power: value * coefficient
        for power, value in poly.items()
        if value * coefficient
    }


def transpose(matrix):
    rows, columns = V.matrix_shape(matrix)
    return [[dict(matrix[i][j]) for i in range(rows)] for j in range(columns)]


def _normalize(poly):
    V.encode_polynomial(poly)
    if not poly:
        return F(0), ()
    coefficient = poly[max(poly)]
    return coefficient, tuple(
        (power, value / coefficient) for power, value in sorted(poly.items())
    )


class ProductCache:
    """Bounded exact scalar-normalized products; caches never affect decisions."""

    def __init__(self, check=lambda: None):
        self.values = {}
        self.terms = 0
        self.check = check
        self.calls = 0

    def product(self, a, b):
        self.calls += 1
        if self.calls % 32 == 0:
            self.check()
        if not a or not b:
            return {}
        key = (a, b) if a <= b else (b, a)
        if key not in self.values:
            value = {}
            V.add_product(value, dict(a), dict(b))
            if len(self.values) >= 1024 or self.terms + len(value) > 100000:
                self.values.clear()
                self.terms = 0
            if len(value) > 100000:
                return value
            self.values[key] = value
            self.terms += len(value)
        return self.values[key]


def _add_scaled(target, value, factor):
    for power, coefficient in value.items():
        new = target.get(power, F(0)) + coefficient * factor
        if new:
            target[power] = new
        else:
            target.pop(power, None)


def accumulate_matrix(target, scalar, matrix, *, guard=lambda: None):
    G.require(
        V.matrix_shape(target) == V.matrix_shape(matrix), "matching accumulator shapes"
    )
    for i, row in enumerate(matrix):
        guard()
        for j, poly in enumerate(row):
            V.add_product(target[i][j], scalar, poly)


def independent_product(left, right, *, guard=lambda: None, check=None):
    check = guard if check is None else check
    rows, inner = V.matrix_shape(left)
    other, columns = V.matrix_shape(right)
    G.require(inner == other, "compatible exact product shapes")
    guard()
    a = [[_normalize(poly) for poly in row] for row in left]
    b = [
        [(j, *_normalize(poly)) for j, poly in enumerate(row) if poly] for row in right
    ]
    result = [[{} for _ in range(columns)] for _ in range(rows)]
    cache = ProductCache(check)
    for i, row in enumerate(a):
        guard()
        for k, (scalar, key) in enumerate(row):
            if scalar:
                for j, other_scalar, other_key in b[k]:
                    _add_scaled(
                        result[i][j],
                        cache.product(key, other_key),
                        scalar * other_scalar,
                    )
    guard()
    return result


def independent_gram(matrix, diagonal, *, guard=lambda: None, check=None):
    """Exact row-wise Gram; equal polynomial diagonal factors are grouped."""
    check = guard if check is None else check
    rows, columns = V.matrix_shape(matrix)
    G.require(
        type(diagonal) is list and len(diagonal) == rows,
        "complete polynomial Gram diagonal",
    )
    guard()
    normalized = [
        [(j, *_normalize(poly)) for j, poly in enumerate(row) if poly] for row in matrix
    ]
    groups = {}
    for i, poly in enumerate(diagonal):
        coefficient, key = _normalize(poly)
        if coefficient:
            groups.setdefault(key, []).append((i, coefficient))
    result = [[{} for _ in range(columns)] for _ in range(columns)]
    if not any(normalized):
        guard()
        return result
    cache = ProductCache(check)
    for diagonal_key, indices in groups.items():
        partial = [[{} for _ in range(columns)] for _ in range(columns)]
        for i, weight in indices:
            guard()
            support = normalized[i]
            for offset, (j, s, a) in enumerate(support):
                for k, t, b in support[offset:]:
                    _add_scaled(partial[j][k], cache.product(a, b), weight * s * t)
        for j in range(columns):
            guard()
            for k in range(j, columns):
                V.add_product(result[j][k], dict(diagonal_key), partial[j][k])
    for j in range(columns):
        for k in range(j):
            result[j][k] = dict(result[k][j])
    guard()
    return result


def coefficient_bound(matrix, *, lower=F(5, 6)):
    G.require(
        type(lower) is F and lower == F(5, 6), "registered exact metric lower bound"
    )
    rows, columns = V.matrix_shape(matrix)
    G.require(rows == columns, "square coefficient bound matrix")
    entries, total = [], F(0)
    for i, row in enumerate(matrix):
        for j, poly in enumerate(row):
            V.encode_polynomial(poly)
            bound = sum(map(abs, poly.values()), F(0))
            total += bound
            entries.append([i, j, str(bound)])
    upper = total / lower**6
    return dict(
        schema="nr-case12-energy-coefficient-bound-v1",
        shape=[rows, columns],
        entries=entries,
        total=str(total),
        g_lower=str(lower),
        denominator_power=6,
        upper=str(upper),
        lower_energy="1/14",
        method="entrywise coefficient l1 / g_lower^6",
        consistent_lower_upper=upper >= F(1, 14),
    )


def domain_metadata():
    return dict(
        schema="nr-case12-energy-domain-v1",
        real_domain="v!=0",
        unit_sphere="r=1",
        g_lower="5/6",
        weights=list(map(str, WEIGHTS)),
        constants=list(map(str, CONSTANTS)),
        denominators=["r", "g"],
        smooth_on_real_domain=True,
        claim=PRINCIPAL_SCOPE,
    )


def replay(directory, budget, *, stage=lambda *args, **kwargs: None):
    hashes = {}

    def load(name):
        budget.guard()
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
        "qualified compressed input bytes",
    )
    ancestor_gate()
    ancestor = {name: load("ancestor-inputs/" + name) for name in ANCESTOR_INPUTS}
    G.require(
        all(
            hashes["ancestor-inputs/" + name] == digest
            for name, (_, digest) in ANCESTOR_INPUTS.items()
        ),
        "qualified ancestor X/Pt bytes",
    )
    domain = foundation().verify_domain(parent[DOMAIN_PATH], parent[DENOMINATORS_PATH])
    domain.pop("delta")
    r = V.decode_polynomial(parent["scalars.json"]["r"], max_degree=2)
    g = V.decode_polynomial(parent["scalars.json"]["g"], max_degree=2)
    G.require(
        all(
            V.decode_polynomial(parent[DENOMINATORS_PATH][name], max_degree=2) == value
            for name, value in (("r", r), ("g", g))
        ),
        "source r/g identities",
    )
    Dbar, etabar = poly_mul(r, g, g, g), poly_mul(r, g, g)
    taubar = poly_mul(r, Dbar, Dbar)
    scalars = dict(r=r, g=g, Dbar=Dbar, etabar=etabar, taubar=taubar)
    saved_scalars = load("scalars.json")
    G.require(
        set(saved_scalars) == set(scalars)
        and all(
            V.decode_polynomial(saved_scalars[name], max_degree=18) == value
            and V.decode_polynomial(parent["scalars.json"][name], max_degree=18)
            == value
            for name, value in scalars.items()
        ),
        "unchanged compressed energy denominators",
    )
    n = {
        name: V.decode_matrix(
            parent[name + "_quotient.json"],
            shape=(43, 43),
            max_degree=9 if name.startswith("N") else 8,
        )
        for name in COMPONENTS
    }
    x = V.decode_matrix(ancestor["X.json"], shape=(43, 43), max_degree=4)
    pt = V.decode_matrix(ancestor["Pt.json"], shape=(43, 43), max_degree=2)
    one, minus = {(0, 0, 0): F(1)}, {(0, 0, 0): F(-1)}
    diagonal = [one.copy() if i in (0, 1, 2, 3, 41) else dict(r) for i in range(43)]
    identity = [[dict(one) if i == j else {} for j in range(43)] for i in range(43)]
    metric = [
        [dict(diagonal[i]) if i == j else {} for j in range(43)] for i in range(43)
    ]
    matrices, stats = {}, {}

    def check(name, value):
        saved = V.decode_matrix(
            load(name + ".json"), shape=(43, 43), max_degree=MATRIX_CAPS[name]
        )
        G.require(saved == value, "independent full energy stage " + name)
        matrices[name] = value
        stats[name] = matrix_stats(value, MATRIX_CAPS[name])
        stage("replay-" + name + "-complete", terms=stats[name]["terms"])

    check("Gt", metric)
    for name, weight in zip(NAMES, WEIGHTS, strict=True):
        check(
            "F_" + name,
            combination(
                ((one, n[name]), (poly_scale(Dbar, -1 / (14 * weight)), identity)),
                budget,
            ),
        )
    hbar = [[{} for _ in range(43)] for _ in range(43)]
    cgram = [[{} for _ in range(43)] for _ in range(43)]

    def gram(value):
        return independent_gram(
            value, diagonal, guard=budget.guard, check=budget._check_deadline
        )

    for name, weight in zip(NAMES, WEIGHTS, strict=True):
        scalar = {(0, 0, 0): weight}
        accumulate_matrix(hbar, scalar, gram(n[name]), guard=budget.guard)
        accumulate_matrix(
            cgram, scalar, gram(matrices["F_" + name]), guard=budget.guard
        )
        stage("replay-Grams-" + name + "-complete")
    for j, c in enumerate(CONSTANTS, 1):
        scalar = poly_scale(g, 1 / (2 * c))
        term = gram(n["M" + str(j)])
        accumulate_matrix(hbar, scalar, term, guard=budget.guard)
        accumulate_matrix(cgram, scalar, term, guard=budget.guard)
        stage("replay-action-Gram-" + str(j) + "-complete")
    check("Hbar", hbar)
    check("Cgram", cgram)
    symmetry = combination(((one, hbar), (minus, transpose(hbar))), budget)
    check("Hsym", symmetry)

    def product(a, b):
        return independent_product(
            a, b, guard=budget.guard, check=budget._check_deadline
        )

    # Replay evaluates both sides directly; no assumption that Hsym vanishes.
    for name, operator in (("HL", x), ("HP", pt)):
        check(
            name,
            combination(
                (
                    (one, product(hbar, operator)),
                    (minus, product(transpose(operator), hbar)),
                ),
                budget,
            ),
        )
    check(
        "Gram",
        combination(
            (
                (one, hbar),
                (poly_scale(poly_mul(Dbar, Dbar), F(-1, 14)), metric),
                (minus, cgram),
            ),
            budget,
        ),
    )
    G.require(stats == load("stats.json"), "full energy coefficient statistics")
    bound = coefficient_bound(hbar)
    G.require(bound == load("bounds.json"), "actual rational uniform upper bound")
    G.require(
        domain_metadata() == load("domain_metadata.json"),
        "fixed real smooth domain and positive weights",
    )

    def zero(matrix):
        return not any(poly for row in matrix for poly in row)

    acceptance = dict(
        energy_symmetry=zero(matrices["Hsym"]),
        intrinsic_symmetrization=zero(matrices["HL"]),
        pde_symmetrization=zero(matrices["HP"]),
        gram_identity=zero(matrices["Gram"]),
        uniform_bounds=bound["consistent_lower_upper"],
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        acceptance == load("acceptance.json"), "independent exact energy acceptance"
    )
    delta = [[{} for _ in range(43)] for _ in range(43)]
    delta[0][1] = dict(one)
    mutant = combination(((one, hbar), (one, delta)), budget)
    defect = combination(((one, mutant), (minus, transpose(mutant))), budget)
    for name, value in (("delta_Hbar", delta), ("mutant_Hsym", defect)):
        G.require(
            V.decode_matrix(
                load(name + ".json"), shape=(43, 43), max_degree=MUTATION_CAPS[name]
            )
            == value,
            "actual reconstructed energy mutation",
        )
    nonzero = sum(bool(poly) for row in defect for poly in row)
    terms = V.coefficient_count(defect)
    mutation = dict(
        schema="nr-case12-energy-mutation-v1",
        name="add-one-to-Hbar-01",
        entry=[0, 1],
        nonzero_slots=nonzero,
        coefficients=terms,
        rejected=nonzero > 0,
    )
    G.require(mutation == load("mutation.json"), "independent mutation decision")
    return dict(
        schema="nr-case12-independent-polynomial-energy-replay-v1",
        passed=acceptance["accepted"] and mutation["rejected"],
        acceptance=acceptance,
        matrix_slots=27735,
        residual_slots=7396,
        mutation_nonzero_slots=nonzero,
        mutation_coefficients=terms,
        mutation_rejected=mutation["rejected"],
        fixed_domain=domain,
        domain_metadata=domain_metadata(),
        uniform_upper=bound["upper"],
        uniform_lower="1/14",
        parent_gate_sha256=PARENT_GATE,
        ancestor_gate_sha256=ANCESTOR_GATE,
        input_hashes=hashes,
        library="stdlib Fraction normalized sparse convolution; independent Fi Gram reconstruction",
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
        principal_scope=PRINCIPAL_SCOPE,
        full58_principal_energy_validated=False,
        direction_uniform_energy_validated=False,
        uniform_strong_hyperbolicity_validated=False,
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
        result["snapshot_bytes"] = foundation().snapshot(budget, table)
        gate = parent_gate()
        for name in PARENT_INPUTS:
            raw = (PARENT / name).read_bytes()
            G.require(
                G.hashlib.sha256(raw).hexdigest() == gate["artifact_hashes"][name],
                "parent input identity",
            )
            budget.save("parent-inputs/" + name, raw)
        ancestor_gate()
        for name, (source, digest) in ANCESTOR_INPUTS.items():
            raw = (ANCESTOR / source).read_bytes()
            G.require(
                G.hashlib.sha256(raw).hexdigest() == digest, "ancestor input identity"
            )
            budget.save("ancestor-inputs/" + name, raw)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_polynomial_energy as P
        import nr_case12_polynomial_section as S

        stage("energy-construction-start")

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
            "domain_metadata",
            "bounds",
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
            foundation().dependencies(budget),
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
            "registered energy candidate failed; complete residual evidence retained",
        )
        result.update(
            passed=True,
            completed=True,
            direction_uniform_energy_validated=True,
            uniform_strong_hyperbolicity_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            direction_uniform_energy_validated=False,
            uniform_strong_hyperbolicity_validated=False,
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
        is result["direction_uniform_energy_validated"]
        is result["uniform_strong_hyperbolicity_validated"]
        is True
        and not result["errors"],
        "complete energy candidate",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["case_indices"] == [12]
        and result["principal_scope"] == PRINCIPAL_SCOPE
        and result["full58_principal_energy_validated"] is False
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-zero-only"
        and result["parent_gate_sha256"] == PARENT_GATE,
        "fixed energy scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    import nr_case12_polynomial_energy as P

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
        report["schema"] == "nr-case12-independent-polynomial-energy-replay-v1"
        and report["matrix_slots"] == 27735
        and report["parent_gate_sha256"] == PARENT_GATE,
        "complete registered energy replay",
    )
    G.require(
        set(report["acceptance"]) == ACCEPTANCE_KEYS
        and all(value is True for value in report["acceptance"].values())
        and report["residual_slots"] == 7396
        and report["domain_metadata"] == domain_metadata()
        and report["ancestor_gate_sha256"] == ANCESTOR_GATE
        and report["uniform_lower"] == "1/14"
        and report["uniform_upper"] == read(directory / "bounds.json")["upper"]
        and report["mutation_nonzero_slots"] > 0
        and report["mutation_coefficients"] > 0
        and report["mutation_rejected"] is True
        and report["library"]
        == "stdlib Fraction normalized sparse convolution; independent Fi Gram reconstruction",
        "complete energy and actual nondivisible witness",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update("ancestor-inputs/" + name for name in ANCESTOR_INPUTS)
    expected.update(name + ".json" for name in {**MATRIX_CAPS, **MUTATION_CAPS})
    expected.update(
        (
            "stats.json",
            "scalars.json",
            "acceptance.json",
            "domain_metadata.json",
            "bounds.json",
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

"""One owned fixed-case12 all-real-direction right-section certificate batch."""

from __future__ import annotations

import argparse
import ast
from collections import Counter
from fractions import Fraction as F
import importlib.metadata
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

METHOD = "nr-case12-polynomial-section-controls-v1"
PREVIOUS = G.EVIDENCE / "nr-k3-case12-direction-section-controls-v2-20261014"
PREVIOUS_GATE_SHA = "161f8bfbe6bbad1a0842399238aa280bcdc412b24447e8291bafadbf0085a292"
PREVIOUS_TREE_SHA = "c9176c3198d590a5bd77af516afb0ac2f25a5511dd92f2a64ce45acb0c95a37b"
HELPER = "scripts/run-nr-k3-case12-direction-section-v2.py"
HELPER_SHA = "e3b9489394367dd1e05e6b6781d7d7ee344600c2bb8d1d6368771f18073ece8e"
EXTRA = (
    "scripts/nr_case12_polynomial_section.py",
    "scripts/nr_polynomial_certificate_replay.py",
    "scripts/tests/test_nr_case12_polynomial_section.py",
    "scripts/run-nr-k3-case12-polynomial-section.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-section.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-section.md",
    "science/numerical_relativity/RESULTS-20261014-case12-direction-section-v2.md",
)
MUTATIONS = (
    "metric-base-factor-two",
    "hamiltonian-factor-four",
    "gamma-factor-two",
    "momentum-trace-sign",
)
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "all_direction_closure_validated",
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
    path = ROOT / HELPER
    G.require(G.sha(path) == HELPER_SHA, "immutable v2 provenance helper required")
    spec = importlib.util.spec_from_file_location("nr_polynomial_history_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def prior_failure():
    G.require(
        G.sha(PREVIOUS / "qualification-gate.json") == PREVIOUS_GATE_SHA,
        "v2 failure terminal changed",
    )
    gate = G.read_terminal(PREVIOUS / "qualification-gate.json")
    G.require(
        gate["passed"] is gate["completed"] is False
        and gate["errors"] == ["ResourceLimit: registered control deadline reached"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "unchanged v2 timeout required",
    )
    return gate


def sources(budget):
    prior_failure()
    table = helper().sources(budget)
    G.require(
        len(table) == 573
        and table == G.inventory(PREVIOUS / "source-snapshot", "", budget),
        "573-source failed-v2 snapshot closure required",
    )
    G.require(
        not set(table).intersection(EXTRA), "new certificate sources must be additive"
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 580, "complete580 source contract")
    return table


def history(budget):
    prior_failure()
    table = helper().ancestry(None, None, budget)
    previous = G.inventory(PREVIOUS, "", budget)
    G.require(
        len(previous) == 1129
        and G.hashlib.sha256(G.encoded(previous)).hexdigest() == PREVIOUS_TREE_SHA,
        "retained failed-v2 prefix changed",
    )
    table[PREVIOUS.name] = previous
    G.require(
        len(table) == 12 and sum(map(len, table.values())) == 8716,
        "twelve historical trees required",
    )
    return table


def snapshot(budget, table):
    total = sum(G.contained(ROOT, name).stat().st_size for name in table)
    G.require(total <= 8 * 1024**2, "8MiB source snapshot cap")
    for name, digest in table.items():
        raw = G.contained(ROOT, name).read_bytes()
        G.require(
            G.hashlib.sha256(raw).hexdigest() == digest,
            "source changed during snapshot",
        )
        budget.save("source-snapshot/" + name, raw)
    return total


def registered_tests():
    tree = ast.parse((ROOT / EXTRA[2]).read_text(encoding="utf-8"))
    tests = {}
    for node in tree.body:
        if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
            continue
        count = 1
        for decorator in node.decorator_list:
            G.require(
                isinstance(decorator, ast.Call)
                and ast.unparse(decorator.func) == "pytest.mark.parametrize"
                and len(decorator.args) == 2
                and isinstance(decorator.args[1], (ast.List, ast.Tuple))
                and not decorator.keywords,
                "explicit control parameter registration",
            )
            count *= len(decorator.args[1].elts)
        G.require(node.name not in tests and count > 0, "unique controls")
        tests[node.name] = count
    G.require(
        len(tests) == 28 and sum(tests.values()) == 55,
        "exact registered 28 functions and 55 controls",
    )
    return tests


def test_evidence(path):
    xml = ET.parse(path).getroot()
    cases = list(xml.iter("testcase"))
    identities = [[item.get("classname"), item.get("name")] for item in cases]
    expected = registered_tests()
    G.require(
        len(identities) == len({tuple(item) for item in identities})
        and dict(Counter(item.get("name", "").split("[", 1)[0] for item in cases))
        == expected
        and not any(list(xml.iter(tag)) for tag in ("error", "failure", "skipped")),
        "exact complete tests without failures or skips",
    )
    return dict(
        tests=len(cases),
        errors=0,
        failures=0,
        skipped=0,
        identities=identities,
        registered=expected,
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
        str(ROOT / EXTRA[2]),
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
        G.require(child.returncode == 0, "unit controls failed; no automatic retry")
    evidence = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", evidence)
    return evidence


def dependencies(budget):
    versions = {
        name: importlib.metadata.version(name)
        for name in ("sympy", "numpy", "pytest", "mpmath")
    }
    G.require(
        versions["sympy"] == "1.13.3" and versions["numpy"] == "2.2.6",
        "registered exact arithmetic environment",
    )
    paths = {str(Path(sys.executable).resolve())}
    for name, module in list(sys.modules.items()):
        if name.split(".", 1)[0] in {"sympy", "numpy", "mpmath"} and getattr(
            module, "__file__", None
        ):
            paths.add(str(Path(module.__file__).resolve()))
    hashes = {}
    for index, name in enumerate(sorted(paths)):
        if index % 32 == 0:
            budget.guard()
        hashes[name] = G.sha(name)
    return dict(
        python=sys.version,
        versions=versions,
        loaded_runtime_file_hashes=hashes,
        scope="Python executable and loaded numerical-module files; not every operating-system DLL",
    )


def scalar(value):
    G.require(type(value) is str, "exact rational string required")
    number = F(value)
    G.require(str(number) == value, "canonical rational scalar")
    return number


def helper_manifest(source_bytes):
    """Reconstruct the unchanged helper manifest without executing source ASTs."""
    profile = "scripts/nr_profile_exact_coefficients.py"
    leading = "scripts/nr_constraint_exact_coefficients.py"
    result = []
    for name, names in (
        (profile, ("rational", "determinant", "inverse", "Background", "case12")),
        (leading, ("zeros",)),
    ):
        tree = ast.parse(source_bytes[name].decode("utf-8"))
        nodes = [
            node
            for node in tree.body
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names
        ]
        G.require(
            tuple(node.name for node in nodes) == names,
            "exact unchanged helper definitions",
        )
        text = ast.dump(
            ast.Module(body=nodes, type_ignores=[]),
            annotate_fields=True,
            include_attributes=False,
        )
        row = dict(
            source=name,
            source_sha256=G.hashlib.sha256(source_bytes[name]).hexdigest(),
            functions=list(names),
            ast_sha256=G.hashlib.sha256(text.encode()).hexdigest(),
            edits=[],
        )
        if name == profile:
            assignments = {
                node.targets[0].id: node
                for node in tree.body
                if isinstance(node, ast.Assign)
                and isinstance(node.targets[0], ast.Name)
            }
            row["pairs"] = [
                list(pair) for pair in ast.literal_eval(assignments["PAIRS"].value)
            ]
            row["pair_index_ast"] = ast.dump(
                assignments["PAIR_INDEX"],
                annotate_fields=True,
                include_attributes=False,
            )
        result.append(row)
    return result


def verify_domain(record, polynomials):
    G.require(
        record["schema"] == "nr-case12-polynomial-domain-v1"
        and record["domain"] == "fixed case12 constants; real (x,y,z) != (0,0,0)"
        and record["zero_frequency_admitted"] is False,
        "fixed nonzero-real domain",
    )
    matrices = {}
    for name in ("lower", "metric", "inverse"):
        raw = record[name]
        G.require(
            type(raw) is list
            and len(raw) == 3
            and all(type(row) is list and len(row) == 3 for row in raw),
            "domain matrix dimensions",
        )
        matrices[name] = [[scalar(value) for value in row] for row in raw]
    lower, h, u = (matrices[name] for name in ("lower", "metric", "inverse"))
    G.require(
        lower
        == [[F(1), F(0), F(0)], [F(3, 25), F(1), F(0)], [F(-2, 25), F(3, 50), F(1)]],
        "fixed unit-triangular factor",
    )
    G.require(
        h
        == [
            [sum(lower[i][k] * lower[j][k] for k in range(3)) for j in range(3)]
            for i in range(3)
        ]
        and all(
            sum(h[i][k] * u[k][j] for k in range(3)) == F(i == j)
            for i in range(3)
            for j in range(3)
        ),
        "independent exact SPD factor and inverse identities",
    )
    G.require(
        record["alpha"] == "17/20"
        and record["chi"] == "18/25"
        and record["shift"] == ["3/100", "-1/25", "1/20"],
        "fixed physical constants",
    )
    h_bound = max(sum(abs(x) for x in row) for row in h)
    u_bound = max(sum(abs(x) for x in row) for row in u)
    G.require(
        h_bound == scalar(record["h_norm_upper"]) == F(6, 5)
        and u_bound == scalar(record["u_norm_upper"]) == F(964403, 781250)
        and scalar(record["g_over_r_lower"]) == 1 / h_bound == F(5, 6)
        and scalar(record["section_denominator_over_r_cubed_lower"])
        == scalar(record["residual_denominator_over_r_fourth_lower"])
        == scalar(record["chi"]) / h_bound**2
        == F(1, 2),
        "independent rational norm and denominator floor",
    )
    basis = [
        {tuple(1 if i == axis else 0 for i in range(3)): F(1)} for axis in range(3)
    ]
    r, g = {}, {}
    for i in range(3):
        V.add_product(r, basis[i], basis[i])
        for j in range(3):
            V.add_product(g, basis[i], basis[j], factor=u[i][j])
    gg, denominator, delta = {}, {}, {}
    V.add_product(gg, g, g)
    V.add_product(denominator, r, gg, factor=scalar(record["chi"]))
    V.add_product(delta, r, denominator)
    expected = dict(r=r, g=g, section_denominator=denominator, delta=delta)
    caps = dict(r=2, g=2, section_denominator=6, delta=8)
    G.require(
        set(polynomials) == set(expected), "complete denominator polynomial contract"
    )
    G.require(
        all(
            V.decode_polynomial(polynomials[name], max_degree=caps[name]) == value
            for name, value in expected.items()
        ),
        "independent denominator construction differs",
    )
    return dict(
        fixed_metric_spd=True,
        exact_inverse=True,
        source_denominators_reconstructed=True,
        real_domain="v!=0",
        unit_sphere_section_denominator_lower="1/2",
        delta=delta,
    )


def replay(directory, budget):
    input_hashes = {}

    def load(name):
        raw = G.contained(directory, name).read_bytes()
        input_hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    denominators = load("denominators.json")
    domain = verify_domain(load("domain.json"), denominators)
    d = V.decode_matrix(load("Dtilde.json"), shape=(43, 58), max_degree=3)
    s = V.decode_matrix(load("Stilde.json"), shape=(58, 43), max_degree=6)
    stored = V.decode_matrix(load("residual.json"), shape=(43, 43), max_degree=9)
    computed = V.residual(d, s, domain.pop("delta"), guard=budget.guard)
    G.require(
        computed == stored, "independent polynomial product differs from saved residual"
    )
    checked = V.zero_check(computed, (43, 43))
    stats = {}
    for name, matrix, cap in (("Dtilde", d, 3), ("Stilde", s, 6)):
        rows, columns = V.matrix_shape(matrix)
        stats[name] = dict(
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
    stats["residual"] = dict(
        slots_checked=checked, nonzero_slots=0, coefficientwise_zero=True
    )
    G.require(
        stats == load("stats.json"),
        "independently reconstructed matrix statistics differ",
    )
    negative_summary = []
    expected_metadata = {
        "metric-base-factor-two": (20, [0], F(-1, 2)),
        "hamiltonian-factor-four": (0, [55, 56, 57], F(-1, 2)),
        "gamma-factor-two": (5, [19, 20, 21], F(-1, 2)),
        "momentum-trace-sign": (42, [17], F(-2)),
    }
    for name in MUTATIONS:
        metadata = load(f"mutations/{name}-metadata.json")
        column, rows, factor = expected_metadata[name]
        G.require(
            metadata["name"] == name
            and metadata["constraint_column"] == column
            and metadata["changed_state_rows"] == rows,
            "registered physical-factor mutation",
        )
        change = V.decode_matrix(
            load(f"mutations/{name}-change.json"),
            shape=(58, 1),
            max_degree=6,
        )
        expected = [
            [
                {powers: value * factor for powers, value in s[i][column].items()}
                if i in rows
                else {}
            ]
            for i in range(58)
        ]
        G.require(
            change == expected, "saved mutation is not the registered perturbation"
        )
        saved = V.decode_matrix(
            load(f"mutations/{name}-residual.json"),
            shape=(43, 1),
            max_degree=9,
        )
        answer = V.multiply(d, change, guard=budget.guard)
        nonzero = sum(bool(poly) for row in answer for poly in row)
        G.require(
            answer == saved and nonzero == metadata["nonzero_slots"] > 0,
            "independent nonzero mutation witness required",
        )
        negative_summary.append(
            dict(
                name=name,
                nonzero_slots=nonzero,
                coefficients=V.coefficient_count(answer),
            )
        )
    return dict(
        schema="nr-case12-independent-polynomial-replay-v1",
        passed=True,
        all_real_section_formula_checked=True,
        residual_slots=checked,
        residual_coefficients=0,
        mutation_witnesses=negative_summary,
        domain=domain,
        library="stdlib Fraction sparse convolution; no SymPy or direction sampling",
        input_hashes=input_hashes,
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
        "single-thread contract",
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
        all_real_section_formula_checked=False,
        previous_timeout_sha256=PREVIOUS_GATE_SHA,
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        coefficient_acceptance="exact-zero-only",
        guard_implementation="nr_single_scan_control.SingleScanBudget",
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
        result["snapshot_bytes"] = snapshot(budget, table)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_polynomial_section as P

        G.require(P.MUTATIONS == MUTATIONS, "registered exact factor perturbations")
        stage("polynomial-construction-start")
        certificate = P.build_certificate(guard=budget.guard)
        stage(
            "polynomial-construction-complete",
            slots=certificate["stats"]["residual"]["slots_checked"],
        )
        G.require(
            certificate["full_python_semantics_proved"]
            is certificate["subsidiary_closure_proved"]
            is certificate["direction_uniform_energy_proved"]
            is False,
            "right-section theorem only",
        )
        for name in ("Dtilde", "Stilde", "residual"):
            budget.record(
                name + ".json", P.encode_matrix(certificate[name], guard=budget.guard)
            )
        budget.record(
            "denominators.json",
            {
                name: P.canonical_polynomial(certificate[name])
                for name in ("r", "g", "section_denominator", "delta")
            },
        )
        for name in ("domain", "translation", "helper_bindings", "stats"):
            budget.record(name + ".json", certificate[name])
        result["theorem"] = certificate["theorem"]
        for name in MUTATIONS:
            witness = P.mutation_witness(certificate, name, guard=budget.guard)
            for key, suffix in (("delta_section", "change"), ("residual", "residual")):
                budget.record(
                    f"mutations/{name}-{suffix}.json",
                    P.encode_matrix(witness[key], guard=budget.guard),
                )
            budget.record(
                f"mutations/{name}-metadata.json",
                {
                    k: v
                    for k, v in witness.items()
                    if k not in ("delta_section", "residual")
                },
            )
        stage("certificate-and-mutations-saved")
        result["replay"] = replay(directory, budget)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", residual_slots=1849, exact_mutations=4)
        budget.record("dependencies.json", dependencies(budget))
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
            all_real_section_formula_checked=True,
            source_after=table,
            old_artifacts_unchanged=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False, completed=False, all_real_section_formula_checked=False
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
        is result["all_real_section_formula_checked"]
        is True
        and not result["errors"],
        "complete formula certificate required",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["case_indices"] == [12]
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-zero-only",
        "fixed case12 exact section scope",
    )
    G.require(
        result["previous_timeout_sha256"] == PREVIOUS_GATE_SHA
        and result["guard_implementation"] == "nr_single_scan_control.SingleScanBudget",
        "prior failure and guard identity",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved test evidence differs",
    )
    import nr_case12_polynomial_section as P

    translation = [
        P.translated_ast(raw, name)[1]
        for name, raw in P.verify_sources().items()
        if name in (P.SECTION_SOURCE, P.LEADING_SOURCE)
    ]
    G.require(
        translation == read(directory / "translation.json"),
        "exact source adaptation manifest mismatch",
    )
    G.require(
        helper_manifest(P.verify_sources()) == read(directory / "helper_bindings.json"),
        "unchanged helper AST bindings differ",
    )
    G.require(
        result["theorem"]
        == "fixed-case12 rational formula extension: Dhat(v) S(v)=I43 for all real v!=0",
        "registered formula theorem statement",
    )
    report = read(directory / "independent-replay.json")
    G.require(
        report == result["replay"]
        and report["passed"] is True
        and report["all_real_section_formula_checked"] is True
        and report["residual_slots"] == 1849
        and report["residual_coefficients"] == 0
        and report["schema"] == "nr-case12-independent-polynomial-replay-v1"
        and report["library"]
        == "stdlib Fraction sparse convolution; no SymPy or direction sampling",
        "complete owned independent replay report required",
    )
    G.require(
        [row["name"] for row in report["mutation_witnesses"]] == list(MUTATIONS)
        and all(
            type(row["nonzero_slots"]) is int
            and row["nonzero_slots"] > 0
            and type(row["coefficients"]) is int
            and row["coefficients"] > 0
            for row in report["mutation_witnesses"]
        ),
        "four distinct exact witnesses required",
    )
    expected_inputs = {
        "Dtilde.json",
        "Stilde.json",
        "residual.json",
        "stats.json",
        "domain.json",
        "denominators.json",
    }
    expected_inputs.update(
        f"mutations/{name}-{kind}.json"
        for name in MUTATIONS
        for kind in ("change", "residual", "metadata")
    )
    G.require(
        set(report["input_hashes"]) == expected_inputs,
        "complete replay input byte bindings",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest,
            "independently replayed bytes changed",
        )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "dependency version contract",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "recorded loaded dependency changed")
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
        "original supervisor unchanged",
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

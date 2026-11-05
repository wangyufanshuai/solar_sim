"""One owned fixed-case12 fixed-factor numerator compression certificate batch."""

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

METHOD = "nr-case12-polynomial-compression-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-projectors-controls-v1-20261014"
PARENT_GATE = "a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1"
PARENT_WORKER = "7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9"
HELPER = "scripts/run-nr-k3-case12-polynomial-projectors.py"
HELPER_SHA = "91504a4d28138884459f5d649935421129aea5e9643a9adcbe3d585b89ffbca6"
EXTRA = (
    "scripts/nr_case12_polynomial_compression.py",
    "scripts/tests/test_nr_case12_polynomial_compression.py",
    "scripts/run-nr-k3-case12-polynomial-compression.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-polynomial-compression.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-compression.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-projectors.md",
)
COMPONENTS = (
    "NO",
    "N0",
    *[f"N{j}" for j in range(1, 7)],
    *[f"M{j}" for j in range(1, 7)],
)
DOMAIN_PATH = "parent-inputs/parent-inputs/parent-inputs/parent-inputs/domain.json"
DENOMINATORS_PATH = DOMAIN_PATH.replace("domain.json", "denominators.json")
PARENT_INPUTS = tuple(name + ".json" for name in COMPONENTS) + (
    "scalars.json",
    DOMAIN_PATH,
    DENOMINATORS_PATH,
)
MATRIX_CAPS = {
    name + "_" + kind: (9 if name.startswith("N") else 8)
    if kind == "quotient"
    else (19 if name.startswith("N") else 16)
    for name in COMPONENTS
    for kind in ("quotient", "remainder", "multiplyback")
}
MUTATION_CAPS = {
    "mutation_N1_" + kind: 9 if kind == "quotient" else 19
    for kind in ("quotient", "remainder", "multiplyback")
}
ACCEPTANCE_KEYS = {
    "division_identity",
    "remainder_zero",
    "multiplyback_zero",
    "remainder_normal_form",
    "accepted",
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
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen projectors runner required")
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
        is gate["projector_family_validated"]
        is gate["action_family_validated"]
        is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete projectors parent required",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 604
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "unchanged parent source closure",
    )
    G.require(not set(table).intersection(EXTRA), "additive compression sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 610, "610-source compression contract")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"])
    expected["qualification-gate.json"] = PARENT_GATE
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 705,
        "complete qualified parent artifacts",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 17 and sum(map(len, table.values())) == 11943,
        "seventeen immutable historical trees",
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
        len(tests) == 27 and sum(tests.values()) == 75,
        "frozen compression controls",
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
            child.returncode == 0, "compression controls failed; no automatic retry"
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


def foundation():
    module = helper()
    for _ in range(4):
        module = module.helper()
    return module


def poly_mul(*values):
    result = {(0, 0, 0): F(1)}
    for value in values:
        out = {}
        V.add_product(out, result, value)
        result = out
    return result


def poly_divide(value, divisor, *, guard=lambda: None):
    """Independent single-divisor QQ[x,y,z] lex division, including failures."""
    V.encode_polynomial(value)
    V.encode_polynomial(divisor)
    G.require(bool(divisor), "nonzero divisor")
    guard()
    working, quotient, remainder = dict(value), {}, {}
    leading = max(divisor)
    coefficient = divisor[leading]
    steps = 0
    while working:
        if steps % 32 == 0:
            guard()
        power = max(working)
        if all(a >= b for a, b in zip(power, leading, strict=True)):
            exponent = tuple(a - b for a, b in zip(power, leading, strict=True))
            scalar = working[power] / coefficient
            quotient[exponent] = quotient.get(exponent, F(0)) + scalar
            if not quotient[exponent]:
                del quotient[exponent]
            V.add_product(working, {exponent: scalar}, divisor, factor=F(-1))
        else:
            remainder[power] = working.pop(power)
        steps += 1
    guard()
    return quotient, remainder


def verify_division(
    original,
    factor,
    quotient,
    remainder,
    multiplyback,
    *,
    guard=lambda: None,
    check=None,
):
    # No files are written during a cell division. Preserve a fresh full guard
    # for every row and use the same deadline for bounded inner arithmetic.
    check = guard if check is None else check
    shape = V.matrix_shape(original)
    G.require(
        all(
            V.matrix_shape(matrix) == shape
            for matrix in (quotient, remainder, multiplyback)
        ),
        "complete same-shape division matrices",
    )
    V.encode_polynomial(factor)
    G.require(bool(factor), "nonzero divisor")
    leading = max(factor)
    normal = True
    for i, row in enumerate(original):
        guard()
        for j, value in enumerate(row):
            for saved in (quotient[i][j], remainder[i][j], multiplyback[i][j]):
                V.encode_polynomial(saved)
            q, rem = poly_divide(value, factor, guard=check)
            G.require(
                q == quotient[i][j] and rem == remainder[i][j],
                "independent lex quotient and remainder",
            )
            back = dict(value)
            V.add_product(back, factor, q, factor=F(-1))
            G.require(back == multiplyback[i][j], "independent multiplication residual")
            identity = dict(back)
            V.add_product(identity, rem, {(0, 0, 0): F(-1)})
            G.require(not identity, "exact division identity")
            normal = normal and all(
                not all(a >= b for a, b in zip(power, leading, strict=True))
                for power in rem
            )
    zero_rem = not any(poly for row in remainder for poly in row)
    zero_back = not any(poly for row in multiplyback for poly in row)
    c = factor[leading]
    return dict(
        division_identity_zero=True,
        remainder_zero=zero_rem,
        multiplyback_zero=zero_back,
        normal_form_verified=normal,
        accepted=zero_rem and zero_back and normal,
        divisor_leading_exponent=list(leading),
        divisor_leading_coefficient=[str(c.numerator), str(c.denominator)],
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
        "qualified projectors input bytes",
    )
    polys = parent[DENOMINATORS_PATH]
    domain = foundation().verify_domain(parent[DOMAIN_PATH], polys)
    domain.pop("delta")
    r = V.decode_polynomial(polys["r"], max_degree=2)
    g = V.decode_polynomial(polys["g"], max_degree=2)
    G.require(
        all(
            V.decode_polynomial(parent["scalars.json"][name], max_degree=2) == value
            for name, value in (("r", r), ("g", g))
        ),
        "source direction scalars",
    )
    factor_n, factor_m = poly_mul(*([r] * 5)), poly_mul(*([r] * 4))
    expected_scalars = dict(
        r=r,
        g=g,
        factor_N=factor_n,
        factor_M=factor_m,
        Dbar=poly_mul(r, g, g, g),
        etabar=poly_mul(r, g, g),
        taubar=poly_mul(r, r, r, g, g, g, g, g, g),
    )
    scalars = load("scalars.json")
    G.require(
        set(scalars) == set(expected_scalars)
        and all(
            V.decode_polynomial(scalars[name], max_degree=18) == value
            for name, value in expected_scalars.items()
        ),
        "all original and compressed denominators",
    )
    # Bind the exact original denominators as well, not merely their names.
    G.require(
        V.decode_polynomial(parent["scalars.json"]["D"], max_degree=18)
        == poly_mul(factor_n, expected_scalars["Dbar"])
        and V.decode_polynomial(parent["scalars.json"]["eta"], max_degree=14)
        == poly_mul(factor_m, expected_scalars["etabar"]),
        "compressed representation preserves original fractions",
    )
    matrices, originals, rows, stats = {}, {}, [], {}
    for name in COMPONENTS:
        original = V.decode_matrix(
            parent[name + ".json"],
            shape=(43, 43),
            max_degree=19 if name.startswith("N") else 16,
        )
        originals[name] = original
        for kind in ("quotient", "remainder", "multiplyback"):
            key = name + "_" + kind
            matrix = V.decode_matrix(
                load(key + ".json"), shape=(43, 43), max_degree=MATRIX_CAPS[key]
            )
            matrices[key] = matrix
            stats[key] = matrix_stats(matrix, MATRIX_CAPS[key])
        row = verify_division(
            original,
            factor_n if name.startswith("N") else factor_m,
            *(
                matrices[name + "_" + kind]
                for kind in ("quotient", "remainder", "multiplyback")
            ),
            guard=budget.guard,
            check=budget._check_deadline,
        )
        rows.append(
            dict(name=name, factor_power=5 if name.startswith("N") else 4, **row)
        )
        stage(
            "replay-" + name + "-complete",
            accepted=row["accepted"],
            quotient_terms=stats[name + "_quotient"]["terms"],
        )
    G.require(stats == load("stats.json"), "all saved compression statistics")
    meta = dict(
        schema="nr-case12-compression-divisions-v1", monomial_order="lex", rows=rows
    )
    G.require(
        meta == load("division_metadata.json"), "independent full division decisions"
    )
    acceptance = dict(
        division_identity=all(row["division_identity_zero"] for row in rows),
        remainder_zero=all(row["remainder_zero"] for row in rows),
        multiplyback_zero=all(row["multiplyback_zero"] for row in rows),
        remainder_normal_form=all(row["normal_form_verified"] for row in rows),
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        acceptance == load("acceptance.json"),
        "complete independent compression acceptance",
    )
    mutant = [[dict(poly) for poly in row] for row in originals["N1"]]
    V.add_product(mutant[0][0], {(0, 0, 0): F(1)}, {(0, 0, 0): F(1)})
    witness = {
        kind: V.decode_matrix(
            load("mutation_N1_" + kind + ".json"),
            shape=(43, 43),
            max_degree=MUTATION_CAPS["mutation_N1_" + kind],
        )
        for kind in ("quotient", "remainder", "multiplyback")
    }
    decision = verify_division(
        mutant,
        factor_n,
        witness["quotient"],
        witness["remainder"],
        witness["multiplyback"],
        guard=budget.guard,
        check=budget._check_deadline,
    )
    rem_slots = sum(bool(poly) for row in witness["remainder"] for poly in row)
    back_slots = sum(bool(poly) for row in witness["multiplyback"] for poly in row)
    rem_terms, back_terms = (
        V.coefficient_count(witness["remainder"]),
        V.coefficient_count(witness["multiplyback"]),
    )
    mutation = dict(
        schema="nr-case12-compression-mutation-v1",
        name="add-one-to-N1-00",
        entry=[0, 0],
        division_identity_zero=decision["division_identity_zero"],
        normal_form_verified=decision["normal_form_verified"],
        remainder_nonzero_slots=rem_slots,
        multiplyback_nonzero_slots=back_slots,
        remainder_coefficients=rem_terms,
        multiplyback_coefficients=back_terms,
        rejected=not decision["accepted"] and rem_slots > 0 and back_slots > 0,
    )
    G.require(
        mutation == load("mutation.json"), "independent numerator mutation decision"
    )
    return dict(
        schema="nr-case12-independent-polynomial-compression-replay-v1",
        passed=acceptance["accepted"] and mutation["rejected"],
        acceptance=acceptance,
        matrix_slots=77658,
        division_slots=25886,
        residual_slots=51772,
        monomial_order="lex",
        mutation_nonzero_slots=rem_slots,
        mutation_coefficients=rem_terms,
        mutation_rejected=mutation["rejected"],
        fixed_domain=domain,
        parent_gate_sha256=PARENT_GATE,
        input_hashes=hashes,
        library="stdlib Fraction lex long division and sparse convolution; no SymPy or direction sampling",
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
        numerator_compression_validated=False,
        fixed_factors_validated=False,
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
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_polynomial_compression as P
        import nr_case12_polynomial_section as S

        stage("compression-construction-start")

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
            "division_metadata",
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
            "registered compression candidate failed; complete residual evidence retained",
        )
        result.update(
            passed=True,
            completed=True,
            numerator_compression_validated=True,
            fixed_factors_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            numerator_compression_validated=False,
            fixed_factors_validated=False,
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
        is result["numerator_compression_validated"]
        is result["fixed_factors_validated"]
        is True
        and not result["errors"],
        "complete compression candidate",
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
        "fixed compression scope",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    import nr_case12_polynomial_compression as P

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
        report["schema"] == "nr-case12-independent-polynomial-compression-replay-v1"
        and report["matrix_slots"] == 77658
        and report["parent_gate_sha256"] == PARENT_GATE,
        "complete registered compression replay",
    )
    G.require(
        set(report["acceptance"]) == ACCEPTANCE_KEYS
        and all(value is True for value in report["acceptance"].values())
        and report["division_slots"] == 25886
        and report["residual_slots"] == 51772
        and report["monomial_order"] == "lex"
        and report["mutation_nonzero_slots"] > 0
        and report["mutation_coefficients"] > 0
        and report["mutation_rejected"] is True
        and report["library"]
        == "stdlib Fraction lex long division and sparse convolution; no SymPy or direction sampling",
        "complete compression and actual nondivisible witness",
    )
    expected = {"parent-inputs/" + name for name in PARENT_INPUTS}
    expected.update(name + ".json" for name in {**MATRIX_CAPS, **MUTATION_CAPS})
    expected.update(
        (
            "stats.json",
            "scalars.json",
            "acceptance.json",
            "division_metadata.json",
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

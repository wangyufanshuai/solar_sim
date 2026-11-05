"""Complete source-bound real-formula volume linearization certificate.

Mathematics is executed only inside the registered owned worker. Parent hashes,
source manifests and domain metadata may be inspected without evaluating jets.
"""

import hashlib
import json
from fractions import Fraction as F

import nr_polynomial_certificate_replay as V


PARENT_DIRECTORY = "nr-k3-case12-uniform-frequency-growth-controls-v1-20261015"
PARENT_GATE = "9b20396162fe62a9be2ef256c340c7d457a42e8578540ac9f4b7f6c9656f0d62"
PARENT_WORKER = "6f3a9e9b3604e3de290ef98c121d7b7eafe176eb9b96341f5472e500bda4cea3"
PARENT_REPLAY = "d868a751f653a07eb390a6c23c3253023627e0ac45d7c17d56f23275d1c61ff1"
PARENT_FILES = {
    "growth_gate.json": ("qualification-gate.json", PARENT_GATE),
    "growth_worker.json": ("worker-result.json", PARENT_WORKER),
    "growth_replay.json": ("independent-replay.json", PARENT_REPLAY),
    "growth_domain.json": (
        "domain.json",
        "b10fcb09c3f763b6ff5aa2bc84d5ed7f13c668ea023e1f0e857f529ba06f1d0a",
    ),
    "growth_source_bridge.json": (
        "source_bridge.json",
        "28bcefd4695016372526897b59756af0e1be73317da4c73b6ce260a97731765a",
    ),
    "growth_parent_provenance.json": (
        "parent_provenance.json",
        "7f8900b79171b7acb9fdb700db13e01982017bc042fa829b3b0eeb80da042088",
    ),
    "growth_stats.json": (
        "stats.json",
        "7a801c8ea6e3873f76db4ad1b2860b8f18a26eb6747c0147e3323a9451dfa2fc",
    ),
    "J58.json": (
        "parent-inputs/J58.json",
        "19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b",
    ),
    "K58.json": (
        "parent-inputs/K58.json",
        "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    ),
}
MATRIX_SCHEMA = "nr-case12-complete-rational-matrix-v1"
CASE_NAMES = ("baseline", "kappa1_mutant", "ordering_mutant")
FIELDS = ("F0", "J", "Ax", "Ay", "Az", "RJ", "Rx", "Ry", "Rz")
MATRIX_NAMES = tuple(case + "__" + field for case in CASE_NAMES for field in FIELDS)
RECORD_ORDER = tuple(
    name
    for case in CASE_NAMES
    for name in (*(case + "__" + field for field in FIELDS), case + "__execution")
) + (
    "source_bridge",
    "parent_provenance",
    "domain",
    "mutations",
    "stats",
    "acceptance",
)
SHAPES = {name: (58, 1 if name.endswith("__F0") else 58) for name in MATRIX_NAMES}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def rational(value):
    require(type(value) is str, "rational string required")
    try:
        result = F(value)
    except (ValueError, ZeroDivisionError):
        raise ValueError("canonical rational string required") from None
    require(str(result) == value, "canonical rational string required")
    return result


def matrix_shape(matrix):
    require(
        type(matrix) is list and matrix and type(matrix[0]) is list and matrix[0],
        "nonempty rational matrix",
    )
    columns = len(matrix[0])
    require(
        all(type(row) is list and len(row) == columns for row in matrix),
        "rectangular rational matrix",
    )
    require(all(type(x) is F for row in matrix for x in row), "exact Fraction cells")
    return len(matrix), columns


def encode_matrix(matrix):
    rows, columns = matrix_shape(matrix)
    return dict(
        schema=MATRIX_SCHEMA,
        shape=[rows, columns],
        entries=[
            [i, j, str(matrix[i][j])] for i in range(rows) for j in range(columns)
        ],
    )


def decode_matrix(record, shape):
    require(
        type(record) is dict and set(record) == {"schema", "shape", "entries"},
        "exact rational matrix schema",
    )
    require(
        record["schema"] == MATRIX_SCHEMA
        and type(record["shape"]) is list
        and all(type(x) is int for x in record["shape"])
        and record["shape"] == list(shape),
        "registered shape",
    )
    rows, columns = shape
    require(
        type(record["entries"]) is list and len(record["entries"]) == rows * columns,
        "all rational slots including zeros",
    )
    result = [[F(0) for _ in range(columns)] for _ in range(rows)]
    for position, entry in enumerate(record["entries"]):
        i, j = divmod(position, columns)
        require(
            type(entry) is list
            and len(entry) == 3
            and type(entry[0]) is type(entry[1]) is int
            and entry[:2] == [i, j],
            "complete unique row-major coordinates",
        )
        result[i][j] = rational(entry[2])
    return result


def matrix_stats(matrix):
    rows, columns = matrix_shape(matrix)
    nonzero = sum(value != 0 for row in matrix for value in row)
    return dict(
        shape=[rows, columns],
        slots=rows * columns,
        nonzero_slots=nonzero,
        all_zero=nonzero == 0,
    )


def difference(left, right, check=lambda: None):
    require(
        matrix_shape(left) == matrix_shape(right), "matching rational difference shapes"
    )
    result = []
    for a, b in zip(left, right, strict=True):
        check()
        result.append([x - y for x, y in zip(a, b, strict=True)])
    return result


def parent_provenance_manifest(raw_inputs):
    require(
        type(raw_inputs) is dict and set(raw_inputs) == set(PARENT_FILES),
        "complete nine-file parent registry",
    )
    hashes = {}
    records = {}
    for name, (_, digest) in PARENT_FILES.items():
        require(type(raw_inputs[name]) is bytes, "parent byte inputs")
        hashes[name] = hashlib.sha256(raw_inputs[name]).hexdigest()
        require(hashes[name] == digest, "registered parent bytes changed")
        records[name] = json.loads(raw_inputs[name])
    gate, worker, replay = (
        records["growth_" + x + ".json"] for x in ("gate", "worker", "replay")
    )
    require(
        gate["passed"] is gate["completed"] is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "qualified cleaned growth parent",
    )
    require(
        worker["passed"] is worker["completed"] is True
        and not worker["errors"]
        and replay["passed"] is True,
        "complete growth worker and independent replay",
    )
    for flag in (
        "full58_uniform_frequency_l2_growth_validated",
        "physical43_weighted_frequency_growth_validated",
    ):
        require(
            gate[flag] is True and worker[flag] is True,
            "precise accepted growth qualifications",
        )
    for name, (path, digest) in PARENT_FILES.items():
        if name != "growth_gate.json":
            require(
                gate["artifact_hashes"].get(path) == digest,
                "parent artifact qualification binding",
            )
    inherited = records["growth_parent_provenance.json"]
    for name in ("J58.json", "K58.json"):
        require(
            inherited["input_hashes"][name] == hashes[name]
            and inherited["files"][name]["sha256"] == hashes[name],
            "original J/K provenance",
        )
    return dict(
        schema="nr-case12-actual-volume-parent-provenance-v1",
        directory=PARENT_DIRECTORY,
        files={
            name: dict(path=path, sha256=digest)
            for name, (path, digest) in PARENT_FILES.items()
        },
        input_hashes=hashes,
        inherited_original_matrices={
            name: inherited["files"][name] for name in ("J58.json", "K58.json")
        },
        parent_gate_sha256=PARENT_GATE,
        parent_matrices_rebuilt=False,
        historical_results_regraded=False,
    )


def oracle_matrices(raw_inputs, check=lambda: None):
    parent_provenance_manifest(raw_inputs)
    j = V.decode_matrix(
        json.loads(raw_inputs["J58.json"]), shape=(58, 58), max_degree=0
    )
    k = V.decode_matrix(
        json.loads(raw_inputs["K58.json"]), shape=(58, 58), max_degree=1
    )
    result = {
        name: [[F(0) for _ in range(58)] for _ in range(58)]
        for name in ("J", "Ax", "Ay", "Az")
    }
    axes = ((1, 0, 0), (0, 1, 0), (0, 0, 1))
    for row in range(58):
        check()
        for column in range(58):
            result["J"][row][column] = j[row][column].get((0, 0, 0), F(0))
            require(
                all(exponent in axes for exponent in k[row][column]),
                "full K homogeneous degree one only",
            )
            for name, exponent in zip(("Ax", "Ay", "Az"), axes, strict=True):
                result[name][row][column] = k[row][column].get(exponent, F(0))
    return result


def variant_parameters(case):
    require(case in CASE_NAMES, "registered actual RHS variant")
    return dict(
        kappa1=F(1, 5) if case == "kappa1_mutant" else F(1, 10),
        ordering_scale=F(2, 5) if case == "ordering_mutant" else F(1, 5),
    )


def case_records(evaluated, oracle, check=lambda: None):
    require(
        all(name in evaluated for name in ("F0", "J", "Ax", "Ay", "Az")),
        "all actual outputs required",
    )
    result = {}
    for name in ("F0", "J", "Ax", "Ay", "Az"):
        require(
            matrix_shape(evaluated[name]) == (58, 1 if name == "F0" else 58),
            "complete actual Jacobians",
        )
        result[name] = evaluated[name]
    for residual, original in (("RJ", "J"), ("Rx", "Ax"), ("Ry", "Ay"), ("Rz", "Az")):
        result[residual] = difference(result[original], oracle[original], check)
    return result


def mutation_evidence(cases, check=lambda: None):
    evidence = {}
    base = cases["baseline"]
    for name in CASE_NAMES[1:]:
        candidate = cases[name]
        changes = {
            field: matrix_stats(difference(candidate[field], base[field], check))
            for field in ("F0", "J", "Ax", "Ay", "Az")
        }
        residuals = {
            field: matrix_stats(candidate[field]) for field in ("RJ", "Rx", "Ry", "Rz")
        }
        causal = {
            field: sum(
                candidate[field][i][j] != base[field][i][j]
                and candidate[residual][i][j] != 0
                for i in range(58)
                for j in range(58)
            )
            for field, residual in (
                ("J", "RJ"),
                ("Ax", "Rx"),
                ("Ay", "Ry"),
                ("Az", "Rz"),
            )
        }
        if name == "kappa1_mutant":
            changed = changes["J"]["nonzero_slots"] > 0
            rejected = causal["J"] > 0
        else:
            changed = any(
                changes[field]["nonzero_slots"] > 0 for field in ("Ax", "Ay", "Az")
            )
            rejected = any(causal[field] > 0 for field in ("Ax", "Ay", "Az"))
        evidence[name] = dict(
            parameters={k: str(v) for k, v in variant_parameters(name).items()},
            actual_changes=changes,
            actual_bridge_differences=residuals,
            causal_changed_residual_slots=causal,
            parameter_caused_registered_change=changed,
            stale_original_symbol_rejected=rejected,
            accepted=changed and rejected,
        )
    return dict(
        schema="nr-case12-actual-volume-real-parameter-controls-v1",
        controls=evidence,
        accepted=all(row["accepted"] for row in evidence.values()),
        prefilled_theoretical_pattern=False,
    )


def domain_metadata():
    return dict(
        schema="nr-case12-actual-volume-linearization-domain-v1",
        fixed_case=12,
        background="constant",
        source_interpretation="exact real formulas from frozen actual volume AST",
        state_variables=58,
        independent_spatial_gradient_variables=174,
        total_seed_variables=232,
        all_off_constraint_directions=True,
        auxiliary_fields_reconstructed=False,
        algebraic_constraints_projected=False,
        state_chart="q6=ln(alpha), q10=0.5ln(chi); centered exact first derivatives",
        fourier_sign="J+i*rho*K(n)",
        oracle_geometric=False,
        finite_direction_sampling=False,
        expected_zero_slots=13514,
        main_slots=26970,
        all_three_case_slots=80910,
        second_spatial_derivatives_registered=False,
        actual_binary64_rhs_executed=False,
        full_python_semantics_proved=False,
        nonlinear_stability_validated=False,
        variable_background_energy_validated=False,
        physical_boundary_validated=False,
        constraint_convergence_validated=False,
        actual_constraint_diagnostic_bridge_proved=False,
        new_scientific_evolution=False,
        independent_external_review=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )


def chart_controls_accepted(chart):
    """Check real chart counterexamples; an empty matching record is not success."""
    controls = chart.get("chain_rule_negative_controls", [])
    expected = (
        ("omit-alpha-center", 6),
        ("omit-chi-center", 10),
        ("omit-chi-factor-two", 10),
    )
    if (
        len(controls) != 3
        or chart.get("chain_rule_controls_are_case12_rhs_counterexamples") is not False
    ):
        return False
    for row, (name, slot) in zip(controls, expected, strict=True):
        if (
            row.get("name") != name
            or type(row.get("slot")) is not int
            or row["slot"] != slot
            or row.get("rejected") is not True
        ):
            return False
        correct = rational(row["actual_correct_coefficient"])
        wrong = rational(row["actual_wrong_coefficient"])
        gap = rational(row["actual_gap"])
        field = chart["alpha"] if slot == 6 else chart["chi"]
        expected_wrong = (
            F(1)
            if slot == 6
            else F(2)
            if name == "omit-chi-center"
            else rational(chart["chi"]["value"])
        )
        if (
            correct != rational(dict(field["coefficients"])[slot])
            or wrong != expected_wrong
            or gap != correct - wrong
            or gap == 0
        ):
            return False
    return True


def build_certificate(raw_inputs, *, guard=lambda: None, check=lambda: None, sink):
    import nr_case12_actual_volume_jet as backend

    provenance = parent_provenance_manifest(raw_inputs)
    oracle = oracle_matrices(raw_inputs, check)
    all_cases = {}
    summaries = {}
    chart_checks = {}
    for case in CASE_NAMES:
        guard()
        evaluated = backend.evaluate_case(
            **variant_parameters(case), guard=guard, check=check
        )
        records = case_records(evaluated, oracle, check)
        all_cases[case] = records
        for field in FIELDS:
            guard()
            name = case + "__" + field
            sink(name, encode_matrix(records[field]))
            summaries[name] = matrix_stats(records[field])
        sink(
            case + "__execution",
            dict(
                requested_parameters={
                    k: str(v) for k, v in variant_parameters(case).items()
                },
                parameters=evaluated["parameters"],
                chart=evaluated["chart"],
                operations=evaluated["operations"],
            ),
        )
        chart_checks[case] = chart_controls_accepted(evaluated["chart"])
    mutation = mutation_evidence(all_cases, check)
    acceptance = dict(
        baseline_equilibrium=matrix_stats(all_cases["baseline"]["F0"])["all_zero"],
        algebraic_jacobian_bridge=matrix_stats(all_cases["baseline"]["RJ"])["all_zero"],
        spatial_jacobian_bridge=all(
            matrix_stats(all_cases["baseline"][field])["all_zero"]
            for field in ("Rx", "Ry", "Rz")
        ),
        real_parameter_controls=mutation["accepted"],
        chart_chain_rule_controls=all(chart_checks.values()),
    )
    acceptance["accepted"] = all(acceptance.values())
    sink("source_bridge", backend.source_manifest())
    sink("parent_provenance", provenance)
    sink("domain", domain_metadata())
    sink("mutations", mutation)
    sink(
        "stats",
        dict(
            cases=3,
            matrices=27,
            main_slots=26970,
            mutation_slots=53940,
            total_slots=80910,
            required_baseline_zero_slots=13514,
            outputs=len(RECORD_ORDER),
            parent_files=len(PARENT_FILES),
            matrices_by_name=summaries,
        ),
    )
    sink("acceptance", acceptance)
    return acceptance

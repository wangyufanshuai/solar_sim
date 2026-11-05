"""Complete actual constraint real-formula certificate, owned-worker execution only."""

from fractions import Fraction as F
import hashlib
import json

import nr_case12_actual_volume_linearization as VOLUME
import nr_polynomial_certificate_replay as POLY

require = VOLUME.require
encode_matrix = VOLUME.encode_matrix
decode_matrix = VOLUME.decode_matrix
matrix_stats = VOLUME.matrix_stats
difference = VOLUME.difference
MATRIX_SCHEMA = VOLUME.MATRIX_SCHEMA
PARENT_DIRECTORY = "nr-k3-case12-actual-volume-linearization-controls-v1-20261015"
PARENT_GATE = "ba5bff599828bf9185db40c72e6421c337fe89b60fab5acde4329f534b4502f0"
PARENT_WORKER = "816ea01a8870aee222aa829b100a852d6e19e4022bcd4a7de9e66e94c0f2539d"
COORDINATE_DIRECTORY = "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"
COORDINATE_GATE = "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708"
_VOLUME_FILES = {
    "qualification-gate.json": PARENT_GATE,
    "worker-result.json": PARENT_WORKER,
    "independent-replay.json": "0a96abe07f82719030d6bf81e1a335ccada39047b5e6d13a814507e7c9a2d6af",
    "source_bridge.json": "fc07b9a1dc641466d1f064cce28b47d91415e56af0e6a046dc58fd5e124fbba1",
    "domain.json": "4ae0f52b528ce37c33cbdedb12357901c2b3ae4170fb05d7da071a42ac5157d1",
}
_COORDINATE_FILES = {
    "qualification-gate.json": COORDINATE_GATE,
    "worker-result.json": "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    "independent-replay.json": "7751521463cdade0039d8e36b405dac40f8faca3b98c9b02100c75165e370104",
    "source_bridge.json": "9081f843df45d334fa98573479c413ad241e59ea85aa6b96b5359713c32b221d",
    "parent_provenance.json": "6368f7e880134cc51809ddee8817bbc1a6c22d5c26fcd1caa45dfdc4826b88af",
    "C0.json": "87d85210d4d0bae1b77278657bc0277711778332de32c0cfde4b61958d5df053",
    "C1.json": "f396ff86998f987246af4a92844cae3944cc265418116f7f1a3dacfc3d7f4a65",
    "C2.json": "b54ada626e3fd69d337d2a7a1b8f04d10ea44e1c72533e81741b354b26acdd21",
}
PARENT_FILES = {
    **{
        "volume_" + path: (PARENT_DIRECTORY, path, digest)
        for path, digest in _VOLUME_FILES.items()
    },
    **{
        (path if path.startswith("C") else "coordinate_" + path): (
            COORDINATE_DIRECTORY,
            path,
            digest,
        )
        for path, digest in _COORDINATE_FILES.items()
    },
}
CASE_NAMES = ("baseline", "momentum_trace_mutant", "connection_target_mutant")
FIELDS = ("F0", "C", "R")
HESSIAN_PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
SEED_COUNT = 580
DRIVER_FIELDS = ("driverF0", "driverC", "driverAgreement", "driverSymmetry")
SHAPES = {
    **{
        case + "__" + field: (43, 1 if field == "F0" else SEED_COUNT)
        for case in CASE_NAMES
        for field in FIELDS
    },
    "driverF0": (49, 1),
    "driverC": (49, SEED_COUNT),
    "driverAgreement": (40, SEED_COUNT + 1),
    "driverSymmetry": (9, SEED_COUNT + 1),
}
MATRIX_NAMES = tuple(SHAPES)
RECORD_ORDER = (
    tuple(
        name
        for case in CASE_NAMES
        for name in (*(case + "__" + field for field in FIELDS), case + "__execution")
    )
    + DRIVER_FIELDS
    + (
        "source_bridge",
        "parent_provenance",
        "domain",
        "mutations",
        "stats",
        "acceptance",
    )
)
QUALIFICATIONS = (
    "actual_constraint_continuum_real_formula_bridge_validated",
    "driver_metric_constraint_continuum_bridge_validated",
)
SCOPE = (
    "fixed-case12 continuum real-formula first variation of actual physical43 "
    "diagnostics and all49 driver scalars in 58 states,174 gradients,348 symmetric Hessians; "
    "no finite-difference/SBP runtime, FP64, evolution, boundary or nonlinear qualification"
)
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
    "physical43_uniform_euclidean_growth_validated",
    "constraint_derivative_loss_absent_proved",
    "variable_background_energy_validated",
    "actual_binary64_rhs_executed",
    "actual_constraint_diagnostic_bridge_proved",
    "sbp_semidiscrete_energy_validated",
    "actual_discrete_constraint_diagnostic_executed",
)


def domain_metadata():
    return dict(
        schema="nr-case12-actual-constraint-domain-v1",
        scope=SCOPE,
        case_indices=[12],
        independent_states=58,
        independent_gradients=174,
        independent_symmetric_hessians=348,
        seeds=SEED_COUNT,
        hessian_pairs=[list(p) for p in HESSIAN_PAIRS],
        hessian_seeds_are_actual_derivatives_not_taylor_coefficients=True,
        mixed_polynomial_coefficient_divided_by_two=False,
        perturbation_amplitude_order=1,
        max_spatial_derivative_order=2,
        nonlinear_products_of_perturbations_retained=False,
        continuum_derivative_replaces_discrete_operator=True,
        off_constraint_states_independent=True,
        determinant_trace_projected=False,
        physical43_lower_Z_from_actual_Ghat=True,
        raw_driver_scalars=49,
        driver_independent_scalars=40,
        driver_symmetry_residuals=9,
        finite_direction_sampling=False,
        binary64_or_discrete_diagnostics_qualified=False,
        parent_gate_sha256=PARENT_GATE,
        coordinate_gate_sha256=COORDINATE_GATE,
        **{flag: False for flag in FALSE_FLAGS},
    )


def parent_provenance_manifest(raw):
    require(type(raw) is dict and set(raw) == set(PARENT_FILES), "all13 parent inputs")
    records, hashes = {}, {}
    for name, (_, _, digest) in PARENT_FILES.items():
        require(type(raw[name]) is bytes, "raw parent bytes")
        hashes[name] = hashlib.sha256(raw[name]).hexdigest()
        require(hashes[name] == digest, "parent SHA drift: " + name)
        records[name] = json.loads(raw[name])
    for label in ("volume", "coordinate"):
        gate, worker, replay = (
            records[label + "_" + n + ".json"]
            for n in ("qualification-gate", "worker-result", "independent-replay")
        )
        require(
            gate["passed"] is gate["completed"] is True
            and gate["errors"] == []
            and gate["supervisor"]["cleanup_verified"] is True,
            "qualified clean parent " + label,
        )
        require(
            worker["passed"] is worker["completed"] is replay["passed"] is True
            and worker["errors"] == [],
            "complete parent worker and replay",
        )
        files = _VOLUME_FILES if label == "volume" else _COORDINATE_FILES
        for path, digest in files.items():
            if path != "qualification-gate.json":
                require(
                    gate["artifact_hashes"].get(path) == digest,
                    "qualified parent artifact",
                )
    require(
        records["volume_qualification-gate.json"][
            "actual_volume_real_formula_linearization_validated"
        ]
        is True,
        "actual volume continuum bridge inherited",
    )
    return dict(
        schema="nr-case12-actual-constraint-parent-provenance-v1",
        input_hashes=hashes,
        files={
            n: dict(directory=d, path=p, sha256=h)
            for n, (d, p, h) in PARENT_FILES.items()
        },
        parent_gate_sha256=PARENT_GATE,
        coordinate_gate_sha256=COORDINATE_GATE,
        parent_matrices_rebuilt=False,
        historical_results_regraded=False,
    )


def oracle_matrix(raw, check=lambda: None):
    """Extract every polynomial coefficient; never sample a direction."""
    parent_provenance_manifest(raw)
    matrices = [
        POLY.decode_matrix(json.loads(raw[f"C{d}.json"]), shape=(43, 58), max_degree=d)
        for d in range(3)
    ]
    groups = (
        ((0, 0, 0),),
        ((1, 0, 0), (0, 1, 0), (0, 0, 1)),
        ((2, 0, 0), (1, 1, 0), (1, 0, 1), (0, 2, 0), (0, 1, 1), (0, 0, 2)),
    )
    result = [[F(0) for _ in range(SEED_COUNT)] for _ in range(43)]
    for row in range(43):
        check()
        for degree, (matrix, exponents) in enumerate(
            zip(matrices, groups, strict=True)
        ):
            offset = (0, 58, 232)[degree]
            for col, polynomial in enumerate(matrix[row]):
                require(
                    all(sum(e) == degree for e in polynomial),
                    "complete homogeneous C degree",
                )
                for block, exponent in enumerate(exponents):
                    result[row][offset + block * 58 + col] = polynomial.get(
                        exponent, F(0)
                    )
    return result


def coefficients(rows, count, check=lambda: None):
    require(
        type(rows) in (list, tuple) and len(rows) == count,
        "complete actual scalar rows",
    )
    values, matrix = [], []
    for q in rows:
        check()
        require(
            type(q.value) is F
            and all(
                type(k) is int and 0 <= k < SEED_COUNT and type(v) is F and v != 0
                for k, v in q.coefficients.items()
            ),
            "exact580 row",
        )
        values.append([q.value])
        matrix.append([q.coefficients.get(k, F(0)) for k in range(SEED_COUNT)])
    return values, matrix


def driver_matrices(raw_rows, baseline, check=lambda: None):
    f0, matrix = coefficients(raw_rows, 49, check)
    full = [[v[0], *r] for v, r in zip(f0, matrix, strict=True)]
    base = [[v[0], *r] for v, r in zip(baseline["F0"], baseline["C"], strict=True)]
    physical_rows = list(range(5)) + list(range(8, 43))
    independent_rows = (
        list(range(17))
        + [17 + 9 * k + 3 * i + j for k in range(3) for i, j in HESSIAN_PAIRS]
        + list(range(44, 49))
    )
    agreement = difference(
        [full[i] for i in independent_rows], [base[i] for i in physical_rows], check
    )
    symmetry = difference(
        [
            full[17 + 9 * k + 3 * i + j]
            for k in range(3)
            for i, j in ((0, 1), (0, 2), (1, 2))
        ],
        [
            full[17 + 9 * k + 3 * j + i]
            for k in range(3)
            for i, j in ((0, 1), (0, 2), (1, 2))
        ],
        check,
    )
    return dict(
        driverF0=f0, driverC=matrix, driverAgreement=agreement, driverSymmetry=symmetry
    )


def mutation_report(cases):
    controls = {}
    for name, targets in (
        ("momentum_trace_mutant", (1, 2, 3)),
        ("connection_target_mutant", (5, 6, 7)),
    ):
        changed, causal, outside = 0, 0, 0
        for i in range(43):
            for j in range(SEED_COUNT):
                change = cases[name]["C"][i][j] != cases["baseline"]["C"][i][j]
                changed += change
                outside += change and i not in targets
                causal += change and i in targets and cases[name]["R"][i][j] != 0
        controls[name] = dict(
            target_rows=list(targets),
            changed_slots=changed,
            changed_outside_target_rows=outside,
            causal_changed_residual_slots=causal,
            original_diagnostic_symbol_rejected=causal > 0,
            accepted=changed > 0 and causal > 0 and outside == 0,
        )
    return dict(
        schema="nr-case12-actual-constraint-real-source-controls-v1",
        controls=controls,
        accepted=all(c["accepted"] for c in controls.values()),
        prefilled_theoretical_pattern=False,
        actual_mutated_source_evaluated=True,
    )


def acceptance_record(stats, mutations):
    out = dict(
        baseline_equilibrium=stats["baseline__F0"]["all_zero"],
        complete_physical43_bridge=stats["baseline__R"]["all_zero"],
        driver_equilibrium=stats["driverF0"]["all_zero"],
        driver_complete40_bridge=stats["driverAgreement"]["all_zero"],
        driver_nine_symmetry_relations=stats["driverSymmetry"]["all_zero"],
        real_source_negative_controls=mutations["accepted"],
    )
    return dict(out, accepted=all(out.values()))


def summary_record(stats):
    return dict(
        cases=3,
        matrices=13,
        total_slots=206707,
        main_slots=106861,
        mutation_slots=99846,
        required_baseline_zero_slots=53501,
        outputs=22,
        parent_files=13,
        matrices_by_name=stats,
    )


def build_certificate(raw, *, guard=lambda: None, check=lambda: None, sink):
    import nr_case12_actual_constraint_jet as actual

    provenance = parent_provenance_manifest(raw)
    oracle = oracle_matrix(raw, check)
    cases, stats = {}, {}
    driver_rows = None
    for case in CASE_NAMES:
        guard()
        execution = actual.evaluate_case(case=case, guard=guard, check=check)
        f0, matrix = coefficients(execution["rows"], 43, check)
        values = dict(F0=f0, C=matrix, R=difference(matrix, oracle, check))
        cases[case] = values
        for field in FIELDS:
            guard()
            name = case + "__" + field
            sink(name, encode_matrix(values[field]))
            stats[name] = matrix_stats(values[field])
        sink(case + "__execution", execution["execution"])
        if case == "baseline":
            driver_rows = execution["raw_driver"]
        else:
            require(execution["raw_driver"] is None, "baseline-only driver execution")
    for name, matrix in driver_matrices(driver_rows, cases["baseline"], check).items():
        guard()
        sink(name, encode_matrix(matrix))
        stats[name] = matrix_stats(matrix)
    mutations = mutation_report(cases)
    acceptance = acceptance_record(stats, mutations)
    for name, record in (
        ("source_bridge", actual.source_manifest()),
        ("parent_provenance", provenance),
        ("domain", domain_metadata()),
        ("mutations", mutations),
        ("stats", summary_record(stats)),
        ("acceptance", acceptance),
    ):
        guard()
        sink(name, record)
    return acceptance

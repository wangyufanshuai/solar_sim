"""One fixed exact divisor for the accepted physical closure coefficients.

Source and parent manifests use only stdlib JSON, bytes, SHA and AST. Exact
polynomial work belongs to the owned worker. The original matrices and their
accepted proofs are not rebuilt. Nondivisibility and failed homogeneity retain
their complete candidate matrices before the caller decides acceptance.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARENT = "nr-k3-case12-physical-closure-controls-v1-20261015"
PARENT_GATES = {
    PARENT: dict(
        gate_sha256="87d715e82cf705c97fcb2f61d78fc92fc152b20e87367264cee19f16f264fff0",
        worker_sha256="4cbb925320f895be745bd31b78078f783cc4600bd36d6edaa4d15f15a4cb41aa",
    )
}
PARENT_FILES = {
    "closure_gate.json": dict(
        directory=PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[PARENT]["gate_sha256"],
    ),
    "closure_worker.json": dict(
        directory=PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[PARENT]["worker_sha256"],
    ),
    "closure_replay.json": dict(
        directory=PARENT,
        path="independent-replay.json",
        sha256="9d081ac1d2a7df6214826a88a6cbaecd6fb63041487e495d6f5d25ed07b22228",
    ),
    "closure_domain.json": dict(
        directory=PARENT,
        path="domain.json",
        sha256="9d2f17c254ea3d2312b08395e000f4f8f2f00392b985268714bcbc85be932c97",
    ),
    "closure_scalars.json": dict(
        directory=PARENT,
        path="scalars.json",
        sha256="316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5",
    ),
    "closure_source_bridge.json": dict(
        directory=PARENT,
        path="source_bridge.json",
        sha256="e3bb3427751e073ae5b270f214b179c5154541e83b4f0a43ff1992d7507d73ea",
    ),
    "Bbar__p_0.json": dict(
        directory=PARENT,
        path="Bbar__p_0.json",
        sha256="b70d722ea553fff673ebce7b4fa2f345f158bbd2fa3ec40c330001a708b8b5c6",
    ),
    "Bbar__p_1.json": dict(
        directory=PARENT,
        path="Bbar__p_1.json",
        sha256="be0a58963030e8e4a5f1529f1f366fb7013d2933970f1a7ef58d649aa8aca2a6",
    ),
    "Bbar__p_2.json": dict(
        directory=PARENT,
        path="Bbar__p_2.json",
        sha256="e27fa8f983fd53b63751133cdc0c0c7b123f377103df31ef1d3e938e84fe0aa1",
    ),
    "C0.json": dict(
        directory=PARENT,
        path="parent-inputs/C0.json",
        sha256="87d85210d4d0bae1b77278657bc0277711778332de32c0cfde4b61958d5df053",
    ),
    "C1.json": dict(
        directory=PARENT,
        path="parent-inputs/C1.json",
        sha256="f396ff86998f987246af4a92844cae3944cc265418116f7f1a3dacfc3d7f4a65",
    ),
    "C2.json": dict(
        directory=PARENT,
        path="parent-inputs/C2.json",
        sha256="b54ada626e3fd69d337d2a7a1b8f04d10ea44e1c72533e81741b354b26acdd21",
    ),
    "J.json": dict(
        directory=PARENT,
        path="parent-inputs/J.json",
        sha256="19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b",
    ),
    "K.json": dict(
        directory=PARENT,
        path="parent-inputs/K.json",
        sha256="e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    ),
    "domain.json": dict(
        directory=PARENT,
        path="parent-inputs/domain.json",
        sha256="a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    ),
    "denominators.json": dict(
        directory=PARENT,
        path="parent-inputs/denominators.json",
        sha256="2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    ),
}
SOURCE_HASHES = {
    "scripts/nr_constraint_direction_section.py": "e73b54e528e635f51dc1e25af2489068fad0b26e89e1c85940ca7515c8b476c0",
    "scripts/nr_constraint_exact_coefficients.py": "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    "scripts/nr_profile_exact_coefficients.py": "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
    "scripts/nr_constraint_full_symbol.py": "053b70dd9136117dcfc8f2045b9953dc5ece6bfdf382eb1da12f33b9b8446042",
    "scripts/nr_constraint_laurent_energy.py": "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
}
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_physical_coordinate_bridge.py": "b69ec375a81ed04b22b438e90e56083afb706702d67a70fcef5eff032bff96f0",
    "scripts/nr_case12_polynomial_compression.py": "b1f46b6cff721fc242cbca152380d6b940935206458e626c195d5f74df5a6054",
}
BOUND_HELPERS = {
    "scripts/nr_case12_polynomial_blocks.py": "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5",
    "scripts/nr_case12_polynomial_spectral.py": "4e9dfc5058af58cbf94526d0846e314e3d7c054b1726e2184e9a8eba50ac13e8",
    "scripts/nr_case12_polynomial_projectors.py": "6c30478535aaf00f487a38d2d86bf1c3860d1cc2126706b5bf3397b997614ac0",
    "scripts/nr_case12_physical_closure.py": "e0ba9001307b92d8b0d6d58dc578d65cf6523599b43b30a25b80a7f270e8100c",
}
AST_FUNCTIONS = {
    "scripts/nr_case12_polynomial_compression.py": ("compress_matrix",),
    "scripts/nr_case12_polynomial_blocks.py": ("_divide_scalar",),
    "scripts/nr_case12_physical_closure.py": ("closure_from_matrices",),
    "scripts/nr_constraint_full_symbol.py": ("source", "physical_coefficients"),
    "scripts/nr_profile_exact_coefficients.py": ("principal_rates", "matrix"),
}
POWERS = (0, 1, 2)
DIRECT_POWERS = (0, 1, 2, 3, 4)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _matrix_specs():
    result = {}
    for j in range(3):
        for prefix, cap in (("Q", 6), ("R", 22), ("M", 22)):
            result[prefix + str(j)] = (43, 43, cap)
    for name, cap in (("bad_A", 22), ("bad_Q", 6), ("bad_R", 22), ("bad_M", 22)):
        result[name] = (43, 43, cap)
    for j in range(5):
        result["direct_closure__p_" + str(j)] = (43, 58, 8)
    return result


MATRIX_SPECS = _matrix_specs()
MATRIX_ORDER = tuple(MATRIX_SPECS)
METADATA = (
    "scalars",
    "stats",
    "division_metadata",
    "acceptance",
    "mutation",
    "domain",
    "source_bridge",
    "parent_provenance",
)


def _registered_profile():
    require(
        type(POWERS) is tuple
        and POWERS == (0, 1, 2)
        and type(DIRECT_POWERS) is tuple
        and DIRECT_POWERS == tuple(range(5))
        and all(type(p) is int for p in (*POWERS, *DIRECT_POWERS)),
        "fixed full physical division supports",
    )
    require(
        type(MATRIX_SPECS) is dict
        and MATRIX_SPECS == _matrix_specs()
        and all(
            type(v) is tuple and all(type(n) is int for n in v)
            for v in MATRIX_SPECS.values()
        )
        and MATRIX_ORDER == tuple(_matrix_specs()),
        "fixed complete division outputs and degree bounds",
    )


def verify_source(raw, source_name):
    table = {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}
    require(
        type(raw) is bytes and type(source_name) is str and source_name in table,
        "registered source bytes",
    )
    require(
        hashlib.sha256(raw).hexdigest() == table[source_name],
        "frozen source SHA mismatch: " + source_name,
    )


def _verify_dependencies():
    for name in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}:
        verify_source((ROOT / name).read_bytes(), name)


def source_bridge_manifest():
    """No scientific imports: bind exact frozen formulas and division helpers."""
    _registered_profile()
    _verify_dependencies()
    bindings = {}
    for name, expected in AST_FUNCTIONS.items():
        tree = ast.parse((ROOT / name).read_bytes(), filename=name)
        nodes = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in expected
        ]
        require(
            len(nodes) == len(expected)
            and {node.name for node in nodes} == set(expected),
            "complete bound AST function coverage",
        )
        bindings[name] = dict(
            functions=[n.name for n in nodes],
            ast_sha256=hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest(),
            edits=[],
        )
    return dict(
        schema="nr-case12-physical-closure-division-source-v1",
        source_hashes=SOURCE_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        bound_helpers=BOUND_HELPERS.copy(),
        bindings=bindings,
        producer="unchanged frozen compression.compress_matrix",
        divisor="delta_squared",
        monomial_order="lex",
        quotient_save_degree_cap=6,
        homogeneity_degrees=list(POWERS),
        identity="A=f*Q+R; M=A-f*Q; direct=Q*C-C*(J+zeta*K)",
        mutation="bad_A=Bbar_0+E00; actual complete lex division",
        generator="J+zeta*K",
        principal_shift_retained=True,
        geometric=False,
        original_matrices_rebuilt=False,
        factor_search=False,
        direction_sampling=False,
        division_inner_deadline_callback=False,
        division_guard_frequency="entry/each row/exit; external owned hard deadline retained",
    )


def parent_provenance_manifest(parent_inputs):
    """Validate only supplied bytes; never read an external parent directory."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "complete fixed parent byte inputs",
    )
    records = {}
    for name, spec in PARENT_FILES.items():
        raw = parent_inputs[name]
        require(
            type(raw) is bytes and hashlib.sha256(raw).hexdigest() == spec["sha256"],
            "parent input byte drift: " + name,
        )
        records[name] = json.loads(raw)
    gate, worker, replay = (
        records[n]
        for n in ("closure_gate.json", "closure_worker.json", "closure_replay.json")
    )
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-physical-closure-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["full_frequency_closure_validated"]
            is record["physical_frequency_polynomial_generator_validated"]
            is True
            and record["errors"] == []
            and all(
                record[k] is False
                for k in (
                    "physical_gate",
                    "live_admission",
                    "scientificPayloadWriteback",
                    "local_differential_constraint_pde_derived",
                )
            ),
            "accepted unchanged-scope physical closure parent",
        )
    require(
        gate["supervisor"]["cleanup_verified"] is True
        and worker["source_before"] == worker["source_after"],
        "complete parent cleanup and source closure",
    )
    require(
        gate["replay"] == worker["replay"] == replay
        and replay["passed"] is True
        and replay["matrix_count"] == 37
        and replay["residual_slots"] == 34185
        and replay["residual_nonzero_slots"] == 0,
        "complete inherited physical closure replay",
    )
    for name, spec in PARENT_FILES.items():
        if spec["path"] != "qualification-gate.json":
            require(
                gate["artifact_hashes"][spec["path"]] == spec["sha256"],
                "parent qualified artifact binding: " + name,
            )
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}.items():
        require(
            worker["source_before"][name] == digest,
            "parent frozen dependency binding: " + name,
        )
    bridge = records["closure_source_bridge.json"]
    require(
        bridge["source_hashes"] == SOURCE_HASHES
        and bridge["generator"] == "J+zeta*K"
        and bridge["principal_shift_retained"] is True
        and bridge["geometric"] is False,
        "original shifted physical generator source binding",
    )
    domain = records["closure_domain.json"]
    require(
        domain["frequency"] == "complex-all-after-acceptance"
        and domain["denominator_lower_over_r8"] == "1/4"
        and domain["zero_frequency_full43_inverse_exists"] is False,
        "inherited physical denominator and zero-frequency scope",
    )
    return dict(
        schema="nr-case12-physical-closure-division-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        inherited_physical_closure_verified=True,
        original_shift_principal_retained=True,
        external_parent_reads=False,
        parent_matrices_rebuilt=False,
        old_results_regraded=False,
    )


def _modules():
    _verify_dependencies()
    result = tuple(
        importlib.import_module(name.removesuffix(".py").replace("/", "."))
        for name in DEPENDENCIES
    )
    for name, module in zip(DEPENDENCIES, result, strict=True):
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen helper import path",
        )
    return result


def build_context(*, guard=lambda: None):
    require(callable(guard), "callable resource guard")
    guard()
    manifest = source_bridge_manifest()
    P, _, _, _, _ = _modules()
    context = P.build_context(guard=guard)
    guard()
    return {**context, "ring": context["field"].ring, "source_bridge": manifest}


def homogeneity_metadata(matrix, degree, *, check=lambda: None):
    require(
        type(degree) is int and degree >= 0 and callable(check),
        "exact nonnegative homogeneity degree and deadline callback",
    )
    _, _, _, E, _ = _modules()
    E._matrix_ring(matrix)
    histogram, nonzero, bad = {}, 0, 0
    for row in matrix:
        check()
        for poly in row:
            nonzero += bool(poly)
            cell_bad = False
            for exponent in poly:
                total = sum(exponent)
                histogram[total] = histogram.get(total, 0) + 1
                cell_bad = cell_bad or total != degree
            bad += cell_bad
    check()
    return dict(
        expected_degree=degree,
        nonzero_slots=nonzero,
        monomials=sum(histogram.values()),
        degree_histogram=[[d, histogram[d]] for d in sorted(histogram)],
        inhomogeneous_slots=bad,
        homogeneous=bad == 0,
    )


def division_from_matrices(
    A, C, L, divisor, *, guard=lambda: None, check=None, sink=lambda name, matrix: None
):
    """Generic small-matrix algebra; fixed case/divisor binding is in build.

    Each saved array is complete and never subsequently modified. The frozen
    SymPy division checks the guard per row; it has no inner-step callback.
    """
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable stage, deadline and sink controls",
    )
    _registered_profile()
    check = guard if check is None else check
    guard()
    _, _, _, E, D = _modules()
    ring, shape = E._laurent(A)
    cring, cshape = E._laurent(C)
    lring, lshape = E._laurent(L)
    m, n = cshape
    require(
        cring == lring == ring
        and shape == (m, m)
        and lshape == (n, n)
        and set(A) == set(C) == set(POWERS)
        and set(L) == {0, 1},
        "matching full coefficient matrices",
    )
    E._scalar(divisor, ring)
    require(bool(divisor) and str(ring.order) == "lex", "nonzero exact lex divisor")
    matrices, rows, quotients = {}, [], {}

    def save(name, value):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "registered unique full division output",
        )
        E._matrix_ring(value)
        sink(name, value)
        matrices[name] = value
        guard()

    def row_guard():
        guard()
        check()

    for j in POWERS:
        guard()
        result = D.compress_matrix(A[j], divisor, guard=row_guard)
        quotients[j] = result["quotient"]
        for prefix, key in (
            ("Q", "quotient"),
            ("R", "remainder"),
            ("M", "multiplyback"),
        ):
            save(prefix + str(j), result[key])
        rows.append(
            dict(
                power=j,
                **{
                    key: result[key]
                    for key in (
                        "division_identity_zero",
                        "remainder_zero",
                        "multiplyback_zero",
                        "normal_form_verified",
                        "accepted",
                        "divisor_leading_exponent",
                        "divisor_leading_coefficient",
                    )
                },
                homogeneity=homogeneity_metadata(result["quotient"], j, check=check),
            )
        )
    bad_A = A[0].copy()
    bad_A[0, 0] = bad_A[0, 0] + ring.one
    save("bad_A", bad_A)
    bad = D.compress_matrix(bad_A, divisor, guard=row_guard)
    for name, key in (
        ("bad_Q", "quotient"),
        ("bad_R", "remainder"),
        ("bad_M", "multiplyback"),
    ):
        save(name, bad[key])
    counts = {}
    for kind in ("remainder", "multiplyback"):
        counts[kind + "_nonzero_slots"] = sum(bool(value) for value in bad[kind].flat)
        counts[kind + "_coefficients"] = sum(len(value) for value in bad[kind].flat)
    mutation = dict(
        schema="nr-case12-physical-closure-division-mutation-v1",
        name="add-one-to-Bbar0-00",
        entry=[0, 0],
        division_identity_zero=bad["division_identity_zero"],
        normal_form_verified=bad["normal_form_verified"],
        **counts,
        rejected=bool(
            counts["remainder_nonzero_slots"] and counts["multiplyback_nonzero_slots"]
        )
        and bad["division_identity_zero"]
        and bad["normal_form_verified"],
    )
    guard()
    qc = E.laurent_product(quotients, C, guard=check, stage=lambda power: guard())
    guard()
    cl = E.laurent_product(C, L, guard=check, stage=lambda power: guard())
    require(
        set(qc) == set(DIRECT_POWERS) and set(cl) == set(range(4)),
        "full direct closure supports",
    )
    direct = {}
    for j in DIRECT_POWERS:
        direct[j] = qc[j] - (cl[j] if j in cl else E.zeros(m, n, ring))
        save("direct_closure__p_" + str(j), direct[j])
    acceptance = dict(
        division_identity=all(row["division_identity_zero"] for row in rows),
        remainder_zero=all(row["remainder_zero"] for row in rows),
        multiplyback_zero=all(row["multiplyback_zero"] for row in rows),
        remainder_normal_form=all(row["normal_form_verified"] for row in rows),
        quotient_homogeneity=all(row["homogeneity"]["homogeneous"] for row in rows),
        direct_closure=not any(
            poly for matrix in direct.values() for poly in matrix.flat
        ),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    guard()
    return dict(
        matrices=matrices,
        division_metadata=dict(
            schema="nr-case12-physical-closure-divisions-v1",
            monomial_order="lex",
            divisor="delta_squared",
            rows=rows,
        ),
        acceptance=acceptance,
        mutation=mutation,
    )


def domain_metadata():
    return dict(
        schema="nr-case12-physical-closure-division-domain-v1",
        fixed_case=12,
        geometric=False,
        division_direction="real-nonzero",
        polynomial_extension_direction="all-real-after-acceptance",
        frequency="complex-all-after-acceptance",
        generator="J+zeta*K",
        principal_shift_retained=True,
        divisor="delta_squared=chi^2*r^4*g^4",
        divisor_homogeneous_degree=16,
        denominator_lower_over_r8="1/4",
        g_lower_over_r="5/6",
        chi="18/25",
        quotient_homogeneous_degrees=[0, 1, 2],
        substitution="zeta^j*Q_j(v)=Q_j(zeta*v)",
        local_symbol_scope="fixed constant-background original linear physical constraint model only",
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        zero_frequency_off_image_unique=False,
        old_laurent_maps_extended_to_zero=False,
        actual_nonlinear_rhs_bridge_proved=False,
        variable_background_proved=False,
        uniform_frequency_energy_proved=False,
        boundary_well_posedness_proved=False,
    )


def build_certificate(
    parent_inputs, *, guard=lambda: None, check=None, sink=lambda name, record: None
):
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable resource, deadline and sink controls",
    )
    check = guard if check is None else check
    guard()
    provenance = parent_provenance_manifest(parent_inputs)
    records = {name: json.loads(raw) for name, raw in parent_inputs.items()}
    context = build_context(guard=guard)
    P, V, Cmod, _, _ = _modules()
    field, ring = context["field"], context["ring"]
    require(
        records["domain.json"] == context["domain"],
        "inherited positive fixed case12 direction domain",
    )
    denominator_records = records["denominators.json"]
    require(
        set(denominator_records) == {"r", "g", "delta", "section_denominator"},
        "complete inherited denominators",
    )
    polys = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        decoded = V.decode_polynomial(denominator_records[name], max_degree=cap)
        polys[name] = ring.from_dict(
            {
                exponent: ring.domain.convert(value)
                for exponent, value in decoded.items()
            }
        )
        require(
            polys[name] == P.polynomial(context[name], field),
            "source-bound fixed denominator: " + name,
        )
    require(
        polys["r"] * polys["section_denominator"] == polys["delta"],
        "exact inherited r*sigma=delta",
    )
    divisor = polys["delta"] * polys["delta"]
    require(
        bool(divisor)
        and all(sum(e) == 16 for e in divisor)
        and str(ring.order) == "lex",
        "fixed homogeneous degree16 lex divisor",
    )
    scalars = {
        "r": P.canonical_polynomial(polys["r"]),
        "g": P.canonical_polynomial(polys["g"]),
        "sigma": P.canonical_polynomial(polys["section_denominator"]),
        "delta": P.canonical_polynomial(polys["delta"]),
        "delta_squared": P.canonical_polynomial(divisor),
    }
    require(
        json.dumps(scalars, sort_keys=True, separators=(",", ":"))
        == json.dumps(
            records["closure_scalars.json"], sort_keys=True, separators=(",", ":")
        ),
        "parent physical scalar identity",
    )
    inputs = {}
    input_specs = [("Bbar__p_" + str(j), (43, 43), 22) for j in POWERS]
    input_specs += [("C" + str(j), (43, 58), j) for j in POWERS]
    input_specs += [("J", (58, 58), 0), ("K", (58, 58), 1)]
    for name, shape, cap in input_specs:
        guard()
        inputs[name] = Cmod._to_matrix(
            records[name + ".json"], field, shape, cap, check
        )
    matrices, stats = {}, {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "unique complete saved division matrix",
        )
        rows, columns, cap = MATRIX_SPECS[name]
        require(matrix.shape == (rows, columns), "complete physical output dimensions")
        stats[name] = Cmod.matrix_stats(matrix, cap)
        record = P.encode_matrix(matrix, guard=check)
        guard()
        sink(name, record)
        matrices[name] = record
        guard()

    result = division_from_matrices(
        {j: inputs["Bbar__p_" + str(j)] for j in POWERS},
        {j: inputs["C" + str(j)] for j in POWERS},
        {0: inputs["J"], 1: inputs["K"]},
        divisor,
        guard=guard,
        check=check,
        sink=save,
    )
    require(
        tuple(matrices) == MATRIX_ORDER,
        "all registered outputs saved in dependency order",
    )
    metadata = dict(
        scalars=scalars,
        stats=stats,
        division_metadata=result["division_metadata"],
        acceptance=result["acceptance"],
        mutation=result["mutation"],
        domain=domain_metadata(),
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
    )
    for name in METADATA:
        guard()
        sink(name, metadata[name])
        guard()
    return dict(matrices=matrices, **metadata)

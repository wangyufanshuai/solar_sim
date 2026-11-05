"""One fixed exact compression candidate for accepted case12 N/M numerators.

Mathematical work belongs to the owned worker. The two manifest interfaces
use only stdlib source/AST/JSON/hash operations. Nonzero division remainders
remain complete saved evidence; no alternative factors or H are constructed.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARENT_DIRECTORY = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-projectors-controls-v1-20261014"
)
PARENT_GATE_SHA = "a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1"
PARENT_WORKER_SHA = "7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9"
SOURCE = "scripts/nr_case12_polynomial_blocks.py"
SOURCE_SHA = "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5"
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    SOURCE: SOURCE_SHA,
    "scripts/nr_case12_polynomial_spectral.py": "4e9dfc5058af58cbf94526d0846e314e3d7c054b1726e2184e9a8eba50ac13e8",
    "scripts/nr_case12_polynomial_projectors.py": "6c30478535aaf00f487a38d2d86bf1c3860d1cc2126706b5bf3397b997614ac0",
}
DOMAIN_INPUT = "parent-inputs/parent-inputs/parent-inputs/parent-inputs/domain.json"
DENOMINATORS_INPUT = (
    "parent-inputs/parent-inputs/parent-inputs/parent-inputs/denominators.json"
)
PARENT_INPUT_HASHES = {
    "NO.json": "e793c58bdab30af363d78eefd8b5653766d45f1f02c75931e841de22bf8f47ca",
    "N0.json": "fdad1ef56ce92021b7ca34526f0956e68b95df6d6e7af7c9243a4616b59ecdad",
    "N1.json": "c375f297857b872a3f86b0b7ca7a3c701a13fe36d94bdb1059bf3a4963f8591f",
    "N2.json": "3cbb10e3d7da08d9c792902d7b681b06b66d94be599d86fcc1b102da3803ad9d",
    "N3.json": "38dee61a2eb6af966d74c2b5eb8bac48d8e15cb066861bbeae3d85ce25eae02c",
    "N4.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "N5.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "N6.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M1.json": "449c8067b298053643fc7e0f9d92fd0e676aaa9afbfd5b1fb9f039d1bfd56c42",
    "M2.json": "493e050de6bee130b994ad1bea8b4107b09f19be25920cd64161732576a62a96",
    "M3.json": "ead204d80531be14d71eb67f1b9f0a0216427b74eefca7f4f54d84c90bbb7f26",
    "M4.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M5.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M6.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "scalars.json": "dcb929a44b67bf35f85adf5953c1200d6fca65caad791c6f849c074f813a3629",
    DOMAIN_INPUT: "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    DENOMINATORS_INPUT: "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
}
COMPONENTS = (
    "NO",
    "N0",
    "N1",
    "N2",
    "N3",
    "N4",
    "N5",
    "N6",
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
)
FACTOR_POWERS = {name: 5 if name.startswith("N") else 4 for name in COMPONENTS}
INPUT_CAPS = {name: 19 if name.startswith("N") else 16 for name in COMPONENTS}
OUTPUT_KINDS = ("quotient", "remainder", "multiplyback")
MATRIX_CAPS = {
    name + "_" + kind: (
        INPUT_CAPS[name] - 2 * FACTOR_POWERS[name]
        if kind == "quotient"
        else INPUT_CAPS[name]
    )
    for name in COMPONENTS
    for kind in OUTPUT_KINDS
}
MATRIX_ORDER = tuple(MATRIX_CAPS)
NEGATIVE_CAPS = {
    "mutation_N1_quotient": 9,
    "mutation_N1_remainder": 19,
    "mutation_N1_multiplyback": 19,
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == SOURCE_SHA,
        "frozen lex division source SHA mismatch",
    )


def translated_ast(source):
    """Bind unchanged division helpers; only _divide_scalar is called below."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=SOURCE)
    functions = ("_divide_scalar", "divide_matrix")
    selected = [
        copy.deepcopy(node)
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name in functions
    ]
    require(
        tuple(node.name for node in selected) == functions,
        "registered division helpers",
    )
    tree = ast.Module(body=selected, type_ignores=[])
    digest = hashlib.sha256(
        ast.dump(tree, include_attributes=False).encode()
    ).hexdigest()
    return tree, dict(
        source=SOURCE,
        source_sha256=SOURCE_SHA,
        functions=list(functions),
        edits=[],
        original_ast_sha256=digest,
        adapted_ast_sha256=digest,
        execution="unchanged _divide_scalar per entry; explicit complete matrix traversal",
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen compression dependency SHA mismatch: " + name,
        )


def _registered_profile():
    names = (
        "NO",
        "N0",
        "N1",
        "N2",
        "N3",
        "N4",
        "N5",
        "N6",
        "M1",
        "M2",
        "M3",
        "M4",
        "M5",
        "M6",
    )
    require(COMPONENTS == names, "fixed fourteen component order")
    require(
        FACTOR_POWERS == {name: 5 if name.startswith("N") else 4 for name in names},
        "fixed N/r^5 and M/r^4 factor profile",
    )
    require(
        INPUT_CAPS == {name: 19 if name.startswith("N") else 16 for name in names},
        "accepted parent degree profile",
    )


def source_bridge_manifest():
    """Stdlib-only source/AST manifest for worker and finalizer."""
    _registered_profile()
    _verify_dependencies()
    _, division = translated_ast((ROOT / SOURCE).read_bytes())
    return dict(
        schema="nr-case12-polynomial-compression-bridge-v1",
        division=division,
        dependencies=DEPENDENCIES.copy(),
        components=list(COMPONENTS),
        factor_powers=FACTOR_POWERS.copy(),
        input_degree_caps=INPUT_CAPS.copy(),
        monomial_order="lex",
        identity="original=factor*quotient+remainder; multiplyback=original-factor*quotient",
        factor_search=False,
        scope="one fixed N/r^5 and M/r^4 candidate; no H or energy proof",
    )


def _modules():
    _verify_dependencies()
    result = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen compression module path",
        )
        result.append(module)
    return tuple(result)


def build_context(*, guard=lambda: None):
    guard()
    manifest = source_bridge_manifest()
    *_, J = _modules()
    context = J.build_context(guard=guard)
    guard()
    return {**context, "source_bridge": manifest}


def _checked_ring(poly):
    P, *_ = _modules()
    P.canonical_polynomial(poly)
    require(str(poly.ring.order) == "lex", "registered lex polynomial ring required")
    return poly.ring


def _shape(matrix):
    require(
        getattr(matrix, "ndim", None) == 2
        and 1 <= matrix.shape[0] <= 43
        and 1 <= matrix.shape[1] <= 43,
        "bounded nonempty compression matrix",
    )
    return matrix.shape


def compress_matrix(matrix, factor, *, guard=lambda: None):
    """Pure algebra helper: preserve all failures; no parent theorem is conferred."""
    guard()
    _, _, C, B, _, _ = _modules()
    shape, ring = _shape(matrix), _checked_ring(factor)
    require(bool(factor), "nonzero compression factor")
    outputs = {name: C.zeros(*shape, ring) for name in OUTPUT_KINDS}
    identity_zero = remainder_zero = multiplyback_zero = normal = True
    for i, row in enumerate(matrix):
        guard()
        for j, value in enumerate(row):
            answer = B._divide_scalar(value, factor, ring)
            outputs["quotient"][i, j] = answer["quotient"]
            outputs["remainder"][i, j] = answer["remainder"]
            outputs["multiplyback"][i, j] = answer["multiplication_residual"]
            identity_zero = identity_zero and not bool(answer["division_identity"])
            remainder_zero = remainder_zero and not bool(answer["remainder"])
            multiplyback_zero = multiplyback_zero and not bool(
                answer["multiplication_residual"]
            )
            normal = normal and answer["normal_form_verified"]
    guard()
    leading = factor.leading_expv()
    coefficient = factor[leading]
    return dict(
        **outputs,
        division_identity_zero=identity_zero,
        remainder_zero=remainder_zero,
        multiplyback_zero=multiplyback_zero,
        normal_form_verified=normal,
        accepted=identity_zero and remainder_zero and multiplyback_zero and normal,
        monomial_order="lex",
        divisor_leading_exponent=list(leading),
        divisor_leading_coefficient=[
            str(coefficient.numerator),
            str(coefficient.denominator),
        ],
    )


def compress_components(
    components, r, *, guard=lambda: None, sink=lambda name, matrix: None
):
    """Apply only the fourteen registered divisors, retaining complete evidence."""
    guard()
    _registered_profile()
    ring = _checked_ring(r)
    require(bool(r), "nonzero direction polynomial")
    require(
        type(components) is dict and set(components) == set(COMPONENTS),
        "exact fourteen compression components",
    )
    shape = _shape(components[COMPONENTS[0]])
    require(
        all(_shape(components[name]) == shape for name in COMPONENTS),
        "matching component shapes",
    )
    factors = {4: r**4, 5: r**5}
    require(
        all(value.ring == ring for value in factors.values()), "registered factor ring"
    )
    matrices, rows = {}, []
    for name in COMPONENTS:
        guard()
        result = compress_matrix(
            components[name], factors[FACTOR_POWERS[name]], guard=guard
        )
        for kind in OUTPUT_KINDS:
            key = name + "_" + kind
            matrices[key] = result[kind]
            guard()
            sink(key, matrices[key])
            guard()
        rows.append(
            dict(
                name=name,
                factor_power=FACTOR_POWERS[name],
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
            )
        )
    acceptance = dict(
        division_identity=all(row["division_identity_zero"] for row in rows),
        remainder_zero=all(row["remainder_zero"] for row in rows),
        multiplyback_zero=all(row["multiplyback_zero"] for row in rows),
        remainder_normal_form=all(row["normal_form_verified"] for row in rows),
    )
    acceptance["accepted"] = all(acceptance.values())
    return dict(
        matrices=matrices,
        division_metadata=dict(
            schema="nr-case12-compression-divisions-v1", monomial_order="lex", rows=rows
        ),
        acceptance=acceptance,
    )


def mutation_witness(N1, r, *, guard=lambda: None, sink=lambda name, matrix: None):
    """Real numerator perturbation, independent of the main candidate decision."""
    guard()
    ring = _checked_ring(r)
    _shape(N1)
    require(bool(r), "nonzero mutation factor")
    require(
        all(isinstance(value, ring.dtype) and value.ring == ring for value in N1.flat),
        "same-ring mutation input",
    )
    mutant = N1.copy()
    mutant[0, 0] = mutant[0, 0] + ring.one
    result = compress_matrix(mutant, r**5, guard=guard)
    matrices = {}
    for kind in OUTPUT_KINDS:
        name = "mutation_N1_" + kind
        matrices[name] = result[kind]
        guard()
        sink(name, matrices[name])
        guard()
    counts = {
        kind + "_nonzero_slots": sum(bool(value) for value in result[kind].flat)
        for kind in ("remainder", "multiplyback")
    }
    counts.update(
        {
            kind + "_coefficients": sum(len(value) for value in result[kind].flat)
            for kind in ("remainder", "multiplyback")
        }
    )
    return dict(
        **matrices,
        matrices=matrices,
        mutation=dict(
            schema="nr-case12-compression-mutation-v1",
            name="add-one-to-N1-00",
            entry=[0, 0],
            division_identity_zero=result["division_identity_zero"],
            normal_form_verified=result["normal_form_verified"],
            **counts,
            rejected=bool(
                counts["remainder_nonzero_slots"]
                and counts["multiplyback_nonzero_slots"]
            )
            and result["division_identity_zero"]
            and result["normal_form_verified"],
        ),
    )


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "parent compression input SHA mismatch: " + str(path),
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-projectors-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["projector_family_validated"]
            is record["action_family_validated"]
            is True
            and record["errors"] == [],
            "complete accepted projector/action parent required",
        )
        require(
            all(
                record[key] is False
                for key in (
                    "physical_gate",
                    "live_admission",
                    "scientificPayloadWriteback",
                )
            ),
            "parent remains shadow-only",
        )
    require(
        worker["source_before"] == worker["source_after"],
        "projector parent source identity",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "projector parent worker identity",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "projector parent input identity"
        )
    for name, digest in DEPENDENCIES.items():
        require(
            worker["source_before"][name] == digest,
            "projector parent dependency identity",
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(),
        "registered projector parent directory only",
    )
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    guard()
    return records, dict(
        schema="nr-case12-polynomial-compression-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        projector_parent_passed=True,
        projectors_rebuilt=False,
        spectral_chain_rebuilt=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Stdlib-only JSON/hash parent binding; no scientific imports."""
    return load_parent(parent_directory)[1]


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C, _, _, _ = _modules()
    field = context["field"]
    require(
        records[DOMAIN_INPUT] == context["domain"],
        "accepted fixed-case12 parent domain",
    )
    raw = records["scalars.json"]
    require(set(raw) == {"r", "g", "d", "D", "eta"}, "complete projector scalar schema")

    def decode(terms, cap):
        guard()
        values = V.decode_polynomial(terms, max_degree=cap)
        return field.ring.from_dict(
            {powers: field.domain.convert(value) for powers, value in values.items()}
        )

    r, g = decode(raw["r"], 2), decode(raw["g"], 2)
    require(
        r == P.polynomial(context["r"], field, max_degree=2)
        and g == P.polynomial(context["g"], field, max_degree=2),
        "source-bound direction polynomials",
    )
    factor_N, factor_M = r**5, r**4
    Dbar, etabar = r * g**3, r * g**2
    require(
        decode(raw["d"], 6) == r**2 * g
        and decode(raw["D"], 18) == factor_N * Dbar
        and decode(raw["eta"], 14) == factor_M * etabar,
        "accepted denominator compression identities",
    )
    denominators = records[DENOMINATORS_INPUT]
    require(
        set(denominators) == {"r", "g", "delta", "section_denominator"},
        "complete ancestor denominator schema",
    )
    require(
        denominators["r"] == raw["r"] and denominators["g"] == raw["g"],
        "ancestor direction denominator identity",
    )
    components = {}
    for name in COMPONENTS:
        guard()
        components[name] = C._to_matrix(
            records[name + ".json"], field, (43, 43), INPUT_CAPS[name], guard
        )
    stats = {}

    def save(name, matrix):
        guard()
        stats[name] = C.matrix_stats(matrix, MATRIX_CAPS[name])
        guard()
        sink(name, matrix)
        guard()

    result = compress_components(components, r, guard=guard, sink=save)

    def save_negative(name, matrix):
        guard()
        C.matrix_stats(matrix, NEGATIVE_CAPS[name])
        guard()
        sink(name, matrix)
        guard()

    negative = mutation_witness(components["N1"], r, guard=guard, sink=save_negative)
    scalars = dict(
        r=r,
        g=g,
        factor_N=factor_N,
        factor_M=factor_M,
        Dbar=Dbar,
        etabar=etabar,
        taubar=r * Dbar**2,
    )
    return dict(
        **result,
        context=context,
        **scalars,
        scalars={
            name: P.canonical_polynomial(value) for name, value in scalars.items()
        },
        **{name: negative[name] for name in NEGATIVE_CAPS},
        mutation=negative["mutation"],
        stats=stats,
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
        domain=records[DOMAIN_INPUT],
        monomial_order="lex",
        factor_search=False,
        projectors_rebuilt=False,
        energy_constructed=False,
        direction_uniform_energy_proved=False,
        candidate_scope="fixed-case12 exact N/r^5 and M/r^4 compression only",
    )

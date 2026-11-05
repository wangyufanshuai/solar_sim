"""Fixed-case12 nonzero-frequency physical right-section candidate.

Import and manifests use only stdlib metadata. Exact polynomial arithmetic is
lazy and belongs to an owned worker. No physical zero-frequency inverse, full
frequency closure, low-frequency energy, or boundary result is asserted here.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTION_PARENT = "nr-k3-case12-polynomial-section-controls-v1-20261014"
COORDINATE_PARENT = "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"
PARENT_GATES = {
    SECTION_PARENT: dict(
        gate_sha256="d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be",
        worker_sha256="2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d",
    ),
    COORDINATE_PARENT: dict(
        gate_sha256="466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
        worker_sha256="9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    ),
}
PARENT_FILES = {
    "section_gate.json": dict(
        directory=SECTION_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[SECTION_PARENT]["gate_sha256"],
    ),
    "section_worker.json": dict(
        directory=SECTION_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[SECTION_PARENT]["worker_sha256"],
    ),
    "section_replay.json": dict(
        directory=SECTION_PARENT,
        path="independent-replay.json",
        sha256="5b9bef59ed458795d457230aeecd974b62993e0a41e202d9e86eb995d98ad0f9",
    ),
    "s.json": dict(
        directory=SECTION_PARENT,
        path="Stilde.json",
        sha256="4cc71b2444457be762cc5521fbac286637cf05dd3e4dbcb9946d641e1097c880",
    ),
    "d.json": dict(
        directory=SECTION_PARENT,
        path="Dtilde.json",
        sha256="c23e90a84fd2567f2a3da4ec009d022448eca985a6324a26f79d8dc7357070ba",
    ),
    "domain.json": dict(
        directory=SECTION_PARENT,
        path="domain.json",
        sha256="a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    ),
    "denominators.json": dict(
        directory=SECTION_PARENT,
        path="denominators.json",
        sha256="2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    ),
    "coordinate_gate.json": dict(
        directory=COORDINATE_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[COORDINATE_PARENT]["gate_sha256"],
    ),
    "coordinate_worker.json": dict(
        directory=COORDINATE_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[COORDINATE_PARENT]["worker_sha256"],
    ),
    "coordinate_replay.json": dict(
        directory=COORDINATE_PARENT,
        path="independent-replay.json",
        sha256="7751521463cdade0039d8e36b405dac40f8faca3b98c9b02100c75165e370104",
    ),
    "coordinate_source_bridge.json": dict(
        directory=COORDINATE_PARENT,
        path="source_bridge.json",
        sha256="9081f843df45d334fa98573479c413ad241e59ea85aa6b96b5359713c32b221d",
    ),
    "coordinate_stats.json": dict(
        directory=COORDINATE_PARENT,
        path="stats.json",
        sha256="d51e8dd0086964625df469f3e805a0ba9c8311fdae41f86e59a705d14466355f",
    ),
    "C0.json": dict(
        directory=COORDINATE_PARENT,
        path="C0.json",
        sha256="87d85210d4d0bae1b77278657bc0277711778332de32c0cfde4b61958d5df053",
    ),
    "C1.json": dict(
        directory=COORDINATE_PARENT,
        path="C1.json",
        sha256="f396ff86998f987246af4a92844cae3944cc265418116f7f1a3dacfc3d7f4a65",
    ),
    "C2.json": dict(
        directory=COORDINATE_PARENT,
        path="C2.json",
        sha256="b54ada626e3fd69d337d2a7a1b8f04d10ea44e1c72533e81741b354b26acdd21",
    ),
    "F.json": dict(
        directory=COORDINATE_PARENT,
        path="rTC__p_m1.json",
        sha256="945161962e5c5f5bbc81835aeb48a59a66525b150bc5c5d4fd3a2a589d744125",
    ),
    "t__p_m1.json": dict(
        directory=COORDINATE_PARENT,
        path="rT__p_m1.json",
        sha256="d1edaa7516d99e2386ef2ccd77c237550e6554fb1a94378b3b852ca3f1472460",
    ),
    "t__p_0.json": dict(
        directory=COORDINATE_PARENT,
        path="rT__p_0.json",
        sha256="7fc024f496fafafcebbaac26e4b3dffd9991626def5cc734e05152f220e135ec",
    ),
    "t__p_1.json": dict(
        directory=COORDINATE_PARENT,
        path="rT__p_1.json",
        sha256="6dac5f5b512ca1fe0fe21cebce9a1959edf6a2591a98b650addc1128fbeb5233",
    ),
    "t__p_2.json": dict(
        directory=COORDINATE_PARENT,
        path="rT__p_2.json",
        sha256="9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    ),
}
SOURCE_HASHES = {
    "scripts/nr_constraint_direction_section.py": "e73b54e528e635f51dc1e25af2489068fad0b26e89e1c85940ca7515c8b476c0",
    "scripts/nr_constraint_exact_coefficients.py": "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    "scripts/nr_profile_exact_coefficients.py": "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
    "scripts/nr_constraint_full_symbol.py": "053b70dd9136117dcfc8f2045b9953dc5ece6bfdf382eb1da12f33b9b8446042",
    "scripts/nr_constraint_laurent_energy.py": "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
}
SOURCE_FUNCTIONS = {
    "scripts/nr_constraint_direction_section.py": ("lift", "section"),
    "scripts/nr_constraint_exact_coefficients.py": ("leading", "ode_projector"),
    "scripts/nr_profile_exact_coefficients.py": ("inverse", "case12"),
    "scripts/nr_constraint_full_symbol.py": ("physical_coefficients",),
    "scripts/nr_constraint_laurent_energy.py": ("factors", "bridge"),
}
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_physical_coordinate_bridge.py": "b69ec375a81ed04b22b438e90e56083afb706702d67a70fcef5eff032bff96f0",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
}
E_POWERS = (-2, -1, 0, 1, 2)
RESIDUAL_POWERS = (-2, -1, 0, 1, 2, 3, 4)
T_POWERS = (-1, 0, 1, 2)
C_POWERS = (0, 1, 2)


def matrix_name(family, power):
    require(type(family) is str and type(power) is int, "exact matrix name components")
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _matrix_specs():
    result = {"H": (43, 43, 8), "H_squared": (43, 43, 16)}
    for family in ("e", "right_inverse", "bad_e", "bad_right_inverse"):
        section = family in ("e", "bad_e")
        for power in range(-2, 3 if section else 5):
            result[matrix_name(family, power)] = (
                (58, 43, 19) if section else (43, 43, 21)
            )
    return result


MATRIX_SPECS = _matrix_specs()
MAIN_NAMES = tuple(name for name in MATRIX_SPECS if not name.startswith("bad_"))
NEGATIVE_NAMES = tuple(name for name in MATRIX_SPECS if name.startswith("bad_"))
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "mutation",
    "domain",
    "source_bridge",
    "parent_provenance",
)


def _registered_profile():
    for actual, expected in (
        (E_POWERS, (-2, -1, 0, 1, 2)),
        (RESIDUAL_POWERS, (-2, -1, 0, 1, 2, 3, 4)),
        (T_POWERS, (-1, 0, 1, 2)),
        (C_POWERS, (0, 1, 2)),
    ):
        require(
            type(actual) is tuple
            and actual == expected
            and all(type(p) is int for p in actual),
            "fixed complete Laurent supports",
        )
    require(
        type(MATRIX_SPECS) is dict
        and MATRIX_SPECS == _matrix_specs()
        and len(MATRIX_SPECS) == 26
        and all(
            type(spec) is tuple and all(type(n) is int for n in spec)
            for spec in MATRIX_SPECS.values()
        ),
        "fixed complete matrix shapes and degrees",
    )
    require(
        MAIN_NAMES
        == tuple(name for name in MATRIX_SPECS if not name.startswith("bad_"))
        and NEGATIVE_NAMES
        == tuple(name for name in MATRIX_SPECS if name.startswith("bad_")),
        "fixed main and negative matrix registration",
    )


def verify_source(raw, source_name):
    require(
        type(raw) is bytes
        and type(source_name) is str
        and source_name in SOURCE_HASHES,
        "registered original source bytes",
    )
    require(
        hashlib.sha256(raw).hexdigest() == SOURCE_HASHES[source_name],
        "frozen original formula SHA mismatch",
    )


def source_bridge_manifest():
    """Stdlib AST and byte binding only; original matrices are not rebuilt."""
    _registered_profile()
    bindings = {}
    for name, names in SOURCE_FUNCTIONS.items():
        raw = (ROOT / name).read_bytes()
        verify_source(raw, name)
        tree = ast.parse(raw.decode("utf-8"), filename=name)
        nodes = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in names
        ]
        require(
            {node.name for node in nodes} == set(names) and len(nodes) == len(names),
            "frozen original function coverage",
        )
        bindings[name] = dict(
            functions=[node.name for node in nodes],
            ast_sha256=hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest(),
            executed=False,
        )
    _verify_dependencies()
    return dict(
        schema="nr-case12-physical-right-section-source-v1",
        source_hashes=SOURCE_HASHES.copy(),
        bindings=bindings,
        dependencies=DEPENDENCIES.copy(),
        construction="H=F*s; e=s*(delta*I-zeta^-1*H)*t",
        storage_optimization="e_k=delta*(s*t_k)-(s*H)*t_(k+1)",
        arithmetic="frozen coordinate exact QQ[x,y,z] polynomial and Laurent helpers",
        original_formulas_rebuilt=False,
        general_symbolic_elimination=False,
        direction_sampling=False,
        complete_frequency_support=True,
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen helper SHA mismatch: " + name,
        )


def parent_provenance_manifest(parent_inputs):
    """Check only archived supplied bytes; no external parent directory reads."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "complete archived parent byte map",
    )
    records = {}
    for name, spec in PARENT_FILES.items():
        raw = parent_inputs[name]
        require(
            type(raw) is bytes and hashlib.sha256(raw).hexdigest() == spec["sha256"],
            "archived parent SHA mismatch: " + name,
        )
        records[name] = json.loads(raw)
    for prefix, directory, schema, flag in (
        (
            "section",
            SECTION_PARENT,
            "nr-case12-polynomial-section-controls-v1",
            "all_real_section_formula_checked",
        ),
        (
            "coordinate",
            COORDINATE_PARENT,
            "nr-case12-physical-coordinate-bridge-controls-v1",
            "physical_coordinate_bridge_validated",
        ),
    ):
        gate, worker, replay = (
            records[prefix + suffix + ".json"]
            for suffix in ("_gate", "_worker", "_replay")
        )
        for record in (gate, worker):
            require(
                record["schema"] == schema
                and record["passed"] is record["completed"] is record[flag] is True
                and record["errors"] == [],
                "accepted complete mathematical parent",
            )
            require(
                all(
                    record[name] is False
                    for name in (
                        "physical_gate",
                        "live_admission",
                        "scientificPayloadWriteback",
                    )
                ),
                "shadow-only mathematical parent",
            )
        require(
            gate["supervisor"]["cleanup_verified"] is True
            and worker["source_before"] == worker["source_after"],
            "cleaned unchanged parent source closure",
        )
        require(
            replay["passed"] is True and gate["replay"] == worker["replay"] == replay,
            "accepted saved independent parent replay",
        )
        for name, spec in PARENT_FILES.items():
            if (
                spec["directory"] == directory
                and spec["path"] != "qualification-gate.json"
            ):
                require(
                    gate["artifact_hashes"][spec["path"]] == spec["sha256"],
                    "parent artifact manifest binding: " + name,
                )
    section_replay = records["section_replay.json"]
    coordinate_replay = records["coordinate_replay.json"]
    require(
        section_replay["all_real_section_formula_checked"] is True
        and section_replay["residual_slots"] == 1849
        and section_replay["residual_coefficients"] == 0,
        "parent complete d*s=delta*I certificate",
    )
    require(
        coordinate_replay["matrix_count"] == 78
        and coordinate_replay["residual_slots"] == 82569
        and coordinate_replay["residual_nonzero_slots"] == 0
        and all(value is True for value in coordinate_replay["acceptance"].values()),
        "parent complete coordinate and inverse certificate",
    )
    worker = records["coordinate_worker.json"]
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES}.items():
        require(
            worker["source_before"][name] == digest,
            "latest accepted source ledger: " + name,
        )
    require(
        records["coordinate_source_bridge.json"]["source_hashes"]
        == {
            name: SOURCE_HASHES[name]
            for name in (
                "scripts/nr_constraint_full_symbol.py",
                "scripts/nr_constraint_laurent_energy.py",
                "scripts/nr_constraint_exact_coefficients.py",
                "scripts/nr_profile_exact_coefficients.py",
            )
        },
        "parent formula source identity",
    )
    require(
        coordinate_replay["actual_matrix_stats"] == records["coordinate_stats.json"],
        "parent complete coefficient statistics",
    )
    require(
        records["coordinate_stats.json"]["rTC__p_m1"]["degree_max"] == 2
        and records["coordinate_stats.json"]["rTC__p_m1"]["nonzero_slots"] == 99
        and records["coordinate_stats.json"]["rT__p_2"]["nonzero_slots"] == 0,
        "registered actual F bound and retained zero t2",
    )
    return dict(
        schema="nr-case12-physical-right-section-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        inherited_right_section_verified=True,
        inherited_coordinate_inverse_verified=True,
        external_parent_reads=False,
        parent_matrices_rebuilt=False,
        old_results_regraded=False,
    )


def _modules():
    _verify_dependencies()
    modules = tuple(
        importlib.import_module(name.removesuffix(".py").replace("/", "."))
        for name in DEPENDENCIES
    )
    for name, module in zip(DEPENDENCIES, modules, strict=True):
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen exact helper module path",
        )
    return modules


def build_context(*, guard=lambda: None):
    require(callable(guard), "callable resource guard")
    guard()
    manifest = source_bridge_manifest()
    P, _, _, _ = _modules()
    context = P.build_context(guard=guard)
    guard()
    return {**context, "ring": context["field"].ring, "source_bridge": manifest}


def right_section_from_matrices(
    F, s, t, C, delta, *, guard=lambda: None, check=None, sink=lambda name, matrix: None
):
    """Construct all registered coefficients, retaining algebraic failures.

    Small matching dimensions are accepted for controls. Sink matrices are
    complete and never subsequently mutated by this function.
    """
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable stage, deadline and sink controls",
    )
    _registered_profile()
    check = guard if check is None else check
    guard()
    _, _, E, _ = _modules()
    ring = E._matrix_ring(F)
    m, n = F.shape
    require(
        E._matrix_ring(s) == ring and s.shape == (n, m), "matching section dimensions"
    )
    E._scalar(delta, ring)
    require(bool(delta), "nonzero cleared denominator delta")
    tr, tshape = E._laurent(t)
    cr, cshape = E._laurent(C)
    require(
        tr == cr == ring
        and tshape == (m, m)
        and cshape == (m, n)
        and set(t) == set(T_POWERS)
        and set(C) == set(C_POWERS),
        "registered complete physical and transform supports",
    )
    matrices = {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "registered unique output matrix",
        )
        E._matrix_ring(matrix)
        sink(name, matrix)
        matrices[name] = matrix
        guard()

    def mul(a, b):
        check()
        result = E._product(a, b, guard=check)
        check()
        return result

    H = mul(F, s)
    save("H", H)
    H_squared = mul(H, H)
    save("H_squared", H_squared)
    sh = mul(s, H)
    e, bad_e = {}, {}
    for power in E_POWERS:
        guard()
        base = (
            E._scale(mul(s, t[power]), delta, guard=check)
            if power in t
            else E.zeros(n, m, ring)
        )
        correction = mul(sh, t[power + 1]) if power + 1 in t else E.zeros(n, m, ring)
        bad_e[power] = base
        e[power] = base - correction
        save(matrix_name("e", power), e[power])
    delta_squared = delta * delta

    def residuals(section, family):
        result = E.laurent_product(C, section, guard=check, stage=lambda power: guard())
        require(
            set(result) == set(RESIDUAL_POWERS),
            "complete physical right-inverse convolution",
        )
        for i in range(m):
            result[0][i, i] -= delta_squared
        for power in RESIDUAL_POWERS:
            save(matrix_name(family, power), result[power])
        return result

    residual = residuals(e, "right_inverse")
    for power in E_POWERS:
        save(matrix_name("bad_e", power), bad_e[power])
    bad_residual = residuals(bad_e, "bad_right_inverse")
    bad_nonzero = sum(
        bool(poly) for matrix in bad_residual.values() for poly in matrix.flat
    )
    bad_terms = sum(
        len(poly) for matrix in bad_residual.values() for poly in matrix.flat
    )
    mutation = dict(
        schema="nr-case12-physical-right-section-mutation-v1",
        name="omit-negative-frequency-correction",
        changed_formula="bad_e=s*delta*t",
        residual_powers=list(RESIDUAL_POWERS),
        residual_nonzero_slots=bad_nonzero,
        residual_coefficients=bad_terms,
        rejected=bad_nonzero > 0,
    )
    acceptance = dict(
        nilpotence=not any(H_squared.flat),
        physical_right_inverse=not any(
            poly for matrix in residual.values() for poly in matrix.flat
        ),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    guard()
    return dict(matrices=matrices, acceptance=acceptance, mutation=mutation)


def domain_metadata():
    return dict(
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
    P, Cmod, E, V = _modules()
    field, ring = context["field"], context["ring"]
    require(
        records["domain.json"] == context["domain"],
        "inherited fixed positive direction domain",
    )
    require(
        set(records["denominators.json"]) == {"r", "g", "delta", "section_denominator"},
        "inherited denominator record shape",
    )
    polys = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        value = V.decode_polynomial(records["denominators.json"][name], max_degree=cap)
        polys[name] = ring.from_dict(
            {
                power: ring.domain.convert(coefficient)
                for power, coefficient in value.items()
            }
        )
    require(
        polys["r"] == P.polynomial(context["r"], field)
        and polys["g"] == P.polynomial(context["g"], field)
        and polys["delta"] == P.polynomial(context["delta"], field)
        and polys["section_denominator"]
        == P.polynomial(context["section_denominator"], field)
        and polys["r"] * polys["section_denominator"] == polys["delta"],
        "exact source-bound denominator identities",
    )
    inputs = {}
    for name, shape, cap in (
        ("s", (58, 43), 6),
        ("d", (43, 58), 3),
        ("F", (43, 58), 2),
        *(("C" + str(i), (43, 58), i) for i in C_POWERS),
        *(
            (matrix_name("t", p), (43, 43), cap)
            for p, cap in zip(T_POWERS, (2, 3, 4, 5), strict=True)
        ),
    ):
        guard()
        inputs[name] = Cmod._to_matrix(
            records[name + ".json"], field, shape, cap, check
        )
    require(
        not any(inputs[matrix_name("t", 2)].flat),
        "parent highest transform power retained as complete zero",
    )
    # d is decoded/bound, while d*s=delta*I is inherited from its accepted
    # full certificate instead of silently running a second principal proof.
    stats, matrices = {}, {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "unique complete saved polynomial matrix",
        )
        rows, columns, cap = MATRIX_SPECS[name]
        require(matrix.shape == (rows, columns), "full registered matrix dimensions")
        stats[name] = Cmod.matrix_stats(matrix, cap)
        record = P.encode_matrix(matrix, guard=check)
        guard()
        sink(name, record)
        matrices[name] = record
        guard()

    result = right_section_from_matrices(
        inputs["F"],
        inputs["s"],
        {p: inputs[matrix_name("t", p)] for p in T_POWERS},
        {p: inputs["C" + str(p)] for p in C_POWERS},
        polys["delta"],
        guard=guard,
        check=check,
        sink=save,
    )
    require(
        set(matrices) == set(MATRIX_SPECS),
        "all complete main and negative matrices saved",
    )
    metadata = dict(
        scalars={
            "r": P.canonical_polynomial(polys["r"]),
            "g": P.canonical_polynomial(polys["g"]),
            "sigma": P.canonical_polynomial(polys["section_denominator"]),
            "delta": P.canonical_polynomial(polys["delta"]),
            "delta_squared": P.canonical_polynomial(polys["delta"] * polys["delta"]),
        },
        stats=stats,
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

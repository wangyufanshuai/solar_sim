"""Fixed-case12 complete-frequency physical closure candidate.

Only owned workers evaluate exact polynomial arithmetic. Source/parent manifests
use stdlib bytes, JSON and AST. Accepted parent matrices are never rebuilt. All
Laurent coefficients, including failed and negative-control coefficients, are
retained. This is not a lower-order energy, local PDE or nonlinear certificate.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RIGHT_PARENT = "nr-k3-case12-physical-right-section-controls-v1-20261015"
COORDINATE_PARENT = "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"
PRINCIPAL_PARENT = "nr-k3-case12-polynomial-closure-controls-v1-20261014"
PARENT_GATES = {
    RIGHT_PARENT: dict(
        gate_sha256="3533a207230fe823eb9774b4ca46ae3dccc14287fe38cc7b0d70d9af30e0822a",
        worker_sha256="75948ceb52f6443dbef91fb5413a7f60b718df614c6ca09dbc104c013ba1ab59",
    ),
    COORDINATE_PARENT: dict(
        gate_sha256="466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
        worker_sha256="9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    ),
    PRINCIPAL_PARENT: dict(
        gate_sha256="3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1",
        worker_sha256="c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2",
    ),
}
PARENT_FILES = {
    "right_gate.json": dict(
        directory=RIGHT_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[RIGHT_PARENT]["gate_sha256"],
    ),
    "right_worker.json": dict(
        directory=RIGHT_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[RIGHT_PARENT]["worker_sha256"],
    ),
    "right_replay.json": dict(
        directory=RIGHT_PARENT,
        path="independent-replay.json",
        sha256="5fa63eaccf19cd138f2bd053d22c2183217b5e068b576f691ee509bc9462d055",
    ),
    "right_domain.json": dict(
        directory=RIGHT_PARENT,
        path="domain.json",
        sha256="5246d11d2d899dd637b915cb3e6bb8f98a768e3d7d18891d8a00292e1adfc81a",
    ),
    "right_scalars.json": dict(
        directory=RIGHT_PARENT,
        path="scalars.json",
        sha256="316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5",
    ),
    "right_source_bridge.json": dict(
        directory=RIGHT_PARENT,
        path="source_bridge.json",
        sha256="9f7e35f0950dbfb34e5163d84eec8049d673721b5d4b5ea2f0d9e4e344a597e4",
    ),
    "e__p_m2.json": dict(
        directory=RIGHT_PARENT,
        path="e__p_m2.json",
        sha256="457e8ea6b1afcf9a02cfc08744ea0f2259a1d73d2535a5dd57d4ce7b5c9d3340",
    ),
    "e__p_m1.json": dict(
        directory=RIGHT_PARENT,
        path="e__p_m1.json",
        sha256="917ddd8d968eb30c7dfbd967d77fae3d4b421b89927aab1b155d94dc2702c30d",
    ),
    "e__p_0.json": dict(
        directory=RIGHT_PARENT,
        path="e__p_0.json",
        sha256="ca4b9bee338173636c091c08be312afb27e53d4e2ab75496c659f3a9d18e64d1",
    ),
    "e__p_1.json": dict(
        directory=RIGHT_PARENT,
        path="e__p_1.json",
        sha256="4bbc7c158130856b325f46e7c075cc23f6481e17880f7666c0fca5ef0483d4bb",
    ),
    "e__p_2.json": dict(
        directory=RIGHT_PARENT,
        path="e__p_2.json",
        sha256="a58e1066b6ce60a2e68ada0364e988c204aaf4c96d1e687c2988d6e9c1cec0b7",
    ),
    "domain.json": dict(
        directory=RIGHT_PARENT,
        path="parent-inputs/domain.json",
        sha256="a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    ),
    "denominators.json": dict(
        directory=RIGHT_PARENT,
        path="parent-inputs/denominators.json",
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
    "J.json": dict(
        directory=COORDINATE_PARENT,
        path="J.json",
        sha256="19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b",
    ),
    "principal_gate.json": dict(
        directory=PRINCIPAL_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[PRINCIPAL_PARENT]["gate_sha256"],
    ),
    "principal_worker.json": dict(
        directory=PRINCIPAL_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[PRINCIPAL_PARENT]["worker_sha256"],
    ),
    "principal_replay.json": dict(
        directory=PRINCIPAL_PARENT,
        path="independent-replay.json",
        sha256="1dbb0840dda60ca0c7e9958807998031325421e60623ab1f66407d2fe625bde9",
    ),
    "principal_source_bridge.json": dict(
        directory=PRINCIPAL_PARENT,
        path="source_bridge.json",
        sha256="9f465ee64e0e34f19a8ffc50a158ef94beee28c137c513d695f8044d8b89eb02",
    ),
    "K.json": dict(
        directory=PRINCIPAL_PARENT,
        path="K.json",
        sha256="e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
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
    "scripts/nr_profile_exact_coefficients.py": ("principal_rates", "matrix"),
    "scripts/nr_constraint_full_symbol.py": ("source", "physical_coefficients"),
    "scripts/nr_constraint_laurent_energy.py": ("factors", "bridge"),
}
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_physical_coordinate_bridge.py": "b69ec375a81ed04b22b438e90e56083afb706702d67a70fcef5eff032bff96f0",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
}
RIGHT_SOURCE = "scripts/nr_case12_physical_right_section.py"
RIGHT_SOURCE_SHA = "23b463021437307251148f8e784bd7679cb388055d125ac95cd1323c5480791d"
C_POWERS = (0, 1, 2)
L_POWERS = (0, 1)
E_POWERS = (-2, -1, 0, 1, 2)
B_POWERS = (-2, -1, 0, 1, 2, 3, 4, 5)
RESIDUAL_POWERS = (-2, -1, 0, 1, 2, 3, 4, 5, 6, 7)
FORBIDDEN_POWERS = (-2, -1, 3, 4, 5)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def matrix_name(family, power):
    require(type(family) is str and type(power) is int, "exact matrix name components")
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def _matrix_specs():
    result = {}
    for family, powers, shape in (
        ("Bbar", range(-2, 6), (43, 43, 22)),
        ("closure", range(-2, 8), (43, 58, 24)),
    ):
        for power in powers:
            result[matrix_name(family, power)] = shape
    result["delta_J"] = (58, 58, 0)
    for family, powers, shape in (
        ("delta_Bbar", range(-2, 6), (43, 43, 22)),
        ("mutated_closure", range(-2, 8), (43, 58, 24)),
    ):
        for power in powers:
            result[matrix_name(family, power)] = shape
    return result


MATRIX_SPECS = _matrix_specs()
MAIN_NAMES = tuple(
    name for name in MATRIX_SPECS if name.startswith(("Bbar__", "closure__"))
)
NEGATIVE_NAMES = tuple(name for name in MATRIX_SPECS if name not in MAIN_NAMES)
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
        (C_POWERS, (0, 1, 2)),
        (L_POWERS, (0, 1)),
        (E_POWERS, (-2, -1, 0, 1, 2)),
        (B_POWERS, tuple(range(-2, 6))),
        (RESIDUAL_POWERS, tuple(range(-2, 8))),
        (FORBIDDEN_POWERS, (-2, -1, 3, 4, 5)),
    ):
        require(
            type(actual) is tuple
            and actual == expected
            and all(type(p) is int for p in actual),
            "fixed complete closure supports",
        )
    require(
        type(MATRIX_SPECS) is dict
        and MATRIX_SPECS == _matrix_specs()
        and len(MATRIX_SPECS) == 37
        and all(
            type(spec) is tuple and all(type(n) is int for n in spec)
            for spec in MATRIX_SPECS.values()
        ),
        "fixed closure matrix shapes and degree bounds",
    )
    require(
        MAIN_NAMES
        == tuple(
            name for name in MATRIX_SPECS if name.startswith(("Bbar__", "closure__"))
        )
        and NEGATIVE_NAMES
        == tuple(name for name in MATRIX_SPECS if name not in MAIN_NAMES),
        "complete main and mutation output registration",
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


def _verify_dependencies():
    for name, digest in {**DEPENDENCIES, RIGHT_SOURCE: RIGHT_SOURCE_SHA}.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Pure stdlib binding of original formulas and accepted arithmetic helpers."""
    _registered_profile()
    _verify_dependencies()
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
            "complete original formula function coverage",
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
    return dict(
        schema="nr-case12-physical-closure-source-v1",
        source_hashes=SOURCE_HASHES.copy(),
        bindings=bindings,
        dependencies=DEPENDENCIES.copy(),
        right_section_source=dict(path=RIGHT_SOURCE, sha256=RIGHT_SOURCE_SHA),
        generator="J+zeta*K",
        principal_shift_retained=True,
        geometric=False,
        construction="Bbar=(C*L)*e; R=Bbar*C-delta_squared*C*L",
        mutation_construction="R_mut=R+(C*delta_J*e)*C-delta_squared*C*delta_J",
        arithmetic="frozen coordinate exact QQ[x,y,z] and complete Laurent convolution",
        original_matrices_rebuilt=False,
        general_symbolic_elimination=False,
        direction_sampling=False,
        direction_denominator_division_executed=False,
    )


def parent_provenance_manifest(parent_inputs):
    """All parent checks use supplied immutable bytes, never external reads."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "complete archived mathematical parent inputs",
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
            "right",
            RIGHT_PARENT,
            "nr-case12-physical-right-section-controls-v1",
            "physical_nonzero_frequency_right_section_validated",
        ),
        (
            "coordinate",
            COORDINATE_PARENT,
            "nr-case12-physical-coordinate-bridge-controls-v1",
            "physical_coordinate_bridge_validated",
        ),
        (
            "principal",
            PRINCIPAL_PARENT,
            "nr-case12-polynomial-closure-controls-v1",
            "all_direction_closure_validated",
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
                "accepted complete mathematical parent required",
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
                "shadow-only accepted parents",
            )
        require(
            gate["supervisor"]["cleanup_verified"] is True
            and worker["source_before"] == worker["source_after"],
            "cleaned parent and unchanged source ledger",
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
                    "parent full artifact manifest binding: " + name,
                )
    right, coordinate, principal = (
        records[prefix + "_replay.json"]
        for prefix in ("right", "coordinate", "principal")
    )
    require(
        right["matrix_count"] == 26
        and right["residual_slots"] == 14792
        and right["residual_nonzero_slots"] == 0
        and all(value is True for value in right["acceptance"].values()),
        "accepted complete physical right-section identity",
    )
    require(
        coordinate["matrix_count"] == 78
        and coordinate["residual_slots"] == 82569
        and coordinate["residual_nonzero_slots"] == 0
        and all(value is True for value in coordinate["acceptance"].values()),
        "accepted original physical coordinate formulas",
    )
    require(
        principal["all_direction_closure_validated"] is True
        and principal["closure_slots"] == 2494
        and principal["closure_coefficients"] == 0,
        "accepted original full58 principal source",
    )
    worker = records["right_worker.json"]
    for name, digest in {
        **SOURCE_HASHES,
        **DEPENDENCIES,
        RIGHT_SOURCE: RIGHT_SOURCE_SHA,
    }.items():
        require(
            worker["source_before"][name] == digest,
            "latest accepted complete source ledger: " + name,
        )
    require(
        records["right_source_bridge.json"]["source_hashes"] == SOURCE_HASHES,
        "inherited right-section formula identities",
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
        "inherited physical source identities",
    )
    principal_source = records["principal_source_bridge.json"]["principal"]
    require(
        principal_source["source_sha256"]
        == SOURCE_HASHES["scripts/nr_profile_exact_coefficients.py"]
        and principal_source["functions"] == ["principal_rates", "matrix"]
        and principal_source["executed_geometric"] is False
        and principal_source["edits"] == [],
        "original shift-retaining principal K; geometric=False",
    )
    require(
        records["right_domain.json"]["frequency"] == "complex-nonzero"
        and records["right_domain.json"]["denominator_lower_over_r8"] == "1/4"
        and records["right_domain.json"]["full43_zero_frequency_right_inverse_exists"]
        is False,
        "right-section nonzero-frequency scope retained",
    )
    return dict(
        schema="nr-case12-physical-closure-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        inherited_physical_right_section_verified=True,
        original_shift_principal_retained=True,
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


def closure_from_matrices(
    C,
    L,
    e,
    delta_squared,
    delta_J,
    *,
    guard=lambda: None,
    check=None,
    sink=lambda name, matrix: None,
):
    """Full coefficient closure and actual source mutation, including failure.

    Generic matching small matrices support controls. Each sink receives a
    complete matrix which this function never subsequently modifies.
    """
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable stage, deadline and sink controls",
    )
    _registered_profile()
    check = guard if check is None else check
    guard()
    _, _, E, _ = _modules()
    ring, cshape = E._laurent(C)
    lr, lshape = E._laurent(L)
    er, eshape = E._laurent(e)
    m, n = cshape
    require(
        lr == er == ring
        and lshape == (n, n)
        and eshape == (n, m)
        and set(C) == set(C_POWERS)
        and set(L) == set(L_POWERS)
        and set(e) == set(E_POWERS),
        "matching complete physical generator/right-section series",
    )
    E._scalar(delta_squared, ring)
    require(bool(delta_squared), "nonzero cleared denominator polynomial")
    require(
        E._matrix_ring(delta_J) == ring and delta_J.shape == (n, n),
        "exact source perturbation matching generator",
    )
    matrices = {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "registered unique complete closure output",
        )
        E._matrix_ring(matrix)
        sink(name, matrix)
        matrices[name] = matrix
        guard()

    def convolution(a, b):
        guard()
        result = E.laurent_product(a, b, guard=check, stage=lambda power: guard())
        guard()
        return result

    def scaled(matrix):
        check()
        result = E._scale(matrix, delta_squared, guard=check)
        check()
        return result

    cl = convolution(C, L)
    bbar = convolution(cl, e)
    require(set(bbar) == set(B_POWERS), "complete Bbar candidate powers")
    for power in B_POWERS:
        save(matrix_name("Bbar", power), bbar[power])
    bbar_c = convolution(bbar, C)
    require(set(bbar_c) == set(RESIDUAL_POWERS), "complete closure residual support")
    residual = {}
    for power in RESIDUAL_POWERS:
        residual[power] = bbar_c[power] - (
            scaled(cl[power]) if power in cl else E.zeros(m, n, ring)
        )
        save(matrix_name("closure", power), residual[power])
    save("delta_J", delta_J.copy())
    cdj = convolution(C, {0: delta_J})
    delta_bbar = convolution(cdj, e)
    require(
        set(delta_bbar) == set(range(-2, 5)),
        "natural source-perturbation candidate powers",
    )
    delta_bbar[5] = E.zeros(m, m, ring)
    for power in B_POWERS:
        save(matrix_name("delta_Bbar", power), delta_bbar[power])
    delta_bbar_c = convolution(delta_bbar, C)
    require(
        set(delta_bbar_c) == set(RESIDUAL_POWERS),
        "complete source-perturbed closure powers",
    )
    mutated, changes = {}, {}
    for power in RESIDUAL_POWERS:
        changes[power] = delta_bbar_c[power] - (
            scaled(cdj[power]) if power in cdj else E.zeros(m, n, ring)
        )
        mutated[power] = residual[power] + changes[power]
        save(matrix_name("mutated_closure", power), mutated[power])
    delta_entries = [
        (i, j) for i, row in enumerate(delta_J) for j, poly in enumerate(row) if poly
    ]
    residual_nonzero = sum(
        bool(poly) for matrix in mutated.values() for poly in matrix.flat
    )
    change_nonzero = sum(
        bool(poly) for matrix in changes.values() for poly in matrix.flat
    )
    mutation = dict(
        schema="nr-case12-physical-closure-mutation-v1",
        name="theta-driver-source-feedback",
        source_matrix="delta_J",
        entry=list(delta_entries[0]) if len(delta_entries) == 1 else None,
        delta_Bbar_powers=list(B_POWERS),
        closure_powers=list(RESIDUAL_POWERS),
        baseline_residual_preserved=True,
        delta_nonzero_slots=len(delta_entries),
        residual_nonzero_slots=residual_nonzero,
        residual_coefficients=sum(
            len(poly) for matrix in mutated.values() for poly in matrix.flat
        ),
        change_nonzero_slots=change_nonzero,
        rejected=bool(delta_entries) and residual_nonzero > 0 and change_nonzero > 0,
    )
    acceptance = dict(
        registered_frequency_degree=not any(
            poly for power in FORBIDDEN_POWERS for poly in bbar[power].flat
        ),
        full_state_closure=not any(
            poly for matrix in residual.values() for poly in matrix.flat
        ),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    guard()
    return dict(matrices=matrices, acceptance=acceptance, mutation=mutation)


def domain_metadata():
    return dict(
        schema="nr-case12-physical-closure-domain-v1",
        fixed_case=12,
        direction="real-nonzero",
        frequency="complex-all-after-acceptance",
        generator="J+zeta*K",
        principal_shift_retained=True,
        g_lower_over_r="5/6",
        chi="18/25",
        denominator="delta_squared=chi^2*r^4*g^4",
        denominator_lower_over_r8="1/4",
        rational_direction_coefficients=True,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        zero_frequency_off_image_unique=False,
        local_differential_closure_proved=False,
        low_frequency_uniform_energy_proved=False,
        nonlinear_closure_proved=False,
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
        "inherited positive fixed case12 direction domain",
    )
    denominator_records = records["denominators.json"]
    require(
        set(denominator_records) == {"r", "g", "delta", "section_denominator"},
        "complete inherited denominator record",
    )
    polys = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        decoded = V.decode_polynomial(denominator_records[name], max_degree=cap)
        polys[name] = ring.from_dict(
            {power: ring.domain.convert(value) for power, value in decoded.items()}
        )
        require(
            polys[name] == P.polynomial(context[name], field),
            "source-bound positive direction denominator: " + name,
        )
    require(
        polys["r"] * polys["section_denominator"] == polys["delta"],
        "exact r*sigma=delta identity",
    )
    delta_squared = polys["delta"] * polys["delta"]
    scalars = {
        "r": P.canonical_polynomial(polys["r"]),
        "g": P.canonical_polynomial(polys["g"]),
        "sigma": P.canonical_polynomial(polys["section_denominator"]),
        "delta": P.canonical_polynomial(polys["delta"]),
        "delta_squared": P.canonical_polynomial(delta_squared),
    }
    require(
        json.dumps(scalars, sort_keys=True, separators=(",", ":"))
        == json.dumps(
            records["right_scalars.json"], sort_keys=True, separators=(",", ":")
        ),
        "parent physical right-section scalar identity",
    )
    inputs = {}
    input_specs = [("C" + str(p), (43, 58), p) for p in C_POWERS]
    input_specs += [("J", (58, 58), 0), ("K", (58, 58), 1)]
    input_specs += [(matrix_name("e", p), (58, 43), 19) for p in E_POWERS]
    for name, shape, cap in input_specs:
        guard()
        inputs[name] = Cmod._to_matrix(
            records[name + ".json"], field, shape, cap, check
        )
    require(
        not any(inputs["K"][:11, :].flat)
        and not any(inputs["K"][:, :11].flat)
        and all(sum(power) == 1 for poly in inputs["K"].flat for power in poly),
        "original homogeneous degree-one principal K with eleven base zero rows/columns",
    )
    delta_J = E.zeros(58, 58, ring)
    delta_J[18, 22] = ring.one
    matrices, stats = {}, {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "unique registered saved closure matrix",
        )
        rows, columns, cap = MATRIX_SPECS[name]
        require(
            matrix.shape == (rows, columns), "complete scientific matrix dimensions"
        )
        stats[name] = Cmod.matrix_stats(matrix, cap)
        record = P.encode_matrix(matrix, guard=check)
        guard()
        sink(name, record)
        matrices[name] = record
        guard()

    result = closure_from_matrices(
        {p: inputs["C" + str(p)] for p in C_POWERS},
        {0: inputs["J"], 1: inputs["K"]},
        {p: inputs[matrix_name("e", p)] for p in E_POWERS},
        delta_squared,
        delta_J,
        guard=guard,
        check=check,
        sink=save,
    )
    require(
        set(matrices) == set(MATRIX_SPECS),
        "all full main and mutation coefficients saved",
    )
    metadata = dict(
        scalars=scalars,
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

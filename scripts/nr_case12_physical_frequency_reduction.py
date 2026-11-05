"""Complete fixed-case12 physical frequency reduction, candidate only.

Mathematical evaluation belongs to the owned worker. Manifests are pure stdlib
bytes/JSON/SHA/AST. All accepted matrices are loaded from immutable evidence;
no ray sampling, parent reconstruction, frequency truncation or source repair.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIVISION_PARENT = "nr-k3-case12-physical-closure-division-controls-v1-20261015"
COORDINATE_PARENT = "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"
BLOCKS_PARENT = "nr-k3-case12-polynomial-blocks-controls-v1-20261014"
PARENT_GATES = {
    "nr-k3-case12-physical-closure-division-controls-v1-20261015": {
        "gate_sha256": "7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6",
        "worker_sha256": "d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6",
    },
    "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015": {
        "gate_sha256": "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
        "worker_sha256": "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    },
    "nr-k3-case12-polynomial-blocks-controls-v1-20261014": {
        "gate_sha256": "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7",
        "worker_sha256": "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e",
    },
}
PARENT_FILES = {
    "division_gate.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "qualification-gate.json",
        "sha256": "7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6",
    },
    "division_worker.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "worker-result.json",
        "sha256": "d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6",
    },
    "division_replay.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "independent-replay.json",
        "sha256": "bd21c592008bf3b432267b355ee6f34948d7b00a3ef09500ff3afc7cc4ba9deb",
    },
    "division_source_bridge.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "source_bridge.json",
        "sha256": "03938b8c1b1a04e625f8f1a586d08f69e7fd67bb2342fa0bff0032332f2ce252",
    },
    "division_domain.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "domain.json",
        "sha256": "9622687bd5f246bd98794aa543a6628267484d113d29de1198c514fee40ec7eb",
    },
    "division_scalars.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "scalars.json",
        "sha256": "316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5",
    },
    "Q0.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q0.json",
        "sha256": "3cddc74765ece71528acd71ac9242a5a9561ffccb9c938f16c759e83adf688f7",
    },
    "Q1.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q1.json",
        "sha256": "9a372062e712650085372790768bd62fe26f1e74b84511fe0712f9ca82734a08",
    },
    "Q2.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q2.json",
        "sha256": "411902fe63bd4662fc432d7a42dfb379835126bb8d970bb629c5cdaf557c4bbb",
    },
    "domain.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "parent-inputs/domain.json",
        "sha256": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    },
    "denominators.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "parent-inputs/denominators.json",
        "sha256": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    },
    "coordinate_gate.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "qualification-gate.json",
        "sha256": "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
    },
    "coordinate_worker.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "worker-result.json",
        "sha256": "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    },
    "coordinate_replay.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "independent-replay.json",
        "sha256": "7751521463cdade0039d8e36b405dac40f8faca3b98c9b02100c75165e370104",
    },
    "coordinate_source_bridge.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "source_bridge.json",
        "sha256": "9081f843df45d334fa98573479c413ad241e59ea85aa6b96b5359713c32b221d",
    },
    "rT__p_m1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_m1.json",
        "sha256": "d1edaa7516d99e2386ef2ccd77c237550e6554fb1a94378b3b852ca3f1472460",
    },
    "rT__p_0.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_0.json",
        "sha256": "7fc024f496fafafcebbaac26e4b3dffd9991626def5cc734e05152f220e135ec",
    },
    "rT__p_1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_1.json",
        "sha256": "6dac5f5b512ca1fe0fe21cebce9a1959edf6a2591a98b650addc1128fbeb5233",
    },
    "rT__p_2.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_2.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "rTi__p_m1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_m1.json",
        "sha256": "cf1df8b421ce843cc811a83521aff806a5c63c1e2d1a6205efcdbc99219cf7f7",
    },
    "rTi__p_0.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_0.json",
        "sha256": "80b7d080ce9048eefcb13d2165aeb27dc11403c69598eaaf1a64307b963bd1ba",
    },
    "rTi__p_1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_1.json",
        "sha256": "ef573448b902770bfb5aac677c8a208c2aa73b0faab9fc97e83a16ce470d6b64",
    },
    "rTi__p_2.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_2.json",
        "sha256": "02431c25a4601cad0204ad1e9f1078c18cae7726d8f6aec7eabbdbdfe53dc7d4",
    },
    "blocks_gate.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "qualification-gate.json",
        "sha256": "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7",
    },
    "blocks_worker.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "worker-result.json",
        "sha256": "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e",
    },
    "blocks_replay.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "independent-replay.json",
        "sha256": "b02a9efc391df7920856c9cd7a1fcd1d2e1e5f3544adacfb6f5b3502894d5ec1",
    },
    "blocks_source_bridge.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "source_bridge.json",
        "sha256": "a79314a5704b21c4d0d0365f215ce93c3ea3399af6d4bbeb5eef3050bdd23a2e",
    },
    "Ab.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "division_quotient.json",
        "sha256": "40c4811594ad4828f4a0562635ea78b98df23fdcd5b2bace6fe213a5f5a9fa96",
    },
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
}
BOUND_HELPERS = {
    "scripts/nr_case12_polynomial_blocks.py": "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5",
    "scripts/nr_case12_physical_closure_division.py": "81bb46b7bf42cbf63cd09c6bb17b5b8b7fe55311431624c7a38915d9a7c03344",
}
AST_FUNCTIONS = {
    "scripts/nr_constraint_laurent_energy.py": (
        "factors",
        "bridge",
        "reduction",
        "normal_coordinates",
    ),
    "scripts/nr_constraint_exact_coefficients.py": (
        "leading",
        "intrinsic",
        "normalized",
    ),
    "scripts/nr_profile_exact_coefficients.py": ("principal_rates", "matrix"),
    "scripts/nr_case12_physical_coordinate_bridge.py": ("laurent_product",),
}
T_POWERS = (-1, 0, 1, 2)
Q_POWERS = (0, 1, 2)
Z_POWERS = (-2, -1, 0, 1, 2, 3, 4, 5, 6)
HIGH_POWERS = (2, 3, 4, 5, 6)
T_CAPS = {-1: 2, 0: 3, 1: 4, 2: 5}
U_CAPS = {-1: 0, 0: 2, 1: 3, 2: 3}
Z_CAPS = {-2: 2, -1: 4, 0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 10, 6: 10}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def matrix_name(family, power):
    require(
        type(family) is str and type(power) is int,
        "strict matrix family and frequency power",
    )
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def _matrix_specs():
    caps = (2, 4, 5, 6, 7, 8, 9, 10, 10)
    result = {
        matrix_name("Z", p): (43, 43, cap)
        for p, cap in zip(range(-2, 7), caps, strict=True)
    }
    result["leading_residual"] = (43, 43, 6)
    result["bad_Q2"] = (43, 43, 2)
    result.update(
        {
            matrix_name("mutated_Z", p): (43, 43, cap)
            for p, cap in zip(range(-2, 7), caps, strict=True)
        }
    )
    return result


MATRIX_SPECS = _matrix_specs()
MATRIX_ORDER = tuple(MATRIX_SPECS)
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
        (T_POWERS, (-1, 0, 1, 2)),
        (Q_POWERS, (0, 1, 2)),
        (Z_POWERS, tuple(range(-2, 7))),
        (HIGH_POWERS, (2, 3, 4, 5, 6)),
    ):
        require(
            type(actual) is tuple
            and actual == expected
            and all(type(p) is int for p in actual),
            "fixed complete reduction supports",
        )
    for actual, expected in (
        (T_CAPS, {-1: 2, 0: 3, 1: 4, 2: 5}),
        (U_CAPS, {-1: 0, 0: 2, 1: 3, 2: 3}),
        (Z_CAPS, dict(zip(range(-2, 7), (2, 4, 5, 6, 7, 8, 9, 10, 10), strict=True))),
    ):
        require(
            type(actual) is dict
            and actual == expected
            and all(type(k) is type(v) is int for k, v in actual.items()),
            "registered direction degree caps",
        )
    require(
        type(MATRIX_SPECS) is dict
        and MATRIX_SPECS == _matrix_specs()
        and all(
            type(spec) is tuple and all(type(v) is int for v in spec)
            for spec in MATRIX_SPECS.values()
        )
        and MATRIX_ORDER == tuple(_matrix_specs()),
        "fixed full reduction outputs",
    )


def verify_source(raw, source_name):
    table = {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}
    require(
        type(raw) is bytes and type(source_name) is str and source_name in table,
        "registered exact source bytes",
    )
    require(
        hashlib.sha256(raw).hexdigest() == table[source_name],
        "frozen source SHA mismatch: " + source_name,
    )


def _verify_dependencies():
    for name in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}:
        verify_source((ROOT / name).read_bytes(), name)


def source_bridge_manifest():
    """Pure stdlib; binds original reduction and normalization without execution."""
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
            "complete original function AST coverage",
        )
        bindings[name] = dict(
            functions=[node.name for node in nodes],
            ast_sha256=hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest(),
            edits=[],
        )
    return dict(
        schema="nr-case12-physical-frequency-reduction-source-v1",
        source_hashes=SOURCE_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        bound_helpers=BOUND_HELPERS.copy(),
        bindings=bindings,
        construction="Z=(t*Q)*u=r_squared*T*Q*Ti",
        leading_identity="Z[1]-r*Ab=0; Khat43=Ab/r",
        mutation="Q2+=x^2*I; mutated_Z=actual_Z+(t*delta_Q)*u",
        complete_powers=list(Z_POWERS),
        original_shift_retained=True,
        geometric=False,
        normal_principal="S43^-1*Khat43*S43/sqrt(r)",
        normal_energy="S43.T*H*S43",
        scaled_rows=[0, 1, 2, 3, 41],
        original_matrices_rebuilt=False,
        direction_sampling=False,
        alternative_transform_search=False,
        new_uniform_growth_bound=False,
    )


def parent_provenance_manifest(parent_inputs):
    """All qualification checks use only supplied immutable JSON bytes."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "complete fixed reduction parent inputs",
    )
    records = {}
    for name, spec in PARENT_FILES.items():
        raw = parent_inputs[name]
        require(
            type(raw) is bytes and hashlib.sha256(raw).hexdigest() == spec["sha256"],
            "parent byte drift: " + name,
        )
        records[name] = json.loads(raw)
    groups = (
        (
            "division",
            DIVISION_PARENT,
            "nr-case12-physical-closure-division-controls-v1",
            (
                "physical_direction_polynomial_generator_validated",
                "fixed_background_local_symbol_validated",
            ),
        ),
        (
            "coordinate",
            COORDINATE_PARENT,
            "nr-case12-physical-coordinate-bridge-controls-v1",
            ("physical_coordinate_bridge_validated",),
        ),
        (
            "blocks",
            BLOCKS_PARENT,
            "nr-case12-polynomial-blocks-controls-v1",
            ("exact_quotient_cancellation_validated", "ode_blocks_validated"),
        ),
    )
    for prefix, directory, schema, flags in groups:
        gate, worker, replay = (
            records[prefix + suffix + ".json"]
            for suffix in ("_gate", "_worker", "_replay")
        )
        for record in (gate, worker):
            require(
                record["schema"] == schema
                and record["passed"] is record["completed"] is True
                and record["errors"] == []
                and record["case_indices"] == [12]
                and all(record[flag] is True for flag in flags),
                "qualified fixed-case mathematical parent: " + prefix,
            )
            require(
                all(
                    record[flag] is False
                    for flag in (
                        "physical_gate",
                        "live_admission",
                        "scientificPayloadWriteback",
                    )
                ),
                "parent remains shadow only",
            )
        require(
            gate["supervisor"]["cleanup_verified"] is True
            and worker["source_before"] == worker["source_after"],
            "parent cleanup and source closure",
        )
        require(
            gate["replay"] == worker["replay"] == replay and replay["passed"] is True,
            "qualified complete parent replay",
        )
        for name, spec in PARENT_FILES.items():
            if (
                spec["directory"] == directory
                and spec["path"] != "qualification-gate.json"
            ):
                require(
                    gate["artifact_hashes"][spec["path"]] == spec["sha256"],
                    "accepted parent artifact binding: " + name,
                )
    division, coordinate, blocks = (
        records[prefix + "_replay.json"]
        for prefix in ("division", "coordinate", "blocks")
    )
    require(
        division["matrix_count"] == 18
        and division["residual_slots"] == 23564
        and division["residual_nonzero_slots"] == 0
        and division["acceptance"]["quotient_homogeneity"] is True
        and division["acceptance"]["direct_closure"] is True,
        "accepted homogeneous physical symbol and direct closure",
    )
    require(
        coordinate["matrix_count"] == 78
        and coordinate["residual_slots"] == 82569
        and coordinate["residual_nonzero_slots"] == 0,
        "complete coordinate inverse and leading-map proof",
    )
    require(
        blocks["acceptance"]["accepted"] is True
        and blocks["acceptance"]["division_remainder_zero"] is True
        and blocks["acceptance"]["multiplication_identity"] is True,
        "Ab numerator exact quotient qualification",
    )
    sources = records["division_worker.json"]["source_before"]
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}.items():
        require(sources[name] == digest, "latest accepted source dependency: " + name)
    division_bridge = records["division_source_bridge.json"]
    require(
        division_bridge["source_hashes"] == SOURCE_HASHES
        and division_bridge["generator"] == "J+zeta*K"
        and division_bridge["principal_shift_retained"] is True
        and division_bridge["geometric"] is False,
        "original physical source and shift binding",
    )
    coordinate_bridge = records["coordinate_source_bridge.json"]
    require(
        all(
            SOURCE_HASHES[name] == digest
            for name, digest in coordinate_bridge["source_hashes"].items()
        ),
        "same fixed coordinate source formulas",
    )
    blocks_bridge = records["blocks_source_bridge.json"]
    require(
        blocks_bridge["profile_sha256"]
        == SOURCE_HASHES["scripts/nr_profile_exact_coefficients.py"],
        "same principal model for Ab",
    )
    return dict(
        schema="nr-case12-physical-frequency-reduction-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        inherited_coordinate_inverses_verified=True,
        inherited_polynomial_physical_closure_verified=True,
        inherited_principal_quotient_verified=True,
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
            "frozen arithmetic import path",
        )
    return result


def build_context(*, guard=lambda: None):
    require(callable(guard), "callable resource guard")
    guard()
    manifest = source_bridge_manifest()
    P, _, _, _ = _modules()
    context = P.build_context(guard=guard)
    guard()
    return {**context, "ring": context["field"].ring, "source_bridge": manifest}


def reduction_from_matrices(
    t, Q, u, Ab, r, *, guard=lambda: None, check=None, sink=lambda name, matrix: None
):
    """Complete generic square-matrix candidate, including failed baseline.

    The caller may use small exact examples. Fixed-parent validation and formal
    degree caps belong to build_certificate. No saved matrix is later modified.
    """
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable stage, deadline and sink controls",
    )
    _registered_profile()
    check = guard if check is None else check
    guard()
    _, _, _, E = _modules()
    ring, shape = E._laurent(t)
    qring, qshape = E._laurent(Q)
    uring, ushape = E._laurent(u)
    require(
        shape[0] == shape[1]
        and qring == uring == ring
        and qshape == ushape == shape
        and set(t) == set(u) == set(T_POWERS)
        and set(Q) == set(Q_POWERS),
        "matching complete frequency-reduction coefficient matrices",
    )
    require(
        E._matrix_ring(Ab) == ring and Ab.shape == shape,
        "matching principal quotient numerator",
    )
    E._scalar(r, ring)
    require(bool(r), "nonzero common direction denominator")
    matrices = {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "registered unique full frequency output",
        )
        E._matrix_ring(matrix)
        sink(name, matrix)
        matrices[name] = matrix
        guard()

    def product(a, b):
        guard()
        result = E.laurent_product(a, b, guard=check, stage=lambda power: guard())
        guard()
        return result

    Z = product(product(t, Q), u)
    require(set(Z) == set(Z_POWERS), "complete baseline reduction support")
    for power in Z_POWERS:
        save(matrix_name("Z", power), Z[power])
    leading = Z[1] - E._scale(Ab, r, guard=check)
    save("leading_residual", leading)
    delta = E.zeros(*shape, ring)
    x_squared = ring.gens[0] ** 2
    for i in range(shape[0]):
        check()
        delta[i, i] = x_squared
    bad_Q2 = Q[2] + delta
    save("bad_Q2", bad_Q2)
    delta_Q = {
        power: delta if power == 2 else E.zeros(*shape, ring) for power in Q_POWERS
    }
    delta_Z = product(product(t, delta_Q), u)
    require(
        set(delta_Z) == set(Z_POWERS), "complete actual symbol-perturbation support"
    )
    mutated = {}
    for power in Z_POWERS:
        mutated[power] = Z[power] + delta_Z[power]
        save(matrix_name("mutated_Z", power), mutated[power])
    input_changes = sum(bool(value) for value in delta.flat)
    high_nonzero = sum(
        bool(value) for power in HIGH_POWERS for value in mutated[power].flat
    )
    high_changes = sum(
        bool(value) for power in HIGH_POWERS for value in delta_Z[power].flat
    )
    mutation = dict(
        schema="nr-case12-physical-frequency-reduction-mutation-v1",
        name="add-x2-identity-to-Q2",
        source_matrix="bad_Q2",
        power=2,
        checked_powers=list(HIGH_POWERS),
        baseline_preserved=True,
        input_changed_slots=input_changes,
        mutated_high_nonzero_slots=high_nonzero,
        mutated_high_coefficients=sum(
            len(value) for power in HIGH_POWERS for value in mutated[power].flat
        ),
        change_high_nonzero_slots=high_changes,
        rejected=input_changes > 0 and high_nonzero > 0 and high_changes > 0,
    )
    acceptance = dict(
        above_first_order_zero=not any(
            value for power in HIGH_POWERS for value in Z[power].flat
        ),
        leading_principal_match=not any(leading.flat),
        mutation_rejected=mutation["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    guard()
    return dict(matrices=matrices, acceptance=acceptance, mutation=mutation)


def domain_metadata():
    return dict(
        schema="nr-case12-physical-frequency-reduction-domain-v1",
        fixed_case=12,
        geometric=False,
        direction="real-nonzero",
        frequency="complex-nonzero",
        physical_frequency="zeta=i*rho/sqrt(r); rho>0",
        cleared_denominator="r_squared",
        transformed_symbol="Ared=Z/r_squared=T*Q*Ti",
        principal43="Khat43=Ab/r",
        leading_identity="Z[1]=r*Ab after acceptance",
        original_shift_retained=True,
        discarded_frequency_powers=False,
        full_saved_powers=list(Z_POWERS),
        required_zero_powers=list(HIGH_POWERS),
        scaled_rows=[0, 1, 2, 3, 41],
        normal_principal="S43^-1*Khat43*S43/sqrt(r)",
        normal_energy="S43.T*H*S43",
        zero_frequency_full43_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        uniform_frequency_energy_proved=False,
        actual_nonlinear_rhs_bridge_proved=False,
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
    P, V, C, _ = _modules()
    field, ring = context["field"], context["ring"]
    require(
        records["domain.json"] == context["domain"],
        "accepted positive fixed-case direction domain",
    )
    denominators = records["denominators.json"]
    require(
        set(denominators) == {"r", "g", "delta", "section_denominator"},
        "complete original denominators",
    )
    polys = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        decoded = V.decode_polynomial(denominators[name], max_degree=cap)
        polys[name] = ring.from_dict(
            {power: ring.domain.convert(value) for power, value in decoded.items()}
        )
        require(
            polys[name] == P.polynomial(context[name], field),
            "source-bound original denominator: " + name,
        )
    inherited_scalars = {
        "r": P.canonical_polynomial(polys["r"]),
        "g": P.canonical_polynomial(polys["g"]),
        "sigma": P.canonical_polynomial(polys["section_denominator"]),
        "delta": P.canonical_polynomial(polys["delta"]),
        "delta_squared": P.canonical_polynomial(polys["delta"] ** 2),
    }
    require(
        json.dumps(inherited_scalars, sort_keys=True, separators=(",", ":"))
        == json.dumps(
            records["division_scalars.json"], sort_keys=True, separators=(",", ":")
        ),
        "accepted scalar identity",
    )
    scalars = {
        "r": P.canonical_polynomial(polys["r"]),
        "r_squared": P.canonical_polynomial(polys["r"] ** 2),
        "mutation_x_squared": P.canonical_polynomial(ring.gens[0] ** 2),
    }
    t, Q, u = {}, {}, {}
    for family, output, caps in (("rT", t, T_CAPS), ("rTi", u, U_CAPS)):
        for power in T_POWERS:
            guard()
            output[power] = C._to_matrix(
                records[matrix_name(family, power) + ".json"],
                field,
                (43, 43),
                caps[power],
                check,
            )
    for power in Q_POWERS:
        guard()
        Q[power] = C._to_matrix(
            records["Q" + str(power) + ".json"], field, (43, 43), power, check
        )
        require(
            all(sum(exponent) == power for poly in Q[power].flat for exponent in poly),
            "accepted exact quotient homogeneity",
        )
    guard()
    Ab = C._to_matrix(records["Ab.json"], field, (43, 43), 4, check)
    matrices, stats = {}, {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "unique complete reduction output",
        )
        rows, columns, cap = MATRIX_SPECS[name]
        require(
            matrix.shape == (rows, columns), "full physical reduction matrix dimensions"
        )
        stats[name] = C.matrix_stats(matrix, cap)
        record = P.encode_matrix(matrix, guard=check)
        guard()
        sink(name, record)
        matrices[name] = record
        guard()

    result = reduction_from_matrices(
        t, Q, u, Ab, polys["r"], guard=guard, check=check, sink=save
    )
    require(
        tuple(matrices) == MATRIX_ORDER, "all twenty complete reduction matrices saved"
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

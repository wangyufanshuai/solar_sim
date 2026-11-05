"""Fixed-case12 all-direction physical-coordinate bridge candidate.

Only an owned worker evaluates formulas. Manifests and parent checks use
stdlib AST/bytes/JSON. Frequency is a finite Laurent index, not a fourth
direction variable. This module does not prove full-frequency closure or an
energy estimate and does not evaluate a Laurent inverse at zero frequency.
"""

import ast
import copy
import hashlib
import importlib
import json
from fractions import Fraction as F
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
PHYSICAL_SOURCE = "scripts/nr_constraint_full_symbol.py"
LAURENT_SOURCE = "scripts/nr_constraint_laurent_energy.py"
CONSTRAINT_SOURCE = "scripts/nr_constraint_exact_coefficients.py"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
SOURCE_HASHES = {
    PHYSICAL_SOURCE: "053b70dd9136117dcfc8f2045b9953dc5ece6bfdf382eb1da12f33b9b8446042",
    LAURENT_SOURCE: "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
    CONSTRAINT_SOURCE: "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    PROFILE_SOURCE: "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
}
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
}
SECTION_PARENT = "nr-k3-case12-polynomial-section-controls-v1-20261014"
PHYSICAL_PARENT = "nr-k3-case12-full-symbol-controls-v1-20261013"
ENERGY_PARENT = "nr-k3-case12-full58-factorized-energy-controls-v1-20261014"
PARENT_GATES = {
    SECTION_PARENT: dict(
        gate_sha256="d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be",
        worker_sha256="2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d",
    ),
    PHYSICAL_PARENT: dict(
        gate_sha256="e2d64d53023f1ca0f6a100333f6ebe9ff73de24de80bf420453c800e947be3a4",
        worker_sha256="393903039481482178fac4d57b5a85e6f0465c3f3fb92af631896f12309377e6",
    ),
    ENERGY_PARENT: dict(
        gate_sha256="64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4",
        worker_sha256="35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357",
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
    "Dtilde.json": dict(
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
    "physical_gate.json": dict(
        directory=PHYSICAL_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[PHYSICAL_PARENT]["gate_sha256"],
    ),
    "physical_worker.json": dict(
        directory=PHYSICAL_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[PHYSICAL_PARENT]["worker_sha256"],
    ),
    "source58.json": dict(
        directory=PHYSICAL_PARENT,
        path="source58-rational.json",
        sha256="37ab121ccc2e84dd2eb63658bba2df8ebeeb91cd759bcb1bf5db635e8d49a46a",
    ),
    "physical_C0.json": dict(
        directory=PHYSICAL_PARENT,
        path="physical43-coefficient-0.json",
        sha256="2b02b404515365c6b731631b3bfc8014b770237907b07fa7613e254cb2fc7788",
    ),
    "D39.json": dict(
        directory=PHYSICAL_PARENT,
        path="zero-frequency/reduced_map.json",
        sha256="57f1d3f312eb2c41f3a58a24e5401c20942450e07f5e5a98645a2b6a29576e56",
    ),
    "S39.json": dict(
        directory=PHYSICAL_PARENT,
        path="zero-frequency/section.json",
        sha256="3ea4b93c298701727127fb60af0e8afb0927154ddab46a5de5e6443e0b0ac462",
    ),
    "B39.json": dict(
        directory=PHYSICAL_PARENT,
        path="zero-frequency/reduced_operator.json",
        sha256="aff50d3660e0839353ac81f71ed61467c2682278391b40505908688f18ea2917",
    ),
    "off_image_ambiguity.json": dict(
        directory=PHYSICAL_PARENT,
        path="zero-frequency/off_image_ambiguity.json",
        sha256="bb7b8210600beb7759a1e156a2dc5e6fdd68b7eadfdb4f499e48223440cda271",
    ),
    "energy_gate.json": dict(
        directory=ENERGY_PARENT,
        path="qualification-gate.json",
        sha256=PARENT_GATES[ENERGY_PARENT]["gate_sha256"],
    ),
    "energy_worker.json": dict(
        directory=ENERGY_PARENT,
        path="worker-result.json",
        sha256=PARENT_GATES[ENERGY_PARENT]["worker_sha256"],
    ),
    "energy_replay.json": dict(
        directory=ENERGY_PARENT,
        path="independent-replay.json",
        sha256="6408ac4ce3891266f2c0c571f92daeb8d33354a621f3e78a459221933948480d",
    ),
}
GROUPS = ((8, 1), (11, 3), (20, 6), (38, 1))
FAMILY_CAPS = {
    "rW": {-1: 2, 0: 3, 1: 4},
    "rWi": {-1: 0, 0: 2, 1: 2},
    "U": {0: 0, 1: 1},
    "Ui": {0: 0, 1: 1},
    "rT": {-1: 2, 0: 3, 1: 4, 2: 5},
    "rTi": {-1: 0, 0: 2, 1: 3, 2: 3},
    "inverse_W_forward": {p: 8 for p in range(-2, 3)},
    "inverse_W_reverse": {p: 8 for p in range(-2, 3)},
    "inverse_U_forward": {p: 6 for p in range(3)},
    "inverse_U_reverse": {p: 6 for p in range(3)},
    "inverse_T_forward": {p: 8 for p in range(-2, 5)},
    "inverse_T_reverse": {p: 8 for p in range(-2, 5)},
    "rTC": {p: 7 for p in range(-1, 5)},
}


def matrix_name(family, power):
    return family + "__p_" + ("m" + str(-power) if power < 0 else str(power))


def _matrix_specs():
    specs = {"C0": (43, 58, 0), "C1": (43, 58, 1), "C2": (43, 58, 2), "J": (58, 58, 0)}
    for family, powers in FAMILY_CAPS.items():
        for power, cap in powers.items():
            specs[matrix_name(family, power)] = (43, 58 if family == "rTC" else 43, cap)
    specs["leading_residual"] = (43, 58, 7)
    specs.update({f"positive_residual_{p}": (43, 58, 7) for p in range(1, 5)})
    specs.update(
        {
            "D39": (39, 58, 0),
            "S39": (58, 39, 0),
            "B39": (39, 39, 0),
            "off_image_ambiguity": (43, 43, 0),
            "zero_top_residual": (4, 58, 0),
            "zero_map_residual": (39, 58, 0),
            "zero_section_residual": (39, 39, 0),
            "zero_transport_residual": (39, 58, 0),
            "zero_ambiguity_residual": (43, 58, 0),
            "source_residual": (58, 58, 0),
            "C0_parent_residual": (43, 58, 0),
            "negative_determinant_delta_rW0": (43, 43, 3),
            "negative_determinant_positive1": (43, 58, 7),
            "negative_offdiagonal_delta_rW0": (43, 43, 3),
            "negative_offdiagonal_positive1": (43, 58, 7),
        }
    )
    return specs


MATRIX_SPECS = _matrix_specs()
NEGATIVE_NAMES = tuple(name for name in MATRIX_SPECS if name.startswith("negative_"))
METADATA = (
    "scalars",
    "stats",
    "acceptance",
    "zero_frequency",
    "mutations",
    "source_bridge",
    "parent_provenance",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _registered_profile():
    require(
        type(GROUPS) is tuple
        and GROUPS == ((8, 1), (11, 3), (20, 6), (38, 1))
        and all(
            type(pair) is tuple and len(pair) == 2 and all(type(n) is int for n in pair)
            for pair in GROUPS
        ),
        "registered derivative groups",
    )
    expected = {
        "rW": {-1: 2, 0: 3, 1: 4},
        "rWi": {-1: 0, 0: 2, 1: 2},
        "U": {0: 0, 1: 1},
        "Ui": {0: 0, 1: 1},
        "rT": {-1: 2, 0: 3, 1: 4, 2: 5},
        "rTi": {-1: 0, 0: 2, 1: 3, 2: 3},
        "inverse_W_forward": {p: 8 for p in range(-2, 3)},
        "inverse_W_reverse": {p: 8 for p in range(-2, 3)},
        "inverse_U_forward": {p: 6 for p in range(3)},
        "inverse_U_reverse": {p: 6 for p in range(3)},
        "inverse_T_forward": {p: 8 for p in range(-2, 5)},
        "inverse_T_reverse": {p: 8 for p in range(-2, 5)},
        "rTC": {p: 7 for p in range(-1, 5)},
    }
    require(
        type(FAMILY_CAPS) is dict
        and FAMILY_CAPS == expected
        and all(
            type(p) is type(c) is int
            for powers in FAMILY_CAPS.values()
            for p, c in powers.items()
        ),
        "registered full Laurent supports and degree caps",
    )
    require(
        MATRIX_SPECS == _matrix_specs()
        and len(MATRIX_SPECS) == 78
        and all(
            type(v) is tuple and all(type(n) is int for n in v)
            for v in MATRIX_SPECS.values()
        ),
        "complete registered matrix contract",
    )


def _ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def verify_source(source, source_name):
    require(
        type(source_name) is str
        and source_name in SOURCE_HASHES
        and type(source) is bytes,
        "registered source name and bytes required",
    )
    require(
        hashlib.sha256(source).hexdigest() == SOURCE_HASHES[source_name],
        "frozen original formula SHA mismatch",
    )


def translated_ast(source, source_name):
    """Only exact registered type/output/storage-order adaptations are allowed."""
    verify_source(source, source_name)
    names = {
        PHYSICAL_SOURCE: ("source", "physical_coefficients"),
        LAURENT_SOURCE: ("factors", "bridge"),
        CONSTRAINT_SOURCE: ("zeros", "eye", "ode_projector"),
    }.get(source_name)
    require(names is not None, "registered executable source functions required")
    tree = ast.parse(source.decode("utf-8"), filename=source_name)
    functions = [
        copy.deepcopy(n)
        for n in tree.body
        if isinstance(n, ast.FunctionDef) and n.name in names
    ]
    require(tuple(n.name for n in functions) == names, "original function ordering")
    original = ast.Module(body=copy.deepcopy(functions), type_ignores=[])
    adapted = ast.Module(body=functions, type_ignores=[])
    edits = []
    guard_ast = _ast_text(
        ast.parse(
            "if not isinstance(background, Q.Background):\n    raise ValueError('exact Background required')"
        ).body[0]
    )
    for function in adapted.body:
        if source_name != CONSTRAINT_SOURCE:
            matches = [
                i for i, n in enumerate(function.body) if _ast_text(n) == guard_ast
            ]
            require(len(matches) == 1, "single registered Background type guard")
            node = function.body.pop(matches[0])
            edits.append(
                dict(
                    function=function.name,
                    operation="remove-background-type-guard",
                    original_ast=_ast_text(node),
                )
            )
        replacement = {
            "source": ("return R.exact_array(answer)", "return answer"),
            "physical_coefficients": (
                "return tuple(R.exact_array(c) for c in (c0, c1, c2))",
                "return tuple(c for c in (c0, c1, c2))",
            ),
        }.get(function.name)
        if replacement:
            old, new = (ast.parse(text).body[0] for text in replacement)
            require(
                _ast_text(function.body[-1]) == _ast_text(old),
                "registered Fraction-only output validator",
            )
            function.body[-1] = ast.copy_location(new, function.body[-1])
            edits.append(
                dict(
                    function=function.name,
                    operation="remove-fraction-output-validation",
                    original_ast=_ast_text(old),
                    replacement_ast=_ast_text(new),
                )
            )
        if function.name == "factors":
            old = ast.parse("r * low", mode="eval").body
            matches = [n for n in ast.walk(function) if _ast_text(n) == _ast_text(old)]
            require(len(matches) == 1, "single registered scalar-array multiplication")
            node = matches[0]
            node.left, node.right = node.right, node.left
            edits.append(
                dict(
                    function="factors",
                    operation="commute-exact-scalar-array-product",
                    original_ast=_ast_text(old),
                    replacement_ast=_ast_text(node),
                )
            )
    require(
        len(edits)
        == {PHYSICAL_SOURCE: 4, LAURENT_SOURCE: 3, CONSTRAINT_SOURCE: 0}[source_name],
        "registered exact adaptation count",
    )
    if source_name == CONSTRAINT_SOURCE:
        groups = next(
            n.value
            for n in tree.body
            if isinstance(n, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id == "GROUPS" for t in n.targets)
        )
        require(ast.literal_eval(groups) == GROUPS, "original derivative groups")
    ast.fix_missing_locations(adapted)
    return adapted, dict(
        source=source_name,
        source_sha256=SOURCE_HASHES[source_name],
        functions=list(names),
        original_ast_sha256=hashlib.sha256(_ast_text(original).encode()).hexdigest(),
        adapted_ast_sha256=hashlib.sha256(_ast_text(adapted).encode()).hexdigest(),
        edits=edits,
        formula_and_index_bodies_unchanged_except_scalar_commutation=True,
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Pure stdlib source/AST binding, no scientific imports or formula calls."""
    _registered_profile()
    _verify_dependencies()
    bindings = {}
    for name in SOURCE_HASHES:
        source = (ROOT / name).read_bytes()
        verify_source(source, name)
        if name != PROFILE_SOURCE:
            bindings[name] = translated_ast(source, name)[1]
    return dict(
        schema="nr-case12-physical-coordinate-source-v1",
        bindings=bindings,
        source_hashes=SOURCE_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        direction_variables=["x", "y", "z"],
        frequency_representation="finite integer Laurent index",
        groups=[list(group) for group in GROUPS],
        denominator="r=x^2+y^2+z^2",
        scope="fixed-case12 physical constraints and rational coordinate formulas only",
        full_frequency_closure_proved=False,
        nonlinear_sat_qualified=False,
    )


def parent_provenance_manifest(parent_inputs):
    """Validate only supplied archived bytes; never read external parent paths."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "all registered archived parent inputs required",
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
            "physical",
            PHYSICAL_PARENT,
            "nr-case12-full-linear-symbol-controls-v1",
            "exact_polynomial_closure",
        ),
        (
            "energy",
            ENERGY_PARENT,
            "nr-case12-full58-factorized-energy-controls-v1",
            "full58_principal_factorized_energy_validated",
        ),
    ):
        gate, worker = records[prefix + "_gate.json"], records[prefix + "_worker.json"]
        for record in (gate, worker):
            require(
                record["schema"] == schema
                and record["passed"] is record["completed"] is record[flag] is True
                and record["errors"] == [],
                "complete accepted mathematical parent required",
            )
            require(
                all(
                    record[k] is False
                    for k in (
                        "physical_gate",
                        "live_admission",
                        "scientificPayloadWriteback",
                    )
                ),
                "shadow-only parents required",
            )
        require(
            gate["supervisor"]["cleanup_verified"] is True
            and worker["source_before"] == worker["source_after"],
            "cleaned parent and unchanged source closure",
        )
        require(
            gate["artifact_hashes"]["worker-result.json"]
            == PARENT_GATES[directory]["worker_sha256"],
            "parent worker binding",
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
    energy_worker = records["energy_worker.json"]
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES}.items():
        require(
            energy_worker["source_before"][name] == digest,
            "latest accepted source ledger binding",
        )
    require(
        records["physical_worker.json"]["zero_frequency_reachable_rank"] == 39
        and records["energy_replay.json"]["passed"] is True,
        "accepted zero39 and latest independent replay",
    )
    return dict(
        schema="nr-case12-physical-coordinate-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        mathematical_input_roles={
            "section": "Dtilde and fixed positive direction domain",
            "physical": "direction-independent source/C0 and zero39 witnesses",
            "energy": "latest accepted source ledger; no new energy inference",
        },
        external_parent_reads=False,
        old_results_regraded=False,
    )


def _modules():
    _verify_dependencies()
    modules = tuple(
        importlib.import_module(name.removesuffix(".py").replace("/", "."))
        for name in DEPENDENCIES
    )
    for path, module in zip(DEPENDENCIES, modules, strict=True):
        require(
            Path(module.__file__).resolve() == (ROOT / path).resolve(),
            "frozen helper module path",
        )
    return modules


def build_context(*, guard=lambda: None):
    require(callable(guard), "callable guard required")
    guard()
    manifest = source_bridge_manifest()
    P, C, _ = _modules()
    context = C.build_context(guard=guard)
    import numpy as np

    Q, _, _ = P.frozen_helpers(P.verify_sources(), np)
    namespace = {
        "F": F,
        "np": np,
        "Q": Q,
        "GROUPS": GROUPS,
        "__builtins__": __builtins__,
    }
    helper_tree, audit = translated_ast(
        (ROOT / CONSTRAINT_SOURCE).read_bytes(), CONSTRAINT_SOURCE
    )
    require(
        audit == manifest["bindings"][CONSTRAINT_SOURCE], "private unchanged helper AST"
    )
    exec(
        compile(
            helper_tree, str(ROOT / CONSTRAINT_SOURCE) + ":coordinate-helpers", "exec"
        ),
        namespace,
    )
    R = SimpleNamespace(
        **{name: namespace[name] for name in ("zeros", "eye", "ode_projector")},
        GROUPS=GROUPS,
    )
    namespace["R"] = R
    for name in (PHYSICAL_SOURCE, LAURENT_SOURCE):
        tree, audit = translated_ast((ROOT / name).read_bytes(), name)
        require(
            audit == manifest["bindings"][name], "source coordinate adaptation audit"
        )
        exec(
            compile(tree, str(ROOT / name) + ":direction-extension", "exec"), namespace
        )
    symbolic = context["background"]

    def source(*, guard=lambda: None):
        return namespace["source"](symbolic, guard=guard)

    def physical_coefficients(*, guard=lambda: None):
        return namespace["physical_coefficients"](symbolic, guard=guard)

    def factors():
        return namespace["factors"](symbolic)

    def bridge(*, guard=lambda: None):
        return namespace["bridge"](symbolic, guard=guard)

    guard()
    return {
        **context,
        "ring": context["field"].ring,
        "source": source,
        "physical_coefficients": physical_coefficients,
        "factors": factors,
        "bridge": bridge,
        "source_bridge": manifest,
    }


def zeros(rows, columns, ring):
    require(
        type(rows) is type(columns) is int and 1 <= rows <= 58 and 1 <= columns <= 58,
        "bounded exact matrix dimensions required",
    )
    import numpy as np

    result = np.empty((rows, columns), dtype=object)
    for i in range(rows):
        result[i, :] = [ring.zero for _ in range(columns)]
    return result


def _matrix_ring(matrix):
    require(
        getattr(matrix, "ndim", None) == 2
        and min(matrix.shape) > 0
        and max(matrix.shape) <= 58,
        "nonempty bounded polynomial matrix required",
    )
    first = matrix[0, 0]
    require(hasattr(first, "ring"), "exact polynomial matrix required")
    ring = first.ring
    require(
        ring.ngens == 3
        and tuple(map(str, ring.symbols)) == ("x", "y", "z")
        and bool(ring.domain.is_QQ),
        "QQ[x,y,z] required",
    )
    require(
        all(
            isinstance(value, ring.dtype) and value.ring == ring
            for value in matrix.flat
        ),
        "same-ring polynomial entries required",
    )
    return ring


def _scalar(scalar, ring):
    require(
        isinstance(scalar, ring.dtype) and scalar.ring == ring,
        "same-ring exact polynomial scalar required",
    )


def _scale(matrix, scalar, *, guard=lambda: None):
    ring = _matrix_ring(matrix)
    _scalar(scalar, ring)
    answer = zeros(*matrix.shape, ring)
    for i, row in enumerate(matrix):
        guard()
        for j, value in enumerate(row):
            answer[i, j] = scalar * value
    return answer


def _product(left, right, *, guard=lambda: None):
    ring = _matrix_ring(left)
    require(
        _matrix_ring(right) == ring and left.shape[1] == right.shape[0],
        "matching exact polynomial matrix product",
    )
    answer = zeros(left.shape[0], right.shape[1], ring)
    columns = [[(j, p) for j, p in enumerate(row) if p] for row in right]
    for i, row in enumerate(left):
        guard()
        for k, value in enumerate(row):
            if value:
                for j, other in columns[k]:
                    answer[i, j] += value * other
    return answer


def _laurent(values):
    require(
        type(values) is dict and values and all(type(p) is int for p in values),
        "nonempty exact integer-power Laurent dictionary",
    )
    require(
        sorted(values) == list(range(min(values), max(values) + 1)),
        "complete contiguous Laurent support including zeros",
    )
    first = next(iter(values.values()))
    ring = _matrix_ring(first)
    require(
        all(
            value.shape == first.shape and _matrix_ring(value) == ring
            for value in values.values()
        ),
        "one exact Laurent shape/ring",
    )
    return ring, first.shape


def laurent_product(left, right, *, guard=lambda: None, stage=lambda power: None):
    require(
        callable(guard) and callable(stage),
        "callable arithmetic and coefficient guards",
    )
    ring, ls = _laurent(left)
    rr, rs = _laurent(right)
    require(ring == rr and ls[1] == rs[0], "matching Laurent matrix product")
    powers = sorted({p + q for p in left for q in right})
    answer = {}
    for power in powers:
        stage(power)
        value = zeros(ls[0], rs[1], ring)
        for p, a in left.items():
            if power - p in right:
                value += _product(a, right[power - p], guard=guard)
        answer[power] = value
        stage(power)
    return answer


def inverse_residual(
    left, right, scale, *, guard=lambda: None, stage=lambda power: None
):
    ring, shape = _laurent(left)
    _scalar(scale, ring)
    require(bool(scale), "nonzero cleared inverse identity scale required")
    require(shape[0] == shape[1], "square inverse matrices required")
    result = laurent_product(left, right, guard=guard, stage=stage)
    require(
        0 in result and result[0].shape == shape,
        "inverse constant coefficient and matching dimensions",
    )
    for i in range(shape[0]):
        result[0][i, i] -= scale
    return result


def zero_image_residuals(c0, j, d, s, b, ambiguity, *, guard=lambda: None):
    ring = _matrix_ring(c0)
    for matrix in (j, d, s, b, ambiguity):
        require(_matrix_ring(matrix) == ring, "matching zero-image polynomial ring")
    m, n = c0.shape
    rank = d.shape[0]
    lost = m - rank
    require(
        lost > 0
        and d.shape[1] == n
        and s.shape == (n, rank)
        and j.shape == (n, n)
        and b.shape == (rank, rank)
        and ambiguity.shape == (m, m),
        "complete zero-image dimensions",
    )
    section = _product(d, s, guard=guard)
    for i in range(rank):
        section[i, i] -= ring.one
    return dict(
        top=c0[:lost].copy(),
        map=c0[lost:].copy() - d,
        section=section,
        transport=_product(b, d, guard=guard) - _product(d, j, guard=guard),
        ambiguity=_product(ambiguity, c0, guard=guard),
    )


def mutate_weight(matrix, *, kind):
    ring = _matrix_ring(matrix)
    require(
        matrix.shape == (43, 43) and kind in ("determinant", "offdiagonal"),
        "registered full43 weight mutation",
    )
    delta = zeros(43, 43, ring)
    if kind == "determinant":
        for j in range(20, 38):
            delta[41, j] = -matrix[41, j]
    else:
        delta[41, 21] = -matrix[41, 21] / ring.domain.convert(F(2))
    return delta


def mutation_residual(delta, U, C, base, *, guard=lambda: None):
    require(
        type(U) is dict and set(U) == {0, 1} and type(C) is dict and {0, 1}.issubset(C),
        "registered mutation coefficient inputs",
    )
    return (
        base
        + _product(_product(delta, U[0], guard=guard), C[1], guard=guard)
        + _product(_product(delta, U[1], guard=guard), C[0], guard=guard)
    )


def _convert(matrix, context, factor, cap, *, check):
    P, _, _ = _modules()
    require(getattr(matrix, "ndim", None) == 2, "source object array required")
    answer = zeros(*matrix.shape, context["ring"])
    for i, row in enumerate(matrix):
        check()
        for j, value in enumerate(row):
            answer[i, j] = P.polynomial(
                factor * value, context["field"], max_degree=cap
            )
    return answer


def _old_constant(record, context, shape):
    """Strict legacy sparse Fraction matrix to complete polynomial storage."""
    require(
        type(record) is dict
        and set(record) == {"shape", "representation", "entries"}
        and record["representation"] == "sparse-exact-rational-zero-fill"
        and type(record["shape"]) is list
        and all(type(n) is int for n in record["shape"])
        and record["shape"] == list(shape)
        and type(record["entries"]) is list,
        "registered legacy constant matrix schema",
    )
    ring = context["ring"]
    matrix, seen = zeros(*shape, ring), set()
    for row in record["entries"]:
        require(type(row) is list and len(row) == 4, "legacy four-field entry")
        i, j, ns, ds = row
        require(
            type(i) is type(j) is int
            and 0 <= i < shape[0]
            and 0 <= j < shape[1]
            and (i, j) not in seen
            and type(ns) is type(ds) is str,
            "unique exact legacy coordinate",
        )
        try:
            value = F(int(ns), int(ds))
        except (ValueError, ZeroDivisionError) as error:
            raise ValueError("valid legacy exact coefficient") from error
        require(
            value and [str(value.numerator), str(value.denominator)] == [ns, ds],
            "canonical nonzero legacy rational",
        )
        matrix[i, j] = ring.ground_new(value)
        seen.add((i, j))
    return matrix


def build_certificate(
    parent_inputs, *, guard=lambda: None, sink=lambda name, record: None, check=None
):
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable budget and sink controls required",
    )
    check = guard if check is None else check
    guard()
    provenance = parent_provenance_manifest(parent_inputs)
    records = {name: json.loads(raw) for name, raw in parent_inputs.items()}
    context = build_context(guard=guard)
    P, Cmod, _ = _modules()
    field, ring = context["field"], context["ring"]
    require(
        records["domain.json"] == context["domain"],
        "fixed positive all-real direction domain",
    )
    r = P.polynomial(context["r"], field, max_degree=2)
    g = P.polynomial(context["g"], field, max_degree=2)
    denominators = records["denominators.json"]
    require(
        P.canonical_polynomial(r) == denominators["r"]
        and P.canonical_polynomial(g) == denominators["g"],
        "source-bound direction scalars",
    )
    dtilde = Cmod._to_matrix(records["Dtilde.json"], field, (43, 58), 3, check)
    matrices, stats, families = {}, {}, {}

    def save(name, matrix):
        guard()
        require(
            name in MATRIX_SPECS and name not in matrices,
            "registered unique matrix output",
        )
        rows, columns, cap = MATRIX_SPECS[name]
        require(matrix.shape == (rows, columns), "complete output matrix shape")
        stats[name] = Cmod.matrix_stats(matrix, cap)
        record = P.encode_matrix(matrix, guard=check)
        guard()
        sink(name, record)
        matrices[name] = record
        guard()

    def save_family(name, values):
        require(
            set(values) == set(FAMILY_CAPS[name]), "complete registered Laurent powers"
        )
        for power, matrix in values.items():
            save(matrix_name(name, power), matrix)
        families[name] = values

    def coefficient_stage(power):
        guard()

    source = _convert(
        context["source"](guard=check), context, field.one, 0, check=check
    )
    physical = {
        i: _convert(a, context, field.one, i, check=check)
        for i, a in enumerate(context["physical_coefficients"](guard=check))
    }
    for i in range(3):
        require(
            all(sum(power) == i for poly in physical[i].flat for power in poly),
            "physical C coefficient homogeneous degree",
        )
        save(f"C{i}", physical[i])
    save("J", source)
    w, wi = context["factors"]()
    u, ui = context["bridge"](guard=check)
    for name, raw, factor in (
        ("rW", w, context["r"]),
        ("rWi", wi, context["r"]),
        ("U", u, field.one),
        ("Ui", ui, field.one),
    ):
        values = {
            p: _convert(matrix, context, factor, FAMILY_CAPS[name][p], check=check)
            for p, matrix in raw.items()
        }
        save_family(name, values)
    save_family(
        "rT",
        laurent_product(
            families["rW"], families["U"], guard=check, stage=coefficient_stage
        ),
    )
    save_family(
        "rTi",
        laurent_product(
            families["Ui"], families["rWi"], guard=check, stage=coefficient_stage
        ),
    )
    for label, left, right in (
        ("W", "rW", "rWi"),
        ("U", "U", "Ui"),
        ("T", "rT", "rTi"),
    ):
        for orientation, a, b in (("forward", left, right), ("reverse", right, left)):
            values = inverse_residual(
                families[a],
                families[b],
                ring.one if label == "U" else r * r,
                guard=check,
                stage=coefficient_stage,
            )
            if label == "U":
                values = {
                    p: _scale(matrix, r * r, guard=check)
                    for p, matrix in values.items()
                }
            save_family("inverse_" + label + "_" + orientation, values)
    transformed = laurent_product(
        families["rT"], physical, guard=check, stage=coefficient_stage
    )
    save_family("rTC", transformed)
    save("leading_residual", transformed[0] - dtilde)
    for power in range(1, 5):
        save(f"positive_residual_{power}", transformed[power])
    zero_inputs = {}
    for name in ("D39", "S39", "B39", "off_image_ambiguity"):
        shape = MATRIX_SPECS[name][:2]
        zero_inputs[name] = _old_constant(records[name + ".json"], context, shape)
        save(name, zero_inputs[name])
    zero_residuals = zero_image_residuals(
        physical[0],
        source,
        zero_inputs["D39"],
        zero_inputs["S39"],
        zero_inputs["B39"],
        zero_inputs["off_image_ambiguity"],
        guard=check,
    )
    for name, matrix in zero_residuals.items():
        save("zero_" + name + "_residual", matrix)
    save(
        "source_residual",
        source - _old_constant(records["source58.json"], context, (58, 58)),
    )
    save(
        "C0_parent_residual",
        physical[0] - _old_constant(records["physical_C0.json"], context, (43, 58)),
    )
    mutation_rows = []
    for kind, name in (
        ("determinant", "remove-determinant-compensation"),
        ("offdiagonal", "halve-symmetric-offdiagonal"),
    ):
        guard()
        delta = mutate_weight(families["rW"][0], kind=kind)
        residual = mutation_residual(
            delta, families["U"], physical, transformed[1], guard=check
        )
        delta_name, residual_name = (
            f"negative_{kind}_delta_rW0",
            f"negative_{kind}_positive1",
        )
        save(delta_name, delta)
        save(residual_name, residual)
        mutation_rows.append(
            dict(
                name=name,
                kind=kind,
                delta_matrix=delta_name,
                residual_matrix=residual_name,
                changed_row=41,
                changed_columns=list(range(20, 38)) if kind == "determinant" else [21],
                delta_nonzero_slots=stats[delta_name]["nonzero_slots"],
                nonzero_slots=stats[residual_name]["nonzero_slots"],
                coefficients=stats[residual_name]["terms"],
                rejected=stats[delta_name]["nonzero_slots"] > 0
                and stats[residual_name]["nonzero_slots"] > 0,
            )
        )
    require(set(matrices) == set(MATRIX_SPECS), "all explicit matrix outputs saved")
    zero_names = [
        name
        for name in MATRIX_SPECS
        if name.startswith("zero_") and name.endswith("_residual")
    ]
    inverse_names = [name for name in MATRIX_SPECS if name.startswith("inverse_")]

    def zero(names):
        return all(stats[name]["nonzero_slots"] == 0 for name in names)

    ambiguity = zero_inputs["off_image_ambiguity"]
    exact_ambiguity = all(
        poly == (ring.one if (i, j) == (4, 0) else ring.zero)
        for i, row in enumerate(ambiguity)
        for j, poly in enumerate(row)
    )
    zero_ok = zero(zero_names) and exact_ambiguity
    zero_record = dict(
        schema="nr-case12-physical-zero-image-v1",
        reachable_rank=39 if zero_ok else None,
        zero_rows=[0, 1, 2, 3],
        direction_independent_source_and_map=True,
        right_section_verified=zero(["zero_section_residual"]),
        invariant_image_verified=zero(["zero_transport_residual"]),
        ambiguity_nonzero_slots=stats["off_image_ambiguity"]["nonzero_slots"],
        ambiguity_is_E40=exact_ambiguity,
        full43_right_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        accepted=zero_ok,
    )
    mutation_record = dict(
        schema="nr-case12-physical-coordinate-mutations-v1",
        rows=mutation_rows,
        accepted=all(row["rejected"] for row in mutation_rows),
    )
    acceptance = dict(
        inverse_relations=zero(inverse_names),
        leading_map=zero(["leading_residual"]),
        positive_frequency_powers=zero([f"positive_residual_{p}" for p in range(1, 5)]),
        fixed_constant_source=zero(["source_residual", "C0_parent_residual"]),
        zero_frequency_image=zero_ok,
        mutation_controls=mutation_record["accepted"],
    )
    acceptance["accepted"] = all(acceptance.values())
    metadata = dict(
        scalars=dict(
            r=P.canonical_polynomial(r),
            r_squared=P.canonical_polynomial(r * r),
            g=P.canonical_polynomial(g),
        ),
        stats=stats,
        acceptance=acceptance,
        zero_frequency=zero_record,
        mutations=mutation_record,
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
    )
    for name in METADATA:
        guard()
        sink(name, metadata[name])
        guard()
    return dict(matrices=matrices, **metadata)

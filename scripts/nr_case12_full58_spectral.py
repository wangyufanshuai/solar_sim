"""Fixed-case12 full58 six-branch spectral candidate, never a minimal polynomial.

Only the owned worker performs polynomial work. Manifest entry points use
stdlib bytes, hashes, AST and JSON. The accepted closure K is loaded rather
than rebuilt. Complete nonzero residuals remain evidence of a failed candidate.
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
PARENT_DIRECTORY = (
    ROOT / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014"
)
PARENT_GATE_SHA = "3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1"
PARENT_WORKER_SHA = "c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
PROFILE_SHA = "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb"
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
}
PARENT_INPUT_HASHES = {
    "K.json": "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    "parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    "parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    "source_bridge.json": "9f465ee64e0e34f19a8ffc50a158ef94beee28c137c513d695f8044d8b89eb02",
    "stats.json": "1d3455ed70c1810d262dfbc1906256845d1943cc66dc784938021ba90f7502c0",
    "independent-replay.json": "1dbb0840dda60ca0c7e9958807998031325421e60623ab1f66407d2fe625bde9",
}
BRANCHES = ("ordering-T", "ordering-L", "light", "lapse", "shift-T", "shift-L")
BRANCH_RATIONALS = (
    (2601, 100000),
    (2601, 50000),
    (2601, 5000),
    (153, 125),
    (459, 250),
    (306, 125),
)
MATRIX_CAPS = {
    "Pi": 0,
    "K0": 1,
    "shift_residual": 1,
    "embedding_residual": 1,
    "Q": 2,
    "Z1": 3,
    "Z2": 5,
    "Z3": 7,
    "Z4": 9,
    "Z5": 11,
    "Z6": 13,
}
MATRIX_ORDER = tuple(MATRIX_CAPS)
NEGATIVE_CAPS = {"delta_Z6": 13, "mutant_Z6": 13}


def require(condition, message):
    if not condition:
        raise ValueError(message)


class NonzeroResidualError(ValueError):
    """A mathematical zero-gate rejection, distinct from callback exceptions."""


def _registered_profile():
    require(
        type(BRANCHES) is tuple
        and all(type(value) is str for value in BRANCHES)
        and type(BRANCH_RATIONALS) is tuple
        and all(
            type(pair) is tuple
            and len(pair) == 2
            and all(type(value) is int for value in pair)
            for pair in BRANCH_RATIONALS
        ),
        "exact immutable branch registration required",
    )
    require(
        BRANCHES == ("ordering-T", "ordering-L", "light", "lapse", "shift-T", "shift-L")
        and BRANCH_RATIONALS
        == (
            (2601, 100000),
            (2601, 50000),
            (2601, 5000),
            (153, 125),
            (459, 250),
            (306, 125),
        ),
        "registered six-branch profile required",
    )
    expected = {
        "Pi": 0,
        "K0": 1,
        "shift_residual": 1,
        "embedding_residual": 1,
        "Q": 2,
        "Z1": 3,
        "Z2": 5,
        "Z3": 7,
        "Z4": 9,
        "Z5": 11,
        "Z6": 13,
    }
    require(
        type(MATRIX_CAPS) is dict
        and all(
            type(name) is str and type(value) is int
            for name, value in MATRIX_CAPS.items()
        )
        and type(MATRIX_ORDER) is tuple
        and type(NEGATIVE_CAPS) is dict
        and all(
            type(name) is str and type(value) is int
            for name, value in NEGATIVE_CAPS.items()
        )
        and MATRIX_CAPS == expected
        and MATRIX_ORDER == tuple(expected)
        and NEGATIVE_CAPS == {"delta_Z6": 13, "mutant_Z6": 13},
        "registered complete matrix order and degrees required",
    )


def branch_constants():
    _registered_profile()
    return tuple(
        F(numerator, denominator) for numerator, denominator in BRANCH_RATIONALS
    )


def _constants(constants):
    expected = branch_constants()
    if constants is None:
        constants = expected
    require(
        type(constants) is tuple
        and len(constants) == 6
        and all(type(value) is F for value in constants)
        and constants == expected,
        "six original exact Fraction constants in registered order required",
    )
    return constants


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == PROFILE_SHA,
        "frozen full58 profile source SHA mismatch",
    )


def _ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def translated_ast(source):
    """Compile only unchanged squared_speeds and full58 intrinsic formulas."""
    verify_source(source)
    tree = ast.parse(source.decode("utf-8"), filename=PROFILE_SOURCE)
    cls = next(
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    speed = next(
        node
        for node in cls.body
        if isinstance(node, ast.FunctionDef) and node.name == "squared_speeds"
    )
    intrinsic = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "intrinsic"
    )
    require(
        not speed.decorator_list and not intrinsic.decorator_list,
        "unchanged undecorated formula functions",
    )
    module = ast.Module(
        body=[copy.deepcopy(speed), copy.deepcopy(intrinsic)], type_ignores=[]
    )
    digest = hashlib.sha256(_ast_text(module).encode()).hexdigest()
    return module, dict(
        source=PROFILE_SOURCE,
        source_sha256=PROFILE_SHA,
        functions=["Background.squared_speeds", "intrinsic"],
        edits=[],
        original_ast_sha256=digest,
        adapted_ast_sha256=digest,
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen full58 dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Pure stdlib source/AST binding; no scientific imports or compilation."""
    _registered_profile()
    _verify_dependencies()
    source = (ROOT / PROFILE_SOURCE).read_bytes()
    _, compiled = translated_ast(source)
    tree = ast.parse(source.decode("utf-8"))
    annihilator = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "annihilator"
    )
    cls = next(
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    getters = [
        node
        for node in cls.body
        if isinstance(node, ast.FunctionDef)
        and node.name in ("ray_squared", "shift_ray", "metric_normal_squared")
    ]
    require(
        tuple(node.name for node in getters)
        == ("ray_squared", "shift_ray", "metric_normal_squared"),
        "original direction getter order",
    )
    branches = next(
        node.value
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "BRANCHES"
            for target in node.targets
        )
    )
    require(ast.literal_eval(branches) == BRANCHES, "original six-branch names")
    return dict(
        schema="nr-case12-full58-spectral-bridge-v1",
        compiled=compiled,
        annihilator_ast_sha256=hashlib.sha256(
            _ast_text(annihilator).encode()
        ).hexdigest(),
        direction_getters_ast_sha256=hashlib.sha256(
            _ast_text(ast.Module(body=getters, type_ignores=[])).encode()
        ).hexdigest(),
        dependencies=DEPENDENCIES.copy(),
        branches=list(BRANCHES),
        recurrence="Q=K0^2; Z0=K0; Zj=Zprev*Q-c_j*g*Zprev for j=1..6",
        shift="K0=K-b*diag(0_11,I_47)",
        squared_speeds="r*Background.squared_speeds=c_j*g; g=v^T u v",
        formula_execution="original intrinsic and squared_speeds; annihilator algebra expanded into guarded saved stages",
        scope="fixed-case12 geometric=False full58 principal formula extension; no energy or lower-order claim",
    )


def _modules():
    _verify_dependencies()
    result = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen full58 dependency module path",
        )
        result.append(module)
    return tuple(result)


def build_context(*, guard=lambda: None):
    """Fixed constants and original formula bridge, never a K/S rebuild."""
    require(callable(guard), "callable resource guard required")
    guard()
    manifest = source_bridge_manifest()
    P, _, C = _modules()
    context = C.build_context(guard=guard)
    tree, audit = translated_ast((ROOT / PROFILE_SOURCE).read_bytes())
    require(audit == manifest["compiled"], "unchanged formula AST identity")
    namespace = {"__builtins__": __builtins__}
    exec(
        compile(tree, str(ROOT / PROFILE_SOURCE) + ":full58-spectral-formulas", "exec"),
        namespace,
    )
    field, background = context["field"], context["background"]
    import numpy as np

    original, _, _ = P.frozen_helpers(P.verify_sources(), np)
    normalized_metric = original.Background.metric_normal_squared.fget(background)
    require(
        context["r"] * normalized_metric == context["g"],
        "original metric_normal_squared getter identity",
    )
    r = P.polynomial(context["r"], field, max_degree=2)
    g = P.polynomial(context["g"], field, max_degree=2)
    b = P.polynomial(background.shift_ray, field, max_degree=1)
    fixed = SimpleNamespace(
        alpha=background.alpha, chi=background.chi, metric_normal_squared=F(1)
    )
    constants = _constants(namespace["squared_speeds"](fixed))
    direction = SimpleNamespace(
        alpha=background.alpha,
        chi=background.chi,
        metric_normal_squared=normalized_metric,
    )
    speeds = namespace["squared_speeds"](direction)
    require(
        all(
            context["r"] * speed == constant * context["g"]
            for speed, constant in zip(speeds, constants, strict=True)
        ),
        "unnormalised six-branch speed identity",
    )
    # The original getter was evaluated by C; this is its exact polynomial value.
    intrinsic_background = SimpleNamespace(shift_ray=b)

    def intrinsic(matrix):
        return namespace["intrinsic"](matrix, intrinsic_background)

    guard()
    return {
        **context,
        "r": r,
        "g": g,
        "b": b,
        "constants": constants,
        "intrinsic": intrinsic,
        "closure_source_bridge": context["source_bridge"],
        "source_bridge": manifest,
    }


def zeros(rows, columns, ring):
    _, _, C = _modules()
    return C.zeros(rows, columns, ring)


def _matrix_ring(matrix):
    require(
        getattr(matrix, "ndim", None) == 2
        and 1 <= matrix.shape[0] <= 58
        and 1 <= matrix.shape[1] <= 58,
        "bounded nonempty polynomial matrix required",
    )
    first = matrix[0, 0]
    require(hasattr(first, "ring"), "exact polynomial matrix coefficients required")
    ring = first.ring
    P, _, _ = _modules()
    P.check_ring(ring)
    require(
        all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in matrix.flat),
        "same exact QQ[x,y,z] polynomial coefficients required",
    )
    return ring


def _scalar(value, ring, *, nonzero=False):
    require(
        isinstance(value, ring.dtype)
        and value.ring == ring
        and (not nonzero or bool(value)),
        "same-ring exact polynomial scalar required",
    )


def validate_homogeneous(matrix, degree, *, guard=lambda: None):
    require(
        type(degree) is int and degree >= 0 and callable(guard),
        "exact nonnegative homogeneous degree and callable guard required",
    )
    _matrix_ring(matrix)
    for row in matrix:
        guard()
        require(
            all(sum(exponent) == degree for poly in row for exponent in poly),
            "registered homogeneous matrix degree required",
        )


def validate_structure(k, *, guard=lambda: None):
    require(
        getattr(k, "shape", None) == (58, 58),
        "complete full58 principal matrix required",
    )
    validate_homogeneous(k, 1, guard=guard)
    require(
        all(not k[i, j] for i in range(11) for j in range(58))
        and all(not k[i, j] for i in range(58) for j in range(11)),
        "first11 principal rows and columns must vanish",
    )
    return dict(
        shape=[58, 58],
        homogeneous_degree=1,
        first11_rows_and_columns_zero=True,
        active_coordinates=list(range(11, 58)),
    )


def spectral_recurrence(
    matrix, g, constants=None, *, guard=lambda: None, sink=lambda name, matrix: None
):
    """All six odd factors; arbitrary small exact inputs confer no source claim."""
    require(callable(guard) and callable(sink), "callable guard and sink required")
    constants = _constants(constants)
    ring = _matrix_ring(matrix)
    require(matrix.shape[0] == matrix.shape[1], "square intrinsic matrix required")
    _scalar(g, ring, nonzero=True)
    P, _, _ = _modules()
    guard()
    square = P.multiply(matrix, matrix, guard=guard)
    result = {"Q": square}
    sink("Q", square)
    previous = matrix
    for index, constant in enumerate(constants, 1):
        guard()
        current = P.multiply(previous, square, guard=guard)
        factor = ring.domain.convert(constant) * g
        for i, row in enumerate(previous):
            guard()
            for j, value in enumerate(row):
                current[i, j] = current[i, j] - factor * value
        name = "Z" + str(index)
        result[name] = current
        sink(name, current)
        previous = current
    guard()
    return result


def _embed(active, ring, *, guard):
    require(
        getattr(active, "shape", None) == (47, 47), "complete active47 block required"
    )
    result = zeros(58, 58, ring)
    for i, row in enumerate(active, 11):
        guard()
        for j, value in enumerate(row, 11):
            result[i, j] = value
    return result


def full58_from_matrix(k, b, g, *, guard=lambda: None, sink=lambda name, matrix: None):
    """Validate full58 structure before computing the equivalent active47 chain."""
    _registered_profile()
    require(callable(guard) and callable(sink), "callable guard and sink required")
    structure = validate_structure(k, guard=guard)
    ring = _matrix_ring(k)
    _scalar(b, ring)
    _scalar(g, ring, nonzero=True)
    require(
        all(sum(exponent) == 1 for exponent in b)
        and all(sum(exponent) == 2 for exponent in g),
        "linear shift and quadratic metric direction required",
    )
    _, _, C = _modules()
    matrices, stats = {}, {}

    def save(name, matrix):
        guard()
        require(
            name not in matrices and name in MATRIX_CAPS,
            "unique registered full58 stage",
        )
        require(getattr(matrix, "shape", None) == (58, 58), "complete58 saved stage")
        validate_homogeneous(matrix, MATRIX_CAPS[name], guard=guard)
        stats[name] = C.matrix_stats(matrix, MATRIX_CAPS[name])
        matrices[name] = matrix
        sink(name, matrix)
        guard()

    pi = zeros(58, 58, ring)
    for i in range(11, 58):
        pi[i, i] = ring.one
    save("Pi", pi)
    k0 = zeros(58, 58, ring)
    shift = zeros(58, 58, ring)
    for i, row in enumerate(k):
        guard()
        for j, value in enumerate(row):
            k0[i, j] = value - b * pi[i, j]
            shift[i, j] = value - k0[i, j] - b * pi[i, j]
    validate_structure(k0, guard=guard)
    save("K0", k0)
    save("shift_residual", shift)
    active = k0[11:, 11:].copy()
    embedded = _embed(active, ring, guard=guard)
    embedding = zeros(58, 58, ring)
    for i, row in enumerate(k0):
        guard()
        for j, value in enumerate(row):
            embedding[i, j] = value - embedded[i, j]
    save("embedding_residual", embedding)
    require(
        not any(shift.flat) and not any(embedding.flat),
        "complete shift and embedding identities required before active47 recurrence",
    )

    def save_active(name, matrix):
        save(name, _embed(matrix, ring, guard=guard))

    spectral_recurrence(active, g, guard=guard, sink=save_active)
    require(
        tuple(matrices) == MATRIX_ORDER, "complete ordered full58 recurrence stages"
    )
    acceptance = dict(
        shift_identity=not any(shift.flat),
        embedding_identity=not any(embedding.flat),
        annihilator_zero=not any(matrices["Z6"].flat),
    )
    acceptance["accepted"] = all(acceptance.values())
    return dict(
        matrices=matrices, stats=stats, structure=structure, acceptance=acceptance
    )


def nilpotent_witness(g, constants=None, *, guard=lambda: None):
    """The same six-stage recurrence detects the real zero-mode Jordan fault."""
    constants = _constants(constants)
    require(hasattr(g, "ring"), "exact metric polynomial required")
    ring = g.ring
    _scalar(g, ring, nonzero=True)
    P, _, _ = _modules()
    P.check_ring(ring)
    n = zeros(2, 2, ring)
    n[0, 1] = ring.gens[0]
    stages = spectral_recurrence(n, g, constants, guard=guard)
    expected = zeros(2, 2, ring)
    coefficient = F(1)
    for constant in constants:
        coefficient *= constant
    expected[0, 1] = ring.domain.convert(coefficient) * g**6 * ring.gens[0]
    square_zero = not any(stages["Q"].flat)
    matches = all(
        actual == wanted
        for actual, wanted in zip(stages["Z6"].flat, expected.flat, strict=True)
    )
    count = sum(bool(poly) for poly in stages["Z6"].flat)

    def encode(matrix):
        return P.encode_matrix(matrix, guard=guard)

    return dict(
        schema="nr-case12-full58-spectral-nilpotent-v1",
        constants=list(map(str, constants)),
        N=encode(n),
        Q=encode(stages["Q"]),
        stages={"Z" + str(j): encode(stages["Z" + str(j)]) for j in range(1, 7)},
        expected_Z6=encode(expected),
        nonzero_slots=count,
        coefficients=sum(len(poly) for poly in stages["Z6"].flat),
        square_zero=square_zero,
        expected_identity=matches,
        zero_mode_rejected=square_zero and matches and count == 1,
    )


def validate_zero_residual(matrix, *, shape=(58, 58), guard=lambda: None):
    """The strict zero gate used to reject actual saved residual perturbations."""
    _matrix_ring(matrix)
    require(
        type(shape) in (tuple, list)
        and len(shape) == 2
        and all(type(size) is int and 1 <= size <= 58 for size in shape)
        and matrix.shape == tuple(shape)
        and callable(guard),
        "registered complete residual shape and guard required",
    )
    checked = 0
    for i, row in enumerate(matrix):
        guard()
        for j, poly in enumerate(row):
            if poly:
                raise NonzeroResidualError(f"nonzero residual slot ({i},{j})")
            checked += 1
    return dict(slots_checked=checked, nonzero_slots=0, coefficientwise_zero=True)


def mutation_witness(certificate, *, guard=lambda: None):
    residual = certificate["matrices"]["Z6"]
    require(
        getattr(residual, "shape", None) == (58, 58), "complete Z6 witness required"
    )
    validate_homogeneous(residual, 13, guard=guard)
    ring = _matrix_ring(residual)
    delta = zeros(58, 58, ring)
    delta[11, 11] = ring.gens[0] ** 13
    mutant = residual.copy()
    mutant[11, 11] = mutant[11, 11] + delta[11, 11]
    guard()
    nonzero = sum(bool(poly) for poly in mutant.flat)
    try:
        validate_zero_residual(mutant, guard=guard)
        rejected = False
    except NonzeroResidualError:
        require(nonzero > 0, "zero-gate rejection must identify a nonzero residual")
        rejected = True
    return dict(
        delta_Z6=delta,
        mutant_Z6=mutant,
        metadata=dict(
            schema="nr-case12-full58-spectral-mutation-v1",
            name="add-x13-to-Z6-11-11",
            entry=[11, 11],
            nonzero_slots=nonzero,
            coefficients=sum(len(poly) for poly in mutant.flat),
            rejected=rejected,
        ),
    )


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "frozen closure input SHA mismatch: " + str(path),
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-closure-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["all_direction_closure_validated"]
            is True
            and record["errors"] == [],
            "complete accepted closure parent required",
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
            "parent remains shadow-only",
        )
    require(
        gate["supervisor"]["cleanup_verified"] is True,
        "complete parent ownership cleanup",
    )
    require(
        worker["source_before"] == worker["source_after"], "unchanged parent sources"
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "parent worker bytes bound",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "parent input manifest binding"
        )
    for name, digest in {**DEPENDENCIES, PROFILE_SOURCE: PROFILE_SHA}.items():
        require(
            worker["source_before"][name] == digest, "parent frozen dependency binding"
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    require(callable(guard), "callable resource guard required")
    directory = Path(parent_directory).resolve()
    require(directory == PARENT_DIRECTORY.resolve(), "registered closure parent only")
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    replay = records["independent-replay.json"]
    require(
        replay["passed"] is replay["all_direction_closure_validated"] is True
        and replay["input_hashes"]["K.json"] == PARENT_INPUT_HASHES["K.json"],
        "independently replayed closure K",
    )
    return records, dict(
        schema="nr-case12-full58-spectral-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        closure_parent_passed=True,
        main_rebuilt=False,
        section_rebuilt=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Only JSON/hash operations, suitable for the nonmathematical finalizer."""
    return load_parent(parent_directory)[1]


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    require(callable(guard) and callable(sink), "callable guard and sink required")
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C = _modules()
    field = context["field"]
    require(
        records["parent-inputs/domain.json"] == context["domain"],
        "fixed accepted full58 domain",
    )
    require(
        records["source_bridge.json"] == context["closure_source_bridge"],
        "original full58 K source bridge remains identical",
    )
    denominators = records["parent-inputs/denominators.json"]
    require(
        set(denominators) == {"r", "g", "delta", "section_denominator"},
        "frozen parent direction scalar schema",
    )
    for name in ("r", "g"):
        decoded = V.decode_polynomial(denominators[name], max_degree=2)
        actual = field.ring.from_dict(
            {power: field.domain.convert(value) for power, value in decoded.items()}
        )
        require(actual == context[name], "original direction scalar identity")
    k = C._to_matrix(records["K.json"], field, (58, 58), 1, guard)
    validate_structure(k, guard=guard)
    require(
        C.matrix_stats(k, 1) == records["stats.json"]["K"], "parent full58 K statistics"
    )
    source_k0 = context["intrinsic"](k)

    def save(name, matrix):
        if name == "K0":
            require(
                all(a == b for a, b in zip(matrix.flat, source_k0.flat, strict=True)),
                "unchanged original Q.intrinsic matches complete K0",
            )
        sink(name, matrix)

    certificate = full58_from_matrix(
        k, context["b"], context["g"], guard=guard, sink=save
    )
    negative = nilpotent_witness(context["g"], context["constants"], guard=guard)
    mutation = mutation_witness(certificate, guard=guard)
    negatives = {name: mutation[name] for name in NEGATIVE_CAPS}
    for name, matrix in negatives.items():
        validate_homogeneous(matrix, NEGATIVE_CAPS[name], guard=guard)
        sink(name, matrix)
        guard()
    acceptance = {
        name: value
        for name, value in certificate["acceptance"].items()
        if name != "accepted"
    }
    acceptance.update(
        nilpotent_detected=negative["zero_mode_rejected"],
        mutation_rejected=mutation["metadata"]["rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    scalars = {name: P.canonical_polynomial(context[name]) for name in ("r", "g", "b")}
    scalars["squared_speeds"] = [
        P.canonical_polynomial(field.domain.convert(c) * context["g"])
        for c in context["constants"]
    ]
    return {
        **certificate,
        "context": context,
        "acceptance": acceptance,
        "scalars": scalars,
        "nilpotent": negative,
        "mutation": mutation["metadata"],
        "negatives": negatives,
        "source_bridge": context["source_bridge"],
        "parent_provenance": provenance,
    }

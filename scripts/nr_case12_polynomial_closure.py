"""Fixed-case12 all-direction principal constraint-closure certificate candidate.

Scientific calculations execute only in the owned worker's resource envelope;
the finalizer may import and call the JSON/hash/AST-only manifest helpers.
Accepted parent polynomial matrices are loaded, never reconstructed. No claim
about spectra, energy, lower-order terms or boundaries follows.
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
    ROOT / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-section-controls-v1-20261014"
)
PARENT_GATE_SHA = "d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be"
PARENT_WORKER_SHA = "2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
PROFILE_SHA = "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb"
LEADING_SOURCE = "scripts/nr_constraint_exact_coefficients.py"
LEADING_SHA = "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce"
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
}
PARENT_INPUT_HASHES = {
    "Dtilde.json": "c23e90a84fd2567f2a3da4ec009d022448eca985a6324a26f79d8dc7357070ba",
    "Stilde.json": "4cc71b2444457be762cc5521fbac286637cf05dd3e4dbcb9946d641e1097c880",
    "denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    "domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
}
MUTATION = "theta-driver-kernel-feedback"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == PROFILE_SHA,
        "frozen principal source SHA mismatch",
    )


def _ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def translated_ast(source):
    """Return unchanged original principal_rates and matrix definitions."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=PROFILE_SOURCE)
    names = ("principal_rates", "matrix")
    definitions = [
        copy.deepcopy(node)
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    require(
        tuple(node.name for node in definitions) == names,
        "registered principal function order",
    )
    module = ast.Module(body=definitions, type_ignores=[])
    digest = hashlib.sha256(_ast_text(module).encode()).hexdigest()
    return module, {
        "source": PROFILE_SOURCE,
        "source_sha256": PROFILE_SHA,
        "functions": list(names),
        "original_ast_sha256": digest,
        "adapted_ast_sha256": digest,
        "edits": [],
        "fraction_basis_guard_retained": True,
        "per_column_resource_guard_retained": True,
        "geometric_branch_retained": True,
        "executed_geometric": False,
    }


def _dependency_bytes():
    result = {}
    for name, digest in DEPENDENCIES.items():
        data = (ROOT / name).read_bytes()
        require(
            hashlib.sha256(data).hexdigest() == digest,
            "frozen polynomial dependency SHA mismatch: " + name,
        )
        result[name] = data
    return result


def source_bridge_manifest():
    """Hash/AST-only binding for the finalizer; no numerical imports or work."""
    _dependency_bytes()
    source = (ROOT / PROFILE_SOURCE).read_bytes()
    _, principal = translated_ast(source)
    parsed = ast.parse(source.decode("utf-8"))
    helper_names = ("rational", "determinant", "inverse", "Background", "case12")
    helpers = [
        node
        for node in parsed.body
        if isinstance(node, (ast.FunctionDef, ast.ClassDef))
        and node.name in helper_names
    ]
    require(
        tuple(node.name for node in helpers) == helper_names, "unchanged helper order"
    )
    background_class = next(node for node in helpers if node.name == "Background")
    shift_getter = next(
        node
        for node in background_class.body
        if isinstance(node, ast.FunctionDef) and node.name == "shift_ray"
    )
    require(
        [_ast_text(node) for node in shift_getter.decorator_list]
        == [_ast_text(ast.Name(id="property", ctx=ast.Load()))],
        "original shift_ray property",
    )
    coordinate_assignments = [
        node
        for node in parsed.body
        if isinstance(node, ast.Assign)
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id in ("PAIRS", "PAIR_INDEX")
    ]
    require(len(coordinate_assignments) == 2, "symmetric coordinate source assignments")
    leading = (ROOT / LEADING_SOURCE).read_bytes()
    require(
        hashlib.sha256(leading).hexdigest() == LEADING_SHA,
        "frozen storage source SHA mismatch",
    )
    zeros = [
        node
        for node in ast.parse(leading.decode("utf-8")).body
        if isinstance(node, ast.FunctionDef) and node.name == "zeros"
    ]
    require(len(zeros) == 1, "original zero storage helper")
    return {
        "schema": "nr-case12-polynomial-main-bridge-v1",
        "principal": principal,
        "profile_helpers": {
            "functions": list(helper_names),
            "edits": [],
            "ast_sha256": hashlib.sha256(
                _ast_text(ast.Module(body=helpers, type_ignores=[])).encode()
            ).hexdigest(),
        },
        "coordinate_assignments_ast_sha256": hashlib.sha256(
            _ast_text(ast.Module(body=coordinate_assignments, type_ignores=[])).encode()
        ).hexdigest(),
        "shift_ray_getter_ast_sha256": hashlib.sha256(
            _ast_text(shift_getter).encode()
        ).hexdigest(),
        "storage_helper": {
            "source": LEADING_SOURCE,
            "source_sha256": LEADING_SHA,
            "ast_sha256": hashlib.sha256(
                _ast_text(ast.Module(body=zeros, type_ignores=[])).encode()
            ).hexdigest(),
            "edits": [],
        },
        "dependencies": DEPENDENCIES.copy(),
        "F_binding": "fractions.Fraction",
        "scope": "unchanged principal formulas; fixed case12; geometric=False; rational direction extension",
    }


def _modules():
    _dependency_bytes()
    modules = [
        importlib.import_module(name.removesuffix(".py").replace("/", "."))
        for name in DEPENDENCIES
    ]
    for name, module in zip(DEPENDENCIES, modules, strict=True):
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen dependency module path",
        )
    return tuple(modules)


def build_context(*, guard=lambda: None):
    """Cheap formula bridge and exact constants; no K/D/S matrix build."""
    guard()
    manifest = source_bridge_manifest()
    P, _ = _modules()
    import numpy as np
    from sympy.polys.domains import QQ
    from sympy.polys.fields import field

    sources = P.verify_sources()
    Q, _, _ = P.frozen_helpers(sources, np)
    original = Q.case12()
    domain = P.fixed_domain(original, Q.inverse(original.metric))
    f, x, y, z = field("x,y,z", QQ)
    symbolic = SimpleNamespace(
        alpha=original.alpha,
        chi=original.chi,
        metric=original.metric,
        shift=original.shift,
        ray=(x, y, z),
    )
    symbolic.ray_squared = Q.Background.ray_squared.fget(symbolic)
    symbolic.shift_ray = Q.Background.shift_ray.fget(symbolic)
    inverse = Q.inverse(original.metric)
    g = sum(
        symbolic.ray[i] * inverse[i][j] * symbolic.ray[j]
        for i in range(3)
        for j in range(3)
    )
    namespace = {
        "F": F,
        "np": np,
        "inverse": Q.inverse,
        "PAIRS": Q.PAIRS,
        "PAIR_INDEX": Q.PAIR_INDEX,
        "__builtins__": __builtins__,
    }
    tree, audit = translated_ast(sources[PROFILE_SOURCE])
    require(audit == manifest["principal"], "bridge audit mismatch")
    exec(
        compile(
            tree, str(ROOT / PROFILE_SOURCE) + ":unchanged-polynomial-main", "exec"
        ),
        namespace,
    )

    def principal_rates(q, *, geometric=False):
        require(
            type(geometric) is bool and geometric is False,
            "only explicit geometric=False registered",
        )
        return namespace["principal_rates"](q, symbolic, geometric=False)

    def matrix(*, geometric=False, guard=lambda: None):
        require(
            type(geometric) is bool and geometric is False,
            "only explicit geometric=False registered",
        )
        return namespace["matrix"](symbolic, geometric=False, guard=guard)

    r = symbolic.ray_squared
    guard()
    return dict(
        field=f,
        background=symbolic,
        principal_rates=principal_rates,
        matrix=matrix,
        r=r,
        g=g,
        delta=original.chi * r * r * g * g,
        domain=domain,
        source_bridge=manifest,
    )


def zeros(rows, columns, ring):
    require(
        type(rows) is int
        and type(columns) is int
        and 1 <= rows <= 58
        and 1 <= columns <= 58,
        "bounded positive exact matrix dimensions",
    )
    P, _ = _modules()
    P.check_ring(ring)
    import numpy as np

    result = np.empty((rows, columns), dtype=object)
    for i in range(rows):
        result[i, :] = [ring.zero for _ in range(columns)]
    return result


def closure_from_matrices(d, s, k, delta, *, guard=lambda: None):
    """Algebraic helper; caller inputs do not confer a source-bound theorem."""
    P, _ = _modules()
    require(
        d.ndim == s.ndim == k.ndim == 2
        and d.shape[0] > 0
        and d.shape[1] > 0
        and s.shape == (d.shape[1], d.shape[0])
        and k.shape == (d.shape[1], d.shape[1]),
        "closure matrix dimensions",
    )
    require(
        hasattr(delta, "ring") and delta.ring == d[0, 0].ring and bool(delta),
        "matching nonzero denominator polynomial",
    )
    transport = P.multiply(d, k, guard=guard)
    numerator = P.multiply(transport, s, guard=guard)
    action = P.multiply(numerator, d, guard=guard)
    residual = zeros(*d.shape, delta.ring)
    for i, row in enumerate(transport):
        guard()
        for j, poly in enumerate(row):
            residual[i, j] = delta * poly - action[i, j]
    return dict(transport=transport, quotient_numerator=numerator, residual=residual)


def validate_kernel_structure(k):
    P, _ = _modules()
    require(getattr(k, "shape", None) == (58, 58), "complete58 principal matrix")
    for poly in k.flat:
        P.canonical_polynomial(poly)
        require(
            all(sum(powers) == 1 for powers in poly),
            "homogeneous degree-one principal entries",
        )
    require(
        all(not k[i, j] for i in range(11) for j in range(58))
        and all(not k[i, j] for i in range(58) for j in range(11)),
        "first11 principal rows and columns must vanish",
    )
    return {
        "rows": 58,
        "columns": 58,
        "homogeneous_degree": 1,
        "first11_rows_and_columns_zero": True,
    }


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "parent artifact SHA mismatch: " + Path(path).name,
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-section-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["all_real_section_formula_checked"]
            is True
            and record["errors"] == [],
            "accepted all-real right-section parent required",
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
        "parent frozen source identity",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "parent worker binding",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "registered parent input binding"
        )
    for name, digest in DEPENDENCIES.items():
        require(
            worker["source_before"][name] == digest, "parent dependency source binding"
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(directory == PARENT_DIRECTORY.resolve(), "registered parent directory only")
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    provenance = {
        "schema": "nr-case12-polynomial-closure-parent-v1",
        "directory": directory.relative_to(ROOT).as_posix(),
        "gate_sha256": PARENT_GATE_SHA,
        "worker_sha256": PARENT_WORKER_SHA,
        "input_hashes": PARENT_INPUT_HASHES.copy(),
        "dependencies": DEPENDENCIES.copy(),
        "right_section_parent_passed": True,
        "section_rebuilt": False,
    }
    return records, provenance


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """JSON/hash-only replay of the accepted parent binding; no math imports."""
    return load_parent(parent_directory)[1]


def _to_matrix(record, field, shape, degree_cap, guard):
    _, V = _modules()
    decoded = V.decode_matrix(record, shape=shape, max_degree=degree_cap)
    result = zeros(*shape, field.ring)
    for i, row in enumerate(decoded):
        guard()
        for j, value in enumerate(row):
            result[i, j] = field.ring.from_dict(
                {
                    powers: field.domain.convert(coefficient)
                    for powers, coefficient in value.items()
                }
            )
    return result


def matrix_stats(matrix, degree_cap):
    P, _ = _modules()
    require(type(degree_cap) is int and degree_cap >= 0, "exact degree bound")
    degree = -1
    for poly in matrix.flat:
        P.canonical_polynomial(poly)
        degree = max(degree, max((sum(powers) for powers in poly), default=-1))
    require(degree <= degree_cap, "registered polynomial matrix degree bound")
    return dict(
        shape=list(matrix.shape),
        slots=int(matrix.size),
        nonzero_slots=sum(bool(poly) for poly in matrix.flat),
        terms=sum(len(poly) for poly in matrix.flat),
        degree_max=degree,
        degree_cap=degree_cap,
    )


def build_certificate(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    records, provenance = load_parent(parent_directory, guard=guard)
    ctx = build_context(guard=guard)
    P, V = _modules()
    field = ctx["field"]
    require(
        records["domain.json"] == ctx["domain"], "parent fixed case12 domain differs"
    )
    denominators = records["denominators.json"]
    require(
        set(denominators) == {"r", "g", "delta", "section_denominator"},
        "parent denominator schema",
    )
    polys = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        decoded = V.decode_polynomial(denominators[name], max_degree=cap)
        polys[name] = field.ring.from_dict(
            {powers: field.domain.convert(value) for powers, value in decoded.items()}
        )
    r = P.polynomial(ctx["r"], field, max_degree=2)
    g = P.polynomial(ctx["g"], field, max_degree=2)
    delta = P.polynomial(ctx["delta"], field, max_degree=8)
    require(
        polys["r"] == r
        and polys["g"] == g
        and polys["delta"] == delta
        and r * polys["section_denominator"] == delta,
        "parent denominator identities",
    )
    d = _to_matrix(records["Dtilde.json"], field, (43, 58), 3, guard)
    s = _to_matrix(records["Stilde.json"], field, (58, 43), 6, guard)
    raw = ctx["matrix"](geometric=False, guard=guard)
    require(raw.shape == (58, 58), "original full58 principal matrix")
    k = zeros(58, 58, field.ring)
    for i, row in enumerate(raw):
        guard()
        for j, value in enumerate(row):
            k[i, j] = P.polynomial(value, field, max_degree=1)
    structure = validate_kernel_structure(k)
    result = closure_from_matrices(d, s, k, delta, guard=guard)
    stats = {
        "K": matrix_stats(k, 1),
        "transport": matrix_stats(result["transport"], 4),
        "quotient_numerator": matrix_stats(result["quotient_numerator"], 10),
    }
    matrix_stats(result["residual"], 13)
    stats["residual"] = P.validate_zero_matrix(
        result["residual"], shape=(43, 58), guard=guard
    )
    closure_denominator = r * delta
    require(
        all(sum(powers) == 10 for powers in closure_denominator),
        "homogeneous degree-ten closure denominator",
    )
    result.update(
        K=k,
        Dtilde=d,
        Stilde=s,
        r=r,
        g=g,
        delta=delta,
        closure_denominator=closure_denominator,
        domain=ctx["domain"],
        source_bridge=ctx["source_bridge"],
        parent_provenance=provenance,
        stats=stats,
        principal_structure=structure,
        theorem="fixed-case12 rational principal formulas: Dhat K(I-S Dhat)=0 for all real v!=0",
        section_rebuilt=False,
        direction_uniform_energy_proved=False,
        physical_boundary_proved=False,
        full_python_semantics_proved=False,
    )
    return result


def mutation_witness(certificate, *, guard=lambda: None):
    """A real homogeneous-degree-one K error mapping a kernel driver to Theta."""
    P, _ = _modules()
    d, s, delta = certificate["Dtilde"], certificate["Stilde"], certificate["delta"]
    require(
        d.shape == (43, 58) and s.shape == (58, 43),
        "complete parent matrices for mutation",
    )
    ring = delta.ring
    x = ring.gens[0]
    change = zeros(58, 58, ring)
    change[18, 22] = x
    require(
        all(not d[i, 22] for i in range(43)) and all(not s[22, j] for j in range(43)),
        "driver kernel and chosen zero section driver",
    )
    difference = closure_from_matrices(d, s, change, delta, guard=guard)
    expected = zeros(43, 58, ring)
    expected[4, 22] = certificate["closure_denominator"] * x
    require(
        all(
            difference["residual"][i, j] == expected[i, j]
            for i in range(43)
            for j in range(58)
        ),
        "registered exact Theta-driver closure witness",
    )
    require(bool(expected[4, 22]), "nonzero polynomial kernel-breaking witness")
    require(
        all(not poly for poly in difference["quotient_numerator"].flat),
        "registered mutation must be invisible to section quotient alone",
    )
    matrix_stats(difference["residual"], 13)
    return dict(
        name=MUTATION,
        entry=[18, 22],
        delta_K=change,
        delta_residual=difference["residual"],
        nonzero_slots=1,
        expected_nonzero_coordinate=[4, 22],
        quotient_numerator_change_zero=True,
        algebra="deltaN=Delta*d*deltaK-(d*deltaK*s)*d; deltaK[18,22]=x; deltaN[4,22]=r*Delta*x",
    )

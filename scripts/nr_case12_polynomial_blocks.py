"""Owned fixed-case12 ODE-block and exact quotient-compression candidate.

Manifest helpers use only bytes, JSON, SHA and AST. Scientific calculations are
restricted to the owned worker. Candidate failures return complete residuals;
they do not retroactively invalidate the accepted principal-closure parent.
"""

import ast
import copy
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARENT_DIRECTORY = (
    ROOT / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014"
)
PARENT_GATE_SHA = "3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1"
PARENT_WORKER_SHA = "c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2"
SOURCE = "scripts/nr_constraint_exact_coefficients.py"
SOURCE_SHA = "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
PROFILE_SHA = "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb"
GROUPS = ((8, 1), (11, 3), (20, 6), (38, 1))
SCALED_ROWS = (0, 1, 2, 3, 41)
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
}
PARENT_INPUT_HASHES = {
    "quotient_numerator.json": "034501d583fd889d2f1f69df03d8171150c8b8b9c29e31240a232049e6deac0c",
    "parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    "parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
}
MATRIX_CAPS = {
    "Ot": 2,
    "Pt": 2,
    "B": 10,
    "division_quotient": 4,
    "division_remainder": 10,
    "division_identity": 10,
    "multiplication_residual": 10,
    "ode_idempotence": 4,
    "left_annihilation": 12,
    "right_annihilation": 12,
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == SOURCE_SHA,
        "frozen constraint source SHA mismatch",
    )


def _ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def translated_ast(source):
    """Compile the original ODE projector and zero storage without adaptation."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=SOURCE)
    constants = {}
    for node in parsed.body:
        if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
            if node.targets[0].id in ("GROUPS", "SCALED_ROWS"):
                constants[node.targets[0].id] = ast.literal_eval(node.value)
    require(
        constants == {"GROUPS": GROUPS, "SCALED_ROWS": SCALED_ROWS},
        "frozen constraint coordinate groups",
    )
    names = ("zeros", "ode_projector")
    definitions = [
        copy.deepcopy(node)
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    require(
        tuple(node.name for node in definitions) == names,
        "registered ODE source functions",
    )
    module = ast.Module(body=definitions, type_ignores=[])
    digest = hashlib.sha256(_ast_text(module).encode()).hexdigest()
    intrinsic = next(
        node
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name == "intrinsic"
    )
    return module, {
        "source": SOURCE,
        "source_sha256": SOURCE_SHA,
        "functions": list(names),
        "edits": [],
        "original_ast_sha256": digest,
        "adapted_ast_sha256": digest,
        "groups": [list(group) for group in GROUPS],
        "scaled_rows": list(SCALED_ROWS),
        "intrinsic_ast_sha256": hashlib.sha256(
            _ast_text(intrinsic).encode()
        ).hexdigest(),
        "intrinsic_execution": "not executed; exact denominator clearing of A/Delta-b*(I-O)",
        "cleared_intrinsic_identity": "Delta*L=A-b*sigma*(r*I-Ot), with Delta=r*sigma",
    }


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Pure source/AST binding; no symbolic imports, compilation or execution."""
    _verify_dependencies()
    _, ode = translated_ast((ROOT / SOURCE).read_bytes())
    source = (ROOT / PROFILE_SOURCE).read_bytes()
    require(
        hashlib.sha256(source).hexdigest() == PROFILE_SHA,
        "frozen profile source SHA mismatch",
    )
    background = next(
        node
        for node in ast.parse(source.decode("utf-8")).body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    getters = [
        node
        for node in background.body
        if isinstance(node, ast.FunctionDef)
        and node.name in ("ray_squared", "shift_ray")
    ]
    require(
        tuple(node.name for node in getters) == ("ray_squared", "shift_ray"),
        "registered direction getters",
    )
    return {
        "schema": "nr-case12-polynomial-blocks-bridge-v1",
        "ode": ode,
        "profile_source": PROFILE_SOURCE,
        "profile_sha256": PROFILE_SHA,
        "direction_getters_ast_sha256": hashlib.sha256(
            _ast_text(ast.Module(body=getters, type_ignores=[])).encode()
        ).hexdigest(),
        "direction_getter_edits": [],
        "dependencies": DEPENDENCIES.copy(),
        "scope": "fixed case12; ODE projector and principal quotient compression only",
    }


def _modules():
    _verify_dependencies()
    result = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen dependency module path",
        )
        result.append(module)
    return tuple(result)


def build_context(*, guard=lambda: None):
    """Prepare the source ODE assignment function; no full matrix products."""
    guard()
    manifest = source_bridge_manifest()
    _, _, C = _modules()
    context = C.build_context(guard=guard)  # Constructs no K, D or S matrix.
    from fractions import Fraction
    import numpy as np

    namespace = {
        "F": Fraction,
        "np": np,
        "GROUPS": GROUPS,
        "__builtins__": __builtins__,
    }
    tree, audit = translated_ast((ROOT / SOURCE).read_bytes())
    require(audit == manifest["ode"], "ODE audit identity")
    exec(
        compile(tree, str(ROOT / SOURCE) + ":unchanged-polynomial-ode", "exec"),
        namespace,
    )

    def ode_projector():
        return namespace["ode_projector"](context["background"])

    return {
        "field": context["field"],
        "background": context["background"],
        "r": context["r"],
        "g": context["g"],
        "delta": context["delta"],
        "b": context["background"].shift_ray,
        "domain": context["domain"],
        "source_bridge": manifest,
        "ode_projector": ode_projector,
        "groups": GROUPS,
        "scaled_rows": SCALED_ROWS,
    }


def _ring(poly):
    P, _, _ = _modules()
    P.canonical_polynomial(poly)
    require(str(poly.ring.order) == "lex", "registered lex monomial order required")
    return poly.ring


def _shape(matrix):
    require(
        getattr(matrix, "ndim", None) == 2
        and 0 < matrix.shape[0] <= 58
        and 0 < matrix.shape[1] <= 58,
        "bounded nonempty polynomial matrix",
    )
    return matrix.shape


def block_relations(A, Ot, r, sigma, b, *, guard=lambda: None):
    """Return all three block residuals, including nonzero candidate failures."""
    P, _, C = _modules()
    shape = _shape(A)
    require(
        shape[0] == shape[1] and _shape(Ot) == shape, "matching square block matrices"
    )
    ring = _ring(r)
    require(
        bool(r) and bool(sigma) and _ring(sigma) == _ring(b) == ring,
        "matching scalar polynomial ring and nonzero denominators",
    )
    require(
        all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in A.flat)
        and all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in Ot.flat),
        "matching block coefficient ring",
    )
    Pt, B = C.zeros(*shape, ring), C.zeros(*shape, ring)
    for i in range(shape[0]):
        guard()
        for j in range(shape[1]):
            Pt[i, j] = (r if i == j else ring.zero) - Ot[i, j]
            B[i, j] = A[i, j] - b * sigma * Pt[i, j]
    idempotence = P.multiply(Ot, Ot, guard=guard)
    for i, row in enumerate(Ot):
        guard()
        for j, poly in enumerate(row):
            idempotence[i, j] = idempotence[i, j] - r * poly
    return {
        "Pt": Pt,
        "B": B,
        "block_residuals": {
            "ode_idempotence": idempotence,
            "left_annihilation": P.multiply(B, Ot, guard=guard),
            "right_annihilation": P.multiply(Ot, B, guard=guard),
        },
    }


def _divide_scalar(value, divisor, ring):
    require(
        isinstance(value, ring.dtype)
        and value.ring == ring
        and isinstance(divisor, ring.dtype)
        and divisor.ring == ring
        and bool(divisor),
        "same ring and nonzero divisor",
    )
    quotient, remainder = value.div(divisor)
    identity = value - divisor * quotient - remainder
    multiply_back = value - divisor * quotient
    leading = divisor.leading_expv()
    normal = all(
        not all(powers[k] >= leading[k] for k in range(3)) for powers in remainder
    )
    return {
        "quotient": quotient,
        "remainder": remainder,
        "division_identity": identity,
        "multiplication_residual": multiply_back,
        "normal_form_verified": normal,
        "accepted": not any((bool(remainder), bool(identity), bool(multiply_back)))
        and normal,
    }


def divide_scalar(value, divisor):
    """Single-divisor lex division, retaining failed divisibility evidence."""
    ring = _ring(divisor)
    require(bool(divisor) and _ring(value) == ring, "nonzero same-ring divisor")
    return _divide_scalar(value, divisor, ring)


def divide_matrix(A, sigma, *, guard=lambda: None):
    """No nonzero remainder is discarded or treated as an exception."""
    _, _, C = _modules()
    shape, ring = _shape(A), _ring(sigma)
    require(bool(sigma), "nonzero polynomial divisor")
    names = (
        "division_quotient",
        "division_remainder",
        "division_identity",
        "multiplication_residual",
    )
    result = {name: C.zeros(*shape, ring) for name in names}
    normal = True
    for i, row in enumerate(A):
        guard()
        for j, value in enumerate(row):
            answer = _divide_scalar(value, sigma, ring)
            for destination, source in zip(
                names,
                (
                    "quotient",
                    "remainder",
                    "division_identity",
                    "multiplication_residual",
                ),
                strict=True,
            ):
                result[destination][i, j] = answer[source]
            normal = normal and answer["normal_form_verified"]
    coefficient = sigma[sigma.leading_expv()]
    result.update(
        normal_form_verified=normal,
        monomial_order="lex",
        divisor_leading_exponent=list(sigma.leading_expv()),
        divisor_leading_coefficient=[
            str(coefficient.numerator),
            str(coefficient.denominator),
        ],
        accepted=normal
        and all(not poly for name in names[1:] for poly in result[name].flat),
    )
    return result


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "parent artifact SHA mismatch: " + str(path),
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
            "accepted all-direction closure parent required",
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
    require(worker["source_before"] == worker["source_after"], "parent source identity")
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "parent worker identity",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(gate["artifact_hashes"][name] == digest, "parent input identity")
    for name, digest in DEPENDENCIES.items():
        require(worker["source_before"][name] == digest, "parent dependency identity")


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(),
        "registered closure parent directory only",
    )
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    return records, {
        "schema": "nr-case12-polynomial-blocks-parent-v1",
        "directory": directory.relative_to(ROOT).as_posix(),
        "gate_sha256": PARENT_GATE_SHA,
        "worker_sha256": PARENT_WORKER_SHA,
        "input_hashes": PARENT_INPUT_HASHES.copy(),
        "dependencies": DEPENDENCIES.copy(),
        "closure_parent_passed": True,
        "main_rebuilt": False,
        "section_rebuilt": False,
    }


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Pure JSON/hash parent binding; no scientific imports or calculations."""
    return load_parent(parent_directory)[1]


def build_certificate(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C = _modules()
    field = context["field"]
    require(
        records["parent-inputs/domain.json"] == context["domain"], "fixed parent domain"
    )
    denominators = records["parent-inputs/denominators.json"]
    require(
        set(denominators) == {"r", "g", "delta", "section_denominator"},
        "registered denominator schema",
    )
    scalars = {}
    for name, cap in (("r", 2), ("g", 2), ("delta", 8), ("section_denominator", 6)):
        decoded = V.decode_polynomial(denominators[name], max_degree=cap)
        scalars[name] = field.ring.from_dict(
            {powers: field.domain.convert(value) for powers, value in decoded.items()}
        )
    r, g, delta, sigma = (
        scalars[name] for name in ("r", "g", "delta", "section_denominator")
    )
    require(
        r == P.polynomial(context["r"], field, max_degree=2)
        and g == P.polynomial(context["g"], field, max_degree=2)
        and delta == P.polynomial(context["delta"], field, max_degree=8)
        and r * sigma == delta,
        "accepted denominator identities",
    )
    require(
        bool(sigma) and all(sum(powers) == 6 for powers in sigma),
        "homogeneous degree-six nonzero divisor",
    )
    b = P.polynomial(context["b"], field, max_degree=1)
    A = C._to_matrix(records["quotient_numerator.json"], field, (43, 43), 10, guard)
    raw = context["ode_projector"]()
    require(raw.shape == (43, 43), "complete ODE source matrix")
    Ot = C.zeros(43, 43, field.ring)
    for i, row in enumerate(raw):
        guard()
        for j, value in enumerate(row):
            Ot[i, j] = P.polynomial(field(value) * field(r), field, max_degree=2)
    result = block_relations(A, Ot, r, sigma, b, guard=guard)
    division = divide_matrix(A, sigma, guard=guard)
    result.update(
        {
            name: division[name]
            for name in (
                "division_quotient",
                "division_remainder",
                "division_identity",
                "multiplication_residual",
            )
        }
    )
    trace_residual = sum((Ot[i, i] for i in range(43)), field.ring.zero) - 11 * r
    acceptance = {
        name: all(not poly for poly in matrix.flat)
        for name, matrix in result["block_residuals"].items()
    }
    acceptance.update(
        trace_rank=not bool(trace_residual),
        division_identity=all(not poly for poly in result["division_identity"].flat),
        division_remainder_zero=all(
            not poly for poly in result["division_remainder"].flat
        ),
        multiplication_identity=all(
            not poly for poly in result["multiplication_residual"].flat
        ),
        remainder_normal_form=division["normal_form_verified"],
    )
    acceptance["accepted"] = all(acceptance.values())
    matrices = dict(
        Ot=Ot,
        **{
            name: result[name]
            for name in (
                "Pt",
                "B",
                "division_quotient",
                "division_remainder",
                "division_identity",
                "multiplication_residual",
            )
        },
        **result["block_residuals"],
    )
    stats = {
        name: C.matrix_stats(matrices[name], cap) for name, cap in MATRIX_CAPS.items()
    }
    result.update(
        A=A,
        Ot=Ot,
        r=r,
        g=g,
        delta=delta,
        sigma=sigma,
        b=b,
        trace_residual=trace_residual,
        acceptance=acceptance,
        stats=stats,
        domain=context["domain"],
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
        monomial_order=division["monomial_order"],
        division_metadata={
            name: division[name]
            for name in (
                "monomial_order",
                "divisor_leading_exponent",
                "divisor_leading_coefficient",
                "normal_form_verified",
            )
        },
        main_rebuilt=False,
        section_rebuilt=False,
        zero_jordan_excluded=False,
        direction_uniform_energy_proved=False,
        candidate_scope="fixed-case12 ODE splitting and optional exact quotient compression",
    )
    return result


def mutation_witness(certificate, *, guard=lambda: None):
    """Registered projector error independent of optional division acceptance."""
    P, _, C = _modules()
    Ot, r = certificate["Ot"], certificate["r"]
    require(_shape(Ot) == (43, 43), "complete ODE projector required for mutation")
    ring = _ring(r)
    require(
        bool(r)
        and all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in Ot.flat),
        "same-ring ODE projector and nonzero r",
    )
    change = C.zeros(43, 43, r.ring)
    change[8, 8] = r.ring.gens[0] ** 2
    mutant = Ot + change
    residual = P.multiply(mutant, mutant, guard=guard)
    for i in range(43):
        guard()
        for j in range(43):
            residual[i, j] = residual[i, j] - r * mutant[i, j]
    nonzero = sum(bool(poly) for poly in residual.flat)
    require(nonzero > 0, "nonzero registered projector mutation witness")
    return dict(
        name="ode-projector-factor-two",
        entry=[8, 8],
        delta_Ot=change,
        mutant_idempotence=residual,
        nonzero_slots=nonzero,
        algebra="(Ot+delta_Ot)^2-r*(Ot+delta_Ot), delta_Ot[8,8]=x^2",
    )


def division_mutation_witness(certificate):
    """Cheap scalar nondivisibility check, never a second full matrix division."""
    require(
        certificate["acceptance"]["accepted"] is True,
        "accepted primary candidate required for division mutation",
    )
    sigma = certificate["sigma"]
    value = certificate["A"][0, 0] + sigma.ring.one
    answer = divide_scalar(value, sigma)
    require(
        answer["normal_form_verified"]
        and bool(answer["remainder"])
        and not answer["accepted"],
        "registered nondivisibility witness",
    )
    return dict(
        name="quotient-constant-nondivisibility", entry=[0, 0], input=value, **answer
    )

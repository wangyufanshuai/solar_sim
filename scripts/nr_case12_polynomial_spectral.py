"""Owned fixed-case12 seven-degree annihilator candidate, not a minimal polynomial.

Manifest entry points inspect only frozen bytes, AST and JSON. All polynomial
construction belongs to the owned worker. A nonzero final residual is returned
and saved, never repaired by appending unregistered spectral factors.
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
    ROOT / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-blocks-controls-v1-20261014"
)
PARENT_GATE_SHA = "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7"
PARENT_WORKER_SHA = "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
SOURCE = PROFILE_SOURCE
SOURCE_HASHES = {
    PROFILE_SOURCE: "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
    "scripts/nr_constraint_exact_coefficients.py": "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    "scripts/nr_constraint_laurent_energy.py": "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
}
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_polynomial_blocks.py": "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5",
}
PARENT_INPUT_HASHES = {
    "division_quotient.json": "40c4811594ad4828f4a0562635ea78b98df23fdcd5b2bace6fe213a5f5a9fa96",
    "Pt.json": "1e34f1af36c881793cda6a323d1ec62e43258cf15089b4fb06d30acb2da02def",
    "scalars.json": "a2e11e7f73066b4aa3c28db9a619455c4884ff91591935bf3a00b165c7a1603e",
    "parent-inputs/parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    "parent-inputs/parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
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
MATRIX_CAPS = {"X": 4, "Q": 8, "Z1": 12, "Z2": 20, "Z3": 28}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source, source_name=PROFILE_SOURCE):
    require(
        source_name in SOURCE_HASHES
        and type(source) is bytes
        and hashlib.sha256(source).hexdigest() == SOURCE_HASHES[source_name],
        "frozen spectral source SHA mismatch",
    )


def _ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def translated_ast(source):
    """Original squared_speeds function; self and every formula are unchanged."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=PROFILE_SOURCE)
    cls = next(
        node
        for node in parsed.body
        if isinstance(node, ast.ClassDef) and node.name == "Background"
    )
    fn = next(
        node
        for node in cls.body
        if isinstance(node, ast.FunctionDef) and node.name == "squared_speeds"
    )
    require(not fn.decorator_list, "original speed method has no decorators")
    tree = ast.Module(body=[copy.deepcopy(fn)], type_ignores=[])
    digest = hashlib.sha256(_ast_text(tree).encode()).hexdigest()
    return tree, dict(
        source=PROFILE_SOURCE,
        source_sha256=SOURCE_HASHES[PROFILE_SOURCE],
        functions=["Background.squared_speeds"],
        edits=[],
        original_ast_sha256=digest,
        adapted_ast_sha256=digest,
        invocation="fixed alpha/chi, metric_normal_squared=1 yields c; actual ray uses g/r and r*squared_speeds=c*g",
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen spectral dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Stdlib-only source/AST manifest; no compilation or polynomial work."""
    _verify_dependencies()
    sources = {name: (ROOT / name).read_bytes() for name in SOURCE_HASHES}
    for name, source in sources.items():
        verify_source(source, name)
    _, speed = translated_ast(sources[PROFILE_SOURCE])
    hashes = {}
    for name, functions in (
        (PROFILE_SOURCE, ("annihilator",)),
        ("scripts/nr_constraint_exact_coefficients.py", ("intrinsic",)),
        ("scripts/nr_constraint_laurent_energy.py", ("paired_energy",)),
    ):
        parsed = ast.parse(sources[name].decode("utf-8"))
        selected = [
            node
            for node in parsed.body
            if isinstance(node, ast.FunctionDef) and node.name in functions
        ]
        require(
            tuple(node.name for node in selected) == functions,
            "registered spectral formula functions",
        )
        hashes[name] = hashlib.sha256(
            _ast_text(ast.Module(body=selected, type_ignores=[])).encode()
        ).hexdigest()
    profile = ast.parse(sources[PROFILE_SOURCE].decode("utf-8"))
    branch = next(
        node.value
        for node in profile.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "BRANCHES"
            for target in node.targets
        )
    )
    require(ast.literal_eval(branch) == BRANCHES, "frozen six-branch coordinate order")
    return dict(
        schema="nr-case12-polynomial-spectral-bridge-v1",
        speed=speed,
        source_hashes=SOURCE_HASHES.copy(),
        formula_ast_sha256=hashes,
        dependencies=DEPENDENCIES.copy(),
        branches=list(BRANCHES),
        formula_execution="only original squared_speeds is compiled; recurrence and univariate reduction are explicitly cleared algebra",
        recurrence="Q=X^2; Z0=X; Zj=Zprev*Q-c_j*g*r^2*Zprev for j=1,2,3",
        scope="fixed-case12 seven-degree annihilator candidate, not minimal polynomial or energy",
    )


def _modules():
    _verify_dependencies()
    result = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen spectral module path",
        )
        result.append(module)
    return tuple(result)


def branch_constants():
    return tuple(F(n, d) for n, d in BRANCH_RATIONALS)


def _constants(constants):
    if constants is None:
        constants = branch_constants()
    require(
        type(constants) is tuple
        and len(constants) == 6
        and all(type(value) is F for value in constants)
        and constants == branch_constants(),
        "six registered exact Fraction branch constants in original order required",
    )
    return constants


def build_context(*, guard=lambda: None):
    guard()
    manifest = source_bridge_manifest()
    _, _, _, B = _modules()
    context = B.build_context(guard=guard)
    tree, audit = translated_ast((ROOT / PROFILE_SOURCE).read_bytes())
    require(audit == manifest["speed"], "speed bridge audit identity")
    namespace = {"__builtins__": __builtins__}
    exec(
        compile(
            tree, str(ROOT / PROFILE_SOURCE) + ":unchanged-spectral-speeds", "exec"
        ),
        namespace,
    )
    bg = context["background"]
    fixed = SimpleNamespace(alpha=bg.alpha, chi=bg.chi, metric_normal_squared=F(1))
    constants = _constants(namespace["squared_speeds"](fixed))
    ray = SimpleNamespace(
        alpha=bg.alpha, chi=bg.chi, metric_normal_squared=context["g"] / context["r"]
    )
    raw_speeds = namespace["squared_speeds"](ray)
    require(
        all(
            context["r"] * speed == constant * context["g"]
            for speed, constant in zip(raw_speeds, constants, strict=True)
        ),
        "unnormalised direction speed identity",
    )
    return {**context, "source_bridge": manifest, "constants": constants}


def recurrence(
    X, r, g, constants, *, guard=lambda: None, sink=lambda name, matrix: None
):
    """Small or full matrix algebra; nonzero Z3 is preserved, not an exception.

    Sink receives each completed matrix. Later stages never mutate it; a sink
    must likewise treat supplied matrices as read-only.
    """
    guard()
    constants = _constants(constants)
    P, _, _, _ = _modules()
    P.canonical_polynomial(r)
    P.canonical_polynomial(g)
    ring = r.ring
    require(
        bool(r) and bool(g) and g.ring == ring and str(ring.order) == "lex",
        "matching nonzero direction polynomials in lex ring",
    )
    require(
        getattr(X, "ndim", None) == 2
        and X.shape[0] == X.shape[1]
        and 1 <= X.shape[0] <= 43,
        "bounded nonempty square intrinsic numerator",
    )
    require(
        all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in X.flat),
        "exact same-ring matrix coefficients required",
    )
    result = {"X": X}
    sink("X", X)
    guard()
    Q = P.multiply(X, X, guard=guard)
    result["Q"] = Q
    sink("Q", Q)
    guard()
    previous = X
    for index, constant in enumerate(constants[:3], 1):
        value = P.multiply(previous, Q, guard=guard)
        factor = ring.domain.convert(constant) * g * r**2
        for i, row in enumerate(previous):
            guard()
            for j, poly in enumerate(row):
                value[i, j] = value[i, j] - factor * poly
        name = "Z" + str(index)
        result[name] = value
        sink(name, value)
        guard()
        previous = value
    return result


# Tiny independent-in-dimension QQ[t] arithmetic, executed only by the worker.
def _trim(poly):
    values = list(poly)
    while values and not values[-1]:
        values.pop()
    return tuple(values)


def _add(a, b):
    return _trim(
        tuple(
            (a[i] if i < len(a) else F(0)) + (b[i] if i < len(b) else F(0))
            for i in range(max(len(a), len(b)))
        )
    )


def _scale(a, value):
    return _trim(tuple(value * coefficient for coefficient in a))


def _sub(a, b):
    return _add(a, _scale(b, F(-1)))


def _mul(a, b):
    if not a or not b:
        return ()
    result = [F(0)] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            result[i + j] += x * y
    return _trim(result)


def _divide(a, b):
    require(bool(b), "nonzero univariate divisor")
    remainder = _trim(a)
    quotient = [F(0)] * max(0, len(a) - len(b) + 1)
    while remainder and len(remainder) >= len(b):
        shift = len(remainder) - len(b)
        coefficient = remainder[-1] / b[-1]
        quotient[shift] += coefficient
        remainder = _sub(remainder, (F(0),) * shift + _scale(b, coefficient))
    return _trim(quotient), remainder


def _lagrange(nodes, index):
    result = (F(1),)
    for j, node in enumerate(nodes):
        if j != index:
            result = _scale(_mul(result, (-node, F(1))), 1 / (nodes[index] - node))
    return result


def _square_substitution(poly):
    if not poly:
        return ()
    result = [F(0)] * (2 * len(poly) - 1)
    for i, coefficient in enumerate(poly):
        result[2 * i] = coefficient
    return _trim(result)


def _egcd(a, b):
    old_r, current_r = a, b
    old_s, current_s, old_t, current_t = (F(1),), (), (), (F(1),)
    while current_r:
        q, remainder = _divide(old_r, current_r)
        old_r, current_r = current_r, remainder
        old_s, current_s = current_s, _sub(old_s, _mul(q, current_s))
        old_t, current_t = current_t, _sub(old_t, _mul(q, current_t))
    require(bool(old_r), "nonzero gcd")
    scale = 1 / old_r[-1]
    return _scale(old_r, scale), _scale(old_s, scale), _scale(old_t, scale)


def encode_univariate(poly):
    require(
        type(poly) is tuple and all(type(value) is F for value in poly),
        "exact dense univariate Fraction tuple required",
    )
    require(not poly or bool(poly[-1]), "trimmed univariate coefficients required")
    return [
        [power, str(value.numerator), str(value.denominator)]
        for power, value in enumerate(poly)
        if value
    ]


def decode_univariate(record, *, max_degree=24):
    require(
        type(record) is list and type(max_degree) is int and 0 <= max_degree <= 256,
        "bounded univariate coefficient list required",
    )
    result, previous = [], -1
    for row in record:
        require(
            type(row) is list
            and len(row) == 3
            and type(row[0]) is int
            and previous < row[0] <= max_degree
            and type(row[1]) is str
            and type(row[2]) is str,
            "strict increasing bounded univariate powers required",
        )
        try:
            coefficient = F(int(row[1]), int(row[2]))
        except (ValueError, ZeroDivisionError) as error:
            raise ValueError("valid rational coefficient required") from error
        require(
            bool(coefficient)
            and [str(coefficient.numerator), str(coefficient.denominator)] == row[1:],
            "canonical nonzero univariate coefficient required",
        )
        result.extend(F(0) for _ in range(row[0] + 1 - len(result)))
        result[row[0]] = coefficient
        previous = row[0]
    return tuple(result)


def _annihilators(constants):
    modulus, odd = (F(0), F(1)), (F(0), F(1))
    for value in constants[:3]:
        modulus = _mul(modulus, (-value, F(1)))
        odd = _mul(odd, (-value, F(0), F(1)))
    return modulus, odd


def univariate_certificate(constants=None, *, guard=lambda: None):
    """All original branches retained; exact scalar remainders and Bezout data."""
    constants = _constants(constants)
    modulus, odd = _annihilators(constants)
    nodes = (F(0), *constants)
    projectors, remainders = [], []
    for index, node in enumerate(nodes):
        guard()
        original = _lagrange(nodes, index)
        quotient, remainder = _divide(original, modulus)
        expected = _lagrange(nodes[:4], index) if index < 4 else ()
        projectors.append(
            dict(
                name="zero" if index == 0 else "branch-" + str(index),
                node=str(node),
                polynomial=encode_univariate(original),
                quotient=encode_univariate(quotient),
                remainder=encode_univariate(remainder),
                expected_remainder=encode_univariate(expected),
                remainder_difference=encode_univariate(_sub(remainder, expected)),
            )
        )
        remainders.append(remainder)
    total = ()
    for polynomial in remainders:
        total = _add(total, polynomial)
    completeness = _sub(total, (F(1),))
    relations = []
    for i, left in enumerate(remainders):
        guard()
        for j, right in enumerate(remainders):
            product = _mul(left, right)
            if i == j:
                product = _sub(product, left)
            quotient, remainder = _divide(product, modulus)
            relations.append(
                dict(
                    i=i,
                    j=j,
                    quotient=encode_univariate(quotient),
                    remainder=encode_univariate(remainder),
                )
            )
    speed_relations = []
    for index, constant in enumerate(constants, 1):
        guard()
        quotient, remainder = _divide(
            _mul((-constant, F(1)), remainders[index]), modulus
        )
        speed_relations.append(
            dict(
                branch_index=index,
                quotient=encode_univariate(quotient),
                remainder=encode_univariate(remainder),
            )
        )
    zero_polynomial = _mul((F(0), F(1)), _square_substitution(remainders[0]))
    zero_q, zero_r = _divide(zero_polynomial, odd)
    derivative = tuple(F(i) * odd[i] for i in range(1, len(odd)))
    gcd, u, v = _egcd(odd, derivative)
    bezout_residual = _sub(_add(_mul(odd, u), _mul(derivative, v)), (F(1),))
    accepted = (
        all(not row["remainder_difference"] for row in projectors)
        and not completeness
        and all(not row["remainder"] for row in relations + speed_relations)
        and not zero_r
        and gcd == (F(1),)
        and not bezout_residual
        and odd[0] == 0
        and odd[1] != 0
        and all(nodes[i] < nodes[i + 1] for i in range(6))
    )
    return dict(
        schema="nr-case12-spectral-univariate-v1",
        variable="y",
        constants=list(map(str, constants)),
        modulus=encode_univariate(modulus),
        projectors=projectors,
        completeness=encode_univariate(completeness),
        relations=relations,
        speed_relations=speed_relations,
        zero_action=dict(
            variable="t",
            polynomial=encode_univariate(zero_polynomial),
            quotient=encode_univariate(zero_q),
            remainder=encode_univariate(zero_r),
        ),
        squarefree=dict(
            variable="t",
            polynomial=encode_univariate(odd),
            derivative=encode_univariate(derivative),
            bezout_p=encode_univariate(u),
            bezout_derivative=encode_univariate(v),
            gcd=encode_univariate(gcd),
            residual=encode_univariate(bezout_residual),
            zero_constant=str(odd[0]),
            zero_linear=str(odd[1]),
        ),
        accepted=accepted,
    )


def nilpotent_witness(constants=None):
    """Actual 2x2 exact arithmetic: even squared test misses a zero Jordan block."""
    constants = _constants(constants)
    modulus, odd = _annihilators(constants)
    n = [[F(0), F(1)], [F(0), F(0)]]

    def multiply(a, b):
        return [
            [sum((a[i][k] * b[k][j] for k in range(2)), F(0)) for j in range(2)]
            for i in range(2)
        ]

    def evaluate(poly, a):
        result = [[F(0), F(0)], [F(0), F(0)]]
        for coefficient in reversed(poly):
            result = multiply(result, a)
            for i in range(2):
                result[i][i] += coefficient
        return result

    square = multiply(n, n)
    odd_result, even_result = evaluate(odd, n), evaluate(modulus, square)
    count = sum(bool(value) for row in odd_result for value in row)

    def encode(matrix):
        return [[str(value) for value in row] for row in matrix]

    return dict(
        schema="nr-case12-spectral-nilpotent-v1",
        r="1",
        g="1",
        constants=list(map(str, constants)),
        N=encode(n),
        N_squared=encode(square),
        odd_result=encode(odd_result),
        even_result=encode(even_result),
        nonzero_slots=count,
        zero_mode_rejected=count == 1
        and not any(value for row in even_result for value in row),
    )


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "parent spectral input SHA mismatch: " + str(path),
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-blocks-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["ode_blocks_validated"]
            is record["exact_quotient_cancellation_validated"]
            is True
            and record["errors"] == [],
            "accepted complete blocks and exact cancellation parent required",
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
        "frozen parent source identity",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "frozen parent worker identity",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest,
            "frozen parent input manifest identity",
        )
    for name, digest in {**DEPENDENCIES, **SOURCE_HASHES}.items():
        require(
            worker["source_before"][name] == digest,
            "frozen parent source dependency identity",
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(),
        "registered blocks parent directory only",
    )
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    return records, dict(
        schema="nr-case12-polynomial-spectral-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        blocks_parent_passed=True,
        main_rebuilt=False,
        section_rebuilt=False,
        blocks_rebuilt=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Only JSON/hash validation; safe in the nonmathematical finalizer."""
    return load_parent(parent_directory)[1]


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C, _ = _modules()
    field = context["field"]
    require(
        records["parent-inputs/parent-inputs/domain.json"] == context["domain"],
        "fixed accepted spectral domain",
    )
    raw = records["scalars.json"]
    require(
        set(raw) == {"r", "g", "b", "delta", "sigma", "trace_residual"}
        and raw["trace_residual"] == [],
        "complete accepted block scalar schema",
    )
    scalars = {}
    for name, cap in (("r", 2), ("g", 2), ("b", 1)):
        decoded = V.decode_polynomial(raw[name], max_degree=cap)
        value = field.ring.from_dict(
            {
                powers: field.domain.convert(coefficient)
                for powers, coefficient in decoded.items()
            }
        )
        require(
            value == P.polynomial(context[name], field, max_degree=cap),
            "source-bound direction scalar identity",
        )
        scalars[name] = value
    r, g, b = scalars["r"], scalars["g"], scalars["b"]
    Ab = C._to_matrix(records["division_quotient.json"], field, (43, 43), 4, guard)
    Pt = C._to_matrix(records["Pt.json"], field, (43, 43), 2, guard)
    X = C.zeros(43, 43, field.ring)
    for i, row in enumerate(Ab):
        guard()
        for j, value in enumerate(row):
            X[i, j] = value - b * Pt[i, j]
    stats = {}

    def save_stage(name, matrix):
        guard()
        stats[name] = C.matrix_stats(matrix, MATRIX_CAPS[name])
        sink(name, matrix)
        guard()

    matrices = recurrence(X, r, g, context["constants"], guard=guard, sink=save_stage)
    univariate = univariate_certificate(context["constants"], guard=guard)
    guard()
    negative = nilpotent_witness(context["constants"])
    acceptance = dict(
        annihilator_zero=all(not value for value in matrices["Z3"].flat),
        six_branch_reduction=univariate["accepted"],
        nilpotent_detected=negative["zero_mode_rejected"],
    )
    acceptance["accepted"] = all(acceptance.values())
    squared_speeds = tuple(field.domain.convert(c) * g for c in context["constants"])
    encoded_scalars = {
        name: P.canonical_polynomial(value) for name, value in scalars.items()
    }
    encoded_scalars["squared_speeds"] = [
        P.canonical_polynomial(value) for value in squared_speeds
    ]
    return dict(
        **matrices,
        **scalars,
        scalars=encoded_scalars,
        squared_speeds=squared_speeds,
        branch_constants=context["constants"],
        univariate=univariate,
        nilpotent_witness=negative,
        acceptance=acceptance,
        stats=stats,
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
        domain=context["domain"],
        main_rebuilt=False,
        section_rebuilt=False,
        blocks_rebuilt=False,
        minimal_polynomial_proved=False,
        multiplicities_proved=False,
        direction_uniform_energy_proved=False,
    )

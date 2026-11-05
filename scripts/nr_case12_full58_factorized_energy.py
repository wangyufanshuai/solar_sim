"""Source-bound fixed-case12 full58 factorized principal-energy candidate.

Scientific arithmetic runs only in the owned worker. Manifest functions use
stdlib hashes, AST and JSON. The quadratic tables are coefficients on fourteen
ordered operator factors; they are not expanded 58 by 58 energy matrices.
"""

import ast
import hashlib
import importlib
import json
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARENT_DIRECTORY = (
    ROOT / "tmp/nr-shadow-evidence/nr-k3-case12-full58-spectral-controls-v1-20261014"
)
PARENT_GATE_SHA = "b1f20875989575329e37267a8ff8eb45e57d761e34063b53df077bb007ee209f"
PARENT_WORKER_SHA = "57059edd39496954067c33edb8ff62e9b1432a8f0ce1de2659888105200888a2"
ENERGY_SOURCE = "scripts/nr_constraint_laurent_energy.py"
PROFILE_SOURCE = "scripts/nr_profile_exact_coefficients.py"
SOURCE_HASHES = {
    ENERGY_SOURCE: "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
    PROFILE_SOURCE: "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
}
DEPENDENCIES = {
    "scripts/nr_case12_full58_spectral.py": "7a5511bcb877e88175143096c0f789eee19b6f723df6f6c7390c97d59e05d5a8",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
}
PARENT_INPUT_HASHES = {
    "K0.json": "7e110dbd9df16f71644d976e2ac56f13b6fc52be1b9b6cc85ca910a20a395775",
    "Pi.json": "88d309ccca7331c0d5a76e4f1516d1766fe0d2d29cdfbc660225fac7baf4bfbb",
    "Z6.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "shift_residual.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "embedding_residual.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "scalars.json": "2e85ea16f3b88c00a4faa81e0c26931ef049c0b7408621501593245879765b63",
    "stats.json": "31c42a45a694f806c783bd0d3d078a4c3914c20b8ecbc3176248df2b036a4691",
    "independent-replay.json": "6d5b41b3beedd01b961cecf069a31082e1b64934c7aec7a600cc5568981b1433",
    "source_bridge.json": "0022319c8cb323b6b36176970a56fdf124511195443fb829b12c3eb4fb807b92",
    "parent_provenance.json": "ce2410b16d79f47788b243269745141469b6834cacee909e110590de1ce15d08",
    "parent-inputs/K.json": "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
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
BASIS = (
    "O",
    "E0",
    "E1",
    "E2",
    "E3",
    "E4",
    "E5",
    "E6",
    "a1",
    "a2",
    "a3",
    "a4",
    "a5",
    "a6",
)
TABLE_ORDER = (
    "H",
    "Cgram",
    "right_action",
    "pi_action",
    "identity_gram",
    "Hsym",
    "HT",
    "HPi",
    "Gram",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _registered_profile():
    require(
        type(BRANCHES) is tuple
        and BRANCHES
        == ("ordering-T", "ordering-L", "light", "lapse", "shift-T", "shift-L")
        and type(BRANCH_RATIONALS) is tuple
        and all(
            type(pair) is tuple and all(type(x) is int for x in pair)
            for pair in BRANCH_RATIONALS
        )
        and BRANCH_RATIONALS
        == (
            (2601, 100000),
            (2601, 50000),
            (2601, 5000),
            (153, 125),
            (459, 250),
            (306, 125),
        ),
        "original ordered six exact branches required",
    )
    require(
        type(BASIS) is tuple
        and BASIS
        == (
            "O",
            "E0",
            "E1",
            "E2",
            "E3",
            "E4",
            "E5",
            "E6",
            "a1",
            "a2",
            "a3",
            "a4",
            "a5",
            "a6",
        )
        and type(TABLE_ORDER) is tuple
        and TABLE_ORDER
        == (
            "H",
            "Cgram",
            "right_action",
            "pi_action",
            "identity_gram",
            "Hsym",
            "HT",
            "HPi",
            "Gram",
        ),
        "complete ordered factorized quadratic profile required",
    )


def branch_constants():
    _registered_profile()
    return tuple(F(n, d) for n, d in BRANCH_RATIONALS)


def _constants(constants):
    expected = branch_constants()
    constants = expected if constants is None else constants
    require(
        type(constants) is tuple
        and all(type(c) is F for c in constants)
        and constants == expected,
        "registered six Fraction constants required",
    )
    return constants


def verify_source(source, source_name=ENERGY_SOURCE):
    require(
        type(source_name) is str and source_name in SOURCE_HASHES,
        "registered formula source required",
    )
    require(
        type(source) is bytes
        and hashlib.sha256(source).hexdigest() == SOURCE_HASHES[source_name],
        "frozen formula source SHA mismatch",
    )


def translated_ast(source, source_name=ENERGY_SOURCE):
    """Bind unchanged formula ASTs; no compiled replacement of paired_energy."""
    verify_source(source, source_name)
    tree = ast.parse(source.decode("utf-8"), filename=source_name)
    if source_name == ENERGY_SOURCE:
        names = ("paired_energy",)
        nodes = [
            next(
                n
                for n in tree.body
                if isinstance(n, ast.FunctionDef) and n.name == names[0]
            )
        ]
    else:
        names = ("Background.squared_speeds", "intrinsic", "annihilator")
        cls = next(
            n
            for n in tree.body
            if isinstance(n, ast.ClassDef) and n.name == "Background"
        )
        nodes = [
            next(
                n
                for n in cls.body
                if isinstance(n, ast.FunctionDef) and n.name == "squared_speeds"
            )
        ]
        nodes += [
            next(
                n
                for n in tree.body
                if isinstance(n, ast.FunctionDef) and n.name == name
            )
            for name in names[1:]
        ]
    module = ast.Module(body=nodes, type_ignores=[])
    digest = hashlib.sha256(
        ast.dump(module, include_attributes=False).encode()
    ).hexdigest()
    return module, dict(
        source=source_name,
        source_sha256=SOURCE_HASHES[source_name],
        functions=list(names),
        edits=[],
        original_ast_sha256=digest,
        adapted_ast_sha256=digest,
        executed=False,
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Pure stdlib byte/AST binding and explicit formula-to-factor correspondence."""
    _registered_profile()
    _verify_dependencies()
    bindings = {
        name: translated_ast((ROOT / name).read_bytes(), name)[1]
        for name in SOURCE_HASHES
    }
    return dict(
        schema="nr-case12-full58-factorized-source-bridge-v1",
        bindings=bindings,
        dependencies=DEPENDENCIES.copy(),
        branches=list(BRANCHES),
        constants=[str(c) for c in branch_constants()],
        formula_correspondence={
            "intrinsic": "K0",
            "ode": "O=I58-Pi",
            "pde": "Pi",
            "squared": "c_j*g",
            "diagonal": "I58",
            "pairs": "E_j=e_j(K0^2/g)*Pi",
            "zero": "E0=u0(T)*Pi=Pi-sum(E_j)",
            "actions": "A_j=K0*E_j; a_j=A_j/sqrt(g)",
            "weights": ["1", "1", *(["1/2"] * 6)],
            "coercivity_denominator": "14",
            "gram": "left-transpose times right",
        },
        polynomial_extension="QQ[t] relations modulo t*product(t^2-c_j)",
        parent_spectral_source=DEPENDENCIES["scripts/nr_case12_full58_spectral.py"],
        original_formula_executed=False,
        full_python_semantics_proved=False,
        expanded_energy_computed=False,
    )


def _pinned_json(path, digest):
    raw = path.read_bytes()
    require(
        hashlib.sha256(raw).hexdigest() == digest,
        "pinned evidence SHA mismatch: " + path.name,
    )
    return json.loads(raw)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-full58-spectral-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["full58_principal_spectral_validated"]
            is True
            and record["errors"] == [],
            "complete passed full58 spectral parent required",
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
            "shadow-only full58 parent required",
        )
    require(
        gate["supervisor"]["cleanup_verified"] is True,
        "parent cleanup must be complete",
    )
    require(
        worker["source_before"] == worker["source_after"],
        "parent source closure unchanged",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "parent worker binding",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "parent artifact binding: " + name
        )
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES}.items():
        require(
            worker["source_before"][name] == digest,
            "parent original source binding: " + name,
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    require(callable(guard), "callable resource guard required")
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(),
        "only the registered successful spectral parent",
    )
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
        replay["passed"] is replay["acceptance"]["accepted"] is True
        and replay["acceptance"]["annihilator_zero"] is True
        and replay["independent_dimension"] == 58
        and replay["annihilator_slots"] == 3364,
        "complete independently replayed odd full58 annihilator required",
    )
    for name in (
        "K0.json",
        "Pi.json",
        "Z6.json",
        "shift_residual.json",
        "embedding_residual.json",
        "scalars.json",
    ):
        require(
            replay["input_hashes"][name] == PARENT_INPUT_HASHES[name],
            "replayed parent input binding",
        )
    return records, dict(
        schema="nr-case12-full58-factorized-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        full58_spectral_parent_passed=True,
        inherited_odd_annihilator=True,
        main_rebuilt=False,
        spectral_recurrence_repeated=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Pure stdlib JSON/SHA, usable by the nonmathematical finalizer."""
    return load_parent(parent_directory)[1]


def build_context(*, guard=lambda: None):
    require(callable(guard), "callable guard required")
    guard()
    manifest = source_bridge_manifest()
    from sympy.polys.domains import QQ
    from sympy.polys.rings import ring

    algebra, t = ring("t", QQ)
    guard()
    return dict(ring=algebra, t=t, constants=branch_constants(), source_bridge=manifest)


def _ring(ring):
    require(
        getattr(ring, "ngens", None) == 1
        and str(ring.domain) == "QQ"
        and tuple(map(str, ring.symbols)) == ("t",),
        "exact QQ[t] polynomial ring required",
    )


def _fraction(value):
    if type(value) is F:
        return value
    if type(value) is int:
        return F(value)
    require(
        getattr(value, "is_Rational", False) is True, "exact rational scalar required"
    )
    return F(int(value.p), int(value.q))


def rational(value):
    require(type(value) is str, "canonical rational string required")
    try:
        number = F(value)
    except (ValueError, ZeroDivisionError) as error:
        raise ValueError("invalid rational string") from error
    require(str(number) == value, "reduced canonical rational string required")
    return number


def encode_univariate(poly):
    require(hasattr(poly, "ring"), "exact QQ[t] polynomial required")
    _ring(poly.ring)
    require(isinstance(poly, poly.ring.dtype), "exact polynomial element required")
    result = []
    for (power,), coefficient in sorted(poly.items()):
        n, d = int(coefficient.numerator), int(coefficient.denominator)
        value = F(n, d)
        require(value != 0, "nonzero canonical polynomial terms required")
        result.append([power, str(value.numerator), str(value.denominator)])
    return result


def decode_univariate(record, ring, *, degree_cap=26):
    _ring(ring)
    require(
        type(record) is list and type(degree_cap) is int and degree_cap >= 0,
        "canonical sparse univariate record and degree cap required",
    )
    values, previous = {}, -1
    for row in record:
        require(
            type(row) is list and len(row) == 3,
            "complete sparse univariate term required",
        )
        power, numerator, denominator = row
        require(
            type(power) is int and previous < power <= degree_cap,
            "strict ascending nonnegative bounded powers required",
        )
        require(
            type(numerator) is str and type(denominator) is str,
            "integer coefficient strings required",
        )
        try:
            n, d = int(numerator), int(denominator)
        except ValueError as error:
            raise ValueError("integer coefficient strings required") from error
        require(
            str(n) == numerator and str(d) == denominator and n != 0 and d > 0,
            "canonical nonzero coefficient with positive denominator required",
        )
        value = F(n, d)
        require(
            value.numerator == n and value.denominator == d,
            "reduced coefficient required",
        )
        values[(power,)] = ring.domain.convert(value)
        previous = power
    return ring.from_dict(values)


def encode_table(matrix):
    if hasattr(matrix, "rows") and hasattr(matrix, "cols"):
        rows, columns = matrix.rows, matrix.cols

        def get(i, j):
            return matrix[i, j]
    else:
        require(
            type(matrix) in (list, tuple) and len(matrix) > 0,
            "nonempty exact table required",
        )
        rows, columns = len(matrix), len(matrix[0])
        require(
            columns > 0
            and all(
                type(row) in (list, tuple) and len(row) == columns for row in matrix
            ),
            "rectangular exact table required",
        )

        def get(i, j):
            return matrix[i][j]

    return dict(
        shape=[rows, columns],
        entries=[
            [i, j, str(_fraction(get(i, j)))]
            for i in range(rows)
            for j in range(columns)
        ],
    )


def decode_table(record, *, shape=None):
    require(
        type(record) is dict and set(record) == {"shape", "entries"},
        "complete rational table schema",
    )
    dims = record["shape"]
    require(
        type(dims) is list
        and len(dims) == 2
        and all(type(n) is int and n > 0 for n in dims),
        "positive exact table shape required",
    )
    require(
        shape is None or tuple(dims) == tuple(shape), "registered table shape required"
    )
    rows, columns = dims
    entries = record["entries"]
    require(
        type(entries) is list and len(entries) == rows * columns,
        "all table slots required",
    )
    result = [[F(0) for _ in range(columns)] for _ in range(rows)]
    for index, row in enumerate(entries):
        i, j = divmod(index, columns)
        require(
            type(row) is list
            and len(row) == 3
            and type(row[0]) is type(row[1]) is int
            and row[:2] == [i, j],
            "canonical complete row-major slots required",
        )
        result[i][j] = rational(row[2])
    return result


def _projectors(context, *, guard=lambda: None):
    algebra, t, constants = context["ring"], context["t"], context["constants"]
    nodes, projectors, us = (F(0), *constants), [], []
    for j, node in enumerate(nodes):
        guard()
        e = algebra.one
        for other in nodes:
            if node != other:
                e = (
                    e
                    * (t - algebra.domain.convert(other))
                    / algebra.domain.convert(node - other)
                )
        u = algebra.from_dict(
            {(2 * power[0],): coefficient for power, coefficient in e.items()}
        )
        us.append(u)
        projectors.append(
            dict(
                name="zero" if j == 0 else f"branch-{j}",
                node=str(node),
                e=encode_univariate(e),
                u=encode_univariate(u),
            )
        )
    return projectors, us


def _division(name, polynomial, modulus):
    quotient, remainder = divmod(polynomial, modulus)
    back = polynomial - modulus * quotient - remainder
    return dict(
        name=name,
        polynomial=encode_univariate(polynomial),
        quotient=encode_univariate(quotient),
        remainder=encode_univariate(remainder),
        multiplyback=encode_univariate(back),
    )


def univariate_certificate(constants=None, *, guard=lambda: None):
    constants = _constants(constants)
    context = build_context(guard=guard)
    algebra, t = context["ring"], context["t"]
    modulus = t
    for c in constants:
        modulus *= t**2 - algebra.domain.convert(c)
    projectors, us = _projectors(context, guard=guard)
    aa = [divmod(t * u, modulus)[1] for u in us[1:]]
    inputs = [
        (f"projector-{i}-{j}", us[i] * us[j] - (us[i] if i == j else algebra.zero))
        for i in range(7)
        for j in range(7)
    ]
    inputs.append(("completeness", sum(us, algebra.zero) - algebra.one))
    inputs.extend((f"action-{j}", t * us[j] - aa[j - 1]) for j in range(1, 7))
    inputs.extend(
        (f"speed-{j}", (t**2 - algebra.domain.convert(c)) * us[j])
        for j, c in enumerate(constants, 1)
    )
    inputs.extend(
        (f"transfer-{j}", t * aa[j - 1] - algebra.domain.convert(c) * us[j])
        for j, c in enumerate(constants, 1)
    )
    inputs.append(("zero-action", t * us[0]))
    relations = []
    for name, polynomial in inputs:
        guard()
        relations.append(_division(name, polynomial, modulus))
    guard()
    return dict(
        schema="nr-case12-full58-factorized-univariate-v1",
        variable="t",
        lagrange_variable="y",
        constants=[str(c) for c in constants],
        modulus=encode_univariate(modulus),
        projectors=projectors,
        actions=[
            dict(branch_index=j, a=encode_univariate(a)) for j, a in enumerate(aa, 1)
        ],
        relations=relations,
        accepted=all(not r["remainder"] and not r["multiplyback"] for r in relations),
    )


def formal_gram_certificate(constants=None, *, guard=lambda: None):
    constants = _constants(constants)
    require(callable(guard), "callable resource guard required")
    from sympy import Matrix, Rational, diag, zeros

    def exact(value):
        return Rational(value.numerator, value.denominator)

    weights = (F(1), F(1), *([F(1, 2)] * 6))
    action_weights = tuple(F(1, 2) / c for c in constants)
    guard()
    h = diag(*(exact(w) for w in (*weights, *action_weights)))
    right, pi = zeros(14), diag(0, *([1] * 13))
    for j, c in enumerate(constants):
        right[j + 2, j + 8], right[j + 8, j + 2] = 1, exact(c)
    identity = Matrix([1] * 8 + [0] * 6)
    shifted, cgram = zeros(8, 14), zeros(14)
    for i, weight in enumerate(weights):
        guard()
        difference = -identity / (14 * exact(weight))
        difference[i, 0] += 1
        shifted[i, :] = difference.T
        cgram += exact(weight) * difference * difference.T
    for j, weight in enumerate(action_weights):
        cgram[j + 8, j + 8] += exact(weight)
    guard()
    identity_gram = identity * identity.T
    tables = dict(
        H=h,
        Cgram=cgram,
        right_action=right,
        pi_action=pi,
        identity_gram=identity_gram,
        Hsym=h - h.T,
        HT=h * right - right.T * h,
        HPi=h * pi - pi.T * h,
        Gram=h - identity_gram / 14 - cgram,
    )
    encoded = {}
    for name, matrix in tables.items():
        guard()
        encoded[name] = encode_table(matrix)
    return dict(
        schema="nr-case12-full58-factorized-quadratic-v1",
        basis=list(BASIS),
        component_weights=[str(w) for w in weights],
        action_weights=[str(w) for w in action_weights],
        identity_vector=[str(int(i < 8)) for i in range(14)],
        tables=encoded,
        shifted_components=encode_table(shifted),
        accepted=all(not any(tables[name]) for name in ("Hsym", "HT", "HPi", "Gram")),
    )


def _replay_module():
    _verify_dependencies()
    return importlib.import_module("nr_polynomial_certificate_replay")


def coefficient_bound(K0_record, projectors, *, m=F(5, 6), guard=lambda: None):
    require(
        type(m) is F and m == F(5, 6) and callable(guard),
        "registered Fraction metric floor and callable guard required",
    )
    context = build_context(guard=guard)
    require(
        type(projectors) is list and len(projectors) == 7,
        "complete seven projector rows required",
    )
    for row in projectors:
        require(
            type(row) is dict
            and set(row) == {"name", "node", "e", "u"}
            and type(row["name"]) is str
            and type(row["node"]) is str,
            "strict original projector record required",
        )
        rational(row["node"])
        decode_univariate(row["e"], context["ring"], degree_cap=6)
        decode_univariate(row["u"], context["ring"], degree_cap=12)
    require(
        type(projectors) is list and projectors == _projectors(context, guard=guard)[0],
        "all seven original exact Lagrange projector records required",
    )
    V = _replay_module()
    matrix = V.decode_matrix(K0_record, shape=(58, 58), max_degree=1)
    entries, total = [], F(0)
    for i, row in enumerate(matrix):
        guard()
        for j, poly in enumerate(row):
            require(
                all(sum(power) == 1 for power in poly), "homogeneous linear K0 required"
            )
            require(
                not poly or (i >= 11 and j >= 11), "both first11 K0 blocks must vanish"
            )
            value = sum((abs(c) for c in poly.values()), F(0))
            entries.append([i, j, str(value)])
            total += value
    ratio, q, rows = total * total / m, [], []
    for projector in projectors:
        guard()
        polynomial = decode_univariate(projector["e"], context["ring"], degree_cap=6)
        terms = []
        for (power,), coefficient in sorted(polynomial.items()):
            value = abs(F(int(coefficient.numerator), int(coefficient.denominator)))
            terms.append([power, str(value), str(value * ratio**power)])
        value = sum((rational(term[2]) for term in terms), F(0))
        q.append(value)
        rows.append(dict(name=projector["name"], terms=terms, value=str(value)))
    pairs = [value * value / 2 for value in q[1:]]
    actions = [
        total * total * value * value / (2 * m * c)
        for value, c in zip(q[1:], context["constants"], strict=True)
    ]
    upper = F(1) + q[0] ** 2 + sum(pairs, F(0)) + sum(actions, F(0))
    guard()
    return dict(
        schema="nr-case12-full58-factorized-bound-v1",
        shape=[58, 58],
        entries=entries,
        B=str(total),
        m=str(m),
        ratio=str(ratio),
        q=[str(value) for value in q],
        q_rows=rows,
        upper_terms=dict(
            ode="1",
            zero=str(q[0] ** 2),
            pairs=list(map(str, pairs)),
            actions=list(map(str, actions)),
        ),
        upper=str(upper),
        lower="1/14",
        shift_norm_upper="3/25",
        main_norm_upper=str(total + F(3, 25)),
        sphere="r=1",
        accepted=upper >= F(1, 14),
    )


def negative_controls(univariate, *, guard=lambda: None):
    context = build_context(guard=guard)
    from sympy import Matrix, Rational, eye, zeros

    algebra, t = context["ring"], context["t"]
    require(
        type(univariate) is dict
        and univariate.get("schema") == "nr-case12-full58-factorized-univariate-v1",
        "registered univariate witness record required",
    )
    modulus = decode_univariate(univariate["modulus"], algebra, degree_cap=13)
    u0 = decode_univariate(univariate["projectors"][0]["u"], algebra, degree_cap=12)
    n = Matrix([[0, 1], [0, 0]])

    def evaluate(poly, matrix):
        answer = zeros(2)
        for power in range(max((p[0] for p in poly), default=-1), -1, -1):
            guard()
            coefficient = poly.get((power,), algebra.domain.zero)
            answer = answer * matrix + Rational(
                int(coefficient.numerator), int(coefficient.denominator)
            ) * eye(2)
        return answer

    nq = n * n
    odd = evaluate(modulus, n)
    even_polynomial = t
    for c in context["constants"]:
        even_polynomial *= t - algebra.domain.convert(c)
    even = evaluate(even_polynomial, nq)
    zero_action = n * evaluate(u0, n)

    def count(matrix):
        return sum(bool(value) for value in matrix)

    jordan = dict(
        N=encode_table(n),
        N_squared=encode_table(nq),
        odd_result=encode_table(odd),
        even_result=encode_table(even),
        zero_action_result=encode_table(zero_action),
        odd_nonzero_slots=count(odd),
        zero_action_nonzero_slots=count(zero_action),
        detected=not count(nq)
        and not count(even)
        and count(odd) > 0
        and count(zero_action) > 0,
    )
    rows = [row for row in univariate["relations"] if row["name"] == "zero-action"]
    require(len(rows) == 1, "exactly one original zero-action relation required")
    value = decode_univariate(rows[0]["polynomial"], algebra) + algebra.one
    division = _division("add-one-to-zero-action", value, modulus)
    mutation = dict(
        **division,
        original_relation="zero-action",
        rejected=bool(division["remainder"]) and not division["multiplyback"],
    )
    guard()
    return dict(
        schema="nr-case12-full58-factorized-negatives-v1",
        jordan=jordan,
        relation_mutation=mutation,
        accepted=jordan["detected"] and mutation["rejected"],
    )


def domain_metadata():
    return dict(
        schema="nr-case12-full58-factorized-domain-v1",
        real_domain="v!=0",
        unit_sphere="r=1",
        g_lower="5/6",
        gram_metric="I58",
        normalization="T=K0/sqrt(g); a_j=A_j/sqrt(g)",
        denominators=["g"],
        smooth_on_real_domain=True,
        full58_scope="fixed-case12 geometric=False principal rational direction extension",
        expanded_H_computed=False,
    )


def _parent_structure(records, *, guard=lambda: None):
    V = _replay_module()
    parent = importlib.import_module("nr_case12_full58_spectral")
    require(
        records["source_bridge.json"] == parent.source_bridge_manifest(),
        "unchanged parent formula bridge",
    )
    require(
        records["parent_provenance.json"] == parent.parent_provenance_manifest(),
        "unchanged parent mathematical ancestry",
    )
    k0 = V.decode_matrix(records["K0.json"], shape=(58, 58), max_degree=1)
    k = V.decode_matrix(records["parent-inputs/K.json"], shape=(58, 58), max_degree=1)
    pi = V.decode_matrix(records["Pi.json"], shape=(58, 58), max_degree=0)
    scalars = records["scalars.json"]
    require(
        set(scalars) == {"r", "g", "b", "squared_speeds"},
        "complete parent scalar schema",
    )
    b = V.decode_polynomial(scalars["b"], max_degree=1)
    denominators = records["parent-inputs/parent-inputs/denominators.json"]
    require(
        scalars["r"] == denominators["r"] and scalars["g"] == denominators["g"],
        "fixed domain direction scalar binding",
    )
    expected_b = {(1, 0, 0): F(3, 100), (0, 1, 0): F(-1, 25), (0, 0, 1): F(1, 20)}
    require(b == expected_b, "source-bound shift polynomial")
    zero = True
    for name in ("Z6.json", "shift_residual.json", "embedding_residual.json"):
        matrix = V.decode_matrix(
            records[name], shape=(58, 58), max_degree=13 if name == "Z6.json" else 1
        )
        zero = zero and not any(poly for row in matrix for poly in row)
    structure = True
    for i in range(58):
        guard()
        for j in range(58):
            require(
                all(sum(p) == 1 for p in k0[i][j])
                and all(sum(p) == 1 for p in k[i][j]),
                "homogeneous first-order parent matrix required",
            )
            expected_pi = {(0, 0, 0): F(1)} if i == j and i >= 11 else {}
            structure = structure and pi[i][j] == expected_pi
            structure = structure and (
                i >= 11 and j >= 11 or not k0[i][j] and not k[i][j]
            )
            difference = dict(k[i][j])
            for power, coefficient in k0[i][j].items():
                difference[power] = difference.get(power, F(0)) - coefficient
            if i == j and i >= 11:
                for power, coefficient in b.items():
                    difference[power] = difference.get(power, F(0)) - coefficient
            structure = structure and not any(difference.values())
    guard()
    return bool(zero and structure)


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, record: None,
):
    require(
        callable(guard) and callable(sink), "callable resource guard and sink required"
    )

    def save(name, record):
        guard()
        sink(name, record)
        guard()
        return record

    source_bridge = source_bridge_manifest()
    records, provenance = load_parent(parent_directory, guard=guard)
    save("source_bridge", source_bridge)
    save("parent_provenance", provenance)
    parent_structure = _parent_structure(records, guard=guard)
    univariate = save("univariate", univariate_certificate(guard=guard))
    formal = save("formal", formal_gram_certificate(guard=guard))
    bounds = save(
        "bounds",
        coefficient_bound(records["K0.json"], univariate["projectors"], guard=guard),
    )
    negatives = save("negatives", negative_controls(univariate, guard=guard))
    domain = save("domain_metadata", domain_metadata())

    def table_zero(name):
        return all(row[2] == "0" for row in formal["tables"][name]["entries"])

    acceptance = dict(
        parent_structure=parent_structure,
        univariate_relations=univariate["accepted"],
        formal_symmetry=table_zero("Hsym"),
        formal_intrinsic=table_zero("HT"),
        formal_pde=table_zero("HPi"),
        formal_coercivity=table_zero("Gram"),
        uniform_bounds=bounds["accepted"],
        negative_controls=negatives["accepted"],
    )
    acceptance["accepted"] = all(acceptance.values())
    save("acceptance", acceptance)
    return dict(
        univariate=univariate,
        formal=formal,
        bounds=bounds,
        negatives=negatives,
        domain_metadata=domain,
        acceptance=acceptance,
        source_bridge=source_bridge,
        parent_provenance=provenance,
    )

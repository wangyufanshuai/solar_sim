"""Owned fixed-case12 complete projector/action inputs for a later Gram energy.

Only two large products are constructed. Existing spectral evidence supplies
the remaining polynomial identities. No H, coercivity or uniform energy is
constructed here; nonzero completeness/trace candidates remain saved evidence.
"""

import ast
import copy
import hashlib
import importlib
import json
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARENT_DIRECTORY = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-spectral-controls-v1-20261014"
)
PARENT_GATE_SHA = "67e2eda4ab922a09390ff8207a709ede327ac1619caca5a1322c16fd3825b0e6"
PARENT_WORKER_SHA = "6b320f7812c754dd8a8ebfdf06168af9d90719e851e5391e047203641c1f7e9e"
SOURCE = "scripts/nr_constraint_laurent_energy.py"
SOURCE_SHA = "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b"
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_polynomial_blocks.py": "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5",
    "scripts/nr_case12_polynomial_spectral.py": "4e9dfc5058af58cbf94526d0846e314e3d7c054b1726e2184e9a8eba50ac13e8",
}
PARENT_INPUT_HASHES = {
    "X.json": "8ca8cbbcb17810fe0f48a2681285648bcd659c602091c0ba863f72d5e801a3e0",
    "Q.json": "2cfff34ee536ac22444ce2e486972ee0283dadeb06f9ba760ccef647fe6c5ec4",
    "Z1.json": "f49da69b2633992ca3bfff7fe7babac8c7c3df1d94a4f3b7d0f8b9aaa55573b1",
    "Z2.json": "630fa65af986da6a3d7bb0b28bdd74537bdb71faef6beb09526a2db0db19c437",
    "univariate.json": "9063a1887e060f61b6629b52fcdbf667242acd6dadcead4deadbcd3592b81cd6",
    "scalars.json": "2e85ea16f3b88c00a4faa81e0c26931ef049c0b7408621501593245879765b63",
    "parent-inputs/Pt.json": "1e34f1af36c881793cda6a323d1ec62e43258cf15089b4fb06d30acb2da02def",
    "parent-inputs/parent-inputs/parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    "parent-inputs/parent-inputs/parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
}
COMPONENTS = ("NO", "N0", "N1", "N2", "N3", "N4", "N5", "N6")
MATRIX_CAPS = {
    "Q2": 16,
    "Q3": 24,
    "X3": 12,
    "X5": 20,
    "NO": 18,
    **{"N" + str(j): 24 for j in range(1, 7)},
    "N0": 24,
    **{"M" + str(j): 20 for j in range(1, 7)},
    "projector_completeness": 24,
    "action_completeness": 20,
}
MATRIX_ORDER = tuple(MATRIX_CAPS)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == SOURCE_SHA,
        "frozen paired-energy source SHA mismatch",
    )


def translated_ast(source):
    """Bind original paired_energy without executing or adapting its body."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=SOURCE)
    fn = next(
        node
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name == "paired_energy"
    )
    tree = ast.Module(body=[copy.deepcopy(fn)], type_ignores=[])
    digest = hashlib.sha256(
        ast.dump(tree, include_attributes=False).encode()
    ).hexdigest()
    return tree, dict(
        source=SOURCE,
        source_sha256=SOURCE_SHA,
        functions=["paired_energy"],
        edits=[],
        original_ast_sha256=digest,
        adapted_ast_sha256=digest,
        execution="not executed; frozen spectral one-variable reduction and explicit denominator clearing",
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen projector dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Stdlib-only source/AST binding; no scientific imports or calculations."""
    _verify_dependencies()
    _, energy = translated_ast((ROOT / SOURCE).read_bytes())
    return dict(
        schema="nr-case12-polynomial-projectors-bridge-v1",
        paired_energy=energy,
        dependencies=DEPENDENCIES.copy(),
        components=list(COMPONENTS),
        spectral_formula="Y=L^2/g; Ej=ej(Y)P; positive branches ej(0)=0; E0=P-sum(Ej)",
        action_formula="t*ej(t^2)=qj(t)*p7(t)+u1*t+u3*t^3+u5*t^5",
        denominators="d=r^2*g; D=d^3; eta=r^5*g^2",
        large_products=["Q*Q", "Q2*Q"],
        scope="complete projector/action energy inputs only; no H or energy claim",
    )


def _modules():
    _verify_dependencies()
    result = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen projector module path",
        )
        result.append(module)
    return tuple(result)


def build_context(*, guard=lambda: None):
    guard()
    manifest = source_bridge_manifest()
    *_, S = _modules()
    context = S.build_context(guard=guard)
    return {**context, "source_bridge": manifest}


def _checked_univariate(univariate, constants, guard):
    *_, S = _modules()
    constants = S._constants(constants)
    require(
        type(univariate) is dict
        and univariate == S.univariate_certificate(constants, guard=guard),
        "complete frozen six-branch univariate certificate required",
    )
    return S, constants


def action_univariate_certificate(univariate, *, guard=lambda: None):
    """Reduce the ORIGINAL six projectors, not only their previously saved remainders."""
    *_, S = _modules()
    constants = S.branch_constants()
    S, constants = _checked_univariate(univariate, constants, guard)
    odd = S.decode_univariate(univariate["squarefree"]["polynomial"], max_degree=7)
    rows = []
    for index, projector in enumerate(univariate["projectors"][1:], 1):
        guard()
        original = S.decode_univariate(projector["polynomial"], max_degree=6)
        polynomial = S._mul((F(0), F(1)), S._square_substitution(original))
        quotient, remainder = S._divide(polynomial, odd)
        residual = S._sub(polynomial, S._add(S._mul(quotient, odd), remainder))
        allowed = len(remainder) <= 6 and all(
            not value for i, value in enumerate(remainder) if i not in (1, 3, 5)
        )
        coefficients = [
            str(remainder[i] if i < len(remainder) else F(0)) for i in (1, 3, 5)
        ]
        rows.append(
            dict(
                name="branch-" + str(index),
                branch_index=index,
                original_projector=S.encode_univariate(original),
                original_polynomial=S.encode_univariate(polynomial),
                quotient=S.encode_univariate(quotient),
                remainder=S.encode_univariate(remainder),
                coefficients=coefficients,
                identity_residual=S.encode_univariate(residual),
                odd_degree_at_most_five=allowed,
            )
        )
    return dict(
        schema="nr-case12-projector-actions-univariate-v1",
        constants=list(map(str, constants)),
        odd_annihilator=S.encode_univariate(odd),
        rows=rows,
        accepted=all(
            not row["identity_residual"] and row["odd_degree_at_most_five"]
            for row in rows
        )
        and all(not row["remainder"] for row in rows[3:]),
    )


def _validate_matrices(matrices, r, g):
    P, *_ = _modules()
    P.canonical_polynomial(r)
    P.canonical_polynomial(g)
    ring = r.ring
    require(
        bool(r) and bool(g) and g.ring == ring and str(ring.order) == "lex",
        "matching nonzero lex direction polynomials",
    )
    first = matrices[0]
    require(
        getattr(first, "ndim", None) == 2
        and first.shape[0] == first.shape[1]
        and 1 <= first.shape[0] <= 43,
        "bounded nonempty square projector input",
    )
    for matrix in matrices:
        require(
            getattr(matrix, "ndim", None) == 2
            and matrix.shape == first.shape
            and all(
                isinstance(value, ring.dtype) and value.ring == ring
                for value in matrix.flat
            ),
            "matching exact same-ring projector matrices",
        )
    return ring, first.shape[0]


def projectors_from_matrices(
    X,
    Q,
    Z1,
    Z2,
    Pt,
    r,
    g,
    constants,
    univariate,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    """Explicit algebra helper; external inputs do not confer the parent theorem."""
    guard()
    P, _, C, _, S = _modules()
    constants = S._constants(constants)
    ring, size = _validate_matrices((X, Q, Z1, Z2, Pt), r, g)
    _checked_univariate(univariate, constants, guard)
    actions = action_univariate_certificate(univariate, guard=guard)
    require(actions["accepted"], "registered scalar action reduction")
    d, D = r**2 * g, r**6 * g**3
    d2, D_over_r, eta_over_r = d**2, r**5 * g**3, r**4 * g**2
    result = {}

    def save(name, matrix):
        guard()
        result[name] = matrix
        sink(name, matrix)
        guard()

    Q2 = P.multiply(Q, Q, guard=guard)
    save("Q2", Q2)
    Q3 = P.multiply(Q2, Q, guard=guard)
    save("Q3", Q3)
    c1, c2 = (ring.domain.convert(value) for value in constants[:2])
    c1d, c12d, c1c2d2 = c1 * d, (c1 + c2) * d, c1 * c2 * d2
    X3, X5 = C.zeros(size, size, ring), C.zeros(size, size, ring)
    for i in range(size):
        guard()
        for j in range(size):
            X3[i, j] = Z1[i, j] + c1d * X[i, j]
    save("X3", X3)
    for i in range(size):
        guard()
        for j in range(size):
            X5[i, j] = Z2[i, j] + c12d * X3[i, j] - c1c2d2 * X[i, j]
    save("X5", X5)
    NO = C.zeros(size, size, ring)
    for i in range(size):
        guard()
        for j in range(size):
            NO[i, j] = ((r if i == j else ring.zero) - Pt[i, j]) * D_over_r
    save("NO", NO)
    for index, row in enumerate(univariate["projectors"][1:], 1):
        coefficients = S.decode_univariate(row["remainder"], max_degree=3)
        require(
            not coefficients or coefficients[0] == 0,
            "positive branch has zero constant coefficient",
        )
        a1, a2, a3 = (
            ring.domain.convert(coefficients[k] if k < len(coefficients) else F(0))
            for k in (1, 2, 3)
        )
        a1d2, a2d = a1 * d2, a2 * d
        value = C.zeros(size, size, ring)
        for i in range(size):
            guard()
            for j in range(size):
                value[i, j] = a1d2 * Q[i, j] + a2d * Q2[i, j] + a3 * Q3[i, j]
        save("N" + str(index), value)
    N0 = C.zeros(size, size, ring)
    for i in range(size):
        guard()
        for j in range(size):
            N0[i, j] = Pt[i, j] * D_over_r - sum(
                (result["N" + str(k)][i, j] for k in range(1, 7)), ring.zero
            )
    save("N0", N0)
    for index, row in enumerate(actions["rows"], 1):
        u1, u3, u5 = (ring.domain.convert(F(value)) for value in row["coefficients"])
        u1_eta_over_r, u3d = u1 * eta_over_r, u3 * d
        value = C.zeros(size, size, ring)
        for i in range(size):
            guard()
            for j in range(size):
                value[i, j] = u1_eta_over_r * X[i, j] + u3d * X3[i, j] + u5 * X5[i, j]
        save("M" + str(index), value)
    completeness, action_sum = C.zeros(size, size, ring), C.zeros(size, size, ring)
    for i in range(size):
        guard()
        for j in range(size):
            completeness[i, j] = sum(
                (result[name][i, j] for name in COMPONENTS), ring.zero
            ) - (D if i == j else ring.zero)
            action_sum[i, j] = (
                sum((result["M" + str(k)][i, j] for k in range(1, 7)), ring.zero)
                - eta_over_r * X[i, j]
            )
    save("projector_completeness", completeness)
    save("action_completeness", action_sum)
    return result


def trace_certificate(components, D, *, expected_ode_rank=None, guard=lambda: None):
    """A fixed coefficient probe suggests a rank; every coefficient must verify it."""
    P, *_ = _modules()
    require(
        type(components) is dict and tuple(components) == COMPONENTS,
        "all eight ordered projector components required",
    )
    require(
        expected_ode_rank is None or type(expected_ode_rank) is int,
        "exact optional ODE rank",
    )
    ring, size = _validate_matrices(tuple(components.values()), D, D)
    probe = max(D)
    rows = []
    for name, matrix in components.items():
        guard()
        trace = sum((matrix[i, i] for i in range(size)), ring.zero)
        numerator, denominator = trace.get(probe, ring.domain.zero), D[probe]
        candidate = F(int(numerator.numerator), int(numerator.denominator)) / F(
            int(denominator.numerator), int(denominator.denominator)
        )
        residual = trace - ring.domain.convert(candidate) * D
        satisfied = (
            not residual and candidate.denominator == 1 and 0 <= candidate <= size
        )
        rows.append(
            dict(
                name=name,
                trace_numerator=P.canonical_polynomial(trace),
                probe_exponent=list(probe),
                candidate=str(candidate),
                rank=int(candidate) if satisfied else None,
                residual=P.canonical_polynomial(residual),
                satisfied=bool(satisfied),
            )
        )
    rank_sum = (
        sum(row["rank"] for row in rows)
        if all(row["satisfied"] for row in rows)
        else None
    )
    accepted = (
        rank_sum == size
        and (expected_ode_rank is None or rows[0]["rank"] == expected_ode_rank)
        and all(row["rank"] == 0 for row in rows[5:])
    )
    return dict(
        schema="nr-case12-projector-traces-v1",
        denominator=P.canonical_polynomial(D),
        rows=rows,
        rank_sum=rank_sum,
        expected_ode_rank=expected_ode_rank,
        accepted=accepted,
    )


def mutation_witness(certificate, *, guard=lambda: None):
    """Alter a real saved projector coefficient; no extra matrix multiplication."""
    P, _, C, _, _ = _modules()
    D, baseline = certificate["D"], certificate["projector_completeness"]
    ring, size = _validate_matrices((baseline,), D, D)
    delta = C.zeros(size, size, ring)
    delta[0, 0] = ring.gens[0] * D
    mutant = C.zeros(size, size, ring)
    for i in range(size):
        guard()
        for j in range(size):
            mutant[i, j] = baseline[i, j] + delta[i, j]
            P.canonical_polynomial(mutant[i, j])
    nonzero = sum(bool(value) for value in mutant.flat)
    metadata = dict(
        schema="nr-case12-projector-mutation-v1",
        name="add-xD-to-N1-00",
        entry=[0, 0],
        nonzero_slots=nonzero,
        coefficients=sum(len(value) for value in mutant.flat),
        rejected=nonzero > 0,
    )
    return dict(delta_N1=delta, mutant_projector_completeness=mutant, mutation=metadata)


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "parent projector artifact SHA mismatch: " + str(path),
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-spectral-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["spectral_annihilator_validated"]
            is record["six_branch_reduction_validated"]
            is True
            and record["errors"] == [],
            "complete accepted spectral parent required",
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
        "spectral parent source identity",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "spectral parent worker identity",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "spectral parent input identity"
        )
    for name, digest in {**DEPENDENCIES, SOURCE: SOURCE_SHA}.items():
        require(
            worker["source_before"][name] == digest,
            "spectral parent dependency identity",
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(),
        "registered spectral parent directory only",
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
        schema="nr-case12-polynomial-projectors-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        spectral_parent_passed=True,
        main_rebuilt=False,
        section_rebuilt=False,
        spectral_chain_rebuilt=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Stdlib-only parent binding for the nonmathematical finalizer."""
    return load_parent(parent_directory)[1]


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C, _, _ = _modules()
    field = context["field"]
    require(
        records["parent-inputs/parent-inputs/parent-inputs/domain.json"]
        == context["domain"],
        "accepted fixed-case12 domain",
    )
    raw = records["scalars.json"]
    require(
        set(raw) == {"r", "g", "b", "squared_speeds"}, "complete spectral scalar schema"
    )
    scalars = {}
    for name in ("r", "g"):
        decoded = V.decode_polynomial(raw[name], max_degree=2)
        value = field.ring.from_dict(
            {
                powers: field.domain.convert(coefficient)
                for powers, coefficient in decoded.items()
            }
        )
        require(
            value == P.polynomial(context[name], field, max_degree=2),
            "source-bound direction polynomial",
        )
        scalars[name] = value
    r, g = scalars["r"], scalars["g"]
    require(
        raw["squared_speeds"]
        == [
            P.canonical_polynomial(field.domain.convert(c) * g)
            for c in context["constants"]
        ],
        "six original unnormalised squared speeds",
    )
    scalars.update(d=r**2 * g, D=r**6 * g**3, eta=r**5 * g**2)
    matrices = [
        C._to_matrix(records[name + ".json"], field, (43, 43), cap, guard)
        for name, cap in (("X", 4), ("Q", 8), ("Z1", 12), ("Z2", 20))
    ]
    Pt = C._to_matrix(records["parent-inputs/Pt.json"], field, (43, 43), 2, guard)
    stats = {}

    def save(name, matrix):
        guard()
        stats[name] = C.matrix_stats(matrix, MATRIX_CAPS[name])
        sink(name, matrix)
        guard()

    result = projectors_from_matrices(
        *matrices,
        Pt,
        r,
        g,
        context["constants"],
        records["univariate.json"],
        guard=guard,
        sink=save,
    )
    actions = action_univariate_certificate(records["univariate.json"], guard=guard)
    traces = trace_certificate(
        {name: result[name] for name in COMPONENTS},
        scalars["D"],
        expected_ode_rank=11,
        guard=guard,
    )
    acceptance = dict(
        projector_completeness=all(
            not value for value in result["projector_completeness"].flat
        ),
        action_completeness=all(
            not value for value in result["action_completeness"].flat
        ),
        action_univariate=actions["accepted"],
        trace_ranks=traces["accepted"],
        absent_branches_zero=all(
            not value
            for prefix in ("N", "M")
            for j in (4, 5, 6)
            for value in result[prefix + str(j)].flat
        ),
    )
    acceptance["accepted"] = all(acceptance.values())
    negative = mutation_witness({**result, "D": scalars["D"]}, guard=guard)
    for name in ("delta_N1", "mutant_projector_completeness"):
        guard()
        C.matrix_stats(negative[name], 25)
        sink(name, negative[name])
        guard()
    return dict(
        **result,
        matrices=result,
        **scalars,
        scalars={
            name: P.canonical_polynomial(value) for name, value in scalars.items()
        },
        **negative,
        stats=stats,
        acceptance=acceptance,
        traces=traces,
        action_univariate=actions,
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
        domain=context["domain"],
        main_rebuilt=False,
        section_rebuilt=False,
        spectral_chain_rebuilt=False,
        energy_constructed=False,
        direction_uniform_energy_proved=False,
    )

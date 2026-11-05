"""Source-bound fixed-case12 polynomial right-section certificate candidate.

Importing this module performs no scientific calculation. An owned runner must
provide resource guards. The certificate concerns the rational formula extension
to all real nonzero directions, not Python semantics, closure, or hyperbolicity.
"""

import ast
import copy
import hashlib
from dataclasses import dataclass
from fractions import Fraction as F
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
SOURCE_HASHES = {
    "scripts/nr_constraint_direction_section.py": "e73b54e528e635f51dc1e25af2489068fad0b26e89e1c85940ca7515c8b476c0",
    "scripts/nr_constraint_exact_coefficients.py": "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    "scripts/nr_profile_exact_coefficients.py": "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
}
SECTION_SOURCE, LEADING_SOURCE, PROFILE_SOURCE = SOURCE_HASHES
VARIABLES = ("x", "y", "z")
MUTATIONS = (
    "metric-base-factor-two",
    "hamiltonian-factor-four",
    "gamma-factor-two",
    "momentum-trace-sign",
)
EXPECTED_PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source, source_name):
    require(source_name in SOURCE_HASHES, "unregistered source")
    require(type(source) is bytes, "source bytes required")
    require(
        hashlib.sha256(source).hexdigest() == SOURCE_HASHES[source_name],
        "frozen source SHA mismatch",
    )


def verify_sources(root=ROOT):
    result = {}
    for name in SOURCE_HASHES:
        source = (Path(root) / name).read_bytes()
        verify_source(source, name)
        result[name] = source
    return result


def ast_text(node):
    return ast.dump(node, annotate_fields=True, include_attributes=False)


def translated_ast(source, source_name):
    """Clone only registered functions; refuse any drift before compilation.

    The unchanged Fraction constraint guard is intentionally retained. No AST
    evaluator, general rewrite rule, expression substitution or caller SHA
    override is accepted.
    """
    verify_source(source, source_name)
    require(
        source_name in (SECTION_SOURCE, LEADING_SOURCE),
        "source has no registered translation",
    )
    tree = ast.parse(source.decode("utf-8"), filename=source_name)
    names = ("lift", "section") if source_name == SECTION_SOURCE else ("leading",)
    functions = [
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    require(
        tuple(node.name for node in functions) == names, "registered function ordering"
    )
    original = ast.Module(body=copy.deepcopy(functions), type_ignores=[])
    adapted = copy.deepcopy(original)
    edits = []
    expected_guards = {
        "lift": (
            "if not isinstance(background, Q.Background):\n    raise ValueError('exact Background required')",
            "if r <= 0 or g <= 0 or background.chi <= 0:\n    raise ValueError('positive ray and metric contractions and chi required')",
        ),
        "leading": (
            "if not isinstance(background, Q.Background):\n    raise ValueError('exact reference Background required')",
        ),
    }
    for function in adapted.body:
        for guard_source in expected_guards.get(function.name, ()):
            expected = ast.parse(guard_source).body[0]
            matches = [
                index
                for index, node in enumerate(function.body)
                if ast_text(node) == ast_text(expected)
            ]
            require(len(matches) == 1, "registered guard must occur exactly once")
            index = matches[0]
            edits.append(
                {
                    "function": function.name,
                    "operation": "remove-domain-guard",
                    "original_ast": ast_text(function.body[index]),
                }
            )
            del function.body[index]
        if function.name == "leading":
            expected = ast.parse("return exact_array(result)").body[0]
            require(
                ast_text(function.body[-1]) == ast_text(expected),
                "registered Fraction output validator",
            )
            edits.append(
                {
                    "function": "leading",
                    "operation": "return-object-array",
                    "original_ast": ast_text(expected),
                    "replacement_ast": ast_text(ast.parse("return result").body[0]),
                }
            )
            function.body[-1] = ast.copy_location(
                ast.parse("return result").body[0], function.body[-1]
            )
    require(
        len(edits) == (2 if source_name == SECTION_SOURCE else 2),
        "exact adaptation count",
    )
    ast.fix_missing_locations(adapted)
    return adapted, {
        "source": source_name,
        "source_sha256": SOURCE_HASHES[source_name],
        "functions": list(names),
        "original_ast_sha256": hashlib.sha256(ast_text(original).encode()).hexdigest(),
        "adapted_ast_sha256": hashlib.sha256(ast_text(adapted).encode()).hexdigest(),
        "edits": edits,
        "formula_and_index_bodies_unchanged": True,
        "fraction_basis_guard_retained": source_name == SECTION_SOURCE,
    }


def fixed_domain(background, inverse):
    """Exact finite constants plus the stated spectral-norm inequality chain."""
    require(
        type(background.alpha) is F
        and type(background.chi) is F
        and all(type(value) is F for value in background.shift)
        and all(type(value) is F for row in background.metric for value in row)
        and all(type(value) is F for row in inverse for value in row),
        "explicit Fraction background and inverse required",
    )
    lower = ((F(1), F(0), F(0)), (F(3, 25), F(1), F(0)), (F(-2, 25), F(3, 50), F(1)))
    h = tuple(
        tuple(sum(lower[i][k] * lower[j][k] for k in range(3)) for j in range(3))
        for i in range(3)
    )
    expected_inverse = (
        (F(1596881, 1562500), F(-7827, 62500), F(109, 1250)),
        (F(-7827, 62500), F(2509, 2500), F(-3, 50)),
        (F(109, 1250), F(-3, 50), F(1)),
    )
    require(
        background.metric == h and inverse == expected_inverse,
        "fixed case12 metric and inverse",
    )
    require(
        background.alpha == F(17, 20)
        and background.chi == F(18, 25)
        and background.shift == (F(3, 100), F(-1, 25), F(1, 20)),
        "fixed case12 physical constants",
    )
    require(
        all(
            sum(h[i][k] * inverse[k][j] for k in range(3)) == F(i == j)
            for i in range(3)
            for j in range(3)
        ),
        "exact h*u identity",
    )
    h_bound = max(sum(abs(value) for value in row) for row in h)
    u_bound = max(sum(abs(value) for value in row) for row in inverse)
    require(
        h_bound == F(6, 5) and u_bound == F(964403, 781250), "exact matrix norm bounds"
    )
    require(
        background.chi * (1 / h_bound) ** 2 == F(1, 2),
        "exact denominator floor coefficient",
    )
    return {
        "schema": "nr-case12-polynomial-domain-v1",
        "lower": [[str(value) for value in row] for row in lower],
        "metric": [[str(value) for value in row] for row in h],
        "inverse": [[str(value) for value in row] for row in inverse],
        "alpha": str(background.alpha),
        "chi": str(background.chi),
        "shift": list(map(str, background.shift)),
        "h_equals_lower_times_transpose": True,
        "lower_diagonal": ["1", "1", "1"],
        "h_times_inverse_is_identity": True,
        "metric_spd_from_invertible_lower": True,
        "h_norm_upper": str(h_bound),
        "u_norm_upper": str(u_bound),
        "g_over_r_lower": "5/6",
        "section_denominator_over_r_cubed_lower": "1/2",
        "residual_denominator_over_r_fourth_lower": "1/2",
        "inequality_argument": "h=LL^T with invertible unit-triangular L; lambda_max(h)<=||h||_infinity=6/5; v^T h^-1 v>=(5/6)v^T v; chi=18/25",
        "domain": "fixed case12 constants; real (x,y,z) != (0,0,0)",
        "zero_frequency_admitted": False,
    }


def frozen_helpers(sources, np):
    """Compile unchanged helper definitions rather than trust mutable imports."""
    for name in (PROFILE_SOURCE, LEADING_SOURCE):
        verify_source(sources[name], name)
    profile = ast.parse(sources[PROFILE_SOURCE].decode("utf-8"))
    pair_assignment = next(
        node
        for node in profile.body
        if isinstance(node, ast.Assign)
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == "PAIRS"
    )
    require(
        ast.literal_eval(pair_assignment.value) == EXPECTED_PAIRS,
        "frozen PAIRS literal",
    )
    index_assignment = next(
        node
        for node in profile.body
        if isinstance(node, ast.Assign)
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == "PAIR_INDEX"
    )
    require(
        ast_text(index_assignment)
        == ast_text(
            ast.parse("PAIR_INDEX = {p: i for i, p in enumerate(PAIRS)}").body[0]
        ),
        "frozen PAIR_INDEX formula",
    )
    helper_names = ("rational", "determinant", "inverse", "Background", "case12")
    definitions = [
        copy.deepcopy(node)
        for node in profile.body
        if isinstance(node, (ast.FunctionDef, ast.ClassDef))
        and node.name in helper_names
    ]
    require(
        tuple(node.name for node in definitions) == helper_names,
        "frozen profile helper order",
    )
    helper_tree = ast.Module(body=definitions, type_ignores=[])
    namespace = {
        "F": F,
        "dataclass": dataclass,
        "__name__": __name__,
        "__builtins__": __builtins__,
    }
    exec(
        compile(helper_tree, str(ROOT / PROFILE_SOURCE) + ":unchanged-helpers", "exec"),
        namespace,
    )
    q = SimpleNamespace(
        **{name: namespace[name] for name in helper_names},
        PAIRS=EXPECTED_PAIRS,
        PAIR_INDEX={pair: index for index, pair in enumerate(EXPECTED_PAIRS)},
    )
    leading_tree = ast.parse(sources[LEADING_SOURCE].decode("utf-8"))
    zeros = [
        copy.deepcopy(node)
        for node in leading_tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "zeros"
    ]
    require(len(zeros) == 1, "one frozen zeros helper")
    zeros_tree = ast.Module(body=zeros, type_ignores=[])
    zero_namespace = {"F": F, "np": np, "__builtins__": __builtins__}
    exec(
        compile(zeros_tree, str(ROOT / LEADING_SOURCE) + ":unchanged-storage", "exec"),
        zero_namespace,
    )
    audit = [
        {
            "source": PROFILE_SOURCE,
            "source_sha256": SOURCE_HASHES[PROFILE_SOURCE],
            "functions": list(helper_names),
            "ast_sha256": hashlib.sha256(ast_text(helper_tree).encode()).hexdigest(),
            "edits": [],
            "pairs": [list(pair) for pair in EXPECTED_PAIRS],
            "pair_index_ast": ast_text(index_assignment),
        },
        {
            "source": LEADING_SOURCE,
            "source_sha256": SOURCE_HASHES[LEADING_SOURCE],
            "functions": ["zeros"],
            "ast_sha256": hashlib.sha256(ast_text(zeros_tree).encode()).hexdigest(),
            "edits": [],
        },
    ]
    return q, SimpleNamespace(zeros=zero_namespace["zeros"]), audit


def build_context(*, guard=lambda: None):
    """Prepare the exact field and source-bound formula extension, not matrices."""
    guard()
    sources = verify_sources()
    import numpy as np
    from sympy.polys.domains import QQ
    from sympy.polys.fields import field

    Q, R, helper_audit = frozen_helpers(sources, np)
    background = Q.case12()
    domain = fixed_domain(background, Q.inverse(background.metric))
    f, x, y, z = field("x,y,z", QQ)
    r = x * x + y * y + z * z
    symbolic = SimpleNamespace(
        alpha=background.alpha,
        chi=background.chi,
        metric=background.metric,
        shift=background.shift,
        ray=(x, y, z),
        ray_squared=r,
    )
    inverse = Q.inverse(background.metric)
    g = sum(
        symbolic.ray[i] * inverse[i][j] * symbolic.ray[j]
        for i in range(3)
        for j in range(3)
    )
    namespace = {
        "F": F,
        "np": np,
        "Q": Q,
        "R": R,
        "zeros": R.zeros,
        "__builtins__": __builtins__,
    }
    translations = []
    for name in (SECTION_SOURCE, LEADING_SOURCE):
        tree, audit = translated_ast(sources[name], name)
        exec(
            compile(tree, str(ROOT / name) + ":polynomial-extension", "exec"), namespace
        )
        translations.append(audit)
    # Independently bind the sole storage helper; values must be exact Fractions.
    zero_probe = R.zeros(2, 3)
    require(
        zero_probe.shape == (2, 3)
        and zero_probe.dtype == object
        and all(type(value) is F and value == 0 for value in zero_probe.flat),
        "object-array zero storage contract",
    )
    guard()
    return dict(
        field=f,
        background=symbolic,
        lift=namespace["lift"],
        leading=namespace["leading"],
        section=namespace["section"],
        r=r,
        g=g,
        delta=background.chi * r * r * g * g,
        section_denominator=background.chi * r * g * g,
        domain=domain,
        translation=translations,
        helper_bindings=helper_audit,
    )


def check_ring(ring):
    require(
        ring.ngens == 3
        and tuple(map(str, ring.symbols)) == VARIABLES
        and bool(ring.domain.is_QQ),
        "exact QQ[x,y,z] ring required",
    )


def polynomial(value, field, *, max_degree=None):
    """Prove a scaled entry has only a nonzero constant denominator."""
    check_ring(field.ring)
    require(
        type(value) in (int, F) or isinstance(value, (field.dtype, field.ring.dtype)),
        "exact polynomial input required",
    )
    if hasattr(value, "ring"):
        require(value.ring == field.ring, "matching polynomial ring required")
    if hasattr(value, "field"):
        require(value.field == field, "matching fraction field required")
    fraction = field(value)
    require(set(fraction.denom) == {(0, 0, 0)}, "uncleared directional denominator")
    divisor = fraction.denom[(0, 0, 0)]
    require(bool(divisor), "nonzero constant denominator")
    result = field.ring.from_dict(
        {
            powers: coefficient / divisor
            for powers, coefficient in fraction.numer.items()
        }
    )
    degree = max((sum(powers) for powers in result), default=-1)
    if max_degree is not None:
        require(
            type(max_degree) is int and max_degree >= 0 and degree <= max_degree,
            "polynomial degree cap",
        )
    return result


def canonical_polynomial(poly):
    require(
        hasattr(poly, "ring") and isinstance(poly, poly.ring.dtype),
        "polynomial ring element required",
    )
    check_ring(poly.ring)
    terms = []
    for powers, coefficient in sorted(poly.items()):
        require(
            len(powers) == 3
            and all(type(power) is int and power >= 0 for power in powers),
            "nonnegative integer exponents",
        )
        numerator, denominator = (
            int(coefficient.numerator),
            int(coefficient.denominator),
        )
        value = F(numerator, denominator)
        require(
            value != 0
            and denominator > 0
            and value.numerator == numerator
            and value.denominator == denominator,
            "canonical nonzero rational coefficient",
        )
        terms.append([*powers, str(numerator), str(denominator)])
    return terms


def encode_matrix(matrix, *, guard=lambda: None):
    require(
        getattr(matrix, "ndim", None) == 2 and min(matrix.shape) > 0,
        "nonempty two-dimensional matrix",
    )
    entries = []
    for i, row in enumerate(matrix):
        guard()
        for j, poly in enumerate(row):
            entries.append([i, j, canonical_polynomial(poly)])
    return {
        "schema": "nr-case12-polynomial-matrix-v1",
        "variables": list(VARIABLES),
        "shape": list(matrix.shape),
        "entries": entries,
    }


def validate_zero_matrix(matrix, *, shape, guard=lambda: None):
    require(
        getattr(matrix, "shape", None) == tuple(shape), "complete residual matrix shape"
    )
    checked = 0
    for row in matrix:
        guard()
        for poly in row:
            # Validate the exact domain even for the zero polynomial.
            canonical_polynomial(poly)
            require(not poly, "nonzero polynomial residual")
            checked += 1
    return {"slots_checked": checked, "nonzero_slots": 0, "coefficientwise_zero": True}


def multiply(left, right, *, guard=lambda: None):
    import numpy as np

    require(
        left.ndim == right.ndim == 2 and left.shape[1] == right.shape[0],
        "matching polynomial matrix dimensions",
    )
    ring = left[0, 0].ring
    check_ring(ring)
    require(
        all(poly.ring == ring for poly in left.flat)
        and all(poly.ring == ring for poly in right.flat),
        "same polynomial ring",
    )
    result = np.empty((left.shape[0], right.shape[1]), dtype=object)
    sparse_right = [[(j, poly) for j, poly in enumerate(row) if poly] for row in right]
    for i, row in enumerate(left):
        guard()
        result[i, :] = [ring.zero for _ in range(right.shape[1])]
        for k, poly in enumerate(row):
            if poly:
                for j, other in sparse_right[k]:
                    result[i, j] = result[i, j] + poly * other
    return result


def build_certificate(*, guard=lambda: None):
    import numpy as np

    ctx = build_context(guard=guard)
    guard()
    d = ctx["leading"](ctx["background"], guard=guard)
    guard()
    s = ctx["section"](ctx["background"], guard=guard)
    require(
        d.shape == (43, 58) and s.shape == (58, 43), "complete source matrix dimensions"
    )
    matrices = []
    stats = {}
    for name, matrix, factor, cap in (
        ("Dtilde", d, ctx["r"], 3),
        ("Stilde", s, ctx["section_denominator"], 6),
    ):
        scaled = np.empty(matrix.shape, dtype=object)
        for i, row in enumerate(matrix):
            guard()
            for j, value in enumerate(row):
                scaled[i, j] = polynomial(
                    ctx["field"](value) * factor, ctx["field"], max_degree=cap
                )
        matrices.append(scaled)
        stats[name] = {
            "shape": list(scaled.shape),
            "slots": int(scaled.size),
            "nonzero_slots": sum(bool(poly) for poly in scaled.flat),
            "terms": sum(len(poly) for poly in scaled.flat),
            "degree_max": max(
                (sum(powers) for poly in scaled.flat for powers in poly), default=-1
            ),
            "degree_cap": cap,
        }
    dt, st = matrices
    delta = polynomial(ctx["delta"], ctx["field"], max_degree=8)
    residual = multiply(dt, st, guard=guard)
    for i in range(43):
        residual[i, i] = residual[i, i] - delta
    for row in residual:
        guard()
        for poly in row:
            require(
                max((sum(powers) for powers in poly), default=-1) <= 9,
                "residual degree cap",
            )
    stats["residual"] = validate_zero_matrix(residual, shape=(43, 43), guard=guard)
    return dict(
        Dtilde=dt,
        Stilde=st,
        residual=residual,
        delta=delta,
        r=polynomial(ctx["r"], ctx["field"], max_degree=2),
        g=polynomial(ctx["g"], ctx["field"], max_degree=2),
        section_denominator=polynomial(
            ctx["section_denominator"], ctx["field"], max_degree=6
        ),
        domain=ctx["domain"],
        translation=ctx["translation"],
        helper_bindings=ctx["helper_bindings"],
        stats=stats,
        theorem="fixed-case12 rational formula extension: Dhat(v) S(v)=I43 for all real v!=0",
        full_python_semantics_proved=False,
        subsidiary_closure_proved=False,
        direction_uniform_energy_proved=False,
    )


def mutation_witness(certificate, name, *, guard=lambda: None):
    """One-column formula-factor/sign fault, using retained unmutated matrices."""
    import numpy as np

    require(name in MUTATIONS, "registered polynomial mutation")
    st, dt = certificate["Stilde"], certificate["Dtilde"]
    require(
        st.shape == (58, 43) and dt.shape == (43, 58), "complete certificate matrices"
    )
    ring = st[0, 0].ring
    column, rows, factor = {
        "metric-base-factor-two": (20, (0,), F(-1, 2)),
        "hamiltonian-factor-four": (0, (55, 56, 57), F(-1, 2)),
        "gamma-factor-two": (5, (19, 20, 21), F(-1, 2)),
        "momentum-trace-sign": (42, (17,), F(-2)),
    }[name]
    change = np.empty((58, 1), dtype=object)
    change[:, 0] = [ring.zero for _ in range(58)]
    for row in rows:
        change[row, 0] = st[row, column] * ring.domain.convert(factor)
    residual = multiply(dt, change, guard=guard)
    require(
        any(bool(poly) for poly in residual.flat),
        "mutation must produce a nonzero polynomial witness",
    )
    return dict(
        name=name,
        constraint_column=column,
        changed_state_rows=list(rows),
        delta_section=change,
        residual=residual,
        nonzero_slots=sum(bool(poly) for poly in residual.flat),
        algebra="Dtilde * delta_Stilde_column; baseline full residual is zero",
    )

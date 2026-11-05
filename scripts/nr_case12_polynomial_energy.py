"""Complete original case12 Gram energy from accepted compressed numerators.

Only owned workers perform mathematics. Manifest interfaces are stdlib-only.
All residuals are complete matrices; unsuccessful candidates remain evidence.
The scope is the fixed-background 43-dimensional principal constraint quotient.
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
    / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-compression-controls-v1-20261014"
)
PARENT_GATE_SHA = "04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda"
PARENT_WORKER_SHA = "fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6"
ANCESTOR_DIRECTORY = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-case12-polynomial-projectors-controls-v1-20261014"
)
ANCESTOR_GATE_SHA = "a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1"
ANCESTOR_WORKER_SHA = "7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9"
SOURCE = "scripts/nr_constraint_laurent_energy.py"
SOURCE_SHA = "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b"
METRIC_SOURCE = "scripts/nr_constraint_exact_coefficients.py"
METRIC_SOURCE_SHA = "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce"
DEPENDENCIES = {
    "scripts/nr_case12_polynomial_section.py": "bf1daeb17d0381e8a3e1da432c7f2c49f334cb9eeaf12f4132c9d57d61b200dd",
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_polynomial_closure.py": "d510c9e1cfde31dcb77acc6b8a097e2a9b19a16a0d2aae652ec17a3483ca250f",
    "scripts/nr_case12_polynomial_blocks.py": "5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5",
    "scripts/nr_case12_polynomial_spectral.py": "4e9dfc5058af58cbf94526d0846e314e3d7c054b1726e2184e9a8eba50ac13e8",
    "scripts/nr_case12_polynomial_projectors.py": "6c30478535aaf00f487a38d2d86bf1c3860d1cc2126706b5bf3397b997614ac0",
    "scripts/nr_case12_polynomial_compression.py": "b1f46b6cff721fc242cbca152380d6b940935206458e626c195d5f74df5a6054",
}
DOMAIN_INPUT = (
    "parent-inputs/parent-inputs/parent-inputs/parent-inputs/parent-inputs/domain.json"
)
DENOMINATORS_INPUT = "parent-inputs/parent-inputs/parent-inputs/parent-inputs/parent-inputs/denominators.json"
PARENT_INPUT_HASHES = {
    "NO_quotient.json": "a4a573ec4a532f7c7a825e2e79a46e97b7552efe881c0b026d8853b4e23ae854",
    "N0_quotient.json": "59e398e38115a460ab3720208779c1cd81ad49f2e37d29a2874a792a0b541127",
    "N1_quotient.json": "fcc5e0cf1a67f0043aa13c5bec016c34eac2491d54c6a24b4ed482857bfe4f21",
    "N2_quotient.json": "d36fe6ef483dfe4f3e23faedfb2b2892e671d335e4864b3938843830835af5e0",
    "N3_quotient.json": "ff92341868bb886078e573cb8932e39c6fc46a8ec492910e342b68a16f446577",
    "N4_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "N5_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "N6_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M1_quotient.json": "1bba879fde2da5a2fd0ae9e0ee7330fef866378591b84f5967eff7256b53a1a4",
    "M2_quotient.json": "2b4519fd985c1f880e6911743fd86ae399c09b8f29f15aa5fc187da757af79bb",
    "M3_quotient.json": "791134b0899c3274c89f77699ed757979e4f8bf9229e8ccbe950f8c59e05b613",
    "M4_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M5_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "M6_quotient.json": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    "scalars.json": "a5b94444daf35431771df414462553e6137373321c6ed2af0da295869f6c01be",
    DOMAIN_INPUT: "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    DENOMINATORS_INPUT: "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
}
ANCESTOR_INPUT_HASHES = {
    "parent-inputs/X.json": "8ca8cbbcb17810fe0f48a2681285648bcd659c602091c0ba863f72d5e801a3e0",
    "parent-inputs/parent-inputs/Pt.json": "1e34f1af36c881793cda6a323d1ec62e43258cf15089b4fb06d30acb2da02def",
}
COMPONENTS = ("NO", "N0", "N1", "N2", "N3", "N4", "N5", "N6")
INPUT_NAMES = COMPONENTS + ("M1", "M2", "M3", "M4", "M5", "M6")
SCALED_ROWS = (0, 1, 2, 3, 41)
MATRIX_CAPS = {
    "Gt": 2,
    **{"F_" + name: 9 for name in COMPONENTS},
    "Hbar": 20,
    "Cgram": 20,
    "Hsym": 20,
    "HL": 24,
    "HP": 22,
    "Gram": 20,
}
MATRIX_ORDER = tuple(MATRIX_CAPS)
NEGATIVE_CAPS = {"delta_Hbar": 0, "mutant_Hsym": 20}
CACHE_ENTRIES = 1024
CACHE_TERMS = 100000


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_source(source):
    require(
        type(source) is bytes and hashlib.sha256(source).hexdigest() == SOURCE_SHA,
        "frozen paired-energy SHA mismatch",
    )


def translated_ast(source):
    """Bind the unchanged original Gram/weight/coercivity formula, without execution."""
    verify_source(source)
    parsed = ast.parse(source.decode("utf-8"), filename=SOURCE)
    selected = [
        copy.deepcopy(node)
        for node in parsed.body
        if isinstance(node, ast.FunctionDef) and node.name == "paired_energy"
    ]
    require(len(selected) == 1, "registered original paired-energy function")
    tree = ast.Module(body=selected, type_ignores=[])
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
        execution="not executed; same weights and Gram factors with accepted denominator clearing",
    )


def _verify_dependencies():
    for name, digest in DEPENDENCIES.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest,
            "frozen energy dependency SHA mismatch: " + name,
        )


def source_bridge_manifest():
    """Stdlib-only source, AST, metric-index and ancestor formula binding."""
    _verify_dependencies()
    _, energy = translated_ast((ROOT / SOURCE).read_bytes())
    metric = (ROOT / METRIC_SOURCE).read_bytes()
    require(
        hashlib.sha256(metric).hexdigest() == METRIC_SOURCE_SHA,
        "frozen Gram metric source",
    )
    parsed = ast.parse(metric.decode("utf-8"))
    assignments = [
        node
        for node in parsed.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "SCALED_ROWS"
            for target in node.targets
        )
    ]
    require(
        len(assignments) == 1
        and ast.literal_eval(assignments[0].value) == SCALED_ROWS == (0, 1, 2, 3, 41),
        "original five frequency-scaled rows",
    )
    return dict(
        schema="nr-case12-polynomial-energy-bridge-v1",
        paired_energy=energy,
        dependencies=DEPENDENCIES.copy(),
        metric_source=METRIC_SOURCE,
        metric_source_sha256=METRIC_SOURCE_SHA,
        scaled_rows=list(SCALED_ROWS),
        weights=["1", "1", "1/2", "1/2", "1/2", "1/2", "1/2", "1/2"],
        energy="Hbar=sum(wi*Nbar_i.T*Gt*Nbar_i)+sum(g/(2*cj)*Mbar_j.T*Gt*Mbar_j)",
        coercivity="Fi=Nbar_i-Dbar*I/(14*wi); Cgram=sum(wi*Fi.T*Gt*Fi)+same action Grams",
        producer_gram="exact triangular row outer products; bounded local normalized product cache",
        producer_coercivity="Ki-ai*(Nbar_i.T*Gt+Gt*Nbar_i)+ai^2*Gt; never Hbar-minus-lower-bound assignment",
        scope="fixed-case12 43-dimensional principal constraint quotient only",
    )


def _modules():
    _verify_dependencies()
    modules = []
    for name in DEPENDENCIES:
        module = importlib.import_module(name.removesuffix(".py").replace("/", "."))
        require(
            Path(module.__file__).resolve() == (ROOT / name).resolve(),
            "frozen energy module path",
        )
        modules.append(module)
    return tuple(modules)


def build_context(*, guard=lambda: None):
    guard()
    manifest = source_bridge_manifest()
    *_, compression = _modules()
    context = compression.build_context(guard=guard)
    return {**context, "source_bridge": manifest}


def _checked_ring(poly):
    P, *_ = _modules()
    P.canonical_polynomial(poly)
    require(str(poly.ring.order) == "lex", "exact registered lex ring")
    return poly.ring


def _shape(matrix):
    require(
        getattr(matrix, "ndim", None) == 2
        and 1 <= matrix.shape[0] <= 43
        and 1 <= matrix.shape[1] <= 43,
        "bounded nonempty polynomial matrix",
    )
    return matrix.shape


def _check_matrix(matrix, ring, shape=None):
    actual = _shape(matrix)
    require(shape is None or actual == shape, "matching polynomial matrix shape")
    require(
        all(isinstance(poly, ring.dtype) and poly.ring == ring for poly in matrix.flat),
        "same exact polynomial coefficient ring",
    )
    return actual


class _ProductCache:
    """Per-Gram exact scalar normalization; no discarded or approximate coefficient."""

    def __init__(self, ring):
        self.ring = ring
        self.descriptions = {}
        self.normalized_ids = {}
        self.normalized = []
        self.products = {}
        self.terms = 0

    def describe(self, poly):
        key = tuple(sorted(poly.items()))
        if key not in self.descriptions:
            scalar = poly[max(poly)]
            normalized_key = tuple((power, value / scalar) for power, value in key)
            if normalized_key not in self.normalized_ids:
                self.normalized_ids[normalized_key] = len(self.normalized)
                self.normalized.append(self.ring.from_dict(dict(normalized_key)))
            self.descriptions[key] = (scalar, self.normalized_ids[normalized_key])
        return self.descriptions[key]

    def product(self, left, right):
        a, i = left
        b, j = right
        key = (min(i, j), max(i, j))
        if key in self.products:
            value = self.products[key]
        else:
            value = self.normalized[i] * self.normalized[j]
            if len(value) <= CACHE_TERMS:
                if (
                    len(self.products) >= CACHE_ENTRIES
                    or self.terms + len(value) > CACHE_TERMS
                ):
                    self.products.clear()
                    self.terms = 0
                self.products[key] = value
                self.terms += len(value)
        return value * (a * b)


def gram_matrix(matrix, diagonal, *, guard=lambda: None, cache_products=True):
    """Compute A.T*diag(diagonal)*A exactly, including every output coordinate."""
    guard()
    require(type(cache_products) is bool, "boolean product-cache choice")
    rows, columns = _shape(matrix)
    require(
        type(diagonal) is tuple and len(diagonal) == rows, "matching diagonal tuple"
    )
    ring = _checked_ring(diagonal[0])
    require(
        all(isinstance(value, ring.dtype) and value.ring == ring for value in diagonal),
        "exact same-ring Gram diagonal",
    )
    _check_matrix(matrix, ring)
    _, _, C, *_ = _modules()
    result = C.zeros(columns, columns, ring)
    if not any(value for value in matrix.flat):
        guard()
        return result
    cache = _ProductCache(ring) if cache_products else None
    groups = {}
    for k, weight in enumerate(diagonal):
        if weight:
            groups.setdefault(tuple(sorted(weight.items())), []).append(k)
    for key, indices in groups.items():
        weight = ring.from_dict(dict(key))
        partial = C.zeros(columns, columns, ring)
        for k in indices:
            active = [(j, value) for j, value in enumerate(matrix[k]) if value]
            if not active:
                continue
            guard()
            if cache is not None:
                active = [(j, cache.describe(value)) for j, value in active]
            for position, (i, left) in enumerate(active):
                for j, right in active[position:]:
                    product = (
                        cache.product(left, right)
                        if cache is not None
                        else left * right
                    )
                    partial[i, j] = partial[i, j] + product
        for i in range(columns):
            guard()
            for j in range(i, columns):
                if partial[i, j]:
                    result[i, j] = result[i, j] + weight * partial[i, j]
    for i in range(columns):
        guard()
        for j in range(i):
            result[i, j] = result[j, i].copy()
    guard()
    return result


def _difference(left, right, *, guard=lambda: None):
    _, _, C, *_ = _modules()
    ring = left[0, 0].ring
    result = C.zeros(*left.shape, ring)
    for i, row in enumerate(left):
        guard()
        for j, value in enumerate(row):
            result[i, j] = value - right[i, j]
    return result


def symmetrizer_residuals(
    Hbar, X, Pt, *, guard=lambda: None, sink=lambda name, matrix: None
):
    """True two-sided residuals, including the nonsymmetric-candidate failure path."""
    guard()
    shape = _shape(Hbar)
    require(shape[0] == shape[1], "square symmetrizer")
    ring = _checked_ring(Hbar[0, 0])
    for matrix in (Hbar, X, Pt):
        _check_matrix(matrix, ring, shape)
    P, *_ = _modules()
    symmetry = _difference(Hbar, Hbar.T, guard=guard)
    result = {"Hsym": symmetry}
    guard()
    sink("Hsym", symmetry)
    guard()
    is_symmetric = all(not value for value in symmetry.flat)
    for name, operator in (("HL", X), ("HP", Pt)):
        product = P.multiply(Hbar, operator, guard=guard)
        residual = _difference(product, product.T, guard=guard)
        if not is_symmetric:
            correction = P.multiply(operator.T, symmetry, guard=guard)
            residual = _difference(residual, correction, guard=guard)
        result[name] = residual
        guard()
        sink(name, residual)
        guard()
    return result


def coefficient_bound(Hbar, *, lower=F(5, 6), guard=lambda: None):
    """Actual coefficient bound on r=1, using the accepted fixed g>=5/6 domain."""
    guard()
    require(type(lower) is F and lower == F(5, 6), "registered exact g lower bound 5/6")
    shape = _shape(Hbar)
    require(shape[0] == shape[1], "square coefficient bound matrix")
    ring = _checked_ring(Hbar[0, 0])
    _check_matrix(Hbar, ring)
    entries, total = [], F(0)
    for i, row in enumerate(Hbar):
        guard()
        for j, poly in enumerate(row):
            value = sum(
                (abs(F(int(c.numerator), int(c.denominator))) for c in poly.values()),
                F(0),
            )
            entries.append([i, j, str(value)])
            total += value
    upper = total / lower**6
    return dict(
        schema="nr-case12-energy-coefficient-bound-v1",
        shape=list(shape),
        entries=entries,
        total=str(total),
        g_lower=str(lower),
        denominator_power=6,
        upper=str(upper),
        lower_energy="1/14",
        method="entrywise coefficient l1 / g_lower^6",
        consistent_lower_upper=upper >= F(1, 14),
    )


def energy_from_matrices(
    components,
    X,
    Pt,
    r,
    g,
    constants,
    *,
    scaled_rows=SCALED_ROWS,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    """Explicit algebra helper; only the parent-bound build supplies a theorem."""
    guard()
    P, _, C, _, S, *_ = _modules()
    constants = S._constants(constants)
    ring = _checked_ring(r)
    require(
        bool(r) and bool(g) and _checked_ring(g) == ring,
        "nonzero same-ring denominators",
    )
    require(
        type(components) is dict and set(components) == set(INPUT_NAMES),
        "all eight components and six actions",
    )
    shape = _shape(X)
    require(shape[0] == shape[1], "square energy inputs")
    for matrix in (X, Pt, *components.values()):
        _check_matrix(matrix, ring, shape)
    n = shape[0]
    require(
        type(scaled_rows) is tuple
        and all(type(i) is int and 0 <= i < n for i in scaled_rows)
        and len(set(scaled_rows)) == len(scaled_rows),
        "valid distinct metric-scaled rows",
    )
    require(
        all(
            not value
            for name in ("N4", "N5", "N6", "M4", "M5", "M6")
            for value in components[name].flat
        ),
        "accepted absent branches retained as explicit zeros",
    )
    Dbar, etabar = r * g**3, r * g**2
    taubar = r * Dbar**2
    diagonal = tuple(ring.one if i in scaled_rows else r for i in range(n))
    weights = (F(1), F(1), F(1, 2), F(1, 2), F(1, 2), F(1, 2), F(1, 2), F(1, 2))
    matrices = {}

    def save(name, matrix):
        guard()
        matrices[name] = matrix
        sink(name, matrix)
        guard()

    Gt = C.zeros(n, n, ring)
    for i, value in enumerate(diagonal):
        Gt[i, i] = value
    save("Gt", Gt)
    shifts = {}
    for name, weight in zip(COMPONENTS, weights, strict=True):
        shift = Dbar * ring.domain.convert(1 / (14 * weight))
        shifts[name] = shift
        difference = C.zeros(n, n, ring)
        for i, row in enumerate(components[name]):
            guard()
            for j, value in enumerate(row):
                difference[i, j] = value - (shift if i == j else ring.zero)
        save("F_" + name, difference)
    Hbar, Cgram = C.zeros(n, n, ring), C.zeros(n, n, ring)
    for name, weight in zip(COMPONENTS, weights, strict=True):
        numerator = components[name]
        gram = gram_matrix(numerator, diagonal, guard=guard)
        scalar = ring.domain.convert(weight)
        shift, shift2 = shifts[name], shifts[name] ** 2
        for i in range(n):
            guard()
            for j in range(n):
                Hbar[i, j] = Hbar[i, j] + scalar * gram[i, j]
                # Independent expansion of this actual Fi Gram, not H minus a target.
                factor_gram = gram[i, j] - shift * (
                    numerator[j, i] * diagonal[j] + diagonal[i] * numerator[i, j]
                )
                if i == j:
                    factor_gram = factor_gram + shift2 * diagonal[i]
                Cgram[i, j] = Cgram[i, j] + scalar * factor_gram
    for j, constant in enumerate(constants[:3], 1):
        gram = gram_matrix(components["M" + str(j)], diagonal, guard=guard)
        scalar = g * ring.domain.convert(1 / (2 * constant))
        for i in range(n):
            guard()
            for k in range(n):
                term = scalar * gram[i, k]
                Hbar[i, k] = Hbar[i, k] + term
                Cgram[i, k] = Cgram[i, k] + term
    save("Hbar", Hbar)
    save("Cgram", Cgram)
    symmetrizer_residuals(Hbar, X, Pt, guard=guard, sink=save)
    gram_residual = C.zeros(n, n, ring)
    lower_scale = Dbar**2 * ring.domain.convert(F(1, 14))
    for i in range(n):
        guard()
        for j in range(n):
            gram_residual[i, j] = (
                Hbar[i, j]
                - Cgram[i, j]
                - (lower_scale * diagonal[i] if i == j else ring.zero)
            )
    save("Gram", gram_residual)
    bounds = coefficient_bound(Hbar, guard=guard)
    acceptance = dict(
        energy_symmetry=all(not p for p in matrices["Hsym"].flat),
        intrinsic_symmetrization=all(not p for p in matrices["HL"].flat),
        pde_symmetrization=all(not p for p in matrices["HP"].flat),
        gram_identity=all(not p for p in matrices["Gram"].flat),
        uniform_bounds=bounds["consistent_lower_upper"],
    )
    acceptance["accepted"] = all(acceptance.values())
    return dict(
        matrices=matrices,
        bounds=bounds,
        acceptance=acceptance,
        scalars={
            name: P.canonical_polynomial(value)
            for name, value in dict(
                r=r, g=g, Dbar=Dbar, etabar=etabar, taubar=taubar
            ).items()
        },
    )


def mutation_witness(Hbar, *, guard=lambda: None, sink=lambda name, matrix: None):
    """Perturb one actual Hbar entry and recompute its full symmetry residual."""
    guard()
    shape = _shape(Hbar)
    require(
        shape[0] == shape[1] and shape[0] >= 2,
        "at least two-dimensional energy mutation",
    )
    ring = _checked_ring(Hbar[0, 0])
    _check_matrix(Hbar, ring)
    _, _, C, *_ = _modules()
    delta = C.zeros(*shape, ring)
    delta[0, 1] = ring.one
    mutant = Hbar.copy()
    mutant[0, 1] = mutant[0, 1] + ring.one
    residual = _difference(mutant, mutant.T, guard=guard)
    matrices = dict(delta_Hbar=delta, mutant_Hsym=residual)
    for name, matrix in matrices.items():
        guard()
        sink(name, matrix)
        guard()
    count = sum(bool(value) for value in residual.flat)
    return dict(
        **matrices,
        matrices=matrices,
        mutation=dict(
            schema="nr-case12-energy-mutation-v1",
            name="add-one-to-Hbar-01",
            entry=[0, 1],
            nonzero_slots=count,
            coefficients=sum(len(value) for value in residual.flat),
            rejected=count > 0,
        ),
    )


def _pinned_json(path, expected):
    data = Path(path).read_bytes()
    require(
        hashlib.sha256(data).hexdigest() == expected,
        "pinned energy input SHA mismatch: " + str(path),
    )
    return json.loads(data)


def validate_parent_status(gate, worker):
    for record in (gate, worker):
        require(
            record["schema"] == "nr-case12-polynomial-compression-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["numerator_compression_validated"]
            is record["fixed_factors_validated"]
            is True
            and record["errors"] == [],
            "complete accepted compression parent",
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
            "shadow-only parent",
        )
    require(
        worker["source_before"] == worker["source_after"],
        "compression parent source identity",
    )
    require(
        gate["artifact_hashes"]["worker-result.json"] == PARENT_WORKER_SHA,
        "compression parent worker identity",
    )
    for name, digest in PARENT_INPUT_HASHES.items():
        require(
            gate["artifact_hashes"][name] == digest, "compression parent input identity"
        )
    for name, digest in {
        **DEPENDENCIES,
        SOURCE: SOURCE_SHA,
        METRIC_SOURCE: METRIC_SOURCE_SHA,
    }.items():
        require(
            worker["source_before"][name] == digest,
            "compression parent source dependency identity",
        )


def load_parent(parent_directory=PARENT_DIRECTORY, *, guard=lambda: None):
    directory = Path(parent_directory).resolve()
    require(
        directory == PARENT_DIRECTORY.resolve(), "registered compression parent only"
    )
    guard()
    gate = _pinned_json(directory / "qualification-gate.json", PARENT_GATE_SHA)
    worker = _pinned_json(directory / "worker-result.json", PARENT_WORKER_SHA)
    validate_parent_status(gate, worker)
    records = {}
    for name, digest in PARENT_INPUT_HASHES.items():
        guard()
        records[name] = _pinned_json(directory / name, digest)
    ancestor_gate = _pinned_json(
        ANCESTOR_DIRECTORY / "qualification-gate.json", ANCESTOR_GATE_SHA
    )
    ancestor_worker = _pinned_json(
        ANCESTOR_DIRECTORY / "worker-result.json", ANCESTOR_WORKER_SHA
    )
    for record in (ancestor_gate, ancestor_worker):
        require(
            record["schema"] == "nr-case12-polynomial-projectors-controls-v1"
            and record["passed"]
            is record["completed"]
            is record["projector_family_validated"]
            is record["action_family_validated"]
            is True
            and not record["errors"],
            "accepted projector operator ancestor",
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
            "shadow-only ancestor",
        )
    require(
        worker["parent_gate_sha256"] == ANCESTOR_GATE_SHA
        and ancestor_gate["artifact_hashes"]["worker-result.json"]
        == ANCESTOR_WORKER_SHA,
        "explicit compression/projectors parent chain",
    )
    for name, digest in ANCESTOR_INPUT_HASHES.items():
        guard()
        require(
            ancestor_gate["artifact_hashes"][name] == digest,
            "operator ancestor input identity",
        )
        records["ancestor-inputs/" + Path(name).name] = _pinned_json(
            ANCESTOR_DIRECTORY / name, digest
        )
    return records, dict(
        schema="nr-case12-polynomial-energy-parent-v1",
        directory=directory.relative_to(ROOT).as_posix(),
        gate_sha256=PARENT_GATE_SHA,
        worker_sha256=PARENT_WORKER_SHA,
        input_hashes=PARENT_INPUT_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        ancestor=dict(
            directory=ANCESTOR_DIRECTORY.relative_to(ROOT).as_posix(),
            gate_sha256=ANCESTOR_GATE_SHA,
            worker_sha256=ANCESTOR_WORKER_SHA,
            input_hashes=ANCESTOR_INPUT_HASHES.copy(),
        ),
        compression_parent_passed=True,
        projectors_rebuilt=False,
        spectral_chain_rebuilt=False,
    )


def parent_provenance_manifest(parent_directory=PARENT_DIRECTORY):
    """Stdlib-only validation of both named ancestors and all input bytes."""
    return load_parent(parent_directory)[1]


def build_certificate(
    parent_directory=PARENT_DIRECTORY,
    *,
    guard=lambda: None,
    sink=lambda name, matrix: None,
):
    records, provenance = load_parent(parent_directory, guard=guard)
    context = build_context(guard=guard)
    P, V, C, *_ = _modules()
    field = context["field"]
    require(
        records[DOMAIN_INPUT] == context["domain"],
        "accepted source-bound fixedcase12 domain",
    )
    raw = records["scalars.json"]
    require(
        set(raw) == {"r", "g", "factor_N", "factor_M", "Dbar", "etabar", "taubar"},
        "complete compression scalar schema",
    )

    def decode(terms, cap):
        guard()
        values = V.decode_polynomial(terms, max_degree=cap)
        return field.ring.from_dict(
            {power: field.domain.convert(value) for power, value in values.items()}
        )

    r, g = decode(raw["r"], 2), decode(raw["g"], 2)
    require(
        r == P.polynomial(context["r"], field, max_degree=2)
        and g == P.polynomial(context["g"], field, max_degree=2),
        "original fixed direction scalars",
    )
    expected = dict(
        factor_N=r**5, factor_M=r**4, Dbar=r * g**3, etabar=r * g**2, taubar=r**3 * g**6
    )
    for name, value in expected.items():
        require(
            decode(raw[name], 18) == value, "registered compressed denominator identity"
        )
    require(
        records[DENOMINATORS_INPUT]["r"] == raw["r"]
        and records[DENOMINATORS_INPUT]["g"] == raw["g"],
        "fixed source-domain denominator identity",
    )
    components = {
        name: C._to_matrix(
            records[name + "_quotient.json"],
            field,
            (43, 43),
            9 if name.startswith("N") else 8,
            guard,
        )
        for name in INPUT_NAMES
    }
    X = C._to_matrix(records["ancestor-inputs/X.json"], field, (43, 43), 4, guard)
    Pt = C._to_matrix(records["ancestor-inputs/Pt.json"], field, (43, 43), 2, guard)
    stats = {}

    def save(name, matrix):
        guard()
        stats[name] = C.matrix_stats(matrix, MATRIX_CAPS[name])
        sink(name, matrix)
        guard()

    result = energy_from_matrices(
        components,
        X,
        Pt,
        r,
        g,
        context["constants"],
        scaled_rows=SCALED_ROWS,
        guard=guard,
        sink=save,
    )

    def save_negative(name, matrix):
        guard()
        C.matrix_stats(matrix, NEGATIVE_CAPS[name])
        sink(name, matrix)
        guard()

    negative = mutation_witness(
        result["matrices"]["Hbar"], guard=guard, sink=save_negative
    )
    domain_metadata = dict(
        schema="nr-case12-energy-domain-v1",
        real_domain="v!=0",
        unit_sphere="r=1",
        g_lower="5/6",
        weights=["1", "1", "1/2", "1/2", "1/2", "1/2", "1/2", "1/2"],
        constants=list(map(str, context["constants"])),
        denominators=["r", "g"],
        smooth_on_real_domain=True,
        claim="fixed-case12 43-dimensional principal quotient only",
    )
    return dict(
        **result,
        context=context,
        stats=stats,
        **{name: negative[name] for name in NEGATIVE_CAPS},
        mutation=negative["mutation"],
        domain_metadata=domain_metadata,
        source_bridge=context["source_bridge"],
        parent_provenance=provenance,
        domain=records[DOMAIN_INPUT],
        projectors_rebuilt=False,
        spectral_chain_rebuilt=False,
        full58_energy_proved=False,
        candidate_scope="fixed-case12 complete original 43-dimensional principal quotient energy",
    )

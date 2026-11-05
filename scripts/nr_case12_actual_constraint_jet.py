"""Source-bound constraint diagnostics at a constant case12 background.

The new scalar is first order in perturbation amplitude, with spatial derivatives
through order two.  This is not a nonlinear spatial Taylor algebra.  Mathematical
APIs are reserved for the owned worker; source_manifest is pure metadata.
"""

from __future__ import annotations

import __future__
import ast
import copy
import hashlib
import re
from fractions import Fraction as F
from pathlib import Path
from types import MappingProxyType, SimpleNamespace

from scripts import nr_case12_actual_volume_jet as V


ROOT = Path(__file__).resolve().parents[1]
BASE_SOURCE = "scripts/nr_case12_actual_volume_jet.py"
BASE_SHA = "1ef20ec3a7f7610744af016805b1678f578f0b2f07763575da61c60a3d31a868"
DIAGNOSTIC_SOURCE = "science/numerical_relativity/fo_ccz4_relaxation_convergence.py"
CHECKPOINT_SOURCE = "science/numerical_relativity/fo_ccz4_checkpoint.py"
DRIVER_SOURCE = "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py"
SOURCE_HASHES = {
    DIAGNOSTIC_SOURCE: "b639d3e759ec6b75e95a4f44d842d64b61538a6cf3ebf29d1ca08ddc77bca60f",
    CHECKPOINT_SOURCE: "405dcd88a7a1d75757d7f34b4b69d42ba2bf2fc3d5e7b4de06d477a8cf40abdd",
    DRIVER_SOURCE: "0f89d9a992d08f0dd6bd49ff1f8da75b5fb056ed9d9761d1157fa14ee3334af6",
}
SEED_COUNT = 580
STATE_COUNT = 58
HESSIAN_PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
CASE_NAMES = ("baseline", "momentum_trace_mutant", "connection_target_mutant")
PHYSICAL_ORDER = ("H", "M3", "Theta", "Z3", "A3", "B9", "D18", "P3", "det_h", "trace_a")
DRIVER_ORDER = (
    "H_metric",
    "M_metric3",
    "Theta",
    "C_A3",
    "C_B9",
    "C_D27",
    "C_P3",
    "det_h",
    "trace_a",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact(value):
    require(type(value) in (int, F), "explicit int/Fraction scalar required")
    return F(value)


def seed_order(index):
    require(type(index) is int and 0 <= index < SEED_COUNT, "seed outside 0..579")
    return 0 if index < 58 else 1 if index < 232 else 2


def derivative_index(index, axis):
    require(type(axis) is int and axis in (0, 1, 2), "spatial axis 0..2 required")
    order = seed_order(index)
    require(order < 2, "third spatial derivative is outside the registered algebra")
    if order == 0:
        return 58 + 58 * axis + index
    old_axis, slot = divmod(index - 58, 58)
    pair = tuple(sorted((axis, old_axis)))
    return 232 + 58 * HESSIAN_PAIRS.index(pair) + slot


class SparseJet:
    """Exact amplitude-first variation with structural spatial-order tracking."""

    __slots__ = ("value", "coefficients", "spatial_order")

    def __init__(
        self, value=F(0), coefficients=None, *, spatial_order=-1, gradient_taint=False
    ):
        self.value = exact(value)
        require(
            coefficients is None or type(coefficients) is dict,
            "coefficient dict required",
        )
        require(
            type(spatial_order) is int and spatial_order in (-1, 0, 1, 2),
            "spatial order -1..2 required",
        )
        require(
            type(gradient_taint) is bool, "boolean compatibility provenance required"
        )
        terms, order = {}, max(spatial_order, 1 if gradient_taint else -1)
        for index, coefficient in (coefficients or {}).items():
            order = max(order, seed_order(index))
            require(
                type(coefficient) is F and coefficient,
                "nonzero Fraction coefficient required",
            )
            terms[index] = coefficient
        self.coefficients = MappingProxyType(terms)
        self.spatial_order = order

    @property
    def gradient_taint(self):
        return self.spatial_order >= 1

    @classmethod
    def seed(cls, index, value=F(1)):
        order, value = seed_order(index), exact(value)
        return cls(F(0), {index: value} if value else {}, spatial_order=order)

    @staticmethod
    def _coerce(other):
        if isinstance(other, SparseJet):
            return other
        return SparseJet(other) if type(other) in (int, F) else NotImplemented

    def __add__(self, other):
        other = self._coerce(other)
        if other is NotImplemented:
            return NotImplemented
        terms = dict(self.coefficients)
        for key, value in other.coefficients.items():
            value = terms.get(key, F(0)) + value
            if value:
                terms[key] = value
            else:
                terms.pop(key, None)
        return SparseJet(
            self.value + other.value,
            terms,
            spatial_order=max(self.spatial_order, other.spatial_order),
        )

    __radd__ = __add__

    def __neg__(self):
        return SparseJet(
            -self.value,
            {i: -v for i, v in self.coefficients.items()},
            spatial_order=self.spatial_order,
        )

    def __sub__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self + (-other)

    def __rsub__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else other + (-self)

    def __mul__(self, other):
        other = self._coerce(other)
        if other is NotImplemented:
            return NotImplemented
        terms = {
            i: v * other.value for i, v in self.coefficients.items() if v * other.value
        }
        for i, v in other.coefficients.items():
            value = terms.get(i, F(0)) + self.value * v
            if value:
                terms[i] = value
            else:
                terms.pop(i, None)
        return SparseJet(
            self.value * other.value,
            terms,
            spatial_order=max(self.spatial_order, other.spatial_order),
        )

    __rmul__ = __mul__

    def reciprocal(self):
        require(self.value != 0, "jet reciprocal requires a nonzero base value")
        return SparseJet(
            1 / self.value,
            {i: -v / self.value**2 for i, v in self.coefficients.items()},
            spatial_order=self.spatial_order,
        )

    def __truediv__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self * other.reciprocal()

    def __rtruediv__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else other * self.reciprocal()

    def __pow__(self, power):
        require(type(power) is int, "integer jet exponent required")
        if power < 0:
            return self.reciprocal() ** (-power)
        if power == 0:
            return SparseJet(F(1), spatial_order=self.spatial_order)
        factor = power * self.value ** (power - 1)
        return SparseJet(
            self.value**power,
            {i: factor * v for i, v in self.coefficients.items() if factor * v},
            spatial_order=self.spatial_order,
        )

    def __bool__(self):
        return bool(self.value or self.coefficients)

    def __float__(self):
        raise ValueError("floating conversion would lose exact derivatives")

    def __eq__(self, other):
        other = self._coerce(other)
        return (
            False
            if other is NotImplemented
            else self.value == other.value and self.coefficients == other.coefficients
        )

    def __lt__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self.value < other.value

    def __le__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self.value <= other.value

    def __gt__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self.value > other.value

    def __ge__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self.value >= other.value

    def gradient(self, axis):
        require(type(axis) is int and axis in (0, 1, 2), "spatial axis 0..2 required")
        require(
            self.spatial_order < 2, "third spatial derivative request is not registered"
        )
        terms = {}
        for index, coefficient in self.coefficients.items():
            target = derivative_index(index, axis)
            terms[target] = terms.get(target, F(0)) + coefficient
        return SparseJet(
            F(0),
            {i: v for i, v in terms.items() if v},
            spatial_order=self.spatial_order + 1 if self.spatial_order >= 0 else -1,
        )


class ConstraintArrayBackend(V.ExactArrayBackend):
    """Frozen exact object-array routing plus explicitly registered new primitives."""

    def __init__(self, *, scalar_type=SparseJet, check=lambda: None):
        _verify_base()
        super().__init__(scalar_type=scalar_type, check=check)
        self.operations.update(
            stack_calls=0, spatial_second_derivatives=0, chart_log_calls=0
        )

    def stack(self, values, axis=0):
        require(type(axis) is int, "integer stack axis required")
        values = tuple(values)
        require(values, "nonempty exact stack required")
        arrays = tuple(self.asarray(value) for value in values)
        self.check()
        self.operations["stack_calls"] += 1
        return self.np.stack(arrays, axis=axis)

    def spatial_derivative(self, value, axis):
        require(type(axis) is int and axis in (0, 1, 2), "registered derivative axis")
        self.check()
        self.operations["derivative_calls"] += 1
        array = self.asarray(value)
        result = self.empty(array.shape)
        for offset, index in enumerate(self.np.ndindex(array.shape)):
            if offset % 128 == 0:
                self.check()
            scalar = self.scalar(array[index])
            if scalar.spatial_order == 1:
                self.operations["spatial_second_derivatives"] += 1
            result[index] = scalar.gradient(axis)
        return result

    def chart_log(self, value, center):
        """First variation of log(value)-log(center), only at this fixed center."""
        center = exact(center)
        require(center > 0, "positive logarithm center required")
        array = self.asarray(value)
        result = self.empty(array.shape)
        self.operations["chart_log_calls"] += 1
        for index in self.np.ndindex(array.shape):
            scalar = self.scalar(array[index])
            require(
                scalar.value == center and scalar.spatial_order <= 0,
                "registered centered state logarithm required",
            )
            result[index] = scalar / center - 1
        return result


def _verify_base():
    require(
        hashlib.sha256((ROOT / BASE_SOURCE).read_bytes()).hexdigest() == BASE_SHA,
        "frozen array/source adapter changed",
    )


def verify_source(raw, source_name):
    require(
        source_name in SOURCE_HASHES and type(raw) is bytes,
        "registered diagnostic source bytes",
    )
    require(
        hashlib.sha256(raw).hexdigest() == SOURCE_HASHES[source_name],
        "diagnostic source drift: " + source_name,
    )
    return ast.parse(raw.decode("utf-8"), filename=source_name)


class _DiagnosticAdapt(V._Adapt):
    def visit_Constant(self, node):
        if type(node.value) is not float:
            return node
        token = ast.get_source_segment(self.text, node)
        require(
            token is not None
            and re.fullmatch(
                r"(?:[0-9][0-9_]*(?:\.[0-9_]*)?|\.[0-9_]+)(?:[eE][+-]?[0-9_]+)?", token
            ),
            "registered decimal token, including leading-dot form",
        )
        replacement = ast.Call(
            ast.Name("F", ast.Load()), [ast.Constant(token.replace("_", ""))], []
        )
        return self.record(
            node, "decimal-token-to-exact-rational-including-leading-dot", replacement
        )

    def visit_Call(self, node):
        original = copy.deepcopy(node)
        node = self.generic_visit(node)
        if not (
            isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "np"
        ):
            return node
        if self.definition == "constraint_fields" and node.func.attr == "exp":
            require(
                ast.dump(original.args[0], include_attributes=False)
                == ast.dump(
                    ast.parse("2*q[10]", mode="eval").body, include_attributes=False
                ),
                "only registered diagnostic chi exponential",
            )
            return self.record(
                original,
                "centered-chi-first-variation",
                ast.Call(
                    ast.Name("_chart_exp", ast.Load()),
                    [node.args[0], ast.Name("_chi_center", ast.Load())],
                    [],
                ),
            )
        if self.definition == "metric_constraints" and node.func.attr == "log":
            text = ast.unparse(original.args[0])
            require(
                text in ("b.lapse", "b.chi"),
                "only two registered derivative-of-log expressions",
            )
            center = "_alpha_center" if text == "b.lapse" else "_chi_center"
            return self.record(
                original,
                "centered-log-under-spatial-derivative",
                ast.Call(
                    ast.Name("_chart_log", ast.Load()),
                    [node.args[0], ast.Name(center, ast.Load())],
                    [],
                ),
            )
        return node


def _variant(function, case):
    require(case in CASE_NAMES, "registered actual diagnostic case")
    node = copy.deepcopy(function)
    if case == "baseline":
        return node, []
    target = "actual_trace" if case == "momentum_trace_mutant" else "metric_gamma"
    matches = [
        member
        for member in node.body
        if isinstance(member, ast.Assign)
        and len(member.targets) == 1
        and isinstance(member.targets[0], ast.Name)
        and member.targets[0].id == target
    ]
    require(len(matches) == 1, "single registered actual diagnostic assignment")
    assignment = matches[0]
    original = copy.deepcopy(assignment.value)
    replacement = ast.parse(
        "q[17]"
        if case == "momentum_trace_mutant"
        else "np.stack([-sum(derivative(hi[..., i, j], j, order) for j in range(3)) for i in range(3)], axis=-1)",
        mode="eval",
    ).body
    assignment.value = ast.copy_location(replacement, original)
    return ast.fix_missing_locations(node), [
        {
            "case": case,
            "target": target,
            "operation": "actual-source-expression-replacement",
            "original_ast": ast.dump(original, include_attributes=False),
            "replacement_ast": ast.dump(replacement, include_attributes=False),
            "original_expression": ast.unparse(original),
            "replacement_expression": ast.unparse(replacement),
        }
    ]


def _program():
    _verify_base()
    parent = V.source_manifest()
    trees, texts = {}, {}
    for source in SOURCE_HASHES:
        raw = (ROOT / source).read_bytes()
        trees[source], texts[source] = verify_source(raw, source), raw.decode("utf-8")
    nodes, bindings, changes = [], [], []
    symmetric = V._definition(trees[CHECKPOINT_SOURCE], "SYMMETRIC")
    nodes.append(copy.deepcopy(symmetric))
    bindings.append(
        dict(
            source=CHECKPOINT_SOURCE,
            name="SYMMETRIC",
            compiled=True,
            original_ast=ast.dump(symmetric, include_attributes=False),
            adapted_ast=ast.dump(symmetric, include_attributes=False),
        )
    )
    original_constraint = None
    for name in ("require", "symmetric", "christoffel", "constraint_fields"):
        original = V._definition(trees[DIAGNOSTIC_SOURCE], name)
        adapter = _DiagnosticAdapt(DIAGNOSTIC_SOURCE, name, texts[DIAGNOSTIC_SOURCE])
        adapted = ast.fix_missing_locations(adapter.visit(copy.deepcopy(original)))
        changes.extend(adapter.log)
        bindings.append(
            dict(
                source=DIAGNOSTIC_SOURCE,
                name=name,
                compiled=True,
                original_ast=ast.dump(original, include_attributes=False),
                adapted_ast=ast.dump(adapted, include_attributes=False),
            )
        )
        if name == "constraint_fields":
            original_constraint = adapted
        else:
            nodes.append(adapted)
    cls = V._definition(trees[DRIVER_SOURCE], "NonlinearSBPCube")
    matches = [
        node
        for node in cls.body
        if isinstance(node, ast.FunctionDef) and node.name == "metric_constraints"
    ]
    require(len(matches) == 1, "one original driver metric diagnostic")
    original = matches[0]
    adapter = _DiagnosticAdapt(
        DRIVER_SOURCE, "metric_constraints", texts[DRIVER_SOURCE]
    )
    driver = ast.fix_missing_locations(adapter.visit(copy.deepcopy(original)))
    changes.extend(adapter.log)
    nodes.append(driver)
    bindings.append(
        dict(
            source=DRIVER_SOURCE,
            name="NonlinearSBPCube.metric_constraints",
            compiled=True,
            original_ast=ast.dump(original, include_attributes=False),
            adapted_ast=ast.dump(driver, include_attributes=False),
        )
    )
    for source, name, node in (
        (
            DIAGNOSTIC_SOURCE,
            "derivative",
            V._definition(trees[DIAGNOSTIC_SOURCE], "derivative"),
        ),
        (
            DRIVER_SOURCE,
            "NonlinearSBPCube.state",
            next(
                node
                for node in cls.body
                if isinstance(node, ast.FunctionDef) and node.name == "state"
            ),
        ),
    ):
        bindings.append(
            dict(
                source=source,
                name=name,
                compiled=False,
                original_ast=ast.dump(node, include_attributes=False),
            )
        )
    variants, mutations = {}, {}
    for case in CASE_NAMES:
        variants[case], mutations[case] = _variant(original_constraint, case)
    counts = {}
    for row in changes:
        counts[row["operation"]] = counts.get(row["operation"], 0) + 1
    require(
        counts.get("centered-chi-first-variation") == 1
        and counts.get("centered-log-under-spatial-derivative") == 2,
        "registered diagnostic chart adaptation counts",
    )
    manifest = dict(
        schema="nr-case12-actual-constraint-source-bridge-v1",
        source_hashes=dict(SOURCE_HASHES),
        inherited_adapter=dict(path=BASE_SOURCE, sha256=BASE_SHA, manifest=parent),
        bindings=bindings,
        adaptations=changes,
        adaptation_counts=counts,
        variants={
            case: dict(
                adapted_ast=ast.dump(node, include_attributes=False),
                mutations=mutations[case],
            )
            for case, node in variants.items()
        },
        seed_count=580,
        state_seeds=[0, 57],
        gradient_seed_rule="58+58*axis+slot",
        hessian_seed_rule="232+58*pair_index+slot",
        hessian_pairs=[list(pair) for pair in HESSIAN_PAIRS],
        mixed_hessian_factor="one independent mixed derivative seed; ordered source contributions add naturally; no extra factor two",
        spatial_order_tracking="-1 constant, 0 state, 1 gradient, 2 Hessian; max provenance survives cancellation and multiplication by zero; third derivatives rejected",
        physical_output_order=list(PHYSICAL_ORDER),
        driver_output_order=list(DRIVER_ORDER),
        physical_observable_map="Z_i = sum_j h_ij * raw_Ghat^j / 2; original current h jets before amplitude extraction",
        derivative_adapter="both frozen FD2/4-FFT and SBP axis derivative calls are replaced by exact constant-background continuum derivatives; neither stencil executed",
        constructor_adapter="inherited source-bound state_from_slots with exact object carrier; driver self.state calls it directly, without binary64 field conversion or grid9..17 constructor",
        carrier_identity="new centered580 carrier replaces inherited centered232 identity in a private namespace only",
        log_adapter="log(field)-log(fixed positive center) first variation only, at the two original expressions used solely under spatial derivatives",
        reused_array_routing="frozen exact object storage/einsum/trace/Gauss-Jordan/determinant; new explicit stack and spatial derivatives",
        mathematical_scope="first variation at fixed constant case12, all58 independent off-constraint state/174 gradient/348 symmetric Hessian amplitudes",
        binary64_execution=False,
        finite_difference_or_sbp_execution=False,
        nonlinear_diagnostic_identity_proved=False,
    )
    return nodes, variants, manifest


def source_manifest():
    return _program()[2]


source_bridge_manifest = source_manifest


def _compile(backend, guard):
    nodes, variants, manifest = _program()
    namespace, inherited = V._compile(backend, guard)
    require(
        inherited == manifest["inherited_adapter"]["manifest"],
        "unchanged inherited source adapter",
    )
    namespace["_jet_carrier_sha256"] = hashlib.sha256(
        b"exact-centered-580-seed-carrier-not-fp64-state-bytes"
    ).hexdigest()
    namespace["_chart_log"] = backend.chart_log

    def derivative(value, axis, order):
        require(
            type(order) is int and order == 4,
            "registered formal order tag; no FD execution",
        )
        return backend.spatial_derivative(value, axis)

    namespace["derivative"] = derivative
    program = ast.fix_missing_locations(ast.Module(body=nodes, type_ignores=[]))
    exec(
        compile(
            program,
            "<actual-constraint-source>",
            "exec",
            flags=__future__.annotations.compiler_flag,
        ),
        namespace,
    )
    functions = {}
    for case, node in variants.items():
        private = dict(namespace)
        program = ast.fix_missing_locations(
            ast.Module(body=[copy.deepcopy(node)], type_ignores=[])
        )
        exec(
            compile(
                program,
                "<actual-constraint-" + case + ">",
                "exec",
                flags=__future__.annotations.compiler_flag,
            ),
            private,
        )
        functions[case] = private["constraint_fields"]
    return namespace, functions, manifest


def _collect(backend, array):
    value = backend.asarray(array)
    require(value.shape[:3] == (1, 1, 1), "one-cell diagnostic shape required")
    return [backend.scalar(item) for item in value.reshape(-1)]


def _scalar_record(value):
    return dict(
        value=str(value.value),
        coefficients=[[i, str(x)] for i, x in sorted(value.coefficients.items())],
    )


def evaluate_with_backend(backend, *, case="baseline", guard=lambda: None, check=None):
    require(
        isinstance(backend, ConstraintArrayBackend),
        "registered diagnostic array routing",
    )
    require(
        case in CASE_NAMES and callable(guard) and (check is None or callable(check)),
        "registered case and callbacks",
    )
    deadline = backend.check if check is None else check
    guard()
    namespace, functions, manifest = _compile(backend, guard)
    background = namespace["case12"]()
    namespace["_alpha_center"], namespace["_chi_center"] = (
        background.alpha,
        background.chi,
    )
    # Functions have deliberately separate globals: install only the two fixed
    # chart centers after the original case12 constructor has supplied them.
    for function in functions.values():
        function.__globals__["_alpha_center"] = background.alpha
        function.__globals__["_chi_center"] = background.chi
    require(
        tuple(namespace["SYMMETRIC"]) == HESSIAN_PAIRS, "canonical symmetric packing"
    )
    values = [F(0)] * 58
    for slot, (i, j) in enumerate(HESSIAN_PAIRS):
        values[slot] = background.metric[i][j]
    values[7:10] = background.shift
    slots = backend.empty((58, 1, 1, 1))
    for slot in range(58):
        deadline()
        slots[slot, 0, 0, 0] = backend.scalar_type(values[slot], {slot: F(1)})
    grid = SimpleNamespace(shape=(1, 1, 1), spatial_order=4)
    state = namespace["state_from_slots"](grid, slots)
    alpha = backend.scalar(state.base.lapse[0, 0, 0])
    chi = backend.scalar(state.base.chi[0, 0, 0])
    require(
        alpha.value == background.alpha
        and dict(alpha.coefficients) == {6: background.alpha},
        "original lapse state chart",
    )
    require(
        chi.value == background.chi
        and dict(chi.coefficients) == {10: 2 * background.chi},
        "original conformal state chart",
    )
    data = SimpleNamespace(slots=slots, header={"spatial_order": 4})
    guard()
    fields = functions[case](data)
    require(
        set(fields)
        == {"H", "M", "Theta", "Ghat", "A", "B", "D", "P", "det_h", "trace_a"},
        "complete actual constraint field dictionary",
    )
    h = namespace["symmetric"](slots, 0)
    z = backend.einsum("...ij,...j->...i", h, fields["Ghat"]) / 2
    rows = []
    for array in (
        fields["H"],
        fields["M"],
        fields["Theta"],
        z,
        fields["A"],
        fields["B"],
        fields["D"],
        fields["P"],
        fields["det_h"],
        fields["trace_a"],
    ):
        deadline()
        rows.extend(_collect(backend, array))
    require(len(rows) == 43, "complete physical43 ordering")
    raw_driver = None
    if case == "baseline":
        guard()

        class Axis:
            def __init__(self, index):
                self.index = index

            def derivative(self, value, *, axis):
                require(
                    type(axis) is int and axis == self.index,
                    "formal driver axis identity",
                )
                return backend.spatial_derivative(value, axis)

        class Driver:
            volume = SimpleNamespace(grid=grid, axes=tuple(Axis(i) for i in range(3)))

            @staticmethod
            def state(value):
                return namespace["state_from_slots"](grid, value)

        driver_fields = namespace["metric_constraints"](Driver(), slots)
        require(
            set(driver_fields)
            == {
                "H_metric",
                "M_metric",
                "Theta",
                "C_A",
                "C_B",
                "C_D",
                "C_P",
                "det_h",
                "trace_a",
            },
            "complete actual driver field dictionary",
        )
        raw_driver = []
        for name in (
            "H_metric",
            "M_metric",
            "Theta",
            "C_A",
            "C_B",
            "C_D",
            "C_P",
            "det_h",
            "trace_a",
        ):
            deadline()
            raw_driver.extend(_collect(backend, driver_fields[name]))
        require(len(raw_driver) == 49, "all49 raw driver scalar fields, including D27")
    for scalar in (*rows, *(raw_driver or [])):
        deadline()
        require(
            type(scalar.value) is F
            and all(
                type(i) is int and 0 <= i < 580 and type(value) is F and value
                for i, value in scalar.coefficients.items()
            ),
            "exact complete580 scalar extraction",
        )
    guard()
    execution = dict(
        schema="nr-case12-actual-constraint-execution-v1",
        case=case,
        state_seeds=58,
        gradient_seeds=174,
        hessian_seeds=348,
        hessian_pairs=[list(pair) for pair in HESSIAN_PAIRS],
        physical_outputs=43,
        driver_outputs=49 if raw_driver is not None else 0,
        chart=dict(
            schema="nr-case12-actual-constraint-chart-v1",
            alpha=_scalar_record(alpha),
            chi=_scalar_record(chi),
            logarithmic_slots=[6, 10],
            centered_log_only_under_derivative=True,
            all_auxiliaries_independent=True,
            determinant_or_trace_projection=False,
        ),
        parameters=dict(
            alpha=str(background.alpha),
            chi=str(background.chi),
            metric=[[str(x) for x in row] for row in background.metric],
            shift=[str(x) for x in background.shift],
        ),
        mutation=manifest["variants"][case]["mutations"],
        operations=dict(backend.operations),
        mathematical_scope=manifest["mathematical_scope"],
        actual_binary64_diagnostic_executed=False,
        actual_stencil_executed=False,
        new_amplitude_or_direction_samples=0,
    )
    return dict(
        rows=tuple(rows),
        raw_driver=None if raw_driver is None else tuple(raw_driver),
        execution=execution,
    )


def evaluate_case(*, case="baseline", guard=lambda: None, check=lambda: None):
    require(callable(check), "deadline callback required")
    return evaluate_with_backend(
        ConstraintArrayBackend(check=check), case=case, guard=guard, check=check
    )

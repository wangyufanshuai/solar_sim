"""Source-bound real-formula first variation of the actual volume equations.

Only an owned worker may call the mathematical APIs.  source_manifest performs
bytes/SHA/AST work only.  Original equation bodies are cloned, never transcribed.
The exact decimal interpretation is not an execution of the binary64 solver.
"""

import __future__
import ast
import copy
import hashlib
import importlib
import itertools
import re
from contextlib import nullcontext
from dataclasses import asdict, dataclass, field, replace
from fractions import Fraction as F
from pathlib import Path
from types import MappingProxyType, SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
SEED_COUNT = 232
STATE_COUNT = 58
SOURCE_HASHES = {
    "science/numerical_relativity/fo_ccz4_rhs.py": "0f7c9605eead92b8dae409a84d12070e8ef044500057f46a71ed2310e2cfdb2d",
    "science/numerical_relativity/fo_ccz4_sbp_volume.py": "67d99a3f3cf79832ec4c5a2a8e1725aebac56e1e5c3d7bd9d98eca6f2797aec8",
    "science/numerical_relativity/fo_ccz4_principal_symbol.py": "1d65e52f7121a5f5982853868c81fb83326aaec3ec1f8b3fa485f16a4c6e8315",
    "science/numerical_relativity/fo_ccz4.py": "9afbe1856077ee459c01daf3a60ed2bf47448c657529e9dbf7e4ac283a0fd802",
    "science/numerical_relativity/ccz4_reference.py": "208efc75cb6b2b6da3fc43788d4625bb7d6501364b8b8590bf9de6bb39d2b420",
    "science/numerical_relativity/fo_ccz4_gauge_profile.py": "a908e5186974d3f27d51e80fd71c3c0b15eb6934999bfd9b542c2fbd1d95040f",
    "science/numerical_relativity/fo_ccz4_constraint_control.py": "1bed22ca9b2c31b7da5af21bf50403a159e163f71ae04eb8197c9f2c895468b4",
    "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py": "0f89d9a992d08f0dd6bd49ff1f8da75b5fb056ed9d9761d1157fa14ee3334af6",
    "science/numerical_relativity/nr3d.py": "27c744f5d7707ced082a03cad2eba3445ad508c13d36d783d1a5e0907eda7793",
    "scripts/nr_profile_exact_coefficients.py": "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
    "scripts/nr_constraint_full_symbol.py": "053b70dd9136117dcfc8f2045b9953dc5ece6bfdf382eb1da12f33b9b8446042",
}

# Order is compilation dependency order, not a second set of equations.
COMPILED = (
    (
        "scripts/nr_profile_exact_coefficients.py",
        ("rational", "determinant", "inverse", "Background", "case12"),
    ),
    (
        "science/numerical_relativity/fo_ccz4.py",
        (
            "FOCCZ4_BASE_VARIABLES",
            "FOCCZ4_AUXILIARY_VARIABLES",
            "FOCCZ4_VARIABLE_ORDER",
            "FOCCZ4Auxiliary3D",
        ),
    ),
    ("science/numerical_relativity/ccz4_reference.py", ("GaugeConfig",)),
    (
        "science/numerical_relativity/fo_ccz4_constraint_control.py",
        (
            "CONTROL_METADATA_KEY",
            "validate_tau_inverse",
            "constraint_control_identity",
            "require_matching_constraint_control",
        ),
    ),
    (
        "science/numerical_relativity/fo_ccz4_rhs.py",
        ("FOCCZ4Config", "FOCCZ4State3D", "FOCCZ4RHS3D"),
    ),
    ("science/numerical_relativity/nr3d.py", ("_finite_array", "BSSNState3D")),
    (
        "science/numerical_relativity/fo_ccz4_gauge_profile.py",
        (
            "PROFILE_METADATA_KEY",
            "FOCCZ4GaugeProfile",
            "require_matching_gauge_profile",
        ),
    ),
    (
        "science/numerical_relativity/fo_ccz4_rhs.py",
        (
            "_sym_first",
            "_sym_shift_gradient",
            "_sym_metric_gradient",
            "_geometry",
            "_fo_ccz4_volume_rhs_3d",
        ),
    ),
    (
        "science/numerical_relativity/fo_ccz4_sbp_volume.py",
        ("METADATA_KEY", "SYMMETRIC", "state_from_slots"),
    ),
    ("science/numerical_relativity/fo_ccz4_principal_symbol.py", ("_rhs_components",)),
    (
        "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py",
        ("GAUGE", "CONFIG", "PROFILE"),
    ),
)
REFERENCE_ONLY = (
    ("science/numerical_relativity/fo_ccz4_sbp_volume.py", "SBPVolumeOperator"),
    ("science/numerical_relativity/fo_ccz4_sbp_nonlinear.py", "NonlinearSBPCube"),
    ("scripts/nr_profile_exact_coefficients.py", "principal_rates"),
    ("scripts/nr_profile_exact_coefficients.py", "matrix"),
    ("scripts/nr_constraint_full_symbol.py", "source"),
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _rational(value):
    require(type(value) in (int, F), "explicit int/Fraction required; no bool/float")
    return F(value)


class SparseJet:
    """An exact element of Q[e_0,...,e_231]/(all e_i e_j).

    Taint separately retains spatial-gradient provenance after cancellation.
    It prevents an unregistered second derivative from disappearing by zero.
    """

    __slots__ = ("value", "coefficients", "gradient_taint")

    def __init__(self, value=F(0), coefficients=None, *, gradient_taint=False):
        self.value = _rational(value)
        require(
            coefficients is None or type(coefficients) is dict,
            "coefficient dict required",
        )
        require(type(gradient_taint) is bool, "boolean gradient provenance required")
        terms = {}
        for index, coefficient in (coefficients or {}).items():
            require(
                type(index) is int and 0 <= index < SEED_COUNT, "seed outside 0..231"
            )
            require(
                type(coefficient) is F and coefficient != 0,
                "nonzero Fraction coefficient required",
            )
            terms[index] = coefficient
        self.coefficients = MappingProxyType(terms)
        self.gradient_taint = gradient_taint or any(i >= STATE_COUNT for i in terms)

    @classmethod
    def seed(cls, index, value=F(1)):
        require(type(index) is int and 0 <= index < SEED_COUNT, "seed outside 0..231")
        coefficient = _rational(value)
        return cls(
            F(0),
            {index: coefficient} if coefficient else {},
            gradient_taint=index >= STATE_COUNT,
        )

    @staticmethod
    def _coerce(other):
        if isinstance(other, SparseJet):
            return other
        if type(other) in (int, F):
            return SparseJet(other)
        return NotImplemented

    def __add__(self, other):
        other = self._coerce(other)
        if other is NotImplemented:
            return NotImplemented
        terms = dict(self.coefficients)
        for index, coefficient in other.coefficients.items():
            terms[index] = terms.get(index, F(0)) + coefficient
            if not terms[index]:
                del terms[index]
        return SparseJet(
            self.value + other.value,
            terms,
            gradient_taint=self.gradient_taint or other.gradient_taint,
        )

    __radd__ = __add__

    def __neg__(self):
        return SparseJet(
            -self.value,
            {i: -x for i, x in self.coefficients.items()},
            gradient_taint=self.gradient_taint,
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
            i: x * other.value for i, x in self.coefficients.items() if x * other.value
        }
        for index, coefficient in other.coefficients.items():
            value = terms.get(index, F(0)) + self.value * coefficient
            if value:
                terms[index] = value
            else:
                terms.pop(index, None)
        return SparseJet(
            self.value * other.value,
            terms,
            gradient_taint=self.gradient_taint or other.gradient_taint,
        )

    __rmul__ = __mul__

    def reciprocal(self):
        require(self.value != 0, "jet reciprocal requires a nonzero base value")
        return SparseJet(
            1 / self.value,
            {i: -x / self.value**2 for i, x in self.coefficients.items()},
            gradient_taint=self.gradient_taint,
        )

    def __truediv__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else self * other.reciprocal()

    def __rtruediv__(self, other):
        other = self._coerce(other)
        return NotImplemented if other is NotImplemented else other * self.reciprocal()

    def __pow__(self, exponent):
        require(type(exponent) is int, "integer jet power required")
        if exponent < 0:
            return self.reciprocal() ** (-exponent)
        if exponent == 0:
            return SparseJet(F(1), gradient_taint=self.gradient_taint)
        factor = exponent * self.value ** (exponent - 1)
        return SparseJet(
            self.value**exponent,
            {i: factor * x for i, x in self.coefficients.items() if factor * x},
            gradient_taint=self.gradient_taint,
        )

    def __eq__(self, other):
        other = self._coerce(other)
        return (
            False
            if other is NotImplemented
            else self.value == other.value and self.coefficients == other.coefficients
        )

    def __bool__(self):
        return bool(self.value or self.coefficients)

    def _compare(self, other, operation):
        other = self._coerce(other)
        require(other is not NotImplemented, "exact base comparison required")
        return operation(self.value, other.value)

    def __lt__(self, other):
        return self._compare(other, lambda a, b: a < b)

    def __le__(self, other):
        return self._compare(other, lambda a, b: a <= b)

    def __gt__(self, other):
        return self._compare(other, lambda a, b: a > b)

    def __ge__(self, other):
        return self._compare(other, lambda a, b: a >= b)

    def gradient(self, axis):
        require(type(axis) is int and 0 <= axis < 3, "spatial axis 0..2 required")
        require(not self.gradient_taint, "unregistered second spatial derivative")
        return SparseJet(
            F(0),
            {58 + 58 * axis + i: x for i, x in self.coefficients.items()},
            gradient_taint=bool(self.coefficients),
        )


class _Unwritten:
    def __bool__(self):
        raise ValueError("read of uninitialized exact array slot")

    def _reject(self, *args):
        raise ValueError("arithmetic on uninitialized exact array slot")

    __add__ = __radd__ = __sub__ = __rsub__ = __mul__ = __rmul__ = _reject
    __truediv__ = __rtruediv__ = __neg__ = _reject


UNWRITTEN = _Unwritten()


class ExactArrayBackend:
    """Object-array routing shared with a separately implemented scalar replay.

    Production scalar propagation is SparseJet.  Replay may replace scalar_type
    and override inverse/determinant.  No numpy floating arithmetic is requested.
    """

    float64 = object

    def __init__(self, *, scalar_type=SparseJet, check=lambda: None):
        require(callable(check), "deadline callback required")
        self.np = importlib.import_module("numpy")
        self.scalar_type = scalar_type
        self.check = check
        self.operations = {
            "einsum_calls": 0,
            "einsum_products": 0,
            "inverse_calls": 0,
            "determinant_calls": 0,
            "derivative_calls": 0,
        }
        self.linalg = SimpleNamespace(inv=self.inverse, det=self.determinant)

    def scalar(self, value):
        if isinstance(value, self.scalar_type):
            return value
        return self.scalar_type(_rational(value))

    def asarray(self, value, dtype=None):
        self.check()
        require(dtype in (None, object, float, bool), "unregistered array dtype")
        result = self.np.asarray(value, dtype=bool if dtype is bool else object)
        if dtype is not bool:
            for item in result.flat:
                require(
                    isinstance(item, self.scalar_type) or type(item) in (F, int, bool),
                    "nonexact or unwritten array item",
                )
        return result

    def array(self, value, dtype=None, order="C", copy=True):
        require(
            order == "C" and type(copy) is bool, "registered exact array copy required"
        )
        result = self.asarray(value, dtype=dtype)
        return result.copy() if copy else result

    def zeros(self, shape, dtype=None):
        self.check()
        require(dtype in (None, object, float, bool), "unregistered zeros dtype")
        result = self.np.empty(shape, dtype=bool if dtype is bool else object)
        result.fill(False if dtype is bool else F(0))
        return result

    def ones(self, shape, dtype=None):
        result = self.zeros(shape, dtype=dtype)
        result.fill(True if dtype is bool else F(1))
        return result

    def empty(self, shape, dtype=None):
        self.check()
        require(dtype in (None, object, float), "unregistered empty dtype")
        result = self.np.empty(shape, dtype=object)
        result.fill(UNWRITTEN)
        return result

    def zeros_like(self, value):
        return self.zeros(value.shape)

    def empty_like(self, value):
        return self.empty(value.shape)

    def isfinite(self, value):
        array = self.np.asarray(value, dtype=object)
        result = self.np.empty(array.shape, dtype=bool)
        for index in self.np.ndindex(array.shape):
            item = array[index]
            require(item is not UNWRITTEN, "read of uninitialized exact array slot")
            require(
                isinstance(item, self.scalar_type) or type(item) in (F, int, bool),
                "finite check refuses inexact values",
            )
            result[index] = True
        return result

    def all(self, value):
        return self.np.all(value)

    def any(self, value):
        return self.np.any(value)

    def allclose(self, left, right, *, rtol, atol):
        _rational(rtol)
        _rational(atol)
        first, second = self.np.broadcast_arrays(
            self.asarray(left), self.asarray(right)
        )
        for offset, (a, b) in enumerate(zip(first.flat, second.flat, strict=True)):
            if offset % 256 == 0:
                self.check()
            a, b = self.scalar(a), self.scalar(b)
            if a.value != b.value or dict(a.coefficients) != dict(b.coefficients):
                return False
        return True

    def moveaxis(self, value, source, destination):
        return self.np.moveaxis(value, source, destination)

    def swapaxes(self, value, first, second):
        return self.np.swapaxes(value, first, second)

    def trace(self, value, *, axis1=0, axis2=1):
        self.check()
        return self.np.trace(value, axis1=axis1, axis2=axis2)

    @staticmethod
    def errstate(**kwargs):
        require(
            set(kwargs) <= {"over", "invalid", "under"}
            and all(x == "raise" for x in kwargs.values()),
            "registered errstate only",
        )
        return nullcontext()

    def chart_exp(self, perturbation, center):
        center = _rational(center)
        require(center > 0, "positive exact exponential center required")
        array = self.asarray(perturbation)
        result = self.empty(array.shape)
        for index in self.np.ndindex(array.shape):
            value = self.scalar(array[index])
            require(
                value.value == 0 and not value.gradient_taint,
                "centered logarithmic state jet required",
            )
            result[index] = center * (1 + value)
        return result

    def derivative(self, value, state, axis):
        self.check()
        self.operations["derivative_calls"] += 1
        require(
            tuple(state.grid.shape) == (1, 1, 1), "single-cell formal grid required"
        )
        array = self.asarray(value)
        result = self.empty(array.shape)
        for index in self.np.ndindex(array.shape):
            result[index] = self.scalar(array[index]).gradient(axis)
        return result

    def einsum(self, specification, *values):
        self.check()
        require(
            type(specification) is str and specification.count("->") == 1,
            "explicit einsum specification required",
        )
        left, right = specification.split("->")
        words = left.split(",")
        require(len(words) == len(values) and values, "einsum arity mismatch")
        arrays = [self.asarray(value) for value in values]
        ranks = []
        for word, array in zip(words, arrays, strict=True):
            require(
                re.fullmatch(r"(?:\.\.\.)?[a-z]*", word) is not None,
                "unsupported einsum labels",
            )
            letters = word.replace("...", "")
            rank = array.ndim - len(letters)
            require(rank >= 0 and ("..." in word or rank == 0), "einsum rank mismatch")
            ranks.append(rank)
        ellipsis_rank = max(ranks)
        ellipsis = tuple(f"@{i}" for i in range(ellipsis_rank))
        labels = []
        dimensions = {}
        for word, array, rank in zip(words, arrays, ranks, strict=True):
            indices = (*ellipsis[ellipsis_rank - rank :], *word.replace("...", ""))
            labels.append(indices)
            within = {}
            for label, size in zip(indices, array.shape, strict=True):
                require(
                    label not in within or within[label] == size,
                    "einsum repeated-label shape mismatch",
                )
                within[label] = size
                old = dimensions.get(label, 1)
                require(
                    old == size or old == 1 or size == 1, "einsum dimension mismatch"
                )
                dimensions[label] = max(old, size)
        require(
            re.fullmatch(r"(?:\.\.\.)?[a-z]*", right) is not None,
            "unsupported einsum output",
        )
        outputs = (
            (*ellipsis, *right.replace("...", "")) if "..." in right else tuple(right)
        )
        require(
            len(outputs) == len(set(outputs)) and all(x in dimensions for x in outputs),
            "invalid einsum output labels",
        )
        summed = tuple(x for x in dimensions if x not in outputs)
        output_shape = tuple(dimensions[x] for x in outputs)
        result = self.empty(output_shape)
        self.operations["einsum_calls"] += 1
        for output_index in self.np.ndindex(output_shape):
            slots = dict(zip(outputs, output_index, strict=True))
            total = F(0)
            for summation in itertools.product(*(range(dimensions[x]) for x in summed)):
                slots.update(zip(summed, summation, strict=True))
                product = F(1)
                for array, indices in zip(arrays, labels, strict=True):
                    index = tuple(
                        0 if size == 1 else slots[label]
                        for label, size in zip(indices, array.shape, strict=True)
                    )
                    product = product * array[index]
                total = total + product
                self.operations["einsum_products"] += 1
                if self.operations["einsum_products"] % 256 == 0:
                    self.check()
            result[output_index] = total
        self.check()
        return result

    def _matrices(self, value):
        array = self.asarray(value)
        require(
            array.ndim >= 2 and array.shape[-2:] == (3, 3),
            "exact 3-by-3 matrix primitive required",
        )
        return array

    def inverse(self, value):
        """Gauss-Jordan on exact jets; the independent replay uses cofactors."""
        array = self._matrices(value)
        answer = self.empty(array.shape)
        self.operations["inverse_calls"] += 1
        for prefix in self.np.ndindex(array.shape[:-2]):
            self.check()
            rows = [
                [self.scalar(array[prefix + (i, j)]) for j in range(3)]
                + [self.scalar(F(i == j)) for j in range(3)]
                for i in range(3)
            ]
            for column in range(3):
                pivot = next(
                    (i for i in range(column, 3) if rows[i][column].value), None
                )
                require(pivot is not None, "singular base inverse")
                rows[column], rows[pivot] = rows[pivot], rows[column]
                divisor = rows[column][column]
                rows[column] = [item / divisor for item in rows[column]]
                for row in range(3):
                    if row != column:
                        factor = rows[row][column]
                        rows[row] = [
                            x - factor * y
                            for x, y in zip(rows[row], rows[column], strict=True)
                        ]
            for i in range(3):
                for j in range(3):
                    answer[prefix + (i, j)] = rows[i][j + 3]
        return answer

    def determinant(self, value):
        """Elimination determinant, independent of replay's cofactor expansion."""
        array = self._matrices(value)
        answer = self.empty(array.shape[:-2])
        self.operations["determinant_calls"] += 1
        for prefix in self.np.ndindex(array.shape[:-2]):
            self.check()
            rows = [
                [self.scalar(array[prefix + (i, j)]) for j in range(3)]
                for i in range(3)
            ]
            total = self.scalar(F(1))
            for column in range(3):
                pivot = next(
                    (i for i in range(column, 3) if rows[i][column].value), None
                )
                require(
                    pivot is not None, "determinant primitive requires invertible base"
                )
                if pivot != column:
                    rows[column], rows[pivot] = rows[pivot], rows[column]
                    total = -total
                divisor = rows[column][column]
                total = total * divisor
                for row in range(column + 1, 3):
                    factor = rows[row][column] / divisor
                    rows[row] = [
                        x - factor * y
                        for x, y in zip(rows[row], rows[column], strict=True)
                    ]
            answer[prefix] = total
        return answer


def verify_source(raw, source_name):
    require(
        source_name in SOURCE_HASHES and type(raw) is bytes,
        "registered source bytes required",
    )
    require(
        hashlib.sha256(raw).hexdigest() == SOURCE_HASHES[source_name],
        f"source drift: {source_name}",
    )
    return ast.parse(raw.decode("utf-8"), filename=source_name)


def _definition(tree, name):
    matches = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name == name:
            matches.append(node)
        elif (
            isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.target.id == name
        ):
            matches.append(node)
        elif isinstance(node, ast.Assign) and any(
            isinstance(x, ast.Name) and x.id == name for x in node.targets
        ):
            matches.append(node)
    require(len(matches) == 1, f"unique source definition required: {name}")
    return matches[0]


class _Adapt(ast.NodeTransformer):
    def __init__(self, source, definition, text):
        self.source, self.definition, self.text = source, definition, text
        self.log = []

    def record(self, node, operation, replacement):
        self.log.append(
            {
                "source": self.source,
                "definition": self.definition,
                "line": node.lineno,
                "column": node.col_offset,
                "operation": operation,
                "original_ast": ast.dump(node, include_attributes=False),
                "replacement_ast": ast.dump(replacement, include_attributes=False),
            }
        )
        return ast.copy_location(replacement, node)

    def visit_Constant(self, node):
        if type(node.value) is float:
            lexical = ast.get_source_segment(self.text, node)
            require(
                lexical is not None
                and re.fullmatch(r"[0-9][0-9_.]*(?:[eE][+-]?[0-9_]+)?", lexical),
                "registered decimal real literal required",
            )
            replacement = ast.Call(
                ast.Name("F", ast.Load()), [ast.Constant(lexical.replace("_", ""))], []
            )
            return self.record(node, "decimal-token-to-exact-rational", replacement)
        return node

    def visit_Call(self, node):
        original = copy.deepcopy(node)
        node = self.generic_visit(node)
        if isinstance(node.func, ast.Name) and node.func.id == "float":
            node.func = ast.Name("_real", ast.Load())
            return self.record(
                original, "scalar-float-cast-to-exact-real-validation", node
            )
        if (
            self.definition == "state_from_slots"
            and isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "np"
            and node.func.attr == "exp"
        ):
            original_arg = ast.dump(original.args[0], include_attributes=False)
            alpha_arg = ast.dump(
                ast.parse("q[6]", mode="eval").body, include_attributes=False
            )
            chi_arg = ast.dump(
                ast.parse("2.*q[10]", mode="eval").body, include_attributes=False
            )
            require(
                original_arg in (alpha_arg, chi_arg), "unregistered exponential chart"
            )
            center = "_alpha_center" if original_arg == alpha_arg else "_chi_center"
            replacement = ast.Call(
                ast.Name("_chart_exp", ast.Load()),
                [node.args[0], ast.Name(center, ast.Load())],
                [],
            )
            return self.record(
                original, "centered-first-order-exponential-chart", replacement
            )
        return node

    def visit_Compare(self, node):
        original = copy.deepcopy(node)
        if self.definition == "state_from_slots" and ast.dump(
            node, include_attributes=False
        ) == ast.dump(
            ast.parse('raw.dtype.kind not in "fiu"', mode="eval").body,
            include_attributes=False,
        ):
            replacement = ast.UnaryOp(
                ast.Not(),
                ast.Call(
                    ast.Name("_valid_exact_array", ast.Load()),
                    [ast.Name("raw", ast.Load())],
                    [],
                ),
            )
            return self.record(
                original, "exact-object-input-replaces-binary64-kind-gate", replacement
            )
        if self.definition == "validate_tau_inverse" and ast.dump(
            node, include_attributes=False
        ) == ast.dump(
            ast.parse("type(value) not in (int, float)", mode="eval").body,
            include_attributes=False,
        ):
            replacement = ast.parse("type(value) not in (int, F)", mode="eval").body
            return self.record(
                original, "exact-real-domain-replaces-float-domain", replacement
            )
        return self.generic_visit(node)

    def visit_keyword(self, node):
        if self.definition == "state_from_slots" and node.arg == "source_state_sha256":
            replacement = ast.keyword(
                arg=node.arg, value=ast.Name("_jet_carrier_sha256", ast.Load())
            )
            return self.record(
                node,
                "formal-carrier-identity-replaces-object-memory-byte-hash",
                replacement,
            )
        return self.generic_visit(node)


def _program():
    texts, trees = {}, {}
    for name in SOURCE_HASHES:
        raw = (ROOT / name).read_bytes()
        trees[name] = verify_source(raw, name)
        texts[name] = raw.decode("utf-8")
    nodes, bindings, adaptations = [], [], []
    for source, names in COMPILED:
        for name in names:
            original = _definition(trees[source], name)
            changed = copy.deepcopy(original)
            # No mathematical body is removed. Unused convenience methods of
            # BSSNState3D are outside this one-cell continuum carrier contract.
            if name == "BSSNState3D":
                retained = []
                for member in changed.body:
                    if (
                        isinstance(member, ast.FunctionDef)
                        and member.name != "__post_init__"
                    ):
                        adaptations.append(
                            {
                                "source": source,
                                "definition": name,
                                "line": member.lineno,
                                "column": member.col_offset,
                                "operation": "omit-unused-grid-state-convenience-method",
                                "original_ast": ast.dump(
                                    member, include_attributes=False
                                ),
                                "replacement_ast": "not compiled",
                            }
                        )
                    else:
                        retained.append(member)
                changed.body = retained
            adapter = _Adapt(source, name, texts[source])
            changed = ast.fix_missing_locations(adapter.visit(changed))
            adaptations.extend(adapter.log)
            nodes.append(changed)
            bindings.append(
                {
                    "source": source,
                    "name": name,
                    "compiled": True,
                    "original_ast": ast.dump(original, include_attributes=False),
                    "adapted_ast": ast.dump(changed, include_attributes=False),
                }
            )
    for source, name in REFERENCE_ONLY:
        node = _definition(trees[source], name)
        bindings.append(
            {
                "source": source,
                "name": name,
                "compiled": False,
                "original_ast": ast.dump(node, include_attributes=False),
            }
        )
    counts = {}
    for row in adaptations:
        counts[row["operation"]] = counts.get(row["operation"], 0) + 1
    require(
        counts.get("centered-first-order-exponential-chart") == 2
        and counts.get("exact-object-input-replaces-binary64-kind-gate") == 1
        and counts.get("exact-real-domain-replaces-float-domain") == 1
        and counts.get("formal-carrier-identity-replaces-object-memory-byte-hash") == 1,
        "unexpected source adaptation coverage",
    )
    manifest = {
        "schema": "nr-case12-actual-volume-source-bridge-v1",
        "sources": dict(SOURCE_HASHES),
        "bindings": bindings,
        "adaptations": adaptations,
        "adaptation_counts": counts,
        "seed_count": 232,
        "state_seed_range": [0, 57],
        "gradient_seed_rule": "58+58*axis+slot",
        "interpretation": "exact decimal real formulas, first-order jets, not binary64 execution",
        "shared_with_independent_replay": [
            "source AST",
            "explicit adaptations",
            "object-array routing",
            "slot packing",
            "centered chart",
        ],
        "backend_mapping": {
            "np.float64 / dtype=float": "object storage retaining exact scalars; all original equation bodies retained",
            "np.einsum": "explicit named-index exact contraction including ellipsis and repeated labels",
            "np.linalg.inv": "production exact-jet Gauss-Jordan 3x3; replay independently supplied",
            "np.linalg.det": "production exact-jet elimination 3x3; replay independently supplied",
            "np.empty": "unwritten sentinel, never a silent zero",
            "np.allclose": "stronger exact jet equality; no tolerance acceptance",
            "np.isfinite / math.isfinite": "strict exact scalar validation; comparisons use open base domain",
            "np.errstate": "no floating execution; exact-domain exceptions remain",
            "SBPVolumeOperator": "one-cell formal carrier identity/shape validation; no SBP differentiation or SAT",
            "first_derivative": "state seeds map to spatial seeds; gradient taint rejects second derivatives",
            "RHS/auxiliary/BSSN constructors": "source dataclass fields and validation retained through exact array backend",
        },
        "physical_projection": False,
        "auxiliary_reconstruction": False,
        "actual_fp64_execution_validated": False,
    }
    return nodes, manifest


def source_manifest():
    return _program()[1]


source_bridge_manifest = source_manifest


def _json_parameters(value):
    if type(value) is F:
        return str(value)
    if type(value) in (str, bool, int) or value is None:
        return value
    if type(value) in (tuple, list):
        return [_json_parameters(x) for x in value]
    if type(value) is dict:
        return {key: _json_parameters(item) for key, item in value.items()}
    raise ValueError("unregistered parameter encoding")


def _finite_scalar(value):
    if type(value) in (F, int):
        return True
    raise ValueError("exact scalar finite check refuses float/bool")


def _compile(backend, guard):
    nodes, manifest = _program()
    guard()

    class ContinuumOperator:
        identity = {"schema": "one-cell-exact-continuum-carrier", "no_sbp": True}

        def __init__(self, grid):
            require(
                tuple(grid.shape) == (1, 1, 1) and grid.spatial_order == 4,
                "registered formal grid",
            )
            self.grid = grid

        def validate_state(self, state):
            require(state.base.grid is self.grid, "formal state/grid identity")
            require(tuple(state.base.h.shape) == (1, 1, 1, 3, 3), "formal metric shape")

    def valid_array(value):
        return all(
            isinstance(x, backend.scalar_type) or type(x) in (F, int)
            for x in value.flat
        )

    def unused_derivative(*args, **kwargs):
        raise ValueError("explicit formal derivative callback required")

    namespace = {
        "__name__": __name__,
        "F": F,
        "np": backend,
        "math": SimpleNamespace(isfinite=_finite_scalar),
        "dataclass": dataclass,
        "field": field,
        "asdict": asdict,
        "_real": _rational,
        "_valid_exact_array": valid_array,
        "_d1": unused_derivative,
        "SBPVolumeOperator": ContinuumOperator,
        "_chart_exp": backend.chart_exp,
        "_jet_carrier_sha256": hashlib.sha256(
            b"exact-centered-232-seed-carrier-not-fp64-state-bytes"
        ).hexdigest(),
    }
    module = ast.fix_missing_locations(ast.Module(body=nodes, type_ignores=[]))
    exec(
        compile(
            module,
            "<source-bound-actual-volume>",
            "exec",
            flags=__future__.annotations.compiler_flag,
        ),
        namespace,
    )
    return namespace, manifest


def evaluate_with_backend(
    backend,
    *,
    kappa1=F(1, 10),
    ordering_scale=F(1, 5),
    guard=lambda: None,
    check=None,
    checkpoint=None,
):
    """Shared AST routing; supplied arithmetic is identified, never self-qualified.

    Production uses evaluate_case, which supplies a fresh SparseJet backend.
    The independent replay uses its own arithmetic and inverse/determinant.
    """
    require(
        type(kappa1) is F and type(ordering_scale) is F,
        "explicit Fraction parameter values required",
    )
    require(
        (kappa1, ordering_scale)
        in ((F(1, 10), F(1, 5)), (F(1, 5), F(1, 5)), (F(1, 10), F(2, 5))),
        "only baseline and two separately registered mutations",
    )
    require(isinstance(backend, ExactArrayBackend), "registered array routing required")
    require(
        callable(guard)
        and (check is None or callable(check))
        and (checkpoint is None or callable(checkpoint)),
        "callbacks must be callable",
    )
    deadline = backend.check if check is None else check

    def stage(name, record):
        guard()
        deadline()
        if checkpoint is not None:
            checkpoint(name, record)
        guard()

    namespace, manifest = _compile(backend, guard)
    stage("source_bridge", manifest)
    background = namespace["case12"]()
    namespace["_alpha_center"] = background.alpha
    namespace["_chi_center"] = background.chi
    require(
        len(namespace["FOCCZ4_VARIABLE_ORDER"]) == 58, "complete canonical state order"
    )
    values = [F(0)] * 58
    pairs = namespace["SYMMETRIC"]
    for slot, (i, j) in enumerate(pairs):
        values[slot] = background.metric[i][j]
    values[7:10] = background.shift
    slots = backend.empty((58, 1, 1, 1))
    for slot in range(58):
        deadline()
        slots[slot, 0, 0, 0] = backend.scalar_type(values[slot], {slot: F(1)})
    grid = SimpleNamespace(shape=(1, 1, 1), spatial_order=4)
    state = namespace["state_from_slots"](grid, slots)
    config = replace(namespace["CONFIG"], kappa1=kappa1)
    profile = replace(namespace["PROFILE"], ordering_scale=ordering_scale)
    gauge = namespace["GAUGE"]
    parameters = {
        "schema": "nr-case12-actual-volume-parameters-v1",
        "gauge": _json_parameters(asdict(gauge)),
        "config": _json_parameters(asdict(config)),
        "profile": _json_parameters(asdict(profile)),
        "background": {
            "alpha": str(background.alpha),
            "chi": str(background.chi),
            "metric": _json_parameters(background.metric),
            "shift": _json_parameters(background.shift),
        },
        "state_order": list(namespace["FOCCZ4_VARIABLE_ORDER"]),
        "independent_state_seeds": 58,
        "independent_gradient_seeds": 174,
    }
    alpha_jet = backend.scalar(state.base.lapse[0, 0, 0])
    chi_jet = backend.scalar(state.base.chi[0, 0, 0])
    require(
        alpha_jet.value == background.alpha
        and dict(alpha_jet.coefficients) == {6: background.alpha},
        "complete lapse chart chain rule",
    )
    require(
        chi_jet.value == background.chi
        and dict(chi_jet.coefficients) == {10: 2 * background.chi},
        "complete chi chart chain rule",
    )
    chart_controls = []
    for name, slot, correct, argument, wrong_center in (
        ("omit-alpha-center", 6, alpha_jet, slots[6], F(1)),
        ("omit-chi-center", 10, chi_jet, 2 * slots[10], F(1)),
        ("omit-chi-factor-two", 10, chi_jet, slots[10], background.chi),
    ):
        deadline()
        wrong = backend.scalar(backend.chart_exp(argument, wrong_center)[0, 0, 0])
        correct_coefficient = correct.coefficients.get(slot, F(0))
        wrong_coefficient = wrong.coefficients.get(slot, F(0))
        gap = correct_coefficient - wrong_coefficient
        chart_controls.append(
            {
                "name": name,
                "slot": slot,
                "actual_correct_coefficient": str(correct_coefficient),
                "actual_wrong_coefficient": str(wrong_coefficient),
                "actual_gap": str(gap),
                "rejected": gap != 0,
            }
        )
    chart = {
        "schema": "nr-case12-actual-volume-chart-v1",
        "centered_log_slots": [6, 10],
        "alpha": {
            "value": str(alpha_jet.value),
            "coefficients": [
                [i, str(x)] for i, x in sorted(alpha_jet.coefficients.items())
            ],
        },
        "chi": {
            "value": str(chi_jet.value),
            "coefficients": [
                [i, str(x)] for i, x in sorted(chi_jet.coefficients.items())
            ],
        },
        "metric_symmetric_pairs": [list(pair) for pair in pairs],
        "auxiliary_fields_independent": True,
        "determinant_or_trace_projection": False,
        "finite_amplitude_exponential_replaced": False,
        "actual_float_log_or_exp_evaluated": False,
        "chain_rule_negative_controls": chart_controls,
        "chain_rule_controls_are_case12_rhs_counterexamples": False,
    }
    stage("parameters", parameters)
    stage("chart", chart)
    # Both the geometry and the outer equation functions execute their original
    # complete bodies. The derivative is local to this invocation.
    rhs = namespace["_fo_ccz4_volume_rhs_3d"](
        state,
        gauge=gauge,
        config=config,
        gauge_profile=profile,
        first_derivative=backend.derivative,
    )
    stage("volume_evaluated", {"outputs": 58, "seeds": 232})
    packed = namespace["_rhs_components"](rhs)
    require(len(packed) == 58, "all output fields required")
    jets = []
    for array in packed:
        deadline()
        require(array.shape == (1, 1, 1), "one exact scalar per output slot")
        value = backend.scalar(array[0, 0, 0])
        require(
            type(value.value) is F
            and all(
                type(i) is int and 0 <= i < 232 and type(x) is F and x
                for i, x in value.coefficients.items()
            ),
            "exact full first-variation output",
        )
        jets.append(value)
    matrices = {"F0": [[value.value] for value in jets]}
    for name, offset in (("J", 0), ("Ax", 58), ("Ay", 116), ("Az", 174)):
        guard()
        matrices[name] = [
            [value.coefficients.get(offset + column, F(0)) for column in range(58)]
            for value in jets
        ]
    stage(
        "coefficients_extracted",
        {"slots": 13514, "state_columns": 58, "spatial_columns": 174},
    )
    return {
        "jets": tuple(jets),
        **matrices,
        "parameters": parameters,
        "chart": chart,
        "source_bridge": manifest,
        "operations": dict(backend.operations),
    }


def evaluate_case(
    *,
    kappa1=F(1, 10),
    ordering_scale=F(1, 5),
    guard=lambda: None,
    check=None,
    checkpoint=None,
):
    require(
        callable(guard) and (check is None or callable(check)),
        "guard/deadline callbacks required",
    )
    deadline = guard if check is None else check
    guard()
    backend = ExactArrayBackend(check=deadline)
    return evaluate_with_backend(
        backend,
        kappa1=kappa1,
        ordering_scale=ordering_scale,
        guard=guard,
        check=deadline,
        checkpoint=checkpoint,
    )

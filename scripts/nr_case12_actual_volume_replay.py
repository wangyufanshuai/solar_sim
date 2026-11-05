"""Independent reverse graph arithmetic for the actual volume RHS replay.

The registered RHS AST, chart, packing and object-array routing are shared with
the forward-jet execution. Scalar derivatives and 3x3 matrix inversion are
independent: a reverse graph and an adjugate/cofactor formula are used here.
Importing this module evaluates no scientific candidate and imports no NumPy.
"""

from fractions import Fraction as F
import hashlib
from pathlib import Path
from types import MappingProxyType


SEEDS = 232
STATE_SIZE = 58


def exact(value):
    if type(value) not in (int, F):
        raise ValueError("exact Fraction or integer scalar required")
    return F(value)


class ReplayTape:
    """One immutable scalar graph with exact reverse accumulation."""

    def __init__(self, check=lambda: None):
        if not callable(check):
            raise ValueError("deadline callback required")
        self.check = check
        self.nodes = []
        self.inputs = {}
        self.reverse_sweeps = 0
        self.edge_visits = 0
        self.scalar_type = type("BoundReplayNode", (ReplayNode,), {"_tape": self})

    def register(self, node, value, parents, mask, taint, seed_index=None):
        if len(self.nodes) % 128 == 0:
            self.check()
        node.value = exact(value)
        node.parents = tuple(parents)
        node.state_mask = mask
        node.gradient_taint = bool(taint)
        node.seed_index = seed_index
        node.index = len(self.nodes)
        node._coefficients = None
        self.nodes.append(node)
        return node

    def leaf(self, index):
        if type(index) is not int or not 0 <= index < SEEDS:
            raise ValueError("registered seed index required")
        if index not in self.inputs:
            node = object.__new__(self.scalar_type)
            self.inputs[index] = self.register(
                node,
                F(0),
                (),
                1 << index if index < STATE_SIZE else 0,
                index >= STATE_SIZE,
                index,
            )
        return self.inputs[index]

    def operation(self, value, edges, *, mask=None, taint=None):
        combined = {}
        inherited_mask, inherited_taint = 0, False
        for parent, weight in edges:
            if type(parent) is not self.scalar_type:
                raise ValueError("reverse operands must belong to one tape")
            inherited_mask |= parent.state_mask
            inherited_taint |= parent.gradient_taint
            weight = exact(weight)
            if weight:
                combined[parent.index] = combined.get(parent.index, F(0)) + weight
        parents = tuple(
            (self.nodes[index], weight) for index, weight in combined.items() if weight
        )
        node = object.__new__(self.scalar_type)
        return self.register(
            node,
            value,
            parents,
            inherited_mask if mask is None else inherited_mask | mask,
            inherited_taint if taint is None else inherited_taint or taint,
        )

    def reverse(self, output):
        if type(output) is not self.scalar_type:
            raise ValueError("reverse output must belong to this tape")
        self.check()
        if output._coefficients is not None:
            return output._coefficients
        self.reverse_sweeps += 1
        ancestors, pending = set(), [output.index]
        visits = 0
        while pending:
            index = pending.pop()
            if index in ancestors:
                continue
            ancestors.add(index)
            pending.extend(parent.index for parent, _ in self.nodes[index].parents)
            visits += 1
            if visits % 256 == 0:
                self.check()
        adjoints, result = {output.index: F(1)}, {}
        for index in sorted(ancestors, reverse=True):
            node = self.nodes[index]
            weight = adjoints.pop(index, F(0))
            if weight:
                if node.seed_index is not None:
                    result[node.seed_index] = result.get(node.seed_index, F(0)) + weight
                for parent, local in node.parents:
                    adjoints[parent.index] = (
                        adjoints.get(parent.index, F(0)) + weight * local
                    )
                    self.edge_visits += 1
                    if self.edge_visits % 256 == 0:
                        self.check()
            visits += 1
            if visits % 256 == 0:
                self.check()
        self.check()
        output._coefficients = MappingProxyType(
            {key: value for key, value in result.items() if value}
        )
        return output._coefficients


class ReplayNode:
    """Exact scalar whose derivatives are computed by reverse accumulation."""

    _tape = None

    def __init__(self, value=F(0), coefficients=None, *, gradient_taint=False):
        tape = type(self)._tape
        if tape is None:
            raise ValueError("construct a scalar through ReplayTape.scalar_type")
        value = exact(value)
        if coefficients is None:
            coefficients = {}
        if type(coefficients) is not dict or type(gradient_taint) is not bool:
            raise ValueError("exact seed coefficient mapping required")
        parents, mask, taint = [], 0, gradient_taint
        for index, coefficient in coefficients.items():
            leaf = tape.leaf(index)
            if type(coefficient) is not F or not coefficient:
                raise ValueError("nonzero Fraction coefficient required")
            mask |= leaf.state_mask
            taint |= leaf.gradient_taint
            if coefficient:
                parents.append((leaf, coefficient))
        tape.register(self, value, parents, mask, taint)

    @classmethod
    def seed(cls, index, value=F(1)):
        if type(index) is not int or not 0 <= index < SEEDS:
            raise ValueError("registered seed index required")
        value = exact(value)
        return cls(
            F(0), {index: value} if value else {}, gradient_taint=index >= STATE_SIZE
        )

    @property
    def coefficients(self):
        return type(self)._tape.reverse(self)

    def _other(self, other):
        if type(other) is type(self):
            return other
        if isinstance(other, ReplayNode):
            raise ValueError("cross-tape scalar arithmetic is forbidden")
        if hasattr(other, "shape"):
            return NotImplemented
        return type(self)(exact(other))

    def __add__(self, other):
        other = self._other(other)
        if other is NotImplemented:
            return NotImplemented
        return self._tape.operation(
            self.value + other.value, ((self, F(1)), (other, F(1)))
        )

    __radd__ = __add__

    def __neg__(self):
        return self._tape.operation(-self.value, ((self, F(-1)),))

    def __sub__(self, other):
        other = self._other(other)
        if other is NotImplemented:
            return NotImplemented
        return self._tape.operation(
            self.value - other.value, ((self, F(1)), (other, F(-1)))
        )

    def __rsub__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else other - self

    def __mul__(self, other):
        other = self._other(other)
        if other is NotImplemented:
            return NotImplemented
        return self._tape.operation(
            self.value * other.value, ((self, other.value), (other, self.value))
        )

    __rmul__ = __mul__

    def __truediv__(self, other):
        other = self._other(other)
        if other is NotImplemented:
            return NotImplemented
        if not other.value:
            raise ValueError("nonzero exact scalar denominator required")
        inverse = F(1) / other.value
        return self._tape.operation(
            self.value * inverse, ((self, inverse), (other, -self.value * inverse**2))
        )

    def __rtruediv__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else other / self

    def __pow__(self, exponent):
        if type(exponent) is not int:
            raise ValueError("integer scalar power required")
        if exponent < 0 and not self.value:
            raise ValueError("negative power requires nonzero scalar")
        derivative = F(0) if exponent == 0 else exponent * self.value ** (exponent - 1)
        return self._tape.operation(self.value**exponent, ((self, derivative),))

    def __abs__(self):
        if not self.value and (self.state_mask or self.gradient_taint):
            raise ValueError("absolute value at a seeded zero is not differentiable")
        return -self if self.value < 0 else self

    def __bool__(self):
        return bool(self.value or self.coefficients)

    def __float__(self):
        raise ValueError("binary floating conversion would discard exact derivatives")

    def __eq__(self, other):
        other = self._other(other)
        return (
            NotImplemented
            if other is NotImplemented
            else self.value == other.value and self.coefficients == other.coefficients
        )

    def __lt__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else self.value < other.value

    def __le__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else self.value <= other.value

    def __gt__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else self.value > other.value

    def __ge__(self, other):
        other = self._other(other)
        return NotImplemented if other is NotImplemented else self.value >= other.value

    def gradient(self, axis):
        if type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("registered spatial axis required")
        self._tape.check()
        if self.gradient_taint:
            raise ValueError("second spatial derivative request is not registered")
        edges = []
        for index, value in self.coefficients.items():
            if index >= STATE_SIZE:
                raise ValueError("second spatial derivative request is not registered")
            edges.append((self._tape.leaf(STATE_SIZE * (axis + 1) + index), value))
        return self._tape.operation(F(0), edges, taint=bool(self.state_mask))


def make_backend(*, check=lambda: None):
    """Use shared array routing, with independent scalar and inverse algorithms."""
    import nr_case12_actual_volume_jet as producer

    tape = ReplayTape(check)

    class ReplayBackend(producer.ExactArrayBackend):
        def determinant(self, matrix):
            array = self.asarray(matrix)
            if array.ndim < 2 or array.shape[-2:] != (3, 3):
                raise ValueError("registered 3x3 determinant required")
            result = self.np.empty(array.shape[:-2], dtype=object)
            self.operations["determinant_calls"] += 1
            for index in self.np.ndindex(array.shape[:-2]):
                check()
                a = [
                    [self.scalar(array[index + (i, j)]) for j in range(3)]
                    for i in range(3)
                ]
                result[index] = (
                    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
                    - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
                    + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
                )
            return result

        def inverse(self, matrix):
            array = self.asarray(matrix)
            if array.ndim < 2 or array.shape[-2:] != (3, 3):
                raise ValueError("registered 3x3 inverse required")
            result = self.np.empty(array.shape, dtype=object)
            self.operations["inverse_calls"] += 1
            determinants = self.determinant(array)
            for index in self.np.ndindex(array.shape[:-2]):
                check()
                a = [
                    [self.scalar(array[index + (i, j)]) for j in range(3)]
                    for i in range(3)
                ]
                denominator = determinants[index]
                if denominator.value == 0:
                    raise ValueError("nonsingular exact 3x3 inverse required")
                for i in range(3):
                    for j in range(3):
                        rows = [k for k in range(3) if k != j]
                        columns = [k for k in range(3) if k != i]
                        minor = (
                            a[rows[0]][columns[0]] * a[rows[1]][columns[1]]
                            - a[rows[0]][columns[1]] * a[rows[1]][columns[0]]
                        )
                        result[index + (i, j)] = ((-1) ** (i + j) * minor) / denominator
            return result

    backend = ReplayBackend(scalar_type=tape.scalar_type, check=check)
    backend.replay_tape = tape
    return backend


def evaluate_case(
    *,
    kappa1=F(1, 10),
    ordering_scale=F(1, 5),
    guard=lambda: None,
    check=None,
    checkpoint=None,
):
    import nr_case12_actual_volume_jet as producer

    if not callable(guard) or (check is not None and not callable(check)):
        raise ValueError("registered budget callbacks required")
    check = guard if check is None else check
    backend = make_backend(check=check)
    result = producer.evaluate_with_backend(
        backend,
        kappa1=kappa1,
        ordering_scale=ordering_scale,
        guard=guard,
        check=check,
        checkpoint=checkpoint,
    )
    result["independent_backend"] = dict(
        method="exact reverse scalar graph",
        nodes=len(backend.replay_tape.nodes),
        reverse_sweeps=backend.replay_tape.reverse_sweeps,
        edge_visits=backend.replay_tape.edge_visits,
    )
    return result


def replay_manifest():
    """Pure byte provenance; no backend or scientific evaluation is performed."""
    root = Path(__file__).resolve().parent
    names = ("nr_case12_actual_volume_replay.py", "nr_case12_actual_volume_jet.py")
    return dict(
        schema="nr-case12-actual-volume-independent-arithmetic-v1",
        source_hashes={
            "scripts/" + name: hashlib.sha256((root / name).read_bytes()).hexdigest()
            for name in names
        },
        derivative_method="reverse topological scalar graph with exact Fraction adjoints",
        inverse_method="independent 3x3 adjugate/cofactor divided by explicit determinant",
        shared_trusted_base=[
            "registered source AST and adapters",
            "NumPy object-array routing and contractions",
            "centered chart, state packing and output packing",
        ],
        independent_physical_source=False,
        sparse_forward_coefficients_reused=False,
        saved_jacobians_used_to_generate_replay=False,
        source_executed_by_manifest=False,
    )
